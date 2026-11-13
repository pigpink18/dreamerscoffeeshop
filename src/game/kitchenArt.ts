// Cảnh khu bếp – cùng khung, cùng cỡ điểm ảnh và bảng màu với cảnh quầy (CounterScene):
// tường sau 128 rộng ở giữa, 2 tường hông phối cảnh (cửa bếp có ô kính tròn bên trái, giá treo nồi chảo bên phải),
// quầy gỗ ô panel xanh rêu kéo dài 2 bên, dải sàn gỗ hội tụ phía trước. Toạ độ: cả khung KART_W x KART_H.
import { px, box, CZ, SCENE_W, COUNTER_Y, woodFrame, woodShelf, glassJar, brassLamp, drawCounter, sky, mixWeighted, type Ctx } from './pixel'
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

const STEEL = '#c3cad0', STEEL_D = '#8f979e', STEEL_L = '#eef2f4', IRON = '#3a3e45', IRON_D = '#23262b'
const COPPER = '#c8784a', COPPER_L = '#e8a070', COPPER_D = '#8e4a2a'

// ---------- tường hông phối cảnh ----------
function sideWalls(c: Ctx) {
  for (const side of [0, 1] as const) {
    for (let i = 0; i < KOX; i++) {
      const x = side === 0 ? KOX - 1 - i : KOX + SCENE_W + i
      const d = (i + 1) / KOX
      const yTrim = Math.round(persp(3, d)), yTile = Math.round(persp(43, d))
      px(c, x, 0, 1, Y, '#f0dcb4')
      if (i % 5 === 2) px(c, x, 0, 1, yTile, '#e6cb9c')
      px(c, x, Math.max(0, yTrim - 3), 1, 3, CZ.w1)
      // gạch men xanh ốp tường bếp (mạch gạch toả theo phối cảnh)
      px(c, x, yTile, 1, Y - yTile, CZ.t2)
      for (let k = 0; k < 4; k++) { const yy = Math.round(persp(47 + k * 4, d)); if (yy < Y) px(c, x, yy, 1, 1, CZ.t0) }
      if (i % 4 === 0) px(c, x, yTile, 1, Y - yTile, CZ.t1)
      c.fillStyle = `rgba(38, 28, 27, ${(0.06 + 0.18 * d).toFixed(3)})`; c.fillRect(x, 0, 1, Y)
    }
    const cx = side === 0 ? KOX - 1 : KOX + SCENE_W
    px(c, cx, 0, 1, Y, 'rgba(38, 28, 27, 0.35)')
  }
  // trái: cửa bếp gỗ 2 chiều, ô kính tròn nhìn ra quán
  sideRect(KOX, 0, 5, 19, 12, 62, (x, y0, y1, u) => {
    px(c, x, y0, 1, y1 - y0, u < 0.08 || u > 0.92 ? CZ.ink : u < 0.16 || u > 0.84 ? CZ.w1 : CZ.w2)
    px(c, x, y0, 1, 1, CZ.ink)
    if (u > 0.3 && u < 0.7) { const m = Math.round(y0 + (y1 - y0) * 0.22), r = Math.round((y1 - y0) * 0.1 * Math.sin(((u - 0.3) / 0.4) * Math.PI)); px(c, x, m - r - 1, 1, r * 2 + 3, CZ.ink); if (r > 0) px(c, x, m - r, 1, r * 2 + 1, '#ffe7b0') }
    if (u > 0.2 && u < 0.8) px(c, x, Math.round(y0 + (y1 - y0) * 0.62), 1, 1, CZ.b1) // tấm đồng đẩy cửa
  })
  // phải: thanh treo nồi chảo đồng
  sideRect(KOX, 1, 3, 21, 14, 15, (x, y0) => { px(c, x, y0, 1, 1, CZ.ink); px(c, x, y0 + 1, 1, 1, CZ.b0) })
  for (const [i0, i1, len, kind] of [[4, 8, 12, 0], [9, 14, 9, 1], [15, 20, 13, 0]] as const) {
    sideRect(KOX, 1, i0, i1, 16, 16 + len, (x, y0, y1, u) => {
      const mid = Math.abs(u - 0.5) < 0.15
      if (mid) px(c, x, y0, 1, Math.round((y1 - y0) * 0.45), CZ.ink) // cán treo
      const top = Math.round(y0 + (y1 - y0) * 0.45)
      if (kind === 0) { px(c, x, top, 1, y1 - top, CZ.ink); if (u > 0.1 && u < 0.9) px(c, x, top + 1, 1, y1 - top - 2, u < 0.35 ? COPPER_L : COPPER) }
      else { px(c, x, top, 1, y1 - top, CZ.ink); if (u > 0.1 && u < 0.9) px(c, x, top + 1, 1, y1 - top - 2, u < 0.35 ? '#6b7380' : IRON) }
    })
  }
  // kệ gia vị nhỏ trên tường phải
  sideRect(KOX, 1, 4, 20, 38, 40, (x, y0) => { px(c, x, y0, 1, 2, CZ.w3); px(c, x, y0 + 2, 1, 1, CZ.w1) })
  sideRect(KOX, 1, 6, 18, 31, 38, (x, y0, y1, u) => { if ((u * 3) % 1 < 0.6) px(c, x, y0, 1, y1 - y0, ['#7fb34d', '#d8333a', '#e0a03a'][Math.floor(u * 3) % 3]) })
}

