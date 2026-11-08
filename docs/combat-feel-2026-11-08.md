# Combat feel, measured (8.11.2026)

Tool: `node tools/combat-feel.js` (seed 7, 6 duels per cell, 2D). Background: [research-xphero.md](research-xphero.md).
Duel = one enemy alone, hero walks in from 220px, **auto-attack only** (no skill buttons), hero cannot die. TTK = seconds from first hit to death. "Hits" = hits that took HP. "Taken" = damage the hero took during the fight, in full health bars.
Heroes: **fresh** = region entry level, gear one tier below what that level may wear. **mid** = next region's level, best tier it may wear. Points spent like tools/balance-world.js.

## 1. Time-to-kill, ordinary enemies

### warrior

| region | hero | lv / tier | start TTK s (hits) | near | far | taken (start/near/far) |
|---|---|---|---|---|---|---|
| meadow | fresh | 1 / 0 | 1.8 (4) | 1.9 (4) | 2.8 (6) | 0.0 / 0.0 / 0.1 |
| meadow | mid | 6 / 1 | 1.2 (3) | 1.8 (4) | 2.4 (6) | 0.0 / 0.0 / 0.0 |
| lake | fresh | 6 / 0 | 2.5 (6) | 5.1 (11) | 6.5 (13) | 0.0 / 0.1 / 0.2 |
| lake | mid | 12 / 3 | 1.0 (3) | 2.6 (7) | 3.2 (7) | 0.0 / 0.0 / 0.1 |
| ridge | fresh | 12 / 2 | 2.1 (5) | 3.7 (9) | 5.1 (13) | 0.0 / 0.1 / 0.1 |
| ridge | mid | 18 / 4 | 1.0 (3) | 2.2 (5) | 2.7 (7) | 0.0 / 0.0 / 0.0 |
| desert | fresh | 18 / 3 | 1.3 (4) | 3.1 (6) | 4.3 (9) | 0.0 / 0.0 / 0.1 |
| desert | mid | 24 / 4 | 1.1 (3) | 2.2 (6) | 3.7 (9) | 0.0 / 0.0 / 0.0 |
| storm | fresh | 24 / 3 | 1.7 (4) | 3.4 (8) | 4.4 (9) | 0.0 / 0.0 / 0.1 |
| storm | mid | 30 / 4 | 1.3 (3) | 3.2 (8) | 3.9 (8) | 0.0 / 0.0 / 0.0 |
| shadow | fresh | 30 / 3 | 1.4 (5) | 3.3 (9) | 6.6 (18) | 0.0 / 0.0 / 0.1 |
| shadow | mid | 36 / 4 | 1.6 (4) | 2.6 (8) | 5.3 (16) | 0.0 / 0.0 / 0.1 |

### hunter

| region | hero | lv / tier | start TTK s (hits) | near | far | taken (start/near/far) |
|---|---|---|---|---|---|---|
| meadow | fresh | 1 / 0 | 2.4 (7) | 3.5 (8) | 5.9 (14) | 0.0 / 0.0 / 0.1 |
| meadow | mid | 6 / 1 | 1.7 (6) | 3.1 (7) | 4.5 (12) | 0.0 / 0.0 / 0.0 |
| lake | fresh | 6 / 0 | 2.6 (9) | 7.2 (23) | 15.5 (23) ⚠1 alive | 0.0 / 0.1 / 0.5 |
| lake | mid | 12 / 3 | 0.7 (4) | 2.2 (11) | 4.0 (12) | 0.0 / 0.0 / 0.1 |
| ridge | fresh | 12 / 2 | 1.5 (7) | 2.4 (13) | 11.6 (17) | 0.0 / 0.0 / 0.0 |
| ridge | mid | 18 / 4 | 0.6 (3) | 1.4 (5) | 1.5 (7) | 0.0 / 0.0 / 0.0 |
| desert | fresh | 18 / 3 | 0.8 (4) | 3.7 (9) | 8.6 (13) ⚠2 alive | 0.0 / 0.1 / 0.4 |
| desert | mid | 24 / 4 | 0.7 (4) | 1.8 (7) | 8.7 (13) ⚠1 alive | 0.0 / 0.0 / 0.2 |
| storm | fresh | 24 / 3 | 0.9 (4) | 2.6 (11) | 11.4 (15) | 0.0 / 0.0 / 0.2 |
| storm | mid | 30 / 4 | 0.7 (4) | 1.9 (8) | 4.7 (14) | 0.0 / 0.0 / 0.1 |
| shadow | fresh | 30 / 3 | 1.4 (6) | 2.1 (9) | 7.5 (22) | 0.0 / 0.0 / 0.1 |
| shadow | mid | 36 / 4 | 0.9 (4) | 1.4 (7) | 4.5 (18) ⚠1 alive | 0.0 / 0.0 / 0.1 |

