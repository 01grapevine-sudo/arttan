// 관리자 화면에서 저장한 뒤 바뀐 페이지 주소를 받아 검색엔진에 알려요. 관리자 로그인 토큰이 있어야 해요.
import { submitUrls, isAdminToken } from "../lib/indexnow.mjs";

export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
  if (req.method !== "POST") return send(405, { error: "POST 로 보내 주세요" });
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    if (!(await isAdminToken(token))) return send(403, { error: "관리자만 보낼 수 있어요" });
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body || "{}");
    send(200, await submitUrls(body && body.urls));
  } catch (err) {
    console.error("IndexNow 실패", err);
    send(500, { error: "검색엔진에 알리지 못했어요" });
  }
}
