/* אגם הערפל: פעמון הערפל והגשרים הצפים (ניר אישר, 6.11.2026. הקונספט: docs/concept-regions.md, פרק 1).
   - פעמון: על אי הפעמון (map.marks 'bell' ב-map-lake.js). ליד הפעמון מופיע כפתור 🔔. מצלצלים, והערפל נעלם ל-dur שניות:
     הכתמים בקנבס (FOG ב-world.js), האובך באופק (HD.air ב-look-hd.js) והפינות החשוכות (VFX.mood.lake ב-vfx.js) נחלשים בהדרגה, וחוזרים בסוף.
     בזמן הזה חצים בקצה המסך מראים אויבים רחוקים, ובפעם הראשונה מתגלה סוד: תיבה טבועה בכפר הטבוע, שרואים רק כשהערפל למטה.
     cd: כמה שניות מהצלצול עד שאפשר לצלצל שוב, כדי שזה לא יהיה כפתור שלוחצים בלי סוף.
   - גשרים צפים: הגשרים של האגם (map.bridges) מתנדנדים על המים בתלת-ממד, שוקעים קצת כשעומדים עליהם, חורקים כשדורכים, ועושים אדוות במים.
     רק מראה ותחושה: ההליכה עליהם לא משתנה.
   לא בונים ערפל חדש: רק מחלישים את מה שיש. נשמר: SAVE.lakeBell ({found:1} אחרי שהסוד נמצא).
   החיבורים: lakeBellUpdate/lakeBellDraw/lakeBellScreen ב-world.js, הכפתור bellBtn ב-index.html, וציור התלת-ממד עוטף את render3d (כמו vfx.js) */
const LBELL={
  reg:'lake',
  at:{dx:0,dy:85},          // איפה הפעמון ביחס לחורבה של האי (map.marks 'bell'), כדי שלא יסתתר בין העמודים
  near:120,                 // כמה קרוב לפעמון כדי שהכפתור יופיע
  dur:60,cd:180,fade:2.5,   // dur: כמה שניות הערפל למטה. cd: מהצלצול עד הצלצול הבא. fade: כמה שניות לוקח לערפל להיעלם ולחזור
  // כמה מהערפל נשאר כשהוא למטה (0 = כלום), ולכמה רחוק האובך באופק מתרחק (נוסף ל-HD.air.near/far)
  clear:{fog:0.1,mood:0.1,vig:0.3,near:1.2,far:3.5},
  see:{r:1700,n:8,col:'#BFE8E6'},   // חצים לאויבים עד r, הכי הרבה n, בצבע הזה
  wave:{life:2.6,r:900,col:'191,232,230'},   // גל שדוחף את הערפל מהפעמון
  col:'#BFE8E6',
  // הסוד: תיבה טבועה בכפר הטבוע (map.marks 'drowned'), נראית רק כשהערפל למטה. פעם אחת לתמיד. השלל בפורמט של runGive (loot.js)
  secret:{dx:-60,dy:40,touch:50,show:0.5,loot:{coins:[1,90],silver:[0.8,2],gold:[0.5,1],sapphire:[0.4,1],ruby:[0.2,1],star:[0.08,1]}},
  // גשרים: amp כמה יחידות עולים ויורדים, roll נטייה לצדדים, pitch נטייה לאורך, sp מהירות, dip שקיעה כשעומדים, creak כל כמה שניות חורק כשהולכים
  sway:{amp:2.6,roll:0.035,pitch:0.012,sp:1.1,dip:4,lean:0.05,creak:0.9},
  ripple:{every:0.32,life:1,r:34}
};
const LB={t:0,cd:0,k:0,wave:-1,swing:0,onB:-1,creakT:0,ripT:0,rip:[],base:null,G:null};
const LBS=()=>SAVE.lakeBell||(SAVE.lakeBell={});
const lbHere=()=>!!(typeof S!=='undefined'&&S&&S.wd&&!S.room&&S.wd.reg===LBELL.reg&&WR().map);
const lbMark=id=>{const M=WORLD.regions[LBELL.reg].map,m=M&&(M.marks||[]).find(q=>q.id===id);return m};
function lbBell(){const m=lbMark('bell');return m&&{x:m.x+LBELL.at.dx,y:m.y+LBELL.at.dy}}
function lbSecret(){const m=lbMark('drowned');return m&&{x:m.x+LBELL.secret.dx,y:m.y+LBELL.secret.dy}}
// על איזה גשר עומדים (מספר ב-map.bridges), או -1
function lbOnBridge(x,y){
  const B=(WR().map||{}).bridges||[];
  for(let i=0;i<B.length;i++){const b=B[i],dx=x-b.x,dy=y-b.y,c=Math.cos(b.a),s=Math.sin(b.a),u=dx*c+dy*s,v=-dx*s+dy*c;if(Math.abs(u)<b.len/2&&Math.abs(v)<b.w/2)return i}
  return -1;
}

