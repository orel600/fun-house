/* דרמה בקרב בעולם (DRAMA, ניר אישר 9.11.2026, docs/concept-combat-drama.md). רק בעולם הפתוח, לא בזירה ולא בכפר.
   ניר: "התקיפה האוטומטית הורגת לפני שאני שם לב, והמוות שטוח". חזק מקבוצה: למחוץ אותה בסקיל אחד. חלש: לזוז ולהשתמש בכל הסקילים.
   1. מוות דרמטי (שלד קודם, death.types): גולגולת קופצת ומסתובבת, עצמות עפות לכיוון המכה, ערימה שדוהה. בקבוצה רק full מיתות מלאות בכל win שניות,
      והאחרון בקבוצה תמיד מלא, עם טבעת זהב. השלל של כל הריגה בעולם עולה בקשת ונמשך לגיבור (drops.js, d.fly).
   2. מחיצה: פער = רמת הגיבור פחות רמת האויב (רמת האזור + לפי המרחק מהשער + דרגת העולם, כמו defAtkLv ב-defense.js).
      פער crush.gap ומעלה: נזק סקיל ×(1+per×פער) עד max, וסקיל שמשאיר אויב רגיל מתחת ל-exec.strong מהחיים הורג אותו. פער 0 ומעלה: exec.even.
      האוטומטי אף פעם לא מחסל. בוסים, נדירים, עלית ונמסיס לא בכלל. סקיל אחד שהורג crush.kills ומעלה: האטה, רעידה וגל.
   3. איזון: אוטומטי ×bal.auto כשיש bal.needSk סקילים על הכפתורים, סקילים ×bal.skill, וקירור קצר יותר בעולם (bal.cd, ושאר הסקילים ×bal.cdK).
   4. חלש מהקבוצה (פער weak.gap ומטה): המכה הטעונה של upfeel.js שכיחה יותר (עד weak.charge), ואויב שטוען מסמן שכן שיטען גם הוא.
      ומי שעומד רחוק (קשת, קוסם): אויב קופץ אל המקום שלו אחרי סימון על הרצפה (pounce). זז = לא נפגע.
   החיבורים (עוטפים מבחוץ): damage ו-kill (combat.js), wskUse ו-wskUpdate (wskill.js), ufCharge (upfeel.js), juiceDraw (juice.js) */

const DRAMA={
  test:false,                                  // tools/check.js: מדליק גם מחוץ לעולם
  off:false,                                   // tools/combat-feel.js --nodrama: המספרים של לפני, על אותו קוד
  death:{types:{grunt:1},full:2,win:0.3,grav:820,
    skull:{up:300,side:110,spin:10,r:0.65,t:1.0},
    bones:{n:4,sp:[160,300],up:170,len:[10,15],t:0.85},
    pile:{t:1.1,fade:0.45},ring:{t:0.45,r:2.6},col:'#EFE7D2',line:'#3B3328',loot:200},   // loot: הקפיצה של השלל לפני שהוא נמשך
  crush:{gap:3,per:0.2,max:2.5,blast:1.5,free:true,exec:{strong:0.3,even:0.15},kills:4,win:1.2,slow:0.12,shake:8,ring:{t:0.5,r:170}},
  bal:{auto:0.75,skill:1.3,needSk:2,cd:{quake:5,splash:4.5,frost:6,flame:4.5,zap:4},cdK:0.8},
  weak:{gap:-2,full:-5,charge:0.6,pair:200,
    pounce:{every:[3.5,6],warn:0.9,leap:0.25,r:54,hp:0.12,range:340,far:90}}
};
const DM={fx:[],rings:[],fulls:[],gk:{},cast:null,t:0,pT:2,marks:[],stat:{full:0,short:0,last:0,exec:0,crush:0,pull:0,charge:0,pair:0,pounce:0,pHit:0,pDodge:0}};

