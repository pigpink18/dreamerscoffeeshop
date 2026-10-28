<script setup lang="ts">
// Khu khách ngồi: bàn ghế, khách ngồi uống, bàn bẩn (chạm để lau & nhận tiền boa), nhân viên phục vụ đi dọn.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ui, save, bus, cleanSeat, maxTables, dirtySeats, toast, CLEAN_TAPS, DAY_LENGTH, type GameEvent } from '../game/store'
import { moneyShort } from '../game/data'
import { SCENE_W, SCENE_H, px, box, sky, mixWeighted, drawPerson, drawPlant, CZ, woodFrame, brassLamp } from '../game/pixel'
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
const BLOCK = 38 // 1 hàng bàn: từ đỉnh đầu khách (ty-20) tới chân bàn (ty+16)
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
  if (C === 2) { const r = Math.min(R - 1, k); return { x: SCENE_W / 2 - 8, y: slot(r * 2).ty - 22 } }
  return { x: Math.round((SCENE_W * (1 + (k % 2))) / 3) - 8, y: slot(0).ty - 37 }
}

const fx = ref<{ id: number; text: string; x: number; y: number }[]>([])
let fxId = 0
const wipes: { seat: number; at: number }[] = []
// bàn vừa được dọn dẹp / kê thêm: hiệu ứng bụi tung
const unlocks: { slot: number; at: number }[] = []
watch(() => save.seating.tables, (n, o) => {
  if (n > o) for (let i = o; i < n; i++) unlocks.push({ slot: i, at: performance.now() + (i - o) * 120 })
})

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
  const wall = premise === 2 ? '#f1d9cc' : premise === 1 ? CZ.w4 : '#f0dcb4'
  px(c, 0, 0, SCENE_W, 30, wall)
  if (premise === 1) for (let x = 0; x < SCENE_W; x += 9) { px(c, x, 0, 1, 24, CZ.w2); px(c, x + 1, 0, 1, 24, CZ.w5) } // ván gỗ
  else for (let r = 0; r < 4; r++) for (let x = 4 + (r % 2) * 4; x < SCENE_W; x += 8) px(c, x, 3 + r * 6, 1, 1, shadeHex(wall, -22))
  // ốp chân tường: xanh rêu / gạch đỏ / gạch men, nẹp gỗ trên
  const dado = premise === 1 ? CZ.r1 : premise === 2 ? '#6fb8ae' : CZ.t1
  px(c, 0, 24, SCENE_W, 6, dado)
  if (premise === 1) for (let x = 0; x < SCENE_W; x += 8) { px(c, x, 27, 8, 1, CZ.w1); px(c, x + 4, 24, 1, 3, CZ.w1); px(c, x, 27, 1, 3, CZ.w1) }
  else if (premise === 2) for (let x = 0; x < SCENE_W; x += 4) px(c, x, 25, 1, 5, '#3f8279')
  else for (let x = 2; x < SCENE_W; x += 14) { px(c, x, 26, 11, 4, CZ.t0); px(c, x + 1, 27, 10, 3, CZ.t1) }
  px(c, 0, 22, SCENE_W, 3, CZ.ink); px(c, 0, 22, SCENE_W, 1, CZ.w5); px(c, 0, 23, SCENE_W, 1, CZ.w3)
  // 2 cửa sổ khung gỗ
  const [st, sb] = sky(f, save.weather === 'rainy')
  for (const wx of [8, 86]) {
    woodFrame(c, wx, 3, 34, 15)
    for (let i = 0; i < 15; i++) px(c, wx, 3 + i, 34, 1, mixWeighted(st, sb, i / 15))
    c.fillStyle = 'rgba(255,255,255,0.16)'
    c.beginPath(); c.moveTo(wx + 3, 18); c.lineTo(wx + 8, 18); c.lineTo(wx + 15, 3); c.lineTo(wx + 10, 3); c.fill()
    px(c, wx + 16, 3, 3, 15, CZ.ink); px(c, wx + 17, 3, 1, 15, CZ.w3)
    if (save.weather === 'rainy') for (let k = 0; k < 6; k++) { const yy = 3 + ((Math.floor(t * 30) + k * 5) % 14); px(c, wx + 3 + k * 5, yy, 1, 2, '#dfe8f2') }
  }
  // bảng phấn menu giữa tường
  woodFrame(c, 53, 6, 22, 11)
  px(c, 53, 6, 22, 11, '#2c4a40')
  px(c, 55, 8, 11, 1, '#eef2ea'); px(c, 55, 11, 14, 1, 'rgba(238,242,234,0.75)'); px(c, 55, 14, 9, 1, 'rgba(238,242,234,0.75)'); px(c, 70, 11, 3, 1, CZ.b2); px(c, 70, 14, 3, 1, CZ.b2)
  // đèn thả chao đồng (sáng hơn khi chiều tối)
  for (const lx of [32, 96]) brassLamp(c, lx, 2)
  if (f > 0.7) { c.fillStyle = 'rgba(255,226,150,0.12)'; c.fillRect(0, 0, SCENE_W, H) }
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
    // sàn ván gỗ: mạch tối, mép sáng, vân
    const [base, seam, hi] = premise === 1 ? [CZ.w2, CZ.w1, CZ.w3] : [CZ.w3, CZ.w2, CZ.w4]
    px(c, 0, 30, SCENE_W, H - 30, base)
    for (let y = 30; y < H; y += 5) {
      px(c, 0, y, SCENE_W, 1, seam); px(c, 0, y + 1, SCENE_W, 1, hi)
      const off = ((y / 5) % 2) * 11
      for (let x = off; x < SCENE_W; x += 22) { px(c, x, y, 1, 5, seam); px(c, x + 6, y + 3, 4, 1, seam) }
    }
  }
  px(c, 0, 30, SCENE_W, 2, 'rgba(38,28,27,0.25)') // bóng chân tường
}

