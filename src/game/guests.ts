// Khách du lịch khắp nơi ghé Dreamers Coffee: Hàn, Trung, Anh, Pháp, Ý, Đức, Nga, khách Việt đi săn mây,
// dân văn phòng "nghỉ dưỡng" vẫn chạy deadline, và hội khách cá tính trên phố.
// Mỗi nhóm có tên nam/nữ riêng (ngoại hình khớp giới tính), cách xưng hô, câu gọi món, câu hối, review và chuyện tám.
// Xưng hô dùng mã {t} {b} {k} {y} {nữ|nam} – xem voice.ts. Chuyện tám: ngọt ngào · xéo sắc · cụt lủn.
import type { Look, HairStyle, Acc, ChatTopic } from './data'
import { xung, type Gender, type Persona } from './voice'
import { L, G } from './i18n'

const pk = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const t = (say: string, nice: [string, string, number?], sassy: [string, string, number], dry: [string, string]): ChatTopic => ({
  say,
  replies: [
    { text: nice[0], answer: nice[1], bond: nice[2] ?? 7 },
    { text: sassy[0], answer: sassy[1], bond: sassy[2], sassy: true },
    { text: dry[0], answer: dry[1], bond: 1 },
  ],
})

// phụ kiện chỉ hợp 1 giới
const MALE_ACC: Acc[] = ['beard', 'mustache', 'unibrow']
const FEMALE_ACC: Acc[] = ['lipstick', 'hoops', 'catglasses']
interface LookPool { skins: string[]; hairs: string[]; fs: HairStyle[]; ms: HairStyle[]; shirts: string[]; acc?: [Acc, number][] }
function lookFrom(p: LookPool, g: Gender): Look {
  const acc: Acc[] = []
  for (const [a, chance] of p.acc ?? []) {
    if ((g === 'f' && MALE_ACC.includes(a)) || (g === 'm' && FEMALE_ACC.includes(a))) continue
    if (Math.random() < chance) acc.push(a)
  }
  return { skin: pk(p.skins), hair: pk(p.hairs), style: pk(g === 'f' ? p.fs : p.ms), shirt: pk(p.shirts), accent: pk(p.shirts), acc }
}
/** xưng hô theo chữ đầu tên: "Anh Tuấn…" → anh, "Cô Ba…" → cô, "Bé Ngọc…" → em */
function byTitle(name: string, g: Gender): Persona {
  const w = name.split(' ')[0]
  if (w === 'Anh') return xung.anh()
  if (w === 'Chị') return xung.chi()
  if (w === 'Cô') return xung.co()
  if (w === 'Chú') return xung.chu()
  if (w === 'Bà') return xung.ba()
  if (w === 'Ông') return xung.ong()
  if (w === 'Em' || w === 'Bé') return xung.em(g)
  return xung.minh(g)
}

/** Người cụ thể trong nhóm (khách cá tính có ngoại hình, xưng hô & thoại riêng) */
export interface GuestPerson { name: string; look: Look; p: Persona; greet: string[]; chats: ChatTopic[]; album: string }

export interface GuestGroup {
  id: string
  headline: string // tiêu đề thẻ "đoàn khách hôm nay"
  label: string // hiện cạnh tên: "Kim Bắp Cải · Hàn Quốc"
  blurb: string // tin "đoàn khách hôm nay" ở màn chuẩn bị
  foreign: boolean // tính vào nhiệm vụ / thành tựu "khách nước ngoài"
  weight: number // tỉ lệ ghé (so với nhóm khác)
  patience: number // hệ số kiên nhẫn: người Anh xếp hàng giỏi, dân văn phòng thì đang chạy deadline
  f: string[] // tên khách nữ
  m: string[] // tên khách nam
  names: string[] // tất cả tên (album)
  persona: (g: Gender, name: string) => Persona
  look: (g?: Gender) => Look
  greet: string[] // {drink} = tên món
  impatient: string[]
  good: string[] // review 4–5 sao
  meh: string[] // review 2–3 sao
  chats: ChatTopic[]
  people?: GuestPerson[]
}

type GroupDef = Omit<GuestGroup, 'names' | 'look'> & { pool: LookPool }
function group(d: GroupDef): GuestGroup {
  const { pool, ...rest } = d
  return { ...rest, names: [...d.f, ...d.m], look: (g) => lookFrom(pool, g ?? (Math.random() < 0.5 ? 'f' : 'm')) }
}

const ASIAN_SKIN = ['#f6d3b3', '#f0c8a2', '#f8dcc4', '#e9bf97']
const EURO_SKIN = ['#f8dcc4', '#f6d3b3', '#f3c9a6', '#fbe3d0']
const DARK_HAIR = ['#1d1612', '#2b1d16', '#3a2a20']

