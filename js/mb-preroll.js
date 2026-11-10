/* משחקי השאול: רגע טעינה קצר בתחילת משחק (MBPRE, השיפוץ, BOB, 10.11.2026, QUINN: קפיאה בפגיעה הראשונה). רק הכנה ומסך כהה לרגע: שום דבר במשחק לא משתנה.
   בתחילת המשחק הסצנה של השאול נבנית, וה-shaders שלה מוכנים בפעם הראשונה שכל חפץ מצויר. חפצים שעוד לא במסך (למשל של tex3d) מוכנים מאוחר יותר,
   באמצע הקרב הראשון (פרופיל CPU: כ-420 ms). כאן, מאחורי מסך כהה קצר: פריים אחד של כל הסצנה, ואז הכנה של כל החפצים בסצנה, גם אלה שמחוץ למסך (compile).
   ואז המסך נעלם. כך הקפיאה קורה פעם אחת, מאחורי המסך, ולא בקרב. MBPRE.stat.ms: כמה זמן זה לקח. ?mbpre=0 מכבה. מחיקה: הקובץ, השורה ב-index.html וכלל .mbpre ב-css/style.css */
const MBPRE={on:!/[?&]mbpre=0(&|$)/.test(location.search),fade:0.25,stat:{ms:0,runs:0}};
(function(){
  if(!MBPRE.on||typeof mobaStart!=='function')return;
  const b=mobaStart;mobaStart=function(){
    const r=b.apply(this,arguments);
    if(typeof R3D==='undefined'||!R3D.on||!R3D.ready||!R3D.r)return r;
    let ov=document.querySelector('.mbpre');if(!ov){ov=document.createElement('div');ov.className='mbpre';document.body.appendChild(ov)}ov.classList.remove('out');
    const t0=performance.now();
    // two frames: the dark screen is painted first, and only then the long preparation blocks the page
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{if(typeof render==='function')render();R3D.r.compile(R3D.scene,R3D.cam)}catch(e){}
      MBPRE.stat.ms=Math.round(performance.now()-t0);MBPRE.stat.runs++;
      ov.classList.add('out');setTimeout(()=>{if(ov.classList.contains('out'))ov.remove()},MBPRE.fade*1000+50);
    }));
    return r;
  };
})();
