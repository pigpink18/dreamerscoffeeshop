<script setup lang="ts">
// Khu khách ngồi: bàn ghế, khách ngồi uống, bàn bẩn (chạm để lau & nhận tiền boa), nhân viên phục vụ đi dọn.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ui, save, bus, cleanSeat, maxTables, dirtySeats, CLEAN_TAPS, DAY_LENGTH, type GameEvent } from '../game/store'
import { moneyShort } from '../game/data'
import { SCENE_W, SCENE_H, px, box, OUT, sky, mixWeighted, drawPerson, drawPlant } from '../game/pixel'
import type { Look } from '../game/data'
import PixelIcon from './ui/PixelIcon.vue'

const cv = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let scale = 3
let raf = 0

// Khung khu ngồi cao hết trang: chiều cao logic H tính theo tỉ lệ khung (rộng luôn 128).
// Bàn chia lưới đều, cân đối 2 bên: 4 bàn → 2x2; 6 bàn → 2 cột x 3 hàng (màn cao) hoặc 3 cột x 2 hàng (màn thấp).
let H = SCENE_H
const WALL = 30
const BLOCK = 31 // 1 hàng bàn: từ đỉnh đầu khách (ty-20) tới chân bàn (ty+11)
const grid = () => {
  const n = maxTables.value
  if (n <= 4) return { C: 2, R: 2 }
  return H - WALL >= 3 * BLOCK + 4 * 6 ? { C: 2, R: 3 } : { C: 3, R: 2 }
}
const slot = (i: number) => {
  const { C, R } = grid()
  const c = i % C, r = Math.min(R - 1, Math.floor(i / C))
  const gap = (H - WALL - 2 - R * BLOCK) / (R + 1)
  return { cx: Math.round((SCENE_W * (c + 0.5)) / C), ty: Math.round(WALL + 2 + gap * (r + 1) + BLOCK * r + 20), row: r }
}
/** chỗ đứng chờ của nhân viên phục vụ: lối đi giữa các cột bàn */
const aisle = (k: number) => {
  const { C, R } = grid()
  if (C === 2) { const r = Math.min(R - 1, k); return { x: SCENE_W / 2 - 8, y: slot(r * 2).ty - 26 } }
  return { x: Math.round((SCENE_W * (1 + (k % 2))) / 3) - 8, y: slot(0).ty - 37 }
}

const fx = ref<{ id: number; text: string; x: number; y: number }[]>([])
let fxId = 0
const wipes: { seat: number; at: number }[] = []

function onEvent(e: GameEvent) {
  if (e.type !== 'seatClean') return
  const s = slot(e.seat)
  if (e.tip) {
    const id = ++fxId
    fx.value.push({ id, text: `+${moneyShort(e.tip)}`, x: (s.cx / SCENE_W) * 100, y: ((s.ty - 26) / H) * 100 })
    setTimeout(() => { fx.value = fx.value.filter((f) => f.id !== id) }, 1100)
  }
  wipes.push({ seat: e.seat, at: performance.now() })
}

function resize() {
  const canvas = cv.value, wrap = canvas?.parentElement
  if (!canvas || !wrap) return
  const w = wrap.clientWidth, h = wrap.clientHeight
  if (w < 50 || h < 50) return
  const dpr = window.devicePixelRatio || 1
  scale = Math.max(1, Math.ceil((w * dpr) / SCENE_W))
  H = Math.max(SCENE_H, Math.floor((h * SCENE_W) / w))
  if (canvas.width !== SCENE_W * scale || canvas.height !== H * scale) { canvas.width = SCENE_W * scale; canvas.height = H * scale }
  canvas.style.width = `${w}px`
  canvas.style.height = `${Math.floor((w * H) / SCENE_W)}px`
  ctx = canvas.getContext('2d')
}
let ro: ResizeObserver | null = null

