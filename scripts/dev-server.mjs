// 로컬 개발 서버: Vercel과 같은 주소 규칙(/artist/<id> 등)으로 사이트를 띄워요.  npm run dev → http://localhost:8799
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render, parsePath } from "../lib/site.mjs";
import { submitUrls } from "../lib/indexnow.mjs";
import { handleSubmit } from "../lib/submit.mjs";
import { crawlVenue } from "../lib/crawl.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.ARTLIST_DEV = "1";   // 파일을 고치면 바로 반영되게 캐시를 끕니다
const PORT = +process.env.PORT || 8799;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

const NEXT = process.env.NEXT_ORIGIN || "http://localhost:3100";
async function proxyNext(req, res, pathAndQuery) {
  let body; if (!["GET", "HEAD"].includes(req.method)) { const ch = []; for await (const c of req) ch.push(c); body = Buffer.concat(ch) }
  const h = { ...req.headers }; delete h.host; delete h.connection;
  try {
    const r = await fetch(NEXT + pathAndQuery, { method: req.method, headers: h, body, redirect: "manual" });
    const out = {}; r.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) out[k] = v });
    if (out.location) out.location = out.location.split(", ")[0].replace(NEXT, "");
    res.writeHead(r.status, out); res.end(Buffer.from(await r.arrayBuffer()));
  } catch { res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" }); res.end("새 작가 홈페이지 앱(localhost:3100)이 꺼져 있어요") }
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (u.pathname === "/api/indexnow" && req.method === "POST") {
      let b = ""; for await (const c of req) b += c;
      const r = await submitUrls(JSON.parse(b || "{}").urls, { dryRun: true });
      console.log("[IndexNow 시험] 알릴 주소:", r.urlList || []);
      res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(r));
    }
    if (u.pathname === "/api/submit" && req.method === "POST") {
      let b = ""; for await (const c of req) b += c;
      // 로컬: TELEGRAM_BOT_TOKEN·TELEGRAM_CHAT_ID 가 있으면 실제로 보내고, 없으면 콘솔에만 찍어요
      const r = await handleSubmit(JSON.parse(b || "{}"), { ip: "local" });
      res.writeHead(r.status, { "Content-Type": "application/json" }); return res.end(JSON.stringify(r));
    }
    if (u.pathname === "/api/crawl" && req.method === "POST") {
      // 로컬: 관리자 로그인 없이 주소(url)를 바로 읽어 결과만 돌려줘요 (저장은 관리자 화면이 이 브라우저에 해요)
      let b = ""; for await (const c of req) b += c; const body = JSON.parse(b || "{}");
      const r = body.url ? await crawlVenue(body.url) : { ok: false, error: "로컬에서는 전시장마다 주소로 수집해요" };
      res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(r));
    }
    /* ARTLIST_SB=1: 로컬에서도 실제 Supabase로 (새 앱 .env.local 의 공개 주소·anon 키를 읽어요) */
    if (u.pathname === "/config.js" && process.env.ARTLIST_SB === "1") {
      const env = Object.fromEntries(fs.readFileSync(path.join(root, "../artlist-next/.env.local"), "utf8").split("\n").filter(l => /^NEXT_PUBLIC_SUPABASE_/.test(l)).map(l => l.split("=").map((x, i) => i ? x.trim() : x)).map(([k, ...v]) => [k, v.join("=")]));
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(`window.ARTLIST_CONFIG=${JSON.stringify({ supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL, supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY })};`);
    }
    /* vercel.json 과 같게: 작가 페이지·없는 주소는 새 작가 홈페이지 앱(로컬 3100)으로 넘겨요 */
    const am = u.pathname.match(/^\/artist\/([^/]+)(\/work\/\d+)?\/?$/);
    if (am) { if (am[2]) { res.writeHead(307, { Location: `/artist/${am[1]}` }); return res.end() } return proxyNext(req, res, `/${am[1]}${u.search}`) }
    if (u.pathname.startsWith("/_next/")) return proxyNext(req, res, u.pathname + u.search);
    const route = parsePath(u.pathname);
    if (route) {
      const r = await render(route);
      res.writeHead(r.status, { "Content-Type": r.type, "Cache-Control": "no-store" }); return res.end(r.body);
    }
    let f = path.join(root, decodeURIComponent(u.pathname));
    if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";   // cleanUrls: /admin → admin.html
    if ((!fs.existsSync(f) || fs.statSync(f).isDirectory()) && u.pathname !== "/") return proxyNext(req, res, u.pathname + u.search);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("없는 파일이에요"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(f).pipe(res);
  } catch (err) {
    console.error(err); res.writeHead(500); res.end(String(err));
  }
}).listen(PORT, () => console.log(`artlist 로컬 서버: http://localhost:${PORT}`));
