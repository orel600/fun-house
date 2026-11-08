/* משחקי השאול: האייקונים המצוירים של העולם (icons/ui/skills, Creative Claw) על כפתורי הסקילים ובחלון הבחירה
   (אוראל, 3.11.2026: "תשתמש בגרפיקה של ניר מהעולם הפתוח גם לכפתורי הסקילים").
   MB_PIC: id של סקיל (או k_<ערכה>) ← שם הקובץ. אין תמונה, או שלא נטענה: נשאר ה-SVG של moba-look.js (mbSvg).
   כל ערכה בלי אותה תמונה פעמיים. סקיל חדש שנוסף ל-MBKIT מקבל שורה כאן, ובינתיים מוצג ב-SVG */
const MB_PIC={
  // הנפח
  anvil:'wQuake',taunt:'wCounter',wall:'wMountain',
  // הלוחם
  cleave:'w3',spin:'whirl',rage:'wBerserk',
  // הצייד
  pierce:'haste',net:'vines',rain:'volley',
  // הקוסמת
  wave:'spirit',bubble:'mCircle',blizzard:'mGlass',
  // הערכות (חלון הבחירה ומסך הסוף)
  k_tank:'def',k_warrior:'war',k_hunter:'hunt',k_mage:'mage',
};
const mbPicSrc=id=>MB_PIC[id]?'icons/ui/skills/'+MB_PIC[id]+'.png':'';
/* הסגנון האחיד (gicons.js, W3 8.11.2026): כש"אייקוני סקילים" על "חדש", צללית מ-game-icons בצבע --dt של הכפתור, כמו בזירה ובעולם.
   id: סקיל, k_<ערכה> או sp_<לחש> (GICO.mb). '' בקלאסי או כשאין אייקון, ואז התמונה המצוירת או ה-SVG */
const mbGi=(id,cls)=>typeof gicoOn==='function'&&gicoOn('sk')&&GICO.mb[id]?gIco(GICO.mb[id],'mbgi'+(cls?' '+cls:''),'var(--dt)'):'';
// תג "נעול עד רמה" על הסקיל-על (mbUi ב-moba.js): מנעול ומספר הרמה, במקום ספרה לבנה על האייקון. mobaHud מראה ומסתיר
const mbLockTag=lvl=>'<b class="mblock" hidden>'+gIco(GICO.ui.lock)+'<span>'+lvl+'</span></b>';
// התמונה, ומיד אחריה ה-SVG (מוסתר ב-CSS כל עוד התמונה שם). תמונה שלא נטענה מוסרת, וה-SVG חוזר
function mbPic(id,cls){
  const g=mbGi(id,cls);if(g)return g;
  const src=mbPicSrc(id),svg=mbSvg(id,cls);if(!src)return svg;
  return '<img class="mbpic'+(cls?' '+cls:'')+'" src="'+src+'" alt="" draggable="false" onerror="this.remove()">'+svg;
}
