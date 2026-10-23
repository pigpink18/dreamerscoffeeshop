<script setup lang="ts">
// Truyện mở đầu: Yến, 24 tuổi, bỏ Hà Nội vào Đà Lạt, gặp bé corgi Cáo và cùng mở Dreamers Coffee.
// Mỗi cảnh vẽ pixel bằng canvas + lời kể gõ từng chữ. Chạm để hiện hết / sang câu tiếp.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { save, ui, persist } from '../game/store'
import { unlockAudio, sfx } from '../game/audio'
import { px, box, shade, drawPerson, drawCorgi, OUT, type Ctx } from '../game/pixel'
import type { Look } from '../game/data'
import TypeText from './TypeText.vue'
import logoUrl from '../assets/logo.png'

const W = 128, H = 92
const SCENES: { title: string; lines: string[]; draw: (c: Ctx, t: number) => void }[] = [
  { title: 'Hà Nội · 2:00 sáng', lines: [
    'Hà Nội, 2 giờ sáng. {name}, 24 tuổi, đang sửa slide lần thứ 17 cho sếp.',
    'Cốc Americano thứ tư nguội ngắt. Cô chợt nghĩ: “Mình sống để chạy deadline hả trời?”',
  ], draw: sceneOffice },
  { title: 'Đèo Prenn · sương sớm', lines: [
    'Sáng hôm sau, {name} nộp đơn nghỉ việc, gom hết can đảm và… hai cái vali, bay một mạch từ Hà Nội vào Nam.',
    'Xe từ sân bay Liên Khương leo đèo Prenn. Sương giăng kín đồi thông. Đà Lạt đón cô bằng 16 độ và mùi cà phê rang.',
  ], draw: sceneBus },
  { title: 'Cuối con dốc nhỏ', lines: [
    'Cuối con dốc có một quán cà phê cũ, treo tấm biển “CHO THUÊ” bạc màu.',
    'Trước cửa… một bé corgi mập ú, lông muối tiêu lốm đốm, ngồi canh như chủ nhà.',
  ], draw: sceneOldShop },
  { title: 'Đồng sáng lập', lines: [
    'Bé không chịu đi đâu hết, cứ dụi cái mông tròn vào chân cô.',
    'Cô đặt tên bé là Cáo, vì cái mặt lém lỉnh y chang con cáo. Vậy là quán có đồng sáng lập lương trả bằng pate.',
  ], draw: sceneMeet },
  { title: 'Ba tuần sửa quán', lines: [
    'Hai đứa dọn dẹp ba tuần liền: sơn tường, lau máy, còn Cáo thì phụ… làm đổ sơn.',
    'Tấm biển mới được treo lên: DREAMERS COFFEE quán của những người dám mơ mộng.',
  ], draw: scenePaint },
  { title: 'Ngày khai trương', lines: [
    'Sáng nay, Dreamers Coffee mở cửa ngày đầu tiên.',
    'Pha từng ly thật ngon, chiều cả những vị khách khó ở nhất. Sẵn sàng chưa, chủ quán {name}?',
  ], draw: sceneOpen },
]

// ---------- trạng thái ----------
const stage = ref<'title' | 'story'>('title')
const si = ref(0) // cảnh
const li = ref(0) // câu trong cảnh
const typer = ref<InstanceType<typeof TypeText> | null>(null)
const scene = computed(() => SCENES[si.value])
const line = computed(() => scene.value.lines[li.value].replace(/\{name\}/g, save.player || 'Yến'))
const isLast = computed(() => si.value === SCENES.length - 1 && li.value === scene.value.lines.length - 1)

function begin() {
  unlockAudio()
  stage.value = 'story'
  sceneStart = performance.now()
  sfx('bell')
}
function next() {
  if (typer.value && !typer.value.finished) { typer.value.skip(); return }
  if (isLast.value) return
  if (li.value < scene.value.lines.length - 1) li.value++
  else { si.value++; li.value = 0; sceneStart = performance.now(); sfx('tap') }
}
function finish() {
  save.introSeen = true
  ui.showIntro = false
  persist()
  sfx('done')
}

