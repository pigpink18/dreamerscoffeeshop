// Icon 16x16 cho khu bếp: nguyên liệu, dụng cụ, thao tác và món thành phẩm (gộp vào DRAW16 trong icons16.ts)
type C = CanvasRenderingContext2D
const K = '#3b2a20'
function p(c: C, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(x, y, w, h) }
/** khối viền bo 1px + sáng trái/trên + tối phải/dưới */
function block(c: C, x: number, y: number, w: number, h: number, fill: string, light: string, dark: string) {
  p(c, x + 1, y, w - 2, h, K); p(c, x, y + 1, w, h - 2, K)
  p(c, x + 1, y + 1, w - 2, h - 2, fill)
  p(c, x + 1, y + 1, 1, h - 2, light); p(c, x + 1, y + 1, w - 2, 1, light)
  p(c, x + w - 2, y + 2, 1, h - 3, dark); p(c, x + 2, y + h - 2, w - 3, 1, dark)
}
/** hình elip pixel đặc có viền */
function blob(c: C, cx: number, cy: number, rx: number, ry: number, fill: string, light?: string) {
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01)))
    p(c, cx - w - 1, cy + y, w * 2 + 3, 1, K)
  }
  for (let y = -ry + 1; y <= ry - 1; y++) {
    const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01)))
    p(c, cx - w, cy + y, w * 2 + 1, 1, fill)
    if (light && y < 0) p(c, cx - w, cy + y, 1, 1, light)
  }
}
/** hũ nhân (lọ thuỷ tinh nắp màu) */
function jar(c: C, fill: string, light: string, lid: string) {
  block(c, 3, 4, 10, 11, '#eaf4f2', '#ffffff', '#bcd3cf')
  p(c, 4, 7, 8, 7, fill); p(c, 4, 7, 8, 1, light)
  block(c, 2, 1, 12, 4, lid, '#ffffff55', '#00000033')
  p(c, 5, 9, 1, 3, '#ffffff')
}
/** đĩa trắng */
function plate(c: C, y = 11) {
  p(c, 1, y, 14, 1, K); p(c, 0, y + 1, 16, 2, K); p(c, 1, y + 3, 14, 1, K)
  p(c, 1, y + 1, 14, 2, '#fbf6ec'); p(c, 2, y + 1, 12, 1, '#ffffff')
}
/** bánh waffle ô vuông (nhìn trên) với nhân màu col lộ ra mép */
function waffleTop(c: C, x: number, y: number, s: number, col?: string) {
  block(c, x, y, s, s, '#e7b35a', '#f6d48a', '#b9802f')
  for (let i = 2; i < s - 2; i += 3) { p(c, x + i, y + 2, 1, s - 4, '#b9802f'); p(c, x + 2, y + i, s - 4, 1, '#b9802f') }
  if (col) { p(c, x + s - 4, y + s - 3, 3, 2, col); p(c, x + 1, y + s - 3, 2, 1, col) }
}

