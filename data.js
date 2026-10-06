/* arttan 데이터 연결
   - config.js 에 Supabase 주소·키가 있으면: Supabase에서 데이터를 읽고, 관리자 화면은 DB에 저장해요.
   - 없으면: artists/*.js 의 예시 데이터로 떠요 (관리자 변경은 이 브라우저에만 저장). */
window.ARTTAN_DB = null;   // Supabase 클라이언트
window.ARTTAN_SB = false;  // Supabase에서 데이터를 읽었는지

function sbConfigured() {
  const c = window.ARTTAN_CONFIG || {};
  return !!(c.supabaseUrl && c.supabaseAnonKey && window.supabase && window.supabase.createClient);
}
function sbClient() {
  if (!window.ARTTAN_DB && sbConfigured()) {
    const c = window.ARTTAN_CONFIG;
    window.ARTTAN_DB = window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
  }
  return window.ARTTAN_DB;
}
/* Storage 경로 → 이미지 주소 (사이트에 함께 올린 파일은 그대로) */
function workImageUrl(p) {
  if (!p) return null;
  if (/^(https?:)?\/\//.test(p) || p.startsWith("artists/") || p.startsWith("data:")) return p;
  return `${window.ARTTAN_CONFIG.supabaseUrl}/storage/v1/object/public/works/${p}`;
}
const FALLBACK_PAL = ["#EEEAF6", "#3B2A6B", "#8B7BB8", "#D9CFEF", "#1E1636"];

async function loadFromSupabase() {
  const sb = sbClient(); if (!sb) return false;
  const get = (t, order) => { let r = sb.from(t).select("*"); if (order) r = r.order(order[0], { ascending: order[1] !== false }); return r; };
  const res = await Promise.all([
    get("artists", ["sort"]), get("works", ["sort"]), get("interviews", ["date", false]), get("videos"), get("books", ["year", false]),
    get("galleries", ["sort"]), get("exhibitions", ["start_date"]), get("notices", ["created_at", false])
  ]);
  const bad = res.find(r => r.error);
  if (bad) { console.warn("Supabase 읽기 실패 — 예시 데이터로 보여요:", bad.error.message); return false; }
  const [ar, wk, iv, vd, bk, gl, ex, nt] = res.map(r => r.data || []);

  /* 예시 데이터를 비우고 DB 데이터로 다시 채워요 */
  ARTISTS.length = 0; Object.keys(byId).forEach(k => delete byId[k]);
  INTERVIEWS.length = 0; Object.keys(VIDEOS).forEach(k => delete VIDEOS[k]); BOOKS.length = 0;
  ar.forEach(r => {
    const w = wk.filter(x => x.artist_id === r.id);
    const imgs = w.map(x => workImageUrl(x.image_path));
    const v = vd.find(x => x.artist_id === r.id);
    registerArtist({
      id: r.id, name: r.name, en: r.en || undefined, tier: r.tier, genre: r.genre, more: r.more || [], tags: r.tags || [],
      born: r.born, from: r.birthplace || undefined, city: r.city || "", quote: r.quote || "", line: r.line || "", bio: r.bio || "",
      cv: r.cv || [], history: (r.history && r.history.length) ? r.history : undefined, collections: r.collections || undefined,
      pubs: (r.pubs && r.pubs.length) ? r.pubs : undefined, source: r.source || undefined,
      sources: (r.sources && r.sources.length) ? r.sources : undefined, portraits: (r.portraits && r.portraits.length) ? r.portraits : undefined, aka: (r.aka && r.aka.length) ? r.aka : undefined, portraitFocus: (r.portrait_focus && r.portrait_focus.length === 2) ? r.portrait_focus : undefined, worksTotal: r.works_total || undefined,
      style: r.style || "lines", pal: (r.pal && r.pal.length >= 5) ? r.pal : FALLBACK_PAL, real: r.is_real, hidden: r.hidden,
      works: w.map(x => { const row = [x.title, x.year || "", x.material || "", x.size || ""]; if (x.description) row.push(x.description); return row; }),
      photos: (imgs.length && imgs.every(Boolean)) ? imgs : undefined,
      interviews: iv.filter(x => x.artist_id === r.id).map(x => ({ id: x.id, title: x.title, date: x.date || "", lead: x.lead || "", qa: x.qa || [] })),
      video: v ? { title: v.title, len: v.len, date: v.date, place: v.place, url: v.url } : null,
      books: bk.filter(x => x.artist_id === r.id).map(x => ({ id: x.slug || String(x.id), kind: x.kind || "도록", title: x.title, year: x.year, pages: x.pages, size: x.size || "",
        writer: x.writer || "", publisher: x.publisher || "", isbn: x.isbn || "", desc: x.description || "", cover: x.cover_path ? workImageUrl(x.cover_path) : undefined, coverPath: x.cover_path || null, spreadPaths: x.spreads || [], dbId: x.id,
        spreads: (x.spreads || []).map(workImageUrl), full: !!x.full_view, works: x.work_refs || [], exhibition: x.exhibition_id || undefined, toc: x.toc || [], links: x.links || [] }))
    });
  });
  GALLERIES.length = 0; Object.keys(galById).forEach(k => delete galById[k]);
  gl.forEach(g => { const o = { id: g.id, name: g.name, area: g.area || "", addr: g.addr, hours: g.hours, tel: g.tel, site: g.site, intro: g.intro }; GALLERIES.push(o); galById[o.id] = o; });
  EXHIBITIONS.length = 0;
  ex.forEach(e => EXHIBITIONS.push({ id: e.id, g: e.gallery_id, title: e.title, kind: e.kind || "", start: e.start_date, end: e.end_date,
    artists: (e.artists || []).filter(id => byId[id]), desc: e.description || "", poster: e.poster_path ? workImageUrl(e.poster_path) : undefined, venue: galById[e.gallery_id]?.name || "", region: galById[e.gallery_id]?.area || "" }));
  NOTICES.length = 0;
  nt.forEach(x => NOTICES.push({ id: x.id, tag: x.tag, title: x.title, body: x.body || "", date: x.date || (x.created_at || "").slice(0, 10).replaceAll("-", ".") }));
  return true;
}

/* 페이지 시작: 데이터를 준비한 뒤 화면을 그려요 */
async function arttanBoot(start) {
  let ok = false;
  try { ok = await loadFromSupabase(); } catch (e) { console.warn("Supabase 연결 실패 — 예시 데이터로 보여요:", e); }
  window.ARTTAN_SB = ok;
  if (ok) { AD = AD_DEF(); AD.apps = []; }   // DB 모드에서는 브라우저 임시 저장을 쓰지 않아요
  finishArtists();
  start();
}

/* 사이트에서 보내는 신청·문의
   서버(/api/submit)로 보내면 서버가 Supabase에 저장하고 관리자 텔레그램으로 알려요.
   서버가 없는 곳(파일만 올린 미리보기 등)에서는 예전처럼 브라우저에서 바로 저장해요.
   hp: 사람에게는 안 보이는 칸(로봇 막기) 값 */
async function postSubmit(kind, data, hp, table) {
  let r;
  try { r = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, data, website: hp || "" }) }); }
  catch (e) { r = null; }
  if (r && r.status !== 404 && r.status !== 405) {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "접수하지 못했어요");
    return { ok: true, local: !(j.stored || j.notified) };
  }
  const sb = sbClient();
  if (!window.ARTTAN_SB || !sb) return { local: true };
  const { error } = await sb.from(table).insert(data);
  if (error) throw error; return { ok: true };
}
const submitApplication = (v, hp) => postSubmit("application", v, hp, "applications");
const submitInquiry = (v, hp) => postSubmit("inquiry", v, hp, "inquiries");
