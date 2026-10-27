// Phần chơi dài hạn: đua top với quán đối thủ, nhiệm vụ ngày, thành tựu, album khách, công thức bí mật,
// đồ cho Cáo, trang trí và thuê mặt bằng. Nối vào vòng chơi chính qua hooks.ts.
import { computed, reactive, watch } from 'vue'
import { save, ui, toast, vibrate } from './store'
import { sfx } from './audio'
import { hooks, type ServeInfo, type MetaDayResult } from './hooks'
import { submitScore } from './online'
import {
  REGULARS, BOSSES, FEMALE_NAMES, MALE_NAMES, RECIPES, recipeById, ingredientById, recipeNeeds, pick, bondLevel,
  type RecipeId, type StepId, type IngredientId,
} from './data'
import {
  PREMISES, RIVALS, RIVAL_NEWS, WEEK_REWARDS, RANK_MUL, RARE, rareById, OUTFITS, DECOR_ITEMS, ACHIEVEMENTS, GOODS, goodUnlocked,
  type Quest, type QuestKind, type OutfitSlot,
} from './metaData'

const M = () => save.meta

// ---------- Đếm trong ngày (không cần lưu) ----------
export const today = reactive({ perfect: 0, bossWins: 0, beans: 0, quests: [] as string[], ach: [] as string[], served: 0 })

function addBeans(n: number) {
  M().beans += n
  today.beans += n
}

// ---------- Album ----------
export const ALBUM_TOTAL = REGULARS.length + BOSSES.length + RARE.length + FEMALE_NAMES.length + MALE_NAMES.length
export const albumCount = computed(() => Object.keys(M().album).length)

function addAlbum(key: string, info: ServeInfo) {
  const a = M().album
  const isNew = !a[key]
  a[key] = { n: (a[key]?.n ?? 0) + 1, look: a[key]?.look ?? info.look }
  if (!isNew) return
  if (key.startsWith('rare:')) {
    const R = rareById[key.slice(5)]
    if (R) { addBeans(R.beans); toast(`✨ Khách hiếm vào album: ${R.name}! +${R.beans} hạt vàng`, 'heart', 3000); sfx('heart') }
  }
}

// ---------- Công thức bí mật ----------
export const SECRET_RECIPES = RECIPES.filter((r) => r.secret)
export function giveHint(id?: RecipeId) {
  const pool = SECRET_RECIPES.filter((r) => !M().hints.includes(r.id) && !M().secrets.includes(r.id))
  const r = id ? recipeById[id] : pool.length ? pick(pool) : null
  if (!r || M().hints.includes(r.id) || M().secrets.includes(r.id)) return null
  M().hints.push(r.id)
  return r
}
/** Nguyên liệu bí mật đã "biết" (có gợi ý hoặc đã tìm ra món cần tới nó) → hiện ở Kho và Phòng thử */
export const knownIngredients = computed(() => {
  const s = new Set<IngredientId>()
  for (const id of [...M().hints, ...M().secrets]) for (const ing of Object.keys(recipeNeeds(recipeById[id]))) s.add(ing as IngredientId)
  return s
})
export type TryResult = { kind: 'found'; recipe: RecipeId } | { kind: 'order' | 'close' | 'miss' | 'known'; recipe?: RecipeId }
export function tryRecipe(steps: StepId[]): TryResult {
  const key = steps.join(',')
  const sorted = [...steps].sort().join(',')
  for (const r of RECIPES) {
    if (r.steps.join(',') !== key) continue
    if (!r.secret || M().secrets.includes(r.id)) return { kind: 'known', recipe: r.id }
    M().secrets.push(r.id)
    if (!save.unlocked.includes(r.id)) save.unlocked.push(r.id)
    M().hints = M().hints.filter((h) => h !== r.id)
    for (const ing of Object.keys(recipeNeeds(r)) as IngredientId[]) save.stock[ing] += ingredientById[ing].packSize
    addBeans(8)
    sfx('bossWin'); vibrate([20, 40, 20, 40, 60])
    checkAch()
    return { kind: 'found', recipe: r.id }
  }
  const secrets = SECRET_RECIPES.filter((r) => !M().secrets.includes(r.id))
  if (secrets.some((r) => [...r.steps].sort().join(',') === sorted)) return { kind: 'order' }
  const best = Math.max(0, ...secrets.map((r) => {
    const need = [...r.steps]
    let hit = 0
    for (const s of steps) { const i = need.indexOf(s); if (i >= 0) { hit++; need.splice(i, 1) } }
    return hit / Math.max(r.steps.length, steps.length)
  }))
  return { kind: best >= 0.6 ? 'close' : 'miss' }
}

