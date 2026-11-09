/* משחקי השאול: חלקים לגיבורים (חבילת הבוקר של אוראל, 9.11.2026, משימה 5). המודלים של ARI, הרכבה כאן.
   כל גיבור שנמצא כאן מקבל חפצים על עצמות (add: עצם ומיקום, כמו props ב-LOOK3D) ומסתיר חלקים מהמודל המקורי (hide: שמות של meshes).
   המתנקש (#556): מסכה ופגיון שני. הקוסם (#557): עטרה במקום הכובע וגביש מרחף. הלוחם: הנוצה (#558) כבויה ולא נבנתה, רק קישוט.
   הטנק (#552): פטיש האבן ביד ימין (w_item_stoneHammer, HAND_R בגודל 1) וכתר על הראש (hat_tankCrown, המיקום כבר בקובץ),
   ובמקום הגרזן והכובע הפרוותי של הברברי. המגן ביד שמאל נשאר.
   חל על הבוטים (lookOf) ועל הגיבור שלך במראה הערכה (mb-kitlook.js). רק מראה: הנזק, הגודל והפגיעות לא תלויים בזה.
   עד שהחלקים נטענים (m3dNeed, m3d.js): המראה הקודם, ואז הדמות נבנית מחדש פעם אחת.
   model: מודל אחר לגיבור (הצייד החדש, רק עם ?hunter=hf).
   כיבוי של חלק אחד: שורה ב-MBPARTS.use. של גיבור אחד: MBPARTS.<kit>.on=false. של כולם: ?parts=off. מחיקה: הקובץ והשורה ב-index.html */
