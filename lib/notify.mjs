// 텔레그램 알림: 문의·신청 등 새 소식이 생기면 관리자 텔레그램으로 보내요.
// Vercel 환경변수 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 가 있어야 해요 (브라우저에는 절대 넣지 않아요).
// 여러 사람이 받으려면 TELEGRAM_CHAT_ID 에 쉼표로 여러 개를 넣거나, 봇을 넣은 단체방의 id를 쓰세요.
const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || "";
const CHATS = () => (process.env.TELEGRAM_CHAT_ID || "").split(",").map(s => s.trim()).filter(Boolean);
export const telegramReady = () => !!(TOKEN() && CHATS().length);

export const tgEsc = s => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* text: 텔레그램 HTML 형식(<b>, <i>, <a>) — 사용자가 쓴 글은 반드시 tgEsc 로 감싸요 */
export async function sendTelegram(text, { dryRun = false } = {}) {
  if (dryRun || !telegramReady()) { console.log("[텔레그램 알림 · 시험]\n" + text.replace(/<[^>]+>/g, "")); return { sent: false, dryRun: true }; }
  const res = await Promise.all(CHATS().map(chat_id =>
    fetch(`${process.env.TELEGRAM_API || "https://api.telegram.org"}/bot${TOKEN()}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: text.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true })
    }).then(async r => ({ ok: r.ok, status: r.status, body: r.ok ? "" : await r.text() }), e => ({ ok: false, error: String(e) }))));
  res.filter(r => !r.ok).forEach(r => console.error("텔레그램 전송 실패", r));
  return { sent: res.some(r => r.ok) };
}
