/* תלת-ממד: שכבה מתחת לקנבס הרגיל. היא מציירת את הקרקע ואת הדמויות כמודלים מונפשים,
   והקנבס הרגיל מעליה ממשיך לצייר כל השאר: חצים, יריות, ניצוצות, מספרים, אזורים וחיצים בקצה המסך.
   הלוגיקה לא יודעת על השכבה הזו: היא רק קוראת את P, S ו-enemies, בדיוק כמו render.js.
   המודלים והאנימציות ב-js/models3d.js (KayKit, CC0), ונבנים מחדש עם tools/build3d.js.
   כל דמות משתמשת באותו שלד, אז כל אנימציה עובדת על כל דמות.

   התאמה לקנבס: מצלמה אורתוגרפית ביחידות של פיקסלים, בזווית camTilt() מעל הקרקע (VIEW.tilt לפי המקום).
   נקודה (x,y) במשחק יושבת ב-(x, 0, y/sin(tilt)) בעולם התלת-ממדי, וכך היא מופיעה על המסך בדיוק איפה שהקנבס מצייר אותה.
   אם WebGL לא זמין, או שהשחקן בחר 2D, הכל נשאר כמו קודם (R3D.on=false). */

/* zoom: כמה רחוק המצלמה בכל מקום. 1 = כמו קודם, 0.75 = רואים בערך פי 1.8 שטח (ניר, 31.10.2026: "נקודת המבט צריכה להיות מגבוה יותר").
   tilt: הזווית מעל הקרקע בכל מקום (90 = ישר מלמעלה). בעולם ובכפר גבוה יותר, כמו ARPG בטלפון (ניר, 1.11.2026: "המצלמה צריכה להיות יותר מגבוהה").
   הזירה נשארת zoom 1 ו-tilt 42 (התחום של אוראל). כדי לאמץ: arena ב-zoom וב-tilt. השחקן מכוון קרוב/רגיל/רחוק בהגדרות (CAM ב-camera.js).
   baseTilt: הגודל של הדמויות נקבע לפיו ולא משתנה בין מקומות. בזווית גבוהה יותר הן נראות קצת נמוכות, כמו כשמסתכלים מלמעלה.
   יותר שטח = יותר דברים לצייר, אז בטלפון חלש כדאי למדוד עם ?fps */
const VIEW={pr:1.5,prLo:1,   // pr: כמה פיקסלים לכל פיקסל של המסך, לכל היותר. prLo: באיכות אפקטים נמוכה או במכשיר חלש (r3dPr), בכפר ובעולם בלבד (לא בזירה)
  zoom:{village:0.95,world:0.68},tilt:{arena:42,village:34,world:34},baseTilt:42, light:1.15, ground:'#263049', groundLine:'#3a4562', room:'#3a3018', village:'#2a3a2c', villageLine:'#5f7d52', world:'#2c4229', worldLine:'#6f8f55'};

/* מי לובש איזה מודל. h: גובה הדמות על המסך בפיקסלים. foot: כמה פיקסלים מתחת למרכז הלוגי הרגליים נוגעות בקרקע.
   props: חפצים ביד (bone: היד, ומיקום וסיבוב מקומיים כמו בחבילה המקורית). הטבעת מתחת לרגליים היא בצבע החולשה של האויב (e.weak, מ-data.js), ולא כתובה כאן. tint: צבע מ-TINT.
   anim: שמות האנימציות מהחבילה. דמות חדשה = שורה כאן (ומודל ב-build3d.js).
   לשחקן אין props כאן: הוא מחזיק את הנשק שלבוש בציוד (heroLook, לפי GRIP3D) */
const HAND_R={bone:'handslotr',pos:[0,0.033,0],rot:[0,-1,0,0]};
const NPC_ANIM={idle:'Idle_A',walk:'Walking_A',work:'Idle_A',wave:'Waving',cheer:'Cheering'};   // תושבי הכפר: מה מנגנים בכל מצב (npc.js). KayKit 2.0
const DOG_ANIM={idle:'dog_Idle',walk:'dog_Walk',run:'dog_Gallop',sit:'dog_Sit',dig:'dog_Dig',bark:'dog_Attack',jump:'dog_Gallop_Jump'};   // השלד של ההאסקי (build3d.js)
/* מתקפות של אויבים בעולם (strike.js, foeai.js), 6.11 (ניר: "לא רואים את המתקפות של המפלצות"). רק בעולם: הזירה לא מדליקה e.sw או e.act.
   clip: מה כל מודל מנגן, לפי שם המודל ב-LOOK3D. hit מכה (גם קפיצה והסתערות), brace ההכנה להסתערות, cast ההכנה לירייה, shoot הירייה. def לכל מודל אחר.
   אויב יכול לדרוס עם atk:{...} בשורה שלו ב-LOOK3D. מודל בלי הקליפ (מפלצות Quaternius): רק הזוהר והסימון.
   בזמן ההכנה הקליפ נעצר בהדרגה עד up (הנשק למעלה), ובמכה השאר מתנגן מהר (fast) */
