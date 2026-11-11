/* קווסטים: תמיד יש מה לעשות ולמה לשאוף (ניר, game-design.md "החלטות של ניר").
   כל קווסט הוא שורה ב-QUESTS.list, וקווסט חדש = שורה חדשה, בלי קוד. השם ומשפט הדיאלוג ב-lang.js תחת 'q.<id>': [שם, משפט].
   id: שם קבוע. giver: מי נותן, תושב בכפר (NPC.list ב-npc.js). אם יש לו מבנה בית, הוא צריך להיות בנוי כדי לתת. kind: הסוג, ההתנהגות שלו ב-QUESTS.kinds.
   obj: מטרות, מתוך שש:
     kill    להפיל n מ-what: grunt, shield, wisp, wanted, boss, או any (כל אויב)
     collect להביא הביתה n מ-what: משאב (כל משאב ב-RES, resources.js), מהייצור בכפר או מהשלל של ריצה
     reach   להגיע n פעמים ל-what: arena (יציאה לזירה), room (חדר הבונוס), world (יציאה מהכפר לעולם הפתוח)
     gather  לאסוף בעולם הפתוח n מ-what: משאב שנפל ממקור או מאויב בעולם (world.js). נספר כשהוא נכנס לתרמיל
     fish    לדוג n מ-what: דג (fishing.js), או any
     upgrade המבנה what ברמה n לפחות. נבדק לפי הכפר עצמו, אז מה שכבר בנית נספר
     rare    לצוד n מפלצות נדירות שונות (rares.js). נספר מכל מה שכבר צדת, גם לפני שקיבלת
     win     לנצח בוס n פעמים. אפשר בתנאי: noHit (בלי לחטוף פגיעה כל עוד הבוס בזירה), under (לפני שעברו כך וכך שניות בריצה)
     visit   לחקור מקום בעולם: what הוא '<אזור>:<מקום>' מ-SIDEQ.places (questboard.js). נספר כשמגיעים אליו
     hold    להגן על מקום n שניות: עומדים בתוכו, ולהקות מגיעות (questboard.js). מה שעברו נשמר גם כשיוצאים
     meet    למסור הודעה: לדבר עם הדמות what בעולם (worldnpc.js)
     escort  ללוות את מי שנתן את הקווסט אל המקום what ('<אזור>:<מקום>'). היא הולכת, אויבים תוקפים אותה, ואם היא נופלת מתחילים מחדש (escort.js)
   reward: משאבים לתרמיל לפי השם, xp לדמות, rank: עלייה לשלב הזה בדרגה (ranks.js), item: פריט לתרמיל (השם ב-lang.js תחת 'item.<id>'). id של פריט ציוד מ-GEAR.items (gear.js) נכנס לתרמיל כציוד שאפשר ללבוש,
     ואם יש לו משבצת פנויה הוא נלבש מיד (השם שלו 'it.<id>').
   spot: הפרס ניתן במקום ברגע שהמטרה הושגה, בלי לחזור למי שנתן. then: id של קווסט שמתחיל לבד אחרי שהפרס נלקח.
   req: תנאי פתיחה. level: רמת דמות, quest: קווסט שכבר הושלם, b: {מבנה:רמה}.
   המשחק מדווח מה קרה דרך questEvent(סוג, מה, כמה): שורה אחת בכל מקום (kill, hurt, win, collect, gather, upgrade, reach). המנוע מחליט לאיזה קווסט זה שייך.
   ההתקדמות נשמרת רק ב-SAVE.quests (save.js). בזירה היא נשמרת יחד עם השלל, בסוף הריצה */

