/* הופעת אויבים: אויבים בודדים כל הזמן, וגושים של אויבים חלשים שמכה אחת מוחקת חלק גדול מהם.
   כל זוג [התחלה,סוף] עובר בהדרגה מתחילת הריצה ועד שהבוס מגיע (RUN.bossAt ב-run.js) */
const HORDE={
  trickle:[1.1,0.45],            // כל כמה שניות מופיע אויב בודד
  every:[7,4.5],                 // כל כמה שניות מגיע גוש
  size:[8,30],                   // כמה אויבים בגוש
  spread:60,                     // כמה הגוש צפוף
  weak:0.5,                      // החיים של אויב בגוש, יחסית לאויב רגיל
  mixFrom:40,                    // מאיזו שנייה מגיעים גם גושים של מגינים ומכשפים, ולא רק שלדים
  cap:260                        // הכי הרבה אויבים בזירה יחד, בשביל הטלפון
};
// מחוץ למסך, גם בפינות: המרחק לפי הצלע הארוכה, כך שזה עובד לרוחב ולאורך
function spawnPos(){const a=rand(0,Math.PI*2),d=Math.max(W,H)*0.62+40;return{x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d}}
function addEnemy(type,x,y,hpMul=1){
  const d=ETYPES[type],k=runK()*hpMul;
  const e={type,x,y,hp:d.hp*k,max:d.hp*k,r:d.r,speed:d.speed*(1+Math.min(0.4,S.t/400)),mult:d.mult||(d.mult=multOf(d.tags)),weak:weakOf(d.mult),xp:d.xp,dmg:d.dmg,
    flash:0,kx:0,ky:0,shoot:rand(1.2,2.6),ph:rand(0,6),told:false};
  enemies.push(e);eliteRoll(e);return e;   // לפעמים אויב עלית (loot.js)
}
const runP=()=>Math.min(1,S.t/RUN.bossAt);
const lerp=([a,b])=>a+(b-a)*runP();
function spawner(dt){
  S.spawnT-=dt;S.hordeT-=dt;
  if(enemies.length>=HORDE.cap)return;
  if(S.spawnT<=0){
    S.spawnT=lerp(HORDE.trickle)*(S.boss?2.2:1);
    const p=spawnPos();let type='grunt';const r=Math.random();
    if(S.t>15&&r<0.28)type='shield';else if(S.t>28&&r<0.56)type='wisp';
    addEnemy(type,p.x,p.y);
  }
  if(S.hordeT<=0&&!S.boss){S.hordeT=lerp(HORDE.every);horde(Math.round(lerp(HORDE.size)))}
}
// גוש מכיוון אחד. מכשפים יורים, אז גוש שלהם קטן יותר
function horde(n){
  const c=spawnPos(),r=Math.random();
  const type=S.t<HORDE.mixFrom||r<0.5?'grunt':r<0.75?'shield':'wisp';if(type==='wisp')n=Math.ceil(n/2);
  n=Math.min(n,HORDE.cap-enemies.length);S.hordeMax=Math.max(S.hordeMax||0,n);   // לבדיקה: הגוש הכי גדול
  for(let i=0;i<n;i++){const a=rand(0,6.28),d=Math.sqrt(Math.random())*HORDE.spread*(1+n/30);addEnemy(type,c.x+Math.cos(a)*d,c.y+Math.sin(a)*d,HORDE.weak)}
}
