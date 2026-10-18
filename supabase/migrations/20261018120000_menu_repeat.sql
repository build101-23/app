-- A recurring order: the menu's shopping repeats every repeat_every days from repeat_from, the day it was set
-- (ADR 0039). Both null when it doesn't repeat. Set from the Menu tab or by the chat's set_repeat; save_menu leaves them.
alter table menus
  add column repeat_every smallint check (repeat_every between 1 and 28),
  add column repeat_from date,
  add constraint menus_repeat_both check ((repeat_every is null) = (repeat_from is null));

-- The Menu tab writes them directly, like have (ADR 0014). They never reach the menu or the list.
grant update (repeat_every, repeat_from) on menus to authenticated;
