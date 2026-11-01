/* המבקר (ניר, 1.11.2026: "מבקר שתפקידו לעבור על המשחק ולתת ביקורת"). לא חלק מהמשחק, לא נטען ב-index.html.
   משחק כמו שחקן חדש וכמו שחקן מתקדם, בתלת-ממד, בטלפון של ניר (1280×590) ובאייפון שוכב (844×390), באנגלית ובעברית:
   פתיחה ← כפר ← עולם (אחו, קרב, שלל, השומר) ← חלונות (ציוד, קווסטים, מפה, ספר, הגדרות, שיחה עם תושב) ← זירה (רק מסתכל).
   בכל עצירה: צילום, וכמה אחוז מהמסך הממשק תופס, טקסט חתוך, אלמנטים חופפים, חלונות שגוללים, שגיאות בקונסול.
   ובכל ריצה: זמן לפריים (יחסי, אין כרטיס גרפי), זמן להרוג ולמות, הכי הרבה שניות בלי "החלטה מעניינת",
   ותוך כמה זמן השחקן החדש יודע מה המטרה הבאה.
   הרצה:      node tools/critic/run.js                   (כ-6 דקות בתלת-ממד)
   אפשרויות:  --gfx 2d        בדו-ממד (מהיר בהרבה)
              --only n-en     רק שילוב אחד (n/s × en/he)
              --out <תיקייה>  ברירת מחדל tools/critic/out/<תאריך>
   הפלט: <out>/metrics.json, צילומים (PNG), ו-<out>/small/*.jpg ברוחב 600 (בשביל docs/critic). ההסבר: docs/critic/README.md */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1]};
const DAY=new Date().toISOString().slice(0,10);
const OUT=path.resolve(opt('out')||path.join(__dirname,'out',DAY));
const GFX=opt('gfx')||'3d';
const VIEWS={n:{width:1280,height:590},s:{width:844,height:390}};   // n: הטלפון של ניר. s: אייפון שוכב
const LANGS=['en','he'];
// השחקן המלא (חדש + מתקדם + זירה) רץ בשילוב הראשי. בשאר: סיור חלונות של שחקן מתקדם, כדי לראות פריסה ושפה
const MAIN='n-en';

