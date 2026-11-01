/* קצב העולם הפתוח (ניר, 1.11.2026: "העולם ריק ואיטי", ובחר "יותר מפלצות ואקשן"). Claude מוביל.
   מעבר לקבוצות הקבועות (WORLD.foes), כל כמה שניות מגיעה להקה של 3 עד 8 מפלצות מקצה המסך, מהכיוון שאליו הולכים, ורודפת אחרי השחקן.
   הקצב עולה ויורד במחזור (beats), כמו במשחקי horde ו-ARPG: בנייה (להקות קטנות), שיא (להקות גדולות ותכופות, עם הודעה),
   ואז רגע של שקט. גם אחרי קרב גדול (הרבה הריגות בזמן קצר) יש הפסקה קצרה, כדי שערב שלם לא יתיש.
   על דרך בין שערים מגיעות יותר להקות. להקה שהופלה כולה משאירה ערימת שלל קטנה.
   רק בעולם (worldUpdate ו-wFoes ב-world.js). האזור והקושי לפי מקום ההופעה (wZone). המספרים באובייקט PACE. הטקסטים ב-lang.js תחת 'pace.' */

const PACE={
  first:5,                                   // הלהקה הראשונה אחרי כמה שניות בעולם
  beats:[                                    // המחזור: כמה שניות כל שלב, כל כמה שניות להקה, וכמה בה
    {id:'build',dur:45,every:[12,18],size:[3,5]},
    {id:'peak', dur:20,every:[5,7], size:[4,7],banner:true},
    {id:'rest', dur:16,every:null}           // שקט אחרי השיא
  ],
  bigFight:{kills:10,within:12,rest:10},     // 10 הריגות תוך 12 שניות: 10 שניות בלי להקות חדשות
  weak:{hp:0.7,dmg:0.55},                     // מפלצת בלהקה חלשה מקבוצה קבועה: הרבה ונופלות מהר, כמו הגושים בזירה (HORDE.weak)
  startSize:0.6,                             // ליד הכפר (אזור start) הלהקות קטנות יותר
  dist:[500,600],                            // כמה רחוק מהשחקן הלהקה מופיעה: ממש מחוץ למסך. ולפחות קצה המסך באותו כיוון (camEdge, camera.js)
  ahead:0.9,                                 // כמה רדיאנים לכל צד מכיוון ההליכה
  spread:55,                                 // כמה הלהקה צפופה
  path:{near:170,every:0.65},                // על דרך בין שערים (עד near פיקסלים ממנה): להקות תכופות יותר, פי every
  safe:300,                                  // לא מופיעות ליד שער, ולא כשהשחקן ממש ליד הבית
  chase:750,                                 // עד איזה מרחק הלהקה רודפת (ולפחות קצת יותר מחצי אלכסון המסך). רחוק מזה היא נעלמת אחרי lose שניות
  lose:6,
  cap:45,                                    // הכי הרבה אויבים חיים בעולם יחד (כולל הקבוצות הקבועות, כ-30), בשביל הטלפון (CROWD ב-render3d.js)
  reserve:2,                                 // מקום שנשמר תמיד לשומר הפנס ולמבוקש, שמופיעים בלי לשאול. כל השאר (להקות, קבוצות שחוזרות, גל של אירוע, פיצול) נעצר ב-cap פחות reserve
  bonus:{coins:[6,12]},                      // להקה שהופלה כולה: מטבעות, ועוד שלל מאחד המקורות של האזור (NODES)
  hush:6                                     // בכניסה לאזור: הודעה אחת. מה שמגיע בשניות האלה מחכה לסופן, ורק האחרונה מוצגת (בדיקת חוויה, #121)
};
// הודעות בכניסה לעולם: הראשונה (שם האזור) מוצגת, והבאות מחכות לסוף hush. banner מ-progression.js, ומעליו התור של welcome.js
const paceBanner0=banner;
function paceHush(t,c){const w=S&&S.wd;if(w&&w.t<PACE.hush){if(w.hushed){w.later=[t,c];return}w.hushed=1}return paceBanner0(t,c)}
banner=paceHush;   // התור של welcome.js (אחת בכל 2 שניות) נטען אחרי ועוטף את זה

