/* תחושת איסוף משאבים, שלב 1 (GATHER, ניר 8.11.2026, docs/concept-gathering.md פרק 3). רק בעולם הפתוח (S.wd): הזירה של אוראל לא משתנה.
   "התחושה טובה מהמכה הראשונה". כמות השלל לא משתנה (drop ב-NODES): משתנה רק מה שרואים ומרגישים.
   1. כל מכה במקור מתיזה חתיכות בצבע המשאב: שבבים ועלים בעץ, קוביות בסלע, ניצוצות וגושים בעורק, רסיסים בגביש, עלים בשיח.
      מאגר קבוע (בלי הקצאות בפריים), תקרה לכל מכה ולכל פריים. כבוי ב"פחות אפקטים" ובהפחתת תנועה.
   2. המקור נעלם בהדרגה: סלע, עורק וגביש מתכווצים, שיח מתדלדל, ועץ מתנדנד בכל מכה ונופל בסוף.
   3. השלל עף ישר לגיבור (בלי לחכות על הרצפה), "+N" קטן עולה מעליו, והמונה בפס העליון קופץ.
   4. נשאר גדם (בעץ ובשיח) או אבנים קטנות (בסלע), ונבט שגדל בזמן הצמיחה מחדש (WORLD.regrow).
   5. מקורות בקבוצות: כל שדה ב-WORLD.fields מתחלק לחורשות קטנות (gSpot), באותו מספר מקורות.
   חיבורים: gHit מ-damage (combat.js), gDown מ-nodeDown (nodes.js), gSpawn מ-dropSpawn ו-gTake מ-dropTake (drops.js),
   gUpdate ו-gDraw מ-worldUpdate ו-drawWorld, gScale/gSway/gStump2d בציור המקורות בדו-ממד, gSpot ב-wNodes (world.js), gather3d ב-syncWorld (render3d.js) */
const GATHER={
  // חתיכות: n בכל מכה, perFrame לכל היותר בפריים, pool כמה חיות יחד. up/side: מהירות למעלה ולצדדים, grav משיכה, life שניות, size פיקסלים
  chip:{n:6,perFrame:12,pool:60,up:[110,220],side:[50,150],grav:620,life:[0.55,0.9],size:[2.5,5]},
  // הצבעים לפי הצורה (shape ב-NODES.kinds). '*' = הצבע של המקור עצמו. leaf: אילו מהם עלים (אליפסה), spark: ניצוצות (קו)
  cols:{tree:['#7A4E2A','#B98A55','*','*'],rock:['#6E7487','#A2A8B8','*'],vein:['#5A6075','*','*','#FFE9A8'],crystal:['*','*','#FFFFFF'],
        bush:['*','*','#B8E39A'],reed:['*','*','#9FD8C0'],chest:['#7A4E2A','#B98A55','#F4C74F']},
  leaf:{tree:[2,3],bush:[0,1,2],reed:[0,1,2]},spark:{vein:[3],crystal:[2]},
  // כמה המקור מתכווץ עד שהוא נשבר (0 = לא). thin: שיח מתדלדל, יורד בגובה יותר מאשר ברוחב. ease: כמה מהר מגיע לגודל החדש
  shrink:{rock:0.45,vein:0.4,crystal:0.45,bush:0.5,reed:0.5,chest:0.15,tree:0},thin:{bush:0.6,reed:0.6},ease:10,
  sway:{amp:0.16,t:0.45,hz:3.2},          // עץ שנפגע מתנדנד: זווית (רדיאנים), כמה זמן, ותדירות
  fall:{t:0.7,ang:1.5},                   // עץ שנשבר נופל הצידה, הרחק מהגיבור: כמה זמן, ועד איזו זווית
  regrowFrom:0.35,                        // מקור שצמח מחדש מתחיל קטן וגדל לגודל מלא
  stump:{tree:{r:9,h:11,col:'#6B4A2B',top:'#B98A55'},bush:{r:6,h:5,col:'#4E3A22',top:'#7A5A36'},reed:{r:5,h:5,col:'#4E3A22',top:'#7A5A36'},
         rock:{pebble:1},vein:{pebble:1},crystal:{pebble:1}},
  sprout:{h:20,from:0.15},                // הנבט: גובה מלא, ומאיזה חלק מהצמיחה רואים אותו
  lift:0.12,                              // השלל עולה לרגע לפני שהוא עף לגיבור (שניות)
  plus:{size:12,dy:-30},                  // "+N" קטן מעל הגיבור
  cluster:{size:{tree:5,rock:4},def:4,r:60,per:22,spread:0.65},   // חורשה: כמה בכל קבוצה, הרדיוס (r ועוד per לכל מקור), ועד איזה חלק מהשדה המרכזים
  cull:1500,                              // גדם רחוק מהמצלמה לא מצויר בתלת-ממד
  // מצב חי
  chips:null,tick:0,fr:-1,frN:0,from:null,pulse:null,stat:{hit:0,chips:0,fly:0,take:0,fell:0,stump:0,regrown:0}
};
const gOn=()=>!!S&&!!S.wd&&!S.room&&!S.mb;
const gFx=()=>gOn()&&!(typeof RM!=='undefined'&&RM)&&!(typeof fxLess==='function'&&fxLess());
const gShape=n=>(typeof wKind==='function'?wKind(n.kind):NODES.kinds[n.kind]||{}).shape;
const gNow=()=>performance.now()/1000;

