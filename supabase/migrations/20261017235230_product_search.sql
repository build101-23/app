-- Product search for the chat agent (ADR 0024): it writes the search terms and judges the results, so this only
-- has to find candidates. Full-text search in Spanish without accents, plus trigram word similarity for typos and
-- partial words. Reads store_products under the caller's own row-level security; writes nothing.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() is only stable, and an index needs an immutable function. The dictionary is fixed, so this is safe.
create function f_unaccent(text) returns text
language sql immutable parallel safe strict set search_path = '' as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

create index store_products_search on store_products
  using gin (to_tsvector('spanish', public.f_unaccent(name || ' ' || coalesce(brand, ''))));
create index store_products_name_trgm on store_products
  using gin (public.f_unaccent(lower(name)) extensions.gin_trgm_ops);

-- Up to lim products per store for one query, best first: Disco, Géant and Ta-Ta only (Devoto is out, ADR 0019).
-- Only products with a price, not out of stock, and read within 14 days of their store's newest read, so a product
-- that left the site drops out without depending on the clock.
create function search_products(q text, lim int default 5)
returns table (
  store_key text, store_sku text, name text, brand text, base_qty numeric, base_unit text,
  size_qty numeric, size_unit text, size_source text, price numeric, unit_price numeric, category text
)
language sql stable security invoker set search_path = '' as $$
  with query as (
    select websearch_to_tsquery('spanish', public.f_unaccent(q)) as tsq, public.f_unaccent(lower(q)) as plain
  ),
  newest as (
    select p.store_key, max(p.checked_at) as at
    from public.store_products p
    where p.store_key in ('disco', 'geant', 'tata')
    group by p.store_key
  ),
  found as (
    select p.*,
      ts_rank(to_tsvector('spanish', public.f_unaccent(p.name || ' ' || coalesce(p.brand, ''))), query.tsq)
        + extensions.word_similarity(query.plain, public.f_unaccent(lower(p.name))) as score
    from public.store_products p
    join newest on newest.store_key = p.store_key
    cross join query
    where p.checked_at > newest.at - interval '14 days'
      and p.price is not null
      and p.availability is distinct from 'OutOfStock'
      and (
        to_tsvector('spanish', public.f_unaccent(p.name || ' ' || coalesce(p.brand, ''))) @@ query.tsq
        or query.plain operator(extensions.<%) public.f_unaccent(lower(p.name))
      )
  ),
  ranked as (
    select found.*, row_number() over (partition by found.store_key order by found.score desc, found.price) as n
    from found
  )
  select r.store_key, r.store_sku, r.name, r.brand, r.base_qty, r.base_unit, r.size_qty, r.size_unit,
    r.size_source, r.price, r.unit_price, r.category
  from ranked r
  where r.n <= least(greatest(lim, 1), 10)
  order by r.store_key, r.n
$$;

revoke execute on function search_products(text, int) from public, anon;
grant execute on function search_products(text, int) to authenticated;
