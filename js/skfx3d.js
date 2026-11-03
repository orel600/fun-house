/* מתכונים של סקילים בתלת-ממד (SKFX3D): כל סקיל יכול לקבל מתכון שמצייר אותו עם ערכת האפקטים (VFX3D ב-js/vfx3d.js).
   המתכון יושב בקובץ משלו (למשל js/skfx3d-meteor.js), ונרשם כך:
     SKFX3D.register('<מזהה הסקיל>',{
       start(o,st){...},      // פעם אחת, כשהסקיל הופיע. o: האובייקט של הסקיל (x,y,r,t,dur,col,dt,vis,boom...), st: מקום פרטי למתכון
       frame(o,st,dt){...},   // כל פריים כל עוד הסקיל חי. o.t: כמה זמן עבר. הלוגיקה (נזק, טווח, זמן) לא משתנה כאן, רק ציור
       end(o,st){...},        // כשהסקיל נגמר: משחררים ידיות (VFX3D.free). חלקיקים ומדבקות עם זמן נגמרים לבד
       keep2d:false           // true: גם הציור הדו-ממדי הישן נשאר
     });
   אין צורך לגעת בקוד הסקיל: SKFX3D סורק את רשימות הסקילים (sources) ומוצא לבד מה חדש ומה נגמר.
   כשהמתכון פעיל, wsbDraw (wskbook.js) מדלג על הציור הדו-ממדי של הסקיל. בדו-ממד, או בלי מתכון, הכל כמו קודם */
const SKFX3D={list:{},live:new Map(),f:0,stat:{start:0,end:0},
  // מאיפה לוקחים סקילים: ספר הסקילים בעולם. מקור חדש (סקיל חתימה, חיית מחמד): SKFX3D.sources.push(()=>רשימה)
  sources:[()=>S&&S.wsb&&S.wsb.fx],
  register(id,R){this.list[id]=R},
  owns(o){const R=o&&this.list[o.id];return !!(R&&!R.keep2d&&VFX3D.on())},
  wants(){for(const src of this.sources){const L=src();if(L)for(const o of L)if(this.list[o.id])return true}return false},
  step(dt){
    const f=++this.f;
    for(const src of this.sources){const L=src();if(!L)continue;
      for(const o of L){const R=this.list[o.id];if(!R)continue;let st=this.live.get(o);
        if(!st){st={};this.live.set(o,st);this.stat.start++;try{R.start&&R.start(o,st)}catch(e){console.error(e)}}
        st._f=f;try{R.frame&&R.frame(o,st,dt)}catch(e){console.error(e)}}}
    for(const [o,st] of this.live)if(st._f!==f)this.end(o,st);
  },
  end(o,st){const R=this.list[o.id];this.live.delete(o);this.stat.end++;try{R&&R.end&&R.end(o,st)}catch(e){console.error(e)}},
  clear(){for(const [o,st] of this.live)this.end(o,st)},
  n(){return this.live.size}
};
