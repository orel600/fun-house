# Assassin kitbash: second dagger and half-mask (ARI, 9.11.2026)

`assassin-parts.webp`: the current assassin (`mb_assassin`: the rogue with the blade prop) in the top row of each block, and the same with the new parts in the bottom row. 3D layer, real GPU, game lighting, the real clips (`Idle_A`, `Running_A`, `Melee_1H_Attack_Slice_Horizontal`, `Melee_1H_Attack_Chop`, `Death_A`), game camera (52 degrees), front (14 degrees) and a head close-up. Made with `tools/blender/shoot-kit.js`.

What it shows:
- **Second dagger** in the left hand: the KayKit dagger with its metal recoloured lilac (`#C7A6FF`) and glowing. It follows the hand through all five clips and does not clip the body at the extremes. It is somewhat long for the left hand in the idle pose (it points across the hip); scale 1.0 would shorten it.
- **Half-mask**: a dark band over the eyes with two lilac slits. It sits on the face inside the hood and follows the head in every clip. It reads at phone size; up close it is a plain band (88 triangles).
- **Not changed:** the body is still the green hooded rogue, not the concept's black and purple assassin. Purple trim on the body or hood would need a recolour of the rogue's palette (not done).
- **Not tested:** in the game itself (no mount code yet), the dagger on the bot clips, the hold of the dagger in the real basic attack, team colour.

Parts and build rows: `art/parts/README.md`.
