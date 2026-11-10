/* הזירה, שלב 2 של השיפוץ (ARAMB, ARENA-A, 10.11.2026). רק מראה, ורק ב-overhaul/preview. ?aramb=0 מכבה.
   מתוך תדריך שלב 2 (D:\overhaul\docs\overhaul-spec-arena-tier2.md): מה שאפשר בלי לגעת במכניקה ובלי מודלים.
   (1) אווירה: חלקיקים דקים לפי הזירה: אבק זהב בזירה הרגילה, ובזמן קרב בוס אפר גחלים נופל שמתעבה כשהבוס מתקרב ועם הזעם שלו.
   (2) טקס גל: בכל התחלת גל שישה ניצוצות בצבעי סוגי הנזק יוצאים מהגיבור החוצה (פעם אחת, עם הקרן הקיימת), ודועכים.
   (3) סימנים קוסמטיים לאויבים (לא משנים נזק ולא תזמון): אדי נשימה ליצורי קרח, אבק צעדים לאבן, טפטוף גחלים לאש, נבגים לצמחים.
   כל זה קנבס מעל התלת-ממד, בזמן המשחק, עם תקרה ובלי Math.random. "פחות אפקטים" והפחתת תנועה: הכל כבוי.
   לא נעשה כאן (דורש מודל או אנימציה או החלטה): גוון ותוספות לגוף הבוס, שבירת השריון, מזרקת הכדורים, עלייה מהאדמה של שלדים, שלושת הבוסים החדשים. */
const ARAMBC={
  motes:{base:20,boss:10,bossNear:22,bossRage:12,near:700,far:200},   // כמה חלקיקים: רגיל, בבוס, ותוספות לפי קרבה וזעם
  tells:{max:14,each:0.9,range:1},                                     // כמה אויבים לכל היותר, וכל כמה שניות סימן (לכל אויב עם הסטה)
  wave:{dur:0.7,r0:90,r1:520,star:44,types:['physical','fire','water','ice','lightning','earth']},
  fam:{ice:['yeti','rimeknight','frostwraith','frostwarden'],stone:['golem','goleling','tidewarden'],fire:['demon','wisp','flamewisp','cinderscorp','emberwarden'],plant:['treant','mushnub','sprite']}
};
const ARAMB={on:!/[?&]aramb=0(&|$)/.test(location.search),stat:{motes:0,tells:0,waves:0}};
const arambOn=()=>ARAMB.on&&typeof arshOn==='function'&&arshOn()&&S.mode==='play'&&!arshLess()&&!(typeof calmOn==='function'&&calmOn());
const arambFam=t=>{for(const f in ARAMBC.fam)if(ARAMBC.fam[f].includes(t))return f;return null};

// טקס הגל: ארבעה-שישה ניצוצות בצבעי סוגי הנזק, כל אחד עם שובל קצר ופיצוץ קטן בסוף
ARSHD.wave=function(e,T){
  const C=ARAMBC.wave,t=T-e.t0,k=t/C.dur;if(k>=1)return false;
  const ee=arshE(arshC(k/0.8));
  C.types.forEach((ty,i)=>{
    const a=e.a0+i/C.types.length*6.283,col=dtCol(ty),d=arshLerp(C.r0,C.r1,ee),d0=arshLerp(C.r0,C.r1,arshE(arshC((k-0.14)/0.8))),
      x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d*0.85,x0=e.x+Math.cos(a)*d0,y0=e.y+Math.sin(a)*d0*0.85;
    if(k<0.8)arshStreak(x0,y0,x,y,15,col,1-k*0.5,'#fff');
    else{const z=(k-0.8)/0.2;arshStar(x,y,C.star*(1-z*0.5),6,e.seed+i,col,1-z,a,1)}
  });
  return true;
};
{const old=waveStart;waveStart=function(i){
  const s0=S.shake,r=old.apply(this,arguments);
  if(ARAMB.on&&typeof arshOn==='function'&&arshOn())S.shake=s0;   // בלי הרעידה של תחילת גל (arenas.js)
  if(arambOn()){ARAMB.stat.waves++;arshSpawn('wave',{x:P.x,y:P.y,a0:arshR(i*3.1,1)*1.05})}
  return r}}

