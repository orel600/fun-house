/* סקיל חדש מרגיש כמו מתנה (ניר, 1.11.2026: "לחוות סקילים חדשים, הרבה מהחוויה זה הויזואליות"). docs/plan-progression.md, עמוד 3, 3א ו-3ג. בעולם בלבד.
   3א, רגע גילוי: סקיל שהגיבור עוד לא ראה בעולם (בפעם הראשונה בעולם, או נשק חדש שנותן סקיל אחר) עוצר את הזמן לרגע,
     המצלמה מתקרבת, הגיבור מטיל (Ranged_Magic_Summon בתלת-ממד), עמוד אור בצבע סוג הנזק, והאייקון עף לכפתור שלו.
     ההטלה הראשונה אחרי זה גדולה במיוחד. נגיעה בכל מקום מדלגת. פעם אחת לכל סקיל: SAVE.hero.skSeen.
   3ג, סקיל שמתפתח נראה אחרת: כל שתי נקודות בענף של הסקיל בעץ (stats.js) הן דרגה. בכל דרגה הכדור, הפיצוץ והטבעת גדולים יותר,
     והצבע של סוג הנזק (DMG ב-dmg.js) עז ובהיר יותר. בדרגה 2 נוספת טבעת שנייה. רק המראה: הנזק והטווח לא משתנים.
   נקודות החיבור: wskUse ו-wskUpdate (wskill.js), camZoom (camera.js), והגיבור בתלת-ממד (render3d.js, P.skrCast). "פחות אפקטים": skrLess */
const SKREVEAL={
  delay:1.2,       // כמה שניות בעולם לפני שהרגע יכול להתחיל (שלא יתנגש בכניסה)
  dur:1.8,         // כל הרגע, בשניות אמיתיות
  freeze:1.1,      // כמה מזה הזמן עומד
  zoom:1.3,        // כמה המצלמה מתקרבת בשיא (מכפיל)
  zin:0.3,zout:0.4,// כמה שניות לוקח להתקרב ולהתרחק
  cast:1.1,        // אורך ההטלה של הגיבור בתלת-ממד
  anim:'Ranged_Magic_Summon',
  fly:[0.75,1.45], // מתי האייקון עף מהגיבור לכפתור (מתוך dur)
  icon:72,         // גודל האייקון שעף (פיקסלים)
  pillar:{w:46,h:260,rise:0.25},   // עמוד האור בצבע סוג הנזק
  burst:36,        // כמה ניצוצות בפרץ
  first:{r:1.8,dmg:1.5,hops:2,shake:8},   // ההטלה הראשונה: פיצוץ גדול פי r, נזק פי dmg, ברק קופץ ל-hops אויבים נוספים
  less:{zoom:1.12,burst:0.5},             // "פחות אפקטים" (juice.js): פחות קרוב ופחות ניצוצות
  // 3ג: הדרגה של סקיל = נקודות בענף שלו בעץ, חלקי per, עד max
  grade:{per:2,max:3,size:0.14,sat:16,light:7,echo:2},
  branch:{quake:'war',zap:'hunt',splash:'mage',frost:'mage',flame:'mage',
    charge:'war',whirl:'war',shield:'war',volley:'hunt',trap:'hunt',vines:'hunt',spirit:'mage',storm:'mage',meteor:'mage'}   // ספר הסקילים (wskbook.js)
};
let SKR=null;   // הרגע שרץ עכשיו: {id,t0,el,done}
const skrNow=()=>performance.now()/1000;
const skrLess=()=>typeof fxLess==='function'&&fxLess();
const skrSeen=()=>SAVE.hero.skSeen||(SAVE.hero.skSeen=[]);
const skrStat={starts:0,ends:0,skips:0,big:0};   // בשביל הבוט

// נקרא מ-wskUpdate בכל פריים שהעולם רץ: יש סקיל שעוד לא ראינו?
function skrCheck(dt){
  if(SKR||!S.wd||S.room||S.mode!=='play'||!S.sk)return;
  S.skrT=(S.skrT||0)+dt;if(S.skrT<SKREVEAL.delay)return;
  const id=S.sk.ids.find(i=>!skrSeen().includes(i));if(id)skrStart(id);
}
function skrStart(id){
  const K=SKREVEAL,col=skCol(id);
  skrSeen().push(id);saveNow();skrStat.starts++;
  SKR={id,t0:skrNow()};(S.skrBig||(S.skrBig={}))[id]=1;
  S.hitstop=Math.max(S.hitstop||0,K.freeze);P.skrCast=SKR.t0;
  sparks(P.x,P.y-20,col,Math.round(K.burst*(skrLess()?K.less.burst:1)),300);
  sfx('levelup');banner(T('skr.new',T('sk.'+id)),col);
  // האייקון שעף: מתחיל על הגיבור (באמצע המסך) ונוחת על הכפתור שלו
  const el=document.createElement('div');el.className='skrfly';el.style.setProperty('--dt',col);el.style.setProperty('--s',K.icon+'px');
  el.innerHTML=(typeof wsbImg==='function'&&wsbImg(id))||dtSvg(skDef(id).dt);document.body.appendChild(el);SKR.el=el;   // אייקון מצויר לסקילים של הספר (wskbook.js)
  skrBtn(id,true);
}
const skrBtn=(id,hide)=>{const b=document.querySelector('#skills [data-sk="'+id+'"]');if(b)b.classList.toggle('skrwait',hide);return b};
function skrEnd(skip){
  if(!SKR)return;const id=SKR.id;
  if(SKR.el){SKR.el.remove();const b=skrBtn(id,false);if(b){b.classList.remove('ping');void b.offsetWidth;b.classList.add('ping')}}
  if(skip){skrStat.skips++;S.hitstop=0}
  skrStat.ends++;SKR=null;P.skrCast=0;
}
// נגיעה בכל מקום מדלגת
addEventListener('pointerdown',()=>{if(SKR&&skrNow()-SKR.t0>0.15)skrEnd(true)},true);

