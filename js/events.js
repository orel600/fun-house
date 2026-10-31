/* אירועים בעולם הפתוח (המחקר: "אירועים בעולם", docs/research-skills.md). Claude מוביל, 31.10.2026.
   פעם בכמה דקות קורה משהו ליד השחקן, עם הודעה וחץ בקצה המסך:
   wave: גל שלדים יוצא מהאדמה. מפילים את כולם, ונופלת תיבה.
   cart: עגלת סוחר הפוכה. מי שמגיע אליה ראשון לוקח את מה שנפל ממנה.
   rain: מטר רסיסים. מתכות ואבנים נופלות מסביב לכמה שניות.
   רק בעולם (worldUpdate ב-world.js). המספרים באובייקט EVENTS. הטקסטים ב-lang.js תחת 'ev.' */

const EVENTS={
  first:45,every:[80,130],            // השני הראשון אחרי כמה שניות בעולם, ואחר כך כל כמה שניות (בין-לבין)
  dist:[300,480],                     // כמה רחוק מהשחקן האירוע קורה
  wave:{type:'grunt',n:6,r:90,dur:60,loot:{coins:[20,35],iron:[2,4]}},
  cart:{dur:50,reach:60,loot:{coins:[25,50],wood:[6,10],stone:[6,10],cloth:[2,4]}},
  rain:{dur:10,every:0.8,r:220,pool:['stone','copper','iron','silver']},
  col:{wave:'#EF4E57',cart:'#F4C74F',rain:'#C7A6FF'}
};
const EVK=['wave','cart','rain'];
const evRoll=r=>Math.round(rand(r[0],r[1]));

function evSpot(){
  const a=rand(0,6.28),d=rand(...EVENTS.dist);return placeClamp({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d});
}
// מתחיל אירוע (או אקראי)
function evStart(kind){
  const w=S.wd;if(!w)return null;kind=kind||EVK[Math.floor(Math.random()*EVK.length)];
  const s=evSpot(),E={kind,x:s.x,y:s.y,t:0,dur:EVENTS[kind].dur};
  if(kind==='wave'){const W=EVENTS.wave;E.foes=[];
    for(let i=0;i<W.n;i++){const a=i/W.n*6.28,e=addEnemy(W.type,s.x+Math.cos(a)*W.r,s.y+Math.sin(a)*W.r,1);
      e.home=0;e.xp=0;e.evt=true;E.foes.push(e)}}
  if(kind==='rain'){E.x=P.x;E.y=P.y;E.next=0}
  w.ev=E;banner(T('ev.'+kind),EVENTS.col[kind]);sfx('celebrate');
  return E;
}
function evLoot(L,x,y){for(const r in L)dropSpawn(r,evRoll(L[r]),x+rand(-20,20),y+rand(-20,20))}
function evEnd(win){
  const w=S.wd,E=w.ev;if(!E)return;
  if(win){banner(T('ev.'+E.kind+'Done'),C.gold);celebrate(E.x,E.y,'quest')}
  w.ev=null;w.evT=evRoll(EVENTS.every);
}
// כל פריים בעולם
function eventsUpdate(dt){
  const w=S.wd;if(!w)return;
  if(w.evT==null)w.evT=EVENTS.first;
  const E=w.ev;
  if(!E){if((w.evT-=dt)<=0)evStart();return}
  E.t+=dt;
  if(E.kind==='wave'){
    if(E.foes.every(e=>e.dead)){evLoot(EVENTS.wave.loot,E.x,E.y);evEnd(true);return}
    // רודפים אחרי השחקן (כמו אויבים בעולם, wFoes), ואם לא הספקת, הם פשוט נשארים
  }
  if(E.kind==='cart'&&Math.hypot(P.x-E.x,P.y-E.y)<EVENTS.cart.reach){evLoot(EVENTS.cart.loot,E.x,E.y);evEnd(true);return}
  if(E.kind==='rain'){const R=EVENTS.rain;E.x=P.x;E.y=P.y;
    if((E.next-=dt)<=0){E.next=R.every;const a=rand(0,6.28),d=rand(40,R.r),p=placeClamp({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d});
      dropSpawn(R.pool[Math.floor(Math.random()*R.pool.length)],1,p.x,p.y);sparks(p.x,p.y,EVENTS.col.rain,8,160)}}
  if(E.t>=E.dur)evEnd(E.kind==='rain');
}
// ציור: עגלה הפוכה, וטבעת במקום הגל
function eventsDraw(){
  const E=S.wd&&S.wd.ev;if(!E)return;const t=fxNow();
  if(E.kind==='cart'){const x=E.x,y=E.y;
    ctx.fillStyle='rgba(244,199,79,'+(0.18+Math.sin(t*3)*0.08)+')';ctx.beginPath();ctx.arc(x,y,50,0,7);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(0.35);ctx.fillStyle='#7A5230';ctx.strokeStyle='#3A2412';ctx.lineWidth=3;
    ctx.fillRect(-26,-14,52,24);ctx.strokeRect(-26,-14,52,24);ctx.fillStyle='#2A1A0C';ctx.beginPath();ctx.arc(-16,14,8,0,7);ctx.arc(16,14,8,0,7);ctx.fill();ctx.restore();
    ctx.fillStyle=C.gold;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x-18+i*12,y+22+Math.sin(t*4+i)*2,4,0,7);ctx.fill()}}
  if(E.kind==='wave'&&E.t<1.2){ctx.strokeStyle=EVENTS.col.wave;ctx.globalAlpha=1-E.t/1.2;ctx.lineWidth=4;ctx.beginPath();ctx.arc(E.x,E.y,EVENTS.wave.r*(0.5+E.t),0,7);ctx.stroke();ctx.globalAlpha=1}
}
function eventsScreen(ox,oy){
  const E=S.wd&&S.wd.ev;if(!E||E.kind==='rain')return;
  let x=E.x,y=E.y;if(E.kind==='wave'){const a=E.foes.find(e=>!e.dead);if(a){x=a.x;y=a.y}}
  edgeArrow(x+ox,y+oy,EVENTS.col[E.kind],1.1);
}
// אויבי הגל: רודפים אחרי השחקן, בלי בית (wFoes ב-world.js)
function evFoeMove(e,dt){
  const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
  if(d<600){e.x+=dx/d*e.speed*slowK(e)*dt;e.y+=dy/d*e.speed*slowK(e)*dt}
  e.x+=e.kx*dt;e.y+=e.ky*dt;const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;
  if(d<e.r+P.r-3)hurt(e.dmg);
}
