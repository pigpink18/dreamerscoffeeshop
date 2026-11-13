// Cảnh khu bếp – cùng khung, cùng cỡ điểm ảnh và bảng màu với cảnh quầy (CounterScene):
// tường sau 128 rộng ở giữa, 2 tường hông phối cảnh (cửa bếp có ô kính tròn bên trái, giá treo nồi chảo bên phải),
// quầy gỗ ô panel xanh rêu kéo dài 2 bên, dải sàn gỗ hội tụ phía trước. Toạ độ: cả khung KART_W x KART_H.
// Phần tĩnh (tường, quầy, bếp gas, tủ lạnh, đồ trên sàn) vẽ 1 lần vào canvas phụ rồi dán lại mỗi khung hình.
import { px, box, CZ, SCENE_W, COUNTER_Y, woodFrame, woodShelf, glassJar, drawCounter, sky, mixWeighted, type Ctx } from './pixel'
import { drawFloor, drawCounterWings, persp, sideRect } from './depth'

export const KOX = 24 // bề rộng mỗi tường hông (giống quầy)
export const KART_W = SCENE_W + 2 * KOX // 176
export const KART_H = 103 // 92 cảnh + 11 sàn (488:286 như quầy)
const FLOOR_Y = 92
const Y = COUNTER_Y // 62: mép mặt quầy
/** điểm neo (toạ độ cả khung) */
export const KANCHOR = {
  burnerL: [82, 61],
  burnerR: [96, 61],
  panIn: [82, 59],
  potIn: [96, 54],
  bowl: [116, 61],
  plate: [60, 61],
  waffle: [136, 62],
} as const satisfies Record<string, readonly [number, number]>

const INK = CZ.ink
const STEEL = '#c3cad0', STEEL_D = '#8f979e', STEEL_L = '#eef2f4', IRON = '#3a3e45', IRON_D = '#23262b', IRON_L = '#5a606a', IRON_LL = '#7a828c'
const COPPER = '#c8784a', COPPER_L = '#e8a070', COPPER_S = '#f8d0a8', COPPER_D = '#8e4a2a', COPPER_M = '#ac6038'
const GROUT = '#dccfae', TILE_HI = '#5fa89e', TILE_GLINT = '#b4e0d4'
const SHADOW = (a: number) => `rgba(38, 28, 27, ${a})`
const WARM = (a: number) => `rgba(255, 214, 140, ${a})`

// ---------- canvas phụ cho phần tĩnh ----------
const slots: Record<string, { key: string; cv: HTMLCanvasElement }> = {}
function layer(slot: string, key: string, w: number, h: number, paint: (c: Ctx) => void): HTMLCanvasElement {
  const s = slots[slot]
  if (s && s.key === key) return s.cv
  const cv = s?.cv ?? document.createElement('canvas')
  cv.width = w; cv.height = h // gán lại = xoá trắng
  const c = cv.getContext('2d')!
  c.imageSmoothingEnabled = false
  paint(c)
  slots[slot] = { key, cv }
  return cv
}

// ---------- tiện ích vẽ ----------
/** đĩa tròn pixel (không khử răng cưa) */
function disc(c: Ctx, cx: number, cy: number, r: number, col: string) {
  for (let dy = -r; dy <= r; dy++) {
    const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35)
    px(c, cx - hw, cy + dy, hw * 2 + 1, 1, col)
  }
}
/** quả tròn có viền mực + đốm sáng (rau củ) */
function fruit(c: Ctx, cx: number, cy: number, r: number, col: string, hi: string, dk: string) {
  disc(c, cx, cy, r + 1, INK)
  disc(c, cx, cy, r, col)
  if (r >= 2) { px(c, cx, cy + r - 1, r, 1, dk); px(c, cx + r - 1, cy, 1, r - 1, dk) }
  px(c, cx - Math.max(1, r - 1), cy - Math.max(1, r - 1), 1, 1, hi)
  if (r >= 3) px(c, cx - r + 2, cy - r + 1, 2, 1, hi)
}
/** quầng sáng hình thang theo từng hàng pixel (y0 → y1, nửa bề rộng hw0 → hw1) */
function cone(c: Ctx, cx: number, y0: number, y1: number, hw0: number, hw1: number, col: string) {
  for (let y = y0; y < y1; y++) {
    const hw = Math.round(hw0 + ((hw1 - hw0) * (y - y0)) / Math.max(1, y1 - y0))
    px(c, cx - hw, y, hw * 2, 1, col)
  }
}
/** màu đồng theo vị trí ngang u ∈ [0,1] (ánh sáng chiếu từ trái) */
function copperAt(u: number) {
  return u < 0.1 ? COPPER : u < 0.26 ? COPPER_L : u < 0.34 ? COPPER_S : u < 0.6 ? COPPER : u < 0.84 ? COPPER_M : COPPER_D
}

// ---------- gạch men ----------
/** gạch thẻ xanh rêu mạch kem, so le (tường sau y 47..61) */
function backTiles(c: Ctx) {
  px(c, 0, 47, SCENE_W, Y - 47, GROUT)
  for (let r = 0; r < 3; r++) {
    const ty = 47 + r * 5
    for (let tx = -(r % 2) * 4; tx < SCENE_W; tx += 8) {
      const a = Math.max(0, tx), b = Math.min(SCENE_W, tx + 7)
      if (b <= a) continue
      const v = (tx * 7 + r * 13) % 11
      const base = v === 3 ? CZ.t3 : v === 7 ? '#2b6f6d' : CZ.t2
      px(c, a, ty, b - a, 4, base)
      px(c, a, ty, b - a, 1, v === 3 ? '#79bdb2' : TILE_HI)
      px(c, a, ty + 3, b - a, 1, CZ.t1)
      if (tx + 6 < SCENE_W && tx + 6 >= 0) px(c, tx + 6, ty + 1, 1, 2, CZ.t1)
      if (tx + 1 >= 0) px(c, tx + 1, ty + 1, 1, 1, TILE_GLINT)
      if (v % 4 === 1 && tx + 2 >= 0) px(c, tx + 2, ty + 1, 2, 1, '#8ccfc2')
    }
  }
  px(c, 0, 47, SCENE_W, 1, SHADOW(0.28)) // bóng dưới nẹp gỗ
  px(c, 0, 48, SCENE_W, 1, SHADOW(0.1))
  px(c, 0, Y - 2, SCENE_W, 1, SHADOW(0.14))
}

