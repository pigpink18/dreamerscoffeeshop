<script setup lang="ts">
import { sceneW } from '../game/sceneSize'
// Cảnh quầy pha chế pixel art: khách bước tới quầy, thiết bị, ly nước, hoạt ảnh.
import { ref, computed, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch, nextTick } from 'vue'
import {
  ui, save, bus, openTalk, talkChat, talkReply, brewFromTalk, startBrew, canMake, stepMs, DAY_LENGTH, staffServeTime, skipPresent, tutOn, comboRate, staffAll,
  type Customer, type GameEvent,
} from '../game/store'
import { drawSign, SIGN_W } from '../game/sign'
import TypeText from './TypeText.vue'
import { noEmoji } from '../game/emoji'
import PixelIcon from './ui/PixelIcon.vue'
import { tick } from '../game/audio'
import { coinsFly, sparkle, flash, popText, type Pt } from '../game/fx'
import { moneyShort } from '../game/data'
import { recipeById, REGULARS, NEEDY, BOND_LEVELS, bondLevel, STEPS, GUEST_GROUPS, type StepId } from '../game/data'
import {
  SCENE_W, SCENE_H, LAYOUT, COUNTER_Y, images, loadImages, drawRoom, drawCounter, drawCup, drawPerson, iconUrl,
  emptyCup, px, box, OUT, CZ, espressoKey, drawPlant, drawLights, drawBunting, drawOpenSign, drawPoster, drawCat, drawFridge, drawSack, drawGreen, drawScooter, drawBarista, drawCorgi,
  type CupLook, type Mood,
} from '../game/pixel'
import { isXmasSeason, drawXmasTree } from '../game/xmas'
import { drawCeiling, drawFloor, drawFloorProps, drawSideWalls, drawCounterWings } from '../game/depth'
import { foodById, type FoodId } from '../game/kitchen'
import { drawRoomMid, drawRoomBig, drawCounterMid, drawCounterBig, drawStools, drawDecorItems, drawSouvenirShelf } from '../game/rooms'
import { rareById, GOODS } from '../game/metaData'
const goodName = (id: string) => GOODS.find((g) => g.id === id)?.name ?? id

const wrap = ref<HTMLDivElement>()
const cv = ref<HTMLCanvasElement>()
const presentCv = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let scale = 3
let raf = 0
let ro: ResizeObserver | null = null

// ---------- Diễn viên (khách đang ở quầy) ----------
interface Actor {
  id: number
  cust: Customer
  x: number
  target: number
  state: 'enter' | 'idle' | 'leave'
  mood: Mood
  holding: CupLook | null
  holdUntil: number
}
let actor: Actor | null = null
const actorView = ref<{ id: number; x: number; state: string } | null>(null)
const review = ref<{ stars: number; text: string; needy: boolean; price: number; tip: number } | null>(null)
const angry = ref<string | null>(null)
const shaking = ref(false)

// hoạt ảnh thao tác
let actStep: StepId | null = null
let actStart = 0
const dropImgs: Record<string, HTMLImageElement> = {}
let lastCup: CupLook | null = null

const front = computed(() => ui.queue[0])
const cur = computed(() => (actorView.value ? ui.queue.find((c) => c.id === actorView.value!.id) : undefined))
const reg = computed(() => (cur.value?.regular ? REGULARS.find((r) => r.id === cur.value!.regular) : undefined))
const who = computed(() => {
  const c = cur.value
  if (!c) return ''
  if (reg.value) return `${reg.value.name} · ${BOND_LEVELS[bondLevel(save.bonds[reg.value.id] ?? 0)].name}`
  if (c.needy !== undefined) return `${NEEDY[c.needy].who} · ly treo`
  if (c.rare) return `${rareById[c.rare]?.name ?? c.name} · khách hiếm`
  const g = c.group ? GUEST_GROUPS.find((x) => x.id === c.group) : undefined
  if (g) return `${c.name} · ${g.label}`
  return c.name ?? 'Khách'
})
const whoKind = computed(() => (cur.value?.rare ? 'rare' : cur.value?.regular ? 'reg' : cur.value?.group && GUEST_GROUPS.find((g) => g.id === cur.value!.group)?.foreign ? 'intl' : ''))
const talkHere = computed(() => ui.talk && cur.value && ui.talk.custId === cur.value.id ? ui.talk : null)
const brewingHere = computed(() => ui.brew && ui.brew.target === 'cust' && cur.value && ui.brew.id === cur.value.id)
const bubbleText = computed(() => {
  const c = cur.value
  if (!c) return ''
  const t = talkHere.value
  if (t?.mode === 'chat') return t.topic!.say
  if (t?.mode === 'answer') return t.answer!
  if (c.line && c.patience / c.maxPatience < 0.5) return c.line
  return c.greeting
})
// ---- chữ chạy từng chữ trong khung chat ----
const typed = ref(false) // câu đang nói đã hiện hết chưa (hiện hết mới hiện nút chọn)
const typedSeen = new Set<string>() // câu đã nói xong thì khi khung chat vẽ lại không gõ lại nữa
const lineKey = computed(() => (cur.value ? cur.value.id + '|' + bubbleText.value : ''))
const seenTick = ref(0) // Set thường không reactive -> dùng bộ đếm để computed cập nhật
const lineInstant = computed(() => (seenTick.value, typedSeen.has(lineKey.value)))
watch(lineKey, (k) => { typed.value = typedSeen.has(k) }, { immediate: true })
function onTyped() { typed.value = true; if (lineKey.value && !typedSeen.has(lineKey.value)) { typedSeen.add(lineKey.value); seenTick.value++ } }
const typer = ref<InstanceType<typeof TypeText> | null>(null)
/** giọng: người cần ly treo nhỏ nhẹ, khách khác cao thấp khác nhau theo mã khách */
const voice = computed(() => {
  const c = cur.value
  if (!c) return 560
  if (c.needy !== undefined) return 430
  return 480 + ((c.id * 53) % 5) * 45
})
// ---- đồng hồ kiên nhẫn ----
const patRatio = computed(() => (cur.value ? Math.max(0, cur.value.patience / cur.value.maxPatience) : 1))
const patSeg = computed(() => Math.ceil(patRatio.value * 10))
const patSecs = computed(() => (cur.value ? Math.max(0, Math.ceil(cur.value.patience)) : 0))
const patLevel = computed(() => (patRatio.value > 0.6 ? 'ok' : patRatio.value > 0.3 ? 'warn' : 'low'))
// tiếng tích tắc mỗi giây khi khách sắp bỏ đi
watch(patSecs, (n, o) => { if (patLevel.value === 'low' && n < o && n > 0 && !ui.paused && actorView.value?.state === 'idle' && !review.value) tick(n <= 5) })
const ticker = computed(() => (ui.toasts.length ? ui.toasts[ui.toasts.length - 1] : null))
const waiting = computed(() => Math.max(0, ui.queue.length - (actorView.value && cur.value ? 1 : 0)))

/** đổi toạ độ trong cảnh pixel (128x92) sang toạ độ màn hình – để bắn hiệu ứng đúng chỗ */
function scenePt(sx: number, sy: number): Pt {
  const r = cv.value?.getBoundingClientRect()
  if (!r) return { x: innerWidth / 2, y: innerHeight / 3 }
  return { x: r.left + ((sx + OX) / CW) * r.width, y: r.top + ((sy + geo.top) / geo.H) * r.height }
}
const custPt = () => scenePt((actor?.x ?? LAYOUT.customerX) + 8, LAYOUT.customerY + 12)
// ---- combo + giờ cao điểm ----
const comboKey = ref(0) // đổi key để huy hiệu combo nảy lại mỗi lần tăng
const rushBanner = ref<null | { text: string; sub: string; kind: 'start' | 'win' }>(null)
let rushTimer = 0
function showRush(text: string, sub: string, kind: 'start' | 'win') {
  rushBanner.value = { text, sub, kind }
  clearTimeout(rushTimer)
  rushTimer = window.setTimeout(() => (rushBanner.value = null), 2400)
}

