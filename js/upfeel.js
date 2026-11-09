/* שדרוג שמרגישים בקרב הבא (UPFEEL, ניר אישר 9.11.2026, docs/concept-upgrade-feel.md). רק בעולם הפתוח, לא בזירה.
   המדידה (docs/combat-feel-2026-11-08.md): ‎+1 Aging או נקודה משנים את הנזק ב-5%, ואויב רגיל כמעט לא מאיים. כאן:
   1. מספרים בזהב: אחרי שדרוג (Aging, נקודה, עץ סקילים), 30 שניות של עולם שבהן מספרי הנזק בזהב עם ▲.
   2. מכה שמעיפה: מכה שגדולה פי 2 מהחיים שנשארו לאויב רגיל מפרקת אותו לחתיכות שעפות.
   3. מדרגות Aging לנשק (perks): ‎+3 מכה כבדה, ‎+5 התזה, ‎+7 גל הדף, ‎+10 זעם. כל אחת נחגגת בנפחייה, ובנפחייה כתוב כמה חסר לבאה.
   4. מכה טעונה: באזור הרחוק (ונדיר בקרוב) אויב רגיל טוען מכה ארוכה יותר עם הילה. מי שזז מהאזהרה לא נפגע, מי שעומד מאבד כ-17% חיים.
   החיבורים: damage ו-kill ב-combat.js, juiceHit ב-juice.js, strikeTick ו-strikeDraw ב-strike.js, הצלחה ב-aging.js, נקודה ועץ ב-stats.js */

const UPFEEL={
  test:false,                                    // tools/check.js: מדליק גם מחוץ לעולם
  gold:{t:30,col:'#F4C74F',mark:'▲'},             // t: שניות בעולם אחרי שדרוג
  fly:{over:2,n:7,t:0.7,sp:[200,340],up:160,grav:700,size:[4,8],shake:6,stop:0.05},   // over: המכה גדולה פי כך מהחיים שנשארו
  // מדרגות לנשק לפי רמת ה-Aging שלו. every: כל כמה מכות. mul: פי כמה. r: רדיוס. k: חלק מהנזק
  perks:[
    {at:3, id:'heavy', every:5,mul:2},
    {at:5, id:'splash',r:70,k:0.5},
    {at:7, id:'shock', r:75,k:0.6},
    {at:10,id:'fury',  every:3,mul:2.5}
  ],
  heavy:{shake:5,stop:0.05,ring:0.3},            // ring: כמה שניות רואים את הטבעת
  charge:{chance:{start:0,near:0.1,far:0.35},wind:1.7,hp:0.17,col:'#FF3DAA'}   // hp: חלק מהחיים המלאים. אחרי מכה טעונה הבאה רגילה
};
const UF={gold:0,n:0,hv:false,fr:[],rings:[],t:0,flyN:0,hvN:0,chN:0,chHit:0,chDodge:0};   // n: מונה מכות. *N: מונים לבוט

function ufOn(){return !!S&&S.mode==='play'&&(UPFEEL.test||!!S.wd&&!S.room)}
function ufLv(){const w=typeof SAVE!=='undefined'&&SAVE&&SAVE.gear&&SAVE.gear.weapon;return w?gPlus(w):0}
function ufPerk(id,lv=ufLv()){const p=UPFEEL.perks.find(q=>q.id===id);return p&&lv>=p.at?p:null}
const ufBasic=(e,w,chained)=>ufOn()&&!chained&&!e.node&&(w==='sword'||w==='gun');

// שדרוג (aging.js, stats.js): המכות הבאות בעולם בזהב
function ufUp(){UF.gold=UPFEEL.gold.t}
// הצלחה בנפחייה: נשק שהגיע למדרגה מקבל חגיגה גדולה והודעה עם הכוח החדש
function ufAged(r){ufUp();const it=gItem(r.id);if(!it||it.slot!=='weapon')return;
  const p=UPFEEL.perks.find(q=>q.at===r.to);if(!p)return;
  celebrate(P.x,P.y-40,'rankup');banner(T('uf.got',T('uf.p.'+p.id)),C.gold)}
// בנפחייה, מתחת ל"אם מצליחים": מה המדרגה הבאה ועוד כמה. n: הרמה של הפריט עכשיו
function ufForgeHint(id,n){const it=gItem(id);if(!it||it.slot!=='weapon')return'';
  const p=UPFEEL.perks.find(q=>q.at>n);if(!p)return'';
  return'<p class="dim">✦ '+T('uf.next',p.at-n,T('uf.p.'+p.id),T('uf.d.'+p.id))+'</p>'}

// מ-damage, לפני שהנזק יורד: פי כמה המכה הזו (מכה כבדה או זעם)
function ufHit(e,w,chained){
  if(!ufBasic(e,w,chained))return 1;
  const p=ufPerk('fury')||ufPerk('heavy');UF.n++;
  if(!p||UF.n%p.every)return 1;
  UF.hv=true;UF.hvN++;return p.mul}
