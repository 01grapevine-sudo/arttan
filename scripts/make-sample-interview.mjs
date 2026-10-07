// 테스트용 가상 작가 '엘로이' 인터뷰 샘플: 작업실 사진 3장 + 짧은 인터뷰 영상(약 15초, mp4) + 영상 첫 화면.
// 외부 자료 없이 직접 그려요.  실행: node scripts/make-sample-interview.mjs  (ffmpeg 필요)
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { artwork, FONT } from "./make-sample-eloi.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(root, "artists/eloi/interviews"); fs.mkdirSync(dir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(root, ".build", "iv-"));
const person = (x, y, s = 1, c = "#2E2A3A") => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><circle cx="0" cy="-262" r="30"/><path d="M -46 -226 Q 0 -244 46 -226 L 58 -60 L 34 -60 L 30 0 L 6 0 L 0 -90 L -6 0 L -30 0 L -34 -60 L -58 -60 Z"/></g>`;
const tag = (W, H) => `<text x="${W - 26}" y="${H - 22}" ${FONT} font-size="22" fill="#6E6150" text-anchor="end">테스트용 샘플 · arttan</text>`;

async function scene(file, W, H, svg, arts) {
  const comps = [];
  for (const [wi, x, y, w, h] of arts) comps.push({ input: await sharp(Buffer.from(artwork(wi, w, h))).png().toBuffer(), left: x, top: y });
  const over = svg.after ? [{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg.after}</svg>`), left: 0, top: 0 }] : [];
  const img = sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${svg.base}</svg>`)).composite([...comps, ...over]);
  if (file.endsWith(".png")) await img.png().toFile(file); else await img.jpeg({ quality: 84 }).toFile(file);
}
/* 작업실 바닥·벽 */
const studio = (W, H, fy) => `<rect width="${W}" height="${H}" fill="#EFE9E0"/><rect y="${fy}" width="${W}" height="${H - fy}" fill="#A8977F"/><rect x="${W * .62}" y="40" width="${W * .3}" height="${fy * .55}" fill="#DCE7EE" stroke="#C9C1B4" stroke-width="10"/>`;
const easel = (x, y, h) => `<path d="M ${x} ${y + h} L ${x + 60} ${y - 40} L ${x + 120} ${y + h} M ${x + 60} ${y - 40} L ${x + 60} ${y + h + 20}" stroke="#7A5B3A" stroke-width="10" fill="none"/>`;

async function main() {
  /* 사진 1: 이젤 앞에서 작업하는 작가 (가로) */
  await scene(path.join(dir, "studio-01.jpg"), 1600, 1066, { base: `${studio(1600, 1066, 820)}${easel(560, 260, 520)}<rect x="455" y="225" width="330" height="430" fill="#2B2620"/>${tag(1600, 1066)}`, after: person(980, 1010, 1.25) },
    [[6, 460, 230, 320, 420]]);
  /* 사진 2: 벽에 기대어 둔 작업들 (세로) */
  await scene(path.join(dir, "studio-02.jpg"), 1000, 1400, { base: `${studio(1000, 1400, 1080)}${[[90, 640, 300, 400], [420, 560, 380, 500], [700, 700, 240, 340]].map(([x, y, w, h]) => `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#2B2620"/>`).join("")}${tag(1000, 1400)}` },
    [[2, 90, 640, 300, 400], [0, 420, 560, 380, 500], [4, 700, 700, 240, 340]]);
  /* 사진 3: 물감 팔레트 가까이 (정사각) */
  const dots = Array.from({ length: 22 }, (_, i) => { const a = i * 2.4, r = 140 + (i % 5) * 70; return `<circle cx="${600 + Math.cos(a) * r}" cy="${600 + Math.sin(a) * r}" r="${28 + (i % 4) * 10}" fill="${["#7C3AED", "#F2C66D", "#E8B4A0", "#2E2A5A", "#8FB9A8", "#F4A261"][i % 6]}" opacity=".9"/>`; }).join("");
  await scene(path.join(dir, "studio-03.jpg"), 1200, 1200, { base: `<rect width="1200" height="1200" fill="#8C7356"/><ellipse cx="600" cy="600" rx="520" ry="470" fill="#F3EEE4"/>${dots}<rect x="760" y="140" width="40" height="420" rx="16" fill="#3B2A1C" transform="rotate(35 780 350)"/>${tag(1200, 1200)}` }, []);

  /* 영상: 장면 4개(1280×720) → 천천히 다가가는 화면 + 장면 사이 겹치기 */
  const W = 1280, H = 720;
  const card = (t1, t2, t3) => `<rect width="${W}" height="${H}" fill="#14112B"/><text x="90" y="300" ${FONT} font-size="34" fill="#C4B5FD" font-weight="700">${t1}</text><text x="90" y="390" ${FONT} font-size="72" fill="#FFFFFF" font-weight="800">${t2}</text><text x="90" y="460" ${FONT} font-size="30" fill="#D9D0F5">${t3}</text>${tag(W, H)}`;
  const slides = [];
  slides.push(path.join(tmp, "s1.png")); await scene(slides[0], W, H, { base: card("arttan 작가 인터뷰 · 테스트 영상", "엘로이의 작업실에서", "「정원의 오후」를 그리기까지") }, []);
  slides.push(path.join(tmp, "s2.png")); await scene(slides[1], W, H, { base: `${studio(W, H, 560)}${easel(430, 170, 360)}<rect x="355" y="145" width="250" height="320" fill="#2B2620"/>`, after: person(780, 690, .95) }, [[1, 360, 150, 240, 310]]);
  slides.push(path.join(tmp, "s3.png")); await scene(slides[2], W, H, { base: `<rect width="${W}" height="${H}" fill="#2B2620"/>` }, [[1, 20, 20, W - 40, H - 40]]);
  slides.push(path.join(tmp, "s4.png")); await scene(slides[3], W, H, { base: card("테스트용 샘플 영상", "빛이 머문 자리를 그려요", "실제 인터뷰 영상은 유튜브 주소나 영상 파일로 넣어요") }, []);
  const D = 4, FPS = 25, F = D * FPS;
  const inputs = slides.flatMap(f => ["-i", f]);   // 그림 한 장 → zoompan 이 d 프레임(4초)으로 늘려요
  const zp = slides.map((_, i) => `[${i}]scale=${W * 2}:${H * 2},zoompan=z='min(zoom+0.0009,1.09)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${F}:s=${W}x${H}:fps=${FPS},format=yuv420p[v${i}]`).join(";");
  const xf = `[v0][v1]xfade=transition=fade:duration=0.6:offset=${D - .6}[x1];[x1][v2]xfade=transition=fade:duration=0.6:offset=${2 * D - 1.2}[x2];[x2][v3]xfade=transition=fade:duration=0.6:offset=${3 * D - 1.8}[out]`;
  const mp4 = path.join(dir, "studio.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", `${zp};${xf}`, "-map", "[out]", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  /* 영상 첫 화면(포스터) */
  await sharp(slides[0]).jpeg({ quality: 84 }).toFile(path.join(dir, "studio-poster.jpg"));
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("엘로이 인터뷰 샘플(사진 3장·영상 1개)을 만들었어요.");
}
main();
