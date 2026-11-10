/* Compact roster trial. Opt-in only: ?compact=1 or ?compact=tank,warrior.
   Appearance only, no gameplay writes. Existing models remain the default.
   Compact bodies already include their own crowns/headwear. */
const MBCOMPACT={raw:(new URLSearchParams(location.search).get('compact')||''),
  keys:{tank:'compactTank',warrior:'compactWarrior',hunter:'compactHunter',mage:'compactMage',assassin:'compactAssassin'},
  // body size, visual only (the hitbox stays r16). Default 1.4: every hero 111-135 high incl. weapon (old bodies 83-117); at 2 they were 158-194 with 5-8x the footprint (QUINN gate on 616, 10.11). ?compactscale=1.2, 1.6 or 2 still selectable
  visualScale:Math.max(1,Math.min(2.2,Number(new URLSearchParams(location.search).get('compactscale'))||1.4)),stat:{built:0,loaded:0,fallback:0},
  // compact tank hammer: prop size and the strike window of Melee_2H_Attack_Chop (parts of its length). Pose only, the damage frame never moves (MAX 10.11: reach and height measured on a clean dummy)
  tank:{hammerS:1,from:.55,to:.66,dur:.08,settle:.05,
    // the compact hand stays at chest height through the chop, so the hammer turns head-down only for the strike: rot at the damage frame, held hold s, back to the normal grip over back s.
    // rot = Euler XYZ (-75,0,-25). Measured on a clean dummy at the damage frame (10.11, compactscale 1.4): head 27 forward vs target 22, 0.7 sideways, 1 high (the old -90z grip landed 64 to the SIDE). Idle and run keep the normal grip
    grip:{rot:[-0.5943,-0.1318,-0.1717,0.7745],hold:.14,back:.2}}};
