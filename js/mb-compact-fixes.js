/* mb-compact-fixes.js (ARI, 10.11.2026): art-only proposal for BOB. Loads after js/mb-compact.js. Swaps weapon props of the compact heroes
   for readable ones (mage staff with orb, warrior thick red-glow scimitar, assassin lilac-edge dagger, hunter glowing bow).
   Models: art/compact/w_item_{staffOrb,bladeRed,dagger,bowGlow}.glb  ->  js/m3d/<key>.js (m3dPut base64, see tools/compact-fixes-install.cjs).
   No gameplay writes. Per-clip carry rotations (MBCFIX.carry) are filled by tools/solve-carry.cjs output when needed. */
const MBCFIX={on:true,
  keys:['w_item_staffOrb','w_item_bladeRed','w_item_dagger','w_item_bowGlow'],
  props:{
    tank:{},   // hammer prop stays BOB's (w_item_stoneHammer); only its carry rotation is driven below
    mage:{staff:{prop:'w_item_staffOrb',...HAND_R}},
    hunter:{bow:{prop:'w_item_bowGlow',bone:'handslotl',pos:[0,0,0],rot:[0,-0.7071,0,0.7071]}},
    warrior:{blade:{prop:'w_item_bladeRed',...HAND_R}},
    assassin:{blade:{prop:'w_item_dagger',...HAND_R}}},
  /* carry: per kit and prop key, rot (quaternion on the hand slot) per clip family. Solved in tools/solve-carry (compact-cap3.js) so the weapon points where it should:
     staff straight up, scimitar up-forward, dagger forward-out, bow upright, hammer resting back over the shoulder. 'attack' = the original HAND rotation (KayKit attack clips are authored for it). */
  carry:{
    tank:{hammer:{idle:{rot:[-0.0002,0,0.8889,0.4581]},run:{rot:[-0.1377,0,0.8581,0.4947]}}},
    warrior:{blade:{idle:{rot:[-0.1842,0,0.511,0.8396]},run:{rot:[-0.1239,0,0.4008,0.9078]}}},
    hunter:{bow:{idle:{rot:[-0.7946,0,0,0.6071]},run:{rot:[-0.7691,-0.1478,0.0334,0.6209]}}},
    mage:{staff:{idle:{rot:[-0.0177,0,0.6721,0.7403]},run:{rot:[0.3355,0,0.479,0.8111]}}},
    assassin:{blade:{idle:{rot:[-0.4237,0,0.2075,0.8817]},run:{rot:[-0.3853,0,0.1382,0.9124]}}}},
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
 const fam=(one,base)=>{const n=(one||base||'').split('@')[0];return /^Idle_/.test(n)?'idle':/^(Running|Walking)_/.test(n)?'run':'attack'};
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