// ---------- tường hông phối cảnh ----------
function sideWalls(c: Ctx) {
  for (const side of [0, 1] as const) {
    for (let i = 0; i < KOX; i++) {
      const x = side === 0 ? KOX - 1 - i : KOX + SCENE_W + i
      const d = (i + 1) / KOX
      const yTrim = Math.round(persp(3, d)), yRail = Math.round(persp(43, d)), yTile = Math.round(persp(47, d))
      px(c, x, 0, 1, Y, '#f0dcb4')
      if (i % 5 === 2) px(c, x, 0, 1, yRail, '#e6cb9c')
      px(c, x, Math.max(0, yTrim - 3), 1, 3, CZ.w1)
      px(c, x, Math.max(0, yTrim), 1, 1, CZ.w3)
      // nẹp gỗ chân tường
      px(c, x, yRail, 1, 1, INK); px(c, x, yRail + 1, 1, yTile - yRail - 1, CZ.w3); px(c, x, yRail + 1, 1, 1, CZ.w5); px(c, x, yTile - 1, 1, 1, CZ.w1)
      // gạch men xanh ốp tường (mạch gạch toả theo phối cảnh)
      px(c, x, yTile, 1, Y - yTile, GROUT)
      for (let r = 0; r < 3; r++) {
        const a = Math.round(persp(47 + r * 5, d)), b = Math.min(Y, Math.round(persp(51 + r * 5, d)))
        if (b <= a) continue
        const vj = (i + (r % 2) * 3) % 6
        if (vj === 0) continue // mạch đứng
        px(c, x, a, 1, b - a, (i * 5 + r) % 9 === 2 ? CZ.t3 : CZ.t2)
        px(c, x, a, 1, 1, vj === 1 ? TILE_GLINT : TILE_HI)
        px(c, x, b - 1, 1, 1, CZ.t1)
        if (vj === 5) px(c, x, a + 1, 1, b - a - 1, CZ.t1)
      }
      c.fillStyle = SHADOW(+(0.05 + 0.2 * d).toFixed(3)); c.fillRect(x, 0, 1, Y)
    }
    const cx = side === 0 ? KOX - 1 : KOX + SCENE_W
    px(c, cx, 0, 1, Y, SHADOW(0.35))
  }
  // trái: cửa bếp gỗ 2 chiều, ô kính tròn nhìn ra quán, tấm đẩy đồng
  sideRect(KOX, 0, 5, 19, 12, 62, (x, y0, y1, u) => {
    const H = y1 - y0
    const edge = u < 0.08 || u > 0.92
    px(c, x, y0, 1, H, edge ? INK : u < 0.17 || u > 0.83 ? CZ.w1 : u < 0.3 ? CZ.w3 : CZ.w2)
    px(c, x, y0, 1, 1, INK)
    if (!edge) {
      px(c, x, y0 + 1, 1, 1, CZ.w1)
      // ô panel dưới
      const p0 = Math.round(y0 + H * 0.52), p1 = Math.round(y0 + H * 0.9)
      if (u > 0.22 && u < 0.78) { px(c, x, p0, 1, 1, CZ.w1); px(c, x, p0 + 1, 1, p1 - p0 - 1, u < 0.3 ? CZ.w1 : CZ.w2); px(c, x, p1, 1, 1, CZ.w4) }
    }
    if (u > 0.26 && u < 0.74) {
      const m = Math.round(y0 + H * 0.22), r = Math.round(H * 0.11 * Math.sin(((u - 0.26) / 0.48) * Math.PI))
      px(c, x, m - r - 1, 1, r * 2 + 3, CZ.b0)
      if (r > 0) { px(c, x, m - r, 1, r * 2 + 1, '#ffe7b0'); if (u < 0.45) px(c, x, m - r, 1, 1, '#fff8e0'); if (u > 0.55) px(c, x, m + r, 1, 1, '#e8c27a') }
    }
    if (u > 0.25 && u < 0.75) { const yp = Math.round(y0 + H * 0.44); px(c, x, yp, 1, 2, u < 0.4 ? CZ.b2 : CZ.b1) } // tấm đồng đẩy cửa
  })
  // lịch giấy nhỏ cạnh cửa
  sideRect(KOX, 0, 20, 23, 22, 32, (x, y0, y1, u) => { px(c, x, y0, 1, y1 - y0, u > 0.8 ? INK : '#fbf2dc'); px(c, x, y0, 1, 2, u > 0.8 ? INK : CZ.r1) })
  // phải: thanh treo nồi chảo đồng
  sideRect(KOX, 1, 3, 21, 14, 15, (x, y0) => { px(c, x, y0 - 1, 1, 1, INK); px(c, x, y0, 1, 1, CZ.b1); px(c, x, y0 + 1, 1, 1, CZ.b0) })
  for (const [i0, i1, len, kind] of [[4, 9, 13, 0], [10, 14, 9, 1], [15, 21, 14, 0]] as const) {
    sideRect(KOX, 1, i0, i1, 16, 16 + len, (x, y0, y1, u) => {
      const mid = Math.abs(u - 0.5) < 0.15
      const top = Math.round(y0 + (y1 - y0) * 0.45)
      if (mid) { px(c, x, y0, 1, top - y0, INK); px(c, x, y0 - 1, 1, 1, CZ.b1) } // móc + cán treo
      px(c, x, top, 1, y1 - top, INK)
      if (u > 0.1 && u < 0.9) {
        const inner = y1 - top - 2
        if (kind === 0) {
          px(c, x, top + 1, 1, inner, u < 0.3 ? COPPER_L : u < 0.42 ? COPPER_S : u < 0.75 ? COPPER : COPPER_D)
          px(c, x, top + 1, 1, 1, COPPER_S)
        } else px(c, x, top + 1, 1, inner, u < 0.3 ? IRON_LL : u < 0.7 ? IRON : IRON_D)
      }
    })
  }
  // kệ gia vị nhỏ trên tường phải
  sideRect(KOX, 1, 4, 20, 38, 40, (x, y0) => { px(c, x, y0, 1, 1, CZ.w5); px(c, x, y0 + 1, 1, 1, CZ.w3); px(c, x, y0 + 2, 1, 1, CZ.w1); px(c, x, y0 + 3, 1, 1, SHADOW(0.3)) })
  sideRect(KOX, 1, 5, 19, 31, 38, (x, y0, y1, u) => {
    const k = Math.floor(u * 4) % 4, f = (u * 4) % 1
    if (f < 0.7) {
      const col = ['#7fb34d', '#d8333a', '#e0a03a', '#9a5b34'][k]
      px(c, x, y0 + 1, 1, y1 - y0 - 1, f < 0.25 ? '#dcebe6' : col)
      px(c, x, y0, 1, 1, INK); px(c, x, y0 + 1, 1, 1, CZ.b1)
    }
  })
}

// ---------- tường sau (toạ độ cảnh gốc 128, đã dịch KOX) ----------
function backWall(c: Ctx, dayFrac: number, rainy: boolean) {
  // tường vữa kem sọc như quầy
  px(c, 0, 0, SCENE_W, Y, '#f0dcb4')
  for (let x = 0; x < SCENE_W; x += 8) px(c, x, 0, 1, 43, '#e6cb9c')
  for (let r = 0; r < 7; r++) for (let x = 4 + (r % 2) * 4; x < SCENE_W; x += 8) px(c, x, 6 + r * 6, 1, 1, '#dcbd8a')
  px(c, 0, 0, SCENE_W, 2, CZ.w1); px(c, 0, 2, SCENE_W, 1, CZ.w3); px(c, 0, 3, SCENE_W, 1, SHADOW(0.18))
  // nẹp gỗ + gạch men xanh rêu ốp sau bếp
  px(c, 0, 43, SCENE_W, 1, INK); px(c, 0, 44, SCENE_W, 1, CZ.w5); px(c, 0, 45, SCENE_W, 1, CZ.w3); px(c, 0, 46, SCENE_W, 1, CZ.w1)
  backTiles(c)

  window_(c, dayFrac, rainy)
  clock(c, 81, 10)
  shelfLeft(c)
  hood(c, 64)
}

