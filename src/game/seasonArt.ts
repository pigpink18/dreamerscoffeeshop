// Trang trí theo mùa (vẽ pixel) – Giáng Sinh / Tết Tây / chờ Tết / Tết. Mùa lấy từ season.ts.
import { px, box, CZ, type Ctx } from './pixel'
import { drawXmasTree, type TreeSize } from './xmas'
import { SEASON, season } from './season'

const RED = '#c8262c', RED2 = '#e8503a', GOLD = '#f2c14e', GOLD2 = '#d99a2b', SILVER = '#d7dde4'

/** khung của từng cỡ (giống cây thông) */
export const PIECE: Record<TreeSize, [number, number]> = { sm: [11, 18], md: [19, 31], lg: [25, 40], xl: [37, 57], xxl: [51, 80] }

/** số ngẫu nhiên cố định theo hạt giống (để hoa / bóng không nhảy chỗ mỗi khung hình) */
function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
function disc(c: Ctx, cx: number, cy: number, r: number, col: string) {
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6))
    px(c, cx - w, cy + dy, w * 2 + 1, 1, col)
  }
}

// ---------- vật trang trí chính (đứng chỗ cây thông) ----------
/** (x, y) = góc trên trái khung cỡ size. Mùa Noel = cây thông, Tết Tây = chùm bóng bay, Tết = cây mai */
export function drawCenterpiece(c: Ctx, x: number, y: number, t: number, size: TreeSize = 'md') {
  const s = season()
  if (s === 'xmas') return drawXmasTree(c, x, y, t, size)
  const [w, h] = PIECE[size]
  if (s === 'newyear') return drawBalloons(c, x, y, t, w, h, SEASON!.year)
  if (s === 'tetwait' || s === 'tet') return drawMai(c, x, y, t, w, h, s === 'tet' ? 1 : 0.15 + 0.85 * SEASON!.bloom, s === 'tet')
}

/** cây mai vàng trong chậu men đỏ – bloom 0..1 (nụ xanh → hoa nở), lixi = treo bao lì xì */
/** cây đào hồng (Tết miền Bắc) – cùng dáng cây mai, hoa hồng */
export function drawDao(c: Ctx, x: number, y: number, t: number, size: TreeSize = 'lg') {
  const [w, h] = PIECE[size]
  const s = season()
  drawMai(c, x, y, t, w, h, s === 'tet' ? 1 : 0.15 + 0.85 * (SEASON?.bloom ?? 1), s === 'tet', true)
}

export function drawMai(c: Ctx, x: number, y: number, t: number, w: number, h: number, bloom: number, lixi: boolean, dao = false) {
  const PET = dao ? '#ff9ac1' : GOLD, PET2 = dao ? '#ffd0e2' : '#fff1a8', HEART = dao ? '#d84a7a' : '#f08a24'
  const cx = x + Math.floor(w / 2)
  // chậu men đỏ viền vàng
  const pw = Math.max(7, Math.round(w * 0.34)), ph = Math.max(5, Math.round(h * 0.12))
  const py = y + h - ph
  box(c, cx - Math.floor(pw / 2), py, pw, ph, RED, CZ.ink)
  px(c, cx - Math.floor(pw / 2) + 1, py + 1, pw - 2, 1, RED2)
  px(c, cx - Math.floor(pw / 2) + 1, py + Math.floor(ph / 2), pw - 2, 1, GOLD)
  box(c, cx - Math.floor(pw / 2) - 1, py - 2, pw + 2, 3, '#7a1c1f', CZ.ink)
  // thân cây xù xì cong
  const trunkTop = y + Math.round(h * 0.42)
  for (let yy = py - 1; yy >= trunkTop; yy--) {
    const k = (py - yy) / (py - trunkTop)
    const off = Math.round(Math.sin(k * 2.6) * w * 0.08)
    const tw = Math.max(1, Math.round((1 - k) * w * 0.09) + 1)
    px(c, cx + off - Math.floor(tw / 2) - 1, yy, tw + 2, 1, CZ.ink)
    px(c, cx + off - Math.floor(tw / 2), yy, tw, 1, '#5a3a24')
  }
  // cành toả ra
  const R = rng(w * 131 + h + (dao ? 977 : 0))
  const tips: [number, number][] = []
  const nB = Math.max(4, Math.round(w / 4))
  for (let i = 0; i < nB; i++) {
    const a = Math.PI * (1.08 + (i / (nB - 1)) * 0.84) + (R() - 0.5) * 0.25
    const len = h * (0.28 + R() * 0.2)
    const sx = cx + Math.round(Math.sin((1) * 2.6) * w * 0.08), sy = trunkTop + Math.round(R() * h * 0.12)
    const ex = Math.round(sx + Math.cos(a) * len * (w / h) * 1.2), ey = Math.round(sy + Math.sin(a) * len)
    const n = Math.max(Math.abs(ex - sx), Math.abs(ey - sy))
    for (let j = 0; j <= n; j++) px(c, Math.round(sx + ((ex - sx) * j) / n), Math.round(sy + ((ey - sy) * j) / n), 1, 1, '#4a2e1f')
    tips.push([ex, ey])
  }
  // hoa / nụ dọc cành
  const nF = Math.round(w * h / 22)
  for (let i = 0; i < nF; i++) {
    const [ex, ey] = tips[i % tips.length]
    const k = R()
    const fx = Math.round(cx + (ex - cx) * (0.35 + k * 0.7) + (R() - 0.5) * 4)
    const fy = Math.round(trunkTop + (ey - trunkTop) * (0.35 + k * 0.7) + (R() - 0.5) * 4)
    if (fy > py - 2) continue
    if (R() < bloom) {
      const big = w >= 30 && R() < 0.5
      if (big) { px(c, fx - 1, fy, 3, 1, PET); px(c, fx, fy - 1, 1, 3, PET); px(c, fx, fy, 1, 1, HEART) }
      else { px(c, fx, fy, 2, 2, PET); px(c, fx, fy, 1, 1, PET2) }
    } else px(c, fx, fy, 1, 1, '#7bb662')
  }
  // bao lì xì đỏ treo cành
  if (lixi) {
    tips.forEach(([ex, ey], i) => {
      if (i % 2) return
      const sw = Math.round(Math.sin(t * 2 + i) * 0.6)
      const lx = Math.round(cx + (ex - cx) * 0.7) + sw, ly = Math.round(trunkTop + (ey - trunkTop) * 0.7)
      px(c, lx + 1, ly, 1, 2, GOLD2)
      box(c, lx, ly + 2, 3, 4, RED, CZ.ink)
      px(c, lx + 1, ly + 3, 1, 1, GOLD)
    })
  }
}