// ---------- Bàn & ghế nhìn thẳng (hơi chếch từ trên): 2 khách ngồi sau bàn, mặt hướng ra ngoài ----------
const FLOOR = 16 // chân bàn chạm sàn: ty + FLOOR
// xếp 3 cột (màn thấp, 6 bàn) thì bàn hẹp lại, ghế sát nhau, bỏ tay vịn ghế bành
const compact = () => grid().C === 3
let TW = 22 // nửa bề rộng bàn (đặt lại mỗi khung hình theo compact)
/** góc trên trái của khách ở ghế side (0 trái, 1 phải); đầu khách ở ty - 20 */
const seatX = (cx: number, side: number) => (compact() ? (side === 0 ? cx - 17 : cx + 1) : side === 0 ? cx - 19 : cx + 3)

/** lưng ghế sau lưng khách (x = góc trái khách, rộng 16) */
function drawChair(c: CanvasRenderingContext2D, x: number, ty: number, lv: number) {
  const top = ty - 15, bot = ty + FLOOR
  if (lv === 2) {
    // ghế bành nhung xanh rêu, lưng bo tròn, nút bọc, chân đồng
    px(c, x + 1, top - 3, 14, 1, CZ.ink); px(c, x - 1, top - 2, 18, 1, CZ.ink); px(c, x - 2, top - 1, 20, ty - top + 5, CZ.ink)
    px(c, x + 1, top - 2, 14, 1, CZ.t2); px(c, x - 1, top - 1, 18, ty - top + 3, CZ.t1)
    px(c, x - 1, top - 1, 2, ty - top + 3, CZ.t2); px(c, x + 15, top - 1, 2, ty - top + 3, CZ.t0)
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) px(c, x + 3 + k * 5 + (r % 2) * 2, top + 2 + r * 5, 1, 1, CZ.t0)
    px(c, x - 1, ty + 2, 18, 1, CZ.b1)
    // tay vịn
    if (!compact()) for (const ax of [x - 4, x + 16]) { px(c, ax, ty - 7, 5, 11, CZ.ink); px(c, ax + 1, ty - 6, 3, 9, CZ.t2); px(c, ax + 1, ty - 6, 3, 1, CZ.t3) }
    px(c, x, bot - 4, 2, 4, CZ.b0); px(c, x + 14, bot - 4, 2, 4, CZ.b0)
    return
  }
  const C = lv === 1 ? { post: CZ.w1, hi: CZ.w2, rail: CZ.w2 } : { post: CZ.w2, hi: CZ.w4, rail: CZ.w3 }
  // 2 trụ lưng ghế chạy xuống thành chân sau
  for (const px0 of [x - 1, x + 15]) { px(c, px0, top, 3, bot - top, CZ.ink); px(c, px0 + 1, top, 1, bot - top - 1, C.hi) }
  // thanh ngang trên cong nhẹ
  px(c, x - 1, top - 1, 19, 4, CZ.ink); px(c, x, top, 17, 2, C.rail); px(c, x, top, 17, 1, CZ.w5)
  if (lv === 1) {
    // đệm lưng đỏ có nút
    px(c, x + 1, top + 3, 15, ty - top - 3, CZ.ink); px(c, x + 2, top + 3, 13, ty - top - 4, CZ.r1); px(c, x + 2, top + 3, 13, 1, CZ.r2)
    px(c, x + 5, top + 7, 1, 1, CZ.r0); px(c, x + 11, top + 7, 1, 1, CZ.r0)
  } else {
    // nan dọc
    for (const sx of [x + 4, x + 8, x + 12]) { px(c, sx, top + 3, 2, ty - top - 2, CZ.ink); px(c, sx, top + 3, 1, ty - top - 2, C.rail) }
    px(c, x - 1, ty - 6, 19, 2, CZ.ink); px(c, x, ty - 6, 17, 1, C.rail)
  }
}

