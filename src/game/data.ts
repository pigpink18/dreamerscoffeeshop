// Dữ liệu tĩnh của game: nguyên liệu, công thức, nâng cấp, thời tiết, câu thoại
import { xung, type Gender, type Persona } from './voice'

export type IngredientId = 'cafe' | 'suaDac' | 'suaTuoi' | 'da' | 'ly' | 'tra' | 'dao' | 'kem' | 'matcha' | 'syrup' | 'kemTuoi' | 'dua' | 'trung' | 'cacao'
/** Bước pha: bỏ nguyên liệu (trừ hạt cà phê – dùng qua máy) hoặc thao tác */
export type ActionId = 'chiet' | 'lac' | 'xay' | 'khuay'
export type StepId = Exclude<IngredientId, 'cafe'> | ActionId
export type RecipeId = 'denDa' | 'suaDa' | 'bacXiu' | 'latte' | 'americano' | 'traDao' | 'matchaLatte' | 'cafeMuoi' | 'traDaoKem' | 'matchaKemMuoi' | 'matchaXay'
  | 'cafeDua' | 'cafeTrung' | 'cacaoDa' | 'matchaDua' | 'cacaoKemMuoi' | 'suongMu'
export type UpgradeId = 'staff' | 'machine' | 'decor' | 'sign' | 'freezer' | 'shipper' | 'green' | 'farmer'
export type WeatherId = 'sunny' | 'hot' | 'cloudy' | 'rainy'

export type HairStyle = 'short' | 'long' | 'bun' | 'messy' | 'bob' | 'shoulder' | 'spiky' | 'nonla' | 'helmet' | 'hardhat' | 'cap' | 'beret' | 'slick' | 'afro' | 'combover' | 'mohawk' | 'curlers' | 'sunhat'
export type Acc = 'glasses' | 'tie' | 'collar' | 'hoodie' | 'beard' | 'blush' | 'earring' | 'shades' | 'chain' | 'unibrow' | 'mustache' | 'lipstick' | 'catglasses' | 'bottleglasses' | 'nosering' | 'hoops' | 'scarf' | 'tattoobrow' | 'goldtooth'
/** Ngoại hình nhân vật pixel */
export interface Look { skin: string; hair: string; style: HairStyle; shirt: string; accent?: string; acc?: Acc[] }

export interface Ingredient {
  id: IngredientId
  name: string
  icon: string
  packSize: number
  packPrice: number
}

export interface Recipe {
  id: RecipeId
  name: string
  icon: string
  steps: StepId[] // thứ tự pha chế
  fairPrice: number // giá "hợp lý" khách chấp nhận
  unlockCost: number // 0 = có sẵn
  popularity: number // trọng số khách chọn món
  hotBonus: number // khách thích hơn khi trời nóng
  coffee: boolean // có dùng cà phê (ảnh hưởng nâng cấp nông dân)
  family: 'coffee' | 'matcha' | 'tea'
  secret?: boolean // công thức bí mật: tự mò ra ở Phòng thử món
}

export interface Upgrade {
  id: UpgradeId
  name: string
  icon: string
  desc: string
  costs: number[] // giá từng cấp
  social?: boolean // nâng cấp mang giá trị xã hội
  effect: (lvl: number) => string // mô tả hiệu quả ở cấp hiện tại
}

export interface Weather {
  id: WeatherId
  name: string
  icon: string
  customerMul: number
  deliveryMul: number // trời mưa → nhiều đơn app hơn
  hot: number // 0..1 – mức độ nóng
}

export const INGREDIENTS: Ingredient[] = [
  { id: 'cafe', name: 'Cà phê bột', icon: '☕', packSize: 20, packPrice: 60_000 },
  { id: 'suaDac', name: 'Sữa đặc', icon: '🥫', packSize: 20, packPrice: 40_000 },
  { id: 'suaTuoi', name: 'Sữa tươi', icon: '🥛', packSize: 10, packPrice: 35_000 },
  { id: 'da', name: 'Đá viên', icon: '🧊', packSize: 30, packPrice: 20_000 },
  { id: 'ly', name: 'Ly', icon: '🥤', packSize: 50, packPrice: 50_000 },
  { id: 'tra', name: 'Trà', icon: '🍵', packSize: 20, packPrice: 30_000 },
  { id: 'dao', name: 'Đào ngâm', icon: '🍑', packSize: 10, packPrice: 60_000 },
  { id: 'kem', name: 'Kem muối', icon: '🧂', packSize: 10, packPrice: 50_000 },
  { id: 'matcha', name: 'Bột matcha', icon: '🍵', packSize: 15, packPrice: 90_000 },
  { id: 'syrup', name: 'Syrup đường', icon: '🍯', packSize: 30, packPrice: 40_000 },
  { id: 'kemTuoi', name: 'Kem tươi', icon: '🍦', packSize: 15, packPrice: 60_000 },
  // nguyên liệu bí mật: hiện trong Kho khi có gợi ý công thức cần tới
  { id: 'dua', name: 'Cốt dừa', icon: '🥥', packSize: 10, packPrice: 70_000 },
  { id: 'trung', name: 'Kem trứng', icon: '🥚', packSize: 10, packPrice: 60_000 },
  { id: 'cacao', name: 'Bột cacao', icon: '🍫', packSize: 15, packPrice: 80_000 },
]

export type SoundName = 'cup' | 'ice' | 'pour' | 'drip' | 'squeeze' | 'stir' | 'plop' | 'shake' | 'blend'

/** Thông tin hiển thị cho từng bước pha chế */
export const STEPS: Record<StepId, { label: string; icon: string; kind: 'ing' | 'act'; color?: string; sound: SoundName; ms: number }> = {
  ly: { label: 'Ly', icon: '🥤', kind: 'ing', sound: 'cup', ms: 250 },
  da: { label: 'Đá', icon: '🧊', kind: 'ing', sound: 'ice', ms: 300 },
  suaDac: { label: 'Sữa đặc', icon: '🥫', kind: 'ing', color: '#ead3a4', sound: 'squeeze', ms: 350 },
  suaTuoi: { label: 'Sữa tươi', icon: '🥛', kind: 'ing', color: '#fbf6ec', sound: 'pour', ms: 350 },
  tra: { label: 'Trà', icon: '🫖', kind: 'ing', color: '#c98a2b', sound: 'pour', ms: 350 },
  dao: { label: 'Đào', icon: '🍑', kind: 'ing', color: '#f4a46e', sound: 'plop', ms: 300 },
  kem: { label: 'Kem muối', icon: '🧂', kind: 'ing', color: '#fffaf0', sound: 'squeeze', ms: 350 },
  matcha: { label: 'Matcha', icon: '🍵', kind: 'ing', color: '#7fb34d', sound: 'pour', ms: 350 },
  syrup: { label: 'Syrup', icon: '🍯', kind: 'ing', color: '#e0a03a', sound: 'squeeze', ms: 300 },
  kemTuoi: { label: 'Kem tươi', icon: '🍦', kind: 'ing', color: '#ffffff', sound: 'squeeze', ms: 350 },
  dua: { label: 'Cốt dừa', icon: '🥥', kind: 'ing', color: '#f6f0e2', sound: 'pour', ms: 350 },
  trung: { label: 'Kem trứng', icon: '🥚', kind: 'ing', color: '#f3d27a', sound: 'squeeze', ms: 350 },
  cacao: { label: 'Cacao', icon: '🍫', kind: 'ing', color: '#6b3f2a', sound: 'pour', ms: 350 },
  chiet: { label: 'Chiết xuất', icon: '☕', kind: 'act', color: '#4b2e1e', sound: 'drip', ms: 1100 },
  lac: { label: 'Lắc', icon: '🍸', kind: 'act', sound: 'shake', ms: 1000 },
  xay: { label: 'Xay', icon: '🌀', kind: 'act', sound: 'blend', ms: 1100 },
  khuay: { label: 'Khuấy', icon: '🥄', kind: 'act', sound: 'stir', ms: 550 },
}

