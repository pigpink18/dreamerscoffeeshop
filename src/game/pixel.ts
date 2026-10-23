// Đồ hoạ pixel art: nhân vật, ly nước, icon nguyên liệu, cảnh quán.
// Máy espresso / shaker / máy xay / ly shot dùng bộ CC0 của KARSIORI STUDIO (public/assets/karsiori).
import type { Look, StepId } from './data'

export type Ctx = CanvasRenderingContext2D
export const OUT = '#3b2a20'

export function px(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  c.fillStyle = col
  c.fillRect(Math.round(x), Math.round(y), w, h)
}

/** Hình chữ nhật bo góc 1px có viền */
export function box(c: Ctx, x: number, y: number, w: number, h: number, col: string, outline = OUT) {
  px(c, x + 1, y, w - 2, h, outline)
  px(c, x, y + 1, w, h - 2, outline)
  px(c, x + 1, y + 1, w - 2, h - 2, col)
}

export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)))
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

export function mix(cols: string[]) {
  if (!cols.length) return '#ffffff'
  const rgb = cols.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)))
  const avg = [0, 1, 2].map((k) => Math.round(rgb.reduce((a, x) => a + x[k], 0) / rgb.length))
  return '#' + avg.map((v) => v.toString(16).padStart(2, '0')).join('')
}

// ---------- Ảnh từ bộ KARSIORI ----------
const base = import.meta.env.BASE_URL
const IMG_FILES = {
  espresso: 'espresso-machine-2.png',
  esp0: 'espresso-machine-1.png', // máy cấp 0
  esp2: 'espresso-machine-3.png', // máy cấp 2
  esp3: 'espresso-machine-4.png', // máy cấp 3
  shaker: 'shaker.png',
  blender: 'blender-1.png',
  shot: 'cup-1.png',
  pot: 'coffee-pot.png',
  potMachine: 'coffee-pot-machine-2.png',
}
export type ImgKey = keyof typeof IMG_FILES
export const IMG_URL = Object.fromEntries(Object.entries(IMG_FILES).map(([k, f]) => [k, `${base}assets/karsiori/${f}`])) as Record<ImgKey, string>
export const images: Partial<Record<ImgKey, HTMLImageElement>> = {}
export function loadImages() {
  return Promise.all(
    (Object.keys(IMG_FILES) as ImgKey[]).map(
      (k) => new Promise<void>((res) => {
        const im = new Image()
        im.onload = () => { images[k] = im; res() }
        im.onerror = () => res()
        im.src = IMG_URL[k]
      }),
    ),
  )
}

// ---------- Icon nguyên liệu (vẽ bằng chuỗi ký tự) ----------
const PAL: Record<string, string> = {
  k: OUT, w: '#fffaf2', c: '#f3e3c8', b: '#8a5a3c', d: '#5a3a28', g: '#7fb34d', G: '#4e7f2e',
  r: '#d9534f', R: '#a83a36', y: '#f2c14e', o: '#e8873a', A: '#b5761f', a: '#e0a03a', p: '#f4a46e',
  P: '#ff9aa8', i: '#dff4fb', I: '#9fd3ea', x: '#c4cbd1', X: '#7d858c', B: '#5b8bd9', n: '#2e3f6e',
}

const ICONS: Record<string, string[]> = {
  ly: [
    '.kkkkkkkkkk.', '.kiwwwwwwwk.', '.kiwwwwwwwk.', '..kiwwwwwk..', '..kiwwwwwk..',
    '..kiwwwwwk..', '..kiwwwwwk..', '...kiwwwk...', '...kiwwwk...', '...kkkkk....',
  ],
  da: [
    '..kkk..kkk..', '.kiiIk.kiik.', '.kkIkkkkIkk.', '.kxxxxxxxxk.', '.kXxxxxxxXk.',
    '.kxxxxxxxxk.', '..kxxxxxxk..', '..kXxxxxXk..', '...kkkkkk...',
  ],
  suaDac: [
    '..kkkkkkkk..', '.kxxxxxxxxk.', '.kkkkkkkkkk.', '.krrrrrrrrk.', '.kwwwwwwwwk.',
    '.kwyyyyyywk.', '.kwyRRyyywk.', '.kwwwwwwwwk.', '.krrrrrrrrk.', '.kkkkkkkkkk.',
  ],
  suaTuoi: [
    '....kkkk....', '...kwwwwk...', '..kwwwwwwk..', '.kkkkkkkkkk.', '.kwwwwwwwBk.',
    '.kwBBBwwwBk.', '.kwBwBwwwBk.', '.kwBBBwwwBk.', '.kwwwwwwwBk.', '.kwwwwwwwBk.', '.kkkkkkkkkk.',
  ],
  matcha: [
    '..kkkkkkkk..', '.kGGGGGGGGk.', '.kkkkkkkkkk.', '.kggggggggk.', '.kgwwwwwwgk.',
    '.kgwggggwgk.', '.kgwgGGgwgk.', '.kgwwwwwwgk.', '.kggggggggk.', '.kGGGGGGGGk.', '..kkkkkkkk..',
  ],
  tra: [
    '.....kk.....', '...kkookk...', '..koooooook.', 'kkooyoooooko', 'kooooooooook',
    '.kooooooookk', '.kAoooooook.', '..kkkkkkkk..',
  ],
  dao: [
    '...kkkkkk...', '...kXXXXk...', '..kkkkkkkk..', '..kiiiiiik..', '..kippiipk..',
    '..kpPpippk..', '..kippppik..', '..kiipppik..', '..kkkkkkkk..',
  ],
  kem: [
    '....kkkk....', '....kBBk....', '...kkkkkk...', '..kwwwwwwk..', '..kwnnnnwk..',
    '..kwnwwnwk..', '..kwnnnnwk..', '..kwwwwwwk..', '..kwwwwwwk..', '..kkkkkkkk..',
  ],
  kemTuoi: [
    '.....kk.....', '.....kwk....', '....kxxk....', '...kkkkkk...', '...kPPPPk...',
    '...kwwwwk...', '...kwPPwk...', '...kwwwwk...', '...kPPPPk...', '...kkkkkk...',
  ],
  syrup: [
    '.....kkk....', '.....kXkkk..', '.....kXk....', '....kkkkk...', '...kaaaaak..',
    '...kawwwak..', '...kawAwak..', '...kawwwak..', '...kaaaaak..', '...kAAAAAk..', '...kkkkkkk..',
  ],
  khuay: [
    '.........kk.', '........kxxk', '.......kxxk.', '......kxk...', '.....kxk....',
    '....kxk.....', '...kxk......', '..kxk.......', '.kxk........', '.kk.........',
  ],
  trash: [
    '....kkkk....', '.kkkkkkkkkk.', '.kxxxxxxxxk.', '..kxXxXxXk..', '..kxXxXxXk..',
    '..kxXxXxXk..', '..kxXxXxXk..', '..kxxxxxxk..', '...kkkkkk...',
  ],
  cafe: [
    '..kkkkkk....', '.kbbbbbbk...', '.kddddddk...', 'kbbbbbbbbk..', 'kbccccccbk..',
    'kbcdkkdcbk..', 'kbcdkkdcbk..', 'kbccccccbk..', 'kbbbbbbbbk..', '.kkkkkkkk...',
  ],
}

