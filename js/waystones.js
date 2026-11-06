/* אבני מסע (WAYSTONES): בעולם גדול ההליכה בפעם העשירית מעייפת, ומוות שולח רחוק (docs/concept-meadow.md, "אבני מסע").
   המקומות בנתוני האזור: WORLD.waystones (האחו) ו-WORLD.regions[r].waystones ב-world.js, כל אחת {id,x,y}. השם ב-lang.js ('ws.<id>').
   אבן נפתחת כשמגיעים אליה ברגל (celebrate ב-fx.js), ונשמרת ב-SAVE.ways.open ('<אזור>.<id>').
   קפיצה: כל אבן פתוחה מופיעה בחלון הקפיצה האחד (travelWin ב-travel.js). ליד אבן פתוחה, כפתור 🗿 בסרגל התחתון פותח אותו. לא באמצע קרב (travelBlock).
   קימה: מוות בעולם מקים באבן הפתוחה הקרובה באותו אזור, ולא בכפר (wsRespawn, מ-wRespawn ב-world.js). העונש על התרמיל לא משתנה.
   גם הערפל של מפת העולם כאן: רשת גסה לכל אזור ב-SAVE.ways.fog, שנפתחת סביב השחקן (wsFog*). הציור במפה: wsMapDraw, מ-wmDrawHere ב-worldmap.js.
   החיבורים: worldUpdate, drawWorld ו-wRespawn ב-world.js, wmDraw ו-wmDrawHere ב-worldmap.js, travelDests ב-travel.js, והכפתור #wsBtn ב-index.html */

const WAYSTONES={
  open:70,           // מאיזה מרחק אבן נפתחת
  near:110,          // מאיזה מרחק מאבן פתוחה מופיע הכפתור 🗿
  arrive:90,         // כמה פיקסלים מתחת לאבן מגיעים
  r:20,              // רוחב הציור בעולם
  col:'#7FE0C8',     // הזוהר של אבן פתוחה (לא סוג נזק: צבע של מקום, כמו הפנסים)
  dot:8,             // גודל אבן במפה, בפיקסלים
  fog:{cell:150,see:420,save:5,col:'#05070Df0'},   // ערפל במפה: גודל משבצת, כמה רחוק רואים, כל כמה שניות לשמור, וצבע
  fx:{dust:0,burst:30,speed:240,pillar:0.9,pillarW:44,pillarH:240,label:''}
};

const WSS=()=>SAVE.ways||(SAVE.ways={open:{},fog:{}});
const wsReg=r=>r==='meadow'?WORLD:WORLD.regions[r];
// האבנים של אזור. אזורים יורשים מ-WORLD, אז אבן של האחו לא נחשבת לאזור אחר. עומק הצל (depths.js): בלי אבנים
function wsList(r){if(r==='meadow')return WORLD.waystones||[];const R=WORLD.regions[r];return R&&!/^dp_/.test(r)&&R.waystones!==WORLD.waystones?R.waystones||[]:[]}
const wsKey=(r,s)=>r+'.'+s.id;
const wsIsOpen=(r,s)=>!!WSS().open[wsKey(r,s)];
// כל האבנים הפתוחות, בכל האזורים, לפי סדר האזורים: [{r,s,k}]
function wsOpenAll(){const o=[];for(const r of ['meadow',...Object.keys(WORLD.regions)])for(const s of wsList(r))if(wsIsOpen(r,s))o.push({r,s,k:wsKey(r,s)});return o}
const wsFind=k=>wsOpenAll().find(o=>o.k===k);
// האבן הפתוחה שלידה עומדים, או null
function wsHere(){if(!S||!S.wd)return null;for(const s of wsList(S.wd.reg))if(wsIsOpen(S.wd.reg,s)&&Math.hypot(P.x-s.x,P.y-s.y)<WAYSTONES.near+P.r)return s;return null}

// החגיגה של אבן (CELEBRATE ב-fx.js, שנטען אחרי הקובץ הזה)
const wsFx=()=>{CELEBRATE.waystone=CELEBRATE.waystone||Object.assign({col:WAYSTONES.col},WAYSTONES.fx);return 'waystone'};

