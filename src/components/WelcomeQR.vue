<script setup lang="ts">
// Màn chào mừng khách quét mã QR tại quán (đường dẫn có ?qr): Cáo ngồi trên bàn quán, lời chào gõ từng chữ.
// Cùng phong cách truyện mở đầu: khung tranh gỗ ốc đồng, cảnh pixel động, hộp thoại giấy kem. Chạm để sang câu tiếp.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { unlockAudio, sfx } from '../game/audio'
import { px, drawCorgi, CZ, woodFrame, rivet, type Ctx } from '../game/pixel'
import TypeText from './TypeText.vue'
import PixelIcon from './ui/PixelIcon.vue'
import { L } from '../game/i18n'

const emit = defineEmits<{ done: [] }>()
const W = 128, H = 92

const LINES = [
  { who: 'Cáo', text: L('Gâu! Chào mừng bạn đến với Dreamers Coffee, tiệm cà phê nhỏ của tụi mình!', 'Woof! Welcome to Dreamers Coffee, our little café!') },
  { who: 'Cáo', text: L('Cảm ơn bạn đã ghé quán và đồng hành cùng tụi mình trong suốt thời gian qua. Mỗi lần bạn ghé là một ngày vui của quán đó!', 'Thank you for stopping by and for being with us all this time. Every visit of yours makes our day!') },
  { who: 'Cáo', text: L('Trong lúc ngồi đợi nước, mời bạn chơi thử trò chơi nhỏ này nhé, xem như một món quà tri ân tụi mình gửi tới bạn.', "While you wait for your drink, enjoy this little game. It's our small thank-you gift to you.") },
  { who: 'pigpink18', text: L('Game do nhà phát triển độc lập pigpink18 làm. Nếu bạn muốn làm app hay website quảng bá thương hiệu, cứ để lại liên hệ tại quầy, pigpink sẽ liên lạc với bạn.', 'This game is made by indie developer pigpink18. Want an app or a website for your brand? Leave your contact at the counter and pigpink will get in touch.') },
  { who: 'Cáo', text: L('Chúc bạn có những phút giây thật thư giãn trong game. Mời bạn vào quán!', 'Wishing you a relaxing time in the game. Come on in!') },
]
const li = ref(0)
const typer = ref<InstanceType<typeof TypeText> | null>(null)
const isLast = computed(() => li.value === LINES.length - 1)
let lineStart = performance.now()

function next() {
  unlockAudio()
  if (typer.value && !typer.value.finished) { typer.value.skip(); return }
  if (isLast.value) return finish()
  li.value++
  lineStart = performance.now()
  sfx('tap')
}
function finish() {
  unlockAudio()
  try { localStorage.setItem('dc-qr-welcome', '1') } catch { /* bỏ qua */ }
  sfx('done')
  emit('done')
}

