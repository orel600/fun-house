/* בונה את הדמויות בתלת-ממד מהחבילות החינמיות של KayKit, ואת three.js, לשני קבצים שהמשחק טוען כרגיל.
   זה לא חלק מהמשחק ולא רץ בבדיקה. מריצים רק כשמוסיפים או מחליפים דמות או אנימציה.

   1. מורידים את שתי החבילות (CC0, מותר הכל, בלי קרדיט חובה):
      git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 ../kaykit-adv
      git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 ../kaykit-skel
   2. npm i --no-save three@0.186.1 esbuild @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions sharp
   3. node tools/build3d.js ../kaykit-adv ../kaykit-skel

   יוצא: js/vendor/three-bundle.js (three.js בלי import, כי המשחק נפתח גם מ-file://)
          js/models3d.js (כל הדמויות והאנימציות, מוטמעות בקובץ JS מאותה סיבה)

   כל הדמויות בחבילות האלה בנויות על אותו שלד (41 עצמות באותם שמות), ולכן אנימציה אחת עובדת על כולן.
   מה נכנס: הטבלאות CHARS, PROPS ו-ANIMS למטה. דמות או אנימציה חדשה = שורה חדשה כאן ובטבלה ב-js/render3d.js */
const path=require('path'),fs=require('fs');
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {prune,dedup,resample,textureCompress}=require('@gltf-transform/functions');
const sharp=require('sharp');

const [advDir,skelDir]=process.argv.slice(2);
if(!advDir||!skelDir){console.log('שימוש: node tools/build3d.js <תיקיית Adventurers> <תיקיית Skeletons>');process.exit(1)}
const adv=p=>path.join(advDir,'addons/kaykit_character_pack_adventures',p);
const skel=p=>path.join(skelDir,'addons/kaykit_character_pack_skeletons',p);
const ROOT=path.join(__dirname,'..');

// דמויות: מאיזה קובץ, ואילו חלקים נשארים (כל השאר, בעיקר נשקים אחרים, נמחק)
const CHARS={
  knight:  {src:adv('Characters/gltf/Knight.glb'),      keep:['Knight_','1H_Sword']},
  rogue:   {src:adv('Characters/gltf/Rogue_Hooded.glb'),keep:['Rogue_','Knife']},
  barbarian:{src:adv('Characters/gltf/Barbarian.glb'),  keep:['Barbarian_Hat','Barbarian_Cape','Barbarian_Arm','Barbarian_Body','Barbarian_Head','Barbarian_Leg','2H_Axe']},
  minion:  {src:skel('Characters/gltf/Skeleton_Minion.glb'), keep:['Skeleton_']},
  warrior: {src:skel('Characters/gltf/Skeleton_Warrior.glb'),keep:['Skeleton_']},
  mage:    {src:skel('Characters/gltf/Skeleton_Mage.glb'),   keep:['Skeleton_']}
};
// חפצים שנאחזים ביד של דמות (המיקום ביד מוגדר ב-render3d.js)
const PROPS={
  crossbow:{src:adv('Assets/gltf/crossbow_1handed.gltf')},
  blade:   {src:skel('Assets/gltf/Skeleton_Blade.gltf')},
  shield:  {src:skel('Assets/gltf/Skeleton_Shield_Large_A.gltf')},
  staff:   {src:skel('Assets/gltf/Skeleton_Staff.gltf')}
};
// אנימציות: נלקחות מדמות אחת לכל חבילה ומשותפות לכולן
const ANIMS={
  hero:{src:adv('Characters/gltf/Knight.glb'),keep:['Idle','Running_A','Running_B','1H_Melee_Attack_Slice_Horizontal','1H_Ranged_Shoot','Hit_A','Death_A','Cheer','2H_Melee_Attack_Spin','2H_Melee_Attack_Chop']},
  skel:{src:skel('Characters/gltf/Skeleton_Minion.glb'),keep:['Walking_D_Skeletons','Running_C','Hit_B','Death_C_Skeletons','Spawn_Ground_Skeletons','1H_Melee_Attack_Chop','Spellcasting','Idle_Combat','Taunt']}
};
const TEX=256;   // גודל הטקסטורה. החבילות משתמשות בפלטת צבעים, אז 256 נראה כמו 1024

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
async function slim(doc,{keepMeshes,keepAnims}){
  const root=doc.getRoot();
  for(const a of root.listAnimations())if(!keepAnims||!keepAnims.includes(a.getName())){a.listChannels().forEach(c=>c.dispose());a.listSamplers().forEach(x=>x.dispose());a.dispose()}
  if(keepMeshes!==undefined)for(const n of root.listNodes()){
    if(!n.getMesh())continue;
    if(!keepMeshes||!keepMeshes.some(k=>n.getName().startsWith(k))||/Offhand/.test(n.getName())){   // נשקים ליד השנייה לא נכנסים
n.getMesh().dispose();n.dispose()}
  }
  if(keepAnims)for(const s of root.listSkins())s.dispose();
  // אחרי מחיקת אנימציות נשארים נתונים יתומים שהן השתמשו בהם
  for(const a of root.listAccessors())if(a.listParents().every(p=>p===root||p.isDisposed?.()))a.dispose();
  await doc.transform(prune({keepLeaves:true,keepAttributes:false}),dedup(),resample({tolerance:0.004}),
    textureCompress({encoder:sharp,targetFormat:'png',resize:[TEX,TEX]}));
  return io.writeBinary(doc);
}