const QUESTS={
  // auto: פעיל לבד, בלי לקבל. repeat: אפשר לקחת שוב אחרי שהושלם. daily: נבחר מהמאגר כל יום מחדש
  kinds:{
    village:{},
    hunt:{repeat:true},
    daily:{auto:true,daily:true},
    achievement:{auto:true},
    rank:{},     // עלייה בדרגה, כל 20 רמות. הפרס rank:<שלב>, ואיזו דרגה נפתחת קובע ranks.js
    story:{},    // העלילה (story.js, docs/story.md): שרשרת אצל ראש הכפר, ⭐ ביומן
    world:{talk:true}   // דמויות שמוצאים בעולם הפתוח (worldnpc.js). talk: מקבלים ולוקחים פרס רק אצלן, לא ביומן
  },
  daily:4,       // כמה קווסטים יומיים בכל יום. מתחלפים בחצות, לפי השעון בטלפון
  /* שחקן חדש (המבקר, 2.11: "10 משימות פעילות מהדקה הראשונה"): עד שהפנס after דולק (SAVE.story, story.js) רק העלילה,
     הדמויות בעולם (kind world) והקווסטים ב-early. יומיים, הישגים ושאר הכפר נפתחים אחרי השומר הראשון */
  early:{after:'earth',kinds:['story','world','rank'],ids:['boots']},
  list:[
    // ---- כפר: נותנים המבנים, ומובילים את השחקן בכפר ובזירה ----
    // הראשון: קצר, ונעליים בפרס, כדי שההליכה תהיה מהירה כבר מההתחלה (ניר: "נעליים שנותנות מהירות שמקבלים מאיזה קווסט התחלתי")
    // ---- העלילה, פרק 1: פנס האדמה (story.js). כל אחד נפתח אחרי הקודם ----
    // spot: הפרס ניתן במקום, בלי לחזור לכפר. then: הקווסט הבא מתחיל לבד (המבקר, 1.11: "המשימה הראשונה שולחת אותך הביתה ברגע שיצאת")
    {id:'s1Lanterns',giver:'head',kind:'story',obj:[{type:'reach',what:'world',n:1}],reward:{coins:20,xp:20},spot:true,then:'s1Bones'},
    {id:'s1Bones',giver:'head',kind:'story',obj:[{type:'kill',what:'grunt',n:3}],reward:{coins:15,xp:25},req:{quest:'s1Lanterns'},spot:true,then:'s1Shard'},
    {id:'s1Shard',giver:'head',kind:'story',obj:[{type:'story',what:'shard',n:1}],reward:{coins:25,xp:30},req:{quest:'s1Bones'},spot:true,then:'s1Path'},
    {id:'s1Path',giver:'head',kind:'story',obj:[{type:'kill',what:'any',n:25}],reward:{iron:5,xp:40},req:{quest:'s1Shard'},spot:true,then:'s1Warden'},   // עד השומר הכל בעולם (המבקר, 2.11). השומר עצמו חוזר לאבנר: הפנס נדלק בטקס
    {id:'s1Warden',giver:'head',kind:'story',obj:[{type:'kill',what:'warden',n:1}],reward:{coins:80,xp:120,story:'earth'},req:{quest:'s1Path'}},
    // ---- העלילה, פרק 2: פנס המים, באגם הערפל (story.js, WORLD.regions.lake ב-world.js). נפתח אחרי פנס האדמה ----
    {id:'s2Mist',giver:'head',kind:'story',obj:[{type:'story',what:'lake',n:1}],reward:{coins:30,xp:50},req:{quest:'s1Warden'}},
    {id:'s2Glow',giver:'head',kind:'story',obj:[{type:'kill',what:'drowned',n:8},{type:'gather',what:'aquaC',n:3}],reward:{iron:6,xp:80},req:{quest:'s2Mist'}},
    {id:'s2Warden',giver:'head',kind:'story',obj:[{type:'story',what:'tide',n:1}],reward:{coins:120,xp:180,story:'water'},req:{quest:'s2Glow'}},
    // ---- העלילה, פרק 3: פנס הקרח, ברכס הקפוא (story.js, WORLD.regions.ridge ב-world.js). נפתח אחרי פנס המים ----
    {id:'s3Climb',giver:'head',kind:'story',obj:[{type:'story',what:'ridge',n:1}],reward:{coins:40,xp:70},req:{quest:'s2Warden'}},
    {id:'s3Frost',giver:'head',kind:'story',obj:[{type:'kill',what:'rimeknight',n:8},{type:'gather',what:'sapphireC',n:3}],reward:{iron:8,resin:4,xp:110},req:{quest:'s3Climb'}},
    {id:'s3Warden',giver:'head',kind:'story',obj:[{type:'story',what:'frost',n:1}],reward:{coins:160,xp:240,story:'ice'},req:{quest:'s3Frost'}},
    // ---- העלילה, פרק 4: פנס האש, במדבר הבוער (story.js, WORLD.regions.desert ב-world.js). נפתח אחרי פנס הקרח ----
    {id:'s4Sand',giver:'head',kind:'story',obj:[{type:'story',what:'desert',n:1}],reward:{coins:50,xp:90},req:{quest:'s3Warden'}},
    {id:'s4Ember',giver:'head',kind:'story',obj:[{type:'kill',what:'cinderscorp',n:8},{type:'gather',what:'rubyC',n:3}],reward:{iron:10,copper:6,xp:140},req:{quest:'s4Sand'}},
    {id:'s4Warden',giver:'head',kind:'story',obj:[{type:'story',what:'blaze',n:1}],reward:{coins:200,xp:300,story:'fire'},req:{quest:'s4Ember'}},
    // ---- העלילה, פרק 5: פנס הברק, במגדלי הסערה (story.js, WORLD.regions.storm ב-world.js). נפתח אחרי פנס האש ----
    {id:'s5Climb',giver:'head',kind:'story',obj:[{type:'story',what:'storm',n:1}],reward:{coins:60,xp:110},req:{quest:'s4Warden'}},
    {id:'s5Spark',giver:'head',kind:'story',obj:[{type:'kill',what:'stormknight',n:8},{type:'gather',what:'boltC',n:3}],reward:{iron:12,silver:4,xp:170},req:{quest:'s5Climb'}},
    {id:'s5Warden',giver:'head',kind:'story',obj:[{type:'story',what:'thunder',n:1}],reward:{coins:240,xp:360,story:'bolt'},req:{quest:'s5Spark'}},
    // ---- העלילה, פרק 6 והאחרון: הפנס הלבן, בלב הצל (story.js, WORLD.regions.shadow ב-world.js). נפתח כשכל חמשת הפנסים דולקים ----
    {id:'s6Dark',giver:'head',kind:'story',obj:[{type:'story',what:'shadow',n:1}],reward:{coins:70,xp:130},req:{quest:'s5Warden'}},
    {id:'s6Echo',giver:'head',kind:'story',obj:[{type:'kill',what:'shadeknight',n:6},{type:'kill',what:'shadewisp',n:6}],reward:{gem:2,essence:10,xp:200},req:{quest:'s6Dark'}},
    {id:'s6Heart',giver:'head',kind:'story',obj:[{type:'story',what:'heart',n:1}],reward:{coins:400,star:1,xp:500,story:'light'},req:{quest:'s6Echo'}},
    {id:'boots',giver:'head',kind:'village',obj:[{type:'gather',what:'wood',n:5}],reward:{coins:10,item:'starterBoots'}},
    {id:'firstMill',giver:'head',kind:'village',obj:[{type:'upgrade',what:'mill',n:1}],reward:{coins:15,wood:10}},
    {id:'firstMine',giver:'head',kind:'village',obj:[{type:'upgrade',what:'mine',n:1}],reward:{coins:15,stone:10}},
    {id:'grunts',giver:'head',kind:'village',obj:[{type:'kill',what:'grunt',n:15}],reward:{coins:20,xp:20}},
    {id:'firstBoss',giver:'head',kind:'village',obj:[{type:'win',n:1}],reward:{coins:60,iron:8,xp:80},req:{quest:'grunts'}},
    {id:'forge',giver:'head',kind:'village',obj:[{type:'upgrade',what:'forge',n:1}],reward:{stone:15,iron:3},req:{quest:'grunts'}},
    {id:'market',giver:'head',kind:'village',obj:[{type:'upgrade',what:'market',n:1}],reward:{coins:20},req:{quest:'firstMine'}},
    {id:'center2',giver:'head',kind:'village',obj:[{type:'upgrade',what:'center',n:2}],reward:{coins:40,xp:50},req:{quest:'forge'}},
    {id:'millWood',giver:'merchant',kind:'village',obj:[{type:'collect',what:'wood',n:30}],reward:{coins:20},req:{b:{mill:1}}},
    {id:'wisps',giver:'priest',kind:'village',obj:[{type:'kill',what:'wisp',n:15}],reward:{wood:25,xp:20},req:{quest:'millWood'}},
    {id:'mill3',giver:'merchant',kind:'village',obj:[{type:'upgrade',what:'mill',n:3}],reward:{wood:40,coins:30},req:{quest:'center2'}},
    {id:'mineStone',giver:'smith',kind:'village',obj:[{type:'collect',what:'stone',n:20}],reward:{coins:20,wood:10},req:{b:{mine:1}}},
    {id:'mine3',giver:'smith',kind:'village',obj:[{type:'upgrade',what:'mine',n:3},{type:'collect',what:'iron',n:10}],reward:{stone:40,iron:10},req:{quest:'center2'}},
    {id:'bones',giver:'smith',kind:'village',obj:[{type:'collect',what:'bone',n:10}],reward:{iron:5,coins:20}},
    {id:'shields',giver:'smith',kind:'village',obj:[{type:'kill',what:'shield',n:15}],reward:{iron:6,xp:20},req:{quest:'bones'}},
    {id:'wFirst',giver:'head',kind:'village',obj:[{type:'reach',what:'world',n:1},{type:'gather',what:'wood',n:10}],reward:{coins:20,stone:10}},
    {id:'door',giver:'priest',kind:'village',obj:[{type:'reach',what:'room',n:1}],reward:{coins:30}},
    // ---- עולם: נותנות הדמויות שמוצאים באחו (WNPC ב-worldnpc.js) ----
    {id:'wFish',giver:'fisher',kind:'world',obj:[{type:'kill',what:'wisp',n:6}],reward:{coins:30,xp:30}},
    {id:'wCatch',giver:'fisher',kind:'world',obj:[{type:'fish',what:'any',n:3}],reward:{coins:40,xp:40},req:{quest:'wFish'}},   // דיג (fishing.js): מחכה בבריכה שלו
    {id:'wQuarry',giver:'cutter',kind:'world',obj:[{type:'gather',what:'stone',n:12}],reward:{coins:20,iron:4}},
    {id:'wGolems',giver:'cutter',kind:'world',obj:[{type:'kill',what:'golem',n:3}],reward:{iron:8,xp:30},req:{quest:'wQuarry'}},
    {id:'wHerbs',giver:'herbal',kind:'world',obj:[{type:'gather',what:'herb',n:6}],reward:{coins:20,resin:3}},
    {id:'wSprites',giver:'herbal',kind:'world',obj:[{type:'kill',what:'sprite',n:4}],reward:{coins:30,xp:30},req:{quest:'wHerbs'}},
    // ---- קווסטים צדדיים בכל אזור (ת15, ניר 5.11: "grind של התקדמות... להשקיע בהרבה קווסטים"). שתי דמויות בכל אזור (WNPC ב-worldnpc.js),
    //      כל אחת עם שרשרת קצרה וסיפור קטן. המקומות ב-SIDEQ.places (questboard.js). xp ושלל: ערכים סבירים, ת12 מכייל ----
    // האחו: הסיירת תמר והנזיר עזרא
    {id:'sqScout1',giver:'scout',kind:'world',obj:[{type:'visit',what:'meadow:lookout',n:1}],reward:{xp:70,coins:30}},
    {id:'sqScout2',giver:'scout',kind:'world',obj:[{type:'hold',what:'meadow:bank',n:25}],reward:{xp:90,iron:5},req:{quest:'sqScout1'}},
    {id:'sqScout3',giver:'scout',kind:'world',obj:[{type:'meet',what:'hermit',n:1}],reward:{xp:50,coins:20},req:{quest:'sqScout2'},spot:true},
    {id:'sqScout4',giver:'scout',kind:'world',obj:[{type:'kill',what:'treant',n:4},{type:'visit',what:'meadow:spring',n:1}],reward:{xp:110,resin:4,item:'sqHorn'},req:{quest:'sqScout3'}},
    {id:'sqHerm1',giver:'hermit',kind:'world',obj:[{type:'visit',what:'meadow:tower',n:1}],reward:{xp:70,coins:25}},
    {id:'sqHerm2',giver:'hermit',kind:'world',obj:[{type:'visit',what:'meadow:temple',n:1},{type:'visit',what:'meadow:loggers',n:1}],reward:{xp:110,essence:2},req:{quest:'sqHerm1'}},
    {id:'sqHerm3',giver:'hermit',kind:'world',obj:[{type:'collect',what:'resin',n:5},{type:'hold',what:'meadow:lighthouse',n:30}],reward:{xp:140,gem:1,item:'sqLens'},req:{quest:'sqHerm2'}},
    {id:'sqScout5',giver:'scout',kind:'world',obj:[{type:'escort',what:'meadow:bank',n:1}],reward:{xp:130,iron:6,coins:30},req:{quest:'sqScout4'}},
    {id:'sqHerm4',giver:'hermit',kind:'world',obj:[{type:'escort',what:'meadow:temple',n:1}],reward:{xp:150,essence:3,gem:1},req:{quest:'sqHerm3'}},
    // אגם הערפל: נסה המעבורתנית והאח הולו
    {id:'sqFerry1',giver:'ferry',kind:'world',obj:[{type:'visit',what:'lake:boat',n:1},{type:'visit',what:'lake:willow',n:1}],reward:{xp:120,coins:40}},
    {id:'sqFerry2',giver:'ferry',kind:'world',obj:[{type:'kill',what:'drowned',n:10}],reward:{xp:140,aquaC:2},req:{quest:'sqFerry1'}},
    {id:'sqFerry3',giver:'ferry',kind:'world',obj:[{type:'fish',what:'eel',n:1}],reward:{xp:130,coins:60},req:{quest:'sqFerry2'}},
    {id:'sqFerry4',giver:'ferry',kind:'world',obj:[{type:'hold',what:'lake:pier',n:30}],reward:{xp:170,iron:6,item:'sqOar'},req:{quest:'sqFerry3'}},
    {id:'sqMist1',giver:'mistsage',kind:'world',obj:[{type:'gather',what:'aquaC',n:4}],reward:{xp:120,essence:2}},
    {id:'sqMist2',giver:'mistsage',kind:'world',obj:[{type:'kill',what:'mistling',n:12}],reward:{xp:140,coins:45},req:{quest:'sqMist1'}},
    {id:'sqMist3',giver:'mistsage',kind:'world',obj:[{type:'visit',what:'lake:bell',n:1},{type:'visit',what:'lake:drowned',n:1}],reward:{xp:160,gem:1,item:'sqBell'},req:{quest:'sqMist2'}},
    {id:'sqFerry5',giver:'ferry',kind:'world',obj:[{type:'escort',what:'lake:boat',n:1}],reward:{xp:190,coins:70,aquaC:2},req:{quest:'sqFerry4'}},
    {id:'sqMist4',giver:'mistsage',kind:'world',obj:[{type:'escort',what:'lake:bell',n:1}],reward:{xp:200,essence:4,gem:1},req:{quest:'sqMist3'}},
    // הרכס הקפוא: רֵאה המטפסת ופין הזמר
    {id:'sqClimb1',giver:'climber',kind:'world',obj:[{type:'visit',what:'ridge:crevasse',n:1}],reward:{xp:150,coins:50}},
    {id:'sqClimb2',giver:'climber',kind:'world',obj:[{type:'kill',what:'rimeknight',n:10}],reward:{xp:180,iron:8},req:{quest:'sqClimb1'}},
    {id:'sqClimb3',giver:'climber',kind:'world',obj:[{type:'collect',what:'wood',n:20}],reward:{xp:150,resin:5},req:{quest:'sqClimb2'}},
    {id:'sqClimb4',giver:'climber',kind:'world',obj:[{type:'hold',what:'ridge:camp',n:30}],reward:{xp:220,sapphireC:2,item:'sqPick'},req:{quest:'sqClimb3'}},
    {id:'sqBard1',giver:'bard',kind:'world',obj:[{type:'kill',what:'frostwraith',n:12}],reward:{xp:170,sapphireC:2}},
    {id:'sqBard2',giver:'bard',kind:'world',obj:[{type:'visit',what:'ridge:pines',n:1},{type:'visit',what:'ridge:cliff',n:1}],reward:{xp:190,coins:60},req:{quest:'sqBard1'}},
    {id:'sqBard3',giver:'bard',kind:'world',obj:[{type:'gather',what:'sapphireC',n:5},{type:'meet',what:'climber',n:1}],reward:{xp:210,gem:1},req:{quest:'sqBard2'}},
    // המדבר הבוער: זארה מנהלת השיירה ואורי מנפח הזכוכית
    {id:'sqCar1',giver:'caravan',kind:'world',obj:[{type:'visit',what:'desert:bones',n:1},{type:'visit',what:'desert:cacti',n:1}],reward:{xp:200,coins:70}},
    {id:'sqCar2',giver:'caravan',kind:'world',obj:[{type:'kill',what:'cinderscorp',n:10}],reward:{xp:230,copper:8},req:{quest:'sqCar1'}},
    {id:'sqCar3',giver:'caravan',kind:'world',obj:[{type:'collect',what:'herb',n:10}],reward:{xp:200,essence:3},req:{quest:'sqCar2'}},
    {id:'sqCar4',giver:'caravan',kind:'world',obj:[{type:'hold',what:'desert:nest',n:30}],reward:{xp:280,rubyC:2,item:'sqCompass'},req:{quest:'sqCar3'}},
    {id:'sqGlass1',giver:'glass',kind:'world',obj:[{type:'kill',what:'flamewisp',n:12}],reward:{xp:220,rubyC:2}},
    {id:'sqGlass2',giver:'glass',kind:'world',obj:[{type:'visit',what:'desert:lava',n:1}],reward:{xp:200,coins:60},req:{quest:'sqGlass1'}},
    {id:'sqGlass3',giver:'glass',kind:'world',obj:[{type:'gather',what:'rubyC',n:5},{type:'meet',what:'caravan',n:1}],reward:{xp:260,gem:1},req:{quest:'sqGlass2'}},
    // מגדלי הסערה: מרן שומרת המגדלים ופיפ רודף הסערות
    {id:'sqKeep1',giver:'keeper',kind:'world',obj:[{type:'visit',what:'storm:knights',n:1},{type:'visit',what:'storm:spire',n:1},{type:'visit',what:'storm:watch',n:1}],reward:{xp:260,coins:80}},
    {id:'sqKeep2',giver:'keeper',kind:'world',obj:[{type:'kill',what:'stormknight',n:10}],reward:{xp:290,silver:4},req:{quest:'sqKeep1'}},
    {id:'sqKeep3',giver:'keeper',kind:'world',obj:[{type:'hold',what:'storm:spire',n:35}],reward:{xp:340,boltC:2,item:'sqLodestone'},req:{quest:'sqKeep2'}},
    {id:'sqChase1',giver:'chaser',kind:'world',obj:[{type:'kill',what:'sparkwisp',n:12}],reward:{xp:270,boltC:2}},
    {id:'sqChase2',giver:'chaser',kind:'world',obj:[{type:'visit',what:'storm:rods',n:1},{type:'visit',what:'storm:ash',n:1}],reward:{xp:280,coins:80},req:{quest:'sqChase1'}},
    {id:'sqChase3',giver:'chaser',kind:'world',obj:[{type:'gather',what:'boltC',n:5}],reward:{xp:300,gem:1},req:{quest:'sqChase2'}},
    {id:'sqChase4',giver:'chaser',kind:'world',obj:[{type:'collect',what:'dust',n:6},{type:'meet',what:'keeper',n:1}],reward:{xp:280,essence:4},req:{quest:'sqChase3'}},
    // לב הצל: נושא הכלים האבוד ולומי מדליקת הפנסים
    {id:'sqEcho1',giver:'squire',kind:'world',obj:[{type:'visit',what:'shadow:hall',n:1},{type:'visit',what:'shadow:abyss',n:1}],reward:{xp:330,coins:100}},
    {id:'sqEcho2',giver:'squire',kind:'world',obj:[{type:'kill',what:'shadeknight',n:10}],reward:{xp:360,essence:6},req:{quest:'sqEcho1'}},
    {id:'sqEcho3',giver:'squire',kind:'world',obj:[{type:'hold',what:'shadow:hall',n:40}],reward:{xp:420,gem:2,item:'sqBanner'},req:{quest:'sqEcho2'}},
    {id:'sqLamp1',giver:'lamp',kind:'world',obj:[{type:'kill',what:'shadewisp',n:12}],reward:{xp:340,dust:4}},
    {id:'sqLamp2',giver:'lamp',kind:'world',obj:[{type:'gather',what:'dust',n:6}],reward:{xp:360,gem:1},req:{quest:'sqLamp1'}},
    {id:'sqLamp3',giver:'lamp',kind:'world',obj:[{type:'visit',what:'shadow:groveW',n:1},{type:'visit',what:'shadow:groveE',n:1},{type:'visit',what:'shadow:void',n:1}],reward:{xp:380,coins:100},req:{quest:'sqLamp2'}},
    {id:'sqLamp4',giver:'lamp',kind:'world',obj:[{type:'meet',what:'squire',n:1}],reward:{xp:250,essence:5,item:'sqLantern'},req:{quest:'sqLamp3'},spot:true},
    // ---- דרגה: הכוהנת, כל RANKS.every רמות. 30 עצמות ו-3 מפלצות נדירות שונות (ניר, 5.11.2026: "לצוד מפלצות נדירות שקשה למצוא", במקום ניצחון בזירה) ----
    {id:'rank1',giver:'priest',kind:'rank',obj:[{type:'collect',what:'bone',n:30},{type:'rare',n:3}],reward:{rank:1,coins:50},req:{level:20}},
    // ---- ציד: אפשר לקחת שוב ושוב ----
    {id:'huntWanted',giver:'merchant',kind:'hunt',obj:[{type:'kill',what:'wanted',n:1}],reward:{coins:40}},
    {id:'huntFast',giver:'smith',kind:'hunt',obj:[{type:'win',n:1,under:240}],reward:{iron:10,xp:40},req:{quest:'firstBoss'}},
    // ---- יומיים: 4 מהמאגר הזה בכל יום ----
    {id:'dGrunts',giver:'inn',kind:'daily',obj:[{type:'kill',what:'grunt',n:40}],reward:{coins:20}},
    {id:'dShields',giver:'inn',kind:'daily',obj:[{type:'kill',what:'shield',n:12}],reward:{coins:15,iron:2}},
    {id:'dWisps',giver:'inn',kind:'daily',obj:[{type:'kill',what:'wisp',n:12}],reward:{coins:15,bone:3}},
    {id:'dAny',giver:'inn',kind:'daily',obj:[{type:'kill',what:'any',n:100}],reward:{coins:30}},
    {id:'dWanted',giver:'inn',kind:'daily',obj:[{type:'kill',what:'wanted',n:1}],reward:{coins:25}},
    {id:'dBoss',giver:'inn',kind:'daily',obj:[{type:'win',n:1}],reward:{coins:30,iron:3}},
    {id:'dRuns',giver:'inn',kind:'daily',obj:[{type:'reach',what:'arena',n:2}],reward:{coins:15}},
    {id:'dRoom',giver:'inn',kind:'daily',obj:[{type:'reach',what:'room',n:1}],reward:{coins:20}},
    {id:'dWood',giver:'inn',kind:'daily',obj:[{type:'collect',what:'wood',n:20}],reward:{coins:15}},
    {id:'dStone',giver:'inn',kind:'daily',obj:[{type:'collect',what:'stone',n:15}],reward:{coins:15}},
    {id:'dBones',giver:'inn',kind:'daily',obj:[{type:'collect',what:'bone',n:5}],reward:{coins:15,wood:10}},
    {id:'dCoins',giver:'inn',kind:'daily',obj:[{type:'collect',what:'coins',n:30}],reward:{stone:15,wood:15}},
    // ---- הישגים: פעילים תמיד, פעם אחת ----
    {id:'aHunter',giver:null,kind:'achievement',obj:[{type:'kill',what:'any',n:500}],reward:{coins:100,item:'qTrophy'}},
    {id:'aClean',giver:null,kind:'achievement',obj:[{type:'win',n:1,noHit:true}],reward:{iron:20,item:'qSock'}},
    {id:'aSpeed',giver:null,kind:'achievement',obj:[{type:'win',n:1,under:150}],reward:{coins:80,xp:60}},
    {id:'aBuilder',giver:null,kind:'achievement',obj:[{type:'upgrade',what:'center',n:3}],reward:{coins:100,stone:50}},
    {id:'aWanted',giver:null,kind:'achievement',obj:[{type:'kill',what:'wanted',n:5}],reward:{coins:60,item:'qCrown'}}
  ],
  icon:{xp:'✨',item:'🎁',track:'📜',rank:'🎖️'}    // אייקונים לפרס (מעבר למשאבים ב-RES) ולקו המעקב
};