/** cửa sổ nhỏ khung gỗ (trời theo giờ trong ngày) + rèm caro + chậu rau thơm + khăn lau */
function window_(c: Ctx, dayFrac: number, rainy: boolean) {
  const wx = 95, wy = 9, ww = 26, wh = 18
  woodFrame(c, wx, wy, ww, wh)
  const [st, sb] = sky(dayFrac, rainy)
  for (let i = 0; i < wh; i++) px(c, wx, wy + i, ww, 1, mixWeighted(st, sb, i / wh))
  const night = dayFrac > 0.88
  if (!rainy) {
    if (night) { px(c, wx + 15, wy + 3, 3, 3, '#f7f3d6'); px(c, wx + 14, wy + 3, 2, 2, mixWeighted(st, sb, 0.15)); for (let i = 0; i < 5; i++) px(c, wx + 2 + i * 4, wy + 2 + ((i * 5) % 7), 1, 1, '#ffffff') }
    else { const sx = wx + 3 + Math.round(dayFrac * 14), sy = wy + 3 + Math.round(Math.abs(dayFrac - 0.45) * 10); px(c, sx, sy, 3, 3, '#fff3b0'); px(c, sx + 1, sy - 1, 1, 5, '#fff3b0'); px(c, sx - 1, sy + 1, 5, 1, '#fff3b0') }
    px(c, wx + 2, wy + 6, 7, 2, 'rgba(255,255,255,0.75)'); px(c, wx + 4, wy + 5, 3, 1, 'rgba(255,255,255,0.75)')
  }
  // mái nhà phố xa
  const bld = ['#c9a68a', '#b58e74', '#d6b89c']
  for (let i = 0; i < 3; i++) {
    const bx = wx + i * 8, by = wy + wh - 6 - ((i * 3) % 4), bw = Math.min(8, wx + ww - bx)
    px(c, bx, by, bw, wy + wh - by, bld[i]); px(c, bx, by - 1, bw, 2, i % 2 ? CZ.r1 : CZ.r0)
    px(c, bx + bw - 1, by + 1, 1, wy + wh - by - 1, SHADOW(0.15))
    px(c, bx + 2, by + 3, 2, 1, night ? '#ffd56b' : '#7a5a48')
  }
  if (rainy) for (let i = 0; i < 9; i++) px(c, wx + ((i * 7) % ww), wy + ((i * 5) % (wh - 3)), 1, 3, 'rgba(220,235,255,0.75)')
  // ánh kính bậc thang
  for (let k = 0; k < 8; k++) px(c, wx + 3 + k, wy + wh - 2 - k * 2, 2, 2, 'rgba(255,255,255,0.18)')
  // song cửa
  px(c, wx + ww / 2 - 1, wy, 3, wh, INK); px(c, wx + ww / 2, wy, 1, wh, CZ.w3)
  px(c, wx, wy + 8, ww, 2, INK); px(c, wx, wy + 8, ww, 1, CZ.w3)
  // bậu cửa
  const sy = wy + wh + 3
  px(c, wx - 5, sy, ww + 10, 4, INK)
  px(c, wx - 4, sy, ww + 8, 1, CZ.w5); px(c, wx - 4, sy + 1, ww + 8, 1, CZ.w3); px(c, wx - 4, sy + 2, ww + 8, 1, CZ.w1)
  px(c, wx - 4, sy + 4, ww + 8, 1, SHADOW(0.22))
  // rèm caro đỏ kem (diềm trên + 2 vạt buộc)
  const cy0 = wy - 4
  for (let x = wx - 4; x < wx + ww + 4; x++) {
    const sc = (x - wx + 4) % 4 === 3 ? 3 : 4
    px(c, x, cy0, 1, sc + 1, INK)
    for (let y = 0; y < sc; y++) px(c, x, cy0 + y, 1, 1, ((x >> 1) + (y >> 1)) % 2 ? CZ.r1 : '#f6e6c8')
  }
  px(c, wx - 5, cy0 - 1, ww + 10, 1, CZ.b0); px(c, wx - 5, cy0 - 1, 2, 1, CZ.b2); px(c, wx + ww + 3, cy0 - 1, 2, 1, CZ.b2) // thanh rèm đồng
  // chậu rau thơm trên bậu
  for (const [x, kind] of [[wx + 2, 0], [wx + 10, 1], [wx + 19, 2]] as const) {
    const py = sy - 3
    px(c, x, py, 6, 3, INK); px(c, x + 1, py, 4, 3, '#d9744a'); px(c, x + 1, py, 1, 3, '#ec9a6c'); px(c, x + 4, py, 1, 3, '#b25a36')
    px(c, x - 1, py - 2, 8, 2, INK); px(c, x, py - 2, 6, 1, '#ec9a6c'); px(c, x, py - 1, 6, 1, '#c8643e')
    px(c, x, sy, 6, 1, SHADOW(0.25))
    const g = ['#4e7f2e', '#6aa84f', '#9ccf6a']
    if (kind === 0) { // húng quế lá tròn
      for (const [dx, dy] of [[1, -5], [3, -6], [0, -4], [4, -4], [2, -4]] as const) { px(c, x + dx, py + dy, 2, 2, g[1]); px(c, x + dx, py + dy, 1, 1, g[2]) }
      px(c, x + 2, py - 3, 1, 1, g[0])
    } else if (kind === 1) { // hương thảo dáng nhọn
      for (const dx of [1, 2, 3, 4]) { const hh = 3 + ((dx * 3) % 3); px(c, x + dx, py - 2 - hh, 1, hh, dx % 2 ? g[0] : g[1]); px(c, x + dx, py - 2 - hh, 1, 1, g[2]) }
    } else { // ớt
      px(c, x + 1, py - 5, 4, 3, g[0]); px(c, x + 2, py - 6, 2, 1, g[1]); px(c, x + 1, py - 4, 1, 1, '#e8443a'); px(c, x + 4, py - 5, 1, 2, '#e8443a'); px(c, x + 3, py - 3, 1, 1, '#ff8a5a')
    }
  }
}

/** đồng hồ treo tường gỗ tròn */
function clock(c: Ctx, cx: number, cy: number) {
  disc(c, cx, cy, 6, INK)
  disc(c, cx, cy, 5, CZ.w3)
  px(c, cx - 3, cy - 5, 3, 1, CZ.w5); px(c, cx - 5, cy - 2, 1, 3, CZ.w4)
  disc(c, cx, cy, 4, '#fbf2dc')
  px(c, cx + 2, cy + 3, 2, 1, '#e8d6b0'); px(c, cx + 3, cy + 1, 1, 2, '#e8d6b0')
  for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0]] as const) px(c, cx + dx, cy + dy, 1, 1, CZ.w1)
  px(c, cx, cy - 2, 1, 3, INK); px(c, cx + 1, cy, 2, 1, INK) // kim
  px(c, cx, cy, 1, 1, CZ.r1)
  px(c, cx + 5, cy + 6, 1, 1, SHADOW(0.2)); px(c, cx - 4, cy + 7, 9, 1, SHADOW(0.12))
}

