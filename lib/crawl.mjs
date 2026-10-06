// 전시장 홈페이지에서 전시 정보를 모아요 (전시명 · 기간 · 원문 주소만).
// - 전시장 소개 글이나 포스터 이미지는 가져오지 않아요 (저작권). 게시할 때 관리자가 소개를 직접 써요.
// - robots.txt 에서 막은 곳은 가져오지 않아요. 한 번에 한 페이지만, 15초 안에 읽어요.
import https from "node:https";
import http from "node:http";

export const BOT_UA = "arttanBot/1.0 (+https://www.arttan.co.kr/bot; exhibition listings)";   // 헤더에는 영문만 쓸 수 있어요

const pad = n => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const valid = (y, m, d) => y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
const ent = s => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const clean = s => ent(s).replace(/[​ ]/g, " ").replace(/\s+/g, " ").trim();

/* "2026.10.07 - 10. 13", "2026/10/2-2026/10/25", "2026년 11월 1일 ~ 11월 7일", "2026. 09. 24 - 2026. 10. 12" */
const D = String.raw`(20\d\d)\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?`;
const RANGE = new RegExp(D + String.raw`\s*(?:\([^)]{1,4}\))?\s*[-~–—〜]\s*(?:` + D + String.raw`|(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?|(\d{1,2})\s*일?(?!\d))`);
export function parseRange(text) {
  const m = RANGE.exec(text); if (!m) return null;
  const y1 = +m[1], m1 = +m[2], d1 = +m[3];
  let y2, m2, d2;
  if (m[4]) { y2 = +m[4]; m2 = +m[5]; d2 = +m[6]; }
  else if (m[7]) { m2 = +m[7]; d2 = +m[8]; y2 = m2 < m1 ? y1 + 1 : y1; }
  else { y2 = y1; m2 = m1; d2 = +m[9]; }
  if (!valid(y1, m1, d1) || !valid(y2, m2, d2)) return null;
  const start = iso(y1, m1, d1), end = iso(y2, m2, d2);
  if (end < start) return null;
  return { start, end, rest: clean(text.replace(m[0], " ").replace(/[\[\]()|·:]/g, " ")) };
}

/* HTML → 글 조각 목록 [{text, href, img}] (가장 가까운 링크·이미지 주소를 함께 기억해요) */
function segments(html, base) {
  html = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ");
  const out = [], abs = u => { try { return new URL(ent(u), base).href; } catch { return null; } };
  const re = /<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g; let m, href = null, depthA = 0, img = null;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) { const t = clean(m[4]); if (t) out.push({ text: t, href: depthA ? href : null, img }); continue; }
    const tag = m[2].toLowerCase(), close = !!m[1], attrs = m[3] || "";
    if (tag === "a") { if (close) { depthA = Math.max(0, depthA - 1); if (!depthA) href = null; } else { depthA++; const h = /href\s*=\s*["']([^"']+)["']/i.exec(attrs); href = h ? abs(h[1]) : null; } }
    if (tag === "img" && !close) { const s = /\s(?:data-src|src)\s*=\s*["']([^"']+)["']/i.exec(attrs); if (s) img = abs(s[1]); }
    if (!close && /^(br|p|div|li|tr|h\d|dt|dd|section|article)$/.test(tag)) out.push({ text: "", href: null, img });
  }
  return out;
}

const LABEL = /^(no image|현재\s*전시|지난\s*전시|예정\s*전시|전시\s*예정|진행\s*중|진행중인?\s*전시|exhibitions?|current|upcoming|past|more|더\s*보기|전체\s*보기|자세히\s*보기|view\s*more|전시\s*기간|기간|일정|period|date|open|close|new|\+|›|>)$/i;
const okTitle = t => t && t.length >= 2 && t.length <= 80 && !LABEL.test(t) && !/^\d+$/.test(t) && !RANGE.test(t);

export function extractExhibitions(html, pageUrl) {
  const items = [];
  /* 1) 구조화 데이터(JSON-LD)에 전시·행사가 있으면 그대로 써요 */
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = o => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if (o["@graph"]) walk(o["@graph"]);
        const t = [].concat(o["@type"] || []); if (t.some(x => /Event$/.test(x)) && o.name && o.startDate) items.push({ title: clean(String(o.name)), start: String(o.startDate).slice(0, 10), end: String(o.endDate || o.startDate).slice(0, 10), link: o.url ? new URL(o.url, pageUrl).href : pageUrl, context: "", image: typeof o.image === "string" ? o.image : null }); };
      walk(JSON.parse(m[1]));
    } catch { /* 형식이 틀린 JSON-LD 는 건너뛰어요 */ }
  }
  /* 2) 글 조각에서 "제목 … 기간" 짝을 찾아요 */
  const S = segments(html, pageUrl).filter(s => s.text || true);
  const T = []; S.forEach(s => { if (s.text) T.push(s); });
  T.forEach((s, i) => {
    const r = parseRange(s.text); if (!r) return;
    let title = okTitle(r.rest) && r.rest.length >= 3 ? r.rest : "", ti = i, context = "";
    for (let k = i - 1; !title && k >= Math.max(0, i - 4); k--) if (okTitle(T[k].text)) { title = T[k].text; ti = k; }
    if (!title) return;
    for (let k = ti - 1; k >= Math.max(0, ti - 3); k--) if (okTitle(T[k].text) && T[k].text !== title) { context = T[k].text; break; }
    const link = T[ti].href || s.href || T[ti - 1]?.href || null;
    items.push({ title: title.slice(0, 120), context: context.slice(0, 80), start: r.start, end: r.end, link: link || pageUrl, image: T[ti].img || s.img || null });
  });
  /* 같은 전시가 여러 번 나오면 하나로: 같은 상세 주소·기간이면 같은 전시로 보고,
     여러 번 나온 글귀를 제목으로 (제목과 부제가 뒤바뀌는 걸 막아요) */
  const groups = new Map();
  for (const it of items) {
    const k = it.link && it.link !== pageUrl ? `L|${it.link}|${it.start}|${it.end}` : `T|${it.title.replace(/\s+/g, "")}|${it.start}`;
    if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it);
  }
  const merged = [...groups.values()].map(G => {
    if (G.length === 1) return G[0];
    const cnt = new Map(); G.forEach(g => [g.title, g.context].filter(Boolean).forEach(t => cnt.set(t, (cnt.get(t) || 0) + 1)));
    const title = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const context = G.flatMap(g => [g.title, g.context]).find(t => t && t !== title) || "";
    return { ...G[0], title, context, image: G.find(g => g.image)?.image || null };
  });
  const seen = new Map();
  for (const it of merged) { const k = `${it.title.replace(/\s+/g, "")}|${it.start}`; const p = seen.get(k); if (!p || (p.link === pageUrl && it.link !== pageUrl)) seen.set(k, it); }
  return [...seen.values()];
}

