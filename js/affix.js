/* אויבים מיוחדים בעולם הפתוח (המחקר: "אויבי עלית עם תכונות", docs/research-skills.md). Claude מוביל, 31.10.2026.
   חלק מהאויבים בעולם מקבלים תכונה אחת: שם וצבע מעל הראש, התנהגות משלהם, ושלל טוב יותר. כך כל קרב נראה אחרת, ולסקילים יש מטרה.
   רק בעולם (wSpawn ב-world.js). בזירה יש כבר אויבי עלית משלה (loot.js, אוראל).
   המספרים באובייקט AFFIX. השמות ב-lang.js תחת 'af.' */

const AFFIX={
  chance:{start:0,near:0.1,far:0.22},     // הסיכוי לפי האזור (WORLD.zones). ליד השער אין, כדי שההתחלה תהיה רגועה
  list:{
    fast:   {col:'#46D3E6',speed:1.7},                 // מהיר: רץ פי 1.7
    tough:  {col:'#B8C0D0',hp:2.6,r:1.25},             // שריון: פי 2.6 חיים, וגדול יותר
    burst:  {col:'#FF8A3D',r:95,dmg:14,fuse:0.8},      // מתפוצץ: כשנופל, אחרי רגע מתפוצץ. לזוז!
    split:  {col:'#A8D08D',n:2,hp:0.35},               // מתפצל: כשנופל, יוצאים ממנו שניים קטנים
    regen:  {col:'#7FE08A',heal:0.06}                  // מתחדש: מרפא 6% בשנייה. צריך נזק מהיר
  },
  loot:{coins:[6,14]}                                   // שלל נוסף על הרצפה (drops.js)
};

// בזמן ההופעה (wSpawn): אולי תכונה
function affixRoll(e,zone){
  if(e.creature||Math.random()>=(AFFIX.chance[zone]||0))return;
  const ids=Object.keys(AFFIX.list),id=ids[Math.floor(Math.random()*ids.length)];affixSet(e,id);
}
function affixSet(e,id){
  const A=AFFIX.list[id];if(!A)return;e.affix=id;
  if(A.speed)e.speed*=A.speed;
  if(A.hp){e.hp*=A.hp;e.max*=A.hp}
  if(A.r)e.r*=A.r;
}
// כשאויב עם תכונה נופל (kill ב-combat.js)
function affixOnKill(e){
  if(!e.affix||!S.wd)return;
  const A=AFFIX.list[e.affix];
  dropSpawn('coins',Math.round(rand(...AFFIX.loot.coins)),e.x,e.y);
  if(e.affix==='burst')(S.wd.blasts||(S.wd.blasts=[])).push({x:e.x,y:e.y,t:A.fuse,max:A.fuse});
  if(e.affix==='split')for(let i=0;i<A.n;i++){const k=addEnemy(e.type,e.x+rand(-20,20),e.y+rand(-20,20),1);
    k.hp=k.max=e.max*A.hp;k.r=e.r*0.75;k.dmg=e.dmg*0.6;k.speed=e.speed;k.xp=0;k.home=e.home;k.split=true;k.elite=false}
}
// כל פריים בעולם (world.js): פיצוצים שמחכים, ומרפאים
function affixUpdate(dt){
  const w=S.wd;if(!w)return;
  for(const e of enemies)if(!e.dead&&e.affix==='regen'&&e.hp<e.max)e.hp=Math.min(e.max,e.hp+e.max*AFFIX.list.regen.heal*dt);
  if(!w.blasts)return;
  for(const b of w.blasts){b.t-=dt;if(b.t<=0&&!b.done){b.done=true;const A=AFFIX.list.burst;
    sparks(b.x,b.y,A.col,22,300);S.shake=Math.max(S.shake,8);
    if(Math.hypot(P.x-b.x,P.y-b.y)<A.r+P.r)hurt(A.dmg)}}
  w.blasts=w.blasts.filter(b=>!b.done);
}
// ציור: טבעת מתרחבת לפני הפיצוץ (בעולם, לפני הדמויות)
function affixDraw(){
  const w=S.wd;if(!w||!w.blasts)return;const A=AFFIX.list.burst;
  for(const b of w.blasts){const k=1-b.t/b.max;
    ctx.strokeStyle=A.col;ctx.globalAlpha=0.35+k*0.5;ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,A.r*k,0,7);ctx.stroke();
    ctx.globalAlpha=0.12;ctx.fillStyle=A.col;ctx.beginPath();ctx.arc(b.x,b.y,A.r,0,7);ctx.fill();ctx.globalAlpha=1}
}
// השם מעל הראש, בצבע של התכונה (מעל הכל)
function affixScreen(ox,oy){
  if(!S.wd)return;
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 12px Heebo, system-ui, sans-serif';
  for(const e of enemies){if(e.dead||!e.affix)continue;const x=e.x+ox,y=e.y+oy-e.r-30;if(!onScreen(x,y))continue;
    ctx.fillStyle='rgba(10,12,20,0.7)';const t=T('af.'+e.affix),tw=ctx.measureText(t).width+10;ctx.fillRect(x-tw/2,y-11,tw,15);
    ctx.fillStyle=AFFIX.list[e.affix].col;ctx.fillText(t,x,y)}
}
