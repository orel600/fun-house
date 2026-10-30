/* קרב: פגיעה, נזק, החלפת נשק. סוגי הנזק ומה שהם עושים ב-dmg.js, וסוגי הנשק (חרב, קשת, מטה) ב-weapons.js */
const HITFX={floats:70,parts:450,crit:0.12,critMul:2.5};   // תקרה לטקסט צף ולניצוצות בשביל הטלפון, וסיכוי ועוצמה של מכה קריטית
function nearest(maxD){let b=null,bd=maxD;for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-P.x,e.y-P.y)-e.r;if(d<bd){bd=d;b=e}}return b}
function sparks(x,y,col,n,sp=180){n=Math.min(n,HITFX.parts-parts.length);for(let i=0;i<n;i++){const a=rand(0,6.28),s=rand(sp*.3,sp);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.2,.45),max:.45,col,size:rand(1.5,3.5)})}}
// ltr: מספר שנכתב תמיד משמאל לימין, גם בעברית. crit: מכה קריטית, גדולה ועם מסגרת
function floatText(x,y,txt,col,size,ltr=false,crit=false){
  if(floats.length>=HITFX.floats){const i=floats.findIndex(f=>f!==S.gain);if(i>=0)floats.splice(i,1)}
  floats.push({x,y,txt,col,size,ltr,crit,life:crit?.95:.75,vy:crit?-70:-55});
}
// w: הנשק שפגע. t: סוג הנזק, ברירת המחדל היא הסוג של הנשק (ופיזי למה שאינו נשק, כמו פצצה). chained: פגיעה של ברק שקפץ, שלא קופץ שוב
function damage(e,base,w,ang,t=P.dt[w]||'physical',chained=false){
  const m=e.mult[t]??1;const crit=Math.random()<HITFX.crit;
  const d=base*m*(P.swapBuff>0?2:1)*(P.power>0?BONUS.powerDmg:1)*(crit?HITFX.critMul:1);
  e.hp-=d;e.flash=0.09;sfx('hit');heroCount('dmg_'+w,d);   // סגנון המשחק (heroes.js)
  if(!e.isBoss){const kb=(w==='sword'?150:55)*(m>1?1.4:1)/(e.big||1);e.kx+=Math.cos(ang)*kb;e.ky+=Math.sin(ang)*kb}
  const col=m>1?dtCol(t):m<1?C.dim:C.chalk;
  floatText(e.x+rand(-8,8),e.y-e.r-8,big(d)+(crit?'!':''),col,(m>1?21:m<1?12:15)*(crit?1.45:1),true,crit);
  if(m<1&&!e.told){e.told=true;floatText(e.x,e.y-e.r-26,T('immune'),C.dim,13)}
  sparks(e.x,e.y,col,m>1?8:3);
  if(m>1&&w==='sword')S.hitstop=Math.max(S.hitstop,0.03);
  onHit(e,d,base,w,t,ang,chained);
  if(e.hp<=0&&!e.dead)kill(e);
}
function kill(e){
  e.dead=true;S.kills++;sfx('death');heroCount('kills');if(e.isBoss)heroCount('bosses');
  runDrop(e);   // שלל לכפר (village.js)
  questEvent('kill',e.isBoss?'boss':e.wanted?'wanted':e.type);
  if(e.isBoss){bossDown(e);return}
  if(e.wanted){wantedDown(e);return}
  if(e.elite)eliteDown(e);
  for(let i=0;i<e.xp;i++)orbs.push({x:e.x+rand(-8,8),y:e.y+rand(-8,8),v:1});
  sparks(e.x,e.y,dtCol(e.weak),10,220);
}
function hurt(d){
  if(P.inv>0||S.mode!=='play')return;
  P.hp-=d;P.inv=0.6;sfx('hurt');questEvent('hurt');S.shake=Math.max(S.shake,7);S.hurt=0.3;
  floatText(P.x,P.y-36,'-'+Math.round(d),C.blood,17);
  if(P.hp<=0){P.hp=0;gameOver()}
}
function attack(dt){
  if(P.weapon==='sword'){
    const s=P.sw;s.t-=dt;s.anim=Math.max(0,s.anim-dt);
    const tgt=nearest(s.range);
    if(tgt)P.aim=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    if(tgt&&s.t<=0){
      s.t=s.cd*wK('cd');s.anim=0.2;s.ang=P.aim;
      for(const e of enemies){
        if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)-e.r;
        if(d>s.range)continue;const a=Math.atan2(dy,dx);
        if(Math.abs(angDiff(a,s.ang))>s.arc/2&&d>8)continue;
        damage(e,s.dmg*wK('dmg')*dmgK(),'sword',a);
      }
      S.shake=Math.max(S.shake,2);
    }
  }else{
    // מרחוק: מה שעף תלוי בנשק (WEAPONS ב-weapons.js). קשת יורה חצים, מטה יורה קסם שמתביית על האויב
    const g=P.gn;g.t-=dt;g.recoil=Math.max(0,g.recoil-dt*8);
    const tgt=nearest(440);
    if(tgt)P.aim=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    if(tgt&&g.t<=0){
      wFire(g.multi);
    }
  }
}
// מחליפים רק בין נשקים שבאמת לבושים (wHeld ב-weapons.js). עם נשק אחד אין מה להחליף, והכפתור מוסתר
function swapWeapon(){
  const held=wHeld();if(S.mode!=='play'||held.length<2)return;
  wEquip(held[(held.indexOf(P.wid)+1)%held.length]);
  if(P.swapLvl>0)P.swapBuff=1.5;
  sparks(P.x,P.y-8,dtCol(P.dt[P.weapon]),10,140);
}
// הסמל לפי סוג הנשק (WEAPONS), ולצד שאין לו סמל משלו: חרב או קשת
const ICON={sword:'<path d="M20 4 9.5 14.5M20 4h-4M20 4v4M7 12l5 5M8.5 15.5 4 20"/>',
  gun:'<path d="M5 9Q16 8 15 19"/><path d="M5 9 15 19" stroke-width="1.2"/><path d="M7 17 20 4M20 4h-5M20 4v5M7 17H4M7 17v3"/>',
  staff:'<path d="M5 20 15 9"/><circle cx="17.5" cy="6.5" r="3"/>'};
// הכפתור בצבע של סוג הנזק של הנשק שביד
function updateSwapBtn(){const w=P?P.weapon:'sword',t=P?P.dt[w]:'physical';const b=$('swap');b.hidden=!P||wHeld().length<2;
  b.classList.toggle('gun',w==='gun');b.style.setProperty('--dt',dtCol(t));$('ico').innerHTML=ICON[P&&P.wt]||ICON[w];$('swaplbl').textContent=P?wLabel(w):T('w.'+w)}