/** kệ gỗ bên trái: hũ thuỷ tinh, chai dầu, hộp gia vị + thanh treo muôi, phới, xẻng, dao */
function shelfLeft(c: Ctx) {
  woodShelf(c, 27, 21, 22)
  px(c, 28, 25, 20, 1, SHADOW(0.18))
  glassJar(c, 29, 13, '#f2c14e')
  glassJar(c, 35, 13, '#9a5b34')
  // chai dầu ăn
  px(c, 41, 12, 3, 9, INK); px(c, 40, 15, 5, 6, INK); px(c, 42, 11, 1, 1, CZ.r1)
  px(c, 41, 16, 3, 4, '#e8b23a'); px(c, 41, 16, 1, 3, '#fbe08a'); px(c, 42, 13, 1, 2, '#f4e6c0')
  // hộp gia vị nhỏ
  px(c, 45, 17, 4, 4, INK); px(c, 46, 18, 2, 2, '#d8333a'); px(c, 46, 17, 2, 1, STEEL); px(c, 46, 18, 1, 1, '#ff8a8a')
  // tranh nhỏ / công thức ghim trên tường
  px(c, 31, 5, 10, 6, INK); px(c, 32, 6, 8, 4, '#fbf2dc'); px(c, 33, 7, 5, 1, '#c9b48a'); px(c, 33, 8, 3, 1, '#c9b48a'); px(c, 38, 8, 1, 1, CZ.r1); px(c, 35, 5, 2, 1, CZ.r1)
  // thanh treo dụng cụ
  const ry = 31
  px(c, 27, ry, 22, 2, INK); px(c, 28, ry, 20, 1, CZ.b1); px(c, 28, ry + 1, 20, 1, CZ.b0); px(c, 28, ry, 1, 1, CZ.b2)
  px(c, 28, ry + 2, 20, 1, SHADOW(0.15))
  // muôi
  px(c, 30, ry + 2, 1, 7, INK); px(c, 30, ry + 3, 1, 5, STEEL); px(c, 28, ry + 9, 5, 3, INK); px(c, 29, ry + 9, 3, 2, STEEL); px(c, 29, ry + 9, 1, 1, STEEL_L)
  // phới đánh trứng
  px(c, 35, ry + 2, 1, 4, INK); px(c, 35, ry + 3, 1, 3, CZ.w3)
  px(c, 33, ry + 6, 5, 5, INK); px(c, 34, ry + 7, 3, 3, '#f0dcb4'); px(c, 35, ry + 6, 1, 5, STEEL_D); px(c, 33, ry + 7, 1, 3, STEEL); px(c, 37, ry + 7, 1, 3, STEEL_D); px(c, 34, ry + 11, 3, 1, INK)
  // xẻng gỗ
  px(c, 40, ry + 2, 1, 6, CZ.w2); px(c, 40, ry + 2, 1, 1, INK)
  px(c, 39, ry + 8, 3, 4, INK); px(c, 40, ry + 8, 1, 3, CZ.w4)
  // dao
  px(c, 44, ry + 2, 2, 4, INK); px(c, 44, ry + 3, 1, 2, CZ.w1)
  px(c, 44, ry + 6, 3, 5, INK); px(c, 44, ry + 6, 2, 4, STEEL); px(c, 44, ry + 6, 1, 4, STEEL_L)
}

/** máy hút mùi chao đồng (giữa, trên bếp) + đèn dưới chụp hắt sáng xuống */
function hood(c: Ctx, hx: number) {
  // ống khói
  for (let x = 0; x < 10; x++) px(c, hx - 5 + x, 0, 1, 15, copperAt(x / 9))
  px(c, hx - 6, 0, 1, 15, INK); px(c, hx + 5, 0, 1, 15, INK)
  px(c, hx - 5, 4, 10, 1, COPPER_D); px(c, hx - 5, 5, 10, 1, COPPER_L)
  px(c, hx - 4, 4, 1, 1, CZ.b2); px(c, hx + 3, 4, 1, 1, CZ.b2)
  for (let k = 0; k < 3; k++) px(c, hx - 2 + k * 2, 8, 1, 4, COPPER_D) // khe thoát hơi
  // chao loe
  for (let r = 0; r < 14; r++) {
    const w = 10 + r * 2, x0 = hx - w / 2
    px(c, x0 - 1, 15 + r, w + 2, 1, INK)
    for (let x = 0; x < w; x++) px(c, x0 + x, 15 + r, 1, 1, copperAt(x / (w - 1)))
    if (r === 0) px(c, x0, 15, w, 1, COPPER_D)
  }
  px(c, hx - 15, 27, 30, 1, SHADOW(0.12))
  // gờ đồng thau + đinh tán
  px(c, hx - 22, 29, 44, 4, INK)
  px(c, hx - 21, 29, 42, 1, CZ.b2); px(c, hx - 21, 30, 42, 1, CZ.b1); px(c, hx - 21, 31, 42, 1, CZ.b0)
  for (let x = hx - 18; x <= hx + 18; x += 6) px(c, x, 30, 1, 1, CZ.b2)
  // đèn dưới chụp + quầng sáng ấm xuống mặt bếp
  px(c, hx - 21, 32, 42, 1, '#2e2420')
  for (const x of [hx - 14, hx + 11]) { px(c, x, 32, 4, 1, '#fff3b0'); px(c, x + 1, 32, 2, 1, '#ffffff') }
  cone(c, hx, 33, Y - 1, 19, 27, WARM(0.08))
  cone(c, hx, 33, Y - 1, 12, 19, WARM(0.07))
}