// font số 3x5 cho bóng bay "2027"
const DIG: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
}
function digit(c: Ctx, d: string, x: number, y: number, col: string) {
  const p = DIG[d]; if (!p) return
  for (let i = 0; i < 15; i++) if (p[i] === '1') px(c, x + (i % 3), y + Math.floor(i / 3), 1, 1, col)
}

/** chùm bóng bay vàng bạc đón năm mới, buộc vào hộp quà; khung lớn thì có 4 quả số năm */
export function drawBalloons(c: Ctx, x: number, y: number, t: number, w: number, h: number, year: number) {
  const cx = x + Math.floor(w / 2), by = y + h - 6
  // hộp quà làm đế
  box(c, cx - 4, by, 9, 6, RED, CZ.ink); px(c, cx, by, 1, 6, GOLD); px(c, cx - 4, by + 2, 9, 1, GOLD)
  const R = rng(w * 7 + h)
  const big = w >= 37
  const r = big ? 5 : w >= 25 ? 4 : 3
  const cols = [GOLD, SILVER, RED2, '#fffaf0', GOLD, SILVER]
  const balls: { bx: number; by: number; col: string; d?: string }[] = []
  if (big) {
    // hàng số năm
    const ys = String(year).split('')
    ys.forEach((d, i) => balls.push({ bx: x + Math.round(w * 0.12 + ((i + 0.5) / ys.length) * w * 0.76), by: y + r + 2 + (i % 2) * 3, col: i % 2 ? SILVER : GOLD, d }))
  }
  const n = big ? 5 : w >= 25 ? 6 : 4
  for (let i = 0; i < n; i++) {
    balls.push({ bx: x + Math.round(w * 0.22 + R() * w * 0.56), by: y + (big ? 2 * r + 9 : r + 1) + Math.round(R() * (h * 0.45)), col: cols[i % cols.length] })
  }
  // dây buộc
  for (const b of balls) {
    const sway = Math.round(Math.sin(t * 1.4 + b.bx) * 1)
    const tx = b.bx + sway, ty = b.by + r
    const n2 = Math.max(1, by - ty)
    for (let j = 0; j < n2; j += 1) px(c, Math.round(tx + ((cx - tx) * j) / n2), ty + j, 1, 1, 'rgba(59,42,32,0.55)')
  }
  for (const b of balls) {
    const sway = Math.round(Math.sin(t * 1.4 + b.bx) * 1)
    const bx = b.bx + sway
    disc(c, bx, b.by, r + 1, CZ.ink)
    disc(c, bx, b.by, r, b.col)
    px(c, bx - Math.ceil(r / 2), b.by - Math.ceil(r / 2), 1, 2, '#ffffff')
    px(c, bx, b.by + r + 1, 1, 1, CZ.ink)
    if (b.d) digit(c, b.d, bx - 1, b.by - 2, b.col === GOLD ? '#8a5a12' : '#4a5563')
  }
  // kim tuyến lấp lánh
  if (Math.floor(t * 3) % 2) px(c, x + 2, y + Math.round(h * 0.3), 1, 1, '#ffffff')
}

