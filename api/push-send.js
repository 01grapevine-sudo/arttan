// 관리자가 전시를 등록하면 그 작가를 관심 작가로 둔 사람들에게 알림을 보내요. (관리자 로그인 토큰 필요)
import { sendExhibitionPush, isAdminToken, vapidCheck } from "../lib/push.mjs";
import { userAuth } from "../lib/crawl-job.mjs";

export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
  /* GET: 알림 키 설정 점검 (맞는지 여부만 알려줘요) */
  if (req.method === "GET") return send(200, vapidCheck());
  if (req.method !== "POST") return send(405, { error: "POST 로 보내 주세요" });
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    if (!(await isAdminToken(token))) return send(401, { error: "관리자만 보낼 수 있어요" });
    let body = req.body; if (typeof body === "string") body = JSON.parse(body || "{}");
    const id = String(body?.exhibitionId || "").slice(0, 80);
    if (!id) return send(400, { error: "전시를 골라 주세요" });
    const kind = ["new", "open-1", "end-3"].includes(body?.kind) ? body.kind : "new";
    send(200, await sendExhibitionPush(userAuth(token), id, kind, { force: !!body?.force }));
  } catch (err) {
    console.error("알림 발송 실패", err);
    send(500, { error: "알림을 보내지 못했어요" });
  }
}
