// IndexNow: 새로 생기거나 바뀐 페이지 주소를 네이버·빙 등에 바로 알려요.
// 키는 공개용 값이라 사이트 루트의 <키>.txt 파일로 누구나 볼 수 있어요 (비밀 아님).
import { SITE } from "./site.mjs";

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "3d609b111936dfba82581edbd42477a9";
const ENDPOINTS = ["https://searchadvisor.naver.com/indexnow", "https://api.indexnow.org/indexnow"];

export async function submitUrls(paths, { dryRun = false } = {}) {
  const urlList = [...new Set((paths || []).filter(p => typeof p === "string" && p.startsWith("/") && !p.startsWith("//")))].slice(0, 500).map(p => SITE + p);
  if (!urlList.length) return { sent: 0, results: [] };
  const payload = { host: new URL(SITE).host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList };
  if (dryRun) return { sent: urlList.length, dryRun: true, urlList };
  const results = await Promise.all(ENDPOINTS.map(ep =>
    fetch(ep, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(payload) })
      .then(r => ({ endpoint: ep, status: r.status }), err => ({ endpoint: ep, error: String(err) }))));
  return { sent: urlList.length, results };
}

/* 관리자 로그인 토큰 확인: admins 표에서 자기 행이 보이면 관리자예요 (RLS "self read") */
export async function isAdminToken(token) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon || !token) return false;
  const r = await fetch(`${url}/rest/v1/admins?select=user_id&limit=1`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!r.ok) return false;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0;
}