const QBY={};for(const q of QUESTS.list)QBY[q.id]=q;
const QS=()=>SAVE.quests;
const qKind=q=>QUESTS.kinds[q.kind]||{};
const qDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const qRun=()=>S.q||(S.q={bossHit:0});   // מה שקרה בריצה הזו, לתנאי ניצחון. S חדש בכל ריצה

/* ---- מצב ---- */
function qProg(q,i){
  const o=q.obj[i];if(o.type==='upgrade')return Math.min(o.n,vLv(o.what));
  if(o.type==='rare')return Math.min(o.n,rareKinds());   // נדירות שונות שצדת (rares.js)
  const a=QS().active[q.id],p=a?a.p[i]||0:0;
  if(a&&qHand(q,o))return Math.min(o.n,Math.max(p,Math.floor(SAVE.bag[o.what]||0)));   // "תביא לי": מה שכבר בתרמיל נחשב
  return Math.min(o.n,p);
}
// קווסט "תביא לי" (collect שלא יומי ולא מטבעות): נספר ממה שבתרמיל, ובקבלת הפרס הכמות נמסרת לנותן.
// באג (ניר, 1.11): "הנפח רוצה 10 עצמות ויש עליי מאות" — קודם נספר רק מה שנאסף אחרי שקיבלת את הקווסט, ובעולם לא בכלל
const qHand=(q,o)=>o.type==='collect'&&o.what&&o.what!=='coins'&&o.what!=='any'&&!qKind(q).daily;
const qReady=q=>!!QS().active[q.id]&&q.obj.every((o,i)=>qProg(q,i)>=o.n);
const qEarly=()=>!(SAVE.story&&SAVE.story[QUESTS.early.after]);
function qReq(q){
  const r=q.req||{},E=QUESTS.early;
  if(qEarly()&&!E.kinds.includes(q.kind)&&!E.ids.includes(q.id))return false;
  if(q.giver&&!npcHere(q.giver))return false;
  if(r.level&&SAVE.hero.level<r.level)return false;
  if(r.quest&&!QS().done[r.quest])return false;
  if(r.b)for(const k in r.b)if(vLv(k)<r.b[k])return false;
  return true;
}
// אפשר לקבל עכשיו מהיומן
const qOpen=q=>{const K=qKind(q);return !K.auto&&!QS().active[q.id]&&(K.repeat||!QS().done[q.id])&&qReq(q)&&(!K.board||innOpen(q))&&(!K.can||K.can(q))};   // board: הלוח בפונדק (inn.js). can: תנאי של הסוג עצמו (לוח המודעות בעולם, questboard.js)
function qStart(q){QS().active[q.id]={p:q.obj.map(()=>0)};if(!qKind(q).auto)QS().track=q.id}

