<script setup lang="ts">
// Trang 3 khi đang bán: KHU BẾP. Cảnh bếp pixel (chảo, nồi mì, khuôn waffle) + phiếu đơn + khay nấu.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { save, ui, staffAll } from '../game/store'
import { moneyShort } from '../game/data'
import { iconUrl, px, box, SCENE_W, CZ, drawPerson, type Ctx } from '../game/pixel'
import { coinsFly, sparkle, popText, type Pt } from '../game/fx'
import { sfx } from '../game/audio'
import { CAST } from '../game/story'
import {
  kitchen, kitchenOpen, unlockKitchen, startCook, cookStep, trashCook, foodById, foodStock, canCook,
  KSTEPS, FOOD_INGS, KITCHEN_TOOLS, KITCHEN_ACTIONS, KITCHEN_COST, FOODS, finishMini, type KStep, type FoodIng,
} from '../game/kitchen'
import PixelIcon from './ui/PixelIcon.vue'

const ASPECT = 256 / 488
const H = Math.round(SCENE_W * ASPECT) // 67 điểm ảnh
const root = ref<HTMLDivElement>()
const cv = ref<HTMLCanvasElement>()
let ctx: Ctx | null = null
let scale = 3
let raf = 0
const cssW = ref(0)

const cook = computed(() => kitchen.cook)
const food = computed(() => (cook.value ? foodById[cook.value.food] : null))
const curStep = computed(() => (cook.value && food.value ? food.value.steps[cook.value.done.length] ?? null : null))
// khay: chỉ nguyên liệu + dụng cụ mà thực đơn bếp dùng
const tray = computed<KStep[]>(() => [...FOOD_INGS.map((i) => i.id), ...KITCHEN_TOOLS])
const label = (s: KStep) => KSTEPS[s].label
const stockOf = (s: KStep) => (KSTEPS[s].kind === 'ing' ? foodStock(s as FoodIng) : null)
const shaking = ref(false)
watch(() => cook.value?.shake, (n, o) => { if (n && n !== o) { shaking.value = true; setTimeout(() => (shaking.value = false), 300) } })

// ---- hiệu ứng ra món ----
function scenePt(sx: number, sy: number): Pt {
  const r = cv.value?.getBoundingClientRect()
  if (!r) return { x: innerWidth / 2, y: innerHeight / 3 }
  return { x: r.left + (sx / SCENE_W) * r.width, y: r.top + (sy / H) * r.height }
}
watch(() => kitchen.served?.at, () => {
  const s = kitchen.served
  if (!s || ui.page !== 2) return
  const at = scenePt(64, 40)
  coinsFly(at, s.perfect ? 5 : 2)
  if (s.perfect) sparkle(at, 16)
})

