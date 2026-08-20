-- Messages are inserted directly from the client, so the "new message"
-- notification is created by a trigger. Deduped: no new row while an unread
-- notification for the same conversation exists.

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  shop_owner uuid;
  extra_user uuid;
  recipient uuid;
  sender_name text;
begin
  select cs.owner_id, ep.user_id
    into shop_owner, extra_user
  from conversations c
  join coffee_shops cs on cs.id = c.shop_id
  join extras_profiles ep on ep.id = c.extra_id
  where c.id = new.conversation_id;

  if shop_owner is null then
    return new;
  end if;

  recipient := case when new.sender_id = shop_owner then extra_user else shop_owner end;
  if recipient is null or recipient = new.sender_id then
    return new;
  end if;

  if exists (
    select 1 from notifications n
    where n.user_id = recipient
      and n.type = 'new_message'
      and n.href = '/messages/' || new.conversation_id
      and n.read_at is null
  ) then
    return new;
  end if;

  select display_name into sender_name from profiles where id = new.sender_id;

  insert into notifications (user_id, type, title, body, href)
  values (
    recipient,
    'new_message',
    coalesce(sender_name, 'Someone') || ' sent you a message',
    left(new.body, 140),
    '/messages/' || new.conversation_id
  );

  return new;
end;
$$;

create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();
