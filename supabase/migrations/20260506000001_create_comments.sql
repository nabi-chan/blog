create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entry_kind text not null check (entry_kind in ('posts', 'notes')),
  entry_slug text not null,
  name text not null check (char_length(name) between 1 and 24),
  message text not null check (char_length(message) between 1 and 500),
  avatar_emoji text not null,
  avatar_bg text not null,
  created_at timestamptz not null default now(),
  is_visible boolean not null default true
);

create index if not exists comments_entry_idx
on public.comments (entry_kind, entry_slug, created_at);

alter table public.comments enable row level security;

grant select, insert on public.comments to anon;

drop policy if exists "visible comments are readable" on public.comments;
create policy "visible comments are readable"
on public.comments
for select
using (is_visible = true);

drop policy if exists "anyone can add comments" on public.comments;
create policy "anyone can add comments"
on public.comments
for insert
with check (
  is_visible = true
  and entry_kind in ('posts', 'notes')
  and char_length(name) between 1 and 24
  and char_length(message) between 1 and 500
);