const FOEATK3D={
  clip:{minion:{hit:'1H_Melee_Attack_Chop'},warrior:{hit:'Melee_1H_Attack_Chop',brace:'Melee_Block'},barbarian:{hit:'Melee_2H_Attack_Chop',brace:'Melee_Block'},
        skelMage:{cast:'Spellcasting',shoot:'Ranged_Magic_Shoot'},mage:{cast:'Ranged_Magic_Spellcasting',shoot:'Ranged_Magic_Shoot'},rogue:{hit:'Melee_1H_Attack_Slice_Horizontal'}},
  def:{hit:'1H_Melee_Attack_Chop'},
  up:0.5,             // עד איזה חלק של הקליפ מגיעים בסוף ההכנה
  fast:0.22,          // כמה שניות שאר המכה
  glow:'#FF4D4D',glowK:[0.2,0.75],   // זוהר אדום שמתחזק לאורך ההכנה (מ-glowK[0] עד glowK[1]), ופועם
  squat:0.14,         // קפיצה: מתכווץ לפני
  jump:46,            // קפיצה: כמה גבוה באוויר (פיקסלים)
  actFlash:0.05       // באמצע פעולה (foeai.js): e.flash עד כאן הוא סימון, לא מכה, ולא מלבין
};
const LOOK3D={
  player:{model:'knight',h:66,foot:14,
    anim:{idle:'Idle_A',run:'Running_A',hit:'Hit_A',die:'Death_A',win:'Cheering'}},
  grunt:{model:'minion',h:54,foot:12,props:{blade:{prop:'blade',...HAND_R}},anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  shield:{model:'warrior',h:60,foot:14,props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'fire'}},
    anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  wisp:{model:'skelMage',h:56,foot:12,float:6,props:{staff:{prop:'staff',...HAND_R,tint:'ice'}},
    anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons',cast:'Spellcasting'}},
  // דמויות ההתחלה (HEROES ב-heroes.js): כמו player, עם מודל משלהן (KayKit Adventurers 2.0).
  // h לפי הגובה של כל מודל (בלי קסדה הצייד נמוך, והכובע מגביה את הקוסם), כדי שהגוף יהיה בגודל של האביר
  hero_warrior:{model:'knight'},
  hero_hunter:{model:'ranger',h:59},
  hero_mage:{model:'mage',h:69},
  // משחקי השאול (moba.js): גיבור לכל ערכה, וחיילים בצבע הקבוצה. הקבוצה מסומנת גם בטבעת שבקנבס
  mb_tank:{model:'barbarian',h:72,foot:15,props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'earth'}},anim:{idle:'Idle_A',run:'Running_B',die:'Death_A'}},
  mb_warrior:{model:'knight',h:66,foot:14,props:{blade:{prop:'blade',...HAND_R}},anim:{idle:'Idle_A',run:'Running_A',die:'Death_A'}},
  mb_hunter:{model:'ranger',h:59,foot:14,props:{bow:{prop:'w_bow_A_withString',bone:'handslotl',pos:[0,0,0],rot:[0,-0.7071,0,0.7071]}},anim:{idle:'Idle_A',run:'Running_A',die:'Death_A'}},   // משחקי השאול: הצייד מחזיק קשת (כמו GRIP3D.bow, #513)
  mb_assassin:{model:'rogue',h:62,foot:14,props:{blade:{prop:'blade',...HAND_R}},anim:{idle:'Idle_A',run:'Running_A',die:'Death_A'}},   // המתנקש: הנוכל של KayKit עם להב
  mb_mage:{model:'mage',h:69,foot:14,props:{staff:{prop:'staff',...HAND_R,tint:'water'}},anim:{idle:'Idle_A',run:'Running_C',die:'Death_A'}},
  mb_m0:{model:'minion',h:44,foot:10,tint:'#4C8DFF',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  mb_m1:{model:'minion',h:44,foot:10,tint:'#FF5A5A',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  wanted:{model:'rogue',h:62,foot:13,tint:'gold',anim:{run:'Running_B',die:'Death_A'}},
  // יצורי משאבים: בינתיים מודל קיים, צבוע בצבע החומר (tint) ובגודל אחר. כשיהיו מודלים משלהם מחליפים רק כאן
  golem:{model:'barbarian',h:84,foot:18,tint:'#8A8F9C',anim:{run:'Running_B',die:'Death_A'}},
  treant:{model:'warrior',h:74,foot:16,tint:'#4F8A3E',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  crawler:{model:'minion',h:40,foot:10,tint:'#C87533',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  sprite:{model:'mage',h:40,foot:10,float:8,tint:'#7BD88F',anim:{run:'Running_C',die:'Death_C_Skeletons'}},
  mummy:{model:'minion',h:56,foot:12,tint:'#D9C9A3',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  // אגם הערפל (פרק 2): אבירים טבועים בכחול-ירוק חלוד, ערפלונים מרחפים, ושומר המים: ברבריאן גדול בכחול עמוק עם מטה מים
  drowned:{model:'warrior',h:62,foot:14,tint:'#2E7F8F',props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'water'}},
    anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  mistling:{model:'skelMage',h:46,foot:11,float:10,tint:'#6FC2E8',anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  tidewarden:{model:'barbarian',h:84,foot:18,tint:'#1E5FD0',props:{staff:{prop:'staff',...HAND_R,tint:'water'}},anim:{run:'Running_B',die:'Death_A'}},
  // הרכס הקפוא (פרק 3): אבירי כפור בתכלת, רוחות שלג מרחפות, ושומר הקרח: ברבריאן גדול בלבן-תכלת עם מטה קרח
  rimeknight:{model:'warrior',h:64,foot:14,tint:'#9FD8F0',props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'ice'}},
    anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  frostwraith:{model:'skelMage',h:46,foot:11,float:10,tint:'#8FD8FF',anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  frostwarden:{model:'barbarian',h:88,foot:18,tint:'#7FD4FF',props:{staff:{prop:'staff',...HAND_R,tint:'ice'}},anim:{run:'Running_B',die:'Death_A'}},
  // המדבר הבוער (פרק 4): עקרבי אבן-אש נמוכים בכתום, רוחות אש מרחפות, ושומר האש: ברבריאן גדול באדום-גחלים עם מטה אש
  cinderscorp:{model:'minion',h:46,foot:13,tint:'#D2582A',props:{blade:{prop:'blade',...HAND_R,tint:'fire'}},anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  flamewisp:{model:'skelMage',h:46,foot:11,float:12,tint:'#FFB04A',anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  emberwarden:{model:'barbarian',h:90,foot:18,tint:'#E0502A',props:{staff:{prop:'staff',...HAND_R,tint:'fire'}},anim:{run:'Running_B',die:'Death_A'}},
  // מגדלי הסערה (פרק 5): אבירי סערה בסגול עם מגן מחושמל, ניצוצות מרחפים, ושומר הסערה: ברבריאן גדול בסגול-חשמל עם מטה ברק
  stormknight:{model:'warrior',h:64,foot:14,tint:'#8A7BC8',props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'lightning'}},
    anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  sparkwisp:{model:'skelMage',h:44,foot:11,float:14,tint:'#B07CFF',anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  stormwarden:{model:'barbarian',h:92,foot:18,tint:'#7A4FE0',props:{staff:{prop:'staff',...HAND_R,tint:'lightning'}},anim:{run:'Running_B',die:'Death_A'}},
  // לב הצל (פרק 6): צללים כהים של אבירים ורוחות, והצל עצמו: ברבריאן ענק כמעט שחור עם מטה
  shadeknight:{model:'warrior',h:64,foot:14,tint:'#3A2A5C',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  shadewisp:{model:'skelMage',h:44,foot:11,float:14,tint:'#5B3F8C',anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  /* מפלצות בזירה (Quaternius Ultimate Monsters, build3d.js MONSTERS): מודל ואנימציות משלהן, בשמות mon_<שם>_<אנימציה>.
     גושים ומרחפים מצטרפים לגושים ולטפטוף ב-spawn.js. ייתי ושד: אויבי-על בתחנות (run.js) */
  slime:{model:'mon_slime',h:34,foot:10,anim:{run:'mon_slime_Walk',die:'mon_slime_Death'}},
  mushnub:{model:'mon_mushnub',h:40,foot:11,anim:{run:'mon_mushnub_Walk',die:'mon_mushnub_Death'}},
  goleling:{model:'mon_goleling',h:38,foot:12,float:10,anim:{run:'mon_goleling_Fast_Flying',die:'mon_goleling_Death'}},
  ghost:{model:'mon_ghost',h:50,foot:12,float:12,anim:{run:'mon_ghost_Fast_Flying',die:'mon_ghost_Death'}},
  yeti:{model:'mon_yeti',h:70,foot:15,anim:{run:'mon_yeti_Walk',die:'mon_yeti_Death'}},
  demon:{model:'mon_demon',h:70,foot:15,anim:{run:'mon_demon_Walk',die:'mon_demon_Death'}},
  shade:{model:'barbarian',h:100,foot:20,tint:'#4B2A7A',props:{staff:{prop:'staff',...HAND_R,tint:'#9C6BFF'}},anim:{run:'Running_B',die:'Death_A'}},
  /* בוסים ענקיים בעולם (giant.js): מודל לכל פרק, פי 5 מהגיבור (h). הבוחר: e.wboss (הפנס), לא isBoss, כדי שהזירה ומשחקי השאול נשארים עם boss.
     anim: run הליכה, idle עמידה (גם בזמן ההכנה למכה), hit המכה, die הקריסה. float: מרחף (נוחת מהשמיים בכניסה). paint: צבע שכופל את הטקסטורה (מכהה) */
  wb_earth:{model:'mon_stoneGiant',h:300,foot:34,anim:{run:'mon_stoneGiant_Walk',idle:'mon_stoneGiant_Idle',hit:'mon_stoneGiant_Punch',die:'mon_stoneGiant_Death'}},
  wb_water:{model:'mon_fishGiant',h:300,foot:34,anim:{run:'mon_fishGiant_Walk',idle:'mon_fishGiant_Idle',hit:'mon_fishGiant_Punch',die:'mon_fishGiant_Death'}},
  wb_ice:{model:'mon_yeti',h:310,foot:34,anim:{run:'mon_yeti_Walk',idle:'mon_yeti_Idle',hit:'mon_yeti_Punch',die:'mon_yeti_Death'}},
  wb_fire:{model:'mon_dragon',h:290,foot:34,float:50,anim:{run:'mon_dragon_Fast_Flying',idle:'mon_dragon_Flying_Idle',hit:'mon_dragon_Punch',die:'mon_dragon_Death'}},
  wb_bolt:{model:'mon_hywirl',h:290,foot:34,float:40,anim:{run:'mon_hywirl_Fast_Flying',idle:'mon_hywirl_Flying_Idle',hit:'mon_hywirl_Punch',die:'mon_hywirl_Death'}},
  wb_light:{model:'mon_demon',h:340,foot:36,paint:'#A08CD0',tint:'#5B2A9C',anim:{run:'mon_demon_Walk',idle:'mon_demon_Idle',hit:'mon_demon_Punch',die:'mon_demon_Death'}},
  boss:{model:'barbarian',h:140,foot:28,anim:{run:'Running_B',idle:'Idle_A',charge:'Melee_2H_Attack_Spin',cast:'Melee_2H_Attack_Chop',taunt:'Taunt',die:'Death_A'}},
  // פיילוט ג'מיני: הגיבור מהדף של ניר, על השלד של האביר. בלי קסדה הוא נמוך יותר, אז h קטן כדי שהגוף יהיה בגודל של האביר.
  // לבדיקה בלבד: עם ?hero=pilot בכתובת הוא נכנס במקום האביר של הלוחם (דמות ההתחלה הראשונה)
  pilotHero:{model:'pilotHero',h:56,foot:14},
  // הדמות האישית של ניר (HEROES.skins ב-heroes.js): מראה בלבד, מעל המחלקה שנבחרה. אותו גובה כמו הפיילוט
  nirHero:{model:'nirHero',h:56,foot:14},
  orelHero:{model:'orelHero',h:58,foot:14},   // הדמות האישית של אוראל. הברדס מגביה אותו קצת
  /* תושבי הכפר (NPC ב-npc.js): דמויות KayKit בצבע משלהן, עם אנימציות העבודה של 2.0 (NPC_ANIM), עד שיגיעו הדמויות של ג'מיני.
     own:false מסתיר את הנשק שהדמות מחזיקה בקובץ המקורי. anim: מה מנגנים בכל מצב של התושב (idle, walk, work, wave, cheer) */
  npc_head:{model:'knight',h:64,foot:14,tint:'gold',anim:{...NPC_ANIM,idle:'Idle_B'}},
  npc_smith:{model:'barbarian',h:66,foot:14,tint:'fire',own:false,props:{hammer:{prop:'w_hammer_A',...HAND_R}},anim:{...NPC_ANIM,work:'Hammering'}},
  npc_merchant:{model:'rogue',h:60,foot:13,tint:'gold',own:false,anim:NPC_ANIM},
  npc_inn:{model:'barbarian',h:58,foot:13,own:false,anim:NPC_ANIM},
  npc_priest:{model:'mage',h:66,foot:13,tint:'lilac',props:{staff:{prop:'w_staff_A',...HAND_R}},anim:{...NPC_ANIM,work:'Ranged_Magic_Spellcasting'}},
  // דמויות בעולם הפתוח (WNPC ב-worldnpc.js)
  npc_fisher:{model:'ranger',h:58,foot:13,tint:'#3F7BF5',own:false,anim:{...NPC_ANIM,idle:'Idle_B'}},
  npc_cutter:{model:'barbarian',h:62,foot:14,tint:'#A8784A',own:false,props:{hammer:{prop:'w_hammer_A',...HAND_R}},anim:NPC_ANIM},
  npc_herbal:{model:'mage',h:60,foot:13,tint:'#5FA35A',anim:NPC_ANIM},
  // אותן דמויות אחרי שעברו לגור בכפר (RESID ב-residents.js)
  npc_vfisher:{model:'ranger',h:58,foot:13,tint:'#3F7BF5',own:false,anim:{...NPC_ANIM,idle:'Idle_B'}},
  npc_vcutter:{model:'barbarian',h:62,foot:14,tint:'#A8784A',own:false,props:{hammer:{prop:'w_hammer_A',...HAND_R}},anim:{...NPC_ANIM,work:'Hammering'}},
  npc_vherbal:{model:'mage',h:60,foot:13,tint:'#5FA35A',anim:NPC_ANIM},
  // תושבים שחוזרים כשפנס נדלק (HOME ב-homecoming.js)
  npc_gardener:{model:'barbarian',h:56,foot:13,tint:'#8BC34A',own:false,anim:{...NPC_ANIM,idle:'Idle_B'}},
  npc_washer:{model:'rogue',h:58,foot:13,tint:'#3F7BF5',own:false,anim:NPC_ANIM},
  npc_singer:{model:'mage',h:60,foot:13,tint:'#BFEFFF',anim:NPC_ANIM},
  npc_baker:{model:'barbarian',h:60,foot:14,tint:'fire',own:false,anim:NPC_ANIM},
  npc_bellringer:{model:'rogue',h:58,foot:13,tint:'lightning',own:false,anim:NPC_ANIM},
  npc_lamplighter:{model:'mage',h:60,foot:13,tint:'#F4F0FF',anim:NPC_ANIM},
  /* חיית המחמד (pet.js): pet_<חיה><שלב>. הגובה על המסך מ-PET (stages[].h), כי גם הדו-ממד משתמש בו. anim: מה מנגנים בכל מצב של החיה */
  pet_piocho1:{model:'piocho1',foot:2,anim:DOG_ANIM},
  pet_piocho2:{model:'piocho2',foot:2,anim:DOG_ANIM},
  pet_piocho3:{model:'piocho3',foot:2,anim:DOG_ANIM,glow:'#FF8A3D'},   // glow: הסימנים על הגוף זוהרים ופועמים (PET.fx)
  pet_parosh1:{model:'parosh1',foot:2,anim:DOG_ANIM},   // הפרעוש של אוראל (parosh.js): אותו מודל לשלושת השלבים
  pet_parosh2:{model:'parosh1',foot:2,anim:DOG_ANIM},
  pet_parosh3:{model:'parosh1',foot:2,anim:DOG_ANIM}
};
/* הנשק ביד השחקן: המודל מ-look.model של הפריט בציוד (GEAR.items ב-gear.js), והחומר לפי ה-tier שלו (טקסטורה wtex_<חומר>, build3d.js).
   חפץ עם מודל משלו (w_item_<id>, ITEMS ב-build3d.js) שומר על הטקסטורה שלו, בלי החומר ובלי זוהר: הזוהר צובע את הטקסטורה, והמראה האגדי כבר בציור.
   כל משפחת נשקים יושבת ביד אחרת ותוקפת באנימציה אחרת. of: לאיזו משפחה שייך מודל, לפי השם.
   spare: מה ביד כשלפריט אין מודל. עץ, הכי פשוט. איזה צד (sword או gun) מחליט סוג הנשק (WEAPONS ב-weapons.js) */
const GRIP3D={
  blade:{...HAND_R,attack:'Melee_1H_Attack_Slice_Horizontal'},
  chop: {...HAND_R,attack:'Melee_1H_Attack_Chop'},    // גרזן ופטיש: מכה מלמעלה
  bow:  {bone:'handslotl',pos:[0,0,0],rot:[0,-0.7071,0,0.7071],attack:'Ranged_Bow_Release',draw:'Ranged_Bow_Draw',idle:'Ranged_Bow_Idle'},   // מותחים לפני כל חץ, ומשחררים ביריה
  magic:{...HAND_R,attack:'Ranged_Magic_Shoot'},
  of:m=>{const k=/^w_item_(.+)/.exec(m),w=k&&(GEAR.items[k[1]]||{}).w;if(w)m='w_'+w;   // מודל משלו: המשפחה לפי סוג הנשק של הפריט (w ב-gear.js)
    return /^w_bow/.test(m)?'bow':/^w_(staff|wand)/.test(m)?'magic':/^w_(axe|hammer)/.test(m)?'chop':'blade'},
  spare:{sword:'w_sword_A',gun:'w_bow_A_withString'}   // רק כשלפריט אין מודל
};
// המודל של פריט: מודל משלו (w_item_<id>, ITEMS ב-build3d.js) ברגע שהוא נבנה, ועד אז look.model. כך חפץ חדש לא צריך שינוי ב-gear.js
const itemModel=(id,it=GEAR.items[id])=>R3D.props['w_item_'+id]?'w_item_'+id:(m3dNeed('w_item_'+id),it&&it.look&&it.look.model);   // מודל משלו שעוד נטען (m3d.js): בינתיים look.model
/* ציוד שרואים על הגיבור בעולם, בכפר ובבובה (docs/plan-progression.md בענף research/progression, PR #168). דלוק לכולם. ?gear3d=0 מכבה.
   ההחלטות של ניר (1.11): זוהר עדין (רק נדיר ומעלה זוהר, ורק אגדי פועם), נשק ומגן קצת יותר גדולים מהמציאות, וכל פריט משנה את המראה בעדינות.
   glow: כמה חזק הנשק, המגן והחלקים זוהרים בצבע הדרגה (GEAR.tiers), לפי tier 0 עד 4. pulse: כמה אגדי פועם, ו-rate כמה מהר.
   wscale: גודל הנשק ביד ביחס למודל המקורי.
   shield: מגן ביד השנייה כשהנשק מקרוב ביד אחת (חרב, גרזן, פטיש). המגן בא ממשבצת המגן (armor.js), ובלי מגן לבוש
     היד ריקה. המודל לפי הנדירות (Fantasy Weapons Bits), והחומר wtex כמו בנשק.
   boots: הרגליים בצבע הנדירות של הנעליים (tint: כמה). head: הקסדה או הכובע זוהרים מנדירות 2 (נדיר) של התכשיט הכי טוב.
   set: סט פעיל (sets.js) צובע את כל החלקים בצבע הסט, מראה אחיד. keep: החלקים שנשארים נפרדים במודל כדי לצבוע אותם */
const GEAR3D={on:!/[?&]gear3d=0/.test(location.search),
  glow:[0,0,0.22,0.38,0.55],pulse:0.45,rate:3,wscale:1.2,
  shield:{model:['w_shield_A','w_shield_B','w_shield_B','w_shield_B','w_shield_B'],   // רק למגן בלי look.model. המודל של כל מגן: ARMOR.shield.model (armor.js)
   bone:'handslotl',pos:[0,0.02,0.05],rot:[0,0,0,1],s:0.78,metal:['wood','iron','silver','gold','legend']},
  boots:{tint:0.45},head:{from:2},set:0.28,
  keep:['LegLeft','LegRight','Helmet','Hat','Quiver']
};
/* תיקונים לנשק לפי הפריט (ניר אישר 9.11.2026, docs/concept-weapon-models.md), כדי שהנשק ביד ובבובה ידמה לתמונה. המפתח: id ב-GEAR.items.
   add: תוספת קטנה על המודל הרגיל (look.model), באותה אחיזה. shape: 'gem' (20 משולשים) או 'crystal' (8), col הצבע, glow כמה הוא זוהר,
     pos/s/rot במרחב של מודל הנשק (w_axe_B: הראש סביב y=1, w_wand_A: הקצה ב-y=0.83). לא נוסף כשהפריט מקבל מודל משלו (w_item_).
   metal: מודל רגיל שהמתכת שלו עמומה מהתמונה (goldAxe: חרדל ולא זהב, 9.11). בעותק של טקסטורת החומר (wtex) רק הפיקסלים שהגוון שלהם בטווח hue
     ושהרוויה שלהם מעל sat (המתכת, לא העץ והחבל) מתבהרים פי v, הרוויה פי s, והגוון זז ל-h. רק לפריט הזה, לא ל-w_axe_B של כולם.
   bright: מודל משלו (w_item_) כהה מהתמונה: פי כמה להבהיר את הטקסטורה. glow ו-gk: זוהר עדין, והאגדי פועם בו (GEAR3D.pulse) */
const ITEM3D={
  goldAxe:   {add:[{shape:'gem',col:'#E0243C',glow:0.45,pos:[0,1.0,0],s:[0.19,0.25,0.23]}],metal:{hue:[28,58],sat:0.5,v:1.25,s:1.4,h:43}},   // אבן גדולה פי 1.35 (9.11: בודק לא ראה אותה בזום של המשחק)
  silverWand:{add:[{shape:'crystal',col:'#4FA8FF',glow:0.6,pos:[0,0.88,0],s:[0.1,0.21,0.1]}]},
  dragonBlade:{bright:1.9,glow:'#FF6FB5',gk:0.18}
};
const ITEM3D_GEO={gem:()=>new THREE.IcosahedronGeometry(1,0),crystal:()=>new THREE.OctahedronGeometry(1,0)};
// טקסטורת החומר של פריט עם metal (ITEM3D): עותק של base שבו רק המתכת מתבהרת. נבנה פעם אחת לכל פריט
function item3dTex(id,base){
  const k='wtex_'+id;if(R3D[k])return R3D[k];const M=ITEM3D[id].metal,im=base.image,c=document.createElement('canvas');
  c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const D=x.getImageData(0,0,c.width,c.height),d=D.data,col=new THREE.Color(),hsl={};
  for(let i=0;i<d.length;i+=4){col.setRGB(d[i]/255,d[i+1]/255,d[i+2]/255);const mx=Math.max(col.r,col.g,col.b),sat=mx?(mx-Math.min(col.r,col.g,col.b))/mx:0;col.getHSL(hsl);const h=hsl.h*360;
    if(h<M.hue[0]||h>M.hue[1]||sat<M.sat)continue;
    col.setHSL(M.h/360,Math.min(1,hsl.s*M.s),hsl.l);col.multiplyScalar(M.v);d[i]=Math.min(255,col.r*255);d[i+1]=Math.min(255,col.g*255);d[i+2]=Math.min(255,col.b*255)}
  x.putImageData(D,0,0);const t=new THREE.CanvasTexture(c);for(const p of ['flipY','colorSpace','wrapS','wrapT','magFilter','minFilter'])t[p]=base[p];t.needsUpdate=true;
  return R3D[k]=t;
}
// בונה את התוספות של פריט ומחבר אותן למודל הנשק m. החומרים נכנסים ל-mats (הבהוב פגיעה) ול-pulse אם אגדי
function item3dAdd(m,id,mats,pulse){
  for(const d of (ITEM3D[id]||{}).add||[]){
    const geo=R3D['geo_'+d.shape]||(R3D['geo_'+d.shape]=ITEM3D_GEO[d.shape]());
    const mat=new THREE.MeshLambertMaterial({color:d.col,flatShading:true,emissive:new THREE.Color(d.col).multiplyScalar(d.glow||0)});
    const g=new THREE.Mesh(geo,mat);g.position.fromArray(d.pos);g.scale.fromArray(d.s);if(d.rot)g.rotation.fromArray(d.rot);
    mat.userData.em=mat.emissive.clone();mats.push(mat);if(pulse)pulse.push(mat);m.add(g);
  }
}
const g3Rar=t=>GEAR.tiers[Math.min(t,GEAR.tiers.length-1)].col;   // הצבע של המתכת (עץ, ברזל, כסף, זהב, אגדי), כדי שהזוהר יתאים לחומר
// מוסיף ל-L (heroLook) את מה שהציוד מצייר: זוהר לנשק, מגן, וצבעים לחלקים (gear3dParts)
function gear3dLook(L,wid){
  const it=gItem(wid),worn=gearWorn().map(gItem),best=s=>Math.max(-1,...worn.filter(x=>x.slot===s).map(x=>x.tier));
  // הזוהר של הנשק בא מהדרגה (g3Rar), לא מ-look.glow של הפריט: look.glow נקרא רק בכרטיס בתיק (gear.js) ובבובה כש-GEAR3D כבוי.
  // מודל זמני (wait) בלי זוהר. מודל משלו (w_item_) מדלג על הזוהר ב-makeActor
  for(const w of ['sword','gun']){const p=L.props[w];p.s=GEAR3D.wscale;if(it&&wUse(wid)===w&&!p.wait&&GEAR3D.glow[it.tier]>0){p.glow=g3Rar(it.tier);p.gk=GEAR3D.glow[it.tier];p.pulse=it.tier>=4}}
  const fam=it&&wUse(wid)==='sword'&&GRIP3D.of(L.props.sword.prop);
  const t=best('shield'),sh=worn.find(x=>x.slot==='shield'&&x.tier===t);   // המגן מהמשבצת (armor.js). בלי מגן: יד ריקה
  if((fam==='blade'||fam==='chop')&&t>=0){const G=GEAR3D.shield,sm=sh&&itemModel(Object.keys(GEAR.items).find(k=>GEAR.items[k]===sh),sh);
    L.props.shield={prop:sm&&R3D.props[sm]?sm:G.model[t],tier:G.metal[t],bone:G.bone,pos:G.pos,rot:G.rot,s:G.s,glow:GEAR3D.glow[t]>0?g3Rar(t):null,gk:GEAR3D.glow[t],pulse:t>=4}}
  const b=best('boots'),h=best('acc'),set=Object.keys(SETS).find(s=>setTiers(gearWorn()).some(x=>x.startsWith(s)));
  L.g3={boots:b>=0?g3Rar(b):null,bk:b>=0?GEAR3D.glow[b]:0,head:h>=GEAR3D.head.from?g3Rar(h):null,hk:h>=0?GEAR3D.glow[h]*0.7:0,hp:h>=4,set:set?SETS[set].col:null};
}
// צובע את החלקים של הדמות לפי L.g3. פעם אחת לכל דמות ולכל שינוי בציוד
function gear3dParts(a,L){
  const g=L.g3;if(!g||a.g3===L.ck)return;a.g3=L.ck;
  a.rk=0;rankArmor3d(a);   // מתחילים נקי: השריון של הדרגה כמו שהוא, והחלקים של הציוד בלי צבע
  a.root.traverse(o=>{if(!o.isMesh)return;const p=armorPart(o,GEAR3D.keep.concat(ARMOR3D));if(!p)return;
    let col=null,k=0;if(GEAR3D.keep.includes(p)){if(a.pulse)a.pulse=a.pulse.filter(m=>m!==o.material);o.material.color.set(0xffffff);o.material.emissive.set(0);o.material.userData.em=o.material.emissive.clone()}
    if(/^Leg/.test(p)&&g.boots){o.material.color.set(0xffffff).lerp(new THREE.Color(g.boots),GEAR3D.boots.tint);col=g.boots;k=g.bk}
    if(/^(Helmet|Hat)$/.test(p)&&g.head){col=g.head;k=g.hk;if(g.hp&&!(a.pulse||[]).includes(o.material))(a.pulse||(a.pulse=[])).push(o.material)}
    if(g.set){col=g.set;k=GEAR3D.set}
    if(col){const em=new THREE.Color(col).multiplyScalar(k);o.material.emissive.copy(em);o.material.userData.em=em}});
}
/* קהל: כשיש הרבה אויבים על המסך, רק הקרובים לשחקן מקבלים דמות מונפשת. כל השאר מצוירים יחד בתנוחת ריצה קפואה
   שמתחלפת בין שני צעדים: כמה ציורים בפריים במקום מאות. בטלפון זה ההבדל בין משחק שזורם למשחק שנתקע.
   full: כמה דמויות מונפשות לכל היותר. world: כך בעולם הפתוח, שם האויבים פזורים והמצלמה רואה רחוק (מבקר 2: 20 דמויות מונפשות היו רוב זמן הציור). poses: באיזה רגע של אנימציית הריצה מצלמים כל צעד. dying: כמה אנימציות מוות יחד. max: כמה בקהל */
/* קהל: מעבר ל-full האויבים הקרובים, השאר מצוירים כצורה קבועה בכמה תנוחות, ציור אחד לכל סוג. types: נאפים בהתחלה.
   כל סוג אחר נאפה בפעם הראשונה שצריך אותו (crowdOf). קודם רק שלושת אלה היו בקהל, וכל אויב מסוג אחר צויר לבד: בשלבים מאוחרים
   (מומיות, טובעים, אבירי כפור) זה עשה עשרות ציורים בכל פריים (סקירת הזירה, 1.11.2026) */
const CROWD={full:30,world:8,poses:[0.25,0.75],dying:16,max:320,types:['grunt','shield','wisp']};
const PILOT3D=/[?&]hero=pilot/.test(location.search);
/* הכפר: המיקומים והמראה לפי רמה ב-VILLAGE (js/village.js). כאן רק איזה קובץ מודל לכל שם, ובאיזה רוחב על המסך בפיקסלים.
   models: המבנים (השמות ב-look). site: פיגום, למבנה שעוד לא נבנה או שבונים אותו עכשיו. deco: קישוטים סביב מבנה.
   decor: העצים והגבעות מסביב (villageDecor). stock: ערימה ליד מבנה שיש בו תוצרת שמחכה */
const VIL3D={
  models:{castle:{model:'v_castle',w:190},forge:{model:'v_forge',w:140},mill:{model:'v_mill',w:140},mine:{model:'v_mine',w:140},market:{model:'v_market',w:150},tent:{model:'v_tent',w:105},
    /* הכפר גדל (docs/concept-village-growth.md, ניר 9.11): הרמות הנמוכות. vx_ נטענים בכניסה לכפר (m3d.js), ועד אז הפיגום */
    ruin:{model:'vx_ruin',w:150},stageA:{model:'vx_stageA',w:120},stageB:{model:'vx_stageB',w:130},stageC:{model:'vx_stageC',w:150},
    pile:{model:'v_lumber',w:85},boulder:{model:'v_rock',w:90},stall:{model:'vx_pallet',w:70},
    /* רמות שנראות אחרת (docs/concept-village-growth-2.md, ניר 10.11.2026): צבע הגג לפי הרמה. G ירוק = עץ פשוט (L3), בלי אות = הכחול (L4), R/Y אדום וזהב (L5) */
    forgeG:{model:'vx_forgeG',w:140},forgeR:{model:'vx_forgeR',w:140},millG:{model:'vx_millG',w:140},millR:{model:'vx_millR',w:140},
    mineG:{model:'vx_mineG',w:140},mineR:{model:'vx_mineR',w:140},marketG:{model:'vx_marketG',w:150},marketR:{model:'vx_marketR',w:150},
    tavernG:{model:'vx_tavernG',w:135},tavern:{model:'vx_tavernB',w:135},tavernR:{model:'vx_tavernR',w:135},
    homeG:{model:'vx_homeBG',w:115},home:{model:'vx_homeBB',w:115},homeR:{model:'vx_homeBR',w:115},castleY:{model:'vx_castleY',w:190},hallG:{model:'vx_hallG',w:170},keep:{model:'vx_towerAB',w:105}},
  site:{model:'v_site',w:135},plot:{model:'vx_dirt',w:120},gate:{model:'v_gate',w:150},
  deco:{flag:{model:'v_flag',w:46},crate:{model:'v_crate',w:30},barrel:{model:'v_barrel',w:28},
    tent:{model:'v_tent',w:62},lumber:{model:'v_lumber',w:42},stone:{model:'v_stone',w:42},rack:{model:'vx_rack',w:38},sack:{model:'vx_sack',w:24},wbarrow:{model:'vx_wbarrow',w:36},
    bucket:{model:'vx_bucket',w:20},pallet:{model:'vx_pallet',w:36},ladder:{model:'vx_ladder',w:34},crateS:{model:'vx_crateS',w:22},fenceW:{model:'vx_fenceW',w:52},fenceS:{model:'vx_fenceS',w:52},towerB:{model:'vx_towerB',w:72},
    towerA:{model:'vx_towerA',w:62},site:{model:'v_site',w:78},flagR:{model:'vx_flagR',w:46},flagY:{model:'vx_flagY',w:46}},
  decor:{tree:{model:['v_treeA','v_treeB'],w:55},rock:{model:'v_rock',w:55},hills:{model:'v_hills',w:260}},
  stock:{mill:{model:'v_lumber',w:60},mine:{model:'v_stone',w:60}}
};
/* העולם הפתוח: המיקומים ב-WORLD (js/world.js). מקורות המשאבים לפי הצורה שלהם (shape), מתוך מודלי הכפר, כדי לא להכביד על הטלפון.
   glow: צבע לעורק מתכת. הקישוטים והשערים כמו בכפר (VIL3D.decor, VIL3D.gate) */
const W3D={nodes:{tree:{model:['v_treeA','v_treeB'],w:88},bush:{model:'v_treeB',w:42,glow:'#5FA35A'},chest:{model:'v_crate',w:48,glow:'#F4C74F'},rock:{model:'v_rock',w:62},vein:{model:'v_rock',w:62,glow:'#C87533'},
  reed:{model:'v_treeB',w:34,glow:'#3FA7A0'},crystal:{model:'v_rock',w:62,glow:'#4FB4FF'}},   // w: רוחב המודל
  /* סימן לעץ שאפשר לכרות (ניר, 9.11): בול עץ קטן ליד הגזע. dx/dy: כמה רדיוסים מהמרכז. עצי קישוט בלי. הנצנוץ: FXC.mine.glint ב-fxcombat.js */
  log:{model:'v_lumber',w:38,dx:0.75,dy:0.45},
  /* קישוטים לכל אזור, מסביב לגבול (worldDecor ב-world.js): במקום עצי האחו בכל מקום. אזור שלא כתוב כאן: VIL3D.decor, כמו בכפר.
     model: מפתח ב-MODELS3D (n_ מ-KayKit Forest Nature, v_ מהכפר), או n_cactus/n_reeds שנבנים בקוד (natureProp). pick: כמה אפשרויות, לפי המקום.
     h: גובה (לעצים צרים וגבוהים) או w: רוחב. tint: צבע שמוכפל בצבעים של המודל (חול, צל). snow: כמה להלבין (שלג). רק במראה החדש, ?look=classic מחזיר את עצי האחו */
  decor:{
    meadow:{hills:{pick:[{model:'n_tree',h:150,tint:'#cfe6bf'},{model:'n_pine',h:160},{model:'n_pine',h:140}]}},   // האחו: יער גבוה בשוליים במקום אריחי המשושה (שנראו כמו לוח משחק). העצים והסלעים הקטנים כמו בכפר
    lake:  {tree:{pick:[{model:'n_tree',h:100,tint:'#a9d2bf'},{model:'n_pine',h:85,tint:'#bfe0d0'},{model:'n_reeds',h:55}]},rock:{model:'n_round',w:55,tint:'#a9bcb8'},hills:{model:'v_hills',w:260,tint:'#bfd8cc'}},
    ridge: {tree:{pick:[{model:'n_pine',h:125,snow:0.35},{model:'n_pine',h:95,snow:0.5}]},rock:{model:'n_crag',w:62,tint:'#eef4fa'},hills:{pick:[{model:'n_pine',h:175,snow:0.45},{model:'n_crag',w:120,tint:'#e2ecf4'},{model:'n_pine',h:150,snow:0.55}]}},
    desert:{tree:{pick:[{model:'n_acacia',h:85,tint:'#d8c27a'},{model:'n_cactus',h:70},{model:'n_dead',h:105,tint:'#e0b58a'}]},rock:{model:'n_crag',w:62,tint:'#e7b47a'},hills:{pick:[{model:'n_crag',w:115,tint:'#d9a05e'},{model:'n_dead',h:160,tint:'#e0b58a'},{model:'n_acacia',h:140,tint:'#d8c27a'}]}},
    storm: {tree:{pick:[{model:'n_dead',h:115,tint:'#8f86aa'},{model:'n_bare',h:90,tint:'#7d7598'}]},rock:{model:'n_block',w:60,tint:'#9a96b4'},hills:{pick:[{model:'n_block',w:105,tint:'#8a86a4'},{model:'n_dead',h:165,tint:'#8f86aa'},{model:'n_bare',h:130,tint:'#7d7598'}]}},
    // hills: בשוליים, יער גבוה וסלעים בגודל סביר במקום גוש סלע ענק אחד שנראה כמו קופסה (ניר, 1.11: "דברים מוזרים")
    shadow:{tree:{pick:[{model:'n_bare',h:95,tint:'#6e5a98'},{model:'n_dead',h:115,tint:'#5a4a80'}]},rock:{model:'n_round',w:58,tint:'#5d4a86'},hills:{pick:[{model:'n_bare',h:150,tint:'#5a4a80'},{model:'n_round',w:110,tint:'#4a3a70'},{model:'n_dead',h:165,tint:'#4e3f78'}]}}
  },
  // מקורות משאבים לפי הסוג (kind ב-nodes.js), במראה החדש: אורן מושלג, קקטוס, עץ מת. כל השאר לפי הצורה (nodes למעלה)
  kinds:{pine:{model:'n_pine',h:115,snow:0.3},cactus:{model:'n_cactus',h:62,glow:'#5FA35A'},deadTree:{model:'n_dead',h:115,tint:'#8c8494'},
    shadeTree:{model:'n_bare',h:95,tint:'#6a5aa0'},reeds:{model:'n_reeds',h:55,glow:'#2a6f6a'}},
  // צבע לכל אזור (WORLD.regions ב-world.js): bg הרקע, line הקרקע, pond המים. אזור שלא כתוב כאן: VIEW.world
  // water/glow: המים במראה החדש (look-hd.js, בלי ?look=classic), עם שוליים רכים. glow: זוהר, ו-pulse: כמה הוא פועם (לבה). החוף סביבם: GROUND ב-ground.js
  water:{meadow:{col:'#3f8fb4'},lake:{col:'#3c8aa0'},ridge:{col:'#8fd0ee',glow:'#3a86b8',g:0.3},desert:{col:'#f0561a',glow:'#ff4a08',g:0.9,pulse:0.25},
    storm:{col:'#3a3060',glow:'#6e5fa6',g:0.25},shadow:{col:'#1a0f2c',glow:'#5b3f8c',g:0.3}},
  regions:{lake:{bg:'#1d3238',line:'#4f7a78',pond:'#2a6d8f'},
    ridge:{bg:'#2b3644',line:'#9fb3c4',pond:'#26384a'},   // הרכס הקפוא (פרק 3): שלג
    desert:{bg:'#4a3522',line:'#d9a865',pond:'#6b2a14'},   // המדבר הבוער (פרק 4): חול, ובורות לבה
    storm:{bg:'#23222e',line:'#6e6a8a',pond:'#2a2440'},   // מגדלי הסערה (פרק 5): סלע רטוב בגשם, ושלוליות סגולות
    shadow:{bg:'#0f0a18',line:'#3a2a58',pond:'#1a0f2c'}}};   // לב הצל (פרק 6): כמעט שחור, וסגול
// עצמות פלג הגוף העליון: תקיפה תוך כדי ריצה מזיזה רק אותן, והרגליים ממשיכות לרוץ
const UPPER=/^(spine|chest|head|upperarm|lowerarm|wrist|hand)/;
/* רזולוציית הציור בתלת-ממד (W6, 8.11.2026). בכפר ובעולם יורדים ל-VIEW.prLo (פיקסל אחד לכל פיקסל מסך) לא רק כשאיכות האפקטים נמוכה (VFX3D),
   אלא גם במכשיר חלש או מסך קטן: מעט ליבות או זיכרון, מסך שהצלע הקצרה שלו פחות מ-px פיקסלים אמיתיים, או קצב פריימים שנמדד נמוך (gfxMeasure, R3D.fps).
   OnePlus 15 של ניר (8 ליבות, 1272 בצלע הקצרה, 120 FPS) נשאר ב-VIEW.pr המלא. בזירה ובחדר הבונוס תמיד VIEW.pr */
const R3D_LO={cores:4,mem:4,px:1000,fps:45};
function r3dWeak(){if(R3D.weak==null){const n=navigator,d=window.devicePixelRatio||1;
  R3D.weak=!!((n.hardwareConcurrency&&n.hardwareConcurrency<=R3D_LO.cores)||(n.deviceMemory&&n.deviceMemory<R3D_LO.mem)||(screen&&Math.min(screen.width,screen.height)*d<R3D_LO.px))}
  return R3D.weak||!!(R3D.fps&&R3D.fps<R3D_LO.fps)}
function r3dPr(){const here=(S.vil||S.wd)&&!S.room;return Math.min(DPR,here&&((typeof VFX3D!=='undefined'&&VFX3D.quality()==='lo')||r3dWeak())?VIEW.prLo:VIEW.pr)}

const R3D={shown:new WeakSet(),nid:0,on:false,ready:false,failed:false,want:true,actors:new Map(),dying:[],tmpl:{},clips:{},props:{},stats:{}};
/* גרפיקה: תלת-ממד כברירת מחדל. אם WebGL לא עולה, או שהמשחק איטי בשניות הראשונות, עוברים לבד לדו-ממד, עם הודעה אחת.
   בחירה של השחקן בחלון ההגדרות ('zm-gfx') מנצחת תמיד, ואז לא מודדים. פתיחה איטית נספרת (GFX_AUTO.key), ורק אחרי strikes פתיחות איטיות ברצף
   הדו-ממד נזכר לפעם הבאה, כדי שטעינה איטית אחת לא תנעל טלפון חזק על דו-ממד (אוראל, אייפון 16, 1.11.2026). פתיחה מהירה מאפסת את הספירה */
const GFX_AUTO={minFps:24,warm:3,secs:4,strikes:2,key:'zm-gfx-slow'};   // מתחת ל-minFps ממוצע: דו-ממד. warm: שניות ראשונות שלא נמדדות (טעינה). secs: כמה שניות משחק מודדים
try{const u=localStorage.getItem('zm-gfx');R3D.user=!!u;R3D.want=u?u==='3d':(+localStorage.getItem(GFX_AUTO.key)||0)<GFX_AUTO.strikes}catch(e){}

// נקרא מ-render3d בכל פריים שמצויר: סופר פריימים בזמן משחק אמיתי, ופעם אחת מחליט
function gfxMeasure(now){
  const m=R3D.fm||(R3D.fm={t:0,n:0,last:0});const gap=m.last?(now-m.last)/1000:0;m.last=now;
  if(R3D.user||R3D.drawEvery||R3D.measured||S.mode!=='play'||!gap||gap>0.5)return;   // הפסקה, חלון ברקע או הבדיקה האוטומטית: לא נחשב
  m.t+=gap;if(m.t<GFX_AUTO.warm)return;m.n++;
  if(m.t<GFX_AUTO.warm+GFX_AUTO.secs)return;
  R3D.measured=true;const fps=m.n/GFX_AUTO.secs;R3D.fps=Math.round(fps);
  try{if(fps<GFX_AUTO.minFps)localStorage.setItem(GFX_AUTO.key,(+localStorage.getItem(GFX_AUTO.key)||0)+1);else localStorage.removeItem(GFX_AUTO.key)}catch(e){}
  if(fps<GFX_AUTO.minFps)gfxAuto();
}
// מעבר אוטומטי לדו-ממד, בלי לשמור כבחירה של השחקן. ההודעה מוצגת כשהמשחק רץ (main.js)
function gfxAuto(){R3D.want=false;R3D.on=false;if(R3D.cvs)R3D.cvs.hidden=true;if(!R3D.user)R3D.note=true;showGfx()}

function setGfx(g){R3D.want=g==='3d';R3D.user=true;try{localStorage.setItem('zm-gfx',g)}catch(e){}
  if(R3D.want&&!R3D.ready&&!R3D.failed)init3d();R3D.on=R3D.want&&R3D.ready;if(R3D.cvs)R3D.cvs.hidden=!R3D.on;showGfx()}
function showGfx(){for(const b of document.querySelectorAll('[data-gfx]'))b.setAttribute('aria-pressed',String((b.dataset.gfx==='3d')===R3D.want));
  const g=document.querySelector('.gfx.g3d');if(g)g.hidden=R3D.failed}

/* ---- טעינה ---- */
function b64buf(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}
// המודלים דחוסים ב-meshopt (build3d.js, pack), ו-MeshoptDecoder פותח אותם. מודל לא דחוס נטען כרגיל
function parseGLB(k){return new Promise((ok,bad)=>new THREE.GLTFLoader().setMeshoptDecoder(THREE.MeshoptDecoder).parse(b64buf(MODELS3D[k]),'',ok,bad))}
// הדמויות מגיעות מחולקות לחלקים (ראש, גוף, ידיים...). מאחדים אותם לחלק אחד, כדי שהטלפון יצייר כל דמות במכה אחת
// keep: חלקים שנשארים נפרדים כדי להדליק ולכבות אותם (שריון לפי דרגה, rankArmor3d)
function mergeSkinned(root,keep){
  // רק חלקים עם אותה טקסטורה מתאחדים. העיניים הזוהרות של השלדים נשארות חלק נפרד
  const all=[];root.traverse(o=>{if(o.isSkinnedMesh&&!(keep&&armorPart(o,keep)))all.push(o)});
  const first=all.find(p=>p.material.map);if(!first)return;
  const parts=all.filter(p=>p.material.map===first.material.map&&p.skeleton.bones.length===first.skeleton.bones.length&&p.bindMatrix.equals(first.bindMatrix));
  if(parts.length<2)return;
  const sk=first.skeleton,mat=first.material;
  const geo=THREE.mergeGeometries(parts.map(p=>{const g=p.geometry.clone();for(const k in g.attributes)if(!['position','normal','uv','skinIndex','skinWeight'].includes(k))g.deleteAttribute(k);return g}));
  if(!geo)return;
  const m=new THREE.SkinnedMesh(geo,mat);m.name='body';
  first.parent.add(m);m.bind(sk,first.bindMatrix);
  for(const p of parts)p.parent.remove(p);
}
// חומר פשוט יותר מהמקורי: נראה אותו דבר בסגנון הזה, ומהיר יותר בטלפון
function lambert(root){root.traverse(o=>{if(o.isMesh){const m=o.material;o.material=new THREE.MeshLambertMaterial({map:m.map,color:m.color,emissive:m.emissive,emissiveMap:m.emissiveMap,side:m.side});o.frustumCulled=false}})}
function bone(root,name){let b=null;root.traverse(o=>{if(!b&&o.isBone&&o.name===name)b=o});return b}

// אנימציות מקובץ אחד (anim_*): בפתיחה, ומקובץ שנטען אחר כך (m3d.js)
function addClips(g){for(const a0 of g.animations){
    // משאירים רק מה שמזיז את הגוף בפועל: סיבוב של עצמות הגוף והידיים, ותזוזה של האגן והרגליים.
    // עצמות העזר (IK, control) וקנה המידה לא משנים כלום במשחק, ומכפילים פי ארבעה את העבודה בכל פריים
    // חיות (dog_): כל הסיבובים חוץ מעצמות העזר של הכפות, ו-Body זז (קפיצה, ישיבה)
    // מפלצות (mon_, Quaternius): כל הסיבובים והתזוזות. הגוש קופץ בתזוזה של Body, והרגליים של הגדולות הן עצמות נפרדות שזזות לבד
    const dog=a0.name.startsWith('dog_'),mon=a0.name.startsWith('mon_');
    const a=new THREE.AnimationClip(a0.name,a0.duration,a0.tracks.filter(t=>{const [n,pr]=t.name.split('.');
      return mon?pr==='quaternion'||pr==='position':dog?(pr==='quaternion'&&!/^(IK|FF|Pole)/.test(n)||n==='Body'&&pr==='position'):!/IK|control/.test(n)&&(pr==='quaternion'||pr==='position'&&/^(root|hips|upperleg)/.test(n))}));
    R3D.clips[a.name]=a;
    R3D.clips[a.name+'@up']=new THREE.AnimationClip(a.name+'@up',a.duration,a.tracks.filter(t=>UPPER.test(t.name)));
    R3D.clips[a.name+'@low']=new THREE.AnimationClip(a.name+'@low',a.duration,a.tracks.filter(t=>!UPPER.test(t.name)))}}
// דמות שנטענה (R3D.tmpl[k]): איחוד החלקים, חומר פשוט, וגובה לקנה המידה. בפתיחה, ולמודל שנטען אחר כך (m3d.js)
function prepTmpl(k){const t=R3D.tmpl[k],heroModels=R3D.heroModels||(R3D.heroModels=new Set(Object.keys(LOOK3D).filter(k=>k==='player'||k.startsWith('hero_')).map(k=>LOOK3D[k].model)));
  mergeSkinned(t,heroModels.has(k)&&[...ARMOR3D,...(GEAR3D.on?GEAR3D.keep:[]),...ARMOR_NATIVE,ARMOR.hat.head]);   // הראש נפרד: הברדס מחליף אותו (armor.js)
  lambert(t);t.updateMatrixWorld(true);
  // גובה הדמות בתנוחת הבסיס, כדי לקבוע את קנה המידה
  const bb=new THREE.Box3();t.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox)}});t.userData.h=t.userData.h0||bb.max.y-bb.min.y||2}   // h0: הגובה לפני הדחיסה (build3d.js, pack), כי quantize משנה את המיקומים הגולמיים
async function init3d(){
  if(R3D.loading||R3D.failed)return;R3D.loading=true;
  try{
    if(!window.THREE||typeof MODELS3D==='undefined')throw new Error('three.js או המודלים לא נטענו');
    const c=document.createElement('canvas');c.id='c3';c.setAttribute('aria-hidden','true');cvs.before(c);R3D.cvs=c;
    const r=new THREE.WebGLRenderer({canvas:c,antialias:DPR<2,powerPreference:'high-performance'});
    if(!r.getContext())throw new Error('אין WebGL');
    R3D.r=r;r.outputColorSpace=THREE.SRGBColorSpace;
    const sc=R3D.scene=new THREE.Scene();sc.background=new THREE.Color(VIEW.ground);
    sc.add(new THREE.HemisphereLight(0xdfe6ff,0x2a2236,1.6*VIEW.light));
    const sun=new THREE.DirectionalLight(0xfff1dc,1.9*VIEW.light);sun.position.set(-0.5,1,0.6);sc.add(sun);
    R3D.cam=new THREE.OrthographicCamera(-1,1,1,-1,1,4000);
    makeGround();makeMarks();
    try{m3dBoot()}catch(e){}   // הדמות האישית, החיה והחפצים: מתחילים להוריד כבר עכשיו (m3d.js)
    const [anims]=await Promise.all([Promise.all(Object.keys(MODELS3D).filter(k=>k.startsWith('anim_')&&!m3dLazy(k)).map(parseGLB)),
      ...Object.values(LOOK3D).map(async L=>{if(R3D.tmpl[L.model]||m3dLazy(L.model))return;   // מה שבחוץ (m3d.js) נטען כשצריך
        const g=await parseGLB(L.model);R3D.tmpl[L.model]=g.scene})]);
    for(const g of anims)addClips(g);
    // נשקים, כובעים, חומרי הנשקים, מבני הכפר והטבע: כולם במקביל (perf/lazy-models: אחד אחרי השני חיכה לכל טקסטורה בנפרד), ונכנסים לפי הסדר של הקובץ
    const ks=Object.keys(MODELS3D).filter(k=>!m3dLazy(k)&&(['blade','shield','staff'].includes(k)||/^(w_|hat_|v_|n_)/.test(k)));
    const tex=Object.keys(MODELS3D).filter(k=>k.startsWith('wtex_'));
    const [gs,imgs]=await Promise.all([Promise.all(ks.map(parseGLB)),Promise.all(tex.map(async k=>{const img=new Image();img.src='data:image/png;base64,'+MODELS3D[k];await img.decode();return img}))]);
    R3D.hats={};ks.forEach((k,i)=>{const sc=gs[i].scene;lambert(sc);
      if(k.startsWith('hat_'))R3D.hats[k.slice(4)]=sc;   // כובעים (ARMOR.hat ב-armor.js)
      else{if(/^[vn]_/.test(k))sc.traverse(o=>{o.frustumCulled=true});R3D.props[k]=sc}});   // נשקים, ומבני הכפר והטבע
    // חומרי הנשקים: אותה פלטה בצבעים אחרים, שמחליפה את הטקסטורה של הנשק (makeActor)
    R3D.wtex={};tex.forEach((k,i)=>{const t=new THREE.Texture(imgs[i]);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;R3D.wtex[k.slice(5)]=t});
    for(const k in R3D.tmpl)prepTmpl(k);
    bakeCrowd();
    R3D.ready=true;R3D.on=R3D.want;c.hidden=!R3D.on;
  }catch(e){
    R3D.failed=true;R3D.on=false;if(R3D.cvs)R3D.cvs.hidden=true;
    console.warn('תלת-ממד לא זמין, ממשיכים בדו-ממד:',e&&e.message);
    if(!R3D.user)R3D.note=true;
  }
  R3D.loading=false;M3D.booted();showGfx();
}

/* ---- קרקע וסימונים ---- */
function makeGround(){
  // אריח רצפה מצויר, שחוזר על עצמו. המשטח זז עם המצלמה בקפיצות של אריח, כך שהרצפה נראית קבועה במקום
  const T=256,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,T,T);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=225+Math.floor(hash(i,j)*30);g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(i*64+2,j*64+2,60,60)}
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const size=16000,tile=180;tex.repeat.set(size/tile,size/tile);   // 16000: גם האחו הגדול (6300×4200, ובעומק פי 1/sin) מכוסה כשהמצלמה רחוקה
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshLambertMaterial({map:tex,color:VIEW.groundLine}));
  m.rotation.x=-Math.PI/2;m.userData.tile=tile;R3D.ground=m;R3D.scene.add(m);
}
// צל עגול מתחת לכל דמות, וטבעת בצבע הנשק מתחת לאויבים מיוחדים. כולם באותה שכבה, כדי לחסוך ציורים
function makeMarks(){
  const N=320,mk=(geo,col,op)=>{const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}),N);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=1;R3D.scene.add(m);return m};
  const disc=new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2),ring=new THREE.RingGeometry(0.78,1,28).rotateX(-Math.PI/2);
  R3D.marks={shadow:mk(disc,0x05070d,0.45)};for(const k in DMG.types)R3D.marks[k]=mk(ring,DMG.types[k].col,0.85);   // טבעת לכל סוג נזק
}
function mark(kind,x,z,r){const M=R3D.marks[kind];if(M.count>=M.instanceMatrix.count)return;
  R3D._mx.makeScale(r,1,r*0.92).setPosition(x,0.5,z);M.setMatrixAt(M.count++,R3D._mx)}

