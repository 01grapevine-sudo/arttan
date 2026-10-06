// 등록된 전시장들을 돌며 전시를 모아 '수집한 전시'(crawled_exhibitions)에 쌓아요. 이미 있는 건 건너뛰어요.
// 관리자 버튼(관리자 로그인 토큰) 또는 매일 아침 자동 실행(Vercel Cron, service_role 키)으로 돌아요.
import { crawlVenue, itemHash } from "./crawl.mjs";
import { sendTelegram, tgEsc } from "./notify.mjs";

const SB_URL = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = () => process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function rest(auth) {
  const h = { apikey: auth.apikey, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
  return async (path, opt = {}) => {
    const r = await fetch(`${SB_URL()}/rest/v1/${path}`, { ...opt, headers: { ...h, ...(opt.headers || {}) } });
    const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    return t ? JSON.parse(t) : null;
  };
}
/* 관리자 토큰으로 실행 (RLS: 관리자만 쓰기) / 자동 실행은 service_role 키 */
export const userAuth = token => ({ apikey: ANON(), token });
export const serviceAuth = () => process.env.SUPABASE_SERVICE_ROLE_KEY ? { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, token: process.env.SUPABASE_SERVICE_ROLE_KEY } : null;

export async function runCrawl(auth, { galleryId = null, notify = false } = {}) {
  if (!SB_URL() || !auth?.apikey) return { ok: false, error: "Supabase 가 연결되지 않았어요" };
  const db = rest(auth);
  const filter = galleryId ? `&id=eq.${encodeURIComponent(galleryId)}` : "&crawl_on=eq.true";
  const venues = await db(`galleries?select=id,name,crawl_url&crawl_url=not.is.null${filter}`);
  const report = [];
  for (const g of venues) {
    const r = await crawlVenue(g.crawl_url);
    let added = 0;
    if (r.ok && r.items.length) {
      const rows = r.items.map(it => ({ gallery_id: g.id, hash: itemHash(g.id, it), title: it.title, context: it.context || null, start_date: it.start, end_date: it.end, source_url: it.link, image_url: it.image }));
      const ins = await db("crawled_exhibitions?on_conflict=hash", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=representation" }, body: JSON.stringify(rows) });
      added = (ins || []).length;
    }
    await db(`galleries?id=eq.${encodeURIComponent(g.id)}`, { method: "PATCH", body: JSON.stringify({ last_crawled_at: new Date().toISOString(), last_crawl_note: r.ok ? `${r.items.length}건 확인 · 새로 ${added}건${r.warn ? " · " + r.warn : ""}` : r.error }) });
    report.push({ id: g.id, name: g.name, ok: r.ok, found: r.ok ? r.items.length : 0, added, error: r.error || null, warn: r.warn || null });
  }
  const total = report.reduce((n, x) => n + x.added, 0), bad = report.filter(x => !x.ok);
  if (notify && (total || bad.length)) {
    await sendTelegram(`<b>[arttan] 전시 자동 수집</b>\n\n새로 모은 전시 ${total}건 — 관리자 '수집한 전시'에서 게시 여부를 정해 주세요.\n` +
      report.filter(x => x.added).map(x => `· ${tgEsc(x.name)}: ${x.added}건`).join("\n") +
      (bad.length ? `\n\n수집 실패\n` + bad.map(x => `· ${tgEsc(x.name)}: ${tgEsc(x.error)}`).join("\n") : "") + `\n\nhttps://www.arttan.co.kr/admin`);
  }
  return { ok: true, total, report };
}
