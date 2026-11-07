# Fresh-eyes review of main, 7.11.2026 (after the big round, #449)

Reviewer: Claude on `claude-sonnet-5-5`. Read, run, report only. No game code changed.
Main at review time: `68abe2f` (#449).

## What I ran

- `node tools/check.js --gfx 2d --seed 11`: 329 ✓, 1 ✗ (world-map labels, finding 6). "No console errors" ✓.
- `node tools/check.js --gfx 2d --real --seed 5` (bot can die): same world-map ✗, plus arena ✗ that come from the bot dying (see Orel section). "No console errors" ✓.
- My own headless play at **848x388** and **924x424** (2D): start screen, hero pick, village, Settings (all toggles), world, fight soak (12 s of fighting, array and DOM counts flat), all 24 skills cast in the world, Gear / Character / Book / Hero windows, world map, arena. Zero page errors and zero console errors in every script.
- English only: no Hebrew on any screen I opened. A scan of all non-comment code found Hebrew only in console messages and in the places listed in finding 5.
- **Not run:** 3D (15+ min on CPU, and for-orel.md says not to), real 120 fps hardware. Headless 2D idle gave a flat 16.7 ms median and p95 (60 Hz cap), so that is not evidence about 120 fps. 3D effects were only read in code.

## Findings, most important first

### 1. A full or nearly full phone storage skips the main save (progress loss)
- **Where:** `js/save.js:45-48` (`SAVE_STORE.write`).
- **What:** the rolling backup write (`-bak2`) is in the same `try` as the main write and comes first. If the backup `setItem` throws (quota), the main `fh-save` write is skipped, and since `lastBak` is only updated after success, it is skipped on every later save too. Only the "save failed" banner appears. Progress then lives only in memory.
- **Repro:** in the console, make `Storage.prototype.setItem` throw for `fh-save-bak2`, set `SAVE_STORE.lastBak=-1e15`, `bagAdd('wood',777)`, `saveNow()`. Stored `bag.wood` stays 30 while memory has 807, `SAVE_STORE.failed` is `true`.
- **Verified:** yes (ran it).
- **Fix:** put the backup write in its own `try/catch` so the main write always happens.

### 2. "📖 New in the book!" feed row sits under the village side buttons
- **Where:** feed column (`js/feed.js`, `book.js:46`) vs the village button stack (Book / Quests / Hero) on the right.
- **What:** at 848x388 the row is half behind the Hero button; at 924x424 it is a ghosted label touching the buttons. Reads as clipped text.
- **Repro:** new game, village, wait a few seconds (`scratchpad v1-848.png`, `v1-924.png`).
- **Verified:** yes (screenshots).
- **Fix:** keep the feed column left of the village button stack (add the stack to the feed's avoid-list, or shift the column by the stack width).

### 3. "New: <foe>" card covers the end of the HP bar
- **Where:** message lane, `js/msglane.js` (`msgPlace`, `msgBlocks`) with the foe card from `js/foelore.js`.
- **What:** at 848x388 the card (≈405 px wide) starts at x≈127 and covers the right end of the HP bar (bar ends at x≈172). It also covers part of the XP bar underneath.
- **Repro:** walk in the meadow until a first meeting card appears (`fight-848.png`).
- **Verified:** yes (screenshot). Not covered by the bot's lane check, which only tests buttons and hero.
- **Fix:** add the HP/XP bar element to `msgBlocks` (it is probably skipped as `pointer-events:none`), or give the lane a minimum left edge of about 180 px.

### 4. Speech bubble and name tags stack on each other
- **Where:** foe labels, `js/labels.js` / `js/foelore.js`.
- **What:** with one rare/named foe at 924x424: "✚ Regenerating", the bubble "I am Dardak Who Ate a Lantern!…", the gold name and "Old Barkbeard" overlap each other and the bubble text is tiny (`w2-924.png`).
- **Verified:** yes (screenshot).
- **Fix:** hide the bubble while the status tag is shown, or stack the tags with a fixed vertical gap.

### 5. Hebrew still in the installed app's identity
- **Where:** `manifest.webmanifest:2-6` (`name` "שישה פנסים · Six Lanterns", `short_name`, `lang:"he"`, `dir:"rtl"`), `index.html:6-7` (`apple-mobile-web-app-title`, `<title>` until JS replaces it).
- **What:** the home-screen app name on Nir's phone is Hebrew, and the manifest is RTL for an English-only game.
- **Verified:** yes (file read). Not visible inside the game.
- **Fix:** set English name/short_name, `lang:"en"`, `dir:"ltr"`, and the same for the apple title and `<title>`.

### 6. World-map labels overlap at 844 px after a long run
- **Where:** `js/worldmap.js` (`wmLabels`), check at `tools/check.js:3096`.
- **What:** "world-map, all regions open" fails with 2 overlaps at 844 px in the world (1280 px fine). Same ✗ in both of my runs (seeds 11 and 5).
- **Repro:** it does **not** reproduce on a fresh load with all regions unlocked at 844/848/924 (0 overlaps, 6 labels). So it depends on state left by the bot (probably a pet, a rare circle or a "here" marker in play). Worth checking whether CI is also red on this.
- **Verified:** partly (bot yes, fresh load no).
- **Fix:** run the check right after `rareDraw`/pet state reset to find which extra element collides, then add it to the avoid list.

### 7. Message-lane upkeep costs layout every 300 ms while any message is up
- **Where:** `js/msglane.js` interval at the bottom, `msgBlocks`.
- **What:** while a row is showing, `msgPlace` runs every 200-300 ms and calls `getBoundingClientRect` and `getComputedStyle` on every body child and their children. That forces layout several times a second in the world, the case where 120 fps matters.
- **Verified:** no (read only, no profile).
- **Fix:** only re-place when the set of rows or the viewport changes; cache the blocks for about 1 s.

### 8. Cast-ring uses `shadowBlur=14` on the canvas
- **Where:** `js/skillcast.js:130` (`skcDraw`, 2D path).
- **What:** canvas shadow blur is expensive on a scaled context with several strokes. It runs for the ring's life (about 1 s) per cast, and casts can be frequent. 2D only; the 3D path uses sprites.
- **Verified:** no (read only).
- **Fix:** drop the shadow and draw the ring twice (a wide faint stroke under a thin one).

### 9. Character window: "Build 1 / Build 2 / Talents" look like plain text
- **Where:** Character page of the gear window (`js/gear.js` / `gearui.js`).
- **What:** three entries have no button frame while "Skills" has one, so it is unclear they are tappable (or locked) (`win-char-848.png`).
- **Verified:** yes (screenshot); behavior not tested.
- **Fix:** give them the same frame as Skills, greyed out with a 🔒 if not unlocked.

### 10. Defense rating: no wipe risk, one thing to know
- **Where:** `js/defense.js`.
- **Checked:** `P.def` is derived from gear every time. There is no new save field and no migration, so no data can be lost. The English-only migration (`js/lang.js:7`) only rewrites `zm-lang` to `en`; it touches nothing else. Arena, bonus room and Underworld use the old percentage (`defWorld()` is false there, checked in the arena).
- **Numbers (by region):** attacker level is lake 10, ridge 16, desert 22, storm 28, shadow 34 (before zone and world-tier bonuses). Absorbed % at 150 points: lv1 34 %, lv10 28 %, lv20 24 %, lv30 20 %. At 600 points: 67 / 61 / 56 / 51 %. So the same armor gives roughly 40 % less protection in the far zones than at the start, which is the intended decay.
- **Bot balance line (start / near foe HP):** meadow 120/120, lake 85/144, ridge 129/215, desert 159/273, storm 180/355, shadow 235/324. The shadow near-zone is lower than storm's, which is odd for "next zone is harder".
- **Verified:** numbers yes (ran `defPct`); real play balance no (the bot is not a real player).
- **Fix (if wanted):** look at `data.js` shadow `near` HP, maybe 324 should be around 380.

### 11. Small things
- `comet` and `lance` return "not ready" in the world: they are arena-only (Orel's), as the design says. Not a bug.
- All other 22 world skills fire without errors.

## For Orel (arena / Underworld)

1. **Arena in `--real` mode fails 5 checks** (my `--real --seed 5` run): arena messages (boss-time measurement missing), arena windows in landscape (boss never appeared), stations/elites (one yeti left at 89 %), blobs (largest 16 foes, up to 196 in the arena together) and "boss appeared: -". I think this is the bot dying early in real mode (no god mode) and not a game bug, but I did not prove it. Worth one run with a stronger bot or `--seed` change before trusting the arena checks in real mode.
2. **Everything under "משחקי השאול" passed** in both runs: shop, bets room, vision and bushes, combos, difficulty, English.
3. The arena still uses the old percentage defense and the old cap `STATS.cap.def`. That is intended. Just remember it when comparing arena armor values to what the world now shows.
4. A harness note, not a bug: calling `startRun()` from the village leaves the village HUD (resources, side buttons, home icon) on screen. The real flow goes through the gate, so I did not count it. If the title screen can start a run while the village HUD is still up, it would be a bug.

## What I could not check

- 3D look and cost of the new effects (loot cascade, rares beam, skill cast) on real hardware.
- 120 fps on the OnePlus 15.
- Anything needing Supabase / a real network (fonts and network were stubbed, like the bot does).
