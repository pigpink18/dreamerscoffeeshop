// Cốt truyện chính "28 ngày giữ dốc": chuỗi MÂY Coffee muốn mua cả con dốc, bà Tư chủ nhà sẽ quyết định
// cho ai thuê tiếp vào ngày chung kết Hội Barista Phố Núi. Mỗi chương là 1 cảnh hội thoại hiện đầu ngày,
// lựa chọn trong cảnh để lại cờ (flags) ảnh hưởng lượng khách, danh tiếng, tiền và cái kết.
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
  /** hiệu ứng lên cơ chế khi xem xong */
  after?: () => void
}

// ---------- nhân vật ----------
const girl = (shirt: string): Look => ({ skin: '#f3c9a6', hair: '#1f1a1c', style: 'shoulder', shirt, acc: ['blush'] })
export const CAST: Record<Exclude<Speaker, 'none' | 'cao'>, { name: string; look: Look; pitch: number }> = {
  yen: { name: 'Yến', look: girl('#3f7a73'), pitch: 640 },
  tu: { name: 'Bà Tư chủ nhà', look: { skin: '#e2b089', hair: '#d9d4cb', style: 'bun', shirt: '#7a4f8a', acc: ['glasses'] }, pitch: 420 },
  thang: { name: 'Thắng “Nhân Rộng” · CEO MÂY Coffee', look: { skin: '#f0c8a0', hair: '#2a2220', style: 'slick', shirt: '#24242b', accent: '#f4f4f0', acc: ['shades', 'chain'] }, pitch: 330 },
  me: { name: 'Mẹ', look: { skin: '#efc39c', hair: '#3a2c28', style: 'bob', shirt: '#b8484a', acc: ['glasses', 'earring'] }, pitch: 520 },
  kenny: { name: 'Kenny Sang', look: REGULARS.find((r) => r.id === 'tuan')?.look ?? girl('#f4f4f0'), pitch: 380 },
  linh: { name: 'Linh Livestream', look: { skin: '#f6d2b5', hair: '#c9864f', style: 'long', shirt: '#ff8fb8', acc: ['hoops', 'lipstick'] }, pitch: 760 },
}
export const speakerName = (s: Speaker) => (s === 'cao' ? 'Cáo' : s === 'none' ? '' : s === 'yen' ? save.player || 'Yến' : CAST[s].name)

const flag = (k: string) => !!save.story.flags[k]
const addSupport = (n: number) => { save.story.flags.support = (save.story.flags.support ?? 0) + n }

