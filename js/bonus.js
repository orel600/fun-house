/* הרעיונות של אוראל: חדר בונוס, פריטים במקומות קשים, ובוס שמתעצבן כשבורחים ממנו (הזעם עצמו ב-boss.js) */

const BONUS={
  doorFirst:25, doorEvery:[40,65], doorLife:7,          // דלת הזהב: מתי מופיעה וכמה זמן נשארת פתוחה
  roomTime:7, roomCoins:28, trapChance:0.35,              // החדר: כמה זמן, כמה מטבעות, סיכוי למסורים
  roomRes:{sapphire:[0.3,1],gold:[0.25,1],cloth:[0.5,2]},  // התיבה ביציאה מהחדר: {משאב:[סיכוי, כמה]} לשלל של הריצה (RES)
  pickFirst:[15,22], pickEvery:[28,42], pickLife:15,      // פריטים במקומות קשים
  zoneR:75, zoneBurn:10,                                  // אזור הסכנה סביב הפריט: רדיוס ונזק לשנייה
  bombBase:55, bombBossShare:0.35,                        // הפצצה: נזק לפי העוצמה, לבוס רק חלק
  powerTime:8, powerDmg:1.6, powerSpeed:1.25              // באף זמני
};
const PICKS={   // הטקסטים שלהם ב-lang.js
  bomb:{col:'#FF8A3D'},
  power:{col:'#F4C74F'}
};

function bonusReset(){
  S.bn={doorT:BONUS.doorFirst,door:null,pickT:rand(...BONUS.pickFirst),picks:[],blasts:[],coins:0,taken:0};
  S.room=null;
  P.power=0;P.vx=0;P.vy=0;
}

/* ---- עולם רגיל: דלתות ופריטים ---- */
function bonusUpdate(dt){
  const bn=S.bn;
  P.power=Math.max(0,P.power-dt);
  // דלת הזהב
  if(bn.door){
    bn.door.life-=dt;
    if(Math.hypot(P.x-bn.door.x,P.y-bn.door.y)<30){enterRoom(bn.door);bn.door=null;bn.doorT=rand(...BONUS.doorEvery);return}
    if(bn.door.life<=0){bn.door=null;bn.doorT=rand(...BONUS.doorEvery);floatText(P.x,P.y-40,T('doorClosed'),C.dim,14)}
  }else if(!S.boss){
    bn.doorT-=dt;
    if(bn.doorT<=0){const a=rand(0,6.28),d=rand(160,220);bn.door={x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d,life:BONUS.doorLife};banner(T('doorOpen'),C.gold)}
  }
  // פריטים במקומות קשים
  bn.pickT-=dt;
  if(bn.pickT<=0&&bn.picks.length<2){bn.pickT=rand(...BONUS.pickEvery);spawnPick()}
  for(const k of bn.picks){
    k.life-=dt;k.ph+=dt;
    const d=Math.hypot(P.x-k.x,P.y-k.y);
    if(d<BONUS.zoneR){P.hp-=BONUS.zoneBurn*dt;S.hurt=Math.max(S.hurt,0.12);if(P.hp<=0){P.hp=0;gameOver();return}}
    if(d<P.r+14){k.life=0;usePick(k)}
  }
  bn.picks=bn.picks.filter(k=>k.life>0);
  for(const b of bn.blasts)b.t+=dt;
  bn.blasts=bn.blasts.filter(b=>b.t<0.6);
}
function spawnPick(){
  const a=rand(0,6.28),d=rand(240,320),x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;
  const type=Math.random()<0.5?'bomb':'power';
  S.bn.picks.push({x,y,type,life:BONUS.pickLife,ph:0});
  // שומרים סביב הפריט: מגן אחד ורוח אחת
  addEnemy('shield',x+60,y);addEnemy(S.t>28?'wisp':'grunt',x-60,y);
}
function usePick(k){
  S.bn.taken++;sfx('coin');
  if(k.type==='bomb'){
    const base=BONUS.bombBase*(1+S.t/90),hw=W/2+40,hh=H/2+40;
    for(const e of enemies){
      if(e.dead||Math.abs(e.x-S.cam.x)>hw||Math.abs(e.y-S.cam.y)>hh)continue;
      damage(e,e.isBoss?base*BONUS.bombBossShare:base,'bomb',Math.atan2(e.y-k.y,e.x-k.x));
    }
    S.bn.blasts.push({x:k.x,y:k.y,t:0});S.shake=Math.max(S.shake,12);S.hitstop=0.08;
    banner(T('boom'),PICKS.bomb.col);
  }else{
    P.power=BONUS.powerTime;sparks(P.x,P.y-8,C.gold,18,200);banner(T('powerUp'),C.gold);
  }
}

