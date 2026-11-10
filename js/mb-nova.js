/* NOVA hooks: code-only integration points that can host NOVA's assets (MBNOVA, overhaul/nova-hooks, ARENA-B for MAX, 10.11.2026).
   NOVA owns ALL visuals (models, map, materials, textures, lighting, VFX, UI, animation). This file ships NO art, NO substitute models and NO private assets.
   OPT-IN ONLY: ?nova=1. Without the flag this file defines an inert object and loads nothing (the rig adapter js/mb-nova-rig.js is only injected when the flag is on).
   No gameplay, timing or targeting change. No render3d.js / Nir file edits: everything wraps or reads globals from here.

   1. PRIVATE ASSET LOADER (registry keyed by role)
      Roles: hero.<kit>  clip.<kit>.<name>  weapon.<id>  prop.<id>  terrace.<id>  glyph.<id>
      Assets live in an UNTRACKED folder `private-assets/` (listed in .git/info/exclude locally, never committed). There is NO fetch from file://: each asset is a
      <script>-wrapped registration file that calls  MBNOVA.put(role, {kind:'glb'|'png', b64:'<base64>'}, meta).
      A dev-only manifest `private-assets/manifest.js` calls  MBNOVA.manifest(['hero-tank.js', ...])  and the loader adds one <script> per file. Absence is tolerated
      (the 404 / onerror is counted in the report, nothing else happens).
      meta (all optional unless noted; format-neutral JSON):
        hero.<kit>:   {heightGame:number (visual height in game units, default = the stock look), groundOffset:number (model units the origin is above the feet),
                       forward:'+Z'|'+X'|'-X'|'-Z' (model forward axis, the actor path expects +Z), upper:[regex source,...] (bones of the upper-body split for @up clips),
                       slots:{weapon:{bone:'mixamorigRightHand'}}, weapon:'weapon.<id>' (role),
                       clips:{idle|run|attack|hit|die|ready:{role:'clip.<kit>.<name>', clip:<index or name inside that GLB>, fade:seconds, timeScale:n, root:'raw'|'lockXZ'|'drop',
                              seamBlend:seconds, segment:[t0,t1] seconds (sub-clip)}},
                       attack:{from:seconds,to:seconds,dur:seconds,settle:seconds,recover:{min,max}}   // which part of the attack clip plays at the atk event, see 3.
        clip.*:       GLB that carries only clip(s) + skeleton nodes (bound BY BONE NAME to the hero's skeleton).
        weapon.<id>:  {scale:number, anchors:{grip:{pos:[x,y,z],quat:[x,y,z,w]}, contactBase:'<node name>'|[x,y,z], contactTip:'<node name>'|[x,y,z]}}  authored, never guessed.
        glyph.<id>:   PNG, 128x128 expected ({size:128}); id is the native-UI input name.
        terrace.<id>/prop.<id>: GLB; see 5 (scene slots).
      Every GLB is validated for format-neutral targets (docs only, no Studio test): PNG-or-any textures, no EXT_meshopt_compression/EXT_texture_webp REQUIRED, UV0 in 0..1,
      <=4 influences, triangle count. The result is stored as meta.compat = {targeted:bool, triangles, maxInfluences, uv01, requiredExt:[...], reasons:[...]}.
      'targeted' means "meets the documented numbers", NOT "tested in Roblox".
   2/3. RIG ADAPTER + ATTACK CLIP BINDING: js/mb-nova-rig.js (tank slot first). Contract in its header.
   4. EVENT SEAM  MBNOVA.on(evt, fn) / off / emit:
        'launch'  {kind:'melee'|'projectile', src, tgt, t (MB.t), frame, shot (projectile object or null), anchors}   at the atk event (same tick as damage / projectile spawn)
        'impact'  {kind:'melee'|'projectile', src, tgt, crit, dt, t, frame, anchors}   melee: same tick as launch; projectile: the later REAL impact
        anchors = MBNOVA.contact(src) (world + projected weapon contact base/tip, target silhouette anchor), or null if the unit has no NOVA actor.
        Bone transforms are of the last rendered frame. Subscribers run in try/catch; they can never break the game or delay damage. We draw NO VFX.
   5. SCENE / MAP SLOT  MBNOVA.scene.add(id,{role|object, position, rotation, scale, instances:[{pos,rot,scale}], layer}) adds separable pieces to R3D.scene at runtime
      (instanced tiles, rim/edge, props); remove(id); list(). Floor/lighting DATA hooks: MBNOVA.floor(palette) (merged into MBFLOOR/MBLOOK.floor3d) and MBNOVA.light(data)
      (merged into MBSCENE.light). Neither edits render3d.js.
   6. UI GLYPHS  MBNOVA.glyph.get(id) -> {id,url,w,h,img}; MBNOVA.glyph.css() injects .nova-glyph-<id>{background-image}; native UI inputs only, browser CSS layout stays.
   7. DIAGNOSTICS  MBNOVA.report(): what loaded, decode ms, sizes, bindings, warnings, events, scene.
   Tests: tools/nova-fixture.js builds a tiny procedural stand-in (code only, for tests, never shipped as art). Delete: this file, js/mb-nova-rig.js, the script line. */