// ---------- kịch bản ----------
export const CHAPTERS: Chapter[] = [
  {
    id: 'c1', at: 1, title: 'Chương 1 · Tờ hợp đồng 28 ngày', bg: 'shop', cast: ['yen', 'tu'],
    goal: 'Giữ khách vui để nâng danh tiếng. Ngày chung kết, bà Tư sẽ quyết định.',
    lines: [
      { who: 'tu', text: 'Con Yến, bà nói thẳng nha. Có một chuỗi cà phê trên thành phố muốn mua nguyên con dốc này.' },
      { who: 'yen', text: 'Dạ?! Nguyên con dốc luôn hả bà?', mood: 'sad' },
      { who: 'tu', text: 'Họ trả gấp ba tiền thuê. Mà bà già rồi, bà không ham tiền. Bà ham cái quán có hồn.' },
      { who: 'tu', text: 'Còn 28 ngày nữa là Hội Barista Phố Núi. Hôm đó bà sẽ coi phố này thương ai hơn, rồi bà quyết.' },
      { who: 'cao', text: 'Gâu! (Cáo đặt cái chân lên tờ hợp đồng như ký tên.)' },
      { who: 'yen', text: 'Dạ… vậy con xin bà 28 ngày.', choices: [
        { text: 'Con hứa quán sẽ là chỗ cả dốc thương nhất!', support: 3, reply: [{ who: 'tu', text: 'Được. Nói được thì làm được nha con.', mood: 'happy' }] },
        { text: 'Chuỗi đó gấp ba thì con… gấp bốn tình cảm!', sassy: true, support: 2, rep: 2, reply: [{ who: 'tu', text: 'Cha, cái miệng này bán cà phê là hợp rồi đó!', mood: 'happy' }] },
      ] },
    ],
  },
  {
    id: 'c2', at: 3, title: 'Chương 2 · CEO đi dép tổ ong', bg: 'shop', cast: ['yen', 'thang'],
    goal: 'MÂY Coffee đã để ý quán. Nâng cấp quán và giữ danh tiếng thật ổn.',
    lines: [
      { who: 'thang', text: 'Chào em. Anh là Thắng, founder kiêm CEO kiêm Chief Vibe Officer của MÂY Coffee.' },
      { who: 'thang', text: 'Anh không bán cà phê. Anh bán một hệ sinh thái trải nghiệm đa điểm chạm, có roadmap scale lên 300 chi nhánh.' },
      { who: 'yen', text: 'Dạ… vậy anh uống gì ạ?' },
      { who: 'thang', text: 'Anh uống… data. Mà thôi, cho anh ly bạc xỉu ít đường, ít đá, ít sữa, nhiều insight.' },
      { who: 'thang', text: 'Nói thẳng: anh mua lại quán em. Em làm store manager cho anh, KPI nhẹ thôi, 14 tiếng một ngày.', choices: [
        { text: 'Dạ cảm ơn anh, nhưng quán này không bán ạ.', support: 2, reply: [{ who: 'thang', text: 'Ok em. Nhưng thị trường không chờ ai đâu nha.', mood: 'grumpy' }] },
        { text: 'Hệ sinh thái của anh có cây thông nào không anh?', sassy: true, set: 'locals', support: 4, rep: 3, reply: [
          { who: 'thang', text: '…Em sẽ hối hận đó. MÂY sẽ khai trương ngay đối diện.', mood: 'angry' },
          { who: 'none', text: 'Mấy ông chú uống cà phê bàn bên cạnh vỗ tay rần rần. Chuyện lan khắp dốc trong một buổi sáng.' },
        ] },
      ] },
    ],
  },
  {
    id: 'c3', at: 6, title: 'Chương 3 · Cuộc gọi lúc 9 giờ tối', bg: 'night', cast: ['yen', 'me'],
    goal: 'Mẹ đang lo. Cố có một tuần lời đẹp cho mẹ yên tâm.',
    lines: [
      { who: 'me', text: 'Alo, con gái. Mẹ coi Facebook thấy con đứng bán cà phê, tay đen thui hà.', mood: 'sad' },
      { who: 'me', text: 'Cô Hạnh nói ngân hàng của cô đang tuyển. Con về Hà Nội đi, có lương tháng, có bảo hiểm.' },
      { who: 'yen', text: 'Mẹ ơi…', mood: 'sad' },
      { who: 'cao', text: 'Ẳng! (Cáo chen mặt vào camera.)' },
      { who: 'me', text: 'Ủa con gì mập vậy? Con nuôi chó mà không nói mẹ hả?!', mood: 'angry' },
      { who: 'yen', text: 'Dạ… đây là Cáo, đồng sáng lập của con.', choices: [
        { text: 'Mẹ lên Đà Lạt chơi với con đi, rồi mẹ coi quán.', set: 'momVisit', support: 2, reply: [{ who: 'me', text: 'Để mẹ coi vé xe… Nhưng mẹ lên là mẹ kiểm tra sổ sách đó nha!', mood: 'happy' }] },
        { text: 'Con ổn mà mẹ, mẹ đừng lo.', reply: [{ who: 'me', text: 'Ừ… con nhớ ăn uống đàng hoàng. Mẹ gửi đồ lên cho.', mood: 'sad' }] },
      ] },
    ],
  },
  {
    id: 'c4', at: 9, title: 'Chương 4 · Kenny muốn nghỉ việc', bg: 'rain', cast: ['yen', 'kenny'],
    goal: 'Những người khách quen là chỗ dựa của quán. Tám chuyện nhiều với họ.',
    lines: [
      { who: 'kenny', text: 'Em ơi, ly đen đá như cũ… À không, hôm nay anh không đi làm. Anh xin nghỉ ốm.', mood: 'sad' },
      { who: 'kenny', text: 'Ốm thiệt nha, ốm tâm hồn. Sáng nay anh mở Outlook ra là tim đập 140.' },
      { who: 'kenny', text: 'Em bỏ việc văn phòng lên đây mở quán, em có sợ không?', choices: [
        { text: 'Sợ chứ anh. Nhưng sợ cả đời còn sợ hơn.', set: 'kennyQuit', support: 2, reply: [{ who: 'kenny', text: '…Câu này anh in ra dán lên màn hình máy tính luôn.', mood: 'happy' }] },
        { text: 'Anh thử nghỉ phép một tuần trước đã.', set: 'kennyRest', support: 1, reply: [{ who: 'kenny', text: 'Ừ ha. Nghỉ phép thì sếp vẫn gọi, nhưng anh sẽ… không bắt máy!', mood: 'happy' }] },
        { text: 'Anh mà nghỉ thì ai trả tiền cà phê cho em?', sassy: true, support: 1, rep: 1, reply: [{ who: 'kenny', text: 'Haha, thực tế ghê. Thôi anh cày thêm mùa KPI này vì em đó.', mood: 'happy' }] },
      ] },
    ],
  },
  {
    id: 'c5', at: 13, title: 'Chương 5 · MÂY khai trương đối diện', bg: 'shop', cast: ['linh', 'thang'],
    goal: 'MÂY phát ly miễn phí 3 ngày, khách sẽ vắng hơn. Pha thật chuẩn để giữ khách.',
    after: () => { save.story.flags.mayOpen = save.day },
    lines: [
      { who: 'none', text: 'Sáng nay, bên kia dốc dựng cổng bong bóng, loa kéo mở nhạc EDM. MÂY Coffee khai trương.' },
      { who: 'linh', text: 'Hello cả nhà iu! Linh Livestream đây! Hôm nay MÂY tặng ly đầu tiên FREE nha! Thả tim đi mọi người!', mood: 'love' },
      { who: 'thang', text: 'Cà phê của MÂY được tối ưu bằng AI. Hạt cà phê được chọn bởi thuật toán.', mood: 'happy' },
      { who: 'linh', text: 'Ủa anh, vậy cà phê này rang ở đâu dạ?' },
      { who: 'thang', text: 'Ở… trên cloud em.', mood: 'grumpy' },
      { who: 'none', text: 'Khách xếp hàng dài bên kia đường. Cáo nằm dài trước cửa quán, buồn so.' },
      { who: 'none', if: 'locals', text: 'Nhưng mấy ông chú hôm trước vẫn ghé Dreamers: “Ly free bên kia không có cây thông.”' },
    ],
  },
  {
    id: 'c6', at: 16, title: 'Chương 6 · Cáo đánh hơi bí mật', bg: 'night', cast: ['yen', 'cao'],
    goal: 'Lựa chọn của bạn đang lan trên mạng. Giữ danh tiếng thật vững.',
    lines: [
      { who: 'none', text: 'Đêm. Cáo biến mất. Yến đi tìm, thấy bé đang bới thùng rác sau quán MÂY.' },
      { who: 'cao', text: 'Gâu gâu! (Cáo tha về một cái bao to: “BỘT HƯƠNG CÀ PHÊ – 3 TRONG 1 – 25KG”.)' },
      { who: 'yen', text: 'Trời đất… “Cà phê chọn bởi thuật toán” là cái này hả?', mood: 'angry' },
      { who: 'yen', text: 'Mình làm gì với cái bao này đây Cáo?', choices: [
        { text: 'Chụp hình đăng lên group Đà Lạt Review.', sassy: true, set: 'exposed', support: 3, rep: 4, reply: [
          { who: 'none', text: 'Bài đăng đạt 12 nghìn lượt chia sẻ sau một đêm. Comment top: “Cloud gì mà cloud 3 trong 1”.' },
        ] },
        { text: 'Mang trả lại. Mình thắng bằng ly cà phê của mình thôi.', set: 'kind', support: 5, reply: [
          { who: 'none', text: 'Yến để cái bao trước cửa MÂY, kèm mẩu giấy: “Rơi đồ nè anh. – Dreamers”.' },
          { who: 'cao', text: 'Gâu. (Cáo có vẻ không đồng ý lắm.)' },
        ] },
      ] },
    ],
  },
  {
    id: 'c7', at: 19, title: 'Chương 7 · Mẹ lên Đà Lạt', bg: 'shop', cast: ['yen', 'me'],
    goal: 'Gần tới chung kết rồi. Đông khách, pha chuẩn, đừng để ai bỏ về.',
    lines: [
      { who: 'me', if: 'momVisit', text: 'Trời đất, lạnh quá con ơi! Ủa quán con… dễ thương vậy hả?', mood: 'happy' },
      { who: 'me', if: 'momVisit', text: 'Mẹ ngồi đây từ sáng, đếm được 40 khách, có ông Tây còn khen “very good” nữa!', mood: 'love' },
      { who: 'me', if: 'momVisit', text: 'Thôi, mẹ không nói chuyện ngân hàng nữa. Cầm chút tiền nè, mua cái máy xay cho đàng hoàng.', mood: 'happy' },
      { who: 'none', if: '!momVisit', text: 'Một thùng hàng từ Hà Nội gửi lên: ô mai, trà, một cái khăn len và mẩu giấy viết tay.' },
      { who: 'me', if: '!momVisit', text: '“Mẹ coi clip con trên mạng rồi. Mẹ không hiểu hết, nhưng thấy con cười nhiều. Vậy là được.”', mood: 'love' },
      { who: 'yen', text: '…Mẹ ơi.', mood: 'love' },
      { who: 'cao', text: 'Gâu! (Cáo ăn mất nửa gói ô mai.)' },
    ],
    after: () => {
      const m = flag('momVisit') ? 500_000 : 200_000
      save.money += m
      toast(`Mẹ cho ${m / 1000}K. Thương mẹ!`, 'heart', 3200)
    },
  },
  {
    id: 'c8', at: 23, title: 'Chương 8 · Đêm cúp điện', bg: 'rain', cast: ['yen', 'tu'],
    goal: 'Chặng cuối! Danh tiếng cao + lòng phố = cái kết đẹp.',
    lines: [
      { who: 'none', text: 'Bão về. Cả dốc cúp điện. Bên MÂY máy pha tự động đứng hình, đóng cửa sớm.' },
      { who: 'yen', text: 'Mình còn cái ấm với phin. Pha tay được mà!', mood: 'happy' },
      { who: 'none', text: 'Đèn cầy được thắp lên. Hàng xóm kéo qua, người mang ghế, người mang bánh căn.' },
      { who: 'kenny', if: 'kennyQuit', text: 'Anh nghỉ việc rồi nè! Giờ anh bán bánh mì đầu dốc. Hôm nay anh bao bánh mì cả quán!', mood: 'happy' },
      { who: 'kenny', if: 'kennyRest', text: 'Anh nghỉ phép được ba ngày rồi, chưa bắt máy sếp lần nào. Tự hào quá!', mood: 'happy' },
      { who: 'tu', text: 'Hồi trước dốc này cũng vậy đó con. Cúp điện là cả xóm ngồi chung một chỗ.', mood: 'love' },
      { who: 'tu', text: 'Tuần sau là chung kết rồi. Bà coi hết rồi, giờ chỉ còn coi con pha ly cuối thôi.' },
    ],
  },
  {
    id: 'c9', at: 27, title: 'Chung kết · Hội Barista Phố Núi', bg: 'stage', cast: ['tu', 'thang'],
    goal: '',
    lines: [
      { who: 'none', text: 'Sân khấu dựng giữa chợ Đà Lạt. Ban giám khảo: bà Tư, một nghệ nhân rang xay và… Linh Livestream.' },
      { who: 'thang', text: 'MÂY xin giới thiệu: Cloud Latte, bọt sữa in logo bằng laser, kèm NFT.', mood: 'happy' },
      { who: 'linh', text: 'Ủa NFT là cái gì dạ anh?', mood: 'neutral' },
      { who: 'none', text: 'Tới lượt Dreamers. Yến không nói gì nhiều, chỉ pha một ly cà phê sữa đá. Cáo ngồi nghiêm như giám khảo phụ.' },
      { who: 'tu', text: 'Bà đã quyết rồi.' },
    ],
  },
]

