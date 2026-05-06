alter table public.comments
drop constraint if exists comments_entry_kind_check;

alter table public.comments
add constraint comments_entry_kind_check
check (entry_kind in ('posts', 'notes', 'pages'));

grant select, insert on public.comments to anon;

drop policy if exists "anyone can add comments" on public.comments;

create policy "anyone can add comments"
on public.comments
for insert
with check (
  is_visible = true
  and entry_kind in ('posts', 'notes', 'pages')
  and char_length(name) between 1 and 24
  and char_length(message) between 1 and 500
);
