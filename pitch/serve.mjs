// Serves the pitch decks in this folder on http://localhost:8080 (PORT overrides it). No dependencies.
// Run from the repo root with `npm run pitch`, then open the deck; P opens the presenter view.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT) || 8080
const deck = 'VIVERI_presentacion_v4.html'
const types = { '.html': 'text/html; charset=utf-8', '.pdf': 'application/pdf' }

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const file = normalize(join(root, path === '/' ? deck : path))
  if (!file.startsWith(root) || !/\.(html|pdf)$/.test(file)) return res.writeHead(404).end()
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': types[extname(file)], 'cache-control': 'no-store' }).end(body)
  } catch {
    res.writeHead(404).end()
  }
}).listen(port, '127.0.0.1', () => console.log(`VIVERI pitch: http://localhost:${port}/`))