// ---------- canvas ----------
const cv = ref<HTMLCanvasElement | null>(null)
let ctx: Ctx | null = null
let raf = 0
let sceneStart = performance.now()
const K = 6 // độ phân giải nội bộ (CSS tự co giãn, giữ nét pixel)
function frame(now: number) {
  raf = requestAnimationFrame(frame)
  if (!ctx) return
  const t = (now - sceneStart) / 1000
  ctx.setTransform(K, 0, 0, K, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, W, H)
  scene.value.draw(ctx, t)
  // chuyển cảnh: mở màn đen
  if (t < 0.5) { ctx.fillStyle = `rgba(20,14,10,${1 - t / 0.5})`; ctx.fillRect(0, 0, W, H) }
}
onMounted(() => {
  const el = cv.value!
  el.width = W * K; el.height = H * K
  ctx = el.getContext('2d')
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))

// ---------- nhân vật ----------
const girl = (shirt: string): Look => ({ skin: '#f3c9a6', hair: '#3a2219', style: 'long', shirt, acc: ['blush'] })
const OFFICE = girl('#6c7a99'), TRAVEL = girl('#c8705a'), BARISTA = girl('#7fb8a4')

/** cô gái đứng nguyên người: thân trên (drawPerson) + váy/quần + chân */
function standGirl(c: Ctx, L: Look, x: number, y: number, mood: Parameters<typeof drawPerson>[4], walk = 0) {
  drawPerson(c, L, x, y, mood, false)
  px(c, x + 2, y + 28, 12, 4, '#4a5a7a') // quần jean
  px(c, x + 4, y + 32, 3, 5 - walk, '#4a5a7a'); px(c, x + 9, y + 32, 3, 5 - (walk ? 0 : 1), '#4a5a7a')
  px(c, x + 3, y + 37 - walk, 5, 2, OUT); px(c, x + 9, y + 37 - (walk ? 0 : 1), 5, 2, OUT)
}
function label(c: Ctx, text: string, x: number, y: number, col: string, size = 5, bold = true) {
  c.font = `${bold ? '900 ' : ''}${size}px ui-monospace, Menlo, monospace`
  c.textAlign = 'center'; c.textBaseline = 'middle'
  c.fillStyle = col
  c.fillText(text, x, y)
}
function fog(c: Ctx, t: number, y: number, a = 0.5, sp = 4) {
  for (let i = 0; i < 4; i++) {
    const x = ((t * sp * (1 + i * 0.3) + i * 40) % (W + 60)) - 50
    c.fillStyle = `rgba(255,255,255,${a * (0.5 + 0.15 * i)})`
    c.fillRect(Math.round(x), y + i * 3, 46, 3)
    c.fillRect(Math.round(x) + 6, y + i * 3 - 2, 30, 2)
  }
}
function pines(c: Ctx, off: number, base: number, col: string, gap: number, hgt: number) {
  for (let x = -gap + (Math.round(off) % gap); x < W + gap; x += gap) {
    for (let r = 0; r < hgt; r++) {
      const w = Math.max(1, Math.round((r / hgt) * 7)) * 2 - 1
      px(c, x - (w >> 1), base - hgt + r, w, 1, col)
    }
    px(c, x, base, 1, 2, shade(col, -20))
  }
}
function hill(c: Ctx, base: number, amp: number, col: string, ph: number) {
  for (let x = 0; x < W; x++) px(c, x, Math.round(base - amp * (0.5 + 0.5 * Math.sin(x / 18 + ph))), 1, H, col)
}
function sky(c: Ctx, top: string, bot: string) {
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, top); g.addColorStop(1, bot)
  c.fillStyle = g; c.fillRect(0, 0, W, H)
}
function heart(c: Ctx, x: number, y: number, col = '#ff6b81') {
  px(c, x, y, 2, 2, col); px(c, x + 3, y, 2, 2, col); px(c, x, y + 1, 5, 2, col); px(c, x + 1, y + 3, 3, 1, col); px(c, x + 2, y + 4, 1, 1, col)
}

