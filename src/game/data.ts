// Dữ liệu tĩnh của game: nguyên liệu, công thức, nâng cấp, thời tiết, câu thoại
import { xung, type Gender, type Persona } from './voice'
import { L, G } from './i18n'

export type IngredientId = 'cafe' | 'suaDac' | 'suaTuoi' | 'da' | 'ly' | 'tra' | 'dao' | 'kem' | 'matcha' | 'syrup' | 'kemTuoi' | 'dua' | 'trung' | 'cacao'
/** Bước pha: bỏ nguyên liệu (trừ hạt cà phê – dùng qua máy) hoặc thao tác */
export type ActionId = 'chiet' | 'lac' | 'xay' | 'khuay'
export type StepId = Exclude<IngredientId, 'cafe'> | ActionId
export type RecipeId = 'denDa' | 'suaDa' | 'bacXiu' | 'latte' | 'americano' | 'traDao' | 'matchaLatte' | 'cafeMuoi' | 'traDaoKem' | 'matchaKemMuoi' | 'matchaXay'
  | 'cafeDua' | 'cafeTrung' | 'cacaoDa' | 'matchaDua' | 'cacaoKemMuoi' | 'suongMu'
  | 'latteNoel' | 'cacaoNoel' | 'sodaDao' | 'tetDua' | 'traSenTet'
export type UpgradeId = 'staff' | 'machine' | 'decor' | 'sign' | 'freezer' | 'shipper' | 'green' | 'farmer'
export type WeatherId = 'sunny' | 'hot' | 'cloudy' | 'rainy'

export type HairStyle = 'short' | 'long' | 'bun' | 'messy' | 'bob' | 'shoulder' | 'spiky' | 'nonla' | 'helmet' | 'hardhat' | 'cap' | 'beret' | 'slick' | 'afro' | 'combover' | 'mohawk' | 'curlers' | 'sunhat' | 'bangs' | 'updo'
export type Acc = 'santa' | 'party' | 'glasses' | 'tie' | 'collar' | 'hoodie' | 'beard' | 'blush' | 'earring' | 'shades' | 'chain' | 'unibrow' | 'mustache' | 'lipstick' | 'catglasses' | 'bottleglasses' | 'nosering' | 'hoops' | 'scarf' | 'tattoobrow' | 'goldtooth'
  | 'crown' | 'bolt' | 'star' | 'headphones' | 'flower' | 'buttons' | 'tank' | 'bikini'
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
  season?: 'xmas' | 'newyear' | 'tet' // món theo mùa: tự có trong menu khi đang mùa, hết mùa tự gỡ (season.ts)
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
  { id: 'cafe', name: L('Cà phê bột', 'Ground coffee'), icon: '☕', packSize: 20, packPrice: 60_000 },
  { id: 'suaDac', name: L('Sữa đặc', 'Condensed milk'), icon: '🥫', packSize: 20, packPrice: 40_000 },
  { id: 'suaTuoi', name: L('Sữa tươi', 'Fresh milk'), icon: '🥛', packSize: 10, packPrice: 35_000 },
  { id: 'da', name: L('Đá viên', 'Ice cubes'), icon: '🧊', packSize: 30, packPrice: 20_000 },
  { id: 'ly', name: L('Ly', 'Cups'), icon: '🥤', packSize: 50, packPrice: 50_000 },
  { id: 'tra', name: L('Trà', 'Tea'), icon: '🍵', packSize: 20, packPrice: 30_000 },
  { id: 'dao', name: L('Đào ngâm', 'Canned peaches'), icon: '🍑', packSize: 10, packPrice: 60_000 },
  { id: 'kem', name: L('Kem muối', 'Salt cream'), icon: '🧂', packSize: 10, packPrice: 50_000 },
  { id: 'matcha', name: L('Bột matcha', 'Matcha powder'), icon: '🍵', packSize: 15, packPrice: 90_000 },
  { id: 'syrup', name: L('Syrup đường', 'Sugar syrup'), icon: '🍯', packSize: 30, packPrice: 40_000 },
  { id: 'kemTuoi', name: L('Kem tươi', 'Whipped cream'), icon: '🍦', packSize: 15, packPrice: 60_000 },
  // nguyên liệu bí mật: hiện trong Kho khi có gợi ý công thức cần tới
  { id: 'dua', name: L('Cốt dừa', 'Coconut cream'), icon: '🥥', packSize: 10, packPrice: 70_000 },
  { id: 'trung', name: L('Kem trứng', 'Egg cream'), icon: '🥚', packSize: 10, packPrice: 60_000 },
  { id: 'cacao', name: L('Bột cacao', 'Cocoa powder'), icon: '🍫', packSize: 15, packPrice: 80_000 },
]

export type SoundName = 'cup' | 'ice' | 'pour' | 'drip' | 'squeeze' | 'stir' | 'plop' | 'shake' | 'blend'

/** Thông tin hiển thị cho từng bước pha chế */
export const STEPS: Record<StepId, { label: string; icon: string; kind: 'ing' | 'act'; color?: string; sound: SoundName; ms: number }> = {
  ly: { label: L('Ly', 'Cup'), icon: '🥤', kind: 'ing', sound: 'cup', ms: 250 },
  da: { label: L('Đá', 'Ice'), icon: '🧊', kind: 'ing', sound: 'ice', ms: 300 },
  suaDac: { label: L('Sữa đặc', 'Cond. milk'), icon: '🥫', kind: 'ing', color: '#ead3a4', sound: 'squeeze', ms: 350 },
  suaTuoi: { label: L('Sữa tươi', 'Milk'), icon: '🥛', kind: 'ing', color: '#fbf6ec', sound: 'pour', ms: 350 },
  tra: { label: L('Trà', 'Tea'), icon: '🫖', kind: 'ing', color: '#c98a2b', sound: 'pour', ms: 350 },
  dao: { label: L('Đào', 'Peach'), icon: '🍑', kind: 'ing', color: '#f4a46e', sound: 'plop', ms: 300 },
  kem: { label: L('Kem muối', 'Salt cream'), icon: '🧂', kind: 'ing', color: '#fffaf0', sound: 'squeeze', ms: 350 },
  matcha: { label: 'Matcha', icon: '🍵', kind: 'ing', color: '#7fb34d', sound: 'pour', ms: 350 },
  syrup: { label: 'Syrup', icon: '🍯', kind: 'ing', color: '#e0a03a', sound: 'squeeze', ms: 300 },
  kemTuoi: { label: L('Kem tươi', 'Cream'), icon: '🍦', kind: 'ing', color: '#ffffff', sound: 'squeeze', ms: 350 },
  dua: { label: L('Cốt dừa', 'Coconut'), icon: '🥥', kind: 'ing', color: '#f6f0e2', sound: 'pour', ms: 350 },
  trung: { label: L('Kem trứng', 'Egg cream'), icon: '🥚', kind: 'ing', color: '#f3d27a', sound: 'squeeze', ms: 350 },
  cacao: { label: L('Cacao', 'Cocoa'), icon: '🍫', kind: 'ing', color: '#6b3f2a', sound: 'pour', ms: 350 },
  chiet: { label: L('Chiết xuất', 'Brew'), icon: '☕', kind: 'act', color: '#4b2e1e', sound: 'drip', ms: 1100 },
  lac: { label: L('Lắc', 'Shake'), icon: '🍸', kind: 'act', sound: 'shake', ms: 1000 },
  xay: { label: L('Xay', 'Blend'), icon: '🌀', kind: 'act', sound: 'blend', ms: 1100 },
  khuay: { label: L('Khuấy', 'Stir'), icon: '🥄', kind: 'act', sound: 'stir', ms: 550 },
}

