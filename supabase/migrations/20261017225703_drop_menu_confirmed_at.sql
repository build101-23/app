-- No confirm step any more: a saved menu always has its shopping list (ADR 0022). Push only once the chat function
-- and the web app that stopped reading and writing confirmed_at are live. Its column grant goes with the column.
alter table menus drop column confirmed_at;

-- The update policy now only serves the List tab's have.
alter policy "confirm own menu" on menus rename to "update own menu";
