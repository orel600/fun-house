/* הסקיל הראשון מלמד תזמון (SKTEACH, ניר 10.11.2026: "חד אבל קריא"). בדיקת שחקן חיצונית: הסקיל הראשון (רקיעה, ובקשת ברק)
   הופעל מוקדם מדי, מחוץ לטווח, ואז ישב כהה בקירור, והשחקן לא הבין למה.
   בשימושים הראשונים של הסקיל בכפתור הראשון, רק בעולם:
   1. אויב מתכונן להכות אותך (אותן הכנות שמציירות אזהרה ב-fxcombat.js): "Step out!" מעל הגיבור, בצבע האזהרות.
   2. יצאת מהמכה והסקיל מוכן ויש אויבים בטווח: "Now!" והכפתור פועם.
   3. בכל רגע שהסקיל מוכן: טבעת הטווח סביב הגיבור, עיגול על מי שייפגע אם תלחץ עכשיו, והכפתור מואר (יש מטרה) או עמום (אין).
   4. פגיעה בקבוצה (2 ומעלה): "3 hit!" במקום הפיצוץ.
   אחרי SKTEACH.uses שימושים שפגעו (או SKTEACH.cap שימושים בכלל) הכל נעלם בהדרגה, ונשמר ב-SAVE.hero.skTeach. מתג הטיפים בהגדרות מכבה גם את זה.
   קבוע, גם אחרי הלימוד: נגיעה בכפתור (לא גרירה) כשאין אף אויב בטווח לא מבזבזת את הסקיל. הכפתור רועד, והסקיל נשאר מוכן. גרירה עדיין יורה לאן שכיוונת.
   חיבור: wskill.js קורא ל-sktTap בנגיעה ובמקלדת, והקובץ עוטף מבחוץ את wskUse, wskUpdate ו-drawWSkill. מחיקה: הקובץ, השורה ב-index.html והשורה ב-wskill.js. */
const SKTEACH={
  uses:5,          // כמה שימושים שפגעו עד שהלימוד נגמר
  cap:12,          // וגם: אחרי כמה שימושים בכלל, גם אם לא פגעו
  fadeFrom:3,      // מהשימוש הזה הכל מתחיל לדעוך (שקיפות יורדת עד uses)
  minA:0.35,       // השקיפות הכי נמוכה לפני שנעלם
  ring:{a:0.16,on:0.34,w:2,dash:[8,10]},   // טבעת הטווח סביב הגיבור: שקיפות בלי מטרה / עם מטרה
  aim:{a:0.16,line:0.75},                  // העיגול על מי שייפגע עכשיו
  danger:{near:40,line:30,after:1.4},      // אויב בהכנה: כמה מרווח מסביב לאזור המכה נחשב "בתוכו", וכמה שניות אחרי היציאה עוד אומרים "Now!"
  text:{size:15,up:46,col:'#FF3DD8',now:'#F4C74F'},   // התוויות מעל הגיבור. col: כמו FXC.tg.col (אזהרות)
  group:{min:2,life:1.1,size:18,rise:34,max:3},       // "3 hit!": מכמה פגיעות, כמה זמן, גודל, כמה עולה, וכמה בבת אחת
  no:{t:0.45}      // כמה זמן הכפתור רועד כשאין מטרה
};
// המצב: מה רואים עכשיו (בשביל הציור והבוט), תוויות "3 hit!", ומונים לבוט
const SKT={inR:0,tg:null,danger:false,dangerT:-9,hpAt:0,now:false,noT:0,pops:[],t:0,
  stat:{ring:0,danger:0,now:0,blocked:0,group:0,uses:0,good:0}};

const sktCalm=()=>typeof calmOn==='function'?calmOn():(typeof RM!=='undefined'&&RM);
const sktLearn=()=>{const h=SAVE&&SAVE.hero;if(!h)return{n:0,u:0};if(typeof h.skTeach!=='object'||!h.skTeach)h.skTeach={n:0,u:0};return h.skTeach};
const sktId=()=>S&&S.sk&&S.sk.ids?S.sk.ids[0]:null;
// הסקיל בכפתור הראשון, אם הוא סקיל שנזרק או ברק (לא מקף, הילה או מגן מהספר: לאלה אין "טווח")
function sktSkill(){const id=sktId(),D=id&&skDef(id);return D&&!D.kind&&!D.self?{id,D}:null}
// כמה הלימוד עוד חזק: 1 בהתחלה, יורד מ-fadeFrom, 0 כשנגמר
function sktK(){
  if(!S||!S.wd||S.mb||S.mode!=='play'||!SAVE||SAVE.tipsOff)return 0;
  const L=sktLearn(),K=SKTEACH;if(L.n>=K.uses||L.u>=K.cap)return 0;
  if(L.n<K.fadeFrom)return 1;return Math.max(K.minA,1-(L.n-K.fadeFrom+1)/(K.uses-K.fadeFrom+1));
}
const sktOn=()=>sktK()>0;

