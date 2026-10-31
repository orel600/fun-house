# חותך דף אייקונים (רשת) לאייקונים נפרדים עם רקע שקוף, בגודל של icons/ui/res.
# שימוש: [SIZE=160] [SOLO=1] python3 tools/slice-icons.py <דף.jpg> <עמודות> <שורות> <תיקיית-יעד> שם1 שם2:holes ...
# הרקע הלבן נמחק רק מהקצוות פנימה (flood fill), כך שלבן בתוך האייקון (יהלום) נשאר.
import sys
from PIL import Image, ImageDraw

src, cols, rows, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
names = sys.argv[5:]
import os
SIZE, TOL = int(os.environ.get("SIZE", 96)), 40   # SIZE=160 לדיוקנאות
im = Image.open(src).convert('RGB')
W, H = im.size
cw, ch = W / cols, H / rows
for i, name in enumerate(names):
    name, holes = name.split(':')[0], name.endswith(':holes')
    c, r = i % cols, i // cols
    cell = im.crop((int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch))).convert('RGBA')
    w, h = cell.size
    # flood fill מכל נקודה בקצה: מסמן רקע במגנטה, ואז הופך אותו לשקוף
    KEY = (255, 0, 255, 255)
    for x in range(0, w, 4):
        for y in (0, h - 1):
            if cell.getpixel((x, y))[:3] != KEY[:3] and min(cell.getpixel((x, y))[:3]) > 255 - TOL:
                ImageDraw.floodfill(cell, (x, y), KEY, thresh=TOL)
    for y in range(0, h, 4):
        for x in (0, w - 1):
            if cell.getpixel((x, y))[:3] != KEY[:3] and min(cell.getpixel((x, y))[:3]) > 255 - TOL:
                ImageDraw.floodfill(cell, (x, y), KEY, thresh=TOL)
    # שם עם ':holes' (כמו קשת עם מיתר): גם אזורים לבנים סגורים בפנים נמחקים. לא לשימוש באייקון שהוא עצמו לבן (יהלום)
    if holes:
        for y in range(0, h, 3):
            for x in range(0, w, 3):
                p = cell.getpixel((x, y))
                if p[:3] != KEY[:3] and min(p[:3]) >= 248:
                    ImageDraw.floodfill(cell, (x, y), KEY, thresh=TOL)
    px = cell.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == KEY:
                px[x, y] = (0, 0, 0, 0)
    # שוליים בהירים שנשארו ליד הקו: שקיפות חלקית לפי בהירות, רק ליד פיקסל שקוף
    a = cell.split()[3]
    alpha = a.load()
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            if alpha[x, y] and any(alpha[x + dx, y + dy] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                m = min(px[x, y][:3])
                if m > 200:
                    px[x, y] = px[x, y][:3] + (int(255 * (255 - m) / 55),)
    # SOLO=1 (דיוקנאות): נשאר רק הגוש הגדול, בלי פיסות מהשכן שגלשו לתא. לא לאייקונים עם ניצוצות מסביב
    if os.environ.get('SOLO'):
        seen, best = set(), []
        for y0 in range(h):
            for x0 in range(w):
                if px[x0, y0][3] and (x0, y0) not in seen:
                    comp, st = [], [(x0, y0)]
                    seen.add((x0, y0))
                    while st:
                        x, y = st.pop(); comp.append((x, y))
                        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3]:
                                seen.add((nx, ny)); st.append((nx, ny))
                    if len(comp) > len(best):
                        best = comp
        keep = set(best)
        for y in range(h):
            for x in range(w):
                if px[x, y][3] and (x, y) not in keep:
                    px[x, y] = (0, 0, 0, 0)
    bb = cell.getbbox()
    cell = cell.crop(bb)
    cell.thumbnail((SIZE, SIZE), Image.LANCZOS)
    cell.quantize(colors=256, method=Image.FASTOCTREE).save(f'{out}/{name}.png', optimize=True)
    print(name, cell.size)