export const RECIPES: Recipe[] = [
  // 5 món có sẵn từ ngày đầu
  { id: 'denDa', name: 'Cà phê đen đá', icon: '☕', steps: ['ly', 'da', 'chiet', 'khuay'], fairPrice: 20_000, unlockCost: 0, popularity: 1, hotBonus: 0.2, coffee: true, family: 'coffee' },
  { id: 'suaDa', name: 'Cà phê sữa đá', icon: '🧋', steps: ['ly', 'suaDac', 'chiet', 'khuay', 'da'], fairPrice: 25_000, unlockCost: 0, popularity: 1.4, hotBonus: 0.2, coffee: true, family: 'coffee' },
  { id: 'bacXiu', name: 'Bạc xỉu', icon: '🥛', steps: ['ly', 'suaDac', 'suaTuoi', 'da', 'chiet'], fairPrice: 29_000, unlockCost: 0, popularity: 1.1, hotBonus: 0.1, coffee: true, family: 'coffee' },
  { id: 'latte', name: 'Latte đá', icon: '🥛', steps: ['ly', 'da', 'suaTuoi', 'chiet'], fairPrice: 35_000, unlockCost: 0, popularity: 1, hotBonus: 0.2, coffee: true, family: 'coffee' },
  { id: 'traDao', name: 'Trà đào', icon: '🍑', steps: ['ly', 'da', 'tra', 'dao', 'syrup', 'lac'], fairPrice: 35_000, unlockCost: 0, popularity: 1.1, hotBonus: 1.2, coffee: false, family: 'tea' },
  // mở khoá dần: hết mỗi ngày bán được tặng 1 món mới (hoặc mua sớm trong tab Menu)
  { id: 'matchaLatte', name: 'Matcha latte', icon: '🍵', steps: ['ly', 'da', 'matcha', 'suaTuoi', 'syrup', 'lac'], fairPrice: 39_000, unlockCost: 250_000, popularity: 1.3, hotBonus: 0.6, coffee: false, family: 'matcha' },
  { id: 'americano', name: 'Americano đá', icon: '🧊', steps: ['ly', 'da', 'chiet', 'chiet'], fairPrice: 32_000, unlockCost: 250_000, popularity: 0.9, hotBonus: 0.3, coffee: true, family: 'coffee' },
  { id: 'cafeMuoi', name: 'Cà phê muối', icon: '🧂', steps: ['ly', 'da', 'chiet', 'kem'], fairPrice: 35_000, unlockCost: 350_000, popularity: 1.3, hotBonus: 0.3, coffee: true, family: 'coffee' },
  { id: 'traDaoKem', name: 'Trà đào kem tươi', icon: '🍑', steps: ['ly', 'da', 'tra', 'dao', 'lac', 'kemTuoi'], fairPrice: 42_000, unlockCost: 400_000, popularity: 1, hotBonus: 1, coffee: false, family: 'tea' },
  { id: 'matchaKemMuoi', name: 'Matcha kem muối', icon: '🍵', steps: ['ly', 'da', 'matcha', 'suaTuoi', 'lac', 'kem'], fairPrice: 45_000, unlockCost: 500_000, popularity: 1.2, hotBonus: 0.6, coffee: false, family: 'matcha' },
  { id: 'matchaXay', name: 'Matcha đá xay', icon: '🍧', steps: ['ly', 'matcha', 'suaTuoi', 'da', 'xay', 'kemTuoi'], fairPrice: 49_000, unlockCost: 650_000, popularity: 1.2, hotBonus: 1, coffee: false, family: 'matcha' },
  // công thức bí mật: phải tự thử đúng thứ tự ở Phòng thử món (gợi ý nhận từ khách hiếm, nhiệm vụ, thành tựu)
  { id: 'cafeDua', name: 'Cà phê cốt dừa', icon: '🥥', steps: ['ly', 'dua', 'chiet', 'da', 'xay'], fairPrice: 45_000, unlockCost: 0, popularity: 1.5, hotBonus: 1, coffee: true, family: 'coffee', secret: true },
  { id: 'cafeTrung', name: 'Cà phê trứng', icon: '🥚', steps: ['ly', 'chiet', 'trung', 'khuay'], fairPrice: 45_000, unlockCost: 0, popularity: 1.4, hotBonus: 0, coffee: true, family: 'coffee', secret: true },
  { id: 'cacaoDa', name: 'Ca cao sữa đá', icon: '🍫', steps: ['ly', 'cacao', 'suaDac', 'khuay', 'da'], fairPrice: 35_000, unlockCost: 0, popularity: 1.3, hotBonus: 0.6, coffee: false, family: 'tea', secret: true },
  { id: 'matchaDua', name: 'Matcha cốt dừa', icon: '🍵', steps: ['ly', 'da', 'matcha', 'dua', 'lac'], fairPrice: 49_000, unlockCost: 0, popularity: 1.4, hotBonus: 0.8, coffee: false, family: 'matcha', secret: true },
  { id: 'cacaoKemMuoi', name: 'Cacao kem muối', icon: '🍫', steps: ['ly', 'da', 'cacao', 'suaTuoi', 'lac', 'kem'], fairPrice: 49_000, unlockCost: 0, popularity: 1.3, hotBonus: 0.5, coffee: false, family: 'tea', secret: true },
  { id: 'suongMu', name: 'Sương Mù Đà Lạt', icon: '🌫️', steps: ['ly', 'chiet', 'trung', 'cacao', 'kemTuoi'], fairPrice: 65_000, unlockCost: 0, popularity: 1.8, hotBonus: 0, coffee: true, family: 'coffee', secret: true },
]
/** Món có sẵn từ đầu & thứ tự món mới được tặng sau mỗi ngày bán */
export const STARTER_RECIPES: RecipeId[] = ['denDa', 'suaDa', 'bacXiu', 'latte', 'traDao']
export const UNLOCK_ORDER: RecipeId[] = ['matchaLatte', 'americano', 'cafeMuoi', 'traDaoKem', 'matchaKemMuoi', 'matchaXay']

/** Nguyên liệu cần cho 1 ly (tính từ các bước; chiết xuất dùng 1 phần cà phê) */
export function stepIngredient(s: StepId): IngredientId | null {
  if (s === 'chiet') return 'cafe'
  return STEPS[s].kind === 'ing' ? (s as IngredientId) : null
}
export function recipeNeeds(r: Recipe): Partial<Record<IngredientId, number>> {
  const out: Partial<Record<IngredientId, number>> = {}
  for (const s of r.steps) {
    const ing = stepIngredient(s)
    if (ing) out[ing] = (out[ing] ?? 0) + 1
  }
  return out
}

