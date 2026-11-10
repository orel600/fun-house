/* mb-compact-fixes.js (ARI, 10.11.2026): art-only proposal for BOB. Loads after js/mb-compact.js. Swaps weapon props of the compact heroes
   for readable ones (mage staff with orb, warrior thick red-glow scimitar, assassin lilac-edge dagger, hunter glowing bow).
   Models: art/compact/w_item_{staffOrb,bladeRed,dagger,bowGlow}.glb  ->  js/m3d/<key>.js (m3dPut base64, see tools/compact-fixes-install.cjs).
   No gameplay writes. Per-clip carry rotations (MBCFIX.carry) are filled by tools/solve-carry.cjs output when needed. */
const MBCFIX={on:true,
  keys:['w_item_staffOrb','w_item_bladeRed','w_item_dagger','w_item_bowGlow','w_item_tankHammer'],
  props:{
    tank:{hammer:{prop:'w_item_tankHammer',bone:'handslotr',pos:[0,0,0],rot:[0,0,0,1],s:1}},   // ARI's basalt-and-gold hammer (grip at origin, handle along +y like the stone one). Its own key: w_item_stoneHammer is shared   // hammer prop stays BOB's (w_item_stoneHammer); only its carry rotation is driven below
    mage:{staff:{prop:'w_item_staffOrb',...HAND_R}},
    hunter:{bow:{prop:'w_item_bowGlow',bone:'handslotl',pos:[0,0,0],rot:[0,-0.7071,0,0.7071]}},
    warrior:{blade:{prop:'w_item_bladeRed',...HAND_R}},
    assassin:{blade:{prop:'w_item_dagger',...HAND_R}}},
  /* carry: per kit and prop key, rot (quaternion on the hand slot) per clip family. Solved in tools/solve-carry (compact-cap3.js) so the weapon points where it should:
     staff straight up, scimitar up-forward, dagger forward-out, bow upright, hammer resting back over the shoulder. 'attack' = the original HAND rotation (KayKit attack clips are authored for it). */
  carry:{
    tank:{hammer:{ready:{rot:[-0.0179,0,0.7797,0.6259]},idle:{rot:[-0.0002,0,0.8889,0.4581]},run:{rot:[-0.1377,0,0.8581,0.4947]}}},
    warrior:{blade:{ready:{rot:[0.0985,0,0.3436,0.9339]},idle:{rot:[-0.1842,0,0.511,0.8396]},run:{rot:[-0.1239,0,0.4008,0.9078]}}},
    hunter:{bow:{ready:{rot:[-0.3866,-0.2637,-0.0786,0.8803]},idle:{rot:[-0.7946,0,0,0.6071]},run:{rot:[-0.7691,-0.1478,0.0334,0.6209]}}},
    mage:{staff:{idle:{rot:[-0.0177,0,0.6721,0.7403]},run:{rot:[0.3355,0,0.479,0.8111]}}},
    assassin:{blade:{ready:{rot:[-0.1335,0,0.0911,0.9869]},idle:{rot:[-0.4237,0,0.2075,0.8817]},run:{rot:[-0.3853,0,0.1382,0.9124]}}}},
  hold:1.0};
