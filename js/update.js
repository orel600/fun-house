/* עדכון כל פריים */
function movePlayer(dt){
  let ix=0,iy=0;if(joy){ix=joy.dx;iy=joy.dy}
  if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;if(keys.KeyW||keys.ArrowUp)iy-=1;if(keys.KeyS||keys.ArrowDown)iy+=1;
  const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m}
  const sp=P.speed*(P.power>0?BONUS.powerSpeed:1);
  P.moving=m>0.12;P.vx=ix*sp;P.vy=iy*sp;P.x+=P.vx*dt;P.y+=P.vy*dt;
  if(P.moving)P.walk+=dt*sp*0.07;
  // הגוף פונה לאן שהולכים. בעמידה הוא מסתובב אל מה שתוקפים (P.aim). מסתובב ברכות, בלי קפיצות
  const want=P.moving?Math.atan2(iy,ix):P.aim,d=angDiff(want,P.face),k=MOVE.turn*dt;
  P.face=Math.abs(d)<=k?want:angDiff(P.face+Math.sign(d)*k,0);
  return{ix,iy};
}
function update(dt){
  if(S.room){roomUpdate(dt);return}
  S.t+=dt;P.inv-=dt;P.swapBuff-=dt;S.shake=Math.max(0,S.shake-dt*30);S.hurt-=dt;
  if(P.regen)P.hp=Math.min(P.maxHp,P.hp+P.regen*dt);
  heroTick(dt);   // סגנון המשחק (heroes.js)
  // move
  const {ix,iy}=movePlayer(dt);
  if(P.moving&&!nearest(440))P.aim=Math.atan2(iy,ix);
  const nn=nearest(600);
  if(nn){const tr=P.track;tr[P.weapon]+=dt;if(P.moving)tr.move+=dt;else tr.still+=dt;tr.dist+=Math.hypot(nn.x-P.x,nn.y-P.y);tr.distN++}
  attack(dt);spawner(dt);runUpdate();if(S.mode!=='play')return;
  if(!S.boss&&S.t>=S.nextBoss){const b=makeBoss();S.boss=b;enemies.push(b);showIntro(b);return}
  // enemies
  for(const e of enemies){
    if(e.dead)continue;
    if(e.isBoss){bossUpdate(e,dt);continue}
    if(e.wanted){wantedMove(e,dt);continue}
    const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;let mx=dx/d,my=dy/d;
    if(e.type==='wisp'){
      // מכשף רגיל שומר מרחק. מכשף-על מתקדם אליך, כדי שלא יסתתר מאחורי המלווים שלו
      if(e.elite){}else if(d<170){mx=-mx;my=-my}else if(d<240){const t=mx;mx=-my;my=t}
      e.shoot-=dt;if(e.shoot<=0&&d<380){e.shoot=rand(1.8,2.8);shootE(e.x,e.y,Math.atan2(dy,dx),175,6,8)}
    }
    const sp=e.speed*slowK(e);e.x+=mx*sp*dt+e.kx*dt;e.y+=my*sp*dt+e.ky*dt;
    const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;
    if(d<e.r+P.r-3)hurt(e.dmg);
  }
  dmgUpdate(dt);
  // separation
  for(let i=0;i<enemies.length;i++){const a=enemies[i];for(let j=i+1;j<enemies.length;j++){const b=enemies[j];const dx=b.x-a.x,dy=b.y-a.y,rr=a.r+b.r;if(Math.abs(dx)>rr||Math.abs(dy)>rr)continue;const d=Math.hypot(dx,dy)||.01;if(d<rr){const p=(rr-d)/2,ux=dx/d,uy=dy/d;if(!a.isBoss){a.x-=ux*p;a.y-=uy*p}if(!b.isBoss){b.x+=ux*p;b.y+=uy*p}}}}
  // player bullets
  const hitable=S.nd.list.length?enemies.concat(S.nd.list):enemies;   // גם מקורות משאבים (nodes.js)
  for(const b of pb){
    shotFly(b,dt);   // חץ טס ישר, קסם מתביית (weapons.js)
    for(const e of hitable){
      if(e.dead||b.hit.has(e)||b.life<=0)continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+4)shotHit(b,e);
    }
  }
  pb=pb.filter(b=>b.life>0);
  for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot(P.x-b.x,P.y-b.y)<P.r+b.r-3){hurt(b.dmg);b.life=0}}
  eb=eb.filter(b=>b.life>0);
  // orbs
  for(const o of orbs){const dx=P.x-o.x,dy=P.y-o.y,d=Math.hypot(dx,dy)||1;
    if(d<P.magnet){const s=Math.max(220,600-d*2);o.x+=dx/d*s*dt;o.y+=dy/d*s*dt}
    if(d<P.r+8){o.v<0||gainXP(o.v);o.v=-1}}
  orbs=orbs.filter(o=>o.v>0);
  // הרעיונות של אוראל: דלת בונוס ופריטים במקומות קשים
  bonusUpdate(dt);if(S.room||S.mode!=='play')return;
  // המבוקש: שמועה, מרדף ושלל
  wantedUpdate(dt);
  // עצים, סלעים ועורקי מתכת (nodes.js)
  nodesUpdate(dt);
  lootUpdate(dt);   // עמודי אור של שלל (loot.js)
  // mines & waves
  for(const mn of mines){mn.t-=dt;if(mn.t<=0){if(Math.hypot(P.x-mn.x,P.y-mn.y)<58)hurt(16);sparks(mn.x,mn.y,C.blood,14,240);S.shake=Math.max(S.shake,4)}}
  mines=mines.filter(mn=>mn.t>0);
  for(const w of waves){w.t+=dt;if(w.t>=0){w.r=w.from+(w.max-w.from)*Math.min(1,w.t/0.9);if(!w.hit&&Math.abs(Math.hypot(P.x-w.x,P.y-w.y)-w.r)<16){w.hit=true;hurt(18)}}}
  waves=waves.filter(w=>w.t<0.9);
  enemies=enemies.filter(e=>!e.dead);
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  if(S.pendingLv>0&&S.mode==='play')openLevelUp();
}
