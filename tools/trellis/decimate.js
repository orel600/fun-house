// node decimate.js <TRELLIS.glb> <out.glb> [משולשים=6000]: מכווץ מודל TRELLIS (meshopt, ה-UV נשארים). מדפיס כמה משולשים היו וכמה נשארו
const {NodeIO}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {weld,simplify,prune}=require('@gltf-transform/functions');const {MeshoptSimplifier}=require('meshoptimizer');
(async()=>{await MeshoptSimplifier.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),d=await io.read(process.argv[2]),want=+(process.argv[4]||6000);
const cnt=()=>d.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((a,p)=>a+(p.getIndices()?p.getIndices().getCount():p.getAttribute('POSITION').getCount())/3,0);
const n0=cnt();await d.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:want/n0,error:0.01}),prune());await io.write(process.argv[3],d);console.log('tris',n0,'->',cnt())})();
