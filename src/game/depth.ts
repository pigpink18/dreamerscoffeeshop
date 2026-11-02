// Chiều sâu cho cảnh quầy: khi màn hình còn dư chiều cao, vẽ thêm TRẦN NHÀ phía trên và SÀN NHÀ phía trước quầy
// theo phối cảnh (đường xà, ván sàn hội tụ về 1 điểm) – quán trông rộng và sâu như thật thay vì phóng to.
// Toạ độ: trần nằm ở y ∈ [0, top), cảnh gốc 128x92 dịch xuống top, sàn ở y ∈ [top + SCENE_H, H).
import { px, box, CZ, SCENE_W, drawPlant, type Ctx } from './pixel'

const VX = SCENE_W / 2 // điểm tụ phối cảnh (giữa quán)

interface Pal { ceil: string; ceilFar: string; beam: string; beamHi: string; floorA: string; floorB: string; seam: string; rug: string; rugEdge: string }
const PAL: Pal[] = [
  // 0: quán nhỏ tường kem, sàn gỗ sáng
  { ceil: '#d9bf94', ceilFar: '#ead6b0', beam: CZ.w2, beamHi: CZ.w3, floorA: '#b98552', floorB: '#a87545', seam: '#7a4e2e', rug: '#b23a32', rugEdge: '#f2c14e' },
  // 1: gác gỗ thông, gỗ tối hơn
  { ceil: '#8a5a3a', ceilFar: '#a8744c', beam: CZ.w1, beamHi: CZ.w2, floorA: '#8a5a3a', floorB: '#7a4e32', seam: '#4e3020', rug: '#3f7a5c', rugEdge: '#e8d39a' },
  // 2: flagship hồng – trần trắng, sàn gạch caro
  { ceil: '#efe2d6', ceilFar: '#f8eee4', beam: '#c9a88a', beamHi: '#e0c4a8', floorA: '#efe6d8', floorB: '#cdbfae', seam: '#a8988a', rug: '#9a86b0', rugEdge: '#f4e6ff' },
]

/** Trần nhà nhìn từ dưới lên: gần người xem (trên cùng) tối hơn, xà gỗ dày dần, rui hội tụ về điểm tụ */
// Phần tĩnh (trần, sàn, thảm) vẽ 1 lần vào canvas phụ rồi dán lại mỗi khung hình – đỡ hàng nghìn lệnh vẽ/khung trên iPhone
const cache = new Map<string, HTMLCanvasElement>()
function cached(key: string, w: number, h: number, paint: (c: Ctx) => void): HTMLCanvasElement {
  let cv = cache.get(key)
  if (!cv) {
    if (cache.size > 8) cache.clear()
    cv = document.createElement('canvas')
    cv.width = w; cv.height = h
    const c = cv.getContext('2d')!
    c.imageSmoothingEnabled = false
    paint(c)
    cache.set(key, cv)
  }
  return cv
}

export function drawCeiling(c: Ctx, top: number, premise: number, t: number, xmas: boolean) {
  if (top <= 0) return
  c.drawImage(cached(`ceil:${top}:${premise}`, SCENE_W, top, (cc) => paintCeiling(cc, top, premise)), 0, 0)
  // phần động: dây đèn Noel nhấp nháy
  if (xmas) garland(c, top, t)
  // 2 đèn thả gần người xem: to hơn, dây dài từ trần (vẽ sau dây đèn)
  if (top >= 14) for (const lx of [24, SCENE_W - 24]) bigLamp(c, lx, Math.min(top - 6, 10 + Math.round(top * 0.3)))
}

