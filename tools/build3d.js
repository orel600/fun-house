/* בונה את הדמויות בתלת-ממד מהחבילות החינמיות של KayKit, ואת three.js, לשני קבצים שהמשחק טוען כרגיל.
   זה לא חלק מהמשחק ולא רץ בבדיקה. מריצים רק כשמוסיפים או מחליפים דמות, אנימציה או נשק.

   1. כל החבילות (CC0, מותר הכל, בלי קרדיט חובה) בתיקייה אחת עם נתיב קצר, למשל C:\kk, אחרת git נכשל בווינדוס על שמות ארוכים.
      שלוש מ-GitHub:
        git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 C:/kk/adv
        git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 C:/kk/skel
        git clone --depth 1 https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0 C:/kk/hex
      ושלוש מ-itch.io (חינם: "No thanks, just take me to the downloads"). פותחים את ה-zip ומשנים את שם התיקייה שבפנים:
        kaylousberg.itch.io/kaykit-adventurers          KayKit_Adventurers_2.0_FREE        -> C:/kk/adv2
        kaylousberg.itch.io/kaykit-character-animations KayKit_Character_Animations_1.1    -> C:/kk/anims
        kaylousberg.itch.io/kaykit-fantasy-weapons-bits KayKit_FantasyWeaponsBits_1.0_FREE -> C:/kk/weapons
      הורדה מ-itch.io בלי דפדפן: ההסבר ב-docs/3d-assets.md, "הערות טכניות".
   2. npm i --no-save three@0.186.1 esbuild @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions sharp
   3. node tools/build3d.js C:/kk

   יוצא: js/vendor/three-bundle.js (three.js בלי import, כי המשחק נפתח גם מ-file://)
          js/models3d.js (כל הדמויות, האנימציות, הנשקים ומבני הכפר, מוטמעים בקובץ JS מאותה סיבה)

   כל הדמויות בחבילות האלה בנויות על אותו שלד: 23 עצמות באותם שמות (בגרסאות 1.0 יש עוד 18 עצמות עזר, שהמשחק מתעלם מהן).
   לכן כל אנימציה עובדת על כל דמות.
   מה נכנס: הטבלאות CHARS, PROPS, WEAPONS, WTIERS, ANIMS ו-BUILDS למטה. דמות או אנימציה חדשה = שורה כאן ושורה ב-js/render3d.js */
const path=require('path'),fs=require('fs');
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {prune,dedup,resample,textureCompress,quantize}=require('@gltf-transform/functions');
const sharp=require('sharp');

const ROOT=path.join(__dirname,'..');
const KK=process.argv[2];
if(!KK){console.log('שימוש: node tools/build3d.js <התיקייה עם כל החבילות, למשל C:/kk>');process.exit(1)}
const adv=p=>path.join(KK,'adv/addons/kaykit_character_pack_adventures',p);
const skel=p=>path.join(KK,'skel/addons/kaykit_character_pack_skeletons',p);
const hex=p=>path.join(KK,'hex/addons/kaykit_medieval_hexagon_pack/Assets/gltf',p);
const adv2=p=>path.join(KK,'adv2',p);
const anim=p=>path.join(KK,'anims/Animations/gltf/Rig_Medium/Rig_Medium_'+p+'.glb');
const weap=p=>path.join(KK,'weapons/Assets/gltf',p);

