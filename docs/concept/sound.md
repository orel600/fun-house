# קונספט: צלילים ומוזיקה (DANA, 8.11.2026)

**מצב:** אושר (אוראל, 8.11, #483): קודם צלילים, ומוזיקה אחר כך. סגנון של מכות אמיתיות ונקיות. קרדיטים של Creative Claw רק למה שחסר (30 עד 60). דף השמיעה וההנחיה לבנייה בסוף המסמך.
**תחום:** צלילים ומוזיקה הם של אוראל, בכל המשחק (ניר, 7.11). מתחילים בזירה, במשחקי השאול ובסקילים. לכפר ולעולם מגיעים אחר כך, ושואלים קודם את ניר.

## מה יש היום

- **13 צלילים קצרים** מ-Kenney (CC0), כ-34KB, ב-`sounds/`. מנוע טוב ב-`js/audio.js`: Web Audio, שינוי גובה אקראי, מגבלת קצב לכל צליל, שני ערוצים (קרב ורגעים) עם מחוון לכל אחד, והנמכה של הקרב ברגע גדול.
- **ניר על הצלילים (31.10):** "הצלילים ממש מעצבנים", ואחרי זה הקרב נהיה שקט ונדיר. ניסיון של 12 צלילים "רכים וקריקטוריים" מ-ElevenLabs: "הם לא טובים", ולא נכנסו.
- **אין מוזיקה בכלל.**
- **באג שמצאתי:** הקוד קורא `sfx('ui')` ב-64 מקומות (ספירה לאחור לפני גל, "גל נוקה", כפתורים בחלונות), אבל אין צליל בשם `ui` ב-`SOUNDS`. כל הרגעים האלה שקטים.
- **בזירה ובשאול:** סקילים, קומבו, רצף הריגות, סקיל-על, נפילת מגדל וחדר ההימור משתמשים לכל היותר ב-`tap` או ב-`celebrate`, או שאין להם צליל בכלל.

## העקרונות

1. **מעט, שקט, ורק כשזה אומר משהו.** צליל הוא מידע: "הסקיל יצא", "המגדל נפל", "אתה בסכנה". הקרב נשאר שקט, כמו שניר ביקש. הרגעים הגדולים חזקים וברורים.
2. **צליל לפי סוג נזק, כמו צבע.** לכל אחד משישת סוגי הנזק "קול" אחד, כך ששומעים איזה סוג נזק יצא בלי להסתכל:

| סוג | קול | דוגמה |
|---|---|---|
| פיזי | חבטה יבשה | מכת עץ על מתכת |
| אש | וושש והתלקחות | גפרור גדול |
| מים | התזה | אבן במים |
| קרח | צלצול גבישי | כוס זכוכית |
| ברק | זמזום חשמלי חד | ניצוץ |
| אדמה | רעם נמוך | סלע נופל |

3. **הסגנון: מכות אמיתיות ונקיות, לא קריקטורה.** אותו סגנון כמו Impact Sounds של Kenney שכבר במשחק. הקריקטורי נפסל.
4. **מקורות לפי הסדר:** (א) Kenney CC0: Impact, Interface, RPG Audio, Digital Audio, Sci-fi, Casino Audio (לחדר ההימור). (ב) רק מה שחסר: Creative Claw (`sfx/mirelo-sfx-2.0` או ElevenLabs), ושומעים 3 גרסאות לכל צליל. (ג) מוזיקה: Creative Claw (`music/lyria-3.5`), או לולאות CC0.

## רשימת הצלילים, סבב ראשון (כ-18)

| רגע | איפה | ערוץ | מקור מוצע |
|---|---|---|---|
| **`ui`** (תיקון הבאג): התראה רכה | כל המשחק | רגעים | Interface Sounds |
| הטלת סקיל ×6, אחד לכל סוג נזק | זירה, שאול, עולם | רגעים | Kenney, והשאר מ-Creative Claw |
| מילת קומבו: חשמול / הקפאה / המסה | זירה, שאול | רגעים | צליל סוג הנזק, בגובה אחר |
| רצף הריגות: 3 דרגות שעולות בגובה | זירה | רגעים | Digital Audio |
| סקיל-על: מוכן (נצנוץ) והטלה (בום גדול) | זירה, שאול | רגעים | Sci-fi / Impact |
| גל מתחיל (קרן) | זירה | רגעים | RPG Audio |
| מגדל נופל (רעם ואבנים) | שאול | רגעים | Impact |
| הבסיס שלך מותקף (אזעקה, פעם ב-10 שניות לכל היותר) | שאול | רגעים | Interface |
| אתה מת / חוזר לחיים | שאול | רגעים | Impact / Digital |
| גלגל ההימור: תקתוק, ניצחון, הפסד | שאול | רגעים | Casino Audio |

פגיעות על אויבים נשארות עם ה-`hit` הכללי. צליל פגיעה לכל סוג נזק יכפיל את הרעש, וזה בדיוק מה שהפריע לניר.

## מוזיקה

- **איפה, לפי הסדר:** (1) לולאה לזירה (קצב בינוני, כ-100 BPM, בלי מילים). (2) לולאה למשחקי השאול (מתח, נמוכה יותר). (3) שכבה שנכנסת כשהבוס מגיע. כפר ועולם רק אחרי שניר שומע ומאשר.
- **שקטה כברירת מחדל:** ערוץ שלישי `music` בחלון הצלילים, ומתחיל ב-40%. המוזיקה יורדת ברגע גדול (כמו ההנמכה של הקרב), ונעצרת כשהמשחק ברקע.
- **משקל:** לולאה של דקה, מונו, 64kbps, כ-0.5MB. נטענת רק כשנכנסים לזירה או לשאול, כקובץ סקריפט נפרד (עובד גם מ-`file://`), ולא בפתיחת המשחק, שכבר כבדה.

## איך מאשרים בלי לבזבז

לפי הכלל "קודם קונספט": **דוגמה אחת לפני כמות.** שישה צלילי הטלה (אחד לכל סוג נזק) ולולאת זירה אחת בשתי גרסאות, בדף שמיעה קטן. אוראל שומע ובוחר, ורק אז מייצרים את השאר.

## שאלות לאוראל

1. **מוזיקה:** מתחילים עכשיו בזירה ובשאול, או קודם רק צלילים?
2. **הסגנון:** "מכות אמיתיות ונקיות" מתאים לך, או שאתה רוצה משהו אחר, למשל פנטזיה קסומה יותר?
3. **קרדיטים של Creative Claw:** מותר להשתמש בהם לצלילים שחסרים ולמוזיקה? הערכה: כ-30 עד 60 קרדיטים לסבב הראשון.

## ביקורת עצמית

1. **האם זה עונה על מה שאוראל ביקש?** הבקשה הייתה קונספט לצלילים ולמוזיקה בתחום שלו. זה מכסה את שניהם, עם רשימה ממשית ולא רק "סגנון". וזה מתחיל מהבעיה האמיתית שכבר נשמעה: צלילים מעצבנים.
2. **מה פספסתי?** (א) מאה הטלות בדקה בזירה: לכל צליל הטלה יש מגבלת קצב (`gap`), והוא בערוץ הרגעים, שמנמיך את הקרב ולא מצטבר. (ב) הבוטים במשחקי השאול: צליל רק לסקילים שלך ולסקילים שפוגעים בך, לא לכל בוט בכל המפה. (ג) טלפון בשקט: המשחק חייב להיות ברור בלי צליל, והצליל רק מוסיף. (ד) בפעם העשירית: לולאה של דקה מתחילה לשעמם, ולכן בהמשך יבואו שתיים לכל מקום, שמתחלפות.
3. **האם זה כבר קיים? מה הסיכון?** המנוע, הערוצים ומגבלות הקצב קיימים. חדש: הצלילים עצמם, ערוץ מוזיקה וטעינה מאוחרת של המוזיקה. הסיכון: משקל (נפתר בטעינה מאוחרת), ורעש (נפתר בכלל "מעט ושקט" ובמחוונים). תיקון ה-`ui` בטוח לגמרי: מוסיף צליל, ולא משנה לוגיקה.

## דף השמיעה (שלב 1, לפני הבנייה)

מוזיקה נדחתה, ולכן בדף אין לולאות: רק צלילי ההטלה, וצליל ה-`ui`. אוראל בוחר אות לכל שורה, וכל שאר הצלילים נבחרים באותו סגנון.

```
Task: sound listening page (no game code). Spec: docs/concept/sound.md (approved by Orel, #483).
Candidates (Kenney CC0 first; Creative Claw sfx/mirelo-sfx-2.0 only for gaps, max ~30 credits, 3 variants each):
- One row per damage type: physical, fire, water, ice, lightning, earth. 3 candidates each (A/B/C).
  Brief: punchy and realistic, not cartoony. physical = dry thud, fire = whoosh + flare, water = splash,
  ice = crystal chime, lightning = sharp electric zap, earth = low rumble/rock drop.
- One row 'ui': 2 candidates for a soft notification (wave countdown, "wave cleared", window buttons). Kenney Interface Sounds.
- A reference row with the current sounds/hit.mp3 and sounds/celebrate.mp3, for loudness context.
Processing: mono, 22kHz, mp3 ~64kbps, silence trimmed, at most 0.7 s (earth at most 0.9 s), peak-normalized to the same level.
Kenney zips go to your scratchpad only. Never commit raw packs.
Page: one private HTML Artifact, phone landscape, audio embedded as base64. Each row has a chip in the DMG color and the type name.
Per candidate: "▶" (play once) and "×5" (5 plays, 0.25 s apart, random pitch ±12%, like the game, to hear whether it gets annoying).
Tapping a candidate selects it. At the bottom, one line to copy, e.g. "physical B, fire A, water C, ice A, lightning B, earth C, ui A".
Keep the chosen files (named cast_<type>.mp3 and ui.mp3) in your scratchpad for the build step.
Deliver: the artifact link + the candidate files' sources (pack + original filename, or Creative Claw model + prompt) to MAX.
```

## הנחיה ל-BOB (שלב 2, אחרי שאוראל בחר)

```
Task: sound pass 1, arena + underworld + skills (no music). Spec: docs/concept/sound.md (approved by Orel, #483).
Inputs: Orel's picks from the listening page (cast_<type>.mp3 ×6, ui.mp3), plus the event sounds below,
sourced in the same punchy-realistic style (Kenney CC0 first).
Branch: feature/sound-pass-1 from fresh main (git fetch && git merge origin/main), in your own worktree. Draft PR.

1) BUG FIX: sfx('ui') is called in ~64 places, but there is no 'ui' in SOUNDS (js/audio.js), so those moments are silent.
   Add ui:{file:'ui.mp3', vol:0.3, pitch:0.05, max:1, gap:0.12, grp:'fx'}.
2) CAST SOUNDS: SOUNDS rows cast_physical ... cast_earth: {vol:0.35, pitch:0.12, max:2, gap:0.12, grp:'fx'}.
   Helper in js/audio.js: sfxCast(dt,k=1) plays 'cast_'+dt, or 'tap' if missing.
   Hooks (player casts only):
   - arena: js/skills.js (cast, now sfx('shoot') ~line 68) -> sfxCast(<skill's dmg type>); js/skills-more.js casts; js/ult.js cast.
   - underworld: js/moba-kits.js ~lines 100 and 113 (now sfx('tap') / 'levelup' for u.me) -> sfxCast(<slot's dmg type>). Keep the u.me guard.
   - Do NOT hook world/village skills (Nir's side). That comes later, after Nir hears it.
3) COMBO WORDS (skills.js comboShow and its moba equivalent): sfxCast(<combo's type>, 1.4) (k>1 = lower and louder), instead of 'celebrate'.
4) EVENT SOUNDS (new files, fx channel, each with a gap):
   wave_start (horn, arenas.js wave start, gap 2), streak1/2/3 (rising, streak.js, replacing the current pick),
   ult_ready (shimmer, when the ult button becomes ready, arena + underworld for u.me, gap 5),
   tower_fall (rumble, moba.js tower death ~line 119, gap 1),
   base_alarm (your base is hit, moba.js, gap 10, my team only),
   me_die / me_back (moba.js, u.me only),
   gamble_tick / gamble_win / gamble_lose (js/moba-gamble.js; Kenney Casino Audio).
5) Every new file gets a row in sounds/README.md (pack + original filename, or Creative Claw model + prompt).
   Credit Kenney in CREDITS.md if not already there. Run node tools/build-sounds.js.
   Budget: js/sounds-data.js stays under 200KB (today 68KB).
6) CHECKS in tools/check.js: (a) static: every sfx('<id>') id used in js/*.js exists in SOUNDS (this would have caught 'ui');
   (b) in the arena run, AUDIO.count has cast_* > 0 and ui > 0; (c) in the underworld run, tower_fall > 0.
Hebrew comments, numbers in SOUNDS (not in logic). No journal lines, no roadmap.md edits. Message MAX when checks are green.
```