/** bếp gas gang âm quầy + lò nướng đang ấm (toạ độ cả khung) */
function stove(c: Ctx) {
  const x0 = 74, w = 30
  // khung + bóng 2 bên
  px(c, x0 - 1, Y - 2, w + 2, FLOOR_Y - Y + 2, INK)
  // mặt bếp gang
  px(c, x0, Y - 1, w, 4, IRON); px(c, x0, Y - 1, w, 1, IRON_LL); px(c, x0, Y, w, 1, IRON_L)
  for (const [bx] of [KANCHOR.burnerL, KANCHOR.burnerR]) {
    px(c, bx - 5, Y, 11, 2, IRON_D); px(c, bx - 2, Y, 5, 1, CZ.b0); px(c, bx - 1, Y, 3, 1, CZ.b1)
    for (const dx of [-6, 0, 6]) px(c, bx + dx, Y - 2, 1, 2, IRON_D) // chân kiềng
  }
  px(c, x0, Y + 2, w, 1, IRON_D)
  // nẹp thép
  px(c, x0, Y + 3, w, 1, STEEL); px(c, x0, Y + 3, w, 1, STEEL_D); px(c, x0, Y + 3, 8, 1, STEEL_L)
  px(c, x0, Y + 4, w, 1, INK)
  // bảng núm vặn
  px(c, x0, Y + 5, w, 6, '#454a52'); px(c, x0, Y + 5, w, 1, IRON_LL)
  for (let i = 0; i < 4; i++) {
    const kx = x0 + 3 + i * 6
    px(c, kx + 1, Y + 6, 3, 5, INK); px(c, kx, Y + 7, 5, 3, INK)
    px(c, kx + 1, Y + 7, 3, 3, STEEL); px(c, kx + 1, Y + 7, 2, 1, STEEL_L); px(c, kx + 3, Y + 9, 1, 1, STEEL_D)
    px(c, kx + 2, Y + 7, 1, 1, i % 2 ? INK : CZ.r1) // vạch chỉ
  }
  px(c, x0 + w - 4, Y + 7, 2, 2, INK); px(c, x0 + w - 4, Y + 7, 1, 1, '#ffb347')
  px(c, x0, Y + 11, w, 1, INK)
  // cửa lò
  px(c, x0, Y + 12, w, 15, IRON); px(c, x0, Y + 12, w, 1, IRON_L)
  px(c, x0 + 3, Y + 13, w - 6, 3, INK); px(c, x0 + 4, Y + 14, w - 8, 1, STEEL); px(c, x0 + 5, Y + 14, 6, 1, STEEL_L); px(c, x0 + w - 8, Y + 14, 3, 1, STEEL_D) // tay nắm
  // ô kính lò: ánh lửa ấm, vỉ nướng, 2 ổ bánh
  const gx = x0 + 4, gy = Y + 17, gw = w - 8, gh = 8
  px(c, gx - 1, gy - 1, gw + 2, gh + 2, INK)
  for (let i = 0; i < gh; i++) px(c, gx, gy + i, gw, 1, mixWeighted('#3a2620', '#c8642a', (i / (gh - 1)) ** 1.4))
  px(c, gx, gy + 4, gw, 1, '#2a1a14')
  for (const bx of [gx + 4, gx + 13]) { px(c, bx, gy + 2, 6, 2, '#e3a24c'); px(c, bx + 1, gy + 1, 4, 1, '#f6cf86'); px(c, bx + 1, gy + 2, 1, 1, '#fbe6b0'); px(c, bx, gy + 3, 6, 1, '#b9762e') }
  px(c, gx, gy + gh - 1, gw, 1, '#ffb35a')
  for (let k = 0; k < 4; k++) px(c, gx + 2 + k, gy + 5 - k, 1, 1, 'rgba(255,255,255,0.22)')
  px(c, gx + 12, gy + 5, 1, 1, 'rgba(255,255,255,0.22)'); px(c, gx + 13, gy + 4, 1, 1, 'rgba(255,255,255,0.22)')
  // chân / ngăn kéo dưới
  px(c, x0, Y + 27, w, 1, INK)
  px(c, x0, Y + 28, w, 2, IRON_D); px(c, x0 + 10, Y + 28, 10, 1, IRON_L)
  // viền sáng trái, tối phải
  px(c, x0, Y + 5, 1, 22, IRON_LL); px(c, x0 + w - 1, Y + 5, 1, 22, IRON_D)
}

/** tủ lạnh retro xanh mint đứng cuối quầy bên trái, đồ đạc trên nóc và nam châm trên cửa */
function fridge(c: Ctx) {
  const x = 26, y = 18, w = 22, h = FLOOR_Y - 18
  const MINT = '#6db3a6', MINT_L = '#93cfc2', MINT_S = '#c4ece2', MINT_D = '#4f9a92', MINT_DD = '#3c7f78'
  // bóng tủ đổ lên tường bên phải
  px(c, x + w, y + 3, 2, Y - y - 3, SHADOW(0.18))
  // thân bo góc trên
  px(c, x + 2, y, w - 4, h, INK); px(c, x + 1, y + 1, w - 2, h - 1, INK); px(c, x, y + 2, w, h - 2, INK)
  px(c, x + 2, y + 1, w - 4, h - 2, MINT); px(c, x + 1, y + 2, w - 2, h - 3, MINT)
  // đổ bóng theo trục đứng: sáng trái, bóng phải
  px(c, x + 1, y + 2, 1, h - 8, MINT_L); px(c, x + 2, y + 1, 2, h - 7, MINT_L); px(c, x + 4, y + 2, 1, h - 9, MINT_S)
  px(c, x + w - 4, y + 2, 2, h - 8, MINT_D); px(c, x + w - 2, y + 2, 1, h - 8, MINT_DD)
  px(c, x + 3, y + 1, w - 7, 1, MINT_S)
  // ngăn đá / ngăn mát
  const gy = y + 24
  px(c, x + 1, gy, w - 2, 1, INK); px(c, x + 1, gy + 1, w - 2, 1, MINT_DD); px(c, x + 1, gy - 1, w - 2, 1, MINT_D)
  // tay nắm chrome
  for (const [hy, hl] of [[y + 13, 8], [gy + 4, 14]] as const) {
    px(c, x + 2, hy, 3, hl, INK); px(c, x + 3, hy + 1, 1, hl - 2, STEEL); px(c, x + 3, hy + 1, 1, 2, '#ffffff'); px(c, x + 3, hy + hl - 3, 1, 1, STEEL_D)
    px(c, x + 5, hy + 1, 1, hl - 2, SHADOW(0.2))
  }
  // logo chrome
  px(c, x + 8, y + 5, 9, 3, INK); px(c, x + 9, y + 6, 7, 1, STEEL); px(c, x + 9, y + 6, 2, 1, STEEL_L); px(c, x + 14, y + 6, 2, 1, STEEL_D)
  // nam châm + giấy note + ảnh dán
  px(c, x + 9, y + 12, 5, 6, INK); px(c, x + 10, y + 13, 3, 4, '#fbf6ec'); px(c, x + 10, y + 13, 3, 2, '#8fcff0'); px(c, x + 10, y + 15, 3, 1, '#6aa84f') // ảnh polaroid
  px(c, x + 15, y + 14, 3, 3, INK); px(c, x + 16, y + 15, 1, 1, '#f2c14e') // nam châm vàng
  px(c, x + 8, gy + 6, 8, 8, INK); px(c, x + 9, gy + 7, 6, 6, '#fff3b0'); px(c, x + 10, gy + 9, 4, 1, '#c9b48a'); px(c, x + 10, gy + 11, 3, 1, '#c9b48a') // danh sách đi chợ
  px(c, x + 11, gy + 5, 2, 2, '#d8333a'); px(c, x + 11, gy + 5, 1, 1, '#ff8a8a')
  px(c, x + 12, gy + 17, 7, 7, INK); px(c, x + 13, gy + 18, 5, 5, '#fbf6ec'); px(c, x + 14, gy + 19, 1, 1, '#e8506a'); px(c, x + 16, gy + 19, 1, 1, '#e8506a'); px(c, x + 14, gy + 20, 3, 1, '#e8506a'); px(c, x + 15, gy + 21, 1, 1, '#e8506a') // tranh trái tim
  px(c, x + 17, gy + 16, 2, 2, '#5b8bd9')
  px(c, x + 9, gy + 22, 2, 2, '#7fb34d')
  // chân tủ: lưới tản nhiệt + chân
  const ky = y + h - 6
  px(c, x + 1, ky, w - 2, 1, INK); px(c, x + 2, ky + 1, w - 4, 3, IRON); for (let k = x + 3; k < x + w - 3; k += 2) px(c, k, ky + 2, 1, 1, IRON_D)
  px(c, x + 2, ky + 1, w - 4, 1, IRON_L)
  px(c, x + 1, y + h - 2, 3, 2, INK); px(c, x + w - 4, y + h - 2, 3, 2, INK)
  // trên nóc: giỏ mây có bánh mì + chậu dương xỉ rủ
  const ty = y
  px(c, x + 2, ty - 4, 11, 4, INK)
  for (let k = 0; k < 9; k++) px(c, x + 3 + k, ty - 3, 1, 3, k % 2 ? CZ.w3 : CZ.w4)
  px(c, x + 3, ty - 2, 9, 1, CZ.w2)
  px(c, x + 4, ty - 7, 8, 3, INK); px(c, x + 5, ty - 6, 6, 2, '#e3a24c'); px(c, x + 6, ty - 7, 4, 1, '#f6cf86'); px(c, x + 6, ty - 6, 1, 1, '#b9762e'); px(c, x + 9, ty - 6, 1, 1, '#b9762e')
  px(c, x + 15, ty - 4, 5, 4, INK); px(c, x + 16, ty - 3, 3, 3, '#d9744a'); px(c, x + 16, ty - 3, 1, 3, '#ec9a6c')
  const fern = ['#4e7f2e', '#6aa84f', '#9ccf6a']
  for (const [dx, dy, k] of [[14, -6, 1], [16, -8, 2], [18, -7, 1], [20, -5, 0], [13, -5, 0], [21, -3, 1], [21, -1, 0], [17, -6, 0]] as const) px(c, x + dx, ty + dy, 2, 1, fern[k])
  px(c, x + 22, ty + 1, 1, 3, fern[0]); px(c, x + 22, ty + 4, 1, 1, fern[1]) // lá rủ xuống
}