/* 페이지 읽기. 보안 인증서 체인이 불완전한 사이트(브라우저는 열리지만 서버에선 막히는 경우)는
   읽기 전용으로 인증서 검사를 건너뛰고 다시 읽어요 — 결과에 warn 을 남겨 관리자가 알 수 있게 해요. */
const CERT = /CERT|SIGNATURE|SELF_SIGNED|UNABLE_TO_VERIFY|ERR_TLS/i;
function getLoose(url, left = 5) {
  return new Promise((resolve, reject) => {
    const u = new URL(url), mod = u.protocol === "http:" ? http : https;
    const req = mod.get(u, { headers: { "User-Agent": BOT_UA, "Accept-Language": "ko,en" }, rejectUnauthorized: false, timeout: 15000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && left > 0) { res.resume(); return resolve(getLoose(new URL(res.headers.location, u).href, left - 1)); }
      const chunks = []; let n = 0;
      res.on("data", c => { n += c.length; if (n <= 3_000_000) chunks.push(c); else res.destroy(); });
      res.on("end", () => resolve({ status: res.statusCode, url, ct: res.headers["content-type"] || "", buf: Buffer.concat(chunks) }));
      res.on("close", () => resolve({ status: res.statusCode, url, ct: res.headers["content-type"] || "", buf: Buffer.concat(chunks) }));
    });
    req.on("timeout", () => req.destroy(new Error("TimeoutError"))); req.on("error", reject);
  });
}
async function fetchPage(url, timeout = 15000) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": BOT_UA, "Accept-Language": "ko,en" }, redirect: "follow", signal: AbortSignal.timeout(timeout) });
    return { status: r.status, url: r.url || url, ct: r.headers.get("content-type") || "", buf: Buffer.from(await r.arrayBuffer()).subarray(0, 3_000_000) };
  } catch (e) {
    if (CERT.test(String(e.cause?.code || e.cause?.message || ""))) return { ...(await getLoose(url)), warn: "사이트 보안 인증서에 문제가 있어 검사 없이 읽었어요" };
    throw e;
  }
}

/* robots.txt: User-agent * 또는 arttanBot 에 걸린 Disallow 를 지켜요 */
async function robotsAllows(url) {
  try {
    const u = new URL(url), r = await fetchPage(`${u.origin}/robots.txt`, 6000);
    if (r.status !== 200) return true;
    let apply = false; const dis = [];
    for (const line of r.buf.toString("utf8").split(/\r?\n/)) {
      const [k, ...v] = line.split(":"); const key = (k || "").trim().toLowerCase(), val = v.join(":").trim();
      if (key === "user-agent") apply = val === "*" || /arttanbot/i.test(val);
      else if (apply && key === "disallow" && val) dis.push(val);
    }
    return !dis.some(p => u.pathname.startsWith(p.replace(/\*.*$/, "")));
  } catch { return true; }
}

export const itemHash = (galleryId, it) => `${galleryId}|${it.title.replace(/\s+/g, "").toLowerCase()}|${it.start}`;

/* 전시장 한 곳 수집: 오늘 기준 60일 전에 끝난 것부터 앞으로의 전시까지 */
export async function crawlVenue(url, { keepDays = 60 } = {}) {
  if (!/^https?:\/\//i.test(url || "")) return { ok: false, error: "전시 목록 주소가 없어요" };
  if (!(await robotsAllows(url))) return { ok: false, error: "이 사이트는 robots.txt 로 수집을 막았어요" };
  let r;
  try { r = await fetchPage(url); }
  catch (e) { return { ok: false, error: `사이트에 연결하지 못했어요 (${/Timeout/.test(e.name + e.message) ? "시간 초과" : "연결 실패"})` }; }
  if (r.status < 200 || r.status >= 300) return { ok: false, error: `사이트가 ${r.status} 로 응답했어요` };
  const buf = r.buf, ct = r.ct;
  let cs = /charset=([\w-]+)/i.exec(ct)?.[1] || /<meta[^>]+charset=["']?([\w-]+)/i.exec(buf.toString("latin1"))?.[1] || "utf-8";
  let html; try { html = new TextDecoder(cs.toLowerCase() === "ks_c_5601-1987" ? "euc-kr" : cs).decode(buf); } catch { html = buf.toString("utf8"); }
  const cut = new Date(Date.now() - keepDays * 864e5).toISOString().slice(0, 10);
  const items = extractExhibitions(html, r.url || url).filter(it => it.end >= cut).slice(0, 60);
  return { ok: true, url: r.url || url, items, warn: r.warn };
}
