# מתנקש חדש (ARI, 9.11.2026). Preview only, nothing is switched.

`assassin-vs-concept.webp`: concept left, new body right: top row game camera (Idle_A, Running_A, Death_A), bottom row front view. Real GPU, game lighting, the shipped clips on the Rig_Medium skeleton.

Black leather body, black mask with glowing lilac eye slits, purple scarf and torn purple cape, silver pauldron/bracers/greaves with lilac gems, lilac buckle, black hair with a purple-tipped ponytail. ~3,900 tris.

**Build:** `node tools/blender/assassinbody.js <Barbarian.glb> art/heroes/AssassinHF.glb`, then `node tools/build3d.js C:/kk --only assassinHF`. Key `assassinHF` (lazy file js/m3d/assassinHF.js), `tex:64 png`, same method as the tank (#578).

**Switch (BOB):** use `model:'assassinHF'` on the assassin look in js/render3d.js behind the per-hero switch; old model stays as fallback. Props stay as today (weapon on the hand slot).

**Honest list:** the ponytail reads as a loop, the hair is a big black block, the concept's crouching pose and glowing curved daggers are not in the body (daggers are the existing prop #556); the body is dark and low contrast on dark ground. Chibi KayKit proportions, flat-shaded blocks, no texture detail. Not tested in-game, bot, ult, team colour or perf. Stacked on #580 (mage), #579, #578, #552, #555, #556.