const MBNOVA={
  enabled:/[?&]nova=1(&|$)/.test(location.search),   // the flag (MBNOVA.on is the event subscribe function)
  reg:new Map(),            // role -> {role,kind,b64,meta,state:'put'|'decoding'|'ready'|'fail',obj,gltf,img,ms,bytes,warnings,compat}
  ev:{},evCount:{},
  stat:{put:0,manifest:0,scriptsOk:0,scriptsMissing:0,decoded:0,failed:0,events:0,sceneAdded:0},
  warnings:[],t0:performance.now(),
  folder:'private-assets/'
};
(function(){
  const N=MBNOVA;
  if(!N.enabled){N.put=N.manifest=N.contact=()=>null;N.report=()=>({on:false});N.emit=N.off=N.on=()=>{};return}
  const warn=m=>{N.warnings.push(m);console.warn('[nova]',m)};
  // ---- 1. registry and loader ----
  N.put=function(role,asset,meta){
    const e={role,kind:asset.kind||(role.startsWith('glyph.')?'png':'glb'),b64:asset.b64,meta:Object.assign({},meta||{}),state:'put',bytes:asset.b64?Math.floor(asset.b64.length*0.75):0,warnings:[],compat:null,at:performance.now()};
    N.reg.set(role,e);N.stat.put++;N.kick();return e};
  N.has=role=>N.reg.has(role);N.get=role=>N.reg.get(role);N.isReady=role=>{const e=N.reg.get(role);return !!e&&e.state==='ready'};
  N.byPrefix=p=>[...N.reg.values()].filter(e=>e.role.startsWith(p));
  N.manifest=function(files){N.stat.manifest++;for(const f of files)N.script(N.folder+f)};
  N.script=function(src){const s=document.createElement('script');s.src=src;s.onload=()=>{N.stat.scriptsOk++};s.onerror=()=>{N.stat.scriptsMissing++;N.missing=(N.missing||[]).concat(src)};document.head.appendChild(s)};
  // load: the manifest only (dev-only). A missing folder is not an error.
  N.load=function(){const s=document.createElement('script');s.src=N.folder+'manifest.js';s.onload=()=>{N.stat.scriptsOk++};s.onerror=()=>{N.stat.manifestMissing=true};document.head.appendChild(s)};
  // decode one at a time (warnings are collected per asset by hooking console.warn during the parse)
  let busy=false;
  N.kick=function(){if(busy||typeof THREE==='undefined'||typeof R3D==='undefined'||!R3D.ready)return;const e=[...N.reg.values()].find(x=>x.state==='put');if(!e)return;busy=true;e.state='decoding';
    const b64buf=()=>{const s=atob(e.b64),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer};
    const w0=console.warn,got=[];console.warn=(...a)=>{got.push(a.join(' '));w0.apply(console,a)};const t0=performance.now();
    const fin=(ok,err)=>{console.warn=w0;e.ms=+(performance.now()-t0).toFixed(1);e.warnings=got;if(ok){e.state='ready';N.stat.decoded++}else{e.state='fail';e.err=String(err&&err.message||err);N.stat.failed++;warn(e.role+': '+e.err)}busy=false;e.b64=null;if(N.onReady)N.onReady(e);N.kick()};
    try{
      if(e.kind==='png'){const im=new Image();im.onload=()=>{e.img=im;e.w=im.naturalWidth;e.h=im.naturalHeight;if(e.meta.size&&(e.w!==e.meta.size||e.h!==e.meta.size))e.warnings.push('glyph size '+e.w+'x'+e.h+' (expected '+e.meta.size+')');fin(true)};im.onerror=()=>fin(false,'png decode');im.src='data:image/png;base64,'+e.b64;e.url=im.src}
      else new THREE.GLTFLoader().setMeshoptDecoder(THREE.MeshoptDecoder).parse(b64buf(),'',g=>{e.gltf=g;e.obj=g.scene;e.clips=g.animations||[];N.inspect(e,g);fin(true)},er=>fin(false,er))
    }catch(er){fin(false,er)}};
  // sizes, skinning facts and the format-neutral compatibility targets (documented numbers only)
  N.inspect=function(e,g){
    let tris=0,geo=0,tex=0,bones=0,skinned=0,maxInf=0,uvMin=1e9,uvMax=-1e9,texs=[];const seen=new Set();
    g.scene.traverse(o=>{if(o.isBone)bones++;if(!o.isMesh)return;if(o.isSkinnedMesh)skinned++;const gm=o.geometry;for(const k in gm.attributes)geo+=gm.attributes[k].array.byteLength;if(gm.index)geo+=gm.index.array.byteLength;
      tris+=(gm.index?gm.index.count:gm.attributes.position.count)/3;
      const uv=gm.attributes.uv;if(uv)for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uvMin=Math.min(uvMin,u,v);uvMax=Math.max(uvMax,u,v)}
      const sw=gm.attributes.skinWeight;if(sw)for(let i=0;i<sw.count;i++){let n=0;for(let c=0;c<4;c++)if(sw.getComponent(i,c)>1e-4)n++;if(n>maxInf)maxInf=n}
      for(const m of [].concat(o.material))for(const t of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])if(m[t]&&!seen.has(m[t])){seen.add(m[t]);const im=m[t].image,w=im&&im.width||0,h=im&&im.height||0;texs.push(t+' '+w+'x'+h);tex+=w*h*4*1.33}});
    const json=g.parser&&g.parser.json||{},req=json.extensionsRequired||[],used=json.extensionsUsed||[];
    const reasons=[];if(req.includes('EXT_meshopt_compression'))reasons.push('requires meshopt');if(req.includes('EXT_texture_webp'))reasons.push('requires WebP');if(maxInf>4)reasons.push('>4 influences');
    if(uvMax>1.0001||uvMin<-0.0001)reasons.push('UV0 outside 0..1 ('+uvMin.toFixed(2)+'..'+uvMax.toFixed(2)+')');
    e.info={triangles:Math.round(tris),geometryMB:+(geo/1048576).toFixed(2),textureMBgpu:+(tex/1048576).toFixed(2),textures:texs,bones,skinned,maxInfluences:maxInf,clips:(g.animations||[]).map(a=>a.name+' '+a.duration.toFixed(3)+'s/'+a.tracks.length),extensionsUsed:used};
    e.compat={targeted:reasons.length===0,triangles:Math.round(tris),maxInfluences:maxInf,uv01:!(reasons.some(r=>r.startsWith('UV0'))),requiredExt:req,reasons,note:'documented specs only; not tested in Roblox Studio'};
    e.meta.compat=e.compat};
  // ---- 4. events ----
  N.on=function(evt,fn){(N.ev[evt]||(N.ev[evt]=[])).push(fn);return fn};
  N.off=function(evt,fn){const a=N.ev[evt];if(a){const i=a.indexOf(fn);if(i>=0)a.splice(i,1)}};
  N.emit=function(evt,p){N.evCount[evt]=(N.evCount[evt]||0)+1;N.stat.events++;const a=N.ev[evt];if(!a)return;for(const f of a.slice()){try{f(p)}catch(er){warn('event '+evt+': '+er.message)}}};
  N.hasSubs=evt=>!!(N.ev[evt]&&N.ev[evt].length);
  // ---- 5. scene / map slot (no render3d.js edit) ----
  const slots=new Map(),queue=[];
  N.scene={
    add(id,o){const run=()=>{N.scene.remove(id);let obj=o.object;
        if(!obj&&o.role){const e=N.reg.get(o.role);if(!e||e.state!=='ready'||!e.obj)return false;obj=THREE.SkeletonUtils.clone(e.obj)}
        if(!obj)return false;
        if(o.instances&&o.instances.length){let mesh=null;obj.traverse(x=>{if(!mesh&&x.isMesh)mesh=x});if(!mesh)return false;
          const im=new THREE.InstancedMesh(mesh.geometry,mesh.material,o.instances.length),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
          o.instances.forEach((it,i)=>{q.setFromEuler(e.set(...(it.rot||[0,0,0])));m.compose(new THREE.Vector3(...(it.pos||[0,0,0])),q,new THREE.Vector3(...(it.scale||[1,1,1])));im.setMatrixAt(i,m)});im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;obj=im}
        if(o.position)obj.position.set(...o.position);if(o.rotation)obj.rotation.set(...o.rotation);if(o.scale!=null)obj.scale.setScalar(o.scale);
        R3D.scene.add(obj);slots.set(id,{id,obj,layer:o.layer||'prop',instanced:!!(o.instances&&o.instances.length)});N.stat.sceneAdded++;return true};
      if(typeof R3D==='undefined'||!R3D.scene||!run())queue.push([id,o,run]);return true},
    remove(id){const s=slots.get(id);if(!s)return false;R3D.scene.remove(s.obj);s.obj.traverse(x=>{if(x.isInstancedMesh)x.dispose&&x.dispose()});slots.delete(id);return true},
    list:()=>[...slots.values()].map(s=>({id:s.id,layer:s.layer,instanced:s.instanced,visible:s.obj.visible})),
    flush(){for(let i=queue.length-1;i>=0;i--)if(queue[i][2]())queue.splice(i,1)}
  };
  N.floor=function(pal){if(typeof MBFLOOR==='undefined'||typeof MBLOOK==='undefined')return false;MBFLOOR.pals.nova=pal;MBFLOOR.on='nova';MBLOOK.floor3d=Object.assign({},MBFLOOR.base||MBLOOK.floor3d,pal);return true};
  N.light=function(data){if(typeof MBSCENE==='undefined')return false;Object.assign(MBSCENE.light,data);return true};
  // ---- 6. UI glyphs ----
  N.glyph={
    get(id){const e=N.reg.get('glyph.'+id);return e&&e.state==='ready'?{id,url:e.url,w:e.w,h:e.h,img:e.img}:null},
    ids:()=>N.byPrefix('glyph.').filter(e=>e.state==='ready').map(e=>e.role.slice(6)),
    css(){let st=document.getElementById('novaGlyphCss');if(!st){st=document.createElement('style');st.id='novaGlyphCss';document.head.appendChild(st)}
      st.textContent=N.glyph.ids().map(id=>{const g=N.glyph.get(id);return '.nova-glyph-'+id+'{background:center/contain no-repeat url('+g.url+');width:'+(g.w/2)+'px;height:'+(g.h/2)+'px;display:inline-block}'}).join('\n');return st}
  };
  // ---- 7. diagnostics ----
  N.report=function(){const assets=[...N.reg.values()].map(e=>({role:e.role,kind:e.kind,state:e.state,bytes:e.bytes,decodeMs:e.ms,info:e.info||null,compat:e.compat||null,warnings:e.warnings,err:e.err||null,size:e.w?e.w+'x'+e.h:undefined}));
    return {enabled:true,stat:Object.assign({},N.stat),missingScripts:N.missing||[],manifestMissing:!!N.stat.manifestMissing,assets,rig:N.rigReport?N.rigReport():null,events:Object.assign({},N.evCount),scene:N.scene.list(),warnings:N.warnings.slice(),sinceLoadMs:Math.round(performance.now()-N.t0)}};
  // start: load the dev manifest, inject the rig adapter, decode when the 3D layer is up
  const s=document.createElement('script');s.src='js/mb-nova-rig.js';document.head.appendChild(s);
  N.load();
  const tick=setInterval(()=>{if(typeof R3D!=='undefined'&&R3D.ready){N.kick();N.scene.flush()}},200);N._tick=tick;
})();
