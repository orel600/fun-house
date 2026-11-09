/* משחקי השאול: הגיבור שלך נראה כמו הערכה שבחרת (חבילת הבוקר של אוראל, 9.11.2026: "הטנק שלי צריך להיראות כמו טנק").
   עד היום השחקן בשאול הופיע בדמות האישית שלו (heroLook), ורק הבוטים קיבלו את המודל של הערכה (LOOK3D.mb_<kit>).
   עכשיו גם אתה: אותו מודל, אותו גובה ואותו נשק כמו הבוט של אותה ערכה. רק מראה, שום דבר במשחק לא משתנה.
   האפשרות להישאר בדמות האישית: SAVE.mbOwnLook=true, או ?kitlook=off בכתובת.
   מה לא משתנה: הדרגה והשריון של השחקן לא נצבעים על המודל של הערכה (הוא נשאר כמו הבוט), ומחוץ לשאול הכל כמו קודם.
   חיבור: עוטף את heroLook (render3d.js), ואת armor3d ו-rankArmor3d רק לדמות של הערכה. מחיקה: הקובץ והשורה ב-index.html */
const MBKLOOK={
  on:!/[?&]kitlook=off\b/.test(location.search),
  atk:typeof MBMOVE!=='undefined'?Object.assign({},MBMOVE.atk):{},   // תנועת התקיפה של כל ערכה, כמו אצל הבוט (נלקח לפני ש-mb-atk3d.js מחליף את של הטנק)
  stat:{built:0}
};
const mbLookOwn=()=>typeof SAVE!=='undefined'&&SAVE&&SAVE.mbOwnLook===true;
function mbKitLook(){
  const u=typeof S!=='undefined'&&S.mb&&typeof MB!=='undefined'&&MB&&MB.me;if(!u||!MBKLOOK.on||mbLookOwn())return null;
  const B=LOOK3D['mb_'+u.kit];if(!B||!m3dNeed(B.model))return null;   // עוד נטען (m3d.js): לרגע הדמות הרגילה
  const ck='mbk|'+u.kit+'|'+P.weapon+'|'+M3D.hv;if(R3D._hlk&&R3D._hlk.ck===ck)return R3D._hlk;
  const L=Object.assign({},LOOK3D.player,B);L.ck=ck;L.mbKit=u.kit;
  L.anim=Object.assign({},LOOK3D.player.anim,B.anim);
  const atk=MBKLOOK.atk[u.kit];if(atk){L.anim.sword=atk;L.anim.gun=atk;delete L.anim.gunDraw;delete L.anim.gunIdle;delete L.anim.swordIdle;delete L.anim.swordDraw}
  // syncPlayer מראה 'sword' רק עם חרב, 'shield' רק עם חרב, וכל השאר רק עם קשת: הנשק של הערכה נכנס למפתח שמתאים לסוג התקיפה שלה
  L.props={};for(const k in B.props||{})L.props[k==='shield'?'shield':P.weapon==='gun'?'gun':'sword']=B.props[k];
  MBKLOOK.stat.built++;
  return R3D._hlk=L;
}
(function(){
  if(typeof heroLook!=='function')return;
  const bh=heroLook;window.heroLook=function(){let L=null;try{L=mbKitLook()}catch(e){MBKLOOK.on=false;console.warn('mb-kitlook',e)}return L||bh.apply(this,arguments)};
  // הדרגה והשריון של השחקן שייכים לדמות שלו, לא למודל של הערכה
  for(const n of ['armor3d','rankArmor3d']){const f=window[n];if(typeof f!=='function')continue;
    window[n]=function(a){if(a&&a.L&&a.L.mbKit)return;return f.apply(this,arguments)}}
})();
