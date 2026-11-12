import { noEmoji } from './text'
import { reactive, computed, watch } from 'vue'
import {
  INGREDIENTS, RECIPES, WEATHERS, CUSTOMER_FACES, UPGRADES, STEPS, LINES, REVIEWS, SHIPPERS, ORDER_NAMES, NEEDY, REGULARS, GENERIC_ORDERS, GENERIC_CHATS, BOND_LEVELS, bondLevel, COUNTER_REVIEWS, FAMILY_REVIEWS, randomLook, stepIngredient, GUEST_GROUPS, STARTER_RECIPES, UNLOCK_ORDER, funnyName, walkinPersona,
  DAY_LENGTH, OPEN_HOUR, CLOSE_HOUR, STAFF_WAGE, SHIPPER_WAGE, START_MONEY,
  ingredientById, recipeById, weatherById, moneyShort, recipeNeeds, pick,
  type IngredientId, type RecipeId, type UpgradeId, type WeatherId, type StepId, type ChatTopic, type Look,
} from './data'
import { voice, voiceTopic, type Gender, type Persona } from './voice'
import { sfx, comboSfx, setDayFrac, setReportMode, preloadReport, audio } from './audio'
import { isXmasSeason } from './season'
import { HAT_STYLES } from './pixel'
import type { FoodIng } from './kitchen'
import { hooks, type MetaDayResult } from './hooks'
import { PREMISES, rareById, newMeta, RIVALS, type MetaSave } from './metaData'

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
  meta: MetaSave // mặt bằng, đối thủ, nhiệm vụ, album, đồ cho Cáo…
  seating: Seating // khu khách ngồi: số bàn, loại bàn, nhân viên phục vụ
  story: StorySave // cốt truyện chính (story.ts)
  debt: number // tiền đang nợ (vay mẹ / Bà Tư khi hết tiền) – trả dần 30% lợi nhuận mỗi ngày
  loans: number // số lần đã vay
  tutDone: boolean // đã qua màn hướng dẫn ly đầu tiên
  events: Record<string, boolean> // sự kiện theo mùa đã mở (để chỉ tặng quà 1 lần)
  kitchen: { open: boolean; stock: Partial<Record<FoodIng, number>> } // khu bếp (kitchen.ts)
}

export interface StorySave {
  start: number // cốt truyện bắt đầu tính từ ngày này (chương có at = n diễn ra ngày start + n)
  seen: string[] // chương đã xem
  flags: Record<string, number> // lựa chọn đã chọn + điểm "lòng phố" (support)
  ending?: 'great' | 'good' | 'retry'
}

// ---------- KHU KHÁCH NGỒI ----------
export interface Seating { tables: number; level: number; waiter: number }
export interface Seat {
  state: 'free' | 'busy' | 'dirty'
  look?: Look
  recipe?: RecipeId
  t: number // busy: giây còn ngồi · dirty: giây đã bẩn
  tip: number // tiền boa khách để lại trên bàn (nhận khi dọn)
  taps: number // số lần đã lau (đủ CLEAN_TAPS là sạch)
}
export interface Waiter { seat: number | null; t: number; x: number } // seat = số thứ tự BÀN đang dọn
/** Số bàn tối đa theo mặt bằng: quầy nhỏ 4 · gác gỗ 6 · flagship 6 (mỗi bàn 2 ghế) */
export const MAX_TABLES = [4, 6, 6]
/** Giá mua thêm 2 bàn (theo số bàn đang có: 0→2 là dọn dẹp góc bỏ hoang, 2→4, 4→6) */
export const TABLE_COSTS: Record<number, number> = { 0: 150_000, 2: 400_000, 4: 1_200_000 }
export const TABLE_LEVELS = [
  { name: 'Bàn gỗ', tip: 1, sit: 1, desc: 'Ghế gỗ đơn giản' },
  { name: 'Ghế đệm', tip: 1.5, sit: 1.15, desc: 'Khách ngồi êm hơn: boa x1.5' },
  { name: 'Sofa nhung', tip: 2.2, sit: 1.3, desc: 'Khách mê ngồi lâu: boa x2.2, uy tín cao hơn' },
]
export const TABLE_LEVEL_COSTS = [700_000, 1_800_000] // nâng lên đệm, lên sofa
export const WAITER_COSTS = [300_000, 800_000] // phí thuê phục vụ thứ 1, 2
export const WAITER_WAGE = 50_000
export const CLEAN_TAPS = 3
export const SEATS_PER_TABLE = 2 // mỗi bàn 2 ghế: ui.seats[2*bàn] trái, [2*bàn+1] phải
const DIRTY_PENALTY_T = 25 // bàn bẩn quá lâu: trừ uy tín

export interface Customer {
  id: number
  face: string
  recipe: RecipeId
  patience: number
  maxPatience: number
  line?: string // câu đang nói
  needy?: number // index trong NEEDY – người nhận cà phê treo
  group?: string // id nhóm khách du lịch (guests.ts): han, trung, anh, phap, y, duc, nga, vn, vanphong, pho
  album?: string // khoá album riêng (khách cá tính: boss:i)
  regular?: string // id khách quen
  rare?: string // id khách hiếm (album)
  addon?: string // món mua kèm khách muốn (bánh / lưu niệm)
  addonDone?: boolean // đã trao món kèm
  greeting: string // câu gọi món
  name?: string // tên vui của khách vãng lai
  look: Look // ngoại hình pixel
  p?: Persona // xưng hô cố định của khách (voice.ts)
  chatted?: boolean
  chatBonus?: number // điểm thiện cảm từ tám chuyện (khách vãng lai)
  food?: string // món bếp gọi kèm (kitchen.ts) – đã có phiếu đơn trong bếp
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
  action: StepId | null
  actionAt?: number // thao tác đang chạy (để cảnh vẽ hoạt ảnh)
}

// ---------- Kênh sự kiện cho cảnh pixel ----------
export type GameEvent =
  | { type: 'step'; step: StepId }
  | { type: 'wrong' }
  | { type: 'served'; id: number; stars: number; text: string; price: number; tip: number; needy: boolean }
  | { type: 'angry'; id: number; line: string }
  | { type: 'orderPacked'; name: string }
  | { type: 'seatClean'; seat: number; tip: number; byWaiter: boolean }
  | { type: 'combo'; n: number; bonus: number }
  | { type: 'comboBreak'; n: number }
  | { type: 'rush'; on: boolean; ok?: boolean; bonus?: number; lost?: number }
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
  newRecipe: RecipeId | null // món mới mở khoá khi xong ngày
  goodsRev: number // tiền bán kèm bánh / lưu niệm
  goodsSold: number
  seated?: number // khách ngồi lại quán
  noSeat?: number // khách muốn ngồi nhưng hết bàn
  cleaned?: number // bàn đã dọn
  seatTips?: number // tiền boa ở khu ngồi
  comboBest?: number // chuỗi pha chuẩn dài nhất trong ngày
  comboBonus?: number // tiền thưởng combo
  rushWon?: number // số giờ cao điểm vượt qua không mất khách
  rushBonus?: number // tiền thưởng giờ cao điểm
  foodRev?: number // doanh thu khu bếp (gồm tip + combo)
  foodSold?: number
  foodLost?: number // phiếu bếp bị huỷ vì chờ lâu
}

