/* משחקי השאול: חלקים לגיבורים (חבילת הבוקר של אוראל, 9.11.2026, משימה 5). המודלים של ARI, הרכבה כאן.
   כל גיבור שנמצא כאן מקבל חפצים על עצמות (add: עצם ומיקום, כמו props ב-LOOK3D) ומסתיר חלקים מהמודל המקורי (hide: שמות של meshes).
   הטנק (#552): פטיש האבן ביד ימין (w_item_stoneHammer, HAND_R בגודל 1) וכתר על הראש (hat_tankCrown, המיקום כבר בקובץ),
   ובמקום הגרזן והכובע הפרוותי של הברברי. המגן ביד שמאל נשאר.
   חל על הבוטים (lookOf) ועל הגיבור שלך במראה הערכה (mb-kitlook.js). רק מראה: הנזק, הגודל והפגיעות לא תלויים בזה.
   עד שהחלקים נטענים (m3dNeed, m3d.js): המראה הקודם, ואז הדמות נבנית מחדש פעם אחת.
   כיבוי לגיבור אחד: MBPARTS.<kit>.on=false, או ?parts=off לכולם. מחיקה: הקובץ והשורה ב-index.html */
const MBPARTS={
  on:!/[?&]parts=off\b/.test(location.search),
  tank:{on:true,
    add:{hammer:{prop:'w_item_stoneHammer',...HAND_R,s:1},crown:{prop:'hat_tankCrown',bone:'head',pos:[0,0,0],rot:[0,0,0,1]}},
    hide:['2H_Axe','Barbarian_Hat']},
  stat:{built:0,hidden:0,rebuilt:0}
};
const MBPARTSC={};   // המראה המורכב לכל גיבור, נבנה פעם אחת כשהחלקים מוכנים
// המראה של הגיבור עם החלקים, או B כמו שהוא (אין חלקים, כבוי, או שהם עוד נטענים)
function mbPartsLook(B,kit){
  const C=MBPARTS.on&&MBPARTS[kit];if(!B||!C||!C.on||typeof R3D==='undefined'||!R3D.on)return B;
  if(MBPARTSC[kit]&&MBPARTSC[kit].base===B)return MBPARTSC[kit];
  let ok=true;for(const k in C.add){const p=C.add[k].prop;
    if(!R3D.props[p]&&p.startsWith('hat_')&&R3D.hats&&R3D.hats[p.slice(4)])R3D.props[p]=R3D.hats[p.slice(4)];   // כובע (render3d.js שם אותם ב-R3D.hats): גם כחפץ על עצם
    if(!R3D.props[p]&&!m3dNeed(p))ok=false}   // מבקש לטעון את כולם, לא רק את הראשון
  if(!ok||Object.values(C.add).some(p=>!R3D.props[p.prop]))return B;
  const L=Object.assign({},B,{props:Object.assign({},B.props,C.add),hide:C.hide,base:B});MBPARTS.stat.built++;
  return MBPARTSC[kit]=L;
}
(function(){
  if(typeof lookOf!=='function'||typeof makeActor!=='function')return;
  const bl=lookOf;window.lookOf=function(e){const L=bl.apply(this,arguments);
    if(e&&e!==P&&typeof S!=='undefined'&&S.mb&&e.k==='hero'&&e.kit&&L===LOOK3D['mb_'+e.kit]){try{return mbPartsLook(L,e.kit)}catch(err){MBPARTS.on=false;console.warn('mb-parts',err)}}
    return L};
  // מסתירים את החלקים המקוריים כשהדמות נבנית (דמות ממאגר כבר מוסתרת: אותו מפתח, אותו מראה)
  const bm=makeActor;window.makeActor=function(L){const a=bm.apply(this,arguments);
    if(L&&L.hide)a.root.traverse(o=>{if(L.hide.includes(o.name)){o.visible=false;MBPARTS.stat.hidden++}});return a};
  // בוט שנבנה לפני שהחלקים נטענו: נבנה מחדש פעם אחת עם החלקים
  if(typeof mb3dUnit==='function'){const bu=mb3dUnit;mb3dUnit=function(e,dt){
    const a=R3D.actors.get(e);if(a&&e&&e.k==='hero'&&MBPARTS[e.kit]){const L=lookOf(e);if(L&&a.key!==lookKey(L)){freeActor(a);R3D.actors.delete(e);MBPARTS.stat.rebuilt++}}
    return bu.apply(this,arguments)}}
})();
