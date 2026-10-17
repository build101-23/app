-- What the user has at home for this menu: shopping list item id → amount in the item's unit, null for
-- "enough, don't buy it" (supabase/functions/_shared/list.ts). Written by the List tab and the chat's
-- update_shopping_list. save_menu leaves it, and writing it doesn't touch updated_at (the menu's version).
-- A real list is a few KB; the cap keeps a forged map from bloating the chat function's read and write.
alter table menus add column have jsonb not null default '{}'
  check (jsonb_typeof(have) = 'object' and octet_length(have::text) < 65536);

-- The List tab writes it directly, like confirmed_at (ADR 0014). It only shapes the user's own list and never reaches Claude.
grant update (have) on menus to authenticated;
