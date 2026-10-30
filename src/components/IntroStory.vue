<script setup lang="ts">
// Truyện mở đầu: Yến, 24 tuổi, bỏ Hà Nội vào Đà Lạt, gặp bé corgi Cáo và cùng mở Dreamers Coffee.
// Mỗi cảnh vẽ pixel bằng canvas theo phong cách Brew & Bloom + lời kể gõ từng chữ. Chạm để hiện hết / sang câu tiếp.
// Mỗi cảnh có kiểu chuyển cảnh riêng (iris, trượt, hoà tan pixel, quét chéo, loé sáng) và máy quay zoom theo từng câu.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { save, ui, persist } from '../game/store'
import { unlockAudio, sfx } from '../game/audio'
import { px, shade, drawPerson, drawCorgi, CZ, rivet, woodFrame, spr, loadImages, type Ctx } from '../game/pixel'
import type { Look } from '../game/data'
import TypeText from './TypeText.vue'
import PixelIcon from './ui/PixelIcon.vue'
import logoUrl from '../assets/logo.png'

const W = 128, H = 92
type Trans = 'fade' | 'iris' | 'slide' | 'dissolve' | 'wipe' | 'flash'
/** máy quay: z = độ zoom, (x, y) = điểm cần nhìn */
interface Cam { z: number; x: number; y: number }
interface Scene { title: string; lines: string[]; trans: Trans; cams?: Cam[]; draw: (c: Ctx, t: number, li: number, lt: number) => void }
const WIDE: Cam = { z: 1, x: W / 2, y: H / 2 }