// ---------- cái kết ----------
export function endingScore() { return Math.round(save.reputation + (save.story.flags.support ?? 0) * 2) }
export function endingKind(): 'great' | 'good' | 'retry' { const s = endingScore(); return s >= 95 ? 'great' : s >= 70 ? 'good' : 'retry' }
export function endingLines(): Line[] {
  const k = endingKind()
  const tail: Line[] = []
  if (flag('exposed')) tail.push({ who: 'linh', text: 'Cả nhà ơi, Linh xin lỗi vì quảng cáo bột 3 trong 1 nha. Linh về phe Dreamers!', mood: 'sad' })
  if (flag('kind')) tail.push({ who: 'thang', text: 'Cái bao bột hôm trước… cảm ơn em. Không ai từng trả đồ cho anh.', mood: 'sad' })
  if (k === 'great') return [...tail,
    { who: 'tu', text: 'Con dốc này không bán. Bà cho Dreamers thuê tiếp, năm năm, giá cũ.', mood: 'love' },
    { who: 'thang', text: 'Ok… MÂY sẽ pivot. Bọn anh chuyển sang bán khoá học “Làm giàu từ cà phê”.', mood: 'grumpy' },
    { who: 'yen', text: 'Cáo ơi, mình giữ được quán rồi!', mood: 'love' },
    { who: 'cao', text: 'GÂU!!! (Cáo chạy ba vòng quanh sân khấu.)' },
  ]
  if (k === 'good') return [...tail,
    { who: 'tu', text: 'Bà cho con thuê tiếp. Nhưng MÂY cũng thuê được cái nhà đối diện. Cạnh tranh công bằng nha.', mood: 'happy' },
    { who: 'thang', text: 'Hẹn em ở mùa sau. Lần này anh rang cà phê thật.', mood: 'grumpy' },
    { who: 'yen', text: 'Mời anh. Tụi em không sợ đâu!', mood: 'happy' },
  ]
  return [...tail,
    { who: 'tu', text: 'Bà thương con, nhưng phố chưa đủ thương quán. Bà cho thêm một mùa nữa, cố lên nha.', mood: 'sad' },
    { who: 'yen', text: 'Dạ. Mùa sau con sẽ làm tốt hơn.', mood: 'sad' },
    { who: 'cao', text: 'Gâu. (Cáo dụi đầu vào chân Yến.)' },
  ]
}
export const ENDING_TITLE = { great: 'Kết đẹp: Con dốc của những người mơ mộng', good: 'Kết mở: Hai quán, một con dốc', retry: 'Chưa kết: Thêm một mùa nữa' }

