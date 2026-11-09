/* שמיים מצוירים מאחורי הזירה (חבילת התיקונים של אוראל, 9.11.2026, שכבה A). הזירה של אוראל.
   המצלמה בזירה מסתכלת מלמעלה בזווית ולא רואה את האופק, והרצפה (R3D.ground עם הצבע של arena-look.js) מילאה כל פיקסל,
   גם מעבר לשפת העץ. לכן: מעבר לשפה הרצפה לא מצוירת (aSky בצבע של arena-look.js), ומאחוריה מלבן שמיים צמוד למצלמה,
   כך שהזירה נראית כמו במה שמרחפת בשמיים המצוירים. הרצפה שמשחקים עליה, השפה, הלפידים והתאורה לא משתנים.
   תמונה לכל פלטה (ARENA_SKY.map, הנתונים ב-backdrop-data.js של ARI). זירת הבוסים: בלי תמונה, הצבע השטוח כמו קודם.
   כבוי ב"פחות אפקטים" ובהפחתת תנועה (הצבע השטוח), ותמיד מחוץ לזירה: לא בשאול, לא בעולם, לא בכפר ולא בחדר הבונוס.
   מתג אחד: ARENA_SKY.on, או ?sky=off בכתובת. אם זה לא נראה טוב: חלופה (b) ב-PR, רצועת רקע מאחורי הקיר הצפוני.
   חיבור: עוטף את aLookColors (arena-look.js), שנקרא מ-render3d.js בכל פריים אחרי צבע הרקע */
const ARENA_SKY={
  on:!/[?&]sky=off\b/.test(location.search),
  map:{gauntlet:'classic',classic:'classic',waves:'waves',maze:'dimension'},   // gauntlet: הזירה האמיתית מאז האיחוד (arenas.js, S.arena תמיד 'gauntlet'). הרצפה שלה בפלטה classic (aLookPal), אז גם השמיים. QUINN מצא, 9.11   // פלטה (S.arena) → תמונה. בלי שורה: הצבע השטוח
  dim:{dimension:0.52},   // תמונה בהירה מדי מוכפלת (ARI מדד: dimension בערך פי 2.5 מהשתיים האחרות)
  edge:1050,     // מאיזה רדיוס בזירה לא מציירים רצפה (שפת העץ נגמרת ב-1030, arena-look.js border.planks)
  stat:{shown:0}
};
const ASKY={tex:{},quad:null,cur:null};
// התמונה של הפלטה, נטענת פעם אחת (מ-data URI, ולכן עובד גם ב-file://)
function askyTex(n){
  if(ASKY.tex[n])return ASKY.tex[n];
  if(typeof BACKDROP==='undefined'||!BACKDROP[n])return null;
  const t=new THREE.TextureLoader().load(BACKDROP[n]);if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;
  return ASKY.tex[n]=t;
}
function askyQuad(){
  if(ASKY.quad)return ASKY.quad;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({depthTest:false,depthWrite:false,fog:false,toneMapped:false}));
  m.renderOrder=-1000;m.frustumCulled=false;m.visible=false;
  const c=R3D.cam;if(!c.parent)R3D.scene.add(c);c.add(m);
  return ASKY.quad=m;
}
const askyName=()=>{
  if(!ARENA_SKY.on||typeof R3D==='undefined'||!R3D.on||!R3D.ready||!S)return null;
  if(S.mb||S.wd||S.vil||S.room||typeof aLookHere!=='function'||!aLookHere())return null;
  if((typeof fxLess==='function'&&fxLess())||(typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM))return null;
  return ARENA_SKY.map[S.arena]||null;
};
// כל פריים: איזו תמונה, גודל המלבן לפי המסך (cover), והרצפה לא מצוירת מעבר לשפה רק כשהתמונה באמת מוכנה
function askySync(){
  const n=askyName(),t=n&&askyTex(n),ok=!!(t&&t.image&&t.image.width);
  const u=typeof ALOOK!=='undefined'&&ALOOK.mat&&ALOOK.mat.userData.u;
  if(u&&u.aSky)u.aSky.value=ok?ARENA_SKY.edge:0;
  if(!ok){if(ASKY.quad)ASKY.quad.visible=false;ASKY.cur=null;return}
  const q=askyQuad(),c=R3D.cam,w=c.right-c.left,h=c.top-c.bottom,iw=t.image.width,ih=t.image.height,k=Math.max(w/iw,h/ih);
  if(q.material.map!==t){q.material.map=t;q.material.color.setScalar(ARENA_SKY.dim[n]||1);q.material.needsUpdate=true}
  q.scale.set(iw*k,ih*k,1);q.position.set(0,0,-(c.far*0.98));q.visible=true;
  if(ASKY.cur!==n){ASKY.cur=n;ARENA_SKY.stat.shown++}
}
(function(){
  const o=window.aLookColors;window.aLookColors=function(){const r=o?o.apply(this,arguments):undefined;try{askySync()}catch(e){ARENA_SKY.on=false;ARENA_SKY.stat.err=String(e&&e.message||e);console.warn('arena-sky',e)}return r};
})();
