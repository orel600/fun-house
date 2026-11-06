# פריטים משלנו ב-Blender מקוד

Claude כותב סקריפט Python ש-Blender מריץ בלי ממשק: הפריט נבנה מצורות פשוטות (צינור, גליל, גביש, כוכב), נצבע מהפלטה בסגנון KayKit, ויוצא כקובץ GLB. ככה נבנו קשת השמיים ומטה הכוכבים (6.11.2026), אחרי ש-TRELLIS נכשל בהם. המחקר שהוביל לזה נמצא בענף research/own-models, בקובץ `docs/research-own-models.md`.

## איך בונים פריט חדש
1. **התקנה בסשן** (כדקה): `apt-get update && apt-get install -y blender python3-numpy`.
2. **פונקציה ב-`build_weapons.py`** שבונה את הצורות, ושורה `build('<id>',<פונקציה>)` בסוף. ה-`<id>` הוא המפתח של הפריט ב-`GEAR.items` (gear.js).
   - **צירים כמו KayKit, הידית בראשית:** קשת שוכבת על x, והמיתר לכיוון +y של Blender. מטה, חרב ופטיש זקופים על z. הצורות והגדלים של KayKit כתובים ב-`ITEMS` (tools/build3d.js).
   - **צבע:** `part(..., '<עמודה>')` בוחר עמודה ב-`palette_weapons.png`, בהיר למעלה וכהה למטה. `vf` קובע איפה בעמודה, למשל כהה ליד הידית ובהיר בקצה. העמודות `glowc`, `glowy` ו-`pink` זוהרות (`palette_weapons_glow.png`). עמודה חדשה נכנסת ל-`make_palette.py`.
   - **מעט פוליגונים:** עד כ-1,000 משולשים. הסקריפט מדפיס כמה יצאו.
3. **בנייה:** `blender -b --python tools/blender/build_weapons.py -- tools/blender art/weapons/raw`
4. **למשחק:** שורה ב-`ITEMS` (tools/build3d.js) עם `ready:true`, ואז `node tools/build3d.js - --only items --items=<id>`. החבילות מהשורה 17 שם מותקנות עם NODE_PATH. render3d.js מעדיף את `w_item_<id>` על `look.model`, אז לא צריך לשנות את gear.js. פריט אגדי פועם לבד, בחלקים הזוהרים.
5. **צילום לבדיקה:** `node tools/blender/shoot.js art/weapons/raw <תמונה.png>`. מה מצולם נקבע ב-ROWS ב-`preview.html`: הפריט, אחיזה כמו `GRIP3D` ב-render3d.js, והשוואה ל-KayKit.