// ---------- Quán đối thủ & bảng xếp hạng phố ----------
export const isContestDay = computed(() => save.day % 7 === 0)
export const weekNo = computed(() => Math.floor((save.day - 1) / 7) + 1)
export const daysLeftInWeek = computed(() => 7 - ((save.day - 1) % 7))

export interface StreetRow { id: string; name: string; owner: string; slogan: string; color: string; week: number; last: number; me: boolean }
export const street = computed<StreetRow[]>(() => {
  const me: StreetRow = { id: 'me', name: 'Dreamers Coffee', owner: `${save.player} & Cáo`, slogan: 'Quán của những người dám mơ', color: '#f2c14e', week: M().week.my, last: M().week.today, me: true }
  const rows = M().rivals.map((r) => {
    const info = RIVALS.find((x) => x.id === r.id)!
    return { id: r.id, name: info.name, owner: info.owner, slogan: info.slogan, color: info.color, week: r.week, last: r.last, me: false }
  })
  return [me, ...rows].sort((a, b) => b.week - a.week || (a.me ? -1 : 1))
})
export const myRank = computed(() => street.value.findIndex((r) => r.me))

export const decorBuff = computed(() => M().decor.reduce((a, id) => a + (DECOR_ITEMS.find((d) => d.id === id)?.buff ?? 0), 0))
export const streetMul = computed(() => {
  const news = M().news && M().news!.day === save.day ? M().news!.mul : 1
  // tuần đầu ai cũng 0 điểm: không phạt
  const rank = M().week.my === 0 && M().rivals.every((r) => r.week === 0) ? 2 : myRank.value
  return RANK_MUL[rank] * news * (1 + decorBuff.value)
})

function rivalTarget(day: number) { return Math.min(1100, 140 + 24 * (day - 1)) }

/** Điểm phố của bạn trong ngày */
function dayScore(): number {
  const s = ui.stats
  const avgStars = s.delivered ? s.starsSum / s.delivered : 4
  const base = s.served * 8 + s.delivered * 6 + today.perfect * 4 + today.bossWins * 25 + s.revenue / 20000 + avgStars * 10
  return Math.round(base * (isContestDay.value ? 2 : 1))
}

