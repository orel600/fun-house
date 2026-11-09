const {NodeIO}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
(async()=>{const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const d=await io.read('C:/kk/adv2/Characters/gltf/Ranger.glb'),root=d.getRoot();
const nodes=root.listNodes().filter(n=>n.getMesh()&&/^Ranger_/.test(n.getName()));
console.log(nodes.map(n=>n.getName()+' skin:'+(n.getSkin()&&n.getSkin().getName())+' mat:'+n.getMesh().listPrimitives()[0].getMaterial().getName()+' tex:'+n.getMesh().listPrimitives()[0].getMaterial().getBaseColorTexture().getURI()+'/'+n.getMesh().listPrimitives()[0].getMaterial().getBaseColorTexture().getImage().length).join('\n'));
const P=[],U=[],J=[],W=[],I=[];let base=0;
for(const n of nodes){const p=n.getMesh().listPrimitives()[0],a=p.getAttribute('POSITION'),m=n.getWorldMatrix();
  for(let i=0;i<a.getCount();i++){P.push(a.getElement(i,[]));U.push(p.getAttribute('TEXCOORD_0').getElement(i,[]));J.push(p.getAttribute('JOINTS_0').getElement(i,[]));W.push(p.getAttribute('WEIGHTS_0').getElement(i,[]))}
  const ix=p.getIndices();for(let i=0;i<ix.getCount();i++)I.push(ix.getScalar(i)+base);base+=a.getCount()}
const buf=root.listBuffers()[0],first=nodes[0],mat=first.getMesh().listPrimitives()[0].getMaterial(),sk=first.getSkin();
const acc=(arr,type,C)=>d.createAccessor().setType(type).setArray(C.from(arr.flat?arr.flat():arr)).setBuffer(buf);
const prim=d.createPrimitive().setAttribute('POSITION',acc(P,'VEC3',Float32Array)).setAttribute('TEXCOORD_0',acc(U,'VEC2',Float32Array)).setAttribute('JOINTS_0',acc(J,'VEC4',Uint16Array)).setAttribute('WEIGHTS_0',acc(W,'VEC4',Float32Array)).setIndices(acc(I,'SCALAR',Uint32Array)).setMaterial(mat);
const mesh=d.createMesh('Ranger_Body').addPrimitive(prim);
for(const n of nodes){n.setMesh(null)}first.setMesh(mesh).setSkin(sk);
for(const m of root.listMeshes())if(m!==mesh&&m.listParents().filter(p=>p.propertyType==='Node').length===0)m.dispose();
for(const a of root.listAnimations())a.dispose();
await io.write(process.argv[2]+'/ranger_donor.glb',d);console.log('verts',P.length,'tris',I.length/3)})();
