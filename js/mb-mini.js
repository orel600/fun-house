/* משחקי השאול: המפה הקטנה בכיוון של השיפוץ (MBMINI, underworld-map-minimap-direction.md, MAX ל-BOB, 10.11.2026). רק ב-overhaul. רק ציור:
   הראייה (mbSeen), המצלמה בנגיעה, הגודל, המקום והמסגרת לא משתנים.
   - פלטה של אובסידיאן: רקע כהה ושקט, נתיב ושבילים עמומים יותר, כדי שהנקודות בצבע הקבוצה יקבלו את כל תשומת הלב.
   - בסיס: יהלום (גדול מהמגדל, שהוא ריבוע), ועיגול הבית ברדיוס האמיתי של הריפוי (MOBA.base.healR), בצבע הקבוצה.
   - גיבור מת: נקודה עמומה במקום שנעלם (לא מראים טיימר). אויב מת רק אם רואים אותו, כמו חי.
   - אתה: הנקודה עם טבעת הזהב, ועוד חץ זהב קטן לכיוון שאתה פונה (חשוב לסקילים בכיוון).
   הגיאומטריה מהריפו (MOBA.lane, MBLOOK.map, MOBA.towers, MOBA.base), כמו בשרטוט underworld-minimap-schematic.png. ?mbmini=old מחזיר את הישנה.
   מחיקה: הקובץ, השורה ב-index.html, ושלושת המקומות שבודקים MBMINI ב-mbMini (moba-look.js) */
const MBMINI={
  on:!/[?&]mbmini=old(&|$)/.test(location.search),
  pal:{bg:'#17131d',lane:'rgba(214,200,222,0.22)',side:'rgba(214,200,222,0.09)',bush:'rgba(104,178,138,0.55)',tint:'50'},
  base:{k:1.25,ring:{a:0.6,w:1.25}},   // k: גודל היהלום ביחס לריבוע של הבסיס היום. ring: עיגול הבית
  dead:0.35,                           // שקיפות של גיבור מת
  arrow:{len:7,w:5}                    // חץ הכיוון שלך: כמה בולט מהנקודה, וכמה רחב
};
(function(){if(MBMINI.on&&typeof MBLOOK!=='undefined'&&MBLOOK.mini)Object.assign(MBLOOK.mini,MBMINI.pal)})();
// בסיס כיהלום ועיגול הבית. מחזיר true אם צייר (ואז mbMini לא מצייר את הריבוע)
function mbMiniBase(u,X,Y,k,s,c,a){
  if(!MBMINI.on||u.k!=='base')return false;const x=X(u.x),y=Y(u.y),B=MBMINI.base,h=s*B.k/2;
  ctx.globalAlpha=a*B.ring.a*(u.dead?0.5:1);ctx.strokeStyle=c;ctx.lineWidth=B.ring.w;ctx.beginPath();ctx.arc(x,y,MOBA.base.healR*k,0,7);ctx.stroke();
  ctx.globalAlpha=a*(u.dead?0.45:1);ctx.fillStyle=u.dead?MBLOOK.mini.col.dead:c;ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+h,y);ctx.lineTo(x,y+h);ctx.lineTo(x-h,y);ctx.closePath();ctx.fill();
  ctx.strokeStyle=u.dead?c:'#0B0D14';ctx.lineWidth=1;ctx.stroke();return true;
}
// חץ הכיוון שלך, מחוץ לנקודה
function mbMiniArrow(me,X,Y,r){
  if(!MBMINI.on)return;const A=MBMINI.arrow,f=typeof mbRot==='function'?mbRot(me):me.face||0,x=X(me.x),y=Y(me.y),cx=Math.cos(f),cy=Math.sin(f),px=-cy,py=cx,t=r+A.len,b=r-1;
  ctx.fillStyle=C.gold;ctx.strokeStyle='#0B0D14';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+cx*t,y+cy*t);ctx.lineTo(x+cx*b+px*A.w/2,y+cy*b+py*A.w/2);ctx.lineTo(x+cx*b-px*A.w/2,y+cy*b-py*A.w/2);ctx.closePath();ctx.fill();ctx.stroke();
}