function onEvent(e: GameEvent) {
  const now = performance.now()
  if (e.type === 'combo') {
    comboKey.value++
    const at = scenePt(SCENE_W - 22, 14)
    if (e.n % 5 === 0) { popText(`COMBO x${e.n}!`, scenePt(SCENE_W / 2, 30)); flash(); sparkle(at, 20) } else sparkle(at, 8)
    return
  }
  if (e.type === 'comboBreak') { popText(`VỠ COMBO x${e.n}`, scenePt(SCENE_W / 2, 34), 'red'); return }
  if (e.type === 'rush') {
    if (e.on) showRush('GIỜ CAO ĐIỂM!', 'Khách tới dồn dập · đừng để ai bỏ về để nhận thưởng', 'start')
    else if (e.ok) { showRush('VƯỢT CAO ĐIỂM!', `Không ai bỏ về · thưởng +${moneyShort(e.bonus ?? 0)}`, 'win'); flash('rgba(160, 255, 200, 0.35)'); coinsFly(scenePt(SCENE_W / 2, 40), 8) }
    return
  }
  if (e.type === 'served' && actor && actor.id === e.id) {
    const at = custPt()
    if (!e.needy) coinsFly(at, e.stars >= 5 ? 5 : e.stars >= 4 ? 3 : 2)
    if (e.stars >= 5 || e.needy) sparkle(at, e.needy ? 12 : 16, e.needy ? ['#ff9aa8', '#ff6b81', '#ffffff'] : undefined)
  }
  if (e.type === 'step') {
    actStep = e.step
    actStart = now
  } else if (e.type === 'wrong') {
    shaking.value = true
    setTimeout(() => (shaking.value = false), 320)
  } else if (e.type === 'served' && actor && actor.id === e.id) {
    actor.holding = { ...(lastCup ?? emptyCup()), cup: true, straw: true, lid: true }
    actor.mood = e.needy ? 'love' : e.stars >= 4 ? 'happy' : e.stars === 3 ? 'neutral' : 'sad'
    actor.holdUntil = now + 2200
    review.value = { stars: e.stars, text: e.text, needy: e.needy, price: e.price, tip: e.tip }
  } else if (e.type === 'angry' && actor && actor.id === e.id) {
    actor.mood = 'angry'
    actor.holdUntil = now + 1800
    angry.value = e.line
  }
}

// Lưu lại ly vừa pha để khách cầm
watch(() => ui.present, (p) => {
  if (p) {
    const b = p.cup
    lastCup = { cup: true, layers: [...b.layers], ice: b.ice, mixed: b.mixed, foam: b.foam, whip: b.whip, blended: b.blended, chunks: b.chunks, straw: true, lid: true, full: true }
    requestAnimationFrame(drawPresent)
    if (b.mistakes === 0) setTimeout(() => sparkle(scenePt(SCENE_W / 2, SCENE_H / 2), 18), 120) // pha chuẩn: lấp lánh quanh ly
  }
})

function drawPresent() {
  const c = presentCv.value?.getContext('2d')
  if (!c || !lastCup) return
  c.imageSmoothingEnabled = false
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, 200, 260)
  c.setTransform(9, 0, 0, 9, 0, 0)
  drawCup(c, lastCup, 5, 10)
  // nhãn dán logo quán (trái tim nhỏ)
  px(c, 8, 21, 6, 4, '#fffaf2'); px(c, 9, 20, 4, 6, '#fffaf2')
  px(c, 9, 22, 1, 1, '#ff6b81'); px(c, 11, 22, 1, 1, '#ff6b81'); px(c, 9, 23, 3, 1, '#ff6b81'); px(c, 10, 24, 1, 1, '#ff6b81')
}

// ---- nhân viên pha chế diễn từng bước của món theo tiến độ pha (máy chiết, ly đầy dần, shaker, máy xay) ----
/** chỗ đứng (x người) cho từng bước: máy espresso · chỗ đặt ly · shaker · máy xay */
const STAFF_AT: Partial<Record<StepId, number>> = { chiet: 16, lac: 50, xay: 98 }
const STAFF_CUP_X = 30
/** Cáo trên sàn (quán mở rộng): x lệch khỏi đệm, đích đi tới, hướng mặt, trạng thái */
const cao = { x: 0, target: 0, dir: 1, mode: 'lie' as 'lie' | 'stand' | 'walk', until: 0, last: 0 }
let staffX = 49, staffLastT = 0
function staffAnim() {
  if (ui.phase !== 'open' || !staffAll.value || ui.brew) return null
  const r = ui.staffRecipe[0], prog = ui.staffProgress[0] ?? 0
  if (!r || prog <= 0) return null
  const steps = recipeById[r].steps
  const p = Math.min(0.999, prog / staffServeTime.value)
  const n = steps.length, fk = p * n, k = Math.floor(fk), q = fk - k
  const look = emptyCup()
  const apply = (st: StepId) => {
    if (st === 'ly') look.cup = true
    else if (st === 'da') look.ice = true
    else if (st === 'khuay' || st === 'lac') look.mixed = true
    else if (st === 'xay') { look.blended = true; look.ice = false }
    else if (st === 'kem') look.foam = true
    else if (st === 'kemTuoi') look.whip = true
    else if (STEPS[st].color) { look.layers.push(STEPS[st].color!); look.mixed = false; if (st === 'dao') look.chunks = true }
  }
  for (let i = 0; i < k; i++) apply(steps[i])
  if (STEPS[steps[k]].kind === 'ing' && q > 0.5) apply(steps[k]) // nguyên liệu rơi vào ly ở nửa sau của bước
  return { step: steps[k], q, look, p }
}

function cupLook(): CupLook | null {
  const b = ui.brew
  if (!b || ui.present) return null
  return { cup: b.cup, layers: b.layers, ice: b.ice, mixed: b.mixed, foam: b.foam, whip: b.whip, blended: b.blended, chunks: b.chunks }
}

function updateActor(now: number, dt: number) {
  const f = front.value
  if (!actor && f && ui.phase === 'open') {
    actor = { id: f.id, cust: f, x: SCENE_W + OX + 2, target: LAYOUT.customerX, state: 'enter', mood: 'neutral', holding: null, holdUntil: 0 }
    review.value = null
    angry.value = null
  }
  if (!actor) { actorView.value = null; return }
  const stillHere = ui.queue.some((c) => c.id === actor!.id)
  if (actor.state !== 'leave') {
    const shouldLeave = (actor.holdUntil && now > actor.holdUntil) || (!stillHere && !actor.holdUntil) || ui.phase !== 'open'
    if (shouldLeave) { actor.state = 'leave'; actor.target = SCENE_W + OX + 6 }
  }
  const speed = 95
  if (actor.x !== actor.target) {
    const d = actor.target - actor.x
    actor.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt)
  } else if (actor.state === 'enter') {
    actor.state = 'idle'
    if (ui.phase === 'open' && !ui.brew && !ui.present && stillHere) openTalk(actor.id)
  }
  if (actor.state === 'leave' && actor.x >= SCENE_W + OX + 4) {
    actor = null
    actorView.value = null
    review.value = null
    angry.value = null
    return
  }
  if (actor.cust.patience / actor.cust.maxPatience < 0.3 && (actor.mood === 'neutral' || actor.mood === 'grumpy') && stillHere) actor.mood = 'sad'
  actorView.value = { id: actor.id, x: actor.x, state: actor.state }
}

let lastT = performance.now()
function frame(now: number) {
  const dt = Math.min(0.05, (now - lastT) / 1000)
  lastT = now
  updateActor(now, dt)
  draw(now)
  raf = requestAnimationFrame(frame)
}

/** Cây thông Noel đứng trước quầy (phía khách), góc dưới – tránh bóng thoại của khách ở góc trên trái.
 *  Mặt bằng 1 có kệ quà lưu niệm bên phải nên đặt cây bên trái. Vẽ sau cùng nên ngọn cây che nhẹ chân máy xay/máy pha. */
const XMAS_SPOT: [number, number][] = [[101, 52], [0, 52], [101, 52]]

