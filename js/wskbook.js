/* ספר הסקילים: עוד סקילים אקטיביים בעולם הפתוח (ניר, 2.11.2026: "אני רוצה יותר סקילים אקטיביים"). בעולם בלבד, הזירה של אוראל לא משתנה.
   תשעה סקילים חדשים, שלושה לכל דמות התחלה, וכל אחד עושה משהו אחר: מקף, הילה סביב הגיבור, מגן, גשם חצים, מלכודת,
   משיכה, זימון, ענן סערה ומטאור. יחד עם חמשת הסקילים של הזירה יש בספר 14, ולכל סוג נזק לפחות אחד.
   נפתחים לפי רמה: הסקילים של הדמות שלך ב-lv, של דמות אחרת ב-lv+other, והישנים לפי old. מסלול הרמות מראה אותם (wsbAt ב-levelpath.js),
   וסקיל שנפתח נכנס לבד למשבצת פנויה, ואז רגע הגילוי (skillreveal.js) מציג אותו.
   הכפתורים: הראשון תמיד הסקיל של הנשק (skills.js מחזיק אותו שם), ואת שני האחרים בוחרים בספר: "📖 סקילים" בחלון הדמות.
   נשמר ב-SAVE.hero.skLoad (שני מזהים). הסקילים נרשמים ב-SKILLS.list עם kind, ו-wskUse (wskill.js) שולח אותם לכאן.
   ic: אימוג'י זמני על הכרטיס ועל הכפתור. צריך להחליף באייקונים מצוירים (docs/creative-claw.md). השמות ב-lang.js: 'sk.<id>' ו-'wsb.d.<id>' */
const WSKBOOK={
  slots:2,      // כמה משבצות בוחרים (בנוסף לסקיל של הנשק)
  other:6,      // סקיל של דמות אחרת נפתח כמה רמות מאוחר יותר
  old:{quake:3,zap:3,splash:3,frost:5,flame:7},   // הסקילים של הזירה: באיזו רמה נפתחים בספר (הסקיל של הנשק תמיד פתוח)
  ic:{quake:'🪨',zap:'⚡',splash:'🌊',frost:'❄️',flame:'🔥'},
  /* dt: סוג הנזק. cls: הדמות. lv: רמה. cd: שניות. dmg: כפול הנזק של הנשק שביד (כמו בזירה). r: רדיוס. t: כמה זמן נמשך. tick: כל כמה שניות פוגע */
  list:{
    charge:{ic:'💨',dt:'physical', cls:'warrior',lv:2,cd:6, dmg:1.6, kind:'dash',  dist:200,t:0.2,r:46,inv:0.35},   // מקף: הגיבור מזנק ופוגע בכל מי שבדרך
    whirl: {ic:'🌀',dt:'fire',     cls:'warrior',lv:4,cd:10,dmg:0.4, kind:'aura',  r:100,t:3,tick:0.3,self:1},       // מערבולת להבות סביב הגיבור, זזה איתו
    shield:{ic:'🛡️',dt:'ice',      cls:'warrior',lv:6,cd:12,dmg:0.5, kind:'guard', r:130,inv:2.5,push:520,self:1},   // שריון קרח: חסין לרגע, והודף ומאט את מי שקרוב
    volley:{ic:'🏹',dt:'physical', cls:'hunter', lv:2,cd:8, dmg:0.45,kind:'zone',  r:105,t:2.4,tick:0.3},            // גשם חצים על אזור
    trap:  {ic:'🪤',dt:'ice',      cls:'hunter', lv:4,cd:7, dmg:2.2, kind:'trap',  r:95,arm:0.4,life:14,trig:30,freeze:2},   // מלכודת על הקרקע: הראשון שדורך מפעיל, וכולם קופאים
    vines: {ic:'🌿',dt:'earth',    cls:'hunter', lv:6,cd:9, dmg:0.8, kind:'pull',  r:240,pull:640,self:1},           // שורשים מושכים את כולם אל הגיבור
    spirit:{ic:'🫧',dt:'water',    cls:'mage',   lv:2,cd:12,dmg:0.6, kind:'summon',r:240,t:7,tick:0.6,self:1},       // רוח מים שמרחפת ליד הגיבור ויורה (רטוב + ברק/קרח = קומבו)
    storm: {ic:'⛈️',dt:'lightning',cls:'mage',   lv:4,cd:11,dmg:0.8, kind:'storm', r:240,t:4,tick:0.45,self:1},      // ענן שהולך עם הגיבור ומכה באויב אקראי
    meteor:{ic:'☄️',dt:'fire',     cls:'mage',   lv:6,cd:9, dmg:3.5, kind:'meteor',r:125,delay:0.9}                  // מטאור: סימון על הקרקע, ואחרי רגע פיצוץ ענק
  }
};
// נרשמים ליד הסקילים של הזירה, כדי שהכפתורים (skillsHud), רגע הגילוי והכוונת יכירו אותם. בזירה אף אחד לא מוסיף אותם
for(const id in WSKBOOK.list)SKILLS.list[id]=WSKBOOK.list[id];
// האימוג'י על הכפתור בעולם (::before). רק בעולם, בזירה הכפתורים כמו קודם
(()=>{const st=document.createElement('style'),ic={...WSKBOOK.ic};for(const id in WSKBOOK.list)ic[id]=WSKBOOK.list[id].ic;
  st.textContent=Object.keys(ic).map(id=>'.world .skb[data-sk="'+id+'"]::before{content:"'+ic[id]+'"}').join('');document.head.appendChild(st)})();

