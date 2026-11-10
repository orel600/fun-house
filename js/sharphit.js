/* מכה חדה (SHARP, ניר 10.11.2026: "חד אבל קריא"): רגע מגע ברור למכה הרגילה ולסקיל, בכל מחלקה (חרב/גרזן/פטיש וקשת), רק בעולם.
   - כיוון: פס אור קצר וחד שעובר דרך נקודת המגע בכיוון המכה (חרב רחב וקצר, חץ דק וארוך).
   - הבזק: ליבה לבנה קטנה וקרניים בצבע סוג הנזק, לשבריר שנייה. בלי הבזק מסך, בלי שכבה אטומה.
   - האויב נרתע: הנטייה של hitfeel.js חזקה יותר (מגדילים את e.hfK, לא מוסיפים מערכת).
   - סקיל ברור יותר מהמכה הרגילה: הבזק כפול בגודל, יותר קרניים, טבעת הדף, רתיעה חזקה וארוכה, ופגיעה גדולה מהספרייה (whit_<סוג>) פעם אחת להטלה.
   לא מוסיפים עצירה ולא רעידה: אלה של juice.js. "הפחתת תנועה" (calmOn): בלי רתיעה נוספת ובלי טבעת מתרחבת. "פחות אפקטים": חצי קרניים, בלי טבעת.
   תקרה: SHARP.max על המסך ו-SHARP.perFrame חדשים בפריים, בשביל 120 FPS בקרב צפוף.
   חיבור: עוטף מבחוץ את damage (לדעת מה פגע) ואת juiceHit ו-juiceDraw. מחיקה: הקובץ והשורה ב-index.html */
const SHARP={
  on:true,
  max:18,perFrame:5,          // כמה אפקטים על המסך, וכמה חדשים בפריים
  basic:{
    sword:{len:46,w:7,life:0.09,core:9,rays:4,ray:20,lean:0.17},   // הנפה: פס רחב וקצר
    gun:{len:58,w:4,life:0.08,core:7,rays:3,ray:16,lean:0.14}      // חץ: פס דק וארוך
  },
  skill:{len:70,w:9,life:0.16,core:18,rays:8,ray:40,ring:62,lean:0.3,leanT:0.32,heavy:{size:150,gap:0.15}},   // heavy: פגיעה גדולה מהגיליון של סוג הנזק (whit_<סוג> של fxcombat.js), לא hit_heavy הזהוב: זהב שמור לשלל,
  alpha:0.95,
  hero:{clear:56,min:0.2}   // הגיבור נשאר גלוי בקרב צפוף: אפקט שמרכזו קרוב מ-clear לגיבור דועך עד min, ובלי פגיעה גדולה מהספרייה
};
const SH={w:null,list:[],fr:-1,frN:0,heavyT:-9,stat:{basic:0,skill:0,heavy:0,capped:0,lean:0}};
const shOn=()=>SHARP.on&&!!S&&!!S.wd&&!S.mb&&S.mode==='play';
const shCalm=()=>typeof calmOn==='function'?calmOn():(typeof RM!=='undefined'&&RM);
const shLess=()=>typeof fxLess==='function'&&fxLess();

// מה פגע עכשיו: damage קורא ל-juiceHit מבפנים, אז שומרים את הנשק לרגע הקריאה
const sh0Dmg=damage;
damage=function(e,base,w){const p=SH.w;SH.w=w;try{return sh0Dmg.apply(this,arguments)}finally{SH.w=p}};

const sh0Hit=juiceHit;
juiceHit=function(e,d,m,crit,t,ang){
  const J=sh0Hit.apply(this,arguments);
  try{if(J&&shOn()&&m>=1&&!e.node)shAdd(e,SH.w,t,ang||0,crit)}catch(_){}
  return J};