/** Người cho vay khi quán hết tiền: mẹ (không lấy lãi, 2 lần đầu) → Bà Tư chủ nhà (lãi 10%) */
export interface LoanOffer { who: 'me' | 'tu'; amount: number; owe: number }

export interface DayReport extends DayStats {
  wages: number
  rent: number
  meltedIce: number
  profit: number
  repEnd: number
  bankrupt: boolean
  loan?: LoanOffer | null // hết tiền: được vay để mở cửa tiếp (không còn phá sản mất trắng)
  debtPaid?: number // tiền nợ đã trả hôm nay
  meta?: MetaDayResult | null
}

export type Phase = 'prep' | 'open' | 'report'
export type Tab = 'shop' | 'stock' | 'menu' | 'compete' | 'app' | 'upgrade'

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
    stock: { cafe: 15, suaDac: 10, suaTuoi: 10, da: 30, ly: 30, tra: 10, dao: 10, kem: 0, matcha: 0, syrup: 10, kemTuoi: 0, dua: 0, trung: 0, cacao: 0 },
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
    meta: newMeta(),
    seating: { tables: 0, level: 0, waiter: 0 }, // khu ngồi bỏ hoang, phải dọn dẹp mới có bàn
    story: { start: 1, seen: [], flags: {} },
    debt: 0,
    loans: 0,
    tutDone: false,
    events: {},
    kitchen: { open: false, stock: {} },
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
      if (data.version === 1) return migrateSave(data)
    }
  } catch { /* bỏ qua lỗi lưu trữ */ }
  return newSave()
}

const MONEY_BAK = 'coffee-tycoon-money-bak'
/** tiền hợp lệ gần nhất (lưu riêng) – dùng khi bản lưu chính bị hỏng số tiền */
function moneyBackup(): number | null {
  try { const b = JSON.parse(localStorage.getItem(MONEY_BAK) || 'null'); return typeof b?.money === 'number' && Number.isFinite(b.money) ? b.money : null } catch { return null }
}
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
/** Chuẩn hoá bản lưu (bản cũ / bản lưu ca bán dở): bù các trường mới, sửa số hỏng (NaN → null khi lưu JSON) */
function migrateSave(data: SaveData): SaveData {
  const base = newSave()
  const prices = { ...base.prices }
  for (const [id, p] of Object.entries(data.prices ?? {})) if (id in prices) prices[id as RecipeId] = num(p, prices[id as RecipeId])
  const stock = { ...base.stock }
  for (const [id, n] of Object.entries(data.stock ?? {})) if (id in stock) stock[id as IngredientId] = num(n, 0)
  return {
          ...base, ...data,
          money: num(data.money, moneyBackup() ?? base.money),
          debt: num(data.debt, 0),
          totals: { revenue: num(data.totals?.revenue, 0), served: num(data.totals?.served, 0), bestProfit: num(data.totals?.bestProfit, 0) },
          stock,
          prices,
          upgrades: { ...base.upgrades, ...data.upgrades },
          // bản lưu cũ: bổ sung 5 món có sẵn + bỏ món không còn tồn tại
          unlocked: [...new Set([...STARTER_RECIPES, ...(data.unlocked ?? [])])].filter((id) => id in recipeById),
          impact: { ...base.impact, ...data.impact },
          reviews: data.reviews ?? [],
          bonds: data.bonds ?? {},
          player: !data.player || data.player === 'Mây' ? base.player : data.player,
          playerId: data.playerId || base.playerId,
          meta: mergeMeta(base.meta, data.meta),
          seating: { ...base.seating, ...data.seating, tables: Math.min(6, data.seating?.tables ?? base.seating.tables) },
          // bản lưu cũ chưa có cốt truyện: bắt đầu từ hôm nay (chương 1 hiện ngay)
          // bản lưu cũ đã bán được rồi: bỏ qua hướng dẫn
          tutDone: data.tutDone ?? ((data.totals?.served ?? 0) > 0 || (data.day ?? 1) > 1),
          history: (data.history ?? []).map((v) => num(v, 0)),
          events: { ...data.events },
          kitchen: { open: !!data.kitchen?.open, stock: { ...data.kitchen?.stock } },
          story: data.story ? { ...base.story, ...data.story, flags: { ...data.story.flags } } : { start: Math.max(0, (data.day ?? 1) - 1), seen: [], flags: {} },
  }
}

function mergeMeta(base: MetaSave, m?: Partial<MetaSave>): MetaSave {
  if (!m) return base
  const rivals = RIVALS.map((r) => m.rivals?.find((x) => x.id === r.id) ?? base.rivals.find((x) => x.id === r.id)!)
  return {
    ...base, ...m,
    stats: { ...base.stats, ...m.stats },
    week: { ...base.week, ...m.week },
    quests: m.quests ?? base.quests,
    online: { ...base.online, ...m.online },
    wear: { ...m.wear },
    rivals,
  }
}

function emptyStats(rep: number): DayStats {
  return { revenue: 0, spent: 0, served: 0, angry: 0, tooExpensive: 0, full: 0, repStart: rep, tips: 0, delivered: 0, cancelled: 0, starsSum: 0, given: 0, donated: 0, newRecipe: null, goodsRev: 0, goodsSold: 0, seated: 0, noSeat: 0, cleaned: 0, seatTips: 0 }
}

