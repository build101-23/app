import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // `npm run dev:fixture` swaps the Supabase client for synthetic data, to review signed-in screens.
  resolve:
    mode === 'fixture'
      ? { alias: [{ find: /^\.\/supabase$/, replacement: fileURLToPath(new URL('./src/dev/fixture.ts', import.meta.url)) }] }
      : {},
}))