const iconCache: Record<string, string> = {}
/** Trả về dataURL của icon pixel (hiển thị bằng CSS image-rendering: pixelated) */
export function iconUrl(name: string): string {
  if (iconCache[name]) return iconCache[name]
  const rows = ICONS[name]
  if (!rows) return ''
  const w = Math.max(...rows.map((r) => r.length))
  const h = rows.length
  const cv = document.createElement('canvas')
  cv.width = 12
  cv.height = 12
  const c = cv.getContext('2d')!
  const ox = Math.floor((12 - w) / 2), oy = Math.floor((12 - h) / 2)
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (PAL[ch]) px(c, ox + x, oy + y, 1, 1, PAL[ch]) }))
  iconCache[name] = cv.toDataURL()
  return iconCache[name]
}
export const hasIcon = (name: string) => !!ICONS[name]

// ---------- Ly nước ----------
export interface CupLook {
  cup: boolean
  layers: string[]
  ice: boolean
  mixed: boolean
  foam: boolean
  whip: boolean
  blended: boolean
  chunks: boolean
  straw?: boolean
  lid?: boolean
  full?: boolean // ly thành phẩm: rót đầy
}

export const emptyCup = (): CupLook => ({ cup: false, layers: [], ice: false, mixed: false, foam: false, whip: false, blended: false, chunks: false })

/** Ly nhựa 12x17 (gốc trên-trái), có thể thêm kem/ống hút lên trên */
export function drawCup(c: Ctx, s: CupLook, x: number, y: number, t = 0) {
  const W = 12, H = 17
  const rim = '#6a5545'
  if (!s.cup) {
    c.globalAlpha = 0.25
    for (let i = 0; i < H; i += 2) { px(c, x + Math.floor(i / 6), y + i, 1, 1, rim); px(c, x + W - 1 - Math.floor(i / 6), y + i, 1, 1, rim) }
    c.globalAlpha = 1
    return
  }
  const left = (r: number) => Math.floor(r / 6)
  const right = (r: number) => W - 1 - Math.floor(r / 6)
  // nền ly trong
  for (let r = 1; r < H; r++) px(c, x + left(r) + 1, y + r, right(r) - left(r) - 1, 1, 'rgba(255,255,255,0.55)')

  // chất lỏng
  const layers = s.mixed || s.blended ? (s.layers.length ? [mix(s.layers)] : []) : s.layers
  const n = s.layers.length
  const fillRows = s.full && n ? H - 4 : Math.min(H - 3, Math.max(0, n * 4))
  if (fillRows > 0 && layers.length) {
    const per = fillRows / layers.length
    for (let i = 0; i < fillRows; i++) {
      const r = H - 2 - i
      const col = layers[Math.min(layers.length - 1, Math.floor(i / per))]
      px(c, x + left(r) + 1, y + r, right(r) - left(r) - 1, 1, col)
      if (s.blended && (i + r) % 3 === 0) px(c, x + left(r) + 2 + ((i * 5) % 6), y + r, 1, 1, 'rgba(255,255,255,0.6)')
    }
    // gợn sóng bề mặt
    const top = H - 1 - fillRows
    px(c, x + left(top) + 2, y + top, 3, 1, shade(layers[layers.length - 1], 30))
  }
  // miếng đào
  if (s.chunks) {
    px(c, x + 3, y + H - 4, 2, 2, '#f08a4b'); px(c, x + 7, y + H - 6, 2, 2, '#f08a4b')
  }
  // đá viên
  if (s.ice) {
    const iy = fillRows > 6 ? y + H - fillRows : y + H - 7
    const cubes = [[2, 0], [6, 1], [4, 3]]
    for (const [cx, cy] of cubes) {
      px(c, x + cx, iy + cy, 3, 3, 'rgba(223,244,251,0.85)')
      px(c, x + cx, iy + cy, 1, 1, '#ffffff')
      px(c, x + cx + 2, iy + cy + 2, 1, 1, 'rgba(120,180,210,0.7)')
    }
  }
  // lớp kem muối
  if (s.foam) {
    const top = H - 2 - fillRows
    px(c, x + left(top) + 1, y + top - 1, right(top) - left(top) - 1, 2, '#fffaf0')
    px(c, x + 3, y + top, 2, 1, '#f1e4cc')
  }
  // viền ly
  for (let r = 0; r < H; r++) { px(c, x + left(r), y + r, 1, 1, rim); px(c, x + right(r), y + r, 1, 1, rim) }
  px(c, x - 1, y, W + 2, 1, rim)
  px(c, x + left(H - 1), y + H - 1, right(H - 1) - left(H - 1) + 1, 1, rim)
  // ánh sáng
  for (let r = 2; r < H - 3; r++) px(c, x + left(r) + 1, y + r, 1, 1, 'rgba(255,255,255,0.7)')
  // kem tươi trên miệng ly
  if (s.whip) {
    px(c, x + 1, y - 2, 10, 2, '#ffffff'); px(c, x + 3, y - 4, 6, 2, '#ffffff'); px(c, x + 5, y - 5, 2, 1, '#ffffff')
    px(c, x + 2, y - 1, 8, 1, '#eee6da'); px(c, x + 4, y - 3, 4, 1, '#eee6da')
    px(c, x + 5, y - 4, 1, 1, '#7fb34d')
  }
  if (s.lid) {
    px(c, x - 1, y - 1, W + 2, 1, 'rgba(255,255,255,0.8)')
    if (!s.whip) { px(c, x + 2, y - 3, 8, 2, 'rgba(255,255,255,0.55)'); px(c, x + 2, y - 3, 8, 1, 'rgba(160,140,120,0.5)') }
  }
  if (s.straw) {
    px(c, x + 7, y - 8, 2, 10, '#2fa38c')
    px(c, x + 7, y - 8, 1, 10, '#53c4ab')
  }
  void t
}

