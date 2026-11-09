/* Arena: eight NEW skills, preview prototypes (ARENA-B, overhaul/arena-new, MAX 10.11.2026). ONLY with ?arenanew=1 (default OFF).
   Off: nothing is built, no button, no state, and every wrapper below returns the old function's result untouched.
   On: a small bar of 8 round buttons (top right, keys Z X C V B N M ,) plus ARN.cast('meteor'|'rod'|'blade'|'moon'|'rift'|'arrows'|'phoenix'|'beam')
   for the bot. The buttons are independent of S.sk and skills.js (own cooldowns in ARN.s, reset with every run via skillsReset).
   Removing it: delete this file, its script line in index.html, the .arnbar CSS at the end of css/style.css and the arn.* keys in lang.js.
   Look: sharp-edged polygons on the 2D canvas layer (over the 3D scene, like skills-more.js), directional tapered trails, ONE strong impact
   burst per moment, fast decay, a distinct end-of-effect, magenta (#FF3DD8) only for telegraphs, no screen flash, no shake, no stacked rings.
   Character animation: P.skCast (skillcast.js clips, played by render3d.js on the upper body), the same path as arena-feel.js afCast.
   Sounds: existing files only (cast_*, imp_hammer, imp_wall, tower_fall, ult_ready, shoot). No new or licensed sound is used.
   Numbers: the concept doc gives only counts (5-7 meteors, 3 swords, "a few seconds", "hundreds of arrows"). Every number in ARN.D is a
   STARTING VALUE, UNTESTED, preview only. ARN.numbers() prints the full list for the report.
   Distinctions: Lightning Rod = planted zone that strikes the rod (Zap = instant chain from the hero, Smite = one target, one strike).
   Skyblade Orbit = no defensive rule (no block, no damage reduction, no projectile interaction), only contact nicks and a launch.
   Gravitas Rift = the only pull, and only here (displacement applied by this file alone, Blizzard untouched).
   Arrow Storm = a marked lane that rolls outward (Arrow Rain = area). Phoenix Dash = trail damage, only here.
   Judgment Beam = a walking pillar channel (Smite = one instant strike, Lantern Burst = ring around the hero). */
const ARN={
  on:/[?&]arenanew=1(&|$)/.test(location.search),
  order:['meteor','rod','blade','moon','rift','arrows','phoenix','beam'],
  keys:['KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma'],
  tg:'#FF3DD8',                    // telegraph colour (house rule)
  shade:'rgba(12,10,18,0.6)',     // dark line under every bright stroke, so it reads on the stone floor
  sq:0.85,                         // ground ellipse squash (same as skills-more.js)
  clips:{meteor:'meteor',rod:'arn_throw',blade:'summon',moon:'arn_raise',rift:'pull',arrows:'zone',phoenix:'dash',beam:'arn_raise'},   // SKCAST.anim keys
  anim:{arn_throw:'Throw',arn_raise:'Ranged_Magic_Raise'},                // added to SKCAST.anim when on (skcClip falls back if a clip is missing)
  D:{   // every number: STARTING VALUE, UNTESTED. dmg = multiple of skBase() (weapon damage with upgrades). r/len/w/half in game px, t in seconds
    meteor:{dt:'fire',cd:14,dmg:1.4,zone:150,n:6,range:460,ahead:260,tele:0.55,gap:0.24,fall:0.5,height:330,lean:95,r:52,lastK:1.3,lastDmg:1.5,scorch:2.0,rune:0.25},
    rod:{dt:'lightning',cd:16,dmg:1.2,range:420,ahead:240,fly:0.35,cloud:0.3,strikes:5,first:0.8,gap:0.6,cue:0.18,tipR:40,chain:3,chainR:170,chainK:0.6,finalDmg:3,finalR:150,cloudH:165,rodH:72,end:0.5},
    blade:{dt:'physical',cd:13,n:3,orbitR:70,spin:4.2,orbit:4.0,appear:0.4,nick:0.35,nickR:22,nickCd:0.45,launchGap:0.3,speed:950,hit:1.6,hitR:26,range:560,fwd:360,stick:1.0},
    moon:{dt:'ice',cd:24,dmg:6,eliteK:1.5,r:120,range:560,ahead:300,tele:1.5,fallAt:0.6,fallT:0.9,height:640},
    rift:{dt:'lightning',cd:15,dmg:2,range:440,ahead:260,r:190,popR:150,open:0.5,pull:2.0,pullSpd:150,eliteK:0.5,bossK:0,knock:300,height:170,debris:12},
    arrows:{dt:'physical',cd:12,dmg:0.7,len:480,half:60,waves:5,per:20,tele:0.6,gap:0.3,fall:0.24,height:260,lean:40,stick:1.8,range:560,start:50,lastExtra:1.4},
    phoenix:{dt:'fire',cd:9,dmg:0.5,dist:240,dur:0.2,trail:3.0,step:16,tick:0.4,r:36,wings:0.3},
    beam:{dt:'physical',cd:28,dmg:0.9,warn:0.6,dur:3.4,speed:150,start:40,w:44,tick:0.25,turn:1.2,ahead:170,range:600,height:440,scorch:2.0,end:0.4}
  },
  cast:{},up:{},dr:{},   // per skill: start, update, draw
  stat:{casts:{},hits:0,pulled:0,nicks:0,stuck:0,drawn:0,maxFx:0},
  n:0,s:null,bar:null,force:null   // force: test hook, a fixed aim angle for lanes, beam and fallback points
};
const arnLite=()=>(typeof RM!=='undefined'&&RM)||(typeof fxLess==='function'&&fxLess());
const arnArena=()=>ARN.on&&!!S&&skArena()&&!S.mb&&S.mode==='play';   // !S.mb: skArena() alone also matches the underworld MOBA (DANA, PR #544 finding)
const arnS=()=>ARN.s||(ARN.s={cd:{},fx:[]});
const arnFx=f=>{f.t=0;arnS().fx.push(f);ARN.stat.maxFx=Math.max(ARN.stat.maxFx,ARN.s.fx.length);return f};
ARN.numbers=()=>{const o=[];for(const id of ARN.order)o.push(id+': '+JSON.stringify(ARN.D[id]));return o.join('\n')};

/* ---- helpers ---- */
const arnR=(s,i)=>{const x=Math.sin(s*12.9898+i*78.233)*43758.5453;return x-Math.floor(x)};   // deterministic (the bot runs with a seed)
const arnRgb=(hex,a)=>{const n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')'};
const arnBig=e=>!!(e.isBoss||e.elite||e.champ||e.wanted);
const arnFoes=()=>enemies.filter(e=>!e.dead&&!e.node);
// densest cluster centre within range of the hero (first 60 foes), or a point ahead when nobody is there
function arnPoint(range,r,ahead){
  const pool=arnFoes().filter(e=>Math.hypot(e.x-P.x,e.y-P.y)<range).slice(0,60);let best=null,bn=0;
  for(const e of pool){let n=0;for(const o of pool)if(Math.hypot(o.x-e.x,o.y-e.y)<r)n++;if(n>bn){bn=n;best=e}}
  if(best){let sx=0,sy=0,n=0;for(const o of pool)if(Math.hypot(o.x-best.x,o.y-best.y)<r){sx+=o.x;sy+=o.y;n++}return{x:sx/n,y:sy/n}}
  const a=ARN.force!=null?ARN.force:P.aim||0;return{x:P.x+Math.cos(a)*ahead,y:P.y+Math.sin(a)*ahead};
}
function arnDir(range){if(ARN.force!=null)return ARN.force;const t=nearest(range);if(t)return Math.atan2(t.y-P.y,t.x-P.x);if(Math.hypot(P.vx||0,P.vy||0)>1)return Math.atan2(P.vy,P.vx);return P.aim||0}
function arnHit(x,y,r,k,dt,mul){let n=0;const base=skBase()*k;
  for(const e of enemies){if(e.dead||e.node||Math.hypot(e.x-x,e.y-y)-e.r>r)continue;damage(e,base*(mul?mul(e):1),'skill',Math.atan2(e.y-y,e.x-x),dt);n++}
  ARN.stat.hits+=n;return n}
