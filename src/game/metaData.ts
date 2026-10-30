// Dữ liệu cho phần chơi dài hạn: mặt bằng, quán đối thủ, nhiệm vụ, thành tựu, album, đồ cho Cáo, công thức bí mật.
// File này KHÔNG import store để tránh vòng lặp import.
import type { Look, RecipeId, WeatherId } from './data'
import { xung, type Persona } from './voice'

// ---------- Mặt bằng ----------
export interface Premise {
  id: number
  name: string
  desc: string
  deposit: number // tiền cọc thuê
  rent: number // tiền thuê mỗi ngày
  customerMul: number
  priceMul: number // khách chịu trả giá cao hơn
  slots: number // thêm chỗ chờ
  need: { day: number; stars: number; top3?: boolean }
}
export const PREMISES: Premise[] = [
  { id: 0, name: 'Quầy nhỏ đầu dốc', desc: 'Quán đầu tiên của Yến và Cáo: nhỏ xíu, ấm cúng, nhìn ra con dốc.', deposit: 0, rent: 50_000, customerMul: 1, priceMul: 1, slots: 0, need: { day: 1, stars: 0 } },
  { id: 1, name: 'Quán gác gỗ đồi thông', desc: 'Nhà gỗ hai tầng, cửa sổ lớn nhìn đồi thông. Mở kệ bán đồ gốm & lưu niệm: khách mua kèm khi gọi nước.', deposit: 4_000_000, rent: 250_000, customerMul: 1.35, priceMul: 1.1, slots: 2, need: { day: 5, stars: 3 } },
  { id: 2, name: 'Dreamers Flagship', desc: 'Mặt tiền trung tâm: bảng menu lớn, đèn thả, quầy bar ghế cao. Mở tủ bánh tươi (croissant, cupcake, bông lan, tiramisu) bán kèm.', deposit: 15_000_000, rent: 700_000, customerMul: 1.8, priceMul: 1.2, slots: 4, need: { day: 12, stars: 4, top3: true } },
]

// ---------- Hàng bán kèm theo mặt bằng ----------
// Quán gác gỗ (mặt bằng 1) mở bán đồ gốm & lưu niệm; Flagship (mặt bằng 2) mở thêm tủ bánh.
export interface Good { id: string; name: string; kind: 'souvenir' | 'bakery'; cost: number; price: number; pack: number }
export const GOODS: Good[] = [
  { id: 'postcard', name: 'Bưu thiếp Đà Lạt', kind: 'souvenir', cost: 5_000, price: 15_000, pack: 10 },
  { id: 'mocKhoa', name: 'Móc khoá Cáo', kind: 'souvenir', cost: 15_000, price: 39_000, pack: 10 },
  { id: 'lyGom', name: 'Ly gốm men lam', kind: 'souvenir', cost: 40_000, price: 89_000, pack: 5 },
  { id: 'binhGom', name: 'Bình gốm cắm hoa', kind: 'souvenir', cost: 70_000, price: 149_000, pack: 3 },
  { id: 'croissant', name: 'Croissant bơ', kind: 'bakery', cost: 12_000, price: 29_000, pack: 10 },
  { id: 'cupcake', name: 'Cupcake dâu Đà Lạt', kind: 'bakery', cost: 10_000, price: 25_000, pack: 10 },
  { id: 'bongLan', name: 'Bông lan trứng muối', kind: 'bakery', cost: 15_000, price: 35_000, pack: 10 },
  { id: 'tiramisu', name: 'Tiramisu', kind: 'bakery', cost: 20_000, price: 45_000, pack: 6 },
]
export const goodUnlocked = (g: Good, premise: number) => (g.kind === 'souvenir' ? premise >= 1 : premise >= 2)

