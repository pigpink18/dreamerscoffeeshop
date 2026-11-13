// Cốt truyện chính "28 ngày giữ dốc": chuỗi MÂY Coffee muốn mua cả con dốc, bà Tư chủ nhà sẽ quyết định
// cho ai thuê tiếp vào ngày chung kết Hội Barista Phố Núi. Mỗi chương là 1 cảnh hội thoại hiện đầu ngày,
// lựa chọn trong cảnh để lại cờ (flags) ảnh hưởng lượng khách, danh tiếng, tiền và cái kết.
import { ownerLook, G, L, DEFAULT_NAME, GENDER } from './i18n'
import { computed, watch } from 'vue'
import { save, ui, toast, persist } from './store'
import { hooks } from './hooks'
import { REGULARS, type Look } from './data'
import { sfx } from './audio'

export type Speaker = 'yen' | 'cao' | 'tu' | 'thang' | 'me' | 'kenny' | 'linh' | 'none'
export type Bg = 'shop' | 'night' | 'rain' | 'stage'

export interface Choice {
  text: string
  sassy?: boolean
  /** cờ bật lên khi chọn */
  set?: string
  /** điểm "lòng phố" (cộng vào chấm điểm kết) */
  support?: number
  rep?: number
  money?: number
  /** câu đáp ngay sau khi chọn */
  reply?: Line[]
}
export interface Line {
  who: Speaker
  text: string
  mood?: 'neutral' | 'happy' | 'angry' | 'sad' | 'love' | 'grumpy'
  /** chỉ hiện khi cờ này đã bật (hoặc "!cờ" = chưa bật) */
  if?: string
  choices?: Choice[]
}
export interface Chapter {
  id: string
  /** số ngày tính từ lúc bắt đầu cốt truyện (ngày 1 của game mới → at 1 = ngày 2) */
  at: number
  title: string
  bg: Bg
  /** 2 nhân vật đứng trong cảnh (trái, phải) */
  cast: [Speaker, Speaker]
  lines: Line[]
  /** mục tiêu / gợi ý hiện ở màn chuẩn bị sau chương này */
  goal: string
  /** chương chung kết của một phần truyện (xem xong → tính cái kết + thưởng) */
  finale?: boolean
  /** phần truyện (1 = mùa đầu: hợp đồng 28 ngày). Mặc định 1 */
  arc?: number
  /** hiệu ứng lên cơ chế khi xem xong */
  after?: () => void
}

// ---------- nhân vật ----------
const girl = (shirt: string): Look => ({ skin: '#f3c9a6', hair: '#1f1a1c', style: 'shoulder', shirt, acc: ['blush'] })
export const CAST: Record<Exclude<Speaker, 'none' | 'cao'>, { name: string; look: Look; pitch: number }> = {
  yen: { name: DEFAULT_NAME[GENDER], look: ownerLook('#3f7a73'), pitch: G(640, 470) },
  tu: { name: L('Bà Tư chủ nhà', 'Mrs. Tư, the landlady'), look: { skin: '#e2b089', hair: '#d9d4cb', style: 'bun', shirt: '#7a4f8a', acc: ['glasses'] }, pitch: 420 },
  thang: { name: L('Thắng “Nhân Rộng” · CEO MÂY Coffee', 'Thắng “Scale-Up” · CEO of MÂY Coffee'), look: { skin: '#f0c8a0', hair: '#2a2220', style: 'slick', shirt: '#24242b', accent: '#f4f4f0', acc: ['shades', 'chain'] }, pitch: 330 },
  me: { name: L('Mẹ', 'Mom'), look: { skin: '#efc39c', hair: '#3a2c28', style: 'bob', shirt: '#b8484a', acc: ['glasses', 'earring'] }, pitch: 520 },
  kenny: { name: 'Kenny Sang', look: REGULARS.find((r) => r.id === 'tuan')?.look ?? girl('#f4f4f0'), pitch: 380 },
  linh: { name: 'Linh Livestream', look: { skin: '#f6d2b5', hair: '#c9864f', style: 'long', shirt: '#ff8fb8', acc: ['hoops', 'lipstick'] }, pitch: 760 },
}
export const speakerName = (s: Speaker) => (s === 'cao' ? 'Cáo' : s === 'none' ? '' : s === 'yen' ? save.player || DEFAULT_NAME[GENDER] : CAST[s].name)

