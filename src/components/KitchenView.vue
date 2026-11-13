<script setup lang="ts">
// Trang 3 khi đang bán: KHU BẾP. Cảnh bếp pixel (chảo, nồi mì, khuôn waffle) + phiếu đơn + khay nấu.
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { save, ui, staffAll, DAY_LENGTH } from '../game/store'
import { moneyShort } from '../game/data'
import { iconUrl, px, box, CZ, drawPerson, type Ctx } from '../game/pixel'
import { DRAW16 } from '../game/icons16'
import { KART_W, KART_H, KANCHOR, drawKitchenBack, drawKitchenFront, drawPan, drawPot, drawBowl, drawPlate } from '../game/kitchenArt'
import { coinsFly, sparkle, popText, type Pt } from '../game/fx'
import { sfx } from '../game/audio'
import { CAST } from '../game/story'
import {
  kitchen, kitchenOpen, unlockKitchen, startCook, cookStep, trashCook, foodById, foodStock, canCook,
  KSTEPS, KITCHEN_COST, FOODS, finishMini, type KStep, type FoodIng,
} from '../game/kitchen'
import PixelIcon from './ui/PixelIcon.vue'
import PixelNum from './ui/PixelNum.vue'
import { L } from '../game/i18n'
import { drawCeiling } from '../game/depth'
import { drawSeasonCeiling } from '../game/seasonArt'
import { season } from '../game/season'

const root = ref<HTMLDivElement>()
const cv = ref<HTMLCanvasElement>()
let ctx: Ctx | null = null
let scale = 3
let raf = 0
const cssW = ref(0)

const cook = computed(() => kitchen.cook)
const food = computed(() => (cook.value ? foodById[cook.value.food] : null))
const curStep = computed(() => (cook.value && food.value ? food.value.steps[cook.value.done.length] ?? null : null))
// thực đơn bếp (khi chưa nấu): số phần còn nấu được theo kho + số đơn đang chờ
const menuCards = computed(() => FOODS.map((f) => {
  const need: Record<string, number> = {}
  for (const st of f.steps) if (KSTEPS[st].kind === 'ing') need[st] = (need[st] ?? 0) + 1
  const can = Math.min(...Object.entries(need).map(([id, n]) => Math.floor(foodStock(id as FoodIng) / n)))
  const tks = kitchen.tickets.filter((t) => t.food === f.id)
  return { id: f.id, name: f.name, price: f.price, can, wait: tks.length, ticket: tks[0]?.id ?? 0 }
}))
// bàn nấu: dụng cụ + thao tác của món, xếp ĐÚNG THỨ TỰ LÀM (đọc trái → phải là ra quy trình); nguyên liệu Yến tự bỏ
const ops = computed(() => {
  const f = food.value
  if (!f) return []
  const remain = cook.value ? f.steps.slice(cook.value.done.length) : f.steps
  const out: { s: KStep; n: number[]; act: boolean; used: boolean }[] = []
  f.steps.forEach((st, i) => {
    if (KSTEPS[st].kind === 'ing') return
    const o = out.find((x) => x.s === st)
    if (o) o.n.push(i + 1)
    else out.push({ s: st, n: [i + 1], act: KSTEPS[st].kind === 'act', used: false })
  })
  for (const o of out) o.used = !remain.includes(o.s)
  return out
})

const label = (s: KStep) => KSTEPS[s].label
const shaking = ref(false)
watch(() => cook.value?.shake, (n, o) => { if (n && n !== o) { shaking.value = true; setTimeout(() => (shaking.value = false), 300) } })

