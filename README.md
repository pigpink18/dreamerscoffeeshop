# ☕ Dreamers Coffee – Game kinh doanh quán cà phê

Game quản lý quán cà phê viết bằng **Vue 3 + TypeScript + Vite**, chạy trên trình duyệt và cài được lên điện thoại như app thật (PWA).

## Chạy trên máy

```bash
npm install
npm run dev          # mở http://localhost:5173
npm run dev -- --host   # mở trên điện thoại cùng mạng Wi-Fi (dùng địa chỉ Network hiện ra)
npm run build        # build ra thư mục dist/
npm run preview      # chạy thử bản build (có service worker / offline)
```

## Đưa lên GitHub Pages

1. Chuyển file workflow vào đúng chỗ (chỉ làm 1 lần):
   ```bash
   mkdir -p .github/workflows
   mv deploy-github-pages.yml .github/workflows/deploy.yml
   ```
2. Tạo repo mới trên GitHub (ví dụ `dreamers-coffee`), rồi trong thư mục này:
   ```bash
   git init
   git add .
   git commit -m "Dreamers Coffee v1"
   git branch -M main
   git remote add origin https://github.com/<ten-ban>/dreamers-coffee.git
   git push -u origin main
   ```
3. Trên GitHub: **Settings → Pages → Source: GitHub Actions**.
4. Đợi tab **Actions** chạy xong (~1 phút). Game sẽ ở `https://<ten-ban>.github.io/dreamers-coffee/`.
5. Mở link trên điện thoại:
   - **iPhone (Safari):** Chia sẻ → *Thêm vào MH chính*
   - **Android (Chrome):** bấm *Cài đặt* trong game hoặc menu ⋮ → *Cài đặt ứng dụng*

Mỗi lần `git push`, game tự cập nhật.

## Cấu trúc code

```
src/
  game/
    data.ts        # Dữ liệu: nguyên liệu, công thức, nâng cấp, thời tiết, câu thoại, khách quen
    audio.ts       # Hiệu ứng âm thanh + nhạc lofi tự sinh (Web Audio)
    store.ts       # State (reactive), lưu/đọc localStorage, vòng lặp mô phỏng ngày bán
  components/
    TopBar.vue     # Thanh trên: tiền, ngày/giờ, danh tiếng
    TabBar.vue     # Thanh tab dưới đáy kiểu app
    ShopView.vue   # Màn chuẩn bị + màn đang bán (khách xếp hàng, chạm để pha)
    StockView.vue  # Nhập nguyên liệu
    MenuView.vue   # Chỉnh giá bán, mở khoá món mới
    UpgradeView.vue# Nâng cấp quán, thành tích, chơi lại
    DayReport.vue  # Bảng tổng kết cuối ngày
    BrewSheet.vue  # Quầy pha chế từng bước
    DialogueSheet.vue # Hội thoại với khách, tám chuyện
    AppView.vue    # App DreamersFood: đánh giá, khách quen, tác động xã hội
    InstallHint.vue# Gợi ý "cài như app"
    Toasts.vue     # Thông báo nhỏ
  App.vue, main.ts, style.css
vite.config.ts     # Cấu hình PWA (manifest, icon, service worker offline)
```

## Cách chơi

- **Kho:** nhập nguyên liệu (cà phê, sữa, đá, ly…). Đá tan hết cuối ngày nếu chưa có tủ đông.
- **Menu:** chỉnh giá, xem công thức từng bước. Rẻ → tăng danh tiếng; đắt → lời nhiều nhưng khách có thể bỏ đi.
- **Quán (đứng quầy):** bấm *Mở cửa*. Khách bước tới quầy, gọi món bằng thoại kiểu Việt.
  - Chọn **Nhận order** (hoặc *Tám chuyện xíu* trước để khách thân hơn).
  - Bấm **từng nguyên liệu** ở khay bên dưới (ly, đá, sữa, matcha, trà, đào, syrup, kem…) theo công thức hiện ở thanh trên khay.
  - Dùng **máy espresso (Chiết xuất)**, **shaker (Lắc)**, **máy xay (Xay)**, **Khuấy**. Sai bước thì rung; *Đổ bỏ* để pha lại.
  - Xong hiện **ly thành phẩm**, khách cầm lên uống, trả tiền + tip và **review hài hước** (có khen có chê).
  - Khách chờ lâu sẽ “cà khịa” kiểu Gen Z rồi bỏ về.