### mage

| region | hero | lv / tier | start TTK s (hits) | near | far | taken (start/near/far) |
|---|---|---|---|---|---|---|
| meadow | fresh | 1 / 0 | 1.9 (6) | 2.7 (7) | 3.5 (11) | 0.0 / 0.0 / 0.0 |
| meadow | mid | 6 / 1 | 1.9 (7) | 1.9 (6) | 2.6 (8) | 0.0 / 0.0 / 0.0 |
| lake | fresh | 6 / 0 | 1.0 (4) | 2.4 (8) | 3.5 (11) | 0.0 / 0.0 / 0.0 |
| lake | mid | 12 / 3 | 0.6 (3) | 0.9 (4) | 1.2 (5) | 0.0 / 0.0 / 0.0 |
| ridge | fresh | 12 / 2 | 0.8 (5) | 1.2 (6) | 1.9 (9) | 0.0 / 0.0 / 0.0 |
| ridge | mid | 18 / 4 | 0.9 (4) | 1.2 (5) | 1.7 (5) | 0.0 / 0.0 / 0.0 |
| desert | fresh | 18 / 3 | 1.2 (5) | 2.3 (7) | 3.2 (11) | 0.0 / 0.0 / 0.0 |
| desert | mid | 24 / 4 | 1.1 (4) | 1.8 (7) | 4.2 (10) | 0.0 / 0.0 / 0.0 |
| storm | fresh | 24 / 3 | 1.2 (5) | 1.9 (7) | 2.7 (9) | 0.0 / 0.0 / 0.0 |
| storm | mid | 30 / 4 | 1.0 (5) | 1.5 (7) | 1.8 (7) | 0.0 / 0.0 / 0.0 |
| shadow | fresh | 30 / 3 | 1.3 (5) | 2.1 (9) | 3.9 (14) | 0.0 / 0.0 / 0.0 |
| shadow | mid | 36 / 4 | 1.1 (5) | 1.8 (7) | 3.1 (11) | 0.0 / 0.0 / 0.0 |

### All classes, average TTK (s)

| region | fresh start | fresh near | fresh far | mid start | mid near | mid far |
|---|---|---|---|---|---|---|
| meadow | 2.0 | 2.7 | 4.1 | 1.6 | 2.3 | 3.2 |
| lake | 2.0 | 4.9 | 8.5 | 0.7 | 1.9 | 2.8 |
| ridge | 1.4 | 2.4 | 6.2 | 0.8 | 1.6 | 2.0 |
| desert | 1.1 | 3.0 | 5.4 | 1.0 | 2.0 | 5.5 |
| storm | 1.3 | 2.6 | 6.2 | 1.0 | 2.2 | 3.5 |
| shadow | 1.4 | 2.5 | 6.0 | 1.2 | 1.9 | 4.3 |

### Elites and rares (mid hero)

Elite = a far-zone foe with a forced affix (each affix in turn). Rare = the region's rare monster (RARES).

