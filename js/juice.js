/* אפקטים של קרב, "juice" (ניר, 1.11.2026: "דברים שחסרים לי: אפקטים של קרב").
   מה שגורם למכה להרגיש חזקה, לפי Vlambeer ("The Art of Screenshake"), Hades, Vampire Survivors ו-Diablo:
   - עצירה קצרה (hit-stop): המשחק קופא לשבריר שנייה, רק במכה קריטית ובהריגה, ולא יותר מפעם ב-gap, אחרת עם הרבה אויבים זה מגמגם
   - הבזק לבן על האויב (גם בתלת-ממד: render3d.js מדליק emissive כש-e.flash>0), ו"מעיכה" קטנה של המודל
   - הדיפה קטנה אחורה, בנוסף למה שכבר יש ב-combat.js
   - ניצוצות בצבע ובצורה של סוג הנזק (DMG ב-dmg.js): פיזי פסים, אש גחלים שעולות, מים טיפות שנופלות, קרח רסיסים, ברק זיגזג, אדמה גושים
   - מספרי נזק שקופצים גדולים ומתכווצים: קריטי צהוב וגדול, חולשה עם הסמל של סוג הנזק, עמיד קטן ואפור
   - רעידת מסך קטנה רק במכה קריטית ובהריגת עלית, מבוקש, שומר או בוס. רעידה גדולה מדי מבחילה
   - "פוף" בהריגה: ענן עשן וטבעת, והשלל (drops.js) מתפזר רחוק יותר
   איפה: העולם הפתוח והכפר. הזירה (וחדר הבונוס) של אוראל לא משתנה.
   אוראל, להדליק בזירה: JUICE.where.arena=true (שורה אחת, כאן למטה).
   כל המספרים כאן. זמנים בשניות. הציור בקנבס (גם מעל התלת-ממד), והזמן אמיתי, כדי שהאפקטים ימשיכו גם בעצירה */

const JUICE={
  where:{world:true,village:true,arena:false},                  // איפה האפקטים פועלים. arena כולל את חדר הבונוס
  stop:{hit:0,weak:0,crit:0.05,kill:0.05,big:0.11,gap:0.3},   // עצירה רק במכה חזקה: קריטי, הריגה, הריגת עלית/בוס. מכה רגילה בלי (בעולם יש עד 45 אויבים). gap: מינימום בין עצירות, חוץ מעלית ובוס
  flash:0.11,                                                   // כמה זמן האויב לבן
  squash:{t:0.16,k:0.16},                                       // מעיכה בתלת-ממד: אורך ועוצמה (0.16 = 16% נמוך ורחב יותר)
  push:60,                                                      // הדיפה נוספת, לפני חלוקה בגודל האויב. חולשה פי 1.4
  parts:{max:160,hit:5,weak:8,crit:12,kill:10},                 // ניצוצות: תקרה בשביל הטלפון, וכמה בכל סוג מכה
  nums:{max:12,life:0.7,pop:0.12,popK:1.7,rise:40,size:11,weak:14,resist:11,crit:19,critCol:'#FFE14D'},   // מספרי נזק: תקרה, משך, קפיצה בהתחלה, כמה עולים, גדלים, צבע קריטי. קטנים ב-25% וקצרים יותר מ-1.11 (docs/plan-hud.md פרק 6), ולא יותר מ-12 על המסך
  resist:0.5,tip:{after:3,gap:1.2},                             // מכפיל של 0.5 ומטה: "עמיד" במקום מספר. tip: אחרי 3 שניות של מכות חלשות (בלי הפסקה של יותר מ-1.2) שורה בפיד עם סוג נזק טוב יותר, פעם אחת לכל סוג אויב
  shake:{crit:3,elite:6,big:9},                                 // רעידה: קריטי, עלית או מיוחד, שומר/מבוקש/בוס
  poof:{max:8,life:0.45,puffs:7,r:[8,18],col:'#E9E3D6',ring:46},   // עשן בהריגה: כמה ענני הריגה יחד, משך, כמה עננים קטנים, גודל, צבע וגודל הטבעת
  scatter:1.5                                                   // השלל שנפל בהריגה עף רחוק יותר פי זה
};
const juice=()=>S.jc||(S.jc={p:[],n:[],poofs:[],last:-9,t:0});   // S חדש בכל מקום, אז גם האפקטים מתאפסים
const jNow=()=>performance.now()/1000;
function juiceOn(){const W=JUICE.where;return S.wd?W.world:S.vil?W.village:W.arena}
function jStop(s,force){if(!(s>0))return;const J=juice(),now=jNow();if(!force&&now-J.last<JUICE.stop.gap)return;J.last=now;S.hitstop=Math.max(S.hitstop||0,s)}

