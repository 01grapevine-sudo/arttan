// 사이트의 작가 등록 신청·작가 문의·서비스 문의를 받아 저장하고 텔레그램으로 알려요.
import { handleSubmit } from "../lib/submit.mjs";

export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
  if (req.method !== "POST") return send(405, { error: "POST 로 보내 주세요" });
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body || "{}");
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const r = await handleSubmit(body, { ip });
    send(r.status, r);
  } catch (err) {
    console.error("접수 실패", err);
    send(500, { error: "접수하지 못했어요" });
  }
}