function arnAnim(id){const k=ARN.clips[id];if(!k||typeof P==='undefined')return;P.skCast={n:(P.skCast?P.skCast.n:0)+1,k,at:performance.now()}}

// drawing
const arnSh=(w,col,a)=>{ctx.globalAlpha=a*0.6;ctx.strokeStyle=ARN.shade;ctx.lineWidth=w+2.2;ctx.stroke();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()};
const arnPoly=p=>{ctx.beginPath();for(let i=0;i<p.length;i++)i?ctx.lineTo(p[i][0],p[i][1]):ctx.moveTo(p[i][0],p[i][1]);ctx.closePath()};
const arnEll=(x,y,r)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(0.1,r),Math.max(0.1,r*ARN.sq),0,0,7)};
// star of sharp spikes (long and short alternate): the one impact burst of a moment
function arnStar(x,y,n,L,w,rot,col,a,sy){
  ctx.beginPath();
  for(let i=0;i<n;i++){const an=rot+i/n*6.2832,len=L*(i%2?0.55:1),ux=Math.cos(an),uy=Math.sin(an)*sy;
    ctx.moveTo(x+(-Math.sin(an))*w,y+Math.cos(an)*w*sy);ctx.lineTo(x+ux*len,y+uy*len);ctx.lineTo(x+Math.sin(an)*w,y-Math.cos(an)*w*sy);ctx.closePath()}
  ctx.globalAlpha=a;ctx.fillStyle=col;ctx.fill();
}
const arnBurst=(x,y,k,L,n,col,sy=0.8)=>{   // k 0..1 over 0.28 s: pops out fast, decays fast; white core
  if(k>=1)return;const sc=0.35+0.65*(1-(1-k)*(1-k)),a=k<0.4?1:1-(k-0.4)/0.6;
  ctx.save();arnStar(x,y,n,L*sc,L*0.09,0.3,ARN.shade,a*0.7,sy);ctx.restore();
  arnStar(x,y,n,L*sc,L*0.075,0.3,col,a,sy);arnStar(x,y,n,L*sc*0.55,L*0.05,0.3,'#FFFFFF',a,sy)};
// telegraph: one ellipse, dashed magenta outline, the fill is the timer, four sharp ticks
function arnTgZone(x,y,r,p,a){
  arnEll(x,y,r);ctx.globalAlpha=a*(0.05+0.15*p);ctx.fillStyle=ARN.tg;ctx.fill();
  ctx.setLineDash([9,6]);arnEll(x,y,r);arnSh(2.2,ARN.tg,a*0.9);ctx.setLineDash([]);
  ctx.beginPath();for(let i=0;i<4;i++){const an=i*1.5708,c=Math.cos(an),s=Math.sin(an);ctx.moveTo(x+c*(r-10),y+s*(r-10)*ARN.sq);ctx.lineTo(x+c*(r+12),y+s*(r+12)*ARN.sq)}arnSh(3,ARN.tg,a)}
// tapered streak: thin tail, wide head, fades toward the tail (directional trail)
function arnStreak(tx,ty,hx,hy,w,col,a){
  const dx=hx-tx,dy=hy-ty,L=Math.hypot(dx,dy)||1,nx=-dy/L*w,ny=dx/L*w,g=ctx.createLinearGradient(tx,ty,hx,hy);
  g.addColorStop(0,arnRgb(col,0));g.addColorStop(1,arnRgb(col,a));
  ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(hx+nx,hy+ny);ctx.lineTo(hx-nx,hy-ny);ctx.closePath();ctx.fillStyle=g;ctx.globalAlpha=1;ctx.fill()}
// jagged bolt between two points; the shape re-rolls every 0.05 s so it flickers
function arnBolt(x0,y0,x1,y1,seed,t,w,col,a){
  const n=8,pts=[[x0,y0]],ds=seed+Math.floor(t/0.05)*7.1,L=Math.hypot(x1-x0,y1-y0)||1,nx=-(y1-y0)/L,ny=(x1-x0)/L;
  for(let i=1;i<n;i++){const p=i/n,j=(arnR(ds,i)-0.5)*2*Math.min(26,L*0.14);pts.push([x0+(x1-x0)*p+nx*j,y0+(y1-y0)*p+ny*j])}pts.push([x1,y1]);
  ctx.lineJoin='miter';
  for(const [lw,al,c] of [[w*3.4,0.2,col],[w,1,col],[w*0.4,1,'#FFFFFF']]){ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));
    if(lw===w){ctx.globalAlpha=a*0.5;ctx.strokeStyle=ARN.shade;ctx.lineWidth=lw+2;ctx.stroke()}ctx.globalAlpha=a*al;ctx.strokeStyle=c;ctx.lineWidth=lw;ctx.stroke()}}

/* =============== 1. METEOR SHOWER: a marked zone, six meteors in a staggered rhythm, mini-impact + scorch each, the last one biggest =============== */
ARN.cast.meteor=function(D){
  const c=arnPoint(D.range,D.zone*0.8,D.ahead),seed=++ARN.n,mets=[];
  for(let i=0;i<D.n;i++){const last=i===D.n-1,a=i*2.4+seed,rad=D.zone*0.8*Math.sqrt((i+0.5)/D.n);
    mets.push({x:last?c.x:c.x+Math.cos(a)*rad,y:last?c.y:c.y+Math.sin(a)*rad*0.8,t0:D.tele+i*D.gap,landed:0,big:last})}
  arnFx({k:'meteor',x:c.x,y:c.y,mets,bursts:[],scorch:[],seed,end:0});return true};
ARN.up.meteor=(f,dt)=>{const D=ARN.D.meteor;f.t+=dt;let all=1;
  for(const m of f.mets){
    if(!m.landed&&f.t>=m.t0+D.fall){m.landed=1;const r=D.r*(m.big?D.lastK:1);
      arnHit(m.x,m.y,r,D.dmg*(m.big?D.lastDmg:1),D.dt);f.bursts.push({x:m.x,y:m.y,t:0,big:m.big,seed:f.seed+m.t0});f.scorch.push({x:m.x,y:m.y,t:0,r:r*0.8,seed:m.t0});sfx('imp_hammer',m.big?1.3:1)}
    if(!m.landed)all=0}
  for(const b of f.bursts)b.t+=dt;for(const s of f.scorch)s.t+=dt;
  if(all&&!f.end)f.end=f.t;return !!f.end&&f.t>f.end+D.scorch};
