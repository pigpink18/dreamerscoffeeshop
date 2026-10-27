// Cảnh quán theo mặt bằng: 1 = Quán gác gỗ đồi thông, 2 = Dreamers Flagship (bảng menu lớn, đèn thả,
// kệ hũ, tường gạch men, tủ bánh, ghế bar). Mặt bằng 0 dùng drawRoom gốc trong pixel.ts.
import { px, box, sky, mixWeighted, SCENE_W, SCENE_H, COUNTER_Y, OUT, type Ctx } from './pixel'

/** Cửa sổ nhìn ra ngoài (trời theo giờ + thời tiết), có đồi thông */
function windowView(c: Ctx, x: number, y: number, w: number, h: number, dayFrac: number, weather: string, time: number, frame = '#7a4e33') {
  box(c, x - 2, y - 2, w + 4, h + 4, frame)
  const [st, sb] = sky(dayFrac, weather === 'rainy')
  for (let i = 0; i < h; i++) px(c, x, y + i, w, 1, mixWeighted(st, sb, i / h))
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip()
  if (weather !== 'rainy' && dayFrac < 0.9) {
    const sx = x + 3 + dayFrac * (w - 8), sy = y + 5 + Math.abs(dayFrac - 0.45) * (h * 0.6)
    px(c, sx, sy, 4, 4, '#fff3b0'); px(c, sx + 1, sy - 1, 2, 6, '#fff3b0')
  }
  // đồi + thông
  const hill = dayFrac > 0.85 ? '#2f4a4a' : '#7fae8c'
  const pine = dayFrac > 0.85 ? '#1e3333' : '#3f7a5c'
  for (let i = 0; i < w; i++) px(c, x + i, y + h - 7 - Math.round(2 * Math.sin((i + x) / 6)), 1, 10, hill)
  for (let i = 2; i < w; i += 6) for (let r = 0; r < 7; r++) px(c, x + i - (r >> 1), y + h - 12 + r, 1 + (r >> 1) * 2, 1, pine)
  // sương mù trôi
  const fx = ((time * 3) % (w + 30)) - 20
  c.fillStyle = 'rgba(255,255,255,0.45)'
  c.fillRect(Math.round(x + fx), y + h - 9, 22, 2)
  c.fillRect(Math.round(x + fx * 0.7 + 10), y + h - 5, 18, 2)
  if (weather === 'rainy') for (let i = 0; i < 14; i++) px(c, x + ((i * 11 + time * 30) % w), y + ((i * 7 + time * 60) % h), 1, 3, 'rgba(220,235,255,0.8)')
  c.restore()
}

function jars(c: Ctx, x: number, y: number, n: number, cols: string[]) {
  for (let i = 0; i < n; i++) { box(c, x + i * 7, y, 5, 7, cols[i % cols.length]); px(c, x + 1 + i * 7, y - 1, 3, 2, '#5a3a28') }
}

