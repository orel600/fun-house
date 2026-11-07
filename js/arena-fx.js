/* אפקטים מהספרייה בזירה ובבוס (אוראל, 7.11.2026, מסקירת המשחק: "כל סקיל מזוהה בשבריר שנייה, וכל מתקפה של הבוס עם אזהרה ברורה").
   הכל מספריית הגיליונות (fxlib.js, docs/fx.md), ורק בזירה (skArena). העולם, הכפר ומשחקי השאול לא משתנים. עוטף מבחוץ:
   - אזהרות לבוס (boss.js): doPattern נדחה ב-wait שניות, ובזמן הזה אזהרה בצורה של סוג המתקפה. מכל אזהרה עד רגע הסכנה לפחות minWarn.
       טבעת יריות: tg_ring.  ספירלה: tg_charge (טעינה).  מניפה מכוונת: tg_cone אליך.  הסתערות: tg_line לאורך המסלול.
       זימון (מגנים, מכשפים): tg_circle בכל מקום שמישהו יופיע.  גל הדף: tg_growing עד הטווח המלא.  מוקשים: tg_target על כל מוקש.
       זעם (יריות כשבורחים, הכי מסוכן): tg_skull מעל הבוס כל עוד הוא זועם, ואין יריה לפני שהגולגולת הופיעה minWarn.
   - פגיעות (juiceHit): hit_<סוג נזק>, hit_heavy למכה כבדה, dmg_crit לקריטי. מכה מהנשק או מסקיל בלבד, עם תקרה לפריים, ובהמון רק קריטי ואויב-על.
   - הריגה (kill): ko למפלצות (עם תקרה), ko_boss לבוס.  ניצחון (runWon, gameOver): זיקוקים וקונפטי בזירה, ובמסך הניצחון.
   - סקילים (skillUse): אפקט הטלה לכל סקיל, בצבע סוג הנזק שלו. טבעת זוהר (glow_ally) מתחת לגיבור כשיש הרבה אויבים קרוב.
   - כפתורים: באייקונים "חדש" (ברירת המחדל) הצלליות של gicons.js כמו בעולם (skillsHud). ב"קלאסי" אייקון מצויר (icons/ui/skills) במקום סמל ה-SVG, וקיצורי מקלדת E, R, F עם רמז קטן (רק כשיש מקלדת).
     Q ו-W תפוסים (Q מחליף נשק, W הולך למעלה), ולכן E, R, F. גם 1, 2, 3 ממשיכים לעבוד (skills.js).
   "פחות אפקטים": בלי פגיעות, הריגות, הטלות וזוהר. האזהרות והניצחון נשארים, כי הן חלק מהמשחק. הספירה לבוט ב-ARFX.stat */
