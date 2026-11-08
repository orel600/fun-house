/* אפקטים של קרב בעולם (FXC, ניר 7.11.2026, הנכסים מ-#441). רק בעולם הפתוח: הזירה של אוראל לא נוגעת כאן.
   1. אזהרות על הרצפה (wtg_*) לכל מתקפה עם הכנה: מכה מקרוב (strike.js), הסתערות, ירייה וקפיצה (foeai.js), ומכות השומרים והענקים (story.js, giant.js).
      הסימן בגודל של אזור הפגיעה האמיתי, ונמשך בדיוק את זמן ההכנה. ניר: "לא רואים את המתקפות".
      הציור הישן נשאר רק בתור השעון (המילוי שגדל עד המכה). הבסיס והמסגרת שלו לא מצוירים כשהגיליון נטען (fxcTgOn).
   2. פגיעה ומוות לפי סוג נזק (whit_<סוג>, wko_<סוג>): במקום הבזק הפגיעה ועננת העשן של juice.js. בלי הקבצים: כמו קודם.
   3. כרייה: נצנוץ עדין (wmine_glint) על מרבצים ליד הגיבור, ורסיסים כשמרבץ נגמר (wmine_stone, או wmine_gem_<צבע> במרבץ של אבן חן).
   חיבורים: fxcUpdate מ-worldUpdate, fxcHit/fxcKill מ-juiceHit/juiceKill (juice.js), fxcTgOn מהציור של strike.js, foeai.js ו-story.js,
   ועוטף מבחוץ את nodeDown. מחיקה: הקובץ והשורות האלה, והכל חוזר לציור הישן.
   עומס: תקרה לפגיעות בפריים, ולא מוסיפים אפקט חד-פעמי כשספריית האפקטים קרובה לתקרה שלה (FXLIB.max) */
const FXC={
  on:true,
  cap:12,               // כמה פגיעות, מוות ורסיסים של השכבה בבת אחת (נמדד 7.11: בלי זה קרב צפוף הגיע ל-60 מתוך 70)
  room:10,              // לא מוסיפים פגיעה, מוות או נצנוץ כש-FXLIB.list קרובה מזה לתקרה (FXLIB.max). אזהרות תמיד: הן חשובות למשחק
  // אזהרות. fit: איזה חלק מהפריים הצורה תופסת (נמדד מהגיליונות), כדי שהגודל על הרצפה יהיה בדיוק אזור הפגיעה.
  // cone: h גובה המשולש, apex כמה הקודקוד רחוק מהמרכז (המשולש מצביע למטה בגיליון). line: אורך הפס (אנכי בגיליון)
  tg:{a:0.8,big:0.85,fps:30,
    fit:{wtg_cone:{h:0.44,apex:0.35},wtg_line:0.81,wtg_circle:0.56,wtg_ring:0.76,wtg_charge:0.56,wtg_circle_big:0.64},
    charge:{on:0.9},    // הכדור הנטען (wtg_charge) על אביר שמתכונן להסתער: פי כך מהגוף
    shoot:240,          // שומר שיורה: עד כמה רחוק המשולש (כמו קווי הכיוון ב-storyTelDraw)
    ring:1.8,           // שומר האש לפני טבעת: הטבעת סביבו, פי כך מהרדיוס (כמו ההילה ב-storyTelDraw)
    // קריאות בקרב צפוף (ניר 8.11, docs/combat-feel-2026-11-08.md פרק 3): האזהרה הייתה קטנה, אדומה כמו טבעות האויבים והניצוצות, ומתחת למספרים ולשמות.
    // עכשיו: צבע שאף דבר אחר לא משתמש בו (ורוד-מג'נטה, לא אחד מסוגי הנזק ולא זהב), מצוירת מעל הפגיעות והמספרים (fxcTgDraw מ-render.js), ומשולש קרוב גדול יותר
    col:'#FF3DD8',      // הצבע של כל אזהרה על הרצפה בעולם
    tint:0.85,          // כמה מהצבע נכנס לגיליון (השאר: הצל והמרקם המקוריים)
    coneMin:64},        // טווח מינימלי לציור משולש של מכה מקרוב (יחידות משחק). הפגיעה עצמה לא משתנה, רק הסימן קצת גדול יותר
  // פגיעה: גודל לפי האויב (פי k מהרדיוס, בין min ל-max), לכל היותר perFrame בפריים. crit: גדול יותר
  hit:{k:2.6,min:46,max:170,perFrame:3,a:0.95,crit:1.35,fps:40},
  ko:{k:3.2,min:70,max:280,a:1,fps:30},
  // סוג נזק (DMG.types) ← שם הגיליון. צמח ורעל: emerald, למקרה שיתווספו
  type:{physical:'phys',fire:'fire',water:'water',ice:'ice',lightning:'lightning',earth:'earth',plant:'plant',poison:'plant'},
  // כרייה: אילו מרבצים (צורה ב-NODES.kinds), ואיזה צבע אבן חן לכל מרבץ של קריסטל. מרבץ בלי צבע: wmine_stone
  mine:{shapes:{rock:1,vein:1,crystal:1},
    gem:{tideRock:'sapphire',iceRock:'sapphire',emberRock:'ruby',stormRock:'amethyst',voidRock:'amethyst',gold:'amber',mythril:'emerald'},
    stone:110,gemSize:120,
    glint:{every:[1.4,2.8],near:380,size:44,a:0.65,max:2,up:0.6}},
  // מצב חי
  own:[],tgL:[],tint:{},pre:0,fr:0,hitFr:-1,hits:0,glT:1,glints:[],stat:{tg:{},hit:{},ko:{},mine:{},glint:0,top:0}
};
const fxcOn=()=>FXC.on&&typeof fxPlay==='function'&&!!S&&!!S.wd&&!S.mb;
const fxcRoom=()=>{FXC.own=FXC.own.filter(h=>h.on&&FXLIB.list.includes(h));return FXC.own.length<FXC.cap&&FXLIB.list.length<FXLIB.max-FXC.room};
const fxcOwn=h=>{if(h)FXC.own.push(h);return h};
const fxcCount=(b,id)=>{b[id]=(b[id]||0)+1};

