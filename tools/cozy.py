"""
Chép các sprite đang dùng trong game từ bộ "Brew & Bloom — 80 Free Props" (thư mục Cozy_World_Free_80, không đưa lên git)
sang public/assets/cozy/, cắt sát viền trong suốt để vẽ thẳng lên canvas 128x92.
Giấy phép bộ ảnh chỉ cho nhúng trong game, không phân phối lại nguyên bộ, nên chỉ chép đúng những món có trong SPRITES.

Chạy:  python3 tools/cozy.py   (cần Pillow: pip install pillow)
"""
import os
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'Cozy_World_Free_80', 'Cozy_World_Free_80', '32px', 'individual')
OUT = os.path.join(ROOT, 'public', 'assets', 'cozy')
# bộ gốc tông tối, đục; game vẽ màu pastel sáng nên nâng sáng + bão hoà cho hợp
BRIGHT, SAT = 1.18, 1.12

# tên trong game -> mã prop của bộ ảnh
SPRITES = {
    'sack': '0309',        # bao cà phê (thân quầy, nâng cấp Cà phê sạch Cầu Đất)
    'pot': '0321',         # chậu đất nung nhỏ (mặt quầy, khu ngồi)
    'boxwood': '0441',     # bụi cây tròn (chậu lớn trước quầy, góc khu ngồi)
    'tulip': '0461',       # khóm tulip trên bậu cửa sổ
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, pid in SPRITES.items():
        im = Image.open(os.path.join(SRC, f'prop_{pid}.png')).convert('RGBA')
        im = im.crop(im.getbbox())
        alpha = im.getchannel('A')
        im = ImageEnhance.Color(ImageEnhance.Brightness(im).enhance(BRIGHT)).enhance(SAT)
        im.putalpha(alpha)
        im.save(os.path.join(OUT, f'{name}.png'), optimize=True)
        print(f'{name:12s} prop_{pid}  {im.width}x{im.height}')


if __name__ == '__main__':
    main()
