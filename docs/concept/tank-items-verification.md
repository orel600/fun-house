# Tank warhammer and crown: verification of the two draft GLBs (ARI, 9.11.2026)

Drafts: `stoneHammer-draft.glb`, `tankCrown-draft.glb` (Orel's correction pack, built from code). Checked against what `tools/build3d.js` (`ITEMS`, `ready:true`) and `js/render3d.js` expect. Result: **neither passes as delivered; both pass after one mechanical conversion** (`tools/blender/vc2palette.js`), which is now done and built in. Blender was not needed.

## Findings on the drafts

| Check | Draft | What the game expects | Verdict |
|---|---|---|---|
| Structure | 21 (hammer) and 9 (crown) separate mesh nodes, no skin, no animation | One mesh | fixed by merging |
| Material | **none**; colour only in `COLOR_0` (6 colours hammer, 3 crown) | `own_palette`: palette texture plus emissive map (like `starStaff`, `skyBow`) | **fail.** `render3d.js` `lambert()` copies map, color, emissive and emissiveMap but **not vertex colours**, so the drafts would render plain white |
| Normals | none | `NORMAL` (the Lambert material lights by them) | fixed: flat normals computed |
| UVs | none | `TEXCOORD_0` into the palette | fixed: one palette cell per colour (64x64, 8x8 cells) |
| Axes | handle along **z** (Blender-style), head wide on x | KayKit: handle along **y**, head wide on x, thickness on z | **fail**, fixed by rotating -90 degrees about x |
| Grip point | origin at the butt of the handle | grip at the origin (the hand slot `handslotr`, `HAND_R`) | **fail**, fixed: origin moved to 0.2 of the handle, then scaled |
| Scale | hammer 1.59 long, head 1.4 wide | KayKit `hammer_B` is 1.5 long and 0.65 wide; the barbarian is small | too big. Baked **x0.75**: 1.19 long, 1.05 wide. Mount at scale 1 |
| Glow | orange cells in the vertex colours | emissive map pulses in the game | the two orange colours (lava and gem) go to the emissive map |

Crown: lies in the xy plane with height on z (needs the same -90 degrees), 0.56 wide. Baked x1.6 with the band base at **y = 0.82 in head-bone space**, which puts it on the barbarian's head with the fur hat hidden (the existing helm/fur hats span y -0.13..1.2).

The colours in `COLOR_0` were read as sRGB, as the artist's preview showed them.

## Does the swing play right?

Checked in 3D on the GPU with the real clips, in the game's lighting, on the actual `barbarian` model used by `mb_tank`, the hammer on the right hand slot with the game's own mount (`HAND_R`, scale 1): `tools/blender/shoot-hammer.js` (page `preview-hammer.html`). Frames of `Melee_2H_Attack_Chop` at 0, 0.18, 0.35, 0.5, 0.7, 0.9, 1.15 and 1.5 s, and `Running_B`: the hammer follows the same arc as today's axe (raised above the shoulder, then down to the knee), does not clip the body at the extremes of the chop, and stays in the hand through the run. The `2H_Axe` mesh of the barbarian is hidden in this test; hiding it in the game is the mount code's job (BOB).

**Not tested:** a live game run with the mount code (it doesn't exist yet), damage-frame alignment, and the hero scale change.

## What was added

- `art/weapons/raw/stoneHammer.glb` and `ITEMS.stoneHammer` (`ready:true`, tex 64): built with `node tools/build3d.js C:/kk --only items --items=stoneHammer` into **`w_item_stoneHammer`** (46 KB, lazy file `js/m3d/w_item_stoneHammer.js`). 1,008 triangles.
- `art/hats/hat_tankCrown.glb` and `HATS.tankCrown` (`ready:true`): built with `--only hats --hats=tankCrown` into **`hat_tankCrown`** (24 KB, in the core file). 488 triangles. New `build3d.js` support for ready hats and `--hats=` to add one without rebuilding the others.
- Both are standalone: the crown is already in head-bone space, so BOB's mount code adds `R3D.props.hat_tankCrown` to the `head` bone (offset is in the file; tune the y there if needed).

## Gaps (honest)

- Both are the draft designs, only converted. The hammer head is a plain dark box with gold slabs, side spikes and a small gem; the lava cracks and the sun emblem of the reference are **not** on it (the draft has no such geometry). The crown is a band with six spikes and a gem. They read as "gold-trimmed black hammer" and "gold crown" at phone size, not as the painted concept.
- The tank's body is still the barbarian (no obsidian plate).
- Team colour: nothing here uses the blue/red trim.