/* ---- 1. חתיכות ---- */
function gPool(){if(GATHER.chips)return GATHER.chips;const L=GATHER.chips=[];for(let i=0;i<GATHER.chip.pool;i++)L.push({on:false,x:0,y:0,z:0,vx:0,vy:0,vz:0,t:0,max:1,col:'',sz:3,a:0,k:0});return L}
// מכה במקור (damage ב-combat.js). ang: הכיוון מהגיבור אל המקור
function gHit(n,ang){
  if(!gOn()||!n||!n.node)return;GATHER.stat.hit++;
  if(gShape(n)==='tree'&&gFx()){n.gHitT=gNow();n.gDir=Math.cos(ang||0)>=0?1:-1}
  if(!gFx())return;
  const C=GATHER.chip,sh=gShape(n),pal=GATHER.cols[sh]||GATHER.cols.rock,col=(wKind(n.kind)||{}).col||'#fff',lf=GATHER.leaf[sh]||[],sp=GATHER.spark[sh]||[];
  if(GATHER.fr!==GATHER.tick){GATHER.fr=GATHER.tick;GATHER.frN=0}
  const L=gPool();let made=0;
  for(const c of L){if(made>=C.n||GATHER.frN>=C.perFrame)break;if(c.on)continue;
    const i=made%pal.length,a=(ang||0)+rand(-1.3,1.3),s=rand(...C.side);
    c.on=true;c.x=n.x+rand(-n.r,n.r)*0.4;c.y=n.y+rand(-4,4);c.z=n.r*0.7;c.vx=Math.cos(a)*s;c.vy=Math.sin(a)*s*0.5;c.vz=rand(...C.up);
    c.t=0;c.max=rand(...C.life);c.col=pal[i]==='*'?col:pal[i];c.sz=rand(...C.size);c.a=rand(0,3.14);c.k=sp.includes(i)?2:lf.includes(i)?1:0;
    made++;GATHER.frN++}
  GATHER.stat.chips+=made;
}
function gChips(dt){
  const L=GATHER.chips;if(!L)return;const g=GATHER.chip.grav;
  for(const c of L){if(!c.on)continue;c.t+=dt;if(c.t>=c.max){c.on=false;continue}
    c.x+=c.vx*dt;c.y+=c.vy*dt;c.vz-=g*dt;c.z+=c.vz*dt;if(c.z<0){c.z=0;c.vz=-c.vz*0.3;c.vx*=0.5;c.vy*=0.5}c.a+=dt*8}
}
function gDraw(){
  const L=GATHER.chips;if(!L||!gOn())return;
  for(const c of L){if(!c.on)continue;const k=1-c.t/c.max,y=c.y-c.z;ctx.globalAlpha=Math.min(1,k*2);
    if(c.k===2){ctx.strokeStyle=c.col;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(c.x,y);ctx.lineTo(c.x-c.vx*0.03,y+(c.vz-c.vy)*0.03);ctx.stroke()}
    else if(c.k===1){ctx.fillStyle=c.col;ctx.beginPath();ctx.ellipse(c.x,y,c.sz,c.sz*0.5,c.a,0,7);ctx.fill()}
    else{ctx.fillStyle=c.col;ctx.fillRect(c.x-c.sz/2,y-c.sz/2,c.sz,c.sz)}}
  ctx.globalAlpha=1;
}

