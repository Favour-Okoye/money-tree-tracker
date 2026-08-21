-- MoneyTree migration 0002: books, chapters, action items (Phase 2)

create table public.book_progress (
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_slug      text not null,               -- matches data/books.json slugs
  status         text not null default 'wishlist'
                 check (status in ('wishlist','owned','reading','finished')),
  format         text,                        -- 'paperback' | 'ebook' | 'pdf' (free text)
  total_chapters int,
  started_on     date,
  finished_on    date,
  primary key (user_id, book_slug)
);

create table public.book_chapters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_slug    text not null,
  chapter_no   int  not null,
  title        text,
  status       text not null default 'todo' check (status in ('todo','reading','done')),
  completed_at timestamptz,
  unique (user_id, book_slug, chapter_no)
);

create table public.action_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null,
  note_id      uuid references public.notes(id) on delete set null,   -- provenance
  source_type  text,
  source_id    text,
  due_on       date,
  status       text not null default 'open' check (status in ('open','done','dropped')),
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index action_due_idx on public.action_items (user_id, status, due_on);

alter table public.book_progress enable row level security;
alter table public.book_chapters enable row level security;
alter table public.action_items  enable row level security;

create policy "own rows" on public.book_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.book_chapters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.action_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