// ---------- Nhân vật ----------
export type Mood = 'neutral' | 'happy' | 'angry' | 'sad' | 'love' | 'grumpy'

/** Vẽ khách 16 rộng; (x,y) = đỉnh đầu. Phần dưới bị quầy che. */
export function drawPerson(c: Ctx, L: Look, x: number, y: number, mood: Mood, blink: boolean) {
  const acc = L.acc ?? []
  const skinS = shade(L.skin, -28)
  const shirtS = shade(L.shirt, -30)
  const hairS = shade(L.hair, -25)
  // tóc dài phía sau
  if (L.style === 'long') box(c, x + 1, y + 3, 14, 14, L.hair)
  if (L.style === 'bob') box(c, x + 1, y + 3, 14, 9, L.hair)
  if (L.style === 'afro') {
    // tóc xù tổ quạ to đùng
    box(c, x - 4, y - 5, 24, 18, L.hair)
    for (let i = 0; i < 7; i++) { px(c, x - 4 + i * 4, y - 6 - (i % 2), 3, 2, L.hair); px(c, x - 5, y - 3 + i * 2, 2, 2, L.hair); px(c, x + 19, y - 3 + i * 2, 2, 2, L.hair) }
    for (let i = 0; i < 6; i++) px(c, x - 2 + i * 4, y - 3 + ((i * 3) % 5), 2, 1, shade(L.hair, 35))
  }
  // thân
  box(c, x, y + 14, 16, 16, L.shirt)
  px(c, x + 1, y + 15, 14, 1, shade(L.shirt, 25))
  px(c, x + 3, y + 19, 1, 10, shirtS)
  px(c, x + 12, y + 19, 1, 10, shirtS)
  if (acc.includes('hoodie')) {
    px(c, x + 4, y + 13, 8, 2, shirtS)
    px(c, x + 6, y + 16, 1, 4, '#e8e2da'); px(c, x + 9, y + 16, 1, 4, '#e8e2da')
  }
  // cổ
  px(c, x + 6, y + 12, 4, 3, skinS)
  if (acc.includes('collar')) { px(c, x + 5, y + 14, 2, 2, '#ffffff'); px(c, x + 9, y + 14, 2, 2, '#ffffff') }
  if (acc.includes('tie')) { px(c, x + 7, y + 15, 2, 1, L.accent ?? '#2e3f6e'); px(c, x + 7, y + 16, 2, 6, L.accent ?? '#2e3f6e') }
  // đầu
  box(c, x + 3, y + 3, 10, 11, L.skin)
  px(c, x + 4, y + 12, 8, 1, skinS)
  px(c, x + 2, y + 8, 1, 2, L.skin) // tai
  px(c, x + 13, y + 8, 1, 2, L.skin)
  // mắt
  const ey = y + 8
  if (blink || mood === 'happy' || mood === 'love') {
    px(c, x + 5, ey, 2, 1, OUT); px(c, x + 9, ey, 2, 1, OUT)
    if (!blink) { px(c, x + 5, ey - 1, 1, 1, L.skin); px(c, x + 10, ey - 1, 1, 1, L.skin) }
  } else {
    px(c, x + 5, ey - 1, 2, 2, OUT); px(c, x + 9, ey - 1, 2, 2, OUT)
    px(c, x + 5, ey - 1, 1, 1, '#ffffff'); px(c, x + 9, ey - 1, 1, 1, '#ffffff')
  }
  if (mood === 'grumpy') {
    // mắt lườm nửa mí + chân mày chữ V
    px(c, x + 5, ey - 1, 2, 1, L.skin); px(c, x + 9, ey - 1, 2, 1, L.skin)
    px(c, x + 4, ey - 3, 1, 1, OUT); px(c, x + 5, ey - 2, 2, 1, OUT); px(c, x + 11, ey - 3, 1, 1, OUT); px(c, x + 9, ey - 2, 2, 1, OUT)
  }
  if (mood === 'angry') { px(c, x + 4, ey - 3, 2, 1, OUT); px(c, x + 6, ey - 2, 1, 1, OUT); px(c, x + 10, ey - 3, 2, 1, OUT); px(c, x + 9, ey - 2, 1, 1, OUT) }
  if (mood === 'sad') { px(c, x + 5, ey - 3, 2, 1, OUT); px(c, x + 9, ey - 3, 2, 1, OUT) }
  // má hồng
  if (acc.includes('blush') || mood === 'happy' || mood === 'love') { px(c, x + 4, ey + 2, 2, 1, '#ff9aa8'); px(c, x + 10, ey + 2, 2, 1, '#ff9aa8') }
  if (mood === 'angry') { px(c, x + 4, ey + 2, 2, 1, '#ff6b6b'); px(c, x + 10, ey + 2, 2, 1, '#ff6b6b') }
  // miệng
  const my = y + 11
  if (mood === 'happy' || mood === 'love') { px(c, x + 6, my, 4, 1, '#8a3a2a'); px(c, x + 7, my + 1, 2, 1, '#e86a5a') }
  else if (mood === 'angry' || mood === 'sad' || mood === 'grumpy') { px(c, x + 6, my + 1, 4, 1, '#8a3a2a'); px(c, x + 6, my, 1, 1, '#8a3a2a'); px(c, x + 9, my, 1, 1, '#8a3a2a') }
  else px(c, x + 7, my, 2, 1, '#8a3a2a')
  if (acc.includes('beard')) { px(c, x + 4, y + 11, 8, 3, L.hair); px(c, x + 6, my, 4, 1, '#8a3a2a') }
  if (acc.includes('glasses')) {
    px(c, x + 4, ey - 2, 4, 1, OUT); px(c, x + 4, ey + 1, 4, 1, OUT); px(c, x + 4, ey - 2, 1, 4, OUT); px(c, x + 7, ey - 2, 1, 4, OUT)
    px(c, x + 8, ey - 2, 4, 1, OUT); px(c, x + 8, ey + 1, 4, 1, OUT); px(c, x + 8, ey - 2, 1, 4, OUT); px(c, x + 11, ey - 2, 1, 4, OUT)
  }
  if (acc.includes('earring')) px(c, x + 2, y + 10, 1, 1, '#f2c14e')
  if (acc.includes('shades')) {
    px(c, x + 3, ey - 2, 10, 1, '#111')
    px(c, x + 4, ey - 1, 3, 2, '#111'); px(c, x + 9, ey - 1, 3, 2, '#111')
    px(c, x + 4, ey - 1, 1, 1, '#6b7a8f'); px(c, x + 9, ey - 1, 1, 1, '#6b7a8f')
  }
  if (acc.includes('unibrow')) px(c, x + 4, ey - 3, 8, 2, L.hair)
  if (acc.includes('tattoobrow')) { px(c, x + 4, ey - 4, 1, 1, '#3b2a20'); px(c, x + 5, ey - 3, 2, 1, '#3b2a20'); px(c, x + 11, ey - 4, 1, 1, '#3b2a20'); px(c, x + 9, ey - 3, 2, 1, '#3b2a20') }
  if (acc.includes('mustache')) { px(c, x + 5, y + 10, 6, 1, L.hair); px(c, x + 4, y + 9, 1, 2, L.hair); px(c, x + 11, y + 9, 1, 2, L.hair); px(c, x + 3, y + 8, 1, 1, L.hair); px(c, x + 12, y + 8, 1, 1, L.hair) }
  if (acc.includes('lipstick')) { px(c, x + 6, y + 11, 4, 1, '#d81b3c'); px(c, x + 7, y + 12, 2, 1, '#a3122b') }
  if (acc.includes('nosering')) px(c, x + 8, y + 10, 1, 1, '#c0c0c0')
  if (acc.includes('goldtooth')) px(c, x + 8, y + 11, 1, 1, '#ffd700')
  if (acc.includes('hoops')) { px(c, x + 1, y + 9, 1, 4, '#f2c14e'); px(c, x + 2, y + 12, 1, 1, '#f2c14e'); px(c, x + 14, y + 9, 1, 4, '#f2c14e'); px(c, x + 13, y + 12, 1, 1, '#f2c14e') }
  if (acc.includes('catglasses')) {
    const g = L.accent ?? '#d81b60'
    px(c, x + 3, ey - 2, 5, 1, g); px(c, x + 3, ey + 1, 5, 1, g); px(c, x + 3, ey - 2, 1, 4, g); px(c, x + 7, ey - 2, 1, 4, g)
    px(c, x + 8, ey - 2, 5, 1, g); px(c, x + 8, ey + 1, 5, 1, g); px(c, x + 8, ey - 2, 1, 4, g); px(c, x + 12, ey - 2, 1, 4, g)
    px(c, x + 2, ey - 3, 2, 1, g); px(c, x + 12, ey - 3, 2, 1, g)
  }
  if (acc.includes('bottleglasses')) {
    box(c, x + 3, ey - 3, 5, 5, '#e8f6ff'); box(c, x + 8, ey - 3, 5, 5, '#e8f6ff')
    px(c, x + 5, ey - 1, 1, 1, OUT); px(c, x + 10, ey - 1, 1, 1, OUT)
    px(c, x + 4, ey - 2, 1, 1, '#ffffff'); px(c, x + 9, ey - 2, 1, 1, '#ffffff')
  }
  if (acc.includes('scarf')) { px(c, x + 3, y + 13, 10, 2, L.accent ?? '#ff9ac1'); px(c, x + 4, y + 14, 2, 1, '#ffffff'); px(c, x + 9, y + 14, 2, 1, '#ffffff'); px(c, x + 10, y + 15, 2, 4, L.accent ?? '#ff9ac1') }
  if (acc.includes('chain')) { for (let i = 0; i < 6; i++) px(c, x + 5 + i, y + 15 + (i === 0 || i === 5 ? 0 : 1), 1, 1, '#f2c14e'); px(c, x + 7, y + 17, 2, 2, '#f2c14e') }

  // tóc / nón
  const H = L.hair
  switch (L.style) {
    case 'short': case 'long': case 'bob': case 'messy': case 'spiky': case 'bun':
      box(c, x + 2, y + 1, 12, 6, H)
      px(c, x + 3, y + 2, 10, 1, shade(H, 25))
      px(c, x + 3, y + 7, 1, 3, H); px(c, x + 12, y + 7, 1, 3, H)
      px(c, x + 4, y + 6, 4, 1, hairS)
      if (L.style === 'messy') { px(c, x + 4, y, 2, 1, H); px(c, x + 8, y - 1, 2, 2, H); px(c, x + 12, y, 1, 2, H) }
      if (L.style === 'spiky') { for (let i = 0; i < 5; i++) px(c, x + 3 + i * 2, y - 1 - (i % 2), 1, 2, H) }
      if (L.style === 'bun') { box(c, x + 5, y - 3, 6, 5, H); px(c, x + 6, y - 2, 2, 1, shade(H, 30)) }
      if (L.style === 'bob') { px(c, x + 3, y + 6, 10, 1, H) }
      break
    case 'afro':
      break // đã vẽ phía sau đầu
    case 'combover':
      // hói, vài sợi tóc vuốt ngang
      px(c, x + 3, y + 3, 10, 1, shade(L.skin, 18))
      px(c, x + 4, y + 3, 8, 1, H); px(c, x + 5, y + 4, 7, 1, H); px(c, x + 3, y + 5, 2, 1, H)
      px(c, x + 3, y + 7, 1, 3, H); px(c, x + 12, y + 7, 1, 3, H)
      break
    case 'mohawk':
      // mào gà dựng đứng
      for (let i = 0; i < 7; i++) px(c, x + 6, y - 6 + i, 4, 1, i % 2 ? shade(H, -20) : H)
      px(c, x + 7, y - 8, 2, 2, H); px(c, x + 6, y + 1, 4, 3, H)
      px(c, x + 3, y + 4, 2, 4, shade(L.skin, -15)); px(c, x + 11, y + 4, 2, 4, shade(L.skin, -15))
      break
    case 'curlers':
      box(c, x + 2, y + 1, 12, 6, H)
      for (let i = 0; i < 4; i++) { box(c, x + 1 + i * 4, y - 1, 4, 4, L.accent ?? '#ff9ac1'); px(c, x + 2 + i * 4, y, 2, 1, '#ffffff') }
      px(c, x + 3, y + 7, 1, 3, H); px(c, x + 12, y + 7, 1, 3, H)
      break
    case 'sunhat':
      // mũ rộng vành to đùng + hoa
      box(c, x - 6, y + 3, 28, 3, '#f5deb3', '#8a6a3a')
      box(c, x + 2, y - 3, 12, 7, '#f5deb3', '#8a6a3a')
      px(c, x + 2, y + 2, 12, 1, L.accent ?? '#e86a5a')
      px(c, x + 11, y - 2, 3, 3, '#ff6b81'); px(c, x + 12, y - 1, 1, 1, '#f2c14e')
      px(c, x + 3, y + 6, 1, 4, H); px(c, x + 12, y + 6, 1, 4, H)
      break
    case 'beret':
      box(c, x + 2, y, 13, 5, L.accent ?? '#8e1b2c')
      px(c, x + 8, y - 1, 2, 1, L.accent ?? '#8e1b2c')
      px(c, x + 3, y + 5, 1, 3, H); px(c, x + 12, y + 5, 1, 3, H)
      break
    case 'slick':
      box(c, x + 2, y + 1, 12, 6, H)
      px(c, x + 4, y + 2, 7, 1, shade(H, 45)); px(c, x + 3, y + 3, 4, 1, shade(H, 30))
      px(c, x + 3, y + 7, 1, 2, H); px(c, x + 12, y + 7, 1, 2, H)
      break
    case 'cap':
      box(c, x + 2, y + 1, 12, 5, L.accent ?? '#5b8bd9')
      px(c, x + 3, y + 2, 10, 1, shade(L.accent ?? '#5b8bd9', 30))
      px(c, x + 10, y + 5, 6, 2, shade(L.accent ?? '#5b8bd9', -30))
      px(c, x + 3, y + 6, 1, 3, H); px(c, x + 12, y + 6, 1, 3, H)
      break
    case 'helmet':
      box(c, x + 1, y, 14, 8, L.accent ?? '#4f8a3c')
      px(c, x + 3, y + 1, 9, 1, shade(L.accent ?? '#4f8a3c', 35))
      px(c, x + 3, y + 6, 10, 1, '#2b2b2b')
      break
    case 'hardhat':
      box(c, x + 3, y, 10, 6, '#f2c14e')
      px(c, x + 1, y + 5, 14, 2, '#d9a92e')
      px(c, x + 5, y + 1, 3, 1, '#fff2b0')
      break
    case 'nonla':
      for (let i = 0; i < 7; i++) {
        const w = 2 + i * 3
        px(c, x + 8 - w / 2, y - 3 + i, w, 1, i === 6 ? '#b99a52' : '#e8d39a')
        px(c, x + 8 - w / 2, y - 3 + i, 1, 1, '#b99a52')
      }
      px(c, x + 4, y + 9, 1, 4, '#b99a52'); px(c, x + 11, y + 9, 1, 4, '#b99a52')
      break
  }
}