// ---------- Vẽ ----------
function drawWall(c: CanvasRenderingContext2D, t: number) {
  const f = Math.min(1, ui.time / DAY_LENGTH)
  const premise = save.meta.premise
  const wall = premise === 2 ? '#e9dccb' : premise === 1 ? '#e8cfa8' : '#f4e1c6'
  px(c, 0, 0, SCENE_W, 30, wall)
  for (let x = 0; x < SCENE_W; x += 8) px(c, x, 0, 4, 24, shadeHex(wall, -6))
  // ốp gỗ chân tường
  px(c, 0, 24, SCENE_W, 6, '#b07a52'); px(c, 0, 24, SCENE_W, 1, '#8a5a3c')
  // 2 cửa sổ
  const [st, sb] = sky(f, save.weather === 'rainy')
  for (const wx of [8, 86]) {
    box(c, wx - 2, 2, 38, 18, '#7a4e33')
    for (let i = 0; i < 16; i++) px(c, wx, 3 + i, 34, 1, mixWeighted(st, sb, i / 16))
    px(c, wx + 16, 3, 2, 16, '#7a4e33')
    if (save.weather === 'rainy') for (let k = 0; k < 6; k++) { const yy = 3 + ((Math.floor(t * 30) + k * 5) % 15); px(c, wx + 3 + k * 5, yy, 1, 2, '#dfe8f2') }
  }
  // bảng phấn menu giữa tường
  box(c, 50, 4, 28, 16, '#33423a')
  px(c, 53, 7, 14, 1, '#e8e2da'); px(c, 53, 10, 20, 1, '#cfc8be'); px(c, 53, 13, 10, 1, '#cfc8be'); px(c, 53, 16, 17, 1, '#cfc8be')
  // đèn thả
  for (const lx of [32, 64, 96]) {
    px(c, lx, 0, 1, 5, OUT)
    box(c, lx - 3, 5, 7, 3, '#f2c14e')
    if (f > 0.7) px(c, lx - 1, 8, 3, 1, '#fff3b0')
  }
}
function shadeHex(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, '0')
  return '#' + ch(n >> 16) + ch((n >> 8) & 255) + ch(n & 255)
}
function drawFloor(c: CanvasRenderingContext2D) {
  const premise = save.meta.premise
  if (premise === 2) {
    for (let y = 30; y < H; y += 6) for (let x = 0; x < SCENE_W; x += 6) px(c, x, y, 6, 6, ((x + y) / 6) % 2 ? '#d9cdbd' : '#efe6d8')
  } else {
    px(c, 0, 30, SCENE_W, H - 30, premise === 1 ? '#b98552' : '#c8925f')
    for (let y = 30; y < H; y += 5) {
      px(c, 0, y, SCENE_W, 1, '#a87444')
      const off = ((y / 5) % 2) * 11
      for (let x = off; x < SCENE_W; x += 22) px(c, x, y, 1, 5, '#a87444')
    }
  }
  // thảm dưới khu bàn
  px(c, 4, 40, SCENE_W - 8, 2, 'rgba(0,0,0,0.05)')
}

// ---------- Bàn & ghế nhìn ngang: mỗi bàn 2 ghế hai bên, khách ngồi quay mặt vào bàn ----------
const FLOOR = 11 // chân bàn chạm sàn: ty + FLOOR
type Pen = (dx: number, dy: number, w: number, h: number, col: string) => void
/** bút vẽ theo phía: trái (quay sang phải) hoặc phải (lật gương). dx tính từ mép ngoài ghế, dy tính từ mặt bàn */
function pen(c: CanvasRenderingContext2D, cx: number, ty: number, side: 0 | 1): Pen {
  const ax = cx - 15
  return (dx, dy, w, h, col) => {
    const x = side === 0 ? ax + dx : 2 * cx - (ax + dx) - w
    px(c, x, ty + dy, w, h, col)
  }
}

