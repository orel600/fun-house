/* משחקי השאול: אפקטים פיצוציים (אוראל, 3.11.2026: "צריך דברים פיצוציים יותר"). התוכנית: docs/moba.md
   חלקיקים שעפים ונופלים, גל הדף, הבזק, רעידת מסך במידה, עצירת פריים קצרה (hitstop) במכה חזקה של השחקן,
   מספרי נזק גדולים בקריטי ובסקילים, ורגע דרמטי בסקיל-על של השחקן (האטה, מסך כהה בקצוות ושם הסקיל).
   הכל בקנבס, מעל הדו-ממד וגם מעל התלת-ממד (VFX3D כבוי במובה בכוונה). המצב יושב ב-MB.fxs, ומתאפס עם כל משחק.
   מתחבר ל-moba.js בשורה בכל מקום: mbfxTime (עדכון), mbfxBoom (mbBoom), mbfxNum (mbDmg), mbfxDraw ו-mbfxScreen (ציור).
   הסקילים (moba-kits.js) קוראים ל-mbfxSlam/Blast/Spin/Dust/Ult. ביצועים בטלפון: מספר החלקיקים והמספרים מוגבל */
const MBFX={
  max:140,            // חלקיקים לכל היותר על המסך
  nums:18,            // מספרים גדולים לכל היותר
  per:{min:6,max:18,r:9},   // חלקיקים לפיצוץ: אחד לכל r פיקסלים של רדיוס, בין min ל-max
  grav:900,           // כוח משיכה לחלקיקים (פיקסלים לשנייה בריבוע)
  stop:{t:0.07,need:85,cool:0.3},   // עצירת פריים: מכה של need ומעלה (או קריטי) של השחקן או עליו. cool: לא יותר מפעם ב-cool שניות
  slow:{t:0.55,k:0.3},              // סקיל-על של השחקן: חצי שנייה בהילוך איטי (×0.3)
  ult:{t:1.2,dark:0.45,y:0.8},      // כמה זמן שם הסקיל-על על המסך, כמה כהים הקצוות, ובאיזה גובה (למטה באמצע: ההודעות למעלה, והקרב במרכז)
  flash:{t:0.18,a:0.32},            // הבזק לבן-צבעוני על כל המסך
  shake:{hit:2.5,slam:6,ult:7,max:9},   // רעידה: מכה חזקה, נחיתה/פיצוץ, סקיל-על. max: לא יותר מזה אף פעם
  near:80,            // אפקטים של בוטים רועדים ומבזיקים רק כשהם על המסך (עם השוליים האלה)
};
const mbfxS=()=>MB.fxs||(MB.fxs={p:[],n:[],stop:0,stopCd:0,slow:0,flash:0,fcol:'#fff',ult:null});
const mbfxMe=()=>MB.me&&!MB.me.bot;   // שחקן אמיתי (בבדיקת האיזון וב-check.js גם השחקן בוט: בלי האטות)
const mbfxSeen=(x,y)=>Math.abs(x-S.cam.x)<W/2+MBFX.near&&Math.abs(y-S.cam.y)<H/2+MBFX.near;
function mbfxShake(v){S.shake=Math.min(MBFX.shake.max,Math.max(S.shake,v))}
function mbfxFlash(col,k=1){const F=mbfxS();F.flash=MBFX.flash.t*k;F.fcol=col}

// הזמן: עצירת פריים מחזירה 0 (העולם קופא לרגע), והילוך איטי מקטין את dt. החלקיקים זזים לפי הזמן שאחרי
function mbfxTime(dt){
  const F=mbfxS();F.flash=Math.max(0,F.flash-dt);F.stopCd-=dt;if(F.ult)F.ult.t-=dt;
  if(F.stop>0){F.stop-=dt;return 0}
  if(F.slow>0){F.slow-=dt;dt*=MBFX.slow.k}
  for(const p of F.p){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vz-=MBFX.grav*p.g*dt;p.z=Math.max(0,p.z+p.vz*dt);p.vx*=1-dt*p.drag;p.vy*=1-dt*p.drag}
  F.p=F.p.filter(p=>p.life>0);
  for(const n of F.n){n.life-=dt;n.y-=dt*(n.crit?40:30)}F.n=F.n.filter(n=>n.life>0);
  for(const u of MB.u)if(u.st.dash&&!u.dead&&Math.random()<0.6)mbfxPart(u.x+rand(-8,8),u.y+rand(-4,4),0,rand(-40,40),rand(-20,20),rand(20,60),'#B9AE9E',0.35,3.5,1.5,0.5);   // אבק מאחורי זינוק
  return dt;
}
// חלקיק אחד. z: גובה מעל הרצפה (מצויר כ-y-z). g: כמה כוח המשיכה משפיע. drag: האטה
function mbfxPart(x,y,z,vx,vy,vz,col,life,size,drag=1,g=1){const F=mbfxS();if(F.p.length>=MBFX.max)return;F.p.push({x,y,z,vx,vy,vz,col,life,t0:life,size,drag,g})}
function mbfxSpray(x,y,n,sp,up,col,life,size){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(0.35+0.65*Math.random());mbfxPart(x,y,4,Math.cos(a)*v,Math.sin(a)*v*0.6,up*(0.4+0.6*Math.random()),col,life*(0.7+0.5*Math.random()),size*(0.7+0.6*Math.random()),1.4)}}

