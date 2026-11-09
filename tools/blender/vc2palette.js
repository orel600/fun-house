// ממיר GLB בצבעי קודקודים (COLOR_0, בלי חומר ובלי נורמלים: טיוטה שנבנתה בקוד) לפורמט של פריט מוכן ב-build3d.js (ready:true):
// חומר own_palette עם טקסטורת פלטה ו-emissiveMap, נורמלים שטוחים, והצירים והאחיזה של KayKit. render3d.js לא מעתיק צבעי קודקודים (lambert), ולכן בלי ההמרה הפריט יוצא לבן.
// שימוש: node tools/blender/vc2palette.js <in.glb> <out.glb> [--rotx=-90] [--scale=1] [--shift=x,y,z] [--glow=r,g,b;r,g,b]
//   --rotx   סיבוב סביב x (מעלות) לפני ההזזה: z של הטיוטה (ידית זקופה) הופך ל-y של KayKit בעזרת -90
//   --shift  הזזה אחרי הסיבוב (לפני הקנה מידה): כך נקודת האחיזה נופלת בראשית. --scale אחרי ההזזה
//   --glow   הצבעים (כפי שהם ב-COLOR_0, 0..1) שזוהרים ב-emissiveMap (לבה, אבן חן, סמל השמש)
// דורש את החבילות של build3d.js (NODE_PATH). הערכים ב-COLOR_0 נלקחים כצבעי sRGB כמו שהאמן ראה אותם בתצוגה.
const {NodeIO,Document}=require('@gltf-transform/core'),sharp=require('sharp');
const arg=n=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?a.slice(n.length+3):null};
(async()=>{
  const [inp,out]=process.argv.slice(2),io=new NodeIO(),src=await io.read(inp);
  const rx=(parseFloat(arg('rotx')||'0'))*Math.PI/180,sc=parseFloat(arg('scale')||'1'),sh=(arg('shift')||'0,0,0').split(',').map(Number);
  const glow=(arg('glow')||'').split(';').filter(Boolean).map(s=>s.split(',').map(Number));
  const P=[],C=[];
  for(const m of src.getRoot().listMeshes())for(const p of m.listPrimitives()){
    const a=p.getAttribute('POSITION'),c=p.getAttribute('COLOR_0'),ix=p.getIndices();const n=ix?ix.getCount():a.getCount();
    for(let i=0;i<n;i++){const j=ix?ix.getScalar(i):i;P.push(a.getElement(j,[]));C.push(c.getElement(j,[]).slice(0,3))}}
  // סיבוב, הזזה, קנה מידה
  const cs=Math.cos(rx),sn=Math.sin(rx);
  const V=P.map(([x,y,z])=>{const y2=y*cs-z*sn,z2=y*sn+z*cs;return [(x+sh[0])*sc,(y2+sh[1])*sc,(z2+sh[2])*sc]});
  // פלטה: צבע ייחודי = משבצת של 8x8 בטקסטורה של 64x64 (8x8 משבצות)
  const keys=[...new Set(C.map(c=>c.map(v=>v.toFixed(2)).join(',')))];if(keys.length>64)throw new Error('יותר מ-64 צבעים');
  const idx=new Map(keys.map((k,i)=>[k,i])),pal=Buffer.alloc(64*64*4),em=Buffer.alloc(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const cell=(y>>3)*8+(x>>3),k=keys[Math.min(cell,keys.length-1)],v=k.split(',').map(Number),o=(y*64+x)*4;
    for(let i=0;i<3;i++){pal[o+i]=Math.round(v[i]*255);em[o+i]=glow.some(g=>g.every((q,i2)=>Math.abs(q-v[i2])<0.011))?pal[o+i]:0}pal[o+3]=255;em[o+3]=255}
  const uv=C.map(c=>{const cell=idx.get(c.map(v=>v.toFixed(2)).join(','));return [((cell%8)*8+4)/64,((cell>>3)*8+4)/64]});
  // נורמלים שטוחים לכל משולש
  const N=[];for(let i=0;i<V.length;i+=3){const [a,b,c]=[V[i],V[i+1],V[i+2]],u=b.map((q,k)=>q-a[k]),w=c.map((q,k)=>q-a[k]);
    let n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const l=Math.hypot(...n)||1;n=n.map(q=>q/l);N.push(n,n,n)}
  const doc=new Document(),buf=doc.createBuffer(),name=require('path').basename(out,'.glb');
  const acc=(arr,type,Cls)=>doc.createAccessor().setType(type).setArray(Cls.from(arr.flat())).setBuffer(buf);
  const tex=async(b)=>doc.createTexture().setImage(new Uint8Array(await sharp(b,{raw:{width:64,height:64,channels:4}}).png().toBuffer())).setMimeType('image/png');
  const mat=doc.createMaterial('own_palette').setBaseColorTexture(await tex(pal)).setEmissiveTexture(await tex(em)).setEmissiveFactor([1,1,1]).setMetallicFactor(0).setRoughnessFactor(0.9).setDoubleSided(true);
  const prim=doc.createPrimitive().setAttribute('POSITION',acc(V,'VEC3',Float32Array)).setAttribute('NORMAL',acc(N,'VEC3',Float32Array)).setAttribute('TEXCOORD_0',acc(uv,'VEC2',Float32Array)).setMaterial(mat);
  const mesh=doc.createMesh(name).addPrimitive(prim),node=doc.createNode(name).setMesh(mesh);doc.createScene().addChild(node);
  await io.write(out,doc);
  let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const v of V)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],v[i]);hi[i]=Math.max(hi[i],v[i])}
  console.log(name,'tris',V.length/3,'colors',keys.length,'glow cells',glow.length,'bbox lo',lo.map(x=>+x.toFixed(3)),'hi',hi.map(x=>+x.toFixed(3)))})();
