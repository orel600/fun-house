# קונספט: קושי במשחקי השאול (DANA, 8.11.2026)

**מצב:** סופי, לאישור של אוראל. מבוסס על 7 סבבים של QUINN (כ-2,500 משחקים מדומים). כל המספרים נבדקו.

## הבעיה

- **השחקן מת בדקה הראשונה.** בבדיקות הקבלה: 0:2 כבר ב-0:53.
- **"הכחולים מנצחים בערך 72%"** במשחקי בוטים. פתוח מאז #424.

## מה גילינו

**1. ה-72% לא קיים.** ב-120 משחקים של "קשה" מול "קשה" הכחולים ניצחו 49%. ההרכבים, סדר העדכון והלחש של השחקן נבדקו, והם סימטריים. ה-17:4 הגיע מהבוט של check.js, שמשחק ב"קל", ושם הכחולים אמורים לנצח. **נשארו שני דברים קטנים:** תיקו בסוף הזמן הולך לכחולים (`left(0)>=left(1)`), אבל זה קורה רק בכ-2 מתוך 80 משחקים. והפתחים בשיחים לא סימטריים (`MBLOOK.map.bush.seg`, נמצא בטיוטה הקודמת של DANA).

**2. מי הורג את השחקן:** כ-85% מהמיתות עד 3:00 הן **שניים או שלושה גיבורי אויב עליו בבת אחת**. המגדל אחראי רק לכ-20% ב"קל", וכמעט לכלום ב"רגיל". לכן פחות נזק בפתיחה, מגדל רך יותר ובוטים איטיים יותר לא עזרו (נבדקו ונפסלו).

**3. "קל" נהיה קשה בגלל החפצים.** ב-6.11 השחקן הפשוט ניצח 12 מתוך 16 ב"קל". היום הוא מנצח 0%. כשבוטי האויב לא קונים חפצים: 80%. חדר ההימור לא השפיע.

**4. כשה"שחקן" בבדיקה הוא בוט אמיתי עם מוח חלש, הקושי כבר כמעט מאוזן.** שחקן במוח של "קל" ניצח 78% ב"קל", 50% ב"רגיל" ו-15% ב"קשה", ולא מת לפני 1:00. כלומר "קשה" קצת קשה מדי, והבעיה הגדולה היא שחקן חלש ב"קל".

## ההחלטה: שלושה שינויים קטנים

### 1. לא מתנפלים יחד (כלל חדש במוח של האויב)

**כמה בוטים של האויב מותר להם לתקוף את השחקן בבת אחת:** ב"קל" 1, ב"רגיל" 2, וב"קשה" 3 (כלומר בלי הגבלה). בוט שהגיע לתקרה בוחר גיבור אחר, חייל, או נסוג כמו שהוא עושה כשאין לו יתרון.
- **חריג:** שחקן מתחת ל-20% חיים מותר לגמור, ולכן הכלל לא הופך את השחקן לבלתי מנוצח.
- **בלי פרצות:** הכלל חל גם על התקיפה האוטומטית (בוט מוגבל מכה בשחקן רק אם אין לו מטרה אחרת בטווח) וגם על הגנת המגדל.
- **למה זה הוגן:** זה רק המוח של האויב, בדיוק כמו שאר רמות הקושי. בלי חיים ובלי נזק (כוח שוויוני). החברים שלך לא מושפעים.
- **מה זה עושה (QUINN):** ב"קל" השחקן נמצא במוות 22% מהזמן במקום 29%, ופחות מפעם אחת לפני 1:00. ב"קשה" עם שחקן במוח של "קל": 15% ← 28%, קרוב ליעד 35%. בבוטים מול בוטים ב"קשה": 45%, סימטרי.

### 2. בוטי האויב ב"קל" קונים פחות חפצים

