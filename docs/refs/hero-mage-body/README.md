# קוסמת חדשה (ARI, 9.11.2026). Preview only, nothing is switched.

`mage-vs-concept.webp`: concept left, new body right: top row game camera (Idle_A, Running_A, Death_A), bottom row front view. Real GPU, game lighting, the shipped clips on the Rig_Medium skeleton.

Navy long robe with pale-blue hem and tabard, glowing cyan sleeve cuffs, silver collar and belt with a blue core gem, silver-lavender long hair, silver circlet with three blue crystals, ribbon cape. ~3,950 tris.

**Build:** `node tools/blender/magebody.js <Barbarian.glb> art/heroes/MageHF.glb`, then `node tools/build3d.js C:/kk --only mageHF`. Key `mageHF` (lazy file js/m3d/mageHF.js), `tex:64 png`, same method as the tank (#578).

**Switch (BOB):** use `model:'mageHF'` on the mage look in js/render3d.js behind the per-hero switch; old model stays as fallback. Props stay as today (weapon on the hand slot).

**Honest list:** the robe is a rigid skirt skinned to the hips (legs are inside it, so no skirt swing); no flowing water-cape, no staff or floating crystal in the body (existing props); the face is a blocky head; the hair is blocks. Chibi KayKit proportions, flat-shaded blocks, no texture detail. Not tested in-game, bot, ult, team colour or perf. Stacked on #579, #578, #552, #555, #556.
