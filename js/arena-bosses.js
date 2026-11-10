/* Arena: three NEW boss archetypes as VISUAL SHELLS, preview only (ARENA-B, overhaul/arena-bosses, MAX 10.11.2026). Needs ?arenanew=1 AND ?arenaboss=choir|colossus|mirror.
   Off (the default): the normal boss is built exactly as today. Mechanics are NOT touched: same hp, hitbox r, patterns, speed.
   Only the body (3D look through lookOf) and a canvas overlay change. Source: overhaul-spec-arena-tier2.md section 6.
     choir:    Choir of Wisps. The boss body is a big ghost, and a swarm of small flames orbits it, scatters and regathers (visual only, one health bar = the boss's own).
     colossus: The Colossus. The stone giant model (mon_stoneGiant) with armor plates around it; a plate falls off each time hp crosses a step (6 plates, visual only).
     mirror:   The Mirror. The player's own hero model, bigger, with a ring of mirror shards. Gameplay (copying the player's skills) is OPEN design: not built.
   Hook: makeBoss is wrapped (boss.js itself is untouched); the wrapper returns the old boss and only adds b.arShell when the flag and a shell are on.
   Numbers are untested starting values in ARBOSS. In 2D (fallback) only the overlay shows, the body stays the old boss.
   Removing it: delete this file and its script line. */
const ARBOSS={
  shell:(/[?&]arenaboss=(choir|colossus|mirror)(&|$)/.exec(location.search)||[])[1]||null,
  ids:['choir','colossus','mirror'],
  look:{
    choir:{model:'mon_ghost',h:118,foot:12,float:14,anim:{run:'mon_ghost_Fast_Flying',idle:'mon_ghost_Fast_Flying',charge:'mon_ghost_Fast_Flying',cast:'mon_ghost_Fast_Flying',taunt:'mon_ghost_Fast_Flying',die:'mon_ghost_Death'}},
    colossus:{model:'mon_stoneGiant',h:230,foot:34,anim:{run:'mon_stoneGiant_Walk',idle:'mon_stoneGiant_Idle',charge:'mon_stoneGiant_Punch',cast:'mon_stoneGiant_Punch',taunt:'mon_stoneGiant_Idle',die:'mon_stoneGiant_Death'}}
  },
  mirrorK:2.3,                       // the mirror boss is this much bigger than the hero model (hero h 66 -> ~152, at least the normal boss 140; visual only)
  choirN:9,choirR:[62,150],choirT:6, // wisp count, orbit radius min/max, seconds per scatter-regather cycle
  plates:6,plateR:56,                // colossus: plate count and distance from the centre
  mirrorN:8,mirrorR:78,
  stat:{shells:0,drawn:0,breaks:0}
};
const arbOn=()=>typeof ARN!=='undefined'&&ARN.on&&!!ARBOSS.shell&&!S.mb;
{const old=makeBoss;makeBoss=function(){const b=old.apply(this,arguments);if(arbOn()){b.arShell=ARBOSS.shell;b.arPl=ARBOSS.plates;ARBOSS.stat.shells++;
  if(ARBOSS.shell==='colossus'&&typeof m3dNeed==='function')m3dNeed('mon_stoneGiant')}return b}}
// body: 3D look, only for the boss that carries a shell
let arbMirror=null;
{const old=lookOf;lookOf=function(e){
  if(!e||!e.arShell||e===P)return old.apply(this,arguments);
  if(e.arShell==='mirror'){const h=heroLook();if(!h)return old.apply(this,arguments);
    if(!arbMirror||arbMirror.src!==h){const a=h.anim||{};arbMirror={...h,src:h,h:h.h*ARBOSS.mirrorK,anim:{...a,charge:a.run,cast:a.idle,taunt:a.idle,die:a.die||a.idle}}}return arbMirror}
  const L=ARBOSS.look[e.arShell];return L&&(typeof m3dReady!=='function'||m3dReady(L.model))?L:old.apply(this,arguments)}}
