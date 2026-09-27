#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 og:image / twitter:image 社交分享卡片 (1200x630)。

唯一真相源是 glaze-notes/build/icon-source.png（1024 新图标）。
产出 website/assets/img/og-cover.png。
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ICON = os.path.join(ROOT, "..", "glaze-notes", "build", "icon-source.png")
OUT = os.path.join(ROOT, "assets", "img", "og-cover.png")

W, H = 1200, 630
BG = (46, 42, 37)          # #2e2a25 与 app 窗口底色一致
FG = (245, 241, 234)       # 暖白
SUB = (196, 184, 168)      # 次级文字

os.makedirs(os.path.dirname(OUT), exist_ok=True)

canvas = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(canvas)

# 图标：左侧居中，300x300
icon = Image.open(SRC_ICON).convert("RGBA").resize((300, 300), Image.LANCZOS)
canvas.paste(icon, (110, (H - 300) // 2), icon)

# 文案：右侧
def font(path_candidates, size):
    for p in path_candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

title_font = font(
    [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"],
    86,
)
sub_font = font(
    [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\segoeui.ttf"],
    40,
)

text_x = 470
draw.text((text_x, 232), "Desktop-note", font=title_font, fill=FG)
draw.text((text_x, 348), "把想法，钉在桌面上。", font=sub_font, fill=SUB)
draw.text((text_x, 412), "Windows 桌面便签 · 数据全部留在本机", font=sub_font, fill=SUB)

canvas.save(OUT, "PNG")
print("wrote", OUT, os.path.getsize(OUT), "bytes")