export const RECIPES: Recipe[] = [
  // 5 món có sẵn từ ngày đầu
  { id: 'denDa', name: L('Cà phê đen đá', 'Iced black coffee'), icon: '☕', steps: ['ly', 'da', 'chiet', 'khuay'], fairPrice: 20_000, unlockCost: 0, popularity: 1, hotBonus: 0.2, coffee: true, family: 'coffee' },
  { id: 'suaDa', name: L('Cà phê sữa đá', 'Iced milk coffee'), icon: '🧋', steps: ['ly', 'suaDac', 'chiet', 'khuay', 'da'], fairPrice: 25_000, unlockCost: 0, popularity: 1.4, hotBonus: 0.2, coffee: true, family: 'coffee' },
  { id: 'bacXiu', name: L('Bạc xỉu', 'White coffee'), icon: '🥛', steps: ['ly', 'suaDac', 'suaTuoi', 'da', 'chiet'], fairPrice: 29_000, unlockCost: 0, popularity: 1.1, hotBonus: 0.1, coffee: true, family: 'coffee' },
  { id: 'latte', name: L('Latte đá', 'Iced latte'), icon: '🥛', steps: ['ly', 'da', 'suaTuoi', 'chiet'], fairPrice: 35_000, unlockCost: 0, popularity: 1, hotBonus: 0.2, coffee: true, family: 'coffee' },
  { id: 'traDao', name: L('Trà đào', 'Peach tea'), icon: '🍑', steps: ['ly', 'da', 'tra', 'dao', 'syrup', 'lac'], fairPrice: 35_000, unlockCost: 0, popularity: 1.1, hotBonus: 1.2, coffee: false, family: 'tea' },
  // mở khoá dần: hết mỗi ngày bán được tặng 1 món mới (hoặc mua sớm trong tab Menu)
  { id: 'matchaLatte', name: 'Matcha latte', icon: '🍵', steps: ['ly', 'da', 'matcha', 'suaTuoi', 'syrup', 'lac'], fairPrice: 39_000, unlockCost: 250_000, popularity: 1.3, hotBonus: 0.6, coffee: false, family: 'matcha' },
  { id: 'americano', name: L('Americano đá', 'Iced Americano'), icon: '🧊', steps: ['ly', 'da', 'chiet', 'chiet'], fairPrice: 32_000, unlockCost: 250_000, popularity: 0.9, hotBonus: 0.3, coffee: true, family: 'coffee' },
  { id: 'cafeMuoi', name: L('Cà phê muối', 'Salt coffee'), icon: '🧂', steps: ['ly', 'da', 'chiet', 'kem'], fairPrice: 35_000, unlockCost: 350_000, popularity: 1.3, hotBonus: 0.3, coffee: true, family: 'coffee' },
  { id: 'traDaoKem', name: L('Trà đào kem tươi', 'Peach cream tea'), icon: '🍑', steps: ['ly', 'da', 'tra', 'dao', 'lac', 'kemTuoi'], fairPrice: 42_000, unlockCost: 400_000, popularity: 1, hotBonus: 1, coffee: false, family: 'tea' },
  { id: 'matchaKemMuoi', name: L('Matcha kem muối', 'Salt cream matcha'), icon: '🍵', steps: ['ly', 'da', 'matcha', 'suaTuoi', 'lac', 'kem'], fairPrice: 45_000, unlockCost: 500_000, popularity: 1.2, hotBonus: 0.6, coffee: false, family: 'matcha' },
  { id: 'matchaXay', name: L('Matcha đá xay', 'Matcha frappe'), icon: '🍧', steps: ['ly', 'matcha', 'suaTuoi', 'da', 'xay', 'kemTuoi'], fairPrice: 49_000, unlockCost: 650_000, popularity: 1.2, hotBonus: 1, coffee: false, family: 'matcha' },
  // công thức bí mật: phải tự thử đúng thứ tự ở Phòng thử món (gợi ý nhận từ khách hiếm, nhiệm vụ, thành tựu)
  { id: 'cafeDua', name: L('Cà phê cốt dừa', 'Coconut coffee'), icon: '🥥', steps: ['ly', 'dua', 'chiet', 'da', 'xay'], fairPrice: 45_000, unlockCost: 0, popularity: 1.5, hotBonus: 1, coffee: true, family: 'coffee', secret: true },
  { id: 'cafeTrung', name: L('Cà phê trứng', 'Egg coffee'), icon: '🥚', steps: ['ly', 'chiet', 'trung', 'khuay'], fairPrice: 45_000, unlockCost: 0, popularity: 1.4, hotBonus: 0, coffee: true, family: 'coffee', secret: true },
  { id: 'cacaoDa', name: L('Ca cao sữa đá', 'Iced cocoa'), icon: '🍫', steps: ['ly', 'cacao', 'suaDac', 'khuay', 'da'], fairPrice: 35_000, unlockCost: 0, popularity: 1.3, hotBonus: 0.6, coffee: false, family: 'tea', secret: true },
  { id: 'matchaDua', name: L('Matcha cốt dừa', 'Coconut matcha'), icon: '🍵', steps: ['ly', 'da', 'matcha', 'dua', 'lac'], fairPrice: 49_000, unlockCost: 0, popularity: 1.4, hotBonus: 0.8, coffee: false, family: 'matcha', secret: true },
  { id: 'cacaoKemMuoi', name: L('Cacao kem muối', 'Salt cream cocoa'), icon: '🍫', steps: ['ly', 'da', 'cacao', 'suaTuoi', 'lac', 'kem'], fairPrice: 49_000, unlockCost: 0, popularity: 1.3, hotBonus: 0.5, coffee: false, family: 'tea', secret: true },
  // món Giáng Sinh: có sẵn trong mùa Noel, khách gọi nhiều, hết mùa tự gỡ khỏi menu
  { id: 'latteNoel', name: L('Latte quế Noel', 'Cinnamon Xmas latte'), icon: '🎄', steps: ['ly', 'chiet', 'suaTuoi', 'syrup', 'kemTuoi'], fairPrice: 45_000, unlockCost: 0, popularity: 1.8, hotBonus: 0, coffee: true, family: 'coffee', season: 'xmas' },
  { id: 'cacaoNoel', name: L('Cacao nóng Giáng Sinh', 'Xmas hot cocoa'), icon: '🎅', steps: ['ly', 'cacao', 'suaTuoi', 'khuay', 'kemTuoi'], fairPrice: 42_000, unlockCost: 0, popularity: 1.8, hotBonus: 0, coffee: false, family: 'tea', season: 'xmas' },
  // món Tết Tây & Tết Nguyên Đán (season.ts): có sẵn trong mùa, hết mùa tự gỡ
  { id: 'sodaDao', name: L('Soda đào lấp lánh', 'Sparkling peach soda'), icon: '🥂', steps: ['ly', 'da', 'dao', 'syrup', 'lac'], fairPrice: 39_000, unlockCost: 0, popularity: 1.8, hotBonus: 0.4, coffee: false, family: 'tea', season: 'newyear' },
  { id: 'tetDua', name: L('Cà phê dừa mứt Tết', 'Tết coconut coffee'), icon: '🥥', steps: ['ly', 'chiet', 'suaDac', 'dua', 'da', 'lac'], fairPrice: 49_000, unlockCost: 0, popularity: 1.8, hotBonus: 0.3, coffee: true, family: 'coffee', season: 'tet' },
  { id: 'traSenTet', name: L('Trà sen ngày Tết', 'Lotus tea for Tết'), icon: '🍵', steps: ['ly', 'tra', 'syrup', 'khuay', 'kem'], fairPrice: 42_000, unlockCost: 0, popularity: 1.7, hotBonus: 0, coffee: false, family: 'tea', season: 'tet' },
  { id: 'suongMu', name: L('Sương Mù Đà Lạt', 'Đà Lạt Mist'), icon: '🌫️', steps: ['ly', 'chiet', 'trung', 'cacao', 'kemTuoi'], fairPrice: 65_000, unlockCost: 0, popularity: 1.8, hotBonus: 0, coffee: true, family: 'coffee', secret: true },
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
export const COUNTER_REVIEWS: Record<number, string[]> = L({
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
}, {
  5: [
    "So good I wanna steal the recipe, but don't want you mad at me 🤭",
    'This drink vs. a date? I pick the drink 💘',
    'One sip and I suddenly feel way prettier ✨',
    'Made faster than my crush leaves me on read, and way sweeter 😌',
    '10/10, coming back tomorrow, and the day after, and the day after that…',
    "Sooo good! One sip and I'm chilling in the Đà Lạt pines 🌲",
    '10 points! Posting this on my story, my crush will reply for sure',
    'Nailed it. This café must have trained 10 years on a mountain 😤✨',
    "Absolute peak! Tomorrow I'm bringing the whole squad",
    "So good I could cry, but then it'd get salty 🥹",
  ],
  4: [
    'Tasty, but the wait was long enough to finish my thesis 📚',
    'Solid flavor, I just aged 2 years waiting',
    'Yummy, but so much ice I thought I was at the North Pole 🐧',
    "4 stars. I'm keeping the last one as a souvenir",
    'Really good, but I scrolled through all of TikTok while waiting 😅',
    'Taste 10, speed 6, still love it',
    'Worth the wait, but a bit faster next time so I make my shift, ok?',
    'Good, but I almost grew roots at the counter 🌱',
  ],
  3: [
    'Like a pop quiz: not bad, but I remember nothing',
    "First time tasting this in my life. Not sure if I'm happy or sad 😐",
    'Cute cup. The drink… let me think about it',
    'The barista put their whole heart in, but left their brain at home 🧠',
    'Drinkable, but this one is a bit "creative" compared to the menu 🤔',
    'Kinda sweet, kinda bland, just like my ex',
    "It's okay. Is the barista heartbroken today?",
    'Weird taste, but hey, weird is an experience too 😶',
  ],
  2: [
    'One sip brought back my childhood… all the times I got grounded 😵',
    'Is this coffee or dishwater? Still deciding 🫠',
    'This drink taught me a lesson: never trust the menu',
    '2 stars: 1 for the cup, 1 for the straw',
    'I ordered {drink} and got… a survival challenge 🫠',
    'After that I need to sit down and rethink my life 😵‍💫',
    'Thanks for showing me what a plot twist in a cup feels like',
    "Next time I'll just make it at home 🙂",
  ],
})
export const FAMILY_REVIEWS: Record<'coffee' | 'matcha' | 'tea', { good: string[]; meh: string[] }> = L({
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
}, {
  coffee: {
    good: ['Bold as a weekend deadline, love it!', 'So fragrant, I\'m wide awake now ☕'],
    meh: ['Sure, it wakes you up… right until 3am, pondering life 😵‍💫'],
  },
  matcha: {
    good: ['Dreamy matcha, green as my hopes of passing 🍵', 'Creamy and fragrant, total Gen Z vibe'],
    meh: ["Good matcha but a bit sweet, sweet as my boss's promises 😏"],
  },
  tea: {
    good: ['Fresh peach tea, life feels less dramatic now 🍑'],
    meh: ['Nice tea, but where did the peaches go? 🔍'],
  },
})

export const UPGRADES: Upgrade[] = [
  { id: 'staff', name: L('Thuê pha chế', 'Hire baristas'), icon: '🧑‍🍳', desc: L('Nhân viên pha chế lo TOÀN BỘ quầy nước: nhận đơn, pha cho mọi khách và đơn app – bạn rảnh tay vào Bếp nấu món. Thêm người thì pha nhanh hơn, quán đông hơn 15%/người. Lương 60k/ngày/người. (Nhân viên phục vụ thuê ở Khu ngồi.)', 'Baristas run the WHOLE drink bar: taking orders and making drinks for every customer and app order, so your hands are free for the Kitchen. More baristas = faster drinks, +15% customers each. Wage 60k/day each. (Hire servers in the Seating area.)'), costs: [300_000, 700_000, 1_400_000],
    effect: (l) => (l ? L(`${l} pha chế đang làm · tự pha cho khách xếp hàng`, `${l} barista${l > 1 ? 's' : ''} working · serving the queue`) : L('Chưa có pha chế', 'No baristas yet')) },
  { id: 'machine', name: L('Máy espresso xịn hơn', 'Better espresso machine'), icon: '⚙️', desc: L('Đổi máy mới trên quầy: chiết xuất nhanh hơn cho cả bạn lẫn nhân viên.', 'A new machine for the counter: faster brewing for you and your staff.'), costs: [400_000, 900_000, 2_000_000],
    effect: (l) => L(`Chiết xuất ${(1.1 / (1 + 0.35 * l)).toFixed(1)}s/lần · nhân viên pha ${(5 / (1 + 0.4 * l)).toFixed(1)}s/ly`, `Brew ${(1.1 / (1 + 0.35 * l)).toFixed(1)}s/shot · staff ${(5 / (1 + 0.4 * l)).toFixed(1)}s/drink`) },
  { id: 'shipper', name: L('Shipper rapper', 'Rapper delivery'), icon: '🛵', desc: L('Mở bán trên app DreamersFood. Shipper vừa giao vừa rap. Lương 70k/ngày.', 'Sell on the DreamersFood app. Your shipper delivers and raps. Wage 70k/day.'), costs: [350_000, 800_000],
    effect: (l) => (l ? L(`${l} shipper · nhận đơn app`, `${l} shipper${l > 1 ? 's' : ''} · app orders on`) : L('Chưa bán online', 'Not selling online')) },
  { id: 'decor', name: L('Bàn ghế & trang trí', 'Tables & decor'), icon: '🪴', desc: L('Quán đẹp hơn (thấy ngay trong cảnh quán): thêm khách, thêm chỗ chờ, khách kiên nhẫn hơn.', 'A prettier shop (you can see it!): more customers, more waiting spots, more patience.'), costs: [250_000, 500_000, 1_000_000, 2_000_000],
    effect: (l) => L(`+${l * 12}% khách · chỗ chờ ${4 + l} · kiên nhẫn +${l * 10}%`, `+${l * 12}% customers · ${4 + l} queue spots · +${l * 10}% patience`) },
  { id: 'sign', name: L('Biển hiệu & TikTok', 'Signs & TikTok'), icon: '📣', desc: L('Biển đèn neon, cờ dây, poster TikTok (thấy trong quán): nhiều khách ghé hơn.', 'Neon sign, bunting, TikTok posters (in the shop): more walk-ins.'), costs: [200_000, 500_000, 1_200_000],
    effect: (l) => L(`+${l * 20}% khách ghé quán`, `+${l * 20}% visitors`) },
  { id: 'freezer', name: L('Tủ đông', 'Freezer'), icon: '❄️', desc: L('Giữ đá không bị tan khi qua ngày mới.', 'Keeps your ice from melting overnight.'), costs: [350_000],
    effect: (l) => (l ? L('Đá được giữ lại qua đêm', 'Ice keeps overnight') : L('Đá còn dư tan hết cuối ngày', 'Leftover ice melts at closing')) },
  { id: 'green', name: L('Sống xanh', 'Go green'), icon: '🌱', desc: L('Ly giấy, ống hút tre, giảm giá khi mang ly riêng. Gen Z mê: +10% khách.', 'Paper cups, bamboo straws, a discount for bringing your own cup. Gen Z loves it: +10% customers.'), costs: [300_000], social: true,
    effect: (l) => (l ? L('+10% khách · tiết kiệm ly nhựa', '+10% customers · less plastic') : L('Chưa áp dụng', 'Not active')) },
  { id: 'farmer', name: L('Cà phê sạch Cầu Đất', 'Cầu Đất farm coffee'), icon: '👩‍🌾', desc: L('Mua thẳng từ nông dân, trả giá công bằng. Khách sẵn lòng trả thêm 15% cho món cà phê.', 'Buy straight from farmers at a fair price. Customers happily pay 15% more for coffee drinks.'), costs: [500_000], social: true,
    effect: (l) => (l ? L('Món cà phê được trả giá cao hơn 15%', 'Coffee drinks earn 15% more') : L('Chưa áp dụng', 'Not active')) },
]

export const WEATHERS: Weather[] = [
  { id: 'sunny', name: L('Nắng đẹp', 'Sunny'), icon: '☀️', customerMul: 1.1, deliveryMul: 0.9, hot: 0.5 },
  { id: 'hot', name: L('Nắng nóng', 'Heatwave'), icon: '🔥', customerMul: 1.25, deliveryMul: 1.2, hot: 1 },
  { id: 'cloudy', name: L('Nhiều mây', 'Cloudy'), icon: '⛅', customerMul: 1, deliveryMul: 1, hot: 0.3 },
  { id: 'rainy', name: L('Mưa', 'Rainy'), icon: '🌧️', customerMul: 0.65, deliveryMul: 1.7, hot: 0 },
]

export const CUSTOMER_FACES = ['🧑', '👩', '👨', '🧓', '👱‍♀️', '👱', '🧑‍💻', '👩‍💼', '👨‍🔧', '🧑‍🎓', '👷', '🧔', '👩‍🦰', '👨‍🦱', '🧑‍🎤', '👩‍🎨']

// ---------- Câu thoại Gen Z (vui, không tục) ----------
// Câu khách nói dùng mã xưng hô {t} {b} {k} {y} (xem voice.ts) để khớp với từng khách
export const LINES = L({
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
}, {
  impatient: [
    'Hello? Anyone there? 📞',
    'S.O.S. 🆘',
    'This is taking a while, ya know',
    "I'm wasting away here 🥲",
    'Not okay anymore, café',
    'Why is this taking forever',
    'Is my drink lost or something?',
    "I've grown roots waiting 🌱",
    'A little faster, pretty please 🥺',
    'My patience is on its last level',
  ],
  angry: [
    'Waited so long my phone went from 100% to 1% 🪫',
    "Forget it, I'll just order on the app 📱",
    'Are you growing the coffee from seed??',
    "So chill here I'm chilling all the way home 🙂",
    "Waited way too long, I'm out!",
    "That's it, off to another café 🏃",
    'Good things come to those who wait… not today',
    'Thought you sold coffee, turns out you sell waiting?',
    'Nope nope, not waiting anymore',
    'Truly beyond saving 💀',
    'This coffee will arrive in my next life',
    "I'll save you 1 star, okay 🙂",
    "I'm a human, not a cactus",
  ],
  happy: [
    'As good as my crush texting back at 2am',
    'This drink heals my soul 🩹',
    'Speechless. No notes 👌',
    'Absolute peak, to the moon! 🚀',
    'Ridiculously good',
    '10 out of 10, no buts 💯',
    'Totally slays ✨',
    'Loyal to this café forever 🍑',
    'True love right here',
    'Holy cow, so good 🐄',
    'Love this place the most 🫶',
    'Woke me up faster than my crush replies',
    'The vibe here is so my style',
    'Checking in for the besties right now!',
  ],
  tooExpensive: ['💸 Way too pricey', "💸 Wallet's thin", "💸 It's month-end", '💸 Maybe next time'],
  full: ['🚶 Too crowded, nah', '🚶 No room left', '🚶 Not worth the wait'],
})

export const REVIEWS = L({
  5: ['Shipper rap hay tới mức hàng xóm ra xin follow 🎤', 'Ly tới nơi đá còn lạnh hơn thái độ người yêu cũ', 'Đặt 1 ly, nghiện cả đời, ai chịu trách nhiệm đây?', 'Ship nhanh như flow, nước ngon xỉu, 5 sao không bàn cãi!', 'Anh shipper rap hay quá trời, cà phê thì đỉnh nóc', 'Đá còn nguyên, vị chuẩn bài, sẽ quay lại 🫶', 'Quá là slay, order lần thứ n rồi', 'Uống một ngụm là deadline tự chạy 🏃'],
  4: ['Ngon nha, mà shipper rap dài, em nghe hết 1 album mới nhận được ly', 'Nước ngon, mỗi tội ống hút bị bẻ cong theo flow', 'Ngon nha, ship hơi lâu xíu thôi', 'Ổn áp, lần sau nhanh hơn chút là perfect', 'Vị ok, shipper dễ thương, rap hơi lạc beat 😆'],
  3: ['Tạm được, đá tan còn nhanh hơn deadline của em', 'Không tệ, nhưng chưa đủ để em bỏ trà sữa', 'Tạm ổn, đá tan hơi nhiều rồi', 'Bình thường thôi, chờ hơi lâu', 'Nước được mà giao chậm quá'],
  2: ['Ly tới nơi thì nước đã thành nước lọc pha màu 🥲', 'Giao trễ tới mức em tự pha ở nhà xong rồi', 'Chờ mòn mỏi, nước tới thì nhạt như tình cũ', 'Giao trễ dữ thần, hơi buồn'],
  1: ['Đơn đi lạc còn hơn khách du lịch giữa mấy con dốc Đà Lạt 🥲', 'Chờ tới mức em quên luôn mình đã đặt món gì', 'Đơn bị huỷ vì chờ quá lâu, buồn ghê 🥲', 'Đặt từ sáng tới chiều chưa thấy, out!', 'Hết cứu, không đặt nữa đâu'],
}, {
  5: ['The shipper raps so well the neighbors came out to follow him 🎤', "Drink arrived with ice colder than my ex's attitude", "Ordered 1 drink, hooked for life, who's responsible?", 'Shipped fast as a flow, drink amazing, 5 stars no debate!', "The shipper's rap is fire, the coffee is peak", 'Ice still whole, flavor on point, will order again 🫶', 'Totally slays, order number n already', 'One sip and my deadlines run themselves 🏃'],
  4: ["Tasty, but the shipper's rap was so long I heard a whole album before my drink", 'Great drink, the straw just got bent to the flow', 'Tasty, delivery a tiny bit slow', 'Solid, a bit faster next time and it\'s perfect', 'Taste ok, cute shipper, rap a bit off-beat 😆'],
  3: ['Not bad, the ice melted faster than my deadline', 'Not bad, but not enough to make me quit bubble tea', 'Okay, a bit too much melted ice', 'Just average, the wait was long', 'Drink was fine, delivery too slow'],
  2: ['By the time it arrived it was tinted water 🥲', 'So late I already made one at home', 'Waited forever, drink as bland as an old flame', 'Super late, kinda sad'],
  1: ['My order got more lost than a tourist on the Đà Lạt hills 🥲', 'Waited so long I forgot what I ordered', 'Order canceled, waited too long, so sad 🥲', 'Ordered in the morning, still nothing by afternoon. Out!', 'Beyond saving, never ordering again'],
}) as Record<number, string[]>

export const SHIPPERS = [
  { name: 'MC Phin', face: '🧑‍🎤' },
  { name: L('Lil Sữa Đá', 'Lil Iced Milk'), face: '😎' },
]

export const RAPS = L([
  'Yo! Ly này còn lạnh, giao liền tay, khách chờ không lâu, năm sao bay ngay! 🎤',
  'Mưa không cản bước, nắng chẳng ngăn đường, cà phê Dreamers thơm cả phố phường! 🎤',
  'Check it! Trà đào mát lạnh trên con xe, giao tới nơi khách gật gù khen phê! 🎤',
  'Một ly đen đá, đậm đà tình thương, qua mấy ngã tư vẫn đúng giờ như thường! 🎤',
  'Đơn tới là đi, không đợi không chờ, flow thì mượt, ship thì đúng giờ! 🎤',
  'Đội mũ bảo hiểm, an toàn là trên hết, giao nhanh mà chắc, khách không phải hết kiên nhẫn! 🎤',
], [
  "Yo! Still ice cold, delivered on the fly, nobody had to wait, five stars in the sky! 🎤",
  "Rain can't stop me, sun can't block the street, Dreamers coffee makes the whole town sweet! 🎤",
  "Check it! Peach tea chillin' on my ride, rolled up to the door, customer satisfied! 🎤",
  'One iced black coffee, strong with love inside, through every intersection, always right on time! 🎤',
  "Order comes in, I'm gone, no stall, no wait, flow is smooth and my drop is never late! 🎤",
  'Helmet strapped tight, safety number one, fast but steady, every order done! 🎤',
])

// Tên vui cho khách vãng lai (chọn theo kiểu tóc nữ/nam) và khách đặt app
export const FEMALE_NAMES = ['Linda Lụa', 'Cindy Cà Pháo', 'Rosie Rau Má', 'Lisa Lúa Mới', 'Anna Ăn Vặt', 'Jessie Bánh Tráng', 'Mimi Mì Cay', 'Lucy Lẩu Thái', 'Nancy Nem Chua', 'Kitty Khoai Lang', 'Daisy Dâu Tằm', 'Bé Bơ Sáp']
export const MALE_NAMES = ['Tèo Em', 'Kenny Kều', 'Bin Sữa Chua', 'Jack Mì Tôm', 'Peter Phở Bò', 'Tom Trà Đá', 'Mít Tơ Bean', 'Bảo Bánh Bao', 'Johnny Chè Thái', 'Tony Tôm Chiên', 'Danny Dưa Hấu', 'Bobby Bột Chiên']
export const ORDER_NAMES = [...FEMALE_NAMES, ...MALE_NAMES]
export const funnyName = (g: Gender) => pick(g === 'f' ? FEMALE_NAMES : MALE_NAMES)

/** Người khó khăn nhận ly cà phê treo */
export const NEEDY: { face: string; who: string; thanks: string; look: Look }[] = [
  { face: '🧓', who: L('Chú xe ôm', 'Moto-taxi uncle'), thanks: L('Cảm ơn con nha, ly cà phê ấm lòng ghê!', 'Thank you, kiddo, this coffee warms my heart!'), look: { skin: '#d9a679', hair: '#3a3a3a', style: 'helmet', shirt: '#5f7d4a', accent: '#4f8a3c' } },
  { face: '👵', who: L('Cô bán vé số', 'Lottery-ticket auntie'), thanks: L('Quán dễ thương quá, cô cảm ơn nhiều nha!', 'Such a sweet café, thank you so much, dear!'), look: { skin: '#e2b48c', hair: '#555', style: 'nonla', shirt: '#d98c8c' } },
  { face: '🧑‍🎓', who: L('Bạn sinh viên cuối tháng', 'Broke student'), thanks: L('Cứu một mạng người cuối tháng, iu quán! 🫶', "You saved a life at month's end, love you! 🫶"), look: { skin: '#f3cba8', hair: '#2b1d16', style: 'short', shirt: '#e8a33d', acc: ['glasses'] } },
  { face: '👷', who: L('Anh công nhân', 'Construction worker'), thanks: L('Uống xong làm tiếp ca chiều có sức rồi!', "Now I've got the energy for my afternoon shift!"), look: { skin: '#cf9a6c', hair: '#222', style: 'hardhat', shirt: '#e8873a' } },
  { face: '👴', who: L('Bác ve chai', 'Old scrap collector'), thanks: L('Bác cảm ơn mấy đứa, tốt bụng quá!', 'Thank you, kids, so very kind of you!'), look: { skin: '#d8a982', hair: '#cfcac4', style: 'cap', shirt: '#8a7a66', accent: '#6f8fa8', acc: ['beard'] } },
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
    id: 'tomy', name: 'Tomy Tèo', face: '🏋️', role: L('Gymer, đếm calo từng giọt', 'Gym rat, counts every calorie'),
    p: xung.anh(),
    fav: ['americano', 'denDa'],
    look: { skin: '#e2b089', hair: '#2b1d16', style: 'spiky', shirt: '#e8503a', acc: ['blush'] },
    greet: L([
      'Cho anh {drink}, không đường, không sữa, không cảm xúc 💪',
      'Ê bro, {drink} như cũ, anh vừa đẩy ngực 100kg xong!',
      'Bro ơi! Như cũ nha, hôm nay anh lên cơ bụng múi thứ 6 rồi 🔥',
    ], ['One {drink}: no sugar, no milk, no feelings 💪', 'Yo, {drink} as usual, I just benched 100kg!', 'Bro! The usual, I just unlocked ab number 6 today 🔥']),
    chats: L([
      { say: 'Ly này nhiêu calo vậy em? Anh đang siết cơ', replies: [
        { text: 'Gần như 0 calo, chỉ có toàn cơ bắp thôi anh', answer: 'Haha em nói chuẩn, mai anh dắt cả phòng gym qua! 💪', bond: 9 },
        { text: 'Em không biết nữa', answer: 'Ờ… thôi uống đại 😅', bond: 2 },
      ] },
      { say: 'Em có tập gym không? Nhìn em gầy quá', replies: [
        { text: 'Em tập… nâng ly cà phê mỗi ngày 😆', answer: 'Hahaha, cũng là một môn thể thao đó! 🏆', bond: 10 },
        { text: 'Không ạ', answer: 'Bữa nào anh dẫn đi tập nha!', bond: 4 },
      ] },
    ], [
      { say: 'How many calories in this one? I\'m cutting', replies: [{ text: 'Basically zero, it\'s pure muscle', answer: 'Haha you get it, tomorrow I\'m bringing the whole gym! 💪', bond: 9 }, { text: 'I have no idea', answer: 'Uh… I\'ll just drink it 😅', bond: 2 }] },
      { say: 'Do you work out? You look so skinny', replies: [{ text: 'I lift… coffee cups, every day 😆', answer: 'Hahaha, that counts as a sport! 🏆', bond: 10 }, { text: 'Nope', answer: 'I\'ll take you to the gym sometime!', bond: 4 }] },
    ]),
  },
  {
    id: 'na', name: 'Linda Na', face: '🧑‍🎓', role: L('Sinh viên năm hai, nghiện matcha', 'Sophomore, matcha addict'),
    p: xung.em('f'),
    fav: ['matchaLatte', 'bacXiu', 'suaDa'],
    look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'long', shirt: '#7aa6e8', acc: ['blush'] },
    greet: L([
      'Dạ cho em một ly {drink} nha, ít ngọt xíu ạ!',
      G('Chị chủ ơi', 'Anh chủ ơi') + ', {drink} như mọi khi nha 🥺',
      G('Ê chị iu', 'Ê anh iu') + '! Như cũ nha, hôm nay em thi xong rồi nè 🎉',
    ], ['Could I get a {drink}, a little less sweet please!', 'Hi boss! {drink} like always, please 🥺', 'Heyyy bestie! The usual, I just finished my exams 🎉']),
    chats: L([
      { say: `Mai em thi cuối kỳ mà chưa học chữ nào hết á ${G('chị', 'anh')} 😭`, replies: [
        { text: 'Cố lên! Uống ly này là nhớ bài liền', answer: `Hihi ${G('chị', 'anh')} nói vậy em tin luôn đó nha! 🥰`, bond: 9 },
        { text: 'Thì… học đi em', answer: 'Dạ… biết rồi mà 🥲', bond: 2 },
      ] },
      { say: `${G('Chị', 'Anh')} ơi quán có wifi hông, em ngồi chạy deadline xíu`, replies: [
        { text: 'Có nè, pass là "dreamers2026" nha', answer: `Ủa ${G('chị', 'anh')} dễ thương dữ, em ngồi tới tối luôn 😆`, bond: 8 },
        { text: 'Wifi yếu lắm em ơi', answer: 'Hông sao, em xài 4G cũng được ạ', bond: 2 },
      ] },
      { say: `Cuối tháng rồi, ví em mỏng như tờ giấy luôn ${G('chị', 'anh')} ơi`, replies: [
        { text: `Ly này ${G('chị', 'anh')} bớt cho em 2 ngàn nha`, answer: `Trời ơi ${G('chị', 'anh')} là chân ái của đời em 🫶`, bond: 10 },
        { text: 'Ai cũng vậy mà em', answer: 'Dạ đúng rồi, đồng cảm ghê 😅', bond: 3 },
      ] },
    ], [
      { say: 'I have finals tomorrow and haven\'t studied a single word 😭', replies: [{ text: 'You got this! This drink will help you remember everything', answer: 'Hehe if you say so, I believe it! 🥰', bond: 9 }, { text: 'Well… go study', answer: 'Yeah… I know 🥲', bond: 2 }] },
      { say: 'Do you have wifi? I need to crunch a deadline', replies: [{ text: 'Yep, the password is "dreamers2026"', answer: 'You\'re too sweet, I\'m staying till night 😆', bond: 8 }, { text: 'The wifi\'s really weak', answer: 'That\'s okay, I\'ll use my data', bond: 2 }] },
      { say: 'Month-end again, my wallet is paper thin 😭', replies: [{ text: 'I\'ll knock 2k off this one for you', answer: 'Omg you\'re the love of my life 🫶', bond: 10 }, { text: 'Everyone\'s in the same boat', answer: 'True, I feel you 😅', bond: 3 }] },
    ]),
  },
  {
    id: 'tuan', name: 'Kenny Sang', face: '👨‍💼', role: L('Dân văn phòng, họp từ sáng tới tối', 'Office worker, meetings dawn to dusk'),
    p: xung.anh(),
    fav: ['denDa'],
    look: { skin: '#e9bf97', hair: '#1d1612', style: 'short', shirt: '#f4f4f0', accent: '#2e3f6e', acc: ['collar', 'tie'] },
    greet: L([
      'Cho anh ly {drink}, đậm đậm giùm nha.',
      'Như hôm qua nha em, {drink} không đường.',
      'Em ơi, "thuốc tỉnh" của anh đâu rồi 😂 Như cũ nha!',
    ], ['One {drink}, make it strong please.', 'Same as yesterday, {drink}, no sugar.', 'Hey, where\'s my "wake-up potion" 😂 The usual!']),
    chats: L([
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
    ], [
      { say: 'My boss held a 3-hour meeting this morning, I nearly passed out', replies: [{ text: 'I\'ll make it extra strong to wake you up', answer: 'You get me so well 😂', bond: 9 }, { text: 'That\'s short for a meeting', answer: 'Uh… fair point, I guess 😐', bond: 2 }] },
      { say: 'Weekend tourists everywhere, 45 minutes of traffic from the Đà Lạt market roundabout up here, yikes', replies: [{ text: 'Sit and rest a bit, the music here is chill', answer: 'Yeah, some lofi to unwind 🎧', bond: 8 }, { text: 'Why not leave earlier?', answer: 'Leave early and you hit the cloud-hunting tour buses 🥲', bond: 1 }] },
      { say: 'Going anywhere this weekend?', replies: [{ text: 'I\'ll be here at the shop, come by!', answer: 'Ok, Sunday I\'m bringing the whole team 👍', bond: 9 }, { text: 'That\'s a secret', answer: 'Haha, so mysterious', bond: 3 }] },
    ]),
  },
  {
    id: 'coba', name: L('Cô Ba Xôi Gấc', 'Auntie Ba Sticky Rice'), face: '👵', role: L('Bán xôi đầu hẻm', 'Sells sticky rice at the alley corner'),
    p: xung.co(),
    fav: ['suaDa'],
    look: { skin: '#e6b98f', hair: '#bdb6ae', style: 'bun', shirt: '#8e6bbf', acc: ['earring'] },
    greet: L([
      'Con ơi, cho cô ly {drink} nha con.',
      'Bữa nay cô ghé nữa nè, {drink} như cũ nghen con.',
      G('Con gái', 'Con trai') + ' cô đâu rồi? Cô đem xôi cho con nè, cho cô ly như cũ nha 💛',
    ], ['Sweetie, get me a {drink}, would you.', 'Here again today, dear, {drink} like usual.', G('Where\'s my girl? I brought you sticky rice. The usual please 💛', 'Where\'s my boy? I brought you sticky rice. The usual please 💛')]),
    chats: L([
      { say: 'Hồi trẻ cô cũng bán cà phê vợt ở chợ Bà Chiểu đó con', replies: [
        { text: 'Thiệt hả cô? Kể con nghe với!', answer: 'Hồi đó cà phê vợt thơm lắm con, mai cô kể tiếp nghen 😊', bond: 10 },
        { text: 'Dạ, giờ thì có phin rồi cô', answer: 'Ừ, thời thế thay đổi rồi ha con', bond: 3 },
      ] },
      { say: 'Mấy đứa nhỏ bây giờ uống gì mà muối với kem, cô hổng hiểu', replies: [
        { text: 'Bữa nào con pha cho cô thử một ly nha', answer: 'Ờ, để cô thử coi, biết đâu ghiền 😆', bond: 9 },
        { text: 'Tại cô lạc hậu đó', answer: G('Cái con này… 😤', 'Cái thằng này… 😤'), bond: -3 },
      ] },
    ], [
      { say: 'When I was young, I sold sock-filter coffee at Bà Chiểu market', replies: [{ text: 'Really? Tell me more!', answer: 'Oh, it smelled heavenly back then, dear. I\'ll tell you more tomorrow 😊', bond: 10 }, { text: 'Well, now we have phin filters', answer: 'Yes, times have changed, haven\'t they', bond: 3 }] },
      { say: 'Kids these days put salt and cream in coffee, I don\'t get it', replies: [{ text: 'I\'ll make you one to try sometime', answer: 'Alright, I\'ll try it, might get hooked 😆', bond: 9 }, { text: 'That\'s because you\'re old-fashioned', answer: 'Why you little… 😤', bond: -3 }] },
    ]),
  },
  {
    id: 'khoa', name: 'Huy Sơ Rum', face: '🧑‍💻', role: L('Dev chạy deadline, skincare 10 bước', 'Deadline dev, 10-step skincare'),
    p: xung.custom('m', 'tui', G('bà', 'ông'), 'ông', 'tui'),
    fav: ['cafeMuoi', 'latte', 'denDa'],
    look: { skin: '#f0c8a2', hair: '#3a2a20', style: 'messy', shirt: '#4a4f57', acc: ['glasses', 'hoodie'] },
    greet: L([
      'Cho mình một {drink}, size to nhất có thể 🙏',
      'Ê quán ơi, {drink} như cũ, bug hôm nay nhiều quá',
      'Bro! Như cũ nha, deploy xong rồi, hôm nay ăn mừng 🚀',
    ], ['One {drink}, biggest size possible 🙏', 'Hey, {drink} as usual, so many bugs today', 'Bro! The usual, just deployed, celebrating today 🚀']),
    chats: L([
      { say: 'Code chạy trên máy tui mà lên server là toang, mệt ghê', replies: [
        { text: '"Chạy trên máy tui" là chân lý rồi bro', answer: 'Hahaha đúng chuẩn dân IT luôn 😂', bond: 10 },
        { text: 'Ủa vậy là sao?', answer: 'Thôi khỏi giải thích, dài lắm 😅', bond: 2 },
      ] },
      { say: 'Đang tính nghỉ việc ra mở quán cà phê như bạn đó', replies: [
        { text: 'Mở quán cực lắm đó, mà vui!', answer: 'Thôi để tui code thêm vài năm rồi tính 😆', bond: 8 },
        { text: 'Mở đi, cạnh tranh với tui luôn', answer: 'Ủa gắt vậy 😳', bond: 1 },
      ] },
    ], [
      { say: 'Code works on my machine, then breaks on the server, ugh', replies: [{ text: '"Works on my machine" is the eternal truth, bro', answer: 'Hahaha spoken like a true dev 😂', bond: 10 }, { text: 'Wait, what does that mean?', answer: 'Never mind, long story 😅', bond: 2 }] },
      { say: 'Thinking of quitting to open a café like you', replies: [{ text: 'Running a café is tough, but fun!', answer: 'Eh, I\'ll code a few more years first 😆', bond: 8 }, { text: 'Go ahead, compete with me', answer: 'Whoa, harsh 😳', bond: 1 }] },
    ]),
  },
  {
    id: 'vy', name: 'Jenny Vy Vu', face: '👩‍🎤', role: L('TikToker review đồ uống', 'Drink-review TikToker'),
    p: xung.custom('f', 'Jenny', G('chị', 'anh'), 'em', G('chị', 'anh')),
    fav: ['matchaXay', 'traDao', 'suaDa'],
    look: { skin: '#f8d6bd', hair: '#ff8fb1', style: 'bob', shirt: '#b07ae0', acc: ['blush', 'earring'] },
    greet: L([
      'Hello quán! Cho Jenny một {drink} để quay clip review nha 📸',
      'Quán ơi, {drink} như bữa nha, clip trước lên 100k view đó!',
      'Bestie! Như cũ nha, hôm nay Jenny livestream ở quán luôn 💖',
    ], ['Hi there! A {drink} for Jenny, gotta film a review 📸', '{drink} like last time, please. The last clip hit 100k views!', 'Bestie! The usual, Jenny\'s livestreaming from here today 💖']),
    chats: L([
      { say: 'Góc nào trong quán lên hình đẹp nhất vậy?', replies: [
        { text: 'Góc cửa sổ có nắng chiều, đẹp xỉu!', answer: 'Oke để Jenny ra đó quay liền, cảm ơn nha ✨', bond: 9 },
        { text: 'Góc nào cũng được hết', answer: 'Ừm… để Jenny tự tìm vậy 😶', bond: 2 },
      ] },
      { say: 'Quán mình có gì đặc biệt để Jenny giới thiệu không?', replies: [
        { text: 'Cà phê sạch mua thẳng từ nông dân Cầu Đất nè', answer: 'Ý nghĩa quá trời, Jenny sẽ kể trong clip luôn! 💛', bond: 10 },
        { text: 'Giá rẻ nhất khu này', answer: 'Okela, rẻ cũng là một điểm cộng 😄', bond: 4 },
      ] },
    ], [
      { say: 'Which corner here looks best on camera?', replies: [{ text: 'The window with afternoon sun, gorgeous!', answer: 'Okay, Jenny\'s filming there now, thanks ✨', bond: 9 }, { text: 'Anywhere\'s fine', answer: 'Hmm… Jenny\'ll find one herself 😶', bond: 2 }] },
      { say: 'Anything special here Jenny can show off?', replies: [{ text: 'Clean coffee, bought straight from Cầu Đất farmers', answer: 'So meaningful, Jenny will put it in the clip! 💛', bond: 10 }, { text: 'Cheapest prices around', answer: 'Okie, cheap is a plus too 😄', bond: 4 }] },
    ]),
  },
]