/* ---- מדידה בתוך הדף ---- */
function measure(){
  const vw=innerWidth,vh=innerHeight;
  const vis=el=>{if(!el.isConnected)return false;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return false;
    for(let e=el;e&&e!==document.documentElement;e=e.parentElement){const s=getComputedStyle(e);if(e.hidden||s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false}return true};
  const name=el=>(el.id?'#'+el.id:el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:el.tagName)+' '+((el.innerText||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,24));
  // כמה מהמסך הממשק תופס: רשת של נקודות, ובכל נקודה בודקים אם מה שלמעלה הוא קנבס/רקע או ממשק
  let ui=0,N=0;const bg=e=>!e||e===document.body||e===document.documentElement||e.tagName==='CANVAS'||e.id==='r3d'||e.closest('#r3d');
  for(let y=4;y<vh;y+=vh/30)for(let x=4;x<vw;x+=vw/50){N++;const e=document.elementFromPoint(x,y);if(!bg(e)){const s=getComputedStyle(e);if(s.pointerEvents!=='none'||s.backgroundColor!=='rgba(0, 0, 0, 0)')ui++}}
  const sel='button,a[href],input,select,[role=button],[data-act],[data-id],[data-tab]';
  let clk=[...document.querySelectorAll(sel)].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.right>0&&r.bottom>0&&r.left<vw&&r.top<vh});
  clk=clk.filter(e=>!clk.some(o=>o!==e&&o.contains(e)));
  const out={uiPct:Math.round(ui/N*100),buttons:clk.length,small:[],overlap:[],clipped:[],tiny:[],scrollWins:[],offscreen:[]};
  for(const e of clk){const r=e.getBoundingClientRect();if(r.width<44||r.height<44)out.small.push(name(e)+' '+Math.round(r.width)+'×'+Math.round(r.height))}
  for(let i=0;i<clk.length;i++)for(let j=i+1;j<clk.length;j++){const a=clk[i].getBoundingClientRect(),b=clk[j].getBoundingClientRect();
    const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left),iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(ix>3&&iy>3)out.overlap.push(name(clk[i])+' ✕ '+name(clk[j]))}
  for(const w of document.querySelectorAll('.win,.panel,.ov>div,#vPanel,#wPanel,#npcDlg,#qLog,#bookWin,#wMap')){if(!vis(w))continue;const r=w.getBoundingClientRect();
    if(r.left<-2||r.top<-2||r.right>vw+2||r.bottom>vh+2)out.offscreen.push((w.id||w.className.split(' ')[0]));
    for(const s of [w,...w.querySelectorAll('*')]){const cs=getComputedStyle(s);if(/(auto|scroll)/.test(cs.overflowY)&&s.scrollHeight>s.clientHeight+6&&vis(s)){out.scrollWins.push((w.id||w.className.split(' ')[0])+(s===w?'':' > '+(s.id||s.className.split(' ')[0]))+' '+s.scrollHeight+'/'+s.clientHeight);break}}}
  const leaves=[...document.querySelectorAll('body *')].filter(e=>!/^(SCRIPT|STYLE|CANVAS|SVG|PATH)$/i.test(e.tagName)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&vis(e));
  const tl=[];
  for(const e of leaves){const s=getComputedStyle(e),f=parseFloat(s.fontSize),r=e.getBoundingClientRect(),t=e.textContent.replace(/\s+/g,' ').trim().slice(0,30);
    if(r.bottom<0||r.top>vh||r.right<0||r.left>vw)continue;tl.push(e);
    if(f<11)out.tiny.push(t+' ('+f+'px)');
    const hid=/(hidden|clip)/.test(s.overflowX+s.overflowY)||s.textOverflow==='ellipsis';
    if(hid&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+3))out.clipped.push(t);
    else if(r.right>vw+2||r.left<-2)out.clipped.push(t+' (יוצא מהמסך)')}
  out.textOverlap=[];
  for(let i=0;i<tl.length&&out.textOverlap.length<10;i++)for(let j=i+1;j<tl.length;j++){const A=tl[i],B=tl[j];if(A.contains(B)||B.contains(A))continue;
    const a=A.getBoundingClientRect(),b=B.getBoundingClientRect(),ix=Math.min(a.right,b.right)-Math.max(a.left,b.left),iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(ix>5&&iy>5)out.textOverlap.push(A.textContent.trim().slice(0,18)+' ✕ '+B.textContent.trim().slice(0,18))}
  for(const k in out)if(Array.isArray(out[k]))out[k]=[...new Set(out[k])].slice(0,15);
  return out;
}

/* ---- יומן "רגעים": כל דבר שנותן לשחקן החלטה או חדשות. מזה מחשבים כמה זמן עבר בלי כלום ---- */
function watchMoments(){
  window.__m=[];const add=(k,d)=>window.__m.push({t:Date.now(),k,d:String(d||'').slice(0,40)});
  const wrap=(f,fn)=>{const o=window[f];if(typeof o!=='function')return;window[f]=function(...a){try{fn(...a)}catch(e){}return o.apply(this,a)}};
  addEventListener('load',()=>{
    wrap('celebrate',(x,y,k,l)=>add('celebrate',k+' '+(l||'')));
    wrap('bagAdd',(k)=>{if(typeof resOf==='function'&&!resOf(k)&&k!=='coins')add('item',k)});
    wrap('questClaim',id=>add('quest-claim',id));
    wrap('qStart',q=>add('quest-start',q&&q.id));
    wrap('banner',t=>add('banner',t));
    // כפתורי בחירה שקופצים: שער, לדבר, לדוג, כרטיסי שדרוג
    const ids=['wGo','vEnter','talkBtn','fishBtn','ovLevel','ovBoss'],was={};
    setInterval(()=>{for(const id of ids){const e=document.getElementById(id),on=!!e&&!e.hidden;if(on&&!was[id])add('choice',id);was[id]=on}},100);
  });
}

