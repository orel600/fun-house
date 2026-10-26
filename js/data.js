/* נתונים: סוגי אויבים, שמות התקפות ושדרוגים */
const ETYPES={
  grunt:{hp:22,r:13,speed:74,xp:1,dmg:10,mult:{sword:1,gun:1}},
  shield:{hp:46,r:15,speed:56,xp:2,dmg:12,mult:{sword:2,gun:0.35}},
  wisp:{hp:18,r:11,speed:100,xp:2,dmg:8,mult:{sword:0.45,gun:2}}
};
const PNAME={ring:'טבעת אש',spiral:'ספירלה',aimed:'מטח מכוון',charge:'הסתערות',shields:'זימון מגינים',wisps:'זימון רוחות',shock:'גל הדף',mines:'מוקשים'};
const SYL1=['גרו','זאר','מור','קאל','בל','נוקס','אוב','דרא','שק','טור'];
const SYL2=['גוט','רון','מאק','זיל','דור','קס','ות','גאל','בר'];
const UPS=[
  {id:'sdmg',w:'sword',name:'להב כבד',desc:'נזק חרב +35%',f:()=>P.sw.dmg*=1.35},
  {id:'srng',w:'sword',name:'הנפה רחבה',desc:'טווח חרב +20%',f:()=>P.sw.range*=1.2,max:3},
  {id:'sspd',w:'sword',name:'יד מהירה',desc:'מהירות הנפה +22%',f:()=>P.sw.cd*=0.78,max:4},
  {id:'gdmg',w:'gun',name:'חוד מחודד',desc:'נזק חצים +35%',f:()=>P.gn.dmg*=1.35},
  {id:'grate',w:'gun',name:'מיתר מהיר',desc:'קצב ירי +25%',f:()=>P.gn.cd*=0.8,max:4},
  {id:'gmulti',w:'gun',name:'חץ כפול',desc:'חץ נוסף בכל ירייה',f:()=>P.gn.multi++,max:3},
  {id:'gpierce',w:'gun',name:'חודר שריון',desc:'כל חץ עובר דרך אויב נוסף',f:()=>P.gn.pierce++,max:2},
  {id:'hp',w:'any',name:'לב אבן',desc:'חיים מקסימליים +25 וריפוי מלא',f:()=>{P.maxHp+=25;P.hp=P.maxHp}},
  {id:'spd',w:'any',name:'רגליים קלות',desc:'מהירות תנועה +12%',f:()=>P.speed*=1.12,max:3},
  {id:'mag',w:'any',name:'מגנט',desc:'טווח איסוף XP +60%',f:()=>P.magnet*=1.6,max:2},
  {id:'swap',w:'any',name:'החלפה זריזה',desc:'אחרי כל החלפת נשק: נזק כפול לשנייה וחצי',f:()=>P.swapLvl++,max:3},
  {id:'regen',w:'any',name:'נשימה עמוקה',desc:'מרפא 1.5 חיים בשנייה',f:()=>P.regen+=1.5,max:3}
];
