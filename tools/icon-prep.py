#!/usr/bin/env python3
"""הכנת סמלי הסקילים העגולים של חבילת הבוקר (ARI, 9.11.2026). הכנה בלבד, לא מחובר למשחק.
שימוש:  python tools/icon-prep.py <תיקיית ה-PNG המקוריים> <תיקיית פלט> [--sheet docs/refs/skill-icons-prep/review.webp]
המקורות: icon-*-round.png, 591x591 RGBA, כבר בתוך המסגרת הזהובה המשותפת (הצללית ממלאת 17..575 בכולם). לכן ה"חיתוך" הוא רק לריבוע של הצללית ללא שוליים שקופים.
כותב לכל סמל <שם>.webp ב-256 (פי 2 מהאייקונים הקיימים, 128, לפיקסלים של טלפון) ו-<שם>-128.webp,
ודף סקירה: רגיל | לחוץ | קירור (איך הם ייראו ב-runtime: לחוץ = בהירות ו-scale, קירור = עמעום, ללא צבע, ומחיקה רדיאלית).
"""
import sys, os, glob, math
from PIL import Image, ImageDraw, ImageEnhance, ImageChops
src, out = sys.argv[1], sys.argv[2]
sheet = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
os.makedirs(out, exist_ok=True)

def crop(im):
    bb = im.getchannel('A').getbbox()
    return im.crop(bb)

def pressed(im):
    r = ImageEnhance.Brightness(im.convert('RGB')).enhance(1.25).convert('RGBA'); r.putalpha(im.getchannel('A'))
    n = im.width; s = int(n * 0.92); sm = r.resize((s, s), Image.LANCZOS)
    c = Image.new('RGBA', im.size, (0, 0, 0, 0)); c.paste(sm, ((n - s) // 2, (n - s) // 2), sm); return c

def cooldown(im, frac=0.4):
    g = ImageEnhance.Color(im.convert('RGB')).enhance(0.0); g = ImageEnhance.Brightness(g).enhance(0.55)
    base = g.convert('RGBA'); base.putalpha(im.getchannel('A'))
    n = im.width; mask = Image.new('L', im.size, 0); d = ImageDraw.Draw(mask)
    # החלק שעוד בקירור נשאר אפור; החלק שכבר חזר צבעוני (מחיקה רדיאלית מלמעלה בכיוון השעון)
    d.pieslice((0, 0, n, n), -90, -90 + 360 * (1 - frac), fill=255)
    res = base.copy(); col = im.copy(); col.putalpha(ImageChops.multiply(im.getchannel('A'), mask)); res.alpha_composite(col); return res

files = sorted(glob.glob(os.path.join(src, 'icon-*-round.png')))
tiles = []
for f in files:
    name = os.path.basename(f)[5:-10]
    im = crop(Image.open(f).convert('RGBA'))
    for sz, suf in ((256, ''), (128, '-128')):
        im.resize((sz, sz), Image.LANCZOS).save(os.path.join(out, name + suf + '.webp'), 'WEBP', quality=88, method=6)
    n = im.resize((192, 192), Image.LANCZOS); tiles.append((name, n, pressed(n), cooldown(n)))
print(len(files), 'icons ->', out)
if sheet and tiles:
    cell = 132; cols = 3; per = 4   # 4 סמלים בשורה, שלושה מצבים לכל אחד
    rows = math.ceil(len(tiles) / per); W = per * (cols * cell + 14); H = rows * (cell + 18) + 6
    S = Image.new('RGB', (W, H), (24, 24, 30)); d = ImageDraw.Draw(S)
    for i, (name, a, b, c) in enumerate(tiles):
        x0 = (i % per) * (cols * cell + 14) + 4; y0 = (i // per) * (cell + 18) + 4
        for j, t in enumerate((a, b, c)):
            t = t.resize((cell - 6, cell - 6), Image.LANCZOS); S.paste(t, (x0 + j * cell, y0), t)
        d.text((x0, y0 + cell - 2), name[:60], fill=(190, 190, 200))
    S.save(sheet, quality=84)
    print('sheet', sheet, S.size)
