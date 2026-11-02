/* פיוחו מריחה ומובילה (Claude מוביל, 2.11.2026. roadmap: idea-pet-detours).
   פעם בכמה דקות בעולם הפתוח, החיה עוצרת, מרחרחת, ורצה לכיוון אחד. שם מחכה משהו: סוד שעוד לא נמצא באזור,
   תיבה קבורה, או אויב מיוחד (affix.js) עם שלל. חץ בקצה המסך מראה לאן, והחיה יושבת ונובחת עד שמגיעים.
   לא חובה: מי שלא הולך, היא חוזרת אליו אחרי SCENT.wait שניות.
   רק בעולם (S.wd), רק כשהחיה סתם הולכת אחרי השחקן. נקודת החיבור: שורה אחת ב-petUpdate (pet.js), וציור ב-world.js.
   המספרים באובייקט SCENT. הטקסטים ב-lang.js תחת 'scent.' */
const SCENT={
  first:70,every:[160,220],            // שניות בעולם עד הפעם הראשונה, ואחר כך בין פעם לפעם
  dist:[380,560],                       // כמה רחוק היא רצה (לתיבה ולאויב). סוד: רק אם הוא עד far
  far:650,                              // (לא יותר: החיה קופצת חזרה לשחקן מ-PET.follow.jump)
  sniff:1.2,                            // שניות של ריחרוח לפני הריצה
  run:360,                              // מהירות הריצה אל המקום
  wait:45,                              // כמה שניות היא מחכה שם עד שמוותרת וחוזרת
  reach:60,                             // כמה קרוב השחקן צריך להגיע
  pick:{secret:0.4,chest:0.35,elite:0.25},   // מה מחכה שם (סוד רק אם יש באזור סוד שלא נמצא)
  chest:{coins:[1,30],iron:[0.7,2],silver:[0.35,1],ruby:[0.1,1],sapphire:[0.1,1],amber:[0.1,1]},   // תיבה קבורה, בפורמט של טבלאות השלל
  elite:{type:'grunt',loot:{coins:[1,25],silver:[0.5,1]}},   // אויב מיוחד עם תכונה אקראית מ-AFFIX
  col:'#F2D3A0'
};
const scentRoll=r=>rand(r[0],r[1]);

// כל פריים מ-petUpdate, לפני ההליכה אחרי השחקן. true = החיה עסוקה כאן, ושאר ההתנהגות מחכה
function scentUpdate(p,dt,dP){
  const w=S.wd;if(!w)return false;
  let s=w.scent;
  if(!s){
    if(w.scentT==null)w.scentT=SCENT.first;
    if(p.st!=='follow'&&p.st!=='idle'&&p.st!=='sit')return false;
    if((w.scentT-=dt)>0)return false;
    s=scentStart(p);if(!s){w.scentT=10;return false}
  }
  s.t+=dt;
  if(s.kind==='elite'&&s.foe){   // אויב מיוחד: כשהוא נופל, שלל. כשהקרב מתחיל, החיה חוזרת לעזור
    if(s.foe.dead){scentEnd(true);return false}
    if(s.st==='fight')return false;
    if(Math.hypot(P.x-s.foe.x,P.y-s.foe.y)<SCENT.reach*3){s.st='fight';banner(T('scent.elite'),AFFIX.list[s.foe.affix].col);return false}}
  if(s.st==='sniff'){p.run=false;p.st='idle';p.face+=dt*6;   // מרחרחת: מסתובבת במקום
    if(s.t>=SCENT.sniff){s.st='run';s.t=0;floatText(p.x,p.y-40,T(petTx('scent.go'),T('pet.name.'+(SAVE.pet.kind||PET.default))),SCENT.col,15);sfx('tap')}
    return true}
  if(s.st==='run'){const dx=s.x-p.x,dy=s.y-p.y,d=Math.hypot(dx,dy);
    if(d<10){s.st='wait';s.t=0}else{const sp=Math.min(d/dt,SCENT.run);p.x+=dx/d*sp*dt;p.y+=dy/d*sp*dt;p.face=Math.atan2(dy,dx);p.run=true;p.st='follow'}}
  if(s.st==='wait'){p.run=false;p.st='sit';p.face=Math.atan2(P.y-p.y,P.x-p.x);
    if(s.t%1.5<dt)floatText(p.x,p.y-36,'!',SCENT.col,18)}   // נובחת
  // הגיע השחקן
  if(s.kind!=='elite'&&Math.hypot(P.x-s.x,P.y-s.y)<SCENT.reach){scentFound(s);return false}
  if(s.st==='wait'&&(s.t>SCENT.wait||Math.hypot(p.x-s.x,p.y-s.y)>40)){scentEnd(false);return false}   // מוותרת: נמאס לחכות, או שקפצה חזרה לשחקן (PET.follow.jump)
  return true;
}
// בוחר מה מחכה ואיפה
function scentStart(p){
  const w=S.wd;let kind=null,x,y,sec=null;
  const open=(typeof scList==='function'?scList():[]).filter(o=>!scFound(o.id)&&Math.hypot(o.x-P.x,o.y-P.y)<SCENT.far);
  const r=Math.random(),K=SCENT.pick;
  if(open.length&&r<K.secret){sec=open.sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];kind='secret';x=sec.x;y=sec.y}
  else{kind=Math.random()<K.chest/(K.chest+K.elite)?'chest':'elite';
    const a=rand(0,6.28),d=scentRoll(SCENT.dist),q=placeClamp({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d});x=q.x;y=q.y}
  const s={kind,x,y,t:0,st:'sniff',sec};
  if(kind==='elite'){const E=SCENT.elite,e=addEnemy(E.type,x,y,1);e.home=0;e.xp=0;e.evt=true;e.scent=true;   // evt: רודף כמו אויב של אירוע (events.js)
    const ids=Object.keys(AFFIX.list);affixSet(e,ids[Math.floor(Math.random()*ids.length)]);s.foe=e}
  w.scent=s;return s;
}
function scentFound(s){
  const W=SCENT;
  if(s.kind==='chest'){runGive(W.chest,s.x,s.y);celebrate(s.x,s.y,'quest','🐾');banner(T('scent.chest'),C.gold)}
  if(s.kind==='secret')banner(T('scent.secret'),C.gold);   // הסוד עצמו נמצא כרגיל (secrets.js)
  scentEnd(false);
}
function scentEnd(beaten){
  const w=S.wd,s=w.scent;
  if(beaten&&s&&s.foe){runGive(SCENT.elite.loot,s.foe.x,s.foe.y);celebrate(s.foe.x,s.foe.y,'quest','🐾')}
  w.scent=null;w.scentT=scentRoll(SCENT.every);
  if(typeof questEvent==='function')questEvent('pet','scent',1);
}
// ציור בעולם: עקבות קטנים ונצנוץ במקום (לפני הדמויות)
function scentDraw(){
  const s=S.wd&&S.wd.scent;if(!s||s.st==='sniff')return;const t=fxNow();
  ctx.fillStyle='rgba(242,211,160,'+(0.18+Math.sin(t*4)*0.08)+')';ctx.beginPath();ctx.arc(s.x,s.y,SCENT.reach*0.8,0,7);ctx.fill();
}
// חץ בקצה המסך
function scentScreen(ox,oy){
  const s=S.wd&&S.wd.scent;if(!s||s.st==='sniff')return;
  const tx=s.kind==='elite'&&s.foe&&!s.foe.dead?s.foe:s;
  edgeArrow(tx.x+ox,tx.y+oy,SCENT.col,1);
}
