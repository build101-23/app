-- One ongoing chat per user. `content` is the Anthropic message content exactly as
-- sent or returned (thinking blocks included), so history replays byte for byte.
create table messages (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index messages_user_id_id on messages (user_id, id);

alter table messages enable row level security;

create policy "own rows" on messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- What the AI nutritionist saved about the user (goal, likes, restrictions).
create table profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "own rows" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
