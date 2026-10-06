// 원본 사진(카메라 원본, 수천 px)을 사이트용 jpg(긴 변 2000px)로 줄여 작가 폴더에 넣어요.
// 사용: node scripts/import-photos.mjs <원본폴더> <작가id> [works|photos]
//   → artists/<작가id>/<works|photos>/01.jpg, 02.jpg … (파일 이름 순서대로)
// 메타데이터(촬영 정보·위치)는 지우고, 방향(회전)만 반영해요.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [src, id, kind = "works"] = process.argv.slice(2);
if (!src || !id) { console.error("사용: node scripts/import-photos.mjs <원본폴더> <작가id> [works|photos]"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.join(root, "artists", id, kind);
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(src).filter(f => !f.startsWith(".") && /\.jpe?g$/i.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
const map = [];
for (const [i, f] of files.entries()) {
  const name = `${String(i + 1).padStart(2, "0")}.jpg`;
  await sharp(path.join(src, f)).rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, name));
  map.push([name, f]);
}
fs.writeFileSync(path.join(out, "_원본파일.txt"), map.map(([a, b]) => `${a}\t${b}`).join("\n") + "\n");
console.log(`${id}/${kind}: ${files.length}장 → ${out}`);
