# חותך דף אייקונים (רשת) לאייקונים נפרדים עם רקע שקוף, בגודל של icons/ui/res.
# שימוש: python3 tools/slice-icons.py <דף.jpg> <עמודות> <שורות> <תיקיית-יעד> שם1 שם2 ...
# הרקע הלבן נמחק רק מהקצוות פנימה (flood fill), כך שלבן בתוך האייקון (יהלום) נשאר.
import sys
from PIL import Image, ImageDraw

src, cols, rows, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
names = sys.argv[5:]
SIZE, TOL = 96, 40
im = Image.open(src).convert('RGB')
W, H = im.size
cw, ch = W / cols, H / rows
for i, name in enumerate(names):
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
    bb = cell.getbbox()
    cell = cell.crop(bb)
    cell.thumbnail((SIZE, SIZE), Image.LANCZOS)
    cell.quantize(colors=255, method=Image.FASTOCTREE).save(f'{out}/{name}.png', optimize=True) if False else cell.save(f'{out}/{name}.png', optimize=True)
    print(name, cell.size)