/* ---- 2. המקור נעלם בהדרגה, ו-4. גדם ונבט ---- */
// עץ, שיח או סלע שנשבר (nodeDown ב-nodes.js). n=null בסוף nodeDown: השלל שנפל עד עכשיו הוא של המקור
function gDown(n){
  if(!n){GATHER.from=null;return}
  if(!gOn()||!n.node)return;GATHER.from=n;n.gDead=true;
  if(gShape(n)==='tree'&&gFx()){n.gFall=gNow();n.gDir=n.gDir||(n.x>=P.x?1:-1);GATHER.stat.fell++}else n.gFall=0;
}
// כל פריים בעולם (worldUpdate): הגודל מתקרב לחיים שנשארו, צמיחה מחדש מתחילה קטנה, והחתיכות זזות
function gUpdate(dt){
  GATHER.tick++;if(!gOn())return;gChips(dt);
  const G=GATHER,e=Math.min(1,dt*G.ease);
  for(const n of S.nd.list){
    if(n.dead){n.gDead=true;continue}
    if(n.gDead){n.gDead=false;n.gFall=0;n.gk=G.regrowFrom;G.stat.regrown++}
    const want=1-(1-Math.max(0,n.hp)/n.max)*(G.shrink[gShape(n)]||0);
    n.gk=n.gk==null?want:n.gk+(want-n.gk)*e;
  }
  if(G.pulse)gPulse();
}
const gScale=n=>n.gk==null?1:n.gk;
// נדנוד של עץ שנפגע: בין -1 ל-1
function gSway(n){if(!n.gHitT)return 0;const S_=GATHER.sway,t=gNow()-n.gHitT;if(t>S_.t){n.gHitT=0;return 0}return Math.sin(t*S_.hz*6.28)*(1-t/S_.t)*(n.gDir||1)}
// כמה העץ נפל: 0 עומד, 1 על הרצפה. null כשאין נפילה
function gFallK(n){if(!n.gFall)return null;const k=(gNow()-n.gFall)/GATHER.fall.t;return k>=1?1:k*k}
// כמה הנבט גדל: 0 עד 1, לפי הזמן שנשאר לצמיחה מחדש
const gSprout=n=>!n.dead||!n.regrow?0:Math.max(0,Math.min(1,1-n.back/n.regrow));

