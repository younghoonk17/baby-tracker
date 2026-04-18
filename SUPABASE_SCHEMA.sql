-- Baby Tracker schema (idempotent)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  note text,
  created_at timestamptz not null default now(),
  constraint sleep_logs_end_after_start check (end_time is null or end_time >= start_time)
);

create table if not exists public.feed_logs (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz,
  boob_side text not null check (boob_side in ('left', 'right')),
  note text,
  created_at timestamptz not null default now(),
  constraint feed_logs_end_after_start check (end_time is null or end_time >= start_time)
);

create index if not exists idx_sleep_logs_baby_start on public.sleep_logs (baby_id, start_time desc);
create index if not exists idx_sleep_logs_active on public.sleep_logs (baby_id) where end_time is null;
create index if not exists idx_feed_logs_baby_start on public.feed_logs (baby_id, start_time desc);
create index if not exists idx_feed_logs_active on public.feed_logs (baby_id) where end_time is null;

alter table public.babies enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.feed_logs enable row level security;

drop policy if exists babies_select_own on public.babies;
drop policy if exists babies_insert_own on public.babies;
drop policy if exists babies_update_own on public.babies;
drop policy if exists babies_delete_own on public.babies;

create policy babies_select_own on public.babies
  for select using (auth.uid() = user_id);
create policy babies_insert_own on public.babies
  for insert with check (auth.uid() = user_id);
create policy babies_update_own on public.babies
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy babies_delete_own on public.babies
  for delete using (auth.uid() = user_id);

drop policy if exists sleep_logs_select_own on public.sleep_logs;
drop policy if exists sleep_logs_insert_own on public.sleep_logs;
drop policy if exists sleep_logs_update_own on public.sleep_logs;
drop policy if exists sleep_logs_delete_own on public.sleep_logs;

create policy sleep_logs_select_own on public.sleep_logs
  for select using (
    exists (
      select 1
      from public.babies b
      where b.id = sleep_logs.baby_id
        and b.user_id = auth.uid()
    )
  );
create policy sleep_logs_insert_own on public.sleep_logs
  for insert with check (
    exists (
      select 1
      from public.babies b
      where b.id = sleep_logs.baby_id
        and b.user_id = auth.uid()
    )
  );
create policy sleep_logs_update_own on public.sleep_logs
  for update using (
    exists (
      select 1
      from public.babies b
      where b.id = sleep_logs.baby_id
        and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.babies b
      where b.id = sleep_logs.baby_id
        and b.user_id = auth.uid()
    )
  );
create policy sleep_logs_delete_own on public.sleep_logs
  for delete using (
    exists (
      select 1
      from public.babies b
      where b.id = sleep_logs.baby_id
        and b.user_id = auth.uid()
    )
  );

drop policy if exists feed_logs_select_own on public.feed_logs;
drop policy if exists feed_logs_insert_own on public.feed_logs;
drop policy if exists feed_logs_update_own on public.feed_logs;
drop policy if exists feed_logs_delete_own on public.feed_logs;

create policy feed_logs_select_own on public.feed_logs
  for select using (
    exists (
      select 1
      from public.babies b
      where b.id = feed_logs.baby_id
        and b.user_id = auth.uid()
    )
  );
create policy feed_logs_insert_own on public.feed_logs
  for insert with check (
    exists (
      select 1
      from public.babies b
      where b.id = feed_logs.baby_id
        and b.user_id = auth.uid()
    )
  );
create policy feed_logs_update_own on public.feed_logs
  for update using (
    exists (
      select 1
      from public.babies b
      where b.id = feed_logs.baby_id
        and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.babies b
      where b.id = feed_logs.baby_id
        and b.user_id = auth.uid()
    )
  );
create policy feed_logs_delete_own on public.feed_logs
  for delete using (
    exists (
      select 1
      from public.babies b
      where b.id = feed_logs.baby_id
        and b.user_id = auth.uid()
    )
  );

-- Membership migration (supports multiple parents per baby)
create table if not exists public.baby_members (
  baby_id uuid not null references public.babies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'parent', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (baby_id, user_id)
);

