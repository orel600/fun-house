/* העולם הפתוח: האזור הראשון, "האחו והמחצבה" (game-design.md, "מבנה העולם", אפשרות ג: עולם פתוח עם זירות בתוכו).
   יוצאים אליו משער הכפר, ובתוכו שני שערים לזירה. ריצה שמתחילה בשער נגמרת באותו שער.
   העולם הוא מקום, כמו הכפר וחדר הבונוס: S.wd קיים רק כשנמצאים בו, ו-main.js מעדכן רק את המקום הנוכחי.
   מה יש בו: מקורות משאבים שההתקפה האוטומטית מכה בהם כשעומדים לידם, אויבים מעטים שמסתובבים ליד הבית שלהם (לא גושים כמו בזירה),
   יצורי משאבים, ושמועות על המבוקש (wanted.js).
   מה שנאסף נכנס ישר לתרמיל, ובו מסתכנים: מוות בעולם מאבד חצי מכל משאב בתרמיל, הפריטים נשארים, וקמים בכפר. המחסן בכפר בטוח ("החלטות של ניר").
   כל המספרים באובייקט WORLD. השמות ב-lang.js ('w.*'). בתלת-ממד: W3D ב-render3d.js */

const WORLD={
  region:'meadow',                       // השם ב-lang.js: 'w.region.meadow'
  size:{w:6300,h:4200},                  // גבולות האזור, סביב (0,0). האחו הגדול (ניר, 5.11.2026: "משהו שלוקח זמן להגיע מקצה לקצה"). הצורה עצמה: map למטה
  edge:20,                               // כמה מהקצה השחקן, המבוקש והשלל עוצרים (placeBox)
  home:{x:-70,y:-1850,r:44},             // 1 בשרטוט: השער חזרה לכפר, בשקע בין הצוקים בצפון. יוצאים מהכפר ומגיעים לכאן
  gates:{grove:{x:-2270,y:1480,r:44},pit:{x:1440,y:890,r:44}},   // 13 ו-14: שערים לזירה, בסוף שביל היער ומתחת לעלייה לרכס. השמות ב-lang.js ('w.gate.<id>')
  arrive:130,                            // כמה פיקסלים מתחת לשער עומדים כשמגיעים אליו
  near:55,                               // כמה פיקסלים מקצה שער נחשב "לידו": בועה מעליו וכפתור עגול. הכרטיס נפתח רק בלחיצה
  /* מקורות משאבים בשדות: kind (מ-NODES.kinds ב-nodes.js), כמה, מרכז ורדיוס. המקומות קבועים, כך שהיער תמיד באותו מקום. מקור שנופל במים או ביער מדולג (terrain.js).
     ההתקפה האוטומטית מכה בהם כמו בזירה (aimTarget ב-combat.js), והשלל בדרגות כמו בזירה (runGive ב-loot.js) */
  fields:[{kind:'tree',n:14,x:-1080,y:-1040,r:320},{kind:'tree',n:7,x:-680,y:-1480,r:220},{kind:'tree',n:6,x:1950,y:-250,r:220},{kind:'tree',n:6,x:-1300,y:700,r:240},{kind:'tree',n:5,x:520,y:1380,r:200},
          {kind:'bush',n:6,x:-700,y:-660,r:160},{kind:'bush',n:4,x:-220,y:1580,r:150},
          {kind:'rock',n:10,x:1800,y:-1280,r:330},{kind:'copper',n:5,x:2300,y:-1520,r:160},{kind:'iron',n:3,x:2450,y:-1150,r:110},{kind:'rock',n:4,x:600,y:1520,r:170},{kind:'rock',n:3,x:-1000,y:1180,r:150}],
  regrow:45,                             // שניות עד שמקור שנשבר צומח מחדש
  /* אויבים: קבוצות שמסתובבות ליד הבית שלהן. type: מ-ETYPES. creature: יצור משאב (data.js), ליד המקור שלו.
     ראשונות: מפלצות קלות ממש מחוץ לשער, הדבר הראשון ששחקן חדש פוגש. מהן לומדים איך נראים קרב, מספרי נזק ושלל (ניר) */
  foes:[
    // ליד השער: פחות אויבים, וכל אחד חזק יותר (zones.start). קרב אחד שמרגישים, ולא עשרה שנעלמים (מבקר 2, 2.11.2026). wtension.js
    {type:'grunt',n:1,x:-260,y:-1620,r:95},{type:'grunt',n:1,x:140,y:-1610,r:95},{type:'grunt',n:2,x:-250,y:-1470,r:100},
    // האחו הפתוח מצפון לנהר (קל). הראשונה ממש מתחת לשער, בתחילת הדרך
    {type:'grunt',n:2,x:-70,y:-1390,r:110},{type:'grunt',n:2,x:-460,y:-1180,r:140},{type:'grunt',n:3,x:380,y:-1180,r:140},{type:'wisp',n:2,x:-800,y:-1520,r:150},
    {type:'grunt',n:2,x:-1120,y:-1700,r:110},   // על הדרך מהשער לשביל היער ולאגם
    {type:'shield',n:3,x:-1070,y:-1290,r:150},{type:'grunt',n:2,x:-960,y:-1180,r:120},   // 20 מחנה כורתים נטוש
    {type:'wisp',n:2,x:940,y:-1140,r:140},{type:'shield',n:2,x:1040,y:-1060,r:120},    // 21 מחנה ציידים
    {type:'shield',n:2,x:1480,y:-1500,r:130},{type:'grunt',n:2,x:720,y:-520,r:140},{type:'grunt',n:3,x:1950,y:-480,r:150},
    {type:'shield',n:3,x:2450,y:-240,r:150},{type:'wisp',n:2,x:2350,y:-380,r:120},     // 23 מחנה המפרץ
    {type:'treant',n:2,x:-1840,y:-640,r:120},{type:'wisp',n:2,x:-2030,y:250,r:120},{type:'grunt',n:2,x:-2400,y:-1000,r:100},   // 12 הקיצור ביער ושביל היער: עצים מהלכים ורוחות
    // מעבר לנהר (קשה): מחנה הגדה, הרכס, המקדש, הדרך למאורה, והדרום-מערב
    {type:'shield',n:3,x:130,y:400,r:150},{type:'grunt',n:3,x:260,y:300,r:130},   // 22 מחנה הגדה
    {type:'wisp',n:2,x:300,y:740,r:150},{type:'shield',n:3,x:740,y:1240,r:150},{type:'grunt',n:3,x:1440,y:1080,r:150},
    {type:'shield',n:3,x:1900,y:1500,r:150},{type:'grunt',n:3,x:2250,y:1300,r:150},
    {type:'shield',n:3,x:-1130,y:1440,r:150},{type:'grunt',n:3,x:-800,y:780,r:150},{type:'wisp',n:3,x:-1250,y:250,r:150},
    {type:'wisp',n:2,x:-690,y:1780,r:90},{type:'grunt',n:3,x:400,y:1700,r:150},{type:'shield',n:2,x:1300,y:1650,r:130},{type:'treant',n:2,x:-2300,y:1150,r:110},
    // יצורי משאבים, ליד המקור שלהם
    {type:'treant',creature:true,n:2,x:-1150,y:-950,r:170},{type:'golem',creature:true,n:2,x:1840,y:-1180,r:150},
    {type:'crawler',creature:true,n:2,x:2300,y:-1500,r:105},{type:'sprite',creature:true,n:2,x:-700,y:-660,r:115},{type:'golem',creature:true,n:2,x:600,y:1500,r:130}
  ],
  aggro:240,                             // מאיזה מרחק אויב רודף
  attackRange:260,                       // ההתקפה האוטומטית בוחרת רק מטרות עד המרחק הזה, וחץ או קסם לא פוגעים במה שרחוק ממנו (ניר, 31.10.2026: "בעולם הפתוח טווח ההתקפה צריך להיות מוגבל יותר"). בזירה הטווח של הנשק עצמו (אוראל)
  wander:0.4,                            // מהירות ההסתובבות ליד הבית, יחסית לרדיפה
  far:260,                               // קבוצה שנוקתה חוזרת רק כשהשחקן רחוק ממנה לפחות כך, כדי שלא תצוץ מול העיניים. ולפחות חצי אלכסון המסך, כי המצלמה רואה רחוק (camera.js)
  /* כמה קשה, לפי המרחק של בית הקבוצה מהשער לכפר: ככל שמתרחקים, קשה יותר. to: עד איזה מרחק. hp, dmg, speed: פי כמה מהרגיל (ETYPES).
     leash: כמה רחוק מהבית האויב מוכן לרדוף לפני שהוא חוזר. back: שניות עד שקבוצה שנוקתה חוזרת */
  foeHp:2.2,                             // אויבים בעולם: פי כמה חיים (docs/plan-combat.md שינוי 3). גם בלהקות (pacing.js). המכה עם הכנה: STRIKE ב-strike.js
  foeMin:70,                             // ולפחות כך הרבה חיים (כפול ה-hp של האזור): גרנט חלש לחרב לוקח 2-3 מכות ולא נעלם במכה אחת. אויב חזק לא מושפע. אחרי שדרוגים שוב מכה אחת, וזה ה"וואו, התחזקתי"
  /* האחו הגדול: לפי המרחק מהשער, בקנה המידה של המפה (docs/concept-meadow.md "קושי"): קל עד 1100, בינוני עד 2000 (בערך הנהר),
     קשה עד 3200 והכי קשה מעבר. id: מה שמערכות אחרות שואלות (affix.js, foeai.js). אותו id יכול לחזור, רק המספרים משתנים */
  zones:[
    {id:'start',to:450, hp:0.5, dmg:0.35,speed:0.65,leash:240,back:12,min:125,wind:0.65},   // min: רצפת חיים משלו, כדי שגם ליד השער אויב לוקח 3-4 מכות (ולא foeMin×0.35). wind: הכנה איטית יותר למכה, קל להתחמק
    {id:'near', to:1100,hp:0.7, dmg:0.6, speed:0.85,leash:360,back:22},
    {id:'far',  to:2000,hp:1,   dmg:1,   speed:1,   leash:480,back:30},
    {id:'far',  to:3200,hp:1.3, dmg:1.2, speed:1.05,leash:520,back:34},
    {id:'far',  to:1e9, hp:1.65,dmg:1.4, speed:1.1, leash:560,back:40}
  ],
  regen:4,                               // חיים לשנייה כשאין אויב קרוב
  decor:{trees:74,hills:14,rocks:0.15},  // קישוטים מחוץ לגבול. rocks: איזה חלק מהם סלעים
  ground:'#1B2A1E',                      // צבע הקרקע בדו-ממד. בתלת-ממד: W3D.regions ב-render3d.js
  /* דרכים לאזורים אחרים: שער שמופיע רק כשהעלילה פותחת אותו (need: מה ב-SAVE.story, story.js). המפתח הוא שם האזור שאליו הדרך מובילה */
  paths:{lake:{x:-2530,y:-1780,r:44,need:'earth'}},   // 11 בשרטוט. פרק 2: אחרי שפנס האדמה נדלק, דרך בראש שביל היער לאגם הערפל
  /* הצורה של האחו (terrain.js, השרטוט ב-docs/concept-meadow.md). המספרים בשרטוט מופיעים בהערות.
     border: קו הגבול, עם כיוון השעון. מחוץ לו חסום. cliffs: איפה הגבול הוא צוק (סלעים בתלת-ממד). reeds: קני סוף לאורך המים.
     rivers: נהר כקו עם רוחב, שחוסם. springs: המעיין שבו הנהר מתחיל. bridges: גשרים (a הכיוון שבו חוצים, len אורך, w רוחב). fords: מעבר רדוד שמאט.
     water: מים עמוקים (המפרץ והביצה). shallow: שולי הביצה, מאטים. forests: יער סבוך שחוסם. trails: שבילים (cut: חותך ביער, draw:false לא מצויר בקרקע).
     clearings: קרחות ביער. rocky: קרקע סלעית (המחצבה). ridge: הרכס, עם שפה חוסמת ועלייה אחת (ramp, ו-up מלמטה למעלה).
     dens: מאורות (השומר, ובשביל ת8 המפלצות הנדירות). waystones: אבני המסע (ת10). marks: ציוני דרך (מחנות, חורבות) */
  map:{
    border:[[-3140,-1860],[-2410,-1960],[-1880,-1940],[-1270,-1880],[-600,-1960],[-400,-1980],[-270,-2060],[130,-2060],[250,-1990],[600,-1980],[1140,-2010],[1680,-1970],[2210,-1970],[2650,-1970],[2850,-1890],[2950,-1700],[2980,-1200],[2950,-740],[3000,-280],[2980,180],[2930,400],
            [2650,510],[2400,710],[2490,940],[2780,1060],[2990,1120],[3030,1570],[3000,1910],[2810,1940],[2610,1900],[2350,1890],[2040,1900],[1270,1870],[600,1860],[70,1880],[-370,1900],[-500,1980],[-620,2070],[-750,2070],[-860,1980],[-950,1900],
            [-1410,1900],[-1780,1910],[-2080,1970],[-2610,2000],[-3010,1850],[-3140,1440],[-3150,380],[-3150,-940]],
    cliffs:[[[-1270,-1880],[-600,-1960],[-400,-1980],[-270,-2060],[130,-2060],[250,-1990],[600,-1980],[1140,-2010],[1680,-1970],[2210,-1970],[2650,-1970],[2850,-1890],[2950,-1700],[2980,-1200],[2950,-740],[3000,-280],[2980,180],[2930,400]],
            [[2990,1120],[3030,1570],[3000,1910]]],
    reeds:[[[2040,1900],[1270,1870],[600,1860],[70,1880],[-370,1900],[-500,1980],[-620,2070],[-750,2070],[-860,1980],[-950,1900],[-1410,1900],[-1780,1910]],
           [[2930,400],[2650,510],[2400,710],[2490,940],[2780,1060],[2990,1120]]],
    rivers:[{w:130,pts:[[-1780,-300],[-1510,-260],[-1210,-200],[-970,-160],[-740,-210],[-540,-260],[-270,-240],[0,-160],[230,-60],[600,20],[940,90],[1270,200],[1640,330],[1940,480],[2210,630],[2560,830]]}],
    springs:[{x:-1780,y:-300,r:140}],                                   // 9 המעיין, בתוך היער
    bridges:[{x:-970,y:-160,a:1.571,len:250,w:96},{x:1640,y:330,a:1.967,len:250,w:96}],   // 7 גשר מערבי (בטוח, ארוך), 8 גשר מזרחי (קרוב למאורה, שמור)
    fords:[{x:230,y:-60,r:135,a:1.86}],                                // 6 מעבר רדוד: הדרך הישרה, בחצי מהירות
    water:[[[2930,400],[2650,510],[2400,710],[2490,940],[2780,1060],[2990,1120],[3030,1570],[3000,1910],[2810,1940],[2610,1900],[2350,1890],[2040,1900],[2040,2400],[3900,2400],[3900,0],[3020,0]],   // המפרץ
           [[2040,1900],[1270,1870],[600,1860],[70,1880],[-370,1900],[-500,1980],[-620,2070],[-750,2070],[-860,1980],[-950,1900],[-1410,1900],[-1780,1910],[-2080,1970],[-2080,2500],[2080,2500]]],   // הביצה
    shallow:[[[-1740,1790],[-870,1820],[-740,1910],[-500,1910],[-370,1830],[600,1790],[2010,1820],[2040,1950],[-1740,1950]]],
    forests:[[[-3260,-2000],[-2410,-1990],[-1880,-1910],[-1620,-1660],[-1490,-1330],[-1410,-940],[-1430,-610],[-1370,-400],[-1410,-130],[-1470,130],[-1510,450],[-1610,780],[-1720,1110],[-1850,1440],[-2010,1770],[-2180,2030],[-2610,2160],[-3260,2160]]],
    trails:[
      {w:110,cut:true,pts:[[-2530,-1780],[-2480,-1560],[-2410,-1270],[-2360,-940],[-2390,-540],[-2430,-150],[-2450,180],[-2410,510],[-2380,910],[-2330,1240],[-2270,1500],[-2200,1700],[-1950,1720],[-1700,1680]]},   // שביל היער: מהדרך לאגם (11) ועד שער החורשה (13)
      {w:110,cut:true,pts:[[-1380,-1650],[-1740,-1720],[-2080,-1740],[-2410,-1720],[-2530,-1780]]},   // הכניסה הצפונית לשביל
      {w:96,cut:true,pts:[[-1350,-1100],[-1660,-880],[-1840,-640],[-1990,-380],[-2040,-80],[-2040,250],[-2070,550],[-2130,790],[-2360,1010]]},   // 12 הקיצור (מסוכן)
      {w:84,cut:true,draw:false,pts:[[-2410,-1270],[-2600,-1300]]},{w:84,cut:true,draw:false,pts:[[-2400,800],[-2830,800]]},
      {w:84,cut:true,draw:false,pts:[[-2200,900],[-2000,1100]]},{w:84,cut:true,draw:false,pts:[[-2290,1560],[-2730,1640]]},
      {w:70,pts:[[-70,-1800],[70,-1270],[170,-740],[230,-410],[230,-60],[190,280],[340,450],[870,480],[1060,560],[1310,580],[1440,840],[1570,1170],[1710,1440],[2080,1600],[2550,1700]]},   // המסלול הראשון
      {w:60,pts:[[-970,-160],[-970,-540],[-700,-900],[-300,-1500],[-70,-1800]]},{w:60,pts:[[-970,-160],[-1000,300],[-1130,900],[-1130,1440]]},   // אל הגשר המערבי ומעבר לו
      {w:60,pts:[[1640,330],[1300,-200],[1700,-800],[1840,-1140]]},{w:60,pts:[[1640,330],[1700,800],[1440,890]]}],   // הגשר המזרחי: למחצבה ולשער הבור
    clearings:[{x:-2290,y:150,r:220},{x:-2830,y:800,r:160},{x:-2600,y:-1300,r:130},{x:-2000,y:1100,r:140},{x:-2730,y:1640,r:130}],
    rocky:[[[1210,-1600],[1410,-1760],[1940,-1850],[2410,-1810],[2650,-1600],[2690,-1270],[2610,-940],[2280,-790],[1810,-780],[1410,-900],[1240,-1170]]],   // 10 המחצבה
    ridge:{poly:[[-470,900],[-370,790],[-70,690],[340,590],[740,510],[1010,460],[1090,510],[1070,680],[870,780],[540,880],[130,960],[-200,1000],[-400,990]],
      ramp:[[1060,460],[1310,420],[1330,700],[1070,730]],up:[[1320,580],[1065,595]]},   // הרכס. עולים רק מהקצה המזרחי, והתצפית (15) בקצה המערבי
    dens:[{id:'earth',x:2590,y:1710,boss:'earth'},   // 16 מאורת השומר והפנס, הכי רחוק מהשער (ת5)
      {id:'r1',x:-2600,y:-1300,in:'forest'},{id:'r2',x:2490,y:-1680,in:'quarry'},{id:'r3',x:1240,y:-590,in:'meadow'},{id:'r4',x:2850,y:250,in:'cliff'},{id:'r5',x:-2000,y:1100,in:'forest'},
      {id:'r6',x:-2730,y:1640,in:'forest'},{id:'r7',x:230,y:1140,in:'ridge'},{id:'r8',x:-670,y:1830,in:'reeds'},{id:'r9',x:2240,y:1140,in:'bay'}],   // מאורות נדירות (◆, ת8)
    deeper:{x:420,y:-1250},   // עומק הצל: בקומה שנבנית מהאחו, השער למטה (depths.js)
    waystones:[{id:'ford',x:230,y:-410},{id:'quarry',x:1940,y:-1330},{id:'grove',x:-2290,y:150},{id:'lair',x:1690,y:1440}],   // 2-5 בשרטוט (ת10)
    marks:[{id:'spring',kind:'spring',x:-1290,y:-430},{id:'loggers',kind:'camp',x:-1070,y:-1290},{id:'hunters',kind:'camp',x:940,y:-1140},{id:'bank',kind:'camp',x:130,y:400},{id:'bay',kind:'camp',x:2450,y:-240},
      {id:'tower',kind:'ruin',x:-1130,y:1440},{id:'temple',kind:'temple',x:740,y:1240},{id:'lighthouse',kind:'lighthouse',x:-690,y:1930},{id:'lookout',kind:'look',x:-300,y:860}]   // 20-26
  },
  /* אזורים נוספים. כל אזור כותב רק מה ששונה מהאחו, והשאר נלקח מ-WORLD. האחו הוא WORLD עצמו.
     back: לאן השער 'home' של האזור מוביל (באחו: לכפר). ponds: מים שאי אפשר ללכת בהם. fog: ערפל בקנבס. noNpc: בלי הדמויות של האחו (worldnpc.js) */
  regions:{
    // פרק 2: אגם הערפל (docs/story.md). אויבים רטובים (ברק!), אבני גאות עם מים זוהרים, ופנס המים בפינה הדרום-מערבית (STORY.lanterns.water)
    lake:{
      region:'lake',back:'meadow',enter:'w.enter.lake',noNpc:true,fog:true,ground:'#16252C',
      home:{x:0,y:-600,r:44},gates:{},
      paths:{ridge:{x:860,y:-590,r:44,need:'water'}},   // פרק 3: אחרי שפנס המים נדלק, שביל בצפון-מזרח שעולה לרכס הקפוא
      ponds:[{x:60,y:60,r:230},{x:-480,y:-120,r:120},{x:560,y:330,r:140},{x:-260,y:420,r:80}],
      fields:[{kind:'reeds',n:8,x:-220,y:-180,r:200},{kind:'reeds',n:6,x:330,y:-90,r:170},{kind:'reeds',n:5,x:-640,y:240,r:150},
              {kind:'tideRock',n:6,x:640,y:-330,r:190},{kind:'tideRock',n:4,x:-760,y:-330,r:150},{kind:'tree',n:5,x:820,y:120,r:160},{kind:'rock',n:3,x:250,y:500,r:120}],
      foes:[
        {type:'mistling',n:2,x:-160,y:-420,r:110},{type:'mistling',n:2,x:200,y:-400,r:110},
        {type:'drowned',n:2,x:-380,y:-250,r:130},{type:'mistling',n:3,x:330,y:-150,r:140},{type:'drowned',n:3,x:640,y:-300,r:150},
        {type:'drowned',n:3,x:-650,y:180,r:150},{type:'mistling',n:3,x:-130,y:330,r:140},{type:'drowned',n:2,x:820,y:160,r:140},
        {type:'drowned',creature:true,n:2,x:-760,y:-330,r:120},{type:'mistling',creature:true,n:2,x:-220,y:-180,r:120}
      ],
      // קשה מהאחו: מי שהגיע לכאן כבר הדליק פנס אחד
      zones:[
        {id:'start',to:360, hp:0.6,dmg:0.5,speed:0.75,leash:260,back:16},
        {id:'near', to:800, hp:1,  dmg:0.9,speed:0.95,leash:380,back:22},
        {id:'far',  to:1e9, hp:1.4,dmg:1.2,speed:1.05,leash:480,back:30}
      ],
      decor:{trees:60,hills:14,rocks:0.45}
    },
    // פרק 3: הרכס הקפוא (docs/story.md). שלג, אויבים קפואים (אש!), גבישי קרח עם ספיר, ופנס הקרח בפינה הדרום-מזרחית (STORY.lanterns.ice).
    // snow: פתיתי שלג בקנבס (wSnow). ponds כאן הם סדקים בקרח שאי אפשר לעבור
    ridge:{
      region:'ridge',back:'lake',enter:'w.enter.ridge',noNpc:true,snow:true,ground:'#33404E',pondCol:['#1C2A3A','#9FD8F0'],
      home:{x:0,y:-600,r:44},gates:{},
      paths:{desert:{x:-860,y:-590,r:44,need:'ice'}},   // פרק 4: אחרי שפנס הקרח נדלק, מעבר בצפון-מערב שיורד למדבר הבוער
      ponds:[{x:-120,y:40,r:150},{x:420,y:-160,r:90},{x:-560,y:300,r:110}],
      fields:[{kind:'pine',n:10,x:-560,y:-260,r:230},{kind:'pine',n:6,x:250,y:280,r:180},{kind:'pine',n:4,x:-820,y:80,r:120},
              {kind:'iceRock',n:6,x:620,y:-330,r:190},{kind:'iceRock',n:4,x:-300,y:480,r:140},{kind:'rock',n:4,x:180,y:-260,r:130}],
      foes:[
        {type:'frostwraith',n:2,x:-180,y:-430,r:110},{type:'frostwraith',n:2,x:210,y:-410,r:110},
        {type:'rimeknight',n:2,x:-420,y:-200,r:130},{type:'frostwraith',n:3,x:330,y:-60,r:140},{type:'rimeknight',n:3,x:640,y:-280,r:150},
        {type:'rimeknight',n:3,x:-700,y:200,r:150},{type:'frostwraith',n:3,x:120,y:360,r:140},{type:'rimeknight',n:3,x:620,y:300,r:150},
        {type:'rimeknight',creature:true,n:2,x:620,y:-330,r:120},{type:'frostwraith',creature:true,n:2,x:-560,y:-260,r:130}
      ],
      // קשה מהאגם: מי שהגיע לכאן כבר הדליק שני פנסים
      zones:[
        {id:'start',to:360, hp:0.8,dmg:0.6,speed:0.8, leash:260,back:16},
        {id:'near', to:800, hp:1.3,dmg:1.05,speed:1,  leash:380,back:22},
        {id:'far',  to:1e9, hp:1.8,dmg:1.35,speed:1.08,leash:480,back:30}
      ],
      decor:{trees:66,hills:16,rocks:0.35}
    },
    // פרק 4: המדבר הבוער (docs/story.md). חום, אויבים חמים (מים!), סלעי להבה עם אודם, ופנס האש בפינה הדרום-מערבית (STORY.lanterns.fire).
    // heat: אדי חום ורוח חול בקנבס (wHeat). ponds כאן הם בורות לבה שאי אפשר לעבור
    desert:{
      region:'desert',back:'ridge',enter:'w.enter.desert',noNpc:true,heat:true,ground:'#5A4129',pondCol:['#7A2A10','#FF8A3D'],
      home:{x:0,y:-600,r:44},gates:{},
      paths:{storm:{x:860,y:-590,r:44,need:'fire'}},   // פרק 5: אחרי שפנס האש נדלק, שביל בצפון-מזרח שעולה למגדלי הסערה
      ponds:[{x:140,y:20,r:140},{x:-420,y:-140,r:95},{x:560,y:300,r:110}],
      fields:[{kind:'cactus',n:8,x:-560,y:-300,r:220},{kind:'cactus',n:6,x:300,y:-320,r:170},{kind:'cactus',n:4,x:-120,y:420,r:140},
              {kind:'emberRock',n:6,x:640,y:-120,r:180},{kind:'emberRock',n:4,x:-700,y:160,r:140},{kind:'rock',n:4,x:220,y:330,r:130}],
      foes:[
        {type:'flamewisp',n:2,x:-190,y:-420,r:110},{type:'flamewisp',n:2,x:200,y:-420,r:110},
        {type:'cinderscorp',n:2,x:-420,y:-260,r:130},{type:'flamewisp',n:3,x:380,y:-180,r:140},{type:'cinderscorp',n:3,x:660,y:-120,r:150},
        {type:'cinderscorp',n:3,x:-640,y:180,r:150},{type:'flamewisp',n:3,x:-60,y:330,r:140},{type:'cinderscorp',n:3,x:640,y:420,r:150},
        {type:'cinderscorp',creature:true,n:2,x:640,y:-120,r:120},{type:'flamewisp',creature:true,n:2,x:-560,y:-300,r:130}
      ],
      // קשה מהרכס: מי שהגיע לכאן כבר הדליק שלושה פנסים
      zones:[
        {id:'start',to:360, hp:0.9,dmg:0.65,speed:0.8, leash:260,back:16},
        {id:'near', to:800, hp:1.5,dmg:1.15,speed:1,  leash:380,back:22},
        {id:'far',  to:1e9, hp:2.1,dmg:1.5, speed:1.1,leash:480,back:30}
      ],
      decor:{trees:30,hills:22,rocks:0.7}
    },
    // ---- פרק 5: מגדלי הסערה (docs/story.md). גשם, ברקים, מגדלים שבורים, אויבים מחושמלים (אדמה!), ופנס הברק בפינה הדרום-מזרחית (STORY.lanterns.bolt).
    // storm: גשם והבזקי ברק בקנבס (wStorm). towers: מגדלי אבן שבורים שאי אפשר לעבור דרכם (h גובה הציור). ponds: שלוליות עמוקות
    storm:{
      region:'storm',back:'desert',enter:'w.enter.storm',noNpc:true,storm:true,ground:'#2E2C3A',pondCol:['#1E1A30','#8E7CC8'],
      home:{x:0,y:-600,r:44},gates:{},
      paths:{shadow:{x:-860,y:-590,r:44,need:['earth','water','ice','fire','bolt']}},   // פרק 6: רק כשכל חמשת הפנסים דולקים, שביל בצפון-מערב שיורד ללב הצל
      ponds:[{x:-80,y:60,r:120},{x:520,y:-40,r:85}],
      towers:[{x:-620,y:-330,r:46,h:150},{x:300,y:-330,r:40,h:110},{x:-380,y:330,r:44,h:170},{x:420,y:300,r:38,h:95},{x:-880,y:120,r:36,h:120}],
      fields:[{kind:'deadTree',n:8,x:-560,y:-80,r:200},{kind:'deadTree',n:5,x:120,y:420,r:150},{kind:'deadTree',n:4,x:680,y:-380,r:130},
              {kind:'stormRock',n:6,x:640,y:120,r:170},{kind:'stormRock',n:4,x:-250,y:-360,r:130},{kind:'rock',n:4,x:-700,y:420,r:120}],
      foes:[
        {type:'sparkwisp',n:2,x:-190,y:-420,r:110},{type:'sparkwisp',n:2,x:200,y:-420,r:110},
        {type:'stormknight',n:2,x:-420,y:-200,r:130},{type:'sparkwisp',n:3,x:380,y:-200,r:140},{type:'stormknight',n:3,x:640,y:120,r:150},
        {type:'stormknight',n:3,x:-640,y:200,r:150},{type:'sparkwisp',n:3,x:-60,y:330,r:140},{type:'stormknight',n:3,x:620,y:440,r:150},
        {type:'stormknight',creature:true,n:2,x:640,y:120,r:120},{type:'sparkwisp',creature:true,n:2,x:-560,y:-80,r:130}
      ],
      // קשה מהמדבר: מי שהגיע לכאן כבר הדליק ארבעה פנסים
      zones:[
        {id:'start',to:360, hp:0.95,dmg:0.7,speed:0.8, leash:260,back:16},
        {id:'near', to:800, hp:1.7, dmg:1.25,speed:1,  leash:380,back:22},
        {id:'far',  to:1e9, hp:2.4, dmg:1.65,speed:1.12,leash:480,back:30}
      ],
      decor:{trees:40,hills:20,rocks:0.6}
    },
    // ---- פרק 6 והאחרון: לב הצל (docs/story.md). חושך, ערפל סגול, ואור רק סביב הגיבור ופיוחו (wShadow). צללים של אויבים מכל האזורים,
    // והצל עצמו ליד הפנס הלבן, באמצע הדרום (STORY.lanterns.light). shadow: החושך בקנבס. ponds: בורות של חושך שאי אפשר לעבור
    shadow:{
      region:'shadow',back:'storm',enter:'w.enter.shadow',noNpc:true,shadow:true,ground:'#16101F',pondCol:['#07040D','#5B3F8C'],
      home:{x:0,y:-600,r:44},gates:{},paths:{},
      ponds:[{x:-460,y:-40,r:115},{x:470,y:-60,r:105},{x:-760,y:420,r:80}],
      fields:[{kind:'shadeTree',n:8,x:-560,y:-300,r:210},{kind:'shadeTree',n:6,x:560,y:-320,r:190},{kind:'shadeTree',n:4,x:-80,y:120,r:140},
              {kind:'voidRock',n:5,x:700,y:240,r:160},{kind:'voidRock',n:4,x:-640,y:200,r:140},{kind:'rock',n:4,x:220,y:-220,r:120}],
      foes:[
        {type:'shadewisp',n:2,x:-190,y:-420,r:110},{type:'shadewisp',n:2,x:200,y:-420,r:110},
        {type:'shadeknight',n:2,x:-420,y:-220,r:130},{type:'shadewisp',n:3,x:380,y:-200,r:140},{type:'shadeknight',n:3,x:700,y:240,r:150},
        {type:'shadeknight',n:3,x:-640,y:200,r:150},{type:'shadewisp',n:3,x:-60,y:160,r:140},{type:'shadeknight',n:2,x:380,y:470,r:130},
        {type:'shadeknight',creature:true,n:2,x:700,y:240,r:120},{type:'shadewisp',creature:true,n:2,x:-560,y:-300,r:130}
      ],
      // הכי קשה: מי שהגיע לכאן כבר הדליק חמישה פנסים
      zones:[
        {id:'start',to:360, hp:1.1, dmg:0.8, speed:0.85,leash:260,back:16},
        {id:'near', to:800, hp:1.9, dmg:1.35,speed:1,   leash:380,back:22},
        {id:'far',  to:1e9, hp:2.6, dmg:1.8, speed:1.14,leash:480,back:30}
      ],
      decor:{trees:50,hills:18,rocks:0.5}
    }
  }
};
// אזור שלא כותב size או map מקבל את המלבן הישן, ולא את המפה של האחו
for(const k in WORLD.regions)WORLD.regions[k]=Object.assign({},WORLD,{regions:null,map:null,size:{w:2100,h:1400}},WORLD.regions[k]);
// האזור שבו נמצאים עכשיו: WORLD (האחו) או אחד מ-WORLD.regions
const WR=()=>S&&S.wd&&WORLD.regions[S.wd.reg]||WORLD;