/* ---- אזהרות ---- */
// הסימן שצריך להיות עכשיו לאויב (או לעיגול על הרצפה), או null. k: מפתח של ההכנה הזו, כדי שהכנה חדשה תקבל סימן חדש
function fxcTgWant(e){
  const G=FXC.tg,F=G.fit;
  if(e.sw>0&&typeof STRIKE!=='undefined'){   // מכה מקרוב: משולש לכיוון המכה, באורך הטווח האמיתי (בלי ההגדלה של STRIKE.show)
    const R=Math.max(G.coneMin,e.r+P.r+STRIKE.reach),s=R/F.wtg_cone.h;
    return{k:'sw'+e.sa,id:'wtg_cone',x:e.x+Math.cos(e.sa)*F.wtg_cone.apex*s,y:e.y+Math.sin(e.sa)*F.wtg_cone.apex*s,size:s,rot:e.sa+Math.PI/2,left:e.sw}}
  if(e.act&&typeof FOEAI!=='undefined'){const A=FOEAI,left=Math.max(0,e.at);
    if(e.act==='wind'){const L=A.charge.len,s=L/F.wtg_line;return{k:'wd'+e.aa,id:'wtg_line',x:e.x+Math.cos(e.aa)*L/2,y:e.y+Math.sin(e.aa)*L/2,size:s,rot:e.aa+Math.PI/2,left,extra:'wtg_charge'}}
    if(e.act==='aim'){const L=A.ranged.range,s=L/F.wtg_line;return{k:'am'+e.aa,id:'wtg_line',x:e.x+Math.cos(e.aa)*L/2,y:e.y+Math.sin(e.aa)*L/2,size:s,rot:e.aa+Math.PI/2,left}}
    if(e.act==='crouch'||e.act==='jump'){const lf=e.act==='crouch'?left+A.leap.dur:left;return{k:'lp'+e.tx+','+e.ty,id:'wtg_circle',x:e.tx,y:e.ty,size:2*A.leap.r/F.wtg_circle,left:lf}}}
  const t=e.tel;if(t&&e.warden&&typeof STORY!=='undefined'){const L=STORY.lanterns[e.pk||e.warden],W=e.pw||(L&&L.warden)||{},key=t.kind+t.dur+(t.a||0);
    if(t.kind==='slam'&&W.slam){const id=e.wboss?'wtg_circle_big':'wtg_circle';return{k:key,id,x:t.x,y:t.y,size:2*W.slam.r/F[id],left:t.t,big:1}}
    if(t.kind==='charge'&&W.charge){const ch=W.charge,s=ch.len/F.wtg_line;return{k:key,id:'wtg_line',x:t.x+Math.cos(t.a)*ch.len/2,y:t.y+Math.sin(t.a)*ch.len/2,size:s,rot:t.a+Math.PI/2,left:t.t,big:1}}
    if(t.kind==='shoot'){const R=e.r+G.shoot,s=R/F.wtg_cone.h;return{k:key,id:'wtg_cone',x:e.x+Math.cos(t.a)*F.wtg_cone.apex*s,y:e.y+Math.sin(t.a)*F.wtg_cone.apex*s,size:s,rot:t.a+Math.PI/2,left:t.t,big:1}}
    if(t.kind==='ring')return{k:key,id:'wtg_ring',x:e.x,y:e.y,size:2*e.r*G.ring/F.wtg_ring,left:t.t,big:1}}
  return null;
}
// מנגן, מזיז או עוצר את הסימן של o (אויב או עיגול). w: מה צריך (fxcTgWant), או null
function fxcTgSet(o,w){
  const G=FXC.tg,cur=o.fxTg;
  if(cur&&(!w||cur.k!==w.k)){fxStop(cur.h);fxStop(cur.h2);o.fxTg=null}
  if(!w)return;
  if(o.fxTg){const h=o.fxTg.h;if(h){h.x=w.x;h.y=w.y}if(o.fxTg.h2){o.fxTg.h2.x=o.x;o.fxTg.h2.y=o.y}return}   // אותה הכנה: רק עוקב אחרי המיקום
  const a=w.big?G.big:G.a,dur=Math.max(0.05,w.left)+0.04;
  const h=fxcTgPlay(w.id,w.x,w.y,{size:w.size,rot:w.rot||0,alpha:a,dur,fps:G.fps});
  const h2=w.extra?fxcTgPlay(w.extra,o.x,o.y,{size:o.r*2*G.charge.on/FXC.tg.fit.wtg_charge,alpha:a,dur,fps:G.fps}):null;
  o.fxTg={k:w.k,h,h2};fxcCount(FXC.stat.tg,w.id);
}
// הגיליון בצבע של האזהרות (FXC.tg.col): נצבע פעם אחת לקנבס, ונרשם בספרייה בשם <id>~t עם אותם נתונים. עד שהמקור נטען: המקור
function fxcTintId(id){
  const im=fxImg(id);if(!im)return id;const k=id+'~t';if(FXC.tint[k])return k;
  try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');
    g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.globalAlpha=FXC.tg.tint;g.fillStyle=FXC.tg.col;g.fillRect(0,0,c.width,c.height);
    c.complete=true;c.naturalWidth=c.width;FXLIB.img[k]=c;FXDATA[k]=FXDATA[id];FXC.tint[k]=1;return k}catch(e){return id}
}
// האזהרות לא נכנסות לרשימה של הספרייה (שם הן מתחת לפגיעות שנוספו אחריהן), אלא לרשימה משלהן שמצוירת אחרונה (fxcTgDraw)
function fxcTgPlay(id,x,y,o){const f=fxMake(fxcTintId(id),x,y,o);if(f)FXC.tgL.push(f);return f}
// מ-render.js בעולם, אחרי הפגיעות, העשן והמספרים: האזהרות מעל הכל בקרב
function fxcTgDraw(){if(!FXC.tgL.length||!S||!S.wd)return;FXC.stat.top++;fxDrawList(FXC.tgL)}
// לציור הישן (strike.js, foeai.js, story.js): true כשהסימן מהגיליון מוצג, ואז מציירים רק את השעון (המילוי שגדל)
function fxcTgOn(o){const c=o&&o.fxTg;return !!(c&&c.h&&c.h.on&&typeof fxImg==='function'&&fxImg(c.h.id))}
function fxcTgTick(){
  for(const e of enemies){if(e.dead){if(e.fxTg)fxcTgSet(e,null);continue}const w=fxcTgWant(e);if(w||e.fxTg)fxcTgSet(e,w)}
  // עיגולי ברק, קרח והמכה הגדולה של הענק (S.wd.marks, story.js): עיגול בכל אחד עד הפיצוץ
  const list=S.wd.marks,F=FXC.tg.fit;if(list)for(const M of list){
    if(M.t>0&&!M.fxTg){const L=typeof STORY!=='undefined'&&STORY.lanterns[M.k],mk=M.mk||(L&&L.warden.marks);if(!mk)continue;
      const id=M.big?'wtg_circle_big':'wtg_circle';fxcTgSet(M,{k:'m',id,x:M.x,y:M.y,size:2*mk.r/F[id],left:M.t,big:1})}
    else if(M.t<=0&&M.fxTg)fxcTgSet(M,null)}
}