// ---- hiệu ứng ra món ----
function scenePt(sx: number, sy: number): Pt {
  const r = cv.value?.getBoundingClientRect()
  if (!r) return { x: innerWidth / 2, y: innerHeight / 3 }
  return { x: r.left + (sx / KART_W) * r.width, y: r.top + ((sy + kg.top) / kH()) * r.height }
}
watch(() => kitchen.served?.at, () => {
  const s = kitchen.served
  if (!s || ui.page !== 2) return
  const at = scenePt(88, 56)
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
    chien: { title: L('ÁP CHẢO', 'PAN-FRY'), tip: L('Giữ nút để chiên – thả tay khi thanh vào vùng VÀNG GIÒN', 'Hold to fry – let go when the bar hits GOLDEN CRISPY'), btn: holding.value ? L('ĐANG CHIÊN… THẢ ĐÚNG LÚC', 'FRYING… LET GO IN TIME') : L('GIỮ ĐỂ CHIÊN', 'HOLD TO FRY') },
    nuong: { title: L('NƯỚNG WAFFLE', 'BAKE WAFFLE'), tip: L('Khuôn đang nóng dần – mở khuôn khi bánh vàng đều', 'The iron is heating up – open it when the waffle is evenly golden'), btn: L('MỞ KHUÔN', 'OPEN IRON') },
    luoc: { title: L('TRỤNG MÌ', 'BOIL NOODLES'), tip: L('Chạm VỚT MÌ khi kim nằm trong vùng xanh', 'Tap DRAIN when the needle is in the green zone'), btn: L('VỚT MÌ', 'DRAIN') },
    tron: { title: L('TRỘN MÌ', 'TOSS NOODLES'), tip: L(`Chạm liên tục cho thấm sốt: ${Math.min(taps.value, TRON_TAPS)}/${TRON_TAPS}`, `Tap fast to coat in sauce: ${Math.min(taps.value, TRON_TAPS)}/${TRON_TAPS}`), btn: L('TRỘN!', 'TOSS!') },
  }[m.step]
})
function endMini(good: boolean, text: string) {
  popText(text, scenePt(88, 36), good ? 'green' : 'red')
  if (good) sparkle(scenePt(88, 56), 10)
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
      if (heat.value >= 1) endMini(false, L('Cháy rồi!', 'Burnt!'))
    }
  } else if (m.step === 'nuong') {
    if (now - sizzleT > 600) { sizzleT = now; sfx('pour') }
    if (heat.value >= 1) endMini(false, L('Waffle cháy khét!', 'Waffle scorched!'))
  } else if (m.step === 'luoc') {
    if (el > LUOC_MS) endMini(false, L('Mì nở bủng rồi…', 'Soggy noodles…'))
  } else if (m.step === 'tron') {
    if (el > TRON_MS) endMini(false, L('Trộn chưa đều', 'Not mixed well'))
  }
}
const inZone = (v: number, z: [number, number]) => v >= z[0] && v <= z[1]
function miniDown() {
  const m = mini.value
  if (!m) return
  sample()
  if (m.step === 'chien') { if (!holding.value) { holding.value = true; holdAt = performance.now(); sfx('pour') } }
  else if (m.step === 'nuong') endMini(inZone(heat.value, ZONE.nuong), inZone(heat.value, ZONE.nuong) ? L('Vàng đều, thơm phức!', 'Golden & fragrant!') : heat.value < ZONE.nuong[0] ? L('Bánh còn sống…', 'Still doughy…') : L('Hơi cháy rồi', 'A bit burnt'))
  else if (m.step === 'luoc') endMini(inZone(needle.value, ZONE.luoc), inZone(needle.value, ZONE.luoc) ? L('Mì dai vừa!', 'Perfectly chewy!') : needle.value < ZONE.luoc[0] ? L('Mì còn cứng', 'Still too firm') : L('Mì hơi nhũn', 'A bit mushy'))
  else if (m.step === 'tron') {
    taps.value++
    sfx('stir')
    if (taps.value >= TRON_TAPS) endMini(true, L('Trộn đều, thấm sốt!', 'Saucy & well mixed!'))
  }
}
function miniUp() {
  const m = mini.value
  if (!m || m.step !== 'chien' || !holding.value) return
  sample()
  holding.value = false
  if (heat.value < 0.05) return // chạm nhầm, chưa chiên
  const good = inZone(heat.value, ZONE.chien)
  endMini(good, good ? L('Vàng giòn, chuẩn bài!', 'Golden crispy, nailed it!') : heat.value < ZONE.chien[0] ? L('Còn sống, chưa vàng', 'Undercooked, not golden') : L('Hơi cháy rồi', 'A bit burnt'))
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
// Màn hình dư chỗ: bếp MỞ RỘNG theo chiều dọc (thêm trần phía trên + sàn phía dưới), không phóng to – giống quầy nước.
const kg = { top: 0, bot: 0 }
const kH = () => KART_H + kg.top + kg.bot
function measure(w: number) {
  const el = root.value!, page = el.parentElement, scene = el.firstElementChild as HTMLElement | null
  if (ui.phase !== 'open' || !page || !scene) return { top: 0, bot: 0 }
  let others = parseFloat(getComputedStyle(el).paddingTop) + 7 + 6 // + bóng đổ dưới khung + chừa chút dư
  for (const ch of Array.from(el.children) as HTMLElement[]) {
    if (ch === scene) continue
    const st = getComputedStyle(ch)
    others += ch.getBoundingClientRect().height + parseFloat(st.marginTop) + parseFloat(st.marginBottom)
  }
  const H = Math.floor(((page.clientHeight - others) * KART_W) / w)
  // luôn rộng thêm tối thiểu ~30 điểm ảnh (trần + sàn) cho bếp thoáng; dư chỗ thì lấp hết (tối đa 170)
  const extra = Math.max(30, Math.min(170, H - KART_H))
  const top = Math.min(44, Math.round(extra * 0.4))
  return { top, bot: extra - top }
}
function resize() {
  const el = root.value, c = cv.value
  if (!el || !c) return
  const w = Math.min(488, el.clientWidth - 6)
  if (w < 50) return
  cssW.value = w
  // đang nấu (khay nấu thay cho menu, cao thấp khác nhau): giữ nguyên khung, không đo lại
  if (!kitchen.cook) Object.assign(kg, measure(w))
  const H = kH()
  const dpr = window.devicePixelRatio || 1
  scale = Math.max(1, Math.ceil((w * dpr) / KART_W))
  if (c.width !== KART_W * scale || c.height !== H * scale) { c.width = KART_W * scale; c.height = H * scale }
  const set = (st: CSSStyleDeclaration, key: 'width' | 'height', v: string) => { if (st[key] !== v) st[key] = v }
  set(c.style, 'width', `${Math.floor(w)}px`)
  set(c.style, 'height', `${Math.round((w * H) / KART_W)}px`)
  ctx = c.getContext('2d')
}
watch(() => [ui.page, ui.phase, !!kitchen.cook], () => requestAnimationFrame(() => requestAnimationFrame(resize)))
window.addEventListener('resize', resize)
onBeforeUnmount(() => window.removeEventListener('resize', resize))
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
const A = (k: keyof typeof KANCHOR) => KANCHOR[k] as readonly [number, number]
const STEEL = '#c3cad0', STEEL_D = '#8f979e', STEEL_L = '#eef2f4', INK = CZ.ink
/** lửa gas liếm quanh đáy chảo / nồi */
function fire(c: Ctx, [bx, by]: readonly [number, number], t: number) {
  for (let i = -5; i <= 5; i += 2) {
    const h = 2 + ((Math.floor(t * 14) + i * 5) & 1) + (Math.abs(i) < 3 ? 1 : 0)
    px(c, bx + i, by - h + 1, 1, h, '#ff7a2e'); px(c, bx + i, by, 1, 1, '#ffd23f')
  }
}
function steam(c: Ctx, x: number, y: number, t: number, n = 3, spread = 3) {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.9 + i / n) % 1
    px(c, x + (i - (n - 1) / 2) * spread + Math.round(Math.sin(t * 3 + i * 2)), Math.round(y - k * 14), 1, 2, `rgba(255,255,255,${(0.85 * (1 - k)).toFixed(2)})`)
  }
}

