/* Look v2, pilot (Nir approved the free pilot, 11.11.2026; concept: docs/concept-visual-language.md).
   Opt-in only: ?look=v2 in the address. Without it this file does nothing (not even LOOK3D entries).
   Village and open world only. The arena and the Underworld (Orel's) never change: lv2Here() is false there,
   the hero's outline is hidden and its rim strength is 0, so those frames are pixel-identical (tools/look-v2-shots.js proves it).
   Three parts, all from outside render3d.js (it only exposes foeKey(e), the LOOK3D key an ordinary enemy is drawn with):
   1. Hero readability: a thin dark outline (inverted hull) and a light edge rim on the selected hero's own model.
      The rim is js/rim-world.js's (rimwMat, one shader for the hero): here it is only turned up in daylight too.
      The model, skin and gear are never replaced. The white ground ring already exists (READ3D.hero in readable3d.js) and is reused.
   2. One world enemy with its own silhouette: the grunt in the open world is drawn as mon_orcSkull (Quaternius CC0,
      2,400 triangles, built by tools/build3d.js --only monsters --mon=orcSkull). Same type, hp, size, hit size and timings: only the look key.
   3. One village corner: the plaza in front of the village center gets a round paved floor with rounded curb stones,
      and its street lamps become rounder toy lamps. Visual only: walkable space and collision are unchanged.
   Numbers live in LV2. A new world enemy look = one row in LV2.swap and one in LV2.looks. */
const LV2={
  on:/[?&]look=v2\b/.test(location.search),
  swap:{grunt:'w_grunt'},   // world enemy type -> its v2 LOOK3D key
  looks:{w_grunt:{model:'mon_orcSkull',h:56,foot:13,anim:{run:'mon_orcSkull_Walk',die:'mon_orcSkull_Death'}}},
  clips:{mon_orcSkull:{hit:'mon_orcSkull_Weapon'}},   // FOEATK3D.clip: the swing it plays when it attacks (strike.js)
  outline:{col:0x1b1512,w:0.075},        // w: in model units (a KayKit hero is about 2.3 tall): about 2.5 px at the phone camera (0.045 was 1.5 px, too thin to read)
  rim:{k:0.5},   // edge rim on the hero, at least this strong in the village and world (rim-world.js: its color and where the edge starts)
  plaza:{x:0,y:-185,r:125,floor:'#BFA27A',curb:'#A08560',n:20,lampR:200,   // floor: warm sand. Village light is cool, so a pale floor read lilac (pilot shot 1)
      // lampR: street lamps this close to the plaza center become v2 lamps
    lamp:{h:56,post:'#5A3E2B',base:'#9E9484',cap:'#B54A3C',glow:'#ffd38a',halo:46}}
};
const lv2Here=()=>LV2.on&&typeof S!=='undefined'&&S&&!S.room&&!S.mb&&!!(S.vil||S.wd);
const LV2U={w:{value:LV2.outline.w}};

if(LV2.on){
  Object.assign(LOOK3D,LV2.looks);
  Object.assign(FOEATK3D.clip,LV2.clips);
  // 2. the world enemy: same enemy, another look key, only in the open world
  {const fk=foeKey;foeKey=function(e){const k=fk(e);return S&&S.wd&&!S.mb&&!S.room&&LV2.swap[k]?LV2.swap[k]:k}}
  // the world warms up every look that can appear (render3d.js wldTypes), so the new body is ready before it is on screen
  {const wt=wldTypes;wldTypes=function(reg){const ks=wt(reg);for(const k in LV2.swap)if(ks.includes(k)&&!ks.includes(LV2.swap[k])&&LOOK3D[LV2.swap[k]])ks.push(LV2.swap[k]);return ks}}
  // 1. the hero
  {const sp=syncPlayer;syncPlayer=function(){const r=sp.apply(this,arguments);try{lv2Hero(R3D.player)}catch(e){}return r}}
  // 3. the plaza
  {const sl=p3StreetLamp;p3StreetLamp=function(x,y,g){const P0=LV2.plaza;return Math.hypot(x-P0.x,y-P0.y)<P0.lampR?lv2Lamp(x,y,g):sl(x,y,g)}}
  {const vp=p3VillageProps;p3VillageProps=function(V){const r=vp.apply(this,arguments);if(!V.lv2){V.lv2=1;try{lv2Plaza(V.g)}catch(e){}}return r}}
}