ב"קל" כל בוט של האויב **מפסיק לקנות אחרי 3 חפצים** (המגפיים נחשבים), וקונה לאט יותר (`MBBOT.diff.easy.buy` מ-1.5 ל-**2.5**). שדה חדש: `MBBOT.diff[d].items`, שהוא 3 ב"קל" ובלי הגבלה ב"רגיל" וב"קשה". זו החלטת קנייה של הבוט, כמו `buy` שכבר קיים, ולכן זה נשאר בגדר "המוח".
- **למה לא רק קצב קנייה:** QUINN מצא שזה כמעט לא משנה, כי הזהב נאסף והבוט קונה מאוחר יותר יותר בבת אחת. וגם לא פחות זהב: זה כבר שינוי בכלכלה ושובר את "כוח שוויוני".
- **מה זה עושה (QUINN, 40 משחקים לכל מדידה, ב"קל" עם כלל 1):**

| | היום | הגבלה 2 | הגבלה 3 | **הגבלה 3 וקנייה 2.5** |
|---|---|---|---|---|
| שחקן פשוט מנצח | 13% | 57% | 28% | **35%** |
| שחקן במוח של "קל" מנצח | 73% | 95% | 90% | **80%** |
| זמן במוות (שחקן פשוט) | 29% | 23% | 26% | **26%** |
| אורך משחק (שחקן פשוט) | 10:42 | 10:29 | 10:52 | **11:01** |

"קל" נהיה סלחני לשחקן חלש, ועדיין לא ניצחון חינם לשחקן טוב.

### 3. תיקון קטן: תיקו אמיתי

בסוף הזמן מנצח מי שנשארו לו יותר מבנים. בשוויון: מי שיש לו יותר הריגות (`MB.score`). אם גם זה שווה, "Draw" בחלון הסוף הקיים (מפתח חדש ב-lang.js, באנגלית בלבד). השיחים נבנים כמראה בשני הצדדים (`x` מול `-x`).

### מה נבדק ונפסל

| רעיון | למה לא |
|---|---|
| בוטים איטיים יותר ב"קל" וב"רגיל" | לא שינה את מספר המיתות. הבעיה היא ההתמקדות, לא מהירות התגובה |
| פחות נזק בפתיחה (`MOBA.early`) | עוזר רק מעט ב"קל", ולא משנה ניצחונות |
| מגדל רך יותר (`MOBA.tower.hero`) | המגדל לא הורג אחרי שהשחקן נזהר ממנו |
| החברים באים לעזור | מושך את החברים מהנתיב, ומקל מדי על "קשה" (55%) |
| בונוס חיים או נזק רק לשחקן | שובר את "כוח שוויוני". אם אוראל ירצה, זו החלטה שלו |

## היעדים ואיך נדע שזה עבד

| מדד | קל | רגיל | קשה |
|---|---|---|---|
| ניצחונות של שחקן במוח של "קל" | 70%-90% | 45%-60% | 25%-40% |
| ניצחונות של שחקן פשוט (הרצפה) | לפחות 35% | | |
| מיתות לפני 1:00 (שחקן הוגן) | פחות מ-1 | פחות מ-1 | עד 1 |

בבוטים מול בוטים ב"קשה": 42%-58%. אורך משחק עד 11 דקות.

## ביקורת עצמית

1. **האם זה עונה על מה שאוראל ביקש?** כן. "מת בדקה הראשונה" נבע מהתנפלות של שלושה עליו, וזה מה שמטופל. "72%" נבדק ונסגר כמזל, ולא כוסה במספרים. שתי ההצעות הראשונות שלי נבדקו ונפסלו, ולא נבנות.
2. **מה פספסתי?** (א) שחקן אמיתי לא זהה לאף בוט, ולכן מדדנו גם את הרצפה (שחקן פשוט) וגם שחקן במוח חלש. (ב) בפעם העשירית: מי שמשתפר עובר ל"רגיל". "קשה" נשאר בלי הגבלה, ולכן הוא עדיין מבחן אמיתי. (ג) הכלל צריך להרגיש טבעי ולא כמו בוט שקופא: בוט מוגבל ממשיך לזוז, לתקוף חיילים ולחפות על חבר. (ד) באג שהבדיקות מצאו: `js/moba-bot.js:93`, בוט בלי חיילים ובלי מגדל קורס בפריים שבו הבסיס נופל. QUINN דיווח ל-MAX.
3. **האם זה כבר קיים? מה הסיכון?** רמות הקושי, המוח לפי רמה וקצב הקנייה קיימים. חדש: שדה `gang` ב-`MBBOT.diff`, וכמה שורות ב-`mbThink` וב-`mbBot`. הסיכון: BOB עובד עכשיו על משחקי השאול (PR 2, כפתור התקיפה). אם שניהם נוגעים ב-moba-bot.js, אחד מתעדכן מ-main לפני המיזוג.