const wKind=k=>NODES.kinds[k];
/* הגבולות של המקום הנוכחי, שאפשר ללכת בהם: {x0,x1,y0,y1}, או null כשאין גבול (הזירה פתוחה לכל הכיוונים).
   השחקן, המבוקש והשלל על הרצפה נשארים בתוכם, כדי ששלל תמיד ינחת איפה שאפשר להגיע (ניר: "הרגתי את המבוקש מחוץ לגבולות, והשלל לא נאסף") */
function placeBox(){if(!S.wd)return null;const {w,h}=WR().size,m=WORLD.edge;return{x0:-w/2+m,x1:w/2-m,y0:-h/2+m,y1:h/2-m}}
function placeClamp(o){const B=placeBox();if(!B)return o;o.x=Math.max(B.x0,Math.min(B.x1,o.x));o.y=Math.max(B.y0,Math.min(B.y1,o.y));return tStep(o)}   // tStep: לא בתוך נהר, יער או צוק (terrain.js)
// השערים של האזור: הבית, שערי הזירה, והדרכים שהעלילה כבר פתחה (storyOpen ב-story.js)
const wPathOpen=p=>p.open?p.open():!p.need||[].concat(p.need).every(storyOpen);   // need יכול להיות רשימה: כל הפנסים בה דולקים (לב הצל)
function wGates(all){const R=WR(),o=Object.assign({home:R.home},R.gates);for(const k in R.paths)if(all||wPathOpen(R.paths[k]))o[k]=R.paths[k];return o}
const wIsPath=k=>k!=='home'&&!!WR().paths[k];
// השם של שער: לכפר, לאזור אחר, או זירה
const wGateName=k=>k==='home'?(WR().back?T('w.path.'+WR().back):T('w.home')):wIsPath(k)?T('w.path.'+k):T('w.gate.'+k);
const wGateCol=k=>k==='home'?C.chalk:wIsPath(k)?C.tide:C.lilac;
let wRet=null;   // השער שממנו נכנסו לזירה: בסוף הריצה חוזרים אליו (againBtn ב-input.js)

