/* התקנה כאפליקציה בטלפון (PWA, ניר 31.10.2026): מסך מלא בלי שורת הדפדפן, לרוחב, ועובד גם בלי רשת.
   - אנדרואיד/Chrome: כפתור "התקנה" במסך הפתיחה כשהדפדפן מציע. אייפון: רמז "שיתוף ← הוספה למסך הבית".
   - מותקן: נועלים לרוחב בנגיעה הראשונה, ואם אי אפשר (אייפון) מבקשים לסובב את הטלפון.
   - ה-service worker (sw.js) נרשם רק מ-http/https, לעולם לא מ-file://. התיאור של האפליקציה: manifest.webmanifest */
const PWA={
  sw:'sw.js',                 // בשורש, כדי שישמור את כל המשחק
  lock:'landscape',           // לאיזה כיוון נועלים כשמותקן
  hintIOS:true,               // רמז ההתקנה באייפון
  state:'',                   // 'file' | 'none' | 'ok' | 'fail': מה קרה עם ה-service worker (נבדק ב-tools/check.js)
  prompt:null,                // ההצעה של Chrome להתקין, עד שלוחצים על הכפתור
};
PWA.app=()=>matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
PWA.ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
PWA.web=()=>/^https?:$/.test(location.protocol);

function pwaHeld(){return PWA.app()&&matchMedia('(orientation: portrait)').matches}   // מסך "סובבו" מוצג, והמשחק עוצר (main.js)

function pwaShow(){   // מה מוצג במסך הפתיחה: כפתור התקנה, רמז לאייפון, או כלום
  const app=PWA.app(),btn=document.getElementById('pwaInstall'),ios=document.getElementById('pwaIos');
  document.documentElement.classList.toggle('pwa-app',app);
  if(btn)btn.hidden=app||!PWA.prompt;
  if(ios)ios.hidden=app||!PWA.hintIOS||!PWA.web()||!PWA.ios()||!!PWA.prompt;
}

(function pwaInit(){
  if(!PWA.web())PWA.state='file';
  else if(!('serviceWorker' in navigator))PWA.state='none';
  else navigator.serviceWorker.register(PWA.sw+'?v='+encodeURIComponent(VERSION)).then(()=>{PWA.state='ok'},()=>{PWA.state='fail'});
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();PWA.prompt=e;pwaShow()});
  addEventListener('appinstalled',()=>{PWA.prompt=null;pwaShow()});
  const btn=document.getElementById('pwaInstall');
  if(btn)btn.onclick=()=>{const p=PWA.prompt;if(!p)return;PWA.prompt=null;p.prompt();p.userChoice.finally(pwaShow);pwaShow()};
  // מותקן: נעילה לרוחב בנגיעה הראשונה (הדפדפן מרשה רק אחרי נגיעה). אם לא נתמך, מסך "סובבו את הטלפון" ב-CSS
  addEventListener('pointerdown',()=>{if(PWA.app()&&screen.orientation&&screen.orientation.lock)screen.orientation.lock(PWA.lock).catch(()=>{})},{once:true,capture:true});
  matchMedia('(display-mode: standalone)').addEventListener?.('change',pwaShow);
  pwaShow();
})();