/* ---- הערפל: מחלישים את שלוש השכבות לפי k (0 ערפל רגיל, 1 ערפל למטה). מחושב מהבסיס בכל פעם, אז אפשר לקרוא כל פריים ---- */
function lbApply(){
  const C=LBELL.clear,k=lbHere()?LB.k:0;
  if(!LB.base){LB.base={fog:typeof FOG!=='undefined'?FOG.alpha:0};
    if(typeof VFX!=='undefined'&&VFX.mood.lake)Object.assign(LB.base,{fogK:VFX.mood.lake.fogK,vigA:VFX.mood.lake.vigA});
    if(typeof HD!=='undefined'&&HD.air)Object.assign(LB.base,{near:HD.air.near,far:HD.air.far})}
  const B=LB.base,L=(a,b)=>a+(b-a)*k;
  if(typeof FOG!=='undefined')FOG.alpha=L(B.fog,B.fog*C.fog);
  if(B.fogK!=null){VFX.mood.lake.fogK=L(B.fogK,B.fogK*C.mood);VFX.mood.lake.vigA=L(B.vigA,B.vigA*C.vig)}
  if(B.near!=null){HD.air.near=B.near+C.near*k;HD.air.far=B.far+C.far*k}
}

/* ---- כל פריים בעולם (worldUpdate) ---- */
function lakeBellUpdate(dt){
  if(LB.cd>0)LB.cd-=dt;
  if(!lbHere()){LB.t=0;LB.k=0;LB.onB=-1;LB.rip.length=0;lbBtn();lbApply();return}
  if(LB.t>0){LB.t-=dt;if(LB.t<=0){LB.t=0;banner(T('lb.back'),LBELL.col)}}
  LB.k=Math.max(0,Math.min(1,LB.k+(LB.t>0?1:-1)*dt/LBELL.fade));
  if(LB.wave>=0){LB.wave+=dt;if(LB.wave>LBELL.wave.life)LB.wave=-1}
  if(LB.swing>0)LB.swing=Math.max(0,LB.swing-dt/3);
  // הסוד: רק כשהערפל למטה
  const sc=lbSecret();
  if(sc&&!LBS().found&&LB.k>LBELL.secret.show&&Math.hypot(P.x-sc.x,P.y-sc.y)<LBELL.secret.touch){
    LBS().found=1;saveNow();runGive(LBELL.secret.loot,sc.x,sc.y);celebrate(sc.x,sc.y,'loot3');banner(T('lb.found'),C.gold);
    if(typeof questEvent==='function')questEvent('secret','bell',1)}
  // גשרים: דריכה, חריקה ואדוות
  const was=LB.onB;LB.onB=lbOnBridge(P.x,P.y);
  if(LB.onB>=0){
    if(was<0){sfx('creak');LB.creakT=0}
    if(P.moving){LB.creakT+=dt;if(LB.creakT>LBELL.sway.creak){LB.creakT=0;sfx('creak',0.8)}
      LB.ripT+=dt;if(LB.ripT>LBELL.ripple.every){LB.ripT=0;const b=WR().map.bridges[LB.onB],side=Math.random()<0.5?-1:1,c=Math.cos(b.a),s=Math.sin(b.a),
        u=(P.x-b.x)*c+(P.y-b.y)*s+(Math.random()-0.5)*40,v=side*(b.w/2+8);LB.rip.push({x:b.x+u*c-v*s,y:b.y+u*s+v*c,t:0})}}}
  for(const r of LB.rip)r.t+=dt;if(LB.rip.length&&LB.rip[0].t>LBELL.ripple.life)LB.rip=LB.rip.filter(r=>r.t<LBELL.ripple.life);
  lbBtn();lbApply();
}
// הכפתור: ליד הפעמון. מוכן: 🔔 "לצלצל". בהמתנה: ⏳ והזמן שנשאר
function lbBtn(){
  const b=$('bellBtn');if(!b)return;const bl=lbBell(),show=lbHere()&&S.mode==='play'&&!!bl&&Math.hypot(P.x-bl.x,P.y-bl.y)<LBELL.near&&!S.wd.dlg;
  const k=!show?'':LB.cd>0?'w'+Math.ceil(LB.cd):'r';if(b.dataset.k===k+LANG)return;b.dataset.k=k+LANG;b.hidden=!show;if(!show)return;
  b.style.borderColor=LBELL.col;b.style.color=LBELL.col;b.style.opacity=LB.cd>0?0.6:1;
  const s=Math.ceil(LB.cd),txt=LB.cd>0?Math.floor(s/60)+':'+String(s%60).padStart(2,'0'):T('ctx.bell');
  b.innerHTML='<span class="ni" aria-hidden="true">'+(LB.cd>0?'⏳':'🔔')+'</span>'+txt;b.setAttribute('aria-label',T(LB.cd>0?'lb.wait':'lb.btn'));
}
function lakeBellOff(){const b=$('bellBtn');if(b){b.hidden=true;b.dataset.k=''}}
// לצלצל
function lakeBellRing(){
  const bl=lbBell();if(!lbHere()||!bl)return false;
  if(LB.cd>0){floatText(P.x,P.y-50,T('lb.tired'),C.dim,14);sfx('tap');return false}
  LB.t=LBELL.dur;LB.cd=LBELL.cd;LB.wave=0;LB.swing=1;
  sfx('bell');sparks(bl.x,bl.y-30,LBELL.col,20,160);banner(T(LBS().found?'lb.ring':'lb.ring1'),LBELL.col);
  try{navigator.vibrate&&navigator.vibrate([60,80,60])}catch(e){}
  lbBtn();return true;
}
if($('bellBtn'))$('bellBtn').addEventListener('pointerdown',e=>{e.preventDefault();lakeBellRing()});
// יציאה מהעולם: הכפתור נעלם (worldUi ב-world.js קורא ל-fishOff, ואנחנו מצטרפים אליו כדי לא לגעת בשורה המשותפת)
(()=>{const f=window.fishOff;if(typeof f==='function')window.fishOff=function(...a){const r=f.apply(this,a);lakeBellOff();return r}})();

