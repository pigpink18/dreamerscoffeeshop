// Khách du lịch khắp nơi ghé Dreamers Coffee: Hàn, Trung, Anh, Pháp, Ý, Đức, Nga, khách Việt đi săn mây,
// dân văn phòng "nghỉ dưỡng" vẫn chạy deadline, và hội khách cá tính trên phố (trước là boss, giờ là khách thường).
// Mỗi nhóm có ngoại hình, tên vui, câu gọi món, câu hối, review và chuyện tám riêng. Thêm thoải mái.
// Chuyện tám: 3 kiểu trả lời như chatter.ts – ngọt ngào · xéo sắc (cà khịa) · cụt lủn.
import type { Look, HairStyle, Acc, ChatTopic } from './data'

const pk = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const t = (say: string, nice: [string, string, number?], sassy: [string, string, number], dry: [string, string]): ChatTopic => ({
  say,
  replies: [
    { text: nice[0], answer: nice[1], bond: nice[2] ?? 7 },
    { text: sassy[0], answer: sassy[1], bond: sassy[2], sassy: true },
    { text: dry[0], answer: dry[1], bond: 1 },
  ],
})

interface LookPool { skins: string[]; hairs: string[]; styles: HairStyle[]; shirts: string[]; acc?: [Acc, number][] }
function lookFrom(p: LookPool): Look {
  const acc: Acc[] = []
  for (const [a, chance] of p.acc ?? []) if (Math.random() < chance) acc.push(a)
  return { skin: pk(p.skins), hair: pk(p.hairs), style: pk(p.styles), shirt: pk(p.shirts), accent: pk(p.shirts), acc }
}

/** Người cụ thể trong nhóm (dùng cho khách cá tính có ngoại hình & thoại riêng) */
export interface GuestPerson { name: string; look: Look; greet: string[]; album: string }

export interface GuestGroup {
  id: string
  headline: string // tiêu đề thẻ "đoàn khách hôm nay"
  label: string // hiện cạnh tên: "Kim Bắp Cải · Hàn Quốc"
  blurb: string // tin "đoàn khách hôm nay" ở màn chuẩn bị
  foreign: boolean // tính vào nhiệm vụ / thành tựu "khách nước ngoài"
  weight: number // tỉ lệ ghé (so với nhóm khác)
  patience: number // hệ số kiên nhẫn: người Anh xếp hàng giỏi, dân văn phòng thì đang chạy deadline
  names: string[]
  look: () => Look
  greet: string[] // {drink} = tên món
  impatient: string[]
  good: string[] // review 4–5 sao
  meh: string[] // review 2–3 sao
  chats: ChatTopic[]
  people?: GuestPerson[]
}

const ASIAN_SKIN = ['#f6d3b3', '#f0c8a2', '#f8dcc4', '#e9bf97']
const EURO_SKIN = ['#f8dcc4', '#f6d3b3', '#f3c9a6', '#fbe3d0']
const DARK_HAIR = ['#1d1612', '#2b1d16', '#3a2a20']

