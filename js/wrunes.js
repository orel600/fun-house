/* רונות לסקילים בעולם (docs/plan-skills.md, שלב 2): לכל אחד מתשעת הסקילים של הספר שתי רונות, וכל רונה משנה איך הסקיל עובד, לא רק כמה הוא חזק.
   בוחרים רונה אחת פעילה לכל סקיל (או בלי), בספר הסקילים, בשורה שבראש רשימת הסקילים. נפתחות לפי רמה: at רמות אחרי שהסקיל עצמו נפתח.
   רונה שנפתחת נכנסת לבד אם עוד אין רונה לסקיל, ומסלול הרמות מראה אותה. נשמר ב-SAVE.hero.skRune ({סקיל: רונה}).
   כל רונה היא שורה עם סוג התנהגות אחד:
     mod: משנה את נתוני הסקיל (סוג נזק, רדיוס, שורשים, קיפאון). pool: שלולית שפוגעת לאורך זמן. blast: פיצוץ אחרי רגע.
     again: עוד הטלה מיד. copy: עוד מלכודת. twin: עוד רוח. wet: הענן מרטיב. mini: עוד מטאורים קטנים. pull: המערבולת שואבת. chain: הברק קופץ.
   נקודות החיבור: wsbCast, wsbUpdate ו-wsbHit ב-wskbook.js, wskUse/wskUpdate/drawWSkill ב-wskill.js, lpAt ו-lpLevelUp ב-levelpath.js.
   השמות ב-lang.js: 'wr.<סקיל>.<רונה>' ו-'wr.d.<סקיל>.<רונה>' */
const WRUNES={
  at:[2,5],   // הרונה הראשונה נפתחת 2 רמות אחרי הסקיל, השנייה 5
  list:{
    charge:{trail:{pool:{n:3,r:44,t:2.5,tick:0.4,k:0.35,dt:'fire'}},           // שובל אש: שלוליות אש לאורך הדרך
            twice:{again:0.5}},                                               // פעמיים: אפשר להסתער שוב מיד, ואז הקירור המלא
    whirl: {pull:{pull:150},                                                  // שואבת: מושכת את מי שבתוכה פנימה (פיקסלים לשנייה)
            nova:{blast:{end:1,rk:1.4,k:3,dt:'fire',follow:1}}},              // פיצוץ בסוף: הלהבות מתפוצצות כשהמערבולת נגמרת
    shield:{nova:{blast:{end:1,rk:1.1,k:1.5,dt:'ice',freeze:1.5,follow:1}},  // גל קור: כשהשריון נגמר, עוד פיצוץ שמקפיא שוב
            thorns:{pool:{follow:1,r:75,tick:0.3,k:0.5,dt:'ice'}}},           // קוצי קרח: כל זמן שהשריון פועל, פוגע במי שקרוב
    volley:{pin:{mod:{root:0.8}},                                             // חצים נועצים: מי שנפגע נתקע בשורשים (ננעץ)
            fire:{mod:{dt:'fire'}}},                                          // חצי אש: אש במקום פיזי (בוער, אדים, נמס)
    trap:  {two:{copy:{dx:85}},                                               // זוג: שתי מלכודות זו ליד זו
            roots:{mod:{dt:'earth',freeze:0,root:2.5}}},                      // מלכודת שורשים: תוקעת במקום להקפיא
    vines: {slam:{blast:{delay:0.4,rk:0.55,k:1.8,dt:'earth',follow:1}},       // הטחה: אחרי המשיכה, מכת אדמה סביבך
            far:{mod:{pull:0,r:300,root:3}}},                                 // רשת: בלי משיכה, תוקע את כולם רחוק יותר ולזמן ארוך יותר
    spirit:{ice:{mod:{dt:'ice'}},                                             // רוח כפור: יורה קרח (מאט, ועל רטובים: קפוא)
            twin:{twin:1}},                                                   // תאומות: שתי רוחות
    storm: {rain:{wet:{every:0.5,t:3}},                                       // סופה: הענן גם מרטיב, אז הברקים מחשמלים
            chain:{mod:{chain:2}}},                                           // שרשרת: כל ברק קופץ לעוד 2
    meteor:{three:{mini:{n:2,dx:85,k:0.5,rk:0.6,gap:0.25}},                   // מטר: עוד שני מטאורים קטנים אחרי הגדול
            lava:{pool:{boom:1,rk:0.8,t:3,tick:0.4,k:0.3,dt:'fire'}}}         // לבה: הפיצוץ משאיר שלולית אש
  }
};
const wrStat={};   // כמה פעמים כל רונה עשתה את שלה (בשביל הבוט)
const wrMark=(id,k)=>{const n=id+':'+k;wrStat[n]=(wrStat[n]||0)+1};
const wrSave=()=>{const h=SAVE.hero;if(!h.skRune||typeof h.skRune!=='object')h.skRune={};return h.skRune};
const wrKeys=id=>Object.keys(WRUNES.list[id]||{});
const wrNeed=(id,k)=>wsbNeed(id)+WRUNES.at[wrKeys(id).indexOf(k)];
const wrOpen=(id,k)=>heroLv()>=wrNeed(id,k);
// הרונה הפעילה של סקיל: רק אם נבחרה וכבר פתוחה
function wrOf(id){const k=wrSave()[id];return k&&WRUNES.list[id]&&WRUNES.list[id][k]&&wrOpen(id,k)?k:null}
const wrDef=id=>{const k=wrOf(id);return k?WRUNES.list[id][k]:null};

