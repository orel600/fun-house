/* הדמות בחלון הציוד (ניר, 31.10.2026: "שיהיה את הדמות שלי, וששמים ציוד רואים את זה ויזואלית עליה").
   במקום האימוג'י באמצע הבובה: הדמות שלך בתלת-ממד, בדיוק כמו במשחק (heroLook ב-render3d.js), מסתובבת לאט.
   מה שלבוש נראה עליה: הנשק ביד (המודל והחומר של הפריט), השריון של הדרגה, זוהר בצבע של סט פעיל (sets.js) או של פריט זוהר,
   והחפצים המסתובבים (orbit) מסתובבים סביבה בצבע הסוג שלהם. לבשת משהו: היא מריעה.
   קנבס אחד שעובר מחלון לחלון (gearDraw בונה את המשבצות מחדש בכל פעם). בלי תלת-ממד (דו-ממד, או טלפון בלי WebGL): נשאר האימוג'י */
const DOLL3D={
  fov:28,                    // זווית המצלמה
  spin:0.45, sway:0.6,       // מהירות הסיבוב, וכמה רחוק היא מסתובבת לכל צד (רדיאנים). 0 בסיבוב = תמיד מול המצלמה
  idle:'Idle_A', cheer:'Cheering',
  /* תנוחת עמידה לפי משפחת הנשק (GRIP3D.of ב-render3d.js). ב-Idle_A הקשת שוכבת על החגורה ונחתכת, והמטה תלוי הפוך (ניר, 6.11.2026:
     זה החלון שבו מסתכלים על הנשקים האגדיים). קשת: מחזיקים אותה זקופה לפני הדמות. מטה: עמידת קרב, המטה זקוף */
  idleBy:{bow:'Ranged_Bow_Idle',magic:'Ranged_Magic_Spellcasting'},
  /* פנייה הצידה לפי משפחת הנשק (רדיאנים). קשת: מוחזקת בכיוון המבט, ומקדימה רואים רק את הקצה. מטה: ביד ימין, ופונים מעט שמאלה כדי שהוא יהיה בצד ולא מול הפנים */
  yawBy:{bow:0.9,magic:-0.25},
  swayBy:{magic:0.2},        // המטה מורם ליד הראש: נדנוד קטן, כדי שהוא לא יעבור מול הפנים
  /* מסגרת (באג 9.11.2026, docs/weapon-audit-2026-11-09.md: 10 מ-17 נשקים נחתכו בקצה). המצלמה מתאימה את עצמה לקופסה של הדמות
     ושל הנשק יחד, בכל הנדנוד ובתנוחות העמידה וההרעה (dollFit). minH: הדמות תופסת לפחות חלק כזה מגובה הקנבס, גם כשהנשק ארוך (להב הדרקון, הארוך מכולם, צריך 0.42. השאר נכנסים ב-0.58 ומעלה).
     pad: שוליים סביב הכל (חלק מהקנבס). badge: הפינה התחתונה בצד הסוף, שם תג המחלקה (.gfig b): הנשק לא נכנס אליה.
     poses: כמה רגעים בכל אנימציה נבדקים, swing: כמה נקודות בנדנוד */
  minH:0.42,pad:0.03,badge:{w:0.3,h:0.16},poses:4,swing:5,
  glow:0.22,                 // כמה חזק הזוהר של סט או פריט זוהר
  /* חפצים מסתובבים: רדיוס (חלק מגובה הדמות), גודל, מהירות, וגובה. נמוך וקטן, סביב הרגליים: בגובה החזה כדור כתום גדול
     עבר מול הפנים (ניר, 5.11.2026: "הדמות בחפצים נראית מזעזע") */
  orb:{r:0.48,size:0.035,spin:1.4,y:0.12}
};