(async()=>{
  const out={},sizes=[];
  const add=(k,bin)=>{out[k]=Buffer.from(bin).toString('base64');sizes.push(k+' '+Math.round(bin.byteLength/1024)+'KB')};
  for(const [k,c] of Object.entries(CHARS))add(k,await slim(await io.read(c.src),{keepMeshes:c.keep}));
  for(const [k,c] of Object.entries(PROPS))add(k,await slim(await io.read(c.src),{}));
  for(const [k,c] of Object.entries(ANIMS)){
    const doc=await io.read(c.src),miss=c.keep.filter(n=>!doc.getRoot().listAnimations().some(a=>a.getName()===n));
    if(miss.length)throw new Error('אנימציה חסרה ב-'+k+': '+miss.join(', '));
    add('anim_'+k,await slim(doc,{keepMeshes:null,keepAnims:c.keep}));
  }
  const head='/* נוצר אוטומטית ע"י tools/build3d.js. לא עורכים ביד.\n   דמויות ואנימציות: KayKit Adventurers ו-Skeletons מאת Kay Lousberg (www.kaylousberg.com), רישיון CC0.\n   מוטמעות כאן כטקסט ולא כקבצים, כי המשחק נפתח גם מ-file:// ושם הדפדפן לא טוען קבצים לבד */\n';
  fs.writeFileSync(path.join(ROOT,'js/models3d.js'),head+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');

  // three.js בלי import: חבילה אחת שמגדירה את THREE גלובלי
  const entry=path.join(__dirname,'.three-entry.js');
  fs.writeFileSync(entry,"import * as T from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';window.THREE=Object.assign({},T,{GLTFLoader,SkeletonUtils,mergeGeometries});");
  fs.mkdirSync(path.join(ROOT,'js/vendor'),{recursive:true});
  await require('esbuild').build({entryPoints:[entry],bundle:true,minify:true,format:'iife',outfile:path.join(ROOT,'js/vendor/three-bundle.js'),nodePaths:(process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean),
    banner:{js:'/* three.js r'+require("three").REVISION+' (MIT, three.js authors) + GLTFLoader, SkeletonUtils, mergeGeometries. נוצר ע"י tools/build3d.js */'},logLevel:'warning'});
  fs.unlinkSync(entry);
  console.log(sizes.join('\n'));
  for(const f of ['js/models3d.js','js/vendor/three-bundle.js'])console.log(f,Math.round(fs.statSync(path.join(ROOT,f)).size/1024)+'KB');
})().catch(e=>{console.error(e);process.exit(1)});