/* ---- חיבור לסקיל ---- */
// לפני ההטלה: רונה עם mod משנה את נתוני הסקיל
function wrPre(id,D){const R=wrDef(id);return R&&R.mod?{...D,...R.mod}:D}
// אחרי ההטלה (o כבר ברשימה): מה שהרונה מוסיפה
function wrPost(id,D,o,tg){
  const R=wrDef(id),k=wrOf(id);if(!R)return;
  const L=wsbFx(),F=wrFx();
  if(R.mod)wrMark(id,k);
  if(R.pool){const p=R.pool;
    if(p.n){for(let i=0;i<p.n;i++){const f=(i+0.5)/p.n;F.push({k:'pool',id,x:o.fx+(o.tx-o.fx)*f,y:o.fy+(o.ty-o.fy)*f,r:p.r,t:0,wait:o.dur*f,dur:o.dur*f+p.t,tick:p.tick,ti:0,dt:p.dt,base:o.base*p.k,col:dtCol(p.dt)})}wrMark(id,k)}
    else if(p.follow)F.push({k:'pool',id,x:P.x,y:P.y,follow:1,r:p.r*o.vis,t:0,wait:0,dur:o.dur,tick:p.tick,ti:0,dt:p.dt,base:o.base*p.k,col:dtCol(p.dt),mark:k});
    else if(p.boom)F.push({k:'pool',id,x:o.x,y:o.y,r:o.r*p.rk,t:0,wait:D.delay,dur:D.delay+p.t,tick:p.tick,ti:0,dt:p.dt,base:o.base*p.k,col:dtCol(p.dt),mark:k})}
  if(R.blast){const b=R.blast,delay=b.end?o.dur:b.delay;
    F.push({k:'blast',id,x:P.x,y:P.y,follow:b.follow,r:(D.r||100)*b.rk*o.vis,t:0,wait:delay,dur:delay+0.35,dt:b.dt,base:o.base*b.k,col:dtCol(b.dt),freeze:b.freeze,mark:k})}
  if(R.copy){const a=Math.atan2(tg.y-P.y,tg.x-P.x)+Math.PI/2;L.push({...o,x:o.x+Math.cos(a)*R.copy.dx,y:o.y+Math.sin(a)*R.copy.dx});wrMark(id,k)}
  if(R.twin){L.push({...o,ph:Math.PI,tick:D.tick/2});wrMark(id,k)}
  if(R.mini){const m=R.mini;for(let j=0;j<m.n;j++){const s=j?-1:1,a=Math.atan2(tg.y-P.y,tg.x-P.x)+Math.PI/2,dl=D.delay+m.gap*(j+1);
    L.push({...o,x:o.x+Math.cos(a)*m.dx*s,y:o.y+Math.sin(a)*m.dx*s,r:o.r*m.rk,base:o.base*m.k,D:{...D,delay:dl},dur:dl+0.45,boom:0})}wrMark(id,k)}
}
// אחרי שהקירור נקבע (wskUse): פעמיים = עוד הטלה מיד
function wrCd(id,i){
  const R=wrDef(id);if(!R||!R.again)return;const A=S.wrAgain||(S.wrAgain={});
  if(!A[id]){A[id]=1;S.sk.cd[i]=R.again;wrMark(id,'twice')}else A[id]=0;
}
// כל פריים, לכל סקיל שעוד פועל (wsbUpdate): שאיבה והרטבה
function wrTick(o,dt){
  const R=wrDef(o.id);if(!R)return;
  if(R.pull&&o.k==='aura'){let n=0;for(const e of wsbIn(P.x,P.y,o.r)){if(e.isBoss)continue;const a=Math.atan2(P.y-e.y,P.x-e.x),d=Math.hypot(P.x-e.x,P.y-e.y);
    if(d>P.r+e.r){e.x+=Math.cos(a)*R.pull*dt;e.y+=Math.sin(a)*R.pull*dt;n++}}if(n&&!o.wrM){o.wrM=1;wrMark(o.id,'pull')}}
  if(R.wet&&o.k==='storm'&&(o.wrT=(o.wrT??0)-dt)<=0){o.wrT=R.wet.every;for(const e of wsbIn(P.x,P.y,o.r))e.wet=Math.max(e.wet||0,R.wet.t);wrMark(o.id,'rain')}
}
// אחרי כל פגיעה של סקיל מהספר (wsbHit): שורשים וקפיצה של ברק
function wrOnHit(e,id,base){
  wcMark(e,id);   // סקיל של הצייד מסמן טרף (wcombo.js)
  const R=wrDef(id);if(!R||!R.mod||e.dead)return;const M=R.mod;
  if(M.root&&id!=='vines')wcRoot(e,M.root);
  if(M.chain){let from=e;const near=enemies.filter(o=>o!==e&&!o.dead&&wskIn(o,P)&&Math.hypot(o.x-e.x,o.y-e.y)<200).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,M.chain);
    for(const o of near){skLine(from,o,dtCol('lightning'));damage(o,base*0.6,'skill',Math.atan2(o.y-from.y,o.x-from.x),'lightning',true);from=o}}
}