// מספרים אקראיים לציור בלבד (עצמות, גולגולת): מחולל משלו, כדי שהאפקט (שתלוי בזמן אמיתי) לא יזיז את Math.random של המשחק ושל הבדיקות
let dmSeed=12345;const dmR=(a,b)=>{dmSeed=dmSeed*1103515245+12345&0x7fffffff;return a+(b-a)*dmSeed/0x7fffffff};
function dmOn(){return !DRAMA.off&&!!S&&S.mode==='play'&&(DRAMA.test||!!S.wd&&!S.room&&!S.mb)}
// לא בוס, לא נדיר, לא מקור: מקבל את תוספת הפער (גם עלית). רגיל (dmOrd): גם לא עלית, ורק אותו אפשר לחסל
const dmPlain=e=>!!e&&!e.node&&!e.isBoss&&!e.wanted&&!e.warden&&!e.rare&&!e.nem&&!e.creature&&!e.hunt&&!e.evt;
const dmOrd=e=>dmPlain(e)&&!e.affix&&!e.elite;
// רמת האויב לפי איפה שהוא: רמת האזור, המרחק מהשער, דרגת העולם (אותה נוסחה כמו defAtkLv)
function dmLv(e){
  if(e.dmLv!=null)return e.dmLv;
  const D=DEFENSE,R=typeof WR==='function'&&S.wd?WR():{},reg=R.region||'meadow';
  let lv=D.lv[reg]??((CURIO.paths[reg]||{}).lv||1);
  if(S.wd&&R.zones&&typeof wZone==='function'){const i=R.zones.indexOf(wZone(e));if(i>0)lv+=D.zoneLv[Math.min(i,D.zoneLv.length-1)]}
  if(S.wd&&typeof tierNow==='function')lv+=D.tierLv[tierNow()-1]||0;
  return e.dmLv=lv;
}
const dmGap=e=>heroLv()-dmLv(e);
const dmGapK=e=>{const C_=DRAMA.crush,g=dmGap(e);return g>=C_.gap?Math.min(C_.max,1+C_.per*g):1};
const dmExec=e=>{const g=dmGap(e),X=DRAMA.crush.exec;return g>=DRAMA.crush.gap?X.strong:g>=0?X.even:0};
const dmAutoK=()=>S.sk&&S.sk.ids.length>=DRAMA.bal.needSk?DRAMA.bal.auto:1;
// כמה "חלש" אני מול האויב: 0 מעל weak.gap, עד 1 ב-weak.full
const dmWeak=e=>{const W=DRAMA.weak,g=dmGap(e);return g>W.gap?0:Math.min(1,(W.gap-g+1)/(W.gap-W.full+1))};

/* ---- נזק: אוטומטי חלש יותר, סקיל חזק יותר ולפי הפער, וחיסול בסקיל ---- */
const dm0Damage=damage;
damage=function(e,base,w,ang,t,chained){
  if(!e||e.node||!dmOn())return dm0Damage.apply(this,arguments);
  const ord=dmOrd(e),sk=w==='skill';
  if(w==='sword'||w==='gun')base*=dmAutoK();
  else if(sk)base*=DRAMA.bal.skill*(dmPlain(e)?dmGapK(e):1);
  e.dmAng=ang;e.dmW=w;
  const r=dm0Damage.call(this,e,base,w,ang,t,chained);
  if(sk&&ord&&!e.dead&&e.hp>0){const x=dmExec(e);if(x>0&&e.hp<=x*e.max){e.hp=0;e.dmExec=1;DM.stat.exec++;sparks(e.x,e.y,C.chalk,6,240);kill(e)}}
  return r};

/* ---- הריגה: מוות דרמטי, שלל שנמשך, ורגע המחיצה ---- */
const dm0Kill=kill;
kill=function(e){
  const on=dmOn()&&!!e&&!e.dead&&!e.node,n0=on?drops().length:0;
  const r=dm0Kill.apply(this,arguments);
  if(on&&e.dead){dmLoot(n0);dmDeath(e);dmCrushKill(e)}
  return r};
