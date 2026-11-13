// KHU BẾP (trang thứ 3 khi đang bán): nấu bánh mì chảo, mì trộn cay, waffle nhiều loại nhân.
// Khách gọi nước có thể gọi kèm 1 món bếp → phiếu đơn treo trên thanh trong bếp, có hạn chờ.
// Nấu theo từng bước giống pha chế (đúng thứ tự = hoàn hảo, ăn combo + tip).
// Nối với vòng chơi chính qua hooks (tránh import vòng): hooks.foodFor (lúc khách tới), hooks.kitchenTick (mỗi khung).
import { reactive } from 'vue'
import { save, ui, toast, vibrate, persist, comboUp, breakCombo, changeRep, float } from './store'
import { hooks } from './hooks'
import { sfx } from './audio'
import { moneyShort, pick, type SoundName } from './data'
import { L } from './i18n'

// ---------- Dữ liệu ----------
export type FoodIng = 'banhMi' | 'pate' | 'xucXich' | 'trungGa' | 'mi' | 'sotCay' | 'botWaffle' | 'socola' | 'dau' | 'phoMai' | 'laDua'
export type KTool = 'chao' | 'to' | 'khuon' | 'dia' // dụng cụ – không tốn kho
export type KAct = 'chien' | 'luoc' | 'tron' | 'nuong' // thao tác có thời gian
export type KStep = FoodIng | KTool | KAct
export type FoodId = 'banhMiChao' | 'miTronCay' | 'waffleSocola' | 'waffleDau' | 'wafflePhoMai' | 'waffleLaDua'

export const FOOD_INGS: { id: FoodIng; name: string; packSize: number; packPrice: number }[] = [
  { id: 'banhMi', name: L('Bánh mì', 'Baguette'), packSize: 10, packPrice: 40_000 },
  { id: 'pate', name: L('Pate gan', 'Liver pâté'), packSize: 15, packPrice: 45_000 },
  { id: 'xucXich', name: L('Xúc xích', 'Sausage'), packSize: 15, packPrice: 60_000 },
  { id: 'trungGa', name: L('Trứng gà', 'Eggs'), packSize: 20, packPrice: 50_000 },
  { id: 'mi', name: L('Mì trứng', 'Egg noodles'), packSize: 15, packPrice: 45_000 },
  { id: 'sotCay', name: L('Sốt cay', 'Chili sauce'), packSize: 20, packPrice: 40_000 },
  { id: 'botWaffle', name: L('Bột waffle', 'Waffle batter'), packSize: 15, packPrice: 60_000 },
  { id: 'socola', name: L('Nhân sô-cô-la', 'Chocolate filling'), packSize: 10, packPrice: 50_000 },
  { id: 'dau', name: L('Nhân dâu Đà Lạt', 'Đà Lạt strawberry filling'), packSize: 10, packPrice: 50_000 },
  { id: 'phoMai', name: L('Nhân phô mai', 'Cheese filling'), packSize: 10, packPrice: 60_000 },
  { id: 'laDua', name: L('Nhân lá dứa', 'Pandan filling'), packSize: 10, packPrice: 40_000 },
]