// ---------- Cảnh quán ----------
export const SCENE_W = 128
export const SCENE_H = 92
export const COUNTER_Y = 62

/** Màu bầu trời theo giờ trong ngày (0..1) */
function sky(f: number, rainy: boolean) {
  const stops: [number, string, string][] = [
    [0, '#ffd9a8', '#bfe3f2'],
    [0.25, '#9fd8f5', '#e2f4fb'],
    [0.6, '#8fcff0', '#dff1f9'],
    [0.8, '#ffb07a', '#ffd9a0'],
    [1, '#2d3561', '#6b5b95'],
  ]
  let a = stops[0], b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) if (f >= stops[i][0] && f <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break }
  const t = (f - a[0]) / Math.max(0.0001, b[0] - a[0])
  const lerp = (c1: string, c2: string) => mixWeighted(c1, c2, t)
  let top = lerp(a[1], b[1]), bot = lerp(a[2], b[2])
  if (rainy) { top = mixWeighted(top, '#7d8a99', 0.55); bot = mixWeighted(bot, '#a9b4c0', 0.55) }
  return [top, bot]
}
function mixWeighted(c1: string, c2: string, t: number) {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const A = p(c1), B = p(c2)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

export function drawRoom(c: Ctx, dayFrac: number, weather: string, time: number, jarCount = 5) {
  // tường
  px(c, 0, 0, SCENE_W, COUNTER_Y, '#f4e1c6')
  for (let x = 0; x < SCENE_W; x += 8) px(c, x, 0, 4, 44, '#efd8b9')
  // ốp gỗ
  px(c, 0, 44, SCENE_W, COUNTER_Y - 44, '#b07a52')
  px(c, 0, 44, SCENE_W, 2, '#8a5a3c')
  for (let x = 4; x < SCENE_W; x += 12) px(c, x, 48, 8, 12, '#a06c46')

  // cửa sổ
  const wx = 6, wy = 6, ww = 38, wh = 30
  box(c, wx - 2, wy - 2, ww + 4, wh + 4, '#7a4e33')
  const [st, sb] = sky(dayFrac, weather === 'rainy')
  for (let i = 0; i < wh; i++) px(c, wx, wy + i, ww, 1, mixWeighted(st, sb, i / wh))
  // mặt trời / trăng
  if (weather !== 'rainy') {
    const sx = wx + 4 + dayFrac * (ww - 10)
    const syy = wy + 8 + Math.abs(dayFrac - 0.45) * 22
    if (dayFrac < 0.9) { px(c, sx, syy, 5, 5, '#fff3b0'); px(c, sx + 1, syy - 1, 3, 7, '#fff3b0'); px(c, sx - 1, syy + 1, 7, 3, '#fff3b0') }
    else { px(c, wx + 28, wy + 5, 4, 4, '#f7f3d6'); px(c, wx + 27, wy + 5, 2, 2, '#2d3561'); for (let i = 0; i < 6; i++) px(c, wx + 3 + i * 6, wy + 3 + ((i * 7) % 12), 1, 1, '#ffffff') }
  }
  // mây
  const cx = wx + ((time * 2) % (ww + 20)) - 14
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip()
  px(c, cx, wy + 6, 10, 3, 'rgba(255,255,255,0.8)'); px(c, cx + 3, wy + 4, 5, 2, 'rgba(255,255,255,0.8)')
  // nhà phố phía xa
  const bld = ['#c9a68a', '#b58e74', '#d6b89c', '#a8806a']
  for (let i = 0; i < 5; i++) px(c, wx + i * 8, wy + wh - 8 - ((i * 5) % 7), 8, 20, bld[i % 4])
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) px(c, wx + i * 8 + 2, wy + wh - 5 - ((i * 5) % 7) + j * 3, 2, 1, dayFrac > 0.85 ? '#ffd56b' : '#8a6a58')
  // mưa
  if (weather === 'rainy') {
    for (let i = 0; i < 18; i++) {
      const rx = wx + ((i * 13 + time * 30) % ww)
      const ry = wy + ((i * 7 + time * 60) % wh)
      px(c, rx, ry, 1, 3, 'rgba(220,235,255,0.8)')
    }
  }
  c.restore()
  px(c, wx + ww / 2 - 1, wy, 2, wh, '#7a4e33')
  px(c, wx, wy + wh / 2 - 1, ww, 2, '#7a4e33')
  // bậu cửa + chậu cây
  px(c, wx - 3, wy + wh + 2, ww + 6, 2, '#8a5a3c')
  box(c, wx + 2, wy + wh - 4, 7, 6, '#d9744a')
  px(c, wx + 3, wy + wh - 8, 2, 4, '#4e7f2e'); px(c, wx + 6, wy + wh - 9, 2, 5, '#6aa84f'); px(c, wx + 4, wy + wh - 10, 2, 2, '#7fb34d')

  // bảng menu phấn
  const bx = 50, by = 5
  box(c, bx, by, 34, 26, '#2f4a3a', '#7a4e33')
  px(c, bx + 4, by + 3, 26, 1, '#e8efe6') // tiêu đề
  for (let i = 0; i < 5; i++) {
    px(c, bx + 3, by + 7 + i * 4, 14 + ((i * 5) % 6), 1, 'rgba(232,239,230,0.75)')
    px(c, bx + 25, by + 7 + i * 4, 6, 1, 'rgba(242,193,78,0.85)')
  }
  px(c, bx + 26, by + 2, 3, 3, '#ff9aa8')

  // đèn treo
  for (const lx of [94, 116]) {
    px(c, lx, 0, 1, 10, '#5a3a28')
    box(c, lx - 4, 9, 9, 5, '#2fa38c')
    px(c, lx - 2, 14, 5, 1, '#fff3b0')
    c.fillStyle = 'rgba(255,230,150,0.12)'
    c.beginPath(); c.moveTo(lx - 3, 14); c.lineTo(lx + 4, 14); c.lineTo(lx + 14, 44); c.lineTo(lx - 13, 44); c.fill()
  }
  // kệ + hũ
  px(c, 90, 30, 34, 2, '#7a4e33')
  const jars = ['#7fb34d', '#e0a03a', '#c98a2b', '#f4a46e', '#9fd3ea']
  jars.slice(0, jarCount).forEach((j, i) => { box(c, 91 + i * 7, 23, 5, 7, j); px(c, 92 + i * 7, 22, 3, 2, '#5a3a28') })
}