// כל מה שנפל עכשיו עולה בקשת, ואחרי הנחיתה נמשך לגיבור (dropsUpdate ב-drops.js)
function dmLoot(n0){const L=drops();for(let i=n0;i<L.length;i++){const d=L[i];if(d.fly)continue;d.fly=true;d.vz=Math.max(d.vz,DRAMA.death.loot);DM.stat.pull++}}
function dmDeath(e){
  const D=DRAMA.death;if(e.home!=null)DM.gk[e.home]=(DM.gk[e.home]||0)+1;
  if(!D.types[e.type]||!dmOrd(e))return;
  const now=fxNow();DM.fulls=DM.fulls.filter(t=>now-t<D.win);
  const last=e.home!=null&&DM.gk[e.home]>1&&!enemies.some(q=>q!==e&&!q.dead&&q.home===e.home);
  const full=last||DM.fulls.length<D.full;
  if(full){DM.fulls.push(now);DM.stat.full++}else DM.stat.short++;
  const a=e.dmAng!=null?e.dmAng:Math.atan2(e.y-P.y,e.x-P.x),z=e.big||1,k=full?1:0.6;
  const f={x:e.x,y:e.y,r:e.r*z,t0:now,full,bones:[],skull:null};
  if(full){const s=(Math.cos(a)>=0?1:-1)*dmR(0.6,1)*D.skull.side;f.skull={vx:s,vy:-D.skull.up*dmR(0.85,1.1),vr:(s>0?1:-1)*D.skull.spin}}
  for(let i=0;i<Math.round(D.bones.n*k);i++){const b=a+dmR(-0.8,0.8),sp=dmR(...D.bones.sp)*k;
    f.bones.push({vx:Math.cos(b)*sp,vy:Math.sin(b)*sp-D.bones.up*k,rot:dmR(0,6.28),vr:dmR(-14,14),len:dmR(...D.bones.len)*z})}
  DM.fx.push(f);if(DM.fx.length>24)DM.fx.shift();
  if(last){DM.stat.last++;DM.rings.push({x:e.x,y:e.y,t0:now,t:D.ring.t,r:e.r*D.ring.r,col:C.gold});S.shake=Math.max(S.shake||0,4);delete DM.gk[e.home]}
}
// הריגה בסקיל בתוך החלון של ההטלה האחרונה. crush.kills ומעלה: רגע אחד של מחיצה
function dmCrushKill(e){
  const c=DM.cast;if(!c||e.dmW!=='skill'||DM.t-c.t>DRAMA.crush.win||!dmOrd(e))return;
  c.k++;c.x=e.x;c.y=e.y;
  if(c.k>=DRAMA.crush.kills&&!c.done){c.done=true;DM.stat.crush++;const C_=DRAMA.crush;
    S.slow=Math.max(S.slow||0,C_.slow);S.shake=Math.max(S.shake||0,C_.shake);
    DM.rings.push({x:c.x,y:c.y,t0:fxNow(),t:C_.ring.t,r:C_.ring.r,col:C.gold,big:1});sfx('coin',1.6)}
}

/* ---- סקילים: קירור קצר יותר בעולם, ופתיחת חלון המחיצה ---- */
const dm0Use=wskUse;
wskUse=function(id){
  const ok=dm0Use.apply(this,arguments);
  if(ok&&dmOn()){const i=S.sk.ids.indexOf(id),D=skDef(id),B=DRAMA.bal;
    if(i>=0&&D&&D.cd>0&&S.sk.cd[i]>0)S.sk.cd[i]*=dmCdK(id);
    DM.cast={id,t:DM.t,k:0};dmBlast(id)}
  return ok};
// פי כמה הקירור בעולם. לפי הקירור הבסיסי (cd0, לפני שדרוג אצל הכוהנת), כדי ששדרוג ימשיך לקצר
function dmCdK(id){const D=skDef(id),B=DRAMA.bal;if(!dmOn()||!D)return 1;return B.cd[id]?B.cd[id]/(D.cd0||SKILLS.list[id].cd0||D.cd):B.cdK}
// פער crush.gap ומעלה: סקיל טבעת (רקיעה, התזה, כפור, להבה) נוחת בפיצוץ רחב יותר ופוגע בכל מי שבתוכו, כדי שגם קבוצה מפוזרת נמחצת
function dmBlast(id){
  const W=S.wsk,s=W&&W.shots[W.shots.length-1];if(!s||s.id!==id||s.dmB)return;s.dmB=1;
  let n=null,bd=1e9;for(const e of enemies){if(e.dead||!dmOrd(e))continue;const d=Math.hypot(e.x-s.tx,e.y-s.ty);if(d<bd){bd=d;n=e}}
  if(n&&dmGap(n)>=DRAMA.crush.gap){s.r*=DRAMA.crush.blast;s.free=DRAMA.crush.free}}   // free: פוגע בכל מי שבפיצוץ, גם מעבר לטווח החרב (wskUpdate)
