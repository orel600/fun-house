/* Look v2, pilot (Nir approved the free pilot, 11.11.2026; concept: docs/concept-visual-language.md).
   On by default (Nir, 11.11: "אוהב את הסטייל החדש"). ?look=v1 (or ?look=classic) turns it off, for comparison: then this file does nothing.
   Village and open world only. The arena and the Underworld (Orel's) never change: lv2Here() is false there,
   the hero's outline is hidden and its rim strength is 0, so those frames are pixel-identical (tools/look-v2-shots.js proves it).
   Three parts, all from outside render3d.js (it only exposes foeKey(e), the LOOK3D key an ordinary enemy is drawn with):
   1. Hero readability: a thin dark outline (inverted hull) and a light edge rim on the selected hero's own model.
      The rim is js/rim-world.js's (rimwMat, one shader for the hero): here it is only turned up in daylight too.
      The model, skin and gear are never replaced. The white ground ring already exists (READ3D.hero in readable3d.js) and is reused.
   2. One world enemy with its own silhouette: the grunt in the open world is drawn as mon_orcSkull (Quaternius CC0,
      2,400 triangles, built by tools/build3d.js --only monsters --mon=orcSkull). Same type, hp, size, hit size and timings: only the look key.
   3. One village corner: the street lamps around the plaza in front of the village center become rounder toy lamps.
      (A round floor disc and a ring of curb stones were tried and removed, 11.11: Nir didn't read the disc as a plaza, and the stones alone read as scattered pebbles.)
   4. Village stage 2 (Nir approved the style, 11.11.2026): the smith and the innkeeper get their own toy bodies (they shared the golem's barbarian body),
      and the forge yard, the market row (the market's stalls and goods, and the plaza stalls) and the village gate become toy pieces.
      All built in Blender from code (tools/blender/build_village.py, village_v2.js): rigid parts on the same KayKit skeleton, so every NPC animation still plays.
      Only the drawn model changes: positions, sizes (vPut width), collision and roles stay. A piece that is still loading (js/m3d/) is drawn the old way,
      and the village is rebuilt once when it arrives. Village only: the world's gates and everything else keep their models.
   5. Phase 4 (11.11.2026): every level of the sawmill, mine, village center, inn and storehouse, the forge and market buildings, their camp, frame and
      yard pieces (tools/blender/build_village4.py), and the open world's resource trees and rocks. Same switch, same rules: only the drawn model changes.
   Numbers live in LV2. A new world enemy look = one row in LV2.swap and one in LV2.looks. A new village piece = one row in a LV2.vil zone. */
