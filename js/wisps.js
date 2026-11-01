/* אורות מרחפים (ניר, 1.11.2026: "יותר בסגנון של אורות קטנים וזוהרים שמרחפים סביבך"). התוכנית והמחקר: docs/plan-fx.md, סגנון a "גחלילית".
   החפצים המסתובבים (orbit.js) מצוירים כאן כאורות: ליבה כמעט לבנה, הילה בצבע הסוג, שובל קצר ותנועה אורגנית שנגררת אחרי הדמות. בלי אייקון.
   מה החפץ עושה רואים מהחלקיקים: אש מעלה גחלים, קרח מפיל פתיתים, עלה מעלה ניצוצות ירוקים לאט, תלתן מנצנץ ככוכב, ואבן (ההגנה) אור לבן-חמים ושקט.
   מצב = בהירות: מוכן בהיר, בטעינה עמום, והבזק כשהוא פועל. ההבזקים נקראים מהמונים ב-S.orb (hits, blocked, shields, healed), בלי לגעת בלוגיקה.
   orbit.js לא משתנה: עוטפים את drawOrbits מבחוץ. בזירה (WISPS.where.arena) וב-?look=classic נשאר הציור הישן.
   הזוהר מוכן פעם אחת בטעינה (wispGlow), ובלי shadowBlur. גם השלל על הרצפה (drops.js) משתמש בו.
   אוראל, להדליק בזירה: WISPS.where.arena=true */
const WISPS={
  where:{world:true,village:true,arena:false},   // arena כולל את חדר הבונוס
  // צבע הליבה (כמעט לבן) וההילה לכל סוג. אש ממשיכה את C.ember, קרח את C.tide (סוגי הנזק, dmg.js). הגנה: לבן-חמים (ניר, 1.11)
  col:{attack:['#FFF4D6','#FF7A2E'],control:['#F2FDFF','#5FD2FF'],defense:['#FFFBEF','#E8D9B0'],support:['#F2FFE8','#5BD46B'],luck:['#FFFDE6','#FFD23F']},
  r:58, rVar:0.16, wob:0.35,   // רדיוס סביב הדמות, כמה הוא נושם, וכמה כל אור מקדים או מפגר אחרי המקום שלו במעגל
  h:26, hBob:6,                 // גובה מעל הקרקע, וכמה הוא עולה ויורד
  core:4.6, halo:24, trail:9,   // גודל הליבה, ההילה, ואורך השובל (נקודות)
  lag:7,                        // כמה מהר האור משיג את הדמות כשהיא זזה (קפיץ). קטן = נגרר יותר
  flash:{t:0.28,k:0.9},         // הבזק כשהחפץ פועל: כמה זמן, וכמה בהירות נוספת
  // חלקיקים לכל סוג: כמה בשנייה, מהירות (vx אקראי, vy), כמה זמן חיים, וגודל. vy שלילי עולה, חיובי נופל
  parts:{
    attack: {rate:22,vx:14,vy:[-28,-54],life:[0.45,0.75],s:1.6,k:'ember'},
    control:{rate:9, vx:10,vy:[14,24],  life:[0.7,1.1],  s:1.3,k:'flake',c:'#DFF8FF'},
    support:{rate:6, vx:8, vy:[-12,-20],life:[0.9,0.9],  s:1.4,k:'mote'},
    luck:   {rate:3, vx:0, vy:[0,0],    life:[0.5,0.5],  s:4,  k:'star',c:'#FFF6C2'},
    defense:{rate:0}
  },
  maxParts:160,
  stat:{draws:0,lights:0,parts:0,flashes:0}   // לבדיקה: כמה פעמים צוירו, כמה אורות וחלקיקים, וכמה הבזקים
};

/* ---- הזוהר: עיגול רך מוכן מראש לכל צבע (64px). drawImage של תמונה מוכנה זול בהרבה מגרדיאנט בכל פריים ---- */
const WGLOW={};
function wispGlow(col,hot){const k=col+(hot||'');if(WGLOW[k])return WGLOW[k];
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  if(hot){gr.addColorStop(0,'#fff');gr.addColorStop(0.18,hot);gr.addColorStop(0.45,col+'88')}else{gr.addColorStop(0,col+'cc');gr.addColorStop(0.4,col+'44')}
  gr.addColorStop(1,col+'00');g.fillStyle=gr;g.fillRect(0,0,64,64);return WGLOW[k]=c}
