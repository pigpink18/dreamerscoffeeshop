// Bake cảnh bếp 3D (KayKit Restaurant Bits – CC0, Kay Lousberg) ra ảnh pixel cho KitchenView.
// Cách chạy:  npx vite --port 5199   (ở thư mục gốc)   rồi   node tools/kaykit/bake.mjs
// Cần bộ gốc ở  coffee&cooking/KayKit_Restaurant_Bits_1.0_FREE  (symlink tools/kaykit/gltf trỏ vào Assets/gltf).
// Ra: public/assets/kitchen/{back,front,pan,pot,bowl,plate}.png (256x134) + src/game/kitchenArt.ts (điểm neo).
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const URL_ = process.env.URL || 'http://localhost:5199/tools/kaykit/bake.html'
export const CFG = { w: 256, h: 134, hw: 5.05, cx: 0, cy: 1.32, pitch: 0.34, dist: 20, stoveTop: 1.2, burnerZ: 1.25, panX: -0.45, potX: 0.5, bowlX: 1.45, plateX: -2.1, waffleX: 2.45 }
CFG.hh = (CFG.hw * CFG.h) / CFG.w

const port = 9400 + Math.floor(Math.random() * 400)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/kaykit-bake-${port}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
for (let i = 0; i < 40; i++) { try { const p = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); if (p) { ws = new WebSocket(p.webSocketDebuggerUrl); break } } catch {} await sleep(250) }
await new Promise((r) => ws.addEventListener('open', r))
let id = 0; const pend = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } })
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
await send('Page.navigate', { url: URL_ }); await sleep(2500)
const res = await send('Runtime.evaluate', { expression: `bake(${JSON.stringify(CFG)})`, awaitPromise: true, returnByValue: true })
const r = res?.result?.value
chrome.kill()
if (!r?.anchors) { console.error('Bake lỗi', JSON.stringify(res).slice(0, 500)); process.exit(1) }
const out = ROOT + 'public/assets/kitchen/'
mkdirSync(out, { recursive: true })
for (const k of ['back', 'front', 'pan', 'pot', 'bowl', 'plate']) writeFileSync(out + k + '.png', Buffer.from(r[k].split(',')[1], 'base64'))
writeFileSync(ROOT + 'src/game/kitchenArt.ts', `// TỰ SINH bởi tools/kaykit/bake.mjs – đừng sửa tay. Ảnh bếp 3D KayKit (CC0) ${CFG.w}x${CFG.h} + điểm neo (toạ độ ảnh).
export const KART_W = ${CFG.w}
export const KART_H = ${CFG.h}
export const KART_LAYERS = ['back', 'front', 'pan', 'pot', 'bowl', 'plate'] as const
export const KANCHOR = {
${Object.entries(r.anchors).map(([k, v]) => `  ${k}: [${v.join(', ')}],`).join('\n')}
} as const satisfies Record<string, readonly [number, number]>
`)
console.log('Xong:', Object.keys(r.anchors).join(', '))
process.exit(0)
