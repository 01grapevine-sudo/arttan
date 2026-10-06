// 작가 폴더의 작품·인물 사진(artists/<id>/works/*.jpg, photos/*.jpg)으로 WebP 두 가지(1200px, 480px)를 만들어요.
// 사이트는 목록에 480px, 크게 볼 때 1200px WebP를 써서 모바일에서도 빨리 떠요. 원본 jpg는 그대로 둬요(공유 미리보기용).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(root, "artists");
let made = 0, kept = 0;
for (const id of fs.readdirSync(dir)) {
  for (const sub of ["works", "photos", "books", "posters"]) {
  const wd = path.join(dir, id, sub);
  if (!fs.existsSync(wd)) continue;
  for (const f of fs.readdirSync(wd)) {
    if (f.startsWith(".") || !/\.jpe?g$/i.test(f)) continue;
    const src = path.join(wd, f);
    for (const [suffix, width, quality] of [[".webp", 1200, 80], ["-480.webp", 480, 74]]) {
      const out = src.replace(/\.jpe?g$/i, suffix);
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) { kept++; continue; }
      await sharp(src).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).webp({ quality }).toFile(out);
      made++;
    }
  }
  }
}
/* 전시장 사진 (galleries/*.jpg) */
const gd = path.join(root, "galleries");
if (fs.existsSync(gd)) for (const f of fs.readdirSync(gd)) {
  if (f.startsWith(".") || !/\.jpe?g$/i.test(f)) continue;
  const src = path.join(gd, f);
  for (const [suffix, width, quality] of [[".webp", 1600, 80], ["-480.webp", 640, 74]]) {
    const out = src.replace(/\.jpe?g$/i, suffix);
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) { kept++; continue; }
    await sharp(src).rotate().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).webp({ quality }).toFile(out); made++;
  }
}
console.log(`작품 이미지 WebP: 새로 ${made}개, 그대로 ${kept}개`);
