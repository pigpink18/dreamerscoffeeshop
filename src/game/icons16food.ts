// Icon 16x16 cho khu bếp: nguyên liệu, dụng cụ, thao tác và món thành phẩm (gộp vào DRAW16 trong icons16.ts)
// Vẽ theo từng "lớp": mỗi vật thể tô vào bộ đệm 16x16 rồi tự viền 1px màu K quanh hình (bo góc như bộ icon đồ uống),
// vật vẽ sau đè lên vật trước kèm viền riêng -> các khối tách bạch, có sáng trái/trên, tối phải/dưới và chấm bóng.
type C = CanvasRenderingContext2D
const K = '#3b2a20' // viền (giống icons16.ts)

/** bảng màu dùng chung cho lưới ký tự */
const PAL: Record<string, string> = {
  k: K, w: '#ffffff', c: '#fbf6ec', C: '#e9dcc6', D: '#c9b79a',
  // bánh mì / vỏ nướng
  h: '#fff1c8', y: '#f6cf86', a: '#e3a24c', b: '#b8702e', n: '#7a4320',
  // kim loại
  L: '#aab3bd', l: '#6b7380', g: '#4a4f57', G: '#2b2f35', s: '#d6dde3', S: '#8f979e',
  // đỏ (xúc xích / tương ớt)
  o: '#f08a74', r: '#d9574a', R: '#9e2f26', x: '#e0352f', X: '#9e1f26',
  // vàng (lòng đỏ / phô mai)
  j: '#ffe08a', Y: '#f2c14e', J: '#d99a2b',
  // xanh lá
  u: '#a8d67a', v: '#7fb34d', V: '#3f7a5c',
  // dâu
  P: '#ff9aac', p: '#e8506a', q: '#a8283f',
  // sô-cô-la
  m: '#8f5a3c', M: '#6b3f2a', N: '#3f2418',
  // pate
  t: '#e0a07a', T: '#b06a45', '1': '#f4c4a0',
  // gỗ
  e: '#a8703e', E: '#6b4226',
  // lửa / nước
  f: '#ff7a2e', F: '#ffd23f', z: '#bfe6f5', Z: '#5b8bd9', B: '#3b6fb6',
}