export const KSTEPS: Record<KStep, { label: string; kind: 'ing' | 'tool' | 'act'; ms: number; sound: SoundName | 'sizzle' | 'boil' }> = {
  banhMi: { label: L('Bánh mì', 'Bread'), kind: 'ing', ms: 250, sound: 'plop' },
  pate: { label: L('Pate', 'Pâté'), kind: 'ing', ms: 250, sound: 'squeeze' },
  xucXich: { label: L('Xúc xích', 'Sausage'), kind: 'ing', ms: 250, sound: 'plop' },
  trungGa: { label: L('Trứng', 'Egg'), kind: 'ing', ms: 250, sound: 'plop' },
  mi: { label: L('Mì', 'Noodles'), kind: 'ing', ms: 250, sound: 'plop' },
  sotCay: { label: L('Sốt cay', 'Chili sauce'), kind: 'ing', ms: 300, sound: 'squeeze' },
  botWaffle: { label: L('Bột waffle', 'Batter'), kind: 'ing', ms: 300, sound: 'pour' },
  socola: { label: L('Sô-cô-la', 'Chocolate'), kind: 'ing', ms: 250, sound: 'squeeze' },
  dau: { label: L('Dâu', 'Strawberry'), kind: 'ing', ms: 250, sound: 'squeeze' },
  phoMai: { label: L('Phô mai', 'Cheese'), kind: 'ing', ms: 250, sound: 'squeeze' },
  laDua: { label: L('Lá dứa', 'Pandan'), kind: 'ing', ms: 250, sound: 'squeeze' },
  chao: { label: L('Chảo', 'Pan'), kind: 'tool', ms: 200, sound: 'cup' },
  to: { label: L('Tô', 'Bowl'), kind: 'tool', ms: 200, sound: 'cup' },
  khuon: { label: L('Khuôn', 'Mold'), kind: 'tool', ms: 200, sound: 'cup' },
  dia: { label: L('Ra đĩa', 'Plate it'), kind: 'tool', ms: 200, sound: 'cup' },
  chien: { label: L('Áp chảo', 'Pan-fry'), kind: 'act', ms: 1200, sound: 'sizzle' },
  luoc: { label: L('Trụng mì', 'Boil'), kind: 'act', ms: 1100, sound: 'boil' },
  tron: { label: L('Trộn', 'Toss'), kind: 'act', ms: 700, sound: 'stir' },
  nuong: { label: L('Nướng', 'Bake'), kind: 'act', ms: 1300, sound: 'sizzle' },
}

export interface Food { id: FoodId; name: string; steps: KStep[]; price: number; filling?: string /* màu nhân waffle */ }
const waffle = (id: FoodId, name: string, nhan: FoodIng, price: number, filling: string): Food =>
  ({ id, name, steps: ['khuon', 'botWaffle', nhan, 'nuong', 'dia'], price, filling })
export const FOODS: Food[] = [
  { id: 'banhMiChao', name: L('Bánh mì chảo', 'Skillet bánh mì'), steps: ['chao', 'pate', 'trungGa', 'xucXich', 'chien', 'banhMi'], price: 45_000 },
  { id: 'miTronCay', name: L('Mì trộn cay', 'Spicy tossed noodles'), steps: ['mi', 'luoc', 'to', 'sotCay', 'trungGa', 'tron'], price: 40_000 },
  waffle('waffleSocola', L('Waffle sô-cô-la', 'Chocolate waffle'), 'socola', 38_000, '#6b3f2a'),
  waffle('waffleDau', L('Waffle dâu', 'Strawberry waffle'), 'dau', 38_000, '#e8506a'),
  waffle('wafflePhoMai', L('Waffle phô mai', 'Cheese waffle'), 'phoMai', 40_000, '#f2c14e'),
  waffle('waffleLaDua', L('Waffle lá dứa', 'Pandan waffle'), 'laDua', 35_000, '#7fb34d'),
]
export const foodById = Object.fromEntries(FOODS.map((f) => [f.id, f])) as Record<FoodId, Food>
export const KITCHEN_COST = 500_000
const ACTS: KAct[] = ['chien', 'luoc', 'tron', 'nuong']
export const KITCHEN_ACTIONS = ACTS
export const KITCHEN_TOOLS: KTool[] = ['chao', 'to', 'khuon', 'dia']

// ---------- Trạng thái ----------
export interface Ticket { id: number; name: string; food: FoodId; t: number; max: number }
export interface Cooking {
  ticketId: number; food: FoodId; done: KStep[]; mistakes: number; busy: boolean; action: KStep | null; actionAt: number; shake: number
  mini: { step: KAct; at: number } | null // đang chơi mini-game của thao tác (áp chảo / trụng / trộn / nướng)
  auto?: boolean // đang tự bỏ nguyên liệu (người chơi chỉ bấm dụng cụ + thao tác)
}
/** trạng thái bếp trong ca (không lưu vào bản lưu – hết ca là xoá) */
export const kitchen = reactive({
  tickets: [] as Ticket[],
  cook: null as Cooking | null,
  served: null as null | { food: FoodId; perfect: boolean; money: number; tip: number; combo: number; at: number }, // món vừa ra – cảnh bếp chạy hiệu ứng
})
let tid = 1

