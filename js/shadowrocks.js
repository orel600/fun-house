/* הסלעים המרחפים בלב הצל (6.11.2026, ניר: "יותר חי וברור, לא יותר קשה"). הקונספט: docs/concept-regions.md, פרק 5.
   במזרח התהום, דרך שנייה אל הפנס הלבן לצד גשר העצם: שרשרת סלעים שעולים ויורדים לאט ונעים מצד לצד מעל התהום, ואי קטן וקבוע באמצע.
   - בלי קפיצות. סלע הוא משטח שעומדים עליו, והוא לוקח אותך איתו כשהוא זז.
   - שני סלעים מחוברים כשהם קרובים מספיק: נדלק ביניהם גשר אור (הזוהר), ואפשר ללכת עליו. כשהגשר כבוי, קצה הסלע חוסם כמו שפת התהום, ומחכים שנייה-שתיים.
   - נופלים רק בכוונה: דוחפים את האגודל אל התהום (לא לכיוון הסלע הבא) כמה רגעים. אז חוזרים לשפה האחרונה (או לאי) עם נזק קטן, בלי למות.
   - רק השחקן עולה על הסלעים: האויבים, פיוחו והבוט נשארים ברשת החסימה הקבועה (terrain.js), ובה התהום חסומה. האי והשפות פנויים גם שם.
   החיבור: TR.walk ב-tStep (terrain.js), srUpdate ב-worldUpdate, srDraw ו-srGlow ב-drawWorld (world.js), sr3d ב-syncWorld (render3d.js). */
const SROCKS={
  reg:'shadow',
  r:72,                         // רדיוס סלע (פיקסלים של המשחק)
  inner:10,                     // מרכז השחקן נשאר לפחות כך מהקצה של סלע
  shore:[{x:1150,y:-880},{x:1150,y:905}],   // השפה בצפון ובדרום: נקודה על היבשה שממנה יוצאים
  shoreR:20,                    // "רדיוס" של נקודת השפה, לחישוב המרחק לסלע הראשון
  isle:{x:1320,y:-80,r:120},    // האי באמצע: יבשה קבועה (הוא גם ב-border ב-map-shadow.js), מקום לנשום
  chains:[4,5],                 // כמה סלעים מהשפה הצפונית לאי, ומהאי לשפה הדרומית
  sway:{amp:100,per:8,step:Math.PI/2},   // תנועה מצד לצד, ניצב לשרשרת: כמה רחוק, כמה שניות לסיבוב, והפרש הפאזה בין סלע לסלע
  bob:{amp:4,per:3.4,step:1.1,y:5},      // עולים ויורדים (רק במראה). סלע שעומדים עליו מתייצב
  link:{gap:60,w:56,hold:120},  // מחוברים כשבין הקצוות פחות מ-gap. רוחב גשר האור. מי שעומד על הגשר מחזיק אותו עד hold
  fall:{push:0.7,dmg:0.08,cone:0.9},     // כמה שניות דוחפים אל התהום עד שנופלים, איזה חלק מהחיים, וזווית לכיוון הסלע הבא שלא נחשבת דחיפה
  hint:420,                     // הרמז הראשון מופיע כשמתקרבים לשפה עד כאן
  col:{stone:'#5d4f80',top:'#8a78b8',dark:'#2a2140',rim:'200,168,255',link:'235,220,255',off:'150,120,210'}
};
const SR={t:0,nodes:null,links:null,land:null,push:0,falls:0,hinted:false};

/* השרשרת: שפה, סלעים, אי, סלעים, שפה. סלע זז, אי ושפה קבועים */
function srBuild(){
  const K=SROCKS,ends=[{x:K.shore[0].x,y:K.shore[0].y,r:K.shoreR,fixed:1},{x:K.isle.x,y:K.isle.y,r:K.isle.r,fixed:1,isle:1},{x:K.shore[1].x,y:K.shore[1].y,r:K.shoreR,fixed:1}];
  const N=[ends[0]];let k=0;
  K.chains.forEach((n,c)=>{const a=ends[c],b=ends[c+1],dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,gap=(L-a.r-b.r-n*2*K.r)/(n+1);
    for(let i=0;i<n;i++){const d=a.r+gap*(i+1)+K.r*(2*i+1);N.push({bx:a.x+ux*d,by:a.y+uy*d,nx:-uy,ny:ux,r:K.r,k:k++,x:0,y:0,h:0})}
    N.push(b)});
  SR.nodes=N;SR.links=N.slice(1).map((b,i)=>({a:N[i],b,on:false,hold:false}));srMove(0);
}
function srMove(dt){
  const K=SROCKS,W=K.sway,B=K.bob;SR.t+=dt;
  for(const n of SR.nodes){if(n.fixed)continue;const o=W.amp*Math.sin(SR.t/W.per*6.283+n.k*W.step);n.x=n.bx+n.nx*o;n.y=n.by+n.ny*o;
    const want=n.busy?0:B.amp*Math.sin(SR.t/B.per*6.283+n.k*B.step);n.h+=(want-n.h)*Math.min(1,dt*3)}
  for(const l of SR.links){const g=Math.hypot(l.b.x-l.a.x,l.b.y-l.a.y)-l.a.r-l.b.r;l.on=g<K.link.gap||l.hold&&g<K.link.hold}
}
const srOnRock=(n,x,y,pad)=>!n.fixed&&Math.hypot(x-n.x,y-n.y)<n.r-pad;
const srOnLink=(l,x,y)=>l.on&&segD(x,y,l.a.x,l.a.y,l.b.x,l.b.y)<SROCKS.link.w/2;
// אפשר לעמוד כאן (רק השחקן, דרך tStep): על סלע, או על גשר אור דולק
function srWalk(x,y){if(!SR.nodes)return false;for(const n of SR.nodes)if(srOnRock(n,x,y,SROCKS.inner))return true;for(const l of SR.links)if(srOnLink(l,x,y))return true;return false}
const srHere=()=>S.wd&&S.wd.reg===SROCKS.reg&&TR&&TR.reg===SROCKS.reg;