/* ---- מעבר בין מקומות ---- */
function worldUi(on){if(!on)TR=null;document.body.classList.toggle('world',on);$('whud').hidden=!on;$('chTag').hidden=!on;if(!on){$('wPanel').hidden=true;const g=$('wGo');if(g)g.hidden=true;wnpcOff();fishOff();wmapOpen(false);travelOff()}}   // wnpcOff: הדמויות בעולם (worldnpc.js)   // fishOff: הדיג (fishing.js)   // wmapOpen: המפה (worldmap.js)
// at: 'home' (מהכפר, או מהאזור הקודם), id של שער (חזרה מהזירה) או של דרך (חזרה מאזור אחר). reg: איזה אזור, ברירת המחדל האחו
function enterWorld(at,reg){
  wRet=null;reset();S.mode='play';
  reg=WORLD.regions[reg]?reg:'meadow';
  S.wd={reg,t:0,gt:0,near:null,ui:'',groups:WR().foes.map(()=>({t:0})),got:{}};
  const R=WR();terrainEnter(R,reg);   // המפה של האזור: מה חסום ומה מאט (terrain.js). אזור בלי map: null, ומלבן כמו קודם
  S.nd={list:wNodes(),broken:0,got:[]};
  const g=wGates()[at]||R.home;
  P.x=g.x;P.y=g.y+WORLD.arrive;P._tx=null;tFree(P);P.aim=P.face=Math.PI/2;S.cam.x=P.x;S.cam.y=P.y;   // tFree: שמירה ישנה או שער שזז, ונקודת ההגעה חסומה: לנקודה הפנויה הקרובה
  ['ovStart','ovOver','ovLevel','ovBoss','ovWDeath'].forEach(id=>$(id).hidden=true);
  R.foes.forEach((G,i)=>{if(!TR||R.dpBase||Math.hypot(G.x-P.x,G.y-P.y)<TERRAIN.wake)wSpawn(G,i);else S.wd.groups[i].lazy=1});   // באחו הגדול: קבוצה רחוקה נוצרת רק כשמתקרבים (wFoes)
  // שם האזור: פעם אחת בכניסה הראשונה לכל אזור, כותרת קטנה למעלה במרכז (feedTitle ב-feed.js, docs/plan-hud.md פרק 6). האזהרה על התרמיל בכרטיס השער (vil.outInfo)
  const seen=SAVE.regSeen||(SAVE.regSeen={});if(!seen[reg]){seen[reg]=1;saveNow();feedTitle(T(R.enter||'w.enter'),C.gold)}
  worldUi(true);
  fishMealOn();   // ארוחה מהפונדקאית: חיזוק בעולם (fishing.js)
  huntEnter();rareEnter();mutEnter();nemEnter();   // מבוקש היום (hunt.js), החוק והמשימה של היום (mutation.js), נמסיס שמחכה באזור (nemesis.js)
  wmapVisit(reg);     // מפת העולם: ביקרת כאן (worldmap.js)
  if(reg!=='meadow')questEvent('story',reg);   // קווסט עלילה "להגיע לאגם" (quests.js)
}
// דרך לאזור אחר. חוזרים לאזור הקודם ליד הדרך שממנה יצאו
function wGo(to){if(depthsGo(to))return;const from=S.wd.reg;worldUi(false);enterWorld(WR().back===to?from:'home',to)}
function wArena(id,a){wRet=id;worldUi(false);startRun(a);questEvent('reach','arena')}
function wHome(){worldUi(false);enterVillage()}