const flag = (k: string) => !!save.story.flags[k]
const addSupport = (n: number) => { save.story.flags.support = (save.story.flags.support ?? 0) + n }

// ---------- kịch bản ----------
// chuỗi "{name}" được thay bằng tên chủ quán lúc hiển thị (StoryScene)
export const CHAPTERS: Chapter[] = [
  {
    id: 'c1', at: 1, title: L('Chương 1 · Tờ hợp đồng 28 ngày', 'Chapter 1 · The 28-day lease'), bg: 'shop', cast: ['yen', 'tu'],
    goal: L('Giữ khách vui để nâng danh tiếng. Ngày chung kết, bà Tư sẽ quyết định.', 'Keep guests happy to grow your reputation. On finals day, Mrs. Tư decides.'),
    lines: [
      { who: 'tu', text: L('Con {name}, bà nói thẳng nha. Có một chuỗi cà phê trên thành phố muốn mua nguyên con dốc này.', '{name}, dear, I’ll be straight with you. A big city coffee chain wants to buy this whole slope.') },
      { who: 'yen', text: L('Dạ?! Nguyên con dốc luôn hả bà?', 'What?! The WHOLE slope?'), mood: 'sad' },
      { who: 'tu', text: L('Họ trả gấp ba tiền thuê. Mà bà già rồi, bà không ham tiền. Bà ham cái quán có hồn.', 'They’re offering triple the rent. But I’m old. I don’t want money. I want a café with a soul.') },
      { who: 'tu', text: L('Còn 28 ngày nữa là Hội Barista Phố Núi. Hôm đó bà sẽ coi phố này thương ai hơn, rồi bà quyết.', 'The Hill Town Barista Fest is in 28 days. That day I’ll see who this street loves more. Then I’ll decide.') },
      { who: 'cao', text: L('Gâu! (Cáo đặt cái chân lên tờ hợp đồng như ký tên.)', 'Woof! (Cáo plants a paw on the lease, like a signature.)') },
      { who: 'yen', text: L('Dạ… vậy con xin bà 28 ngày.', 'Okay… then give me those 28 days.'), choices: [
        { text: L('Con hứa quán sẽ là chỗ cả dốc thương nhất!', 'I promise this will be the most loved spot on the slope!'), support: 3, reply: [{ who: 'tu', text: L('Được. Nói được thì làm được nha con.', 'Good. Big words, dear. Now back them up.'), mood: 'happy' }] },
        { text: L('Chuỗi đó gấp ba thì con… gấp bốn tình cảm!', 'They pay triple? I’ll pay quadruple… in love!'), sassy: true, support: 2, rep: 2, reply: [{ who: 'tu', text: L('Cha, cái miệng này bán cà phê là hợp rồi đó!', 'Ha! With a mouth like that, you were born to sell coffee!'), mood: 'happy' }] },
      ] },
    ],
  },
  {
    id: 'c2', at: 3, title: L('Chương 2 · CEO đi dép tổ ong', 'Chapter 2 · The CEO in foam sandals'), bg: 'shop', cast: ['yen', 'thang'],
    goal: L('MÂY Coffee đã để ý quán. Nâng cấp quán và giữ danh tiếng thật ổn.', 'MÂY Coffee has its eye on you. Upgrade the café and keep your reputation strong.'),
    lines: [
      { who: 'thang', text: L('Chào em. Anh là Thắng, founder kiêm CEO kiêm Chief Vibe Officer của MÂY Coffee.', 'Hey. I’m Thắng: founder, CEO and Chief Vibe Officer of MÂY Coffee.') },
      { who: 'thang', text: L('Anh không bán cà phê. Anh bán một hệ sinh thái trải nghiệm đa điểm chạm, có roadmap scale lên 300 chi nhánh.', 'I don’t sell coffee. I sell a multi-touchpoint experience ecosystem, with a roadmap to scale to 300 stores.') },
      { who: 'yen', text: L('Dạ… vậy anh uống gì ạ?', 'Uh huh… so what can I get you?') },
      { who: 'thang', text: L('Anh uống… data. Mà thôi, cho anh ly bạc xỉu ít đường, ít đá, ít sữa, nhiều insight.', 'I drink… data. Fine, a bạc xỉu. Less sugar, less ice, less milk, extra insight.') },
      { who: 'thang', text: L('Nói thẳng: anh mua lại quán em. Em làm store manager cho anh, KPI nhẹ thôi, 14 tiếng một ngày.', 'Bottom line: I buy your café. You stay on as store manager. Light KPIs. Just 14 hours a day.'), choices: [
        { text: L('Dạ cảm ơn anh, nhưng quán này không bán ạ.', 'Thanks, but this café isn’t for sale.'), support: 2, reply: [{ who: 'thang', text: L('Ok em. Nhưng thị trường không chờ ai đâu nha.', 'Sure. But the market waits for no one.'), mood: 'grumpy' }] },
        { text: L('Hệ sinh thái của anh có cây thông nào không anh?', 'Does your ecosystem have any actual trees?'), sassy: true, set: 'locals', support: 4, rep: 3, reply: [
          { who: 'thang', text: L('…Em sẽ hối hận đó. MÂY sẽ khai trương ngay đối diện.', '…You’ll regret that. MÂY is opening right across the street.'), mood: 'angry' },
          { who: 'none', text: L('Mấy ông chú uống cà phê bàn bên cạnh vỗ tay rần rần. Chuyện lan khắp dốc trong một buổi sáng.', 'The old uncles at the next table burst into applause. By lunch, the whole slope has heard.') },
        ] },
      ] },
    ],
  },
  {
    id: 'c3', at: 6, title: L('Chương 3 · Cuộc gọi lúc 9 giờ tối', 'Chapter 3 · The 9 PM phone call'), bg: 'night', cast: ['yen', 'me'],
    goal: L('Mẹ đang lo. Cố có một tuần lời đẹp cho mẹ yên tâm.', 'Mom is worried. Turn a nice profit this week to put her mind at ease.'),
    lines: [
      { who: 'me', text: L(`Alo, ${G('con gái', 'con trai')}. Mẹ coi Facebook thấy con đứng bán cà phê, tay đen thui hà.`, 'Hello, sweetie. I saw you on Facebook selling coffee. Your hands were all black!'), mood: 'sad' },
      { who: 'me', text: L('Cô Hạnh nói ngân hàng của cô đang tuyển. Con về Hà Nội đi, có lương tháng, có bảo hiểm.', 'Auntie Hạnh says her bank is hiring. Come home to Hanoi. Steady pay, health insurance…') },
      { who: 'yen', text: L('Mẹ ơi…', 'Mom…'), mood: 'sad' },
      { who: 'cao', text: L('Ẳng! (Cáo chen mặt vào camera.)', 'Arf! (Cáo shoves his face into the camera.)') },
      { who: 'me', text: L('Ủa con gì mập vậy? Con nuôi chó mà không nói mẹ hả?!', 'What is that chubby thing? You got a DOG and didn’t tell me?!'), mood: 'angry' },
      { who: 'yen', text: L('Dạ… đây là Cáo, đồng sáng lập của con.', 'Um… this is Cáo. My co-founder.'), choices: [
        { text: L('Mẹ lên Đà Lạt chơi với con đi, rồi mẹ coi quán.', 'Come visit me in Da Lat, Mom. See the café yourself.'), set: 'momVisit', support: 2, reply: [{ who: 'me', text: L('Để mẹ coi vé xe… Nhưng mẹ lên là mẹ kiểm tra sổ sách đó nha!', 'Let me check bus tickets… But when I come, I’m checking your books!'), mood: 'happy' }] },
        { text: L('Con ổn mà mẹ, mẹ đừng lo.', 'I’m fine, Mom. Don’t worry.'), reply: [{ who: 'me', text: L('Ừ… con nhớ ăn uống đàng hoàng. Mẹ gửi đồ lên cho.', 'Okay… eat properly, alright? I’ll send you a care package.'), mood: 'sad' }] },
      ] },
    ],
  },
  {
    id: 'c4', at: 9, title: L('Chương 4 · Kenny muốn nghỉ việc', 'Chapter 4 · Kenny wants to quit'), bg: 'rain', cast: ['yen', 'kenny'],
    goal: L('Những người khách quen là chỗ dựa của quán. Tám chuyện nhiều với họ.', 'Your regulars are your rock. Chat with them often.'),
    lines: [
      { who: 'kenny', text: L('Em ơi, ly đen đá như cũ… À không, hôm nay anh không đi làm. Anh xin nghỉ ốm.', 'Hey, the usual iced black… Actually, no work today. I called in sick.'), mood: 'sad' },
      { who: 'kenny', text: L('Ốm thiệt nha, ốm tâm hồn. Sáng nay anh mở Outlook ra là tim đập 140.', 'Really sick. Soul-sick. I opened Outlook this morning and my heart hit 140.') },
      { who: 'kenny', text: L('Em bỏ việc văn phòng lên đây mở quán, em có sợ không?', 'You quit your office job to open a café up here. Weren’t you scared?'), choices: [
        { text: L('Sợ chứ anh. Nhưng sợ cả đời còn sợ hơn.', 'Terrified. But being scared my whole life scared me more.'), set: 'kennyQuit', support: 2, reply: [{ who: 'kenny', text: L('…Câu này anh in ra dán lên màn hình máy tính luôn.', '…I’m printing that and taping it to my monitor.'), mood: 'happy' }] },
        { text: L('Anh thử nghỉ phép một tuần trước đã.', 'Maybe start with a week off?'), set: 'kennyRest', support: 1, reply: [{ who: 'kenny', text: L('Ừ ha. Nghỉ phép thì sếp vẫn gọi, nhưng anh sẽ… không bắt máy!', 'True. The boss will still call, but I’ll just… not pick up!'), mood: 'happy' }] },
        { text: L('Anh mà nghỉ thì ai trả tiền cà phê cho em?', 'If you quit, who’s gonna buy my coffee?'), sassy: true, support: 1, rep: 1, reply: [{ who: 'kenny', text: L('Haha, thực tế ghê. Thôi anh cày thêm mùa KPI này vì em đó.', 'Haha, brutal. Fine, I’ll grind one more KPI season. For you.'), mood: 'happy' }] },
      ] },
    ],
  },
  {
    id: 'c5', at: 13, title: L('Chương 5 · MÂY khai trương đối diện', 'Chapter 5 · MÂY opens across the street'), bg: 'shop', cast: ['linh', 'thang'],
    goal: L('MÂY phát ly miễn phí 3 ngày, khách sẽ vắng hơn. Pha thật chuẩn để giữ khách.', 'MÂY is giving away free drinks for 3 days, so fewer guests. Brew perfectly to keep them.'),
    after: () => { save.story.flags.mayOpen = save.day },
    lines: [
      { who: 'none', text: L('Sáng nay, bên kia dốc dựng cổng bong bóng, loa kéo mở nhạc EDM. MÂY Coffee khai trương.', 'This morning, a balloon arch goes up across the slope and a speaker blasts EDM. MÂY Coffee is open.') },
      { who: 'linh', text: L('Hello cả nhà iu! Linh Livestream đây! Hôm nay MÂY tặng ly đầu tiên FREE nha! Thả tim đi mọi người!', 'Hiii fam! Linh Livestream here! MÂY’s first cup is FREE today! Smash those hearts!'), mood: 'love' },
      { who: 'thang', text: L('Cà phê của MÂY được tối ưu bằng AI. Hạt cà phê được chọn bởi thuật toán.', 'MÂY coffee is AI-optimized. Every bean is selected by an algorithm.'), mood: 'happy' },
      { who: 'linh', text: L('Ủa anh, vậy cà phê này rang ở đâu dạ?', 'Ooh, so where do you roast it?') },
      { who: 'thang', text: L('Ở… trên cloud em.', 'In… the cloud.'), mood: 'grumpy' },
      { who: 'none', text: L('Khách xếp hàng dài bên kia đường. Cáo nằm dài trước cửa quán, buồn so.', 'The line stretches down the street over there. Cáo sprawls by the door, glum.') },
      { who: 'none', if: 'locals', text: L('Nhưng mấy ông chú hôm trước vẫn ghé Dreamers: “Ly free bên kia không có cây thông.”', 'But those old uncles still drop by Dreamers: “Free coffee over there doesn’t come with trees.”') },
    ],
  },
  {
    id: 'c6', at: 16, title: L('Chương 6 · Chuyến xe lúc nửa đêm', 'Chapter 6 · The midnight delivery'), bg: 'night', cast: ['yen', 'cao'],
    goal: L('Lựa chọn của bạn đang lan khắp phố. Giữ danh tiếng thật vững.', 'Word of your choice is spreading. Keep your reputation rock solid.'),
    lines: [
      { who: 'none', text: L('Gần nửa đêm. {name} đang lau quầy, Cáo ngủ gật trên đệm thì một chiếc xe tải nhỏ đỗ xịch trước cửa.', 'Almost midnight. {name} is wiping the counter and Cáo is dozing on his cushion when a small truck pulls up outside.') },
      { who: 'none', text: L('Anh tài xế mặc áo đồng phục MÂY gõ cửa: “Quán còn mở hông em? Cho anh ly phin nóng, ly thật nha.”', 'A driver in a MÂY uniform knocks: “Still open? One hot phin coffee, please. A real one.”') },
      { who: 'yen', text: L('Anh chở hàng cho MÂY mà qua đây uống cà phê ạ?', 'You deliver for MÂY… but come here for coffee?'), mood: 'neutral' },
      { who: 'none', text: L('Anh gãi đầu cười: “Chở cho tụi nó cả tháng mà anh chưa dám uống ly nào.”', 'He scratches his head: “I’ve hauled their stuff for a month and never dared drink a cup.”') },
      { who: 'cao', text: L('Gâu? (Cáo tỉnh dậy, chạy ra hít hít thùng xe rồi sủa một tràng vào mấy cái bao chất đầy.)', 'Woof? (Cáo wakes up, sniffs the truck, then barks at the pile of sacks inside.)') },
      { who: 'none', text: L('Trên bao in to đùng: “BỘT HƯƠNG CÀ PHÊ – 3 TRONG 1 – 25KG”.', 'Printed huge on every sack: “COFFEE-FLAVORED POWDER – 3-IN-1 – 25KG”.') },
      { who: 'yen', text: L('Trời đất… “Cà phê chọn bởi thuật toán” là cái này hả?', 'Oh my god… THIS is the “algorithm-selected coffee”?'), mood: 'angry' },
      { who: 'yen', text: L('Giờ mình tính sao đây Cáo?', 'So what do we do now, Cáo?'), choices: [
        { text: L('Chụp hình đăng lên group Đà Lạt Review.', 'Snap a pic and post it to the Da Lat Review group.'), sassy: true, set: 'exposed', support: 3, rep: 4, reply: [
          { who: 'none', text: L('Bài đăng đạt 12 nghìn lượt chia sẻ sau một đêm. Comment top: “Cloud gì mà cloud 3 trong 1”.', '12,000 shares overnight. Top comment: “So the cloud is… 3-in-1?”') },
        ] },
        { text: L('Thôi, pha cho anh ấy một ly thật ngon. Mình thắng bằng ly cà phê của mình.', 'Let it go. Brew him a great cup. We’ll win with our own coffee.'), set: 'kind', support: 5, reply: [
          { who: 'none', text: L('Anh tài xế nhấp một ngụm, lặng đi một lúc: “Mai anh kể sếp nghe… cà phê thật nó khác lắm.”', 'The driver takes a sip and goes quiet. “Tomorrow I’m telling the boss… real coffee is something else.”') },
          { who: 'cao', text: L('Gâu. (Cáo có vẻ vẫn muốn cắn cái bao hơn.)', 'Woof. (Cáo clearly still wants to bite the sack.)') },
        ] },
      ] },
    ],
  },
  {
    id: 'c7', at: 19, title: L('Chương 7 · Mẹ lên Đà Lạt', 'Chapter 7 · Mom comes to Da Lat'), bg: 'shop', cast: ['yen', 'me'],
    goal: L('Gần tới chung kết rồi. Đông khách, pha chuẩn, đừng để ai bỏ về.', 'The finals are close. Pack the café, brew right, and don’t let anyone walk out.'),
    lines: [
      { who: 'me', if: 'momVisit', text: L('Trời đất, lạnh quá con ơi! Ủa quán con… dễ thương vậy hả?', 'Goodness, it’s freezing! Wait… your café is THIS cute?'), mood: 'happy' },
      { who: 'me', if: 'momVisit', text: L('Mẹ ngồi đây từ sáng, đếm được 40 khách, có ông Tây còn khen “very good” nữa!', 'I’ve sat here since morning and counted 40 customers! A foreigner even said “very good”!'), mood: 'love' },
      { who: 'me', if: 'momVisit', text: L('Thôi, mẹ không nói chuyện ngân hàng nữa. Cầm chút tiền nè, mua cái máy xay cho đàng hoàng.', 'Fine, no more bank talk. Here’s a little money. Buy yourself a proper grinder.'), mood: 'happy' },
      { who: 'none', if: '!momVisit', text: L('Một thùng hàng từ Hà Nội gửi lên: ô mai, trà, một cái khăn len và mẩu giấy viết tay.', 'A box arrives from Hanoi: candied plums, tea, a knitted scarf and a handwritten note.') },
      { who: 'me', if: '!momVisit', text: L('“Mẹ coi clip con trên mạng rồi. Mẹ không hiểu hết, nhưng thấy con cười nhiều. Vậy là được.”', '“I watched your videos online. I don’t get all of it, but you smile a lot. That’s enough for me.”'), mood: 'love' },
      { who: 'yen', text: L('…Mẹ ơi.', '…Oh, Mom.'), mood: 'love' },
      { who: 'cao', text: L('Gâu! (Cáo ăn mất nửa gói ô mai.)', 'Woof! (Cáo eats half the candied plums.)') },
    ],
    after: () => {
      const m = flag('momVisit') ? 500_000 : 200_000
      save.money += m
      toast(L(`Mẹ cho ${m / 1000}K. Thương mẹ!`, `Mom sent ${m / 1000}K. Love you, Mom!`), 'heart', 3200)
    },
  },
  {
    id: 'c8', at: 23, title: L('Chương 8 · Đêm cúp điện', 'Chapter 8 · The night the lights went out'), bg: 'rain', cast: ['yen', 'tu'],
    goal: L('Chặng cuối! Danh tiếng cao + lòng phố = cái kết đẹp.', 'Final stretch! High reputation + neighborhood love = a happy ending.'),
    lines: [
      { who: 'none', text: L('Bão về. Cả dốc cúp điện. Bên MÂY máy pha tự động đứng hình, đóng cửa sớm.', 'A storm rolls in. The whole slope loses power. MÂY’s automatic machines freeze, and they close early.') },
      { who: 'yen', text: L('Mình còn cái ấm với phin. Pha tay được mà!', 'We’ve still got a kettle and a phin filter. We can brew by hand!'), mood: 'happy' },
      { who: 'none', text: L('Đèn cầy được thắp lên. Hàng xóm kéo qua, người mang ghế, người mang bánh căn.', 'Candles flicker on. Neighbors drift in, some with stools, some with plates of bánh căn.') },
      { who: 'kenny', if: 'kennyQuit', text: L('Anh nghỉ việc rồi nè! Giờ anh bán bánh mì đầu dốc. Hôm nay anh bao bánh mì cả quán!', 'I quit! Now I sell bánh mì at the top of the slope. Tonight, bánh mì’s on me!'), mood: 'happy' },
      { who: 'kenny', if: 'kennyRest', text: L('Anh nghỉ phép được ba ngày rồi, chưa bắt máy sếp lần nào. Tự hào quá!', 'Three days off and I haven’t answered the boss once. So proud of me!'), mood: 'happy' },
      { who: 'tu', text: L('Hồi trước dốc này cũng vậy đó con. Cúp điện là cả xóm ngồi chung một chỗ.', 'This slope used to be like this, dear. Power goes out, and the whole street gathers in one place.'), mood: 'love' },
      { who: 'tu', text: L('Tuần sau là chung kết rồi. Bà coi hết rồi, giờ chỉ còn coi con pha ly cuối thôi.', 'The finals are next week. I’ve seen enough. Now I just want to taste your final cup.') },
    ],
  },
  {
    id: 'c9', at: 27, finale: true, title: L('Chung kết · Hội Barista Phố Núi', 'Finals · Hill Town Barista Fest'), bg: 'stage', cast: ['tu', 'thang'],
    goal: '',
    lines: [
      { who: 'none', text: L('Sân khấu dựng giữa chợ Đà Lạt. Ban giám khảo: bà Tư, một nghệ nhân rang xay và… Linh Livestream.', 'A stage stands in the middle of Da Lat market. The judges: Mrs. Tư, a master roaster and… Linh Livestream.') },
      { who: 'thang', text: L('MÂY xin giới thiệu: Cloud Latte, bọt sữa in logo bằng laser, kèm NFT.', 'MÂY presents: the Cloud Latte. Laser-etched logo foam. Comes with an NFT.'), mood: 'happy' },
      { who: 'linh', text: L('Ủa NFT là cái gì dạ anh?', 'Wait, what’s an NFT?'), mood: 'neutral' },
      { who: 'none', text: L('Tới lượt Dreamers. {name} không nói gì nhiều, chỉ pha một ly cà phê sữa đá. Cáo ngồi nghiêm như giám khảo phụ.', 'Dreamers’ turn. {name} says very little, and simply makes one iced milk coffee. Cáo sits up straight like a junior judge.') },
      { who: 'tu', text: L('Bà đã quyết rồi.', 'I’ve made my decision.') },
    ],
  },
  // ================= PHẦN 2 (viết tiếp ở đây) =================
  // Chương mới chỉ cần thêm vào cuối mảng này, `at` > 27 (tính theo ngày từ lúc bắt đầu cốt truyện).
  // Người chơi đã xem chung kết sẽ gặp chương mới ngay khi tới ngày; người chơi mới đi lần lượt từ chương 1.
  // Mẫu:
  // {
  //   id: 'p2c1', arc: 2, at: 30, title: L('Phần 2 · Chương 1 · …', 'Part 2 · Chapter 1 · …'), bg: 'shop', cast: ['yen', 'cao'],
  //   goal: L('Mục tiêu hiện ở màn chuẩn bị', 'Goal shown on the prep screen'),
  //   lines: [
  //     { who: 'none', text: L('Lời kể…', 'Narration…') },
  //     { who: 'yen', text: L('{name} nói…', '…'), mood: 'happy' },
  //     { who: 'yen', text: L('Câu hỏi?', 'Question?'), choices: [
  //       { text: L('Lựa chọn A', 'Choice A'), set: 'coCoA', support: 3, reply: [{ who: 'none', text: L('…', '…') }] },
  //       { text: L('Lựa chọn B', 'Choice B'), set: 'coCoB', rep: 2 },
  //     ] },
  //   ],
  //   after: () => { /* thưởng tiền, mở khoá… khi xem xong */ },
  // },
]

