# דף חיה מג'מיני -> חיה בתלת-ממד על השלד של ההאסקי

כמו `tools/pilot3d` (הדמויות), אבל לחיות על ארבע. הכל חינם. Python 3 עם: `pip install gradio_client trimesh fast_simplification pygltflib scipy pillow numpy`.
השלד והאנימציות: Husky של Quaternius (CC0), ב-`C:/kk/dog/Husky.glb` (ההורדה בראש `tools/build3d.js`). מריצים מתיקייה ריקה:

0. רק בשלב עם להבות (פיוחו שלב 3): `python flames.py <דף.jpg> sheet.png <מלבנים>` מוחק את הלהבות שמחוץ לגוף. המשחק מצייר אותן חיות (pet.js).
   פיוחו 3: `flames.py piocho-3.jpg sheet.png 570,230,690,420 !1620,265,1735,420 140,870,1880,1000`
1. `python crop.py sheet.png crops`: שלוש הזוויות. הזווית מהצד: החיה מסתכלת ימינה.
2. `python ../pilot3d/hunyuan.py`: הצורה מ-Hunyuan3D-2mv (כ-90 שניות לחיה).
3. `python decimate.py 4000`: עד 4,000 משולשים. `python look.py` מצייר את הצורה מארבע זוויות (gen/look.png).
4. `python paint.py sheet.png`: הצבע מהדף.
5. `python rig.py <Piocho1.glb> [--glow]`: השלד של ההאסקי, מותאם לגוף (ההסבר בראש הקובץ). `--glow`: הסימנים הכתומים זוהרים.
6. `python dogclips.py` (פעם אחת לכל החיות): האנימציות של ההאסקי, ועוד ישיבה וחפירה. `python animtest.py C:/kk/dog/DogAnims.glb Idle,Walk,Sit,Dig` בודק בלי המשחק (gen/anims.png).

אחר כך `node tools/build3d.js C:/kk`, ושורה ב-`LOOK3D` (render3d.js) ו-`PET.kinds` (pet.js). התוצאה של פיוחו: `art/pets/piocho-anims.jpg` ו-`art/pets/piocho-ingame.jpg`.
