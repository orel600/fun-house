# Combat drama, measured (9.11.2026)

Concept: [concept-combat-drama.md](concept-combat-drama.md). Code: `js/drama.js`. Tool: `node tools/combat-feel.js --group --n 4` (seed 7, 2D), **before** = same code with `--nodrama`.
A group = a real world group (1-3 foes in most places), affixes removed, hero cannot die. Averages over 6 regions × 3 zones.

## Targets vs result

| target | before | after | |
|---|---|---|---|
| group with skills not slower than auto-only before (s, fresh / mid) | warrior 5.7/3.8 · hunter 6.2/3.6 · mage 4.8/3.4 | warrior 4.4/2.8 · hunter 3.0/2.3 · mage 2.0/0.8 | ✓ |
| auto-only at most +35% slower | - | warrior +28%/+34% · hunter +26%/+28% · mage +23%/+29% | ✓ |
| auto share of damage 40-55% (fresh / mid) | warrior 58/59 · hunter 46/35 · mage 38/30 | warrior 47/40 · hunter 36/22 · mage 30/13 | warrior ✓, hunter and mage below |
| one skill kills ≥80% of a weaker group (mid hero, start+near) | warrior 22% · hunter 40% · mage 58% | warrior 47% · hunter 81% · mage 80% | hunter, mage ✓; warrior ✗ |
| weaker (fresh, far): 0.3-0.6 health bars lost standing still | auto: 0.20 / 0.38 / 0.15 · skills: 0.13 / 0.13 / 0.02 | auto: 0.28 / 0.55 / 0.25 · skills: 0.13 / 0.15 / 0.03 | auto fights ≈ ✓, skill fights end too fast |

What it means:
- **Auto is the weaker tool now**, and fights with skills are shorter than before. Ordinary fights did not get longer.
- **Hunter and mage:** skills already did most of the damage before (auto 30-46%). Now it is more. That is the direction Nir asked for, but under the 40% target. One number if it is too much: `DRAMA.bal.skill` (1.3).
- **Warrior crush:** quake lands on the group centre, but the world blast is small (radius ~97), so spread groups survive. Next step if wanted: a bigger blast at a level gap, not more damage.
- **Pressure when weaker:** standing still in a long auto fight now costs 0.25-0.55 bars (was 0.15-0.38). With skills the group dies in 1-4 s, before the pressure lands. Not tested: a bot that moves out of the warnings.

## Full tables

### before: warrior