// מי ייפגע אם לוחצים עכשיו (נגיעה = אל הקרוב, כמו wskTarget): המטרה, וכמה אויבים בתוך הפיצוץ
function sktScan(){
  SKT.inR=0;SKT.tg=null;const s=sktSkill();if(!s||!S.wd)return;
  const R=wskRange(),t=nearest(R);if(!t)return;SKT.tg=t;
  if(s.D.range){SKT.inR=Math.min(1+(s.D.n||0),enemies.filter(e=>wskIn(e,P)&&Math.hypot(e.x-t.x,e.y-t.y)<(s.D.hop||0)).length+1);return}
  const r=s.D.r*WSKILL.blast;
  for(const e of enemies)if(wskIn(e,P)&&Math.hypot(e.x-t.x,e.y-t.y)-e.r<=r)SKT.inR++;
}
// אויב שמתכונן להכות, והגיבור בתוך אזור המכה (אותם מצבים כמו fxcTgWant ב-fxcombat.js)
function sktThreat(){
  const G=SKTEACH.danger,pr=P.r||14;
  for(const e of enemies){if(e.dead)continue;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy);
    if(e.sw>0&&typeof STRIKE!=='undefined'&&d<=e.r+pr+STRIKE.reach+G.near)return true;
    if(!e.act||typeof FOEAI==='undefined')continue;
    if(e.act==='wind'||e.act==='aim'){const L=e.act==='wind'?FOEAI.charge.len:FOEAI.ranged.range,c=Math.cos(e.aa),s=Math.sin(e.aa),along=dx*c+dy*s,side=Math.abs(-dx*s+dy*c);
      if(along>-pr&&along<L+pr&&side<pr+G.line)return true}
    if(e.act==='crouch'&&Math.hypot(P.x-e.tx,P.y-e.ty)<=FOEAI.leap.r+pr+G.near)return true}
  return false;
}

// נגיעה בכפתור (wskill.js): בלי אויב בטווח, הסקיל לא נזרק לאוויר
function sktTap(id,aim){
  const D=skDef(id);
  if(!aim&&D&&!D.kind&&!D.self&&wskReady(id)>=0&&!nearest(wskRange())){
    SKT.noT=SKTEACH.no.t;SKT.noId=id;SKT.stat.blocked++;if(typeof sfx==='function')sfx('ui');return false}
  return wskUse(id,aim);
}

/* ---- סופרים שימושים ופגיעות. ברק פוגע מיד (בתוך wskUse), כדור נוחת אחר כך (בתוך wskUpdate) ---- */
const skt0Use=wskUse;
wskUse=function(id){
  const h0=S.sk&&S.sk.wHits||0,n0=S.wsk?S.wsk.shots.length:0,ok=skt0Use.apply(this,arguments);
  if(ok&&id===sktId()&&sktSkill()){const L=sktLearn(),D=skDef(id);L.u++;SKT.stat.uses++;
    if(D.range)sktLanded((S.sk.wHits||0)-h0,SKT.tg||P);
    else if(S.wsk&&S.wsk.shots.length>n0)S.wsk.shots[S.wsk.shots.length-1].skt=1}   // הכדור הזה נספר כשהוא נוחת
  return ok};
function sktLanded(n,at){
  const L=sktLearn(),teach=L.n<SKTEACH.uses&&L.u<=SKTEACH.cap;   // לפני הספירה של השימוש הזה
  if(n>0){L.n++;SKT.stat.good++}
  if(teach&&n>=SKTEACH.group.min&&!(SAVE&&SAVE.tipsOff)){SKT.stat.group++;
    SKT.pops.push({x:at.x,y:at.y,n,t:0});if(SKT.pops.length>SKTEACH.group.max)SKT.pops.shift()}
  if(typeof saveNow==='function'&&(L.n===SKTEACH.uses||L.u===SKTEACH.cap))saveNow();   // הלימוד נגמר: נשמר מיד
}
const skt0Upd=wskUpdate;
wskUpdate=function(dt){
  const W=S.wsk,mine=W?W.shots.filter(s=>s.skt):[],h0=S.sk&&S.sk.wHits||0;
  skt0Upd.apply(this,arguments);
  for(const s of mine)if(s.done)sktLanded((S.sk.wHits||0)-h0,s);   // שני כדורים שנוחתים באותו פריים: נדיר, והספירה עדיין סבירה
  sktTick(dt);
};
// כל פריים בעולם: מה רואים, ומצב הכפתור
function sktTick(dt){
  SKT.t+=dt;SKT.noT=Math.max(0,SKT.noT-dt);
  for(const p of SKT.pops)p.t+=dt;SKT.pops=SKT.pops.filter(p=>p.t<SKTEACH.group.life);
  const k=sktK(),s=sktSkill(),i=s?wskReady(s.id):-1;
  SKT.danger=false;SKT.now=false;
  if(k>0&&s){sktScan();
    if(sktThreat()){if(!SKT.dangerOn)SKT.hpAt=P.hp;SKT.danger=true;SKT.dangerT=SKT.t;SKT.stat.danger++}
    else if(i>=0&&SKT.inR>0&&SKT.t-SKT.dangerT<SKTEACH.danger.after&&P.hp>=SKT.hpAt-1){SKT.now=true;SKT.stat.now++}}
  SKT.dangerOn=SKT.danger;
  sktButton(k>0&&s&&i>=0?(SKT.now?'now':SKT.inR>0?'in':'out'):'');
}
// מצב הכפתור הראשון: now (פועם), in (מואר), out (עמום), no (רועד: נגיעה בלי מטרה)
function sktButton(st){
  const box=typeof $==='function'&&$('skills'),b=box&&box.querySelector('[data-sk]');if(!b)return;
  const no=SKT.noT>0&&b.dataset.sk===SKT.noId;
  for(const c of ['now','in','out','no'])b.classList.toggle('skt-'+c,c==='no'?no:st===c);
  b.classList.toggle('skt-still',sktCalm());b.style.setProperty('--sktA',String(sktK()||1));
}