// ---------------- Mặt bằng 1: Quán gác gỗ đồi thông ----------------
export function drawRoomMid(c: Ctx, dayFrac: number, weather: string, time: number) {
  // tường ván gỗ
  px(c, 0, 0, SCENE_W, COUNTER_Y, '#c99a6b')
  for (let x = 0; x < SCENE_W; x += 9) { px(c, x, 0, 1, 44, '#a8784f'); px(c, x + 4, 6 + ((x * 7) % 20), 1, 2, '#a8784f') }
  // xà ngang
  px(c, 0, 0, SCENE_W, 3, '#6f4630')
  // chân tường gạch
  px(c, 0, 44, SCENE_W, COUNTER_Y - 44, '#b5654a')
  for (let y = 44; y < COUNTER_Y; y += 4) {
    px(c, 0, y, SCENE_W, 1, '#8f4a35')
    for (let x = ((y / 4) % 2) * 4; x < SCENE_W; x += 8) px(c, x, y, 1, 4, '#8f4a35')
  }
  px(c, 0, 43, SCENE_W, 2, '#6f4630')
  // cửa sổ vòm lớn
  windowView(c, 5, 6, 50, 33, dayFrac, weather, time)
  px(c, 29, 6, 2, 33, '#7a4e33')
  px(c, 2, 41, 56, 2, '#6f4630')
  // bảng phấn
  box(c, 62, 6, 32, 22, '#2f4a3a', '#7a4e33')
  px(c, 66, 9, 18, 1, '#e8efe6')
  for (let i = 0; i < 4; i++) { px(c, 65, 13 + i * 3, 12 + ((i * 5) % 6), 1, 'rgba(232,239,230,0.75)'); px(c, 85, 13 + i * 3, 5, 1, 'rgba(242,193,78,0.85)') }
  // kệ + hũ
  px(c, 96, 30, 30, 2, '#6f4630')
  jars(c, 98, 23, 4, ['#7fb34d', '#e0a03a', '#f4a46e', '#9fd3ea'])
  // chậu cây treo
  for (const hx of [108, 122]) {
    px(c, hx, 0, 1, 8, '#5a3a28')
    box(c, hx - 3, 8, 7, 5, '#d9744a')
    px(c, hx - 4, 12, 2, 6, '#4e7f2e'); px(c, hx + 3, 12, 2, 8, '#6aa84f'); px(c, hx - 1, 13, 2, 5, '#4e7f2e')
  }
}

export function drawCounterMid(c: Ctx) {
  px(c, 0, COUNTER_Y, SCENE_W, 5, '#8a5a3c')
  px(c, 0, COUNTER_Y, SCENE_W, 1, '#b07a52')
  px(c, 0, COUNTER_Y + 4, SCENE_W, 1, '#4a2e1f')
  px(c, 0, COUNTER_Y + 5, SCENE_W, SCENE_H - COUNTER_Y - 5, '#5a3a28')
  for (let x = 0; x < SCENE_W; x += 8) px(c, x, COUNTER_Y + 5, 1, SCENE_H - COUNTER_Y, '#4a2e1f')
}