export function drawCounter(c: Ctx) {
  // mặt quầy
  px(c, 0, COUNTER_Y, SCENE_W, 5, '#d9a877')
  px(c, 0, COUNTER_Y, SCENE_W, 1, '#f0c79a')
  px(c, 0, COUNTER_Y + 4, SCENE_W, 1, '#8a5a3c')
  // thân quầy
  px(c, 0, COUNTER_Y + 5, SCENE_W, SCENE_H - COUNTER_Y - 5, '#8a5a3c')
  for (let x = 0; x < SCENE_W; x += 10) px(c, x, COUNTER_Y + 5, 1, SCENE_H - COUNTER_Y, '#7a4e33')
  // bảng hiệu: vẽ riêng trong sign.ts (drawSign) vì có chuyển động
}

/** Vị trí các thiết bị trên quầy */
export const LAYOUT = {
  espresso: { x: 3, y: COUNTER_Y - 23 }, // 26x25
  shotUnder: { x: 3 + 12, y: COUNTER_Y - 23 + 15 },
  cup: { x: 36, y: COUNTER_Y - 16 },
  shaker: { x: 56, y: COUNTER_Y - 15 },
  blender: { x: 108, y: COUNTER_Y - 27 },
  customerX: 78,
  customerY: COUNTER_Y - 26,
}