ARN.dr.meteor=f=>{const D=ARN.D.meteor,col=dtCol(D.dt);
  for(const s of f.scorch){const a=Math.max(0,1-s.t/D.scorch);if(a<=0)continue;   // scorch: dark patch + cracks that cool from orange to dark
    arnEll(s.x,s.y,s.r);ctx.globalAlpha=a*0.5;ctx.fillStyle='#17110F';ctx.fill();
    const g=Math.max(0,1-s.t/1.1);if(g>0){ctx.beginPath();for(let i=0;i<5;i++){const an=arnR(s.seed,i)*6.28,L=s.r*(0.5+0.5*arnR(s.seed,i+9));ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.cos(an)*L*0.5+arnR(s.seed,i+3)*8,s.y+Math.sin(an)*L*0.45*ARN.sq);ctx.lineTo(s.x+Math.cos(an)*L,s.y+Math.sin(an)*L*ARN.sq)}arnSh(1.6,col,g)}}
  // the zone rune: one outline whose fill is the timer; it snaps shut after the last meteor
  const q=f.end?Math.min(1,(f.t-f.end)/D.rune):0;if(q<1)arnTgZone(f.x,f.y,D.zone*(1-q),Math.min(1,f.t/D.tele),1-q);
  for(const m of f.mets){
    if(f.t<m.t0)continue;const p=(f.t-m.t0)/D.fall;
    if(!m.landed){   // small landing mark, then the meteor itself
      {const q=D.r*(m.big?D.lastK:1)*(1.25-0.4*p);arnPoly([[m.x,m.y-q*ARN.sq],[m.x+q,m.y],[m.x,m.y+q*ARN.sq],[m.x-q,m.y]]);arnSh(1.8,ARN.tg,0.9)}   // sharp diamond, not a ring, so it does not stack with the zone outline
      
      const e=Math.pow(Math.min(1,p),1.5),hx=m.x+D.lean*(1-e),hy=m.y-D.height*(1-e),pe=Math.max(0,e-0.22),tx=m.x+D.lean*(1-pe),ty=m.y-D.height*(1-pe);
      const dx=hx-tx,dy=hy-ty,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,sz=m.big?2.0:1.55;
      arnStreak(tx,ty,hx,hy,8*sz,col,0.95);
      arnPoly([[hx+ux*13*sz,hy+uy*13*sz],[hx-uy*7*sz,hy+ux*7*sz],[hx-ux*10*sz,hy-uy*10*sz],[hx+uy*7*sz,hy-ux*7*sz]]);ctx.globalAlpha=1;ctx.fillStyle='#FFF3C4';ctx.fill();arnSh(1.4,col,1)}}
  for(const b of f.bursts){const k=b.t/0.28;arnBurst(b.x,b.y,k,b.big?150:105,10,col);
    if(!arnLite()&&b.t<0.5){const k2=b.t/0.5;ctx.beginPath();for(let i=0;i<5;i++){const an=arnR(b.seed,i)*6.28,d=(b.big?70:48)*(0.4+0.7*k2)*(0.6+0.4*arnR(b.seed,i+5)),x=b.x+Math.cos(an)*d,y=b.y+Math.sin(an)*d*0.8-46*k2+60*k2*k2;ctx.moveTo(x,y-3);ctx.lineTo(x+2,y);ctx.lineTo(x,y+3);ctx.lineTo(x-2,y);ctx.closePath()}ctx.globalAlpha=1-k2;ctx.fillStyle='#FFD84D';ctx.fill()}}};

/* =============== 2. LIGHTNING ROD: thrown rod, storm cloud gathers, five strikes on the rod, each discharges to nearby foes, the last is a radial pulse =============== */
ARN.cast.rod=function(D){
  const c=arnPoint(D.range,140,D.ahead),seed=++ARN.n;
  arnFx({k:'rod',x:c.x,y:c.y,hx:P.x,hy:P.y-18,seed,done:[],chains:[],bursts:[],shards:null});return true};
ARN.up.rod=(f,dt)=>{const D=ARN.D.rod;f.t+=dt;
  for(let i=0;i<D.strikes;i++){const ts=D.first+i*D.gap;
    if(f.done[i]||f.t<ts)continue;f.done[i]=1;const last=i===D.strikes-1;
    if(last){arnHit(f.x,f.y,D.finalR,D.finalDmg,D.dt);f.bursts.push({x:f.x,y:f.y-D.rodH,t:0,big:1});sfx('imp_wall')}
    else{arnHit(f.x,f.y,D.tipR,D.dmg,D.dt);
      const near=arnFoes().filter(e=>Math.hypot(e.x-f.x,e.y-f.y)<D.chainR).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y)).slice(0,D.chain);
      for(const e of near){f.chains.push({x:e.x,y:e.y-6,t:ts,s:i*3.1+e.x*0.01});damage(e,skBase()*D.dmg*D.chainK,'skill',Math.atan2(e.y-f.y,e.x-f.x),D.dt,true);ARN.stat.hits++}
      f.bursts.push({x:f.x,y:f.y-D.rodH,t:0,big:0});sfx('cast_lightning',1.2)}}
  for(const b of f.bursts)b.t+=dt;
  return f.t>D.first+(D.strikes-1)*D.gap+D.end};
ARN.dr.rod=f=>{const D=ARN.D.rod,col=dtCol(D.dt),tl=D.first+(D.strikes-1)*D.gap;
  // flight: spinning rod on an arc, with a trail
  if(f.t<D.fly){const p=f.t/D.fly,x=f.hx+(f.x-f.hx)*p,y=f.hy+(f.y-f.hy)*p-90*Math.sin(Math.PI*p),pp=Math.max(0,p-0.22),tx=f.hx+(f.x-f.hx)*pp,ty=f.hy+(f.y-f.hy)*pp-90*Math.sin(Math.PI*pp),an=f.t*30;
    arnStreak(tx,ty,x,y,3.5,col,0.9);arnPoly([[x+Math.cos(an)*16,y+Math.sin(an)*16],[x-Math.sin(an)*3,y+Math.cos(an)*3],[x-Math.cos(an)*16,y-Math.sin(an)*16],[x+Math.sin(an)*3,y-Math.cos(an)*3]]);ctx.globalAlpha=1;ctx.fillStyle='#E8D9FF';ctx.fill();arnSh(1.2,col,1);return}
  const ft=f.t-(tl+D.end*0.5),endk=ft>0?Math.min(1,ft/(D.end*0.5)):0;   // end: cloud collapses and the rod shatters
  // cue: the tip lights up just before each strike
  let cue=0;for(let i=0;i<D.strikes;i++){const ts=D.first+i*D.gap;if(f.t>ts-D.cue&&f.t<ts)cue=(f.t-(ts-D.cue))/D.cue}
  const cl=Math.min(1,(f.t-D.fly)/D.cloud)*(1-endk),cx=f.x,cy=f.y-D.cloudH;
  if(cl>0){const S0=[[-80,0],[-60,-26],[-30,-14],[-8,-38],[22,-18],[52,-30],[78,-6],[50,10],[0,6],[-48,12]];
    arnPoly(S0.map(q=>[cx+q[0]*cl,cy+q[1]*cl*0.9]));ctx.globalAlpha=0.9*cl;ctx.fillStyle='#2A2144';ctx.fill();arnSh(1.6,col,0.9*cl)}
  if(endk<1){   // rod: shaft + sharp finial
    const rh=D.rodH*(1-endk);ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y-rh);arnSh(3.2,'#B9B4C8',1);
    arnPoly([[f.x,f.y-rh-12],[f.x+4,f.y-rh],[f.x,f.y-rh+4],[f.x-4,f.y-rh]]);ctx.globalAlpha=1;ctx.fillStyle=cue>0?'#FFFFFF':'#E8D9FF';ctx.fill();arnSh(1.2,col,1);
    if(cue>0){arnStar(f.x,f.y-rh,6,22*cue,3,0.4,col,0.9,1)}}
  else if(!arnLite()){const k=endk;ctx.beginPath();for(let i=0;i<4;i++){const an=-1.2+i*0.8,d=40*k,x=f.x+Math.cos(an)*d,y=f.y-D.rodH*0.5+Math.sin(an)*d+30*k*k;ctx.moveTo(x,y-5);ctx.lineTo(x+2,y);ctx.lineTo(x,y+5);ctx.lineTo(x-2,y);ctx.closePath()}ctx.globalAlpha=1-k;ctx.fillStyle='#E8D9FF';ctx.fill()}
  // strikes
  for(let i=0;i<D.strikes;i++){const ts=D.first+i*D.gap,k=(f.t-ts)/0.22;if(k<0||k>=1)continue;const last=i===D.strikes-1;
    arnBolt(cx+(arnR(f.seed,i)-0.5)*30,cy+10,f.x,f.y-D.rodH,f.seed+i,f.t,last?5:3,col,1-k)}
  for(const c of f.chains){const k=(f.t-c.t)/0.2;if(k<0||k>=1)continue;arnBolt(f.x,f.y-D.rodH,c.x,c.y,c.s,f.t,2,col,1-k);arnStar(c.x,c.y,6,14*(1-k),2,0.5,'#FFFFFF',1-k,0.8)}
  for(const b of f.bursts)arnBurst(b.x,b.y+D.rodH,b.t/0.28,b.big?D.finalR:46,b.big?12:6,col);}

