// Cảnh quán theo mặt bằng: 1 = Quán gác gỗ đồi thông, 2 = Dreamers Flagship (bảng menu lớn, đèn thả,
// kệ hũ, tường gạch men, tủ bánh, ghế bar). Mặt bằng 0 dùng drawRoom gốc trong pixel.ts.
import { px, box, sky, mixWeighted, CZ, rivet, woodFrame, woodShelf, glassJar, brassLamp, SCENE_W, SCENE_H, COUNTER_Y, OUT, type Ctx } from './pixel'

/** Cửa sổ nhìn ra ngoài (trời theo giờ + thời tiết), có đồi thông */
function windowView(c: Ctx, x: number, y: number, w: number, h: number, dayFrac: number, weather: string, time: number) {
  woodFrame(c, x, y, w, h)
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
  // ánh kính
  c.fillStyle = 'rgba(255,255,255,0.16)'
  c.beginPath(); c.moveTo(x + 2, y + h); c.lineTo(x + 7, y + h); c.lineTo(x + 7 + h * 0.5, y); c.lineTo(x + 2 + h * 0.5, y); c.fill()
  c.restore()
}

function jars(c: Ctx, x: number, y: number, n: number, cols: string[]) {
  for (let i = 0; i < n; i++) glassJar(c, x + i * 7, y - 1, cols[i % cols.length])
}

/** song cửa gỗ dọc */
function mullion(c: Ctx, x: number, y: number, h: number) {
  px(c, x, y, 3, h, CZ.ink); px(c, x + 1, y, 1, h, CZ.w3)
}

// ---------------- Mặt bằng 1: Quán gác gỗ đồi thông ----------------
export function drawRoomMid(c: Ctx, dayFrac: number, weather: string, time: number) {
  // tường ván gỗ thông: ván dọc có khe, vân và mắt gỗ
  px(c, 0, 0, SCENE_W, COUNTER_Y, CZ.w4)
  for (let x = 0; x < SCENE_W; x += 9) {
    px(c, x, 0, 1, 44, CZ.w2); px(c, x + 1, 0, 1, 44, CZ.w5)
    px(c, x + 4, 6 + ((x * 7) % 20), 1, 5, CZ.w3)
    if (x % 27 === 0) { px(c, x + 5, 20 + ((x * 3) % 14), 2, 2, CZ.w2); px(c, x + 5, 20 + ((x * 3) % 14), 1, 1, CZ.w1) }
  }
  // xà ngang
  px(c, 0, 0, SCENE_W, 4, CZ.ink); px(c, 0, 0, SCENE_W, 3, CZ.w1); px(c, 0, 0, SCENE_W, 1, CZ.w2)
  for (let x = 6; x < SCENE_W; x += 30) rivet(c, x, 1)
  // chân tường gạch đỏ, mạch vữa
  px(c, 0, 44, SCENE_W, COUNTER_Y - 44, CZ.r1)
  for (let y = 46; y < COUNTER_Y; y += 4) {
    px(c, 0, y, SCENE_W, 1, CZ.w1)
    for (let x = ((y / 2) % 2) * 4; x < SCENE_W; x += 8) { px(c, x, y, 1, 4, CZ.w1); px(c, x + 1, y + 1, 5, 1, CZ.r2) }
  }
  px(c, 0, 42, SCENE_W, 4, CZ.ink); px(c, 0, 42, SCENE_W, 1, CZ.w5); px(c, 0, 43, SCENE_W, 1, CZ.w3); px(c, 0, 44, SCENE_W, 1, CZ.w1)
  // cửa sổ lớn nhìn ra đồi thông
  windowView(c, 6, 7, 48, 31, dayFrac, weather, time)
  mullion(c, 29, 7, 31)
  // bậu cửa
  px(c, 1, 40, 58, 3, CZ.ink); px(c, 2, 40, 56, 1, CZ.w5); px(c, 2, 41, 56, 1, CZ.w3)
  // bảng phấn
  woodFrame(c, 65, 9, 26, 16)
  px(c, 65, 9, 26, 16, '#2c4a40')
  px(c, 67, 11, 14, 1, '#eef2ea')
  for (let i = 0; i < 3; i++) { px(c, 67, 15 + i * 3, 10 + ((i * 5) % 6), 1, 'rgba(238,242,234,0.75)'); px(c, 84, 15 + i * 3, 5, 1, CZ.b2) }
  px(c, 84, 10, 3, 3, '#eef2ea'); px(c, 87, 11, 1, 1, '#eef2ea') // ly vẽ phấn
  // kệ + hũ
  woodShelf(c, 95, 30, 31)
  jars(c, 98, 23, 4, ['#7fb34d', '#e0a03a', '#f4a46e', '#9fd3ea'])
  // chậu cây treo đất nung
  for (const hx of [108, 122]) {
    px(c, hx, 4, 1, 4, CZ.ink)
    px(c, hx - 4, 8, 9, 6, CZ.ink); px(c, hx - 3, 8, 7, 1, '#e8936a'); px(c, hx - 3, 9, 7, 4, '#c0643f'); px(c, hx - 3, 12, 7, 1, '#8f4a35')
    px(c, hx - 5, 12, 2, 7, '#3f7a3a'); px(c, hx + 4, 12, 2, 9, '#5e9a48'); px(c, hx - 1, 13, 2, 6, '#3f7a3a')
    px(c, hx - 5, 12, 1, 3, '#8cc46a'); px(c, hx + 5, 13, 1, 3, '#8cc46a')
  }
}