const SCENES: Scene[] = [
  { title: 'Hà Nội · 2:00 sáng', trans: 'fade', cams: [WIDE, { z: 1.5, x: 72, y: 36 }], lines: [
    'Hà Nội, 2 giờ sáng. {name}, 24 tuổi, đang sửa slide lần thứ 17 cho sếp.',
    'Cốc Americano thứ tư nguội ngắt. Cô chợt nghĩ: “Mình sống để chạy deadline hả trời?”',
  ], draw: sceneOffice },
  { title: 'Đèo Prenn · sương sớm', trans: 'iris', lines: [
    'Sáng hôm sau, {name} nộp đơn nghỉ việc, gom hết can đảm và… hai cái vali, bay một mạch từ Hà Nội vào Nam.',
    'Xe từ sân bay Liên Khương leo đèo Prenn. Sương giăng kín đồi thông. Đà Lạt đón cô bằng 16 độ và mùi cà phê rang.',
  ], draw: sceneBus },
  { title: 'Cuối con dốc nhỏ', trans: 'slide', cams: [WIDE, { z: 1.6, x: 66, y: 64 }], lines: [
    'Cuối con dốc có một quán cà phê cũ, treo tấm biển “CHO THUÊ” bạc màu.',
    'Trước cửa… một bé corgi mập ú, lông muối tiêu lốm đốm, ngồi canh như chủ nhà.',
  ], draw: sceneOldShop },
  { title: 'Đồng sáng lập', trans: 'dissolve', cams: [{ z: 1.15, x: 60, y: 54 }, { z: 1.4, x: 70, y: 56 }], lines: [
    'Bé không chịu đi đâu hết, cứ dụi cái mông tròn vào chân cô.',
    'Cô đặt tên bé là Cáo, vì cái mặt lém lỉnh y chang con cáo. Vậy là quán có đồng sáng lập lương trả bằng pate.',
  ], draw: sceneMeet },
  { title: 'Ba tuần sửa quán', trans: 'wipe', cams: [WIDE, { z: 1.4, x: 64, y: 26 }], lines: [
    'Hai đứa dọn dẹp ba tuần liền: sơn tường, lau máy, còn Cáo thì phụ… làm đổ sơn.',
    'Tấm biển mới được treo lên: DREAMERS COFFEE quán của những người dám mơ mộng.',
  ], draw: scenePaint },
  { title: 'Ngày khai trương', trans: 'flash', lines: [
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

let sceneStart = performance.now()
let lineStart = performance.now()
// chuyển cảnh: cảnh cũ vẫn chạy tiếp trong lúc chuyển
const TR = 1.1
let tr: { from: number; fromStart: number; fromLi: number; fromCam: Cam; at: number } | null = null
// máy quay lướt mượt giữa các câu
let camFrom: Cam = WIDE, camTo: Cam = WIDE, camAt = 0
const camOf = (s: number, l: number) => SCENES[s].cams?.[l] ?? SCENES[s].cams?.[0] ?? WIDE

function begin() {
  unlockAudio()
  stage.value = 'story'
  sceneStart = lineStart = performance.now()
  camFrom = camTo = camOf(0, 0)
  sfx('bell')
}
function next() {
  if (typer.value && !typer.value.finished) { typer.value.skip(); return }
  if (isLast.value) return
  const now = performance.now()
  if (tr && (now - tr.at) / 1000 < TR) return // đang chuyển cảnh
  if (li.value < scene.value.lines.length - 1) {
    camFrom = camNow(now); li.value++; camTo = camOf(si.value, li.value); camAt = now
  } else {
    tr = { from: si.value, fromStart: sceneStart, fromLi: li.value, fromCam: camNow(now), at: now }
    si.value++; li.value = 0
    camFrom = camTo = camOf(si.value, 0)
    sceneStart = now
    sfx('tap')
  }
  lineStart = now
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
const K = 6 // độ phân giải nội bộ (CSS tự co giãn, giữ nét pixel)
let bufA: HTMLCanvasElement, bufB: HTMLCanvasElement
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

function camNow(now: number): Cam {
  const p = ease(clamp01((now - camAt) / 1400))
  return { z: camFrom.z + (camTo.z - camFrom.z) * p, x: camFrom.x + (camTo.x - camFrom.x) * p, y: camFrom.y + (camTo.y - camFrom.y) * p }
}
/** vẽ 1 cảnh (có máy quay) lên c */
function render(c: Ctx, idx: number, t: number, l: number, lt: number, cam: Cam) {
  const vw = W / cam.z, vh = H / cam.z
  const left = Math.max(0, Math.min(W - vw, cam.x - vw / 2)), top = Math.max(0, Math.min(H - vh, cam.y - vh / 2))
  const s = K * cam.z
  c.setTransform(s, 0, 0, s, -Math.round(left * s), -Math.round(top * s))
  c.imageSmoothingEnabled = false
  c.clearRect(0, 0, W, H)
  SCENES[idx].draw(c, t, l, lt)
  c.setTransform(K, 0, 0, K, 0, 0)
  vignette(c)
}

// mặt nạ hoà tan pixel (Bayer 4x4, ô 2px)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const masks: HTMLCanvasElement[] = []
function mask(level: number) {
  if (!masks[level]) {
    const m = document.createElement('canvas'); m.width = W; m.height = H
    const mc = m.getContext('2d')!
    mc.fillStyle = '#000'
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (BAYER[((x >> 1) % 4) + ((y >> 1) % 4) * 4] < level) mc.fillRect(x, y, 2, 2)
    masks[level] = m
  }
  return masks[level]
}
/** che ngoài vòng tròn (cx, cy, r) bằng màu đen, mép răng cưa pixel */
function irisMask(c: Ctx, cx: number, cy: number, r: number) {
  c.fillStyle = '#140e0a'
  for (let y = 0; y < H; y++) {
    const dy = y + 0.5 - cy
    const hw = r > Math.abs(dy) ? Math.round(Math.sqrt(r * r - dy * dy)) : -1
    if (hw < 0) { c.fillRect(0, y, W, 1); continue }
    const l = Math.round(cx) - hw, rr = Math.round(cx) + hw
    if (l > 0) c.fillRect(0, y, l, 1)
    if (rr < W) c.fillRect(rr, y, W - rr, 1)
  }
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  if (!ctx) return
  const t = (now - sceneStart) / 1000, lt = (now - lineStart) / 1000
  const cam = camNow(now)
  const c = ctx
  const p = tr ? (now - tr.at) / 1000 / (SCENES[si.value].trans === 'flash' ? TR * 1.2 : TR) : 1
  if (!tr || p >= 1) {
    tr = null
    render(c, si.value, t, li.value, lt, cam)
  } else {
    const a = bufA.getContext('2d')!, b = bufB.getContext('2d')!
    const ft = (now - tr.fromStart) / 1000
    const kind = SCENES[si.value].trans
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.imageSmoothingEnabled = false
    c.clearRect(0, 0, W * K, H * K)
    const drawOld = () => { render(a, tr!.from, ft, tr!.fromLi, ft, tr!.fromCam); c.setTransform(1, 0, 0, 1, 0, 0) }
    if (kind === 'slide') {
      // lia máy: cảnh cũ trượt sang trái, cảnh mới vào từ phải
      drawOld(); render(b, si.value, t, li.value, lt, cam)
      const e = ease(p), off = Math.round(e * W) * K
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.drawImage(bufA, -off, 0); c.drawImage(bufB, W * K - off, 0)
    } else if (kind === 'dissolve') {
      drawOld(); render(b, si.value, t, li.value, lt, cam)
      b.setTransform(1, 0, 0, 1, 0, 0)
      b.globalCompositeOperation = 'destination-in'
      b.imageSmoothingEnabled = false
      b.drawImage(mask(Math.round(ease(p) * 16)), 0, 0, W * K, H * K)
      b.globalCompositeOperation = 'source-over'
      c.drawImage(bufA, 0, 0); c.drawImage(bufB, 0, 0)
    } else if (kind === 'wipe') {
      // quét chéo bậc thang, mép viền đồng
      drawOld(); render(b, si.value, t, li.value, lt, cam)
      c.drawImage(bufA, 0, 0)
      const edge = ease(p) * (W + H * 0.6 + 8)
      c.setTransform(K, 0, 0, K, 0, 0)
      for (let y = 0; y < H; y += 2) {
        const w = Math.max(0, Math.min(W, Math.floor((edge - y * 0.6) / 2) * 2))
        if (w > 0) c.drawImage(bufB, 0, y * K, w * K, 2 * K, 0, y, w, 2)
        if (w > 0 && w < W) { px(c, w, y, 1, 2, CZ.b1); px(c, w + 1, y, 1, 2, CZ.ink) }
      }
    } else if (kind === 'iris') {
      // khép tròn vào nhân vật rồi mở ra cảnh mới
      const R = Math.hypot(W, H) / 2 + 6
      if (p < 0.5) { render(c, tr.from, ft, tr.fromLi, ft, tr.fromCam); irisMask(c, 60, 48, R * (1 - ease(p * 2))) }
      else { render(c, si.value, t, li.value, lt, cam); irisMask(c, 64, 46, R * ease((p - 0.5) * 2)) }
    } else if (kind === 'flash') {
      // loé sáng trắng như bấm máy ảnh
      if (p < 0.35) { render(c, tr.from, ft, tr.fromLi, ft, tr.fromCam); c.fillStyle = `rgba(255,250,236,${p / 0.35})` }
      else { render(c, si.value, t, li.value, lt, cam); c.fillStyle = `rgba(255,250,236,${1 - ease((p - 0.35) / 0.65)})` }
      c.fillRect(0, 0, W, H)
    } else {
      // mờ qua màn đen
      if (p < 0.5) { render(c, tr.from, ft, tr.fromLi, ft, tr.fromCam); c.fillStyle = `rgba(20,14,10,${p * 2})` }
      else { render(c, si.value, t, li.value, lt, cam); c.fillStyle = `rgba(20,14,10,${2 - p * 2})` }
      c.fillRect(0, 0, W, H)
    }
  }
  c.setTransform(K, 0, 0, K, 0, 0)
  if (!tr) chapterPlate(c, t)
  // mở màn cảnh đầu
  if (si.value === 0 && !tr && t < 0.8) { c.fillStyle = `rgba(20,14,10,${1 - t / 0.8})`; c.fillRect(0, 0, W, H) }
}
onMounted(() => {
  const el = cv.value!
  el.width = W * K; el.height = H * K
  ctx = el.getContext('2d')
  for (const k of ['a', 'b']) {
    const b = document.createElement('canvas'); b.width = W * K; b.height = H * K
    if (k === 'a') bufA = b; else bufB = b
  }
  loadImages()
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))

/** tối 4 góc kiểu ảnh phim, bậc pixel */
function vignette(c: Ctx) {
  c.fillStyle = 'rgba(20,14,10,0.16)'
  c.fillRect(0, 0, W, 1); c.fillRect(0, H - 1, W, 1); c.fillRect(0, 1, 1, H - 2); c.fillRect(W - 1, 1, 1, H - 2)
  for (const [x, y, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]]) {
    for (let i = 0; i < 4; i++) c.fillRect(sx > 0 ? x : x - (6 - i), sy > 0 ? y + i : y - i - 1, 6 - i, 1)
  }
}
/** bảng gỗ "MỞ ĐẦU n" (phần mở đầu, khác các chương của cốt truyện chính) trượt vào góc trên trái đầu mỗi cảnh */
function chapterPlate(c: Ctx, t: number) {
  if (t < 0.3 || t > 3.6) return
  const k = t < 0.6 ? ease((t - 0.3) / 0.3) : t > 3.2 ? 1 - ease((t - 3.2) / 0.4) : 1
  const x = Math.round(-40 + 44 * k), y = 4
  px(c, x, y, 36, 9, CZ.ink); px(c, x + 1, y + 1, 34, 7, CZ.w2); px(c, x + 1, y + 1, 34, 1, CZ.w4); px(c, x + 1, y + 7, 34, 1, CZ.w1)
  rivet(c, x + 1, y + 1); rivet(c, x + 33, y + 1)
  label(c, `MỞ ĐẦU ${si.value + 1}`, x + 18, y + 4.8, CZ.cream, 5)
}

// ---------- nhân vật ----------
// Yến: tóc đen ngang vai
const girl = (shirt: string): Look => ({ skin: '#f3c9a6', hair: '#1f1a1c', style: 'shoulder', shirt, acc: ['blush'] })
const OFFICE = girl('#6c7a99'), TRAVEL = girl(CZ.r2), BARISTA = girl(CZ.t2)

/** cô gái đứng nguyên người: thân trên (drawPerson) + quần + giày */
function standGirl(c: Ctx, L: Look, x: number, y: number, mood: Parameters<typeof drawPerson>[4], walk = 0, blink = false) {
  drawPerson(c, L, x, y, mood, blink)
  px(c, x + 2, y + 28, 12, 4, '#4a5a7a') // quần jean
  px(c, x + 2, y + 28, 12, 1, '#5d6f93')
  px(c, x + 4, y + 32, 3, 5 - walk, '#4a5a7a'); px(c, x + 9, y + 32, 3, 5 - (walk ? 0 : 1), '#4a5a7a')
  px(c, x + 3, y + 37 - walk, 5, 2, CZ.ink); px(c, x + 9, y + 37 - (walk ? 0 : 1), 5, 2, CZ.ink)
  px(c, x + 4, y + 37 - walk, 2, 1, '#fffaf2'); px(c, x + 10, y + 37 - (walk ? 0 : 1), 2, 1, '#fffaf2')
}
const blinkAt = (t: number) => Math.floor(t * 10) % 37 === 0
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
/** hàng thông: tán bậc thang có mép sáng bên trái, thân gỗ */
function pines(c: Ctx, off: number, base: number, col: string, gap: number, hgt: number) {
  const hi = shade(col, 22), lo = shade(col, -22)
  for (let x = -gap + (((Math.round(off) % gap) + gap) % gap); x < W + gap; x += gap) {
    px(c, x, base, 1, 3, CZ.w1)
    for (let r = 0; r < hgt; r++) {
      const w = Math.max(1, Math.round(((r % 4) + r / 2) * 0.9)) * 2 + 1
      const y = base - hgt + r
      px(c, x - (w >> 1), y, w, 1, col)
      px(c, x - (w >> 1), y, 1, 1, hi)
      if (r % 4 === 3) px(c, x - (w >> 1), y, w, 1, lo)
    }
  }
}
function hill(c: Ctx, base: number, amp: number, col: string, ph: number) {
  for (let x = 0; x < W; x++) {
    const y = Math.round(base - amp * (0.5 + 0.5 * Math.sin(x / 18 + ph)))
    px(c, x, y, 1, H, col); px(c, x, y, 1, 1, shade(col, 18))
  }
}
function sky(c: Ctx, top: string, bot: string) {
  // trời phân dải như pixel art (không gradient mịn)
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const A = p(top), B = p(bot)
  const bands = 9
  for (let i = 0; i < bands; i++) {
    const k = i / (bands - 1)
    c.fillStyle = `rgb(${A.map((v, j) => Math.round(v + (B[j] - v) * k)).join(',')})`
    c.fillRect(0, Math.floor((i * H) / bands), W, Math.ceil(H / bands) + 1)
  }
}
function heart(c: Ctx, x: number, y: number, col = '#ff6b81') {
  px(c, x, y, 2, 2, col); px(c, x + 3, y, 2, 2, col); px(c, x, y + 1, 5, 2, col); px(c, x + 1, y + 3, 3, 1, col); px(c, x + 2, y + 4, 1, 1, col)
}
function cloud(c: Ctx, x: number, y: number, s = 1) {
  const r = Math.round
  px(c, r(x), y + 3, 22 * s, 4, '#ffffff'); px(c, r(x) + 4, y, 10 * s, 4, '#ffffff'); px(c, r(x) + 12 * s, y + 1, 7 * s, 3, '#ffffff')
  px(c, r(x), y + 6, 22 * s, 1, '#dfe7ef')
}
function sparkle(c: Ctx, x: number, y: number, t: number, col = '#fff6c8') {
  const k = Math.floor(t * 6) % 3
  px(c, x, y - k, 1, 1 + k * 2, col); px(c, x - k, y, 1 + k * 2, 1, col)
}
/** nền đất lát đá */
function cobble(c: Ctx, y: number, base: string) {
  px(c, 0, y, W, H - y, base)
  px(c, 0, y, W, 1, shade(base, 25))
  for (let r = 0; y + 2 + r * 4 < H; r++) for (let x = (r % 2) * 5; x < W; x += 10) {
    px(c, x, y + 2 + r * 4, 8, 3, shade(base, 10)); px(c, x, y + 4 + r * 4, 8, 1, shade(base, -18))
  }
}
/** vali đỏ góc đồng */
function suitcase(c: Ctx, x: number, y: number, col = CZ.r1) {
  px(c, x + 3, y - 3, 4, 1, CZ.ink); px(c, x + 3, y - 3, 1, 3, CZ.ink); px(c, x + 6, y - 3, 1, 3, CZ.ink)
  px(c, x, y, 10, 12, CZ.ink); px(c, x + 1, y + 1, 8, 10, col); px(c, x + 1, y + 1, 8, 1, shade(col, 30))
  px(c, x + 3, y + 1, 1, 10, shade(col, -30)); px(c, x + 6, y + 1, 1, 10, shade(col, -30))
  rivet(c, x, y); rivet(c, x + 8, y); px(c, x + 1, y + 12, 2, 1, CZ.ink); px(c, x + 7, y + 12, 2, 1, CZ.ink)
}
/** mái ngói đỏ */
function roof(c: Ctx, x: number, y: number, w: number) {
  px(c, x - 2, y, w + 4, 8, CZ.ink)
  for (let r = 0; r < 3; r++) for (let i = (r % 2) * 3; i < w; i += 6) {
    px(c, x + i, y + 1 + r * 2, 5, 2, r === 0 ? CZ.r2 : CZ.r1); px(c, x + i, y + 2 + r * 2, 5, 1, CZ.r0)
  }
  px(c, x - 2, y + 7, w + 4, 1, CZ.w1)
}

// 1. Văn phòng Hà Nội lúc nửa đêm
function sceneOffice(c: Ctx, t: number, l: number, lt: number) {
  px(c, 0, 0, W, H, '#1b2034')
  for (let x = 0; x < W; x += 16) px(c, x, 0, 1, 62, '#20263d')
  // cửa sổ kính khung kim loại, phố đêm + mưa phùn
  px(c, 7, 4, 70, 46, '#0b0f1c'); px(c, 8, 5, 68, 44, '#2a3150')
  px(c, 10, 7, 64, 40, '#101830')
  px(c, 62, 11, 5, 5, '#f7f3d6'); px(c, 61, 11, 2, 2, '#101830') // trăng
  const bld = [[12, 22, 10], [23, 14, 9], [33, 26, 12], [46, 10, 8], [55, 20, 10], [66, 16, 7]]
  for (const [bx, by, bw] of bld) {
    px(c, bx, 7 + by, bw, 40 - by, '#232b45'); px(c, bx, 7 + by, 1, 40 - by, '#2e3858')
    for (let wy = 9 + by; wy < 44; wy += 4) for (let wx = bx + 2; wx < bx + bw - 1; wx += 3) {
      if ((wx * 7 + wy * 13 + Math.floor(t * 0.7)) % 5 < 2) px(c, wx, wy, 1, 2, '#ffd36b')
    }
  }
  for (let i = 0; i < 14; i++) { const rx = 10 + ((i * 17 + t * 22) % 64), ry = 7 + ((i * 11 + t * 50) % 38); px(c, Math.round(rx), Math.round(ry), 1, 2, 'rgba(180,200,255,0.35)') }
  px(c, 41, 7, 2, 40, '#2a3150'); px(c, 10, 26, 64, 2, '#2a3150')
  // giấy note deadline
  const notes = ['#ffe36b', '#ff9aa8', '#9be3c4', '#ffe36b', '#ffb36b']
  notes.forEach((col, i) => {
    const nx = 84 + (i % 3) * 13, ny = 7 + Math.floor(i / 3) * 12
    px(c, nx, ny, 10, 9, col); px(c, nx, ny + 8, 10, 1, shade(col, -40)); px(c, nx + 2, ny + 3, 6, 1, '#7a5a40'); px(c, nx + 2, ny + 5, 4, 1, '#7a5a40')
    px(c, nx + 4, ny, 2, 1, CZ.r1)
  })
  label(c, 'DEADLINE!!', 103, 35, Math.floor(t * 2) % 2 ? '#ff6b6b' : '#d84a4a', 5)
  // đèn bàn đồng hắt sáng vàng
  px(c, 112, 46, 1, 18, CZ.b0); px(c, 106, 43, 12, 4, CZ.ink); px(c, 107, 43, 10, 2, CZ.b1); px(c, 107, 43, 3, 1, CZ.b2)
  c.fillStyle = 'rgba(255,214,120,0.10)'
  c.beginPath(); c.moveTo(107, 47); c.lineTo(117, 47); c.lineTo(126, 64); c.lineTo(84, 64); c.fill()
  px(c, 108, 63, 10, 2, CZ.ink)
  // cô gái gà gật
  const nod = Math.floor(t * 0.9) % 3 === 2 ? 1 : 0
  drawPerson(c, OFFICE, 52, 33 + nod, 'sad', Math.floor(t * 2) % 5 === 0)
  // ánh màn hình xanh hắt lên mặt
  c.fillStyle = `rgba(150,200,255,${0.10 + 0.04 * Math.sin(t * 3)})`
  c.beginPath(); c.moveTo(46, 50); c.lineTo(74, 50); c.lineTo(68, 35); c.lineTo(52, 35); c.fill()
  // bàn gỗ
  px(c, 0, 63, W, 1, CZ.ink); px(c, 0, 64, W, 28, CZ.w1); px(c, 0, 64, W, 2, CZ.w3); px(c, 0, 66, W, 1, CZ.w0)
  for (let x = 6; x < W; x += 21) px(c, x, 70 + (x % 3) * 4, 9, 1, CZ.w2)
  // laptop
  px(c, 43, 49, 34, 17, CZ.ink); px(c, 44, 50, 32, 14, '#c9ced6'); px(c, 44, 50, 32, 1, '#e8ecf0')
  px(c, 46, 52, 28, 10, `rgba(150,200,255,${0.8 + 0.15 * Math.sin(t * 3)})`)
  px(c, 48, 54, 16, 1, '#5b7a99'); px(c, 48, 57, 22, 1, '#5b7a99'); px(c, 48, 60, 12, 1, '#e8503a')
  label(c, 'v17', 69, 54.5, '#2e3f6e', 3)
  px(c, 40, 64, 40, 2, '#9aa1ab'); px(c, 40, 64, 40, 1, '#c9ced6')
  // 4 cốc Americano, cốc cuối nguội ngắt (không khói)
  for (let i = 0; i < 4; i++) {
    const x = 84 + i * 6 - (i === 3 ? 0 : 0), y = i === 3 ? 55 : 58
    px(c, x, y, 6, 8, CZ.ink); px(c, x + 1, y + 1, 4, 6, '#fffaf2'); px(c, x + 1, y + 1, 4, 1, '#6f4e37'); px(c, x + 6, y + 3, 1, 2, CZ.ink)
  }
  // đồng hồ điện tử
  px(c, 8, 67, 28, 11, CZ.ink); px(c, 9, 68, 26, 9, '#141414')
  label(c, Math.floor(t * 2) % 2 ? '02:00' : '02 00', 22, 72.6, '#ff6b6b', 6)
  // câu 2: bong bóng suy nghĩ – mơ về đồi thông và ly cà phê bốc khói
  if (l === 1) {
    const k = ease(clamp01(lt / 0.5))
    px(c, 67, 31, 2, 2, '#fffaf2'); if (k > 0.3) px(c, 70, 27, 3, 3, '#fffaf2')
    if (k > 0.6) {
      const bx = 72, by = 5, bw = 30, bh = 20
      px(c, bx + 1, by, bw - 2, bh, CZ.ink); px(c, bx, by + 1, bw, bh - 2, CZ.ink)
      px(c, bx + 1, by + 1, bw - 2, bh - 2, '#fffaf2')
      px(c, bx + 2, by + 2, bw - 4, 9, '#cfe8f5') // trời
      px(c, bx + 2, by + 11, bw - 4, 7, '#7fb08f') // đồi
      for (const [x0, hgt] of [[6, 7], [12, 9], [19, 6]]) for (let r = 0; r < hgt; r++) px(c, bx + x0 - (r >> 1), by + 13 - hgt + r, 1 + (r >> 1) * 2, 1, '#2f5d4a')
      px(c, bx + 22, by + 12, 4, 4, '#fffaf2'); px(c, bx + 22, by + 12, 4, 1, '#6f4e37'); px(c, bx + 26, by + 13, 1, 2, '#fffaf2')
      if (Math.floor(t * 3) % 2) px(c, bx + 23, by + 9, 1, 2, '#ffffff'); else px(c, bx + 24, by + 8, 1, 2, '#ffffff')
      label(c, '?', bx + bw + 4, by + 2 - (Math.floor(t * 2) % 2), '#f2c14e', 7)
    }
  }
}

// 2. Bay vào Nam rồi xe leo đèo Prenn
function sceneBus(c: Ctx, t: number, l: number, lt: number) {
  sky(c, '#9ec9e6', '#fbe0cc')
  // mặt trời có tia
  px(c, 96, 9, 14, 14, '#ffe39a'); px(c, 97, 8, 12, 16, '#ffe39a'); px(c, 95, 10, 16, 12, '#ffe39a')
  px(c, 99, 11, 8, 8, '#fff3c4')
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.15
    px(c, Math.round(103 + Math.cos(a) * 12), Math.round(16 + Math.sin(a) * 12), 2, 2, 'rgba(255,227,154,0.8)')
  }
  cloud(c, ((t * 3 + 10) % 170) - 30, 8); cloud(c, ((t * 2 + 90) % 170) - 30, 20, 0.8)
  // câu 1: máy bay bay vào Nam kéo vệt khói
  if (l === 0 || lt < 2) {
    const fx = l === 0 ? -30 + ((lt * 18) % 190) : 130 + lt * 18
    const fy = 26 - Math.round(Math.min(10, lt * 1.5))
    for (let i = 1; i < 10; i++) px(c, Math.round(fx) - i * 4, fy + 3, 3, 1, `rgba(255,255,255,${0.8 - i * 0.08})`)
    px(c, fx, fy + 2, 16, 4, CZ.ink); px(c, fx + 1, fy + 3, 14, 2, '#fffaf2'); px(c, fx + 15, fy + 3, 2, 2, CZ.ink)
    px(c, fx + 1, fy, 3, 3, CZ.r1); px(c, fx + 6, fy + 4, 6, 4, CZ.ink); px(c, fx + 7, fy + 5, 4, 2, '#d0d6de')
    for (let i = 0; i < 4; i++) px(c, fx + 5 + i * 2, fy + 3, 1, 1, '#5b8bd9')
  }
  hill(c, 46, 8, '#a9c7b5', 0.4 + t * 0.02)
  pines(c, -t * 6, 52, '#6f9e86', 11, 14)
  fog(c, t, 40, 0.45, 5)
  hill(c, 62, 6, '#4f7f68', 1.2 + t * 0.05)
  pines(c, -t * 16, 66, '#2f5d4a', 15, 18)
  // đường đèo + lan can gỗ
  px(c, 0, 71, W, 1, CZ.ink); px(c, 0, 72, W, 20, '#5b5650'); px(c, 0, 72, W, 2, '#7a746c')
  for (let i = 0; i < 6; i++) px(c, Math.round(((i * 26 - t * 40) % 156 + 156) % 156) - 20, 81, 12, 1, '#f2e6c9')
  for (let i = 0; i < 9; i++) { const x = Math.round(((i * 18 - t * 40) % 162 + 162) % 162) - 18; px(c, x, 87, 2, 5, CZ.w2); px(c, x, 87, 1, 5, CZ.w4) }
  px(c, 0, 88, W, 1, CZ.w3)
  // câu 2: xe khách xanh rêu chạy vào giữa
  const bx = l === 1 ? Math.round(Math.min(34, -70 + lt * 45)) : -80
  if (bx > -60) {
    const b = Math.floor(t * 6) % 2, by = 49 - b
    // giá nóc đồng + vali
    suitcase(c, bx + 9, by - 10); suitcase(c, bx + 22, by - 9, '#5b8bd9')
    px(c, bx + 6, by - 1, 34, 1, CZ.b0)
    px(c, bx, by, 56, 23, CZ.ink)
    px(c, bx + 1, by + 1, 54, 21, '#f6ead2'); px(c, bx + 1, by + 1, 54, 1, '#fff8e6')
    px(c, bx + 1, by + 13, 54, 5, CZ.t1); px(c, bx + 1, by + 13, 54, 1, CZ.t2)
    for (let i = 0; i < 5; i++) { px(c, bx + 4 + i * 9, by + 3, 8, 8, CZ.ink); px(c, bx + 5 + i * 9, by + 4, 6, 6, '#bfe3f5'); px(c, bx + 5 + i * 9, by + 4, 2, 2, '#ffffff') }
    // Yến tựa cửa sổ, tóc đen ngang vai
    px(c, bx + 32, by + 5, 6, 5, '#1f1a1c'); px(c, bx + 34, by + 6, 3, 4, '#f3c9a6'); px(c, bx + 36, by + 7, 1, 1, CZ.ink); px(c, bx + 35, by + 9, 1, 1, '#ff9aa8')
    px(c, bx + 50, by + 3, 5, 10, CZ.ink); px(c, bx + 51, by + 4, 3, 8, '#bfe3f5')
    px(c, bx + 54, by + 15, 2, 2, '#fff3b0') // đèn pha
    for (const wx of [bx + 7, bx + 41]) {
      px(c, wx, by + 19, 9, 6, CZ.ink); px(c, wx + 2, by + 20, 5, 4, '#9a9a9a')
      px(c, wx + 3 + (Math.floor(t * 8) % 2), by + 21, 2, 2, '#d0d0d0')
    }
  }
  fog(c, t + 20, 62, 0.35, 9)
  // biển chỉ đường
  if (l === 1) {
    const sx = Math.round(((110 - t * 22) % 190 + 190) % 190) - 30
    px(c, sx + 9, 52, 2, 20, CZ.w2); px(c, sx - 1, 43, 24, 11, CZ.ink); px(c, sx, 44, 22, 9, '#f4f4f0'); px(c, sx + 1, 45, 20, 7, '#2f7d5a')
    label(c, 'ĐÀ LẠT', sx + 11, 48.8, '#ffffff', 4)
  }
}

/** mặt tiền quán: mái ngói, tường, 2 cửa sổ khung gỗ, cửa đôi */
function facade(c: Ctx, wall: string, door: string, old: boolean) {
  px(c, 14, 22, 100, 56, CZ.ink); px(c, 15, 22, 98, 56, wall)
  for (let y = 26; y < 76; y += 6) px(c, 15, y, 98, 1, shade(wall, -10))
  roof(c, 10, 15, 108)
  // cửa sổ
  for (const wx of [24, 86]) {
    woodFrame(c, wx, 46, 18, 15)
    px(c, wx, 46, 18, 15, old ? '#7d8a8f' : '#ffe6a8')
    if (!old) { px(c, wx + 2, 48, 3, 3, '#fff6d8'); px(c, wx, 52, 18, 1, CZ.w2); px(c, wx + 8, 46, 2, 15, CZ.w2) }
  }
  // cửa đôi gỗ
  px(c, 51, 45, 26, 33, CZ.ink)
  px(c, 52, 46, 11, 32, door); px(c, 65, 46, 11, 32, door)
  for (const dx of [52, 65]) { px(c, dx + 2, 49, 7, 10, shade(door, -25)); px(c, dx + 2, 62, 7, 13, shade(door, -25)); px(c, dx, 46, 1, 32, shade(door, 25)) }
  px(c, 61, 61, 2, 2, CZ.b1); px(c, 66, 61, 2, 2, CZ.b1)
  // bậc thềm
  px(c, 47, 78, 34, 2, CZ.ink); px(c, 48, 78, 32, 1, '#b8ab98')
}

// 3. Quán cũ cho thuê + corgi canh cửa
function sceneOldShop(c: Ctx, t: number, l: number, lt: number) {
  sky(c, '#c2d0d9', '#ebe4d8')
  hill(c, 30, 4, '#b5c6bd', 0.3)
  pines(c, 0, 26, '#7f9c90', 13, 12)
  facade(c, '#cbb79a', CZ.w1, true)
  // tường bong tróc, vết nứt, dây leo
  px(c, 18, 30, 6, 3, '#b39d80'); px(c, 100, 34, 5, 4, '#b39d80'); px(c, 82, 28, 4, 2, '#b39d80')
  px(c, 40, 26, 1, 4, '#9c8a70'); px(c, 41, 29, 1, 3, '#9c8a70'); px(c, 42, 31, 1, 2, '#9c8a70')
  for (let i = 0; i < 9; i++) { px(c, 15 + (i % 3), 24 + i * 5, 1, 5, '#5e7a4a'); if (i % 2) px(c, 16 + (i % 3), 26 + i * 5, 2, 2, '#7fa060') }
  // ván đóng chéo cửa sổ
  for (const wx of [24, 86]) { for (let i = 0; i < 18; i += 2) { px(c, wx + i, 47 + Math.round(i * 0.7), 2, 2, CZ.w3); px(c, wx + i, 59 - Math.round(i * 0.7), 2, 2, CZ.w2) } }
  // biển cũ bạc màu trên cửa
  px(c, 44, 33, 40, 9, CZ.ink); px(c, 45, 34, 38, 7, '#8f7a62')
  label(c, 'C  PHÊ', 64, 38, '#c9b89c', 5)
  // biển CHO THUÊ đong đưa
  const sw = Math.round(Math.sin(t * 2) * 0.8)
  px(c, 63, 42, 1, 3, CZ.ink)
  px(c, 50 + sw, 45, 28, 9, '#b3261e'); px(c, 51 + sw, 46, 26, 7, '#f4efe2')
  label(c, 'CHO THUÊ', 64 + sw, 49.6, '#b3261e', 4.5)
  cobble(c, 80, '#8b7d6b')
  // lá thông rơi
  for (let i = 0; i < 5; i++) { const lx = (i * 31 + t * 6) % W, ly = (i * 17 + t * 9) % 80; px(c, Math.round(lx), Math.round(ly), 2, 1, '#c98a52') }
  // corgi ngồi canh cửa
  drawCorgi(c, 54, 63, t, 'sit', false)
  if (l === 1) {
    const k = Math.min(1, lt / 0.25)
    label(c, '!', 72, 58 - Math.round(4 * k) - (Math.floor(t * 3) % 2), '#f2c14e', 7)
  }
  // cô gái kéo vali bước vào
  const gx = Math.min(14, -20 + t * 14)
  const walk = gx < 14 ? Math.floor(t * 8) % 2 : 0
  standGirl(c, TRAVEL, Math.round(gx), 41, l === 1 ? 'love' : 'neutral', walk, blinkAt(t))
  px(c, Math.round(gx) + 15, 64, 1, 5, CZ.ink)
  suitcase(c, Math.round(gx) + 16, 68)
  if (gx >= 14 && l === 0) label(c, '?', 34, 40 - (Math.floor(t * 2) % 2), '#ffffff', 6)
  fog(c, t, 72, 0.3, 6)
}

// 4. Gặp Cáo
function sceneMeet(c: Ctx, t: number, l: number, lt: number) {
  sky(c, '#fbd9b8', '#f6efe2')
  hill(c, 46, 6, '#c9d8c0', 0.8)
  pines(c, 0, 52, '#9ab5a0', 14, 13)
  // bậc thềm quán cũ + chậu cây
  px(c, 86, 30, 42, 40, CZ.ink); px(c, 87, 30, 41, 40, '#cbb79a'); px(c, 96, 40, 20, 30, CZ.w1); px(c, 97, 41, 9, 29, CZ.w2)
  spr(c, 'boxwood', 112, 70)
  cobble(c, 68, '#c4b08e')
  fog(c, t, 44, 0.25, 3)
  const bob = Math.floor(t * 3) % 2
  standGirl(c, TRAVEL, 36, 29 - bob, 'love', 0, blinkAt(t))
  px(c, 51, 49 - bob, 5, 3, '#f3c9a6') // tay xoa đầu
  // Cáo dụi mông qua lại
  const rub = Math.round(Math.sin(t * 5) * 1.5)
  drawCorgi(c, 52 + rub, 51, t, 'stand', true)
  // tim bay
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i / 3) % 1
    heart(c, 50 + i * 9 + Math.round(Math.sin(p * 6 + i) * 2), Math.round(48 - p * 34), i % 2 ? '#ff9aa8' : '#ff6b81')
  }
  // bát pate
  px(c, 80, 69, 14, 6, CZ.ink); px(c, 81, 70, 12, 4, CZ.t2); px(c, 81, 70, 12, 1, '#b5835a'); px(c, 82, 69, 3, 1, '#c98a62')
  // câu 2: thẻ tên CÁO bằng gỗ treo cổ + lấp lánh
  if (l === 1) {
    const k = ease(clamp01(lt / 0.4))
    const ty = Math.round(28 + (1 - k) * -20)
    px(c, 72, ty + 9, 1, 8, CZ.ink)
    px(c, 64, ty, 18, 10, CZ.ink); px(c, 65, ty + 1, 16, 8, CZ.w4); px(c, 65, ty + 1, 16, 1, CZ.w5); px(c, 65, ty + 8, 16, 1, CZ.w2)
    rivet(c, 65, ty + 1); rivet(c, 79, ty + 1)
    label(c, 'CÁO', 73, ty + 5.2, CZ.ink, 5)
    sparkle(c, 86, ty + 2, t); sparkle(c, 60, ty + 9, t + 0.3)
  }
}