/* =============== 3. SKYBLADE ORBIT: three spectral blades orbit the hero (contact nicks only, NO defence), then launch one by one and stick in the ground =============== */
ARN.cast.blade=function(D){const bl=[];for(let i=0;i<D.n;i++)bl.push({i,st:'orbit',x:P.x,y:P.y,ang:0,last:new Map(),vx:0,vy:0,go:0,dist:0,hit:new Set(),stuck:0});
  arnFx({k:'blade',bl,taken:new Set(),seed:++ARN.n});return true};
ARN.up.blade=(f,dt)=>{const D=ARN.D.blade;f.t+=dt;let alive=0;
  for(const b of f.bl){
    if(b.st==='orbit'){
      const a=f.t*D.spin+b.i*6.2832/D.n,R=D.orbitR*Math.min(1,f.t/D.appear);b.x=P.x+Math.cos(a)*R;b.y=P.y+Math.sin(a)*R;b.ang=a+1.5708;b.oa=a;
      if(f.t>D.appear){for(const e of enemies){if(e.dead||e.node||Math.hypot(e.x-b.x,e.y-b.y)>D.nickR+e.r)continue;const l=b.last.get(e)||-9;if(f.t-l<D.nickCd)continue;b.last.set(e,f.t);damage(e,skBase()*D.nick,'skill',b.ang,D.dt);ARN.stat.hits++;ARN.stat.nicks++;b.nk=f.t}}   // the only interaction: a nick on contact
      if(f.t>=D.orbit+b.i*D.launchGap){   // launch at the nearest foe not yet taken (else straight ahead)
        let t=null,bd=D.range;for(const e of enemies){if(e.dead||e.node||f.taken.has(e))continue;const d=Math.hypot(e.x-b.x,e.y-b.y);if(d<bd){bd=d;t=e}}
        let tx,ty;if(t){f.taken.add(t);tx=t.x;ty=t.y}else{const a2=P.aim||0;tx=b.x+Math.cos(a2)*D.fwd;ty=b.y+Math.sin(a2)*D.fwd}
        const d=Math.hypot(tx-b.x,ty-b.y)||1;b.vx=(tx-b.x)/d;b.vy=(ty-b.y)/d;b.go=d+30;b.dist=0;b.ang=Math.atan2(b.vy,b.vx);b.st='fly';b.x0=b.x;b.y0=b.y;sfx('shoot',1.3)}}
    else if(b.st==='fly'){const st=Math.min(b.go-b.dist,D.speed*dt);b.x+=b.vx*st;b.y+=b.vy*st;b.dist+=st;
      for(const e of enemies){if(e.dead||e.node||b.hit.has(e)||Math.hypot(e.x-b.x,e.y-b.y)>D.hitR+e.r)continue;b.hit.add(e);damage(e,skBase()*D.hit,'skill',b.ang,D.dt);ARN.stat.hits++}
      if(b.dist>=b.go){b.st='stuck';b.stuck=0;ARN.stat.stuck++}}
    else if(b.st==='stuck'){b.stuck+=dt;if(b.stuck>=D.stick)b.st='gone'}
    if(b.st!=='gone')alive++}
  return !alive};
ARN.dr.blade=f=>{const D=ARN.D.blade,col='#CFEFFF';
  const shape=(x,y,an,sz)=>{const c=Math.cos(an),s=Math.sin(an),P2=(a,b)=>[x+c*a*sz-s*b*sz,y+s*a*sz+c*b*sz];
    arnPoly([P2(24,0),P2(7,4.5),P2(-12,3),P2(-12,-3),P2(7,-4.5)]);ctx.globalAlpha=0.92;ctx.fillStyle='#E8F8FF';ctx.fill();arnSh(1.3,col,0.95);
    ctx.beginPath();ctx.moveTo(...P2(-9,-9));ctx.lineTo(...P2(-9,9));arnSh(2,col,0.95);ctx.beginPath();ctx.moveTo(...P2(-10,0));ctx.lineTo(...P2(19,0));ctx.globalAlpha=0.9;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1;ctx.stroke()};
  for(const b of f.bl){
    if(b.st==='orbit'){const ap=Math.min(1,f.t/D.appear),lift=22+70*(1-ap)*(1-ap);   // materialises above the hero, then settles into the orbit
      for(let k=5;k>=1;k--){const a=b.oa-k*0.07,R=D.orbitR*ap,x0=P.x+Math.cos(a)*R,y0=P.y+Math.sin(a)*R-lift,a2=b.oa-(k-1)*0.07,x1=P.x+Math.cos(a2)*R,y1=P.y+Math.sin(a2)*R-lift;arnStreak(x0,y0,x1,y1,3.2,col,0.28*ap)}   // directional arc trail
      shape(b.x,b.y-lift,b.ang,1.25+0.2*ap);
      if(b.nk!=null&&f.t-b.nk<0.12)arnStar(b.x,b.y-lift,6,14*(1-(f.t-b.nk)/0.12),2,0.5,'#FFFFFF',1,0.9)}
    else if(b.st==='fly'){arnStreak(b.x-b.vx*110,b.y-b.vy*110-22,b.x,b.y-22,7,col,0.9);shape(b.x,b.y-22,b.ang,1.6)}
    else if(b.st==='stuck'){const k=b.stuck/D.stick,a=k>0.6?1-(k-0.6)/0.4:1,tilt=-1.5708+0.28;   // sticks in the ground, glints, fades
      if(b.stuck<0.28)arnBurst(b.x,b.y,b.stuck/0.28,34,8,col);
      ctx.save();ctx.globalAlpha=a;shape(b.x+Math.cos(tilt)*30,b.y+Math.sin(tilt)*30,tilt+Math.PI,1.5);ctx.restore();
      if(k>0.55&&k<0.8){const g=(k-0.55)/0.25;arnStar(b.x+Math.cos(tilt)*58,b.y+Math.sin(tilt)*58,4,12*(1-Math.abs(g-0.5)*2),2,0.8,'#FFFFFF',1,1)}}}};

/* =============== 4. MOONFALL: the execute. Long telegraph, a huge moon-shard descends slowly, the biggest single impact (bonus vs elites and bosses) =============== */
ARN.cast.moon=function(D){
  let t=null,bd=D.range;for(const e of arnFoes()){if(!arnBig(e))continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;t=e}}   // elites and bosses first
  const c=t?{x:t.x,y:t.y}:arnPoint(D.range,D.r,D.ahead);arnFx({k:'moon',x:c.x,y:c.y,hit:0,burst:0,seed:++ARN.n});return true};   // the point is locked at cast: it does not follow
ARN.up.moon=(f,dt)=>{const D=ARN.D.moon;f.t+=dt;
  if(!f.hit&&f.t>=D.tele){f.hit=1;f.burst=0;arnHit(f.x,f.y,D.r,D.dmg,D.dt,e=>arnBig(e)?D.eliteK:1);sfx('tower_fall');sfx('imp_wall')}
  if(f.hit)f.burst+=dt;return f.hit&&f.t>D.tele+2.6};