/* ---- ציור בקנבס, בקואורדינטות העולם (drawWorld): גל הצלצול, אדוות ליד הגשר, והתיבה בדו-ממד ---- */
function lakeBellDraw(){
  if(!lbHere())return;const bl=lbBell(),W_=LBELL.wave;
  if(LB.wave>=0&&bl){const f=LB.wave/W_.life;ctx.save();ctx.lineWidth=3;
    for(let i=0;i<3;i++){const g=f-i*0.12;if(g<=0)continue;ctx.strokeStyle='rgba('+W_.col+','+(0.7*(1-g)).toFixed(3)+')';ctx.beginPath();ctx.ellipse(bl.x,bl.y,W_.r*g,W_.r*g*0.6,0,0,7);ctx.stroke()}
    ctx.restore()}
  if(LB.rip.length){ctx.save();ctx.lineWidth=2;const R=LBELL.ripple;
    for(const r of LB.rip){const f=r.t/R.life;ctx.strokeStyle='rgba(220,240,240,'+(0.55*(1-f)).toFixed(3)+')';ctx.beginPath();ctx.ellipse(r.x,r.y,R.r*f+4,(R.r*f+4)*0.45,0,0,7);ctx.stroke()}
    ctx.restore()}
  const sc=lbSecret();
  if(sc&&!LBS().found&&LB.k>0.05){const a=Math.min(1,LB.k/LBELL.secret.show),t=fxNow();ctx.save();ctx.globalAlpha=a*(0.35+Math.sin(t*3)*0.15);
    ctx.fillStyle=C.gold;ctx.beginPath();ctx.ellipse(sc.x,sc.y+4,34,14,0,0,7);ctx.fill();ctx.restore();
    if(!R3D.on){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#4E6A60';ctx.strokeStyle='#22332E';ctx.lineWidth=2;ctx.fillRect(sc.x-15,sc.y-14,30,18);ctx.strokeRect(sc.x-15,sc.y-14,30,18);
      ctx.fillStyle=C.gold;ctx.fillRect(sc.x-2,sc.y-8,4,6);ctx.restore()}}
  if(!R3D.on&&bl){   // הפעמון בדו-ממד: מסגרת ופעמון קטן שמתנדנד
    const sw=Math.sin(fxNow()*9)*0.45*LB.swing;ctx.save();ctx.strokeStyle='#3A2A1C';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(bl.x-26,bl.y);ctx.lineTo(bl.x-26,bl.y-62);ctx.lineTo(bl.x+26,bl.y-62);ctx.lineTo(bl.x+26,bl.y);ctx.stroke();
    ctx.translate(bl.x,bl.y-60);ctx.rotate(sw);ctx.fillStyle='#B08A3A';ctx.strokeStyle='#5A4218';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,4);ctx.lineTo(-14,30);ctx.lineTo(14,30);ctx.lineTo(7,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
}
// מעל הכל, בקואורדינטות המסך: חצים לאויבים רחוקים ולסוד, כשהערפל למטה
function lakeBellScreen(ox,oy){
  if(!lbHere()||LB.k<0.3)return;const R=LBELL.see,list=[];
  for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<R.r)list.push([d,e])}
  list.sort((a,b)=>a[0]-b[0]);ctx.save();ctx.globalAlpha=Math.min(1,LB.k);for(const [,e] of list.slice(0,R.n))edgeArrow(e.x+ox,e.y+oy,R.col,0.75);ctx.restore();
  const sc=lbSecret();if(sc&&!LBS().found&&LB.k>LBELL.secret.show)edgeArrow(sc.x+ox,sc.y+oy,C.gold,1.1,true);
}

