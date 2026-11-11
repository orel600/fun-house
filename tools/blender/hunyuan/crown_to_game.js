/* הכתר מהפיילוט (art/pilot/hunyuan-crown/crown_hunyuan_600.glb) נכנס למשחק ככובע: hat_crown ב-js/models3d.js (ARMOR.crown ב-js/armor.js).
   הכתר כבר בגודל, בצירים ובפלטה (to_game.py): בסיס הטבעת ב-y=0, רוחב 1. כאן רק מחברים כפילויות, דוחסים (quantize ו-meshopt, כמו שאר המודלים)
   ושמים אותו בקובץ, בשם hat_crown עם חלק אחד בשם crown. המיקום על הראש: ARMOR.hat.ref.crown.
   npm i --no-save @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions meshoptimizer
   node tools/blender/hunyuan/crown_to_game.js */
const path=require('path'),fs=require('fs');
const ROOT=path.join(__dirname,'../../..'),M3IO=require(path.join(ROOT,'tools/models3d-io.js'));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS,EXTMeshoptCompression}=require('@gltf-transform/extensions');
const {weld,quantize,prune,dedup}=require('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer');
(async()=>{
  await MeshoptEncoder.ready;
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
  const doc=await io.read(path.join(ROOT,'art/pilot/hunyuan-crown/crown_hunyuan_600.glb')),root=doc.getRoot();
  const mesh=root.listMeshes()[0];mesh.setName('crown');
  for(const n of root.listNodes())n.dispose();
  const sc=root.listScenes()[0]||doc.createScene();sc.setName('crown');for(const c of sc.listChildren())sc.removeChild(c);
  const top=doc.createNode('hat_crown');top.addChild(doc.createNode('crown').setMesh(mesh));sc.addChild(top);root.setDefaultScene(sc);
  await doc.transform(prune(),dedup(),weld(),quantize());
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  const bin=await io.writeBinary(doc);
  const s=M3IO.src(),i=s.indexOf('const MODELS3D='),out=JSON.parse(s.slice(i+15).replace(/;\s*$/,''));
  out.hat_crown=Buffer.from(bin).toString('base64');
  M3IO.write(null,s.slice(0,i)+'const MODELS3D='+JSON.stringify(out)+';\n');
  console.log('hat_crown',Math.round(bin.byteLength/1024)+'KB (base64 '+Math.round(out.hat_crown.length/1024)+'KB)');
})();