ARN.dr.moon=f=>{const D=ARN.D.moon,col=dtCol(D.dt),T=D.tele;
  if(f.hit){const a=Math.max(0,1-(f.t-T)/2.4);   // crater: dark patch with cold cracks, fades
    arnEll(f.x,f.y,D.r*0.8);ctx.globalAlpha=a*0.55;ctx.fillStyle='#0E1018';ctx.fill();
    ctx.beginPath();for(let i=0;i<7;i++){const an=arnR(f.seed,i)*6.28,L=D.r*(0.7+0.5*arnR(f.seed,i+4));let x=f.x,y=f.y;ctx.moveTo(x,y);for(let s=1;s<=3;s++){x=f.x+Math.cos(an)*L*s/3+(arnR(f.seed,i*3+s)-0.5)*16;y=f.y+Math.sin(an)*L*s/3*ARN.sq+(arnR(f.seed,i*5+s)-0.5)*10;ctx.lineTo(x,y)}}arnSh(1.8,col,a*Math.max(0.3,1-(f.t-T)/1.2))}
  else{const p=Math.min(1,f.t/T);   // telegraph: one zone, the fill is the timer, plus a thin ominous column
    arnTgZone(f.x,f.y,D.r,p,1);
    if(f.t>D.fallAt*0.5){ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x,f.y-520);arnSh(1.2,col,0.35*p)}
    if(f.t>=D.fallAt){   // the shard: slow at first (ease-in), growing with perspective, long thin trail upward
      const q=Math.min(1,(f.t-D.fallAt)/D.fallT),e=Math.pow(q,2.2),h=D.height*(1-e),sc=0.4+0.6*e,y=f.y-h,x=f.x+36*(1-e);
      arnStreak(x+16*(1-e),y-300*sc,x,y,12*sc,col,0.55);
      const P0=[[0,64],[-24,12],[-15,-52],[0,-74],[15,-52],[24,12]].map(p=>[x+p[0]*sc*1.7,y+p[1]*sc*1.7]);
      arnPoly(P0);ctx.globalAlpha=0.95;ctx.fillStyle='#DDF6FF';ctx.fill();
      arnPoly([P0[0],P0[1],P0[2],P0[3]]);ctx.globalAlpha=0.55;ctx.fillStyle='#8FD8F5';ctx.fill();   // darker facet
      arnPoly(P0);arnSh(2,'#FFFFFF',0.9);ctx.beginPath();ctx.moveTo(P0[3][0],P0[3][1]);ctx.lineTo(P0[0][0],P0[0][1]);arnSh(1.2,col,0.8)}}
  if(f.hit&&f.burst<0.4){const k=f.burst/0.4,a=Math.max(0,1-k/0.9);   // the impact: one light pillar, one sharp hexagonal shock edge, ice-shard star. Fast decay.
    const w=36*(1-k*0.8);ctx.beginPath();ctx.moveTo(f.x-w,f.y);ctx.lineTo(f.x-w*0.22,f.y-430);ctx.lineTo(f.x+w*0.22,f.y-430);ctx.lineTo(f.x+w,f.y);ctx.closePath();
    const g=ctx.createLinearGradient(0,f.y,0,f.y-430);g.addColorStop(0,'rgba(255,255,255,0.95)');g.addColorStop(0.6,arnRgb(col,0.5));g.addColorStop(1,arnRgb(col,0));ctx.globalAlpha=a;ctx.fillStyle=g;ctx.fill();
    const rr=D.r*(0.3+0.8*Math.min(1,k/0.5));ctx.beginPath();for(let i=0;i<6;i++){const an=i*1.0472+0.52;ctx.lineTo(f.x+Math.cos(an)*rr,f.y+Math.sin(an)*rr*ARN.sq)}ctx.closePath();arnSh(2.6,'#FFFFFF',a*0.9);
    arnBurst(f.x,f.y,Math.min(1,f.burst/0.3),150,12,col)}};

/* =============== 5. GRAVITAS RIFT: a rift opens above the zone, foes are dragged in (pull exists ONLY here), debris spirals up, it collapses with a scattering pop =============== */
ARN.cast.rift=function(D){const c=arnPoint(D.range,D.r*0.7,D.ahead);arnFx({k:'rift',x:c.x,y:c.y,seed:++ARN.n,pop:0,dragged:new Set()});return true};
ARN.up.rift=(f,dt)=>{const D=ARN.D.rift;f.t+=dt;
  if(f.t>D.open&&f.t<D.open+D.pull){   // pull: only here, only the displacement; boss immune, elites half
    for(const e of enemies){if(e.dead||e.node)continue;const dx=f.x-e.x,dy=f.y-e.y,d=Math.hypot(dx,dy);if(d>D.r+e.r||d<8)continue;
      const k=e.isBoss?D.bossK:arnBig(e)?D.eliteK:1;if(!k)continue;const st=Math.min(d-4,D.pullSpd*k*dt);e.x+=dx/d*st;e.y+=dy/d*st;f.dragged.add(e);ARN.stat.pulled++}}
  if(!f.pop&&f.t>=D.open+D.pull){f.pop=f.t;arnHit(f.x,f.y,D.popR,D.dmg,D.dt);   // collapse: damage, then scatter outward
    for(const e of enemies){if(e.dead||e.node||e.isBoss||Math.hypot(e.x-f.x,e.y-f.y)-e.r>D.popR)continue;const a=Math.atan2(e.y-f.y,e.x-f.x);e.kx+=Math.cos(a)*D.knock;e.ky+=Math.sin(a)*D.knock}
    sfx('imp_wall')}
  return !!f.pop&&f.t>f.pop+0.45};
ARN.dr.rift=f=>{const D=ARN.D.rift,col=dtCol(D.dt),cx=f.x,cy=f.y-D.height;
  const pulling=f.t>D.open&&!f.pop;
  if(!f.pop){const p=Math.min(1,f.t/D.open);   // warning: the zone outline while it opens (the only ground ring), then it thins out
    arnTgZone(f.x,f.y,D.r,pulling?1:p,pulling?0.45:1)}
  // rift body: a sharp lens, dark centre, violet edge and thorn-like spikes
  const open=f.pop?Math.max(0,1-(f.t-f.pop)/0.12):Math.min(1,f.t/D.open),h=96*open,w=20*open*(f.pop?1:1+0.08*Math.sin(f.t*18));
  if(open>0){ctx.beginPath();for(let i=0;i<8;i++){const an=i*0.7854+0.2+f.t*0.6,L=(i%2?28:46)*open;ctx.moveTo(cx+Math.cos(an)*w*0.6,cy+Math.sin(an)*h*0.4);ctx.lineTo(cx+Math.cos(an)*L*1.2,cy+Math.sin(an)*L*1.5);ctx.lineTo(cx+Math.cos(an+0.12)*w*0.6,cy+Math.sin(an+0.12)*h*0.4)}ctx.globalAlpha=0.8;ctx.fillStyle=arnRgb(col,1);ctx.fill();
    arnPoly([[cx,cy-h],[cx+w,cy-h*0.3],[cx+w*0.6,cy],[cx+w,cy+h*0.3],[cx,cy+h],[cx-w,cy+h*0.3],[cx-w*0.6,cy],[cx-w,cy-h*0.3]]);ctx.globalAlpha=1;ctx.fillStyle='#07040F';ctx.fill();arnSh(2.4,'#C8A6FF',1)}
  if(pulling){
    // debris: shards spiral up from the ground toward the rift
    const nd=arnLite()?6:D.debris;ctx.beginPath();
    for(let i=0;i<nd;i++){const u=((f.t-D.open)*0.9+i/nd)%1,an=i*2.4+f.t*3.5*(1+u),r=D.r*0.85*(1-0.8*u),hh=D.height*u*0.95,x=cx+(f.x-cx)+Math.cos(an)*r,y=f.y+Math.sin(an)*r*0.6-hh;
      ctx.moveTo(x,y-4);ctx.lineTo(x+2.6,y);ctx.lineTo(x,y+4);ctx.lineTo(x-2.6,y);ctx.closePath()}
    ctx.globalAlpha=0.9;ctx.fillStyle='#CDB3FF';ctx.fill();
    // pull cue: short tapered streaks on dragged foes, pointing at the centre
    let n=0;for(const e of f.dragged){if(e.dead||n++>14)continue;const d=Math.hypot(f.x-e.x,f.y-e.y)||1,ux=(f.x-e.x)/d,uy=(f.y-e.y)/d;arnStreak(e.x-ux*26,e.y-uy*26-6,e.x+ux*4,e.y+uy*4-6,3,col,0.8)}}
  if(f.pop){const k=(f.t-f.pop)/0.28;if(k<1){arnBurst(f.x,f.y-D.height*0.35*(1-k),k,D.popR*0.85,12,col);   // one pop: spikes + one sharp hexagon edge, fast decay
      const rr=D.popR*(0.2+0.8*k);ctx.beginPath();for(let i=0;i<6;i++){const an=i*1.0472;ctx.lineTo(f.x+Math.cos(an)*rr,f.y+Math.sin(an)*rr*ARN.sq)}ctx.closePath();arnSh(2.2,'#FFFFFF',1-k)}}};