const wispBlit=(img,x,y,s,a)=>{ctx.globalAlpha=Math.max(0,Math.min(1,a));ctx.drawImage(img,x-s,y-s,s*2,s*2)};
// מכינים עכשיו, בטעינה, את כל מה שיצויר: לא באמצע ריצה
(()=>{for(const [hot,col] of Object.values(WISPS.col)){wispGlow(col);wispGlow(col,hot)}
  for(const p of Object.values(WISPS.parts))if(p.c)wispGlow(p.c);
  for(const r of RES.rarity)wispGlow(r.col);wispGlow(C.gold);wispGlow(C.gold,'#fff')})();

function wispsOn(){const W=WISPS.where;if(typeof HD!=='undefined'&&!HD.on)return false;return S.wd?W.world:S.vil?W.village:W.arena}

/* ---- תנועה: כל אור בזווית שלו במעגל של orbit.js (אז הוא נראה איפה שהוא פוגע), עם רדיוס שנושם, גובה שעולה ויורד, וקפיץ שמושך אותו אחרי הדמות ---- */
const WL={list:[],parts:[],t:0,last:0,seen:null};
function wispsUpdate(dt){
  const o=S.orb,W=WISPS,types=o.types;WL.t+=dt;const t=WL.t;
  while(WL.list.length<types.length)WL.list.push({x:P.x,y:P.y,h:W.h,tr:[],ph:Math.random()*6.28,sp:0.8+Math.random()*0.5,last:0,fl:0});
  WL.list.length=types.length;
  // הבזקים מהמונים של orbit.js: פגיעה (אש וקרח), עצירת ירייה ובליעת מכה (הגנה), ריפוי (עלה)
  const now={hits:o.hits,def:o.blocked+o.shields,heal:o.healed},was=WL.seen||now;WL.seen=now;
  const fire={attack:now.hits>was.hits,control:now.hits>was.hits,defense:now.def>was.def,support:now.heal>was.heal};
  const n=types.length;
  types.forEach((ty,i)=>{const w=WL.list[i];w.ty=ty;
    if(fire[ty]){w.fl=W.flash.t;W.stat.flashes++}else w.fl=Math.max(0,w.fl-dt);
    const a=o.a+i*6.283/n+W.wob*Math.sin(t*0.7*w.sp+w.ph),R=W.r*(1+W.rVar*Math.sin(t*1.3*w.sp+w.ph*2));
    const hh=typeof WH!=='undefined'&&WH[i]&&WH[i].ph,tx=hh?WH[i].x:P.x+Math.cos(a)*R,ty_=hh?WH[i].y:P.y+Math.sin(a)*R*0.85,k=hh?1:1-Math.exp(-W.lag*dt);   // בציד (WHUNT למטה) האור עף לאויב
    w.x+=(tx-w.x)*k;w.y+=(ty_-w.y)*k;w.h=W.h+W.hBob*Math.sin(t*2.1*w.sp+w.ph)+3*Math.sin(t*5.3+w.ph);
    w.tr.unshift({x:w.x,y:w.y-w.h});if(w.tr.length>W.trail)w.tr.pop();
    const pd=W.parts[ty];if(!pd||!pd.rate)return;
    w.last+=dt*pd.rate;while(w.last>=1){w.last--;WL.parts.push(wispPart(pd,ty,w))}
  });
  for(const p of WL.parts){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.97}
  WL.parts=WL.parts.filter(p=>p.t<p.life).slice(-W.maxParts);
}
const wR=(a,b)=>a+Math.random()*(b-a);
function wispPart(pd,ty,w){let x=w.x+(Math.random()-0.5)*6,y=w.y-w.h+(Math.random()-0.5)*6;
  if(pd.k==='star'){x+=(Math.random()-0.5)*14;y+=(Math.random()-0.5)*14}
  return{x,y,vx:(Math.random()-0.5)*pd.vx,vy:wR(...pd.vy),t:0,life:wR(...pd.life),s:pd.s,c:pd.c||WISPS.col[ty][1],k:pd.k}}