// בכל כניסה לכפר: יום חדש מביא קווסטים יומיים חדשים, והישגים שנפתחו מתחילים לבד
function questsRefresh(){
  const Q=QS();
  for(const id in Q.active)if(!QBY[id])delete Q.active[id];   // קווסט שהוסר מהטבלה
  if(typeof qbApply==='function')qbApply();   // משימות מלוח המודעות: היעד והפרס שנקבעו כשנלקחו (questboard.js)
  const day=qDay();
  if(Q.day!==day||!Q.daily.length){   // אין יומיים היום (שחקן חדש לפני השומר): בודקים שוב בכל כניסה
    for(const id of Q.daily)if(!(Q.active[id]&&qReady(QBY[id])))delete Q.active[id];   // יומי של אתמול שנגמר ומחכה לפרס נשאר עד שלוקחים (ביקורת 6.11, פריט 3)
    const pool=QUESTS.list.filter(q=>qKind(q).daily&&qReq(q)&&!Q.active[q.id]).sort(()=>Math.random()-0.5);   // לא בוחרים שוב יומי שעוד מחכה לפרס
    Q.daily=pool.slice(0,QUESTS.daily).map(q=>q.id);Q.day=day;
    for(const id of Q.daily)qStart(QBY[id]);
  }
  for(const q of QUESTS.list){const K=qKind(q);if(K.auto&&!K.daily&&!Q.active[q.id]&&!Q.done[q.id]&&qReq(q))qStart(q)}
  if(Q.track&&!Q.active[Q.track])Q.track=null;
  questTrack();
  $('qLog').hidden=true;   // חוזרים הביתה עם יומן סגור, ולא עם מה שהיה פתוח לפני הריצה
}