create index if not exists idx_baby_members_user on public.baby_members (user_id);
create index if not exists idx_baby_members_baby on public.baby_members (baby_id);

alter table public.baby_members enable row level security;

insert into public.baby_members (baby_id, user_id, role)
select b.id, b.user_id, 'owner'
from public.babies b
where b.user_id is not null
on conflict (baby_id, user_id) do update
set role = excluded.role;

drop policy if exists baby_members_select_own on public.baby_members;
drop policy if exists baby_members_insert_own on public.baby_members;
drop policy if exists baby_members_update_owner on public.baby_members;
drop policy if exists baby_members_delete_owner on public.baby_members;

create policy baby_members_select_own on public.baby_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.baby_members m
      where m.baby_id = baby_members.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy baby_members_insert_own on public.baby_members
  for insert with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = baby_members.baby_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

create policy baby_members_update_owner on public.baby_members
  for update using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = baby_members.baby_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  ) with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = baby_members.baby_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

create policy baby_members_delete_owner on public.baby_members
  for delete using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = baby_members.baby_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

drop policy if exists babies_select_member on public.babies;
drop policy if exists babies_insert_owner on public.babies;
drop policy if exists babies_update_member on public.babies;
drop policy if exists babies_delete_owner on public.babies;

drop policy if exists babies_select_own on public.babies;
drop policy if exists babies_insert_own on public.babies;
drop policy if exists babies_update_own on public.babies;
drop policy if exists babies_delete_own on public.babies;

create policy babies_select_member on public.babies
  for select using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = babies.id
        and m.user_id = auth.uid()
    )
  );

create policy babies_insert_owner on public.babies
  for insert with check (auth.uid() = user_id);

create policy babies_update_member on public.babies
  for update using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = babies.id
        and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = babies.id
        and m.user_id = auth.uid()
    )
  );

create policy babies_delete_owner on public.babies
  for delete using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = babies.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

drop policy if exists sleep_logs_select_member on public.sleep_logs;
drop policy if exists sleep_logs_insert_member on public.sleep_logs;
drop policy if exists sleep_logs_update_member on public.sleep_logs;
drop policy if exists sleep_logs_delete_member on public.sleep_logs;

drop policy if exists sleep_logs_select_own on public.sleep_logs;
drop policy if exists sleep_logs_insert_own on public.sleep_logs;
drop policy if exists sleep_logs_update_own on public.sleep_logs;
drop policy if exists sleep_logs_delete_own on public.sleep_logs;

create policy sleep_logs_select_member on public.sleep_logs
  for select using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = sleep_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy sleep_logs_insert_member on public.sleep_logs
  for insert with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = sleep_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy sleep_logs_update_member on public.sleep_logs
  for update using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = sleep_logs.baby_id
        and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = sleep_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy sleep_logs_delete_member on public.sleep_logs
  for delete using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = sleep_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists feed_logs_select_member on public.feed_logs;
drop policy if exists feed_logs_insert_member on public.feed_logs;
drop policy if exists feed_logs_update_member on public.feed_logs;
drop policy if exists feed_logs_delete_member on public.feed_logs;

drop policy if exists feed_logs_select_own on public.feed_logs;
drop policy if exists feed_logs_insert_own on public.feed_logs;
drop policy if exists feed_logs_update_own on public.feed_logs;
drop policy if exists feed_logs_delete_own on public.feed_logs;

create policy feed_logs_select_member on public.feed_logs
  for select using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = feed_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy feed_logs_insert_member on public.feed_logs
  for insert with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = feed_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy feed_logs_update_member on public.feed_logs
  for update using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = feed_logs.baby_id
        and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = feed_logs.baby_id
        and m.user_id = auth.uid()
    )
  );

create policy feed_logs_delete_member on public.feed_logs
  for delete using (
    exists (
      select 1
      from public.baby_members m
      where m.baby_id = feed_logs.baby_id
        and m.user_id = auth.uid()
    )
  );
