-- Sizes for the unit of sale (ADR 0023). A size the scraper reads as 'unit' (the price is for base_qty,
-- and one unit of sale is size_qty size_unit) replaces any saved size, and any later read replaces it.
-- A size from the product's spec is still kept against one from the name, or against none.
-- The rest of the function is unchanged, and replacing it keeps its grants.
create or replace function upsert_store_products(rows jsonb) returns integer
language sql set search_path = '' as $$
  with input as (
    select distinct on (store_key, store_sku) *
    from jsonb_to_recordset(rows) as r (
      store_key text, store_sku text, store_code text, gtin text, name text, brand text, category text,
      url_path text, size_text text, size_source text, size_qty numeric, size_unit text, pack_count int,
      base_qty numeric, base_unit text, price numeric, previous_price numeric, currency text,
      promo_labels text, availability text, read_from text, notes text, run_id bigint, checked_at timestamptz
    )
    order by store_key, store_sku, checked_at desc
  ),
  saved as (
    insert into public.store_products as p (
      store_key, store_sku, store_code, gtin, name, brand, category, url_path,
      size_text, size_source, size_qty, size_unit, pack_count, base_qty, base_unit,
      price, previous_price, currency, promo_labels, availability, read_from, notes, run_id, checked_at
    )
    select
      store_key, store_sku, store_code, gtin, name, brand, category, url_path,
      size_text, size_source, size_qty, size_unit, pack_count, base_qty, base_unit,
      price, previous_price, currency, promo_labels, availability, read_from, notes, run_id, checked_at
    from input
    on conflict (store_key, store_sku) do update set
      store_code = coalesce(excluded.store_code, p.store_code),
      gtin = coalesce(excluded.gtin, p.gtin),
      name = excluded.name,
      brand = coalesce(excluded.brand, p.brand),
      category = coalesce(excluded.category, p.category),
      url_path = excluded.url_path,
      size_text = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.size_text else excluded.size_text end,
      size_source = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.size_source else excluded.size_source end,
      size_qty = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.size_qty else excluded.size_qty end,
      size_unit = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.size_unit else excluded.size_unit end,
      pack_count = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.pack_count else excluded.pack_count end,
      base_qty = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.base_qty else excluded.base_qty end,
      base_unit = case when p.size_source = 'spec' and coalesce(excluded.size_source, 'name') = 'name' then p.base_unit else excluded.base_unit end,
      price = excluded.price,
      previous_price = excluded.previous_price,
      currency = excluded.currency,
      promo_labels = excluded.promo_labels,
      availability = excluded.availability,
      read_from = excluded.read_from,
      notes = excluded.notes,
      run_id = excluded.run_id,
      checked_at = excluded.checked_at
    where excluded.checked_at >= p.checked_at
    returning 1
  )
  select count(*)::int from saved;
$$;