// ---------- cái kết ----------
export function endingScore() { return Math.round(save.reputation + (save.story.flags.support ?? 0) * 2) }
export function endingKind(): 'great' | 'good' | 'retry' { const s = endingScore(); return s >= 95 ? 'great' : s >= 70 ? 'good' : 'retry' }
export function endingLines(): Line[] {
  const k = endingKind()
  const tail: Line[] = []
  if (flag('exposed')) tail.push({ who: 'linh', text: L('Cả nhà ơi, Linh xin lỗi vì quảng cáo bột 3 trong 1 nha. Linh về phe Dreamers!', 'Fam, I’m sorry for hyping 3-in-1 powder. Linh is Team Dreamers now!'), mood: 'sad' })
  if (flag('kind')) tail.push({ who: 'thang', text: L('Tài xế của anh kể hết rồi… ly phin đêm đó, và chuyện em không bóc phốt. Cảm ơn em.', 'My driver told me everything… that phin coffee, and how you kept quiet. Thank you.'), mood: 'sad' })
  if (k === 'great') return [...tail,
    { who: 'tu', text: L('Con dốc này không bán. Bà cho Dreamers thuê tiếp, năm năm, giá cũ.', 'This slope is not for sale. Dreamers keeps the lease. Five years, same rent.'), mood: 'love' },
    { who: 'thang', text: L('Ok… MÂY sẽ pivot. Bọn anh chuyển sang bán khoá học “Làm giàu từ cà phê”.', 'Fine… MÂY will pivot. We’re launching a course: “Get Rich With Coffee”.'), mood: 'grumpy' },
    { who: 'yen', text: L('Cáo ơi, mình giữ được quán rồi!', 'Cáo, we did it! We kept the café!'), mood: 'love' },
    { who: 'cao', text: L('GÂU!!! (Cáo chạy ba vòng quanh sân khấu.)', 'WOOF!!! (Cáo does three laps around the stage.)') },
  ]
  if (k === 'good') return [...tail,
    { who: 'tu', text: L('Bà cho con thuê tiếp. Nhưng MÂY cũng thuê được cái nhà đối diện. Cạnh tranh công bằng nha.', 'You keep the lease. But MÂY gets the place across the street. Fair competition, alright?'), mood: 'happy' },
    { who: 'thang', text: L('Hẹn em ở mùa sau. Lần này anh rang cà phê thật.', 'See you next season. This time I’m roasting real coffee.'), mood: 'grumpy' },
    { who: 'yen', text: L('Mời anh. Tụi em không sợ đâu!', 'Bring it on. We’re not scared!'), mood: 'happy' },
  ]
  return [...tail,
    { who: 'tu', text: L('Bà thương con, nhưng phố chưa đủ thương quán. Bà cho thêm một mùa nữa, cố lên nha.', 'I adore you, dear, but the street isn’t in love with the café yet. I’ll give you one more season. Chin up.'), mood: 'sad' },
    { who: 'yen', text: L('Dạ. Mùa sau con sẽ làm tốt hơn.', 'Okay. Next season, I’ll do better.'), mood: 'sad' },
    { who: 'cao', text: L('Gâu. (Cáo dụi đầu vào chân {name}.)', 'Woof. (Cáo nuzzles against {name}’s leg.)') },
  ]
}
export const ENDING_TITLE = {
  great: L('Kết đẹp: Con dốc của những người mơ mộng', 'Happy ending: The slope of dreamers'),
  good: L('Kết mở: Hai quán, một con dốc', 'Open ending: Two cafés, one slope'),
  retry: L('Chưa kết: Thêm một mùa nữa', 'To be continued: One more season'),
}

