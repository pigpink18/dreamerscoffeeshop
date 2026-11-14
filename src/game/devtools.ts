// Lối tắt khi chạy LOCAL (npm run dev) – không có trong bản build.
//   http://localhost:5173/            → MẶC ĐỊNH chơi bình thường như bản thật (bếp khoá, phải trả 500k mới mở)
//   http://localhost:5173/?dev=bep    → [chỉ để thử bếp] bỏ qua mở đầu/hướng dẫn, mở ca bán, mở khoá bếp, đủ nguyên liệu,
//                                        mỗi món 1 phiếu đơn (chờ rất lâu), chuyển thẳng sang trang Bếp
//   thêm &staff=1                      → có nhân viên lo quầy nước (bạn chỉ nấu)
// Trong console: dev.ticket('waffleDau') · dev.tickets() · dev.stock() · dev.money(1e6)
import { save, ui, openShop, persist } from './store'
import { INGREDIENTS } from './data'
import { CHAPTERS, chapterDay } from './story'
import { kitchen, FOODS, FOOD_INGS, type FoodId } from './kitchen'

let tid = 9000
const LONG = 9999 // giây – phiếu đơn dev gần như không hết hạn

function stock() {
  for (const i of INGREDIENTS) save.stock[i.id] = Math.max(save.stock[i.id] ?? 0, 99)
  for (const i of FOOD_INGS) save.kitchen.stock[i.id] = Math.max(save.kitchen.stock[i.id] ?? 0, 30)
}
function ticket(food: FoodId, name = 'Khách thử') {
  kitchen.tickets.push({ id: tid++, name, food, t: LONG, max: LONG })
}
function tickets() { for (const f of FOODS) ticket(f.id, f.name.split(' ')[0] + ' dev') }

export function devBoot() {
  const q = new URLSearchParams(location.search)
  ;(window as any).dev = { ticket, tickets, stock, money: (n: number) => { save.money = n }, save, ui, kitchen }
  if (q.get('dev') !== 'bep') return // mặc định: không can thiệp gì (giống bản thật)
  save.introSeen = true
  save.tutDone = true
  // các chương truyện tới hôm nay coi như đã xem (không bật cảnh truyện chen ngang)
  for (const ch of CHAPTERS) if (chapterDay(ch) <= save.day && !save.story.seen.includes(ch.id)) save.story.seen.push(ch.id)
  if (q.get('staff') === '1') save.upgrades.staff = Math.max(1, save.upgrades.staff)
  save.kitchen.open = true
  stock()
  persist()
  if (ui.phase === 'prep') openShop()
  ui.paused = false
  kitchen.tickets.splice(0)
  tickets()
  ui.page = 2
  console.info('[dev] Bếp sẵn sàng – dùng dev.ticket(id) / dev.tickets() / dev.stock() để thêm')
}