const wsbIds=()=>Object.keys(WSKBOOK.old).concat(Object.keys(WSKBOOK.list));
const wsbIc=id=>(WSKBOOK.list[id]||{}).ic||WSKBOOK.ic[id]||'✨';
const wsbWeapon=()=>SKILLS.weapon[P.wt]||null;
const wsbLoad=()=>{const h=SAVE.hero;if(!Array.isArray(h.skLoad))h.skLoad=[];return h.skLoad};
// באיזו רמה נפתח. הסקיל של הנשק תמיד פתוח
function wsbNeed(id){
  const D=WSKBOOK.list[id];if(!D)return WSKBOOK.old[id]||1;
  const me=typeof heroId==='function'&&heroId();return D.lv+(me&&me!==D.cls?WSKBOOK.other:0);
}
const wsbOpen=id=>id===wsbWeapon()||heroLv()>=wsbNeed(id);
// מה על הכפתורים בעולם: הסקיל של הנשק, ואחריו מה שבחרו (רק מה שפתוח, בלי כפילות)
function wsbWant(){
  const w=wsbWeapon(),out=w?[w]:[];
  for(const id of wsbLoad())if(id&&SKILLS.list[id]&&!out.includes(id)&&wsbOpen(id)&&out.length<SKILLS.max)out.push(id);
  return out;
}
// נקרא מ-wskUpdate: הכפתורים לפי הספר. קירור של סקיל שנשאר על הכפתורים נשמר
function wsbSync(){
  const k=S.sk;if(!k||!S.wd||S.room)return;
  const want=wsbWant();if(want.join()===k.ids.join())return;
  k.cd=want.map(id=>{const i=k.ids.indexOf(id);return i>=0?k.cd[i]:0});k.ids=want;
}
// עלו רמה: מה שנפתח נכנס למשבצת פנויה (נקרא מ-lpLevelUp ב-levelpath.js)
function wsbLevelUp(from,lv){
  const L=wsbLoad();let got=0;
  for(const id of wsbIds()){const n=wsbNeed(id);if(n<=from||n>lv||id===wsbWeapon()||L.includes(id))continue;
    for(let i=0;i<WSKBOOK.slots;i++)if(!L[i]||!SKILLS.list[L[i]]){L[i]=id;got++;break}}
  if(got)saveNow();
}
// מסלול הרמות (lpAt ב-levelpath.js): אילו סקילים נפתחים ברמה הזו
const wsbAt=lv=>lv<2?[]:wsbIds().filter(id=>id!==wsbWeapon()&&wsbNeed(id)===lv).map(id=>({k:'skill',icon:wsbIc(id),txt:T('wsb.lp',T('sk.'+id))}));

