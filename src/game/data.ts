// Dữ liệu tĩnh của game: nguyên liệu, công thức, nâng cấp, thời tiết, câu thoại

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
  // mở khoá dần: thắng boss mỗi ngày được tặng 1 món mới (hoặc mua sớm trong tab Menu)
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
/** Món có sẵn từ đầu & thứ tự món mới được tặng khi thắng boss */
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
    'Ngon tới mức em muốn xin công thức mà sợ quán giận 🤭',
    'Ly này với người yêu, em chọn ly 💘',
    'Uống xong tự nhiên thấy mình đẹp hơn hẳn ✨',
    'Pha nhanh hơn crush seen tin nhắn em, mà ngon hơn nhiều 😌',
    '10/10, sẽ quay lại ngày mai, ngày mốt, ngày kia…',
    'Ngon xỉu! Uống một ngụm tưởng đang ngồi Đà Lạt luôn á 🌲',
    '10 điểm! Ly này đăng story là crush rep liền',
    'Vị chuẩn bài, quán này chắc tu luyện 10 năm trên núi 😤✨',
    'Đỉnh nóc kịch trần! Mai em dắt cả lớp tới phá quán',
    'Ngon tới mức muốn khóc, mà thôi khóc mặn mất 🥹',
  ],
  4: [
    'Ngon nha, mà chờ lâu tới mức em viết xong luận văn 📚',
    'Vị ổn áp, chỉ là em già thêm 2 tuổi lúc chờ',
    'Ngon, mà đá nhiều quá, em tưởng đang ở Bắc Cực 🐧',
    'Cho 4 sao, 1 sao còn lại em giữ làm kỷ niệm',
    'Ngon thiệt, mà đợi lâu tới mức em lướt hết TikTok rồi 😅',
    'Vị 10 điểm, tốc độ 6 điểm, tổng kết vẫn iu',
    'Đáng chờ đó, nhưng lần sau nhanh xíu cho em kịp vào ca nha',
    'Ngon, mà nãy em suýt mọc rễ trước quầy luôn 🌱',
  ],
  3: [
    'Uống giống bài kiểm tra 15 phút: không tệ nhưng không nhớ gì',
    'Vị này lần đầu em thấy trên đời, chưa biết nên vui hay buồn 😐',
    'Được cái ly đẹp, còn nước thì… để em suy nghĩ thêm',
    'Barista pha bằng cả trái tim, mà hình như quên não ở nhà 🧠',
    'Uống được nha, mà hình như ly này hơi “sáng tạo” so với menu 🤔',
    'Ngọt ngọt nhạt nhạt, giống tình cảm người yêu cũ',
    'Tạm ổn, barista hôm nay đang thất tình hả?',
    'Vị lạ lạ, mà thôi lạ cũng là một loại trải nghiệm 😶',
  ],
  2: [
    'Uống một ngụm nhớ lại tuổi thơ… toàn mấy lần bị phạt 😵',
    'Em đang phân vân đây là cà phê hay nước rửa ly 🫠',
    'Ly nước này dạy em bài học: đừng tin vào menu',
    '2 sao: 1 cho cái ly, 1 cho cái ống hút',
    'Em gọi {drink} mà uống vô thấy giống… thử thách sinh tồn 🫠',
    'Uống xong em phải ngồi suy nghĩ lại cuộc đời 😵‍💫',
    'Cảm ơn quán đã cho em biết thế nào là plot twist trong một ly nước',
    'Thôi lần sau em tự pha ở nhà cho lành 🙂',
  ],
}
export const FAMILY_REVIEWS: Record<'coffee' | 'matcha' | 'tea', { good: string[]; meh: string[] }> = {
  coffee: {
    good: ['Đậm đà như deadline cuối tuần, mê!', 'Cà phê thơm phức, tỉnh như sáo luôn ☕'],
    meh: ['Cà phê này tỉnh thì tỉnh thật, tỉnh luôn tới 3h sáng ngồi nghĩ về cuộc đời 😵‍💫'],
  },
  matcha: {
    good: ['Matcha thơm xỉu, xanh như hy vọng qua môn của em 🍵', 'Béo béo thơm thơm, chuẩn gu Gen Z luôn'],
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
export const LINES = {
  impatient: [
    'Ủa alo, quán ơi? 📞',
    'Ét o ét 🆘',
    'Chờ hơi bị lâu rồi á nha',
    'Bé đợi mòn mỏi luôn 🥲',
    'Khum ổn rồi đó quán ơi',
    'Lâu dữ thần vậy trời',
    'Ly của em đang đi lạc hả?',
    'Đợi tới mọc rễ luôn rồi 🌱',
    'Nhanh lên xíu đi mà 🥺',
    'Mình đang ở level kiên nhẫn cuối cùng',
  ],
  angry: [
    'Chờ lâu tới mức pin điện thoại từ 100 còn 1% 🪫',
    'Thôi em về đặt app cho lẹ 📱',
    'Quán đang trồng cà phê từ hạt hả trời?',
    'Quán chill quá, chill tới mức bé đi về luôn 🙂',
    'Đợi lâu xỉu ngang, out!',
    'Toang rồi, bé đi quán khác đây 🏃',
    'Chờ đợi là hạnh phúc… nhưng hôm nay thì không',
    'Ủa tưởng quán bán cà phê, ai ngờ bán sự chờ đợi?',
    'Bủh bủh, khum chờ nữa đâu',
    'Hết cứu thiệt sự 💀',
    'Ly cà phê này chắc giao ở kiếp sau',
    'Thôi để dành 1 sao cho quán nha 🙂',
    'Mình là con người, không phải cây xương rồng',
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
  1: ['Đơn đi lạc còn hơn em giữa Sài Gòn 🥲', 'Chờ tới mức em quên luôn mình đã đặt món gì', 'Đơn bị huỷ vì chờ quá lâu, buồn ghê 🥲', 'Đặt từ sáng tới chiều chưa thấy, out!', 'Hết cứu, không đặt nữa đâu'],
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
const FEMALE_STYLES: HairStyle[] = ['long', 'bob', 'bun', 'curlers', 'afro', 'sunhat']
export const funnyName = (L: Look) => pick(FEMALE_STYLES.includes(L.style) ? FEMALE_NAMES : MALE_NAMES)

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
}

export const REGULARS: Regular[] = [
  {
    id: 'tomy', name: 'Tomy Tèo', face: '🏋️', role: 'Gymer, đếm calo từng giọt',
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
      { say: 'Kẹt xe từ Hàng Xanh tới đây mất 45 phút, hết hồn', replies: [
        { text: 'Ngồi nghỉ xíu đi anh, nhạc quán chill lắm', answer: 'Ừ, nghe lofi một lát cho đỡ mệt 🎧', bond: 8 },
        { text: 'Sao anh không đi sớm hơn?', answer: 'Thì… đi sớm cũng kẹt em ơi 🥲', bond: 1 },
      ] },
      { say: 'Cuối tuần này em có đi đâu chơi không?', replies: [
        { text: 'Em ở quán bán nè, anh ghé nha!', answer: 'Ok, chủ nhật anh dắt cả team qua luôn 👍', bond: 9 },
        { text: 'Bí mật nha anh', answer: 'Haha, bí ẩn ghê ha', bond: 3 },
      ] },
    ],
  },
  {
    id: 'coba', name: 'Cô Ba Xôi Gấc', face: '👵', role: 'Bán xôi đầu hẻm',
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
  'Cho em một ly {drink} nha!',
  'Ê quán ơi, một {drink} mang đi!',
  'Chị ơi, {drink} ít ngọt giùm em nha',
  'Cho anh ly {drink}, nhiều đá nha em',
  '{drink} một ly nha, nghe nói quán làm ngon lắm!',
  'Bạn ơi cho mình {drink}, mình đang vội xíu 🙏',
]

// Chuyện phiếm với khách vãng lai
export const GENERIC_CHATS: ChatTopic[] = [
  { say: 'Trời hôm nay nóng muốn chảy mỡ luôn á', replies: [
    { text: 'Ly này nhiều đá cho mát nha!', answer: 'Ui dễ thương ghê, cảm ơn nha 😆', bond: 6 },
    { text: 'Ừ, nóng thiệt', answer: 'Ờ…', bond: 1 },
  ] },
  { say: 'Quán mới mở hả? Thấy decor xinh ghê', replies: [
    { text: 'Dạ mới mở, ghé thường xuyên nha!', answer: 'Chắc chắn rồi, để mình rủ hội bạn luôn 🫶', bond: 7 },
    { text: 'Cũng bình thường thôi', answer: 'Khiêm tốn quá vậy 😂', bond: 2 },
  ] },
  { say: 'Nhạc quán nghe chill ghê, tên bài gì vậy?', replies: [
    { text: 'Lofi tự làm đó, nghe hoài không chán!', answer: 'Xịn xò vậy trời, cho xin playlist nha 🎧', bond: 6 },
    { text: 'Không biết nữa', answer: 'Okela 😅', bond: 1 },
  ] },
  { say: 'Hôm nay sếp khen mình rồi, vui quá trời', replies: [
    { text: 'Chúc mừng nha! Ly này phải ngon gấp đôi', answer: 'Hihi cảm ơn nha, quán có tâm ghê 🥰', bond: 7 },
    { text: 'Vậy à', answer: 'Ừa… 😶', bond: 0 },
  ] },
]

// Ngoại hình ngẫu nhiên cho khách vãng lai
const SKINS = ['#f6d3b3', '#f0c8a2', '#e9bf97', '#d9a679', '#c98f62', '#f8dcc4']
const HAIRS = ['#2b1d16', '#3a2a20', '#1d1612', '#6b4026', '#a0522d', '#d9a441', '#ff8fb1', '#5b6ee1', '#bdb6ae']
const STYLES: HairStyle[] = ['short', 'long', 'bun', 'messy', 'bob', 'cap', 'short', 'long']
const SHIRTS = ['#e86a5a', '#5b8bd9', '#6aa84f', '#f2c14e', '#b07ae0', '#4a4f57', '#f4f4f0', '#e8873a', '#2fa38c', '#ff9aa8']
export function randomLook(): Look {
  const acc: Acc[] = []
  if (Math.random() < 0.25) acc.push('glasses')
  if (Math.random() < 0.3) acc.push('blush')
  if (Math.random() < 0.15) acc.push('hoodie')
  if (Math.random() < 0.1) acc.push('beard')
  return { skin: pick(SKINS), hair: pick(HAIRS), style: pick(STYLES), shirt: pick(SHIRTS), accent: pick(SHIRTS), acc }
}

// ---------- BOSS: vị khách khó tính mỗi màn ----------
export interface Boss {
  name: string
  title: string
  look: Look
  stingy?: boolean // keo kiệt: thắng cũng không tip, còn đòi bớt tiền
  lines?: Partial<Record<'greet' | 'taunt' | 'win' | 'lose', string[]>> // câu thoại riêng
}
export const BOSSES: Boss[] = [
  { name: 'Jessica Tổ Quạ', title: 'Soi từng giọt cà phê', look: { skin: '#f3cfae', hair: '#8e4fc4', style: 'afro', shirt: '#ff7aa8', accent: '#d81b60', acc: ['catglasses', 'lipstick', 'hoops'] } },
  { name: 'Chú Johnny Ria Mép', title: 'Cả đời chưa cười lần nào', look: { skin: '#e2b089', hair: '#2b2b2b', style: 'combover', shirt: '#6b8e23', acc: ['unibrow', 'mustache'] } },
  { name: 'Bà Mary Lô Cuốn', title: 'Đi chợ tiện ghé qua chê', look: { skin: '#eac3a0', hair: '#5a3a28', style: 'curlers', shirt: '#2fa38c', accent: '#ff9ac1', acc: ['bottleglasses', 'scarf', 'lipstick'] } },
  { name: 'Tony Mào Gà', title: 'Chê trước, uống sau', look: { skin: '#f0c8a2', hair: '#39d353', style: 'mohawk', shirt: '#1d1d1d', accent: '#c0c0c0', acc: ['nosering', 'tattoobrow', 'chain'] } },
  {
    name: 'Đại Gia Bill Keo', title: 'Giàu nứt vách, tip không một xu', stingy: true,
    look: { skin: '#e2b089', hair: '#111', style: 'slick', shirt: '#8e1b2c', accent: '#7a5a00', acc: ['shades', 'chain', 'mustache', 'goldtooth'] },
    lines: {
      greet: [
        'Ly {drink} bao nhiêu? Đắt vậy? Thôi lấy, nhanh lên, thời gian là tiền bạc! 💰',
        '{drink}. Bớt 2 ngàn được không? Không à? Vậy pha cho nhanh bù lại! ⏱️',
        'Tôi có 3 căn nhà mặt tiền đó. Một {drink}, đừng có chặt chém. 😏',
      ],
      taunt: ['Mỗi giây tôi đứng đây là mất cả trăm triệu đó!', 'Lâu vậy chắc tính thêm phí chờ hả?', 'Nhanh lên, tôi còn đi đòi nợ!'],
      win: [
        '5 sao. Ngon… nhưng tip thì khỏi nha, tiền đâu mà vung. 😤',
        'Được, 5 sao. Mà làm tròn xuống giùm tôi mấy trăm lẻ nhé.',
        'Nhanh đấy, 5 sao. Ly này tôi giữ lại đựng nước lọc, đỡ mua ly mới.',
      ],
      lose: [
        'Chờ lâu vậy mà còn đòi tính tiền? 1 sao, khỏi trả luôn! 💸',
        'Thời gian của tôi đáng giá hơn cả cái quán này. 1 sao.',
        'Lần sau tôi mang cà phê gói từ nhà đi cho lẹ. 1 sao.',
      ],
    },
  },
  { name: 'Cô Selena Nón Rộng', title: 'Check-in xong mới chê', look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'sunhat', shirt: '#f2c14e', accent: '#e86a5a', acc: ['tattoobrow', 'hoops', 'lipstick', 'shades'] } },
]
export const BOSS_LINES = {
  greet: [
    'Một ly {drink}. Nhanh lên, tôi không có cả ngày đâu. ⏱️',
    'Nghe đồn quán ngon? Để coi. {drink}, đúng công thức, đúng giờ.',
    'Tôi đi review quán 10 năm rồi. {drink}. Làm sai là lên bài liền. 📱',
    'Hừm… menu gì mà lèo tèo. Thôi, {drink}. Tôi bấm giờ đó nha.',
    'Tránh ra, tôi tới trước! {drink}, lẹ lên! 😤',
  ],
  taunt: [
    'Tíc tắc… tíc tắc… ⏱️',
    'Tôi đang đếm từng giây đó nha.',
    'Chậm vậy định để tôi viết sớ hả?',
    'Story của tôi đang chờ ly nước đó!',
    'Pha cà phê hay đang trồng cà phê vậy?',
  ],
  win: [
    'Ngon. Nhưng tôi vẫn sẽ chê cái ghế. 5 sao.',
    'Hừm, lần này tha. 5 sao, đừng có cười. 😑',
    'Ừm… cũng được. 5 sao đó, nhưng đừng có tưởng bở. 😒',
    'Nhanh đấy. Ngon… tạm. 5 sao, lần sau tôi sẽ khó hơn.',
    'Hừ, không có gì để chê… thấy khó chịu ghê. 5 sao. 😑',
    'Ly hơi nhỏ, đá hơi nhiều, nhạc hơi to… mà thôi, 5 sao.',
    'Tôi định chê mà tìm không ra chỗ chê. Bực ghê. 5 sao.',
  ],
  lose: [
    'Phục vụ chậm vậy chắc quán bán theo lịch âm. 1 sao.',
    'Tôi chờ tới mức tóc mọc thêm 2 phân. 1 sao.',
    'Chờ ly nước mà như chờ người yêu cũ quay lại. 1 sao, khỏi cảm ơn.',
    'Quán tên Dreamers đúng rồi, vì phục vụ nhanh chỉ có trong mơ. 1 sao.',
    'Tốc độ phục vụ ngang wifi nhà hàng xóm. 1 sao, tạm biệt.',
    'Đề nghị quán đổi tên thành “Đợi Hoài Coffee”. 1 sao.',
    'Tôi vào quán lúc còn trẻ, giờ ra về đã có nếp nhăn. 1 sao.',
  ],
}

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
scrubDeep([LINES, REVIEWS, COUNTER_REVIEWS, FAMILY_REVIEWS, GENERIC_CHATS, REGULARS, GENERIC_ORDERS, BOSS_LINES, BOSSES, RAPS, SHIPPERS, NEEDY, BOND_LEVELS, UPGRADES, RECIPES, INGREDIENTS, STEPS, WEATHERS])
