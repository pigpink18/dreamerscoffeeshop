import { noEmoji } from './text'
import { reactive, computed, watch } from 'vue'
import {
  INGREDIENTS, RECIPES, WEATHERS, CUSTOMER_FACES, UPGRADES, STEPS, LINES, REVIEWS, SHIPPERS, RAPS, ORDER_NAMES, NEEDY, REGULARS, GENERIC_ORDERS, GENERIC_CHATS, BOND_LEVELS, bondLevel, COUNTER_REVIEWS, FAMILY_REVIEWS, randomLook, stepIngredient, BOSSES, BOSS_LINES, STARTER_RECIPES, UNLOCK_ORDER, funnyName,
  DAY_LENGTH, OPEN_HOUR, CLOSE_HOUR, STAFF_WAGE, SHIPPER_WAGE, RENT, START_MONEY,
  ingredientById, recipeById, weatherById, moneyShort, recipeNeeds, pick,
  type IngredientId, type RecipeId, type UpgradeId, type WeatherId, type StepId, type ChatTopic, type Look,
} from './data'
import { sfx, setDayFrac, setBossMode } from './audio'

const SAVE_KEY = 'coffee-tycoon-save-v1'

// ---------- Kiểu dữ liệu ----------
export interface Review {
  id: number
  name: string
  stars: number
  text: string
  recipe: RecipeId
  day: number
  src?: 'app' | 'quan'
}

export interface SaveData {
  version: 1
  day: number
  money: number
  reputation: number
  stock: Record<IngredientId, number>
  prices: Record<RecipeId, number>
  unlocked: RecipeId[]
  upgrades: Record<UpgradeId, number>
  weather: WeatherId
  forecast: WeatherId
  totals: { revenue: number; served: number; bestProfit: number }
  history: number[] // lợi nhuận các ngày gần nhất
  reviews: Review[] // đánh giá trên app (mới nhất ở đầu)
  suspended: number // số ly cà phê treo đang chờ trao
  impact: { given: number; donated: number; plastic: number; farmerKg: number }
  bonds: Record<string, number> // độ thân với khách quen (0..100)
  player: string // tên chủ quán (mỗi máy/trình duyệt một bản lưu riêng)
  playerId: string // mã ngẫu nhiên của bản lưu trên máy này
  introSeen: boolean // đã xem truyện mở đầu
  createdAt: number
}

export interface Customer {
  id: number
  face: string
  recipe: RecipeId
  patience: number
  maxPatience: number
  line?: string // câu đang nói
  needy?: number // index trong NEEDY – người nhận cà phê treo
  boss?: number // index trong BOSSES – khách boss khó tính
  regular?: string // id khách quen
  greeting: string // câu gọi món
  name?: string // tên vui của khách vãng lai
  look: Look // ngoại hình pixel
  chatted?: boolean
  chatBonus?: number // điểm thiện cảm từ tám chuyện (khách vãng lai)
}

export interface Talk {
  custId: number
  mode: 'greet' | 'chat' | 'answer'
  topic?: ChatTopic
  answer?: string
}

export interface Order {
  id: number
  name: string
  recipe: RecipeId
  timeLeft: number
  maxTime: number
  state: 'new' | 'ready' | 'delivering'
  perfect: boolean
}

export interface Shipper {
  name: string
  face: string
  orderId: number | null
  t: number
  total: number
}

export interface Brew {
  target: 'cust' | 'order'
  id: number
  recipe: RecipeId
  done: StepId[]
  mistakes: number
  layers: string[]
  cup: boolean
  ice: boolean
  mixed: boolean
  foam: boolean
  whip: boolean
  blended: boolean
  chunks: boolean
  busy: boolean
  shake: number
  action: StepId | null // thao tác đang chạy (để cảnh vẽ hoạt ảnh)
}

// ---------- Kênh sự kiện cho cảnh pixel ----------
export type GameEvent =
  | { type: 'step'; step: StepId }
  | { type: 'wrong' }
  | { type: 'served'; id: number; stars: number; text: string; price: number; tip: number; needy: boolean }
  | { type: 'angry'; id: number; line: string }
  | { type: 'orderPacked'; name: string }
  | { type: 'boss'; idx: number }
  | { type: 'bossEnd'; win: boolean }
const listeners = new Set<(e: GameEvent) => void>()
export const bus = {
  on(fn: (e: GameEvent) => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
  emit(e: GameEvent) { listeners.forEach((f) => f(e)) },
}

export interface DayStats {
  revenue: number
  spent: number
  served: number
  angry: number
  tooExpensive: number
  full: number
  repStart: number
  tips: number
  delivered: number
  cancelled: number
  starsSum: number
  given: number
  donated: number
  boss: 'win' | 'lose' | null // kết quả boss gần nhất
  bossLog: { idx: number; win: boolean }[] // tất cả boss trong ngày
  newRecipe: RecipeId | null // món mới mở khoá khi xong ngày
}

export interface DayReport extends DayStats {
  wages: number
  rent: number
  meltedIce: number
  profit: number
  repEnd: number
  bankrupt: boolean
}

export type Phase = 'prep' | 'open' | 'report'
export type Tab = 'shop' | 'stock' | 'menu' | 'app' | 'upgrade'

// ---------- Khởi tạo ----------
function randomWeather(): WeatherId {
  const r = Math.random()
  if (r < 0.35) return 'sunny'
  if (r < 0.55) return 'hot'
  if (r < 0.8) return 'cloudy'
  return 'rainy'
}

function newSave(): SaveData {
  return {
    version: 1,
    day: 1,
    money: START_MONEY,
    reputation: 30,
    stock: { cafe: 15, suaDac: 10, suaTuoi: 10, da: 30, ly: 30, tra: 10, dao: 10, kem: 0, matcha: 0, syrup: 10, kemTuoi: 0 },
    prices: Object.fromEntries(RECIPES.map((r) => [r.id, r.fairPrice])) as Record<RecipeId, number>,
    unlocked: [...STARTER_RECIPES],
    upgrades: { staff: 0, machine: 0, decor: 0, sign: 0, freezer: 0, shipper: 0, green: 0, farmer: 0 },
    weather: 'sunny',
    forecast: randomWeather(),
    totals: { revenue: 0, served: 0, bestProfit: 0 },
    history: [],
    reviews: [],
    suspended: 0,
    impact: { given: 0, donated: 0, plastic: 0, farmerKg: 0 },
    bonds: {},
    player: 'Yến',
    playerId: newPlayerId(),
    introSeen: false,
    createdAt: Date.now(),
  }
}

function newPlayerId() {
  try { return crypto.randomUUID().slice(0, 8) } catch { return Math.random().toString(36).slice(2, 10) }
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const data = JSON.parse(raw) as SaveData
      if (data.version === 1) {
        const base = newSave()
        return {
          ...base, ...data,
          stock: { ...base.stock, ...data.stock },
          prices: { ...base.prices, ...data.prices },
          upgrades: { ...base.upgrades, ...data.upgrades },
          // bản lưu cũ: bổ sung 5 món có sẵn + bỏ món không còn tồn tại
          unlocked: [...new Set([...STARTER_RECIPES, ...(data.unlocked ?? [])])].filter((id) => id in recipeById),
          impact: { ...base.impact, ...data.impact },
          reviews: data.reviews ?? [],
          bonds: data.bonds ?? {},
          player: !data.player || data.player === 'Mây' ? base.player : data.player,
          playerId: data.playerId || base.playerId,
        }
      }
    }
  } catch { /* bỏ qua lỗi lưu trữ */ }
  return newSave()
}

