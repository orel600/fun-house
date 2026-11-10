/* הכפר כולו גדל עם רמת המרכז (ניר, 10.11.2026, docs/concept-village-growth-2.md, אושר).
   L1 מחנה, L3 כפר עם גדר עץ, בתים, באר ודוכנים, L5 עיירה עם חומת אבן, מגדלים, טחנה, כנסייה ומזרקה באמצע הכיכר.
   הגבול גדל (VGROW.radius, דרך VILLAGE.radius ב-village.js), והשער זז איתו. מבנה שעוד לא נבנה: חלקת עפר במקום פיגום.
   הרמה שמוצגת (vgLv) היא של המרכז, אבל בזמן רגע הבנייה של המרכז (buildmoment.js) עדיין הישנה עד שהחדש קופץ, ואז הכל נבנה מחדש.
   החומה והגדר: עשרות חתיכות זהות בציור אחד (InstancedMesh). המודלים vx_ נטענים רק כשצריך (m3d.js).
   חיבור: VILLAGE.radius ו-VILLAGE.gate ב-village.js, at ב-VILLAGE.props (props3d.js), vgBlock ב-villageUpdate, plot ב-syncVillage (render3d.js).
   עוטף מבחוץ את syncVillage (בנייה מחדש כשהרמה מתחלפת, והתוספות) */
const VGROW={
  radius:[620,620,660,700,750,800],   // גבול הכפר לפי רמת המרכז (היה 700 קבוע). מבנים רחוקים עד 631 מהמרכז, אז לא פחות מ-620
  // תוספות: m מודל, x/y מקום, w רוחב, at מאיזו רמה, to עד איזו רמה (כולל). r סיבוב. block: רדיוס שאי אפשר לעבור דרכו
  items:[
    // בתים: ירוק (עץ) ב-L2-3, כחול ב-L4, אדום ב-L5
    {m:'vx_homeAG',x:-235,y:-440,w:80,at:2,to:3},{m:'vx_homeAB',x:-235,y:-440,w:84,at:4,to:4},{m:'vx_homeAR',x:-235,y:-440,w:88,at:5},
    {m:'vx_homeAG',x:235,y:-440,w:80,at:3,to:3},{m:'vx_homeAB',x:235,y:-440,w:84,at:4,to:4},{m:'vx_homeAR',x:235,y:-440,w:88,at:5},
    {m:'vx_homeAG',x:-210,y:560,w:80,at:3,to:3},{m:'vx_homeAB',x:-210,y:560,w:84,at:4},
    {m:'vx_homeAG',x:200,y:560,w:80,at:3,to:4},{m:'vx_homeAR',x:200,y:560,w:88,at:5},
    {m:'vx_homeBB',x:-560,y:300,w:95,at:4},{m:'vx_homeBR',x:600,y:-100,w:95,at:5},{m:'vx_homeAB',x:-610,y:-110,w:85,at:5},
    {m:'vx_homeAR',x:560,y:330,w:85,at:4},{m:'vx_homeAG',x:120,y:-600,w:80,at:5},
    // הכיכר: באר מ-L2, דוכנים מ-L3, מזרקה ב-L5 (נבנית בקוד, vgFountain)
    {m:'vx_well',x:-185,y:-150,w:52,at:2,block:24},
    {m:'v_tent',x:195,y:-150,w:58,at:3,r:-0.5,block:24},{m:'v_crate',x:235,y:-115,w:24,at:3},{m:'vx_sack',x:160,y:-110,w:20,at:3},
    {m:'v_tent',x:-200,y:20,w:58,at:4,r:0.5,block:24},{m:'v_barrel',x:-165,y:50,w:22,at:4},
    {m:'fountain',x:0,y:-80,w:70,at:5,block:40},
    // שדות, טחנה, כנסייה
    {m:'vx_grain',x:-620,y:-300,w:110,at:4},{m:'vx_grain',x:640,y:-310,w:110,at:4},
    {m:'vx_windmill',x:500,y:470,w:120,at:5,block:50},{m:'vx_church',x:-310,y:-570,w:115,at:5,block:50},
    // דגלים לאורך הדרך מהשער
    {m:'vx_flagR',x:-55,y:300,w:40,at:5},{m:'vx_flagR',x:55,y:300,w:40,at:5},{m:'vx_flagR',x:-55,y:500,w:40,at:5},{m:'vx_flagR',x:55,y:500,w:40,at:5},
    {m:'v_flag',x:-60,y:620,w:42,at:3,to:4},{m:'v_flag',x:60,y:620,w:42,at:3,to:4}
  ],
  // הגבול: גדר עץ ב-L3-4, חומת אבן עם מגדלים ב-L5. seg: רוחב חתיכה. gap: חצי הרוחב של הפתח מול השער (רדיאנים)
  ring:{3:{m:'vx_fenceW',seg:52,gap:0.09},4:{m:'vx_fenceW',seg:52,gap:0.09},5:{m:'vx_wall',seg:105,gap:0.085,tower:'vx_towerAB',towerW:80,towers:[-2.6,-1.75,-0.95,-0.2,0.7,2.45]}},
  ringIn:10,      // כמה פנימה מהגבול הטבעת עומדת
  // מבט על כשהמרכז עולה רמה (buildmoment.js): כמה תוספות חדשות מקבלות ניצוץ
  spark:4
};
// הרמה שמוצגת עכשיו (בזמן רגע הבנייה של המרכז: הישנה, עד שהחדש קופץ)
function vgLv(){
  const m=typeof S!=='undefined'&&S&&S.vil&&S.vil.bm;
  if(m&&m.k==='center'&&typeof bmPhase==='function'){const n=bmPhase(m).n;if(n==='pan'||n==='sink'||n==='rise')return Math.max(1,m.from)}
  return Math.max(1,typeof SAVE!=='undefined'&&SAVE&&SAVE.village?SAVE.village.center||1:1);
}
const vgOn=(it,L)=>L>=it.at&&(!it.to||L<=it.to);
// לא נכנסים לבאר, לדוכן, למזרקה, לטחנה ולכנסייה (מ-villageUpdate)
function vgBlock(P){const L=vgLv();for(const it of VGROW.items){if(!it.block||!vgOn(it,L)||!vgFree(it))continue;const dx=P.x-it.x,dy=P.y-it.y,d=Math.hypot(dx,dy)||1,min=it.block+P.r;if(d<min){P.x=it.x+dx/d*min;P.y=it.y+dy/d*min}}}
// לחנות הקישוטים (deco.js): לא מעמידים קישוט על בית או באר
// כל התוספות מכל הרמות, כדי שהמקומות לא ישתנו כשהכפר גדל
const vgDots=near=>VGROW.items.map(it=>[it.x,it.y,it.w/2+near]);
// קישוט ששחקן כבר הציב (שמירה ישנה) במקום של תוספת: התוספת מוותרת, הקישוט שלו נשאר
const vgFree=it=>{const P_=typeof decoSave==='function'&&SAVE?(decoSave().put||[]):[];return !P_.some(p=>Math.hypot(p.x-it.x,p.y-it.y)<it.w/2+20)};
// התוספות שנוספו בדיוק ברמה L (לניצוץ במבט העל)
const vgNew=L=>VGROW.items.filter(it=>it.at===L);