export const GUEST_GROUPS: GuestGroup[] = [
  group({
    id: 'han', headline: L('Đoàn khách Hàn Quốc', 'Korean Tour Group'), label: L('Hàn Quốc', 'Korea'), foreign: true, weight: 1, patience: 1,
    blurb: L('Đoàn du lịch Hàn Quốc vừa tới Đà Lạt, tay ai cũng cầm gậy selfie và lọ kem chống nắng', 'A Korean tour group just landed in Dalat, all with selfie sticks and sunscreen'),
    f: L(['Kim Bắp Cải', 'Choi Kim Chi', 'Han Mặt Nạ', 'Yoon Mì Cay'], ['Kim Cabbage', 'Choi Kimchi', 'Han Sheet-Mask', 'Yoon Spicy-Ramyeon']),
    m: L(['Park Bánh Gạo', 'Jung Soju', 'Kang Tok-bốc-ki', 'Oppa Gió Lạnh'], ['Park Rice-Cake', 'Jung Soju', 'Kang Tteokbokki', 'Oppa Chilly-Breeze']),
    persona: (g) => xung.em(g),
    pool: { skins: ASIAN_SKIN, hairs: [...DARK_HAIR, '#8a6a5a', '#c9b8a8', '#ff9aa8'], fs: ['bob', 'shoulder', 'long', 'bun'], ms: ['short', 'messy', 'slick'], shirts: ['#f4f4f0', '#ff9aa8', '#b8d8f0', '#e8d8f0', '#2b2b2b'], acc: [['blush', 0.7], ['glasses', 0.2]] },
    greet: L([
      'Annyeong! Cho {t} một ly {drink}, ít đá như phim Hàn: ngoài lạnh lùng, trong ấm áp nha!',
      'Xin chào! {drink} một ly. Ở Seoul ly này bằng nửa ngày lương, ở đây rẻ quá {t} xỉu!',
      '{B} chủ ơi, {drink} một ly. {T} quay video được không? {T} làm vlog “Đà Lạt có gì vui”',
      'Một {drink} nha. Pha đẹp đẹp, {t} chụp 37 tấm rồi mới uống',
      'Daebak! Quán xinh như phim trường. Cho {t} {drink}, {t} đứng góc 45 độ chờ',
      '{drink} một ly, ít đường. Tối nay {t} skincare 10 bước, không được tăng cân',
    ], [
      'Annyeong! One {drink}, light ice. Like a K-drama lead: cold outside, warm inside!',
      'Hello! One {drink}. In Seoul this costs half a day’s pay. So cheap I could faint!',
      'Hi boss! One {drink}. Can I film? I’m vlogging “Fun Things to Do in Dalat”',
      'One {drink}, please. Make it pretty, I’ll take 37 photos before I sip',
      'Daebak! This café looks like a drama set. One {drink}, I’ll pose at 45°',
      'One {drink}, less sugar. 10-step skincare tonight, no weight gain allowed',
    ]),
    impatient: L([
      'Chờ lâu như đợi tập cuối phim 16 tập',
      'Aigoo, {t} đợi tới mức máy quay hết pin luôn',
      'Ở Seoul gọi đồ ăn 15 phút tới, ở đây 15 phút chưa có ly nước',
      'Nhanh nhanh nha {b}, hướng dẫn viên đếm người rồi kìa',
    ], [
      'This wait is longer than a 16-episode drama finale',
      'Aigoo, my camera battery died while I waited',
      'In Seoul delivery takes 15 min. Here, 15 min and still no drink',
      'Faster please, the tour guide is counting heads!',
    ]),
    good: L([
      'Ngon hơn cà phê ở Gangnam mà rẻ hơn 4 lần. Daebak!',
      'Ngọt như cảnh nam chính cầm ô cho nữ chính. 5 sao!',
      'Quán đẹp, nước ngon, {t} chụp 200 tấm, đăng 1 tấm',
      'Uống xong {t} hiểu vì sao người Việt một ngày 3 ly cà phê',
      'Ngon tới mức {t} muốn huỷ vé máy bay về',
    ], [
      'Better than Gangnam coffee and 4x cheaper. Daebak!',
      'Sweet like the hero holding an umbrella for the heroine. 5 stars!',
      'Pretty café, great drink. Took 200 photos, posted 1',
      'Now I get why Vietnamese drink 3 coffees a day',
      'So good I want to cancel my flight home',
    ]),
    meh: L([
      'Ngon mà hơi lâu, xe du lịch suýt bỏ {t} lại',
      'Tạm ổn. Chưa đủ làm cảnh quay chính, làm cảnh phụ được',
      'Đá tan nhanh hơn tình cảm nam phụ',
    ], [
      'Tasty but slow. The tour bus almost left without me',
      'Okay. Not a main scene, but a decent side scene',
      'The ice melted faster than the second lead’s hopes',
    ]),
    chats: L([
      t('Ở Việt Nam ai cũng uống cà phê sữa đá hả {b}? {T} thấy đi đâu cũng có',
        ['Đúng rồi, máu người Việt 30% là cà phê sữa đá', 'Daebak! Vậy {t} truyền máu Việt liền'],
        ['Ừ, người Việt có thể thiếu ngủ chứ không bao giờ thiếu cà phê', 'Hahaha câu này {t} đăng story được không {b}', 8],
        ['Ừ', 'Ờ… ngắn gọn ghê']),
      t('{B} có xem phim Hàn không? {T} giống {nữ|nam} chính phim nào?',
        ['Giống {nữ|nam} chính phim nào cũng có cảnh ăn mì lúc nửa đêm', 'Trời, đúng {t} luôn, tối nào cũng ăn mì'],
        ['Giống {nữ|nam} chính lúc chưa gặp {nam|nữ} chính, đang chạy deadline', 'Ơ… đau mà chuẩn, {t} cũng dân văn phòng', 7],
        ['Không xem', 'Sao có thể!? Người này lạ quá']),
      t('Đà Lạt lạnh thật! Ở đây có bán kimchi không {b}?',
        ['Không có kimchi, nhưng có dưa chua bà ngoại muối nè', 'Dưa chua kiểu Việt hả? Cho {t} thử với!'],
        ['Có, kimchi đang ủ trong tủ, ba tuần nữa là ăn được', '{T} ở có 2 ngày thôi {b} ơi', 5],
        ['Không', 'Huhu nhớ nhà quá']),
      t('Người Việt nói nhanh quá, “khum” nghĩa là gì vậy {b}?',
        ['“Khum” là “không” nhưng dễ thương hơn, như “ani-yo” đó', 'À ha! {T} khum về nữa đâu, ở lại Đà Lạt luôn'],
        ['“Khum” là cách giới trẻ từ chối deadline', 'Vậy {t} khum làm việc nữa, khum khum!', 8],
        ['Là không', 'Ok… không vui lắm']),
    ], [
      t('Does everyone in Vietnam drink iced milk coffee? It’s everywhere!',
        ['Yep, Vietnamese blood is 30% iced coffee', 'Daebak! Then give me a transfusion'],
        ['We can skip sleep, but never coffee', 'Hahaha can I put that on my story?', 8],
        ['Yep', 'Oh… very short answer']),
      t('Do you watch K-dramas? Which drama lead do I look like?',
        ['The one eating ramyeon at midnight. That’s every lead', 'Omg, that’s me every single night'],
        ['The lead before the love interest shows up: buried in deadlines', 'Oof… painful but true. I work in an office too', 7],
        ['Don’t watch them', 'Impossible!? What a strange person']),
      t('Dalat is so cold! Do you sell kimchi here?',
        ['No kimchi, but we’ve got Grandma’s pickled greens', 'Vietnamese pickles? Let me try!'],
        ['Yes, it’s fermenting in the fridge. Ready in 3 weeks', 'I’m only here 2 days though!', 5],
        ['No', 'Huhu, I miss home']),
      t('Vietnamese talk so fast! What does “khum” mean?',
        ['“Khum” means “no” but cuter, like “aniyo”', 'Aha! Then I khum going home, I’m staying in Dalat'],
        ['It’s how young people say no to deadlines', 'Then I khum working anymore. Khum khum!', 8],
        ['It means no', 'Ok… not very fun']),
    ]),
  }),
  group({
    id: 'trung', headline: L('Đoàn khách Trung Quốc', 'Chinese Tour Group'), label: L('Trung Quốc', 'China'), foreign: true, weight: 1, patience: 1,
    blurb: L('Đoàn khách Trung Quốc đang livestream Đà Lạt, mỗi người cầm 2 điện thoại', 'A Chinese tour group is livestreaming Dalat, two phones each'),
    f: L(['Vương Trà Sữa', 'Lý Livestream', 'Chu Douyin', 'Tô Quét Mã'], ['Wang Bubble-Tea', 'Li Livestream', 'Zhou Douyin', 'Su Scan-Code']),
    m: L(['Trương Đậu Hũ', 'Lưu Bánh Bao', 'Hà Mì Xào', 'Lâm Lẩu Cay'], ['Zhang Tofu', 'Liu Bao-Bun', 'He Chow-Mein', 'Lin Hotpot']),
    persona: (g) => xung.em(g),
    pool: { skins: ASIAN_SKIN, hairs: [...DARK_HAIR, '#5a3a28'], fs: ['bob', 'long', 'bun', 'shoulder'], ms: ['short', 'slick', 'cap'], shirts: ['#d9534f', '#f2c14e', '#2b2b2b', '#f4f4f0', '#5b8bd9'], acc: [['glasses', 0.3], ['blush', 0.3]] },
    greet: L([
      'Nǐ hǎo! Một ly {drink}, {t} đang livestream, {b} cười tươi lên nha, 3 vạn người đang xem',
      'Cho một {drink}. Quét mã được không {b}? Ví điện tử nào {t} cũng có, chỉ không có tiền mặt',
      '{drink} một ly! Quay chậm lúc rót nha, video này lên xu hướng là quán nổi tiếng luôn',
      'Ở quê {t} gọi cà phê này là “nước đen thần thánh”. Cho {t} một {drink}!',
      'Một {drink}, size lớn nhất. Người nhà dặn {t} mua làm quà thêm 20 gói nữa',
      '{B} ơi, {drink}! Quán này 10 vạn lượt thích trên mạng, đúng chỗ này không?',
    ], [
      'Nǐ hǎo! One {drink}. I’m livestreaming, smile! 30,000 people watching',
      'One {drink}. Can I scan to pay? I have every e-wallet, just no cash',
      'One {drink}! Pour it in slow-mo. If this trends, you’re famous',
      'Back home we call this “magic black water”. One {drink}, please!',
      'One {drink}, biggest size. My family also wants 20 bags as gifts',
      'Hi! One {drink}! This place has 100K likes online. Right spot?',
    ]),
    impatient: L([
      '{B} ơi nhanh lên, người xem livestream đang giảm kìa',
      'Chờ lâu quá, bình luận toàn hỏi “ly nước đâu”',
      'Bên {t} giao đồ ăn bằng drone, ở đây ly nước còn đi bộ hả?',
      'Hướng dẫn viên giơ cờ rồi, {t} phải đi đây',
    ], [
      'Hurry, my livestream viewers are dropping!',
      'So slow… the comments all say “where’s the drink?”',
      'Back home drones deliver food. Does your drink walk here?',
      'The tour guide raised the flag, I have to go',
    ]),
    good: L([
      'Ngon! Livestream bán giúp quán 300 gói cà phê luôn rồi',
      `Vị đậm, quán đẹp, chủ quán lên hình ${G('xinh', 'bảnh')}. 5 sao, đã ghim quán`,
      'Uống xong tỉnh tới mức {t} live thêm 4 tiếng nữa',
      'Ngon như lời đồn trên mạng. Lần đầu mạng nói thật',
    ], [
      'Delicious! My livestream just sold 300 bags of your coffee',
      'Rich taste, pretty café, owner looks great on camera. 5 stars, pinned!',
      'So awake I could stream 4 more hours',
      'As good as the internet says. First time the internet told the truth',
    ]),
    meh: L([
      'Ngon mà chậm, người xem live thoát hết rồi',
      'Tạm được, ly hơi nhỏ, không đủ lên hình',
      'Nước ổn, wifi yếu, live bị đứng 3 lần',
    ], [
      'Tasty but slow. My viewers all left',
      'Okay. Cup’s a bit small, doesn’t pop on camera',
      'Drink’s fine, Wi-Fi’s weak. Stream froze 3 times',
    ]),
    chats: L([
      t('Quán có muốn {t} quảng cáo không {b}? Một video là cả nước biết',
        ['Cảm ơn nha, quán ngon thì tự có người tới', '{B} khiêm tốn quá, {t} quay luôn, miễn phí!'],
        ['Được, trả công bằng 1 ly bạc xỉu, không hoa hồng', 'Hahaha {b} biết làm ăn! Chốt đơn!', 8],
        ['Không cần', 'Ồ… {b} ngầu thật']),
      t('Ở Việt Nam ăn sáng gì vậy {b}? {T} thấy ai cũng ăn bánh mì',
        ['Sáng bánh mì, trưa phở, chiều trà sữa, tối lại bánh mì', 'Cuộc sống lý tưởng! {T} muốn chuyển nhà'],
        ['Ăn sáng bằng cà phê, ăn trưa bằng cà phê, giảm cân luôn', 'Ơ… công thức giảm cân rẻ quá', 7],
        ['Bánh mì', 'Ok…']),
      t('{T} mua quà nhiều quá, vali nặng 40 ký rồi, làm sao đây {b}?',
        ['Gửi bưu điện về nhà, nhẹ người mà quà vẫn tới', 'Đúng rồi! {B} thông minh quá'],
        ['Uống hết cà phê tại chỗ thì vali nhẹ liền', 'Haha uống 40 ký cà phê chắc {t} bay về khỏi cần máy bay', 8],
        ['Mua ít lại', 'Không được, mẹ {t} dặn mua!']),
    ], [
      t('Want me to promote your café? One video and the whole country knows',
        ['Thanks! Good coffee brings people on its own', 'So humble! I’ll film anyway, for free!'],
        ['Sure. You get paid in one bạc xỉu, no commission', 'Hahaha you know business! Deal!', 8],
        ['No need', 'Oh… so cool']),
      t('What do people eat for breakfast here? Everyone’s eating bánh mì',
        ['Bánh mì at breakfast, phở at lunch, milk tea later, bánh mì again at night', 'Dream life! I want to move here'],
        ['Coffee for breakfast, coffee for lunch. Instant diet', 'Oh… what a cheap diet', 7],
        ['Bánh mì', 'Ok…']),
      t('I bought too many gifts, my suitcase weighs 40 kg. Help?',
        ['Ship them home by post. Travel light, gifts still arrive', 'Yes! So smart'],
        ['Drink all the coffee here and the bag gets lighter', 'Haha 40 kg of coffee, I could fly home without a plane', 8],
        ['Buy less', 'Can’t! Mom said to buy!']),
    ]),
  }),
  group({
    id: 'anh', headline: L('Khách Anh đi phượt', 'British Backpackers'), label: L('Anh', 'UK'), foreign: true, weight: 1, patience: 1.3,
    blurb: L('Khách Anh đi phượt Đà Lạt, xếp hàng ngay ngắn và nói “sorry” liên tục', 'British backpackers in Dalat: queuing neatly and saying “sorry” nonstop'),
    f: L(['Emma Ếch Chiên', 'Charlotte Chè Bưởi', 'Lily Lá Trà', 'Sophie Sương Mù'], ['Emma Fried-Frog', 'Charlotte Pomelo-Pud', 'Lily Tea-Leaf', 'Sophie Fog']),
    m: L(['Oliver Ô Mai', 'George Gừng', 'Harry Hột Vịt', 'William Wifi'], ['Oliver Plum-Candy', 'George Ginger', 'Harry Duck-Egg', 'William Wi-Fi']),
    persona: (g) => xung.toi(g),
    pool: { skins: EURO_SKIN, hairs: ['#d9a441', '#c96a2b', '#6b4026', '#e8d08a', '#3a2a20'], fs: ['shoulder', 'long', 'bob', 'bun'], ms: ['short', 'messy', 'cap'], shirts: ['#2e3f6e', '#8e1b2c', '#4a6a4a', '#c9b89c', '#f4f4f0'], acc: [['glasses', 0.25], ['beard', 0.15], ['scarf', 0.3]] },
    greet: L([
      'Sorry, xin lỗi, cho tôi một {drink} được không? Không vội đâu, cứ từ từ, sorry nha',
      'Lovely! Một {drink} please. Mưa phùn ở đây làm tôi nhớ nhà ghê',
      'Một {drink}. À mà quán có trà không? Không có hả… thôi, tôi sẽ mạnh mẽ',
      'Cheers! {drink} một ly. Thời tiết hôm nay cũng tạm, nói chuyện thời tiết là truyền thống nước tôi',
      'Tôi xếp hàng đúng chỗ chưa? Sorry. Một {drink}, cảm ơn, sorry lần nữa',
      'Ở London 1 ly cà phê bằng ở đây 5 ly. {drink} nha, tôi uống cho đủ vốn',
    ], [
      'Sorry, so sorry, could I get a {drink}? No rush at all. Sorry',
      'Lovely! One {drink}, please. This drizzle makes me homesick',
      'One {drink}. Oh, do you have tea? No? Right… I’ll be brave',
      'Cheers! One {drink}. Weather’s not bad today. Weather talk is our national sport',
      'Am I queuing in the right spot? Sorry. One {drink}, thanks, sorry again',
      'One coffee in London buys 5 here. {drink}, please, getting my money’s worth',
    ]),
    impatient: L([
      'Không sao đâu, tôi chỉ… đứng đây hơi lâu thôi. Không sao. Thật đấy',
      'Sorry, không phải tôi hối, nhưng tôi đã nghĩ xong 3 chủ đề thời tiết rồi',
      'Người Anh sinh ra để xếp hàng. Nhưng mà…',
      'Đứng lâu tới mức tôi định xin lỗi cái cột luôn',
    ], [
      'It’s fine, I’m just… standing here a while. It’s fine. Really',
      'Sorry, not rushing you, but I’ve prepared 3 weather topics already',
      'Brits are born to queue. But still…',
      'I’ve waited so long I nearly apologised to a pillar',
    ]),
    good: L([
      'Lovely! Ngon hơn cà phê ở ga tàu London 10 lần. Đừng nói với ai nhé',
      'Ngon xuất sắc. Tôi sẽ viết thư tay khen quán',
      'Brilliant! Đây là ly cà phê đầu tiên khiến tôi quên trà',
      'Tôi định khen nhẹ thôi, nhưng không nhịn được: 5 sao',
    ], [
      'Lovely! 10x better than London station coffee. Don’t tell anyone',
      'Outstanding. I shall write you a handwritten thank-you note',
      'Brilliant! The first coffee that made me forget tea',
      'I meant to be mildly polite, but I can’t help it: 5 stars',
    ]),
    meh: L([
      'Cũng được. Theo chuẩn người Anh thì “cũng được” là khen lắm rồi',
      'Not bad. Hơi lâu, nhưng tôi sẽ không phàn nàn trực tiếp đâu',
      'Tạm. Tôi sẽ chỉ hơi buồn một chút, rất lịch sự',
    ], [
      'It’s alright. For a Brit, “alright” is high praise',
      'Not bad. Bit slow, but I’d never complain to your face',
      'Fine. I’ll be just a little sad, very politely',
    ]),
    chats: L([
      t('Thời tiết đẹp nhỉ? Ở Anh mưa 300 ngày một năm',
        ['Đà Lạt cũng mưa, nhưng mưa kiểu lãng mạn', 'Lãng mạn hả? Ở nước tôi mưa kiểu… đóng thuế'],
        ['{K} trốn mưa sang đây mà Đà Lạt lại mưa, đúng số', 'Haha đúng! Mưa đi theo tôi như fan cứng', 8],
        ['Ừ', 'Ừ… ừm… trời đẹp']),
      t('Ở đây có trà sữa không {b}? Tôi uống trà với sữa cả đời rồi',
        ['Có trà đào, ngon lắm, {k} thử đi', 'Trà mà có đào? Nước tôi chưa sẵn sàng cho điều này'],
        ['Trà sữa Việt có trân châu, người Anh nhai nổi không', 'Tôi đã thử. Nó… nhai lại tôi. 10 điểm', 8],
        ['Không', 'Ồ… tôi sẽ ổn thôi']),
      t('Tôi xin lỗi vì đã xin lỗi nhiều quá. Sorry',
        ['Không sao, lịch sự là được giảm giá tình cảm', 'Thật dễ thương! Sorry, à không, thank you'],
        ['Xin lỗi thêm 3 lần nữa là được tặng 1 ly', 'Sorry sorry sorry! Ly đâu?', 7],
        ['Ừ', 'Sorry…']),
    ], [
      t('Lovely weather, isn’t it? It rains 300 days a year back home',
        ['Dalat rains too, but the romantic kind', 'Romantic? Ours is more the… tax-paying kind'],
        ['You fled the rain and Dalat rains too. Classic', 'Haha right! Rain follows me like a superfan', 8],
        ['Yeah', 'Yes… well… nice weather']),
      t('Do you have milk tea? I’ve had tea with milk my whole life',
        ['We have peach tea, it’s lovely, try it', 'Tea with peach? My nation isn’t ready'],
        ['Ours has tapioca pearls. Can a Brit handle the chewing?', 'I tried. It… chewed me back. 10/10', 8],
        ['No', 'Oh… I’ll be fine']),
      t('I’m sorry for apologising so much. Sorry',
        ['No worries, politeness earns a love discount', 'How sweet! Sorry, I mean, thank you'],
        ['Three more sorries and you get a free drink', 'Sorry sorry sorry! Where’s my drink?', 7],
        ['Ok', 'Sorry…']),
    ]),
  }),
  group({
    id: 'phap', headline: L('Khách Pháp tìm “Paris nhỏ”', 'French Seeking “Little Paris”'), label: L('Pháp', 'France'), foreign: true, weight: 1, patience: 1,
    blurb: L('Khách Pháp về thăm “Paris nhỏ”, ai cũng mang theo một cuốn sách và rất nhiều ý kiến', 'French visitors checking out “Little Paris”, each with a book and plenty of opinions'),
    f: L(['Amélie Bánh Mì', 'Sophie Súp Cua', 'Chloé Chè Chuối', 'Camille Cà Rốt'], ['Amélie Baguette', 'Sophie Crab-Soup', 'Chloé Banana-Pud', 'Camille Carrot']),
    m: L(['Pierre Pa-tê', 'Jean Jambon', 'Louis Lẩu Gà', 'Antoine Ăn Vặt'], ['Pierre Pâté', 'Jean Jambon', 'Louis Chicken-Pot', 'Antoine Snacks']),
    persona: (g) => xung.toi(g),
    pool: { skins: EURO_SKIN, hairs: ['#3a2a20', '#6b4026', '#1d1612', '#a0522d'], fs: ['beret', 'shoulder', 'long', 'bob'], ms: ['beret', 'messy', 'short'], shirts: ['#2e3f6e', '#f4f4f0', '#d9534f', '#2b2b2b'], acc: [['scarf', 0.4], ['mustache', 0.25], ['lipstick', 0.3]] },
    greet: L([
      'Bonjour! Một {drink}. Người ta nói Đà Lạt là Paris nhỏ, tôi tới kiểm tra',
      `Bonjour ${G('madame', 'monsieur')}. {drink} một ly. Tôi sẽ uống thật chậm và suy nghĩ về cuộc đời`,
      'Một {drink}, s’il vous plaît. Ở Paris hôm nay đình công, may mà tôi đang ở đây',
      'Bánh mì Việt Nam ngon hơn bánh mì Pháp, đừng kể ai. Cho tôi {drink}',
      'Ồ là la! Quán xinh. Một {drink}, tôi ngồi viết tiểu thuyết 3 tiếng nha',
      '{drink}. Tôi sẽ chấm thật lòng, người Pháp không biết khen giả',
    ], [
      'Bonjour! One {drink}. They call Dalat “Little Paris”. I’m here to check',
      `Bonjour ${G('madame', 'monsieur')}. One {drink}. I shall sip slowly and ponder life`,
      'One {drink}, s’il vous plaît. Paris is on strike today, lucky I’m here',
      'Vietnamese bánh mì beats French bread. Tell no one. One {drink}',
      'Oh là là! Cute café. One {drink}, I’ll sit and write my novel for 3 hours',
      '{drink}. I’ll rate honestly, the French can’t fake a compliment',
    ]),
    impatient: L([
      'Chờ đợi cũng là một nghệ thuật… nhưng tôi không phải nghệ sĩ',
      'Lâu quá, tôi định đình công phản đối luôn đây',
      'Ồ là la… ly của tôi đi nghỉ phép 5 tuần hả?',
      'Tôi đọc xong 2 chương sách rồi. Ly nước vẫn chưa tới. C’est la vie',
    ], [
      'Waiting is an art… but I am no artist',
      'So slow, I’m about to go on strike',
      'Oh là là… is my drink on a 5-week vacation?',
      'I’ve read 2 chapters. Still no drink. C’est la vie',
    ]),
    good: L([
      'Magnifique! Lần đầu tôi khen mà không có chữ “nhưng”',
      'Ngon. Ngon thật. Tôi sẽ ngừng chê cà phê Việt từ hôm nay',
      'Đậm như triết học, ngọt như tình yêu. 5 sao, ký tên một người Pháp khó tính',
      'Bánh mì Việt đã thắng bánh mì Pháp, giờ cà phê cũng thắng. Tôi về nước sao đây',
    ], [
      'Magnifique! First time I’ve praised without a “but”',
      'Good. Truly good. I stop mocking Vietnamese coffee today',
      'Deep as philosophy, sweet as love. 5 stars, signed: a picky French guest',
      'Bánh mì beat our bread, now coffee wins too. How do I go home?',
    ]),
    meh: L([
      'Được. Nhưng mà… à thôi, người Pháp lúc nào cũng có chữ “nhưng”',
      'Không tệ. Thiếu một chút tâm hồn, và một chút bơ',
      'Tôi chấm 3 sao. Ở Pháp, 3 sao là nhà hàng hạng sang đó',
    ], [
      'Fine. But… never mind, the French always have a “but”',
      'Not bad. Lacks a little soul, and a little butter',
      '3 stars. In France, 3 stars is fine dining',
    ]),
    chats: L([
      t('Vì sao cà phê Việt lại có sữa đặc? Ở Pháp không ai làm vậy',
        ['Ngày xưa hiếm sữa tươi, ông bà sáng tạo ra đó', 'Ồ, sáng tạo từ khó khăn, rất thơ'],
        ['Người Pháp mang cà phê tới, người Việt làm nó ngon hơn', 'Ồ là la… đau, nhưng tôi không cãi được', 9],
        ['Thì vậy', 'Câu trả lời rất… thiếu triết học']),
      t('Tôi đang viết tiểu thuyết về Đà Lạt. {B} có câu chuyện nào không?',
        [`Có, chuyện ${G('cô gái', 'chàng trai')} bỏ phố về núi mở quán với một bé corgi`, 'Quá đẹp! Đây sẽ là chương 1'],
        ['Chuyện chủ quán bị khách ngồi 3 tiếng mà gọi 1 ly', 'Ơ… nhân vật đó có phải tôi không', 7],
        ['Không', 'Vậy tôi viết về sự im lặng của {b}']),
      t('Ở Việt Nam có đình công không? Ở Pháp tuần nào cũng có',
        ['Không đình công, chỉ có kẹt xe là đều đặn', 'Kẹt xe là cuộc đình công của đường phố'],
        ['Có, con corgi của quán đình công đòi pate mỗi chiều', 'Haha tôi ủng hộ cuộc đình công này', 8],
        ['Không', 'Thật đáng tiếc']),
    ], [
      t('Why condensed milk in Vietnamese coffee? Nobody does that in France',
        ['Fresh milk was rare back then, so our grandparents got creative', 'Ah, creativity born of hardship. Very poetic'],
        ['The French brought coffee, the Vietnamese made it better', 'Oh là là… ouch, but I cannot argue', 9],
        ['Just because', 'A very… unphilosophical answer']),
      t('I’m writing a novel about Dalat. Got a story for me?',
        [`Yes: ${G('a girl', 'a guy')} who left the city for the hills to open a café with a corgi`, 'Beautiful! That’s chapter one'],
        ['An owner whose guest sits 3 hours on one drink', 'Wait… is that character me?', 7],
        ['No', 'Then I’ll write about your silence']),
      t('Do you have strikes in Vietnam? France has one every week',
        ['No strikes, just traffic jams, like clockwork', 'Traffic jams are the streets on strike'],
        ['Yes, our corgi strikes for pâté every afternoon', 'Haha I support this strike', 8],
        ['No', 'What a pity']),
    ]),
  }),
  group({
    id: 'y', headline: L('Đoàn khách Ý', 'Italian Tour Group'), label: L('Ý', 'Italy'), foreign: true, weight: 1, patience: 0.95,
    blurb: L('Khách Ý ghé Đà Lạt, chuẩn bị tinh thần nghe phản biện về espresso', 'Italians are in Dalat. Brace yourself for espresso critiques'),
    f: L(['Giulia Gelato', 'Francesca Phô Mai', 'Sofia Sầu Riêng', 'Chiara Chả Giò'], ['Giulia Gelato', 'Francesca Formaggio', 'Sofia Durian', 'Chiara Spring-Roll']),
    m: L(['Marco Mì Ý', 'Luca Lạp Xưởng', 'Giovanni Giò Lụa', 'Matteo Măng Cụt'], ['Marco Spaghetti', 'Luca Sausage', 'Giovanni Pork-Roll', 'Matteo Mangosteen']),
    persona: (g) => xung.toi(g),
    pool: { skins: ['#f0c8a2', '#e9bf97', '#f3c9a6', '#d9a679'], hairs: DARK_HAIR, fs: ['long', 'shoulder', 'bun'], ms: ['slick', 'short', 'messy'], shirts: ['#f4f4f0', '#2b2b2b', '#6aa84f', '#d9534f', '#2e3f6e'], acc: [['shades', 0.35], ['chain', 0.2], ['beard', 0.25], ['hoops', 0.3]] },
    greet: L([
      `${G('Ciao bella', 'Ciao bello')}! Một {drink}. Nhưng cho tôi hỏi… có đá thật hả? Mamma mia`,
      'Một {drink}. Ở Ý, cà phê sữa sau 11 giờ sáng là tội ác. Nhưng tôi đang đi du lịch, tha cho mình',
      'Cà phê với sữa đặc? Nghe như phạm luật nhưng tôi muốn thử. {drink} nha!',
      'Ciao! Tôi đi kiểm tra cà phê thế giới. Hôm nay là {drink}, mong là không phải khóc',
      'Một {drink}, pha bằng tình yêu nha. Người Ý cảm nhận được tình yêu trong từng giọt',
      '{drink}! Tay tôi đang múa vì háo hức, không phải vì giận đâu',
    ], [
      `${G('Ciao bella', 'Ciao bello')}! One {drink}. But wait… with ice? Mamma mia`,
      'One {drink}. In Italy, milky coffee after 11am is a crime. But I’m on holiday',
      'Coffee with condensed milk? Sounds illegal. I must try. {drink}, please!',
      'Ciao! I’m testing the world’s coffee. Today: {drink}. Hope I don’t cry',
      'One {drink}, made with love. Italians taste love in every drop',
      '{drink}! My hands are waving from excitement, not anger',
    ]),
    impatient: L([
      'Mamma mia, chờ lâu tới mức mì Ý của tôi chín 3 lần rồi',
      'Espresso ở Ý pha 25 giây. Ở đây… tôi đếm tới 250 rồi',
      'Tôi đang múa tay hơi nhiều, nghĩa là tôi hơi đói và hơi giận',
      'Ly cà phê này đi tàu từ Rome tới hả?',
    ], [
      'Mamma mia, my pasta could’ve cooked 3 times by now',
      'Espresso in Italy takes 25 seconds. Here… I’ve counted to 250',
      'I’m waving my hands a lot. It means I’m a bit hungry and a bit mad',
      'Did this coffee take the train from Rome?',
    ]),
    good: L([
      'Mamma mia! Ngon như bà ngoại tôi pha, mà bà tôi không biết dùng sữa đặc',
      'Perfetto! Tôi chụm 5 đầu ngón tay hôn gió cái ly này',
      'Tôi sẽ báo cả dòng họ: người Việt pha cà phê đỉnh. Dòng họ tôi 80 người',
      'Ngon tới mức tôi tha thứ cho cục đá trong ly',
    ], [
      'Mamma mia! Like Nonna’s, and Nonna never used condensed milk',
      'Perfetto! *chef’s kiss* to this cup',
      'I’ll tell the whole family Vietnamese coffee rocks. That’s 80 people',
      'So good I forgive the ice in it',
    ]),
    meh: L([
      'Được, nhưng ở quê tôi người ta sẽ cãi nhau 2 tiếng về ly này',
      'Không tệ. Nhưng ai cho đá vào cà phê vậy? Tôi cần ngồi xuống bình tĩnh',
      'Tạm. Thêm chút đam mê nữa là thành tác phẩm',
    ], [
      'Fine, but back home we’d argue 2 hours about this cup',
      'Not bad. But who puts ice in coffee? I need to sit down',
      'Okay. A bit more passion and it’s a masterpiece',
    ]),
    chats: L([
      t('Cà phê muối? Các bạn cho muối vào cà phê thật hả?',
        ['Thật, mằn mặn ngọt ngọt, uống là ghiền', 'Tôi sợ… nhưng tôi tò mò. Mamma mia, cho tôi thử'],
        ['Pizza dứa còn có người ăn, cà phê muối có gì đâu', 'Đừng nhắc pizza dứa! Tim tôi yếu lắm', 6],
        ['Thật', 'Ồ… thật hả']),
      t('Ở Ý chúng tôi uống espresso đứng ở quầy 30 giây. Người Việt ngồi cả buổi hả?',
        ['Ngồi cả buổi mới thấm, cà phê là để tám chuyện', 'Tôi hiểu rồi, cà phê ở đây là cuộc sống, không phải nhiên liệu'],
        ['Người Việt ngồi cà phê từ sáng tới trưa, gọi là “đi làm”', 'Haha công việc tuyệt nhất thế giới', 8],
        ['Ừ', 'Ok… tôi đứng uống vậy']),
      t('{B} nghĩ người Ý hay người Việt nói chuyện bằng tay nhiều hơn?',
        ['Người Ý múa tay, người Việt múa cả muỗng khuấy cà phê', 'Haha tôi phải học múa muỗng!'],
        ['Người Ý, vì nãy giờ {k} suýt làm đổ 2 ly của bàn bên', 'Ơ… chuẩn. Tôi xin lỗi bàn bên bằng tay luôn', 8],
        ['Không biết', 'Tay tôi buồn lắm']),
    ], [
      t('Salt coffee? You really put salt in coffee?',
        ['Really! Salty-sweet, totally addictive', 'I’m scared… but curious. Mamma mia, let me try'],
        ['People eat pineapple pizza. Salt coffee is nothing', 'Don’t say pineapple pizza! My heart is weak', 6],
        ['Really', 'Oh… really']),
      t('In Italy we drink espresso standing at the bar, 30 seconds. You sit all day?',
        ['All day is how you savor it. Coffee is for chatting', 'I see. Here coffee is life, not fuel'],
        ['We sit at cafés from morning till noon and call it “work”', 'Haha best job in the world', 8],
        ['Yeah', 'Ok… I’ll drink standing then']),
      t('Who talks with their hands more, Italians or Vietnamese?',
        ['Italians wave hands, Vietnamese wave coffee spoons', 'Haha I must learn the spoon dance!'],
        ['Italians. You nearly knocked over 2 cups next door', 'Oh… true. I’ll apologise to them with my hands', 8],
        ['Dunno', 'My hands are sad']),
    ]),
  }),
  group({
    id: 'duc', headline: L('Đoàn khách Đức', 'German Tour Group'), label: L('Đức', 'Germany'), foreign: true, weight: 1, patience: 0.85,
    blurb: L('Khách Đức tới Đà Lạt theo lịch trình chia tới từng phút', 'German visitors in Dalat, on a schedule planned to the minute'),
    f: L(['Greta Gỏi Cuốn', 'Heidi Hột Vịt', 'Anna Ăn Đúng Giờ'], ['Greta Summer-Roll', 'Heidi Duck-Egg', 'Anna On-Time']),
    m: L(['Hans Hủ Tiếu', 'Klaus Khoai Tây', 'Lukas Lạc Rang', 'Jonas Giò Heo', 'Felix Phở Khô'], ['Hans Noodle-Soup', 'Klaus Kartoffel', 'Lukas Peanuts', 'Jonas Pork-Knuckle', 'Felix Dry-Pho']),
    persona: (g) => xung.toi(g),
    pool: { skins: EURO_SKIN, hairs: ['#e8d08a', '#d9a441', '#c9b8a8', '#6b4026'], fs: ['bob', 'shoulder', 'bun'], ms: ['short', 'short', 'combover'], shirts: ['#4a4f57', '#2e3f6e', '#6aa84f', '#f4f4f0'], acc: [['glasses', 0.5], ['beard', 0.15], ['collar', 0.3]] },
    greet: L([
      'Guten Tag. Một {drink}. Theo lịch trình tôi có 4 phút 30 giây cho ly này',
      'Một {drink}. Cho tôi biết chính xác bao nhiêu gam đường, tôi ghi vào Excel',
      'Guten Tag! {drink} một ly. Quán mở cửa đúng giờ, tôi đánh giá cao',
      'Tôi đã nghiên cứu menu từ hôm qua. Lựa chọn tối ưu là {drink}',
      'Một {drink}. Đường không quá 12%, đá không quá 40%. Danke',
      '{drink}. Tôi trả tiền chính xác tới từng đồng, không cần thối',
    ], [
      'Guten Tag. One {drink}. My schedule allows 4 min 30 sec for this',
      'One {drink}. Tell me exactly how many grams of sugar. For my Excel',
      'Guten Tag! One {drink}. You opened on time. I appreciate this',
      'I studied the menu yesterday. Optimal choice: {drink}',
      'One {drink}. Sugar max 12%, ice max 40%. Danke',
      '{drink}. I pay the exact amount, no change needed',
    ]),
    impatient: L([
      'Đã quá 4 phút 30 giây. Lịch trình của tôi đang bị lệch',
      'Theo tính toán, ly của tôi trễ 87 giây. Tôi đang ghi chú',
      'Ở Đức tàu trễ là lên báo. Ly này trễ là lên Excel của tôi',
      'Xin lỗi, có quy trình nào để tôi hỏi tiến độ không?',
    ], [
      '4 min 30 sec exceeded. My schedule is drifting',
      'By my calculations, my drink is 87 seconds late. Noted',
      'In Germany a late train makes the news. A late drink makes my spreadsheet',
      'Excuse me, is there a procedure to check order status?',
    ]),
    good: L([
      'Sehr gut! Hiệu suất tốt, vị đậm, tỉ lệ đá chuẩn. Đã nhập bảng tính: 5/5',
      'Ngon. Tôi đã lên lịch quay lại ngày mai lúc 8 giờ 15',
      'Đúng giờ, đúng vị, đúng công thức. Tôi hơi xúc động, nhưng chỉ 3 giây',
      'Ngon hơn máy pha ở văn phòng tôi, cái máy đó đắt bằng chiếc xe',
    ], [
      'Sehr gut! Efficient, rich, perfect ice ratio. Spreadsheet entry: 5/5',
      'Good. Return visit scheduled: tomorrow, 8:15',
      'On time, on taste, on recipe. I am moved. For 3 seconds',
      'Better than our office machine, which cost as much as a car',
    ]),
    meh: L([
      'Được. Trễ 2 phút, trừ 1 sao theo quy định',
      'Vị ổn. Quy trình cần tối ưu. Tôi gửi file góp ý 14 trang nhé',
      'Tạm chấp nhận. Đá tan 23%, cao hơn tiêu chuẩn',
    ], [
      'Fine. 2 minutes late, minus 1 star per regulations',
      'Taste okay. Process needs optimizing. I’ll send 14 pages of feedback',
      'Acceptable. Ice melted 23%, above standard',
    ]),
    chats: L([
      t('Ở Việt Nam xe máy chạy theo quy tắc nào vậy? Tôi chưa tìm ra',
        ['Quy tắc là “nhìn nhau mà sống”, rất tình cảm', 'Quy tắc không thành văn… thú vị và đáng sợ'],
        ['Quy tắc duy nhất: còn khe là còn đi', 'Tôi sẽ viết luận văn tiến sĩ về câu này', 8],
        ['Không biết', 'Tôi càng lo hơn']),
      t('Quán mở cửa lúc mấy giờ chính xác? 7:00 hay 7:00:00?',
        ['7 giờ đúng, mở trễ là bé Cáo cắn', 'Một nhân viên giám sát giờ giấc bốn chân. Tôi thích'],
        ['7 giờ, cộng trừ 5 phút tuỳ mây Đà Lạt', 'Cộng trừ 5 phút?! Tôi cần ngồi xuống', 6],
        ['7 giờ', 'Cảm ơn, rõ ràng']),
      t('Người Việt làm việc nhiều giờ không? Ở Đức chúng tôi rất coi trọng nghỉ ngơi',
        ['Người Việt làm chăm, nhưng luôn có giờ cà phê', 'Cà phê là nghỉ ngơi hợp pháp. Tôi đồng ý'],
        ['Nhiều lắm, đi nghỉ phép cũng mang laptop, như bàn kia kìa', 'Ồ… bàn kia đang họp Zoom trong quán thật', 8],
        ['Nhiều', 'Tôi lo cho các bạn']),
    ], [
      t('What rules do motorbikes follow here? I haven’t figured it out',
        ['The rule is “read each other’s eyes”. Very heartfelt', 'An unwritten rule… fascinating and terrifying'],
        ['Only one rule: if there’s a gap, go', 'I shall write my PhD thesis on this', 8],
        ['No idea', 'Now I’m more worried']),
      t('What time exactly do you open? 7:00 or 7:00:00?',
        ['7 sharp, or Cáo bites me', 'A four-legged timekeeper. I approve'],
        ['7, give or take 5 min, depending on the clouds', 'Give or take 5 minutes?! I need to sit down', 6],
        ['7', 'Thank you, clear']),
      t('Do Vietnamese work long hours? In Germany we value rest',
        ['We work hard, but there’s always coffee time', 'Coffee is legal rest. I agree'],
        ['A lot. People bring laptops on vacation, like that table', 'Oh… that table really is on Zoom', 8],
        ['A lot', 'I worry for you']),
    ]),
  }),
  group({
    id: 'nga', headline: L('Khách Nga trốn đông', 'Russians Escaping Winter'), label: L('Nga', 'Russia'), foreign: true, weight: 1, patience: 1.15,
    blurb: L('Khách Nga “trốn đông” ở Đà Lạt, mặc áo cộc tay giữa trời 15 độ', 'Russians “escaping winter” in Dalat, wearing T-shirts at 15°C'),
    f: L(['Natasha Nước Mía', 'Olga Ốc Luộc', 'Anya Áo Phao', 'Katya Kẹo Dừa'], ['Natasha Sugarcane', 'Olga Snail', 'Anya Puffer-Coat', 'Katya Coconut-Candy']),
    m: L(['Ivan Ít Đường', 'Dmitri Dưa Leo', 'Sergei Sữa Đậu', 'Boris Bánh Căn'], ['Ivan Less-Sugar', 'Dmitri Cucumber', 'Sergei Soy-Milk', 'Boris Pancake']),
    persona: (g) => xung.toi(g),
    pool: { skins: ['#fbe3d0', '#f8dcc4', '#f6d3b3'], hairs: ['#e8d08a', '#d9c8a8', '#a0522d', '#6b4026'], fs: ['long', 'shoulder', 'bun'], ms: ['short', 'messy'], shirts: ['#f4f4f0', '#5b8bd9', '#d9534f', '#2b2b2b'], acc: [['beard', 0.3], ['scarf', 0.15]] },
    greet: L([
      'Privet! Một {drink}, nhiều đá. Mùa hè Đà Lạt 15 độ, nóng quá',
      'Đà Lạt lạnh hả? Nhà tôi đang âm 30, ở đây là mùa hè. Cho tôi {drink}!',
      'Một {drink}. Mặt tôi nghiêm nhưng tôi đang rất vui, mặt tôi chỉ có 1 biểu cảm',
      'Privet! {drink}. Tôi mặc áo cộc tay giữa sương mù, người ta nhìn tôi như siêu nhân',
      'Cho một {drink}, đậm nhất có thể. Cà phê nhạt với tôi là nước ấm',
      '{drink} nha. Tôi tới đây trốn tuyết, mà ai cũng mặc áo phao, tôi bối rối',
    ], [
      'Privet! One {drink}, lots of ice. Dalat summer, 15 degrees, so hot',
      'Dalat is cold? It’s -30 at home. This is summer. One {drink}!',
      'One {drink}. My face is serious, but I am very happy. I have one expression',
      'Privet! {drink}. T-shirt in the fog, people look at me like a superhero',
      'One {drink}, strongest possible. Weak coffee is warm water to me',
      '{drink}, please. I came to escape snow, but everyone wears puffer coats. Confused',
    ]),
    impatient: L([
      'Tôi từng đứng chờ xe buýt trong bão tuyết 2 tiếng. Chờ ở đây dễ. Nhưng hơi lâu',
      'Không sao, người Nga kiên nhẫn. Nhưng mặt tôi bắt đầu nghiêm hơn rồi đó',
      'Ly này lâu như mùa đông nước tôi',
      'Tôi đang đếm trong đầu bằng tiếng Nga. Số đã rất dài',
    ], [
      'I once waited 2 hours for a bus in a blizzard. This is easy. But long',
      'It’s fine, Russians are patient. But my face is getting more serious',
      'This drink takes as long as our winter',
      'I’m counting in Russian in my head. The number is very long',
    ]),
    good: L([
      'Horosho! Đậm, mạnh, ấm lòng. Như bà tôi, nhưng ngọt hơn',
      'Ngon. Tôi đang cười đó, nhìn kỹ sẽ thấy',
      'Uống xong ấm tới mức tôi định cởi luôn áo cộc tay',
      'Đậm đúng chuẩn. Ly cà phê đầu tiên đánh thức được tôi',
    ], [
      'Horosho! Strong, bold, warming. Like my grandma, but sweeter',
      'Delicious. I’m smiling. Look closely',
      'So warming I might take off my T-shirt too',
      'Proper strength. First coffee that actually woke me up',
    ]),
    meh: L([
      'Được. Hơi nhạt, giống thời tiết tháng 6 nước tôi',
      'Tạm. Thêm đá nữa thì giống quê nhà hơn',
      'Ổn. Mặt tôi không đổi, nhưng trong lòng 3 sao',
    ], [
      'Fine. A bit weak, like June weather back home',
      'Okay. More ice and it’d feel like home',
      'Fine. My face doesn’t change, but inside: 3 stars',
    ]),
    chats: L([
      t('Ở đây người ta mặc áo phao ở 15 độ, tôi tưởng sắp có bão tuyết',
        ['15 độ là lạnh nhất năm của người miền Nam đó', 'Ồ, vậy tôi sẽ tôn trọng cái lạnh của họ'],
        ['{K} mặc áo cộc tay làm cả Đà Lạt lạnh thay luôn', 'Haha tôi xin lỗi Đà Lạt', 8],
        ['Ừ', 'Ừ…']),
      t('Sao người Việt cười nhiều vậy? Người Nga chỉ cười khi thật sự có chuyện vui',
        ['Vì có cà phê ngon, cười là phải', 'Hợp lý. Tôi cũng cười… ở trong lòng'],
        ['Vì người Việt cười trước, giải quyết vấn đề sau', 'Triết lý mạnh. Tôi ghi lại', 8],
        ['Không biết', 'Ồ…']),
      t('{B} biết búp bê Matryoshka không? Búp bê trong búp bê',
        ['Biết chứ, giống chồng ly lồng nhau ở quầy {y} nè', 'Giống thật! Chồng ly cũng là nghệ thuật'],
        ['Biết, như deadline trong deadline của dân văn phòng', 'Haha đáng sợ hơn búp bê nhiều', 8],
        ['Biết', 'Tốt']),
    ], [
      t('People here wear puffer coats at 15°C. I thought a blizzard was coming',
        ['15°C is the coldest day of the year for southerners', 'Oh, then I respect their cold'],
        ['You in a T-shirt make all of Dalat feel cold for you', 'Haha sorry, Dalat', 8],
        ['Yeah', 'Yeah…']),
      t('Why do Vietnamese smile so much? Russians smile only when something is truly funny',
        ['Good coffee. Gotta smile', 'Logical. I’m smiling too… on the inside'],
        ['We smile first, solve problems later', 'Strong philosophy. Noting it down', 8],
        ['Dunno', 'Oh…']),
      t('Do you know Matryoshka dolls? Dolls inside dolls',
        ['Sure, like the nested cups stacked at my counter', 'So true! Stacking cups is art too'],
        ['Sure, like an office worker’s deadline inside a deadline', 'Haha scarier than dolls', 8],
        ['Yes', 'Good']),
    ]),
  }),
  group({
    id: 'vn', headline: L('Khách Hà Nội, Sài Gòn săn mây', 'Cloud Hunters from Hanoi & Saigon'), label: L('khách du lịch', 'tourist'), foreign: false, weight: 1.4, patience: 1,
    blurb: L('Khách Hà Nội, Sài Gòn lên Đà Lạt săn mây, mỗi người mang 3 bộ đồ chụp ảnh', 'Visitors from Hanoi and Saigon came up to hunt clouds, each with 3 photo outfits'),
    f: L(['Chị Thu Hà Nội', 'Bé Ngọc Check-in', 'Chị Lan Bánh Căn', 'Cô Ba Miền Tây', 'Em Vy Sống Ảo'], ['Ms. Thu from Hanoi', 'Little Ngọc Check-in', 'Ms. Lan Mini-Pancake', 'Auntie Ba from the Delta', 'Vy the Insta Queen']),
    m: L(['Anh Tuấn Sài Gòn', 'Anh Hùng Săn Mây', 'Anh Khoa Phượt Thủ', 'Chú Sáu Đi Tour'], ['Tuấn from Saigon', 'Hùng the Cloud Hunter', 'Khoa the Road-Tripper', 'Uncle Sáu on Tour']),
    persona: (g, name) => byTitle(name, g),
    pool: { skins: ['#f6d3b3', '#f0c8a2', '#e9bf97', '#d9a679'], hairs: [...DARK_HAIR, '#6b4026'], fs: ['long', 'shoulder', 'sunhat', 'nonla', 'bun'], ms: ['short', 'helmet', 'cap', 'messy'], shirts: ['#e8873a', '#ff9aa8', '#f2c14e', '#5b8bd9', '#f4f4f0', '#2fa38c'], acc: [['blush', 0.4], ['shades', 0.2], ['scarf', 0.25]] },
    greet: L([
      'Cho {t} ly {drink} nha {b}. Giờ này Hà Nội đang kẹt xe, ở đây chill quá trời',
      'Cho {t} {drink} nha. Sài Gòn 36 độ, lên đây lạnh tím môi mà vẫn uống đá',
      'Một {drink}! {T} đi săn mây từ 4 giờ sáng, mây không thấy, chỉ thấy buồn ngủ',
      'Quán đẹp quá trời, cho {t} {drink}, {t} thay bộ đồ thứ 3 rồi quay lại chụp',
      'Ly {drink} ít ngọt nha {b}. {T} vừa ăn 5 cái bánh tráng nướng rồi',
      'Cho {t} {drink}. {T} phượt 300 cây số chỉ để uống ly này, pha có tâm nha',
    ], [
      'One {drink}, please! Hanoi traffic is jammed right now. It’s so chill here',
      'One {drink}! Saigon is 36°C. Here my lips are blue and I still want ice',
      'One {drink}! Up at 4am cloud hunting. No clouds, just sleepy',
      'Such a pretty café! One {drink}. I’ll change into outfit #3 and come back for photos',
      'One {drink}, less sweet. I just ate 5 Dalat pizzas',
      'One {drink}. I rode 300 km just for this, so make it with love',
    ]),
    impatient: L([
      'Ủa alo, ly của {t} đi săn mây luôn rồi hả?',
      'Đợi lâu dữ, đèo Prenn còn qua nhanh hơn',
      '{T} đứng chờ tới mức chụp xong một bộ ảnh luôn rồi',
      'Ét o ét, xe khách 3 giờ chạy rồi đó {b} ơi',
    ], [
      'Hello?? Did my drink go cloud hunting too?',
      'Such a wait. The mountain pass was faster',
      'I finished a whole photoshoot while waiting',
      'SOS, the 3 o’clock bus is leaving!',
    ]),
    good: L([
      'Đỉnh nóc kịch trần bay phấp phới! Lên Đà Lạt không ghé là phí',
      'Ngon xỉu, chill xỉu, ảnh đẹp xỉu. Mãi mận mãi keo',
      'Uống ly này xong mới hiểu vì sao lên Đà Lạt rồi không muốn về',
      'Quá dữ quá dữ! Hà Nội có cà phê trứng, Đà Lạt có quán này',
    ], [
      'Top tier, through the roof! Skip this café and you wasted the trip',
      'Crazy tasty, crazy chill, crazy pretty pics. Fan for life',
      'Now I get why people come to Dalat and never leave',
      'Wow wow! Hanoi has egg coffee, Dalat has this café',
    ]),
    meh: L([
      'Ngon mà lâu quá, {t} lỡ mất hoàng hôn rồi',
      'Tạm ổn, ảnh đẹp hơn vị',
      'Được, nhưng giá hơi Sài Gòn mà không khí thì Đà Lạt',
    ], [
      'Tasty but so slow, I missed the sunset',
      'Okay. Prettier in photos than in taste',
      'Fine, but Saigon prices with Dalat vibes',
    ]),
    chats: L([
      t('Ở Đà Lạt chỗ nào săn mây đẹp nhất vậy {b}?',
        ['Đồi chè Cầu Đất, {k} đi lúc 5 giờ sáng là đẹp nhất', 'Cảm ơn {b} nha, mai {t} dậy sớm liền!'],
        ['{K} ngồi đây chờ, mây tự bay ngang quán, khỏi đi', 'Hahaha nghe hợp lý ghê, khỏi dậy sớm', 8],
        ['Không biết', 'Ờ… {t} tự tra mạng vậy']),
      t('Cà phê Hà Nội với Sài Gòn, {b} thấy ở đâu ngon hơn?',
        ['Ở đâu cũng ngon, ngon nhất là ly có người thương ngồi cùng', 'Trời ơi nói chuyện ngọt hơn bạc xỉu'],
        ['Ngon nhất là ở Đà Lạt, ngay chỗ {k} đang đứng nè', 'Haha né câu hỏi quá đỉnh, {t} chịu', 8],
        ['Không biết', 'Câu trả lời an toàn ghê']),
      t('Lên Đà Lạt mà quên mang áo ấm, lạnh run luôn rồi nè {b}',
        ['{K} uống ly này cho ấm, rồi ghé chợ đêm mua áo len', 'Cảm ơn {b} nha, quán có tâm quá'],
        ['Mặc chồng 3 bộ đồ chụp ảnh lên là ấm', 'Hahaha sao {b} biết {t} mang 3 bộ', 8],
        ['Lạnh thật', 'Ừ… cảm ơn đã xác nhận']),
    ], [
      t('Where’s the best cloud hunting in Dalat?',
        ['Cầu Đất tea hills. Go at 5am for the best view', 'Thanks! Setting my alarm right now!'],
        ['Just sit here, the clouds float past the café', 'Hahaha makes sense, no early alarm', 8],
        ['Dunno', 'Oh… I’ll google it']),
      t('Hanoi coffee or Saigon coffee, which is better?',
        ['Both. Best is the cup you share with someone you love', 'Aww, sweeter than a bạc xỉu'],
        ['Best is in Dalat, right where you’re standing', 'Haha what a dodge, I give up', 8],
        ['Dunno', 'Very safe answer']),
      t('Came to Dalat and forgot my jacket. I’m shivering',
        ['Drink this to warm up, then grab a sweater at the night market', 'Thank you, such a caring café'],
        ['Just layer all 3 photo outfits', 'Hahaha how did you know I brought 3', 8],
        ['It is cold', 'Yeah… thanks for confirming']),
    ]),
  }),
  group({
    id: 'vanphong', headline: L('Dân văn phòng đi “nghỉ dưỡng”', 'Office Crowd on “Vacation”'), label: L('dân văn phòng', 'office worker'), foreign: false, weight: 1.2, patience: 0.8,
    blurb: L('Một công ty đi “nghỉ dưỡng” ở Đà Lạt, ai cũng mang theo laptop và một deadline', 'A company “retreat” in Dalat: everyone brought a laptop and a deadline'),
    f: L(['Chị Kế Toán', 'Chị HR', 'Chị PM Gantt', 'Em Intern'], ['Ms. Accountant', 'Ms. HR', 'Gantt-Chart PM', 'The Intern']),
    m: L(['Anh Trưởng Phòng', 'Anh Dev Lên Prod', 'Anh Sale Chạy KPI', 'Anh Designer Sửa Logo'], ['The Department Head', 'Prod-Push Dev', 'KPI-Chasing Sales Guy', 'Logo-Fixing Designer']),
    persona: (g, name) => byTitle(name, g),
    pool: { skins: ['#f6d3b3', '#f0c8a2', '#e9bf97'], hairs: [...DARK_HAIR, '#6b4026'], fs: ['shoulder', 'bob', 'bun', 'long'], ms: ['short', 'messy', 'slick'], shirts: ['#f4f4f0', '#b8d8f0', '#4a4f57', '#2e3f6e'], acc: [['glasses', 0.5], ['tie', 0.3], ['collar', 0.4], ['hoodie', 0.15]] },
    greet: L([
      'Cho {t} {drink}, đậm nhất có thể. Công ty cho đi nghỉ dưỡng, nhưng sếp vẫn họp lúc 9 giờ',
      '{B} ơi {drink} nha. {T} đang nghỉ phép, chỉ online “một xíu” thôi, từ sáng tới giờ',
      '{drink} một ly. Wifi quán mạnh không {b}? {T} cần đẩy code lên trước 10 giờ',
      'Cho {t} {drink}. Ly thứ 4 rồi, đi team building mà toàn build slide',
      'Một {drink}, nhanh giùm {t}. Sếp vừa nhắn “rảnh không” lúc {t} đang ngắm đồi thông',
      '{drink} nha {b}. Out of office đã bật, nhưng {t} vẫn trả lời mail trong 3 phút',
      'Cho {t} {drink}. Công ty bảo “cứ nghỉ thoải mái, chỉ cần báo cáo cuối ngày”',
    ], [
      'One {drink}, strongest possible. It’s a company retreat, but the boss still has a 9am meeting',
      'One {drink}, please. I’m on leave, just online “for a sec”. Since this morning',
      'One {drink}. Is the Wi-Fi strong? I need to push code before 10',
      'One {drink}. That’s my 4th. Team building, but all we build is slides',
      'One {drink}, fast please. Boss texted “free?” while I was admiring the pines',
      'One {drink}, please. Out-of-office is on, but I still reply within 3 min',
      'One {drink}. Company said “rest up, just send a report at end of day”',
    ]),
    impatient: L([
      '{B} ơi nhanh giùm, cuộc họp Zoom bắt đầu sau 2 phút',
      'Sếp đang gõ “…”, {t} cần caffeine trước khi tin nhắn hiện ra',
      'Deadline chạy nhanh hơn ly nước của {t} rồi',
      'Ly này trễ thêm chút là thành task quá hạn',
      '{T} nghỉ dưỡng mà tim đập như ngày nộp báo cáo quý',
    ], [
      'Hurry please, my Zoom call starts in 2 minutes',
      'Boss is typing “…”. I need caffeine before it lands',
      'The deadline is outrunning my drink',
      'A bit longer and this drink becomes an overdue task',
      'On vacation, but my heart’s racing like quarterly report day',
    ]),
    good: L([
      'Ngon tới mức {t} trả lời mail sếp bằng giọng vui vẻ luôn',
      'Uống xong deadline tự chạy, sếp khen, mai {t} xin tăng lương',
      'Ly cà phê đầu tiên trong năm không phải uống trong phòng họp. Cảm động',
      'Đã ghim quán vào lịch: “Họp với cà phê Dreamers”, lặp lại mỗi sáng',
      '5 sao. Đã tick “Done” task “uống cà phê ngon ở Đà Lạt”',
    ], [
      'So good I replied to my boss cheerfully',
      'Deadline handled, boss is happy. Asking for a raise tomorrow',
      'First coffee this year not drunk in a meeting room. I’m touched',
      'Added to calendar: “Meeting with Dreamers coffee”, repeats daily',
      '5 stars. Ticked “Done”: drink great coffee in Dalat',
    ]),
    meh: L([
      'Tạm ổn, nhưng chờ lâu tới mức {t} bị điểm danh trễ họp',
      'Được, nhưng wifi yếu, file 2GB vẫn chưa gửi xong',
      'Ngon mà không làm deadline biến mất. 3 sao',
    ], [
      'Okay, but the wait made me late for roll call',
      'Fine, but weak Wi-Fi. My 2GB file still hasn’t sent',
      'Tasty, but my deadline didn’t vanish. 3 stars',
    ]),
    chats: L([
      t('{B} ơi, {t} ngồi đây làm việc tới tối được không? Công ty bảo đi nghỉ dưỡng',
        ['Được chứ, có ổ cắm với wifi mạnh cho {k} luôn', '{B} là ân nhân của dân văn phòng'],
        ['Được, nghỉ dưỡng kiểu này gọi là “dời văn phòng lên núi”', 'Haha chuẩn không cần chỉnh, đau quá', 8],
        ['Được', 'Cảm ơn, {t} đi họp tiếp đây']),
      t('Sếp nhắn “rảnh không?” vào chủ nhật. Trả lời sao giờ {b}?',
        ['{K} nói đang ở vùng sóng yếu, rồi tắt máy uống cà phê', 'Đỉnh! Đà Lạt sóng yếu là chuyện bình thường mà'],
        ['Trả lời “Dạ rảnh, nhưng tâm hồn đang bận”', 'Hahaha {t} copy câu này luôn', 9],
        ['Trả lời rảnh', 'Thôi xong cuối tuần của {t}']),
      t('{T} đi team building mà ba ngày toàn chơi trò “đồng đội” với file Excel',
        ['{K} uống ly này nghỉ 15 phút, Excel không chạy đi đâu đâu', 'Đúng, nó sẽ ở đó chờ {t}, như ác mộng'],
        ['Team building thật ra là team “building” báo cáo mà', 'Haha đúng bản chất luôn', 8],
        ['Vất vả ghê', 'Ừ…']),
      t('{B} biết KPI là gì không? {T} mơ thấy nó mỗi đêm',
        ['KPI của quán là khách cười, {k} cười một cái là đạt', 'Ui, {b} làm {t} đạt KPI rồi đó'],
        ['KPI là “Không Phải Ít” việc đúng không {k}', 'Haha chuẩn nghĩa tiếng Việt luôn', 9],
        ['Biết', 'Ờ…']),
    ], [
      t('Can I work here till evening? Company calls this a “retreat”',
        ['Of course, there’s a plug and strong Wi-Fi for you', 'You’re a hero to office workers'],
        ['Sure. This kind of retreat is “moving the office up a mountain”', 'Haha spot on. It hurts', 8],
        ['Sure', 'Thanks, back to meetings']),
      t('Boss texted “free?” on a Sunday. How do I reply?',
        ['Say the signal’s weak, then switch off and sip coffee', 'Genius! Weak signal is normal in Dalat'],
        ['Reply: “I’m free, but my soul is busy”', 'Hahaha copying that', 9],
        ['Say yes', 'There goes my weekend']),
      t('Three days of team building, and my only teammate is an Excel file',
        ['Take 15 with this drink. Excel isn’t going anywhere', 'True. It’ll be waiting, like a nightmare'],
        ['Team building is really team “building reports”', 'Haha that’s exactly it', 8],
        ['Tough', 'Yeah…']),
      t('Do you know what a KPI is? I dream about it every night',
        ['Our KPI is guest smiles. One smile and you’ve hit it', 'Aww, you just made me hit my KPI'],
        ['“Keep Piling It on”, right?', 'Haha that’s the real meaning', 9],
        ['Yes', 'Oh…']),
    ]),
  }),
]

