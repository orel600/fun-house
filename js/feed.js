/* פיד הודעות (ניר, 1.11.2026: "בצד". התוכנית: docs/plan-fx.md משימה 4, docs/plan-hud.md פרק 6).
   במקום טקסט על הדמות ובאנר באמצע המסך: שורות קטנות בצד ימין, מעל הסקילים וכפתורי ההקשר, עד 3 יחד, כל אחת כ-2.5 שניות.
   אותו דבר שחוזר מתאחד באותה שורה (‎+3 עץ ← ‎+5 עץ), ולא נערם.
   מה נכנס: שלל שנאסף (dropTake ב-drops.js), "ציוד!" (loot.js) בצבע הדרגה, "חדש בספר" (book.js), "הריגה ראשונה היום" (loot.js).
   בעולם ובכפר. בזירה (של אוראל) הכל כמו קודם: feedOn() מחזיר false, ומי שקרא מצייר כמו פעם.
   אוראל, להדליק בזירה: FEED.where.arena=true
   שורות HTML בעמודה שנמדדת מול המסך (7.11.2026), ומתעדכנת מ-render (render.js), שנעטף מבחוץ */
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
function feedTitle(txt,col){FTITLE={txt,col:col||C.gold,t:feedNow()};FEED.stat.titles++;if(typeof msgBig==='function'&&msgOn()){FTITLE.lane=1;msgBig(txt,col||C.gold)}}   // בעולם ובכפר: רגע גדול בעמודת ההודעות (msglane.js), לא כותרת בקנבס
function drawFeedTitle(){
  const T_=FEED.title,f=FTITLE;if(!f||f.lane)return;const age=feedNow()-f.t;if(age>T_.life){FTITLE=null;return}
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
  FL.push(o);while(FL.length>FEED.max){const x=FL.shift();if(x.el)x.el.remove()}st.added++;return o;
}
// שלל שנאסף: מתאחד לפי המשאב
function feedRes(r,n){feedAdd(resIcon(r),resName(r),(dropTier(r)||{}).col||C.gold,'r:'+r,n)}

// ציוד: "ציוד! חרב עץ" בצבע הדרגה. כשנופל וכשנאסף זו אותה שורה
function feedGear(id){feedAdd(gIcon(id),T('loot.gear')+' '+gName(id)+powTag(id),dropTier(id).col,'g:'+id,0,true)}

// הגבול התחתון: מעל הסקילים וכפתורי ההקשר שבחצי הימני של המסך
// כל כפתור באשכול הימני התחתון נמדד לבד (getBoundingClientRect): כל כפתור בקשת הסקילים, אולטימייט, סקיל חתימה, כישוף, וכפתורי ההקשר.
// x0: הקצה השמאלי של העמודה. כפתור שמימינו נחשב (ניר, סרטון 7.11: השורות ירדו מתחת לכפתור השלישי בקשת, כי נמדד רק המיכל)
const FEED_HUD='#skills>*,#skills,#ult,#sig,#spell,#divine,#swap,#nav>*';
function feedBottom(x0){
  let b=innerHeight*FEED.low;const xl=x0==null?innerWidth*0.6:x0;
  for(const k of document.querySelectorAll(FEED_HUD)){if(k.hidden||k.closest('[hidden]'))continue;const q=k.getBoundingClientRect();
    if(!q.width||!q.height||q.right<=xl||getComputedStyle(k).display==='none'||getComputedStyle(k).visibility==='hidden')continue;
    if(q.top<b+40)b=Math.min(b,q.top-10)}
  return Math.max(innerHeight*FEED.top+40,b);
}
/* העמודה (7.11.2026, הסרטון של ניר: שורות מתחת לסקילים ונחתכות בקצה). שורות HTML ולא ציור בקנבס, כדי שאפשר יהיה למדוד אותן.
   המקום נמדד מול כל מה שעל המסך (msgBlocks ב-msglane.js): הרצועה בצד ימין, החלק הפנוי הכי נמוך שעדיין מעל הסקילים.
   השוליים הבטוחים (מסך מעוגל, מצלמה) נכנסים לחשבון, והשורה מתקצרת ב-… ולא נחתכת. אין מקום בכלל: השורה עוברת לעמודת ההודעות למעלה */
function feedColEl(){let el=document.getElementById('feedCol');if(!el){el=document.createElement('div');el.id='feedCol';el.className='feedcol';el.setAttribute('aria-live','polite');document.body.appendChild(el)}return el}
function feedSafe(){const p=document.createElement('div');p.style.cssText='position:fixed;visibility:hidden;pointer-events:none;top:0;left:0;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';document.body.appendChild(p);
  const cs=getComputedStyle(p),o={l:parseFloat(cs.paddingLeft)||0,r:parseFloat(cs.paddingRight)||0};p.remove();return o}