/** khách ngồi sau bàn (vẽ trước mặt bàn – bàn che phần bụng) */
function drawSitter(c: CanvasRenderingContext2D, x: number, ty: number, L: Look, t: number, k: number) {
  const sip = Math.floor(t * 0.6 + k * 1.7) % 6 === 0
  const happy = Math.floor(t * 0.25 + k * 0.9) % 4 === 0
  // chân thò dưới gầm bàn
  px(c, x + 4, ty + 7, 3, FLOOR - 9, '#4a4458'); px(c, x + 9, ty + 7, 3, FLOOR - 9, '#4a4458')
  px(c, x + 3, ty + FLOOR - 2, 4, 2, CZ.ink); px(c, x + 9, ty + FLOOR - 2, 4, 2, CZ.ink)
  drawPerson(c, L, x, ty - 20, happy || sip ? 'happy' : 'neutral', Math.floor(t * 10 + k * 7) % 37 === 0)
  return sip
}
/** tay + ly của khách: đặt trên bàn hoặc đưa lên miệng nhấp */
function drawHands(c: CanvasRenderingContext2D, x: number, ty: number, L: Look, t: number, sip: boolean, steam: boolean) {
  const sleeve = shadeHex(L.shirt, -30)
  if (sip) {
    px(c, x + 11, ty - 5, 3, 6, sleeve)
    mug(c, x + 9, ty - 10, t, false)
    px(c, x + 12, ty - 6, 3, 3, L.skin)
  } else {
    px(c, x + 2, ty, 4, 2, L.skin); px(c, x + 11, ty, 4, 2, L.skin)
    mug(c, x + 6, ty - 3, t, steam)
  }
}
/** ly sứ có quai (4x4), (x, y) góc trên trái */
function mug(c: CanvasRenderingContext2D, x: number, y: number, t: number, steam: boolean) {
  px(c, x - 1, y - 1, 6, 6, CZ.ink); px(c, x, y, 4, 4, '#fffaf2'); px(c, x, y, 4, 1, '#6f4630'); px(c, x, y + 3, 4, 1, '#e6d6c2')
  px(c, x + 5, y + 1, 1, 2, CZ.ink)
  if (steam) { const s = Math.floor(t * 3) % 2; px(c, x + 1 + s, y - 4, 1, 2, 'rgba(255,255,255,0.85)'); px(c, x + 2 - s, y - 7, 1, 2, 'rgba(255,255,255,0.6)') }
}

