import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

// The pitch deck is one self-contained file kept in pitch/; the build publishes it at /pitch/.
const pitchDeck = (): Plugin => ({
  name: 'pitch-deck',
  apply: 'build',
  generateBundle() {
    const source = readFileSync(new URL('./pitch/VIVERI_presentacion_v4.html', import.meta.url))
    this.emitFile({ type: 'asset', fileName: 'pitch/index.html', source })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), pitchDeck()],
  // `npm run dev:fixture` swaps the Supabase client for synthetic data, to review signed-in screens.
  resolve:
    mode === 'fixture'
      ? { alias: [{ find: /^\.\/supabase$/, replacement: fileURLToPath(new URL('./src/dev/fixture.ts', import.meta.url)) }] }
      : {},
}))
