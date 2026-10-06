// 관리자 '수집' 버튼: 전시장 한 곳(galleryId) 또는 전체를 수집해 '수집한 전시'에 쌓아요.
// {url} 만 보내면 저장하지 않고 미리보기 결과만 돌려줘요. 관리자 로그인 토큰이 있어야 해요.
import { isAdminToken } from "../lib/indexnow.mjs";
import { crawlVenue } from "../lib/crawl.mjs";
import { runCrawl, userAuth } from "../lib/crawl-job.mjs";

export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
  if (req.method !== "POST") return send(405, { error: "POST 로 보내 주세요" });
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    if (!(await isAdminToken(token))) return send(403, { error: "관리자로 로그인해야 수집할 수 있어요 (Supabase 연결 필요)" });
    let body = req.body; if (typeof body === "string") body = JSON.parse(body || "{}");
    if (body?.url) return send(200, await crawlVenue(body.url));
    send(200, await runCrawl(userAuth(token), { galleryId: body?.galleryId || null }));
  } catch (err) { console.error("수집 실패", err); send(500, { error: "수집하지 못했어요: " + err.message }); }
}
