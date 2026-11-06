/* הבאר היבשה במדבר (המתאם, 6.11.2026, לפי docs/concept-regions.md פרק 3: "באר יבשה שפיוחו חופרת בה").
   מגיעים לבאר עם פיוחו: היא רצה אליה, חופרת זמן ארוך מחפירה רגילה (אנימציית dig), ומעלה אוצר לפי רמת הדמות, ולפעמים פריט ציוד.
   אחרי חפירה הבאר מתייבשת לזמן אמיתי (WELL.wait, כמו ייצור בכפר), גם כשהמשחק סגור, ומעליה שעון עם הזמן שנשאר. נשמר ב-SAVE.well.
   בלי חיה שחופרת (פרעוש גונב ולא חופר): הסבר קצר כשמגיעים.
   הבאר עצמה היא המקום well ב-map.marks (map-desert.js), שמצויר כחורבה בתלת-ממד. כאן מצוירים בקנבס רק פי הבאר, הזוהר והשעון.
   חיבור: wellUpdate ב-worldUpdate, wellDraw בציור העולם (world.js), ושורה ב-petDigEnd (pet.js) */

const WELL={
  reg:'desert',mark:'well',
  near:150,                 // מאיזה מרחק מהבאר פיוחו יוצאת לחפור
  wait:2*3600e3,            // כמה זמן אמיתי הבאר יבשה אחרי חפירה (מילישניות)
  dur:3.2,                  // כמה שניות פיוחו חופרת בבאר (חפירה רגילה: PET.dig.dur)
  xp:2,                     // פי כמה XP לחיה מחפירה רגילה
  show:700,                 // מאיזה מרחק רואים את השעון מעל הבאר
  // השלל לפי רמת הדמות (heroLv): הטבלה של השורה האחרונה ש-lv שלה עד הרמה. {משאב:[סיכוי, כמה]} כמו ב-runGive
  bands:[
    {lv:0, loot:{coins:[1,25],bone:[0.7,3],copper:[0.6,3],amberC:[0.5,1],rubyC:[0.35,1],herb:[0.4,2]}},
    {lv:12,loot:{coins:[1,45],iron:[0.6,3],silver:[0.4,2],amberC:[0.6,2],amber:[0.2,1],ruby:[0.15,1]}},
    {lv:25,loot:{coins:[1,80],silver:[0.6,3],gold:[0.35,2],amber:[0.45,1],ruby:[0.3,1],sapphire:[0.2,1],star:[0.04,1]}}
  ],
  gear:0.15,                // סיכוי לפריט ציוד (lootRoll ב-loot.js), הנדיר
  rolls:2,                  // כמה הגרלות של שכבה לפריט, והגבוהה נבחרת
  fx:{dust:0.3,col:'#E8C27A',burst:30,speed:230,pillar:0.8,pillarW:40,pillarH:190,label:''},   // חגיגה קטנה כשהאוצר עולה (נכנסת ל-CELEBRATE ב-fx.js, שנטען אחרי הקובץ הזה)
  r:34,rim:'#8C7A5E',hole:'#2A1D12',glow:'#F4C74F',sand:'#D9B87A',grains:60   // מראה: רדיוס הפה, אבנים, חור, זוהר כשמוכנה, וגרגרי חול ביציאה
};

const WS=()=>SAVE.well||(SAVE.well={next:0,n:0});   // נוצר בפעם הראשונה, כדי ששמירה ישנה תעבוד
const wellHere=()=>!!(S&&S.wd&&S.wd.reg===WELL.reg);
function wellAt(){const M=WR().map;return M&&(M.marks||[]).find(m=>m.id===WELL.mark)}
const wellLeft=()=>Math.max(0,WS().next-Date.now());
const wellCanDig=()=>!!(S.pet&&!petKind().steal);