// 1. Văn phòng Hà Nội lúc nửa đêm
function sceneOffice(c: Ctx, t: number) {
  px(c, 0, 0, W, H, '#1b2034')
  // cửa sổ thành phố
  box(c, 10, 6, 64, 40, '#0e1424', '#2a3150')
  const bld = [[12, 22, 10], [23, 14, 9], [33, 26, 12], [46, 10, 8], [55, 20, 10], [66, 16, 7]]
  for (const [bx, by, bw] of bld) {
    px(c, bx, 7 + by, bw, 38 - by, '#232b45')
    for (let wy = 9 + by; wy < 42; wy += 4) for (let wx = bx + 1; wx < bx + bw - 1; wx += 3) {
      if ((wx * 7 + wy * 13 + Math.floor(t * 0.7)) % 5 < 2) px(c, wx, wy, 1, 2, '#ffd36b')
    }
  }
  px(c, 41, 6, 1, 40, '#2a3150'); px(c, 10, 25, 64, 1, '#2a3150')
  // giấy note deadline
  const notes = ['#ffe36b', '#ff9aa8', '#9be3c4', '#ffe36b', '#ffb36b']
  notes.forEach((col, i) => { px(c, 82 + (i % 3) * 13, 8 + Math.floor(i / 3) * 12, 10, 9, col); px(c, 84 + (i % 3) * 13, 11 + Math.floor(i / 3) * 12, 6, 1, '#7a5a40') })
  label(c, 'DEADLINE!!', 101, 36, '#ff6b6b', 5)
  // cô gái mệt mỏi
  const bob = Math.floor(t * 1.2) % 2
  drawPerson(c, OFFICE, 52, 40 + bob, 'sad', Math.floor(t * 2) % 5 === 0)
  // bàn + laptop
  px(c, 0, 64, W, 28, '#5a3a28'); px(c, 0, 64, W, 2, '#7a5238')
  box(c, 44, 50, 32, 15, '#c9ced6', OUT)
  px(c, 46, 52, 28, 11, `rgba(150,200,255,${0.75 + 0.15 * Math.sin(t * 3)})`)
  px(c, 48, 55, 16, 1, '#5b7a99'); px(c, 48, 58, 22, 1, '#5b7a99'); px(c, 48, 61, 12, 1, '#e8503a')
  // ly cà phê nguội
  box(c, 86, 56, 8, 9, '#fffaf2', OUT); px(c, 87, 57, 6, 2, '#6f4e37'); px(c, 94, 59, 2, 3, OUT)
  box(c, 98, 58, 8, 7, '#fffaf2', OUT); box(c, 104, 59, 8, 6, '#fffaf2', OUT)
  // đồng hồ
  label(c, '02:00', 22, 72, '#ff6b6b', 6)
  if (Math.floor(t * 2) % 2) px(c, 22, 72, 1, 1, '#5a3a28')
}

// 2. Xe lên Đà Lạt qua đồi thông
function sceneBus(c: Ctx, t: number) {
  sky(c, '#9ec9e6', '#f6d6c8')
  // mặt trời
  box(c, 96, 10, 12, 12, '#ffe39a', '#ffd06b')
  hill(c, 46, 8, '#8fb7a5', 0.4 + t * 0.02)
  pines(c, -t * 6, 52, '#5e8f7a', 11, 14)
  fog(c, t, 40, 0.45, 5)
  hill(c, 62, 6, '#4f7f68', 1.2 + t * 0.05)
  pines(c, -t * 16, 66, '#2f5d4a', 15, 18)
  // đường
  px(c, 0, 72, W, 20, '#5b5650'); px(c, 0, 72, W, 2, '#7a746c')
  for (let i = 0; i < 6; i++) px(c, Math.round(((i * 26 - t * 40) % 156 + 156) % 156) - 20, 81, 12, 1, '#f2e6c9')
  // xe khách
  const b = Math.floor(t * 6) % 2
  const bx = 34, by = 50 - b
  box(c, bx, by, 54, 22, '#f2c14e', OUT)
  px(c, bx + 1, by + 14, 52, 3, '#2f9e6b')
  for (let i = 0; i < 5; i++) box(c, bx + 4 + i * 9, by + 3, 8, 8, '#bfe3f5', OUT)
  // cô gái nhìn ra cửa sổ
  px(c, bx + 32, by + 6, 4, 4, '#f3c9a6'); px(c, bx + 31, by + 4, 6, 3, '#3a2219'); px(c, bx + 31, by + 6, 1, 5, '#3a2219')
  px(c, bx + 35, by + 7, 1, 1, OUT)
  box(c, bx + 49, by + 3, 5, 10, '#bfe3f5', OUT)
  px(c, bx + 6, by + 21, 7, 4, OUT); px(c, bx + 40, by + 21, 7, 4, OUT)
  px(c, bx + 8, by + 22, 3, 2, '#9a9a9a'); px(c, bx + 42, by + 22, 3, 2, '#9a9a9a')
  // vali trên nóc
  box(c, bx + 10, by - 6, 10, 7, '#e8503a', OUT); box(c, bx + 22, by - 5, 8, 6, '#5b8bd9', OUT)
  fog(c, t + 20, 62, 0.35, 9)
  // biển chỉ đường
  const sx = Math.round(((110 - t * 22) % 190 + 190) % 190) - 30
  px(c, sx + 9, 52, 2, 20, '#7a5238'); box(c, sx, 44, 22, 9, '#2f9e6b', '#f4f4f0')
  label(c, 'ĐÀ LẠT', sx + 11, 48.5, '#ffffff', 4)
}