function paintCeiling(c: Ctx, top: number, premise: number) {
  const P = PAL[premise] ?? PAL[0]
  for (let y = 0; y < top; y++) px(c, 0, y, SCENE_W, 1, mixHex(P.ceil, P.ceilFar, y / top))
  // rui dọc hội tụ (xa → gần)
  const vy = top + 70
  for (let i = -6; i <= 6; i++) {
    const xt = VX + i * 22
    for (let y = 0; y < top; y++) {
      const x = VX + (xt - VX) * ((vy - y) / vy)
      px(c, Math.round(x), y, 1, 1, 'rgba(59, 42, 32, 0.22)')
    }
  }
  // xà ngang: càng gần (lên trên) càng thưa & dày
  let d = 3, y = top - 2
  while (y > -4) {
    const th = Math.max(1, Math.round(d / 3))
    px(c, 0, y - th, SCENE_W, th, P.beam)
    px(c, 0, y - th, SCENE_W, 1, P.beamHi)
    px(c, 0, y, SCENE_W, 1, 'rgba(38, 28, 27, 0.25)')
    d *= 1.7
    y -= Math.round(d)
  }
  // mép trần chạm tường (bóng)
  px(c, 0, top - 1, SCENE_W, 1, 'rgba(38, 28, 27, 0.3)')
}

function garland(c: Ctx, top: number, t: number) {
  const cols = ['#ff5f52', '#ffd23f', '#6ad08f', '#5b8bd9', '#ff9ac1']
  const sag = Math.min(8, Math.round(top * 0.35))
  for (let x = 0; x < SCENE_W; x++) {
    const y = 2 + Math.round(Math.sin((x / SCENE_W) * Math.PI * 3) ** 2 * sag)
    px(c, x, y, 1, 1, '#2f6b4a')
    if (x % 8 === 4) {
      const on = (Math.floor(t * 2.5) + x / 8) % 3 !== 0
      px(c, x, y + 1, 2, 2, on ? cols[(x / 8) % cols.length | 0] : '#6b5a4e')
      if (on) px(c, x, y + 1, 1, 1, '#ffffff')
    }
  }
}

/** đèn thả chao to (gần người xem) */
function bigLamp(c: Ctx, lx: number, cord: number) {
  px(c, lx, 0, 1, cord, CZ.ink)
  const y = cord
  box(c, lx - 5, y, 11, 4, CZ.b1)
  px(c, lx - 4, y + 1, 4, 1, CZ.b2)
  px(c, lx - 3, y + 4, 7, 1, '#fff3b0')
  px(c, lx - 1, y - 1, 3, 1, CZ.ink)
  c.fillStyle = 'rgba(255, 226, 150, 0.10)'
  c.beginPath(); c.moveTo(lx - 4, y + 5); c.lineTo(lx + 5, y + 5); c.lineTo(lx + 18, y + 40); c.lineTo(lx - 17, y + 40); c.fill()
}

/**
 * Sàn trước quầy nhìn xuống: ván / gạch hội tụ về điểm tụ phía trên, hàng gần người xem to hơn.
 * y0 = mép sàn chạm chân quầy, h = chiều cao vùng sàn.
 */
export function drawFloor(c: Ctx, y0: number, h: number, premise: number) {
  if (h <= 0) return
  c.drawImage(cached(`floor:${h}:${premise}`, SCENE_W, h, (cc) => paintFloor(cc, h, premise)), 0, y0)
}