/** Hội khách cá tính trên phố: mỗi người có ngoại hình, xưng hô, câu gọi món & chuyện tám riêng */
export function makeCharacterGroup(chars: { name: string; look: Look; p: Persona; greet: string[]; chats: ChatTopic[] }[]): GuestGroup {
  return {
    id: 'pho', headline: L('Hội khách cá tính phố Dốc', 'The Slope Street Characters'), label: L('khách cá tính', 'local character'), foreign: false, weight: 0.6, patience: 1,
    blurb: L('Hội khách cá tính trên phố Dốc Mộng Mơ hay ghé, mỗi người một kiểu khó chiều dễ thương', 'The quirky crowd from Dreamy Slope Street drops by: hard to please, easy to love'),
    f: chars.filter((c) => c.p.g === 'f').map((c) => c.name),
    m: chars.filter((c) => c.p.g === 'm').map((c) => c.name),
    names: chars.map((c) => c.name),
    persona: (g) => xung.minh(g),
    look: () => pk(chars).look,
    greet: chars.flatMap((c) => c.greet),
    impatient: L([
      'Tíc tắc… tíc tắc… {t} đếm từng giây đó nha',
      'Pha cà phê hay đang trồng cà phê vậy {b}?',
      'Ly của {t} đi đường vòng hả?',
      'Chậm vậy là định để {t} viết sớ hả?',
    ], [
      'Tick tock… tick tock… I’m counting every second',
      'Are you brewing the coffee or growing it?',
      'Did my drink take the scenic route?',
      'This slow? Want me to file a formal complaint?',
    ]),
    good: L([
      'Ngon. Nhưng {t} vẫn sẽ chê cái ghế',
      'Định chê mà tìm không ra chỗ chê. Bực ghê',
      'Hừm, lần này {t} tha. Đừng có cười',
      'Ly hơi nhỏ, đá hơi nhiều, nhạc hơi to… mà thôi, ngon',
      'Không có gì để chê, {t} thấy khó chịu ghê',
    ], [
      'Tasty. But I’m still complaining about the chair',
      'Came to complain, found nothing. So annoying',
      'Hmph. I’ll let it slide this time. Don’t smile',
      'Cup’s small, too much ice, music’s loud… whatever, it’s good',
      'Nothing to complain about. I find that very upsetting',
    ]),
    meh: L([
      'Tốc độ phục vụ ngang wifi nhà hàng xóm',
      'Đề nghị quán đổi tên thành “Đợi Hoài Coffee”',
      'Quán tên Dreamers đúng rồi, vì phục vụ nhanh chỉ có trong mơ',
      'Chờ ly nước mà như chờ người yêu cũ quay lại',
    ], [
      'Service as fast as the neighbor’s Wi-Fi',
      'Suggest renaming this place “Forever Waiting Coffee”',
      'Dreamers is the right name: fast service only happens in dreams',
      'Waiting for this drink is like waiting for an ex to come back',
    ]),
    chats: [],
    people: chars.map((c, i) => ({ name: c.name, look: c.look, p: c.p, greet: c.greet, chats: c.chats, album: `boss:${i}` })),
  }
}

/** Tất cả tên khách du lịch (cho album) */
export const INTL_NAMES = GUEST_GROUPS.flatMap((g) => g.names.map((n) => ({ name: n, group: g.label })))
