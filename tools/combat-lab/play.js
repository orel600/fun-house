/* מעבדת קרב (מחקר "למה הקרב לא כיף", docs/plan-combat.md, 1.11.2026). לא חלק מהמשחק ולא מהבדיקה הרגילה.
   מריץ את המשחק בטלפון שוכב (1280×590), שם גיבור באמצע הדרך בעולם הפתוח, ומשחק בו בוט, בכמה תרחישים:
     roam   : מסתובב באחו ונלחם במה שבא (קבוצות קבועות, להקות, אויבים מיוחדים)
     warden : קרב בשומר האבן (פנס האדמה)
   לכל תרחיש שני בוטים: "פעיל" (מתקרב, בורח כשהחיים נמוכים, מתחמק מיריות, לוחץ על סקילים) ו"עומד" (הולך לאויב ועומד, בלי כלום).
   אם העומד מצליח כמעט כמו הפעיל, ההחלטות של השחקן לא משנות.
   נמדד: כל פגיעה (ממי: נשק, סקיל, אור), כל הריגה וכמה זמן היא לקחה, כל מכה שחטפת וממה, כל פעולה של אור (orbit.js), וזמנים של "רגעי החלטה".
   הרצה:     node tools/combat-lab/play.js [--gfx 3d] [--secs 150] [--shots] [--only roam|warden] [--lv 6]
   פלט: tools/combat-lab/out/<תרחיש>-<בוט>.json, ועם --shots גם תמונה לכל שנייה במשחק (לא נכנס לריפו). */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=(k,d)=>{const i=args.indexOf('--'+k);return i<0?d:(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true)};
const OUT=path.resolve(opt('out',path.join(__dirname,'out'))),GFX=opt('gfx','2d'),SECS=+opt('secs',150),SHOTS=!!opt('shots',false),ONLY=opt('only',null),LV=+opt('lv',6);
const VIEW={width:1280,height:590};

/* ---- רץ בתוך הדף: מדידה. עוטפים את הפונקציות הגלובליות של המשחק מבחוץ, בלי לשנות אותן ---- */
function labHook(){
  const L=window.LAB={ev:[],dmg:{},hurt:[],kills:[],orb:[],secs:[],first:new Map()};
  const t=()=>S.wd?+S.wd.t.toFixed(2):0;
  const who=()=>{const s=(new Error().stack||'').split('\n').slice(3,6).map(l=>(l.match(/at (\S+)/)||[])[1]||'?');return s.join('<')};
  const d0=damage;damage=function(e,base,w,ang,tt,ch){const hp=e.hp;const r=d0.apply(this,arguments);
    if(!e.node){const k=w||'?';const o=L.dmg[k]||(L.dmg[k]={n:0,sum:0});o.n++;o.sum+=Math.max(0,hp-Math.max(0,e.hp));
      if(!L.first.has(e))L.first.set(e,t())}return r};
  const k0=kill;kill=function(e){const r=k0.apply(this,arguments);if(!e.node)L.kills.push({t:t(),type:e.type,affix:e.affix||null,warden:!!e.warden,pack:!!e.pack,ttk:+(t()-(L.first.get(e)??t())).toFixed(2),max:Math.round(e.max||0)});return r};
  const h0=hurt;hurt=function(d){const hp=P.hp,inv=P.inv;const r=h0.apply(this,arguments);
    const near=nearest(400),bul=eb.some(b=>Math.hypot(P.x-b.x,P.y-b.y)<P.r+b.r);
    L.hurt.push({t:t(),d:+(hp-P.hp).toFixed(1),raw:d,blocked:hp===P.hp&&inv<=0,src:bul?'shot':who(),foe:near?(near.warden?'warden':near.type)+(near.affix?'+'+near.affix:''):null});return r};
  // שומר: כמה פעמים כל אור באמת עשה משהו
  L.orbLast={hits:0,blocked:0,shields:0,healed:0};
}
// כל שנייה במשחק: מצב קצר
function labTick(){
  const L=LAB,o=S.orb||{},near=nearest(WORLD.attackRange);
  const now={hits:o.hits||0,blocked:o.blocked||0,shields:o.shields||0,healed:Math.round(o.healed||0)};
  const d={};for(const k in now)d[k]=now[k]-L.orbLast[k];L.orbLast=now;
  const sk=S.sk?S.sk.ids.map((id,i)=>({id,cd:+S.sk.cd[i].toFixed(1)})):[];
  L.secs.push({t:+S.wd.t.toFixed(1),hp:Math.round(P.hp),max:Math.round(P.maxHp),fight:!!near,foes:enemies.filter(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<640).length,
    shots:eb.length,orb:d,sk,moving:!!joy,lights:(o.types||[]).join(','),mode:S.mode});
}
/* ---- הבוט. active: מתקרב, שומר מרחק (קשת), בורח בחיים נמוכים, מתחמק מיריות, לוחץ על סקילים. idle: הולך לאויב ועומד ---- */
function labBot(kind,target){
  const L=LAB;if(S.mode!=='play'||!S.wd)return;
  const go=(dx,dy)=>{const l=Math.hypot(dx,dy);joy=l<1?null:{id:-1,ox:-999,oy:-999,dx:dx/l,dy:dy/l}};
  const ranged=P.weapon!=='sword',foes=enemies.filter(e=>!e.dead);
  let tgt=null,bd=1e9;for(const e of foes){if(target==='warden'&&!e.warden&&Math.hypot(e.x-P.x,e.y-P.y)>160)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;tgt=e}}
  if(!tgt){if(target==='warden'){const W=STORY.lanterns.earth;go(W.x-P.x,W.y-P.y)}else{const n=S.nd.list.find(n=>!n.dead);go(n?n.x-P.x:0,n?n.y-P.y:0)}return}
  const dx=tgt.x-P.x,dy=tgt.y-P.y,want=ranged?170:tgt.r+P.r+6;
  if(kind==='idle'){if(bd>want+8)go(dx,dy);else joy=null;return}
  // פעיל
  if(L.flee||P.hp<P.maxHp*0.33){L.flee=P.hp<P.maxHp*0.75;if(L.flee){let ax=0,ay=0;for(const e of foes){const d=Math.hypot(e.x-P.x,e.y-P.y)||1;if(d<500){ax+=(P.x-e.x)/d/d;ay+=(P.y-e.y)/d/d}}go(ax||1,ay);L.fled=(L.fled||0)+1;return}}
  // ירייה שבאה לכיוון שלי: צעד הצידה
  for(const b of eb){const rx=P.x-b.x,ry=P.y-b.y,sp=Math.hypot(b.vx,b.vy)||1,along=(rx*b.vx+ry*b.vy)/sp,side=(rx*b.vy-ry*b.vx)/sp;
    if(along>0&&along<200&&Math.abs(side)<P.r+b.r+8){go(-b.vy*Math.sign(side||1),b.vx*Math.sign(side||1));L.dodges=(L.dodges||0)+1;return}}
  // סימנים על הרצפה של השומר (ברק) או טבעת: מתרחקים
  if(S.sk)S.sk.ids.forEach(id=>{if(wskReady(id)>=0&&nearest(WORLD.attackRange)){if(wskUse(id))L.skillUses=(L.skillUses||0)+1}});
  if(bd>want+10)go(dx,dy);else if(ranged&&bd<want-40)go(-dx,-dy);else if(ranged)go(-dy,dx);else joy=null;
}