const CHAIR = [
  { wood: '#8a5a3c', light: '#a87444', pad: '' },
  { wood: '#6b4026', light: '#8a5a3c', pad: '#c8463f' },
  { wood: '#3c4f8f', light: '#5b6fb5', pad: '#7d8fd0' },
]
function drawChair(P: Pen, lv: number) {
  const C = CHAIR[lv] ?? CHAIR[0]
  if (lv === 2) {
    // ghế bành bọc nhung
    P(0, -12, 3, 16, OUT); P(1, -11, 2, 14, C.light)
    P(0, 1, 10, 6, OUT); P(1, 2, 8, 4, C.light); P(1, 2, 8, 1, C.pad)
    P(1, 7, 2, 3, OUT); P(7, 7, 2, 3, OUT)
    return
  }
  // lưng ghế
  P(0, -11, 2, 15, OUT); P(1, -10, 1, 13, C.light)
  if (lv === 1) { P(1, -10, 3, 7, OUT); P(2, -9, 2, 5, C.pad) } // đệm lưng
  else { P(2, -8, 2, 1, C.wood); P(2, -5, 2, 1, C.wood) } // nan ghế
  // mặt ghế
  P(0, 3, 9, 2, OUT); P(1, 3, 7, 1, lv === 1 ? C.pad : C.light)
  // chân ghế
  P(1, 5, 1, FLOOR - 5, OUT); P(7, 5, 1, FLOOR - 5, OUT)
}

/** khách ngồi nghiêng (nhìn ngang) */
function drawSitter(P: Pen, L: Look, t: number, k: number, lv: number) {
  const sy = lv === 2 ? 1 : 3 // cao độ mặt ghế
  const skinS = shadeHex(L.skin, -28)
  const shirtS = shadeHex(L.shirt, -30)
  const pants = '#4a4458'
  const sip = Math.floor(t * 0.6 + k * 1.7) % 6 === 0
  // chân: đùi trên mặt ghế, bắp chân thả xuống gầm bàn
  P(3, sy - 2, 7, 3, pants)
  P(8, sy, 2, FLOOR - sy - 1, pants)
  P(8, FLOOR - 1, 4, 1, OUT)
  // thân
  P(2, sy - 12, 7, 11, L.shirt)
  P(2, sy - 12, 1, 11, shirtS)
  P(3, sy - 12, 5, 1, shadeHex(L.shirt, 25))
  // đầu (y từ sy-21)
  const hy = sy - 21 + (sip ? 1 : 0)
  P(4, hy + 8, 3, 2, skinS) // cổ
  P(3, hy + 1, 7, 8, L.skin) // mặt
  P(10, hy + 4, 1, 2, L.skin) // mũi
  P(4, hy + 8, 6, 1, skinS)
  // tóc theo kiểu
  const H = L.hair
  const st = L.style
  const hatCol = L.accent ?? '#c85a4a'
  if (st === 'afro') { P(0, hy - 3, 10, 7, H); P(0, hy + 4, 4, 5, H) }
  else if (st === 'nonla') { P(-1, hy, 14, 2, '#e8d39a'); P(2, hy - 2, 8, 2, '#e8d39a'); P(4, hy - 3, 4, 1, '#e8d39a'); P(2, hy + 2, 3, 4, H) }
  else if (st === 'sunhat') { P(-1, hy, 14, 2, hatCol); P(2, hy - 3, 8, 3, hatCol); P(2, hy + 2, 3, 6, H) }
  else if (st === 'cap' || st === 'helmet' || st === 'hardhat' || st === 'beret' || st === 'curlers') {
    const col = st === 'hardhat' ? '#f2c14e' : st === 'curlers' ? '#ff9ac1' : hatCol
    P(2, hy - 2, 8, 4, col); P(3, hy - 2, 5, 1, shadeHex(col, 30))
    if (st === 'cap') P(9, hy + 1, 3, 1, shadeHex(col, -30))
    P(2, hy + 2, 2, 4, H)
  } else {
    P(2, hy - 1, 8, 3, H) // đỉnh đầu
    P(2, hy, 2, 6, H) // sau gáy
    if (st === 'long') P(1, hy + 1, 3, 13, H)
    if (st === 'bob') P(1, hy + 1, 3, 8, H)
    if (st === 'bun') { P(0, hy - 3, 3, 3, H); P(1, hy - 2, 1, 1, shadeHex(H, 30)) }
    if (st === 'spiky' || st === 'mohawk') { P(3, hy - 3, 1, 2, H); P(5, hy - 4, 1, 3, H); P(7, hy - 3, 1, 2, H) }
    if (st === 'messy') { P(4, hy - 2, 2, 1, H); P(8, hy - 2, 1, 1, H) }
  }
  // mắt, má, miệng
  const blink = Math.floor(t * 10 + k * 7) % 37 === 0
  const acc = L.acc ?? []
  if (acc.includes('shades') || acc.includes('glasses') || acc.includes('catglasses') || acc.includes('bottleglasses')) { P(6, hy + 3, 4, 2, acc.includes('shades') ? OUT : '#ffffff'); P(6, hy + 3, 4, 1, OUT); P(8, hy + 4, 1, 1, OUT) }
  else P(8, hy + 4, 1, blink ? 1 : 2, OUT)
  P(7, hy + 6, 2, 1, '#ff9aa8')
  if (acc.includes('beard')) P(5, hy + 6, 5, 3, H)
  else P(9, hy + 7, 1, 1, '#8a3a2a')
  // tay đặt lên bàn, cầm ly (nhấp ly thì giơ cao hơn)
  P(5, sy - 9, 2, 5, shirtS)
  if (sip) { P(7, sy - 9, 3, 2, shirtS); P(10, sy - 10, 2, 3, L.skin) }
  else { P(7, sy - 5, 5, 2, shirtS); P(12, sy - 5, 2, 2, L.skin) }
  return sip
}

