-- Each store's newest read, for the 14-day rule (docs/plans/2026-10-18-fill-cart.md). A picked product whose row is
-- more than 14 days older than its store's newest read is no longer listed, so the List tab and the chat leave it out
-- of the price and the cart (freshRows in supabase/functions/_shared/products.ts). search_products applies the same
-- window when the agent picks. Reads store_products under the caller's own row-level security; writes nothing.

-- One index lookup per store in store_newest(). search_products' `newest` groups by store, so it still reads every row.
create index store_products_store_key_checked_at on store_products (store_key, checked_at desc);

create function store_newest()
returns table (store_key text, newest timestamptz)
language sql stable security invoker set search_path = '' as $$
  select s.key, (select max(p.checked_at) from public.store_products p where p.store_key = s.key)
  from public.stores s
$$;

revoke execute on function store_newest() from public, anon;
grant execute on function store_newest() to authenticated;
