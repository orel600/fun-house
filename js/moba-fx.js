/* משחקי השאול: אפקטים פיצוציים (אוראל, 3.11.2026: "צריך דברים פיצוציים יותר"). התוכנית: docs/moba.md
   חלקיקים שעפים ונופלים, גל הדף, הבזק, רעידת מסך במידה, עצירת פריים קצרה (hitstop) במכה חזקה של השחקן,
   מספרי נזק גדולים בקריטי ובסקילים, ורגע דרמטי בסקיל-על של השחקן (האטה, מסך כהה בקצוות ושם הסקיל).
   הכל בקנבס, מעל הדו-ממד וגם מעל התלת-ממד (VFX3D כבוי במובה בכוונה). המצב יושב ב-MB.fxs, ומתאפס עם כל משחק.
   מתחבר ל-moba.js בשורה בכל מקום: mbfxTime (עדכון), mbfxBoom (mbBoom), mbfxNum (mbDmg), mbfxDraw ו-mbfxScreen (ציור).
   הסקילים (moba-kits.js) קוראים ל-mbfxSlam/Blast/Spin/Dust/Ult/Cleave/Hit/Bubble. רשת וגל חרב מצוירים כאן (mbfxShots), וגם הסימנים של לכוד ומורם (mbfxMarks). ביצועים בטלפון: מספר החלקיקים והמספרים מוגבל */
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
  // הסקילים שהחליפו זינוק וריפוי (6.11.2026): גל חרב, רשת ציד, כלא מים. הצבעים: סוג הנזק, והרשת חבל
  net:{col:'#D9C39A',cells:4,close:0.25},   // רשת: צבע החבל, כמה משבצות, וכמה שניות היא נסגרת על מי שנתפס
  bubble:{col:'#7FD3FF',r:30},              // בועת המים סביב מי שהורם
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
// גל חרב: הבזק של החרב, אבק לאורך הקו (הקשת עצמה היא ה-shot, מצוירת ב-mbfxShots)
function mbfxCleave(u,ang,s){
  const c=Math.cos(ang),n=Math.sin(ang);
  for(let i=0;i<8;i++){const d=rand(20,s.range),o=rand(-s.w/2,s.w/2);mbfxPart(u.x+c*d-n*o,u.y+n*d+c*o,2,c*rand(60,160),n*rand(60,160),rand(80,200),'#B9AE9E',0.5,4,1.5)}
  if(mbfxSeen(u.x,u.y))mbfxShake(MBFX.shake.hit);
}
// פגיעה של גל חרב או של רשת: ניצוצות על מי שנפגע
function mbfxHit(o,kind){
  if(kind==='net'){(MBFX_N(o).netT=MB.t);mbfxSpray(o.x,o.y,6,120,140,MBFX.net.col,0.45,3);if(mbfxSeen(o.x,o.y))mbfxShake(MBFX.shake.hit);return}
  mbfxSpray(o.x,o.y-14,7,220,240,'#FFF4D8',0.4,3.5);
}
const MBFX_N=o=>o.fxs||(o.fxs={});
// כלא מים: עמוד מים שפורץ מהרצפה, טיפות למעלה, הבזק כחול
function mbfxBubble(x,y,r){
  if(MB.fx.length<40)MB.fx.push({x,y,r:r*1.15,col:MBFX.bubble.col,life:0.5});
  for(let i=0;i<14;i++){const a=i/14*6.283;mbfxPart(x+Math.cos(a)*r*0.8,y+Math.sin(a)*r*0.45,4,Math.cos(a)*40,Math.sin(a)*25,rand(380,620),i%2?'#BFE9FF':dtCol('water'),0.8,4.5,0.8,1)}
  if(mbfxSeen(x,y)){mbfxShake(MBFX.shake.hit);mbfxFlash(dtCol('water'),0.5)}
}
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
  if(o.crit){mbfxSpray(x,y+18,5,160,160,C.gold,0.35,3);mbfxPush(F.top||(F.top=[]),'dmg_crit',x,y-30,{size:110,alpha:0.95})}   // CRIT! מאחורי המספר (MBLIB)
  const mine=mbfxMe()&&(src===MB.me||t===MB.me);
  if(mine&&(o.crit||+txt>=MBFX.stop.need)&&F.stopCd<=0){F.stop=MBFX.stop.t;F.stopCd=MBFX.stop.cool;mbfxShake(MBFX.shake.hit)}
}