// 5. Sơn sửa quán, treo biển mới
function scenePaint(c: Ctx, t: number, l: number, lt: number) {
  // tường cũ xám → tường kem + ốp xanh rêu (đúng màu quán trong game)
  px(c, 0, 0, W, 70, '#cfc3b0')
  for (let x = 0; x < W; x += 8) px(c, x, 0, 1, 70, '#c2b6a2')
  const p = Math.min(1, t / 5)
  const pw = Math.round(W * (0.25 + 0.75 * p))
  px(c, 0, 0, pw, 70, '#f0dcb4')
  for (let r = 0; r < 10; r++) for (let x = 4 + (r % 2) * 4; x < pw; x += 8) px(c, x, 4 + r * 6, 1, 1, '#dcbd8a')
  px(c, 0, 52, pw, 18, CZ.t1); px(c, 0, 51, pw, 1, CZ.ink); px(c, 0, 50, pw, 1, CZ.w5)
  px(c, pw - 1, 0, 2, 70, '#e8d2a6') // mép sơn ướt
  // sàn gỗ
  px(c, 0, 70, W, 1, CZ.ink); px(c, 0, 71, W, 21, CZ.w3)
  for (let y = 71; y < H; y += 5) { px(c, 0, y, W, 1, CZ.w2); for (let x = ((y / 5) % 2) * 11; x < W; x += 22) px(c, x, y, 1, 5, CZ.w2) }
  // biển hiệu: câu 2 treo lên, hiện từng chữ
  const text = 'DREAMERS COFFEE'
  const hang = l === 1 ? ease(clamp01(lt / 0.6)) : 0
  const sy = Math.round(-20 + 28 * hang)
  if (l === 1) {
    px(c, 30, 0, 1, sy + 1, CZ.ink); px(c, 97, 0, 1, sy + 1, CZ.ink)
    woodFrame(c, 22, sy, 84, 12)
    px(c, 22, sy, 84, 12, '#4a2e1f')
    const n = Math.min(text.length, Math.floor(Math.max(0, lt - 0.6) * 9))
    label(c, text.slice(0, n), 64, sy + 6.5, '#ffe8b8', 7)
    if (n >= text.length) for (let i = 0; i < 4; i++) sparkle(c, 24 + i * 27, sy + (i % 2 ? -3 : 15), t + i * 0.2)
  }
  // thang gỗ + Yến lăn sơn
  for (let y = 30; y < 70; y += 6) px(c, 80, y, 14, 1, CZ.w2)
  px(c, 80, 28, 2, 42, CZ.w2); px(c, 92, 28, 2, 42, CZ.w2); px(c, 80, 28, 1, 42, CZ.w4); px(c, 92, 28, 1, 42, CZ.w4)
  const arm = Math.floor(t * 4) % 2
  standGirl(c, BARISTA, 79, 22, l === 1 ? 'love' : 'happy', 0, blinkAt(t))
  if (l === 0) { px(c, 94, 22 - arm * 3, 1, 9, CZ.ink); px(c, 92, 18 - arm * 3, 6, 4, CZ.ink); px(c, 93, 19 - arm * 3, 4, 2, CZ.t2) }
  // xô sơn đổ + Cáo dính sơn
  px(c, 19, 59, 12, 12, CZ.ink); px(c, 20, 60, 10, 10, '#d9d9d9'); px(c, 20, 60, 10, 2, CZ.t2); px(c, 20, 60, 2, 10, '#ececec')
  px(c, 28, 70, 16, 2, CZ.t2); px(c, 34, 69, 7, 1, CZ.t2); px(c, 30, 72, 5, 1, CZ.t1)
  drawCorgi(c, 40, 56, t, 'stand', true)
  px(c, 47, 64, 3, 2, CZ.t2); px(c, 58, 58, 2, 2, CZ.t2); px(c, 44, 70, 2, 1, CZ.t2)
  for (let i = 0; i < 4; i++) { px(c, 66 + i * 7, 78 + (i % 2) * 3, 2, 2, CZ.t2); px(c, 69 + i * 7, 77 + (i % 2) * 3, 1, 1, CZ.t2) }
}