// המקום הפנוי בצד ימין: {x0,x1,y0,y1}, או null. החלק הפנוי הכי נמוך בין ראש המסך לסקילים (feedBottom)
let FSAFE=null;addEventListener('resize',()=>{FSAFE=null});
function feedSpot(lh){
  const vw=innerWidth,vh=innerHeight,F=FEED,sf=FSAFE||(FSAFE=feedSafe()),x1=vw-Math.max(F.edge,sf.r+8),x0=x1-Math.min(300,vw*0.36),pad=6;
  const bl=(typeof msgBlocks==='function'?msgBlocks():[]).filter(r=>r.right>x0&&r.left<x1).sort((a,b)=>a.top-b.top);
  const lo=vh*0.12,hi=feedBottom(x0);let y=lo;const gaps=[];
  for(const r of bl){if(r.bottom<=y)continue;if(r.top>=hi)break;if(r.top-pad>y)gaps.push([y,r.top-pad]);y=Math.max(y,r.bottom+pad)}
  if(y<hi)gaps.push([y,hi]);
  const ok=gaps.filter(g=>g[1]-g[0]>=lh);if(!ok.length)return null;
  const g=ok[ok.length-1];return {x0,x1,y0:g[0],y1:g[1]};
}
function drawFeed(){
  const now=feedNow(),F=FEED;
  for(let i=FL.length-1;i>=0;i--)if(now-FL[i].t>F.life){if(FL[i].el)FL[i].el.remove();FL.splice(i,1)}
  const col=feedColEl();
  if(!FL.length||!feedOn()){if(col.childElementCount)col.textContent='';for(const f of FL)f.el=null;return}
  const fs=Math.round(Math.max(F.size[0],Math.min(F.size[2],innerHeight*F.size[1]))),lh=fs+F.padY*2+4;
  // המקום נמדד פעם ב-0.25 שניות ובכל שורה חדשה, לא בכל פריים
  if(!F._spot||now-F._spotT>0.25||F._n!==FL.length){F._spot=feedSpot(lh);F._spotT=now;F._n=FL.length}
  const sp=F._spot;
  if(!sp){for(const f of FL){if(!f.lane&&typeof msgSay==='function'){f.lane=1;msgSay((f.icon?f.icon+' ':'')+(f.n?'+'+f.n+' ':'')+f.txt,f.col)}}col.style.display='none';return}
  col.style.display='';const rows=Math.max(1,Math.min(F.max,Math.floor((sp.y1-sp.y0+F.gap)/(lh+F.gap))));
  const cs=col.style;cs.right=Math.round(innerWidth-sp.x1)+'px';cs.width=Math.round(sp.x1-sp.x0)+'px';cs.top=Math.round(sp.y0)+'px';cs.height=Math.round(sp.y1-sp.y0)+'px';cs.fontSize=fs+'px';cs.gap=F.gap+'px';
  const show=FL.slice(-rows);for(const c of [...col.children])if(!FL.some(f=>f.el===c))c.remove();   // שורות שכבר לא בפיד (FL.length=0 מבחוץ)
  for(const f of FL)if(!show.includes(f)&&f.el){f.el.remove();f.el=null}
  for(const f of show){
    if(!f.el){f.el=document.createElement('div');f.el.className='frow';f.el.dir=DIR;col.appendChild(f.el);f.html=null}
    const html=(f.icon?'<i>'+f.icon+'</i>':'')+(f.n?'<b>+'+f.n+'</b>':'')+'<span>'+String(f.txt).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c])+'</span>';
    if(f.html!==html){f.el.innerHTML=html;f.html=html}
    f.el.style.setProperty('--fc',f.col);f.el.classList.toggle('tint',!!f.tint);
    const age=now-f.t,a=Math.max(0,Math.min(1,(now-f.pop)/F.fadeIn,(F.life-age)/F.fadeOut));f.el.style.opacity=a.toFixed(2);
    f.el.classList.toggle('pop',!fxLess()&&now-f.pop<0.15)}
  F.stat.drawn++;F.stat.most=Math.max(F.stat.most,show.length);
}
(function(){const st=document.createElement('style');st.textContent=
  '.feedcol{position:fixed;z-index:4;pointer-events:none;direction:ltr;display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end;overflow:hidden}'+
  '.feedcol .frow{max-width:100%;box-sizing:border-box;display:flex;align-items:center;gap:.35em;white-space:nowrap;overflow:hidden;flex:none;padding:'+FEED.padY+'px '+FEED.padX+'px;border-radius:999px;'+
    'background:'+FEED.bg+';border-inline-end:'+FEED.bar+'px solid var(--fc);color:'+FEED.text+';font:700 1em/1.2 Heebo,system-ui,sans-serif;text-shadow:0 1px 2px #000a;transition:transform .15s}'+
  '.feedcol .frow i{font-style:normal;flex:none}.feedcol .frow b{color:var(--fc);flex:none}.feedcol .frow span{overflow:hidden;text-overflow:ellipsis;min-width:0}.feedcol .frow.tint span{color:var(--fc)}.feedcol .frow.pop{transform:scale(1.06)}';
  document.head.appendChild(st)})();

// חיבור: אחרי כל ציור של המסך. render.js קורא ל-render בשם, אז העטיפה נתפסת
(()=>{const old=render;render=function(){old.apply(this,arguments);drawFeed();if(feedOn())drawFeedTitle()}})();