/* ---- פגיעה ומוות ---- */
const fxcType=t=>FXC.type[t]||FXC.type.physical;
const fxcSize=(e,K)=>Math.max(K.min,Math.min(K.max,e.r*K.k));
// מ-juiceHit. true = האפקט מהגיליון מטפל בפגיעה (אז בלי ההבזק הישן). e.fxDt: סוג הנזק האחרון, למוות
function fxcHit(e,t,crit,m,y){
  if(!fxcOn())return false;e.fxDt=t;if(e.node)return false;
  const id='whit_'+fxcType(t);if(!fxImg(id))return false;   // עוד לא נטען: ההבזק הישן
  if(FXC.hitFr!==FXC.fr){FXC.hitFr=FXC.fr;FXC.hits=0}
  if(FXC.hits>=FXC.hit.perFrame||!fxcRoom())return true;    // הרבה פגיעות בפריים אחד: מספיק מה שכבר נוגן
  if(m<1&&!crit)return true;                                // עמיד: בלי פיצוץ, רק המספר האפור
  FXC.hits++;const K=FXC.hit;
  fxcOwn(fxPlay(id,e.x+rand(-4,4),y,{size:fxcSize(e,K)*(crit?K.crit:1),alpha:K.a,add:true,fps:K.fps,rot:rand(0,6.28)}));fxcCount(FXC.stat.hit,id);
  return true;
}
// מ-juiceKill. true = במקום ענן העשן
function fxcKill(e){
  if(!fxcOn()||e.node)return false;
  const id='wko_'+fxcType(e.fxDt||'physical');if(!fxImg(id))return false;
  if(e.fxTg)fxcTgSet(e,null);
  if(!fxcRoom()&&!(e.isBoss||e.warden||e.elite))return true;
  const K=FXC.ko;fxcOwn(fxPlay(id,e.x,e.y-e.r*0.3,{size:fxcSize(e,K),alpha:K.a,fps:K.fps}));fxcCount(FXC.stat.ko,id);
  return true;
}