if(typeof MBCOMPACT!=='undefined'&&MBCOMPACT.raw){
 for(const k of MBCFIX.keys)M3D_LAZY[k]=1;
 const prior=mbPartsLook,cache={};
 mbPartsLook=function(B,kit){const L=prior(B,kit);
  if(!MBCFIX.on||!L||L.sig===undefined||!MBCOMPACT.enabled(kit)||!MBCFIX.props[kit])return L;
  const need=Object.values(MBCFIX.props[kit]).map(p=>p.prop);if(!need.every(k=>m3dNeed(k)))return L;
  const key=kit;if(cache[key]&&cache[key].base===L)return cache[key];
  const props=Object.assign({},L.props,MBCFIX.props[kit]);
  return cache[key]=Object.assign({},L,{props,base:L,sig:L.sig+'|fix1'})};

 // runtime carry: same family logic as tankxCarry (idle / run / attack-and-everything-else)
 const fam=(one,base)=>{const n=(one||base||'').split('@')[0];return /^(Melee_2H_Idle|Ranged_Bow_Idle)$/.test(n)?'ready':/^Idle_/.test(n)?'idle':/^(Running|Walking)_/.test(n)?'run':'attack'};
 // the actor keeps its weapon under the look's slot name (sword, gun), not always the key here: find it by the prop model (BOB, 10.11)
 const cfKey=(a,kit,key)=>{const pr=(MBCFIX.props[kit][key]||{}).prop||(kit==='tank'&&key==='hammer'?'w_item_stoneHammer':null);if(!pr)return a.props[key]?key:null;
  for(const k in a.props){const d=a.L.props&&a.L.props[k];if(d&&d.prop===pr)return k}return null};
 const carry=(a,dt)=>{if(!a||!a.L||!a.L.sig||!/\|fix1/.test(a.L.sig)||!a.props)return;const kit=a.L.sig.split('|')[1],T=MBCFIX.carry[kit];if(!T)return;
  const one=a.one&&a.one.isRunning()?a.one.getClip().name:'';let f=fam(one,a.base);a.cfT=(a.cfT||0)+(dt||0);
  if(f==='attack')a.cfAtk=a.cfT;else if(dt&&a.cfAtk!=null&&a.cfT-a.cfAtk<MBCFIX.hold)f='attack';
  for(const key0 in T){const key=cfKey(a,kit,key0),m=key&&a.props[key],p=T[key0][f];if(!m)continue;if(p)m.quaternion.fromArray(p.rot);else{const d=a.L.props[key];if(d&&d.rot)m.quaternion.fromArray(d.rot)}
   if(kit==='tank'&&a.cgW>0&&typeof mbCompactGripApply==='function')mbCompactGripApply(a,m.quaternion.toArray())}};   // the strike (mb-compact.js, BOB): at the damage frame the hammer turns head-down as measured, then eases back to this carry
 const bu=mb3dUnit;mb3dUnit=function(e,dt){const r=bu.apply(this,arguments);const a=R3D.actors.get(e);if(a)carry(a,dt);return r};
 const bp=syncPlayer;syncPlayer=function(){const r=bp.apply(this,arguments);carry(R3D.player,arguments[0]);return r};
}
// warm-up (BOB 10.11, QUINN: a 0.5-0.9 s freeze at the first hit of a match). The compact bodies and these props were loaded lazily at match start and landed ~1.5 s in,
// so every compact actor was rebuilt with new materials (new shaders) right at the first fight. Now, as soon as 3D is ready and no match runs (the menu):
// load them all, build one actor per compact kit off-screen, compile its shaders, upload its textures, and leave it in the pool, where the match picks it up.
// Same idea as the village and world warm-ups in render3d.js. MBCFIX.warm: done, ms, n
MBCFIX.warm={done:false,ms:0,n:0};
(function(){
 if(typeof MBCOMPACT==='undefined'||!MBCOMPACT.raw)return;
 const run=async()=>{
  MBCFIX.warm.done=true;const t0=performance.now();
  const parts=[];if(typeof MBPARTS!=='undefined')for(const kit in MBPARTS)for(const v of Object.values((MBPARTS[kit]&&MBPARTS[kit].add)||{}))if(v&&v.prop)parts.push(v.prop);   // ARI's parts (crowns, second dagger, crystal)
  const keys=[...new Set([...Object.values(MBCOMPACT.keys),...MBCFIX.keys,'w_item_stoneHammer','w_staff_A',...parts,...(typeof MBSKBODY!=='undefined'?MBSKBODY.pre:[])])].filter(k=>k in M3D_LAZY);   // MBSKBODY.pre: the underworld clip packs (anim_mbx_*), otherwise decoded mid-match
  await Promise.all(keys.map(k=>m3dGo(k).catch(()=>{})));
  // each actor also gets the rim shader (mb-rim.js), which is part of its look in a match, so that variant is compiled here too
  const made=[],sm=S.mb;S.mb=S.mb||{warm:1};   // the compact look is only built inside the underworld (S.mb): for a moment, only here
  try{for(const kit in MBCOMPACT.keys){const B=LOOK3D['mb_'+kit];if(!B||!MBCOMPACT.enabled(kit))continue;const L=mbPartsLook(B,kit);if(!L||L.model!==MBCOMPACT.keys[kit])continue;
    const a=makeActor(L);a.root.position.set(0,-5000,0);made.push(a);
    if(typeof mbRimActor==='function'&&MBRIM.on&&MBRIM.kit[kit]&&(MBRIM.kit[kit].k>0||MBRIM.kit[kit].fill>0))mbRimActor(a,kit)}}catch(e){}finally{S.mb=sm}
  const r=R3D.r;try{if(r.compileAsync)await r.compileAsync(R3D.scene,R3D.cam);else r.compile(R3D.scene,R3D.cam)}catch(e){}
  if(r.initTexture)for(const a of made)a.root.traverse(o=>{for(const m of [].concat(o.material||[]))for(const k of ['map','emissiveMap','normalMap'])if(m[k])try{r.initTexture(m[k])}catch(e){}});
  for(const a of made)freeActor(a);MBCFIX.warm.ms=Math.round(performance.now()-t0);MBCFIX.warm.n=made.length;
 };
 const tryRun=()=>{if(MBCFIX.warm.done)return;if(typeof R3D!=='undefined'&&R3D.ready&&R3D.r&&!(typeof S!=='undefined'&&S&&S.mb))run();else setTimeout(tryRun,300)};
 setTimeout(tryRun,200);
})();
