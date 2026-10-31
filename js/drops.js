/* שלל על הקרקע (ניר: "אני רוצה שדרופים יראו פיסית על הרצפה לפני שאתה מרים").
   מה שנופל מאויב או ממקור משאבים קופץ החוצה ונוחת על הרצפה, ונאסף כשעוברים לידו: הוא נמשך לשחקן מקרוב (לפי P.magnet), עם צליל ו-"+N".
   מה שנאסף נכנס לשלל של המקום (S.loot): בזירה הוא מגיע לתרמיל בסוף הריצה (runEnd ב-village.js), ובעולם הפתוח מיד (wLootIn ב-world.js).
   בסוף ריצה בזירה מה שנשאר על הרצפה נאסף לבד, כי הוא כבר נראה. בעולם, מי שנופל משאיר אותו שם.
   המקום עצמו לא משנה כאן: הרשימה ב-S.gd, ו-S חדש בכל מעבר מקום. הכל באובייקט DROPS.
   הצבע והעמוד לפי דרגת השלל (RES.rarity ב-resources.js, runGive ב-loot.js): רגיל בלי, ומלא שכיח ומעלה טבעת בצבע הדרגה ועמוד שגבוה יותר ככל שהדרגה נדירה */

const DROPS={
  pop:[150,230], spread:[50,110], grav:700,  // הקפיצה: מהירות למעלה, מהירות לצדדים ומשיכה למטה
  land:0.35,                                  // שניות מהנפילה עד שאפשר לאסוף
  magnet:1,                                   // מאיזה מרחק נמשך לשחקן, כפול P.magnet
  fly:420, take:16,                           // מהירות המשיכה, ומאיזה מרחק נאסף
  stack:36,                                   // אותו משאב שנופל קרוב לערימה קיימת מצטרף אליה
  max:140,                                    // הכי הרבה על הרצפה יחד, בשביל הטלפון. מעבר לזה הישן ביותר נאסף לבד
  beam:0.8,                                   // גובה עמוד האור: beam של הדרגה כפול זה
  glow:{r:13,alpha:0.28,pulse:3,spin:2.5}     // זוהר זהב למשאב עם glow ב-resources.js (הגזר הקסום): גודל ההילה, שקיפות, קצב פעימה וסיבוב הניצוץ
};
// הדרגה של שלל (צבע ועמוד אור), או null לרגיל
// פריט ציוד (gear.js) מקבל תמיד צבע ועמוד, לפי השכבה שלו ועוד אחת: גם חרב עץ שנפלה מאויב היא רגע מיוחד
const dropGear=r=>!!gItem(r);
const dropRar=r=>dropGear(r)?Math.min(RES.rarity.length-1,gItem(r).tier+1):(resOf(r)||{rar:0}).rar;
const dropTier=r=>{const t=dropRar(r);return t?RES.rarity[t]:null};
const dropIcon=r=>dropGear(r)?gIcon(r):resIcon(r);

const drops=()=>S.gd||(S.gd=[]);
const dropStats=()=>S.gdN||(S.gdN={spawned:0,picked:0,auto:0,kept:0,gear:[]});   // kept: כמה שלל הוחזר לתוך הגבולות

