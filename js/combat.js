/* קרב: פגיעה, נזק, החלפת נשק */
function nearest(maxD){let b=null,bd=maxD;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-P.x,e.y-P.y)-e.r;if(d<bd){bd=d;b=e}}return b}
function sparks(x,y,col,n,sp=180){for(let i=0;i<n;i++){const a=rand(0,6.28),s=rand(sp*.3,sp);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.45),max:.45,col,size:rand(1.5,3.5)})}}
function floatText(x,y,txt,col,size){floats.push({x,y,txt,col,size,life:.75,vy:-55})}
function damage(e,base,w,ang){
  const m=e.mult[w]??1;const crit=Math.random()<0.12;
  const d=base*m*(P.swapBuff>0?2:1)*(P.power>0?BONUS.powerDmg:1)*(crit?1.8:1);
  e.hp-=d;e.flash=0.09;
  if(!e.isBoss){const kb=(w==='sword'?150:55)*(m>1?1.4:1);e.kx+=Math.cos(ang)*kb;e.ky+=Math.sin(ang)*kb}
  const col=m>1?(w==='sword'?C.ember:C.tide):m<1?C.dim:C.chalk;
  floatText(e.x+rand(-8,8),e.y-e.r-8,Math.round(d)+(crit?'!':''),col,m>1?21:m<1?12:15);
  if(m<1&&!e.told){e.told=true;floatText(e.x,e.y-e.r-26,'חסין',C.dim,13)}
  sparks(e.x,e.y,col,m>1?8:3);
  if(m>1&&w==='sword')S.hitstop=Math.max(S.hitstop,0.03);
  if(e.hp<=0&&!e.dead)kill(e);
}
function kill(e){
  e.dead=true;S.kills++;
  if(e.isBoss){bossDown(e);return}
  for(let i=0;i<e.xp;i++)orbs.push({x:e.x+rand(-8,8),y:e.y+rand(-8,8),v:1});
  const col=e.type==='shield'?C.ember:e.type==='wisp'?C.tide:C.chalk;
  sparks(e.x,e.y,col,10,220);
}
function hurt(d){
  if(P.inv>0||S.mode!=='play')return;
  P.hp-=d;P.inv=0.6;S.shake=Math.max(S.shake,7);S.hurt=0.3;
  floatText(P.x,P.y-36,'-'+Math.round(d),C.blood,17);
  if(P.hp<=0){P.hp=0;gameOver()}
}
function attack(dt){
  if(P.weapon==='sword'){
    const s=P.sw;s.t-=dt;s.anim=Math.max(0,s.anim-dt);
    const tgt=nearest(s.range);
    if(tgt)P.aim=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    if(tgt&&s.t<=0){
      s.t=s.cd;s.anim=0.2;s.ang=P.aim;
      for(const e of enemies){
        if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)-e.r;
        if(d>s.range)continue;const a=Math.atan2(dy,dx);
        if(Math.abs(angDiff(a,s.ang))>s.arc/2&&d>8)continue;
        damage(e,s.dmg,'sword',a);
      }
      S.shake=Math.max(S.shake,2);
    }
  }else{
    const g=P.gn;g.t-=dt;g.recoil=Math.max(0,g.recoil-dt*8);
    const tgt=nearest(440);
    if(tgt)P.aim=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    if(tgt&&g.t<=0){
      g.t=g.cd;g.recoil=1;
      for(let i=0;i<g.multi;i++){
        const a=P.aim+(i-(g.multi-1)/2)*0.14,hx=P.x+Math.cos(a)*22,hy=P.y-6+Math.sin(a)*22;
        pb.push({x:hx,y:hy,vx:Math.cos(a)*g.speed,vy:Math.sin(a)*g.speed,life:0.9,pierce:g.pierce,hit:new Set()});
      }
      parts.push({x:P.x+Math.cos(P.aim)*24,y:P.y-6+Math.sin(P.aim)*24,vx:0,vy:0,life:.06,max:.06,col:C.tide,size:3});
    }
  }
}
function swapWeapon(){
  if(S.mode!=='play')return;
  P.weapon=P.weapon==='sword'?'gun':'sword';
  if(P.swapLvl>0)P.swapBuff=1.5;
  sparks(P.x,P.y-8,P.weapon==='sword'?C.ember:C.tide,10,140);
  updateSwapBtn();
}
// הנשק מרחוק הוא חץ וקשת. בקוד הוא נשאר gun, כדי לא לשנות את הלוגיקה
const ICON={sword:'<path d="M20 4 9.5 14.5M20 4h-4M20 4v4M7 12l5 5M8.5 15.5 4 20"/>',
  gun:'<path d="M5 9Q16 8 15 19"/><path d="M5 9 15 19" stroke-width="1.2"/><path d="M7 17 20 4M20 4h-5M20 4v5M7 17H4M7 17v3"/>'};
function updateSwapBtn(){const w=P?P.weapon:'sword';const b=$('swap');b.classList.toggle('gun',w==='gun');$('ico').innerHTML=ICON[w];$('swaplbl').textContent=w==='sword'?'חרב':'קשת'}
