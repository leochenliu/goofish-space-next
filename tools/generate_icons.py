#!/usr/bin/env python3
"""生成 Chrome 扩展图标（amber 圆角底 + 白色双箭头 = 下一页）。
纯代码绘制，超采样后 LANCZOS 缩放，保证 16px 下也清晰。
用法: python tools/generate_icons.py
"""
import os
from PIL import Image, ImageDraw, ImageFont

S = 512                              # 超采样画布
BG = (255, 196, 0, 255)              # 闲鱼风 amber
FG = (255, 255, 255, 255)            # 白色箭头
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
SIZES = [16, 32, 48, 128]


def _font(size):
    for p in (r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\msyh.ttc",
              r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def draw_master():
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 圆角底
    radius = int(S * 0.22)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=BG)

    # 双箭头 ">>"
    w = 68
    r = w / 2
    chevrons = [
        [(168, 138), (300, 256), (168, 374)],
        [(268, 138), (400, 256), (268, 374)],
    ]
    for pts in chevrons:
        d.line(pts, fill=FG, width=w, joint="curve")
        for (x, y) in pts:                      # 圆头端点
            d.ellipse([x - r, y - r, x + r, y + r], fill=FG)
    return img


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    master = draw_master()
    for s in SIZES:
        out = os.path.join(OUT_DIR, f"icon{s}.png")
        master.resize((s, s), Image.LANCZOS).save(out)
        print("wrote", out, f"{s}x{s}")

    # 商店可选：440x280 小型宣传图块
    tile = Image.new("RGBA", (440, 280), BG)
    icon = master.resize((140, 140), Image.LANCZOS)
    tile.alpha_composite(icon, (36, (280 - 140) // 2))
    d = ImageDraw.Draw(tile)
    big = _font(46)
    small = _font(21)
    d.text((206, 92), "空格翻页", font=big, fill=(90, 62, 0, 255))
    d.text((208, 152), "Goofish 搜索页", font=small, fill=(120, 86, 0, 255))
    d.text((208, 180), "空格 = 下一页", font=small, fill=(120, 86, 0, 255))
    tile_path = os.path.join(OUT_DIR, "promo_440x280.png")
    tile.convert("RGB").save(tile_path)
    print("wrote", tile_path, "440x280")


if __name__ == "__main__":
    main()