/** bàn nhìn chếch: mặt bàn có bề dày, mép trước, chân, bóng sàn */
function drawTable(c: CanvasRenderingContext2D, cx: number, ty: number, lv: number) {
  const L = cx - TW, w = TW * 2
  c.fillStyle = 'rgba(38,28,27,0.22)'; c.fillRect(L + 1, ty + FLOOR, w - 2, 2)
  if (lv === 2) {
    // mặt đá cẩm thạch, viền đồng, chân đồng
    for (const lx of [L + 4, L + w - 6]) { px(c, lx, ty + 6, 2, FLOOR - 6, CZ.ink); px(c, lx, ty + 6, 1, FLOOR - 7, CZ.b1) }
    px(c, L + 3, ty + FLOOR - 1, 5, 1, CZ.b0); px(c, L + w - 8, ty + FLOOR - 1, 5, 1, CZ.b0)
    px(c, L - 1, ty - 1, w + 2, 8, CZ.ink)
    px(c, L, ty, w, 4, '#f4f1ec'); px(c, L, ty, w, 1, '#ffffff')
    px(c, L + 6, ty + 1, 7, 1, '#d8d2c8'); px(c, L + 12, ty + 2, 4, 1, '#d8d2c8'); px(c, L + 28, ty + 1, 9, 1, '#d8d2c8')
    px(c, L, ty + 4, w, 2, CZ.b1); px(c, L, ty + 4, w, 1, CZ.b2)
    return
  }
  // chân gỗ
  for (const lx of [L + 2, L + w - 5]) { px(c, lx, ty + 6, 3, FLOOR - 6, CZ.ink); px(c, lx + 1, ty + 6, 1, FLOOR - 7, lv === 1 ? CZ.w2 : CZ.w3) }
  px(c, L - 1, ty - 1, w + 2, 8, CZ.ink)
  px(c, L, ty, w, 4, CZ.w4); px(c, L, ty, w, 1, CZ.w5)
  for (let x = L + 3; x < L + w - 6; x += 13) px(c, x, ty + 2, 6, 1, CZ.w3) // vân gỗ
  px(c, L, ty + 4, w, 2, CZ.w2); px(c, L, ty + 5, w, 1, CZ.w1)
  if (lv === 1) {
    // khăn trải bàn caro đỏ rủ xuống, mép răng cưa
    px(c, L - 1, ty - 1, w + 2, 12, CZ.ink)
    for (let y = 0; y < 10; y++) for (let x = 0; x < w; x++) {
      const on = ((x >> 1) + (y >> 1)) % 2 === 0
      px(c, L + x, ty + y, 1, 1, y < 4 ? (on ? '#ffffff' : '#f2cfc8') : on ? '#ffffff' : CZ.r1)
    }
    px(c, L, ty, w, 1, '#ffffff')
    for (let x = 0; x < w; x += 4) px(c, L + x + 1, ty + 10, 2, 1, CZ.ink)
  }
}
// ---------- Chỗ chưa mua bàn: đồ cũ trùm vải, bụi, mạng nhện ----------
const SHEET = '#cdc2a9', SHEET_HI = '#dcd2bc', SHEET_LO = '#ab9d80', DUST = '#9a8d74', STAIN = '#b9a67e'
/** mạng nhện góc: tâm (ax, ay), toả về hướng (dx, dy) = (±1, ±1) */
function cobweb(c: CanvasRenderingContext2D, ax: number, ay: number, dx: number, dy: number, r = 10) {
  c.fillStyle = 'rgba(250,248,240,0.75)'
  // 4 sợi toả ra
  for (const a of [0, 0.33, 0.66, 1]) {
    const ang = a * (Math.PI / 2)
    for (let k = 0; k <= r; k++) c.fillRect(Math.round(ax + Math.cos(ang) * k * dx), Math.round(ay + Math.sin(ang) * k * dy), 1, 1)
  }
  // 3 vòng nối, võng nhẹ vào trong
  for (const rr of [3.5, 6.5, 9.5]) {
    if (rr > r) break
    for (let k = 0; k <= 12; k++) {
      const ang = (k / 12) * (Math.PI / 2), sag = 1 - 0.12 * Math.sin(((k % 4) / 4) * Math.PI)
      c.fillRect(Math.round(ax + Math.cos(ang) * rr * sag * dx), Math.round(ay + Math.sin(ang) * rr * sag * dy), 1, 1)
    }
  }
}
/** nhện đu dây lắc lư */
function spider(c: CanvasRenderingContext2D, x: number, top: number, t: number, k: number, len0 = 6, big = false, sp = 1.3) {
  const len = len0 + Math.round(3 * Math.sin(t * sp + k))
  c.fillStyle = 'rgba(250,248,240,0.7)'; c.fillRect(x, top, 1, len)
  spiderBody(c, x, top + len, t, k, big)
}
/** thân nhện: nhỏ 3x2 hoặc to 4x3 có đốm, 4 cặp chân cử động */
function spiderBody(c: CanvasRenderingContext2D, x: number, y: number, t: number, k: number, big: boolean) {
  const leg = Math.floor(t * 4 + k) % 2
  if (big) {
    px(c, x - 2, y, 4, 3, CZ.ink); px(c, x - 1, y + 3, 2, 1, CZ.ink); px(c, x - 1, y + 1, 1, 1, CZ.r1)
    for (const dy of [0, 2]) { px(c, x - 3 - ((dy + leg) % 2), y + dy, 1, 1, CZ.ink); px(c, x + 2 + ((dy + leg + 1) % 2), y + dy, 1, 1, CZ.ink) }
    px(c, x - 3, y + 3 + leg, 1, 1, CZ.ink); px(c, x + 2, y + 4 - leg, 1, 1, CZ.ink)
    return
  }
  px(c, x - 1, y, 3, 2, CZ.ink); px(c, x, y + 2, 1, 1, CZ.ink)
  px(c, x - 2, y + leg, 1, 1, CZ.ink); px(c, x + 2, y + 1 - leg, 1, 1, CZ.ink); px(c, x - 2, y + 2 - leg, 1, 1, CZ.ink); px(c, x + 2, y + 1 + leg, 1, 1, CZ.ink)
}
/** số ngẫu nhiên cố định theo ô (0..1) để mỗi góc bỏ hoang một vẻ */
const rnd = (i: number, k: number) => (((i * 7919 + k * 104729 + 31) * 2654435761) >>> 0) / 4294967296
/** bàn + 2 ghế cũ trùm tấm vải phủ bụi, có nếp gấp, gấu vải lượn sóng */
function drawLocked(c: CanvasRenderingContext2D, cx: number, ty: number, i: number, t: number) {
  // sàn quanh đó phủ bụi (chấm lốm đốm)
  c.fillStyle = 'rgba(120,108,88,0.4)'
  for (let y = ty - 6; y < ty + FLOOR + 6; y++) for (let x = cx - TW - 5 + (y % 2); x < cx + TW + 5; x += 2) if ((x * 7 + y * 13 + i) % 5 < 3) c.fillRect(x, y, 1, 1)
  c.fillStyle = 'rgba(38,28,27,0.22)'; c.fillRect(cx - TW, ty + FLOOR, TW * 2, 2)
  // hình khối tấm vải theo từng hàng: 2 bướu lưng ghế phía trên, khối bàn phía dưới loe dần
  const span = (y: number): [number, number][] => {
    if (y < ty - 1) {
      const out: [number, number][] = []
      for (const side of [0, 1]) {
        const x0 = seatX(cx, side), d = y - (ty - 16)
        const pad = d === 0 ? 3 : d === 1 ? 1 : 0
        out.push([x0 - 1 + pad, x0 + 17 - pad])
      }
      return out
    }
    const flare = Math.floor((y - ty) / 5)
    return [[cx - TW - 1 - flare, cx + TW + 1 + flare]]
  }
  for (let y = ty - 17; y < ty + FLOOR; y++) for (const [l, r] of span(y + 1)) px(c, l - 1, y + 1, r - l + 2, 1, CZ.ink) // viền mực
  for (let y = ty - 16; y < ty + FLOOR; y++) {
    for (const [l, r] of span(y)) {
      px(c, l, y, r - l, 1, SHEET)
      px(c, l, y, 1, 1, SHEET_HI); px(c, r - 1, y, 1, 1, SHEET_LO)
    }
  }
  // đỉnh bướu + mặt bàn sáng hơn, đọng bụi
  for (const side of [0, 1]) { const x0 = seatX(cx, side); px(c, x0 + 2, ty - 15, 13, 1, SHEET_HI) }
  px(c, cx - TW, ty - 1, TW * 2, 2, SHEET_HI)
  // lớp bụi xám đọng trên mặt trên (lốm đốm dày) + vết ố vàng
  for (const side of [0, 1]) { const x0 = seatX(cx, side); for (let y = ty - 15; y < ty - 12; y++) for (let x = x0 + 1 + (y % 2); x < x0 + 16; x += 2) px(c, x, y, 1, 1, DUST) }
  for (let y = ty - 1; y < ty + 2; y++) for (let x = cx - TW + (y % 2); x < cx + TW; x += 2) px(c, x, y, 1, 1, DUST)
  for (let k = 0; k < 3 + (i % 2); k++) {
    const sx = Math.round(-TW + 3 + rnd(i, k) * (TW * 2 - 8)), sy = Math.round(2 + rnd(i, k + 9) * (FLOOR - 6)), w = 2 + Math.round(rnd(i, k + 5) * 3)
    px(c, cx + sx, ty + sy, w, 2, STAIN); px(c, cx + sx + 1, ty + sy + 2, w - 1, 1, STAIN)
  }
  // nếp gấp dọc rủ xuống
  const fo = Math.round(rnd(i, 20) * 4) - 2
  for (const fx of [-14, -5, 6, 15]) {
    const x = cx + fx + fo
    px(c, x, ty + 2, 1, FLOOR - 4, SHEET_LO); px(c, x + 1, ty + 3, 1, FLOOR - 6, SHEET_HI)
  }
  // gấu vải lượn sóng chạm sàn
  const flare = Math.floor((FLOOR - 1) / 5)
  for (let x = cx - TW - 1 - flare; x < cx + TW + 1 + flare; x += 3) px(c, x, ty + FLOOR - 1 + ((x >> 1) % 2), 2, 1, CZ.ink)
  // mạng nhện ở các góc lõm khác nhau tuỳ ô: khe giữa 2 lưng ghế, bậc lưng ghế–mặt bàn, góc vải chạm sàn
  const gx = Math.round((seatX(cx, 0) + 16 + seatX(cx, 1)) / 2)
  const lStep = seatX(cx, 0) - 1, rStep = seatX(cx, 1) + 17
  const webs: (() => void)[] = [
    () => { cobweb(c, gx, ty - 2, -1, -1, 10); cobweb(c, gx, ty - 2, 1, -1, 10) },
    () => cobweb(c, lStep, ty - 2, -1, -1, 8),
    () => cobweb(c, rStep, ty - 2, 1, -1, 8),
    () => cobweb(c, cx - TW - 2, ty + FLOOR - 1, 1, -1, 9),
    () => cobweb(c, cx + TW + 2, ty + FLOOR - 1, -1, -1, 9),
  ]
  const pick = [[0, 4], [1, 2, 3], [0, 3], [2, 4], [1, 0], [3, 4, 2]][i % 6]
  pick.forEach((w) => webs[w]())
  // nhện: mỗi ô một kiểu (đu dây dài/ngắn, bò trên vải, 2 con nhỏ, hoặc không có)
  const kind = [0, 1, 2, 3, 0, 4][i % 6]
  if (kind === 0) spider(c, pick.includes(0) ? gx : pick.includes(1) ? lStep - 4 : rStep + 4, ty - 12, t, i, 5 + Math.round(rnd(i, 30) * 6), rnd(i, 31) > 0.5, 0.9 + rnd(i, 32))
  else if (kind === 1) spider(c, lStep - 5, ty - 10, t, i, 10, true, 0.7)
  else if (kind === 2) {
    // bò chậm qua lại trên mặt bàn trùm vải
    const span = TW * 2 - 8, p = (t * 3 + rnd(i, 33) * span) % (span * 2)
    spiderBody(c, Math.round(cx - TW + 4 + (p < span ? p : span * 2 - p)), ty - 2, t * 2, i, false)
  } else if (kind === 3) {
    spider(c, gx - 3, ty - 13, t, i, 4, false, 1.7); spider(c, gx + 4, ty - 13, t + 1.1, i + 1, 8, false, 1.1)
  }
  // đồ cũ bỏ lại tuỳ ô: chổi dựng, xô lật, chân ghế gãy thò ra
  const prop = i % 4
  if (prop === 1) {
    // chổi dựng phía lối đi giữa (không lọt ra mép màn hình)
    const inner = cx < SCENE_W / 2, bx = inner ? cx + TW + 2 : cx - TW - 9
    for (let k = 0; k < 18; k++) px(c, bx + (inner ? Math.floor(k / 6) : 3 - Math.floor(k / 6)), ty - 4 + k, 1, 1, CZ.w2)
    px(c, bx + 1, ty + 14, 6, 3, CZ.ink); px(c, bx + 2, ty + 14, 4, 2, '#c9a85a'); px(c, bx + 2, ty + 16, 1, 1, '#a88a40'); px(c, bx + 4, ty + 16, 1, 1, '#a88a40')
  } else if (prop === 2) {
    const bx = cx < SCENE_W / 2 ? cx + TW + 2 : cx - TW - 10, by = ty + FLOOR - 5
    px(c, bx, by, 8, 6, CZ.ink); px(c, bx + 1, by + 1, 6, 4, '#9aa3ab'); px(c, bx + 1, by + 1, 6, 1, '#c4cbd1'); px(c, bx + 7, by + 1, 2, 4, '#6f777e')
  } else if (prop === 3) {
    px(c, cx + 4, ty + FLOOR - 2, 9, 2, CZ.ink); px(c, cx + 5, ty + FLOOR - 2, 7, 1, CZ.w3); px(c, cx + 12, ty + FLOOR - 3, 2, 1, CZ.w2)
  }
  // cục bụi lăn trên sàn
  for (const [dx, dy] of [[-TW - 6 + Math.round(rnd(i, 40) * 4), FLOOR - 1], [TW + 3 - Math.round(rnd(i, 41) * 6), FLOOR + 2]]) { px(c, cx + dx, ty + dy, 4, 2, DUST); px(c, cx + dx + 1, ty + dy - 1, 2, 1, '#bfb39b') }
}

