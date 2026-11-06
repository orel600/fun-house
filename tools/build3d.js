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
      ואחת מ-Poly Pizza, השלד והאנימציות של חיית המחמד: Husky של Quaternius (CC0), poly.pizza/m/wcWiuEqwzq
        curl -L -o C:/kk/dog/Husky.glb https://static.poly.pizza/611d25c7-430f-4bb5-ab2c-d8f5f3cb9712.glb
        python tools/pet3d/dogclips.py   (מוסיף ישיבה וחפירה, ויוצא C:/kk/dog/DogAnims.glb)
   2. npm i --no-save three@0.186.1 esbuild @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions sharp meshoptimizer
   3. node tools/build3d.js C:/kk

   יוצא: js/vendor/three-bundle.js (three.js בלי import, כי המשחק נפתח גם מ-file://)
          js/models3d.js (כל הדמויות, האנימציות, הנשקים ומבני הכפר, מוטמעים בקובץ JS מאותה סיבה)

   כל הדמויות בחבילות האלה בנויות על אותו שלד: 23 עצמות באותם שמות (בגרסאות 1.0 יש עוד 18 עצמות עזר, שהמשחק מתעלם מהן).
   לכן כל אנימציה עובדת על כל דמות.
   מה נכנס: הטבלאות CHARS, PROPS, WEAPONS, WTIERS, ANIMS, BUILDS, NATURE ו-MONSTERS למטה. דמות או אנימציה חדשה = שורה כאן ושורה ב-js/render3d.js */
const path=require('path'),fs=require('fs');
const {NodeIO}=require('@gltf-transform/core');
const {ALL_EXTENSIONS,EXTMeshoptCompression}=require('@gltf-transform/extensions');
const {MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer');
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
  // חיית המחמד: פיוחו בשלושה שלבים, מהדפים ב-art/pets, על השלד של ההאסקי (tools/pet3d, ההסבר בראש rig.py). בשלב 3 גם טקסטורת זוהר
  piocho1:{src:path.join(ROOT,'art/pets/Piocho1.glb'),keep:['Piocho1_'],tex:512,fmt:'jpeg'},
  piocho2:{src:path.join(ROOT,'art/pets/Piocho2.glb'),keep:['Piocho2_'],tex:512,fmt:'jpeg'},
  piocho3:{src:path.join(ROOT,'art/pets/Piocho3.glb'),keep:['Piocho3_'],tex:512,fmt:'jpeg'},
  parosh1:{src:path.join(ROOT,'art/pets/ParoshHF.glb'),keep:['Parosh1_'],tex:512,fmt:'jpeg'},   // הפרעוש של אוראל (parosh.js), אותו מודל לשלושת השלבים
  // הדמות האישית של ניר ("הנודד עם הניצוץ"), מ-art/heroes/nir-sheet.jpg. כמו הפיילוט, עם rig.py --apose --pack (ההסבר ב-tools/pilot3d/README.md)
  nirHero:{src:path.join(ROOT,'art/heroes/NirHero.glb'),keep:['NirHero_'],tex:512,fmt:'jpeg'},
  // הדמות האישית של אוראל ("הנודד עם החליל"), מ-art/heroes/orel-sheet.jpg. בתנוחת T, אז rig.py בלי דגלים.
  // הדף מורכב משני דפים של ג'מיני: מלפנים ומאחור מהראשון (חד), ומהצד מהשני (בראשון היו פנים כפולות), מוגדל לאותו גובה והפוך כך שיפנה ימינה
  orelHero:{src:path.join(ROOT,'art/heroes/OrelHeroHF.glb'),keep:['OrelHero_'],tex:512,fmt:'jpeg'}
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
  // חיות מחמד (שלד ההאסקי, לא Rig_Medium): הליכה, דהירה, עמידה, ישיבה, חפירה, תקיפה וקפיצה. השמות מתחילים ב-dog_
  dog:{src:path.join(KK,'dog/DogAnims.glb'),keep:['dog_Idle','dog_Walk','dog_Gallop','dog_Sit','dog_Dig','dog_Attack','dog_Gallop_Jump']},
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
// טבע לכל אזור בעולם (KayKit Forest Nature Pack 1.0 FREE, CC0): עצים, עצים חשופים, סלעים, שיחים ועשב. המפתח מתחיל ב-n_, ומי משתמש במה: W3D.decor ב-js/render3d.js
//   kaylousberg.itch.io/kaykit-forest  KayKit_Forest_Nature_Pack_1.0_FREE -> C:/kk/forest
const forest=p=>path.join(KK,'forest/Assets/gltf',p+'_Color1.gltf');
const NATURE={
  n_tree: {src:forest('Tree_1_A')},        // עץ עגול (עצי האגם)
  n_acacia:{src:forest('Tree_3_A')},       // עץ עם צמרת שטוחה (מדבר)
  n_pine: {src:forest('Tree_4_A')},        // אורן (רכס)
  n_bare: {src:forest('Tree_Bare_1_A')},   // עץ חשוף ועבה (לב הצל)
  n_dead: {src:forest('Tree_Bare_2_A')},   // עץ מת וגבוה (מדבר, סערה)
  n_block:{src:forest('Rock_1_A')},        // סלע מדרגות (מגדלי הסערה)
  n_crag: {src:forest('Rock_2_A')},        // סלע זוויתי (רכס, מדבר)
  n_round:{src:forest('Rock_3_A')},        // סלע עגול (אגם, לב הצל)
  n_bush: {src:forest('Bush_1_A')}         // שיח
};
/* מפלצות (Quaternius Ultimate Monsters, CC0): לכל מפלצת שלד ואנימציות משלה, לא השלד של KayKit.
   המודל נכנס כ-mon_<שם>, והאנימציות שלו כ-anim_mon_<שם>, בשמות mon_<שם>_<אנימציה> (למשל mon_slime_Walk), כדי ש-Walk של אחת לא ידרוס את של השנייה.
   מי משתמש באיזו אנימציה: LOOK3D ב-js/render3d.js. האויבים עצמם: ETYPES ב-js/data.js.
   מאיפה: quaternius.com/packs/ultimatemonsters.html (Google Drive), או עותק CC0 ב-GitHub (github.com/mlflabs/brain, "assets/Ultimate Monsters").
   התיקייה "Ultimate Monsters" -> C:/kk/monsters. tex: הטקסטורה היא פלטת צבעים (32 בקטנות, 1024 בגדולות), אז מספיק קטן */
const mon=(cat,name)=>path.join(KK,'monsters',cat,'glTF',name+'.gltf');
const MONSTERS={   // anims: רק מה שאויב מנגן (תנועה ומוות). כל אנימציה של מפלצת גדולה היא בערך 25KB
  slime:  {src:mon('Blob','GreenBlob'),anims:['Walk','Death'],tex:32},
  mushnub:{src:mon('Blob','Mushnub'),anims:['Walk','Death'],tex:32},
  goleling:{src:mon('Flying','Goleling'),anims:['Fast_Flying','Death'],tex:32},
  ghost:  {src:mon('Flying','Ghost_Skull'),anims:['Fast_Flying','Death'],tex:32},
  // ייתי ושד: גם הבוסים הענקיים של הרכס ושל לב הצל (giant.js), אז גם עמידה ומכה
  yeti:   {src:mon('Big','Yeti'),anims:['Walk','Death','Idle','Punch'],tex:128},
  demon:  {src:mon('Big','Demon'),anims:['Walk','Death','Idle','Punch'],tex:128},
  // הבוסים הענקיים בעולם (giant.js, LOOK3D.wb_*): ענק אבן לאחו, איש-דג לאגם, דרקון למדבר ויצור סערה למגדלים. כל אחד עד 7,500 משולשים
  stoneGiant:{src:mon('Big','BlueDemon'),anims:['Walk','Death','Idle','Punch'],tex:128,stone:'#B8A68A'},   // stone: הטקסטורה נצבעת לגוון אחד (אבן), והבהירות נשארת
  fishGiant: {src:mon('Big','Fish'),anims:['Walk','Death','Idle','Punch'],tex:128},
  dragon:    {src:mon('Flying','Dragon_Evolved'),anims:['Fast_Flying','Death','Flying_Idle','Punch'],tex:128},
  hywirl:    {src:mon('Flying','Hywirl'),anims:['Fast_Flying','Death','Flying_Idle','Punch'],tex:128}
};
async function addMonsters(add){
  for(const [k,c] of Object.entries(MONSTERS)){
    const md=await io.read(c.src);
    if(c.stone)for(const t of md.getRoot().listTextures())t.setImage(await sharp(Buffer.from(t.getImage())).tint(c.stone).png().toBuffer()).setMimeType('image/png');
    add('mon_'+k,await slim(md,{tex:c.tex}));
    const doc=await io.read(c.src),all=doc.getRoot().listAnimations(),miss=c.anims.filter(n=>!all.some(a=>a.getName()===n));
    if(miss.length)throw new Error('אנימציה חסרה ב-'+k+': '+miss.join(', '));
    for(const a of all)a.setName('mon_'+k+'_'+a.getName());
    add('anim_mon_'+k,await slim(doc,{keepMeshes:null,keepAnims:c.anims.map(n=>'mon_'+k+'_'+n)}));
  }
}
/* חפצים עם מודל משלהם (מחולל תלת-ממד מתמונה, TRELLIS ב-Hugging Face; ההסבר ב-docs/refs/item-models/README.md).
   המפתח במשחק: w_item_<id>, ו-look.model של הפריט ב-gear.js מצביע עליו. הטקסטורה שלהם היא הציור עצמו, ולכן render3d לא מחליף אותה בחומר (wtex).
   הקובץ הגולמי ב-art/weapons/raw, ומה שנכנס למשחק מוקטן: tris משולשים וטקסטורה tex. כאן גם מסובבים ומגדילים כמו נשקי KayKit:
   TRELLIS בונה מתמונה זקופה: האורך ב-y. הרוחב שבתמונה יוצא לפעמים ב-z (להב הדרקון, קשת הסערה) ולפעמים ב-x (קשת השמיים, המגנים), אז בודקים כל קובץ. len: האורך (y) אחרי ההגדלה, grip: איפה הידית, חלק מהאורך מלמטה (היא עוברת לראשית),
   rot: סיבוב במעלות סביב x, y ו-z, בסדר הזה, כדי שהחפץ ישב כמו המקביל שלו ב-KayKit:
     חרב ומטה: זקופים, הרוחב ב-x (rot [0,90,0]). חרב KayKit בערך 3.25 אורך והידית ב-13%, מטה 2.3 והידית ב-37%.
     קשת: שוכבת, האורך ב-x והקשת ב-z, הידית באמצע (rot [0,0,-90], grip 0.5). קשת KayKit בערך 2.4.
     מגן: הפנים במישור xy, דק ב-z (rot [0,90,0]). מגן KayKit בערך 1.35 גובה, הידית מעט מתחת לאמצע.
   הכיוון של חפץ חדש (איזה צד פונה החוצה) נבדק בצילום מסך, ומתקנים ב-rot. עד שהמודל נבנה, המשחק משתמש ב-look.model (itemModel ב-render3d.js) */
const raw=id=>path.join(ROOT,'art/weapons/raw',id+'.glb');
const ITEMS={
  dragonBlade:{src:raw('dragonBlade'),tris:4000,tex:512,len:2.4,grip:0.12,rot:[0,90,0]},
  // מחכים לקבצים מ-TRELLIS (תמונות המקור ב-art/weapons/src). חפץ בלי קובץ מדולג, והמשחק נשאר עם look.model
  ironStaff:{src:raw('ironStaff'),tris:4000,tex:512,len:2.3,grip:0.37,rot:[0,90,0]},
  goldStaff:{src:raw('goldStaff'),tris:4000,tex:512,len:2.3,grip:0.37,rot:[0,90,0]},
  starStaff:{src:raw('starStaff'),tris:4000,tex:512,len:2.3,grip:0.37,rot:[0,90,0]},
  skyBow:   {src:raw('skyBow'),tris:4000,tex:512,len:2.4,grip:0.5,rot:[0,90,-90]},   // יצא רחב ב-x ולא ב-z
  stormBow: {src:raw('stormBow'),tris:4000,tex:512,len:2.4,grip:0.5,rot:[0,0,-90]},
  shield3:  {src:raw('shield3'),tris:4000,tex:512,len:1.35,grip:0.45,rot:[0,0,0]},   // יצא כבר כמו KayKit: הפנים ב-xy
  shield4:  {src:raw('shield4'),tris:4000,tex:512,len:1.35,grip:0.45,rot:[0,0,0]}
};
/* כובעים (ניר, 6.11.2026: "הגרפיקה של הכובע חייבת שיפור"). הכובעים האמיתיים של KayKit, כחלק נפרד בלי שלד, במרחב של עצם הראש,
   כדי שאפשר לחבר כל כובע לכל דמות (armor3d ב-js/armor.js). השם במשחק: hat_<שם>.
   node: החלק בקובץ. חלק סטטי על עצם הראש נשאר במקום שלו יחסית לעצם. חלק עם שלד (הראש עם הברדס) עובר למרחב של העצם לפי ה-inverse bind שלו.
   parts: מחלקים את הכובע לחלקים לפי הצבע בטקסטורה, כדי לצבוע רק חלק אחד בצבע הדרגה. הסדר קובע: המשולש הולך לחלק הראשון שמתאים לו.
     rim: המשולשים של הבד שנוגעים בפנים (השוליים של הברדס), ו-rings טבעות סביבם. cut: מוחקים משולשים שיורדים מתחת לגובה הזה (הפרווה שתלויה מאחורי הגב) */
const HATS={
  helm:{src:adv('Characters/gltf/Knight.glb'),node:'Knight_Helmet',parts:{metal:()=>true}},
  mage:{src:adv('Characters/gltf/Mage.glb'),node:'Mage_Hat',parts:{cloth:(r,g,b)=>b>r&&b>g-5,band:()=>true}},
  fur: {src:adv('Characters/gltf/Barbarian.glb'),node:'Barbarian_Hat',cut:-0.35,parts:{fur:()=>true}},
  hood:{src:adv('Characters/gltf/Rogue_Hooded.glb'),node:'Rogue_Head_Hooded',parts:{cloth:(r,g,b)=>g>r+10&&g>b,face:()=>true},rim:['cloth','face'],rings:3}
};
async function addHats(add){
  const {transformPrimitive}=require('@gltf-transform/functions');
  for(const [k,c] of Object.entries(HATS)){
    const doc=await io.read(c.src),root=doc.getRoot(),N=root.listNodes().find(n=>n.getName()===c.node);
    if(!N||!N.getMesh())throw new Error('אין '+c.node+' ב-'+c.src);
    let M=N.getMatrix();const sk=N.getSkin();
    if(sk){const j=sk.listJoints().findIndex(n=>n.getName()==='head');M=Array.from(sk.getInverseBindMatrices().getElement(j,[]))}
    const src=N.getMesh().listPrimitives()[0];transformPrimitive(src,M);
    for(const a of ['JOINTS_0','WEIGHTS_0'])src.setAttribute(a,null);
    // הצבע של כל משולש: הפיקסל בטקסטורה במרכז ה-UV שלו
    const img=src.getMaterial().getBaseColorTexture(),{data,info}=await sharp(Buffer.from(img.getImage())).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const P=src.getAttribute('POSITION'),U=src.getAttribute('TEXCOORD_0'),I=src.getIndices(),n=I?I.getCount()/3:P.getCount()/3,vi=i=>I?I.getScalar(i):i;
    const groups={},names=Object.keys(c.parts);for(const g of names)groups[g]=[];
    const tri=[];for(let t=0;t<n;t++){const v=[vi(t*3),vi(t*3+1),vi(t*3+2)];
      if(c.cut!=null&&Math.min(...v.map(i=>P.getElement(i,[])[1]))<c.cut)continue;
      let u=0,w=0;for(const i of v){const e=U.getElement(i,[]);u+=e[0]/3;w+=e[1]/3}
      const x=Math.min(info.width-1,Math.max(0,Math.floor(u*info.width))),y=Math.min(info.height-1,Math.max(0,Math.floor(w*info.height))),o=(y*info.width+x)*4;
      const g=names.find(g=>c.parts[g](data[o],data[o+1],data[o+2]));groups[g].push(...v);tri.push([g,v])}
    // השוליים: משולשי בד שנוגעים בפנים, ועוד rings-1 טבעות של בד סביבם, כדי שהפס ייראה גם מרחוק
    if(c.rim){const [cl,fc]=c.rim,key=i=>P.getElement(i,[]).map(x=>x.toFixed(4)).join(),at=new Set(),rim=new Set();
      for(const [g,v] of tri)if(g===fc)for(const i of v)at.add(key(i));
      for(let r=0;r<(c.rings||1);r++){const add=[];for(const T of tri)if(T[0]===cl&&!rim.has(T)&&T[1].some(i=>at.has(key(i))))add.push(T);for(const T of add){rim.add(T);for(const i of T[1])at.add(key(i))}}
      groups.rim=[];groups[cl]=[];for(const T of tri)if(T[0]===cl)(rim.has(T)?groups.rim:groups[cl]).push(...T[1])}
    const sc=doc.createScene(k),top=doc.createNode('hat_'+k);sc.addChild(top);
    for(const g in groups){if(!groups[g].length)continue;const p=src.clone().setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(groups[g])).setBuffer(root.listBuffers()[0]));
      top.addChild(doc.createNode(g).setMesh(doc.createMesh(g).addPrimitive(p)))}
    // כל השאר (הדמות, השלד, הנשקים, האנימציות) יוצא, ונשאר רק הכובע
    const mine=new Set([top,...top.listChildren()]);
    for(const s of root.listScenes())if(s!==sc)s.dispose();root.setDefaultScene(sc);
    for(const s of root.listSkins())s.dispose();   // האנימציות יוצאות ב-slim
    for(const nd of root.listNodes())if(!mine.has(nd)){const m=nd.getMesh();nd.dispose();if(m&&!m.listParents().some(p=>p!==root))m.dispose()}
    add('hat_'+k,await slim(doc,{}));
  }
}
async function addItems(add){
  const {MeshoptSimplifier}=require('meshoptimizer');await MeshoptSimplifier.ready;
  const {weld,simplify,transformPrimitive}=require('@gltf-transform/functions');
  for(const [k,c] of Object.entries(ITEMS)){
    if(!fs.existsSync(c.src)){console.log('אין עדיין קובץ ל-'+k+', מדלגים');continue}
    const doc=await io.read(c.src),root=doc.getRoot(),prims=root.listMeshes().flatMap(m=>m.listPrimitives());
    const n=prims.reduce((a,p)=>a+(p.getIndices()?p.getIndices().getCount():p.getAttribute('POSITION').getCount())/3,0);
    await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:Math.min(1,c.tris/n),error:0.002}));
    let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
    for(const p of prims){const a=p.getAttribute('POSITION'),mn=a.getMin([]),mx=a.getMax([]);for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],mn[i]);hi[i]=Math.max(hi[i],mx[i])}}
    const s=c.len/(hi[1]-lo[1]),g=[(lo[0]+hi[0])/2,lo[1]+(hi[1]-lo[1])*c.grip,(lo[2]+hi[2])/2];
    // R=Rz*Ry*Rx (קודם x, אחר כך y ואז z), והמטריצה (לפי עמודות): מזיזים את הידית לראשית, מסובבים ומגדילים
    const [a,b,e]=c.rot.map(d=>d*Math.PI/180),ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),ce=Math.cos(e),se=Math.sin(e);
    const R=[[ce*cb,ce*sb*sa-se*ca,ce*sb*ca+se*sa],[se*cb,se*sb*sa+ce*ca,se*sb*ca-ce*sa],[-sb,cb*sa,cb*ca]];
    const t=R.map(row=>-s*(row[0]*g[0]+row[1]*g[1]+row[2]*g[2]));
    const m=[s*R[0][0],s*R[1][0],s*R[2][0],0, s*R[0][1],s*R[1][1],s*R[2][1],0, s*R[0][2],s*R[1][2],s*R[2][2],0, t[0],t[1],t[2],1];
    for(const p of prims)transformPrimitive(p,m);
    for(const nd of root.listNodes()){nd.setTranslation([0,0,0]).setRotation([0,0,0,1]).setScale([1,1,1])}
    add('w_item_'+k,await slim(doc,{tex:c.tex,fmt:'jpeg'}));
  }
}
const TEX=256;   // גודל הטקסטורה. החבילות משתמשות בפלטת צבעים, אז 256 נראה כמו 1024

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
/* דחיסה (perf/meshopt, 5.11.2026): כל מודל נשמר עם EXT_meshopt_compression, והמשחק פותח אותו עם MeshoptDecoder (three-bundle).
   quantize רק למיקום, לנורמל ול-UV (PACK), ורק בדמויות עם שלד. אנימציות, שלד ומשקלים לא נוגעים בהם, כדי שלא יהיה רעד, והטקסטורות נשארות כמו שהן.
   method QUANTIZE: הדחיסה עצמה בלי אובדן, בלי הפילטרים של meshopt. ?nopack מכבה רק בבנייה: node tools/build3d.js ... --nopack */