// בהירות של כל אור: מוכן או בטעינה, ועוד הבזק כשהוא פועל
function wispBright(w,i){const o=S.orb,t=WL.t;let b;
  if(w.ty==='defense')b=(o.sh[i]||0)>S.t?0.28:0.9+0.1*Math.sin(t*3);   // מגן בטעינה: עמום
  else if(w.ty==='support'){const left=(o.hl[i]||0)-S.t;b=left<0.35&&left>0?1.3:0.85}   // רגע לפני ריפוי: מתבהר
  else if(w.ty==='attack')b=0.85+0.15*Math.sin(t*23+w.ph)*Math.sin(t*7.1);   // הבהוב של להבה
  else b=0.9;
  return b+WISPS.flash.k*(w.fl/WISPS.flash.t)}

function drawWisps(){
  const o=S.orb,W=WISPS;ctx.save();
  WL.list.forEach((w,i)=>{const [hot,col]=W.col[w.ty],b=wispBright(w,i),g=wispGlow(col),gh=wispGlow(col,hot),c=w.tr[0];
    // צל רך על הרצפה: מחבר את האור לעולם
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=0.18*Math.min(1,b);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(w.x,w.y,7,2.6,0,0,7);ctx.fill();
    // גוון רגיל מתחת: על דשא בהיר אור לבד נשטף, אז שכבה דקה בצבע הסוג נותנת לו צבע
    ctx.globalAlpha=0.35*Math.min(1,b);ctx.drawImage(g,c.x-11,c.y-11,22,22);
    ctx.globalCompositeOperation='lighter';
    wispBlit(g,w.x,w.y,22,0.22*b);   // אור על הקרקע
    for(let k=1;k<w.tr.length;k++){const p=w.tr[k],f=1-k/w.tr.length;wispBlit(g,p.x,p.y,W.halo*0.55*f+2,0.45*f*b)}   // שובל
    wispBlit(g,c.x,c.y,W.halo*(0.9+0.1*Math.min(b,1.5)),0.75*b);
    wispBlit(gh,c.x,c.y,W.core*(2.4+w.fl/W.flash.t),b);
    if(w.ty==='defense'&&(o.sh[i]||0)<=S.t){ctx.globalAlpha=0.25+0.1*Math.sin(WL.t*3);ctx.strokeStyle=col;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(P.x,P.y,22,9,0,0,7);ctx.stroke()}   // מגן מוכן: טבעת דקה ברגלי הדמות
  });
  for(const p of WL.parts){const f=1-p.t/p.life;
    if(p.k==='star'){const k=Math.sin(f*3.14),s=p.s*k;ctx.globalAlpha=k;ctx.strokeStyle=p.c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-s,p.y);ctx.lineTo(p.x+s,p.y);ctx.moveTo(p.x,p.y-s);ctx.lineTo(p.x,p.y+s);ctx.stroke();continue}
    wispBlit(wispGlow(p.c),p.x,p.y,p.s*2.6*(p.k==='ember'?f:1),0.9*f)}
  ctx.restore();
  W.stat.draws++;W.stat.lights=WL.list.length;W.stat.parts=WL.parts.length;
}

/* ---- רואים מה כל אור עושה (ניר, 1.11: "מפריע לי שלא ברור איך האורות שמסתובבים סביבי תורמים"). רק בעולם ----
   על המטרה: אש משאירה שובל גחלים עד האויב ו-🔥 מעליו, כפור טבעת כחולה על האויב, אבן "קופצת" עם פיצוץ קטן כשהיא עוצרת ירייה או בולעת מכה,
   עלה שולח קו ירוק לדמות ו"+N ריפוי" בפיד, ותלתן מצייר כוכב על מכה קריטית.
   שורת אייקונים ליד פינת "מי אני": אור לכל חפץ, עם טבעת טעינה (מגן, ריפוי), שנדלק לרגע כשהוא פועל.
   בפעם הראשונה שכל אור מופיע: שורה אחת בפיד שמסבירה מה הוא עושה (SAVE.wispTip).
   הפגיעות נקראות מ-e.oh (הזמן שבו כל חפץ יכול לפגוע שוב באותו אויב, orbit.js), בלי לשנות את orbit.js */