function dollKey(){return lookKey(heroLook())+'|'+gearWorn().join()+'|'+rankId()+'|'+(SAVE.showHat!==false)}
// בונים את הבמה פעם אחת: רנדרר שקוף, אור כמו במשחק ומצלמה
function dollInit(){
  const D=R3D.doll={};
  D.cvs=document.createElement('canvas');D.cvs.className='doll3d';D.cvs.setAttribute('aria-hidden','true');
  D.r=new THREE.WebGLRenderer({canvas:D.cvs,alpha:true,antialias:true});D.r.outputColorSpace=THREE.SRGBColorSpace;
  D.scene=new THREE.Scene();
  D.scene.add(new THREE.HemisphereLight(0xdfe6ff,0x2a2236,1.7));
  const sun=new THREE.DirectionalLight(0xfff1dc,2);sun.position.set(-0.4,1,1);D.scene.add(sun);
  D.cam=new THREE.PerspectiveCamera(DOLL3D.fov,1,1,5000);
  D.last=0;D.t=0;
  return D;
}
// הדמות לפי מה שלבוש עכשיו. נבנית מחדש רק כשמשהו השתנה
function dollBuild(D){
  const key=dollKey();if(D.key===key)return;D.key=key;
  if(D.a)D.scene.remove(D.a.root);if(D.orbs)D.scene.remove(D.orbs);
  const L=heroLook(),a=makeActor(L);R3D.scene.remove(a.root);D.scene.add(a.root);D.a=a;   // makeActor מוסיף לסצנה של המשחק, אז מעבירים
  a.root.position.set(0,0,0);a.root.rotation.set(0,0,0);
  const wid=SAVE.gear.weapon,use=gItem(wid)?wUse(wid):null;
  for(const k in a.props)a.props[k].visible=k===use||k==='shield'&&use==='sword';   // רק הנשק שלבוש, ובלי נשק: ידיים ריקות
  const wp=use&&L.props[use];const fam=wp&&GRIP3D.of(wp.prop);D.idle=DOLL3D.idleBy[fam]||DOLL3D.idle;D.yaw=DOLL3D.yawBy[fam]||0;D.sway=DOLL3D.swayBy[fam]??DOLL3D.sway;
  if(a.own)a.own.visible=false;
  rankArmor3d(a);
  // זוהר: סט פעיל (הצבע של הסט), אחרת פריט לבוש שזוהר (כתר, קשת זהב)
  const set=Object.keys(setCounts(gearWorn())).find(s=>setTiers(gearWorn()).some(t=>t.startsWith(s))),
        glow=set?SETS[set].col:(gearWorn().map(id=>(gItem(id).look||{}).glow).find(Boolean));
  if(!GEAR3D.on)for(const m of a.mats){m.emissive.set(glow||0).multiplyScalar(glow?DOLL3D.glow:0);m.userData.em=m.emissive.clone()}
  else{a.g3=null;gear3dParts(a,L)}
  a.ar=null;armor3d(a);   // שריון לפי מחלקה (armor.js)   // פיילוט ?gear3d=1: הזוהר לפי נדירות ולכל חלק בנפרד, כמו בעולם
  // מסגרת: הגובה של הדמות בעמידה (לחפצים המסתובבים ול-minH), והמצלמה לפי הדמות והנשק יחד
  loop(a,D.idle);a.mixer.update(0.01);a.root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(a.root),h=bb.max.y-bb.min.y,c=bb.getCenter(new THREE.Vector3());
  D.h=h;D.cy=c.y;
  dollFit(D);
  // חפצים מסתובבים: כדור קטן בצבע הסוג (ORBIT.types ב-orbit.js) לכל חפץ לבוש
  D.orbs=new THREE.Group();D.scene.add(D.orbs);
  for(const id of gearWorn()){const it=gItem(id);if(it.slot!=='orbit')continue;
    const col=new THREE.Color((ORBIT.types[it.type]||{}).col||'#fff');
    const m=new THREE.Mesh(new THREE.SphereGeometry(h*DOLL3D.orb.size,16,12),new THREE.MeshLambertMaterial({color:col,emissive:col.clone().multiplyScalar(0.6)}));
    D.orbs.add(m)}
}
// הקופסה של מה שנראה (גוף, שריון, הנשק שלבוש), בעולם. נשקים מוסתרים לא נספרים
function dollBox(root){
  const b=new THREE.Box3(),t=new THREE.Box3();root.updateMatrixWorld(true);
  root.traverseVisible(o=>{if(!o.isMesh)return;
    if(o.isSkinnedMesh){o.computeBoundingBox();t.copy(o.boundingBox)}else{if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();t.copy(o.geometry.boundingBox)}
    b.union(t.applyMatrix4(o.matrixWorld))});
  return b;
}
// דוגמים את הדמות בכל הנדנוד, בעמידה ובהרעה, ושומרים את הפינות. dollCam מעמיד לפיהן את המצלמה
function dollFit(D){
  const a=D.a,P=DOLL3D,pts=[];a.mixer.stopAllAction();a.base=null;a.one=null;
  for(const n of [D.idle,P.cheer]){const x=act(a,n);if(!x)continue;const d=x.getClip().duration;x.reset().setEffectiveWeight(1).play();
    for(let k=0;k<P.poses;k++){x.time=d*k/P.poses;a.mixer.update(0);
      for(let j=0;j<P.swing;j++){a.root.rotation.y=D.yaw+D.sway*(j/(P.swing-1)*2-1);const b=dollBox(a.root);if(b.isEmpty())continue;
        for(const X of [b.min.x,b.max.x])for(const Y of [b.min.y,b.max.y])for(const Z of [b.min.z,b.max.z])pts.push(new THREE.Vector3(X,Y,Z))}}
    x.stop()}
  a.root.rotation.y=D.yaw;loop(a,D.idle);a.mixer.update(0.01);
  D.pts=pts;dollCam(D);
}
/* מצלמה ישרה (מבט לאורך z): המרכז באמצע הקופסה, והמרחק הקטן שבו כל הנקודות בתוך הקנבס, בלי פינת התג.
   הדמות לא קטנה מ-minH מהגובה: נשק ארוך מאוד ייחתך קצת, ולא הגיבור יהפוך לגפרור */
