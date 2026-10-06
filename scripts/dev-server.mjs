// 로컬 개발 서버: Vercel과 같은 주소 규칙(/artist/<id> 등)으로 사이트를 띄워요.  npm run dev → http://localhost:8799
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { render, parsePath } from "../lib/site.mjs";
import { submitUrls } from "../lib/indexnow.mjs";
import { handleSubmit } from "../lib/submit.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
process.env.ARTTAN_DEV = "1";   // 파일을 고치면 바로 반영되게 캐시를 끕니다
const PORT = +process.env.PORT || 8799;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

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
    const route = parsePath(u.pathname);
    if (route) {
      const r = await render(route);
      res.writeHead(r.status, { "Content-Type": r.type, "Cache-Control": "no-store" }); return res.end(r.body);
    }
    let f = path.join(root, decodeURIComponent(u.pathname));
    if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";   // cleanUrls: /admin → admin.html
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("없는 파일이에요"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(f).pipe(res);
  } catch (err) {
    console.error(err); res.writeHead(500); res.end(String(err));
  }
}).listen(PORT, () => console.log(`arttan 로컬 서버: http://localhost:${PORT}`));