// Review khi khách cầm ly lên uống tại quầy (có khen có chê, hài hước)
export const COUNTER_REVIEWS: Record<number, string[]> = {
  5: [
    'Ngon tới mức {t} muốn xin công thức mà sợ quán giận 🤭',
    'Ly này với người yêu, {t} chọn ly 💘',
    'Uống xong tự nhiên thấy mình đẹp hơn hẳn ✨',
    'Pha nhanh hơn crush seen tin nhắn {t}, mà ngon hơn nhiều 😌',
    '10/10, sẽ quay lại ngày mai, ngày mốt, ngày kia…',
    'Ngon xỉu! Uống một ngụm tưởng đang ngồi Đà Lạt luôn á 🌲',
    '10 điểm! Ly này đăng story là crush rep liền',
    'Vị chuẩn bài, quán này chắc tu luyện 10 năm trên núi 😤✨',
    'Đỉnh nóc kịch trần! Mai {t} dắt cả đám tới phá quán',
    'Ngon tới mức muốn khóc, mà thôi khóc mặn mất 🥹',
  ],
  4: [
    'Ngon nha, mà chờ lâu tới mức {t} viết xong luận văn 📚',
    'Vị ổn áp, chỉ là {t} già thêm 2 tuổi lúc chờ',
    'Ngon, mà đá nhiều quá, {t} tưởng đang ở Bắc Cực 🐧',
    'Cho 4 sao, 1 sao còn lại {t} giữ làm kỷ niệm',
    'Ngon thiệt, mà đợi lâu tới mức {t} lướt hết TikTok rồi 😅',
    'Vị 10 điểm, tốc độ 6 điểm, tổng kết vẫn iu',
    'Đáng chờ đó, nhưng lần sau nhanh xíu cho {t} kịp vào ca nha',
    'Ngon, mà nãy {t} suýt mọc rễ trước quầy luôn 🌱',
  ],
  3: [
    'Uống giống bài kiểm tra 15 phút: không tệ nhưng không nhớ gì',
    'Vị này lần đầu {t} thấy trên đời, chưa biết nên vui hay buồn 😐',
    'Được cái ly đẹp, còn nước thì… để {t} suy nghĩ thêm',
    'Barista pha bằng cả trái tim, mà hình như quên não ở nhà 🧠',
    'Uống được nha, mà hình như ly này hơi “sáng tạo” so với menu 🤔',
    'Ngọt ngọt nhạt nhạt, giống tình cảm người yêu cũ',
    'Tạm ổn, barista hôm nay đang thất tình hả?',
    'Vị lạ lạ, mà thôi lạ cũng là một loại trải nghiệm 😶',
  ],
  2: [
    'Uống một ngụm nhớ lại tuổi thơ… toàn mấy lần bị phạt 😵',
    '{T} đang phân vân đây là cà phê hay nước rửa ly 🫠',
    'Ly nước này dạy {t} bài học: đừng tin vào menu',
    '2 sao: 1 cho cái ly, 1 cho cái ống hút',
    '{T} gọi {drink} mà uống vô thấy giống… thử thách sinh tồn 🫠',
    'Uống xong {t} phải ngồi suy nghĩ lại cuộc đời 😵‍💫',
    'Cảm ơn quán đã cho {t} biết thế nào là plot twist trong một ly nước',
    'Thôi lần sau {t} tự pha ở nhà cho lành 🙂',
  ],
}
export const FAMILY_REVIEWS: Record<'coffee' | 'matcha' | 'tea', { good: string[]; meh: string[] }> = {
  coffee: {
    good: ['Đậm đà như deadline cuối tuần, mê!', 'Cà phê thơm phức, tỉnh như sáo luôn ☕'],
    meh: ['Cà phê này tỉnh thì tỉnh thật, tỉnh luôn tới 3h sáng ngồi nghĩ về cuộc đời 😵‍💫'],
  },
  matcha: {
    good: ['Matcha thơm xỉu, xanh như hy vọng qua môn của {t} 🍵', 'Béo béo thơm thơm, chuẩn gu Gen Z luôn'],
    meh: ['Matcha ngon mà hơi ngọt, ngọt như lời hứa của sếp 😏'],
  },
  tea: {
    good: ['Trà đào thanh mát, uống xong thấy đời bớt drama 🍑'],
    meh: ['Trà ngon mà đào hơi ít, đào đâu rồi quán ơi? 🔍'],
  },
}

export const UPGRADES: Upgrade[] = [
  { id: 'staff', name: 'Thuê pha chế', icon: '🧑‍🍳', desc: 'Nhân viên pha chế đứng quầy cạnh bạn, tự pha cho khách xếp hàng phía sau và đơn app (bạn lo khách đứng đầu). Quán đông hơn 15%/người. Lương 60k/ngày/người. (Nhân viên phục vụ thuê ở Khu ngồi.)', costs: [300_000, 700_000, 1_400_000],
    effect: (l) => (l ? `${l} pha chế đang làm · tự pha cho khách xếp hàng` : 'Chưa có pha chế') },
  { id: 'machine', name: 'Máy espresso xịn hơn', icon: '⚙️', desc: 'Đổi máy mới trên quầy: chiết xuất nhanh hơn cho cả bạn lẫn nhân viên.', costs: [400_000, 900_000, 2_000_000],
    effect: (l) => `Chiết xuất ${(1.1 / (1 + 0.35 * l)).toFixed(1)}s/lần · nhân viên pha ${(5 / (1 + 0.4 * l)).toFixed(1)}s/ly` },
  { id: 'shipper', name: 'Shipper rapper', icon: '🛵', desc: 'Mở bán trên app DreamersFood. Shipper vừa giao vừa rap. Lương 70k/ngày.', costs: [350_000, 800_000],
    effect: (l) => (l ? `${l} shipper · nhận đơn app` : 'Chưa bán online') },
  { id: 'decor', name: 'Bàn ghế & trang trí', icon: '🪴', desc: 'Quán đẹp hơn (thấy ngay trong cảnh quán): thêm khách, thêm chỗ chờ, khách kiên nhẫn hơn.', costs: [250_000, 500_000, 1_000_000, 2_000_000],
    effect: (l) => `+${l * 12}% khách · chỗ chờ ${4 + l} · kiên nhẫn +${l * 10}%` },
  { id: 'sign', name: 'Biển hiệu & TikTok', icon: '📣', desc: 'Biển đèn neon, cờ dây, poster TikTok (thấy trong quán): nhiều khách ghé hơn.', costs: [200_000, 500_000, 1_200_000],
    effect: (l) => `+${l * 20}% khách ghé quán` },
  { id: 'freezer', name: 'Tủ đông', icon: '❄️', desc: 'Giữ đá không bị tan khi qua ngày mới.', costs: [350_000],
    effect: (l) => (l ? 'Đá được giữ lại qua đêm' : 'Đá còn dư tan hết cuối ngày') },
  { id: 'green', name: 'Sống xanh', icon: '🌱', desc: 'Ly giấy, ống hút tre, giảm giá khi mang ly riêng. Gen Z mê: +10% khách.', costs: [300_000], social: true,
    effect: (l) => (l ? '+10% khách · tiết kiệm ly nhựa' : 'Chưa áp dụng') },
  { id: 'farmer', name: 'Cà phê sạch Cầu Đất', icon: '👩‍🌾', desc: 'Mua thẳng từ nông dân, trả giá công bằng. Khách sẵn lòng trả thêm 15% cho món cà phê.', costs: [500_000], social: true,
    effect: (l) => (l ? 'Món cà phê được trả giá cao hơn 15%' : 'Chưa áp dụng') },
]

export const WEATHERS: Weather[] = [
  { id: 'sunny', name: 'Nắng đẹp', icon: '☀️', customerMul: 1.1, deliveryMul: 0.9, hot: 0.5 },
  { id: 'hot', name: 'Nắng nóng', icon: '🔥', customerMul: 1.25, deliveryMul: 1.2, hot: 1 },
  { id: 'cloudy', name: 'Nhiều mây', icon: '⛅', customerMul: 1, deliveryMul: 1, hot: 0.3 },
  { id: 'rainy', name: 'Mưa', icon: '🌧️', customerMul: 0.65, deliveryMul: 1.7, hot: 0 },
]

export const CUSTOMER_FACES = ['🧑', '👩', '👨', '🧓', '👱‍♀️', '👱', '🧑‍💻', '👩‍💼', '👨‍🔧', '🧑‍🎓', '👷', '🧔', '👩‍🦰', '👨‍🦱', '🧑‍🎤', '👩‍🎨']

