/* מבוקש היום (Claude מוביל, 2.11.2026. roadmap: idea-daily-hunt, מהמבקר).
   כל יום אויב עלית אחד עם שם, באחד האזורים שכבר התגלו, ליד אחת הלהקות שם. אותו מבוקש לכולם באותו תאריך.
   ביומן הקווסטים כרטיס עם השם והאזור. בעולם, באזור שלו: שם מעל הראש וחץ בקצה המסך.
   מפילים אותו פעם ביום, ומקבלים שלל שרק הוא נותן (אבנים מושלמות וכוכב). מחר יש מבוקש חדש.
   החיבור: huntEnter ב-enterWorld, huntKill ב-kill, huntCard ביומן, huntScreen בציור העולם.
   נשמר ב-SAVE.hunt: {day, got}. המספרים ב-HUNT. השמות והטקסטים ב-lang.js תחת 'hunt.' */
const HUNT={
  hp:7, dmg:1.6, r:1.45, speed:1.1,                 // פי כמה מאויב רגיל באותה להקה
  names:6,                                           // כמה שמות יש ב-lang.js ('hunt.n0'..)
  loot:{coins:[1,80],star:[0.6,1],rubyF:[0.35,1],sapphireF:[0.35,1],boltF:[0.35,1],aquaF:[0.35,1],amberF:[0.35,1],mythril:[0.5,1]},
  icon:'🎯', col:'#FF5A5A'
};
const HS=()=>SAVE.hunt||(SAVE.hunt={day:'',got:''});
const huntDay=()=>typeof chDay==='function'?chDay():new Date().toDateString();
const huntHash=(s,k)=>{let h=k>>>0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
// אזורים שכבר התגלו (worldmap.js)
const huntRegions=()=>['meadow',...Object.keys(WORLD.regions||{})].filter(r=>typeof wmSeen!=='function'||wmSeen(r));
// המבוקש של היום: אזור, להקה ושם. אותו דבר כל היום
function huntToday(day=huntDay()){
  const regs=huntRegions(),reg=regs[huntHash(day,7)%regs.length];
  const R=reg==='meadow'?WORLD:WORLD.regions[reg],foes=(R.foes||WORLD.foes).map((G,i)=>({G,i})).filter(o=>ETYPES[o.G.type]&&!o.G.creature);
  const g=foes.length?foes[huntHash(day,13)%foes.length]:null;
  return {reg,g,name:huntHash(day,29)%HUNT.names,day};
}
const huntDone=()=>HS().got===huntDay();

// כניסה לאזור בעולם: אם זה האזור של היום ועוד לא הופל, הוא שם
function huntEnter(){
  if(!S.wd||huntDone())return;const H=huntToday();
  if(H.reg!==(S.wd.reg||'meadow')||!H.g)return;
  const G=H.g.G,e=addEnemy(G.type,G.x,G.y,HUNT.hp*(typeof wZone==='function'?wZone(G).hp:1)*(WORLD.foeHp||1));
  e.dmg*=HUNT.dmg;e.r*=HUNT.r;e.speed*=HUNT.speed;e.home=H.g.i;e.xp=0;e.hunt=true;e.huntN=H.name;e.elite=false;
  if(typeof tierSpawn==='function')tierSpawn(e);
  S.wd.hunt=e;
  setTimeout(()=>{if(S.wd&&S.wd.hunt===e&&!e.dead)banner(HUNT.icon+' '+T('hunt.here',T('hunt.n'+H.name)),HUNT.col)},2500);
}
// נפל (kill ב-combat.js)
function huntKill(e){
  if(!e.hunt||!S.wd)return;
  HS().got=huntDay();HS().day=huntDay();S.wd.hunt=null;
  runGive(HUNT.loot,e.x,e.y);celebrate(e.x,e.y,'quest',HUNT.icon);
  banner(T('hunt.down',T('hunt.n'+e.huntN)),C.gold);saveNow();
  if(typeof questEvent==='function')questEvent('kill','hunt',1);
}
// שם מעל הראש וחץ בקצה המסך (world.js, מעל הכל)
function huntScreen(ox,oy){
  const e=S.wd&&S.wd.hunt;if(!e||e.dead)return;
  const x=e.x+ox,y=e.y+oy-e.r-44,t=HUNT.icon+' '+T('hunt.n'+e.huntN);
  if(onScreen(x,y)){ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 14px Heebo, system-ui, sans-serif';
    const w=ctx.measureText(t).width+12;ctx.fillStyle='rgba(10,12,20,0.75)';ctx.fillRect(x-w/2,y-13,w,18);ctx.fillStyle=HUNT.col;ctx.fillText(t,x,y)}
  else edgeArrow(e.x+ox,e.y+oy,HUNT.col,1.1,true);
}
// הכרטיס ביומן (questLog ב-quests.js)
function huntCard(){
  const H=huntToday(),done=huntDone();
  let h='<h4>'+HUNT.icon+' '+T('hunt.title')+'</h4><div class="qc chc'+(done?' ready':'')+'"><b>'+T('hunt.n'+H.name)+'</b><small>'+T('w.region.'+H.reg)+'</small>';
  h+='<p class="say">'+T(done?'hunt.gotToday':'hunt.say')+'</p>';
  return h+'</div>';
}