- **📖 Truyện mở đầu:** lần đầu mở game sẽ có cutscene pixel từng cảnh: **Yến**, 24 tuổi, bỏ deadline Hà Nội vào Đà Lạt, gặp bé corgi mập lông muối tiêu **Cáo** và cùng mở **Dreamers Coffee**. Bấm vào chữ *DREAMERS COFFEE* trên thanh trên cùng để xem lại.
- **🎁 Mỗi ngày một món mới:** bán xong 1 ngày là mở khoá thêm 1 món (kèm nguyên liệu dùng thử), đến khi đủ 11 món.
- **👑 Boss:** những vị khách cực khó tính (Jessica Tổ Quạ, Chú Johnny Ria Mép, Bà Mary Lô Cuốn, Tony Mào Gà, Đại Gia Bill Keo, Cô Selena Nón Rộng) chen ngang hàng, gọi món khó, và chỉ cho **rất ít thời gian**. Nhạc quán chuyển sang bản hồi hộp.
  - Số boss mỗi ngày theo sao của quán: quán mới / dưới 1.5★ → 1 boss; ~2★ → 2; ~3★ → 3; ~4★ → 4; 4.5★ trở lên → 5 boss/ngày.
  - Kịp giờ: 5 sao + thưởng lớn, nhưng boss vẫn mặt nặng mày nhẹ. Trễ giờ: 1 sao kèm review xéo sắc, mất danh tiếng.
- **💬 Tám chuyện:** hơn 60 chủ đề, mỗi chủ đề có 3 kiểu trả lời: ngọt ngào · 😏 xéo sắc · cụt lủn. Kho thoại và review châm biếm nằm trong `src/game/chatter.ts`, thêm thoải mái.
- **Khách quen:** Linda Na, Kenny Sang, Cô Ba Xôi Gấc, Huy Sơ Rum, Jenny Vy Vu, Tomy Tèo… Thân dần: Người lạ → Khách quen → Bạn thân (tip nhiều, kiên nhẫn hơn).
- **Nhân viên:** thuê ở tab Nâng cấp. Bạn lo khách đứng đầu quầy, nhân viên tự pha cho khách xếp hàng phía sau và đơn app (khung “NV1/NV2” trên cảnh quán cho biết đang pha gì). Mỗi nhân viên làm quán đông thêm 15%.
- **Đơn app DreamersFood:** thuê *Shipper rapper* để nhận đơn online. Pha xong shipper vừa giao vừa rap; khách chấm sao & review. Trời mưa nhiều đơn hơn.
- **Giá trị xã hội:** *Sống xanh* (bỏ ly nhựa), *Cà phê sạch Cầu Đất* (mua thẳng từ nông dân). Xem tác động ở tab **Khách**.
- **Âm thanh:** nhạc nền là các vòng nhạc chiptune CC0 của *Abstraction* (Rabbit Town, Penguin Town, Three Red Hearts, Sanctuary, Puzzle Pieces), tự đổi bài theo sáng/chiều/tối hoặc chọn bài bằng nút 🎵. Hiệu ứng pha chế tự tổng hợp bằng Web Audio. Bật/tắt ở góc trên.
- Cuối ngày trừ tiền mặt bằng + lương. Âm tiền là phá sản!

Chỉnh độ khó / thêm thoại: sửa `src/game/data.ts` (giá, công thức, câu thoại `LINES`, `REGULARS`, `REVIEWS`, `RAPS`…).

## Ghi công hình ảnh

- Máy espresso, shaker, máy xay, ly shot: **FREE Pixel Art Bar and Cafe Items Pack** – KARSIORI STUDIO (CC0) – https://karsiori.itch.io/free-pixel-art-bar-and-cafe-items-pack
- Nền quán, quầy, nhân vật, icon nguyên liệu, ly nước: vẽ pixel bằng code trong `src/game/pixel.ts`.
- Chậu cây, bụi cây, khóm tulip, bao cà phê: **Brew & Bloom — 80 Free Props** (cho dùng thương mại, không phân phối lại nguyên bộ). Bộ gốc để ở `Cozy_World_Free_80/` (không đưa lên git); chỉ những món dùng được chép vào `public/assets/cozy/` bằng `python3 tools/cozy.py` (cần Pillow).

## Ghi công âm nhạc

- Nhạc nền + nhạc boss (“Out of Time”): **Abstraction** – Music Loop Bundle (chiptune), Tallbeard Studios – **CC0** – https://tallbeard.itch.io/music-loop-bundle · https://abstractionmusic.com/
  File: `public/assets/music/` (OGG gốc + bản M4A cho Safari/iPhone cũ). Giấy phép: `public/assets/music/LICENSE-tallbeard.txt`.

## Dữ liệu người chơi (nhiều người chơi)

