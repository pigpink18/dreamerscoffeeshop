// Vẽ 6 BOSS pixel art (24x32, vẽ trong tools/bosses.py -> bossArt.ts) + biểu cảm theo tâm trạng.
// Boss to hơn khách thường một chút (đầu bo tròn, có vai, tay, áo có nếp và đổ bóng) để nổi bật khi xuất hiện.
import { BOSS_ART, BOSS_FACE, BOSS_W, BOSS_H } from './bossArt'
import type { Ctx, Mood } from './pixel'

export { BOSS_W, BOSS_H }
const OUT = '#3b2a20'
const PUPIL = '#2b1d16'

function dot(c: Ctx, x: number, y: number, col: string, w = 1, h = 1) {
  c.fillStyle = col
  c.fillRect(Math.round(x), Math.round(y), w, h)
}

/** Đeo kính râm che mắt: không vẽ lại mắt, chỉ đổi lông mày + miệng */
const SHADES = new Set(['tycoon', 'sunhat'])
/** Ria che miệng */
const MUSTACHE = new Set(['mustache'])
/** Kính đít chai: mắt to */
const BIG_EYES = new Set<string>()

/**
 * Vẽ boss số `idx`, góc trên-trái (x, y), khung 24x32 (phần dưới bị quầy che).
 * mood: grumpy (mặc định, lườm) · angry (sắp hết giờ, quát) · happy / love (thua tâm phục, cười nhếch) · sad
 */
export function drawBoss(c: Ctx, idx: number, x: number, y: number, mood: Mood, blink: boolean) {
  const art = BOSS_ART[((idx % BOSS_ART.length) + BOSS_ART.length) % BOSS_ART.length]
  const { grid, pal } = art
  for (let r = 0; r < BOSS_H; r++) {
    const row = grid[r]
    for (let col = 0; col < BOSS_W; col++) {
      const ch = row[col]
      if (ch === '.') continue
      c.fillStyle = pal[ch] || '#ff00ff'
      c.fillRect(x + col, y + r, 1, 1)
    }
  }
  const skin = pal.s
  const { eyeL, eyeR, eyeY } = BOSS_FACE
  const shades = SHADES.has(art.id)
  const big = BIG_EYES.has(art.id)
  const happy = mood === 'happy' || mood === 'love'

  // ---- mắt (con ngươi 2x2 tại eyeL / eyeR) ----
  if (!shades) {
    for (const ex of [eyeL, eyeR]) {
      const x0 = big ? ex - 1 : ex, w = big ? 4 : 2
      if (blink || happy) {
        // nhắm / cười híp: vạch cong
        dot(c, x + x0, y + eyeY - (big ? 1 : 0), skin, w, big ? 4 : 2)
        if (big) { dot(c, x + x0, y + eyeY - 1, pal.l || skin, w, 4) }
        dot(c, x + x0, y + eyeY + 1, OUT, w, 1)
        if (happy && !blink) { dot(c, x + x0, y + eyeY, OUT, 1, 1); dot(c, x + x0 + w - 1, y + eyeY, OUT, 1, 1); dot(c, x + x0 + 1, y + eyeY + 1, big ? (pal.l || skin) : skin, w - 2, 1) }
      } else if (mood === 'grumpy') {
        // lườm: mí trên sụp xuống 1 hàng nhưng vẫn thấy con ngươi
        dot(c, x + x0, y + eyeY - (big ? 1 : 0), OUT, w, 1)
      } else if (mood === 'angry') {
        // trợn mắt: con ngươi co lại
        dot(c, x + x0, y + eyeY - (big ? 1 : 0), '#ffffff', w, big ? 4 : 2)
        dot(c, x + x0 + (big ? 1 : 0) + (ex === eyeL ? 1 : 0), y + eyeY + (big ? 0 : 0), PUPIL, 1, big ? 2 : 2)
      }
    }
  }
  // ---- lông mày ----
  const browCol = MUSTACHE.has(art.id) ? pal.H : OUT
  const by = y + eyeY - (shades ? 3 : big ? 3 : 2)
  if (mood === 'angry') {
    // chữ V gắt: đầu trong kéo xuống
    dot(c, x + 6, by - 1, browCol, 2, 1); dot(c, x + 8, by, browCol, 2, 1); dot(c, x + 10, by + 1, browCol, 1, 1)
    dot(c, x + 16, by - 1, browCol, 2, 1); dot(c, x + 14, by, browCol, 2, 1); dot(c, x + 13, by + 1, browCol, 1, 1)
  } else if (mood === 'sad') {
    dot(c, x + 8, by - 1, browCol, 2, 1); dot(c, x + 6, by, browCol, 2, 1)
    dot(c, x + 14, by - 1, browCol, 2, 1); dot(c, x + 16, by, browCol, 2, 1)
  } else if (happy && !MUSTACHE.has(art.id)) {
    // nhướng 1 bên mày: "cũng được đấy"
    dot(c, x + 14, by - 1, browCol, 3, 1)
  }
  // ---- má đỏ + hơi bốc lên đầu khi tức ----
  if (mood === 'angry') {
    dot(c, x + 5, y + 15, '#ff5f5f', 2, 1); dot(c, x + 17, y + 15, '#ff5f5f', 2, 1)
    // dấu "nổi gân" đỏ kiểu truyện tranh ở góc đầu
    const ax = x + 19, ay = y + 1
    for (const [dx, dy] of [[1, 0], [3, 0], [0, 1], [1, 1], [3, 1], [4, 1], [0, 3], [1, 3], [3, 3], [4, 3], [1, 4], [3, 4]]) dot(c, ax + dx, ay + dy, '#e8343a')
  }
  // ---- miệng (hàng 16–17, cột 10–13) ----
  if (MUSTACHE.has(art.id)) {
    if (happy) dot(c, x + 9, y + 17, '#8a3a2a', 6, 1)
    else if (mood === 'angry') { dot(c, x + 10, y + 17, OUT, 4, 1); dot(c, x + 11, y + 18, '#e86a5a', 2, 1) }
    return
  }
  const lipsArt = art.grid[16][11] === 'r'
  const lip = lipsArt ? pal.r : '#8a3a2a'
  if (happy) {
    dot(c, x + 9, y + 16, skin, 6, 2)
    dot(c, x + 10, y + 17, lip, 4, 1); dot(c, x + 14, y + 16, lip, 1, 1) // nhếch mép
    if (art.id === 'tycoon') dot(c, x + 12, y + 17, '#ffd34d', 1, 1) // răng vàng
  } else if (mood === 'angry') {
    dot(c, x + 9, y + 16, skin, 6, 2)
    dot(c, x + 10, y + 16, OUT, 4, 2); dot(c, x + 11, y + 17, '#e86a5a', 2, 1) // há miệng quát
  }
}

/** Màu da của boss (để vẽ bàn tay cầm ly) */
export const bossSkin = (idx: number) => BOSS_ART[((idx % BOSS_ART.length) + BOSS_ART.length) % BOSS_ART.length].pal.s