const MBTANKHF={on:!/[?&]tankhf=off\b/.test(location.search)};   // הגוף החדש של הטנק (ARI #578, tankHF: אובסידיאן וזהב על השלד של הברברי). כבוי: הברברי
const MBWARHF={on:!/[?&]warhf=off\b/.test(location.search)};    // הלוחם החדש (#579, warriorHF: גלדיאטור בלי חולצה). כבוי: האביר
const MBMAGEHF={on:!/[?&]magehf=off\b/.test(location.search)};  // הקוסמת החדשה (#580, mageHF: גלימה כחולה, עם עטרה משלה). כבוי: המכשפה
const MBASNHF={on:!/[?&]asnhf=off\b/.test(location.search)};    // המתנקש החדש (#581, assassinHF: עור שחור, עם מסכה משלו). כבוי: הנוכל
const MBPARTS={
  on:!/[?&]parts=off\b/.test(location.search),
  // מתג לכל חלק בשורה אחת (MAX, 9.11: כל חלק יכול לצאת לבד). false: החלק לא מורכב, ומה שהוא מחליף נשאר
  use:{
    hammer:true,    // טנק: פטיש האבן (#552), במקום הגרזן
    crown:true,     // טנק: כתר (#552), במקום הכובע הפרוותי
    mask:true,      // מתנקש: חצי מסכה (#556)
    dagger2:true,   // מתנקש: פגיון שני ביד שמאל (#556)
    circlet:true,   // קוסם: עטרה (#557), במקום כובע המכשפה
    crystal:true    // קוסם: גביש מרחף (#557)
  },
  tank:{on:true,get model(){return MBTANKHF.on?'tankHF':null},
    add:{hammer:{prop:'w_item_stoneHammer',...HAND_R,s:1,hide:'2H_Axe'},crown:{prop:'hat_tankCrown',bone:'head',pos:[0,0,0],rot:[0,0,0,1],hide:'Barbarian_Hat'}}},
  warrior:{on:true,get model(){return MBWARHF.on?'warriorHF':null},add:{}},
  assassin:{on:true,get model(){return MBASNHF.on?'assassinHF':null},   // #556: חצי מסכה עם חריצים זוהרים, ופגיון שני ביד שמאל (לילך, זוהר משלו)
    add:{mask:{skip:()=>MBASNHF.on,prop:'hat_assassinMask',bone:'head',pos:[0,0,0],rot:[0,0,0,1]},dagger2:{prop:'w_item_shadowDagger',bone:'handslotl',pos:[0,0.033,0],rot:[0,0,0,1],s:1}}},
  mage:{on:true,get model(){return MBMAGEHF.on?'mageHF':null},   // #557: עטרה במקום כובע המכשפה, וגביש שמרחף מעל יד שמאל ועולה ויורד (bob, ביחידות של העצם)
    add:{circlet:{skip:()=>MBMAGEHF.on,prop:'hat_mageCirclet',bone:'head',pos:[0,0,0],rot:[0,0,0,1],hide:'Mage_Hat'},crystal:{prop:'w_item_mageCrystal',bone:'handslotl',pos:[0,0.42,0],rot:[0,0,0,1],bob:{amp:0.05,rate:0.6}}}},
  hunter:{on:/[?&]hunter=hf\b/.test(location.search),model:'hunterHF',add:{}},   // הצייד החדש של ARI (#555): רק כשמבקשים, ?hunter=hf. אותו שלד (Ranger), אותם קליפים והקשת
  stat:{built:0,hidden:0,rebuilt:0}
};
const MBPARTSC={};   // המראה המורכב לכל גיבור, נבנה פעם אחת כשהחלקים מוכנים
// המראה של הגיבור עם החלקים, או B כמו שהוא (אין חלקים, כבוי, או שהם עוד נטענים)
function mbPartsLook(B,kit){
  const C=MBPARTS.on&&MBPARTS[kit];if(!B||!C||!C.on||typeof R3D==='undefined'||!R3D.on)return B;
  const add={};for(const k in C.add)if(MBPARTS.use[k]!==false&&!(C.add[k].skip&&C.add[k].skip()))add[k]=C.add[k];const sig=Object.keys(add).join()+'|'+(C.model||'');   // רק החלקים שדולקים   // skip: הגוף החדש כבר כולל את החלק (מסכה, עטרה)
  if(!C.model&&!Object.keys(add).length)return B;
  if(MBPARTSC[kit]&&MBPARTSC[kit].base===B&&MBPARTSC[kit].sig===sig)return MBPARTSC[kit];
  let ok=!C.model||m3dNeed(C.model);for(const k in add){const p=add[k].prop;
    if(!R3D.props[p]&&p.startsWith('hat_')&&R3D.hats&&R3D.hats[p.slice(4)])R3D.props[p]=R3D.hats[p.slice(4)];   // כובע (render3d.js שם אותם ב-R3D.hats): גם כחפץ על עצם
    if(!R3D.props[p]&&!m3dNeed(p))ok=false}   // מבקש לטעון את כולם, לא רק את הראשון
  if(!ok||Object.values(add).some(p=>!R3D.props[p.prop]))return B;
  const hide=Object.values(add).map(p=>p.hide).filter(Boolean);   // כל חלק מסתיר רק את מה שהוא מחליף
  const L=Object.assign({},B,{props:Object.assign({},B.props,add),hide,base:B,sig},C.model?{model:C.model}:{});MBPARTS.stat.built++;
  return MBPARTSC[kit]=L;
}
(function(){
  if(typeof lookOf!=='function'||typeof makeActor!=='function')return;
  const bl=lookOf;window.lookOf=function(e){const L=bl.apply(this,arguments);
    if(e&&e!==P&&typeof S!=='undefined'&&S.mb&&e.k==='hero'&&e.kit&&L===LOOK3D['mb_'+e.kit]){try{return mbPartsLook(L,e.kit)}catch(err){MBPARTS.on=false;console.warn('mb-parts',err)}}
    return L};
  // מסתירים את החלקים המקוריים כשהדמות נבנית (דמות ממאגר כבר מוסתרת: אותו מפתח, אותו מראה)
  const bm=makeActor;window.makeActor=function(L){const a=bm.apply(this,arguments);
    if(L&&L.hide)a.root.traverse(o=>{if(L.hide.includes(o.name)){o.visible=false;MBPARTS.stat.hidden++}});
    if(L&&L.props){a.bob=null;for(const k in L.props){const b=L.props[k].bob;if(b&&a.props[k])(a.bob||(a.bob=[])).push({m:a.props[k],y:a.props[k].position.y,b})}}
    return a};
  // חלק מרחף (הגביש של הקוסם) עולה ויורד. בהפחתת תנועה: עומד
  const bob=a=>{if(!a||!a.bob)return;const calm=typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM,t=typeof MB!=='undefined'&&MB?MB.t:0;
    for(const o of a.bob)o.m.position.y=o.y+(calm?0:Math.sin(t*o.b.rate*Math.PI*2)*o.b.amp)};
  if(typeof syncPlayer==='function'){const bp=syncPlayer;window.syncPlayer=function(){const r=bp.apply(this,arguments);if(S.mb)bob(R3D.player);return r}}
  // בוט שנבנה לפני שהחלקים נטענו: נבנה מחדש פעם אחת עם החלקים
  if(typeof mb3dUnit==='function'){const bu=mb3dUnit;mb3dUnit=function(e,dt){
    const a=R3D.actors.get(e);if(a&&e&&e.k==='hero'&&MBPARTS[e.kit]){const L=lookOf(e);if(L&&a.key!==lookKey(L)){freeActor(a);R3D.actors.delete(e);MBPARTS.stat.rebuilt++}}
    const r=bu.apply(this,arguments);bob(R3D.actors.get(e));return r}}
})();