// מ-damage, אחרי onHit: התזה לשכן, וגל הדף במכה כבדה
function ufAfter(e,base,w,t,ang,chained){
  if(!ufBasic(e,w,chained)){return}
  const hv=UF.hv;UF.hv=false;
  const sp=ufPerk('splash');
  if(sp){let o=null,bd=sp.r;for(const q of enemies){if(q===e||q.dead)continue;const d=Math.hypot(q.x-e.x,q.y-e.y)-q.r;if(d<bd){bd=d;o=q}}
    if(o){damage(o,base*sp.k,w,Math.atan2(o.y-e.y,o.x-e.x),t,true);sparks(o.x,o.y,dtCol(t),4,150)}}
  if(!hv)return;
  const H=UPFEEL.heavy,sh=ufPerk('shock');
  S.shake=Math.max(S.shake||0,H.shake);S.hitstop=Math.max(S.hitstop||0,H.stop);
  UF.rings.push({x:e.x,y:e.y,t0:fxNow(),r:sh?sh.r:e.r*2,col:dtCol(t)});if(UF.rings.length>6)UF.rings.shift();
  if(sh)for(const q of enemies.slice()){if(q===e||q.dead||Math.hypot(q.x-e.x,q.y-e.y)-q.r>sh.r)continue;damage(q,base*sh.k,w,Math.atan2(q.y-e.y,q.x-e.x),t,true)}
}
// מ-damage, לפני kill: מכה הרבה יותר גדולה מהחיים שנשארו מפרקת אויב רגיל לחתיכות. hp0: החיים לפני המכה
function ufKill(e,d,hp0,ang){
  const F=UPFEEL.fly;if(!ufOn()||e.node||e.isBoss||e.wanted||e.warden||!(hp0>0)||d<F.over*hp0)return;
  UF.flyN++;const col=e.col||dtCol(e.weak),now=fxNow(),n=Math.round(F.n*(typeof fxLess==='function'&&fxLess()?0.5:1));
  for(let i=0;i<n;i++){const a=(ang||0)+rand(-0.7,0.7),s=rand(...F.sp);
    UF.fr.push({x:e.x,y:e.y-e.r*0.5,vx:Math.cos(a)*s,vy:Math.sin(a)*s-F.up,t0:now,sz:rand(...F.size)*(e.big||1),rot:rand(0,6.28),vr:rand(-12,12),col})}
  if(UF.fr.length>60)UF.fr.splice(0,UF.fr.length-60);
  S.shake=Math.max(S.shake||0,F.shake);S.hitstop=Math.max(S.hitstop||0,F.stop)}
// מ-juiceHit: מספר נזק בזהב בזמן שאחרי שדרוג. קריטי ועמיד נשארים כמו שהם
function ufNum(f){const G=UPFEEL.gold;if(!f||!(UF.gold>0)||f.crit||f.res||!ufOn())return;
  f.col=G.col;if(!String(f.txt).startsWith(G.mark))f.txt=G.mark+f.txt}

// מ-strikeTick כשאויב מתחיל להתכונן: פי כמה ההכנה ארוכה. אחרי מכה טעונה, הבאה רגילה
function ufCharge(e){
  e.hv=0;const C_=UPFEEL.charge;
  if(!ufOn()||e.isBoss||e.wanted||e.warden)return 1;
  if(e.hvSkip){e.hvSkip=0;return 1}
  const ch=C_.chance[e.zone]||0;if(!(ch>0)||Math.random()>=ch)return 1;
  e.hv=1;e.hvSkip=1;UF.chN++;return C_.wind}
// המכה יצאה ופגעה: מכה טעונה לוקחת חלק מהחיים המלאים
function ufStrikeDmg(e,d){if(!e.hv)return d;e.hv=0;UF.chHit++;return Math.max(d,(P.maxHp||100)*UPFEEL.charge.hp)}
function ufDodge(e){if(e.hv){e.hv=0;UF.chDodge++}}

// ציור, מ-strikeDraw (בעולם, מתחת לדמויות): הילה על אויב שטוען, טבעות של מכה כבדה, וחתיכות שעפות. גם סופר את זמן הזהב
function ufDraw(){
  const now=fxNow(),dt=Math.min(0.1,now-(UF.t||now));UF.t=now;
  if(UF.gold>0&&ufOn())UF.gold-=dt;
  const z=typeof ZOOM!=='undefined'?ZOOM:1,C_=UPFEEL.charge;
  for(const e of enemies){if(e.dead||!e.hv||!(e.sw>0))continue;
    const k=1-e.sw/(e.sw0||1),p=0.5+0.5*Math.sin(now*14);
    ctx.save();ctx.strokeStyle=C_.col;ctx.globalAlpha=0.45+0.45*p;ctx.lineWidth=(3+3*k)/z;
    ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1.25+0.5*k),0,6.283);ctx.stroke();
    ctx.globalAlpha=0.18+0.25*k;ctx.fillStyle=C_.col;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1.1+0.3*k),0,6.283);ctx.fill();ctx.restore()}
  const H=UPFEEL.heavy;UF.rings=UF.rings.filter(g=>now-g.t0<H.ring);
  for(const g of UF.rings){const q=(now-g.t0)/H.ring;ctx.save();ctx.globalAlpha=0.8*(1-q);ctx.strokeStyle=g.col;ctx.lineWidth=(6*(1-q)+1.5)/z;
    ctx.beginPath();ctx.arc(g.x,g.y,g.r*(0.35+0.65*q),0,6.283);ctx.stroke();ctx.restore()}
  const F=UPFEEL.fly;UF.fr=UF.fr.filter(f=>now-f.t0<F.t);
  for(const f of UF.fr){const s=now-f.t0,q=s/F.t,x=f.x+f.vx*s,y=f.y+f.vy*s+F.grav*s*s/2;
    ctx.save();ctx.translate(x,y);ctx.rotate(f.rot+f.vr*s);ctx.globalAlpha=1-q*q;ctx.fillStyle=f.col;ctx.fillRect(-f.sz/2,-f.sz/2,f.sz,f.sz*0.7);ctx.restore()}
  ctx.globalAlpha=1}