/* ---- קהל ---- */
// מצלמים כל סוג אויב בכמה תנוחות ריצה, והופכים כל תנוחה לצורה קבועה שאפשר לצייר מאות פעמים בציור אחד
function bakeCrowd(){R3D.crowd={};for(const k of CROWD.types)crowdOf(k)}
// הקהל של סוג אחד: נאפה בפעם הראשונה (כמה מילישניות), ואחר כך מהזיכרון. null: לסוג הזה אין מודל עם ריצה, והוא מצויר לבד
function crowdOf(k){
  if(k in R3D.crowd)return R3D.crowd[k];
  const L=LOOK3D[k];if(L&&!m3dNeed(L.model))return null;   // עוד נטען (m3d.js): בלי לזכור null, כדי שהקהל ייאפה כשהוא מוכן
  const clip=L&&L.model&&L.anim&&R3D.clips[L.anim.run];if(!clip||!R3D.tmpl[L.model])return R3D.crowd[k]=null;
  const v=new THREE.Vector3();
  {
    const a=makeActor(L);a.mixer.clipAction(clip).play();
    R3D.crowd[k]=CROWD.poses.map(f=>{
      a.mixer.setTime(f*clip.duration);a.root.position.set(0,0,0);a.root.rotation.set(0,0,0);a.root.updateMatrixWorld(true);
      const parts=[];
      a.root.traverseVisible(o=>{if(!o.isMesh)return;
        const src=o.geometry,n=src.attributes.position.count,pos=new Float32Array(n*3);
        for(let i=0;i<n;i++){if(o.isSkinnedMesh)o.getVertexPosition(i,v);else v.fromBufferAttribute(src.attributes.position,i);v.applyMatrix4(o.matrixWorld).toArray(pos,i*3)}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
        if(src.attributes.uv)g.setAttribute('uv',src.attributes.uv);if(src.index)g.setIndex(src.index);g.computeVertexNormals();
        const m=new THREE.InstancedMesh(g,o.material.clone(),CROWD.max);m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;R3D.scene.add(m);parts.push(m)});
      return parts});
    freeActor(a);
  }
  return R3D.crowd[k];
}
function crowdAdd(e){
  const L=lookOf(e),k=e.big||1,lift=L.float?L.float+Math.sin(e.ph*0.6)*3:0,M=R3D._mx;
  const parts=R3D.crowd[e.type][Math.floor(e.ph/1.6)%CROWD.poses.length];
  R3D._p.set(e.x,lift/COS(),(e.y+L.foot*k)/SIN());R3D._q.setFromAxisAngle(R3D._up,yawOf(P.x-e.x,P.y-e.y));R3D._s.setScalar(k);
  M.compose(R3D._p,R3D._q,R3D._s);
  for(const m of parts)if(m.count<CROWD.max)m.setMatrixAt(m.count++,M);
  R3D.nCrowd++;
  const rr=e.r*1.15;mark('shadow',R3D._p.x,R3D._p.z,rr);if(e.weak)mark(e.weak,R3D._p.x,R3D._p.z,rr*1.15);
}

