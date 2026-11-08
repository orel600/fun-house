# צלילים

כל הצלילים כאן ברישיון **CC0**, רובם מחבילות של **Kenney** (www.kenney.nl), ו-5 צלילי ההטלה מ-OpenGameArt (נחלת הכלל): מותר להשתמש, לשנות ולהפיץ בלי לבקש רשות. הקרדיט לא חובה, אבל מגיע לו.
https://creativecommons.org/publicdomain/zero/1.0/

הקבצים הוסבו ל-mp3 מונו, 22kHz, ונחתך מהם השקט בהתחלה ובסוף, כדי שיהיו קטנים (כ-34KB ביחד).

| קובץ | מה זה במשחק | חבילה | קובץ מקורי |
| --- | --- | --- | --- |
| hit.mp3 | פגיעה באויב | Impact Sounds | impactPunch_medium_000 |
| shoot.mp3 | יריית חץ | Interface Sounds | pluck_001 |
| death.mp3 | אויב נופל | Impact Sounds | impactSoft_heavy_001 |
| xp.mp3 | איסוף XP | Interface Sounds | glass_001 |
| coin.mp3 | מטבע, פריט, שלל | RPG Audio | handleCoins |
| levelup.mp3 | עלייה ברמה | Digital Audio | powerUp2 |
| bossIn.mp3 | הבוס מגיע | Impact Sounds | impactBell_heavy_000 |
| bossDown.mp3 | הבוס הובס | Digital Audio | zapThreeToneUp |
| hurt.mp3 | השחקן נפגע | Impact Sounds | impactPunch_heavy_002 |
| tap.mp3 | לחיצה על כפתור | Interface Sounds | click_002 |
| celebrate.mp3 | שדרוג, שלל נדיר | Interface Sounds | confirmation_002 |
| bell.mp3 | פעמון הערפל באגם (lake-bell.js) | נוצר בקוד (סינתזה), לא Kenney | - |
| creak.mp3 | חריקה של גשר צף באגם | נוצר בקוד (סינתזה), לא Kenney | - |
| ui.mp3 | התראה רכה (ספירה, גל נוקה, כפתורים בחלונות) | Kenney Interface Sounds | confirmation_001 |
| cast_physical.mp3 | הטלת סקיל פיזי | Kenney Impact Sounds | impactPunch_heavy_001 |
| cast_fire.mp3 | הטלת סקיל אש | lentikula, Basic Spell Impacts (CC0, OpenGameArt) | Fire Spell Impact 3 |
| cast_water.mp3 | הטלת סקיל מים | lentikula, Basic Spell Impacts (CC0, OpenGameArt) | Water Spell Impact 4 |
| cast_ice.mp3 | הטלת סקיל קרח | lentikula, Basic Spell Impacts (CC0, OpenGameArt) | Ice Spell Impact 5 |
| cast_lightning.mp3 | הטלת סקיל ברק | CoMiGo, Bleeps and Bloops (CC0, OpenGameArt) | ElectroZap |
| cast_earth.mp3 | הטלת סקיל אדמה | lentikula, Druid Spell Impacts (CC0, OpenGameArt) | Earth Spell Impact 2 |

סבב צלילים 1 (8.11.2026, docs/concept/sound.md): הצלילים מסוג `cast_` ו-`ui` נבחרו בדף ההאזנה של ARI (MAX בחר במקום אוראל). החלפה = קובץ אחר באותו שם, ו-`node tools/build-sounds.js`.

צליל חדש: קובץ קצר כאן, שורה ב-`SOUNDS` בראש `js/audio.js`, ואז `node tools/build-sounds.js`, שבונה מחדש את `js/sounds-data.js`.