const WACT={
  life:{fire:0.45,icon:0.7,ring:0.55,pop:0.4,heal:0.6,star:0.5},   // כמה זמן כל סימן נשאר
  row:{size:22,gap:6,ring:2.5,flash:0.5},                          // שורת האייקונים: גודל, רווח, עובי טבעת הטעינה, וכמה זמן היא מוארת אחרי פעולה
  max:40,
  stat:{fire:0,ring:0,pop:0,heal:0,star:0,tips:0}                   // לבדיקה: כמה סימנים מכל סוג
};
const WA={fx:[],lit:{}};
const wActOn=()=>!!(S&&S.wd&&!S.room);
function wAct(k,o){if(WA.fx.length>=WACT.max)WA.fx.shift();o.k=k;o.t=0;o.life=WACT.life[k];WA.fx.push(o);if(k in WACT.stat)WACT.stat[k]++}
function wispsAct(dt,was){
  const o=S.orb;for(const f of WA.fx)f.t+=dt;WA.fx=WA.fx.filter(f=>f.t<f.life);
  for(const k in WA.lit)WA.lit[k]=Math.max(0,WA.lit[k]-dt);
  if(!wActOn())return;
  // פגיעה של אש או קרח: e.oh[i] התחלף
  for(const e of enemies){if(e.dead||!e.oh){e._wo=null;continue}const prev=e._wo||[];
    for(let i=0;i<e.oh.length;i++){if(!e.oh[i]||e.oh[i]===prev[i])continue;const ty=o.types[i],w=WL.list[i];if(!w)continue;
      if(ty==='attack'){wAct('fire',{x1:w.x,y1:w.y-w.h,e});wAct('icon',{e,s:'🔥'})}
      else if(ty==='control')wAct('ring',{e});
      WA.lit[ty]=WACT.row.flash}
    e._wo=e.oh.slice()}
  // אבן: ירייה שנעצרה או מכה שנבלעה. עלה: ריפוי
  const di=o.types.indexOf('defense'),dw=WL.list[di];
  if(was&&dw&&o.blocked+o.shields>was.def){wAct('pop',{x:dw.x,y:dw.y-dw.h,big:o.shields>was.sh});WA.lit.defense=WACT.row.flash}
  const si=o.types.indexOf('support'),sw=WL.list[si];
  if(was&&sw&&o.healed>was.heal){const h=Math.round(o.healed-was.heal);wAct('heal',{x1:sw.x,y1:sw.y-sw.h});WA.lit.support=WACT.row.flash;
    if(h>0&&typeof feedAdd==='function'&&feedOn())feedAdd(GEAR.orbit.support,T('wisp.heal'),WISPS.col.support[1],'wheal',h)}
  // הסבר בפעם הראשונה
  const seen=SAVE.wispTip||(SAVE.wispTip={});
  for(const ty of o.types)if(!seen[ty]&&typeof feedAdd==='function'&&feedOn()){seen[ty]=1;saveNow();WACT.stat.tips++;
    feedAdd(GEAR.orbit[ty],T('wisp.tip.'+ty,wTipN(ty)),WISPS.col[ty][1],'wtip:'+ty,0,true)}
}
const wTipN=ty=>{const D=ORBIT.types[ty];return D.shield?D.shield.every:D.heal?D.heal.every:''};
// מכה קריטית כשהתלתן לבוש: כוכב על האויב. עוטפים את juiceHit (juice.js) מבחוץ
(()=>{if(typeof juiceHit!=='function')return;const old=juiceHit;
  juiceHit=function(e,d,m,crit){const r=old.apply(this,arguments);
    if(crit&&wActOn()&&S.orb&&S.orb.types.includes('luck')){wAct('star',{e});WA.lit.luck=WACT.row.flash}return r}})();

