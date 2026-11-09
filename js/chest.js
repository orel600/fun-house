/* Chest opening moment (Nir approved 9.11.2026, docs/concept-chest-opening.md). Prototype on ONE chest: m_chest in the meadow.
   Seven steps, from effects we already have (inspired by "7 steps to a juicy chest opening"):
   1. wobble + squash, faster and faster   2. stretch up and bounce back   3. lid slams open: hit-stop (jStop) + small shake
   4. gold light from inside, slow turning rays   5. shockwave ring   6. gold stars burst (jBurst)   7. tiny sparks keep floating up.
   While revealed but unopened the chest glints softly. The player keeps control the whole time (nothing is locked).
   Loot: the base secret-chest table (SECRETS.chest.loot) at the slam, plus a CHANCE of equipment (lootRoll in loot.js)
   with a tier CAP for the meadow, so the first chest of a fresh save can't break the early game. A rare item gets the rarity pillar.
   Fewer effects (fxLess): half the particles, no floating sparks. Reduced motion (calmOn / phone setting): no wobble, stretch,
   hit-stop or shake, rays don't turn, and the beat is short.
   Hooks: secretsUpdate (chStart / chUpdate) and secretsDraw (chOwn / chDraw) in secrets.js, chest3d in props3d.js. All numbers here. */

const CHEST={
  ids:{m_chest:1},                    // which chests get the moment (prototype: one). The rest open the old way
  // timeline in seconds from the touch. slam = lid opens + loot. end = the moment is over (rays and sparks fade by then)
  t:{wobble:0.55,stretch:0.15,slam:0.7,end:2.3},
  calmT:{slam:0.25,end:1.2},          // reduced motion: short and still
  wobble:{hz:[5,16],rot:0.16,squash:0.14},   // shakes from hz[0] to hz[1] per second, tilt (radians), squash (0.14 = 14%)
  stretch:0.24,                       // stretches up 24%, then bounces back
  stop:0.11,shake:5,                  // hit-stop and camera shake on the slam
  ring:{r:70,life:0.5,col:'#FFE7A3'},  // shockwave
  stars:{n:18,col:'gold'},            // jBurst (juice.js), capped by JUICE.parts.max
  rays:{n:8,len:95,w:0.13,spin:0.5,alpha:0.32,col:'#FFD866',fade:0.6},   // rays: count, length, width (radians), turns/second
  spark:{every:0.12,max:14,rise:38,life:1.4,col:'#FFE7A3',idle:0.9},     // floating sparks after the slam; idle: one every N seconds while waiting
  // equipment chance. tier p = percent for [wood, iron, silver, gold, legendary]; wood gets the rest. The cap is silver (2) in the meadow
  // 3D (Nir plays in 3D, coordinator 9.11): the chest is small among trees, so the moment is bigger there
  r3d:{k:1.9,model:1.35,stars:1.8,zoom:1.22,zin:0.25,zhold:0.7,zout:0.45},   // k: rays/pillar/ring size, model: chest scale, stars: star size, zoom: camera nudge (camZoom)
  gear:{chance:0.4,rolls:1,cap:2,p:[0,30,8,0,0]},
  n:0                                 // how many moments played (for the check)
};

const chOwn=s=>!!CHEST.ids[s.id];
const chCalm=()=>(typeof calmOn==='function'&&calmOn())||(typeof RM!=='undefined'&&RM);
// a moment is playing now: the skill reveal and the "Book / Try it" card wait for it (skillreveal.js, skguide.js)
const chBusy=()=>!!(typeof S!=='undefined'&&S&&S.wd&&S.wd.sc&&S.wd.sc.ch&&Object.keys(S.wd.sc.ch).length);
// camera nudge in 3D around the slam (camera.js multiplies camZoom by this). Rounded, since every change resizes the canvas
function chZoom(){
  if(!R3D.on||!chBusy())return 1;const Z=CHEST.r3d;let k=0;
  for(const id in S.wd.sc.ch){const c=S.wd.sc.ch[id];if(c.calm)continue;const t=c.t,a=CHEST.t.slam-Z.zin;
    const e=t<a?0:t<CHEST.t.slam?(t-a)/Z.zin:t<CHEST.t.slam+Z.zhold?1:Math.max(0,1-(t-CHEST.t.slam-Z.zhold)/Z.zout);k=Math.max(k,e*e*(3-2*e))}
  return Math.round((1+(Z.zoom-1)*k)*50)/50;
}
const chSt=()=>{const st=scState();return st.ch||(st.ch={})};   // per world visit: {id:{t,done,sp:[],sl}}

