/* ※ 예전 그림 버전이에요. 지금 엘로이 샘플은 AI 생성 실사 이미지(scripts/make-eloi-photo.mjs)를 써요. 이 파일을 다시 실행하면 그 이미지가 덮어써져요. */
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
export function artwork(i, W = 1600, H = 1200) {
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
export const FONT = `font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif"`;
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
  /* 전시리뷰 샘플: 「정원의 오후」(2025) 현장 사진 5장 (1600×1066) */
  const RW = 1600, RH = 1066;
  const wall = (floorY = 800) => `<defs><linearGradient id="w2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8F6F2"/><stop offset="1" stop-color="#EAE5DD"/></linearGradient>
    <linearGradient id="f2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFB2A0"/><stop offset="1" stop-color="#9C8C76"/></linearGradient></defs>
    <rect width="${RW}" height="${RH}" fill="url(#w2)"/><rect y="${floorY}" width="${RW}" height="${RH - floorY}" fill="url(#f2)"/><rect y="${floorY - 6}" width="${RW}" height="8" fill="#D9D1C5"/>`;
  const person = (x, y, s = 1, c = "#2E2A3A") => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-262" r="30"/><path d="M -46 -226 Q 0 -244 46 -226 L 58 -60 L 34 -60 L 30 0 L 6 0 L 0 -90 L -6 0 L -30 0 L -34 -60 L -58 -60 Z"/></g>`;
  const frame = (x, y, w, h) => `<rect x="${x - 5}" y="${y + 12}" width="${w + 10}" height="${h + 10}" fill="#000" opacity=".12"/><rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="#2B2620"/>`;
  const label = (x, y) => `<rect x="${x}" y="${y}" width="90" height="56" fill="#FFFFFF"/><rect x="${x + 10}" y="${y + 12}" width="60" height="6" fill="#8A8496"/><rect x="${x + 10}" y="${y + 26}" width="44" height="5" fill="#B7B2C2"/><rect x="${x + 10}" y="${y + 38}" width="52" height="5" fill="#B7B2C2"/>`;
  const shot = async (file, svg, arts) => {
    const comps = [];
    for (const [wi, x, y, w, h] of arts) comps.push({ input: await sharp(Buffer.from(artwork(wi, w, h))).png().toBuffer(), left: x, top: y });
    const over = svg.after ? [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${RW}" height="${RH}">${svg.after}</svg>`), left: 0, top: 0 }] : [];
    await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${RW}" height="${RH}">${svg.base}</svg>`)).composite([...comps, ...over]).jpeg({ quality: 84 }).toFile(out(`reviews/${file}`));
  };
  const tag = `<text x="${RW - 30}" y="${RH - 24}" ${FONT} font-size="22" fill="#5E5244" text-anchor="end">테스트용 샘플 사진 · arttan</text>`;
  /* 1) 입구: 전시 제목 글자 */
  await shot("garden-01.jpg", { base: `${wall(840)}<text x="200" y="360" ${FONT} font-size="120" fill="#2E2A5A" font-weight="800">정원의 오후</text>
    <text x="206" y="440" ${FONT} font-size="44" fill="#6B5FA0">엘로이 개인전 · 2025.05.03 – 05.25</text>${frame(1080, 230, 330, 248)}${tag}`, after: person(560, 990, 1.05, "#3A3346") }, [[1, 1080, 230, 330, 248]]);
  /* 2) 전경: 세 점 */
  await shot("garden-02.jpg", { base: `${wall()}${frame(150, 260, 360, 270)}${frame(620, 220, 400, 300)}${frame(1130, 270, 320, 240)}${label(530, 470)}${label(1040, 470)}${tag}` },
    [[1, 150, 260, 360, 270], [3, 620, 220, 400, 300], [2, 1130, 270, 320, 240]]);
  /* 3) 한 점 앞의 관람객 */
  await shot("garden-03.jpg", { base: `${wall(860)}${frame(420, 150, 760, 570)}${label(1220, 640)}${tag}`, after: person(640, 1040, 1.25) + person(960, 1050, 1.15, "#4A4258") }, [[1, 420, 150, 760, 570]]);
  /* 4) 오프닝 */
  await shot("garden-04.jpg", { base: `${wall()}${frame(200, 230, 330, 248)}${frame(1060, 230, 330, 248)}${tag}`,
    after: [[300, 1000, 1, "#3B3448"], [460, 990, .95, "#5A4E6E"], [700, 1010, 1.05, "#2E2A3A"], [880, 995, .95, "#6A5C80"], [1120, 1005, 1, "#3B3448"], [1300, 990, .9, "#4A4258"]].map(a => person(...a)).join("") }, [[3, 200, 230, 330, 248], [2, 1060, 230, 330, 248]]);
  /* 5) 작품 가까이 */
  await shot("garden-05.jpg", { base: `<rect width="${RW}" height="${RH}" fill="#2B2620"/>${tag}` }, [[1, 30, 30, RW - 60, RH - 60]]);
  /* 비율이 다른 현장 사진: 세로 사진(1000×1500)과 아주 넓은 파노라마(2600×900) — 사진 크기·비율에 기준이 없다는 걸 보여줘요 */
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500"><rect width="1000" height="1500" fill="#F4F1EC"/><rect y="1150" width="1000" height="350" fill="#B8AA96"/>
    <rect x="235" y="215" width="530" height="700" fill="#2B2620"/>${person(500, 1420, 1.3)}<text x="970" y="1475" ${FONT} font-size="22" fill="#5E5244" text-anchor="end">테스트용 샘플 사진 · arttan</text></svg>`))
    .composite([{ input: await sharp(Buffer.from(artwork(3, 520, 690))).png().toBuffer(), left: 240, top: 220 }]).jpeg({ quality: 84 }).toFile(out("reviews/garden-06.jpg"));
  const PW = 2600, PH = 900, pano = [[1, 120, 230, 360, 270], [3, 620, 200, 420, 315], [2, 1180, 230, 360, 270], [0, 1660, 210, 400, 300], [5, 2180, 240, 300, 225]];
  const pc = [];
  for (const [wi, x, y, w, h] of pano) pc.push({ input: await sharp(Buffer.from(artwork(wi, w, h))).png().toBuffer(), left: x, top: y });
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" fill="#F7F5F1"/><rect y="680" width="${PW}" height="220" fill="#BFB2A0"/>
    ${pano.map(([, x, y, w, h]) => `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="#2B2620"/>`).join("")}
    ${person(900, 870, .8)}${person(1500, 880, .85, "#4A4258")}<text x="${PW - 30}" y="${PH - 22}" ${FONT} font-size="22" fill="#5E5244" text-anchor="end">테스트용 샘플 사진 · arttan</text></svg>`))
    .composite(pc).jpeg({ quality: 84 }).toFile(out("reviews/garden-07.jpg"));
  console.log("엘로이 샘플 이미지를 만들었어요.");
}
/* 다른 스크립트에서 그림 함수만 가져다 쓸 때는 실행하지 않아요 */
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) main();