const ARFX={
  minWarn:1,   // שניות לפחות מהאזהרה ועד שמשהו יכול לפגוע
  // לכל מתקפה: fx האזהרה, wait כמה שניות לדחות אותה, extra כמה המתקפה עצמה כבר מחכה (גל ההדף 0.6, ההסתערות 0.75, המוקשים 1.3)
  tele:{
    ring:{fx:'tg_ring',wait:1},
    spiral:{fx:'tg_charge',wait:1},
    aimed:{fx:'tg_cone',wait:1},
    charge:{fx:'tg_line',wait:0.3,extra:0.75},
    shields:{fx:'tg_circle',wait:1},
    wisps:{fx:'tg_circle',wait:1},
    shock:{fx:'tg_growing',wait:0.4,extra:0.6},
    mines:{fx:'tg_target',wait:0,extra:1.3},
    rage:{fx:'tg_skull',from:0.25}   // הגולגולת דולקת מעל זעם 0.25, והיריות של הזעם מתחילות ב-0.6
  },
  hit:{perFrame:2,crowd:120,heavy:0.25,critGap:0.2,big:1.6},   // heavy: מכה של רבע מהחיים ומעלה. critGap: שניות בין שני "CRIT!"
  hitFx:{physical:'hit',fire:'hit_fire',water:'hit_water',ice:'hit_ice',lightning:'hit_light',earth:'hit_earth'},
  ko:{gap:0.08,crowd:120},   // ko למפלצת לכל היותר פעם ב-gap שניות
  // הטלת סקיל: fx, k גודל ביחס לרדיוס (או size), add אור
  cast:{
    quake:{fx:'sk_anvil',k:2.2},
    splash:{fx:'sp_barrier',k:2.4,add:true},
    frost:{fx:'sk_blizzard',k:2.2,add:true},
    flame:{fx:'sk_rage',k:2.6,add:true},
    zap:{fx:'st_shock',size:120,add:true},
    comet:{fx:'ko',k:2.6,add:true},           // בנפילה, לא בלחיצה
    lance:{fx:'sk_blizzard_ice',size:130,add:true},
    bloom:{fx:'sp_heal',k:2.4,alpha:0.8}
  },
  glow:{near:220,on:8,off:5,size:120,alpha:0.8,every:0.5},   // כמה אויבים עד near מדליקים את הטבעת, ומתחת ל-off היא כבה
  // אייקון מצויר לכל סקיל בזירה (icons/ui/skills)
  pic:{quake:'wQuake',splash:'vortex',frost:'mCircle',flame:'whirl',zap:'chain',comet:'meteor',lance:'shield',bloom:'spirit'},
  keys:['KeyE','KeyR','KeyF'],
  win:{t:3.4,every:0.32}   // מסך הניצחון: כמה שניות של זיקוקים, וכל כמה זמן אחד חדש
};
const ARFXS={f:-1,n:0,ko:0,crit:0,glow:null,glowT:0,stat:{tele:{},hits:0,heavy:0,crits:0,ko:0,koBoss:0,win:0,winUi:0,cast:{},glow:0,keys:0}};
const arfxOn=()=>skArena()&&S.mode==='play'&&!(typeof MB!=='undefined'&&MB);
const arfxFps=(id,dur)=>typeof FXDATA!=='undefined'&&FXDATA[id]?FXDATA[id].n/Math.max(0.2,dur):30;   // לנגן אפקט פעם אחת בדיוק במשך dur
function arfxTeleStat(k,warn){const s=ARFXS.stat.tele[k]||(ARFXS.stat.tele[k]={n:0,warn:99});s.n++;s.warn=Math.min(s.warn,warn)}

/* ---- אזהרות לבוס ---- */
function arfxTeleFx(b,k,dur){
  const D=ARFX.tele[k],aP=Math.atan2(P.y-b.y,P.x-b.x),o={follow:b,fps:arfxFps(D.fx,dur),dur,under:true},hs=[];
  if(k==='aimed'){const s=560;hs.push(fxPlay(D.fx,b.x,b.y,{...o,size:s,sx:0.5,rot:aP+Math.PI/2,dx:Math.cos(aP)*s*0.35,dy:Math.sin(aP)*s*0.35}))}
  else if(k==='charge'){const L=680*0.45+b.r,s=L/0.9;hs.push(fxPlay(D.fx,b.x,b.y,{...o,size:s,rot:aP,dx:Math.cos(aP)*L/2,dy:Math.sin(aP)*L/2}))}
  else if(k==='shields'||k==='wisps'){const n=2+b.phase;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;hs.push(fxPlay(D.fx,b.x,b.y,{...o,size:90,dx:Math.cos(a)*60,dy:Math.sin(a)*60}))}}
  else if(k==='shock')hs.push(fxPlay(D.fx,b.x,b.y,{...o,size:2*270/0.85}));
  else if(k==='ring')hs.push(fxPlay(D.fx,b.x,b.y,{...o,size:2*(b.r+110)/0.8}));
  else hs.push(fxPlay(D.fx,b.x,b.y,{...o,size:200,add:true}));
  return hs.filter(Boolean);
}
// הכיוון של הקונוס וההסתערות: עוקב אחרי השחקן עד הרגע האחרון, ואז ננעל (ההסתערות לפי c.a)
function arfxAim(h,b,a,k){if(!h)return;if(k==='aimed'){const s=h.size;h.rot=a+Math.PI/2;h.dx=Math.cos(a)*s*0.35;h.dy=Math.sin(a)*s*0.35}
  else{const L=h.size*0.9;h.rot=a;h.dx=Math.cos(a)*L/2;h.dy=Math.sin(a)*L/2}}