export function stepIcon(step: StepId): string {
  return iconUrl(step)
}

// ---------- Đồ trang trí theo nâng cấp (thấy ngay trong quán) ----------
export function espressoKey(level: number): ImgKey {
  return (['esp0', 'espresso', 'esp2', 'esp3'] as ImgKey[])[Math.min(3, level)]
}

/** Chậu cây trên quầy */
export function drawPlant(c: Ctx, x: number, y: number, big = false) {
  box(c, x, y + (big ? 8 : 5), 8, big ? 7 : 6, '#d9744a')
  px(c, x + 1, y + (big ? 9 : 6), 6, 1, '#e8936a')
  const g = ['#4e7f2e', '#6aa84f', '#7fb34d']
  if (big) {
    px(c, x + 3, y, 2, 9, g[0]); px(c, x - 1, y + 2, 4, 3, g[1]); px(c, x + 5, y + 1, 4, 3, g[2]); px(c, x, y + 5, 3, 3, g[2]); px(c, x + 5, y + 5, 4, 3, g[1])
  } else {
    px(c, x + 2, y + 1, 2, 4, g[1]); px(c, x + 4, y, 2, 5, g[0]); px(c, x + 1, y + 2, 1, 2, g[2]); px(c, x + 6, y + 2, 1, 2, g[2])
  }
}