export const GUEST_GROUPS: GuestGroup[] = [
  {
    id: 'han', headline: 'Đoàn khách Hàn Quốc', label: 'Hàn Quốc', foreign: true, weight: 1, patience: 1,
    blurb: 'Đoàn du lịch Hàn Quốc vừa tới Đà Lạt, tay ai cũng cầm gậy selfie và lọ kem chống nắng',
    names: ['Kim Bắp Cải', 'Park Bánh Gạo', 'Choi Kim Chi', 'Jung Soju', 'Yoon Mì Cay', 'Kang Tok-bốc-ki', 'Han Mặt Nạ', 'Oppa Gió Lạnh'],
    look: () => lookFrom({ skins: ASIAN_SKIN, hairs: [...DARK_HAIR, '#8a6a5a', '#c9b8a8', '#ff9aa8'], styles: ['bob', 'shoulder', 'long', 'short', 'bun', 'messy'], shirts: ['#f4f4f0', '#ff9aa8', '#b8d8f0', '#e8d8f0', '#2b2b2b'], acc: [['blush', 0.7], ['glasses', 0.2]] }),
    greet: [
      'Annyeong! Cho em một ly {drink}, ít đá như phim Hàn: ngoài lạnh lùng, trong ấm áp nha!',
      'Xin chào! {drink} một ly. Ở Seoul ly này bằng nửa ngày lương, ở đây rẻ quá em xỉu!',
      'Chị chủ ơi, {drink} một ly. Em quay video được không? Em làm vlog “Đà Lạt có gì vui”',
      'Một {drink} nha. Pha đẹp đẹp, em chụp 37 tấm rồi mới uống',
      'Daebak! Quán xinh như phim trường. Cho em {drink}, em đứng góc 45 độ chờ',
      '{drink} một ly, ít đường. Tối nay em skincare 10 bước, không được tăng cân',
    ],
    impatient: [
      'Chờ lâu như đợi tập cuối phim 16 tập',
      'Aigoo, em đợi tới mức máy quay hết pin luôn',
      'Ở Seoul gọi đồ ăn 15 phút tới, ở đây 15 phút chưa có ly nước',
      'Nhanh nhanh nha, hướng dẫn viên đếm người rồi kìa',
    ],
    good: [
      'Ngon hơn cà phê ở Gangnam mà rẻ hơn 4 lần. Daebak!',
      'Ngọt như cảnh nam chính cầm ô cho nữ chính. 5 sao!',
      'Quán đẹp, nước ngon, em chụp 200 tấm, đăng 1 tấm',
      'Uống xong em hiểu vì sao người Việt một ngày 3 ly cà phê',
      'Ngon tới mức em muốn huỷ vé máy bay về',
    ],
    meh: [
      'Ngon mà hơi lâu, xe du lịch suýt bỏ em lại',
      'Tạm ổn. Chưa đủ làm cảnh quay chính, làm cảnh phụ được',
      'Đá tan nhanh hơn tình cảm nam phụ',
    ],
    chats: [
      t('Ở Việt Nam ai cũng uống cà phê sữa đá hả? Em thấy đi đâu cũng có',
        ['Đúng rồi, máu người Việt 30% là cà phê sữa đá', 'Daebak! Vậy em truyền máu Việt liền'],
        ['Ừ, người Việt có thể thiếu ngủ chứ không bao giờ thiếu cà phê', 'Hahaha câu này em đăng story được không', 8],
        ['Ừ', 'Ờ… ngắn gọn ghê']),
      t('Chị có xem phim Hàn không? Em giống nữ chính phim nào?',
        ['Giống nữ chính phim nào cũng có cảnh ăn mì lúc nửa đêm', 'Trời, đúng em luôn, tối nào cũng ăn mì'],
        ['Giống nữ chính lúc chưa gặp nam chính, đang chạy deadline', 'Ơ… đau mà chuẩn, em cũng dân văn phòng', 7],
        ['Không xem', 'Sao có thể!? Người này lạ quá']),
      t('Đà Lạt lạnh thật! Ở đây có bán kimchi không chị?',
        ['Không có kimchi, nhưng có dưa chua bà ngoại muối nè', 'Dưa chua kiểu Việt hả? Cho em thử với!'],
        ['Có, kimchi đang ủ trong tủ, ba tuần nữa là ăn được', 'Em ở có 2 ngày thôi chị ơi', 5],
        ['Không', 'Huhu nhớ nhà quá']),
      t('Người Việt nói nhanh quá, “khum” nghĩa là gì vậy chị?',
        ['“Khum” là “không” nhưng dễ thương hơn, như “ani-yo” đó', 'À ha! Em khum về nữa đâu, ở lại Đà Lạt luôn'],
        ['“Khum” là cách giới trẻ từ chối deadline', 'Vậy em khum làm việc nữa, khum khum!', 8],
        ['Là không', 'Ok… không vui lắm']),
    ],
  },
  {
    id: 'trung', headline: 'Đoàn khách Trung Quốc', label: 'Trung Quốc', foreign: true, weight: 1, patience: 1,
    blurb: 'Đoàn khách Trung Quốc đang livestream Đà Lạt, mỗi người cầm 2 điện thoại',
    names: ['Vương Trà Sữa', 'Lý Livestream', 'Trương Đậu Hũ', 'Lưu Bánh Bao', 'Chu Douyin', 'Hà Mì Xào', 'Lâm Lẩu Cay', 'Tô Quét Mã'],
    look: () => lookFrom({ skins: ASIAN_SKIN, hairs: [...DARK_HAIR, '#5a3a28'], styles: ['short', 'bob', 'long', 'bun', 'slick', 'cap'], shirts: ['#d9534f', '#f2c14e', '#2b2b2b', '#f4f4f0', '#5b8bd9'], acc: [['glasses', 0.3], ['blush', 0.3]] }),
    greet: [
      'Nǐ hǎo! Một ly {drink}, em đang livestream, chị cười tươi lên nha, 3 vạn người đang xem',
      'Cho một {drink}. Quét mã được không? Ví điện tử nào em cũng có, chỉ không có tiền mặt',
      '{drink} một ly! Quay chậm lúc rót nha, video này lên xu hướng là quán nổi tiếng luôn',
      'Ở quê em gọi cà phê này là “nước đen thần thánh”. Cho em một {drink}!',
      'Một {drink}, size lớn nhất. Người nhà dặn mua làm quà thêm 20 gói nữa',
      'Chị ơi, {drink}! Quán này 10 vạn lượt thích trên mạng, đúng chỗ này không?',
    ],
    impatient: [
      'Chị ơi nhanh lên, người xem livestream đang giảm kìa',
      'Chờ lâu quá, bình luận toàn hỏi “ly nước đâu”',
      'Bên em giao đồ ăn bằng drone, ở đây ly nước còn đi bộ hả?',
      'Hướng dẫn viên giơ cờ rồi, em phải đi đây',
    ],
    good: [
      'Ngon! Livestream bán giúp quán 300 gói cà phê luôn rồi',
      'Vị đậm, quán đẹp, chị chủ lên hình xinh. 5 sao, đã ghim quán',
      'Uống xong tỉnh tới mức em live thêm 4 tiếng nữa',
      'Ngon như lời đồn trên mạng. Lần đầu mạng nói thật',
    ],
    meh: [
      'Ngon mà chậm, người xem live thoát hết rồi',
      'Tạm được, ly hơi nhỏ, không đủ lên hình',
      'Nước ổn, wifi yếu, live bị đứng 3 lần',
    ],
    chats: [
      t('Quán có muốn em quảng cáo không? Một video là cả nước biết',
        ['Cảm ơn nha, quán ngon thì tự có người tới', 'Chị khiêm tốn quá, em quay luôn, miễn phí!'],
        ['Được, trả công bằng 1 ly bạc xỉu, không hoa hồng', 'Hahaha chị biết làm ăn! Chốt đơn!', 8],
        ['Không cần', 'Ồ… chị ngầu thật']),
      t('Ở Việt Nam ăn sáng gì? Em thấy ai cũng ăn bánh mì',
        ['Sáng bánh mì, trưa phở, chiều trà sữa, tối lại bánh mì', 'Cuộc sống lý tưởng! Em muốn chuyển nhà'],
        ['Ăn sáng bằng cà phê, ăn trưa bằng cà phê, giảm cân luôn', 'Ơ… công thức giảm cân rẻ quá', 7],
        ['Bánh mì', 'Ok…']),
      t('Em mua quà nhiều quá, vali nặng 40 ký rồi, làm sao đây?',
        ['Gửi bưu điện về nhà, nhẹ người mà quà vẫn tới', 'Đúng rồi! Chị thông minh quá'],
        ['Uống hết cà phê tại chỗ thì vali nhẹ liền', 'Haha uống 40 ký cà phê chắc em bay về khỏi cần máy bay', 8],
        ['Mua ít lại', 'Không được, mẹ em dặn mua!']),
    ],
  },
  {
    id: 'anh', headline: 'Khách Anh đi phượt', label: 'Anh', foreign: true, weight: 1, patience: 1.3,
    blurb: 'Khách Anh đi phượt Đà Lạt, xếp hàng ngay ngắn và nói “sorry” liên tục',
    names: ['Oliver Ô Mai', 'Emma Ếch Chiên', 'George Gừng', 'Charlotte Chè Bưởi', 'Harry Hột Vịt', 'Lily Lá Trà', 'William Wifi', 'Sophie Sương Mù'],
    look: () => lookFrom({ skins: EURO_SKIN, hairs: ['#d9a441', '#c96a2b', '#6b4026', '#e8d08a', '#3a2a20'], styles: ['short', 'messy', 'shoulder', 'long', 'cap', 'bob'], shirts: ['#2e3f6e', '#8e1b2c', '#4a6a4a', '#c9b89c', '#f4f4f0'], acc: [['glasses', 0.25], ['beard', 0.15], ['scarf', 0.3]] }),
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
        ['Anh trốn mưa sang đây mà Đà Lạt lại mưa, đúng số', 'Haha đúng! Mưa đi theo tôi như fan cứng', 8],
        ['Ừ', 'Ừ… ừm… trời đẹp']),
      t('Ở đây có trà sữa không? Tôi uống trà với sữa cả đời rồi',
        ['Có trà đào, ngon lắm, thử đi', 'Trà mà có đào? Nước tôi chưa sẵn sàng cho điều này'],
        ['Trà sữa Việt có trân châu, người Anh nhai nổi không', 'Tôi đã thử. Nó… nhai lại tôi. 10 điểm', 8],
        ['Không', 'Ồ… tôi sẽ ổn thôi']),
      t('Tôi xin lỗi vì đã xin lỗi nhiều quá. Sorry',
        ['Không sao, lịch sự là được giảm giá tình cảm', 'Thật dễ thương! Sorry, à không, thank you'],
        ['Xin lỗi thêm 3 lần nữa là được tặng 1 ly', 'Sorry sorry sorry! Ly đâu?', 7],
        ['Ừ', 'Sorry…']),
    ],
  },
  {
    id: 'phap', headline: 'Khách Pháp tìm “Paris nhỏ”', label: 'Pháp', foreign: true, weight: 1, patience: 1,
    blurb: 'Khách Pháp về thăm “Paris nhỏ”, ai cũng mang theo một cuốn sách và rất nhiều ý kiến',
    names: ['Pierre Pa-tê', 'Amélie Bánh Mì', 'Jean Jambon', 'Sophie Súp Cua', 'Louis Lẩu Gà', 'Chloé Chè Chuối', 'Antoine Ăn Vặt', 'Camille Cà Rốt'],
    look: () => lookFrom({ skins: EURO_SKIN, hairs: ['#3a2a20', '#6b4026', '#1d1612', '#a0522d'], styles: ['beret', 'beret', 'shoulder', 'long', 'messy', 'short'], shirts: ['#2e3f6e', '#f4f4f0', '#d9534f', '#2b2b2b'], acc: [['scarf', 0.4], ['mustache', 0.15], ['lipstick', 0.2]] }),
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
      t('Tôi đang viết tiểu thuyết về Đà Lạt. Chị có câu chuyện nào không?',
        ['Có, chuyện cô gái bỏ phố về núi mở quán với một bé corgi', 'Quá đẹp! Đây sẽ là chương 1'],
        ['Chuyện chủ quán bị khách ngồi 3 tiếng mà gọi 1 ly', 'Ơ… nhân vật đó có phải tôi không', 7],
        ['Không', 'Vậy tôi viết về sự im lặng của chị']),
      t('Ở Việt Nam có đình công không? Ở Pháp tuần nào cũng có',
        ['Không đình công, chỉ có kẹt xe là đều đặn', 'Kẹt xe là cuộc đình công của đường phố'],
        ['Có, con corgi của quán đình công đòi pate mỗi chiều', 'Haha tôi ủng hộ cuộc đình công này', 8],
        ['Không', 'Thật đáng tiếc']),
    ],
  },
  {
    id: 'y', headline: 'Đoàn khách Ý', label: 'Ý', foreign: true, weight: 1, patience: 0.95,
    blurb: 'Khách Ý ghé Đà Lạt, chuẩn bị tinh thần nghe phản biện về espresso',
    names: ['Marco Mì Ý', 'Giulia Gelato', 'Luca Lạp Xưởng', 'Francesca Phô Mai', 'Giovanni Giò Lụa', 'Sofia Sầu Riêng', 'Matteo Măng Cụt', 'Chiara Chả Giò'],
    look: () => lookFrom({ skins: ['#f0c8a2', '#e9bf97', '#f3c9a6', '#d9a679'], hairs: DARK_HAIR, styles: ['slick', 'long', 'shoulder', 'short', 'messy', 'bun'], shirts: ['#f4f4f0', '#2b2b2b', '#6aa84f', '#d9534f', '#2e3f6e'], acc: [['shades', 0.35], ['chain', 0.2], ['beard', 0.2]] }),
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
      t('Chị nghĩ người Ý hay người Việt nói chuyện bằng tay nhiều hơn?',
        ['Người Ý múa tay, người Việt múa cả muỗng khuấy cà phê', 'Haha tôi phải học múa muỗng!'],
        ['Người Ý, vì nãy giờ anh suýt làm đổ 2 ly của bàn bên', 'Ơ… chuẩn. Tôi xin lỗi bàn bên bằng tay luôn', 8],
        ['Không biết', 'Tay tôi buồn lắm']),
    ],
  },
  {
    id: 'duc', headline: 'Đoàn khách Đức', label: 'Đức', foreign: true, weight: 1, patience: 0.85,
    blurb: 'Khách Đức tới Đà Lạt theo lịch trình chia tới từng phút',
    names: ['Hans Hủ Tiếu', 'Klaus Khoai Tây', 'Greta Gỏi Cuốn', 'Lukas Lạc Rang', 'Heidi Hột Vịt', 'Jonas Giò Heo', 'Anna Ăn Đúng Giờ', 'Felix Phở Khô'],
    look: () => lookFrom({ skins: EURO_SKIN, hairs: ['#e8d08a', '#d9a441', '#c9b8a8', '#6b4026'], styles: ['short', 'short', 'bob', 'shoulder', 'bun', 'combover'], shirts: ['#4a4f57', '#2e3f6e', '#6aa84f', '#f4f4f0'], acc: [['glasses', 0.5], ['beard', 0.15], ['collar', 0.3]] }),
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
  },
  {
    id: 'nga', headline: 'Khách Nga trốn đông', label: 'Nga', foreign: true, weight: 1, patience: 1.15,
    blurb: 'Khách Nga “trốn đông” ở Đà Lạt, mặc áo cộc tay giữa trời 15 độ',
    names: ['Ivan Ít Đường', 'Natasha Nước Mía', 'Dmitri Dưa Leo', 'Olga Ốc Luộc', 'Sergei Sữa Đậu', 'Anya Áo Phao', 'Boris Bánh Căn', 'Katya Kẹo Dừa'],
    look: () => lookFrom({ skins: ['#fbe3d0', '#f8dcc4', '#f6d3b3'], hairs: ['#e8d08a', '#d9c8a8', '#a0522d', '#6b4026'], styles: ['short', 'long', 'shoulder', 'bun', 'messy'], shirts: ['#f4f4f0', '#5b8bd9', '#d9534f', '#2b2b2b'], acc: [['beard', 0.2], ['scarf', 0.15]] }),
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
        ['Anh mặc áo cộc tay làm cả Đà Lạt lạnh thay luôn', 'Haha tôi xin lỗi Đà Lạt', 8],
        ['Ừ', 'Ừ…']),
      t('Sao người Việt cười nhiều vậy? Người Nga chỉ cười khi thật sự có chuyện vui',
        ['Vì có cà phê ngon, cười là phải', 'Hợp lý. Tôi cũng cười… ở trong lòng'],
        ['Vì người Việt cười trước, giải quyết vấn đề sau', 'Triết lý mạnh. Tôi ghi lại', 8],
        ['Không biết', 'Ồ…']),
      t('Chị biết búp bê Matryoshka không? Búp bê trong búp bê',
        ['Biết chứ, giống chồng ly lồng nhau ở quầy em nè', 'Giống thật! Chồng ly cũng là nghệ thuật'],
        ['Biết, như deadline trong deadline của dân văn phòng', 'Haha đáng sợ hơn búp bê nhiều', 8],
        ['Biết', 'Tốt']),
    ],
  },
  {
    id: 'vn', headline: 'Khách Hà Nội, Sài Gòn săn mây', label: 'khách du lịch', foreign: false, weight: 1.4, patience: 1,
    blurb: 'Khách Hà Nội, Sài Gòn lên Đà Lạt săn mây, mỗi người mang 3 bộ đồ chụp ảnh',
    names: ['Chị Thu Hà Nội', 'Anh Tuấn Sài Gòn', 'Bé Ngọc Check-in', 'Anh Hùng Săn Mây', 'Chị Lan Bánh Căn', 'Cô Ba Miền Tây', 'Anh Khoa Phượt Thủ', 'Em Vy Sống Ảo'],
    look: () => lookFrom({ skins: ['#f6d3b3', '#f0c8a2', '#e9bf97', '#d9a679'], hairs: [...DARK_HAIR, '#6b4026'], styles: ['long', 'shoulder', 'short', 'helmet', 'sunhat', 'nonla', 'bun', 'cap'], shirts: ['#e8873a', '#ff9aa8', '#f2c14e', '#5b8bd9', '#f4f4f0', '#2fa38c'], acc: [['blush', 0.4], ['shades', 0.2], ['scarf', 0.25]] }),
    greet: [
      'Em ơi cho chị ly {drink}. Giờ này Hà Nội đang kẹt xe, ở đây chill quá trời',
      'Cho anh {drink} nha. Sài Gòn 36 độ, lên đây lạnh tím môi mà vẫn uống đá',
      'Một {drink}! Em đi săn mây từ 4 giờ sáng, mây không thấy, chỉ thấy buồn ngủ',
      'Quán đẹp quá trời, cho em {drink}, em thay bộ đồ thứ 3 rồi quay lại chụp',
      'Ly {drink} ít ngọt nha. Chị vừa ăn 5 cái bánh tráng nướng rồi',
      'Cho anh {drink}. Anh phượt 300 cây số chỉ để uống ly này, pha có tâm nha',
    ],
    impatient: [
      'Ủa alo, ly của chị đi săn mây luôn rồi hả?',
      'Đợi lâu dữ, đèo Prenn còn qua nhanh hơn',
      'Em đứng chờ tới mức chụp xong một bộ ảnh luôn rồi',
      'Ét o ét, xe khách 3 giờ chạy rồi đó quán ơi',
    ],
    good: [
      'Đỉnh nóc kịch trần bay phấp phới! Lên Đà Lạt không ghé là phí',
      'Ngon xỉu, chill xỉu, ảnh đẹp xỉu. Mãi mận mãi keo',
      'Uống ly này xong mới hiểu vì sao lên Đà Lạt rồi không muốn về',
      'Quá dữ quá dữ! Hà Nội có cà phê trứng, Đà Lạt có quán này',
    ],
    meh: [
      'Ngon mà lâu quá, lỡ mất hoàng hôn rồi',
      'Tạm ổn, ảnh đẹp hơn vị',
      'Được, nhưng giá hơi Sài Gòn mà không khí thì Đà Lạt',
    ],
    chats: [
      t('Ở Đà Lạt chỗ nào săn mây đẹp nhất vậy em?',
        ['Đồi chè Cầu Đất, đi lúc 5 giờ sáng là đẹp nhất', 'Cảm ơn em, mai chị dậy sớm liền!'],
        ['Ngồi đây chờ, mây tự bay ngang quán, khỏi đi', 'Hahaha nghe hợp lý ghê, khỏi dậy sớm', 8],
        ['Không biết', 'Ờ… chị tự tra mạng vậy']),
      t('Cà phê Hà Nội với Sài Gòn, em thấy ở đâu ngon hơn?',
        ['Ở đâu cũng ngon, ngon nhất là ly có người thương ngồi cùng', 'Trời ơi nói chuyện ngọt hơn bạc xỉu'],
        ['Ngon nhất là ở Đà Lạt, ngay chỗ chị đang đứng nè', 'Haha né câu hỏi quá đỉnh, chị chịu', 8],
        ['Không biết', 'Câu trả lời an toàn ghê']),
      t('Lên Đà Lạt mà quên mang áo ấm, lạnh run luôn rồi nè',
        ['Uống ly này cho ấm, rồi ghé chợ đêm mua áo len', 'Cảm ơn em, quán có tâm quá'],
        ['Mặc chồng 3 bộ đồ chụp ảnh lên là ấm', 'Hahaha sao em biết chị mang 3 bộ', 8],
        ['Lạnh thật', 'Ừ… cảm ơn đã xác nhận']),
    ],
  },
  {
    id: 'vanphong', headline: 'Dân văn phòng đi “nghỉ dưỡng”', label: 'dân văn phòng', foreign: false, weight: 1.2, patience: 0.8,
    blurb: 'Một công ty đi “nghỉ dưỡng” ở Đà Lạt, ai cũng mang theo laptop và một deadline',
    names: ['Anh Trưởng Phòng', 'Chị Kế Toán', 'Em Intern', 'Anh Dev Lên Prod', 'Chị HR', 'Anh Sale Chạy KPI', 'Chị PM Gantt', 'Anh Designer Sửa Logo'],
    look: () => lookFrom({ skins: ['#f6d3b3', '#f0c8a2', '#e9bf97'], hairs: [...DARK_HAIR, '#6b4026'], styles: ['short', 'shoulder', 'bob', 'messy', 'slick', 'bun'], shirts: ['#f4f4f0', '#b8d8f0', '#4a4f57', '#2e3f6e'], acc: [['glasses', 0.5], ['tie', 0.3], ['collar', 0.4], ['hoodie', 0.15]] }),
    greet: [
      'Cho anh {drink}, đậm nhất có thể. Công ty cho đi nghỉ dưỡng, nhưng sếp vẫn họp lúc 9 giờ',
      'Em ơi {drink} nha. Chị đang nghỉ phép, chỉ online “một xíu” thôi, từ sáng tới giờ',
      '{drink} một ly. Wifi quán mạnh không em? Anh cần đẩy code lên trước 10 giờ',
      'Cho em {drink}. Ly thứ 4 rồi, đi team building mà toàn build slide',
      'Một {drink}, nhanh giùm chị. Sếp vừa nhắn “em rảnh không” lúc chị đang ngắm đồi thông',
      '{drink} nha. Out of office đã bật, nhưng anh vẫn trả lời mail trong 3 phút',
      'Cho anh {drink}. Công ty bảo “cứ nghỉ thoải mái, chỉ cần báo cáo cuối ngày”',
    ],
    impatient: [
      'Em ơi nhanh giùm, cuộc họp Zoom bắt đầu sau 2 phút',
      'Sếp đang gõ “…”, anh cần caffeine trước khi tin nhắn hiện ra',
      'Deadline chạy nhanh hơn ly nước của anh rồi',
      'Ly này trễ thêm chút là thành task quá hạn',
      'Chị nghỉ dưỡng mà tim đập như ngày nộp báo cáo quý',
    ],
    good: [
      'Ngon tới mức anh trả lời mail sếp bằng giọng vui vẻ luôn',
      'Uống xong deadline tự chạy, sếp khen, mai em xin tăng lương',
      'Ly cà phê đầu tiên trong năm không phải uống trong phòng họp. Cảm động',
      'Đã ghim quán vào lịch: “Họp với cà phê Dreamers”, lặp lại mỗi sáng',
      '5 sao. Đã tick “Done” task “uống cà phê ngon ở Đà Lạt”',
    ],
    meh: [
      'Tạm ổn, nhưng chờ lâu tới mức anh bị điểm danh trễ họp',
      'Được, nhưng wifi yếu, file 2GB vẫn chưa gửi xong',
      'Ngon mà không làm deadline biến mất. 3 sao',
    ],
    chats: [
      t('Em ơi, anh ngồi đây làm việc tới tối được không? Công ty bảo đi nghỉ dưỡng',
        ['Được chứ, có ổ cắm với wifi mạnh cho anh luôn', 'Em là ân nhân của dân văn phòng'],
        ['Được, nghỉ dưỡng kiểu này gọi là “dời văn phòng lên núi”', 'Haha chuẩn không cần chỉnh, đau quá', 8],
        ['Được', 'Cảm ơn, anh đi họp tiếp đây']),
      t('Sếp nhắn “em rảnh không?” vào chủ nhật. Trả lời sao em?',
        ['Nói đang ở vùng sóng yếu, rồi tắt máy uống cà phê', 'Đỉnh! Đà Lạt sóng yếu là chuyện bình thường mà'],
        ['Trả lời “Dạ em rảnh, nhưng tâm hồn em đang bận”', 'Hahaha anh copy câu này luôn', 9],
        ['Trả lời rảnh', 'Thôi xong cuối tuần của anh']),
      t('Chị đi team building mà ba ngày toàn chơi trò “đồng đội” với file Excel',
        ['Uống ly này nghỉ 15 phút, Excel không chạy đi đâu đâu', 'Đúng, nó sẽ ở đó chờ chị, như ác mộng'],
        ['Team building thật ra là team “building” báo cáo mà', 'Haha đúng bản chất luôn', 8],
        ['Vất vả ghê', 'Ừ…']),
      t('Em biết KPI là gì không? Anh mơ thấy nó mỗi đêm',
        ['KPI của quán là khách cười, anh cười một cái là đạt', 'Ui, em làm anh đạt KPI rồi đó'],
        ['KPI là “Không Phải Ít” việc đúng không anh', 'Haha chuẩn nghĩa tiếng Việt luôn', 9],
        ['Biết', 'Ờ…']),
    ],
  },
]