/* ---- דמויות ---- */
const SIN=()=>Math.sin(camTilt()),COS=()=>Math.cos(camTilt());   // הזווית של המקום הנוכחי (camera.js)
const COSB=()=>Math.cos(VIEW.baseTilt*Math.PI/180);   // לגודל הדמויות: קבוע בכל מקום, כדי שדמות שנבנתה בכפר תתאים גם בעולם
// השחקן: הדמות שנבחרה, ובידיים הנשק שלבוש (GRIP3D). נבנה מחדש רק כשהדמות או הנשק מתחלפים
function heroLook(){
  const wid=SAVE.gear.weapon,sk=heroSkin(),it=gItem(wid);
  let B=sk?LOOK3D[HEROES.skins[sk].look]:PILOT3D&&heroId()==='warrior'?LOOK3D.pilotHero:LOOK3D['hero_'+heroId()];
  if(B&&!m3dNeed(B.model))B=LOOK3D['hero_'+heroId()];   // דמות אישית שעוד נטענת (m3d.js): לרגע הגיבור של המחלקה
  // במפתח: המודל שמוצג בפועל, הנשק שביד, ו-M3D.hv (נטענו דמות או חפץ, m3d.js), כדי שהגיבור ייבנה מחדש רק כשמשהו שלו מוכן
  const ck=heroId()+'|'+wid+'|'+PILOT3D+'|'+sk+'|'+(B&&B.model)+'|'+(it?itemModel(gBase(wid),it):'')+'|'+M3D.hv+(GEAR3D.on?'|'+gearWorn().join():'')+gtKey();if(R3D._hl&&R3D._hl.ck===ck)return R3D._hl;
  const L=Object.assign({},LOOK3D.player,B);
  L.props={};L.anim=Object.assign({},L.anim);L.ck=ck;
  for(const w of ['sword','gun']){
    const im=it&&itemModel(gBase(wid),it),mine=it&&wUse(wid)===w&&im&&R3D.props[im],model=mine?im:GRIP3D.spare[w],g=GRIP3D[GRIP3D.of(model)];
    // מודל משלו שעוד נטען: look.model הוא רק מקום שמור. בלי מתכת ובלי זוהר של הדרגה, כדי שלא ייראה כמו הנשק (באג 9.11: קשת השמיים ורודה, קשת הסערה כסופה)
    const wait=it&&wUse(wid)===w&&!R3D.props['w_item_'+gBase(wid)]&&m3dLazy('w_item_'+gBase(wid))&&M3D.st['w_item_'+gBase(wid)]!=='fail';   // לא נטען בכלל: נשאר המודל הזמני עם הדרגה
    L.props[w]=Object.assign({prop:model,tier:mine&&!wait?GEAR.tiers[it.tier].id:'wood',wait,item:mine&&!wait&&ITEM3D[gBase(wid)]?gBase(wid):null},g);   // item: תיקון לפי הפריט (ITEM3D)
    L.anim[w]=g.attack;if(g.idle)L.anim[w+'Idle']=g.idle;if(g.draw)L.anim[w+'Draw']=g.draw;
  }
  if(GEAR3D.on)gear3dLook(L,wid);
  gtProps(L);   // כלי איסוף ביד בעולם (gtool.js)
  {const th=heroTheme();if(th&&th.grip){delete L.props.shield;th.grip(L)}}   // דמות אישית: חפץ ביד במקום הנשק, ובלי מגן ביד השנייה (החליל ב-flute.js)
  return R3D._hl=L;
}
function lookOf(e){return e===P?heroLook():e.wboss&&LOOK3D['wb_'+e.wboss]?LOOK3D['wb_'+e.wboss]:e.isBoss?LOOK3D.boss:e.wanted?LOOK3D.wanted:LOOK3D[e.type]}
// מפתח למאגר: רק דמות זהה (מודל, חפצים, צבע, גודל, נשק מוסתר) חוזרת לשימוש. יצורי משאבים הם מודל קיים בצבע ובגודל אחר
const lookKey=L=>L.model+'|'+Object.values(L.props||{}).map(p=>p.prop+(p.tier||'')+(p.glow||'')+(p.item||'')).join()+(L.tint?'|'+L.tint:'')+(L.paint?'|'+L.paint:'')+'|'+L.h+(L.own===false?'|x':'');
const TINT={ember:C.ember,tide:C.tide,gold:C.gold,...Object.fromEntries(Object.keys(DMG.types).map(k=>[k,DMG.types[k].col])),lilac:C.lilac};   // צבע לכל סוג נזק, ושמות הצבעים של המשחק
const tintOf=t=>TINT[t]||t;   // שם מ-TINT, או צבע ישיר ('#8A8F9C')
function makeActor(L){
  const pool=R3D.pool||(R3D.pool={});const free=pool[lookKey(L)];
  if(free&&free.length){const a=free.pop();a.root.visible=true;a.dieT=0;a.base=null;a.one=null;a.mixer.stopAllAction();return a}
  const t=R3D.tmpl[L.model],root=THREE.SkeletonUtils.clone(t),s=L.h/COSB()/t.userData.h;
  root.scale.setScalar(s);
  const mats=[];
  root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(L.paint)o.material.color.set(L.paint);if(L.tint)o.material.emissive.set(tintOf(L.tint)).multiplyScalar(L.tint[0]==='#'?0.45:0.18);o.material.userData.em=o.material.emissive.clone();mats.push(o.material)}});
  const props={};let a_pulse=null;   // a_pulse: חלקים של פריט אגדי, שפועמים (GEAR3D)
  for(const [k,p] of Object.entries(L.props||{})){
    const b=bone(root,p.bone);if(!b)continue;
    const m=R3D.props[p.prop].clone(true);m.position.fromArray(p.pos);m.quaternion.fromArray(p.rot);if(p.s)m.scale.setScalar(p.s);
    const own=/^w_item_/.test(p.prop),fix=ITEM3D[p.item||own&&p.prop.slice(7)]||{};   // מודל משלו: הטקסטורה נשארת, ובלי זוהר הדרגה. מודל מ-Blender עם emissiveMap (tools/blender) פועם בחלקים הזוהרים שלו
    // מודל משלו עם fix.glow (ITEM3D): זוהר עדין בצבע של התמונה, והאגדי פועם בו. fix.bright מבהיר טקסטורה כהה
    m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(p.tier&&R3D.wtex[p.tier]&&!own)o.material.map=R3D.wtex[p.tier];if(!own&&fix.metal&&o.material.map)o.material.map=item3dTex(p.item,o.material.map);if(own&&fix.bright)o.material.color.multiplyScalar(fix.bright);if(p.tint)o.material.emissive.set(TINT[p.tint]).multiplyScalar(0.55);if(p.glow&&!own)o.material.emissive.set(p.glow).multiplyScalar(p.gk);if(own&&fix.glow&&!o.material.emissiveMap)o.material.emissive.set(fix.glow).multiplyScalar(fix.gk);if(p.pulse&&(!own||o.material.emissiveMap||fix.glow))(a_pulse||(a_pulse=[])).push(o.material);o.material.userData.em=o.material.emissive.clone();mats.push(o.material)}});
    if(!own&&p.item)item3dAdd(m,p.item,mats,p.pulse&&(a_pulse||(a_pulse=[])));   // תוספת קטנה (ITEM3D.add)
    b.add(m);props[k]=m;
  }
  // נשקים שהדמות מחזיקה בקובץ המקורי: גרזן לבוס, סכין למבוקש
  let own=null;root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&/^(1H|2H)_|Knife/.test(o.name))own=own||o});
  const a={root,mats,props,own,mixer:new THREE.AnimationMixer(root),L,key:lookKey(L),base:null,one:null,flash:0,dieT:0,pulse:a_pulse};
  R3D.scene.add(root);return a;
}
function freeActor(a){a.root.visible=false;a.mixer.stopAllAction();a.atk=null;const p=R3D.pool;(p[a.key]||(p[a.key]=[])).push(a)}
function act(a,name){const c=R3D.clips[name];return c?a.mixer.clipAction(c):null}
// אנימציית בסיס בלולאה (ריצה, עמידה). מעבר רך בין אנימציות
function loop(a,name,speed=1){
  if(a.base===name){const x=act(a,name);if(x)x.timeScale=speed;return}
  const prev=a.base?act(a,a.base):null,next=act(a,name);if(!next)return;
  next.reset().setLoop(THREE.LoopRepeat).setEffectiveWeight(1).fadeIn(0.15).play();next.timeScale=speed;
  if(prev){if(prev.getClip().name.split('@')[0]===name.split('@')[0])next.time=prev.time;prev.fadeOut(0.15)}
  a.base=name;
}
// אנימציה חד-פעמית (תקיפה, מוות). dur: כמה שניות היא צריכה להימשך
// skip: איזה חלק מתחילת האנימציה מדלגים (ההכנה), כך שהתנוחה מגיעה מיד והזמן dur הולך על ההמשך (HERO_SKIP)
function once(a,name,dur,hold=false,skip=0){
  const x=act(a,name);if(!x)return;
  if(a.one&&a.one!==x)a.one.fadeOut(0.08);
  const d=x.getClip().duration;
  x.reset().setLoop(THREE.LoopOnce,1);x.clampWhenFinished=hold;x.timeScale=dur?d*(1-skip)/dur:1;x.time=d*skip;x.fadeIn(skip?0.03:0.06).play();a.one=x;
}
/* גיבור בלי הכנה (ניר, 7.11, מסרטון של מפתח Diablo 3: "לפעולות של השחקן אין הכנה"): תקיפה וסקיל מתחילים כבר באמצע התנועה.
   כמה מדלגים מכל אנימציה (חלק מהאורך). רק לגיבור, ורק בעולם ובכפר (SKCAST.where). לאויבים ולבוס ההכנה נשארת, כי היא האזהרה */
