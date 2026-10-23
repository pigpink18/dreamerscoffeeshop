// Bảng hiệu "DREAMERS COFFEE" gắn trước quầy — có chuyển động:
// đèn bóng chạy vòng quanh viền, ly cà phê bốc khói, từng chữ lần lượt nhảy lên, vệt sáng lướt qua,
// buổi tối bảng chuyển nền tối + chữ neon phát sáng (thỉnh thoảng chớp như đèn thật).
import { px, type Ctx } from './pixel'

/** DREAMERS: font 5x7 (to, nét rõ) */
const BIG: Record<string, string[]> = {
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
}
/** COFFEE: font 4x5 */
const SMALL: Record<string, string[]> = {
  C: ['0111', '1000', '1000', '1000', '0111'],
  O: ['0110', '1001', '1001', '1001', '0110'],
  F: ['1111', '1000', '1110', '1000', '1000'],
  E: ['1111', '1000', '1110', '1000', '1111'],
}
const textW = (s: string, font: Record<string, string[]>) => [...s].reduce((w, ch) => w + font[ch][0].length + 1, 0) - 1

type TextOpt = { hop?: number; shine?: number; shineCol?: string; glowCol?: string }
/** Vẽ chữ. hop = chỉ số chữ đang nhảy lên 1px; shine = cột x của vệt sáng chéo */
function text(c: Ctx, s: string, font: Record<string, string[]>, x: number, y: number, col: string, o: TextOpt = {}) {
  let cx = x
  ;[...s].forEach((ch, i) => {
    const g = font[ch]
    const dy = o.hop === i ? -1 : 0
    // quầng neon (chỉ ban đêm)
    if (o.glowCol) for (let r = 0; r < g.length; r++) for (let k = 0; k < g[0].length; k++) if (g[r][k] === '1') {
      px(c, cx + k - 1, y + r + dy, 3, 1, o.glowCol); px(c, cx + k, y + r + dy - 1, 1, 3, o.glowCol)
    }
    for (let r = 0; r < g.length; r++) for (let k = 0; k < g[0].length; k++) {
      if (g[r][k] !== '1') continue
      const lit = o.shine !== undefined && Math.abs(cx + k + r * 0.6 - o.shine) < 1
      px(c, cx + k, y + r + dy, 1, 1, lit ? o.shineCol || '#ffffff' : col)
    }
    cx += g[0].length + 1
  })
}

/** Ly cà phê nhỏ (9x7) + 2 sợi khói uốn lượn bay lên */
function cup(c: Ctx, x: number, y: number, t: number, night: boolean) {
  for (let s = 0; s < 2; s++) for (let i = 0; i < 3; i++) {
    const ph = (t * 1.6 + s * 0.5 + i / 3) % 1
    const sy = y - 1 - Math.floor(ph * 6)
    const sx = x + 2 + s * 3 + Math.round(Math.sin(ph * 6.28 + s * 2))
    px(c, sx, sy, 1, 1, night ? `rgba(255,255,255,${(0.8 * (1 - ph)).toFixed(2)})` : `rgba(140,110,90,${(0.85 * (1 - ph)).toFixed(2)})`)
  }
  const O = night ? '#c9a27a' : '#5a3a28'
  px(c, x, y, 7, 1, O)
  px(c, x + 1, y + 1, 5, 1, '#4b2e1e') // mặt cà phê
  px(c, x, y + 1, 1, 4, O); px(c, x + 6, y + 1, 1, 4, O)
  px(c, x + 1, y + 2, 5, 3, '#ffffff'); px(c, x + 1, y + 3, 5, 1, '#ff9aa8') // ly trắng sọc hồng
  px(c, x + 1, y + 5, 5, 1, O)
  px(c, x + 7, y + 2, 1, 1, O); px(c, x + 8, y + 2, 1, 2, O); px(c, x + 7, y + 4, 1, 1, O) // quai
  px(c, x - 1, y + 6, 9, 1, O) // đĩa
}

export const SIGN_W = 72
export const SIGN_H = 22
/**
 * Bảng hiệu trước quầy. (x, y) góc trên-trái, kích thước SIGN_W x SIGN_H.
 * night: 0..1 (tối dần -> nền tối, chữ neon)
 */
export function drawSign(c: Ctx, x: number, y: number, t: number, night = 0) {
  const W = SIGN_W, H = SIGN_H
  const glow = night > 0.3
  if (night > 0) { c.fillStyle = `rgba(255,190,110,${(0.2 * night).toFixed(2)})`; c.fillRect(x - 3, y - 3, W + 6, H + 6) }
  // khung gỗ + mặt bảng
  px(c, x - 1, y - 1, W + 2, H + 2, '#4a2e1f')
  px(c, x, y, W, H, '#6f4630')
  px(c, x + 2, y + 2, W - 4, H - 4, glow ? '#2e2233' : '#fbf1e1')
  px(c, x + 2, y + H - 3, W - 4, 1, glow ? '#251b29' : '#ead8bd')

  // đèn bóng chạy quanh viền (marquee)
  const bulbs: [number, number][] = []
  for (let bx = x + 2; bx < x + W - 1; bx += 4) bulbs.push([bx, y])
  for (let by = y + 4; by < y + H - 1; by += 4) bulbs.push([x + W - 1, by])
  for (let bx = x + W - 3; bx > x; bx -= 4) bulbs.push([bx, y + H - 1])
  for (let by = y + H - 5; by > y; by -= 4) bulbs.push([x, by])
  const step = Math.floor(t * 8)
  bulbs.forEach(([bx, by], i) => {
    const on = (i + step) % 3 === 0
    px(c, bx, by, 1, 1, on ? '#fff3b0' : '#b8863a')
    if (on) { c.fillStyle = 'rgba(255,240,160,0.35)'; c.fillRect(bx - 1, by - 1, 3, 3) }
  })

  cup(c, x + 5, y + 10, t, glow)

  // chữ
  const L1 = 'DREAMERS', L2 = 'COFFEE'
  const tx = x + 16, tw = W - 19
  const x1 = tx + Math.floor((tw - textW(L1, BIG)) / 2)
  const x2 = tx + Math.floor((tw - textW(L2, SMALL)) / 2)
  const hopI = Math.floor(t * 9) % (L1.length + 8) // từng chữ nhảy lần lượt, rồi nghỉ 1 nhịp
  const cyc = (t % 4) / 4
  const shine = cyc < 0.4 ? tx - 6 + (cyc / 0.4) * (tw + 12) : undefined // vệt sáng lướt qua mỗi 4 giây
  const flick = glow && Math.floor(t * 10) % 47 === 0
  text(c, L1, BIG, x1, y + 3, glow ? (flick ? '#9c7538' : '#ffd77a') : '#4a2e1f', {
    hop: hopI, shine, shineCol: glow ? '#ffffff' : '#c8893a', glowCol: glow && !flick ? 'rgba(255,170,60,0.2)' : undefined,
  })
  text(c, L2, SMALL, x2, y + 13, glow ? '#ff8fa3' : '#d2445e', {
    shine: shine !== undefined ? shine - 8 : undefined, shineCol: glow ? '#ffffff' : '#ff9aae', glowCol: glow ? 'rgba(255,110,140,0.16)' : undefined,
  })
  // 2 chấm hồng nhấp nháy hai bên COFFEE
  if (Math.floor(t * 2) % 2 === 0) { px(c, x2 - 4, y + 15, 2, 1, '#ff9aa8'); px(c, x2 + textW(L2, SMALL) + 3, y + 15, 2, 1, '#ff9aa8') }
}