| region | hero | zone | size | auto: clear s · taken | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |
|---|---|---|---|---|---|---|---|
| meadow | fresh 1 | start | 1.3 | 2.0 · 0.0 | 1.2 · 59% · 0.0 · 0.0 | 1.4 · 13% | quake |
| meadow | fresh 1 | near | 2.3 | 3.5 · 0.0 | 4.0 · 77% · 0.3 · 0.1 | 4.7 · 0% | quake |
| meadow | fresh 1 | far | 2.3 | 4.9 · 0.2 | 5.2 · 80% · 0.2 · 0.2 | 5.7 · 0% | quake |
| meadow | mid 6 | start | 1.3 | 1.7 · 0.0 | 0.7 · 31% · 0.2 · 0.0 | 1.5 · 25% | quake,shield,whirl |
| meadow | mid 6 | near | 2.3 | 2.9 · 0.0 | 2.0 · 46% · 0.3 · 0.0 | 3.7 · 0% | quake,shield,whirl |
| meadow | mid 6 | far | 2.3 | 3.8 · 0.1 | 2.1 · 44% · 0.3 · 0.0 | 4.0 · 0% | quake,shield,whirl |
| lake | fresh 6 | start | 1.3 | 2.5 · 0.0 | 0.9 · 29% · 0.2 · 0.0 | 2.6 · 25% | quake,shield,whirl |
| lake | fresh 6 | near | 2.0 | 7.3 · 0.2 | 5.2 · 54% · 0.2 · 0.1 | 6.9 · 0% | quake,shield,whirl |
| lake | fresh 6 | far | 2.3 | 11.2 · 0.4 | 6.9 · 58% · 0.1 · 0.1 | 9.2 · 0% | quake,shield,whirl |
| lake | mid 12 | start | 1.3 | 1.0 · 0.0 | 0.9 · 31% · 0.0 · 0.0 | 1.1 · 0% | quake,petrify,shield |
| lake | mid 12 | near | 2.0 | 4.7 · 0.1 | 3.9 · 53% · 0.1 · 0.0 | 4.1 · 25% | quake,petrify,shield |
| lake | mid 12 | far | 2.3 | 5.6 · 0.1 | 5.2 · 70% · 0.1 · 0.0 | 6.2 · 13% | quake,petrify,shield |
| ridge | fresh 12 | start | 1.3 | 2.0 · 0.0 | 1.9 · 44% · 0.0 · 0.0 | 2.1 · 0% | quake,petrify,shield |
| ridge | fresh 12 | near | 2.3 | 8.1 · 0.2 | 6.1 · 70% · 0.2 · 0.1 | 8.0 · 13% | quake,petrify,shield |
| ridge | fresh 12 | far | 2.3 | 7.5 · 0.2 | 7.6 · 64% · 0.1 · 0.2 | 7.7 · 0% | quake,petrify,shield |
| ridge | mid 18 | start | 1.3 | 1.2 · 0.0 | 1.0 · 74% · 0.1 · 0.0 | 1.0 · 50% | quake,petrify,shield |
| ridge | mid 18 | near | 2.3 | 3.8 · 0.0 | 3.2 · 45% · 0.2 · 0.0 | 4.0 · 13% | quake,petrify,shield |
| ridge | mid 18 | far | 2.3 | 5.0 · 0.1 | 4.9 · 65% · 0.1 · 0.0 | 6.8 · 0% | quake,petrify,shield |
| desert | fresh 18 | start | 1.3 | 1.7 · 0.0 | 1.3 · 24% · 0.3 · 0.0 | 2.0 · 0% | quake,petrify,shield |
| desert | fresh 18 | near | 2.3 | 4.9 · 0.1 | 4.8 · 68% · 0.2 · 0.0 | 5.0 · 0% | quake,petrify,shield |
| desert | fresh 18 | far | 2.5 | 7.9 ⚠1 · 0.1 | 7.0 · 55% · 0.2 · 0.1 | 7.5 · 0% | quake,petrify,shield |
| desert | mid 24 | start | 1.3 | 1.3 · 0.0 | 1.1 · 24% · 0.3 · 0.0 | 1.1 · 25% | quake,petrify,shield |
| desert | mid 24 | near | 2.3 | 4.2 · 0.0 | 4.1 · 70% · 0.2 · 0.0 | 4.9 · 0% | quake,petrify,shield |
| desert | mid 24 | far | 2.5 | 5.4 ⚠1 · 0.0 | 5.1 · 57% · 0.2 · 0.0 | 6.5 · 0% | quake,petrify,shield |
| storm | fresh 24 | start | 1.3 | 1.6 · 0.0 | 1.3 · 24% · 0.3 · 0.0 | 0.8 · 75% | quake,petrify,shield |
| storm | fresh 24 | near | 2.3 | 7.3 · 0.1 | 6.0 · 67% · 0.2 · 0.0 | 6.6 · 13% | quake,petrify,shield |
| storm | fresh 24 | far | 2.3 | 8.1 · 0.1 | 6.6 · 64% · 0.3 · 0.1 | 7.8 · 13% | quake,petrify,shield |
| storm | mid 30 | start | 1.3 | 1.3 · 0.0 | 1.5 · 93% · 0.0 · 0.0 | 1.1 · 75% | quake,petrify,shield |
| storm | mid 30 | near | 2.3 | 4.4 · 0.0 | 4.7 · 56% · 0.2 · 0.0 | 4.6 · 21% | quake,petrify,shield |
| storm | mid 30 | far | 2.3 | 7.8 · 0.1 | 6.3 · 69% · 0.2 · 0.0 | 7.7 · 0% | quake,petrify,shield |
| shadow | fresh 30 | start | 1.3 | 2.1 · 0.0 | 1.8 · 76% · 0.0 · 0.0 | 1.6 · 50% | quake,petrify,shield |
| shadow | fresh 30 | near | 2.3 | 7.0 · 0.1 | 5.0 · 72% · 0.2 · 0.1 | 6.3 · 0% | quake,petrify,shield |
| shadow | fresh 30 | far | 2.3 | 12.5 · 0.2 | 8.3 · 67% · 0.3 · 0.1 | 11.0 · 13% | quake,petrify,shield |
| shadow | mid 36 | start | 1.3 | 1.6 · 0.0 | 1.8 · 75% · 0.0 · 0.0 | 2.1 · 25% | quake,petrify,shield |
| shadow | mid 36 | near | 2.3 | 4.8 · 0.1 | 5.1 · 76% · 0.1 · 0.0 | 5.9 · 0% | quake,petrify,shield |
| shadow | mid 36 | far | 2.3 | 8.6 · 0.1 | 7.3 · 81% · 0.1 · 0.0 | 9.5 · 0% | quake,petrify,shield |

### before: hunter