const HERO_SKIP={Melee_1H_Attack_Chop:0.3,Melee_1H_Attack_Slice_Horizontal:0.25,Melee_2H_Attack_Chop:0.35,Melee_2H_Attack_Spin:0.2,
  Ranged_Magic_Shoot:0.15,Ranged_Magic_Spellcasting:0.35,Ranged_Magic_Summon:0.3,Melee_Block:0.15,Ranged_Bow_Release:0};
const heroSkip=n=>SKCAST.where()?(HERO_SKIP[n]||0):0;
function place(a,x,y,foot,yaw,lift=0){
  const S_=SIN();a.root.position.set(x,(lift+(TR&&S.wd?hAt(x,y):0))/COS(),(y+foot)/S_);   // hAt: על הרכס הדמות עומדת גבוה יותר (terrain.js)
  if(yaw!=null){let d=yaw-a.root.rotation.y;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;a.root.rotation.y+=d*0.35}
}
// כיוון במשחק (זווית על המסך) לסיבוב סביב ציר y בעולם
const yawOf=(dx,dy)=>Math.atan2(dx,dy/SIN());
function setFlash(a,k,col){for(const m of a.mats){if(k>0)m.emissive.set(col||0xffffff).multiplyScalar(k);else if(m.userData.em)m.emissive.copy(m.userData.em);else m.emissive.set(0)}}

/* שריון לפי דרגה (RANKS ב-ranks.js): מדליקים ומכבים חלקים שכבר יש במודל, וזוהר בצבע הדרגה על מה שנדלק.
   חלק נמצא לפי הסוף של השם שלו (Knight_Cape ← 'Cape'). חלק שאין במודל, למשל בדמות של ניר, לא קיים כאן ולא קורה כלום */
