/* אויבים בעולם עם התנהגות שרואים ומבינים (ניר ואוראל, 1.11.2026: "האויבים משעממים", "מעט מדי אקשן על המסך"). Claude מוביל.
   לכל סוג אויב בעולם תפקיד אחד, וכל מתקפה גדולה מסומנת קודם על הרצפה באדום, כדי שיהיה ממה להתחמק בתנועה (אין כפתור התחמקות):
   - flank (שלדים): לא באים בשורה אחת. כל אחד מתקרב מצד אחר, והקבוצה מקיפה אותך.
   - charge (אבירים ומגינים): נעצר, פס אדום על הרצפה לכיוון שלך מתמלא, ואז מסתער לאורכו. צעד הצידה = התחמקת. אחרי ההסתערות מסוחרר לרגע: זה הזמן להכות.
   - ranged (מרחפים): שומרים מרחק, קו אדום מראה לאן הירייה תטוס, ואז חץ קסם מהיר לאורכו.
   - leap (חלק מהשלדים הרחוקים, עקרבים): עיגול אדום על המקום שלך מתמלא, והאויב קופץ ונוחת עליו.
   - caller (תכונה, לא סוג): כשנפצע, בורח ותוקע בקרן (טבעת צהובה מתמלאת). הפלת אותו לפני הסוף = אין תגבורת. לא הספקת: מגיעים חברים, וכל מי שקרוב מתעורר.
   ליד השער (אזור start) הכל איטי יותר, ואין קפיצות או קוראים, כדי לא לשבור את "עשר הדקות הראשונות" (#169, #172).
   החיבור: foeAi מ-wFoes ב-world.js (קבוצות ולהקות), foeAiDraw מהציור של העולם. מכה רגילה מקרוב נשארת של strike.js.
   רק בעולם. הזירה לא קוראת לקובץ הזה. כל המספרים באובייקט FOEAI */

const FOEAI={
  kinds:{grunt:'flank',shield:'charge',drowned:'charge',rimeknight:'charge',stormknight:'charge',shadeknight:'charge',cinderscorp:'leap',
         wisp:'ranged',mistling:'ranged',frostwraith:'ranged',flamewisp:'ranged',sparkwisp:'ranged',shadewisp:'ranged'},
  leapChance:{start:0,near:0.25,far:0.4},   // שלד שקופץ במקום להקיף
  callChance:{start:0,near:0.1,far:0.16},   // הסיכוי שאויב הוא "קורא"
  startWind:1.5,                            // ליד השער: כל הכנה ארוכה פי כך
  far:600,                                  // רחוק מזה: ההתנהגות הרגילה (לחזור הביתה, להקה שנעלמת)
  col:'#FF4D4D',
  flank:{r:85,turn:0.35,close:60},          // r: באיזה מרחק מסביבך כל אחד מחפש את הצד שלו. close: קרוב מזה, רודף ישר ומכה (strike.js)
  charge:{min:120,max:300,wind:0.8,speed:560,len:380,w:24,dmg:1.4,daze:0.8,cd:[3,4.5]},
  ranged:{keep:210,band:50,range:330,wind:0.6,speed:360,r:7,dmg:1,cd:[2,3],strafe:0.55},
  leap:{min:90,max:250,wind:0.75,r:54,dur:0.4,dmg:1.3,cd:[3.5,5]},
  call:{at:0.5,flee:1.3,fleeSpd:1.35,r:450,alert:6,friends:2,col:'#FFD84D'}
};

