-- rename-artlist.sql 되돌리기: rename_backup_20261031 표에 남긴 원래 값으로 돌려놔요.
begin;
update artists   a set bio = b.val from rename_backup_20261031 b where b.tbl = 'artists' and b.col = 'bio' and a.id = b.id;
update artists   a set history = b.val::jsonb from rename_backup_20261031 b where b.tbl = 'artists' and b.col = 'history' and a.id = b.id;
update books     a set writer = b.val from rename_backup_20261031 b where b.tbl = 'books' and b.col = 'writer' and a.id::text = b.id;
update books     a set publisher = b.val from rename_backup_20261031 b where b.tbl = 'books' and b.col = 'publisher' and a.id::text = b.id;
update galleries a set name = b.val from rename_backup_20261031 b where b.tbl = 'galleries' and b.col = 'name' and a.id = b.id;
update notices   a set title = b.val from rename_backup_20261031 b where b.tbl = 'notices' and b.col = 'title' and a.id::text = b.id;
update notices   a set body = b.val from rename_backup_20261031 b where b.tbl = 'notices' and b.col = 'body' and a.id::text = b.id;
update reviews   a set author = b.val from rename_backup_20261031 b where b.tbl = 'reviews' and b.col = 'author' and a.id = b.id;
commit;
-- 확인이 끝나면: drop table rename_backup_20261031;