// ---------- Câu thoại Gen Z (vui, không tục) ----------
// Câu khách nói dùng mã xưng hô {t} {b} {k} {y} (xem voice.ts) để khớp với từng khách
export const LINES = {
  impatient: [
    'Ủa alo, quán ơi? 📞',
    'Ét o ét 🆘',
    'Chờ hơi bị lâu rồi á nha',
    '{T} đợi mòn mỏi luôn 🥲',
    'Khum ổn rồi đó quán ơi',
    'Lâu dữ thần vậy trời',
    'Ly của {t} đang đi lạc hả {b}?',
    'Đợi tới mọc rễ luôn rồi 🌱',
    'Nhanh lên xíu đi mà {b} 🥺',
    '{T} đang ở level kiên nhẫn cuối cùng',
  ],
  angry: [
    'Chờ lâu tới mức pin điện thoại từ 100 còn 1% 🪫',
    'Thôi {t} về đặt app cho lẹ 📱',
    'Quán đang trồng cà phê từ hạt hả trời?',
    'Quán chill quá, chill tới mức {t} đi về luôn 🙂',
    'Đợi lâu xỉu ngang, out!',
    'Toang rồi, {t} đi quán khác đây 🏃',
    'Chờ đợi là hạnh phúc… nhưng hôm nay thì không',
    'Ủa tưởng quán bán cà phê, ai ngờ bán sự chờ đợi?',
    'Bủh bủh, khum chờ nữa đâu',
    'Hết cứu thiệt sự 💀',
    'Ly cà phê này chắc giao ở kiếp sau',
    'Thôi để dành 1 sao cho quán nha 🙂',
    '{T} là con người, không phải cây xương rồng',
  ],
  happy: [
    'Ngon như được crush rep tin nhắn lúc 2h sáng',
    'Ly này chữa lành tâm hồn em 🩹',
    'Hết nước chấm, à nhầm, hết ý kiến 👌',
    'Đỉnh nóc kịch trần bay phấp phới! 🚀',
    'Ngon xỉu up xỉu down',
    '10 điểm không có nhưng 💯',
    'Quá là slay luôn ✨',
    'Mãi mận mãi keo với quán 🍑',
    'Chân ái là đây chứ đâu',
    'Xịn xò con bò 🐄',
    'Iu quán nhứt nè 🫶',
    'Uống xong tỉnh hơn crush rep tin nhắn',
    'Vibe quán này hợp gu tui ghê',
    'Check-in liền cho hội bạn thân!',
  ],
  tooExpensive: ['💸 Đắt quá trời', '💸 Ví mỏng rồi', '💸 Cuối tháng mà', '💸 Thôi để bữa khác'],
  full: ['🚶 Đông quá, thôi', '🚶 Hết chỗ rồi', '🚶 Chờ chi cho mệt'],
}

export const REVIEWS = {
  5: ['Shipper rap hay tới mức hàng xóm ra xin follow 🎤', 'Ly tới nơi đá còn lạnh hơn thái độ người yêu cũ', 'Đặt 1 ly, nghiện cả đời, ai chịu trách nhiệm đây?', 'Ship nhanh như flow, nước ngon xỉu, 5 sao không bàn cãi!', 'Anh shipper rap hay quá trời, cà phê thì đỉnh nóc', 'Đá còn nguyên, vị chuẩn bài, sẽ quay lại 🫶', 'Quá là slay, order lần thứ n rồi', 'Uống một ngụm là deadline tự chạy 🏃'],
  4: ['Ngon nha, mà shipper rap dài, em nghe hết 1 album mới nhận được ly', 'Nước ngon, mỗi tội ống hút bị bẻ cong theo flow', 'Ngon nha, ship hơi lâu xíu thôi', 'Ổn áp, lần sau nhanh hơn chút là perfect', 'Vị ok, shipper dễ thương, rap hơi lạc beat 😆'],
  3: ['Tạm được, đá tan còn nhanh hơn deadline của em', 'Không tệ, nhưng chưa đủ để em bỏ trà sữa', 'Tạm ổn, đá tan hơi nhiều rồi', 'Bình thường thôi, chờ hơi lâu', 'Nước được mà giao chậm quá'],
  2: ['Ly tới nơi thì nước đã thành nước lọc pha màu 🥲', 'Giao trễ tới mức em tự pha ở nhà xong rồi', 'Chờ mòn mỏi, nước tới thì nhạt như tình cũ', 'Giao trễ dữ thần, hơi buồn'],
  1: ['Đơn đi lạc còn hơn khách du lịch giữa mấy con dốc Đà Lạt 🥲', 'Chờ tới mức em quên luôn mình đã đặt món gì', 'Đơn bị huỷ vì chờ quá lâu, buồn ghê 🥲', 'Đặt từ sáng tới chiều chưa thấy, out!', 'Hết cứu, không đặt nữa đâu'],
} as Record<number, string[]>

export const SHIPPERS = [
  { name: 'MC Phin', face: '🧑‍🎤' },
  { name: 'Lil Sữa Đá', face: '😎' },
]

export const RAPS = [
  'Yo! Ly này còn lạnh, giao liền tay, khách chờ không lâu, năm sao bay ngay! 🎤',
  'Mưa không cản bước, nắng chẳng ngăn đường, cà phê Dreamers thơm cả phố phường! 🎤',
  'Check it! Trà đào mát lạnh trên con xe, giao tới nơi khách gật gù khen phê! 🎤',
  'Một ly đen đá, đậm đà tình thương, qua mấy ngã tư vẫn đúng giờ như thường! 🎤',
  'Đơn tới là đi, không đợi không chờ, flow thì mượt, ship thì đúng giờ! 🎤',
  'Đội mũ bảo hiểm, an toàn là trên hết, giao nhanh mà chắc, khách không phải hết kiên nhẫn! 🎤',
]

// Tên vui cho khách vãng lai (chọn theo kiểu tóc nữ/nam) và khách đặt app
export const FEMALE_NAMES = ['Linda Lụa', 'Cindy Cà Pháo', 'Rosie Rau Má', 'Lisa Lúa Mới', 'Anna Ăn Vặt', 'Jessie Bánh Tráng', 'Mimi Mì Cay', 'Lucy Lẩu Thái', 'Nancy Nem Chua', 'Kitty Khoai Lang', 'Daisy Dâu Tằm', 'Bé Bơ Sáp']
export const MALE_NAMES = ['Tèo Em', 'Kenny Kều', 'Bin Sữa Chua', 'Jack Mì Tôm', 'Peter Phở Bò', 'Tom Trà Đá', 'Mít Tơ Bean', 'Bảo Bánh Bao', 'Johnny Chè Thái', 'Tony Tôm Chiên', 'Danny Dưa Hấu', 'Bobby Bột Chiên']
export const ORDER_NAMES = [...FEMALE_NAMES, ...MALE_NAMES]
export const funnyName = (g: Gender) => pick(g === 'f' ? FEMALE_NAMES : MALE_NAMES)

/** Người khó khăn nhận ly cà phê treo */
export const NEEDY: { face: string; who: string; thanks: string; look: Look }[] = [
  { face: '🧓', who: 'Chú xe ôm', thanks: 'Cảm ơn con nha, ly cà phê ấm lòng ghê!', look: { skin: '#d9a679', hair: '#3a3a3a', style: 'helmet', shirt: '#5f7d4a', accent: '#4f8a3c' } },
  { face: '👵', who: 'Cô bán vé số', thanks: 'Quán dễ thương quá, cô cảm ơn nhiều nha!', look: { skin: '#e2b48c', hair: '#555', style: 'nonla', shirt: '#d98c8c' } },
  { face: '🧑‍🎓', who: 'Bạn sinh viên cuối tháng', thanks: 'Cứu một mạng người cuối tháng, iu quán! 🫶', look: { skin: '#f3cba8', hair: '#2b1d16', style: 'short', shirt: '#e8a33d', acc: ['glasses'] } },
  { face: '👷', who: 'Anh công nhân', thanks: 'Uống xong làm tiếp ca chiều có sức rồi!', look: { skin: '#cf9a6c', hair: '#222', style: 'hardhat', shirt: '#e8873a' } },
  { face: '👴', who: 'Bác ve chai', thanks: 'Bác cảm ơn mấy đứa, tốt bụng quá!', look: { skin: '#d8a982', hair: '#cfcac4', style: 'cap', shirt: '#8a7a66', accent: '#6f8fa8', acc: ['beard'] } },
]

export const DAY_LENGTH = 180 // giây mô phỏng cho 1 ngày (7:00 → 21:00)
export const OPEN_HOUR = 7
export const CLOSE_HOUR = 21
export const STAFF_WAGE = 60_000
export const SHIPPER_WAGE = 70_000
export const RENT = 50_000
export const START_MONEY = 300_000

export const ingredientById = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i])) as Record<IngredientId, Ingredient>
export const recipeById = Object.fromEntries(RECIPES.map((r) => [r.id, r])) as Record<RecipeId, Recipe>
export const weatherById = Object.fromEntries(WEATHERS.map((w) => [w.id, w])) as Record<WeatherId, Weather>

export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export const money = (n: number) => Math.round(n).toLocaleString('vi-VN') + 'đ'
export const moneyShort = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (a >= 1_000_000) return s + (a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace('.0', '') + 'tr'
  if (a >= 1_000) return s + Math.round(a / 1_000) + 'k'
  return s + Math.round(a) + 'đ'
}