// ---------- Quán đối thủ trên phố ----------
export interface RivalInfo { id: string; name: string; owner: string; slogan: string; color: string; power: number }
export const RIVALS: RivalInfo[] = [
  { id: 'suong', name: 'E Di Háp Coffee', owner: 'Anh Ninh', slogan: 'Mở cửa từ 5h sáng, ế từ 6h', color: '#7fb8d9', power: 1.15 },
  { id: 'trum', name: 'Ông Trùm Phin', owner: 'Chú Tư Phin', slogan: 'Phin chậm, nói chuyện còn chậm hơn', color: '#5a3a28', power: 1.05 },
  { id: 'gac', name: 'Gác Mái Chill', owner: 'Hội anh em Indie', slogan: 'Nhạc buồn, ghế cứng, view triệu đô', color: '#c06c84', power: 0.95 },
  { id: 'may', name: 'Mây Lang Thang', owner: 'Bạn Mây Tím', slogan: 'Check-in là chính, cà phê là phụ', color: '#9b7fd0', power: 0.9 },
  { id: 'doi', name: 'Đồi Thông Bistro', owner: 'Anh Kevin Đồi', slogan: 'Brunch 200k, view sương mù free', color: '#4f9a5c', power: 0.82 },
]
/** Tin phố mỗi sáng: đối thủ làm gì đó ảnh hưởng lượng khách của bạn hôm nay */
export const RIVAL_NEWS: { text: string; mul: number }[] = [
  { text: '{shop} tung khuyến mãi mua 1 tặng 1 – khách bị hút bớt', mul: 0.88 },
  { text: '{shop} mời KOL triệu follow tới check-in – phố đông nhưng khách chia bớt', mul: 0.92 },
  { text: '{shop} bị phốt ly nhựa trong trà – khách chạy sang quán bạn', mul: 1.12 },
  { text: '{shop} đóng cửa sửa máy pha – hôm nay bạn đông khách hơn', mul: 1.1 },
  { text: '{shop} tăng giá 20% – khách quay sang quán bạn', mul: 1.08 },
  { text: '{shop} mở thêm ghế ngoài vỉa hè – cạnh tranh gắt hơn', mul: 0.93 },
  { text: '{shop} bị chê wifi yếu trên mạng – vài khách chuyển sang bạn', mul: 1.05 },
]
export const WEEK_REWARDS = [
  { beans: 30, money: 1_000_000, text: 'Cúp Vàng Phố Núi' },
  { beans: 18, money: 500_000, text: 'Á quân' },
  { beans: 10, money: 200_000, text: 'Hạng ba' },
  { beans: 5, money: 0, text: 'Cố lên' },
  { beans: 3, money: 0, text: 'Cố lên' },
  { beans: 2, money: 0, text: 'Cố lên' },
]
/** Hạng tuần ảnh hưởng lượng khách (hạng 1 → đông nhất) */
export const RANK_MUL = [1.15, 1.08, 1, 0.96, 0.92, 0.88]