/* =============== 6. ARROW STORM: a marked lane, five rolling waves of arrows from near to far, shafts stay and fade near-to-far =============== */
ARN.cast.arrows=function(D){const a=arnDir(D.range),ox=P.x+Math.cos(a)*D.start,oy=P.y+Math.sin(a)*D.start,seg=D.len/D.waves,seed=++ARN.n,ar=[];
  for(let w=0;w<D.waves;w++){const n=D.per+(w===D.waves-1?Math.round(D.per*(D.lastExtra-1)):0);
    for(let i=0;i<n;i++){const u=seg*(w+arnR(seed,w*50+i)),v=(arnR(seed,w*50+i+400)-0.5)*2*D.half*0.92;
      ar.push({u,v,x:ox+Math.cos(a)*u-Math.sin(a)*v,y:oy+Math.sin(a)*u+Math.cos(a)*v,w,land:D.tele+w*D.gap+arnR(seed,w*50+i+800)*D.gap*0.7,tilt:(arnR(seed,i+w*7)-0.5)*0.5})}}
  arnFx({k:'arrows',a,ox,oy,ar,seed,wdone:[],seg});return true};
ARN.up.arrows=(f,dt)=>{const D=ARN.D.arrows;f.t+=dt;
  for(let w=0;w<D.waves;w++){if(f.wdone[w]||f.t<D.tele+w*D.gap+D.gap*0.5)continue;f.wdone[w]=1;sfx('shoot',1.2);   // each wave hits its stretch of the lane (rolling)
    const c=Math.cos(f.a),s=Math.sin(f.a),u0=f.seg*w-20,u1=f.seg*(w+1)+20;
    for(const e of enemies){if(e.dead||e.node)continue;const dx=e.x-f.ox,dy=e.y-f.oy,u=dx*c+dy*s,v=-dx*s+dy*c;if(u<u0||u>u1||Math.abs(v)>D.half+e.r)continue;damage(e,skBase()*D.dmg,'skill',f.a,D.dt);ARN.stat.hits++}}
  return f.t>D.tele+D.waves*D.gap+D.fall+D.stick+0.8};
ARN.dr.arrows=f=>{const D=ARN.D.arrows,c=Math.cos(f.a),s=Math.sin(f.a),L=D.len,hw=D.half,col=dtCol(D.dt);
  const P4=(u,v)=>[f.ox+c*u-s*v,f.oy+s*u+c*v],last=D.tele+D.waves*D.gap+0.2;
  if(f.t<last){const p=Math.min(1,f.t/D.tele),a=f.t<D.tele?1:Math.max(0,1-(f.t-D.tele)/(last-D.tele)*0.7);   // telegraph: the lane, with chevrons pointing the way it will roll
    arnPoly([P4(0,-hw),P4(L,-hw),P4(L,hw),P4(0,hw)]);ctx.globalAlpha=a*(0.04+0.12*p);ctx.fillStyle=ARN.tg;ctx.fill();ctx.setLineDash([10,7]);arnPoly([P4(0,-hw),P4(L,-hw),P4(L,hw),P4(0,hw)]);arnSh(2.2,ARN.tg,a*0.9);ctx.setLineDash([]);
    ctx.beginPath();for(let i=0;i<4;i++){const u=L*(i+0.5)/4;for(const q of [P4(u-14,-18),P4(u+10,0),P4(u-14,18)])ctx.lineTo(...q);ctx.moveTo(...P4(u+14,-18))}arnSh(2,ARN.tg,a*0.7)}
  ctx.lineCap='round';
  // stuck shafts: a fading forest, dissolving from the near end to the far end
  ctx.beginPath();let any=0;
  for(const r of f.ar){const age=f.t-(r.land+D.fall);if(age<0)continue;const fade=D.stick*(0.55+0.45*r.u/L);if(age>fade)continue;any=1;
    ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+Math.sin(r.tilt)*4,r.y-27);ctx.moveTo(r.x+Math.sin(r.tilt)*3,r.y-17);ctx.lineTo(r.x-2,r.y-21);ctx.moveTo(r.x+Math.sin(r.tilt)*3,r.y-17);ctx.lineTo(r.x+4,r.y-21)}
  if(any){ctx.globalAlpha=0.32;ctx.strokeStyle=ARN.shade;ctx.lineWidth=3.2;ctx.stroke();ctx.globalAlpha=0.95;ctx.strokeStyle='#F3EAD0';ctx.lineWidth=2;ctx.stroke()}
  // arrows in the air: one batched path of sharp streaks, and a tiny strike tick on landing
  ctx.beginPath();let air=0;for(const r of f.ar){const p=(f.t-r.land)/D.fall;if(p<0||p>=1)continue;air++;const e=p*p,hx=r.x+D.lean*(1-e),hy=r.y-D.height*(1-e),px=Math.max(0,e-0.14),tx=r.x+D.lean*(1-px),ty=r.y-D.height*(1-px);ctx.moveTo(tx,ty);ctx.lineTo(hx,hy)}
  if(air){ctx.globalAlpha=0.4;ctx.strokeStyle=ARN.shade;ctx.lineWidth=3.6;ctx.stroke();ctx.globalAlpha=1;ctx.strokeStyle='#FFF3C4';ctx.lineWidth=2.8;ctx.stroke()}
  ctx.beginPath();let ticks=0;for(const r of f.ar){const age=f.t-(r.land+D.fall);if(age<0||age>0.14||r.w===D.waves-1)continue;ticks++;const k=1-age/0.14;ctx.moveTo(r.x-6*k,r.y);ctx.lineTo(r.x+6*k,r.y);ctx.moveTo(r.x,r.y-5*k);ctx.lineTo(r.x,r.y)}
  if(ticks){ctx.globalAlpha=0.9;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.3;ctx.stroke()}
  const lw=D.waves-1,lt=D.tele+lw*D.gap+D.fall;   // the one strong burst: the last wave closes the lane with a sharp star at its far end
  if(f.t>lt&&f.t<lt+0.4){const e=P4(L*0.92,0);arnBurst(e[0],e[1],(f.t-lt)/0.28,96,10,col)}};

