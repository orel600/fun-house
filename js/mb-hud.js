/* משחקי השאול: מסגרת קריאה של המסך בזמן קרב (MBHUD, השיפוץ, BOB, 10.11.2026, לפי visual-direction-1.md של DANA). רק מראה: שום מכניקה, פגיעה או זמן לא משתנים.
   - מספרי נזק וריפוי: עוגן מעל הראש האמיתי של הגוף (לפי המראה, כולל הגוף הנמוך והרחב), לא באמצע החזה.
     כל מספר חדש לוקח את המקום הפנוי הראשון (מרכז, ימין, שמאל, ושורה מעל) מול כל המספרים החיים, וכולם עולים באותה מהירות: שני מספרים לא חולקים פיקסל.
   - סגנון אחד לכל המספרים (mbHudText): קו מתאר כהה אחיד ביחס לגודל. רמות: רגיל (צבע סוג הנזק), קריטי (זהב וגדול), ריפוי (ירוק).
   - הודעות (התחלה, עלייה ברמה, גלים): פס קבוע מתחת לשעון למעלה, קטן, ולא באמצע המסך מעל הקרב (CSS: body.mb.mbhud .banner).
   - המפה הקטנה מתעמעמת בזמן קרב קבוצתי (fight: לפחות heroes גיבורים חיים בטווח r ממך, מהם לפחות אויב אחד שרואים), ונשארת כך hold שניות. הנגיעה בה לא משתנה.
   - הפינה הימנית העליונה: מרווחים של לפחות 10 פיקסלים בין הכפתורים, אחרי הטבעות שלהם (CSS בלבד).
   ?mbhud=0 מכבה הכל. מחיקה: הקובץ, השורה ב-index.html, הכללים של body.mbhud ב-css/style.css, ושלוש הקריאות (mbNumAt ב-moba.js ו-moba-fx.js, mbHudText בשני הציורים) */
const MBHUD={
  on:!/[?&]mbhud=0(&|$)/.test(location.search),
  num:{above:16,step:1.05,rows:4,healUp:10,drift:30,out:'#0B0A12',outW:0.2,outMin:3},   // above: כמה מעל הראש. step: הצעד בחיפוש מקום, ביחס לגודל המספר. rows: כמה שורות מעל לנסות. drift: מהירות העלייה של כולם
  fight:{r:420,heroes:4,hold:2.5,every:0.25,alpha:0.5},   // r ו-heroes: מתי זה קרב קבוצתי. alpha: כמה המפה הקטנה נשארת גלויה
  stat:{nums:0,full:0,fights:0}
};
// איפה מספר נולד: מעל הראש של המטרה, בנתיב הבא שלה. בדו-ממד או כשכבוי: העוגן הישן
function mbNumAt(t,kind){
  const N=MBHUD.num;let top=t.y-t.r-(kind==='heal'?30:18);
  if(!MBHUD.on)return [t.x+rand(-8,8),top];
  if(typeof R3D!=='undefined'&&R3D.on){const L=t.me&&R3D.player?R3D.player.L:(typeof lookOf==='function'?lookOf(t):null);if(L&&L.h)top=t.y+(L.foot||0)-L.h-N.above}
  MBHUD.stat.nums++;return [t.x,top-(kind==='heal'?N.healUp:0)];
}
// מקום בלי חפיפה לכל מספר חדש, מכל מקור (נזק, ריפוי, זהב ועוד): רץ אחרי כל עדכון, מתחיל מהמקום שהמספר ביקש, ובוחר את המקום הפנוי הראשון
// (מרכז, ימין, שמאל, ואז שורה מעל) מול כל המספרים שכבר מוקמו. כולם עולים באותה מהירות (drift), אז מה שלא חופף בלידה לא יחפוף אחר כך. הגודל: בגודל הציור (mbUiK)
function mbHudPlace(){
  const N=MBHUD.num,k=typeof mbUiK==='function'?mbUiK():1,F=typeof mbfxS==='function'?mbfxS():null,box=(n,big)=>{const h=(big?(n.crit?30:24):17*(n.sz||1))*k;return {h,w:String(n.txt).length*h*0.62+h*0.4}};
  const placed=[],fresh=[];
  for(const [L,big] of [[F&&F.n,true],[MB.floats,false]])if(L)for(const n of L){if(n.life<=0.05)continue;const b=box(n,big);(n.hudP?placed:fresh).push({n,w:b.w,h:b.h})}
  for(const q of fresh){const n=q.n,x0=n.x,y0=n.y;let ok=false;
    for(let row=0;row<N.rows&&!ok;row++)for(const side of [0,1,-1,2,-2]){const x=x0+side*q.w*N.step,y=y0-row*q.h*N.step;
      if(!placed.some(p=>Math.abs(p.n.x-x)<(p.w+q.w)/2&&Math.abs(p.n.y-y)<(p.h+q.h)/2)){if(n.cfx){n.cfx.x+=x-n.x;n.cfx.y+=y-n.y}n.x=x;n.y=y;ok=true;break}}
    if(!ok)MBHUD.stat.full++;n.hudP=1;placed.push(q)}
}
// סגנון אחד למספרים: קו מתאר כהה אחיד (ביחס לגודל), ואז המילוי
function mbHudText(txt,x,y,sz,col,a){
  const N=MBHUD.num;ctx.globalAlpha=a;ctx.font='900 '+Math.round(sz)+'px Heebo, system-ui, sans-serif';ctx.lineJoin='round';
  ctx.lineWidth=Math.max(N.outMin,sz*N.outW);ctx.strokeStyle=N.out;ctx.strokeText(txt,x,y);ctx.fillStyle=col;ctx.fillText(txt,x,y);
}
(function(){
  if(!MBHUD.on)return;
  document.body.classList.add('mbhud');
  // קרב קבוצתי: בודקים כמה פעמים בשנייה, ומחזיקים את המצב hold שניות אחרי הקרב
  let next=0,fightAt=-99;
  if(typeof mobaUpdate==='function'){const b=mobaUpdate;mobaUpdate=function(){const r=b.apply(this,arguments);if(typeof MB!=='undefined'&&MB)mbHudPlace();
    if(typeof MB!=='undefined'&&MB&&MB.me&&MB.t>=next){next=MB.t+MBHUD.fight.every;const F=MBHUD.fight,me=MB.me;let n=0,foe=0;
      for(const u of MB.u){if(u.k!=='hero'||u.dead||Math.hypot(u.x-me.x,u.y-me.y)>F.r)continue;if(u.team===me.team){n++;continue}if(typeof mbSeen!=='function'||mbSeen(u,me.team)){n++;foe++}}
      if(n>=F.heroes&&foe>0){if(MB.t-fightAt>F.hold)MBHUD.stat.fights++;fightAt=MB.t}
      document.body.classList.toggle('mbfight',MB.t-fightAt<=F.hold)}
    return r}}
  // המפה הקטנה: שקיפות בזמן קרב, דרך אותה שקיפות שכבר קיימת (מסגרת וגם התוכן). הגיאומטריה והנגיעה לא משתנות
  if(typeof mbMiniBox==='function'){const b=mbMiniBox;mbMiniBox=function(){const l=b.apply(this,arguments);
    if(document.body.classList.contains('mbfight')&&!(typeof MBCAM!=='undefined'&&MBCAM.pid!==null))l.a=Math.min(l.a,MBHUD.fight.alpha);return l}}
})();