| region | hero | zone | size | auto: clear s · taken | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |
|---|---|---|---|---|---|---|---|
| meadow | fresh 1 | start | 1.3 | 2.6 · 0.0 | 2.6 · 72% · 0.0 · 0.0 | 2.4 · 0% | zap |
| meadow | fresh 1 | near | 2.3 | 7.2 · 0.1 | 5.2 · 77% · 0.3 · 0.0 | 5.0 · 13% | zap |
| meadow | fresh 1 | far | 2.3 | 10.1 · 0.3 | 7.2 · 72% · 0.4 · 0.2 | 7.3 · 0% | zap |
| meadow | mid 6 | start | 1.3 | 2.1 · 0.0 | 0.8 · 36% · 0.1 · 0.0 | 1.9 · 0% | zap,vines,trap |
| meadow | mid 6 | near | 2.3 | 4.6 · 0.0 | 1.4 · 46% · 0.2 · 0.0 | 4.4 · 0% | zap,vines,trap |
| meadow | mid 6 | far | 2.3 | 7.9 · 0.2 | 2.6 · 41% · 0.2 · 0.0 | 6.1 · 0% | zap,vines,trap |
| lake | fresh 6 | start | 1.3 | 3.4 · 0.0 | 0.7 · 8% · 0.3 · 0.0 | 1.3 · 75% | zap,vines,trap |
| lake | fresh 6 | near | 2.0 | 14.6 · 0.4 | 4.6 · 39% · 0.1 · 0.0 | 10.0 · 13% | zap,vines,trap |
| lake | fresh 6 | far | 2.3 | 19.7 · 0.9 | 5.3 · 26% · 0.4 · 0.2 | 16.3 · 0% | zap,vines,trap |
| lake | mid 12 | start | 1.3 | 0.7 · 0.0 | 0.3 · 24% · 0.3 · 0.0 | 0.2 · 88% | zap,chain,vines |
| lake | mid 12 | near | 2.0 | 4.0 · 0.0 | 1.2 · 32% · 0.3 · 0.0 | 2.2 · 25% | zap,chain,vines |
| lake | mid 12 | far | 2.3 | 5.0 · 0.1 | 2.5 · 29% · 0.4 · 0.0 | 4.2 · 13% | zap,chain,vines |
| ridge | fresh 12 | start | 1.3 | 1.4 · 0.0 | 0.5 · 11% · 0.3 · 0.0 | 1.3 · 0% | zap,chain,vines |
| ridge | fresh 12 | near | 2.3 | 7.4 · 0.3 | 3.6 · 43% · 0.1 · 0.0 | 6.3 · 0% | zap,chain,vines |
| ridge | fresh 12 | far | 2.3 | 7.8 · 0.3 | 3.6 · 54% · 0.1 · 0.0 | 7.5 · 0% | zap,chain,vines |
| ridge | mid 18 | start | 1.3 | 0.7 · 0.0 | 0.3 · 8% · 0.3 · 0.0 | 0.3 · 88% | zap,chain,vines |
| ridge | mid 18 | near | 2.3 | 3.3 · 0.0 | 1.1 · 23% · 0.3 · 0.0 | 1.9 · 13% | zap,chain,vines |
| ridge | mid 18 | far | 2.3 | 4.1 · 0.0 | 1.3 · 29% · 0.4 · 0.0 | 3.6 · 0% | zap,chain,vines |
| desert | fresh 18 | start | 1.3 | 1.2 · 0.0 | 0.8 · 22% · 0.3 · 0.0 | 0.6 · 75% | zap,chain,vines |
| desert | fresh 18 | near | 2.3 | 3.6 · 0.1 | 2.9 · 60% · 0.1 · 0.0 | 3.5 · 13% | zap,chain,vines |
| desert | fresh 18 | far | 2.5 | 5.7 · 0.2 | 9.1 · 76% · 0.1 · 0.1 | 6.3 · 13% | zap,chain,vines |
| desert | mid 24 | start | 1.3 | 0.9 · 0.0 | 0.7 · 20% · 0.3 · 0.0 | 1.0 · 75% | zap,chain,vines |
| desert | mid 24 | near | 2.3 | 3.1 · 0.0 | 2.2 · 59% · 0.2 · 0.0 | 2.9 · 25% | zap,chain,vines |
| desert | mid 24 | far | 2.5 | 6.1 · 0.2 | 5.5 · 69% · 0.2 · 0.2 | 8.2 · 0% | zap,chain,vines |
| storm | fresh 24 | start | 1.3 | 1.0 · 0.0 | 0.6 · 33% · 0.3 · 0.0 | 0.7 · 75% | zap,chain,vines |
| storm | fresh 24 | near | 2.3 | 6.0 · 0.1 | 3.1 · 42% · 0.3 · 0.0 | 4.4 · 21% | zap,chain,vines |
| storm | fresh 24 | far | 2.3 | 5.5 · 0.3 | 3.5 · 37% · 0.3 · 0.1 | 5.2 · 0% | zap,chain,vines |
| storm | mid 30 | start | 1.3 | 0.9 · 0.0 | 0.4 · 8% · 0.3 · 0.0 | 0.5 · 75% | zap,chain,vines |
| storm | mid 30 | near | 2.3 | 4.7 · 0.1 | 1.7 · 38% · 0.3 · 0.0 | 3.6 · 8% | zap,chain,vines |
| storm | mid 30 | far | 2.3 | 4.5 · 0.1 | 2.1 · 26% · 0.3 · 0.0 | 4.8 · 0% | zap,chain,vines |
| shadow | fresh 30 | start | 1.3 | 1.3 · 0.0 | 1.4 · 22% · 0.2 · 0.0 | 1.0 · 75% | zap,chain,vines |
| shadow | fresh 30 | near | 2.3 | 4.7 · 0.1 | 3.7 · 56% · 0.2 · 0.1 | 4.6 · 0% | zap,chain,vines |
| shadow | fresh 30 | far | 2.3 | 8.9 · 0.3 | 7.7 · 70% · 0.0 · 0.2 | 7.8 · 0% | zap,chain,vines |
| shadow | mid 36 | start | 1.3 | 1.2 · 0.0 | 0.8 · 23% · 0.3 · 0.0 | 1.0 · 75% | zap,chain,vines |
| shadow | mid 36 | near | 2.3 | 4.0 · 0.1 | 3.8 · 56% · 0.1 · 0.1 | 3.8 · 13% | zap,chain,vines |
| shadow | mid 36 | far | 2.3 | 7.1 · 0.1 | 5.6 · 71% · 0.2 · 0.0 | 6.1 · 0% | zap,chain,vines |

### before: mage