// נקרא מ-damage (combat.js). מחזיר true כשהאפקטים כאן מחליפים את המספר והניצוצות הרגילים
function juiceHit(e,d,m,crit,t,ang){
  if(!juiceOn())return false;
  const J=juice(),K=JUICE;
  e.flash=Math.max(e.flash||0,K.flash);e.jT=jNow();
  if(!e.isBoss&&!e.node){const kb=K.push*(m>1?1.4:1)/(e.big||1);e.kx+=Math.cos(ang)*kb;e.ky+=Math.sin(ang)*kb}
  if(crit){jStop(K.stop.crit);if(!e.node)S.shake=Math.max(S.shake,K.shake.crit)}
  else jStop(m>1?K.stop.weak:K.stop.hit);
  jBurst(e.x,e.y-(e.node?4:e.r*0.6),t,crit?K.parts.crit:m>1?K.parts.weak:K.parts.hit,ang);
  if(J.n.length>=K.nums.max)J.n.shift();
  const N=K.nums;
  // עמיד (ניר, 1.11: "0!" נראה כמו באג): במקום המספר "🛡 עמיד" באפור, וסמל סוג הנזק לידו
  const res=m<=K.resist;
  J.n.push({x:e.x+rand(-10,10),y:e.y-e.r-10,txt:res?'🛡 '+T(m<=0?'jc.immune':'jc.resist'):big(d)+(crit&&!res?'!':''),crit:crit&&!res,t0:jNow(),
    col:res?C.dim:crit?N.critCol:m>1?dtCol(t):m<1?C.dim:C.chalk,size:res?N.resist:crit?N.crit:m>1?N.weak:m<1?N.resist:N.size,weak:m>1||res?t:null,dx:rand(-14,14)});
  if(m<1&&!e.node)jTip(e,t);else if(e.jRes)e.jRes=null;
  return true;
}
// טיפ בפיד: מכים כמה שניות בסוג נזק חלש נגד אותו אויב. אילו סוגים עדיפים: לפי e.mult (מטבלת היעילות DMG.chart). פעם אחת לכל סוג אויב
const JTIP={};
function jTip(e,t){
  const now=jNow(),r=e.jRes&&e.jRes.t===t&&now-e.jRes.last<JUICE.tip.gap?e.jRes:(e.jRes={t,t0:now});r.last=now;
  const kind=e.warden||e.type;if(JTIP[kind]||now-r.t0<JUICE.tip.after||typeof feedOn!=='function'||!feedOn())return;
  const better=Object.keys(e.mult||{}).filter(k=>(e.mult[k]??1)>(e.mult[t]??1)&&(e.mult[k]??1)>=1).sort((a,b)=>e.mult[b]-e.mult[a]).slice(0,2);
  if(!better.length)return;JTIP[kind]=1;
  const dts=better.map(k=>T('dt.'+k)).join(' / '),name=e.warden?T('story.'+e.warden+'.name'):null;
  feedAdd('💡',name?T('jc.tipN',name,T('dt.'+t),dts):T('jc.tip',T('dt.'+t),dts),C.gold,'tip:'+kind,0,true);
}
// נקרא מ-kill (combat.js), אחרי שהשלל נפל
function juiceKill(e){
  if(!juiceOn())return;
  const J=juice(),K=JUICE,boss=e.isBoss||e.wanted||e.warden,elite=e.elite||e.affix;
  jStop(boss||elite?K.stop.big:K.stop.kill,boss||elite);
  if(boss||elite)S.shake=Math.max(S.shake,boss?K.shake.big:K.shake.elite);
  if(J.poofs.length>=K.poof.max)J.poofs.shift();
  const pf=[];for(let i=0;i<K.poof.puffs;i++){const a=rand(0,6.28);pf.push({a,s:rand(20,55),r:rand(...K.poof.r)})}
  J.poofs.push({x:e.x,y:e.y,t0:jNow(),pf,r:e.r*(e.big||1),col:dtCol(e.weak)});
  jBurst(e.x,e.y-e.r*0.5,'gold',K.parts.kill,null);
  for(const d of (S.gd||[]))if(d.t===0&&Math.hypot(d.x-e.x,d.y-e.y)<e.r+40){d.vx*=K.scatter;d.vy*=K.scatter}   // השלל שנפל עכשיו (drops.js)
}
// כמה המודל בתלת-ממד מעוך עכשיו (render3d.js): 0 רגיל, עד squash.k מיד אחרי מכה
function juiceSquash(e){if(!e.jT)return 0;const k=(jNow()-e.jT)/JUICE.squash.t;return k>=1?0:JUICE.squash.k*Math.sin(Math.PI*k)}

