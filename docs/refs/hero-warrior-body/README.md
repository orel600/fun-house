# Warrior body: bare-chested gladiator (ARI, 9.11.2026). Preview only, nothing is switched.

`warrior-vs-concept.webp`: concept (`hero-concept-warrior.png`) left, new body right: top row game camera (Idle_A, Running_A, Death_A), bottom row front view. Real GPU, game lighting, the shipped clips on the Rig_Medium skeleton.

**Made the same way as the tank (#578):** `tools/blender/warriorbody.js` (a copy of `tankbody.js` with other colours and parts) on KayKit's Barbarian skeleton and skin weights. Skin-tone body (three tans, flat facets), black hair block and beard, scowl brows; big bronze pauldron with a "lion face" and spikes on the right shoulder, small leather one on the left; diagonal chest strap with a medallion; wide belt with a lion-medallion buckle; red tabard and leather skirt plates; leather-and-bronze bracers; bronze greaves with knee guards; sandals; torn red cape on the back. 4,116 tris, 12 colours, `tex:64 png`, key `warriorHF` (lazy).

**Build:** `node tools/blender/warriorbody.js <Barbarian.glb> art/heroes/WarriorHF.glb`, then `node tools/build3d.js C:/kk --only warriorHF`.

**Switch (BOB):** the warrior look in `js/render3d.js` is `model:'warrior'` (knight + blade). Use `model:'warriorHF'` behind the per-hero switch. The new body holds nothing: the existing blade prop (`dragonBlade`, the curved sword in the concept) goes on `handslotr` as it does today. The body is in the stance of the shared clips, not the concept's sword pose.

**Honest list:** KayKit chibi proportions (big head, no real muscles); the face is a blocky head with a dark bar that reads as an open mouth more than a beard; hair is a flat black block, not the concept's long messy hair; the concept's scars, blood and torn cloth detail are not there; the cape is a stiff flat panel that follows the chest; the lion pauldron is an octahedron plus spikes, not a lion. Not tested in-game, bot, ult, team colour or perf. Stacked on #578 (tank), which is stacked on #552, #555, #556.