// ---------- tường sau (toạ độ cảnh gốc 128, đã dịch KOX) ----------
function backWall(c: Ctx, dayFrac: number, rainy: boolean) {
  // tường vữa kem sọc như quầy
  px(c, 0, 0, SCENE_W, Y, '#f0dcb4')
  for (let x = 0; x < SCENE_W; x += 8) px(c, x, 0, 1, 43, '#e6cb9c')
  for (let r = 0; r < 7; r++) for (let x = 4 + (r % 2) * 4; x < SCENE_W; x += 8) px(c, x, 6 + r * 6, 1, 1, '#dcbd8a')
  px(c, 0, 0, SCENE_W, 2, CZ.w1); px(c, 0, 2, SCENE_W, 1, CZ.w3); px(c, 0, 3, SCENE_W, 1, 'rgba(38,28,27,0.18)')
  // gạch men xanh rêu ốp sau bếp + nẹp gỗ
  px(c, 0, 43, SCENE_W, 1, CZ.ink); px(c, 0, 44, SCENE_W, 1, CZ.w5); px(c, 0, 45, SCENE_W, 1, CZ.w3); px(c, 0, 46, SCENE_W, 1, CZ.w1)
  px(c, 0, 47, SCENE_W, Y - 47, CZ.t2)
  for (let r = 0; r < 4; r++) {
    px(c, 0, 47 + r * 4, SCENE_W, 1, CZ.t1)
    for (let x = (r % 2) * 4; x < SCENE_W; x += 8) px(c, x, 48 + r * 4, 1, 3, CZ.t1)
    for (let x = (r % 2) * 4 + 1; x < SCENE_W; x += 8) px(c, x, 48 + r * 4, 2, 1, CZ.t3)
  }
  // cửa sổ nhỏ khung gỗ (trời theo giờ trong ngày)
  const wx = 96, wy = 8, ww = 24, wh = 20
  woodFrame(c, wx, wy, ww, wh)
  const [st, sb] = sky(dayFrac, rainy)
  for (let i = 0; i < wh; i++) px(c, wx, wy + i, ww, 1, mixWeighted(st, sb, i / wh))
  for (let i = 0; i < 3; i++) { const by = wy + wh - 6 - ((i * 3) % 4); px(c, wx + i * 8, by, 8, 8, ['#c9a68a', '#b58e74', '#d6b89c'][i]); px(c, wx + i * 8, by - 1, 8, 2, i % 2 ? CZ.r1 : CZ.r0) }
  px(c, wx + ww / 2 - 1, wy, 3, wh, CZ.ink); px(c, wx + ww / 2, wy, 1, wh, CZ.w3)
  px(c, wx - 4, wy + wh + 3, ww + 8, 3, CZ.ink); px(c, wx - 3, wy + wh + 3, ww + 6, 1, CZ.w5); px(c, wx - 3, wy + wh + 4, ww + 6, 1, CZ.w3)
  // chậu rau thơm trên bậu cửa
  for (const [x, col] of [[wx + 2, '#6aa84f'], [wx + 10, '#7fb34d'], [wx + 18, '#4e7f2e']] as const) { box(c, x, wy + wh - 1, 5, 5, '#d9744a'); px(c, x + 1, wy + wh - 5, 3, 4, col); px(c, x + 2, wy + wh - 6, 1, 1, col) }
  // kệ gỗ + hũ thuỷ tinh (bên trái)
  woodShelf(c, 26, 22, 30)
  ;['#f2c14e', '#9a5b34', '#e8506a', '#7fb34d'].forEach((j, i) => glassJar(c, 28 + i * 7, 14, j))
  // thanh nam châm treo dao + muôi
  px(c, 28, 32, 26, 2, CZ.ink); px(c, 29, 32, 24, 1, CZ.w3)
  for (const [x, l] of [[31, 7], [36, 6], [41, 8], [47, 6]] as const) { px(c, x, 34, 1, 2, CZ.ink); px(c, x - 1, 36, 3, l, l > 7 ? STEEL : STEEL_D); px(c, x - 1, 36, 1, l, STEEL_L) }
  // máy hút mùi chao đồng (giữa, trên bếp)
  const hx = 64
  box(c, hx - 5, -1, 10, 16, COPPER, CZ.ink); px(c, hx - 4, 0, 2, 14, COPPER_L); px(c, hx + 2, 0, 2, 14, COPPER_D)
  for (let r = 0; r < 14; r++) {
    const w = 10 + r * 2
    px(c, hx - w / 2 - 1, 15 + r, w + 2, 1, CZ.ink)
    px(c, hx - w / 2, 15 + r, w, 1, r < 2 ? COPPER_L : COPPER)
    px(c, hx - w / 2, 15 + r, 2, 1, COPPER_L); px(c, hx + w / 2 - 2, 15 + r, 2, 1, COPPER_D)
  }
  px(c, hx - 21, 29, 42, 3, CZ.ink); px(c, hx - 20, 29, 40, 1, CZ.b1); px(c, hx - 20, 30, 40, 1, CZ.b0)
  for (const x of [hx - 14, hx + 12]) px(c, x, 32, 3, 1, '#fff3b0') // đèn dưới chụp
  c.fillStyle = 'rgba(255,226,150,0.10)'; c.beginPath(); c.moveTo(hx - 18, 32); c.lineTo(hx + 18, 32); c.lineTo(hx + 26, 62); c.lineTo(hx - 26, 62); c.fill()
  // đèn thả chao đồng (như quầy)
  brassLamp(c, 12, 10)
}