class Buf {
  a: (string | null)[] = new Array(256).fill(null)
  set(x: number, y: number, col: string | null) { if (x >= 0 && x < 16 && y >= 0 && y < 16) this.a[y * 16 + x] = col }
  get(x: number, y: number) { return x >= 0 && x < 16 && y >= 0 && y < 16 ? this.a[y * 16 + x] : null }
  rect(x: number, y: number, w: number, h: number, col: string) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, col) }
  /** lưới ký tự ('.' hoặc ' ' = trống), tra màu trong pal rồi PAL */
  rows(rows: string[], ox = 0, oy = 0, pal: Record<string, string> = {}) {
    rows.forEach((row, y) => [...row].forEach((ch, x) => { const col = pal[ch] ?? PAL[ch]; if (ch !== '.' && ch !== ' ' && col) this.set(ox + x, oy + y, col) }))
  }
  /** tô các điểm của một hình đặc, bỏ "gai" 1 điểm lòi ra ở đỉnh (ít hơn 2 hàng xóm) */
  shape(pts: [number, number, string | null][]) {
    const has = new Set(pts.filter((q) => q[2]).map(([x, y]) => y * 16 + x))
    for (const [x, y, col] of pts) {
      const n = +has.has(y * 16 + x - 1) + +has.has(y * 16 + x + 1) + +has.has(y * 16 + x - 16) + +has.has(y * 16 + x + 16)
      if (n >= 2 && col) this.set(x, y, col)
    }
  }
  /** elip đặc, màu theo hàm tone(nx, ny) với nx, ny ∈ [-1, 1] */
  ell(cx: number, cy: number, rx: number, ry: number, tone: (nx: number, ny: number, x: number, y: number) => string | null) {
    const pts: [number, number, string | null][] = []
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry
      if (nx * nx + ny * ny <= 1) pts.push([x, y, tone(nx, ny, x, y)])
    }
    this.shape(pts)
  }
  /** "viên nang" (đoạn thẳng có bán kính r); tone(d, s): d = khoảng lệch vuông góc (âm = phía trên/trái), s = vị trí dọc trục 0..len */
  cap(x0: number, y0: number, x1: number, y1: number, r: number, tone: (d: number, s: number) => string | null, prune = true) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len
    const nsgn = ux - uy < 0 ? 1 : -1 // pháp tuyến (-uy, ux) hướng lên-trái
    const pts: [number, number, string | null][] = []
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const px = x + 0.5 - x0, py = y + 0.5 - y0
      const s = Math.max(0, Math.min(len, px * ux + py * uy))
      const qx = px - s * ux, qy = py - s * uy
      if (qx * qx + qy * qy <= r * r) {
        const d = (px * uy - py * ux) * nsgn // âm = phía trên-trái của trục
        pts.push([x, y, tone(d, s)])
      }
    }
    if (prune) this.shape(pts); else for (const [x, y, col] of pts) if (col) this.set(x, y, col)
  }
}
/** vẽ một lớp: tô vào bộ đệm rồi viền K quanh hình (4 hướng -> góc bo) */
function L(c: C, fill: (b: Buf) => void, outline = true) {
  const b = new Buf(); fill(b)
  if (outline) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (b.get(x, y)) continue
      if (b.get(x - 1, y) || b.get(x + 1, y) || b.get(x, y - 1) || b.get(x, y + 1)) { c.fillStyle = K; c.fillRect(x, y, 1, 1) }
    }
  }
  for (let i = 0; i < 256; i++) { const col = b.a[i]; if (col) { c.fillStyle = col; c.fillRect(i % 16, (i / 16) | 0, 1, 1) } }
}
/** tô khối tròn: sáng góc trên-trái, tối mép dưới-phải, chấm bóng */
function shade(hi: string, lt: string, md: string, dk: string, spot = true) {
  return (nx: number, ny: number) => {
    const r = Math.hypot(nx, ny), dir = nx * 0.55 + ny * 0.85
    if (spot && Math.hypot(nx + 0.42, ny + 0.45) < 0.2) return hi
    if (r > 0.62 && dir > 0.35) return dk
    if (r > 0.5 && dir < -0.3) return lt
    return md
  }
}

