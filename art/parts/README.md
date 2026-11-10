# Kitbash parts for the underworld heroes (ARI, 9.11.2026)

Small parts on top of the **current** KayKit bodies (no new body, no swap). Made by `tools/blender/kitparts.js` (shapes in code) and `tools/blender/recolor-weapon.js` (a recoloured KayKit dagger). All use the game's `own_palette` format: a 64x64 palette texture plus an emissive map, flat normals, double-sided. The glow is the palette colour itself; no extra geometry and no extra material. Triangles: mask 88, circlet 184, crystal 24, plume 42, dagger 374.

| Part | File | Mount (bone, local transform) | Accent colour (damage-type rule) |
|---|---|---|---|
| Assassin half-mask with two glowing eye slits | `assassinMask.glb` | `head`, identity (already in head-bone space; the face is +z) | lilac `#C7A6FF` slits, black band `#1B1426` |
| Assassin second dagger (KayKit `dagger_A`, metal cells recoloured) | `shadowDagger.glb` | `handslotl`, pos `[0,0.033,0]`, rot identity, scale 1.0 to 1.2 | lilac `#C7A6FF`, emissive 0.7 |
| Mage circlet with three crystals | `mageCirclet.glb` | `head`, identity; hide `Mage_Hat` (the circlet replaces the witch hat) | silver ring, crystals water-blue `#3F7BF5` |
| Mage floating crystal | `mageCrystal.glb` | `handslotl`, pos about `[0,0.42,0]`; the code should bob it (about +-0.05 in y) | `#3F7BF5` with two `#46D3E6` shards |
| Warrior helmet plume | `warriorPlume.glb` | `head`, identity | red `#B3262E`/`#C93A41` (cloth, not an accent) |

Warrior sword edge accent: no new asset. The existing `blade` prop with `tint:'#ECE7DC'` and emissive about 0.5 (chalk white, the physical colour). The in-game `TINT` map has no `chalk` key, so use the hex value or add the key.

## To put them into the game build (after #552 lands)

Nothing here is in `models3d.js` yet, to avoid conflicting with #552 (which adds `ready:true` hats to `tools/build3d.js`). Then:
- hats: `HATS` rows `assassinMask`, `mageCirclet`, `warriorPlume` with `{src:path.join(ROOT,'art/parts/<name>.glb'),ready:true,tex:64}`, then `node tools/build3d.js C:/kk --only hats --hats=assassinMask,mageCirclet,warriorPlume` (they become `hat_<name>`);
- items: `ITEMS` rows `shadowDagger` and `mageCrystal` with `{src:raw-path,ready:true,tex:64}`, then `node tools/build3d.js C:/kk --only items --items=shadowDagger,mageCrystal` (they become `w_item_<name>`);
- the mount code (BOB): add the part to the bone listed above; hide `Mage_Hat` for the circlet. Verified only in the preview harness (`tools/blender/shoot-kit.js`), not in the game.

Honest limits: these are accessories on KayKit bodies, not the concept designs. The assassin's body is still the green hooded rogue (the concept is black and purple), the mage keeps her purple robe, and the warrior's knight stays helmeted (the concept is bare-chested), so the plume is a decoration, not a step toward the concept.
