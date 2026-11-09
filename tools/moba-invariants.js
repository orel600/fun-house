/* בדיקת אי-שינוי למכניקה של הטנק בין שתי גרסאות (QUINN, 9.11.2026, חבילת הבוקר: "נזק, זמנים, טווחים ורדיוסים קפואים").
   רץ בדו-ממד ובלי דפדפן גרפי: הלוגיקה זהה בתלת-ממד. דו-קרב קבוע (seed קבוע, אותם מיקומים), ולכן שתי הרצות על אותה גרסה זהות בייט לבייט.
   מה נרשם: התקפה רגילה (נזק, קצה הטווח, פריים הנזק הראשון, האטה), סדן (נזק לפי מרחק ורדיוס, השתקה, נחיתה, שדה האטה), קריאת קרב (משיכה, זמן, מגן, שרפה),
   חומת ברזל (נזק, השתקה, משיכה, מיקום וזמן החומה), ריפוי הבסיס (20% בשנייה בתוך 240, כלום מחוץ לו) וחזרה הביתה.
   שימוש:
     node tools/moba-invariants.js record <תיקיית משחק> <out.json>      רושם את המספרים של הגרסה
     node tools/moba-invariants.js diff <a.json> <b.json>               משווה. השינוי היחיד המותר: שדה ההאטה של הסדן (anvil.maxSlow, maxSlowK, zoneMax, anvilSlowTimeline). כל הבדל אחר: יוצא עם קוד 1
   הוא לא מחליף את בדיקת GitHub (tools/check.js), ולא בודק מראה, רק מספרים. הדברים שהוא לא תופס: שינוי בתלת-ממד בלבד, ובוטים (mbBot מכובה בכוונה) */