// called from secretsUpdate when the player touches a chest. true = this file handles it
function chStart(s){
  if(!chOwn(s))return false;const L=chSt();if(L[s.id])return true;
  L[s.id]={s,t:0,done:false,sp:[],spT:0,calm:chCalm()};CHEST.n++;sfx('tap');
  return true;
}
// every frame in the world (game time, so the hit-stop freezes it too)
function chUpdate(dt){
  if(!S.wd)return;const L=chSt(),K=CHEST,less=fxLess();
  for(const id in L){const c=L[id],T_=c.calm?K.calmT:K.t,t0=c.t;c.t+=dt;
    const cx=c.s.x+PROPS3D.chest.dx,cy=c.s.y;
    // wobble ticks: a little tap sound at each half shake while it builds
    if(!c.calm&&c.t<K.t.wobble&&Math.floor(t0*K.wobble.hz[0]*2)!==Math.floor(c.t*K.wobble.hz[0]*2))sfx('tap',0.6);
    if(!c.done&&c.t>=T_.slam){c.done=true;chSlam(c,cx,cy)}
    // floating sparks after the slam (not with fewer effects)
    if(c.done&&!less&&c.t<T_.end-0.4){c.spT-=dt;if(c.spT<=0&&c.sp.length<K.spark.max){c.spT=K.spark.every;c.sp.push({x:cx+rand(-12,12),y:cy-8,t:0,dx:rand(-8,8)})}}
    for(const p of c.sp)p.t+=dt;c.sp=c.sp.filter(p=>p.t<K.spark.life);
    if(c.t>=T_.end&&!c.sp.length)delete L[id];
  }
}
// step 3-6 + loot, all at once on the slam
function chSlam(c,cx,cy){
  const K=CHEST,s=c.s;
  if(!c.calm){jStop(K.stop,true);S.shake=Math.max(S.shake||0,K.shake)}
  c.ring=0;const J=juice().p,j0=J.length;jBurst(cx,cy-12,K.stars.col,c.calm?Math.round(K.stars.n/2):K.stars.n,null);if(R3D.on)for(let i=j0;i<J.length;i++)J[i].sz*=K.r3d.stars;   // 3D: bigger stars
  sfx('hit',1.4);sfx('coin',1.2);
  runGive(SECRETS.chest.loot,cx,cy);
  c.gear=chGear(cx,cy);
  scFind(s,cx,cy,true);   // the counter banner + save. quiet: no generic celebration, this moment replaces it
}
// equipment, maybe. Uses lootRoll with the meadow table (LOOT.gear.tier swapped for one call). Over the cap = no item
function chGear(x,y){
  const G=CHEST.gear;if(Math.random()>=G.chance*orbitLuck()*statLoot())return null;
  const keep=LOOT.gear.tier;let id;
  try{LOOT.gear.tier=[{lv:1,p:G.p}];id=lootRoll(G.rolls)}finally{LOOT.gear.tier=keep}
  const it=typeof gItem==='function'&&gItem(id);if(!it||it.tier>G.cap)return null;
  S.gearDrops=(S.gearDrops||0)+1;dropSpawn(id,1,x,y);
  if(feedOn())feedGear(id);else banner(T('loot.gear')+' '+gIcon(id)+' '+gName(id)+powTag(id),dropTier(id).col);
  if(it.tier>=G.cap){celebrate(x,y,'loot'+Math.max(2,dropRar(id)),gIcon(id));banner(T('chest.rare'),dropTier(id).col)}   // rare: the rarity pillar
  return id;
}