// כל פיצוץ (mbBoom): ניצוצות בצבע סוג הנזק, ובפיצוץ גדול גם רסיסים לבנים
function mbfxBoom(x,y,r,col){
  const P=MBFX.per,n=Math.max(P.min,Math.min(P.max,Math.round(r/P.r)));
  mbfxSpray(x,y,n,r*2.6,260,col,0.55,4);
  if(r>=90)mbfxSpray(x,y,Math.round(n/3),r*3.2,420,'#FFF4D8',0.4,3);
}
// נחיתה כבדה (סדן, חומת ברזל): גל הדף כפול, רסיסי אבן, הבזק ורעידה כשרואים
function mbfxSlam(u,r,dt){
  const col=dtCol(dt);if(MB.fx.length<40)MB.fx.push({x:u.x,y:u.y,r:r*1.25,col:'#FFF4D8',life:0.45});
  mbfxSpray(u.x,u.y,10,r*2,520,'#8A7F70',0.8,6);
  if(mbfxSeen(u.x,u.y)){mbfxShake(MBFX.shake.slam);mbfxFlash(col,0.7)}
}
// פיצוץ של סקיל-על באזור (סופת קרח, מטח אחרון)
function mbfxBlast(x,y,r,col){
  if(MB.fx.length<40)MB.fx.push({x,y,r:r*1.2,col:'#fff',life:0.45});
  mbfxSpray(x,y,12,r*2.2,480,col,0.7,5);
  if(mbfxSeen(x,y)){mbfxShake(MBFX.shake.slam);mbfxFlash(col,0.8)}
}
// סיבוב חרב: ניצוצות שעפים בקשת מסביב
function mbfxSpin(u,r){for(let i=0;i<12;i++){const a=i/12*6.283;mbfxPart(u.x+Math.cos(a)*r*0.7,u.y+Math.sin(a)*r*0.4,14,-Math.sin(a)*360,Math.cos(a)*200,80,'#FFF4D8',0.35,3.5,2,0.3)}}
// זינוק של תקיפה רגילה: ענן אבק קטן ברגליים
function mbfxDust(u){mbfxSpray(u.x,u.y,5,90,60,'#B9AE9E',0.45,4)}
// סקיל-על: לשחקן רגע דרמטי (הילוך איטי, הבזק, שם הסקיל), ולבוט שרואים רק הבזק ורעידה
function mbfxUlt(u,s){
  const F=mbfxS(),col=dtCol(s.dt||MBKIT[u.kit].dt);
  if(MB.fx.length<40)MB.fx.push({x:u.x,y:u.y,r:170,col,life:0.45});
  mbfxSpray(u.x,u.y,14,320,520,col,0.8,5);
  if(u.me&&mbfxMe()){F.slow=MBFX.slow.t;F.ult={txt:T('mb.s.'+s.id).split(/[:：]/)[0],col,t:MBFX.ult.t};mbfxShake(MBFX.shake.ult);mbfxFlash(col)}
  else if(mbfxSeen(u.x,u.y)){mbfxShake(MBFX.shake.hit);mbfxFlash(col,0.5)}
}
// מספר נזק גדול (קריטי או סקיל). מכה חזקה של השחקן או עליו: עצירת פריים ורעידה קטנה. בא במקום mbFloat (אותם פרמטרים, ועוד o, src, t)
function mbfxNum(x,y,txt,col,o,src,t){
  const F=mbfxS();if(F.n.length>=MBFX.nums||!(t&&t.k==='hero'||src===MB.me))return mbFloat(x,y,txt,col);   // גדול רק על גיבור, או של השחקן
  const stack=F.n.filter(n=>n.life>0.55&&Math.abs(n.x-x)<40&&Math.abs(n.y-y)<40).length;x+=rand(-14,14);y-=stack*20;   // כמה מכות באותו מקום: אחד מעל השני, לא אחד על השני
  F.n.push({x,y,txt:String(txt)+(o.crit?'!':''),col:o.crit&&!(t&&t.me)?C.gold:col,life:1,crit:!!o.crit});
  if(o.crit)mbfxSpray(x,y+18,5,160,160,C.gold,0.35,3);
  const mine=mbfxMe()&&(src===MB.me||t===MB.me);
  if(mine&&(o.crit||+txt>=MBFX.stop.need)&&F.stopCd<=0){F.stop=MBFX.stop.t;F.stopCd=MBFX.stop.cool;mbfxShake(MBFX.shake.hit)}
}

