/* משחקי השאול: כפתורי סקיל עגולים עם אייקון מצויר וטעינה כמו במסמך (MBSKB, השיפוץ, skill-buttons-design.md, MAX ל-BOB, 10.11.2026). רק ב-overhaul.
   - אייקון: התמונה העגולה של הסקיל (icons/uw/<שם>.png, 40 המועמדים מהמסמך, מגיעים עם ההורדה של אוראל). אין קובץ, או שלא נטען: התמונה מוסרת
     והאייקון של היום נשאר (mbPic: התמונה של העולם, ואחריה ה-SVG). כך הקוד מוכן לפני שהתמונות מגיעות.
   - שלוש מצבים מתמונה אחת (המסמך): רגיל. לחוץ: בהירות 35%+, רוויה 20%+, וגדל 5%. טעינה: אפור ועמום (55%), ומעליו העותק הצבעוני
     שנחשף עם כיוון השעון מ-12 ככל שהטעינה נגמרת (mask עם conic-gradient לפי --cd, שכבר מתעדכן ב-mobaHud). במקום המילוי הכהה שהיה.
   - הפריסה: 2x2 בפינה הימנית התחתונה, כמו במסמך (MAX, 10.11, לפי ההנחיה של אוראל). ?mbbtn=arc מחזיר את הקשת סביב כפתור התקיפה של היום
   ?mbskb=0 מחזיר את הכפתורים הקודמים. מחיקה: הקובץ, השורה ב-index.html, והחלק "mbskx" ב-css/style.css */
const MBSKB={
  on:!/[?&]mbskb=0(&|$)/.test(location.search),
  dir:'icons/uw/',
  layout:/[?&]mbbtn=arc(&|$)/.test(location.search)?'arc':'grid',   // grid: 2x2 בפינה (המסמך, MAX 10.11). arc: הקשת של היום (?mbbtn=arc)
  // id של סקיל ← שם הקובץ (בלי .png). השמות מ-skill-buttons-design.md
  icon:{anvil:'icon-uw-tank-s1-anvil-slam-round',taunt:'icon-uw-tank-s2-taunt-round',wall:'icon-uw-tank-ult-iron-wall-round',
    cleave:'icon-uw-warrior-s1-sword-wave-round',spin:'icon-uw-warrior-s2-blade-spin-round',rage:'icon-uw-warrior-ult-rage-round',
    pierce:'icon-uw-hunter-s1-lightning-pierce-round',net:'icon-uw-hunter-s2-hunters-net-round',rain:'icon-uw-hunter-ult-arrow-rain-round',
    wave:'icon-uw-mage-s1-water-wave-round',bubble:'icon-uw-mage-s2-water-prison-round',blizzard:'icon-uw-mage-ult-blizzard-round',
    shadowstep:'icon-uw-assassin-s1-shadowstep-round',vanish:'icon-uw-assassin-s2-vanish-round',deathmark:'icon-uw-assassin-ult-deathmark-round'},
  basic:{tank:'icon-uw-tank-basic-round',warrior:'icon-uw-warrior-basic-round',hunter:'icon-uw-hunter-basic-round',mage:'icon-uw-mage-basic-round',assassin:'icon-uw-assassin-basic-round'},
  stat:{built:0}
};
// שכבה אחת של האייקון: התמונה העגולה (אם יש), ואחריה מה שהיה בכפתור (התמונה של העולם וה-SVG)
const mbSkbImg=f=>f?'<img class="mbuw" src="'+MBSKB.dir+f+'.png" alt="" draggable="false" onerror="this.remove()">':'';
function mbSkbWrap(b,file){
  if(!b||b.querySelector('.mbicon'))return;
  const old=[...b.childNodes].filter(n=>!(n.nodeType===1&&(n.tagName==='I'||n.classList.contains('mblock')))),html=old.map(n=>n.nodeType===1?n.outerHTML:'').join('');
  for(const n of old)n.remove();
  const w=document.createElement('span');w.className='mbicon';
  w.innerHTML='<span class="mbib">'+mbSkbImg(file)+html+'</span><span class="mbic">'+mbSkbImg(file)+html+'</span>';
  b.insertBefore(w,b.firstChild);b.classList.add('mbskx');MBSKB.stat.built++;
}
(function(){
  if(!MBSKB.on||typeof mbUi!=='function')return;
  const bu=mbUi;mbUi=function(on){const r=bu.apply(this,arguments);document.body.classList.toggle('mbgrid',!!on&&MBSKB.layout==='grid');
    if(on){const u=mbMe();if(u){for(const b of document.querySelectorAll('#mbSk .mbskb[data-sk]')){const s=MBKIT[u.kit][b.dataset.sk];if(s)mbSkbWrap(b,MBSKB.icon[s.id])}
      mbSkbWrap($('mbAtk'),MBSKB.basic[u.kit])}}
    return r};
})();
