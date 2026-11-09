# Weapon visuals audit (9.11.2026)

Two complaints from Nir's playtester (v0.3.589.628): (1) a weapon in the hand doesn't match its picture (skyBow pink, stormBow silver), (2) in Gear & Bag the weapon gets cut off at the right edge or hidden.
Measured with `node tools/weapon-audit.js` (3D, 1280×590, deviceScaleFactor 1, about 15 minutes on a computer without a GPU). Nothing in the game changed. Raw data: [weapon-audit/audit.json](weapon-audit/audit.json). Picture next to held model for every weapon: [weapon-audit/sheet.png](weapon-audit/sheet.png).

**How it measures.** Each scene is rendered twice, with the weapon and without it, and the difference is the weapon's pixels. Only those pixels are measured, so the hero's body doesn't count. For each one the tool takes the average colour (dark outlines removed): hue, saturation and brightness. It counts as a **match** when the hues are within 45°, or both colours are grey/greyish, **and** the held weapon is at least 0.55 as bright as the picture. (The doll is lit about 0.75× as bright as the pictures on average, so a small drop is normal.) For **framing**, the doll is rendered at both ends of its sway (±sway) plus two middle poses. A weapon is clipped when more than 3 of its pixels touch the canvas border, and hidden when 5% or more of its pixels sit under another element (checked with elementFromPoint).

## Summary

- **Colour: 6 of 17 weapons don't match the picture in at least one state.**
  - 3 only before their own model loads (starStaff, skyBow, stormBow).
  - 3 even after it loads (dragonBlade, wardenHammer, silverWand).
- **The doll doesn't refresh: all 6 weapons that have their own model** (ironStaff, goldStaff, starStaff, dragonBlade, skyBow, stormBow). It shows the fallback model and stays that way after the own model arrives, until something redraws the window. This is exactly the pink skyBow the tester saw: [gear-window-skyBow-stale.png](weapon-audit/gear-window-skyBow-stale.png).
- **Shape/details (by eye, separate from colour): 4 clear mismatches + 1 partial.** Clear: silverBlade, wardenHammer, oakStaff, and goldAxe (likely). Partial: silverWand. All five use generic KayKit models.
- **Framing: 10 of 17 are cut off at the edge of the doll canvas** (every sword, axe, hammer and legendary item, plus starStaff, skyBow and stormBow). 1 is hidden 9% under the class badge (stormBow). Two more are partly under it but below the 5% threshold (skyBow 4%, dragonBlade 2%). Only the bows and the simple staves (6 + silverWand) fit.

## Table

Pic = the picture's colour. Before load = the doll before the own model loads (`look.model` + tier glow). Doll = after it loads. Edge = weapon pixels touching the edge of the canvas.