// ---------- Khách hiếm (album) ----------
export interface RareCustomer {
  id: string
  name: string
  look: Look
  greet: string // {drink}
  thanks: string
  weather?: WeatherId[]
  from?: number // phần ngày 0..1
  to?: number
  minDay?: number
  chance: number // xác suất mỗi lượt khách tới khi đủ điều kiện
  beans: number
  tip: number
  hint?: RecipeId // tặng gợi ý công thức bí mật
  p: Persona // xưng hô
}
export const RARE: RareCustomer[] = [
  { id: 'cuHN', p: xung.ong(), name: 'Ông Cụ Phố Cổ', look: { skin: '#e2b48c', hair: '#e8e4de', style: 'beret', shirt: '#5a6b8a', acc: ['glasses', 'beard'] }, greet: 'Cháu ơi, ở đây có cà phê kiểu Hà Nội không? Thôi cho ông ly {drink} vậy.', thanks: 'Ngon. Gợi ý cho cháu: trứng đánh bông với cà phê, khuấy đều… nhớ Hà Nội ghê!', from: 0, to: 0.35, chance: 0.05, beans: 6, tip: 20_000, hint: 'cafeTrung' },
  { id: 'kim', p: xung.minh('f'), name: 'Kim Chi Min', look: { skin: '#f6d9c4', hair: '#d9a0c8', style: 'bob', shirt: '#ffffff', accent: '#ff9aa8', acc: ['blush', 'hoops'] }, greet: 'Annyeong! Một {drink} nha, mình đang đi tour Đà Lạt 3 ngày 2 đêm!', thanks: 'Daebak! Ở Hàn không có ly nào ngon vậy đâu ✨', weather: ['cloudy', 'sunny'], chance: 0.04, beans: 5, tip: 30_000 },
  { id: 'guitar', p: xung.anh(), name: 'Tèo Guitar Đường Phố', look: { skin: '#d9a679', hair: '#2b1d16', style: 'messy', shirt: '#3a3a3a', acc: ['chain', 'earring'] }, greet: 'Cho anh ly {drink}, anh hát tặng quán một bài “Em ơi Đà Lạt”!', thanks: '♪ Đà Lạt ơi… quán này ngon quá trời ơi ♪', from: 0.7, to: 1, chance: 0.06, beans: 5, tip: 10_000 },
  { id: 'phuot', p: xung.anh(), name: 'Tuấn Phượt Thủ', look: { skin: '#c98d62', hair: '#3a2a20', style: 'helmet', shirt: '#e8873a', accent: '#d9534f', acc: ['shades', 'beard'] }, greet: 'Mới chạy 300 cây từ Sài Gòn lên, cho ly {drink} hồi sức với!', thanks: 'Đã! Gợi ý nè: cốt dừa + cà phê + đá đem xay, uống là quên đường về.', weather: ['rainy', 'cloudy'], chance: 0.05, beans: 6, tip: 15_000, hint: 'cafeDua' },
  { id: 'coGiao', p: xung.co(), name: 'Cô Giáo Hiền Về Hưu', look: { skin: '#eac3a0', hair: '#9a9a9a', style: 'bun', shirt: '#a3c9a8', acc: ['glasses', 'scarf'] }, greet: 'Con cho cô ly {drink} ít ngọt thôi nhé, cô kiêng đường.', thanks: 'Con pha giỏi lắm. Hồi xưa cô hay pha cacao với sữa đặc khuấy rồi thêm đá cho học trò…', minDay: 3, chance: 0.05, beans: 6, tip: 10_000, hint: 'cacaoDa' },
  { id: 'ma', p: xung.custom('f', 'ta', 'người', 'người', 'tôi'), name: 'Bóng Ma Sương Mù', look: { skin: '#e8eef4', hair: '#cfd8e0', style: 'long', shirt: '#dfe7ee', acc: ['blush'] }, greet: 'Ùuu… một ly {drink}… nóng… ùuu…', thanks: 'Ùuu… ngon quá… sương mù xin chỉ: cà phê, kem trứng, cacao, kem tươi… ùuu', weather: ['rainy'], from: 0.75, to: 1, chance: 0.08, beans: 12, tip: 0, hint: 'suongMu' },
  { id: 'dau', p: xung.chu(), name: 'Chú Năm Vườn Dâu', look: { skin: '#c98d62', hair: '#2b2b2b', style: 'nonla', shirt: '#6aa84f', acc: ['mustache'] }, greet: 'Chú mới hái dâu xong, cho ly {drink} giải khát con!', thanks: 'Mai chú mang dâu xuống biếu. Matcha mà lắc với cốt dừa cũng hợp lắm nghe!', weather: ['sunny', 'hot'], from: 0.1, to: 0.6, chance: 0.05, beans: 5, tip: 20_000, hint: 'matchaDua' },
  { id: 'reviewer', p: xung.minh('m'), name: 'Food Reviewer Triệu View', look: { skin: '#f3cba8', hair: '#f2c14e', style: 'slick', shirt: '#2e3f6e', acc: ['shades', 'chain'] }, greet: 'Xin chào cả nhà, hôm nay mình review quán này! Cho mình {drink} nhé.', thanks: 'Quán này 10 điểm không có nhưng! Clip lên xu hướng là quán đông nha.', minDay: 5, chance: 0.03, beans: 10, tip: 50_000 },
]
export const rareById = Object.fromEntries(RARE.map((r) => [r.id, r])) as Record<string, RareCustomer>