function emptyStats(rep: number): DayStats {
  return { revenue: 0, spent: 0, served: 0, angry: 0, tooExpensive: 0, full: 0, repStart: rep, tips: 0, delivered: 0, cancelled: 0, starsSum: 0, given: 0, donated: 0, boss: null, bossLog: [], newRecipe: null }
}

// ---------- State ----------
export const save = reactive<SaveData>(loadSave())

export const ui = reactive({
  tab: 'shop' as Tab,
  phase: 'prep' as Phase,
  view: 'counter' as 'counter' | 'app', // khi đang bán: tại quầy / đơn app
  time: 0, // giây mô phỏng trong ngày
  speed: 1,
  paused: false,
  queue: [] as Customer[],
  orders: [] as Order[],
  shippers: [] as Shipper[],
  staffProgress: [] as number[],
  staffJob: [] as (string | null)[], // nhân viên đang làm gì (hiện trên màn hình)
  brew: null as Brew | null,
  talk: null as Talk | null,
  bossAt: 0, // thời điểm boss kế tiếp tới (giây mô phỏng)
  bossPlan: [] as number[], // lịch boss trong ngày
  bossNext: 0, // boss thứ mấy sắp tới
  bossState: 'pending' as 'pending' | 'here' | 'done',
  present: null as null | { recipe: RecipeId; cup: Brew; target: 'cust' | 'order'; name: string },
  stats: emptyStats(save.reputation),
  report: null as DayReport | null,
  toasts: [] as { id: number; text: string; kind: 'info' | 'bad' | 'good' | 'say' | 'rap' | 'heart' }[],
  floats: [] as { id: number; text: string; kind: 'good' | 'bad'; x: number; y: number }[],
  resumed: false, // vừa khôi phục ca bán dở từ lần mở trước
  showIntro: false, // xem lại truyện mở đầu
})

let uid = 1
const nextId = () => uid++

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)) } catch { /* đầy bộ nhớ / chế độ ẩn danh */ }
  saveSession()
}

// ---------- Lưu phiên chơi dở (đang bán hoặc đang xem tổng kết) ----------
// Lưu chung save + trạng thái ngày bán trong 1 khoá để luôn khớp nhau. Ghi mỗi 2 giây khi đang bán
// và ngay khi người chơi rời app / đóng tab / tải lại trang. Mở lại sẽ vào đúng chỗ cũ (đang tạm dừng).
const SESSION_KEY = 'coffee-tycoon-session-v1'
const SESSION_UI = ['phase', 'tab', 'view', 'time', 'speed', 'queue', 'orders', 'shippers', 'staffProgress', 'brew', 'talk', 'bossAt', 'bossPlan', 'bossNext', 'bossState', 'stats', 'report', 'present'] as const
export function saveSession() {
  try {
    if (ui.phase !== 'open' && ui.phase !== 'report') { localStorage.removeItem(SESSION_KEY); return }
    const u: Record<string, unknown> = {}
    for (const k of SESSION_UI) u[k] = ui[k]
    localStorage.setItem(SESSION_KEY, JSON.stringify({ v: 1, at: Date.now(), uid, save, ui: u }))
  } catch { /* bỏ qua */ }
}
function readSession(): { at: number; uid: number; save: SaveData; ui: Record<string, any> } | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!s || s.v !== 1 || !s.save || !s.ui || (s.ui.phase !== 'open' && s.ui.phase !== 'report')) return null
    return s
  } catch { return null }
}
// Chỉ lưu khi không trong ngày bán (tránh lưu trạng thái dở dang)
watch(save, () => { if (ui.phase !== 'open') persist() }, { deep: true })

// ---------- Tiện ích ----------
export function vibrate(ms: number | number[] = 10) {
  try { if ('vibrate' in navigator) navigator.vibrate(ms) } catch { /* không hỗ trợ */ }
}

export function toast(text: string, kind: 'info' | 'bad' | 'good' | 'say' | 'rap' | 'heart' = 'info', ms = 2200) {
  text = noEmoji(text)
  const id = nextId()
  ui.toasts.push({ id, text, kind })
  if (ui.toasts.length > 3) ui.toasts.shift()
  setTimeout(() => {
    const i = ui.toasts.findIndex((t) => t.id === id)
    if (i >= 0) ui.toasts.splice(i, 1)
  }, ms)
}