// כמה אויבים חיים בעולם, והאם יש מקום לעוד n. כל מי שמוסיף אויבים בעולם שואל כאן, כדי שהמגבלה תישמר תמיד
function paceAlive(){let n=0;for(const e of enemies)if(!e.dead)n++;return n}
const paceFree=()=>PACE.cap-PACE.reserve-paceAlive();
const paceRoom=n=>!S.wd||paceFree()>=n;
// הסוגים של להקה באזור הנוכחי: האויבים הרגילים שלו (לא יצורי משאבים)
function paceTypes(){const t=[];for(const G of WR().foes)if(!G.creature&&ETYPES[G.type]&&!t.includes(G.type))t.push(G.type);return t.length?t:['grunt']}
// הדרכים: קו מהבית לכל שער ודרך פתוחה
function paceOnPath(x,y){
  const R=WR(),h=R.home,gs=wGates();let best=1e9;
  for(const k in gs){if(k==='home')continue;const g=gs[k],vx=g.x-h.x,vy=g.y-h.y,L2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((x-h.x)*vx+(y-h.y)*vy)/L2));
    best=Math.min(best,Math.hypot(x-h.x-vx*t,y-h.y-vy*t))}
  return best<PACE.path.near;
}
const paceBeat=p=>PACE.beats[p.b];   // השלב הנוכחי במחזור
// האם עכשיו מותר להביא להקה: לא בדיג, לא מול שומר, לא בגל של אירוע, ולא מעל המגבלה
function paceBusy(w){
  return w.fish||w.warden||(w.ev&&w.ev.kind==='wave')||Math.hypot(P.x-WR().home.x,P.y-WR().home.y)<PACE.safe*0.7||paceFree()<=0;
}
function paceSpot(){
  const R=WR(),gs=Object.values(wGates(true)),dir=P.moving?Math.atan2(P.vy,P.vx):rand(0,6.28);
  for(let i=0;i<8;i++){
    const a=dir+rand(-PACE.ahead,PACE.ahead)*(i<5?1:3),d=Math.max(rand(...PACE.dist),camEdge(a)+40),s=placeClamp({x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d});
    if(Math.hypot(s.x-P.x,s.y-P.y)<PACE.dist[0]*0.6)continue;   // נדחק לקצה וקרוב מדי
    if(gs.some(g=>Math.hypot(g.x-s.x,g.y-s.y)<PACE.safe))continue;
    if((R.ponds||[]).concat(R.towers||[]).some(p=>Math.hypot(p.x-s.x,p.y-s.y)<p.r+40))continue;
    return s}
  return null;
}
// להקה אחת. n: כמה (אחרת לפי השלב). at: איפה (אחרת בקצה המסך, paceSpot)
function paceSpawn(n,at){
  const w=S.wd,B=paceBeat(w.pace),s=at||paceSpot();if(!s)return null;
  const Z=wZone(s),types=paceTypes(),mix=B.id==='peak';
  n=n||Math.round(rand(...(B.size||PACE.beats[0].size)));if(Z.id==='start')n=Math.max(2,Math.round(n*PACE.startSize));
  n=Math.min(n,paceFree());if(n<2)return null;   // אין מקום לשתיים: אין להקה (לא להקה של אחת)
  const type=types[Math.floor(Math.random()*types.length)],pk={id:++w.pace.id,x:s.x,y:s.y,n,left:n,big:B.id==='peak'};
  for(let k=0;k<n;k++){
    const t=mix?types[Math.floor(Math.random()*types.length)]:type,a=rand(0,6.28),r=rand(0,PACE.spread);
    const e=addEnemy(t,s.x+Math.cos(a)*r,s.y+Math.sin(a)*r,Z.hp*PACE.weak.hp*WORLD.foeHp);   // foeHp: אויבים בעולם חזקים יותר (world.js)
    e.dmg*=Z.dmg*PACE.weak.dmg*storySafe();e.speed*=Z.speed;e.zone=Z.id;affixRoll(e,Z.id);
    e.xp=0;e.home=0;e.pack=pk;e.far=0;challengeSpawn(e);tierSpawn(e)}
  w.pace.packs++;w.pace.sizes.push(n);
  return pk;
}
// כל פריים בעולם (worldUpdate)
function paceUpdate(dt){
  const w=S.wd;if(!w)return;
  if(w.later&&w.t>=PACE.hush){banner(...w.later);w.later=null}   // דרך התור, כדי שלא תדרוס הודעה אחרת
  const p=w.pace||(w.pace={b:0,bt:0,next:PACE.first,id:0,packs:0,sizes:[],kills:[],quiet:0,peaks:0,rests:0,bonus:0});
  if(p.k==null)p.k=S.kills;for(;p.k<S.kills;p.k++)p.kills.push(w.t);   // כל הריגה בעולם נספרת לקרב הגדול
  for(const e of enemies)if(e.pack&&e.dead&&!e.gone&&!e.counted){e.counted=true;paceKill(e)}
  p.bt+=dt;const B=paceBeat(p);
  if(p.bt>=B.dur){p.bt=0;p.b=(p.b+1)%PACE.beats.length;const N=paceBeat(p);
    if(N.id==='rest')p.rests++;
    if(N.id==='peak'){p.peaks++;p.next=Math.min(p.next,1.5);if(N.banner)banner(T('pace.peak'),'#EF4E57')}}
  // קרב גדול: הפסקה
  const t=w.t;p.kills=p.kills.filter(k=>t-k<PACE.bigFight.within);
  if(p.kills.length>=PACE.bigFight.kills&&p.quiet<=0){p.quiet=PACE.bigFight.rest;p.kills=[];p.rests++}
  if(p.quiet>0){p.quiet-=dt;return}
  const N=paceBeat(p);if(!N.every)return;
  if((p.next-=dt*(paceOnPath(P.x,P.y)?1/PACE.path.every:1))>0)return;
  p.next=rand(...N.every);if(paceBusy(w)||!paceSpawn())p.next=1;   // לא הסתדר עכשיו: עוד שנייה
}
// תנועה של מפלצת מלהקה (wFoes ב-world.js): רודפת אחרי השחקן. רחוקה מדי לאורך זמן: נעלמת בלי שלל
function paceFoeMove(e,dt){
  const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,sp=e.speed*slowK(e);
  const busy=strikeTick(e,dt,d);   // מכה עם הכנה במקום נזק במגע (strike.js)
  if(d<Math.max(PACE.chase,Math.hypot(W,H)/2+150)){e.far=0;if(!busy){e.x+=dx/d*sp*dt;e.y+=dy/d*sp*dt}}
  else if((e.far+=dt)>PACE.lose){e.dead=true;e.pack.left--;e.gone=true}
  e.x+=e.kx*dt;e.y+=e.ky*dt;const f=Math.max(0,1-dt*9);e.kx*=f;e.ky*=f;e.ph+=dt*e.speed*0.08;e.flash-=dt;
  if(ETYPES[e.type].speed>=95&&d<240){e.shoot-=dt;if(e.shoot<=0){e.shoot=rand(2,3);shootE(e.x,e.y,Math.atan2(dy,dx),175,6,8)}}   // המרחפים יורים, כמו ה-wisp בקבוצות
  wPonds(e);
}
// מפלצת מלהקה הופלה. להקה שהופלה כולה משאירה שלל
function paceKill(e){
  const w=S.wd,pk=e.pack;
  if(--pk.left>0)return;
  const B=PACE.bonus,R=WR(),F=R.fields[Math.floor(Math.random()*R.fields.length)],K=F&&NODES.kinds[F.kind];
  dropSpawn('coins',Math.round(rand(...B.coins)*(pk.big?1.5:1)),e.x,e.y);
  if(K)runGive(K.wdrop?Object.assign({},K.drop,K.wdrop):K.drop,e.x,e.y);
  w.pace.bonus++;floatText(e.x,e.y-e.r-30,T('pace.bonus'),C.gold,15);sparks(e.x,e.y,C.gold,22,240);sfx('celebrate');
}
