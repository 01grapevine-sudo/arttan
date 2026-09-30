# arttan 아트탄 — 작가 아카이브

원로·중견·청년 작가의 작품과 기록을 모으는 사이트예요.
정적 사이트(HTML·JS)를 **Vercel**로 배포하고, 데이터·로그인·이미지는 **Supabase**를 써요.

```
index.html        사이트 (홈 · 작가 공간 #a-<id> · 갤러리 공간 #g-<id> · 전시 · 캘린더)
admin.html        관리자 (로그인 후 작가·전시·공지·등록 신청·문의 관리)
core.js           공용 데이터 구조와 그리기 함수
data.js           Supabase 연결 (설정이 없으면 예시 데이터로 동작)
config.js         Supabase 주소·anon 키 (배포 때 자동 생성)
artists/<id>/     작가별 예시 데이터와 작품 이미지 (작가끼리 섞이지 않게 폴더를 나눠요)
supabase/         schema.sql(테이블·권한), seed.sql(초기 데이터)
scripts/          build-config.mjs(배포용 설정), make-seed.mjs(seed.sql 생성)
```

---

## 1. Supabase 준비 (한 번만)

1. <https://supabase.com> 에서 새 프로젝트를 만들어요. 지역은 **Northeast Asia (Seoul)** 을 추천해요.
2. 왼쪽 **SQL Editor** 에서 아래 두 파일을 차례로 붙여넣고 실행해요.
   - `supabase/schema.sql` — 테이블, 접근 권한(RLS), 작품 이미지 저장소
   - `supabase/seed.sql` — 지금 사이트의 작가 12명, 갤러리 13곳, 전시, 공지
3. **관리자 계정 만들기**
   - **Authentication → Users → Add user** 에서 관리자 이메일·비밀번호로 사용자를 만들어요.
   - SQL Editor 에서 그 계정을 관리자로 등록해요.
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = '관리자@이메일주소';
     ```
4. **Project Settings → API** 에서 두 값을 복사해 둬요.
   - `Project URL` → `SUPABASE_URL`
   - `anon public` 키 → `SUPABASE_ANON_KEY`
   - ⚠️ `service_role` 키는 절대 넣지 마세요. (빌드 스크립트가 막아요)

## 2. Vercel 배포

```bash
cd /Volumes/arttan/arttan
vercel login
vercel link          # 새 프로젝트 이름: arttan
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel --prod
```

- 배포할 때 `npm run build` 가 환경변수로 `config.js` 를 만들어요.
- GitHub에 올려서 Vercel에서 **Import** 해도 돼요. 이때도 환경변수 두 개를 넣어 주세요.

## 3. 도메인 연결 (www.arttan.co.kr)

1. Vercel 프로젝트 → **Settings → Domains** 에 `arttan.co.kr`, `www.arttan.co.kr` 를 추가해요.
2. Vercel이 알려 주는 DNS 값을 가비아 **DNS 관리**에 넣어요.
   (보통 `arttan.co.kr` 은 A 레코드, `www` 는 CNAME 이에요. 화면에 나온 값을 그대로 쓰세요.)
3. Supabase **Authentication → URL Configuration** 의 Site URL 을 `https://www.arttan.co.kr` 로 바꿔요.

## 4. 운영

- 관리자: `https://www.arttan.co.kr/admin` 에서 로그인해요.
- 사이트의 **작가 등록(무료)** 신청 → 관리자 **등록 신청** 에 쌓여요. 승인하면 작가 공간이 바로 생겨요.
- 작가 공간의 **문의** → 관리자 **작가 문의** 에 쌓여요.
- 작가 추가 때 올린 작품 이미지는 Supabase Storage `works` 버킷에 저장돼요.

## 5. 저작권이 있는 이미지

- 정명희 작가의 작품 이미지(한국예술디지털아카이브 DA-Arts 자료)는 **2026-09-30 사용 허락을 받아** 공개해요.
- 작가 공간에는 출처와 "사용 허락을 받아 게재했어요" 문구가 표시돼요.
- 앞으로 다른 기관·아카이브 자료를 쓸 때는 허락을 받은 뒤 올려 주세요.
  허락 전 자료로 seed 를 만들 때는 `ALLOW_LICENSED=0 npm run seed` 로 해당 작가를 비공개로 넣을 수 있어요.

## 로컬에서 보기

```bash
npm run dev     # http://localhost:8799
```
`config.js` 가 비어 있으면 예시 데이터로, 값을 넣으면 Supabase 데이터로 보여요.
