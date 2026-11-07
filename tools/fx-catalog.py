#!/usr/bin/env python3
"""Effect catalog for the Mochi Lab bundle (contact sheets + facts).

Usage:  python3 tools/fx-catalog.py <extracted-folder> [out-folder]
        python3 tools/fx-catalog.py --md   (only rewrite the .md, e.g. after editing descriptions.json)

<extracted-folder> holds one folder per pack, laid out as
<pack>/<pack>/sprite_sheets/*_sheet.png (grids of 6 columns).
For every pack it writes <out>/<pack>.webp: one tile per sheet, showing the
middle frame, labeled with the sheet name. It also writes <out>/facts.json
(sheet → frame size, frame count) and docs/refs/fx-catalog.md: one row per
effect (its color variants grouped), with the hand-written descriptions from
<out>/descriptions.json and a mark for sheets already in tools/fx-list.json.
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
        try:
            im = Image.open(path).convert("RGBA")
        except OSError:  # a sheet that is damaged in the bundle itself
            facts[sheet] = {"frame": 0, "frames": 0, "broken": True}
            continue
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

def _common(a, b):
    n = 0
    while n < min(len(a), len(b)) - 1 and a[n] == b[n]: n += 1
    return n

def group(sheets):
    """Sheet names → [(effect, [variants])]. Sorted sheets of one effect sit
    together and share a name prefix (fireball_amber, fireball_crimson…)."""
    groups, cur = [], None
    for s in sorted(sheets):
        t = s.split("_")
        if cur and cur["k"] is None:
            k = _common(cur["t"], t)
            if k: cur["k"] = k
        if cur and cur["k"] and t[:cur["k"]] == cur["t"][:cur["k"]]:
            cur["m"].append(t); continue
        cur = {"t": t, "k": None, "m": [t]}; groups.append(cur)
    res = []
    for g in groups:
        k = g["k"] or len(g["t"])
        key, vs = "_".join(g["t"][:k]), ["_".join(m[k:]) for m in g["m"]]
        if len({v.count("_") for v in vs}) > 1:  # arrow_amber + arrow_flame_amber
            sub = {}
            for v in vs:
                t = v.split("_")
                sub.setdefault("_".join([key] + t[:-1]), []).append(t[-1])
            res += list(sub.items())
        else:
            res.append((key, vs))
    return res

def write_md(out, facts):
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    try: desc = json.load(open(os.path.join(out, "descriptions.json")))
    except OSError: desc = {}
    used = {}
    for fid, v in json.load(open(os.path.join(root, "tools", "fx-list.json"))).items():
        if not fid.startswith("_"): used.setdefault((v[0], v[1]), []).append(fid)
    n_sheets = sum(len(v) for v in facts.values())
    L = ["# קטלוג האפקטים של Mochi Lab", "",
         f"כל האפקטים בבאנדל: {len(facts)} חבילות, {n_sheets} גיליונות. נוצר ב-`tools/fx-catalog.py`.",
         "לכל חבילה יש דף תמונות ב-`fx-catalog/<חבילה>.webp`: הפריים האמצעי של כל גיליון, עם השם שלו.",
         "שורה אחת לכל אפקט, והגרסאות שלו (בדרך כלל צבעים) באותה שורה. שם הגיליון = `<אפקט>_<גרסה>`.",
         "**פריימים** = פריימים שיש בהם תוכן (הרשת היא 6 עמודות). **במשחק** = מזהה ב-`tools/fx-list.json` שכבר משתמש בגיליון.",
         "החבילות עצמן לא בריפו (הבאנדל בתשלום והריפו ציבורי). אפקט חדש למשחק: שורה ב-fx-list.json, לפי docs/fx.md.", "",
         "## חבילות", ""]
    for pack in facts:
        L.append(f"- [{pack}](#{pack}): {desc.get(pack, {}).get('_pack', '')}")
    for pack, sheets in facts.items():
        d = desc.get(pack, {})
        L += ["", f"## {pack}", ""]
        if d.get("_pack"): L += [d["_pack"], ""]
        L += [f"![{pack}](fx-catalog/{pack}.webp)", "",
              "| אפקט | גרסאות | פריים | פריימים | איך נראה | במשחק |", "|---|---|---|---|---|---|"]
        for eff, vs in group(sheets):
            names = [eff + ("_" + v if v else "") for v in vs]
            fs = [sheets[n] for n in names]
            fr = sorted({f["frames"] for f in fs if not f.get("broken")})
            sz = sorted({f["frame"] for f in fs if not f.get("broken")})
            frs = f"{fr[0]}-{fr[-1]}" if len(fr) > 1 else (str(fr[0]) if fr else "-")
            var = ", ".join(v + (" (פגום)" if sheets[n].get("broken") else "") for v, n in zip(vs, names))
            u = []
            for v, n in zip(vs, names):
                for fid in used.get((pack, n), []): u.append(f"{fid} ({v})" if v else fid)
            L.append(f"| `{eff}` | {var} | {'/'.join(map(str, sz))} | {frs} | {d.get(eff, '')} | {', '.join(u)} |")
    open(os.path.join(out, "..", "fx-catalog.md"), "w").write("\n".join(L) + "\n")

def main():
    args = [a for a in sys.argv[1:] if a != "--md"]
    if not args and "--md" not in sys.argv: sys.exit(__doc__)
    src = args[0] if args else None
    out = args[1] if len(args) > 1 else os.path.join(os.path.dirname(__file__), "..", "docs", "refs", "fx-catalog")
    os.makedirs(out, exist_ok=True)
    only_md = "--md" in sys.argv
    if only_md:  # rebuild just the .md from the saved facts
        write_md(out, json.load(open(os.path.join(out, "facts.json")))); return
    all_facts = {}
    for pack in sorted(os.listdir(src)):
        d = os.path.join(src, pack)
        if not os.path.isdir(d): continue
        facts = pack_sheet(d, pack, out)
        if facts:
            all_facts[pack] = facts
            print(pack, len(facts), "sheets", os.path.getsize(os.path.join(out, pack + ".webp")) // 1000, "KB")
    json.dump(all_facts, open(os.path.join(out, "facts.json"), "w"), sort_keys=True, separators=(",", ":"))
    write_md(out, all_facts)

if __name__ == "__main__":
    main()
