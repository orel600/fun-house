// Transfers the KayKit knight's skeleton and skin weights onto the generated blacksmith mesh, then exports a rigged GLB.
// usage: node rig.js
const {chromium}=require('/home/claude/fun-house/node_modules/playwright');const fs=require('fs');
const KNIGHT='/home/claude/assets-dl/adv-git/addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb';
(async()=>{
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>console.log('[page]',m.text()));
  await p.setContent('<body></body>');await p.addScriptTag({path:'/home/claude/pilot/three-tools.js'});
  const out=await p.evaluate(async({knight,smith})=>{
    const T=THREE,load=d=>new Promise((ok,bad)=>new T.GLTFLoader().parse(Uint8Array.from(atob(d),c=>c.charCodeAt(0)).buffer,'',ok,bad));
    const K=await load(knight),S=await load(smith);
    const kroot=K.scene;kroot.updateMatrixWorld(true);
    const bone=n=>{let r=null;kroot.traverse(o=>{if(o.isBone&&o.name===n)r=o});return r};
    const parts=[];kroot.traverse(o=>{if(o.isSkinnedMesh)parts.push(o)});
    const skel=parts[0].skeleton;
    // our mesh, mapped into the knight's space: same height, feet on the same floor, centred
    let sm=null;S.scene.traverse(o=>{if(o.isMesh&&!sm)sm=o});sm.updateMatrixWorld(true);
    const g=sm.geometry.clone();g.applyMatrix4(sm.matrixWorld);
    const kb=new T.Box3();for(const pt of parts){pt.geometry.computeBoundingBox();kb.union(pt.geometry.boundingBox)}
    g.computeBoundingBox();const sb=g.boundingBox;
    const s=(kb.max.y-kb.min.y)/(sb.max.y-sb.min.y);
    g.translate(-(sb.min.x+sb.max.x)/2,-sb.min.y,-(sb.min.z+sb.max.z)/2);g.scale(s,s,s);g.translate((kb.min.x+kb.max.x)/2,kb.min.y,(kb.min.z+kb.max.z)/2);
    const P=g.attributes.position,n=P.count;
    // where the hands of the blacksmith are: the vertices farthest out on each side
    let hl=null,hr=null;const v=new T.Vector3();
    for(let i=0;i<n;i++){v.fromBufferAttribute(P,i);if(!hl||v.x>hl.x)hl=v.clone();if(!hr||v.x<hr.x)hr=v.clone()}
    // pose the knight's arms (T-pose) down to the blacksmith's A-pose: rotate each upper arm so the hand points at the target
    const aim=(upName,handName,target)=>{
      const up=bone(upName),hand=bone(handName);kroot.updateMatrixWorld(true);
      const sp=up.getWorldPosition(new T.Vector3()),hp=hand.getWorldPosition(new T.Vector3());
      const q=new T.Quaternion().setFromUnitVectors(hp.clone().sub(sp).normalize(),target.clone().sub(sp).normalize());
      const wq=up.getWorldQuaternion(new T.Quaternion()),pq=up.parent.getWorldQuaternion(new T.Quaternion());
      up.quaternion.copy(pq.invert().multiply(q.multiply(wq)));kroot.updateMatrixWorld(true);
      return {from:hp.toArray().map(x=>+x.toFixed(3)),to:target.toArray().map(x=>+x.toFixed(3))};
    };
    // the hand bone sits at the wrist; aim a bit inside the fingertip
    const inset=(h,side)=>new T.Vector3(h.x-side*0.06*(kb.max.y-kb.min.y),h.y+0.03*(kb.max.y-kb.min.y),h.z);
    const arms=[aim('upperarml','handl',inset(hl,1)),aim('upperarmr','handr',inset(hr,-1))];
    // the knight's mesh in that pose, with its skin weights
    const KP=[],KI=[],KW=[];
    for(const pt of parts){const pg=pt.geometry,pp=pg.attributes.position,si=pg.attributes.skinIndex,sw=pg.attributes.skinWeight,t=new T.Vector3();
      for(let i=0;i<pp.count;i++){t.fromBufferAttribute(pp,i);pt.applyBoneTransform(i,t);t.applyMatrix4(pt.matrixWorld);
        KP.push(t.x,t.y,t.z);KI.push(si.getX(i),si.getY(i),si.getZ(i),si.getW(i));KW.push(sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i))}}
    const kn=KP.length/3;
    // each blacksmith vertex takes the blended weights of the 4 nearest knight vertices
    const idx=new Uint16Array(n*4),wt=new Float32Array(n*4);
    for(let i=0;i<n;i++){v.fromBufferAttribute(P,i);
      const best=[];
      for(let j=0;j<kn;j++){const dx=KP[3*j]-v.x,dy=KP[3*j+1]-v.y,dz=KP[3*j+2]-v.z,d=dx*dx+dy*dy+dz*dz;
        if(best.length<4||d<best[3][0]){best.push([d,j]);best.sort((a,b)=>a[0]-b[0]);if(best.length>4)best.pop()}}
      const acc=new Map();
      for(const [d,j] of best){const w0=1/(Math.sqrt(d)+1e-4);for(let k=0;k<4;k++){const bi=KI[4*j+k],bw=KW[4*j+k];if(bw>0)acc.set(bi,(acc.get(bi)||0)+bw*w0)}}
      const top=[...acc].sort((a,b)=>b[1]-a[1]).slice(0,4),tot=top.reduce((s,x)=>s+x[1],0);
      top.forEach(([bi,bw],k)=>{idx[4*i+k]=bi;wt[4*i+k]=bw/tot});
    }
    g.setAttribute('skinIndex',new T.Uint16BufferAttribute(idx,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(wt,4));
    // new skinned mesh bound to the knight skeleton in this pose
    const mat=sm.material;
    const mesh=new T.SkinnedMesh(g,mat);mesh.name='Blacksmith_Body';
    for(const pt of parts)pt.parent.remove(pt);
    kroot.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)o.visible=false});   // the knight's sword, helmet and cape
    const drop=[];kroot.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)drop.push(o)});drop.forEach(o=>o.parent.remove(o));
    const rig=skel.bones[0].parent;rig.add(mesh);kroot.updateMatrixWorld(true);
    mesh.bind(new T.Skeleton(skel.bones),new T.Matrix4());
    const keep=['Idle','Idle_B','Walking_A','Running_A','Interact','1H_Melee_Attack_Chop','Cheer','Hit_A','Death_A','Sit_Chair_Idle'];
    const clips=K.animations.filter(a=>keep.includes(a.name));
    const glb=await new Promise((ok,bad)=>new T.GLTFExporter().parse(kroot,ok,bad,{binary:true,animations:clips}));
    let bin='';const u=new Uint8Array(glb);for(let i=0;i<u.length;i+=32768)bin+=String.fromCharCode.apply(null,u.subarray(i,i+32768));
    return {glb:btoa(bin),arms,scale:s,verts:n,knightVerts:kn,clips:clips.map(c=>c.name)};
  },{knight:fs.readFileSync(KNIGHT).toString('base64'),smith:fs.readFileSync('/home/claude/pilot/blacksmith_static.glb').toString('base64')});
  fs.writeFileSync('/home/claude/pilot/blacksmith_rigged.glb',Buffer.from(out.glb,'base64'));delete out.glb;
  console.log(JSON.stringify(out),errs.join('\n'));await b.close();
})();