const TABLE = [
  { top: '#c98e5a', edge: '#8a5a3c', leg: '#6b4026' },
  { top: '#f6efe6', edge: '#c8463f', leg: '#3b2a20' },
  { top: '#f4f1ec', edge: '#c9c2b8', leg: '#d4a73c' },
]
function drawTable(c: CanvasRenderingContext2D, cx: number, ty: number, lv: number) {
  const T = TABLE[lv] ?? TABLE[0]
  // bóng dưới bàn
  px(c, cx - 9, ty + FLOOR, 18, 1, 'rgba(59,42,32,0.22)')
  // chân giữa + đế
  px(c, cx - 1, ty + 2, 2, FLOOR - 2, T.leg)
  px(c, cx - 4, ty + FLOOR - 1, 8, 1, T.leg)
  // mặt bàn
  px(c, cx - 7, ty - 1, 14, 3, OUT)
  px(c, cx - 6, ty - 1, 12, 1, T.top)
  px(c, cx - 6, ty, 12, 1, T.edge)
  if (lv === 1) {
    // khăn trải bàn caro rủ xuống
    px(c, cx - 7, ty + 1, 14, 4, OUT)
    for (let i = 0; i < 12; i++) px(c, cx - 6 + i, ty + 1, 1, 3, (i + 1) % 2 ? '#ffffff' : '#c8463f')
  }
  if (lv === 2) px(c, cx - 5, ty - 1, 3, 1, '#ffffff')
}
function drawCup(c: CanvasRenderingContext2D, x: number, y: number, t: number, steam: boolean) {
  px(c, x, y - 3, 3, 3, '#fffaf2'); px(c, x, y - 3, 3, 1, '#6f4630'); px(c, x + 3, y - 2, 1, 1, OUT)
  if (steam) { const s = Math.floor(t * 3) % 2; px(c, x + s, y - 6, 1, 2, 'rgba(255,255,255,0.85)'); px(c, x + 2 - s, y - 8, 1, 2, 'rgba(255,255,255,0.6)') }
}

