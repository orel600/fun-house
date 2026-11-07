#!/usr/bin/env python3
"""ממיר אפקטים מחבילות Mochi Lab (אוראל, 7.11.2026) לגיליונות קטנים למשחק.

החבילות עצמן (כ-17GB, 43 חבילות) לא בריפו: הן נקנו, והריפו ציבורי. רק מה שברשימה נכנס, מוקטן.
שימוש:  python3 tools/fx-convert.py <תיקיית החבילות, public/fx של fetch-and-extract.sh>
קורא את tools/fx-list.json (id → [חבילה, גיליון, גודל פריים בפיקסלים]) וכותב:
  fx/<id>.webp     גיליון מוקטן, אותה רשת כמו המקור (6×4 או 6×8)
  js/fx-data.js    FXDATA: לכל id עמודות, שורות, מספר פריימים וגודל פריים
אפקט חדש: שורה ב-fx-list.json, מריצים שוב, ומשתמשים בו ב-fxPlay (js/fxlib.js).
"""
import json, os, sys, glob
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else 'public/fx'
LIST = json.load(open(os.path.join(ROOT, 'tools', 'fx-list.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'fx')
os.makedirs(OUT, exist_ok=True)

def find_sheet(pack, name):
    base = os.path.join(SRC, pack, pack)
    if not os.path.isdir(base):
        base = os.path.join(SRC, pack)
    for d in ('sprite_sheets', 'sprite_sheets_256', 'sprite_sheets_128'):
        f = os.path.join(base, d, name + '_sheet.png')
        if os.path.exists(f):
            return f
    hits = glob.glob(os.path.join(base, '**', name + '_sheet.png'), recursive=True)
    return hits[0] if hits else None

data, total, missing = {}, 0, []
for fid, spec in LIST.items():
    if fid.startswith('_'):
        continue
    pack, name, size = spec
    dst = os.path.join(OUT, fid + '.webp')
    if os.path.exists(dst) and '--all' not in sys.argv:   # כבר הומר: לוקחים את המידע מהקובץ הקטן (מהיר). --all ממיר הכל מחדש
        sm = Image.open(dst).convert('RGBA'); cols = 6; rows = sm.height // size
        n = max([i + 1 for i in range(cols * rows) if sm.crop(((i % cols) * size, (i // cols) * size, (i % cols + 1) * size, (i // cols + 1) * size)).getbbox()] or [0])
        data[fid] = {'c': cols, 'r': rows, 'n': n, 's': size}; total += os.path.getsize(dst)
        continue
    f = find_sheet(pack, name)
    if not f:
        missing.append(fid + ' (' + pack + '/' + name + ')')
        continue
    im = Image.open(f).convert('RGBA')
    cols = 6                                   # כל החבילות: 6 עמודות. השורות לפי הגובה (4 או 8)
    fw = im.width // cols
    rows = im.height // fw
    # פריימים ריקים בסוף הרשת לא מנוגנים
    n = 0
    for i in range(cols * rows):
        x, y = (i % cols) * fw, (i // cols) * fw
        if im.crop((x, y, x + fw, y + fw)).getbbox():
            n = i + 1
    sm = im.resize((cols * size, rows * size), Image.LANCZOS)
    sm.save(dst, 'WEBP', quality=82, method=6)
    total += os.path.getsize(dst)
    data[fid] = {'c': cols, 'r': rows, 'n': n, 's': size}

with open(os.path.join(ROOT, 'js', 'fx-data.js'), 'w', encoding='utf-8') as o:
    o.write('/* נוצר אוטומטית ב-tools/fx-convert.py מתוך tools/fx-list.json. לא עורכים ביד.\n'
            '   לכל אפקט: c עמודות, r שורות, n פריימים, s גודל פריים (פיקסלים). הקובץ: fx/<id>.webp */\n')
    o.write('const FXDATA=' + json.dumps(data, separators=(',', ':')) + ';\n')

print(len(data), 'effects,', total // 1024, 'KB total')
if missing:
    print('missing:', *missing, sep='\n  ')
    sys.exit(1)
