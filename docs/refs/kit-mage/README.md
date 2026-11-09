# Mage kitbash: circlet and floating crystal (ARI, 9.11.2026)

`mage-parts.webp`: the current mage (`mb_mage`: purple witch hat, staff with the water tint) in the top row, and the same with the new parts in the bottom row. 3D layer, real GPU, game lighting, real clips (`Idle_A`, `Running_B`, `Ranged_Magic_Shoot`, `Ranged_Magic_Spellcasting`, `Death_A`), game camera, front view and a head close-up. `tools/blender/shoot-kit.js` (from the assassin PR #556, which also holds the part generator).

What it shows:
- **Circlet**: a thin silver ring with three water-blue crystals (`#3F7BF5`) on the forehead. It replaces the witch hat in this test (`Mage_Hat` hidden), which makes the mage look much less like the current character. It follows the head in every clip. Honest limit: it fits the hair, but the ring pokes slightly above the hair at the back. Without hiding the hat it would be buried under it.
- **Floating crystal**: a blue octahedron with two cyan shards (`#46D3E6`) hovering above the left hand. In the stills it reads as a spark beside the hip in idle and near the hand in the cast. The code has to bob it; it is static here.
- **Not changed:** the purple robe (the concept is blue and white with a flowing cloth), the dark hair (the concept is white). Nothing here approaches the concept's cloth.
- **Not tested:** in the game itself (no mount code yet), team colour, perf.

Mounts and build rows: `art/parts/README.md` (in #556).
