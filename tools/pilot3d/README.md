# דף דמות מג'מיני -> דמות תלת-ממד על השלד של KayKit

הכלים של הפיילוט (30.10.2026). לא חלק מהמשחק. התוצאה: `art/pilot/PilotHero.glb`, ש-`tools/build3d.js` אורז למשחק.
התוצאות, העלות והמסקנות: הפרק "מבצע ג'מיני" ב-[docs/3d-assets.md](../../docs/3d-assets.md).

הכל חינם. Python 3 עם: `pip install gradio_client trimesh fast_simplification pygltflib scipy pillow numpy`.
מריצים מתיקייה ריקה (נוצרות בה `crops/` ו-`gen/`):

1. `python crop.py <דף הדמות.jpg> crops`: חותך מלפנים, מהצד ומאחור. מניח רקע לבן וקו קרקע בגובה 985 (לבדוק בדף חדש).
2. `python hunyuan.py`: הצורה מ-Hunyuan3D-2mv. הצבע של השרת החינמי לא עובד (נכשל, או דורש מנוי PRO), לכן:
3. `python decimate.py`: עד 5,600 משולשים.
4. `python paint.py <דף הדמות.jpg>`: הצבע. כל משולש לוקח את הצבע שלו מהזווית בדף שרואה אותו הכי טוב, והטקסטורה היא הדף עצמו (512). משולשים שאף זווית לא רואה (בתוך הגלימה, מתחת לבית השחי) מקבלים צבע של שכנים.
5. `python rig.py PilotHero.glb`: השלד של האביר בלי שום שינוי, והמשקלים (איזו עצם מזיזה כל נקודה) מועתקים מהאביר לפי הנקודה הקרובה. לכן כל האנימציות של KayKit עובדות.
6. `python animtest.py`: בדיקה בלי המשחק. מלביש ריצה, תקיפה, מוות ועידוד ושומר תמונה ב-`gen/anims.png`.

הנתיב לאביר (`C:/kk/adv`, הוא `<תיקיית Adventurers>` של build3d.js) כתוב ב-`knight.py` וב-`animtest.py`.