/* ---- ציור: בתוך drawWSkill (קואורדינטות העולם) ---- */
const skt0Draw=drawWSkill;
drawWSkill=function(){skt0Draw.apply(this,arguments);try{sktDraw()}catch(e){}};
function sktDraw(){
  const K=SKTEACH,T_=K.text;
  for(const p of SKT.pops){const G=K.group,a=1-p.t/G.life;ctx.globalAlpha=Math.max(0,a);ctx.font='800 '+G.size+'px Heebo,system-ui,sans-serif';ctx.textAlign='center';
    ctx.lineWidth=4;ctx.strokeStyle='#000a';const y=p.y-30-G.rise*(sktCalm()?0:p.t/G.life),s=T('skt.hit',p.n);ctx.strokeText(s,p.x,y);ctx.fillStyle=T_.now;ctx.fillText(s,p.x,y)}
  ctx.globalAlpha=1;
  const k=sktK(),s=sktSkill();if(!k||!s)return;
  const ready=wskReady(s.id)>=0,col=skCol(s.id);
  if(ready&&!(wskAim&&wskAim.len>=WSKILL.drag)){SKT.stat.ring++;   // בזמן גרירה הכוונת של wskill.js מספיקה
    const R=K.ring,on=SKT.inR>0;
    ctx.globalAlpha=k*(on?R.on:R.a);ctx.strokeStyle=col;ctx.lineWidth=R.w;ctx.setLineDash(R.dash);
    ctx.beginPath();ctx.arc(P.x,P.y,wskRange(),0,7);ctx.stroke();ctx.setLineDash([]);
    const t=SKT.tg;if(on&&t){const r=s.D.range?t.r+10:s.D.r*WSKILL.blast;
      ctx.globalAlpha=k*K.aim.a;ctx.fillStyle=col;ctx.beginPath();ctx.arc(t.x,t.y,r,0,7);ctx.fill();
      ctx.globalAlpha=k*K.aim.line;ctx.beginPath();ctx.arc(t.x,t.y,r,0,7);ctx.stroke()}}
  const lab=SKT.danger?['skt.out',T_.col]:SKT.now?['skt.now',T_.now]:SKT.noT>0?['skt.far','#EDE8DA']:null;
  if(lab&&typeof r2Head==='function'&&r2Head(lab[0],SKT.danger?'danger':SKT.now?'now':'info',Math.max(k,0.6))){ctx.globalAlpha=1;return}   // בעולם: במסלול מעל הראש, מצויר אחרון (readable2.js)
  if(lab){const pulse=SKT.now&&!sktCalm()?1+0.08*Math.sin(SKT.t*14):1;
    ctx.globalAlpha=Math.max(k,0.6);ctx.font='800 '+Math.round(T_.size*pulse)+'px Heebo,system-ui,sans-serif';ctx.textAlign='center';
    const y=P.y-(P.r||14)-T_.up,txt=T(lab[0]);ctx.lineWidth=4;ctx.strokeStyle='#000b';ctx.strokeText(txt,P.x,y);ctx.fillStyle=lab[1];ctx.fillText(txt,P.x,y)}
  ctx.globalAlpha=1;
}

// העיצוב של מצבי הכפתור. כאן ולא ב-CSS, כדי שהמכניקה תהיה בקובץ אחד
(function(){const st=document.createElement('style');st.textContent=
  'body.world #skills [data-sk].skt-in{box-shadow:0 0 0 2px rgba(244,199,79,calc(var(--sktA,1)*.9)),0 0 14px rgba(244,199,79,calc(var(--sktA,1)*.55))}'+
  'body.world #skills [data-sk].skt-now{box-shadow:0 0 0 3px #F4C74F,0 0 18px #F4C74Fcc;animation:sktPulse .5s ease-in-out infinite alternate}'+
  'body.world #skills [data-sk].skt-out{filter:saturate(.45) brightness(.8)}'+
  'body.world #skills [data-sk].skt-no{animation:sktNo .15s linear 3;box-shadow:0 0 0 2px #FF3DD8}'+
  '@keyframes sktPulse{to{transform:scale(1.08)}}@keyframes sktNo{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}'+
  '@media (prefers-reduced-motion:reduce){body.world #skills [data-sk].skt-now,body.world #skills [data-sk].skt-no{animation:none}}'+
  'body.world #skills [data-sk].skt-still{animation:none!important}';
  document.head.appendChild(st)})();
