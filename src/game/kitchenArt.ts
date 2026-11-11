// Cảnh khu bếp vẽ pixel 2D bằng code (bố cục tham khảo bộ KayKit Restaurant Bits, không dùng ảnh 3D).
// Không gian vẽ KART_W x KART_H. Lớp sau (tường, tủ treo, máy hút mùi, cửa sổ) và lớp trước (tủ lạnh, quầy,
// bếp gas, bồn rửa) tách riêng để Yến đứng kẹp giữa. Hai lớp tĩnh được vẽ 1 lần vào canvas phụ rồi dùng lại.
import { px, box, shade, OUT, type Ctx } from './pixel'

export const KART_W = 256
export const KART_H = 134
/** điểm neo (toạ độ cảnh) cho lửa, chảo, nồi, tô, đĩa, khuôn waffle */
export const KANCHOR = {
  burnerL: [117, 80],
  burnerR: [141, 80],
  panIn: [117, 77],
  potIn: [141, 72],
  bowl: [166, 81],
  plate: [76, 80],
  waffle: [190, 86],
} as const satisfies Record<string, readonly [number, number]>

// bảng màu bếp
const WALL = '#efd2ac', WALL_D = '#e2bf94', TEAL = '#3fae97', TEAL_D = '#2f8a78', TEAL_L = '#5cc4ac'
const TOP = '#e2763a', TOP_D = '#b9542a', TOP_L = '#f2955a'
const CAB = '#f4f1ea', CAB_D = '#d6d0c4', KNOB = '#d4682f'
const STEEL = '#c3cad0', STEEL_D = '#8f979e', STEEL_L = '#eef2f4', IRON = '#4a4f57', IRON_D = '#2b2f35'
const FRIDGE = '#4fd0a8', FRIDGE_D = '#2f9e80', FRIDGE_L = '#8ff0cf'
export const COUNTER_Y = 76 // mép trên mặt quầy
const FRONT_Y = 84 // mép trước mặt quầy (bắt đầu cánh tủ)
const FLOOR_Y = 112

const cache: Partial<Record<'back' | 'front', HTMLCanvasElement>> = {}
function cached(k: 'back' | 'front', paint: (c: Ctx) => void) {
  let cv = cache[k]
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = KART_W; cv.height = KART_H
    const c = cv.getContext('2d')!; c.imageSmoothingEnabled = false
    paint(c); cache[k] = cv
  }
  return cv
}
export function drawKitchenBack(c: Ctx) { c.drawImage(cached('back', paintBack), 0, 0) }
export function drawKitchenFront(c: Ctx) { c.drawImage(cached('front', paintFront), 0, 0) }

/** cánh tủ trắng có tay nắm cam */
function door(c: Ctx, x: number, y: number, w: number, h: number, knobX: number, knobY: number) {
  box(c, x, y, w, h, CAB)
  px(c, x + 1, y + 1, w - 2, 1, '#ffffff'); px(c, x + 1, y + h - 2, w - 2, 1, CAB_D)
  px(c, knobX, knobY, 2, 2, KNOB); px(c, knobX, knobY + 2, 2, 1, shade(KNOB, -40))
}
function jar(c: Ctx, x: number, y: number, lid: string, body = '#e8eef0') {
  box(c, x, y + 3, 9, 9, body); px(c, x + 2, y + 5, 1, 4, '#ffffff')
  box(c, x - 1, y, 11, 4, lid); px(c, x, y + 1, 9, 1, shade(lid, 40))
}