| region | warrior elite TTK (hits) | hunter elite TTK (hits) | mage elite TTK (hits) | warrior rare TTK (hits) | hunter rare TTK (hits) | mage rare TTK (hits) |
|---|---|---|---|---|---|---|
| meadow | 3.0 (7) | 4.3 (12) | 1.9 (7) | 41.6 (97) | - (-) ⚠ | 28.7 (80) |
| lake | 4.4 (9) | 3.4 (18) | 1.7 (6) | 27.2 (53) | 19.4 (114) | 10.5 (38) |
| ridge | 5.7 (13) | 3.4 (14) | 1.7 (7) | 25.5 (57) | 16.7 (69) ⚠ | 8.7 (29) |
| desert | 8.4 (16) | 19.4 (21) | 2.5 (9) | 31.7 (72) | 20.7 (80) | 17.2 (54) |
| storm | 7.2 (17) | 7.0 (25) | 1.8 (8) | 37.4 (87) | 24.4 (97) | 12.4 (52) |
| shadow | 8.1 (21) | 14.5 (36) | 3.3 (12) | 9.3 (26) | 18.5 (45) | 7.9 (33) |

## 2. Does one upgrade show in the next fight?

Fresh hero, near zone. Baseline holds one stat point back. Each cell: change in median damage per non-final hit / in hits to kill / in TTK (same enemies, same seed). Negative hits and TTK = faster.

| region | class | base TTK s (hits, dmg/hit) | +1 aging | +1 stat point | +1 weapon tier |
|---|---|---|---|---|---|
| meadow | warrior | 2.0 (4.3, 30) | +10% dmg · -11% hits · -14% TTK | +2% dmg · -8% hits · -8% TTK | +8% dmg · -11% hits · -13% TTK |
| meadow | hunter | 4.1 (8.4, 13) | +4% dmg · -6% hits · -9% TTK | +7% dmg · -3% hits · -9% TTK | +16% dmg · -8% hits · -11% TTK |
| meadow | mage | 2.1 (6.5, 18) | -6% dmg · +2% hits · +0% TTK | -1% dmg · -2% hits · -2% TTK | +20% dmg · -12% hits · -20% TTK |
| lake | warrior | 4.7 (10.6, 13) | -4% dmg · -1% hits · -4% TTK | +1% dmg · -3% hits · -6% TTK | +10% dmg · -11% hits · -11% TTK |
| lake | hunter | 6.7 (19.3, 6) | -1% dmg · +2% hits · +12% TTK | +5% dmg · -2% hits · +2% TTK | +8% dmg · -8% hits · +10% TTK |
| lake | mage | 2.2 (7.1, 17) | -4% dmg · +13% hits · +9% TTK | -11% dmg · +16% hits · +15% TTK | +5% dmg · -10% hits · -12% TTK |
| ridge | warrior | 3.9 (8.8, 20) | +3% dmg · -1% hits · -4% TTK | +1% dmg · -1% hits · -4% TTK | +55% dmg · -34% hits · -25% TTK |
| ridge | hunter | 2.5 (12.7, 14) | +1% dmg · +1% hits · +5% TTK | -3% dmg · -3% hits · -5% TTK | +4% dmg · -13% hits · -14% TTK |
| ridge | mage | 1.7 (7.1, 20) | +5% dmg · -8% hits · -8% TTK | +3% dmg · -1% hits · -21% TTK | +112% dmg · -41% hits · -37% TTK |
| desert | warrior | 3.1 (6.9, 36) | +12% dmg · -3% hits · +0% TTK | +11% dmg · -1% hits · 0% TTK | 0% dmg · +4% hits · -4% TTK |
| desert | hunter | 2.0 (7.6, 30) | -3% dmg · +12% hits · +61% TTK | -20% dmg · +15% hits · +104% TTK | +7% dmg · -2% hits · +21% TTK |
| desert | mage | 2.2 (7.2, 30) | +5% dmg · -5% hits · -8% TTK | +9% dmg · -1% hits · -2% TTK | +4% dmg · -5% hits · -11% TTK |
| storm | warrior | 4.0 (8.7, 37) | +5% dmg · -5% hits · -7% TTK | -18% dmg · +6% hits · -9% TTK | -10% dmg · +25% hits · -7% TTK |
| storm | hunter | 2.5 (10.3, 31) | -3% dmg · -3% hits · +2% TTK | +2% dmg · -11% hits · -3% TTK | +8% dmg · -13% hits · -17% TTK |
| storm | mage | 2.0 (7.4, 39) | +4% dmg · -4% hits · -4% TTK | +2% dmg · -6% hits · -7% TTK | +18% dmg · -19% hits · -21% TTK |
| shadow | warrior | 2.7 (7.3, 32) | +61% dmg · -18% hits · +6% TTK | +2% dmg · -2% hits · +1% TTK | +22% dmg · +3% hits · -7% TTK |
| shadow | hunter | 2.0 (7.8, 35) | +0% dmg · -3% hits · +2% TTK | -10% dmg · +10% hits · +23% TTK | 0% dmg · +1% hits · +8% TTK |
| shadow | mage | 1.8 (7.3, 39) | -6% dmg · +9% hits · +9% TTK | -7% dmg · +3% hits · +2% TTK | +6% dmg · -3% hits · -2% TTK |

