// Khách du lịch khắp nơi ghé Dreamers Coffee: Hàn, Trung, Anh, Pháp, Ý, Đức, Nga, khách Việt đi săn mây,
// dân văn phòng "nghỉ dưỡng" vẫn chạy deadline, và hội khách cá tính trên phố.
// Mỗi nhóm có tên nam/nữ riêng (ngoại hình khớp giới tính), cách xưng hô, câu gọi món, câu hối, review và chuyện tám.
// Xưng hô dùng mã {t} {b} {k} {y} {nữ|nam} – xem voice.ts. Chuyện tám: ngọt ngào · xéo sắc · cụt lủn.
import type { Look, HairStyle, Acc, ChatTopic } from './data'
import { xung, type Gender, type Persona } from './voice'

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
    id: 'han', headline: 'Đoàn khách Hàn Quốc', label: 'Hàn Quốc', foreign: true, weight: 1, patience: 1,
    blurb: 'Đoàn du lịch Hàn Quốc vừa tới Đà Lạt, tay ai cũng cầm gậy selfie và lọ kem chống nắng',
    f: ['Kim Bắp Cải', 'Choi Kim Chi', 'Han Mặt Nạ', 'Yoon Mì Cay'],
    m: ['Park Bánh Gạo', 'Jung Soju', 'Kang Tok-bốc-ki', 'Oppa Gió Lạnh'],
    persona: (g) => xung.em(g),
    pool: { skins: ASIAN_SKIN, hairs: [...DARK_HAIR, '#8a6a5a', '#c9b8a8', '#ff9aa8'], fs: ['bob', 'shoulder', 'long', 'bun'], ms: ['short', 'messy', 'slick'], shirts: ['#f4f4f0', '#ff9aa8', '#b8d8f0', '#e8d8f0', '#2b2b2b'], acc: [['blush', 0.7], ['glasses', 0.2]] },
    greet: [
      'Annyeong! Cho {t} một ly {drink}, ít đá như phim Hàn: ngoài lạnh lùng, trong ấm áp nha!',
      'Xin chào! {drink} một ly. Ở Seoul ly này bằng nửa ngày lương, ở đây rẻ quá {t} xỉu!',
      '{B} chủ ơi, {drink} một ly. {T} quay video được không? {T} làm vlog “Đà Lạt có gì vui”',
      'Một {drink} nha. Pha đẹp đẹp, {t} chụp 37 tấm rồi mới uống',
      'Daebak! Quán xinh như phim trường. Cho {t} {drink}, {t} đứng góc 45 độ chờ',
      '{drink} một ly, ít đường. Tối nay {t} skincare 10 bước, không được tăng cân',
    ],
    impatient: [
      'Chờ lâu như đợi tập cuối phim 16 tập',
      'Aigoo, {t} đợi tới mức máy quay hết pin luôn',
      'Ở Seoul gọi đồ ăn 15 phút tới, ở đây 15 phút chưa có ly nước',
      'Nhanh nhanh nha {b}, hướng dẫn viên đếm người rồi kìa',
    ],
    good: [
      'Ngon hơn cà phê ở Gangnam mà rẻ hơn 4 lần. Daebak!',
      'Ngọt như cảnh nam chính cầm ô cho nữ chính. 5 sao!',
      'Quán đẹp, nước ngon, {t} chụp 200 tấm, đăng 1 tấm',
      'Uống xong {t} hiểu vì sao người Việt một ngày 3 ly cà phê',
      'Ngon tới mức {t} muốn huỷ vé máy bay về',
    ],
    meh: [
      'Ngon mà hơi lâu, xe du lịch suýt bỏ {t} lại',
      'Tạm ổn. Chưa đủ làm cảnh quay chính, làm cảnh phụ được',
      'Đá tan nhanh hơn tình cảm nam phụ',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'trung', headline: 'Đoàn khách Trung Quốc', label: 'Trung Quốc', foreign: true, weight: 1, patience: 1,
    blurb: 'Đoàn khách Trung Quốc đang livestream Đà Lạt, mỗi người cầm 2 điện thoại',
    f: ['Vương Trà Sữa', 'Lý Livestream', 'Chu Douyin', 'Tô Quét Mã'],
    m: ['Trương Đậu Hũ', 'Lưu Bánh Bao', 'Hà Mì Xào', 'Lâm Lẩu Cay'],
    persona: (g) => xung.em(g),
    pool: { skins: ASIAN_SKIN, hairs: [...DARK_HAIR, '#5a3a28'], fs: ['bob', 'long', 'bun', 'shoulder'], ms: ['short', 'slick', 'cap'], shirts: ['#d9534f', '#f2c14e', '#2b2b2b', '#f4f4f0', '#5b8bd9'], acc: [['glasses', 0.3], ['blush', 0.3]] },
    greet: [
      'Nǐ hǎo! Một ly {drink}, {t} đang livestream, {b} cười tươi lên nha, 3 vạn người đang xem',
      'Cho một {drink}. Quét mã được không {b}? Ví điện tử nào {t} cũng có, chỉ không có tiền mặt',
      '{drink} một ly! Quay chậm lúc rót nha, video này lên xu hướng là quán nổi tiếng luôn',
      'Ở quê {t} gọi cà phê này là “nước đen thần thánh”. Cho {t} một {drink}!',
      'Một {drink}, size lớn nhất. Người nhà dặn {t} mua làm quà thêm 20 gói nữa',
      '{B} ơi, {drink}! Quán này 10 vạn lượt thích trên mạng, đúng chỗ này không?',
    ],
    impatient: [
      '{B} ơi nhanh lên, người xem livestream đang giảm kìa',
      'Chờ lâu quá, bình luận toàn hỏi “ly nước đâu”',
      'Bên {t} giao đồ ăn bằng drone, ở đây ly nước còn đi bộ hả?',
      'Hướng dẫn viên giơ cờ rồi, {t} phải đi đây',
    ],
    good: [
      'Ngon! Livestream bán giúp quán 300 gói cà phê luôn rồi',
      'Vị đậm, quán đẹp, chủ quán lên hình xinh. 5 sao, đã ghim quán',
      'Uống xong tỉnh tới mức {t} live thêm 4 tiếng nữa',
      'Ngon như lời đồn trên mạng. Lần đầu mạng nói thật',
    ],
    meh: [
      'Ngon mà chậm, người xem live thoát hết rồi',
      'Tạm được, ly hơi nhỏ, không đủ lên hình',
      'Nước ổn, wifi yếu, live bị đứng 3 lần',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'anh', headline: 'Khách Anh đi phượt', label: 'Anh', foreign: true, weight: 1, patience: 1.3,
    blurb: 'Khách Anh đi phượt Đà Lạt, xếp hàng ngay ngắn và nói “sorry” liên tục',
    f: ['Emma Ếch Chiên', 'Charlotte Chè Bưởi', 'Lily Lá Trà', 'Sophie Sương Mù'],
    m: ['Oliver Ô Mai', 'George Gừng', 'Harry Hột Vịt', 'William Wifi'],
    persona: (g) => xung.toi(g),
    pool: { skins: EURO_SKIN, hairs: ['#d9a441', '#c96a2b', '#6b4026', '#e8d08a', '#3a2a20'], fs: ['shoulder', 'long', 'bob', 'bun'], ms: ['short', 'messy', 'cap'], shirts: ['#2e3f6e', '#8e1b2c', '#4a6a4a', '#c9b89c', '#f4f4f0'], acc: [['glasses', 0.25], ['beard', 0.15], ['scarf', 0.3]] },
    greet: [
      'Sorry, xin lỗi, cho tôi một {drink} được không? Không vội đâu, cứ từ từ, sorry nha',
      'Lovely! Một {drink} please. Mưa phùn ở đây làm tôi nhớ nhà ghê',
      'Một {drink}. À mà quán có trà không? Không có hả… thôi, tôi sẽ mạnh mẽ',
      'Cheers! {drink} một ly. Thời tiết hôm nay cũng tạm, nói chuyện thời tiết là truyền thống nước tôi',
      'Tôi xếp hàng đúng chỗ chưa? Sorry. Một {drink}, cảm ơn, sorry lần nữa',
      'Ở London 1 ly cà phê bằng ở đây 5 ly. {drink} nha, tôi uống cho đủ vốn',
    ],
    impatient: [
      'Không sao đâu, tôi chỉ… đứng đây hơi lâu thôi. Không sao. Thật đấy',
      'Sorry, không phải tôi hối, nhưng tôi đã nghĩ xong 3 chủ đề thời tiết rồi',
      'Người Anh sinh ra để xếp hàng. Nhưng mà…',
      'Đứng lâu tới mức tôi định xin lỗi cái cột luôn',
    ],
    good: [
      'Lovely! Ngon hơn cà phê ở ga tàu London 10 lần. Đừng nói với ai nhé',
      'Ngon xuất sắc. Tôi sẽ viết thư tay khen quán',
      'Brilliant! Đây là ly cà phê đầu tiên khiến tôi quên trà',
      'Tôi định khen nhẹ thôi, nhưng không nhịn được: 5 sao',
    ],
    meh: [
      'Cũng được. Theo chuẩn người Anh thì “cũng được” là khen lắm rồi',
      'Not bad. Hơi lâu, nhưng tôi sẽ không phàn nàn trực tiếp đâu',
      'Tạm. Tôi sẽ chỉ hơi buồn một chút, rất lịch sự',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'phap', headline: 'Khách Pháp tìm “Paris nhỏ”', label: 'Pháp', foreign: true, weight: 1, patience: 1,
    blurb: 'Khách Pháp về thăm “Paris nhỏ”, ai cũng mang theo một cuốn sách và rất nhiều ý kiến',
    f: ['Amélie Bánh Mì', 'Sophie Súp Cua', 'Chloé Chè Chuối', 'Camille Cà Rốt'],
    m: ['Pierre Pa-tê', 'Jean Jambon', 'Louis Lẩu Gà', 'Antoine Ăn Vặt'],
    persona: (g) => xung.toi(g),
    pool: { skins: EURO_SKIN, hairs: ['#3a2a20', '#6b4026', '#1d1612', '#a0522d'], fs: ['beret', 'shoulder', 'long', 'bob'], ms: ['beret', 'messy', 'short'], shirts: ['#2e3f6e', '#f4f4f0', '#d9534f', '#2b2b2b'], acc: [['scarf', 0.4], ['mustache', 0.25], ['lipstick', 0.3]] },
    greet: [
      'Bonjour! Một {drink}. Người ta nói Đà Lạt là Paris nhỏ, tôi tới kiểm tra',
      'Bonjour madame. {drink} một ly. Tôi sẽ uống thật chậm và suy nghĩ về cuộc đời',
      'Một {drink}, s’il vous plaît. Ở Paris hôm nay đình công, may mà tôi đang ở đây',
      'Bánh mì Việt Nam ngon hơn bánh mì Pháp, đừng kể ai. Cho tôi {drink}',
      'Ồ là la! Quán xinh. Một {drink}, tôi ngồi viết tiểu thuyết 3 tiếng nha',
      '{drink}. Tôi sẽ chấm thật lòng, người Pháp không biết khen giả',
    ],
    impatient: [
      'Chờ đợi cũng là một nghệ thuật… nhưng tôi không phải nghệ sĩ',
      'Lâu quá, tôi định đình công phản đối luôn đây',
      'Ồ là la… ly của tôi đi nghỉ phép 5 tuần hả?',
      'Tôi đọc xong 2 chương sách rồi. Ly nước vẫn chưa tới. C’est la vie',
    ],
    good: [
      'Magnifique! Lần đầu tôi khen mà không có chữ “nhưng”',
      'Ngon. Ngon thật. Tôi sẽ ngừng chê cà phê Việt từ hôm nay',
      'Đậm như triết học, ngọt như tình yêu. 5 sao, ký tên một người Pháp khó tính',
      'Bánh mì Việt đã thắng bánh mì Pháp, giờ cà phê cũng thắng. Tôi về nước sao đây',
    ],
    meh: [
      'Được. Nhưng mà… à thôi, người Pháp lúc nào cũng có chữ “nhưng”',
      'Không tệ. Thiếu một chút tâm hồn, và một chút bơ',
      'Tôi chấm 3 sao. Ở Pháp, 3 sao là nhà hàng hạng sang đó',
    ],
    chats: [
      t('Vì sao cà phê Việt lại có sữa đặc? Ở Pháp không ai làm vậy',
        ['Ngày xưa hiếm sữa tươi, ông bà sáng tạo ra đó', 'Ồ, sáng tạo từ khó khăn, rất thơ'],
        ['Người Pháp mang cà phê tới, người Việt làm nó ngon hơn', 'Ồ là la… đau, nhưng tôi không cãi được', 9],
        ['Thì vậy', 'Câu trả lời rất… thiếu triết học']),
      t('Tôi đang viết tiểu thuyết về Đà Lạt. {B} có câu chuyện nào không?',
        ['Có, chuyện cô gái bỏ phố về núi mở quán với một bé corgi', 'Quá đẹp! Đây sẽ là chương 1'],
        ['Chuyện chủ quán bị khách ngồi 3 tiếng mà gọi 1 ly', 'Ơ… nhân vật đó có phải tôi không', 7],
        ['Không', 'Vậy tôi viết về sự im lặng của {b}']),
      t('Ở Việt Nam có đình công không? Ở Pháp tuần nào cũng có',
        ['Không đình công, chỉ có kẹt xe là đều đặn', 'Kẹt xe là cuộc đình công của đường phố'],
        ['Có, con corgi của quán đình công đòi pate mỗi chiều', 'Haha tôi ủng hộ cuộc đình công này', 8],
        ['Không', 'Thật đáng tiếc']),
    ],
  }),
  group({
    id: 'y', headline: 'Đoàn khách Ý', label: 'Ý', foreign: true, weight: 1, patience: 0.95,
    blurb: 'Khách Ý ghé Đà Lạt, chuẩn bị tinh thần nghe phản biện về espresso',
    f: ['Giulia Gelato', 'Francesca Phô Mai', 'Sofia Sầu Riêng', 'Chiara Chả Giò'],
    m: ['Marco Mì Ý', 'Luca Lạp Xưởng', 'Giovanni Giò Lụa', 'Matteo Măng Cụt'],
    persona: (g) => xung.toi(g),
    pool: { skins: ['#f0c8a2', '#e9bf97', '#f3c9a6', '#d9a679'], hairs: DARK_HAIR, fs: ['long', 'shoulder', 'bun'], ms: ['slick', 'short', 'messy'], shirts: ['#f4f4f0', '#2b2b2b', '#6aa84f', '#d9534f', '#2e3f6e'], acc: [['shades', 0.35], ['chain', 0.2], ['beard', 0.25], ['hoops', 0.3]] },
    greet: [
      'Ciao bella! Một {drink}. Nhưng cho tôi hỏi… có đá thật hả? Mamma mia',
      'Một {drink}. Ở Ý, cà phê sữa sau 11 giờ sáng là tội ác. Nhưng tôi đang đi du lịch, tha cho mình',
      'Cà phê với sữa đặc? Nghe như phạm luật nhưng tôi muốn thử. {drink} nha!',
      'Ciao! Tôi đi kiểm tra cà phê thế giới. Hôm nay là {drink}, mong là không phải khóc',
      'Một {drink}, pha bằng tình yêu nha. Người Ý cảm nhận được tình yêu trong từng giọt',
      '{drink}! Tay tôi đang múa vì háo hức, không phải vì giận đâu',
    ],
    impatient: [
      'Mamma mia, chờ lâu tới mức mì Ý của tôi chín 3 lần rồi',
      'Espresso ở Ý pha 25 giây. Ở đây… tôi đếm tới 250 rồi',
      'Tôi đang múa tay hơi nhiều, nghĩa là tôi hơi đói và hơi giận',
      'Ly cà phê này đi tàu từ Rome tới hả?',
    ],
    good: [
      'Mamma mia! Ngon như bà ngoại tôi pha, mà bà tôi không biết dùng sữa đặc',
      'Perfetto! Tôi chụm 5 đầu ngón tay hôn gió cái ly này',
      'Tôi sẽ báo cả dòng họ: người Việt pha cà phê đỉnh. Dòng họ tôi 80 người',
      'Ngon tới mức tôi tha thứ cho cục đá trong ly',
    ],
    meh: [
      'Được, nhưng ở quê tôi người ta sẽ cãi nhau 2 tiếng về ly này',
      'Không tệ. Nhưng ai cho đá vào cà phê vậy? Tôi cần ngồi xuống bình tĩnh',
      'Tạm. Thêm chút đam mê nữa là thành tác phẩm',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'duc', headline: 'Đoàn khách Đức', label: 'Đức', foreign: true, weight: 1, patience: 0.85,
    blurb: 'Khách Đức tới Đà Lạt theo lịch trình chia tới từng phút',
    f: ['Greta Gỏi Cuốn', 'Heidi Hột Vịt', 'Anna Ăn Đúng Giờ'],
    m: ['Hans Hủ Tiếu', 'Klaus Khoai Tây', 'Lukas Lạc Rang', 'Jonas Giò Heo', 'Felix Phở Khô'],
    persona: (g) => xung.toi(g),
    pool: { skins: EURO_SKIN, hairs: ['#e8d08a', '#d9a441', '#c9b8a8', '#6b4026'], fs: ['bob', 'shoulder', 'bun'], ms: ['short', 'short', 'combover'], shirts: ['#4a4f57', '#2e3f6e', '#6aa84f', '#f4f4f0'], acc: [['glasses', 0.5], ['beard', 0.15], ['collar', 0.3]] },
    greet: [
      'Guten Tag. Một {drink}. Theo lịch trình tôi có 4 phút 30 giây cho ly này',
      'Một {drink}. Cho tôi biết chính xác bao nhiêu gam đường, tôi ghi vào Excel',
      'Guten Tag! {drink} một ly. Quán mở cửa đúng giờ, tôi đánh giá cao',
      'Tôi đã nghiên cứu menu từ hôm qua. Lựa chọn tối ưu là {drink}',
      'Một {drink}. Đường không quá 12%, đá không quá 40%. Danke',
      '{drink}. Tôi trả tiền chính xác tới từng đồng, không cần thối',
    ],
    impatient: [
      'Đã quá 4 phút 30 giây. Lịch trình của tôi đang bị lệch',
      'Theo tính toán, ly của tôi trễ 87 giây. Tôi đang ghi chú',
      'Ở Đức tàu trễ là lên báo. Ly này trễ là lên Excel của tôi',
      'Xin lỗi, có quy trình nào để tôi hỏi tiến độ không?',
    ],
    good: [
      'Sehr gut! Hiệu suất tốt, vị đậm, tỉ lệ đá chuẩn. Đã nhập bảng tính: 5/5',
      'Ngon. Tôi đã lên lịch quay lại ngày mai lúc 8 giờ 15',
      'Đúng giờ, đúng vị, đúng công thức. Tôi hơi xúc động, nhưng chỉ 3 giây',
      'Ngon hơn máy pha ở văn phòng tôi, cái máy đó đắt bằng chiếc xe',
    ],
    meh: [
      'Được. Trễ 2 phút, trừ 1 sao theo quy định',
      'Vị ổn. Quy trình cần tối ưu. Tôi gửi file góp ý 14 trang nhé',
      'Tạm chấp nhận. Đá tan 23%, cao hơn tiêu chuẩn',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'nga', headline: 'Khách Nga trốn đông', label: 'Nga', foreign: true, weight: 1, patience: 1.15,
    blurb: 'Khách Nga “trốn đông” ở Đà Lạt, mặc áo cộc tay giữa trời 15 độ',
    f: ['Natasha Nước Mía', 'Olga Ốc Luộc', 'Anya Áo Phao', 'Katya Kẹo Dừa'],
    m: ['Ivan Ít Đường', 'Dmitri Dưa Leo', 'Sergei Sữa Đậu', 'Boris Bánh Căn'],
    persona: (g) => xung.toi(g),
    pool: { skins: ['#fbe3d0', '#f8dcc4', '#f6d3b3'], hairs: ['#e8d08a', '#d9c8a8', '#a0522d', '#6b4026'], fs: ['long', 'shoulder', 'bun'], ms: ['short', 'messy'], shirts: ['#f4f4f0', '#5b8bd9', '#d9534f', '#2b2b2b'], acc: [['beard', 0.3], ['scarf', 0.15]] },
    greet: [
      'Privet! Một {drink}, nhiều đá. Mùa hè Đà Lạt 15 độ, nóng quá',
      'Đà Lạt lạnh hả? Nhà tôi đang âm 30, ở đây là mùa hè. Cho tôi {drink}!',
      'Một {drink}. Mặt tôi nghiêm nhưng tôi đang rất vui, mặt tôi chỉ có 1 biểu cảm',
      'Privet! {drink}. Tôi mặc áo cộc tay giữa sương mù, người ta nhìn tôi như siêu nhân',
      'Cho một {drink}, đậm nhất có thể. Cà phê nhạt với tôi là nước ấm',
      '{drink} nha. Tôi tới đây trốn tuyết, mà ai cũng mặc áo phao, tôi bối rối',
    ],
    impatient: [
      'Tôi từng đứng chờ xe buýt trong bão tuyết 2 tiếng. Chờ ở đây dễ. Nhưng hơi lâu',
      'Không sao, người Nga kiên nhẫn. Nhưng mặt tôi bắt đầu nghiêm hơn rồi đó',
      'Ly này lâu như mùa đông nước tôi',
      'Tôi đang đếm trong đầu bằng tiếng Nga. Số đã rất dài',
    ],
    good: [
      'Horosho! Đậm, mạnh, ấm lòng. Như bà tôi, nhưng ngọt hơn',
      'Ngon. Tôi đang cười đó, nhìn kỹ sẽ thấy',
      'Uống xong ấm tới mức tôi định cởi luôn áo cộc tay',
      'Đậm đúng chuẩn. Ly cà phê đầu tiên đánh thức được tôi',
    ],
    meh: [
      'Được. Hơi nhạt, giống thời tiết tháng 6 nước tôi',
      'Tạm. Thêm đá nữa thì giống quê nhà hơn',
      'Ổn. Mặt tôi không đổi, nhưng trong lòng 3 sao',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'vn', headline: 'Khách Hà Nội, Sài Gòn săn mây', label: 'khách du lịch', foreign: false, weight: 1.4, patience: 1,
    blurb: 'Khách Hà Nội, Sài Gòn lên Đà Lạt săn mây, mỗi người mang 3 bộ đồ chụp ảnh',
    f: ['Chị Thu Hà Nội', 'Bé Ngọc Check-in', 'Chị Lan Bánh Căn', 'Cô Ba Miền Tây', 'Em Vy Sống Ảo'],
    m: ['Anh Tuấn Sài Gòn', 'Anh Hùng Săn Mây', 'Anh Khoa Phượt Thủ', 'Chú Sáu Đi Tour'],
    persona: (g, name) => byTitle(name, g),
    pool: { skins: ['#f6d3b3', '#f0c8a2', '#e9bf97', '#d9a679'], hairs: [...DARK_HAIR, '#6b4026'], fs: ['long', 'shoulder', 'sunhat', 'nonla', 'bun'], ms: ['short', 'helmet', 'cap', 'messy'], shirts: ['#e8873a', '#ff9aa8', '#f2c14e', '#5b8bd9', '#f4f4f0', '#2fa38c'], acc: [['blush', 0.4], ['shades', 0.2], ['scarf', 0.25]] },
    greet: [
      'Cho {t} ly {drink} nha {b}. Giờ này Hà Nội đang kẹt xe, ở đây chill quá trời',
      'Cho {t} {drink} nha. Sài Gòn 36 độ, lên đây lạnh tím môi mà vẫn uống đá',
      'Một {drink}! {T} đi săn mây từ 4 giờ sáng, mây không thấy, chỉ thấy buồn ngủ',
      'Quán đẹp quá trời, cho {t} {drink}, {t} thay bộ đồ thứ 3 rồi quay lại chụp',
      'Ly {drink} ít ngọt nha {b}. {T} vừa ăn 5 cái bánh tráng nướng rồi',
      'Cho {t} {drink}. {T} phượt 300 cây số chỉ để uống ly này, pha có tâm nha',
    ],
    impatient: [
      'Ủa alo, ly của {t} đi săn mây luôn rồi hả?',
      'Đợi lâu dữ, đèo Prenn còn qua nhanh hơn',
      '{T} đứng chờ tới mức chụp xong một bộ ảnh luôn rồi',
      'Ét o ét, xe khách 3 giờ chạy rồi đó {b} ơi',
    ],
    good: [
      'Đỉnh nóc kịch trần bay phấp phới! Lên Đà Lạt không ghé là phí',
      'Ngon xỉu, chill xỉu, ảnh đẹp xỉu. Mãi mận mãi keo',
      'Uống ly này xong mới hiểu vì sao lên Đà Lạt rồi không muốn về',
      'Quá dữ quá dữ! Hà Nội có cà phê trứng, Đà Lạt có quán này',
    ],
    meh: [
      'Ngon mà lâu quá, {t} lỡ mất hoàng hôn rồi',
      'Tạm ổn, ảnh đẹp hơn vị',
      'Được, nhưng giá hơi Sài Gòn mà không khí thì Đà Lạt',
    ],
    chats: [
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
    ],
  }),
  group({
    id: 'vanphong', headline: 'Dân văn phòng đi “nghỉ dưỡng”', label: 'dân văn phòng', foreign: false, weight: 1.2, patience: 0.8,
    blurb: 'Một công ty đi “nghỉ dưỡng” ở Đà Lạt, ai cũng mang theo laptop và một deadline',
    f: ['Chị Kế Toán', 'Chị HR', 'Chị PM Gantt', 'Em Intern'],
    m: ['Anh Trưởng Phòng', 'Anh Dev Lên Prod', 'Anh Sale Chạy KPI', 'Anh Designer Sửa Logo'],
    persona: (g, name) => byTitle(name, g),
    pool: { skins: ['#f6d3b3', '#f0c8a2', '#e9bf97'], hairs: [...DARK_HAIR, '#6b4026'], fs: ['shoulder', 'bob', 'bun', 'long'], ms: ['short', 'messy', 'slick'], shirts: ['#f4f4f0', '#b8d8f0', '#4a4f57', '#2e3f6e'], acc: [['glasses', 0.5], ['tie', 0.3], ['collar', 0.4], ['hoodie', 0.15]] },
    greet: [
      'Cho {t} {drink}, đậm nhất có thể. Công ty cho đi nghỉ dưỡng, nhưng sếp vẫn họp lúc 9 giờ',
      '{B} ơi {drink} nha. {T} đang nghỉ phép, chỉ online “một xíu” thôi, từ sáng tới giờ',
      '{drink} một ly. Wifi quán mạnh không {b}? {T} cần đẩy code lên trước 10 giờ',
      'Cho {t} {drink}. Ly thứ 4 rồi, đi team building mà toàn build slide',
      'Một {drink}, nhanh giùm {t}. Sếp vừa nhắn “rảnh không” lúc {t} đang ngắm đồi thông',
      '{drink} nha {b}. Out of office đã bật, nhưng {t} vẫn trả lời mail trong 3 phút',
      'Cho {t} {drink}. Công ty bảo “cứ nghỉ thoải mái, chỉ cần báo cáo cuối ngày”',
    ],
    impatient: [
      '{B} ơi nhanh giùm, cuộc họp Zoom bắt đầu sau 2 phút',
      'Sếp đang gõ “…”, {t} cần caffeine trước khi tin nhắn hiện ra',
      'Deadline chạy nhanh hơn ly nước của {t} rồi',
      'Ly này trễ thêm chút là thành task quá hạn',
      '{T} nghỉ dưỡng mà tim đập như ngày nộp báo cáo quý',
    ],
    good: [
      'Ngon tới mức {t} trả lời mail sếp bằng giọng vui vẻ luôn',
      'Uống xong deadline tự chạy, sếp khen, mai {t} xin tăng lương',
      'Ly cà phê đầu tiên trong năm không phải uống trong phòng họp. Cảm động',
      'Đã ghim quán vào lịch: “Họp với cà phê Dreamers”, lặp lại mỗi sáng',
      '5 sao. Đã tick “Done” task “uống cà phê ngon ở Đà Lạt”',
    ],
    meh: [
      'Tạm ổn, nhưng chờ lâu tới mức {t} bị điểm danh trễ họp',
      'Được, nhưng wifi yếu, file 2GB vẫn chưa gửi xong',
      'Ngon mà không làm deadline biến mất. 3 sao',
    ],
    chats: [
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
    ],
  }),
]

/** Hội khách cá tính trên phố: mỗi người có ngoại hình, xưng hô, câu gọi món & chuyện tám riêng */
export function makeCharacterGroup(chars: { name: string; look: Look; p: Persona; greet: string[]; chats: ChatTopic[] }[]): GuestGroup {
  return {
    id: 'pho', headline: 'Hội khách cá tính phố Dốc', label: 'khách cá tính', foreign: false, weight: 0.6, patience: 1,
    blurb: 'Hội khách cá tính trên phố Dốc Mộng Mơ hay ghé, mỗi người một kiểu khó chiều dễ thương',
    f: chars.filter((c) => c.p.g === 'f').map((c) => c.name),
    m: chars.filter((c) => c.p.g === 'm').map((c) => c.name),
    names: chars.map((c) => c.name),
    persona: (g) => xung.minh(g),
    look: () => pk(chars).look,
    greet: chars.flatMap((c) => c.greet),
    impatient: [
      'Tíc tắc… tíc tắc… {t} đếm từng giây đó nha',
      'Pha cà phê hay đang trồng cà phê vậy {b}?',
      'Ly của {t} đi đường vòng hả?',
      'Chậm vậy là định để {t} viết sớ hả?',
    ],
    good: [
      'Ngon. Nhưng {t} vẫn sẽ chê cái ghế',
      'Định chê mà tìm không ra chỗ chê. Bực ghê',
      'Hừm, lần này {t} tha. Đừng có cười',
      'Ly hơi nhỏ, đá hơi nhiều, nhạc hơi to… mà thôi, ngon',
      'Không có gì để chê, {t} thấy khó chịu ghê',
    ],
    meh: [
      'Tốc độ phục vụ ngang wifi nhà hàng xóm',
      'Đề nghị quán đổi tên thành “Đợi Hoài Coffee”',
      'Quán tên Dreamers đúng rồi, vì phục vụ nhanh chỉ có trong mơ',
      'Chờ ly nước mà như chờ người yêu cũ quay lại',
    ],
    chats: [],
    people: chars.map((c, i) => ({ name: c.name, look: c.look, p: c.p, greet: c.greet, chats: c.chats, album: `boss:${i}` })),
  }
}

/** Tất cả tên khách du lịch (cho album) */
export const INTL_NAMES = GUEST_GROUPS.flatMap((g) => g.names.map((n) => ({ name: n, group: g.label })))