/** đồ trên mặt quầy: thớt + dao + rau đã thái, hũ đựng muôi, giá úp đĩa, ấm đun nước */
function counterTop(c: Ctx) {
  // thớt gỗ có tay cầm
  const [bx, by] = KANCHOR.plate
  px(c, bx - 12, by - 2, 24, 4, INK)
  px(c, bx - 11, by - 2, 2, 2, '#d9ac6c'); px(c, bx - 11, by - 1, 1, 1, INK) // tay cầm có lỗ treo
  px(c, bx - 9, by - 2, 20, 1, '#f2d39c'); px(c, bx - 9, by - 1, 20, 1, '#e3b878'); px(c, bx - 9, by, 20, 1, '#b98552')
  for (const [gx, gy, gw] of [[bx - 6, by - 1, 4], [bx + 3, by - 2, 3], [bx + 6, by - 1, 3]] as const) px(c, gx, gy, gw, 1, '#d4a464')
  // hành lá + cà rốt thái
  for (const dx of [-8, -6]) { px(c, bx + dx, by - 3, 1, 1, INK); px(c, bx + dx, by - 2, 1, 1, '#7fb34d') }
  px(c, bx - 7, by - 2, 1, 1, '#b5e07a')
  px(c, bx - 4, by - 3, 2, 1, INK); px(c, bx - 4, by - 2, 2, 1, '#f08a3a')
  // dao thái
  px(c, bx, by - 3, 6, 2, INK); px(c, bx + 1, by - 3, 4, 1, STEEL); px(c, bx + 1, by - 3, 2, 1, STEEL_L)
  px(c, bx + 6, by - 3, 3, 2, INK); px(c, bx + 6, by - 3, 2, 1, CZ.w1)

  // hũ sứ đựng muôi đũa trên cánh quầy trái
  const jx = 8
  px(c, jx + 1, Y - 13, 1, 8, INK); px(c, jx + 1, Y - 12, 1, 7, CZ.w4); px(c, jx, Y - 15, 3, 3, INK); px(c, jx + 1, Y - 14, 1, 2, CZ.w3) // muỗng gỗ
  px(c, jx + 4, Y - 14, 1, 9, INK); px(c, jx + 4, Y - 13, 1, 8, CZ.w3); px(c, jx + 3, Y - 16, 3, 3, INK); px(c, jx + 4, Y - 15, 1, 2, STEEL) // xẻng
  px(c, jx + 6, Y - 12, 1, 7, '#c9875a'); px(c, jx + 7, Y - 13, 1, 8, '#c9875a') // đũa
  px(c, jx - 1, Y - 7, 11, 7, INK)
  px(c, jx, Y - 6, 9, 5, '#f4ead4'); px(c, jx, Y - 4, 9, 1, '#5b8bd9'); px(c, jx, Y - 6, 2, 4, '#ffffff'); px(c, jx + 7, Y - 6, 2, 5, '#d8cbb0')
  px(c, jx - 1, Y - 1, 11, 1, SHADOW(0.25))
  // chai nước mắm / xì dầu
  px(c, jx + 11, Y - 9, 3, 2, INK); px(c, jx + 10, Y - 7, 5, 7, INK); px(c, jx + 11, Y - 6, 3, 5, '#9a4a1c'); px(c, jx + 11, Y - 6, 1, 4, '#c8743a'); px(c, jx + 11, Y - 4, 3, 2, '#f4ead4')

  // giá gỗ úp đĩa cuối quầy phải (đĩa đứng nhìn chính diện)
  const rx = 148
  for (let i = 0; i < 3; i++) {
    const pcx = rx + 4 + i * 3, pcy = Y - 6 + (i % 2)
    const rim = ['#5b8bd9', '#db6c54', '#5b8bd9'][i]
    disc(c, pcx, pcy, 5, INK); disc(c, pcx, pcy, 4, rim); disc(c, pcx, pcy, 3, '#fbf6ec'); disc(c, pcx, pcy, 1, '#efe6d2')
    px(c, pcx - 2, pcy - 2, 1, 1, '#ffffff'); px(c, pcx + 2, pcy + 1, 1, 1, '#e3d8c0')
  }
  px(c, rx - 1, Y - 4, 17, 4, INK); px(c, rx, Y - 4, 15, 1, CZ.w5); px(c, rx, Y - 3, 15, 1, CZ.w3); px(c, rx, Y - 2, 15, 1, CZ.w2)
  for (const k of [rx + 3, rx + 7, rx + 11]) px(c, k, Y - 3, 1, 2, CZ.w1)
  px(c, rx - 1, Y - 1, 17, 1, SHADOW(0.3))
  // chồng bát sứ
  const bx2 = 165
  for (let i = 0; i < 3; i++) {
    const yy = Y - 3 - i * 2
    px(c, bx2, yy - 1, 10, 1, INK); px(c, bx2 + 1, yy, 8, 1, INK); px(c, bx2 + 1, yy - 1, 8, 1, i === 2 ? '#fbf6ec' : '#f1ead8')
    px(c, bx2 + 2, yy, 6, 1, '#5b8bd9'); px(c, bx2 + 1, yy - 1, 2, 1, '#ffffff')
  }
  px(c, bx2 + 2, Y - 1, 6, 1, INK); px(c, bx2 + 1, Y - 2, 8, 1, INK); px(c, bx2 + 2, Y - 2, 6, 1, '#d8cbb0')
  px(c, bx2, Y - 1, 10, 1, SHADOW(0.3))
}

