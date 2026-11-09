# Getting closer to the five concept heroes: what the repo's local path can and can't do (ARI, 9.11.2026)

**Status:** feasibility only. Nothing built, nothing bought, no accounts opened. For Orel to decide. Companion: [hero-fidelity-gaps.md](hero-fidelity-gaps.md) (the gap per hero).
**Orel's direction (via MAX, 9.11):** as close to the Drive concepts as possible, how doesn't matter. This document says how close each route can actually get.
**Sources:** `tools/pilot3d`, `tools/trellis`, `tools/blender`, and the results already in [3d-assets.md](../3d-assets.md) (pilot hero, Nir's hero, Orel's hero, the Parosh pet). I read these. I did not run any model generator.

## What exists and what it actually needs

| Piece | What it does | Runs where | Cost / account |
|---|---|---|---|
| **Turnaround sheet** (the prompt in 3d-assets.md) | A character drawn front, side and back in a T-pose in KayKit proportions | A person in the **Gemini app** (Nir's or Orel's own account). Claude can't do this step | Free tier, an account they already use |
| **`tools/pilot3d`** (Hunyuan3D-2mv shape, paint from the sheet, `rig.py`) | Sheet to a 5,600-triangle character on the **KayKit knight skeleton**, so every KayKit animation works | Python. The shape step calls a free Hugging Face space | Free. The coloured Hunyuan version is a paid tier (about $9/month), so colour is painted from the sheet instead |
| **`tools/trellis`** (TRELLIS: one front image to a coloured mesh) plus `reskin.py` | Shape and colour from one image. `reskin.py` copies skeleton and weights from an existing character by nearest vertex, and stretches the mesh into the old character's box | A **GitHub workflow** (`trellis.yml`) with the `HF_TOKEN` secret. Claude sessions can't reach huggingface.co | Free (daily quota; Orel added the token) |
| **`tools/blender`** | Small props (bows, staffs, hammers) built from code in the KayKit palette, up to about 1,000 triangles | Blender, headless. The README installs it per cloud session. **It is not installed on this PC** | Free software, needs an install here |
| This PC's GPU | NVIDIA RTX 2070, 8 GB. No PyTorch, no Blender | Local generation would mean installing PyTorch and multi-GB model weights | Free but **untested**. Image-to-3D models like TRELLIS usually want more than 8 GB, so I would not plan on it |

Nothing in this list needs a paid API. Paid options exist (Tripo about $20/month for auto-rig, Hunyuan 2.1 PRO about $9/month for colour). They are **not** needed for the routes below.

## What the existing results tell us about quality

The three characters already made this way (pilot hero, Nir, Orel) look like KayKit-proportioned chibi figures coloured like their source drawing: soft, slightly muddy faces up close, readable at phone size, about 5,600 triangles and 360-500 KB each, animations correct because the skeleton is KayKit's. They do not look painterly. The generators reproduce silhouette and colour blocks, not fine armor detail, lava cracks, fur or cloth shading.

## Routes, from closest to the painting to most in-style

**Route 1: restyle each concept into a KayKit-proportion sheet, then the proven path (pilot3d, or TRELLIS plus reskin).**
Gemini redraws the concept as a chibi turnaround: the same armor shapes, colours, crown, glowing core and weapon. Then the existing pipeline. Expect a recognisable, game-consistent version of each concept, with its colours and main silhouette features baked into the mesh. It will **not** have painterly materials.
- Needs: a person to iterate the sheet in Gemini (3-4 tries per hero, a few minutes each), then Claude time. About one Claude session per hero.
- Quality: the same as Nir's hero. About the best the free tools reach.
- Risks: (a) a weapon drawn in the sheet is **baked into the body mesh**. It can't be swapped and it moves with the torso, not the hand. (b) The game's hand-weapon slot would then duplicate it, so each such hero needs a decision: baked weapon and no slot, or a sheet without the weapon plus a separate prop. (c) Sheets must be a T-pose with empty hands, which fights the crouched assassin and the tank with a hammer on his shoulder.

