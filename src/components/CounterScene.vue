<script setup lang="ts">
// Cảnh quầy pha chế pixel art: khách bước tới quầy, thiết bị, ly nước, hoạt ảnh.
import { ref, computed, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch } from 'vue'
import {
  ui, save, bus, openTalk, talkChat, talkReply, brewFromTalk, startBrew, canMake, stepMs, DAY_LENGTH, staffServeTime, skipPresent,
  type Customer, type GameEvent,
} from '../game/store'
import { drawBoss, bossSkin } from '../game/bossSprites'
import { drawSign, SIGN_W } from '../game/sign'
import TypeText from './TypeText.vue'
import { noEmoji } from '../game/emoji'
import PixelIcon from './ui/PixelIcon.vue'
import { tick } from '../game/audio'
import { recipeById, REGULARS, NEEDY, BOND_LEVELS, bondLevel, STEPS, BOSSES, type StepId } from '../game/data'
import {
  SCENE_W, SCENE_H, LAYOUT, COUNTER_Y, images, loadImages, drawRoom, drawCounter, drawCup, drawPerson, iconUrl,
  emptyCup, px, espressoKey, drawPlant, drawLights, drawBunting, drawOpenSign, drawPoster, drawCat, drawFridge, drawSack, drawGreen, drawScooter, drawBarista, drawCorgi,
  type CupLook, type Mood,
} from '../game/pixel'
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
const bossBanner = ref<number | null>(null)
const bossResult = ref<boolean | null>(null)
const isBoss = computed(() => cur.value?.boss !== undefined)
const lastBossStingy = computed(() => !!BOSSES[(save.day - 1) % BOSSES.length].stingy)

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
  if (c.boss !== undefined) return `BOSS · ${BOSSES[c.boss].name}`
  if (c.rare) return `${rareById[c.rare]?.name ?? c.name} · khách hiếm`
  return c.name ?? 'Khách'
})
const whoKind = computed(() => (cur.value?.boss !== undefined ? 'boss' : cur.value?.rare ? 'rare' : cur.value?.regular ? 'reg' : ''))
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
/** giọng: boss trầm, người cần ly treo nhỏ nhẹ, khách khác cao thấp khác nhau theo mã khách */
const voice = computed(() => {
  const c = cur.value
  if (!c) return 560
  if (c.boss !== undefined) return 300
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

function onEvent(e: GameEvent) {
  const now = performance.now()
  if (e.type === 'step') {
    actStep = e.step
    actStart = now
  } else if (e.type === 'wrong') {
    shaking.value = true
    setTimeout(() => (shaking.value = false), 320)
  } else if (e.type === 'served' && actor && actor.id === e.id) {
    actor.holding = { ...(lastCup ?? emptyCup()), cup: true, straw: true, lid: true }
    actor.mood = e.needy ? 'love' : actor.cust.boss !== undefined ? 'grumpy' : e.stars >= 4 ? 'happy' : e.stars === 3 ? 'neutral' : 'sad'
    actor.holdUntil = now + 2200
    review.value = { stars: e.stars, text: e.text, needy: e.needy, price: e.price, tip: e.tip }
  } else if (e.type === 'boss') {
    bossBanner.value = e.idx
    shaking.value = true
    setTimeout(() => (shaking.value = false), 500)
    setTimeout(() => (bossBanner.value = null), 2200)
  } else if (e.type === 'bossEnd') {
    bossResult.value = e.win
    setTimeout(() => (bossResult.value = null), 2200)
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

function cupLook(): CupLook | null {
  const b = ui.brew
  if (!b || ui.present) return null
  return { cup: b.cup, layers: b.layers, ice: b.ice, mixed: b.mixed, foam: b.foam, whip: b.whip, blended: b.blended, chunks: b.chunks }
}

function updateActor(now: number, dt: number) {
  const f = front.value
  if (!actor && f && ui.phase === 'open') {
    actor = { id: f.id, cust: f, x: SCENE_W + 8, target: LAYOUT.customerX, state: 'enter', mood: f.boss !== undefined ? 'grumpy' : 'neutral', holding: null, holdUntil: 0 }
    review.value = null
    angry.value = null
  }
  if (!actor) { actorView.value = null; return }
  const stillHere = ui.queue.some((c) => c.id === actor!.id)
  if (actor.state !== 'leave') {
    const shouldLeave = (actor.holdUntil && now > actor.holdUntil) || (!stillHere && !actor.holdUntil) || ui.phase !== 'open'
    if (shouldLeave) { actor.state = 'leave'; actor.target = SCENE_W + 12 }
  }
  const speed = 95
  if (actor.x !== actor.target) {
    const d = actor.target - actor.x
    actor.x += Math.sign(d) * Math.min(Math.abs(d), speed * dt)
  } else if (actor.state === 'enter') {
    actor.state = 'idle'
    if (ui.phase === 'open' && !ui.brew && !ui.present && stillHere) openTalk(actor.id)
  }
  if (actor.state === 'leave' && actor.x >= SCENE_W + 10) {
    actor = null
    actorView.value = null
    review.value = null
    angry.value = null
    return
  }
  if (actor.cust.patience / actor.cust.maxPatience < 0.3 && (actor.mood === 'neutral' || actor.mood === 'grumpy') && stillHere) actor.mood = actor.cust.boss !== undefined ? 'angry' : 'sad'
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

function draw(now: number) {
  const c = ctx
  if (!c) return
  const t = now / 1000
  c.setTransform(scale, 0, 0, scale, 0, 0)
  c.imageSmoothingEnabled = false
  const dayFrac = ui.phase === 'open' ? ui.time / DAY_LENGTH : 0.15
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
  if (staffN >= 1) drawBarista(c, 49, LAYOUT.customerY + 1, (ui.staffProgress[0] ?? 0) > 0, t, 0, sp(0))
  if (staffN >= 2) drawBarista(c, 99, LAYOUT.customerY + 1, (ui.staffProgress[1] ?? 0) > 0, t, 1, sp(1))

  // khách
  if (actor) {
    const walking = actor.x !== actor.target
    const bob = walking ? Math.floor(t * 8) % 2 : actor.mood === 'happy' || actor.mood === 'love' ? Math.floor(t * 3) % 2 : 0
    const blink = Math.floor(t * 10) % 37 === 0
    const isBossActor = actor.cust.boss !== undefined
    if (isBossActor) {
      // hào quang đỏ của boss (khung 24x32 to hơn khách thường)
      const a = 0.16 + 0.1 * Math.sin(t * 6)
      c.fillStyle = `rgba(217,40,40,${a})`
      c.fillRect(Math.round(actor.x) - 6, LAYOUT.customerY - 6, 28, 32)
      c.fillStyle = `rgba(217,40,40,${a * 0.6})`
      c.fillRect(Math.round(actor.x) - 8, LAYOUT.customerY - 2, 32, 28)
      drawBoss(c, actor.cust.boss!, Math.round(actor.x) - 4, LAYOUT.customerY - 4 - bob, actor.mood, blink)
    } else {
      drawPerson(c, actor.cust.look, Math.round(actor.x), LAYOUT.customerY - bob, actor.mood, blink)
    }
    if (actor.holding) {
      const hx = Math.round(actor.x) - (isBossActor ? 13 : 11)
      const hy = COUNTER_Y - 18 - bob
      drawCup(c, actor.holding, hx, hy)
      px(c, hx + 9, hy + 9, 3, 3, isBossActor ? bossSkin(actor.cust.boss!) : actor.cust.look.skin)
    }
    if (actor.mood === 'love') {
      const hy = LAYOUT.customerY - 8 - (Math.floor(t * 4) % 3)
      px(c, actor.x + 6, hy, 2, 2, '#ff6b81'); px(c, actor.x + 9, hy, 2, 2, '#ff6b81'); px(c, actor.x + 6, hy + 2, 5, 1, '#ff6b81'); px(c, actor.x + 7, hy + 3, 3, 1, '#ff6b81'); px(c, actor.x + 8, hy + 4, 1, 1, '#ff6b81')
    }
    if (actor.mood === 'angry' && !isBossActor) {
      const ay = LAYOUT.customerY - 6
      px(c, actor.x + 12, ay, 3, 1, '#e8503a'); px(c, actor.x + 13, ay - 1, 1, 3, '#e8503a')
    }
  }

  const night = Math.max(0, Math.min(1, (dayFrac - 0.78) / 0.12))
  if (P === 2) { drawCounterBig(c, t, save.meta.goods); drawSign(c, 4, COUNTER_Y + 6, t, night); drawStools(c) }
  else if (P === 1) { drawCounterMid(c); drawSign(c, (SCENE_W - SIGN_W) / 2 - 6, COUNTER_Y + 6, t, night); drawSouvenirShelf(c, save.meta.goods) }
  else { drawCounter(c); drawSign(c, (SCENE_W - SIGN_W) / 2, COUNTER_Y + 6, t, night) }
  // đồ trên mặt quầy / thân quầy
  if (U.decor >= 1) drawPlant(c, 67, COUNTER_Y - 13)
  if (U.decor >= 3 && P === 0) drawPlant(c, 112, COUNTER_Y + 12, true)
  if (U.decor >= 4) drawCat(c, 96, COUNTER_Y - 7, t)
  if (U.farmer && P !== 2) drawSack(c, 22, COUNTER_Y + 13)
  if (U.green && P === 0) drawGreen(c, 101, COUNTER_Y + 10)
  // Cáo – corgi đồng sáng lập: ngủ khi quán đóng, đứng vẫy đuôi khi có khách vui
  drawCorgi(c, P === 2 ? 78 : 2, SCENE_H - 18, t, ui.phase !== 'open' ? 'lie' : actor && (actor.mood === 'happy' || actor.mood === 'love') ? 'stand' : 'sit', !!actor && actor.mood !== 'angry', save.meta.wear)
  if (staffN >= 3) { px(c, 2, COUNTER_Y - 6, 9, 5, '#fffaf2'); px(c, 3, COUNTER_Y - 5, 7, 3, '#6f4e37') }

  // máy espresso + ly shot
  const el = actStep ? now - actStart : 0
  const act = (s: StepId) => actStep === s && el < stepMs(s) + 50
  const esp = images[espressoKey(U.machine)] ?? images.espresso
  const espY = COUNTER_Y + 2 - (esp?.height ?? 25)
  const shotX = LAYOUT.espresso.x + 12, shotY = espY + (esp?.height ?? 25) - 10
  if (esp) c.drawImage(esp, LAYOUT.espresso.x, espY)
  if (act('chiet')) {
    const p = el / stepMs('chiet')
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
    if (act('lac')) {
      const p = el / STEPS.lac.ms
      const up = p < 0.15 ? p / 0.15 : p > 0.85 ? (1 - p) / 0.15 : 1
      const sx = LAYOUT.shaker.x - 14 * up + Math.round(Math.sin(t * 40) * 2 * (p > 0.15 && p < 0.85 ? 1 : 0))
      const sy = LAYOUT.shaker.y - 20 * up + Math.round(Math.cos(t * 40) * 2 * (p > 0.15 && p < 0.85 ? 1 : 0))
      c.drawImage(images.shaker, Math.round(sx), Math.round(sy))
      if (p > 0.85) px(c, LAYOUT.cup.x + 6, LAYOUT.cup.y - 4, 1, 6, '#c9b08a')
    } else c.drawImage(images.shaker, LAYOUT.shaker.x, LAYOUT.shaker.y)
  }
  // máy xay
  if (images.blender) {
    const v = act('xay') ? Math.round(Math.sin(t * 60)) : 0
    c.drawImage(images.blender, LAYOUT.blender.x + v, LAYOUT.blender.y)
    if (act('xay')) {
      for (let i = 0; i < 6; i++) px(c, LAYOUT.blender.x + 3 + ((i * 3 + Math.floor(t * 30)) % 9), LAYOUT.blender.y + 4 + ((i * 5) % 10), 2, 1, '#9cc66b')
    }
  }

  // ly đang pha
  const look = cupLook()
  if (look) {
    drawCup(c, look, LAYOUT.cup.x, LAYOUT.cup.y)
    // nguyên liệu rơi vào ly
    if (actStep && STEPS[actStep].kind === 'ing' && el < 300) {
      const img = dropImgs[actStep]
      const p = el / 300
      if (img && img.complete) c.drawImage(img, LAYOUT.cup.x, Math.round(LAYOUT.cup.y - 16 + 12 * p), 12, 12)
    }
    if (act('khuay')) {
      const a = t * 18
      px(c, LAYOUT.cup.x + 6 + Math.round(Math.cos(a) * 3), LAYOUT.cup.y - 6, 1, 12, '#c4cbd1')
    }
    if (act('xay') && el > STEPS.xay.ms * 0.8) px(c, LAYOUT.cup.x + 6, LAYOUT.cup.y - 4, 1, 6, '#9cc66b')
  } else if (ui.phase === 'open' && !ui.present) {
    drawCup(c, emptyCup(), LAYOUT.cup.x, LAYOUT.cup.y)
  }
}

function resize() {
  const el = wrap.value, canvas = cv.value
  if (!el || !canvas) return
  const dpr = window.devicePixelRatio || 1
  // vừa cả chiều ngang lẫn chiều cao khung chứa (màn đang bán không cuộn)
  const box = el.parentElement
  const pw = box?.clientWidth || el.clientWidth
  const cs = box ? getComputedStyle(box) : null
  const ph = box ? box.clientHeight - parseFloat(cs!.paddingTop) - parseFloat(cs!.paddingBottom) - 8 : Infinity
  const w = Math.min(pw, ph > 60 ? (ph * SCENE_W) / SCENE_H : pw)
  // vẽ ở độ phân giải nguyên (sắc nét) rồi co vừa khít khung bằng CSS → không bị hụt chỗ trống
  scale = Math.max(1, Math.ceil((w * dpr) / SCENE_W))
  canvas.width = SCENE_W * scale
  canvas.height = SCENE_H * scale
  canvas.style.width = `${Math.floor(w)}px`
  canvas.style.height = `${Math.floor((w * SCENE_H) / SCENE_W)}px`
  el.style.width = canvas.style.width
  ctx = canvas.getContext('2d')
}

let off: (() => void) | null = null
onMounted(async () => {
  resize()
  requestAnimationFrame(() => { resize(); setTimeout(resize, 300) }) // đợi bố cục xong mới đo lại
  window.addEventListener('resize', resize)
  ro = new ResizeObserver(resize)
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
onActivated(() => { cancelAnimationFrame(raf); lastT = performance.now(); resize(); raf = requestAnimationFrame(frame) })
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  off?.()
})

const pctX = (x: number) => `${(x / SCENE_W) * 100}%`
const pctY = (y: number) => `${(y / SCENE_H) * 100}%`
</script>

<template>
  <div ref="wrap" class="scene-wrap" :class="{ shake: shaking }">
    <canvas ref="cv" class="pixel" />

    <!-- Đồng hồ kiên nhẫn kiểu game: mặt cảm xúc + thanh 10 ô + giây còn lại, đặt cạnh đầu khách -->
    <div v-if="actorView && cur && actorView.state === 'idle' && !review" class="pat" :class="patLevel"
      :style="{ left: pctX(actorView.x + (isBoss ? 21 : 17)), top: pctY(LAYOUT.customerY + 1) }">
      <div class="pat-top">
        <PixelIcon :name="patLevel === 'ok' ? 'faceHappy' : patLevel === 'warn' ? 'faceMeh' : 'faceAngry'" :size="2.4" class="pface" />
        <span class="psec">{{ patSecs }}<small>s</small></span>
      </div>
      <div class="psegs"><i v-for="i in 10" :key="i" :class="{ on: i <= patSeg }" /></div>
      <span v-if="patLevel === 'low'" class="pbang">!</span>
    </div>

    <!-- Dòng thông báo nhỏ ở đáy cảnh (thay hộp thông báo xanh to che nút) -->
    <Transition name="tick"><div v-if="ticker && bossBanner === null && bossResult === null" :key="ticker.id" class="ticker" :class="ticker.kind">{{ ticker.text }}</div></Transition>

    <!-- HUD gọn: số khách chờ + tiến độ từng nhân viên (chỉ icon, không chữ) -->
    <div v-if="ui.phase === 'open' && (waiting > 0 || ui.staffProgress.length)" class="hud">
      <span v-if="waiting > 0" class="hchip"><PixelIcon name="crowd" :size="2" />{{ waiting }}</span>
      <span v-for="(p, i) in ui.staffProgress" :key="i" class="hstaff" :class="{ idle: !ui.staffJob[i] }" :title="ui.staffJob[i] ? 'Nhân viên đang pha ' + ui.staffJob[i] : 'Nhân viên rảnh'">
        <PixelIcon name="staff" :size="2" /><i><b :style="{ width: ui.staffJob[i] ? Math.min(100, (p / staffServeTime) * 100) + '%' : '0%' }" /></i>
      </span>
    </div>

    <!-- Đồng hồ đếm ngược của boss -->
    <div v-if="isBoss && cur && actorView?.state === 'idle' && !review" class="boss-timer" :class="{ hurry: cur.patience < 8 }">
      <PixelIcon name="clock" :size="2" /> {{ Math.max(0, Math.ceil(cur.patience)) }}s
    </div>
    <div v-if="ui.bossState === 'here' || bossBanner !== null" class="boss-vignette" />

    <!-- Boss xuất hiện -->
    <Transition name="banner">
      <div v-if="bossBanner !== null" class="boss-banner">
        <div class="warn"><PixelIcon name="warn" :size="2" /> BOSS XUẤT HIỆN <PixelIcon name="warn" :size="2" /></div>
        <div class="bname">{{ BOSSES[bossBanner].name }} <small>· {{ BOSSES[bossBanner].title }}</small></div>
      </div>
    </Transition>
    <Transition name="banner">
      <div v-if="bossResult !== null" class="boss-banner" :class="bossResult ? 'win' : 'lose'">
        <div class="warn"><PixelIcon :name="bossResult ? 'trophy' : 'cross'" :size="2" /> {{ bossResult ? 'ĐÃ CHINH PHỤC BOSS!' : 'THUA BOSS…' }}</div>
        <div class="bhint">{{ bossResult ? (lastBossStingy ? '+5 sao · nhưng keo kiệt, không tip còn đòi bớt 2k' : '+5 sao (dù vẫn mặt nặng mày nhẹ) · thưởng lớn') : '1 sao xéo sắc · mất danh tiếng' }}</div>
      </div>
    </Transition>

    <!-- Bong bóng thoại -->
    <Transition name="pop" mode="out-in">
      <div v-if="review" key="rv" class="bubble review">
        <div class="stars"><PixelIcon v-for="i in 5" :key="i" :name="i <= review.stars ? 'star' : 'starOff'" :size="2" /></div>
        <div class="txt"><TypeText :text="`“${review.text}”`" :pitch="640" :speed="26" /></div>
        <div class="money" v-if="!review.needy">+{{ (review.price / 1000).toFixed(0) }}k<span v-if="review.tip"> · tip {{ (review.tip / 1000).toFixed(0) }}k</span></div>
      </div>
      <div v-else-if="angry" key="an" class="bubble angry"><div class="txt"><TypeText :text="`“${angry}”`" :pitch="340" :speed="24" /></div></div>
      <div v-else-if="cur && actorView?.state === 'idle'" :key="'c' + cur.id + (talkHere?.mode ?? '') + (brewingHere ? 'b' : '')" class="bubble" :class="{ boss: isBoss }" @click="typer?.skip()">
        <div class="who" :class="whoKind">{{ who }}</div>
        <div class="txt" :class="{ hurry: cur.line && cur.patience / cur.maxPatience < 0.5 && !talkHere }"><TypeText ref="typer" :text="bubbleText" :pitch="voice" :instant="lineInstant" @done="onTyped" /></div>
        <div v-if="cur.addon" class="addon" :class="{ done: cur.addonDone }"><img :src="iconUrl(cur.addon)" alt="" /><span>{{ cur.addonDone ? 'Đã trao' : 'Kèm' }}: <b>{{ goodName(cur.addon) }}</b></span></div>
        <div v-if="brewingHere" class="order"><PixelIcon name="menu" :size="2" /> {{ recipeById[cur.recipe].name }}</div>
        <div v-else-if="talkHere?.mode === 'chat'" class="choices">
          <button v-for="(r, i) in talkHere.topic!.replies" :key="i" :class="{ sassy: r.sassy }" @click="talkReply(i)"><PixelIcon :name="r.sassy ? 'megaphone' : 'chat'" :size="2" /> <span v-if="r.sassy" class="sass">XÉO SẮC</span> {{ noEmoji(r.text) }}</button>
        </div>
        <div v-else-if="!ui.present" class="choices">
          <button class="main" :class="{ dis: !canMake(cur.recipe) }" @click="talkHere ? brewFromTalk() : startBrew('cust', cur.id)">
            <PixelIcon name="cup" :size="2" /> {{ cur.needy !== undefined ? 'Dạ có, con pha liền!' : `Nhận order: ${recipeById[cur.recipe].name}` }}
          </button>
           <button v-if="!cur.chatted && cur.needy === undefined && cur.boss === undefined" @click="talkHere ? talkChat() : (openTalk(cur.id), talkChat())"><PixelIcon name="chat" :size="2" /> Tám chuyện xíu</button>
        </div>
      </div>
    </Transition>

    <!-- Ly thành phẩm -->
    <Transition name="present">
      <div v-if="ui.present" class="present" @click="skipPresent">
        <div class="rays" />
        <canvas ref="presentCv" width="200" height="260" class="pixel big-cup" />
        <div class="pname"><PixelIcon name="star" :size="2" /> {{ ui.present.target === 'cust' ? recipeById[ui.present.recipe].name : ui.present.name }} <PixelIcon name="star" :size="2" /></div>
        <div class="psub">{{ ui.present.cup.mistakes === 0 ? 'Pha chuẩn từng bước!' : `Sai ${ui.present.cup.mistakes} bước…` }}</div>
      </div>
    </Transition>

    <TransitionGroup name="float" tag="div" class="floats">
      <div v-for="f in ui.floats" :key="f.id" class="float" :class="f.kind" :style="{ left: f.x + '%', top: 30 + f.y + 'px' }">{{ f.text }}</div>
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
  justify-content: center;
}
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
.hud { position: absolute; right: 6px; bottom: 22px; display: flex; gap: 4px; pointer-events: none; z-index: 3; }
.hchip, .hstaff { display: flex; align-items: center; gap: 3px; background: rgba(59, 42, 32, 0.9); color: #ffe8b8; font-size: 11px; font-weight: 900; padding: 2px 5px 3px; box-shadow: 0 0 0 2px #3b2a20; }
.hstaff i { display: block; width: 16px; height: 4px; background: #5a4334; }
.hstaff i b { display: block; height: 100%; background: #3fd18b; transition: width 0.2s linear; }
.hstaff.idle { opacity: 0.55; }

/* ---- Khung chat kiểu hộp thoại pixel: góc vát bậc thang, viền đôi, thẻ tên, đuôi chỉ về phía khách ---- */
.bubble {
  --bd: #3b2a20; --paper: #fffaf0; --shade: #f1dfc4; --tag: #8a5a3c;
  position: absolute;
  left: 4%;
  top: 9%;
  width: 54%;
  background: var(--paper);
  padding: 9px 10px 8px;
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
.who.boss { --tag: #b3261e; }
.txt { font-weight: 700; margin-top: 2px; min-height: 1.35em; cursor: pointer; }
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
.bubble.boss { --bd: #7d1a14; --paper: #fff4f2; --shade: #f7d9d4; }
.boss-timer {
  position: absolute; right: 6px; top: 6px; z-index: 3;
  background: #b3261e; color: #fff; font-weight: 900; font-size: 18px;
  display: flex; align-items: center; gap: 5px;
  padding: 3px 10px; box-shadow: 0 0 0 2px #3b2a20; font-variant-numeric: tabular-nums;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
}
.boss-timer.hurry { animation: beat 0.5s ease-in-out infinite; background: #ff2d2d; }
@keyframes beat { 50% { transform: scale(1.15); } }
.boss-vignette {
  position: absolute; inset: 0; pointer-events: none; z-index: 2;
  box-shadow: inset 0 0 40px 10px rgba(179, 38, 30, 0.45);
  animation: pulse-v 1.2s ease-in-out infinite;
}
@keyframes pulse-v { 50% { box-shadow: inset 0 0 55px 16px rgba(179, 38, 30, 0.6); } }
.boss-banner {
  position: absolute; left: 4px; right: 4px; bottom: 4px; z-index: 6; pointer-events: none;
  background: rgba(43, 20, 20, 0.94); color: #fff; text-align: center;
  border: 2px solid #f2c14e; border-radius: 8px; padding: 4px 8px 5px;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.35);
}
.boss-banner .warn { display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 900; color: #ffcf4d; font-size: 12px; letter-spacing: 0.04em; animation: blink 0.4s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.4; } }
.boss-banner .bname { font-weight: 900; font-size: 14px; line-height: 1.2; }
.boss-banner .bname small { font-size: 11px; font-weight: 700; opacity: 0.8; }
.boss-banner .btitle { font-size: 12px; opacity: 0.8; }
.boss-banner .bhint { font-size: 11px; font-weight: 700; color: #ffd9d4; }
.boss-banner.win, .boss-banner.lose { padding: 4px 8px 5px; }
.boss-banner.win { background: #123a26; border-color: #6ad08f; }
.boss-banner.win .warn { color: #8ff0b0; animation: none; }
.boss-banner.lose { background: #3a1212; }
.boss-banner.lose .warn { animation: none; }
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
