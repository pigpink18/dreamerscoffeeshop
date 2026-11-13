// Dữ liệu cho phần chơi dài hạn: mặt bằng, quán đối thủ, nhiệm vụ, thành tựu, album, đồ cho Cáo, công thức bí mật.
// File này KHÔNG import store để tránh vòng lặp import.
import type { Look, RecipeId, WeatherId } from './data'
import { xung, type Persona } from './voice'
import { L } from './i18n'

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
  { id: 0, name: L('Quầy nhỏ đầu dốc', 'Little hilltop counter'), desc: L('Quán đầu tiên của bạn và Cáo: nhỏ xíu, ấm cúng, nhìn ra con dốc.', 'Your very first shop with Cáo: tiny, cozy, overlooking the slope.'), deposit: 0, rent: 50_000, customerMul: 1, priceMul: 1, slots: 0, need: { day: 1, stars: 0 } },
  { id: 1, name: L('Quán gác gỗ đồi thông', 'Pine Hill Wooden Loft'), desc: L('Nhà gỗ hai tầng, cửa sổ lớn nhìn đồi thông. Mở kệ bán đồ gốm & lưu niệm: khách mua kèm khi gọi nước.', 'A two-story wooden house with big windows over the pine hills. Unlocks a pottery & souvenir shelf: guests add items to their orders.'), deposit: 4_000_000, rent: 250_000, customerMul: 1.35, priceMul: 1.1, slots: 2, need: { day: 5, stars: 3 } },
  { id: 2, name: 'Dreamers Flagship', desc: L('Mặt tiền trung tâm: bảng menu lớn, đèn thả, quầy bar ghế cao. Mở tủ bánh tươi (croissant, cupcake, bông lan, tiramisu) bán kèm.', 'Downtown storefront: big menu board, pendant lights, high bar stools. Unlocks a fresh pastry case (croissant, cupcake, sponge cake, tiramisu).'), deposit: 15_000_000, rent: 700_000, customerMul: 1.8, priceMul: 1.2, slots: 4, need: { day: 12, stars: 4, top3: true } },
]

// ---------- Hàng bán kèm theo mặt bằng ----------
// Quán gác gỗ (mặt bằng 1) mở bán đồ gốm & lưu niệm; Flagship (mặt bằng 2) mở thêm tủ bánh.
export interface Good { id: string; name: string; kind: 'souvenir' | 'bakery'; cost: number; price: number; pack: number }
export const GOODS: Good[] = [
  { id: 'postcard', name: L('Bưu thiếp Đà Lạt', 'Đà Lạt postcard'), kind: 'souvenir', cost: 5_000, price: 15_000, pack: 10 },
  { id: 'mocKhoa', name: L('Móc khoá Cáo', 'Cáo keychain'), kind: 'souvenir', cost: 15_000, price: 39_000, pack: 10 },
  { id: 'lyGom', name: L('Ly gốm men lam', 'Blue-glaze mug'), kind: 'souvenir', cost: 40_000, price: 89_000, pack: 5 },
  { id: 'binhGom', name: L('Bình gốm cắm hoa', 'Ceramic flower vase'), kind: 'souvenir', cost: 70_000, price: 149_000, pack: 3 },
  { id: 'croissant', name: L('Croissant bơ', 'Butter croissant'), kind: 'bakery', cost: 12_000, price: 29_000, pack: 10 },
  { id: 'cupcake', name: L('Cupcake dâu Đà Lạt', 'Đà Lạt strawberry cupcake'), kind: 'bakery', cost: 10_000, price: 25_000, pack: 10 },
  { id: 'bongLan', name: L('Bông lan trứng muối', 'Salted-egg sponge cake'), kind: 'bakery', cost: 15_000, price: 35_000, pack: 10 },
  { id: 'tiramisu', name: 'Tiramisu', kind: 'bakery', cost: 20_000, price: 45_000, pack: 6 },
]
export const goodUnlocked = (g: Good, premise: number) => (g.kind === 'souvenir' ? premise >= 1 : premise >= 2)

