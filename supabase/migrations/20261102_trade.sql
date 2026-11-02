-- מסחר עם חבר (js/trade.js): הצעה של משאב תמורת משאב. בנוי על ביקור אצל השני (20261031_visit.sql).
-- רק מוסיף טבלה חדשה. לא משנה ולא מוחק טבלאות או נתונים קיימים. אפשר להריץ שוב בלי נזק (if not exists / drop policy if exists).
-- "משתמש מחובר" = נכנס עם Google. משתמש זמני (is_anonymous) לא שולח הצעות.
--
-- המסלול של הצעה:
--   open      השולח יצר אותה. מה שהוא נותן כבר יצא מהשמירה שלו (נעול בהצעה)
--   accepted  הנמען קיבל: נתן את מה שביקשו ממנו וקיבל את מה שהוצע. השולח אוסף את מה שביקש בכניסה הבאה, ומוחק את השורה
--   declined  הנמען דחה. השולח מקבל בחזרה את מה שנעל בכניסה הבאה, ומוחק את השורה
--   ביטול     השולח מוחק הצעה שעוד open, ומקבל בחזרה את מה שנעל
-- המעבר מ-open קורה פעם אחת בלבד: גם העדכון של הנמען וגם הביטול של השולח מסננים status = 'open',
-- ולכן אם שניהם לוחצים באותו רגע, רק אחד מהם מצליח.

create table if not exists public.trades (
  id         bigint generated always as identity primary key,
  from_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_id      uuid not null references auth.users(id) on delete cascade,
  from_name  text not null check (char_length(from_name) between 1 and 40),
  to_name    text not null check (char_length(to_name) between 1 and 40),
  give_res   text not null check (give_res ~ '^[A-Za-z0-9_]{1,24}$'),
  give_n     int  not null check (give_n between 1 and 20),
  want_res   text not null check (want_res ~ '^[A-Za-z0-9_]{1,24}$'),
  want_n     int  not null check (want_n between 1 and 20),
  status     text not null default 'open' check (status in ('open','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_id <> to_id),
  check (give_res <> want_res)
);
create index if not exists trades_to_id_idx on public.trades (to_id);
create index if not exists trades_from_id_idx on public.trades (from_id);
alter table public.trades enable row level security;

-- רואים רק הצעות ששלחת או שנשלחו אליך
drop policy if exists trades_select_mine on public.trades;
create policy trades_select_mine on public.trades for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));

-- שולחים רק בשם עצמך, רק כ-open, רק עם Google, ועד 3 הצעות פתוחות בבת אחת
drop policy if exists trades_insert_as_me on public.trades;
create policy trades_insert_as_me on public.trades for insert to authenticated
  with check ((select auth.uid()) = from_id
    and status = 'open'
    and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
    and (select count(*) from public.trades t where t.from_id = (select auth.uid()) and t.status = 'open') < 3);

-- רק הנמען עונה, ורק על הצעה פתוחה: open הופך ל-accepted או ל-declined. אי אפשר לשנות כמויות (ההרשאה למטה היא רק לעמודות status ו-updated_at)
drop policy if exists trades_answer_mine on public.trades;
create policy trades_answer_mine on public.trades for update to authenticated
  using ((select auth.uid()) = to_id and status = 'open')
  with check ((select auth.uid()) = to_id and status in ('accepted','declined'));

-- רק השולח מוחק: ביטול של הצעה פתוחה, או איסוף של הצעה שנענתה
drop policy if exists trades_delete_mine on public.trades;
create policy trades_delete_mine on public.trades for delete to authenticated
  using ((select auth.uid()) = from_id);

-- הרשאות: רק משתמש מחובר, לא anon. עדכון רק של הסטטוס והזמן
revoke all on public.trades from anon;
revoke all on public.trades from authenticated;
grant select, insert, delete on public.trades to authenticated;
grant update (status, updated_at) on public.trades to authenticated;
