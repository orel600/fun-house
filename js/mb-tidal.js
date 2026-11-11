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
    if(P.ready){T.state='ready';T.readyMs=Math.round(performance.now()-T.t0);clearInterval(w);T.redraw()}else if(P.errors&&P.errors.length){T.state='error';T.err=P.errors[0];clearInterval(w)}},100)};
  /* A window opened while the ~45MB proof was still loading keeps the stock icons: the proof swaps icons by wrapping mbPic/mbSvg, and that only affects later draws
     (ARI, 11.11: select-early-tidal-844). When the proof becomes ready, any open Underworld window is drawn again through its own open/draw function,
     keeping its state (where Close returns to, build kit/tab, end result, scroll). */
  T.stat.redraw=0;
  if(typeof mbEndShow==='function'){const o=mbEndShow;mbEndShow=function(won){T.lastWon=won;return o.apply(this,arguments)}}
  T.redraw=function(){
    const vis=id=>{const e=document.getElementById(id);return !!(e&&!e.hidden&&!e.closest('[hidden]'))};
    try{if(vis('ovMoba')){const w=document.getElementById('mbWin'),m=w.dataset.mode,from=w.dataset.from,top=w.scrollTop;
      if(m==='pick'&&typeof mobaOpen==='function'){mobaOpen();w.dataset.from=from}
      else if(m==='build'&&typeof mbBuildOpen==='function'&&w.dataset.bkit)mbBuildOpen(w.dataset.bkit,w.dataset.tab);
      else if(m==='end'&&typeof mbEndShow==='function'&&T.lastWon!==undefined)mbEndShow(T.lastWon);
      else return;
      w.scrollTop=top;T.stat.redraw++}}catch(e){T.redrawErr=String(e)}
    try{if(vis('ovMbShop')&&typeof mbShopDraw==='function'){const s=document.getElementById('mbShop'),top=s.scrollTop;mbShopDraw();s.scrollTop=top;T.stat.redraw++}}catch(e){T.redrawErr=String(e)}
    try{T.redrawHud()}catch(e){T.redrawErr=String(e)}};
  /* The skill buttons of a match started before the proof was ready: only the ICON inside each button is swapped (everything before its <i>),
     built by the game's own builders. The buttons, their listeners, cooldown and aim state stay as they are (no mbUi rebuild mid-match). */
  T.redrawHud=function(){
    const sk=document.getElementById('mbSk');if(!sk||sk.hidden||typeof MB==='undefined'||!MB||typeof mbMe!=='function')return;const u=mbMe();if(!u)return;
    const tmp=document.createElement('div');
    tmp.innerHTML=MB_SLOTS.map(k=>'<button data-sk="'+k+'">'+mbPic(MBKIT[u.kit][k].id)+'<i></i></button>').join('')+(typeof mbSpellBtns==='function'?mbSpellBtns(u):'')+(typeof mbAtkBtn==='function'?mbAtkBtn():'');
    const icon=b=>{const out=[];for(const n of b.childNodes){if(n.nodeName==='I')break;out.push(n)}return out};
    for(const f of tmp.querySelectorAll('button')){const k=f.dataset.sk,b=k?sk.querySelector(':scope>[data-sk="'+k+'"]'):f.id?document.getElementById(f.id):null;if(!b)continue;
      const old=icon(b),neu=icon(f);if(!neu.length)continue;const at=old.length?old[0]:b.firstChild;for(const n of neu)b.insertBefore(n,at);for(const n of old)n.remove();T.stat.redraw++}
    if(typeof mbSvg==='function')for(const b of document.querySelectorAll('#mbPing [data-o] b'))b.innerHTML=mbSvg(b.parentNode.dataset.o,'mbpi')};
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
  // The shrub mesh is found by structure, not by NOVA's tag name (component 21 renamed it): a NOVA-tagged InstancedMesh with one instance per source bush circle.
  const bushes=()=>typeof mbDecor==='function'?mbDecor().filter(d=>d.k==='bush').length:-1;
  setInterval(()=>{if(typeof M3==='undefined'||!M3.floor)return;const nb=bushes();for(const c of M3.floor.children)if(c.isInstancedMesh&&typeof c.userData.tidal==='string'&&(c.userData.bobCull||c.count===nb))hook(c)},300);
})();
