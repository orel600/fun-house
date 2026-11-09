# Hunter pilot: a new model from Orel's turnaround sheet (ARI, 9.11.2026)

**Status: first result, for Orel to judge. Replaces nothing.** The new model is the key `hunterHF` in `models3d`; no `LOOK3D` entry uses it, so the game is unchanged until Orel approves and someone adds a look.

| File | What |
|---|---|
| `hunter-vs-sheet.webp` | Orel's sheet (front view, a drawing) next to the current ranger and the new model, idle, 3D layer on the real GPU, game lighting. Labeled |
| `hunter-clips.webp` | Current ranger (top row) and the new model (bottom row) in six real KayKit clips: `Idle_A`, `Running_A` (2 frames), `Ranged_Bow_Draw`, `Ranged_Bow_Release`, `Death_A`; game camera (52 degrees) and front (14 degrees). Same bow prop on the left hand slot for both |

## How it was made (all free, no account, no token)

1. `tools/trellis/in/hunter-front.png`: the front view cropped from the sheet (`D:\morning-package\correction-pack\underworld-sheet-hunter.png`, not in the repo).
2. `python tools/trellis/run.py hunter`: TRELLIS (trellis-community) through `gradio_client`, **anonymous**, from this PC: 41 seconds, 16,420 triangles. (No token was used; the free anonymous quota was enough for one run.)
3. Decimated to 6,000 triangles with meshopt (`simplify`, UVs kept).
4. A donor with the KayKit Ranger skeleton and weights, all `Ranger_*` parts joined into one mesh: `node tools/trellis/make-donor.js <out dir>`.
5. `python tools/trellis/reskin.py <donor.glb> <decimated.glb> art/heroes/HunterHF.glb 0 --match=tools/trellis/in/hunter-front.png`: copies skeleton and weights by nearest vertex, stretches the mesh into the Ranger's box. New option `--match=<drawing>`: brightens the texture so its median colour equals the drawing's (the donor's own palette is brown, so `--color` alone would have been wrong; gamma ~0.57).
6. `node tools/build3d.js C:/kk --only hunterHF` (new `CHARS` row, lazy file `js/m3d/hunterHF.js`, 229 KB, jpeg 512 texture).
7. `node tools/trellis/shoot-hero.js art/heroes/HunterHF.glb ranger out.png --bow --gpu`: the real clips on the real GPU.

## What the result shows (honest)

- **Works:** it is recognisable as the sheet's hooded teal archer: hood with the silver brow piece, white hair and braid, scarf, silver armor, quiver with blue arrows. It rigs to the KayKit skeleton: all the clips above play, the bow stays in the hand, no limb breaks. Same height as the ranger by construction.
- **Not as good as the drawing:** the texture is soft and painterly-blurry (512 px for the whole body, UVs from TRELLIS), the face is washed out and has lost the eyes' detail, the pointed ears read as small horns from above, the cape and legs have grey smeared patches, and the sheet's detail (gauntlet stripes, the boots' spikes) is mushy. At phone size the silhouette and colours read well; close up it does not.
- **Skinning:** nearest-vertex weights give small cloak artefacts in the draw pose (the cloak bunches near the bow arm).
- **Colour:** the brightening is a single gamma on the whole texture; the skin came out pale. A hand-tuned colour pass would improve it.
- **Not tested:** in-game (no `LOOK3D` entry yet), bot and ult clips, hero scale, performance (6,000 triangles, same as the earlier characters), team-colour trim.
- **Bow:** the existing prop (`w_bow_A_withString`); the sheet's hands are empty.

## Decisions for Orel

1. Is this quality acceptable as the hunter, or should the texture be improved first (higher resolution, hand colour pass, or a second TRELLIS run with the side and back views)?
2. If yes, a follow-up adds the `LOOK3D` entry (`render3d.js`, BOB's file) and the other four heroes use the same recipe.