// ---------- cảnh pixel: góc bàn quán, ly cà phê + thẻ QR, Cáo ngồi trên ghế ----------
const cv = ref<HTMLCanvasElement | null>(null)
let raf = 0
function draw(t: number) {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.imageSmoothingEnabled = false
  const l = li.value, lt = (performance.now() - lineStart) / 1000
  // tường xanh quán + ván dọc
  px(c, 0, 0, W, 58, CZ.t1)
  for (let x = 4; x < W; x += 8) px(c, x, 0, 1, 58, CZ.t2)
  // khung cửa sổ: phố Đà Lạt buổi chiều
  woodFrame(c, 10, 8, 34, 24)
  px(c, 10, 8, 34, 24, '#ffd9a8'); px(c, 10, 20, 34, 12, '#a8d4ec')
  for (let i = 0; i < 5; i++) { const x = 11 + i * 7; px(c, x + 2, 21, 2, 4, '#3d6b4f'); px(c, x, 25, 6, 5, '#2f5a42') }
  px(c, 26, 8, 2, 24, CZ.w2); px(c, 10, 19, 34, 1, CZ.w2)
  // biển gỗ treo tường: DREAMERS COFFEE
  woodFrame(c, 60, 8, 58, 12)
  px(c, 60, 8, 58, 12, '#4a2e1f')
  ptext(c, 'DREAMERS', 89, 9, '#ffe8b8')
  ptext(c, 'COFFEE', 89, 15, CZ.b2)
  rivet(c, 58, 6); rivet(c, 118, 6)
  // dây đèn
  for (let x = 2; x < W; x += 6) {
    const y = 34 + Math.round(3 * Math.sin((x / W) * Math.PI))
    px(c, x, y, 1, 1, CZ.ink)
    px(c, x, y + 1, 2, 2, ['#ffd36b', '#ff9aa8', '#9be3c4'][(((x / 6) | 0) + Math.floor(t * 2.5)) % 3])
  }
  // mặt bàn gỗ
  px(c, 0, 58, W, 3, CZ.w4); px(c, 0, 61, W, 31, CZ.w3)
  for (let y = 64; y < H; y += 5) px(c, 0, y, W, 1, CZ.w2)
  px(c, 0, 58, W, 1, CZ.w5)
  // ly cà phê sứ + đĩa, khói bay
  px(c, 18, 70, 22, 3, CZ.ink); px(c, 19, 70, 20, 2, '#f4efe6')
  px(c, 22, 58, 14, 13, CZ.ink); px(c, 23, 59, 12, 11, '#fffaf0'); px(c, 23, 59, 12, 2, '#6f4630'); px(c, 24, 59, 4, 1, '#a0704a')
  px(c, 36, 61, 3, 6, CZ.ink); px(c, 36, 62, 2, 4, '#fffaf0')
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.7 + i / 3) % 1
    px(c, 26 + i * 3 + Math.round(Math.sin(t * 3 + i) * 1.5), Math.round(56 - k * 14), 1, 2, `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(2)})`)
  }
  // thẻ QR dựng trên bàn
  px(c, 46, 46, 18, 22, CZ.ink); px(c, 47, 47, 16, 20, '#fffaf0')
  const qr = [0b1110111, 0b1010101, 0b1110111, 0b0001000, 0b1101011, 0b0110110, 0b1011101]
  qr.forEach((row, y) => { for (let x = 0; x < 7; x++) if (row & (1 << (6 - x))) px(c, 48 + x * 2, 49 + y * 2, 2, 2, '#3b2a20') })
  px(c, 49, 64, 12, 1, CZ.r1)
  px(c, 50, 68, 10, 2, CZ.w1)
  // câu 3: hộp quà nơ đỏ cạnh ly (quà tri ân) – nảy lên
  if (l >= 2 && l < 4) {
    const hop = l === 2 ? Math.max(0, Math.round(Math.sin(Math.min(lt, 0.5) / 0.5 * Math.PI) * 4)) : 0
    const gx = 4, gy = 60 - hop
    px(c, gx, gy, 14, 12, CZ.ink); px(c, gx + 1, gy + 1, 12, 10, '#e8506a'); px(c, gx + 1, gy + 1, 12, 2, '#ff7a8a')
    px(c, gx + 6, gy, 2, 12, '#f2c14e'); px(c, gx, gy + 4, 14, 2, '#f2c14e')
    px(c, gx + 3, gy - 3, 3, 3, '#f2c14e'); px(c, gx + 8, gy - 3, 3, 3, '#f2c14e')
  }
  // câu 4: danh thiếp pigpink18 + bút trên bàn
  if (l === 3) {
    const sy = Math.round(Math.max(0, 8 - lt * 24))
    const bx = 62, by = 72 + sy
    px(c, bx, by, 52, 16, CZ.ink); px(c, bx + 1, by + 1, 50, 14, '#ffe4ec'); px(c, bx + 1, by + 12, 50, 3, '#ff9ac1')
    // mặt heo hồng pixel
    px(c, bx + 3, by + 5, 8, 7, '#ff9ac1'); px(c, bx + 3, by + 4, 2, 2, '#ff7ab0'); px(c, bx + 9, by + 4, 2, 2, '#ff7ab0')
    px(c, bx + 5, by + 8, 4, 3, '#ff7ab0'); px(c, bx + 5, by + 9, 1, 1, CZ.ink); px(c, bx + 8, by + 9, 1, 1, CZ.ink)
    px(c, bx + 4, by + 6, 1, 1, CZ.ink); px(c, bx + 9, by + 6, 1, 1, CZ.ink)
    ptext(c, 'PIGPINK18', bx + 31, by + 4, '#8a2b52')
    px(c, bx + 15, by + 10, 30, 1, '#e8a0bc')
  }
  // Cáo ngồi trên bàn, vẫy đuôi; câu cuối đứng dậy mừng
  drawCorgi(c, 78, 44, t, l === LINES.length - 1 ? 'stand' : 'sit', true, { neck: 'bow' })
  // bóng thoại nhỏ: tim nảy trên đầu Cáo
  if (Math.floor(t * 2) % 2 === 0) { const hx = 98, hy = 36; px(c, hx, hy, 2, 2, '#ff7a8a'); px(c, hx + 3, hy, 2, 2, '#ff7a8a'); px(c, hx, hy + 2, 5, 1, '#ff7a8a'); px(c, hx + 1, hy + 3, 3, 1, '#ff7a8a'); px(c, hx + 2, hy + 4, 1, 1, '#ff7a8a') }
  // câu cuối: pháo giấy
  if (l === LINES.length - 1) {
    const cols = ['#ff6b81', '#f2c14e', '#5b8bd9', '#2f9e6b', '#ffffff']
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2, sp = 18 + (i % 5) * 7, k = Math.min(lt, 1.3)
      const fx = 64 + Math.cos(a) * sp * k, fy = 30 + Math.sin(a) * sp * k + lt * lt * 9
      if (fy < H) px(c, Math.round(fx), Math.round(fy), 2, 1 + (i % 2), cols[i % 5])
    }
  }
  // khung tối nhẹ mép trên/dưới
  c.fillStyle = 'rgba(20, 14, 10, 0.18)'
  c.fillRect(0, 0, W, 2); c.fillRect(0, H - 2, W, 2)
}
// chữ pixel 3x5 (nét, không nhoè như chữ vector khi phóng to)
const F35: Record<string, string> = {
  A: '010101111101101', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', I: '111010010010111', K: '101101110101101', M: '101111111101101', N: '110101101101101',
  O: '010101101101010', P: '110101110100100', R: '110101110101101', S: '011100010001110', '1': '010110010010111',
  '8': '010101010101010', ' ': '000000000000000',
}
function ptext(c: Ctx, text: string, cx: number, y: number, col: string, k = 1) {
  const w = text.length * 4 * k - k
  let x = Math.round(cx - w / 2)
  for (const ch of text.toUpperCase()) {
    const g = F35[ch] ?? F35[' ']
    for (let i = 0; i < 15; i++) if (g[i] === '1') px(c, x + (i % 3) * k, y + Math.floor(i / 3) * k, k, k, col)
    x += 4 * k
  }
}
function loop(now: number) { draw(now / 1000); raf = requestAnimationFrame(loop) }
onMounted(() => {
  const c = cv.value
  if (c) { c.width = W; c.height = H }
  raf = requestAnimationFrame(loop)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="welcome" @click="next">
    <div class="wrap">
      <div class="top">
        <span class="ttl">{{ L('Chào mừng · Dreamers Coffee', 'Welcome · Dreamers Coffee') }}</span>
        <button class="skip" @click.stop="finish">{{ L('Bỏ qua', 'Skip') }} <PixelIcon name="play" :size="2" /></button>
      </div>
      <div class="stage">
        <canvas ref="cv" class="cv" />
        <div class="dots"><i v-for="(_, i) in LINES" :key="i" :class="{ on: i === li, done: i < li }" /></div>
      </div>
      <div class="box">
        <span class="who" :class="{ dev: LINES[li].who !== 'Cáo' }">{{ LINES[li].who }}</span>
        <TypeText ref="typer" :key="li" :text="LINES[li].text" :speed="24" :pitch="LINES[li].who === 'Cáo' ? 720 : 560" />
        <div class="nav">
          <span class="hint">{{ L('chạm để tiếp', 'tap to continue') }}</span>
          <button v-if="isLast" class="go" @click.stop="finish"><PixelIcon name="cup" :size="2" /> {{ L('Vào quán thôi!', 'Come on in!') }}</button>
          <button v-else class="nxt" @click.stop="next">{{ L('Tiếp', 'Next') }} ▶</button>
        </div>
      </div>
      <p class="credit">{{ L('Game làm bởi', 'Made by') }} <b>pigpink18</b> · {{ L('nhận làm app & website quảng bá thương hiệu', 'apps & brand websites') }}</p>
    </div>
  </div>
</template>

<style scoped>
.welcome {
  position: absolute; inset: 0; z-index: 120; display: flex; flex-direction: column; align-items: center;
  background: #241812; color: #ffe8b8; padding: calc(var(--safe-top, 0px) + 10px) 14px calc(env(safe-area-inset-bottom, 0px) + 18px);
  user-select: none; -webkit-user-select: none; overflow-y: auto;
}
.wrap { width: 100%; max-width: 480px; margin: auto 0; display: flex; flex-direction: column; }
.top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ttl { font-size: 11px; font-weight: 900; letter-spacing: 0.16em; color: #e6c79c; text-transform: uppercase; }
.skip, .go { display: inline-flex; align-items: center; gap: 6px; }
.skip { font-size: 12px; font-weight: 900; padding: 4px 10px 6px; background: #4a2e1f; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -3px 0 #3b2318; }
.stage { position: relative; box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #80502c, 0 0 0 7px #bf8a4a, 0 0 0 10px #261c1b, 0 10px 0 10px rgba(0, 0, 0, 0.3); margin: 10px; }
.stage::before, .stage::after { content: ''; position: absolute; top: -8px; width: 4px; height: 4px; background: #d5a534; pointer-events: none; }
.stage::before { left: -8px; } .stage::after { right: -8px; }
.cv { display: block; width: 100%; aspect-ratio: 128 / 92; image-rendering: pixelated; image-rendering: crisp-edges; }
.dots { position: absolute; left: 0; right: 0; bottom: -24px; display: flex; justify-content: center; gap: 6px; }
.dots i { width: 8px; height: 4px; background: #5a4334; transition: width 0.3s, background 0.3s; }
.dots i.done { background: #a16b36; }
.dots i.on { width: 16px; background: #d5a534; }
.box {
  position: relative; margin: 44px 7px 0; background: #fff4dc; color: #261c1b; padding: 16px 14px 12px; font-size: 16px; line-height: 1.5; font-weight: 600;
  box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #a16b36, 0 0 0 9px #261c1b, inset 0 -4px 0 #eed59b, 0 9px 0 9px rgba(0, 0, 0, 0.3); min-height: 150px;
  display: flex; flex-direction: column; gap: 8px;
}
/* bảng tên người nói (như hộp thoại trong game) */
.who { position: absolute; left: 10px; top: -16px; font-size: 12px; font-weight: 900; letter-spacing: 0.06em; color: #fff; background: #2f9e6b; padding: 3px 10px 4px; box-shadow: 0 0 0 3px #261c1b, inset 0 -3px 0 #1d6b47; }
.who.dev { background: #d9608f; box-shadow: 0 0 0 3px #261c1b, inset 0 -3px 0 #a8406a; }
.nav { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
.hint { font-size: 11px; color: #a16b36; animation: blink 1.4s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.35; } }
.nxt, .go { font-weight: 900; font-size: 14px; padding: 7px 14px 9px; }
.nxt { background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b; }
.go { background: #2f9e6b; color: #fff; box-shadow: var(--px-border-2), inset 0 -4px 0 #1d6b47; }
.credit { margin-top: 22px; text-align: center; font-size: 11px; color: #a88a6c; }
.credit b { color: #ff9ac1; }
</style>
