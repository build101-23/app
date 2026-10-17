// Test fixtures shared by the _shared tests. Not imported by the app or the function.
import type { ProductRow } from './products.ts'

// A store_products row as the List tab and the chat read it: a 1 kg pack at $ 100 unless the test says otherwise.
export const row = (fields: Partial<ProductRow> & Pick<ProductRow, 'store_key' | 'store_sku'>): ProductRow => ({
  name: `Producto ${fields.store_sku}`,
  url_path: `/p/${fields.store_sku}`,
  base_qty: 1000,
  base_unit: 'g',
  size_qty: null,
  size_unit: null,
  size_source: 'name',
  price: 100,
  currency: 'UYU',
  availability: 'InStock',
  checked_at: '2026-10-17T21:00:00Z',
  stores: { base_url: 'https://www.example.uy' },
  ...fields,
})
