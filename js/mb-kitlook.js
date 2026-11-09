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
  const B0=LOOK3D['mb_'+u.kit];if(!B0||!m3dNeed(B0.model))return null;   // עוד נטען (m3d.js): לרגע הדמות הרגילה
  const B=typeof mbPartsLook==='function'?mbPartsLook(B0,u.kit):B0;   // חלקים של ARI (mb-parts.js): פטיש וכתר לטנק
  const ck='mbk|'+u.kit+'|'+P.weapon+'|'+M3D.hv+'|'+(B!==B0?B.sig||'p':'');if(R3D._hlk&&R3D._hlk.ck===ck)return R3D._hlk;
  const L=Object.assign({},LOOK3D.player,B);L.ck=ck;L.mbKit=u.kit;
  L.anim=Object.assign({},LOOK3D.player.anim,B.anim);
  const atk=MBKLOOK.atk[u.kit];if(atk){L.anim.sword=atk;L.anim.gun=atk;delete L.anim.gunDraw;delete L.anim.gunIdle;delete L.anim.swordIdle;delete L.anim.swordDraw}
  // syncPlayer מראה 'sword' רק עם חרב, 'shield' רק עם חרב, וכל השאר רק עם קשת: הנשק של הערכה נכנס למפתח שמתאים לסוג התקיפה שלה
  // הנשק הראשון שאינו מגן הוא הנשק; כל חלק נוסף (כתר) נכנס כ-x_<שם> ונשאר תמיד גלוי (העטיפה של syncPlayer למטה)
  L.props={};let main=false;for(const k in B.props||{}){const w=k!=='shield'&&!main;if(w)main=true;L.props[k==='shield'?'shield':w?(P.weapon==='gun'?'gun':'sword'):'x_'+k]=B.props[k]}
  MBKLOOK.stat.built++;
  return R3D._hlk=L;
}
(function(){
  if(typeof heroLook!=='function')return;
  const bh=heroLook;window.heroLook=function(){let L=null;try{L=mbKitLook()}catch(e){MBKLOOK.on=false;console.warn('mb-kitlook',e)}return L||bh.apply(this,arguments)};
  // הדרגה והשריון של השחקן שייכים לדמות שלו, לא למודל של הערכה
  if(typeof syncPlayer==='function'){const bp=syncPlayer;window.syncPlayer=function(){const r=bp.apply(this,arguments);const a=R3D.player;
    if(a&&a.L&&a.L.mbKit)for(const k in a.props)if(k.startsWith('x_'))a.props[k].visible=true;return r}}
  for(const n of ['armor3d','rankArmor3d']){const f=window[n];if(typeof f!=='function')continue;
    window[n]=function(a){if(a&&a.L&&a.L.mbKit)return;return f.apply(this,arguments)}}
})();