function facade(c: Ctx, wall: string, door: string) {
  px(c, 14, 20, 100, 58, wall)
  px(c, 10, 16, 108, 6, shade(wall, -45)) // mái
  for (let x = 10; x < 118; x += 6) px(c, x, 21, 3, 2, shade(wall, -60))
  box(c, 52, 46, 24, 32, door, OUT)
  px(c, 70, 61, 2, 2, '#f2c14e')
  // cửa sổ
  box(c, 22, 44, 22, 18, '#bfe3f5', OUT); box(c, 84, 44, 22, 18, '#bfe3f5', OUT)
  px(c, 33, 44, 1, 18, OUT); px(c, 95, 44, 1, 18, OUT)
  px(c, 0, 78, W, 14, '#8b7d6b'); px(c, 0, 78, W, 1, '#a99a86')
}

// 3. Quán cũ cho thuê + corgi canh cửa
function sceneOldShop(c: Ctx, t: number) {
  sky(c, '#c9d6de', '#e8e2d8')
  pines(c, 0, 24, '#7f9c90', 13, 12)
  facade(c, '#cbb79a', '#7a6650')
  // tường bong tróc + ván đóng cửa sổ
  px(c, 18, 28, 6, 3, '#b39d80'); px(c, 100, 32, 5, 4, '#b39d80'); px(c, 60, 26, 4, 2, '#b39d80')
  px(c, 22, 48, 22, 3, '#8a6a48'); px(c, 22, 55, 22, 3, '#8a6a48'); px(c, 84, 50, 22, 3, '#8a6a48')
  // mạng nhện
  px(c, 15, 23, 1, 4, '#e8e2d8'); px(c, 15, 23, 4, 1, '#e8e2d8'); px(c, 16, 24, 1, 1, '#e8e2d8')
  // biển CHO THUÊ
  const sw = Math.sin(t * 2) * 0.6
  px(c, 63, 30, 1, 4, OUT)
  box(c, 46, 33 + Math.round(sw), 36, 11, '#f4efe2', '#b3261e')
  label(c, 'CHO THUÊ', 64, 38.5 + Math.round(sw), '#b3261e', 5)
  // corgi ngồi canh cửa
  drawCorgi(c, 54, 62, t, 'sit', false)
  // cô gái kéo vali bước vào
  const gx = Math.min(16, -20 + t * 14)
  const walk = gx < 16 ? Math.floor(t * 8) % 2 : 0
  standGirl(c, TRAVEL, Math.round(gx), 39, 'neutral', walk)
  px(c, Math.round(gx) + 16, 62, 1, 6, OUT)
  box(c, Math.round(gx) + 15, 66, 9, 11, '#e8503a', OUT)
  if (gx >= 16) { // dấu chấm hỏi + chấm than
    const q = Math.floor(t * 2) % 2
    label(c, '!', 30, 42 - q, '#f2c14e', 7); label(c, '?', 82, 56 - q, '#ffffff', 6)
  }
  fog(c, t, 70, 0.35, 6)
}

// 4. Gặp Cáo
function sceneMeet(c: Ctx, t: number) {
  sky(c, '#fbe3c8', '#f6efe2')
  hill(c, 50, 6, '#c9d8c0', 0.8)
  pines(c, 0, 54, '#9ab5a0', 14, 13)
  px(c, 0, 66, W, 26, '#c4b08e'); px(c, 0, 66, W, 1, '#d8c6a4')
  fog(c, t, 44, 0.3, 3)
  const bob = Math.floor(t * 3) % 2
  standGirl(c, TRAVEL, 36, 27 - bob, 'love')
  // tay xoa đầu
  px(c, 51, 47 - bob, 5, 3, '#f3c9a6')
  drawCorgi(c, 54, 49, t, 'stand', true)
  // tim bay
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i / 3) % 1
    heart(c, 52 + i * 9 + Math.round(Math.sin(p * 6 + i) * 2), Math.round(46 - p * 34), i % 2 ? '#ff9aa8' : '#ff6b81')
  }
  // bát pate
  box(c, 84, 66, 12, 5, '#5b8bd9', OUT); px(c, 85, 66, 10, 1, '#b5835a')
  label(c, 'CÁO', 98, 82, '#6f4e37', 6)
}