/* ---- הקפיצה: אותו הבזק כמו בפנסים (travelFlash), בצבע של האבנים ---- */
function wsPlace(s){P.x=s.x;P.y=s.y+WAYSTONES.arrive;placeClamp(P);S.cam.x=P.x;S.cam.y=P.y;joy=null}
function wsGo(k){
  const o=wsFind(k),col=WAYSTONES.col;if(!o||trBusy||!S||travelBlock())return false;
  trBusy=true;joy=null;travelFlash(col,P.x,P.y);
  setTimeout(()=>{
    trBusy=false;const f=$('trFlash');f.classList.remove('on');f.classList.add('out');setTimeout(()=>{f.hidden=true},TRAVEL.flash*1000);
    if(S.vil)villageUi(false);
    if(!S.wd||S.wd.reg!==o.r){if(S.wd)worldUi(false);enterWorld('home',o.r)}else wmapOpen(false);
    wsPlace(o.s);banner(T('ws.at',T('ws.'+o.s.id)+' · '+T('wm.short.'+o.r)),col);celebrate(P.x,P.y,'travel'+col);sfx('celebrate');
  },TRAVEL.flash*1000);
  return true;
}
// קימה אחרי מוות בעולם: האבן הפתוחה הקרובה למקום שבו מתת, באותו אזור. false: אין, וקמים בכפר כמו קודם
function wsRespawnAt(){if(!S||!S.wd)return null;let b=null,bd=1e9;for(const s of wsList(S.wd.reg))if(wsIsOpen(S.wd.reg,s)){const d=Math.hypot(P.x-s.x,P.y-s.y);if(d<bd){bd=d;b=s}}return b}
function wsRespawn(){
  const s=wsRespawnAt();if(!s)return false;const r=S.wd.reg;
  worldUi(false);enterWorld('home',r);wsPlace(s);banner(T('ws.woke',T('ws.'+s.id)),WAYSTONES.col);celebrate(P.x,P.y,wsFx());
  return true;
}
// הכפתור במסך המוות: "לקום באבן" כשיש אבן פתוחה באזור, אחרת "לקום בכפר" (worldDeath ב-world.js)
function wsDeathLabel(){$('wRespawn').textContent=wsRespawnAt()?T('ws.respawn'):T('w.respawn')}

/* ---- בעולם: פתיחה, ערפל וכפתור (מ-worldUpdate) ---- */
let wsFogT=0,wsFogDirty=false,wsFogCell='';
function wsUpdate(dt){
  const r=S.wd.reg;
  for(const s of wsList(r))if(!wsIsOpen(r,s)&&Math.hypot(P.x-s.x,P.y-s.y)<WAYSTONES.open+P.r){
    WSS().open[wsKey(r,s)]=1;
    celebrate(s.x,s.y,wsFx());banner(T('ws.found',T('ws.'+s.id)),WAYSTONES.col);sfx('celebrate');saveNow()}
  wsFogSee(r);
  if((wsFogT-=dt)<=0&&wsFogDirty){wsFogDirty=false;wsFogT=WAYSTONES.fog.save;saveNow()}
  const b=$('wsBtn'),on=!!wsHere()&&S.mode==='play';
  if(b.hidden===!on&&b.dataset.lang===LANG)return;
  b.hidden=!on;b.dataset.lang=LANG;if(on){b.style.setProperty('--trc',WAYSTONES.col);b.innerHTML='<span class="ni" aria-hidden="true">🗿</span>'+T('ws.btn');b.setAttribute('aria-label',T('ws.btnAria'))}
}
function wsOff(){$('wsBtn').hidden=true}
$('wsBtn').addEventListener('click',()=>{if(S.wd)travelWin(true)});   // חלון הקפיצה האחד (travel.js)