// ---------- Hội thoại & khách quen (kiểu nói chuyện quán cà phê Việt) ----------
export interface ChatTopic {
  say: string // khách mở lời
  replies: { text: string; answer: string; bond: number; sassy?: boolean }[] // lựa chọn của chủ quán → khách đáp (sassy = câu cà khịa)
}

export interface Regular {
  id: string
  name: string
  face: string
  role: string
  fav: RecipeId[] // món ruột (ưu tiên theo thứ tự, lấy món đã mở khoá)
  look: Look
  greet: [string, string, string] // theo mức thân: người lạ / khách quen / bạn thân ({drink} = tên món)
  chats: ChatTopic[]
  p: Persona // xưng hô (dùng khi khách nói câu chung như review)
}

export const REGULARS: Regular[] = [
  {
    id: 'tomy', name: 'Tomy Tèo', face: '🏋️', role: 'Gymer, đếm calo từng giọt',
    p: xung.anh(),
    fav: ['americano', 'denDa'],
    look: { skin: '#e2b089', hair: '#2b1d16', style: 'spiky', shirt: '#e8503a', acc: ['blush'] },
    greet: [
      'Cho anh {drink}, không đường, không sữa, không cảm xúc 💪',
      'Ê bro, {drink} như cũ, anh vừa đẩy ngực 100kg xong!',
      'Bro ơi! Như cũ nha, hôm nay anh lên cơ bụng múi thứ 6 rồi 🔥',
    ],
    chats: [
      { say: 'Ly này nhiêu calo vậy em? Anh đang siết cơ', replies: [
        { text: 'Gần như 0 calo, chỉ có toàn cơ bắp thôi anh', answer: 'Haha em nói chuẩn, mai anh dắt cả phòng gym qua! 💪', bond: 9 },
        { text: 'Em không biết nữa', answer: 'Ờ… thôi uống đại 😅', bond: 2 },
      ] },
      { say: 'Em có tập gym không? Nhìn em gầy quá', replies: [
        { text: 'Em tập… nâng ly cà phê mỗi ngày 😆', answer: 'Hahaha, cũng là một môn thể thao đó! 🏆', bond: 10 },
        { text: 'Không ạ', answer: 'Bữa nào anh dẫn đi tập nha!', bond: 4 },
      ] },
    ],
  },
  {
    id: 'na', name: 'Linda Na', face: '🧑‍🎓', role: 'Sinh viên năm hai, nghiện matcha',
    p: xung.em('f'),
    fav: ['matchaLatte', 'bacXiu', 'suaDa'],
    look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'long', shirt: '#7aa6e8', acc: ['blush'] },
    greet: [
      'Dạ cho em một ly {drink} nha, ít ngọt xíu ạ!',
      'Chị chủ ơi, {drink} như mọi khi nha 🥺',
      'Ê chị iu! Như cũ nha, hôm nay em thi xong rồi nè 🎉',
    ],
    chats: [
      { say: 'Mai em thi cuối kỳ mà chưa học chữ nào hết á chị 😭', replies: [
        { text: 'Cố lên! Uống ly này là nhớ bài liền', answer: 'Hihi chị nói vậy em tin luôn đó nha! 🥰', bond: 9 },
        { text: 'Thì… học đi em', answer: 'Dạ… biết rồi mà 🥲', bond: 2 },
      ] },
      { say: 'Chị ơi quán có wifi hông, em ngồi chạy deadline xíu', replies: [
        { text: 'Có nè, pass là "dreamers2026" nha', answer: 'Ủa chị dễ thương dữ, em ngồi tới tối luôn 😆', bond: 8 },
        { text: 'Wifi yếu lắm em ơi', answer: 'Hông sao, em xài 4G cũng được ạ', bond: 2 },
      ] },
      { say: 'Cuối tháng rồi, ví em mỏng như tờ giấy luôn chị ơi', replies: [
        { text: 'Ly này chị bớt cho em 2 ngàn nha', answer: 'Trời ơi chị là chân ái của đời em 🫶', bond: 10 },
        { text: 'Ai cũng vậy mà em', answer: 'Dạ đúng rồi, đồng cảm ghê 😅', bond: 3 },
      ] },
    ],
  },
  {
    id: 'tuan', name: 'Kenny Sang', face: '👨‍💼', role: 'Dân văn phòng, họp từ sáng tới tối',
    p: xung.anh(),
    fav: ['denDa'],
    look: { skin: '#e9bf97', hair: '#1d1612', style: 'short', shirt: '#f4f4f0', accent: '#2e3f6e', acc: ['collar', 'tie'] },
    greet: [
      'Cho anh ly {drink}, đậm đậm giùm nha.',
      'Như hôm qua nha em, {drink} không đường.',
      'Em ơi, "thuốc tỉnh" của anh đâu rồi 😂 Như cũ nha!',
    ],
    chats: [
      { say: 'Sáng nay sếp họp 3 tiếng, anh muốn xỉu ngang luôn', replies: [
        { text: 'Vậy em pha đậm hơn chút cho anh tỉnh nha', answer: 'Em hiểu anh quá trời luôn á 😂', bond: 9 },
        { text: 'Họp vậy là còn ít đó anh', answer: 'Ờ… nghe cũng có lý 😐', bond: 2 },
      ] },
      { say: 'Cuối tuần khách du lịch đông, kẹt xe từ vòng xoay chợ Đà Lạt lên tới đây mất 45 phút, hết hồn', replies: [
        { text: 'Ngồi nghỉ xíu đi anh, nhạc quán chill lắm', answer: 'Ừ, nghe lofi một lát cho đỡ mệt 🎧', bond: 8 },
        { text: 'Sao anh không đi sớm hơn?', answer: 'Thì… đi sớm cũng gặp đoàn khách đi săn mây em ơi 🥲', bond: 1 },
      ] },
      { say: 'Cuối tuần này em có đi đâu chơi không?', replies: [
        { text: 'Em ở quán bán nè, anh ghé nha!', answer: 'Ok, chủ nhật anh dắt cả team qua luôn 👍', bond: 9 },
        { text: 'Bí mật nha anh', answer: 'Haha, bí ẩn ghê ha', bond: 3 },
      ] },
    ],
  },
  {
    id: 'coba', name: 'Cô Ba Xôi Gấc', face: '👵', role: 'Bán xôi đầu hẻm',
    p: xung.co(),
    fav: ['suaDa'],
    look: { skin: '#e6b98f', hair: '#bdb6ae', style: 'bun', shirt: '#8e6bbf', acc: ['earring'] },
    greet: [
      'Con ơi, cho cô ly {drink} nha con.',
      'Bữa nay cô ghé nữa nè, {drink} như cũ nghen con.',
      'Con gái cô đâu rồi? Cô đem xôi cho con nè, cho cô ly như cũ nha 💛',
    ],
    chats: [
      { say: 'Hồi trẻ cô cũng bán cà phê vợt ở chợ Bà Chiểu đó con', replies: [
        { text: 'Thiệt hả cô? Kể con nghe với!', answer: 'Hồi đó cà phê vợt thơm lắm con, mai cô kể tiếp nghen 😊', bond: 10 },
        { text: 'Dạ, giờ thì có phin rồi cô', answer: 'Ừ, thời thế thay đổi rồi ha con', bond: 3 },
      ] },
      { say: 'Mấy đứa nhỏ bây giờ uống gì mà muối với kem, cô hổng hiểu', replies: [
        { text: 'Bữa nào con pha cho cô thử một ly nha', answer: 'Ờ, để cô thử coi, biết đâu ghiền 😆', bond: 9 },
        { text: 'Tại cô lạc hậu đó', answer: 'Cái thằng/con này… 😤', bond: -3 },
      ] },
    ],
  },
  {
    id: 'khoa', name: 'Huy Sơ Rum', face: '🧑‍💻', role: 'Dev chạy deadline, skincare 10 bước',
    p: xung.custom('m', 'tui', 'bà', 'ông', 'tui'),
    fav: ['cafeMuoi', 'latte', 'denDa'],
    look: { skin: '#f0c8a2', hair: '#3a2a20', style: 'messy', shirt: '#4a4f57', acc: ['glasses', 'hoodie'] },
    greet: [
      'Cho mình một {drink}, size to nhất có thể 🙏',
      'Ê quán ơi, {drink} như cũ, bug hôm nay nhiều quá',
      'Bro! Như cũ nha, deploy xong rồi, hôm nay ăn mừng 🚀',
    ],
    chats: [
      { say: 'Code chạy trên máy tui mà lên server là toang, mệt ghê', replies: [
        { text: '"Chạy trên máy tui" là chân lý rồi bro', answer: 'Hahaha đúng chuẩn dân IT luôn 😂', bond: 10 },
        { text: 'Ủa vậy là sao?', answer: 'Thôi khỏi giải thích, dài lắm 😅', bond: 2 },
      ] },
      { say: 'Đang tính nghỉ việc ra mở quán cà phê như bạn đó', replies: [
        { text: 'Mở quán cực lắm đó, mà vui!', answer: 'Thôi để tui code thêm vài năm rồi tính 😆', bond: 8 },
        { text: 'Mở đi, cạnh tranh với tui luôn', answer: 'Ủa gắt vậy 😳', bond: 1 },
      ] },
    ],
  },
  {
    id: 'vy', name: 'Jenny Vy Vu', face: '👩‍🎤', role: 'TikToker review đồ uống',
    p: xung.custom('f', 'Jenny', 'chị', 'em', 'chị'),
    fav: ['matchaXay', 'traDao', 'suaDa'],
    look: { skin: '#f8d6bd', hair: '#ff8fb1', style: 'bob', shirt: '#b07ae0', acc: ['blush', 'earring'] },
    greet: [
      'Hello quán! Cho Jenny một {drink} để quay clip review nha 📸',
      'Quán ơi, {drink} như bữa nha, clip trước lên 100k view đó!',
      'Bestie! Như cũ nha, hôm nay Jenny livestream ở quán luôn 💖',
    ],
    chats: [
      { say: 'Góc nào trong quán lên hình đẹp nhất vậy?', replies: [
        { text: 'Góc cửa sổ có nắng chiều, đẹp xỉu!', answer: 'Oke để Jenny ra đó quay liền, cảm ơn nha ✨', bond: 9 },
        { text: 'Góc nào cũng được hết', answer: 'Ừm… để Jenny tự tìm vậy 😶', bond: 2 },
      ] },
      { say: 'Quán mình có gì đặc biệt để Jenny giới thiệu không?', replies: [
        { text: 'Cà phê sạch mua thẳng từ nông dân Cầu Đất nè', answer: 'Ý nghĩa quá trời, Jenny sẽ kể trong clip luôn! 💛', bond: 10 },
        { text: 'Giá rẻ nhất khu này', answer: 'Okela, rẻ cũng là một điểm cộng 😄', bond: 4 },
      ] },
    ],
  },
]