// כל פריים בעולם: מגיעים עם פיוחו לבאר מוכנה, והיא רצה לחפור. בלי חיה שחופרת: הסבר פעם אחת לכל הגעה
function wellUpdate(dt){
  if(!wellHere()||S.mode!=='play')return;
  const w=wellAt();if(!w)return;
  const W=S.wd.well||(S.wd.well={tip:false,go:0}),near=Math.hypot(P.x-w.x,P.y-w.y)<WELL.near;
  if(!near){W.tip=false;return}
  if(wellLeft()>0)return;
  const p=S.pet;
  if(p&&p.well&&p.st!=='go'&&p.st!=='dig'){p.well=false;p.dur=0}   // השחקן התרחק והיא עזבה את הבאר: אפשר לנסות שוב
  if(!wellCanDig()){if(!W.tip){W.tip=true;floatText(w.x,w.y-70,T('well.hint'),C.gold,14)}return}
  if(p.well||!['idle','follow','sit'].includes(p.st))return;   // עסוקה (נושכת, מריחה, חופרת): מחכים שתסיים
  p.well=true;p.spot={x:w.x,y:w.y+WELL.r*0.4};p.st='go';p.t=0;p.dur=WELL.dur;W.go++;
  floatText(p.x,p.y-48,T(petTx('well.go'),T('pet.name.'+(SAVE.pet.kind||PET.default))),C.gold,14);
}

// מ-petDigEnd (pet.js), כשהחפירה הייתה בבאר. מחזיר true אם טיפל בה
function wellDig(p){
  if(!p.well)return false;
  p.well=false;p.dur=0;p.st='idle';p.t=0;p.spot=null;
  const w=wellAt()||p,x=w.x,y=w.y-10,lv=heroLv(),B=WELL.bands.filter(b=>b.lv<=lv).pop(),n0=drops().length;
  const got=runGive(B.loot,x,y);
  if(Math.random()<WELL.gear*orbitLuck()){const id=lootRoll(WELL.rolls);dropSpawn(id,1,x,y);got.push(id);
    if(feedOn())feedGear(id);else banner(T('loot.gear')+' '+gIcon(id)+' '+gName(id),dropTier(id).col)}
  for(const d of drops().slice(n0))d.pet=true;
  for(let i=0;i<WELL.grains;i++){const a=rand(0,6.28),s=rand(60,220);p.sand.push({x,y,vx:Math.cos(a)*s,vy:-rand(160,320),life:rand(0.5,0.9)})}   // פרץ חול מהבאר
  CELEBRATE.well=WELL.fx;celebrate(x,y,'well');
  floatText(x,y-60,T(petTx('well.found'),T('pet.name.'+(SAVE.pet.kind||PET.default))),C.gold,16);
  const s=WS();s.next=Date.now()+WELL.wait;s.n++;
  p.digs++;p.dug.push(...got);petXP(PET.xp.dig*WELL.xp);
  if(typeof questEvent==='function')questEvent('pet','dig',1);
  saveNow();
  return true;
}

// זמן שנשאר, קצר: 1:42:05 או 12:30
function wellClock(ms){const t=Math.ceil(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60,z=v=>(v<10?'0':'')+v;return h?h+':'+z(m)+':'+z(s):m+':'+z(s)}

// בקואורדינטות העולם: פי הבאר (אבנים וחור), זוהר כשמוכנה, ושעון כשיבשה
function wellDraw(){
  if(!wellHere())return;
  const w=wellAt();if(!w||Math.hypot(P.x-w.x,P.y-w.y)>WELL.show)return;
  const left=wellLeft(),r=WELL.r,t=performance.now()/1000;
  ctx.save();
  if(!left){ctx.globalAlpha=0.25+0.15*Math.sin(t*3);ctx.fillStyle=WELL.glow;ctx.beginPath();ctx.ellipse(w.x,w.y,r*1.9,r*1.0,0,0,7);ctx.fill();ctx.globalAlpha=1}
  ctx.fillStyle=WELL.hole;ctx.beginPath();ctx.ellipse(w.x,w.y,r,r*0.5,0,0,7);ctx.fill();
  ctx.strokeStyle=WELL.rim;ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(w.x,w.y,r+4,r*0.5+3,0,0,7);ctx.stroke();
  ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.direction=DIR;ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,0.65)';
  const txt=left?'⏳ '+wellClock(left):'🐾',ty=w.y-r-26+(left?0:Math.sin(t*4)*4);
  ctx.strokeText(txt,w.x,ty);ctx.fillStyle=left?'#F4F1EA':WELL.glow;ctx.fillText(txt,w.x,ty);
  ctx.restore();
}
