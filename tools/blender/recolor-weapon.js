// node tools/blender/recolor-weapon.js <weapon.gltf> <out.glb> <#צבע> [--glow=0.6]: עותק של נשק KayKit שבו משבצות המתכת בפלטה (כמו WTIERS ב-build3d.js) צבועות בצבע אחד וזוהרות ב-emissiveMap (ARI, 9.11.2026).
// הגיאומטריה, הצירים והאחיזה נשארים של KayKit. דורש את החבילות של build3d.js (NODE_PATH)
const {NodeIO}=require('@gltf-transform/core'),sharp=require('sharp');
(async()=>{const [src,out,col]=process.argv.slice(2),glow=parseFloat((process.argv.find(a=>a.startsWith('--glow='))||'--glow=0.6').slice(7)),c=[1,3,5].map(i=>parseInt(col.slice(i,i+2),16));
  const io=new NodeIO(),doc=await io.read(src),mat=doc.getRoot().listMaterials()[0],tex=mat.getBaseColorTexture(),N=64,cells=[[1,0],[2,0],[3,0],[5,1],[6,1]];
  const {data}=await sharp(Buffer.from(tex.getImage())).resize(N,N,{kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const px=Buffer.from(data),em=Buffer.alloc(N*N*4);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4,hit=cells.some(([cx,cy])=>Math.floor(x*8/N)===cx&&Math.floor(y*4/N)===cy),L=(0.3*px[i]+0.59*px[i+1]+0.11*px[i+2])/255;
    if(hit){for(let j=0;j<3;j++){px[i+j]=Math.min(255,Math.round(c[j]*(0.5+0.7*L)));em[i+j]=Math.round(px[i+j]*glow)}}em[i+3]=255}
  const png=async b=>new Uint8Array(await sharp(b,{raw:{width:N,height:N,channels:4}}).png().toBuffer());
  tex.setImage(await png(px)).setMimeType('image/png');
  const et=doc.createTexture().setImage(await png(em)).setMimeType('image/png');
  mat.setEmissiveTexture(et).setEmissiveFactor([1,1,1]).setDoubleSided(true).setName('own_palette');
  await io.write(out,doc);console.log('ok',out)})();
