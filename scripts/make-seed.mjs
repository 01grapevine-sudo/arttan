// 지금 사이트의 데이터(core.js + artists/*/artist.js)를 Supabase용 seed.sql 로 바꿔요.
// 실행: node scripts/make-seed.mjs  → supabase/seed.sql
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const html = fs.readFileSync(path.join(root, "app.html"), "utf8");
const artistFiles = [...html.matchAll(/<script src="(artists\/[^"?]+\.js)(?:\?[^"]*)?"><\/script>/g)].map(m => m[1]);

const code =
  fs.readFileSync(path.join(root, "core.js"), "utf8") + "\n" +
  artistFiles.map(f => fs.readFileSync(path.join(root, f), "utf8")).join("\n") +
  "\nfinishArtists();\n({ARTISTS, INTERVIEWS, VIDEOS, BOOKS, GALLERIES, EXHIBITIONS, NOTICES});";
const ctx = vm.createContext({ console, Date, Math, JSON, Promise, setTimeout, clearTimeout });
const D = vm.runInContext(code, ctx);

// 외부 아카이브(예: DA-Arts) 자료를 쓰는 작가는 사용 허락을 받은 뒤 공개해요.
// 정명희 작가 자료는 2026-09-30 사용 허락 완료. 허락 전 작가를 비공개로 넣으려면: ALLOW_LICENSED=0 node scripts/make-seed.mjs
const ALLOW_LICENSED = process.env.ALLOW_LICENSED !== "0";
const q = v => v === null || v === undefined || v === "" ? "null" : `'${String(v).replaceAll("'", "''")}'`;
const n = v => (v === null || v === undefined || v === "" || isNaN(+v)) ? "null" : String(+v);
const arr = a => a && a.length ? `array[${a.map(q).join(",")}]::text[]` : "'{}'::text[]";
const js = v => v === null || v === undefined ? "null" : `${q(JSON.stringify(v))}::jsonb`;
const b = v => v ? "true" : "false";

const out = ["-- arttan 초기 데이터 (scripts/make-seed.mjs 로 생성). schema.sql 다음에 실행하세요.", "begin;",
  "delete from public.works; delete from public.interviews; delete from public.videos; delete from public.books;",
  "delete from public.exhibitions; delete from public.artists; delete from public.galleries; delete from public.notices;"];

D.ARTISTS.forEach((a, i) => {
  out.push(`insert into public.artists (id,name,en,tier,genre,more,tags,born,birthplace,city,quote,line,bio,cv,history,collections,pubs,source,sources,aka,portraits,portrait_focus,works_total,style,pal,is_real,hidden,sort) values (` +
    [q(a.id), q(a.name), q(a.en), q(a.tier), q(a.genre), arr(a.more), arr(a.tags), n(a.born), q(a.from), q(a.city), q(a.quote), q(a.line), q(a.bio),
     js(a.cv || []), js(a.history || []), q(a.collections), arr(a.books), js(a.source || null), js(a.sources || []), arr(a.aka), arr(a.portraits), a.portraitFocus ? `array[${a.portraitFocus.join(",")}]::real[]` : "null", n(a.worksTotal), q(a.style), arr(a.pal), b(a.real), b(a.hidden || ((a.source || a.sources) && !ALLOW_LICENSED)), (i + 1) * 10].join(",") + ");");
  (a.works || []).forEach((w, k) => {
    const img = a.photos ? a.photos[k % a.photos.length] : null;
    out.push(`insert into public.works (artist_id,sort,title,year,material,size,description,image_path) values (` +
      [q(a.id), k, q(w[0]), q(w[1]), q(w[2]), q(w[3]), q(w[4]), q(img)].join(",") + ");");
  });
});
D.INTERVIEWS.forEach(v => out.push(`insert into public.interviews (artist_id,title,date,lead,qa) values (${[q(v.artist), q(v.title), q(v.date), q(v.lead), js(v.qa || [])].join(",")});`));
Object.entries(D.VIDEOS).forEach(([id, v]) => out.push(`insert into public.videos (artist_id,title,len,date,place,url) values (${[q(id), q(v.title), q(v.len), q(v.date), q(v.place), q(v.url)].join(",")});`));
D.BOOKS.forEach(bk => out.push(`insert into public.books (artist_id,title,year,pages,size,writer,price) values (${[q(bk.artist), q(bk.title), n(bk.year), n(bk.pages), q(bk.size), q(bk.writer), q(bk.price)].join(",")});`));
D.GALLERIES.forEach((g, i) => out.push(`insert into public.galleries (id,name,area,addr,hours,tel,site,intro,sort) values (${[q(g.id), q(g.name), q(g.area), q(g.addr), q(g.hours), q(g.tel), q(g.site), q(g.intro), (i + 1) * 10].join(",")});`));
D.EXHIBITIONS.forEach((e, i) => out.push(`insert into public.exhibitions (id,gallery_id,title,kind,start_date,end_date,artists,description) values (${[q(e.id || `ex${String(i + 1).padStart(2, "0")}`), q(e.g), q(e.title), q(e.kind), q(e.start), q(e.end), arr(e.artists), q(e.desc)].join(",")});`));
[...D.NOTICES].reverse().forEach(nt => out.push(`insert into public.notices (tag,title,body,date) values (${[q(nt.tag), q(nt.title), q(nt.body), q(nt.date)].join(",")});`));
out.push("commit;");

fs.writeFileSync(path.join(root, "supabase", "seed.sql"), out.join("\n") + "\n");
console.log(`seed.sql: 작가 ${D.ARTISTS.length} · 작품 ${D.ARTISTS.reduce((s, a) => s + a.works.length, 0)} · 인터뷰 ${D.INTERVIEWS.length} · 도록 ${D.BOOKS.length} · 갤러리 ${D.GALLERIES.length} · 전시 ${D.EXHIBITIONS.length} · 공지 ${D.NOTICES.length}`);
