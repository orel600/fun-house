/* בסיס: קנבס, צבעים, פונקציות עזר ושיא */
const $=s=>document.getElementById(s);
const cvs=$('c'),ctx=cvs.getContext('2d');
const C={ink:'#121624',line:'#2A3249',chalk:'#ECE7DC',dim:'#8D94A8',ember:'#FF8A3D',tide:'#46D3E6',gold:'#F4C74F',blood:'#EF4E57',lilac:'#C7A6FF'};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FONT="800 15px Heebo, system-ui, sans-serif";
let W=0,H=0,DPR=1,ZOOM=1;   // W,H: כמה מהעולם רואים, ביחידות של המשחק. ZOOM מתחת ל-1: המצלמה גבוהה יותר ורואים יותר (VIEW.zoom ב-render3d.js)
// הקנבס מוקצה מחדש רק כשהגודל באמת השתנה: שינוי זום (למשל בקרב בענק, giant.js) משנה רק את W,H. השמה של אותו רוחב מוחקת ובונה את הקנבס מחדש בכל פריים (ביצועים, 4.11)
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth/ZOOM;H=window.innerHeight/ZOOM;const w=Math.round(window.innerWidth*DPR),h=Math.round(window.innerHeight*DPR);if(cvs.width!==w)cvs.width=w;if(cvs.height!==h)cvs.height=h}
function setZoom(z){if(z!==ZOOM){ZOOM=z;resize()}}
addEventListener('resize',resize);resize();
/* גובה המסך האמיתי (אוראל, 2.11.2026: באייפון, לפעמים מסך הפתיחה נחתך ונשאר פס כהה למטה). בפתיחה הסרגלים של הדפדפן עוד זזים,
   וספארי משאיר ל-fixed ול-100% גובה ישן. לכן מודדים שוב בכל שינוי, וגם כמה פעמים אחרי הטעינה, ושומרים ב---appH (css/style.css) */
let fitWH='';
function fitScreen(){const k=innerWidth+'x'+innerHeight;if(scrollY||scrollX)scrollTo(0,0);if(k===fitWH)return;fitWH=k;
  document.documentElement.style.setProperty('--appH',innerHeight+'px');resize()}
function fitSoon(){fitScreen();[100,500,1500].forEach(t=>setTimeout(fitScreen,t))}
['orientationchange','pageshow','load'].forEach(e=>addEventListener(e,fitSoon));
addEventListener('resize',fitScreen);if(window.visualViewport)visualViewport.addEventListener('resize',fitScreen);
fitSoon();

const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};
const fmt=t=>{t=Math.max(0,Math.floor(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
// מספר גדול בקיצור: 950, 12.3K, 4.5M, 1.2B
const big=n=>{n=Math.max(0,n);let i=0;while(n>=1000&&i<4){n/=1000;i++}return (i&&n<100?(Math.floor(n*10)/10):Math.floor(n))+['','K','M','B','T'][i]};
const hash=(x,y)=>{const s=Math.sin(x*12.9898+y*78.233)*43758.5453;return s-Math.floor(s)};

let best=0;try{best=+localStorage.getItem('zm-best')||0}catch(e){}
