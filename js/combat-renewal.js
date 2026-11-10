/* Reference-language redraws of actual adopted combat records.
   Render-only: no new cast, hit, radius, timer, target or rig mutation.
   Opt out ?combatnew=0. Gradual per-action coverage, never an all-effects claim. */
const COMBATNEW={on:!/[?&]combatnew=0(?:&|$)/.test(location.search),implemented:['arena.quake','arena.splash'],drawn:{}};
const cnClamp=x=>Math.max(0,Math.min(1,x));
function cnRibbon(x,y,r,a0,a1,w,col,alpha,flat=.72,C=ctx){
 if(!(w>0)||!(alpha>0)||!(r>0))return;
 C.save();C.translate(x,y);C.scale(1,flat);C.lineJoin='round';
 const blade=(width,offset)=>{C.beginPath();for(let j=0;j<=16;j++){const p=j/16,a=a0+(a1-a0)*p,th=width*Math.sin(p*Math.PI*.85),rr=r+offset+th;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;j?C.lineTo(px,py):C.moveTo(px,py)}for(let j=16;j>=0;j--){const p=j/16,a=a0+(a1-a0)*p,rr=r+offset-width*.15*Math.sin(p*Math.PI);C.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}C.closePath()};
 C.globalAlpha=alpha*.85;blade(w+3,0);C.fillStyle='#111824';C.fill();
 C.globalAlpha=alpha;blade(w,0);C.fillStyle=col;C.fill();
 C.globalAlpha=alpha*.95;blade(w*.22,w*.34);C.fillStyle='#fff6e8';C.fill();
 C.restore();
}
function cnFlash(x,y,r,col,a,angle=0,C=ctx){
 if(!(a>0))return;
 C.save();C.translate(x,y);C.rotate(angle);C.globalAlpha=a;
 for(const [s,c] of [[1.16,'#10131d'],[1,col],[.45,'#fff9e8']]){
  C.beginPath();C.moveTo(-r*s,-r*.12*s);C.lineTo(-r*.28*s,-r*.22*s);C.lineTo(0,-r*.62*s);C.lineTo(r*.14*s,-r*.16*s);C.lineTo(r*s,r*.03*s);C.lineTo(r*.18*s,r*.22*s);C.lineTo(-r*.03*s,r*.62*s);C.lineTo(-r*.2*s,r*.12*s);C.closePath();C.fillStyle=c;C.fill();
 }C.restore();
}
// Ground effects must sit under characters, not paint cracks across their faces.
// Each short event owns its texture/material; no shared model material disposal.
COMBATNEW.ground=new Map();
function cnGroundDrop(e){const g=COMBATNEW.ground.get(e);if(!g)return;g.mesh.removeFromParent();g.mesh.geometry.dispose();g.mesh.material.dispose();g.tex.dispose();COMBATNEW.ground.delete(e)}
function cnGround(e,draw){
 if(!(R3D.on&&R3D.ready)){draw(ctx);return}
 let g=COMBATNEW.ground.get(e);
 if(!g){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d'),tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const span=e.R*2.4,mesh=new THREE.Mesh(new THREE.PlaneGeometry(span,span/SIN()).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,depthTest:true,toneMapped:false,side:THREE.DoubleSide}));
  mesh.position.set(e.x,.9,e.y/SIN());mesh.renderOrder=3;mesh.frustumCulled=false;R3D.scene.add(mesh);g={c,tex,mesh,span,run:S};COMBATNEW.ground.set(e,g);
 }
 const c=g.c;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,512,512);c.setTransform(512/g.span,0,0,512/g.span,256-e.x*512/g.span,256-e.y*512/g.span);draw(c);g.tex.needsUpdate=true;
}
// Depth-tested upright effect cards. Owned only by the adopted event, never actor rigs.
COMBATNEW.upright=new Map();
function cnUprightDrop(e){const g=COMBATNEW.upright.get(e);if(!g)return;for(const m of g.meshes){m.removeFromParent();m.material.dispose()}g.geo.dispose();g.tex.dispose();COMBATNEW.upright.delete(e)}
function cnUpright(e,kind,t){
 if(!(R3D.on&&R3D.ready))return false;
 let g=COMBATNEW.upright.get(e);
 if(!g){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  if(kind==='water'){
   // A curled split-tipped jet with a solid blue silhouette and narrow foam edge.
   c.beginPath();c.moveTo(62,248);c.bezierCurveTo(104,204,79,150,102,111);c.bezierCurveTo(123,76,143,70,131,22);c.bezierCurveTo(170,43,163,87,147,106);c.bezierCurveTo(186,87,184,69,178,56);c.bezierCurveTo(222,89,185,128,165,143);c.bezierCurveTo(138,167,180,205,200,248);c.closePath();c.fillStyle='#112a47';c.fill();c.lineJoin='round';c.strokeStyle='#101b2b';c.lineWidth=8;c.stroke();
   c.beginPath();c.moveTo(80,246);c.bezierCurveTo(126,198,102,161,116,126);c.bezierCurveTo(137,96,157,66,144,42);c.bezierCurveTo(172,85,139,115,139,140);c.bezierCurveTo(140,187,166,220,183,246);c.closePath();c.fillStyle='#248bcd';c.fill();
   c.beginPath();c.moveTo(113,237);c.bezierCurveTo(142,196,116,157,140,119);c.strokeStyle='#8ae8ff';c.lineWidth=15;c.stroke();c.beginPath();c.moveTo(117,230);c.bezierCurveTo(147,184,130,154,151,120);c.strokeStyle='#e5fbff';c.lineWidth=5;c.stroke();
   for(const [x,y,r] of [[82,113,7],[193,154,5],[104,60,5],[175,26,4]]){c.beginPath();c.ellipse(x,y,r*.65,r*1.5,-.3,0,7);c.fillStyle='#c7f5ff';c.fill()}
  }else{
   c.beginPath();c.moveTo(36,247);c.lineTo(65,165);c.lineTo(99,139);c.lineTo(118,24);c.lineTo(153,86);c.lineTo(162,153);c.lineTo(202,180);c.lineTo(223,247);c.closePath();c.fillStyle='#241c20';c.fill();c.strokeStyle='#15111a';c.lineJoin='bevel';c.lineWidth=8;c.stroke();
   c.beginPath();c.moveTo(118,24);c.lineTo(153,86);c.lineTo(162,153);c.lineTo(202,180);c.lineTo(184,240);c.lineTo(126,202);c.lineTo(109,128);c.closePath();c.fillStyle='#8d6245';c.fill();
   c.beginPath();c.moveTo(118,28);c.lineTo(129,98);c.lineTo(111,144);c.lineTo(128,203);c.lineTo(91,241);c.lineTo(67,165);c.lineTo(99,139);c.closePath();c.fillStyle='#bb8d57';c.fill();
   c.beginPath();c.moveTo(120,50);c.lineTo(136,110);c.lineTo(126,147);c.moveTo(164,174);c.lineTo(189,189);c.lineTo(182,215);c.strokeStyle='#f7c477';c.lineWidth=5;c.stroke();
   c.beginPath();c.moveTo(39,239);c.lineTo(70,204);c.lineTo(88,229);c.lineTo(73,249);c.closePath();c.fillStyle='#68482e';c.fill();
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const geo=new THREE.PlaneGeometry(1,1).translate(0,.5,0),meshes=[];
  const n=kind==='water'?(arshLess()?4:7):(arshLess()?6:12);
  for(let j=0;j<n;j++){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthTest:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));m.frustumCulled=false;m.renderOrder=4;R3D.scene.add(m);meshes.push(m)}
  g={meshes,geo,tex,run:S};COMBATNEW.upright.set(e,g);
 }
 for(let j=0;j<g.meshes.length;j++){
  const m=g.meshes[j],a=j*2.399+e.seed*.3,band=kind==='earth'?(j<6?.42:.82):(.26+.53*arshR(e.seed,j+6)),d=e.R*band,delay=band*(kind==='earth'?.13:.16),age=t-delay;
  const rise=cnClamp(age/.085),fall=cnClamp((age-(kind==='earth'?.17:.19))/.28),height=(kind==='earth'?54:84)*( .7+.5*arshR(e.seed,j+12))*rise*(1-fall*fall),width=(kind==='earth'?42:65)*( .8+.4*arshR(e.seed,j+18));
  m.visible=age>=0&&height>.2&&fall<1;if(!m.visible)continue;
  m.position.set(e.x+Math.cos(a)*d,1,(e.y+Math.sin(a)*d*.8)/SIN());m.quaternion.copy(R3D.cam.quaternion);m.scale.set(width,height,1);m.material.opacity=1-fall;
 }
 return true;
}
if(COMBATNEW.on){
 const oldQuake=ARSHD.quake,oldSplash=ARSHD.splash;
 ARSHD.quake=function(e,T){
  if(!kineticHere())return oldQuake(e,T);
  const t=T-e.t0,dur=.62;if(t>=dur){cnGroundDrop(e);cnUprightDrop(e);return false;}COMBATNEW.drawn.quake=(COMBATNEW.drawn.quake||0)+1;
  const p=cnClamp(t/.19),ease=1-(1-p)**3,fade=1-cnClamp((t-.17)/.45),R=e.R;
  const upright=cnUpright(e,'earth',t);
  if(!upright)return oldQuake(e,T);
  cnGround(e,c=>{
  // Irregular torn fissures with angular plate edges, never a circular rim.
  for(let j=0;j<6;j++){
   const a=j*Math.PI*2/6+arshR(e.seed,j)*.35,L=R*(.7+.24*arshR(e.seed,j+9))*ease;
   const pts=[];for(let n=0;n<=5;n++){const d=10+L*n/5,b=a+(arshR(e.seed,j*13+n)-.5)*.3;pts.push([e.x+Math.cos(b)*d,e.y+Math.sin(b)*d])}
   for(const [width,color,al] of [[5,'#16101b',fade*.6],[1.4,'#bd6431',fade*.5]]){
    c.beginPath();for(let n=0;n<pts.length;n++){const [x,y]=pts[n];n?c.lineTo(x,y):c.moveTo(x,y)}c.lineJoin='bevel';c.lineCap='butt';c.lineWidth=width;c.strokeStyle=color;c.globalAlpha=al;c.stroke();
   }
   for(let n=2;n<=4;n++){const [x,y]=pts[n],side=n%2?1:-1,w=(10-n)*fade;c.save();c.translate(x,y);c.rotate(a+side*.75);c.globalAlpha=fade;c.fillStyle='#211b23';c.beginPath();c.moveTo(-w,-3);c.lineTo(w*.4,-w*.72);c.lineTo(w,0);c.lineTo(w*.3,w*.42);c.closePath();c.fill();c.strokeStyle='#bd804d';c.lineWidth=1.2;c.stroke();c.restore()}
  }
  // Short local impact, not a white fullscreen disc. Clears before the ground scar.
  if(t<.1)cnFlash(e.x,e.y-8,29*(1-t/.1),'#ffc075',1-t/.1,-.2,c);
  c.globalAlpha=1;});return true;
 };
 ARSHD.splash=function(e,T){
  if(!kineticHere())return oldSplash(e,T);
  const t=T-e.t0,dur=.72;if(t>=dur){cnUprightDrop(e);return false}COMBATNEW.drawn.splash=(COMBATNEW.drawn.splash||0)+1;
  if(!cnUpright(e,'water',t))return oldSplash(e,T);
  // Sparse falling droplets accompany the jets; no continuous enclosing ring.
  if(!arshLess())for(let j=0;j<9;j++){
   const a=j*Math.PI*2/9+.2,pp=cnClamp((t-.1-j*.005)/.5),r=e.R*(.28+.55*pp),h=Math.sin(pp*Math.PI)*30;
   const x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r*.68-h;
   ctx.globalAlpha=(1-pp)*.8;ctx.fillStyle='#a9edff';ctx.beginPath();ctx.ellipse(x,y,1.5,3.2,a,0,7);ctx.fill();
  }
  ctx.globalAlpha=1;return true;
 };
}