/** cả khu ngồi bỏ hoang (chưa dọn lần nào): không thảm, không cây, bụi phủ, mạng nhện góc trần, bụi bay trong nắng */
function drawAbandoned(c: CanvasRenderingContext2D, t: number) {
  // phủ một lớp xám bụi lên tường + sàn
  c.fillStyle = 'rgba(110,100,85,0.22)'; c.fillRect(0, 0, SCENE_W, H)
  c.fillStyle = 'rgba(120,108,88,0.35)'
  for (let y = 31; y < H; y++) for (let x = y % 2; x < SCENE_W; x += 2) if ((x * 5 + y * 11) % 7 < 2) c.fillRect(x, y, 1, 1)
  // vết loang ố trên tường
  for (const [x, y, w, h] of [[2, 4, 4, 9], [79, 2, 3, 7], [120, 6, 5, 11], [46, 18, 3, 4]]) { c.fillStyle = 'rgba(140,118,80,0.25)'; c.fillRect(x, y, w, h); c.fillRect(x + 1, y + h, w - 1, 2) }
  // mạng nhện to ở 2 góc trần + góc cửa sổ
  cobweb(c, 0, 0, 1, 1, 14); cobweb(c, SCENE_W - 1, 0, -1, 1, 14)
  cobweb(c, 44, 0, 1, 1, 8); cobweb(c, 84, 0, -1, 1, 8)
  spider(c, 9, 0, t, 3)
  // vệt nắng xiên từ cửa sổ, bụi lơ lửng trong nắng
  c.fillStyle = 'rgba(255,236,190,0.10)'
  c.beginPath(); c.moveTo(8, 18); c.lineTo(42, 18); c.lineTo(70, 70); c.lineTo(30, 70); c.fill()
  for (let i = 0; i < 12; i++) {
    const y = 22 + ((i * 13 + t * 3) % 46), x = 14 + ((i * 17) % 30) + (y - 22) * 0.55 + Math.sin(t + i) * 2
    c.fillStyle = `rgba(255,246,220,${0.5 + 0.3 * Math.sin(t * 2 + i)})`; c.fillRect(Math.round(x), Math.round(y), 1, 1)
  }
  // chậu cây héo 2 bên + thùng các-tông cũ
  for (const x of [3, SCENE_W - 11]) {
    px(c, x, 27, 8, 6, CZ.ink); px(c, x + 1, 27, 6, 5, '#a8674a'); px(c, x + 1, 27, 6, 1, '#c08060')
    px(c, x + 3, 21, 1, 6, '#8a7a4a'); px(c, x + 1, 22, 2, 1, '#9a8550'); px(c, x + 4, 23, 3, 1, '#7a6a40'); px(c, x + 6, 24, 1, 2, '#7a6a40')
  }
  const by = H - 14
  for (const [bx, w, h] of [[4, 14, 10], [7, 10, 6]] as const) {
    const y = bx === 4 ? by : by - 6
    px(c, bx, y, w, h, CZ.ink); px(c, bx + 1, y + 1, w - 2, h - 2, '#b48a5a'); px(c, bx + 1, y + 1, w - 2, 1, '#c9a070'); px(c, bx + w / 2 - 1, y + 1, 2, h - 2, '#d8c49a')
  }
}
/** đám bụi phụt lên + lấp lánh khi vừa dọn xong 1 bàn (k: 0 → 1) */
function poof(c: CanvasRenderingContext2D, s: { cx: number; ty: number }, k: number, t: number) {
  const r = 6 + k * 22
  c.fillStyle = `rgba(214,204,182,${0.75 * (1 - k)})`
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    const x = s.cx + Math.cos(a) * r, y = s.ty - 2 + Math.sin(a) * r * 0.6 - k * 6
    const sz = Math.max(1, Math.round(5 * (1 - k)))
    c.fillRect(Math.round(x - sz / 2), Math.round(y - sz / 2), sz, sz)
  }
  if (k > 0.3) for (let j = 0; j < 5; j++) {
    const x = s.cx - 18 + j * 9, y = s.ty - 12 - (j % 2) * 8 - k * 6, f = Math.floor(t * 8 + j) % 2
    px(c, x, y - f, 1, 1 + f * 2, '#fff6c8'); px(c, x - f, y, 1 + f * 2, 1, '#fff6c8')
  }
}