async function scenario(name,bot){
  const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:VIEW,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=11;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
  await page.addInitScript(([g])=>{try{localStorage.setItem('zm-gfx',g);localStorage.setItem('zm-lang','en')}catch(e){}},[GFX]);
  await page.goto('file://'+path.resolve(__dirname,'..','..','index.html'));
  await page.clock.runFor(400);
  const run=ms=>page.clock.runFor(ms);
  // גיבור באמצע הדרך: לוחם עם חרב, רמה LV, שלושה אורות (אש, כפור, אבן), ההקדמה נעשתה
  await page.evaluate(([lv,warden])=>{if(typeof setLang==='function'&&LANG!=='en')setLang('en');
    SAVE.hero.start='warrior';SAVE.hero.level=lv;SAVE.gift=true;Object.assign(SAVE.village,{center:2,forge:2,mill:2,mine:2,market:2,stash:1});
    SAVE.gear.orbit=['emberOrb','frostOrb','stoneOrb','leafOrb',null];
    SAVE.story=SAVE.story||{};SAVE.story.intro=true;SAVE.met={fisher:1,cutter:1,herbal:1};
    if(warden){SAVE.quests.active.s1Warden={p:[0]};SAVE.quests.done.s1Path=1}
    saveNow()},[LV,name==='warden']);
  await page.tap('#startBtn').catch(()=>page.evaluate(()=>document.getElementById('startBtn').click()));await run(1500);
  const closeAll=()=>page.evaluate(()=>{if(typeof welcomeClose==='function'&&!document.getElementById('ovWelcome').hidden)welcomeClose();
    for(const s of ['#dailyWin [data-act="close"]','#npcDlg [data-act="close"]','#qLog [data-act="close"]']){const b=document.querySelector(s);if(b&&b.offsetParent)b.click()}});
  await closeAll();await run(300);await closeAll();
  await page.evaluate(()=>{villageUi(false);enterWorld('home')});await run(900);
  if(GFX==='3d')await page.evaluate(()=>{R3D.drawEvery=60});
  await page.evaluate(labHook);await page.evaluate('window.labBot='+labBot+';window.labTick='+labTick);
  if(name==='warden')await page.evaluate(()=>{const W=STORY.lanterns.earth;P.x=W.x-120;P.y=W.y+560;S.cam.x=P.x;S.cam.y=P.y;joy=null});
  const dir=path.join(OUT,name+'-'+bot);if(SHOTS){fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true})}
  const step=100;let n=0,lastShot=-1;
  for(let ms=0;ms<SECS*1000;ms+=step){
    await page.evaluate(([b,tg])=>labBot(b,tg),[bot,name==='warden'?'warden':null]);
    await run(step);
    const s=Math.floor((ms+step)/1000);
    if(s!==lastShot){lastShot=s;await page.evaluate(labTick);
      if(SHOTS){if(GFX==='3d'){await page.evaluate(()=>{R3D.drawEvery=0});await run(34);await page.evaluate(()=>{R3D.drawEvery=60})}
        await page.screenshot({path:path.join(dir,String(++n).padStart(3,'0')+'.jpg'),type:'jpeg',quality:60})}}
    const st=await page.evaluate(()=>({mode:S.mode,wd:!!S.wd,w:S.wd&&S.wd.warden===null&&LAB.kills.some(k=>k.warden)}));
    if(st.mode==='over'||!st.wd){await page.evaluate(()=>LAB.died=S.wd?S.wd.t:-1);break}
    if(name==='warden'&&st.w)break;
  }
  const L=await page.evaluate(()=>{const L=LAB;delete L.first;return Object.assign(L,{died:L.died,wd:S.wd?{t:S.wd.t}:null,
    hero:{lv:heroLv(),maxHp:P.maxHp,weapon:P.weapon,swDmg:P.sw&&P.sw.dmg,swCd:P.sw&&P.sw.cd,swRange:P.sw&&P.sw.range,speed:P.speed,skills:S.sk&&S.sk.ids,lights:S.orb&&S.orb.types}})});
  L.errors=errors;fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name+'-'+bot+'.json'),JSON.stringify(L));
  await browser.close();return L;
}

