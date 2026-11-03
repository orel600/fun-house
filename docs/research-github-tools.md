# כלים מ-GitHub שיכולים לעזור למשחק (מחקר, 3.11.2026)

ניר ביקש: "תחפש בגיטהאב את הריפו הכי פופולריים, כלים שימושיים שיכולים לעזור ולשפר".
חיפוש לפי כוכבים (⭐ = כמה אנשים סימנו). רק כלים שמתאימים למשחק שלנו: בלי שרת, בלי שלב בנייה, עובד מ-`file://`, three.js r186, טלפון.
**שום דבר לא נבנה.** זה חומר לסבב התכנון הבא (כלל 15).

## ⭐ הכי משתלם עכשיו (מתחבר לרעיונות שבתיבה)

| כלי | ⭐ | מה זה נותן לנו | מתחבר ל |
|---|---|---|---|
| [three.quarks](https://github.com/Alchemist0823/three.quarks) | 1.2K | מנוע חלקיקים ואפקטים ל-three.js: אש, עשן, ניצוצות, זנבות. יש עורך אפקטים בדפדפן, ומייצאים קובץ | סבב "כל הסקילים יפים", המטאור, האש של פיוחו |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) | 2.9K | זוהר (bloom), צבעוניות וחדות על כל המשחק, מהיר יותר מזה של three.js | סעיף 2 בתוכנית האפקטים (זוהר) |
| [ZzFX](https://github.com/KilledByAPixel/ZzFX) | 808 | צלילי אפקט מנוסחה קצרה, בלי קבצים. יש מחולל בדפדפן. כמעט אפס משקל | צליל לכל סקיל בלי לבזבז קרדיטים של Creative Claw |
| [stats.js](https://github.com/mrdoob/stats.js) | 9.2K | מונה FPS וזיכרון קטן בפינה | "סיכון ביצועים" בתוכנית האפקטים (כבר יש js/perf.js, לבדוק אם מספיק) |

## 🛠️ כלים לעבודה של Claude (לא נכנסים למשחק)

| כלי | ⭐ | מה זה נותן |
|---|---|---|
| [pixelmatch](https://github.com/mapbox/pixelmatch) | 7K | משווה שני צילומי מסך ומסמן מה השתנה. הבוט יוכל לתפוס לבד "הציור נשבר" |
| [meshoptimizer / gltfpack](https://github.com/zeux/meshoptimizer) | 8.8K | מקטין מודלים תלת-ממדיים פי כמה. טעינה מהירה יותר בטלפון. ה-bundle שלנו כבר יודע לקרוא את זה |
| [glTF-Transform](https://github.com/donmccurdy/glTF-Transform) | 2K | אותו רעיון, ובנוסף מאחד ומנקה מודלים של KayKit |
| [tweakpane](https://github.com/cocopon/tweakpane) / [lil-gui](https://github.com/georgealways/lil-gui) | 4.6K / 1.6K | חלון מחוונים לכיוון מספרים בזמן משחק (מהירות, נזק, צבע אפקט), רק במצב פיתוח |
| [Spector.js](https://github.com/BabylonJS/Spector.js) | 1.6K | בודק מה כבד בציור התלת-ממדי, כשהטלפון מאט |

## 🎮 למכניקות עתידיות (רק אם יוחלט)

| כלי | ⭐ | מתי צריך |
|---|---|---|
| [yuka](https://github.com/Mugen87/yuka) | 1.5K | אויבים חכמים: מקיפים, בורחים, עובדים בקבוצה. מתאים לבוס שלומד |
| [recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js) | 435 | אויבים שמוצאים דרך מסביב למבנים בעולם הפתוח |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) / [instanced-mesh](https://github.com/agargaro/instanced-mesh) | 3.5K / 459 | הרבה עצים, סלעים ואויבים על המסך בלי להאט |
| [simplex-noise](https://github.com/jwagner/simplex-noise.js) | 1.9K | שטח ומפות שנוצרים לבד (עולם פתוח גדול) |
| [GSAP](https://github.com/greensock/GSAP) | 30K | אנימציות חלקות לחלונות ולכרטיסים ("חלונות פריטים מרשימים") |

## 📦 נכסים ורעיונות

- [open-source-3D-assets](https://github.com/ToxSam/open-source-3D-assets) (174⭐): קטלוג של כ-1,000 מודלים חינמיים (CC0).
- [magictools](https://github.com/ellisonleao/magictools) (17.7K⭐): הרשימה הגדולה של כלי פיתוח משחקים.
- [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) (6.7K⭐): 77 "סקילים" ל-Claude לפיתוח משחקים, כולל three.js. כדאי לעבור ולקחת רק מה שמתאים לנו.
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) (57K⭐): כלים לשיפור העבודה עם Claude עצמו.

## ❌ נבדק ולא מתאים

- מנועי משחק שלמים (Phaser, melonJS, LittleJS, PlayCanvas): נצטרך לכתוב הכל מחדש.
- מנועי פיזיקה (matter-js, rapier): כבדים, ואין לנו צורך בפיזיקה אמיתית.
- ספריות WebGPU/TSL: לא כל הטלפונים תומכים עדיין.
- nipplejs (ג'ויסטיק): כבר יש לנו.

## 🔒 בדיקת אבטחה (3.11.2026, ניר ביקש)

נבדק לכל ספרייה: בעלים, גיל, רישיון, מי מפרסם ב-npm, סקריפטים שרצים בהתקנה, ומאגר החולשות הציבורי OSV.
- **כל 18 ספריות הקוד: נקי.** כולן בנות 2 עד 16 שנה, ברישיון פתוח (MIT/ISC/Zlib), ומי שמפרסם ב-npm הוא היוצר של הריפו (או GitHub Actions עם חתימה, ב-postprocessing וב-recast). לאף אחת אין סקריפט שרץ בהתקנה, שזו הדרך הנפוצה להחדרת קוד זדוני.
- **חולשות ידועות:** רק ישנות שתוקנו מזמן: GSAP לפני 3.6 (היום 3.15), three.js לפני r125 (אצלנו r186). אין חולשה פתוחה.
- **⚠️ זהירות: ריפו של "סקילים" ל-Claude** (awesome-gamedev-agent-skills, ורשימות awesome-claude-code). סקיל רץ עם ההרשאות של Claude ויכול להכיל הוראות נסתרות. הריפו של הסקילים חדש (יוני 2026) וצבר 6.7K כוכבים בארבעה חודשים, וזה מהיר באופן חשוד. **לא מתקינים ממנו כלום כמו שהוא.** אם משהו מעניין, Claude קורא את הקובץ הספציפי במלואו ומעתיק רק את הרעיון.
- **open-source-3D-assets:** מודלים בלבד (לא קוד), אז הסיכון נמוך. אבל הרישיון לא אחיד, ובודקים כל מודל לפני שימוש.

**כללים כשמכניסים ספרייה:** גרסה מדויקת שפורסמה לפני שבועיים לפחות (לא "האחרונה": three-mesh-bvh, למשל, פורסמה היום). הקובץ נשמר בריפו ב-`js/vendor/` ולא נטען מהאינטרנט בזמן משחק, כך שאף אחד מבחוץ לא יכול להחליף אותו. כל עדכון גרסה עובר דרך PR.

## איך מכניסים ספרייה (כשיוחלט)

אין `import` ואין שלב בנייה, אז כל ספרייה נכנסת כמו three.js: קובץ אחד ב-`js/vendor/` שנבנה ב-`tools/build3d.js`, עם שורת רישיון (כולן כאן MIT, חוץ מ-GSAP שחינמי אבל ברישיון משלו).
