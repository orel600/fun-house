# Readability (feature/readability), 7.11.2026
Phone landscape 844x390 @2x, 3D, shadows on (zm-shadow=1), SwiftShader.
- before/after-forest.png: hero on a forest trail with trees between camera and hero. Before: hero hidden. After: trees dither to ~30% in a soft circle around the hero.
- before/after-meadow-fight.png: 6 enemies around the hero. After: white ring under hero, darker contact shadow + thin dark rim under enemies.

Frame cost (tools/perf.js --only world --cpu 4, A/B on the same build with ?read=0 vs on, two runs each):
- read=0: 42.9 / 40.2 ms avg, 77/76 draw calls
- read=1: 35.5 / 40.5 ms avg, 80/79 draw calls
No measurable difference (SwiftShader noise ~20%); +3 draw calls (three new ground-mark layers). No per-frame material cloning: one shared uniform set.