function dollCam(D){
  const P=DOLL3D,ty=Math.tan(P.fov*Math.PI/360),tx=ty*(D.cam.aspect||1),pts=D.pts;if(!pts||!pts.length)return;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y)}
  const cx=(x0+x1)/2,cy=(y0+y1)/2,m=1-2*P.pad,bx=1-2*P.badge.w,by=-1+2*P.badge.h,end=document.documentElement.dir==='rtl'?-1:1;
  let dist=0;
  for(const p of pts){const dx=Math.abs(p.x-cx)/(tx*m),dy=Math.abs(p.y-cy)/(ty*m);dist=Math.max(dist,p.z+dx,p.z+dy)}
  // פינת התג: נקודה שנופלת בה מרחיקה את המצלמה עד שהיא יוצאת (בגובה או ברוחב, הקרוב מביניהם)
  for(let i=0;i<3;i++)for(const p of pts){const z=dist-p.z,sx=(p.x-cx)/(z*tx)*end,sy=(p.y-cy)/(z*ty);
    if(sx>bx&&sy<by)dist=Math.max(dist,p.z+Math.min((p.x-cx)*end/(tx*bx),(cy-p.y)/(ty*-by)))}
  dist=Math.min(dist,D.h/(2*ty*P.minH));   // הגיבור לא קטן מ-minH
  D.cam.position.set(cx,cy,dist);D.cam.lookAt(cx,cy,0);D.cam.updateProjectionMatrix();
}
/* מודל משלו (w_item_, נטען בעצלתיים ב-m3d.js) מתחיל לרדת כבר כשבוחרים נשק בתיק, ולא רק כשלובשים אותו.
   עד שהוא מוכן הדמות מחזיקה מודל זמני נייטרלי (heroLook ב-render3d.js), ו-dollFrame מחליף אותו כשהמודל מגיע */
function dollPreload(){
  const sel=typeof GUI!=='undefined'&&GUI.sel&&(GUI.sel.id||GUI.sel.sid);
  for(const id of [SAVE.gear.weapon,sel])if(typeof id==='string'&&gItem(id)&&gItem(id).slot==='weapon')m3dNeed('w_item_'+gBase(id));
}
// נקרא מ-gearDraw: מכניסים את הקנבס לדמות שבחלון, ומתחילים לצייר. מחזיר false כשאין תלת-ממד
function dollShow(){
  const fig=document.querySelector('#gSlots .gfig');
  if(!fig||!R3D.ready||!window.THREE)return false;
  dollPreload();
  let D=R3D.doll;try{if(!D)D=dollInit();dollBuild(D)}catch(e){console.warn('doll3d',e);return false}
  fig.classList.add('d3');fig.appendChild(D.cvs);
  if(dollWantCheer){dollWantCheer=false;once(D.a,DOLL3D.cheer,1.4)}
  if(!D.raf){D.last=performance.now();D.raf=requestAnimationFrame(dollFrame)}
  return true;
}
function dollFrame(){
  const D=R3D.doll;D.raf=0;
  if($('ovGear').hidden||!D.cvs.isConnected)return;   // החלון נסגר: עוצרים, וממשיכים כשהוא נפתח שוב
  const now=performance.now(),dt=Math.min(0.05,(now-D.last)/1000);D.last=now;D.t+=dt;
  const w=D.cvs.clientWidth,h=D.cvs.clientHeight;
  if(w&&h&&(D.w!==w||D.hh!==h)){D.w=w;D.hh=h;D.r.setPixelRatio(Math.min(2,DPR||1));D.r.setSize(w,h,false);D.cam.aspect=w/h;dollCam(D)}
  if(D.mv!==M3D.v){D.mv=M3D.v;dollBuild(D)}   // מודל נטען בזמן שהחלון פתוח (m3d.js): הדמות נבנית מחדש עם הנשק האמיתי (באג 9.11: נשאר המודל הזמני)
  const a=D.a;a.mixer.update(dt);
  a.root.rotation.y=(D.yaw||0)+Math.sin(D.t*DOLL3D.spin)*D.sway;
  if(a.one&&!a.one.isRunning()){a.one=null;loop(a,D.idle)}
  const n=D.orbs.children.length;D.orbs.children.forEach((m,i)=>{const t=D.t*DOLL3D.orb.spin+i*Math.PI*2/n,r=D.h*DOLL3D.orb.r;
    m.position.set(Math.cos(t)*r,D.cy+D.h*(DOLL3D.orb.y-0.5)+Math.sin(t*2)*D.h*0.04,Math.sin(t)*r)});
  D.r.render(D.scene,D.cam);
  D.raf=requestAnimationFrame(dollFrame);
}
// לבשת משהו: gDoEquip מסמן, והדמות מריעה אחרי שנבנתה מחדש עם הפריט החדש
let dollWantCheer=false;
