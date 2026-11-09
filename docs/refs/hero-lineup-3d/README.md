# The five underworld heroes: current in-game models (ARI, 9.11.2026)

**What this is:** the five heroes as they look in the game today, side by side on empty floor. Left to right: tank, warrior, hunter, mage, assassin. 3D layer, real GPU (`ANGLE NVIDIA GeForce RTX 2070, D3D11`), the phone landscape viewport (844x390 at 2x), the real underworld camera (zoom 0.58, tilt 52).
**What this is not:** a claim that the models match Orel's concept images. It is the "current" side of that comparison. The concept images are not in the repo.

| File | View |
|---|---|
| `lineup-game.webp` | Game zoom, the whole screen with HUD (heroes are ~60 px tall, as in play) |
| `lineup-front.webp` | **Front view** (only the camera changes: tilt 14 instead of 52, 2.1x closer than game zoom, HUD hidden). Faces and armour are readable, so this is the one to set beside concept images. It is NOT how the game looks in play |
| `lineup-close.webp` | The same scene 2.1x closer, HUD hidden (the minimap stays), so the models can be read |

The first two are seen from the real game camera (from above), so faces and bodies are foreshortened: hats and helmets dominate. Level 1, no gear upgrades, team blue, the tank is "me" (gold ring).

Observations from the front view, not judgements: the tank and the warrior wear similar grey plate (the tank has a blond head and no helmet, the warrior a visor-less helmet); no axe or hammer is visible on the tank in this pose; the hunter is a hooded ranger with a bow; the mage has the purple witch hat and a floating pet; the assassin is a small green-hooded rogue.

Regenerate: `node tools/hero-lineup.js . <out dir> --gpu` (needs playwright; the images here are converted from the PNG output to webp).