/* ---- ציד (בעולם בלבד): אור האש והכפור יוצאים לאויב הקרוב ופוגעים בו, וחוזרים (מדידה, 1.11: בלי זה אש פוגעת פעם ב-30 שניות, כי האויבים מתים לפני שהם מגיעים לטבעת).
   ORBIT ו-orbit.js לא משתנים: עוטפים את orbitUpdate מבחוץ, והנזק הוא אותו נזק של החפץ (ORBIT.types[..].dmg ו-dt) */
const WHUNT={types:['attack','control'], every:1.5, range:240, speed:520, back:420, hit:14};   // כל כמה שניות, מאיזה מרחק מהדמות, מהירות יציאה וחזרה, ומאיזה מרחק נחשב פגיעה.
// נמדד (רמה 15, 60 שניות): בלי ציד אש פוגעת פעם ב-30 שניות וכפור פעם ב-15. עם ציד: כל אור פועל פעם ב-1.6 עד 3 שניות
const WH=[];   // לכל אור: {cd, ph:'out'|'back'|null, e, x, y}
function wispsHunt(dt){
  const o=S.orb;if(!wActOn()||!o||!o.types.length){WH.length=0;return}
  o.types.forEach((ty,i)=>{const h=WH[i]||(WH[i]={cd:WHUNT.every*(0.5+i*0.2),ph:null});
    if(!WHUNT.types.includes(ty)){h.ph=null;return}
    const home=o.pos[i]||{x:P.x,y:P.y};
    if(!h.ph){h.cd-=dt;h.x=home.x;h.y=home.y;if(h.cd>0)return;
      let best=null,bd=WHUNT.range;for(const e of enemies){if(e.dead||e.node||e.creature)continue;   // יצורים שלווים לא נצודים
        const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;best=e}}
      if(!best){h.cd=0.3;return}h.ph='out';h.e=best}
    if(h.ph==='out'){const e=h.e;if(!e||e.dead){h.ph='back';return}
      const dx=e.x-h.x,dy=e.y-h.y,d=Math.hypot(dx,dy)||1,st=WHUNT.speed*dt;
      if(d<=WHUNT.hit+e.r*0.5||d<=st){const D=ORBIT.types[ty];damage(e,skBase()*D.dmg,'orbit',Math.atan2(dy,dx),D.dt);o.hits++;
        (e.oh||(e.oh=[]))[i]=S.t+D.every;WACT.stat.hunt=(WACT.stat.hunt||0)+1;h.ph='back'}
      else{h.x+=dx/d*st;h.y+=dy/d*st}}
    else if(h.ph==='back'){const dx=home.x-h.x,dy=home.y-h.y,d=Math.hypot(dx,dy)||1,st=WHUNT.back*dt;
      if(d<=st){h.ph=null;h.cd=WHUNT.every}else{h.x+=dx/d*st;h.y+=dy/d*st}}
  });
}
(()=>{const old=orbitUpdate;orbitUpdate=function(dt){old.apply(this,arguments);wispsHunt(dt)}})();

