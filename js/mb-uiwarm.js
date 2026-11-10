/* משחקי השאול: חימום הציור של כפתור סקיל בטעינה, בתחילת המשחק (MBUIWARM, השיפוץ, BOB, 10.11.2026, התקיעה בקרב הראשון שמצאה QUINN). רק ביצועים.
   הסיבה (נמדד ב-trace של Chrome, בדיוק בהגדרות של QUINN): בפעם הראשונה שהגיבור שלך מטיל סקיל, mobaHud (moba.js) מוריד מהכפתור את ready
   ומעדכן את --cd. אז מופיע המילוי הקוני הכפול של הטעינה (css/style.css: ':is(.skb,...) i{background:conic-gradient(...),conic-gradient(...)}') על עיגול.
   ה-GPU מקמפל אז 10 תוכניות ציור חדשות (Skia FillRRectOp/CircularRRectOp, כ-34 מ"ש כל אחת ב-D3D11), ובסך הכל תקיעה של 300-460 מ"ש באמצע הקרב הראשון.
   כאן: בפריים שבו המשחק מתחיל, עותק של כל כפתור סקיל במצב טעינה, באטימות מלאה, באותו מקום ומאחורי הכפתור האמיתי (z-index -1, בסוף המיכל כדי שהאמיתיים לא יזוזו), כך שלא רואים אותו. אחרי frames פריימים העותקים נמחקים.
   שקיפות לא עובדת כאן: עותק שקוף מצויר בשכבה נפרדת, עם תוכניות אחרות, והתקיעה נשארת (נמדד). גם במסך הפתיחה לא עבד (נמדד).
   המחיר: הקימפול עובר לפתיחת המשחק, שכבר נתקעת שם. עותק אחד (s1) מספיק: נמדד +330 מ"ש המתנה בפתיחה (עם כל הכפתורים: +520), והפער בקרב 44-62 מ"ש. שום כפתור אמיתי, מצב, זמן או מכניקה לא משתנים. כבוי כברירת מחדל, ?mbuiwarm=1 מדליק. מחיקה: הקובץ והשורה ב-index.html */
const MBUIWARM={
  on:/[?&]mbuiwarm=1(&|$)/.test(location.search),   // opt-in: the start costs ~0.5 s more (measured), above the 100 ms budget, so MAX decides
  frames:20,      // כמה פריימים העותקים נשארים מאחורי הכפתורים
  cd:0.4,         // מצב הטעינה של העותק (הזווית לא משנה את התוכנית, רק המבנה)
  sel:(new URLSearchParams(location.search).get('mbuiwarmsel')||'#mbSk [data-sk=s1]'),   // which buttons get a copy (one per distinct style is enough if the paint structure is the same)
  per:1,          // copies added per frame (spread)
  stat:{made:0,removed:0}
};
(function(){
  const X=MBUIWARM;if(!X.on||typeof mobaStart!=='function')return;
  const warm=()=>{
    const made=[];
    for(const b of document.querySelectorAll(X.sel)){if(!b.offsetParent||!b.parentNode)continue;
      const c=b.cloneNode(true);c.classList.remove('ready','lock','off','ping','aiming');c.classList.add('mbuiwarm');c.removeAttribute('id');c.removeAttribute('data-sk');
      c.setAttribute('aria-hidden','true');c.tabIndex=-1;c.style.setProperty('--cd',String(X.cd));c.style.pointerEvents='none';c.style.zIndex='-1';c.dataset.sec='3';
      const cs=getComputedStyle(b);for(const v of ['--x','--y','--w'])c.style.setProperty(v,cs.getPropertyValue(v));   // the same place and size as the real one (nth-child would give the copy another slot)
      made.push([b.parentNode,c]);X.stat.made++}
    if(!made.length)return;let k=0;const add=()=>{for(let j=0;j<X.per&&k<made.length;j++,k++){const [p,c]=made[k];p.appendChild(c)}if(k<made.length)requestAnimationFrame(add)};add();   // at the end: the real buttons keep their nth-child slots; z-index -1 keeps the copy behind them
    let n=0;const t=()=>{if(++n<X.frames+made.length){requestAnimationFrame(t);return}for(const [,c] of made){c.remove();X.stat.removed++}};requestAnimationFrame(t);
  };
  const b=mobaStart;mobaStart=function(){const r=b.apply(this,arguments);try{warm()}catch(e){}return r};
})();
