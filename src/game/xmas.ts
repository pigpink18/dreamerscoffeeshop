// Trang trí Giáng Sinh (vẽ pixel): cây thông trong quán, mũ Noel cho khách. Bật/tắt theo season.ts.
import { px, CZ, type Ctx } from './pixel'
export { isXmasSeason } from './season'

const BALLS = ['#e8503a', '#f2c14e', '#5b8bd9', '#ff9aa8', '#ffffff']
const G0 = '#1f4d3a', G1 = '#2f6b4a', G2 = '#3f8a5c', G3 = '#6ab07a'

/** một tầng lá: tam giác cân đỉnh (cx, y), cao h, đáy rộng 2*half+1, mép dưới răng cưa */
function tier(c: Ctx, cx: number, y: number, h: number, half: number) {
  for (let r = 0; r < h; r++) {
    const w = Math.round(((r + 1) / h) * half)
    px(c, cx - w - 1, y + r, w * 2 + 3, 1, CZ.ink)
    px(c, cx - w, y + r, w * 2 + 1, 1, G1)
    px(c, cx - w, y + r, Math.max(1, w), 1, G2) // nửa trái sáng hơn (đèn chiếu từ trái)
    if (w > 1) px(c, cx - w, y + r, 1, 1, G3)
  }
  // mép dưới lượn sóng + bóng
  for (let x = cx - half; x <= cx + half; x += 2) px(c, x, y + h, 1, 1, CZ.ink)
  px(c, cx - half + 1, y + h - 1, half * 2 - 1, 1, G0)
}

export type TreeSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
// [đỉnh tầng, cao, nửa đáy] theo cỡ; base = chỗ thân cây bắt đầu (tính từ y)
const SIZES: Record<TreeSize, { half: number; tiers: [number, number, number][]; base: number }> = {
  sm: { half: 5, tiers: [[3, 5, 3], [7, 6, 5]], base: 13 }, // 11x18 – cây để bàn
  md: { half: 9, tiers: [[4, 7, 4], [9, 8, 6], [15, 9, 8]], base: 24 }, // 19x31
  lg: { half: 12, tiers: [[4, 7, 5], [9, 9, 8], [16, 10, 10], [23, 10, 12]], base: 33 }, // 25x40
  xxl: { half: 25, tiers: [[4, 9, 6], [11, 12, 10], [21, 13, 13], [32, 14, 17], [44, 15, 21], [57, 16, 25]], base: 73 }, // 51x80
  xl: { half: 18, tiers: [[4, 8, 5], [10, 10, 8], [18, 11, 11], [27, 12, 14], [37, 13, 18]], base: 50 }, // 37x57 – cây đứng sàn khi quán mở rộng
}

/**
 * Cây thông Noel. (x, y) = góc trên trái. sm = cây để bàn (không quà), md/lg = cây đứng sàn có hộp quà.
 * Bóng đèn nhấp nháy theo t.
 */
