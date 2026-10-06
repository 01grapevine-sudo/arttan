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
