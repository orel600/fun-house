/* מקורות משאבים בזירה: עצים, סלעים, שיחים, עורקי מתכת ותיבות. ההתקפה האוטומטית פוגעת בהם כמו באויב כשעומדים לידם (ניר, 30.10.2026),
   וכשהם נשברים הם מפילים משאבים לשלל של הריצה (runGive ב-village.js), כמו אויב.
   הם לא זזים ולא תוקפים, ואי אפשר לעבור דרכם. הם יושבים ב-S.nd.list, לא ב-enemies, כדי שאויבים, הבוס והבוט לא יתבלבלו בהם.
   כל המספרים באובייקט NODES. איפה מופיע מה: arenas, לפי הזירה. ככל שהריצה מתקדמת (from: שניות) מופיעות מתכות טובות יותר.
   guard: יצור המשאב ששומר על המקור (ניר: "מפלצות עשויות ממשאב, שמפילות אותו"). סלע מביא גולם, עץ עץ-חי, וכו'. היצורים ב-ETYPES (data.js) */

const NODES={
  reach:70,                       // מאיזה מרחק מהקצה של מקור ההתקפה האוטומטית פוגעת בו
  // hp: כמה מכות הוא סופג. r: גודל וגבול הפגיעה, גדולים כדי שיראו אותם בטלפון. drop: {משאב:[סיכוי, כמה]}. col: הצבע בציור. shape: עץ, סלע, שיח, עורק או תיבה.
  // tags: ממה הוא עשוי, כמו אויב (DMG.chart ב-dmg.js): סלע חלש למים, עץ לאש. guard: {type: היצור, chance: סיכוי, n: כמה} שמופיעים ליד המקור
  kinds:{
    tree:   {tags:['plant'],hp:40, r:28,shape:'tree',col:'#3E7A4A',drop:{wood:[1,4],resin:[0.3,1],herb:[0.15,1]},guard:{type:'treant',chance:0.25,n:1}},
    rock:   {tags:['stone'],hp:55, r:24,shape:'rock',col:'#7A8094',drop:{stone:[1,3],mushroom:[0.1,1],amberC:[0.03,1]},guard:{type:'golem',chance:0.3,n:1}},
    bush:   {tags:['plant'],hp:25, r:21,shape:'bush',col:'#5FA35A',drop:{herb:[1,2],mushroom:[0.35,1],flower:[0.25,1]},guard:{type:'sprite',chance:0.35,n:2}},
    copper: {tags:['metal'],hp:70, r:24,shape:'vein',col:'#C87533',drop:{copper:[1,2],stone:[0.5,1],rubyC:[0.04,1]},guard:{type:'crawler',chance:0.3,n:1}},
    iron:   {tags:['metal'],hp:100,r:24,shape:'vein',col:'#9AA3AD',drop:{iron:[1,2],boltC:[0.04,1]},guard:{type:'crawler',chance:0.3,n:1}},
    silver: {tags:['metal'],hp:140,r:25,shape:'vein',col:'#DCE3EA',drop:{silver:[1,2],sapphireC:[0.05,1]},guard:{type:'crawler',chance:0.35,n:2}},
    gold:   {tags:['metal'],hp:190,r:25,shape:'vein',col:'#F4C74F',drop:{gold:[1,1],aquaC:[0.06,1]},guard:{type:'crawler',chance:0.4,n:2}},
    mythril:{tags:['metal'],hp:260,r:26,shape:'vein',col:'#6FE3FF',drop:{mythril:[1,1],star:[0.1,1]},guard:{type:'crawler',chance:0.5,n:2}},
    // אגם הערפל (WORLD.regions.lake ב-world.js): קני סוף ואבני גאות. רק בעולם, לא בזירה
    reeds:  {tags:['plant'],hp:30, r:21,shape:'reed',col:'#3FA7A0',drop:{herb:[1,2],flower:[0.3,1],aquaC:[0.1,1]},guard:{type:'mistling',chance:0.35,n:2}},
    tideRock:{tags:['stone'],hp:80,r:24,shape:'crystal',col:'#4FB4FF',drop:{stone:[1,2],aquaC:[0.45,1],sapphireC:[0.12,1]},guard:{type:'drowned',chance:0.3,n:1}},
    // תיבות: עץ, ברזל וזהב. תיבת זהב נדירה, ובה אבנים מושלמות. המומיות שומרות עליהן
    chestWood:{tags:['plant'],hp:30,r:21,shape:'chest',col:'#9A6B3C',drop:{coins:[1,8],cloth:[0.5,2],herb:[0.4,2],rubyC:[0.15,1],sapphireC:[0.15,1],boltC:[0.15,1],aquaC:[0.15,1],amberC:[0.15,1]},guard:{type:'mummy',chance:0.4,n:1}},
    chestIron:{tags:['metal'],hp:60,r:22,shape:'chest',col:'#9AA3AD',drop:{coins:[1,20],gem:[0.1,1],iron:[0.6,2],silver:[0.25,1],ruby:[0.15,1],sapphire:[0.15,1],bolt:[0.15,1],aqua:[0.15,1],amber:[0.15,1]},guard:{type:'mummy',chance:0.5,n:2}},
    chestGold:{tags:['metal'],hp:90,r:24,shape:'chest',col:'#F4C74F',drop:{coins:[1,50],gold:[0.6,2],mythril:[0.3,1],star:[0.15,1],rubyF:[0.12,1],sapphireF:[0.12,1],boltF:[0.12,1],aquaF:[0.12,1],amberF:[0.12,1]},guard:{type:'mummy',chance:0.6,n:3}}
  },
  // לכל זירה: first מתי מופיע הראשון, every כל כמה שניות עוד אחד, max כמה בבת אחת, dist כמה רחוק מהשחקן, far מאיפה נעלם.
  // spawn: מה יכול להופיע. w כמה נפוץ, from מאיזו שנייה בריצה
  arenas:{
    main:{first:3,every:[6,10],max:5,dist:[170,330],far:1100,
      spawn:[{kind:'tree',w:5,from:0},{kind:'rock',w:4,from:0},{kind:'bush',w:3,from:0},{kind:'copper',w:3,from:0},{kind:'iron',w:2.5,from:45},
             {kind:'silver',w:1.5,from:90},{kind:'gold',w:1,from:150},{kind:'mythril',w:0.5,from:220},
             {kind:'chestWood',w:1,from:10},{kind:'chestIron',w:0.6,from:60},{kind:'chestGold',w:0.12,from:120}]}
  }
};