/* ---- מקורות משאבים: אותם מקורות כמו ב-nodes.js, במקומות קבועים. שבור צומח מחדש אחרי regrow (nodeDown) ---- */
function wNodes(){
  const R=WR(),out=[],block=Object.values(wGates(true)),wet=R.ponds||[];
  R.fields.forEach((F,fi)=>{const K=wKind(F.kind);
    for(let i=0,tries=0;i<F.n&&tries<F.n*12;tries++){
      const a=hash(fi*31+tries,7)*Math.PI*2,r=Math.sqrt(hash(tries,fi*17+3))*F.r,x=F.x+Math.cos(a)*r,y=F.y+Math.sin(a)*r;
      if(tBlocked(x,y)||tBlocked(x+K.r,y)||tBlocked(x-K.r,y)||out.some(n=>Math.hypot(n.x-x,n.y-y)<n.r+K.r+24)||block.some(g=>Math.hypot(g.x-x,g.y-y)<g.r+WORLD.arrive)||wet.some(p=>Math.hypot(p.x-x,p.y-y)<p.r+K.r))continue;
      out.push({node:true,id:fi+'_'+i,kind:F.kind,x,y,r:K.r,hp:K.hp,max:K.hp,mult:multOf(K.tags),flash:0,back:0,regrow:WORLD.regrow});i++}});
  return out;
}
// מה שנאסף מהרצפה בעולם (drops.js) עובר מיד לתרמיל ונשמר. שם הוא בסיכון
function wLootIn(){
  const L=S.loot;if(!L)return;let any=false;
  for(const r in L)if(L[r]>0){bagAdd(r,L[r]);questEvent('gather',r,L[r]);S.wd.got[r]=(S.wd.got[r]||0)+L[r];any=true}
  S.loot={};if(any)saveNow();
}