function draw(now: number) {
  const c = ctx
  if (!c) return
  const t = now / 1000
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  // không gian thêm: trần phía trên + sàn trước quầy (depth.ts), rồi dịch cảnh gốc xuống dưới trần
  const P0 = save.meta.premise
  const floorH = geo.H - geo.top - SCENE_H
  drawCeiling(c, geo.top, P0, now / 1000, isXmasSeason(), CW) // trần (khi quán mở rộng: có nhân viên, không còn khay pha)
  drawFloor(c, geo.top + SCENE_H, floorH, P0, CW) // sàn trải hết bề ngang (cả 2 tường hông)
  c.setTransform(scale, 0, 0, scale, 0, geo.top * scale)
  drawSideWalls(c, OX, P0, ui.phase === 'open' ? Math.min(1, ui.time / DAY_LENGTH) : 0.15) // tường hông 2 bên (phối cảnh)
  c.setTransform(scale, 0, 0, scale, OX * scale, geo.top * scale) // cảnh gốc nằm giữa
  const dayFrac = ui.phase === 'open' ? Math.min(1, ui.time / DAY_LENGTH) : 0.15
  const U = save.upgrades
  const P = save.meta.premise
  if (P === 2) drawRoomBig(c, dayFrac, save.weather, t)
  else if (P === 1) drawRoomMid(c, dayFrac, save.weather, t)
  else drawRoom(c, dayFrac, save.weather, t, U.freezer ? 3 : 5)
  // ---- nâng cấp hiện ra trong quán ----
  if (U.decor >= 2 && P !== 2) drawLights(c, t)
  if (U.sign >= 2 && P === 0) drawBunting(c)
  if (U.sign >= 1 && P !== 2) drawOpenSign(c, t)
  if (U.freezer && P === 0) drawFridge(c, 112, 21)
  if (U.sign >= 3 && P === 0) drawPoster(c, 113, 32)
  drawDecorItems(c, save.meta.decor, P, t)
  if (U.shipper && ui.shippers.some((s) => s.orderId === null)) drawScooter(c, 13, 29)
  // nhân viên đứng sau quầy
  const staffN = ui.phase === 'open' ? ui.staffProgress.length : U.staff
  const sp = (i: number) => (ui.staffProgress[i] ?? 0) / staffServeTime.value
  const sa = staffAnim()
  {
    // nhân viên 1 đi tới đúng chỗ của bước đang làm (rảnh thì về giữa quầy lau bàn)
    const goal = sa ? STAFF_AT[sa.step] ?? STAFF_CUP_X : 49
    const dts = Math.min(0.1, Math.max(0, t - staffLastT)); staffLastT = t
    const walking = Math.abs(goal - staffX) > 0.5
    if (walking) staffX += Math.sign(goal - staffX) * Math.min(Math.abs(goal - staffX), 55 * dts)
    if (staffN >= 1) drawBarista(c, Math.round(staffX), LAYOUT.customerY + 1, (ui.staffProgress[0] ?? 0) > 0, t, 0, sp(0), sa ? (walking ? 'walk' : 'work') : 'auto')
  }
  if (staffN >= 2) drawBarista(c, 99, LAYOUT.customerY + 1, (ui.staffProgress[1] ?? 0) > 0, t, 1, sp(1))

  // khách
  if (actor) {
    const walking = actor.x !== actor.target
    const bob = walking ? Math.floor(t * 8) % 2 : actor.mood === 'happy' || actor.mood === 'love' ? Math.floor(t * 3) % 2 : 0
    const blink = Math.floor(t * 10) % 37 === 0
    drawPerson(c, actor.cust.look, Math.round(actor.x), LAYOUT.customerY - bob, actor.mood, blink)
    if (actor.holding) {
      const hx = Math.round(actor.x) - 11
      const hy = COUNTER_Y - 18 - bob
      drawCup(c, actor.holding, hx, hy)
      px(c, hx + 9, hy + 9, 3, 3, actor.cust.look.skin)
    }
    if (actor.mood === 'love') {
      const hy = LAYOUT.customerY - 8 - (Math.floor(t * 4) % 3)
      px(c, actor.x + 6, hy, 2, 2, '#ff6b81'); px(c, actor.x + 9, hy, 2, 2, '#ff6b81'); px(c, actor.x + 6, hy + 2, 5, 1, '#ff6b81'); px(c, actor.x + 7, hy + 3, 3, 1, '#ff6b81'); px(c, actor.x + 8, hy + 4, 1, 1, '#ff6b81')
    }
    if (actor.mood === 'angry') {
      const ay = LAYOUT.customerY - 6
      px(c, actor.x + 12, ay, 3, 1, '#e8503a'); px(c, actor.x + 13, ay - 1, 1, 3, '#e8503a')
    }
  }

  const night = Math.max(0, Math.min(1, (dayFrac - 0.78) / 0.12))
  if (P === 2) { drawCounterBig(c, t, save.meta.goods); drawSign(c, 4, COUNTER_Y + 6, t, night); drawStools(c) }
  else if (P === 1) { drawCounterMid(c); drawSign(c, (SCENE_W - SIGN_W) / 2 - 6, COUNTER_Y + 6, t, night); drawSouvenirShelf(c, save.meta.goods) }
  else { drawCounter(c); drawSign(c, (SCENE_W - SIGN_W) / 2, COUNTER_Y + 6, t, night) }
  // quầy kéo dài sang 2 tường hông (vẽ sau khách để che chân khách đang đi vào từ cửa hông)
  c.setTransform(scale, 0, 0, scale, 0, geo.top * scale)
  drawCounterWings(c, OX, CW, P)
  c.setTransform(scale, 0, 0, scale, OX * scale, geo.top * scale)
  // đồ trên mặt quầy / thân quầy
  if (U.decor >= 1) drawPlant(c, 67, COUNTER_Y - 13)
  const xmas = isXmasSeason()
  if (U.decor >= 3 && P === 0 && !xmas) drawPlant(c, 112, COUNTER_Y + 12, true) // mùa Noel: cây thông đứng chỗ này
  if (U.decor >= 4) drawCat(c, 96, COUNTER_Y - 7, t)
  if (U.farmer && P !== 2) drawSack(c, 22, COUNTER_Y + 13)
  if (U.green && P === 0) drawGreen(c, 101, COUNTER_Y + 10)
  // Cáo – corgi đồng sáng lập: ngủ khi quán đóng, đứng vẫy đuôi khi có khách vui
  const corgi = () => drawCorgi(c, P === 2 ? 78 : 2, SCENE_H - 18, t, ui.phase !== 'open' ? 'lie' : actor && (actor.mood === 'happy' || actor.mood === 'love') ? 'stand' : 'sit', !!actor && actor.mood !== 'angry', xmas && !save.meta.wear.neck ? { ...save.meta.wear, neck: 'scarf' } : save.meta.wear)
  if (floorH < 60) corgi() // quán mở rộng: Cáo có đệm nằm riêng trên sàn (vẽ ở phần sàn bên dưới)
  if (staffN >= 3) { px(c, 2, COUNTER_Y - 6, 9, 5, '#fffaf2'); px(c, 3, COUNTER_Y - 5, 7, 3, '#6f4e37') }

  // máy espresso + ly shot
  const el = actStep ? now - actStart : 0
  const act = (s: StepId) => actStep === s && el < stepMs(s) + 50
  /** tiến độ 0..1 của thao tác s (người chơi đang pha, hoặc nhân viên đang tới bước này), -1 = không làm */
  const actP = (s: StepId) => (act(s) ? el / stepMs(s) : sa && sa.step === s && Math.abs(staffX - (STAFF_AT[s] ?? STAFF_CUP_X)) < 2 ? sa.q : -1)
  const esp = images[espressoKey(U.machine)] ?? images.espresso
  const espY = COUNTER_Y + 2 - (esp?.height ?? 25)
  const shotX = LAYOUT.espresso.x + 12, shotY = espY + (esp?.height ?? 25) - 10
  if (esp) c.drawImage(esp, LAYOUT.espresso.x, espY)
  if (actP('chiet') >= 0) {
    const p = actP('chiet')
    const sx = shotX, sy = shotY
    if (p < 0.65) {
      if (images.shot) c.drawImage(images.shot, sx, sy)
      px(c, sx + 1, espY + 13, 1, sy - espY - 13, '#4b2e1e')
      const fill = Math.min(3, Math.floor(p * 6))
      px(c, sx + 1, sy + 4 - fill, 2, fill, '#4b2e1e')
      // hơi nước
      px(c, LAYOUT.espresso.x + 20 + (Math.floor(t * 6) % 2), espY - 2 - (Math.floor(t * 8) % 4), 1, 1, '#ffffff')
    } else {
      const q = (p - 0.65) / 0.35
      const x = sx + (LAYOUT.cup.x + 7 - sx) * q
      const y = sy + (LAYOUT.cup.y - 7 - sy) * q
      if (images.shot) c.drawImage(images.shot, Math.round(x), Math.round(y))
      if (q > 0.6) px(c, Math.round(x) + 2, Math.round(y) + 5, 1, 6, '#4b2e1e')
    }
  } else if (images.shot) c.drawImage(images.shot, shotX, shotY)

  // shaker
  if (images.shaker) {
    if (actP('lac') >= 0) {
      const p = actP('lac')
      const up = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1
      const sx = LAYOUT.shaker.x - 14 * up + Math.round(Math.sin(t * 40) * 2 * (p > 0.15 && p < 0.85 ? 1 : 0))
      const sy = LAYOUT.shaker.y - 20 * up + Math.round(Math.cos(t * 40) * 2 * (p > 0.15 && p < 0.85 ? 1 : 0))
      c.drawImage(images.shaker, Math.round(sx), Math.round(sy))
      if (p > 0.85) px(c, LAYOUT.cup.x + 6, LAYOUT.cup.y - 4, 1, 6, '#c9b08a')
    } else c.drawImage(images.shaker, LAYOUT.shaker.x, LAYOUT.shaker.y)
  }
  // máy xay
  if (images.blender) {
    const v = actP('xay') >= 0 ? Math.round(Math.sin(t * 60)) : 0
    c.drawImage(images.blender, LAYOUT.blender.x + v, LAYOUT.blender.y)
    if (actP('xay') >= 0) {
      for (let i = 0; i < 6; i++) px(c, LAYOUT.blender.x + 3 + ((i * 3 + Math.floor(t * 30)) % 9), LAYOUT.blender.y + 4 + ((i * 5) % 10), 2, 1, '#9cc66b')
    }
  }

  // ly đang pha
  const look = cupLook() ?? (sa?.look.cup ? sa.look : null)
  if (look) {
    drawCup(c, look, LAYOUT.cup.x, LAYOUT.cup.y)
    // nguyên liệu rơi vào ly
    const dropStep = actStep && STEPS[actStep].kind === 'ing' && el < 300 ? actStep : sa && STEPS[sa.step].kind === 'ing' && sa.q > 0.15 && sa.q < 0.5 && Math.abs(staffX - STAFF_CUP_X) < 2 ? sa.step : null
    if (dropStep) {
      const img = dropImgs[dropStep]
      const p = actStep === dropStep ? el / 300 : (sa!.q - 0.15) / 0.35
      if (img && img.complete) c.drawImage(img, LAYOUT.cup.x, Math.round(LAYOUT.cup.y - 16 + 12 * p), 12, 12)
    }
    if (actP('khuay') >= 0) {
      const a = t * 18
      px(c, LAYOUT.cup.x + 6 + Math.round(Math.cos(a) * 3), LAYOUT.cup.y - 6, 1, 12, '#c4cbd1')
    }
    if (actP('xay') > 0.8) px(c, LAYOUT.cup.x + 6, LAYOUT.cup.y - 4, 1, 6, '#9cc66b')
  } else if (ui.phase === 'open' && !ui.present) {
    drawCup(c, emptyCup(), LAYOUT.cup.x, LAYOUT.cup.y)
  }
  // đồ trên sàn + cây thông: có sàn thì cây đứng hẳn trên sàn góc phải, không thì đứng trước quầy
  const treeOnFloor = xmas && floorH >= 20
  // ---- quán mở rộng (có nhân viên, sàn rộng): đồ trên sàn GẦN người xem nên vẽ to x2 – cây xanh, khách chờ, cây thông ----
  const wide = floorH >= 60
  if (!wide) drawFloorProps(c, SCENE_H, floorH, t, treeOnFloor)
  const x2 = (x: number, y: number, fn: () => void) => { c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(2, 2); fn(); c.restore() }
  /** chậu cây đất nung + cây (sprite Cozy) – (0,0) = giữa đáy chậu, toạ độ x2 */
  const potted = (key: 'fern' | 'bonsai' | 'cactus' | 'boxwood') => {
    box(c, -6, -9, 12, 9, '#c8784a'); px(c, -5, -8, 10, 1, '#e0965e'); px(c, -7, -10, 14, 3, OUT); px(c, -6, -10, 12, 2, '#d9874f'); px(c, -5, -10, 10, 1, '#f0b07a')
    const im = images[key]; if (im) c.drawImage(im, -Math.round(im.width / 2), -9 - im.height)
  }
  if (wide) {
    const yb = SCENE_H + Math.round(floorH * 0.3), yf = SCENE_H + Math.round(floorH * 0.86), yt = SCENE_H + Math.round(floorH * 0.66)
    const shadow = (x: number, y: number, w: number) => { c.fillStyle = 'rgba(38, 28, 27, 0.18)'; c.fillRect(Math.round(x - w / 2), Math.round(y - 1), w, 3) }
    // hàng sau (sát quầy) bên trái: đệm nằm của Cáo – Cáo nằm thở, thỉnh thoảng đứng dậy đi tới đi lui rồi về nằm
    {
      const bedX = -2, bedY = yb + 2
      shadow(bedX, bedY + 2, 50)
      x2(bedX - 24, bedY - 12, () => {
        // đệm tròn: viền dày nâu đỏ, lòng đệm kem, xương gặm
        box(c, 0, 4, 24, 8, '#b23a32'); px(c, 1, 5, 22, 1, '#d9574a')
        px(c, 3, 6, 18, 4, CZ.ink); px(c, 4, 6, 16, 3, '#f2e3c4'); px(c, 4, 6, 16, 1, '#fff6e0')
        px(c, 18, 9, 5, 2, CZ.ink); px(c, 18, 9, 4, 1, '#fbf8f2') // xương
      })
      const now2 = t
      if (!cao.until) cao.until = now2 + 6
      const happyCust = !!actor && (actor.mood === 'happy' || actor.mood === 'love')
      if (cao.mode === 'lie' && (now2 > cao.until || happyCust)) { cao.mode = 'stand'; cao.until = now2 + 1.2; cao.target = happyCust ? 30 : Math.round(-6 + Math.random() * 60) }
      else if (cao.mode === 'stand' && now2 > cao.until) { cao.mode = Math.abs(cao.x - cao.target) > 1 ? 'walk' : 'lie'; cao.until = now2 + 12 + Math.random() * 13 }
      else if (cao.mode === 'walk') {
        const d = cao.target - cao.x
        if (Math.abs(d) <= 0.5) { cao.x = cao.target; cao.mode = 'stand'; cao.until = now2 + 1.5; if (cao.target !== 0) cao.target = 0 }
        else { cao.dir = Math.sign(d); cao.x += cao.dir * Math.min(Math.abs(d), 22 * Math.max(0, Math.min(0.1, now2 - cao.last))) }
      }
      cao.last = now2
      const lying = cao.mode === 'lie' && Math.abs(cao.x) < 1
      const pose = lying ? 'lie' : 'stand'
      const wearC = xmas && !save.meta.wear.neck ? { ...save.meta.wear, neck: 'scarf' } : save.meta.wear
      const cx0 = bedX + cao.x, cy0 = bedY - 34 + (lying ? 0 : 2)
      if (!lying) shadow(cx0, bedY + 2, 30)
      c.save(); c.translate(Math.round(cx0), Math.round(cy0)); c.scale(2 * (cao.dir < 0 && !lying ? -1 : 1), 2)
      drawCorgi(c, -12, 0, t, pose, cao.mode === 'walk' || happyCust, wearC)
      c.restore()
    }
    // bonsai góc phải (hết mùa Noel)
    if (!xmas) { shadow(140, yb, 22); x2(140, yb, () => potted('bonsai')) } // mùa Noel: góc phải nhường cho cây thông
    // cây thông to (x2) đứng sàn bên phải
    if (xmas) { shadow(130, yt + 12, 90); x2(79, yt - 160 + 12, () => drawXmasTree(c, 0, 0, t, 'xxl')) } // cây thông to cao (x2 cỡ xxl ≈ 160 điểm ảnh)
    // khách đang chờ xếp hàng trên sàn (x2: gần người xem nên to hơn khách ở quầy)
    if (ui.phase === 'open') {
      ui.queue.slice(1, 3).forEach((q, i) => {
        const fx = 46 - i * 30, fy = yt + 6 + i * 8
        const low = q.patience / q.maxPatience
        const bob = Math.floor(t * 2 + i) % 2
        const pants = ['#3a4a6a', '#4a3a30', '#2e2e33', '#5a6b4a'][q.id % 4]
        shadow(fx, fy, 30)
        x2(fx - 16, fy - 76, () => {
          for (const lx of [4, 9]) { px(c, lx - 1, 29, 5, 8, OUT); px(c, lx, 29, 3, 7, pants); px(c, lx - 1, 36, 5, 2, '#2b1d16') }
          drawPerson(c, q.look, 0, -bob, low < 0.3 ? 'angry' : low < 0.55 ? 'grumpy' : 'neutral', Math.floor(t * 10 + i * 7) % 37 === 0)
        })
      })
    }
    // hàng trước (gần người xem nhất): dương xỉ trái, xương rồng phải
    shadow(-8, yf, 26); x2(-8, yf, () => potted('fern'))
    if (!xmas) { shadow(140, yf, 26); x2(140, yf, () => potted('cactus')) } // mùa Noel: góc phải là cây thông
  }
  if (treeOnFloor && !wide) {
    if (floorH >= 44) drawXmasTree(c, 92, SCENE_H + Math.round(floorH * 0.6) - 57, t, 'xl')
    else drawXmasTree(c, 101, SCENE_H + Math.min(floorH - 3, 26) - 40, t, 'lg')
  } else if (xmas && !treeOnFloor) {
    const [tx, ty] = XMAS_SPOT[P] ?? XMAS_SPOT[0]
    drawXmasTree(c, tx, ty, t, 'lg')
    if (P === 1) corgi() // cây đứng chỗ Cáo nằm → vẽ lại Cáo ngồi trước gốc cây
  }
}

