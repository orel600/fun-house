/* נתונים: סוגי אויבים ושדרוגים. השמות והתיאורים שלהם ב-lang.js, לפי ה-id (למשל 'up.sdmg')
   tags: ממה האויב עשוי. מזה ומטבלת היעילות ב-dmg.js (DMG.chart) נקבע כמה נזק הוא מקבל מכל סוג.
   החולשה הכי גדולה היא צבע הטבעת שמתחת לאויב */
const ETYPES={
  grunt:{hp:33,r:13,speed:74,xp:1,dmg:10,tags:['bone']},            // חלש לפיזי ×1.5, אז יותר חיים כדי שהגושים לא יתאדו
  shield:{hp:46,r:15,speed:56,xp:2,dmg:12,tags:['bone','metal']},   // שריון: חלש לאש, ברק ואדמה
  wisp:{hp:18,r:11,speed:100,xp:2,dmg:8,tags:['magic','flying']}    // מרחף: חלש לקרח וברק, עמיד לאדמה
};
const UPS=[
  {id:'sdmg',w:'sword',f:()=>P.sw.dmg*=1.35},
  {id:'srng',w:'sword',f:()=>P.sw.range*=1.2,max:3},
  {id:'sspd',w:'sword',f:()=>P.sw.cd*=0.78,max:4},
  {id:'gdmg',w:'gun',f:()=>P.gn.dmg*=1.35},
  {id:'grate',w:'gun',f:()=>P.gn.cd*=0.8,max:4},
  {id:'gmulti',w:'gun',f:()=>P.gn.multi++,max:3},
  {id:'gpierce',w:'gun',f:()=>P.gn.pierce++,max:2},
  // נשק מקבל סוג נזק, במקום מה שהיה לו. זמני, עד שסקילים וחפצים ייתנו סוגי נזק
  {id:'sfire',w:'sword',el:'fire'},
  {id:'slight',w:'sword',el:'lightning'},
  {id:'gice',w:'gun',el:'ice'},
  {id:'glight',w:'gun',el:'lightning'},
  {id:'searth',w:'sword',el:'earth'},
  {id:'gwater',w:'gun',el:'water'},
  {id:'hp',w:'any',f:()=>{P.maxHp+=25;P.hp=P.maxHp}},
  {id:'spd',w:'any',f:()=>P.speed*=1.12,max:3},
  {id:'mag',w:'any',f:()=>P.magnet*=1.6,max:2},
  {id:'swap',w:'any',f:()=>P.swapLvl++,max:3},
  {id:'regen',w:'any',f:()=>P.regen+=1.5,max:3}
];
