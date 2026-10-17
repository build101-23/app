import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Dev-only color direction picker (src/dev/picker.tsx). Vite drops this branch from production builds.
if (import.meta.env.DEV) import('./dev/picker')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
