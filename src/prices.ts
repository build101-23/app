// The products the chat agent picked for the saved menu, as store_products has them now (ADR 0024). Read for the
// List tab and the chat's list card, and kept per set of skus, so switching tabs doesn't read them again.
import { useEffect, useState } from 'react'
import type { MenuData } from '../supabase/functions/_shared/menu.ts'
import { freshRows, productColumns, skusByStore, type Newest, type ProductRow } from '../supabase/functions/_shared/products.ts'
import { stores } from '../supabase/functions/_shared/stores.ts'
import { supabase } from './supabase'

// PostgREST cuts a read at 1000 rows without an error; a menu picks far fewer.
const MAX_ROWS = 1000
const reads = new Map<string, Promise<ProductRow[]>>()

// One query per store: Disco and Géant share sku ids. Rows a store no longer lists are left out (freshRows), as the
// chat function does, so the screen and the model price the same products.
function read(menu: MenuData, key: string): Promise<ProductRow[]> {
  const skus = skusByStore(menu)
  // Without the newest reads, no row is dropped: the rule is a filter, and the price still shows.
  const newest = Promise.resolve(supabase.rpc('store_newest')).then(({ data, error }) => {
    if (error) console.error(error)
    return (data ?? []) as Newest
  })
  const read = Promise.all(
    stores
      .filter((store) => skus[store].length)
      .map(async (store) => {
        const { data, error } = await supabase
          .from('store_products')
          .select(productColumns)
          .eq('store_key', store)
          .in('store_sku', skus[store])
        if (error) throw error
        if (data.length >= MAX_ROWS) throw new Error('too many products')
        return data as unknown as ProductRow[]
      }),
  ).then(async (rows) => freshRows(rows.flat(), await newest))
  reads.set(key, read)
  read.catch(() => reads.delete(key)) // a failed read is tried again next time
  return read
}

// undefined while loading, null if the read failed.
export function usePrices(menu: MenuData | null | undefined): ProductRow[] | null | undefined {
  const key = menu ? JSON.stringify(skusByStore(menu)) : ''
  const [loaded, setLoaded] = useState<{ key: string; rows: ProductRow[] | null }>()
  useEffect(() => {
    if (!menu) return
    let live = true
    ;(reads.get(key) ?? read(menu, key)).then(
      (rows) => live && setLoaded({ key, rows }),
      () => live && setLoaded({ key, rows: null }),
    )
    return () => {
      live = false
    }
    // The key is the menu's skus: a menu with the same products needs no new read.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return loaded?.key === key ? loaded.rows : undefined
}
