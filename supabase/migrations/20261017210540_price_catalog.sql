-- Price catalog: products and prices read from supermarket sites by the scraper (`scraper/`).
-- Signed-in users read it. Only the scraper writes, with a secret key that bypasses RLS.

-- The chains we read. Text that is the same for every product of a chain lives here once.
create table stores (
  key text primary key,
  name text not null,
  base_url text not null
);

insert into stores (key, name, base_url) values
  ('devoto', 'Devoto', 'https://www.devoto.com.uy'),
  ('geant', 'Géant', 'https://www.geant.com.uy'),
  ('disco', 'Disco', 'https://www.disco.com.uy'),
  ('tata', 'Ta-Ta', 'https://www.tata.com.uy');

-- One scraper pass over one chain.
create table scrape_runs (
  id bigint generated always as identity primary key,
  store_key text not null references stores,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'done', 'interrupted', 'blocked', 'failed')),
  -- The branch or sales channel the prices belong to (ADR 0008).
  price_context text,
  -- Requests, rows saved, products not found, errors.
  stats jsonb not null default '{}'
);

create index scrape_runs_store_key on scrape_runs (store_key, started_at desc);

-- One product as sold by one chain, with the latest price read.
create table store_products (
  id bigint generated always as identity primary key,
  store_key text not null references stores,
  -- The chain's product id: the id in a GDU product URL, or Ta-Ta's VTEX sku id (what its add-to-cart link takes).
  store_sku text not null,
  -- Ta-Ta's internal code. Not an EAN.
  store_code text,
  -- EAN-13, only when the check digit is valid.
  gtin text,
  name text not null,
  brand text,
  -- Slug path, e.g. almacen/canasta-familiar/arroz.
  category text,
  -- Appended to stores.base_url.
  url_path text not null,
  size_text text,
  size_source text check (size_source in ('spec', 'name', 'unit')),
  size_qty numeric,
  size_unit text,
  pack_count int,
  -- Total content of the package: grams, milliliters or units.
  base_qty numeric,
  base_unit text check (base_unit in ('g', 'ml', 'un')),
  -- Empty when the source shows a placeholder price ($1 or less).
  price numeric(12, 2),
  -- The price before a promotion, only when higher than price.
  previous_price numeric(12, 2),
  currency text,
  promo_labels text,
  -- As the source gives it: InStock, OutOfStock.
  availability text,
  -- Per kg when base_unit is g, per liter when ml, per unit when un.
  unit_price numeric(12, 2) generated always as (
    case when base_qty > 0 then round(price / base_qty * case base_unit when 'un' then 1 else 1000 end, 2) end
  ) stored,
  read_from text not null check (read_from in ('category_page', 'product_page', 'search_api')),
  notes text,
  run_id bigint not null references scrape_runs,
  checked_at timestamptz not null,
  first_seen_at timestamptz not null default now(),
  unique (store_key, store_sku)
);

create index store_products_gtin on store_products (gtin) where gtin is not null;
create index store_products_run_id on store_products (run_id);

-- Every price a product has had: one row when it's first read, and one per change.
create table price_changes (
  id bigint generated always as identity primary key,
  store_product_id bigint not null references store_products on delete cascade,
  price numeric(12, 2),
  previous_price numeric(12, 2),
  observed_at timestamptz not null,
  run_id bigint not null references scrape_runs
);

create index price_changes_store_product_id on price_changes (store_product_id, observed_at);
create index price_changes_run_id on price_changes (run_id);

create function record_price_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  insert into public.price_changes (store_product_id, price, previous_price, observed_at, run_id)
  values (new.id, new.price, new.previous_price, new.checked_at, new.run_id);
  return null;
end;
$$;

create trigger store_products_price_read after insert on store_products
  for each row execute function record_price_change();

create trigger store_products_price_changed after update of price, previous_price on store_products
  for each row
  when (old.price is distinct from new.price or old.previous_price is distinct from new.previous_price)
  execute function record_price_change();

-- Bulk upsert for the scraper. The merge rules live here:
-- - price fields always take the latest read;
-- - store_code, gtin, brand and category keep their value when a read doesn't give them
--   (a category page has no GTIN);
-- - a size read from the product's spec is never replaced by one read from its name.
create function upsert_store_products(rows jsonb) returns integer
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
      size_text = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.size_text else excluded.size_text end,
      size_source = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.size_source else excluded.size_source end,
      size_qty = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.size_qty else excluded.size_qty end,
      size_unit = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.size_unit else excluded.size_unit end,
      pack_count = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.pack_count else excluded.pack_count end,
      base_qty = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.base_qty else excluded.base_qty end,
      base_unit = case when p.size_source = 'spec' and excluded.size_source is distinct from 'spec' then p.base_unit else excluded.base_unit end,
      price = excluded.price,
      previous_price = excluded.previous_price,
      currency = excluded.currency,
      promo_labels = excluded.promo_labels,
      availability = excluded.availability,
      read_from = excluded.read_from,
      notes = excluded.notes,
      run_id = excluded.run_id,
      checked_at = excluded.checked_at
    returning 1
  )
  select count(*)::int from saved;
$$;

revoke execute on function record_price_change() from public, anon, authenticated;
revoke execute on function upsert_store_products(jsonb) from public, anon, authenticated;
grant execute on function upsert_store_products(jsonb) to service_role;

-- The browser only reads (ADR 0014). Without write policies RLS already blocks writes; this also
-- drops the privileges, TRUNCATE included, which RLS doesn't cover.
revoke insert, update, delete, truncate on stores, scrape_runs, store_products, price_changes from anon, authenticated;

alter table stores enable row level security;
alter table scrape_runs enable row level security;
alter table store_products enable row level security;
alter table price_changes enable row level security;

create policy "signed-in users read" on stores for select to authenticated using (true);
create policy "signed-in users read" on scrape_runs for select to authenticated using (true);
create policy "signed-in users read" on store_products for select to authenticated using (true);
create policy "signed-in users read" on price_changes for select to authenticated using (true);