/* ---- 1. hero: outline + rim ---- */
function lv2OutlineMat(){
  if(LV2.olMat)return LV2.olMat;
  const m=new THREE.MeshBasicMaterial({color:LV2.outline.col,side:THREE.BackSide,fog:false,toneMapped:false});
  m.onBeforeCompile=sh=>{sh.uniforms.lv2W=LV2U.w;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float lv2W;')
      .replace('#include <project_vertex>','#ifdef USE_SKINNING\ntransformed+=normalize(objectNormal)*lv2W;\n#else\ntransformed+=normalize(normal)*lv2W;\n#endif\n#include <project_vertex>')};
  m.customProgramCacheKey=()=>'lv2-outline';
  return LV2.olMat=m;
}
function lv2Hero(a){
  if(!a)return;
  if(a.lv2!==a.key){a.lv2=a.key;a.lv2ol=[];
    const src=[];a.root.traverse(o=>{if(o.isMesh&&!o.userData.lv2ol)src.push(o)});
    for(const o of src){let ol;
      if(o.isSkinnedMesh){ol=new THREE.SkinnedMesh(o.geometry,lv2OutlineMat());ol.bind(o.skeleton,o.bindMatrix);ol.bindMode=o.bindMode;
        ol.position.copy(o.position);ol.quaternion.copy(o.quaternion);ol.scale.copy(o.scale);o.parent.add(ol)}
      else{ol=new THREE.Mesh(o.geometry,lv2OutlineMat());o.add(ol)}   // weapons and props: outline only (their materials are shared with enemies)
      ol.userData.lv2ol=1;ol.frustumCulled=false;ol.renderOrder=-1;a.lv2ol.push([o,ol])}}
  // the rim: rim-world.js's material (it ticks first, index.html), only raised to LV2.rim.k here. In the arena both are 0
  const here=lv2Here();if(typeof rimwActor==='function')for(const U of rimwActor(a))U.k.value=here?Math.max(U.k.value,LV2.rim.k):RIMW.on?U.k.value:0;   // ?rimw=0: nobody else resets it, so 0 here
  for(const [o,ol] of a.lv2ol)ol.visible=here&&o.visible;
}

/* ---- 3. the plaza: round floor, rounded curb, rounder lamps ---- */
function lv2Smooth(c){const k='lv2'+c;return P3.mats[k]||(P3.mats[k]=new THREE.MeshLambertMaterial({color:c}))}   // smooth shading: rounder than p3Mat (flat)
function lv2Plaza(g){
  const P0=LV2.plaza,grp=new THREE.Group(),sin=SIN();
  const floor=new THREE.Mesh(new THREE.CircleGeometry(P0.r,48).rotateX(-Math.PI/2),new THREE.MeshLambertMaterial({color:P0.floor,polygonOffset:true,polygonOffsetFactor:-2}));
  floor.position.y=0.2;floor.scale.z=1/sin;grp.add(floor);   // below the shadow/ring marks (y 0.5), so nothing on it is hidden
  const stone=new THREE.SphereGeometry(1,10,6),cm=lv2Smooth(P0.curb);
  for(let i=0;i<P0.n;i++){const t=i/P0.n*Math.PI*2,x=Math.cos(t)*P0.r,y=Math.sin(t)*P0.r;
    if(Math.abs(Math.sin(t)-1)<0.08)continue;   // a gap toward the village gate (+y): the road in stays open
    const m=new THREE.Mesh(stone,cm);m.scale.set(13,4.5,9);m.position.set(x,1.5,y/sin);m.rotation.y=-t;grp.add(m)}
  grp.position.set(P0.x,0,P0.y/sin);g.add(grp);LV2.plazaG=grp;return grp;
}
function lv2Lamp(x,y,g){
  const L=LV2.plaza.lamp,grp=new THREE.Group();
  const base=new THREE.Mesh(new THREE.SphereGeometry(8,14,8),lv2Smooth(L.base));base.scale.y=0.45;base.position.y=2;grp.add(base);
  p3Mesh(new THREE.CylinderGeometry(3,3.6,L.h,12),lv2Smooth(L.post),0,L.h/2,0,grp);
  p3Mesh(new THREE.SphereGeometry(7.5,14,10),p3Mat(L.glow,true),0,L.h+6,0,grp);
  p3Mesh(new THREE.SphereGeometry(9,14,7,0,Math.PI*2,0,Math.PI/2),lv2Smooth(L.cap),0,L.h+10,0,grp);
  p3Mesh(new THREE.SphereGeometry(2.2,10,6),lv2Smooth(L.cap),0,L.h+19,0,grp);
  p3Halo(L.glow,L.halo,L.h+6,grp);
  return p3At(grp,x,y,g);
}
