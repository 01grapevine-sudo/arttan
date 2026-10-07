// 검색 노출용 서버 렌더링: 작가·작품·갤러리·전시 페이지를 완성된 HTML로 보내요.
// Vercel 함수(api/page.js)와 로컬 개발 서버(scripts/dev-server.mjs)가 함께 써요.
// 데이터는 사이트와 같은 코드(core.js · data.js · artists/*/artist.js)로 읽어서, 화면과 내용이 어긋나지 않아요.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = [path.resolve(HERE, ".."), process.cwd()].find(d => fs.existsSync(path.join(d, "app.html"))) || path.resolve(HERE, "..");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

export const SITE = (process.env.SITE_URL || "https://www.arttan.co.kr").replace(/\/$/, "");
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/* data.js 가 쓰는 supabase-js 대신, 읽기만 하는 작은 REST 클라이언트 */
function restClient(url, key) {
  return {
    from(table) {
      const order = [];
      const q = {
        select() { return q; },
        order(col, o) { order.push(`${col}.${o && o.ascending === false ? "desc" : "asc"}`); return q; },
        then(ok, fail) {
          const u = `${url}/rest/v1/${table}?select=*${order.length ? `&order=${order.join(",")}` : ""}`;
          return fetch(u, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
            .then(async r => r.ok ? { data: await r.json(), error: null } : { data: null, error: { message: `${r.status} ${await r.text()}` } })
            .then(ok, fail);
        }
      };
      return q;
    }
  };
}

let cache = null, cacheAt = 0, template = null;
export async function loadData() {
  if (cache && !process.env.ARTTAN_DEV && Date.now() - cacheAt < 60_000) return cache;
  template = read("app.html");
  const files = [...template.matchAll(/<script src="(artists\/[^"?]+\.js)(?:\?[^"]*)?"><\/script>/g)].map(m => m[1]);
  const ctx = vm.createContext({ console, Date, Math, JSON, Promise, setTimeout, clearTimeout, fetch, URL, encodeURIComponent });
  ctx.window = ctx;
  if (SB_URL && SB_KEY) { ctx.ARTTAN_CONFIG = { supabaseUrl: SB_URL, supabaseAnonKey: SB_KEY }; ctx.supabase = { createClient: () => restClient(SB_URL, SB_KEY) }; }
  vm.runInContext([read("core.js"), ...files.map(read), read("data.js")].join("\n;\n"), ctx);
  const sb = await vm.runInContext("(async()=>{let ok=false;try{ok=await loadFromSupabase()}catch(e){console.warn('Supabase 읽기 실패',e)}finishArtists();return ok})()", ctx);
  const D = vm.runInContext(`({ARTISTS,byId,INTERVIEWS,VIDEOS,BOOKS,GALLERIES,galById,EXHIBITIONS,status,genresOf,
    artistIndexable,exIndexable,galIndexable,artistPath,workPath,galPath,exPath,exHeadline,artistHeadline,seoPages,optImg,bookPath,bookAccess,bookIndexable,libSearch,REVIEWS,reviewPath,reviewIndexable,reviewArtists,reviewsOfEx})`, ctx);
  D.sb = sb;
  cache = D; cacheAt = Date.now();
  return D;
}

/* ---------- 작은 도우미 ---------- */
const e = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dotted = s => String(s || "").replaceAll("-", ".");
const cut = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
const abs = p => !p ? undefined : /^https?:\/\//.test(p) ? p : `${SITE}/${String(p).replace(/^\//, "")}`;
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const crumbs = list => ({ "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: list.map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${p}` })) });

function head({ title, desc, canonical, image, type = "website", jsonld = [], noindex = false }) {
  const v = [
    `<title>${e(title)}</title>`,
    `<meta name="description" content="${e(desc)}">`,
    `<link rel="canonical" href="${SITE}${canonical}">`,
    `<meta name="robots" content="${noindex ? "noindex,follow" : "index,follow,max-image-preview:large"}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="arttan 아트탄">`,
    `<meta property="og:locale" content="ko_KR">`,
    `<meta property="og:title" content="${e(title)}">`,
    `<meta property="og:description" content="${e(desc)}">`,
    `<meta property="og:url" content="${SITE}${canonical}">`,
    image ? `<meta property="og:image" content="${e(abs(image))}">` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    process.env.NAVER_SITE_VERIFICATION ? `<meta name="naver-site-verification" content="${e(process.env.NAVER_SITE_VERIFICATION)}">` : "",
    process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${e(process.env.GOOGLE_SITE_VERIFICATION)}">` : "",
    `<link rel="alternate" type="application/rss+xml" title="arttan 새 소식" href="${SITE}/rss.xml">`,
    ...jsonld.map(ld)
  ];
  return v.filter(Boolean).join("\n");
}

/* 사이트 아래쪽 바로가기: 검색엔진이 모든 작가·갤러리·전시 페이지를 링크로 찾아가게 해요 */
function footDir(D) {
  const as = D.ARTISTS.filter(D.artistIndexable);
  const gs = D.GALLERIES.filter(D.galIndexable);
  const xs = D.EXHIBITIONS.filter(D.exIndexable).sort((x, y) => y.start.localeCompare(x.start)).slice(0, 12);
  const row = (lab, items) => items.length ? `<div><b>${lab}</b>${items.join("")}</div>` : "";
  return row("작가 아카이브", as.map(a => `<a href="${D.artistPath(a.id)}">${e(a.name)} <small>${e(a.genre)}</small></a>`)) +
    row("갤러리", gs.map(g => `<a href="${D.galPath(g.id)}">${e(g.name)}</a>`)) +
    row("전시", xs.map(x => `<a href="${D.exPath(x)}">「${e(x.title)}」 <small>${e(x.venue)}</small></a>`));
}

function workAlt(a, w) { return [a.name, w[0], w[1], w[2], w[4] && w[4].replace(/ · 제목 확인 중$/, "")].filter(Boolean).join(", "); }
const subj = w => /^작품 \d+$/.test(w[0]) && /^소재: ([^·]+)/.exec(w[4] || "")?.[1].trim();
const srcs = a => a.sources || (a.source ? [a.source] : []);
const cover = a => a.photos?.[0] || a.portraits?.[0];
function srcHtml(a) {
  const L = srcs(a);
  return `<p class="ssr-src">${a.photos || a.portraits ? "작품·인물 사진은 작가의 허락을 받아 게재했어요." : ""}${L.length ? ` 소개 글 참고 자료 · ${L.map(x => `<a href="${e(x.url)}" rel="noopener">${e(x.name)}</a>`).join(" · ")}` : ""}</p>`;
}
function workImg(D, a, i, small) {
  if (!a.photos) return "";
  const src = a.photos[i % a.photos.length];
  return `<img src="${e(abs(D.optImg(src, small)))}" alt="${e(workAlt(a, a.works[i]))}" loading="${small ? "lazy" : "eager"}" decoding="async">`;
}
function exLi(D, x) {
  const st = D.status(x);
  return `<li><a href="${D.exPath(x)}">${e(D.exHeadline(x))}</a> <span>${dotted(x.start)} – ${dotted(x.end)} · ${e(st.label)}</span></li>`;
}
function exRows(D, xs, link = true) {
  return `<ul class="ssr-list">${xs.map(x => link && D.exIndexable(x) ? exLi(D, x) :
    `<li>${e(D.exHeadline(x))} <span>${dotted(x.start)} – ${dotted(x.end)}</span></li>`).join("")}</ul>`;
}

/* ---------- 페이지 ---------- */
function pageHome(D) {
  const as = D.ARTISTS.filter(D.artistIndexable);
  return {
    head: head({
      title: "arttan 아트탄 | 원로·중견·청년 작가 아카이브",
      desc: "원로·중견·청년 작가의 작품, 인터뷰, 도록, 전시 이력을 작가별 공간에 모아 기록하는 미술 작가 아카이브예요. 작가 등록은 무료예요.",
      canonical: "/",
      image: as.map(cover).find(Boolean),
      jsonld: [
        { "@context": "https://schema.org", "@type": "WebSite", name: "arttan", alternateName: ["아트탄", "arttan 아트탄"], url: `${SITE}/`, inLanguage: "ko" },
        { "@context": "https://schema.org", "@type": "Organization", name: "arttan 아트탄", url: `${SITE}/`,
          description: "원로·중견·청년 작가 아카이브" }
      ]
    }),
    body: ""
  };
}

function pageArtist(D, a) {
  const p = D.artistPath(a.id);
  const ivs = D.INTERVIEWS.filter(v => v.artist === a.id);
  const exs = D.EXHIBITIONS.filter(x => x.artists.includes(a.id)).sort((x, y) => y.start.localeCompare(x.start));
  const same = D.ARTISTS.filter(b => b.id !== a.id && !b.hidden && D.genresOf(b).includes(a.genre)).slice(0, 8);
  const meta = [D.genresOf(a).join("·"), a.tier, a.born ? `${a.born}년${a.from ? ` ${a.from}` : ""} 출생` : "", a.city ? `${a.city} 활동` : ""].filter(Boolean).join(" · ");
  const aka = (a.aka || []).filter(x => x !== a.en);
  const desc = cut(`${a.name} 작가${aka.length ? `(${aka.join(", ")})` : ""} — ${meta}. ${a.line ? a.line + ". " : ""}${a.bio || ""}`, 160);
  const person = { "@type": "Person", "@id": `${SITE}${p}#person`, name: a.name, alternateName: [a.en, ...aka].filter(Boolean),
    birthDate: a.born ? String(a.born) : undefined, birthPlace: a.from ? { "@type": "Place", name: a.from } : undefined,
    homeLocation: a.city ? { "@type": "Place", name: a.city } : undefined,
    jobTitle: `${a.genre} 작가`, description: cut(a.line || a.bio, 200) || undefined,
    knowsAbout: [...D.genresOf(a), ...(a.tags || [])], image: abs(cover(a)), url: `${SITE}${p}`,
    sameAs: srcs(a).map(x => x.url) };
  const body = `<article class="ssr" id="ssr">
<nav class="ssr-bc" aria-label="위치"><a href="/">arttan</a> › <a href="/#artists">작가</a> › ${e(a.name)}</nav>
<h1>${e(a.name)}${a.en ? ` <small>${e(a.en)}</small>` : ""}</h1>
<p class="ssr-meta">${e(meta)}</p>
${aka.length ? `<p class="ssr-meta">다른 이름 · ${aka.map(e).join(" · ")}</p>` : ""}
${a.quote ? `<p class="ssr-lead">“${e(a.quote)}”</p>` : a.line ? `<p class="ssr-lead">${e(a.line)}</p>` : ""}
${a.bio ? `<h2>작가 소개</h2><p>${e(a.bio)}</p>` : ""}
${a.tags?.length ? `<p class="ssr-tags">${a.tags.map(t => `<span>#${e(t)}</span>`).join(" ")}</p>` : ""}
${a.works.length && a.photos ? `<h2>작품 ${a.works.length}점</h2><ul class="ssr-works">${a.works.map((w, i) => `<li><a href="${D.workPath(a.id, i)}">${workImg(D, a, i, true)}<b>${e(w[0])}</b><span>${[w[1], w[2], w[3]].filter(Boolean).map(e).join(" · ")}</span></a></li>`).join("")}</ul>` : ""}
${a.works.length && !a.photos ? `<h2>작품 기록 ${a.works.length}건</h2><ul class="ssr-list">${a.works.map(w => `<li>「${e(w[0])}」 <span>${[w[1], w[2], w[3]].filter(Boolean).map(e).join(" · ")}</span></li>`).join("")}</ul>` : ""}
${ivs.length ? `<h2>인터뷰</h2>${ivs.map(v => `<h3>${e(v.title)}</h3><p>${e(v.lead)}</p><dl>${(v.qa || []).map(([q, ans]) => `<dt>${e(q)}</dt><dd>${e(ans)}</dd>`).join("")}</dl>`).join("")}` : ""}
${a.cv?.length ? `<h2>주요 이력</h2><ul class="ssr-list">${a.cv.map(([y, t]) => `<li>${e(y)} ${e(t)}</li>`).join("")}</ul>` : ""}
${a.collections ? `<h2>작품 소장</h2><p>${e(a.collections)}</p>` : ""}
${(() => { const bs = D.BOOKS.filter(b => b.artist === a.id); return bs.length ? `<h2>도록 · 저서</h2><ul class="ssr-list">${bs.map(b => `<li><a href="${D.bookPath(b)}">『${e(b.title)}』</a> <span>${e(b.kind || "")}${b.year ? ` · ${b.year}` : ""}</span></li>`).join("")}</ul>` : ""; })()}
${a.books?.length ? `<h2>저서</h2><ul class="ssr-list">${a.books.map(b => `<li>${e(b)}</li>`).join("")}</ul>` : ""}
${exs.length || a.history?.length ? `<h2>전시</h2>${exRows(D, exs)}${a.history?.length ? `<ul class="ssr-list">${a.history.map(([y, t, v]) => `<li>${e(y)} 「${e(t)}」 <span>${e(v)}</span></li>`).join("")}</ul>` : ""}` : ""}
${same.length ? `<h2>${e(a.genre)} 작가 더 보기</h2><ul class="ssr-list">${same.map(b => `<li><a href="${D.artistPath(b.id)}">${e(b.name)}</a> <span>${e(b.tier)}</span></li>`).join("")}</ul>` : ""}
${srcHtml(a)}
</article>`;
  return {
    head: head({ title: `${D.artistHeadline(a)} | arttan 작가 아카이브`, desc, canonical: p, image: cover(a), type: "profile",
      noindex: !D.artistIndexable(a),
      jsonld: [{ "@context": "https://schema.org", "@type": "ProfilePage", url: `${SITE}${p}`, name: `${a.name} 작가 아카이브`, mainEntity: person },
        crumbs([["arttan", "/"], ["작가", "/#artists"], [a.name, p]])] }),
    body
  };
}

function pageWork(D, a, i) {
  const w = a.works[i], p = D.workPath(a.id, i), ap = D.artistPath(a.id);
  const others = a.works.map((x, k) => [x, k]).filter(([, k]) => k !== i);
  const spec = [w[1] && `${w[1]}`, w[2], w[3]].filter(Boolean).join(", ");
  const desc = cut(`${a.name}, 「${w[0]}」${spec ? `, ${spec}` : ""}. ${w[4] ? w[4] + " " : ""}${a.name}(${a.genre} · ${a.tier})의 작품 ${a.works.length}점을 arttan 작가 아카이브에서 볼 수 있어요.`, 155);
  const body = `<article class="ssr" id="ssr">
<nav class="ssr-bc" aria-label="위치"><a href="/">arttan</a> › <a href="/#artists">작가</a> › <a href="${ap}">${e(a.name)}</a> › 작품</nav>
<figure class="ssr-fig">${workImg(D, a, i, false)}<figcaption><h1>${e(w[0])}</h1>
<dl><dt>작가</dt><dd><a href="${ap}">${e(a.name)}</a> (${e(a.genre)} · ${e(a.tier)})</dd>${w[1] ? `<dt>연도</dt><dd>${e(w[1])}</dd>` : ""}${w[2] ? `<dt>재료</dt><dd>${e(w[2])}</dd>` : ""}${w[3] ? `<dt>크기</dt><dd>${e(w[3])}</dd>` : ""}</dl>
${w[4] ? `<p>${e(w[4])}</p>` : ""}</figcaption></figure>
${others.length ? `<h2>${e(a.name)}의 다른 작품</h2><ul class="ssr-works">${others.map(([x, k]) => `<li><a href="${D.workPath(a.id, k)}">${workImg(D, a, k, true)}<b>${e(x[0])}</b><span>${e(x[1] || "")}</span></a></li>`).join("")}</ul>` : ""}
<p><a href="${ap}">${e(a.name)} 작가 공간 전체 보기 ›</a></p>
${srcHtml(a)}
</article>`;
  return {
    /* 제목을 아직 모르는 작품은 사진에 보이는 소재를 앞에 둬요: "호랑이 (작품 28) – 작가명 서양화" */
    head: head({ title: `${subj(w) ? `${subj(w)} (${w[0]})` : w[0]}${w[1] ? ` (${w[1]})` : ""} – ${a.name} ${a.genre} | arttan`, desc, canonical: p, image: a.photos?.[i % (a.photos?.length || 1)],
      noindex: !D.artistIndexable(a) || !a.photos,
      jsonld: [{ "@context": "https://schema.org", "@type": "VisualArtwork", name: w[0], url: `${SITE}${p}`,
        creator: { "@type": "Person", "@id": `${SITE}${ap}#person`, name: a.name, url: `${SITE}${ap}` },
        dateCreated: w[1] ? String(w[1]) : undefined, artMedium: w[2] || undefined, artform: a.genre,
        image: abs(a.photos?.[i % (a.photos?.length || 1)]), description: [spec, w[4]].filter(Boolean).join(". ") || undefined },
        crumbs([["arttan", "/"], ["작가", "/#artists"], [a.name, ap], [w[0], p]])] }),
    body
  };
}

function pageGallery(D, g) {
  const p = D.galPath(g.id);
  const xs = D.EXHIBITIONS.filter(x => x.g === g.id).map(x => ({ ...x, st: D.status(x) }));
  const grp = k => xs.filter(x => x.st.k === k).sort((x, y) => k === "end" ? y.start.localeCompare(x.start) : x.start.localeCompare(y.start));
  const live = grp("live"), soon = grp("soon"), past = grp("end");
  const desc = cut(`${g.name}(${g.area}) 전시 일정 — 지금 전시 ${live.length}건, 예정 ${soon.length}건, 지난 전시 ${past.length}건. ${g.intro || ""}${g.addr ? ` 주소: ${g.addr}.` : ""}${g.hours ? ` 관람시간: ${g.hours}.` : ""}`, 155);
  const body = `<article class="ssr" id="ssr">
<nav class="ssr-bc" aria-label="위치"><a href="/">arttan</a> › <a href="/#galleries">갤러리</a> › ${e(g.name)}</nav>
<h1>${e(g.name)} <small>${e(g.area)}</small></h1>
${g.photo ? `<img src="${e(abs(D.optImg(g.photo)))}" alt="${e(g.name)} 전경" loading="eager">` : ""}
${g.intro ? `<h2>갤러리 소개</h2><p>${e(g.intro)}</p>` : ""}
${g.site ? `<p><a href="${e(g.site)}" rel="noopener">${e(g.name)} 홈페이지</a></p>` : ""}
<dl>${g.addr ? `<dt>주소</dt><dd>${e(g.addr)}</dd>` : ""}${g.hours ? `<dt>관람시간</dt><dd>${e(g.hours)}</dd>` : ""}${g.tel ? `<dt>전화</dt><dd>${e(g.tel)}</dd>` : ""}${g.site ? `<dt>홈페이지</dt><dd><a href="${e(g.site)}" rel="noopener">${e(g.site)}</a></dd>` : ""}</dl>
${live.length ? `<h2>지금 전시 중</h2>${exRows(D, live)}` : ""}
${soon.length ? `<h2>전시 예정</h2>${exRows(D, soon)}` : ""}
${past.length ? `<h2>지나간 전시</h2>${exRows(D, past)}` : ""}
${g.video ? `<h2>영상</h2><p><a href="${e(g.video)}" rel="noopener">${e(g.name)} 영상 보기</a></p>` : ""}
${(() => { const mine = xs.filter(x => x.artists.some(id => D.byId[id] && !D.byId[id].hidden)); return mine.length ? `<h2>arttan 작가 전시</h2>${exRows(D, mine)}` : ""; })()}
</article>`;
  return {
    head: head({ title: `${g.name} (${g.area}) 전시 일정 | arttan`, desc, canonical: p, noindex: !D.galIndexable(g), image: g.photo,
      jsonld: [{ "@context": "https://schema.org", "@type": "ArtGallery", name: g.name, url: g.site || `${SITE}${p}`,
        address: g.addr || g.area || undefined, telephone: g.tel || undefined, description: g.intro || undefined },
        crumbs([["arttan", "/"], ["갤러리", "/#galleries"], [g.name, p]])] }),
    body
  };
}

function pageExhibition(D, x) {
  const p = D.exPath(x), g = D.galById[x.g], st = D.status(x);
  const as = x.artists.map(id => D.byId[id]).filter(Boolean);
  const desc = cut(`${dotted(x.start)} – ${dotted(x.end)}, ${x.venue}${x.region ? `(${x.region})` : ""}. ${x.desc || ""}`, 155);
  const more = D.EXHIBITIONS.filter(y => y.g === x.g && y.id !== x.id).sort((a, b) => b.start.localeCompare(a.start)).slice(0, 8);
  const body = `<article class="ssr" id="ssr">
<nav class="ssr-bc" aria-label="위치"><a href="/">arttan</a> › <a href="/#shows">전시</a> › 「${e(x.title)}」</nav>
<p class="ssr-meta">${e(x.kind)} · ${e(st.label)}</p>
<h1>${e(D.exHeadline(x))}</h1>
${x.poster ? `<img src="${e(abs(D.optImg(x.poster)))}" alt="「${e(x.title)}」 전시 포스터" loading="eager">` : ""}
${x.desc ? `<p class="ssr-lead">${e(x.desc)}</p>` : ""}
<dl><dt>전시 기간</dt><dd>${dotted(x.start)} – ${dotted(x.end)}</dd>
<dt>전시 장소</dt><dd>${g ? `<a href="${D.galPath(g.id)}">${e(g.name)}</a>` : e(x.venue)}${x.region ? ` · ${e(x.region)}` : ""}${g?.addr ? ` · ${e(g.addr)}` : ""}</dd>
${g?.hours ? `<dt>관람시간</dt><dd>${e(g.hours)}</dd>` : ""}${g?.tel ? `<dt>문의</dt><dd>${e(g.tel)}</dd>` : ""}
<dt>참여 작가</dt><dd>${[...as.map(a => `<a href="${D.artistPath(a.id)}">${e(a.name)}</a> (${e(a.tier)} · ${e(a.genre)})`), ...(x.artistsText ? [e(x.artistsText)] : [])].join(", ") || "—"}</dd>
${x.sourceUrl ? `<dt>출처</dt><dd><a href="${e(x.sourceUrl)}" rel="noopener nofollow">${e(x.venue)} 홈페이지</a></dd>` : ""}</dl>
${D.reviewsOfEx(x.id).map(r => `<p><a href="${D.reviewPath(r)}">전시리뷰 · 현장 사진: ${e(r.title)}</a></p>`).join("")}
${more.length ? `<h2>${e(x.venue)}의 다른 전시</h2>${exRows(D, more)}` : ""}
</article>`;
  return {
    head: head({ title: `${D.exHeadline(x)} | arttan`, desc, canonical: p, noindex: !D.exIndexable(x),
      image: x.poster || as.map(cover).find(Boolean),
      jsonld: [{ "@context": "https://schema.org", "@type": "ExhibitionEvent", image: x.poster ? abs(x.poster) : undefined, name: `${x.title}`, url: `${SITE}${p}`,
        startDate: x.start, endDate: x.end, description: x.desc || undefined, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: { "@type": "Place", name: x.venue, address: g?.addr || x.region || x.venue },
        performer: as.map(a => ({ "@type": "Person", name: a.name, url: `${SITE}${D.artistPath(a.id)}` })) },
        crumbs([["arttan", "/"], ["전시", "/#shows"], [x.title, p]])] }),
    body
  };
}

function pageBook(D, bk) {
  const a = D.byId[bk.artist], p = D.bookPath(bk), ap = D.artistPath(a.id);
  const W = (bk.works || []).filter(i => a.works[i]);
  const ex = bk.exhibition && D.EXHIBITIONS.find(x => x.id === bk.exhibition);
  const more = D.BOOKS.filter(b => b.artist === a.id && b.id !== bk.id);
  const spec = [bk.year && `${bk.year}년`, bk.pages && `${bk.pages}쪽`, bk.size, bk.publisher, bk.isbn && `ISBN ${bk.isbn}`].filter(Boolean);
  const desc = cut(`${a.name} ${bk.kind || "도록"} 『${bk.title}』${spec.length ? ` (${spec.join(", ")})` : ""}. ${bk.desc || ""}`, 155);
  const body = `<article class="ssr" id="ssr">
<nav class="ssr-bc" aria-label="위치"><a href="/">arttan</a> › <a href="/#catalogue">도록</a> › <a href="${ap}">${e(a.name)}</a></nav>
<p class="ssr-meta">${e(bk.kind || "도록")} · ${e(D.bookAccess(bk))}</p>
<h1>『${e(bk.title)}』</h1>
<p><a href="${ap}">${e(a.name)}</a> (${e(a.tier)} · ${e(a.genre)})${bk.writer ? ` · 글 ${e(bk.writer)}` : ""}</p>
${spec.length ? `<p class="ssr-meta">${spec.map(e).join(" · ")}</p>` : ""}
${bk.cover ? `<img src="${e(abs(D.optImg(bk.cover)))}" alt="『${e(bk.title)}』 표지" loading="eager">` : ""}
${bk.desc ? `<h2>소개</h2><p>${e(bk.desc)}</p>` : ""}
${W.length ? `<h2>이 책에 실린 작품</h2><ul class="ssr-works">${W.map(i => `<li><a href="${D.workPath(a.id, i)}">${workImg(D, a, i, true)}<b>${e(a.works[i][0])}</b></a></li>`).join("")}</ul>` : ""}
${bk.toc?.length ? `<h2>목차</h2><ol class="ssr-list">${bk.toc.map(t => `<li>${e(t)}</li>`).join("")}</ol>` : ""}
${ex ? `<h2>연결된 전시</h2>${exRows(D, [ex])}` : ""}
${more.length ? `<h2>${e(a.name)}의 다른 책</h2><ul class="ssr-list">${more.map(b => `<li><a href="${D.bookPath(b)}">『${e(b.title)}』</a> <span>${e(b.kind || "")}${b.year ? ` · ${b.year}` : ""}</span></li>`).join("")}</ul>` : ""}
${a.real ? `<p><a href="${e(D.libSearch(bk))}" rel="noopener">국립중앙도서관에서 찾기</a></p>` : ""}
</article>`;
  return {
    head: head({ title: `『${bk.title}』 ${a.name} ${bk.kind || "도록"} | arttan`, desc, canonical: p, image: bk.cover || cover(a), type: "book",
      noindex: !D.bookIndexable(bk),
      jsonld: [{ "@context": "https://schema.org", "@type": "Book", name: bk.title, url: `${SITE}${p}`,
        author: { "@type": "Person", "@id": `${SITE}${ap}#person`, name: a.name, url: `${SITE}${ap}` },
        datePublished: bk.year ? String(bk.year) : undefined, numberOfPages: bk.pages || undefined, isbn: bk.isbn || undefined,
        publisher: bk.publisher ? { "@type": "Organization", name: bk.publisher } : undefined, bookFormat: "https://schema.org/Hardcover",
        genre: bk.kind || undefined, image: bk.cover ? abs(bk.cover) : undefined, description: bk.desc || undefined, inLanguage: "ko" },
        crumbs([["arttan", "/"], ["도록", "/#catalogue"], [a.name, ap], [bk.title, p]])] }),
    body
  };
}

function pageReview(D, r) {
  const p = D.reviewPath(r), x = D.EXHIBITIONS.find(e => e.id === r.exhibition) || null, A = D.reviewArtists(r).map(id => D.byId[id]).filter(a => a && !a.hidden);
  const ph = r.photos || [], W = (r.works || []).map(([aid, i]) => [D.byId[aid], i]).filter(([a, i]) => a && !a.hidden && a.works[i]);
  const desc = cut(`${x ? `「${x.title}」 ${dotted(x.start)} – ${dotted(x.end)}, ${x.venue}. ` : ""}${String(r.body || "").replace(/\[[^\]]*\]/g, "")}`, 155);
  const body = `<article class="ssr" id="ssr">
<nav class="ssr-bc" aria-label="위치"><a href="/">arttan</a> › <a href="/#reviews">전시리뷰</a>${A.map(a => ` › <a href="${D.artistPath(a.id)}">${e(a.name)}</a>`).join("")}</nav>
<p class="ssr-meta">전시리뷰 · 전시장 스케치${r.date ? ` · ${dotted(r.date)} 방문` : ""}${r.author ? ` · ${e(r.author)}` : ""}</p>
<h1>${e(r.title)}</h1>
${x ? `<dl><dt>전시</dt><dd><a href="${D.exPath(x)}">「${e(x.title)}」</a></dd><dt>기간</dt><dd>${dotted(x.start)} – ${dotted(x.end)}</dd><dt>장소</dt><dd><a href="${D.galPath(x.g)}">${e(x.venue)}</a></dd><dt>작가</dt><dd>${A.map(a => `<a href="${D.artistPath(a.id)}">${e(a.name)}</a>`).join(", ")}</dd></dl>` : ""}
${r.body ? `<h2>리뷰</h2>${String(r.body).split(/\n{2,}/).map(t => `<p>${e(t)}</p>`).join("")}` : ""}
${ph.length ? `<h2>현장 사진</h2><ul class="ssr-works">${ph.map(f => `<li><img src="${e(abs(D.optImg(f.src, true)))}" alt="${e(f.caption || r.title)}" loading="lazy"><span>${e(f.caption || "")}</span></li>`).join("")}</ul>` : ""}
${W.length ? `<h2>전시에 걸린 작품</h2><ul class="ssr-works">${W.map(([a, i]) => `<li><a href="${D.workPath(a.id, i)}">${workImg(D, a, i, true)}<b>${e(a.works[i][0])}</b><span>${e(a.name)}</span></a></li>`).join("")}</ul>` : ""}
</article>`;
  return {
    head: head({ title: `${r.title} | ${x ? `${x.title} ` : ""}전시리뷰 | arttan`, desc, canonical: p, image: ph[0]?.src || (x && x.poster), type: "article", noindex: !D.reviewIndexable(r),
      jsonld: [{ "@context": "https://schema.org", "@type": "Review", name: r.title, url: `${SITE}${p}`, datePublished: r.date || undefined,
        author: { "@type": "Organization", name: r.author || "arttan" }, reviewBody: cut(r.body, 500) || undefined,
        image: ph.map(f => abs(f.src)),
        itemReviewed: x ? { "@type": "ExhibitionEvent", name: x.title, startDate: x.start, endDate: x.end, url: `${SITE}${D.exPath(x)}`, location: { "@type": "Place", name: x.venue } } : undefined },
        crumbs([["arttan", "/"], ["전시리뷰", "/#reviews"], [r.title, p]])] }),
    body
  };
}

function pageNotFound() {
  return {
    head: head({ title: "페이지를 찾을 수 없어요 | arttan", desc: "주소가 바뀌었거나 비공개로 바뀐 페이지예요.", canonical: "/", noindex: true }),
    body: `<article class="ssr" id="ssr"><h1>페이지를 찾을 수 없어요</h1><p>주소가 바뀌었거나 비공개로 바뀐 페이지예요. <a href="/">arttan 홈으로 가기</a></p></article>`
  };
}

function fill(D, pg, isSub) {
  return template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, `<!--seo-->\n${pg.head}\n<!--/seo-->`)
    .replace("<!--ssr-->", pg.body ? `${isSub ? `<style id="ssrCss">[data-view]{display:none!important}</style>` : ""}${pg.body}` : "")
    .replace("<!--footdir-->", footDir(D));
}

/* ---------- 사이트맵 · RSS ---------- */
function sitemap(D) {
  const urls = Object.keys(D.seoPages());
  const imgs = {};
  D.ARTISTS.filter(D.artistIndexable).forEach(a => {
    a.photos && a.works.forEach((w, i) => imgs[D.workPath(a.id, i)] = [abs(a.photos[i % a.photos.length]), workAlt(a, w)]);
    if (!a.photos && a.portraits) imgs[D.artistPath(a.id)] = [abs(a.portraits[0]), `${a.name} 작가`];
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `<url><loc>${e(SITE + u)}</loc>${imgs[u] ? `<image:image><image:loc>${e(imgs[u][0])}</image:loc><image:title>${e(imgs[u][1])}</image:title></image:image>` : ""}</url>`).join("\n")}
</urlset>
`;
}
function rss(D) {
  const xs = D.EXHIBITIONS.filter(D.exIndexable).sort((x, y) => y.start.localeCompare(x.start));
  const as = D.ARTISTS.filter(D.artistIndexable);
  const item = (title, p, desc) => `<item><title>${e(title)}</title><link>${e(SITE + p)}</link><guid>${e(SITE + p)}</guid><description>${e(desc)}</description></item>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>arttan 아트탄 — 작가 아카이브 새 소식</title><link>${SITE}/</link><language>ko</language>
<description>원로·중견·청년 작가의 전시 소식과 작가 아카이브</description>
${xs.map(x => item(D.exHeadline(x), D.exPath(x), `${dotted(x.start)} – ${dotted(x.end)} · ${x.venue}. ${x.desc || ""}`)).join("\n")}
${as.map(a => item(`${D.artistHeadline(a)}`, D.artistPath(a.id), cut(`${a.line || ""} ${a.bio || ""}`, 200))).join("\n")}
</channel></rss>
`;
}

/* 주소 → 페이지 종류 */
export function parsePath(pathname) {
  let m;
  const p = decodeURIComponent(pathname.replace(/\/+$/, "")) || "/";
  if (p === "/") return { t: "home" };
  if ((m = /^\/artist\/([^/]+)\/work\/(\d+)$/.exec(p))) return { t: "work", id: m[1], n: m[2] };
  if ((m = /^\/artist\/([^/]+)$/.exec(p))) return { t: "artist", id: m[1] };
  if ((m = /^\/gallery\/([^/]+)$/.exec(p))) return { t: "gallery", id: m[1] };
  if ((m = /^\/exhibition\/([^/]+)$/.exec(p))) return { t: "exhibition", id: m[1] };
  if ((m = /^\/book\/([^/]+)$/.exec(p))) return { t: "book", id: m[1] };
  if ((m = /^\/review\/([^/]+)$/.exec(p))) return { t: "review", id: m[1] };
  if (p === "/sitemap.xml") return { t: "sitemap" };
  if (p === "/rss.xml") return { t: "rss" };
  return null;
}

/* 페이지 만들기: { status, type, body } */
export async function render({ t, id, n }) {
  const D = await loadData();
  const html = (status, pg, sub = true) => ({ status, type: "text/html; charset=utf-8", body: fill(D, pg, sub) });
  if (t === "sitemap") return { status: 200, type: "application/xml; charset=utf-8", body: sitemap(D) };
  if (t === "rss") return { status: 200, type: "application/rss+xml; charset=utf-8", body: rss(D) };
  if (t === "home") return html(200, pageHome(D), false);
  const a = D.byId[id];
  if (t === "artist" && a && !a.hidden) return html(200, pageArtist(D, a));
  if (t === "work" && a && !a.hidden && a.works[+n - 1]) return html(200, pageWork(D, a, +n - 1));
  if (t === "gallery" && D.galById[id]) return html(200, pageGallery(D, D.galById[id]));
  const x = D.EXHIBITIONS.find(x => x.id === id);
  if (t === "exhibition" && x) return html(200, pageExhibition(D, x));
  const bk = t === "book" && D.BOOKS.find(b => b.id === id);
  if (bk && D.byId[bk.artist] && !D.byId[bk.artist].hidden) return html(200, pageBook(D, bk));
  const rv = t === "review" && D.REVIEWS.find(r => r.id === id && !r.hidden);
  if (rv && D.reviewArtists(rv).some(a => !D.byId[a].hidden)) return html(200, pageReview(D, rv));
  return html(404, pageNotFound());
}

/* 렌더링이 실패해도 사이트는 떠야 해요: 기본 템플릿 그대로 */
export function fallbackHtml() { return template || read("app.html"); }