/* ---- מה שקרה במשחק ---- */
function questEvent(type,what,n=1){
  if(type==='hurt'){if(S.boss)qRun().bossHit++;return}
  const Q=QS(),spot=[];let moved=false;
  for(const id in Q.active){
    const q=QBY[id],a=Q.active[id];if(!q)continue;
    q.obj.forEach((o,i)=>{
      if((o.type!==type&&!(o.type==='collect'&&type==='gather'))||type==='upgrade'||a.p[i]>=o.n)return;   // מה שנאסף בעולם נספר גם ל"להביא"
      if(o.what&&o.what!=='any'&&o.what!==what)return;
      if(type==='win'&&(o.noHit&&qRun().bossHit||o.under&&S.t>o.under))return;
      a.p[i]=Math.min(o.n,o.max?Math.max(a.p[i]||0,n):(a.p[i]||0)+n);moved=true;   // max: השיא נספר, לא הסכום (קומה בעומק הצל, inn.js)
    });
    if(!a.r&&qReady(q)){a.r=true;moved=true;if(q.spot)spot.push(id);else banner(T('q.ready',T('q.'+id)[0]),C.gold)}
  }
  for(const id of spot)questSpot(id);
  if(moved||type==='reach')questTrack();   // reach: גם בתחילת ריצה, כדי שקו המעקב יופיע מיד
}
// spot: הפרס במקום (חגיגה קטנה והודעה), והקווסט הבא (then) מתחיל לבד ונכנס לקו המעקב
function questSpot(id){
  const q=QBY[id];if(!questClaim(id))return;
  const n=q.then&&QBY[q.then],Q=QS();
  if(n&&!Q.active[n.id]&&!Q.done[n.id]){qStart(n);saveNow();banner(T('q.next',T('q.'+n.id)[0]),C.gold)}
}
// פרס פריט: לתרמיל. פריט ציוד עם משבצת פנויה נלבש מיד, והסטטים שלו חלים כבר עכשיו (נעליים: הולכים מהר יותר)
function qGive(id){
  bagAdd(id,1);const it=gItem(id);
  if(it&&!gGet(it.slot,gTarget(it))){const before=gearStats();gearEquip(id);gearLive(before,id)}
}
function questClaim(id,quiet){   // quiet: בלי חגיגה והודעה משלו (האיסוף ב-welcome.js חוגג פעם אחת)
  const q=QBY[id],Q=QS();if(!q||!qReady(q))return false;
  q.obj.forEach(o=>{if(qHand(q,o))SAVE.bag[o.what]=Math.max(0,(SAVE.bag[o.what]||0)-o.n)});   // מוסרים לנותן את מה שביקש
  for(const k in q.reward){const v=q.reward[k];if(k==='xp')SAVE.hero.xp+=v;else if(k==='item')qGive(v);else if(k==='story')storyReward(v);else if(k!=='rank')bagAdd(k,v)}
  rankSync();   // רמת הדמות מה-XP (ranks.js)
  delete Q.active[id];Q.done[id]=(Q.done[id]||0)+1;
  if(qKind(q).onClaim)qKind(q).onClaim(q);   // הסוג רוצה לדעת (לוח המודעות בעולם, questboard.js)
  if(Q.track===id)Q.track=null;
  saveNow();questTrack();
  if(!quiet){celebrate(P.x,P.y-10,'quest');banner(T('q.claimed',T('q.'+id)[0]),C.gold)}
  if(q.reward.rank)rankUp(q.reward.rank);   // הטקס והדרגה (ranks.js)
  return true;
}

