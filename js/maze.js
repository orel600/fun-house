/* זירת מבוך (אוראל, roadmap.md: "עוד סוגי זירות", ARENAS.maze ב-arenas.js). זירת גלים (6 גלים ובוס) עם קירות נמוכים שחוסמים הליכה, לך ולאויבים, אבל לא חצים.
   הקירות לא נשמרים: כל קיר נקבע מהתא שלו ומהמחזור (hash), ולכן אין מה לאפס. כל shiftSecs שניות הקירות נעלמים ברכות ומופיעים במקומות אחרים, ובזמן ההחלפה הם לא חוסמים.
   כל קיר קצר מהתא, ולכן תמיד יש מעבר מסביב. בלי קירות באמצע הזירה (safe), ורק בזירה הזאת: S.arena==='maze'.
   חיבורים: mazeRun() בתחילת arenaRun (arenas.js), mazeDraw(ox,oy) ב-render.js אחרי הרצפה. הטקסטים: 'w.enterMaze' ב-lang.js */
const MAZE={
  cell:240,            // גודל תא (יחידות משחק). בכל תא לכל היותר קיר אחד
  len:[120,170],       // אורך קיר: מינימום ומקסימום
  thick:15,            // עובי
  density:0.6,        // באיזה חלק מהתאים יש קיר
  safe:190,            // רדיוס פנוי סביב מרכז הזירה
  maxR:1000,           // רחוק מזה אין קירות
  reach:850,           // כמה רחוק מהשחקן מחשבים קירות (מספיק לאויבים שמגיעים מחוץ למסך)
  shiftSecs:40,        // כל כמה זמן הקירות מתחלפים
  fadeIn:1.6,fadeOut:1.0,   // כמה שניות הם מופיעים ונעלמים (ובזמן הזה לא חוסמים)
  solidAt:0.98,        // מאיזו בהירות הקיר חוסם
  col:{fill:'#2F3A44',edge:'#8FD1C9',shade:'rgba(0,0,0,0.35)'}   // גוף כהה, קו עליון דק בתכלת, וצל רך. תכלת כמו הרצפה של הזירה
};
const MZ={key:'',walls:[]};
const mzH=(i,j,k)=>{let h=Math.sin(i*127.1+j*311.7+k*74.7)*43758.5453;return h-Math.floor(h)};
// בהירות הקירות עכשיו: 0 עד 1 (נעלמים בסוף המחזור ומופיעים בתחילת הבא)
function mazeFade(){const f=S.t%MAZE.shiftSecs;return Math.min(1,f/MAZE.fadeIn,(MAZE.shiftSecs-f)/MAZE.fadeOut)}
// הקירות סביב השחקן (מחושב מחדש רק כשהשחקן עובר תא או כשהמחזור מתחלף)
function mazeWalls(){
  const M=MAZE,ep=Math.floor(S.t/M.shiftSecs),ci=Math.round(P.x/M.cell),cj=Math.round(P.y/M.cell),key=ep+':'+ci+':'+cj;
  if(MZ.key===key)return MZ.walls;
  const n=Math.ceil(M.reach/M.cell),out=[];
  for(let i=ci-n;i<=ci+n;i++)for(let j=cj-n;j<=cj+n;j++){
    if(mzH(i,j,ep*3)>=M.density)continue;
    const cx=i*M.cell+(mzH(i,j,ep*3+1)-0.5)*40,cy=j*M.cell+(mzH(i,j,ep*3+2)-0.5)*40,d=Math.hypot(cx,cy);
    if(d<M.safe||d>M.maxR)continue;
    const L=M.len[0]+(M.len[1]-M.len[0])*mzH(i+9,j+4,ep),horiz=mzH(i+3,j+7,ep)<0.5,w=horiz?L:M.thick,h=horiz?M.thick:L;
    out.push({x:cx-w/2,y:cy-h/2,w,h});
  }
  MZ.key=key;return MZ.walls=out;
}
// דוחף עיגל (x,y,r) החוצה מקיר. מחזיר true אם זז
function mazePush(o,r){
  let hit=false;
  for(const w of MZ.walls){
    const nx=Math.max(w.x,Math.min(o.x,w.x+w.w)),ny=Math.max(w.y,Math.min(o.y,w.y+w.h)),dx=o.x-nx,dy=o.y-ny,d=Math.hypot(dx,dy);
    if(d>=r)continue;hit=true;
    if(d>0.001){o.x+=dx/d*(r-d);o.y+=dy/d*(r-d)}
    else{   // המרכז בתוך הקיר: החוצה בכיוון הקרוב ביותר
      const l=o.x-w.x,rt=w.x+w.w-o.x,t=o.y-w.y,b=w.y+w.h-o.y,m=Math.min(l,rt,t,b);
      if(m===l)o.x=w.x-r;else if(m===rt)o.x=w.x+w.w+r;else if(m===t)o.y=w.y-r;else o.y=w.y+w.h+r}
  }
  return hit;
}
// כל פריים בזירת מבוך (arenaRun): הקירות חוסמים אותך ואת האויבים כשהם מלאים
function mazeRun(){
  if(S.arena!=='maze')return;
  mazeWalls();if(mazeFade()<MAZE.solidAt)return;
  mazePush(P,P.r);
  for(const e of enemies)if(!e.dead)mazePush(e,e.r*0.8);
}
// ציור (render.js, בעולם המשחק): גוף כהה, קו עליון דק וצל רך מתחת. בלי תנועה ובלי חלקיקים
function mazeDraw(ox,oy){
  if(S.arena!=='maze'||S.mode==='over')return;
  const M=MAZE,a=mazeFade();if(a<=0.02)return;mazeWalls();
  ctx.save();
  for(const w of MZ.walls){
    if(w.x+w.w<-ox-20||w.x>-ox+W+20||w.y+w.h<-oy-20||w.y>-oy+H+20)continue;
    ctx.globalAlpha=a*0.9;ctx.fillStyle=M.col.shade;ctx.fillRect(w.x+2,w.y+5,w.w,w.h);
    ctx.fillStyle=M.col.fill;ctx.fillRect(w.x,w.y,w.w,w.h);
    ctx.globalAlpha=a*0.8;ctx.fillStyle=M.col.edge;ctx.fillRect(w.x,w.y,w.w,2);
  }
  ctx.restore();
}