// מפיל n יחידות של המשאב r מהנקודה (x,y). נקרא מ-runGive (loot.js): אויבים, מקורות, המבוקש וחדר הבונוס
function dropSpawn(r,n,x,y){
  const p=placeClamp({x,y});x=p.x;y=p.y;   // אויב שמת בקצה: השלל נוחת בתוך המקום (placeBox ב-world.js)
  const L=drops(),near=!dropGear(r)&&L.find(d=>d.r===r&&!d.fly&&Math.hypot(d.x-x,d.y-y)<DROPS.stack);
  dropStats().spawned+=n;
  if(near){near.n+=n;near.vz=DROPS.pop[0]*0.6;return near}
  if(L.length>=DROPS.max)dropTake(L[0],true);
  const a=rand(0,6.28),s=rand(...DROPS.spread),d={r,n,x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,z:0,vz:rand(...DROPS.pop),t:0,ph:rand(0,6),fly:dropGear(r)};   // ציוד נמשך לשחקן מכל מרחק, כדי שלא יישאר מאחור
  L.push(d);return d;
}
function dropTake(d,auto){
  d.got=true;const st=dropStats();
  // פריט ציוד נכנס ישר לתרמיל ונשמר, בכל מקום: הוא לא הולך לאיבוד במוות בעולם
  if(dropGear(d.r)){bagAdd(d.r,d.n);saveNow();st.gear.push(d.r);if(!auto)sfx('coin');
    floatText(P.x,P.y-40,gIcon(d.r)+' '+gName(d.r),dropTier(d.r).col,16);const all=drops(),i=all.indexOf(d);if(i>=0)all.splice(i,1);return}
  const L=runLoot();L[d.r]=(L[d.r]||0)+d.n;
  if(auto)st.auto+=d.n;else{st.picked+=d.n;sfx('coin');floatText(P.x,P.y-40,'+'+d.n+' '+resIcon(d.r),(dropTier(d.r)||{}).col||C.gold,16)}
  const all=drops(),i=all.indexOf(d);if(i>=0)all.splice(i,1);
}
// כל פריים, בזירה ובעולם: קפיצה ונחיתה, ומשיכה לשחקן כשקרובים
function dropsUpdate(dt){
  const R=P.magnet*DROPS.magnet;
  for(const d of drops().slice()){
    d.t+=dt;d.ph+=dt;
    if(d.z>0||d.vz>0){d.vz-=DROPS.grav*dt;d.z=Math.max(0,d.z+d.vz*dt);if(d.z===0)d.vz=0;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=0.96;d.vy*=0.96}
    if(d.t<DROPS.land)continue;
    if(!d.ok){d.ok=true;dropReach(d)}   // פעם אחת, כשנחת: בתוך הגבולות ולא בתוך עץ או סלע
    const dx=P.x-d.x,dy=P.y-d.y,dd=Math.hypot(dx,dy)||1;
    if(dd<R||d.fly){d.fly=true;const s=DROPS.fly*dt;d.x+=dx/dd*Math.min(s,dd);d.y+=dy/dd*Math.min(s,dd)}
    if(dd<DROPS.take)dropTake(d,false);
  }
}
// שלל שנחת איפה שאי אפשר להגיע (מחוץ לגבול, בתוך מקור משאבים) זז למקום הכי קרוב שאפשר לעמוד בו
function dropReach(d){
  const x=d.x,y=d.y;placeClamp(d);
  for(const n of (S.nd&&S.nd.list)||[]){if(n.dead)continue;const dx=d.x-n.x,dy=d.y-n.y,dd=Math.hypot(dx,dy)||1,min=n.r+P.r;
    if(dd<min){d.x=n.x+dx/dd*min;d.y=n.y+dy/dd*min;placeClamp(d)}}
  if(d.x!==x||d.y!==y)dropStats().kept++;
}
// סוף ריצה בזירה: מה שנשאר על הרצפה נאסף לבד
function dropsCollectAll(){for(const d of drops().slice())dropTake(d,true)}

/* ---- ציור: אייקון שקופץ ומתנדנד מעל צל, טבעת, ועמוד אור למשאב נדיר. בקנבס, מעל התלת-ממד ---- */
function drawDrops(){
  if(!S.gd||S.room)return;
  ctx.textAlign='center';ctx.direction='ltr';
  for(const d of S.gd){
    const tr=dropTier(d.r),col=tr&&tr.col,h=tr?tr.beam*DROPS.beam:0,bob=d.z>0?0:Math.sin(d.ph*3)*2,y=d.y-d.z-10+bob;
    if(h&&d.z===0){const g=ctx.createLinearGradient(0,d.y-h,0,d.y);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,col);
      ctx.globalAlpha=0.45+0.15*Math.sin(d.ph*4);ctx.fillStyle=g;ctx.fillRect(d.x-4,d.y-h,8,h);ctx.globalAlpha=1}
    if(d.z===0&&(resOf(d.r)||{}).glow){const a=DROPS.glow;ctx.globalAlpha=a.alpha*(0.75+0.25*Math.sin(d.ph*a.pulse));ctx.fillStyle=C.gold;
      ctx.beginPath();ctx.arc(d.x,y-6,a.r,0,7);ctx.fill();ctx.beginPath();ctx.arc(d.x+7*Math.cos(d.ph*a.spin),y-6+7*Math.sin(d.ph*a.spin),2,0,7);ctx.fill();ctx.globalAlpha=1}   // הגזר הקסום: הילה וניצוץ שמסתובב
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(d.x,d.y+2,9,3.5,0,0,7);ctx.fill();
    ctx.strokeStyle=col||'rgba(244,199,79,0.7)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d.x,d.y+2,12,5,0,0,7);ctx.stroke();
    ctx.font='17px system-ui, sans-serif';ctx.fillText(dropIcon(d.r)||'?',d.x,y);
    if(d.n>1){ctx.font='800 11px Heebo, system-ui, sans-serif';ctx.fillStyle='#000a';ctx.fillText(d.n,d.x+11,y+5);ctx.fillStyle=C.chalk;ctx.fillText(d.n,d.x+10,y+4)}
  }
  ctx.direction=DIR;
}