// ---------- MINI-GAME thao tác nấu ----------
//  Áp chảo: GIỮ nút, thả khi độ chín vào vùng vàng · Nướng waffle: khuôn tự nóng, chạm MỞ KHUÔN đúng lúc
//  Trụng mì: kim chạy qua lại, chạm VỚT MÌ khi kim trong vùng xanh · Trộn mì: chạm liên tục đủ 10 lần trong 3,5 giây
const mini = computed(() => kitchen.cook?.mini ?? null)
const heat = ref(0) // độ chín 0..1 (quá 1 = cháy)
const needle = ref(0.5)
const taps = ref(0)
const left = ref(1) // thời gian còn lại (tỉ lệ) cho trộn
const holding = ref(false)
const ZONE: Record<string, [number, number]> = { chien: [0.6, 0.82], nuong: [0.62, 0.84], luoc: [0.4, 0.6] }
const TRON_TAPS = 10, TRON_MS = 3500, LUOC_MS = 6000
let holdAt = 0, sizzleT = 0 // tính theo ĐỒNG HỒ THẬT (không cộng dồn theo khung hình) → máy giật cũng không lệch
watch(mini, () => { heat.value = 0; taps.value = 0; needle.value = 0.5; left.value = 1; holding.value = false })
/** đọc trạng thái mới nhất ngay lúc chạm (không chờ khung hình kế tiếp) */
function sample(now = performance.now()) {
  const m = mini.value
  if (!m) return
  const el = now - m.at
  if (m.step === 'chien' && holding.value) heat.value = ((now - holdAt) / 1000) * 0.42
  else if (m.step === 'nuong') heat.value = (el / 1000) * 0.3
  else if (m.step === 'luoc') needle.value = 0.5 + 0.5 * Math.sin((el / 1000) * 3.6)
  else if (m.step === 'tron') left.value = Math.max(0, 1 - el / TRON_MS)
}
const miniInfo = computed(() => {
  const m = mini.value
  if (!m) return null
  return {
    chien: { title: 'ÁP CHẢO', tip: 'Giữ nút để chiên – thả tay khi thanh vào vùng VÀNG GIÒN', btn: holding.value ? 'ĐANG CHIÊN… THẢ ĐÚNG LÚC' : 'GIỮ ĐỂ CHIÊN' },
    nuong: { title: 'NƯỚNG WAFFLE', tip: 'Khuôn đang nóng dần – mở khuôn khi bánh vàng đều', btn: 'MỞ KHUÔN' },
    luoc: { title: 'TRỤNG MÌ', tip: 'Chạm VỚT MÌ khi kim nằm trong vùng xanh', btn: 'VỚT MÌ' },
    tron: { title: 'TRỘN MÌ', tip: `Chạm liên tục cho thấm sốt: ${Math.min(taps.value, TRON_TAPS)}/${TRON_TAPS}`, btn: 'TRỘN!' },
  }[m.step]
})
function endMini(good: boolean, text: string) {
  popText(text, scenePt(64, 26), good ? 'green' : 'red')
  if (good) sparkle(scenePt(64, 36), 10)
  holding.value = false
  finishMini(good)
}
function updateMini(now: number) {
  const m = mini.value
  if (!m) return
  const el = now - m.at
  sample(now)
  if (m.step === 'chien') {
    if (holding.value) {
      if (now - sizzleT > 380) { sizzleT = now; sfx('pour') }
      if (heat.value >= 1) endMini(false, 'Cháy rồi!')
    }
  } else if (m.step === 'nuong') {
    if (now - sizzleT > 600) { sizzleT = now; sfx('pour') }
    if (heat.value >= 1) endMini(false, 'Waffle cháy khét!')
  } else if (m.step === 'luoc') {
    if (el > LUOC_MS) endMini(false, 'Mì nở bủng rồi…')
  } else if (m.step === 'tron') {
    if (el > TRON_MS) endMini(false, 'Trộn chưa đều')
  }
}
const inZone = (v: number, z: [number, number]) => v >= z[0] && v <= z[1]
function miniDown() {
  const m = mini.value
  if (!m) return
  sample()
  if (m.step === 'chien') { if (!holding.value) { holding.value = true; holdAt = performance.now(); sfx('pour') } }
  else if (m.step === 'nuong') endMini(inZone(heat.value, ZONE.nuong), inZone(heat.value, ZONE.nuong) ? 'Vàng đều, thơm phức!' : heat.value < ZONE.nuong[0] ? 'Bánh còn sống…' : 'Hơi cháy rồi')
  else if (m.step === 'luoc') endMini(inZone(needle.value, ZONE.luoc), inZone(needle.value, ZONE.luoc) ? 'Mì dai vừa!' : needle.value < ZONE.luoc[0] ? 'Mì còn cứng' : 'Mì hơi nhũn')
  else if (m.step === 'tron') {
    taps.value++
    sfx('stir')
    if (taps.value >= TRON_TAPS) endMini(true, 'Trộn đều, thấm sốt!')
  }
}
function miniUp() {
  const m = mini.value
  if (!m || m.step !== 'chien' || !holding.value) return
  sample()
  holding.value = false
  if (heat.value < 0.05) return // chạm nhầm, chưa chiên
  const good = inZone(heat.value, ZONE.chien)
  endMini(good, good ? 'Vàng giòn, chuẩn bài!' : heat.value < ZONE.chien[0] ? 'Còn sống, chưa vàng' : 'Hơi cháy rồi')
}
// thanh đo: vị trí kim + vùng chuẩn
const gauge = computed(() => {
  const m = mini.value
  if (!m) return null
  if (m.step === 'tron') return { kind: 'fill', v: Math.min(1, taps.value / TRON_TAPS), left: left.value }
  const z = ZONE[m.step]
  return { kind: m.step === 'luoc' ? 'water' : 'heat', v: m.step === 'luoc' ? needle.value : Math.min(1, heat.value), z }
})

