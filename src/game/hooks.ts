// Cầu nối giữa vòng chơi chính (store.ts) và phần chơi dài hạn (meta.ts) – tránh import vòng.
import type { RecipeId, Look } from './data'
import type { DayStats } from './store'

export interface ServeInfo {
  kind: 'walkin' | 'app'
  recipe: RecipeId
  perfect: boolean
  byStaff: boolean
  price: number
  tip: number
  stars: number
  albumKey?: string // khách để ghi vào album
  look?: Look
}

export interface MetaDayResult {
  dayScore: number
  rank: number
  prevRank: number
  contest: boolean
  quests: string[] // nhiệm vụ hoàn thành hôm nay
  achievements: string[]
  beans: number // hạt vàng nhận trong ngày
  week: { rank: number; beans: number; money: number; title: string } | null
  spoiled: number // bánh tồn cuối ngày phải bỏ
}

export const hooks: {
  served?: (i: ServeInfo) => void
  chat?: (bond: number) => void
  intlServed?: () => void // phục vụ xong 1 khách nước ngoài
  dayStart?: () => void
  dayEnd?: (s: DayStats) => MetaDayResult | null
  customerMul?: () => number
  rareSpawn?: (dayFrac: number) => string | null // id khách hiếm
  pickAddon?: () => string | null // khách muốn mua kèm món gì (bánh / lưu niệm) – null nếu không
  sellAddon?: (id: string) => { name: string; price: number } | null // trao món kèm: trừ kho, trả về giá
} = {}
