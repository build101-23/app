import type { ReactNode } from 'react'

// The VIVERI mark as seven circles. Centers and radii are taken unchanged from the approved icon
// (C:\prompt-lab\assets\logo-app\v1\recommended-icon.svg); the viewBox only crops away the tile.
// Colors come from tokens (--logo-dot, --logo-apex); the mark always sits on its black tile.
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
        pair.x.map((cx) => <circle key={cx} className={`dot step-${i + 1}`} cx={cx} cy={pair.y} r={pair.r} />),
      )}
      <circle className="dot step-4" cx={48} cy={66.07} r={7.36} />
    </svg>
  )
}

// The app icon: the mark on its black tile, in the icon's proportions (the mark spans about 57% of the tile).
export function Tile({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <span className="tile" style={{ width: size, height: size }} aria-hidden="true">
      <Mark size={size * 0.565} animated={animated} />
    </span>
  )
}

// The approved wordmark, path copied verbatim from recommended-horizontal.svg (cropped to the letters).
export function Wordmark({ height = 24 }: { height?: number }) {
  return (
    <svg
      className="wordmark"
      viewBox="89.76 16 162.8 40"
      height={height}
      width={(height * 162.8) / 40}
      role="img"
      aria-label="VIVERI"
    >
      <path d="M89.76 16L97.76 16L107.36 44.24L116.96 16L124.96 16L111.36 56L103.36 56ZM128.96 16L136.16 16L136.16 56L128.96 56ZM140.16 16L148.16 16L157.76 44.24L167.36 16L175.36 16L161.76 56L153.76 56ZM180.96 16L204.96 16L204.96 22.4L188.16 22.4L188.16 32.4L202.56 32.4L202.56 38.8L188.16 38.8L188.16 49.6L204.96 49.6L204.96 56L180.96 56ZM212.16 16L219.36 16L219.36 56L212.16 56ZM216.16 16H225.76A11.8 11.8 0 0 1 225.76 39.6H216.16ZM219.36 22.8V32.8H225.76A5 5 0 0 0 225.76 22.8ZM221.12 35.2L228.72 35.2L239.36 56L231.76 56ZM245.36 16L252.56 16L252.56 56L245.36 56Z" />
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
