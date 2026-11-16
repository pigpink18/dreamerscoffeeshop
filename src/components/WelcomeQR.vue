<script setup lang="ts">
// Màn chào mừng khách quét mã QR tại quán (đường dẫn có ?qr): Cáo ngồi trên bàn quán, lời chào gõ từng chữ.
// Cùng phong cách truyện mở đầu: khung tranh gỗ ốc đồng, cảnh pixel động, hộp thoại giấy kem. Chạm để sang câu tiếp.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { unlockAudio, sfx } from '../game/audio'
import { px, drawCorgi, CZ, woodFrame, rivet, spr, loadImages, type Ctx } from '../game/pixel'
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
const corgiCv = Object.assign(document.createElement('canvas'), { width: 32, height: 28 })
function draw(t: number) {
  const c = cv.value?.getContext('2d')
  if (!c) return
  c.imageSmoothingEnabled = false
  const l = li.value, lt = (performance.now() - lineStart) / 1000
  // ---- tường: xanh rêu đậm dần lên trần, ván dọc có gờ sáng ----
  for (let y = 0; y < 56; y++) px(c, 0, y, W, 1, y < 18 ? CZ.t0 : CZ.t1)
  for (let y = 14; y < 22; y++) if ((y + 0) % 2 === 0) px(c, 0, y, W, 1, CZ.t1)
  for (let x = 3; x < W; x += 9) { px(c, x, 0, 1, 40, CZ.t0); px(c, x + 1, 0, 1, 40, CZ.t2) }
  // ốp gỗ chân tường + nẹp
  px(c, 0, 40, W, 16, CZ.w2); px(c, 0, 40, W, 2, CZ.w4); px(c, 0, 42, W, 1, CZ.w1)
  for (let x = 4; x < W; x += 20) { px(c, x, 45, 16, 9, CZ.w1); px(c, x + 1, 46, 14, 7, CZ.w2); px(c, x + 1, 46, 14, 1, CZ.w3) }
  // ---- cửa sổ: chiều Đà Lạt, rèm kem sọc đỏ, chậu tulip trên bậu ----
  woodFrame(c, 9, 7, 32, 24)
  for (let y = 7; y < 31; y++) px(c, 9, y, 32, 1, y < 19 ? (y < 13 ? '#ffc98f' : '#ffe0b0') : '#bfe3f5')
  px(c, 30, 10, 5, 5, '#fff3c4'); px(c, 31, 9, 3, 7, '#fff3c4')
  for (let i = 0; i < 5; i++) { const x = 10 + i * 7; px(c, x + 2, 19, 2, 3, '#3d6b4f'); px(c, x + 1, 22, 4, 3, '#2f5a42'); px(c, x, 25, 6, 6, '#2f5a42') }
  px(c, 24, 7, 2, 24, CZ.w2); px(c, 9, 18, 32, 1, CZ.w2)
  for (const cx of [4, 40]) { px(c, cx, 4, 6, 30, '#f4e4c8'); px(c, cx, 4, 1, 30, '#e0c9a4'); px(c, cx + 2, 4, 1, 30, '#d9534f'); px(c, cx, 33, 6, 1, '#d8c09a') }
  px(c, 2, 3, 46, 2, CZ.w1); px(c, 2, 3, 46, 1, CZ.w3)
  px(c, 6, 31, 38, 2, CZ.w4); px(c, 6, 33, 38, 1, CZ.w1)
  spr(c, 'tulip', 30, 31)
  // ---- biển gỗ + xích treo ----
  px(c, 70, 0, 1, 7, '#8f979e'); px(c, 107, 0, 1, 7, '#8f979e')
  woodFrame(c, 62, 7, 54, 13)
  px(c, 62, 7, 54, 13, '#4a2e1f'); px(c, 62, 7, 54, 1, '#5e4232')
  ptext(c, 'DREAMERS', 89, 9, '#ffe8b8')
  ptext(c, 'COFFEE', 89, 15, CZ.b2)
  rivet(c, 60, 5); rivet(c, 116, 5)
  // ---- kệ gỗ: hũ hạt, ly, xương rồng ----
  px(c, 66, 33, 56, 2, CZ.w4); px(c, 66, 35, 56, 1, CZ.w1); px(c, 70, 36, 2, 3, CZ.w1); px(c, 116, 36, 2, 3, CZ.w1)
  const jars = ['#6f4630', '#c98a52', '#e8c48a']
  jars.forEach((col, k) => { const x = 70 + k * 8; px(c, x, 25, 6, 8, CZ.ink); px(c, x + 1, 26, 4, 6, '#d6ecef'); px(c, x + 1, 28, 4, 4, col); px(c, x, 24, 6, 2, CZ.r1); px(c, x + 1, 26, 1, 2, '#ffffff') })
  for (let k = 0; k < 2; k++) { const x = 96 + k * 6; px(c, x, 28, 5, 5, CZ.ink); px(c, x + 1, 29, 3, 4, '#fffaf0'); px(c, x + 1, 29, 3, 1, CZ.w3) }
  spr(c, 'cactus', 107, 33)
  // ---- đèn thả + quầng sáng ----
  px(c, 52, 0, 1, 14, CZ.ink)
  px(c, 47, 14, 11, 4, CZ.ink); px(c, 48, 14, 9, 3, CZ.b1); px(c, 48, 14, 9, 1, CZ.b2); px(c, 50, 18, 5, 1, '#fff3b0')
  const fl = 0.13 + 0.02 * Math.sin(t * 3)
  c.fillStyle = `rgba(255, 226, 150, ${fl})`
  c.beginPath(); c.moveTo(48, 18); c.lineTo(57, 18); c.lineTo(76, 70); c.lineTo(28, 70); c.closePath(); c.fill()
  // ---- vệt nắng chéo từ cửa sổ + bụi lấp lánh ----
  c.fillStyle = 'rgba(255, 220, 160, 0.10)'
  c.beginPath(); c.moveTo(9, 7); c.lineTo(41, 7); c.lineTo(78, 92); c.lineTo(36, 92); c.closePath(); c.fill()
  for (let k = 0; k < 7; k++) {
    const u = (t * 0.06 + k * 0.143) % 1
    const dx = 20 + u * 40 + Math.sin(t + k) * 3, dy = 10 + u * 70
    if (Math.floor(t * 3 + k) % 3) px(c, Math.round(dx), Math.round(dy), 1, 1, 'rgba(255,245,210,0.8)')
  }
  // ---- mặt bàn gỗ: mép trước dày, vân gỗ ----
  px(c, 0, 56, W, 2, CZ.w5); px(c, 0, 58, W, 34, CZ.w3)
  for (let y = 61; y < H; y += 6) { px(c, 0, y, W, 1, CZ.w2); for (let x = (y * 7) % 23; x < W; x += 23) px(c, x, y + 2, 6, 1, CZ.w4) }
  c.fillStyle = 'rgba(38, 28, 27, 0.18)'; c.fillRect(0, 58, W, 3) // bóng tường đổ xuống bàn
  const shadow = (x: number, y: number, w: number) => { c.fillStyle = 'rgba(38, 28, 27, 0.28)'; c.beginPath(); c.ellipse(x, y, w, 2, 0, 0, Math.PI * 2); c.fill() }
  // ---- ly thuỷ tinh trong: cà phê sữa đá (sữa đặc đáy, cà phê trên, đá viên, ống hút, giọt nước đọng) ----
  shadow(27, 74, 9)
  // lót ly gỗ tròn
  px(c, 18, 71, 18, 3, CZ.ink); px(c, 19, 71, 16, 2, '#c98a52'); px(c, 19, 71, 16, 1, '#dab46d')
  const gx = 21, gy = 55, gw = 12, gh = 16 // thân ly (miệng rộng hơn đáy 1 điểm ảnh mỗi bên)
  for (let y = 0; y < gh; y++) {
    const inset = Math.floor((y / gh) * 2) // ly thon dần xuống đáy
    const x0 = gx + inset, w = gw - inset * 2
    px(c, x0 - 2, gy + y, 1, 1, CZ.ink); px(c, x0 + w + 1, gy + y, 1, 1, CZ.ink) // viền ngoài cho nổi khối
    px(c, x0 - 1, gy + y, 1, 1, '#cfe6ea'); px(c, x0 + w, gy + y, 1, 1, '#8fa5aa') // thành thuỷ tinh: sáng trái, tối phải
    let col = 'rgba(214, 236, 239, 0.35)' // phần trống phía trên: thuỷ tinh trong
    if (y >= 3 && y < 11) col = y < 5 ? '#8a5a3a' : '#5a3622' // cà phê đậm, mặt hơi sáng
    else if (y >= 11 && y < 13) col = '#c99a6b' // lớp hoà quyện
    else if (y >= 13) col = '#f3e3c4' // sữa đặc ở đáy
    px(c, x0, gy + y, w, 1, col)
  }
  px(c, gx - 2, gy - 1, gw + 4, 1, CZ.ink); px(c, gx - 1, gy, gw + 2, 1, '#e8f6f8') // vành miệng ly
  px(c, gx - 1, gy + gh, gw + 2, 2, CZ.ink); px(c, gx, gy + gh, gw, 1, '#a9c0c5'); px(c, gx, gy + gh - 1, gw, 1, 'rgba(255,255,255,0.25)') // đáy ly dày
  // đá viên trong ly (lắc lư nhẹ)
  const bob = Math.round(Math.sin(t * 1.6))
  for (const [ix, iy] of [[22, 4], [27, 3], [24, 7], [29, 7]] as const) {
    const y = gy + iy + (ix % 2 ? bob : 0)
    px(c, ix, y, 3, 3, 'rgba(225, 245, 250, 0.55)'); px(c, ix, y, 3, 1, 'rgba(255,255,255,0.85)'); px(c, ix, y, 1, 3, 'rgba(255,255,255,0.6)')
  }
  // ống hút sọc xanh trắng
  for (let k = 0; k < 13; k++) px(c, 30 - Math.floor(k / 4), gy - 5 + k, 1, 1, k % 4 < 2 ? '#3fb57b' : '#ffffff')
  // ánh sáng xuyên thuỷ tinh: vệt sáng dọc + điểm loé
  px(c, gx + 1, gy + 2, 1, gh - 5, 'rgba(255,255,255,0.75)'); px(c, gx + 3, gy + 3, 1, 4, 'rgba(255,255,255,0.4)')
  if (Math.floor(t * 1.2) % 4 === 0) { px(c, gx + 9, gy + 2, 1, 1, '#ffffff'); px(c, gx + 8, gy + 3, 3, 1, 'rgba(255,255,255,0.7)'); px(c, gx + 9, gy + 4, 1, 1, '#ffffff') }
  // giọt nước đọng ngoài thành ly, thỉnh thoảng một giọt chảy xuống
  for (const [dx, dy] of [[gx + 3, gy + 7], [gx + 9, gy + 10], [gx + 6, gy + 12], [gx + 10, gy + 5]] as const) px(c, dx, dy, 1, 1, 'rgba(255,255,255,0.7)')
  const drip = (t * 0.5) % 1
  px(c, gx + 7, gy + 5 + Math.round(drip * 9), 1, 2, `rgba(255,255,255,${(0.8 * (1 - drip)).toFixed(2)})`)
  // vũng nước nhỏ trên lót ly
  px(c, 22, 72, 8, 1, 'rgba(200, 235, 245, 0.45)')
  // ---- bánh kem dâu trên đĩa nhỏ ----
  shadow(49, 75, 7)
  px(c, 42, 72, 14, 3, CZ.ink); px(c, 43, 72, 12, 2, '#fffaf0')
  px(c, 44, 65, 10, 8, CZ.ink); px(c, 45, 66, 8, 2, '#fff4e4'); px(c, 45, 68, 8, 1, '#e8506a'); px(c, 45, 69, 8, 3, '#f6d9a8'); px(c, 45, 69, 8, 1, '#fff4e4')
  px(c, 47, 63, 3, 3, '#d8333a'); px(c, 48, 62, 1, 1, '#4f8a2e'); px(c, 47, 63, 1, 1, '#ff8a8a')
  // ---- kệ mica mã QR (3 ô định vị thật – không còn giống mặt người) ----
  shadow(65, 73, 9)
  px(c, 57, 70, 17, 3, CZ.w1); px(c, 57, 70, 17, 1, CZ.w4)
  px(c, 58, 50, 15, 21, CZ.ink); px(c, 59, 51, 13, 19, '#fffaf0')
  const finder = (x: number, y: number) => { px(c, x, y, 4, 4, '#3b2a20'); px(c, x + 1, y + 1, 2, 2, '#fffaf0'); px(c, x + 1, y + 1, 1, 1, '#3b2a20') }
  finder(60, 52); finder(67, 52); finder(60, 59)
  const dots = [[66, 58], [68, 59], [70, 58], [67, 61], [69, 62], [65, 62], [70, 61], [64, 57], [68, 57]]
  for (const [x, y] of dots) px(c, x, y, 1, 1, '#3b2a20')
  px(c, 60, 65, 11, 2, CZ.r1); px(c, 61, 68, 9, 1, '#d8c4a8') // nhãn đỏ + dòng chữ nhỏ dưới mã
  px(c, 59, 51, 1, 19, 'rgba(255,255,255,0.6)')
  // ---- nệm tròn cho Cáo ----
  shadow(100, 77, 21)
  px(c, 79, 66, 42, 10, CZ.ink); px(c, 80, 66, 40, 8, CZ.r1); px(c, 80, 66, 40, 2, CZ.r2); px(c, 81, 73, 38, 1, CZ.r0)
  for (let x = 83; x < 118; x += 6) px(c, x, 70, 2, 1, '#f2c14e')
  // câu 3: hộp quà nơ đỏ cạnh ly (quà tri ân) – nảy lên
  if (l >= 2 && l < 4) {
    const hop = l === 2 ? Math.max(0, Math.round(Math.sin(Math.min(lt, 0.5) / 0.5 * Math.PI) * 4)) : 0
    const gx = 1, gy = 60 - hop
    px(c, gx, gy, 14, 12, CZ.ink); px(c, gx + 1, gy + 1, 12, 10, '#e8506a'); px(c, gx + 1, gy + 1, 12, 2, '#ff7a8a')
    px(c, gx + 6, gy, 2, 12, '#f2c14e'); px(c, gx, gy + 4, 14, 2, '#f2c14e')
    px(c, gx + 3, gy - 3, 3, 3, '#f2c14e'); px(c, gx + 8, gy - 3, 3, 3, '#f2c14e')
  }
  // câu 4: danh thiếp pigpink18 + bút trên bàn
  if (l === 3) {
    const sy = Math.round(Math.max(0, 8 - lt * 24))
    const bx = 38, by = 75 + sy
    px(c, bx, by, 52, 16, CZ.ink); px(c, bx + 1, by + 1, 50, 14, '#ffe4ec'); px(c, bx + 1, by + 12, 50, 3, '#ff9ac1')
    // mặt heo hồng pixel
    px(c, bx + 3, by + 5, 8, 7, '#ff9ac1'); px(c, bx + 3, by + 4, 2, 2, '#ff7ab0'); px(c, bx + 9, by + 4, 2, 2, '#ff7ab0')
    px(c, bx + 5, by + 8, 4, 3, '#ff7ab0'); px(c, bx + 5, by + 9, 1, 1, CZ.ink); px(c, bx + 8, by + 9, 1, 1, CZ.ink)
    px(c, bx + 4, by + 6, 1, 1, CZ.ink); px(c, bx + 9, by + 6, 1, 1, CZ.ink)
    ptext(c, 'PIGPINK18', bx + 31, by + 4, '#8a2b52')
    px(c, bx + 15, by + 10, 30, 1, '#e8a0bc')
  }
  // Cáo ngồi trên bàn, vẫy đuôi; câu cuối đứng dậy mừng
  // Cáo to hơn cảnh 1.5 lần: vẽ ở canvas phụ rồi phóng (giữ nét pixel)
  const oc = corgiCv.getContext('2d')!
  oc.clearRect(0, 0, corgiCv.width, corgiCv.height)
  drawCorgi(oc, 2, 6, t, l === LINES.length - 1 ? 'stand' : 'sit', true, { neck: 'bow' })
  c.drawImage(corgiCv, 0, 0, 32, 28, 79, 32, 48, 42)
  // bóng thoại nhỏ: tim nảy trên đầu Cáo
  if (Math.floor(t * 2) % 2 === 0) { const hx = 112, hy = 27; px(c, hx, hy, 2, 2, '#ff7a8a'); px(c, hx + 3, hy, 2, 2, '#ff7a8a'); px(c, hx, hy + 2, 5, 1, '#ff7a8a'); px(c, hx + 1, hy + 3, 3, 1, '#ff7a8a'); px(c, hx + 2, hy + 4, 1, 1, '#ff7a8a') }
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
  loadImages()
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