- Game không có server: tiến trình lưu trong **localStorage của từng trình duyệt trên từng máy** (khoá `coffee-tycoon-save-v1`). Mỗi người mở link GitHub Pages trên máy/điện thoại của mình sẽ có **quán riêng**, không ai thấy hay ghi đè dữ liệu của ai.
- Dữ liệu đang test trên máy dev (localhost) cũng tách riêng với bản trên GitHub Pages vì khác địa chỉ web.
- Mỗi bản lưu có tên chủ quán (`player`, nhập ở màn mở đầu) và mã ngẫu nhiên `playerId`.
- Lưu ý: xoá dữ liệu trình duyệt / chế độ ẩn danh sẽ mất tiến trình. Muốn đồng bộ giữa nhiều máy cần thêm backend (ví dụ Firebase/Supabase) sau này.

## Chơi dài hạn (bản cập nhật lớn)

- **Đua top phố:** tab *Đua top* – Dreamers Coffee cạnh tranh với 5 quán đối thủ trên Phố Dốc Mộng Mơ. Mỗi ngày tính *điểm phố* (ly bán, ly pha chuẩn, boss thắng, doanh thu, sao). Ngày 7, 14, 21… là **Ngày hội Barista** (điểm x2) và chốt bảng tuần, thưởng hạt vàng + tiền. Hạng càng cao càng đông khách; đối thủ mạnh dần mỗi tuần. Mỗi sáng có "tin phố" (đối thủ khuyến mãi, dính phốt…) ảnh hưởng lượng khách.
- **Nhiệm vụ ngày & thành tựu:** tab *Sổ tay* – 3 nhiệm vụ đổi mỗi ngày, gần 30 thành tựu dài hạn. Thưởng **hạt vàng**.
- **Album khách:** sưu tầm khách quen, boss, khách vãng lai và **8 khách hiếm** (chỉ ghé theo thời tiết/giờ, ví dụ Bóng Ma Sương Mù chỉ hiện tối trời mưa).
- **Công thức bí mật:** Menu › *Phòng thử món* – tự xếp thứ tự nguyên liệu để tìm 6 món ẩn (cà phê trứng, cà phê cốt dừa, Sương Mù Đà Lạt…). Gợi ý nhận từ khách hiếm, nhiệm vụ, thành tựu. Có thêm nguyên liệu cốt dừa, kem trứng, cacao.
- **Thuê mặt bằng:** Nâng cấp › *Mặt bằng* – Quầy nhỏ → Quán gác gỗ đồi thông → Dreamers Flagship (bảng menu lớn, đèn thả, tường gạch men, tủ bánh, ghế bar). Khách đông hơn, tiền thuê cao hơn.
- **Tiệm của Cáo:** dùng hạt vàng mua mũ, kính, khăn, áo cho Cáo và đồ trang trí quán (thấy ngay trong cảnh, +% khách).

## Bảng xếp hạng online (tuỳ chọn)

Mặc định tắt, game vẫn chơi offline. Muốn mọi người chơi trên nhiều máy so điểm với nhau:

1. Tạo tài khoản miễn phí ở https://supabase.com → **New project**.
2. Vào **SQL Editor**, dán và chạy:

```sql
create table public.leaderboard (
  player_id text primary key,
  name text not null,
  score integer not null default 0,
  day integer not null default 0,
  stars real not null default 0,
  premise integer not null default 0,
  updated_at timestamptz not null default now()
);
create table public.lb_secret (player_id text primary key, token text not null);
alter table public.leaderboard enable row level security;
alter table public.lb_secret enable row level security;
create policy "ai cung xem duoc" on public.leaderboard for select using (true);

create or replace function public.submit_score(p_id text, p_token text, p_name text, p_score int, p_day int, p_stars real, p_premise int)
returns void language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if length(p_name) > 24 or p_score < 0 or p_score > 10000000 then raise exception 'bad input'; end if;
  select token into t from lb_secret where player_id = p_id;
  if t is null then insert into lb_secret(player_id, token) values (p_id, p_token);
  elsif t <> p_token then raise exception 'forbidden'; end if;
  insert into leaderboard(player_id, name, score, day, stars, premise, updated_at)
  values (p_id, p_name, p_score, p_day, p_stars, p_premise, now())
  on conflict (player_id) do update set name = excluded.name, score = excluded.score, day = excluded.day,
    stars = excluded.stars, premise = excluded.premise, updated_at = now();
end $$;
grant execute on function public.submit_score to anon;
```

3. Vào **Project Settings › API**, chép *Project URL* và *anon public key* vào `src/game/onlineConfig.ts`.
4. `git add . && git commit -m "bat bang xep hang" && git push` – xong. Mỗi máy tự gửi điểm sau mỗi ngày bán.