| region | hero | zone | size | auto: clear s · taken | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |
|---|---|---|---|---|---|---|---|
| meadow | fresh 1 | start | 1.3 | 2.0 · 0.0 | 2.2 · 88% · 0.0 · 0.0 | 1.8 · 0% | splash |
| meadow | fresh 1 | near | 2.3 | 6.1 · 0.0 | 4.7 · 92% · 0.4 · 0.0 | 6.2 · 0% | splash |
| meadow | fresh 1 | far | 2.3 | 8.2 · 0.2 | 7.5 · 93% · 0.0 · 0.1 | 8.5 · 0% | splash |
| meadow | mid 6 | start | 1.3 | 2.2 · 0.0 | 1.0 · 25% · 0.3 · 0.0 | 0.9 · 63% | splash,meteor,storm |
| meadow | mid 6 | near | 2.3 | 4.2 · 0.0 | 1.2 · 14% · 0.7 · 0.0 | 1.6 · 46% | splash,meteor,storm |
| meadow | mid 6 | far | 2.3 | 4.2 · 0.0 | 1.3 · 10% · 0.4 · 0.0 | 1.2 · 50% | splash,meteor,storm |
| lake | fresh 6 | start | 1.3 | 1.2 · 0.0 | 0.7 · 6% · 0.3 · 0.0 | 0.6 · 88% | splash,meteor,storm |
| lake | fresh 6 | near | 2.0 | 4.8 · 0.0 | 1.5 · 10% · 0.4 · 0.0 | 2.4 · 25% | splash,meteor,storm |
| lake | fresh 6 | far | 2.3 | 6.7 · 0.1 | 2.3 · 22% · 0.5 · 0.0 | 5.4 · 13% | splash,meteor,storm |
| lake | mid 12 | start | 1.3 | 0.5 · 0.0 | 0.5 · 34% · 0.1 · 0.0 | 0.5 · 25% | splash,vortex,meteor |
| lake | mid 12 | near | 2.0 | 1.9 · 0.0 | 0.9 · 44% · 0.4 · 0.0 | 0.9 · 63% | splash,vortex,meteor |
| lake | mid 12 | far | 2.3 | 2.6 · 0.0 | 1.6 · 37% · 0.6 · 0.0 | 2.1 · 25% | splash,vortex,meteor |
| ridge | fresh 12 | start | 1.3 | 1.3 · 0.0 | 0.8 · 53% · 0.2 · 0.0 | 0.5 · 63% | splash,vortex,meteor |
| ridge | fresh 12 | near | 2.3 | 2.8 · 0.0 | 1.1 · 43% · 0.3 · 0.0 | 1.1 · 46% | splash,vortex,meteor |
| ridge | fresh 12 | far | 2.3 | 4.2 · 0.0 | 1.0 · 36% · 0.6 · 0.0 | 1.4 · 33% | splash,vortex,meteor |
| ridge | mid 18 | start | 1.3 | 0.7 · 0.0 | 0.7 · 37% · 0.3 · 0.0 | 0.4 · 88% | splash,vortex,meteor |
| ridge | mid 18 | near | 2.3 | 2.9 · 0.0 | 0.9 · 29% · 0.7 · 0.0 | 0.6 · 83% | splash,vortex,meteor |
| ridge | mid 18 | far | 2.3 | 4.3 · 0.0 | 0.9 · 33% · 0.7 · 0.0 | 1.0 · 58% | splash,vortex,meteor |
| desert | fresh 18 | start | 1.3 | 2.1 · 0.0 | 0.7 · 21% · 0.3 · 0.0 | 1.0 · 75% | splash,vortex,meteor |
| desert | fresh 18 | near | 2.3 | 5.4 · 0.0 | 1.3 · 28% · 0.3 · 0.0 | 3.7 · 25% | splash,vortex,meteor |
| desert | fresh 18 | far | 2.5 | 10.5 · 0.3 | 1.8 · 20% · 0.5 · 0.0 | 8.7 · 13% | splash,vortex,meteor |
| desert | mid 24 | start | 1.3 | 1.2 · 0.0 | 0.8 · 15% · 0.2 · 0.0 | 1.0 · 75% | splash,vortex,meteor |
| desert | mid 24 | near | 2.3 | 3.4 · 0.0 | 1.3 · 31% · 0.4 · 0.0 | 2.8 · 38% | splash,vortex,meteor |
| desert | mid 24 | far | 2.5 | 8.4 · 0.1 | 1.9 · 30% · 0.5 · 0.0 | 6.9 · 0% | splash,vortex,meteor |
| storm | fresh 24 | start | 1.3 | 1.1 · 0.0 | 0.7 · 35% · 0.3 · 0.0 | 0.4 · 100% | splash,vortex,meteor |
| storm | fresh 24 | near | 2.3 | 5.5 · 0.1 | 1.1 · 24% · 0.7 · 0.0 | 2.9 · 25% | splash,vortex,meteor |
| storm | fresh 24 | far | 2.3 | 6.3 · 0.1 | 1.8 · 26% · 0.5 · 0.0 | 4.1 · 13% | splash,vortex,meteor |
| storm | mid 30 | start | 1.3 | 0.8 · 0.0 | 0.8 · 36% · 0.2 · 0.0 | 0.5 · 63% | splash,vortex,meteor |
| storm | mid 30 | near | 2.3 | 4.0 · 0.0 | 1.0 · 34% · 0.6 · 0.0 | 2.1 · 25% | splash,vortex,meteor |
| storm | mid 30 | far | 2.3 | 4.8 · 0.0 | 1.3 · 28% · 0.4 · 0.0 | 2.7 · 13% | splash,vortex,meteor |
| shadow | fresh 30 | start | 1.3 | 1.5 · 0.0 | 0.9 · 24% · 0.1 · 0.0 | 1.3 · 25% | splash,vortex,meteor |
| shadow | fresh 30 | near | 2.3 | 6.4 · 0.1 | 1.7 · 31% · 0.4 · 0.0 | 4.2 · 0% | splash,vortex,meteor |
| shadow | fresh 30 | far | 2.3 | 9.8 · 0.2 | 3.1 · 33% · 0.3 · 0.0 | 7.7 · 0% | splash,vortex,meteor |
| shadow | mid 36 | start | 1.3 | 1.3 · 0.0 | 0.8 · 37% · 0.3 · 0.0 | 0.7 · 88% | splash,vortex,meteor |
| shadow | mid 36 | near | 2.3 | 5.5 · 0.0 | 1.5 · 25% · 0.6 · 0.0 | 3.6 · 38% | splash,vortex,meteor |
| shadow | mid 36 | far | 2.3 | 8.7 · 0.1 | 3.1 · 41% · 0.1 · 0.0 | 6.2 · 0% | splash,vortex,meteor |