export const BOND_LEVELS = [
  { min: 0, name: 'Người lạ', icon: '🤝' },
  { min: 25, name: 'Khách quen', icon: '😊' },
  { min: 60, name: 'Bạn thân', icon: '💖' },
]
export const bondLevel = (b: number) => (b >= 60 ? 2 : b >= 25 ? 1 : 0)

// Khách vãng lai gọi món ({drink})
export const GENERIC_ORDERS = [
  'Cho {t} một ly {drink} nha {b}!',
  'Ê quán ơi, một {drink} mang đi!',
  '{B} ơi, {drink} ít ngọt giùm {t} nha',
  'Cho {t} ly {drink}, nhiều đá nha {b}',
  '{drink} một ly nha, nghe nói quán làm ngon lắm!',
  '{B} ơi cho {t} {drink}, {t} đang vội xíu 🙏',
]

// Chuyện phiếm với khách vãng lai
export const GENERIC_CHATS: ChatTopic[] = [
  { say: 'Trời hôm nay nóng muốn chảy mỡ luôn á', replies: [
    { text: 'Ly này nhiều đá cho mát nha!', answer: 'Ui dễ thương ghê, cảm ơn nha 😆', bond: 6 },
    { text: 'Ừ, nóng thiệt', answer: 'Ờ…', bond: 1 },
  ] },
  { say: 'Quán mới mở hả {b}? Thấy decor xinh ghê', replies: [
    { text: 'Dạ mới mở, {k} ghé thường xuyên nha!', answer: 'Chắc chắn rồi, để {t} rủ hội bạn luôn 🫶', bond: 7 },
    { text: 'Cũng bình thường thôi', answer: 'Khiêm tốn quá vậy 😂', bond: 2 },
  ] },
  { say: 'Nhạc quán nghe chill ghê, tên bài gì vậy?', replies: [
    { text: 'Lofi tự làm đó, nghe hoài không chán!', answer: 'Xịn xò vậy trời, cho xin playlist nha 🎧', bond: 6 },
    { text: 'Không biết nữa', answer: 'Okela 😅', bond: 1 },
  ] },
  { say: 'Hôm nay sếp khen {t} rồi, vui quá trời', replies: [
    { text: 'Chúc mừng nha! Ly này phải ngon gấp đôi', answer: 'Hihi cảm ơn nha, quán có tâm ghê 🥰', bond: 7 },
    { text: 'Vậy à', answer: 'Ừa… 😶', bond: 0 },
  ] },
]

// Ngoại hình ngẫu nhiên cho khách vãng lai
const SKINS = ['#f6d3b3', '#f0c8a2', '#e9bf97', '#d9a679', '#c98f62', '#f8dcc4']
const HAIRS = ['#2b1d16', '#3a2a20', '#1d1612', '#6b4026', '#a0522d', '#d9a441', '#ff8fb1', '#5b6ee1', '#bdb6ae']
const F_STYLES: HairStyle[] = ['long', 'bun', 'bob', 'shoulder', 'long']
const M_STYLES: HairStyle[] = ['short', 'messy', 'cap', 'short', 'spiky']
const SHIRTS = ['#e86a5a', '#5b8bd9', '#6aa84f', '#f2c14e', '#b07ae0', '#4a4f57', '#f4f4f0', '#e8873a', '#2fa38c', '#ff9aa8']
export function randomLook(g: Gender = Math.random() < 0.5 ? 'f' : 'm'): Look {
  const acc: Acc[] = []
  if (Math.random() < 0.25) acc.push('glasses')
  if (Math.random() < 0.3) acc.push('blush')
  if (Math.random() < 0.15) acc.push('hoodie')
  if (g === 'm' && Math.random() < 0.15) acc.push('beard')
  if (g === 'f' && Math.random() < 0.15) acc.push('earring')
  return { skin: pick(SKINS), hair: pick(HAIRS), style: pick(g === 'f' ? F_STYLES : M_STYLES), shirt: pick(SHIRTS), accent: pick(SHIRTS), acc }
}
/** khách vãng lai trẻ: xưng anh/chị – em, em – chị, hoặc mình – bạn (cố định cả lượt ghé) */
export const walkinPersona = (g: Gender): Persona => pick(g === 'f' ? [xung.chi(), xung.em('f'), xung.minh('f')] : [xung.anh(), xung.em('m'), xung.minh('m')])

