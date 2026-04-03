create extension if not exists pgcrypto;

create table if not exists public.problem_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamp with time zone not null default now()
);

alter table public.problems
add column if not exists problem_set_id uuid references public.problem_sets (id) on delete cascade;

create index if not exists problem_sets_user_id_idx on public.problem_sets (user_id);
create index if not exists problems_problem_set_id_idx on public.problems (problem_set_id);

alter table public.problem_sets enable row level security;

drop policy if exists "Users can view their own problem sets" on public.problem_sets;
create policy "Users can view their own problem sets"
on public.problem_sets
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own problem sets" on public.problem_sets;
create policy "Users can create their own problem sets"spann
on public.problem_sets
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own problem sets" on public.problem_sets;
create policy "Users can update their own problem sets"
on public.problem_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own problem sets" on public.problem_sets;
create policy "Users can delete their own problem sets"
on public.problem_sets
for delete
using (auth.uid() = user_id);