const ndArena=()=>NODES.arenas[S.arena]||NODES.arenas.main;
function nodesReset(){S.nd={t:ndArena().first,list:[],broken:0,got:[]}}

function nodeSpawn(){
  const A=ndArena(),pool=A.spawn.filter(s=>S.t>=s.from);if(!pool.length)return;
  let r=Math.random()*pool.reduce((n,s)=>n+s.w,0),kind=pool[0].kind;
  for(const s of pool){r-=s.w;if(r<0){kind=s.kind;break}}
  const K=NODES.kinds[kind],a=rand(0,6.28),d=rand(...A.dist);
  const x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;
  S.nd.list.push({node:true,kind,x,y,r:K.r,hp:K.hp,max:K.hp,mult:multOf(K.tags),flash:0,ph:rand(0,6)});
  // היצור ששומר על המקור, עשוי מאותו חומר
  const g=K.guard;if(g&&Math.random()<g.chance)for(let i=0;i<g.n;i++){const b=rand(0,6.28);addEnemy(g.type,x+Math.cos(b)*(K.r+30),y+Math.sin(b)*(K.r+30))}
}

// כל פריים בזירה: מופיעים, נעלמים כשמתרחקים מהם, ולא נותנים לעבור דרכם
function nodesUpdate(dt){
  const A=ndArena(),nd=S.nd;
  nd.t-=dt;if(nd.t<=0){nd.t=rand(...A.every);if(nd.list.length<A.max)nodeSpawn()}
  for(const n of nd.list){
    n.flash-=dt;
    const dx=P.x-n.x,dy=P.y-n.y,d=Math.hypot(dx,dy)||1,min=n.r+P.r;
    if(d<min){P.x=n.x+dx/d*min;P.y=n.y+dy/d*min}
    if(d>A.far)n.dead=true;
  }
  nd.list=nd.list.filter(n=>!n.dead);
}
// המקור הכי קרוב שההתקפה מגיעה אליו, או null. נקרא מ-attack ב-combat.js
function nodeNear(){
  let b=null,bd=NODES.reach;
  for(const n of S.nd.list){if(n.dead)continue;const d=Math.hypot(n.x-P.x,n.y-P.y)-n.r;if(d<bd){bd=d;b=n}}
  return b;
}
// נקרא מ-damage כשהחיים של מקור נגמרים
function nodeDown(n){
  n.dead=true;S.nd.broken++;if(n.regrow)n.back=n.regrow;   // בעולם הפתוח הוא צומח מחדש (world.js)
  if(NODES.kinds[n.kind].shape==='chest')S.nd.chests=(S.nd.chests||0)+1;sfx('coin');
  const got=runGive(NODES.kinds[n.kind].drop,n.x,n.y);S.nd.got.push(...got);
  sparks(n.x,n.y,NODES.kinds[n.kind].col,14,200);
}