// 6. Khai trương
function sceneOpen(c: Ctx, t: number, l: number, lt: number) {
  sky(c, '#8fd0f0', '#fde8c4')
  px(c, 100, 4, 14, 14, '#ffe39a'); px(c, 99, 5, 16, 12, '#ffe39a'); px(c, 103, 7, 7, 7, '#fff3c4')
  cloud(c, ((t * 3) % 170) - 30, 6)
  pines(c, 0, 24, '#6fa38c', 13, 12)
  facade(c, '#f0dcb4', CZ.t1, false)
  // mái hiên sọc đỏ kem, mép răng cưa
  px(c, 18, 38, 92, 6, CZ.ink)
  for (let i = 0; i < 92; i += 6) px(c, 19 + i, 39, 3, 4, CZ.r1)
  for (let i = 0; i < 92; i += 6) px(c, 22 + i, 39, 3, 4, '#fff1dc')
  for (let i = 0; i < 92; i += 4) { px(c, 19 + i, 43, 3, 2, i % 8 ? '#fff1dc' : CZ.r1); px(c, 19 + i, 45, 3, 1, CZ.ink) }
  // biển hiệu sáng
  woodFrame(c, 30, 25, 68, 10)
  px(c, 30, 25, 68, 10, '#4a2e1f')
  const glow = 0.5 + 0.5 * Math.sin(t * 4)
  label(c, 'DREAMERS COFFEE', 64, 30.5, glow > 0.2 ? '#ffe8b8' : '#e6c79c', 6)
  // dây đèn
  for (let x = 16; x < 112; x += 5) {
    const y = 18 + Math.round(3 * Math.sin(((x - 16) / 96) * Math.PI))
    px(c, x, y, 1, 1, CZ.ink)
    px(c, x, y + 1, 2, 2, ['#ffd36b', '#ff9aa8', '#9be3c4'][(((x / 5) | 0) + Math.floor(t * 3)) % 3])
  }
  // bảng phấn chữ A
  px(c, 86, 64, 14, 14, CZ.ink); px(c, 87, 65, 12, 11, '#2c4a40'); px(c, 87, 76, 1, 3, CZ.w2); px(c, 98, 76, 1, 3, CZ.w2)
  label(c, 'OPEN', 93, 69, '#eef2ea', 3.5); px(c, 89, 72, 8, 1, CZ.b2)
  // chậu cây 2 bên cửa
  spr(c, 'boxwood', 32, 80); spr(c, 'pot', 80, 80)
  cobble(c, 80, '#b8ab98')
  // cô chủ vẫy tay + Cáo
  const wave = Math.floor(t * 3) % 2
  standGirl(c, BARISTA, 34, 41, 'happy', 0, blinkAt(t))
  px(c, 49, 46 - wave * 3, 3, 6, '#f3c9a6')
  drawCorgi(c, 60, 64, t, 'stand', true)
  // câu 2: khách đầu tiên bước tới + pháo giấy nổ
  if (l === 1) {
    const cx = Math.round(Math.max(100, 140 - lt * 18))
    const walk = cx > 100 ? Math.floor(t * 8) % 2 : 0
    drawPerson(c, { skin: '#e2b089', hair: '#6b4026', style: 'bun', shirt: '#5b8bd9' }, cx, 44 - walk, 'happy', false)
    px(c, cx + 3, 72, 10, 8, '#3b3550')
    const cols = ['#ff6b81', '#f2c14e', '#5b8bd9', '#2f9e6b', '#ffffff']
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2, sp = 20 + (i % 5) * 7
      const fx = 64 + Math.cos(a) * sp * Math.min(lt, 1.2), fy = 34 + Math.sin(a) * sp * Math.min(lt, 1.2) + lt * lt * 10
      if (fy < H) px(c, Math.round(fx), Math.round(fy), 2, 1 + (i % 2), cols[i % 5])
    }
  }
}
</script>

