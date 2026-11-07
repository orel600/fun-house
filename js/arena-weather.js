/* Weather in the arena and in boss fights (W4, Orel's weather system, 7.11.2026).
   - Boss fight: dark clouds and drifting fog. The boss gets angry (rage from boss.js, or phase 2): heavy rain and a storm.
   - Lightning in sync with the boss's big attacks: when a big attack's telegraph starts (shock, charge, mines) and on the new phase.
     The bolt hits the boss (the source), never the danger zone, so the telegraph stays clear.
   - A regular arena: gentle weather by arena type (AWX.arena), or none where it would hurt readability.
   - Readability first: the whole layer is drawn by render.js right after the floor (awxDraw), so the boss's mines and shock rings,
     the library telegraphs (fxDraw), skills, damage numbers and the HUD are all drawn on top of it. Low opacity, capped by AWX.maxA.
   The weather API (js/weather.js, the core session) is used when it exists: weatherScene/weatherState for the boss fight,
   setWeather for an arena, weatherBolt/weatherFlash for lightning. Until then a light local layer draws the same scene from
   the effects that are already in FXDATA (AWX.local). Nothing here changes the fight: no damage, no timing, no logic.
   Delete this file and its line in render.js, and the arena is as before. */
const AWX={
  on:true,
  theme:'night',
  // a regular arena by type: [[variant,intensity],...] or null = no weather (classic and maze: readability first)
  arena:{classic:null,maze:null,waves:[['fog_drift',0.3]],boss:[['fog_drift',0.35],['cloud_dark',0.3]]},
  // the boss fight, in the API's terms (weatherScene)
  scene:{
    calm:[['fog_drift',0.45],['cloud_dark',0.4]],
    building:[['cloud_dark',0.55],['rain_light',0.4]],
    storm:[['rain_heavy',0.6],['storm_cloud',0.5]],
    clearing:[['cloud_pass',0.35]],
  },
  rage:0.6,          // boss.rage from here up = storm (and always in phase 2)
  clearT:6,          // after the boss falls: clearing, then the arena's own weather
  fade:2,            // seconds to cross-fade between states
  boltGap:1.1,       // at most one bolt per this many seconds
  boltT:0.32,        // how long a bolt stays on screen
  flashA:0.22,       // flash strength (not with reduced motion)
  maxA:0.32,         // no weather layer is drawn stronger than this
  K:0.5,             // two layers or more: drawn at half resolution (quarter of the pixels) and stretched once
  // local layer until js/weather.js is in: variant -> [FXDATA id, opacity at intensity 1]
  local:{fog_drift:['wx_fog',0.62],cloud_dark:['haze',0.7],rain_light:['wx_rainheavy',0.35],rain_heavy:['wx_rainheavy',0.5],storm_cloud:['haze',0.6],cloud_pass:['haze',0.3]},
  // state
  st:'',key:'',api:false,layers:new Map(),clr:0,last:0,bolts:0,flashes:0,bolt:null,flash:0,seen:null,n:0,cv:null,t0:0,
};
const awxApi=()=>typeof setWeather==='function'&&typeof weatherScene==='function'&&typeof weatherState==='function';
// in the arena (not the world, the village, the bonus room or the Underworld Games), in a run
const awxHere=()=>AWX.on&&!!P&&!!S&&!S.mb&&!S.wd&&!S.vil&&!S.room&&S.mode!=='title';
// what the weather should be now: boss state, clearing, or the arena's own
function awxWant(dt){
  const b=S.boss;
  if(b&&!b.dead){AWX.clr=AWX.clearT;return b.phase>1||b.rage>=AWX.rage?'storm':b.rage>0.3?'building':'calm'}
  if(AWX.st&&AWX.st!=='arena'&&AWX.clr>0){AWX.clr-=dt;return 'clearing'}
  return 'arena';
}
function awxSet(st){
  const api=awxApi(),list=st==='arena'?AWX.arena[S.arena]||[]:AWX.scene[st]||[],o={fade:AWX.fade,under:true,layer:'arena'};
  AWX.st=st;AWX.api=api;
  if(api){try{
    if(st==='arena'){if(list.length){list.forEach(([v,k],i)=>setWeather(v,AWX.theme,k,{...o,add:i>0}))}else if(typeof weatherClear==='function')weatherClear(AWX.fade)}
    else{weatherScene('arena-boss',{...AWX.scene,theme:AWX.theme,auto:false});weatherState('arena-boss',st)}
  }catch(e){}return}
  // local: every layer fades to its new target; layers that are not wanted fade out
  for(const L of AWX.layers.values())L.to=0;
  for(const [v,k] of list){const m=AWX.local[v];if(!m)continue;const id=m[0];
    let L=AWX.layers.get(id);if(!L){L={id,a:0,to:0};AWX.layers.set(id,L);if(typeof fxPreload==='function')fxPreload([id])}
    L.to=Math.min(AWX.maxA,Math.max(L.to,m[1]*k))}
}
// the boss's big attacks, seen from outside (boss.js is not touched): a new charge, a new shock ring, new mines, a new phase
function awxWatch(b){
  const s=AWX.seen,now={b,charge:b.charge,waves:waves.filter(w=>w.t<0).length,mines:mines.length,phase:b.phase};AWX.seen=now;
  if(!s||s.b!==b)return;
  const big=(now.charge&&now.charge!==s.charge)||now.waves>s.waves||now.mines>s.mines+2,ph=now.phase>s.phase;
  if(big||ph)awxStrike(b.x,b.y-b.r*0.4,ph);
}
function awxStrike(x,y,force){
  const t=S.t;if(!force&&t>=AWX.last&&t-AWX.last<AWX.boltGap)return;AWX.last=t;AWX.bolts++;   // t<last: a new run (S.t starts again)
  const fl=RM?0:AWX.flashA*(force?1.4:1);if(fl)AWX.flashes++;
  if(AWX.api&&typeof weatherBolt==='function'){try{weatherBolt(x,y,{under:true});if(fl&&typeof weatherFlash==='function')weatherFlash(fl)}catch(e){}return}
  // local: a jagged bolt from the top of the screen down to the boss, and a short soft flash
  const top=S.cam.y-H/2-30,pts=[],n=9;
  for(let i=0;i<=n;i++){const k=i/n;pts.push([x+(i&&i<n?rand(-26,26)*(1-k*0.5):0),top+(y-top)*k])}
  AWX.bolt={pts,t:AWX.boltT};AWX.flash=fl;
}
// one frame of a looping weather sheet, full screen around the camera
function awxLayer(g,L,cx,cy,now){
  const im=typeof fxImg==='function'&&fxImg(L.id),D=typeof FXDATA!=='undefined'&&FXDATA[L.id];if(!im||!D||L.a<=0.005)return;
  const i=Math.floor(now*24)%D.n,z=Math.max(W,H)*1.15;
  g.globalAlpha=L.a;g.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,cx-z/2,cy-z/2,z,z);
}
/* Called from render() in world coordinates, right after the floor and before the telegraphs (mines, shock rings),
   the actors, the skills, fxDraw and the damage numbers. ox,oy: the camera offset render() uses */
