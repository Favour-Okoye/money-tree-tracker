-- MoneyTree migration 0003: social log, assignments, attachments storage (Phase 3)

create table public.posts_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  platform   text not null check (platform in
             ('instagram','facebook','youtube_community','skool','tiktok','other')),
  url        text,
  posted_on  date,
  summary    text,          -- what the post was
  takeaway   text,          -- what I got from it
  liked      boolean not null default false,
  commented  boolean not null default false,
  saved      boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.assignments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source          text not null default 'whatsapp'
                  check (source in ('whatsapp','skool','hub','other')),
  title           text not null,
  details         text,
  assigned_on     date not null default current_date,
  due_on          date,
  status          text not null default 'todo'
                  check (status in ('todo','doing','done','missed')),
  completed_at    timestamptz,
  attachment_path text,     -- storage object path '<uid>/<uuid>.<ext>'
  created_at      timestamptz not null default now()
);
create index assign_due_idx on public.assignments (user_id, status, due_on);

alter table public.posts_log   enable row level security;
alter table public.assignments enable row level security;

create policy "own rows" on public.posts_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private bucket for assignment PDFs/images; only the owner's folder is accessible.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760,
        array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "own attachments" on storage.objects
  for all to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
