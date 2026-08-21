-- MoneyTree migration 0007: Wealth Words + Money Farm

create table public.learned_terms (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term_id    text not null,
  learned_on date not null default current_date,
  note       text,
  primary key (user_id, term_id)
);

create table public.game_state (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.learned_terms enable row level security;
alter table public.game_state    enable row level security;

create policy "own rows" on public.learned_terms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.game_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