/* ---- הטלה: נקרא מ-wskUse אחרי שנבחרה מטרה. tg: הנקודה, base: הנזק, F: ההטלה הראשונה הגדולה (skillreveal.js) ---- */
const wsbStat={casts:{},hits:{}};   // בשביל הבוט
const wsbFx=()=>(S.wsb||(S.wsb={fx:[]})).fx;
const wsbLess=()=>typeof fxLess==='function'&&fxLess();
function wsbHit(e,id,base,from,t){
  if(e.dead)return;damage(e,base,'skill',Math.atan2(e.y-from.y,e.x-from.x),t);
  S.sk.wHits=(S.sk.wHits||0)+1;wsbStat.hits[id]=(wsbStat.hits[id]||0)+1;
}
// מי בתוך עיגול, וגם בטווח ההתקפה מהגיבור (כמו כל סקיל בעולם)
const wsbIn=(x,y,r)=>enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)-e.r<=r&&wskIn(e,P));
function wsbCast(id,D,tg,base,col,vis,F){
  const rk=(F?F.r:1)*vis,L=wsbFx(),o={id,k:D.kind,t:0,base,col,dt:D.dt,vis,r:D.r*rk};
  wsbStat.casts[id]=(wsbStat.casts[id]||0)+1;
  switch(D.kind){
    case 'dash':{const a=Math.atan2(tg.y-P.y,tg.x-P.x),d=Math.min(D.dist*(F?1.3:1),Math.max(60,Math.hypot(tg.x-P.x,tg.y-P.y)+30));
      Object.assign(o,{fx:P.x,fy:P.y,tx:P.x+Math.cos(a)*d,ty:P.y+Math.sin(a)*d,dur:D.t,hit:new Set()});P.inv=Math.max(P.inv,D.inv);break}
    case 'aura':case 'storm':case 'summon':Object.assign(o,{dur:D.t,tick:0,x:P.x,y:P.y});break;
    case 'guard':{o.dur=D.inv;P.inv=Math.max(P.inv,D.inv);
      for(const e of wsbIn(P.x,P.y,o.r)){const a=Math.atan2(e.y-P.y,e.x-P.x),k=e.isBoss?0.25:1;e.kx+=Math.cos(a)*D.push*k;e.ky+=Math.sin(a)*D.push*k;wsbHit(e,id,base,P,D.dt)}
      S.sk.fx.push({ring:1,x:P.x,y:P.y,r:o.r,t:0,max:0.4*themeK(),col});break}
    case 'pull':{o.dur=0.35;o.ties=[];
      for(const e of wsbIn(P.x,P.y,o.r)){const a=Math.atan2(P.y-e.y,P.x-e.x),d=Math.hypot(P.x-e.x,P.y-e.y),k=(e.isBoss?0.2:1)*Math.min(1,d/o.r+0.3);
        e.kx+=Math.cos(a)*D.pull*k;e.ky+=Math.sin(a)*D.pull*k;o.ties.push(e);wsbHit(e,id,base,P,D.dt)}break}
    case 'zone':Object.assign(o,{x:tg.x,y:tg.y,dur:D.t,tick:0});break;
    case 'trap':Object.assign(o,{x:tg.x,y:tg.y,dur:D.life});break;
    case 'meteor':Object.assign(o,{x:tg.x,y:tg.y,dur:D.delay+0.45});break;
  }
  if(!wsbLess())sparks(P.x,P.y-10,col,8,160);
  L.push(o);
}

