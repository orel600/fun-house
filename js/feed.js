/* פיד הודעות (ניר, 1.11.2026: "בצד". התוכנית: docs/plan-fx.md משימה 4, docs/plan-hud.md פרק 6).
   במקום טקסט על הדמות ובאנר באמצע המסך: שורות קטנות בצד ימין, מעל הסקילים וכפתורי ההקשר, עד 3 יחד, כל אחת כ-2.5 שניות.
   אותו דבר שחוזר מתאחד באותה שורה (‎+3 עץ ← ‎+5 עץ), ולא נערם.
   מה נכנס: שלל שנאסף (dropTake ב-drops.js), "ציוד!" (loot.js) בצבע הדרגה, "חדש בספר" (book.js), "הריגה ראשונה היום" (loot.js).
   בעולם ובכפר. בזירה (של אוראל) הכל כמו קודם: feedOn() מחזיר false, ומי שקרא מצייר כמו פעם.
   אוראל, להדליק בזירה: FEED.where.arena=true
   הציור בקנבס, בפיקסלים של המסך (לא מתכווץ עם המצלמה), ועוטף את render (render.js) מבחוץ */
const FEED={
  where:{world:true,village:true,arena:false},
  max:3, life:2.5, fadeIn:0.12, fadeOut:0.4,   // כמה שורות יחד, כמה שניות כל אחת, וכמה מהר היא נכנסת ויוצאת
  size:[11,0.026,14],                          // גודל הטקסט: לפחות 11, 2.6% מגובה המסך, עד 14 (כמו --t1 ב-style.css)
  gap:4, padX:8, padY:4, bar:3,                // רווח בין שורות, ריפוד, ופס הצבע בקצה
  edge:16, top:0.24, low:0.64,                 // מרחק מהקצה, וגבולות הגובה: לא מתחת לסקילים וכפתורי ההקשר, ולא עד הפינה העליונה
  bg:'rgba(5,7,13,0.58)', text:'#ECE7DC',
  stat:{added:0,merged:0,drawn:0,most:0,titles:0},   // לבדיקה: כמה נוספו, כמה התאחדו, כמה פעמים צויר, והכי הרבה שורות יחד, וכמה כותרות
  // כותרת אזור (world.js): פעם אחת בכניסה הראשונה לכל אזור, למעלה במרכז, בגודל --t2, ל-2 שניות (docs/plan-hud.md פרק 6). במקום הבאנר הגדול באמצע
  title:{life:2, size:[13,0.031,16], y:0.2}
};
let FTITLE=null;
function feedTitle(txt,col){FTITLE={txt,col:col||C.gold,t:feedNow()};FEED.stat.titles++}
function drawFeedTitle(){
  const T_=FEED.title,f=FTITLE;if(!f)return;const age=feedNow()-f.t;if(age>T_.life){FTITLE=null;return}
  const fs=Math.round(Math.max(T_.size[0],Math.min(T_.size[2],innerHeight*T_.size[1]))),a=Math.min(1,age/0.2,(T_.life-age)/0.4);
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=a;ctx.direction=DIR;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='800 '+fs+'px Heebo, system-ui, sans-serif';const x=innerWidth/2,y=Math.max(64,innerHeight*T_.y),w=ctx.measureText(f.txt).width+fs*1.6;
  ctx.fillStyle=FEED.bg;ctx.beginPath();ctx.roundRect?ctx.roundRect(x-w/2,y-fs,w,fs*2,fs):ctx.rect(x-w/2,y-fs,w,fs*2);ctx.fill();
  ctx.fillStyle='#000a';ctx.fillText(f.txt,x+1,y+1);ctx.fillStyle=f.col;ctx.fillText(f.txt,x,y);
  ctx.restore();ctx.direction=DIR}
const FL=[];   // השורות עכשיו, מהישנה לחדשה
const feedNow=()=>performance.now()/1000;
function feedOn(){const W=FEED.where;return !!S&&(S.wd?W.world:S.vil?W.village:W.arena)}

// icon: אייקון בתחילת השורה. txt: הטקסט. col: צבע הפס (ושל הטקסט כש-tint). key: אותו key מתאחד. n: כמות שמצטרפת ("+5")
function feedAdd(icon,txt,col,key,n,tint){
  const st=FEED.stat,now=feedNow(),f=key&&FL.find(f=>f.key===key);
  if(f){if(n)f.n=(f.n||0)+n;f.txt=txt;f.t=now;f.pop=now;st.merged++;return f}
  const o={icon:icon||'',txt,col:col||C.gold,key,n:n||0,t:now,pop:now,tint};
  FL.push(o);while(FL.length>FEED.max)FL.shift();st.added++;return o;
}
// שלל שנאסף: מתאחד לפי המשאב
function feedRes(r,n){feedAdd(resIcon(r),resName(r),(dropTier(r)||{}).col||C.gold,'r:'+r,n)}