const dm0Upd=wskUpdate;
wskUpdate=function(dt){dm0Upd.apply(this,arguments);if(dmOn())dmUpdate(dt)};

/* ---- חלש מהקבוצה: מכה טעונה שכיחה יותר, בזוגות ---- */
const dm0Charge=ufCharge;
ufCharge=function(e){
  const skip=!!e.hvSkip,k=dm0Charge.apply(this,arguments);
  if(k>1||skip||!dmOn()||!dmOrd(e))return k;
  const W=DRAMA.weak,C_=UPFEEL.charge,force=e.dmForce;e.dmForce=0;
  const wk=dmWeak(e);if(!force&&!(wk>0))return k;
  const base=C_.chance[e.zone]||0,ch=base+(W.charge-base)*wk;
  if(!force&&Math.random()>=ch)return k;
  e.hv=1;e.hvSkip=1;UF.chN++;DM.stat.charge++;
  if(!force){let o=null,bd=W.pair;for(const q of enemies){if(q===e||q.dead||q.home!==e.home||!dmOrd(q)||q.hv)continue;const d=Math.hypot(q.x-e.x,q.y-e.y);if(d<bd){bd=d;o=q}}
    if(o){o.dmForce=1;DM.stat.pair++}}
  return C_.wind};

/* ---- חלש מהקבוצה ועומד רחוק: אויב קופץ אל המקום שלך אחרי סימון ---- */
function dmUpdate(dt){
  DM.t+=dt;const Pn=DRAMA.weak.pounce;
  for(const m of DM.marks){m.t-=dt;const e=m.e;
    if(m.t>0){if(e.dead){m.gone=true}continue}
    if(!m.leap){m.leap=Pn.leap;m.fx=e.x;m.fy=e.y;   // נוחת קצת לפני המרכז: אויב בדיוק על הגיבור נותן כיוון 0/0 (NaN) בקוד שדוחף אויבים
      const dx=e.x-m.x,dy=e.y-m.y,d=Math.hypot(dx,dy)||1,o=Math.min(d,(e.r||12)+(P.r||12)*0.5);m.lx=m.x+dx/d*o;m.ly=m.y+dy/d*o}
    m.leap-=dt;const q=Math.min(1,1-m.leap/Pn.leap);if(!e.dead&&isFinite(m.lx+m.ly)){e.x=m.fx+(m.lx-m.fx)*q;e.y=m.fy+(m.ly-m.fy)*q}
    if(m.leap<=0){m.gone=true;if(e.dead)continue;S.shake=Math.max(S.shake||0,4);sparks(m.x,m.y,FXCOL(),8,200);
      if(Math.hypot(P.x-m.x,P.y-m.y)<Pn.r+P.r){const h=P.hp;hurt(P.maxHp*Pn.hp*m.wk);if(P.hp<h)DM.stat.pHit++}else DM.stat.pDodge++}}
  DM.marks=DM.marks.filter(m=>!m.gone);
  if(DM.marks.length||(DM.pT-=dt)>0)return;
  let best=null,bw=0;
  for(const e of enemies){if(e.dead||!dmOrd(e)||!(e.alert>0)&&Math.hypot(e.x-P.x,e.y-P.y)>Pn.range)continue;
    const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>Pn.range||d<Pn.far+e.r)continue;const wk=dmWeak(e);if(wk>bw){bw=wk;best=e}}
  if(!best){DM.pT=0.5;return}
  DM.pT=rand(...Pn.every)/(0.5+0.5*bw);
  DM.marks.push({e:best,x:P.x,y:P.y,t:Pn.warn,t0:Pn.warn,wk:bw});DM.stat.pounce++;
}
const FXCOL=()=>typeof FXC!=='undefined'&&FXC.tg&&FXC.tg.col||UPFEEL.charge.col;