/* ---- כל פריים בעולם (מ-wskUpdate) ---- */
function wsbUpdate(dt){
  wsbSync();
  const L=S.wsb&&S.wsb.fx;if(!L||!L.length)return;
  for(const o of L){const D=SKILLS.list[o.id];o.t+=dt;
    switch(o.k){
      case 'dash':{const f=Math.min(1,o.t/o.dur);P.x=o.fx+(o.tx-o.fx)*f;P.y=o.fy+(o.ty-o.fy)*f;placeClamp(P);
        for(const e of wsbIn(P.x,P.y,o.r))if(!o.hit.has(e)){o.hit.add(e);wsbHit(e,o.id,o.base,P,o.dt)}
        if(f>=1&&!o.end){o.end=1;S.sk.fx.push({ring:1,x:P.x,y:P.y,r:o.r*1.4,t:0,max:0.3*themeK(),col:o.col})}break}
      case 'aura':o.x=P.x;o.y=P.y;if((o.tick-=dt)<=0){o.tick=D.tick;for(const e of wsbIn(P.x,P.y,o.r))wsbHit(e,o.id,o.base,P,o.dt)}break;
      case 'zone':if((o.tick-=dt)<=0){o.tick=D.tick;for(const e of wsbIn(o.x,o.y,o.r))wsbHit(e,o.id,o.base,o,o.dt)}break;
      case 'trap':if(o.t>D.arm&&!o.boom&&enemies.some(e=>!e.dead&&Math.hypot(e.x-o.x,e.y-o.y)-e.r<=D.trig)){
          o.boom=1;o.dur=o.t+0.35;S.sk.fx.push({ring:1,x:o.x,y:o.y,r:o.r,t:0,max:0.4*themeK(),col:o.col});
          for(const e of wsbIn(o.x,o.y,o.r)){wsbHit(e,o.id,o.base,o,o.dt);if(!e.isBoss)e.frozen=Math.max(e.frozen||0,D.freeze)}
          sparks(o.x,o.y,o.col,wsbLess()?6:16,240);S.shake=Math.max(S.shake,3)}break;
      case 'summon':{const a=o.t*1.6;o.x+=(P.x+Math.cos(a)*38-o.x)*Math.min(1,dt*6);o.y+=(P.y-46+Math.sin(a)*10-o.y)*Math.min(1,dt*6);
        if((o.tick-=dt)<=0){const t=nearest(o.r);if(t&&wskIn(t,P)){o.tick=D.tick;skLine({x:o.x,y:o.y+6},t,o.col);wsbHit(t,o.id,o.base,o,o.dt)}}break}
      case 'storm':o.x=P.x;o.y=P.y-90;if((o.tick-=dt)<=0){o.tick=D.tick;const c=wsbIn(P.x,P.y,o.r);
          if(c.length){const t=c[Math.floor(Math.random()*c.length)];skLine({x:o.x+rand(-24,24),y:o.y+6},t,o.col);wsbHit(t,o.id,o.base,P,o.dt)}}break;
      case 'meteor':if(o.t>=D.delay&&!o.boom){o.boom=1;
          S.sk.fx.push({ring:1,x:o.x,y:o.y,r:o.r,t:0,max:0.45*themeK(),col:o.col});if(!wsbLess())S.sk.fx.push({ring:1,x:o.x,y:o.y,r:o.r*1.3,t:0,max:0.6*themeK(),col:o.col});
          for(const e of wsbIn(o.x,o.y,o.r))wsbHit(e,o.id,o.base,o,o.dt);
          sparks(o.x,o.y,o.col,wsbLess()?8:24,300);S.shake=Math.max(S.shake,wsbLess()?3:7);sfx('hit')}break;
    }}
  S.wsb.fx=L.filter(o=>o.t<o.dur);
}

