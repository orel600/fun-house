// node raw2glb.js raw.json out.glb [basecolor.jpg texSize]   (raw.json from fbx2glb.js)
const fs=require('fs'),sharp=require('sharp'),{Document,NodeIO}=require('@gltf-transform/core');
(async()=>{const [fin,fout,tex,ts]=process.argv.slice(2);const R=JSON.parse(fs.readFileSync(fin));
 const d=new Document(),buf=d.createBuffer(),sc=d.createScene();
 const m=R.meshes[0];const A=(a,t,C)=>d.createAccessor().setType(t).setArray(C.from(a)).setBuffer(buf);
 const mat=d.createMaterial('mat').setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(true);
 if(tex){const jb=await sharp(tex).resize(+ts||1024,+ts||1024).jpeg({quality:88}).toBuffer();mat.setBaseColorTexture(d.createTexture().setImage(new Uint8Array(jb)).setMimeType('image/jpeg'))}
 const prim=d.createPrimitive().setAttribute('POSITION',A(m.P,'VEC3',Float32Array)).setIndices(A(m.idx,'SCALAR',Uint32Array)).setMaterial(mat);
 if(m.N)prim.setAttribute('NORMAL',A(m.N,'VEC3',Float32Array));
 if(m.uv)prim.setAttribute('TEXCOORD_0',A(m.uv.map((v,i)=>i%2?1-v:v),'VEC2',Float32Array));
 const mesh=d.createMesh('body').addPrimitive(prim);
 const node=d.createNode('body').setMesh(mesh);
 if(m.skinned&&Object.keys(R.bones).length){
  const B=R.bones,names=Object.keys(B),nodes={};const {Matrix4,Quaternion,Vector3}=require('./mini3.js');
  const W={};for(const n of names){W[n]=Matrix4.compose(new Vector3(...B[n].pos),new Quaternion(...B[n].q),new Vector3(...B[n].scale))}
  for(const n of names)nodes[n]=d.createNode(n);
  let rootBone=null;for(const n of names){const par=B[n].parent;let L=W[n];if(par){L=Matrix4.mul(Matrix4.invert(W[par]),W[n]);nodes[par].addChild(nodes[n])}else rootBone=nodes[n];
    const t=Matrix4.decompose(L);nodes[n].setTranslation(t.p).setRotation(t.q).setScale(t.s)}
  sc.addChild(rootBone);
  const skin=d.createSkin('skin');const order=m.bones;order.forEach(n=>skin.addJoint(nodes[n]));
  skin.setInverseBindMatrices(A(order.flatMap(n=>Matrix4.invert(W[n])),'MAT4',Float32Array));
  prim.setAttribute('JOINTS_0',A(m.si,'VEC4',Uint16Array)).setAttribute('WEIGHTS_0',A(m.sw,'VEC4',Float32Array));
  node.setSkin(skin);
 }
 sc.addChild(node);await new NodeIO().write(fout,d);console.log('wrote',fout,fs.statSync(fout).size)})();
