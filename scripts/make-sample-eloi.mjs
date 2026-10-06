// 테스트용 가상 작가 '엘로이'의 샘플 이미지를 직접 그려요 (작품 8점, 전시 포스터 2장, 도록 표지 1장, 펼침면 4장, 테스트 갤러리 전경 1장).
// 외부 이미지를 쓰지 않아서 저작권 문제가 없어요.  실행: node scripts/make-sample-eloi.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = p => path.join(root, "artists/eloi", p);
const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const PALS = [
  ["#F3EEE4", "#E8B4A0", "#7C3AED", "#2E2A5A", "#F2C66D"],
  ["#EDF2EF", "#8FB9A8", "#2F5D62", "#F4A261", "#264653"],
  ["#F6F0F7", "#C9A7EB", "#5B3E96", "#F7D9C4", "#1F1B3A"],
  ["#FBF3E4", "#E76F51", "#2A9D8F", "#E9C46A", "#264653"],
];
export const TITLES = ["빛이 머무는 자리", "정원의 오후", "물결 위의 원", "새벽의 방", "느린 바람", "겹쳐진 시간", "보랏빛 숨", "작은 우주"];

/* 작품: 색면 + 겹치는 원 + 붓자국 같은 곡선 */
function artwork(i, W = 1600, H = 1200) {
  const r = rng(1000 + i * 97), P = PALS[i % PALS.length];
  let s = `<rect width="${W}" height="${H}" fill="${P[0]}"/>`;
  s += `<rect x="0" y="${H * (0.55 + r() * 0.15)}" width="${W}" height="${H}" fill="${P[1]}" opacity=".55"/>`;
  for (let k = 0; k < 7; k++) {
    const cx = W * (0.15 + r() * 0.7), cy = H * (0.15 + r() * 0.7), rad = Math.min(W, H) * (0.08 + r() * 0.22);
    s += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${P[1 + (k % 4)]}" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`;
  }
  for (let k = 0; k < 5; k++) {
    const y = H * (0.1 + r() * 0.8);
    s += `<path d="M ${-50} ${y} C ${W * 0.3} ${y - 160 * r()}, ${W * 0.6} ${y + 200 * r()}, ${W + 50} ${y - 80}" stroke="${P[3]}" stroke-width="${4 + r() * 14}" fill="none" opacity=".55" stroke-linecap="round"/>`;
  }
  s += `<circle cx="${W * (0.6 + r() * 0.3)}" cy="${H * (0.15 + r() * 0.2)}" r="${40 + r() * 40}" fill="${P[4]}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`;
}
const FONT = `font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif"`;
const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function main() {
  for (const [i] of TITLES.entries()) {
    const W = i % 3 === 1 ? 1200 : 1600, H = i % 3 === 1 ? 1600 : 1200;
    await sharp(Buffer.from(artwork(i, W, H))).jpeg({ quality: 86 }).toFile(out(`works/${String(i + 1).padStart(2, "0")}.jpg`));
  }
  /* 전시 포스터 (1200×1600) */
  const poster = async (file, wi, title, date, kind) => {
    const art = await sharp(Buffer.from(artwork(wi, 1200, 1050))).png().toBuffer();
    const txt = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#14112B"/>
      <text x="80" y="1180" ${FONT} font-size="44" fill="#C4B5FD" font-weight="700">엘로이 ${kind}</text>
      <text x="80" y="1290" ${FONT} font-size="104" fill="#FFFFFF" font-weight="800">${esc(title)}</text>
      <text x="80" y="1400" ${FONT} font-size="46" fill="#E9E3FF">${esc(date)}</text>
      <text x="80" y="1470" ${FONT} font-size="40" fill="#B9AEDB">arttan 테스트 갤러리 · 인사동</text>
      <text x="1120" y="1530" ${FONT} font-size="28" fill="#7D6FB0" text-anchor="end">테스트용 샘플 · arttan</text></svg>`;
    await sharp(Buffer.from(txt)).composite([{ input: art, top: 0, left: 0 }]).jpeg({ quality: 86 }).toFile(out(file));
  };
  await poster("posters/2026-light.jpg", 0, "빛이 머무는 자리", "2026.11.01 – 11.07", "개인전");
  await poster("posters/2025-garden.jpg", 1, "정원의 오후", "2025.05.03 – 05.25", "개인전");
  /* 도록 표지 (1200×1600) */
  const cart = await sharp(Buffer.from(artwork(6, 900, 900))).png().toBuffer();
  const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#F3EEE4"/>
    <text x="150" y="1270" ${FONT} font-size="96" fill="#2E2A5A" font-weight="800">빛이 머무는 자리</text>
    <text x="150" y="1360" ${FONT} font-size="48" fill="#5B3E96">엘로이 Eloi</text>
    <text x="150" y="1470" ${FONT} font-size="34" fill="#8A7FB0">2026 · arttan 테스트 도록</text></svg>`;
  await sharp(Buffer.from(cover)).composite([{ input: cart, top: 150, left: 150 }]).jpeg({ quality: 86 }).toFile(out("books/light-cover.jpg"));
  /* 펼침면 4장 (2400×1600): 왼쪽 작품, 오른쪽 캡션·글 */
  const pages = [[0, "빛이 머무는 자리", "2026, 캔버스에 아크릴, 130×97cm"], [2, "물결 위의 원", "2025, 캔버스에 아크릴, 116×91cm"], [5, "겹쳐진 시간", "2026, 캔버스에 유채, 100×80cm"], [7, "작은 우주", "2026, 종이에 과슈, 56×76cm"]];
  for (const [k, [wi, t, cap]] of pages.entries()) {
    const art = await sharp(Buffer.from(artwork(wi, 1000, 750))).png().toBuffer();
    const sp = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1600"><rect width="2400" height="1600" fill="#FBFAF7"/>
      <rect x="1196" y="0" width="8" height="1600" fill="#E6E1D8"/>
      <text x="1400" y="620" ${FONT} font-size="60" fill="#2E2A5A" font-weight="800">${esc(t)}</text>
      <text x="1400" y="700" ${FONT} font-size="34" fill="#6B6585">${esc(cap)}</text>
      <text x="1400" y="840" ${FONT} font-size="30" fill="#8A85A0">이 펼침면은 도록 기능을 시험하려고 만든 샘플이에요.</text>
      <text x="200" y="1500" ${FONT} font-size="26" fill="#A8A3B8">${k * 2 + 12}</text><text x="2200" y="1500" ${FONT} font-size="26" fill="#A8A3B8" text-anchor="end">${k * 2 + 13}</text></svg>`;
    await sharp(Buffer.from(sp)).composite([{ input: art, top: 425, left: 100 }]).jpeg({ quality: 84 }).toFile(out(`books/light-${String(k + 1).padStart(2, "0")}.jpg`));
  }
  /* 테스트 갤러리 전경 (1800×1100): 흰 벽에 엘로이 작품 3점 */
  const W = 1800, H = 1100, frames = [[2, 260, 330, 380, 285], [0, 720, 290, 430, 322], [5, 1230, 330, 330, 248]];
  const room = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F5F1"/><stop offset="1" stop-color="#ECE8E1"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9BBA6"/><stop offset="1" stop-color="#A8977F"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#w)"/><rect y="820" width="${W}" height="280" fill="url(#f)"/>
    <rect y="812" width="${W}" height="10" fill="#DAD3C8"/>
    ${[300, 900, 1500].map(x => `<ellipse cx="${x}" cy="40" rx="150" ry="18" fill="#FFFFFF" opacity=".9"/><path d="M ${x - 160} 60 L ${x - 260} 760 L ${x + 260} 760 L ${x + 160} 60 Z" fill="#FFFDF6" opacity=".35"/>`).join("")}
    ${frames.map(([, x, y, w, h]) => `<rect x="${x - 6}" y="${y + 14}" width="${w + 12}" height="${h + 12}" fill="#000" opacity=".12"/><rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#2B2620"/>`).join("")}
    <text x="1760" y="1060" ${FONT} font-size="26" fill="#5E5244" text-anchor="end">arttan 테스트 갤러리 · 샘플 이미지</text></svg>`;
  const comps = [];
  for (const [wi, x, y, w, h] of frames) comps.push({ input: await sharp(Buffer.from(artwork(wi, w, h))).png().toBuffer(), left: x, top: y });
  await sharp(Buffer.from(room)).composite(comps).jpeg({ quality: 85 }).toFile(path.join(root, "galleries/testgal.jpg"));
  console.log("엘로이 샘플 이미지를 만들었어요.");
}
main();