// דמויות: מאיזה קובץ, ואילו חלקים נשארים (כל השאר, בעיקר נשקים אחרים, נמחק)
const CHARS={
  // דמויות ההתחלה: Adventurers 2.0. הנשק ביד מגיע מהציוד (WEAPONS), לא מהדמות
  knight:  {src:adv2('Characters/gltf/Knight.glb'),     keep:['Knight_']},
  ranger:  {src:adv2('Characters/gltf/Ranger.glb'),     keep:['Ranger_']},
  mage:    {src:adv2('Characters/gltf/Mage.glb'),       keep:['Mage_']},
  // אויבים, בוס ומבוקש: נשארים בגרסה הקודמת, כי הנשק שלהם (גרזן, סכין) הוא חלק מהדמות
  rogue:   {src:adv('Characters/gltf/Rogue_Hooded.glb'),keep:['Rogue_','Knife']},
  barbarian:{src:adv('Characters/gltf/Barbarian.glb'),  keep:['Barbarian_Hat','Barbarian_Cape','Barbarian_Arm','Barbarian_Body','Barbarian_Head','Barbarian_Leg','2H_Axe']},
  minion:  {src:skel('Characters/gltf/Skeleton_Minion.glb'), keep:['Skeleton_']},
  warrior: {src:skel('Characters/gltf/Skeleton_Warrior.glb'),keep:['Skeleton_']},
  skelMage:{src:skel('Characters/gltf/Skeleton_Mage.glb'),   keep:['Skeleton_']},
  // פיילוט ג'מיני: הגיבור מהדף של ניר, על השלד של האביר. נבנה ע"י tools/pilot3d (ההסבר ב-docs/3d-assets.md). הטקסטורה היא הציור עצמו ולא פלטה, אז 512 ו-JPEG
  pilotHero:{src:path.join(ROOT,'art/pilot/PilotHero.glb'),keep:['PilotHero_'],tex:512,fmt:'jpeg'},
  // הדמות האישית של ניר ("הנודד עם הניצוץ"), מ-art/heroes/nir-sheet.jpg. כמו הפיילוט, עם rig.py --apose --pack (ההסבר ב-tools/pilot3d/README.md)
  nirHero:{src:path.join(ROOT,'art/heroes/NirHero.glb'),keep:['NirHero_'],tex:512,fmt:'jpeg'}
};
// חפצים שנאחזים ביד של אויב (המיקום ביד מוגדר ב-render3d.js)
const PROPS={
  blade:   {src:skel('Assets/gltf/Skeleton_Blade.gltf')},
  shield:  {src:skel('Assets/gltf/Skeleton_Shield_Large_A.gltf')},
  staff:   {src:skel('Assets/gltf/Skeleton_Staff.gltf')}
};
/* נשקים (Fantasy Weapons Bits): כל 31 המודלים. השם במשחק: w_<שם הקובץ>, למשל w_sword_A. איזה פריט ציוד הוא איזה מודל: look.model ב-GEAR (gear.js).
   כולם צבועים מאותה טקסטורת פלטה. לכן הטקסטורה בתוך כל נשק זעירה (8), והמשחק מחליף אותה בטקסטורה של החומר (WTIERS) */
const WEAPONS=fs.existsSync(weap(''))?fs.readdirSync(weap('')).filter(f=>f.endsWith('.gltf')).map(f=>f.slice(0,-5)):[];
/* חומרי הנשק: עותק של הפלטה שבו משבצות המתכת (כסוף, אפור פלדה, כחלחל) נצבעות בצבע החומר. ברזל = הפלטה המקורית.
   cells: המשבצות בפלטה (8 עמודות על 4 שורות), [עמודה,שורה]. tiers: הצבע של כל חומר, בערך כמו GEAR.tiers ב-gear.js */
const WTIERS={cells:[[1,0],[2,0],[3,0],[5,1],[6,1]],size:64,
  tiers:{wood:'#A0703F',iron:null,silver:'#E4ECF4',gold:'#F2BE45',legend:'#FF5FB4'}};
/* אנימציות: מ-KayKit Character Animations (שלד Rig_Medium), ומשותפות לכל הדמויות. נכנס רק מה שהמשחק משתמש בו או עומד להשתמש,
   כי כל 10 אנימציות הן בערך 300KB. מחכות למשימות הבאות: התחמקות וחסימה (סקילים), זימון (קוסם), עבודה, ישיבה, נפנוף והליכה (NPC בכפר) */