/** Gợi ý công thức bí mật (lấy được thêm từ nhiệm vụ / thành tựu) */
export const SECRET_HINTS: Partial<Record<RecipeId, string>> = {
  cafeDua: 'Cốt dừa, cà phê, đá… cho vào máy xay.',
  cafeTrung: 'Kem trứng đánh bông trên nền cà phê, khuấy đều.',
  cacaoDa: 'Cacao với sữa đặc, khuấy tan rồi thêm đá.',
  matchaDua: 'Matcha gặp cốt dừa, lắc thật đều với đá.',
  cacaoKemMuoi: 'Cacao, sữa tươi, lắc với đá, phủ kem muối.',
  suongMu: 'Cà phê, kem trứng, cacao, phủ kem tươi như sương.',
}

// ---------- Đồ cho Cáo & trang trí ----------
export type OutfitSlot = 'head' | 'eyes' | 'neck' | 'body'
export interface Outfit { id: string; name: string; slot: OutfitSlot; cost: number }
export const OUTFITS: Outfit[] = [
  { id: 'nonla', name: 'Nón lá', slot: 'head', cost: 15 },
  { id: 'beret', name: 'Mũ beret nghệ sĩ', slot: 'head', cost: 20 },
  { id: 'len', name: 'Mũ len Đà Lạt', slot: 'head', cost: 25 },
  { id: 'crown', name: 'Vương miện', slot: 'head', cost: 60 },
  { id: 'shades', name: 'Kính râm ngầu', slot: 'eyes', cost: 20 },
  { id: 'heartGlasses', name: 'Kính trái tim', slot: 'eyes', cost: 25 },
  { id: 'scarf', name: 'Khăn quàng đỏ', slot: 'neck', cost: 15 },
  { id: 'bow', name: 'Nơ hồng', slot: 'neck', cost: 15 },
  { id: 'bell', name: 'Chuông vàng', slot: 'neck', cost: 30 },
  { id: 'sweater', name: 'Áo len sọc', slot: 'body', cost: 30 },
  { id: 'apron', name: 'Tạp dề barista', slot: 'body', cost: 35 },
]
export interface DecorItem { id: string; name: string; cost: number; buff: number }
export const DECOR_ITEMS: DecorItem[] = [
  { id: 'lantern', name: 'Đèn lồng giấy', cost: 20, buff: 0.03 },
  { id: 'painting', name: 'Tranh hồ Xuân Hương', cost: 30, buff: 0.04 },
  { id: 'daquy', name: 'Chậu hoa dã quỳ', cost: 25, buff: 0.03 },
  { id: 'guitar', name: 'Đàn guitar treo tường', cost: 35, buff: 0.04 },
  { id: 'vinyl', name: 'Máy hát đĩa than', cost: 50, buff: 0.06 },
  { id: 'fish', name: 'Bể cá mini', cost: 40, buff: 0.05 },
]

// ---------- Nhiệm vụ hằng ngày ----------
export type QuestKind = 'serve' | 'perfect' | 'revenue' | 'recipe' | 'chat' | 'boss' | 'app' | 'calm' | 'tips' | 'goods'
export interface Quest { kind: QuestKind; target: number; progress: number; recipe?: RecipeId; beans: number; done: boolean; text: string }