// ---------- lớp sau ----------
function paintBack(c: Ctx) {
  // tường kem phía trên + nẹp trần
  px(c, 0, 0, KART_W, 60, WALL)
  for (let x = 6; x < KART_W; x += 16) px(c, x, 4, 1, 54, WALL_D)
  px(c, 0, 0, KART_W, 3, '#f8e6cc'); px(c, 0, 3, KART_W, 1, WALL_D)
  // ốp tường xanh ngọc phía dưới (sau quầy)
  px(c, 0, 60, KART_W, 2, TEAL_L); px(c, 0, 62, KART_W, 20, TEAL)
  for (let x = 0; x < KART_W; x += 12) px(c, x, 62, 1, 20, TEAL_D)
  // sàn caro đen trắng (2 hàng, hàng gần to hơn)
  px(c, 0, FLOOR_Y, KART_W, KART_H - FLOOR_Y, '#2e2e33')
  for (let i = 0; i * 26 < KART_W + 26; i++) {
    px(c, i * 26 - 6 + (i % 2 ? 0 : 13), FLOOR_Y, 13, 9, '#e6e4dc')
    px(c, i * 26 + (i % 2 ? 13 : 0) - 10, FLOOR_Y + 9, 16, KART_H - FLOOR_Y - 9, '#e6e4dc')
  }
  px(c, 0, FLOOR_Y, KART_W, 2, 'rgba(38,28,27,0.35)')
  // tủ treo trắng 2 cánh (trên quầy sơ chế)
  px(c, 56, 4, 50, 2, CAB_D)
  door(c, 56, 6, 25, 42, 76, 40); door(c, 81, 6, 25, 42, 83, 40)
  px(c, 56, 48, 50, 2, 'rgba(38,28,27,0.25)')
  // máy hút mùi inox: ống khói + chụp hình thang
  box(c, 120, -1, 18, 28, STEEL); px(c, 121, 0, 3, 26, STEEL_L); px(c, 134, 0, 3, 26, STEEL_D)
  for (let r = 0; r < 22; r++) {
    const w = 22 + r * 2
    px(c, 129 - w / 2 - 1, 27 + r, w + 2, 1, OUT)
    px(c, 129 - w / 2, 27 + r, w, 1, r < 2 ? STEEL_L : STEEL)
    px(c, 129 - w / 2, 27 + r, 2, 1, STEEL_L); px(c, 129 + w / 2 - 3, 27 + r, 3, 1, STEEL_D)
  }
  box(c, 106, 49, 46, 6, STEEL_D); px(c, 107, 50, 44, 1, STEEL)
  for (const x of [112, 119]) { box(c, x, 50, 5, 4, IRON_D); px(c, x + 1, 51, 2, 1, IRON) } // nút bấm
  px(c, 108, 55, 42, 2, 'rgba(38,28,27,0.2)')
  // kệ gỗ treo: 3 hũ gia vị + cuộn khăn giấy
  jar(c, 160, 22, IRON); jar(c, 172, 23, '#8a4a2a', '#d9b48a'); jar(c, 188, 22, '#4a8ad8')
  box(c, 156, 34, 48, 5, '#9a5a36'); px(c, 157, 35, 46, 1, '#b8744a')
  px(c, 160, 39, 3, 6, '#7a4429'); px(c, 197, 39, 3, 6, '#7a4429')
  box(c, 163, 40, 34, 8, '#fbf6ec'); px(c, 164, 46, 32, 1, CAB_D); px(c, 166, 41, 28, 1, '#ffffff')
  // cửa sổ kính (phải)
  box(c, 210, 22, 44, 40, STEEL_D)
  px(c, 213, 25, 38, 34, '#7cc4e6'); px(c, 213, 25, 38, 6, '#a8dcf2')
  for (let i = 0; i < 3; i++) px(c, 220 + i * 9, 34 - i * 3, 2, 22 - i * 4, 'rgba(255,255,255,0.45)')
  px(c, 213, 58, 38, 1, '#5aa6cc'); px(c, 208, 61, 48, 3, STEEL); px(c, 208, 64, 48, 1, OUT)
}