/* ---- השלוליות והפיצוצים של הרונות ---- */
const wrFx=()=>(S.wr||(S.wr={fx:[]})).fx;
function wrUpdate(dt){
  const F=S.wr&&S.wr.fx;if(!F||!F.length)return;
  for(const f of F){f.t+=dt;if(f.t<f.wait)continue;if(f.follow&&!f.done){f.x=P.x;f.y=P.y}
    if(f.k==='pool'){if(f.mark&&!f.on){f.on=1;wrMark(f.id,f.mark)}if((f.ti-=dt)<=0){f.ti=f.tick;for(const e of wsbIn(f.x,f.y,f.r))wsbHit(e,f.id,f.base,f,f.dt)}}
    else if(f.k==='blast'&&!f.done){f.done=1;wrMark(f.id,f.mark);
      S.sk.fx.push({ring:1,x:f.x,y:f.y,r:f.r,t:0,max:0.35*themeK(),col:f.col});if(!wsbLess())sparks(f.x,f.y,f.col,12,240);S.shake=Math.max(S.shake,3);
      for(const e of wsbIn(f.x,f.y,f.r)){wsbHit(e,f.id,f.base,f,f.dt);if(f.freeze&&!e.isBoss&&!e.dead)e.frozen=Math.max(e.frozen||0,f.freeze)}}}
  S.wr.fx=F.filter(f=>f.t<f.dur);
}
function wrDraw(){
  const F=S.wr&&S.wr.fx;if(!F||!F.length)return;ctx.save();
  for(const f of F){if(f.k!=='pool'||f.t<f.wait)continue;const a=Math.min(1,(f.dur-f.t)*2);
    ctx.fillStyle=ctx.strokeStyle=f.col;ctx.globalAlpha=0.2*a;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*0.6,0,0,7);ctx.fill();
    ctx.globalAlpha=0.7*a;ctx.lineWidth=2;ctx.stroke();
    if(!wsbLess()){ctx.globalAlpha=0.8*a;for(let i=0;i<3;i++){const s=(f.t*2+i/3)%1;ctx.beginPath();ctx.arc(f.x+Math.cos(i*2.1)*f.r*0.5,f.y-s*18,3*(1-s),0,7);ctx.fill()}}}
  ctx.restore();
}