// ---- Yến đứng bếp (sau quầy, như khách ở quầy nước): đi tới đúng chỗ đang nấu, tay làm theo thao tác ----
type Station = 'pan' | 'pot' | 'bowl' | 'waffle' | 'board'
const STATION_X: Record<Station, number> = { pan: KANCHOR.panIn[0], pot: KANCHOR.potIn[0], bowl: KANCHOR.bowl[0], waffle: KANCHOR.waffle[0], board: KANCHOR.plate[0] + 4 }
/** món + bước → chỗ làm (mì: trụng ở nồi rồi trộn ở tô · waffle: ra đĩa trên thớt) */
function stationOf(food: string, step: KStep | null): Station {
  if (!step) return 'board'
  if (food === 'banhMiChao') return 'pan'
  if (food === 'miTronCay') return step === 'mi' || step === 'luoc' ? 'pot' : 'bowl'
  return step === 'dia' ? 'board' : 'waffle'
}
const YEN_Y = 34 // đỉnh đầu (giống khách ở quầy)
let yenX: number = STATION_X.board, lastT = 0
let seenDone = 0, carry: { step: KStep; until: number } | null = null // món vừa lấy: cầm trên tay rồi thả vào
/** cánh tay: vai → bàn tay; nửa trên là tay áo */
function arm(c: Ctx, x0: number, y0: number, x1: number, y1: number, skin: string, sleeve: string) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))))
  for (const pass of [0, 1]) for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n)
    if (pass === 0) px(c, x - 1, y - 1, 4, 4, INK)
    else px(c, x, y, 2, 2, i < n * 0.45 ? sleeve : skin)
  }
  px(c, Math.round(x1) - 1, Math.round(y1) - 1, 4, 4, INK); px(c, Math.round(x1), Math.round(y1), 2, 2, skin)
}

/** bếp mở rộng: đồ trên phần sàn thêm – thảm bếp trước bếp gas, thùng rau củ, bao gạo */
function floorProps(c: Ctx, t: number) {
  const fy = KART_H - 11, b = kg.bot
  // thảm bếp sọc trước bếp gas (phối cảnh: hình thang)
  const my = fy + 4 + Math.round(b * 0.12), mh = 5 + Math.round(b * 0.16), cx = 88
  for (let y = 0; y < mh; y++) {
    const half = 20 + Math.round((y / mh) * 5)
    px(c, cx - half - 1, my + y, half * 2 + 2, 1, CZ.ink)
    if (y > 0 && y < mh - 1) px(c, cx - half, my + y, half * 2, 1, Math.floor(y / 2) % 2 ? '#c94f3d' : '#e9c58a')
  }
  for (let x = cx - 24; x <= cx + 24; x += 3) px(c, x, my + mh, 1, 2, '#e9c58a') // tua thảm
  // thùng gỗ rau củ (trái, gần người xem)
  const kx = 14, ky = fy + Math.round(b * 0.55)
  box(c, kx, ky, 22, 12, '#b07b52', CZ.ink)
  px(c, kx + 1, ky + 5, 20, 1, '#8a5a3c'); px(c, kx + 1, ky + 1, 20, 1, '#c99a6a')
  for (const [dx, col, hi] of [[2, '#e8703a', '#ffb07a'], [7, '#7fb34d', '#b5e07a'], [12, '#d8333a', '#ff8a8a'], [16, '#f2c14e', '#fff1a8']] as const) {
    px(c, kx + dx, ky - 3, 4, 4, CZ.ink); px(c, kx + dx + 1, ky - 2, 2, 2, col); px(c, kx + dx + 1, ky - 2, 1, 1, hi)
  }
  px(c, kx + 8, ky - 6, 1, 3, '#4f8a2e'); px(c, kx + 9, ky - 7, 2, 1, '#7fb34d') // lá hành
  // bao gạo (phải)
  const gx = KART_W - 34, gy = fy + Math.round(b * 0.45)
  box(c, gx, gy, 16, 14, '#efe3c8', CZ.ink)
  px(c, gx + 2, gy - 2, 12, 2, CZ.ink); px(c, gx + 3, gy - 1, 10, 1, '#d9c9a4')
  px(c, gx + 4, gy + 5, 8, 4, '#d8333a'); px(c, gx + 5, gy + 6, 6, 2, '#fff4dc')
  px(c, gx + 1, gy + 12, 14, 1, '#d9c9a4')
  // hơi ấm loang trên sàn trước bếp
  if (kitchen.cook) { c.fillStyle = `rgba(255, 170, 90, ${0.06 + 0.03 * Math.sin(t * 4)})`; c.fillRect(cx - 26, fy, 52, Math.round(b * 0.4)) }
}