/* ---- drawing (2D canvas, also above 3D for the rays and sparks) ---- */
// how the chest body moves now: {rot, sx, sy, lid 0..1}
function chPose(c){
  if(!c)return {rot:0,sx:1,sy:1,lid:0};const K=CHEST,t=c.t;
  if(c.calm)return {rot:0,sx:1,sy:1,lid:c.done?1:0};
  if(t<K.t.wobble){const k=t/K.t.wobble,hz=K.wobble.hz[0]+(K.wobble.hz[1]-K.wobble.hz[0])*k,ph=Math.sin(t*hz*6.28)*k;
    return {rot:ph*K.wobble.rot,sx:1+Math.abs(ph)*K.wobble.squash,sy:1-Math.abs(ph)*K.wobble.squash,lid:0}}
  if(t<K.t.slam){const k=(t-K.t.wobble)/K.t.stretch,e=Math.sin(Math.min(1,k)*Math.PI);return {rot:0,sx:1-e*K.stretch*0.5,sy:1+e*K.stretch,lid:0}}
  const k=Math.min(1,(t-K.t.slam)/0.12);return {rot:0,sx:1+(1-k)*0.12,sy:1-(1-k)*0.12,lid:1};
}
// called at the end of secretsDraw (world coordinates)
function chDraw(){
  if(!S.wd)return;const L=chSt(),K=CHEST,two=!R3D.on,now=fxNow();
  for(const s of scList()){if(!chOwn(s)||scFound(s.id)&&!L[s.id])continue;const c=L[s.id],st=scState();
    if(!c&&!st['v'+s.id])continue;
    const cx=s.x+PROPS3D.chest.dx,cy=s.y;
    // waiting: a soft glint over the lid now and then (the "something's in there")
    if(!c){const ph=now%K.spark.idle,j=Math.floor(now/K.spark.idle);if(!fxLess()&&ph<0.35)scTwinkle(cx+Math.sin(j*2.4)*9,cy-16-Math.abs(Math.cos(j*1.7))*6,ph/0.35);if(two)chBox(cx,cy,{rot:0,sx:1,sy:1,lid:0});continue}
    const T_=c.calm?K.calmT:K.t,a=c.t-T_.slam,g=R3D.on?K.r3d.k:1,fade=Math.max(0,Math.min(1,(T_.end-c.t)/K.rays.fade));
    // 4. gold light from inside: a soft pillar and slow turning rays
    if(c.done&&fade>0){ctx.save();ctx.globalCompositeOperation='lighter';
      const k=Math.min(1,a/0.15),R=K.rays,spin=c.calm?0:a*R.spin*6.28,len=R.len*g;ctx.globalAlpha=Math.min(1,R.alpha*(R3D.on?1.6:1))*k*fade;ctx.fillStyle=R.col;
      const n=fxLess()?Math.ceil(R.n/2):R.n;
      for(let i=0;i<n;i++){const an=spin+i*6.28/n;ctx.beginPath();ctx.moveTo(cx,cy-10);
        ctx.lineTo(cx+Math.cos(an-R.w)*len*k,cy-10+Math.sin(an-R.w)*len*k*0.6);ctx.lineTo(cx+Math.cos(an+R.w)*len*k,cy-10+Math.sin(an+R.w)*len*k*0.6);ctx.fill()}
      const ph=150*g,pw=14*g,gr=ctx.createLinearGradient(0,cy-ph,0,cy);gr.addColorStop(0,'rgba(255,216,102,0)');gr.addColorStop(1,R.col);
      ctx.globalAlpha=Math.min(1,0.45*(R3D.on?1.6:1))*k*fade;ctx.fillStyle=gr;ctx.fillRect(cx-pw,cy-ph,pw*2,ph);ctx.restore()}
    // 5. shockwave ring
    if(c.done&&a<K.ring.life){const k=a/K.ring.life,r=(8+K.ring.r*k)*g;ctx.globalAlpha=0.9*(1-k);ctx.strokeStyle=K.ring.col;ctx.lineWidth=(4*(1-k)+1)*(R3D.on?1.6:1);
      ctx.beginPath();ctx.ellipse(cx,cy,r,r*0.55,0,0,7);ctx.stroke();ctx.globalAlpha=1}
    if(two)chBox(cx,cy,chPose(c));
    // 7. tiny sparks floating up
    ctx.fillStyle=K.spark.col;for(const p of c.sp){const k=p.t/K.spark.life;ctx.globalAlpha=Math.sin(k*Math.PI)*0.9;ctx.fillRect(p.x+p.dx*k-1.5,p.y-k*K.spark.rise*2.2-1.5,3,3)}
    ctx.globalAlpha=1;
  }
}
// the chest in 2D: flat colors, bottom-anchored so squash and stretch read
function chBox(x,y,p){
  ctx.save();ctx.translate(x,y+8);ctx.rotate(p.rot);ctx.scale(p.sx,p.sy);
  ctx.fillStyle='#7A5230';ctx.strokeStyle='#3A2412';ctx.lineWidth=2;
  ctx.fillRect(-14,-16,28,16);ctx.strokeRect(-14,-16,28,16);
  if(p.lid){ctx.fillStyle='#FFD866';ctx.fillRect(-12,-18,24,4);ctx.fillStyle='#7A5230';ctx.fillRect(-14,-30,28,9);ctx.strokeRect(-14,-30,28,9)}   // open: gold glow + lid up
  else{ctx.fillRect(-14,-24,28,9);ctx.strokeRect(-14,-24,28,9);ctx.fillStyle=C.gold;ctx.fillRect(-2,-19,4,6)}
  ctx.restore();
}
// 3D (props3d.js, every frame for each secret chest model): animates the model. Returns true to keep it visible while the moment plays
function chest3d(m,id){
  const c=S.wd&&chSt()[id];if(!c){if(m.userData.chP){m.rotation.z=0;m.scale.copy(m.userData.chS)}return false}
  const u=m.userData;if(!u.chS){u.chS=m.scale.clone();u.lid=m.children[1];u.lid0=u.lid.position.clone();u.chP=1}
  const p=chPose(c),b=u.chS,z=CHEST.r3d.model;m.rotation.z=p.rot;m.scale.set(b.x*p.sx*z,b.y*p.sy*z,b.z*p.sx*z);
  const w=PROPS3D.chest.w;u.lid.position.set(u.lid0.x,u.lid0.y+p.lid*w*0.35,u.lid0.z-p.lid*w*0.3);u.lid.rotation.x=-p.lid*1.1;
  return true;
}