### before: Summary (average over regions)

| class | hero | auto clear s | skills clear s | skills auto% | one-kill | taken (skills) |
|---|---|---|---|---|---|---|
| warrior | fresh | 5.7 | 4.5 | 58% | 12% | 0.1 |
| warrior | mid | 3.8 | 3.4 | 59% | 15% | 0.0 |
| hunter | fresh | 6.2 | 3.7 | 46% | 21% | 0.1 |
| hunter | mid | 3.6 | 1.9 | 35% | 28% | 0.0 |
| mage | fresh | 4.8 | 1.9 | 38% | 30% | 0.0 |
| mage | mid | 3.4 | 1.2 | 30% | 47% | 0.0 |

### after: warrior

| region | hero | zone | size | auto: clear s · taken | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |
|---|---|---|---|---|---|---|---|
| meadow | fresh 1 | start | 1.3 | 2.7 · 0.0 | 1.6 · 57% · 0.3 · 0.0 | 2.1 · 25% | quake |
| meadow | fresh 1 | near | 2.3 | 3.3 · 0.1 | 3.1 · 68% · 0.2 · 0.0 | 4.0 · 33% | quake |
| meadow | fresh 1 | far | 2.3 | 5.3 · 0.1 | 5.3 · 67% · 0.4 · 0.2 | 5.7 · 0% | quake |
| meadow | mid 6 | start | 1.3 | 2.0 · 0.0 | 0.2 · 0% · 0.4 · 0.0 | 0.5 · 88% | quake,shield,whirl |
| meadow | mid 6 | near | 2.3 | 3.8 · 0.0 | 1.0 · 14% · 0.8 · 0.0 | 3.7 · 33% | quake,shield,whirl |
| meadow | mid 6 | far | 2.3 | 4.4 · 0.1 | 2.1 · 26% · 0.5 · 0.0 | 5.5 · 13% | quake,shield,whirl |
| lake | fresh 6 | start | 1.3 | 3.6 · 0.0 | 1.8 · 24% · 0.3 · 0.0 | 2.3 · 0% | quake,shield,whirl |
| lake | fresh 6 | near | 2.0 | 10.9 · 0.3 | 4.1 · 36% · 0.4 · 0.1 | 9.6 · 0% | quake,shield,whirl |
| lake | fresh 6 | far | 2.3 | 12.9 · 0.5 | 7.7 · 42% · 0.1 · 0.1 | 13.9 · 0% | quake,shield,whirl |
| lake | mid 12 | start | 1.3 | 1.6 · 0.0 | 1.1 · 25% · 0.3 · 0.0 | 0.9 · 50% | quake,petrify,shield |
| lake | mid 12 | near | 2.0 | 6.5 · 0.1 | 2.9 · 36% · 0.4 · 0.0 | 4.4 · 50% | quake,petrify,shield |
| lake | mid 12 | far | 2.3 | 6.6 · 0.1 | 3.6 · 46% · 0.3 · 0.0 | 5.0 · 0% | quake,petrify,shield |
| ridge | fresh 12 | start | 1.3 | 2.5 · 0.0 | 2.2 · 55% · 0.2 · 0.0 | 1.7 · 88% | quake,petrify,shield |
| ridge | fresh 12 | near | 2.3 | 8.6 · 0.3 | 5.3 · 44% · 0.3 · 0.1 | 9.1 · 13% | quake,petrify,shield |
| ridge | fresh 12 | far | 2.3 | 12.2 · 0.4 | 7.5 · 53% · 0.2 · 0.2 | 7.7 · 13% | quake,petrify,shield |
| ridge | mid 18 | start | 1.3 | 1.9 · 0.0 | 1.8 · 95% · 0.1 · 0.0 | 1.3 · 25% | quake,petrify,shield |
| ridge | mid 18 | near | 2.3 | 5.0 · 0.0 | 4.4 · 37% · 0.5 · 0.0 | 4.4 · 42% | quake,petrify,shield |
| ridge | mid 18 | far | 2.3 | 7.1 · 0.1 | 2.9 · 45% · 0.5 · 0.0 | 7.9 · 13% | quake,petrify,shield |
| desert | fresh 18 | start | 1.3 | 2.0 · 0.0 | 1.1 · 18% · 0.3 · 0.0 | 1.9 · 25% | quake,petrify,shield |
| desert | fresh 18 | near | 2.3 | 7.6 · 0.1 | 3.9 · 56% · 0.2 · 0.0 | 6.3 · 0% | quake,petrify,shield |
| desert | fresh 18 | far | 2.5 | 11.8 · 0.2 | 6.3 · 35% · 0.2 · 0.1 | 10.4 · 0% | quake,petrify,shield |
| desert | mid 24 | start | 1.3 | 1.7 · 0.0 | 1.0 · 75% · 0.1 · 0.0 | 1.3 · 50% | quake,petrify,shield |
| desert | mid 24 | near | 2.3 | 4.2 · 0.0 | 3.6 · 53% · 0.5 · 0.0 | 5.5 · 21% | quake,petrify,shield |
| desert | mid 24 | far | 2.5 | 8.6 ⚠1 · 0.1 | 4.2 · 26% · 0.3 · 0.0 | 7.8 ⚠1 · 0% | quake,petrify,shield |
| storm | fresh 24 | start | 1.3 | 2.8 · 0.0 | 2.0 · 47% · 0.2 · 0.0 | 2.9 · 50% | quake,petrify,shield |
| storm | fresh 24 | near | 2.3 | 7.9 · 0.1 | 5.8 · 36% · 0.4 · 0.1 | 7.8 · 33% | quake,petrify,shield |
| storm | fresh 24 | far | 2.3 | 12.8 · 0.2 | 5.4 · 50% · 0.1 · 0.1 | 10.2 · 25% | quake,petrify,shield |
| storm | mid 30 | start | 1.3 | 1.6 · 0.0 | 1.0 · 19% · 0.4 · 0.0 | 1.6 · 50% | quake,petrify,shield |
| storm | mid 30 | near | 2.3 | 7.4 · 0.0 | 4.4 · 39% · 0.5 · 0.0 | 6.7 · 33% | quake,petrify,shield |
| storm | mid 30 | far | 2.3 | 7.9 · 0.1 | 4.0 · 41% · 0.3 · 0.0 | 10.7 · 0% | quake,petrify,shield |
| shadow | fresh 30 | start | 1.3 | 4.1 · 0.0 | 2.1 · 63% · 0.2 · 0.0 | 3.5 · 0% | quake,petrify,shield |
| shadow | fresh 30 | near | 2.3 | 8.8 · 0.2 | 6.1 · 53% · 0.2 · 0.1 | 6.5 · 0% | quake,petrify,shield |
| shadow | fresh 30 | far | 2.3 | 12.3 · 0.3 | 7.8 · 46% · 0.3 · 0.1 | 12.9 · 0% | quake,petrify,shield |
| shadow | mid 36 | start | 1.3 | 2.1 · 0.0 | 1.3 · 43% · 0.2 · 0.0 | 1.4 · 75% | quake,petrify,shield |
| shadow | mid 36 | near | 2.3 | 7.3 · 0.0 | 3.6 · 52% · 0.4 · 0.0 | 6.4 · 42% | quake,petrify,shield |
| shadow | mid 36 | far | 2.3 | 11.1 · 0.1 | 8.1 · 48% · 0.3 · 0.0 | 9.6 · 0% | quake,petrify,shield |