// ---------- các khối dùng lại ----------
/** đĩa sứ trắng nhìn nghiêng (elip) */
function plate(c: C, cy = 12, rx = 7.5, ry = 3) {
  L(c, (b) => b.ell(8, cy, rx, ry, (nx, ny) => {
    const r = Math.hypot(nx, ny)
    if (r > 0.78) return ny > 0.2 ? PAL.D : PAL.c
    if (r > 0.66) return ny < 0 ? PAL.C : PAL.w
    return ny > 0.3 ? PAL.C : PAL.c
  }))
}
/** bánh waffle nhìn trên: viền gờ sáng, ô lõm tối (góc trên-trái ô đậm nhất) */
function waffle(b: Buf, x0: number, y0: number, w: number, h: number, t: { hi: string; ridge: string; cell: string; deep: string; edge: string }) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((x === 0 || x === w - 1) && (y === 0 || y === h - 1)) continue // bo góc
    const gx = (x - 1) % 3, gy = (y - 1) % 3
    let col = t.ridge
    if (x === 0 || y === 0) col = t.hi
    else if (x === w - 1 || y === h - 1) col = t.edge
    else if (gx !== 2 && gy !== 2) col = gy === 0 ? t.deep : t.cell
    else if (x === 1 || y === 1) col = t.hi
    b.set(x0 + x, y0 + y, col)
  }
}
const GOLD = { hi: '#fde6ad', ridge: '#f2c97a', cell: '#d39a48', deep: '#a8692a', edge: '#b9802f' }
const PANDAN = { hi: '#d4eea6', ridge: '#a6d672', cell: '#74ad48', deep: '#4e7f2e', edge: '#5a8f3a' }
/** hũ nhân (thuỷ tinh, nắp màu) đặt phía sau-trái */
function jar(c: C, fill: string, light: string, dark: string, lid: string, lidLt: string, lidDk: string) {
  L(c, (b) => {
    b.rect(1, 1, 9, 3, lid); b.rect(2, 1, 7, 1, lidLt); b.set(1, 2, lidLt); b.rect(1, 3, 9, 1, lidDk)
    b.rect(2, 4, 7, 9, '#eaf4f2'); b.rect(2, 6, 7, 7, fill); b.rect(2, 6, 7, 1, light); b.rect(7, 7, 1, 6, dark); b.rect(2, 12, 7, 1, dark)
    b.rect(3, 7, 1, 4, '#ffffff'); b.set(3, 4, '#ffffff'); b.rect(8, 4, 1, 2, '#bcd3cf')
  })
}
/** vỏ bánh mì: sáng mép trên-trái, tối mép dưới-phải, vết khía chéo màu kem */
function breadTone(slash: number, from = 1.5, to = 99) {
  return (d: number, s: number) => {
    const t = (s - d * 0.7 + 50) % slash
    if (d > -1.7 && d < 1 && s > from && s < to && t > 1 && t < 2.3) return t < 1.5 ? PAL.b : PAL.h
    if (d < -1.2) return PAL.y
    if (d > 1.1) return PAL.b
    return PAL.a
  }
}
/** sợi mì gợn sóng (zigzag): sợi dày 2px, khe 1px tối; sáng phía trên-trái, tối dưới-phải */
function noodle(x: number, y: number, nx: number, ny: number) {
  const gap = (((y - [0, 1, 1, 0, -1, -1][(x + 60) % 6]) % 3) + 3) % 3 === 0
  const dir = nx * 0.5 + ny * 0.85, r = Math.hypot(nx, ny)
  if (r > 0.6 && dir > 0.3) return gap ? '#a8701a' : '#e0b040'
  if (r > 0.45 && dir < -0.25) return gap ? '#d9a92e' : '#fff1a8'
  return gap ? '#c98f22' : '#f6d873'
}

