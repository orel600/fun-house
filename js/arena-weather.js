/* Weather in the arena and in boss fights (W4, Orel's weather system, 7.11.2026). Only drives the core (js/weather.js):
   - Boss fight (scene 'boss', the core picks it while S.boss lives): fog and dark clouds (calm), clouds and light rain as his
     rage builds (building), heavy rain and a storm when he gets angry (rage from boss.js, or phase 2: storm).
   - Lightning in sync with the boss's big attacks: when a big attack's telegraph starts (charge, shock ring, mines) and on the
     new phase, weatherBolt hits the boss himself (the source), never the danger zone, so the telegraph stays clear.
   - Arena without a boss (scene 'arena'): gentle weather by arena type (AWX.arena), or none where it hurts readability.
     After a boss falls: 'clearing' for AWX.clearT seconds, then the arena's own weather.
   - Readability first: the core draws right after the 3D layer, and in a 2D arena right after the floor (render.js), so the boss's
     mines and shock rings, fxDraw, skills, numbers and the HUD are on top of it.
   boss.js is not touched: the attacks are seen from outside. Delete this file and its line in render.js: the core's defaults remain. */
const AWX={
  on:true,
  theme:'night',
  k:0.75,            // all intensities here × this (the core: intensity 1 = WEATHER.alpha)
  // the arena (gauntlet, arenas.js): [[variant,intensity,{kind}],...] or null = no weather
  arena:{classic:null,gauntlet:[['fog_drift',0.4,{kind:'low'}]]},
  // the boss fight, in the core's terms (weatherScene)
  boss:{
    calm:[['fog_drift',0.6,{kind:'low'}],['cloud_dark',0.5,{kind:'sky'}]],
    building:[['cloud_dark',0.65,{kind:'sky'}],['rain_light',0.45],['fog_drift',0.4,{kind:'low'}]],
    storm:[['rain_heavy',0.65],['storm_cloud',0.6,{kind:'sky'}],['fog_drift',0.35,{kind:'low'}]],
    clearing:[['cloud_pass',0.45,{kind:'sky'}],['fog_drift',0.35,{kind:'low'}]],
  },
  rage:0.6,          // boss.rage from here up = storm (and always in phase 2)
  build:0.3,         // boss.rage from here up = building
  clearT:6,
  big:['shock','charge','mines'],   // the big attacks that bring lightning (pattern names in boss.js)          // after the boss falls: clearing in the arena scene, then calm
  // state
  st:'',runS:null,arenaK:null,clr:0,bossObj:null,seen:null,bolts:0,t0:0,n:0,
};
const awxApi=()=>typeof weatherScene==='function'&&typeof weatherState==='function'&&typeof WEATHER!=='undefined';
// in the arena (not the world, the village, the bonus room or the Underworld Games), in a run
const awxHere=()=>AWX.on&&!!P&&!!S&&!S.mb&&!S.wd&&!S.vil&&!S.room&&S.mode!=='title';
const awxCfg=list=>(list||[]).map(([v,i,o])=>[v,i*AWX.k,o||{}]);
// the boss scene once, the arena scene by arena type (registered again when the type changes)
function awxScenes(){
  if(!WEATHER.scenes.boss||!WEATHER.scenes.boss.awx){const B=AWX.boss;weatherScene('boss',{awx:1,theme:AWX.theme,auto:false,calm:awxCfg(B.calm),building:awxCfg(B.building),storm:awxCfg(B.storm),clearing:awxCfg(B.clearing)})}
  const a=S.arena||'classic';
  if(AWX.arenaK!==a||!WEATHER.scenes.arena||!WEATHER.scenes.arena.awx){AWX.arenaK=a;const L=awxCfg(AWX.arena[a]);
    weatherScene('arena',{awx:1,theme:AWX.theme,auto:false,calm:L,building:L,storm:L,clearing:awxCfg(AWX.boss.clearing)})}
}
// the boss's big attacks, seen from outside: the warning of a big attack starts (b.arTele, arena-fx.js), or without it
// a new charge, a new shock ring, new mines; and a new phase
function awxWatch(b){
  const tl=b.arTele&&AWX.big.includes(b.arTele.k)?b.arTele:null;
  const s=AWX.seen,now={b,tl,charge:b.charge,waves:waves.filter(w=>w.t<0).length,mines:mines.length,phase:b.phase};AWX.seen=now;
  if(!s||s.b!==b)return;
  if((tl&&tl!==s.tl)||(now.charge&&now.charge!==s.charge)||now.waves>s.waves||now.mines>s.mines+2||now.phase>s.phase)
    if(typeof weatherBolt==='function'&&weatherBolt(b.x,b.y-b.r*0.4))AWX.bolts++;   // the core keeps its own gap between bolts
}
/* Called from render() every frame in the arena: picks the scene state and sends the bolts. The core draws */
function awxDraw(){
  if(!awxHere()||!awxApi()){AWX.st='';AWX.seen=null;return}
  const dt=Math.max(0,Math.min(0.1,S.t-AWX.t0));AWX.t0=S.t;   // game time: a pause stops the clearing timer too
  if(AWX.runS!==S){AWX.runS=S;AWX.bossObj=null;AWX.st='';AWX.t0=S.t}   // a new run (reset makes a new S): no clearing left over from a boss that won
  awxScenes();
  const b=S.boss&&!S.boss.dead?S.boss:null;let st;
  if(b){
    if(AWX.bossObj!==b){AWX.bossObj=b;AWX.st=''}   // a new boss starts calm
    st=b.phase>1||b.rage>=AWX.rage?'storm':b.rage>=AWX.build?'building':'calm';AWX.clr=AWX.clearT;
    if(st!==AWX.st)weatherState(st,'boss');
    awxWatch(b);
  }else{
    AWX.seen=null;
    if(AWX.bossObj){AWX.bossObj=null;st='clearing'}else st=AWX.st==='clearing'&&(AWX.clr-=dt)>0?'clearing':'arena';
    if(st!==AWX.st)weatherState(st==='clearing'?'clearing':'calm','arena');
  }
  AWX.st=st;AWX.n++;
}