function draw(now: number) {
  raf = requestAnimationFrame(draw)
  if (ui.page !== 1 || !ctx) return // chỉ vẽ khi đang xem khu ngồi
  const c = ctx
  const t = now / 1000
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  drawWall(c, t)
  drawFloor(c)
  drawPlant(c, 1, 22)
  drawPlant(c, SCENE_W - 13, 22)
  // thảm lớn dưới khu bàn + chậu cây 2 góc dưới (cho khung cao đỡ trống)
  {
    const first = slot(0), last = slot(Math.max(0, maxTables.value - 1))
    const ry = first.ty - 24, rh = last.ty + 16 - ry
    const rugC = save.meta.premise === 2 ? '#b9a6c9' : save.meta.premise === 1 ? '#7d9a6a' : '#cf8566'
    px(c, 6, ry, SCENE_W - 12, rh, shadeHex(rugC, -35))
    px(c, 8, ry + 2, SCENE_W - 16, rh - 4, rugC)
    for (let x = 12; x < SCENE_W - 12; x += 8) { px(c, x, ry + 4, 4, 1, shadeHex(rugC, 30)); px(c, x + 2, ry + rh - 5, 4, 1, shadeHex(rugC, 30)) }
    if (H - (last.ty + 12) > 22) { drawPlant(c, 3, H - 19, true); drawPlant(c, SCENE_W - 11, H - 19, true) }
  }

  const lv = save.seating.level
  const max = maxTables.value
  // các bàn theo hàng (hàng trên vẽ trước)
  // nhân viên đứng chờ ở lối đi phía sau (vẽ trước để bàn ghế che bớt)
  ui.waiters.forEach((w, k) => { if (w.seat === null) { const a = aisle(k); drawWaiter(c, a.x, a.y, t, k, false, false) } })
  const { R: nRows } = grid()
  for (let row = 0; row < nRows; row++) {
    for (let i = 0; i < max; i++) {
      const s = slot(i)
      if (s.row !== row) continue
      if (i >= save.seating.tables) {
        // chỗ còn kê thêm được bàn (trong giới hạn mặt bằng)
        c.globalAlpha = 0.3
        for (let k = 0; k < 28; k += 3) { px(c, s.cx - 14 + k, s.ty - 4, 2, 1, OUT); px(c, s.cx - 14 + k, s.ty + FLOOR, 2, 1, OUT) }
        px(c, s.cx - 1, s.ty, 2, 6, OUT); px(c, s.cx - 3, s.ty + 2, 6, 2, OUT)
        c.globalAlpha = 1
        continue
      }
      const seats = [ui.seats[i * 2], ui.seats[i * 2 + 1]]
      const sips = [false, false]
      // nhân viên đang lau bàn này: đứng phía sau bàn
      ui.waiters.forEach((w, k) => { if (w.seat === i) { const p = waiterPos(w, k); if (p.wiping) drawWaiter(c, p.x, p.y, t, k, false, true) } })
      for (const side of [0, 1] as const) {
        const P = pen(c, s.cx, s.ty, side)
        drawChair(P, lv)
        const st = seats[side]
        if (st?.state === 'busy' && st.look) sips[side] = drawSitter(P, st.look, t, i * 2 + side, lv)
      }
      drawTable(c, s.cx, s.ty, lv)
      // đồ trên bàn
      const dirty = seats.some((x) => x?.state === 'dirty')
      if (!seats.some((x) => x && x.state !== 'free')) {
        // bàn sạch: lọ hoa nhỏ giữa bàn
        px(c, s.cx - 1, s.ty - 4, 2, 3, '#7fb8d9'); px(c, s.cx - 2, s.ty - 6, 2, 2, '#e86a8a'); px(c, s.cx + 1, s.ty - 7, 2, 2, '#f2c14e')
      }
      for (const side of [0, 1] as const) {
        const st = seats[side]
        const cupX = side === 0 ? s.cx - 5 : s.cx + 2
        if (st?.state === 'busy' && !sips[side]) drawCup(c, cupX, s.ty - 1, t, true)
        if (st?.state === 'dirty') {
          // ly đổ + vụn bánh + tiền boa
          px(c, cupX - 1, s.ty - 3, 4, 2, '#fffaf2'); px(c, cupX + (side ? -1 : 3), s.ty - 2, 1, 1, '#6f4630')
          px(c, cupX + 1, s.ty, 1, 1, '#a06c46'); px(c, cupX - 1, s.ty + 1, 1, 1, '#a06c46')
          if (st.tip) { px(c, cupX + (side ? 3 : -2), s.ty - 3, 3, 2, '#f2c14e'); px(c, cupX + (side ? 3 : -2), s.ty - 3, 3, 1, '#fff1a8') }
        }
      }
      const waiterHere = ui.waiters.some((w) => w.seat === i)
      if (dirty && !waiterHere) {
        const by = s.ty - 25 + (Math.floor(t * 3) % 2)
        box(c, s.cx - 3, by, 7, 9, '#ffffff')
        px(c, s.cx, by + 2, 1, 4, '#d9534f'); px(c, s.cx, by + 7, 1, 1, '#d9534f')
        const taps = Math.max(...seats.filter((x) => x?.state === 'dirty').map((x) => x!.taps))
        for (let k = 0; k < CLEAN_TAPS; k++) box(c, s.cx - 7 + k * 5, s.ty + 4, 4, 3, k < taps ? '#3fd18b' : '#fffaf2')
      }
      // lấp lánh vừa lau xong
      const wp = wipes.find((w) => w.seat === i && now - w.at < 500)
      if (wp) {
        const k = (now - wp.at) / 500
        for (let j = 0; j < 4; j++) px(c, s.cx - 9 + j * 6, s.ty - 4 - k * 8 - (j % 2) * 3, 2, 2, '#fffbe0')
      }
    }
  }
  // dọn danh sách hiệu ứng cũ
  while (wipes.length && now - wipes[0].at > 600) wipes.shift()

  // nhân viên đang đi / đứng chờ (người đang lau bàn đã vẽ cùng hàng bàn ở trên)
  ui.waiters.forEach((w, k) => { const p = waiterPos(w, k); if (p.walking) drawWaiter(c, p.x, p.y, t, k, true, false) })
}