// דו-ממד: גדם ונבט (או אבנים), ועץ שנופל. נקרא מ-drawWorld במקום לדלג על מקור שבור
function gStump2d(n){
  if(R3D.on||!gOn())return;const sh=gShape(n),K=wKind(n.kind),D=GATHER.stump[sh],x=n.x,y=n.y;if(!D)return;
  const f=gFallK(n);
  if(f!=null&&f<1&&sh==='tree'){ctx.save();ctx.translate(x,y+n.r*0.3);ctx.rotate((n.gDir||1)*f*GATHER.fall.ang);ctx.globalAlpha=1-f*0.5;
    ctx.fillStyle='#6B4A2B';ctx.fillRect(-4,-n.r*0.9-4,8,n.r*0.9);ctx.fillStyle=K.col;ctx.beginPath();ctx.arc(0,-n.r*1.5,n.r,0,7);ctx.fill();ctx.restore();ctx.globalAlpha=1}
  if(D.pebble){ctx.fillStyle='#6E7487';for(let i=0;i<3;i++){const a=hash(n.x+i,n.y)*6.28;ctx.fillRect(x+Math.cos(a)*n.r*0.5-3,y+Math.sin(a)*n.r*0.3-3,6,5)}}
  else{ctx.fillStyle=D.col;ctx.fillRect(x-D.r,y-D.h,D.r*2,D.h);ctx.fillStyle=D.top;ctx.beginPath();ctx.ellipse(x,y-D.h,D.r,D.r*0.45,0,0,7);ctx.fill()}
  const p=gSprout(n);if(p>GATHER.sprout.from){const h=GATHER.sprout.h*p;ctx.fillStyle=D.pebble?K.col:'#6FBF5A';
    ctx.beginPath();ctx.moveTo(x-h*0.3,y-(D.h||0));ctx.lineTo(x,y-(D.h||0)-h);ctx.lineTo(x+h*0.3,y-(D.h||0));ctx.closePath();ctx.fill()}
}

/* ---- 3. השלל עף לגיבור ---- */
// כל משאב שנופל בזמן nodeDown (dropSpawn ב-drops.js): עולה לרגע ועף ישר לגיבור
function gSpawn(d){
  if(!GATHER.from||!gOn()||!d||dropGear(d.r))return;
  d.fly=true;d.gth=1;d.t=Math.max(d.t,DROPS.land-GATHER.lift);d.vz=Math.min(d.vz,120);GATHER.stat.fly++;
}
// נאסף (dropTake): "+N" קטן מעל הגיבור, והמונה בפס העליון קופץ
function gTake(d){
  if(!d.gth||!gOn())return;GATHER.stat.take++;
  if(typeof feedOn==='function'&&feedOn())floatText(P.x,P.y+GATHER.plus.dy,'+'+d.n+' '+resIcon(d.r),(dropTier(d.r)||{}).col||C.gold,GATHER.plus.size);
  if(!(typeof RM!=='undefined'&&RM))GATHER.pulse={r:d.r,t:gNow()};
}
// הפס העליון נבנה מחדש כשהתרמיל משתנה (worldHud), ולכן מסמנים את השבב החדש כשהוא מופיע
function gPulse(){
  const p=GATHER.pulse;if(gNow()-p.t>1){GATHER.pulse=null;return}
  const el=document.querySelector('#wBag [data-tip="'+p.r+'"]');if(!el||el.classList.contains('gpulse'))return;
  el.classList.add('gpulse');GATHER.pulse=null;
}

/* ---- 5. מקורות בקבוצות ---- */
// מקום למקור בשדה F (WORLD.fields), ניסיון מספר tries. אותו שדה תמיד נותן אותם מקומות (hash, בלי rand).
// אחרי שליש מהניסיונות בלי מקום פנוי: בכל השדה, כמו קודם, כדי שמספר המקורות לא ירד
function gSpot(F,fi,tries,K){
  const C=GATHER.cluster;
  if(tries>=F.n*4){const a=hash(fi*31+tries,7)*Math.PI*2,r=Math.sqrt(hash(tries,fi*17+3))*F.r;return[F.x+Math.cos(a)*r,F.y+Math.sin(a)*r]}
  const sz=C.size[K.shape]||C.def,nc=Math.max(1,Math.round(F.n/sz)),c=tries%nc;
  const ca=hash(fi*13+c,5)*Math.PI*2,cd=nc===1?0:(0.35+0.65*Math.sqrt(hash(c+1,fi*7+1)))*F.r*C.spread;
  const cr=Math.min(F.r,C.r+C.per*Math.ceil(F.n/nc)),a=hash(fi*29+tries,11)*Math.PI*2,r=Math.sqrt(hash(tries+3,fi*19+5))*cr;
  return[F.x+Math.cos(ca)*cd+Math.cos(a)*r,F.y+Math.sin(ca)*cd+Math.sin(a)*r];
}

