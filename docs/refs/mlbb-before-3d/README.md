# Underworld skills, "before" shots in 3D (ARI, 9.11.2026)

Real 3D frames (the default graphics mode, SwiftShader in CI-style headless Chromium), 844x390 at 2x, seed 7, on main `e4bb740`. They're the "before" for wave 2.2 of [mlbb-fx-plan.md](../../concept/mlbb-fx-plan.md); the gap table is [mlbb-fx-gap.md](../../concept/mlbb-fx-gap.md).

- `moba-skills.webp`: 5 kits in rows (tank, warrior, hunter, mage, assassin), each with the attack, s1 and s2.
- `moba-ults.webp`: the five ults, 2 columns.

**Two notes:**
- The assassin row is **already after #531** (the purple effects from #485 are wired), so it's not a true "before" for the assassin.
- Taken with `tools/moba-skill-shots.js` plus three changes (3D, SwiftShader launch args, `R3D.drawEvery=0` so the 3D layer draws every frame). A `--gfx 3d` option in that tool would make this repeatable; it isn't added here (docs only).