export const kitchenOpen = () => !!save.kitchen?.open
export const foodStock = (id: FoodIng) => save.kitchen?.stock[id] ?? 0
const addStock = (id: FoodIng, n: number) => { save.kitchen.stock[id] = foodStock(id) + n }
export const canCook = (f: FoodId) => foodById[f].steps.every((s) => KSTEPS[s].kind !== 'ing' || foodStock(s as FoodIng) >= foodById[f].steps.filter((x) => x === s).length)

export function unlockKitchen() {
  if (kitchenOpen()) return
  if (save.money < KITCHEN_COST) { toast(L(`Cần ${moneyShort(KITCHEN_COST)} để mở bếp`, `You need ${moneyShort(KITCHEN_COST)} to open the kitchen`), 'bad'); sfx('wrong'); return }
  save.money -= KITCHEN_COST // đầu tư mở bếp (như nâng cấp) – không tính vào "Nhập hàng" của ngày
  save.kitchen.open = true
  // quà khai trương bếp: mỗi nguyên liệu 1 gói
  for (const i of FOOD_INGS) addStock(i.id, i.packSize)
  toast(L('Khu bếp đã mở! Khách bắt đầu gọi kèm bánh mì chảo, mì trộn cay, waffle. Tặng mỗi nguyên liệu 1 gói.', "The kitchen is open! Guests will start ordering skillet bánh mì, spicy noodles and waffles. Here's a free pack of every ingredient."), 'heart', 4200)
  sfx('buy'); setTimeout(() => sfx('heart'), 280); vibrate([20, 40, 20])
  persist()
}

export function buyFoodPack(id: FoodIng, packs = 1) {
  const ing = FOOD_INGS.find((i) => i.id === id)!
  const cost = ing.packPrice * packs
  if (save.money < cost) { toast(L('Không đủ tiền', 'Not enough money'), 'bad'); sfx('wrong'); return }
  save.money -= cost
  ui.stats.spent += cost
  addStock(id, ing.packSize * packs)
  sfx('buy')
  persist()
}

// ---------- Nấu ----------
export function startCook(ticketId: number) {
  if (kitchen.cook) return
  if (ui.closing) { toast(L('Quán đã đóng cửa – không nấu thêm món mới', "We're closed – no new dishes"), 'info', 1600); return }
  const tk = kitchen.tickets.find((x) => x.id === ticketId)
  if (!tk) return
  if (!canCook(tk.food)) {
    const miss = foodById[tk.food].steps.filter((s) => KSTEPS[s].kind === 'ing' && foodStock(s as FoodIng) < 1).map((s) => KSTEPS[s].label)
    toast(L(`Hết ${[...new Set(miss)].join(', ')}! Vào Kho › Nguyên liệu bếp nhập thêm`, `Out of ${[...new Set(miss)].join(', ')}! Restock in Pantry › Kitchen`), 'bad'); sfx('wrong'); return
  }
  sfx('tap'); vibrate(8)
  kitchen.cook = { ticketId, food: tk.food, done: [], mistakes: 0, busy: false, action: null, actionAt: 0, shake: 0, mini: null }
  autoIngredients(kitchen.cook)
}