export function drawCounterMid(c: Ctx) {
  // mặt quầy gỗ óc chó
  px(c, 0, COUNTER_Y - 1, SCENE_W, 1, CZ.ink)
  px(c, 0, COUNTER_Y, SCENE_W, 4, CZ.w1)
  px(c, 0, COUNTER_Y, SCENE_W, 1, CZ.w3)
  for (let x = 5; x < SCENE_W; x += 14) px(c, x, COUNTER_Y + 2, 7, 1, CZ.w2)
  px(c, 0, COUNTER_Y + 4, SCENE_W, 1, CZ.w0)
  px(c, 0, COUNTER_Y + 5, SCENE_W, 1, CZ.ink)
  // thân quầy ván ngang, nẹp dọc đồng
  const by = COUNTER_Y + 6, bh = SCENE_H - by
  px(c, 0, by, SCENE_W, bh, CZ.w1)
  for (let y = by + 3; y < SCENE_H; y += 4) { px(c, 0, y, SCENE_W, 1, CZ.w0); px(c, 0, y + 1, SCENE_W, 1, CZ.w2) }
  px(c, 0, by, SCENE_W, 2, CZ.w0)
  for (let x = 0; x < SCENE_W; x += 24) { px(c, x, by, 3, bh, CZ.ink); px(c, x + 1, by, 1, bh, CZ.w3); rivet(c, x, by + 3); rivet(c, x, SCENE_H - 5) }
}

