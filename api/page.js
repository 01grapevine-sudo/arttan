// 검색 노출용 페이지: /artist/<id>, /artist/<id>/work/<n>, /gallery/<id>, /exhibition/<id>, /, /sitemap.xml, /rss.xml
// vercel.json 의 rewrites 가 이 함수로 보내요 (t=페이지 종류, id, n).
import { render, fallbackHtml } from "../lib/site.mjs";

export default async function handler(req, res) {
  const q = new URL(req.url, "http://local").searchParams;
  const t = (req.query && req.query.t) || q.get("t") || "home";
  const id = (req.query && req.query.id) || q.get("id") || "";
  const n = (req.query && req.query.n) || q.get("n") || "";
  try {
    const r = await render({ t, id, n });
    res.statusCode = r.status;
    res.setHeader("Content-Type", r.type);
    // 5분 동안 CDN에 저장하고, 그 뒤에도 새로 만드는 동안은 저장본을 보여줘요
    res.setHeader("Cache-Control", r.status === 200 ? "public, max-age=0, s-maxage=300, stale-while-revalidate=86400" : "public, max-age=0, s-maxage=60");
    res.end(r.body);
  } catch (err) {
    console.error("페이지 만들기 실패", err);
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(fallbackHtml());
  }
}