/* ---- תלת-ממד ---- */
// מזרקה: אגן אבן, עמוד, וקערת מים (בקוד, כמו הפנסים ב-props3d.js)
function vgFountain(x,y,w,g){
  const C=PROPS3D.col,grp=new THREE.Group(),r=w/2;
  p3Mesh(p3Cyl(r,r*1.05,9,14),p3Mat(C.stone),0,4.5,0,grp);
  p3Mesh(p3Cyl(r*0.86,r*0.86,1.5,14),new THREE.MeshLambertMaterial({color:'#5aa8d8'}),0,9.2,0,grp);
  p3Mesh(p3Cyl(4,5,26,8),p3Mat(C.stoneDark),0,13,0,grp);
  p3Mesh(p3Cyl(r*0.32,r*0.2,4,10),p3Mat(C.stone),0,26,0,grp);
  p3Mesh(p3Cyl(r*0.26,r*0.26,1,10),new THREE.MeshLambertMaterial({color:'#7cc4ee'}),0,28,0,grp);
  return p3At(grp,x,y,g);
}
// טבעת של חתיכות זהות בציור אחד לכל חלק במודל
function vgRing(spec,R,g){
  const t=R3D.props[spec.m];if(!t)return;
  const bb=t.userData.bb||(t.userData.bb=new THREE.Box3().setFromObject(t)),s=spec.seg/Math.max(bb.max.x-bb.min.x,1e-3);
  const at=[],n=Math.round(2*Math.PI*R/spec.seg);
  for(let i=0;i<n;i++){const a=(i+0.5)/n*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-Math.PI/2),Math.cos(a-Math.PI/2)))<spec.gap)continue;at.push(a)}
  t.updateMatrixWorld(true);const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Y=new THREE.Vector3(0,1,0);
  t.traverse(o=>{if(!o.isMesh)return;
    const im=new THREE.InstancedMesh(o.geometry,o.material,at.length);im.frustumCulled=false;
    at.forEach((a,i)=>{const x=Math.cos(a)*R,y=Math.sin(a)*R,rot=Math.atan2(-Math.cos(a)/SIN(),-Math.sin(a));
      Q.setFromAxisAngle(Y,rot);M.compose(new THREE.Vector3(x,-bb.min.y*s,y/SIN()),Q,new THREE.Vector3(s,s,s)).multiply(o.matrixWorld);im.setMatrixAt(i,M)});
    g.add(im)});
}
// כל התוספות לרמה L. מודל שעוד נטען: בפעם הבאה (V.vgKey לא מתעדכן עד שהכל שם)
function vgBuild(V,L){
  const need=[...VGROW.items.filter(it=>vgOn(it,L)&&it.m!=='fountain').map(it=>it.m)];
  const rg=VGROW.ring[L];if(rg){need.push(rg.m);if(rg.tower)need.push(rg.tower)}
  if(typeof m3dNeed==='function'&&!need.every(m3dNeed))return false;
  if(V.vg)V.g.remove(V.vg);V.vg=new THREE.Group();V.g.add(V.vg);
  for(const it of VGROW.items){if(!vgOn(it,L)||!vgFree(it))continue;
    if(it.m==='fountain')vgFountain(it.x,it.y,it.w,V.vg);else if(R3D.props[it.m])vPut(it.m,it.x,it.y,it.w,it.r||hash(it.x,it.y)*0.6-0.3,V.vg)}
  if(rg){const R=VGROW.radius[L]-VGROW.ringIn;vgRing(rg,R,V.vg);
    if(rg.tower)for(const a of rg.towers)vPut(rg.tower,Math.cos(a)*R,Math.sin(a)*R,rg.towerW,0,V.vg)}
  return true;
}
if(typeof syncVillage==='function'){const base=syncVillage;syncVillage=function(){
  const L=vgLv();
  if(R3D.vil&&R3D.vil.vgL!==L&&R3D.vil.vgL!=null){R3D.scene.remove(R3D.vil.g);R3D.vil=null}   // רמה חדשה: הגבול, העצים, הפנסים והגדר נבנים מחדש
  base();
  const V=R3D.vil;if(!V)return;
  if(V.vgL==null)V.vgL=L;
  if(V.vgDone!==L&&vgBuild(V,L))V.vgDone=L;
}}