// ---------- Nhiệm vụ ngày ----------
function questText(q: Quest): string {
  const r = q.recipe ? recipeById[q.recipe].name : ''
  const k = (n: number) => (n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace('.0', '') + 'tr' : Math.round(n / 1000) + 'k')
  switch (q.kind) {
    case 'serve': return `Phục vụ ${q.target} ly`
    case 'perfect': return `Pha ${q.target} ly không sai bước`
    case 'revenue': return `Doanh thu ${k(q.target)}`
    case 'recipe': return `Bán ${q.target} ly ${r}`
    case 'chat': return `Tám chuyện với ${q.target} khách`
    case 'boss': return `Thắng ${q.target} boss`
    case 'app': return `Giao ${q.target} đơn app`
    case 'calm': return 'Không để quá 1 khách bỏ về'
    case 'tips': return `Nhận ${k(q.target)} tiền tip`
    case 'goods': return `Bán kèm ${q.target} món bánh / lưu niệm`
  }
}
function makeQuests(): Quest[] {
  const L = Math.min(1, (save.day - 1) / 20)
  const prem = PREMISES[M().premise].customerMul
  const kinds: QuestKind[] = ['serve', 'perfect', 'revenue', 'recipe', 'chat', 'boss', 'calm', 'tips']
  if (save.upgrades.shipper) kinds.push('app')
  if (M().premise >= 1) kinds.push('goods', 'goods')
  const chosen: QuestKind[] = []
  while (chosen.length < 3) { const k = pick(kinds); if (!chosen.includes(k)) chosen.push(k) }
  return chosen.map((kind) => {
    const q: Quest = { kind, target: 1, progress: 0, beans: 4, done: false, text: '' }
    if (kind === 'serve') { q.target = Math.round((8 + L * 22) * prem); q.beans = 4 }
    if (kind === 'perfect') { q.target = Math.round(4 + L * 12); q.beans = 5 }
    if (kind === 'revenue') { q.target = Math.round(((250_000 + L * 2_000_000) * prem) / 50_000) * 50_000; q.beans = 5 }
    if (kind === 'recipe') { q.recipe = pick(save.unlocked); q.target = 2 + Math.round(L * 3); q.beans = 4 }
    if (kind === 'chat') { q.target = 2 + Math.round(L * 3); q.beans = 3 }
    if (kind === 'boss') { q.target = 1; q.beans = 6 }
    if (kind === 'app') { q.target = Math.round(3 + L * 6); q.beans = 4 }
    if (kind === 'calm') { q.target = 1; q.beans = 6 }
    if (kind === 'goods') { q.target = Math.round(3 + L * 9); q.beans = 5 }
    if (kind === 'tips') { q.target = Math.round((20_000 + L * 150_000) / 10_000) * 10_000; q.beans = 4 }
    q.text = questText(q)
    return q
  })
}
function bumpQuest(kind: QuestKind, n = 1, recipe?: RecipeId) {
  for (const q of M().quests.list) {
    if (q.done || q.kind !== kind || (q.recipe && q.recipe !== recipe)) continue
    q.progress = Math.min(q.target, q.progress + n)
    if (q.progress >= q.target) finishQuest(q)
  }
}
function setQuest(kind: QuestKind, value: number) {
  for (const q of M().quests.list) {
    if (q.done || q.kind !== kind) continue
    q.progress = Math.min(q.target, value)
    if (q.progress >= q.target) finishQuest(q)
  }
}
function finishQuest(q: Quest) {
  q.done = true
  addBeans(q.beans)
  M().stats.questsDone++
  today.quests.push(q.text)
  toast(`Nhiệm vụ xong: ${q.text} · +${q.beans} hạt vàng`, 'good', 2400)
  sfx('done')
  const Q = M().quests
  if (!Q.bonus && Q.list.every((x) => x.done)) {
    Q.bonus = true
    addBeans(5)
    const h = Math.random() < 0.5 ? giveHint() : null
    setTimeout(() => toast(h ? `Xong cả 3 nhiệm vụ! +5 hạt + gợi ý công thức bí mật “${h.name}”` : 'Xong cả 3 nhiệm vụ hôm nay! +5 hạt vàng', 'heart', 3200), 1400)
  }
}

// ---------- Thành tựu ----------
export const achCtx = computed(() => ({
  s: M().stats,
  album: albumCount.value,
  albumTotal: ALBUM_TOTAL,
  secrets: M().secrets.length,
  premise: M().premise,
  outfits: M().outfits.length,
  friends: REGULARS.filter((r) => bondLevel(save.bonds[r.id] ?? 0) >= 2).length,
}))
export function checkAch() {
  const ctx = achCtx.value
  for (const a of ACHIEVEMENTS) {
    if (M().ach.includes(a.id) || a.stat(ctx) < a.goal) continue
    M().ach.push(a.id)
    addBeans(a.beans)
    today.ach.push(a.name)
    const h = Math.random() < 0.35 ? giveHint() : null
    toast(`🏆 Thành tựu: ${a.name} · +${a.beans} hạt${h ? ` · gợi ý “${h.name}”` : ''}`, 'heart', 3000)
    sfx('bossWin')
  }
}

