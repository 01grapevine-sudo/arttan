/* 테스트용 가상 작가 '엘로이' 샘플 이미지를 AI 생성 사진(실사)으로 바꿔 넣어요.
   사용: node scripts/make-eloi-photo.mjs <생성 이미지 폴더>
   폴더에는 portrait, w01–w08(작품), s01–s03(작업실), iv(인터뷰 첫 장면), g01–g07(전시장), venue(전시장 외관) .png 가 있어야 해요.
   사진에는 'AI 생성 · 테스트용 샘플' 표시를 넣어요. 포스터와 도록은 새 작품 이미지로 다시 만들어요. */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2];
if (!src) { console.error("생성 이미지 폴더를 알려 주세요."); process.exit(1); }
const S = f => path.join(src, f + ".png");
const out = f => path.join(root, "artists/eloi", f.replace(/\.jpg$/, "-3.jpg"));  /* 바꾼 이미지는 이름 끝에 -3 처럼 번호를 붙여 브라우저 캐시를 피해요 */
const FONT = `font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif"`;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* 사진 오른쪽 아래에 AI 생성 표시 */
async function photo(from, to, W) {
  const img = sharp(S(from)).resize({ width: W, withoutEnlargement: false });
  const { info } = await img.clone().toBuffer({ resolveWithObject: true });
  const tag = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
    <rect x="${info.width - 300}" y="${info.height - 46}" width="288" height="34" rx="17" fill="#000" fill-opacity=".45"/>
    <text x="${info.width - 156}" y="${info.height - 23}" ${FONT} font-size="17" fill="#fff" text-anchor="middle">AI 생성 · 테스트용 샘플</text></svg>`;
  await img.composite([{ input: Buffer.from(tag) }]).jpeg({ quality: 85 }).toFile(to);
}

async function main() {
  /* 작품 8점 */
  for (let i = 1; i <= 8; i++) {
    const n = String(i).padStart(2, "0");
    await sharp(S(`w${n}`)).resize({ width: 1600, height: 1600, fit: "inside" }).jpeg({ quality: 86 }).toFile(out(`works/${n}.jpg`));
  }
  /* 작가 사진 · 작업실 · 인터뷰 · 전시장 */
  await photo("portrait", out("photos/portrait.jpg"), 1200);
  for (const k of [1, 2, 3]) await photo(`s0${k}`, out(`interviews/studio-0${k}.jpg`), 1600);
  await photo("iv", out("interviews/studio-poster.jpg"), 1600);
  const garden = ["g07", "g01", "g02", "g03", "g04", "g05", "g06"];
  for (const [k, g] of garden.entries()) await photo(g, out(`reviews/garden-0${k + 1}.jpg`), 1600);
  await photo("venue", path.join(root, "galleries/testgal-3.jpg"), 1800);

  /* 전시 포스터 (1200×1600) */
  const poster = async (file, wn, title, date) => {
    const art = await sharp(S(wn)).resize(1200, 1060, { fit: "cover" }).png().toBuffer();
    const txt = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#F6F1EA"/>
      <text x="80" y="1170" ${FONT} font-size="40" fill="#7C3AED" font-weight="700">엘로이 개인전 · 일러스트</text>
      <text x="80" y="1285" ${FONT} font-size="104" fill="#1E1B2E" font-weight="800">${esc(title)}</text>
      <text x="80" y="1390" ${FONT} font-size="46" fill="#3B3650">${esc(date)}</text>
      <text x="80" y="1460" ${FONT} font-size="38" fill="#6B6585">arttan 테스트 갤러리 · 인사동</text>
      <text x="1120" y="1540" ${FONT} font-size="26" fill="#A39DB5" text-anchor="end">테스트용 샘플 · AI 생성 이미지</text></svg>`;
    await sharp(Buffer.from(txt)).composite([{ input: art, top: 0, left: 0 }]).jpeg({ quality: 86 }).toFile(out(file));
  };
  await poster("posters/2026-light.jpg", "w01", "빛이 머무는 자리", "2026.11.01 – 11.07");
  await poster("posters/2025-garden.jpg", "w02", "정원의 오후", "2025.05.03 – 05.25");

  /* 도록 표지 */
  const cart = await sharp(S("w07")).resize(900, 1000, { fit: "cover", position: "top" }).png().toBuffer();
  const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#F3EEE4"/>
    <text x="150" y="1300" ${FONT} font-size="92" fill="#2E2A5A" font-weight="800">빛이 머무는 자리</text>
    <text x="150" y="1385" ${FONT} font-size="46" fill="#5B3E96">엘로이 Eloi</text>
    <text x="150" y="1480" ${FONT} font-size="32" fill="#8A7FB0">2026 · arttan 테스트 도록</text></svg>`;
  await sharp(Buffer.from(cover)).composite([{ input: cart, top: 150, left: 150 }]).jpeg({ quality: 86 }).toFile(out("books/light-cover.jpg"));

  /* 펼침면 4장 (2400×1600): 왼쪽 작품, 오른쪽 캡션 */
  const pages = [["w01", "빛이 머무는 자리", "2026, 종이에 과슈·색연필, 48×60cm"], ["w03", "물결 위의 원", "2025, 종이에 과슈·색연필, 40×50cm"],
    ["w06", "겹쳐진 시간", "2026, 종이에 과슈·색연필, 48×60cm"], ["w08", "작은 우주", "2026, 종이에 과슈, 60×45cm"]];
  for (const [k, [wn, t, cap]] of pages.entries()) {
    const art = await sharp(S(wn)).resize(1000, 1300, { fit: "inside" }).png().toBuffer();
    const { width, height } = await sharp(art).metadata();
    const sp = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1600"><rect width="2400" height="1600" fill="#FBFAF7"/>
      <rect x="1196" y="0" width="8" height="1600" fill="#E6E1D8"/>
      <text x="1400" y="620" ${FONT} font-size="60" fill="#2E2A5A" font-weight="800">${esc(t)}</text>
      <text x="1400" y="700" ${FONT} font-size="34" fill="#6B6585">${esc(cap)}</text>
      <text x="1400" y="840" ${FONT} font-size="30" fill="#8A85A0">이 펼침면은 도록 기능을 시험하려고 만든 샘플이에요.</text>
      <text x="200" y="1540" ${FONT} font-size="26" fill="#A8A3B8">${k * 2 + 12}</text><text x="2200" y="1540" ${FONT} font-size="26" fill="#A8A3B8" text-anchor="end">${k * 2 + 13}</text></svg>`;
    await sharp(Buffer.from(sp)).composite([{ input: art, top: Math.round((1600 - height) / 2), left: Math.round((1200 - width) / 2) }])
      .jpeg({ quality: 84 }).toFile(out(`books/light-${String(k + 1).padStart(2, "0")}.jpg`));
  }
  console.log("엘로이 샘플 이미지를 바꿨어요.");
}
main();