/* ---- אויבים: קבוצה לכל שורה ב-WORLD.foes ---- */
// האזור של קבוצה, לפי המרחק של הבית שלה מהשער לכפר
const wZone=G=>{const R=WR();return R.zones.find(z=>Math.hypot(G.x-R.home.x,G.y-R.home.y)<z.to)};
// רצפה לחיים של אויב בעולם (WORLD.foeMin), לפני תכונה מיוחדת (affix.js)
function wTough(e,Z){const m=Z.min??WORLD.foeMin*Z.hp;if(e.max<m){e.hp=e.max=m}if(Z.wind)e.wind=Z.wind}   // Z.min ו-Z.wind: אזור שמגדיר בעצמו (start)
function wSpawn(G,i){
  if(!ETYPES[G.type])return;const Z=wZone(G);
  for(let k=0,n=mutN(G.n);k<n;k++){   // mutN: יום הענקים או הנחיל (mutation.js)
    const a=rand(0,6.28),r=rand(0,G.r),e=addEnemy(G.type,G.x+Math.cos(a)*r,G.y+Math.sin(a)*r,Z.hp*WORLD.foeHp);wTough(e,Z);
    e.dmg*=Z.dmg*storySafe();e.speed*=Z.speed;e.zone=Z.id;affixRoll(e,Z.id);   // affixRoll: אולי אויב מיוחד (affix.js). storySafe: אחרי שפנס האדמה נדלק (story.js)
    e.xp=0;e.home=i;e.creature=!!G.creature;
    if(G.tough){e.hp*=G.tough;e.max*=G.tough;e.dmg*=G.tough}   // שומרים בכניסה לדרך (curiosity.js)
    mutSpawn(e);tierSpawn(e);wtSpawn(e)}   // mutSpawn: החוק של היום (mutation.js)   // wtSpawn: שחקן שעבר את האזור (wtension.js)   // דרגת העולם (tiers.js)
   // בלי XP: בעולם לא עולים רמה, זה שייך לריצה בזירה
}
function wFoes(dt){
  const FO=WR().foes,alive=FO.map(()=>0);
  wtGroups();   // מכים אחד, והקבוצה שלו מתעוררת (wtension.js)
  for(const e of enemies){
    if(e.dead||e.dummy)continue;   // בובות אימון (skpractice.js) לא זזות: בלי זה התנהגות של foeai.js (הסתערות, קפיצה) הזיזה אותן
    if(e.wanted){wantedMove(e,dt);continue}
    if(e.warden){storyWardenMove(e,dt);continue}
    if(e.evt){evFoeMove(e,dt);continue}
    if(e.rare){rareMove(e,dt);continue}   // מפלצת נדירה: ליד המקום הנסתר שלה (rares.js)
    if(e.pack){if(foeAi(e,dt,Math.hypot(P.x-e.x,P.y-e.y)))foeAiTail(e,dt);else paceFoeMove(e,dt);continue}   // התנהגות לפי סוג (foeai.js)   // להקה שמגיעה מקצה המסך (pacing.js)   // גל של אירוע (events.js)   // השומר האבן (story.js)
    alive[e.home]++;
    const G=FO[e.home]||FO[0];let dx=P.x-e.x,dy=P.y-e.y;const d=Math.hypot(dx,dy)||1;
    if(TR&&d>TERRAIN.sleep)continue;   // רחוק מאוד מהשחקן: לא חושב ולא זז (האחו הגדול)
    let mx=0,my=0,sp=e.speed*slowK(e);   // קפוא, תקוע או מאובן לא זזים (slowK ב-dmg.js)
    if(e.alert>0)e.alert-=dt;   // קורא תקע בקרן (foeai.js): רודף גם מרחוק, ורחוק יותר מהבית
    if((d<WORLD.aggro||e.alert>0)&&Math.hypot(P.x-G.x,P.y-G.y)<wZone(G).leash*(e.alert>0?1.6:1)){   // רודף, אבל לא רחוק מהבית. אחרת חוזר להסתובב שם
      if(foeAi(e,dt,d)){foeAiTail(e,dt);continue}   // התנהגות לפי סוג: מקיף, מסתער, יורה מרחוק, קופץ (foeai.js)
      if(TR){const t=tDir(e,P.x,P.y);dx=t.x-e.x;dy=t.y-e.y}const dd=Math.hypot(dx,dy)||1;   // בלי קו ראייה (נהר, יער): מסביב, במורד מפת המרחקים (terrain.js)
      mx=dx/dd;my=dy/dd;   // הייתה בסוף שורת ההערה מעל ונבלעה בה (#114), ולכן קבוצות לא רדפו
      if(e.type==='wisp'){if(d<170){mx=-mx;my=-my}e.shoot-=dt;if(e.shoot<=0){e.shoot=rand(1.8,2.8);shootE(e.x,e.y,Math.atan2(dy,dx),175,6,8)}}}
    else{   // מסתובב ליד הבית
      if(e.wx==null||Math.hypot(e.wx-e.x,e.wy-e.y)<12||e.wt>4){const a=rand(0,6.28),r=rand(0,G.r);e.wx=G.x+Math.cos(a)*r;e.wy=G.y+Math.sin(a)*r;e.wt=0;
        if(TR&&!tLOS(e.x,e.y,e.wx,e.wy)){const t=tDir(e,G.x,G.y);e.wx=t.x;e.wy=t.y}}   // לא מנסים להסתובב אל מעבר לנהר: חוזרים הביתה מסביב
      e.wt=(e.wt||0)+dt;
      const wx=e.wx-e.x,wy=e.wy-e.y,wd=Math.hypot(wx,wy)||1;mx=wx/wd;my=wy/wd;sp*=WORLD.wander}
    if(strikeTick(e,dt,d)){mx=my=0}   // מכה עם הכנה במקום נזק במגע. בזמן ההכנה עומד (strike.js)
    e.x+=mx*sp*dt+e.kx*dt;e.y+=my*sp*dt+e.ky*dt;
    const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*sp*0.08;e.flash-=dt;
  }
  // קבוצה שנוקתה חוזרת אחרי זמן, כשהשחקן רחוק ממנה
  if(TR&&!WR().dpBase)FO.forEach((G,i)=>{const g=S.wd.groups[i];   // האחו הגדול: קבוצה שהשחקן התרחק ממנה מאוד חוזרת לישון, כדי שלא יצטברו עשרות אויבים בכל המפה
    if(!alive[i]||g.lazy||Math.hypot(P.x-G.x,P.y-G.y)<TERRAIN.forget)return;
    for(const e of enemies)if(e.home===i&&!e.dead&&!e.wanted&&!e.warden&&!e.evt&&!e.pack&&!e.nem&&!e.hunt&&!(e.alert>0))e.dead=true;
    g.lazy=1;alive[i]=0});
  FO.forEach((G,i)=>{const g=S.wd.groups[i];if(alive[i]||!ETYPES[G.type])return;
    if(g.lazy){if(Math.hypot(P.x-G.x,P.y-G.y)<TERRAIN.wake&&paceRoom(G.n+TERRAIN.room)){g.lazy=0;wSpawn(G,i)}return}   // paceRoom: לא עוברים את מגבלת האויבים (PACE.cap)   // עוד לא נוצרה: רק כשמתקרבים
    if(g.t<=0)g.t=wZone(G).back;else if((g.t-=dt)<=0&&paceRoom(G.n)&&Math.hypot(P.x-G.x,P.y-G.y)>G.r+Math.max(WORLD.far,Math.hypot(W,H)/2)){wSpawn(G,i);g.n=(g.n||0)+1}else g.t=Math.max(g.t,0.01)});
}

