<script setup lang="ts">
// Trang 3 khi đang bán: KHU BẾP. Cảnh bếp pixel (chảo, nồi mì, khuôn waffle) + phiếu đơn + khay nấu.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { save, ui, staffAll } from '../game/store'
import { moneyShort } from '../game/data'
import { iconUrl, px, box, CZ, drawPerson, type Ctx } from '../game/pixel'
import { KART_W, KART_H, KANCHOR, drawKitchenBack, drawKitchenFront, drawPan, drawPot, drawBowl, drawPlate } from '../game/kitchenArt'
import { coinsFly, sparkle, popText, type Pt } from '../game/fx'
import { sfx } from '../game/audio'
import { CAST } from '../game/story'
import {
  kitchen, kitchenOpen, unlockKitchen, startCook, cookStep, trashCook, foodById, foodStock, canCook,
  KSTEPS, FOOD_INGS, KITCHEN_TOOLS, KITCHEN_ACTIONS, KITCHEN_COST, FOODS, finishMini, type KStep, type FoodIng,
} from '../game/kitchen'
import PixelIcon from './ui/PixelIcon.vue'

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
  return { x: r.left + (sx / KART_W) * r.width, y: r.top + (sy / KART_H) * r.height }
}
watch(() => kitchen.served?.at, () => {
  const s = kitchen.served
  if (!s || ui.page !== 2) return
  const at = scenePt(128, 78)
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
  popText(text, scenePt(128, 50), good ? 'green' : 'red')
  if (good) sparkle(scenePt(128, 72), 10)
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
// Cảnh bếp pixel 2D (kitchenArt.ts) trong không gian KART_W x KART_H. Mỗi điểm ảnh = kscale điểm ảnh màn hình (số nguyên → nét).
function resize() {
  const el = root.value, c = cv.value
  if (!el || !c) return
  const w = Math.min(488, el.clientWidth - 6)
  if (w < 50) return
  cssW.value = w
  const dpr = window.devicePixelRatio || 1
  scale = Math.max(1, Math.ceil((w * dpr) / KART_W))
  if (c.width !== KART_W * scale || c.height !== KART_H * scale) { c.width = KART_W * scale; c.height = KART_H * scale }
  c.style.width = `${Math.floor(w)}px`
  c.style.height = `${Math.round((w * KART_H) / KART_W)}px`
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
const INK = '#3b2a20'
const A = (k: keyof typeof KANCHOR) => [Math.round(KANCHOR[k][0]), Math.round(KANCHOR[k][1])] as const
/** lửa gas liếm quanh đáy chảo / nồi */
function fire(c: Ctx, [bx, by]: readonly [number, number], t: number) {
  for (let i = -9; i <= 9; i += 3) {
    const h = 3 + ((Math.floor(t * 14) + i * 5) & 3) - Math.floor(Math.abs(i) / 5)
    px(c, bx + i, by - h + 1, 2, h, '#ff7a2e'); px(c, bx + i, by - Math.max(1, h - 2) + 1, 1, Math.max(1, h - 2), '#ffd23f')
    px(c, bx + i, by + 1, 2, 1, '#5b8bd9')
  }
}
function steam(c: Ctx, x: number, y: number, t: number, n = 4, spread = 4) {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.9 + i / n) % 1
    px(c, x + (i - n / 2) * spread + Math.round(Math.sin(t * 3 + i * 2) * 2), Math.round(y - k * 22), 2, 3, `rgba(255,255,255,${(0.8 * (1 - k)).toFixed(2)})`)
  }
}
function draw(t: number) {
  const c = ctx
  if (!c) return
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  const ck = kitchen.cook
  const act = ck?.action && KSTEPS[ck.action].kind === 'act' ? ck.action : null
  const done = new Set(ck?.done ?? [])
  const f = ck ? foodById[ck.food] : null
  // lớp sau: sàn, tường, tủ treo, máy hút mùi
  drawKitchenBack(c)
  // Yến đứng sau quầy sơ chế (vẽ to x2 cho hợp tỉ lệ đồ bếp)
  c.save(); c.scale(2, 2)
  drawPerson(c, CAST.yen.look, 35, 15 - (act ? Math.floor(t * 6) % 2 : 0), ck ? 'happy' : 'neutral', Math.floor(t * 10) % 41 === 0)
  c.restore()
  // lớp trước: tủ lạnh, quầy, bếp gas, bồn rửa
  drawKitchenFront(c)

  // --- chảo: bánh mì chảo ---
  if (act === 'chien') fire(c, A('burnerL'), t)
  drawPan(c)
  const [px0, py0] = A('panIn')
  if (f?.id === 'banhMiChao') {
    if (done.has('pate')) { px(c, px0 - 7, py0 - 1, 5, 2, '#c9875a'); px(c, px0 - 6, py0 - 1, 3, 1, '#e2a77a') }
    if (done.has('trungGa')) { px(c, px0 - 2, py0 - 2, 7, 4, '#fbf3e4'); px(c, px0, py0 - 1, 3, 2, done.has('chien') ? '#e8a23a' : '#f2c14e') }
    if (done.has('xucXich')) { px(c, px0 + 4, py0 - 2, 5, 2, '#d9574a'); px(c, px0 - 6, py0 + 1, 5, 2, '#d9574a'); px(c, px0 + 5, py0 - 2, 3, 1, '#f08a74') }
    if (done.has('chien') && act !== 'chien') { px(c, px0 - 6, py0 + 1, 5, 1, '#9e2f26'); px(c, px0 + 4, py0 - 1, 5, 1, '#9e2f26') }
    if (done.has('banhMi')) { px(c, px0 + 6, py0 - 7, 14, 5, INK); px(c, px0 + 7, py0 - 6, 12, 3, '#e3a24c'); px(c, px0 + 8, py0 - 6, 9, 1, '#f6cf86'); for (const dx of [10, 13, 16]) px(c, px0 + dx, py0 - 5, 1, 1, '#b9762e') }
  }
  if (act === 'chien') for (let i = 0; i < 5; i++) { const k = (t * 1.6 + i / 5) % 1; px(c, px0 - 8 + i * 4 + Math.round(Math.sin(t * 9 + i)), Math.round(py0 - 3 - k * 10), 1, 1, `rgba(255,255,255,${(0.9 * (1 - k)).toFixed(2)})`) }

  // --- nồi trụng mì ---
  if (act === 'luoc') fire(c, A('burnerR'), t)
  drawPot(c)
  const [qx, qy] = A('potIn')
  const isMi = f?.id === 'miTronCay'
  const boiling = act === 'luoc'
  px(c, qx - 8, qy, 17, 2, boiling ? '#cfeaf6' : '#9fd3ea')
  if (boiling) for (let i = 0; i < 4; i++) px(c, qx - 6 + i * 4, qy + ((Math.floor(t * 10) + i) & 1), 2, 1, '#ffffff')
  if (isMi && done.has('mi') && !done.has('to')) { px(c, qx - 6, qy, 13, 2, '#f2cf6b'); for (let i = 0; i < 4; i++) px(c, qx - 5 + i * 3, qy + (i & 1), 2, 1, '#d9a92e') }
  if (boiling || (isMi && done.has('mi') && !done.has('to'))) steam(c, qx, qy - 2, t)

  // --- tô mì trộn ---
  if (isMi && done.has('to')) {
    const sh = act === 'tron' ? Math.round(Math.sin(t * 40) * 1.5) : 0
    c.save(); c.translate(sh, 0)
    drawBowl(c)
    const [bx, by] = A('bowl')
    if (done.has('mi')) { px(c, bx - 9, by - 2, 19, 3, '#f2cf6b'); for (let i = 0; i < 5; i++) px(c, bx - 8 + i * 4, by - 2 + (i & 1), 3, 1, '#d9a92e') }
    if (done.has('sotCay')) px(c, bx - 6, by - 3, 7, 2, done.has('tron') ? '#e8703a' : '#d8333a')
    if (done.has('tron')) { px(c, bx - 9, by - 2, 19, 1, '#e89a4a'); px(c, bx - 4, by, 9, 1, '#e8703a') }
    if (done.has('trungGa')) { px(c, bx + 2, by - 4, 6, 3, '#fbf3e4'); px(c, bx + 4, by - 3, 2, 1, '#f2c14e') }
    if (done.has('tron')) { px(c, bx - 2, by - 4, 1, 1, '#3f7a5c'); px(c, bx + 6, by - 2, 1, 1, '#3f7a5c') }
    if (act === 'tron') { const w = Math.round(Math.sin(t * 30) * 2); px(c, bx - 1 + w, by - 18, 1, 16, '#c9875a'); px(c, bx + 3 + w, by - 17, 1, 15, '#c9875a') }
    c.restore()
  }

  // --- khuôn waffle (đặt trên quầy giữa) ---
  const [wx, wy] = A('waffle')
  const isW = !!f && f.id.startsWith('waffle')
  const closed = act === 'nuong'
  const IRON = '#4a4f57', IRON_L = '#6b7380', IRON_D = '#2b2f35'
  const grid = (y: number, h: number) => { for (let x = wx - 10; x <= wx + 10; x += 5) px(c, x, y, 1, h, IRON_D); px(c, wx - 12, y + Math.floor(h / 2), 24, 1, IRON_D) }
  if (!closed) {
    // nắp mở ngả ra sau: mặt trong có ô vuông
    box(c, wx - 13, wy - 19, 26, 11, IRON, INK); px(c, wx - 12, wy - 18, 24, 1, IRON_L)
    px(c, wx - 11, wy - 16, 22, 6, '#3a3f46'); grid(wy - 16, 6)
  }
  // đế khuôn + tay cầm gỗ
  box(c, wx - 14, wy - 8, 28, 8, IRON, INK); px(c, wx - 13, wy - 7, 26, 1, IRON_L)
  px(c, wx - 12, wy - 6, 24, 4, '#3a3f46'); grid(wy - 6, 4)
  px(c, wx + 14, wy - 5, 7, 2, CZ.w1); px(c, wx + 19, wy - 5, 2, 2, INK)
  if (isW && done.has('botWaffle') && !done.has('dia') && !closed) {
    const col = done.has('nuong') ? '#e7b35a' : '#f6e3b0'
    px(c, wx - 11, wy - 6, 22, 4, col)
    for (let x = wx - 9; x < wx + 10; x += 5) px(c, x, wy - 6, 1, 4, done.has('nuong') ? '#b9802f' : '#e6cf96')
    if (f!.steps[2] && done.has(f!.steps[2])) { px(c, wx - 4, wy - 5, 8, 2, f!.filling!); px(c, wx + 5, wy - 4, 2, 1, f!.filling!) }
  }
  if (closed) {
    // đóng nắp nướng: viền đỏ rực + hơi nóng
    box(c, wx - 14, wy - 13, 28, 6, IRON, INK); px(c, wx - 13, wy - 12, 26, 1, IRON_L)
    px(c, wx - 12, wy - 8, 24, 1, Math.floor(t * 6) % 2 ? '#ff7a2e' : '#d8333a')
    steam(c, wx, wy - 14, t, 3, 7)
  }

  // --- đĩa ra món waffle (đặt trên thớt) ---
  if (isW && done.has('dia')) {
    drawPlate(c)
    const [lx, ly] = A('plate')
    box(c, lx - 9, ly - 6, 18, 7, '#e7b35a', '#8a5a1c')
    for (let x = lx - 6; x < lx + 7; x += 4) px(c, x, ly - 5, 1, 5, '#b9802f')
    px(c, lx - 2, ly - 7, 6, 2, f!.filling!); px(c, lx + 4, ly - 3, 3, 1, f!.filling!)
  }

  // món vừa ra: loé sáng cả bếp
  const sv = kitchen.served
  if (sv && performance.now() - sv.at < 1400) {
    const a = 1 - (performance.now() - sv.at) / 1400
    c.fillStyle = `rgba(255, 240, 180, ${0.35 * a})`; c.fillRect(0, 0, KART_W, KART_H)
  }
  // bếp chưa mở: tối + mạng nhện
  if (!kitchenOpen()) {
    c.fillStyle = 'rgba(40, 30, 25, 0.6)'; c.fillRect(0, 0, KART_W, KART_H)
    for (const x of [0, KART_W - 28]) for (let i = 0; i < 28; i++) px(c, x + (x ? 27 - i : i), 0, 1, 28 - i, 'rgba(230,230,230,0.1)')
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
      <div v-if="!kitchenOpen()" class="kclosed">
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
.kclosed { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; text-align: center; line-height: 1.35; color: #fff4dc; }
.kclosed > b { font-size: 14px; letter-spacing: 0.08em; text-shadow: 0 2px 0 #3b2a20; }
.kclosed > span { font-size: 12px; font-weight: 700; text-shadow: 0 1px 0 #3b2a20; }

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