/** Nguyên liệu tự bỏ vào (từng món một, đủ chậm để thấy Yến cầm thả): người chơi chỉ bấm dụng cụ + thao tác */
const AUTO_MS = 420
function autoIngredients(ck: Cooking) {
  const next = foodById[ck.food].steps[ck.done.length]
  if (!next || KSTEPS[next].kind !== 'ing') { ck.auto = false; return }
  ck.auto = true
  setTimeout(() => {
    if (kitchen.cook !== ck) return
    if (foodStock(next as FoodIng) < 1) { ck.auto = false; toast(L(`Hết ${KSTEPS[next].label}!`, `Out of ${KSTEPS[next].label}!`), 'bad'); sfx('wrong'); return }
    addStock(next as FoodIng, -1)
    completeStep(ck, next)
  }, AUTO_MS)
}
/** ghi nhận 1 bước xong (dụng cụ / nguyên liệu), rồi tự bỏ tiếp nguyên liệu nếu bước sau là nguyên liệu */
function completeStep(ck: Cooking, step: KStep) {
  const info = KSTEPS[step]
  const f = foodById[ck.food]
  kitchenSfx(info.sound)
  vibrate(6)
  ck.action = step
  ck.actionAt = performance.now()
  ck.done.push(step)
  const at = ck.actionAt
  const anim = Math.min(info.ms, 260)
  setTimeout(() => { if (kitchen.cook === ck && ck.actionAt === at) ck.action = null }, anim)
  if (ck.done.length === f.steps.length) {
    ck.auto = false
    ck.busy = true
    setTimeout(() => { if (kitchen.cook === ck) serveFood() }, Math.max(300, anim))
  } else autoIngredients(ck)
}

export function cookStep(step: KStep) {
  const ck = kitchen.cook
  if (!ck) { toast(L('Chạm vào 1 phiếu đơn trên thanh treo để bắt đầu nấu', 'Tap a ticket on the rail to start cooking'), 'info', 1500); sfx('wrong'); return }
  if (ck.busy || ck.mini || ck.auto) return
  const f = foodById[ck.food]
  const expected = f.steps[ck.done.length]
  if (!expected) return
  if (step !== expected) {
    ck.mistakes++; ck.shake++
    breakCombo()
    sfx('wrong'); vibrate([25, 30, 25])
    return
  }
  const info = KSTEPS[step]
  // thao tác nấu: mở mini-game (KitchenView), xong mới tính là xong bước
  if (info.kind === 'act') {
    ck.mini = { step: step as KAct, at: performance.now() }
    ck.action = step
    ck.actionAt = performance.now()
    vibrate(6)
    return
  }
  if (info.kind === 'ing') {
    if (foodStock(step as FoodIng) < 1) { toast(L(`Hết ${info.label}!`, `Out of ${info.label}!`), 'bad'); sfx('wrong'); return }
    addStock(step as FoodIng, -1)
  }
  completeStep(ck, step)
}

/** Kết thúc mini-game: good = làm chuẩn. Làm hụt vẫn xong bước nhưng tính 1 lỗi (mất combo, ít tip) */
export function finishMini(good: boolean) {
  const ck = kitchen.cook
  if (!ck?.mini) return
  const step = ck.mini.step
  ck.mini = null
  ck.action = null
  if (good) sfx('done')
  else { ck.mistakes++; ck.shake++; breakCombo(); sfx('wrong'); vibrate([25, 30, 25]) }
  ck.done.push(step)
  if (ck.done.length === foodById[ck.food].steps.length) {
    ck.busy = true
    setTimeout(() => { if (kitchen.cook === ck) serveFood() }, 450)
  } else autoIngredients(ck)
}
export { kitchenSfx }

function kitchenSfx(s: SoundName | 'sizzle' | 'boil') {
  if (s === 'sizzle') { sfx('pour'); setTimeout(() => sfx('pour'), 380) }
  else if (s === 'boil') sfx('blend')
  else sfx(s)
}

export function trashCook() {
  if (!kitchen.cook || kitchen.cook.busy) return
  kitchen.cook.mini = null
  kitchen.cook = null
  sfx('angry')
  toast(L('Đã đổ bỏ món đang nấu', 'Tossed the dish'), 'info', 1400)
}

