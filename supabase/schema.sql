-- arttan · Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 실행하세요. (여러 번 실행해도 안전해요)

-- ─────────────────────────────────────────────
-- 관리자
-- ─────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─────────────────────────────────────────────
-- 작가 (작가 한 명 = 한 행. 작품·인터뷰·도록은 artist_id로만 연결돼 섞이지 않아요)
-- ─────────────────────────────────────────────
create table if not exists public.artists (
  id           text primary key,                -- 예: jmh (작가 공간 주소 /artist/jmh)
  name         text not null,
  en           text,
  tier         text not null check (tier in ('원로작가','중견작가','청년작가')),
  genre        text not null,
  more         text[] not null default '{}',     -- 부가 장르 (최대 2)
  tags         text[] not null default '{}',     -- 세부 분류
  born         int,
  birthplace   text,
  city         text,
  quote        text,
  line         text,                             -- 한 줄 소개
  bio          text,
  cv           jsonb not null default '[]',      -- [["2013","홍익대 졸업"], ...]
  history      jsonb not null default '[]',      -- 지난 개인전 [["1975","제목","장소"], ...]
  collections  text,
  pubs         text[] not null default '{}',     -- 저서
  source       jsonb,                            -- (예전 형식) {"name": "...", "url": "..."}
  sources      jsonb not null default '[]',      -- 소개 글 참고 자료 [{"name": "...", "url": "..."}, ...]
  portraits    text[] not null default '{}',     -- 인물 사진 경로 (작품 사진이 없을 때 대표 이미지)
  aka          text[] not null default '{}',     -- 검색용 다른 이름 (호, 한자 이름, '○○○ 화백')
  portrait_focus real[],                         -- 인물 사진 자를 때 기준점 [가로, 세로] 0~1 (예: {0.5,0.12} = 얼굴이 위쪽)
  works_total  int,                              -- 아카이브 전체 작품 수 (등록 이미지보다 많을 때)
  style        text,                             -- 이미지 없는 작품의 대체 그림 스타일
  pal          text[] not null default '{}',
  is_real      boolean not null default false,   -- 실제 자료 여부 (예시 데이터와 구분)
  hidden       boolean not null default false,   -- 비공개
  sort         int not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.works (
  id           bigint generated always as identity primary key,
  artist_id    text not null references public.artists(id) on delete cascade,
  sort         int not null default 0,
  title        text not null,
  year         text,
  material     text,
  size         text,
  description  text,                             -- 간단한 작품설명 (선택)
  image_path   text,                             -- 'artists/jmh/works/..' (사이트 파일) 또는 Storage 'works' 버킷 경로
  created_at   timestamptz not null default now()
);
create index if not exists works_artist_idx on public.works(artist_id, sort);

create table if not exists public.interviews (
  id         bigint generated always as identity primary key,
  artist_id  text not null references public.artists(id) on delete cascade,
  title      text not null,
  date       text,
  lead       text,
  qa         jsonb not null default '[]',        -- [["질문","답"], ...]
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  artist_id  text primary key references public.artists(id) on delete cascade,
  title      text,
  len        text,
  date       text,
  place      text,
  url        text                                -- 유튜브·비메오 주소
);

create table if not exists public.books (
  id         bigint generated always as identity primary key,
  artist_id  text not null references public.artists(id) on delete cascade,
  title      text not null,
  year       int,
  pages      int,
  size       text,
  writer     text,
  price      text,
  slug       text unique,                       -- 주소에 쓰는 아이디 (/book/slug)
  kind       text,                              -- 전시 도록 · 화집 · 작가 저서
  publisher  text,
  isbn       text,
  description text,
  cover_path text,                              -- 표지 사진 (작가 제공)
  spreads    text[] not null default '{}',      -- 펼침면 사진 (작가가 허락한 것만)
  full_view  boolean not null default false,    -- 전체 공개(e북) 여부. false면 미리보기
  work_refs  int[] not null default '{}',       -- 이 책에 실린 작품 (works.sort 번호)
  exhibition_id text,                           -- 연결된 전시 id
  toc        jsonb not null default '[]',       -- 목차 ["글 · 평론가", ...]
  links      jsonb not null default '[]'        -- 구매·열람처 [{"name":"…","url":"…"}]
);

-- ─────────────────────────────────────────────
-- 갤러리 · 전시
-- ─────────────────────────────────────────────
create table if not exists public.galleries (
  id     text primary key,
  name   text not null,
  area   text,
  addr   text,
  hours  text,
  tel    text,
  site   text,
  intro  text,
  sort   int not null default 100
);

create table if not exists public.exhibitions (
  id           text primary key,
  gallery_id   text references public.galleries(id) on delete set null,
  title        text not null,
  kind         text,
  start_date   date not null,
  end_date     date not null,
  artists      text[] not null default '{}',     -- 참여 작가 id 목록
  description  text,
  created_at   timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ─────────────────────────────────────────────
-- 공지 · 작가 등록 신청 · 작가 문의
-- ─────────────────────────────────────────────
create table if not exists public.notices (
  id         bigint generated always as identity primary key,
  tag        text not null default '공지',
  title      text not null,
  body       text,
  date       text,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id         bigint generated always as identity primary key,
  name       text not null,
  born       int,
  genre      text,
  city       text,
  email      text,
  note       text,
  status     text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id         bigint generated always as identity primary key,
  artist_id  text references public.artists(id) on delete set null,
  name       text not null,
  email      text not null,
  type       text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 접근 권한 (RLS)
--  · 누구나: 공개된 작가·작품·전시·공지 읽기, 작가 등록 신청·문의 보내기
--  · 관리자(admins 표에 있는 계정): 모든 읽기·쓰기
-- ─────────────────────────────────────────────
alter table public.admins       enable row level security;
alter table public.artists      enable row level security;
alter table public.works        enable row level security;
alter table public.interviews   enable row level security;
alter table public.videos       enable row level security;
alter table public.books        enable row level security;
alter table public.galleries    enable row level security;
alter table public.exhibitions  enable row level security;
alter table public.notices      enable row level security;
alter table public.applications enable row level security;
alter table public.inquiries    enable row level security;

drop policy if exists "admins: self read" on public.admins;
create policy "admins: self read" on public.admins for select using (user_id = auth.uid());

drop policy if exists "artists: public read" on public.artists;
create policy "artists: public read" on public.artists for select using (hidden = false or public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['works','interviews','videos','books','galleries','exhibitions','notices'] loop
    execute format('drop policy if exists "%1$s: public read" on public.%1$s', t);
    execute format('create policy "%1$s: public read" on public.%1$s for select using (true)', t);
  end loop;
  foreach t in array array['artists','works','interviews','videos','books','galleries','exhibitions','notices','applications','inquiries'] loop
    execute format('drop policy if exists "%1$s: admin write" on public.%1$s', t);
    execute format('create policy "%1$s: admin write" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "applications: anyone can apply" on public.applications;
create policy "applications: anyone can apply" on public.applications for insert with check (status = 'pending');
drop policy if exists "inquiries: anyone can ask" on public.inquiries;
create policy "inquiries: anyone can ask" on public.inquiries for insert with check (true);

-- ─────────────────────────────────────────────
-- 작품 이미지 저장소 (Storage 버킷 'works': 누구나 보기, 관리자만 올리기)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('works','works', true)
on conflict (id) do update set public = true;

drop policy if exists "works images: public read" on storage.objects;
create policy "works images: public read" on storage.objects for select using (bucket_id = 'works');
drop policy if exists "works images: admin write" on storage.objects;
create policy "works images: admin write" on storage.objects for all
  using (bucket_id = 'works' and public.is_admin()) with check (bucket_id = 'works' and public.is_admin());

-- updated_at 자동 갱신
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists artists_touch on public.artists;
create trigger artists_touch before update on public.artists for each row execute function public.touch_updated_at();

-- 이미 만든 DB에 새 열 추가 (여러 번 실행해도 괜찮아요)
alter table public.artists add column if not exists sources jsonb not null default '[]';
alter table public.artists add column if not exists portraits text[] not null default '{}';
alter table public.artists add column if not exists portrait_focus real[];
alter table public.artists add column if not exists aka text[] not null default '{}';
alter table public.books add column if not exists slug text unique;
alter table public.books add column if not exists kind text;
alter table public.books add column if not exists publisher text;
alter table public.books add column if not exists isbn text;
alter table public.books add column if not exists description text;
alter table public.books add column if not exists cover_path text;
alter table public.books add column if not exists spreads text[] not null default '{}';
alter table public.books add column if not exists full_view boolean not null default false;
alter table public.books add column if not exists work_refs int[] not null default '{}';
alter table public.books add column if not exists exhibition_id text;
alter table public.books add column if not exists toc jsonb not null default '[]';
alter table public.books add column if not exists links jsonb not null default '[]';
alter table public.exhibitions add column if not exists poster_path text;   -- 전시 포스터 이미지 (작가·갤러리 제공)

-- ─────────────────────────────────────────────
-- 전시장 자동 수집
--  · galleries.crawl_url: 전시 목록이 있는 주소 / crawl_on: 매일 자동 수집 여부
--  · crawled_exhibitions: 모은 전시 (관리자가 '게시'하면 exhibitions 로 옮겨요)
--    전시명·기간·원문 주소만 모아요. 소개 글·포스터는 가져오지 않아요.
alter table public.galleries add column if not exists crawl_url text;
alter table public.galleries add column if not exists crawl_on boolean not null default true;
alter table public.galleries add column if not exists last_crawled_at timestamptz;
alter table public.galleries add column if not exists last_crawl_note text;
alter table public.exhibitions add column if not exists artists_text text;   -- arttan 에 등록되지 않은 참여 작가 이름
alter table public.exhibitions add column if not exists source_url text;     -- 수집한 전시의 원문 주소 (출처 표시)
create table if not exists public.crawled_exhibitions (
  id           bigint generated always as identity primary key,
  gallery_id   text not null references public.galleries(id) on delete cascade,
  hash         text not null unique,
  title        text not null,
  context      text,
  start_date   date,
  end_date     date,
  source_url   text,
  image_url    text,                              -- 참고용 (사이트에 게시하지 않아요)
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  exhibition_id text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
alter table public.crawled_exhibitions enable row level security;
drop policy if exists "crawled: admin all" on public.crawled_exhibitions;
create policy "crawled: admin all" on public.crawled_exhibitions for all using (public.is_admin()) with check (public.is_admin());
alter table public.galleries add column if not exists photo_path text;   -- 전시장 대표 사진 (전시장이 허락한 것만)
alter table public.galleries add column if not exists video_url text;    -- 유튜브·비메오 영상 주소

-- ─────────────────────────────────────────────
-- 전시리뷰 (전시장 스케치): 현장 사진 [{src,caption}] · 전시에 걸린 작품 [[작가id, 작품번호]]
create table if not exists public.reviews (
  id text primary key,
  exhibition_id text references public.exhibitions(id) on delete set null,
  title text not null,
  visit_date date,
  author text,
  body text,
  photos jsonb not null default '[]',
  works jsonb not null default '[]',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists "reviews: public read" on public.reviews;
create policy "reviews: public read" on public.reviews for select using (hidden = false or public.is_admin());
drop policy if exists "reviews: admin write" on public.reviews;
create policy "reviews: admin write" on public.reviews for all using (public.is_admin()) with check (public.is_admin());
alter table public.reviews add column if not exists videos jsonb not null default '[]';   -- [{url, title}] 유튜브·비메오
alter table public.reviews add column if not exists interview jsonb;                     -- {artist, lead, qa:[[질문,답]], video}
-- 작가 인터뷰: 영상({src|url, poster, title})·사진([{src,caption}])·글(lead·body·qa), 연결 전시 — 넣은 것만 보여요
alter table public.interviews add column if not exists slug text unique;
alter table public.interviews add column if not exists body text;
alter table public.interviews add column if not exists photos jsonb not null default '[]';
alter table public.interviews add column if not exists video jsonb;
alter table public.interviews add column if not exists exhibition_id text;

-- 홈 히어로(첫 화면 큰 배너) 노출 여부: 관리자 작가 목록의 '히어로' 버튼으로 바꿔요
alter table public.artists add column if not exists hero boolean not null default true;

-- 사이트 설정 (arttan SNS 채널 주소 등): 누구나 읽고 관리자만 바꿔요
create table if not exists public.site_settings (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
alter table public.site_settings enable row level security;
drop policy if exists "site_settings: public read" on public.site_settings;
create policy "site_settings: public read" on public.site_settings for select using (true);
drop policy if exists "site_settings: admin write" on public.site_settings;
create policy "site_settings: admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- 서점 구매 버튼 (예스24·교보문고): null = 자동, true = 보이기, false = 숨기기
alter table public.books add column if not exists buy boolean;

-- 관심 작가 전시 알림 (웹 푸시) ------------------------------------------------
-- 구독 정보: 브라우저 푸시 주소 + 관심 작가 id 만 저장 (이메일·전화번호 없음). 일반 방문자는 읽을 수 없고 아래 함수로만 넣고 빼요.
create table if not exists public.push_subs (
  endpoint text primary key, p256dh text not null, auth text not null, artists text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.push_subs enable row level security;
drop policy if exists "push_subs: admin read" on public.push_subs;
create policy "push_subs: admin read" on public.push_subs for select using (public.is_admin());
drop policy if exists "push_subs: admin delete" on public.push_subs;
create policy "push_subs: admin delete" on public.push_subs for delete using (public.is_admin());
create index if not exists push_subs_artists_idx on public.push_subs using gin (artists);
-- 보낸 알림 기록: 같은 전시·같은 종류(new · open-1 · end-3)는 한 번만
create table if not exists public.push_log (
  id bigserial primary key, exhibition_id text not null, kind text not null, sent int not null default 0, failed int not null default 0,
  created_at timestamptz not null default now(), unique (exhibition_id, kind));
alter table public.push_log enable row level security;
drop policy if exists "push_log: admin all" on public.push_log;
create policy "push_log: admin all" on public.push_log for all using (public.is_admin()) with check (public.is_admin());
create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text, p_artists text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_endpoint is null or length(p_endpoint) > 1000
     or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com|[a-z0-9.-]+\.push\.apple\.com)/' then
    raise exception 'invalid endpoint';
  end if;
  if p_p256dh is null or length(p_p256dh) > 200 or p_auth is null or length(p_auth) > 100 then raise exception 'invalid keys'; end if;
  if coalesce(array_length(p_artists,1),0) > 200 then raise exception 'too many artists'; end if;
  insert into public.push_subs(endpoint,p256dh,auth,artists,updated_at)
  values (p_endpoint,p_p256dh,p_auth,(select coalesce(array_agg(a),'{}') from (select distinct left(x,40) a from unnest(coalesce(p_artists,'{}')) x where x ~ '^[a-z0-9_-]{1,40}$') t),now())
  on conflict (endpoint) do update set p256dh=excluded.p256dh, auth=excluded.auth, artists=excluded.artists, updated_at=now();
end $$;
create or replace function public.push_unsubscribe(p_endpoint text)
returns void language sql security definer set search_path = public as $$ delete from public.push_subs where endpoint = p_endpoint; $$;
revoke all on function public.push_subscribe(text,text,text,text[]) from public;
revoke all on function public.push_unsubscribe(text) from public;
grant execute on function public.push_subscribe(text,text,text,text[]) to anon, authenticated;
grant execute on function public.push_unsubscribe(text) to anon, authenticated;

-- 인터뷰 종류 (작업실 방문 · 전시 인터뷰 · 대담 · 서면 인터뷰)
alter table public.interviews add column if not exists kind text;

-- 회원 (이메일·카카오·Google 로그인) -------------------------------------------
-- 가입 동의(이용약관·개인정보 수집·이용)를 마친 회원만 profiles 에 생겨요. 회원은 자기 정보만 읽고 고쳐요.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  email text, provider text,
  agree_terms_at timestamptz not null, agree_privacy_at timestamptz not null,
  marketing_ok boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.profiles enable row level security;
drop policy if exists "profiles: own read" on public.profiles;
create policy "profiles: own read" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles: own insert" on public.profiles;
create policy "profiles: own insert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- 회원의 관심 작가 (기기 사이에 맞춰져요)
create table if not exists public.member_favs (
  user_id uuid not null references auth.users(id) on delete cascade,
  artist_id text not null check (artist_id ~ '^[a-z0-9_-]{1,40}$'),
  created_at timestamptz not null default now(), primary key (user_id, artist_id));
alter table public.member_favs enable row level security;
drop policy if exists "member_favs: own all" on public.member_favs;
create policy "member_favs: own all" on public.member_favs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "member_favs: admin read" on public.member_favs;
create policy "member_favs: admin read" on public.member_favs for select using (public.is_admin());
-- 회원 탈퇴: 본인 계정만 (관리자 계정 제외)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.admins where user_id = auth.uid()) then raise exception 'admin account'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