const SCENE_PREF_W = 488 // độ rộng tối đa của khung cảnh (px)
/** Khung dẹt ngang ~488 : 256 nhưng KHÔNG cắt / phóng to cảnh: cảnh gốc 128x92 giữ nguyên ở giữa (tường sau),
 *  2 bên thêm tường hông nhìn theo phối cảnh + quầy kéo dài (depth.ts) → cân xứng, có chiều sâu. */
const OX = 24 // bề rộng mỗi tường hông (điểm ảnh cảnh)
const CW = SCENE_W + 2 * OX // 176
const FLOOR_H = 11 // dải sàn gỗ trước quầy → 176:103 ≈ 488:286
const SCENE_FULL_H = SCENE_H + FLOOR_H
const geo = { top: 0, H: SCENE_FULL_H } // top: chiều cao trần thêm (âm = cắt tường) · H: chiều cao cả canvas (điểm ảnh cảnh)
const geoTick = ref(0) // đổi khi khung đổi → toạ độ các lớp phủ cập nhật

// Kích thước cảnh được KHOÁ sau khi đo: chỉ đo lại khi đổi màn hình hoặc khoảng trống đổi nhiều,
// không co giãn theo nội dung nhỏ bên dưới (dòng hướng dẫn, thanh địa chỉ Safari ẩn/hiện…).
let locked: { vw: number; vh: number; bh: number; w: number; top: number; H: number } | null = null

