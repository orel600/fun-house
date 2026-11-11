/* Look v2, village stage 2 (Nir approved the "toy" style, 11.11.2026; docs/concept-visual-language.md §8).
   The smith's and innkeeper's own bodies, and the forge yard, market row and gate pieces, built in Blender from code (build_village.py).
   This script is the glue on both sides of Blender. Not part of the game, not run by the check.
   1. node tools/blender/village_v2.js rig      the KayKit skeleton the NPCs already use (barbarian, from js/models3d.js) -> art/village-v2/raw/rig.json
   2. blender -b --python tools/blender/build_village.py -- tools/blender art/village-v2/raw
   3. node tools/blender/village_v2.js pack     -> js/m3d/lv2_smith.js, lv2_inn.js (skinned on that same skeleton, so every animation works)
                                                   and js/m3d/vx_lv2*.js (static props), all lazy (models3d-io.js LAZY), plus their sizes in M3D_LAZY
   NODE_PATH: the packages of tools/build3d.js (three is not needed here). */
const path=require('path'),fs=require('fs');
const M3IO=require('../models3d-io.js');
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=require('@gltf-transform/extensions');
const {MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer');
const {prune,dedup,quantize,textureCompress}=require('@gltf-transform/functions');
const sharp=require('sharp');
const ROOT=path.join(__dirname,'../..'),RAW=path.join(ROOT,'art/village-v2/raw');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const BASE='barbarian';   // the body the smith and innkeeper had: its skeleton (23 KayKit bones) carries the new bodies
const CHARS=['smith','inn'];   // art/village-v2/raw/npc_<id>.glb -> lv2_<id>
const PROPS=['anvil','rack','barrel','bucket','crate','crateS','lumber','fence','banner','pennant','stall','sack','gate'];   // <id>.glb -> vx_lv2_<id>

const all=()=>{const s=M3IO.src(),i=s.indexOf('const MODELS3D=');return {s,i,out:JSON.parse(s.slice(i+15).replace(/;\s*$/,''))}};
// 4x4 column-major helpers
const mul=(a,b)=>{const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o};
function inv(m){const [a00,a01,a02,a03,a10,a11,a12,a13,a20,a21,a22,a23,a30,a31,a32,a33]=m;
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  const d=1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
  return [(a11*b11-a12*b10+a13*b09)*d,(a02*b10-a01*b11-a03*b09)*d,(a31*b05-a32*b04+a33*b03)*d,(a22*b04-a21*b05-a23*b03)*d,(a12*b08-a10*b11-a13*b07)*d,(a00*b11-a02*b08+a03*b07)*d,(a32*b02-a30*b05-a33*b01)*d,(a20*b05-a22*b02+a23*b01)*d,(a10*b10-a11*b08+a13*b06)*d,(a01*b08-a00*b10-a03*b06)*d,(a30*b04-a31*b02+a33*b00)*d,(a21*b02-a20*b04-a23*b00)*d,(a11*b07-a10*b09-a12*b06)*d,(a00*b09-a01*b07+a02*b06)*d,(a31*b01-a30*b03-a32*b00)*d,(a20*b03-a21*b01+a22*b00)*d]}
const app=(m,v)=>[0,1,2].map(r=>m[r]*v[0]+m[4+r]*v[1]+m[8+r]*v[2]+m[12+r]);
const world=n=>{let m=n.getMatrix(),p=n.getParentNode();while(p){m=mul(p.getMatrix(),m);p=p.getParentNode()}return m};
const baseDoc=async()=>io.readBinary(Buffer.from(all().out[BASE],'base64'));

async function rig(){await MeshoptDecoder.ready;
  const doc=await baseDoc(),sk=doc.getRoot().listSkins()[0],J=sk.listJoints(),out={};
  for(const j of J){const W=world(j),kids=j.listChildren().filter(c=>J.includes(c));
    out[j.getName()]={head:app(W,[0,0,0]),x:app(W,[1,0,0]).map((v,i)=>v-W[12+i]),y:app(W,[0,1,0]).map((v,i)=>v-W[12+i]),tail:kids.length?app(world(kids[0]),[0,0,0]):null}}
  fs.mkdirSync(RAW,{recursive:true});fs.writeFileSync(path.join(RAW,'rig.json'),JSON.stringify(out,null,1));
  console.log('rig.json:',Object.keys(out).length,'bones');
}

// one skinned body: every part of the Blender file follows one bone (rigid, like a toy figure). The part's object name starts with the bone name: "chest__apron"
async function packChar(id){
  const doc=await baseDoc(),R=doc.getRoot(),sk=R.listSkins()[0],J=sk.listJoints(),IBM=sk.getInverseBindMatrices();
  const old=R.listNodes().filter(n=>n.getMesh());const host=old.find(n=>n.getSkin())||null,parent=host&&host.getParentNode();
  for(const n of old){const m=n.getMesh();n.dispose();if(m)m.dispose()}
  const src=await io.read(path.join(RAW,'npc_'+id+'.glb')),SR=src.getRoot();
  const P=[],N=[],U=[],JI=[],I=[];let tex=null,lo=1e9,hi=-1e9,tris=0;
  for(const n of SR.listNodes()){const me=n.getMesh();if(!me)continue;
    const bn=n.getName().split('__')[0],ji=J.findIndex(j=>j.getName()===bn);if(ji<0)throw new Error('no bone '+bn+' ('+n.getName()+')');
    const W=world(n),toBind=mul(inv(IBM.getElement(ji,[])),inv(world(J[ji]))),M=mul(toBind,W),Mn=mul(toBind,[W[0],W[1],W[2],0,W[4],W[5],W[6],0,W[8],W[9],W[10],0,0,0,0,1]);
    for(const pr of me.listPrimitives()){const pa=pr.getAttribute('POSITION'),na=pr.getAttribute('NORMAL'),ua=pr.getAttribute('TEXCOORD_0'),ix=pr.getIndices(),b=P.length/3;
      tex=tex||pr.getMaterial().getBaseColorTexture();
      for(let v=0;v<pa.getCount();v++){const w=app(W,pa.getElement(v,[]));lo=Math.min(lo,w[1]);hi=Math.max(hi,w[1]);
        P.push(...app(M,pa.getElement(v,[])));const nn=app(Mn,na.getElement(v,[])),l=Math.hypot(...nn)||1;N.push(...nn.map(x=>x/l));U.push(...ua.getElement(v,[]));JI.push(ji,0,0,0)}
      for(let k=0;k<ix.getCount();k++)I.push(b+ix.getScalar(k));tris+=ix.getCount()/3}}
  const buf=R.listBuffers()[0],acc=(t,a)=>doc.createAccessor().setType(t).setArray(a).setBuffer(buf);
  const img=doc.createTexture('lv2_palette').setImage(tex.getImage()).setMimeType('image/png');
  const mat=doc.createMaterial('lv2_'+id).setBaseColorTexture(img).setRoughnessFactor(1).setMetallicFactor(0);
  mat.getBaseColorTextureInfo().setMagFilter(9728).setMinFilter(9728);   // NEAREST: the palette stays sharp
  const W=new Float32Array(JI.length);for(let k=0;k<W.length;k+=4)W[k]=1;
  const prim=doc.createPrimitive().setAttribute('POSITION',acc('VEC3',new Float32Array(P))).setAttribute('NORMAL',acc('VEC3',new Float32Array(N))).setAttribute('TEXCOORD_0',acc('VEC2',new Float32Array(U)))
    .setAttribute('JOINTS_0',acc('VEC4',new Uint8Array(JI))).setAttribute('WEIGHTS_0',acc('VEC4',W)).setIndices(acc('SCALAR',new Uint16Array(I))).setMaterial(mat);
  const node=doc.createNode('lv2_'+id).setMesh(doc.createMesh('lv2_'+id).addPrimitive(prim)).setSkin(sk);
  (parent||R.listScenes()[0]).addChild(node);
  for(const t of R.listTextures())if(t!==img)t.dispose();for(const m of R.listMaterials())if(m!==mat)m.dispose();
  await doc.transform(prune({keepLeaves:true,keepAttributes:true}),dedup());
  R.listScenes()[0].setExtras({h0:hi-lo});   // the height the game scales by (render3d.js prepTmpl, userData.h0)
  await MeshoptEncoder.ready;await doc.transform(quantize({}));
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  return {b64:Buffer.from(await io.writeBinary(doc)).toString('base64'),tris};
}
async function packProp(id){
  const doc=await io.read(path.join(RAW,id+'.glb')),R=doc.getRoot();
  let tris=0;for(const m of R.listMeshes())for(const p of m.listPrimitives())tris+=p.getIndices().getCount()/3;
  for(const t of R.listTextureInfos?R.listTextureInfos():[])t.setMagFilter(9728).setMinFilter(9728);
  for(const m of R.listMaterials()){m.setMetallicFactor(0).setRoughnessFactor(1);for(const ti of [m.getBaseColorTextureInfo(),m.getEmissiveTextureInfo()])if(ti)ti.setMagFilter(9728).setMinFilter(9728)}
  await doc.transform(prune({keepLeaves:true}),dedup(),textureCompress({encoder:sharp,targetFormat:'png'}));
  await MeshoptEncoder.ready;doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  return {b64:Buffer.from(await io.writeBinary(doc)).toString('base64'),tris};
}
async function pack(){
  await MeshoptDecoder.ready;const {s,i,out}=all(),rep=[];
  for(const id of CHARS){const r=await packChar(id);out['lv2_'+id]=r.b64;rep.push(['lv2_'+id,r.tris,r.b64.length])}
  for(const id of PROPS){if(!fs.existsSync(path.join(RAW,id+'.glb'))){console.log('skip',id);continue}const r=await packProp(id);out['vx_lv2_'+id]=r.b64;rep.push(['vx_lv2_'+id,r.tris,r.b64.length])}
  M3IO.write(null,s.slice(0,i)+'const MODELS3D='+JSON.stringify(out)+';\n');
  for(const [k,t,b] of rep)console.log(k.padEnd(18),'tris',String(t).padStart(5),' KB',(b/1024).toFixed(1));
  console.log('total KB',(rep.reduce((a,r)=>a+r[2],0)/1024).toFixed(1));
}
({rig,pack}[process.argv[2]]||(()=>console.log('usage: node tools/blender/village_v2.js rig|pack')))();