## 3. Danger readability (phone, landscape 844x390, 2D)

Warrior, region-entry level, far zone, all nearby groups awake. Picture taken on the first frame with a `wtg_*` floor warning on and at least 3 enemies within 330px.

- **meadow**: `docs/combat-feel/busy-meadow.png` · warning at 1.2s: wtg_cone (shield), 18 enemies within 330px
- **ridge**: `docs/combat-feel/busy-ridge.png` · warning at 0.8s: wtg_cone (frostwraith), 6 enemies
- **storm**: `docs/combat-feel/busy-storm.png` · warning at 0.8s: wtg_cone (stormknight), 6 enemies
- **shadow**: `docs/combat-feel/busy-shadow.png` · warning at 0.6s: wtg_cone (shadeknight), 6 enemies

What the pictures show:
- The melee cone (`wtg_cone`) is small (about hero-sized) and sits **under** the hit bursts, damage numbers and the hero. In ridge and shadow the yellow hit burst covers most of it. In meadow, with 18 enemies, the red cone has the same red as the many orange enemy rings and the hit sparks, so it does not stand out.
- Names over enemies ("Terror of Ducks", "Armored", "Splitting", NPC lines) stack on top of the fight centre, right where the warning is.
- The warning is readable only when the fight is small (storm, 6 enemies). The busier the fight, the less you can see it. That is the XP Hero risk from the research brief.

## Key findings

1. **Ordinary fights are already short, close to XP Hero.** Start and near zones take 1-3 s per enemy (3-9 hits) for every class. Far zones on arrival take 4-9 s on average, and the fresh **hunter** is the outlier: 11-15 s in the lake, ridge and storm far zones, with a few enemies still alive after 60 s. Damage taken in a duel is tiny (0.0-0.2 health bars; 0.5 for a fresh hunter in the far lake zone). Ordinary enemies barely threaten a level-appropriate hero.
2. **One upgrade does not show in the next fight.** +1 aging and +1 stat point change damage per hit by about -6% to +12%, which is inside the run-to-run noise. Hits to kill mostly stay the same because enemies die in 4-10 hits, so +5% rarely saves a hit. Only **+1 weapon tier** shows clearly (often -10% to -40% TTK, best on ridge: mage -37%, warrior -25%). Rares are the long fights: 10-40 s, 30-100 hits, against 2-8 s for elites.
3. **Floor warnings get lost in busy fights on a phone.** See section 3. The warning is small, red like the enemy rings, and drawn under the hit effects, numbers and names.

Limits: auto-attack only (skills are where most of the damage comes from in real play, see balance-world.js). Each cell has 6 duels (30 for the upgrades), so a single cell can be off by ±20%. Look at the trend, not one cell. Heroes are built by the tool, not by real loot (gear is the best item of the tier, quality 100%). The tier upgrade ignores the item's stat requirement.
