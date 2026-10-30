/* נתונים: סוגי אויבים ושדרוגים. השמות והתיאורים שלהם ב-lang.js, לפי ה-id (למשל 'up.sdmg')
   drop: השלל של האויב כשהוא נופל, {משאב:[סיכוי, כמה]}. המשאבים ב-RES (resources.js). מגיע לתרמיל בסוף הריצה, גם אם נפלת */
const ETYPES={
  grunt:{hp:22,r:13,speed:74,xp:1,dmg:10,mult:{sword:1,gun:1},drop:{coins:[0.6,1],bone:[0.2,1],hide:[0.12,1],cloth:[0.06,1]}},
  shield:{hp:46,r:15,speed:56,xp:2,dmg:12,mult:{sword:2,gun:0.35},drop:{coins:[0.8,2],hide:[0.2,1],iron:[0.1,1],copper:[0.12,1]}},   // משוריין: מתכת ועור
  wisp:{hp:18,r:11,speed:100,xp:2,dmg:8,mult:{sword:0.45,gun:2},drop:{coins:[0.8,2],essence:[0.22,1],venom:[0.15,1]}}            // רוח: תמצית וארס
};
// הבוסים לפי id (היום יש אחד, type:'boss' ב-boss.js). drop כמו באויבים, כולל החלק שרק הוא מפיל (RES, משפחת boss)
const BOSSES={
  boss:{drop:{coins:[1,40],horn:[1,2],bone:[1,8],essence:[1,4],venom:[0.6,3],silver:[0.8,3],ruby:[0.35,1],bolt:[0.35,1],star:[0.1,1],mythril:[0.15,1]}}
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