/** bếp gas gang âm quầy + lò nướng (toạ độ cả khung) */
function stove(c: Ctx) {
  const x0 = 74, w = 30
  // mặt bếp gang
  px(c, x0 - 1, Y - 2, w + 2, 1, CZ.ink); px(c, x0, Y - 1, w, 5, IRON); px(c, x0, Y - 1, w, 1, '#5a606a')
  for (const [bx] of [KANCHOR.burnerL, KANCHOR.burnerR]) { px(c, bx - 4, Y, 9, 2, IRON_D); px(c, bx - 2, Y, 5, 1, '#d8333a') }
  // mặt trước: núm vặn đồng + cửa lò kính
  px(c, x0, Y + 4, w, 1, CZ.ink); px(c, x0, Y + 5, w, 26, IRON); px(c, x0, Y + 5, w, 1, '#5a606a')
  for (let i = 0; i < 4; i++) { px(c, x0 + 4 + i * 7, Y + 7, 3, 3, CZ.ink); px(c, x0 + 5 + i * 7, Y + 8, 1, 1, CZ.b1) }
  px(c, x0 + 3, Y + 12, w - 6, 15, CZ.ink); px(c, x0 + 4, Y + 13, w - 8, 13, '#2a2420')
  px(c, x0 + 5, Y + 14, w - 10, 2, '#4a3a30'); px(c, x0 + 6, Y + 20, w - 12, 3, 'rgba(255,140,60,0.25)')
  px(c, x0 + 4, Y + 12, w - 8, 1, CZ.b0); px(c, x0 + 6, Y + 11, w - 12, 1, CZ.b1) // tay nắm đồng
  px(c, x0, FLOOR_Y - 2, w, 2, IRON_D)
}
/** tủ lạnh retro xanh mint đứng cuối quầy bên trái */
function fridge(c: Ctx) {
  const x = 26, y = 18, w = 22, h = FLOOR_Y - 18
  box(c, x, y, w, h, CZ.t3, CZ.ink)
  px(c, x + 1, y + 1, w - 2, 2, '#7fc2b8'); px(c, x + 1, y + 1, 2, h - 2, '#7fc2b8'); px(c, x + w - 3, y + 3, 2, h - 4, CZ.t2)
  px(c, x + 1, y + 26, w - 2, 1, CZ.ink); px(c, x + 1, y + 27, w - 2, 1, CZ.t2)
  for (const yy of [y + 14, y + 34]) { px(c, x + 3, yy, 2, 8, CZ.ink); px(c, x + 3, yy + 1, 1, 6, STEEL_L) }
  px(c, x + 8, y + 6, 7, 2, CZ.b1); px(c, x + 8, y + 7, 7, 1, CZ.b0) // logo đồng
  // giấy note + nam châm
  px(c, x + 12, y + 32, 6, 6, '#fff3b0'); px(c, x + 14, y + 31, 2, 2, '#d8333a'); px(c, x + 13, y + 34, 4, 1, '#c9b48a')
}