// ---------- Khách cá tính trên phố (trước đây là boss) – giờ ghé như khách thường, có album riêng ----------
export interface Character {
  name: string
  title: string
  look: Look
  p: Persona // xưng hô cố định
  greet: string[] // {drink} = tên món · {t} {b} {k} {y} = xưng hô
  chats: ChatTopic[]
}
const tk = (say: string, nice: [string, string, number?], sassy: [string, string, number], dry: [string, string]): ChatTopic => ({
  say,
  replies: [
    { text: nice[0], answer: nice[1], bond: nice[2] ?? 7 },
    { text: sassy[0], answer: sassy[1], bond: sassy[2], sassy: true },
    { text: dry[0], answer: dry[1], bond: 1 },
  ],
})
// Thứ tự giữ nguyên (album lưu theo vị trí boss:i) – thêm người mới ở CUỐI danh sách
export const CHARACTERS: Character[] = [
  { name: 'Jessica Tổ Quạ', title: 'Soi từng giọt cà phê', p: xung.chi(),
    look: { skin: '#f3cfae', hair: '#8e4fc4', style: 'afro', shirt: '#ff7aa8', accent: '#d81b60', acc: ['catglasses', 'lipstick', 'hoops'] },
    greet: ['Cho {t} {drink}. {T} soi kỹ lắm nha, giọt nào cũng phải đều', 'Một {drink}. {T} không khó tính đâu, {t} chỉ có tiêu chuẩn thôi'],
    chats: [tk('Tóc {t} mới làm 3 triệu đó, {b} thấy sao?',
      ['Đẹp như tổ chim thiên đường luôn {k}', 'Ừ, {b} có mắt thẩm mỹ đó', 8],
      ['Đẹp, mà chim nó tưởng nhà thật nên đậu hoài', 'Cái miệng này… mà công nhận sáng nay có con sẻ đậu thiệt', 6],
      ['Cũng được', 'Cũng được là sao, 3 triệu đó!'])] },
  { name: 'Chú Johnny Ria Mép', title: 'Cả đời chưa cười lần nào', p: xung.chu(),
    look: { skin: '#e2b089', hair: '#2b2b2b', style: 'combover', shirt: '#6b8e23', acc: ['unibrow', 'mustache'] },
    greet: ['Một {drink}. {T} không cười đâu, nhưng trong lòng {t} vui đó', '{drink}. {T} cả đời chưa cười, ly này mà ngon {t} suy nghĩ lại'],
    chats: [tk('Hồi đó {t} đi lính, cà phê pha bằng vớ, mà ngon hơn bây giờ',
      ['Dạ hôm nay {y} pha bằng phin, {k} chấm thử nha', 'Ừ… được. Đừng kể ai là {t} khen'],
      ['Dạ quán hết vớ rồi, {k} uống tạm phin nha', 'Hừ… (ria mép giật giật, hình như là cười)', 8],
      ['Dạ', 'Ừm.'])] },
  { name: 'Bà Mary Lô Cuốn', title: 'Đi chợ tiện ghé qua chê', p: xung.ba(),
    look: { skin: '#eac3a0', hair: '#5a3a28', style: 'curlers', shirt: '#2fa38c', accent: '#ff9ac1', acc: ['bottleglasses', 'scarf', 'lipstick'] },
    greet: ['{T} đi chợ ngang qua. Cho {t} {drink}, rồi {t} góp ý vài câu thôi', '{drink} một ly nghe {b}. Hồi {t} còn trẻ cà phê rẻ lắm, mà thôi, {t} kể sau'],
    chats: [tk('Cái lô cuốn này {t} cuốn từ sáng, tối mới tháo. {B} biết vì sao không?',
      ['Dạ để tối đi đám cưới cho đẹp hả {k}', 'Đúng rồi, con nhỏ này lanh ghê'],
      ['Dạ để bắt sóng wifi hả {k}', 'Trời đất! Mà… bắt được thiệt không {b}?', 7],
      ['Dạ không', 'Vậy mà cũng không biết'])] },
  { name: 'Tony Mào Gà', title: 'Chê trước, uống sau', p: xung.anh(),
    look: { skin: '#f0c8a2', hair: '#39d353', style: 'mohawk', shirt: '#1d1d1d', accent: '#c0c0c0', acc: ['nosering', 'tattoobrow', 'chain'] },
    greet: ['Yo, {drink}! {T} chê trước cho đỡ mất công: ly hơi nhỏ. Giờ pha đi', 'Một {drink}. {T} khó tính vì {t} có gu, chứ không phải vì {t} đói'],
    chats: [tk('Tóc {t} xịt nửa chai keo, gió Đà Lạt thổi không nhúc nhích. Đỉnh không {b}?',
      ['Đỉnh, như cột ăng-ten di động luôn {k}', 'Chuẩn, {t} đứng đâu là sóng mạnh chỗ đó'],
      ['Đỉnh, chim bay ngang tưởng cây xương rồng', 'Ê… cũng có con chim đậu thử thiệt', 7],
      ['Ừ', 'Ừ là sao, khen đi chứ'])] },
  { name: 'Đại Gia Bill Keo', title: 'Giàu nứt vách, tip không một xu', p: xung.anh(),
    look: { skin: '#e2b089', hair: '#111', style: 'slick', shirt: '#8e1b2c', accent: '#7a5a00', acc: ['shades', 'chain', 'mustache', 'goldtooth'] },
    greet: ['Một {drink}. Bớt 2 ngàn được không {b}? Không à? Thôi, giá này cũng… chấp nhận', '{drink}. {T} có 3 căn nhà mặt tiền, nhưng ly này vẫn phải đúng giá nha'],
    chats: [tk('{T} giàu là nhờ tiết kiệm. Ống hút {t} rửa xài lại 3 lần',
      ['Dạ vậy là sống xanh đó {k}, quán ủng hộ', 'Đúng! Xanh mà còn đỡ tốn tiền'],
      ['Dạ vậy chắc tiền tip {k} cũng rửa xài lại', 'Ờ… tip thì để lần sau đi', 6],
      ['Dạ', 'Học hỏi đi {b}'])] },
  { name: 'Cô Selena Nón Rộng', title: 'Check-in xong mới chê', p: xung.co(),
    look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'sunhat', shirt: '#f2c14e', accent: '#e86a5a', acc: ['tattoobrow', 'hoops', 'lipstick', 'shades'] },
    greet: ['Cho {t} {drink}, để {t} check-in đã rồi mới uống, ánh sáng đang đẹp', '{drink} nha {b}. {T} chụp xong mới chê, chê xong mới khen, quy trình đó'],
    chats: [tk('Cái nón này rộng 1 mét, {t} đi qua cửa phải nghiêng đầu. {B} thấy hợp không?',
      ['Dạ hợp lắm, che nắng cho cả bàn bên luôn {k}', 'Đó, nón đẹp là nón có ích'],
      ['Dạ hợp, mà hôm qua nó che mất bảng giá của quán', 'Ha! Vậy hôm nay {t} xin giảm giá bù nha', 6],
      ['Dạ', 'Khen một câu cũng không được hả {b}'])] },
  // ----- khách cá tính mới -----
  { name: 'Ông Tư Tám Chuyện', title: 'Gọi một ly, kể ba tiếng', p: xung.ong(),
    look: { skin: '#e2b48c', hair: '#e8e4de', style: 'combover', shirt: '#8a6a4a', accent: '#c9a86a', acc: ['bottleglasses', 'mustache'] },
    greet: ['Cho {t} ly {drink} nghe {b}. Ngồi xuống đây {t} kể chuyện xưa cho nghe…', '{drink} nghe {b}. Hồi {t} bằng tuổi {b}, Đà Lạt lạnh tới mức cà phê đông thành đá'],
    chats: [tk('Hồi xưa {t} cua bà nhà bằng một ly cà phê sữa với một bài thơ',
      ['Dạ lãng mạn quá, {k} đọc bài thơ cho {y} nghe với', 'Để {t} nhớ… “Em ơi Đà Lạt…” Ờ, quên rồi, mà bà vẫn đồng ý'],
      ['Dạ chắc bà đồng ý vì ly cà phê chứ không phải bài thơ', 'Ha ha! Bà nhà cũng nói y chang vậy đó {b}', 8],
      ['Dạ', 'Ừ, bọn trẻ bây giờ không nghe chuyện nữa'])] },
  { name: 'Chị Diễm Mặc Cả', title: 'Trả giá cả ly nước lọc', p: xung.chi(),
    look: { skin: '#f3c9a6', hair: '#b03a2e', style: 'bun', shirt: '#e86a5a', accent: '#f2c14e', acc: ['catglasses', 'hoops', 'lipstick'] },
    greet: ['{drink} bao nhiêu {b}? 35 hả? 20 được không, {t} mua 1 ly mà, mua nhiều đâu', 'Cho {t} {drink}. Bớt 5 ngàn, {t} giới thiệu cả xóm tới uống'],
    chats: [tk('Ở chợ {t} trả giá từ 100 xuống 30 là chuyện thường. {B} có bớt không?',
      ['Dạ quán tặng {k} thêm nụ cười, không tính tiền', 'Hừm… nụ cười thì nhận, nhưng lần sau phải bớt nha'],
      ['Dạ bớt được, bớt đá, bớt sữa, bớt luôn cà phê', 'Thôi thôi, giữ nguyên giùm {t}!', 8],
      ['Không bớt', 'Quán gì mà cứng ghê'])] },
  { name: 'Anh Ken Crypto', title: 'Trả bằng coin, coin đang sập', p: xung.anh(),
    look: { skin: '#f0c8a0', hair: '#2b2b2b', style: 'cap', shirt: '#1f1f24', accent: '#f2c14e', acc: ['shades', 'chain'] },
    greet: ['Cho {t} {drink}. Quán nhận Bitcoin không {b}? Không à… vậy chờ {t} bán coin rồi chuyển khoản', 'Một {drink}! Hôm nay coin xanh, {t} bao cả quán… à mới đỏ lại rồi, 1 ly thôi'],
    chats: [tk('{B} có muốn đầu tư không? Coin này x100 trong tuần sau',
      ['Dạ thôi, {y} đầu tư vào cà phê là đủ hồi hộp rồi', 'Haha an toàn ghê, cà phê không bao giờ sập'],
      ['Dạ x100 giống tuần trước {k} nói đó hả', 'Ờ… tuần trước là… điều chỉnh kỹ thuật thôi', 7],
      ['Không', 'Rồi sẽ hối hận đó'])] },
  { name: 'Bé Su Gen Alpha', title: 'Nói toàn từ lóng không ai hiểu', p: xung.em('f'),
    look: { skin: '#f8dcc4', hair: '#ff8fb1', style: 'bob', shirt: '#7ad0e8', accent: '#ff7aa8', acc: ['blush', 'glasses'] },
    greet: ['{B} ơi cho {t} {drink}, ly này phải slay nha, không là {t} ô dề', '{drink}! Quán này aura +1000, {t} chấm 10 trên 10 skibidi'],
    chats: [tk('{B} ơi, ly này có “điểm aura” không?',
      ['Có chứ, ly nào ở đây cũng aura max, {k} uống là thấy', 'Ô sì kê! {B} chill phết đó nha'],
      ['Aura của ly này cao hơn điểm toán của {k}', 'Ơ… sao biết… flop thật sự', 7],
      ['Không biết', 'Boomer quá trời'])] },
  { name: 'Cô Tám Hóng Hớt', title: 'Biết hết chuyện cả dốc', p: xung.co(),
    look: { skin: '#e6b98f', hair: '#3a2a20', style: 'nonla', shirt: '#c25b8e', accent: '#f2c14e', acc: ['earring', 'tattoobrow'] },
    greet: ['Cho {t} ly {drink}. {B} biết gì chưa? Quán bên kia mới… thôi để {t} kể sau', '{drink} nghe {b}. Nhà số 7 mới mua xe, {t} biết trước cả chủ xe'],
    chats: [tk('{B} nghe gì chưa, ông chủ chuỗi MÂY hôm qua bị vợ… à mà thôi, {t} không phải người nhiều chuyện',
      ['Dạ {k} kể tiếp đi, {y} hứa không nói ai', 'Ừ, vậy ngồi đây {t} kể từ đầu…'],
      ['Dạ {k} không nhiều chuyện, {k} chỉ là đài phát thanh của dốc thôi', 'Cái miệng này! Mà công nhận, đài này phát 24/24', 8],
      ['Dạ không nghe', 'Vậy thôi, {t} đi kể quán khác'])] },
  { name: 'Chú Bảy Phong Thuỷ', title: 'Ly phải đặt hướng Đông Nam', p: xung.chu(),
    look: { skin: '#d9a679', hair: '#bdb6ae', style: 'slick', shirt: '#c9a227', accent: '#8e1b2c', acc: ['beard', 'glasses'] },
    greet: ['Cho {t} {drink}. Nhớ đặt ly hướng Đông Nam, quay quai về phía cửa nghe {b}', '{drink} nghe {b}. Hôm nay mệnh {t} thiếu Thuỷ, cho thêm đá'],
    chats: [tk('Quán này cửa hướng Tây, bán buổi chiều là hợp. Mà cái quầy nên dời 30 phân',
      ['Dạ mai {y} thử dời, {k} xem giùm ngày đẹp', 'Mai không đẹp, mốt cũng không, tháng sau đi'],
      ['Dạ dời 30 phân là đụng tường, chắc phải đập tường', 'Ờ… thì thôi, đặt thêm chậu cây là hoá giải', 7],
      ['Dạ', 'Không tin thì thôi'])] },
  { name: 'Anh Hùng Khoe Xe', title: 'Đậu xe ngay cửa để khoe', p: xung.anh(),
    look: { skin: '#e2b089', hair: '#1d1612', style: 'helmet', shirt: '#e8503a', accent: '#2b2b2b', acc: ['shades', 'goldtooth'] },
    greet: ['Cho {t} {drink}. {B} thấy chiếc xe ngoài cửa không? Xe {t} đó, mới lăn bánh', '{drink} nha. Để {t} dời xe ra chỗ có nắng cho nó bóng'],
    chats: [tk('Xe {t} 1 tỷ đó, mà lên dốc Đà Lạt vẫn phải về số 1',
      ['Dạ xe đẹp thật, màu này lên hình chắc đẹp lắm {k}', 'Đó, {b} có gu! Lát chụp chung nha'],
      ['Dạ 1 tỷ mà leo dốc vẫn thua con Dream của ông Tư', 'Ơ… con Dream đó bất tử thiệt mà', 6],
      ['Dạ', 'Khen xe một câu đi mà'])] },
  { name: 'Chị Mẹ Bỉm Sữa', title: 'Một tay bế con, một tay chốt đơn', p: xung.chi(),
    look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'messy', shirt: '#b8d8f0', accent: '#ff9aa8', acc: ['hoodie', 'blush'] },
    greet: ['Cho {t} {drink}, nhanh giùm nha {b}, bé nhà {t} ngủ được đúng 20 phút', '{drink} một ly. Hôm nay {t} quyết uống hết lúc còn lạnh, lần đầu trong 2 năm'],
    chats: [tk('Sáng giờ {t} chốt 47 đơn online, mà con khóc 46 lần',
      ['{K} giỏi quá, {y} tặng thêm ly nước cam nha', 'Trời ơi cảm động, cảm ơn {b} nha'],
      ['Vậy là bé còn nhường {k} 1 lần', 'Hahaha đúng rồi, bé biết thương mẹ', 8],
      ['Dạ', 'Ừ… {t} đi đây, bé dậy rồi'])] },
]

