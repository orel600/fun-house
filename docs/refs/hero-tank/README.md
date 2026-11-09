# Tank body: obsidian-and-gold golem (ARI, 9.11.2026). Preview only, nothing is switched.

`tank-vs-concept.webp`: the concept (`hero-concept-tank.png`) on the left, the new body on the right: top row game camera (Idle_A, Running_A, Death_A), bottom row front view (14 deg). Real GPU, game lighting, the real shipped clips on the Rig_Medium skeleton (`tools/trellis/shoot-hero.js`, full 12-clip contact sheet was checked too).

**How it is made (no Blender, no AI, no account):** `tools/blender/tankbody.js` takes KayKit's Barbarian body (same skeleton and skin weights, so every existing clip plays), widens it (torso x1.3, arms and legs x1.4-1.5, weighted by the skin so there are no tears), paints it in three obsidian shades with flat normals, and adds rigid armor parts that are each skinned to one bone: pauldrons (spiked on the right), chest collar and glowing sun core with rays, belt and gold buckle, red tabard, hip plates, knee plates, boots with toe caps, bracers, and a gold-trimmed helmet with a glowing eye slit. Lava cracks are thin glowing strips snapped onto the body surface. 4,582 triangles, 13 palette colours, 64x64 palette + emissive map (`tex:64 fmt:png`), 213 KB lazy file `js/m3d/tankHF.js`.

**Build:** `node tools/blender/tankbody.js <Barbarian.glb> art/heroes/TankHF.glb`, then `node tools/build3d.js C:/kk --only tankHF`.

**Switch (BOB):** in `js/render3d.js` the `mb_tank` look is `{model:'barbarian', h:72, foot:15, ...}`. Use `model:'tankHF'` behind the per-hero switch (old model stays as the fallback). The new body has no axe and no hat, so the old "hide `2H_Axe` / `Barbarian_Hat`" notes from #552 are not needed. The hammer prop `w_item_stoneHammer` (#552) goes on `handslotr` as before, the crown `hat_tankCrown` on `head` (the helmet top is at head-bone y ~0.76; the crown band base is at 0.82, so it sits just above it). Shield prop on `handslotl` as today. `h:72` was tuned for the old body: the new one is about 2.41 high in model units vs 2.47, so keep `h` and check foot.

**Honest list of what falls short of the concept:**
- Proportions: KayKit is chibi (big head, short legs). The concept is a tall muscular colossus. The widening helps but it will never read as that.
- No stone texture: the body is flat-shaded dark facets. The concept's cracked, rocky surface and sharp gold filigree are not there; gold is simple boxes and cones.
- Helmet is a block (no crown spikes of its own); the separate crown from #552 is the crown.
- Lava cracks are few and straight; the chest core and eye glow are the strongest reads.
- Dark body on a dark ground reads low-contrast at phone size; the gold carries the silhouette.
- The hammer is not in the shot (it is the existing #552 prop). Not tested in the game itself, with the bot, in the ult, team colour or perf.