MBCOMPACT.enabled=k=>MBCOMPACT.raw==='1'||MBCOMPACT.raw.split(',').includes(k);
if(MBCOMPACT.raw){
 for(const [kit,key] of Object.entries(MBCOMPACT.keys))M3D_LAZY[key]=1;
 const prior=mbPartsLook,cache={};
 mbPartsLook=function(B,kit){
   if(!MBCOMPACT.enabled(kit)||!S.mb||!R3D.on)return prior(B,kit);
   const key=MBCOMPACT.keys[kit];if(!key||!m3dNeed(key)){MBCOMPACT.stat.fallback++;return prior(B,kit)}
   if(cache[kit]&&cache[kit].base===B)return cache[kit];
   const props=Object.assign({},B.props);
   if(kit==='tank'){
     if(!R3D.props.w_item_stoneHammer){m3dNeed('w_item_stoneHammer');return prior(B,kit)}
     delete props.shield;
     props.hammer={prop:'w_item_stoneHammer',bone:'handslotr',pos:[0,0,0],rot:[0,0,0,1],s:MBCOMPACT.tank.hammerS};
   }
   if(kit==='mage'){if(!R3D.props.w_staff_A){m3dNeed('w_staff_A');return prior(B,kit)}props.staff={prop:'w_staff_A',...HAND_R,tint:'water'}};
   const L=Object.assign({},B,{model:key,h:B.h*MBCOMPACT.visualScale,props,base:B,sig:'compact-v1|'+kit});
   cache[kit]=L;MBCOMPACT.stat.built++;return L;
 };
 // Compact tank must not be replaced by the separate Tripo trial.
 if(typeof MBTANKX!=='undefined'&&MBCOMPACT.enabled('tank'))MBTANKX.on=false;
}
MBCOMPACT.headBounds={"tank": {"min": [-0.3076985776424407, -0.001043291046372019, -0.23199009895324704], "max": [0.3025669753551484, 0.49515124995429005, 0.26465621590614324]}, "warrior": {"min": [-0.3068376481533063, -0.0013423871895099637, -0.31791052222251787], "max": [0.28810626268386863, 0.552931999487555, 0.3728509247303007]}, "hunter": {"min": [-0.41435188055038513, -0.00047466266742901553, -0.4096662402153015], "max": [0.5017922520637542, 0.7298302616185595, 0.4499153792858124]}, "mage": {"min": [-0.34529617428779796, -0.0009656857896231941, -0.32496541738510143], "max": [0.3495144546031932, 0.8099870743050985, 0.4027771055698408]}, "assassin": {"min": [-0.45776906609534673, -0.0011700105362706381, -0.6083191037178077], "max": [0.6941910982131952, 1.2079601823550945, 0.6750406622886677]}};
// Draw labels above the ACTUAL compact head, not through the larger body.
// Only visual projection changes; unit coordinates/radius and all rules stay intact.
function mbCompactVisualTop(u,fallback,oy){
 if(!MBCOMPACT.enabled(u.kit)||!R3D.on||u.dead)return fallback;
 const a=u.me?R3D.player:R3D.actors.get(u),box=MBCOMPACT.headBounds[u.kit];
 if(!a||a.L.model!==MBCOMPACT.keys[u.kit]||!box)return fallback;
 const head=bone(a.root,'head');if(!head)return fallback;
 head.updateWorldMatrix(true,false);let top=1e9;const v=new THREE.Vector3();
 for(const x of [box.min[0],box.max[0]])for(const y of [box.min[1],box.max[1]])for(const z of [box.min[2],box.max[2]]){
  v.set(x,y,z).applyMatrix4(head.matrixWorld).project(R3D.cam);top=Math.min(top,(1-v.y)*H/2-oy);
 }
 return Math.min(fallback,top-12/ZOOM);
}
// Compact hammer: damage already lands in mbAttack. Start its visual at contact,
// not 180ms of downswing later. This is pose timing only, never gameplay timing.
if(MBCOMPACT.enabled('tank')&&typeof mbAtk3dTick==='function'){
 const oldCompactTick=mbAtk3dTick;
 mbAtk3dTick=function(u,a,C,dt){
  if(u.kit!=='tank'||a.L.model!=='compactTank')return oldCompactTick(u,a,C,dt);
  const hit=(u.atkT||0)>(u.atk3dLast==null?u.atkT||0:u.atk3dLast)+.05;
  const compact=Object.assign({},C,{from:MBCOMPACT.tank.from,to:MBCOMPACT.tank.to,dur:MBCOMPACT.tank.dur,settle:MBCOMPACT.tank.settle});
  oldCompactTick(u,a,compact,dt);
  if(hit&&a.mbA&&a.mbA.x){a.mbA.x.stopFading().setEffectiveWeight(1);a.mixer.update(0)}
  mbCompactGrip(a,hit,dt);
 };
}
// the strike grip: the stone hammer prop turns to grip.rot at the damage frame and eases back (pose only)
function mbCompactGrip(a,hit,dt){
 const G=MBCOMPACT.tank.grip,L=a.L||{};if(!G||!a.props)return;
 if(hit)a.cgT=0;else if(a.cgT!=null)a.cgT+=dt||0;
 const w=a.cgT==null?0:a.cgT<G.hold?1:Math.max(0,1-(a.cgT-G.hold)/G.back);if(w<=0)a.cgT=null;
 for(const k in a.props){const p=L.props&&L.props[k];if(!p||p.prop!=='w_item_stoneHammer')continue;const m=a.props[k];
  if(!m.userData.cq0)m.userData.cq0=m.quaternion.clone();if(!m.userData.cq1)m.userData.cq1=m.userData.cq0.clone().multiply(new THREE.Quaternion(...G.rot));
  m.quaternion.copy(m.userData.cq0).slerp(m.userData.cq1,w)}
}
/* Compact label layout v3. Append after compact adapter, no float edits. */
const MBCOMPACTLABEL={map:new Map(),stats:{crowded:0,moved:0},
  dy:[0,-10,-20,-30,10,20],dx:[0,-40,40,-80,80],gap:2,   // where a bar may move (screen px from its spot above the head) and the gap kept around bars and heads: short stems (QUINN: 30-50 px stems at every scale)
  mini:{dx:9,k:0.62}};   // the small badge left of a crowded bar: how far left (px) and its size
