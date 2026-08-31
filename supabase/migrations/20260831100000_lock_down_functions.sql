-- Advisors pass: trigger functions must not be callable through the REST RPC
-- API. current_profile_city_id keeps authenticated EXECUTE (RLS policies call
-- it as the querying user) but loses anon, which never needs it.

revoke execute on function public.notify_new_message() from public, anon, authenticated;
revoke execute on function public.sync_conversation_last_message() from public, anon, authenticated;
revoke execute on function public.current_profile_city_id() from anon;