/* ---- תלת-ממד: נקרא לכל מקור בלולאה של syncWorld (render3d.js), אחרי שנקבע אם הוא נראה ---- */
const G3={geo:null,mats:{}};
function g3Mat(c){return G3.mats[c]||(G3.mats[c]=new THREE.MeshLambertMaterial({color:c,flatShading:true}))}
function g3Stump(n,m,g){
  const sh=gShape(n),D=GATHER.stump[sh];if(!D)return null;
  if(!G3.geo)G3.geo={cyl:new THREE.CylinderGeometry(1,1.15,1,7),box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(0.35,1,5)};
  const o=new THREE.Group(),Q=G3.geo,K=wKind(n.kind);
  if(D.pebble){for(let i=0;i<3;i++){const a=hash(n.x+i,n.y)*6.28,s=6+hash(i,n.y)*5,p=new THREE.Mesh(Q.box,g3Mat(i?'#6E7487':'#8A90A2'));
    p.scale.set(s,s*0.7,s);p.position.set(Math.cos(a)*n.r*0.5,s*0.35,Math.sin(a)*n.r*0.5);p.rotation.y=a;o.add(p)}}
  else{const s=new THREE.Mesh(Q.cyl,g3Mat(D.col));s.scale.set(D.r,D.h,D.r);s.position.y=D.h/2;o.add(s);
    const t=new THREE.Mesh(Q.cyl,g3Mat(D.top));t.scale.set(D.r*0.92,1,D.r*0.92);t.position.y=D.h+0.4;o.add(t)}
  const sp=new THREE.Mesh(Q.cone,g3Mat(D.pebble?K.col:'#6FBF5A'));sp.position.y=D.h||4;o.add(sp);o.userData.sp=sp;o.userData.y0=D.h||4;
  o.position.set(n.x,m.userData.gOff||0,n.y/SIN());g.add(o);return o;
}
function gather3d(n,m,g){
  if(!gOn())return;const u=m.userData,sh=gShape(n);
  if(u.gS==null){u.gS=[m.scale.x,m.scale.y,m.scale.z];u.gOff=u.lift?u.lift/COS():0;u.gY=m.position.y-u.gOff;m.rotation.order='ZXY'}   // gOff: כמה הרכס הרים אותו (tLift ב-terrain.js)
  let k=gScale(n),rz=0;
  const f=gFallK(n),near=Math.abs(n.x-S.cam.x)+Math.abs(n.y-S.cam.y)<GATHER.cull;
  if(n.dead){if(f!=null&&f<1&&near){m.visible=true;rz=-(n.gDir||1)*f*GATHER.fall.ang;k=1}}
  else rz=-gSway(n)*GATHER.sway.amp;
  const ky=k*(1-(1-k)*(GATHER.thin[sh]||0));   // שיח מתדלדל: יורד בגובה יותר מאשר ברוחב
  m.scale.set(u.gS[0]*k,u.gS[1]*ky,u.gS[2]*k);m.position.y=u.gOff+u.gY*k;m.rotation.z=rz;
  // גדם ונבט: רק כשהמקור שבור, אחרי שהעץ סיים ליפול
  const want=n.dead&&near&&(f==null||f>=1);
  if(want&&!u.gSt){u.gSt=g3Stump(n,m,g);if(u.gSt)GATHER.stat.stump++}
  if(u.gSt){u.gSt.visible=want;if(want){const p=gSprout(n),sp=u.gSt.userData.sp,h=GATHER.sprout.h*p;sp.visible=p>GATHER.sprout.from;sp.scale.set(h*0.6,h,h*0.6);sp.position.y=u.gSt.userData.y0+h/2}}
}