// ---------------- Mặt bằng 2: Dreamers Flagship ----------------
export function drawRoomBig(c: Ctx, dayFrac: number, weather: string, time: number) {
  // tường hồng be, gờ trần gỗ
  px(c, 0, 0, SCENE_W, COUNTER_Y, '#f1d9cc')
  for (let r = 0; r < 6; r++) for (let x = 3 + (r % 2) * 5; x < SCENE_W; x += 10) px(c, x, 6 + r * 6, 1, 1, '#e6c6b6')
  px(c, 0, 0, SCENE_W, 2, CZ.w1); px(c, 0, 2, SCENE_W, 1, CZ.w3)
  // gạch men xanh ngọc sau quầy: viên có viền sáng/tối
  px(c, 0, 40, SCENE_W, COUNTER_Y - 40, '#3f8279')
  for (let y = 41; y < COUNTER_Y; y += 4) for (let x = ((y - 41) / 4 % 2) * 2; x < SCENE_W; x += 4) {
    px(c, x, y, 3, 3, '#6fb8ae'); px(c, x, y, 3, 1, '#9fd6cc'); px(c, x + 2, y + 1, 1, 2, '#58a096')
  }
  px(c, 0, 38, SCENE_W, 3, CZ.ink); px(c, 0, 38, SCENE_W, 1, CZ.w5); px(c, 0, 39, SCENE_W, 1, CZ.w3)
  // bảng menu lớn khung gỗ
  woodFrame(c, 8, 6, 50, 12)
  px(c, 8, 6, 50, 12, '#4a2328')
  for (let i = 0; i < 7; i++) px(c, 12 + i * 3, 7, 2, 2, '#fbe9e0') // chữ COFFEES
  for (let i = 0; i < 2; i++) {
    px(c, 11, 11 + i * 3, 14 + ((i * 7) % 8), 1, 'rgba(251,233,224,0.8)'); px(c, 29, 11 + i * 3, 3, 1, CZ.b2)
    px(c, 35, 11 + i * 3, 12 + ((i * 5) % 6), 1, 'rgba(251,233,224,0.8)'); px(c, 52, 11 + i * 3, 3, 1, CZ.b2)
  }
  px(c, 33, 7, 1, 10, 'rgba(251,233,224,0.3)')
  // kệ 2 tầng với hũ thuỷ tinh
  for (const sy of [29, 37]) woodShelf(c, 5, sy, 56)
  jars(c, 7, 22, 8, ['#f6e7d0', '#d9534f', '#7fb34d', '#5ea9a3'])
  jars(c, 10, 30, 7, ['#e0a03a', '#f6e7d0', '#d9534f', '#5ea9a3'])
  // giá treo cốc gốm
  px(c, 65, 26, 32, 2, CZ.ink); px(c, 66, 26, 30, 1, CZ.w4)
  for (let i = 0; i < 5; i++) {
    const cx = 66 + i * 6
    px(c, cx + 2, 28, 1, 2, CZ.ink)
    px(c, cx, 30, 5, 5, CZ.ink); px(c, cx + 1, 30, 3, 4, i % 2 ? '#fbf6ee' : '#6fb8ae'); px(c, cx + 1, 30, 1, 3, '#ffffff')
  }
  // đồng hồ treo tường viền đồng
  const cx = 86, cy = 11
  px(c, cx - 5, cy - 6, 11, 13, CZ.ink); px(c, cx - 6, cy - 5, 13, 11, CZ.ink)
  px(c, cx - 4, cy - 5, 9, 11, CZ.b1); px(c, cx - 5, cy - 4, 11, 9, CZ.b1)
  px(c, cx - 3, cy - 4, 7, 9, '#fbf6ee'); px(c, cx - 4, cy - 3, 9, 7, '#fbf6ee')
  const h = (7 + dayFrac * 14) % 12
  const ah = (h / 12) * Math.PI * 2, am = ((h % 1) * Math.PI * 2)
  for (let r = 0; r < 4; r++) px(c, Math.round(cx + Math.sin(am) * r), Math.round(cy - Math.cos(am) * r), 1, 1, OUT)
  for (let r = 0; r < 3; r++) px(c, Math.round(cx + Math.sin(ah) * r), Math.round(cy - Math.cos(ah) * r), 1, 1, CZ.r0)
  // cửa sổ cao
  windowView(c, 103, 5, 20, 30, dayFrac, weather, time)
  mullion(c, 112, 5, 30)
  // đèn thả chao đồng
  for (const lx of [20, 38, 56]) brassLamp(c, lx, 13)
}

/** Thân quầy Flagship: mặt quầy nâu đỏ, tủ bánh kính bên phải, ghế bar phía trước */
export function drawCounterBig(c: Ctx, t: number, goods: Record<string, number> = {}) {
  // mặt quầy đá nâu đỏ
  px(c, 0, COUNTER_Y - 1, SCENE_W, 1, CZ.ink)
  px(c, 0, COUNTER_Y, SCENE_W, 4, CZ.r0)
  px(c, 0, COUNTER_Y, SCENE_W, 1, CZ.r2)
  for (let x = 7; x < SCENE_W; x += 19) px(c, x, COUNTER_Y + 2, 4, 1, CZ.r1)
  px(c, 0, COUNTER_Y + 4, SCENE_W, 1, CZ.ink)
  // thân quầy ốp san hô, nẹp đồng
  const by = COUNTER_Y + 5, bh = SCENE_H - by
  px(c, 0, by, SCENE_W, bh, CZ.r2)
  px(c, 0, by, SCENE_W, 2, CZ.r1)
  for (let x = 0; x < SCENE_W; x += 16) { px(c, x, by + 2, 1, bh, CZ.r1); px(c, x + 1, by + 2, 1, bh, '#ef8f72') }
  px(c, 0, SCENE_H - 3, SCENE_W, 1, CZ.b1); px(c, 0, SCENE_H - 2, SCENE_W, 2, CZ.r0)
  // tủ bánh kính (thấp, để ghế bar thò lên phía dưới)
  const dx = 80, dy = COUNTER_Y + 6
  woodFrame(c, dx + 2, dy + 2, 40, 12)
  px(c, dx + 2, dy + 2, 40, 12, '#dff4fb')
  px(c, dx + 2, dy + 7, 40, 1, CZ.b1)
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