// ניצוצות לפי סוג הנזק. ang: כיוון המכה (פסים של פיזי עפים אחורה ממנה), או null לכל הכיוונים
function jBurst(x,y,t,n,ang){
  const L=juice().p;n=Math.min(n,JUICE.parts.max-L.length);
  const col=t==='gold'?C.gold:dtCol(t);
  for(let i=0;i<n;i++){
    const a=ang!=null&&(t==='physical'||!DMG.types[t])?ang+rand(-0.9,0.9):rand(0,6.28),s=rand(70,220);
    const p={x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:0,life:rand(0.25,0.45),col,k:t,rot:rand(0,6.28),vr:rand(-12,12),sz:rand(2,4)};
    if(t==='fire'){p.vy=-rand(40,120);p.vx*=0.4;p.g=-60;p.life+=0.15}           // גחלים עולות
    else if(t==='water'){p.vy=-rand(80,180);p.g=700}                           // טיפות נזרקות ונופלות
    else if(t==='earth'||t==='gold'){p.vy-=120;p.g=600;p.sz+=1}                // גושים, ומטבעות בהריגה
    else if(t==='ice'){p.vx*=0.7;p.vy*=0.7;p.g=200;p.sz+=1.5}                  // רסיסים
    else if(t==='lightning'){p.life=rand(0.1,0.22);p.vx*=0.3;p.vy*=0.3}       // זיגזג קצר
    L.push(p);
  }
}
// נקרא מ-render() בקואורדינטות העולם, אחרי הניצוצות הרגילים
function juiceDraw(){
  const J=S&&S.jc;if(!J)return;
  const now=jNow(),dt=S.hitstop>0||S.mode!=='play'?0:Math.min(0.05,now-(J.t||now));J.t=now;
  ctx.save();
  // עשן וטבעת
  for(const f of J.poofs){const k=(now-f.t0)/JUICE.poof.life;if(k>=1)continue;
    ctx.globalAlpha=0.6*(1-k);ctx.strokeStyle=f.col;ctx.lineWidth=3*(1-k)+1;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r+JUICE.poof.ring*k,(f.r+JUICE.poof.ring*k)*0.55,0,0,7);ctx.stroke();
    ctx.fillStyle=JUICE.poof.col;
    for(const p of f.pf){ctx.globalAlpha=0.55*(1-k);ctx.beginPath();ctx.arc(f.x+Math.cos(p.a)*p.s*k,f.y+Math.sin(p.a)*p.s*k*0.6-k*18,p.r*(0.6+k*0.8),0,7);ctx.fill()}}
  J.poofs=J.poofs.filter(f=>now-f.t0<JUICE.poof.life);
  // ניצוצות
  for(const p of J.p){
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;p.vx*=1-dt*3;p.rot+=p.vr*dt;p.life-=dt;
    const a=Math.max(0,Math.min(1,p.life*3));ctx.globalAlpha=a;ctx.fillStyle=ctx.strokeStyle=p.col;
    if(p.k==='physical'){ctx.lineWidth=2;const l=0.05;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*l,p.y-p.vy*l);ctx.stroke()}
    else if(p.k==='lightning'){ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-6,p.y-6);ctx.lineTo(p.x+2,p.y-1);ctx.lineTo(p.x-2,p.y+1);ctx.lineTo(p.x+6,p.y+6);ctx.stroke()}
    else if(p.k==='ice'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.beginPath();ctx.moveTo(0,-p.sz*1.6);ctx.lineTo(p.sz*0.7,0);ctx.lineTo(0,p.sz*1.6);ctx.lineTo(-p.sz*0.7,0);ctx.fill();ctx.restore()}
    else if(p.k==='earth'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillRect(-p.sz/2,-p.sz/2,p.sz,p.sz);ctx.restore()}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.k==='fire'?p.sz*a:p.sz,0,7);ctx.fill()}
  }
  J.p=J.p.filter(p=>p.life>0);
  // מספרי נזק: קופצים גדולים, מתכווצים, עולים ונעלמים
  const N=JUICE.nums;ctx.textAlign='center';ctx.direction='ltr';ctx.lineJoin='round';
  for(const f of J.n){const k=(now-f.t0)/N.life;if(k>=1)continue;
    const pop=k<N.pop/N.life?N.popK-(N.popK-1)*k/(N.pop/N.life):1,sz=f.size*pop*(f.crit?1:1),y=f.y-N.rise*Math.sqrt(k),x=f.x+f.dx*k;
    ctx.globalAlpha=k>0.7?(1-k)/0.3:1;ctx.font='900 '+sz.toFixed(1)+'px Heebo, system-ui, sans-serif';
    ctx.lineWidth=f.crit?5:3.5;ctx.strokeStyle='#000b';ctx.strokeText(f.txt,x,y);ctx.fillStyle=f.col;ctx.fillText(f.txt,x,y);
    if(f.weak){const w=ctx.measureText(f.txt).width;dtIcon(x+w/2+sz*0.45,y-sz*0.35,f.weak,sz*0.7)}}   // חולשה: הסמל של סוג הנזק ליד המספר
  J.n=J.n.filter(f=>now-f.t0<N.life);
  ctx.restore();
}