// 5. Sơn sửa quán, treo biển mới
function scenePaint(c: Ctx, t: number) {
  px(c, 0, 0, W, H, '#f3e6d3')
  // tường sơn dở: nửa trái đã sơn xanh
  const p = Math.min(1, t / 4)
  px(c, 0, 0, Math.round(W * (0.3 + 0.7 * p)), 70, '#cfe8dc')
  px(c, 0, 70, W, 22, '#a9774f'); px(c, 0, 70, W, 2, '#c08a5c')
  for (let x = 0; x < W; x += 16) px(c, x, 72, 1, 20, '#8a5e3c')
  // biển hiệu hiện từng chữ
  const text = 'DREAMERS COFFEE'
  const n = Math.min(text.length, Math.floor(Math.max(0, t - 0.6) * 5))
  box(c, 20, 8, 88, 16, '#6f4630', OUT)
  px(c, 21, 9, 86, 2, '#8a5a3c')
  label(c, text.slice(0, n), 64, 16.5, '#ffe8b8', 7)
  // thang + cô gái cầm cọ
  for (let y = 28; y < 70; y += 6) px(c, 80, y, 14, 1, '#7a5238')
  px(c, 80, 26, 2, 44, '#7a5238'); px(c, 92, 26, 2, 44, '#7a5238')
  const arm = Math.floor(t * 4) % 2
  standGirl(c, BARISTA, 79, 22, 'happy')
  px(c, 92, 24 - arm * 2, 2, 8, '#c08a5c'); px(c, 91, 21 - arm * 2, 4, 3, '#2f9e6b')
  // xô sơn đổ + Cáo dính sơn
  box(c, 20, 60, 10, 10, '#d9d9d9', OUT); px(c, 21, 61, 8, 2, '#2f9e6b')
  px(c, 28, 69, 14, 2, '#2f9e6b'); px(c, 34, 68, 6, 1, '#2f9e6b')
  drawCorgi(c, 40, 56, t, 'stand', true)
  px(c, 47, 64, 3, 2, '#2f9e6b'); px(c, 58, 58, 2, 2, '#2f9e6b')
  // dấu chân xanh
  for (let i = 0; i < 4; i++) { px(c, 66 + i * 7, 78 + (i % 2) * 3, 2, 2, '#2f9e6b'); px(c, 69 + i * 7, 77 + (i % 2) * 3, 1, 1, '#2f9e6b') }
}

// 6. Khai trương
function sceneOpen(c: Ctx, t: number) {
  sky(c, '#8fd0f0', '#fde8c4')
  box(c, 100, 4, 14, 14, '#ffe39a', '#ffcf5c')
  pines(c, 0, 24, '#6fa38c', 13, 12)
  facade(c, '#f4e1c6', '#2f9e6b')
  // biển hiệu sáng
  box(c, 26, 25, 76, 14, '#6f4630', OUT)
  const glow = 0.5 + 0.5 * Math.sin(t * 4)
  label(c, 'DREAMERS COFFEE', 64, 32.5, glow > 0.2 ? '#ffe8b8' : '#e6c79c', 6)
  // dây đèn
  for (let x = 14; x < 114; x += 5) {
    const y = 42 + Math.round(2 * Math.sin((x - 14) / 100 * Math.PI))
    px(c, x, y, 1, 1, OUT)
    px(c, x, y + 1, 2, 2, ['#ffd36b', '#ff9aa8', '#9be3c4'][((x / 5) | 0 + Math.floor(t * 3)) % 3])
  }
  // biển OPEN + chậu cây
  box(c, 56, 50, 16, 7, '#fffaf2', OUT); label(c, 'OPEN', 64, 53.8, '#2f9e6b', 4)
  for (const x of [16, 104]) { box(c, x, 70, 9, 8, '#c0703e', OUT); px(c, x + 1, 62, 7, 8, '#4f9a5c'); px(c, x + 3, 60, 3, 3, '#6cc07a') }
  // cô chủ + corgi
  const wave = Math.floor(t * 3) % 2
  standGirl(c, BARISTA, 30, 39, 'happy')
  px(c, 45, 43 - wave * 3, 3, 6, '#f3c9a6')
  drawCorgi(c, 74, 62, t, 'stand', true)
  // pháo giấy
  const cols = ['#ff6b81', '#f2c14e', '#5b8bd9', '#2f9e6b', '#ffffff']
  for (let i = 0; i < 26; i++) {
    const fx = (i * 37 + Math.sin(t + i) * 6) % W
    const fy = ((t * (14 + (i % 5) * 4) + i * 11) % (H + 10)) - 10
    px(c, Math.round(fx), Math.round(fy), 2, 1 + (i % 2), cols[i % 5])
  }
}
</script>