async function combo(browser,vk,lang,report){
  const key=vk+'-'+lang,full=key===MAIN,view=VIEWS[vk];
  const R=report[key]={stops:{},metrics:{},errors:[],fail:[]};
  const ctx=await browser.newContext({viewport:view,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  page.on('pageerror',e=>R.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::/.test(m.text()))R.errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=11;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
  await page.addInitScript(([g,l])=>{try{if(!sessionStorage.getItem('crit')){localStorage.clear();sessionStorage.setItem('crit','1')}localStorage.setItem('zm-gfx',g);localStorage.setItem('zm-lang',l)}catch(e){}},[GFX,lang]);
  await page.addInitScript(watchMoments);
  await page.goto('file://'+path.resolve(__dirname,'..','..','index.html'));
  await page.clock.runFor(300);
  const run=ms=>page.clock.runFor(ms);
  const ev=(f,a)=>page.evaluate(f,a);
  if(GFX==='3d'){await ev(()=>{R3D.drawEvery=60});for(let i=0;i<200;i++){const g=await ev(()=>({r:R3D.ready,f:R3D.failed}));if(g.r||g.f)break;await page.waitForTimeout(50);await run(50)}
    R.metrics.r3d=await ev(()=>({ready:!!R3D.ready,failed:!!R3D.failed}))}
  let n=0;
  const shot=async(name,note)=>{await run(120);
    if(GFX==='3d')await ev(()=>{R3D.drawEvery=0});await run(34);
    const m=await ev(measure);const f=key+'-'+String(++n).padStart(2,'0')+'-'+name+'.png';
    await page.screenshot({path:path.join(OUT,f)});if(GFX==='3d')await ev(()=>{R3D.drawEvery=60});
    R.stops[name]={file:f,note:note||'',...m};return m};
  const safe=async(name,fn)=>{try{await fn()}catch(e){R.fail.push(name+': '+e.message.split('\n')[0])}};
  const vis=id=>ev(i=>{const e=document.getElementById(i);return!!e&&!e.hidden&&getComputedStyle(e).display!=='none'},id);
  const tap=async sel=>{try{await page.tap(sel,{timeout:800})}catch(e){R.fail.push('לא הצלחתי לגעת ב-'+sel+' (מכוסה או מחוץ למסך)');await ev(s=>{const el=document.querySelector(s);if(el)el.click()},sel)}await run(200)};
  const closeAll=()=>ev(()=>{for(let i=0;i<8;i++){const w=(typeof WINS!=='undefined'?WINS:[]).find(w=>typeof uiModal==='function'&&uiModal(w));if(!w)break;w.close()}if(typeof menuClose==='function')menuClose();joy=null});
  const tp=(x,y)=>ev(([x,y])=>{P.x=x;P.y=y;S.cam.x=x;S.cam.y=y;joy=null},[x,y]);
  const now=()=>ev(()=>Date.now());
  // הזמן לפריים: כמה זמן אמיתי לוקחת שנייה של משחק (60 פריימים). בלי כרטיס גרפי זה רק השוואה בין מקומות
  const frame=async where=>{if(GFX==='3d')await ev(()=>{R3D.drawEvery=1});const t=Date.now();await run(1000);const ms=Math.round((Date.now()-t)/60*10)/10;
    if(GFX==='3d')await ev(()=>{R3D.drawEvery=60});(R.metrics.frameMs||(R.metrics.frameMs={}))[where]=ms};

  /* ===== שחקן חדש: מאפס, כמו שניר רואה בפעם הראשונה ===== */
  if(full)await safe('new',async()=>{
    await shot('start','מסך פתיחה');
    await tap('#startBtn');await run(400);
    if(await vis('ovHero')){await shot('hero','בחירת דמות');await tap('#heroCards [data-hero="warrior"]')}
    const tv=await now();await run(300);await shot('village-arrive','כניסה ראשונה לכפר');
    // מה קופץ לבד, ותוך כמה זמן מופיעה מטרה ברורה (המדריך למעלה או קו המעקב)
    const auto=[];let goalAt=null,goalTxt='';
    for(let i=0;i<24;i++){await run(500);
      for(const id of ['ovDaily','ovWelcome','npcDlg','qLog'])if(await vis(id)&&!auto.includes(id)){auto.push(id);await shot('auto-'+id,'נפתח לבד בכפר')}
      if(goalAt==null){const g=await ev(()=>{const e=document.getElementById('guide'),t=document.getElementById('guideTxt');return e&&!e.hidden&&t&&t.textContent.trim()?t.textContent.trim():''});if(g){goalAt=await now();goalTxt=g}}
      if(await vis('ovDaily'))await ev(()=>{const b=document.querySelector('#dailyWin [data-act="take"]')||document.querySelector('#dailyWin [data-act="close"]');if(b)b.click()});
      else if(await vis('npcDlg')){const b=await ev(()=>{const b=document.querySelector('#npcDlg [data-act="accept"],#npcDlg [data-act="take"],#npcDlg .vbtn.go');if(b){b.click();return true}return false});if(!b&&i>8)await closeAll()}
      else if(await vis('ovWelcome'))await closeAll()}
    R.metrics.newPlayer={autoPopups:auto,goalSec:goalAt?Math.round((goalAt-tv)/100)/10:null,goalTxt,activeQuests:await ev(()=>Object.keys(QS().active))};
    await closeAll();await frame('village');
    // ליד תושב, ושיחה
    await safe('npc',async()=>{const a=await ev(()=>NPC.list.smith.at);await tp(a.x+30,a.y);await run(500);await shot('npc-near','ליד הנפח');
      if(await vis('talkBtn')){await tap('#talkBtn');await shot('npc-talk','שיחה עם הנפח');await closeAll()}});
    // לשער ולעולם
    const g=await ev(()=>VILLAGE.gate);await tp(g.x,g.y-10);await run(500);await shot('village-gate','השער');
    await tap('#vEnter');await run(300);
    await ev(()=>{const b=document.querySelector('#vPanel [data-act="world"],#vPanel [data-act="go"],#vPanel .vbtn.go');if(b)b.click()});await run(800);
    if(!await ev(()=>!!S.wd))await ev(()=>{villageUi(false);enterWorld('home')});await run(600);
    const tw=await now();await shot('world-arrive','כניסה לאחו');
    // קרב ראשון: הולכים לאויב הקרוב, ומודדים כמה עד שהוא מת
    const fight=async(maxSec,god)=>{const t0=await now();let k0=await ev(()=>S.kills||0),dmg0=await ev(()=>P.hp);
      for(let i=0;i<maxSec*10;i++){const r=await ev(god=>{if(god)P.hp=P.maxHp;if(S.mode!=='play')return 'mode';const e=enemies.filter(e=>!e.dead&&!e.node&&!e.critter).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
          if(!e)return 'none';const d=Math.hypot(e.x-P.x,e.y-P.y)||1;joy=d>45?{id:-1,ox:-999,oy:-999,dx:(e.x-P.x)/d,dy:(e.y-P.y)/d}:null;return ''},god);
        if(r==='mode'&&await vis('ovLevel'))await ev(()=>{const c=document.querySelector('#cards .card');if(c)c.click()});
        if(await ev(k0=>(S.kills||0)>k0,k0))break;await run(100)}
      await ev(()=>{joy=null});return Math.round((await now()-t0)/100)/10};
    R.metrics.firstKillSec=await fight(40,true);
    await shot('world-fight','קרב ראשון');
    const k=[];for(let i=0;i<5;i++)k.push(await fight(30,true));R.metrics.killSec=k;
    await frame('world');
    // משחק חופשי של 90 שניות: הולך לאויבים ולמקורות, אוסף, ומודדים את השקט הכי ארוך בלי החלטה
    const m0=await now();
    for(let i=0;i<900;i++){await ev(()=>{P.hp=Math.max(P.hp,P.maxHp*0.5);if(S.mode!=='play')return;
        const t=enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
        if(t){const d=Math.hypot(t.x-P.x,t.y-P.y)||1;joy=d>40?{id:-1,ox:-999,oy:-999,dx:(t.x-P.x)/d,dy:(t.y-P.y)/d}:null}else{const a=S.t*0.3;joy={id:-1,ox:-999,oy:-999,dx:Math.cos(a),dy:Math.sin(a)}}});
      if(await vis('ovLevel'))await ev(()=>{const c=document.querySelector('#cards .card');if(c)c.click()});
      if(await vis('ovWDeath'))await ev(()=>{const b=document.getElementById('wRespawn');if(b)b.click()});
      if(i===300)await shot('world-loot','אחרי דקה בעולם: שלל ופיד');
      await run(100)}
    await ev(()=>{joy=null});
    const mm=await ev(t=>window.__m.filter(m=>m.t>=t),m0);const ts=[m0,...mm.filter(m=>m.k!=='banner').map(m=>m.t),m0+90000].sort((a,b)=>a-b);let gap=0;for(let i=1;i<ts.length;i++)gap=Math.max(gap,ts[i]-ts[i-1]);
    R.metrics.freePlay={sec:90,moments:mm.length,byKind:mm.reduce((o,m)=>(o[m.k]=(o[m.k]||0)+1,o),{}),longestQuietSec:Math.round(gap/100)/10,items:mm.filter(m=>m.k==='item').map(m=>m.d)};
    // זמן למות: עומדים ליד אויבים בלי לברוח ובלי ריפוי
    await safe('die',async()=>{await ev(()=>{P.hp=P.maxHp;P.inv=0});const t0=await now();let died=false;
      for(let i=0;i<900&&!died;i++){await ev(()=>{const e=enemies.filter(e=>!e.dead&&!e.node).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
          if(e){const d=Math.hypot(e.x-P.x,e.y-P.y)||1;joy=d>20?{id:-1,ox:-999,oy:-999,dx:(e.x-P.x)/d,dy:(e.y-P.y)/d}:null}});
        died=await vis('ovWDeath')||await ev(()=>P.hp<=0);await run(100)}
      R.metrics.dieSec=died?Math.round((await now()-t0)/100)/10:'>90';
      if(died){await shot('world-death','מוות בעולם');await ev(()=>{const b=document.getElementById('wRespawn');if(b)b.click()});await run(600)}});
    R.metrics.newPlayer.worldSec=Math.round((await now()-tw)/1000);
  });

  /* ===== שחקן מתקדם: שמירה של אמצע המשחק, סיור בכל החלונות, השומר, והזירה ===== */
  await safe('adv',async()=>{
    // דף חדש עם שמירה ריקה, ובה מכינים שחקן של אמצע המשחק לפני "יאללה"
    await ev(()=>{try{localStorage.removeItem(SAVE_STORE.key)}catch(e){}});await page.reload();await run(400);
    if(GFX==='3d'){await ev(()=>{R3D.drawEvery=60});for(let i=0;i<200;i++){if(await ev(()=>R3D.ready||R3D.failed))break;await page.waitForTimeout(50);await run(50)}}
    await ev(()=>{
      SAVE.hero.start='warrior';SAVE.gift=true;Object.assign(SAVE.village,{center:3,forge:2,mill:2,mine:2,market:2,stash:1});
      for(const [r,k] of [['coins',900],['wood',300],['stone',200],['copper',40],['iron',20],['cloth',10],['bone',12],['hide',8],['gem',2]])bagAdd(r,k);
      for(const it of ['oakBow','boneCharm','oakSword'])if(GEAR.items[it])bagAdd(it);
      SAVE.story=SAVE.story||{};SAVE.story.intro=true;SAVE.met={fisher:1,cutter:1,herbal:1};
      const Q=QS();for(const id of ['s1Lanterns','s1Shard','s1Path'])if(QUESTS.list.find(q=>q.id===id)){Q.done[id]=1;delete Q.active[id]}
      const w=QUESTS.list.find(q=>q.id==='s1Warden');if(w)qStart(w);
      saveNow()});
    await tap('#startBtn');await run(400);if(await vis('ovHero'))await ev(()=>{const c=document.querySelector('#heroCards [data-hero="warrior"]');if(c)c.click()});
    await run(1200);await closeAll();await run(200);
    await safe('village',async()=>{await tp(0,50);await run(400);await shot('village','הכפר באמצע המשחק')});
    await safe('forge',async()=>{await ev(()=>{const B=VILLAGE.b.forge;P.x=B.x;P.y=B.y+B.r+20;S.cam.x=P.x;S.cam.y=P.y});await run(500);await tap('#vEnter');await shot('panel-forge','פאנל הנפחייה')});
    await closeAll();
    await safe('menu',async()=>{await tp(0,50);await run(200);await tap('#menuBtn');await run(300);await shot('menu','☰: התפריט נפתח');await closeAll()});
    for(const [t,name,note] of [['gearBtn','gear','ציוד ותרמיל'],['qBtn','quests','יומן קווסטים'],['bookBtn','book','ספר ההרפתקאות'],['setBtn','settings','הגדרות']])
      await safe(name,async()=>{await tp(0,50);await run(200);await ev(id=>menuShow(id),t);await run(250);await shot(name,note);
        if(name==='gear'){await ev(()=>{const e=document.querySelector('#gItems [data-id]');if(e)e.click()});await shot('gear-item','ציוד: פריט נבחר')}
        await closeAll()});
    await safe('npc',async()=>{const a=await ev(()=>NPC.list.head.at);await tp(a.x+30,a.y);await run(500);if(await vis('talkBtn')){await tap('#talkBtn');await shot('npc-head','שיחה עם ראש הכפר')}await closeAll()});
    // העולם: מפה, שומר האבן
    await safe('world',async()=>{await ev(()=>{villageUi(false);enterWorld('home')});await run(800);await closeAll();await shot('world','העולם, שחקן מתקדם');
      await ev(()=>menuShow('wMapBtn'));await run(300);await shot('worldmap','מפת העולם');await closeAll();
      // אל הפנס של האדמה: השומר קם
      const L=await ev(()=>({x:STORY.lanterns.earth.x,y:STORY.lanterns.earth.y}));await tp(L.x-200,L.y+260);
      let up=false;for(let i=0;i<40&&!up;i++){await run(100);up=await ev(()=>!!(S.wd&&S.wd.warden))}
      R.metrics.warden={rose:up};
      if(up){await run(800);await shot('warden','השומר האבן קם');const t0=await now();let dead=false,low=P=>P;let minHp=1;
        for(let i=0;i<1200&&!dead;i++){const r=await ev(()=>{const e=S.wd.warden;if(!e)return{dead:true};const d=Math.hypot(e.x-P.x,e.y-P.y)||1;
            joy=d>70?{id:-1,ox:-999,oy:-999,dx:(e.x-P.x)/d,dy:(e.y-P.y)/d}:d<50?{id:-1,ox:-999,oy:-999,dx:-(e.x-P.x)/d,dy:-(e.y-P.y)/d}:null;
            const hp=P.hp/P.maxHp;if(P.hp<P.maxHp*0.3)P.hp=P.maxHp;return{dead:!!e.dead,hp,whp:e.hp/(e.max||1)}});
          if(r.hp<minHp)minHp=r.hp;dead=r.dead;if(i===150)await shot('warden-fight','קרב בשומר');
          if(await vis('ovLevel'))await ev(()=>{const c=document.querySelector('#cards .card');if(c)c.click()});await run(100)}
        await ev(()=>{joy=null});R.metrics.warden={rose:true,killed:dead,sec:Math.round((await now()-t0)/100)/10,lowestHpPct:Math.round(minHp*100)};
        if(dead){await run(800);await shot('warden-down','השומר נפל')}}});
    await frame('world-adv');
    // הזירה: רק להסתכל ולדווח (של אוראל)
    if(full)await safe('arena',async()=>{await closeAll();await ev(()=>{const G=WR().gates,k=Object.keys(G)[0];wArena(k)});await run(1500);await shot('arena','הזירה (של אוראל)');
      await frame('arena');let lv=false;const t0=await now();
      for(let i=0;i<600&&!lv;i++){await ev(()=>{P.hp=P.maxHp;const a=S.t*0.5;joy={id:-1,ox:-999,oy:-999,dx:Math.cos(a),dy:Math.sin(a)}});lv=await vis('ovLevel');await run(100)}
      R.metrics.arena={firstLevelSec:lv?Math.round((await now()-t0)/100)/10:null};
      if(lv)await shot('arena-level','זירה: בחירת שדרוג');
      const pops=await ev(t=>window.__m.filter(m=>m.t>=t&&(m.k==='banner'||m.k==='choice')).length,t0);R.metrics.arena.popsPerMin=pops;
      await ev(()=>{joy=null})});
  });
  R.metrics.moments=await ev(()=>window.__m.length);
  await ctx.close();
}

// צילום PNG → JPG קטן ברוחב 600, בעזרת הדפדפן עצמו (בלי חבילות נוספות)
async function small(browser){
  const dir=path.join(OUT,'small');fs.mkdirSync(dir,{recursive:true});
  const p=await browser.newPage();
  for(const f of fs.readdirSync(OUT).filter(f=>f.endsWith('.png'))){
    const b64=fs.readFileSync(path.join(OUT,f)).toString('base64');
    const jpg=await p.evaluate(async b=>{const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();const c=document.createElement('canvas');c.width=600;c.height=Math.round(i.height*600/i.width);
      c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.72).split(',')[1]},b64);
    fs.writeFileSync(path.join(dir,f.replace(/\.png$/,'.jpg')),Buffer.from(jpg,'base64'))}
  await p.close();
}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});for(const f of fs.readdirSync(OUT))if(f.endsWith('.png'))fs.unlinkSync(path.join(OUT,f));
  const browser=await chromium.launch({args:GFX==='3d'?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
  const report={day:DAY,gfx:GFX,views:VIEWS};
  for(const v of Object.keys(VIEWS))for(const l of LANGS){const k=v+'-'+l;if(opt('only')&&opt('only')!==k)continue;
    const t=Date.now();process.stdout.write(k+'... ');await combo(browser,v,l,report);console.log(Math.round((Date.now()-t)/1000)+'s')}
  await small(browser);await browser.close();
  fs.writeFileSync(path.join(OUT,'metrics.json'),JSON.stringify(report,null,1));
  for(const k in report){const R=report[k];if(!R||!R.stops)continue;console.log('\n=== '+k+' ===');
    for(const s in R.stops){const m=R.stops[s];console.log(s.padEnd(15),'ממשק',String(m.uiPct).padStart(3)+'%','| כפתורים',String(m.buttons).padStart(2),'| קטנים',m.small.length,'| חופפים',m.overlap.length,
      '| חתוך',m.clipped.length,'| גולל',m.scrollWins.length,'| זעיר',m.tiny.length,'| טקסט על טקסט',m.textOverlap.length)}
    console.log('מדדים:',JSON.stringify(R.metrics));if(R.fail.length)console.log('לא הצליח:',R.fail);if(R.errors.length)console.log('שגיאות:',[...new Set(R.errors)].slice(0,5))}
  console.log('\nהפלט: '+OUT);
})();