/* ---- כרייה ---- */
const fxcMineKind=k=>typeof NODES!=='undefined'&&!!NODES.kinds[k]&&!!FXC.mine.shapes[NODES.kinds[k].shape];
const fxcMineable=n=>!n.dead&&fxcMineKind(n.kind);
function fxcGlint(dt){
  const G=FXC.mine.glint;FXC.glints=FXC.glints.filter(h=>h.on&&FXLIB.list.includes(h));
  if((FXC.glT-=dt)>0)return;FXC.glT=rand(...G.every);
  if(FXC.glints.length>=G.max||!fxcRoom()||typeof fxLess==='function'&&fxLess())return;
  const near=(S.nd&&S.nd.list||[]).filter(n=>fxcMineable(n)&&Math.hypot(n.x-P.x,n.y-P.y)<G.near);if(!near.length)return;
  const n=near[Math.floor(Math.random()*near.length)];
  const h=fxPlay('wmine_glint',n.x+rand(-n.r,n.r)*0.4,n.y-n.r*G.up,{size:G.size,alpha:G.a,add:true});if(h){FXC.glints.push(h);FXC.stat.glint++}
}
function fxcMine(n){
  if(!fxcOn()||!n||!fxcMineKind(n.kind))return;
  const M=FXC.mine,c=M.gem[n.kind],id=c?'wmine_gem_'+c:'wmine_stone';
  fxcOwn(fxPlay(id,n.x,n.y-n.r*0.4,{size:c?M.gemSize:M.stone,add:!!c}));fxcCount(FXC.stat.mine,id);
}

// כל פריים בעולם (worldUpdate)
function fxcUpdate(dt){
  FXC.fr++;if(!fxcOn())return;
  if(!FXC.pre){FXC.pre=1;fxcPreload()}
  fxcTgTick();fxcGlint(dt);
}
function fxcPreload(){if(typeof fxPreload!=='function')return;
  fxPreload(Object.keys(FXC.tg.fit).concat(Object.values(FXC.type).flatMap(t=>['whit_'+t,'wko_'+t]),['wmine_stone','wmine_glint'],[...new Set(Object.values(FXC.mine.gem))].map(c=>'wmine_gem_'+c)))}
// מרבץ שנגמר: עוטפים את nodeDown (nodes.js) מבחוץ, כמו fxworld.js
(function(){const old=window.nodeDown;if(typeof old!=='function')return;
  window.nodeDown=function(n){const r=old.apply(this,arguments);try{if(S.wd)fxcMine(n)}catch(e){}return r}})();
