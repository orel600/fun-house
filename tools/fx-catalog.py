#!/usr/bin/env python3
"""Effect catalog for the Mochi Lab bundle (contact sheets + facts).

Usage:  python3 tools/fx-catalog.py <extracted-folder> [out-folder]

<extracted-folder> holds one folder per pack, laid out as
<pack>/<pack>/sprite_sheets/*_sheet.png (grids of 6 columns).
For every pack it writes <out>/<pack>.webp: one tile per sheet, showing the
middle frame, labeled with the sheet name. It also writes <out>/facts.json
(sheet → frame size, frame count), which docs/refs/fx-catalog.md is built from.
Default out-folder: docs/refs/fx-catalog. Only these reduced images go into
the repo, never the packs themselves (the bundle is paid, the repo is public).
"""
import glob, json, os, sys
from PIL import Image, ImageDraw, ImageFont

COLS = 6           # every sheet is a grid of 6 columns
TILE = 128         # tile size in the contact sheet
LABEL = 14         # label strip height under each tile
GRID = 12          # tiles per row in the contact sheet
MAX_BYTES = 400_000
BG = (28, 30, 36)

def font(size):
    for f in ("DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "arial.ttf"):
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()

def frames_of(im):
    fw = im.width // COLS
    rows = max(1, im.height // fw)
    alpha = im.getchannel("A") if im.mode == "RGBA" else None
    cells = []
    for r in range(rows):
        for c in range(COLS):
            box = (c * fw, r * fw, (c + 1) * fw, (r + 1) * fw)
            if alpha is None or alpha.crop(box).getbbox():
                cells.append(box)
    return fw, cells

def checker():
    t = Image.new("RGB", (TILE, TILE), BG)
    d = ImageDraw.Draw(t)
    for y in range(0, TILE, 16):
        for x in range(0, TILE, 16):
            if (x + y) // 16 % 2: d.rectangle((x, y, x + 15, y + 15), fill=(36, 39, 46))
    return t

def pack_sheet(pack_dir, name, out):
    sheets = sorted(glob.glob(os.path.join(pack_dir, "**", "sprite_sheets", "*.png"), recursive=True))
    if not sheets: return None
    facts, tiles = {}, []
    base = checker()
    for path in sheets:
        sheet = os.path.basename(path)[:-4].removesuffix("_sheet")
        im = Image.open(path).convert("RGBA")
        fw, cells = frames_of(im)
        facts[sheet] = {"frame": fw, "frames": len(cells)}
        fr = im.crop(cells[len(cells) // 2]) if cells else Image.new("RGBA", (fw, fw))
        fr.thumbnail((TILE, TILE), Image.LANCZOS)
        t = base.copy()
        t.paste(fr, ((TILE - fr.width) // 2, (TILE - fr.height) // 2), fr)
        tiles.append((sheet, t))
        im.close()
    cols = min(GRID, len(tiles))
    rows = (len(tiles) + cols - 1) // cols
    cw, ch = TILE + 4, TILE + LABEL + 4
    page = Image.new("RGB", (cols * cw, rows * ch), (16, 17, 20))
    d, f = ImageDraw.Draw(page), font(9)
    for i, (sheet, t) in enumerate(tiles):
        x, y = i % cols * cw + 2, i // cols * ch + 2
        page.paste(t, (x, y))
        label = sheet if d.textlength(sheet, font=f) <= TILE else sheet[:22] + "…"
        d.text((x + 2, y + TILE + 2), label, fill=(220, 220, 220), font=f)
    dst = os.path.join(out, name + ".webp")
    for q in (70, 60, 50, 40, 30):
        page.save(dst, "WEBP", quality=q, method=6)
        if os.path.getsize(dst) <= MAX_BYTES: break
    return facts

def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "docs", "refs", "fx-catalog")
    os.makedirs(out, exist_ok=True)
    all_facts = {}
    for pack in sorted(os.listdir(src)):
        d = os.path.join(src, pack)
        if not os.path.isdir(d): continue
        facts = pack_sheet(d, pack, out)
        if facts:
            all_facts[pack] = facts
            print(pack, len(facts), "sheets", os.path.getsize(os.path.join(out, pack + ".webp")) // 1000, "KB")
    json.dump(all_facts, open(os.path.join(out, "facts.json"), "w"), indent=1, sort_keys=True)

if __name__ == "__main__":
    main()
