/* נתונים: סוגי אויבים ושדרוגים. השמות והתיאורים שלהם ב-lang.js, לפי ה-id (למשל 'up.sdmg')
   drop: השלל של האויב כשהוא נופל, {משאב:[סיכוי, כמה, משנייה]}. המשאבים ב-RES (resources.js), והדרגה של שלל (רגיל עד אגדי) היא הנדירות של המשאב.
   משנייה: לא חובה. המשאב נופל רק מהשנייה הזו בריצה (מתכות טובות יותר בהמשך). השלל מגיע לתרמיל בסוף הריצה, גם אם נפלת.
   elite: מה אויב עלית מפיל בנוסף (loot.js). mat: ממה האויב עשוי. ממנו ומסוג הנזק יגיע מה חזק נגדו (סוגי נזק, #23).
   עד אז mult הוא לפי הנשק, כמו קודם.
   יצורי משאבים (ניר): golem, treant, crawler, sprite, mummy. הם עשויים מהמשאב שלהם, מפילים אותו בנדיבות,
   ומופיעים ליד מקורות המשאבים שלהם (guard ב-NODES, nodes.js), לא מה-spawner */
const ETYPES={
  grunt:{hp:22,r:13,speed:74,xp:1,dmg:10,mat:'bone',mult:{sword:1,gun:1},
    drop:{coins:[0.6,1],bone:[0.2,1],hide:[0.12,1],cloth:[0.06,1],dust:[0.05,1]},elite:{dust:[0.6,2],bone:[1,3],rubyC:[0.1,1]}},
  shield:{hp:46,r:15,speed:56,xp:2,dmg:12,mat:'metal',mult:{sword:2,gun:0.35},   // משוריין: מתכת ועור
    drop:{coins:[0.8,2],hide:[0.2,1],iron:[0.1,1],copper:[0.12,1],plate:[0.06,1]},elite:{plate:[0.7,2],iron:[1,2],amberC:[0.1,1]}},
  wisp:{hp:18,r:11,speed:100,xp:2,dmg:8,mat:'magic',mult:{sword:0.45,gun:2},     // רוח: תמצית וארס, ולפעמים צל
    drop:{coins:[0.8,2],essence:[0.22,1],venom:[0.15,1],shadow:[0.02,1]},elite:{shadow:[0.5,1],essence:[1,3],sapphireC:[0.1,1]}},
  golem:{hp:80,r:19,speed:44,xp:4,dmg:15,mat:'stone',mult:{sword:1,gun:1},
    drop:{stone:[1,5],coins:[0.5,2],amberC:[0.06,1],amber:[0.015,1]},elite:{stone:[1,8],amber:[0.2,1]}},
  treant:{hp:65,r:18,speed:50,xp:3,dmg:13,mat:'plant',mult:{sword:1,gun:1},
    drop:{wood:[1,5],resin:[0.5,2],herb:[0.2,1],flower:[0.05,1]},elite:{resin:[1,4],flower:[0.5,1],rubyC:[0.1,1]}},
  crawler:{hp:55,r:15,speed:72,xp:3,dmg:12,mat:'metal',mult:{sword:1,gun:1},     // מתכת לפי כמה רחוק בריצה
    drop:{copper:[0.8,2],iron:[0.4,1,45],silver:[0.2,1,90],gold:[0.08,1,150],plate:[0.2,1]},elite:{iron:[1,3],silver:[0.5,2,60],boltC:[0.15,1]}},
  sprite:{hp:24,r:11,speed:96,xp:2,dmg:8,mat:'plant',mult:{sword:1,gun:1},
    drop:{herb:[0.7,2],mushroom:[0.3,1],flower:[0.25,1],essence:[0.3,1]},elite:{flower:[1,2],mushroom:[1,2],aquaC:[0.15,1]}},
  mummy:{hp:50,r:14,speed:56,xp:3,dmg:12,mat:'cloth',mult:{sword:1,gun:1},
    drop:{cloth:[0.9,3],hide:[0.4,2],bone:[0.3,1],dust:[0.15,1]},elite:{cloth:[1,6],shadow:[0.3,1]}}
};
// הבוסים לפי id (היום יש אחד, type:'boss' ב-boss.js). drop כמו באויבים, כולל החלק שרק הוא מפיל (RES, משפחת boss)
const BOSSES={
  boss:{mat:'bone',drop:{coins:[1,40],horn:[1,2],bone:[1,8],dust:[0.6,3],plate:[0.5,2],essence:[1,4],shadow:[0.4,1],venom:[0.6,3],silver:[0.8,3],
    ruby:[0.3,1],bolt:[0.3,1],aqua:[0.2,1],star:[0.1,1],mythril:[0.15,1]}}
};
const UPS=[
  {id:'sdmg',w:'sword',f:()=>P.sw.dmg*=1.35},
  {id:'srng',w:'sword',f:()=>P.sw.range*=1.2,max:3},
  {id:'sspd',w:'sword',f:()=>P.sw.cd*=0.78,max:4},
  {id:'gdmg',w:'gun',f:()=>P.gn.dmg*=1.35},
  {id:'grate',w:'gun',f:()=>P.gn.cd*=0.8,max:4},
  {id:'gmulti',w:'gun',f:()=>P.gn.multi++,max:3},
  {id:'gpierce',w:'gun',f:()=>P.gn.pierce++,max:2},
  {id:'hp',w:'any',f:()=>{P.maxHp+=25;P.hp=P.maxHp}},
  {id:'spd',w:'any',f:()=>P.speed*=1.12,max:3},
  {id:'mag',w:'any',f:()=>P.magnet*=1.6,max:2},
  {id:'swap',w:'any',f:()=>P.swapLvl++,max:3},
  {id:'regen',w:'any',f:()=>P.regen+=1.5,max:3}
];