/** Dây đèn nhấp nháy trên trần */
export function drawLights(c: Ctx, t: number) {
  const cols = ['#ff6b81', '#f2c14e', '#6ad08f', '#5b8bd9', '#b07ae0']
  for (let x = 0; x < SCENE_W; x++) px(c, x, 2 + Math.round(Math.sin(x / 6) * 1.5), 1, 1, '#5a3a28')
  for (let i = 0; i < 16; i++) {
    const x = 3 + i * 8
    const on = (Math.floor(t * 2) + i) % 3 !== 0
    px(c, x, 3 + Math.round(Math.sin(x / 6) * 1.5), 2, 2, on ? cols[i % cols.length] : '#8a7566')
  }
}

/** Cờ dây trang trí */
export function drawBunting(c: Ctx) {
  const cols = ['#e86a5a', '#f2c14e', '#5b8bd9', '#6aa84f']
  for (let i = 0; i < 6; i++) {
    const x = 6 + i * 7, y = 1
    for (let r = 0; r < 4; r++) px(c, x + r, y + r, 6 - r * 2 > 0 ? 6 - r * 2 : 1, 1, cols[i % 4])
  }
}

/** Biển neon OPEN trong cửa sổ */
export function drawOpenSign(c: Ctx, t: number) {
  const glow = Math.floor(t * 3) % 4 !== 0
  box(c, 28, 8, 15, 7, glow ? '#3a0f2a' : '#2a0f1f', '#ff4fa3')
  const col = glow ? '#ff7ac8' : '#a0507c'
  // O P E N bằng khối nhỏ
  px(c, 30, 10, 2, 3, col); px(c, 33, 10, 2, 3, col); px(c, 36, 10, 2, 3, col); px(c, 39, 10, 2, 3, col)
  px(c, 31, 11, 1, 1, glow ? '#3a0f2a' : '#2a0f1f')
}

/** Poster TikTok trên thân quầy */
export function drawPoster(c: Ctx, x: number, y: number) {
  box(c, x, y, 14, 16, '#161616', '#f4f4f0')
  px(c, x + 5, y + 3, 2, 8, '#25f4ee'); px(c, x + 6, y + 3, 2, 8, '#fe2c55'); px(c, x + 6, y + 3, 1, 8, '#ffffff')
  px(c, x + 3, y + 9, 3, 3, '#fe2c55'); px(c, x + 4, y + 9, 3, 3, '#ffffff')
  px(c, x + 8, y + 4, 3, 1, '#ffffff')
}

/** Mèo cam nằm ngủ trên quầy */
export function drawCat(c: Ctx, x: number, y: number, t: number) {
  const b = Math.floor(t * 1.5) % 2
  box(c, x, y + 2 - b, 11, 5 + b, '#f0a04b')
  px(c, x + 1, y + 1 - b, 2, 2, '#f0a04b'); px(c, x + 4, y + 1 - b, 2, 2, '#f0a04b')
  px(c, x + 2, y + 4, 1, 1, OUT); px(c, x + 5, y + 4, 1, 1, OUT)
  px(c, x + 6, y + 3, 4, 1, '#d9822b'); px(c, x + 10, y + 5, 3, 1, '#f0a04b')
  if (b) { px(c, x + 12, y - 2, 1, 1, '#ffffff'); px(c, x + 13, y - 4, 2, 1, '#ffffff') }
}

/** Tủ đông nhỏ trên kệ */
export function drawFridge(c: Ctx, x: number, y: number) {
  box(c, x, y, 11, 9, '#e8f6ff', '#5b7a99')
  px(c, x + 1, y + 3, 9, 1, '#9fd3ea')
  px(c, x + 8, y + 1, 1, 2, '#5b7a99')
  px(c, x + 3, y + 5, 1, 1, '#5b8bd9'); px(c, x + 2, y + 6, 3, 1, '#5b8bd9'); px(c, x + 3, y + 7, 1, 1, '#5b8bd9')
}

/** Bao cà phê Cầu Đất */
export function drawSack(c: Ctx, x: number, y: number) {
  box(c, x, y + 2, 14, 13, '#b98a62', '#5a3a28')
  px(c, x + 3, y, 8, 3, '#b98a62'); px(c, x + 4, y, 6, 1, '#5a3a28')
  px(c, x + 3, y + 6, 8, 4, '#f4e1c6'); px(c, x + 5, y + 7, 4, 1, '#6aa84f'); px(c, x + 4, y + 8, 6, 1, '#6f4e37')
}

/** Biển sống xanh + ống hút tre */
export function drawGreen(c: Ctx, x: number, y: number) {
  box(c, x, y, 12, 8, '#e1f3ea', '#2f9e6b')
  px(c, x + 3, y + 2, 2, 4, '#2f9e6b'); px(c, x + 5, y + 2, 3, 2, '#6aa84f'); px(c, x + 8, y + 4, 2, 2, '#2f9e6b')
}

/** Xe máy shipper đậu ngoài cửa sổ */
export function drawScooter(c: Ctx, x: number, y: number) {
  px(c, x + 1, y + 4, 3, 3, '#2b2b2b'); px(c, x + 10, y + 4, 3, 3, '#2b2b2b')
  px(c, x + 2, y + 2, 10, 3, '#e8503a'); px(c, x + 10, y - 1, 2, 4, '#e8503a'); px(c, x + 9, y - 2, 4, 1, '#2b2b2b')
  box(c, x + 2, y - 3, 6, 5, '#f2c14e', '#7a5a00') // thùng hàng
}