/* ---- חדר הבונוס ---- */
function enterRoom(door){
  const cx=P.x+20000,cy=P.y,coins=[];
  for(let i=0;i<BONUS.roomCoins;i++){const a=rand(0,6.28),r=rand(50,300);coins.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,ph:rand(0,6)})}
  const saws=[];
  if(Math.random()<BONUS.trapChance)for(let i=0;i<3;i++)saws.push({a:i*2.094,r:150});
  S.room={t:BONUS.roomTime,back:{x:door.x,y:door.y},cx,cy,coins,saws,got:0};
  eb=[];mines=[];P.x=cx;P.y=cy;S.cam.x=cx;S.cam.y=cy;
  banner(T(saws.length?'roomSaws':'roomGo'),C.gold);
}
function roomUpdate(dt){
  const R=S.room;
  P.inv-=dt;S.hurt-=dt;S.shake=Math.max(0,S.shake-dt*30);
  movePlayer(dt);
  R.t-=dt;
  for(const c of R.coins){
    c.ph+=dt*4;
    const dx=P.x-c.x,dy=P.y-c.y,d=Math.hypot(dx,dy)||1;
    if(d<P.magnet*0.6){c.x+=dx/d*320*dt;c.y+=dy/d*320*dt}
    if(d<P.r+9&&!c.got){c.got=true;sfx('coin');R.got++;S.bn.coins++;gainXP(1);sparks(c.x,c.y,C.gold,5,120)}
  }
  R.coins=R.coins.filter(c=>!c.got);
  for(const s of R.saws){s.a+=dt*1.6;const x=R.cx+Math.cos(s.a)*s.r,y=R.cy+Math.sin(s.a)*s.r;s.x=x;s.y=y;if(Math.hypot(P.x-x,P.y-y)<P.r+14)hurt(12)}
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  if(R.t<=0||R.coins.length===0)exitRoom();
}
function exitRoom(){
  const R=S.room;S.room=null;
  P.x=R.back.x;P.y=R.back.y;S.cam.x=P.x;S.cam.y=P.y;P.inv=1.2;
  runGive(BONUS.roomRes,P.x,P.y-30);
  banner(T('roomOut',R.got),C.gold);
}

/* ---- ציור ---- */
function drawBonusWorld(){
  const bn=S.bn;
  if(S.room){
    const R=S.room;
    ctx.strokeStyle='rgba(244,199,79,0.35)';ctx.lineWidth=3;ctx.setLineDash([10,10]);ctx.beginPath();ctx.arc(R.cx,R.cy,320,0,7);ctx.stroke();ctx.setLineDash([]);
    for(const c of R.coins){const w=Math.abs(Math.cos(c.ph))*7+1.5;ctx.fillStyle=C.gold;ctx.beginPath();ctx.ellipse(c.x,c.y,w,8,0,0,7);ctx.fill();ctx.strokeStyle='#8A6A17';ctx.lineWidth=1.5;ctx.stroke()}
    for(const s of R.saws){if(s.x===undefined)continue;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a*6);ctx.fillStyle=C.blood;ctx.beginPath();
      for(let i=0;i<16;i++){const rr=i%2?9:15,a=i*Math.PI/8;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();ctx.restore()}
    return;
  }
  // אזורי סכנה ופריטים
  for(const k of bn.picks){
    const pulse=0.5+0.5*Math.sin(k.ph*4),fade=Math.min(1,k.life/3);
    ctx.fillStyle='rgba(239,78,87,'+(0.10+0.08*pulse)*fade+')';ctx.beginPath();ctx.arc(k.x,k.y,BONUS.zoneR,0,7);ctx.fill();
    ctx.strokeStyle='rgba(239,78,87,'+0.6*fade+')';ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(k.x,k.y,BONUS.zoneR,0,7);ctx.stroke();ctx.setLineDash([]);
    const col=PICKS[k.type].col,bob=Math.sin(k.ph*3)*3;
    ctx.shadowColor=col;ctx.shadowBlur=14;ctx.fillStyle=col;
    if(k.type==='bomb'){ctx.beginPath();ctx.arc(k.x,k.y+bob,10,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=C.chalk;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(k.x+6,k.y-7+bob);ctx.quadraticCurveTo(k.x+12,k.y-16+bob,k.x+16,k.y-12+bob);ctx.stroke();
      if(Math.floor(k.ph*10)%2){ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(k.x+16,k.y-12+bob,3,0,7);ctx.fill()}}
    else{ctx.beginPath();for(let i=0;i<10;i++){const rr=i%2?5:12,a=-Math.PI/2+i*Math.PI/5;ctx.lineTo(k.x+Math.cos(a)*rr,k.y+bob+Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.shadowBlur=0}
  }
  // דלת הזהב
  if(bn.door){
    const d=bn.door,k=d.life/BONUS.doorLife;
    ctx.shadowColor=C.gold;ctx.shadowBlur=20;ctx.fillStyle='rgba(244,199,79,0.25)';ctx.strokeStyle=C.gold;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(d.x-16,d.y+14);ctx.lineTo(d.x-16,d.y-12);ctx.arc(d.x,d.y-12,16,Math.PI,0);ctx.lineTo(d.x+16,d.y+14);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(244,199,79,0.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(d.x,d.y,30,-Math.PI/2,-Math.PI/2+Math.PI*2*k);ctx.stroke();
  }
  for(const b of bn.blasts){const r=40+b.t*700;ctx.strokeStyle='rgba(255,138,61,'+(1-b.t/0.6)+')';ctx.lineWidth=18*(1-b.t/0.6)+2;ctx.beginPath();ctx.arc(b.x,b.y,r,0,7);ctx.stroke()}
  // הילה של באף
  if(P.power>0){ctx.strokeStyle='rgba(244,199,79,'+(0.35+0.25*Math.sin(S.t*12))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(P.x,P.y-6,26,0,7);ctx.stroke()}
}
function drawBonusScreen(ox,oy){
  const bn=S.bn;
  if(S.room){
    ctx.textAlign='center';ctx.direction=DIR;ctx.font='400 30px "Secular One", Heebo, sans-serif';
    ctx.fillStyle=C.gold;ctx.fillText(Math.ceil(S.room.t)+'',W/2,150);
    ctx.font='800 14px Heebo, sans-serif';ctx.fillStyle=C.chalk;ctx.fillText(T('roomCoins',S.room.got),W/2,174);
    return;
  }
  for(const k of bn.picks)edgeArrow(k.x+ox,k.y+oy,PICKS[k.type].col);
  if(bn.door)edgeArrow(bn.door.x+ox,bn.door.y+oy,C.gold);
}
