-- The weekly menu the AI saved with save_menu. One per user, shared by every chat.
create table menus (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  -- Set by the Confirm button in the Menu tab. save_menu clears it: a changed menu needs confirming again.
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table menus enable row level security;

create policy "own rows" on menus
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
