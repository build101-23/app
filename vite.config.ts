import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The fixture fakes Google's button too (src/dev/fixture.ts), so it needs a client ID to show it, but never the real
  // one from .env. FIXTURE_NO_GOOGLE=1 leaves it empty, to review the screen without Google. Vite gives process.env
  // priority over .env, empty values included.
  if (mode === 'fixture') process.env.VITE_GOOGLE_CLIENT_ID = process.env.FIXTURE_NO_GOOGLE ? '' : 'fixture-google-client-id'
  return {
    plugins: [react()],
    // `npm run dev:fixture` swaps the Supabase client for synthetic data, to review signed-in screens.
    resolve:
      mode === 'fixture'
        ? { alias: [{ find: /^\.\/supabase$/, replacement: fileURLToPath(new URL('./src/dev/fixture.ts', import.meta.url)) }] }
        : {},
  }
})
