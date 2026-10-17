// Dev-only: switch between the color directions under review. main.tsx loads this module only when
// import.meta.env.DEV, so neither it, the palette list nor their CSS reach the production build. Its labels
// are review tooling, not product copy, so they live here instead of src/strings.ts.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { palettes } from './palettes'
import './directions.css'
import './palettes.css'

const KEY = 'viveri-dev-direction'
const DEFAULT = 'naranja-zapallo'
const isKnown = (value: string | null): value is string => palettes.some((p) => p.id === value)

function initial(): string {
  const fromUrl = new URLSearchParams(window.location.search).get('direction')
  if (isKnown(fromUrl)) return fromUrl
  try {
    const saved = localStorage.getItem(KEY)
    if (isKnown(saved)) return saved
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the default still works.
  }
  return DEFAULT
}

// The shipped default lives in index.css, so it clears the attribute instead of setting one.
function apply(id: string) {
  if (id === DEFAULT) delete document.documentElement.dataset.direction
  else document.documentElement.dataset.direction = id
}

export default function Picker() {
  const [current, setCurrent] = useState(initial)
  const index = palettes.findIndex((p) => p.id === current)

  function choose(id: string) {
    setCurrent(id)
    apply(id)
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Not remembered; nothing else depends on it.
    }
  }

  const step = (delta: number) => choose(palettes[(index + delta + palettes.length) % palettes.length].id)

  return (
    <fieldset className="dev-picker">
      <legend>Paleta (dev)</legend>
      <div className="dev-picker-row">
        <button type="button" aria-label="Paleta anterior" onClick={() => step(-1)}>
          ‹
        </button>
        <select aria-label="Paleta" value={current} onChange={(e) => choose(e.target.value)}>
          {palettes.map((p, i) => (
            <option key={p.id} value={p.id}>
              {i + 1}. {p.name}
            </option>
          ))}
        </select>
        <button type="button" aria-label="Paleta siguiente" onClick={() => step(1)}>
          ›
        </button>
      </div>
      {palettes[index]?.mood && <p className="dev-picker-mood">{palettes[index].mood}</p>}
    </fieldset>
  )
}

apply(initial())
// ?picker=off hides the control (for clean screenshots) but keeps the chosen direction.
if (new URLSearchParams(window.location.search).get('picker') !== 'off') {
  const host = document.createElement('div')
  document.body.append(host)
  createRoot(host).render(<Picker />)
}
