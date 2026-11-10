/* סקילים בעולם הפתוח (ניר, 1.11.2026: "סקילים שאתה זה שיורה"). אותם סקילים ואותם כפתורים כמו בזירה (skills.js, של אוראל),
   אבל בעולם הדמות יורה אותם: נגיעה בכפתור יורה אל האויב הקרוב, וגרירה מהכפתור מכוונת (כמו Brawl Stars), ושחרור יורה.
   סקיל טבעת (רקיעה, התזה, כפור, להבה) נזרק ככדור בצבע סוג הנזק ומתפוצץ איפה שנוחת. ברק פוגע באויב שבכיוון, וקופץ הלאה כמו בזירה.
   בזירה שום דבר לא משתנה: שם הכפתור ממשיך לקרוא ל-skillUse. נקודות החיבור: worldUpdate (world.js), render.js, ו-skHere ב-skills.js.
   מכה רק עד WORLD.attackRange מהמקום שממנו יורים, כמו ההתקפה האוטומטית בעולם */
const WSKILL={
  speed:620,      // מהירות הכדור שנזרק (פיקסלים לשנייה)
  blast:0.75,     // הפיצוץ בעולם קטן מהטבעת בזירה: הרדיוס כפול זה
  drag:14,        // מתחת לזה (פיקסלים על המסך) זו נגיעה ולא גרירה
  pull:80,        // גרירה באורך הזה = זריקה לטווח המלא
  cone:0.6,       // ברק בגרירה: האויב הכי קרוב לכיוון, עד הזווית הזו (רדיאנים) לכל צד
  min:60          // זריקה בלי אויב ובלי גרירה: נוחתת במרחק הזה לפני הדמות
};
let wskAim=null;   // הכיוון בזמן גרירה: איזה סקיל, מאיפה התחילה האצבע וכמה היא זזה

