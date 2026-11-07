/* משחקי השאול: מזג אוויר (אוראל, 7.11.2026, חבילה 44). גשם קל בתחילת המשחק שמתחזק לקראת הסוף (לפי MB.t),
   ובמגדל או בסיס שנופל: ברק עליו (רק אם הקבוצה שלי רואה את המקום, mbVisPt) והבזק קצר על כל המסך.
   קריאות קודם: מזג האוויר מצויר מתחת לכל האזורים, הסקילים, היריות והמספרים (שורה אחת ב-mobaDraw, מיד אחרי הרצפה),
   ובשקיפות נמוכה. הוא בכל המפה, אז הוא לא מסגיר אף אחד בערפל.
   מתחבר דרך עטיפות של mobaStart, mobaUpdate, mbDie ו-mbEnd (בלי לגעת בקוד שלהן), ושורה אחת ב-mobaDraw.
   כשהמנוע של מזג האוויר (js/weather.js) קיים, הוא מצייר את השכבה מתחת לכל הקרב (בדו-ממד אחרי הרצפה, בתלת-ממד מיד אחרי התלת-ממד),
   והקובץ הזה רק רושם את הסצנה 'moba' ומעביר מצבים לפי העוצמה. בלעדיו: שכבת גשם אחת משלנו מ-FXDATA. */
const MBWX={
  on:true,
  ids:['wx_rain_light_night','wx_rain_heavy_night','wx_rain_torrent_night'],   // אריח הגשם לכל שלב (calm, building, storm) כשאין את המנוע (חבילה 44, נושא night)
  old:'wx_rainheavy',   // אם הגיליונות של חבילה 44 חסרים
  a0:0.16,a1:0.34,     // שקיפות הגשם בתחילת המשחק ובסוף (MOBA.maxT)
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
  k:0,fl:0,bolts:[],h:null,st:'',si:-1,falls:0,core:false,ms:0,n:0,
};
const mbWxCore=()=>typeof weatherScene==='function'&&typeof weatherState==='function'&&typeof weatherBolt==='function'&&typeof weatherFlash==='function';
// עוצמה 0..1: הזמן במשחק, ועוד כל מבנה שנפל
const mbWxK=M=>Math.min(1,M.t/MOBA.maxT+MBWX.falls*MBWX.tower);

function mbWxStart(){
  const X=MBWX;X.k=0;X.fl=0;X.bolts=[];X.falls=0;X.st='';X.si=-1;X.h=null;X.core=mbWxCore();
  if(!X.on)return;
  if(X.core){try{weatherScene('moba',X.scene);weatherState('calm','moba');X.st='calm'}catch(e){X.core=false}}
  if(!X.core){mbWxRain(0);typeof fxPreload==='function'&&fxPreload(X.ids.map(mbWxId))}
}
const mbWxId=id=>typeof FXDATA!=='undefined'&&FXDATA[id]?id:MBWX.old;
// אריח הגשם של השלב: מחליפים רק כשהשלב משתנה
function mbWxRain(si){const X=MBWX;X.si=si;if(typeof fxMake==='function')X.h=fxMake(mbWxId(X.ids[si]),0,0,{loop:true,fps:24})}
function mbWxTick(dt){
  const X=MBWX,M=MB;if(!X.on||!M)return;
  X.k=mbWxK(M);X.fl=Math.max(0,X.fl-dt/MBWX.flash.t);
  for(const b of X.bolts)b.life-=dt;X.bolts=X.bolts.filter(b=>b.life>0);
  let si=0;X.states.forEach(([k],i)=>{if(X.k>=k)si=i});
  if(X.core){const s=X.states[si][1];if(s!==X.st){X.st=s;try{weatherState(s,'moba')}catch(e){}}}
  else if(si!==X.si)mbWxRain(si);
}
// מבנה נפל: ברק עליו אם רואים אותו, והבזק תמיד (גם בסיס שנופל בסוף)
function mbWxFall(b){
  const X=MBWX;if(!X.on)return;X.falls++;
  const seen=typeof mbVisPt!=='function'||mbVisPt(b.x,b.y),calm=RM||typeof fxLess==='function'&&fxLess();
  if(X.core){try{if(seen)weatherBolt(b.x,b.y,{});else weatherFlash(MBWX.flash.a)}catch(e){}return}   // המנוע: ברק (עם הבזק) רק כשרואים, אחרת רק הבזק. הוא בודק בעצמו RM ו'פחות אפקטים'
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
