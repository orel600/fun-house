# Repo map: where things live

First stop for "where does X live". One line per area. For a single js/ file, grep its line in [code-map.md](code-map.md).
Kept true after every merge: add, remove or rename lines here (no approval needed).

## Root
- `index.html`: the game page. Loads css/ and every js/ file in order (later files can use earlier ones at load time).
- `CLAUDE.md`: rules for every session. `roadmap.md`: plan + idea inbox (📥 at the top). `game-design.md`: design decisions by chapter (grep headings).
- `claude-channel.md`: team journal, newest on top (read lines 18-24 only). `CREDITS.md`, `README.md`: credits and intro.
- `manifest.webmanifest`, `sw.js`: install-as-app (PWA). `version.json` is written by the deploy.
- `package.json`: `npm run check` (test bot), `npm run setup`. `team.sh`, `team.ps1`: start the standing role sessions.

## js/ (game code, plain scripts, no modules)
- Core and loop: core.js, state.js, update.js, main.js, input.js, camera.js, version.js, update-check.js, perf.js, bugreport.js.
- Data and text: data.js (enemies, bosses, drops), resources.js (`RES`), lang.js (all player text), dmg.js (6 damage types).
- Player and gear: heroes.js, stats.js, ranks.js, progression.js, weapons.js, gear.js, gearui.js, armor.js, defense.js, itemroll.js, itemcard.js, itemtip.js, sets.js, powers.js, power.js, aging.js, fuse.js, stash.js, loot.js.
- Enemies (world): foeai.js, affix.js, foelore.js, rares.js, nemesis.js, giant.js, hunt.js, wtension.js, questmark.js, labels.js.
- Combat: combat.js (hits, damage), strike.js, hitfeel.js, juice.js, fxcombat.js, wcombo.js.
- Arena (Orel): run.js, spawn.js, arenas.js, arena-*.js (arena-danger.js: the boss danger moment, fill, flash, scorch), maze.js, maze3d.js, boss.js, bonus.js, shop.js, spell.js, ult.js, streak.js, divine.js, orbit.js, arenaui.js, pacing.js, bwin.js.
- Underworld Games / MOBA (Orel): moba.js, moba3d.js, moba-*.js.
- Skills: skills.js, skills-more.js (arena); wskill.js, wskbook.js, wskx.js, wsklvl.js, wrunes.js, sigskill.js, skillcast.js, skillreveal.js, skguide.js, skpractice.js (world); skill-anim.js, skill-fx.js.
- Village (Nir): village.js, npc.js, residents.js, inn.js, deco.js, daily.js, visit.js, trade.js, feed.js, homecoming.js, welcome.js.
- World (Nir): world.js, terrain.js, map-*.js, nodes.js, drops.js, gather.js, gmastery.js, gtool.js, fishing.js, worldnpc.js, worldmap.js, minimap.js, waystones.js, travel.js, curiosity.js, events.js, wlife.js, tiers.js, depths.js, story.js, quests.js, questboard.js, escort.js, mutation.js, wanted.js, secrets.js, lake-bell.js, ridge-hazards.js, storm-river.js, desertwell.js, shadowrocks.js, wisps.js, levelpath.js, book.js.
- Pets: pet.js, petscent.js, rescue.js, parosh.js, petfx3d.js.
- FX and weather: fx.js (`celebrate`), fxlib.js, fx-data.js (generated), fxui.js, fxworld.js, fxvil.js, vfx.js, weather.js, wxworld.js, spark.js, flute.js.
- UI: ui.js, menu.js, hudrank.js, msglane.js, firsttips.js, guide.js, credits.js, gicons.js, gicons-data.js.
- Save and cloud: save.js, cloud.js, pwa.js.
- Sound: audio.js, sounds-data.js (generated from sounds/).
- Drawing 2D: render.js, rig.js (paper-doll skeleton and `SKINS`), look-hd.js, ground.js.
- 3D render layer: render3d.js, m3d.js, models3d.js, m3d/, props3d.js, tex3d.js, ambient3d.js, doll3d.js, readable3d.js, vfx3d.js, skfx3d*.js. `vendor/`: third-party libs.

## Other folders
- `css/`: style.css (main UI) plus one file per window/topic (bwin, itemcard, itemtip, rarity, credits, deco, fxui, short = low landscape screens).
- `tools/`: check.js (test bot), hooks/ (session-start.js, guard.js), merge-driver.sh, balance and perf scripts, asset builders (build3d, build-sounds, build-icons, fx-convert), blender/, trellis/, critic/.
- `docs/`: code-map.md (one line per file), this map, project-state.md (team memory), for-orel.md, ui-guide.md, setup.md, story.md, concept-*.md and concept/ (design concepts), plan-*.md, research-*.md, audit/report folders with screenshots.
- `art/`: 3D models and source art (heroes/, kaykit2/, pets/, pilot/, weapons/).
- `skins/`: does not exist yet. Format for paper-doll skins (`skins/<name>/*.png`) is in the top of js/rig.js.
- `fx/`: effect sprite sheets (.webp) from the Mochi Lab library, used via fxlib.js.
- `icons/`: app icons; ui/ holds UI art (buttons, frames, resource icons).
- `sounds/`: .mp3 effects (see sounds/README.md). `supabase/migrations/`: cloud save database.
- `.claude/`: settings.json (hooks and permissions), commands/ (`/finish`, `/review`), team/ (role files: max, dana, bob, quinn, ari).
- `.github/`: pull_request_template.md; workflows/ check.yml (tests), deploy.yml (Vercel), pr-description.yml, trellis.yml.
