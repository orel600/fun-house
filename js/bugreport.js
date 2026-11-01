/* דיווח באג (ניר, 1.11.2026): כפתור 🐞 בהגדרות. נגיעה אחת בונה דוח קצר באנגלית (בשביל Claude) ומשתפת אותו עם צילום מסך,
   או מעתיקה ללוח. בדוח מה שצילום מסך לא מראה: גרסה, מכשיר, איפה השחקן, השגיאות האחרונות, מה קרה לפני רגע, ו-FPS.
   נטען מוקדם (מיד אחרי version.js), כדי לתפוס גם שגיאות בטעינה. לא נוגע במשחק: רק קורא את P, S, SAVE ועוד, ובודק שהם קיימים.
   אירועי המשחק (מקום, אזור, מוות, חלון) נאספים בבדיקה כל חצי שנייה, בלי לגעת בקבצים אחרים. */
const BUG={
  maxErr:30,      // כמה שגיאות שומרים (הישנות נזרקות)
  maxEv:20,       // כמה אירועי משחק שומרים
  stack:3,        // כמה שורות מה-stack לכל שגיאה
  poll:500,       // כל כמה מילישניות בודקים אם משהו השתנה (מקום, אזור, חלון)
  hold:2000,      // לחיצה ארוכה על מספר הגרסה בהגדרות: גם היא שולחת דוח
  errs:[],ev:[],fps:0,last:{}
};
const bugT=()=>{const d=new Date();return d.toTimeString().slice(0,8)};
function bugPush(a,max,x){a.push(x);if(a.length>max)a.shift()}
function bugErr(kind,msg,stack){
  msg=String(msg||'').slice(0,300);
  const st=String(stack||'').split('\n').map(s=>s.trim()).filter(s=>s&&!msg.includes(s)).slice(0,BUG.stack).join(' | ').replace(/https?:\/\/[^/]+\//g,'');
  const prev=BUG.errs[BUG.errs.length-1];
  if(prev&&prev.kind===kind&&prev.msg===msg){prev.n++;prev.t=bugT();return}   // אותה שגיאה בכל פריים: שורה אחת עם מונה
  bugPush(BUG.errs,BUG.maxErr,{t:bugT(),kind,msg,st,n:1});
}
window.addEventListener('error',e=>bugErr('error',e.message+(e.filename?' @'+e.filename.split('/').pop()+':'+e.lineno:''),e.error&&e.error.stack));
window.addEventListener('unhandledrejection',e=>{const r=e.reason;bugErr('promise',r&&r.message||r,r&&r.stack)});
for(const k of ['error','warn']){const o=console[k];console[k]=function(...a){
  try{bugErr(k,a.map(x=>x instanceof Error?x.message:typeof x==='object'?(()=>{try{return JSON.stringify(x)}catch(_){return String(x)}})():String(x)).join(' '),(a.find(x=>x instanceof Error)||{}).stack)}catch(_){}
  return o.apply(this,a)}}
// FPS: סופרים פריימים בחלון של 2 שניות. זול: קריאה אחת לכל פריים
(()=>{let n=0,t0=performance.now();const f=now=>{n++;if(now-t0>=2000){BUG.fps=Math.round(n*1000/(now-t0));n=0;t0=now}requestAnimationFrame(f)};requestAnimationFrame(f)})();

// איפה השחקן עכשיו, במילים
function bugPlace(){
  if(typeof S==='undefined'||!S)return'loading';
  if(S.room)return'bonus room';
  if(S.vil)return'village';
  if(S.wd)return'world:'+S.wd.reg;
  return S.mode==='title'?'title':'arena';
}
function bugWins(){return typeof WINS==='undefined'?'':WINS.filter(w=>{const el=document.getElementById(w.id);return el&&!el.hidden}).map(w=>w.id).join(',')}
// אירועי משחק: בודקים מה השתנה, ורושמים רק שינוי
setInterval(()=>{try{
  const now={place:bugPlace(),mode:typeof S!=='undefined'&&S?S.mode:'',win:bugWins()},L=BUG.last;
  if(L.place!==undefined){
    if(now.place!==L.place)bugPush(BUG.ev,BUG.maxEv,bugT()+' place: '+L.place+' → '+now.place);
    if(now.mode!==L.mode)bugPush(BUG.ev,BUG.maxEv,bugT()+' mode: '+L.mode+' → '+now.mode+(now.mode==='over'?' (died / run ended)':''));
    if(now.win!==L.win&&now.win)bugPush(BUG.ev,BUG.maxEv,bugT()+' window: '+now.win);
  }
  BUG.last=now}catch(e){}},BUG.poll);

const bugN=v=>typeof v==='number'?Math.round(v):v;
function bugNear(){
  if(typeof enemies==='undefined'||!enemies||!P)return'none';
  let b=null,bd=1e9;for(const e of enemies){if(!e||e.dead)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(e.boss||e===S.boss){b=e;bd=d;break}if(d<bd){bd=d;b=e}}
  return b?(b.type||'?')+(b.boss||b===S.boss?' (BOSS)':'')+' hp '+bugN(b.hp)+'/'+bugN(b.max)+' dist '+bugN(bd)+' · '+enemies.length+' enemies':'none';
}
// הדוח עצמו: שורות קצרות, באנגלית
function bugReport(){
  const g=(f,d='?')=>{try{const v=f();return v===undefined||v===null||v===''?d:v}catch(e){return d}};
  const sv=typeof SAVE!=='undefined'?SAVE:{};
  const L=[];
  L.push('🐞 fun-house bug report');
  L.push('version: v'+g(()=>VERSION)+g(()=>UPD.next?' (newer on server: '+UPD.next+')':'',''));
  L.push('time: '+new Date().toLocaleString('en-GB'));
  L.push('device: '+navigator.userAgent);
  L.push('screen: '+innerWidth+'×'+innerHeight+' @'+devicePixelRatio+'x · '+(matchMedia('(display-mode: standalone)').matches?'app (PWA)':'browser'));
  L.push('gfx: '+g(()=>R3D.on?'3D':'2D')+' · camera '+g(()=>CAM.cur)+' · look '+g(()=>HD.on?[...HD.parts].join('+'):'classic')+' · lang '+g(()=>LANG));
  L.push('');
  L.push('place: '+bugPlace()+' · mode '+g(()=>S.mode)+(bugWins()?' · open: '+bugWins():''));
  L.push('player: x '+g(()=>bugN(P.x))+' y '+g(()=>bugN(P.y))+' · hp '+g(()=>bugN(P.hp))+'/'+g(()=>bugN(P.maxHp))+' · hero lv '+g(()=>sv.hero.level)+' · weapon '+g(()=>sv.gear.weapon,'none'));
  L.push('quest: '+g(()=>sv.quests.track,'none')+' · active '+g(()=>Object.keys(sv.quests.active).join(',')||'none'));
  L.push('story: '+g(()=>Object.keys(sv.story).filter(k=>sv.story[k]===true).join(',')||'start'));
  L.push('nearest: '+g(bugNear,'none'));
  L.push('fps: '+(BUG.fps||'?'));
  L.push('');
  L.push('errors ('+BUG.errs.length+'):');
  if(!BUG.errs.length)L.push('  none');
  for(const e of BUG.errs)L.push('  '+e.t+' ['+e.kind+(e.n>1?' ×'+e.n:'')+'] '+e.msg+(e.st?'\n     at '+e.st:''));
  L.push('');
  L.push('recent events:');
  if(!BUG.ev.length)L.push('  none');
  for(const e of BUG.ev)L.push('  '+e);
  return L.join('\n');
}
// צילום מסך: התלת-ממד מתחת והקנבס מעליו, בתמונה אחת
function bugShot(){return new Promise(ok=>{try{
  const c2=document.getElementById('c');if(!c2||!c2.width)return ok(null);
  const o=document.createElement('canvas');o.width=c2.width;o.height=c2.height;const x=o.getContext('2d');
  try{if(typeof R3D!=='undefined'&&R3D.on&&R3D.r&&R3D.scene&&R3D.cam){R3D.r.render(R3D.scene,R3D.cam);x.drawImage(R3D.r.domElement,0,0,o.width,o.height)}}catch(e){}   // באותו רגע אחרי הציור, אחרת התמונה ריקה
  x.drawImage(c2,0,0);
  o.toBlob(b=>ok(b),'image/png');
}catch(e){ok(null)}})}
async function bugSend(){
  const txt=bugReport();BUG.lastText=txt;
  const say=k=>{try{banner(T(k))}catch(e){}};
  try{
    const blob=await bugShot(),file=blob&&typeof File!=='undefined'?new File([blob],'fun-house-bug.png',{type:'image/png'}):null;
    if(navigator.share){
      const d={title:'fun-house bug',text:txt};
      if(file&&navigator.canShare&&navigator.canShare({files:[file]}))d.files=[file];
      try{await navigator.share(d);bugCopy(txt);say('bug.shared');return}catch(e){if(e&&e.name==='AbortError'){bugCopy(txt);say('bug.copied');return}}
    }
  }catch(e){}
  say(await bugCopy(txt)?'bug.copied':'bug.fail');
}
async function bugCopy(txt){
  try{await navigator.clipboard.writeText(txt);return true}catch(e){}
  try{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();return ok}catch(e){return false}
}
// חיבור לכפתור בהגדרות, וללחיצה ארוכה על מספר הגרסה שם
document.addEventListener('DOMContentLoaded',()=>{
  const b=document.getElementById('bugBtn');if(b)b.addEventListener('click',e=>{e.stopPropagation();bugSend()});
  const v=document.getElementById('updLine');if(!v)return;let t=null;
  const stop=()=>{clearTimeout(t);t=null};
  v.addEventListener('pointerdown',()=>{stop();t=setTimeout(()=>{t=null;bugSend()},BUG.hold)});
  for(const k of ['pointerup','pointerleave','pointercancel'])v.addEventListener(k,stop);
});
