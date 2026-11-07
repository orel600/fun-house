/* משחקי השאול: מזג אוויר (אוראל, 7.11.2026, חבילה 44). גשם קל בתחילת המשחק שמתחזק לקראת הסוף (לפי MB.t),
   ובמגדל או בסיס שנופל: ברק עליו (רק אם הקבוצה שלי רואה את המקום, mbVisPt) והבזק קצר על כל המסך.
   קריאות קודם: מזג האוויר מצויר מתחת לכל האזורים, הסקילים, היריות והמספרים (שורה אחת ב-mobaDraw, מיד אחרי הרצפה),
   ובשקיפות נמוכה. הוא בכל המפה, אז הוא לא מסגיר אף אחד בערפל.
   מתחבר דרך עטיפות של mobaStart, mobaUpdate, mbDie ו-mbEnd (בלי לגעת בקוד שלהן), ושורה אחת ב-mobaDraw.
   כשהמנוע של מזג האוויר (js/weather.js, setWeather/weatherScene) קיים, הוא מצייר. בלעדיו: שכבת גשם אחת משלנו מ-FXDATA. */
const MBWX={
  on:true,
  id:'wx_rainheavy',   // אריח הגשם (256px) כשאין את המנוע
  a0:0.10,a1:0.34,     // שקיפות הגשם בתחילת המשחק ובסוף (MOBA.maxT)
  tower:0.12,          // כל מבנה שנפל מקרב את הסערה
  dark:0.16,           // הכהיה של המסך בשיא הסערה (מתחת לסקילים)
  flash:{a:0.32,t:0.45},   // הבזק על כל המסך כשמבנה נופל
  bolt:{t:0.35,h:420,seg:7,jit:26},   // ברק מצויר: משך, גובה, מקטעים וזיגזג
  states:[[0,'calm'],[0.35,'building'],[0.7,'storm']],   // שלבים במנוע לפי העוצמה
  scene:{theme:'night',auto:false,
    calm:[['rain_light',0.35]],
    building:[['rain_heavy',0.45],['cloud_dark',0.3]],
    storm:[['rain_torrent',0.6],['storm_cloud',0.45]],
    clearing:[['rain_drip',0.3]]},
  // מצב
  k:0,fl:0,bolts:[],h:null,st:'',falls:0,core:false,ms:0,n:0,
};
const mbWxCore=()=>typeof weatherScene==='function'&&typeof weatherState==='function';
// עוצמה 0..1: הזמן במשחק, ועוד כל מבנה שנפל
const mbWxK=M=>Math.min(1,M.t/MOBA.maxT+MBWX.falls*MBWX.tower);

function mbWxStart(){
  const X=MBWX;X.k=0;X.fl=0;X.bolts=[];X.falls=0;X.st='';X.h=null;X.core=mbWxCore();
  if(!X.on)return;
  if(X.core){try{weatherScene('moba',X.scene);weatherState('moba','calm');X.st='calm'}catch(e){X.core=false}}
  if(!X.core&&typeof fxMake==='function'){X.h=fxMake(X.id,0,0,{loop:true,fps:24});typeof fxPreload==="function"&&fxPreload([X.id])}
}
function mbWxTick(dt){
  const X=MBWX,M=MB;if(!X.on||!M)return;
  X.k=mbWxK(M);X.fl=Math.max(0,X.fl-dt/MBWX.flash.t);
  for(const b of X.bolts)b.life-=dt;X.bolts=X.bolts.filter(b=>b.life>0);
  if(X.core){let s='calm';for(const [k,n] of X.states)if(X.k>=k)s=n;
    if(s!==X.st){X.st=s;try{weatherState('moba',s)}catch(e){}}}
}
// מבנה נפל: ברק עליו אם רואים אותו, והבזק תמיד (גם בסיס שנופל בסוף)
function mbWxFall(b){
  const X=MBWX;if(!X.on)return;X.falls++;
  const seen=typeof mbVisPt!=='function'||mbVisPt(b.x,b.y),calm=RM||typeof fxLess==='function'&&fxLess();
  if(X.core){try{if(!calm&&typeof weatherFlash==='function')weatherFlash(MBWX.flash.a);if(seen&&typeof weatherBolt==='function')weatherBolt(b.x,b.y,{})}catch(e){}return}
  if(!calm)X.fl=1;
  if(seen){const pts=[],B=MBWX.bolt;let x=b.x;for(let i=0;i<=B.seg;i++){pts.push([x,b.y-B.h*(1-i/B.seg)-40]);x+=(Math.random()-0.5)*B.jit*2}
    pts[pts.length-1][0]=b.x;X.bolts.push({pts,life:B.t})}
}
function mbWxEnd(){
  const X=MBWX;X.h=null;X.bolts=[];X.fl=0;
  if(X.core){try{typeof weatherClear==='function'&&weatherClear(1.5)}catch(e){}}
}
// נקרא מ-mobaDraw אחרי הרצפה, בקואורדינטות העולם: לפני האזורים, היחידות, הסקילים והמספרים
function mbWxDraw(){
  const X=MBWX;if(!X.on||!MB)return;
  const t0=performance.now();
  // ברק מצויר במקום של המבנה (בעולם)
  if(X.bolts.length){ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';
    for(const b of X.bolts){const k=b.life/MBWX.bolt.t;
      for(const [w,c,a] of [[9,'#7F7CFF',0.35],[3,'#EAF0FF',0.95]]){ctx.globalAlpha=a*k;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();b.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}}
    ctx.restore()}
  if(X.core){X.ms=performance.now()-t0;return}   // את השאר מצייר המנוע
  // הגשם והכהיה על כל המסך
  ctx.save();ctx.setTransform(DPR*ZOOM,0,0,DPR*ZOOM,0,0);
  const w=W,h=H;
  if(X.k>0.05){ctx.globalAlpha=1;ctx.fillStyle='rgba(8,6,24,'+(MBWX.dark*X.k).toFixed(3)+')';ctx.fillRect(0,0,w,h)}
  const f=X.h,im=f&&fxImg(f.id);
  if(im){const D=f.D,i=Math.floor((fxNowT()-f.t0)*f.fps)%D.n,z=Math.max(w,h)*1.15;
    ctx.globalAlpha=MBWX.a0+(MBWX.a1-MBWX.a0)*X.k;ctx.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,w/2-z/2,h/2-z/2,z,z);X.n++}
  if(X.fl>0){ctx.globalAlpha=MBWX.flash.a*X.fl;ctx.fillStyle='#E8ECFF';ctx.fillRect(0,0,w,h)}
  ctx.restore();
  X.ms=performance.now()-t0;
}
// החיבורים: עטיפות, כדי לא לגעת בקוד של moba.js (נערך במקביל)
(()=>{
  const st=mobaStart;mobaStart=function(){const r=st.apply(this,arguments);try{mbWxStart()}catch(e){}return r};
  const up=mobaUpdate;mobaUpdate=function(dt){const r=up.apply(this,arguments);try{mbWxTick(dt)}catch(e){}return r};
  const die=mbDie;mbDie=function(t){const was=t&&!t.dead&&(t.k==='tower'||t.k==='base');const r=die.apply(this,arguments);if(was&&t.dead)try{mbWxFall(t)}catch(e){}return r};
  const end=mbEnd;mbEnd=function(){try{mbWxEnd()}catch(e){}return end.apply(this,arguments)};
})();
