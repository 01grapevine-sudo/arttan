// 텔레그램 chat id 찾기: 봇에게 아무 메시지나 보낸 뒤 실행하세요.
//   TELEGRAM_BOT_TOKEN=봇토큰 node scripts/telegram-chatid.mjs
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error("TELEGRAM_BOT_TOKEN=봇토큰 node scripts/telegram-chatid.mjs 로 실행해 주세요"); process.exit(1); }
const r = await (await fetch(`https://api.telegram.org/bot${token}/getUpdates`)).json();
if (!r.ok) { console.error("토큰을 확인해 주세요:", r.description); process.exit(1); }
const seen = new Map();
for (const u of r.result) { const c = (u.message || u.channel_post || u.my_chat_member || {}).chat; if (c) seen.set(c.id, c.title || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.username); }
if (!seen.size) console.log("아직 받은 메시지가 없어요. 텔레그램에서 봇에게 아무 말이나 보낸 뒤 다시 실행해 주세요.");
for (const [id, name] of seen) console.log(`chat id: ${id}   (${name})`);
