-- ביקור אצל השני (js/visit.js): פרופיל ציבורי לקריאה, ותיבת מתנות.
-- רק מוסיף. לא משנה ולא מוחק את public.saves או נתונים קיימים. אפשר להריץ שוב בלי נזק (if not exists / drop policy if exists).
-- "משתמש מחובר" = נכנס עם Google. משתמש זמני (is_anonymous) לא רואה פרופילים ולא שולח מתנות.

-- פרופיל ציבורי: מה שהחבר רואה כשהוא מבקר. רק מה שצריך לתצוגה, לא כל השמירה
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  level      int  not null default 1 check (level between 1 and 999),
  data       jsonb not null default '{}'::jsonb check (pg_column_size(data) < 4096),  -- רמות מבנים, דמות, חיה
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists profiles_select_signed_in on public.profiles;
create policy profiles_select_signed_in on public.profiles for select to authenticated
  using (coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

-- תיבת מתנות: משאב אחד ופתק מרשימה קבועה (מספר, הטקסט עצמו ב-lang.js). הנמען לוקח ומוחק
create table if not exists public.gifts (
  id         bigint generated always as identity primary key,
  from_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_id      uuid not null references auth.users(id) on delete cascade,
  from_name  text not null check (char_length(from_name) between 1 and 40),
  res        text not null check (res ~ '^[A-Za-z0-9_]{1,24}$'),
  n          int  not null check (n between 1 and 50),
  note       int  not null default 0 check (note between 0 and 31),
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);
create index if not exists gifts_to_id_idx on public.gifts (to_id);
alter table public.gifts enable row level security;

drop policy if exists gifts_insert_as_me on public.gifts;
create policy gifts_insert_as_me on public.gifts for insert to authenticated
  with check ((select auth.uid()) = from_id
    and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false);
drop policy if exists gifts_select_mine on public.gifts;
create policy gifts_select_mine on public.gifts for select to authenticated
  using ((select auth.uid()) = to_id);
drop policy if exists gifts_delete_mine on public.gifts;
create policy gifts_delete_mine on public.gifts for delete to authenticated
  using ((select auth.uid()) = to_id);

-- הרשאות: רק משתמש מחובר. לא anon, ובלי עדכון של מתנה
revoke all on public.profiles from anon;
revoke all on public.gifts from anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, delete on public.gifts to authenticated;