/** lớp sau: tường hông + tường sau (Yến đứng trước lớp này, sau quầy) */
export function drawKitchenBack(c: Ctx, dayFrac: number, rainy: boolean) {
  sideWalls(c)
  c.save(); c.translate(KOX, 0); backWall(c, dayFrac, rainy); c.restore()
}
/** lớp trước: quầy gỗ (giống quầy nước) + bếp gas + tủ lạnh + thớt + sàn */
export function drawKitchenFront(c: Ctx, premise: number, extraFloor = 0) {
  c.save(); c.translate(KOX, 0); drawCounter(c); c.restore()
  drawCounterWings(c, KOX, KART_W, premise)
  stove(c)
  fridge(c)
  // thớt gỗ + dao (quầy sơ chế)
  const [bx, by] = KANCHOR.plate
  px(c, bx - 9, by - 2, 18, 4, CZ.ink); px(c, bx - 8, by - 2, 16, 2, '#e8c48a'); px(c, bx - 8, by, 16, 1, '#c99a5e')
  // giá úp đĩa cuối quầy phải
  for (let i = 0; i < 3; i++) { px(c, 150 + i * 3, Y - 9 + i, 3, 9 - i, CZ.ink); px(c, 151 + i * 3, Y - 8 + i, 1, 7 - i, '#fbf6ec') }
  px(c, 148, Y - 1, 12, 1, STEEL_D)
  drawFloor(c, FLOOR_Y, KART_H - FLOOR_Y + extraFloor, premise, KART_W) // extraFloor: bếp mở rộng xuống dưới khi màn hình dư chỗ
}

// ---------- đồ động ----------
export function drawPan(c: Ctx) {
  const [x, y] = KANCHOR.panIn
  px(c, x - 14, y, 8, 2, CZ.ink); px(c, x - 13, y, 6, 1, CZ.w1) // cán gỗ
  px(c, x - 6, y - 1, 13, 1, CZ.ink); px(c, x - 7, y, 15, 2, CZ.ink); px(c, x - 6, y + 2, 13, 1, CZ.ink)
  px(c, x - 6, y, 13, 2, IRON); px(c, x - 5, y, 11, 1, IRON_D)
}
export function drawPot(c: Ctx) {
  const [x, y] = KANCHOR.potIn
  box(c, x - 7, y, 15, 8, STEEL, CZ.ink)
  px(c, x - 6, y + 2, 1, 5, STEEL_L); px(c, x + 5, y + 2, 1, 5, STEEL_D)
  px(c, x - 8, y, 17, 1, CZ.ink); px(c, x - 9, y + 2, 2, 2, CZ.ink); px(c, x + 8, y + 2, 2, 2, CZ.ink)
}
export function drawBowl(c: Ctx) {
  const [x, y] = KANCHOR.bowl
  px(c, x - 8, y - 4, 17, 1, CZ.ink)
  for (let r = 0; r < 4; r++) { px(c, x - 8 + r, y - 3 + r, 17 - r * 2, 1, CZ.ink); if (r < 3) px(c, x - 7 + r, y - 3 + r, 15 - r * 2, 1, r === 1 ? '#5b8bd9' : '#fbf6ec') }
}
export function drawPlate(c: Ctx) {
  const [x, y] = KANCHOR.plate
  px(c, x - 7, y - 3, 14, 1, CZ.ink); px(c, x - 8, y - 2, 16, 1, CZ.ink); px(c, x - 7, y - 2, 14, 1, '#fbf6ec')
}