export const DRAW16_FOOD: Record<string, (c: C) => void> = {
  banhMi(c) { // ổ bánh mì nằm chéo, khía vàng
    for (let i = 0; i < 12; i++) { p(c, 1 + i, Math.round(11 - i * 0.6), 4, 4, K) }
    for (let i = 0; i < 12; i++) { const y = Math.round(12 - i * 0.6); p(c, 2 + i, y, 2, 2, '#e3a24c'); p(c, 2 + i, y - 1, 1, 1, '#f6cf86') }
    p(c, 5, 8, 2, 1, '#fff1c8'); p(c, 8, 6, 2, 1, '#fff1c8'); p(c, 11, 4, 2, 1, '#fff1c8')
  },
  pate(c) { // hộp pate tròn nắp thiếc
    block(c, 2, 5, 12, 9, '#c9875a', '#e2a77a', '#9a5f3a')
    block(c, 1, 3, 14, 4, '#c9cfd4', '#ffffff', '#8f979e')
    p(c, 5, 9, 6, 3, '#f4e1c6'); p(c, 6, 10, 4, 1, '#c9875a')
  },
  xucXich(c) { // 2 cây xúc xích
    for (const [x, y] of [[2, 4], [4, 9]]) { block(c, x, y, 11, 5, '#d9574a', '#f08a74', '#9e2f26'); p(c, x + 3, y + 1, 1, 3, '#f6b7a5'); p(c, x + 7, y + 1, 1, 3, '#f6b7a5') }
  },
  trungGa(c) { // quả trứng
    blob(c, 8, 8, 5, 6, '#fbf3e4', '#ffffff'); p(c, 10, 9, 2, 3, '#e9dcc6'); p(c, 6, 5, 1, 2, '#ffffff')
  },
  mi(c) { // vắt mì vàng
    blob(c, 8, 9, 6, 5, '#f2cf6b')
    for (let y = 6; y < 13; y += 2) for (let x = 3; x < 13; x += 3) p(c, x + (y % 4 ? 1 : 0), y, 2, 1, '#d9a92e')
    p(c, 5, 6, 3, 1, '#fff1a8')
  },
  sotCay(c) { // chai tương ớt
    block(c, 4, 5, 8, 10, '#d8333a', '#ef6a5f', '#9e1f26')
    block(c, 6, 1, 4, 5, '#2f8a4a', '#5cc07a', '#1f5c34')
    p(c, 5, 8, 6, 3, '#fbf6ec'); p(c, 7, 9, 2, 1, '#d8333a')
  },
  botWaffle(c) { // túi bột
    block(c, 2, 3, 12, 12, '#f4ead8', '#ffffff', '#cdbfa8')
    p(c, 2, 3, 12, 2, K); p(c, 4, 2, 8, 2, K)
    p(c, 4, 8, 8, 4, '#e7b35a'); for (let i = 5; i < 11; i += 2) p(c, i, 9, 1, 2, '#b9802f')
  },
  socola(c) { jar(c, '#6b3f2a', '#8f5a3c', '#c0703e') },
  dau(c) { jar(c, '#e8506a', '#ff8a9c', '#d8333a') },
  phoMai(c) { jar(c, '#f2c14e', '#ffe08a', '#d99a2b') },
  laDua(c) { jar(c, '#7fb34d', '#a8d67a', '#3f7a5c') },
  // dụng cụ
  chao(c) { // chảo gang cán dài
    blob(c, 6, 9, 5, 4, '#4a4f57'); p(c, 3, 7, 6, 3, '#2b2f35'); p(c, 2, 8, 1, 1, '#6b7380')
    p(c, 11, 8, 5, 3, K); p(c, 11, 9, 4, 1, '#8a5a3c')
  },
  to(c) { // tô sứ
    p(c, 1, 6, 14, 1, K); p(c, 1, 7, 14, 1, '#fbf6ec')
    for (let r = 0; r < 6; r++) { p(c, 1 + r, 7 + r, 14 - r * 2, 1, K); if (r < 5) p(c, 2 + r, 7 + r, 12 - r * 2, 1, r === 2 ? '#5b8bd9' : '#fbf6ec') }
    p(c, 5, 13, 6, 2, K); p(c, 6, 13, 4, 1, '#e9dcc6')
  },
  khuon(c) { // khuôn waffle mở nắp
    block(c, 1, 8, 14, 7, '#4a4f57', '#6b7380', '#2b2f35')
    for (let i = 3; i < 13; i += 3) p(c, i, 10, 1, 4, '#2b2f35')
    block(c, 2, 2, 12, 6, '#4a4f57', '#6b7380', '#2b2f35')
    p(c, 13, 6, 3, 2, '#8a5a3c')
  },
  dia(c) { plate(c, 8); p(c, 5, 5, 6, 3, '#e7b35a'); p(c, 5, 5, 6, 1, '#f6d48a') },
  // thao tác
  chien(c) { // chảo + lửa
    blob(c, 7, 6, 5, 3, '#4a4f57'); p(c, 5, 5, 4, 2, '#fbf3e4'); p(c, 6, 5, 2, 1, '#f2c14e')
    p(c, 12, 5, 4, 2, K)
    for (const [x, h] of [[3, 4], [6, 6], [9, 5], [12, 3]]) { p(c, x, 15 - h, 2, h, '#ff7a2e'); p(c, x, 15 - h + 2, 1, h - 2, '#ffd23f') }
  },
  luoc(c) { // nồi nước sôi
    block(c, 2, 6, 12, 9, '#c9cfd4', '#ffffff', '#8f979e')
    p(c, 0, 8, 2, 2, K); p(c, 14, 8, 2, 2, K)
    p(c, 3, 7, 10, 2, '#9fd3ea')
    for (const x of [4, 8, 11]) { p(c, x, 2 + (x % 3), 1, 3, '#ffffff'); p(c, x + 1, 1 + (x % 3), 1, 2, '#e8f4f8') }
  },
  tron(c) { // tô + đũa
    p(c, 9, 0, 1, 9, '#c9875a'); p(c, 12, 1, 1, 8, '#c9875a')
    for (let r = 0; r < 6; r++) { p(c, 1 + r, 8 + r, 14 - r * 2, 1, K); if (r < 5) p(c, 2 + r, 8 + r, 12 - r * 2, 1, r === 0 ? '#f2cf6b' : '#fbf6ec') }
    p(c, 4, 8, 3, 1, '#d8333a')
  },
  nuong(c) { // khuôn waffle đóng + hơi nóng
    block(c, 1, 7, 14, 8, '#4a4f57', '#6b7380', '#2b2f35')
    p(c, 2, 10, 12, 1, '#ff7a2e'); p(c, 13, 11, 3, 2, '#8a5a3c')
    for (const x of [4, 8, 12]) p(c, x, 1 + (x % 4), 1, 4, '#ffffffaa')
  },
  // món thành phẩm (phiếu đơn)
  banhMiChao(c) {
    blob(c, 7, 9, 6, 5, '#4a4f57'); p(c, 13, 8, 3, 2, K)
    blob(c, 5, 9, 2, 2, '#fbf3e4'); p(c, 5, 9, 1, 1, '#f2c14e')
    p(c, 8, 7, 4, 2, '#d9574a'); p(c, 8, 11, 3, 2, '#c9875a')
    p(c, 2, 2, 7, 3, K); p(c, 3, 3, 5, 1, '#e3a24c')
  },
  miTronCay(c) {
    for (let r = 0; r < 7; r++) { p(c, r, 7 + r, 16 - r * 2, 1, K); if (r < 6) p(c, 1 + r, 7 + r, 14 - r * 2, 1, r < 2 ? '#f2cf6b' : '#fbf6ec') }
    p(c, 3, 5, 10, 3, '#f2cf6b'); p(c, 2, 6, 12, 1, K)
    p(c, 5, 5, 3, 2, '#d8333a'); blob(c, 10, 5, 2, 1, '#fbf3e4'); p(c, 10, 5, 1, 1, '#f2c14e')
    p(c, 4, 4, 1, 1, '#3f7a5c'); p(c, 12, 6, 1, 1, '#3f7a5c')
  },
}
for (const [id, col] of [['waffleSocola', '#6b3f2a'], ['waffleDau', '#e8506a'], ['wafflePhoMai', '#f2c14e'], ['waffleLaDua', '#7fb34d']] as const) {
  DRAW16_FOOD[id] = (c) => { plate(c, 11); waffleTop(c, 3, 2, 10, col); p(c, 4, 12, 2, 1, col) }
}