// ---------- State ----------
export const save = reactive<SaveData>(loadSave())
compensateMoneyBug(() => JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'))
/** Bồi thường 1 lần cho bản lưu từng dính lỗi tiền NaN (bản 11/2026): dấu hiệu là lịch sử lợi nhuận có ngày bị hỏng (null).
 *  Không biết chính xác số tiền đã mất → trả lại theo lợi nhuận các ngày gần nhất, tối thiểu bằng tiền khởi nghiệp. */
function compensateMoneyBug(readRaw: () => Partial<SaveData> | null) {
  try {
    if (save.events.moneyFix2026) return
    const raw = readRaw()
    const hit = !!raw && (raw.money === null || (raw.history ?? []).some((v) => v === null) || raw.totals?.revenue === null)
    save.events.moneyFix2026 = true
    if (!hit) return
    const earned = (raw!.history ?? []).reduce<number>((a, v) => a + (typeof v === 'number' && v > 0 ? v : 0), 0)
    const target = Math.max(START_MONEY, Math.round(earned / 1000) * 1000)
    if (save.money >= target) return
    const gift = target - save.money
    save.money = target
    setTimeout(() => toast(`Xin lỗi vì lỗi mất tiền! Quán được bồi thường ${moneyShort(gift)}`, 'good', 5000), 1500)
  } catch { /* bỏ qua */ }
}

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
  closing: false, // đã tới giờ đóng cửa: không nhận khách/đơn mới, làm nốt việc đang dở rồi tổng kết
  staffJob: [] as (string | null)[], // nhân viên đang làm gì (hiện trên màn hình)
  staffRecipe: [] as (RecipeId | null)[], // món nhân viên đang pha (cảnh quầy diễn từng bước theo tiến độ)
  seats: [] as Seat[], // bàn ở khu khách ngồi
  waiters: [] as Waiter[], // nhân viên phục vụ đang làm gì
  page: 0, // đang xem: 0 = quầy, 1 = khu khách ngồi
  brew: null as Brew | null,
  talk: null as Talk | null,
  present: null as null | { recipe: RecipeId; cup: Brew; target: 'cust' | 'order'; name: string },
  stats: emptyStats(save.reputation),
  report: null as DayReport | null,
  toasts: [] as { id: number; text: string; kind: 'info' | 'bad' | 'good' | 'say' | 'rap' | 'heart' }[],
  floats: [] as { id: number; text: string; kind: 'good' | 'bad'; x: number; y: number }[],
  combo: 0, // chuỗi ly pha chuẩn liên tiếp (tự tay pha)
  rush: null as null | { done: number; lost: number }, // đang giờ cao điểm: mốc số khách lúc bắt đầu
  resumed: false, // vừa khôi phục ca bán dở từ lần mở trước
  showIntro: false, // xem lại truyện mở đầu
})

let uid = 1
const nextId = () => uid++

export function persist() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    if (Number.isFinite(save.money)) localStorage.setItem(MONEY_BAK, JSON.stringify({ money: save.money, day: save.day }))
  } catch { /* đầy bộ nhớ / chế độ ẩn danh */ }
  saveSession()
}

// ---------- Lưu phiên chơi dở (đang bán hoặc đang xem tổng kết) ----------
// Lưu chung save + trạng thái ngày bán trong 1 khoá để luôn khớp nhau. Ghi mỗi 2 giây khi đang bán
// và ngay khi người chơi rời app / đóng tab / tải lại trang. Mở lại sẽ vào đúng chỗ cũ (đang tạm dừng).
const SESSION_KEY = 'coffee-tycoon-session-v1'
const SESSION_UI = ['phase', 'tab', 'view', 'time', 'speed', 'queue', 'orders', 'shippers', 'staffProgress', 'brew', 'talk', 'stats', 'report', 'present', 'seats', 'waiters', 'combo', 'rush', 'closing'] as const
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
// lưới an toàn: tiền không bao giờ được thành NaN/Infinity (sẽ thành null → 0đ khi lưu)
watch(() => save.money, (v, old) => {
  if (Number.isFinite(v)) return
  console.error('[money] giá trị hỏng, khôi phục', v, old)
  save.money = Number.isFinite(old) ? old : 0
}, { flush: 'sync' })

// ---------- Tiện ích ----------
export function vibrate(ms: number | number[] = 10) {
  try { if ('vibrate' in navigator) navigator.vibrate(ms) } catch { /* không hỗ trợ */ }
}

export function toast(text: string, kind: 'info' | 'bad' | 'good' | 'say' | 'rap' | 'heart' = 'info', ms = 2200) {
  text = noEmoji(text)
  const id = nextId()
  // chỉ hiện 1 thông báo một lúc (cái mới thay cái cũ) cho đỡ rối màn hình
  ui.toasts.splice(0, ui.toasts.length, { id, text, kind })
  setTimeout(() => {
    const i = ui.toasts.findIndex((t) => t.id === id)
    if (i >= 0) ui.toasts.splice(i, 1)
  }, ms)
}