/* =============== 7. PHOENIX DASH: fire-wing surge forward, a wall of flame behind that burns (trail damage only in this prototype) =============== */
ARN.cast.phoenix=function(D){const m=Math.hypot(P.vx||0,P.vy||0),a=m>1?Math.atan2(P.vy,P.vx):P.aim||0;
  arnFx({k:'phoenix',a,pts:[],run:0,last:{x:P.x,y:P.y},tick:0,seed:++ARN.n});sfx('cast_fire');return true};   // no invulnerability and no hit on the dash itself
ARN.up.phoenix=(f,dt)=>{const D=ARN.D.phoenix;f.t+=dt;
  if(f.run<D.dist){const st=Math.min(D.dist-f.run,D.dist/D.dur*dt);P.x+=Math.cos(f.a)*st;P.y+=Math.sin(f.a)*st;if(typeof placeClamp==='function')placeClamp(P);f.run+=st;P.face=f.a;
    while(Math.hypot(P.x-f.last.x,P.y-f.last.y)>=D.step){const d=Math.hypot(P.x-f.last.x,P.y-f.last.y),k=D.step/d;f.last={x:f.last.x+(P.x-f.last.x)*k,y:f.last.y+(P.y-f.last.y)*k};f.pts.push({x:f.last.x,y:f.last.y,t0:f.t,i:f.pts.length})}}
  f.tick-=dt;if(f.tick<=0&&f.pts.length){f.tick=D.tick;const base=skBase()*D.dmg,live=f.pts.filter(p=>f.t-p.t0<D.trail);
    for(const e of enemies){if(e.dead||e.node)continue;let hit=0;for(const p of live)if(Math.hypot(e.x-p.x,e.y-p.y)<D.r+e.r){hit=1;break}if(hit){damage(e,base,'skill',f.a,D.dt);ARN.stat.hits++}}}
  return f.t>D.dur+D.trail+0.3};
ARN.dr.phoenix=f=>{const D=ARN.D.phoenix,col=dtCol(D.dt);
  // the flame wall: sharp tongues that flicker, shrink to embers at the end
  for(const p of f.pts){const age=f.t-p.t0;if(age>D.trail)continue;const grow=Math.min(1,age/0.15),dec=Math.min(1,(D.trail-age)/0.7),fl=0.8+0.3*Math.sin(f.t*14+p.i*1.7),h=(52+14*arnR(f.seed,p.i))*grow*fl*(0.25+0.75*dec);
    if(dec<0.2){ctx.beginPath();ctx.arc(p.x,p.y-3,2.2*dec*5,0,7);ctx.globalAlpha=dec*5;ctx.fillStyle='#FFB347';ctx.fill();continue}   // end: only glowing embers
    arnPoly([[p.x-10,p.y],[p.x+Math.sin(f.t*9+p.i)*3,p.y-h],[p.x+10,p.y]]);ctx.globalAlpha=0.95;ctx.fillStyle=col;ctx.fill();arnSh(1.2,'#FF5A1F',0.9);
    arnPoly([[p.x-3.5,p.y],[p.x+Math.sin(f.t*9+p.i)*2,p.y-h*0.62],[p.x+3.5,p.y]]);ctx.globalAlpha=0.95;ctx.fillStyle='#FFE38A';ctx.fill()}
  // wings: five sharp feathers per side, swept back; they spread during the dash and fold after it
  const wk=f.t<D.dur?Math.min(1,f.t/0.06):Math.max(0,1-(f.t-D.dur)/D.wings);
  if(wk>0){const sx=P.x,sy=P.y-20;
    for(const side of [-1,1])for(let k=0;k<5;k++){const an=f.a+Math.PI+side*(0.5+k*0.18)*(0.6+0.4*wk),len=(100-k*10)*wk;
      const tx=sx+Math.cos(an)*len,ty=sy+Math.sin(an)*len*0.9,px=-Math.sin(an)*4,py=Math.cos(an)*4;
      arnPoly([[sx+px,sy+py],[tx,ty],[sx-px,sy-py]]);ctx.globalAlpha=0.95*wk;ctx.fillStyle=k<2?'#FFD84D':col;ctx.fill();arnSh(1.1,'#FF5A1F',wk)}
    arnPoly([[sx+Math.cos(f.a)*30,sy+Math.sin(f.a)*30],[sx+Math.cos(f.a+1.57)*7,sy+Math.sin(f.a+1.57)*7],[sx-Math.cos(f.a)*8,sy-Math.sin(f.a)*8],[sx+Math.cos(f.a-1.57)*7,sy+Math.sin(f.a-1.57)*7]]);ctx.globalAlpha=wk;ctx.fillStyle='#FFF3C4';ctx.fill();arnSh(1.2,col,wk)}
  if(f.t<D.dur){const s=f.pts.length?f.pts[0]:null;if(s)arnStreak(s.x,s.y-8,P.x,P.y-8,10,col,0.7)}   // the surge streak
  if(f.t<0.3&&f.pts.length)arnBurst(f.pts[0].x,f.pts[0].y,f.t/0.28,60,8,col)};   // the one burst: ignition at the start point

/* =============== 8. JUDGMENT BEAM: a pillar of light walks slowly outward from the hero, ground glow ahead is the warning, scorch trail behind =============== */
ARN.cast.beam=function(D){arnFx({k:'beam',a:arnDir(D.range),d:D.start,tk:0,trail:[],lastP:null,fin:0,burst:0,seed:++ARN.n});sfx('ult_ready');return true};
ARN.up.beam=(f,dt)=>{const D=ARN.D.beam;f.t+=dt;const beaming=f.t>=D.warn&&f.t<D.warn+D.dur;
  if(beaming){f.d=D.start+D.speed*(f.t-D.warn);   // steer slowly toward the nearest foe around the head
    const hx=P.x+Math.cos(f.a)*f.d,hy=P.y+Math.sin(f.a)*f.d;let t=null,bd=D.range*0.7;for(const e of enemies){if(e.dead||e.node)continue;const d=Math.hypot(e.x-hx,e.y-hy);if(d<bd){bd=d;t=e}}
    if(t){const want=Math.atan2(t.y-P.y,t.x-P.x),df=angDiff(want,f.a),k=D.turn*dt;f.a=Math.abs(df)<=k?want:f.a+Math.sign(df)*k}
    const x=P.x+Math.cos(f.a)*f.d,y=P.y+Math.sin(f.a)*f.d;
    if(!f.lastP||Math.hypot(x-f.lastP.x,y-f.lastP.y)>=14){f.lastP={x,y};f.trail.push({x,y,t0:f.t})}
    f.tk-=dt;if(f.tk<=0){f.tk=D.tick;arnHit(x,y,D.w,D.dmg,D.dt)}}
  else if(f.t>=D.warn+D.dur&&!f.fin){f.fin=f.t;f.endX=P.x+Math.cos(f.a)*f.d;f.endY=P.y+Math.sin(f.a)*f.d;sfx('imp_hammer',1.4)}
  return !!f.fin&&f.t>f.fin+D.scorch};
