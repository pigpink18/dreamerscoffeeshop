# Vẽ 6 BOSS pixel art 24x32 bằng các hình cơ bản (elip, chữ nhật bo góc) rồi xuất ra src/game/bossArt.ts
# Chạy: python3 tools/bosses.py
W, H = 24, 32
CX = 11.5  # trục giữa (đối xứng trái / phải)

class G:
    def __init__(s): s.g = [['.'] * W for _ in range(H)]
    def set(s, x, y, c, sym=False):
        for X in ([x, 23 - x] if sym else [x]):
            if 0 <= X < W and 0 <= y < H: s.g[y][X] = c
    def get(s, x, y): return s.g[y][x] if 0 <= x < W and 0 <= y < H else '.'
    def hline(s, x0, x1, y, c, sym=False):
        for x in range(x0, x1 + 1): s.set(x, y, c, sym)
    def vline(s, x, y0, y1, c, sym=False):
        for y in range(y0, y1 + 1): s.set(x, y, c, sym)
    def rect(s, x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1): s.hline(x0, x1, y, c)
    def ellipse(s, cx, cy, rx, ry, c, out='o', only=None):
        """elip đặc có viền 1px; only(x,y) để giới hạn vùng vẽ"""
        inside = lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0
        pts = [(x, y) for y in range(H) for x in range(W) if inside(x, y) and (only is None or only(x, y))]
        P = set(pts)
        for x, y in pts:
            edge = any((x + dx, y + dy) not in P for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            s.set(x, y, out if (edge and out) else c)
    def paint(s, rows, ox=0, oy=0):
        for y, line in enumerate(rows):
            for x, ch in enumerate(line):
                if ch != ' ': s.set(x + ox, y + oy, ch)
    def rows(s): return [''.join(r) for r in s.g]

# ---------- đầu + mặt chuẩn ----------
def head(g, top=5, bottom=18, x0=5, x1=18, chin=True):
    """đầu bo tròn (viền o), da s, bóng S phía dưới 2 bên"""
    for y in range(top, bottom + 1):
        inset = 0
        if y == top: inset = 3
        elif y == top + 1: inset = 1
        elif y >= bottom - 1 and chin: inset = 2 if y == bottom else 1
        a, b = x0 + inset, x1 - inset
        g.hline(a, b, y, 's')
        g.set(a - 1, y, 'o'); g.set(b + 1, y, 'o')
    g.hline(x0 + 3, x1 - 3, top - 1, 'o')
    g.hline(x0 + 2, x1 - 2, bottom + 1, 'o')
    # bóng má dưới + cằm
    for y in range(bottom - 3, bottom + 1): g.set(x0 + (1 if y < bottom - 1 else 2), y, 'S', sym=True)
    g.hline(x0 + 3, x1 - 3, bottom, 'S')
    # tai
    for y in (11, 12, 13):
        g.set(x0 - 1, y, 's', sym=True); g.set(x0 - 2, y, 'o', sym=True)
    g.set(x0 - 1, 12, 'S', sym=True)
    g.set(x0 - 1, 10, 'o', sym=True); g.set(x0 - 1, 14, 'o', sym=True)

EYE_L, EYE_R, EYE_Y = 8, 14, 12  # con ngươi 2x2: (8..9, 12..13) và (14..15, 12..13)
def eyes(g, big=False):
    for ex in (EYE_L, EYE_R):
        g.rect(ex, EYE_Y, ex + 1, EYE_Y + 1, 'e')
        g.set(ex if ex == EYE_L else ex + 1, EYE_Y, 'w')  # ánh sáng trong mắt
        if big: g.rect(ex - 1, EYE_Y - 1, ex + 2, EYE_Y + 2, 'e'); g.set(ex, EYE_Y - 1, 'w'); g.set(ex + 1, EYE_Y - 1, 'w')
def brows(g, col='o', y=10, thick=False, frown=True):
    g.hline(7, 9, y, col); g.hline(14, 16, y, col)
    if frown: g.set(9, y + 1, col); g.set(14, y + 1, col)  # nhíu mày (khó tính)
    if thick: g.hline(7, 9, y - 1, col); g.hline(14, 16, y - 1, col)
def nose(g): g.set(11, 14, 'S'); g.set(12, 15, 'S'); g.set(11, 15, 'S')
def mouth(g, kind='flat', col='m'):
    if kind == 'flat': g.hline(10, 13, 17, col)
    if kind == 'frown': g.hline(10, 13, 16, col); g.set(9, 17, col); g.set(14, 17, col)
    if kind == 'lips': g.hline(10, 13, 16, 'r'); g.hline(11, 12, 17, 'R'); g.set(10, 17, 'r'); g.set(13, 17, 'r')
    if kind == 'smirk': g.hline(10, 13, 17, col); g.set(14, 16, col)
def blush(g): g.hline(6, 7, 15, 'b', sym=True)

# ---------- thân: vai tròn, tay 2 bên ----------
def body(g, neck=True, belly=False):
    if neck:
        g.rect(9, 19, 14, 20, 'S'); g.set(8, 19, 'o'); g.set(15, 19, 'o')
    top = 20
    for y in range(top, H):
        w = {0: 7, 1: 9, 2: 10}.get(y - top, 11)
        if belly and y >= 26: w = 11
        a, b = 12 - w - 1, 11 + w + 1
        a = max(a, 0); b = min(b, 23)
        g.hline(a + 1, b - 1, y, 'C')
        g.set(a, y, 'o'); g.set(b, y, 'o')
    g.hline(5, 18, top - 0, 'C'); g.hline(4, 6, top, 'o'); g.hline(17, 19, top, 'o')
    g.hline(5, 8, top, 'o'); g.hline(15, 18, top, 'o')
    # sáng trên vai, bóng tay
    g.hline(3, 6, 21, 'E', sym=True); g.set(2, 22, 'E', sym=True)
    for y in range(24, H): g.set(5, y, 'D', sym=True)
    for y in range(26, H): g.set(6, y, 'o', sym=True)  # khe giữa tay và thân

def out(name, g, pal):
    return name, g.rows(), pal

# ================= 6 BOSS =================
def b_afro():
    g = G()
    # tóc xù tròn to, phồng hẳn lên trên và 2 bên
    g.ellipse(CX, 9.0, 11.9, 9.8, 'H')
    # các lọn xoăn: chấm sáng + bóng
    for (x, y) in [(4, 3), (8, 1), (13, 1), (17, 2), (20, 6), (2, 7), (6, 6), (16, 6), (11, 3), (1, 12), (21, 11), (3, 16), (19, 16), (20, 14), (2, 14)]:
        g.set(x, y, 'J'); g.set(x + 1, y, 'J'); g.set(x + 1, y + 1, 'I')
    head(g)
    # mái xoăn che trán (mép dưới lượn sóng)
    g.hline(5, 18, 5, 'H'); g.hline(5, 18, 6, 'H')
    for x in (5, 6, 7, 9, 10, 13, 14, 16, 17, 18): g.set(x, 7, 'H')
    for x in (8, 11, 12, 15): g.set(x, 7, 'I')
    g.set(7, 5, 'J'); g.set(8, 5, 'J'); g.set(14, 6, 'J'); g.set(15, 6, 'J')
    for y in range(8, 17): g.set(4, y, 'H', sym=True)
    g.set(5, 8, 'H', sym=True); g.set(5, 9, 'I', sym=True)
    eyes(g); brows(g, frown=True); nose(g); mouth(g, 'lips'); blush(g)
    # kính mắt mèo hồng: viền quanh mắt, mắt vẫn thấy rõ, 2 đuôi kính vểnh
    for ex in (EYE_L, EYE_R):
        g.hline(ex - 1, ex + 2, 11, 'A'); g.hline(ex - 1, ex + 2, 14, 'A'); g.vline(ex - 1, 11, 14, 'A'); g.vline(ex + 2, 11, 14, 'A')
    g.hline(11, 12, 12, 'A'); g.set(6, 10, 'A'); g.set(5, 10, 'A'); g.set(17, 10, 'A'); g.set(18, 10, 'A')
    # bông tai vòng vàng
    for y in (14, 15, 16): g.set(2, y, 'g', sym=True)
    g.set(3, 17, 'g', sym=True)
    body(g)
    # cổ áo chữ V + chuỗi ngọc
    g.paint(["oSSSSo", " oSSo ", "  oo  "], 9, 20)
    for x in (8, 10, 13, 15): g.set(x, 21, 'W')
    g.set(9, 22, 'W'); g.set(14, 22, 'W')
    g.hline(2, 4, 23, 'D', sym=True)
    return out('afro', g, {'s': '#f3cfae', 'S': '#dba985', 'H': '#8e4fc4', 'I': '#6a3496', 'J': '#c39ae9', 'C': '#ff7aa8', 'D': '#d8577f', 'E': '#ffb1cb', 'A': '#e0186a', 'W': '#fff4f8'})

def b_mustache():
    g = G()
    head(g, top=4)
    # hói bóng: vệt sáng trên đỉnh
    g.hline(9, 12, 5, 'h'); g.hline(8, 9, 6, 'h')
    # tóc hoa râm 2 bên + 3 sợi vuốt ngang mảnh (thấy da đầu giữa các sợi)
    for y in range(9, 14): g.set(4, y, 'H', sym=True); g.set(5, y, 'I', sym=True)
    g.set(5, 8, 'H', sym=True)
    g.hline(8, 15, 6, 'H'); g.hline(6, 13, 8, 'H'); g.set(16, 7, 'H'); g.set(5, 7, 'H')
    eyes(g)
    # lông mày rậm (2 hàng), nhíu
    g.hline(7, 10, 10, 'H'); g.hline(13, 16, 10, 'H'); g.hline(7, 9, 9, 'H'); g.hline(14, 16, 9, 'H')
    # mũi to
    g.hline(11, 12, 14, 'S'); g.set(10, 15, 'S'); g.set(13, 15, 'S')
    # ria mép to vểnh 2 đầu
    g.hline(9, 14, 15, 'H'); g.hline(7, 16, 16, 'H'); g.set(6, 15, 'H'); g.set(17, 15, 'H'); g.set(6, 14, 'H'); g.set(17, 14, 'H')
    g.hline(10, 13, 16, 'I')
    g.hline(10, 13, 17, 'm')  # miệng dưới ria
    body(g, belly=True)
    # áo polo: cổ bẻ trắng + 2 nút
    g.paint(["ooWWWo  oWWWoo", "  oWWWooWWWo  ", "    ooSSoo    "], 5, 19)
    g.set(11, 22, 'o'); g.set(11, 23, 'W'); g.set(11, 25, 'W')
    g.hline(9, 14, 30, 'D')  # bụng phệ
    return out('mustache', g, {'s': '#e2b089', 'S': '#c48b63', 'h': '#f6d7b8', 'H': '#5a5048', 'I': '#3a322b', 'C': '#6b8e23', 'D': '#4f6b16', 'E': '#94b84a', 'W': '#f4f1ea'})

def b_curlers():
    g = G()
    g.ellipse(CX, 8, 9.6, 6.6, 'H')  # tóc phồng
    head(g)
    for y in range(6, 15): g.set(4, y, 'H', sym=True)
    g.hline(6, 17, 5, 'H'); g.hline(6, 8, 6, 'H'); g.hline(15, 17, 6, 'H'); g.hline(9, 14, 6, 'I')
    # 4 lô cuốn tóc hồng / xanh
    for i, x in enumerate((3, 8, 13, 18)):
        col = 'A' if i % 2 == 0 else 'B'
        g.rect(x, 1, x + 2, 3, col); g.hline(x, x + 2, 0, 'o'); g.hline(x, x + 2, 4, 'o'); g.set(x - 1, 2, 'o'); g.set(x + 3, 2, 'o')
        g.set(x + 1, 2, 'W'); g.set(x - 1, 1, 'o'); g.set(x + 3, 3, 'o')
    eyes(g); nose(g); mouth(g, 'lips'); brows(g, y=9)
    # kính tròn gọng dày (đít chai): tròng hơi xanh quanh mắt
    for ex in (EYE_L, EYE_R):
        for (x, y) in [(ex - 1, 11), (ex + 2, 11), (ex - 1, 12), (ex + 2, 12), (ex - 1, 13), (ex + 2, 13), (ex, 14), (ex + 1, 14), (ex, 11), (ex + 1, 11)]: g.set(x, y, 'l')
        g.hline(ex, ex + 1, 10, 'G'); g.hline(ex, ex + 1, 15, 'G'); g.vline(ex - 2, 11, 14, 'G'); g.vline(ex + 3, 11, 14, 'G')
        g.set(ex - 1, 10, 'G'); g.set(ex + 2, 10, 'G'); g.set(ex - 1, 14, 'G'); g.set(ex + 2, 14, 'G')
    g.hline(11, 12, 12, 'G')
    # nếp nhăn khoé mắt
    g.set(5, 13, 'S', sym=True)
    body(g)
    # khăn quàng chấm bi + áo bà ba có hàng nút
    g.paint(["  oBBBBBBBBBBo  ", " oBWBBBWBBBWBBo ", "  oBBBo  oBBBo  ", "        oBBo    ", "        oBWo    ", "        oBBo    "], 4, 18)
    for y in (24, 26, 28, 30): g.set(11, y, 'W')
    g.vline(12, 24, 31, 'D')
    return out('curlers', g, {'s': '#eac3a0', 'S': '#c99a74', 'H': '#6b4630', 'I': '#4a2f1f', 'A': '#ff8fb8', 'B': '#f05d8e', 'W': '#ffffff', 'C': '#2fa38c', 'D': '#1f7a68', 'E': '#62c9b3', 'l': '#d9f1ff', 'G': '#7a5c46'})

def b_mohawk():
    g = G()
    head(g)
    # 2 bên cạo trọc (xanh lún phún)
    for y in range(6, 12): g.set(5, y, 'T', sym=True); g.set(6, y, 'T', sym=True)
    # mào gà: quạt gai nhọn dựng đứng
    tops = {8: 4, 9: 2, 10: 0, 11: 1, 12: 0, 13: 1, 14: 2, 15: 4}
    for x, t in tops.items():
        g.vline(x, t, 7, 'H'); g.set(x, t - 1, 'o') if t > 0 else None
    for x in (10, 12): g.vline(x, 0, 3, 'J')
    for x in (11, 13): g.vline(x, 4, 7, 'I')
    g.vline(7, 4, 6, 'o'); g.vline(16, 4, 6, 'o')
    eyes(g); brows(g, frown=True); g.set(8, 10, 's')  # chân mày cắt khe
    nose(g); mouth(g, 'smirk')
    g.set(12, 15, 'G')  # khuyên mũi
    g.set(3, 12, 'G'); g.set(3, 13, 'G'); g.set(20, 11, 'G')  # khuyên tai
    g.hline(9, 14, 18, 'T')  # râu lún phún
    body(g)
    # áo khoác da: ve áo + áo thun trắng + dây xích bạc + đinh tán
    g.paint(["  oWWWWo  ", " oDWWWWDo ", "oDDoWWoDDo", "oDDoWWoDDo", " DDoWWoDD ", " DDoWWoDD "], 7, 20)
    g.hline(9, 14, 23, 'G'); g.set(11, 24, 'G'); g.set(12, 24, 'G')
    for x in (3, 5): g.set(x, 21, 'G', sym=True)
    return out('mohawk', g, {'s': '#f0c8a2', 'S': '#cf9f78', 'T': '#b9a28c', 'H': '#39d353', 'I': '#24913a', 'J': '#a8f5b5', 'C': '#262626', 'D': '#0c0c0c', 'E': '#4a4a4a', 'W': '#f4f4f0', 'G': '#d1d5db'})

def b_tycoon():
    g = G()
    head(g)
    # tóc vuốt keo bóng, rẽ ngôi
    g.ellipse(CX, 7, 8.2, 4.4, 'H', only=lambda x, y: y <= 9)
    for y in range(7, 12): g.set(4, y, 'H', sym=True)
    g.hline(7, 13, 4, 'J'); g.hline(6, 9, 5, 'J'); g.set(14, 5, 'I'); g.hline(8, 16, 8, 'H'); g.hline(9, 15, 9, 'I')
    # kính râm đen to bản
    g.hline(6, 17, 11, 'o')
    for ex in (EYE_L, EYE_R):
        g.rect(ex - 2, 12, ex + 2, 13, 'K'); g.hline(ex - 1, ex + 1, 14, 'K')
        g.set(ex - 1, 12, 'L'); g.set(ex, 12, 'L')
    g.set(11, 12, 'o'); g.set(12, 12, 'o')
    brows(g, y=10, frown=True)
    nose(g)
    # ria mỏng + nhếch mép + răng vàng
    g.hline(9, 14, 16, 'H'); g.set(8, 16, 'H'); g.set(15, 16, 'H')
    g.hline(10, 13, 17, 'm'); g.set(12, 17, 'Y')
    g.hline(8, 15, 19, 'S')  # nọng cằm
    body(g)
    # vest đỏ đô, ve áo, sơ mi trắng, cà vạt vàng, dây chuyền vàng to
    g.paint(["  oWWWWo  ", " DoWAAWoD ", "DDoWWAAWWoDD"[1:11], "DDoWWAAWoD", " DoWWAAWoD", " DoWWAWWoD", " Do WWWW oD"[0:10]], 7, 20)
    for x, y in [(8, 21), (9, 22), (10, 23), (13, 23), (14, 22), (15, 21), (11, 24), (12, 24)]: g.set(x, y, 'Y')
    g.rect(2, 28, 3, 29, 'Y'); g.rect(20, 28, 21, 29, 'Y')  # đồng hồ vàng
    g.set(4, 24, 'W', sym=True)  # khăn túi áo
    return out('tycoon', g, {'s': '#e2b089', 'S': '#c48b63', 'H': '#161616', 'I': '#000000', 'J': '#6c6c7a', 'C': '#8e1b2c', 'D': '#5e0f1b', 'E': '#b84a5b', 'W': '#f6f3ec', 'A': '#f2c14e', 'Y': '#ffd34d', 'K': '#121212', 'L': '#7d8da3'})

def b_sunhat():
    g = G()
    # tóc dài đen xoã tới vai (vẽ trước, đầu đè lên)
    g.rect(4, 8, 19, 22, 'H'); g.vline(3, 9, 22, 'o'); g.vline(20, 9, 22, 'o'); g.hline(4, 6, 23, 'o'); g.hline(17, 19, 23, 'o')
    g.vline(5, 12, 22, 'I'); g.vline(18, 12, 22, 'I')
    head(g)
    # nón rộng vành
    g.ellipse(CX, 7.2, 12.0, 2.2, 'N')
    g.ellipse(CX, 4.5, 6.2, 4.4, 'N', only=lambda x, y: y <= 7)
    g.hline(7, 16, 5, 'R'); g.hline(7, 16, 6, 'R')  # ruy băng
    g.rect(15, 3, 17, 5, 'F'); g.set(16, 4, 'Y'); g.set(14, 4, 'F')  # bông hoa
    g.hline(1, 22, 8, 'M'); g.hline(0, 0, 7, 'o')
    # mái tóc dưới vành nón
    g.hline(6, 17, 9, 'H'); g.hline(6, 9, 10, 'H'); g.hline(15, 17, 10, 'H')
    # kính mát gọng to (tròng sẫm)
    for ex in (EYE_L, EYE_R):
        g.rect(ex - 1, 11, ex + 2, 14, 'K'); g.hline(ex - 1, ex + 2, 10, 'o'); g.hline(ex, ex + 1, 15, 'o'); g.vline(ex - 2, 11, 13, 'o'); g.vline(ex + 3, 11, 13, 'o')
        g.set(ex - 1, 11, 'L'); g.set(ex, 11, 'L'); g.set(ex - 1, 14, 'o'); g.set(ex + 2, 14, 'o')
    g.hline(11, 12, 11, 'o'); g.set(5, 10, 'A'); g.set(18, 10, 'A')
    mouth(g, 'lips'); blush(g)
    g.set(2, 14, 'g', sym=True); g.set(2, 15, 'g', sym=True)  # bông tai
    body(g)
    # váy 2 dây: vai da trần
    g.paint(["oSSSSSSSSo", "SSSSSSSSSS", "oSSSSSSSSo", " ooo  ooo "], 7, 20)
    for y in (20, 21, 22): g.set(6, y, 'C', sym=True)
    # điện thoại trên tay phải (để check-in)
    g.paint(["oooo", "oZZo", "oZWo", "oZZo", "oooo"], 19, 23)
    g.rect(18, 26, 19, 27, 's')
    return out('sunhat', g, {'s': '#f6d3b3', 'S': '#dcaa83', 'H': '#2b1d16', 'I': '#170f0b', 'N': '#f2dcae', 'M': '#c9a46a', 'R': '#e85a5a', 'F': '#ff6b9a', 'Y': '#ffd34d', 'C': '#f2c14e', 'D': '#d9a12b', 'E': '#ffe08a', 'A': '#e23c3c', 'K': '#2a2a33', 'L': '#8b98ad', 'Z': '#5b8bd9', 'W': '#ffffff'})

BOSSES = [b_afro, b_mustache, b_curlers, b_mohawk, b_tycoon, b_sunhat]
COMMON = {'o': '#3b2a20', 'e': '#2b1d16', 'w': '#ffffff', 'm': '#8a3a2a', 'b': '#ff9aa8', 'r': '#d81b3c', 'R': '#a3122b', 'W': '#ffffff', 'g': '#f2c14e', 'h': '#fde6cf'}

if __name__ == '__main__':
    ts = ["// 6 BOSS pixel art 24x32 (sinh bởi tools/bosses.py — sửa ở đó rồi chạy lại: python3 tools/bosses.py)",
          "// Ký tự = màu trong bảng màu; '.' = trong suốt. Biểu cảm (lườm / tức / cười / chớp mắt) vẽ thêm ở bossSprites.ts",
          "export const BOSS_W = 24", "export const BOSS_H = 32",
          f"export const BOSS_FACE = {{ eyeL: {EYE_L}, eyeR: {EYE_R}, eyeY: {EYE_Y} }}",
          "export interface BossArt { id: string; pal: Record<string, string>; grid: string[] }",
          "export const BOSS_ART: BossArt[] = ["]
    for fn in BOSSES:
        bid, rows, pal = fn()
        full = dict(COMMON); full.update(pal)
        used = sorted({ch for r in rows for ch in r if ch != '.'})
        missing = [c for c in used if c not in full]
        if missing: raise SystemExit(f'{bid}: thiếu màu {missing}')
        assert all(len(r) == W for r in rows) and len(rows) == H
        ts.append(f"  {{ id: '{bid}', pal: {{ {', '.join(f'{k}: {chr(39)}{full[k]}{chr(39)}' for k in used)} }}, grid: [")
        ts += [f"    '{r}'," for r in rows]
        ts.append("  ] },")
    ts.append("]\n")
    open('src/game/bossArt.ts', 'w').write('\n'.join(ts))
    print('ok', len(BOSSES))