// ---- kích thước ----
function resize() {
  const el = root.value, c = cv.value
  if (!el || !c) return
  const w = Math.min(488, el.clientWidth - 6)
  if (w < 50) return
  cssW.value = w
  const dpr = window.devicePixelRatio || 1
  scale = Math.max(1, Math.ceil((w * dpr) / SCENE_W))
  if (c.width !== SCENE_W * scale || c.height !== H * scale) { c.width = SCENE_W * scale; c.height = H * scale }
  c.style.width = `${Math.floor(w)}px`
  c.style.height = `${Math.round(w * ASPECT)}px`
  ctx = c.getContext('2d')
}
let ro: ResizeObserver | null = null
let lastBg = 0
function frame(now: number) {
  raf = requestAnimationFrame(frame)
  updateMini(now)
  // chưa xem bếp: vẽ thưa cho nhẹ máy
  if (ui.page !== 2 && now - lastBg < 400) return
  lastBg = now
  draw(now / 1000)
}
onMounted(() => {
  resize()
  requestAnimationFrame(resize)
  ro = new ResizeObserver(resize)
  if (root.value) ro.observe(root.value)
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => { cancelAnimationFrame(raf); ro?.disconnect() })

// ---------- Vẽ cảnh bếp ----------
const STEEL = '#c9cfd4', STEEL_D = '#8f979e', STEEL_L = '#eef2f4'
function draw(t: number) {
  const c = ctx
  if (!c) return
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  const ck = kitchen.cook
  const act = ck?.action && KSTEPS[ck.action].kind === 'act' ? ck.action : null
  const done = new Set(ck?.done ?? [])
  const f = ck ? foodById[ck.food] : null
  // tường gạch men trắng
  px(c, 0, 0, SCENE_W, 44, '#f4efe6')
  for (let y = 3; y < 44; y += 5) {
    px(c, 0, y, SCENE_W, 1, '#ddd3c4')
    for (let x = ((y / 5) % 2) * 5; x < SCENE_W; x += 10) px(c, x, y - 4, 1, 4, '#ddd3c4')
  }
  // máy hút mùi inox
  for (let r = 0; r < 12; r++) px(c, 30 - r, r, 44 + r * 2, 1, r === 0 ? STEEL_D : r < 2 ? STEEL_L : STEEL)
  px(c, 18, 12, 68, 2, STEEL_D); px(c, 20, 14, 64, 1, 'rgba(38,28,27,0.2)')
  px(c, 22, 6, 60, 1, STEEL_L)
  if (act === 'chien' || act === 'luoc') px(c, 24, 13, 4, 1, '#6ad08f') // đèn máy hút
  // kệ gia vị bên phải
  px(c, 92, 16, 34, 2, CZ.w3); px(c, 92, 18, 34, 1, CZ.w1)
  for (let i = 0; i < 5; i++) { const x = 94 + i * 6; box(c, x, 9, 5, 7, ['#d8333a', '#f2c14e', '#7fb34d', '#c9875a', '#fbf6ec'][i], '#3b2a20'); px(c, x, 8, 5, 2, '#3b2a20') }
  // dụng cụ treo bên trái
  px(c, 2, 8, 14, 1, STEEL_D)
  px(c, 4, 9, 1, 10, CZ.w2); box(c, 2, 18, 5, 4, STEEL) // muôi
  px(c, 10, 9, 1, 9, CZ.w2); px(c, 8, 17, 5, 5, STEEL_D) // xẻng
  px(c, 14, 9, 1, 7, CZ.w2); box(c, 12, 15, 5, 3, '#4a4f57') // vá
  // Yến đứng bếp (sau quầy)
  drawPerson(c, CAST.yen.look, 2, 24 - (act ? Math.floor(t * 6) % 2 : 0), ck ? 'happy' : 'neutral', Math.floor(t * 10) % 41 === 0)
  // mặt bếp + tủ
  px(c, 0, 44, SCENE_W, 1, CZ.ink)
  px(c, 0, 45, SCENE_W, 3, STEEL_L); px(c, 0, 48, SCENE_W, 1, STEEL_D)
  px(c, 0, 49, SCENE_W, H - 49, CZ.w2)
  for (let x = 2; x < SCENE_W; x += 25) {
    px(c, x, 51, 22, H - 53, CZ.ink); px(c, x + 1, 52, 20, H - 55, CZ.t1); px(c, x + 1, 52, 20, 1, CZ.t0)
    px(c, x + 9, 55, 4, 1, STEEL)
  }
  // bếp gas 2 họng
  box(c, 24, 41, 50, 5, '#2b2f35', CZ.ink)
  for (const bx of [36, 62]) { px(c, bx - 4, 42, 9, 2, '#4a4f57'); px(c, bx - 2, 42, 5, 1, '#6b7380') }
  const fire = (bx: number) => { for (let i = -3; i <= 3; i += 2) { const h = 2 + ((Math.floor(t * 12) + i * 7) & 1) + (i === -1 || i === 1 ? 1 : 0); px(c, bx + i, 41 - h, 1, h, '#ff7a2e'); px(c, bx + i, 41 - 1, 1, 1, '#5b8bd9') } }
  // --- chảo (bánh mì chảo) ---
  const isBM = f?.id === 'banhMiChao'
  if (act === 'chien') fire(36)
  box(c, 27, 35, 19, 5, '#4a4f57', CZ.ink); px(c, 28, 36, 17, 1, '#2b2f35'); px(c, 46, 37, 8, 2, CZ.w1)
  if (isBM) {
    if (done.has('pate')) px(c, 30, 35, 4, 2, '#c9875a')
    if (done.has('trungGa')) { px(c, 34, 34, 6, 3, '#fbf3e4'); px(c, 36, 35, 2, 1, '#f2c14e') }
    if (done.has('xucXich')) { px(c, 40, 34, 5, 2, '#d9574a'); px(c, 31, 33, 4, 2, '#d9574a') }
    if (done.has('chien') && act !== 'chien') px(c, 34, 34, 6, 1, '#e8a23a')
    if (done.has('banhMi')) { px(c, 48, 30, 12, 4, CZ.ink); px(c, 49, 31, 10, 2, '#e3a24c'); px(c, 50, 31, 8, 1, '#f6cf86') }
  }
  if (act === 'chien') for (let i = 0; i < 4; i++) { const yy = 32 - ((t * 20 + i * 4) % 10); px(c, 30 + i * 4 + Math.round(Math.sin(t * 9 + i)), yy, 1, 1, 'rgba(255,255,255,0.8)') }
  // --- nồi trụng mì ---
  const isMi = f?.id === 'miTronCay'
  if (act === 'luoc') fire(62)
  box(c, 54, 30, 16, 11, STEEL, CZ.ink); px(c, 55, 31, 14, 2, '#9fd3ea'); px(c, 52, 33, 2, 2, CZ.ink); px(c, 70, 33, 2, 2, CZ.ink); px(c, 55, 33, 1, 6, STEEL_L)
  if (isMi && done.has('mi') && !done.has('to')) px(c, 57, 31, 10, 2, '#f2cf6b')
  const steamPot = act === 'luoc' || (isMi && done.has('mi') && !done.has('to'))
  if (steamPot) for (let i = 0; i < 4; i++) { const yy = 28 - ((t * 14 + i * 5) % 14); px(c, 57 + i * 3 + Math.round(Math.sin(t * 4 + i) * 1.5), yy, 1, 2, 'rgba(255,255,255,0.75)') }
  // --- tô mì trộn ---
  if (isMi && done.has('to')) {
    const sh = act === 'tron' ? Math.round(Math.sin(t * 40)) : 0
    const bx = 106 + sh
    for (let r = 0; r < 5; r++) { px(c, bx + r, 38 + r, 18 - r * 2, 1, CZ.ink); if (r < 4) px(c, bx + 1 + r, 38 + r, 16 - r * 2, 1, r === 1 ? '#5b8bd9' : '#fbf6ec') }
    px(c, bx + 3, 36, 12, 2, '#f2cf6b'); px(c, bx + 2, 37, 14, 1, CZ.ink)
    if (done.has('sotCay')) px(c, bx + 5, 35, 5, 2, done.has('tron') ? '#e8703a' : '#d8333a')
    if (done.has('trungGa')) { px(c, bx + 10, 34, 4, 2, '#fbf3e4'); px(c, bx + 11, 35, 1, 1, '#f2c14e') }
    if (done.has('tron')) { px(c, bx + 3, 36, 12, 1, '#e89a4a') }
    if (act === 'tron') { px(c, bx + 8, 28, 1, 8, CZ.w3); px(c, bx + 11, 29, 1, 7, CZ.w3) }
  }
  // --- khuôn waffle ---
  const isW = f && f.id.startsWith('waffle')
  const open = !(act === 'nuong')
  box(c, 82, 38, 20, 6, '#4a4f57', CZ.ink)
  for (let i = 85; i < 100; i += 3) px(c, i, 40, 1, 3, '#2b2f35')
  px(c, 102, 40, 4, 2, CZ.w1)
  if (isW && done.has('botWaffle') && !done.has('dia')) { px(c, 84, 39, 16, 3, done.has('nuong') ? '#e7b35a' : '#f6e3b0'); if (done.has(f!.steps[2])) px(c, 90, 40, 4, 1, f!.filling!) }
  if (open) { box(c, 82, 26, 20, 6, '#4a4f57', CZ.ink); px(c, 83, 27, 18, 1, '#6b7380') } // nắp mở dựng đứng
  else { box(c, 82, 34, 20, 5, '#4a4f57', CZ.ink); px(c, 83, 37, 18, 1, (Math.floor(t * 6) % 2) ? '#ff7a2e' : '#d8333a'); for (const x of [86, 92, 98]) px(c, x, 28 + ((t * 12 + x) % 6), 1, 2, 'rgba(255,255,255,0.7)') }
  // waffle ra đĩa
  if (isW && done.has('dia')) {
    px(c, 104, 41, 20, 1, CZ.ink); px(c, 103, 42, 22, 2, '#fbf6ec'); px(c, 104, 44, 20, 1, CZ.ink)
    box(c, 107, 35, 14, 7, '#e7b35a', '#8a5a1c'); for (let i = 110; i < 120; i += 3) px(c, i, 36, 1, 5, '#b9802f'); px(c, 117, 40, 3, 1, f!.filling!)
  }
  // món vừa ra: đĩa lấp lánh giữa quầy
  const sv = kitchen.served
  if (sv && performance.now() - sv.at < 1400) {
    const a = 1 - (performance.now() - sv.at) / 1400
    c.fillStyle = `rgba(255, 240, 180, ${0.35 * a})`; c.fillRect(0, 0, SCENE_W, H)
  }
  // bếp chưa mở: tối + mạng nhện
  if (!kitchenOpen()) {
    c.fillStyle = 'rgba(40, 30, 25, 0.55)'; c.fillRect(0, 0, SCENE_W, H)
    for (const [x, y] of [[0, 0], [SCENE_W - 14, 0]]) for (let i = 0; i < 14; i++) { px(c, x + (x ? 13 - i : i), y, 1, 14 - i, 'rgba(230,230,230,0.12)') }
  }
}

const ticketPct = (id: number) => { const tk = kitchen.tickets.find((x) => x.id === id); return tk ? Math.max(0, tk.t / tk.max) * 100 : 0 }
function act(id: KStep | 'trash') { if (id === 'trash') trashCook(); else cookStep(id) }
const waiting = computed(() => ui.queue.length)
</script>

<template>
  <div ref="root" class="kitchen">
    <div class="scene" :class="{ shake: shaking }">
      <canvas ref="cv" class="pixel" />
      <div class="ktitle"><PixelIcon name="house" :size="2" /> BẾP</div>
      <button v-if="!staffAll && waiting && kitchenOpen()" class="counter-chip" @click="ui.page = 0">Quầy nước: {{ waiting }} khách ›</button>
      <!-- mini-game thao tác nấu -->
      <div v-if="mini && miniInfo && gauge" class="mini" :class="mini.step">
        <div class="mt"><b>{{ miniInfo.title }}</b><small>{{ miniInfo.tip }}</small></div>
        <div class="gauge" :class="gauge.kind">
          <template v-if="gauge.kind === 'fill'">
            <i class="fill" :style="{ width: gauge.v * 100 + '%' }" />
            <i class="time" :style="{ width: (gauge.left ?? 0) * 100 + '%' }" />
          </template>
          <template v-else>
            <i class="zone" :style="{ left: gauge.z![0] * 100 + '%', width: (gauge.z![1] - gauge.z![0]) * 100 + '%' }" />
            <i class="needle" :style="{ left: gauge.v * 100 + '%' }" />
          </template>
        </div>
        <button class="mbtn" :class="{ hold: holding }" @pointerdown.prevent="miniDown" @pointerup.prevent="miniUp" @pointerleave="miniUp" @pointercancel="miniUp" @contextmenu.prevent>{{ miniInfo.btn }}</button>
      </div>
      <div v-if="!kitchenOpen()" class="locked">
        <b>KHU BẾP CÒN ĐÓNG CỬA</b>
        <span>Mở bếp để bán kèm bánh mì chảo, mì trộn cay và waffle nhiều loại nhân. Tặng sẵn 1 gói mỗi nguyên liệu.</span>
        <button class="btn sm accent" :disabled="save.money < KITCHEN_COST" @click="unlockKitchen">MỞ BẾP · {{ moneyShort(KITCHEN_COST) }}</button>
      </div>
    </div>

    <template v-if="kitchenOpen()">
      <!-- phiếu đơn treo trên thanh -->
      <div class="rail">
        <span v-if="!kitchen.tickets.length" class="muted small empty">Chưa có đơn bếp – khách gọi kèm món sẽ hiện phiếu ở đây</span>
        <button v-for="tk in kitchen.tickets" :key="tk.id" class="ticket" :class="{ on: cook?.ticketId === tk.id, low: ticketPct(tk.id) < 30, dis: !canCook(tk.food) }" @pointerdown.prevent="startCook(tk.id)">
          <img :src="iconUrl(tk.food)" class="pix" alt="" />
          <span class="tt"><b>{{ foodById[tk.food].name }}</b><small>{{ tk.name }}</small></span>
          <i class="tbar"><em :style="{ width: ticketPct(tk.id) + '%' }" /></i>
        </button>
      </div>

      <!-- món đang nấu -->
      <div class="recipe">
        <template v-if="food && cook">
          <div class="rhead">
            <span class="rname">{{ food.name }}</span>
            <span v-if="curStep" class="cur">Bước {{ cook.done.length + 1 }}/{{ food.steps.length }}: <b>{{ label(curStep) }}</b></span>
            <span v-else class="cur ok">Ra món!</span>
          </div>
          <div class="steps">
            <span v-for="(s, i) in food.steps" :key="i" class="st" :class="{ done: i < cook.done.length, now: i === cook.done.length }">
              <i>{{ i + 1 }}</i><img :src="iconUrl(s)" class="pix" alt="" />
            </span>
          </div>
        </template>
        <span v-else class="muted hint">{{ staffAll ? 'Nhân viên lo quầy nước – bạn chạm phiếu đơn để nấu' : 'Chạm 1 phiếu đơn để bắt đầu nấu' }}</span>
      </div>

      <div class="tray">
        <button v-for="s in tray" :key="s" class="item" :class="{ out: (stockOf(s) ?? 1) < 1, tool: KSTEPS[s].kind === 'tool' }" @pointerdown.prevent="cookStep(s)">
          <img :src="iconUrl(s)" class="pix ic" alt="" />
          <span class="lbl">{{ label(s) }}</span>
          <span v-if="stockOf(s) !== null" class="qty">{{ stockOf(s) }}</span>
        </button>
      </div>

      <div class="actions">
        <button v-for="a in KITCHEN_ACTIONS" :key="a" class="action" @pointerdown.prevent="act(a)">
          <img :src="iconUrl(a)" class="pix aic" alt="" /><span>{{ label(a) }}</span>
        </button>
        <button class="action trash" @pointerdown.prevent="act('trash')"><img :src="iconUrl('trash')" class="pix aic" alt="" /><span>Đổ bỏ</span></button>
      </div>
    </template>
    <div v-else class="menu-preview">
      <div v-for="f in FOODS" :key="f.id" class="mp"><img :src="iconUrl(f.id)" class="pix" alt="" /><span>{{ f.name }}<small>{{ moneyShort(f.price) }}</small></span></div>
    </div>
  </div>
</template>

<style scoped>
.kitchen { height: 100%; min-height: 0; display: flex; flex-direction: column; padding: 8px 3px 0; }
.kitchen > * { flex: none; }
.scene { position: relative; align-self: center; box-shadow: var(--px-border), 0 7px 0 rgba(59, 42, 32, 0.3); background: #f4efe6; line-height: 0; }
.scene.shake { animation: shake 0.3s; }
@keyframes shake { 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
.pixel { image-rendering: pixelated; image-rendering: crisp-edges; display: block; }
.ktitle { position: absolute; left: 4px; top: 4px; display: flex; align-items: center; gap: 4px; line-height: 1; font-size: 10px; font-weight: 900; letter-spacing: 0.12em; color: #ffe8b8; background: rgba(59, 42, 32, 0.85); padding: 3px 6px; }
.counter-chip { position: absolute; right: 4px; top: 4px; line-height: 1; font-size: 10px; font-weight: 900; color: #3b2a20; background: #f2c14e; padding: 4px 6px; box-shadow: 0 0 0 2px #3b2a20; animation: chip 1s ease-in-out infinite; }
@keyframes chip { 50% { filter: brightness(1.15); } }
.locked { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; text-align: center; line-height: 1.35; color: #fff4dc; }
.locked b { font-size: 14px; letter-spacing: 0.08em; text-shadow: 0 2px 0 #3b2a20; }
.locked span { font-size: 12px; font-weight: 700; text-shadow: 0 1px 0 #3b2a20; }

.mini {
  position: absolute; left: 4%; right: 4%; bottom: 5px; z-index: 5;
  display: flex; flex-direction: column; gap: 5px; padding: 6px 8px 8px; line-height: 1.2;
  background: rgba(255, 250, 240, 0.96); box-shadow: 0 0 0 3px #3b2a20, 0 4px 0 3px rgba(0, 0, 0, 0.3);
  animation: miniIn 0.18s cubic-bezier(.3, 1.5, .5, 1);
}
@keyframes miniIn { from { transform: translateY(12px) scale(0.92); opacity: 0; } }
.mt { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
.mt b { font-size: 12px; letter-spacing: 0.1em; color: #b8262c; }
.mt small { font-size: 10px; font-weight: 700; color: #6f4e37; }
.gauge { position: relative; height: 14px; box-shadow: 0 0 0 2px #3b2a20; overflow: hidden; }
.gauge.heat { background: linear-gradient(90deg, #f6e9c8 0%, #f2d07a 45%, #e7a23a 70%, #8a3a14 88%, #2b1a10 100%); }
.gauge.water { background: linear-gradient(90deg, #cfe8f4, #8fc6e0 50%, #cfe8f4); }
.gauge.fill { background: #e6d6c2; }
.gauge .zone { position: absolute; top: 0; bottom: 0; background: rgba(47, 158, 107, 0.45); box-shadow: inset 0 0 0 2px #2f9e6b; }
.gauge.heat .zone { background: rgba(255, 215, 80, 0.35); box-shadow: inset 0 0 0 2px #fff3a8; }
.gauge .needle { position: absolute; top: -2px; bottom: -2px; width: 4px; margin-left: -2px; background: #3b2a20; box-shadow: 0 0 0 1px #fff; }
.gauge .fill { position: absolute; left: 0; top: 0; bottom: 4px; background: #f2c14e; }
.gauge .time { position: absolute; left: 0; bottom: 0; height: 4px; background: #d8333a; }
.mbtn {
  font-size: 15px; font-weight: 900; letter-spacing: 0.06em; padding: 9px 0; color: #3b2a20;
  background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, 0 4px 0 rgba(59, 42, 32, 0.45);
  touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
}
.mbtn:active, .mbtn.hold { transform: translateY(3px); box-shadow: var(--px-border-2), inset 0 -2px 0 #d99a2b; }
.mbtn.hold { background: #ff9a3c; animation: holdPulse 0.3s ease-in-out infinite alternate; }
@keyframes holdPulse { to { filter: brightness(1.12); } }
.mini.tron .mbtn { background: #9fe0b8; box-shadow: var(--px-border-2), inset 0 -4px 0 #2f9e6b, 0 4px 0 rgba(59, 42, 32, 0.45); }
.rail { display: flex; gap: 6px; overflow-x: auto; margin: 10px 3px 0; padding: 4px 4px 6px; min-height: 52px; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 8px), #6f4630; box-shadow: var(--px-border), inset 0 3px 0 #8a5a3c; align-items: center; }
.rail .empty { color: #e6c79c; padding: 0 6px; }
.ticket { position: relative; flex: none; display: flex; align-items: center; gap: 5px; padding: 4px 7px 7px 5px; background: #fffaf0; text-align: left; box-shadow: var(--px-border-2), 0 3px 0 rgba(0, 0, 0, 0.3); transform: rotate(-1deg); }
.ticket:nth-child(even) { transform: rotate(1deg); }
.ticket img { width: 26px; height: 26px; }
.ticket .tt { display: flex; flex-direction: column; line-height: 1.15; }
.ticket b { font-size: 11px; }
.ticket small { font-size: 9px; color: var(--muted); max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ticket .tbar { position: absolute; left: 4px; right: 4px; bottom: 2px; height: 3px; background: #e6d6c2; }
.ticket .tbar em { display: block; height: 100%; background: #2f9e6b; }
.ticket.low .tbar em { background: #d8333a; }
.ticket.low { animation: tk 0.5s ease-in-out infinite alternate; }
@keyframes tk { to { transform: rotate(2deg); } }
.ticket.on { background: #ffe9a8; box-shadow: 0 0 0 3px #d99a2b, 0 3px 0 rgba(0, 0, 0, 0.3); }
.ticket.dis { opacity: 0.55; }

.recipe { display: flex; flex-wrap: wrap; align-items: center; align-content: center; gap: 6px 8px; min-height: 50px; margin: 6px 3px 0; }
.rhead { display: flex; flex: 1 1 0; align-items: baseline; gap: 8px; min-width: 0; }
.rname { font-weight: 900; font-size: 13px; white-space: nowrap; }
.cur { font-size: 11px; color: #6f4e37; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cur.ok { color: var(--good); font-weight: 900; }
.hint { font-size: 12px; }
.steps { flex: 1 1 100%; display: flex; flex-wrap: wrap; gap: 4px; }
.st { position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 24px; background: #fffaf2; box-shadow: 0 0 0 2px #cdb79c; }
.st i { position: absolute; top: -5px; left: -5px; font-style: normal; font-size: 8px; font-weight: 900; background: #fff; color: #8a7566; padding: 0 2px; box-shadow: 0 0 0 1px #cdb79c; line-height: 10px; }
.st img { width: 16px; height: 16px; }
.st.done { background: #c9f0d8; box-shadow: 0 0 0 2px #2f9e6b; opacity: 0.6; }
.st.now { background: #f2c14e; box-shadow: 0 0 0 2px #3b2a20, inset 0 -2px 0 #d99a2b; }

.tray { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; background: repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 8px), #a06c46; padding: 5px; margin: 6px 3px 0; box-shadow: var(--px-border), inset 0 3px 0 #b98a62, inset 0 -4px 0 #7a4e33; }
.item { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fffaf2; min-height: 40px; box-shadow: var(--px-border-2), inset 0 -3px 0 #e6d6c2, 0 3px 0 rgba(59, 42, 32, 0.5); }
.item.tool { background: #e8eef0; }
.item:active { transform: translateY(3px); box-shadow: var(--px-border-2); }
.item.out { opacity: 0.45; }
.ic { width: 24px; height: 24px; }
.lbl { font-size: 9px; font-weight: 800; white-space: nowrap; }
.qty { position: absolute; top: 1px; right: 3px; font-size: 9px; font-weight: 900; color: #8a7566; }
.actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 8px 3px 0; }
.action { display: flex; flex-direction: column; align-items: center; gap: 1px; background: #f2c14e; padding: 3px 0 5px; font-size: 11px; font-weight: 900; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 4px 0 rgba(59, 42, 32, 0.5); }
.action:active { transform: translateY(3px); box-shadow: var(--px-border-2); }
.action.trash { background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -4px 0 #d8bf9f, 0 4px 0 rgba(59, 42, 32, 0.5); }
.aic { width: 24px; height: 24px; }
.menu-preview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 12px 3px 0; }
.mp { display: flex; align-items: center; gap: 5px; background: #fffaf0; padding: 5px; box-shadow: var(--px-border-2); font-size: 11px; font-weight: 800; line-height: 1.2; }
.mp img { width: 26px; height: 26px; }
.mp small { display: block; color: var(--good); }
@media (max-height: 720px) {
  .item { min-height: 34px; }
  .ic, .aic { width: 20px; height: 20px; }
  .rail { min-height: 44px; margin-top: 6px; }
  .ticket img { width: 20px; height: 20px; }
}
</style>