### after: hunter

| region | hero | zone | size | auto: clear s · taken | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |
|---|---|---|---|---|---|---|---|
| meadow | fresh 1 | start | 1.3 | 2.3 · 0.0 | 2.4 · 72% · 0.4 · 0.0 | 1.9 · 0% | zap |
| meadow | fresh 1 | near | 2.3 | 7.3 · 0.0 | 4.1 · 61% · 0.4 · 0.0 | 5.7 · 8% | zap |
| meadow | fresh 1 | far | 2.3 | 9.7 · 0.3 | 5.1 · 48% · 0.6 · 0.2 | 8.3 · 0% | zap |
| meadow | mid 6 | start | 1.3 | 2.6 · 0.0 | 0.4 · 6% · 0.3 · 0.0 | 0.4 · 88% | zap,vines,trap |
| meadow | mid 6 | near | 2.3 | 6.3 · 0.1 | 2.2 · 31% · 0.4 · 0.0 | 2.8 · 50% | zap,vines,trap |
| meadow | mid 6 | far | 2.3 | 9.1 · 0.2 | 2.0 · 26% · 0.4 · 0.0 | 7.4 · 0% | zap,vines,trap |
| lake | fresh 6 | start | 1.3 | 4.5 · 0.0 | 0.8 · 5% · 0.3 · 0.0 | 1.2 · 88% | zap,vines,trap |
| lake | fresh 6 | near | 2.0 | 19.3 · 0.8 | 3.6 · 21% · 0.2 · 0.0 | 12.5 · 0% | zap,vines,trap |
| lake | fresh 6 | far | 2.3 | 25.3 · 1.3 | 4.4 · 20% · 0.3 · 0.1 | 19.8 · 13% | zap,vines,trap |
| lake | mid 12 | start | 1.3 | 1.3 · 0.0 | 0.1 · 14% · 0.6 · 0.0 | 0.0 · 100% | zap,chain,vines |
| lake | mid 12 | near | 2.0 | 5.5 · 0.1 | 0.1 · 0% · 0.7 · 0.0 | 0.1 · 100% | zap,chain,vines |
| lake | mid 12 | far | 2.3 | 6.7 · 0.2 | 2.3 · 25% · 0.3 · 0.0 | 4.6 · 38% | zap,chain,vines |
| ridge | fresh 12 | start | 1.3 | 2.0 · 0.0 | 0.5 · 8% · 0.3 · 0.0 | 1.5 · 25% | zap,chain,vines |
| ridge | fresh 12 | near | 2.3 | 8.4 · 0.2 | 2.7 · 26% · 0.3 · 0.0 | 7.4 · 0% | zap,chain,vines |
| ridge | fresh 12 | far | 2.3 | 10.2 · 0.5 | 2.5 · 34% · 0.3 · 0.0 | 9.2 · 0% | zap,chain,vines |
| ridge | mid 18 | start | 1.3 | 1.0 · 0.0 | 0.0 · 0% · 0.6 · 0.0 | 0.0 · 100% | zap,chain,vines |
| ridge | mid 18 | near | 2.3 | 4.1 · 0.0 | 0.1 · 0% · 0.8 · 0.0 | 0.1 · 100% | zap,chain,vines |
| ridge | mid 18 | far | 2.3 | 5.1 · 0.1 | 1.7 · 24% · 0.5 · 0.0 | 3.2 · 25% | zap,chain,vines |
| desert | fresh 18 | start | 1.3 | 1.5 · 0.0 | 0.8 · 20% · 0.3 · 0.0 | 1.0 · 75% | zap,chain,vines |
| desert | fresh 18 | near | 2.3 | 5.5 · 0.2 | 2.9 · 52% · 0.1 · 0.0 | 3.7 · 25% | zap,chain,vines |
| desert | fresh 18 | far | 2.5 | 9.0 · 0.4 | 6.4 · 71% · 0.1 · 0.2 | 10.2 · 0% | zap,chain,vines |
| desert | mid 24 | start | 1.3 | 1.4 · 0.0 | 0.5 · 13% · 0.3 · 0.0 | 0.8 · 75% | zap,chain,vines |
| desert | mid 24 | near | 2.3 | 3.7 · 0.1 | 2.0 · 33% · 0.6 · 0.0 | 3.5 · 50% | zap,chain,vines |
| desert | mid 24 | far | 2.5 | 7.5 · 0.1 | 17.0 · 61% · 0.3 · 0.1 | 7.1 · 13% | zap,chain,vines |
| storm | fresh 24 | start | 1.3 | 1.8 · 0.0 | 0.4 · 7% · 0.3 · 0.0 | 0.5 · 88% | zap,chain,vines |
| storm | fresh 24 | near | 2.3 | 8.5 · 0.2 | 2.6 · 26% · 0.5 · 0.1 | 5.4 · 21% | zap,chain,vines |
| storm | fresh 24 | far | 2.3 | 7.2 · 0.3 | 2.6 · 30% · 0.4 · 0.1 | 7.7 · 0% | zap,chain,vines |
| storm | mid 30 | start | 1.3 | 1.3 · 0.0 | 0.0 · 0% · 0.6 · 0.0 | 0.1 · 100% | zap,chain,vines |
| storm | mid 30 | near | 2.3 | 6.4 · 0.1 | 1.1 · 10% · 0.7 · 0.0 | 1.8 · 83% | zap,chain,vines |
| storm | mid 30 | far | 2.3 | 6.5 · 0.2 | 1.7 · 22% · 0.5 · 0.0 | 5.2 · 0% | zap,chain,vines |
| shadow | fresh 30 | start | 1.3 | 2.5 · 0.0 | 1.5 · 22% · 0.2 · 0.0 | 1.5 · 75% | zap,chain,vines |
| shadow | fresh 30 | near | 2.3 | 6.6 · 0.1 | 3.9 · 55% · 0.2 · 0.1 | 4.8 · 25% | zap,chain,vines |
| shadow | fresh 30 | far | 2.3 | 9.4 · 0.5 | 6.8 · 63% · 0.1 · 0.3 | 10.0 · 0% | zap,chain,vines |
| shadow | mid 36 | start | 1.3 | 1.6 · 0.0 | 0.8 · 35% · 0.3 · 0.0 | 1.2 · 75% | zap,chain,vines |
| shadow | mid 36 | near | 2.3 | 4.5 · 0.1 | 3.1 · 32% · 0.5 · 0.0 | 4.3 · 50% | zap,chain,vines |
| shadow | mid 36 | far | 2.3 | 8.5 · 0.3 | 5.9 · 66% · 0.2 · 0.1 | 8.4 · 13% | zap,chain,vines |