## הנחיה ל-BOB (באנגלית, להעתקה)

```
Task: MOBA difficulty, gang cap + easy shopping cap + fair tiebreak.
Concept: docs/concept/moba-difficulty.md (DANA; build only after MAX confirms Orel approved). Data from QUINN's 7 sim rounds.
Branch: fix/moba-difficulty from fresh main (git fetch && git merge origin/main), in your own worktree. Draft PR.

1) GANG CAP (enemy brain only, js/moba-bot.js)
- Add gang to MBBOT.diff: easy 1, normal 2, hard 3. Add MBBOT.gangSecure = 0.2.
- Helper mbGangFull(u, target): true when u.team!==MB.me.team, target===MB.me, MB.me.hp > MB.me.max*MBBOT.gangSecure,
  and the count of OTHER foe heroes (alive, same team as u) whose bot.focus===MB.me, or which are in mode 'fight'/'defend'
  within MBBOT.engage of MB.me, is >= mbFoe().gang.
- mbThink step 4 (fight): if the chosen `weak` is MB.me and mbGangFull, pick the next weakest hero in fh that isn't MB.me.
  If there is none, fall through as if not brave (kite / push).
- mbThink step 5 (defend): if threat===MB.me and mbGangFull, don't defend on him. Continue to the next steps.
- mbBot auto-attack: if the resolved target t is MB.me and mbGangFull, prefer any other valid target in range
  (mbAutoTarget excluding MB.me). Hit MB.me only if he is the only target in range.
- Friendly bots are unchanged. The cap protects only MB.me, also when a bot plays MB.me (that is how QUINN measured it).

2) EASY SHOPPING (foe bots only): MBBOT.diff.easy.buy 1.5 -> 2.5, and a new field items in MBBOT.diff:
   easy 3, normal and hard Infinity (or omit = no cap). In js/moba-items.js (bot buying, ~line 80), a foe bot
   (u.team!==MB.me.team) with items.length >= mbFoe().items stops buying (boots count as an item). Friendly bots unchanged.
   QUINN verified this exact package on easy with the gang cap on: dumb player 35%, easy-brain player 80%, avg 10:05-11:01.

3) FAIR END (js/moba.js, timeout end ~line 265): more structures left wins. Tie -> more kills (MB.score). Still tie -> draw:
  the existing end window with a "Draw" title (new lang.js key, en only, e.g. 'mb.draw':'Draw'). Check that nothing
  (quests, stats, check.js) assumes win/lose only.
  Mirror the bush gaps (MBLOOK.map.bush.seg in js/moba-look.js) so red's gaps are at -x of blue's.

Comments in Hebrew next to each new number (8.11, "DANA, moba-difficulty").
Add a short section to docs/moba.md "קושי: לא מתנפלים יחד (8.11.2026)" with QUINN's before/after.
Add to tools/check.js: a check that on easy at most 1 foe bot focuses MB.me while he is above 20% hp (sample a few seconds of fighting).
Verify: node tools/moba-balance.js 40 hard (blue 42-58%), plus the full check. Ask QUINN for the acceptance run
(easy-brain player: easy 70-90 / normal 45-60 / hard 25-40; dumb tower-aware on easy >= 35%).
Do not change hard numbers, MOBA.early, towers or kit stats. No journal lines, no roadmap.md edits.
Also separate, tiny: js/moba-bot.js:93 crash when a bot has no friendly minions and no friendly tower/base alive
(t undefined on the frame the base falls). Guard it (fall back to u.home).
Message MAX when checks are green.
```
