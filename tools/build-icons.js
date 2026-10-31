/* בונה את האייקונים של האפליקציה (icons/*.png) לבית של הטלפון: איש מקל עם חרב על לוח כהה.
   מריצים רק כשמשנים את העיצוב: node tools/build-icons.js (צריך את Playwright מ-npm run setup).
   maskable = האייקון של אנדרואיד שנחתך לעיגול או לריבוע מעוגל, לכן הציור בו קטן יותר וממורכז. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'..','icons');
const ICONS=[{f:'icon-192.png',s:192,k:0.86},{f:'icon-512.png',s:512,k:0.86},{f:'maskable-512.png',s:512,k:0.62},{f:'apple-touch-icon.png',s:180,k:0.8}];
function draw(s,k){   // רץ בדפדפן. צבעים מ-css/style.css
  const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');
  x.fillStyle='#121624';x.fillRect(0,0,s,s);
  const u=s*k/100;x.translate(s/2-50*u,s/2-50*u);x.scale(u,u);x.lineCap='round';x.lineJoin='round';
  x.strokeStyle='#ECE7DC';x.lineWidth=7;
  x.beginPath();x.arc(44,22,11,0,7);x.stroke();                       // ראש
  x.beginPath();x.moveTo(44,33);x.lineTo(42,64);                     // גוף
  x.moveTo(42,64);x.lineTo(28,90);x.moveTo(42,64);x.lineTo(58,88);   // רגליים
  x.moveTo(43,42);x.lineTo(26,56);x.moveTo(43,42);x.lineTo(64,36);   // ידיים
  x.stroke();
  x.strokeStyle='#F4C74F';x.lineWidth=6;x.beginPath();x.moveTo(62,38);x.lineTo(90,8);x.stroke();   // חרב
  x.lineWidth=5;x.beginPath();x.moveTo(56,30);x.lineTo(70,44);x.stroke();                          // ניצב
  x.fillStyle='#FF8A3D';x.beginPath();x.arc(90,8,4.5,0,7);x.fill();
  return c.toDataURL('image/png');
}
(async()=>{
  const b=await chromium.launch();const p=await b.newPage();fs.mkdirSync(OUT,{recursive:true});
  for(const i of ICONS){const d=await p.evaluate(`(${draw})(${i.s},${i.k})`);fs.writeFileSync(path.join(OUT,i.f),Buffer.from(d.split(',')[1],'base64'));console.log(i.f)}
  await b.close();
})();
