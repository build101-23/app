-- Better ranking for search_products (ADR 0024). Ties used to go to the cheapest product, so "banana" at Ta-Ta listed
-- juices and cookies before the fruit, and "papa" listed Christmas ornaments. Now a name that starts with the query's
-- first word goes first ("Banana Ecuador Dole 1 Kg", not "Papaya"), then names closest to the whole query (short,
-- plain names over long processed ones), then the full-text rank. Products with no size are left out: they can't be
-- priced, so the agent could only pick them by mistake. The output is unchanged.
create or replace function search_products(q text, lim int default 5)
returns table (
  store_key text, store_sku text, name text, brand text, base_qty numeric, base_unit text,
  size_qty numeric, size_unit text, size_source text, price numeric, unit_price numeric, category text
)
language sql stable security invoker set search_path = '' as $$
  with query as (
    select websearch_to_tsquery('spanish', public.f_unaccent(q)) as tsq,
      public.f_unaccent(lower(btrim(q))) as plain,
      split_part(public.f_unaccent(lower(btrim(q))), ' ', 1) as first_word
  ),
  newest as (
    select p.store_key, max(p.checked_at) as at
    from public.store_products p
    where p.store_key in ('disco', 'geant', 'tata')
    group by p.store_key
  ),
  found as (
    select p.*, public.f_unaccent(lower(p.name)) as plain_name
    from public.store_products p
    join newest on newest.store_key = p.store_key
    cross join query
    where p.checked_at > newest.at - interval '14 days'
      and p.price is not null
      and p.availability is distinct from 'OutOfStock'
      and p.base_qty > 0 and p.base_unit is not null
      and (
        to_tsvector('spanish', public.f_unaccent(p.name || ' ' || coalesce(p.brand, ''))) @@ query.tsq
        or query.plain operator(extensions.<%) public.f_unaccent(lower(p.name))
      )
  ),
  scored as (
    select found.*,
      case when starts_with(found.plain_name || ' ', query.first_word || ' ') then 1.5 else 0 end
        + extensions.similarity(query.plain, found.plain_name)
        + extensions.word_similarity(query.plain, found.plain_name)
        + ts_rank(to_tsvector('spanish', public.f_unaccent(found.name || ' ' || coalesce(found.brand, ''))), query.tsq)
        as score
    from found
    cross join query
  ),
  ranked as (
    select scored.*,
      row_number() over (
        partition by scored.store_key order by scored.score desc, length(scored.name), scored.price
      ) as n
    from scored
  )
  select r.store_key, r.store_sku, r.name, r.brand, r.base_qty, r.base_unit, r.size_qty, r.size_unit,
    r.size_source, r.price, r.unit_price, r.category
  from ranked r
  where r.n <= least(greatest(lim, 1), 10)
  order by r.store_key, r.n
$$;