// ---------- Quán đối thủ trên phố ----------
export interface RivalInfo { id: string; name: string; owner: string; slogan: string; color: string; power: number }
export const RIVALS: RivalInfo[] = [
  { id: 'suong', name: 'E Di Háp Coffee', owner: L('Anh Ninh', 'Mr. Ninh'), slogan: L('Mở cửa từ 5h sáng, ế từ 6h', 'Open from 5 am, empty from 6'), color: '#7fb8d9', power: 1.15 },
  { id: 'trum', name: L('Ông Trùm Phin', 'The Phin Godfather'), owner: L('Chú Tư Phin', 'Uncle Tư Phin'), slogan: L('Phin chậm, nói chuyện còn chậm hơn', 'Slow drip, slower talk'), color: '#5a3a28', power: 1.05 },
  { id: 'gac', name: L('Gác Mái Chill', 'Rooftop Chill'), owner: L('Hội anh em Indie', 'The Indie Bros'), slogan: L('Nhạc buồn, ghế cứng, view triệu đô', 'Sad tunes, hard chairs, million-dollar view'), color: '#c06c84', power: 0.95 },
  { id: 'may', name: L('Mây Lang Thang', 'Drifting Cloud'), owner: L('Bạn Mây Tím', 'Purple Cloud'), slogan: L('Check-in là chính, cà phê là phụ', 'Photos first, coffee second'), color: '#9b7fd0', power: 0.9 },
  { id: 'doi', name: L('Đồi Thông Bistro', 'Pine Hill Bistro'), owner: L('Anh Kevin Đồi', 'Kevin of the Hill'), slogan: L('Brunch 200k, view sương mù free', '200k brunch, free fog view'), color: '#4f9a5c', power: 0.82 },
]
/** Tin phố mỗi sáng: đối thủ làm gì đó ảnh hưởng lượng khách của bạn hôm nay */
export const RIVAL_NEWS: { text: string; mul: number }[] = [
  { text: L('{shop} tung khuyến mãi mua 1 tặng 1 – khách bị hút bớt', '{shop} runs a buy-1-get-1 deal – some guests drift over'), mul: 0.88 },
  { text: L('{shop} mời KOL triệu follow tới check-in – phố đông nhưng khách chia bớt', '{shop} hosts a million-follower influencer – busy street, but guests are split'), mul: 0.92 },
  { text: L('{shop} bị phốt ly nhựa trong trà – khách chạy sang quán bạn', '{shop} caught with plastic in the tea – guests flock to you'), mul: 1.12 },
  { text: L('{shop} đóng cửa sửa máy pha – hôm nay bạn đông khách hơn', '{shop} closed to fix their machine – more guests for you today'), mul: 1.1 },
  { text: L('{shop} tăng giá 20% – khách quay sang quán bạn', '{shop} raises prices 20% – guests switch to you'), mul: 1.08 },
  { text: L('{shop} mở thêm ghế ngoài vỉa hè – cạnh tranh gắt hơn', '{shop} adds sidewalk seating – tougher competition'), mul: 0.93 },
  { text: L('{shop} bị chê wifi yếu trên mạng – vài khách chuyển sang bạn', '{shop} slammed online for weak wifi – a few guests come to you'), mul: 1.05 },
]
export const WEEK_REWARDS = [
  { beans: 30, money: 1_000_000, text: L('Cúp Vàng Phố Núi', 'Mountain Town Gold Cup') },
  { beans: 18, money: 500_000, text: L('Á quân', 'Runner-up') },
  { beans: 10, money: 200_000, text: L('Hạng ba', 'Third place') },
  { beans: 5, money: 0, text: L('Cố lên', 'Keep going') },
  { beans: 3, money: 0, text: L('Cố lên', 'Keep going') },
  { beans: 2, money: 0, text: L('Cố lên', 'Keep going') },
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
  { id: 'cuHN', p: xung.ong(), name: L('Ông Cụ Phố Cổ', 'Old Man from the Old Quarter'), look: { skin: '#e2b48c', hair: '#e8e4de', style: 'beret', shirt: '#5a6b8a', acc: ['glasses', 'beard'] }, greet: L('Cháu ơi, ở đây có cà phê kiểu Hà Nội không? Thôi cho ông ly {drink} vậy.', 'Do you have Hà Nội-style coffee here, dear? Never mind, a {drink} for me then.'), thanks: L('Ngon. Gợi ý cho cháu: trứng đánh bông với cà phê, khuấy đều… nhớ Hà Nội ghê!', 'Lovely. A tip for you: whipped egg over coffee, stir it well… oh, I miss Hà Nội!'), from: 0, to: 0.35, chance: 0.05, beans: 6, tip: 20_000, hint: 'cafeTrung' },
  { id: 'kim', p: xung.minh('f'), name: 'Kim Chi Min', look: { skin: '#f6d9c4', hair: '#d9a0c8', style: 'bob', shirt: '#ffffff', accent: '#ff9aa8', acc: ['blush', 'hoops'] }, greet: L('Annyeong! Một {drink} nha, mình đang đi tour Đà Lạt 3 ngày 2 đêm!', "Annyeong! One {drink} please, I'm on a 3-day Đà Lạt trip!"), thanks: L('Daebak! Ở Hàn không có ly nào ngon vậy đâu ✨', 'Daebak! Nothing this good back in Korea ✨'), weather: ['cloudy', 'sunny'], chance: 0.04, beans: 5, tip: 30_000 },
  { id: 'guitar', p: xung.anh(), name: L('Tèo Guitar Đường Phố', 'Tèo the Street Guitarist'), look: { skin: '#d9a679', hair: '#2b1d16', style: 'messy', shirt: '#3a3a3a', acc: ['chain', 'earring'] }, greet: L('Cho anh ly {drink}, anh hát tặng quán một bài “Em ơi Đà Lạt”!', "One {drink}, and I'll sing you a song about Đà Lạt!"), thanks: L('♪ Đà Lạt ơi… quán này ngon quá trời ơi ♪', '♪ Oh Đà Lạt… this café is way too good ♪'), from: 0.7, to: 1, chance: 0.06, beans: 5, tip: 10_000 },
  { id: 'phuot', p: xung.anh(), name: L('Tuấn Phượt Thủ', 'Tuấn the Road Tripper'), look: { skin: '#c98d62', hair: '#3a2a20', style: 'helmet', shirt: '#e8873a', accent: '#d9534f', acc: ['shades', 'beard'] }, greet: L('Mới chạy 300 cây từ Sài Gòn lên, cho ly {drink} hồi sức với!', 'Just rode 300 km up from Saigon, a {drink} to revive me!'), thanks: L('Đã! Gợi ý nè: cốt dừa + cà phê + đá đem xay, uống là quên đường về.', "Ahh! Tip: coconut cream + coffee + ice, blended. You'll forget the way home."), weather: ['rainy', 'cloudy'], chance: 0.05, beans: 6, tip: 15_000, hint: 'cafeDua' },
  { id: 'coGiao', p: xung.co(), name: L('Cô Giáo Hiền Về Hưu', 'Retired Teacher Hiền'), look: { skin: '#eac3a0', hair: '#9a9a9a', style: 'bun', shirt: '#a3c9a8', acc: ['glasses', 'scarf'] }, greet: L('Con cho cô ly {drink} ít ngọt thôi nhé, cô kiêng đường.', "A {drink}, dear, not too sweet please. I'm off sugar."), thanks: L('Con pha giỏi lắm. Hồi xưa cô hay pha cacao với sữa đặc khuấy rồi thêm đá cho học trò…', "You're very good, dear. I used to stir cocoa with condensed milk, then add ice, for my students…"), minDay: 3, chance: 0.05, beans: 6, tip: 10_000, hint: 'cacaoDa' },
  { id: 'ma', p: xung.custom('f', 'ta', 'người', 'người', 'tôi'), name: L('Bóng Ma Sương Mù', 'The Fog Ghost'), look: { skin: '#e8eef4', hair: '#cfd8e0', style: 'long', shirt: '#dfe7ee', acc: ['blush'] }, greet: L('Ùuu… một ly {drink}… nóng… ùuu…', 'Oooo… one {drink}… hot… oooo…'), thanks: L('Ùuu… ngon quá… sương mù xin chỉ: cà phê, kem trứng, cacao, kem tươi… ùuu', 'Oooo… delicious… the fog whispers: coffee, egg cream, cocoa, whipped cream… oooo'), weather: ['rainy'], from: 0.75, to: 1, chance: 0.08, beans: 12, tip: 0, hint: 'suongMu' },
  { id: 'dau', p: xung.chu(), name: L('Chú Năm Vườn Dâu', 'Uncle Năm the Strawberry Farmer'), look: { skin: '#c98d62', hair: '#2b2b2b', style: 'nonla', shirt: '#6aa84f', acc: ['mustache'] }, greet: L('Chú mới hái dâu xong, cho ly {drink} giải khát con!', 'Just finished picking strawberries, a {drink} to cool off, kiddo!'), thanks: L('Mai chú mang dâu xuống biếu. Matcha mà lắc với cốt dừa cũng hợp lắm nghe!', "I'll bring you strawberries tomorrow. Oh, matcha shaken with coconut cream is great too!"), weather: ['sunny', 'hot'], from: 0.1, to: 0.6, chance: 0.05, beans: 5, tip: 20_000, hint: 'matchaDua' },
  { id: 'reviewer', p: xung.minh('m'), name: L('Food Reviewer Triệu View', 'Million-View Food Reviewer'), look: { skin: '#f3cba8', hair: '#f2c14e', style: 'slick', shirt: '#2e3f6e', acc: ['shades', 'chain'] }, greet: L('Xin chào cả nhà, hôm nay mình review quán này! Cho mình {drink} nhé.', "Hey fam, today I'm reviewing this place! One {drink} please."), thanks: L('Quán này 10 điểm không có nhưng! Clip lên xu hướng là quán đông nha.', "A perfect 10, no buts! Once this clip trends, you'll be packed."), minDay: 5, chance: 0.03, beans: 10, tip: 50_000 },
]
export const rareById = Object.fromEntries(RARE.map((r) => [r.id, r])) as Record<string, RareCustomer>