const PACK={pattern:/^(POSITION|NORMAL|TEXCOORD_0)$/,quantizePosition:14,quantizeNormal:12,quantizeTexcoord:14,quantizationVolume:'scene'};   // scene: כל החלקים של דמות על אותו סולם, אחרת כל חלק מקבל שלד משלו ו-mergeSkinned מעוות אותם
const NOPACK=process.argv.includes('--nopack'),LOSSLESS=process.argv.includes('--lossless');
async function pack(doc){
  if(NOPACK)return;await MeshoptEncoder.ready;
  // רק כשיש בסצנה משהו לצייר. קבצי אנימציה בלי גוף, או גוף שלא תלוי בסצנה, נדחסים בלי quantize
  const sc=doc.getRoot().getDefaultScene()||doc.getRoot().listScenes()[0],hasMesh=n=>!!n.getMesh()||n.listChildren().some(hasMesh);
  const inScene=sc&&sc.listChildren().some(hasMesh),all=doc.getRoot().listNodes().filter(n=>n.getMesh()).length,seen=[];
  if(sc)sc.traverse(n=>{if(n.getMesh())seen.push(n)});
  // quantize רק לדמויות עם שלד, שם רוב המשקל. חפצים בלי שלד נדחסים בלי אובדן: יש קוד שמודד את המיקומים הגולמיים שלהם (קצה הנשק, עצים ב-tex3d).
  // בדמות, quantize מכניס את קנה המידה לשלד, אז הגובה הגולמי משתנה. שומרים את הגובה המקורי ב-extras.h0, ו-render3d משתמש בו (userData.h)
  if(!LOSSLESS&&inScene&&seen.length===all&&doc.getRoot().listSkins().length){
    let lo=Infinity,hi=-Infinity;for(const m of doc.getRoot().listMeshes())for(const pr of m.listPrimitives()){const a=pr.getAttribute('POSITION');lo=Math.min(lo,a.getMin([])[1]);hi=Math.max(hi,a.getMax([])[1])}
    sc.setExtras(Object.assign({},sc.getExtras(),{h0:hi-lo}));
    await doc.transform(quantize(PACK))}
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
}
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
  await pack(doc);
  return io.writeBinary(doc);
}