{const old=doPattern;doPattern=function(b,k){
  if(!skArena()||b.arGo||!ARFX.tele[k])return old.apply(this,arguments);
  const D=ARFX.tele[k];
  if(!D.wait){   // מוקשים: כבר מחכים בעצמם. אזהרה על כל מוקש חדש, לכל אורך הזמן שלו
    const n0=mines.length;old.apply(this,arguments);let w=99;
    for(let i=n0;i<mines.length;i++){const m=mines[i];w=Math.min(w,m.t);fxPlay(D.fx,m.x,m.y,{size:150,fps:arfxFps(D.fx,m.t),dur:m.t,under:true})}
    if(mines.length>n0)arfxTeleStat(k,w);return}
  b.arTele={k,t:0,max:D.wait,hs:arfxTeleFx(b,k,D.wait+(D.extra||0))};
}}
{const old=bossUpdate;bossUpdate=function(b,dt){
  if(!skArena())return old.apply(this,arguments);
  // זעם: הגולגולת קודם, ורק אחרי minWarn היריות
  const R=ARFX.tele.rage;
  if(b.rage>R.from&&!b.arSkull){b.arSkull=fxPlay(R.fx,b.x,b.y,{follow:b,loop:true,size:100,dy:-b.r-46});b.arSkullT=S.t}
  else if(b.rage<=R.from&&b.arSkull){fxStop(b.arSkull);b.arSkull=null;b.arSkullT=null}
  if(b.arSkullT==null||S.t-b.arSkullT<ARFX.minWarn)b.rageShot=Math.max(b.rageShot,dt+0.01);
  const rs=b.rageShot;
  const tl=b.arTele;if(tl)b.patT=Math.max(b.patT,0.5);   // בזמן אזהרה לא מתחילה מתקפה אחרת
  old.apply(this,arguments);
  if(b.rageShot>rs&&b.arSkullT!=null){arfxTeleStat('rage',S.t-b.arSkullT);b.arSkullT=-1e9}   // נרשם רק בפעם הראשונה של כל זעם
  if(tl){
    const aP=Math.atan2(P.y-b.y,P.x-b.x);
    if(tl.k==='aimed'||tl.k==='charge')arfxAim(tl.hs[0],b,aP,tl.k);
    if(!(b.stun>0))tl.t+=dt;
    if(tl.t>=tl.max){b.arTele=null;b.arGo=1;try{doPattern(b,tl.k)}finally{b.arGo=0}
      const D=ARFX.tele[tl.k];arfxTeleStat(tl.k,tl.t+(D.extra||0));
      if(tl.k==='charge'&&b.charge){b.arLine=tl.hs[0];arfxAim(b.arLine,b,b.charge.a,'charge')}
      else for(const h of tl.hs)if(tl.k!=='shock')fxStop(h)}
  }
  if(b.arLine&&(!b.charge||b.charge.stage>0)){fxStop(b.arLine);b.arLine=null}
}}
// הבוס נופל: האזהרות שלו נעלמות איתו (follow), והגולגולת גם
{const old=bossDown;bossDown=function(b){
  if(skArena()){if(b.arSkull)fxStop(b.arSkull);if(b.arTele)for(const h of b.arTele.hs)fxStop(h);b.arTele=null}
  return old.apply(this,arguments)}}

/* ---- פגיעות ---- */
function arfxFrame(){if(ARFXS.f===S.t)return;ARFXS.f=S.t;ARFXS.n=0}
{const old=juiceHit;juiceHit=function(e,d,m,crit,t,ang){
  const r=old.apply(this,arguments);
  if(!arfxOn()||fxLess()||e.node||typeof AJ==='undefined'||!AJ.src||AJ.src.ch||!JUICE.arena.src[AJ.src.w])return r;
  const H=ARFX.hit,big=ajBig(e);arfxFrame();ajFrame();
  if(ARFXS.n>=H.perFrame||(AJ.seen>H.crowd&&!crit&&!big))return r;
  ARFXS.n++;
  const sz=Math.max(56,Math.min(150,e.r*3.2))*(big?H.big*0.8:1),hy=e.y-e.r*0.6;
  const heavy=big&&(d>=e.max*H.heavy||AJ.src.w==='skill');   // רק באויב גדול, כדי שבהמון זה יישאר מיוחד
  fxPlay(heavy?'hit_heavy':ARFX.hitFx[t]||'hit',e.x,hy,{size:heavy?sz*1.5:sz,add:true,rot:heavy?0:rand(0,6.28)});
  if(heavy){ARFXS.stat.heavy++;if(ARFX.hitFx[t])fxPlay(ARFX.hitFx[t],e.x,hy,{size:sz,add:true})}
  ARFXS.stat.hits++;
  if(crit&&S.t-ARFXS.crit>=H.critGap){ARFXS.crit=S.t;ARFXS.stat.crits++;fxPlay('dmg_crit',e.x,e.y-e.r-40,{size:90,vy:-30})}
  return r}}