function serveFood() {
  const ck = kitchen.cook
  if (!ck) return
  kitchen.cook = null
  const i = kitchen.tickets.findIndex((x) => x.id === ck.ticketId)
  if (i < 0) { toast(L('Khách đã huỷ món 😢', 'The guest cancelled the dish 😢'), 'bad'); return }
  const tk = kitchen.tickets[i]
  kitchen.tickets.splice(i, 1)
  const f = foodById[ck.food]
  const perfect = ck.mistakes === 0
  const fast = tk.t / tk.max > 0.5
  const tip = perfect ? Math.max(3_000, Math.round((f.price * (fast ? 0.2 : 0.12)) / 1000) * 1000) : 0
  const combo = perfect ? comboUp(f.price) : (breakCombo(), 0)
  const money = f.price + tip + combo
  save.money += money
  ui.stats.revenue += money
  ui.stats.tips += tip
  ui.stats.foodRev = (ui.stats.foodRev ?? 0) + money
  ui.stats.foodSold = (ui.stats.foodSold ?? 0) + 1
  if (combo) ui.stats.comboBonus = (ui.stats.comboBonus ?? 0) + combo
  changeRep(perfect ? (fast ? 0.8 : 0.5) : 0.1)
  kitchen.served = { food: f.id, perfect, money: f.price, tip, combo, at: performance.now() }
  sfx('done'); setTimeout(() => sfx('coin'), 200)
  toast(`${perfect ? '⭐ ' : ''}${tk.name}: “${pick(perfect ? GOOD_LINES : MEH_LINES).replace('{f}', f.name.toLowerCase())}”`, perfect ? 'good' : 'info', 2400)
}

const GOOD_LINES = L(['{f} ngon xỉu, giòn rụm luôn!', 'Trời ơi {f} thơm quá, mai ghé tiếp', 'Ăn {f} xong muốn gọi thêm phần nữa', '{f} chuẩn vị, 10 điểm!'], ['This {f} is sooo good, so crispy!', 'Oh wow, the {f} smells amazing, I\'ll be back tomorrow', 'Finished the {f} and I want another one', 'Perfect {f}, 10 out of 10!'])
const MEH_LINES = L(['{f} hơi lạ lạ, mà cũng được', '{f} ổn, lần sau làm kỹ hơn nha', 'Ăn tạm được, hơi nguội xíu'], ['The {f} is a bit odd, but okay', 'The {f} is fine, a little more care next time?', 'Not bad, just a tad cold'])

// ---------- Nối vào vòng chơi ----------
const MAX_TICKETS = 5
export function initKitchen() {
  // khách gọi nước có thể gọi kèm món bếp → tạo phiếu đơn, trả về id món để hiện trong bóng thoại
  hooks.foodFor = (name: string) => {
    if (!kitchenOpen() || kitchen.tickets.length >= MAX_TICKETS) return null
    if (Math.random() > 0.33 + 0.05 * save.meta.premise) return null
    const food = pick(FOODS).id
    const max = 80 * (1 + 0.1 * save.upgrades.decor)
    kitchen.tickets.push({ id: tid++, name, food, t: max, max })
    return food
  }
  hooks.kitchenTick = (dt: number) => {
    for (let i = kitchen.tickets.length - 1; i >= 0; i--) {
      const tk = kitchen.tickets[i]
      if (kitchen.cook?.ticketId === tk.id) { tk.t = Math.max(0.5, tk.t - dt * 0.35); continue } // đang nấu: khách vẫn chờ nhưng chậm hơn
      tk.t -= dt
      if (tk.t <= 0) {
        kitchen.tickets.splice(i, 1)
        ui.stats.foodLost = (ui.stats.foodLost ?? 0) + 1
        changeRep(-1)
        breakCombo()
        float(L('🍳 Huỷ món', '🍳 Dish cancelled'), 'bad')
        toast(L(`${tk.name} chờ lâu quá, huỷ ${foodById[tk.food].name.toLowerCase()} rồi`, `${tk.name} waited too long and cancelled the ${foodById[tk.food].name.toLowerCase()}`), 'bad', 2400)
        sfx('angry')
      }
    }
  }
  hooks.kitchenBusy = () => !!kitchen.cook
  hooks.kitchenReset = () => { kitchen.tickets = []; kitchen.cook = null; kitchen.served = null }
}
