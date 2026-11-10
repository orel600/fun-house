/* Arena kinetic VFX draft. Appearance only. Owned Mochi-derived sheets.
   Opt out ?kinetic=0. Existing warning durations/transform/follow/attack paths unchanged.
   World/village and MOBA are excluded from this first implementation. */
const KINETIC={on:!/[?&]kinetic=0(?:&|$)/.test(location.search),hits:[],lastHit:-1,lastSwing:-1};
const kineticHere=()=>KINETIC.on&&S&&!S.mb&&!S.wd&&!S.vil&&!S.room;
for(const [k,D] of Object.entries(ARFX.tele)){
  const name=k==='aimed'?'volley':D.fx.replace('tg_','');
  const id='ar_warn_'+name;FXDATA[id]={c:6,r:4,n:24,s:384};
  // Query opt-out is resolved at boot. No changes to durations, damage or targeting.
  if(KINETIC.on)D.fx=id;
}
function kineticSprite(id,x,y,size,age,dur,rot=0,alpha=1){
  const im=fxImg(id),D=FXDATA[id];if(!im||!D)return;
  const n=Math.min(D.n-1,Math.floor(Math.max(0,age/dur)*D.n));
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=alpha;
  ctx.drawImage(im,(n%D.c)*D.s,Math.floor(n/D.c)*D.s,D.s,D.s,-size/2,-size/2,size,size);ctx.restore();
}
function kineticContact(e,crit,t,ang){
  if(!kineticHere()||fxLess()||e.node||S.t-KINETIC.lastHit<.045)return;
  KINETIC.lastHit=S.t;while(KINETIC.hits.length>=8)KINETIC.hits.shift();
  const L=lookOf(e),h=L.h*(e.big||1);
  KINETIC.hits.push({x:e.x-Math.cos(ang||0)*e.r*.6,y:e.y-h*.46,t:S.t,a:ang||0,crit:!!crit,col:AJ.src&&AJ.src.w==='sword'?'#70d8ff':AJ.src&&AJ.src.w==='gun'?'#fa6579':dtCol(t)});
}
function kineticDraw(){
  if(!kineticHere()){KINETIC.hits=[];return}
  ctx.save();
  KINETIC.hits=KINETIC.hits.filter(h=>S.t-h.t<.18);
  for(const h of KINETIC.hits){const t=S.t-h.t,k=1-t/.18,r=h.crit?42:28;
    // Two local contrast frames, not a fullscreen flash or hitstop.
    if(t<.045){ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.a);
      ctx.fillStyle='#100c18';ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(-r,-4);ctx.lineTo(r*1.3,-r*.3);ctx.lineTo(r,5);ctx.lineTo(-r*.6,r*.3);ctx.closePath();ctx.fill();ctx.restore()}
    // Compact directional impact: white core, coloured wedge, immediate expiry.
    if(t<.09){ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.a);const q=1-t/.09;
      ctx.globalAlpha=q;ctx.fillStyle=h.col;ctx.beginPath();ctx.moveTo(-15*q,-8*q);ctx.lineTo(31*q,0);ctx.lineTo(-7*q,11*q);ctx.lineTo(3*q,0);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff9dc';ctx.beginPath();ctx.ellipse(0,0,Math.max(.1,10*q),Math.max(.1,5*q),0,0,7);ctx.fill();ctx.restore()}
    kineticSprite(h.crit?'hit_crit':'hit_fire',h.x,h.y,r*1.8,t,.18,h.a,k*.45);
    ctx.strokeStyle='#fff9db';ctx.globalAlpha=k*k;ctx.lineWidth=Math.max(1,k*3);ctx.beginPath();
    for(let j=0;j<5;j++){const a=h.a+j*Math.PI*.4,L=r*(.35+t*4);ctx.moveTo(h.x+Math.cos(a)*5,h.y+Math.sin(a)*5);ctx.lineTo(h.x+Math.cos(a)*L,h.y+Math.sin(a)*L)}ctx.stroke();
  }
  ctx.restore();
}
(function(){
 const hit=juiceHit;juiceHit=function(e,d,m,c,t,a){const r=hit.apply(this,arguments);kineticContact(e,c,t,a);return r};
 const draw=drawSkills;drawSkills=function(){const r=draw.apply(this,arguments);kineticDraw();return r};
})();
fxPreload(['hit_fire','hit_crit','sf_embers','ar_warn_volley','ar_warn_circle','ar_warn_ring','ar_warn_growing','ar_warn_line','ar_warn_target','ar_warn_charge','ar_warn_skull']);