// אווירה וסימני אויבים: מחושבים מהזמן והמספר (בלי מערך שמתעדכן)
function arambMotes(ox,oy){
  const M=ARAMBC.motes,boss=S.boss&&!S.boss.dead?S.boss:null,vx=-ox,vy=-oy;
  let n=M.base,col='#FFD36B',fall=-1,sz=3.4;
  if(boss){const d=Math.hypot(boss.x-P.x,boss.y-P.y),near=1-arshC((d-M.far)/(M.near-M.far));
    n=M.boss+Math.round(M.bossNear*near)+Math.round(M.bossRage*arshC(boss.rage||0));col='#FF8A3D';fall=1;sz=6}
  ctx.save();ctx.beginPath();
  for(let i=0;i<n;i++){
    const r1=arshR(11,i),r2=arshR(12,i),sp=0.04+0.05*arshR(13,i),u=((r1+S.t*sp*fall*0+0)%1+1)%1,
      v=(((r2+S.t*sp*fall)%1)+1)%1,x=vx+((u+Math.sin(S.t*0.7+i)*0.01)%1)*W,y=vy+v*H,z=sz*(0.6+0.8*arshR(14,i));
    ctx.moveTo(x,y-z*1.6);ctx.lineTo(x+z,y);ctx.lineTo(x,y+z*1.6);ctx.lineTo(x-z,y);
  }
  ctx.globalAlpha=boss?1:0.8;ctx.fillStyle=col;ctx.fill();ctx.restore();ARAMB.stat.motes=n;
}
function arambTells(ox,oy){
  const C=ARAMBC.tells;let n=0;ctx.save();
  for(let i=0;i<enemies.length&&n<C.max;i++){
    const e=enemies[i];if(e.dead||e.node||e.x+ox<-30||e.x+ox>W+30||e.y+oy<-30||e.y+oy>H+30)continue;
    const f=arambFam(e.type);if(!f)continue;n++;
    const ph=((S.t+i*0.37)%C.each)/C.each,a=Math.min(1,(1-ph)*1.6),r=e.r*(e.big||1);
    if(f==='ice'){ctx.fillStyle='#CFF3FF';ctx.globalAlpha=a;ctx.beginPath();ctx.arc(e.x+r*0.6+ph*16,e.y-r*1.6-ph*14,12+16*ph,0,7);ctx.fill();ctx.strokeStyle='#2B6F8E';ctx.lineWidth=2.5;ctx.stroke()}   // אדי נשימה
    else if(f==='stone'){ctx.fillStyle='#D9BE98';ctx.strokeStyle='#5E4630';ctx.lineWidth=2;ctx.globalAlpha=a;ctx.beginPath();ctx.arc(e.x-r*0.4-ph*16,e.y+r*0.6,13+14*ph,0,7);ctx.moveTo(e.x+r*0.4+ph*18+13+14*ph,e.y+r*0.6);ctx.arc(e.x+r*0.4+ph*18,e.y+r*0.6,13+13*ph,0,7);ctx.fill();ctx.stroke()}   // אבק צעדים
    else if(f==='fire'){const x=e.x+Math.sin(i*2.1)*r*0.4,y=e.y-r*0.3+ph*r*1.6;ctx.fillStyle='#FFB347';ctx.globalAlpha=1-ph;ctx.beginPath();ctx.arc(x,y,8*(1-ph)+1.8,0,7);ctx.fill()}   // טפטוף גחלים
    else{ctx.fillStyle='#B6F06A';ctx.strokeStyle='#2F6B1E';ctx.lineWidth=1.8;ctx.globalAlpha=Math.min(1,a*1.3);ctx.beginPath();for(let j=0;j<4;j++){const an=j*2.1+i;ctx.moveTo(e.x+Math.cos(an)*ph*r*1.6+8,e.y-r*0.7-ph*18);ctx.arc(e.x+Math.cos(an)*ph*r*1.6,e.y-r*0.7-ph*18,8,0,7)}ctx.fill();ctx.stroke()}   // נבגים
  }
  ctx.restore();ARAMB.stat.tells=n;
}
{const old=drawSkills;drawSkills=function(ox,oy){
  if(arambOn()){try{arambMotes(ox,oy);arambTells(ox,oy)}catch(err){ARAMB.on=false;console.warn('arena-ambience',err)}}
  return old.apply(this,arguments)}}