const ANIMS={
  general:{src:anim('General'),keep:['Idle_A','Idle_B','Hit_A','Death_A']},
  move:   {src:anim('MovementBasic'),keep:['Running_A','Running_B','Walking_A']},
  moveAdv:{src:anim('MovementAdvanced'),keep:['Dodge_Forward','Dodge_Backward','Dodge_Left','Dodge_Right','Running_HoldingBow']},
  melee:  {src:anim('CombatMelee'),keep:['Melee_1H_Attack_Slice_Horizontal','Melee_1H_Attack_Chop','Melee_2H_Attack_Spin','Melee_2H_Attack_Chop','Melee_Block','Melee_Blocking']},
  ranged: {src:anim('CombatRanged'),keep:['Ranged_Bow_Draw','Ranged_Bow_Release','Ranged_Bow_Idle','Ranged_Magic_Shoot','Ranged_Magic_Spellcasting','Ranged_Magic_Summon']},
  life:   {src:anim('Simulation'),keep:['Cheering','Waving','Sit_Chair_Idle','Sit_Floor_Idle']},
  tools:  {src:anim('Tools'),keep:['Hammering','Digging']},
  skel:{src:skel('Characters/gltf/Skeleton_Minion.glb'),keep:['Walking_D_Skeletons','Running_C','Hit_B','Death_C_Skeletons','Spawn_Ground_Skeletons','1H_Melee_Attack_Chop','Spellcasting','Idle_Combat','Taunt']}
};
// מבני הכפר וקישוטים (Medieval Hexagon). המפתח מתחיל ב-v_, ומי משתמש במה: VIL3D ב-js/render3d.js
const BUILDS={
  v_castle:{src:hex('buildings/blue/building_castle_blue.gltf')},
  v_forge: {src:hex('buildings/blue/building_blacksmith_blue.gltf')},
  v_mill:  {src:hex('buildings/blue/building_lumbermill_blue.gltf')},
  v_mine:  {src:hex('buildings/blue/building_mine_blue.gltf')},
  v_market:{src:hex('buildings/blue/building_market_blue.gltf')},
  v_site:  {src:hex('buildings/neutral/building_scaffolding.gltf')},
  v_gate:  {src:hex('buildings/neutral/wall_straight_gate.gltf')},
  v_treeA: {src:hex('decoration/nature/tree_single_A.gltf')},
  v_treeB: {src:hex('decoration/nature/tree_single_B.gltf')},
  v_hills: {src:hex('decoration/nature/hills_A_trees.gltf')},
  v_rock:  {src:hex('decoration/nature/rock_single_C.gltf')},
  v_lumber:{src:hex('decoration/props/resource_lumber.gltf')},
  v_stone: {src:hex('decoration/props/resource_stone.gltf')},
  v_flag:  {src:hex('decoration/props/flag_blue.gltf')},
  v_tent:  {src:hex('decoration/props/tent.gltf')},
  v_crate: {src:hex('decoration/props/crate_A_big.gltf')},
  v_barrel:{src:hex('decoration/props/barrel.gltf')}
};
const TEX=256;   // גודל הטקסטורה. החבילות משתמשות בפלטת צבעים, אז 256 נראה כמו 1024

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
async function slim(doc,{keepMeshes,keepAnims,tex=TEX,fmt='png',q=false}){
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
    textureCompress({encoder:sharp,targetFormat:fmt,resize:[tex,tex]}),...(q?[quantize()]:[]));   // q: מיקומים במספרים שלמים קטנים, חצי משקל. רק לחפצים בלי שלד
  return io.writeBinary(doc);
}

(async()=>{
  const out={},sizes=[];
  const add=(k,bin)=>{out[k]=Buffer.from(bin).toString('base64');sizes.push(k+' '+Math.round(bin.byteLength/1024)+'KB')};
  for(const [k,c] of Object.entries(CHARS))add(k,await slim(await io.read(c.src),{keepMeshes:c.keep,tex:c.tex,fmt:c.fmt}));
  for(const [k,c] of Object.entries(PROPS))add(k,await slim(await io.read(c.src),{}));
  if(WEAPONS.length<31)throw new Error('חסרים נשקים ב-'+weap('')+': נמצאו '+WEAPONS.length);
  for(const w of WEAPONS)add('w_'+w,await slim(await io.read(weap(w+'.gltf')),{tex:8,q:true}));
  // טקסטורה לכל חומר (השם במשחק: wtex_<חומר>). תמונת PNG, לא מודל
  const N=WTIERS.size,{data}=await sharp(weap('weapons_bits_texture.png')).resize(N,N).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(const [t,col] of Object.entries(WTIERS.tiers)){
    const px=Buffer.from(data),c=col&&[1,3,5].map(i=>parseInt(col.slice(i,i+2),16));
    if(c)for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      if(!WTIERS.cells.some(([cx,cy])=>Math.floor(x*8/N)===cx&&Math.floor(y*4/N)===cy))continue;
      const i=(y*N+x)*4,L=(0.3*px[i]+0.59*px[i+1]+0.11*px[i+2])/255;   // הבהירות המקורית נשמרת, אז המעבר בתוך המשבצת נשאר
      for(let j=0;j<3;j++)px[i+j]=Math.min(255,Math.round(c[j]*(0.35+0.85*L)))}
    add('wtex_'+t,await sharp(px,{raw:{width:N,height:N,channels:4}}).png().toBuffer());
  }
  for(const [k,c] of Object.entries(BUILDS))add(k,await slim(await io.read(c.src),{}));
  for(const [k,c] of Object.entries(ANIMS)){
    const doc=await io.read(c.src),miss=c.keep.filter(n=>!doc.getRoot().listAnimations().some(a=>a.getName()===n));
    if(miss.length)throw new Error('אנימציה חסרה ב-'+k+': '+miss.join(', '));
    add('anim_'+k,await slim(doc,{keepMeshes:null,keepAnims:c.keep}));
  }
  const head='/* נוצר אוטומטית ע"י tools/build3d.js. לא עורכים ביד.\n   דמויות, אנימציות, נשקים ומבנים: KayKit Adventurers, Skeletons, Character Animations, Fantasy Weapons Bits ו-Medieval Hexagon מאת Kay Lousberg (www.kaylousberg.com), רישיון CC0.\n   מוטמעות כאן כטקסט ולא כקבצים, כי המשחק נפתח גם מ-file:// ושם הדפדפן לא טוען קבצים לבד */\n';
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
