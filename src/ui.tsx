import type { ReactNode } from 'react'
import type { StoreKey } from '../supabase/functions/_shared/stores.ts'
import disco from './assets/stores/disco.png'
import geant from './assets/stores/geant.png'
import tata from './assets/stores/tata.png'

// The VIVERI mark as seven circles. Centers and radii are taken unchanged from the approved icon
// (C:\prompt-lab\assets\logo-app\v1\recommended-icon.svg); the viewBox only crops away the tile.
// Colors are the horizontal logo's: brand green dots, tangerine apex.
const pairs = [
  { r: 4.48, y: 27.05, x: [25.34, 70.66] },
  { r: 5.12, y: 38.67, x: [32.09, 63.91] },
  { r: 5.76, y: 51.4, x: [39.48, 56.52] },
]

export function Mark({ size = 24, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      className={animated ? 'mark animated' : 'mark'}
      viewBox="20.86 22.57 54.28 50.86"
      width={size}
      height={(size * 50.86) / 54.28}
      aria-hidden="true"
    >
      {pairs.map((pair, i) =>
        pair.x.map((cx) => <circle key={cx} className={`dot step-${i + 1}`} cx={cx} cy={pair.y} r={pair.r} fill="#1E8A5E" />),
      )}
      <circle className="dot step-4" cx={48} cy={66.07} r={7.36} fill="#E85D2A" />
    </svg>
  )
}

// Line icons on a 24 px grid, 1.75 stroke, drawn for this app.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const ChatIcon = () => (
  <Icon>
    <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6.5L6 20.5V17a2.5 2.5 0 0 1-2-2.5Z" />
  </Icon>
)

// Opens and closes a meal in the Menu; it turns when open.
export const ChevronIcon = () => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

// A bubble in front of another: more than one chat.
export const ChatsIcon = () => (
  <Icon>
    <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h7A2.5 2.5 0 0 1 15 6.5v4a2.5 2.5 0 0 1-2.5 2.5H8.5l-3 2.5V13A2.5 2.5 0 0 1 3 10.5Z" />
    <path d="M17.5 9h1a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-2.5 2.5v2.5l-3-2.5h-4A2.5 2.5 0 0 1 9 15.5" />
  </Icon>
)

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const MenuIcon = () => (
  <Icon>
    <rect x="3.75" y="5" width="16.5" height="15" rx="3" />
    <path d="M3.75 9.75h16.5M8 3v3.5M16 3v3.5" />
    <circle cx="8" cy="14.75" r="0.6" fill="currentColor" />
    <circle cx="12" cy="14.75" r="0.6" fill="currentColor" />
    <circle cx="16" cy="14.75" r="0.6" fill="currentColor" />
  </Icon>
)

export const ListIcon = () => (
  <Icon>
    <path d="M10.5 6.5H20M10.5 12H20M10.5 17.5H20M4 6.5l1.5 1.5L8 5.25M4 12l1.5 1.5L8 10.75" />
    <circle cx="6" cy="17.5" r="1.75" />
  </Icon>
)

export const ProfileIcon = () => (
  <Icon>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
  </Icon>
)

export const SendIcon = () => (
  <Icon>
    <path d="M12 18.5v-13M6.5 11 12 5.5l5.5 5.5" strokeWidth={2.25} />
  </Icon>
)

export const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.75" />
    <path d="M12 7.75v5" />
    <circle cx="12" cy="16.1" r="0.6" fill="currentColor" />
  </Icon>
)

export const MailIcon = () => (
  <Icon>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
    <path d="m4.5 7.75 7.5 5.25 7.5-5.25" />
  </Icon>
)

// An error that needs no action beyond reading it (with an action, compose .alert by hand).
export function Alert({ text }: { text: string }) {
  return (
    <div role="alert" className="alert">
      <AlertIcon />
      <p>{text}</p>
    </div>
  )
}

const count = (n: number) => Array.from({ length: n }, (_, i) => i)

// A page loading, in the shape of what's coming (Menu's day strip and card, List's card and rows) plus the label for screen
// readers. It reuses the real page's classes, so the gaps and hairlines match and the content arrives where it was.
export function PageSkeleton({ label, shape }: { label: string; shape: 'menu' | 'list' }) {
  return (
    <div className={`skeleton ${shape}-skeleton`} role="status">
      <span className="sr-only">{label}</span>
      {shape === 'menu' ? (
        <>
          <span className="skeleton-line strip" aria-hidden="true" />
          <section className="card day-card" aria-hidden="true">
            <span className="skeleton-line title" />
            {count(4).map((meal) => (
              <div key={meal} className="meal">
                <span className="skeleton-line slot" />
                <span className="skeleton-line recipe" />
              </div>
            ))}
          </section>
          <span className="skeleton-line pill" aria-hidden="true" />
        </>
      ) : (
        <>
          <section className="prices" aria-hidden="true">
            {count(5).map((line) => (
              <span key={line} className="skeleton-line" />
            ))}
          </section>
          <div className="list-actions" aria-hidden="true">
            <span className="skeleton-line pill" />
            <span className="skeleton-line pill" />
          </div>
          <section aria-hidden="true">
            <span className="skeleton-line section-heading" />
            <ul>
              {count(5).map((row) => (
                <li key={row}>
                  <span className="skeleton-line box" />
                  <span className="skeleton-line name" />
                  <span className="skeleton-line qty" />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}

// Nothing here yet, and the chat is where it comes from: the mark, one line, one way there.
export function EmptyState({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div className="empty-state">
      <Mark size={40} />
      <p>{text}</p>
      <button type="button" className="button primary" onClick={onAction}>
        {action}
      </button>
    </div>
  )
}

// Each supermarket's own square icon, from its website (docs/design.md, "Store icons").
const storeIcons: Record<StoreKey, string> = { disco, geant, tata }

// A supermarket's icon on a white tile, so it's never recolored. Decorative: the store's name
// is always written next to it.
export function StoreIcon({ store }: { store: StoreKey }) {
  return (
    <span className="store-icon" aria-hidden="true">
      <img src={storeIcons[store]} alt="" />
    </span>
  )
}
