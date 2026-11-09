# Warrior body: three options side by side (ARI, 9.11.2026). Nothing is swapped.

`warrior-compare.webp`: left, Orel's turnaround sheet (front view; a **reference drawing, not a model**). Right, the two in-game candidates in 3D on the real GPU: **knight + blade** (the warrior today, `LOOK3D.mb_warrior`) and **barbarian + dragonBlade**. Each in idle and two frames of `Melee_1H_Attack_Slice_Horizontal`, from the game camera (52 degrees) and from the front (14 degrees). Made with `tools/blender/shoot-warrior.js`.

What the picture shows (observations):
- **Concept:** bare-chested, long dark hair and beard, red cape and torn loincloth, spiked grey pauldron, studded gauntlets and greaves, a huge curved blade (the blade is in the other sheet, not this one).
- **Knight today:** full helmet and grey plate: the opposite of bare-chested. Face hidden.
- **Barbarian:** a bearded face and a bare-ish head (a bear-fur hat, which can be hidden, as is done for the tank crown), blue vest and brown skirt, no cape, no pauldron. The closest body of the two. `dragonBlade` is a large purple and gold blade: visibly oversized in the frame and not the concept's grey-red curved blade.
- Neither matches the concept's hair, scars, red cape or armor pieces. The barbarian swap is the nearer of the two, not a match.

**Not applied.** If Orel approves the swap, the whole change is one line: `LOOK3D.mb_warrior` in `js/render3d.js` from `{model:'knight', ..., props:{blade:{prop:'blade',...HAND_R}}}` to `{model:'barbarian', h:66, foot:14, props:{blade:{prop:'w_item_dragonBlade',...HAND_R}}, ...}` plus hiding the barbarian's `2H_Axe` mesh and fur hat; dragonBlade needs a scale check (it mounts at 1.2 here) and the other animations (spin, rage) need a look. That belongs to BOB's files.
