// The cart buttons at the bottom of "Dónde comprar" (docs/plans/2026-10-18-fill-cart.md): one per store of the
// chosen option that this browser can fill, and the whole list at Ta-Ta when the option leaves Ta-Ta out or can't be
// filled here. Ta-Ta is a link, so its cart opens straight from the tap. Disco and Géant need the extension (PR 2).
import { useState } from 'react'
import { cartFor, optionCarts, tataCartUrl, type Cart as StoreCart } from '../supabase/functions/_shared/cart.ts'
import type { Pricing } from '../supabase/functions/_shared/offers.ts'
import type { Option, StoreKey } from '../supabase/functions/_shared/stores.ts'
import { money, nameOf } from './format'
import { t } from './strings'
import { StoreLogo } from './ui'

// Ta-Ta fills by link in any browser.
const canFill = (store: StoreKey) => store === 'tata'

export default function Cart({ p, chosen }: { p: Pricing; chosen: Option | null }) {
  const [opened, setOpened] = useState<StoreKey | null>(null)
  const names = new Map(p.items.map((item) => [item.id, nameOf(item)]))
  const listed = (ids: string[]) => ids.map((id) => names.get(id)).join(', ')
  // What a cart leaves out, one line per reason. Items no store sells get one line for the whole block (nowhere).
  const left = (cart: StoreCart) =>
    (['not_here', 'weighed'] as const).map((reason) => {
      const ids = cart.skipped.filter((skip) => skip.reason === reason).map((skip) => skip.id)
      return (
        ids.length > 0 && (
          <p key={reason} className="muted">
            {t.cart.left[reason](t.stores[cart.store], listed(ids))}
          </p>
        )
      )
    })
  // Each opens the store's cart in a new tab, straight from the tap.
  const link = (cart: StoreCart, className: string, label: string, logo = false) => (
    <a className={className} href={tataCartUrl(cart.lines)} target="_blank" rel="noreferrer" onClick={() => setOpened(cart.store)}>
      {logo && <StoreLogo store={cart.store} />}
      {label}
    </a>
  )

  const carts = chosen ? optionCarts(p, chosen).filter((cart) => canFill(cart.store) && cart.lines.length > 0) : []
  // The stores of the option this browser can't fill, with how many list items the option buys there: those keep the
  // link to their product in the list.
  const byHand = (chosen?.stores ?? [])
    .filter((store) => !canFill(store))
    .map((store) => ({ store, items: Object.values(chosen!.at).filter((at) => at === store).length }))
    .filter(({ items }) => items > 0)
  // The whole list at Ta-Ta, when it adds something to the option's Ta-Ta button (or there's none). Two items can pick
  // the same product, so the links are compared, not their line counts.
  const whole = cartFor(p, 'tata', p.needs.map((need) => need.id))
  const tata = carts.find((cart) => cart.store === 'tata')
  const showWhole = whole.lines.length > 0 && (!tata || tataCartUrl(whole.lines) !== tataCartUrl(tata.lines))
  if (!carts.length && !byHand.length && !showWhole) return null
  const nowhere = (carts.length > 0 || showWhole) && p.plan.notFound.length > 0

  return (
    <div className="cart">
      {carts.map((cart) => (
        <div key={cart.store} className="cart-store">
          {link(cart, 'button primary', t.cart.fill(t.stores[cart.store]), true)}
          <p className="muted">{t.cart.adds(cart.lines.length, money(cart.total))}</p>
          {left(cart)}
        </div>
      ))}
      {byHand.map(({ store, items }) => (
        <p key={store} className="muted">
          {t.cart.byHand(t.stores[store], items)}
        </p>
      ))}
      {showWhole && (
        <div className="cart-store">
          {link(whole, 'button quiet', t.cart.allAt(t.stores.tata, money(whole.total), whole.skipped.length))}
          {left(whole)}
        </div>
      )}
      {nowhere && <p className="muted">{t.cart.nowhere(listed(p.plan.notFound))}</p>}
      {/* Always mounted, so the line is announced when it appears. */}
      <p className="muted" role="status">
        {opened && t.cart.opened(t.stores[opened])}
      </p>
    </div>
  )
}
