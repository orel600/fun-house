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
    if(typeof mbSvg!=='function')return;
    for(const b of document.querySelectorAll('#mbPing [data-o] b'))b.innerHTML=mbSvg(b.parentNode.dataset.o,'mbpi');
    // my class portrait in the HP panel (moba.js draws it only when the kit changes)
    const por=document.getElementById('mbPor');if(por){por.innerHTML=mbSvg('k_'+u.kit);por.dataset.kit=u.kit;T.stat.redraw++}
    // Kill/gamble feed rows are deliberately NOT redrawn (MAX, 11.11). The proof's feed portraits have no size rule yet (tidal-ui.css sizes .tidal-portrait at 100%
    // of a container, and the feed has none), so they render at 60-256px. Early rows keep their correctly sized stock icons and expire within MOBA.feed.t seconds.
  };
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
    const fr=new THREE.Frustum(),pv=new THREE.Matrix4();m.frustumCulled=false;m.userData.bobCull={n};m.userData.bobCullBase=base;K.meshes++;
    m.onBeforeRender=function(r,s,cam){pv.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);fr.setFromProjectionMatrix(pv);
      const A=m.instanceMatrix.array,C=m.instanceColor&&m.instanceColor.array;let k=0;
      for(let i=0;i<n;i++){if(!fr.intersectsSphere(sph[i]))continue;if(k!==i){A.set(base.subarray(i*16,i*16+16),k*16);if(C&&col)C.set(col.subarray(i*3,i*3+3),k*3)}else if(m.userData.bobCull.packed){A.set(base.subarray(i*16,i*16+16),k*16);if(C&&col)C.set(col.subarray(i*3,i*3+3),k*3)}k++}
      m.userData.bobCull.packed=k<n;m.count=k;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;K.last={drawn:k,total:n}}};
  setInterval(()=>{for(const c of MBTIDAL.cover())hook(c)},300);
})();
/* The proof's cover (shrub) meshes, and a one-call footprint check (?tidal=1 only).
   cover(): NOVA's stable key userData.tidalRole==='cover' when present (component 23); otherwise the structural match
   (a NOVA-tagged InstancedMesh in the floor group with one instance per source bush circle), because component 21 renamed the tag.
   footprint(): per bush circle, the mesh's half-extent along x and along y (game units, y = world z * sin(tilt)) divided by the logic radius r.
   1.0 means the shrub base matches the hiding circle. Component 20/21 measured x about 0.98 and y about 0.78 (the z scale was r, not r/sn). */
(function(){
  const T=MBTIDAL;if(!T.on)return;window.MBTIDAL=T;
  const nBush=()=>typeof mbDecor==='function'?mbDecor().filter(d=>d.k==='bush').length:-1;
  T.cover=function(){if(typeof M3==='undefined'||!M3.floor)return [];const kids=M3.floor.children.filter(c=>c.isInstancedMesh);
    const role=kids.filter(c=>c.userData.tidalRole==='cover');if(role.length)return role;
    const nb=nBush();return kids.filter(c=>typeof c.userData.tidal==='string'&&(c.userData.bobCull||c.count===nb))};
  T.footprint=function(){
    const ms=T.cover();if(!ms.length||typeof THREE==='undefined')return {ok:false,why:'no cover mesh (proof not ready, or not in a match)'};
    const sn=SIN(),L=typeof mbBushes==='function'?mbBushes().list:[],m=new THREE.Matrix4(),v=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),per=[];
    for(const o of ms){const pos=o.geometry.attributes.position,n=o.userData.bobCull?o.userData.bobCull.n:o.count,base=o.userData.bobCullBase;
      for(let i=0;i<n;i++){if(base)m.fromArray(base,i*16);else o.getMatrixAt(i,m);m.decompose(c,q,s);let x=0,y=0;
        for(let k=0;k<pos.count;k+=2){v.fromBufferAttribute(pos,k).applyMatrix4(m);x=Math.max(x,Math.abs(v.x-c.x));y=Math.max(y,Math.abs(v.z-c.z)*sn)}
        const gx=c.x,gy=c.z*sn;let best=null,bd=1e9;for(const b of L){const d=Math.hypot(b.x-gx,b.y-gy);if(d<bd){bd=d;best=b}}
        const e=per[i]||(per[i]={r:best?best.r:NaN,off:bd,x:0,y:0});e.x=Math.max(e.x,x);e.y=Math.max(e.y,y)}}
    const f=a=>({min:+Math.min(...a).toFixed(3),max:+Math.max(...a).toFixed(3),mean:+(a.reduce((p,q)=>p+q,0)/a.length).toFixed(3)});
    return {ok:true,via:ms[0].userData.tidalRole==='cover'?'tidalRole':'structure',meshes:ms.length,circles:L.length,instances:per.length,
      xOverR:f(per.map(e=>e.x/e.r)),yOverR:f(per.map(e=>e.y/e.r)),centerOffMax:+Math.max(...per.map(e=>e.off)).toFixed(2),sn:+sn.toFixed(3)}};
})();