### after: mage

| region | hero | zone | size | auto: clear s · taken | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |
|---|---|---|---|---|---|---|---|
| meadow | fresh 1 | start | 1.3 | 2.4 · 0.0 | 2.0 · 89% · 0.0 · 0.0 | 2.1 · 13% | splash |
| meadow | fresh 1 | near | 2.3 | 5.6 · 0.0 | 5.9 · 86% · 0.3 · 0.0 | 5.3 · 0% | splash |
| meadow | fresh 1 | far | 2.3 | 8.2 · 0.3 | 7.5 · 86% · 0.1 · 0.2 | 7.7 · 0% | splash |
| meadow | mid 6 | start | 1.3 | 2.7 · 0.0 | 0.6 · 3% · 0.4 · 0.0 | 0.3 · 100% | splash,meteor,storm |
| meadow | mid 6 | near | 2.3 | 3.2 · 0.0 | 0.8 · 3% · 0.8 · 0.0 | 0.5 · 100% | splash,meteor,storm |
| meadow | mid 6 | far | 2.3 | 5.2 · 0.1 | 0.7 · 5% · 0.8 · 0.0 | 0.9 · 100% | splash,meteor,storm |
| lake | fresh 6 | start | 1.3 | 1.9 · 0.0 | 0.3 · 3% · 0.4 · 0.0 | 0.3 · 100% | splash,meteor,storm |
| lake | fresh 6 | near | 2.0 | 4.5 · 0.0 | 1.2 · 9% · 0.5 · 0.0 | 2.0 · 38% | splash,meteor,storm |
| lake | fresh 6 | far | 2.3 | 10.0 · 0.2 | 1.7 · 16% · 0.6 · 0.0 | 4.9 · 25% | splash,meteor,storm |
| lake | mid 12 | start | 1.3 | 0.6 · 0.0 | 0.2 · 26% · 0.4 · 0.0 | 0.3 · 75% | splash,vortex,meteor |
| lake | mid 12 | near | 2.0 | 2.7 · 0.0 | 0.8 · 17% · 0.7 · 0.0 | 0.5 · 88% | splash,vortex,meteor |
| lake | mid 12 | far | 2.3 | 3.5 · 0.0 | 1.4 · 32% · 0.7 · 0.0 | 2.1 · 25% | splash,vortex,meteor |
| ridge | fresh 12 | start | 1.3 | 1.1 · 0.0 | 0.7 · 35% · 0.4 · 0.0 | 0.5 · 100% | splash,vortex,meteor |
| ridge | fresh 12 | near | 2.3 | 4.0 · 0.0 | 1.0 · 33% · 0.7 · 0.0 | 0.9 · 71% | splash,vortex,meteor |
| ridge | fresh 12 | far | 2.3 | 5.4 · 0.0 | 1.0 · 20% · 0.7 · 0.0 | 1.3 · 58% | splash,vortex,meteor |
| ridge | mid 18 | start | 1.3 | 1.3 · 0.0 | 0.5 · 11% · 0.3 · 0.0 | 0.4 · 100% | splash,vortex,meteor |
| ridge | mid 18 | near | 2.3 | 4.3 · 0.0 | 0.9 · 22% · 0.8 · 0.0 | 0.5 · 100% | splash,vortex,meteor |
| ridge | mid 18 | far | 2.3 | 5.2 · 0.1 | 0.9 · 20% · 0.7 · 0.0 | 0.7 · 83% | splash,vortex,meteor |
| desert | fresh 18 | start | 1.3 | 2.5 · 0.0 | 0.7 · 15% · 0.3 · 0.0 | 1.2 · 75% | splash,vortex,meteor |
| desert | fresh 18 | near | 2.3 | 6.5 · 0.1 | 1.1 · 17% · 0.7 · 0.0 | 4.1 · 50% | splash,vortex,meteor |
| desert | fresh 18 | far | 2.5 | 11.5 · 0.4 | 3.2 · 18% · 0.5 · 0.0 | 9.3 · 13% | splash,vortex,meteor |
| desert | mid 24 | start | 1.3 | 1.7 · 0.0 | 0.4 · 1% · 0.4 · 0.0 | 0.4 · 25% | splash,vortex,meteor |
| desert | mid 24 | near | 2.3 | 6.1 · 0.1 | 0.8 · 12% · 0.8 · 0.0 | 1.5 · 71% | splash,vortex,meteor |
| desert | mid 24 | far | 2.5 | 12.0 · 0.0 | 1.4 · 17% · 0.8 · 0.0 | 9.6 · 13% | splash,vortex,meteor |
| storm | fresh 24 | start | 1.3 | 1.7 · 0.0 | 0.8 · 15% · 0.3 · 0.0 | 0.4 · 100% | splash,vortex,meteor |
| storm | fresh 24 | near | 2.3 | 6.7 · 0.1 | 0.9 · 14% · 0.8 · 0.0 | 2.0 · 38% | splash,vortex,meteor |
| storm | fresh 24 | far | 2.3 | 8.1 · 0.2 | 1.0 · 12% · 0.8 · 0.0 | 4.9 · 0% | splash,vortex,meteor |
| storm | mid 30 | start | 1.3 | 1.1 · 0.0 | 0.5 · 8% · 0.4 · 0.0 | 0.5 · 50% | splash,vortex,meteor |
| storm | mid 30 | near | 2.3 | 4.8 · 0.0 | 0.9 · 17% · 0.8 · 0.0 | 0.5 · 100% | splash,vortex,meteor |
| storm | mid 30 | far | 2.3 | 5.4 · 0.0 | 1.1 · 17% · 0.8 · 0.0 | 1.5 · 67% | splash,vortex,meteor |
| shadow | fresh 30 | start | 1.3 | 2.6 · 0.0 | 0.9 · 14% · 0.3 · 0.0 | 0.8 · 88% | splash,vortex,meteor |
| shadow | fresh 30 | near | 2.3 | 8.5 · 0.1 | 2.1 · 25% · 0.4 · 0.0 | 5.0 · 0% | splash,vortex,meteor |
| shadow | fresh 30 | far | 2.3 | 14.1 · 0.4 | 4.0 · 24% · 0.2 · 0.0 | 8.1 · 0% | splash,vortex,meteor |
| shadow | mid 36 | start | 1.3 | 2.0 · 0.0 | 0.5 · 2% · 0.4 · 0.0 | 0.4 · 75% | splash,vortex,meteor |
| shadow | mid 36 | near | 2.3 | 6.5 · 0.0 | 0.8 · 15% · 0.8 · 0.0 | 1.7 · 75% | splash,vortex,meteor |
| shadow | mid 36 | far | 2.3 | 10.9 · 0.1 | 2.1 · 15% · 0.7 · 0.0 | 8.4 · 0% | splash,vortex,meteor |

### after: Summary (average over regions)

| class | hero | auto clear s | skills clear s | skills auto% | one-kill | taken (skills) |
|---|---|---|---|---|---|---|
| warrior | fresh | 7.3 | 4.4 | 47% | 17% | 0.1 |
| warrior | mid | 5.1 | 2.8 | 40% | 32% | 0.0 |
| hunter | fresh | 7.8 | 3.0 | 36% | 25% | 0.1 |
| hunter | mid | 4.6 | 2.3 | 22% | 59% | 0.0 |
| mage | fresh | 5.9 | 2.0 | 30% | 43% | 0.0 |
| mage | mid | 4.4 | 0.8 | 13% | 69% | 0.0 |
