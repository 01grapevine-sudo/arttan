/* Supabase 연결 정보 — 배포할 때 scripts/build-config.mjs 가 Vercel 환경변수로 이 파일을 새로 써요.
   anon 키는 공개용 키라 브라우저에 있어도 괜찮아요 (쓰기 권한은 DB의 RLS 정책이 막아요).
   비워 두면 예시 데이터로 떠요. */
window.ARTTAN_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};