/* ---- תלת-ממד: הפעמון, התיבה הטבועה והגשרים המתנדנדים. נבנה פעם אחת בקבוצה של האגם (R3D.wlds.lake) ---- */
function lb3dBuild(G){
  const bl=lbBell(),g=new THREE.Group(),wood=p3Mat('#4A3424'),dark=p3Mat('#2E2016'),brz=p3Mat('#B08A3A');
  for(const s of [-1,1])p3Mesh(p3Box(9,96,9),wood,s*30,48,0,g);
  p3Mesh(p3Box(76,9,12),dark,0,96,0,g);p3Mesh(p3Box(40,7,10),dark,0,104,0,g);
  const pv=new THREE.Group();pv.position.y=92;g.add(pv);
  p3Mesh(p3Cyl(9,18,28,14),brz,0,-18,0,pv);p3Mesh(p3Cyl(19,19,3,14),brz,0,-33,0,pv);p3Mesh(new THREE.SphereGeometry(4,8,6),dark,0,-34,0,pv);
  const halo=p3Halo(LBELL.col,90,74,g);halo.material.opacity=0.35;
  p3At(g,bl.x,bl.y,G.g);
  let chest=null;const sc=lbSecret();if(sc){chest=p3At(p3Chest('#9FE8F2'),sc.x,sc.y,G.g);chest.rotation.y=0.4;chest.visible=false}
  // הגשרים של המפה (terrain.js, tBridge): מוצאים לפי המקום
  const S_=SIN(),B=WR().map.bridges||[],kids=G.terr&&G.terr.root?G.terr.root.children:[],br=[];
  for(const b of B){const m=kids.find(o=>o.isGroup&&Math.abs(o.position.x-b.x)<0.5&&Math.abs(o.position.z-b.y/S_)<0.5);if(m){m.rotation.order='YZX';br.push(m)}else br.push(null)}
  return{g,pv,halo,chest,br};
}
function lb3dTick(){
  if(typeof R3D==='undefined'||!R3D.on||!R3D.ready||!R3D.wlds)return;const G=R3D.wlds[LBELL.reg];if(!G||!G.terr||!lbBell())return;
  const D=G.lbell||(G.lbell=lb3dBuild(G)),t=fxNow(),here=lbHere();if(!here)return;
  D.pv.rotation.z=Math.sin(t*9)*0.5*LB.swing;D.pv.rotation.x=Math.sin(t*6.3)*0.15*LB.swing;
  D.halo.visible=!(LB.cd>0);if(D.halo.visible)D.halo.material.opacity=0.25+Math.sin(t*2.2)*0.1;
  if(D.chest){D.chest.visible=!LBS().found&&LB.k>0.05;if(D.chest.visible)D.chest.scale.setScalar(Math.min(1,LB.k/LBELL.secret.show))}
  const W_=LBELL.sway,B=WR().map.bridges;
  for(let i=0;i<D.br.length;i++){const m=D.br[i];if(!m)continue;const ph=t*W_.sp+i*1.7,on=LB.onB===i;
    let lean=0;if(on){const b=B[i],v=-(P.x-b.x)*Math.sin(b.a)+(P.y-b.y)*Math.cos(b.a);lean=Math.max(-1,Math.min(1,v/(b.w/2)))*W_.lean}
    m.position.y=Math.sin(ph)*W_.amp-(on?W_.dip:0);m.rotation.x=Math.sin(ph*0.8+1)*W_.roll+lean;m.rotation.z=Math.sin(ph*0.6)*W_.pitch}
}
(()=>{const inner=window.render3d;if(typeof inner!=='function')return;
  window.render3d=function(...a){try{lbApply();lb3dTick()}catch(e){console.error(e)}return inner.apply(this,a)}})();