/** lớp sau: tường hông + tường sau (Yến đứng trước lớp này, sau quầy) */
export function drawKitchenBack(c: Ctx, dayFrac: number, rainy: boolean) {
  const q = Math.round(dayFrac * 64)
  c.drawImage(layer('back', `${q}:${rainy}`, KART_W, Y, (cc) => {
    sideWalls(cc)
    cc.save(); cc.translate(KOX, 0); backWall(cc, q / 64, rainy); cc.restore()
  }), 0, 0)
}
/** lớp trước: quầy gỗ (giống quầy nước) + bếp gas + tủ lạnh + đồ trên quầy + sàn */
export function drawKitchenFront(c: Ctx, premise: number, extraFloor = 0) {
  c.drawImage(layer('front', `${premise}`, KART_W, FLOOR_Y, (cc) => {
    cc.save(); cc.translate(KOX, 0); drawCounter(cc); cc.restore()
    drawCounterWings(cc, KOX, KART_W, premise)
    stove(cc)
    fridge(cc)
    counterTop(cc)
  }), 0, 0)
  drawFloor(c, FLOOR_Y, KART_H - FLOOR_Y + extraFloor, premise, KART_W) // extraFloor: bếp mở rộng xuống dưới khi màn hình dư chỗ
}

// ---------- đồ trên phần sàn mở rộng ----------
/** vị trí thảm trước bếp (dùng cho cả quầng ấm khi đang nấu) */
export function kitchenMat(extra: number) {
  const fh = KART_H - FLOOR_Y + extra
  return { cx: 89, y: FLOOR_Y + 3 + Math.round(fh * 0.1), h: 7 + Math.round(fh * 0.12) }
}
/** thảm dệt trước bếp gas, thùng gỗ rau củ (trái), bao gạo (phải) – vẽ 1 lần vào canvas phụ */
export function drawKitchenFloorProps(c: Ctx, extra: number) {
  const H = KART_H + extra
  c.drawImage(layer('floorProps', `${extra}`, KART_W, H, (cc) => paintFloorProps(cc, extra)), 0, 0)
}
function paintFloorProps(c: Ctx, extra: number) {
  const fh = KART_H - FLOOR_Y + extra
  // --- thảm dệt hoa văn (hình thang phối cảnh) ---
  const m = kitchenMat(extra)
  const RED = '#b8443a', RED_D = '#8e3a30', CREAM = '#ecd3a0', CREAM_D = '#d8b880', TEAL = CZ.t2
  const halfAt = (y: number) => 20 + Math.round((y / m.h) * 4)
  for (let x = -21; x <= 21; x += 2) px(c, m.cx + x, m.y - 1, 1, 1, CREAM_D) // tua sau
  const mid = Math.floor(m.h / 2)
  for (let y = 0; y < m.h; y++) {
    const hw = halfAt(y), yy = m.y + y
    px(c, m.cx - hw - 1, yy, hw * 2 + 2, 1, INK)
    if (y === 0 || y === m.h - 1) continue
    px(c, m.cx - hw, yy, hw * 2, 1, RED_D)
    if (y === 1 || y === m.h - 2) continue
    px(c, m.cx - hw + 1, yy, hw * 2 - 2, 1, y === 2 || y === m.h - 3 ? TEAL : CREAM)
    if (y > 2 && y < m.h - 3) {
      for (let x = -hw + 2; x < hw - 2; x++) {
        const k = Math.abs(((x + 400) % 8) - 4) + Math.abs(y - mid)
        if (k <= 1) px(c, m.cx + x, yy, 1, 1, k === 0 ? CZ.b1 : RED)
        else if (k === 2) px(c, m.cx + x, yy, 1, 1, RED_D)
        else if ((x + y) % 2 === 0 && k === 4) px(c, m.cx + x, yy, 1, 1, CREAM_D)
      }
    }
  }
  const fy2 = m.y + m.h
  const hwB = halfAt(m.h)
  for (let x = -hwB + 1; x < hwB; x += 2) { px(c, m.cx + x, fy2, 1, 2, '#f4e4c0'); px(c, m.cx + x, fy2 + 2, 1, 1, CREAM_D) } // tua trước
  px(c, m.cx - hwB, fy2, hwB * 2, 1, SHADOW(0.12))

  // --- thùng gỗ rau củ ---
  const cw = 24, cx = 9
  const cb = FLOOR_Y + Math.min(fh - 3, Math.round(fh * 0.78)) // đáy thùng
  const ct = cb - 10 // mép trên mặt trước
  // bóng đổ
  px(c, cx - 1, cb + 1, cw + 4, 1, SHADOW(0.3)); px(c, cx + 1, cb + 2, cw, 1, SHADOW(0.15))
  // miệng thùng: thành sau + lòng thùng tối
  px(c, cx, ct - 4, cw, 5, INK); px(c, cx + 1, ct - 3, cw - 2, 1, '#dcae78'); px(c, cx + 1, ct - 2, cw - 2, 2, '#4a3020')
  // rau củ chất đầy (sau → trước)
  for (const [dx, len] of [[13, 6], [16, 5]] as const) { // cà rốt chéo, ngọn xanh
    const x0 = cx + dx, y0 = ct
    for (let k = 0; k < len; k++) px(c, x0 + k - 1, y0 - k - 1, 3, 3, INK)
    for (let k = 0; k < len; k++) { px(c, x0 + k, y0 - k, 1, 1, '#d8641e'); px(c, x0 + k, y0 - k - 1, 1, 1, '#f5944a') }
    const tx = x0 + len, ty = y0 - len
    px(c, tx, ty - 3, 1, 3, '#4e7f2e'); px(c, tx + 1, ty - 2, 2, 1, '#6aa84f'); px(c, tx - 1, ty - 4, 1, 2, '#6aa84f'); px(c, tx + 2, ty - 4, 1, 2, '#9ccf6a')
  }
  fruit(c, cx + 7, ct - 5, 5, '#7fb34d', '#c4e88a', '#4e7f2e') // bắp cải
  px(c, cx + 7, ct - 9, 1, 6, '#c4e88a'); px(c, cx + 5, ct - 7, 1, 3, '#5e9a3a'); px(c, cx + 9, ct - 7, 1, 3, '#5e9a3a'); px(c, cx + 4, ct - 4, 1, 2, '#5e9a3a'); px(c, cx + 10, ct - 4, 1, 2, '#5e9a3a')
  fruit(c, cx + 14, ct - 2, 2, '#e8443a', '#ffb0a0', '#a82a26') // cà chua
  px(c, cx + 13, ct - 5, 3, 1, '#4e7f2e'); px(c, cx + 14, ct - 6, 1, 1, '#4e7f2e')
  fruit(c, cx + 20, ct - 2, 2, '#9a4a7a', '#d896c0', '#6a2a50') // hành tím
  px(c, cx + 20, ct - 6, 1, 2, '#c9a07a')
  fruit(c, cx + 3, ct - 1, 2, '#f2c14e', '#fff1a8', '#c8902a') // chanh vàng
  // mặt trước: 2 thanh ván + cột góc + đinh
  px(c, cx, ct, cw, cb - ct + 1, INK)
  for (const [sy, sh] of [[ct + 1, 4], [ct + 6, 4]] as const) {
    px(c, cx + 1, sy, cw - 2, sh, '#c08a58'); px(c, cx + 1, sy, cw - 2, 1, '#dcae78'); px(c, cx + 1, sy + sh - 1, cw - 2, 1, '#9a6a42')
    for (let gx = cx + 5; gx < cx + cw - 3; gx += 6) px(c, gx, sy + 1 + (gx % 2), 2, 1, '#ad7a4a') // vân gỗ
  }
  px(c, cx + 1, ct + 5, cw - 2, 1, '#3a2418')
  for (const px0 of [cx + 1, cx + cw - 3]) { px(c, px0, ct + 1, 2, cb - ct - 1, '#9a6a42'); px(c, px0, ct + 1, 1, cb - ct - 1, '#b07b52'); px(c, px0, ct + 2, 1, 1, CZ.b1); px(c, px0, ct + 7, 1, 1, CZ.b1) }
  px(c, cx + 9, ct + 2, 6, 2, '#3a2418'); px(c, cx + 9, ct + 2, 6, 1, INK) // lỗ tay cầm

  // --- bao gạo bố mở miệng, gạo trắng đầy + gáo gỗ ---
  const sx = KART_W - 25, sb = FLOOR_Y + Math.min(fh - 3, Math.round(fh * 0.72)) // tâm x, đáy bao
  const prof = [8, 8, 8, 7, 7, 8, 8, 8, 9, 9, 9, 9, 9, 8, 6] // nửa bề rộng từ miệng xuống đáy
  const st = sb - prof.length + 1
  px(c, sx - 10, sb + 1, 21, 1, SHADOW(0.3)); px(c, sx - 8, sb + 2, 17, 1, SHADOW(0.14))
  // gạo nhô lên miệng bao
  for (const [dy, hw] of [[-3, 3], [-2, 5], [-1, 6]] as const) { px(c, sx - hw - 1, st + dy, hw * 2 + 3, 1, INK); px(c, sx - hw, st + dy, hw * 2 + 1, 1, '#f7f1e2') }
  px(c, sx - 2, st - 3, 3, 1, '#ffffff'); px(c, sx - 4, st - 2, 2, 1, '#ffffff'); px(c, sx + 2, st - 1, 4, 1, '#e2d8c2'); px(c, sx + 3, st - 2, 1, 1, '#e2d8c2')
  // gáo gỗ cắm trong gạo
  px(c, sx + 2, st - 8, 2, 2, INK); px(c, sx + 3, st - 7, 2, 2, INK); px(c, sx + 4, st - 6, 2, 2, INK); px(c, sx + 5, st - 5, 2, 3, INK)
  px(c, sx + 2, st - 8, 1, 1, CZ.w4); px(c, sx + 3, st - 7, 1, 1, CZ.w3); px(c, sx + 4, st - 6, 1, 1, CZ.w3)
  for (let r = 0; r < prof.length; r++) {
    const hw = prof[r], y = st + r
    px(c, sx - hw - 1, y, hw * 2 + 3, 1, INK)
    if (r === prof.length - 1) { px(c, sx - hw + 1, y, hw * 2 - 1, 1, '#a88c5e'); continue }
    if (r < 3) { // mép bao bẻ gập
      px(c, sx - hw, y, hw * 2 + 1, 1, r === 0 ? '#f2e4c2' : '#e2cfa4')
      if (r === 2) px(c, sx - hw, y, hw * 2 + 1, 1, '#b89e70')
      continue
    }
    px(c, sx - hw, y, hw * 2 + 1, 1, '#d9c49a')
    px(c, sx - hw, y, 2, 1, '#ecdcb6'); px(c, sx + hw - 1, y, 2, 1, '#b89e70')
    for (let x = -hw + 2 + (r % 2); x < hw - 1; x += 3) px(c, sx + x, y, 1, 1, '#c9b183') // sợi bố
  }
  // sọc in đỏ + xanh và bông lúa
  const ly = st + 6
  px(c, sx - 8, ly, 17, 1, '#b8443a'); px(c, sx - 9, ly + 5, 19, 1, '#3f6aaf')
  px(c, sx - 3, ly + 1, 7, 4, '#f6ead0')
  px(c, sx, ly + 1, 1, 4, '#9a7a2a'); px(c, sx - 1, ly + 1, 1, 2, '#d9a92e'); px(c, sx + 1, ly + 1, 1, 2, '#d9a92e'); px(c, sx - 2, ly + 2, 1, 1, '#d9a92e'); px(c, sx + 2, ly + 2, 1, 1, '#d9a92e')
  // gạo vương dưới chân
  for (const [dx, dy] of [[-11, 0], [-12, 1], [-14, 1], [-10, 1], [11, 1]] as const) px(c, sx + dx, sb + dy, 1, 1, '#fbf6ec')
}

