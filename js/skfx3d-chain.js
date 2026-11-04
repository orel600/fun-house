/* מתכון שרשרת הברק (chain) בתלת-ממד: לכל קפיצה קשת ברק זוהרת וזזה מהאויב הקודם לבא, הבזק ואור סגול בפגיעה,
   וניצוצות שנופלים. קפיצה מאויב רטוב בהירה ועבה יותר, עם טיפות שמתאדות.
   רק ציור: הנזק, הקפיצות והטווח ב-wskbook.js וב-wskx.js. כל המספרים ב-CHN3D. הקשת בנויה מחלקיקים זוהרים קצרים, בלי גיאומטריה משלה.
   באיכות נמוכה: פחות נקודות בקשת ופחות ניצוצות, ובלי אור */
const CHN3D={
  h:26,                      // גובה הקשת מעל הקרקע
  arc:{n:16,lo:7,jit:16,life:[0.14,0.22],size:16,size2:5,again:0.07},   // נקודות לקשת, כמה היא רועדת, וכמה זמן כל נקודה. again: הקשת מצוירת שוב פעם אחת אחרי זמן קצר
  hit:{spark:14,glow:1.4},
  light:{i:3.5,t:0.25},
  pal:{core:'#f6eaff',glow:'#b06bff',deep:'#6a2cff',wet:'#9fd8ff'}
};
(()=>{
  const V=CHN3D,C=V.pal;
  function bolt(h,wet){
    const A=V.arc,n=VFX3D.quality()==='hi'?A.n:A.lo,dx=h.bx-h.ax,dy=h.by-h.ay,L=Math.hypot(dx,dy)||1,k=wet?1.35:1;
    for(let i=0;i<=n;i++){const f=i/n,j=(i&&i<n?(Math.random()-0.5)*2*A.jit:0),hh=V.h+(i&&i<n?(Math.random()-0.5)*A.jit:0);
      VFX3D.emit('glow',h.ax+dx*f-dy/L*j,h.ay+dy*f+dx/L*j,hh,{n:1,raw:1,col:C.core,col2:wet?C.wet:C.glow,size:A.size*k,size2:A.size2,life:A.life,spd:0,up:0})}
  }
  SKFX3D.register('chain',{
    start(o,st){st.n=0;st.re=[]},
    frame(o,st,dt){
      while(st.n<(o.hops||[]).length){const h=o.hops[st.n++];bolt(h,h.wet);st.re.push({h,t:V.arc.again});
        VFX3D.emit('glow',h.bx,h.by,V.h,{n:1,raw:1,col:C.core,col2:C.deep,size:60*V.hit.glow,size2:90,life:[0.1,0.16]});
        VFX3D.emit('spark',h.bx,h.by,V.h,{n:V.hit.spark,col:C.core,col2:h.wet?C.wet:C.glow,spd:240,up:220});
        if(h.wet)VFX3D.emit('puff',h.bx,h.by,14,{n:5,col:'#e8f4ff',col2:'#9fb6c8',size:16,size2:46,spd:40,up:70,a:0.4});
        VFX3D.light(h.bx,h.by,40,C.glow,V.light.i,V.light.t)}
      for(const r of st.re)if(r.t>0&&(r.t-=dt)<=0)bolt(r.h,r.h.wet);
    },
    end(o,st){st.re.length=0}
  });
})();
