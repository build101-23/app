// The order button under the list (ADR 0034): it fills the selected supermarket's cart with what's left to buy there.
// Ta-Ta is a link, so its cart opens straight from the tap (ADR 0030). Disco and Géant need the extension, which
// isn't out yet, so their button shows disabled with "Muy pronto".
import { useState } from 'react'
import { cartFor, tataCartUrl } from '../supabase/functions/_shared/cart.ts'
import type { Pricing } from '../supabase/functions/_shared/offers.ts'
import type { StoreKey } from '../supabase/functions/_shared/stores.ts'
import { money, nameOf } from './format'
import { t } from './strings'
import { StoreIcon } from './ui'

// Ta-Ta fills by link in any browser.
const canFill = (store: StoreKey) => store === 'tata'

// compact: only the button, for the top of the List tab; the notes and the status stay with the full one below the list.
export default function Order({ p, store, compact = false }: { p: Pricing; store: StoreKey; compact?: boolean }) {
  const [opened, setOpened] = useState<StoreKey | null>(null)
  const label = (
    <>
      <StoreIcon store={store} />
      {compact ? t.cart.orderShort : t.cart.order(t.stores[store])}
    </>
  )

  if (!canFill(store)) {
    return (
      <section className={compact ? 'order compact' : 'order'}>
        <div className="order-soon">
          <button
            type="button"
            className={compact ? 'button primary small' : 'button primary'}
            aria-label={compact ? t.cart.order(t.stores[store]) : undefined}
            disabled
          >
            {label}
          </button>
          <span className="pill">{t.soon}</span>
        </div>
        {!compact && <p className="muted">{t.cart.byHand(t.stores[store])}</p>}
      </section>
    )
  }

  const cart = cartFor(
    p,
    store,
    p.needs.map((need) => need.id),
  )
  if (!cart.lines.length) return null
  const names = new Map(p.items.map((item) => [item.id, nameOf(item)]))
  // What stays out, one line per reason, worded so nothing has to agree with the names.
  const left = (['not_here', 'weighed', 'not_found'] as const).map((reason) => {
    const ids = cart.skipped.filter((skip) => skip.reason === reason).map((skip) => names.get(skip.id))
    return (
      ids.length > 0 && (
        <p key={reason} className="muted">
          {t.cart.left[reason](t.stores[store], ids.join(', '))}
        </p>
      )
    )
  })

  return (
    <section className={compact ? 'order compact' : 'order'}>
      <a
        className={compact ? 'button primary small' : 'button primary'}
        aria-label={compact ? t.cart.order(t.stores[store]) : undefined}
        href={tataCartUrl(cart.lines)}
        target="_blank"
        rel="noreferrer"
        onClick={() => setOpened(store)}
      >
        {label}
      </a>
      {!compact && (
        <>
          <p className="muted">{t.cart.adds(cart.lines.length, money(cart.total))}</p>
          {left}
          {/* Always mounted, so the line is announced when it appears. */}
          <p className="muted" role="status">
            {opened && t.cart.opened(t.stores[opened])}
          </p>
        </>
      )}
    </section>
  )
}