// ---------- đồ động ----------
export function drawPan(c: Ctx) {
  const [x, y] = KANCHOR.panIn
  px(c, x - 14, y - 1, 8, 3, INK); px(c, x - 13, y, 6, 1, CZ.w2); px(c, x - 13, y, 4, 1, CZ.w3); px(c, x - 8, y, 1, 1, STEEL) // cán gỗ + đinh tán
  px(c, x - 6, y - 1, 13, 1, INK); px(c, x - 7, y, 15, 2, INK); px(c, x - 6, y + 2, 13, 1, INK)
  px(c, x - 6, y, 13, 2, IRON); px(c, x - 5, y, 11, 1, IRON_D); px(c, x - 6, y + 1, 4, 1, IRON_LL); px(c, x + 3, y + 1, 3, 1, IRON_L)
}
export function drawPot(c: Ctx) {
  const [x, y] = KANCHOR.potIn
  box(c, x - 7, y, 15, 8, STEEL, INK)
  px(c, x - 6, y + 2, 1, 5, STEEL_L); px(c, x - 5, y + 2, 1, 5, '#dde3e7'); px(c, x - 3, y + 3, 1, 3, '#ffffff')
  px(c, x + 4, y + 2, 1, 5, STEEL_D); px(c, x + 5, y + 2, 1, 5, '#767e86')
  px(c, x - 6, y + 6, 12, 1, STEEL_D)
  px(c, x - 8, y, 17, 1, INK); px(c, x - 9, y + 2, 2, 2, INK); px(c, x + 8, y + 2, 2, 2, INK)
}
export function drawBowl(c: Ctx) {
  const [x, y] = KANCHOR.bowl
  px(c, x - 8, y - 4, 17, 1, INK)
  for (let r = 0; r < 4; r++) { px(c, x - 8 + r, y - 3 + r, 17 - r * 2, 1, INK); if (r < 3) px(c, x - 7 + r, y - 3 + r, 15 - r * 2, 1, r === 1 ? '#5b8bd9' : '#fbf6ec') }
  px(c, x - 6, y - 3, 2, 1, '#ffffff'); px(c, x + 4, y - 1, 2, 1, '#d8cbb0')
}
export function drawPlate(c: Ctx) {
  const [x, y] = KANCHOR.plate
  px(c, x - 7, y - 3, 14, 1, INK); px(c, x - 8, y - 2, 16, 1, INK); px(c, x - 7, y - 2, 14, 1, '#fbf6ec'); px(c, x - 6, y - 2, 3, 1, '#ffffff')
}