/* ---- רמות: רונה חדשה במסלול הרמות, ונכנסת לבד אם לסקיל עוד אין ---- */
const wrAt=lv=>{const out=[];for(const id in WRUNES.list)for(const k of wrKeys(id))if(wrNeed(id,k)===lv)out.push({k:'skill',icon:'💠',txt:T('wr.lp',T('sk.'+id),T('wr.'+id+'.'+k))});return out};
function wrLevelUp(from,lv){
  const R=wrSave();let got=null;
  for(const id in WRUNES.list)for(const k of wrKeys(id)){const n=wrNeed(id,k);if(n>from&&n<=lv&&!R[id]){R[id]=k;got=[id,k]}}
  if(got){saveNow();if(typeof banner==='function')banner(T('wr.new',T('wr.'+got[0]+'.'+got[1])),C.gold)}
}

/* ---- בספר הסקילים: שורה בראש רשימת הסקילים, עם הרונות של שני הסקילים שבחרת ---- */
function wrUi(){
  const ids=wsbLoad().filter(id=>id&&WRUNES.list[id]&&wsbOpen(id));if(!ids.length)return '';
  return '<div class="wrbox"><b class="wrh">💠 '+T('wr.title')+'</b>'+ids.map(id=>{const on=wrOf(id);
    return '<div class="wrrow" style="--dt:'+dtCol(SKILLS.list[id].dt)+'"><span class="wrn">'+T('sk.'+id)+'</span><div class="wrchips">'+
      wrKeys(id).map(k=>{const op=wrOpen(id,k);return '<button class="wrc'+(on===k?' on':'')+(op?'':' lock')+'" data-wrune="'+id+':'+k+'"'+(op?'':' aria-disabled="true"')+'>'+
        (op?'<b>'+T('wr.'+id+'.'+k)+'</b><small>'+T('wr.d.'+id+'.'+k)+'</small>':'<b>🔒 '+T('wsb.need',wrNeed(id,k))+'</b>')+'</button>'}).join('')+'</div></div>'}).join('')+'</div>';
}
// נגיעה ברונה: בוחרת אותה, ונגיעה נוספת מורידה
function wrPick(id,k){
  if(!WRUNES.list[id]||!WRUNES.list[id][k]||!wrOpen(id,k))return false;
  const R=wrSave();R[id]=R[id]===k?null:k;saveNow();sfx('tap');return true;
}
addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('[data-wrune]');if(!c)return;e.stopPropagation();
  const [id,k]=c.dataset.wrune.split(':');if(wrPick(id,k))wsbDrawUi()},true);
