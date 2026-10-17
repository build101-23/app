-- The client only reads these tables. The chat function writes them with the service role, so a user
-- can't forge history or skip the function's checks (ADR 0014). Deploy that function before this push.
drop policy "own rows" on messages;
create policy "own rows" on messages for select using (auth.uid() = user_id);

drop policy "own rows" on profiles;
create policy "own rows" on profiles for select using (auth.uid() = user_id);

drop policy "own rows" on menus;
create policy "own rows" on menus for select using (auth.uid() = user_id);

-- Except the Confirm button in the Menu tab, which may set confirmed_at and nothing else.
create policy "confirm own menu" on menus for update using (auth.uid() = user_id);
revoke update on menus from anon, authenticated;
grant update (confirmed_at) on menus to authenticated;