/* ---- ציור ---- */
// בעולם (אחרי ה-translate של המצלמה): מגנים, חלקיקים, ומספרים גדולים
function mbfxDraw(){
  const F=mbfxS();
  for(const u of MB.u)if(!u.dead&&u.st.shield>0&&u.st.shieldEnd>MB.t){   // מגן: בועה בצבע הקבוצה, דוהה ככל שנשאר פחות
    const k=Math.max(0.25,u.st.shield/(u.st.shieldMax||u.st.shield)),col=MOBA.team[u.team];
    ctx.globalAlpha=0.16*k+0.06;ctx.fillStyle=col;ctx.beginPath();ctx.arc(u.x,u.y-22,u.r+16,0,7);ctx.fill();
    ctx.globalAlpha=0.5*k+0.2;ctx.strokeStyle='#E8F4FF';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,u.y-22,u.r+16,-2.6+MB.t*2,-0.6+MB.t*2);ctx.stroke()}
  ctx.globalCompositeOperation='lighter';
  for(const p of F.p){const k=p.life/p.t0;ctx.globalAlpha=Math.min(1,k*1.6);ctx.fillStyle=p.col;const s=p.size*(0.4+0.6*k);ctx.fillRect(p.x-s/2,p.y-p.z-s/2,s,s)}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.direction='ltr';ctx.lineJoin='round';
  for(const n of F.n){const age=1-n.life,pop=age<0.12?1+(0.12-age)*5:1,sz=(n.crit?28:22)*pop;
    ctx.globalAlpha=Math.min(1,n.life*2.5);ctx.font='900 '+Math.round(sz)+'px Heebo, system-ui, sans-serif';
    ctx.lineWidth=4;ctx.strokeStyle='#0B0A12';ctx.strokeText(n.txt,n.x,n.y);ctx.fillStyle=n.col;ctx.fillText(n.txt,n.x,n.y)}
  ctx.globalAlpha=1;ctx.direction=DIR;
}
// על כל המסך (אחרי setTransform): הבזק, ובסקיל-על של השחקן קצוות כהים ושם הסקיל
function mbfxScreen(){
  const F=mbfxS();
  if(F.flash>0){ctx.globalAlpha=MBFX.flash.a*F.flash/MBFX.flash.t;ctx.fillStyle=F.fcol;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1}
  const U=F.ult;if(!U||U.t<=0)return;
  const k=Math.min(1,U.t/0.3,(MBFX.ult.t-U.t)/0.12+0.2);
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.7);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(6,4,14,'+MBFX.ult.dark*k+')');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const sz=Math.round(34*(1+0.25*Math.max(0,1-(MBFX.ult.t-U.t)/0.15)));
  ctx.globalAlpha=k;ctx.textAlign='center';ctx.direction=DIR;ctx.font='900 '+sz+'px Heebo, system-ui, sans-serif';ctx.lineJoin='round';
  const ty=H*MBFX.ult.y;ctx.lineWidth=6;ctx.strokeStyle='#0B0A12';ctx.strokeText(U.txt,W/2,ty);ctx.fillStyle=U.col;ctx.fillText(U.txt,W/2,ty);
  ctx.fillStyle='#FFF4D8';ctx.fillRect(W/2-90*k,ty+12,180*k,3);ctx.globalAlpha=1;
}
