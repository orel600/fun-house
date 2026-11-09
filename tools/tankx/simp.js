// node simp.js in.glb out.glb targetTris [tex]: weld + meshopt simplify (skin-safe) + texture resize, uncompressed GLB master
const sharp=require('sharp'),{NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),F=require('@gltf-transform/functions'),{MeshoptSimplifier}=require('meshoptimizer');
(async()=>{await MeshoptSimplifier.ready;const [fin,fout,tgt,tex]=process.argv.slice(2);const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),d=await io.read(fin);
 const tris=()=>d.getRoot().listMeshes().reduce((s,m)=>s+m.listPrimitives().reduce((a,p)=>a+p.getIndices().getCount()/3,0),0);
 await d.transform(F.weld({tolerance:1e-5}));const t0=tris();if(+tgt&&t0>+tgt)await d.transform(F.simplify({simplifier:MeshoptSimplifier,ratio:+tgt/t0,error:+process.env.ERR||0.02,lockBorder:false}));
 if(tex)await d.transform(F.textureCompress({encoder:sharp,targetFormat:'jpeg',resize:[+tex,+tex]}));await d.transform(F.prune());
 await io.write(fout,d);console.log(fout,'tris',t0,'->',tris())})();
