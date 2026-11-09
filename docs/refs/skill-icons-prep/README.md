# Skill icons: preparation (ARI, 9.11.2026). Not wired into the game.

`review.webp`: all 40 round icons from Orel's morning package (20 arena, 20 underworld), each in three states: **normal | pressed | cooldown**. The treatments are what `tools/icon-prep.py` produces and approximate the runtime ones in the package's `skill-button-states-runtime` image: pressed = brightness +25% and scale 92%, cooldown = no colour, 55% brightness, with a radial wipe back to colour (here 40% left).

**Frame:** the originals are already inside the shared round gold frame (591x591, the same 17..575 silhouette on all 40), so the prep is a square trim, not a reframe. Gem colour varies per icon (blue, red, purple); that is the artist's variation.
**Outputs (not committed, 1.4MB for 40x2 files):** `<name>.webp` at 256 px and `<name>-128.webp` at 128 px (the existing `icons/ui/skills` are 128). Regenerate: `python tools/icon-prep.py <originals dir> <out dir> --sheet docs/refs/skill-icons-prep/review.webp`. Originals are not in the repo.

## Review notes (observations, for Orel)
- Look-alikes at small size: **tank basic vs tank anvil slam** (both a fiery hammer on a cracked floor), and **warrior basic vs sword wave** (both a red slash). On a phone these need one clear difference (colour or silhouette).
- **Hue rule:** colour is meant to be the damage type (physical white, earth brown, ...). The warrior and tank-taunt icons are red; physical is white in the game. Red is also the enemy-team colour. Not a blocker, but it needs a decision before wiring.
- Arena icons with similar tones: comet vs meteor shower vs flame (all orange fire); smite vs judgment beam vs lance (all gold light).
- The 40 icons are not all needed: the underworld uses 20 (basic, s1, s2, ult for five kits), the arena 20 (including the "new" ones, which are for skills that don't exist yet).
- Wiring is a separate job in `js/moba-icons.js` (`MB_PIC`) and the arena skill icons; it is not part of this PR.
