// 매일 아침 자동 수집 (vercel.json crons). Vercel 이 CRON_SECRET 으로 호출해요.
// 필요한 환경변수: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY (서버 전용 — 브라우저·config.js 에는 절대 넣지 않아요)
import { runCrawl, serviceAuth } from "../lib/crawl-job.mjs";

export const config = { maxDuration: 300 };
export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(obj)); };
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return send(401, { error: "unauthorized" });
  const auth = serviceAuth(); if (!auth) return send(200, { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY 가 없어서 자동 수집을 건너뛰었어요" });
  try { send(200, await runCrawl(auth, { notify: true })); }
  catch (err) { console.error("자동 수집 실패", err); send(500, { error: err.message }); }
}
