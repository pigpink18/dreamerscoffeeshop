// Icon nguyên liệu & hàng bán kèm 16x16 vẽ pixel có đổ bóng / ánh sáng (đẹp hơn bộ 12x12 cũ).
type C = CanvasRenderingContext2D
const K = '#3b2a20' // viền

function p(c: C, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(x, y, w, h) }
/** khối có viền, bo góc 1px, mặt sáng bên trái + bóng bên phải/dưới */
function block(c: C, x: number, y: number, w: number, h: number, fill: string, light: string, dark: string) {
  p(c, x + 1, y, w - 2, h, K); p(c, x, y + 1, w, h - 2, K)
  p(c, x + 1, y + 1, w - 2, h - 2, fill)
  p(c, x + 1, y + 1, 1, h - 2, light); p(c, x + 1, y + 1, w - 2, 1, light)
  p(c, x + w - 2, y + 2, 1, h - 3, dark); p(c, x + 2, y + h - 2, w - 3, 1, dark)
}
/** hình thang (ly / lọ thu nhỏ dần xuống dưới) */
function taper(c: C, x0: number, y0: number, wTop: number, rows: number, shrinkEvery: number, fill: string, light: string, dark: string) {
  let x = x0, w = wTop
  for (let r = 0; r < rows; r++) {
    if (r && r % shrinkEvery === 0) { x++; w -= 2 }
    p(c, x, y0 + r, w, 1, K)
    if (r > 0 && r < rows - 1) { p(c, x + 1, y0 + r, w - 2, 1, fill); p(c, x + 1, y0 + r, 1, 1, light); p(c, x + w - 2, y0 + r, 1, 1, dark) }
  }
}
function shine(c: C, x: number, y: number, h = 3) { p(c, x, y, 1, h, '#ffffff') }

