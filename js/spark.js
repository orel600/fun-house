/* הניצוץ (אוראל, 1.11.2026): ערכת מראה למתקפות של הדמות האישית של ניר, "הנודד עם הניצוץ" (theme:'spark' ב-HEROES.skins).
   כמו החליל של אוראל (flute.js): רק מראה. הנזק, הטווח והסקילים לא משתנים, והצבע תמיד של סוג הנזק.
   הלהבה הקטנה שמרחפת ליד הכתף שלו (drawSpark ב-render.js) היא השפה: יריות הן להבונים עם שובל גצים, מכת חרב משאירה גצים לאורך הקשת,
   סקיל טבעת הוא טבעת להבונים שעולים, וברק הוא שרשרת גצים שקופצת. מעט חלקיקים ושקיפות רכה, כדי לא להעמיס.
   נרשם ב-THEMES (heroes.js), ומשם render.js ו-skills.js מציירים אותו, בלי חיבורים משלו */
const SPARK={
  core:'#FFE08A',                  // לב הלהבה: צהוב חם, כמו הניצוץ שליד הכתף
  shot:{r:5,trail:4,gap:0.022},    // ירייה: גודל הלהבון, כמה גצים בשובל, והמרווח ביניהם (שניות של תנועה)
  swing:{n:6,r:3.2},               // מכת חרב: כמה גצים לאורך הקשת, וגודלם
  ring:{n:10,r:5,rise:14},         // טבעת סקיל: כמה להבונים, גודל, וכמה הם עולים עד שנעלמים
  line:{n:6,r:3.5,hop:9},          // ברק: כמה גצים, גודל, וכמה הם קופצים מהקו
  slow:1.4                         // אפקט של סקיל נשאר על המסך פי כמה, כדי שיספיקו לראות את הלהבונים
};

// להבון: טיפה בצבע סוג הנזק עם לב צהוב, הזנב מאחור (a: לאן היא עפה)
function sparkFlame(x,y,r,col,a){
  ctx.save();ctx.translate(x,y);ctx.rotate(a+Math.PI/2);
  for(const [c,m] of [[col,1],[SPARK.core,0.5]]){
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,r*2.2*m);
    ctx.quadraticCurveTo(r*1.3*m,r*0.2*m,0,-r*m);ctx.quadraticCurveTo(-r*1.3*m,r*0.2*m,0,r*2.2*m);ctx.fill()}
  ctx.restore();
}
// גץ: נקודה קטנה עם הילה
function sparkDot(x,y,r,col){
  const al=ctx.globalAlpha;ctx.fillStyle=col;ctx.globalAlpha=al*0.35;ctx.beginPath();ctx.arc(x,y,r*2,0,7);ctx.fill();
  ctx.globalAlpha=al;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.fillStyle=SPARK.core;ctx.beginPath();ctx.arc(x,y,r*0.45,0,7);ctx.fill();
}

// יריות השחקן: להבון שעף, ושובל של גצים שהולכים וקטנים
function sparkShot(b,col){
  const S_=SPARK.shot,a=Math.atan2(b.vy,b.vx);
  for(let j=S_.trail;j>0;j--){ctx.globalAlpha=0.55-j*0.12;sparkDot(b.x-b.vx*S_.gap*j,b.y-b.vy*S_.gap*j+(RM?0:Math.sin(S.t*20+j)*1.5),S_.r*(0.6-j*0.1),col)}
  ctx.globalAlpha=1;sparkFlame(b.x,b.y,S_.r,col,a);
}
// מכת חרב: גצים לאורך הקשת, שדועכים מהקצה. k: 1 בתחילת המכה, 0 בסוף
function sparkSwing(s,k,col){
  const W=SPARK.swing,start=s.ang-s.arc/2,end=start+s.arc*(1-k),R=s.range*0.72;
  for(let j=0;j<W.n;j++){const t=end-j*(s.arc/W.n)*0.5;if(t<start)break;
    ctx.globalAlpha=(0.9-j*0.13)*(0.4+0.6*k);sparkDot(P.x+Math.cos(t)*R,P.y-8+Math.sin(t)*R,W.r*(1-j*0.1),col)}
  ctx.globalAlpha=1;
}
// סקיל טבעת: טבעת דקה, ולהבונים עליה שעולים ונעלמים
function sparkRing(f,k){
  const R=SPARK.ring,r=f.r*(0.35+0.65*k);
  ctx.globalAlpha=(1-k)*0.6;ctx.strokeStyle=f.col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.stroke();
  ctx.globalAlpha=1-k;
  for(let i=0;i<R.n;i++){const a=i*Math.PI*2/R.n;sparkFlame(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r-R.rise*k,R.r*(1-k*0.4),f.col,-Math.PI/2)}
  ctx.globalAlpha=1;
}
// ברק: קו דק מהשחקן לאויב, וגצים שקופצים לאורכו
function sparkLine(f,k){
  const L=SPARK.line,dx=f.bx-f.ax,dy=f.by-f.ay,d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
  ctx.globalAlpha=(1-k)*0.5;ctx.strokeStyle=f.col;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(f.ax,f.ay);ctx.lineTo(f.bx,f.by);ctx.stroke();
  ctx.globalAlpha=1-k;
  for(let i=0;i<L.n;i++){const p=(i+0.5)/L.n,h=(RM?0:Math.sin((p*3+k*2)*Math.PI))*L.hop;sparkDot(f.ax+dx*p+nx*h,f.ay+dy*p+ny*h,L.r,f.col)}
  ctx.globalAlpha=1;
}

THEMES.spark={shot:sparkShot,swing:sparkSwing,ring:sparkRing,line:sparkLine,slow:SPARK.slow};