ARN.dr.beam=f=>{const D=ARN.D.beam,col='#FFE9A0',beaming=!f.fin,hx=beaming?P.x+Math.cos(f.a)*f.d:f.endX,hy=beaming?P.y+Math.sin(f.a)*f.d:f.endY;
  // scorch trail (under everything): dark strip with an ember edge that cools
  ctx.lineCap='round';
  if(f.trail.length>1){for(const q of [[0,'#17110F',0.55,26],[1,'#FF8A3D',0.8,2]]){ctx.beginPath();let on=0;for(let i=0;i<f.trail.length;i++){const p=f.trail[i],age=f.t-p.t0,a=Math.max(0,1-age/D.scorch);if(a<=0)continue;on++;i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}
      if(on>1){const last=f.trail[f.trail.length-1];const a=Math.max(0,1-(f.t-last.t0)/D.scorch);ctx.globalAlpha=q[2]*(q[0]?Math.max(0,1-(f.t-f.trail[0].t0)/1.4):1)*Math.max(a,0.25);ctx.strokeStyle=q[1];ctx.lineWidth=q[3];ctx.stroke()}}}
  // thin origin line from the hero to the pillar
  ctx.beginPath();ctx.moveTo(P.x,P.y);ctx.lineTo(hx,hy);arnSh(1.6,col,beaming?0.55:Math.max(0,1-(f.t-f.fin)/0.3)*0.55);
  if(beaming){
    // warning: the ground glows ahead of the pillar, a long tapered strip with magenta edges
    const c=Math.cos(f.a),s=Math.sin(f.a),L=D.ahead,w0=D.w,w1=D.w*0.6,wp=f.t<D.warn?f.t/D.warn:1;
    const A=[hx-s*w0,hy+c*w0],B=[hx+c*L-s*w1,hy+s*L+c*w1],Cc=[hx+c*L+s*w1,hy+s*L-c*w1],Dd=[hx+s*w0,hy-c*w0],g=ctx.createLinearGradient(hx,hy,hx+c*L,hy+s*L);
    g.addColorStop(0,'rgba(255,233,160,0.5)');g.addColorStop(1,'rgba(255,233,160,0)');arnPoly([A,B,Cc,Dd]);ctx.globalAlpha=wp;ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();ctx.moveTo(...A);ctx.lineTo(...B);ctx.moveTo(...Dd);ctx.lineTo(...Cc);arnSh(1.8,ARN.tg,0.8*wp);
    if(f.t>=D.warn){   // the pillar: sharp-topped column, white core, flickering width; a base spike star
      const fl=0.9+0.1*Math.sin(f.t*40),w=D.w*0.55*fl,H=D.height,gp=ctx.createLinearGradient(0,hy,0,hy-H);gp.addColorStop(0,'rgba(255,255,255,0.95)');gp.addColorStop(0.5,arnRgb(col,0.6));gp.addColorStop(1,arnRgb(col,0));
      arnPoly([[hx-w,hy],[hx-w*0.2,hy-H],[hx+w*0.2,hy-H],[hx+w,hy]]);ctx.globalAlpha=1;ctx.fillStyle=gp;ctx.fill();
      arnPoly([[hx-w*0.32,hy],[hx,hy-H*0.8],[hx+w*0.32,hy]]);ctx.globalAlpha=0.95;ctx.fillStyle='#FFFFFF';ctx.fill();
      ctx.beginPath();ctx.moveTo(hx-w,hy);ctx.lineTo(hx-w*0.2,hy-H);ctx.moveTo(hx+w,hy);ctx.lineTo(hx+w*0.2,hy-H);arnSh(1.4,col,0.9);
      if(!arnLite())arnStar(hx,hy,8,34,3,f.t*2,col,0.85,0.8)}}
  else{const k=(f.t-f.fin)/D.end;   // end: the pillar narrows to a line and bursts once at the final point
    if(k<1){const w=D.w*0.55*(1-k),H=D.height*(1-k*0.5);arnPoly([[hx-w,hy],[hx,hy-H],[hx+w,hy]]);ctx.globalAlpha=1-k;ctx.fillStyle='#FFFFFF';ctx.fill();arnBurst(hx,hy,Math.min(1,(f.t-f.fin)/0.28),90,10,col)}}};

/* =============== engine: cast / update / draw / HUD =============== */
function arnCast(id){
  if(!arnArena())return false;const s=arnS(),D=ARN.D[id];if(!D||(s.cd[id]||0)>S.t)return false;
  if(!ARN.cast[id](D))return false;
  s.cd[id]=S.t+D.cd;ARN.stat.casts[id]=(ARN.stat.casts[id]||0)+1;arnAnim(id);sfxCast(D.dt);return true}
ARN.use=arnCast;

{const old=skillsReset;skillsReset=function(){const r=old.apply(this,arguments);if(ARN.s)ARN.s=null;return r}}
{const old=skillsUpdate;skillsUpdate=function(dt){
  const r=old.apply(this,arguments);if(!arnArena()||!ARN.s)return r;
  const fx=ARN.s.fx;for(const f of fx)f.done_=ARN.up[f.k](f,dt);ARN.s.fx=fx.filter(f=>!f.done_);return r}}
{const old=drawSkills;drawSkills=function(){
  const r=old.apply(this,arguments);if(!ARN.on||!ARN.s||!ARN.s.fx.length||!skArena()||S.mb)return r;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='miter';ctx.miterLimit=3;ARN.stat.drawn++;
  for(const f of ARN.s.fx){ctx.save();ARN.dr[f.k](f);ctx.restore()}
  ctx.restore();ctx.globalAlpha=1;return r}}
{const old=skillsHud;skillsHud=function(){const r=old.apply(this,arguments);if(ARN.bar)arnHud();return r}}

/* ---- the preview bar: 8 round buttons, own cooldowns, hidden outside the arena ---- */
const ARN_GLYPH={meteor:'M5 4l10 10M13 14m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0M3 10l5 5',rod:'M12 3v18M8 8l4-5 4 5M9 14l-3 5M15 14l3 5',blade:'M12 2l3.5 11-3.5 3-3.5-3zM12 16v6M8 18h8',moon:'M17 3a9 9 0 1 0 4 13A7 7 0 0 1 17 3z',rift:'M12 3c4 4 4 14 0 18-4-4-4-14 0-18zM12 7v10',arrows:'M5 3l4 8M12 2l4 9M19 4l-3 8M5 15l4 6M12 14l4 7',phoenix:'M12 21L3 6l6 4 3-7 3 7 6-4z',beam:'M9 2h6l-1.5 20h-3z'};
function arnBarMake(){
  if(ARN.bar)return;const b=document.createElement('div');b.className='arnbar';b.hidden=true;b.setAttribute('aria-label',T('arn.group'));
  b.innerHTML=ARN.order.map(id=>'<button type="button" class="arnb" data-arn="'+id+'" style="--dt:'+dtCol(ARN.D[id].dt)+'" aria-label="'+T('arn.'+id)+'" title="'+T('arn.'+id)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="'+ARN_GLYPH[id]+'"/></svg></button>').join('');
  b.addEventListener('pointerdown',e=>{const x=e.target.closest('[data-arn]');if(!x)return;e.preventDefault();e.stopPropagation();arnCast(x.dataset.arn)});
  document.body.appendChild(b);ARN.bar=b}
function arnHud(){
  const on=arnArena();if(ARN.bar.hidden===on)ARN.bar.hidden=!on;if(!on)return;const s=arnS();
  ARN.order.forEach((id,i)=>{const bt=ARN.bar.children[i],rem=Math.max(0,(s.cd[id]||0)-S.t),v=String(Math.round(20*rem/ARN.D[id].cd)/20),sec=rem>0?String(Math.ceil(rem)):'';
    if(bt.dataset.cd!==v){bt.dataset.cd=v;bt.style.setProperty('--cd',v)}if(bt.dataset.sec!==sec)bt.dataset.sec=sec})}
addEventListener('keydown',e=>{if(!ARN.on||!S||e.target!==document.body)return;const i=ARN.keys.indexOf(e.code);if(i>=0)arnCast(ARN.order[i])});

// switch on/off (the URL flag calls it at load; the bot toggles it)
function arnEnable(on){
  ARN.on=!!on;
  if(on){arnBarMake();if(typeof SKCAST!=='undefined')for(const k in ARN.anim)SKCAST.anim[k]=ARN.anim[k]}
  else{ARN.s=null;if(ARN.bar)ARN.bar.hidden=true}}
if(ARN.on)arnEnable(true);
