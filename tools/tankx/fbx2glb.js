// node fbx2glb.js in.fbx out.glb report.json : FBXLoader in Chromium -> geometry + skin + skeleton -> GLB (gltf-transform)
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),{Document,NodeIO}=require('@gltf-transform/core');
(async()=>{const [fin,fout,frep]=process.argv.slice(2);
 const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage();p.on('console',m=>console.log('c:',m.text()));
 await p.setContent('<html><body></body></html>');await p.addScriptTag({path:path.join(__dirname,'fbx-bundle.js')});
 const data=fs.readFileSync(fin).toString('base64');
 const R=await p.evaluate(async b64=>{const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;
  const T=window.THREEX;const root=new window.FBXLoader().parse(bin,'');root.updateMatrixWorld(true);
  const meshes=[],bones={};
  root.traverse(o=>{if(o.isBone)bones[o.name]={parent:o.parent&&o.parent.isBone?o.parent.name:null,pos:o.getWorldPosition(new T.Vector3()).toArray(),q:o.getWorldQuaternion(new T.Quaternion()).toArray(),scale:o.getWorldScale(new T.Vector3()).toArray()};});
  root.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,pa=g.attributes.position;const m=o.matrixWorld;
   const P=new Float32Array(pa.count*3);const v=new T.Vector3();for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);if(!o.isSkinnedMesh)v.applyMatrix4(m);else v.applyMatrix4(o.bindMatrix);P.set(v.toArray(),i*3)}
   const idx=g.index?Array.from(g.index.array):Array.from({length:pa.count},(_,i)=>i);
   const nn=g.attributes.normal?Array.from(g.attributes.normal.array):null;const uv=g.attributes.uv?Array.from(g.attributes.uv.array):null;
   const o2={N:nn,name:o.name,skinned:!!o.isSkinnedMesh,verts:pa.count,idx,P:Array.from(P),uv,mat:o.material&&(Array.isArray(o.material)?o.material.map(x=>x.name):o.material.name),groups:g.groups};
   if(o.isSkinnedMesh){o2.si=Array.from(g.attributes.skinIndex.array);o2.sw=Array.from(g.attributes.skinWeight.array);o2.bones=o.skeleton.bones.map(x=>x.name);o2.ibm=o.skeleton.boneInverses.map(x=>x.toArray());o2.bindMatrix=o.bindMatrix.toArray()}
   meshes.push(o2)});
  return {meshes,bones,anims:root.animations.map(a=>({name:a.name,dur:a.duration,tracks:a.tracks.length}))}},data);
 await b.close();
 // report
 const rep={bones:R.bones,anims:R.anims,meshes:R.meshes.map(m=>({name:m.name,skinned:m.skinned,verts:m.verts,tris:m.idx.length/3,mat:m.mat,groups:m.groups,nbones:m.bones&&m.bones.length}))};
 let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(const m of R.meshes)for(let i=0;i<m.P.length;i+=3)for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],m.P[i+k]);mx[k]=Math.max(mx[k],m.P[i+k])}
 rep.bbox={min:mn,max:mx,size:mx.map((v,k)=>v-mn[k])};fs.writeFileSync(frep,JSON.stringify(rep,null,1));
 fs.writeFileSync(frep.replace('.json','.raw.json'),JSON.stringify(R));
 console.log('meshes',rep.meshes,'bbox',rep.bbox,'nbones',Object.keys(R.bones).length,'anims',R.anims)})();
