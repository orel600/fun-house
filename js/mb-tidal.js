/* NOVA component 20 loader (MBTIDAL, overhaul/tidal-proof, BOB for MAX, 11.11.2026). OPT-IN ONLY: ?tidal=1. Without the flag nothing loads and nothing is wrapped.
   With the flag: injects js/tidal-proof.js (NOVA's private art proof: real 3D shrubs, circular hold minimap, scene, roster). The proof injects its own css/tidal-ui.css.
   Both files are PRIVATE and UNTRACKED (.git/info/exclude). They are never committed. If they are absent, the state becomes 'missing' and the game runs as before.
   The browser itself still logs the failed resource load; there is no fetch from file://, so existence can't be probed silently.
   Ownership: tidal-proof.js is NOVA's. This file is only the loader and opt-in lifecycle plumbing around it (?tidalfix=0 turns the plumbing off, for A/B checks):
     - the held circle is reset on match start/exit and when the page is hidden (a hold can't survive into another scene or round);
     - while the circle is held with a free camera, a moving joystick does not snap the camera back (same as the stock map drag, MBCAM.pid);
     - while the circle is held, the fight fade (mb-hud.js) does not fade it (same exemption the stock map drag has).
   No gameplay, vision, cover, targeting, price or topology change. Delete: this file and its script line. */
const MBTIDAL={
  on:/[?&]tidal=1(&|$)/.test(location.search),
  fix:!/[?&]tidalfix=0(&|$)/.test(location.search),
  src:'js/tidal-proof.js',
  state:'off',   // off | loading | loaded | ready | missing | error
  stat:{resets:0,camHeld:0,fadeHeld:0},
  t0:0,readyMs:null
};
(function(){
  const T=MBTIDAL;if(!T.on)return;
  T.state='loading';T.t0=performance.now();
  const s=document.createElement('script');s.src=T.src;
  s.onload=()=>{T.state='loaded';const w=setInterval(()=>{const P=window.TIDAL_PROOF;if(!P)return;
    if(P.ready){T.state='ready';T.readyMs=Math.round(performance.now()-T.t0);clearInterval(w)}else if(P.errors&&P.errors.length){T.state='error';T.err=P.errors[0];clearInterval(w)}},100)};
  s.onerror=()=>{T.state='missing'};
  document.body?document.body.appendChild(s):document.head.appendChild(s);
  if(!T.fix)return;
  const hold=()=>window.TIDAL_PROOF&&window.TIDAL_PROOF.mapHold;
  const held=()=>{const h=hold();return !!(h&&h.pid!==null)};
  T.reset=function(){const h=hold();if(!h)return;if(h.pid!==null){h.pid=null;T.stat.resets++}
    if(typeof MBCAM!=='undefined')MBCAM.pid=null;if(typeof MB_MINI_L!=='undefined')MB_MINI_L=null};
  if(typeof mobaStart==='function'){const o=mobaStart;mobaStart=function(){T.reset();return o.apply(this,arguments)}}
  if(typeof mobaExit==='function'){const o=mobaExit;mobaExit=function(){T.reset();return o.apply(this,arguments)}}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)T.reset()});
  if(typeof giantCam==='function'){const o=giantCam;giantCam=function(){
    if(held()&&typeof MBCAM!=='undefined'&&MBCAM.free&&typeof S!=='undefined'&&S&&S.mb&&MBCAM.mb===MB){T.stat.camHeld++;return {x:MBCAM.x-P.x,y:MBCAM.y-P.y}}
    return o.apply(this,arguments)}}
  if(typeof mbMiniBox==='function'){const o=mbMiniBox;mbMiniBox=function(){const l=o.apply(this,arguments);if(held()&&l.a<1){l.a=1;T.stat.fadeHeld++}return l}}
})();
/* ?tidalcull=1 (OFF by default; evidence for NOVA's phone-cost decision, MAX 11.11): per-instance frustum culling of the proof's shrub InstancedMesh.
   The mesh, materials, colours and every instance matrix stay NOVA's. Each render pass, the instances whose bounding sphere is outside that pass's camera frustum
   are left out by packing the visible ones first and lowering mesh.count. Footprint, cover and vision are untouched (they never read the mesh). */
MBTIDAL.cull={on:MBTIDAL.on&&/[?&]tidalcull=1(&|$)/.test(location.search),meshes:0,last:{drawn:0,total:0}};
(function(){
  const K=MBTIDAL.cull;if(!K.on)return;
  const hook=m=>{if(m.userData.bobCull||typeof THREE==='undefined')return;const n=m.count,base=m.instanceMatrix.array.slice(),col=m.instanceColor?m.instanceColor.array.slice():null;
    if(!m.geometry.boundingSphere)m.geometry.computeBoundingSphere();const gs=m.geometry.boundingSphere,mt=new THREE.Matrix4(),sph=[];
    for(let i=0;i<n;i++){mt.fromArray(base,i*16);sph.push(gs.clone().applyMatrix4(mt))}
    const fr=new THREE.Frustum(),pv=new THREE.Matrix4();m.frustumCulled=false;m.userData.bobCull={n};K.meshes++;
    m.onBeforeRender=function(r,s,cam){pv.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);fr.setFromProjectionMatrix(pv);
      const A=m.instanceMatrix.array,C=m.instanceColor&&m.instanceColor.array;let k=0;
      for(let i=0;i<n;i++){if(!fr.intersectsSphere(sph[i]))continue;if(k!==i){A.set(base.subarray(i*16,i*16+16),k*16);if(C&&col)C.set(col.subarray(i*3,i*3+3),k*3)}else if(m.userData.bobCull.packed){A.set(base.subarray(i*16,i*16+16),k*16);if(C&&col)C.set(col.subarray(i*3,i*3+3),k*3)}k++}
      m.userData.bobCull.packed=k<n;m.count=k;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;K.last={drawn:k,total:n}}};
  setInterval(()=>{if(typeof M3==='undefined'||!M3.floor)return;for(const c of M3.floor.children)if(c.isInstancedMesh&&c.userData.tidal==='original-tripo-broadleaf-shrub')hook(c)},300);
})();