/** Gợi ý công thức bí mật (lấy được thêm từ nhiệm vụ / thành tựu) */
export const SECRET_HINTS: Partial<Record<RecipeId, string>> = {
  cafeDua: L('Cốt dừa, cà phê, đá… cho vào máy xay.', 'Coconut cream, coffee, ice… into the blender.'),
  cafeTrung: L('Kem trứng đánh bông trên nền cà phê, khuấy đều.', 'Whipped egg cream over coffee, stirred well.'),
  cacaoDa: L('Cacao với sữa đặc, khuấy tan rồi thêm đá.', 'Cocoa with condensed milk, stirred, then ice.'),
  matchaDua: L('Matcha gặp cốt dừa, lắc thật đều với đá.', 'Matcha meets coconut cream, shaken hard with ice.'),
  cacaoKemMuoi: L('Cacao, sữa tươi, lắc với đá, phủ kem muối.', 'Cocoa, fresh milk, shaken with ice, topped with salt foam.'),
  suongMu: L('Cà phê, kem trứng, cacao, phủ kem tươi như sương.', 'Coffee, egg cream, cocoa, topped with whipped cream like fog.'),
}

// ---------- Đồ cho Cáo & trang trí ----------
export type OutfitSlot = 'head' | 'eyes' | 'neck' | 'body'
export interface Outfit { id: string; name: string; slot: OutfitSlot; cost: number }
export const OUTFITS: Outfit[] = [
  { id: 'nonla', name: L('Nón lá', 'Conical hat'), slot: 'head', cost: 15 },
  { id: 'beret', name: L('Mũ beret nghệ sĩ', 'Artist beret'), slot: 'head', cost: 20 },
  { id: 'len', name: L('Mũ len Đà Lạt', 'Đà Lạt beanie'), slot: 'head', cost: 25 },
  { id: 'crown', name: L('Vương miện', 'Crown'), slot: 'head', cost: 60 },
  { id: 'shades', name: L('Kính râm ngầu', 'Cool shades'), slot: 'eyes', cost: 20 },
  { id: 'heartGlasses', name: L('Kính trái tim', 'Heart glasses'), slot: 'eyes', cost: 25 },
  { id: 'scarf', name: L('Khăn quàng đỏ', 'Red scarf'), slot: 'neck', cost: 15 },
  { id: 'bow', name: L('Nơ hồng', 'Pink bow'), slot: 'neck', cost: 15 },
  { id: 'bell', name: L('Chuông vàng', 'Golden bell'), slot: 'neck', cost: 30 },
  { id: 'sweater', name: L('Áo len sọc', 'Striped sweater'), slot: 'body', cost: 30 },
  { id: 'apron', name: L('Tạp dề barista', 'Barista apron'), slot: 'body', cost: 35 },
]
export interface DecorItem { id: string; name: string; cost: number; buff: number }
export const DECOR_ITEMS: DecorItem[] = [
  { id: 'lantern', name: L('Đèn lồng giấy', 'Paper lantern'), cost: 20, buff: 0.03 },
  { id: 'painting', name: L('Tranh hồ Xuân Hương', 'Xuân Hương Lake painting'), cost: 30, buff: 0.04 },
  { id: 'daquy', name: L('Chậu hoa dã quỳ', 'Wild sunflower pot'), cost: 25, buff: 0.03 },
  { id: 'guitar', name: L('Đàn guitar treo tường', 'Wall-mounted guitar'), cost: 35, buff: 0.04 },
  { id: 'vinyl', name: L('Máy hát đĩa than', 'Vinyl record player'), cost: 50, buff: 0.06 },
  { id: 'fish', name: L('Bể cá mini', 'Mini aquarium'), cost: 40, buff: 0.05 },
]

