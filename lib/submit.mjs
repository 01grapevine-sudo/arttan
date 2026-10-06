// 사이트에서 보내는 신청·문의를 받아요: Supabase에 저장(연결돼 있으면) + 텔레그램 알림.
// 종류: application(작가 등록 신청) · inquiry(작가 문의 · 촬영·제작 서비스 문의)
import { sendTelegram, telegramReady, tgEsc } from "./notify.mjs";
import { loadData, SITE } from "./site.mjs";

const SB_URL = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SB_KEY = () => process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const str = (v, n) => String(v ?? "").trim().slice(0, n);
const okMail = m => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);

/* 아주 간단한 도배 막기: 같은 주소(IP)에서 10분에 8건까지 */
const hits = new Map();
function tooMany(ip) {
  const now = Date.now(), L = (hits.get(ip) || []).filter(t => now - t < 600_000);
  L.push(now); hits.set(ip, L); return L.length > 8;
}

async function insert(table, row) {
  if (!SB_URL() || !SB_KEY()) return false;
  const r = await fetch(`${SB_URL()}/rest/v1/${table}`, {
    method: "POST", headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row)
  });
  if (!r.ok) { console.error(`${table} 저장 실패`, r.status, await r.text()); return false; }
  return true;
}

const kst = () => new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });

export async function handleSubmit(body, { ip = "", dryRun = false } = {}) {
  if (!body || typeof body !== "object") return { status: 400, error: "잘못된 요청이에요" };
  if (body.website) return { status: 200, stored: false, notified: false };   // 사람에게는 안 보이는 칸(로봇 막기)
  if (tooMany(ip || "?")) return { status: 429, error: "잠시 뒤 다시 보내 주세요" };
  const d = body.data || {};
  let table, row, msg;
  if (body.kind === "application") {
    row = { name: str(d.name, 60), born: Number(d.born) || null, genre: str(d.genre, 30), city: str(d.city, 60), email: str(d.email, 120), note: str(d.note, 2000) };
    if (!row.name || !okMail(row.email)) return { status: 400, error: "이름과 이메일을 확인해 주세요" };
    table = "applications";
    msg = `<b>[arttan] 새 작가 등록 신청</b>\n\n이름: ${tgEsc(row.name)}${row.born ? ` (${row.born}년생)` : ""}\n장르: ${tgEsc(row.genre)}${row.city ? `\n지역: ${tgEsc(row.city)}` : ""}\n이메일: ${tgEsc(row.email)}${row.note ? `\n\n${tgEsc(row.note)}` : ""}`;
  } else if (body.kind === "inquiry") {
    row = { artist_id: str(d.artist_id, 40) || null, name: str(d.name, 60), email: str(d.email, 120), type: str(d.type, 120), message: str(d.message, 4000) };
    if (!row.name || !okMail(row.email) || !row.message) return { status: 400, error: "이름, 이메일, 내용을 확인해 주세요" };
    table = "inquiries";
    let who = "";
    if (row.artist_id) { try { const D = await loadData(); const a = D.byId[row.artist_id]; if (!a) row.artist_id = null; else who = a.name; } catch { /* 이름 없이 보내요 */ } }
    const svc = row.type.startsWith("서비스");
    msg = `<b>[arttan] ${svc ? "촬영·제작 서비스 문의" : `${tgEsc(who || "작가")} 작가 문의`}</b>\n\n유형: ${tgEsc(row.type || "문의")}\n이름: ${tgEsc(row.name)}\n이메일: ${tgEsc(row.email)}\n\n${tgEsc(row.message)}`;
  } else return { status: 400, error: "알 수 없는 종류예요" };

  const stored = dryRun ? false : await insert(table, row);
  const tg = await sendTelegram(`${msg}\n\n<i>${kst()} · ${stored ? "관리자 화면에 저장됨" : "DB 미연결 — 이 알림이 유일한 기록이에요"}</i>\n${SITE}/admin`, { dryRun });
  return { status: 200, stored, notified: !!tg.sent, telegram: telegramReady() };
}