const aiCd=e=>e.acd=rand(...FOEAI[e.ai].cd);
const aiWind=(e,t)=>t*(e.zone==='start'?FOEAI.startWind:1);
// פעם אחת לכל אויב: מה התפקיד שלו
function foeAiInit(e){
  const A=FOEAI,z=e.zone||'near';
  e.ai=A.kinds[e.type]||'flank';
  if(e.ai==='flank'&&Math.random()<(A.leapChance[z]||0))e.ai='leap';
  if(A[e.ai].cd)e.acd=rand(0.6,A[e.ai].cd[1]);
  e.fa=Math.atan2(e.y-P.y,e.x-P.x)+rand(-1.3,1.3);e.sd=Math.random()<0.5?1:-1;   // הצד שממנו הוא מקיף, ולאיזה כיוון הוא מסתובב
  if(!e.split&&Math.random()<(A.callChance[z]||0))e.caller=1;
}
// כל פריים, לאויב בעולם שרודף (wFoes ב-world.js). d: המרחק לשחקן.
// מחזיר true כשהתנועה של הפריים טופלה כאן (הכנה, הסתערות, קפיצה, בריחה, ירי מרחוק), אחרת false וממשיכים כרגיל
function foeAi(e,dt,d){
  if(e.creature||e.warden||e.wanted)return false;
  if(e.ai==null)foeAiInit(e);
  const A=FOEAI,dx=P.x-e.x,dy=P.y-e.y,k=slowK(e);
  if(e.act){aiAct(e,dt*(k||0),d);return true}           // באמצע פעולה: קפוא = הכל עוצר
  if(e.caller===1&&e.hp<e.max*A.call.at){e.caller=2;e.act='flee';e.at=aiWind(e,A.call.flee);e.am=e.at;return true}
  if(d>A.far||e.sw>0||!k)return false;
  if(e.acd>0)e.acd-=dt;
  const sp=e.speed*k;
  if(e.ai==='charge'){const C=A.charge;if(e.acd<=0&&d>C.min&&d<C.max){aiStart(e,'wind',C.wind);return true}return false}
  if(e.ai==='leap'){const L=A.leap;if(e.acd<=0&&d>L.min&&d<L.max){aiStart(e,'crouch',L.wind);e.tx=P.x;e.ty=P.y;e.sx=e.x;e.sy=e.y;return true}}
  if(e.ai==='ranged'){const R=A.ranged;
    if(e.acd<=0&&d<R.range){aiStart(e,'aim',R.wind);return true}
    // שומר מרחק, וזז הצידה כדי שלא יעמוד במקום
    const rad=d>R.keep+R.band?1:d<R.keep-R.band?-1:0,side=(e.sd||1)*R.strafe;
    e.x+=(dx/d*rad-dy/d*side)*sp*dt;e.y+=(dy/d*rad+dx/d*side)*sp*dt;return true}
  if(e.ai==='flank'||e.ai==='leap'){const F=A.flank;
    if(d<F.r+F.close)return false;                       // קרוב: רודף ישר ומכה (strike.js)
    e.fa+=F.turn*dt*(e.sd||1);
    const tx=P.x+Math.cos(e.fa)*F.r-e.x,ty=P.y+Math.sin(e.fa)*F.r-e.y,td=Math.hypot(tx,ty)||1;
    e.x+=tx/td*sp*dt;e.y+=ty/td*sp*dt;return true}
  return false;
}
// אחרי foeAi שטיפל בתנועה: הדיפה, אנימציה, הבזק ומים, כמו בתנועה הרגילה
function foeAiTail(e,dt){e.x+=e.kx*dt;e.y+=e.ky*dt;const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;if(e.pack)e.far=0;wPonds(e)}
function aiStart(e,act,t){e.act=act;e.at=e.am=aiWind(e,t);e.aa=Math.atan2(P.y-e.y,P.x-e.x);e.hitP=false}
// הפעולה עצמה. dt כבר מוכפל במהירות (קפוא: 0)
function aiAct(e,dt,d){
  const A=FOEAI;e.at-=dt;e.flash=Math.max(e.flash||0,e.act==='flee'?0:0.04);
  if(e.act==='wind'&&e.at<=0){e.act='dash';e.at=A.charge.len/A.charge.speed;sfx('ui')}
  else if(e.act==='dash'){const C=A.charge,s=C.speed*dt;e.x+=Math.cos(e.aa)*s;e.y+=Math.sin(e.aa)*s;placeClamp(e);
    if(!e.hitP&&Math.hypot(P.x-e.x,P.y-e.y)<e.r+P.r+6){e.hitP=true;hurt(e.dmg*C.dmg)}
    if(Math.random()<0.5)sparks(e.x,e.y,'#C9B79A',1,60);
    if(e.at<=0){if(!e.hitP)e.dodged=(e.dodged||0)+1;e.act='daze';e.at=C.daze}}
  else if(e.act==='aim'&&e.at<=0){const R=A.ranged;eb.push({x:e.x,y:e.y,vx:Math.cos(e.aa)*R.speed,vy:Math.sin(e.aa)*R.speed,r:R.r,dmg:e.dmg*R.dmg,life:R.range*1.6/R.speed});e.act=null;aiCd(e)}
  else if(e.act==='crouch'&&e.at<=0){e.act='jump';e.at=e.am=A.leap.dur;e.sx=e.x;e.sy=e.y}
  else if(e.act==='jump'){const L=A.leap,k=1-Math.max(0,e.at)/e.am;e.x=e.sx+(e.tx-e.sx)*k;e.y=e.sy+(e.ty-e.sy)*k;
    if(e.at<=0){e.act=null;aiCd(e);sparks(e.x,e.y,'#C9B79A',12,220);S.shake=Math.max(S.shake,4);
      if(Math.hypot(P.x-e.tx,P.y-e.ty)<L.r+P.r*0.5)hurt(e.dmg*L.dmg);else e.dodged=(e.dodged||0)+1}}
  else if(e.act==='flee'){const C=A.call,dx=e.x-P.x,dy=e.y-P.y,dd=Math.hypot(dx,dy)||1,sp=e.speed*C.fleeSpd*dt;
    e.x+=dx/dd*sp;e.y+=dy/dd*sp;placeClamp(e);
    if(e.at<=0){e.act=null;aiCall(e)}}
  else if(e.act==='daze'&&e.at<=0){e.act=null;aiCd(e)}
}
// הקורא תקע בקרן: מי שקרוב מתעורר ורודף, ומגיעים חברים מאחוריו
function aiCall(e){
  const C=FOEAI.call;e.called=1;
  for(const o of enemies)if(!o.dead&&o!==e&&!o.creature&&Math.hypot(o.x-e.x,o.y-e.y)<C.r)o.alert=C.alert;
  const n=Math.min(C.friends,paceFree()),a0=Math.atan2(e.y-P.y,e.x-P.x);
  for(let i=0;i<n;i++){const a=a0+rand(-0.8,0.8),x=e.x+Math.cos(a)*rand(60,110),y=e.y+Math.sin(a)*rand(60,110);
    const f=addEnemy(e.type,x,y,1);f.hp=f.max=e.max;f.dmg=e.dmg;f.speed=e.speed;f.zone=e.zone;f.xp=0;f.home=0;f.elite=false;f.far=0;f.wind=e.wind;
    if(e.pack){f.pack=e.pack;e.pack.n++;e.pack.left++}else f.pack={id:-1,x,y,n:1,left:1,big:false};
    sparks(x,y,C.col,10,200)}
  sparks(e.x,e.y,C.col,18,260);S.shake=Math.max(S.shake,3);
}
// ציור על הרצפה, לפני הדמויות (world.js): כל מה שעומד לפגוע מסומן באדום, והקרן בצהוב
function foeAiDraw(){
  const A=FOEAI,t=fxNow();
  for(const e of enemies){if(e.dead||!e.act)continue;const k=e.am?1-Math.max(0,e.at)/e.am:1;
    ctx.save();
    if(e.act==='wind'){const C=A.charge;ctx.translate(e.x,e.y);ctx.rotate(e.aa);
      ctx.globalAlpha=0.2;ctx.fillStyle=A.col;ctx.fillRect(0,-C.w,C.len,C.w*2);
      ctx.globalAlpha=0.5+0.35*k;ctx.fillRect(0,-C.w,C.len*k,C.w*2);
      ctx.globalAlpha=0.9;ctx.strokeStyle=A.col;ctx.lineWidth=2;ctx.strokeRect(0,-C.w,C.len,C.w*2)}
    else if(e.act==='aim'){const R=A.ranged;ctx.translate(e.x,e.y);ctx.rotate(e.aa);
      ctx.globalAlpha=0.35+0.5*k;ctx.strokeStyle=A.col;ctx.lineWidth=2+3*k;ctx.setLineDash([12,8]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(R.range,0);ctx.stroke();ctx.setLineDash([])}
    else if(e.act==='crouch'||e.act==='jump'){const L=A.leap,kk=e.act==='jump'?1:k;
      ctx.globalAlpha=0.2;ctx.fillStyle=A.col;ctx.beginPath();ctx.arc(e.tx,e.ty,L.r,0,7);ctx.fill();
      ctx.globalAlpha=0.45+0.4*kk;ctx.beginPath();ctx.arc(e.tx,e.ty,L.r*kk,0,7);ctx.fill();
      ctx.globalAlpha=0.9;ctx.strokeStyle=A.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.tx,e.ty,L.r,0,7);ctx.stroke()}
    else if(e.act==='flee'){const C=A.call,p=0.5+0.5*Math.sin(t*14);
      ctx.globalAlpha=0.25+0.3*p;ctx.strokeStyle=C.col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.r+10,0,7);ctx.stroke();
      ctx.globalAlpha=0.85;ctx.lineWidth=4;ctx.beginPath();ctx.arc(e.x,e.y,e.r+18,-Math.PI/2,-Math.PI/2+k*Math.PI*2);ctx.stroke()}
    else if(e.act==='daze'){ctx.globalAlpha=0.9;ctx.fillStyle=C.gold;for(let i=0;i<3;i++){const a=t*6+i*2.1;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*e.r,e.y-e.r-8+Math.sin(a)*4,3,0,7);ctx.fill()}}
    ctx.restore()}
  ctx.globalAlpha=1;
}
// מעל הראש (במסך): קורא שבורח מקבל "!" צהוב, כדי שיהיה ברור שהוא המטרה עכשיו
function foeAiScreen(ox,oy){
  ctx.textAlign='center';ctx.font='900 '+(20/ZOOM)+'px Heebo, system-ui, sans-serif';ctx.fillStyle=FOEAI.call.col;
  for(const e of enemies)if(!e.dead&&e.act==='flee'){const x=e.x+ox,y=e.y+oy-e.r-34;if(onScreen(x,y))ctx.fillText('!',x,y)}
}