// ---------- tiến trình ----------
/** ngày (của game) mà chương diễn ra */
export const chapterDay = (ch: Chapter) => save.story.start + ch.at
export const pendingChapter = computed(() => {
  if (!save.introSeen || ui.phase !== 'prep' || ui.report) return null
  return CHAPTERS.find((ch) => !save.story.seen.includes(ch.id) && save.day >= chapterDay(ch)) ?? null
})
const FINALE = CHAPTERS.find((c) => c.finale)!
export const finaleDay = computed(() => chapterDay(FINALE))
export const storyDone = computed(() => save.story.seen.includes(FINALE.id))
/** chương gần nhất đã xem (để hiện mục tiêu) */
export const currentChapter = computed(() => [...CHAPTERS].reverse().find((ch) => save.story.seen.includes(ch.id)) ?? null)

export function applyChoice(c: Choice) {
  if (c.set) save.story.flags[c.set] = 1
  if (c.support) addSupport(c.support)
  if (c.rep) save.reputation = Math.min(100, save.reputation + c.rep)
  if (c.money) save.money += c.money
  sfx(c.sassy ? 'coin' : 'tap')
}
export function finishChapter(ch: Chapter) {
  if (!save.story.seen.includes(ch.id)) save.story.seen.push(ch.id)
  ch.after?.()
  if (ch.id === FINALE.id) {
    save.story.ending = endingKind()
    const bonus = { great: 2_000_000, good: 1_000_000, retry: 300_000 }[save.story.ending]
    save.money += bonus
    toast(L(`Thưởng chung kết: ${bonus / 1000}K`, `Finals bonus: ${bonus / 1000}K`), 'good', 3500)
  }
  persist()
}
export const visibleLines = (lines: Line[]) => lines.filter((l) => !l.if || (l.if.startsWith('!') ? !flag(l.if.slice(1)) : flag(l.if)))

