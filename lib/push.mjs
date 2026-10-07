// 관심 작가 전시 알림 (웹 푸시). 사이트에서 '알림 받기'를 허용한 브라우저에 보내요.
// 필요한 환경변수: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (서버 전용 — 비공개 키는 브라우저에 절대 넣지 않아요)
// 구독 정보(push_subs)는 관리자 토큰 또는 service_role 키로만 읽을 수 있어요.
import webpush from "web-push";
import crypto from "node:crypto";

const SB_URL = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
/* 비공개 키에서 공개 키를 다시 계산해 짝이 맞는지 확인해요 (키 값은 밖으로 내보내지 않아요) */
export function vapidCheck() {
  const pub = process.env.VAPID_PUBLIC_KEY || "", priv = process.env.VAPID_PRIVATE_KEY || "";
  if (!pub || !priv) return { ready: false, publicKey: !!pub, privateKey: !!priv, match: false };
  try { const ec = crypto.createECDH("prime256v1"); ec.setPrivateKey(Buffer.from(priv, "base64url"));
    return { ready: true, publicKey: true, privateKey: true, match: ec.getPublicKey("base64url") === pub, publicKeyLength: pub.length }; }
  catch { return { ready: true, publicKey: true, privateKey: true, match: false, error: "비공개 키 형식이 올바르지 않아요" }; }
}
export const pushReady = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

function rest(auth) {
  const h = { apikey: auth.apikey, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" };
  return async (path, opt = {}) => {
    const r = await fetch(`${SB_URL()}/rest/v1/${path}`, { ...opt, headers: { ...h, ...(opt.headers || {}) } });
    const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 200)}`);
    return t ? JSON.parse(t) : null;
  };
}

/* 한국 시간 기준 날짜 (YYYY-MM-DD) */
const kstDate = (plusDays = 0) => new Date(Date.now() + 9 * 3600e3 + plusDays * 864e5).toISOString().slice(0, 10);
const md = d => `${+d.slice(5, 7)}월 ${+d.slice(8, 10)}일`;

/* 알림 문구: new(새 전시 등록) · open-1(내일 개막) · end-3(마감 3일 전) */
function message(kind, ex, names, venue) {
  const who = names.join(", ");
  const where = venue ? ` · ${venue}` : "";
  if (kind === "open-1") return { title: `내일 개막 — ${who}`, body: `「${ex.title}」 ${md(ex.start_date)}부터${where}` };
  if (kind === "end-3") return { title: `마감 3일 전 — ${who}`, body: `「${ex.title}」 ${md(ex.end_date)}까지${where}` };
  return { title: `관심 작가 ${who}의 새 전시`, body: `「${ex.title}」 ${md(ex.start_date)} – ${md(ex.end_date)}${where}` };
}

/* 전시 하나에 대해, 그 전시 작가를 관심 작가로 둔 구독자에게 보내요. 같은 전시·같은 종류는 한 번만 보내요. */
export async function sendExhibitionPush(auth, exhibitionId, kind = "new", { force = false } = {}) {
  if (!pushReady()) return { ok: false, error: "VAPID 키가 없어서 알림을 보낼 수 없어요 (Vercel 환경변수 VAPID_PUBLIC_KEY · VAPID_PRIVATE_KEY)" };
  if (!SB_URL() || !auth?.apikey) return { ok: false, error: "Supabase 가 연결되지 않았어요" };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://www.arttan.co.kr", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const db = rest(auth);
  const [ex] = await db(`exhibitions?select=id,title,start_date,end_date,artists,gallery_id&id=eq.${encodeURIComponent(exhibitionId)}`);
  if (!ex) return { ok: false, error: "전시를 찾지 못했어요" };
  if (ex.end_date < kstDate()) return { ok: true, sent: 0, skipped: "이미 끝난 전시예요" };
  const ids = (ex.artists || []).filter(x => /^[a-z0-9_-]{1,40}$/.test(x));
  if (!ids.length) return { ok: true, sent: 0, skipped: "arttan에 등록된 작가가 없는 전시예요" };
  if (!force) {
    const done = await db(`push_log?select=id&exhibition_id=eq.${encodeURIComponent(ex.id)}&kind=eq.${encodeURIComponent(kind)}`);
    if (done.length) return { ok: true, sent: 0, skipped: "이미 보낸 알림이에요" };
  }
  const artists = await db(`artists?select=id,name,hidden&id=in.(${ids.join(",")})`);
  const shown = artists.filter(a => !a.hidden);
  if (!shown.length) return { ok: true, sent: 0, skipped: "비공개 작가의 전시예요" };
  const [g] = ex.gallery_id ? await db(`galleries?select=name&id=eq.${encodeURIComponent(ex.gallery_id)}`) : [];
  const subs = await db(`push_subs?select=endpoint,p256dh,auth,artists&artists=ov.{${shown.map(a => a.id).join(",")}}`);
  let sent = 0, failed = 0;
  for (const s of subs) {
    const names = shown.filter(a => s.artists.includes(a.id)).map(a => a.name);
    const m = message(kind, ex, names, g?.name);
    const payload = JSON.stringify({ ...m, url: `/exhibition/${encodeURIComponent(ex.id)}`, tag: `ex-${ex.id}-${kind}` });
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "normal" }); sent++; }
    catch (err) {
      failed++;
      /* 알림을 끈 브라우저(404·410)는 목록에서 지워요 */
      if (err.statusCode === 404 || err.statusCode === 410) await db(`push_subs?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: "DELETE" }).catch(() => {});
      else console.warn("푸시 실패", err.statusCode, String(err.body || err.message).slice(0, 120));
    }
  }
  await db("push_log?on_conflict=exhibition_id,kind", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ exhibition_id: ex.id, kind, sent, failed }) }).catch(e => console.warn("push_log 기록 실패", e.message));
  return { ok: true, sent, failed, subscribers: subs.length };
}

/* 매일 아침: 내일 개막하는 전시, 3일 뒤 끝나는 전시 */
export async function sendReminders(auth) {
  if (!pushReady() || !auth) return { ok: false, skipped: "VAPID 키 또는 service_role 키가 없어요" };
  const db = rest(auth);
  const out = [];
  const open = await db(`exhibitions?select=id&start_date=eq.${kstDate(1)}`);
  for (const e of open) out.push({ id: e.id, kind: "open-1", ...(await sendExhibitionPush(auth, e.id, "open-1")) });
  const end = await db(`exhibitions?select=id&end_date=eq.${kstDate(3)}`);
  for (const e of end) out.push({ id: e.id, kind: "end-3", ...(await sendExhibitionPush(auth, e.id, "end-3")) });
  return { ok: true, reminders: out };
}

/* 관리자 토큰이 진짜 관리자인지 확인 */
export async function isAdminToken(token) {
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!token || !SB_URL() || !anon) return false;
  const r = await fetch(`${SB_URL()}/rest/v1/rpc/is_admin`, { method: "POST", headers: { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" });
  return r.ok && (await r.json()) === true;
}