/* ---- ציור (מ-drawWSkill, בקואורדינטות העולם) ---- */
function wsbDraw(){
  const L=S.wsb&&S.wsb.fx;if(!L||!L.length)return;
  const less=wsbLess();ctx.save();
  for(const o of L){const k=Math.min(1,o.t/o.dur);ctx.strokeStyle=ctx.fillStyle=o.col;
    switch(o.k){
      case 'dash':ctx.globalAlpha=0.5*(1-k);ctx.lineWidth=18*o.vis;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(o.fx,o.fy);ctx.lineTo(P.x,P.y);ctx.stroke();break;
      case 'aura':{const n=less?2:4;ctx.lineWidth=5*o.vis;for(let i=0;i<n;i++){const a=o.t*7+i*Math.PI*2/n;ctx.globalAlpha=0.75;ctx.beginPath();ctx.arc(P.x,P.y,o.r*0.85,a,a+0.9);ctx.stroke()}
        ctx.globalAlpha=0.1;ctx.beginPath();ctx.arc(P.x,P.y,o.r,0,7);ctx.fill();break}
      case 'guard':ctx.globalAlpha=0.22*(1-k*0.6);ctx.beginPath();ctx.arc(P.x,P.y-14,36*o.vis,0,7);ctx.fill();ctx.globalAlpha=0.9*(1-k*0.6);ctx.lineWidth=3;ctx.stroke();break;
      case 'pull':ctx.globalAlpha=1-k;ctx.lineWidth=4;for(const e of o.ties){if(e.dead)continue;ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.quadraticCurveTo((P.x+e.x)/2+12,(P.y+e.y)/2-16,e.x,e.y);ctx.stroke()}break;
      case 'zone':{ctx.globalAlpha=0.14;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);ctx.fill();ctx.globalAlpha=0.7;ctx.lineWidth=2;ctx.stroke();
        ctx.lineWidth=2;ctx.globalAlpha=0.9;for(let i=0;i<(less?4:9);i++){const a=i*2.4+o.t*3,d=o.r*((i*37%10)/10),x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d*0.6,h=((o.t*4+i*0.3)%1)*40;
          ctx.beginPath();ctx.moveTo(x,y-60+h);ctx.lineTo(x,y-40+h);ctx.stroke()}break}
      case 'trap':if(o.boom)break;ctx.globalAlpha=o.t>SKILLS.list.trap.arm?0.9:0.4;ctx.lineWidth=3;ctx.beginPath();
        for(let i=0;i<=12;i++){const a=i*Math.PI/6,d=i%2?10:20;ctx.lineTo(o.x+Math.cos(a)*d,o.y+Math.sin(a)*d*0.6)}ctx.stroke();break;
      case 'summon':ctx.globalAlpha=0.3;ctx.beginPath();ctx.arc(o.x,o.y,16*o.vis,0,7);ctx.fill();ctx.globalAlpha=0.95;ctx.beginPath();ctx.arc(o.x,o.y,8*o.vis,0,7);ctx.fill();break;
      case 'storm':ctx.globalAlpha=0.55*Math.min(1,(o.dur-o.t)*3);ctx.fillStyle='#3B3550';for(const [dx,r] of [[-26,22],[0,30],[26,22]]){ctx.beginPath();ctx.ellipse(o.x+dx,o.y,r,r*0.6,0,0,7);ctx.fill()}
        ctx.globalAlpha=0.12;ctx.fillStyle=o.col;ctx.beginPath();ctx.arc(P.x,P.y,o.r,0,7);ctx.fill();break;
      case 'meteor':{const D=SKILLS.list.meteor;if(o.boom)break;const f=o.t/D.delay;
        ctx.globalAlpha=0.6;ctx.lineWidth=3;ctx.beginPath();ctx.arc(o.x,o.y,o.r*(1-f*0.5),0,7);ctx.stroke();ctx.globalAlpha=0.15;ctx.fill();
        ctx.globalAlpha=1;ctx.beginPath();ctx.arc(o.x+(1-f)*120,o.y-(1-f)*320,14*o.vis,0,7);ctx.fill();break}
    }}
  ctx.restore();
}

