/* ציור: דמויות, אויבים, בוס וממשק. השלד והסקינים של הדמויות ב-rig.js */
function drawPlayer(){
  if(P.inv>0&&Math.floor(P.inv*20)%2===0)return;
  if(P.swapBuff>0){ctx.fillStyle='rgba(244,199,79,0.12)';ctx.beginPath();ctx.arc(P.x,P.y-6,30,0,Math.PI*2);ctx.fill()}
  const s=P.sw,sword=P.weapon==='sword';
  const a=sword&&s.anim>0?s.ang-s.arc/2+s.arc*(1-s.anim/0.2):P.aim;
  if(!R3D.on){
  const p=pose(P.x,P.y,P.walk,P.moving,a,sword?10:11-P.gn.recoil*4),o={skin:LOOK.player,col:(HEROES.list[heroId()]||{}).col||C.chalk,lw:3};
  drawRig(p,o);
  const hand=p.armF[1],hx=hand.x,hy=hand.y;
  AGE_FX.hand={x:hx+Math.cos(a)*14,y:hy+Math.sin(a)*14};   // הזוהר של Aging יושב על הנשק (aging.js)
  if(!drawRigWeapon(p,o,P.weapon,a)){
    if(sword){
      ctx.strokeStyle=dtCol(P.dt.sword);ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+Math.cos(a)*24,hy+Math.sin(a)*24);ctx.stroke();
      ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx+Math.cos(a+1.57)*5,hy+Math.sin(a+1.57)*5);ctx.lineTo(hx-Math.cos(a+1.57)*5,hy-Math.sin(a+1.57)*5);ctx.stroke();
    }else{
      // קשת: ניצבת לכיוון הירי, והמיתר נמתח לקראת החץ הבא
      const cx=Math.cos(a),cy=Math.sin(a),k=Math.max(0,Math.min(1,1-P.gn.t/P.gn.cd));
      const t1x=hx-cy*12-cx*3,t1y=hy+cx*12-cy*3,t2x=hx+cy*12-cx*3,t2y=hy-cx*12-cy*3,sx=hx-cx*(2+k*8),sy=hy-cy*(2+k*8);
      ctx.strokeStyle=dtCol(P.dt.gun);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(t1x,t1y);ctx.quadraticCurveTo(hx+cx*9,hy+cy*9,t2x,t2y);ctx.stroke();
      ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(t1x,t1y);ctx.lineTo(sx,sy);ctx.lineTo(t2x,t2y);ctx.stroke();
      if(k>0.3){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(hx+cx*10,hy+cy*10);ctx.stroke()}
    }
  }}
  if(sword&&s.anim>0){
    const k=s.anim/0.2,start=s.ang-s.arc/2,end=start+s.arc*(1-k);
    ctx.globalAlpha=0.55*k+0.15;ctx.strokeStyle=dtCol(P.dt.sword);ctx.lineWidth=12*k+2;
    ctx.beginPath();ctx.arc(P.x,P.y-8,s.range*0.72,start,end);ctx.stroke();ctx.globalAlpha=1;
  }
}
function drawEnemyRig(e){
  const fl=e.flash>0,p=pose(e.x,e.y,e.ph,true,null);
  drawRig(p,{skin:LOOK[e.type],col:fl?'#fff':C.dim,lw:fl?3.5:2.5});
  return p;
}
// טבעת בצבע החולשה מתחת לרגליים (בתלת-ממד היא בשכבה שמתחת). לאויב-על ולבוס גם הצורה של סוג הנזק מעל הראש.
// בדו-ממד אויב-על מצויר בתוך הגדלה, אז המידות כאן בלי הגודל שלו
function weakRing(e,top){
  if(!e.weak)return;const k=R3D.on?e.big||1:1,r=R3D.on?e.r:e.r/(e.big||1);
  if(!R3D.on){ctx.strokeStyle=dtCol(e.weak);ctx.globalAlpha=0.85;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y+r*0.75,r*1.25,r*0.55,0,0,7);ctx.stroke();ctx.globalAlpha=1}
  if(e.elite||e.isBoss)dtIcon(e.x,top-12*k,e.weak,14+4*k);
}
function drawEnemy(e){
  const fl=e.flash>0;
  {const L=R3D.on&&lookOf(e);weakRing(e,L?e.y+(L.foot-L.h)*(e.big||1)-6:e.y-(e.isBoss?60:44))}
  // בתלת-ממד הגוף מצויר בשכבה שמתחת. כאן נשארים רק הסימונים: פס חיים, טבעת הזמן של המבוקש, וההתראות של הבוס
  if(R3D.on&&lookOf(e)){if(e.isBoss)drawBoss(e);else if(e.wanted)drawWanted(e);
    if(!e.isBoss&&e.hp<e.max){const L=lookOf(e),k=e.big||1,w=24*k,y=e.y+(L.foot-L.h)*k-6;ctx.fillStyle=C.line;ctx.fillRect(e.x-w/2,y,w,3);ctx.fillStyle=C.blood;ctx.fillRect(e.x-w/2,y,w*Math.max(0,e.hp/e.max),3)}
    return}
  if(e.type==='grunt'){
    const h=drawEnemyRig(e).head;
    ctx.beginPath();ctx.moveTo(h.x-5,h.y-5);ctx.lineTo(h.x-7,h.y-11);ctx.moveTo(h.x+5,h.y-5);ctx.lineTo(h.x+7,h.y-11);ctx.stroke();
  }else if(e.type==='shield'){
    drawEnemyRig(e);
    const a=Math.atan2(P.y-e.y,P.x-e.x),cx=e.x+Math.cos(a)*14,cy=e.y-8+Math.sin(a)*14;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
    ctx.fillStyle=fl?'#fff':C.ink;ctx.strokeStyle=fl?'#fff':dtCol(e.weak);ctx.lineWidth=2.5;
    ctx.beginPath();ctx.roundRect(-3,-13,7,26,3);ctx.fill();ctx.stroke();ctx.restore();
  }else if(e.type==='wisp'){
    const bob=Math.sin(e.ph*0.6)*4,y=e.y-14+bob;
    ctx.strokeStyle=fl?'#fff':dtCol(e.weak);ctx.fillStyle=fl?'rgba(255,255,255,.4)':C.ink;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.arc(e.x,y,e.r,Math.PI,0);
    for(let i=0;i<=4;i++){const px=e.x+e.r-i*(e.r/2);ctx.lineTo(px,y+e.r+(i%2?6:0)+Math.sin(e.ph+i)*2)}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=dtCol(e.weak);ctx.beginPath();ctx.arc(e.x-4,y-2,2,0,7);ctx.arc(e.x+4,y-2,2,0,7);ctx.fill();
  }else if(e.isBoss){drawBoss(e)}else if(e.wanted){drawWanted(e)}
  if(!e.isBoss&&e.hp<e.max){const w=24;ctx.fillStyle=C.line;ctx.fillRect(e.x-w/2,e.y-40,w,3);ctx.fillStyle=C.blood;ctx.fillRect(e.x-w/2,e.y-40,w*Math.max(0,e.hp/e.max),3)}
}
function drawBoss(b){
  const fl=b.flash>0,glow=dtCol(b.weak);
  if(b.charge&&b.charge.stage===0){
    ctx.strokeStyle='rgba(239,78,87,0.18)';ctx.lineWidth=b.r*2;ctx.lineCap='butt';
    ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(b.charge.a)*320,b.y+Math.sin(b.charge.a)*320);ctx.stroke();ctx.lineCap='round';
  }
  if(R3D.on){if(b.rage>0.05){ctx.strokeStyle='rgba(239,78,87,'+b.rage+')';ctx.lineWidth=2+b.rage*4;ctx.beginPath();ctx.ellipse(b.x,b.y+b.r*0.8,b.r*1.5,b.r*0.9,0,0,7);ctx.stroke()}return}
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
const onScreen=(sx,sy,m=90)=>sx>-m&&sx<W+m&&sy>-m&&sy<H+m+40;
/* חץ בקצה המסך שמצביע על משהו מחוץ למסך. s: גודל החץ */
function edgeArrow(sx,sy,col,s=1){
  if(sx>=-20&&sx<=W+20&&sy>=-20&&sy<=H+20)return;
  const a=Math.atan2(sy-H/2,sx-W/2),ex=Math.max(28,Math.min(W-28,W/2+Math.cos(a)*W)),ey=Math.max(110,Math.min(H-40,H/2+Math.sin(a)*H));
  ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.scale(s,s);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-7,-8);ctx.lineTo(-7,8);ctx.fill();ctx.restore();
}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  // בתלת-ממד הקנבס שקוף: הקרקע והדמויות מצוירות בשכבה שמתחתיו (render3d.js)
  if(R3D.on)ctx.clearRect(0,0,W,H);else{ctx.fillStyle=S&&S.room?'#262114':C.ink;ctx.fillRect(0,0,W,H)}
  if(!P)return;
  const sh=RM?0:S.shake,ox=Math.round(W/2-S.cam.x+rand(-sh,sh)),oy=Math.round(H/2-S.cam.y+rand(-sh,sh));
  render3d(ox,oy);
  ctx.translate(ox,oy);
  // ground
  if(!R3D.on){const g=90,x0=Math.floor(-ox/g)*g,y0=Math.floor(-oy/g)*g;
  ctx.strokeStyle='rgba(236,231,220,0.07)';ctx.lineWidth=1.5;ctx.beginPath();
  for(let x=x0;x<-ox+W+g;x+=g)for(let y=y0;y<-oy+H+g;y+=g){const h=hash(x,y);
    if(h<0.5){ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4)}
    else if(h<0.72){ctx.moveTo(x+14,y+22);ctx.lineTo(x+26,y+18)}}
  ctx.stroke();}
  // mines & waves
  for(const mn of mines){const k=mn.t/1.3;ctx.strokeStyle='rgba(239,78,87,'+(0.5-k*0.3)+')';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(mn.x,mn.y,58,0,7);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=Math.floor(mn.t*(k<.4?16:6))%2?C.blood:C.ink;ctx.strokeStyle=C.blood;ctx.beginPath();ctx.arc(mn.x,mn.y,7,0,7);ctx.fill();ctx.stroke()}
  for(const w of waves){
    if(w.t<0){ctx.strokeStyle='rgba(199,166,255,0.35)';ctx.lineWidth=2;ctx.setLineDash([4,8]);ctx.beginPath();ctx.arc(w.x,w.y,w.max,0,7);ctx.stroke();ctx.setLineDash([])}
    else{ctx.strokeStyle='rgba(199,166,255,'+(0.9-w.t)+')';ctx.lineWidth=14;ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,7);ctx.stroke()}}
  // orbs
  for(const o of orbs){ctx.fillStyle=C.gold;ctx.beginPath();ctx.moveTo(o.x,o.y-5);ctx.lineTo(o.x+4,o.y);ctx.lineTo(o.x,o.y+5);ctx.lineTo(o.x-4,o.y);ctx.fill()}
  drawBonusWorld();
  drawVillage();
  drawWorld();   // העולם הפתוח (world.js)
  // actors sorted by y
  // מציירים רק מי שעל המסך: עם מאות אויבים זה חוסך את רובם
  const actors=enemies.filter(e=>e.isBoss||onScreen(e.x+ox,e.y+oy));actors.push({isPlayer:true,y:P.y});actors.sort((a,b)=>a.y-b.y);
  for(const a of actors){if(a.isPlayer)drawPlayer();
    else if(a.big&&!R3D.on){ctx.save();ctx.translate(a.x,a.y);ctx.scale(a.big,a.big);ctx.translate(-a.x,-a.y);drawEnemy(a);ctx.restore()}
    else drawEnemy(a)}
  drawAgeFx();   // זוהר, שובל וחלקיקים על נשק משודרג (aging.js)
  // חצים: מוט, נוצות וחוד
  ctx.strokeStyle=ctx.fillStyle=dtCol(P.dt.gun);ctx.lineWidth=2;
  for(const b of pb){
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx));
    ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(0,0);ctx.moveTo(-17,0);ctx.lineTo(-22,-3.5);ctx.moveTo(-17,0);ctx.lineTo(-22,3.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-2,-3.5);ctx.lineTo(-2,3.5);ctx.closePath();ctx.fill();ctx.restore();
  }
  for(const b of eb){ctx.fillStyle=C.blood;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.fillStyle='#FFD9DB';ctx.beginPath();ctx.arc(b.x,b.y,b.r*0.45,0,7);ctx.fill()}
  for(const p of parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,7);ctx.fill()}
  ctx.globalAlpha=1;
  drawFx();   // חגיגות של התקדמות (fx.js)
  ctx.textAlign='center';
  // מספר עם סימן (+12, -16) נכתב משמאל לימין בכל שפה, אחרת הסימן קופץ לצד הלא נכון
  // מכה קריטית קופצת לרגע ומקבלת מסגרת לבנה
  for(const f of floats){ctx.direction=f.ltr||/^[+\-]\d/.test(f.txt)?'ltr':DIR;ctx.globalAlpha=Math.min(1,f.life*2);
    const sz=f.crit?f.size*(1+Math.max(0,f.life-0.8)*4):f.size;ctx.font='800 '+sz+'px Heebo, system-ui, sans-serif';
    if(f.crit){ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.lineJoin='round';ctx.strokeText(f.txt,f.x,f.y)}
    else{ctx.fillStyle='#0009';ctx.fillText(f.txt,f.x+1,f.y+1)}
    ctx.fillStyle=f.crit?C.ink:f.col;ctx.fillText(f.txt,f.x,f.y);if(f.crit){ctx.lineWidth=1.5;ctx.strokeStyle=f.col;ctx.strokeText(f.txt,f.x,f.y)}}
  ctx.globalAlpha=1;ctx.direction=DIR;
  // screen space
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(S.boss){const b=S.boss,sx=b.x+ox,sy=b.y+oy;
    if(sx<-20||sx>W+20||sy<-20||sy>H+20){const a=Math.atan2(sy-H/2,sx-W/2),ex=Math.max(28,Math.min(W-28,W/2+Math.cos(a)*W)),ey=Math.max(110,Math.min(H-40,H/2+Math.sin(a)*H));
      ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle=C.lilac;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-8,10);ctx.fill();ctx.restore()}}
  drawBonusScreen(ox,oy);
  drawWantedScreen(ox,oy);
  drawVillageScreen(ox,oy);
  drawWorldScreen(ox,oy);
  drawQuestMarks(ox,oy);
  if(joy){ctx.strokeStyle='rgba(236,231,220,0.22)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,55,0,7);ctx.stroke();
    ctx.fillStyle='rgba(236,231,220,0.3)';ctx.beginPath();ctx.arc(joy.ox+joy.dx*55,joy.oy+joy.dy*55,22,0,7);ctx.fill()}
  if(S.hurt>0){const gr=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);gr.addColorStop(0,'rgba(239,78,87,0)');gr.addColorStop(1,'rgba(239,78,87,'+(S.hurt*1.2)+')');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}
}
let lastHud='',lastNums='';
// פס ההתקדמות: התחנות נבנות פעם אחת, ואחר כך רק המילוי והסימון של מה שעבר זזים
function drawRunBar(){
  const bar=$('runbar');
  if(!bar.dataset.n){bar.dataset.n=1;
    for(const s of [...RUN.stations,{t:RUN.bossAt,kind:'boss'}]){const m=document.createElement('i');m.className='mk '+s.kind;m.style.insetInlineStart=(100*s.t/RUN.bossAt)+'%';bar.appendChild(m)}}
  $('runfill').style.width=(100*Math.min(1,S.t/RUN.bossAt))+'%';
  const ms=bar.querySelectorAll('.mk'),done=S.run.next+(S.boss||S.run.won?1:0);
  if(bar.dataset.done!==String(done)){bar.dataset.done=done;ms.forEach((m,i)=>m.classList.toggle('done',i<done))}
}
function hud(){
  if(!P)return;
  $('hp').style.width=(100*P.hp/P.maxHp)+'%';
  $('xp').style.width=(100*P.xp/P.next)+'%';
  const nums=Math.ceil(Math.max(0,P.hp))+' / '+P.maxHp+'|'+P.xp+' / '+P.next;
  if(nums!==lastNums){lastNums=nums;const [h,x]=nums.split('|');$('hpTxt').textContent=h;$('xpTxt').textContent=x}
  const nx=nextStation(),key=LANG+'|'+fmt(S.t)+'|'+P.level+'|'+(S.boss?1:S.run.won?2:nx.kind+fmt(nx.t-S.t));
  if(key!==lastHud){lastHud=key;$('clock').textContent=fmt(S.t);$('lvl').textContent=T('level',P.level);
    $('bossin').textContent=S.boss?T('bossHere'):S.run.won?T('bossBeaten'):T(nx.kind==='boss'?'bossIn':'next.'+nx.kind,fmt(nx.t-S.t))}
  drawRunBar();
  const bb=$('bossbar');
  if(S.boss){bb.hidden=false;$('bossnm').textContent=S.boss.name+' · '+S.boss.title;
    const wk=$('bossweak');if(wk.dataset.k!==LANG+S.boss.weak){wk.dataset.k=LANG+S.boss.weak;wk.innerHTML=dtSvg(S.boss.weak)+T('weakTo',T('dt.'+S.boss.weak));wk.style.color=dtCol(S.boss.weak)}
    $('bossfill').style.width=(100*Math.max(0,S.boss.hp)/S.boss.max)+'%';
    $('ragetrack').hidden=S.boss.rage<0.02;$('ragefill').style.width=(100*S.boss.rage)+'%'}
  else bb.hidden=true;
  let hint=false;
  // הכפתור פועם כשהאויב הקרוב עמיד לסוג הנזק שביד, והנשק השני עדיף נגדו
  if(S.mode==='play'){const n=nearest(260),o=P.weapon==='sword'?'gun':'sword';if(n&&(n.mult[P.dt[P.weapon]]??1)<(n.mult[P.dt[o]]??1)&&(n.mult[P.dt[P.weapon]]??1)<=1)hint=true}
  $('swap').classList.toggle('hint',hint);
}