/* ---- ממשק: היומן בכפר, וקו מעקב בזירה ---- */
const qWhat=o=>o.type==='visit'||o.type==='hold'||o.type==='escort'?sqPlaceName(o.what):o.type==='meet'?T('npc.'+o.what)[0]:o.type==='fish'?(o.what&&o.what!=='any'?resName(o.what):''):o.type==='story'?o.what:o.type==='weak'?T('dt.'+o.what):o.type==='kill'?T('foe.'+o.what):o.type==='collect'||o.type==='gather'?resName(o.what):o.type==='reach'?T('place.'+o.what):o.type==='upgrade'?T('vil.'+o.what):'';
const qObjTxt=(q,i)=>{const o=q.obj[i];return T('qo.'+o.type,qWhat(o),o.n)+(o.noHit?T('qo.noHit'):'')+(o.under?T('qo.under',fmt(o.under)):'')};
const qRewardLine=r=>Object.keys(r).map(k=>'<span class="res">'+(k==='story'?'🏮 '+T('story.'+r[k]+'.reward'):k==='rank'?QUESTS.icon.rank+' '+(rankFor(r[k])?rankName(rankFor(r[k])):''):k==='item'?(gItem(r[k])?gIcon(r[k])+' '+gName(r[k]):QUESTS.icon.item+' '+T('item.'+r[k])):(resIcon(k)||QUESTS.icon[k])+' '+r[k])+'</span>').join('');
// הקווסט שמוצג בזירה: זה שבחרת לעקוב אחריו, ואם אין, הראשון שעוד לא הושלם
function qTracked(){
  const Q=QS(),ids=Object.keys(Q.active).filter(id=>QBY[id]);
  if(Q.track&&Q.active[Q.track]&&!qReady(QBY[Q.track]))return QBY[Q.track];   // קווסט שהושלם יוצא מהשורה: הפרס מחכה ביומן (ניר: "מראה לי קווסט שסיימתי")
  const open=ids.map(id=>QBY[id]).filter(q=>!qReady(q));
  return open.find(q=>!qKind(q).auto)||open.find(q=>qKind(q).daily)||null;
}
// בזירה: רק קווסט שאפשר להתקדם בו בריצה (הריגות, להגיע לזירה). עלילה ומקומות בעולם לא מוצגים שם (המבקר, 2.11.2026: "Climb to the Frost Ridge" בזירה)
const qArenaOk=q=>q.kind!=='story'&&q.kind!=='world'&&q.obj.some(o=>o.type==='kill'&&!/warden/.test(o.what)||o.type==='reach'&&o.what==='arena');
const qInArena=()=>!!S&&!S.vil&&!S.wd&&!S.mb&&S.mode==='play';
function questTrack(){
  const el=$('qTrack');let q=qTracked();
  if(q&&qInArena()&&!qArenaOk(q))q=Object.keys(QS().active).map(id=>QBY[id]).find(x=>x&&!qReady(x)&&qArenaOk(x))||null;
  if(!q){el.hidden=true;return}
  el.hidden=false;
  el.textContent=QUESTS.icon.track+' '+T('q.'+q.id)[0]+' · '+q.obj.map((o,i)=>qObjTxt(q,i)+' '+qProg(q,i)+'/'+o.n).join(' · ');
}

