// Sự kiện theo mùa – tính theo đồng hồ thật của máy (không theo ngày trong game) nên tự bật/tắt, không cần cập nhật app.
// Dòng thời gian mỗi năm (giờ máy):
//   Giáng Sinh   10/11 → hết 26/12   cây thông, món Noel, khách đội mũ Noel, dây đèn, nhạc Noel
//   Tết Tây      27/12 → hết 3/1     bóng bay vàng bạc + số năm mới, dây kim tuyến, khách đội mũ tiệc
//   Chờ Tết      4/1 → trước mùng 1  đèn lồng đỏ, cây mai ra nụ rồi nở dần, đếm ngược tới Tết
//   Tết          mùng 1 → hết mùng 7 mai nở rộ treo lì xì, câu đối, dây pháo, đèn lồng
// Chạy local có thể thử ngày khác: ?ngay=2027-01-20
import { L } from './i18n'

export type Season = 'xmas' | 'newyear' | 'tetwait' | 'tet'

/** mùng 1 Tết Nguyên Đán (dương lịch) + tên năm âm lịch */
const TET: Record<number, { m: number; d: number; vi: string; en: string }> = {
  2026: { m: 1, d: 17, vi: 'Bính Ngọ', en: 'Horse' },
  2027: { m: 1, d: 6, vi: 'Đinh Mùi', en: 'Goat' },
  2028: { m: 0, d: 26, vi: 'Mậu Thân', en: 'Monkey' },
  2029: { m: 1, d: 13, vi: 'Kỷ Dậu', en: 'Rooster' },
  2030: { m: 1, d: 3, vi: 'Canh Tuất', en: 'Dog' },
  2031: { m: 0, d: 23, vi: 'Tân Hợi', en: 'Pig' },
  2032: { m: 1, d: 11, vi: 'Nhâm Tý', en: 'Rat' },
}
const DAY = 86_400_000

function testNow(): number | null {
  if (!import.meta.env.DEV) return null
  try {
    const q = new URLSearchParams(location.search).get('ngay')
    if (q) { const [y, m, d] = q.split('-').map(Number); if (y && m && d) return new Date(y, m - 1, d, 12).getTime() }
  } catch { /* bỏ qua */ }
  return null
}
const FIXED = testNow()
export const nowMs = () => FIXED ?? Date.now()

const tetOf = (y: number) => { const t = TET[y]; return t ? new Date(y, t.m, t.d).getTime() : null }

export interface SeasonInfo {
  id: Season
  /** thời điểm hết mùa */
  end: number
  /** số ngày tới Tết (chỉ có ở mùa chờ Tết) */
  tetDays?: number
  /** 0..1 – độ "đậm" của trang trí (chờ Tết: mai nở dần) */
  bloom: number
  /** năm dương lịch mới (Tết Tây) / tên năm âm lịch (Tết) */
  year: number
  lunar?: { vi: string; en: string }
}

export function seasonAt(now = nowMs()): SeasonInfo | null {
  const d = new Date(now)
  const y = d.getFullYear()
  const at = (yy: number, m: number, dd: number) => new Date(yy, m, dd).getTime()
  // Giáng Sinh
  if (now >= at(y, 10, 10) && now < at(y, 11, 27)) return { id: 'xmas', end: at(y, 11, 27), bloom: 1, year: y + 1 }
  // Tết Tây (vắt qua 2 năm)
  if (now >= at(y, 11, 27)) return { id: 'newyear', end: at(y + 1, 0, 4), bloom: 1, year: y + 1 }
  if (now < at(y, 0, 4)) return { id: 'newyear', end: at(y, 0, 4), bloom: 1, year: y }
  // Chờ Tết / Tết
  const tet = tetOf(y)
  if (tet) {
    const lunar = { vi: TET[y].vi, en: TET[y].en }
    if (now < tet) {
      const days = Math.ceil((tet - now) / DAY)
      const span = Math.max(1, (tet - at(y, 0, 4)) / DAY)
      return { id: 'tetwait', end: tet, tetDays: days, bloom: Math.max(0, Math.min(1, 1 - days / span)), year: y, lunar }
    }
    if (now < tet + 7 * DAY) return { id: 'tet', end: tet + 7 * DAY, bloom: 1, year: y, lunar }
  }
  return null
}

/** mùa hiện tại – tính 1 lần lúc mở app (đủ dùng: app mở lại mỗi ngày) */
export const SEASON = seasonAt()
export const season = (): Season | null => SEASON?.id ?? null
export const isXmasSeason = () => season() === 'xmas'
export const isTetSeason = () => season() === 'tetwait' || season() === 'tet'
export const daysLeft = () => (SEASON ? Math.max(0, Math.ceil((SEASON.end - nowMs()) / DAY)) : 0)

/** tiêu đề + mô tả thẻ sự kiện ở màn chuẩn bị */
export function seasonCard(): { title: string; text: string; tone: Season } | null {
  const s = SEASON
  if (!s) return null
  const n = daysLeft()
  if (s.id === 'xmas') return { tone: 'xmas', title: L(`SỰ KIỆN GIÁNG SINH · còn ${n} ngày`, `CHRISTMAS EVENT · ${n} days left`), text: '' }
  if (s.id === 'newyear') return {
    tone: 'newyear',
    title: L(`CHÀO NĂM ${s.year} · còn ${n} ngày`, `HAPPY NEW YEAR ${s.year} · ${n} days left`),
    text: L(`Quán treo bóng bay & kim tuyến đón năm ${s.year}. Món mới Soda đào lấp lánh lên menu, khách đội mũ tiệc tới quẩy!`,
      `Balloons & tinsel up for ${s.year}! The new Sparkling peach soda is on the menu and guests show up in party hats.`),
  }
  if (s.id === 'tetwait') return {
    tone: 'tetwait',
    title: L(`ĐẾM NGƯỢC TẾT ${s.lunar!.vi.toUpperCase()} · còn ${s.tetDays} ngày`, `LUNAR NEW YEAR (${s.lunar!.en.toUpperCase()}) · ${s.tetDays} days to go`),
    text: s.tetDays! > 14
      ? L('Đèn lồng đỏ đã treo, cây mai trong quán bắt đầu ra nụ. Món Tết đã lên menu.', 'Red lanterns are up and the apricot tree in the café is budding. Tết drinks are on the menu.')
      : L('Sắp Tết rồi! Mai nở dần từng ngày, phố đông khách sắm Tết ghé uống nước.', 'Tết is close! The apricot blossoms open a little more each day and shoppers pop in for drinks.'),
  }
  return {
    tone: 'tet',
    title: L(`CHÚC MỪNG NĂM MỚI · TẾT ${s.lunar!.vi.toUpperCase()}`, `HAPPY LUNAR NEW YEAR · YEAR OF THE ${s.lunar!.en.toUpperCase()}`),
    text: L(`Mai vàng nở rộ, lì xì treo đầy cành, câu đối đỏ trên tường. Khách du xuân đông vui, còn ${n} ngày Tết.`,
      `Golden apricot blossoms, lucky red envelopes on every branch and couplets on the wall. Spring visitors everywhere, ${n} days of Tết left.`),
  }
}