// ---------- Nhiệm vụ hằng ngày ----------
export type QuestKind = 'serve' | 'perfect' | 'revenue' | 'recipe' | 'chat' | 'boss' | 'app' | 'calm' | 'tips' | 'goods' | 'combo'
export interface Quest { kind: QuestKind; target: number; progress: number; recipe?: RecipeId; beans: number; done: boolean; text: string }

// ---------- Thành tựu ----------
export interface MetaStats { served: number; perfect: number; bossWins: number; chats: number; delivered: number; earned: number; days: number; top1: number; contests: number; questsDone: number; goodsSold: number }
export interface AchDef { id: string; name: string; desc: string; beans: number; goal: number; stat: (m: AchCtx) => number }
export interface AchCtx { s: MetaStats; album: number; albumTotal: number; secrets: number; premise: number; outfits: number; friends: number }
export const ACHIEVEMENTS: AchDef[] = [
  { id: 'serve50', name: L('Tay pha tập sự', 'Apprentice Brewer'), desc: L('Phục vụ 50 ly', 'Serve 50 drinks'), beans: 5, goal: 50, stat: (m) => m.s.served },
  { id: 'serve300', name: L('Barista có nghề', 'Skilled Barista'), desc: L('Phục vụ 300 ly', 'Serve 300 drinks'), beans: 12, goal: 300, stat: (m) => m.s.served },
  { id: 'serve1000', name: L('Huyền thoại phố núi', 'Mountain Town Legend'), desc: L('Phục vụ 1.000 ly', 'Serve 1,000 drinks'), beans: 30, goal: 1000, stat: (m) => m.s.served },
  { id: 'serve3000', name: L('Cỗ máy pha chế', 'Brewing Machine'), desc: L('Phục vụ 3.000 ly', 'Serve 3,000 drinks'), beans: 60, goal: 3000, stat: (m) => m.s.served },
  { id: 'perfect30', name: L('Chuẩn từng giọt', 'Every Drop Perfect'), desc: L('30 ly pha không sai bước', '30 flawless drinks'), beans: 6, goal: 30, stat: (m) => m.s.perfect },
  { id: 'perfect200', name: L('Tay không run', 'Steady Hands'), desc: L('200 ly pha không sai bước', '200 flawless drinks'), beans: 15, goal: 200, stat: (m) => m.s.perfect },
  { id: 'perfect800', name: L('Thần pha chế', 'Brew God'), desc: L('800 ly pha không sai bước', '800 flawless drinks'), beans: 40, goal: 800, stat: (m) => m.s.perfect },
  // id/stat 'boss…' giữ tên cũ cho tương thích bản lưu – giờ đếm khách nước ngoài
  { id: 'boss5', name: L('Xin chào thế giới', 'Hello World'), desc: L('Phục vụ 10 khách nước ngoài', 'Serve 10 foreign guests'), beans: 6, goal: 10, stat: (m) => m.s.bossWins },
  { id: 'boss25', name: L('Đại sứ du lịch', 'Tourism Ambassador'), desc: L('Phục vụ 60 khách nước ngoài', 'Serve 60 foreign guests'), beans: 15, goal: 60, stat: (m) => m.s.bossWins },
  { id: 'boss80', name: L('Liên hợp quốc thu nhỏ', 'Mini United Nations'), desc: L('Phục vụ 200 khách nước ngoài', 'Serve 200 foreign guests'), beans: 40, goal: 200, stat: (m) => m.s.bossWins },
  { id: 'days7', name: L('Tuần đầu sống sót', 'Survived Week One'), desc: L('Mở quán 7 ngày', 'Open for 7 days'), beans: 5, goal: 7, stat: (m) => m.s.days },
  { id: 'days30', name: L('Một tháng mộng mơ', 'A Dreamy Month'), desc: L('Mở quán 30 ngày', 'Open for 30 days'), beans: 20, goal: 30, stat: (m) => m.s.days },
  { id: 'days60', name: L('Dân Đà Lạt chính hiệu', 'True Đà Lạt Local'), desc: L('Mở quán 60 ngày', 'Open for 60 days'), beans: 40, goal: 60, stat: (m) => m.s.days },
  { id: 'chat20', name: L('Miệng xinh', 'Sweet Talker'), desc: L('Tám chuyện 20 lần', 'Chat 20 times'), beans: 5, goal: 20, stat: (m) => m.s.chats },
  { id: 'chat100', name: L('Đài phát thanh phố núi', 'Mountain Town Radio'), desc: L('Tám chuyện 100 lần', 'Chat 100 times'), beans: 15, goal: 100, stat: (m) => m.s.chats },
  { id: 'earn10', name: L('Triệu phú cà phê', 'Coffee Millionaire'), desc: L('Tổng doanh thu 10 triệu', '10M total revenue'), beans: 10, goal: 10_000_000, stat: (m) => m.s.earned },
  { id: 'earn100', name: L('Tỷ phú phố núi', 'Mountain Town Tycoon'), desc: L('Tổng doanh thu 100 triệu', '100M total revenue'), beans: 40, goal: 100_000_000, stat: (m) => m.s.earned },
  { id: 'album25', name: L('Người quen khắp phố', 'Known All Over Town'), desc: L('Album đạt 25%', 'Album 25% complete'), beans: 8, goal: 25, stat: (m) => Math.floor((m.album / m.albumTotal) * 100) },
  { id: 'album60', name: L('Sổ tay dày cộp', 'Thick Notebook'), desc: L('Album đạt 60%', 'Album 60% complete'), beans: 20, goal: 60, stat: (m) => Math.floor((m.album / m.albumTotal) * 100) },
  { id: 'album100', name: L('Biết hết cả Đà Lạt', 'Knows All of Đà Lạt'), desc: L('Album đạt 100%', 'Album 100% complete'), beans: 60, goal: 100, stat: (m) => Math.floor((m.album / m.albumTotal) * 100) },
  { id: 'secret1', name: L('Nhà phát minh', 'Inventor'), desc: L('Tìm ra 1 công thức bí mật', 'Discover 1 secret recipe'), beans: 8, goal: 1, stat: (m) => m.secrets },
  { id: 'secret6', name: L('Bậc thầy công thức', 'Recipe Master'), desc: L('Tìm ra cả 6 công thức bí mật', 'Discover all 6 secret recipes'), beans: 50, goal: 6, stat: (m) => m.secrets },
  { id: 'premise1', name: L('Dọn nhà mới', 'Moving Day'), desc: L('Thuê quán gác gỗ', 'Rent the Wooden Loft'), beans: 10, goal: 1, stat: (m) => m.premise },
  { id: 'premise2', name: L('Lên đời Flagship', 'Flagship Upgrade'), desc: L('Thuê Dreamers Flagship', 'Rent Dreamers Flagship'), beans: 30, goal: 2, stat: (m) => m.premise },
  { id: 'top1', name: L('Vua của phố', 'King of the Street'), desc: L('Đứng hạng 1 tuần trên phố', 'Finish a week #1 on the street'), beans: 15, goal: 1, stat: (m) => m.s.top1 },
  { id: 'top1x5', name: L('Bá chủ Dốc Mộng Mơ', 'Ruler of Dreamy Slope'), desc: L('Hạng 1 tuần 5 lần', 'Finish #1 for 5 weeks'), beans: 50, goal: 5, stat: (m) => m.s.top1 },
  { id: 'outfit3', name: L('Cáo điệu đà', 'Fancy Cáo'), desc: L('Sắm 3 món đồ cho Cáo', 'Buy Cáo 3 outfits'), beans: 8, goal: 3, stat: (m) => m.outfits },
  { id: 'friends', name: L('Hội bạn thân', 'Best Friends Club'), desc: L('Có 3 khách quen thành bạn thân', 'Become besties with 3 regulars'), beans: 15, goal: 3, stat: (m) => m.friends },
  { id: 'goods50', name: L('Chủ tiệm lưu niệm', 'Souvenir Shopkeeper'), desc: L('Bán kèm 50 món (gốm, lưu niệm, bánh)', 'Sell 50 extras (pottery, souvenirs, pastries)'), beans: 10, goal: 50, stat: (m) => m.s.goodsSold },
  { id: 'goods300', name: L('Đại lý phố núi', 'Mountain Town Dealer'), desc: L('Bán kèm 300 món', 'Sell 300 extras'), beans: 30, goal: 300, stat: (m) => m.s.goodsSold },
  { id: 'quest30', name: L('Chăm chỉ', 'Hard Worker'), desc: L('Hoàn thành 30 nhiệm vụ ngày', 'Complete 30 daily quests'), beans: 15, goal: 30, stat: (m) => m.s.questsDone },
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
  news: { day: number; text: string; mul: number; ni?: number; rv?: string } | null
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