// ---------- tiến trình ----------
/** ngày (của game) mà chương diễn ra */
export const chapterDay = (ch: Chapter) => save.story.start + ch.at
export const pendingChapter = computed(() => {
  if (!save.introSeen || ui.phase !== 'prep' || ui.report) return null
  return CHAPTERS.find((ch) => !save.story.seen.includes(ch.id) && save.day >= chapterDay(ch)) ?? null
})
export const finaleDay = computed(() => chapterDay(CHAPTERS[CHAPTERS.length - 1]))
export const storyDone = computed(() => save.story.seen.includes(CHAPTERS[CHAPTERS.length - 1].id))
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
  if (ch.id === CHAPTERS[CHAPTERS.length - 1].id) {
    save.story.ending = endingKind()
    const bonus = { great: 2_000_000, good: 1_000_000, retry: 300_000 }[save.story.ending]
    save.money += bonus
    toast(`Thưởng chung kết: ${bonus / 1000}K`, 'good', 3500)
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
    if (f.mayOpen && save.day - f.mayOpen < 3) setTimeout(() => toast('MÂY Coffee đang phát ly free bên kia dốc, khách vắng hơn', 'bad', 3200), 900)
  }
  // nhắc hạn chung kết ở màn chuẩn bị
  watch(() => save.day, (d) => {
    const left = finaleDay.value - d
    if (!storyDone.value && left > 0 && left <= 3) setTimeout(() => toast(`Còn ${left} ngày tới chung kết Hội Barista!`, 'heart', 3000), 800)
  })
}