<template>
  <div class="intro" @click="stage === 'story' && next()">
   <div class="wrap">
    <div class="top">
      <span class="ttl">{{ stage === 'story' ? scene.title : 'DREAMERS COFFEE' }}</span>
      <button class="skip" @click.stop="finish">Bỏ qua ⏭</button>
    </div>
    <div v-if="stage === 'title'" class="title-card" @click.stop>
      <img :src="logoUrl" class="logo" alt="Dreamers Coffee" />
      <b class="tname">DREAMERS COFFEE</b>
      <!-- <div class="tsub">Yến &amp; Cáo · Đà Lạt</div> -->
      <button class="go" @click="begin">Bắt đầu câu chuyện ▶</button>
    </div>
    <div v-show="stage === 'story'" class="stage">
      <canvas ref="cv" class="cv" />
      <div v-if="stage === 'story'" class="dots">
        <i v-for="(_, i) in SCENES" :key="i" :class="{ on: i === si, done: i < si }" />
      </div>
    </div>

    <div v-if="stage === 'story'" class="box">
      <TypeText ref="typer" :key="si + '-' + li" :text="line" :speed="26" :pitch="620" />
      <div class="nav">
        <span class="hint">chạm để tiếp</span>
        <button v-if="isLast" class="go" @click.stop="finish">Mở quán thôi! ☕</button>
        <button v-else class="nxt" @click.stop="next">Tiếp ▶</button>
      </div>
    </div>
   </div>
  </div>
</template>

<style scoped>
.intro {
  position: absolute; inset: 0; z-index: 100; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  background: #241812; color: #ffe8b8; padding: calc(var(--safe-top, 0px) + 10px) 14px calc(env(safe-area-inset-bottom, 0px) + 18px);
  user-select: none; -webkit-user-select: none; overflow-y: auto;
}
/* khung truyện luôn nằm giữa màn hình điện thoại */
.wrap { width: 100%; max-width: 480px; margin: auto 0; display: flex; flex-direction: column; }
.title-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0 6px; text-align: center; }
.logo { width: 62%; max-width: 260px; aspect-ratio: 1; image-rendering: pixelated; box-shadow: 0 0 0 3px #3b2a20, 0 0 0 6px #a06c46, 0 8px 0 6px rgba(0, 0, 0, 0.3); margin-bottom: 10px; }
.tname { font-size: 18px; letter-spacing: 0.2em; color: #ffe8b8; }
.tsub { font-size: 13px; color: #c9a888; margin-bottom: 8px; }
.top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ttl { font-size: 11px; font-weight: 900; letter-spacing: 0.16em; color: #e6c79c; text-transform: uppercase; }
.skip { font-size: 12px; font-weight: 900; padding: 4px 10px 6px; background: #4a2e1f; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -3px 0 #3b2318; }
.stage { position: relative; box-shadow: 0 0 0 3px #3b2a20, 0 0 0 6px #a06c46, 0 8px 0 6px rgba(0, 0, 0, 0.3); margin: 6px; }
.cv { display: block; width: 100%; aspect-ratio: 128 / 92; image-rendering: pixelated; image-rendering: crisp-edges; }
.dots { position: absolute; left: 0; right: 0; bottom: -18px; display: flex; justify-content: center; gap: 6px; }
.dots i { width: 8px; height: 4px; background: #5a4334; }
.dots i.done { background: #a06c46; }
.dots i.on { width: 16px; background: #f2c14e; }
.box {
  margin-top: 30px; background: #fffaf2; color: #3b2a20; padding: 14px 14px 12px; font-size: 16px; line-height: 1.5; font-weight: 600;
  box-shadow: var(--px-border), inset 0 -4px 0 #e6d6c2, 0 6px 0 rgba(0, 0, 0, 0.35); min-height: 120px;
  display: flex; flex-direction: column; gap: 8px;
}
.nav { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
.hint { font-size: 11px; color: #a08a78; }
.nxt, .go { font-weight: 900; font-size: 14px; padding: 7px 14px 9px; }
.nxt { background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b; }
.go { background: #2f9e6b; color: #fff; box-shadow: var(--px-border-2), inset 0 -4px 0 #1d6b47; }
</style>