function waiterPos(w: { seat: number | null; t: number }, k: number) {
  const home = aisle(k)
  if (w.seat === null) return { x: home.x, y: home.y, walking: false, wiping: false, row: -1 }
  const s = slot(w.seat)
  const dest = { x: s.cx - 8, y: s.ty - 29 } // đứng sau bàn, giữa 2 ghế
  const p = Math.min(1, w.t / 1.2)
  return { x: Math.round(home.x + (dest.x - home.x) * p), y: Math.round(home.y + (dest.y - home.y) * p), walking: p < 1, wiping: p >= 1, row: s.row }
}

const WAITER_LOOKS: Look[] = [
  { skin: '#f0c8a2', hair: '#2b1d16', style: 'short', shirt: '#2f7d6a', acc: ['blush'] },
  { skin: '#e2b089', hair: '#6b4026', style: 'bun', shirt: '#2f7d6a', acc: ['blush'] },
]
function drawWaiter(c: CanvasRenderingContext2D, x: number, y: number, t: number, k: number, walking: boolean, wiping: boolean) {
  const L = WAITER_LOOKS[k % WAITER_LOOKS.length]
  const step = walking ? Math.floor(t * 8) % 2 : 0
  // chân
  px(c, x + 4, y + 30, 3, 5 - step, '#3b2a20'); px(c, x + 9, y + 30, 3, 4 + step, '#3b2a20')
  drawPerson(c, L, x, y - (walking ? step : 0), wiping ? 'happy' : 'neutral', Math.floor(t * 10 + k * 13) % 43 === 0)
  // tạp dề
  px(c, x + 3, y + 18, 10, 11, '#6f4e37'); px(c, x + 5, y + 16, 6, 2, '#6f4e37')
  if (wiping) {
    // lau bàn: tay cầm khăn qua lại
    const sw = Math.round(Math.sin(t * 14) * 3)
    const hx = x + 6 + sw
    px(c, hx, y + 26, 3, 2, L.skin); px(c, hx - 1, y + 28, 6, 2, '#7fb8d9')
    if (Math.floor(t * 6) % 2) px(c, hx + 6, y + 21, 1, 1, '#ffffff')
  } else {
    // khay tròn trên tay
    px(c, x + 13, y + 20, 3, 3, L.skin); px(c, x + 11, y + 19, 8, 1, '#c9ced6')
  }
}