function measure(): { w: number; top: number; H: number } {
  // khung LUÔN full chiều ngang (tối đa 488px), không thu nhỏ theo chiều cao.
  // Có nhân viên lo quầy (không còn khay pha): dùng chỗ trống để MỞ RỘNG quán theo chiều dọc – thêm trần + sàn (không phóng to)
  const el = wrap.value!
  const box = el.parentElement
  const pw = box?.clientWidth || el.clientWidth
  const w = Math.min(SCENE_PREF_W, pw)
  const base = { w, top: 0, H: SCENE_FULL_H }
  const page = box?.parentElement
  if (!staffAll.value || ui.phase !== 'open' || !box || !page) return base
  let others = 0
  for (const ch of Array.from(page.children) as HTMLElement[]) {
    if (ch === box) continue
    const st = getComputedStyle(ch)
    others += ch.getBoundingClientRect().height + parseFloat(st.marginTop) + parseFloat(st.marginBottom)
  }
  const cs = getComputedStyle(box)
  const ph = page.clientHeight - others - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.marginTop) - parseFloat(cs.marginBottom) - 6
  const H = Math.min(SCENE_H + 170, Math.floor((ph * CW) / w)) // lấp đầy chỗ trống (tối đa thêm 170 điểm ảnh)
  const extra = H - SCENE_H
  if (extra <= FLOOR_H + 6) return base
  const top = Math.min(44, Math.round(extra * 0.4))
  return { w, top, H }
}

watch([staffAll, () => ui.phase], () => nextTick(() => requestAnimationFrame(() => resize(true))))
function resize(force: boolean | Event = false) {
  const el = wrap.value, canvas = cv.value
  if (!el || !canvas) return
  const vw = window.innerWidth, vh = window.innerHeight
  // đo lại khi đổi màn hình, hoặc khi khoảng trống cho cảnh đổi nhiều (khay thêm hàng nguyên liệu, kệ bánh…)
  const bh = el.parentElement?.clientHeight ?? 0
  // (không đo lại khi đang pha / đang trao ly – tránh cảnh xê dịch ngay lúc đang bấm)
  const busy = !!ui.brew || !!ui.present
  const big = !locked || vw !== locked.vw || Math.abs(vh - locked.vh) > 120 || (!busy && Math.abs(bh - locked.bh) > 40)
  if (force === true || big) locked = { vw, vh, bh, ...measure() }
  const { w, top, H } = locked!
  sceneW.value = w
  geo.top = top; geo.H = H; geoTick.value++
  const dpr = window.devicePixelRatio || 1
  // vẽ ở độ phân giải nguyên (sắc nét) rồi co vừa khít khung bằng CSS
  scale = Math.max(1, Math.ceil((w * dpr) / CW))
  // chỉ gán lại khi kích thước đổi thật – gán canvas.width sẽ xoá & cấp phát lại canvas (nặng, gây lag nút)
  if (canvas.width !== CW * scale || canvas.height !== H * scale) { canvas.width = CW * scale; canvas.height = H * scale }
  const set = (st: CSSStyleDeclaration, key: 'width' | 'height', v: string) => { if (st[key] !== v) st[key] = v }
  set(canvas.style, 'width', `${Math.floor(w)}px`)
  set(canvas.style, 'height', `${Math.round((w * H) / CW)}px`) // đúng tỉ lệ, không méo
  set(el.style, 'width', `${Math.floor(w)}px`)
  ctx = canvas.getContext('2d')
}

let off: (() => void) | null = null
onMounted(async () => {
  resize(true)
  requestAnimationFrame(() => { resize(true); setTimeout(() => resize(true), 300) }) // đợi bố cục xong mới đo & khoá
  window.addEventListener('resize', resize)
  ro = new ResizeObserver(() => resize())
  if (wrap.value) ro.observe(wrap.value.parentElement ?? wrap.value)
  for (const s of Object.keys(STEPS)) {
    const u = iconUrl(s)
    if (u) { const im = new Image(); im.src = u; dropImgs[s] = im }
  }
  off = bus.on(onEvent)
  raf = requestAnimationFrame(frame)
  await loadImages()
})
onDeactivated(() => cancelAnimationFrame(raf))
onBeforeUnmount(() => window.removeEventListener('resize', resize))
onActivated(() => { cancelAnimationFrame(raf); lastT = performance.now(); resize(true); raf = requestAnimationFrame(frame) })
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  off?.()
})

