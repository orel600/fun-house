# Warrior kitbash: plume and sword-edge accent (ARI, 9.11.2026). No body swap.

`warrior-parts.webp`: the current warrior (`mb_warrior`: the knight with the blade prop) in the top row, and the same with the new parts in the bottom row. 3D layer, real GPU, game lighting, real clips (`Idle_A`, `Running_A`, `Melee_1H_Attack_Slice_Horizontal`, `Melee_1H_Attack_Chop`, `Death_A`), game camera, front view and a head close-up. `tools/blender/shoot-kit.js` (from the assassin PR #556).

What it shows:
- **Red plume** on the helmet (three red cones, 42 triangles). It follows the head and stays attached in every clip. It reads as a red crest.
- **Sword edge accent**: the existing blade prop, tinted chalk white (`#ECE7DC`, the physical damage colour) with emissive about 0.5. No new geometry. At phone size it reads as a pale glowing blade.
- **Honest limit:** the concept warrior is bare-chested with long hair, a red cape and a curved glowing blade. A crest on a visored helmet moves nothing toward it; it is a decoration, and the warrior body swap stays unapproved and untouched. A spiked pauldron was not built.
- **Not tested:** in the game itself (no mount code yet), team colour.

Mounts and build rows: `art/parts/README.md` (in #556).
