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

/* 로그인한 회원의 토큰이 진짜인지 확인하고 회원 id 를 돌려줘요 */
async function verifyUser(token) {
  if (!token || !SB_URL() || !SB_KEY()) return null;
  try { const r = await fetch(`${SB_URL()}/auth/v1/user`, { headers: { apikey: SB_KEY(), Authorization: `Bearer ${token}` } }); if (!r.ok) return null; const u = await r.json(); return u && u.id ? u.id : null; } catch { return null; }
}
async function insert(table, row, token) {
  if (!SB_URL() || !SB_KEY()) return false;
  const r = await fetch(`${SB_URL()}/rest/v1/${table}`, {
    method: "POST", headers: { apikey: SB_KEY(), Authorization: `Bearer ${token || SB_KEY()}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row)
  });
  if (!r.ok) { console.error(`${table} 저장 실패`, r.status, await r.text()); return false; }
  return true;
}

const kst = () => new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });

export async function handleSubmit(body, { ip = "", dryRun = false, userToken = "" } = {}) {
  let useToken = "";
  if (!body || typeof body !== "object") return { status: 400, error: "잘못된 요청이에요" };
  if (body.website) return { status: 200, stored: false, notified: false };   // 사람에게는 안 보이는 칸(로봇 막기)
  if (tooMany(ip || "?")) return { status: 429, error: "잠시 뒤 다시 보내 주세요" };
  const d = body.data || {};
  let table, row, msg;
  if (body.kind === "application") {
    /* 작품 사진: 사이트가 비공개 저장소(applications)에 먼저 올리고, 그 경로만 받아요 (최대 5장, 정해진 모양의 경로만) */
    const photos = (Array.isArray(d.photos) ? d.photos : []).map(x => String(x)).filter(x => /^pending\/[0-9a-f-]{36}\/[0-4]\.(jpg|png|webp)$/.test(x)).slice(0, 5);
    row = { name: str(d.name, 60), born: Number(d.born) || null, genre: str(d.genre, 30), city: str(d.city, 60), email: str(d.email, 120), note: str(d.note, 2000), photos };
    if (!row.name || !okMail(row.email)) return { status: 400, error: "이름과 이메일을 확인해 주세요" };
    table = "applications";
    /* 로그인한 상태로 신청하면 승인 때 작가 계정이 자동으로 연결돼요 */
    const uid = await verifyUser(userToken); if (uid) { row.user_id = uid; useToken = userToken; }
    msg = `<b>[arttan] 새 작가 등록 신청</b>\n\n이름: ${tgEsc(row.name)}${row.born ? ` (${row.born}년생)` : ""}\n장르: ${tgEsc(row.genre)}${row.city ? `\n지역: ${tgEsc(row.city)}` : ""}\n이메일: ${tgEsc(row.email)}${row.note ? `\n\n${tgEsc(row.note)}` : ""}${row.photos.length ? `\n작품 사진: ${row.photos.length}장 (관리자 → 등록 신청에서 보기)` : ""}`;
  } else if (body.kind === "inquiry") {
    row = { artist_id: str(d.artist_id, 40) || null, name: str(d.name, 60), email: str(d.email, 120), type: str(d.type, 120), message: str(d.message, 4000) };
    if (!row.name || !okMail(row.email) || !row.message) return { status: 400, error: "이름, 이메일, 내용을 확인해 주세요" };
    table = "inquiries";
    let who = "";
    if (row.artist_id) { try { const D = await loadData(); const a = D.byId[row.artist_id]; if (!a) row.artist_id = null; else who = a.name; } catch { /* 이름 없이 보내요 */ } }
    const svc = row.type.startsWith("서비스");
    msg = `<b>[arttan] ${svc ? "촬영·제작 서비스 문의" : `${tgEsc(who || "작가")} 작가 문의`}</b>\n\n유형: ${tgEsc(row.type || "문의")}\n이름: ${tgEsc(row.name)}\n이메일: ${tgEsc(row.email)}\n\n${tgEsc(row.message)}`;
  } else if (body.kind === "claim") {
    /* 작가 계정 연결 신청: 로그인한 회원만. 관리자가 승인하면 그 작가 공간을 직접 관리해요 */
    const uid = await verifyUser(userToken);
    if (!uid) return { status: 401, error: "로그인한 뒤 신청해 주세요" };
    row = { user_id: uid, artist_id: str(d.artist_id, 40), note: str(d.note, 1000) || null, status: "pending" };
    let who = "";
    try { const D = await loadData(); const a = D.byId[row.artist_id]; if (!a) return { status: 400, error: "작가를 찾지 못했어요" }; who = a.name; } catch { /* 이름 없이 */ }
    table = "artist_members"; useToken = userToken;
    msg = `<b>[arttan] ${tgEsc(who || row.artist_id)} 작가 계정 연결 신청</b>\n\n회원: ${tgEsc(str(d.nickname, 40) || "닉네임 없음")}${d.email ? ` (${tgEsc(str(d.email, 120))})` : ""}${row.note ? `\n\n${tgEsc(row.note)}` : ""}\n\n본인 확인 후 관리자 → 작가 계정에서 승인해 주세요.`;
  } else if (body.kind === "update") {
    /* 작가 정보 수정·작품 추가 요청: 사진(최대 10장)·영상은 사이트가 비공개 저장소에 먼저 올리고 경로만 받아요 */
    const photos = (Array.isArray(d.photos) ? d.photos : []).map(x => String(x)).filter(x => /^updates\/[0-9a-f-]{36}\/[0-9]\.(jpg|png|webp)$/.test(x)).slice(0, 10);
    const vp = String(d.video_path || ""), vu = str(d.video_url, 500);
    row = { artist_id: str(d.artist_id, 40) || null, name: str(d.name, 60), email: str(d.email, 120), message: str(d.message, 3000), photos,
      video_url: /^https:\/\//.test(vu) ? vu : null, video_path: /^updates\/[0-9a-f-]{36}\/video\.(mp4|mov|webm)$/.test(vp) ? vp : null };
    if (!row.name || !row.email || (!row.message && !photos.length && !row.video_url && !row.video_path)) return { status: 400, error: "이름, 연락처, 요청 내용을 확인해 주세요" };
    table = "artist_requests";
    let who = "";
    if (row.artist_id) { try { const D = await loadData(); const a = D.byId[row.artist_id]; if (!a) row.artist_id = null; else who = a.name; } catch { /* 이름 없이 보내요 */ } }
    const att = [photos.length ? `사진 ${photos.length}장` : "", row.video_url ? "영상 주소" : "", row.video_path ? "영상 파일" : ""].filter(Boolean).join(" · ");
    msg = `<b>[arttan] ${tgEsc(who || "작가")} 정보 수정·추가 요청</b>\n\n요청한 분: ${tgEsc(row.name)}\n연락처: ${tgEsc(row.email)}${att ? `\n첨부: ${att}` : ""}${row.message ? `\n\n${tgEsc(row.message)}` : ""}`;
  } else return { status: 400, error: "알 수 없는 종류예요" };

  const stored = dryRun ? false : await insert(table, row, useToken);
  const tg = await sendTelegram(`${msg}\n\n<i>${kst()} · ${stored ? "관리자 화면에 저장됨" : "DB 미연결 — 이 알림이 유일한 기록이에요"}</i>\n${SITE}/admin`, { dryRun });
  return { status: 200, stored, notified: !!tg.sent, telegram: telegramReady() };
}