/* ---- ציור: צורות פשוטות בקנבס, בשני המצבים (מעל שכבת התלת-ממד). סדק כשנפגע ופס חיים ---- */
function drawNodes(){
  if(!S.nd||S.room||S.wd)return;   // בעולם הפתוח המקורות מצוירים ב-drawWorld (world.js)
  for(const n of S.nd.list){
    const K=NODES.kinds[n.kind],fl=n.flash>0,r=n.r,x=n.x,y=n.y;
    ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+r*0.7,r*1.1,r*0.4,0,0,7);ctx.fill();
    ctx.fillStyle=fl?'#fff':K.col;ctx.strokeStyle=C.ink;ctx.lineWidth=2;
    if(K.shape==='chest'){
      ctx.fillStyle=fl?'#fff':K.col;ctx.fillRect(x-r,y-r*0.7,r*2,r*1.3);ctx.strokeRect(x-r,y-r*0.7,r*2,r*1.3);
      ctx.fillStyle=C.ink;ctx.fillRect(x-r,y-r*0.25,r*2,3);ctx.fillStyle=C.gold;ctx.fillRect(x-3,y-r*0.35,6,7);
    }else if(K.shape==='bush'){
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+(i-1)*r*0.6,y-r*0.3-(i===1?r*0.3:0),r*0.65,0,7);ctx.fill();ctx.stroke()}
      ctx.fillStyle='#FF9FD0';ctx.beginPath();ctx.arc(x+r*0.3,y-r*0.7,3,0,7);ctx.fill();
    }else if(K.shape==='tree'){
      ctx.fillStyle=fl?'#fff':'#6B4A2B';ctx.fillRect(x-4,y-4,8,r*0.9);
      ctx.fillStyle=fl?'#fff':K.col;ctx.beginPath();ctx.arc(x,y-r*0.6,r,0,7);ctx.fill();ctx.stroke();
    }else{
      ctx.beginPath();ctx.moveTo(x-r,y+r*0.5);ctx.lineTo(x-r*0.7,y-r*0.5);ctx.lineTo(x,y-r);ctx.lineTo(x+r*0.8,y-r*0.4);ctx.lineTo(x+r,y+r*0.5);ctx.closePath();
      ctx.fillStyle=fl?'#fff':K.shape==='vein'?'#5A6075':K.col;ctx.fill();ctx.stroke();
      if(K.shape==='vein'){ctx.fillStyle=K.col;for(let i=0;i<3;i++){const a=n.ph+i*2.1;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*0.45,y-r*0.1+Math.sin(a)*r*0.3,3.5,0,7);ctx.fill()}}
    }
    if(n.hp<n.max){const w=r*2;ctx.fillStyle='rgba(5,7,13,0.6)';ctx.fillRect(x-w/2,y-r*1.9,w,4);ctx.fillStyle=C.gold;ctx.fillRect(x-w/2,y-r*1.9,w*Math.max(0,n.hp/n.max),4)}
  }
}