export function float(text: string, kind: 'good' | 'bad') {
  const id = nextId()
  ui.floats.push({ id, text: noEmoji(text), kind, x: 15 + Math.random() * 70, y: 8 + Math.random() * 30 })
  setTimeout(() => {
    const i = ui.floats.findIndex((f) => f.id === id)
    if (i >= 0) ui.floats.splice(i, 1)
  }, 1300)
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// ---------- COMBO: tự tay pha chuẩn liên tiếp → thưởng thêm % giá ly ----------
/** % thưởng theo độ dài chuỗi: x2 = 6% … x11 trở lên = 60% */
export const comboRate = (n: number) => (n < 2 ? 0 : Math.min(0.6, 0.06 * (n - 1)))
export function comboUp(price: number): number {
  ui.combo++
  ui.stats.comboBest = Math.max(ui.stats.comboBest ?? 0, ui.combo)
  const bonus = Math.round((price * comboRate(ui.combo)) / 1000) * 1000
  if (ui.combo >= 2) { comboSfx(ui.combo); bus.emit({ type: 'combo', n: ui.combo, bonus }) }
  return bonus
}
export function breakCombo() {
  if (ui.combo >= 3) { sfx('comboBreak'); bus.emit({ type: 'comboBreak', n: ui.combo }) }
  ui.combo = 0
}

// ---------- HƯỚNG DẪN ly đầu tiên: khách đầu tiên đứng chờ mãi, các nút cần bấm phát sáng ----------
export const tutOn = computed(() => !save.tutDone && ui.phase === 'open')
function finishTutorial() {
  if (save.tutDone) return
  save.tutDone = true
  toast('Tuyệt! Ly đầu tiên hoàn hảo. Pha chuẩn liên tiếp sẽ ăn COMBO thưởng thêm tiền đó!', 'good', 4200)
}

// ---------- SỰ KIỆN THEO MÙA (season.ts) ----------
const XMAS_RECIPES = RECIPES.filter((r) => r.season === 'xmas').map((r) => r.id)
/** Bật món Noel trong mùa (tặng nguyên liệu 1 lần), hết mùa gỡ khỏi menu */
export function syncSeason() {
  if (isXmasSeason()) {
    for (const id of XMAS_RECIPES) {
      if (!save.unlocked.includes(id)) save.unlocked.push(id)
      if (!Number.isFinite(save.prices[id])) save.prices[id] = recipeById[id].fairPrice
    }
    if (!save.events.xmas2026) {
      save.events.xmas2026 = true
      for (const ing of ['cacao', 'kemTuoi', 'suaTuoi', 'syrup'] as IngredientId[]) save.stock[ing] += ingredientById[ing].packSize
    }
  } else if (save.unlocked.some((id) => XMAS_RECIPES.includes(id))) {
    save.unlocked = save.unlocked.filter((id) => !XMAS_RECIPES.includes(id))
  }
}
syncSeason()

// ---------- Tính toán ----------
export const weather = computed(() => weatherById[save.weather])
export const forecast = computed(() => weatherById[save.forecast])
export const premise = computed(() => PREMISES[save.meta.premise] ?? PREMISES[0])
export const rentToday = computed(() => premise.value.rent)
export const queueCapacity = computed(() => 4 + save.upgrades.decor + premise.value.slots)
/** có ≥1 nhân viên pha chế → nhân viên nhận & pha mọi đơn nước, bạn không nhận đơn nữa */
export const staffAll = computed(() => save.upgrades.staff >= 1)
export const staffServeTime = computed(() => 5 / (1 + 0.4 * save.upgrades.machine))
export const wages = computed(() => save.upgrades.staff * STAFF_WAGE + save.upgrades.shipper * SHIPPER_WAGE + save.seating.waiter * WAITER_WAGE)
export const maxTables = computed(() => MAX_TABLES[save.meta.premise] ?? 4)
export const dirtySeats = computed(() => { let n = 0; for (let tb = 0; tb * 2 < ui.seats.length; tb++) if (ui.seats[tb * 2]?.state === 'dirty' || ui.seats[tb * 2 + 1]?.state === 'dirty') n++; return n }) // số BÀN bẩn
export const dailyCosts = computed(() => wages.value + rentToday.value)
export const appRating = computed(() => {
  const r = save.reviews.slice(0, 30)
  return r.length ? r.reduce((a, x) => a + x.stars, 0) / r.length : 4
})

export const clock = computed(() => {
  const hours = OPEN_HOUR + Math.min(1, ui.time / DAY_LENGTH) * (CLOSE_HOUR - OPEN_HOUR)
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60 / 10) * 10
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

/** Giá khách thấy hợp lý (cà phê sạch → khách chịu trả thêm) */
export function fairPrice(id: RecipeId) {
  const r = recipeById[id]
  return r.fairPrice * (save.upgrades.farmer && r.coffee ? 1.15 : 1) * premise.value.priceMul
}

export function expectedCustomers() {
  return 13 * weather.value.customerMul * (0.4 + (save.reputation / 100) * 1.2)
    * (1 + 0.12 * save.upgrades.decor) * (1 + 0.2 * save.upgrades.sign) * (1 + 0.1 * save.upgrades.green) * (1 + 0.15 * save.upgrades.staff)
    * premise.value.customerMul * (hooks.customerMul?.() ?? 1)
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

// ---------- Khách du lịch theo nhóm (guests.ts) ----------
export const shopStars = computed(() => save.reputation / 20)
/** Đoàn khách nổi bật hôm nay (đổi mỗi ngày): ghé quán nhiều gấp 3 */
export const featuredGroup = computed(() => {
  const pool = GUEST_GROUPS.filter((g) => g.id !== 'pho')
  return pool[(save.day * 5 + 2) % pool.length]
})
const groupById = (id?: string) => (id ? GUEST_GROUPS.find((g) => g.id === id) : undefined)
function pickGuestGroup() {
  const f = featuredGroup.value
  const w = (g: (typeof GUEST_GROUPS)[number]) => g.weight * (g === f ? 3 : 1)
  let r = Math.random() * GUEST_GROUPS.reduce((a, g) => a + w(g), 0)
  return GUEST_GROUPS.find((g) => (r -= w(g)) <= 0) ?? GUEST_GROUPS[0]
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
  ui.closing = false
  ui.paused = false
  ui.queue = []
  ui.orders = []
  ui.brew = null
  ui.shippers = []
  for (let i = 0; i < save.upgrades.shipper; i++) addShipper(i)
  ui.staffProgress = Array(save.upgrades.staff).fill(0)
  ui.staffJob = []
  ui.staffRecipe = []
  ui.seats = Array.from({ length: save.seating.tables * SEATS_PER_TABLE }, newSeat)
  ui.waiters = Array.from({ length: save.seating.waiter }, (_, i) => ({ seat: null, t: 0, x: 100 - i * 14 }))
  ui.page = 0
  ui.combo = 0
  ui.rush = null
  hooks.kitchenReset?.()
  syncSeason()
  ui.stats = { ...emptyStats(save.reputation), spent: ui.stats.spent }
  hooks.dayStart?.()
  preloadReport()
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
  Object.assign(save, migrateSave(s.save))
  compensateMoneyBug(() => s.save) // ca bán lưu dở từ bản lỗi cũng được bồi thường
  for (const k of SESSION_UI) if (k in s.ui) (ui as any)[k] = s.ui[k]
  // số liệu ca bán từ bản cũ: bù trường thiếu + sửa số hỏng để không cộng ra NaN
  const st = { ...emptyStats(save.reputation), ...(s.ui.stats ?? {}) } as DayStats
  for (const [k, v] of Object.entries(st)) if (v === null && k !== 'newRecipe') (st as any)[k] = 0
  ui.stats = st
  ui.combo = num(ui.combo, 0)
  syncSeason()
  if (!Array.isArray(ui.seats) || ui.seats.length !== save.seating.tables * SEATS_PER_TABLE) ui.seats = Array.from({ length: save.seating.tables * SEATS_PER_TABLE }, newSeat)
  if (ui.waiters?.some((w) => w.seat !== null && w.seat >= save.seating.tables)) ui.waiters.forEach((w) => { w.seat = null; w.t = 0 })
  if (!Array.isArray(ui.waiters)) ui.waiters = []
  uid = Math.max(uid, s.uid || 1)
  if (ui.phase === 'report') { if (!ui.report) ui.phase = 'prep'; else setReportMode(true); return }
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

// ---------- GIỜ CAO ĐIỂM: khách dồn dập; qua được mà không ai bỏ về → thưởng tiền + uy tín ----------
const RUSH_ON = 1.22, RUSH_OFF = 1.05
const doneCount = () => ui.stats.served + ui.stats.delivered
const lostCount = () => ui.stats.angry + ui.stats.cancelled
function tickRush(raw: number) {
  if (!ui.rush && raw > RUSH_ON && ui.time < DAY_LENGTH * 0.95) {
    ui.rush = { done: doneCount(), lost: lostCount() }
    sfx('rush')
    bus.emit({ type: 'rush', on: true })
  } else if (ui.rush && raw < RUSH_OFF) endRush()
}
function endRush() {
  const r = ui.rush
  if (!r) return
  ui.rush = null
  const done = doneCount() - r.done, lost = lostCount() - r.lost
  if (lost === 0 && done >= 2) {
    const bonus = 20_000 + done * 8_000
    save.money += bonus
    ui.stats.revenue += bonus
    ui.stats.rushBonus = (ui.stats.rushBonus ?? 0) + bonus
    ui.stats.rushWon = (ui.stats.rushWon ?? 0) + 1
    changeRep(1.5)
    sfx('heart')
    bus.emit({ type: 'rush', on: false, ok: true, bonus })
  } else bus.emit({ type: 'rush', on: false, ok: false, lost })
}

function tick(dt: number) {
  ui.time += dt
  setDayFrac(Math.min(1, ui.time / DAY_LENGTH))
  const raw = rushCurve(Math.min(1, ui.time / DAY_LENGTH))
  const curve = raw / CURVE_AVG
  const tut = tutOn.value

  if (tut) {
    // hướng dẫn: chỉ 1 khách, tới ngay, đứng chờ không giận
    if (!ui.queue.length && ui.time > 1.2) spawnCustomer()
  } else if (!ui.closing) {
    // Khách mới đến quán
    if (Math.random() < (expectedCustomers() / DAY_LENGTH) * curve * dt) spawnCustomer()
    // Đơn mới trên app
    if (Math.random() < (expectedOrders() / DAY_LENGTH) * curve * dt) spawnOrder()
    if (save.day >= 2) tickRush(raw) // ngày đầu cho người mới làm quen, chưa có giờ cao điểm
  }

  // Khách mất kiên nhẫn
  for (let i = ui.queue.length - 1; i >= 0; i--) {
    const c = ui.queue[i]
    if (tut || ui.closing) continue // đã đóng cửa: khách còn lại đứng chờ, không giận
    c.patience -= dt
    if (!c.line && c.needy === undefined && c.patience / c.maxPatience < 0.5) c.line = voice(pick(groupById(c.group)?.impatient ?? LINES.impatient), c.p)
    if (c.patience <= 0 && !isBrewing('cust', c.id)) {
      ui.queue.splice(i, 1)
      if (ui.talk?.custId === c.id) ui.talk = null
      if (c.regular) addBond(c.regular, -8)
      if (c.needy !== undefined) {
        toast(`${c.face} Không sao đâu, mai ghé lại nha 🙂`, 'say')
        continue
      }
      ui.stats.angry++
      breakCombo()
      changeRep(-2)
      float('😡 Bỏ đi', 'bad')
      const line = voice(pick(LINES.angry), c.p)
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
      breakCombo()
      changeRep(-0.5)
      const rv = addReview(o, 1)
      toast(`📱 ${o.name} huỷ đơn: “${rv.text}”`, 'bad', 2800)
      sfx('angry')
    }
  }

  // Nhân viên tự phục vụ: ưu tiên khách tại quán, sau đó đơn app
  // mỗi nhân viên nhận 1 việc khác nhau (không pha trùng khách)
  // có nhân viên pha chế: họ lo hết quầy nước (cả khách đứng đầu) – bạn rảnh tay vào bếp
  const custs = ui.queue.filter((c, i) => (i > 0 || staffAll.value) && !isBrewing('cust', c.id) && canMake(c.recipe))
  const ords = ui.orders.filter((o) => o.state === 'new' && !isBrewing('order', o.id) && canMake(o.recipe))
  for (let s = 0; s < ui.staffProgress.length; s++) {
    const cust = custs[s]
    const order = cust ? undefined : ords[s - custs.length]
    ui.staffJob[s] = cust ? `${recipeById[cust.recipe].name} cho ${cust.name ?? 'khách'}` : order ? `đơn app của ${order.name}` : null
    ui.staffRecipe[s] = cust?.recipe ?? order?.recipe ?? null
    // đã đóng cửa: nhân viên chỉ làm nốt ly đang pha dở, không nhận ly mới
    if (!cust && !order || (ui.closing && !(ui.staffProgress[s] > 0))) { ui.staffProgress[s] = 0; ui.staffJob[s] = null; ui.staffRecipe[s] = null; continue }
    ui.staffProgress[s] += dt
    if (ui.staffProgress[s] >= staffServeTime.value) {
      ui.staffProgress[s] = 0
      if (cust) { consume(cust.recipe); completeWalkIn(cust, false, true) }
      else if (order) { consume(order.recipe); orderReady(order, save.upgrades.machine > 0 || Math.random() < 0.7, true) }
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
      sfx('horn') // (bỏ thông báo rap của shipper cho đỡ rối màn hình)
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

  tickSeating(dt)
  hooks.kitchenTick?.(dt)

  // Hết giờ: đóng cửa (không nhận khách / đơn mới) nhưng LÀM NỐT việc đang dở – ly đang pha, ly đang trao,
  // món bếp đang nấu, ly nhân viên đang pha – xong hết mới tổng kết. Tối đa thêm 60 giây phòng kẹt.
  if (ui.time >= DAY_LENGTH) {
    if (!ui.closing) {
      ui.closing = true
      ui.rush = null
      if (workLeft()) toast('Tới giờ đóng cửa – làm nốt đơn đang dở rồi tổng kết nhé', 'info', 3200)
    }
    if (!workLeft() || ui.time >= DAY_LENGTH + 60) endDay()
  }
}
/** còn việc đang làm dở không (để chờ trước khi tổng kết ngày) */
function workLeft() {
  return !!ui.brew || !!ui.present || pendingFinish || !!hooks.kitchenBusy?.() || ui.staffProgress.some((p) => p > 0)
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
  // khách có thể muốn mua kèm bánh / đồ lưu niệm (bạn bấm ở kệ hàng để trao)
  const push = (c: Customer) => {
    const a = hooks.pickAddon?.(); if (a) c.addon = a
    // mùa Noel: ~40% khách đội mũ Noel (copy ngoại hình, không sửa ngoại hình gốc của nhân vật)
    if (isXmasSeason() && Math.random() < 0.4 && !HAT_STYLES.includes(c.look.style)) c.look = { ...c.look, acc: [...(c.look.acc ?? []), 'santa'] }
    // khu bếp: gọi kèm món ăn → phiếu đơn vào bếp
    if (c.needy === undefined) { const f = hooks.foodFor?.(c.name ?? REGULARS.find((r) => r.id === c.regular)?.name ?? 'Khách'); if (f) c.food = f }
    ui.queue.push(c)
  }
  if (ui.queue.length >= queueCapacity.value) {
    ui.stats.full++
    changeRep(-0.2)
    float(pick(LINES.full), 'bad')
    return
  }
  // Khách hiếm (album) – chỉ ghé khi đủ điều kiện thời tiết / giờ
  const rareId = ui.queue.some((c) => c.rare) ? null : hooks.rareSpawn?.(ui.time / DAY_LENGTH)
  if (rareId) {
    const R = rareById[rareId]
    const recipe = chooseRecipe().id
    const maxP = 75 * (1 + 0.1 * save.upgrades.decor)
    push({ id: nextId(), face: '✨', recipe, patience: maxP, maxPatience: maxP, rare: R.id, name: R.name, look: R.look, p: R.p,
      greeting: voice(R.greet, R.p).replace('{drink}', recipeById[recipe].name) })
    sfx('bell')
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
      push({ id: nextId(), face: r.face, recipe, patience: maxP, maxPatience: maxP, regular: r.id, look: r.look, p: r.p,
        greeting: voice(r.greet[lvl], r.p).replace('{drink}', recipeById[recipe].name) })
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
  const drink = recipeById[choice.id].name
  // khách du lịch theo nhóm (Hàn, Trung, Anh, Pháp, Ý, Đức, Nga, khách Việt săn mây, dân văn phòng, khách cá tính)
  if (Math.random() < 0.6) {
    const G = pickGuestGroup()
    const P = G.people ? pick(G.people) : null
    // giới tính → tên → xưng hô → ngoại hình: luôn khớp nhau
    const g: Gender = P?.p.g ?? (G.f.length && (!G.m.length || Math.random() < 0.5) ? 'f' : 'm')
    const name = P?.name ?? pick(g === 'f' ? G.f : G.m)
    const p = P?.p ?? G.persona(g, name)
    const look = P?.look ?? G.look(g)
    const maxP = maxPatience * G.patience
    push({ id: nextId(), face: pick(CUSTOMER_FACES), recipe: choice.id, patience: maxP, maxPatience: maxP, look, group: G.id, p,
      name, album: P?.album, greeting: voice(pick(P?.greet ?? G.greet), p).replace('{drink}', drink) })
    sfx('bell')
    return
  }
  const g: Gender = Math.random() < 0.5 ? 'f' : 'm'
  const p = walkinPersona(g)
  push({ id: nextId(), face: pick(CUSTOMER_FACES), recipe: choice.id, patience: maxPatience, maxPatience, look: randomLook(g), name: funnyName(g), p,
    greeting: voice(pick(GENERIC_ORDERS), p).replace('{drink}', drink) })
  sfx('bell')
}

function spawnOrder() {
  const choice = chooseRecipe()
  if (choice.ratio > 1 && Math.random() > clamp(1 - (choice.ratio - 1) * 1.6, 0, 1)) return
  ui.orders.push({ id: nextId(), name: pick(ORDER_NAMES), recipe: choice.id, timeLeft: 80, maxTime: 80, state: 'new', perfect: false })
  sfx('bell')
  if (ui.view !== 'app') toast('📱 Có đơn mới trên app!', 'info', 1500)
}

export function changeRep(d: number) {
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
  if (!byStaff) finishTutorial()

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

  if (ui.talk?.custId === c.id) ui.talk = null
  const price = save.prices[c.recipe]
  let tip = 0
  if (perfect && !byStaff) tip = Math.max(2_000, Math.round((price * 0.15) / 1000) * 1000)
  if (c.regular) {
    tip += bondLevel(save.bonds[c.regular] ?? 0) * 3_000
    addBond(c.regular, byStaff ? 2 : perfect ? 6 : 3)
  }
  if ((c.chatBonus ?? 0) >= 5) tip += 2_000
  const R = c.rare ? rareById[c.rare] : null
  if (R) tip += R.tip
  // combo: chỉ tính ly tự tay pha (nhân viên pha không giữ chuỗi)
  let combo = 0
  if (!byStaff) { if (perfect) combo = comboUp(price); else breakCombo() }
  save.money += price + tip + combo
  ui.stats.revenue += price + tip + combo
  ui.stats.tips += tip
  ui.stats.comboBonus = (ui.stats.comboBonus ?? 0) + combo
  const fast = c.patience / c.maxPatience > 0.6
  const cheap = price / fairPrice(c.recipe) < 0.85
  changeRep((fast ? 0.5 : 0.2) + (cheap ? 0.2 : 0) + (tip ? 0.3 : 0))
  float(`${byStaff ? '🧑‍🍳 ' : ''}+${moneyShort(price)}${tip ? ` 💝${moneyShort(tip)}` : ''}${combo ? ` ⚡${moneyShort(combo)}` : ''}`, 'good')
  sfx('coin')
  seatCustomer(c, perfect && !byStaff)
  // món mua kèm: nhân viên tự lấy giúp; bạn tự phục vụ thì phải bấm ở kệ hàng (quên là mất đơn kèm)
  if (byStaff && c.addon && !c.addonDone) sellAddonTo(c)
  const albumKey = c.album ?? (c.regular ? `reg:${c.regular}` : c.rare ? `rare:${c.rare}` : c.group && c.name ? `intl:${c.name}` : c.name ? `name:${c.name}` : undefined)
  const G = groupById(c.group)
  if (G?.foreign) hooks.intlServed?.()
  const ratio0 = c.patience / c.maxPatience
  hooks.served?.({ kind: 'walkin', recipe: c.recipe, perfect: perfect && !byStaff, byStaff, price, tip, albumKey, look: c.look,
    stars: byStaff ? 4 : mistakes === 0 ? (ratio0 > 0.4 ? 5 : 4) : mistakes === 1 ? 3 : 2 })
  if (byStaff && R) toast(`${R.name}: “${R.thanks}”`, 'heart', 3200)
  if (!byStaff) {
    // Khách cầm ly lên uống và review tại quầy
    const ratio = c.patience / c.maxPatience
    const stars = mistakes === 0 ? (ratio > 0.4 ? 5 : 4) : mistakes === 1 ? 3 : 2
    const r = recipeById[c.recipe]
    const fam = FAMILY_REVIEWS[r.family]
    let text = pick(COUNTER_REVIEWS[stars])
    if (stars === 5 && Math.random() < 0.4) text = pick(fam.good)
    if (stars === 4 && Math.random() < 0.5) text = pick(fam.meh)
    // khách du lịch review theo kiểu riêng của nhóm
    if (G && stars >= 4 && Math.random() < 0.75) text = pick(G.good)
    if (G && stars <= 3 && Math.random() < 0.75) text = pick(G.meh)
    text = voice(text, c.p).replace('{drink}', r.name.toLowerCase())
    if (R && stars >= 4) text = R.thanks
    const name = c.regular ? REGULARS.find((x) => x.id === c.regular)!.name : c.name ?? pick(ORDER_NAMES)
    save.reviews.unshift({ id: nextId(), name, stars, text, recipe: c.recipe, day: save.day, src: 'quan' })
    if (save.reviews.length > 40) save.reviews.length = 40
    changeRep((stars - 3) * 0.3)
    bus.emit({ type: 'served', id: c.id, stars, text, price, tip, needy: false })
  }
}

function sellAddonTo(c: Customer) {
  const r = hooks.sellAddon?.(c.addon!)
  if (!r) return false
  c.addonDone = true
  save.money += r.price
  ui.stats.revenue += r.price
  ui.stats.goodsRev = (ui.stats.goodsRev ?? 0) + r.price
  ui.stats.goodsSold = (ui.stats.goodsSold ?? 0) + 1
  float(`+${moneyShort(r.price)} ${r.name}`, 'good')
  return true
}
/** Bấm món ở kệ hàng: trao cho khách đang đứng quầy nếu khách đặt đúng món đó */
export function giveAddon(id: string) {
  const c = ui.queue[0]
  if (!c || c.addon !== id || c.addonDone) {
    sfx('wrong'); vibrate([20, 30, 20]); bus.emit({ type: 'wrong' })
    toast(c?.addon && !c.addonDone ? 'Khách không gọi món này' : 'Khách đang đứng quầy không mua kèm món này', 'bad', 1400)
    return
  }
  if (!sellAddonTo(c)) { toast('Hết hàng trên kệ – vào Kho nhập thêm', 'bad'); sfx('wrong'); return }
  sfx('coin'); vibrate(10)
}

function orderReady(o: Order, perfect: boolean, byStaff: boolean) {
  o.state = 'ready'
  o.perfect = perfect
  if (!byStaff) {
    const combo = perfect ? comboUp(save.prices[o.recipe]) : (breakCombo(), 0)
    if (combo) { save.money += combo; ui.stats.revenue += combo; ui.stats.comboBonus = (ui.stats.comboBonus ?? 0) + combo }
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
  hooks.served?.({ kind: 'app', recipe: o.recipe, perfect: o.perfect, byStaff: false, price, tip: 0, stars })
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
  if (!t || !c || c.chatted) return
  const reg = c.regular ? REGULARS.find((r) => r.id === c.regular) : undefined
  const G = groupById(c.group)
  const person = G?.people?.find((x) => x.name === c.name)
  const own = person?.chats.length ? person.chats : G?.chats ?? []
  const topics = reg ? reg.chats : own.length && Math.random() < 0.75 ? own : GENERIC_CHATS
  t.topic = voiceTopic(pick(topics), c.p)
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
  hooks.chat?.(r.bond)
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
  if (ui.closing) { toast('Quán đã đóng cửa – không nhận thêm order', 'info', 1600); return }
  if (staffAll.value) { toast('Nhân viên đang lo quầy pha chế – bạn vào Bếp nấu món nhé', 'info', 1800); return }
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
    breakCombo() // sai 1 bước là vỡ chuỗi combo
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
  // Ghi nhận bước NGAY lập tức (không bắt chờ hoạt ảnh) → bấm liên tục vẫn nhạy
  b.action = step
  b.actionAt = performance.now()
  bus.emit({ type: 'step', step })
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
  const anim = info.kind === 'act' ? stepMs(step) : Math.min(info.ms, 260)
  const at = b.actionAt
  setTimeout(() => { if (ui.brew === b && b.actionAt === at) b.action = null }, anim)
  if (b.done.length === steps.length) { b.busy = true; setTimeout(() => { if (ui.brew === b) finishBrew() }, Math.max(250, anim * 0.6)) }
}

function finishBrew() {
  const b = ui.brew
  if (!b) return
  const name = b.target === 'cust' ? recipeById[b.recipe].name : `Đơn app · ${ui.orders.find((o) => o.id === b.id)?.name ?? ''}`
  ui.present = { recipe: b.recipe, cup: b, target: b.target, name }
  sfx('done')
  presentDone = () => {
    presentDone = null
    clearTimeout(presentTimer)
    ui.present = null
    if (ui.phase !== 'open') { ui.brew = null; return }
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
  }
  presentTimer = window.setTimeout(() => presentDone?.(), 1000)
}
let presentDone: (() => void) | null = null
let presentTimer = 0
/** Chạm vào ly thành phẩm để đưa khách ngay */
export function skipPresent() { presentDone?.() }

/** Đổ bỏ ly đang pha (nguyên liệu đã dùng sẽ mất) */
export function cancelBrew() {
  if (!ui.brew || ui.present) return
  ui.brew = null
  sfx('pour')
  toast('Đã đổ bỏ, pha lại nha', 'info', 1200)
}


// ---------- KHU KHÁCH NGỒI: logic ----------
function newSeat(): Seat { return { state: 'free', t: 0, tip: 0, taps: 0 } }

/** Khách vãng lai sau khi nhận nước: một phần muốn ngồi lại quán */
function seatCustomer(c: Customer, perfect: boolean) {
  if (!save.seating.tables) return // khu ngồi còn bỏ hoang: khách mua mang đi, không trừ uy tín
  const want = save.weather === 'rainy' ? 0.65 : save.weather === 'hot' ? 0.55 : 0.45
  if (Math.random() > want) return
  // ưu tiên bàn trống cả 2 ghế (khách lạ ít khi ngồi chung), hết thì ghép bàn
  let i = ui.seats.findIndex((x, k) => x.state === 'free' && ui.seats[k ^ 1]?.state === 'free')
  if (i >= 0 && Math.random() < 0.5) i ^= 1 // ngồi ghế trái hoặc phải ngẫu nhiên
  if (i < 0) i = ui.seats.findIndex((x) => x.state === 'free')
  if (i < 0) {
    ui.stats.noSeat = (ui.stats.noSeat ?? 0) + 1
    changeRep(-0.25)
    const dirty = ui.seats.some((x) => x.state === 'dirty')
    float(dirty ? 'Bàn bẩn, khách đứng uống' : 'Hết bàn ngồi', 'bad')
    if (dirty && ui.page === 0 && (ui.stats.noSeat ?? 0) <= 2) toast('Khu ngồi có bàn bẩn – vuốt sang để dọn', 'bad', 2400)
    return
  }
  const L = TABLE_LEVELS[save.seating.level] ?? TABLE_LEVELS[0]
  const base = 2_000 + Math.round(Math.random() * 3) * 1_000 + (perfect ? 2_000 : 0)
  ui.seats[i] = { state: 'busy', look: c.look, recipe: c.recipe, t: (16 + Math.random() * 14) * L.sit, tip: Math.round((base * L.tip) / 1000) * 1000, taps: 0 }
  ui.stats.seated = (ui.stats.seated ?? 0) + 1
}

/** Dọn xong 1 bàn: thu tiền boa của mọi ghế bẩn ở bàn đó */
function collectTable(tb: number, byWaiter: boolean) {
  let tip = 0, n = 0
  for (let k = tb * SEATS_PER_TABLE; k < (tb + 1) * SEATS_PER_TABLE; k++) {
    const st = ui.seats[k]
    if (!st || st.state !== 'dirty') continue
    tip += st.tip
    n++
    ui.seats[k] = newSeat()
  }
  if (!n) return
  ui.stats.cleaned = (ui.stats.cleaned ?? 0) + 1
  if (tip) {
    save.money += tip
    ui.stats.revenue += tip
    ui.stats.tips += tip
    ui.stats.seatTips = (ui.stats.seatTips ?? 0) + tip
  }
  changeRep(0.15 * n)
  bus.emit({ type: 'seatClean', seat: tb, tip, byWaiter })
  if (!byWaiter) { sfx('coin'); vibrate(12) }
}
const tableDirty = (tb: number) => ui.seats[tb * 2]?.state === 'dirty' || ui.seats[tb * 2 + 1]?.state === 'dirty'

/** Người chơi lau bàn bẩn (chạm CLEAN_TAPS lần vào bàn) */
export function cleanSeat(tb: number) {
  if (!tableDirty(tb) || ui.paused) return
  const dirty = [ui.seats[tb * 2], ui.seats[tb * 2 + 1]].filter((x) => x?.state === 'dirty')
  const taps = Math.max(...dirty.map((x) => x.taps)) + 1
  dirty.forEach((x) => (x.taps = taps))
  if (taps >= CLEAN_TAPS) collectTable(tb, false)
  else { sfx('tap'); vibrate(6) }
}

function tickSeating(dt: number) {
  for (let i = 0; i < ui.seats.length; i++) {
    const st = ui.seats[i]
    if (st.state === 'busy') {
      st.t -= dt
      if (st.t <= 0) {
        // khách uống xong: để lại ly, vụn bánh và tiền boa trên bàn
        ui.seats[i] = { state: 'dirty', t: 0, tip: st.tip + (save.seating.level >= 2 && Math.random() < 0.3 ? 5_000 : 0), taps: 0, recipe: st.recipe }
      }
    } else if (st.state === 'dirty') {
      st.t += dt
      if (st.t >= DIRTY_PENALTY_T) {
        st.t = 0
        changeRep(-0.5)
        if (ui.page === 1) float('Bàn bẩn lâu quá!', 'bad')
      }
    }
  }
  // nhân viên phục vụ tự đi dọn bàn bẩn
  const WALK = 1.2, CLEAN = 2.2
  for (const w of ui.waiters) {
    if (w.seat === null) {
      const taken = new Set(ui.waiters.map((x) => x.seat))
      let i = -1
      for (let tb = 0; tb < save.seating.tables; tb++) if (tableDirty(tb) && !taken.has(tb)) { i = tb; break }
      if (i < 0) continue
      w.seat = i
      w.t = 0
    } else {
      w.t += dt
      if (!tableDirty(w.seat)) { w.seat = null; continue }
      if (w.t >= WALK + CLEAN) { collectTable(w.seat, true); w.seat = null; w.t = 0 }
    }
  }
}

export function buyTables() {
  const n = save.seating.tables
  const cost = TABLE_COSTS[n]
  if (n >= maxTables.value || !cost) { toast(n >= 6 ? 'Đã đủ 6 bàn!' : 'Mặt bằng này hết chỗ – thuê mặt bằng lớn hơn để kê thêm bàn', 'bad'); sfx('wrong'); return }
  if (save.money < cost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= cost
  save.seating.tables = n + 2
  if (ui.phase === 'open') for (let k = 0; k < 2 * SEATS_PER_TABLE; k++) ui.seats.push(newSeat())
  toast(n === 0 ? 'Quét sạch mạng nhện, kê 2 bàn đầu tiên! Khách đã có chỗ ngồi lại' : `Kê thêm 2 bàn → ${save.seating.tables} bàn`, 'good')
  sfx('done'); vibrate([10, 30, 10])
}

export function upgradeTables() {
  const lv = save.seating.level
  const cost = TABLE_LEVEL_COSTS[lv]
  if (cost === undefined) return
  if (save.money < cost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= cost
  save.seating.level = lv + 1
  toast(`Đổi sang ${TABLE_LEVELS[lv + 1].name}!`, 'good')
  sfx('done'); vibrate([10, 30, 10])
}

export function hireWaiter() {
  const n = save.seating.waiter
  const cost = WAITER_COSTS[n]
  if (cost === undefined) return
  if (save.money < cost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= cost
  save.seating.waiter = n + 1
  if (ui.phase === 'open') ui.waiters.push({ seat: null, t: 0, x: 100 - n * 14 })
  toast(`Thuê phục vụ thứ ${n + 1} · lương ${moneyShort(WAITER_WAGE)}/ngày`, 'good')
  sfx('done'); vibrate([10, 30, 10])
}

export function togglePause() { if (ui.resumed) { resumeSession(); sfx('tap'); return } ui.paused = !ui.paused; sfx('tap') }
export function cycleSpeed() { ui.speed = ui.speed >= 3 ? 1 : ui.speed + 1; sfx('tap') }

function endDay() {
  cancelAnimationFrame(raf)
  presentDone = null
  clearTimeout(presentTimer)
  ui.present = null
  ui.toasts = []
  ui.queue = []
  ui.orders = []
  ui.brew = null
  ui.talk = null
  // cuối ngày: tiền boa còn trên bàn bẩn chưa dọn thì mất
  ui.seats = []
  ui.waiters = []
  ui.rush = null
  ui.combo = 0
  ui.closing = false
  hooks.kitchenReset?.()
  // Xong 1 ngày → mở khoá món mới
  const nr = unlockNextRecipe()
  if (nr) ui.stats.newRecipe = nr
  const w = wages.value
  const rent = rentToday.value
  save.money -= w + rent
  let meltedIce = 0
  if (!save.upgrades.freezer) { meltedIce = save.stock.da; save.stock.da = 0 }
  const s = ui.stats
  const profit = s.revenue - s.spent - w - rent
  const meta = hooks.dayEnd?.(s) ?? null
  // trả nợ dần: 30% lợi nhuận ngày (tối thiểu 50k nếu đủ tiền)
  let debtPaid = 0
  if (save.debt > 0 && profit > 0 && save.money > 0) {
    debtPaid = Math.min(save.debt, save.money, Math.max(50_000, Math.round((profit * 0.3) / 1000) * 1000))
    save.money -= debtPaid
    save.debt -= debtPaid
  }
  const bankrupt = save.money < 0
  ui.report = { ...s, wages: w, rent, meltedIce, profit, repEnd: save.reputation, bankrupt, loan: bankrupt ? loanOffer() : null, debtPaid, meta }
  save.totals.revenue += s.revenue
  save.totals.served += s.served + s.delivered
  save.totals.bestProfit = Math.max(save.totals.bestProfit, profit)
  save.history = [...save.history, profit].slice(-7)
  ui.phase = 'report'
  persist()
  setReportMode(true)
  if (!audio.music) sfx('dayEnd') // có nhạc thì nhạc tổng kết thay cho tiếng chuông, tránh chồng tiếng
  vibrate([20, 60, 20])
}

function loanOffer(): LoanOffer {
  const who = save.loans < 2 ? 'me' : 'tu'
  const amount = Math.ceil((-save.money + 500_000) / 100_000) * 100_000 // đủ trả âm + 500k vốn nhập hàng
  return { who, amount, owe: who === 'me' ? amount : Math.round((amount * 1.1) / 1000) * 1000 }
}

export function nextDay() {
  const loan = ui.report?.bankrupt ? ui.report.loan : null
  if (loan) {
    save.money += loan.amount
    save.debt += loan.owe
    save.loans++
    toast(loan.who === 'me' ? `Mẹ chuyển khoản ${moneyShort(loan.amount)}: “Cố lên con, mẹ tin con.”` : `Bà Tư cho vay ${moneyShort(loan.amount)}: “Lãi 10% thôi, nhớ trả đó nghe.”`, 'heart', 4200)
  }
  save.day++
  save.weather = save.forecast
  save.forecast = randomWeather()
  ui.report = null
  setReportMode(false)
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
  setReportMode(false)
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