export function drawXmasTree(c: Ctx, x: number, y: number, t: number, size: TreeSize = 'md') {
  const S = SIZES[size]
  const cx = x + S.half
  const tiers = S.tiers.map(([ty, h, half]) => [y + ty, h, half] as [number, number, number])
  const base = y + S.base
  // thân + chậu
  if (size === 'sm') {
    px(c, cx - 1, base, 3, 2, CZ.ink); px(c, cx, base, 1, 2, CZ.w2)
    px(c, cx - 3, base + 2, 7, 3, CZ.ink); px(c, cx - 2, base + 2, 5, 2, '#b23a32'); px(c, cx - 2, base + 2, 5, 1, '#d9574a')
  } else {
    const pw = size === 'xxl' ? 11 : size === 'xl' ? 9 : size === 'lg' ? 7 : 5
    px(c, cx - 2, base, 5, 3, CZ.ink); px(c, cx - 1, base, 3, 3, CZ.w2)
    px(c, cx - pw, base + 3, pw * 2 + 1, 4, CZ.ink); px(c, cx - pw + 1, base + 3, pw * 2 - 1, 3, '#b23a32'); px(c, cx - pw + 1, base + 3, pw * 2 - 1, 1, '#d9574a')
    px(c, cx - pw + 1, base + 5, pw * 2 - 1, 1, CZ.b1) // viền vàng chậu
  }
  for (const [ty, h, half] of tiers) tier(c, cx, ty, h, half)
  // dây kim tuyến vắt chéo mỗi tầng
  for (const [ty, h, half] of tiers) {
    const gy = ty + Math.round(h * 0.6)
    const w = Math.round(0.6 * half)
    for (let i = -w; i <= w; i++) px(c, cx + i, gy + Math.round((i + w) / 3) - 1, 1, 1, CZ.b2)
  }
  // bóng trang trí + đèn nháy: rải đều trong từng tầng (cố định, không ngẫu nhiên mỗi khung hình)
  let k = 0
  for (const [ty, h, half] of tiers) {
    for (let r = 2; r < h; r += 3) {
      const w = Math.round(((r + 1) / h) * half) - 1
      for (let dx = -w + ((r + k) % 3); dx <= w; dx += 4) {
        const on = (Math.floor(t * 2.2) + k) % 3 !== 0
        px(c, cx + dx, ty + r, 1, 1, on ? BALLS[k % BALLS.length] : G0)
        if (on && size !== 'sm' && k % 2 === 0) px(c, cx + dx, ty + r - 1, 1, 1, 'rgba(255,255,255,0.55)')
        k++
      }
    }
  }
  // ngôi sao trên đỉnh (lấp lánh)
  const sy = y + (size === 'sm' ? 0 : 1)
  const glow = Math.floor(t * 3) % 4 === 0
  px(c, cx - 1, sy, 3, 3, CZ.ink); px(c, cx, sy - 1, 1, 5, CZ.ink); px(c, cx - 2, sy + 1, 5, 1, CZ.ink)
  px(c, cx, sy, 1, 3, '#ffe27a'); px(c, cx - 1, sy + 1, 3, 1, '#ffe27a'); px(c, cx, sy + 1, 1, 1, '#fff8d0')
  if (glow) { px(c, cx - 3, sy + 1, 1, 1, '#fff3b0'); px(c, cx + 3, sy + 1, 1, 1, '#fff3b0'); px(c, cx, sy - 2, 1, 1, '#fff3b0') }
  // hộp quà dưới gốc
  if (size === 'md') {
    gift(c, x - 1, base + 2, 6, 5, '#5b8bd9', '#f2c14e')
    gift(c, x + 13, base + 3, 7, 4, '#6aa84f', '#e8503a')
  } else if (size === 'xxl') {
    gift(c, x - 3, base + 1, 11, 8, '#5b8bd9', '#f2c14e')
    gift(c, x + 9, base + 4, 7, 5, '#ff9aa8', '#ffffff')
    gift(c, x + 36, base + 1, 12, 8, '#6aa84f', '#e8503a')
    gift(c, x + 46, base + 4, 7, 5, '#e8503a', '#f2c14e')
  } else if (size === 'xl') {
    gift(c, x - 2, base + 1, 9, 7, '#5b8bd9', '#f2c14e')
    gift(c, x + 8, base + 4, 6, 4, '#ff9aa8', '#ffffff')
    gift(c, x + 25, base + 1, 10, 7, '#6aa84f', '#e8503a')
    gift(c, x + 33, base + 4, 6, 4, '#e8503a', '#f2c14e')
  } else if (size === 'lg') {
    gift(c, x - 1, base + 1, 7, 6, '#5b8bd9', '#f2c14e')
    gift(c, x + 18, base + 2, 8, 5, '#6aa84f', '#e8503a')
    gift(c, x + 5, base + 4, 5, 3, '#ff9aa8', '#ffffff')
  }
}

function gift(c: Ctx, x: number, y: number, w: number, h: number, col: string, ribbon: string) {
  px(c, x, y, w, h, CZ.ink); px(c, x + 1, y + 1, w - 2, h - 2, col)
  const m = x + (w >> 1)
  px(c, m, y + 1, 1, h - 2, ribbon); px(c, x + 1, y + (h >> 1), w - 2, 1, ribbon)
  px(c, m - 1, y - 1, 1, 1, ribbon); px(c, m + 1, y - 1, 1, 1, ribbon)
}

