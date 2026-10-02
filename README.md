# arttan 아트탄 — 작가 아카이브

원로·중견·청년 작가의 작품과 기록을 모으는 사이트예요.
정적 사이트(HTML·JS)를 **Vercel**로 배포하고, 데이터·로그인·이미지는 **Supabase**를 써요.

```
app.html          사이트 화면 (홈 · 작가 공간 · 갤러리 공간 · 전시 · 캘린더)
api/page.js       검색 노출용 페이지를 서버에서 완성해서 보내요 (작가·작품·갤러리·전시, sitemap.xml, rss.xml)
api/indexnow.js   관리자에서 저장하면 바뀐 주소를 네이버·빙에 바로 알려요
lib/              서버 렌더링(site.mjs), IndexNow(indexnow.mjs)
admin.html        관리자 (로그인 후 작가·전시·공지·등록 신청·문의 관리)
core.js           공용 데이터 구조와 그리기 함수
data.js           Supabase 연결 (설정이 없으면 예시 데이터로 동작)
config.js         Supabase 주소·anon 키 (배포 때 자동 생성)
artists/<id>/     작가별 예시 데이터와 작품 이미지 (작가끼리 섞이지 않게 폴더를 나눠요)
supabase/         schema.sql(테이블·권한), seed.sql(초기 데이터)
scripts/          build-config.mjs(배포용 설정), optimize-images.mjs(WebP 변환), dev-server.mjs(로컬 서버), make-seed.mjs(seed.sql 생성)
robots.txt        검색 로봇 안내 (관리자·api 제외, 사이트맵 위치)
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

## 4. 네이버·구글 검색 노출

### 페이지 주소
| 주소 | 내용 |
|---|---|
| `/artist/<id>` | 작가 공간 (예: `/artist/jmh`) |
| `/artist/<id>/work/<번호>` | 작품 한 점 |
| `/gallery/<id>` | 갤러리 |
| `/exhibition/<id>` | 전시 |
| `/sitemap.xml`, `/rss.xml` | 검색엔진에 알리는 주소 목록, 새 소식 |

- 예전 주소(`/#a-jmh`, `/#g-hanmi`)로 들어오면 새 주소로 자동으로 옮겨요.
- 서버가 페이지마다 제목·설명·공유 미리보기·구조화 데이터(JSON-LD)를 넣은 완성된 HTML을 보내요.
- **실제 작가(`is_real`)와 그 작가의 전시만** 검색에 노출해요. 예시 작가·예시 전시는 `noindex` 이고 사이트맵에도 없어요.
- `arttan.co.kr` 로 들어오면 `www.arttan.co.kr` 로 옮겨요 (대표 주소 하나).
- 관리자에서 작가·전시를 저장하면 바뀐 주소를 IndexNow 로 네이버·빙에 바로 알려요.

### 배포 뒤 한 번 할 일
1. **네이버 서치어드바이저** (<https://searchadvisor.naver.com>) → 웹마스터 도구 → 사이트 등록 `https://www.arttan.co.kr`
   - 소유 확인은 **HTML 태그** 방식을 골라요. `<meta name="naver-site-verification" content="값">` 의 **값**만 복사해서
     Vercel 환경변수 `NAVER_SITE_VERIFICATION` 에 넣고 다시 배포한 뒤 확인을 눌러요.
   - 요청 → **사이트맵 제출**: `https://www.arttan.co.kr/sitemap.xml`
   - 요청 → **RSS 제출**: `https://www.arttan.co.kr/rss.xml`
2. **구글 서치 콘솔** (<https://search.google.com/search-console>) → URL 접두어 `https://www.arttan.co.kr`
   - HTML 태그 값을 `GOOGLE_SITE_VERIFICATION` 에 넣고 다시 배포 → 확인 → 사이트맵 제출.

### 환경변수 (모두 선택)
| 이름 | 용도 |
|---|---|
| `NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 소유 확인 값 |
| `GOOGLE_SITE_VERIFICATION` | 구글 서치 콘솔 소유 확인 값 |
| `SITE_URL` | 대표 주소 (기본 `https://www.arttan.co.kr`) |
| `INDEXNOW_KEY` | IndexNow 키를 바꿀 때. 바꾸면 루트의 `<키>.txt` 파일도 같은 이름·내용으로 바꿔요 |

### 운영하면서 검색 순위를 올리는 법
- **작가 소개는 arttan에서 직접 쓴 글로.** 다른 사이트(예: DA-Arts) 문장을 그대로 쓰면 원래 사이트가 먼저 나와요.
- 인터뷰는 영상만 올리지 말고 **질문·답을 글로도** 올려요.
- 작품에 **제목·연도·재료·크기·설명**을 빠짐없이 넣어요 (작품마다 페이지와 이미지 검색 노출이 생겨요).
- 작가에게 **네이버 인물정보 홈페이지 칸, 인스타그램·유튜브·블로그 프로필**에 작가 공간 주소를 걸어 달라고 요청해요
  (작가 등록 창에 안내가 들어 있어요).
- 새 작가·전시를 꾸준히 올려요. 자주 바뀌는 사이트를 네이버가 더 자주 수집해요.

## 5. 운영

- 관리자: `https://www.arttan.co.kr/admin` 에서 로그인해요.
- 사이트의 **작가 등록(무료)** 신청 → 관리자 **등록 신청** 에 쌓여요. 승인하면 작가 공간이 바로 생겨요.
- 작가 공간의 **문의** → 관리자 **작가 문의** 에 쌓여요.
- 작가 추가 때 올린 작품 이미지는 Supabase Storage `works` 버킷에 저장돼요.

## 6. 저작권이 있는 이미지

- 정명희 작가의 작품 이미지(한국예술디지털아카이브 DA-Arts 자료)는 **2026-09-30 사용 허락을 받아** 공개해요.
- 작가 공간에는 출처와 "사용 허락을 받아 게재했어요" 문구가 표시돼요.
- 앞으로 다른 기관·아카이브 자료를 쓸 때는 허락을 받은 뒤 올려 주세요.
  허락 전 자료로 seed 를 만들 때는 `ALLOW_LICENSED=0 npm run seed` 로 해당 작가를 비공개로 넣을 수 있어요.

## 로컬에서 보기

```bash
npm install     # 처음 한 번 (이미지 변환용 sharp)
npm run dev     # http://localhost:8799  — 배포와 같은 주소 규칙(/artist/jmh 등)으로 떠요
```
`config.js` 가 비어 있으면 예시 데이터로, 값을 넣으면 Supabase 데이터로 보여요.
서버 렌더링도 환경변수 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 가 있으면 Supabase 데이터를 써요.
작품 사진(`artists/<id>/works/*.jpg`)을 넣으면 배포 때 WebP(1200px·480px)가 자동으로 만들어져요.
