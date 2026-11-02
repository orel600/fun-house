/* הדמות בחלון הציוד (ניר, 31.10.2026: "שיהיה את הדמות שלי, וששמים ציוד רואים את זה ויזואלית עליה").
   במקום האימוג'י באמצע הבובה: הדמות שלך בתלת-ממד, בדיוק כמו במשחק (heroLook ב-render3d.js), מסתובבת לאט.
   מה שלבוש נראה עליה: הנשק ביד (המודל והחומר של הפריט), השריון של הדרגה, זוהר בצבע של סט פעיל (sets.js) או של פריט זוהר,
   והחפצים המסתובבים (orbit) מסתובבים סביבה בצבע הסוג שלהם. לבשת משהו: היא מריעה.
   קנבס אחד שעובר מחלון לחלון (gearDraw בונה את המשבצות מחדש בכל פעם). בלי תלת-ממד (דו-ממד, או טלפון בלי WebGL): נשאר האימוג'י */
const DOLL3D={
  fov:28, fit:1.02,          // זווית המצלמה, וכמה מקום להשאיר סביב הדמות
  spin:0.45, sway:0.6,       // מהירות הסיבוב, וכמה רחוק היא מסתובבת לכל צד (רדיאנים). 0 בסיבוב = תמיד מול המצלמה
  idle:'Idle_A', cheer:'Cheering',
  glow:0.22,                 // כמה חזק הזוהר של סט או פריט זוהר
  orb:{r:0.55,size:0.07,spin:1.4,y:0.55}   // חפצים מסתובבים: רדיוס (חלק מגובה הדמות), גודל, מהירות, וגובה
};

function dollKey(){return lookKey(heroLook())+'|'+gearWorn().join()+'|'+rankId()}
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
  if(a.own)a.own.visible=false;
  rankArmor3d(a);
  // זוהר: סט פעיל (הצבע של הסט), אחרת פריט לבוש שזוהר (כתר, קשת זהב)
  const set=Object.keys(setCounts(gearWorn())).find(s=>setTiers(gearWorn()).some(t=>t.startsWith(s))),
        glow=set?SETS[set].col:(gearWorn().map(id=>(gItem(id).look||{}).glow).find(Boolean));
  if(!GEAR3D.on)for(const m of a.mats){m.emissive.set(glow||0).multiplyScalar(glow?DOLL3D.glow:0);m.userData.em=m.emissive.clone()}
  else{a.g3=null;gear3dParts(a,L)}   // פיילוט ?gear3d=1: הזוהר לפי נדירות ולכל חלק בנפרד, כמו בעולם
  // מסגרת: לפי הגודל של הדמות בתנוחת עמידה
  loop(a,DOLL3D.idle);a.mixer.update(0.01);a.root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(a.root),h=bb.max.y-bb.min.y,c=bb.getCenter(new THREE.Vector3());
  D.h=h;D.cy=c.y;
  const dist=h*DOLL3D.fit/2/Math.tan(DOLL3D.fov*Math.PI/360);
  D.cam.position.set(0,c.y+h*0.08,dist);D.cam.lookAt(0,c.y,0);
  // חפצים מסתובבים: כדור קטן בצבע הסוג (ORBIT.types ב-orbit.js) לכל חפץ לבוש
  D.orbs=new THREE.Group();D.scene.add(D.orbs);
  for(const id of gearWorn()){const it=gItem(id);if(it.slot!=='orbit')continue;
    const col=new THREE.Color((ORBIT.types[it.type]||{}).col||'#fff');
    const m=new THREE.Mesh(new THREE.SphereGeometry(h*DOLL3D.orb.size,16,12),new THREE.MeshLambertMaterial({color:col,emissive:col.clone().multiplyScalar(0.6)}));
    D.orbs.add(m)}
}
// נקרא מ-gearDraw: מכניסים את הקנבס לדמות שבחלון, ומתחילים לצייר. מחזיר false כשאין תלת-ממד
function dollShow(){
  const fig=document.querySelector('#gSlots .gfig');
  if(!fig||!R3D.ready||!window.THREE)return false;
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
  if(w&&h&&(D.w!==w||D.hh!==h)){D.w=w;D.hh=h;D.r.setPixelRatio(Math.min(2,DPR||1));D.r.setSize(w,h,false);D.cam.aspect=w/h;D.cam.updateProjectionMatrix()}
  const a=D.a;a.mixer.update(dt);
  a.root.rotation.y=Math.sin(D.t*DOLL3D.spin)*DOLL3D.sway;
  if(a.one&&!a.one.isRunning()){a.one=null;loop(a,DOLL3D.idle)}
  const n=D.orbs.children.length;D.orbs.children.forEach((m,i)=>{const t=D.t*DOLL3D.orb.spin+i*Math.PI*2/n,r=D.h*DOLL3D.orb.r;
    m.position.set(Math.cos(t)*r,D.cy+D.h*(DOLL3D.orb.y-0.5)+Math.sin(t*2)*D.h*0.04,Math.sin(t)*r)});
  D.r.render(D.scene,D.cam);
  D.raf=requestAnimationFrame(dollFrame);
}
// לבשת משהו: gDoEquip מסמן, והדמות מריעה אחרי שנבנתה מחדש עם הפריט החדש
let dollWantCheer=false;