/* ---- כל פריים בעולם ---- */
function worldUpdate(dt){
  const w=S.wd;w.t+=dt;
  P.inv-=dt;P.swapBuff-=dt;S.hurt-=dt;S.shake=Math.max(0,S.shake-dt*30);
  const {ix,iy}=movePlayer(dt);if(P.moving&&!nearest(440))P.aim=Math.atan2(iy,ix);
  placeClamp(P);
  for(const n of S.nd.list){
    if(n.dead){if((n.back-=dt)<=0){n.dead=false;n.hp=n.max}continue}
    const dx=P.x-n.x,dy=P.y-n.y,d=Math.hypot(dx,dy)||1,min=n.r+P.r;if(d<min){P.x=n.x+dx/d*min;P.y=n.y+dy/d*min}   // לא עוברים דרך עץ
    n.flash-=dt;
  }
  wPonds(P);
  attack(dt);   // פוגעת גם במקורות משאבים (aimTarget ב-combat.js)
  skillsUpdate(dt);orbitUpdate(dt);wskUpdate(dt);wskHud();   // סקילים שיורים והחפצים המסתובבים, כמו בזירה (wskill.js, skills.js, orbit.js)
  wFoes(dt);if(S.mode!=='play')return;
  const hitable=S.nd.list.length?enemies.concat(S.nd.list):enemies;   // קליעים פוגעים גם במקורות משאבים (nodes.js), כמו בזירה
  for(const b of pb){shotFly(b,dt);
    for(const e of hitable){if(e.dead||b.hit.has(e)||b.life<=0||Math.hypot(e.x-P.x,e.y-P.y)-e.r>WORLD.attackRange)continue;
      if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+4)shotHit(b,e)}}
  pb=pb.filter(b=>b.life>0);
  for(const b of eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(Math.hypot(P.x-b.x,P.y-b.y)<P.r+b.r-3){hurt(b.dmg);b.life=0}}
  eb=eb.filter(b=>b.life>0);if(S.mode!=='play')return;
  orbs=[];   // XP רק בזירה (גם מהמבוקש)
  dmgUpdate(dt);mutUpdate(dt);innUpdate(dt);   // שריפה, רטיבות, האטה והלם נגמרים (dmg.js). לפני 4.11 לא רץ בעולם, ומצבים נשארו לתמיד. המוטציה היומית (mutation.js)
  wantedUpdate(dt);storyUpdate(dt);depthsUpdate(dt);affixUpdate(dt);eventsUpdate(dt);paceUpdate(dt);foeLeaderTick();foeLoreUpdate(dt);nemUpdate(dt);rareUpdate(dt);   // העלילה (story.js), אויבים מיוחדים (affix.js), להקות וקצב (pacing.js)
  terrainTick();   // אויבים ופיוחו: לא בתוך מים, יער או צוק, ולאט במעבר הרדוד (terrain.js)
  dropsUpdate(dt);secretsUpdate(dt);curioUpdate();wLootIn();   // secretsUpdate: סודות (secrets.js), לפני שהשלל נכנס לתרמיל, בשביל ברכת השלל. curioUpdate: מכשול בדרך שנעלם ברמה (curiosity.js)
  if(!nearest(WORLD.aggro)&&!TF('berserk'))P.hp=Math.min(P.maxHp,P.hp+WORLD.regen*mutK('regen')*dt);   // mutK: יום הצמא מרפא לאט (mutation.js)
  enemies=enemies.filter(e=>!e.dead);
  for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;p.vy*=0.9;p.life-=dt}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y+=f.vy*dt;f.life-=dt}
  floats=floats.filter(f=>f.life>0);
  // ליד שער: בועה מעליו וכפתור עגול (wGoBtn). הביתה ושבילים: העיגול נכנס מיד. שער לזירה: העיגול פותח כרטיס עם שתי האפשרויות
  w.near=null;const gs=wGates();for(const k in gs){const g=gs[k];if(Math.hypot(P.x-g.x,P.y-g.y)<g.r+P.r+WORLD.near)w.near=k}
  worldHud();cornerHud();   // הפינות העליונות והמפה הקטנה (minimap.js)
  wnpcUpdate(dt);   // דמויות שמגלים בעולם, וכפתור "לדבר" (worldnpc.js)
  fishUpdate(dt);   // דיג ליד מים, וכפתור "לדוג" (fishing.js)
  travelUpdate();   // ליד פנס דולק: "חזרה לכפר" (travel.js)
}

/* ---- מוות בעולם: חצי מכל משאב בתרמיל הולך, הפריטים והמחסן נשארים. נקרא מ-gameOver ---- */
function worldDeath(){
  nemOnDeath();   // מי שהפיל אותך נהיה נמסיס (nemesis.js)
  S.mode='over';joy=null;
  const lost={},k=S.wd.dp?0:RES.deathLoss.resources;   // עומק הצל: לא מאבדים כלום (depths.js)   // resources.js
  for(const r in SAVE.bag){if(!resOf(r))continue;const n=Math.floor(SAVE.bag[r]*k);if(n>0){bagTake(r,n);lost[r]=n}}
  S.wd.lost=lost;saveNow();
  $('wPanel').hidden=true;
  $('wLost').innerHTML=bagLine(lost)||T('w.lostNone');if(S.wd.dp)depthsDied();
  setTimeout(()=>{if(S.wd)$('ovWDeath').hidden=false},700);
}
$('wRespawn').onclick=()=>{$('ovWDeath').hidden=true;wHome()};

/* ---- ממשק: שם האזור והתרמיל למעלה, ופאנל ליד שער ---- */
function worldHud(){
  const w=S.wd;if(w.open&&w.open!==w.near)w.open=null;   // מתרחקים מהשער: הכרטיס נסגר
  const open=!!w.near&&w.open===w.near,key=LANG+'|'+w.near+'|'+open+'|'+S.mode+'|'+JSON.stringify(SAVE.bag);
  if(key===w.ui)return;w.ui=key;
  $('wName').textContent=depthsName()||T('w.region.'+WR().region);
  $('wBag').innerHTML=cornerRes(resShown('world'));   // עד 2 משאבים ליד ☰, והשאר ב-"+N" (minimap.js)
  wGoBtn(w);
  const pn=$('wPanel'),k=w.near;pn.hidden=!open;if(pn.hidden)return;
  const back=k==='home'&&WR().back,to=back||(wIsPath(k)&&k);
  pn.innerHTML=to?winHead(wGateName(k))+'<p>'+T('w.pathInfo.'+to)+'</p><button class="vbtn" data-act="path" data-g="'+to+'">'+T('w.goPath')+'</button>'
    :k==='home'?winHead(T('w.home'))+'<p>'+T('w.homeInfo')+'</p><button class="vbtn" data-act="home">'+T('w.goHome')+'</button>'
    :winHead(T('w.gate.'+k))+'<p>'+T('w.arenaInfo')+'</p><button class="vbtn" data-act="arena" data-g="'+k+'">'+T('w.enterArena')+'</button><button class="vbtn" data-act="arena" data-g="'+k+'" data-a="waves">'+T('w.enterWaves')+'</button><button class="vbtn" data-act="arena" data-g="'+k+'" data-a="boss">'+T('w.enterBoss')+'</button><button class="vbtn" data-act="arena" data-g="'+k+'" data-a="maze">'+T('w.enterMaze')+'</button>';   // זירת גלים (arenas.js)
}
$('wPanel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!S.wd||S.mode!=='play')return;
  if(b.dataset.act==='close')wShut();else if(b.dataset.act==='home')wHome();else if(b.dataset.act==='arena')wArena(b.dataset.g,b.dataset.a);else if(b.dataset.act==='path')wGo(b.dataset.g);
});

function wShut(){if(!S.wd)return;S.wd.open=null;worldHud()}
// הכפתור העגול ליד שער (בסרגל ההקשר, מעל הסקילים): פותח את הכרטיס. נעלם כשהכרטיס פתוח
const wGoEl=(()=>{const b=document.createElement('button');b.id='wGo';b.className='nbtn talkbtn wgo';b.hidden=true;
  $('talkBtn').before(b);b.addEventListener('click',()=>{const w=S.wd;if(!w||!w.near||S.mode!=='play')return;sfx('ui');
    // הביתה ושביל לאזור אחר: נכנסים מיד, בלי כרטיס (ניר, 2.11: "זה עדיין מקפיץ עוד הודעה. מיותר, הכפתור מספיק"). שער לזירה: כרטיס, כי יש שתי אפשרויות
    const k=w.near,to=k==='home'&&WR().back||wIsPath(k)&&k;if(to){wGo(to);return}if(k==='home'){wHome();return}
    w.open=k;worldHud()});return b})();
const wGoIco=k=>k==='home'&&!WR().back?['🏠','ctx.home']:k==='home'||wIsPath(k)?['🧭','ctx.go']:['⚔️','ctx.arena'];
function wGoBtn(w){
  const k=w.near,show=!!k&&w.open!==k&&S.mode==='play';wGoEl.hidden=!show;if(!show)return;
  const [i,t]=wGoIco(k);wGoEl.innerHTML='<span class="ni" aria-hidden="true">'+i+'</span>'+T(t);wGoEl.setAttribute('aria-label',wGateName(k));
}