const ARMOR3D=[...new Set([...RANKS.bare,...Object.values(RANKS.list).flatMap(R=>R.look?R.look.show:[])])];
function armorPart(o,parts){const n=o.name||(o.parent&&o.parent.name)||'';return parts.find(p=>n.endsWith('_'+p))||null}
function rankArmor3d(a){
  const id=rankId(),R=RANKS.list[id],look=R&&R.look;if(a.rk===id)return;a.rk=id;
  a.root.traverse(o=>{if(!o.isMesh)return;const p=armorPart(o,ARMOR3D);if(!p)return;
    const on=look&&look.show.includes(p);o.visible=on||!RANKS.bare.includes(p);
    const em=on&&look.glow?new THREE.Color(R.col).multiplyScalar(look.glow):new THREE.Color(0);
    o.material.emissive.copy(em);o.material.userData.em=em});
}
function syncPlayer(dt){
  r3dScratch();
  const L=heroLook();
  let a=R3D.player;if(!a||a.key!==lookKey(L)){if(a)freeActor(a);a=R3D.player=makeActor(L)}   // דמות או נשק חדשים: מודל חדש
  rankArmor3d(a);   // אחרי עלייה בדרגה: החלקים מופיעים מיד
  if(GEAR3D.on)gear3dParts(a,L);
  armor3d(a);   // שריון לפי מחלקה (armor.js)
  const sword=P.weapon==='sword';
  for(const k in a.props)a.props[k].visible=k==='shield'?sword:(k==='sword')===sword;
  gtShow3d(a);   // מכה במקור: הכלי ביד במקום הנשק (gtool.js)
  const st=a.st||(a.st={anim:0,gt:0,inv:0,mode:''});
  if(S.mode==='over'){if(st.mode!=='over'){st.mode='over';a.base=null;a.mixer.stopAllAction();once(a,S.won?L.anim.win:S.mb&&MB&&MB.draw?L.anim.idle:L.anim.die,1.2,true)}}   // תיקו במשחקי השאול (MB.draw): עומד, לא נופל
  else{
    if(st.mode==='over'){st.mode='';a.one=null;a.mixer.stopAllAction()}
    // תקיפה: רק פלג הגוף העליון, כך שאפשר לתקוף תוך כדי ריצה
    // סקיל (skillcast.js): התנועה של ההטלה גוברת לרגע על תנועות התקיפה. רק מראה, התקיפה עצמה ממשיכה
    if(P.skCast&&st.sc!==P.skCast.n&&performance.now()-P.skCast.at<SKCAST.dur*1000){st.sc=P.skCast.n;st.scT=SKCAST.dur;{const c=skcClip(L);once(a,c+'@up',SKCAST.dur,false,heroSkip(c))}}
    st.scT=Math.max(0,(st.scT||0)-dt);const casting=st.scT>0;
    const swing=!casting&&sword&&P.sw.anim>st.anim,shot=!casting&&!sword&&P.gn.t>st.gt+0.01;
    st.anim=P.sw.anim;st.gt=P.gn.t;
    const tk=gtHeld(),swA=tk?gtAnim(tk):L.anim.sword,gnA=tk?gtAnim(tk):L.anim.gun;   // כלי ביד: גרזן חוטב, מכוש כורה (gtool.js)
    if(tk&&(swing||shot))GTOOL.stat.anim[tk]=(GTOOL.stat.anim[tk]||0)+1;
    if(swing)once(a,swA+'@up',Math.max(0.28,Math.min(0.5,P.sw.cd*wK('cd')*0.8)),false,heroSkip(swA));
    const gcd=P.gn.cd*wK('cd');
    if(shot){st.shots=(st.shots||0)+1;once(a,gnA+'@up',Math.max(tk?0.3:0.2,Math.min(0.45,gcd*0.9)),false,heroSkip(gnA))}
    // קשת: מותחים את המיתר ממש לפני החץ הבא, כשיש במי לירות
    const drawT=Math.min(0.4,gcd*0.5);
    if(!casting&&!sword&&!tk&&L.anim.gunDraw&&P.gn.t>0&&P.gn.t<=drawT&&st.drawn!==st.shots&&nearest(440)&&!(a.one&&a.one.isRunning())){st.drawn=st.shots;once(a,L.anim.gunDraw+'@up',P.gn.t)}
    // פגיעה (combat.js מדליק P.inv=0.6): הגוף נרתע, אם הוא לא באמצע תקיפה
    const hurt=P.inv>st.inv+0.3&&P.inv<=0.7;st.inv=P.inv;
    if(hurt&&!casting&&!swing&&!shot&&!(a.one&&a.one.isRunning()))once(a,L.anim.hit+'@up',0.3);
    if(P.skrCast&&st.cast!==P.skrCast){st.cast=P.skrCast;once(a,(R3D.clips[SKREVEAL.anim+'@up']?SKREVEAL.anim:L.anim.win)+'@up',SKREVEAL.cast)}   // סקיל חדש: הגיבור מטיל (skillreveal.js)
    const busy=a.one&&a.one.isRunning(),idle=!sword&&!tk&&L.anim.gunIdle||L.anim.idle;   // עם קשת ביד: עמידה עם קשת
    loop(a,(P.moving?L.anim.run:idle)+(busy?'@low':''),P.moving?Math.min(1.6,P.speed/165):1);
  }
  // הגוף לפי P.face: לאן שהולכים (update.js). הסיבוב הרך כבר שם, אז כאן בלי עיכוב נוסף
  place(a,P.x,P.y,L.foot,null);a.root.rotation.y=yawOf(Math.cos(P.face),Math.sin(P.face));hf3d(a,null);   // הכנה והתאוששות במכה (hitfeel.js)
  a.root.visible=!(P.inv>0&&Math.floor(P.inv*20)%2===0)||RM;
  setFlash(a,P.inv>0.45?0.5:P.swapBuff>0?0.25:0,P.inv>0.45?C.blood:C.gold);
  if(a.pulse&&!(P.inv>0.45||P.swapBuff>0)){const k=1+GEAR3D.pulse*Math.sin(performance.now()/1000*GEAR3D.rate);for(const m of a.pulse)m.emissive.copy(m.userData.em).multiplyScalar(k)}   // אגדי פועם (GEAR3D)
  a.mixer.update(dt);
  // איפה הנשק על המסך, בשביל הזוהר של Aging שמצויר בקנבס (aging.js). מהעולם חזרה לקואורדינטות המשחק
  const w=a.props[sword?'sword':'gun'];if(w){const v=w.getWorldPosition(R3D._v||(R3D._v=new THREE.Vector3()));AGE_FX.hand={x:v.x,y:v.z*SIN()-v.y*COS()}}
  // קצה הלהב (הברק של הסקיל יוצא ממנו, skills.js): הלהב לאורך y המקומי של הנשק, עד הגובה של הצורה שלו
  if(w&&sword){const len=w.userData.tip??(w.userData.tip=(()=>{let m=0;w.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();m=Math.max(m,o.geometry.boundingBox.max.y)}});return m})());
    const t=w.localToWorld((R3D._v2||(R3D._v2=new THREE.Vector3())).set(0,len,0));AGE_FX.tip={x:t.x,y:t.z*SIN()-t.y*COS()}}else AGE_FX.tip=null;
  mark('shadow',a.root.position.x,a.root.position.z,16);
}
function syncEnemy(e,dt){
  let a=R3D.actors.get(e);const L=lookOf(e);if(!L||!a&&!m3dNeed(L.model))return;   // עוד נטען (m3d.js): לרגע בלי גוף, הצל והטבעת בקנבס
  if(!a){a=makeActor(L);R3D.actors.set(e,a);
    if(!e.isBoss){a.root.scale.setScalar(L.h/COSB()/R3D.tmpl[L.model].userData.h*(e.wboss?1:e.big||1));a.sc0=a.root.scale.x}   // ענק: h הוא כבר הגובה הסופי
    // קמים מהאדמה רק בפעם הראשונה, ולא בכל פעם שאויב חוזר למסך
    if(L.anim.spawn&&!e.isBoss&&!e.wboss&&!R3D.shown.has(e)){once(a,L.anim.spawn,0.45)}
    R3D.shown.add(e);
    a.prev={x:e.x,y:e.y,patT:e.patT||0,charge:null}}
  a.seen=R3D.frame;
  const dx=e.x-a.prev.x,dy=e.y-a.prev.y,sp=Math.hypot(dx,dy)/Math.max(dt,1e-3);
  let yaw=null;
  if(e.isBoss){
    const b=e,st=a.prev;
    if(b.charge&&b.charge.stage===1&&st.charge!==1)once(a,L.anim.charge,0.45);
    else if(b.charge&&b.charge.stage===0&&st.charge!==0)once(a,L.anim.taunt,0.75);
    else if(!b.charge&&b.patT>st.patT+0.5)once(a,L.anim.cast,0.5);
    st.charge=b.charge?b.charge.stage:null;st.patT=b.patT;
    yaw=b.charge?yawOf(Math.cos(b.charge.a),Math.sin(b.charge.a)):yawOf(P.x-b.x,P.y-b.y);
    a.root.scale.setScalar(L.h/COSB()/R3D.tmpl[L.model].userData.h*(b.phase>1?1.12:1)*(b.r/34));
    loop(a,sp>15?L.anim.run:L.anim.idle,Math.max(0.7,Math.min(1.8,sp/90)));
  }else if(e.wboss){
    // ענק (giant.js): פונה אליך, עומד בזמן ההכנה למכה, ומכה כשהיא יוצאת. ההליכה איטית וכבדה
    const st=a.prev;if(st.tel&&!e.tel||e.dash&&!st.dash)once(a,L.anim.hit,0.6);st.tel=!!e.tel;st.dash=!!e.dash;
    yaw=e.dash?yawOf(Math.cos(e.dash.a),Math.sin(e.dash.a)):yawOf(P.x-e.x,P.y-e.y);
    if(!(a.one&&a.one.isRunning()))loop(a,sp>15&&!e.tel?L.anim.run:L.anim.idle,Math.max(0.6,Math.min(1.4,sp/(e.speed||60))));
  }else{
    // לאן שהוא הולך. כשהוא נהדף אחורה (kx,ky) הוא ממשיך להסתכל עליך, ולא מסתובב עם המכה
    yaw=sp>5&&Math.hypot(e.kx||0,e.ky||0)<sp?yawOf(dx,dy):yawOf(P.x-e.x,P.y-e.y);
    if(e.sw>0)yaw=yawOf(Math.cos(e.sa),Math.sin(e.sa));else if(e.act&&e.act!=='flee'&&e.aa!=null)yaw=yawOf(Math.cos(e.aa),Math.sin(e.aa));   // מתקפה: פונה לאן שהיא תפגע
    if(!foeAtk3d(e,a,L)){
      if(e.type==='wisp'&&e.shoot<0.35&&L.anim.cast&&!(a.one&&a.one.isRunning()))once(a,L.anim.cast,0.5);
      if(!(a.one&&a.one.isRunning()&&a.one.getClip().name===L.anim.spawn))loop(a,L.anim.run,Math.max(0.6,Math.min(1.8,sp/(e.speed||80))));
    }
  }
  const lift=(L.float?L.float+Math.sin(e.ph*0.6)*3:0)+(e.wboss?giantLift(e,L):0)   // ענק בכניסה: קם מהאדמה או נוחת מהשמיים
    +(e.act==='jump'&&e.am?Math.sin(Math.PI*Math.min(1,1-e.at/e.am))*FOEATK3D.jump:0);   // קפיצה (foeai.js): באוויר בדרך אליך
  place(a,e.x,e.y,e.wboss?L.foot:L.foot*(e.big||1),yaw,lift);hf3d(a,e);   // נוטה אחורה במכה (hitfeel.js)
  const rage=e.isBoss&&e.rage>0.05?e.rage:0;
  const tk=e.isBoss||e.wboss?-1:foeTele(e),F=FOEATK3D;   // מתכונן למתקפה: מאדים (strike.js מדליק e.flash קטן בהכנה, בשביל הדו-ממד. מכה אמיתית היא 0.09)
  // world and village: a hit makes it brighter in its own colours, in a short gap-limited blink, never white (hitflash3d.js)
  const wHit=typeof hitFlashHere==='function'&&hitFlashHere();if(wHit)hitBright(a,hitFlash3d(a,L,e.flash>(e.act?FOEATK3D.actFlash:0),dt));else if(a.hb)hitBright(a,0);
  if(tk>=0&&!(e.flash>0.06))setFlash(a,(F.glowK[0]+(F.glowK[1]-F.glowK[0])*tk)*(0.8+0.2*Math.sin(S.t*20)),F.glow);
  // לבן רק במכה אמיתית. foeai.js משאיר e.flash קטן (0.04) כל הפעולה, בשביל הדו-ממד, ובתלת-ממד זה צבע את המסתער בלבן מלא
  // לאורך כל ההסתערות והסחרור (ניר, 7.11: "זקן-הקליפה לבן"). בהסתערות ובקפיצה עצמן: הזוהר האדום של המתקפה, במלואו
  else if((e.act==='dash'||e.act==='jump')&&!(e.flash>FOEATK3D.actFlash))setFlash(a,F.glowK[1],F.glow);
  else{let hit=e.flash>(e.act?FOEATK3D.actFlash:0),fk=0.9;
    if(wHit)hit=false;   // world and village: no white, the blink is hitBright above (hitflash3d.js)
    setFlash(a,hit?fk:rage?0.15+0.35*rage*(0.6+0.4*Math.sin(S.t*14)):0,hit?0xffffff:C.blood)}
  if(a.sc0){const q=juiceSquash(e)+(e.act==='crouch'?F.squat*Math.max(0,tk):0);a.root.scale.set(a.sc0*(1+q),a.sc0*(1-q),a.sc0*(1+q))}   // מעיכה קטנה במכה (juice.js)
  // כשיש הרבה אויבים, כל אחד מונפש רק בכל פריים שני (חצי מהם בכל פריים). בעין זה לא נראה, ובטלפון זה חוסך הרבה
  a.acc=(a.acc||0)+dt;
  if(e.isBoss||e.wboss||R3D.actors.size<25||((a.id||(a.id=++R3D.nid))+R3D.frame)%2===0){a.mixer.update(a.acc);a.acc=0}
  a.prev.x=e.x;a.prev.y=e.y;
  const z=a.root.position.z,x=a.root.position.x,rr=e.r*1.15*(e.wboss?GIANT.shadow:1);   // ענק: צל גדול על הקרקע
  mark('shadow',x,z,rr);if(e.weak)mark(e.weak,x,z,rr*1.15);
}
// אויב שנעלם מהרשימה: אם הוא מת, מנגנים מוות ושוקע לאדמה. אם ברח (המבוקש), יצא מהמסך, עבר לקהל,
// או שכבר יש יותר מדי מתים על המסך, הדמות חוזרת מיד למאגר
function retire(e,a,dt){
  if(!a.dieT){const L=a.L;setFlash(a,0);
    const big=e.wboss&&e.dead&&e.hp<=0;   // ענק: קריסה איטית (GIANT.die), גם כשיש הרבה מתים על המסך
    if(!big&&!(e.dead&&e.hp<=0&&L.anim.die&&R3D.nDying++<CROWD.dying)){R3D.actors.delete(e);freeActor(a);return}
    a.dieT=big?GIANT.die.t:1.1;a.sink=big?GIANT.die.sink:0.35;a.base=null;once(a,L.anim.die,big?GIANT.die.anim:0.7,true)}
  a.dieT-=dt;a.mixer.update(dt);
  if(a.dieT<a.sink)a.root.position.y-=dt*(a.sink>0.35?a.L.h*0.4/a.sink:60);
  if(a.dieT<=0){R3D.actors.delete(e);freeActor(a)}
}

// אנימציית המתקפה של אויב רגיל בעולם (FOEATK3D). מחזיר true כשהיא מתנגנת, ואז לא מנגנים ריצה מעליה
function foeAtk3d(e,a,L){
  const F=FOEATK3D,c={...F.def,...F.clip[L.model],...L.atk},st=a.prev,ph=e.sw>0?'sw':e.act||'',tk=foeTele(e);
  if(ph!==st.ph){
    const was=st.ph;st.ph=ph;
    const pick=ph==='sw'||ph==='crouch'?c.hit:ph==='wind'?c.brace||c.hit:ph==='aim'?c.cast||c.hit:null;
    if(pick&&act(a,pick)){if(a.base){const b=act(a,a.base);if(b)b.fadeOut(0.12);a.base=null}   // מפסיקים לרוץ: עומד ומתכונן
      once(a,pick,1,true);a.one.timeScale=0;a.atk=pick}
    else if(a.atk&&(was==='sw'||FOE_TELE[was])){const x=act(a,a.atk),D=x.getClip().duration;   // ההכנה נגמרה: המתקפה יוצאת
      if(was==='aim'&&c.shoot&&act(a,c.shoot)){once(a,c.shoot,0.3);a.atk=c.shoot}   // הירייה יוצאת
      else if(was==='wind'&&c.brace&&c.hit!==a.atk){once(a,c.hit,Math.max(0.3,e.at||0.5));a.atk=c.hit}   // הסתערות: מכה עם המגן לאורך כל הריצה
      else{x.clampWhenFinished=false;x.time=D*F.up;x.timeScale=D*(1-F.up)/(ph==='jump'&&e.am?e.am:F.fast)}}   // המכה עצמה (וגם הקפיצה): שאר הקליפ מהר
  }
  if(tk>=0&&a.atk&&a.one){const D=a.one.getClip().duration;a.one.time=D*F.up*tk}   // ההכנה: הנשק עולה עם ההתקדמות, וגם נעצר כשהאויב קפוא
  if(a.atk&&!(a.one&&a.one.isRunning())&&tk<0){a.atk=null;return false}
  return !!a.atk;
}