/* ---- הריגה ---- */
{const old=kill;kill=function(e){
  const ar=skArena()&&!e.node&&!e.dead,x=e.x,y=e.y,boss=e.isBoss;
  const r=old.apply(this,arguments);
  if(!ar)return r;
  if(boss){fxPlay('ko_boss',x,y-30,{size:340,add:true});ARFXS.stat.koBoss++}
  else if(!fxLess()&&S.t-ARFXS.ko>=ARFX.ko.gap){ajFrame();if(AJ.seen<=ARFX.ko.crowd||ajBig(e)){ARFXS.ko=S.t;ARFXS.stat.ko++;fxPlay('ko',x,y-e.r*0.5,{size:Math.max(70,e.r*4*(e.big||1)),add:true})}}
  return r}}

/* ---- ניצחון: בזירה, ובמסך הניצחון ---- */
{const old=runWon;runWon=function(){
  if(skArena()&&S.boss==null){const s=S;ARFXS.stat.win++;
    fxUi('win_confetti',W/2,H*0.35,{size:Math.min(W,H)*0.9});
    for(let i=0;i<5;i++)setTimeout(()=>{if(S===s)fxUi('win_fireworks',W*rand(0.2,0.8),H*rand(0.15,0.5),{size:rand(220,320),add:true})},i*380)}
  return old.apply(this,arguments)}}
// מסך הניצחון הוא חלון מעל הקנבס, לכן קנבס קטן משלו מעל החלון, רק לזמן הזיקוקים, ובלי לחסום נגיעות
function arfxWinScreen(){
  if(typeof FXDATA==='undefined')return;
  const cv=document.createElement('canvas'),c=cv.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1),w=innerWidth,h=innerHeight;
  cv.width=w*dpr;cv.height=h*dpr;cv.className='arfxwin';document.body.appendChild(cv);ARFXS.stat.winUi++;
  const t0=performance.now()/1000,list=[{id:'ko_boss',x:w/2,y:h*0.3,s:Math.min(w,h)*0.55,t:t0},{id:'win_confetti',x:w/2,y:h*0.45,s:Math.min(w,h)*1.1,t:t0+0.1}];
  let next=t0;
  (function step(){
    const now=performance.now()/1000;if(now-t0>ARFX.win.t+0.8||!document.body.contains(cv)){cv.remove();return}
    if(now<t0+ARFX.win.t&&now>=next){next=now+ARFX.win.every;list.push({id:'win_fireworks',x:w*rand(0.12,0.88),y:h*rand(0.1,0.55),s:rand(220,340),t:now})}
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);c.globalCompositeOperation='lighter';
    for(const f of list){const D=FXDATA[f.id],im=D&&fxImg(f.id),i=Math.floor((now-f.t)*FXLIB.fps);if(!im||i<0||i>=D.n)continue;
      c.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,f.x-f.s/2,f.y-f.s/2,f.s,f.s)}
    requestAnimationFrame(step)})();
}
{const old=gameOver;gameOver=function(){
  const win=!!S.won&&skArena();const r=old.apply(this,arguments);
  if(win){fxPreload(['win_fireworks','win_confetti','ko_boss']);setTimeout(arfxWinScreen,700)}   // החלון עולה אחרי 700ms (progression.js)
  return r}}

/* ---- סקילים: אפקט הטלה ---- */
function arfxCast(id,x,y,o={}){
  const C_=ARFX.cast[id];if(!C_||fxLess())return;const D=skDef(id)||{};
  const size=C_.size||(D.r||60)*C_.k;ARFXS.stat.cast[id]=(ARFXS.stat.cast[id]||0)+1;
  return fxPlay(C_.fx,x,y,{size,add:!!C_.add,alpha:C_.alpha??1,...o});
}
{const old=skillUse;skillUse=function(id){
  const r=old.apply(this,arguments);
  if(!r||!arfxOn())return r;
  if(id==='bloom'){const p=S.skm&&S.skm.pools[S.skm.pools.length-1];if(p)arfxCast(id,p.x,p.y,{loop:true,dur:SKMORE.list.bloom.t,under:true})}
  else if(id==='zap'||id==='lance')arfxCast(id,P.x+Math.cos(P.aim)*24,P.y-10+Math.sin(P.aim)*24);
  else if(id!=='comet')arfxCast(id,P.x,P.y,{under:true});
  return r}}
{const old=skillsUpdate;skillsUpdate=function(dt){
  const m=S.skm,pend=m&&skArena()?m.pend.slice():null;
  const r=old.apply(this,arguments);
  if(pend)for(const p of pend)if(p.done)arfxCast('comet',p.x,p.y);   // השביט נפל
  if(arfxOn())arfxGlow(dt);
  return r}}

