/* שליטה: מגע, מקלדת וכפתורים */
cvs.addEventListener('pointerdown',e=>{if(S.mode!=='play'||joy)return;joy={id:e.pointerId,ox:e.clientX,oy:e.clientY,dx:0,dy:0};try{cvs.setPointerCapture(e.pointerId)}catch(_){}});
cvs.addEventListener('pointermove',e=>{if(!joy||e.pointerId!==joy.id)return;let vx=e.clientX-joy.ox,vy=e.clientY-joy.oy,l=Math.hypot(vx,vy);
  if(l>55){joy.ox=e.clientX-vx/l*55;joy.oy=e.clientY-vy/l*55}joy.dx=(e.clientX-joy.ox)/55;joy.dy=(e.clientY-joy.oy)/55});
const endJoy=e=>{if(joy&&e.pointerId===joy.id)joy=null};
cvs.addEventListener('pointerup',endJoy);cvs.addEventListener('pointercancel',endJoy);
document.addEventListener('touchmove',e=>{if(e.target===cvs)e.preventDefault()},{passive:false});
$('swap').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();swapWeapon()});
$('swap').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();swapWeapon()}});
addEventListener('keydown',e=>{keys[e.code]=true;if((e.code==='KeyQ'||e.code==='Space')&&e.target===document.body){e.preventDefault();swapWeapon()}});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;joy=null});

function startRun(){reset();S.mode='play';['ovStart','ovOver','ovLevel','ovBoss'].forEach(id=>$(id).hidden=true)}
$('startBtn').onclick=enterVillage;$('againBtn').onclick=enterVillage;   // הכפר הוא הבית: מתחילים בו, וחוזרים אליו בסוף ריצה
$('fightBtn').onclick=()=>{$('ovBoss').hidden=true;S.mode='play';banner(S.boss?S.boss.name:'',C.lilac)};
for(const b of document.querySelectorAll('[data-lang]'))b.onclick=()=>{setLang(b.dataset.lang);showLang()};
for(const b of document.querySelectorAll('[data-gfx]'))b.onclick=()=>setGfx(b.dataset.gfx);
