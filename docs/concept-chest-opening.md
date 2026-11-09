# Concept: chest opening moment (for Nir's review)

Concept only, nothing here authorizes code. New visual design needs Nir's approval first. The arena (Orel) is out of scope.

## Source
- Inspiration: EgorV (@qutsune), "7 steps to a juicy chest opening": https://www.tiktok.com/@qutsune/video/7698024308156812565
- Nir (9.11.2026): the fun is the chance of something valuable and wanting the next chest. Direction: useful common rewards plus a chance of an exceptional item, so an opening is never empty.

## The 7 steps in the video (adapt to our style)
1. Wobble and squash, faster and faster. 2. Stretch up and bounce back. 3. Lid slams open, a few frozen frames, camera shake. 4. Gold light from inside, slow turning rays. 5. A shockwave ring on the slam. 6. Big stars shoot out and pop. 7. Tiny sparks keep floating up.

## Today (read from code, not verified in play)
- **World secret chests** (js/secrets.js): ~15 fixed chests in six regions, some level-gated (curiosity.js). Hidden behind a rock/bush with a twinkle hint; opening = walk close, loot drops at once with the generic secret celebration. Loot: coins, wood, stone, iron, silver, gems.
- **Buried treasure** (pet digs it out): already has an anticipation ritual; small chance of a star.
- **Depths floor chest** (js/depths.js): the only inspected chest with equipment (tiered by depth).
- **Sunken chest** (js/lake-bell.js): revealed once by the fog bell.
- **Arena chests: Orel's. Don't touch.**
Verify in play how each looks today before calling anything missing.

## Proposal
1. **Prototype on ONE chest:** `m_chest` in the meadow (the first one a new player meets). Sequence from existing effects: wobble/squash (juiceSquash), pop with hit-stop (jStop) + small shake (S.shake), gold pillar (celebrate or the loot rarity pillar), shockwave ring (JUICE.poof), gold stars (jBurst), loot scatter (drops), faint sparkle while revealed but unopened. Flat-color style, particle caps (HITFX.parts, FXC.cap), respect "fewer effects"/reduced motion, numbers in one object at the top of the file.
2. **Loot:** keep base rewards (check they're still useful where the chest is found); add a chance of equipment via lootRoll (loot.js); rare outcome uses the existing rarity tiers and pillar. Odds are tuning inside the build, not set here.
3. **Later, only if the prototype works:** buried treasure (moment at the reveal), depths chest, sunken chest. No arena or global changes.

## Rules
Own feature branch, draft PR with the Hebrew sections. Text in lang.js, English only (game is English only since 7.11). New bot step: chest opens, loot granted, effects capped. Don't delete the generic secret celebration (shrines/lookouts keep it).

## Verification
Before: play `m_chest` on the phone and note how it feels today. After: same chest, before/after, plus the bot step.