function drawWispAct(){
  if(!WA.fx.length)return;ctx.save();
  for(const f of WA.fx){const k=f.t/f.life,a=1-k;
    if(f.e&&f.e.dead&&f.k!=='fire'){continue}
    if(f.k==='fire'){const x2=f.e.x,y2=f.e.y-f.e.r*0.6,g=wispGlow(WISPS.col.attack[1]);ctx.globalCompositeOperation='lighter';   // שובל גחלים מהאור לאויב
      for(let j=0;j<=6;j++){const u=j/6;if(u>k*1.6+0.2)break;wispBlit(g,f.x1+(x2-f.x1)*u,f.y1+(y2-f.y1)*u-Math.sin(u*3.14)*10,5*(1-u*0.4),0.8*a)}}
    else if(f.k==='icon'){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a;ctx.textAlign='center';ctx.direction='ltr';ctx.font=Math.round(11/ZOOM)+'px system-ui';ctx.fillText(f.s,f.e.x,f.e.y-f.e.r-14-k*10)}
    else if(f.k==='ring'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.8*a;ctx.strokeStyle=WISPS.col.control[1];ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(f.e.x,f.e.y,f.e.r*(1+k*0.5)+4,(f.e.r*(1+k*0.5)+4)*0.45,0,0,7);ctx.stroke()}
    else if(f.k==='pop'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.strokeStyle=WISPS.col.defense[1];ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,6+k*(f.big?30:16),0,7);ctx.stroke();
      if(f.big){ctx.beginPath();ctx.ellipse(P.x,P.y,24+k*12,10+k*5,0,0,7);ctx.stroke()}}
    else if(f.k==='heal'){const g=wispGlow(WISPS.col.support[1]);ctx.globalCompositeOperation='lighter';   // קו ירוק מהעלה לדמות
      for(let j=0;j<=7;j++){const u=j/7;if(u>k*1.6+0.15)break;wispBlit(g,f.x1+(P.x-f.x1)*u,f.y1+(P.y-24-f.y1)*u,5,0.75*a)}}
    else if(f.k==='star'){const x=f.e.x,y=f.e.y-f.e.r-8,s=(5+k*9)*Math.sin(Math.min(1,k*2)*1.57);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.strokeStyle=WISPS.col.luck[1];ctx.lineWidth=2;
      ctx.beginPath();for(let q=0;q<4;q++){const an=q*1.571+0.785*0;ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(an)*s,y+Math.sin(an)*s)}ctx.stroke()}}
  ctx.restore();
}
// שורת אייקונים ליד פינת "מי אני" (minimap.js): בפיקסלים של המסך
function drawWispRow(){
  const o=S.orb,who=document.getElementById('who');if(!who||who.hidden||!o||!o.types.length)return;const q=who.getBoundingClientRect();if(!q.width)return;
  const R=WACT.row,rtl=DIR==='rtl',n=o.types.length,y=q.top+q.height/2;let x=rtl?q.left-R.gap-R.size/2:q.right+R.gap+R.size/2;
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='ltr';
  o.types.forEach((ty,i)=>{const lit=(WA.lit[ty]||0)/R.flash,col=WISPS.col[ty][1],r=R.size/2;
    ctx.globalAlpha=0.55+0.45*lit;ctx.fillStyle='rgba(5,7,13,0.6)';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
    if(lit>0){ctx.globalCompositeOperation='lighter';wispBlit(wispGlow(col),x,y,r*1.8,0.6*lit);ctx.globalCompositeOperation='source-over'}
    // טבעת טעינה: מגן (אבן) וריפוי (עלה). אש, קרח ותלתן תמיד מוכנים
    const D=ORBIT.types[ty];let f=1;if(D.shield)f=1-Math.max(0,(o.sh[i]||0)-S.t)/D.shield.every;else if(D.heal)f=1-Math.max(0,(o.hl[i]||0)-S.t)/D.heal.every;
    ctx.globalAlpha=1;ctx.strokeStyle=col;ctx.lineWidth=R.ring;ctx.beginPath();ctx.arc(x,y,r-1,-1.571,-1.571+6.283*Math.max(0,Math.min(1,f)));ctx.stroke();
    ctx.globalAlpha=f>=1?1:0.6;ctx.font=Math.round(R.size*0.55)+'px system-ui';ctx.fillText(GEAR.orbit[ty],x,y+1);
    x+=(rtl?-1:1)*(R.size+R.gap)});
  ctx.restore();ctx.direction=DIR;
}

/* ---- חיבור: עוטפים את drawOrbits (orbit.js) מבחוץ. render.js קורא לו בשם, אז העטיפה נתפסת ---- */
(()=>{const old=drawOrbits;
  drawOrbits=function(){
    const o=S.orb;if(!wispsOn())return old();
    const s=performance.now(),dt=WL.last?Math.min(0.05,(s-WL.last)/1000):0;WL.last=s;
    if(!o||!o.types.length||!skHere()){WL.list.length=0;WL.parts.length=0;WL.seen=null;WL.was=null;WA.fx.length=0;return}
    const was={def:o.blocked+o.shields,sh:o.shields,heal:o.healed};
    wispsUpdate(dt);wispsAct(dt,WL.was);WL.was=was;drawWisps();drawWispAct();if(wActOn())drawWispRow()};
})();