// chạm vào bàn bẩn để lau
function onTap(e: MouseEvent) {
  const canvas = cv.value
  if (!canvas) return
  const r = canvas.getBoundingClientRect()
  const sx = ((e.clientX - r.left) / r.width) * SCENE_W
  const sy = ((e.clientY - r.top) / r.height) * H
  for (let i = 0; i < save.seating.tables; i++) {
    const s = slot(i)
    if (sx >= s.cx - 16 && sx <= s.cx + 16 && sy >= s.ty - 28 && sy <= s.ty + 12) { cleanSeat(i); return }
  }
}

const busyN = computed(() => ui.seats.filter((s) => s.state === 'busy').length)
const dirtyN = computed(() => dirtySeats.value)

let off: (() => void) | null = null
onMounted(() => {
  resize()
  requestAnimationFrame(resize)
  ro = new ResizeObserver(() => resize())
  if (cv.value?.parentElement) ro.observe(cv.value.parentElement)
  off = bus.on(onEvent)
  raf = requestAnimationFrame(draw)
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); off?.(); ro?.disconnect() })
</script>

<template>
  <div class="seat-wrap">
    <canvas ref="cv" class="pix" @click="onTap" />
    <div class="hud">
      <span class="chip"><PixelIcon name="crowd" :size="2" /> {{ busyN }}/{{ save.seating.tables * 2 }}</span>
      <span v-if="dirtyN" class="chip bad"><PixelIcon name="warn" :size="2" /> {{ dirtyN }} bàn bẩn</span>
    </div>
    <div v-if="dirtyN && !save.seating.waiter" class="tip-hint">Chạm {{ CLEAN_TAPS }} lần vào bàn bẩn để dọn & nhận tiền boa</div>
    <div v-for="f in fx" :key="f.id" class="fx" :style="{ left: f.x + '%', top: f.y + '%' }">{{ f.text }}</div>
  </div>
</template>

<style scoped>
.seat-wrap { position: relative; flex: 1 1 0; min-height: 0; width: 100%; overflow: hidden; background: #f4e1c6; box-shadow: var(--px-border), 0 7px 0 rgba(59, 42, 32, 0.3); }
canvas { display: block; image-rendering: pixelated; cursor: pointer; }
.tip-hint { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); white-space: nowrap; font-size: 11px; font-weight: 900; color: #fff; background: rgba(59, 42, 32, 0.88); padding: 3px 8px 4px; box-shadow: 0 0 0 2px #3b2a20; pointer-events: none; }
.hud { position: absolute; left: 4px; top: 4px; display: flex; gap: 4px; pointer-events: none; }
.chip { display: flex; align-items: center; gap: 3px; background: rgba(59, 42, 32, 0.9); color: #ffe8b8; font-size: 11px; font-weight: 900; padding: 2px 5px 3px; box-shadow: 0 0 0 2px #3b2a20; }
.chip.bad { background: #b8433f; color: #fff; }
.fx { position: absolute; transform: translateX(-50%); font-size: 13px; font-weight: 900; color: #f2c14e; text-shadow: 0 2px 0 #3b2a20, 0 0 3px #3b2a20; pointer-events: none; animation: up 1.1s ease-out forwards; }
@keyframes up { to { transform: translate(-50%, -26px); opacity: 0; } }
</style>