function summary(name,bot,L){
  const secs=L.secs.length,fight=L.secs.filter(s=>s.fight).length,hurtSum=L.hurt.reduce((a,h)=>a+h.d,0);
  const by={};for(const h of L.hurt){const k=h.src==='shot'?'shot':(h.src.split('<')[0]);const key=k+' ('+(h.foe||'?')+')';by[key]=(by[key]||0)+h.d}
  const dsum=Object.values(L.dmg).reduce((a,o)=>a+o.sum,0);
  const kt={};for(const k of L.kills){const key=k.warden?'warden':k.type+(k.affix?'+'+k.affix:'');(kt[key]||(kt[key]=[])).push(k.ttk)}
  const orb={hits:0,blocked:0,shields:0,healed:0};for(const s of L.secs)for(const k in orb)orb[k]+=s.orb[k];
  console.log('\n=== '+name+' / '+bot+' === '+secs+'s, בקרב '+fight+'s, הריגות '+L.kills.length+(L.died?' · מת ב-'+L.died.toFixed(0)+'s':'')+' · דילוגים '+(L.dodges||0)+' · בריחות '+(L.fled||0)+' · סקילים '+(L.skillUses||0));
  console.log('  גיבור:',JSON.stringify(L.hero));
  console.log('  נזק שעשיתי:',Object.entries(L.dmg).map(([k,o])=>k+' '+Math.round(o.sum)+' ('+Math.round(o.sum/dsum*100)+'%, '+o.n+' פגיעות)').join(' · '));
  console.log('  זמן הריגה:',Object.entries(kt).map(([k,a])=>k+' ×'+a.length+' ממוצע '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)+'s').join(' · '));
  console.log('  נזק שחטפתי: '+Math.round(hurtSum)+' ב-'+L.hurt.length+' מכות (נבלעו '+L.hurt.filter(h=>h.blocked).length+'): '+Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+' '+Math.round(v)).join(' · '));
  console.log('  אורות (לדקה): פגיעות '+(orb.hits/secs*60).toFixed(0)+' · יריות שנעצרו '+(orb.blocked/secs*60).toFixed(1)+' · מגן '+(orb.shields/secs*60).toFixed(1)+' · ריפוי '+(orb.healed/secs*60).toFixed(0)+' חיים');
  if(L.errors.length)console.log('  שגיאות:',L.errors.slice(0,3));
}

(async()=>{
  const list=[['roam','active'],['roam','idle'],['warden','active'],['warden','idle']].filter(([n])=>!ONLY||n===ONLY);
  for(const [n,b] of list){const L=await scenario(n,b);summary(n,b,L)}
})();