function shAdd(e,w,t,ang,crit){
  const sk=w==='skill',B=sk?SHARP.skill:SHARP.basic[w==='gun'?'gun':w==='sword'?'sword':null];if(!B)return;   // חיה, חפץ מסתובב, פצצה: לא כאן
  const fr=typeof S.frame==='number'?S.frame:Math.round(jNow()*120);
  if(fr!==SH.fr){SH.fr=fr;SH.frN=0}
  if(SH.frN>=SHARP.perFrame){SH.stat.capped++;return}SH.frN++;
  if(SH.list.length>=SHARP.max)SH.list.shift();
  const cx=e.x,cy=e.y-e.r*0.6;   // על האויב עצמו, לא בצד שפונה לגיבור
  SH.list.push({x:cx,y:cy,a:ang,t0:jNow(),B,sk,col:dtCol(t),crit:!!crit,seed:Math.random()*6.28});
  sk?SH.stat.skill++:SH.stat.basic++;
  // הרתיעה: חזקה יותר מזו של hitfeel.js (שכבר התחילה בתוך juiceHit). בלי בוס, וכבוי בהפחתת תנועה
  if(!shCalm()&&e.hfT&&!e.isBoss){const k=B.lean*(crit?1.2:1)/(e.big||1);if(k>(e.hfK||0)){e.hfK=k;SH.stat.lean++}if(sk&&B.leanT)e.hfD=Math.max(e.hfD||0,B.leanT)}
  // סקיל: פיצוץ כבד מהספרייה, פעם אחת להטלה (לא על כל אויב בקבוצה)
  const H=sk&&B.heavy,now=jNow();
  if(H&&now-SH.heavyT>H.gap&&Math.hypot(cx-P.x,cy-P.y)>SHARP.hero.clear&&typeof fxPlay==='function'&&!(typeof fxcRoom==='function'&&!fxcRoom())){SH.heavyT=now;SH.stat.heavy++;
    const id=typeof FXC!=='undefined'&&FXC.type[t]?'whit_'+FXC.type[t]:null;
    if(id)try{fxPlay(id,cx,cy,{size:H.size*(shLess()?0.75:1),add:true,rot:SH.list[SH.list.length-1].seed})}catch(_){}}
}

const sh0Draw=juiceDraw;
juiceDraw=function(){sh0Draw.apply(this,arguments);if(SH.list.length)try{shDraw()}catch(_){}};
function shDraw(){
  const now=jNow(),less=shLess(),calm=shCalm();let j=0;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(const f of SH.list){const B=f.B,k=(now-f.t0)/B.life;if(k>=1||k<0)continue;SH.list[j++]=f;
    const hd=Math.hypot(f.x-P.x,f.y-P.y),hc=SHARP.hero,a=(1-k)*(hd<hc.clear?Math.max(hc.min,hd/hc.clear):1),ca=Math.cos(f.a),sa=Math.sin(f.a),K=f.crit?1.2:1;   // ליד הגיבור: דועך
    // פס הכיוון: נפתח מהר לאורך המכה ונעלם. צבע בחוץ, לבן בפנים
    const L=B.len*K*(0.55+0.45*Math.min(1,k*4)),x0=f.x-ca*L*0.55,y0=f.y-sa*L*0.55,x1=f.x+ca*L*0.45,y1=f.y+sa*L*0.45;
    ctx.globalAlpha=SHARP.alpha*a;ctx.strokeStyle=f.col;ctx.lineWidth=B.w*K*a+1;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1,B.w*K*0.4*a);ctx.beginPath();ctx.moveTo(x0+ca*L*0.2,y0+sa*L*0.2);ctx.lineTo(x1,y1);ctx.stroke();
    // הבזק: ליבה וקרניים
    const rays=less?Math.ceil(B.rays/2):B.rays,R=B.ray*K*(0.6+0.6*k);
    ctx.strokeStyle=f.col;ctx.lineWidth=f.sk?3:2;ctx.beginPath();
    for(let i=0;i<rays;i++){const ra=f.seed+i*6.283/rays;ctx.moveTo(f.x+Math.cos(ra)*R*0.35,f.y+Math.sin(ra)*R*0.35);ctx.lineTo(f.x+Math.cos(ra)*R,f.y+Math.sin(ra)*R)}
    ctx.stroke();
    ctx.fillStyle='#fff';ctx.globalAlpha=SHARP.alpha*a*a;ctx.beginPath();ctx.arc(f.x,f.y,B.core*K*(1-k*0.5),0,7);ctx.fill();
    if(f.sk&&B.ring&&!less){const rr=calm?B.ring*0.7:B.ring*(0.3+0.7*Math.sqrt(k));
      ctx.globalAlpha=0.7*a;ctx.strokeStyle=f.col;ctx.lineWidth=4*a+1;ctx.beginPath();ctx.ellipse(f.x,f.y+6,rr,rr*0.55,0,0,7);ctx.stroke()}}
  SH.list.length=j;ctx.restore();
}