// ---------------- Mặt bằng 2: Dreamers Flagship ----------------
export function drawRoomBig(c: Ctx, dayFrac: number, weather: string, time: number) {
  // tường hồng be
  px(c, 0, 0, SCENE_W, COUNTER_Y, '#f1d9cc')
  // gạch men xanh ngọc sau quầy
  px(c, 0, 40, SCENE_W, COUNTER_Y - 40, '#7fc4bf')
  for (let y = 40; y < COUNTER_Y; y += 4) px(c, 0, y, SCENE_W, 1, '#5ea9a3')
  for (let x = 0; x < SCENE_W; x += 4) px(c, x, 40, 1, COUNTER_Y - 40, '#5ea9a3')
  // bảng menu lớn
  box(c, 5, 3, 56, 18, '#6e2f3a', '#4a1f28')
  for (let i = 0; i < 7; i++) px(c, 9 + i * 3, 6, 2, 2, '#fbe9e0') // chữ COFFEES
  for (let i = 0; i < 3; i++) {
    px(c, 9, 11 + i * 3, 16 + ((i * 7) % 8), 1, 'rgba(251,233,224,0.8)'); px(c, 31, 11 + i * 3, 3, 1, '#f2c14e')
    px(c, 37, 11 + i * 3, 14 + ((i * 5) % 6), 1, 'rgba(251,233,224,0.8)'); px(c, 55, 11 + i * 3, 3, 1, '#f2c14e')
  }
  px(c, 33, 5, 1, 15, 'rgba(251,233,224,0.35)')
  // kệ 2 tầng với hũ màu
  for (const sy of [30, 38]) px(c, 5, sy, 56, 2, '#a86a4a')
  jars(c, 7, 23, 8, ['#f6e7d0', '#d9534f', '#7fb34d', '#5ea9a3'])
  jars(c, 10, 31, 7, ['#e0a03a', '#f6e7d0', '#d9534f', '#5ea9a3'])
  // giá treo cốc
  px(c, 66, 27, 30, 1, '#a86a4a')
  for (let i = 0; i < 5; i++) { px(c, 68 + i * 6, 28, 1, 2, OUT); box(c, 66 + i * 6, 30, 5, 5, i % 2 ? '#ffffff' : '#7fc4bf') }
  // đồng hồ treo tường
  const cx = 86, cy = 11
  px(c, cx - 5, cy - 6, 11, 13, '#8a6a58'); px(c, cx - 6, cy - 5, 13, 11, '#8a6a58')
  px(c, cx - 4, cy - 5, 9, 11, '#fbf6ee'); px(c, cx - 5, cy - 4, 11, 9, '#fbf6ee')
  const h = (7 + dayFrac * 14) % 12
  const ah = (h / 12) * Math.PI * 2, am = ((h % 1) * Math.PI * 2)
  for (let r = 0; r < 4; r++) px(c, Math.round(cx + Math.sin(am) * r), Math.round(cy - Math.cos(am) * r), 1, 1, OUT)
  for (let r = 0; r < 3; r++) px(c, Math.round(cx + Math.sin(ah) * r), Math.round(cy - Math.cos(ah) * r), 1, 1, '#a3302a')
  // cửa sổ cao
  windowView(c, 102, 4, 22, 32, dayFrac, weather, time, '#a86a4a')
  px(c, 112, 4, 2, 32, '#a86a4a')
  // đèn thả mái vòm xanh
  for (const lx of [20, 38, 56]) {
    px(c, lx, 0, 1, 13, '#5a3a28')
    px(c, lx - 4, 13, 9, 2, '#9cc47a'); px(c, lx - 5, 15, 11, 3, '#9cc47a'); px(c, lx - 5, 17, 11, 1, '#6f9a52')
    px(c, lx - 2, 18, 5, 1, '#fff3b0')
    c.fillStyle = 'rgba(255,236,170,0.10)'
    c.beginPath(); c.moveTo(lx - 4, 18); c.lineTo(lx + 5, 18); c.lineTo(lx + 13, 40); c.lineTo(lx - 12, 40); c.fill()
  }
}

/** Thân quầy Flagship: mặt quầy nâu đỏ, tủ bánh kính bên phải, ghế bar phía trước */
export function drawCounterBig(c: Ctx, t: number, goods: Record<string, number> = {}) {
  px(c, 0, COUNTER_Y, SCENE_W, 4, '#7a3e2e')
  px(c, 0, COUNTER_Y, SCENE_W, 1, '#a35a44')
  px(c, 0, COUNTER_Y + 4, SCENE_W, SCENE_H - COUNTER_Y - 4, '#e2725b')
  px(c, 0, COUNTER_Y + 4, SCENE_W, 2, '#c45a45')
  for (let x = 0; x < SCENE_W; x += 16) px(c, x, COUNTER_Y + 6, 1, SCENE_H - COUNTER_Y, '#c45a45')
  // tủ bánh kính (thấp, để ghế bar thò lên phía dưới)
  const dx = 80, dy = COUNTER_Y + 6
  box(c, dx, dy, 44, 15, '#dff4fb', '#5a3a28')
  px(c, dx + 1, dy + 7, 42, 1, '#9fb8c2')
  // tủ có bánh nào thì hiện bánh đó (hết hàng → kệ trống)
  const top = [goods.croissant, goods.bongLan, goods.croissant, goods.bongLan, goods.croissant]
  const bot = [goods.cupcake, goods.tiramisu, goods.cupcake, goods.tiramisu, goods.cupcake]
  for (let i = 0; i < 5; i++) {
    const bx = dx + 3 + i * 8
    const hasTop = (top[i] ?? 0) > Math.floor(i / 2) * 2, hasBot = (bot[i] ?? 0) > Math.floor(i / 2) * 2
    if (hasTop && i % 2 === 0) { // croissant
      px(c, bx, dy + 4, 6, 2, '#e0a03a'); px(c, bx + 1, dy + 3, 4, 1, '#f2c14e'); px(c, bx - 1, dy + 5, 1, 1, '#c97a1f'); px(c, bx + 6, dy + 5, 1, 1, '#c97a1f')
    } else if (hasTop) { // bông lan trứng muối
      px(c, bx, dy + 3, 6, 3, '#f6d26b'); px(c, bx, dy + 3, 6, 1, '#fff3dc'); px(c, bx + 2, dy + 3, 1, 1, '#e8873a')
    }
    if (hasBot && i % 2 === 0) { px(c, bx + 1, dy + 11, 4, 2, '#c98a52'); px(c, bx, dy + 9, 6, 2, '#ff9aa8'); px(c, bx + 2, dy + 8, 2, 1, '#d9534f') }
    else if (hasBot) { px(c, bx, dy + 9, 6, 4, '#f4e1c6'); px(c, bx, dy + 9, 6, 1, '#6b3f2a'); px(c, bx, dy + 11, 6, 1, '#c98a52') }
  }
  c.fillStyle = 'rgba(255,255,255,0.35)'
  c.fillRect(dx + 3 + (Math.floor(t * 0.5) % 2) * 2, dy + 2, 2, 11)
}

