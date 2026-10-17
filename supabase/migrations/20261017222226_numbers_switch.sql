-- The numbers switch in the Profile tab: show_numbers in profiles.data (ADR 0021). The browser can't write
-- profiles (ADR 0014), so this sets that one key and nothing else, and creates the row if the chat hasn't yet.
-- The chat sets the same key through save_profile.
create function set_show_numbers(show_numbers boolean) returns void
language sql security definer set search_path = '' as $$
  insert into public.profiles (user_id, data) values (auth.uid(), jsonb_build_object('show_numbers', show_numbers))
  on conflict (user_id) do update set data = public.profiles.data || excluded.data, updated_at = now();
$$;

revoke execute on function set_show_numbers(boolean) from public, anon;
grant execute on function set_show_numbers(boolean) to authenticated;
