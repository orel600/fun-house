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
    const tx=P.x+Math.cos(a)*R,ty_=P.y+Math.sin(a)*R*0.85,k=1-Math.exp(-W.lag*dt);
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

/* ---- חיבור: עוטפים את drawOrbits (orbit.js) מבחוץ. render.js קורא לו בשם, אז העטיפה נתפסת ---- */
(()=>{const old=drawOrbits;
  drawOrbits=function(){
    const o=S.orb;if(!wispsOn())return old();
    const s=performance.now(),dt=WL.last?Math.min(0.05,(s-WL.last)/1000):0;WL.last=s;
    if(!o||!o.types.length||!skHere()){WL.list.length=0;WL.parts.length=0;WL.seen=null;return}
    wispsUpdate(dt);drawWisps()};
})();
