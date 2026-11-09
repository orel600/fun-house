# The five underworld heroes: current in-game models (ARI, 9.11.2026)

**What this is:** the five heroes as they look in the game today, side by side on empty floor. Left to right: tank, warrior, hunter, mage, assassin. 3D layer, real GPU (`ANGLE NVIDIA GeForce RTX 2070, D3D11`), the phone landscape viewport (844x390 at 2x), the real underworld camera (zoom 0.58, tilt 52).
**What this is not:** a claim that the models match Orel's concept images. It is the "current" side of that comparison. The concept images are not in the repo.

| File | View |
|---|---|
| `lineup-game.webp` | Game zoom, the whole screen with HUD (heroes are ~60 px tall, as in play) |
| `lineup-close.webp` | The same scene 2.1x closer, HUD hidden (the minimap stays), so the models can be read |

Seen from the real game camera (from above), so faces and bodies are foreshortened: hats and helmets dominate. Level 1, no gear upgrades, team blue, the tank is "me" (gold ring).

Observations, not judgements: the tank is a bare-headed barbarian with an axe or pole at his side; the warrior is a helmeted knight; the hunter is a hooded ranger with a bow; the mage has the purple witch hat and a floating pet; the assassin is a small green-hooded rogue.

Regenerate: `node tools/hero-lineup.js . <out dir> --gpu` (needs playwright; the images here are converted from the PNG output to webp).
