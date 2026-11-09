/* קליפים של KayKit שחסרו לגיבורי השאול (השיפוץ, BOB, 10.11.2026): לוקח רק את האנימציות שבטבלה OUT מחבילות Rig_Medium (בבעלותנו, C:/kk),
   בלי מודל, ועם אותו סינון כמו addClips במשחק (סיבובים, ותזוזה רק לאגן ולירכיים), וכותב js/m3d/<מפתח>.js שנטען לפי צורך.
   הרצה: NODE_PATH=<תיקייה עם @gltf-transform> node tools/mb-anims.js .   ואז הגודל (base64) ב-M3D_LAZY ב-js/models3d.js */
const fs=require('fs'),path=require('path');const root=process.argv[2];
const {NodeIO}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');const {prune,resample}=require('@gltf-transform/functions');
const KK='C:/kk/anims/Animations/gltf/Rig_Medium/';
const OUT={
  anim_mbx_gen:{src:KK+'Rig_Medium_General.glb',keep:['Throw']},
  anim_mbx_ranged:{src:KK+'Rig_Medium_CombatRanged.glb',keep:['Ranged_Bow_Draw_Up','Ranged_Bow_Release_Up','Ranged_Magic_Raise']},
  anim_mbx_move:{src:KK+'Rig_Medium_MovementAdvanced.glb',keep:['Crouching','Sneaking']}
};
(async()=>{const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const sizes={};
for(const [k,c] of Object.entries(OUT)){
  const doc=await io.read(c.src),R=doc.getRoot();
  for(const a of R.listAnimations())if(!c.keep.includes(a.getName())){for(const x of a.listChannels())x.dispose();for(const x of a.listSamplers())x.dispose();a.dispose()}
  const got=R.listAnimations().map(a=>a.getName());if(got.length!==c.keep.length)throw k+': got '+got.join(',');
  // the same filter addClips applies in the game: rotations of body bones, translation only on root/hips/upperleg; no IK/control, no scale
  for(const a of R.listAnimations())for(const ch of a.listChannels()){const n=ch.getTargetNode(),nm=n?n.getName():'',p=ch.getTargetPath(),keep=n&&!/IK|control/i.test(nm)&&(p==='rotation'||p==='translation'&&/^(root|hips|upperleg)/i.test(nm.replace(/[._]/g,'')));if(!keep){const smp=ch.getSampler();ch.dispose();if(smp&&!smp.listParents().some(x=>x.propertyType==='AnimationChannel'))smp.dispose()}}
  for(const n of R.listNodes()){if(n.getMesh())n.setMesh(null);if(n.getSkin())n.setSkin(null)}
  for(const m of R.listMeshes())m.dispose();for(const s of R.listSkins())s.dispose();
  await doc.transform(resample({tolerance:1e-4}),prune());
  const bin=await io.writeBinary(doc),b64=Buffer.from(bin).toString('base64');
  fs.writeFileSync(path.join(root,'js/m3d',k+'.js'),'m3dPut("'+k+'","'+b64+'");\n');sizes[k]=b64.length;console.log(k,got.join(','),Math.round(bin.byteLength/1024)+'KB')}
console.log(JSON.stringify(sizes))})().catch(e=>{console.error(e);process.exit(1)});