// overlay (canvas, over the 3D scene): sharp shapes, nothing that changes damage
const arbR=(s,i)=>{const x=Math.sin(s*12.9898+i*78.233)*43758.5453;return x-Math.floor(x)};
function arbDraw(b){
  const t=S.t,sh=ARN.shade;ctx.lineJoin='miter';
  const stroke=(w,col,a)=>{ctx.globalAlpha=a*0.6;ctx.strokeStyle=sh;ctx.lineWidth=w+2;ctx.stroke();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()};
  if(b.arShell==='choir'){   // swarm: small teardrop flames on orbits that breathe outward (scatter) and back (regather)
    const n=arnLite()?5:ARBOSS.choirN,[r0,r1]=ARBOSS.choirR,br=(1-Math.cos(t*6.2832/ARBOSS.choirT))/2;
    for(let i=0;i<n;i++){const an=i*6.2832/n+t*(0.9+0.25*(i%3)),r=r0+(r1-r0)*br*(0.6+0.4*arbR(5,i)),x=b.x+Math.cos(an)*r,y=b.y-30+Math.sin(an)*r*0.6+Math.sin(t*3+i)*6,tx=-Math.sin(an),ty=Math.cos(an)*0.6;
      const L=Math.hypot(tx,ty)||1,ux=tx/L,uy=ty/L,tl=62;
      const g=ctx.createLinearGradient(x-ux*tl,y-uy*tl,x,y);g.addColorStop(0,'rgba(160,220,255,0)');g.addColorStop(1,'rgba(230,248,255,1)');
      ctx.beginPath();ctx.moveTo(x-ux*tl,y-uy*tl);ctx.lineTo(x-uy*10,y+ux*10);ctx.lineTo(x+ux*20,y+uy*20);ctx.lineTo(x+uy*10,y-ux*10);ctx.closePath();ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fill();
      ctx.beginPath();ctx.moveTo(x+ux*20,y+uy*20);ctx.lineTo(x-uy*10,y+ux*10);ctx.lineTo(x-ux*6,y-uy*6);ctx.lineTo(x+uy*10,y-ux*10);ctx.closePath();ctx.fillStyle='#FFFFFF';ctx.globalAlpha=1;ctx.fill();stroke(2.4,'#8FD8F5',1)}}
  else if(b.arShell==='colossus'){   // armor plates: angular stone shards with a gold edge; one falls away (burst) each time hp crosses a step
    const N=ARBOSS.plates,left=Math.max(0,Math.min(N,Math.ceil(N*b.hp/b.max)));
    if(left<b.arPl){const k=b.arPl-left;b.arPl=left;ARBOSS.stat.breaks+=k;b.arBreak={t:0,n:k}}
    if(b.arBreak){b.arBreak.t+=1/60;const q=b.arBreak.t/0.45;if(q>=1)b.arBreak=null;else{ctx.beginPath();for(let i=0;i<10;i++){const an=i*0.628+0.3,L=(i%2?30:64)*(0.4+0.6*q);ctx.moveTo(b.x+Math.cos(an+1.57)*5,b.y-40+Math.sin(an+1.57)*5);ctx.lineTo(b.x+Math.cos(an)*L,b.y-40+Math.sin(an)*L*0.8);ctx.lineTo(b.x+Math.cos(an-1.57)*5,b.y-40+Math.sin(an-1.57)*5);ctx.closePath()}ctx.globalAlpha=1-q;ctx.fillStyle='#E7C873';ctx.fill()}}
    for(let i=0;i<b.arPl;i++){const an=i*6.2832/N+0.4,x=b.x+Math.cos(an)*ARBOSS.plateR*1.2,y=b.y-46+Math.sin(an)*ARBOSS.plateR*0.7-Math.sin(t*1.5+i)*2,s=20;
      ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.8,y-s*0.2);ctx.lineTo(x+s*0.5,y+s*0.9);ctx.lineTo(x-s*0.5,y+s*0.9);ctx.lineTo(x-s*0.8,y-s*0.2);ctx.closePath();ctx.globalAlpha=0.95;ctx.fillStyle='#4A4640';ctx.fill();stroke(2,'#E7C873',1)}}
  else if(b.arShell==='mirror'){   // ring of tall mirror shards, slowly turning, with a travelling glint
    const n=ARBOSS.mirrorN;
    for(let i=0;i<n;i++){const an=i*6.2832/n+t*0.35,x=b.x+Math.cos(an)*ARBOSS.mirrorR,y=b.y+Math.sin(an)*ARBOSS.mirrorR*0.6,hh=46+10*Math.sin(t*2+i),w=9;
      ctx.beginPath();ctx.moveTo(x,y-hh);ctx.lineTo(x+w,y-hh*0.2);ctx.lineTo(x+w*0.5,y);ctx.lineTo(x-w*0.5,y);ctx.lineTo(x-w,y-hh*0.2);ctx.closePath();
      const g=ctx.createLinearGradient(x-w,y-hh,x+w,y);g.addColorStop(0,'rgba(240,235,255,0.95)');g.addColorStop(1,'rgba(160,140,220,0.45)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fill();stroke(1.3,'#E6DBFF',0.9);
      const gl=(t*0.8+i*0.37)%1;if(gl<0.25){ctx.beginPath();ctx.moveTo(x-w,y-hh*0.2-gl*60);ctx.lineTo(x+w,y-hh*0.2-gl*60-6);ctx.globalAlpha=1-gl*4;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=2;ctx.stroke()}}}
}
// the stone giant loads lazily: ask for it as soon as the flag and shell are on (not only when the boss spawns), and once the shell look is ready rebuild the boss actor once,
// so a body that was built before the model arrived does not stay the old boss (visual only)
function arbRebuild(b){
  if(b.arBuilt||typeof R3D==='undefined'||!R3D.on)return;
  const L=lookOf(b);if(!L||L===LOOK3D.boss)return;
  b.arBuilt=1;const a=R3D.actors.get(b);if(a&&a.look!==L&&typeof freeActor==='function'){freeActor(a);R3D.actors.delete(b)}}
{const old=drawSkills;drawSkills=function(){const r=old.apply(this,arguments);
  if(ARN.on&&ARBOSS.shell==='colossus'&&S&&!S.mb&&typeof m3dNeed==='function')m3dNeed('mon_stoneGiant');
  const b=S&&S.boss;if(!b||!b.arShell||b.dead||!arbOn())return r;arbRebuild(b);
  ctx.save();ctx.lineCap='round';ARBOSS.stat.drawn++;arbDraw(b);ctx.restore();ctx.globalAlpha=1;return r}}