const wskRange=()=>WORLD.attackRange;
const wskIn=(e,o)=>!e.dead&&Math.hypot(e.x-o.x,e.y-o.y)-e.r<=wskRange();
function wskReady(id){const k=S.sk,i=k?k.ids.indexOf(id):-1;return i>=0&&k.cd[i]<=0&&S.mode==='play'&&!!S.wd?i:-1}
// לאן הסקיל הולך: בגרירה לפי האצבע, ובנגיעה אל האויב הקרוב (או קדימה, אם אין)
function wskTarget(id,aim){
  const D=skDef(id),R=wskRange();
  if(D.self)return{x:P.x,y:P.y};   // סקיל סביב הגיבור (wskbook.js): אין לאן לכוון
  if(D.range){   // ברק: אויב אחד שממנו קופצים
    if(!aim){const t=nearest(R);return t&&{e:t,x:t.x,y:t.y}}
    let best=null,bd=WSKILL.cone;
    for(const e of enemies){if(!wskIn(e,P))continue;const d=Math.abs(angDiff(Math.atan2(e.y-P.y,e.x-P.x),aim.a));if(d<bd){bd=d;best=e}}
    return best?{e:best,x:best.x,y:best.y}:{x:P.x+Math.cos(aim.a)*R,y:P.y+Math.sin(aim.a)*R};
  }
  if(aim){const d=Math.max(WSKILL.min,R*Math.min(1,aim.len/WSKILL.pull));return{x:P.x+Math.cos(aim.a)*d,y:P.y+Math.sin(aim.a)*d}}
  const t=nearest(R);if(t)return{x:t.x,y:t.y};
  return{x:P.x+Math.cos(P.face)*WSKILL.min*2,y:P.y+Math.sin(P.face)*WSKILL.min*2};
}
// יורים. aim: {a,len} מגרירה, או כלום לנגיעה
function wskUse(id,aim){
  const i=wskReady(id);if(i<0)return false;
  const D=skDef(id),tg=wskTarget(id,aim);if(!tg)return false;
  const F=skrFirst(id),base=skBase()*D.dmg*(F?F.dmg:1),col=skCol(id),vis=skSize(id);   // ההטלה הראשונה גדולה, והמראה לפי הדרגה בעץ (skillreveal.js)
  if(!D.self)P.aim=Math.atan2(tg.y-P.y,tg.x-P.x);
  if(D.kind)wsbCast(id,D,tg,base,col,vis,F);   // הסקילים של הספר: מקף, הילה, מגן, מלכודת ועוד (wskbook.js)
  else if(D.range){
    if(tg.e){const hit=[tg.e];
      hit.push(...enemies.filter(e=>e!==tg.e&&wskIn(e,P)&&Math.hypot(e.x-tg.e.x,e.y-tg.e.y)<D.hop).sort((a,b)=>Math.hypot(a.x-tg.e.x,a.y-tg.e.y)-Math.hypot(b.x-tg.e.x,b.y-tg.e.y)).slice(0,D.n+(F?F.hops:0)));
      let from=P;for(const e of hit){skLine(from,e,col);damage(e,base,'skill',Math.atan2(e.y-from.y,e.x-from.x),D.dt);S.sk.wHits=(S.sk.wHits||0)+1;from=e}}
    else skLine(P,tg,col);   // ברק לאוויר: מכוונים ומפספסים
  }else{
    const W=S.wsk||(S.wsk={shots:[]});
    W.shots.push({id,x:P.x,y:P.y-6,fx:P.x,fy:P.y,tx:tg.x,ty:tg.y,base,col,dt:D.dt,r:D.r*WSKILL.blast*(F?F.r:1),vis,echo:skrGrade(id)>=SKREVEAL.grade.echo});
  }
  S.sk.cd[i]=D.cd;wrCd(id,i);S.sk.used++;skCast(id);S.sk.wUsed=(S.sk.wUsed||0)+1;sfx('shoot');S.shake=Math.max(S.shake,2);
  return true;
}
// הכדורים שבדרך. כשנוחת: טבעת (מצוירת ב-drawSkills) ונזק לכל מי שבתוכה ובטווח
function wskUpdate(dt){
  skrCheck(dt);   // סקיל שעוד לא ראינו: רגע גילוי (skillreveal.js)
  wcUpdate(dt);   // השורשים נגמרים (wcombo.js)
  wrUpdate(dt);   // שלוליות ופיצוצים של רונות (wrunes.js)
  skpUpdate(dt);   // אימון סקיל: בובות (skpractice.js)
  sigUpdate(dt);   // סקיל החתימה של הדרגה (sigskill.js)
  wsbUpdate(dt);   // הכפתורים לפי ספר הסקילים, והסקילים שלו שעוד פועלים (wskbook.js)
  const W=S.wsk;if(!W||!W.shots.length)return;
  for(const s of W.shots){const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy),step=WSKILL.speed*dt;
    if(d>step){s.x+=dx/d*step;s.y+=dy/d*step;continue}
    s.x=s.tx;s.y=s.ty;s.done=true;
    S.sk.fx.push({ring:1,x:s.x,y:s.y,r:s.r*s.vis,t:0,max:0.35*themeK(),col:s.col});sparks(s.x,s.y,s.col,Math.round(10*s.vis),220*s.vis);
    if(s.echo)S.sk.fx.push({ring:1,x:s.x,y:s.y,r:s.r*s.vis*1.25,t:0,max:0.5*themeK(),col:s.col});   // דרגה גבוהה בעץ: טבעת שנייה
    for(const e of enemies){if(e.dead||!(s.free||wskIn(e,{x:s.fx,y:s.fy}))||Math.hypot(e.x-s.x,e.y-s.y)-e.r>s.r)continue;   // free: כל מי שבפיצוץ, גם מעבר לטווח (drama.js, פער רמות)
      damage(e,s.base,'skill',Math.atan2(e.y-s.y,e.x-s.x),s.dt);S.sk.wHits=(S.sk.wHits||0)+1}}
  W.shots=W.shots.filter(s=>!s.done);
}
// המספר על הכפתור בזמן ההמתנה (רק בעולם, ה-CSS מציג אותו)
function wskHud(){
  const box=$('skills');if(!S.sk||box.hidden)return;
  S.sk.ids.forEach((id,i)=>{const b=box.children[i];if(!b)return;const n=S.sk.cd[i]>0?String(Math.ceil(S.sk.cd[i])):'';if(b.dataset.sec!==n)b.dataset.sec=n});
  box.classList.toggle('aiming',!!wskAim);
}