export const DRAW16: Record<string, (c: C) => void> = {
  ly(c) { // ly nhựa nắp vòm + ống hút
    p(c, 9, 0, 2, 5, '#2fa38c'); p(c, 9, 0, 1, 5, '#53c4ab')
    p(c, 4, 3, 8, 1, K); p(c, 3, 4, 10, 2, K); p(c, 4, 4, 8, 1, '#f4fbfe'); p(c, 9, 3, 2, 2, '#2fa38c')
    taper(c, 2, 6, 12, 10, 3, '#dff4fb', '#ffffff', '#9fd3ea')
    shine(c, 4, 8, 4); p(c, 4, 10, 8, 1, '#bfe6f5')
  },
  da(c) { // 3 viên đá
    block(c, 1, 7, 7, 7, '#cdeefa', '#ffffff', '#86c8e8')
    block(c, 8, 8, 7, 7, '#cdeefa', '#ffffff', '#86c8e8')
    block(c, 4, 2, 7, 7, '#dff4fb', '#ffffff', '#86c8e8')
    p(c, 6, 4, 2, 1, '#ffffff'); p(c, 3, 9, 2, 1, '#ffffff'); p(c, 10, 10, 2, 1, '#ffffff')
  },
  suaDac(c) { // lon sữa đặc
    p(c, 3, 2, 10, 2, K); p(c, 4, 2, 8, 1, '#d6dde3'); p(c, 4, 3, 8, 1, '#a9b3bc')
    block(c, 2, 4, 12, 11, '#e0524a', '#f07a72', '#a3302a')
    p(c, 3, 7, 10, 5, '#fffaf0'); p(c, 3, 7, 1, 5, '#ffffff')
    p(c, 6, 8, 4, 3, '#f2c14e'); p(c, 7, 8, 2, 1, '#fff1a8'); p(c, 5, 9, 1, 1, '#f2c14e')
  },
  suaTuoi(c) { // hộp sữa giấy
    p(c, 5, 0, 6, 1, K); p(c, 4, 1, 8, 1, K); p(c, 5, 1, 6, 1, '#ffffff'); p(c, 3, 2, 10, 2, K); p(c, 4, 2, 8, 1, '#e8eef4')
    block(c, 3, 3, 10, 12, '#ffffff', '#ffffff', '#c4cbd1')
    p(c, 4, 6, 8, 3, '#5b8bd9'); p(c, 4, 6, 8, 1, '#8fb6e8')
    p(c, 5, 10, 2, 2, '#3b2a20'); p(c, 9, 11, 2, 1, '#3b2a20'); p(c, 8, 12, 1, 1, '#3b2a20')
  },
  matcha(c) { // hộp thiếc matcha
    block(c, 3, 1, 10, 4, '#2f6b3a', '#4e8f52', '#1e4a28')
    block(c, 3, 4, 10, 11, '#7fb34d', '#a8cf6a', '#4e7f2e')
    p(c, 4, 7, 8, 5, '#fff3dc'); p(c, 7, 8, 2, 3, '#4e7f2e'); p(c, 6, 9, 1, 1, '#7fb34d'); p(c, 9, 8, 1, 1, '#7fb34d')
  },
  tra(c) { // ấm trà
    p(c, 7, 1, 2, 2, K); p(c, 7, 1, 1, 1, '#f2c14e')
    p(c, 5, 3, 6, 1, K); p(c, 5, 4, 6, 1, '#e0a03a')
    block(c, 2, 5, 12, 9, '#e8873a', '#f4a46e', '#b5761f')
    p(c, 0, 7, 2, 1, K); p(c, 0, 8, 1, 3, K); p(c, 1, 8, 1, 2, '#e8873a') // vòi
    p(c, 14, 7, 2, 1, K); p(c, 15, 8, 1, 4, K); p(c, 14, 11, 1, 1, K) // quai
    p(c, 4, 7, 2, 1, '#fff1a8'); p(c, 3, 14, 10, 1, '#b5761f')
  },
  dao(c) { // hũ đào ngâm
    block(c, 4, 1, 8, 3, '#c4cbd1', '#e8eef4', '#7d858c')
    block(c, 2, 3, 12, 12, '#fff4e6', '#ffffff', '#e6d6c2')
    p(c, 4, 6, 4, 3, '#f4a46e'); p(c, 4, 6, 4, 1, '#ffc79a'); p(c, 8, 9, 4, 3, '#f08a3a'); p(c, 8, 9, 4, 1, '#f4a46e')
    p(c, 4, 11, 3, 2, '#f4a46e'); shine(c, 3, 5, 5)
  },
  syrup(c) { // chai syrup có vòi bơm
    p(c, 7, 0, 5, 1, K); p(c, 11, 1, 1, 2, K); p(c, 7, 1, 2, 3, K); p(c, 8, 1, 1, 2, '#c4cbd1')
    block(c, 5, 3, 6, 3, '#7d858c', '#c4cbd1', '#5a6066')
    block(c, 3, 5, 10, 10, '#e0a03a', '#f2c14e', '#b5761f')
    p(c, 4, 8, 8, 4, '#fff3dc'); p(c, 6, 9, 4, 2, '#e0a03a'); shine(c, 4, 6, 2)
  },
  kem(c) { // bát kem muối
    p(c, 6, 1, 3, 1, K); p(c, 5, 2, 5, 1, K); p(c, 6, 2, 3, 1, '#ffffff'); p(c, 4, 3, 8, 1, K); p(c, 5, 3, 6, 1, '#fffaf0')
    p(c, 2, 4, 12, 4, K); p(c, 3, 4, 10, 3, '#fffaf0'); p(c, 4, 5, 2, 1, '#ffffff')
    p(c, 6, 5, 1, 1, '#5b8bd9'); p(c, 9, 4, 1, 1, '#5b8bd9'); p(c, 11, 6, 1, 1, '#5b8bd9') // hạt muối
    block(c, 1, 7, 14, 8, '#7fb8d9', '#a8d4ec', '#4f86a8')
    p(c, 3, 10, 10, 1, '#ffffff')
  },
  kemTuoi(c) { // bình xịt kem tươi
    p(c, 7, 0, 2, 3, K); p(c, 7, 1, 1, 1, '#ffffff')
    block(c, 5, 2, 6, 3, '#c4cbd1', '#e8eef4', '#7d858c')
    block(c, 3, 4, 10, 11, '#ff9aa8', '#ffc4cf', '#c94f63')
    p(c, 4, 7, 8, 4, '#ffffff'); p(c, 6, 8, 4, 2, '#ff9aa8'); shine(c, 4, 5, 2)
  },
  dua(c) { // nửa trái dừa
    p(c, 3, 3, 10, 1, K); p(c, 2, 4, 12, 1, K); p(c, 3, 4, 10, 1, '#fffaf0')
    p(c, 1, 5, 14, 2, K); p(c, 2, 5, 12, 1, '#ffffff'); p(c, 3, 6, 10, 1, '#f6f0e2')
    block(c, 1, 6, 14, 9, '#8a5a3c', '#a8703e', '#5a3a28')
    p(c, 4, 9, 1, 1, '#5a3a28'); p(c, 9, 11, 1, 1, '#5a3a28'); p(c, 6, 12, 2, 1, '#a8703e')
    p(c, 5, 1, 1, 3, '#2fa38c')
  },
  trung(c) { // cốc kem trứng đánh bông + quả trứng
    p(c, 10, 1, 4, 1, K); p(c, 9, 2, 6, 4, K); p(c, 10, 2, 4, 3, '#fffaf0'); p(c, 10, 2, 1, 2, '#ffffff')
    block(c, 1, 5, 11, 10, '#f3d27a', '#fbe7a6', '#d9a93a')
    p(c, 2, 5, 9, 2, '#fff1c4'); p(c, 4, 4, 4, 1, K); p(c, 4, 4, 3, 1, '#fff1c4') // bọt
    p(c, 4, 9, 4, 1, '#d9a93a'); shine(c, 2, 8, 3)
  },
  cacao(c) { // hộp cacao
    block(c, 3, 1, 10, 4, '#5a3a28', '#7a4e33', '#3b2318')
    block(c, 3, 4, 10, 11, '#8a5a3c', '#a8703e', '#5a3a28')
    p(c, 4, 7, 8, 5, '#f4e1c6'); p(c, 6, 8, 4, 3, '#6b3f2a'); p(c, 7, 8, 1, 3, '#a8703e')
  },
  cafe(c) { // túi cà phê giấy kraft
    p(c, 4, 1, 8, 2, K); p(c, 5, 1, 6, 1, '#c99a6b')
    block(c, 2, 2, 12, 13, '#c99a6b', '#e0b98a', '#8a5a3c')
    p(c, 4, 6, 8, 6, '#3b2a20'); p(c, 5, 7, 6, 4, '#6b3f2a'); p(c, 7, 7, 1, 4, '#3b2a20'); p(c, 6, 8, 1, 1, '#a8703e')
  },
  khuay(c) { // muỗng khuấy dài
    for (let i = 0; i < 11; i++) { p(c, 2 + i, 13 - i, 2, 1, K); p(c, 3 + i, 13 - i, 1, 1, '#d6dde3') }
    p(c, 11, 0, 4, 1, K); p(c, 10, 1, 1, 3, K); p(c, 15, 1, 1, 3, K); p(c, 11, 4, 4, 1, K)
    p(c, 11, 1, 4, 3, '#c4cbd1'); p(c, 11, 1, 2, 1, '#ffffff')
  },
  trash(c) {
    p(c, 6, 0, 4, 1, K); p(c, 2, 1, 12, 2, K); p(c, 3, 1, 10, 1, '#a9b3bc')
    block(c, 3, 3, 10, 12, '#c4cbd1', '#e8eef4', '#7d858c')
    for (const x of [5, 8, 11]) p(c, x - 0, 5, 1, 8, '#7d858c')
  },
  // ---------- hàng bán kèm ----------
  lyGom(c) { // ly gốm men lam
    block(c, 2, 3, 10, 12, '#3b6fb6', '#6f9fe0', '#24477a')
    p(c, 3, 4, 8, 2, '#f4f0e6'); p(c, 4, 9, 2, 2, '#f4f0e6'); p(c, 8, 10, 2, 2, '#f4f0e6')
    p(c, 12, 6, 3, 1, K); p(c, 14, 7, 1, 4, K); p(c, 12, 11, 3, 1, K); p(c, 12, 7, 2, 4, '#3b6fb6')
    p(c, 4, 1, 1, 2, '#ffffff'); p(c, 7, 0, 1, 2, '#ffffff')
  },
  binhGom(c) { // bình gốm cắm dã quỳ
    for (const [x, y] of [[2, 1], [7, 0], [11, 2]]) { p(c, x, y, 3, 3, '#f2c14e'); p(c, x + 1, y + 1, 1, 1, '#a35a1c') }
    p(c, 4, 3, 1, 4, '#4e7f2e'); p(c, 8, 3, 1, 4, '#4e7f2e'); p(c, 11, 5, 1, 2, '#4e7f2e')
    p(c, 5, 6, 6, 2, K); p(c, 6, 6, 4, 1, '#d98a5a')
    block(c, 3, 7, 10, 8, '#c0703e', '#e0975a', '#8a4a28')
    p(c, 5, 10, 6, 1, '#f4e1c6')
  },
  postcard(c) { // bưu thiếp Đà Lạt
    block(c, 0, 3, 16, 11, '#fffaf0', '#ffffff', '#e6d6c2')
    p(c, 2, 5, 7, 6, '#8fcff0'); p(c, 2, 9, 7, 2, '#3f7a5c'); p(c, 4, 7, 1, 2, '#3f7a5c'); p(c, 7, 6, 1, 3, '#3f7a5c')
    p(c, 11, 5, 3, 3, '#e0524a'); p(c, 10, 9, 4, 1, '#c4cbd1'); p(c, 10, 11, 4, 1, '#c4cbd1')
  },
  mocKhoa(c) { // móc khoá mặt Cáo
    p(c, 6, 0, 4, 1, K); p(c, 5, 1, 1, 3, K); p(c, 10, 1, 1, 3, K); p(c, 7, 3, 2, 2, '#f2c14e')
    p(c, 3, 5, 3, 3, K); p(c, 10, 5, 3, 3, K); p(c, 4, 6, 1, 2, '#f0a8b0'); p(c, 11, 6, 1, 2, '#f0a8b0') // tai
    block(c, 2, 7, 12, 8, '#a9b0b8', '#d3d8de', '#575e69')
    p(c, 7, 8, 2, 6, '#fbf8f2'); p(c, 5, 10, 1, 1, K); p(c, 10, 10, 1, 1, K); p(c, 7, 12, 2, 1, K)
  },
  croissant(c) { // bánh sừng bò cong
    const g = [
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkyyyYYykk...',
      '..kyyBaayyBayk..',
      '.kaYBaayyBaayyk.',
      '.kaaBaayyBaaaak.',
      'kaaBbaayyBaaBaak',
      'kaBbk.kkkk.kBbak',
      'kabk.......kbak.',
      'kbk.........kbk.',
      '.k...........k..',
    ]
    const col: Record<string, string> = { k: K, y: '#f2c14e', Y: '#fff1a8', a: '#e0a03a', B: '#b5651f', b: '#c97a1f' }
    g.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) p(c, x, y + 2, 1, 1, col[ch]) }))
  },
  bongLan(c) { // bông lan trứng muối
    block(c, 1, 5, 14, 9, '#f6d26b', '#fbe7a6', '#d9a93a')
    p(c, 2, 5, 12, 3, '#fff3dc'); p(c, 3, 6, 2, 1, '#e8873a'); p(c, 7, 6, 2, 1, '#e8873a'); p(c, 11, 6, 2, 1, '#e8873a')
    p(c, 2, 9, 12, 1, '#fff3dc'); p(c, 4, 4, 2, 1, '#3f7a5c'); p(c, 10, 4, 2, 1, '#3f7a5c')
  },
  cupcake(c) {
    p(c, 7, 0, 2, 2, '#d9534f'); p(c, 8, 0, 1, 1, '#ff9aa8')
    p(c, 4, 2, 8, 1, K); p(c, 3, 3, 10, 3, K); p(c, 4, 3, 8, 2, '#ffc4cf'); p(c, 2, 5, 12, 2, K); p(c, 3, 5, 10, 1, '#ff9aa8'); p(c, 5, 3, 2, 1, '#ffffff')
    taper(c, 2, 7, 12, 9, 4, '#e0975a', '#f4b47a', '#a8703e')
    p(c, 5, 9, 1, 5, '#a8703e'); p(c, 9, 9, 1, 5, '#a8703e')
  },
  tiramisu(c) {
    block(c, 1, 3, 14, 12, '#f4e1c6', '#fff3dc', '#c99a6b')
    p(c, 2, 3, 12, 2, '#6b3f2a'); p(c, 2, 7, 12, 2, '#c98a52'); p(c, 2, 11, 12, 2, '#c98a52')
    p(c, 4, 4, 1, 1, '#3b2318'); p(c, 9, 3, 1, 1, '#3b2318')
  },
}