// ---------- Thành tựu ----------
export interface MetaStats { served: number; perfect: number; bossWins: number; chats: number; delivered: number; earned: number; days: number; top1: number; contests: number; questsDone: number; goodsSold: number }
export interface AchDef { id: string; name: string; desc: string; beans: number; goal: number; stat: (m: AchCtx) => number }
export interface AchCtx { s: MetaStats; album: number; albumTotal: number; secrets: number; premise: number; outfits: number; friends: number }
export const ACHIEVEMENTS: AchDef[] = [
  { id: 'serve50', name: 'Tay pha tập sự', desc: 'Phục vụ 50 ly', beans: 5, goal: 50, stat: (m) => m.s.served },
  { id: 'serve300', name: 'Barista có nghề', desc: 'Phục vụ 300 ly', beans: 12, goal: 300, stat: (m) => m.s.served },
  { id: 'serve1000', name: 'Huyền thoại phố núi', desc: 'Phục vụ 1.000 ly', beans: 30, goal: 1000, stat: (m) => m.s.served },
  { id: 'serve3000', name: 'Cỗ máy pha chế', desc: 'Phục vụ 3.000 ly', beans: 60, goal: 3000, stat: (m) => m.s.served },
  { id: 'perfect30', name: 'Chuẩn từng giọt', desc: '30 ly pha không sai bước', beans: 6, goal: 30, stat: (m) => m.s.perfect },
  { id: 'perfect200', name: 'Tay không run', desc: '200 ly pha không sai bước', beans: 15, goal: 200, stat: (m) => m.s.perfect },
  { id: 'perfect800', name: 'Thần pha chế', desc: '800 ly pha không sai bước', beans: 40, goal: 800, stat: (m) => m.s.perfect },
  // id/stat 'boss…' giữ tên cũ cho tương thích bản lưu – giờ đếm khách nước ngoài
  { id: 'boss5', name: 'Xin chào thế giới', desc: 'Phục vụ 10 khách nước ngoài', beans: 6, goal: 10, stat: (m) => m.s.bossWins },
  { id: 'boss25', name: 'Đại sứ du lịch', desc: 'Phục vụ 60 khách nước ngoài', beans: 15, goal: 60, stat: (m) => m.s.bossWins },
  { id: 'boss80', name: 'Liên hợp quốc thu nhỏ', desc: 'Phục vụ 200 khách nước ngoài', beans: 40, goal: 200, stat: (m) => m.s.bossWins },
  { id: 'days7', name: 'Tuần đầu sống sót', desc: 'Mở quán 7 ngày', beans: 5, goal: 7, stat: (m) => m.s.days },
  { id: 'days30', name: 'Một tháng mộng mơ', desc: 'Mở quán 30 ngày', beans: 20, goal: 30, stat: (m) => m.s.days },
  { id: 'days60', name: 'Dân Đà Lạt chính hiệu', desc: 'Mở quán 60 ngày', beans: 40, goal: 60, stat: (m) => m.s.days },
  { id: 'chat20', name: 'Miệng xinh', desc: 'Tám chuyện 20 lần', beans: 5, goal: 20, stat: (m) => m.s.chats },
  { id: 'chat100', name: 'Đài phát thanh phố núi', desc: 'Tám chuyện 100 lần', beans: 15, goal: 100, stat: (m) => m.s.chats },
  { id: 'earn10', name: 'Triệu phú cà phê', desc: 'Tổng doanh thu 10 triệu', beans: 10, goal: 10_000_000, stat: (m) => m.s.earned },
  { id: 'earn100', name: 'Tỷ phú phố núi', desc: 'Tổng doanh thu 100 triệu', beans: 40, goal: 100_000_000, stat: (m) => m.s.earned },
  { id: 'album25', name: 'Người quen khắp phố', desc: 'Album đạt 25%', beans: 8, goal: 25, stat: (m) => Math.floor((m.album / m.albumTotal) * 100) },
  { id: 'album60', name: 'Sổ tay dày cộp', desc: 'Album đạt 60%', beans: 20, goal: 60, stat: (m) => Math.floor((m.album / m.albumTotal) * 100) },
  { id: 'album100', name: 'Biết hết cả Đà Lạt', desc: 'Album đạt 100%', beans: 60, goal: 100, stat: (m) => Math.floor((m.album / m.albumTotal) * 100) },
  { id: 'secret1', name: 'Nhà phát minh', desc: 'Tìm ra 1 công thức bí mật', beans: 8, goal: 1, stat: (m) => m.secrets },
  { id: 'secret6', name: 'Bậc thầy công thức', desc: 'Tìm ra cả 6 công thức bí mật', beans: 50, goal: 6, stat: (m) => m.secrets },
  { id: 'premise1', name: 'Dọn nhà mới', desc: 'Thuê quán gác gỗ', beans: 10, goal: 1, stat: (m) => m.premise },
  { id: 'premise2', name: 'Lên đời Flagship', desc: 'Thuê Dreamers Flagship', beans: 30, goal: 2, stat: (m) => m.premise },
  { id: 'top1', name: 'Vua của phố', desc: 'Đứng hạng 1 tuần trên phố', beans: 15, goal: 1, stat: (m) => m.s.top1 },
  { id: 'top1x5', name: 'Bá chủ Dốc Mộng Mơ', desc: 'Hạng 1 tuần 5 lần', beans: 50, goal: 5, stat: (m) => m.s.top1 },
  { id: 'outfit3', name: 'Cáo điệu đà', desc: 'Sắm 3 món đồ cho Cáo', beans: 8, goal: 3, stat: (m) => m.outfits },
  { id: 'friends', name: 'Hội bạn thân', desc: 'Có 3 khách quen thành bạn thân', beans: 15, goal: 3, stat: (m) => m.friends },
  { id: 'goods50', name: 'Chủ tiệm lưu niệm', desc: 'Bán kèm 50 món (gốm, lưu niệm, bánh)', beans: 10, goal: 50, stat: (m) => m.s.goodsSold },
  { id: 'goods300', name: 'Đại lý phố núi', desc: 'Bán kèm 300 món', beans: 30, goal: 300, stat: (m) => m.s.goodsSold },
  { id: 'quest30', name: 'Chăm chỉ', desc: 'Hoàn thành 30 nhiệm vụ ngày', beans: 15, goal: 30, stat: (m) => m.s.questsDone },
]

