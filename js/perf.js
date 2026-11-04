/* מד מהירות בטלפון. שני מצבים:
   - ⚙️ הגדרות ← "הצג FPS" (נשמר ב-zm-fps), או ?fps=1 בכתובת: שורה קטנה בתחתית, FPS ממוצע והפריים הכי איטי (ms) ב-2 השניות האחרונות.
     ניר, 4.11.2026: כדי לדעת מה באמת קורה ב-OnePlus 15 (היעד: 120 FPS, כלומר 8.3ms לפריים).
   - ?fps (בלי =1): לפיתוח, גם כמה זמן כל חלק לוקח בפריים.
     L: החישובים (זירה, עולם או כפר). 3D: השכבה בתלת-ממד. 2D: הציור בקנבס בלי התלת-ממד. U: הממשק שמעל המשחק (hud).
     S: הצלילים (חלק מ-L). W: שמירה בטלפון (חלק מ-L), ו-w כמה שמירות בשנייה. c: ציורים בתלת-ממד. e: אויבים.
   frame/worst: הזמן בין פריים לפריים. אם הוא הרבה יותר גדול מסכום החלקים, הזמן הולך על הדפדפן עצמו (ציור המסך).
   כבוי: כמעט לא עולה כלום (בדיקה אחת בכל קריאה). הוא עוטף פונקציות גלובליות, ולכן נטען אחרון */
const FPSM={win:2000,key:'zm-fps',dev:/[?&]fps(?!=1)\b/.test(location.search),url:/[?&]fps=1\b/.test(location.search),on:false};
(()=>{
  try{FPSM.on=FPSM.dev||FPSM.url||localStorage.getItem(FPSM.key)==='1'}catch(e){FPSM.on=FPSM.dev||FPSM.url}
  const t={},wrap=n=>{const f=window[n];if(typeof f!=='function')return;
    window[n]=function(...a){if(!FPSM.dev)return f.apply(this,a);const s=performance.now();try{return f.apply(this,a)}finally{t[n]=(t[n]||0)+performance.now()-s}}};
  if(FPSM.dev){['update','worldUpdate','villageUpdate','render','render3d','hud','sfx'].forEach(wrap)}
  let saves=0;if(FPSM.dev){const sv=window.saveNow;window.saveNow=function(...a){saves++;return sv.apply(this,a)};wrap('saveNow')}
  const box=document.createElement('div');box.id='fpsMeter';box.hidden=!FPSM.on;
  box.style.cssText='position:fixed;z-index:99;bottom:2px;left:50%;transform:translateX(-50%);padding:1px 5px;border-radius:4px;background:#0009;color:#7f7;font:10px monospace;direction:ltr;white-space:pre;pointer-events:none';
  document.body.appendChild(box);
  let n=0,gaps=0,worst=0,last=0,since=0;
  const raf=window.requestAnimationFrame;
  window.requestAnimationFrame=cb=>raf(now=>{
    if(FPSM.on){
      if(last&&now-last<1000){const g=now-last;gaps+=g;worst=Math.max(worst,g);n++}last=now;   // יותר משנייה: הטאב היה ברקע, לא נחשב
      if(!since)since=now;
      if(now-since>=FPSM.win&&n){
        const fps=(1000*n/gaps).toFixed(0);
        if(FPSM.dev){const k=v=>((t[v]||0)/n).toFixed(1),logic=((t.update||0)+(t.worldUpdate||0)+(t.villageUpdate||0))/n;
          box.textContent=fps+'fps '+(gaps/n).toFixed(0)+'/'+worst.toFixed(0)+'ms L'+logic.toFixed(1)+' 3D'+k('render3d')
            +' 2D'+((t.render||0)/n-(t.render3d||0)/n).toFixed(1)+' U'+k('hud')+' S'+k('sfx')+' W'+k('saveNow')+' w'+saves+(R3D.on?' c'+(R3D.stats.calls||0):' 2d')+' e'+(enemies?enemies.length:0);
          for(const v in t)t[v]=0;saves=0}
        else box.textContent=fps+' fps · '+worst.toFixed(1)+'ms';
        n=0;gaps=0;worst=0;since=now}
    }
    cb(now);
  });
  function show(){box.hidden=!FPSM.on;for(const b of document.querySelectorAll('[data-fps]'))b.setAttribute('aria-pressed',String((b.dataset.fps==='1')===FPSM.on))}
  FPSM.set=on=>{FPSM.on=on;try{localStorage.setItem(FPSM.key,on?'1':'0')}catch(e){}n=0;gaps=0;worst=0;last=0;since=0;box.textContent='…';show()};
  for(const b of document.querySelectorAll('[data-fps]'))b.onclick=()=>{FPSM.set(b.dataset.fps==='1');if(typeof sfx==='function')sfx('ui')};
  show();
})();