/** Hội khách cá tính trên phố (trước là boss): ngoại hình & câu gọi món riêng, giờ chờ như khách thường */
export function makeCharacterGroup(chars: { name: string; title: string; look: Look }[]): GuestGroup {
  const greets: string[][] = [
    ['Cho chị {drink}. Chị soi kỹ lắm nha, giọt nào cũng phải đều', 'Một {drink}. Chị không khó tính đâu, chị chỉ có tiêu chuẩn thôi'],
    ['Một {drink}. Chú không cười đâu, nhưng trong lòng chú vui đó', '{drink}. Chú cả đời chưa cười, ly này mà ngon chú suy nghĩ lại'],
    ['Bà đi chợ ngang qua. Cho bà {drink}, rồi bà góp ý vài câu thôi', '{drink} một ly. Hồi bà còn trẻ cà phê rẻ lắm, mà thôi, bà kể sau'],
    ['Yo, {drink}! Anh chê trước cho đỡ mất công: ly hơi nhỏ. Giờ pha đi', 'Một {drink}. Anh khó tính vì anh có gu, chứ không phải vì anh đói'],
    ['Một {drink}. Bớt 2 ngàn được không? Không à? Thôi, giá này cũng… chấp nhận', '{drink}. Anh có 3 căn nhà mặt tiền, nhưng ly này vẫn phải đúng giá nha'],
    ['Cho chị {drink}, để chị check-in đã rồi mới uống, ánh sáng đang đẹp', '{drink} nha. Chị chụp xong mới chê, chê xong mới khen, quy trình đó'],
  ]
  return {
    id: 'pho', headline: 'Hội khách cá tính phố Dốc', label: 'khách cá tính', foreign: false, weight: 0.6, patience: 1,
    blurb: 'Hội khách cá tính trên phố Dốc Mộng Mơ hay ghé, mỗi người một kiểu khó chiều dễ thương',
    names: chars.map((c) => c.name),
    look: () => pk(chars).look,
    greet: greets.flat(),
    impatient: [
      'Tíc tắc… tíc tắc… chị đếm từng giây đó nha',
      'Pha cà phê hay đang trồng cà phê vậy?',
      'Story của chị đang chờ ly nước đó',
      'Chậm vậy là định để tôi viết sớ hả?',
    ],
    good: [
      'Ngon. Nhưng tôi vẫn sẽ chê cái ghế',
      'Định chê mà tìm không ra chỗ chê. Bực ghê',
      'Hừm, lần này tha. Đừng có cười',
      'Ly hơi nhỏ, đá hơi nhiều, nhạc hơi to… mà thôi, ngon',
      'Không có gì để chê, thấy khó chịu ghê',
    ],
    meh: [
      'Tốc độ phục vụ ngang wifi nhà hàng xóm',
      'Đề nghị quán đổi tên thành “Đợi Hoài Coffee”',
      'Quán tên Dreamers đúng rồi, vì phục vụ nhanh chỉ có trong mơ',
      'Chờ ly nước mà như chờ người yêu cũ quay lại',
    ],
    chats: [],
    people: chars.map((c, i) => ({ name: c.name, look: c.look, greet: greets[i] ?? greets[0], album: `boss:${i}` })),
  }
}

/** Tất cả tên khách du lịch (cho album) */
export const INTL_NAMES = GUEST_GROUPS.flatMap((g) => g.names.map((n) => ({ name: n, group: g.label })))