function mbCompactLabelsBegin(list,ox,oy){
 const Q=MBCOMPACTLABEL;Q.map.clear();Q.stats={crowded:0,moved:0};
 window.mbCompactLabelRects=[];window.mbCompactHeadRects=[];
 if(!R3D.on||!MBCOMPACT.raw)return;
 const z=ZOOM,sw=W*z,sh=H*z,heroes=list.filter(u=>u.k==='hero'&&MBCOMPACT.enabled(u.kit));
 const heads=heroes.map(u=>{const top=mbCompactVisualTop(u,u.y-78,oy),x=(u.x+ox)*z,y=(top+oy)*z+12;return {x:x-17,y,w:34,h:30,unit:u,top}});
 window.mbCompactHeadRects=heads.map(({x,y,w,h,unit})=>({x,y,w,h,unit}));
 const overlap=(a,b,g=3)=>a.x<b.x+b.w+g&&a.x+a.w+g>b.x&&a.y<b.y+b.h+g&&a.y+a.h+g>b.y;
 const occupied=[];
 heroes.sort((a,b)=>a.me?-1:b.me?1:Math.hypot(a.x-MB.me.x,a.y-MB.me.y)-Math.hypot(b.x-MB.me.x,b.y-MB.me.y));
 for(const u of heroes){
  const h=heads.find(h=>h.unit===u),cx=(u.x+ox)*z,base=h.y-15;
  const crowded=heads.some(o=>o!==h&&Math.abs(o.x-h.x)<55&&Math.abs(o.y-h.y)<64);
  let best=null,cost=Infinity;
  for(const dy of MBCOMPACTLABEL.dy)for(const dx of MBCOMPACTLABEL.dx){
   const r={x:cx+dx-19,y:base+dy,w:38,h:6,unit:u,essential:true};
   if(r.x<15||r.x+r.w>sw-15||r.y<85||r.y+r.h>sh-65)continue;
   if(occupied.some(o=>overlap(r,o,MBCOMPACTLABEL.gap))||heads.some(o=>overlap(r,o,MBCOMPACTLABEL.gap)))continue;
   const c=Math.abs(dx)*.8+Math.abs(dy)+Math.abs(dy>0?dy:0)*.5;
   if(c<cost){cost=c;best=r}
  }
  if(!best){best={x:Math.max(15,Math.min(sw-53,cx-19)),y:Math.max(85,base),w:38,h:6,unit:u,essential:true}}   // no free slot: stay at the hero (overlap is better than a bar far away on a long stem; BOB 10.11)
  occupied.push(best);window.mbCompactLabelRects.push(best);
  const moved=Math.abs(best.x+19-cx)>5||Math.abs(best.y-base)>5;
  Q.stats.crowded+=crowded?1:0;Q.stats.moved+=moved?1:0;
  Q.map.set(u,{r:best,head:h,crowded,moved,x:(best.x+19)/z-ox,top:best.y/z-oy,oy});
 }
}
function mbCompactDrawLabels(u,col){
 const p=MBCOMPACTLABEL.map.get(u);if(!p)return false;
 const z=ZOOM,x=p.x,y=p.top,bw=38/z,bh=4/z;
 ctx.save();
 if(p.moved){ctx.globalAlpha=.38;ctx.strokeStyle=col;ctx.lineWidth=1/z;ctx.beginPath();ctx.moveTo(x,y+5/z);ctx.lineTo(u.x,(p.head.y-2)/z-p.oy);ctx.stroke();ctx.globalAlpha=1}
 ctx.fillStyle='#10131de8';ctx.fillRect(x-bw/2-1/z,y-1/z,bw+2/z,bh+2/z);
 ctx.fillStyle=u.me?'#7BD88F':col;ctx.fillRect(x-bw/2,y,bw*Math.max(0,u.hp)/u.max,bh);
 // Personal marker remains even in a crowded pile. Team health is never hidden.
 if(u.me){ctx.strokeStyle='#f7cf65';ctx.lineWidth=1/z;ctx.strokeRect(x-bw/2-2/z,y-2/z,bw+4/z,bh+4/z)}
 if(!p.crowded&&!p.moved){ctx.save();ctx.translate(x,y);ctx.scale(mbUiK(),mbUiK());ctx.translate(-x,-y);mbBadge(u,x,y-14);ctx.restore()}
 else{const bx=x-bw/2-MBCOMPACTLABEL.mini.dx/z,by=y+bh/2,k=mbUiK()*MBCOMPACTLABEL.mini.k;ctx.save();ctx.translate(bx,by);ctx.scale(k,k);ctx.translate(-bx,-by);mbBadge(u,bx,by);ctx.restore()}   // crowded: a small class badge left of the bar, so who-is-who survives the pile (QUINN gate on 616)
 // Only critical CC, reduced to one small cue, never levels or a badge stack.
 if(u.st.stun>0||u.st.taunt>0){ctx.fillStyle=C.gold;ctx.beginPath();ctx.arc(x+bw/2+5/z,y+2/z,2/z,0,7);ctx.fill()}
 ctx.restore();return true;
}