function draw(t: number) {
  const c = ctx
  if (!c) return
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  if (kg.top > 0) { drawCeiling(c, kg.top, save.meta.premise, t, season() === 'xmas', KART_W); drawSeasonCeiling(c, kg.top, t, KART_W) }
  c.setTransform(scale, 0, 0, scale, 0, kg.top * scale) // cảnh bếp gốc nằm dưới phần trần thêm
  const ck = kitchen.cook
  const act = ck?.action && KSTEPS[ck.action].kind === 'act' ? ck.action : null
  const done = new Set(ck?.done ?? [])
  const f = ck ? foodById[ck.food] : null
  const dayFrac = ui.phase === 'open' ? Math.min(1, ui.time / DAY_LENGTH) : 0.15
  drawKitchenBack(c, dayFrac, save.weather === 'rainy')

  // Yến: đi tới chỗ của bước đang làm / bước kế tiếp
  const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t
  const nextStep = f && ck ? f.steps[ck.done.length] ?? null : null
  const doing = (ck?.mini?.step ?? act) as KStep | null
  const st: Station = f ? stationOf(f.id, doing ?? nextStep ?? ck!.done[ck!.done.length - 1] ?? null) : 'board'
  const goal = STATION_X[st]
  const walking = Math.abs(goal - yenX) > 0.5
  if (walking) yenX += Math.sign(goal - yenX) * Math.min(Math.abs(goal - yenX), 70 * dt)
  const yb = walking ? Math.floor(t * 12) % 2 : doing ? Math.floor(t * 6) % 2 : Math.floor(t * 1.5) % 2
  const look = CAST.yen.look
  drawPerson(c, look, Math.round(yenX) - 8, YEN_Y + yb, ck ? 'happy' : 'neutral', Math.floor(t * 10) % 41 === 0)

  drawKitchenFront(c, save.meta.premise, kg.bot)
  if (kg.bot >= 18) floorProps(c, t)

  // --- chảo: bánh mì chảo ---
  if (act === 'chien') fire(c, A('burnerL'), t)
  const jig = act === 'chien' ? Math.round(Math.sin(t * 22) * 1.4) : 0
  const [px0, py0] = A('panIn')
  c.save(); c.translate(jig, 0)
  drawPan(c)
  if (f?.id === 'banhMiChao') {
    if (done.has('pate')) px(c, px0 - 5, py0, 3, 1, '#c9875a')
    if (done.has('trungGa')) { px(c, px0 - 2, py0 - 1, 4, 2, '#fbf3e4'); px(c, px0 - 1, py0 - 1, 2, 1, done.has('chien') ? '#e8a23a' : '#f2c14e') }
    if (done.has('xucXich')) { px(c, px0 + 2, py0 - 1, 3, 1, done.has('chien') ? '#9e2f26' : '#d9574a'); px(c, px0 - 5, py0 + 1, 3, 1, done.has('chien') ? '#9e2f26' : '#d9574a') }
    if (done.has('banhMi')) { px(c, px0 + 3, py0 - 4, 9, 3, INK); px(c, px0 + 4, py0 - 3, 7, 1, '#e3a24c'); px(c, px0 + 5, py0 - 4, 5, 1, '#f6cf86') }
  }
  c.restore()
  if (act === 'chien') steam(c, px0, py0 - 2, t * 1.5, 4, 3)

  // --- nồi trụng mì ---
  if (act === 'luoc') fire(c, A('burnerR'), t)
  drawPot(c)
  const [qx, qy] = A('potIn')
  const isMi = f?.id === 'miTronCay'
  const boiling = act === 'luoc'
  px(c, qx - 6, qy + 1, 13, 1, boiling ? '#cfeaf6' : '#9fd3ea')
  if (boiling) for (let i = 0; i < 3; i++) px(c, qx - 4 + i * 4, qy + 1, 1, 1, (Math.floor(t * 10) + i) % 2 ? '#ffffff' : '#9fd3ea')
  if (isMi && done.has('mi') && !done.has('to')) { px(c, qx - 5, qy + 1, 11, 1, '#f2cf6b'); px(c, qx - 3, qy + 1, 1, 1, '#d9a92e'); px(c, qx + 2, qy + 1, 1, 1, '#d9a92e') }
  if (boiling || (isMi && done.has('mi') && !done.has('to'))) steam(c, qx, qy - 1, t)

  // --- tô mì trộn ---
  if (isMi && done.has('to')) {
    const sh = act === 'tron' ? Math.round(Math.sin(t * 40)) : 0
    c.save(); c.translate(sh, 0)
    drawBowl(c)
    const [bx, by] = A('bowl')
    if (done.has('mi')) { px(c, bx - 6, by - 5, 13, 2, done.has('tron') ? '#e89a4a' : '#f2cf6b'); px(c, bx - 4, by - 5, 1, 1, '#d9a92e'); px(c, bx + 3, by - 4, 1, 1, '#d9a92e') }
    if (done.has('sotCay')) px(c, bx - 4, by - 6, 4, 1, done.has('tron') ? '#e8703a' : '#d8333a')
    if (done.has('trungGa')) { px(c, bx + 1, by - 7, 4, 2, '#fbf3e4'); px(c, bx + 2, by - 6, 1, 1, '#f2c14e') }
    if (done.has('tron')) { px(c, bx - 2, by - 6, 1, 1, '#3f7a5c'); px(c, bx + 5, by - 5, 1, 1, '#3f7a5c') }
    c.restore()
  }

  // --- khuôn waffle (quầy giữa) ---
  const [wx, wy] = A('waffle')
  const isW = !!f && f.id.startsWith('waffle')
  const closed = act === 'nuong'
  const IRON = '#3a3e45', IRON_L = '#5a606a', IRON_D = '#23262b'
  if (!closed) { box(c, wx - 9, wy - 12, 18, 7, IRON, INK); px(c, wx - 8, wy - 11, 16, 1, IRON_L); for (let x = wx - 6; x <= wx + 6; x += 4) px(c, x, wy - 10, 1, 4, IRON_D) }
  box(c, wx - 9, wy - 6, 18, 6, IRON, INK); px(c, wx - 8, wy - 5, 16, 1, IRON_L)
  px(c, wx + 9, wy - 4, 5, 2, CZ.w1); px(c, wx + 13, wy - 4, 1, 2, INK)
  if (isW && done.has('botWaffle') && !done.has('dia') && !closed) {
    px(c, wx - 7, wy - 5, 14, 2, done.has('nuong') ? '#e7b35a' : '#f6e3b0')
    for (let x = wx - 6; x < wx + 7; x += 3) px(c, x, wy - 5, 1, 2, done.has('nuong') ? '#b9802f' : '#e6cf96')
    if (f!.steps[2] && done.has(f!.steps[2])) px(c, wx - 2, wy - 5, 5, 1, f!.filling!)
  }
  if (closed) {
    box(c, wx - 9, wy - 9, 18, 4, IRON, INK); px(c, wx - 8, wy - 8, 16, 1, IRON_L)
    px(c, wx - 8, wy - 6, 16, 1, Math.floor(t * 6) % 2 ? '#ff7a2e' : '#d8333a')
    steam(c, wx, wy - 10, t, 3, 5)
  }

  // --- đĩa ra món waffle (trên thớt) ---
  if (isW && done.has('dia')) {
    drawPlate(c)
    const [lx, ly] = A('plate')
    box(c, lx - 5, ly - 7, 10, 5, '#e7b35a', '#8a5a1c')
    for (let x = lx - 3; x < lx + 4; x += 3) px(c, x, ly - 6, 1, 3, '#b9802f')
    px(c, lx - 1, ly - 8, 4, 1, f!.filling!)
  }

  // tay Yến làm theo thao tác (vẽ đè lên quầy) + dụng cụ cầm tay + nguyên liệu thả vào
  {
    const now = performance.now()
    const sy = YEN_Y + 17 + yb, sl = yenX - 6, sr = yenX + 6
    const sleeve = look.shirt, skin = look.skin
    const w = Math.sin(t * 14), slow = Math.sin(t * 3)
    let hl: [number, number] = [yenX - 7, 59], hr: [number, number] = [yenX + 6, 59]
    let tool: null | (() => void) = null
    const nd = ck?.done.length ?? 0
    if (nd > seenDone && ck) { const s = ck.done[nd - 1]; if (KSTEPS[s].kind !== 'act') carry = { step: s, until: now + 900 } }
    seenDone = nd
    if (!ck) carry = null
    const cp = carry && !doing && now < carry.until ? 1 - (carry.until - now) / 900 : -1 // 0..1: cầm → thả vào
    if (cp >= 0 && cp < 0.5) { hl = [yenX - 5, 57]; hr = [yenX + 4, 57] }
    else if (walking) { hl = [yenX - 8, 57 + Math.round(w)]; hr = [yenX + 7, 57 - Math.round(w)] }
    else if (doing === 'chien') {
      // tay trái lắc cán chảo, tay phải cầm xẻng đảo
      hl = [px0 - 12 + jig, py0]; hr = [px0 + 3 + Math.round(w * 3), py0 - 7]
      tool = () => { px(c, hr[0], hr[1] + 2, 1, 4, CZ.w1); px(c, hr[0] - 2, hr[1] + 6, 5, 1, STEEL_D) }
    } else if (doing === 'luoc') {
      // tay trái giữ quai nồi, tay phải cầm đũa dài khuấy vòng
      const a = t * 8
      hl = [qx - 10, qy + 2]; hr = [qx + 2 + Math.round(Math.cos(a) * 3), qy - 9 + Math.round(Math.sin(a))]
      tool = () => { for (const d of [0, 2]) for (let k = 0; k < 9; k++) px(c, hr[0] + d + Math.round(((qx - hr[0]) * k) / 9), hr[1] + 2 + k, 1, 1, '#c9875a') }
    } else if (doing === 'tron') {
      // tay trái giữ tô, tay phải đảo đũa nhanh trong tô
      const [bx, by] = A('bowl'); const ww = Math.round(Math.sin(t * 30) * 2)
      hl = [bx - 9, by - 3]; hr = [bx + ww, by - 13]
      tool = () => { px(c, hr[0], hr[1] + 2, 1, 8, '#c9875a'); px(c, hr[0] + 2, hr[1] + 2, 1, 8, '#c9875a') }
    } else if (doing === 'nuong') {
      // ấn nắp khuôn, tay kia giữ tay cầm
      hr = [wx + 12, wy - 5]; hl = [wx - 3, wy - 11 + Math.round(Math.abs(w))]
    } else if (!ck) {
      // rảnh tay: thái rau trên thớt (dao lên xuống)
      const [x, y] = A('plate'); const up = Math.abs(Math.sin(t * 9)) * 4
      hl = [x - 5, y - 3]; hr = [x + 4, Math.round(y - 4 - up)]
      tool = () => { px(c, hr[0] + 2, hr[1], 2, 1, CZ.w1); px(c, hr[0] - 4, hr[1] + 1, 6, 1, STEEL); px(c, hr[0] - 4, hr[1] + 2, 6, 1, STEEL_L) }
      for (let k = 0; k < 4; k++) px(c, x - 2 + k * 2, y - 3, 1, 1, k % 2 ? '#7fb34d' : '#e8703a')
    } else {
      // chờ bước tiếp: tay đặt sẵn ở chỗ nấu, đung đưa nhẹ
      hl = [yenX - 6, 59 + Math.round(slow * 0.6)]; hr = [yenX + 5, 59 - Math.round(slow * 0.6)]
    }
    arm(c, sl, sy, hl[0], hl[1], skin, sleeve)
    arm(c, sr, sy, hr[0], hr[1], skin, sleeve)
    tool?.()
    // nguyên liệu vừa lấy: cầm trước ngực rồi thả vào chảo / nồi / tô / khuôn (icon thu nhỏ một nửa)
    if (cp >= 0 && carry && DRAW16[carry.step] && f) {
      const s2 = stationOf(f.id, carry.step)
      const [tx, ty] = s2 === 'pan' ? A('panIn') : s2 === 'pot' ? A('potIn') : s2 === 'bowl' ? A('bowl') : s2 === 'waffle' ? A('waffle') : A('plate')
      const k = Math.max(0, (cp - 0.5) / 0.5)
      const ix = yenX + (tx - yenX) * k, iy = 52 + (ty - 6 - 52) * k - Math.sin(k * Math.PI) * 3
      c.save(); c.translate(Math.round(ix) - 4, Math.round(iy)); c.scale(0.5, 0.5); DRAW16[carry.step](c as any); c.restore()
    }
  }

  // món vừa ra: loé sáng cả bếp
  const sv = kitchen.served
  if (sv && performance.now() - sv.at < 1400) {
    const a = 1 - (performance.now() - sv.at) / 1400
    c.fillStyle = `rgba(255, 240, 180, ${0.35 * a})`; c.fillRect(0, -kg.top, KART_W, kH())
  }
  // bếp chưa mở: tối + mạng nhện
  if (!kitchenOpen()) {
    c.fillStyle = 'rgba(40, 30, 25, 0.6)'; c.fillRect(0, -kg.top, KART_W, kH())
    for (const x of [0, KART_W - 18]) for (let i = 0; i < 18; i++) px(c, x + (x ? 17 - i : i), 0, 1, 18 - i, 'rgba(230,230,230,0.1)')
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
      <div class="ktitle"><PixelIcon name="house" :size="2" /> {{ L('BẾP', 'KITCHEN') }}</div>
      <button v-if="!staffAll && waiting && kitchenOpen()" class="counter-chip" @click="ui.page = 0">{{ L(`Quầy nước: ${waiting} khách`, `Bar: ${waiting} waiting`) }} ›</button>
      <div v-if="!kitchenOpen()" class="kclosed">
        <b>{{ L('KHU BẾP CÒN ĐÓNG CỬA', 'THE KITCHEN IS CLOSED') }}</b>
        <span>{{ L('Mở bếp để bán kèm bánh mì chảo, mì trộn cay và waffle nhiều loại nhân. Tặng sẵn 1 gói mỗi nguyên liệu.', 'Open the kitchen to serve sizzling pan bánh mì, spicy tossed noodles and waffles with all kinds of fillings. Comes with 1 pack of each ingredient.') }}</span>
        <button class="btn sm accent" :disabled="save.money < KITCHEN_COST" @click="unlockKitchen">{{ L('MỞ BẾP', 'OPEN KITCHEN') }} · {{ moneyShort(KITCHEN_COST) }}</button>
      </div>
    </div>

    <template v-if="kitchenOpen()">
      <!-- mini-game thao tác nấu: nằm dưới cảnh (không che Yến đang nấu), tạm thế chỗ thanh phiếu đơn -->
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
      <!-- phiếu đơn treo trên thanh -->
      <div v-else class="rail">
        <i class="rbar" />
        <span v-if="!kitchen.tickets.length" class="empty">{{ L('Chưa có đơn bếp · khách gọi kèm món sẽ hiện phiếu ở đây', 'No food orders yet · tickets appear here when guests order food') }}</span>
        <button v-for="tk in kitchen.tickets" :key="tk.id" class="ticket" :class="{ on: cook?.ticketId === tk.id, low: ticketPct(tk.id) < 30, dis: !canCook(tk.food) }" @pointerdown.prevent="startCook(tk.id)">
          <i class="pin" />
          <span class="th"><b>#{{ tk.id % 100 }}</b><span>{{ tk.name }}</span></span>
          <span class="tbody">
            <img :src="iconUrl(tk.food)" class="pix" alt="" />
            <span class="tn">{{ foodById[tk.food].name }}</span>
          </span>
          <span class="tf">
            <i class="tbar"><em :style="{ width: ticketPct(tk.id) + '%' }" /></i>
            <span class="tsec">{{ Math.ceil(tk.t) }}s</span>
            <span class="tstate">{{ cook?.ticketId === tk.id ? L('NẤU…', 'COOKING…') : !canCook(tk.food) ? L('HẾT', 'OUT') : L('NẤU', 'COOK') }}</span>
          </span>
        </button>
      </div>

      <!-- món đang nấu -->
      <div v-if="food && cook" class="recipe">
        <template v-if="food && cook">
          <div class="rhead">
            <span class="rname">{{ food.name }}</span>
            <span v-if="curStep && cook.auto" class="cur">{{ L('Đang bỏ', 'Adding') }} <b>{{ label(curStep) }}</b>…</span>
            <span v-else-if="curStep" class="cur">{{ L('Bước', 'Step') }} {{ cook.done.length + 1 }}/{{ food.steps.length }}: <b>{{ label(curStep) }}</b></span>
            <span v-else class="cur ok">{{ L('Ra món!', 'Order up!') }}</span>
          </div>
          <div class="steps">
            <span v-for="(s, i) in food.steps" :key="i" class="st" :class="{ done: i < cook.done.length, now: i === cook.done.length }">
              <i>{{ i + 1 }}</i><img :src="iconUrl(s)" class="pix" alt="" />
            </span>
          </div>
        </template>
      </div>

      <!-- bàn nấu: chỉ đồ của món đang nấu, chia nhóm, bước kế tiếp sáng lên -->
      <div v-if="food && cook" class="ktray" :style="{ '--n': ops.length + 1 }" :class="{ busy: cook.auto }">
        <button v-for="o in ops" :key="o.s" class="op" :class="{ act: o.act, next: o.s === curStep, used: o.used }" @pointerdown.prevent="cookStep(o.s)">
          <i class="stepn">{{ o.n.join('·') }}</i>
          <img :src="iconUrl(o.s)" class="pix" alt="" />
          <span>{{ label(o.s) }}</span>
        </button>
        <button class="op trash" @pointerdown.prevent="act('trash')">
          <img :src="iconUrl('trash')" class="pix" alt="" />
          <span>{{ L('Đổ bỏ', 'Toss') }}</span>
        </button>
      </div>
      <!-- chưa nấu: thực đơn bếp – còn nấu được bao nhiêu phần, món nào đang có đơn (bấm để nấu luôn) -->
      <!-- chưa nấu: thực đơn bếp – dùng đúng bộ khung của game (nhãn gỗ, thẻ giấy, nhãn vuông, số pixel) -->
      <div v-else class="kmenu">
        <div class="kmh">
          <span class="section-title">{{ L('Món bếp', 'Kitchen menu') }}</span>
          <span class="kms">{{ L(`Hôm nay ${ui.stats.foodSold ?? 0} món`, `Today ${ui.stats.foodSold ?? 0} sold`) }} · <PixelNum :text="moneyShort(ui.stats.foodRev ?? 0)" :size="2" color="#2f9e6b" /></span>
        </div>
        <div class="card kml">
          <button v-for="m in menuCards" :key="m.id" class="kr" :class="{ wait: m.wait > 0, none: m.can < 1 }" @pointerdown.prevent="m.ticket && startCook(m.ticket)">
            <span class="kslot"><img :src="iconUrl(m.id)" class="pix" alt="" /></span>
            <span class="grow">
              <span class="kn">{{ m.name }}</span>
              <PixelNum :text="moneyShort(m.price)" :size="2" color="#2f9e6b" />
            </span>
            <span v-if="m.wait" class="pxtag warn">{{ m.wait }} {{ L('đơn', m.wait === 1 ? 'order' : 'orders') }}</span>
            <span v-else-if="m.can < 1" class="pxtag bad">{{ L('Hết', 'Out') }}</span>
            <span v-else class="kc">×{{ m.can }}</span>
          </button>
        </div>
        <!-- <p v-if="staffAll" class="muted small knote">Nhân viên lo quầy nước – bạn chỉ việc nấu</p> -->
      </div>
    </template>
    <div v-else class="menu-preview">
      <div v-for="f in FOODS" :key="f.id" class="mp"><img :src="iconUrl(f.id)" class="pix" alt="" /><span>{{ f.name }}<small>{{ moneyShort(f.price) }}</small></span></div>
    </div>
  </div>
</template>

<style scoped>
.kitchen { min-height: 100%; display: flex; flex-direction: column; padding: 8px 3px 0; }
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
  position: relative; margin: 10px 3px 0; z-index: 5;
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
.rail { position: relative; display: flex; gap: 8px; overflow-x: auto; margin: 8px 3px 0; padding: 11px 6px 6px; min-height: 74px; background: repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 14px), #6f4630; box-shadow: var(--px-border), inset 0 -4px 0 #4a2e1f; align-items: flex-start; scrollbar-width: none; }
.rail::-webkit-scrollbar { display: none; }
.rbar { position: absolute; left: 0; right: 0; top: 7px; height: 4px; background: #c3cad0; box-shadow: 0 2px 0 #8f979e, 0 -1px 0 #3b2a20, 0 3px 0 #3b2a20; } /* thanh inox treo phiếu */
.rail .empty { align-self: center; margin: 8px auto 0; padding: 0 8px; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #f1d9b8; text-align: center; line-height: 1.4; }
/* phiếu order giấy: kẹp trên thanh, mép dưới răng cưa */
.ticket { position: relative; flex: none; width: 100px; display: flex; flex-direction: column; gap: 2px; padding: 5px 6px 8px; background: #fffaf0; text-align: left; color: #3b2a20;
  box-shadow: 0 0 0 2px #3b2a20, 0 4px 0 rgba(0, 0, 0, 0.3); transform: rotate(-1.5deg); transform-origin: top center;
  -webkit-mask: linear-gradient(#000 0 0) top / 100% calc(100% - 4px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 8px 4px repeat-x;
  mask: linear-gradient(#000 0 0) top / 100% calc(100% - 4px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 8px 4px repeat-x; }
.ticket:nth-child(odd) { transform: rotate(1.2deg); }
.ticket .pin { position: absolute; top: -1px; left: 50%; width: 14px; height: 8px; margin-left: -7px; background: #d9534f; box-shadow: 0 0 0 2px #3b2a20, inset 0 2px 0 #f08a74; }
.th { display: flex; align-items: baseline; justify-content: space-between; gap: 4px; padding-top: 2px; border-bottom: 2px dashed #d8c4a8; padding-bottom: 1px; }
.th b { font-size: 10px; font-weight: 900; letter-spacing: 0.06em; color: #b8262c; }
.th span { font-size: 9px; font-weight: 800; color: #8a7566; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tbody { display: flex; align-items: center; gap: 4px; min-height: 24px; }
.tbody img { flex: none; width: 22px; height: 22px; }
.tn { font-size: 10px; font-weight: 900; line-height: 1.1; }
.tf { display: flex; align-items: center; gap: 4px; }
.ticket .tbar { flex: 1; height: 5px; background: #e6d6c2; box-shadow: 0 0 0 1px #3b2a20; }
.ticket .tbar em { display: block; height: 100%; background: #2f9e6b; }
.tsec { font-size: 9px; font-weight: 900; color: #6f4e37; min-width: 20px; text-align: right; }
.tstate { flex: none; font-size: 8px; font-weight: 900; letter-spacing: 0.06em; padding: 1px 3px; background: #f2c14e; box-shadow: 0 0 0 1px #3b2a20; }
.ticket.low .tbar em { background: #d8333a; }
.ticket.low .tsec { color: #b8262c; }
.ticket.low { animation: tk 0.5s ease-in-out infinite alternate; }
@keyframes tk { from { transform: rotate(-2.5deg); } to { transform: rotate(2.5deg); } }
.ticket.on { background: #fff1c2; }
.ticket.on .tstate { background: #2f9e6b; color: #fff; }
.ticket.dis { opacity: 0.6; }
.ticket.dis .tstate { background: #e6d6c2; color: #8a7566; }
/* thực đơn bếp (chưa nấu) */
.kmenu { margin-top: 8px; }
.kmh { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding-right: 6px; }
.kmh .section-title { margin: 0 6px 8px; }
.kms { display: inline-flex; align-items: center; gap: 5px; margin-bottom: 8px; font-size: 11px; font-weight: 800; color: #8a7566; }
.kml { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px; }
.kr { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 4px; text-align: left; color: var(--ink); background: #fffaf2; box-shadow: var(--px-border-2), inset 0 -3px 0 #e6d6c2; }
.kr:active { transform: translateY(2px); }
.kslot { flex: none; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -2px 0 #e0c8a8; }
.kslot img { width: 22px; height: 22px; }
.kr .grow { display: flex; flex-direction: column; gap: 2px; }
.kn { font-size: 11px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kc { flex: none; font-size: 11px; font-weight: 900; color: #8a7566; }
.kr .pxtag { flex: none; font-size: 10px; padding: 1px 5px; }
.kr.wait { background: #fff1c2; box-shadow: 0 0 0 2px #d99a2b, inset 0 -3px 0 #f2c14e; }
.kr.none { opacity: 0.55; }
.knote { margin: 6px 6px 0; }

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

/* bàn nấu: khay gỗ + nút khối giống quầy pha nước (dụng cụ = ô kem, thao tác = nút vàng, đổ bỏ = nút be) */
.ktray { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 6px; margin: 8px 3px 0; padding: 6px;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 2px, transparent 2px 8px), #a06c46;
  box-shadow: var(--px-border), inset 0 3px 0 #b98a62, inset 0 -4px 0 #7a4e33; }
.op { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 62px; padding: 4px 2px 6px;
  font-size: 12px; font-weight: 900; color: var(--ink); background: #fffaf2;
  box-shadow: var(--px-border-2), inset 0 -3px 0 #e6d6c2, 0 4px 0 rgba(59, 42, 32, 0.5); transition: transform 0.06s; }
.op img { width: 32px; height: 32px; }
.op.act { background: #f2c14e; box-shadow: var(--px-border-2), inset 0 -4px 0 #d99a2b, inset 0 2px 0 #fff1a8, 0 4px 0 rgba(59, 42, 32, 0.5); }
.op.trash { background: #f1e2cf; box-shadow: var(--px-border-2), inset 0 -4px 0 #d8bf9f, 0 4px 0 rgba(59, 42, 32, 0.5); font-size: 11px; }
.op.trash img { width: 24px; height: 24px; }
.op:active { transform: translateY(3px); box-shadow: var(--px-border-2); }
.stepn { position: absolute; top: 2px; left: 3px; font-style: normal; font-size: 9px; font-weight: 900; color: #8a7566; }
.op.act .stepn { color: #7a5200; }
.op.used { opacity: 0.4; }
.op.next { animation: opNext 0.8s steps(2) infinite; }
@keyframes opNext { 50% { transform: translateY(-3px); box-shadow: 0 0 0 3px #fff, 0 0 0 5px #3b2a20, 0 7px 0 rgba(59, 42, 32, 0.5); } }
.ktray.busy .op:not(.trash) { filter: saturate(0.6); }
.menu-preview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 12px 3px 0; }
.mp { display: flex; align-items: center; gap: 5px; background: #fffaf0; padding: 5px; box-shadow: var(--px-border-2); font-size: 11px; font-weight: 800; line-height: 1.2; }
.mp img { width: 26px; height: 26px; }
.mp small { display: block; color: var(--good); }
@media (max-height: 720px) {
  .op { min-height: 52px; }
  .op img { width: 26px; height: 26px; }
  .rail { min-height: 70px; margin-top: 6px; }
}
</style>