const pctX = (x: number) => `${((x + OX) / CW) * 100}%`
const pctY = (y: number) => (geoTick.value, `${((y + geo.top) / geo.H) * 100}%`)
/** Bóng thoại nằm phía trên (sát mép trên vùng tường, ngay dưới trần) như bản gốc;
 *  luôn chừa 14px cho nhãn tên nên không bị cắt ở mép trên, quá dài thì phần lời thoại tự cuộn */
/** nhân viên đang pha cho khách này: thu bóng thoại thành thẻ nhỏ trên đầu khách để thấy rõ nhân viên pha ở quầy */
const staffCompact = computed(() => staffAll.value && typed.value && talkHere.value?.mode !== 'chat' && !ui.present && (ui.staffProgress[0] ?? 0) > 0)
const bubbleStyle = computed(() => {
  if (staffCompact.value) return { top: `max(14px, ${pctY(8)})`, right: `calc(100% - ${pctX(96)})`, left: 'auto', width: 'auto', maxWidth: `${(110 / CW) * 100}%` }
  const top = `max(14px, ${pctY(6)})`
  return { top, maxHeight: `calc(100% - ${top} - 8px)`, left: pctX(-20), width: `${(96 / CW) * 100}%` } // từ tường hông trái tới sát đầu khách
})
</script>