function qCard(q,act){
  const [name,say]=T('q.'+q.id),Q=QS(),on=!!Q.active[q.id];
  let h='<div class="qc'+(act==='claim'?' ready':'')+'"><b>'+name+'</b><small>'+(q.giver?T('npc.'+q.giver)[0]+' · ':'')+T('q.kind.'+q.kind)+'</small>';
  if(say)h+='<p class="say">'+say+'</p>';
  h+='<ul>'+q.obj.map((o,i)=>'<li>'+qObjTxt(q,i)+' <em>'+(on||o.type==='upgrade'?qProg(q,i):0)+'/'+o.n+'</em></li>').join('')+'</ul>';
  if(q.obj.some(o=>o.type==='rare')&&typeof rareListHtml==='function')h+=rareListHtml();   // אילו נדירות יש ואיפה (rares.js)
  h+='<div class="qrow"><div class="cost">'+qRewardLine(q.reward)+'</div>';
  if(act==='claim')h+='<button class="vbtn" data-q="'+q.id+'" data-act="claim">'+T('q.claim')+'</button>';
  else if(act==='accept')h+='<button class="vbtn" data-q="'+q.id+'" data-act="accept">'+T('q.accept')+'</button>';
  else if(act==='track')h+='<button class="qtrk" data-q="'+q.id+'" data-act="track"'+(Q.track===q.id?' aria-pressed="true"':'')+'>'+T(Q.track===q.id?'q.tracking':'q.track')+'</button>';
  else if(act==='done')h+='<p class="next">'+T('q.doneToday')+'</p>';
  return h+'</div></div>';
}
function questLog(){
  const Q=QS(),act=Object.keys(Q.active).map(id=>QBY[id]).filter(Boolean),L=QUESTS.list;
  // כל סוג מכווץ, חוץ מפרסים שמחכים: בראש היומן "עכשיו" אחד (guideCard ב-guide.js), ולא רשימה ארוכה (docs/ux-audit.md)
  const sec=(k,cards)=>cards.length?'<details class="qsec"'+(k==='ready'?' open':'')+'><summary><h4>'+T('q.sec.'+k)+' · '+cards.length+'</h4></summary>'+cards.join('')+'</details>':'';
  let h=winHead(T('q.log'));   // ui.js
  // שני טורים לרוחב (.qcol, המבקר 2.11.2026): הסיפור והמשימה הנוכחית, ולידם היומיים וההישגים. בטלפון עומד אחד מתחת לשני
  const ready=act.filter(q=>qReady(q)&&!qKind(q).talk),G=typeof guideGoal==='function'&&(S.vil||S.wd)?guideGoal():null;
  h+='<div class="qcol">'+(G&&ready.some(q=>q.id===G.q)?'':guideCard());   // "Now" הוא בדיוק הכרטיס שמחכה לאיסוף: לא כותבים פעמיים (קונספט #672)
  h+=sec('ready',ready.map(q=>qCard(q,'claim')));
  h+=sec('active',act.filter(q=>(!qReady(q)||qKind(q).talk)&&!qKind(q).auto).map(q=>qCard(q,'track')));   // talk: הפרס אצל מי שנתן
  h+=sec('new',L.filter(q=>qOpen(q)&&!qKind(q).talk).map(q=>qCard(q,'accept')));
  h+='</div><div class="qcol">'+challengeCard()+huntCard();   // החוק והמשימה של היום (mutation.js), מבוקש היום (hunt.js)
  h+=sec('daily',Q.daily.map(id=>QBY[id]).filter(q=>q&&!(Q.active[q.id]&&qReady(q))).map(q=>qCard(q,Q.active[q.id]?'track':'done')));
  h+=sec('ach',act.filter(q=>!qReady(q)&&qKind(q).achievement).map(q=>qCard(q,'')))+'</div>';
  $('qLog').innerHTML=h;
}
function questLogOpen(on){$('qLog').hidden=!on;if(on){npcTalk(null);questLog()}}
// הכפתור: לשונית בתפריט הראשי (menu.js)
// כפתור בכרטיס קווסט: ביומן וגם בשיחה עם תושב (npc.js)
function questAct(a,id){
  if(a==='accept'&&qOpen(QBY[id])){qStart(QBY[id]);saveNow()}
  else if(a==='claim')questClaim(id);
  else if(a==='track'){QS().track=QS().track===id?null:id;saveNow()}
  questTrack();
}
$('qLog').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.act==='close'){questLogOpen(false);return}
  questAct(b.dataset.act,b.dataset.q);
  questLog();
});