/* כל פריים בעולם, אחרי שהשחקן זז (placeClamp ב-worldUpdate) */
function srUpdate(dt){
  if(!srHere())return;if(!SR.nodes)srBuild();TR.walk=srWalk;
  const K=SROCKS,old=SR.nodes.map(n=>[n.x,n.y]),i0=SR.nodes.findIndex(n=>srOnRock(n,P.x,P.y,0)),l0=i0<0?SR.links.findIndex(l=>srOnLink(l,P.x,P.y)):-1;
  SR.nodes.forEach((n,i)=>n.busy=i===i0);SR.links.forEach((l,i)=>l.hold=i===l0);
  srMove(dt);
  // הסלע לוקח אותך איתו. על גשר האור: לפי המקום על הגשר, בין שני הקצוות
  let dx=0,dy=0;
  if(i0>=0){dx=SR.nodes[i0].x-old[i0][0];dy=SR.nodes[i0].y-old[i0][1]}
  else if(l0>=0){const l=SR.links[l0],ia=SR.nodes.indexOf(l.a),ib=ia+1,ax=old[ia][0],ay=old[ia][1],bx=old[ib][0],by=old[ib][1],
    q=Math.max(0,Math.min(1,((P.x-ax)*(bx-ax)+(P.y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2||1)));
    dx=(l.a.x-ax)*(1-q)+(l.b.x-bx)*q;dy=(l.a.y-ay)*(1-q)+(l.b.y-by)*q}
  if(dx||dy){P.x+=dx;P.y+=dy;if(P._tx!=null){P._tx+=dx;P._ty+=dy}}
  if(!SR.hinted&&K.shore.some(s=>Math.hypot(P.x-s.x,P.y-s.y)<K.hint)){SR.hinted=true;banner(T('sr.hint'),'rgb('+K.col.rim+')')}
  if(!tBlocked(P.x,P.y)){SR.land={x:P.x,y:P.y};SR.push=0;return}   // על היבשה (או על האי): זו השפה שחוזרים אליה
  const near=SR.nodes.reduce((m,n)=>Math.min(m,Math.hypot(P.x-n.x,P.y-n.y)-n.r),1e9);if(near>K.r*2)return;   // לא ליד הסלעים: לא שלנו
  if(!srWalk(P.x,P.y)){   // הגשר נעלם או הסלע זז מתחת: מחזירים בעדינות לסלע הקרוב, בלי נזק
    let b=null,bd=1e9;for(const n of SR.nodes){if(n.fixed)continue;const d=Math.hypot(P.x-n.x,P.y-n.y);if(d<bd){bd=d;b=n}}
    if(b&&bd<b.r+K.link.w){const k=(b.r-K.inner-2)/(bd||1);if(k<1){P.x=b.x+(P.x-b.x)*k;P.y=b.y+(P.y-b.y)*k}if(P._tx!=null){P._tx=P.x;P._ty=P.y}}else{srFall();return}}
  // נפילה רק בכוונה: דוחפים אל התהום, ולא לכיוון שכן בשרשרת
  const v=Math.hypot(P.vx||0,P.vy||0);
  if(P.moving&&v>1){const ux=P.vx/v,uy=P.vy/v,px=P.x+ux*((P.r||12)+12),py=P.y+uy*((P.r||12)+12);
    const i=SR.nodes.findIndex(n=>srOnRock(n,P.x,P.y,0)),nb=i>=0?[SR.nodes[i-1],SR.nodes[i+1]].filter(Boolean):[];
    const toNb=nb.some(n=>Math.acos(Math.max(-1,Math.min(1,((n.x-P.x)*ux+(n.y-P.y)*uy)/(Math.hypot(n.x-P.x,n.y-P.y)||1))))<K.fall.cone);
    if(!srWalk(px,py)&&tBlocked(px,py)&&!toNb)SR.push+=dt;else SR.push=0}
  else SR.push=0;
  if(SR.push>K.fall.push)srFall();
}
function srFall(){
  const K=SROCKS,L=SR.land||K.shore[0];sparks(P.x,P.y,'rgb('+K.col.rim+')',18);
  P.x=L.x;P.y=L.y;P._tx=P.x;P._ty=P.y;P.hp=Math.max(1,P.hp-P.maxHp*K.fall.dmg);S.hurt=0.3;S.shake=Math.max(S.shake,8);SR.push=0;SR.falls++;
  if(typeof sfx==='function')sfx('hurt');banner(T('sr.fall'),'rgb('+K.col.rim+')');sparks(P.x,P.y,'rgb('+K.col.rim+')',12);
}

/* ---- ציור ---- */
// צורת סלע לא עגולה לגמרי, קבועה לכל סלע
function srShape(n,x,y,r){ctx.beginPath();for(let i=0;i<9;i++){const a=i/9*6.283,q=r*(0.9+hash(n.k||0,i)*0.16);i?ctx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):ctx.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}ctx.closePath()}
// דו-ממד: גוף הסלעים, לפני החושך (בתלת-ממד הם מודלים, sr3d)
function srDraw(){
  if(!srHere()||!SR.nodes||R3D.on)return;const C_=SROCKS.col;
  for(const n of SR.nodes){if(n.fixed)continue;const y=n.y-n.h;
    ctx.fillStyle='rgba(5,3,12,0.45)';ctx.beginPath();ctx.ellipse(n.x,n.y+n.r*0.35,n.r*(0.9-n.h*0.01),n.r*0.35,0,0,7);ctx.fill();
    ctx.fillStyle=C_.stone;srShape(n,n.x,y,n.r);ctx.fill();ctx.strokeStyle=C_.dark;ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle=C_.top;srShape(n,n.x-6,y-8,n.r*0.72);ctx.fill()}
}
// אחרי החושך (wShadow): הזוהר, כדי שרואים מרחוק איפה הסלעים ומתי הם מחוברים. גם בתלת-ממד, על הקנבס
function srGlow(){
  if(!srHere()||!SR.nodes)return;const C_=SROCKS.col,t=fxNow(),pl=0.5+0.5*Math.sin(t*4);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const l of SR.links){const a=l.a,b=l.b,d=Math.hypot(b.x-a.x,b.y-a.y)||1,ux=(b.x-a.x)/d,uy=(b.y-a.y)/d,
      x0=a.x+ux*a.r*0.8,y0=a.y+uy*a.r*0.8,x1=b.x-ux*b.r*0.8,y1=b.y-uy*b.r*0.8;
    ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);
    if(l.on){ctx.strokeStyle='rgba('+C_.link+','+(0.16+0.08*pl)+')';ctx.lineWidth=SROCKS.link.w;ctx.stroke();ctx.strokeStyle='rgba('+C_.link+','+(0.55+0.3*pl)+')';ctx.lineWidth=5;ctx.stroke()}
    else{ctx.setLineDash([10,16]);ctx.strokeStyle='rgba('+C_.off+',0.25)';ctx.lineWidth=3;ctx.stroke();ctx.setLineDash([])}}
  SR.nodes.forEach((n,i)=>{if(n.fixed&&!n.isle)return;const on=(SR.links[i-1]||{}).on||(SR.links[i]||{}).on;
    ctx.strokeStyle='rgba('+C_.rim+','+(on?0.6+0.25*pl:0.25)+')';ctx.lineWidth=on?5:3;
    if(n.isle){ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,7)}else srShape(n,n.x,n.y-n.h,n.r);ctx.stroke()});
  ctx.restore();
}
// תלת-ממד: סלע עם גג שטוח ותחתית מחודדת שנעלמת בתהום. נבנה פעם אחת, וזז כל פריים
function sr3d(G,reg){
  if(reg!==SROCKS.reg||!SR.nodes)return;const S_=SIN(),K=SROCKS;
  if(!G.sr){G.sr=[];const top=new THREE.MeshLambertMaterial({color:K.col.top,flatShading:true}),body=new THREE.MeshLambertMaterial({color:K.col.stone,flatShading:true}),
      glow=new THREE.MeshBasicMaterial({color:'rgb('+K.col.rim+')',toneMapped:false,fog:false});
    for(const n of SR.nodes){if(n.fixed)continue;const g=new THREE.Group(),r=n.r;
      const rot=hash(n.k,7)*6.28,a=new THREE.Mesh(new THREE.CylinderGeometry(r,r*0.85,14,9),top);a.position.y=-7;a.rotation.y=rot;g.add(a);
      const b=new THREE.Mesh(new THREE.ConeGeometry(r*0.85,90,7),body);b.rotation.set(Math.PI,rot,0);b.position.y=-59;g.add(b);
      const c=new THREE.Mesh(new THREE.OctahedronGeometry(10),glow);c.position.y=-100;g.add(c);   // גביש קטן מתחת, זוהר
      g.scale.set(1,1,1/S_);G.g.add(g);G.sr.push([g,n])}}
  for(const [g,n] of G.sr){g.position.set(n.x,K.bob.y+n.h,n.y/S_);g.visible=Math.abs(n.x-S.cam.x)+Math.abs(n.y-S.cam.y)<TERRAIN.cull*1.4}
}
