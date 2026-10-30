/* מד מהירות לבדיקה בטלפון: מוסיפים ?fps לכתובת, ובפינה מופיע כמה פריימים בשנייה וכמה זמן כל חלק לוקח בפריים.
   logic: החישובים (זירה, עולם או כפר). 3d: השכבה בתלת-ממד. 2d: הציור בקנבס בלי התלת-ממד. ui: הממשק שמעל המשחק (hud).
   frame: כמה זמן עבר בין פריים לפריים. אם הוא הרבה יותר גדול מסכום החלקים, הזמן הולך על הדפדפן עצמו (ציור המסך).
   כלי פיתוח בלבד: בלי ?fps הקובץ לא עושה כלום. הוא עוטף פונקציות גלובליות, ולכן נטען אחרון */
(()=>{
  if(!/[?&]fps\b/.test(location.search))return;
  const t={},wrap=n=>{const f=window[n];if(typeof f!=='function')return;
    window[n]=function(...a){const s=performance.now();try{return f.apply(this,a)}finally{t[n]=(t[n]||0)+performance.now()-s}}};
  ['update','worldUpdate','villageUpdate','render','render3d','hud'].forEach(wrap);
  const box=document.createElement('div');
  box.style.cssText='position:fixed;z-index:99;bottom:2px;left:50%;transform:translateX(-50%);padding:1px 4px;background:#0009;color:#7f7;font:9px monospace;direction:ltr;white-space:pre;pointer-events:none';
  document.body.appendChild(box);
  let n=0,gaps=0,worst=0,last=0,since=performance.now();
  const raf=window.requestAnimationFrame;
  window.requestAnimationFrame=cb=>raf(now=>{
    if(last){const g=now-last;gaps+=g;worst=Math.max(worst,g);n++}last=now;
    if(now-since>1000&&n){
      const k=v=>((t[v]||0)/n).toFixed(1),logic=((t.update||0)+(t.worldUpdate||0)+(t.villageUpdate||0))/n;
      // שורה אחת: fps · frame/worst · L חישובים · 3D · 2D · U ממשק · c ציורים בתלת-ממד · e אויבים
      box.textContent=(1000*n/gaps).toFixed(0)+'fps '+(gaps/n).toFixed(0)+'/'+worst.toFixed(0)+'ms L'+logic.toFixed(1)+' 3D'+k('render3d')
        +' 2D'+((t.render||0)/n-(t.render3d||0)/n).toFixed(1)+' U'+k('hud')+(R3D.on?' c'+(R3D.stats.calls||0):' 2d')+' e'+(enemies?enemies.length:0);
      for(const v in t)t[v]=0;n=0;gaps=0;worst=0;since=now;
    }
    cb(now);
  });
})();
