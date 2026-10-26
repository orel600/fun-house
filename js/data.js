/* נתונים: סוגי אויבים ושדרוגים. השמות והתיאורים שלהם ב-lang.js, לפי ה-id (למשל 'up.sdmg') */
const ETYPES={
  grunt:{hp:22,r:13,speed:74,xp:1,dmg:10,mult:{sword:1,gun:1}},
  shield:{hp:46,r:15,speed:56,xp:2,dmg:12,mult:{sword:2,gun:0.35}},
  wisp:{hp:18,r:11,speed:100,xp:2,dmg:8,mult:{sword:0.45,gun:2}}
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