/** vẽ sàn vào canvas phụ (toạ độ y bắt đầu từ 0) */
function paintFloor(c: Ctx, h: number, premise: number) {
  const y0 = 0
  const P = PAL[premise] ?? PAL[0]
  const vy = y0 - 90 // điểm tụ cao phía trên → sàn nghiêng vừa phải
  const tiles = premise === 2
  // ranh giới các hàng ván / gạch: càng gần càng giãn
  const rows: number[] = [y0]
  let step = 3
  while (rows[rows.length - 1] < y0 + h) { rows.push(rows[rows.length - 1] + Math.round(step)); step *= 1.28 }
  const colW = tiles ? 12 : 9 // bề rộng cột ở mép xa
  for (let y = y0; y < y0 + h; y++) {
    const k = (y - vy) / (y0 - vy) // >1: càng gần càng giãn
    const r = rows.findIndex((ry, i) => y >= ry && y < (rows[i + 1] ?? 1e9))
    const isSeamRow = rows.includes(y)
    // các cột (đường ván dọc) ở hàng y
    for (let i = -14; i <= 14; i++) {
      const xa = VX + (i * colW - colW / 2) * k
      const xb = VX + ((i + 1) * colW - colW / 2) * k
      const a = Math.max(0, Math.round(xa)), b = Math.min(SCENE_W, Math.round(xb))
      if (b <= a) continue
      // ván gỗ so le theo hàng; gạch caro xen kẽ
      const alt = tiles ? (i + r) % 2 === 0 : (i * 7 + r * 3) % 5 === 0
      px(c, a, y, b - a, 1, alt ? P.floorB : P.floorA)
      if (!tiles && (i + r) % 2 === 0) px(c, a, y, 1, 1, P.seam) // mạch ván so le
      if (tiles) px(c, a, y, 1, 1, P.seam)
    }
    if (isSeamRow) px(c, 0, y, SCENE_W, 1, P.seam)
  }
  // bóng đổ chân quầy + ánh đèn loang trên sàn
  px(c, 0, y0, SCENE_W, 2, 'rgba(38, 28, 27, 0.35)')
  px(c, 0, y0 + 2, SCENE_W, 2, 'rgba(38, 28, 27, 0.15)')
  c.fillStyle = 'rgba(255, 226, 150, 0.10)'
  c.beginPath(); c.ellipse(VX, y0 + h * 0.45, 46, Math.max(4, h * 0.3), 0, 0, Math.PI * 2); c.fill()
  // thảm phối cảnh trước quầy
  if (h >= 14) {
    const rt = y0 + Math.round(h * 0.25), rb = y0 + h - Math.round(h * 0.12)
    const kt = (rt - vy) / (y0 - vy), kb = (rb - vy) / (y0 - vy)
    const half = 30
    c.fillStyle = P.rugEdge
    c.beginPath(); c.moveTo(VX - half * kt - 1, rt - 1); c.lineTo(VX + half * kt + 1, rt - 1); c.lineTo(VX + half * kb + 2, rb + 1); c.lineTo(VX - half * kb - 2, rb + 1); c.fill()
    c.fillStyle = P.rug
    c.beginPath(); c.moveTo(VX - half * kt, rt); c.lineTo(VX + half * kt, rt); c.lineTo(VX + half * kb, rb); c.lineTo(VX - half * kb, rb); c.fill()
    c.fillStyle = 'rgba(255,255,255,0.18)'
    c.beginPath(); c.moveTo(VX - half * kt + 3, rt + 2); c.lineTo(VX + half * kt - 3, rt + 2); c.lineTo(VX + half * kb - 4, rb - 2); c.lineTo(VX - half * kb + 4, rb - 2); c.closePath(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.stroke()
  }
}

/** đồ đặt trên sàn (vẽ sau cảnh gốc để đè lên chân quầy): chậu cây góc trái, bảng menu đứng góc phải */
export function drawFloorProps(c: Ctx, y0: number, h: number, t: number, hasTreeRight: boolean) {
  if (h < 18) return
  const by = y0 + h - 2 // đáy gần người xem
  // chậu cây lớn góc trái
  drawPlant(c, 3, by - 17, true)
  // bảng menu chữ A (nếu cây thông không đứng góc phải)
  if (!hasTreeRight) {
    const x = SCENE_W - 20, y = by - 22
    px(c, x + 1, y + 2, 2, 20, CZ.w1); px(c, x + 14, y + 2, 2, 20, CZ.w1)
    box(c, x, y, 17, 16, '#2c4a40', CZ.w1)
    px(c, x + 3, y + 3, 9, 1, '#eef2ea'); px(c, x + 3, y + 6, 11, 1, 'rgba(238,242,234,0.7)'); px(c, x + 3, y + 9, 7, 1, 'rgba(238,242,234,0.7)')
    px(c, x + 11, y + 11, 3, 2, '#ff9aa8') // trái tim phấn
    if (Math.floor(t * 1.5) % 2) px(c, x + 12, y + 3, 2, 2, '#f2c14e')
  }
}

function mixHex(a: string, b: string, f: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - f) + ((pb >> s) & 255) * f)
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