**Route 2: TRELLIS directly on the concept image, then `reskin.py`.**
Closest to the concept's detail, but the concept has realistic 7-head proportions and `reskin.py` stretches the result into the chibi box of the old character, so it comes out squashed. Skinning by nearest vertex also can't handle the mage's long robe (legs and robe fuse and tear in the run cycle) or the tank's oversized arms. I would only try it as a quick experiment per hero in the GitHub workflow, not plan on it.

**Route 3: kitbash (the KayKit bodies plus extra parts).**
Keep the five working bodies. Add bone-attached parts, as 3d-assets.md already suggests: crown, pauldrons, cape tint, a glowing chest core, a hammer from `w_hammer_A` or a Blender-built one, a second dagger in the left hand. Recolour the palette toward obsidian, red and teal. Warrior to barbarian plus `dragonBlade` is the closest body swap (**not approved**).
- Needs: Blender installed on this PC (free, about 300 MB; I would ask first), plus Claude time. About half a session per hero.
- Quality: fully consistent with the game and animates perfectly, but **visibly further from the painting** than Route 1. It is still a KayKit character with accessories.

**Route 4: paid or hosted generators (Tripo, Meshy, Hunyuan 2.1 PRO).**
Possibly cleaner colour and auto-rigging. Not needed for the pipeline above. **Not recommended and not pursued.**

## Per hero

| Hero | Route 1 effort and catch | Route 3 effort and catch | Realistic result |
|---|---|---|---|
| **Tank** | Big obsidian plate, crown and hammer in one sheet. The hammer is baked (no hand swap), and a T-pose with the hammer on the shoulder is awkward. About 1 session plus Gemini tries | Crown, shoulder plates, chest core and a dark/gold tint on the barbarian, plus `w_hammer_A`. Half a session | An armored, crowned stylized brute. Not the concept's obsidian bulk |
| **Warrior** | Bare-chested fighter with a huge curved blade: sheet without the blade, blade as a prop (`dragonBlade`). 1 session | Barbarian body swap plus `dragonBlade` and a red cape. Half a session | The biggest silhouette improvement of the five, once the body swap is approved |
| **Hunter** | Smallest gap. Teal cloak and dark armor in the sheet, bow as a prop. About 1 session | Tint, a cape part and `stormBow`. A few hours | Good. Closest to its concept already |
| **Mage** | The robe is the problem (cloth, long hair, crown). The sheet needs a short robe, because flowing cloth won't survive skinning. 1 session, higher risk | Robe tint toward blue-white, an ice-blue orb, a crown part. Half a session | A blue-robed mage with no flowing cloth |
| **Assassin** | The crouched pose can't be a T-pose, so the sheet is a standing masked ninja, and the crouch comes from the `Crouching` / `Sneaking` clips. 1 session | Dark and purple tint, a mask part, a second dagger, purple glow. Half a session | A dark masked rogue with purple glow, not the painted look |

Total: Route 1 is about 5 Claude sessions plus several rounds of Gemini by Nir or Orel. Route 3 is about 2-3 sessions plus a Blender install. These are estimates, not measurements.

## Costs that apply to either route

- **Size:** each new hero is roughly 360-500 KB in `models3d.js`. Five is about 2-2.5 MB on top of the current file (the file grew by 2.5 MB at the KayKit 2.0 step).
- **Scale:** the plan to make heroes larger (about +20-30%) is separate and works with any model.
- **Team colour:** blue and red must survive any restyle (trim on shoulder or cloth, not on the emissive accent).
- **Shared work:** these routes replace the `LOOK3D.mb_*` models, which is `render3d.js` territory (BOB's files).

## Honest bottom line

With free tools, the best reachable result is a **recognisable stylized version** of each concept (shape cues and colours), not the concept itself. Closest within reach is Route 1, with Route 3 as the safer fallback for individual heroes (the mage and the tank are where Route 1 is most likely to fail). Anything nearer to the painted look needs real modeling or paid custom work, which is not authorized.

## For Orel to decide

1. Route 1 (closer, more effort, some risk), Route 3 (consistent, less close), or Route 1 per hero with Route 3 as the fallback.
2. Warrior to barbarian plus `dragonBlade`.
3. Whether Nir or Orel can run the Gemini sheets (a free step that only a person with the app can do).
4. Whether I may install Blender on this PC (free, 300 MB) for Route 3.
