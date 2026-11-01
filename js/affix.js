/* אויבים מיוחדים בעולם הפתוח (המחקר: "אויבי עלית עם תכונות", docs/research-skills.md). Claude מוביל, 31.10.2026.
   חלק מהאויבים בעולם מקבלים תכונה אחת: שם וצבע מעל הראש, התנהגות משלהם, ושלל טוב יותר. כך כל קרב נראה אחרת, ולסקילים יש מטרה.
   רק בעולם (wSpawn ב-world.js). בזירה יש כבר אויבי עלית משלה (loot.js, אוראל).
   המספרים באובייקט AFFIX. השמות ב-lang.js תחת 'af.' */

const AFFIX={
  chance:{start:0,near:0.1,far:0.22},     // הסיכוי לפי האזור (WORLD.zones). ליד השער אין, כדי שההתחלה תהיה רגועה
  list:{
    fast:   {col:'#46D3E6',icon:'⚡',speed:1.7},                 // מהיר: רץ פי 1.7
    tough:  {col:'#B8C0D0',icon:'🛡',hp:2.6,r:1.25},             // שריון: פי 2.6 חיים, וגדול יותר
    burst:  {col:'#FF8A3D',icon:'💥',blast:95,dmg:14,fuse:1},    // fuse: שנייה שלמה, והעיגול מתמלא עד הפיצוץ, כדי שיהיה זמן לצאת  // מתפוצץ: כשנופל, אחרי רגע מתפוצץ ברדיוס blast. לזוז! (לא r: r מגדיל את האויב עצמו)
    split:  {col:'#A8D08D',icon:'➗',n:2,hp:0.35},               // מתפצל: כשנופל, יוצאים ממנו שניים קטנים
    regen:  {col:'#7FE08A',icon:'✚',heal:0.06}                  // מתחדש: מרפא 6% בשנייה. צריך נזק מהיר
  },
  label:{size:12,min:11},                               // מעל הראש: אייקון קטן, והשם המלא רק לקרוב ביותר. גודל קבוע במסך (לא מתכווץ עם המצלמה), לפחות min
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
  if(e.affix==='split')for(let i=0,n=Math.min(A.n,paceFree());i<n;i++){   // paceFree: לא עוברים את המגבלה (pacing.js)
    const k=addEnemy(e.type,e.x+rand(-20,20),e.y+rand(-20,20),1);
    k.hp=k.max=e.max*A.hp;k.r=e.r*0.75;k.dmg=e.dmg*0.6;k.speed=e.speed;k.xp=0;k.home=e.home;k.split=true;k.elite=false;if(e.pack){k.pack=e.pack;e.pack.left++}}
}
// כל פריים בעולם (world.js): פיצוצים שמחכים, ומרפאים
function affixUpdate(dt){
  const w=S.wd;if(!w)return;
  for(const e of enemies)if(!e.dead&&e.affix==='regen'&&e.hp<e.max)e.hp=Math.min(e.max,e.hp+e.max*AFFIX.list.regen.heal*dt);
  if(!w.blasts)return;
  for(const b of w.blasts){b.t-=dt;if(b.t<=0&&!b.done){b.done=true;const A=AFFIX.list.burst;
    sparks(b.x,b.y,A.col,22,300);S.shake=Math.max(S.shake,8);
    if(Math.hypot(P.x-b.x,P.y-b.y)<A.blast+P.r)hurt(A.dmg)}}
  w.blasts=w.blasts.filter(b=>!b.done);
}
// ציור: האזור של הפיצוץ מסומן מההתחלה בקו מהבהב, ועיגול זוהר מתמלא ממנו עד הפיצוץ (docs/plan-combat.md שינוי 3: "עיגול שמתמלא")
function affixDraw(){
  const w=S.wd;if(!w||!w.blasts)return;const A=AFFIX.list.burst;
  for(const b of w.blasts){const k=1-b.t/b.max,pulse=0.5+0.5*Math.sin(fxNow()*(10+k*20));
    ctx.globalAlpha=0.14+k*0.3;ctx.fillStyle=A.col;ctx.beginPath();ctx.arc(b.x,b.y,A.blast*k,0,7);ctx.fill();
    ctx.globalAlpha=0.5+0.45*pulse;ctx.strokeStyle=A.col;ctx.lineWidth=3;ctx.setLineDash([10,7]);ctx.beginPath();ctx.arc(b.x,b.y,A.blast,0,7);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=0.6*k;ctx.fillStyle='#FFE0B0';ctx.beginPath();ctx.arc(b.x,b.y,10+14*k*pulse,0,7);ctx.fill();ctx.globalAlpha=1}
}
// מעל הראש, בצבע של התכונה (מעל הכל): לקרוב ביותר אייקון ושם, ולשאר רק אייקון קטן (docs/plan-hud.md פרק 6)
function affixScreen(ox,oy){
  if(!S.wd)return;
  const L=AFFIX.label,fs=Math.max(L.min,L.size)/ZOOM;   // בפיקסלים של המסך: הקנבס כאן מוגדל ב-ZOOM
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 '+fs+'px Heebo, system-ui, sans-serif';
  // מהקרוב לרחוק, ושם שהיה עולה על שם אחר לא מצויר: עם הרבה מפלצות השמות לא נערמים (בדיקת חוויה, #121)
  const box=[],list=enemies.filter(e=>!e.dead&&e.affix).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y));
  let first=true;
  for(const e of list){const x=e.x+ox,y=e.y+oy-e.r-30;if(!onScreen(x,y))continue;
    const A=AFFIX.list[e.affix],t=first?A.icon+' '+T('af.'+e.affix):A.icon;first=false;
    const tw=ctx.measureText(t).width+10;if(box.some(b=>Math.abs(b.x-x)<(b.w+tw)/2+4&&Math.abs(b.y-y)<fs*1.6))continue;box.push({x,y,w:tw});
    ctx.fillStyle='rgba(10,12,20,0.7)';ctx.fillRect(x-tw/2,y-fs*0.92,tw,fs*1.25);
    ctx.fillStyle=AFFIX.list[e.affix].col;ctx.fillText(t,x,y)}
}