async function bundle(){
  // three.js בלי import: חבילה אחת שמגדירה את THREE גלובלי
  const entry=path.join(__dirname,'.three-entry.js');
  fs.writeFileSync(entry,"import * as T from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';window.THREE=Object.assign({},T,{GLTFLoader,SkeletonUtils,mergeGeometries,MeshoptDecoder});");
  fs.mkdirSync(path.join(ROOT,'js/vendor'),{recursive:true});
  await require('esbuild').build({entryPoints:[entry],bundle:true,minify:true,format:'iife',outfile:path.join(ROOT,'js/vendor/three-bundle.js'),nodePaths:(process.env.NODE_PATH||'').split(path.delimiter).filter(Boolean),
    banner:{js:'/* three.js r'+require("three").REVISION+' (MIT, three.js authors) + GLTFLoader, SkeletonUtils, mergeGeometries, MeshoptDecoder. נוצר ע"י tools/build3d.js */'},logLevel:'warning'});
  fs.unlinkSync(entry);
}

// node tools/build3d.js - --only compress: דוחס את כל המודלים שכבר בקובץ (pack), בלי החבילות של KayKit. מודל שכבר דחוס נשאר כמו שהוא
async function compressAll(){
  const f=path.join(ROOT,'js/models3d.js'),src=fs.readFileSync(f,'utf8'),i=src.indexOf('const MODELS3D='),out=JSON.parse(src.slice(i+15).replace(/;\s*$/,''));
  let a=0,b=0;
  for(const k in out){if(k.startsWith('wtex_'))continue;   // טקסטורות החומר הן PNG, לא מודל
    const doc=await io.readBinary(Buffer.from(out[k],'base64'));if(doc.getRoot().listExtensionsUsed().some(e=>e.extensionName==='EXT_meshopt_compression'))continue;
    const before=out[k].length;await pack(doc);out[k]=Buffer.from(await io.writeBinary(doc)).toString('base64');a+=before;b+=out[k].length}
  fs.writeFileSync(f,src.slice(0,i)+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
  console.log('נדחס: '+Math.round(a/1024)+'KB → '+Math.round(b/1024)+'KB');console.log('js/models3d.js',Math.round(fs.statSync(f).size/1024)+'KB');
}
// node tools/build3d.js C:/kk --only nature: מוסיף רק את NATURE לקובץ הקיים, בלי שאר החבילות ובלי לבנות מחדש את three.js
const ONLY=process.argv[3]==='--only'?process.argv[4]:null;
(async()=>{
  const out={},sizes=[];
  // דמות אחת מ-CHARS, בלי לבנות את כל השאר (וגם בלי החבילות שלהן): node tools/build3d.js C:/kk --only parosh1
  if(ONLY&&CHARS[ONLY]){
    const f=path.join(ROOT,'js/models3d.js'),src=fs.readFileSync(f,'utf8'),i=src.indexOf('const MODELS3D=');
    Object.assign(out,JSON.parse(src.slice(i+15).replace(/;\s*$/,'')));const c=CHARS[ONLY];
    const bin=await slim(await io.read(c.src),{keepMeshes:c.keep,tex:c.tex,fmt:c.fmt});out[ONLY]=Buffer.from(bin).toString('base64');
    fs.writeFileSync(f,src.slice(0,i)+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
    console.log(ONLY,Math.round(bin.byteLength/1024)+'KB');console.log('js/models3d.js',Math.round(fs.statSync(f).size/1024)+'KB');return;
  }
  if(ONLY==='nature'){
    const add=(k,bin)=>{out[k]=Buffer.from(bin).toString('base64');sizes.push(k+' '+Math.round(bin.byteLength/1024)+'KB')};
    const f=path.join(ROOT,'js/models3d.js'),src=fs.readFileSync(f,'utf8'),i=src.indexOf('const MODELS3D=');
    Object.assign(out,JSON.parse(src.slice(i+15).replace(/;\s*$/,'')));
    for(const k in out)if(k.startsWith('n_'))delete out[k];
    for(const [k,c] of Object.entries(NATURE))add(k,await slim(await io.read(c.src),{q:true}));
    fs.writeFileSync(f,src.slice(0,i).replace('Fantasy Weapons Bits ו-Medieval Hexagon מאת','Fantasy Weapons Bits, Medieval Hexagon ו-Forest Nature מאת')+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
    console.log(sizes.join('\n'));console.log('js/models3d.js',Math.round(fs.statSync(f).size/1024)+'KB');return;
  }
  // node tools/build3d.js - --only items: מוסיף רק את ITEMS לקובץ הקיים (לא צריך את חבילות KayKit, אז במקום התיקייה אפשר -)
  if(ONLY==='bundle'){await bundle();console.log('js/vendor/three-bundle.js',Math.round(fs.statSync(path.join(ROOT,'js/vendor/three-bundle.js')).size/1024)+'KB');return}
  if(ONLY==='compress'){await compressAll();return}
  // node tools/build3d.js C:/kk --only hats: מוסיף רק את הכובעים (HATS) לקובץ הקיים. צריך רק את adv
  if(ONLY==='hats'){
    const add=(k,bin)=>{out[k]=Buffer.from(bin).toString('base64');sizes.push(k+' '+Math.round(bin.byteLength/1024)+'KB')};
    const f=path.join(ROOT,'js/models3d.js'),src=fs.readFileSync(f,'utf8'),i=src.indexOf('const MODELS3D=');
    Object.assign(out,JSON.parse(src.slice(i+15).replace(/;\s*$/,'')));
    for(const k in out)if(k.startsWith('hat_'))delete out[k];
    await addHats(add);
    fs.writeFileSync(f,src.slice(0,i)+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
    console.log(sizes.join('\n'));console.log('js/models3d.js',Math.round(fs.statSync(f).size/1024)+'KB');return;
  }
  if(ONLY==='items'){
    const add=(k,bin)=>{out[k]=Buffer.from(bin).toString('base64');sizes.push(k+' '+Math.round(bin.byteLength/1024)+'KB')};
    const f=path.join(ROOT,'js/models3d.js'),src=fs.readFileSync(f,'utf8'),i=src.indexOf('const MODELS3D=');
    Object.assign(out,JSON.parse(src.slice(i+15).replace(/;\s*$/,'')));
    for(const k in out)if(k.startsWith('w_item_'))delete out[k];
    await addItems(add);
    fs.writeFileSync(f,src.slice(0,i)+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
    console.log(sizes.join('\n'));console.log('js/models3d.js',Math.round(fs.statSync(f).size/1024)+'KB');return;
  }
  // node tools/build3d.js C:/kk --only monsters: מוסיף רק את MONSTERS לקובץ הקיים
  if(ONLY==='monsters'){
    const add=(k,bin)=>{out[k]=Buffer.from(bin).toString('base64');sizes.push(k+' '+Math.round(bin.byteLength/1024)+'KB')};
    const f=path.join(ROOT,'js/models3d.js'),src=fs.readFileSync(f,'utf8'),i=src.indexOf('const MODELS3D=');
    Object.assign(out,JSON.parse(src.slice(i+15).replace(/;\s*$/,'')));
    for(const k in out)if(k.startsWith('mon_')||k.startsWith('anim_mon_'))delete out[k];
    await addMonsters(add);
    let head=src.slice(0,i);if(!head.includes('Quaternius'))head=head.replace(' רישיון CC0.',' רישיון CC0.\n   מפלצות: Ultimate Monsters מאת Quaternius (quaternius.com), רישיון CC0.');
    fs.writeFileSync(f,head+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');
    console.log(sizes.join('\n'));console.log('js/models3d.js',Math.round(fs.statSync(f).size/1024)+'KB');return;
  }
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
  for(const [k,c] of Object.entries(NATURE))add(k,await slim(await io.read(c.src),{q:true}));
  await addMonsters(add);
  await addItems(add);
  await addHats(add);
  for(const [k,c] of Object.entries(ANIMS)){
    const doc=await io.read(c.src),miss=c.keep.filter(n=>!doc.getRoot().listAnimations().some(a=>a.getName()===n));
    if(miss.length)throw new Error('אנימציה חסרה ב-'+k+': '+miss.join(', '));
    add('anim_'+k,await slim(doc,{keepMeshes:null,keepAnims:c.keep}));
  }
  const head='/* נוצר אוטומטית ע"י tools/build3d.js. לא עורכים ביד.\n   דמויות, כובעים, אנימציות, נשקים ומבנים: KayKit Adventurers, Skeletons, Character Animations, Fantasy Weapons Bits, Medieval Hexagon ו-Forest Nature מאת Kay Lousberg (www.kaylousberg.com), רישיון CC0.\n   מפלצות: Ultimate Monsters מאת Quaternius (quaternius.com), רישיון CC0.\n   מוטמעות כאן כטקסט ולא כקבצים, כי המשחק נפתח גם מ-file:// ושם הדפדפן לא טוען קבצים לבד */\n';
  fs.writeFileSync(path.join(ROOT,'js/models3d.js'),head+'const MODELS3D='+JSON.stringify(out,null,0).replace(/","/g,'",\n"')+';\n');

  await bundle();
  console.log(sizes.join('\n'));
  for(const f of ['js/models3d.js','js/vendor/three-bundle.js'])console.log(f,Math.round(fs.statSync(path.join(ROOT,f)).size/1024)+'KB');
})().catch(e=>{console.error(e);process.exit(1)});