/* ---- הכפר ---- */
// מודל במקום (x,y) במשחק, בגודל w פיקסלים לרוחב, יושב על הקרקע
function vPut(model,x,y,w,rot=0,group=R3D.vil.g){
  const t=R3D.props[model],m=t.clone(true),bb=t.userData.bb||(t.userData.bb=new THREE.Box3().setFromObject(t));
  const s=w/Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,1e-3);
  m.scale.setScalar(s);m.rotation.y=rot;m.position.set(x,-bb.min.y*s,y/SIN());group.add(m);return m;
}
function syncVillage(){
  let V=R3D.vil;
  if(!V){V=R3D.vil={g:new THREE.Group(),b:{},stock:{}};R3D.scene.add(V.g);
    for(const d of villageDecor()){const D=VIL3D.decor[d.kind],md=Array.isArray(D.model)?D.model[d.v<0.5?0:1]:D.model;vPut(md,d.x,d.y,D.w*(0.8+d.v*0.4),d.v*6.28)}
    const g=VILLAGE.gate;vPut(VIL3D.gate.model,g.x,g.y,VIL3D.gate.w);
    for(const k in VIL3D.stock){const B=VILLAGE.b[k];V.stock[k]=vPut(VIL3D.stock[k].model,B.x+B.r*1.05,B.y-B.r*0.25,VIL3D.stock[k].w)}}
  V.g.visible=true;
  // מבנה שעלה רמה מתחלף לפי vLook: פיגום עד שנבנה, ואחר כך המודל, הגודל, הקישוטים והזוהר של הרצועה שלו
  for(const k in VILLAGE.b){
    const B=VILLAGE.b[k],lk0=vLook(k),ok=!lk0||[VIL3D.models[lk0.model].model,...lk0.deco.map(d=>VIL3D.deco[d].model)].every(m3dNeed),lk=ok?lk0:null;   // מודל שעוד נטען (vx_, m3d.js): בינתיים הפיגום
    const plot=!lk&&!vLv(k)&&VIL3D.plot&&m3dNeed(VIL3D.plot.model);   // עוד לא נבנה: חלקת עפר (vgrowth.js), לא פיגום. הפיגום רק בזמן בנייה
    const key=lk?lk.model+lk.L:plot?'plot':'site',cur=V.b[k];
    if(cur&&cur.key===key)continue;if(cur)for(const m of cur.all)V.g.remove(m);
    const D=lk?VIL3D.models[lk.model]:plot?VIL3D.plot:VIL3D.site,m=vPut(D.model,B.x,B.y,D.w*(lk?lk.size:1)),all=[m];
    if(lk){if(lk.glow)m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive.set(lk.glow).multiplyScalar(0.1)}});
      lk.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length];all.push(vPut(VIL3D.deco[d].model,B.x+dx*B.r,B.y+dy*B.r,VIL3D.deco[d].w))})}
    V.b[k]={key,all};
  }
  for(const k in V.stock)V.stock[k].visible=vStock(k)>0;
}
// קקטוס וקני סוף: נבנים בקוד (אין בחבילות החינמיות), גיאומטריה אחת לכל אחד כדי שיהיו ציור אחד
function natureProp(k){
  if(R3D.props[k])return R3D.props[k];
  const parts=[],C=(r,h,x,y,z,rz=0)=>{const g=new THREE.CylinderGeometry(r*0.85,r,h,7);g.translate(0,h/2,0);if(rz)g.rotateZ(rz);g.translate(x,y,z);parts.push(g)};
  let col;
  if(k==='n_cactus'){col='#5c9a45';C(0.17,1,0,0,0);C(0.11,0.28,0,0,0,Math.PI/2);parts[1].translate(0.03,0.42,0);C(0.1,0.32,0.3,0.42,0);
    C(0.1,0.22,0,0,0,-Math.PI/2);parts[3].translate(-0.02,0.58,0);C(0.09,0.26,-0.26,0.58,0)}
  else{col='#5f7f3a';for(let i=0;i<9;i++){const a=i*2.4,r=0.05+0.17*Math.sqrt(i/9),h=0.6+((i*37)%10)/22;const g=new THREE.ConeGeometry(0.035,h,4);g.translate(Math.cos(a)*r,h/2,Math.sin(a)*r);parts.push(g)}}
  const geo=THREE.mergeGeometries(parts.map(g=>g.toNonIndexed()));geo.computeVertexNormals();
  const root=new THREE.Group();root.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:col,flatShading:true})));
  return R3D.props[k]=root;
}
// קישוט או מקור לפי המפרט ב-W3D (decor, kinds): צבע (tint) בעותק של התבנית, וגודל לפי גובה (h) או רוחב (w)
function wPut(D,x,y,v,mul,g){
  const sp=D.pick?D.pick[Math.floor(v*D.pick.length)%D.pick.length]:D,md=Array.isArray(sp.model)?sp.model[v<0.5?0:1]:sp.model,key=md+(sp.tint||'')+(sp.snow||'');
  if(md==='n_cactus'||md==='n_reeds')natureProp(md);
  if((sp.tint||sp.snow)&&!R3D.props[key]){const t=R3D.props[md].clone(true),c=new THREE.Color(sp.tint||'#fff'),w=new THREE.Color('#f2f8fc');
    t.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(c);if(sp.snow)o.material.emissive.copy(w).multiplyScalar(sp.snow)}});R3D.props[key]=t}   // שלג: אור לבן מבפנים (הצבע עצמו מגיע מטקסטורה)
  const t=R3D.props[key],bb=t.userData.bb||(t.userData.bb=new THREE.Box3().setFromObject(t));
  const w=sp.h?sp.h*Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,1e-3)/Math.max(bb.max.y-bb.min.y,1e-3):sp.w;
  const m=vPut(key,x,y,w*mul,v*6.28,g);
  if(sp.glow)m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive.set(sp.glow).multiplyScalar(0.5)}});
  return m;
}
// מים במראה החדש: עיגול עם שוליים רכים (שקיפות שיורדת בקצה), והחוף של ground.js נראה מתחתיו. קרח מבריק, לבה זוהרת
function pondMat(Wt){
  const A=pondMat.a||(pondMat.a=(()=>{const T=128,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d'),gr=g.createRadialGradient(T/2,T/2,0,T/2,T/2,T/2);
    gr.addColorStop(0,'#fff');gr.addColorStop(0.8,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,T,T);return new THREE.CanvasTexture(c)})());
  const m=new THREE.MeshLambertMaterial({color:Wt.col,alphaMap:A,transparent:true,opacity:0.95,depthWrite:false});
  if(Wt.glow){m.emissive.set(Wt.glow);m.emissiveIntensity=Wt.g}
  return m;
}
// העולם הפתוח: קישוטים, שערים, מים ומקורות משאבים נבנים פעם אחת לכל אזור (המקומות קבועים). מקור שנשבר נעלם עד שהוא צומח.
// דרך שהעלילה עוד לא פתחה (WORLD.paths) מוסתרת
function syncWorld(){
  const A=R3D.wlds||(R3D.wlds={}),reg=S.wd.reg||'meadow',RG=WR(),W=W3D.regions[reg]||{};let G=A[reg];
  if(!G){G=A[reg]={g:new THREE.Group(),nodes:{},paths:{}};R3D.scene.add(G.g);
    const hd=typeof HD!=='undefined'&&HD.on,DEC=hd&&W3D.decor[reg];G.kinds=hd;   // קישוטים לפי אזור (W3D.decor), במראה החדש
    for(const d of worldDecor()){const D=DEC&&DEC[d.kind];if(D){wPut(D,d.x,d.y,d.v,0.8+d.v*0.4,G.g);continue}
      const V=VIL3D.decor[d.kind],md=Array.isArray(V.model)?V.model[d.v<0.5?0:1]:V.model;vPut(md,d.x,d.y,V.w*(0.8+d.v*0.4),d.v*6.28,G.g)}
    const gs=wGates(true);for(const k in gs){const m=vPut(VIL3D.gate.model,gs[k].x,gs[k].y,VIL3D.gate.w,0,G.g);if(wIsPath(k))G.paths[k]=m}
    const Wt=hd&&(W3D.water[reg]||W3D.water.meadow);
    for(const p of RG.ponds||[]){const m=new THREE.Mesh(new THREE.CircleGeometry(p.r,40),Wt?pondMat(Wt):new THREE.MeshLambertMaterial({color:W.pond||'#2a6d8f',transparent:true,opacity:0.9}));
      m.rotation.x=-Math.PI/2;m.scale.set(1,1/SIN(),1);m.position.set(p.x,0.6,p.y/SIN());G.g.add(m);if(Wt&&Wt.pulse)(G.pulse||(G.pulse=[])).push([m.material,Wt])}
    secrets3D(reg,(md,x,y,w,r)=>vPut(md,x,y,w,r,G.g));   // סודות (secrets.js)
    if(typeof props3dWorld==='function')props3dWorld(G,reg);   // הפנס, המקדש, מגדל התצפית והתיבה (props3d.js)
    if(TR&&TR.reg===reg){for(const o of G.g.children)tLift(o);terrain3d(G,reg)}}   // המפה: מים זורמים, גשרים, יער, צוקים ורכס (terrain.js). tLift: מה שעומד על הרכס עולה איתו
  R3D.wld=G;G.g.visible=true;
  if(typeof props3dWorldTick==='function')props3dWorldTick(G);
  if(typeof ridge3d==='function')ridge3d(G);   // מפולות מתגלגלות (ridge-hazards.js)
  terrain3dTick(G);   // זרימת המים, ואריחי יער רחוקים מוסתרים
  sr3d(G,reg);   // הסלעים המרחפים בלב הצל (shadowrocks.js)
  if(G.pulse){const t=performance.now()/1000;for(const [m,Wt] of G.pulse)m.emissiveIntensity=Wt.g*(1+Wt.pulse*Math.sin(t*1.7+Math.sin(t*0.6)*2))}   // לבה שנושמת
  for(const k in G.paths)G.paths[k].visible=wPathOpen(RG.paths[k]);
  for(const n of S.nd.list){
    let m=G.nodes[n.id];
    const K=G.kinds&&W3D.kinds[n.kind];if(!m&&K)m=G.nodes[n.id]=wPut(K,n.x,n.y,hash(n.x,n.y),0.85+hash(n.x,n.y)*0.3,G.g);   // אורן, קקטוס, עץ מת (W3D.kinds)
    if(!m&&typeof props3dNode==='function'&&(m=props3dNode(n,G.g)))G.nodes[n.id]=m;   // עורקים, גבישים ותיבות (props3d.js)
    if(!m){const D=W3D.nodes[wKind(n.kind).shape],v=hash(n.x,n.y),md=Array.isArray(D.model)?D.model[v<0.5?0:1]:D.model;
      m=G.nodes[n.id]=vPut(md,n.x,n.y,D.w*(0.85+v*0.3),v*6.28,G.g);
      if(D.glow)m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive.set(D.glow).multiplyScalar(0.5)}})}
    nzBig3d(n,m);if(m.userData.lift==null){tLift(m);const L=W3D.log;if(wKind(n.kind).shape==='tree'){m.userData.log=vPut(L.model,n.x+n.r*L.dx,n.y+n.r*L.dy,L.w,hash(n.y,n.x)*6.28,G.g);tLift(m.userData.log)}}   // בול ליד עץ שאפשר לכרות
    m.visible=!n.dead&&(!TR||Math.abs(n.x-S.cam.x)+Math.abs(n.y-S.cam.y)<TERRAIN.cull*1.4);   // באחו הגדול: מקור רחוק לא מצויר
    if(m.userData.log)m.userData.log.visible=m.visible;
    nzPulse(m);gather3d(n,m,G.g);   // nzBig3d/nzPulse: גדולים, ויקרים נושמים אור (nodesize.js). מתכווץ, מתנדנד, נופל, גדם ונבט (gather.js)
  }
}
// תושבי הכפר: דמות לכל תושב שנמצא בכפר, והקישוטים בפינה של מי שאין לו מבנה. המצב (הולך, עובד, מנופף) מגיע מ-npc.js
function syncNpcs(dt){
  const all=npcState(),A=R3D.npcs||(R3D.npcs={}),V=R3D.vil;
  resSync3d();vpSync3d();   // הבתים של מי שעברה מהעולם (residents.js), והסדנה לפי השלב (vproj.js)
  if(!V.npcDeco){V.npcDeco=1;for(const id in NPC.list){const sp=NPC.list[id].spot;if(sp)sp.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length];vPut(VIL3D.deco[d].model,sp.x+dx*40,sp.y+dy*40,VIL3D.deco[d].w)})}}
  for(const id in NPC.list){
    const L=LOOK3D['npc_'+id],n=all[id];let a=A[id];
    if(!npcHere(id)||!L){if(a){freeActor(a);delete A[id]}continue}
    if(!a){a=A[id]=makeActor(L);a.npcSt=null}
    if(!(a.root.visible=onScreen(n.x+R3D.ox,n.y+R3D.oy)))continue;   // מחוץ למסך: לא מציירים ולא מנפישים (מבקר 2: מהירות)
    if(a.own)a.own.visible=L.own!==false;
    if(a.npcSt!==n.st){a.npcSt=n.st;if(n.st==='wave'||n.st==='cheer')once(a,L.anim[n.st],n.st==='wave'?NPC.waveT:NPC.cheerT);else a.one=null}
    const busy=a.one&&a.one.isRunning();
    loop(a,(n.st==='walk'?L.anim.walk:n.st==='work'?L.anim.work:L.anim.idle)+(busy?'@low':''),n.st==='walk'?0.8:1);
    place(a,n.x,n.y,L.foot,yawOf(Math.cos(n.face),Math.sin(n.face)));
    a.mixer.update(dt);mark('shadow',a.root.position.x,a.root.position.z,15);
  }
}
// חיית המחמד: המצב (הולכת, רצה, יושבת, חופרת) מ-pet.js. בשלב 3 הסימנים פועמים, ומיקום קצה הזנב נשלח ללהבה בקנבס
function syncPet(dt){
  const p=S.pet;let a=R3D.pet;
  if(!p||!petHere()){if(a)a.root.visible=false;return}
  const L0=LOOK3D['pet_'+(SAVE.pet.kind||PET.default)+(SAVE.pet.stage+1)];if(!L0)return;
  if(!m3dNeed(L0.model)){if(a)a.root.visible=false;return}   // שלב חדש שעוד נטען (m3d.js): לרגע מוסתרת
  const L=Object.assign({h:petStage().h},L0);
  if(!a||a.key!==lookKey(L)){if(a)freeActor(a);a=R3D.pet=makeActor(L);a.st=null;a.bark=0}
  a.root.visible=true;
  if(a.st!==p.st&&p.st==='jump')once(a,L.anim.jump,0.9);
  if(p.barkAt!=null&&p.barkAt!==a.bark){a.bark=p.barkAt;once(a,L.anim.bark,0.6)}
  a.st=p.st;
  const moving=p.st==='follow'||p.st==='go'||p.st==='back'||((p.st==='hunt'||p.st==='sneak'||p.st==='flee')&&p.run),busy=a.one&&a.one.isRunning();
  if(!busy||moving)loop(a,moving?(p.run?L.anim.run:L.anim.walk):p.st==='dig'?L.anim.dig:p.st==='sit'?L.anim.sit:L.anim.idle,moving&&!p.run?1.4:1);
  place(a,p.x,p.y,L.foot,null);a.root.rotation.y=yawOf(Math.cos(p.face),Math.sin(p.face));
  if(L.glow)for(const m of a.mats)if(m.emissiveMap){m.emissive.set(L.glow);m.emissiveIntensity=0.4+0.35*Math.sin(p.fxT*PET.fx.pulse*6.28)}
  a.mixer.update(dt);
  const t=petStage().fx&&(a.tail||(a.tail=bone(a.root,'Tail6')));
  if(t){const v=t.getWorldPosition(R3D._v||(R3D._v=new THREE.Vector3()));PET_FX.tail={x:v.x,y:v.z*SIN()-v.y*COS()}}else PET_FX.tail=null;
  mark('shadow',a.root.position.x,a.root.position.z,10);
}
function npcs3dOff(){if(!R3D.npcs)return;for(const id in R3D.npcs)freeActor(R3D.npcs[id]);R3D.npcs=null}