export const BOND_LEVELS = [
  { min: 0, name: L('Người lạ', 'Stranger'), icon: '🤝' },
  { min: 25, name: L('Khách quen', 'Regular'), icon: '😊' },
  { min: 60, name: L('Bạn thân', 'Best friend'), icon: '💖' },
]
export const bondLevel = (b: number) => (b >= 60 ? 2 : b >= 25 ? 1 : 0)

// Khách vãng lai gọi món ({drink})
export const GENERIC_ORDERS = L([
  'Cho {t} một ly {drink} nha {b}!',
  'Ê quán ơi, một {drink} mang đi!',
  '{B} ơi, {drink} ít ngọt giùm {t} nha',
  'Cho {t} ly {drink}, nhiều đá nha {b}',
  '{drink} một ly nha, nghe nói quán làm ngon lắm!',
  '{B} ơi cho {t} {drink}, {t} đang vội xíu 🙏',
], [
  'One {drink} please!',
  'Hey there, one {drink} to go!',
  '{drink}, less sweet please',
  'A {drink} with extra ice, please',
  'One {drink}! Heard you make it really well!',
  "A {drink} please, I'm in a bit of a hurry 🙏",
])

// Chuyện phiếm với khách vãng lai
export const GENERIC_CHATS: ChatTopic[] = L([
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
], [
  { say: "It's so hot today I'm literally melting", replies: [
    { text: 'Extra ice in this one to cool you down!', answer: 'Aww so sweet, thank you 😆', bond: 6 },
    { text: "Yeah, it's hot", answer: 'Yeah…', bond: 1 },
  ] },
  { say: 'Is this place new? The decor is so cute', replies: [
    { text: 'Yep, just opened, come by often!', answer: "For sure, I'll bring my friends 🫶", bond: 7 },
    { text: "It's nothing special", answer: 'So humble 😂', bond: 2 },
  ] },
  { say: 'The music here is so chill, what song is this?', replies: [
    { text: 'Homemade lofi, never gets old!', answer: 'So cool, can I get the playlist? 🎧', bond: 6 },
    { text: 'No idea', answer: 'Okie 😅', bond: 1 },
  ] },
  { say: "My boss praised me today, I'm so happy", replies: [
    { text: 'Congrats! This drink should taste twice as good', answer: 'Hehe thanks, such a thoughtful café 🥰', bond: 7 },
    { text: 'Oh, okay', answer: 'Yeah… 😶', bond: 0 },
  ] },
])

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
  { name: L('Jessica Tổ Quạ', 'Jessica Crow\'s Nest'), title: L('Soi từng giọt cà phê', 'Inspects every drop of coffee'), p: xung.chi(),
    look: { skin: '#f3cfae', hair: '#8e4fc4', style: 'afro', shirt: '#ff7aa8', accent: '#d81b60', acc: ['catglasses', 'lipstick', 'hoops'] },
    greet: L(['Cho {t} {drink}. {T} soi kỹ lắm nha, giọt nào cũng phải đều', 'Một {drink}. {T} không khó tính đâu, {t} chỉ có tiêu chuẩn thôi'], ['A {drink}. I\'m inspecting closely, every drop must be even', 'One {drink}. I\'m not picky, I just have standards']),
    chats: L([tk('Tóc {t} mới làm 3 triệu đó, {b} thấy sao?',
      ['Đẹp như tổ chim thiên đường luôn {k}', 'Ừ, {b} có mắt thẩm mỹ đó', 8],
      ['Đẹp, mà chim nó tưởng nhà thật nên đậu hoài', 'Cái miệng này… mà công nhận sáng nay có con sẻ đậu thiệt', 6],
      ['Cũng được', 'Cũng được là sao, 3 triệu đó!'])], [tk('My hair cost 3 million, what do you think?', ['Gorgeous, like a bird-of-paradise nest', 'Yes, you\'ve got a good eye', 8], ['Gorgeous, but the birds think it\'s a real home', 'That mouth… but true, a sparrow landed on it this morning', 6], ['It\'s okay', 'Okay?? It cost 3 million!'])]) },
  { name: L('Chú Johnny Ria Mép', 'Uncle Johnny Mustache'), title: L('Cả đời chưa cười lần nào', 'Has never smiled in his life'), p: xung.chu(),
    look: { skin: '#e2b089', hair: '#2b2b2b', style: 'combover', shirt: '#6b8e23', acc: ['unibrow', 'mustache'] },
    greet: L(['Một {drink}. {T} không cười đâu, nhưng trong lòng {t} vui đó', '{drink}. {T} cả đời chưa cười, ly này mà ngon {t} suy nghĩ lại'], ['One {drink}. I don\'t smile, but inside I\'m happy', '{drink}. Never smiled in my life, but if this is good I\'ll reconsider']),
    chats: L([tk('Hồi đó {t} đi lính, cà phê pha bằng vớ, mà ngon hơn bây giờ',
      ['Dạ hôm nay {y} pha bằng phin, {k} chấm thử nha', 'Ừ… được. Đừng kể ai là {t} khen'],
      ['Dạ quán hết vớ rồi, {k} uống tạm phin nha', 'Hừ… (ria mép giật giật, hình như là cười)', 8],
      ['Dạ', 'Ừm.'])], [tk('Back in the army we brewed coffee in a sock, and it tasted better than today', ['Today I brewed it in a phin, give it a score', 'Hm… fine. Don\'t tell anyone I praised it'], ['We\'re out of socks, a phin will have to do', 'Hmph… (mustache twitches, possibly a smile)', 8], ['Yes sir', 'Hm.'])]) },
  { name: L('Bà Mary Lô Cuốn', 'Granny Mary Curlers'), title: L('Đi chợ tiện ghé qua chê', 'Stops by from the market to complain'), p: xung.ba(),
    look: { skin: '#eac3a0', hair: '#5a3a28', style: 'curlers', shirt: '#2fa38c', accent: '#ff9ac1', acc: ['bottleglasses', 'scarf', 'lipstick'] },
    greet: L(['{T} đi chợ ngang qua. Cho {t} {drink}, rồi {t} góp ý vài câu thôi', '{drink} một ly nghe {b}. Hồi {t} còn trẻ cà phê rẻ lắm, mà thôi, {t} kể sau'], ['Just passing by from the market. A {drink}, then I\'ll make a few remarks', 'A {drink}, dear. Back in my day coffee was cheap, but I\'ll tell you later']),
    chats: L([tk('Cái lô cuốn này {t} cuốn từ sáng, tối mới tháo. {B} biết vì sao không?',
      ['Dạ để tối đi đám cưới cho đẹp hả {k}', G('Đúng rồi, con nhỏ này lanh ghê', 'Đúng rồi, thằng nhỏ này lanh ghê')],
      ['Dạ để bắt sóng wifi hả {k}', 'Trời đất! Mà… bắt được thiệt không {b}?', 7],
      ['Dạ không', 'Vậy mà cũng không biết'])], [tk('These curlers went in this morning and come out tonight. Know why?', ['For a wedding tonight, right?', G('Exactly, what a sharp girl', 'Exactly, what a sharp boy')], ['To catch the wifi signal?', 'Good grief! But… does it really work?', 7], ['No idea', 'Don\'t even know that, huh'])]) },
  { name: L('Tony Mào Gà', 'Tony Rooster'), title: L('Chê trước, uống sau', 'Complains first, drinks later'), p: xung.anh(),
    look: { skin: '#f0c8a2', hair: '#39d353', style: 'mohawk', shirt: '#1d1d1d', accent: '#c0c0c0', acc: ['nosering', 'tattoobrow', 'chain'] },
    greet: L(['Yo, {drink}! {T} chê trước cho đỡ mất công: ly hơi nhỏ. Giờ pha đi', 'Một {drink}. {T} khó tính vì {t} có gu, chứ không phải vì {t} đói'], ['Yo, {drink}! Complaint up front to save time: the cup\'s too small. Now go', 'One {drink}. I\'m picky because I have taste, not because I\'m hungry']),
    chats: L([tk('Tóc {t} xịt nửa chai keo, gió Đà Lạt thổi không nhúc nhích. Đỉnh không {b}?',
      ['Đỉnh, như cột ăng-ten di động luôn {k}', 'Chuẩn, {t} đứng đâu là sóng mạnh chỗ đó'],
      ['Đỉnh, chim bay ngang tưởng cây xương rồng', 'Ê… cũng có con chim đậu thử thiệt', 7],
      ['Ừ', 'Ừ là sao, khen đi chứ'])], [tk('Half a can of hairspray, the Đà Lạt wind can\'t move it. Peak, right?', ['Peak, like a walking cell tower', 'Exactly, wherever I stand the signal\'s strong'], ['Peak, birds think it\'s a cactus', 'Hey… a bird did try landing on it', 7], ['Yeah', 'Yeah? Come on, compliment me'])]) },
  { name: L('Đại Gia Bill Keo', 'Stingy Tycoon Bill'), title: L('Giàu nứt vách, tip không một xu', 'Filthy rich, never tips a cent'), p: xung.anh(),
    look: { skin: '#e2b089', hair: '#111', style: 'slick', shirt: '#8e1b2c', accent: '#7a5a00', acc: ['shades', 'chain', 'mustache', 'goldtooth'] },
    greet: L(['Một {drink}. Bớt 2 ngàn được không {b}? Không à? Thôi, giá này cũng… chấp nhận', '{drink}. {T} có 3 căn nhà mặt tiền, nhưng ly này vẫn phải đúng giá nha'], ['One {drink}. 2k off? No? Fine, this price is… acceptable', '{drink}. I own 3 street-front houses, but this drink better be fairly priced']),
    chats: L([tk('{T} giàu là nhờ tiết kiệm. Ống hút {t} rửa xài lại 3 lần',
      ['Dạ vậy là sống xanh đó {k}, quán ủng hộ', 'Đúng! Xanh mà còn đỡ tốn tiền'],
      ['Dạ vậy chắc tiền tip {k} cũng rửa xài lại', 'Ờ… tip thì để lần sau đi', 6],
      ['Dạ', 'Học hỏi đi {b}'])], [tk('I\'m rich because I save. I wash and reuse my straws 3 times', ['That\'s living green, we support that', 'Right! Green and cheap'], ['So I guess you wash and reuse your tips too', 'Uh… tips next time, then', 6], ['Okay', 'Learn from me, kid'])]) },
  { name: L('Cô Selena Nón Rộng', 'Auntie Selena Big Hat'), title: L('Check-in xong mới chê', 'Posts a check-in first, complains later'), p: xung.co(),
    look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'sunhat', shirt: '#f2c14e', accent: '#e86a5a', acc: ['tattoobrow', 'hoops', 'lipstick', 'shades'] },
    greet: L(['Cho {t} {drink}, để {t} check-in đã rồi mới uống, ánh sáng đang đẹp', '{drink} nha {b}. {T} chụp xong mới chê, chê xong mới khen, quy trình đó'], ['A {drink}. Let me check in first, the lighting\'s perfect', '{drink}, dear. Photo first, then complain, then praise. That\'s the process']),
    chats: L([tk('Cái nón này rộng 1 mét, {t} đi qua cửa phải nghiêng đầu. {B} thấy hợp không?',
      ['Dạ hợp lắm, che nắng cho cả bàn bên luôn {k}', 'Đó, nón đẹp là nón có ích'],
      ['Dạ hợp, mà hôm qua nó che mất bảng giá của quán', 'Ha! Vậy hôm nay {t} xin giảm giá bù nha', 6],
      ['Dạ', 'Khen một câu cũng không được hả {b}'])], [tk('This hat is 1 meter wide, I tilt my head through doors. Suits me?', ['Totally, it shades the next table too', 'See, a pretty hat is a useful hat'], ['Suits you, but yesterday it blocked our price board', 'Ha! Then I want a discount today to make up for it', 6], ['Sure', 'Can\'t even give me one compliment?'])]) },
  // ----- khách cá tính mới -----
  { name: L('Ông Tư Tám Chuyện', 'Grandpa Tư the Chatterbox'), title: L('Gọi một ly, kể ba tiếng', 'Orders one drink, talks for three hours'), p: xung.ong(),
    look: { skin: '#e2b48c', hair: '#e8e4de', style: 'combover', shirt: '#8a6a4a', accent: '#c9a86a', acc: ['bottleglasses', 'mustache'] },
    greet: L(['Cho {t} ly {drink} nghe {b}. Ngồi xuống đây {t} kể chuyện xưa cho nghe…', '{drink} nghe {b}. Hồi {t} bằng tuổi {b}, Đà Lạt lạnh tới mức cà phê đông thành đá'], ['A {drink}, kiddo. Sit down, let me tell you about the old days…', '{drink}, kiddo. At your age, Đà Lạt was so cold the coffee froze solid']),
    chats: L([tk('Hồi xưa {t} cua bà nhà bằng một ly cà phê sữa với một bài thơ',
      ['Dạ lãng mạn quá, {k} đọc bài thơ cho {y} nghe với', 'Để {t} nhớ… “Em ơi Đà Lạt…” Ờ, quên rồi, mà bà vẫn đồng ý'],
      ['Dạ chắc bà đồng ý vì ly cà phê chứ không phải bài thơ', 'Ha ha! Bà nhà cũng nói y chang vậy đó {b}', 8],
      ['Dạ', 'Ừ, bọn trẻ bây giờ không nghe chuyện nữa'])], [tk('I won my wife over with an iced milk coffee and a poem', ['So romantic, recite the poem for me', 'Let me remember… "Oh Đà Lạt, my dear…" Ah, forgot it, but she still said yes'], ['She probably said yes for the coffee, not the poem', 'Ha ha! My wife says the exact same thing', 8], ['Okay', 'Ah, young folks don\'t listen to stories anymore'])]) },
  { name: L('Chị Diễm Mặc Cả', 'Diễm the Haggler'), title: L('Trả giá cả ly nước lọc', 'Haggles even over plain water'), p: xung.chi(),
    look: { skin: '#f3c9a6', hair: '#b03a2e', style: 'bun', shirt: '#e86a5a', accent: '#f2c14e', acc: ['catglasses', 'hoops', 'lipstick'] },
    greet: L(['{drink} bao nhiêu {b}? 35 hả? 20 được không, {t} mua 1 ly mà, mua nhiều đâu', 'Cho {t} {drink}. Bớt 5 ngàn, {t} giới thiệu cả xóm tới uống'], ['How much is a {drink}? 35? How about 20, it\'s just one cup', 'A {drink}. 5k off and I\'ll bring the whole neighborhood']),
    chats: L([tk('Ở chợ {t} trả giá từ 100 xuống 30 là chuyện thường. {B} có bớt không?',
      ['Dạ quán tặng {k} thêm nụ cười, không tính tiền', 'Hừm… nụ cười thì nhận, nhưng lần sau phải bớt nha'],
      ['Dạ bớt được, bớt đá, bớt sữa, bớt luôn cà phê', 'Thôi thôi, giữ nguyên giùm {t}!', 8],
      ['Không bớt', 'Quán gì mà cứng ghê'])], [tk('At the market I haggle 100 down to 30, easy. Any discount here?', ['We\'ll throw in a free smile', 'Hmm… I\'ll take the smile, but next time I want a discount'], ['Sure: less ice, less milk, less coffee too', 'No no, keep it all as is!', 8], ['No discount', 'What a stubborn café'])]) },
  { name: L('Anh Ken Crypto', 'Ken Crypto'), title: L('Trả bằng coin, coin đang sập', 'Pays in crypto, crypto is crashing'), p: xung.anh(),
    look: { skin: '#f0c8a0', hair: '#2b2b2b', style: 'cap', shirt: '#1f1f24', accent: '#f2c14e', acc: ['shades', 'chain'] },
    greet: L(['Cho {t} {drink}. Quán nhận Bitcoin không {b}? Không à… vậy chờ {t} bán coin rồi chuyển khoản', 'Một {drink}! Hôm nay coin xanh, {t} bao cả quán… à mới đỏ lại rồi, 1 ly thôi'], ['A {drink}. Take Bitcoin? No… then wait till I sell my coins and transfer', 'One {drink}! Coins are green, drinks on me… oh, red again. Just one']),
    chats: L([tk('{B} có muốn đầu tư không? Coin này x100 trong tuần sau',
      ['Dạ thôi, {y} đầu tư vào cà phê là đủ hồi hộp rồi', 'Haha an toàn ghê, cà phê không bao giờ sập'],
      ['Dạ x100 giống tuần trước {k} nói đó hả', 'Ờ… tuần trước là… điều chỉnh kỹ thuật thôi', 7],
      ['Không', 'Rồi sẽ hối hận đó'])], [tk('Wanna invest? This coin will 100x next week', ['No thanks, coffee is thrilling enough for me', 'Haha, safe choice, coffee never crashes'], ['100x, like you said last week?', 'Uh… last week was… a technical correction', 7], ['No', 'You\'ll regret it'])]) },
  { name: L('Bé Su Gen Alpha', 'Little Su, Gen Alpha'), title: L('Nói toàn từ lóng không ai hiểu', 'Speaks only in slang nobody gets'), p: xung.em('f'),
    look: { skin: '#f8dcc4', hair: '#ff8fb1', style: 'bob', shirt: '#7ad0e8', accent: '#ff7aa8', acc: ['blush', 'glasses'] },
    greet: L(['{B} ơi cho {t} {drink}, ly này phải slay nha, không là {t} ô dề', '{drink}! Quán này aura +1000, {t} chấm 10 trên 10 skibidi'], ['Hiii, a {drink}, it better slay or it\'s giving cringe', '{drink}! This place\'s aura is +1000, 10 out of 10 skibidi']),
    chats: L([tk('{B} ơi, ly này có “điểm aura” không?',
      ['Có chứ, ly nào ở đây cũng aura max, {k} uống là thấy', 'Ô sì kê! {B} chill phết đó nha'],
      ['Aura của ly này cao hơn điểm toán của {k}', 'Ơ… sao biết… flop thật sự', 7],
      ['Không biết', 'Boomer quá trời'])], [tk('Does this drink have "aura points"?', ['Of course, every drink here is max aura, you\'ll feel it', 'Okayyy! You\'re lowkey chill'], ['This drink has more aura than your math grade', 'Wait… how\'d you know… total flop', 7], ['No idea', 'So boomer'])]) },
  { name: L('Cô Tám Hóng Hớt', 'Auntie Tám the Gossip'), title: L('Biết hết chuyện cả dốc', 'Knows every secret on the hill'), p: xung.co(),
    look: { skin: '#e6b98f', hair: '#3a2a20', style: 'nonla', shirt: '#c25b8e', accent: '#f2c14e', acc: ['earring', 'tattoobrow'] },
    greet: L(['Cho {t} ly {drink}. {B} biết gì chưa? Quán bên kia mới… thôi để {t} kể sau', '{drink} nghe {b}. Nhà số 7 mới mua xe, {t} biết trước cả chủ xe'], ['A {drink}. Heard the news? The café across the street just… never mind, later', '{drink}, dear. House no. 7 just bought a car, and I knew before the owner did']),
    chats: L([tk('{B} nghe gì chưa, ông chủ chuỗi MÂY hôm qua bị vợ… à mà thôi, {t} không phải người nhiều chuyện',
      ['Dạ {k} kể tiếp đi, {y} hứa không nói ai', 'Ừ, vậy ngồi đây {t} kể từ đầu…'],
      ['Dạ {k} không nhiều chuyện, {k} chỉ là đài phát thanh của dốc thôi', 'Cái miệng này! Mà công nhận, đài này phát 24/24', 8],
      ['Dạ không nghe', 'Vậy thôi, {t} đi kể quán khác'])], [tk('Did you hear, the MÂY chain boss\'s wife yesterday… oh never mind, I\'m no gossip', ['Go on, I promise not to tell', 'Alright, sit down, I\'ll start from the beginning…'], ['You\'re no gossip, you\'re just the hill\'s radio station', 'That mouth! But true, this station runs 24/7', 8], ['Not interested', 'Fine, I\'ll go tell another café'])]) },
  { name: L('Chú Bảy Phong Thuỷ', 'Uncle Bảy Feng Shui'), title: L('Ly phải đặt hướng Đông Nam', 'Cups must face southeast'), p: xung.chu(),
    look: { skin: '#d9a679', hair: '#bdb6ae', style: 'slick', shirt: '#c9a227', accent: '#8e1b2c', acc: ['beard', 'glasses'] },
    greet: L(['Cho {t} {drink}. Nhớ đặt ly hướng Đông Nam, quay quai về phía cửa nghe {b}', '{drink} nghe {b}. Hôm nay mệnh {t} thiếu Thuỷ, cho thêm đá'], ['A {drink}. Set the cup facing southeast, handle toward the door', '{drink}, kiddo. My element lacks Water today, extra ice']),
    chats: L([tk('Quán này cửa hướng Tây, bán buổi chiều là hợp. Mà cái quầy nên dời 30 phân',
      ['Dạ mai {y} thử dời, {k} xem giùm ngày đẹp', 'Mai không đẹp, mốt cũng không, tháng sau đi'],
      ['Dạ dời 30 phân là đụng tường, chắc phải đập tường', 'Ờ… thì thôi, đặt thêm chậu cây là hoá giải', 7],
      ['Dạ', 'Không tin thì thôi'])], [tk('Your door faces west, good for afternoon sales. But move the counter 30cm', ['I\'ll try tomorrow, pick me a lucky day', 'Tomorrow\'s bad, day after too. Next month'], ['30cm and I hit the wall, guess we knock it down', 'Uh… never mind, a potted plant will fix it', 7], ['Okay', 'Don\'t believe me, then'])]) },
  { name: L('Anh Hùng Khoe Xe', 'Hùng the Show-off'), title: L('Đậu xe ngay cửa để khoe', 'Parks at the door just to show off'), p: xung.anh(),
    look: { skin: '#e2b089', hair: '#1d1612', style: 'helmet', shirt: '#e8503a', accent: '#2b2b2b', acc: ['shades', 'goldtooth'] },
    greet: L(['Cho {t} {drink}. {B} thấy chiếc xe ngoài cửa không? Xe {t} đó, mới lăn bánh', '{drink} nha. Để {t} dời xe ra chỗ có nắng cho nó bóng'], ['A {drink}. See that bike outside? Mine. Brand new', '{drink}, please. Let me move my bike into the sun so it shines']),
    chats: L([tk('Xe {t} 1 tỷ đó, mà lên dốc Đà Lạt vẫn phải về số 1',
      ['Dạ xe đẹp thật, màu này lên hình chắc đẹp lắm {k}', 'Đó, {b} có gu! Lát chụp chung nha'],
      ['Dạ 1 tỷ mà leo dốc vẫn thua con Dream của ông Tư', 'Ơ… con Dream đó bất tử thiệt mà', 6],
      ['Dạ', 'Khen xe một câu đi mà'])], [tk('My bike cost a billion, still needs first gear on the Đà Lạt hills', ['It\'s gorgeous, that color must look great in photos', 'See, you\'ve got taste! Selfie later'], ['A billion and it still loses to old Tư\'s Honda Dream', 'Uh… that Dream really is immortal', 6], ['Okay', 'Say one nice thing about my bike'])]) },
  { name: L('Chị Mẹ Bỉm Sữa', 'Busy Mom'), title: L('Một tay bế con, một tay chốt đơn', 'Baby in one arm, closing sales with the other'), p: xung.chi(),
    look: { skin: '#f6d3b3', hair: '#2b1d16', style: 'messy', shirt: '#b8d8f0', accent: '#ff9aa8', acc: ['hoodie', 'blush'] },
    greet: L(['Cho {t} {drink}, nhanh giùm nha {b}, bé nhà {t} ngủ được đúng 20 phút', '{drink} một ly. Hôm nay {t} quyết uống hết lúc còn lạnh, lần đầu trong 2 năm'], ['A {drink}, quick please, my baby sleeps exactly 20 minutes', 'One {drink}. Today I\'ll finish it while it\'s cold, first time in 2 years']),
    chats: L([tk('Sáng giờ {t} chốt 47 đơn online, mà con khóc 46 lần',
      ['{K} giỏi quá, {y} tặng thêm ly nước cam nha', 'Trời ơi cảm động, cảm ơn {b} nha'],
      ['Vậy là bé còn nhường {k} 1 lần', 'Hahaha đúng rồi, bé biết thương mẹ', 8],
      ['Dạ', 'Ừ… {t} đi đây, bé dậy rồi'])], [tk('Closed 47 online orders since morning, and the baby cried 46 times', ['You\'re amazing, here\'s a free orange juice', 'Aww, so touching, thank you'], ['So the baby let you have one', 'Hahaha true, baby loves mommy', 8], ['Okay', 'Yeah… gotta go, baby\'s awake'])]) },
  // ----- ban nhạc trên dốc -----
  { name: L('Chú Hoàng Vua Karaoke', 'Uncle Hoàng, Karaoke King'), title: L('Hát xong một bài mới chịu gọi món', 'Sings a song before ordering'), p: xung.chu(),
    look: { skin: '#f0c8a2', hair: '#1d1612', style: 'short', shirt: '#f4f4f0', acc: ['crown', 'mustache', 'tank'] },
    greet: L(['🎤 “Ly {drink} của tôiii…” Hát xong rồi, cho {t} {drink} nghe {b}', '{T} là vua karaoke cả dốc này. Một {drink}, pha cho xứng với nhà vua nha'], ['🎤 "My {drink}, oh my {drink}…" Done singing, a {drink} please', 'I\'m the karaoke king of this hill. One {drink}, fit for a king']),
    chats: L([tk('Tối qua {t} hát 3 tiếng liền, hàng xóm vỗ tay quá trời',
      ['Dạ chắc {k} hát hay nên cả xóm mê', 'Đó! Bữa nào {t} hát tặng quán một bài'],
      ['Dạ {y} nghe nói họ vỗ tay để {k} nghỉ', 'Hừ… vậy mà {t} tưởng họ xin bis', 7],
      ['Dạ', 'Vua hát mà không ai khen một câu'])], [tk('Sang 3 hours straight last night, the neighbors clapped like crazy', ['Must be because you sing so well', 'See! I\'ll sing one for the café someday'], ['I heard they clapped so you\'d stop', 'Hmph… I thought they wanted an encore', 7], ['Okay', 'A king sings and nobody praises him'])]) },
  { name: L('Anh Sấm Tia Chớp', 'Sấm the Lightning Bolt'), title: L('Rocker vẽ sét lên mặt đi uống cà phê', 'Rocker with a bolt painted on his face'), p: xung.anh(),
    look: { skin: '#f6d3b3', hair: '#e8603a', style: 'spiky', shirt: '#f4f4f0', acc: ['bolt', 'star'] },
    greet: L(['Yo! Một {drink}, đậm như solo guitar nha {b}', '{drink}! Pha nhanh như tia chớp, {t} còn đi tập band'], ['Yo! One {drink}, strong as a guitar solo', '{drink}! Fast as lightning, I\'ve got band practice']),
    chats: L([tk('Cái tia chớp trên mặt {t} vẽ bằng bút lông, rửa 3 ngày chưa trôi',
      ['Dạ để vậy luôn đi {k}, ngầu lắm', 'Chuẩn, {t} cũng tính để vậy tới show cuối tuần'],
      ['Dạ nhìn giống bị điện giật đúng lúc chụp ảnh thẻ', 'Haha… thật ra {t} bị giật thiệt lúc cắm đàn', 7],
      ['Dạ', 'Rock không có khán giả buồn ghê'])], [tk('Drew this bolt with a marker, 3 days and it won\'t wash off', ['Keep it, looks so cool', 'Right, planning to keep it till the weekend show'], ['Looks like you got zapped mid ID photo', 'Haha… actually I did get zapped plugging in my guitar', 7], ['Okay', 'Rock with no audience is sad'])]) },
  { name: L('Chị Vy Áo Đỏ', 'Vy in Red'), title: L('Hát rock phòng trà, mặt lạnh như băng', 'Lounge rock singer, face cold as ice'), p: xung.chi(),
    look: { skin: '#fbe3d0', hair: '#111', style: 'bangs', shirt: '#c8323a', acc: ['buttons', 'lipstick'] },
    greet: L(['{drink}. Không đường. Không nói nhiều.', 'Cho {t} {drink}. {T} cười ít, nhưng uống ngon là {t} quay lại'], ['{drink}. No sugar. No small talk.', 'A {drink}. I rarely smile, but if it\'s good I\'ll be back']),
    chats: L([tk('Mái tóc này {t} tự cắt, bằng một nhát kéo',
      ['Dạ thẳng như thước kẻ, {y} phục {k} luôn', '…Cảm ơn. (khoé miệng nhếch lên 1 pixel)'],
      ['Dạ nhát đó chắc cắt luôn nụ cười của {k}', 'Ha. Câu này được. {T} cho {b} 1 điểm', 8],
      ['Dạ', '…'])], [tk('I cut these bangs myself, in one snip', ['Straight as a ruler, I\'m impressed', '…Thanks. (lips curl up 1 pixel)'], ['That snip must\'ve cut off your smile too', 'Ha. Good one. I\'ll give you 1 point', 8], ['Okay', '…'])]) },
  { name: L('Bé Mây Tai Nghe', 'Little Mây Headphones'), title: L('Đeo tai nghe 24/24, gọi mãi không nghe', 'Headphones on 24/7, never hears you'), p: xung.em('f'),
    look: { skin: '#f8dcc4', hair: '#f2d15a', style: 'long', shirt: '#9fd3ea', accent: '#3f8fd9', acc: ['headphones', 'blush'] },
    greet: L(['(nói rất to) CHO {T} MỘT {drink} Ạ! À… {t} quên tháo tai nghe', '{B} ơi {drink} nha, bài này hay quá {t} không tháo tai nghe được'], ['(very loud) ONE {drink} PLEASE! Oh… forgot to take my headphones off', 'A {drink}, please. This song\'s too good to take them off']),
    chats: L([tk('{B} có muốn nghe thử playlist “cà phê mưa Đà Lạt” của {t} không?',
      ['Có chứ, cho {y} nghe ké một bên tai', 'Nè nè, bài số 3 là ruột của {t} đó'],
      ['Dạ thôi, {y} sợ nghe xong cũng không tháo ra được', 'Hihi, công nhận gây nghiện thiệt', 7],
      ['Không', '(không nghe thấy gì, vẫn gật gù)'])], [tk('Wanna hear my "rainy Đà Lạt coffee" playlist?', ['Sure, let me borrow one earbud', 'Here, track 3 is my fave'], ['No thanks, I might never take them off either', 'Hehe, it really is addictive', 7], ['No', '(hears nothing, keeps nodding)'])]) },
  { name: L('Cô Hồng Bolero', 'Auntie Hồng Bolero'), title: L('Hát bolero ai nghe cũng khóc', 'Sings bolero that makes everyone cry'), p: xung.co(),
    look: { skin: '#f6d6c2', hair: '#111', style: 'updo', shirt: '#2b2b30', acc: ['flower', 'lipstick', 'blush'] },
    greet: L(['Cho {t} ly {drink}, ngọt ngọt thôi nghe {b}, để tối {t} còn hát', '{drink} nghe {b}. “Chiều nay không có mưa bay…” cà phê phải buồn buồn mới ngon'], ['A {drink}, just a little sweet, dear, I\'m singing tonight', '{drink}, dear. "No drifting rain this afternoon…" Coffee tastes best a little sad']),
    chats: L([tk('Hồi đó {t} hát ở phòng trà, khán giả khóc ướt cả khăn',
      ['Dạ {k} hát một câu cho {y} nghe với', '“Đêm nay ai đưa em về…” Đó, nghe là thấy nhớ nhà liền'],
      ['Dạ chắc khán giả khóc vì giá vé phòng trà', G('Cái con nhỏ này! Mà… cũng có người khóc vì vậy thiệt', 'Cái thằng nhỏ này! Mà… cũng có người khóc vì vậy thiệt'), 7],
      ['Dạ', 'Thôi, bolero không hợp người vô cảm'])], [tk('Back then I sang in lounges, audiences soaked their hankies', ['Sing me a line', '"Who\'ll walk you home tonight…" There, instantly homesick'], ['Maybe they cried over the ticket prices', G('You cheeky girl! But… some really did cry over that', 'You cheeky boy! But… some really did cry over that'), 7], ['Okay', 'Well, bolero isn\'t for the heartless'])]) },
  { name: 'DJ Hồng Bass', title: L('Đà Lạt 15 độ vẫn mặc đồ đi biển', 'Beachwear in 15°C Đà Lạt'), p: xung.minh('f'),
    look: { skin: '#c98a5e', hair: '#ff8fb1', style: 'shoulder', shirt: '#c98a5e', accent: '#3fae5a', acc: ['headphones', 'bikini', 'blush'] },
    greet: L(['Drop the bass! Cho {t} một {drink}, đá nhiều vào cho máu lửa', '{drink}! {T} vừa đi diễn về, lạnh quá mà vẫn phải giữ hình tượng'], ['Drop the bass! One {drink}, extra ice to keep the fire going', '{drink}! Just back from a gig, freezing but gotta keep the image']),
    chats: L([tk('Tối nay {t} quẩy ở hồ Xuân Hương, {b} tới không?',
      ['Tới chứ, {y} đem cà phê tới tiếp sức cho {k}', 'Đỉnh! {B} là fan cứng đầu tiên của {t}'],
      ['Tới, mà {y} đem theo áo khoác cho {k} trước', 'Haha… ừ thật ra {t} đang run cầm cập', 8],
      ['Không', 'Okay, vậy {t} bật nhạc nhỏ thôi'])], [tk('Tonight I\'m partying at Xuân Hương Lake, you coming?', ['Of course, I\'ll bring coffee to fuel you', 'Awesome! You\'re my first true fan'], ['Coming, but I\'m bringing you a jacket first', 'Haha… yeah, honestly I\'m shivering', 8], ['No', 'Okay, I\'ll keep the music low then'])]) },
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