/* ---- ציור: הכדורים בדרך, והכוונת בזמן גרירה (קו מקווקו ועיגול איפה שינחת) ---- */
function drawWSkill(){
  if(!S.wd)return;
  skrDraw();   // רגע הגילוי (skillreveal.js)
  wsbDraw();   // ספר הסקילים (wskbook.js)
  wcDraw();   // שורשים לרגליים של מי שתקוע (wcombo.js)
  wrDraw();   // שלוליות של רונות (wrunes.js)
  skpDraw();   // טבעת מתחת לבובות האימון (skpractice.js)
  const W=S.wsk;
  if(W)for(const s of W.shots){ctx.globalAlpha=0.35;ctx.fillStyle=s.col;ctx.beginPath();ctx.arc(s.x,s.y,15*s.vis,0,7);ctx.fill();ctx.globalAlpha=1;dtIcon(s.x,s.y,s.dt,18*s.vis)}
  const a=wskAim;if(!a||!a.len||a.len<WSKILL.drag||wskReady(a.id)<0)return;
  const D=skDef(a.id),tg=wskTarget(a.id,a),col=skCol(a.id);
  ctx.strokeStyle=col;ctx.lineWidth=3;ctx.globalAlpha=0.85;ctx.setLineDash([10,8]);
  ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(tg.x,tg.y);ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=0.18;ctx.fillStyle=col;ctx.beginPath();ctx.arc(tg.x,tg.y,D.range?(tg.e?tg.e.r+10:14):D.r*(D.kind?1:WSKILL.blast),0,7);ctx.fill();
  ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(tg.x,tg.y,D.range?(tg.e?tg.e.r+10:14):D.r*(D.kind?1:WSKILL.blast),0,7);ctx.stroke();ctx.globalAlpha=1;
}

/* ---- אצבע: בעולם הכפתור מכוון ויורה כשמרימים. נתפס לפני ה-pointerdown של skills.js, ולכן בזירה הכל כמו קודם ---- */
addEventListener('pointerdown',e=>{
  const b=S&&S.wd&&e.target.closest&&e.target.closest('#skills [data-sk]');if(!b)return;
  e.preventDefault();e.stopPropagation();
  wskAim={id:b.dataset.sk,pid:e.pointerId,sx:e.clientX,sy:e.clientY,a:0,len:0};try{b.setPointerCapture(e.pointerId)}catch(_){}
},true);
addEventListener('pointermove',e=>{const a=wskAim;if(!a||e.pointerId!==a.pid)return;
  const dx=e.clientX-a.sx,dy=e.clientY-a.sy;a.len=Math.hypot(dx,dy);if(a.len>=WSKILL.drag)a.a=Math.atan2(dy,dx)},true);
addEventListener('pointerup',e=>{const a=wskAim;if(!a||e.pointerId!==a.pid)return;wskAim=null;
  if(S&&S.wd)(typeof sktTap==='function'?sktTap:wskUse)(a.id,a.len>=WSKILL.drag?a:null)},true);   // sktTap: נגיעה בלי מטרה בטווח לא מבזבזת (skillteach.js)
addEventListener('pointercancel',e=>{if(wskAim&&e.pointerId===wskAim.pid)wskAim=null},true);
// במקלדת בעולם: 1, 2, 3 יורים אל הקרוב (בזירה skills.js מטפל)
addEventListener('keydown',e=>{const n=/^Digit([1-3])$/.exec(e.code);if(n&&S&&S.wd&&S.sk&&e.target===document.body)(typeof sktTap==='function'?sktTap:wskUse)(S.sk.ids[n[1]-1])});
$('skills').addEventListener('keydown',e=>{const b=e.target.closest('[data-sk]');if(b&&S&&S.wd&&(e.key==='Enter'||e.key===' '))wskUse(b.dataset.sk)});