/* ---- ציור ---- */
// בעולם (אחרי ה-translate של המצלמה): מגנים, חלקיקים, ומספרים גדולים
function mbfxDraw(){
  const F=mbfxS();
  for(const u of MB.u)if(!u.dead&&mbShow(u)&&u.st.shield>0&&u.st.shieldEnd>MB.t){   // מגן: בועה בצבע הקבוצה, דוהה ככל שנשאר פחות
    const k=Math.max(0.25,u.st.shield/(u.st.shieldMax||u.st.shield)),col=MOBA.team[u.team];
    ctx.globalAlpha=0.16*k+0.06;ctx.fillStyle=col;ctx.beginPath();ctx.arc(u.x,u.y-22,u.r+16,0,7);ctx.fill();
    ctx.globalAlpha=0.5*k+0.2;ctx.strokeStyle='#E8F4FF';ctx.lineWidth=2;ctx.beginPath();ctx.arc(u.x,u.y-22,u.r+16,-2.6+MB.t*2,-0.6+MB.t*2);ctx.stroke()}
  mbfxUnits();mbfxMarks();mbfxShots();
  ctx.globalCompositeOperation='lighter';
  for(const p of F.p){if(!mbVisPt(p.x,p.y))continue;const k=p.life/p.t0;ctx.globalAlpha=Math.min(1,k*1.6);ctx.fillStyle=p.col;const s=p.size*(0.4+0.6*k);ctx.fillRect(p.x-s/2,p.y-p.z-s/2,s,s)}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  fxDrawList(F.top||(F.top=[]));   // סימני מצב ו-CRIT!, מתחת למספרים (MBLIB)
  ctx.textAlign='center';ctx.direction='ltr';ctx.lineJoin='round';
  for(const n of F.n){if(!mbVisPt(n.x,n.y))continue;const age=1-n.life,pop=age<0.12?1+(0.12-age)*5:1,sz=(n.crit?30:24)*pop*mbUiK();
    ctx.globalAlpha=Math.min(1,n.life*2.5);ctx.font='900 '+Math.round(sz)+'px Heebo, system-ui, sans-serif';
    ctx.lineWidth=5;ctx.strokeStyle='#0B0A12';ctx.strokeText(n.txt,n.x,n.y);ctx.fillStyle=n.col;ctx.fillText(n.txt,n.x,n.y)}
  ctx.globalAlpha=1;ctx.direction=DIR;
}
// סימנים על יחידות: רשת ושורשים ברגליים של מי שלכוד (st.root), ובועת מים סביב מי שהורם (st.bub). בקנבס, ולכן גם מעל התלת-ממד
function mbfxMarks(){
  const N=MBFX.net;
  for(const u of MB.u){if(u.dead||!mbShow(u))continue;const s=u.st;   // בערפל: לא מצויר (moba-vision.js)
    if(s.root>0){const k=Math.min(1,(MB.t-(MBFX_N(u).netT||0))/N.close),rx=(u.r+18)*(1.6-0.6*k),ry=rx*0.45;   // הרשת נסגרת מגדולה לצמודה
      ctx.globalAlpha=Math.min(1,s.root*3);ctx.strokeStyle='#5C8A3A';ctx.lineWidth=3;   // שורשים קטנים שנאחזים בקרקע
      for(let i=0;i<6;i++){const a=i/6*6.283+0.4;ctx.beginPath();ctx.moveTo(u.x+Math.cos(a)*rx*0.6,u.y+Math.sin(a)*ry*0.6);ctx.quadraticCurveTo(u.x+Math.cos(a+0.3)*rx*1.1,u.y+Math.sin(a+0.3)*ry*1.1-8,u.x+Math.cos(a)*rx*1.15,u.y+Math.sin(a)*ry*1.15);ctx.stroke()}
      ctx.strokeStyle=N.col;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(u.x,u.y,rx,ry,0,0,7);ctx.stroke();   // הרשת: אליפסה עם חבלים לרוחב ולאורך, עולה על הרגליים
      for(let i=1;i<N.cells;i++){const f=i/N.cells*2-1,h=Math.sqrt(1-f*f);ctx.beginPath();ctx.moveTo(u.x+f*rx,u.y-h*ry);ctx.lineTo(u.x+f*rx*0.7,u.y-34*k+h*ry);ctx.stroke()}
      ctx.beginPath();ctx.ellipse(u.x,u.y-17*k,rx*0.8,ry*0.8,0,0,7);ctx.stroke();ctx.globalAlpha=1}
    if(s.bub>0){const B=MBFX.bubble,k=Math.min(1,s.bub*4,(1-s.bub)*6+0.3),r=(u.r+B.r*0.6)*(0.7+0.3*k),cy=u.y-22-14*k;
      ctx.globalAlpha=0.22*k;ctx.fillStyle=B.col;ctx.beginPath();ctx.arc(u.x,cy,r,0,7);ctx.fill();
      ctx.globalAlpha=0.8*k;ctx.strokeStyle='#E8F8FF';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(u.x,cy,r,0,7);ctx.stroke();
      ctx.lineWidth=3;ctx.beginPath();ctx.arc(u.x-r*0.3,cy-r*0.3,r*0.35,3.4,4.6);ctx.stroke();   // ברק על הבועה
      ctx.fillStyle='#E8F8FF';for(let i=0;i<3;i++){const t=(MB.t*1.4+i/3)%1;ctx.globalAlpha=0.7*k*(1-t);ctx.beginPath();ctx.arc(u.x+Math.sin(i*2.1+MB.t*3)*r*0.5,cy+r*0.6-t*r*1.4,2.5,0,7);ctx.fill()}
      ctx.globalAlpha=1}}
}
// הירייה של גל חרב (קשת לבנה-זהובה שמתרחבת) ושל רשת ציד (רשת פתוחה שמסתובבת)
function mbfxShots(){
  for(const s of MB.shots){if(!s.fx||!mbVisPt(s.x,s.y))continue;const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(s.x,s.y-10);ctx.rotate(a);
    if(s.fx==='cleave'){const w=s.w*0.95;ctx.globalCompositeOperation='lighter';
      for(let i=0;i<3;i++){ctx.globalAlpha=0.55-i*0.15;ctx.strokeStyle=i?dtCol(s.dt):'#FFF4D8';ctx.lineWidth=13-i*4;ctx.beginPath();ctx.arc(-i*16-w*0.6,0,w,-1,1);ctx.stroke()}
      ctx.globalCompositeOperation='source-over'}
    else{const N=MBFX.net,r=Math.max(10,s.w*0.7),sp=MB.t*9;ctx.rotate(sp);ctx.globalAlpha=0.95;ctx.strokeStyle=N.col;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();
      for(let i=0;i<N.cells;i++){const b=i/N.cells*Math.PI;ctx.beginPath();ctx.moveTo(Math.cos(b)*r,Math.sin(b)*r);ctx.lineTo(-Math.cos(b)*r,-Math.sin(b)*r);ctx.stroke()}
      ctx.beginPath();ctx.arc(0,0,r*0.5,0,7);ctx.stroke();
      ctx.fillStyle='#8A7F70';for(let i=0;i<4;i++){const b=i/4*6.283;ctx.beginPath();ctx.arc(Math.cos(b)*r,Math.sin(b)*r,3,0,7);ctx.fill()}}   // משקולות בקצוות
    ctx.restore();ctx.globalAlpha=1}
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

/* ---- משוב קרב מספריית האפקטים (אוראל, 7.11.2026: משחק עם כל 4 הגיבורים). fxlib.js, docs/fx.md ----
   תקיפה רגילה: יריה עפה (חץ, כדור, יריית חייל) או חיתוך, ופגיעה לפי סוג הנזק. מספרים גדולים עם קו מתאר, קריטי עם CRIT!,
   עליית רמה, סימני מצב מעל הראש כל עוד המצב נמשך (רטוב, בוער, קפוא, הלם...), הריגה, מגדל שנפגע ונופל, וטבעת זוהרת בצבע הקבוצה.
   הטבעות והסימנים חוזרים (loop) ולכן יושבים ברשימות משלהם (MB.fxs.under/top), כדי שאפקט חולף לא יזרוק אותם מ-FXLIB.list */
const MBLIB={
  shot:{hunter:'shot_arrow',mage:'shot_orb',minion:'shot_basic',size:{hunter:70,mage:46,minion:34}},
  hit:{physical:'hit',fire:'hit_fire',ice:'hit_ice',lightning:'hit_light',water:'hit_water',earth:'hit_earth',metal:'hit_metal'},
  hitSize:{hero:64,minion:40,crit:96},
  slash:96,                    // החיתוך של תקיפה מקרוב (טנק, לוחם, חייל קרוב)
  busy:52,                     // יותר מזה אפקטים חולפים בעולם: פגיעות של חיילים בחיילים מדלגים (FXLIB.max=70)
  lvl:{me:170,ally:100},       // עליית רמה: גדול לי, קטן לחבר
  ko:140,tower:{hit:110,fall:300,debris:220,hitCd:0.35,shake:2,barT:0.9},
  glow:{size:110,a:0.75},        // טבעת קבוצה מתחת לגיבור: עדינה
  st:{size:38,gap:30,y:72,over:36},   // y: גובה פס החיים מעל הרגליים, over: כמה מעליו (כפול mbUiK)    // סימני מצב: גודל, רווח ביניהם, וכמה מעל הרגליים (בפיקסלים של המשחק, כפול mbUiK)
  // מצב ← אפקט. הסדר הוא הסדר מעל הראש. לכוד ומורם: הרשת והבועה עצמן מצוירות ב-mbfxMarks, וכאן רק הסימן
  stOrder:[['ice','st_freeze'],['stun','st_stun'],['root','st_slow'],['wet','st_wet'],['burn','st_burn'],['slow','st_slow'],['exh','st_weak']],
  heal:{every:0.6,min:8,col:'#7BD88F'},   // מספרי ריפוי (בסיס, חיים מהנזק): מצטברים ויוצאים פעם ב-every שניות
};
const mbfxOn=(x,y)=>mbfxSeen(x,y)&&(typeof mbVisPt!=='function'||mbVisPt(x,y));
// אפקט חולף בעולם (בדיקה: MBFX.log סופר לפי שם)
function mbfxLib(id,x,y,o){if(!mbfxOn(x,y))return null;const f=fxPlay(id,x,y,o);if(f&&MBFX.log)MBFX.log[id]=(MBFX.log[id]||0)+1;return f}
function mbfxPush(list,id,x,y,o){const f=fxMake(id,x,y,o);if(f){list.push(f);if(MBFX.log)MBFX.log[id]=(MBFX.log[id]||0)+1}return f}
// יריה של תקיפה רגילה: האפקט עף עם היריה (follow) ונעלם כשהיא פוגעת
function mbfxShot(s,u){
  const k=u.k==='minion'?'minion':u.kit,id=MBLIB.shot[k];if(!id)return;
  const f=mbfxLib(id,s.x,s.y,{follow:s,loop:true,rot:Math.atan2(s.tgt.y-s.y,s.tgt.x-s.x),size:MBLIB.shot.size[k],add:true});
  if(f&&fxImg(id))s.lib=1;   // יש תמונה: בלי הנקודה של הקנבס
}
// פגיעה של תקיפה רגילה (מקרוב או יריה): התפוצצות לפי סוג הנזק. חייל בחייל רק כשאין עומס
function mbfxImpact(src,t,dt,crit,melee){
  if(!t||t.k==='tower'||t.k==='base')return;
  const hero=t.k==='hero'||src&&src.k==='hero';if(!hero&&FXLIB.list.length>MBLIB.busy)return;
  const S2=MBLIB.hitSize,y=t.y-t.r-6;
  if(melee&&src&&(src.k==='hero'||!(FXLIB.list.length>MBLIB.busy*0.7)))mbfxLib('slash',t.x,y,{rot:Math.atan2(t.y-src.y,t.x-src.x),size:MBLIB.slash*(src.k==='hero'?1:0.6),add:true});
  mbfxLib(crit?'hit_crit':MBLIB.hit[dt]||'hit',t.x,y,{size:crit?S2.crit:t.k==='hero'?S2.hero:S2.minion,add:true});
}
// עליית רמה: אני גדול, חבר קטן
function mbfxLevel(h){
  if(!h.me&&h.team!==MB.me.team)return;const s=h.me?MBLIB.lvl.me:MBLIB.lvl.ally;
  mbfxLib('levelup',h.x,h.y-30,{follow:h,dy:-30,size:s,add:true});
  if(mbfxOn(h.x,h.y))mbfxPush(mbfxS().under||(mbfxS().under=[]),'levelup_ring',h.x,h.y,{follow:h,size:s*0.8,add:true});
}
// גיבור נפל: ko על אויב, נשמה עולה על חבר
function mbfxKo(t){mbfxLib(t.team===MB.me.team?'ko_soul':'ko',t.x,t.y-24,{size:MBLIB.ko,add:t.team!==MB.me.team})}
// מגדל או בסיס נפגע: ניצוץ ורעידה קטנה (לא יותר מפעם ב-hitCd)
function mbfxTower(b){
  const T2=MBLIB.tower;if((b.fxHit||-9)>MB.t-T2.hitCd)return;b.fxHit=MB.t;
  if(mbfxLib('tower_hit',b.x+rand(-10,10),b.y-(b.k==='base'?70:50),{size:T2.hit,add:true}))mbfxShake(T2.shake);
}
// מגדל נפל: קריסה ורסיסים, ופס החיים מתפרק (mbfxBar)
function mbfxFall(b){const T2=MBLIB.tower;b.fallT=MB.t;mbfxLib('tower_fall',b.x,b.y-50,{size:T2.fall,add:true});mbfxLib('debris',b.x,b.y-20,{size:T2.debris})}
// מספר ריפוי ירוק: מצטבר, ויוצא פעם ב-every שניות
function mbfxHeal(u,v){
  if(!(v>0)||u.dead)return;u.healAcc=(u.healAcc||0)+v;const H=MBLIB.heal;
  if(u.healAcc>=H.min&&!((u.healAt||-9)>MB.t-H.every)){if(mbShow(u))mbFloat(u.x+rand(-6,6),u.y-u.r-30,'+'+Math.round(u.healAcc),H.col,u.k==='hero'?1.2:0.9);u.healAcc=0;u.healAt=MB.t}
}
// טבעות הקבוצה וסימני המצב: נבנים מחדש כשצריך, ונעצרים כשהמצב נגמר או שהיחידה יצאה מהמסך או מהראייה
function mbfxUnits(){
  const F=mbfxS(),U=F.under||(F.under=[]),Tp=F.top||(F.top=[]),L=MBLIB.st,uk=mbUiK(),alive=(f,l)=>f&&f.on&&l.includes(f);
  for(const u of MB.u){
    if(u.k!=='hero'&&u.k!=='minion')continue;const H=u.fxh||(u.fxh={});
    const on=!u.dead&&mbShow(u)&&mbfxSeen(u.x,u.y);
    if(u.k==='hero'){const want=on&&MBLIB.glow.a>0;
      if(want&&!alive(H.glow,U))H.glow=mbfxPush(U,u.team===MB.me.team?'glow_ally':'glow_enemy',u.x,u.y,{follow:u,loop:true,size:MBLIB.glow.size,alpha:MBLIB.glow.a,add:true,dy:2});
      else if(!want&&H.glow){fxStop(H.glow);H.glow=null}}
    const s=u.st,ids=[];
    if(on)for(const [k,id] of MBLIB.stOrder){const v=k==='stun'?s.stun>0&&!s.ice:k==='ice'?s.ice>0&&s.stun>0:s[k]>0;if(v&&!ids.includes(id))ids.push(id)}
    const top=u.k==='hero'?L.y+L.over*uk:L.y*0.62+L.over*0.5*uk;   // מעל תג הערכה (גיבור) או מעל פס החיים (חייל)
    for(const id in H){if(id==='glow')continue;if(!ids.includes(id)){fxStop(H[id]);delete H[id]}}
    ids.forEach((id,i)=>{let f=H[id];if(!alive(f,Tp))f=H[id]=mbfxPush(Tp,id,u.x,u.y,{follow:u,loop:true,size:L.size*uk,add:id!=='st_slow'&&id!=='st_weak'});
      if(f){f.dx=(i-(ids.length-1)/2)*L.gap*uk;f.dy=-top;f.size=L.size*uk*(u.k==='hero'?1:0.8)}});
  }
}
// פס חיים של מבנה שנפל: מתפרק לשני חצאים שנופלים ודוהים (נקרא מ-mobaDraw)
function mbfxBar(b,col){
  const k=(MB.t-b.fallT)/MBLIB.tower.barT;if(!(k>=0&&k<1))return;
  const base=b.k==='base',bw=base?84:60,top=b.y-(base?96:74)-(base?48:38),uk=mbUiK(),dy=k*k*60,a=1-k;
  ctx.save();ctx.translate(b.x,top+8);ctx.scale(uk,uk);ctx.globalAlpha=a;
  for(const sd of [-1,1]){ctx.save();ctx.translate(sd*bw/4+sd*k*18,dy-8);ctx.rotate(sd*k*0.9);ctx.fillStyle='#000a';ctx.fillRect(-bw/4-1,-1,bw/2+2,8);ctx.fillStyle=k<0.15?col:'#fff';ctx.fillRect(-bw/4,0,bw/2*(1-k),6);ctx.restore()}
  ctx.restore();
}
