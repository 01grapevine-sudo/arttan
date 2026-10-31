-- 이름 바꾸기: arttan·artpool·아트탄·아트풀 → artlist (사이트에 보이는 글만)
-- 코드 배포와 같은 때 한 번 실행해요. 주소(www.arttan.co.kr)는 그대로 둬요.
-- 실행 전 값은 rename_backup_20261031 표에 남아요. 되돌리기는 rename-artlist-undo.sql
create or replace function pg_temp.rn(t text) returns text language sql immutable as $$
  select regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(t,
    '(^|[^A-Za-z_./-])(arttan|artpool)으로', '\1artlist로', 'g'),
    '(^|[^A-Za-z_./-])(arttan|artpool)($|[^A-Za-z_.-])', '\1artlist\3', 'g'),
    '(아트탄|아트풀)으로', 'artlist로', 'g'),
    '(아트탄|아트풀)(이|은|을|과)(\s)', 'artlist' || '\2' || '\3', 'g'),
    '아트탄|아트풀', 'artlist', 'g')
$$;
-- 받침 없는 artlist 뒤 조사 맞추기: 이→가, 은→는, 을→를, 과→와
create or replace function pg_temp.rn2(t text) returns text language sql immutable as $$
  select replace(replace(replace(replace(pg_temp.rn(t),
    'artlist이 ', 'artlist가 '), 'artlist은 ', 'artlist는 '), 'artlist을 ', 'artlist를 '), 'artlist과 ', 'artlist와 ')
$$;
begin;
create table if not exists rename_backup_20261031 (tbl text, id text, col text, val text, saved_at timestamptz default now());
insert into rename_backup_20261031 (tbl, id, col, val)
  select 'artists', id::text, 'bio', bio from artists where bio ~ 'arttan|artpool|아트탄|아트풀'
  union all select 'artists', id::text, 'history', history::text from artists where history::text ~ 'arttan|artpool|아트탄|아트풀'
  union all select 'books', id::text, 'writer', writer from books where writer ~ 'arttan|artpool'
  union all select 'books', id::text, 'publisher', publisher from books where publisher ~ 'arttan|artpool'
  union all select 'galleries', id::text, 'name', name from galleries where name ~ 'arttan|artpool'
  union all select 'notices', id::text, 'title', title from notices where title ~ 'arttan|artpool|아트탄|아트풀'
  union all select 'notices', id::text, 'body', body from notices where body ~ 'arttan|artpool|아트탄|아트풀'
  union all select 'reviews', id::text, 'author', author from reviews where author ~ 'arttan|artpool';
update artists   set bio = pg_temp.rn2(bio), history = pg_temp.rn2(history::text)::jsonb where bio ~ 'arttan|artpool|아트탄|아트풀' or history::text ~ 'arttan|artpool|아트탄|아트풀';
update books     set writer = pg_temp.rn2(writer), publisher = pg_temp.rn2(publisher) where writer ~ 'arttan|artpool' or publisher ~ 'arttan|artpool';
update galleries set name = pg_temp.rn2(name) where name ~ 'arttan|artpool';
update notices   set title = pg_temp.rn2(title), body = pg_temp.rn2(body) where title ~ 'arttan|artpool|아트탄|아트풀' or body ~ 'arttan|artpool|아트탄|아트풀';
update reviews   set author = pg_temp.rn2(author) where author ~ 'arttan|artpool';
commit;
