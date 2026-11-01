/* פיוחו מצילה (הרעיון של אוראל, 1.11.2026): בזירה, כשנשארו לשחקן פחות מ-30% חיים, בסיכוי 50% פיוחו מניחה לידו עצם זוהרת.
   מי שמרים אותה: כל האויבים הרגילים ברדיוס קרוב נעלמים (נופלים כמו בהריגה, אז יש להם שלל). בוס ומבוקש רק נפגעים.
   ההגרלה פעם אחת בריצה, ואם יצא לא, זהו. העצם נעלמת בהדרגה אחרי כמה שניות.
   מראה שקט במכוון: עצם קטנה עם הילה דקה, וטבעת אחת דקה שנפתחת בהרמה. בלי ניצוצות ובלי עמודי אור.
   קובץ משלו: ב-pet.js רק שורות חיבור (rescueUpdate, rescueDraw). המצב ב-S.rs, חדש בכל ריצה. הטקסט ב-lang.js: 'rs.saved' */
const RESCUE={
  hpBelow:0.3,     // מתחת לאיזה חלק מהחיים (מ-maxHp) מגרילים
  chance:0.5,      // הסיכוי
  radius:210,      // מי נעלם: כל אויב רגיל בתוך המרחק הזה
  bossHit:4,       // בוס ומבוקש: נזק כפול נזק הנשק (skBase)
  take:26,         // מאיזה מרחק מרימים
  life:12,         // כמה שניות העצם נשארת (הרבע האחרון מהבהב ונעלם)
  ring:{dur:0.5,w:1.5,alpha:0.5},   // הטבעת בהרמה
  col:'#F4F2EC',glow:'#F2D3A0'      // עצם לבנה, הילה בצבע החול של פיוחו
};
const rescueOn=()=>!!(S&&skArena()&&S.mode==='play');
// נקרא מ-petUpdate (pet.js), כל פריים בזירה
function rescueUpdate(dt){
  if(!rescueOn())return;
  const r=S.rs||(S.rs={rolled:false,item:null,done:false,ring:null,saved:0});
  if(r.ring){r.ring.t+=dt;if(r.ring.t>=RESCUE.ring.dur)r.ring=null}
  if(!r.rolled&&P.hp>0&&P.hp<P.maxHp*RESCUE.hpBelow){
    r.rolled=true;
    if(Math.random()<RESCUE.chance){const p=S.pet;
      r.item={x:p?p.x:P.x-50,y:p?p.y:P.y,t:0};
      if(Math.hypot(r.item.x-P.x,r.item.y-P.y)<RESCUE.take+10){r.item.x=P.x-Math.cos(P.face)*60;r.item.y=P.y-Math.sin(P.face)*60}
      if(p){p.st='jump';p.t=0}   // קפיצת שמחה: היא יודעת שהיא עזרה
    }}
  const it=r.item;if(!it)return;
  it.t+=dt;
  if(it.t>=RESCUE.life){r.item=null;return}
  if(Math.hypot(it.x-P.x,it.y-P.y)<RESCUE.take)rescueTake(r);
}
function rescueTake(r){
  const it=r.item;r.item=null;r.done=true;r.ring={t:0,x:P.x,y:P.y};
  let n=0;
  for(const e of enemies.slice()){
    if(e.dead||e.node||Math.hypot(e.x-P.x,e.y-P.y)>RESCUE.radius)continue;
    if(e.isBoss||e.wanted){damage(e,skBase()*RESCUE.bossHit,'skill',Math.atan2(e.y-P.y,e.x-P.x),'physical');continue}
    e.hp=0;kill(e);n++}
  r.saved+=n;
  floatText(P.x,P.y-50,T(petTx('rs.saved')),RESCUE.glow,18,false,true);sfx('celebrate');
}
// נקרא מ-drawPet (pet.js), בקואורדינטות העולם
function rescueDraw(){
  const r=S&&S.rs;if(!r||!rescueOn())return;
  const it=r.item;
  if(it){
    const fade=Math.min(1,(RESCUE.life-it.t)/(RESCUE.life*0.25)),blink=fade<1?(Math.sin(it.t*14)>0?1:0.4):1,bob=RM?0:Math.sin(it.t*4)*2,y=it.y-14+bob;
    ctx.save();ctx.globalAlpha=0.3*fade*blink;ctx.strokeStyle=RESCUE.glow;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(it.x,y,12+(RM?0:Math.sin(it.t*5)*2),0,7);ctx.stroke();
    ctx.globalAlpha=fade*blink;ctx.strokeStyle=RESCUE.col;ctx.fillStyle=RESCUE.col;ctx.lineWidth=4;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(it.x-7,y+4);ctx.lineTo(it.x+7,y-4);ctx.stroke();   // עצם: מוט ושני קצוות כפולים
    for(const [dx,dy] of [[-9,2],[-6,8],[9,-8],[6,-2]]){ctx.beginPath();ctx.arc(it.x+dx,y+dy,3,0,7);ctx.fill()}
    ctx.restore()}
  if(r.ring){const k=r.ring.t/RESCUE.ring.dur;
    ctx.save();ctx.globalAlpha=RESCUE.ring.alpha*(1-k);ctx.strokeStyle=RESCUE.glow;ctx.lineWidth=RESCUE.ring.w;
    ctx.beginPath();ctx.arc(r.ring.x,r.ring.y-8,20+(RESCUE.radius-20)*Math.sqrt(k),0,7);ctx.stroke();ctx.restore()}
}
