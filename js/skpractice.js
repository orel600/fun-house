/* אימון סקיל (רעיון מדוח המבקר, 2.11.2026): אחרי רגע הגילוי של סקיל חדש, אפשר לנסות אותו 20 שניות על שלוש בובות אימון.
   אופציונלי: נפתח רק מהכרטיס "לנסות" (skguide.js), ו-✕ מדלג. בעולם בלבד.
   הבובות הן אויבים רגילים (כדי שהסקילים, השילובים והרונות יעבדו עליהן כמו על כל אויב), אבל לא זזות, לא פוגעות ולא מתות,
   ולכן אין מהן שלל, XP או קווסט. בזמן האימון הקירור של הסקיל מהיר יותר. שילוב ראשון = חגיגה ומטבעות.
   נקודות החיבור: skpUpdate ב-wskUpdate, skpDraw ב-drawWSkill (wskill.js). הטקסט ב-lang.js ('skp.*') */
const SKPRACTICE={
  t:20,          // שניות
  n:3,           // כמה בובות
  dist:120,      // כמה רחוק מהגיבור
  type:'grunt',  // מה הבובה בפנים (החומרים שלה קובעים חולשות, data.js)
  cdK:2.5,       // הקירור של הסקיל שמתאמנים בו מהיר פי זה
  coins:15,      // פרס על השילוב הראשון
  // הרמז לכל סקיל: איזה שילוב לנסות. מה שלא כאן מקבל את הרמז הכללי
  hint:{charge:'shatter',shield:'shatter',trap:'shatter',volley:'pin',vines:'pin',spirit:'steam',meteor:'steam',storm:'shock',zap:'shock',splash:'shock',whirl:'melt',flame:'melt',frost:'melt'}
};
let SKP=null;   // האימון שרץ: {id,t,dummies,c0,combo}
const skpStat={starts:0,ends:0,combos:0};   // בשביל הבוט
const skpCan=()=>!!(S&&S.wd&&!S.room&&S.mode==='play'&&!SKP);
const skpCombos=()=>Object.values((S.sk&&S.sk.combos)||{}).reduce((a,b)=>a+b,0);

function skpStart(id){
  if(!skpCan()||!SKILLS.list[id]||!ETYPES[SKPRACTICE.type])return false;
  const K=SKPRACTICE,a0=Math.random()*6.28,ds=[];
  for(let i=0;i<K.n;i++){const a=a0+i*Math.PI*2/K.n,x=P.x+Math.cos(a)*K.dist,y=P.y+Math.sin(a)*K.dist*0.7;
    const e=addEnemy(K.type,x,y);Object.assign(e,{dummy:1,hx:x,hy:y,home:0,hp:1e9,max:1e9,speed:0,dmg:0,xp:0,champ:false,shoot:1e9,r:ETYPES[K.type].r});
    sparks(x,y,C.gold,8,160);ds.push(e)}
  const i=S.sk.ids.indexOf(id);if(i>=0)S.sk.cd[i]=0;
  SKP={id,t:K.t,dummies:ds,c0:skpCombos(),combo:false};skpStat.starts++;
  skpBar();sfx('ui');return true;
}
function skpEnd(skip){
  if(!SKP)return;
  for(const e of SKP.dummies)if(!e.dead){e.dead=true;e.gone=true;if(S.wd)sparks(e.x,e.y,C.dim,8,140)}
  SKP=null;skpStat.ends++;skpBar();
  if(!skip&&S.wd)banner(T('skp.done'),C.gold);
}
// כל פריים בעולם (מ-wskUpdate)
function skpUpdate(dt){
  if(!SKP)return;
  if(!S.wd||S.room||!S.sk){skpEnd(true);return}
  SKP.t-=dt;
  for(const e of SKP.dummies){if(e.dead)continue;e.x=e.hx;e.y=e.hy;e.kx=e.ky=0;e.hp=e.max}   // לא זזות, לא נהדפות ולא מתות
  const i=S.sk.ids.indexOf(SKP.id);if(i>=0&&S.sk.cd[i]>0)S.sk.cd[i]=Math.max(0,S.sk.cd[i]-dt*(SKPRACTICE.cdK-1));
  if(!SKP.combo&&skpCombos()>SKP.c0){SKP.combo=true;skpStat.combos++;bagAdd('coins',SKPRACTICE.coins);
    celebrate(P.x,P.y-30,'quest','+'+SKPRACTICE.coins+' 🪙')}
  if(SKP.t<=0||SKP.dummies.every(e=>e.dead)){skpEnd(false);return}
  skpBar();
}
// השורה למעלה: מה לנסות, כמה זמן נשאר, ו-✕
function skpBar(){
  let el=$('skpBar');
  if(!SKP){if(el)el.hidden=true;return}
  if(!el){el=document.createElement('div');el.id='skpBar';el.className='skoffer skpbar';document.body.appendChild(el);
    el.addEventListener('click',e=>{if(e.target.closest('[data-skp="x"]')){e.stopPropagation();skpEnd(true);sfx('ui')}})}
  const h=SKPRACTICE.hint[SKP.id],s=String(Math.ceil(Math.max(0,SKP.t)));
  if(el.dataset.k!==SKP.id+s+SKP.combo){el.dataset.k=SKP.id+s+SKP.combo;el.style.setProperty('--dt',skCol(SKP.id));
    el.innerHTML='<b class="skon">🎯 '+T('skp.title',T('sk.'+SKP.id))+'</b><span>'+(SKP.combo?'✓ '+T('skp.combo'):T('skp.h.'+(h||'any')))+'</span><b class="skpt">'+s+'</b>'+
      '<button class="wx" data-skp="x" aria-label="'+T('skp.skip')+'">✕</button>'}
  el.hidden=false;
}
// טבעת זהב מתחת לכל בובה, כדי שיהיה ברור שזו בובת אימון (מ-drawWSkill, בקואורדינטות העולם)
function skpDraw(){
  if(!SKP)return;ctx.save();ctx.strokeStyle=C.gold;ctx.lineWidth=3;
  for(const e of SKP.dummies){if(e.dead)continue;ctx.globalAlpha=0.8;ctx.beginPath();ctx.ellipse(e.x,e.y+4,e.r+10,(e.r+10)*0.45,0,0,7);ctx.stroke();
    ctx.globalAlpha=0.5;ctx.beginPath();ctx.ellipse(e.x,e.y+4,e.r+18,(e.r+18)*0.45,0,0,7);ctx.stroke()}
  ctx.restore();
}