/** lọ hoa nhỏ trên bàn sạch */
function vase(c: CanvasRenderingContext2D, cx: number, ty: number) {
  px(c, cx - 2, ty - 4, 4, 5, CZ.ink); px(c, cx - 1, ty - 3, 2, 3, '#9fd3ea')
  px(c, cx, ty - 8, 1, 4, '#4e7f2e')
  px(c, cx - 3, ty - 9, 2, 2, '#e86a8a'); px(c, cx + 1, ty - 10, 2, 2, '#f2c14e'); px(c, cx - 1, ty - 11, 2, 2, '#ff9aa8')
}

let lastBg = -1e9
function draw(now: number) {
  raf = requestAnimationFrame(draw)
  if (!ctx) return
  // chưa xem khu ngồi: vẫn vẽ thưa (~3 hình/giây) để lúc vuốt sang đã có sẵn cảnh, không bị trống trơn
  if (ui.page !== 1 && now - lastBg < 330) return
  lastBg = now
  const c = ctx
  const t = now / 1000
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  drawWall(c, t)
  drawFloor(c)
  const abandoned = !save.seating.tables
  if (abandoned) drawAbandoned(c, t)
  else {
  drawPlant(c, 1, 22)
  drawPlant(c, SCENE_W - 13, 22)
  // thảm lớn dưới khu bàn + chậu cây 2 góc dưới (cho khung cao đỡ trống)
  {
    const first = slot(0), last = slot(Math.max(0, maxTables.value - 1))
    const ry = first.ty - 26, rh = last.ty + FLOOR + 5 - ry
    const rugC = save.meta.premise === 2 ? '#9a86b0' : save.meta.premise === 1 ? '#5e8a5a' : CZ.r1
    px(c, 6, ry, SCENE_W - 12, rh, CZ.ink)
    px(c, 7, ry + 1, SCENE_W - 14, rh - 2, shadeHex(rugC, -30))
    px(c, 9, ry + 3, SCENE_W - 18, rh - 6, rugC)
    px(c, 11, ry + 5, SCENE_W - 22, 1, CZ.b2); px(c, 11, ry + rh - 6, SCENE_W - 22, 1, CZ.b2)
    px(c, 11, ry + 5, 1, rh - 10, CZ.b2); px(c, SCENE_W - 12, ry + 5, 1, rh - 10, CZ.b2)
    for (let x = 16; x < SCENE_W - 16; x += 10) { px(c, x, ry + 8, 3, 1, shadeHex(rugC, 35)); px(c, x + 1, ry + 7, 1, 3, shadeHex(rugC, 35)) }
    for (let x = 8; x < SCENE_W - 8; x += 3) { px(c, x, ry - 1, 1, 1, CZ.paper); px(c, x, ry + rh, 1, 1, CZ.paper) } // tua thảm
    if (H - (last.ty + FLOOR) > 22) { drawPlant(c, 3, H - 19, true); drawPlant(c, SCENE_W - 11, H - 19, true) }
  }
  }

  const lv = save.seating.level
  const max = maxTables.value
  TW = compact() ? 20 : 22
  // các bàn theo hàng (hàng trên vẽ trước)
  // nhân viên đứng chờ ở lối đi phía sau (vẽ trước để bàn ghế che bớt)
  ui.waiters.forEach((w, k) => { if (w.seat === null) { const a = aisle(k); drawWaiter(c, a.x, a.y, t, k, false, false) } })
  const { R: nRows } = grid()
  for (let row = 0; row < nRows; row++) {
    for (let i = 0; i < max; i++) {
      const s = slot(i)
      if (s.row !== row) continue
      if (i >= save.seating.tables) {
        // chỗ chưa mua bàn: góc quán bỏ hoang, bàn ghế cũ trùm vải bám bụi, mạng nhện
        drawLocked(c, s.cx, s.ty, i, t)
        continue
      }
      const seats = [ui.seats[i * 2], ui.seats[i * 2 + 1]]
      const sips = [false, false]
      // nhân viên đang lau bàn này (khi bàn sát nhau): đứng phía sau bàn
      ui.waiters.forEach((w, k) => { if (w.seat === i) { const p = waiterPos(w, k); if (p.wiping && p.behind) drawWaiter(c, p.x, p.y, t, k, false, true) } })
      for (const side of [0, 1] as const) drawChair(c, seatX(s.cx, side), s.ty, lv)
      for (const side of [0, 1] as const) {
        const st = seats[side]
        if (st?.state === 'busy' && st.look) sips[side] = drawSitter(c, seatX(s.cx, side), s.ty, st.look, t, i * 2 + side)
      }
      drawTable(c, s.cx, s.ty, lv)
      // đồ trên bàn
      const dirty = seats.some((x) => x?.state === 'dirty')
      if (!seats.some((x) => x && x.state !== 'free')) vase(c, s.cx, s.ty + 1)
      for (const side of [0, 1] as const) {
        const st = seats[side]
        const sx = seatX(s.cx, side)
        if (st?.state === 'busy' && st.look) drawHands(c, sx, s.ty, st.look, t, sips[side], true)
        if (st?.state === 'dirty') {
          // ly đổ + vụn bánh + tiền boa
          const cupX = sx + 6
          px(c, cupX - 1, s.ty - 1, 7, 4, CZ.ink); px(c, cupX, s.ty, 5, 2, '#fffaf2'); px(c, cupX + (side ? -2 : 5), s.ty + 1, 2, 1, '#6f4630')
          px(c, cupX + 2, s.ty + 3, 1, 1, CZ.w2); px(c, cupX - 2, s.ty + 2, 1, 1, CZ.w2); px(c, cupX + 6, s.ty + 3, 1, 1, CZ.w2)
          if (st.tip) { const tx = sx + (side ? 12 : 1); px(c, tx, s.ty, 4, 3, CZ.ink); px(c, tx, s.ty, 4, 2, '#f2c14e'); px(c, tx, s.ty, 4, 1, '#fff1a8') }
        }
      }
      const waiterHere = ui.waiters.some((w) => w.seat === i)
      if (dirty && !waiterHere) {
        const by = s.ty - 31 + (Math.floor(t * 3) % 2)
        box(c, s.cx - 3, by, 7, 9, '#ffffff')
        px(c, s.cx, by + 2, 1, 4, '#d9534f'); px(c, s.cx, by + 7, 1, 1, '#d9534f')
        const taps = Math.max(...seats.filter((x) => x?.state === 'dirty').map((x) => x!.taps))
        for (let k = 0; k < CLEAN_TAPS; k++) box(c, s.cx - 7 + k * 5, s.ty + FLOOR + 1, 4, 3, k < taps ? '#3fd18b' : '#fffaf2')
      }
      // lấp lánh vừa lau xong
      const wp = wipes.find((w) => w.seat === i && now - w.at < 500)
      if (wp) {
        const k = (now - wp.at) / 500
        for (let j = 0; j < 6; j++) px(c, s.cx - 15 + j * 6, s.ty - 2 - k * 10 - (j % 2) * 3, 2, 2, '#fffbe0')
      }
    }
    // nhân viên đứng lau ở lối đi giữa, cạnh bàn hàng này
    ui.waiters.forEach((w, k) => { const p = waiterPos(w, k); if (p.wiping && !p.behind && p.row === row) drawWaiter(c, p.x, p.y, t, k, false, true) })
  }
  // bụi tung lên ở chỗ vừa dọn dẹp xong
  for (const u of unlocks) {
    const k = (now - u.at) / 900
    if (k >= 0 && k < 1) poof(c, slot(u.slot), k, t)
  }
  while (unlocks.length && now - unlocks[0].at > 1000) unlocks.shift()
  // dọn danh sách hiệu ứng cũ
  while (wipes.length && now - wipes[0].at > 600) wipes.shift()

  // nhân viên đang đi / đứng chờ (người đang lau bàn đã vẽ cùng hàng bàn ở trên)
  ui.waiters.forEach((w, k) => { const p = waiterPos(w, k); if (p.walking) drawWaiter(c, p.x, p.y, t, k, true, false) })
}