function awxDraw(ox,oy){
  const now=performance.now()/1000;
  if(!awxHere()){
    if(AWX.st){if(AWX.api&&typeof weatherClear==='function'&&!(S&&(S.wd||S.vil||S.mb)))try{weatherClear(1)}catch(e){}   // the world and the village set their own weather
      AWX.st='';AWX.key='';AWX.layers.clear();AWX.seen=null;AWX.bolt=null;AWX.flash=0}
    return;
  }
  const dt=Math.max(0,Math.min(0.1,S.t-AWX.t0));AWX.t0=S.t;   // game time: a pause stops the fades too
  const st=awxWant(dt),key=st+'|'+S.arena;
  if(key!==AWX.key||AWX.api!==awxApi()){AWX.key=key;awxSet(st)}
  if(S.boss&&!S.boss.dead)awxWatch(S.boss);else AWX.seen=null;
  AWX.n++;
  if(!AWX.api){
    const cx=W/2-ox,cy=H/2-oy,step=dt/AWX.fade,live=[];
    for(const [id,L] of AWX.layers){L.a+=Math.max(-step,Math.min(step,L.to-L.a));if(L.a<=0.005&&L.to<=0)AWX.layers.delete(id);else live.push(L)}
    if(live.length){
      ctx.save();
      if(live.length<2)for(const L of live)awxLayer(ctx,L,cx,cy,now);
      else{const cv=ctx.canvas,K=AWX.K,w=Math.max(1,Math.round(cv.width*K)),h=Math.max(1,Math.round(cv.height*K));
        let c=AWX.cv;if(!c)c=AWX.cv=document.createElement('canvas');if(c.width!==w||c.height!==h){c.width=w;c.height=h}
        const g=c.getContext('2d'),m=ctx.getTransform();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(m.a*K,m.b*K,m.c*K,m.d*K,m.e*K,m.f*K);
        for(const L of live)awxLayer(g,L,cx,cy,now);
        ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(c,0,0,cv.width,cv.height)}
      ctx.restore();
    }
    const B=AWX.bolt;
    if(B){B.t-=dt;if(B.t<=0)AWX.bolt=null;else{const k=B.t/AWX.boltT,e=B.pts[B.pts.length-1];
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';
      for(const [lw,col,a] of [[9,'#9a7cff',0.35],[3,'#f4efff',0.9]]){ctx.globalAlpha=a*k;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();B.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
      ctx.globalAlpha=0.3*k;ctx.fillStyle='#c7a6ff';ctx.beginPath();ctx.ellipse(e[0],e[1]+20,46,18,0,0,7);ctx.fill();ctx.restore()}}
    if(AWX.flash>0){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=AWX.flash;ctx.fillStyle='#e9e4ff';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore();AWX.flash=Math.max(0,AWX.flash-dt*1.1)}
  }
}