// ציוד: "ציוד! חרב עץ" בצבע הדרגה. כשנופל וכשנאסף זו אותה שורה
function feedGear(id){feedAdd(gIcon(id),T('loot.gear')+' '+gName(id),dropTier(id).col,'g:'+id,0,true)}

// הגבול התחתון: מעל הסקילים וכפתורי ההקשר שבחצי הימני של המסך
function feedBottom(){
  let b=innerHeight*FEED.low;
  for(const id of ['skills','nav']){const el=document.getElementById(id);if(!el||el.hidden)continue;
    for(const k of (id==='nav'?el.children:[el])){if(k.hidden)continue;const q=k.getBoundingClientRect();if(q.width&&q.height&&q.right>innerWidth*0.6&&q.top<b+40)b=Math.min(b,q.top-10)}}
  return Math.max(innerHeight*FEED.top+40,b);
}
function drawFeed(){
  const now=feedNow(),F=FEED;
  for(let i=FL.length-1;i>=0;i--)if(now-FL[i].t>F.life)FL.splice(i,1);
  if(!FL.length||!feedOn())return;
  const fs=Math.round(Math.max(F.size[0],Math.min(F.size[2],innerHeight*F.size[1]))),lh=fs+F.padY*2,rtl=DIR==='rtl';
  ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.textBaseline='middle';ctx.globalCompositeOperation='source-over';
  const font='700 '+fs+'px Heebo, system-ui, sans-serif',x1=innerWidth-F.edge;
  let y=feedBottom()-lh;
  for(let i=FL.length-1;i>=0;i--){const f=FL[i],age=now-f.t,a=Math.min(1,(now-f.pop)/F.fadeIn,(F.life-age)/F.fadeOut);if(a<=0){y-=lh+F.gap;continue}
    // החלקים לפי סדר הקריאה: אייקון, כמות, טקסט. בעברית מימין לשמאל, באנגלית משמאל לימין, וכל השורה צמודה לקצה הימני
    ctx.font=font;const parts=[];if(f.icon)parts.push({s:f.icon,d:'ltr'});if(f.n)parts.push({s:'+'+f.n,d:'ltr',c:f.col});parts.push({s:f.txt,d:DIR,c:f.tint?f.col:null});
    for(const p of parts){ctx.direction=p.d;p.w=ctx.measureText(p.s).width}
    const sp=fs*0.35,w=parts.reduce((s,p)=>s+p.w,0)+sp*(parts.length-1)+F.padX*2+F.bar,x0=x1-w,pop=fxLess()?1:1+0.12*Math.max(0,1-(now-f.pop)/0.15);   // בפחות אפקטים (juice.js) בלי קפיצה
    ctx.globalAlpha=a;ctx.fillStyle=F.bg;ctx.beginPath();ctx.roundRect?ctx.roundRect(x0,y,w,lh,lh/2.6):ctx.rect(x0,y,w,lh);ctx.fill();
    ctx.fillStyle=f.col;ctx.fillRect(x1-F.bar,y+2,F.bar,lh-4);
    // מניחים מהקצה פנימה: בעברית החלק הראשון ליד הקצה, באנגלית האחרון
    const seq=rtl?parts:parts.slice().reverse();let cx=x1-F.bar-F.padX;
    for(const p of seq){ctx.direction=p.d;ctx.textAlign='left';const px=cx-p.w,py=y+lh/2;
      if(p.c&&pop>1){ctx.save();ctx.translate(px+p.w/2,py);ctx.scale(pop,pop);ctx.translate(-px-p.w/2,-py)}
      ctx.fillStyle='#000a';ctx.fillText(p.s,px+1,py+1);ctx.fillStyle=p.c||F.text;ctx.fillText(p.s,px,py);
      if(p.c&&pop>1)ctx.restore();cx=px-sp}
    y-=lh+F.gap}
  ctx.restore();ctx.direction=DIR;
  F.stat.drawn++;F.stat.most=Math.max(F.stat.most,FL.length);
}

// חיבור: אחרי כל ציור של המסך. render.js קורא ל-render בשם, אז העטיפה נתפסת
(()=>{const old=render;render=function(){old.apply(this,arguments);drawFeed();if(feedOn())drawFeedTitle()}})();