// כמה המצלמה קרובה עכשיו (camera.js מכפיל בזה). מעוגל, כי כל שינוי מחשב מחדש את גודל הקנבס
function skrZoom(){
  if(!SKR)return 1;const K=SKREVEAL,t=skrNow()-SKR.t0;
  if(t>K.dur+0.3||!S||!S.wd){skrEnd(false);return 1}   // יצאו מהעולם באמצע, או שלא צויר: נגמר
  const top=(skrLess()?K.less.zoom:K.zoom)-1;
  const k=t<K.zin?t/K.zin:t>K.dur-K.zout?Math.max(0,(K.dur-t)/K.zout):1,e=k*k*(3-2*k);
  return Math.round((1+top*e)*50)/50;
}
// נקרא מ-drawWSkill בכל פריים (בזמן אמיתי, גם כשהזמן עומד): עמוד אור, והאייקון בדרך לכפתור
function skrDraw(){
  if(!SKR)return;const K=SKREVEAL,t=skrNow()-SKR.t0;
  if(t>=K.dur||!S.wd){skrEnd(false);return}
  const col=skCol(SKR.id),P_=K.pillar,a=Math.min(1,t/P_.rise)*Math.max(0,1-t/K.dur),h=P_.h*Math.min(1,t/P_.rise);
  ctx.save();ctx.globalCompositeOperation='lighter';
  const g=ctx.createLinearGradient(0,P.y-h,0,P.y);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,col);
  ctx.globalAlpha=a*0.55;ctx.fillStyle=g;ctx.fillRect(P.x-P_.w/2,P.y-h,P_.w,h);
  ctx.globalAlpha=a*0.8;ctx.fillStyle='#fff';ctx.fillRect(P.x-P_.w*0.12,P.y-h,P_.w*0.24,h);
  ctx.globalAlpha=a*0.5;ctx.strokeStyle=col;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(P.x,P.y,30+t*60,(30+t*60)*0.45,0,0,7);ctx.stroke();
  ctx.restore();
  // האייקון: מעל הגיבור, ואז עף בקשת לכפתור
  const el=SKR.el;if(!el)return;
  const b=document.querySelector('#skills [data-sk="'+SKR.id+'"]'),q=b&&b.getBoundingClientRect();
  const x0=innerWidth/2,y0=innerHeight/2-90,x1=q&&q.width?q.left+q.width/2:innerWidth-60,y1=q&&q.width?q.top+q.height/2:innerHeight-60;
  const f=Math.max(0,Math.min(1,(t-K.fly[0])/(K.fly[1]-K.fly[0]))),e=f*f*(3-2*f);
  const pop=Math.min(1,t/0.25),sc=(0.3+0.7*pop)*(1-0.45*e);
  el.style.transform='translate('+(x0+(x1-x0)*e)+'px,'+(y0+(y1-y0)*e-Math.sin(e*Math.PI)*80)+'px) translate(-50%,-50%) scale('+sc+')';
  if(f>=1){el.remove();SKR.el=null;const b2=skrBtn(SKR.id,false);if(b2){b2.classList.remove('ping');void b2.offsetWidth;b2.classList.add('ping')}}   // נחת: הכפתור מופיע. המצלמה עוד מתרחקת
}

/* ---- 3ג: הדרגה של סקיל, והצבע שלו לפי הדרגה ---- */
function skrGrade(id){
  const G=SKREVEAL.grade,b=SKREVEAL.branch[id];if(!b||typeof trHave!=='function')return 0;
  return Math.min(G.max,Math.floor(((trHave()[b]||[]).length)/G.per));
}
const skSize=id=>1+SKREVEAL.grade.size*skrGrade(id);
// צבע סוג הנזק, עז ובהיר יותר בכל דרגה. בלי צבע משלו
function skCol(id){
  const col=dtCol(skDef(id).dt),g=skrGrade(id);if(!g)return col;
  const m=/^#?([0-9a-f]{6})$/i.exec(col);if(!m)return col;
  const n=parseInt(m[1],16),r=(n>>16&255)/255,gr=(n>>8&255)/255,bl=(n&255)/255,mx=Math.max(r,gr,bl),mn=Math.min(r,gr,bl),l=(mx+mn)/2,d=mx-mn;
  let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((gr-bl)/d)%6:mx===gr?(bl-r)/d+2:(r-gr)/d+4;h*=60;if(h<0)h+=360}
  const G=SKREVEAL.grade;
  return 'hsl('+Math.round(h)+','+Math.min(100,Math.round(s*100+G.sat*g))+'%,'+Math.min(80,Math.round(l*100+G.light*g))+'%)';
}
// ההטלה הראשונה אחרי הגילוי: מחזיר את המכפילים ומוחק את הסימן, או null
function skrFirst(id){
  if(!S.skrBig||!S.skrBig[id])return null;delete S.skrBig[id];skrStat.big++;
  S.shake=Math.max(S.shake,SKREVEAL.first.shake);sparks(P.x,P.y-10,skCol(id),Math.round(SKREVEAL.burst*(skrLess()?SKREVEAL.less.burst:1)),360);
  return SKREVEAL.first;
}