/** Nhân viên pha chế đứng sau quầy */
export function drawBarista(c: Ctx, x: number, y: number, busy: boolean, t: number, hue = 0, progress = 0) {
  const look: Look = {
    skin: ['#f0c8a2', '#e2b089', '#f6d3b3'][hue % 3],
    hair: ['#2b1d16', '#6b4026', '#1d1612'][hue % 3],
    style: (['bun', 'short', 'bob'] as const)[hue % 3],
    shirt: '#fffaf2',
    acc: ['blush'],
  }
  const bob = busy ? Math.floor(t * 8) % 2 : 0
  drawPerson(c, look, x, y - bob, busy ? 'happy' : 'neutral', Math.floor(t * 10) % 41 === 0)
  // tạp dề + mũ
  px(c, x + 3, y + 17 - bob, 10, 10, '#6f4e37'); px(c, x + 5, y + 15 - bob, 6, 2, '#6f4e37')
  px(c, x + 3, y - bob, 10, 2, '#6f4e37')
  if (busy) {
    // đang pha: tay cầm shaker lắc lên xuống + thanh tiến độ trên đầu
    const sh = Math.floor(t * 10) % 2
    px(c, x + 13, y + 19 - sh * 2 - bob, 3, 3, look.skin)
    box(c, x + 13, y + 12 - sh * 2 - bob, 4, 8, '#c9ced6')
    px(c, x + 14, y + 11 - sh * 2 - bob, 2, 1, '#8a8f99')
    px(c, x, y - 6, 16, 3, OUT); px(c, x + 1, y - 5, 14, 1, '#5a4334')
    px(c, x + 1, y - 5, Math.max(1, Math.round(14 * Math.min(1, progress))), 1, '#3fd18b')
  } else {
    // rảnh: cầm khăn lau quầy qua lại
    const w = Math.round(Math.sin(t * 3 + hue) * 3)
    px(c, x + 5 + w, y + 22, 3, 2, look.skin)
    px(c, x + 3 + w, y + 24, 7, 1, '#7fb8d9')
    if (Math.floor(t * 4) % 3 === 0) px(c, x + 11 + w, y + 21, 1, 1, '#ffffff')
  }
}

/** Cáo – corgi mập lông muối tiêu (blue merle), nhìn sang phải. (x,y) = góc trên trái, ~25x16.
 *  pose: 'sit' ngồi · 'lie' nằm ngủ · 'stand' đứng vẫy đuôi */
export function drawCorgi(c: Ctx, x: number, y: number, t: number, pose: 'sit' | 'lie' | 'stand' = 'stand', happy = true) {
  const G = '#a9b0b8', D = '#575e69', L = '#d3d8de', W = '#fbf8f2', T = '#d89a5c', O = '#3b3f47'
  const wag = pose === 'lie' ? 0 : Math.floor(t * (happy ? 10 : 3)) % 2
  const breath = Math.floor(t * 1.6) % 2
  const yy = pose === 'lie' ? y + 3 : y
  // đuôi bông
  if (pose !== 'lie') { box(c, x, yy + 5 - wag, 4, 4, G, O); px(c, x + 1, yy + 5 - wag, 2, 1, W) }
  // thân tròn ú
  const bh = pose === 'lie' ? 8 + breath : 9
  box(c, x + 2, yy + 6, 17, bh, G, O)
  px(c, x + 3, yy + 7, 15, 1, L)
  // đốm merle
  px(c, x + 5, yy + 8, 3, 2, D); px(c, x + 10, yy + 9, 2, 2, D); px(c, x + 14, yy + 7, 3, 1, D); px(c, x + 7, yy + 11, 2, 1, D); px(c, x + 4, yy + 11, 1, 1, D); px(c, x + 15, yy + 10, 1, 1, D)
  px(c, x + 6, yy + bh + 4, 10, 1, W) // bụng trắng
  // chân ngắn cũn
  if (pose !== 'lie') {
    const st = pose === 'stand' ? Math.floor(t * 6) % 2 && happy ? 1 : 0 : 0
    for (const lx of [4, 7, 13, 16]) { px(c, x + lx, yy + 15, 2, 2 - (lx === 7 || lx === 16 ? st : 0), T); px(c, x + lx, yy + 16, 2, 1, W) }
  } else { px(c, x + 17, yy + 13, 4, 2, W); px(c, x + 4, yy + 13, 3, 2, W) }
  // đầu
  const hx = x + 14, hy = pose === 'sit' ? yy - 1 : yy + (pose === 'lie' ? 3 : 1)
  // tai to
  px(c, hx + 1, hy - 3, 3, 4, O); px(c, hx + 2, hy - 2, 1, 3, '#f0a8b0')
  px(c, hx + 6, hy - 3, 3, 4, O); px(c, hx + 7, hy - 2, 1, 3, '#f0a8b0')
  box(c, hx, hy, 10, 8, G, O)
  px(c, hx + 1, hy + 1, 3, 2, D)
  px(c, hx + 5, hy + 1, 1, 4, W) // sọc trắng giữa trán
  px(c, hx + 5, hy + 4, 5, 3, W) // mõm trắng
  px(c, hx + 1, hy + 5, 3, 1, T) // má vàng
  px(c, hx + 10, hy + 4, 1, 2, O) // mũi
  if (pose === 'lie') { px(c, hx + 6, hy + 3, 2, 1, O) } // ngủ
  else { const bl = Math.floor(t * 10) % 31 === 0; px(c, hx + 7, hy + 2, 1, bl ? 1 : 2, O); if (!bl) px(c, hx + 7, hy + 2, 1, 1, '#ffffff') }
  px(c, hx + 3, hy + 5, 1, 1, '#ff9aa8') // má hồng
  if (happy && pose !== 'lie') px(c, hx + 8, hy + 7, 2, 2, '#ff7a8a') // lè lưỡi
  if (pose === 'lie' && breath) { px(c, hx + 9, hy - 4, 2, 1, '#ffffff'); px(c, hx + 11, hy - 6, 2, 1, '#ffffff') }
}
