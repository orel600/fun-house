/* משחקי השאול: בדיקת הפרדת ערכים בין הדמויות לרצפה (MBFLOOR, השיפוץ, MAX ל-BOB, 10.11.2026). רק בענף overhaul/preview.
   ?mbfloor=current|quiet|quiet2 מחליף את הפלטה של רצפת האבן (MBLOOK.floor3d, moba3d.js בונה ממנה את הרצפה). בלי הדגל: pick.
   quiet ו-quiet2: "אובסידיאן שקט, בהיר וניטרלי יותר" (הכיוון של השיפוץ): פחות סגול ורוויה, בהיר יותר, רונות וגחלים עמומים, כדי שהגיבורים יבלטו.
   הבחירה לפי מספר (tools של BOB: ΔL* בין כל פיקסל של דמות לרצפה שמאחוריו, מהמצלמה של המשחק). רק צבע: שום דבר במשחק לא משתנה.
   מחיקה: הקובץ והשורה ב-index.html */
const MBFLOOR={
  // נמדד (BOB, 10.11, מצלמת המשחק, 3D, שני משחקים): כל הגיבורים בהירים מהרצפה (L* 39-95 מול כ-24 מאחוריהם), אז רצפה בהירה מקטינה את ההפרדה.
  // ΔL* גיבורים: deep 27.5/44.3, current 26.5/43.5, quiet 26.7/43.0, quiet2 25.3/41.2. ההבדל קטן: הצללים והסימנים מאחורי הדמויות קובעים יותר מהפלטה
  pick:'deep',
  pals:{
    current:null,   // כמו שהיה (MBLOOK.floor3d)
    quiet:{stone:'#6e6a74',stone2:'#615d68',dark:'#4a4651',mortar:'#2e2b33',crack:'#211f26',rune:'#9C8A5A',ember:'#b0603a',out:'#141218'},
    deep:{stone:'#4c4851',stone2:'#433f48',dark:'#322e37',mortar:'#1e1b22',crack:'#141217',rune:'#8A7A50',ember:'#9a5232',out:'#0c0b0e'},   // השוואה: אותו ניטרלי, כהה יותר
    quiet2:{stone:'#85818b',stone2:'#78747e',dark:'#5d5964',mortar:'#3a3740',crack:'#2a2830',rune:'#A89466',ember:'#a86a48',out:'#1a181e'}
  },
  on:''
};
(function(){
  if(typeof MBLOOK==='undefined')return;
  const q=(location.search.match(/[?&]mbfloor=([a-z0-9]+)/)||[])[1],k=q&&q in MBFLOOR.pals?q:MBFLOOR.pick;
  MBFLOOR.base=MBLOOK.floor3d;MBFLOOR.on=k;
  if(MBFLOOR.pals[k])MBLOOK.floor3d=Object.assign({},MBLOOK.floor3d,MBFLOOR.pals[k]);
})();
