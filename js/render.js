/* ציור: דמויות, אויבים, בוס וממשק. השלד והסקינים של הדמויות ב-rig.js */
function drawPlayer(){
  if(P.inv>0&&Math.floor(P.inv*20)%2===0)return;
  if(P.swapBuff>0){ctx.fillStyle='rgba(244,199,79,0.12)';ctx.beginPath();ctx.arc(P.x,P.y-6,30,0,Math.PI*2);ctx.fill()}
  const s=P.sw,sword=P.weapon==='sword';
  const a=sword&&s.anim>0?s.ang-s.arc/2+s.arc*(1-s.anim/0.2):P.aim;
  const p=pose(P.x,P.y,P.walk,P.moving,a,sword?10:11-P.gn.recoil*4),o={skin:LOOK.player,col:C.chalk,lw:3};
  drawRig(p,o);
  const hand=p.armF[1],hx=hand.x,hy=hand.y;
  if(!drawRigWeapon(p,o,P.weapon,a)){
    if(sword){
      ctx.strokeStyle=C.ember;ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+Math.cos(a)*24,hy+Math.sin(a)*24);ctx.stroke();
      ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx+Math.cos(a+1.57)*5,hy+Math.sin(a+1.57)*5);ctx.lineTo(hx-Math.cos(a+1.57)*5,hy-Math.sin(a+1.57)*5);ctx.stroke();
    }else{
      ctx.strokeStyle=C.tide;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+Math.cos(a)*13,hy+Math.sin(a)*13);ctx.stroke();
    }
  }
  if(sword&&s.anim>0){
    const k=s.anim/0.2,start=s.ang-s.arc/2,end=start+s.arc*(1-k);
    ctx.strokeStyle='rgba(255,138,61,'+(0.55*k+0.15)+')';ctx.lineWidth=12*k+2;
    ctx.beginPath();ctx.arc(P.x,P.y-8,s.range*0.72,start,end);ctx.stroke();
  }
}
function drawEnemyRig(e){
  const fl=e.flash>0,p=pose(e.x,e.y,e.ph,true,null);
  drawRig(p,{skin:LOOK[e.type],col:fl?'#fff':C.dim,lw:fl?3.5:2.5});
  return p;
}
function drawEnemy(e){
  const fl=e.flash>0;
  if(e.type==='grunt'){
    const h=drawEnemyRig(e).head;
    ctx.beginPath();ctx.moveTo(h.x-5,h.y-5);ctx.lineTo(h.x-7,h.y-11);ctx.moveTo(h.x+5,h.y-5);ctx.lineTo(h.x+7,h.y-11);ctx.stroke();
  }else if(e.type==='shield'){
    drawEnemyRig(e);
    const a=Math.atan2(P.y-e.y,P.x-e.x),cx=e.x+Math.cos(a)*14,cy=e.y-8+Math.sin(a)*14;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
    ctx.fillStyle=fl?'#fff':'rgba(255,138,61,0.22)';ctx.strokeStyle=fl?'#fff':C.ember;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.roundRect(-3,-13,7,26,3);ctx.fill();ctx.stroke();ctx.restore();
  }else if(e.type==='wisp'){
    const bob=Math.sin(e.ph*0.6)*4,y=e.y-14+bob;
    ctx.strokeStyle=fl?'#fff':C.tide;ctx.fillStyle=fl?'rgba(255,255,255,.4)':'rgba(70,211,230,0.14)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(e.x,y,e.r,Math.PI,0);
    for(let i=0;i<=4;i++){const px=e.x+e.r-i*(e.r/2);ctx.lineTo(px,y+e.r+(i%2?6:0)+Math.sin(e.ph+i)*2)}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=C.tide;ctx.beginPath();ctx.arc(e.x-4,y-2,2,0,7);ctx.arc(e.x+4,y-2,2,0,7);ctx.fill();
  }else if(e.isBoss){drawBoss(e)}else if(e.wanted){drawWanted(e)}
  if(!e.isBoss&&e.hp<e.max){const w=24;ctx.fillStyle=C.line;ctx.fillRect(e.x-w/2,e.y-40,w,3);ctx.fillStyle=C.blood;ctx.fillRect(e.x-w/2,e.y-40,w*Math.max(0,e.hp/e.max),3)}
}
function drawBoss(b){
  const fl=b.flash>0,glow=b.weak==='sword'?C.ember:C.tide;
  if(b.charge&&b.charge.stage===0){
    ctx.strokeStyle='rgba(239,78,87,0.18)';ctx.lineWidth=b.r*2;ctx.lineCap='butt';
    ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(b.charge.a)*320,b.y+Math.sin(b.charge.a)*320);ctx.stroke();ctx.lineCap='round';
  }
  ctx.save();ctx.translate(b.x,b.y);
  ctx.shadowColor=glow;ctx.shadowBlur=18;
  const n=7,R=b.r+(b.phase>1?14:9);
  ctx.beginPath();
  for(let i=0;i<n*2;i++){const a=b.spin+i*Math.PI/n,rr=i%2?b.r:R;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}
  ctx.closePath();
  ctx.fillStyle=fl?'#fff':(b.phase>1?'#3A2440':'#2A2240');ctx.fill();
  ctx.lineWidth=3;ctx.strokeStyle=fl?'#fff':glow;ctx.stroke();ctx.shadowBlur=0;
  if(b.rage>0.05){ctx.strokeStyle='rgba(239,78,87,'+b.rage+')';ctx.lineWidth=2+b.rage*4;ctx.beginPath();ctx.arc(0,0,R+8+Math.sin(b.spin*6)*2,0,7);ctx.stroke()}
  ctx.fillStyle=C.lilac;ctx.beginPath();ctx.arc(0,0,13,0,7);ctx.fill();
  const ea=Math.atan2(P.y-b.y,P.x-b.x);ctx.fillStyle=C.ink;ctx.beginPath();ctx.arc(Math.cos(ea)*5,Math.sin(ea)*5,6,0,7);ctx.fill();
  ctx.restore();
}
/* חץ בקצה המסך שמצביע על משהו מחוץ למסך. s: גודל החץ */
function edgeArrow(sx,sy,col,s=1){
  if(sx>=-20&&sx<=W+20&&sy>=-20&&sy<=H+20)return;
  const a=Math.atan2(sy-H/2,sx-W/2),ex=Math.max(28,Math.min(W-28,W/2+Math.cos(a)*W)),ey=Math.max(110,Math.min(H-40,H/2+Math.sin(a)*H));
  ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.scale(s,s);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-8);ctx.lineTo(-7,8);ctx.fill();ctx.restore();
}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle=S&&S.room?'#262114':C.ink;ctx.fillRect(0,0,W,H);
  if(!P)return;
  const sh=RM?0:S.shake,ox=Math.round(W/2-S.cam.x+rand(-sh,sh)),oy=Math.round(H/2-S.cam.y+rand(-sh,sh));
  ctx.translate(ox,oy);
  // ground
  const g=90,x0=Math.floor(-ox/g)*g,y0=Math.floor(-oy/g)*g;
  ctx.strokeStyle='rgba(236,231,220,0.07)';ctx.lineWidth=1.5;ctx.beginPath();
  for(let x=x0;x<-ox+W+g;x+=g)for(let y=y0;y<-oy+H+g;y+=g){const h=hash(x,y);
    if(h<0.5){ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4)}
    else if(h<0.72){ctx.moveTo(x+14,y+22);ctx.lineTo(x+26,y+18)}}
  ctx.stroke();
  // mines & waves
  for(const mn of mines){const k=mn.t/1.3;ctx.strokeStyle='rgba(239,78,87,'+(0.5-k*0.3)+')';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(mn.x,mn.y,58,0,7);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=Math.floor(mn.t*(k<.4?16:6))%2?C.blood:C.ink;ctx.strokeStyle=C.blood;ctx.beginPath();ctx.arc(mn.x,mn.y,7,0,7);ctx.fill();ctx.stroke()}
  for(const w of waves){
    if(w.t<0){ctx.strokeStyle='rgba(199,166,255,0.35)';ctx.lineWidth=2;ctx.setLineDash([4,8]);ctx.beginPath();ctx.arc(w.x,w.y,w.max,0,7);ctx.stroke();ctx.setLineDash([])}
    else{ctx.strokeStyle='rgba(199,166,255,'+(0.9-w.t)+')';ctx.lineWidth=14;ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,7);ctx.stroke()}}
  // orbs
  for(const o of orbs){ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(o.x,o.y-5);ctx.lineTo(o.x+4,o.y);ctx.lineTo(o.x,o.y+5);ctx.lineTo(o.x-4,o.y);ctx.fill()}
  drawBonusWorld();
  // actors sorted by y
  const actors=enemies.slice();actors.push({isPlayer:true,y:P.y});actors.sort((a,b)=>a.y-b.y);
  for(const a of actors){if(a.isPlayer)drawPlayer();else drawEnemy(a)}
  // bullets
  ctx.strokeStyle=C.tide;ctx.lineWidth=3;ctx.beginPath();
  for(const b of pb){ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*0.025,b.y-b.vy*0.025)}ctx.stroke();
  for(const b of eb){ctx.fillStyle=C.blood;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.fillStyle='#FFD9DB';ctx.beginPath();ctx.arc(b.x,b.y,b.r*0.45,0,7);ctx.fill()}
  for(const p of parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill()}
  ctx.globalAlpha=1;
  ctx.textAlign='center';ctx.direction='rtl';
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life*2);ctx.font='800 '+f.size+'px Heebo, system-ui, sans-serif';ctx.fillStyle='#0009';ctx.fillText(f.txt,f.x+1,f.y+1);ctx.fillStyle=f.col;ctx.fillText(f.txt,f.x,f.y)}
  ctx.globalAlpha=1;
  // screen space
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(S.boss){const b=S.boss,sx=b.x+ox,sy=b.y+oy;
    if(sx<-20||sx>W+20||sy<-20||sy>H+20){const a=Math.atan2(sy-H/2,sx-W/2),ex=Math.max(28,Math.min(W-28,W/2+Math.cos(a)*W)),ey=Math.max(110,Math.min(H-40,H/2+Math.sin(a)*H));
      ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle=C.lilac;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-8,10);ctx.fill();ctx.restore()}}
  drawBonusScreen(ox,oy);
  drawWantedScreen(ox,oy);
  if(joy){ctx.strokeStyle='rgba(236,231,220,0.22)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,55,0,7);ctx.stroke();
    ctx.fillStyle='rgba(236,231,220,0.3)';ctx.beginPath();ctx.arc(joy.ox+joy.dx*55,joy.oy+joy.dy*55,22,0,7);ctx.fill()}
  if(S.hurt>0){const gr=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);gr.addColorStop(0,'rgba(239,78,87,0)');gr.addColorStop(1,'rgba(239,78,87,'+(S.hurt*1.2)+')');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}
}
let lastHud='';
function hud(){
  if(!P)return;
  $('hp').style.width=(100*P.hp/P.maxHp)+'%';
  $('xp').style.width=(100*P.xp/P.next)+'%';
  const key=fmt(S.t)+'|'+P.level+'|'+(S.boss?1:fmt(S.nextBoss-S.t));
  if(key!==lastHud){lastHud=key;$('clock').textContent=fmt(S.t);$('lvl').textContent='רמה '+P.level;
    $('bossin').textContent=S.boss?'בוס בזירה':'בוס בעוד '+fmt(S.nextBoss-S.t)}
  const bb=$('bossbar');
  if(S.boss){bb.hidden=false;$('bossnm').textContent=S.boss.name+' · '+S.boss.title;
    const wk=$('bossweak');wk.textContent='חלש ל'+(S.boss.weak==='sword'?'חרב':'רובה');wk.style.color=S.boss.weak==='sword'?C.ember:C.tide;
    $('bossfill').style.width=(100*Math.max(0,S.boss.hp)/S.boss.max)+'%';
    $('ragetrack').hidden=S.boss.rage<0.02;$('ragefill').style.width=(100*S.boss.rage)+'%'}
  else bb.hidden=true;
  let hint=false;
  if(S.mode==='play'){const n=nearest(260);if(n&&(n.mult[P.weapon]??1)<1)hint=true}
  $('swap').classList.toggle('hint',hint);
}
