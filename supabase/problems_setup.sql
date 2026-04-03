create extension if not exists pgcrypto;

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  explanation text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.problem_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id uuid not null references public.problems (id) on delete cascade,
  storage_path text not null unique,
  caption text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create index if not exists problems_user_id_idx on public.problems (user_id);
create index if not exists problem_images_user_id_idx on public.problem_images (user_id);
create index if not exists problem_images_problem_id_idx on public.problem_images (problem_id);

alter table public.problems enable row level security;
alter table public.problem_images enable row level security;

drop policy if exists "Users can view their own problems" on public.problems;
create policy "Users can view their own problems"
on public.problems
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own problems" on public.problems;
create policy "Users can create their own problems"
on public.problems
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own problems" on public.problems;
create policy "Users can update their own problems"
on public.problems
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own problems" on public.problems;
create policy "Users can delete their own problems"
on public.problems
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view their own problem images" on public.problem_images;
create policy "Users can view their own problem images"
on public.problem_images
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own problem images" on public.problem_images;
create policy "Users can create their own problem images"
on public.problem_images
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own problem images" on public.problem_images;
create policy "Users can update their own problem images"
on public.problem_images
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own problem images" on public.problem_images;
create policy "Users can delete their own problem images"
on public.problem_images
for delete
using (auth.uid() = user_id);