// ---------- lớp trước ----------
function counter(c: Ctx, x: number, w: number, drawers = false) {
  // mặt quầy cam + gờ ốp sau
  px(c, x, COUNTER_Y - 6, w, 6, TEAL_D); px(c, x, COUNTER_Y - 6, w, 1, TEAL_L)
  px(c, x, COUNTER_Y - 1, w, 1, OUT)
  px(c, x, COUNTER_Y, w, FRONT_Y - COUNTER_Y - 2, TOP); px(c, x, COUNTER_Y, w, 1, TOP_L)
  px(c, x, FRONT_Y - 2, w, 2, TOP_D); px(c, x, FRONT_Y, w, 1, OUT)
  // thân tủ
  px(c, x, FRONT_Y + 1, w, FLOOR_Y - FRONT_Y - 1, CAB_D)
  if (drawers) for (let i = 0; i < 2; i++) door(c, x + 2, FRONT_Y + 3 + i * 12, w - 4, 11, x + w / 2 - 1, FRONT_Y + 7 + i * 12)
  else { door(c, x + 2, FRONT_Y + 3, w / 2 - 2, 24, x + w / 2 - 5, FRONT_Y + 9); door(c, x + w / 2, FRONT_Y + 3, w / 2 - 2, 24, x + w / 2 + 3, FRONT_Y + 9) }
  px(c, x, FLOOR_Y - 2, w, 2, '#3a3a40')
}
function paintFront(c: Ctx) {
  // quầy sơ chế (trái) + thớt, dao, hũ
  counter(c, 54, 52, true)
  jar(c, 58, 63, '#4a8ad8'); jar(c, 69, 63, IRON); jar(c, 92, 62, '#8a4a2a', '#d9b48a')
  box(c, 62, 76, 30, 7, '#e8c48a'); px(c, 63, 77, 28, 1, '#f6dcae'); px(c, 63, 81, 28, 1, '#c99a5e')
  px(c, 70, 78, 13, 1, STEEL_D); px(c, 70, 77, 12, 1, STEEL_L); px(c, 83, 78, 5, 1, IRON_D) // dao
  // bếp gas 4 họng + lò nướng đỏ (giữa)
  const sx = 106, sw = 46
  px(c, sx, COUNTER_Y - 6, sw, 6, STEEL_D); px(c, sx, COUNTER_Y - 6, sw, 1, STEEL)
  box(c, sx, COUNTER_Y - 1, sw, 12, STEEL); px(c, sx + 1, COUNTER_Y, sw - 2, 1, STEEL_L)
  for (const [bx, by] of [[117, 80], [141, 80], [120, 75], [138, 75]]) {
    px(c, bx - 6, by - 1, 12, 3, IRON_D); px(c, bx - 4, by, 8, 1, '#d8333a'); px(c, bx - 1, by, 2, 1, IRON)
  }
  box(c, sx, FRONT_Y + 2, sw, 12, '#9aa2a8'); px(c, sx + 1, FRONT_Y + 3, sw - 2, 1, STEEL)
  for (let i = 0; i < 4; i++) { box(c, sx + 6 + i * 9, FRONT_Y + 5, 6, 6, IRON_D); px(c, sx + 8 + i * 9, FRONT_Y + 6, 2, 2, STEEL_D) }
  box(c, sx, FRONT_Y + 13, sw, FLOOR_Y - FRONT_Y - 13, '#c8323a'); px(c, sx + 1, FRONT_Y + 14, sw - 2, 1, '#e8606a')
  px(c, sx + 4, FRONT_Y + 17, sw - 8, 2, '#8e1f26')
  // quầy giữa (đặt tô mì + khuôn waffle)
  counter(c, 152, 54)
  // quầy bồn rửa (phải) + vòi + giá úp đĩa
  counter(c, 206, 50, true)
  box(c, 212, 76, 30, 7, STEEL_D); px(c, 214, 78, 26, 3, '#6b7380'); px(c, 214, 77, 26, 1, IRON)
  px(c, 226, 64, 2, 12, STEEL_D); px(c, 226, 63, 8, 2, STEEL_D); px(c, 233, 65, 2, 2, STEEL_D)
  box(c, 243, 64, 12, 13, STEEL_D)
  for (let i = 0; i < 3; i++) box(c, 244 + i * 3, 58 - i, 4, 16, '#fbf6ec')
  // tủ lạnh xanh ngọc (trái cùng)
  box(c, 2, 42, 52, 70, FRIDGE)
  px(c, 4, 44, 48, 2, FRIDGE_L); px(c, 4, 44, 2, 66, FRIDGE_L); px(c, 49, 46, 3, 64, FRIDGE_D)
  px(c, 3, 76, 50, 2, OUT); px(c, 4, 78, 48, 1, FRIDGE_D)
  for (const y of [62, 84]) { box(c, 8, y, 12, 5, STEEL); px(c, 9, y + 1, 9, 1, STEEL_L) }
  px(c, 24, 50, 7, 2, FRIDGE_D); px(c, 26, 52, 3, 1, FRIDGE_D) // logo
  px(c, 2, 110, 52, 2, '#3a3a40')
}

// ---------- đồ động (vẽ mỗi khung) ----------
export function drawPan(c: Ctx) {
  const [x, y] = KANCHOR.panIn
  px(c, x - 22, y - 1, 13, 3, OUT); px(c, x - 21, y, 11, 1, '#7a4429') // cán gỗ
  for (let r = -3; r <= 3; r++) {
    const w = Math.round(10 * Math.sqrt(1 - (r * r) / 12))
    px(c, x - w - 1, y + r, w * 2 + 2, 1, OUT)
    if (Math.abs(r) < 3) px(c, x - w, y + r, w * 2, 1, r < 0 ? IRON_D : IRON)
  }
  px(c, x - 8, y + 2, 16, 1, '#6b7380')
}
export function drawPot(c: Ctx) {
  const [x, y] = KANCHOR.potIn
  box(c, x - 11, y - 1, 22, 11, STEEL)
  px(c, x - 10, y + 2, 2, 7, STEEL_L); px(c, x + 7, y + 2, 2, 7, STEEL_D)
  px(c, x - 12, y - 1, 24, 2, OUT); px(c, x - 11, y - 1, 22, 1, STEEL_L)
  px(c, x - 14, y + 2, 3, 2, OUT); px(c, x + 11, y + 2, 3, 2, OUT) // quai
}
export function drawBowl(c: Ctx) {
  const [x, y] = KANCHOR.bowl
  for (let r = 0; r < 6; r++) { px(c, x - 12 + r, y - 3 + r, 24 - r * 2, 1, OUT); if (r < 5) px(c, x - 11 + r, y - 3 + r, 22 - r * 2, 1, r === 2 ? '#5b8bd9' : '#fbf6ec') }
  px(c, x - 12, y - 4, 24, 1, OUT)
}
export function drawPlate(c: Ctx) {
  const [x, y] = KANCHOR.plate
  px(c, x - 12, y - 1, 24, 1, OUT); px(c, x - 13, y, 26, 2, OUT); px(c, x - 12, y + 2, 24, 1, OUT)
  px(c, x - 12, y, 24, 2, '#fbf6ec'); px(c, x - 10, y, 20, 1, '#ffffff')
}