/* ---- ציור ---- */
// קישוטים מחוץ לגבול: עצים וגבעות. תמיד באותם מקומות, ופתוח מול השער לכפר
function worldDecor(){
  const R=WR(),C_=worldDecor.c||(worldDecor.c={});if(C_[R.region])return C_[R.region];
  if(R.map)return C_[R.region]=[];   // אזור עם מפה: היער והצוקים בקצה מצוירים ב-terrain.js
  const out=[],{w,h}=R.size,D=R.decor,per=2*(w+h);
  const edge=(t,off)=>{let s=t*per;if(s<w)return[-w/2+s,-h/2-off];s-=w;if(s<h)return[w/2+off,-h/2+s];s-=h;if(s<w)return[w/2-s,h/2+off];s-=w;return[-w/2-off,h/2-s]};
  for(let i=0;i<D.trees;i++){const [x,y]=edge((i+hash(i,8)*0.5)/D.trees,40+hash(i,1)*90);if(Math.abs(x-R.home.x)<130&&y<0)continue;
    out.push({kind:hash(i,2)<D.rocks?'rock':'tree',x,y,v:hash(i,3)})}
  for(let i=0;i<D.hills;i++){const [x,y]=edge((i+0.5)/D.hills,260+hash(i,4)*80);if(Math.abs(x-R.home.x)<200&&y<0)continue;out.push({kind:'hills',x,y,v:hash(i,5)})}
  return C_[R.region]=out;
}
function wArch(g,col){
  ctx.strokeStyle=col;ctx.lineWidth=4;ctx.fillStyle='rgba(236,231,220,0.12)';
  ctx.beginPath();ctx.moveTo(g.x-26,g.y+14);ctx.lineTo(g.x-26,g.y-14);ctx.arc(g.x,g.y-14,26,Math.PI,0);ctx.lineTo(g.x+26,g.y+14);ctx.closePath();ctx.fill();ctx.stroke();
}
// בעולם: בדו-ממד צורות פשוטות. בתלת-ממד הקישוטים, השערים והמקורות מצוירים בשכבה שמתחת (syncWorld ב-render3d.js), וכאן רק פס החיים של מקור
function drawWorld(){
  if(!S.wd)return;
  if(!R3D.on){
    const R=WR(),{w,h}=R.size;if(!terrain2d()){ctx.fillStyle=R.ground;ctx.fillRect(-w/2,-h/2,w,h)}   // terrain2d: נהר, יער, רכס וגבול (terrain.js)
    const pc=R.pondCol||['#1E4A63','#3F7BA0'];for(const p of R.ponds||[]){ctx.fillStyle=pc[0];ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();ctx.strokeStyle=pc[1];ctx.lineWidth=4;ctx.stroke()}
    for(const d of worldDecor()){
      if(d.kind==='tree'){ctx.fillStyle='#24452F';ctx.beginPath();ctx.arc(d.x,d.y,20+d.v*10,0,7);ctx.fill()}
      else if(d.kind==='rock'){ctx.fillStyle='#4A5064';ctx.beginPath();ctx.arc(d.x,d.y,12,0,7);ctx.fill()}
      else{ctx.fillStyle='#1E3526';ctx.beginPath();ctx.arc(d.x,d.y,70,0,7);ctx.fill()}
    }
    const gs=wGates();for(const k in gs)wArch(gs[k],wGateCol(k));
  }
  for(const n of S.nd.list){
    if(n.dead)continue;const K=wKind(n.kind),fl=n.flash>0,r=n.r,x=n.x,y=n.y;
    if(!R3D.on){
      ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+r*0.7,r*1.1,r*0.4,0,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2;
      if(K.shape==='tree'){ctx.fillStyle=fl?'#fff':'#6B4A2B';ctx.fillRect(x-4,y-4,8,r*0.9);ctx.fillStyle=fl?'#fff':K.col;ctx.beginPath();ctx.arc(x,y-r*0.6,r,0,7);ctx.fill();ctx.stroke()}
      else{ctx.beginPath();ctx.moveTo(x-r,y+r*0.5);ctx.lineTo(x-r*0.7,y-r*0.5);ctx.lineTo(x,y-r);ctx.lineTo(x+r*0.8,y-r*0.4);ctx.lineTo(x+r,y+r*0.5);ctx.closePath();
        ctx.fillStyle=fl?'#fff':K.shape==='vein'?'#5A6075':K.col;ctx.fill();ctx.stroke();
        if(K.shape==='vein'){ctx.fillStyle=K.col;for(let i=0;i<3;i++){const a=i*2.1;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*0.45,y-r*0.1+Math.sin(a)*r*0.3,3.5,0,7);ctx.fill()}}}
    }
    if(n.hp<n.max){const bw=r*2;ctx.fillStyle='rgba(5,7,13,0.6)';ctx.fillRect(x-bw/2,y-r*2.2,bw,4);ctx.fillStyle=C.gold;ctx.fillRect(x-bw/2,y-r*2.2,bw*Math.max(0,n.hp/n.max),4)}
  }
  drawWnpcs();   // worldnpc.js
  fishDraw();   // החכה והמצוף (fishing.js)
  storyDraw();   // הפנס והשומר (story.js)
  affixDraw();   // פיצוצים של אויבים מיוחדים (affix.js)
  strikeDraw();   // קשת אדומה של מכה שמתכוננת (strike.js)
  foeAiDraw();   // הסתערות, ירייה וקפיצה שמסומנות על הרצפה (foeai.js)
  eventsDraw();scentDraw();rareDraw();   // אירועים (events.js), החיה מובילה (petscent.js)
  secretsDraw();curioDraw();   // סודות (secrets.js), מכשול בדרך לאזור הבא (curiosity.js)
  if(WR().fog)wFog();
  if(WR().snow)wSnow();   // הרכס הקפוא
  if(WR().heat)wHeat();   // המדבר הבוער
  if(WR().storm)wStorm();   // מגדלי הסערה
  if(WR().shadow)wShadow();   // לב הצל
  mutDraw();   // גשם או ערפל של היום (mutation.js)
}
// מים שאי אפשר ללכת בהם: דוחפים החוצה, כמו מעץ
function wPonds(o){tStep(o);for(const p of (WR().ponds||[]).concat(WR().towers||[])){const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy)||1,min=p.r+(o.r||12);if(d<min){o.x=p.x+dx/d*min;o.y=p.y+dy/d*min}}}
/* ערפל עדין: כמה כתמים לבנים שקופים שנעים לאט סביב השחקן. ציור אחד מוכן מראש לכל כתם, כדי שיהיה קל לטלפון */
const FOG={n:7,size:360,alpha:0.16,drift:9,spread:520};
function wFog(){
  let s=wFog.spr;if(!s){s=wFog.spr=document.createElement('canvas');s.width=s.height=128;const c=s.getContext('2d'),g=c.createRadialGradient(64,64,4,64,64,64);
    g.addColorStop(0,'rgba(220,235,245,1)');g.addColorStop(1,'rgba(220,235,245,0)');c.fillStyle=g;c.fillRect(0,0,128,128)}
  const t=fxNow(),F=FOG,W=F.spread*2;ctx.save();ctx.globalAlpha=F.alpha;
  for(let i=0;i<F.n;i++){
    const bx=hash(i,11)*W+t*F.drift*(0.5+hash(i,12)),by=hash(i,13)*W+Math.sin(t*0.2+i)*30;
    const x=P.x-F.spread+(((bx-P.x)%W)+W)%W,y=P.y-F.spread+(((by-P.y)%W)+W)%W,sz=F.size*(0.7+hash(i,14)*0.6);
    ctx.drawImage(s,x-sz/2,y-sz/2,sz,sz*0.6)}
  ctx.restore();
}
/* שלג: פתיתים לבנים שיורדים באלכסון סביב השחקן, ועוד שכבת קור כחלחלה עדינה. בלי מערך חי: כל פתית מחושב מהזמן, אז זול לטלפון */
const SNOW={n:70,spread:560,fall:46,sway:18,size:[1.5,3.6],alpha:0.75,chill:0.07};
function wSnow(){
  const t=fxNow(),F=SNOW,W=F.spread*2;ctx.save();
  ctx.fillStyle='rgba(170,210,255,'+F.chill+')';ctx.fillRect(P.x-F.spread*2,P.y-F.spread*2,W*2,W*2);
  ctx.fillStyle='#F4FAFF';
  for(let i=0;i<F.n;i++){
    const sp=0.6+hash(i,21)*0.8,bx=hash(i,22)*W+Math.sin(t*0.7+i)*F.sway+t*F.fall*0.35*sp,by=hash(i,23)*W+t*F.fall*sp;
    const x=P.x-F.spread+(((bx-P.x)%W)+W)%W,y=P.y-F.spread+(((by-P.y)%W)+W)%W,r=F.size[0]+hash(i,24)*(F.size[1]-F.size[0]);
    ctx.globalAlpha=F.alpha*(0.5+hash(i,25)*0.5);ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
  ctx.restore();
}
/* חום: אדי חום שמתנודדים מעל החול, גרגרי חול שהרוח סוחפת לרוחב, וגוון כתום חם. כמו השלג: הכל מחושב מהזמן, בלי מערך חי */
const HEAT={haze:14,sand:60,spread:560,wind:150,size:[1,2.6],alpha:0.55,warm:0.08};
function wHeat(){
  const t=fxNow(),F=HEAT,W=F.spread*2;ctx.save();
  ctx.fillStyle='rgba(255,140,60,'+F.warm+')';ctx.fillRect(P.x-F.spread*2,P.y-F.spread*2,W*2,W*2);
  ctx.strokeStyle='rgba(255,220,170,0.12)';ctx.lineWidth=3;
  for(let i=0;i<F.haze;i++){   // אדי חום: קווים גליים שעולים לאט
    const bx=P.x-F.spread+hash(i,31)*W,by=P.y-F.spread+((((hash(i,32)*W-t*18)%W)+W)%W),len=60+hash(i,33)*90;
    ctx.beginPath();for(let k=0;k<=8;k++){const x=bx+k/8*len,y=by+Math.sin(t*3+i+k*0.9)*4;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
  ctx.fillStyle='#F2D19A';
  for(let i=0;i<F.sand;i++){   // רוח חול: גרגרים שעפים לרוחב
    const sp=0.6+hash(i,34)*0.9,bx=hash(i,35)*W+t*F.wind*sp,by=hash(i,36)*W+Math.sin(t*1.3+i)*14;
    const x=P.x-F.spread+(((bx-P.x)%W)+W)%W,y=P.y-F.spread+(((by-P.y)%W)+W)%W,r=F.size[0]+hash(i,37)*(F.size[1]-F.size[0]);
    ctx.globalAlpha=F.alpha*(0.4+hash(i,38)*0.6);ctx.fillRect(x,y,r*2.4,r)}
  ctx.restore();
}
/* ---- מגדלי הסערה (פרק 5): מגדלים שבורים, גשם באלכסון, והבזקי ברק. כמו השלג: הכל מחושב מהזמן, בלי מערך חי ----
   flash: כל every שניות (בערך) ברק רחוק מאיר את המסך ל-len שניות. bolt: ברק אמיתי נראה בשמיים, רחוק מהשחקן */
const STORM={rain:80,lo:0.5,spread:560,fall:620,slant:0.32,len:18,alpha:0.45,dark:0.12,flash:{every:5.5,len:0.18,alpha:0.35}};
function wStorm(){
  const t=fxNow(),F=STORM,W=F.spread*2;ctx.save();
  if(!R3D.on)for(const tw of WR().towers||[])wTower(tw);   // בתלת-ממד: מגדל אבן אמיתי (props3d.js)
  ctx.fillStyle='rgba(20,16,50,'+F.dark+')';ctx.fillRect(P.x-F.spread*2,P.y-F.spread*2,W*2,W*2);
  ctx.strokeStyle='#B9C4F0';ctx.lineWidth=1.4;
  const nR=typeof VFX3D!=='undefined'&&VFX3D.quality()==='lo'?Math.ceil(F.rain*F.lo):F.rain;   // איכות אפקטים נמוכה: פחות טיפות
  for(let i=0;i<nR;i++){   // טיפות: קווים קצרים שנופלים באלכסון
    const sp=0.75+hash(i,41)*0.5,bx=hash(i,42)*W-t*F.fall*sp*F.slant,by=hash(i,43)*W+t*F.fall*sp;
    const x=P.x-F.spread+(((bx-P.x)%W)+W)%W,y=P.y-F.spread+(((by-P.y)%W)+W)%W;
    ctx.globalAlpha=F.alpha*(0.5+hash(i,44)*0.5);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-F.len*F.slant,y+F.len);ctx.stroke()}
  const n=Math.floor(t/F.flash.every),ph=t-n*F.flash.every,at=hash(n,45)*(F.flash.every-F.flash.len);   // ברק אחד בכל מחזור, ברגע אקראי
  if(ph>at&&ph<at+F.flash.len){const k=1-(ph-at)/F.flash.len;
    ctx.globalAlpha=F.flash.alpha*k;ctx.fillStyle='#EDE6FF';ctx.fillRect(P.x-F.spread*2,P.y-F.spread*2,W*2,W*2);
    const bx=P.x+(hash(n,46)-0.5)*F.spread*1.6,by=P.y-F.spread*0.9;ctx.globalAlpha=k;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(bx,by);for(let j=1;j<=7;j++)ctx.lineTo(bx+(hash(n,50+j)-0.5)*70,by+j*45);ctx.stroke()}
  ctx.restore();
}
/* ---- לב הצל (פרק 6): חושך על כל המסך, ועיגול אור רך סביב הגיבור. פיוחו והפנס הלבן (כשהוא דולק) זוהרים בחושך, וערפל סגול נע לאט.
   החושך הוא שיפוע אחד סביב הגיבור, בלי קנבס נוסף, כדי שיהיה קל לטלפון. אחרי שהפנס הלבן נדלק: litDark במקום dark.
   light: רדיוס האור בפיקסלים של העולם. pet, lantern: רדיוס הזוהר. mist: כתמים סגולים, כמו הערפל באגם ---- */
const SHADOW={col:'10,5,22',dark:0.82,litDark:0.35,light:250,pet:110,lantern:280,flicker:7,mist:{n:6,size:300,alpha:0.1,drift:11,spread:520}};
function wShadow(){
  const F=SHADOW,t=fxNow(),R=F.light+Math.sin(t*3)*F.flicker,a=STO().light?F.litDark:F.dark,big=3000,cx=P.x,cy=P.y-20;ctx.save();
  const g=ctx.createRadialGradient(cx,cy,R*0.35,cx,cy,R);g.addColorStop(0,'rgba('+F.col+',0)');g.addColorStop(1,'rgba('+F.col+','+a+')');
  ctx.fillStyle=g;ctx.fillRect(cx-big,cy-big,big*2,big*2);
  ctx.globalCompositeOperation='lighter';
  const glow=(x,y,r,c)=>{const q=ctx.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,c);q.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=q;ctx.fillRect(x-r,y-r,r*2,r*2)};
  if(S.pet)glow(S.pet.x,S.pet.y-10,F.pet,'rgba(255,240,215,0.22)');   // פיוחו זוהרת קצת
  const L=STORY.lanterns.light;if(L&&STO().light)glow(L.x,L.y-80,F.lantern,'rgba(255,255,255,0.3)');
  const M=F.mist,MW=M.spread*2;   // ערפל סגול
  for(let i=0;i<M.n;i++){const bx=hash(i,61)*MW+t*M.drift*(hash(i,62)-0.5)*2,by=hash(i,63)*MW+t*M.drift*0.5;
    const x=P.x-M.spread+(((bx-P.x)%MW)+MW)%MW,y=P.y-M.spread+(((by-P.y)%MW)+MW)%MW;glow(x,y,M.size*(0.6+hash(i,64)*0.6),'rgba(120,70,200,'+M.alpha+')')}
  ctx.restore();
}
// מגדל שבור: גוף אבן עם ראש משונן, סדקים, וחלון שמהבהב בסגול כשברק עובר
function wTower(o){
  const {x,y,r,h}=o,top=y-h;
  ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(x,y+4,r*1.2,r*0.45,0,0,7);ctx.fill();
  ctx.fillStyle='#4C4A5C';ctx.strokeStyle='#17151F';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x-r*0.85,top+h*0.12);ctx.lineTo(x-r*0.5,top);ctx.lineTo(x-r*0.15,top+h*0.16);ctx.lineTo(x+r*0.25,top+h*0.05);ctx.lineTo(x+r*0.55,top+h*0.24);ctx.lineTo(x+r*0.85,top+h*0.18);ctx.lineTo(x+r,y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#2A2836';ctx.lineWidth=2;for(let j=1;j<4;j++){const yy=y-h*j/4.4;ctx.beginPath();ctx.moveTo(x-r*0.9,yy);ctx.lineTo(x+r*0.9,yy);ctx.stroke()}
  ctx.fillStyle=Math.sin(fxNow()*3+x)>0.6?'#C7A6FF':'#1C1A26';ctx.fillRect(x-5,top+h*0.35,10,16);
}
// שלטים מתחת לשערים, וחצים בקצה המסך אל השערים ואל הכפר. מעל הכל, בשני המצבים
function drawWorldScreen(ox,oy){
  if(!S.wd)return;
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 13px Heebo, system-ui, sans-serif';
  const gs=wGates();
  const nk=S.wd.near&&S.wd.open!==S.wd.near?S.wd.near:null;
  for(const k in gs){const g=gs[k],col=wGateCol(k),txt=wGateName(k),x=g.x+ox,y=g.y+oy+40,tw=ctx.measureText(txt).width+16;
    if(k===nk){edgeArrow(g.x+ox,g.y+oy,col);continue}   // השער שלידו: הבועה למטה במקום השלט
    ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(x-tw/2,y-11,tw,22,11);ctx.fill();ctx.fillStyle=col;ctx.fillText(txt,x,y+5);
    edgeArrow(g.x+ox,g.y+oy,col)}
  // בועה במקום השלט של השער שלידו עומדים, כל עוד הכרטיס סגור: אייקון ושם, בזהב, בגודל קבוע על המסך (13px) שלא מתכווץ עם המצלמה.
  // מתחת לשער ולא מעליו, כי למעלה יושבים הפס העליון ושורת הקווסט
  const g=nk&&gs[nk];
  if(g){const txt=wGoIco(nk)[0]+' '+wGateName(nk),b=Math.sin(fxNow()*4)*2;
    ctx.save();ctx.translate(g.x+ox,g.y+oy+40);ctx.scale(1/ZOOM,1/ZOOM);const tw=ctx.measureText(txt).width+20;
    ctx.fillStyle='rgba(18,22,36,0.92)';ctx.strokeStyle=C.gold;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-6,-13+b);ctx.lineTo(0,-20+b);ctx.lineTo(6,-13+b);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.roundRect(-tw/2,-13+b,tw,26,13);ctx.fill();ctx.stroke();
    ctx.fillStyle=C.gold;ctx.fillText(txt,0,5+b);ctx.restore()}
  drawWnpcScreen(ox,oy);   // worldnpc.js
  fishScreen(ox,oy);   // "!" והפס של הדיג (fishing.js)
  storyScreen(ox,oy);   // story.js
  foeLoreScreen(ox,oy);affixScreen(ox,oy);huntScreen(ox,oy);   // שמות ובועות (foelore.js), affix.js, hunt.js
  foeAiScreen(ox,oy);   // "!" מעל קורא שבורח (foeai.js)
  eventsScreen(ox,oy);scentScreen(ox,oy);   // events.js, petscent.js
  secretsScreen(ox,oy);secretsHud();curioScreen(ox,oy);   // secrets.js, השלט "רמה מומלצת" (curiosity.js)
}