/** Kệ đồ gốm & lưu niệm ở Quán gác gỗ (góc phải thân quầy) */
export function drawSouvenirShelf(c: Ctx, goods: Record<string, number>) {
  const x = 101, y = COUNTER_Y + 4
  box(c, x, y, 26, 26, '#c99a6b', '#4a2e1f')
  px(c, x + 1, y + 12, 24, 2, '#8a5a3c'); px(c, x + 1, y + 23, 24, 2, '#8a5a3c')
  if ((goods.lyGom ?? 0) > 0) { // ly gốm men lam
    box(c, x + 3, y + 5, 7, 7, '#3b6fb6', OUT); px(c, x + 4, y + 6, 5, 1, '#f4f0e6'); px(c, x + 10, y + 7, 2, 3, OUT); px(c, x + 5, y + 9, 1, 1, '#f4f0e6')
  }
  if ((goods.binhGom ?? 0) > 0) { // bình gốm + dã quỳ
    box(c, x + 15, y + 6, 7, 6, '#c0703e', OUT); px(c, x + 16, y + 8, 5, 1, '#f4e1c6')
    px(c, x + 15, y + 2, 2, 2, '#f2c14e'); px(c, x + 19, y + 1, 2, 2, '#f2c14e'); px(c, x + 17, y + 4, 1, 2, '#4e7f2e'); px(c, x + 20, y + 3, 1, 3, '#4e7f2e')
  }
  if ((goods.postcard ?? 0) > 0) { // bưu thiếp dựng
    box(c, x + 3, y + 16, 6, 7, '#fffaf0', OUT); px(c, x + 4, y + 17, 4, 3, '#8fcff0'); px(c, x + 4, y + 19, 4, 1, '#3f7a5c')
    box(c, x + 7, y + 17, 6, 6, '#fffaf0', OUT); px(c, x + 8, y + 18, 4, 2, '#f4a46e')
  }
  if ((goods.mocKhoa ?? 0) > 0) { // móc khoá mặt Cáo
    px(c, x + 18, y + 14, 1, 3, OUT)
    box(c, x + 15, y + 17, 8, 6, '#a9b0b8', OUT); px(c, x + 18, y + 18, 2, 4, '#fbf8f2'); px(c, x + 16, y + 16, 2, 2, OUT); px(c, x + 20, y + 16, 2, 2, OUT)
  }
}

/** Ghế bar trước quầy (vẽ sau bảng hiệu) */
export function drawStools(c: Ctx) {
  for (const sx of [103, 116]) {
    px(c, sx, SCENE_H - 8, 11, 3, '#e8c27a'); px(c, sx, SCENE_H - 8, 11, 1, '#f6dca0')
    px(c, sx + 2, SCENE_H - 5, 1, 5, '#5a3a28'); px(c, sx + 8, SCENE_H - 5, 1, 5, '#5a3a28'); px(c, sx + 2, SCENE_H - 2, 7, 1, '#5a3a28')
  }
}