// hệ số khách theo cốt truyện: MÂY khai trương phát ly free 3 ngày, bài bóc phốt viral 3 ngày
export function storyMul() {
  const f = save.story.flags
  let m = 1
  if (f.mayOpen && save.day - f.mayOpen < 3) m *= f.locals ? 0.88 : 0.78
  const c6 = CHAPTERS.find((c) => c.id === 'c6')!
  if (f.exposed && save.story.seen.includes('c6') && save.day - chapterDay(c6) < 3) m *= 1.15
  if (save.story.ending === 'great') m *= 1.08
  return m
}

export function initStory() {
  const prevMul = hooks.customerMul
  hooks.customerMul = () => (prevMul?.() ?? 1) * storyMul()
  const prevStart = hooks.dayStart
  hooks.dayStart = () => {
    prevStart?.()
    const f = save.story.flags
    if (f.mayOpen && save.day - f.mayOpen < 3) setTimeout(() => toast(L('MÂY Coffee đang phát ly free bên kia dốc, khách vắng hơn', 'MÂY Coffee is giving away free drinks across the slope. Fewer guests today.'), 'bad', 3200), 900)
  }
  // nhắc hạn chung kết ở màn chuẩn bị
  watch(() => save.day, (d) => {
    const left = finaleDay.value - d
    if (!storyDone.value && left > 0 && left <= 3) setTimeout(() => toast(L(`Còn ${left} ngày tới chung kết Hội Barista!`, `${left} day${left === 1 ? '' : 's'} until the Barista Fest finals!`), 'heart', 3000), 800)
  })
}