/* ---- הספר: חלון משלו (נפתח מכפתור בחלון הדמות). משמאל שלוש המשבצות, מימין כל הסקילים ---- */
let wsbSel=0;   // איזו משבצת נבחרה (0 או 1, מתוך skLoad)
function wsbEl(){
  let ov=$('ovBook');if(ov)return ov;
  ov=document.createElement('div');ov.id='ovBook';ov.className='ov gearov';ov.hidden=true;
  ov.innerHTML='<div class="panel win dailywin wsbwin" role="dialog"></div>';document.body.appendChild(ov);
  ov.addEventListener('click',e=>{
    if(e.target===ov||e.target.closest('[data-wsb="x"]')){wsbClose();return}
    const s=e.target.closest('[data-wslot]');if(s){wsbSel=+s.dataset.wslot;sfx('tap');wsbDrawUi();return}
    const c=e.target.closest('[data-wsbid]');if(c){wsbPick(c.dataset.wsbid);wsbDrawUi()}});
  return ov;
}
function wsbOpenUi(){const L=wsbLoad();wsbSel=L[0]&&!L[1]?1:0;wsbEl().hidden=false;wsbDrawUi()}
function wsbClose(){const ov=$('ovBook');if(ov)ov.hidden=true;if(typeof gRedraw==='function'&&$('ovGear')&&!$('ovGear').hidden)gRedraw()}
// בחירה: סקיל שכבר במשבצת יוצא ממנה. אחרת נכנס למשבצת שנבחרה
function wsbPick(id){
  if(!SKILLS.list[id]||!wsbOpen(id)||id===wsbWeapon())return false;
  const L=wsbLoad(),i=L.indexOf(id);
  if(i>=0)L[i]=null;else{L[wsbSel]=id;wsbSel=(wsbSel+1)%WSKBOOK.slots}
  saveNow();sfx('tap');return true;
}
function wsbCard(id,where){
  const D=SKILLS.list[id],open=wsbOpen(id),on=where>=0;
  return '<button class="wsbc'+(on?' on':'')+(open?'':' lock')+'" data-wsbid="'+id+'" style="--dt:'+dtCol(D.dt)+'" title="'+T('wsb.d.'+id)+'"'+(open?'':' aria-disabled="true"')+'>'+
    '<span class="wsbi">'+dtSvg(D.dt)+'<em>'+wsbIc(id)+'</em></span><span class="wsbn"><b>'+T('sk.'+id)+'</b><small>'+
    (open?T('wsb.d.'+id):'🔒 '+T('wsb.need',wsbNeed(id)))+'</small></span>'+(on?'<span class="wsbk">'+(where+1)+'</span>':'')+'</button>';
}
function wsbDrawUi(){
  const ov=$('ovBook');if(!ov||ov.hidden)return;
  const w=wsbWeapon(),L=wsbLoad(),slot=(id,i,fixed)=>'<button class="wsbs'+(i===wsbSel+1&&!fixed?' sel':'')+'"'+(fixed?' disabled':' data-wslot="'+(i-1)+'"')+(id?' style="--dt:'+dtCol(SKILLS.list[id].dt)+'"':'')+'>'+
    '<span class="wsbk">'+(i+1)+'</span>'+(id?'<span class="wsbi">'+dtSvg(SKILLS.list[id].dt)+'<em>'+wsbIc(id)+'</em></span><b>'+T('sk.'+id)+'</b>':'<b class="dim">'+T('wsb.empty')+'</b>')+(fixed?'<small>'+T('wsb.weapon')+'</small>':'')+'</button>';
  const ids=wsbIds().filter(id=>id!==w).sort((a,b)=>wsbNeed(a)-wsbNeed(b));
  ov.firstChild.innerHTML='<div class="whd"><h2>📖 '+T('wsb.title')+'</h2><button class="wx" data-wsb="x" aria-label="'+T('q.close')+'">✕</button></div>'+
    '<div class="wsbcols"><div class="wsbslots">'+slot(w,0,true)+slot(L[0]&&wsbOpen(L[0])?L[0]:null,1)+slot(L[1]&&wsbOpen(L[1])?L[1]:null,2)+'<p class="dim">'+T('wsb.how')+'</p></div>'+
    '<div class="wsbgrid">'+ids.map(id=>wsbCard(id,L.indexOf(id))).join('')+'</div></div>';
}
// הכפתור בחלון הדמות (statsHtml ב-stats.js)
const wsbBtn=()=>'<button class="vbtn ghost wsbopen" data-wsbopen="1">📖 '+T('wsb.open')+'</button>';
addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-wsbopen]')){e.stopPropagation();sfx('tap');wsbOpenUi()}},true);