function float(text: string, kind: 'good' | 'bad') {
  const id = nextId()
  ui.floats.push({ id, text: noEmoji(text), kind, x: 15 + Math.random() * 70, y: 8 + Math.random() * 30 })
  setTimeout(() => {
    const i = ui.floats.findIndex((f) => f.id === id)
    if (i >= 0) ui.floats.splice(i, 1)
  }, 1300)
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// ---------- Tính toán ----------
export const weather = computed(() => weatherById[save.weather])
export const forecast = computed(() => weatherById[save.forecast])
export const queueCapacity = computed(() => 4 + save.upgrades.decor)
export const staffServeTime = computed(() => 5 / (1 + 0.4 * save.upgrades.machine))
export const wages = computed(() => save.upgrades.staff * STAFF_WAGE + save.upgrades.shipper * SHIPPER_WAGE)
export const dailyCosts = computed(() => wages.value + RENT)
export const appRating = computed(() => {
  const r = save.reviews.slice(0, 30)
  return r.length ? r.reduce((a, x) => a + x.stars, 0) / r.length : 4
})

export const clock = computed(() => {
  const hours = OPEN_HOUR + (ui.time / DAY_LENGTH) * (CLOSE_HOUR - OPEN_HOUR)
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60 / 10) * 10
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

/** Giá khách thấy hợp lý (cà phê sạch → khách chịu trả thêm) */
export function fairPrice(id: RecipeId) {
  const r = recipeById[id]
  return r.fairPrice * (save.upgrades.farmer && r.coffee ? 1.15 : 1)
}

export function expectedCustomers() {
  return 13 * weather.value.customerMul * (0.4 + (save.reputation / 100) * 1.2)
    * (1 + 0.12 * save.upgrades.decor) * (1 + 0.2 * save.upgrades.sign) * (1 + 0.1 * save.upgrades.green) * (1 + 0.15 * save.upgrades.staff)
}

export function expectedOrders() {
  if (!save.upgrades.shipper) return 0
  return 5 * (0.5 + appRating.value / 8) * weather.value.deliveryMul * (1 + 0.35 * (save.upgrades.shipper - 1)) * (0.6 + save.reputation / 100)
}

export function recipeCost(id: RecipeId) {
  let c = 0
  for (const [ing, q] of Object.entries(recipeNeeds(recipeById[id]))) {
    const i = ingredientById[ing as IngredientId]
    c += (i.packPrice / i.packSize) * (q ?? 0)
  }
  return c
}

export function canMake(id: RecipeId) {
  return Object.entries(recipeNeeds(recipeById[id])).every(([ing, q]) => save.stock[ing as IngredientId] >= (q ?? 0))
}

export function missingFor(id: RecipeId): string[] {
  return Object.entries(recipeNeeds(recipeById[id]))
    .filter(([ing, q]) => save.stock[ing as IngredientId] < (q ?? 0))
    .map(([ing]) => ingredientById[ing as IngredientId].name)
}

/** Số ly có thể pha với kho hiện tại */
export function portionsLeft(id: RecipeId) {
  let n = Infinity
  for (const [ing, q] of Object.entries(recipeNeeds(recipeById[id]))) n = Math.min(n, Math.floor(save.stock[ing as IngredientId] / (q ?? 1)))
  return n === Infinity ? 0 : n
}

function consume(id: RecipeId) {
  for (const [ing, q] of Object.entries(recipeNeeds(recipeById[id]))) save.stock[ing as IngredientId] -= q ?? 0
}

// Đường cong lượng khách trong ngày (cao điểm sáng, trưa, chiều, tối)
function rushCurve(f: number) {
  const hour = OPEN_HOUR + f * (CLOSE_HOUR - OPEN_HOUR)
  const g = (c: number, w: number, a: number) => a * Math.exp(-((hour - c) ** 2) / (2 * w * w))
  return 0.45 + g(8, 0.9, 1.3) + g(12, 1, 0.9) + g(16.5, 1, 0.8) + g(19.5, 0.9, 0.7)
}
const CURVE_AVG = (() => { let s = 0; for (let i = 0; i < 200; i++) s += rushCurve(i / 200); return s / 200 })()

// ---------- Hành động: mua bán ----------
export function buyPack(id: IngredientId, packs = 1) {
  const ing = ingredientById[id]
  const cost = ing.packPrice * packs
  if (save.money < cost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return false }
  save.money -= cost
  save.stock[id] += ing.packSize * packs
  ui.stats.spent += cost
  sfx('buy')
  vibrate(8)
  return true
}

export function setPrice(id: RecipeId, price: number) {
  save.prices[id] = clamp(Math.round(price / 1000) * 1000, 5_000, 99_000)
}

export function unlockRecipe(id: RecipeId) {
  const r = recipeById[id]
  if (save.unlocked.includes(id)) return
  if (save.money < r.unlockCost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= r.unlockCost
  save.unlocked.push(id)
  toast(`Đã thêm ${r.name} vào menu!`, 'good')
  sfx('done')
  vibrate([10, 30, 10])
}

export function buyUpgrade(id: UpgradeId) {
  const u = UPGRADES.find((x) => x.id === id)!
  const lvl = save.upgrades[id]
  if (lvl >= u.costs.length) return
  const cost = u.costs[lvl]
  if (save.money < cost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= cost
  save.upgrades[id]++
  if (id === 'staff' && ui.phase === 'open') ui.staffProgress.push(0)
  if (id === 'shipper' && ui.phase === 'open') addShipper(save.upgrades.shipper - 1)
  toast(`${u.name} → cấp ${save.upgrades[id]}`, 'good')
  sfx(u.social ? 'heart' : 'done')
  vibrate([10, 30, 10])
}

function addShipper(i: number) {
  const s = SHIPPERS[i % SHIPPERS.length]
  ui.shippers.push({ name: s.name, face: s.face, orderId: null, t: 0, total: 0 })
}

// ---------- BOSS ----------
// Số boss mỗi ngày theo sao của quán: mới mở (2 ngày đầu) hoặc < 1.5★ → 1 boss; 2★ → 2 … 5★ → 5 boss/ngày
export const shopStars = computed(() => save.reputation / 20)
export const bossesToday = computed(() => {
  if (save.day <= 2) return 1
  return clamp(Math.round(shopStars.value), 1, 5)
})
export const bossIndex = (n = 0) => (save.day - 1 + n) % BOSSES.length
export const todayBoss = computed(() => BOSSES[bossIndex()])
export const todayBosses = computed(() => Array.from({ length: bossesToday.value }, (_, n) => bossIndex(n)))
function planBoss() {
  const n = bossesToday.value
  const span = 0.66 / n // chia ngày thành n khúc (12%→78% ngày), mỗi khúc 1 boss
  ui.bossPlan = Array.from({ length: n }, (_, i) => DAY_LENGTH * (0.12 + span * i + span * (0.2 + Math.random() * 0.6)))
  ui.bossNext = 0
  ui.bossAt = ui.bossPlan[0]
  ui.bossState = 'pending'
}
export const bossClock = computed(() => {
  const hours = OPEN_HOUR + (ui.bossAt / DAY_LENGTH) * (CLOSE_HOUR - OPEN_HOUR)
  return `${String(Math.floor(hours)).padStart(2, '0')}:${Math.floor(hours) === hours ? '00' : '30'}`
})

function spawnBoss() {
  ui.bossState = 'here'
  const idx = bossIndex(ui.bossNext)
  ui.bossNext++
  const B = BOSSES[idx]
  // boss gọi món khó (ngẫu nhiên trong 2 món nhiều bước nhất đã mở khoá)
  const hard = [...save.unlocked].sort((a, b) => recipeById[b].steps.length - recipeById[a].steps.length).slice(0, 2)
  const recipe = pick(hard)
  const steps = recipeById[recipe].steps.length
  const maxP = Math.max(24, 18 + steps * 4 - Math.min(8, (save.day - 1) * 0.6)) // boss: gắt hơn khách thường nhưng vẫn đủ thời gian pha
  const boss: Customer = {
    id: nextId(), face: '👑', recipe, patience: maxP, maxPatience: maxP, boss: idx, look: B.look,
    greeting: pick(B.lines?.greet ?? BOSS_LINES.greet).replace('{drink}', recipeById[recipe].name),
  }
  // boss chen ngang: đứng ngay sau khách đang ở quầy
  ui.queue.splice(Math.min(1, ui.queue.length), 0, boss)
  setBossMode(true)
  sfx('boss')
  vibrate([60, 40, 60, 40, 120])
  bus.emit({ type: 'boss', idx })
}

/** Xong 1 ngày: mở khoá 1 món mới + tặng nguyên liệu dùng thử */
function unlockNextRecipe(): RecipeId | null {
  const next = UNLOCK_ORDER.find((id) => !save.unlocked.includes(id))
  if (!next) return null
  save.unlocked.push(next)
  for (const ing of Object.keys(recipeNeeds(recipeById[next])) as IngredientId[]) {
    const pack = ingredientById[ing]
    if (save.stock[ing] < pack.packSize) save.stock[ing] += pack.packSize
  }
  return next
}

function endBoss(win: boolean, idx: number) {
  ui.stats.boss = win ? 'win' : 'lose'
  ui.stats.bossLog.push({ idx, win })
  if (ui.bossNext < ui.bossPlan.length) {
    ui.bossState = 'pending'
    ui.bossAt = Math.max(ui.bossPlan[ui.bossNext], ui.time + 8) // nghỉ thở ít nhất 1 chút
  } else ui.bossState = 'done'
  setTimeout(() => { if (ui.bossState !== 'here') setBossMode(false) }, 3200)
  sfx(win ? 'bossWin' : 'bossLose')
  bus.emit({ type: 'bossEnd', win })
}

// ---------- Mô phỏng ngày bán ----------
let raf = 0
let last = 0

export function openShop() {
  if (ui.phase !== 'prep') return
  if (!save.unlocked.some((r) => canMake(r))) {
    toast('Kho trống – hãy nhập nguyên liệu trước!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return
  }
  persist()
  ui.phase = 'open'
  ui.tab = 'shop'
  ui.view = 'counter'
  ui.time = 0
  ui.paused = false
  ui.queue = []
  ui.orders = []
  ui.brew = null
  ui.shippers = []
  for (let i = 0; i < save.upgrades.shipper; i++) addShipper(i)
  ui.staffProgress = Array(save.upgrades.staff).fill(0)
  ui.staffJob = []
  ui.stats = { ...emptyStats(save.reputation), spent: ui.stats.spent }
  planBoss()
  last = performance.now()
  raf = requestAnimationFrame(loop)
  sfx('bell')
  vibrate(15)
}

let lastSession = 0
function loop(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  if (!ui.paused) tick(dt * ui.speed)
  if (ui.phase === 'open' && now - lastSession > 2000) { lastSession = now; saveSession() }
  if (ui.phase === 'open') raf = requestAnimationFrame(loop)
}

/** Mở lại app: khôi phục đúng ca bán / màn tổng kết đang dở */
function restoreSession() {
  const s = readSession()
  if (!s) return
  Object.assign(save, s.save)
  for (const k of SESSION_UI) if (k in s.ui) (ui as any)[k] = s.ui[k]
  if (!Array.isArray(ui.bossPlan)) { ui.bossPlan = [ui.bossAt]; ui.bossNext = ui.bossState === 'pending' ? 0 : 1 }
  if (!Array.isArray(ui.stats.bossLog)) ui.stats.bossLog = []
  uid = Math.max(uid, s.uid || 1)
  if (ui.phase === 'report') { if (!ui.report) ui.phase = 'prep'; return }
  // đang bán: tạm dừng, chờ người chơi chạm để chơi tiếp
  ui.paused = true
  ui.resumed = true
  ui.tab = 'shop'
  ui.toasts = []
  ui.floats = []
  const b = ui.brew
  if (b) {
    b.busy = false
    b.action = null
    // ly đã pha xong nhưng chưa kịp giao -> giao lại khi chơi tiếp
    if (ui.present || b.done.length === recipeById[b.recipe].steps.length) { ui.present = null; pendingFinish = true }
  }
  ui.present = null
  setDayFrac(ui.time / DAY_LENGTH)
  if (ui.bossState === 'here') setBossMode(true)
  last = performance.now()
  raf = requestAnimationFrame(loop)
}
let pendingFinish = false
/** Chạm để chơi tiếp sau khi khôi phục */
export function resumeSession() {
  ui.resumed = false
  ui.paused = false
  last = performance.now()
  if (pendingFinish) { pendingFinish = false; if (ui.brew) { ui.brew.busy = true; setTimeout(finishBrew, 300) } }
}

const isBrewing = (target: 'cust' | 'order', id: number) => ui.brew?.target === target && ui.brew.id === id

function tick(dt: number) {
  ui.time += dt
  setDayFrac(ui.time / DAY_LENGTH)
  const curve = rushCurve(ui.time / DAY_LENGTH) / CURVE_AVG

  // Boss xuất hiện
  if (ui.bossState === 'pending' && ui.time >= ui.bossAt) spawnBoss()

  // Khách mới đến quán
  if (Math.random() < (expectedCustomers() / DAY_LENGTH) * curve * dt) spawnCustomer()
  // Đơn mới trên app
  if (Math.random() < (expectedOrders() / DAY_LENGTH) * curve * dt) spawnOrder()

  // Khách mất kiên nhẫn
  for (let i = ui.queue.length - 1; i >= 0; i--) {
    const c = ui.queue[i]
    // đồng hồ của boss chỉ chạy khi boss đã đứng ở quầy
    if (c.boss !== undefined && i !== 0) continue
    c.patience -= dt
    if (!c.line && c.needy === undefined && c.patience / c.maxPatience < 0.5) c.line = pick(c.boss !== undefined ? BOSSES[c.boss].lines?.taunt ?? BOSS_LINES.taunt : LINES.impatient)
    if (c.patience <= 0 && (!isBrewing('cust', c.id) || c.boss !== undefined)) {
      if (isBrewing('cust', c.id)) ui.brew = null
      ui.queue.splice(i, 1)
      if (c.boss !== undefined) {
        if (ui.talk?.custId === c.id) ui.talk = null
        // boss bỏ về: 1 sao xéo sắc
        const text = pick(BOSSES[c.boss].lines?.lose ?? BOSS_LINES.lose)
        save.reviews.unshift({ id: nextId(), name: BOSSES[c.boss].name, stars: 1, text, recipe: c.recipe, day: save.day, src: 'quan' })
        if (save.reviews.length > 40) save.reviews.length = 40
        ui.stats.angry++
        changeRep(-6)
        bus.emit({ type: 'angry', id: c.id, line: '⭐ ' + text })
        endBoss(false, c.boss)
        continue
      }
      if (ui.talk?.custId === c.id) ui.talk = null
      if (c.regular) addBond(c.regular, -8)
      if (c.needy !== undefined) {
        toast(`${c.face} Không sao đâu, mai ghé lại nha 🙂`, 'say')
        continue
      }
      ui.stats.angry++
      changeRep(-2)
      float('😡 Bỏ đi', 'bad')
      const line = pick(LINES.angry)
      if (ui.queue.length === 0 || i === 0) bus.emit({ type: 'angry', id: c.id, line })
      else toast(`${c.face} ${line}`, 'say', 2800)
      sfx('angry')
    }
  }

  // Đơn app hết hạn
  for (let i = ui.orders.length - 1; i >= 0; i--) {
    const o = ui.orders[i]
    o.timeLeft -= dt
    if (o.timeLeft <= 0 && o.state !== 'delivering' && !isBrewing('order', o.id)) {
      ui.orders.splice(i, 1)
      ui.stats.cancelled++
      changeRep(-0.5)
      const rv = addReview(o, 1)
      toast(`📱 ${o.name} huỷ đơn: “${rv.text}”`, 'bad', 2800)
      sfx('angry')
    }
  }

  // Nhân viên tự phục vụ: ưu tiên khách tại quán, sau đó đơn app
  // mỗi nhân viên nhận 1 việc khác nhau (không pha trùng khách)
  const custs = ui.queue.filter((c, i) => i > 0 && c.boss === undefined && !isBrewing('cust', c.id) && canMake(c.recipe))
  const ords = ui.orders.filter((o) => o.state === 'new' && !isBrewing('order', o.id) && canMake(o.recipe))
  for (let s = 0; s < ui.staffProgress.length; s++) {
    const cust = custs[s]
    const order = cust ? undefined : ords[s - custs.length]
    ui.staffJob[s] = cust ? `${recipeById[cust.recipe].name} cho ${cust.name ?? 'khách'}` : order ? `đơn app của ${order.name}` : null
    if (!cust && !order) { ui.staffProgress[s] = 0; continue }
    ui.staffProgress[s] += dt
    if (ui.staffProgress[s] >= staffServeTime.value) {
      ui.staffProgress[s] = 0
      if (cust) { consume(cust.recipe); completeWalkIn(cust, false, true); toast(`🧑‍🍳 Nhân viên pha xong ${recipeById[cust.recipe].name} cho ${cust.name ?? 'khách'}`, 'good', 1600) }
      else if (order) { consume(order.recipe); orderReady(order, save.upgrades.machine > 0 || Math.random() < 0.7, true); toast(`🧑‍🍳 Nhân viên đóng gói xong đơn app của ${order.name}`, 'good', 1600) }
    }
  }

  // Shipper nhận và giao đơn
  for (const sh of ui.shippers) {
    if (sh.orderId === null) {
      const o = ui.orders.find((x) => x.state === 'ready')
      if (!o) continue
      o.state = 'delivering'
      sh.orderId = o.id
      sh.t = 0
      sh.total = 9 + Math.random() * 6
      toast(`${sh.face} ${sh.name}: ${pick(RAPS)}`, 'rap', 3200)
      sfx('horn')
    } else {
      sh.t += dt
      if (sh.t >= sh.total) {
        const idx = ui.orders.findIndex((x) => x.id === sh.orderId)
        if (idx >= 0) deliver(ui.orders[idx], idx)
        sh.orderId = null
        sh.t = 0
      }
    }
  }

  if (ui.time >= DAY_LENGTH) endDay()
}

function chooseRecipe() {
  // khách chỉ gọi món quán còn đủ nguyên liệu (nếu hết sạch thì vẫn gọi để nhắc bạn nhập hàng)
  const avail = save.unlocked.filter((id) => canMake(id))
  const pool = avail.length ? avail : save.unlocked
  const options = pool.map((id) => {
    const r = recipeById[id]
    const ratio = save.prices[id] / fairPrice(id)
    const w = r.popularity * (1 + r.hotBonus * weather.value.hot) * Math.exp(-Math.max(0, ratio - 1) * 2.5)
    return { id, w, ratio }
  })
  const total = options.reduce((a, o) => a + o.w, 0)
  let r = Math.random() * total
  return options.find((o) => (r -= o.w) <= 0) ?? options[0]
}

function spawnCustomer() {
  if (ui.queue.length >= queueCapacity.value) {
    ui.stats.full++
    changeRep(-0.2)
    float(pick(LINES.full), 'bad')
    return
  }
  // Khách quen ghé
  const present = new Set(ui.queue.map((c) => c.regular))
  const regs = REGULARS.filter((r) => !present.has(r.id))
  if (regs.length && Math.random() < 0.28) {
    const r = pick(regs)
    const recipe = r.fav.find((f) => save.unlocked.includes(f)) ?? chooseRecipe().id
    if (save.prices[recipe] / fairPrice(recipe) < 1.5) {
      const lvl = bondLevel(save.bonds[r.id] ?? 0)
      const maxP = 68 * (1 + 0.1 * save.upgrades.decor) * (1 + lvl * 0.15)
      ui.queue.push({ id: nextId(), face: r.face, recipe, patience: maxP, maxPatience: maxP, regular: r.id, look: r.look,
        greeting: r.greet[lvl].replace('{drink}', recipeById[recipe].name) })
      sfx('bell')
      return
    }
  }
  const choice = chooseRecipe()
  // Giá cao → khách có thể không mua
  const buyChance = choice.ratio <= 1 ? 1 : clamp(1 - (choice.ratio - 1) * 1.6, 0, 1)
  if (Math.random() > buyChance) {
    ui.stats.tooExpensive++
    changeRep(-0.3)
    float(pick(LINES.tooExpensive), 'bad')
    return
  }
  const maxPatience = 58 * (1 + 0.1 * save.upgrades.decor)
  const look = randomLook()
  ui.queue.push({ id: nextId(), face: pick(CUSTOMER_FACES), recipe: choice.id, patience: maxPatience, maxPatience, look, name: funnyName(look),
    greeting: pick(GENERIC_ORDERS).replace('{drink}', recipeById[choice.id].name) })
  sfx('bell')
}

function spawnOrder() {
  const choice = chooseRecipe()
  if (choice.ratio > 1 && Math.random() > clamp(1 - (choice.ratio - 1) * 1.6, 0, 1)) return
  ui.orders.push({ id: nextId(), name: pick(ORDER_NAMES), recipe: choice.id, timeLeft: 80, maxTime: 80, state: 'new', perfect: false })
  sfx('bell')
  if (ui.view !== 'app') toast('📱 Có đơn mới trên app!', 'info', 1500)
}

function changeRep(d: number) {
  save.reputation = clamp(save.reputation + d, 0, 100)
}

function trackImpact(recipe: RecipeId) {
  if (save.upgrades.green) save.impact.plastic++
  if (save.upgrades.farmer && recipeById[recipe].coffee) save.impact.farmerKg += 0.02
}

/** Phục vụ khách tại quầy (nguyên liệu đã trừ trước khi gọi hàm này) */
function completeWalkIn(c: Customer, perfect: boolean, byStaff: boolean, mistakes = 0) {
  const idx = ui.queue.findIndex((x) => x.id === c.id)
  if (idx < 0) return
  ui.queue.splice(idx, 1)
  ui.stats.served++
  trackImpact(c.recipe)

  if (c.needy !== undefined) {
    save.suspended = Math.max(0, save.suspended - 1)
    save.impact.given++
    ui.stats.given++
    changeRep(2.5)
    float('💛 Ly treo', 'good')
    if (byStaff) toast(`${c.face} ${NEEDY[c.needy].who}: “${NEEDY[c.needy].thanks}”`, 'heart', 3000)
    else bus.emit({ type: 'served', id: c.id, stars: 5, text: NEEDY[c.needy].thanks, price: 0, tip: 0, needy: true })
    sfx('heart')
    return
  }

  if (c.boss !== undefined) {
    // phục vụ kịp giờ: 5 sao nhưng vẫn khó chịu, thưởng lớn
    if (ui.talk?.custId === c.id) ui.talk = null
    const B = BOSSES[c.boss]
    // đại gia keo kiệt: trả đúng giá còn đòi bớt, không tip
    const price = B.stingy ? Math.max(1_000, save.prices[c.recipe] - 2_000) : save.prices[c.recipe] * 2
    const tip = B.stingy ? 0 : 30_000
    save.money += price + tip
    ui.stats.revenue += price + tip
    ui.stats.tips += tip
    const text = pick(B.lines?.win ?? BOSS_LINES.win)
    save.reviews.unshift({ id: nextId(), name: BOSSES[c.boss].name, stars: 5, text, recipe: c.recipe, day: save.day, src: 'quan' })
    if (save.reviews.length > 40) save.reviews.length = 40
    changeRep(4)
    float(`👑 +${moneyShort(price + tip)}`, 'good')
    sfx('coin')
    bus.emit({ type: 'served', id: c.id, stars: 5, text, price, tip, needy: false })
    endBoss(true, c.boss)
    return
  }

  if (ui.talk?.custId === c.id) ui.talk = null
  const price = save.prices[c.recipe]
  let tip = 0
  if (perfect && !byStaff) tip = Math.max(2_000, Math.round((price * 0.15) / 1000) * 1000)
  if (c.regular) {
    tip += bondLevel(save.bonds[c.regular] ?? 0) * 3_000
    addBond(c.regular, byStaff ? 2 : perfect ? 6 : 3)
  }
  if ((c.chatBonus ?? 0) >= 5) tip += 2_000
  save.money += price + tip
  ui.stats.revenue += price + tip
  ui.stats.tips += tip
  const fast = c.patience / c.maxPatience > 0.6
  const cheap = price / fairPrice(c.recipe) < 0.85
  changeRep((fast ? 0.5 : 0.2) + (cheap ? 0.2 : 0) + (tip ? 0.3 : 0))
  float(`${byStaff ? '🧑‍🍳 ' : ''}+${moneyShort(price)}${tip ? ` 💝${moneyShort(tip)}` : ''}`, 'good')
  sfx('coin')
  if (!byStaff) {
    // Khách cầm ly lên uống và review tại quầy
    const ratio = c.patience / c.maxPatience
    const stars = mistakes === 0 ? (ratio > 0.4 ? 5 : 4) : mistakes === 1 ? 3 : 2
    const r = recipeById[c.recipe]
    const fam = FAMILY_REVIEWS[r.family]
    let text = pick(COUNTER_REVIEWS[stars])
    if (stars === 5 && Math.random() < 0.4) text = pick(fam.good)
    if (stars === 4 && Math.random() < 0.5) text = pick(fam.meh)
    text = text.replace('{drink}', r.name.toLowerCase())
    const name = c.regular ? REGULARS.find((x) => x.id === c.regular)!.name : c.name ?? pick(ORDER_NAMES)
    save.reviews.unshift({ id: nextId(), name, stars, text, recipe: c.recipe, day: save.day, src: 'quan' })
    if (save.reviews.length > 40) save.reviews.length = 40
    changeRep((stars - 3) * 0.3)
    bus.emit({ type: 'served', id: c.id, stars, text, price, tip, needy: false })
  }
}

function orderReady(o: Order, perfect: boolean, byStaff: boolean) {
  o.state = 'ready'
  o.perfect = perfect
  if (!byStaff) {
    sfx('done')
    toast(ui.shippers.some((s) => s.orderId === null) ? `📦 Đơn của ${o.name} xong, shipper tới lấy!` : `📦 Đơn của ${o.name} xong, chờ shipper rảnh`, 'good', 1800)
  }
}

function deliver(o: Order, idx: number) {
  ui.orders.splice(idx, 1)
  const r = o.timeLeft / o.maxTime
  let stars = r > 0.4 ? 5 : r > 0.18 ? 4 : r > 0 ? 3 : 2
  if (!o.perfect) stars--
  stars = clamp(stars, 1, 5)
  const price = save.prices[o.recipe]
  save.money += price
  ui.stats.revenue += price
  ui.stats.delivered++
  ui.stats.starsSum += stars
  trackImpact(o.recipe)
  changeRep((stars - 3) * 0.4)
  const review = addReview(o, stars)
  float(`+${moneyShort(price)} 🛵`, 'good')
  toast(`${'⭐'.repeat(stars)} ${o.name}: “${review.text}”`, stars >= 4 ? 'good' : 'bad', 2600)
  sfx('coin')
}

function addBond(id: string, d: number) {
  const before = save.bonds[id] ?? 0
  const after = clamp(before + d, 0, 100)
  save.bonds[id] = after
  if (bondLevel(after) > bondLevel(before)) {
    const r = REGULARS.find((x) => x.id === id)!
    const lv = BOND_LEVELS[bondLevel(after)]
    setTimeout(() => { toast(`${lv.icon} ${r.name} giờ là ${lv.name} của quán!`, 'heart', 2800); sfx('heart') }, 900)
  }
}

// ---------- Hội thoại với khách ----------
export function openTalk(custId: number) {
  if (ui.brew) return
  if (!ui.queue.some((c) => c.id === custId)) return
  ui.talk = { custId, mode: 'greet' }
  sfx('tap')
}

export function talkChat() {
  const t = ui.talk
  const c = t && ui.queue.find((x) => x.id === t.custId)
  if (!t || !c || c.chatted || c.boss !== undefined) return
  const reg = c.regular ? REGULARS.find((r) => r.id === c.regular) : undefined
  const topics = reg ? reg.chats : GENERIC_CHATS
  t.topic = pick(topics)
  t.mode = 'chat'
  c.chatted = true
  c.patience = Math.max(1, c.patience - 2) // tám chuyện tốn thời gian
  sfx('tap')
}

export function talkReply(i: number) {
  const t = ui.talk
  const c = t && ui.queue.find((x) => x.id === t.custId)
  if (!t || !c || !t.topic) return
  const r = t.topic.replies[i]
  t.answer = r.answer
  t.mode = 'answer'
  if (c.regular) addBond(c.regular, r.bond)
  else c.chatBonus = r.bond
  if (r.bond >= 5) { changeRep(0.3); sfx('heart'); c.patience = Math.min(c.maxPatience, c.patience + 4) }
  else if (r.bond < 0) sfx('angry')
  else sfx('tap')
}

export function closeTalk() { ui.talk = null }

export function brewFromTalk() {
  const t = ui.talk
  if (!t) return
  ui.talk = null
  startBrew('cust', t.custId)
}

function addReview(o: Order, stars: number) {
  const review: Review = { id: nextId(), name: o.name, stars, text: pick(REVIEWS[stars]), recipe: o.recipe, day: save.day, src: 'app' }
  save.reviews.unshift(review)
  if (save.reviews.length > 40) save.reviews.length = 40
  return review
}

// ---------- Pha chế từng bước (người chơi) ----------
/** Thời gian thao tác (máy espresso xịn hơn → chiết xuất nhanh hơn) */
export function stepMs(step: StepId) {
  const ms = STEPS[step].ms
  return step === 'chiet' ? Math.round(ms / (1 + 0.35 * save.upgrades.machine)) : ms
}

export function startBrew(target: 'cust' | 'order', id: number) {
  if (ui.brew || ui.present) return
  const recipe = target === 'cust' ? ui.queue.find((c) => c.id === id)?.recipe : ui.orders.find((o) => o.id === id && o.state === 'new')?.recipe
  if (!recipe) return
  if (!canMake(recipe)) {
    toast(`Hết ${missingFor(recipe).join(', ')}! Vào Kho nhập thêm nha`, 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return
  }
  sfx('tap')
  vibrate(8)
  ui.brew = { target, id, recipe, done: [], mistakes: 0, layers: [], cup: false, ice: false, mixed: false, foam: false, whip: false, blended: false, chunks: false, busy: false, shake: 0, action: null }
}

export function brewStep(step: StepId) {
  const b = ui.brew
  if (!b) { toast('Nhận order của khách trước nha ☕', 'info', 1400); sfx('wrong'); return }
  if (b.busy) return
  const steps = recipeById[b.recipe].steps
  const expected = steps[b.done.length]
  if (!expected) return
  if (step !== expected) {
    b.mistakes++
    b.shake++
    sfx('wrong')
    vibrate([25, 30, 25])
    bus.emit({ type: 'wrong' })
    return
  }
  const ing = stepIngredient(step)
  if (ing) {
    if (save.stock[ing] < 1) { toast(`Hết ${ingredientById[ing].name}!`, 'bad'); sfx('wrong'); return }
    save.stock[ing]--
  }
  const info = STEPS[step]
  sfx(info.sound)
  vibrate(6)
  b.busy = true
  b.action = step
  bus.emit({ type: 'step', step })
  // Áp hiệu ứng lên ly sau khi hoạt ảnh chạy xong
  const apply = () => {
    if (step === 'ly') b.cup = true
    else if (step === 'da') b.ice = true
    else if (step === 'khuay' || step === 'lac') b.mixed = true
    else if (step === 'xay') { b.blended = true; b.ice = false }
    else if (step === 'kem') b.foam = true
    else if (step === 'kemTuoi') b.whip = true
    else if (info.color) {
      b.layers.push(info.color)
      b.mixed = false
      if (step === 'dao') b.chunks = true
    }
    b.done.push(step)
    b.action = null
    b.busy = false
    if (b.done.length === steps.length) { b.busy = true; setTimeout(finishBrew, 350) }
  }
  setTimeout(() => { if (ui.brew === b) apply() }, info.kind === 'act' ? stepMs(step) : Math.min(info.ms, 260))
}

function finishBrew() {
  const b = ui.brew
  if (!b) return
  const name = b.target === 'cust' ? recipeById[b.recipe].name : `Đơn app · ${ui.orders.find((o) => o.id === b.id)?.name ?? ''}`
  ui.present = { recipe: b.recipe, cup: b, target: b.target, name }
  sfx('done')
  setTimeout(() => {
    ui.present = null
    ui.brew = null
    const perfect = b.mistakes === 0
    if (b.target === 'cust') {
      const c = ui.queue.find((x) => x.id === b.id)
      if (!c) { toast('Khách đã đi mất rồi 😢', 'bad'); return }
      completeWalkIn(c, perfect, false, b.mistakes)
    } else {
      const o = ui.orders.find((x) => x.id === b.id)
      if (!o) { toast('Đơn đã bị huỷ 😢', 'bad'); return }
      orderReady(o, perfect, false)
      bus.emit({ type: 'orderPacked', name: o.name })
    }
  }, 1500)
}

/** Đổ bỏ ly đang pha (nguyên liệu đã dùng sẽ mất) */
export function cancelBrew() {
  if (!ui.brew || ui.present) return
  ui.brew = null
  sfx('pour')
  toast('Đã đổ bỏ, pha lại nha', 'info', 1200)
}

export function togglePause() { if (ui.resumed) { resumeSession(); sfx('tap'); return } ui.paused = !ui.paused; sfx('tap') }
export function cycleSpeed() { ui.speed = ui.speed >= 3 ? 1 : ui.speed + 1; sfx('tap') }

function endDay() {
  cancelAnimationFrame(raf)
  ui.queue = []
  ui.orders = []
  ui.brew = null
  ui.talk = null
  setBossMode(false)
  if (ui.bossState === 'here') {
    ui.stats.boss = 'lose'
    ui.stats.bossLog.push({ idx: bossIndex(Math.max(0, ui.bossNext - 1)), win: false })
  }
  ui.bossState = 'done'
  // Xong 1 ngày → mở khoá món mới
  const nr = unlockNextRecipe()
  if (nr) ui.stats.newRecipe = nr
  const w = wages.value
  const rent = RENT
  save.money -= w + rent
  let meltedIce = 0
  if (!save.upgrades.freezer) { meltedIce = save.stock.da; save.stock.da = 0 }
  const s = ui.stats
  const profit = s.revenue - s.spent - w - rent
  ui.report = { ...s, wages: w, rent, meltedIce, profit, repEnd: save.reputation, bankrupt: save.money < 0 }
  save.totals.revenue += s.revenue
  save.totals.served += s.served + s.delivered
  save.totals.bestProfit = Math.max(save.totals.bestProfit, profit)
  save.history = [...save.history, profit].slice(-7)
  ui.phase = 'report'
  persist()
  sfx('dayEnd')
  vibrate([20, 60, 20])
}

export function nextDay() {
  if (ui.report?.bankrupt) { resetGame(); return }
  save.day++
  save.weather = save.forecast
  save.forecast = randomWeather()
  ui.report = null
  ui.toasts = []
  ui.stats = emptyStats(save.reputation)
  ui.time = 0
  ui.phase = 'prep'
  setDayFrac(0.1)
  sfx('tap')
  persist()
}

export function resetGame() {
  cancelAnimationFrame(raf)
  Object.assign(save, newSave())
  ui.phase = 'prep'
  ui.report = null
  ui.queue = []
  ui.orders = []
  ui.brew = null
  ui.time = 0
  ui.tab = 'shop'
  ui.stats = emptyStats(save.reputation)
  persist()
}

// Tự tạm dừng khi rời app
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ui.phase === 'open') ui.paused = true
    if (document.hidden) saveSession()
  })
  window.addEventListener('pagehide', saveSession)
  window.addEventListener('beforeunload', saveSession)
  restoreSession()
}

export { INGREDIENTS, RECIPES, UPGRADES, WEATHERS, DAY_LENGTH }