// ===== Khách du lịch theo nhóm (guests.ts) + hội khách cá tính =====
import { GUEST_GROUPS, makeCharacterGroup } from './guests'
GUEST_GROUPS.push(makeCharacterGroup(CHARACTERS))
export { GUEST_GROUPS }

// ===== Gộp kho chuyện tám & review mở rộng (chatter.ts) =====
import { MORE_GENERIC_CHATS, MORE_REGULAR_CHATS, MORE_COUNTER_REVIEWS, MORE_APP_REVIEWS } from './chatter'
GENERIC_CHATS.push(...MORE_GENERIC_CHATS)
for (const r of REGULARS) r.chats.push(...(MORE_REGULAR_CHATS[r.id] ?? []))
for (const [k, arr] of Object.entries(MORE_COUNTER_REVIEWS)) (COUNTER_REVIEWS[+k] ??= []).push(...arr)
for (const [k, arr] of Object.entries(MORE_APP_REVIEWS)) {
  const key = +k as keyof typeof REVIEWS
  if (REVIEWS[key]) REVIEWS[key].push(...arr)
}

// ===== Không dùng emoji trong game: làm sạch toàn bộ thoại, review, tên… (chỉ giữ icon pixel art) =====
import { scrubDeep } from './emoji'
scrubDeep([LINES, REVIEWS, COUNTER_REVIEWS, FAMILY_REVIEWS, GENERIC_CHATS, REGULARS, GENERIC_ORDERS, GUEST_GROUPS, CHARACTERS, RAPS, SHIPPERS, NEEDY, BOND_LEVELS, UPGRADES, RECIPES, INGREDIENTS, STEPS, WEATHERS])