/* ---- ציור (מעל ה-juice, בעולם, בקואורדינטות העולם) ---- */
const dm0Draw=juiceDraw;
juiceDraw=function(){dm0Draw.apply(this,arguments);if(S&&(S.wd||DRAMA.test))dmDraw()};
function dmDraw(){
  const now=fxNow(),D=DRAMA.death,z=typeof ZOOM!=='undefined'?ZOOM:1;
  // סימני קפיצה: עיגול שמתמלא
  for(const m of DM.marks){const k=1-Math.max(0,m.t)/m.t0;ctx.save();ctx.strokeStyle=FXCOL();ctx.fillStyle=FXCOL();
    ctx.globalAlpha=0.85;ctx.lineWidth=3/z;ctx.beginPath();ctx.arc(m.x,m.y,DRAMA.weak.pounce.r,0,6.283);ctx.stroke();
    ctx.globalAlpha=0.28;ctx.beginPath();ctx.arc(m.x,m.y,DRAMA.weak.pounce.r*k,0,6.283);ctx.fill();ctx.restore()}
  DM.fx=DM.fx.filter(f=>now-f.t0<D.pile.t);
  for(const f of DM.fx){const s=now-f.t0;
    // הערימה: עצמות קטנות על הרצפה שדוהות
    const pa=s<D.pile.t-D.pile.fade?1:Math.max(0,(D.pile.t-s)/D.pile.fade);
    ctx.save();ctx.globalAlpha=0.9*pa;ctx.fillStyle=D.col;ctx.strokeStyle=D.line;ctx.lineWidth=1.2/z;
    ctx.beginPath();ctx.ellipse(f.x,f.y+f.r*0.45,f.r*0.75,f.r*0.28,0,0,6.283);ctx.fill();ctx.stroke();ctx.restore();
    for(const b of f.bones){if(s>D.bones.t)break;const x=f.x+b.vx*s,y=f.y-f.r*0.4+b.vy*s+D.grav*s*s/2;
      ctx.save();ctx.translate(x,Math.min(y,f.y+f.r*0.5));ctx.rotate(b.rot+b.vr*s);ctx.globalAlpha=1-Math.pow(s/D.bones.t,3);dmBone(b.len,z);ctx.restore()}
    const k=f.skull;if(k&&s<D.skull.t){const x=f.x+k.vx*s,y=f.y-f.r*1.1+k.vy*s+D.grav*s*s/2,r=f.r*D.skull.r+5;
      ctx.save();ctx.translate(x,Math.min(y,f.y+f.r*0.4));ctx.rotate(k.vr*s);ctx.globalAlpha=1-Math.pow(s/D.skull.t,4);dmSkull(r,z);ctx.restore()}}
  DM.rings=DM.rings.filter(g=>now-g.t0<g.t);
  for(const g of DM.rings){const q=(now-g.t0)/g.t;ctx.save();ctx.globalAlpha=0.85*(1-q);ctx.strokeStyle=g.col;ctx.lineWidth=((g.big?9:5)*(1-q)+1.5)/z;
    ctx.beginPath();ctx.arc(g.x,g.y,g.r*(0.3+0.7*q),0,6.283);ctx.stroke();ctx.restore()}
  ctx.globalAlpha=1}
function dmBone(L,z){const D=DRAMA.death;ctx.fillStyle=D.col;ctx.strokeStyle=D.line;ctx.lineWidth=1.2/z;
  ctx.beginPath();ctx.rect(-L/2,-1.6,L,3.2);ctx.fill();ctx.stroke();
  for(const sx of [-L/2,L/2])for(const sy of [-1.8,1.8]){ctx.beginPath();ctx.arc(sx,sy,2.1,0,6.283);ctx.fill();ctx.stroke()}}
function dmSkull(r,z){const D=DRAMA.death;ctx.fillStyle=D.col;ctx.strokeStyle=D.line;ctx.lineWidth=1.5/z;
  ctx.beginPath();ctx.arc(0,-r*0.15,r,Math.PI*0.85,Math.PI*2.15);ctx.lineTo(r*0.55,r*0.75);ctx.lineTo(-r*0.55,r*0.75);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=D.line;for(const sx of [-0.4,0.4]){ctx.beginPath();ctx.arc(r*sx,-r*0.05,r*0.25,0,6.283);ctx.fill()}
  ctx.beginPath();ctx.moveTo(0,r*0.25);ctx.lineTo(-r*0.1,r*0.45);ctx.lineTo(r*0.1,r*0.45);ctx.closePath();ctx.fill()}