// בתחילת ריצה בזירה: טוענים מראש את מה שיופיע, כדי שהאזהרה הראשונה והניצחון לא יחכו לתמונה
{const old=skillsReset;skillsReset=function(){const r=old.apply(this,arguments);
  if(skArena())fxPreload(Object.values(ARFX.tele).map(t=>t.fx).concat(Object.values(ARFX.hitFx),Object.values(ARFX.cast).map(c=>c.fx),['hit_heavy','dmg_crit','ko','ko_boss','win_fireworks','win_confetti','glow_ally']));
  return r}}

/* ---- טבעת זוהר מתחת לגיבור בקרב צפוף ---- */
function arfxGlow(dt){
  const G=ARFX.glow;ARFXS.glowT-=dt;if(ARFXS.glowT>0)return;ARFXS.glowT=G.every;
  const h=ARFXS.glow,alive=h&&h.on&&FXLIB.list.includes(h);
  if(fxLess()){if(alive)fxStop(h);ARFXS.glow=null;return}
  let n=0;for(const e of enemies)if(!e.dead&&Math.abs(e.x-P.x)<G.near&&Math.abs(e.y-P.y)<G.near&&Math.hypot(e.x-P.x,e.y-P.y)<G.near&&++n>=G.on)break;
  if(!alive&&n>=G.on){ARFXS.glow=fxPlay('glow_ally',P.x,P.y,{follow:P,loop:true,size:G.size,alpha:G.alpha,dy:2,under:true});ARFXS.stat.glow++}
  else if(alive&&n<G.off){fxStop(h);ARFXS.glow=null}
}

/* ---- כפתורים: אייקון מצויר וקיצורי מקלדת ---- */
const arfxPicOk={};
(()=>{const st=document.createElement('style');
  st.textContent='body:not(.world) .skb kbd.skk{display:none}'+
    'body.kbd:not(.world) .skb kbd.skk{display:block;position:absolute;top:5px;left:50%;transform:translateX(-50%);z-index:2;font:700 11px/1 system-ui,sans-serif;'+
    'color:#fff;background:#0009;border:1px solid #fff6;border-radius:4px;padding:2px 4px;pointer-events:none}'+
    '.arfxwin{position:fixed;inset:0;width:100vw;height:100vh;z-index:6;pointer-events:none}';
  document.head.appendChild(st);
  for(const id in ARFX.pic){const im=new Image();im.onload=()=>{arfxPicOk[id]=true;
      st.textContent+='body:not(.world) .skb:not(.gif)[data-sk="'+id+'"]::before{content:"";position:absolute;inset:3px;border-radius:50%;background:url(icons/ui/skills/'+ARFX.pic[id]+'.png) center/cover;pointer-events:none}'+
        'body:not(.world) .skb:not(.gif)[data-sk="'+id+'"]:not(.ready)::before{opacity:.45}body:not(.world) .skb:not(.gif)[data-sk="'+id+'"] .dti{display:none}'};
    im.src='icons/ui/skills/'+ARFX.pic[id]+'.png'}})();
{const old=skillsHud;skillsHud=function(){
  const r=old.apply(this,arguments),box=$('skills');
  if(!box.hidden&&!S.wd)for(let i=0;i<box.children.length&&i<ARFX.keys.length;i++){const b=box.children[i];
    if(!b.querySelector('kbd.skk'))b.insertAdjacentHTML('beforeend','<kbd class="skk">'+ARFX.keys[i].slice(3)+'</kbd>')}
  return r}}
// מקלדת: רמז על הכפתורים רק כשיש מקלדת (עכבר מדויק, או שנלחץ מקש)
if(matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches)document.body.classList.add('kbd');
addEventListener('keydown',e=>{
  document.body.classList.add('kbd');
  const i=ARFX.keys.indexOf(e.code);if(i<0||e.target!==document.body||!S||!S.sk||!arfxOn())return;
  const id=S.sk.ids[i];if(id&&skillUse(id))ARFXS.stat.keys++});