// ---------------- Đồ trang trí mua bằng hạt vàng ----------------
/** Vị trí 6 món trang trí theo từng mặt bằng (x, y góc trên trái) */
export const DECOR_SLOTS: Record<string, [number, number][]> = {
  // lantern, painting, daquy, guitar, vinyl, fish
  '0': [[86, 0], [104, 33], [118, 33], [86, 30], [8, 40], [30, 30]],
  '1': [[96, 0], [64, 30], [116, 34], [78, 29], [8, 44], [36, 33]],
  '2': [[70, 0], [64, 36], [96, 36], [118, 38], [98, 50], [113, 52]],
}
const DECOR_ORDER = ['lantern', 'painting', 'daquy', 'guitar', 'vinyl', 'fish']

export function drawDecorItems(c: Ctx, owned: string[], premise: number, t: number) {
  const slots = DECOR_SLOTS[String(premise)] ?? DECOR_SLOTS['0']
  for (const id of owned) {
    const i = DECOR_ORDER.indexOf(id)
    if (i < 0) continue
    const [x, y] = slots[i]
    drawDecor(c, id, x, y, t)
  }
}

function drawDecor(c: Ctx, id: string, x: number, y: number, t: number) {
  if (id === 'lantern') {
    const sw = Math.round(Math.sin(t * 1.5))
    px(c, x + 3, y, 1, 6, '#5a3a28')
    box(c, x + sw, y + 6, 7, 8, '#e0524a', '#a3302a')
    px(c, x + 1 + sw, y + 8, 5, 1, '#f2c14e'); px(c, x + 1 + sw, y + 11, 5, 1, '#f2c14e')
    px(c, x + 3 + sw, y + 14, 1, 3, '#f2c14e')
  } else if (id === 'painting') {
    box(c, x, y, 13, 10, '#8fc9e8', '#a86a4a')
    px(c, x + 1, y + 6, 11, 3, '#5f9fc4') // hồ
    px(c, x + 2, y + 3, 3, 3, '#3f7a5c'); px(c, x + 8, y + 2, 3, 4, '#3f7a5c') // thông
  } else if (id === 'daquy') {
    box(c, x + 2, y + 7, 6, 5, '#c0703e')
    for (const [fx, fy] of [[1, 1], [5, 0], [3, 3], [7, 3]]) { px(c, x + fx, y + fy, 3, 3, '#f2c14e'); px(c, x + fx + 1, y + fy + 1, 1, 1, '#a35a1c') }
    px(c, x + 4, y + 4, 1, 3, '#4e7f2e')
  } else if (id === 'guitar') {
    px(c, x + 2, y, 2, 8, '#5a3a28')
    box(c, x, y + 7, 6, 4, '#d9874a'); box(c, x - 1, y + 10, 8, 5, '#d9874a')
    px(c, x + 2, y + 11, 2, 2, OUT)
  } else if (id === 'vinyl') {
    box(c, x, y + 4, 12, 6, '#8a5a3c')
    px(c, x + 2, y + 2, 7, 3, '#222'); px(c, x + 5, y + 3, 1, 1, '#d9534f')
    px(c, x + 9, y, 1, 4, '#c4cbd1')
    if (Math.floor(t * 2) % 2) px(c, x + 13, y - 2, 1, 2, OUT); else px(c, x + 14, y - 3, 2, 1, OUT)
  } else if (id === 'fish') {
    box(c, x, y, 12, 8, '#bfe6f5', '#5b7a99')
    const fx = x + 2 + Math.round((Math.sin(t) + 1) * 3)
    px(c, fx, y + 3, 3, 2, '#f08a3a'); px(c, fx - 1, y + 3, 1, 2, '#f08a3a')
    px(c, x + 9, y + 2 - (Math.floor(t * 3) % 2), 1, 1, '#ffffff')
    px(c, x + 1, y + 6, 10, 1, '#c9a86a')
  }
}