| Weapon | Tier | Pic | Before load | Doll | Colour | Framing | Cause |
|---|---|---|---|---|---|---|---|
| oakSword | 0 | orange | – | brown | ✓ | ✗ edge 56 | Sword sticks out to the left of the canvas |
| ironSword | 1 | silver | – | greyish blue | ✓ | ✗ edge 40 | Same |
| silverBlade | 2 | greyish blue | – | silver | ✓ | ✗ edge 25 | Same |
| oakBow | 0 | brown | – | greyish brown | ✓ | ✓ | |
| ironBow | 1 | silver | – | dark grey | ✓ | ✓ | |
| goldBow | 3 | orange | – | gold | ✓ | ✓ | |
| oakStaff | 0 | brown | – | brown | ✓ | ✓ | |
| ironStaff | 1 | greyish brown | dark grey | dark grey | ✓ | ✓ | Own model, doll doesn't refresh (no visible harm) |
| silverWand | 2 | blue | – | silver | ✗ mild | ✓ | Blue gem in the picture, KayKit `w_wand_A` is silver with a small tip. Glow `#DCE3EA` (tier silver) |
| goldStaff | 3 | orange | gold | brown | ✓ | ✓ | Own model, doll doesn't refresh |
| starStaff | 4 | silver | **pink** | silver | ✗ before load | ✗ edge 24 | Before load: `w_staff_B` + legendary glow `#FF6FB5`. Star cut off at the top |
| ironAxe | 1 | silver | – | dark grey | ✓ | ✗ edge 155 | Axe cut off on the left |
| goldAxe | 3 | orange | – | gold | ✓ | ✗ edge 258 | Same |
| dragonBlade | 4 | bright pink | pink | **dark maroon** | ✗ | ✗ edge 247 | Own model is much darker than the picture (0.48 of its brightness). Legendary glow is turned off on own models |
| skyBow | 4 | pale blue | **pink** | greyish blue | ✗ before load | ✗ edge 97, 4% under badge | Before load: `w_bow_B` + legendary glow `#FF6FB5` (that's the "pink"). Loaded model matches |
| wardenHammer | 1 | brown-green (stone + moss) | – | blue-grey | ✗ | ✗ edge 157 | KayKit `w_hammer_A` is plain grey. The picture is a stone-and-moss hammer |
| stormBow | 2 | purple | **silver** | dark purple-blue | ✗ before load | ✗ edge 344, **9% under badge** | Before load: `w_bow_B` + silver tier glow. `look.glow:'#C7A6FF'` is never used (see below). Right side cut off + 🏹 badge on top of it: [gear-window-stormBow.png](weapon-audit/gear-window-stormBow.png) |

In the world (village) the hero is small and the camera is above and behind. The bows hardly show (0 to 3 pixels), so they aren't judged there. The weapons that are visible come out pale and warm (beige) under the village light: dragonBlade looks beige, stormBow white. That's a general limit of the world view, not one item. The world column is in sheet.png.

## Model per weapon and the stand-in (after load vs before)

Every weapon is judged **after** its own model has fully loaded (the tool waits for `M3D.st['w_item_<id>']==='ready'`). The state before load is reported separately.
- **Own model (6):** ironStaff, goldStaff, starStaff, dragonBlade, skyBow, stormBow (`w_item_<id>`, lazy-loaded in m3d.js). Measured load time: 80–465 ms. This was measured locally from files, on the computer. On the phone over the network it will be different, which is an **estimate, not measured**.
  - **In the world:** the stand-in disappears on the next frame after loading (`M3D.hv` is in the `heroLook` key).
  - **In Gear & Bag:** the stand-in **stays** until the window redraws (all 6 measured as `stale`).
  - What the stand-in looks like: `look.model` (a KayKit family model) with the tier glow. starStaff and skyBow are pink, stormBow is silver, goldStaff is gold, dragonBlade is pink, ironStaff is grey.
  - Correction to the playtester's list: ironStaff does have its own model (`w_item_ironStaff`), and it matches the mace picture.
- **Generic family model only (11):** oakSword `w_sword_A`, ironSword `w_sword_B`, silverBlade `w_sword_C`, oakBow `w_bow_A_withString`, ironBow/goldBow `w_bow_B_withString`, oakStaff `w_staff_A`, silverWand `w_wand_A`, ironAxe `w_axe_A`, goldAxe `w_axe_B`, wardenHammer `w_hammer_A`.
- **Confirmed in code: `look.glow` doesn't affect anything in the regular mode.** `gear3dLook` (render3d.js) sets `p.glow=g3Rar(it.tier)`, so the glow comes from the tier and not the item. `makeActor` skips glow on own models (`if(p.glow&&!own)`). So the tier glow only paints the stand-in and the generic models, and `look.glow` is read only with `?gear3d=0`, in the doll (doll3d.js).

## Shape and details (checked by eye, separate from the colour rule)

The contact sheet has close-ups of each weapon on its own, from the front and from the side (`front`/`side` columns), plus how it looks in the doll. Checked against the playtester's findings:

| Weapon | Playtester's finding | Here |
|---|---|---|
| silverBlade | Curved, detailed picture vs a generic straight sword | ✓ Confirmed: `w_sword_C` is straight and thin, with no blue gem and no curve |
| wardenHammer | Green rune missing | ✓ Confirmed: a plain grey block, with no stone, moss or rune |
| oakStaff | Leafy curled picture vs a plain stick | ✓ Confirmed: a straight brown stick |
| goldAxe | Red gem / gold detail missing | Likely: gold colour matches, but no red gem visible at this resolution |
| silverWand | Blue crystal missing | Partly: there's a pale blue blob on the tip, but no crystal shape and no gems |
| dragonBlade, goldStaff, starStaff | Close to the picture (own model) | ✓ Shape matches. dragonBlade is darker in the doll (see colour) |
| oakSword, ironSword, ironAxe, oakBow, ironBow, goldBow | Generic | ✓ Shape close in general. Small details missing: oakBow's leaves, goldBow's red gems |
| skyBow, stormBow | – | ✓ Shape matches (own model). stormBow is darker (navy vs lavender) |

## How much a camera fit to body+weapon would shrink the character (estimate from geometry)

For each weapon, the tool projects every vertex of the weapon through the doll camera, across the sway and across 4 frames of the cheer (`Cheering`). It reports how far the weapon goes past the frame edge (`ndc`; above 1 = outside) and what scale the character would get if the camera fitted everything (`fitScale` in audit.json).
- Bows, staves and wands: 0.82–1, a small change. The exception is skyBow 0.82, and stormBow 0.57 because of the cheer pose (1.44).
- **Swords and axes: 0.40–0.53, and dragonBlade 0.31.** The weapon sticks out a lot to the side in the idle pose, so fitting to its bbox would halve the character or more. **Not recommended on its own.**

## The 3 worst

1. **stormBow:** before load it's silver instead of purple. The doll stays that way until it redraws. 344 pixels on the right edge are cut off, and the 🏹 class badge covers 9% of it. Both of the tester's complaints in one weapon.
2. **skyBow:** pink (legendary tier glow on the fallback KayKit bow) instead of pale blue, and it stays pink in the doll. Cut off on the right (97 px).
3. **dragonBlade:** even the loaded model is dark maroon while the picture is bright pink. Cut off on the left (247 px).

## Causes (from the code)

- **`look.glow` is dead data.** With `GEAR3D.on` (always on) the glow comes from the tier (`g3Rar(it.tier)`, render3d.js `gear3dLook`), not from the item. `look.glow` is only read when GEAR3D is off (doll3d.js). That's why stormBow gets the silver of tier 2 and not `#C7A6FF`, and why every legendary item is pink `#FF6FB5`.
- **Own models skip the glow** (`own` in makeActor), but until they load (lazy, m3d.js) you see `look.model` with the tier glow.
- **The doll only rebuilds from `gearDraw`** (`dollShow` → `dollBuild`). `dollFrame` doesn't check `dollKey()`, so a model that loads while the window is open isn't swapped in.
- **The doll canvas is small** (144×226 px at 1280×590, `.gfig .doll3d{inset:0;width:100%;height:100%}` in style.css line 1217). The camera is framed to the body height in the idle pose (`fit`/`fitBy`). A weapon held to the side (sword, axe, the long stormBow) sticks out of the frame, even though the doll's column has free space on both sides.
- **The class badge** (`.gfig b`, the class icon) sits on the lower corner of the doll, right where a bow's tip ends up.

## Recommendations by type of problem

1. **Fallback before load (skyBow, stormBow, starStaff):** (a) In `dollFrame`, compare `dollKey()` with `D.key` and rebuild when it changes (one line). (b) Until the own model loads, use `look.glow` and not the tier glow, so the fallback is at least the right colour. Or load own models when an item enters the bag, not only when it's worn.
2. **Glow data:** decide on one source of truth. Either `gear3dLook` takes `look.glow||g3Rar(tier)`, or the `glow` lines in gear.js are deleted so they don't mislead. A data fix, not new art.
3. **Own model darker than the picture (dragonBlade):** retint/brighten the model (texture or emissiveMap in tools/blender), or allow a light glow on own models too. Re-rendering the picture from the model with `tools/blender/icon.js` is the second choice, because the bright picture is the one Nir liked.
4. **Picture and model are different objects (wardenHammer, a bit silverWand):** a separate model (w_item_wardenHammer), or re-render the picture from the KayKit model. Cheaper: re-render the picture.
5. **Framing (in this order):**
   - (a) Let the canvas fill the doll column. It's about 270 px wide vs a 144 px canvas, so roughly 1.9× the width; that's an estimate from the screenshot. The 140% rule exists in style.css line 799 but is overridden in landscape at line 1217. This alone covers most of the bows and swords without shrinking the character.
   - (b) An idle pose for the blade family as well (`DOLL3D.idleBy`, as bows and magic already have): the weapon held down or in front, not out to the side.
   - (c) Only then, a camera fit to body+weapon with a minimum scale (about 0.8), so long weapons don't shrink the character to half (see the estimate above).
   - Move the class badge to the top corner, or hide it when a 3D doll is showing.
6. **Shape mismatch (silverBlade, wardenHammer, oakStaff, goldAxe, silverWand):** this isn't solved with glow or colour. Each needs either its own model (as was done for skyBow and starStaff, tools/blender), or a picture re-rendered from the existing model (`tools/blender/icon.js`). The cheap option is re-rendering the picture, but it loses the detailed art Nir saw. That's a taste decision for Nir.

## Running it again

`node tools/weapon-audit.js` → updates `docs/weapon-audit/` (audit.json, sheet.png, and up to 4 screenshots of the gear window with the most-clipped weapons, plus skyBow before load). The thresholds are at the top of the file (`HUE_TOL`, `DARK`, `WORLD_MIN`).
