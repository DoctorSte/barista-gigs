alter table public.conversations
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_preview text;

create or replace function public.sync_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 120)
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_sync_conversation on public.messages;
create trigger messages_sync_conversation
  after insert on public.messages
  for each row
  execute function public.sync_conversation_last_message();
