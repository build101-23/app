-- Several chats per user. The profile stays one per user, shared by every chat.
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  -- Last activity, for sorting the chat list.
  updated_at timestamptz not null default now(),
  -- Target of the messages foreign key below, so a message can't point at someone else's chat.
  unique (id, user_id)
);

create index conversations_user_id_updated_at on conversations (user_id, updated_at desc);

alter table conversations enable row level security;

create policy "own rows" on conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Existing messages: one conversation per user, titled with their first message.
insert into conversations (user_id, title, created_at, updated_at)
select
  m.user_id,
  coalesce(
    left((
      select f.content -> 0 ->> 'text' from messages f
      where f.user_id = m.user_id and f.role = 'user'
      order by f.id limit 1
    ), 60),
    'Chat'
  ),
  min(m.created_at),
  max(m.created_at)
from messages m
group by m.user_id;

alter table messages add column conversation_id uuid;

update messages m set conversation_id = c.id from conversations c where c.user_id = m.user_id;

alter table messages
  alter column conversation_id set not null,
  add foreign key (conversation_id, user_id) references conversations (id, user_id) on delete cascade;

drop index messages_user_id_id;
create index messages_conversation_id_id on messages (conversation_id, id);