// ---------- trần / tường ----------
/** đèn lồng đỏ (x = giữa, y = điểm treo), cỡ 1 hoặc 2, đung đưa nhẹ */
export function drawLantern(c: Ctx, x: number, y: number, t: number, cord = 3, s = 1) {
  const sw = Math.round(Math.sin(t * 1.3 + x * 0.7) * 0.8)
  const lx = x + sw
  px(c, x, y, 1, cord, CZ.ink)
  const bw = 7 * s, bh = 6 * s, top = y + cord
  px(c, lx - 2 * s, top, 4 * s + 1, 1 * s + 1, GOLD2)
  for (let r = 0; r < bh; r++) {
    const k = Math.sin(((r + 0.5) / bh) * Math.PI)
    const hw = Math.round((bw / 2) * (0.55 + 0.45 * k))
    px(c, lx - hw - 1, top + 1 * s + 1 + r, hw * 2 + 3, 1, CZ.ink)
    px(c, lx - hw, top + 1 * s + 1 + r, hw * 2 + 1, 1, r < bh / 3 ? RED2 : RED)
  }
  px(c, lx, top + s + 1, 1, bh, '#9a1c22') // gân giữa
  px(c, lx - 2 * s, top + s + 1 + bh, 4 * s + 1, s + 1, GOLD2)
  px(c, lx, top + 2 * s + 2 + bh, 1, 2 + 2 * s, GOLD) // tua vàng
}

/** dây kim tuyến vàng bạc + sao treo (trần quán, Tết Tây) */
export function drawTinsel(c: Ctx, top: number, t: number, W: number) {
  const sag = Math.max(2, Math.min(8, Math.round(top * 0.35)))
  for (let x = 0; x < W; x++) {
    const y = 2 + Math.round(Math.sin((x / W) * Math.PI * 3) ** 2 * sag)
    px(c, x, y, 1, 2, x % 4 < 2 ? GOLD : SILVER)
    if (x % 10 === 5) {
      const tw = (Math.floor(t * 3) + x) % 4 === 0
      px(c, x, y + 2, 1, 3, 'rgba(59,42,32,0.5)')
      px(c, x - 1, y + 5, 3, 1, tw ? '#ffffff' : GOLD); px(c, x, y + 4, 1, 3, tw ? '#ffffff' : GOLD)
    }
  }
}

/** dây pháo đỏ treo dọc */
export function drawFirecrackers(c: Ctx, x: number, y: number, len: number) {
  px(c, x + 1, y, 1, 3, GOLD2)
  for (let i = 0; i < len; i++) {
    const yy = y + 3 + i * 3, side = i % 2 ? 1 : -1
    box(c, x + side * 2 - 1, yy, 4, 3, RED, CZ.ink); px(c, x + side * 2, yy, 2, 1, GOLD)
    px(c, x + 1, yy, 1, 3, '#7a1c1f')
  }
  px(c, x, y + 3 + len * 3, 3, 3, GOLD); px(c, x + 1, y + 4 + len * 3, 1, 3, GOLD2)
}

/** câu đối đỏ chữ vàng (cuộn dọc) */
export function drawCouplet(c: Ctx, x: number, y: number, h: number) {
  px(c, x - 1, y - 1, 7, 2, '#5a3a24')
  box(c, x, y, 5, h, RED, CZ.ink)
  px(c, x + 1, y + 1, 3, h - 2, '#d63a36')
  for (let yy = y + 3; yy < y + h - 3; yy += 5) { px(c, x + 1, yy, 3, 1, GOLD); px(c, x + 2, yy + 1, 1, 2, GOLD); px(c, x + 1, yy + 3, 3, 1, GOLD2) }
}

/** trang trí trên trần quán theo mùa (khi quán mở rộng có trần) */
export function drawSeasonCeiling(c: Ctx, top: number, t: number, W: number) {
  const s = season()
  if (s === 'newyear') drawTinsel(c, top, t, W)
  else if (s === 'tetwait' || s === 'tet') {
    const n = W >= 150 ? 5 : 3
    for (let i = 0; i < n; i++) {
      const lx = Math.round(((i + 0.5) / n) * W)
      drawLantern(c, lx, 0, t, Math.min(top - 12, 3 + (i % 2) * 4), top >= 30 ? 2 : 1)
    }
    if (s === 'tet' && top >= 30) { drawFirecrackers(c, 6, 0, Math.min(8, Math.round(top / 5))); drawFirecrackers(c, W - 9, 0, Math.min(8, Math.round(top / 5))) }
  }
}

/** trang trí mép trên tường sau (quán không có trần: 2 đèn lồng nhỏ / dây kim tuyến) */
export function drawSeasonWallTop(c: Ctx, t: number, W: number) {
  const s = season()
  if (s === 'newyear') drawTinsel(c, 6, t, W)
  else if (s === 'tetwait' || s === 'tet') { drawLantern(c, 30, 0, t, 2); drawLantern(c, W - 30, 0, t, 2) }
}