export const DRAW16_FOOD: Record<string, (c: C) => void> = {
  banhMi(c) { // ổ bánh mì nằm chéo, vỏ vàng giòn, 3 vết khía
    L(c, (b) => b.cap(3, 12.5, 12.5, 3, 2.4, breadTone(3.4, 1.5, 12)))
  },
  pate(c) { // hộp pate mở nắp: vành thiếc, mặt pate, nhãn đỏ-vàng
    L(c, (b) => b.rows([
      '................',
      '................',
      '....ssssssss....',
      '..sSTttttttTSs..',
      '.sST1111tttTTSs.',
      '.sT1111ttttttTS.',
      '.ssTtttttttTTsS.',
      '.ossssssssssssR.',
      '.orrrrrrrrrrrrR.',
      '.ojjjjjjjjjjjYR.',
      '.ojYYTTYTTYYYJR.',
      '.ojYYYYYYYYYYJR.',
      '.orrrrrrrrrrrRR.',
      '.SssssssssssSSS.',
      '................',
    ]))
  },
  xucXich(c) { // 2 cây xúc xích đỏ bóng + đầu buộc
    const tone = (d: number) => (d < -1.1 ? PAL.o : d > 0.9 ? PAL.R : PAL.r)
    L(c, (b) => { b.cap(4, 4.5, 12, 3.5, 2, tone); b.set(2, 4, PAL.n); b.set(14, 3, PAL.n); b.set(6, 3, PAL.w); b.set(7, 3, PAL.w) })
    L(c, (b) => { b.cap(3.5, 11, 11.5, 11.5, 2, tone); b.set(1, 11, PAL.n); b.set(14, 11, PAL.n); b.set(5, 10, PAL.w); b.set(6, 10, PAL.w) })
  },
  trungGa(c) { // 2 quả trứng gà màu nâu nhạt
    const egg = (cx: number, cy: number, rx: number, ry: number) => (b: Buf) => b.ell(cx, cy, rx, ry, (nx, ny) => {
      const k = ny < 0 ? 1 + ny * 0.35 : 1 // đầu trên nhọn hơn
      if (Math.abs(nx) > k * Math.sqrt(Math.max(0, 1 - ny * ny)) + 0.001) return null
      return shade('#ffffff', '#fbe9cf', '#f0cf9e', '#c99a62')(nx, ny)
    })
    L(c, egg(10.5, 6.5, 4, 5.2))
    L(c, egg(6, 9.5, 4.3, 5.6))
  },
  mi(c) { // vắt mì vàng gợn sóng
    L(c, (b) => {
      const pts: [number, number, string | null][] = []
      for (let y = 3; y <= 13; y++) for (let x = 1; x <= 14; x++) {
        const nx = (x + 0.5 - 8) / 7, ny = (y + 0.5 - 8.5) / 5.5
        if (nx ** 4 + ny ** 4 <= 1) pts.push([x, y, noodle(x, y, nx, ny)])
      }
      b.shape(pts)
    })
  },
  sotCay(c) { // chai tương ớt: nắp xanh, thân đỏ, nhãn trắng có trái ớt
    L(c, (b) => b.rows([
      '......VVVV......',
      '......vvvV......',
      '......VVVV......',
      '.......xX.......',
      '......oxxX......',
      '.....oxxxxX.....',
      '....oxxxxxxX....',
      '....owwwwwCX....',
      '....owwwwvCX....',
      '....owwwxVCX....',
      '....owwxxwCX....',
      '....owxxwwCX....',
      '....owwwwwCX....',
      '....oxxxxxxX....',
      '.....XXXXXX.....',
    ], 0, 1, { v: '#5cc07a', V: '#2f8a4a', o: '#ff7a6e' }))
    L(c, (b) => { b.set(5, 6, '#ffffff'); b.set(5, 7, '#ffd0c8') }, false)
  },
  botWaffle(c) { // túi bột, miệng gấp răng cưa, nhãn hình waffle
    L(c, (b) => b.rows([
      '...CcCcCcCcCC...',
      '...ccccccccCC...',
      '..wcccccccccCC..',
      '..wcccccccccCD..',
      '..wc........CD..',
      '..wc........CD..',
      '..wc........CD..',
      '..wc........CD..',
      '..wc........CD..',
      '..wccccccccCCD..',
      '..cCCCCCCCCCCD..',
      '...DDDDDDDDDD...',
    ], 0, 2))
    L(c, (b) => waffle(b, 4, 6, 8, 6, GOLD))
  },
  socola(c) { // hũ nhân sô-cô-la + thanh sô-cô-la trong giấy bạc
    jar(c, PAL.M, PAL.m, PAL.N, '#d8a038', '#f6d06a', '#a8701a')
    L(c, (b) => b.rows([
      'mmmmmM',
      'mMNmMN',
      'mNNmNN',
      'mmmmmM',
      'mMNmMN',
      'sLLLLS',
      'sLsLLS',
    ], 9, 8))
  },
  dau(c) { // hũ mứt dâu + trái dâu
    jar(c, PAL.p, PAL.P, PAL.q, '#d8333a', '#ef6a5f', '#9e1f26')
    L(c, (b) => b.rows([
      '.vVv..',
      'vvVVv.',
      'pPppp.',
      'PwppwP',
      'ppwppq',
      'pwppq.',
      '.ppqq.',
      '..qq..',
    ], 9, 7))
  },
  phoMai(c) { // hũ nhân phô mai + miếng phô mai tam giác có lỗ
    jar(c, PAL.Y, PAL.j, PAL.J, '#e0a03a', '#f6c66a', '#a8701a')
    L(c, (b) => b.rows([
      '.....jj',
      '...jjjY',
      '.jjjjYY',
      'jjjjjYY',
      'YbYYYYJ',
      'YYYYbYJ',
      'JJJJJJJ',
    ], 8, 8, { b: '#c98a1f' }))
  },
  laDua(c) { // hũ nhân lá dứa + bó lá dứa dài
    jar(c, PAL.v, PAL.u, PAL.V, '#3f7a5c', '#5f9e7a', '#24503a')
    const leaf = (d: number) => (d < -0.2 ? PAL.u : d > 0.5 ? PAL.V : PAL.v)
    L(c, (b) => b.cap(9.5, 14.5, 14.5, 3, 1.1, leaf))
    L(c, (b) => b.cap(9, 14.5, 11.5, 5.5, 1.1, leaf))
    L(c, (b) => b.cap(10, 14.5, 15, 9, 1.0, leaf))
  },
  // ---------- dụng cụ ----------
  chao(c) { // chảo gang nhìn trên + cán gỗ
    L(c, (b) => { b.rect(11, 8, 4, 2, PAL.e); b.rect(11, 8, 4, 1, '#c99a6b'); b.rect(14, 9, 1, 1, PAL.E) })
    L(c, (b) => b.ell(6.5, 8.5, 6, 5, (nx, ny) => {
      const r = Math.hypot(nx, ny)
      if (r > 0.8) return ny < -0.1 || nx < -0.4 ? PAL.l : PAL.G
      if (Math.hypot(nx + 0.35, ny + 0.4) < 0.14) return '#8a939e'
      return r > 0.62 && ny + nx * 0.3 < -0.1 ? PAL.G : PAL.g
    }))
  },
  to(c) { // tô sứ trắng viền lam
    L(c, (b) => {
      b.ell(8, 6.5, 7, 2, (nx, ny) => (Math.hypot(nx, ny) > 0.7 ? (ny < 0 ? PAL.C : PAL.w) : ny < 0 ? PAL.D : PAL.C))
      b.rows([
        'cwcccccccccccCD',
        '.cBBBBBBBBBBBD.',
        '.cwcccccccccCD.',
        '..cwcccccccCD..',
        '...cccccccCD...',
        '....cCCCCCD....',
      ], 1, 8)
      b.rect(6, 14, 4, 1, PAL.D)
    })
  },
  khuon(c) { // khuôn waffle mở nắp: nắp dựng phía sau (thấy ô), khay dưới có ô, cán đỏ
    L(c, (b) => b.rows([
      '...LLLLLLLL....',
      '..LllllllllG...',
      '..lgGgGgGglG...',
      '..lgggggggGG...',
      '..lgGgGgGglG...',
      '..lgggggggGG...',
      '...GGGGGGGG....',
    ], 0, 0))
    L(c, (b) => b.rows([
      '.lLLLLLLLLLLl..',
      '.lgGgGgGgGglG..',
      '.lgggggggggGG..',
      '.lgGgGgGgGglG..',
      '.lgggggggggGG..',
      '..GGGGGGGGGG...',
    ], 0, 8))
    L(c, (b) => { b.rect(13, 9, 3, 2, '#d9574a'); b.set(13, 9, '#f08a74'); b.rect(12, 2, 2, 2, '#d9574a'); b.set(12, 2, '#f08a74') })
    L(c, (b) => { b.set(3, 7, PAL.S); b.set(10, 7, PAL.S) }, false)
  },
  dia(c) { // đĩa sứ trống, vành lam
    L(c, (b) => b.ell(8, 9.5, 7.5, 4.5, (nx, ny) => {
      const r = Math.hypot(nx, ny)
      if (r > 0.86) return ny > 0.2 ? PAL.D : PAL.c
      if (r > 0.74) return '#8fb6e8'
      if (r > 0.62) return ny < 0 ? PAL.C : PAL.w
      if (Math.hypot(nx + 0.3, ny + 0.25) < 0.14) return PAL.w
      return ny > 0.3 ? PAL.C : PAL.c
    }))
  },
  // ---------- thao tác ----------
  chien(c) { // chảo có trứng ốp la trên lửa
    L(c, (b) => b.rows([
      'F..f..F..f.',
      'fF.fF.fFfF.',
      'ffFfffFFff.',
    ], 2, 13, { f: '#ff7a2e', F: '#ffd23f' }), false)
    L(c, (b) => { b.rect(12, 6, 4, 2, PAL.e); b.rect(12, 6, 4, 1, '#c99a6b') })
    L(c, (b) => b.ell(7, 7.5, 6.5, 4, (nx, ny) => (Math.hypot(nx, ny) > 0.78 ? (ny < 0 ? PAL.l : PAL.G) : PAL.g)))
    L(c, (b) => { b.rows([
      '.ccwc..',
      'cwcccc.',
      'ccYjcCc',
      'ccJYcC.',
      '.cccC..',
    ], 4, 5) })
  },
  luoc(c) { // nồi nước sôi + hơi
    L(c, (b) => b.rows([
      '.w..w...w.',
      'z.w..wz..w',
      '.z..z..z..',
    ], 3, 0, { z: '#e8f4f8' }), false)
    L(c, (b) => b.rows([
      '..ssssssssss..',
      'SSzwzzzwzzzzSS',
      '.ssLLLLLLLLLS.',
      '.sLssssssssSS.',
      '.sLssssssssSS.',
      '.sLssssssssSS.',
      '.sLssssssssSS.',
      '..SSSSSSSSSS..',
    ], 1, 5))
    L(c, (b) => { b.set(3, 7, PAL.w); b.set(8, 7, PAL.w); b.set(11, 6, '#e8f4f8') }, false)
  },
  tron(c) { // tô mì + đũa gắp sợi mì lên
    L(c, (b) => { b.cap(10.5, 0.5, 8.5, 9, 0.6, () => PAL.e, false); b.cap(13.5, 1, 10.5, 9, 0.6, () => '#c99a6b', false) })
    L(c, (b) => b.rows([
      '...YjYjY.YjY...',
      '..jYJYxYJYjYJ..',
      'cwcccccccccccCD',
      '.cBBBBBBBBBBBD.',
      '.cwcccccccccCD.',
      '..cwcccccccCD..',
      '...cCCCCCCCD...',
    ], 1, 7))
    L(c, (b) => { b.rows(['j.', 'Yj', '.Y', 'jY', 'Y.', 'jJ'], 8, 3) })
  },
  nuong(c) { // khuôn waffle đóng, khe hở đỏ rực + hơi nóng
    L(c, (b) => b.rows([
      'w...w...w',
      '.w..sw...w',
      'w...w..w.',
    ], 3, 1, { s: '#e8f4f8' }), false)
    L(c, (b) => b.rows([
      '..LLLLLLLLLL...',
      '.LllllllllllG..',
      '.lggggggggggG..',
      '.FFfFFFfFFFfF...',
      '.lggggggggggGRR',
      '.lggggggggggGR.',
      '..GGGGGGGGGG...',
    ], 0, 7, { F: '#ffb03f', R: '#d9574a' }))
  },
  // ---------- món thành phẩm (phiếu đơn) ----------
  // ---------- món thành phẩm (phiếu đơn) ----------
  banhMiChao(c) { // chảo gang: trứng ốp la, pate, xúc xích + ổ bánh mì gác bên cạnh
    L(c, (b) => { b.rect(13, 10, 3, 2, PAL.e); b.rect(13, 10, 3, 1, '#c99a6b') })
    L(c, (b) => b.ell(7.5, 10, 6.5, 5.5, (nx, ny) => (Math.hypot(nx, ny) > 0.8 ? (ny < -0.1 || nx < -0.5 ? PAL.l : PAL.G) : PAL.g)))
    L(c, (b) => b.rows([
      '.ccwc.',
      'cwcccc',
      'ccYjcC',
      'ccJYcC',
      '.cccC.',
    ], 3, 7))
    L(c, (b) => b.rows([
      '.1t.',
      '1ttT',
      'tTT.',
    ], 9, 7))
    L(c, (b) => { b.rows(['or', 'rR'], 5, 12); b.rows(['or', 'rR'], 9, 11) })
    L(c, (b) => { b.set(12, 11, '#5cc07a'); b.set(11, 12, PAL.V); b.set(8, 13, '#5cc07a') }, false)
    L(c, (b) => b.cap(3.5, 3.2, 12.5, 2, 1.5, (d) => (d < -0.5 ? PAL.y : d > 0.6 ? PAL.b : PAL.a)))
    L(c, (b) => { b.set(5, 2, PAL.h); b.set(8, 2, PAL.h); b.set(11, 1, PAL.h) }, false)
  },
  miTronCay(c) { // tô mì trộn cay: núi mì vàng, sốt ớt bóng, nửa trứng, rau thơm
    L(c, (b) => b.ell(8, 8.5, 6.5, 4.5, (nx, ny, x, y) => noodle(x, y, nx, ny)))
    L(c, (b) => b.rows(['.xxx.', 'xowxX', '.xXX.'], 3, 4))
    L(c, (b) => b.rows(['.cc.', 'cjYC', 'cYJC', '.CC.'], 9, 3))
    L(c, (b) => { b.set(8, 4, '#5cc07a'); b.set(8, 5, PAL.V); b.set(13, 7, '#5cc07a'); b.set(2, 8, '#5cc07a') }, false)
    L(c, (b) => b.rows([
      'cwcccccccccccccD',
      '.cxxxxxxxxxxxxD.',
      '.cwcccccccccccD.',
      '..cwcccccccccD..',
      '...ccccccccCD...',
      '....cCCCCCCD....',
    ], 0, 9))
  },
}