<template>
  <div class="intro" @click="stage === 'story' && next()">
   <div class="wrap">
    <div class="top">
      <span class="ttl">{{ stage === 'story' ? scene.title : 'DREAMERS COFFEE' }}</span>
      <button class="skip" @click.stop="finish">Bỏ qua <PixelIcon name="play" :size="2" /></button>
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
        <button v-if="isLast" class="go" @click.stop="finish"><PixelIcon name="cup" :size="2" /> Mở quán thôi!</button>
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
.logo { width: 62%; max-width: 260px; aspect-ratio: 1; image-rendering: pixelated; box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #80502c, 0 0 0 7px #bf8a4a, 0 0 0 10px #261c1b, 0 10px 0 10px rgba(0, 0, 0, 0.3); margin-bottom: 14px; }
.tname { font-size: 18px; letter-spacing: 0.2em; color: #ffe8b8; }
.tsub { font-size: 13px; color: #c9a888; margin-bottom: 8px; }
.top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ttl { font-size: 11px; font-weight: 900; letter-spacing: 0.16em; color: #e6c79c; text-transform: uppercase; }
.skip, .go { display: inline-flex; align-items: center; gap: 6px; }
.skip { font-size: 12px; font-weight: 900; padding: 4px 10px 6px; background: #4a2e1f; color: #e6c79c; box-shadow: var(--px-border-2), inset 0 -3px 0 #3b2318; }
/* khung tranh gỗ dày, ốc đồng 4 góc */
.stage { position: relative; box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #80502c, 0 0 0 7px #bf8a4a, 0 0 0 10px #261c1b, 0 10px 0 10px rgba(0, 0, 0, 0.3); margin: 10px; }
.stage::before, .stage::after { content: ''; position: absolute; top: -8px; width: 4px; height: 4px; background: #d5a534; pointer-events: none; }
.stage::before { left: -8px; } .stage::after { right: -8px; }
.cv { display: block; width: 100%; aspect-ratio: 128 / 92; image-rendering: pixelated; image-rendering: crisp-edges; }
.dots { position: absolute; left: 0; right: 0; bottom: -24px; display: flex; justify-content: center; gap: 6px; }
.dots i { width: 8px; height: 4px; background: #5a4334; }
.dots i { transition: width 0.3s, background 0.3s; }
.dots i.done { background: #a16b36; }
.dots i.on { width: 16px; background: #d5a534; }
.box {
  margin: 38px 7px 0; background: #fff4dc; color: #261c1b; padding: 14px 14px 12px; font-size: 16px; line-height: 1.5; font-weight: 600;
  box-shadow: 0 0 0 3px #261c1b, 0 0 0 6px #a16b36, 0 0 0 9px #261c1b, inset 0 -4px 0 #eed59b, 0 9px 0 9px rgba(0, 0, 0, 0.3); min-height: 120px;
  display: flex; flex-direction: column; gap: 8px;
}
.nav { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
.hint { font-size: 11px; color: #a16b36; animation: blink 1.4s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.35; } }
.nxt, .go { font-weight: 900; font-size: 14px; padding: 7px 14px 9px; }
.nxt { background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b; }
.go { background: #2f9e6b; color: #fff; box-shadow: var(--px-border-2), inset 0 -4px 0 #1d6b47; }
</style>
