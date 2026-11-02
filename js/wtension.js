/* מתח בקרב בעולם (מבקר 2, 2.11.2026: "אויבים מתים תוך פחות משתי שניות, והקרב הוא בעיקר ללכת קדימה").
   שני דברים, שניהם רק על אויבים רגילים בעולם הפתוח (wSpawn ו-wFoes ב-world.js), לא יצורי משאבים, לא שומרים ולא הזירה:
   - קבוצה נלחמת יחד: מכים אחד, וכל הקבוצה שלו מתעוררת ורודפת (e.alert, כמו "הקורא" ב-foeai.js). לא בוחרים אותם אחד-אחד.
   - שחקן שעבר את האזור: כשהרמה גבוהה מהרמה של הדרך הבאה (CURIO.paths), האויבים באזור מתחזקים לפי הפער, עד תקרה.
     כך באחו ברמה 20 יש עדיין קרב, ושחקן חדש לא מרגיש שום הבדל.
   ליד השער: פחות אויבים וכל אחד חזק יותר. זה ב-WORLD.foes וב-WORLD.zones (start) ב-world.js */
const WTENSION={
  group:{alert:3},                 // שניות שהקבוצה רודפת אחרי שאחד מהם נפגע (גם רחוק יותר מהבית, כמו alert ב-wFoes)
  over:{per:0.1,max:2.4,dmg:0.5,last:8}   // per: עוד כמה חיים לכל רמה מעל האזור. max: תקרה. dmg: הנזק גדל בחצי הקצב של החיים. last: באזור האחרון (בלי דרך הלאה), כמה רמות מעל הכניסה אליו
};

// עד איזו רמה האזור הנוכחי "מתאים": הרמה של הדרך הבאה ממנו (curiosity.js). באזור האחרון: הכניסה אליו ועוד last
function wtCap(){
  const R=WR(),ks=Object.keys(R.paths||{}).filter(k=>CURIO.paths[k]);
  if(ks.length)return Math.min(...ks.map(k=>CURIO.paths[k].lv));
  const me=CURIO.paths[R.region||'meadow'];return(me?me.lv:1)+WTENSION.over.last;
}
// פי כמה חיים לאויב באזור הנוכחי, לפי הרמה של השחקן. 1 כשהשחקן לא עבר את האזור
function wtOverK(){const o=WTENSION.over,over=heroLv()-wtCap();return over>0?Math.min(o.max,1+o.per*over):1}
// אויב שמופיע בעולם (wSpawn)
function wtSpawn(e){
  if(e.creature)return;const k=wtOverK();if(k<=1)return;
  e.hp*=k;e.max*=k;e.dmg*=1+(k-1)*WTENSION.over.dmg;
}
// כל פריים, לפני התנועה (wFoes): מי שנפגע עכשיו (הבזק) מעיר את כל הקבוצה שלו
function wtGroups(){
  let hit=null;
  for(const e of enemies)if(!e.dead&&e.home!=null&&!e.creature&&!e.pack&&e.flash>0&&!(e.alert>0))(hit||(hit=new Set())).add(e.home);
  if(!hit)return;
  for(const e of enemies)if(!e.dead&&hit.has(e.home)&&!e.creature&&!e.pack)e.alert=Math.max(e.alert||0,WTENSION.group.alert);
}