const path=require('path');
const MODE=process.argv[2];
if(MODE==='diff'){
  const a=require(path.resolve(process.argv[3])),b=require(path.resolve(process.argv[4]));
  const diffs=[];const walk=(x,y,p)=>{if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))walk(x[k],y[k],p+'.'+k)}else if(JSON.stringify(x)!==JSON.stringify(y))diffs.push([p,x,y])};
  walk(a,b,'');
  const allowed=p=>/^\.anvil\.(maxSlow|maxSlowK|zoneMax)/.test(p)||/^\.anvilSlowTimeline/.test(p);
  const ok=diffs.filter(d=>allowed(d[0])),bad=diffs.filter(d=>!allowed(d[0]));
  console.log('מותר (שדה ההאטה של הסדן): '+ok.length);for(const d of ok)console.log('  ',d[0],JSON.stringify(d[1]),'->',JSON.stringify(d[2]));
  console.log('הבדלים לא צפויים: '+bad.length);for(const d of bad)console.log('  ',d[0],JSON.stringify(d[1]),'->',JSON.stringify(d[2]));
  process.exit(bad.length?1:0);
}else if(MODE==='record'){
const {chromium}=require('playwright');const fs=require('fs');
const dir=process.argv[3],OUT=process.argv[4];
if(!dir||!OUT){console.error('שימוש: node tools/moba-invariants.js record <תיקיית משחק> <out.json>');process.exit(2)}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:844,height:390}});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
await p.addInitScript(()=>{localStorage.setItem('zm-gfx','2d');localStorage.setItem('fh-mb-tips','99');let a=11;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
await p.goto('file:///'+dir.replace(/ /g,'%20')+'/index.html');await p.waitForTimeout(1500);
const R=await p.evaluate(async()=>{
 const out={};const DT=1/60;
 const setup=(foes)=>{mobaStart('tank');MB.waveT=1e9;mbBot=function(){};banner=function(){};
  const me=MB.me;MB.u=MB.u.filter(u=>u.k==='tower'||u.k==='base'||u===me);me.x=0;me.y=0;me.lvl=6;me.face=me.aim=0;me.hp=me.max;me.gold=0;
  const list=[];for(const f of foes){let u;if(f.k==='minion')u=mbUnit({k:'minion',team:1,type:'mb_m1',x:f.x,y:f.y,r:MOBA.minion.r,hp:1e6,max:1e6,pow:1,speed:0,lane:0,face:Math.PI});
   else{u=mbHero(f.kit||'warrior',1,false,list.length);u.x=f.x;u.y=f.y;u.hp=u.max=1e7;u.face=Math.PI}u.id2=f.id;list.push(u);MB.u.push(u)}
  for(const u of MB.u)if(u.k==='hero'&&u!==me){u.st.imm=0}
  mbVisNow(true);return{me,list}};
 const snap=(u)=>({x:+u.x.toFixed(2),y:+u.y.toFixed(2),hp:u.hp,stun:+(u.st.stun||0).toFixed(3),slow:+(u.st.slow||0).toFixed(3),slowK:+(u.st.slowK||0).toFixed(3),taunt:+(u.st.taunt||0).toFixed(3),shield:+(u.st.shield||0).toFixed(1),burn:+(u.st.burn||0).toFixed(2)});
 // run N frames, record first-damage frame, max stun/slow, min x displacement, wall info, zones
 const run=(me,list,secs,hook)=>{const t0=list.map(u=>({hp:u.hp,x:u.x,y:u.y}));const rec={dmgFrame:null,maxStun:{},maxSlow:{},maxSlowK:{},minDx:{},firstDmg:{},zoneSeen:0,zoneMax:0,wallSeen:0,wallMax:0,meShield:0,meShieldFrames:0,tauntSeen:{},hits:{}};
  for(const u of list){rec.maxStun[u.id2]=0;rec.maxSlow[u.id2]=0;rec.maxSlowK[u.id2]=0;rec.minDx[u.id2]=0}
  const f0=Math.round(secs/DT);let me0=me.x;rec.meMaxX=me.x;
  for(let f=0;f<f0;f++){if(hook)hook(f);mobaUpdate(DT);
   list.forEach((u,i)=>{if(rec.firstDmg[u.id2]==null&&u.hp<t0[i].hp)rec.firstDmg[u.id2]=f;rec.maxStun[u.id2]=Math.max(rec.maxStun[u.id2],u.st.stun||0);rec.maxSlow[u.id2]=Math.max(rec.maxSlow[u.id2],u.st.slow||0);rec.maxSlowK[u.id2]=Math.max(rec.maxSlowK[u.id2],u.st.slowK||0);rec.tauntSeen[u.id2]=Math.max(rec.tauntSeen[u.id2]||0,u.st.taunt||0);
    rec.minDx[u.id2]=Math.min(rec.minDx[u.id2],u.x-t0[i].x)});
   rec.meShield=Math.max(rec.meShield,me.st.shield||0);if((me.st.shield||0)>0)rec.meShieldFrames++;rec.meMaxX=Math.max(rec.meMaxX,me.x);
   rec.zoneMax=Math.max(rec.zoneMax,MB.zones.length);rec.wallMax=Math.max(rec.wallMax,MB.walls.length)}
  rec.dmg={};list.forEach((u,i)=>{rec.dmg[u.id2]=Math.round(t0[i].hp-u.hp)});rec.meX=+me.x.toFixed(2);rec.meY=+me.y.toFixed(2);
  for(const k of ['maxStun','maxSlow','maxSlowK']){for(const id in rec[k])rec[k][id]=+rec[k][id].toFixed(3)}
  for(const id in rec.minDx)rec.minDx[id]=+rec.minDx[id].toFixed(2);return rec};
 const stripFoe=u=>{u.st.imm=0};
 // ---------- basic attack ----------
 {const {me,list}=setup([{id:'near',x:30,y:0},{id:'far',x:120,y:0},{id:'tower'}].filter(f=>f.id!=='tower'));
  me.atkT=0;const r=run(me,list,1.6);out.atk={dmg:r.dmg,firstDmg:r.firstDmg,slow:r.maxSlow,slowK:r.maxSlowK,meX:r.meX,hitsPerFoe:null};
  out.atkDef={cfg:MBKIT.tank.atk}}
 // ---------- basic attack: range edges ----------
 {const res={};for(const gap of [20,40,46,60,90,100,140]){const {me,list}=setup([{id:'t',x:gap+me0(),y:0}]);function me0(){return 0}
   me.atkT=0;const r=run(me,list,1.2);res[gap]={dmg:r.dmg.t,fd:r.firstDmg.t}}out.atkRange=res}
 // ---------- s1 anvil ----------
 {const foes=[{id:'in',x:300+40,y:0},{id:'edge',x:300+90,y:0},{id:'out',x:300+110,y:0},{id:'minion',k:'minion',x:300,y:60},{id:'wide',x:300,y:-110}];
  const {me,list}=setup(foes);me.cd.s1=0;const ok=mbCast(me,'s1',{x:300,y:0});const cdAfter=+me.cd.s1.toFixed(3);
  const r=run(me,list,3.2);out.anvil={ok,cdAfter,dmg:r.dmg,firstDmg:r.firstDmg,maxStun:r.maxStun,maxSlow:r.maxSlow,maxSlowK:r.maxSlowK,zoneMax:r.zoneMax,landX:r.meX,landY:r.meY,cfg:MBKIT.tank.s1}}
 // anvil: field only on enemies, and towers/bases never slowed (allowed change): check slow lasting after stun ends
 {const foes=[{id:'a',x:300,y:0}];const {me,list}=setup(foes);me.cd.s1=0;mbCast(me,'s1',{x:300,y:0});const tw=MB.u.find(u=>u.k==='tower'&&u.team===1);
  const S1=[];for(let f=0;f<60*5;f++){mobaUpdate(DT);if(f%30===0)S1.push([+(f*DT).toFixed(1),+(list[0].st.slow||0).toFixed(2),+(list[0].st.slowK||0).toFixed(2),+(list[0].st.stun||0).toFixed(2),tw?+(tw.st.slow||0).toFixed(2):null])}
  out.anvilSlowTimeline=S1}
 // ---------- s2 taunt ----------
 {const foes=[{id:'in',x:100,y:0},{id:'inY',x:0,y:-120},{id:'edge',x:165,y:0},{id:'out',x:185,y:0}];
  const {me,list}=setup(foes);me.cd.s2=0;const x0t=list.map(u=>u.x),ok=mbCast(me,'s2');const castPull={};list.forEach((u,i)=>{castPull[u.id2]=+(u.x-x0t[i]).toFixed(2)});const cdAfter=+me.cd.s2.toFixed(3);const sh0=me.st.shield;
  const r=run(me,list,3.6);out.taunt={castPull,ok,cdAfter,shieldAtCast:sh0,meShieldMax:r.meShield,shieldFrames:r.meShieldFrames,tauntSeen:r.tauntSeen,minDx:r.minDx,dmg:r.dmg,cfg:MBKIT.tank.s2}}
 // taunt: burn on attackers
 {const {me,list}=setup([{id:'a',x:100,y:0}]);me.cd.s2=0;mbCast(me,'s2');const a=list[0];const hp0=me.hp;for(let i=0;i<40;i++)mobaUpdate(DT);const h1=a.hp;mbDmg(a,me,50,'physical');out.tauntBurn={attackerBurn:+(a.st.burn||0).toFixed(2),attackerHpAfterHit:h1-a.hp}}
 // ---------- ult wall ----------
 {const foes=[{id:'c',x:220,y:0},{id:'in',x:220+120,y:40},{id:'edge',x:220+175,y:0},{id:'out',x:220+195,y:0},{id:'minion',k:'minion',x:240,y:-60}];
  const {me,list}=setup(foes);me.cd.ult=0;const hp0=list.map(u=>u.hp),x0=list.map(u=>u.x),ok=mbCast(me,'ult',{x:220,y:0});const castDmg={},castDx={};list.forEach((u,i)=>{castDmg[u.id2]=Math.round(hp0[i]-u.hp);castDx[u.id2]=+(u.x-x0[i]).toFixed(2)});const cdAfter=+me.cd.ult.toFixed(3);const wall0=MB.walls.length,w0=MB.walls[0]&&{x:+MB.walls[0].x.toFixed(2),t:+MB.walls[0].t.toFixed(2),team:MB.walls[0].team};
  const r=run(me,list,4.5);out.wall={castDmg,castDx,ok,cdAfter,wallsAtCast:wall0,wall0:w0,wallMax:r.wallMax,dmg:r.dmg,firstDmg:r.firstDmg,maxStun:r.maxStun,minDx:r.minDx,cfg:MBKIT.tank.ult}}
 // wall ends: count remaining walls at 4.5s
 out.wallEnd=MB.walls.length;
 // ---------- base heal and recall (home zone invariants) ----------
 {const {me}=setup([]);const base=MB.u.find(u=>u.k==='base'&&u.team===0);const res={};for(const d of [150,200,239,241,300]){me.x=base.x+d;me.y=0;me.hp=me.max/2;me.dead=false;const h0=me.hp;for(let i=0;i<60;i++)mobaUpdate(DT);res[d]=+((me.hp-h0)/me.max).toFixed(3)}
  out.baseHeal={perSecFrac:res,cfg:{heal:MOBA.base.heal,healR:MOBA.base.healR}};
  me.x=0;me.hp=me.max;me.dead=false;let ok=typeof mbRecallStart==='function'&&mbRecallStart(me);let t=0;while(me.recall&&t<600){mobaUpdate(DT);t++}out.recall={ok,frames:t,landed:+Math.hypot(me.x-me.home.x,me.y-me.home.y).toFixed(1),cfg:typeof MBRECALL!=='undefined'?MBRECALL:null}}
 return out});
fs.writeFileSync(OUT,JSON.stringify(R,null,1));console.log(dir.slice(-14),'->',OUT,JSON.stringify(errs.slice(0,3)));await b.close()})();

}else{console.error('שימוש: node tools/moba-invariants.js record|diff ...');process.exit(2)}
