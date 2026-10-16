#!/usr/bin/env python3
"""生成 Chrome 应用商店截图（宣传版）。
规格：1280x800，24-bit PNG（无 alpha）/ 同时输出 JPEG。纯代码绘制，不涉及生图 API。
用法: python tools/make_screenshots.py
输出: screenshots/*.png 与 screenshots/*.jpg
"""
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 800
AMBER = (255, 196, 0)
INK = (74, 52, 0)
INK2 = (150, 110, 0)
BG = (255, 254, 248)
WHITE = (255, 255, 255)
BORDER = (240, 226, 180)
SHADOW = (238, 228, 203)
GRAY = (158, 158, 158)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "screenshots")
ICON = os.path.join(ROOT, "icons", "icon128.png")

FONT_PATHS = [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\msyh.ttc",
              r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\arial.ttf"]


def font(size):
    for p in FONT_PATHS:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()


def ctext(d, cx, y, s, f, fill):
    l, t, r, b = d.textbbox((0, 0), s, font=f)
    d.text((cx - (r - l) / 2 - l, y), s, font=f, fill=fill)


def wrap(d, text, f, maxw):
    lines, cur = [], ""
    for ch in text:
        if d.textlength(cur + ch, font=f) <= maxw:
            cur += ch
        else:
            lines.append(cur)
            cur = ch
    if cur:
        lines.append(cur)
    return lines


def paste_icon(img, size, xy):
    icon = Image.open(ICON).convert("RGBA").resize((size, size), Image.LANCZOS)
    img.paste(icon, xy, icon)


def shot_hero():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    paste_icon(img, 150, (90, 108))
    d.text((272, 118), "Goofish 空格翻页", font=font(64), fill=INK)
    d.text((276, 212), "闲鱼搜索页 · 空格键翻到下一页", font=font(34), fill=INK2)

    box = (330, 372, 950, 512)
    d.rounded_rectangle((box[0], box[1] + 10, box[2], box[3] + 10), radius=26, fill=SHADOW)
    d.rounded_rectangle(box, radius=26, fill=WHITE, outline=(224, 200, 140), width=5)
    ctext(d, (box[0] + box[2]) / 2, box[1] + 44, "空格  Space", font(46), INK)

    d.ellipse((1000, 392, 1064, 456), outline=AMBER, width=8)
    ctext(d, 1032, 396, "\u00bb", font(40), AMBER)

    ctext(d, W / 2, 600, "焦点在页面空白处，按空格 = 点击右下角翻页箭头", font(30), INK2)

    pill = "Chrome 扩展 · Manifest V3 · 不收集任何数据"
    f = font(24)
    l, t, r, b = d.textbbox((0, 0), pill, font=f)
    w = r - l
    d.rounded_rectangle((W / 2 - w / 2 - 30, 700, W / 2 + w / 2 + 30, 756), radius=28, fill=(255, 244, 214))
    ctext(d, W / 2, 712, pill, f, INK2)
    return img


def shot_steps():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    ctext(d, W / 2, 66, "三步搞定", font(62), INK)
    ctext(d, W / 2, 154, "安装后即可用，无需任何配置", font(30), INK2)

    cards = [
        ("1", "打开闲鱼搜索页", "访问 goofish.com 搜索任意商品，例如「手机」"),
        ("2", "点一下页面空白处", "让键盘焦点离开地址栏与搜索框"),
        ("3", "按空格键翻页", "每按一次，翻到下一页"),
    ]
    n = len(cards)
    gap, m, y0, ch = 40, 90, 262, 380
    cw = (W - m * 2 - gap * (n - 1)) / n
    for i, (num, title, desc) in enumerate(cards):
        x = m + i * (cw + gap)
        d.rounded_rectangle((x + 2, y0 + 10, x + cw + 2, y0 + ch + 10), radius=24, fill=SHADOW)
        d.rounded_rectangle((x, y0, x + cw, y0 + ch), radius=24, fill=WHITE, outline=BORDER, width=3)
        cx, cy, rr = x + 70, y0 + 84, 40
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=AMBER)
        ctext(d, cx, cy - 32, num, font(42), WHITE)
        ctext(d, x + cw / 2, y0 + 158, title, font(34), INK)
        for j, line in enumerate(wrap(d, desc, font(24), cw - 70)):
            ctext(d, x + cw / 2, y0 + 224 + j * 40, line, font(24), INK2)
    return img


def shot_compare():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    ctext(d, W / 2, 70, "翻页更顺手", font(62), INK)
    ctext(d, W / 2, 158, "从「移动鼠标找箭头」到「按一下空格」", font(30), INK2)

    # 左：以前
    d.rounded_rectangle((110, 250, 610, 640), radius=26, fill=(248, 248, 246), outline=(226, 226, 222), width=3)
    ctext(d, 360, 286, "以前", font(40), GRAY)
    for j, line in enumerate(["移动鼠标到右下角", "找到翻页箭头", "点击翻页"]):
        ctext(d, 360, 372 + j * 66, line, font(28), GRAY)

    # 右：现在
    d.rounded_rectangle((670, 250, 1170, 640), radius=26, fill=WHITE, outline=AMBER, width=5)
    ctext(d, 920, 286, "现在", font(40), INK)
    kb = (730, 372, 1110, 476)
    d.rounded_rectangle((kb[0], kb[1] + 8, kb[2], kb[3] + 8), radius=22, fill=SHADOW)
    d.rounded_rectangle(kb, radius=22, fill=WHITE, outline=(224, 200, 140), width=4)
    ctext(d, 920, kb[1] + 28, "空格", font(40), INK)
    ctext(d, 920, 520, "按一下即可翻到下一页", font(28), INK2)

    pill = "Chrome 扩展 · 不收集任何数据"
    f = font(24)
    l, t, r, b = d.textbbox((0, 0), pill, font=f)
    w = r - l
    d.rounded_rectangle((W / 2 - w / 2 - 30, 700, W / 2 + w / 2 + 30, 756), radius=28, fill=(255, 244, 214))
    ctext(d, W / 2, 712, pill, f, INK2)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    shots = {"hero": shot_hero(), "steps": shot_steps(), "compare": shot_compare()}
    for name, im in shots.items():
        png = os.path.join(OUT, f"{name}_1280x800.png")
        jpg = os.path.join(OUT, f"{name}_1280x800.jpg")
        im.convert("RGB").save(png)           # 24-bit PNG, no alpha
        im.convert("RGB").save(jpg, quality=92)
        print(f"wrote {png} {im.size} mode={im.mode}")
        print(f"wrote {jpg}")


if __name__ == "__main__":
    main()