const LV2={
  on:!/[?&]look=(v1|classic)\b/.test(location.search),
  // world enemy type -> its v2 LOOK3D key. Phase 2 (11.11): each role has its own body, so a crowd reads by shape, not color
  swap:{grunt:'w_grunt',wisp:'w_wisp',shield:'w_shield',sprite:'w_sprite',golem:'w_golem',treant:'w_treant',crawler:'w_crawler',mummy:'w_mummy'},   // phase 3 adds the regions below (lv2Regions)
  looks:{
    w_grunt:{model:'mon_orcSkull',h:56,foot:13,anim:{run:'mon_orcSkull_Walk',die:'mon_orcSkull_Death'}},   // hunched orc, skull helmet, cleaver
    w_wisp:{model:'mon_wispGhost',h:54,foot:12,float:8,anim:{run:'mon_wispGhost_Fast_Flying',die:'mon_wispGhost_Death'}},   // horned shadow, no legs, keeps the hover
    // the same skeleton (all KayKit anims), but a tall tower shield and round shoulder pads: wide and square from above (gear built in code, lv2Gear)
    // hand frame while walking: forward is local +y, up is mostly local +x. Upper arm: up is local +z, so the pad dome is turned from +y to +z
    w_shield:{model:'warrior',h:60,foot:14,props:{shield:{prop:'lv2_tower',bone:'handslotl',pos:[0.1,0.12,0],rot:[0,0,0,1]},
      padL:{prop:'lv2_pad',bone:'upperarml',pos:[0,0.08,0.16],rot:[0.7071,0,0,0.7071]},padR:{prop:'lv2_pad',bone:'upperarmr',pos:[0,0.08,0.16],rot:[0.7071,0,0,0.7071]}},
      anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
    w_sprite:{model:'mon_spriteBee',h:38,foot:10,float:10,anim:{run:'mon_spriteBee_Fast_Flying',die:'mon_spriteBee_Death'}},   // little bee, no longer the player's mage body
    w_golem:{model:'mon_golemIdol',h:84,foot:18,tint:'#8A8478',anim:{run:'mon_golemIdol_Walk',die:'mon_golemIdol_Death'}},   // stone idol brute, no longer the smith's body. tint: a stone glow, like the old golem, so it isn't black at night
    // phase 3: the living tree keeps the skeleton rig and anims, under a big round leaf canopy (lv2Gear): from above it reads as a tree crown
    w_treant:{model:'warrior',h:74,foot:16,tint:'#5C3E24',props:{crown:{prop:'lv2_crown',bone:'head',pos:[0,0.45,0],rot:[0,0,0,1]}},
      anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
    w_crawler:{model:'mon_crawlerSpiky',h:36,foot:10,tint:'#C87533',anim:{run:'mon_crawlerSpiky_Walk',die:'mon_crawlerSpiky_Death'}},   // low spiky metal ball, copper
    w_mummy:{model:'mon_orcSkull',h:56,foot:13,tint:'#D9C9A3',anim:{run:'mon_orcSkull_Walk',die:'mon_orcSkull_Death'}}   // desert walker: the grunt's body in bandage sand
  },
  /* phase 3: regional variants reuse the role bodies, in the region's color (tint: the body; shield: the tower's glow, a damage-type color).
     Colors are picked for contrast with the region's ground: dark steel on the ridge's snow, bright violet in the shadow's dark */
  regions:{
    knight:{drowned:['#2E7F8F','water'],rimeknight:['#3F6FA8','ice'],stormknight:['#8A7BC8','lightning'],shadeknight:['#7A5BC8',null]},
    wisp:{mistling:['#6FC2E8',46,10],frostwraith:['#3F7FC0',46,10],flamewisp:['#FFB04A',46,12],sparkwisp:['#B07CFF',44,14],shadewisp:['#A07CFF',44,14]},
    warden:{tidewarden:['#1E5FD0',92],frostwarden:['#3F7FC0',96],emberwarden:['#E0502A',98],stormwarden:['#7A4FE0',100]},
    crawler:{cinderscorp:['#D2582A',42]}
  },
  clips:{mon_orcSkull:{hit:'mon_orcSkull_Weapon'},mon_golemIdol:{hit:'mon_golemIdol_Punch'},
    mon_wispGhost:{cast:'mon_wispGhost_Punch',shoot:'mon_wispGhost_Punch'}},   // FOEATK3D.clip: what it plays when it attacks (strike.js)
  gear:{wood:'#6B4A2E',iron:'#A3A9B3',paint:'#A8473B',tower:[1.0,1.55,0.12],pad:0.46,leaf:'#4E9A3C',leaf2:'#3C7E30'},   // tower: width, height, thickness (model units; the KayKit shield is 0.88x1.13). pad: dome radius (0.3 was too small to read at phone size)
  outline:{col:0x1b1512,w:0.075},        // w: in model units (a KayKit hero is about 2.3 tall): about 2.5 px at the phone camera (0.045 was 1.5 px, too thin to read)
  rim:{k:0.5},   // edge rim on the hero, at least this strong in the village and world (rim-world.js: its color and where the edge starts)
  plaza:{x:0,y:-185,lampR:200,   // street lamps this close to the plaza center become v2 lamps
    lamp:{h:56,post:'#5A3E2B',base:'#9E9484',cap:'#B54A3C',glow:'#ffd38a',halo:46}},
  // 4. the village: NPC bodies (same height, foot, props and animations as their LOOK3D.npc_<id>). No NPC keeps a tint, the toy colours carry who they are
  npc:{smith:{model:'lv2_smith'},inn:{model:'lv2_inn'}},
  // village pieces by zone: a KayKit model drawn within r of (x,y) is drawn as its v2 piece instead (vx_lv2_*). at: a building of VILLAGE.b (its x,y), r in its radii.
  // The first zone that maps a model wins, so a building's own zone comes before the plaza's
  vil:[
    {at:'forge',r:2.4,map:{v_barrel:'vx_lv2_barrel',vx_bucket:'vx_lv2_bucket',vx_rack:'vx_lv2_rack',v_crate:'vx_lv2_crate',v_lumber:'vx_lv2_lumber',vx_fenceS:'vx_lv2_fence',vx_flagR:'vx_lv2_banner',
      vx_forgeG:'vx_lv2_forgeG',v_forge:'vx_lv2_forgeB',vx_forgeR:'vx_lv2_forgeR'}},
    {at:'market',r:2.4,map:{vx_pallet:'vx_lv2_stall',v_tent:'vx_lv2_stall',vx_sack:'vx_lv2_sack',v_crate:'vx_lv2_crate',vx_crateS:'vx_lv2_crateS',v_barrel:'vx_lv2_barrel',vx_flagY:'vx_lv2_pennant',
      vx_marketG:'vx_lv2_marketG',v_market:'vx_lv2_marketB',vx_marketR:'vx_lv2_marketR'}},
    // phase 4 (11.11): every level of the other buildings. L1 a camp, L2 a timber frame, L3 green roof, L4 stone + blue roof + lit windows, L5 red (center: gold)
    {at:'center',r:1.6,map:{vx_ruin:'vx_lv2_ruin',vx_hallG:'vx_lv2_hallG',vx_towerAB:'vx_lv2_keepB',vx_castleY:'vx_lv2_castleY'}},
    {at:'mill',r:2.4,map:{vx_millG:'vx_lv2_millG',v_mill:'vx_lv2_millB',vx_millR:'vx_lv2_millR'}},
    {at:'mine',r:2.4,map:{v_rock:'vx_lv2_rock',vx_mineG:'vx_lv2_mineG',v_mine:'vx_lv2_mineB',vx_mineR:'vx_lv2_mineR'}},
    {at:'inn',r:2.4,map:{vx_tavernG:'vx_lv2_tavernG',vx_tavernB:'vx_lv2_tavernB',vx_tavernR:'vx_lv2_tavernR'}},
    {at:'stash',r:2.4,map:{vx_homeBG:'vx_lv2_homeG',vx_homeBB:'vx_lv2_homeB',vx_homeBR:'vx_lv2_homeR'}},
    {x:0,y:-80,r:300,map:{v_tent:'vx_lv2_stall',v_crate:'vx_lv2_crate',vx_sack:'vx_lv2_sack',v_barrel:'vx_lv2_barrel'}},   // the plaza stalls (VGROW.items, vgrowth.js)
    {any:1,map:{v_gate:'vx_lv2_gate'}}   // the village gate, wherever the border puts it
  ],
  // the yard pieces every building shares (the camp, the frame, the build site, goods, fences, flags, towers): added to each building zone above (lv2Yards)
  yard:{v_tent:'vx_lv2_tent',vx_stageA:'vx_lv2_stageA',vx_stageB:'vx_lv2_stageB',v_site:'vx_lv2_stageB',v_lumber:'vx_lv2_lumber',v_barrel:'vx_lv2_barrel',v_crate:'vx_lv2_crate',
    vx_crateS:'vx_lv2_crateS',vx_sack:'vx_lv2_sack',vx_bucket:'vx_lv2_bucket',vx_rack:'vx_lv2_rack',vx_fenceS:'vx_lv2_fence',vx_fenceW:'vx_lv2_fence',vx_flagR:'vx_lv2_banner',
    vx_flagY:'vx_lv2_pennant',v_flag:'vx_lv2_flagB',vx_wbarrow:'vx_lv2_wbarrow',vx_ladder:'vx_lv2_ladder',v_stone:'vx_lv2_stones',vx_towerA:'vx_lv2_towerA',vx_towerB:'vx_lv2_towerB',vx_pallet:'vx_lv2_pallet'},
  // 5. the open world's resource trees and rocks (phase 4): same node, size, hit size and gather stages (gather.js only moves and scales the model).
  // Regional kinds (pine, cactus, ... W3D.kinds) and the decor keep their look. log: the little log pile beside a tree you can cut
  world:{tree:['vx_lv2_treeA','vx_lv2_treeB'],rock:'vx_lv2_rock',log:'vx_lv2_lumber'}
};
// each building zone gets the shared yard pieces (its own entries win: the market's tent is a stall)
for(const Z of LV2.vil)if(Z.at)Z.map=Object.assign({},LV2.yard,Z.map);
const lv2Here=()=>LV2.on&&typeof S!=='undefined'&&S&&!S.room&&!S.mb&&!!(S.vil||S.wd);
const LV2U={w:{value:LV2.outline.w}};

// the regional looks, from the role templates above
function lv2Regions(){
  const R=LV2.regions,L=LV2.looks,K=L.w_shield,W=L.w_wisp,G=L.w_golem,C=L.w_crawler;
  for(const [k,[tint,dmg]] of Object.entries(R.knight)){L['w_'+k]={...K,h:64,tint,props:{...K.props,shield:{...K.props.shield,...(dmg?{tint:dmg}:{})}}};LV2.swap[k]='w_'+k}
  for(const [k,[tint,h,float]] of Object.entries(R.wisp)){L['w_'+k]={...W,h,float,tint};LV2.swap[k]='w_'+k}
  for(const [k,[tint,h]] of Object.entries(R.warden)){L['w_'+k]={...G,h,foot:20,tint};LV2.swap[k]='w_'+k}
  for(const [k,[tint,h]] of Object.entries(R.crawler)){L['w_'+k]={...C,h,tint};LV2.swap[k]='w_'+k}
}
if(LV2.on){
  lv2Regions();
  Object.assign(LOOK3D,LV2.looks);
  Object.assign(FOEATK3D.clip,LV2.clips);
  // the shield's gear is built once, before the first actor that wears it (makeActor, crowdOf)
  {const ma=makeActor;makeActor=function(L){if(!R3D.props.lv2_tower)lv2Gear();return ma.apply(this,arguments)}}
  // 2. the world enemies: same enemy, another look key, only in the open world
  {const fk=foeKey;foeKey=function(e){const k=fk(e);return S&&S.wd&&!S.mb&&!S.room&&LV2.swap[k]?LV2.swap[k]:k}}
  // the world warms up each enemy type before it is on screen (render3d.js wldWarmSet): warm the v2 body instead.
  // wldTypes stays a list of real enemy types (tools/check.js spawns each of them)
  {const ws=wldWarmSet;wldWarmSet=function(r,c,ks){return ws.call(this,r,c,ks.map(k=>LV2.swap[k]&&LOOK3D[LV2.swap[k]]?LV2.swap[k]:k))}}
  // 1. the hero
  {const sp=syncPlayer;syncPlayer=function(){const r=sp.apply(this,arguments);try{lv2Hero(R3D.player);const U=typeof VFX!=='undefined'&&VFX.rimU;if(U){if(lv2Here())U.value.setRGB(0,0,0);else U.value.copy(U.base)}}catch(e){}return r}}
  // 3. the plaza
  {const sl=p3StreetLamp;p3StreetLamp=function(x,y,g){const P0=LV2.plaza;return Math.hypot(x-P0.x,y-P0.y)<P0.lampR?lv2Lamp(x,y,g):sl(x,y,g)}}
  // 1b. one rim on the hero, not two (Nir 11.11: "some of the characters have that strange white light"): vfx.js's warm, wide rim
  // (k 1.2, pow 2) on top of rim-world's edge bleached the hero's head and armor white. In v2 the hero's rim is rim-world's, plus the outline
  // Only there: the rim is compiled into the hero's materials once, so it is turned to 0 per frame (VFX.rimU) and the arena keeps it (pixel-identical with v1)
  // 4. the village pieces and bodies. Every village NPC loses its tint (an emissive glow over the whole body: Avner and the merchant gold,
  // the priest lilac, washed out and glowing); the smith and the innkeeper also get their v2 bodies
  for(const k in LOOK3D){const id=k.slice(4),L0=LOOK3D[k];if(k.slice(0,4)!=='npc_'||!LV2.npc[id]&&!L0.tint)continue;
    const L=Object.assign({},L0,LV2.npc[id]);delete L.tint;LOOK3D['lv2npc_'+id]=L}
  {const vp=vPut;vPut=function(model,x,y,w,rot,group){const k=lv2VilKey(model,x,y);return vp.call(this,k||model,x,y,w,rot,group)}}
  // 5. the world's trees and rocks: W3D's models are swapped only while syncWorld runs (the village and the decor keep theirs).
  // Until the v2 pieces are loaded the nodes are drawn the old way; when they arrive those nodes are rebuilt once (lv2WorldSwap)
  {const sw=syncWorld;syncWorld=function(){const N=W3D.nodes,Lg=W3D.log,keep=[N.tree.model,N.rock.model,Lg.model];
    if(lv2Here()&&S.wd){const W=LV2.world,ok=[...W.tree,W.rock,W.log].map(k=>m3dNeed(k)).every(Boolean);LV2.wOk=ok;if(ok){N.tree.model=W.tree;N.rock.model=W.rock;Lg.model=W.log}lv2WorldSwap(ok)}
    try{return sw.apply(this,arguments)}finally{N.tree.model=keep[0];N.rock.model=keep[1];Lg.model=keep[2];lv2WorldMark()}}}
  // a building shows its look only when its models are loaded (syncVillage: m3dNeed on the KayKit keys). In v2 it asks for the v2 pieces instead,
  // so the old models it no longer draws are not downloaded (phase 4). A v2 piece that failed: the old model, as before
  {const need={};for(const Z of LV2.vil)if(Z.at)for(const k in Z.map)if(m3dLazy(k))(need[k]||(need[k]=new Set)).add(Z.map[k]);
    const mn=m3dNeed;m3dNeed=function(k){const vs=LV2.inSV&&need[k];if(vs&&![...vs].some(v=>M3D.st[v]==='fail'))return [...vs].map(v=>mn(v)).every(Boolean);return mn.apply(this,arguments)}}
  {const sv=syncVillage;syncVillage=function(){lv2VilReady();if(R3D.vil!==LV2.swV){LV2.swV=R3D.vil;lv2Sweep()}LV2.inSV=lv2Here()&&!!S.vil;try{return sv.apply(this,arguments)}finally{LV2.inSV=false}}}   // a new village object: free the old one's lamps
  {const sn=syncNpcs;syncNpcs=function(){const keep={};
    for(const lk in LOOK3D){if(lk.slice(0,7)!=='lv2npc_')continue;const id=lk.slice(7),k='npc_'+id,v=LOOK3D[lk];keep[k]=LOOK3D[k];
      const L=lv2Here()&&S.vil&&m3dNeed(v.model)?v:keep[k],a=R3D.npcs&&R3D.npcs[id];LOOK3D[k]=L;
      if(a&&a.L!==L){freeActor(a);delete R3D.npcs[id]}}   // the new body arrived (or v2 is off): a fresh actor, same place and state next frame
    try{return sn.apply(this,arguments)}finally{Object.assign(LOOK3D,keep)}}}   // LOOK3D.npc_* stays the classic look for everyone else
  // the opening loads what the village shows now (m3d.js m3dBoot: tools/check.js allows exactly M3D.bootKs at the start)
  {const mb=m3dBoot;m3dBoot=function(){const r=mb.apply(this,arguments);try{const ks=lv2VilBoot().filter(k=>m3dLazy(k)&&!(M3D.bootKs||[]).includes(k));for(const k of ks)m3dGo(k);M3D.bootKs=(M3D.bootKs||[]).concat(ks)}catch(e){}return r}}
}

/* ---- 1. hero: outline + rim ---- */
function lv2OutlineMat(){
  if(LV2.olMat)return LV2.olMat;
  // Lambert, not Basic: code that walks weapon props reads material.emissive (glow, hit flash, tools/check.js), and Basic has none
  // (giving Basic a fake emissive breaks three's uniform refresh). Dark color, black emissive: a near-black line, no glow
  const m=new THREE.MeshLambertMaterial({color:0x000000,emissive:0x000000,side:THREE.BackSide,fog:false});   // black and unlit-looking
  m.onBeforeCompile=sh=>{sh.uniforms.lv2W=LV2U.w;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float lv2W;')
      .replace('#include <project_vertex>','#ifdef USE_SKINNING\ntransformed+=normalize(objectNormal)*lv2W;\n#else\ntransformed+=normalize(normal)*lv2W;\n#endif\n#include <project_vertex>')};
  m.customProgramCacheKey=()=>'lv2-outline';
  m.userData.vfxRim=1;   // vfx.js rimOn skips it: its edge glow made the outline pale beige
  return LV2.olMat=m;
}
function lv2Hero(a){
  if(!a)return;
  // rebuilt when the body or what is worn changes (armor3d a.ar, gear3dParts a.g3), not every frame: parts added later need a line too (review 11.11)
  const st=a.key+'|'+(a.ar||'')+'|'+(a.g3||'');
  if(a.lv2!==st){lv2Unline(a);a.lv2=st;a.lv2ol=[];
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

// strips the hero's outlines (they share the source's geometry and one material: nothing to dispose). Also on a pooled actor (render3d.js freeActor),
// so a non-hero that reuses it never shows them (review 11.11)
function lv2Unline(a){for(const [,ol] of a.lv2ol||[])if(ol.parent)ol.parent.remove(ol);a.lv2ol=null;a.lv2=null}

/* ---- 2b. gear for the v2 shield: a tall tower shield and round shoulder pads, from simple shapes (no build step) ---- */
function lv2Gear(){
  const G=LV2.gear,[w,h,d]=G.tower,wood=lv2Smooth(G.wood),iron=lv2Smooth(G.iron),paint=lv2Smooth(G.paint);
  // built in the hand's frame (see w_shield): height along x (up), thickness along y (facing forward), width along z
  const t=new THREE.Group();
  p3Mesh(new THREE.BoxGeometry(h,d,w),wood,0,0,0,t);
  p3Mesh(new THREE.BoxGeometry(h*0.7,d*0.4,w*0.62),paint,0,d*0.6,0,t);   // a painted band on the front
  for(const x of [-h/2,h/2])p3Mesh(new THREE.BoxGeometry(0.09,d*1.4,w*1.06),iron,x,0,0,t);   // iron rims top and bottom
  p3Mesh(new THREE.SphereGeometry(0.13,12,8),iron,0,d*0.9,0,t);   // the boss
  R3D.props.lv2_tower=t;
  const p=new THREE.Group(),dome=new THREE.Mesh(new THREE.SphereGeometry(G.pad,14,8,0,Math.PI*2,0,Math.PI/2),iron);dome.scale.set(1.15,0.8,1);p.add(dome);
  p3Mesh(new THREE.TorusGeometry(G.pad*0.98,0.05,6,18),wood,0,0.01,0,p).rotation.x=Math.PI/2;
  R3D.props.lv2_pad=p;
  // the living tree's crown: three leaf balls over the head (head bone: up is +y)
  const c=new THREE.Group(),lf=lv2Smooth(G.leaf),lf2=lv2Smooth(G.leaf2);
  p3Mesh(new THREE.SphereGeometry(0.62,14,10),lf,0,0.25,0,c);
  p3Mesh(new THREE.SphereGeometry(0.46,12,8),lf2,0.45,0,0.15,c);
  p3Mesh(new THREE.SphereGeometry(0.44,12,8),lf2,-0.42,0.02,-0.12,c);
  R3D.props.lv2_crown=c;
}
/* ---- 3. the plaza: rounder lamps ---- */
function lv2Smooth(c){const k='lv2'+c;return P3.mats[k]||(P3.mats[k]=new THREE.MeshLambertMaterial({color:c}))}   // smooth shading: rounder than p3Mat (flat)
function lv2Lamp(x,y,g){
  const L=LV2.plaza.lamp,grp=new THREE.Group();
  const base=new THREE.Mesh(new THREE.SphereGeometry(8,14,8),lv2Smooth(L.base));base.scale.y=0.45;base.position.y=2;grp.add(base);
  p3Mesh(new THREE.CylinderGeometry(3,3.6,L.h,12),lv2Smooth(L.post),0,L.h/2,0,grp);
  p3Mesh(new THREE.SphereGeometry(7.5,14,10),p3Mat(L.glow,true),0,L.h+6,0,grp);
  p3Mesh(new THREE.SphereGeometry(9,14,7,0,Math.PI*2,0,Math.PI/2),lv2Smooth(L.cap),0,L.h+10,0,grp);
  p3Mesh(new THREE.SphereGeometry(2.2,10,6),lv2Smooth(L.cap),0,L.h+19,0,grp);
  p3Halo(L.glow,L.halo,L.h+6,grp);
  (LV2.own||(LV2.own=[])).push(grp);   // its geometries and halo are its own: freed when the village drops it (lv2Sweep)
  return p3At(grp,x,y,g);
}

/* ---- 4. the village: pieces and bodies ---- */
// which v2 piece a village model at (x,y) becomes, or null. Not loaded yet: null now, and the village rebuilds when it is (lv2VilReady)
function lv2VilKey(model,x,y){
  if(!lv2Here()||!S.vil)return null;
  for(const Z of LV2.vil){const k=Z.map[model];if(!k)continue;
    if(!Z.any){const B=Z.at?VILLAGE.b[Z.at]:Z,r=Z.at?Z.r*B.r:Z.r;if(!B||Math.hypot(x-B.x,y-B.y)>r)continue}
    if(m3dNeed(k))return k;(LV2.wait||(LV2.wait=new Set)).add(k);return null}
  return null;
}
// frees the lamps of villages that left the scene (lv2VilReady, a new village level in vgrowth.js, camera.js): only what lv2Lamp made.
// Materials from lv2Smooth/p3Mat and the soft texture are shared, so they stay
function lv2Sweep(){
  const L=LV2.own;if(!L||!L.length||!R3D.scene)return;
  const inScene=o=>{while(o){if(o===R3D.scene)return true;o=o.parent}return false};
  LV2.own=L.filter(grp=>{if(inScene(grp))return true;
    grp.traverse(o=>{if(o.isSprite){if(o.material)o.material.dispose()}else if(o.isMesh&&o.geometry)o.geometry.dispose()});LV2.freed=(LV2.freed||0)+1;return false});
}
function lv2VilReady(){
  const W=LV2.wait;if(!W||!W.size||![...W].every(k=>m3dReady(k)||M3D.st[k]==='fail'))return;
  LV2.wait=null;if(R3D.vil){R3D.scene.remove(R3D.vil.g);R3D.vil=null;lv2Sweep()}   // rebuilt by syncVillage, like a new village level (vgrowth.js)
}
// what the village needs at the opening: the gate, the two bodies, and the v2 pieces of the forge and market looks and the plaza of this level
function lv2VilBoot(){
  if(!LV2.on||typeof VILLAGE==='undefined'||typeof SAVE==='undefined'||!SAVE||!SAVE.village)return [];
  const ks=[...Object.values(LV2.npc).map(n=>n.model),'vx_lv2_gate'];
  for(const Z of LV2.vil){if(!Z.at)continue;const L=SAVE.village[Z.at]||0,lk=L&&VILLAGE.b[Z.at].look.filter(b=>L>=b.at).pop();if(!lk)continue;
    for(const m of [VIL3D.models[lk.model].model,...lk.deco.map(d=>VIL3D.deco[d].model)])if(Z.map[m])ks.push(Z.map[m])}
  if(typeof VGROW!=='undefined'){const L=Math.max(1,SAVE.village.center||1),Z=LV2.vil.find(z=>!z.at&&!z.any);
    for(const it of VGROW.items)if(L>=it.at&&(!it.to||L<=it.to)&&Z.map[it.m]&&Math.hypot(it.x-Z.x,it.y-Z.y)<=Z.r)ks.push(Z.map[it.m])}
  return [...new Set(ks)];
}

/* ---- 5. the world's trees and rocks ---- */
// which nodes are drawn from W3D.nodes tree/rock (not a regional kind, a vein or a chest)
function lv2WorldNodes(cb){
  const G=R3D.wlds&&S.wd&&R3D.wlds[S.wd.reg||'meadow'];if(!G)return;
  for(const n of S.nd.list){const m=G.nodes[n.id];if(!m)continue;const sh=wKind(n.kind).shape;
    if((sh==='tree'||sh==='rock')&&!(G.kinds&&W3D.kinds[n.kind]))cb(n,m,G)}
}
// a node built before the v2 pieces arrived: dropped (with its log and stump), syncWorld builds it again this frame in v2
function lv2WorldSwap(ok){
  if(!ok)return;lv2WorldNodes((n,m,G)=>{if(m.userData.lv2w!==0)return;const u=m.userData;
    for(const o of [m,u.log,u.gSt])if(o&&o.parent)o.parent.remove(o);delete G.nodes[n.id];LV2.rebuilt=(LV2.rebuilt||0)+1})
}
function lv2WorldMark(){if(lv2Here()&&S.wd)lv2WorldNodes((n,m)=>{if(m.userData.lv2w==null)m.userData.lv2w=LV2.wOk?1:0})}