<template>
  <div ref="wrap" class="scene-wrap" :class="{ shake: shaking }">
    <canvas ref="cv" class="pixel" />

    <!-- Đồng hồ kiên nhẫn kiểu game: mặt cảm xúc + thanh 10 ô + giây còn lại, đặt cạnh đầu khách -->
    <div v-if="actorView && cur && actorView.state === 'idle' && !review" class="pat" :class="patLevel"
      :style="{ left: pctX(actorView.x + 17), top: pctY(LAYOUT.customerY + 1) }">
      <div class="pat-top">
        <PixelIcon :name="patLevel === 'ok' ? 'faceHappy' : patLevel === 'warn' ? 'faceMeh' : 'faceAngry'" :size="2.4" class="pface" />
        <span class="psec">{{ patSecs }}<small>s</small></span>
      </div>
      <div class="psegs"><i v-for="i in 10" :key="i" :class="{ on: i <= patSeg }" /></div>
      <span v-if="patLevel === 'low'" class="pbang">!</span>
    </div>

    <!-- Combo: chuỗi ly pha chuẩn liên tiếp (góc trên phải) -->
    <div v-if="ui.phase === 'open' && ui.combo >= 2" :key="comboKey" class="combo" :class="{ hot: ui.combo >= 5, fire: ui.combo >= 10 }">
      <span class="cx">COMBO</span><b>x{{ ui.combo }}</b><small>+{{ Math.round(comboRate(ui.combo) * 100) }}%</small>
    </div>
    <div v-if="ui.phase === 'open' && ui.rush" class="rush-chip">CAO ĐIỂM</div>
    <Transition name="rush">
      <div v-if="rushBanner" class="rush-banner" :class="rushBanner.kind"><b>{{ rushBanner.text }}</b><small>{{ rushBanner.sub }}</small></div>
    </Transition>

    <!-- Dòng thông báo nhỏ ở đáy cảnh (thay hộp thông báo xanh to che nút) -->
    <Transition name="tick"><div v-if="ticker" :key="ticker.id" class="ticker" :class="ticker.kind">{{ ticker.text }}</div></Transition>

    <!-- HUD gọn: số khách chờ + tiến độ từng nhân viên (chỉ icon, không chữ) -->
    <div v-if="ui.phase === 'open' && (waiting > 0 || ui.staffProgress.length)" class="hud">
      <span v-if="waiting > 0" class="hchip"><PixelIcon name="crowd" :size="2" />{{ waiting }}</span>
      <span v-for="(p, i) in ui.staffProgress" :key="i" class="hstaff" :class="{ idle: !ui.staffJob[i] }" :title="ui.staffJob[i] ? 'Nhân viên đang pha ' + ui.staffJob[i] : 'Nhân viên rảnh'">
        <PixelIcon name="staff" :size="2" /><i><b :style="{ width: ui.staffJob[i] ? Math.min(100, (p / staffServeTime) * 100) + '%' : '0%' }" /></i>
      </span>
    </div>

    <!-- Bong bóng thoại -->
    <Transition name="pop" mode="out-in">
      <div v-if="review" key="rv" class="bubble review" :style="bubbleStyle">
        <div class="stars"><PixelIcon v-for="i in 5" :key="i" :name="i <= review.stars ? 'star' : 'starOff'" :size="2" /></div>
        <div class="txt"><TypeText :text="`“${review.text}”`" :pitch="640" :speed="26" /></div>
        <div class="money" v-if="!review.needy">+{{ (review.price / 1000).toFixed(0) }}k<span v-if="review.tip"> · tip {{ (review.tip / 1000).toFixed(0) }}k</span></div>
      </div>
      <div v-else-if="angry" key="an" class="bubble angry" :style="bubbleStyle"><div class="txt"><TypeText :text="`“${angry}”`" :pitch="340" :speed="24" /></div></div>
      <div v-else-if="cur && actorView?.state === 'idle'" :style="bubbleStyle" :key="'c' + cur.id + (talkHere?.mode ?? '') + (brewingHere ? 'b' : '')" class="bubble" :class="{ compact: staffCompact }" @click="typer?.skip()">
        <template v-if="staffCompact">
          <div class="cmp"><PixelIcon name="staff" :size="2" /> <span class="cmp-t">Đang pha <b>{{ recipeById[cur.recipe].name }}</b></span>
            <button v-if="!cur.chatted && cur.needy === undefined" @click.stop="talkHere ? talkChat() : (openTalk(cur.id), talkChat())"><PixelIcon name="chat" :size="2" /> Tám</button>
          </div>
        </template>
        <template v-else>
        <div class="who" :class="whoKind">{{ who }}</div>
        <div class="txt" :class="{ hurry: cur.line && cur.patience / cur.maxPatience < 0.5 && !talkHere }"><TypeText ref="typer" :text="bubbleText" :pitch="voice" :instant="lineInstant" @done="onTyped" /></div>
        <div v-if="cur.addon" class="addon" :class="{ done: cur.addonDone }"><img :src="iconUrl(cur.addon)" alt="" /><span>{{ cur.addonDone ? 'Đã trao' : 'Kèm' }}: <b>{{ goodName(cur.addon) }}</b></span></div>
        <div v-if="cur.food" class="addon food"><img :src="iconUrl(cur.food)" alt="" /><span>Món bếp: <b>{{ foodById[cur.food as FoodId]?.name }}</b></span></div>
        <div v-if="brewingHere" class="order"><PixelIcon name="menu" :size="2" /> {{ recipeById[cur.recipe].name }}</div>
        <div v-else-if="talkHere?.mode === 'chat'" class="choices">
          <button v-for="(r, i) in talkHere.topic!.replies" :key="i" :class="{ sassy: r.sassy }" @click="talkReply(i)"><PixelIcon :name="r.sassy ? 'megaphone' : 'chat'" :size="2" /> <span v-if="r.sassy" class="sass">XÉO SẮC</span> {{ noEmoji(r.text) }}</button>
        </div>
        <div v-else-if="staffAll && !ui.present" class="choices row">
          <span class="staff-note"><PixelIcon name="staff" :size="2" /> Nhân viên đang pha: {{ recipeById[cur.recipe].name }}</span>
          <button v-if="!cur.chatted && cur.needy === undefined" @click="talkHere ? talkChat() : (openTalk(cur.id), talkChat())"><PixelIcon name="chat" :size="2" /> Tám</button>
        </div>
        <div v-else-if="!ui.present" class="choices row">
          <button class="main" :class="{ dis: !canMake(cur.recipe), guide: tutOn && !ui.brew }" @click="talkHere ? brewFromTalk() : startBrew('cust', cur.id)">
            <PixelIcon name="cup" :size="2" /> {{ cur.needy !== undefined ? 'Dạ có, con pha liền!' : `Nhận order: ${recipeById[cur.recipe].name}` }}
          </button>
           <button v-if="!cur.chatted && cur.needy === undefined" @click="talkHere ? talkChat() : (openTalk(cur.id), talkChat())"><PixelIcon name="chat" :size="2" /> Tám</button>
        </div>
        </template>
      </div>
    </Transition>

    <!-- Ly thành phẩm -->
    <Transition name="present">
      <div v-if="ui.present" class="present" :class="{ guide: tutOn }" @click="skipPresent">
        <div class="rays" />
        <canvas ref="presentCv" width="200" height="260" class="pixel big-cup" />
        <div class="pname"><PixelIcon name="star" :size="2" /> {{ ui.present.target === 'cust' ? recipeById[ui.present.recipe].name : ui.present.name }} <PixelIcon name="star" :size="2" /></div>
        <div class="psub">{{ ui.present.cup.mistakes === 0 ? 'Pha chuẩn từng bước!' : `Sai ${ui.present.cup.mistakes} bước…` }}</div>
      </div>
    </Transition>

    <TransitionGroup name="float" tag="div" class="floats">
      <div v-for="f in ui.floats" :key="f.id" class="float" :class="f.kind" :style="{ left: f.x + '%', top: `calc(${pctY(0)} + ${30 + f.y}px)` }">{{ f.text }}</div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.scene-wrap {
  position: relative;
  max-width: 100%;
  flex: none;
  overflow: hidden;
  background: #f4e1c6;
  box-shadow: var(--px-border), 0 7px 0 rgba(59, 42, 32, 0.3);
  display: flex;
  justify-content: flex-start;
}
.scene-wrap > canvas { flex: none; }
.bubble.compact { padding: 4px 6px; }
.bubble.compact::after, .bubble.compact::before { right: 10px; }
.cmp { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; white-space: nowrap; }
.cmp b { font-weight: 900; }
.cmp-t { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.cmp button { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; font-size: 11px; font-weight: 900; background: #f1e2cf; box-shadow: var(--px-border-2); }
.scene-wrap.shake { animation: shake 0.3s; }
@keyframes shake { 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
.pixel { image-rendering: pixelated; image-rendering: crisp-edges; display: block; }

.pat {
  position: absolute; z-index: 3;
  display: flex; flex-direction: column; gap: 3px;
  padding: 3px 4px 4px;
  background: #3b2a20;
  box-shadow: 0 0 0 2px #fffaf0, 0 0 0 4px #3b2a20, 0 6px 0 rgba(59, 42, 32, 0.3);
  transition: transform 0.2s;
  pointer-events: none;
}
.pat-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.psec { font-size: 15px; font-weight: 900; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; text-shadow: 0 1px 0 #000; }
.psec small { font-size: 9px; opacity: 0.8; margin-left: 1px; }
.psegs { display: grid; grid-template-columns: repeat(10, 6px); gap: 1px; }
.psegs i { height: 10px; background: #5a4334; }
.pat.ok .psegs i.on { background: #6ad08f; box-shadow: inset 0 -2px 0 #2f9e6b, inset 0 1px 0 #c8f5d8; }
.pat.warn .psegs i.on { background: #f2c14e; box-shadow: inset 0 -2px 0 #d99a2b, inset 0 1px 0 #fff1a8; }
.pat.warn .psec { color: #ffd77a; }
.pat.low { background: #7d1a14; animation: patShake 0.35s ease-in-out infinite; }
.pat.low .psegs i.on { background: #ff5f52; box-shadow: inset 0 -2px 0 #b3261e, inset 0 1px 0 #ffb3ab; animation: segBlink 0.5s steps(2) infinite; }
.pat.low .psec { color: #ffd2cc; }
.pat.low .pface { animation: facePulse 0.5s ease-in-out infinite; }
.pbang {
  position: absolute; right: -8px; top: -12px;
  width: 12px; height: 15px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 900; color: #3b2a20; background: #ffd34d;
  box-shadow: 0 0 0 2px #3b2a20; animation: bang 0.5s ease-in-out infinite;
}
@keyframes patShake { 25% { transform: translateX(-1px) rotate(-2deg); } 75% { transform: translateX(1px) rotate(2deg); } }
@keyframes segBlink { 50% { opacity: 0.45; } }
@keyframes facePulse { 50% { transform: scale(1.2); } }
@keyframes bang { 50% { transform: translateY(-3px); } }
.ticker { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; pointer-events: none; padding: 2px 8px 3px; font-size: 11px; font-weight: 800; color: #ffe8b8; background: rgba(43, 30, 22, 0.86); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ticker.good { color: #9ff0be; }
.ticker.bad { color: #ffb0a6; }
.ticker.heart, .ticker.say { color: #ffe08a; }
.tick-enter-active, .tick-leave-active { transition: opacity 0.2s; }
.tick-enter-from, .tick-leave-to { opacity: 0; }
.addon { display: flex; align-items: center; gap: 4px; margin-top: 6px; padding: 3px 6px; font-size: 12px; background: #fff3cf; box-shadow: 0 0 0 2px #d99a2b; animation: addonPulse 1s ease-in-out infinite; }
.addon img { width: 16px; height: 16px; image-rendering: pixelated; }
.addon span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.addon.done { background: #e1f3ea; box-shadow: 0 0 0 2px #2f9e6b; animation: none; }
@keyframes addonPulse { 50% { box-shadow: 0 0 0 2px #e0524a; } }
.combo {
  position: absolute; right: 5px; top: 5px; z-index: 4; pointer-events: none;
  display: flex; align-items: baseline; gap: 3px; padding: 2px 6px 3px;
  background: #3b2a20; color: #ffe27a; box-shadow: 0 0 0 2px #ffd23f, 0 3px 0 2px rgba(0, 0, 0, 0.3);
  animation: comboPop 0.32s cubic-bezier(.3, 1.6, .5, 1);
}
.combo .cx { font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #ffd8a0; }
.combo b { font-size: 17px; font-weight: 900; line-height: 1; }
.combo small { font-size: 9px; font-weight: 800; color: #9ff0be; }
.combo.hot { background: #7a3410; box-shadow: 0 0 0 2px #ff9a3c, 0 0 12px 2px rgba(255, 154, 60, 0.6); }
.combo.fire { background: #8e1b2c; box-shadow: 0 0 0 2px #ff5f52, 0 0 16px 4px rgba(255, 95, 82, 0.7); animation: comboPop 0.32s cubic-bezier(.3, 1.6, .5, 1), comboGlow 0.6s 0.32s ease-in-out infinite alternate; }
@keyframes comboPop { from { transform: scale(1.7) rotate(-6deg); } }
@keyframes comboGlow { to { filter: brightness(1.25); } }
.rush-chip {
  position: absolute; right: 5px; top: 30px; z-index: 4; pointer-events: none;
  font-size: 9px; font-weight: 900; letter-spacing: 1px; color: #fff; background: #d8333a; padding: 2px 5px;
  box-shadow: 0 0 0 2px #3b2a20; animation: rushBlink 0.7s steps(2) infinite;
}
@keyframes rushBlink { 50% { background: #ff6b4a; } }
.rush-banner {
  position: absolute; left: 0; right: 0; bottom: 22px; z-index: 6; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; padding: 6px 8px 7px;
  background: repeating-linear-gradient(-45deg, #d8333a 0 10px, #b8262c 10px 20px);
  box-shadow: 0 3px 0 #3b2a20, 0 -3px 0 #3b2a20;
}
.rush-banner.win { background: repeating-linear-gradient(-45deg, #2f9e6b 0 10px, #23845a 10px 20px); }
.rush-banner b { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #fff3b0; text-shadow: 0 2px 0 #3b2a20, 2px 0 0 #3b2a20, -2px 0 0 #3b2a20; }
.rush-banner small { font-size: 11px; font-weight: 800; color: #fff; }
.rush-enter-active { animation: rushIn 0.35s cubic-bezier(.2, 1.4, .5, 1); }
.rush-leave-active { transition: opacity 0.3s, transform 0.3s; }
.rush-leave-to { opacity: 0; transform: translateX(40%); }
@keyframes rushIn { from { transform: translateX(-110%) skewX(-12deg); } }
.hud { position: absolute; right: 6px; bottom: 22px; display: flex; gap: 4px; pointer-events: none; z-index: 3; }
.hchip, .hstaff { display: flex; align-items: center; gap: 3px; background: rgba(59, 42, 32, 0.9); color: #ffe8b8; font-size: 11px; font-weight: 900; padding: 2px 5px 3px; box-shadow: 0 0 0 2px #3b2a20; }
.hstaff i { display: block; width: 16px; height: 4px; background: #5a4334; }
.hstaff i b { display: block; height: 100%; background: #3fd18b; transition: width 0.2s linear; }
.hstaff.idle { opacity: 0.55; }

/* ---- Khung chat kiểu hộp thoại pixel: góc vát bậc thang, viền đôi, thẻ tên, đuôi chỉ về phía khách ---- */
.bubble {
  --bd: #3b2a20; --paper: #fffaf0; --shade: #f1dfc4; --tag: #8a5a3c;
  position: absolute;
  left: 3%;
  width: 60%;
  display: flex; flex-direction: column;
  background: var(--paper);
  padding: 10px 9px 8px;
  font-size: 13px;
  line-height: 1.35;
  color: #3b2a20;
  /* viền pixel 3px với 4 góc vát (không dùng border-radius) + viền sáng bên trong + bóng đáy */
  box-shadow:
    -3px 0 0 0 var(--bd), 3px 0 0 0 var(--bd), 0 -3px 0 0 var(--bd), 0 3px 0 0 var(--bd),
    inset 0 0 0 2px #ffffff, inset 0 -5px 0 0 var(--shade);
  filter: drop-shadow(4px 4px 0 rgba(59, 42, 32, 0.28));
  z-index: 2;
}
/* đuôi bong bóng: bậc thang pixel chĩa xuống phải, về phía đầu khách */
.bubble::before, .bubble::after {
  content: ''; position: absolute; right: 18px; bottom: -14px; width: 14px; height: 14px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 86% 100%, 86% 86%, 71% 86%, 71% 71%, 57% 71%, 57% 57%, 43% 57%, 43% 43%, 29% 43%, 29% 29%, 14% 29%, 14% 14%, 0 14%);
}
.bubble::before { background: var(--bd); bottom: -17px; right: 15px; width: 17px; height: 17px; }
.bubble::after { background: var(--shade); }
.who {
  position: absolute; left: 8px; top: -13px; max-width: calc(100% - 16px);
  font-size: 10px; font-weight: 900; letter-spacing: 0.02em; color: #fff;
  background: var(--tag); padding: 2px 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  box-shadow: -2px 0 0 0 var(--bd), 2px 0 0 0 var(--bd), 0 -2px 0 0 var(--bd), 0 2px 0 0 var(--bd), inset 0 -2px 0 rgba(0, 0, 0, 0.18);
}
.who.reg { --tag: #2f9e6b; }
.who.rare { --tag: #7a4fd0; }
.who.intl { --tag: #2e6fb0; }
.txt { flex: 0 1 auto; font-weight: 700; margin-top: 2px; min-height: 1.35em; overflow-y: auto; cursor: pointer; }
.bubble > :not(.txt) { flex: none; }
.txt.hurry { color: #c0392b; }
.skip-hint {
  margin-top: 5px; text-align: right; font-size: 10px; font-weight: 800; color: #b09276; cursor: pointer;
  animation: skipNudge 0.8s ease-in-out infinite;
}
@keyframes skipNudge { 50% { transform: translateX(-3px); opacity: 0.6; } }
.order {
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 6px; font-size: 12px; font-weight: 800;
  background: #fff3dc; padding: 3px 7px; border: 2px dashed #d8b98d;
}
.choices { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; animation: choicesIn 0.22s ease-out; }
.staff-note { flex: 1 1 auto; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; color: #2f6b4a; background: #e3f4ea; padding: 5px 7px; box-shadow: 0 0 0 2px #2f9e6b; }
.addon.food { background: #fff0e0; }
.choices.row { flex-direction: row; align-items: stretch; gap: 7px; }
.choices.row button { flex: none; padding: 6px 8px; }
.choices.row button.main { flex: 1 1 auto; min-width: 0; line-height: 1.2; }
@keyframes choicesIn { from { opacity: 0; transform: translateY(4px); } }
.choices button {
  display: flex; align-items: center; gap: 6px;
  text-align: left; font-size: 12px; font-weight: 800; color: #3b2a20;
  background: #f4e7d6; border: none; padding: 6px 9px;
  box-shadow: -2px 0 0 0 #3b2a20, 2px 0 0 0 #3b2a20, 0 -2px 0 0 #3b2a20, 0 2px 0 0 #3b2a20, inset 0 -3px 0 rgba(59, 42, 32, 0.15), 0 4px 0 0 rgba(59, 42, 32, 0.35);
  transition: transform 0.06s;
}
.choices button:hover { background: #fbefdf; }
.choices button:active { transform: translateY(3px); box-shadow: -2px 0 0 0 #3b2a20, 2px 0 0 0 #3b2a20, 0 -2px 0 0 #3b2a20, 0 2px 0 0 #3b2a20; }
.choices button.main { background: #f2c14e; }
.choices button.sassy { background: #fde7ef; }
.choices .sass { font-size: 9px; font-weight: 900; letter-spacing: 0.06em; padding: 1px 4px; background: #c94f63; color: #fff; margin-right: 2px; vertical-align: 1px; }
.choices button.main:hover { background: #f7cf68; }
.choices button.dis { opacity: 0.6; }
.bubble.review { --bd: #24704d; --shade: #dcefe2; }
@keyframes beat { 50% { transform: scale(1.15); } }
@keyframes pulse-v { 50% { box-shadow: inset 0 0 55px 16px rgba(179, 38, 30, 0.6); } }
@keyframes blink { 50% { opacity: 0.4; } }
.banner-enter-active { transition: all 0.35s cubic-bezier(0.3, 1.6, 0.5, 1); }
.banner-leave-active { transition: all 0.25s; }
.banner-enter-from { opacity: 0; transform: scale(0.6); }
.banner-leave-to { opacity: 0; }
.bubble.angry { --bd: #a3302a; --paper: #fff4f2; --shade: #f7d9d4; }
.bubble.angry .txt { color: #c0392b; }
.stars { display: flex; gap: 2px; margin-bottom: 3px; }
.stars span { color: #e3d6c8; }
.money { margin-top: 4px; font-weight: 900; color: #2f9e6b; font-size: 13px; }
.money.heart { color: #b7791f; display: flex; align-items: center; gap: 5px; }

.present {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 50% 45%, rgba(255, 246, 220, 0.97), rgba(243, 226, 200, 0.95));
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 5;
}
.rays {
  position: absolute; width: 360px; height: 360px; top: 50%; left: 50%; margin: -200px 0 0 -180px;
  background: repeating-conic-gradient(rgba(242, 193, 78, 0.25) 0 10deg, transparent 10deg 20deg);
  border-radius: 50%; animation: spin 6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.big-cup { position: relative; width: 120px; height: 156px; animation: bounce 0.6s cubic-bezier(0.3, 1.6, 0.5, 1); }
@keyframes bounce { from { transform: scale(0.3) translateY(40px); } }
.pname { position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 900; font-size: 17px; margin-top: 4px; color: #3b2a20; }
.psub { position: relative; font-size: 12px; font-weight: 700; color: #8a5a3c; }
.present-enter-active, .present-leave-active { transition: opacity 0.25s; }
.present-enter-from, .present-leave-to { opacity: 0; }

.pop-enter-active { transition: all 0.2s cubic-bezier(0.3, 1.5, 0.5, 1); }
.pop-enter-from { opacity: 0; transform: scale(0.85); }

.floats { position: absolute; inset: 0; pointer-events: none; }
.float {
  position: absolute; transform: translateX(-50%);
  font-weight: 900; font-size: 12px; background: #fff; border: 2px solid #3b2a20;
  padding: 1px 8px; border-radius: 6px; white-space: nowrap;
  animation: rise 1.3s ease-out forwards;
}
.float.good { color: #2f9e6b; }
.float.bad { color: #d9534f; }
@keyframes rise {
  0% { opacity: 0; transform: translate(-50%, 8px); }
  15% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -22px); }
}
</style>