for (const [id, top] of [['waffleSocola', 'socola'], ['waffleDau', 'dau'], ['wafflePhoMai', 'phoMai'], ['waffleLaDua', 'laDua']] as const) {
  DRAW16_FOOD[id] = (c) => {
    plate(c, 12.5, 7.5, 3)
    L(c, (b) => waffle(b, 3, 1, 11, 11, top === 'laDua' ? PANDAN : GOLD))
    const drizzle = (hi: string, lo: string) => L(c, (b) => b.rows([
      'hh.....hh.',
      'llhh..hhll',
      '..llhhll..',
      '....ll....',
    ], 4, 3, { h: hi, l: lo }), false)
    if (top === 'socola') { // sốt sô-cô-la zigzag + 2 miếng sô-cô-la
      drizzle(PAL.M, PAL.N)
      L(c, (b) => b.rows(['mM', 'MN'], 11, 9))
      L(c, (b) => b.rows(['mM', 'MN'], 5, 9))
    } else if (top === 'dau') { // sốt dâu hồng + lát dâu
      drizzle(PAL.P, PAL.p)
      L(c, (b) => b.rows(['.pp.', 'pPwp', 'pwPq', '.qq.'], 4, 7))
      L(c, (b) => b.rows(['.pp.', 'pPwp', 'pwPq', '.qq.'], 10, 6))
    } else if (top === 'phoMai') { // lát phô mai tan chảy + viên phô mai
      L(c, (b) => b.rows([
        'jjjjjjj',
        'jYYYYYJ',
        'jYYYYYJ',
        'YJYYJYJ',
        '.J.YJ.J',
        '...J...',
      ], 5, 2))
      L(c, (b) => b.rows(['jjY', 'YYJ', 'JJJ'], 10, 9))
    } else { // lá dứa: thân xanh + sốt nước cốt dừa + vụn dừa
      drizzle(PAL.w, PAL.C)
      L(c, (b) => { b.set(5, 10, PAL.w); b.set(11, 9, PAL.w); b.set(8, 9, PAL.w) }, false)
    }
  }
}