function waiterPos(w: { seat: number | null; t: number }, k: number) {
  const home = aisle(k)
  if (w.seat === null) return { x: home.x, y: home.y, walking: false, wiping: false, behind: false, row: -1 }
  const s = slot(w.seat)
  // 2 cột: đứng ở lối đi giữa cạnh bàn; 3 cột (bàn sát nhau): đứng sau bàn, giữa 2 ghế
  const behind = grid().C !== 2
  const dest = behind ? { x: s.cx - 8, y: s.ty - 27 } : { x: SCENE_W / 2 - 8, y: s.ty - 22 }
  const p = Math.min(1, w.t / 1.2)
  return { x: Math.round(home.x + (dest.x - home.x) * p), y: Math.round(home.y + (dest.y - home.y) * p), walking: p < 1, wiping: p >= 1, behind, row: s.row }
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
  for (let i = 0; i < maxTables.value; i++) {
    const s = slot(i)
    if (sx >= s.cx - TW && sx <= s.cx + TW && sy >= s.ty - 30 && sy <= s.ty + FLOOR) {
      if (i < save.seating.tables) cleanSeat(i)
      else toast(save.seating.tables ? 'Góc này bỏ hoang đầy bụi. Vào Nâng cấp › Khu ngồi để kê thêm bàn nhé!' : 'Khu ngồi còn bỏ hoang. Vào Nâng cấp › Khu ngồi để dọn dẹp nhé!')
      return
    }
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
      <span v-if="!save.seating.tables" class="chip">Bỏ hoang · chưa dọn</span>
      <span v-else class="chip"><PixelIcon name="crowd" :size="2" /> {{ busyN }}/{{ save.seating.tables * 2 }}</span>
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