// ---------- Dữ liệu lưu ----------
export interface RivalState { id: string; power: number; week: number; today: number; last: number }
export interface MetaSave {
  premise: number
  beans: number
  goods: Record<string, number> // kho hàng bán kèm
  goodsGift?: number // đã tặng hàng mở kệ tới mặt bằng số mấy
  album: Record<string, { n: number; look?: Look }>
  secrets: RecipeId[] // đã tìm ra
  hints: RecipeId[] // đã có gợi ý
  quests: { day: number; list: Quest[]; bonus: boolean }
  ach: string[] // thành tựu đã nhận
  stats: MetaStats
  outfits: string[]
  wear: Partial<Record<OutfitSlot, string>>
  decor: string[]
  rivals: RivalState[]
  week: { my: number; today: number; lastRank: number; lastResult: { rank: number; beans: number; money: number } | null; history: number[] }
  news: { day: number; text: string; mul: number } | null
  online: { token: string; lastDay: number; career: number; nick: string }
}

export function newMeta(): MetaSave {
  return {
    premise: 0,
    beans: 0,
    goods: {},
    album: {},
    secrets: [],
    hints: [],
    quests: { day: 0, list: [], bonus: false },
    ach: [],
    stats: { served: 0, perfect: 0, bossWins: 0, chats: 0, delivered: 0, earned: 0, days: 0, top1: 0, contests: 0, questsDone: 0, goodsSold: 0 },
    outfits: [],
    wear: {},
    decor: [],
    rivals: RIVALS.map((r) => ({ id: r.id, power: r.power, week: 0, today: 0, last: 0 })),
    week: { my: 0, today: 0, lastRank: 0, lastResult: null, history: [] },
    news: null,
    online: { token: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), lastDay: 0, career: 0, nick: '' },
  }
}

// không emoji trong game
import { scrubDeep } from './emoji'
scrubDeep([RARE, RIVALS, RIVAL_NEWS, SECRET_HINTS, PREMISES, GOODS])