// בכפר: סימן מעל התושב שיש לו קווסט חדש (!) או פרס שמחכה (✓), ומספר על כפתור היומן
function drawQuestMarks(ox,oy){
  if(!S.vil)return;
  const Q=QS(),mark={};let n=0;
  for(const q of QUESTS.list){
    const ready=Q.active[q.id]&&qReady(q);if(ready&&!qKind(q).talk)n++;
    if(!q.giver||!npcHere(q.giver))continue;
    if(ready)mark[q.giver]='✓';else if(qOpen(q)&&(q.kind==='rank'||!mark[q.giver]))mark[q.giver]=q.kind==='rank'?'!!':'!';   // דרגה: סימן גדול וסגול, שלא מתפספס (ניר, 5.11)
  }
  if(typeof fxwMarks==='function')fxwMarks(mark,'v');   // הסימנים בשביל ה-emote בשיחה (fxworld.js)
  ctx.textAlign='center';ctx.direction='ltr';ctx.font='800 22px Heebo, system-ui, sans-serif';
  const bob=Math.sin(fxNow()*4)*4;
  if(typeof fxvNpcIcons==='function')fxvNpcIcons(mark,'v',(id,n)=>({x:n.x+ox,y:n.y-NPC.markUp+oy-7}));   // חנות או שיחה למי שאין סימן קווסט (fxvil.js)
  for(const k in mark){const N=npcAt(k);if(!N)continue;const x=N.x+ox,y=N.y-NPC.markUp+oy+bob,rk=mark[k]==='!!',m=rk?'!':mark[k];
    if(rk)edgeArrow(N.x+ox,N.y+oy,C.lilac,1.5,true);   // ומחוץ למסך: חץ אליה (render.js)
    if(rk){ctx.fillStyle='rgba(199,166,255,'+(0.25+Math.sin(fxNow()*5)*0.12)+')';ctx.beginPath();ctx.arc(x,y-7,26,0,7);ctx.fill()}
    if(typeof fxvMark==='function'&&fxvMark(mark[k],x,y-7-bob))continue;   // הסימן מספריית האפקטים (fxvil.js), ובלי התמונה: העיגול הישן
    ctx.fillStyle='rgba(18,22,36,0.85)';ctx.beginPath();ctx.arc(x,y-7,rk?19:15,0,7);ctx.fill();ctx.fillStyle=rk?C.lilac:C.gold;if(rk)ctx.font='800 28px Heebo, system-ui, sans-serif';ctx.fillText(m,x,y+(rk?3:1));if(rk)ctx.font='800 22px Heebo, system-ui, sans-serif'}
  ctx.direction=DIR;
  const t=n?String(n):'';if($('qBadge').textContent!==t){$('qBadge').textContent=t;$('qBadge').hidden=!n}
}