// ---------- Mặt bằng, đồ cho Cáo, trang trí ----------
export function premiseLocked(id: number): string | null {
  const p = PREMISES[id]
  if (save.day < p.need.day) return `Mở từ ngày ${p.need.day}`
  if (save.reputation / 20 < p.need.stars) return `Cần quán ${p.need.stars} sao`
  if (p.need.top3 && !(M().week.history.some((r) => r <= 2) || myRank.value <= 2)) return 'Cần lọt top 3 phố (bảng Đua top)'
  return null
}
export function rentPremise(id: number) {
  const p = PREMISES[id]
  if (ui.phase === 'open') { toast('Đang bán, hết ngày rồi chuyển quán nha', 'bad'); return }
  if (M().premise >= id) return
  const lock = premiseLocked(id)
  if (lock) { toast(lock, 'bad'); sfx('wrong'); return }
  if (save.money < p.deposit) { toast('Không đủ tiền cọc!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= p.deposit
  M().premise = id
  toast(`Chuyển về ${p.name}! Khách đông hơn, tiền thuê ${Math.round(p.rent / 1000)}k/ngày`, 'heart', 3200)
  sfx('bossWin'); vibrate([20, 40, 20])
  checkAch()
}
export function buyOutfit(id: string) {
  const o = OUTFITS.find((x) => x.id === id)!
  if (M().outfits.includes(id)) return wearOutfit(id)
  if (M().beans < o.cost) { toast('Chưa đủ hạt vàng – làm nhiệm vụ & thành tựu để kiếm thêm', 'bad'); sfx('wrong'); return }
  M().beans -= o.cost
  M().outfits.push(id)
  M().wear[o.slot] = id
  toast(`Cáo có ${o.name} mới!`, 'heart'); sfx('heart')
  checkAch()
}
export function wearOutfit(id: string) {
  const o = OUTFITS.find((x) => x.id === id)!
  const w = M().wear
  w[o.slot as OutfitSlot] = w[o.slot] === id ? undefined : id
  sfx('tap')
}
export function buyDecor(id: string) {
  const d = DECOR_ITEMS.find((x) => x.id === id)!
  if (M().decor.includes(id)) return
  if (M().beans < d.cost) { toast('Chưa đủ hạt vàng', 'bad'); sfx('wrong'); return }
  M().beans -= d.cost
  M().decor.push(id)
  toast(`Đã trang trí ${d.name}! +${Math.round(d.buff * 100)}% khách`, 'heart'); sfx('heart')
}

// ---------- Hàng bán kèm ----------
export function goodsStock(id: string) { return M().goods[id] ?? 0 }
export function buyGoods(id: string, packs = 1) {
  const g = GOODS.find((x) => x.id === id)!
  if (!goodUnlocked(g, M().premise)) { toast(g.kind === 'souvenir' ? 'Cần thuê Quán gác gỗ để bán đồ lưu niệm' : 'Cần thuê Dreamers Flagship để bán bánh', 'bad'); sfx('wrong'); return }
  const cost = g.cost * g.pack * packs
  if (save.money < cost) { toast('Không đủ tiền!', 'bad'); sfx('wrong'); vibrate([30, 40, 30]); return }
  save.money -= cost
  ui.stats.spent += cost
  M().goods[id] = goodsStock(id) + g.pack * packs
  sfx('buy'); vibrate(8)
}

// ---------- Mỗi ngày mới: tin phố + nhiệm vụ ----------
function ensureDay() {
  if (M().quests.day !== save.day) {
    M().quests = { day: save.day, list: makeQuests(), bonus: false }
    M().news = Math.random() < 0.4 ? (() => { const n = pick(RIVAL_NEWS); return { day: save.day, text: n.text.replace('{shop}', pick(RIVALS).name), mul: n.mul } })() : null
  }
}

// ---------- Nối vào vòng chơi ----------
export function initMeta() {
  ensureDay()
  watch(() => save.day, ensureDay)

  hooks.customerMul = () => streetMul.value

  hooks.rareSpawn = (f) => {
    const opts = RARE.filter((r) => (!r.weather || r.weather.includes(save.weather)) && (r.from === undefined || f >= r.from) && (r.to === undefined || f <= r.to) && save.day >= (r.minDay ?? 1))
    for (const r of opts) {
      const unseen = !M().album[`rare:${r.id}`]
      if (Math.random() < r.chance * (unseen ? 1.6 : 0.6)) return r.id
    }
    return null
  }

  hooks.dayStart = () => {
    today.perfect = 0; today.bossWins = 0; today.beans = 0; today.quests = []; today.ach = []; today.served = 0
    ensureDay()
    if (isContestDay.value) setTimeout(() => toast('🏆 Ngày hội Barista phố núi: điểm phố hôm nay x2!', 'heart', 3200), 600)
  }

  hooks.served = (i) => {
    const st = M().stats
    st.served++
    today.served++
    st.earned += i.price + i.tip
    if (i.perfect) { st.perfect++; today.perfect++ }
    if (i.kind === 'app') { st.delivered++; bumpQuest('app') }
    if (i.albumKey) addAlbum(i.albumKey, i)
    bumpQuest('serve')
    if (i.perfect) bumpQuest('perfect')
    bumpQuest('recipe', 1, i.recipe)
    setQuest('revenue', ui.stats.revenue)
    setQuest('tips', ui.stats.tips)
    if (i.albumKey?.startsWith('rare:')) {
      const R = rareById[i.albumKey.slice(5)]
      if (R?.hint) {
        const h = giveHint(R.hint)
        if (h) setTimeout(() => toast(`📜 ${R.name} tiết lộ gợi ý công thức bí mật “${h.name}” – thử ở Menu › Phòng thử món`, 'heart', 3600), 2600)
      }
    }
    checkAch()
  }

  hooks.extraSale = () => {
    const P = M().premise
    if (P < 1) return null
    const pool = GOODS.filter((g) => goodUnlocked(g, P) && goodsStock(g.id) > 0)
    if (!pool.length || Math.random() > (P >= 2 ? 0.42 : 0.28)) return null
    // Flagship: khách thích gọi bánh hơn đồ lưu niệm
    const bakery = pool.filter((g) => g.kind === 'bakery')
    const g = bakery.length && Math.random() < 0.7 ? pick(bakery) : pick(pool)
    M().goods[g.id] = goodsStock(g.id) - 1
    M().stats.goodsSold++
    bumpQuest('goods')
    return { name: g.name, price: g.price }
  }

  hooks.chat = () => { M().stats.chats++; bumpQuest('chat') }

  hooks.bossEnd = (win) => {
    if (!win) return
    M().stats.bossWins++
    today.bossWins++
    bumpQuest('boss')
  }

  hooks.dayEnd = (s): MetaDayResult => {
    const m = M()
    const prevRank = myRank.value
    if (s.angry <= 1) setQuest('calm', 1)
    const score = dayScore()
    m.week.today = score
    m.week.my += score
    m.online.career += score
    const tgt = rivalTarget(save.day)
    for (const r of m.rivals) {
      r.last = Math.round(tgt * r.power * (0.85 + Math.random() * 0.3) * (isContestDay.value ? 2 : 1))
      r.week += r.last
    }
    m.stats.days++
    // bánh chỉ bán trong ngày: tồn bao nhiêu bỏ bấy nhiêu
    let spoiled = 0
    for (const g of GOODS) if (g.kind === 'bakery' && goodsStock(g.id) > 0) { spoiled += goodsStock(g.id); m.goods[g.id] = 0 }
    const rank = myRank.value
    let week: MetaDayResult['week'] = null
    if (isContestDay.value) {
      const rw = WEEK_REWARDS[rank]
      addBeans(rw.beans)
      save.money += rw.money
      if (rank === 0) m.stats.top1++
      m.week.history = [...m.week.history, rank].slice(-20)
      m.week.lastRank = rank
      m.week.lastResult = { rank, beans: rw.beans, money: rw.money }
      week = { rank, beans: rw.beans, money: rw.money, title: rw.text }
      // tuần mới: đối thủ học hỏi, mạnh dần lên (bạn càng dẫn xa, họ càng cố)
      const lead = rank === 0 ? m.week.my / Math.max(1, Math.max(...m.rivals.map((r) => r.week))) : 1
      for (const r of m.rivals) { r.power = Math.min(2.2, r.power + 0.03 + Math.random() * 0.05 + (lead > 1.3 ? 0.06 : 0)); r.week = 0 }
      m.week.my = 0
    }
    checkAch()
    setTimeout(() => submitScore(), 500)
    return { dayScore: score, rank, prevRank, contest: isContestDay.value, quests: [...today.quests], achievements: [...today.ach], beans: today.beans, week, spoiled }
  }
}

export { GOODS, goodUnlocked }
export { PREMISES, RIVALS, OUTFITS, DECOR_ITEMS, ACHIEVEMENTS, RARE, WEEK_REWARDS as WEEK_REWARDS_LIST }
