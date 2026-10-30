/* בסיס: קנבס, צבעים, פונקציות עזר ושיא */
const $=s=>document.getElementById(s);
const cvs=$('c'),ctx=cvs.getContext('2d');
const C={ink:'#121624',line:'#2A3249',chalk:'#ECE7DC',dim:'#8D94A8',ember:'#FF8A3D',tide:'#46D3E6',gold:'#F4C74F',blood:'#EF4E57',lilac:'#C7A6FF'};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const FONT="800 15px Heebo, system-ui, sans-serif";
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR)}
addEventListener('resize',resize);resize();

const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};
const fmt=t=>{t=Math.max(0,Math.floor(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
// מספר גדול בקיצור: 950, 12.3K, 4.5M, 1.2B
const big=n=>{n=Math.max(0,n);let i=0;while(n>=1000&&i<4){n/=1000;i++}return (i&&n<100?(Math.floor(n*10)/10):Math.floor(n))+['','K','M','B','T'][i]};
const hash=(x,y)=>{const s=Math.sin(x*12.9898+y*78.233)*43758.5453;return s-Math.floor(s)};

let best=0;try{best=+localStorage.getItem('zm-best')||0}catch(e){}
