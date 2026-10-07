// Vercel 빌드 때 실행: 환경변수 SUPABASE_URL, SUPABASE_ANON_KEY 로 config.js 를 만들어요.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!url || !key) console.warn("⚠️  SUPABASE_URL / SUPABASE_ANON_KEY 가 없어서 예시 데이터 모드로 배포돼요.");
// JWT 안의 role 을 확인해서 service_role(관리자 전권) 키가 브라우저로 새지 않게 막아요.
let role = "";
try { role = JSON.parse(Buffer.from((key.split(".")[1] || ""), "base64url").toString()).role || ""; } catch { /* 새 형식 키 */ }
if (role === "service_role" || /service_role|^sb_secret_/.test(key)) { console.error("❌ service_role(secret) 키는 넣으면 안 돼요. anon(public) 키를 넣어 주세요."); process.exit(1); }

fs.writeFileSync(path.join(root, "config.js"),
  `/* 자동 생성: scripts/build-config.mjs */\nwindow.ARTTAN_CONFIG = ${JSON.stringify({ supabaseUrl: url, supabaseAnonKey: key, vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "" }, null, 2)};\n`);
console.log(`config.js 생성 완료 (${url ? "Supabase 연결" : "예시 데이터"})`);
