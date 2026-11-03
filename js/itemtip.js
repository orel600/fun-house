/* בועת הסבר לחפץ (ניר, 2.11.2026: "כשרוצים לראות חפץ מסוים, המסך לא מספיק נוח וקריא... הודעה מרחפת, שנעלמת בקלות אם לוחצים שוב").
   נגיעה בחפץ בתרמיל, במשבצת, במחסן או בנפחייה: חלון הפרטים הקיים (#gDetail, #fDetail) הופך לבועה צפה ליד החפץ, עם טקסט גדול.
   נגיעה נוספת באותו חפץ, ב-✕ או מחוץ לבועה סוגרת (gear.js, aging.js). כאן רק המיקום והמראה, והתוכן נשאר של מי שמצייר אותו.
   הבועה נפתחת לצד שיש בו יותר מקום, ולא יוצאת מהמסך. ה-CSS: .itip ב-css/itemtip.css */
const ITEMTIP={
  gap:10,      // רווח בין החפץ לבועה
  edge:6,      // מרחק מקצה המסך
  w:[270,380], // רוחב: לפחות, לכל היותר
  vw:.44       // ובערך החלק הזה של רוחב המסך
};
let itipNow=null;   // {box,anchor}: הבועה הפתוחה, כדי לעדכן מיקום בגלילה ובסיבוב המסך
// box: חלון הפרטים. anchor: החפץ שנבחר. בלי anchor: החלון חוזר למקומו הרגיל
function itemTip(box,anchor){
  if(!box)return;
  const on=!!(anchor&&anchor.offsetParent);
  box.classList.toggle('itip',on);box.setAttribute('role',on?'dialog':'region');
  if(!on){if(itipNow&&itipNow.box===box)itipNow=null;['left','top','width','maxHeight'].forEach(k=>box.style[k]='');box.style.removeProperty('--rar');delete box.dataset.rar;return}
  box.style.setProperty('--rar',getComputedStyle(anchor).getPropertyValue('--rar').trim()||'var(--gold)');   // מסגרת בצבע הדרגה של החפץ
  const rr=/\brar-(\w+)/.exec(anchor.className);if(rr)box.dataset.rar=rr[1];else delete box.dataset.rar;   // והמסגרת לפי השכבה (css/rarity.css): זהב עבה, אגדי זוהר
  itipNow={box,anchor};itipPlace();
}
function itipPlace(){
  if(!itipNow)return;const {box,anchor}=itipNow;
  if(!anchor.isConnected||!anchor.offsetParent){itemTip(box);return}
  const W=innerWidth,H=innerHeight,m=ITEMTIP.edge,g=ITEMTIP.gap,r=anchor.getBoundingClientRect();
  const w=Math.min(ITEMTIP.w[1],Math.max(ITEMTIP.w[0],W*ITEMTIP.vw),W-2*m);
  box.style.width=w+'px';box.style.maxHeight=(H-2*m)+'px';
  const after=W-r.right>=r.left;   // צד עם יותר מקום (מיקום על המסך, לא כיוון טקסט)
  const x=Math.max(m,Math.min(W-m-w,after?r.right+g:r.left-g-w));
  box.style.left=x+'px';box.style.top='0px';
  const h=box.offsetHeight,y=Math.max(m,Math.min(H-m-h,r.top+r.height/2-h/2));
  box.style.top=y+'px';
  box.dataset.side=after?'a':'b';
  box.style.setProperty('--ay',Math.max(16,Math.min(h-16,r.top+r.height/2-y))+'px');   // החץ הקטן מצביע על החפץ
}
addEventListener('resize',()=>requestAnimationFrame(itipPlace));
addEventListener('scroll',e=>{if(itipNow&&!itipNow.box.contains(e.target))itipPlace()},true);   // הרשת גוללת: הבועה זזה איתה
