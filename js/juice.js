/* אפקטים של קרב, "juice" (ניר, 1.11.2026: "דברים שחסרים לי: אפקטים של קרב").
   מה שגורם למכה להרגיש חזקה, לפי Vlambeer ("The Art of Screenshake"), Hades, Vampire Survivors ו-Diablo:
   - עצירה קצרה (hit-stop): המשחק קופא לשבריר שנייה. במכה רגילה קצרצרה ולא יותר מפעם ב-gapHit, בקריטי ובהריגה יותר, אחרת עם הרבה אויבים זה מגמגם
   - הבזק פגיעה (כוכב אור בצבע סוג הנזק) ושובל חרמש להנפה, וצליל פגיעה חזק יותר בחולשה ובקריטי
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
  // עצירה (ניר ואוראל, 1.11: "המכות לא מרגישות חזקות"): גם מכה רגילה עוצרת לרגע קטן, אבל לא יותר מפעם ב-gapHit,
  // כך שעם 45 אויבים המשחק קופא לכל היותר כ-10% מהזמן ולא מגמגם. קריטי והריגה: פעם ב-gap. עלית ובוס: תמיד
  stop:{hit:0.022,weak:0.032,crit:0.06,kill:0.055,big:0.12,gapHit:0.22,gap:0.3},
  flash:0.14,                                                   // כמה זמן האויב לבן
  squash:{t:0.2,k:0.26},                                        // מעיכה בתלת-ממד: אורך ועוצמה (0.26 = 26% נמוך ורחב יותר)
  push:95,                                                      // הדיפה נוספת, לפני חלוקה בגודל האויב. חולשה פי 1.4, קריטי פי 1.5
  parts:{max:200,hit:8,weak:11,crit:18,kill:14},                // ניצוצות: תקרה בשביל הטלפון, וכמה בכל סוג מכה
  // הבזק פגיעה: כוכב אור בצבע סוג הנזק בנקודת המכה, שנפתח ונעלם מהר. max: תקרה על המסך. r: גודל, rCrit: בקריטי
  impact:{max:16,life:0.14,r:16,rCrit:28,rays:4},
  // שובל של הנפת חרב/גרזן/פטיש: חרמש של אור בצבע סוג הנזק, עם קצה לבן. w: רוחב מרבי. רק בעולם ובכפר (בזירה נשאר הקו הישן)
  swing:{w:22,edge:4,alpha:0.95},
  nums:{max:12,life:0.7,pop:0.12,popK:1.8,rise:40,size:11,weak:15,resist:11,crit:22,critCol:'#FFE14D'},   // מספרי נזק: תקרה, משך, קפיצה בהתחלה, כמה עולים, גדלים, צבע קריטי. קטנים ב-25% וקצרים יותר מ-1.11 (docs/plan-hud.md פרק 6), ולא יותר מ-12 על המסך
  resist:0.5,tip:{after:3,gap:1.2},                             // מכפיל של 0.5 ומטה: "עמיד" במקום מספר. tip: אחרי 3 שניות של מכות חלשות (בלי הפסקה של יותר מ-1.2) שורה בפיד עם סוג נזק טוב יותר, פעם אחת לכל סוג אויב
  shake:{kill:1.6,crit:3.5,elite:6,big:9},                      // רעידה: הריגה רגילה (קטנטנה), קריטי, עלית או מיוחד, שומר/מבוקש/בוס
  snd:{weak:1.3,crit:1.7,grow:0.6},                                      // צליל הפגיעה חזק יותר: חולשה, קריטי (combat.js קורא jSnd)
  poof:{max:8,life:0.45,puffs:7,r:[8,18],col:'#E9E3D6',ring:46},   // עשן בהריגה: כמה ענני הריגה יחד, משך, כמה עננים קטנים, גודל, צבע וגודל הטבעת
  // רצף הריגות (docs/plan-combat.md שינוי 4): "×N" בזהב ליד הדמות כשהורגים ברצף בלי הפסקה של יותר מ-gap שניות.
  // מופיע מ-show, ובכל אחד מ-marks קופץ גדול, עם ניצוצות וצליל. אחרי הפסקה נעלם. רק מספרים, בלי טקסט
  streak:{gap:2.2,show:5,marks:[10,25,50,100,200],size:15,pop:0.35,popK:2},
  scatter:1.5                                                   // השלל שנפל בהריגה עף רחוק יותר פי זה
};
// "פחות אפקטים" בהגדרות (ניר, docs/plan-fx.md משימה 6): חצי חלקיקים, בלי שובל לאורות, בלי נצנוץ לשלל, ומספרי נזק קטנים יותר.
// נשמר ב-SAVE.fxLess. נקרא כאן, ב-wisps.js, ב-drops.js וב-feed.js
const FX_LESS={parts:0.5,nums:0.8};
const fxLess=()=>typeof SAVE!=='undefined'&&!!SAVE.fxLess;
function setFxLess(on){SAVE.fxLess=!!on;saveNow();showFxLess()}
function showFxLess(){for(const b of document.querySelectorAll('[data-fxless]'))b.setAttribute('aria-pressed',String((b.dataset.fxless==='1')===fxLess()))}
const juice=()=>S.jc||(S.jc={p:[],n:[],poofs:[],fl:[],last:-9,lastHit:-9,t:0});   // S חדש בכל מקום, אז גם האפקטים מתאפסים
const jNow=()=>performance.now()/1000;
function juiceOn(){const W=JUICE.where;return S.wd?W.world:S.vil?W.village:W.arena}
function jStop(s,force,small){if(!(s>0))return;const J=juice(),now=jNow(),G=JUICE.stop;
  if(small){if(now-J.lastHit<G.gapHit||now-J.last<G.gapHit)return;J.lastHit=now}
  else{if(!force&&now-J.last<G.gap)return;J.last=now}
  S.hitstop=Math.max(S.hitstop||0,s)}
// עוצמת צליל הפגיעה (combat.js: sfx('hit',jSnd(m,crit))): 1 בזירה ובמכה רגילה
const jSnd=(m,crit)=>!juiceOn()?1:(crit?JUICE.snd.crit:m>1?JUICE.snd.weak:1)*(1+(wGrow()-1)*JUICE.snd.grow);   // נשק משודרג נשמע חזק יותר (wGrow ב-weapons.js)

// נקרא מ-damage (combat.js). מחזיר true כשהאפקטים כאן מחליפים את המספר והניצוצות הרגילים
function juiceHit(e,d,m,crit,t,ang){
  if(!juiceOn())return false;
  const J=juice(),K=JUICE;
  e.flash=Math.max(e.flash||0,K.flash);e.jT=jNow();
  if(!e.isBoss&&!e.node){const kb=K.push*(m>1?1.4:1)*(crit?1.5:1)/(e.big||1);e.kx+=Math.cos(ang)*kb;e.ky+=Math.sin(ang)*kb}
  if(crit){jStop(K.stop.crit);if(!e.node)S.shake=Math.max(S.shake,K.shake.crit)}
  else if(m>=1)jStop(m>1?K.stop.weak:K.stop.hit,false,true);   // מכה חלשה (עמיד) לא עוצרת: היא לא אמורה להרגיש חזקה
  const hy=e.y-(e.node?4:e.r*0.6);
  jBurst(e.x,hy,t,crit?K.parts.crit:m>1?K.parts.weak:m<1?3:K.parts.hit,ang);
  if((m>=1||crit)&&!(fxLess()&&!crit)){if(J.fl.length>=K.impact.max)J.fl.shift();J.fl.push({x:e.x-Math.cos(ang||0)*e.r*0.4,y:hy,t0:jNow(),r:crit?K.impact.rCrit:K.impact.r*(m>1?1.25:1),col:dtCol(t),a:rand(0,1.6)})}
  if(J.n.length>=K.nums.max)J.n.shift();
  const N=K.nums;
  // עמיד (ניר, 1.11: "0!" נראה כמו באג): במקום המספר "🛡 עמיד" באפור, וסמל סוג הנזק לידו
  const res=m<=K.resist;
  J.n.push({x:e.x+rand(-10,10),y:e.y-e.r-10,txt:res?'🛡 '+T(m<=0?'jc.immune':'jc.resist'):big(d)+(crit&&!res?'!':''),crit:crit&&!res,t0:jNow(),
    col:res?C.dim:crit?N.critCol:m>1?dtCol(t):m<1?C.dim:C.chalk,size:Math.max(9,(res?N.resist:crit?N.crit:m>1?N.weak:m<1?N.resist:N.size)*(fxLess()?FX_LESS.nums:1)),weak:m>1||res?t:null,dx:rand(-14,14)});
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
  S.shake=Math.max(S.shake,boss?K.shake.big:elite?K.shake.elite:K.shake.kill);
  if(J.poofs.length>=K.poof.max)J.poofs.shift();
  const pf=[];for(let i=0;i<K.poof.puffs*(fxLess()?FX_LESS.parts:1);i++){const a=rand(0,6.28);pf.push({a,s:rand(20,55),r:rand(...K.poof.r)})}
  J.poofs.push({x:e.x,y:e.y,t0:jNow(),pf,r:e.r*(e.big||1),col:dtCol(e.weak)});
  const now=jNow(),St=K.streak;J.st=now-(J.stT||-9)<St.gap?(J.st||0)+1:1;J.stT=now;
  const mi=St.marks.indexOf(J.st);if(mi>=0){J.stPop=now;jBurst(P.x,P.y+24,'gold',K.parts.kill,null);sfx('coin',1.2+mi*0.25)}
  jBurst(e.x,e.y-e.r*0.5,'gold',K.parts.kill,null);
  for(const d of (S.gd||[]))if(d.t===0&&Math.hypot(d.x-e.x,d.y-e.y)<e.r+40){d.vx*=K.scatter;d.vy*=K.scatter}   // השלל שנפל עכשיו (drops.js)
}
// כמה המודל בתלת-ממד מעוך עכשיו (render3d.js): 0 רגיל, עד squash.k מיד אחרי מכה
function juiceSquash(e){if(!e.jT)return 0;const k=(jNow()-e.jT)/JUICE.squash.t;return k>=1?0:JUICE.squash.k*Math.sin(Math.PI*k)}

// ניצוצות לפי סוג הנזק. ang: כיוון המכה (פסים של פיזי עפים אחורה ממנה), או null לכל הכיוונים
function jBurst(x,y,t,n,ang){
  const L=juice().p;if(fxLess())n=Math.round(n*FX_LESS.parts);n=Math.min(n,JUICE.parts.max-L.length);   // פחות אפקטים: חצי
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
// שובל הנפה (render.js, במקום הקו הדק, רק בעולם ובכפר): חרמש של אור שעבה באמצע ודק בקצוות, בצבע סוג הנזק,
// עם קצה לבן חד במקום שהלהב נמצא עכשיו. s: P.sw, k: 1 בתחילת המכה ו-0 בסוף. מחזיר false כשלא כאן, ואז render.js מצייר כמו קודם
function jSwing(s,k,col){
  if(!juiceOn())return false;
  const W=JUICE.swing,R=s.range*0.72,cx=P.x,cy=P.y-8,start=s.ang-s.arc/2,end=start+s.arc*Math.min(1,(1-k)*1.6),n=14,
    a0=Math.max(start,end-s.arc*0.85),fade=Math.min(1,k*1.8),w=W.w*wGrow()*(0.5+0.5*fade);
  if(end-a0<0.05)return true;
  ctx.save();ctx.globalCompositeOperation='lighter';
  // החרמש: קשת חיצונית ברדיוס R+w/2 וחוזרים בקשת פנימית, העובי גדל לכיוון הלהב
  ctx.beginPath();
  for(let i=0;i<=n;i++){const a=a0+(end-a0)*i/n,q=i/n,r=R+w*0.5*q;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}
  for(let i=n;i>=0;i--){const a=a0+(end-a0)*i/n,q=i/n,r=R-w*0.5*q;ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}
  ctx.closePath();ctx.globalAlpha=W.alpha*fade;ctx.fillStyle=col;ctx.fill();
  ctx.globalAlpha=0.35*fade;ctx.lineWidth=w*0.6;ctx.strokeStyle=col;ctx.beginPath();ctx.arc(cx,cy,R,end-0.35,end);ctx.stroke();   // זוהר ליד הלהב
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=0.9*fade;ctx.strokeStyle='#fff';ctx.lineWidth=W.edge;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(cx,cy,R+w*0.42,Math.max(a0,end-0.5),end);ctx.stroke();
  // הדים: ‎+3, ‎+6, ‎+9 מוסיפים קשת דקה נוספת מחוץ לשובל, בצבע סוג הנזק
  const ns=wSteps();if(ns){ctx.globalCompositeOperation='lighter';ctx.strokeStyle=col;
    for(let i=1;i<=ns;i++){ctx.globalAlpha=0.55*fade/i;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,R+w*0.5+i*7,a0+(end-a0)*0.25,end);ctx.stroke()}}
  ctx.restore();return true;
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
  // הבזק פגיעה: עיגול לבן שנפתח, טבעת וקרניים בצבע סוג הנזק
  const I=JUICE.impact;ctx.globalCompositeOperation='lighter';
  for(const f of J.fl){const k=(now-f.t0)/I.life;if(k>=1)continue;const r=f.r*(0.5+k*0.8);
    ctx.globalAlpha=0.9*(1-k);ctx.fillStyle=f.col;ctx.beginPath();ctx.arc(f.x,f.y,r*0.55,0,7);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(f.x,f.y,r*0.28*(1-k),0,7);ctx.fill();
    ctx.strokeStyle=f.col;ctx.lineWidth=3*(1-k)+0.5;ctx.beginPath();ctx.arc(f.x,f.y,r,0,7);ctx.stroke();
    ctx.lineWidth=2.5*(1-k)+0.5;ctx.strokeStyle='#fff';ctx.beginPath();
    for(let i=0;i<I.rays;i++){const a=f.a+i*Math.PI/I.rays*2,r0=r*0.4,r1=r*1.5;ctx.moveTo(f.x+Math.cos(a)*r0,f.y+Math.sin(a)*r0*0.8);ctx.lineTo(f.x+Math.cos(a)*r1,f.y+Math.sin(a)*r1*0.8)}
    ctx.stroke()}
  J.fl=J.fl.filter(f=>now-f.t0<I.life);ctx.globalCompositeOperation='source-over';
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
  // רצף הריגות ליד הדמות
  const St=JUICE.streak;if(J.st>=St.show&&now-J.stT<St.gap){const pk=J.stPop&&now-J.stPop<St.pop?1+(St.popK-1)*(1-(now-J.stPop)/St.pop):1,
    sz=St.size*pk*(1+Math.min(0.5,J.st/200)),fade=Math.min(1,(St.gap-(now-J.stT))/0.5),txt='×'+J.st;
    ctx.globalAlpha=fade;ctx.font='900 '+sz.toFixed(1)+'px Heebo, system-ui, sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#000b';
    ctx.textAlign='center';ctx.strokeText(txt,P.x,P.y+30);ctx.fillStyle=C.gold;ctx.fillText(txt,P.x,P.y+30)}
  ctx.restore();
}

// כפתורי "אפקטים: מלא / פחות" בהגדרות (index.html)
for(const b of document.querySelectorAll('[data-fxless]'))b.onclick=()=>{setFxLess(b.dataset.fxless==='1');sfx('ui')};
showFxLess();