// Drop ground resources when the owning run or effect was reset early.
(function(){const base=drawSkills;drawSkills=function(){for(const [e,g] of COMBATNEW.ground)if(g.run!==S||!ARSH.list.includes(e))cnGroundDrop(e);for(const [e,g] of COMBATNEW.upright)if(g.run!==S||!ARSH.list.includes(e))cnUprightDrop(e);return base.apply(this,arguments)}})();
// Match local contact to the actual source action, not a timed decorative replay.
COMBATNEW.contacts=[];
(function(){
 const cast=skillUse;skillUse=function(id){const prior=COMBATNEW.active;COMBATNEW.active=kineticHere()&&['quake','splash'].includes(id)?id:null;try{return cast.apply(this,arguments)}finally{COMBATNEW.active=prior}};
 const contact=skAnimHit;skAnimHit=function(e,d,t){
  const id=COMBATNEW.active;if(!COMBATNEW.on||!id||!kineticHere())return contact.apply(this,arguments);
  skaFrame();SKANIMS.stat.hits++;if(SKANIMS.hn++<SKANIM.hit.perFrame&&!fxLess()){
   const h=lookOf(e).h*(e.big||1),a=Math.atan2(e.y-P.y,e.x-P.x);
   COMBATNEW.contacts.push({run:S,id,x:e.x-Math.cos(a)*e.r*.5,y:e.y-h*.4,t:S.t,a});if(COMBATNEW.contacts.length>12)COMBATNEW.contacts.shift();
  }
  if(t==='water'&&DMG.types.water.wet)skaStatus(e,'wet',DMG.types.water.wet.t);
  return true;
 };
 const generic=kineticContact;kineticContact=function(){if(COMBATNEW.on&&COMBATNEW.active)return;return generic.apply(this,arguments)};
 const draw=drawSkills;drawSkills=function(){const r=draw.apply(this,arguments);
  if(!kineticHere()){COMBATNEW.contacts=[];return r}
  COMBATNEW.contacts=COMBATNEW.contacts.filter(h=>h.run===S&&S.t>=h.t&&S.t-h.t<.16);
  for(const h of COMBATNEW.contacts){const t=S.t-h.t,k=1-t/.16,col=h.id==='splash'?'#75daff':'#ffc280';
   cnFlash(h.x,h.y,24*k,col,k*k,h.a);
   if(h.id==='splash')for(const side of [-1,1]){const a=h.a+side*.8,x=h.x+Math.cos(a)*(8+30*(1-k)),y=h.y+Math.sin(a)*(8+30*(1-k));ctx.save();ctx.globalAlpha=k;ctx.fillStyle='#c5f5ff';ctx.beginPath();ctx.ellipse(x,y,2*k,5*k,a,0,7);ctx.fill();ctx.restore()}
  }return r;
 };
})();