/* ---- הערפל: '1' למשבצת שהתגלתה. אזור שגודלו השתנה (ת9) מתחיל מחדש ---- */
function wsFogGrid(r){
  const R=wsReg(r);if(!R||/^dp_/.test(r))return null;
  const c=WAYSTONES.fog.cell,cols=Math.ceil(R.size.w/c),rows=Math.ceil(R.size.h/c),F=WSS().fog||(WSS().fog={});
  let g=F[r];if(!g||g.c!==cols||g.s.length!==cols*rows)g=F[r]={c:cols,s:'0'.repeat(cols*rows)};
  return{g,cols,rows,c,x0:-R.size.w/2,y0:-R.size.h/2};
}
function wsFogSee(r){
  const G=wsFogGrid(r);if(!G)return;const cx=Math.floor((P.x-G.x0)/G.c),cy=Math.floor((P.y-G.y0)/G.c),key=r+cx+','+cy;
  if(key===wsFogCell)return;wsFogCell=key;   // רק כשעוברים משבצת
  const n=Math.ceil(WAYSTONES.fog.see/G.c),a=G.g.s.split('');let ch=false;
  for(let j=Math.max(0,cy-n);j<=Math.min(G.rows-1,cy+n);j++)for(let i=Math.max(0,cx-n);i<=Math.min(G.cols-1,cx+n);i++){
    const mx=G.x0+(i+0.5)*G.c,my=G.y0+(j+0.5)*G.c;if(Math.hypot(mx-P.x,my-P.y)<=WAYSTONES.fog.see+G.c*0.5&&a[j*G.cols+i]!=='1'){a[j*G.cols+i]='1';ch=true}}
  if(ch){G.g.s=a.join('');wsFogDirty=true}
}
function wsFogSeen(r,x,y){const G=wsFogGrid(r);if(!G)return true;const i=Math.floor((x-G.x0)/G.c),j=Math.floor((y-G.y0)/G.c);return i<0||j<0||i>=G.cols||j>=G.rows||G.g.s[j*G.cols+i]==='1'}

/* ---- ציור בעולם (מ-drawWorld, בקואורדינטות העולם): עמוד אבן, זוהר כשפתוחה ---- */
function wsDraw(){
  const r=S.wd.reg,W=WAYSTONES.r,t=fxNow();
  for(const s of wsList(r)){const on=wsIsOpen(r,s),x=s.x,y=s.y;
    ctx.save();ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(x,y+4,W,W*0.4,0,0,7);ctx.fill();
    if(on){ctx.shadowColor=WAYSTONES.col;ctx.shadowBlur=14+Math.sin(t*3)*5}
    ctx.fillStyle=on?'#4D5A66':'#3A3F4A';ctx.beginPath();ctx.moveTo(x-W*0.55,y);ctx.lineTo(x-W*0.4,y-W*2.2);ctx.lineTo(x,y-W*2.6);ctx.lineTo(x+W*0.4,y-W*2.2);ctx.lineTo(x+W*0.55,y);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle=on?WAYSTONES.col:'#6A7080';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-W*2);ctx.lineTo(x,y-W*0.7);ctx.moveTo(x-W*0.25,y-W*1.6);ctx.lineTo(x+W*0.25,y-W*1.2);ctx.stroke();
    ctx.restore()}
}

/* ---- במפת העולם (worldmap.js): ערפל, מאורות עם טיימר, ואבנים פתוחות. at: מעולם לקנבס, k: קנה מידה ---- */
function wsMapFog(x,at,k){
  const G=wsFogGrid(S.wd.reg);if(!G)return;x.fillStyle=WAYSTONES.fog.col;
  for(let j=0;j<G.rows;j++)for(let i=0;i<G.cols;i++)if(G.g.s[j*G.cols+i]!=='1'){const p=at(G.x0+i*G.c,G.y0+j*G.c);x.fillRect(p.x-0.5,p.y-0.5,G.c*k+1,G.c*k+1)}
}
function wsMapDraw(x,at){
  const r=S.wd.reg;
  // מאורות בוסים: ☠️ כשהבוס בחוץ, ⏳ עם הזמן כשהוא עוד חוזר (giantLeft ו-giantTime ב-giant.js, GIANT.ladder)
  for(const kk in STORY.lanterns){const L=STORY.lanterns[kk];if(L.reg!==r||!wsFogSeen(r,L.x,L.y))continue;
    const left=giantLeft(kk),c=at(L.x,L.y);
    wmText(x,left>0?'⏳ '+giantTime(left):'☠️',c.x,c.y-WMAP.dot.lantern-10,12,left>0?C.chalk:C.ember)}
  for(const s of wsList(r))if(wsIsOpen(r,s)){const c=at(s.x,s.y),d=WAYSTONES.dot;
    x.save();x.shadowColor=WAYSTONES.col;x.shadowBlur=10;x.beginPath();x.moveTo(c.x,c.y-d*1.3);x.lineTo(c.x+d*0.7,c.y+d*0.7);x.lineTo(c.x-d*0.7,c.y+d*0.7);x.closePath();
    x.fillStyle=WAYSTONES.col;x.fill();x.restore();x.lineWidth=1.5;x.strokeStyle='#000a';x.stroke();
    }
}
// השורה מתחת למפות: הקפיצה עברה לחלון האחד (travelMapRow ב-travel.js)
const wsMapRow=()=>'';