function kineticBullet(b){
 if(!kineticHere())return false;
 const v=Math.hypot(b.vx,b.vy)||1,ux=b.vx/v,uy=b.vy/v,L=Math.max(22,Math.min(65,v*.15));
 ctx.save();ctx.lineCap='round';
 for(const [w,c] of [[b.r*2.1,'#190e1b'],[b.r*1.15,'#ed4d62'],[Math.max(1,b.r*.35),'#fff6db']]){
 ctx.lineWidth=w;ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(b.x-ux*L,b.y-uy*L);ctx.lineTo(b.x,b.y);ctx.stroke()}
 ctx.fillStyle='#fff7dc';ctx.beginPath();ctx.arc(b.x,b.y,Math.max(1,b.r*.5),0,7);ctx.fill();ctx.restore();return true;
}
// The rejected primitive warning exists twice: atlas + dynamic 3D fill/outline.
// Keep ARDG's real clock/shape tracking, but reduce its solid fill to a floor haze.
// The new moving sheet is the visible anticipation; no duplicate magenta pane.
if(KINETIC.on){
 const fill3=ardg3dFill;ardg3dFill=function(m,op){fill3.apply(this,arguments);if(kineticHere()){m.material.opacity=0;m.visible=false}};
 const edge3=ardg3dEdge;ardg3dEdge=function(m,op,w){edge3.call(this,m,op,w*.45);if(kineticHere()){m.material.opacity=0;m.visible=false}};
}
// Read the attack that already happened. No new attack, movement or delay.
KINETIC.swings=[];
(function(){
 const atk=attack;attack=function(){const anim=P.sw&&P.sw.anim||0,r=atk.apply(this,arguments);
  if(kineticHere()&&P.weapon==='sword'&&P.sw.anim>anim){KINETIC.swings.push({x:P.x,y:P.y-heroLook().h*.45,a:P.sw.ang,t:S.t,r:P.sw.range});if(KINETIC.swings.length>4)KINETIC.swings.shift()}return r};
 const draw=kineticDraw;kineticDraw=function(){draw.apply(this,arguments);if(!kineticHere())return;
  KINETIC.swings=KINETIC.swings.filter(s=>S.t-s.t<.22);
  ctx.save();for(const s of KINETIC.swings){const t=S.t-s.t,k=t/.22,fade=1-k;
    // Layered curved motion, dark silhouette then blue-red edge then white tip.
    for(const [w,c,da] of [[16,'#110e1b',-.12],[9,'#60c5ed',-.05],[3,'#ffe9cf',0]]){
     ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*.88,s.r*.48,s.a,-1.15+k*.55+da,-.1+k*1.2+da);ctx.lineWidth=w*fade;ctx.strokeStyle=c;ctx.globalAlpha=fade;ctx.stroke()}}
  ctx.restore();
 };
 // Keep model identity visible on contact. This is render emissive only.
 const flash=setFlash;setFlash=function(a,k,c){return flash.call(this,a,kineticHere()&&k>.7?.08:k,c)};
})();

// Detonation is observed after the actual mine timer expires. No new damage call.
KINETIC.blasts=[];
(function(){
 const tick=update;update=function(dt){const before=kineticHere()?mines.slice():null;const r=tick.apply(this,arguments);
  if(before)for(const m of before)if(m.t<=0){KINETIC.blasts.push({x:m.x,y:m.y,t:S.t});if(KINETIC.blasts.length>10)KINETIC.blasts.shift()}
  return r;
 };
 const draw=kineticDraw;kineticDraw=function(){draw.apply(this,arguments);if(!kineticHere()){KINETIC.blasts=[];return}
  KINETIC.blasts=KINETIC.blasts.filter(b=>S.t-b.t<.2);ctx.save();
  for(const b of KINETIC.blasts){const k=(S.t-b.t)/.2,q=1-k;
   for(let j=0;j<9;j++){const a=j*Math.PI*2/9,L=18+45*k;
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);ctx.globalAlpha=q*q;ctx.fillStyle=j%2?'#ff6b57':'#fff0c9';ctx.beginPath();ctx.moveTo(5,-3*q);ctx.lineTo(L,0);ctx.lineTo(5,3*q);ctx.closePath();ctx.fill();ctx.restore()}
   if(k<.3){ctx.globalAlpha=1-k/.3;ctx.fillStyle='#fff1d2';ctx.beginPath();ctx.ellipse(b.x,b.y,12,8,0,0,7);ctx.fill()}
  }ctx.restore();
 };
})();
function kineticPlayerTrail(b){
 if(!kineticHere()||fxLess())return;
 const v=Math.hypot(b.vx,b.vy)||1,ux=b.vx/v,uy=b.vy/v;
 ctx.save();ctx.lineCap='round';const L=Math.max(15,Math.min(42,v*.06));
 for(const [w,c,alpha] of [[5,'#132538',.8],[2.4,'#55c4ee',.85],[.9,'#e8faff',.9]]){
  ctx.lineWidth=w;ctx.strokeStyle=c;ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(b.x-ux*L,b.y-uy*L);ctx.lineTo(b.x,b.y);ctx.stroke()
 }ctx.restore();
}