// מטריצה ווקטורים לשימוש חוזר, בלי זבל בכל פריים. נוצרים בפעם הראשונה שמישהו צריך אותם, גם לפני הציור הראשון (syncPlayer מהבדיקה)
function r3dScratch(){if(!R3D._mx){R3D._mx=new THREE.Matrix4();R3D._p=new THREE.Vector3();R3D._q=new THREE.Quaternion();R3D._s=new THREE.Vector3();R3D._up=new THREE.Vector3(0,1,0)}}

// הכפר: מכינים מראש את כל ה-shaders של מה שבכפר, גם של מה שעוד לא על המסך. אחרת בפעם הראשונה שמבנה, קישוט או תושב נכנס למסך
// הציור נעצר להכנה שלו, והדמות "קופצת" באמצע ההליכה (ניר, 2.11: "התנועה מקוטעת"). רץ שוב רק כשנוסף משהו לכפר
function vilWarm(r,c){
  const n=R3D.vil.g.children.length+Object.keys(R3D.npcs||{}).length+(R3D.pet?1:0);if(R3D.vilWarm===n)return;R3D.vilWarm=n;
  try{if(r.compileAsync)r.compileAsync(R3D.scene,c).catch(()=>{});else r.compile(R3D.scene,c)}catch(e){}
}
// העולם: כמו vilWarm. בפעם הראשונה שסוג אויב חדש נכנס למסך, הטלפון מכין לו shader, טקסטורה וקהל (crowdOf) באמצע הקרב,
// והציור נעצר (ניר, 7.11: "94 fps · 166.1ms" כשזקן-הקליפה הופיע). בכניסה לאזור מכינים מראש דמות אחת מכל סוג באזור (גם הנדירות),
// מצוירת כמה פריימים (כדי שגם הטקסטורות יעלו), ואז למאגר. כך הקפיצה קורה במעבר בשער, ולא באמצע הקרב.
// ועוד (ניר, 7.11 ערב: "107 fps · 215.9ms" כשחלודן הטבוע הופיע): אויב יכול להגיע גם לא מהרשימה של האזור. שומר של מקור משאבים (סלע ← גולם,
// שיח ← ניצנית, nodes.js), נמסיס או ציד מאזור אחר, המבוקש. לכן באזור: גם השומרים של המקורות שלו, הנמסיס שלו והמבוקש. ושאר סוגי העולם
// ברקע, per סוגים כל gap פריימים, פעם אחת למשחק (seen): טקסטורה שעלתה לכרטיס הגרפי נשארת שם (המגן של החלודן, למשל, עלה רק כשהוא הופיע)
const WWARM={frames:3,s:1e-4,per:2,gap:12};   // s: כמה קטנה הדמות בזמן ההכנה. היא על המסך (כדי שהציור האמיתי יכין אותה, compile לבד לא מספיק), אבל קטנה מפיקסל
// כל הסוגים שיכולים להופיע באזור reg (בלי reg: בכל העולם). 'wanted' הוא המראה של המבוקש (lookOf)
function wldTypes(reg){
  const ks=new Set(),add=t=>{if(t&&LOOK3D[t])ks.add(t)},R=reg?[reg==='meadow'?WORLD:WORLD.regions[reg]]:[WORLD,...Object.values(WORLD.regions)];
  for(const W of R){if(!W)continue;for(const G of W.foes||[])add(G.type);
    if(typeof NODES!=='undefined')for(const F of W.fields||[]){const K=NODES.kinds[F.kind];if(K&&K.guard)add(K.guard.type)}}
  if(typeof RARES!=='undefined')for(const id in RARES.list)if(!reg||RARES.list[id].reg===reg)add(id);
  if(reg&&typeof nemOf==='function'){const N=nemOf(reg);if(N)add(N.type)}
  add('wanted');return [...ks];
}
function wldWarm(r,c){
  const reg=S.wd.reg||'meadow',W=R3D.wWarm||(R3D.wWarm={done:{},seen:{},a:null,n:0,q:null,gap:0});
  if(W.a){wldWarmCrowd(W);if(--W.n<=0){for(const a of W.a){a.root.scale.setScalar(a.sc0w);freeActor(a)}W.a=null}}
  if(!W.done[reg]){W.done[reg]=1;
    m3dWorld(reg);   // ברקע: הענק של האזור ומפלצות הזירה (m3d.js)
    if(typeof rareLooks==='function')rareLooks();
    wldWarmSet(r,c,wldTypes(reg));W.q=wldTypes().filter(k=>!W.seen[k]);W.gap=WWARM.gap;return}
  // ברקע: שאר הסוגים של העולם, כמה בכל פעם, כשאין הכנה פתוחה
  if(W.q&&W.q.length&&!W.a&&--W.gap<=0){W.gap=WWARM.gap;wldWarmSet(r,c,W.q.splice(0,WWARM.per))}
}
function wldWarmSet(r,c,ks){
  const W=R3D.wWarm,tmp=[],cs=[];
  for(const k of ks){const L=LOOK3D[k];if(!L)continue;
    if(!R3D.tmpl[L.model]){if(m3dLazy(L.model)&&W.q){m3dNeed(L.model);W.q.push(k)}continue}   // מודל שעוד נטען (m3d.js): בסוף התור
    W.seen[k]=1;if(k!=='wanted'&&crowdOf(k))cs.push(k);   // crowdOf משאיר דמות במאגר. makeActor לוקח אותה ומצייר אותה
    const a=makeActor(L);a.sc0w=a.root.scale.x;a.root.scale.setScalar(WWARM.s);place(a,P.x,P.y,0,null);tmp.push(a)}
  if(!tmp.length)return;
  W.c=cs;W.a=(W.a||[]).concat(tmp);W.n=WWARM.frames;wldWarmCrowd(W);
  try{if(r.compileAsync)r.compileAsync(R3D.scene,c).catch(()=>{});else r.compile(R3D.scene,c)}catch(e){}
}
// גם הקהל (crowdOf): עותק זעיר אחד ליד השחקן בפריימים של ההכנה, אחרת ה-shader שלו (גם של הצל) נבנה כשהקהל מופיע לראשונה
function wldWarmCrowd(W){
  const M=R3D._mx;R3D._p.set(P.x,0,P.y/SIN());R3D._q.identity();R3D._s.setScalar(WWARM.s);M.compose(R3D._p,R3D._q,R3D._s);
  for(const k of W.c||[])for(const p of R3D.crowd[k]||[])for(const m of p)if(!m.count){m.setMatrixAt(0,M);m.count=1}
}
/* נקרא מ-render() אחרי שהקנבס חישב את ההזזה (כולל רעידת מסך), כדי ששתי השכבות יזוזו יחד */
function render3d(ox,oy){
  if(!R3D.on||!P)return;
  r3dScratch();R3D.ox=ox;R3D.oy=oy;   // ההזזה של המסך, לבדיקה מי על המסך (worldnpc.js)
  // drawEvery: הבדיקה האוטומטית מציירת רק חלק מהפריימים, כי שם התלת-ממד רץ על המעבד בלי כרטיס גרפי. בשאר הפריימים לא עושים כלום
  m3dTick();   // מודלים לפי צורך וברקע (m3d.js)
  if(typeof VFX3D!=='undefined')VFX3D.frame();   // אפקטים בתלת-ממד (vfx3d.js): מתקדמים בכל פריים, גם כשהבדיקה לא מציירת
  R3D.frame=(R3D.frame||0)+1;const skip=R3D.drawEvery&&R3D.frame%R3D.drawEvery!==0;if(skip&&!S.vil)return;   // בכפר ממשיכים לעדכן, כי שם נבנים המבנים
  const r=R3D.r,c=R3D.cam,now=typeof FRAME_T==='number'&&FRAME_T>(R3D.last||0)?FRAME_T:performance.now(),dt=Math.min(0.05*(R3D.drawEvery||1),R3D.last?(now-R3D.last)/1000:0)*(S.mode==='play'&&!(S.hitstop>0)?(S.slow>0?0.35:1):S.mode==='over'?1:0);R3D.last=now;
  const pr=r3dPr();if(r.getPixelRatio()!==pr)r.setPixelRatio(pr);   // איכות אפקטים נמוכה או מכשיר חלש: פחות פיקסלים לצייר (R3D_LO)
  if(R3D.w!==W||R3D.h!==H){R3D.w=W;R3D.h=H;if(R3D.sw!==innerWidth||R3D.sh!==innerHeight){R3D.sw=innerWidth;R3D.sh=innerHeight;r.setSize(innerWidth,innerHeight,false)}c.left=-W/2;c.right=W/2;c.top=H/2;c.bottom=-H/2;c.updateProjectionMatrix()}
  // המצלמה מסתכלת על אותה נקודה שבמרכז הקנבס
  const S_=SIN(),cx=W/2-ox,cz=(H/2-oy)/S_;
  c.position.set(cx,2000*S_,cz+2000*COS());c.lookAt(cx,0,cz);
  const gt=R3D.ground.userData.tile;R3D.ground.position.set(Math.round(cx/gt)*gt,0,Math.round(cz/gt)*gt);
  R3D.scene.background.set(S.room?VIEW.room:S.vil?VIEW.village:S.wd?(W3D.regions[S.wd.reg]||{}).bg||VIEW.world:arenaFloor('d3')||VIEW.ground);R3D.ground.material.color.set(S.room?'#5b4a24':S.vil?VIEW.villageLine:S.wd?(W3D.regions[S.wd.reg]||{}).line||VIEW.worldLine:arenaFloor('line')||VIEW.groundLine);
  if(typeof aLookColors==='function')aLookColors();   // הזירה: שמיים ואובך לפי הפלטה (arena-look.js)
  if(typeof maze3d==='function')maze3d();
  if(typeof ardg3d==='function')ardg3d();   // רגע הסכנה של הבוס: מילוי וחריכה על הרצפה בסצנה, מתחת לדמויות (arena-danger3d.js)   // קירות הזירה כקופסאות בסצנה, מאחורי ולפני הדמויות (maze3d.js). מחוץ לזירה הם נעלמים
  for(const k in R3D.marks)R3D.marks[k].count=0;
  for(const k in R3D.crowd)if(R3D.crowd[k])for(const p of R3D.crowd[k])for(const m of p)m.count=0;
  R3D.nCrowd=0;
  if(R3D.vil)R3D.vil.g.visible=false;
  for(const k in R3D.wlds||{})R3D.wlds[k].g.visible=false;
  if(!S.room&&!S.mb)syncPet(dt);else if(R3D.pet)R3D.pet.root.visible=false;   // חיית המחמד (pet.js), בכל מקום חוץ מחדר הבונוס
  if(S.vil){syncPlayer(dt);syncVillage();syncNpcs(dt);if(typeof props3dVillage==='function')props3dVillage(R3D.vil);if(typeof deco3d==='function')deco3d(R3D.vil);vilWarm(r,c)}   // props3d.js: עמודי הפנסים   // בכפר: השחקן, המבנים והתושבים
  else if(!S.room){
    syncPlayer(dt);
    if(S.wd){syncWorld();syncWnpcs(dt);wldWarm(r,c)}   // העולם הפתוח: עצים, סלעים ושערים (world.js), והדמויות שמגלים בו (worldnpc.js)
    // רק מי שעל המסך. הבוס, המבוקש ואויבי-העל תמיד מונפשים, ואחריהם הקרובים לשחקן. השאר בקהל
    const vis=enemies.filter(e=>!e.dead&&(e.isBoss||e.wboss||onScreen(e.x+ox,e.y+oy)));
    // בעולם: רק world הקרובים מונפשים, והשאר בקהל (דמות מונפשת היא רוב הזמן של הציור בעולם, מבקר 2)
    const full=S.wd?CROWD.world:CROWD.full;
    if(vis.length>full){const pr=e=>e.isBoss||e.wboss||e.wanted||e.elite||e.sw>0||e.act?-1:Math.hypot(e.x-P.x,e.y-P.y);vis.sort((a,b)=>pr(a)-pr(b))}   // מי שמתכונן למתקפה תמיד מונפש (FOEATK3D)
    vis.forEach((e,i)=>i<full||e.isBoss||e.wboss||!crowdOf(e.type)?syncEnemy(e,dt):crowdAdd(e));
    R3D.nDying=0;for(const a of R3D.actors.values())if(a.dieT>0.05)R3D.nDying++;
    for(const [e,a] of R3D.actors)if(a.seen!==R3D.frame||e.dead)retire(e,a,dt);
  }else{ // בחדר הבונוס אין אויבים, רק השחקן
    syncPlayer(dt);for(const [e,a] of R3D.actors){R3D.actors.delete(e);freeActor(a)}
  }
  // שולחים לכרטיס הגרפי רק את החלק שבשימוש: שליחה של הכל בכל פריים תוקעת את הציור
  const up=m=>{if(!m.count)return;const b=m.instanceMatrix;b.clearUpdateRanges();b.addUpdateRange(0,m.count*16);b.needsUpdate=true};
  for(const k in R3D.marks)up(R3D.marks[k]);
  for(const k in R3D.crowd)if(R3D.crowd[k])for(const p of R3D.crowd[k])for(const m of p){up(m);m.visible=m.count>0}   // ריק: בלי ציור בכלל
  if(!skip){if(!(typeof VFX3D!=='undefined'&&VFX3D.render(r,R3D.scene,c)))r.render(R3D.scene,c);gfxMeasure(now)}   // VFX3D.render: עם זוהר (bloom), ואם אין, ציור רגיל
  const i=r.info.render;R3D.stats={calls:i.calls,tris:i.triangles,actors:R3D.actors.size+1,crowd:R3D.nCrowd};
}
// התחלה מחדש: מנקים דמויות מהריצה הקודמת
function reset3d(){if(!R3D.ready)return;npcs3dOff();for(const [e,a] of R3D.actors)freeActor(a);R3D.actors.clear();if(R3D.player){R3D.player.st=null;R3D.player.one=null;R3D.player.base=null;R3D.player.mixer.stopAllAction()}}

if(R3D.want)init3d();else showGfx();
