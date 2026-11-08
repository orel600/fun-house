# מפת הריפו: איפה כל דבר גר

התשובה הראשונה ל"איפה X נמצא". שורה לכל אזור. לפירוט לפי קובץ: grep ב-[code-map.md](code-map.md), בלי לקרוא את כולו. MAX מעדכן את המפה אחרי כל מיזוג.

## שורש
- `index.html`: הקובץ שהמשחק נפתח ממנו. סדר הטעינה של כל קבצי js ו-css, ו-HTML של המסכים והחלונות.
- `CLAUDE.md`: הכללים לכל סשן. `roadmap.md`: התוכנית ותיבת הרעיונות. `game-design.md`: עיצוב המשחק. `claude-channel.md`: היומן. קבצים גדולים: קוראים רק עם grep או את הראש.
- `sw.js`, `manifest.webmanifest`: התקנה כאפליקציה (PWA). `package.json`: `npm run check` ו-`npm run setup`.
- `team.ps1`, `team.sh`: פותחים את חמשת הסשנים הקבועים. `CREDITS.md`: קרדיטים לנכסים.
- `sounds/`: קובצי mp3 ו-README עם המקורות. הם נארזים ל-`js/sounds-data.js` דרך `tools/build-sounds.js`.
- `supabase/migrations/`: SQL של השמירה בענן.

## js/: קוד המשחק, לפי נושא
- **ליבה:** core, state, main, input, camera, ui, menu (תפריט ☰), render, labels, msglane, feed (פיד הודעות), perf, update-check, update, version, pwa.
- **שמירה וענן:** save, cloud, stash, trade, bugreport.
- **טקסט:** lang (כל הטקסט שהשחקן רואה, אנגלית בלבד). welcome, firsttips, guide, credits.
- **שחקן וגיבורים:** heroes, rig, weapons, armor, gear, gearui, stats, ranks, hudrank, levelpath, progression, power, powers, sets, tiers, aging.
- **שלל וחפצים:** loot, drops, itemroll, itemcard, itemtip, affix (אויבים מיוחדים), orbit, fuse, resources, nodes, gather, gmastery (מומחיות איסוף).
- **קרב משותף:** combat, dmg (סוגי נזק), strike, foeai, defense, wcombo, juice, hitfeel.
- **אויבים ובוסים:** data, spawn, boss, giant, nemesis, foelore, rares, mutation, hunt, wanted.
- **זירה (אוראל):** arenas, run, maze, maze3d, arena-fx, arena-juice, arena-load, arena-look, arena-scale, arena-tg, arena-weather, arenaui, bonus, shop, spell, rescue, divine, streak, parosh.
- **משחקי השאול, מובה (אוראל):** moba (+ moba-aim, -atk, -bot, -fx, -gamble, -icons, -items, -kits, -look, -move, -recall, -skill-anim, -spells, -vision, -weather), moba3d.
- **סקילים:** skills, skills-more, ult, sigskill, skillcast, skill-anim, skill-fx, skillreveal, skguide, skpractice, wskill, wskbook, wsklvl, wskx, wrunes.
- **אפקטים:** fx, fxlib (נגן Mochi), fx-data (נוצר אוטומטית), fxui, fxcombat, fxworld, fxvil, vfx, vfx3d, spark, skfx3d (+ skfx3d-* לכל סקיל), petfx3d.
- **כפר (ניר):** village, npc, residents, inn, bwin, deco, questboard, questmark, quests, daily, visit, homecoming, book, flute, fishing, pet, petscent.
- **עולם פתוח (ניר):** world, worldmap, worldnpc, travel, waystones, terrain, ground, map-desert, map-lake, map-ridge, map-shadow, map-storm, storm-river, ridge-hazards, shadowrocks, desertwell, lake-bell, depths, events, escort, wlife, wisps, wtension, wxworld, weather, curiosity, secrets, story, minimap.
- **תלת-ממד:** render3d (שכבת הציור, `LOOK3D`), models3d, m3d (+ `js/m3d/`: מודלים של מפלצות, גיבורים ונשקים), doll3d, props3d, ambient3d, tex3d, readable3d, look-hd, `js/vendor/three-bundle.js`.
- **צלילים:** audio (`sfx`, `SOUNDS`), sounds-data (נוצר אוטומטית).
- **אייקונים:** gicons, gicons-data (נוצר אוטומטית).
- **בלי שורה ב-code-map עדיין:** pacing.

## תיקיות נוספות
- `css/`: עיצוב. `style.css` הראשי, וקובץ לכל רכיב (bwin, itemcard, itemtip, fxui, rarity, deco, credits, short).
- `tools/`: בוט הבדיקה `check.js` (`npm run check`), מדידות (perf, perf-arena, playtime, hud-measure, ux-audit, gear-audit, fx-audit), איזון (balance-world, moba-balance, combat-lab), נכסים (fx-convert.py, fx-catalog.py, fx-list.json, build-icons, build-sounds, build3d, slice-*.py, blender, trellis, pet3d, pilot3d), `hooks/` (בתחילת סשן, חסימות), `merge-driver.sh`.
- `docs/`: `code-map.md` (מה בכל קובץ js), `project-state.md` (זיכרון הצוות של אוראל), `concept/` (קונספטים), `ui-guide.md`, `fx.md`, `creative-claw.md`, `setup.md`, `team-guide.md`, `for-orel.md`, `refs/` (קטלוג אפקטים ותמונות ייחוס), דוחות ותוכניות בעבר (plan-*, concept-*, ux-audit, balance-*).
- `art/`: מקורות לתלת-ממד ולדמויות: heroes, kaykit2, pets, pilot, weapons.
- `skins/`: סקינים של הבובה, PNG לכל חלק (`skins/<שם>/`, הפורמט בראש `js/rig.js`). כרגע ריקה.
- `fx/`: אפקטים של Mochi שהומרו, `fx/<id>.webp` (בערך 256). המקור ב-`tools/fx-list.json`. החבילות המלאות לא בריפו.
- `icons/`: אייקוני האפליקציה, ו-`icons/ui/` לאייקונים של הממשק.
- `.claude/`: `settings.json` (חסימות ואישורים), `commands/` (finish, review), `team/` (קובצי התפקיד: max, dana, bob, quinn, ari).
- `.github/`: `workflows/` (check: בדיקת המשחק. deploy: פרסום ל-Vercel. pr-description: בדיקת תיאור ה-PR. trellis), `pull_request_template.md`.
