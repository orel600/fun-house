/* בדיקת חוויה מסך-מסך (משימה "בדיקת חוויה", roadmap.md, 1.11.2026). לא חלק מהמשחק ולא מהבדיקה הרגילה.
   עובר כמו שחקן חדש על כל מסך וחלון בכפר ובעולם, בטלפון שוכב (844×390) ועומד (412×915), בדו-ממד, מצלם ומודד:
   - כפתורים קטנים מ-44px, כפתורים שחופפים או מכוסים, חלון שיוצא מהמסך, טקסט שנחתך, טקסט קטן מ-11px, כמה כפתורים במסך
   - כמה לחיצות וכמה שניות מהכפר עד קרב ראשון ועד הזירה
   - כמה חלונות והודעות קופצים לבד בחמש הדקות הראשונות
   הרצה: node tools/ux-audit.js            (כ-2 דקות)
   אפשרויות: --out <תיקייה>   איפה לשים את הצילומים והדוח (ברירת מחדל tools/ux-shots)
             --only land|port   רק כיוון אחד
   הפלט: <out>/report.json והצילומים. הסיכום הכתוב: docs/ux-audit.md */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1]};
const OUT=path.resolve(opt('out')||path.join(__dirname,'ux-shots'));
const VIEWS={land:{width:844,height:390},port:{width:412,height:915}};
const MIN=44;   // מטרת לחיצה מינימלית (Apple 44pt, Google 48dp; docs/ui-guide.md אומר 48)

/* ---- המדידה, רצה בתוך הדף ---- */
function measure(){
  const vw=innerWidth,vh=innerHeight;
  const vis=el=>{if(!el.isConnected)return false;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return false;
    for(let e=el;e&&e!==document.documentElement;e=e.parentElement){const s=getComputedStyle(e);if(e.hidden||s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false}return true};
  const name=el=>(el.id?'#'+el.id:'')+(el.dataset.act?'[act='+el.dataset.act+']':'')+' '+((el.innerText||el.getAttribute('aria-label')||el.title||'').replace(/\s+/g,' ').trim().slice(0,28));
  const sel='button,a[href],input,select,[role=button],[data-act],[data-id],[data-slot],[data-tab],[data-hero]';
  let clk=[...document.querySelectorAll(sel)].filter(vis);
  clk=clk.filter(e=>!clk.some(o=>o!==e&&o.contains(e)&&o.matches('button')));   // כפתור בתוך כפתור נספר פעם אחת
  // רק מה שבאמת אפשר ללחוץ עליו עכשיו: בתוך המסך (או בתוך אזור גלילה), ולא מוסתר מאחורי חלון
  const inScroll=e=>{for(let p=e.parentElement;p;p=p.parentElement){const s=getComputedStyle(p);if(/(auto|scroll)/.test(s.overflowY+s.overflowX)&&(p.scrollHeight>p.clientHeight+2||p.scrollWidth>p.clientWidth+2))return p}return null};
  const R=e=>{const r=e.getBoundingClientRect();return{x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}};
  const out={vw,vh,buttons:0,small:[],covered:[],overlap:[],offscreen:[],winOut:[],clipped:[],tiny:[],textOverlap:[],scrollWins:[],bottom24:[]};
  const live=[];
  for(const e of clk){const r=e.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const sc=inScroll(e);
    if(r.right<1||r.bottom<1||r.left>vw-1||r.top>vh-1){if(!sc)out.offscreen.push(name(e)+' @'+JSON.stringify(R(e)));continue}
    if(sc){const pr=sc.getBoundingClientRect();if(cy<pr.top||cy>pr.bottom||cx<pr.left||cx>pr.right)continue}   // גלול החוצה: לא נחשב
    const top=document.elementFromPoint(Math.min(vw-1,Math.max(0,cx)),Math.min(vh-1,Math.max(0,cy)));
    if(top&&top!==e&&!e.contains(top)&&!top.contains(e)){out.covered.push(name(e)+' ← מתחת ל-'+name(top.closest(sel)||top));continue}
    live.push(e);
    if(r.width<43.5||r.height<43.5)out.small.push(name(e)+' '+Math.round(r.width)+'×'+Math.round(r.height));
    if(r.bottom>vh-24&&r.top<vh-24)out.bottom24.push(name(e));
  }
  out.buttons=live.length;
  for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i].getBoundingClientRect(),b=live[j].getBoundingClientRect();
    const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left),iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(ix>2&&iy>2)out.overlap.push(name(live[i])+' ✕ '+name(live[j]))}
  // חלונות: יוצאים מהמסך? גוללים כולם?
  for(const w of document.querySelectorAll('.win,.panel,.ov>.panel,.ov>div')){if(!vis(w))continue;const r=w.getBoundingClientRect();
    if(r.left<-2||r.top<-2||r.right>vw+2||r.bottom>vh+2)out.winOut.push((w.id||w.className.split(' ')[0])+' '+JSON.stringify(R(w)));
    const s=getComputedStyle(w);if(/(auto|scroll)/.test(s.overflowY)&&w.scrollHeight>w.clientHeight+4)out.scrollWins.push((w.id||w.className.split(' ')[0])+' גולל '+w.scrollHeight+'/'+w.clientHeight)}
  // טקסט: עלים עם טקסט ישיר
  const leaves=[...document.querySelectorAll('body *')].filter(e=>!/^(SCRIPT|STYLE|CANVAS|SVG|PATH)$/i.test(e.tagName)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&vis(e));
  for(const e of leaves){const s=getComputedStyle(e),fs=parseFloat(s.fontSize),r=e.getBoundingClientRect(),t=e.textContent.replace(/\s+/g,' ').trim().slice(0,30);
    if(r.bottom<0||r.top>vh||r.right<0||r.left>vw)continue;
    if(fs<11)out.tiny.push(t+' ('+fs+'px)');
    const hid=/(hidden|clip)/.test(s.overflowX+s.overflowY)||s.textOverflow==='ellipsis';
    if(hid&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+3))out.clipped.push(t+' ('+e.scrollWidth+'×'+e.scrollHeight+' בתוך '+e.clientWidth+'×'+e.clientHeight+')');
    // טקסט שיוצא מהקופסה של ההורה שחותך אותו
    const p=e.parentElement;if(p&&!hid){const ps=getComputedStyle(p);if(/(hidden|clip)/.test(ps.overflowX+ps.overflowY)){const pr=p.getBoundingClientRect();
      if(r.right>pr.right+3||r.left<pr.left-3||r.bottom>pr.bottom+3)out.clipped.push(t+' (יוצא מההורה)')}}
  }
  const tl=leaves.filter(e=>{const r=e.getBoundingClientRect();return r.width>4&&r.height>4&&r.bottom>0&&r.top<vh});
  for(let i=0;i<tl.length&&out.textOverlap.length<12;i++)for(let j=i+1;j<tl.length;j++){const A=tl[i],B=tl[j];if(A.contains(B)||B.contains(A))continue;
    const a=A.getBoundingClientRect(),b=B.getBoundingClientRect(),ix=Math.min(a.right,b.right)-Math.max(a.left,b.left),iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(ix>4&&iy>4&&getComputedStyle(A).position!=='absolute'||ix>6&&iy>6)if(ix>4&&iy>4)out.textOverlap.push(A.textContent.trim().slice(0,18)+' ✕ '+B.textContent.trim().slice(0,18))}
  for(const k in out)if(Array.isArray(out[k]))out[k]=[...new Set(out[k])];
  return out;
}

/* ---- יומן קפיצות: כל חלון שנפתח וכל הודעה, ואם לחצנו משהו רגע לפני ---- */
function watchPops(){
  window.__tap=-1e9;window.__pops=[];
  const ids=['ovHero','ovLevel','ovBoss','ovOver','ovDaily','ovVisit','ovEnd','ovGear','ovForge','ovWDeath','npcDlg','qLog','bookWin','wMap','vPanel','wPanel','ovHelp','ovSound'];
  const was={};
  const tick=()=>{for(const id of ids){const e=document.getElementById(id);if(!e)continue;const on=!e.hidden&&getComputedStyle(e).display!=='none';
      if(on&&!was[id])window.__pops.push({t:Date.now(),id,user:Date.now()-window.__tap<600,where:(typeof S!=='undefined'&&S?(S.vil?'village':S.wd?'world':S.mode):'start'),
        txt:(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,70)});was[id]=on}
    const b=document.getElementById('banner');if(b){const t=b.textContent.trim();if(t&&t!==was.__b)window.__pops.push({t:Date.now(),id:'banner',user:false,where:(typeof S!=='undefined'&&S?(S.vil?'village':S.wd?'world':S.mode):'start'),txt:t.slice(0,70)});was.__b=t}};
  addEventListener('load',()=>{new MutationObserver(tick).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','class','style'],childList:true,characterData:true})});
}

async function session(view,key,report){
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:view,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.addInitScript(watchPops);
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.clock.runFor(400);
  const R=report[key]={screens:{},flow:{},pops:[],errors};R.t0=await page.evaluate(()=>Date.now());
  const run=ms=>page.clock.runFor(ms);
  let n=0;
  const shot=async(name,note)=>{await run(120);const m=await page.evaluate(measure);R.screens[name]={...m,note:note||''};
    await page.screenshot({path:path.join(OUT,key+'-'+String(++n).padStart(2,'0')+'-'+name+'.png')});return m};
  // לחיצה אמיתית במקום של הכפתור. אם משהו מכסה אותו או שהוא מחוץ למסך, נרשם, ולוחצים בקוד כדי להמשיך
  let taps=0;const missed=[];
  const tap=async(sel,why)=>{taps++;await page.evaluate(()=>{window.__tap=Date.now()});
    try{await page.tap(sel,{timeout:800})}catch(e){missed.push(why||sel);await page.evaluate(s=>{const el=document.querySelector(s);if(el)el.click()},sel)}
    await run(150)};
  const vis=id=>page.evaluate(i=>{const e=document.getElementById(i);return!!e&&!e.hidden&&getComputedStyle(e).display!=='none'},id);
  // הליכה עם הג'ויסטיק, כמו אגודל. מחזיר כמה שניות משחק לקח
  const walk=async(x,y,stop=30,max=90)=>{const t0=await page.evaluate(()=>Date.now());
    for(let i=0;i<max*10;i++){const d=await page.evaluate(([x,y,stop])=>{if(S.mode!=='play')return -1;const d=Math.hypot(x-P.x,y-P.y);
        joy=d>stop?{id:-1,ox:-999,oy:-999,dx:(x-P.x)/d,dy:(y-P.y)/d}:null;return d},[x,y,stop]);
      if(d===-1){await page.evaluate(()=>{joy=null});return{blocked:true,t:await page.evaluate(t=>(Date.now()-t)/1000,t0)}}
      if(d<=stop)break;await run(100)}
    await page.evaluate(()=>{joy=null});const t=await page.evaluate(t0=>Math.round((Date.now()-t0)/100)/10,t0);return{t}};
  const tp=(x,y)=>page.evaluate(([x,y])=>{P.x=x;P.y=y;S.cam.x=x;S.cam.y=y},[x,y]);
  const safe=async(name,fn)=>{try{await fn()}catch(e){(R.fail||(R.fail=[])).push(name+': '+e.message.split('\n')[0])}};

  /* ---- 1. פתיחה ---- */
  await safe('start',async()=>{await shot('start','מסך פתיחה');await tap('#helpBtn');await shot('help','איך משחקים');await tap('#helpClose')});
  /* ---- 2. בחירת דמות ---- */
  await tap('#startBtn','יאללה');
  await safe('hero',async()=>{await shot('hero','בחירת דמות');await tap('#heroCards [data-hero="warrior"]','לוחם')});
  /* ---- 3. הכפר, כמו שחקן חדש: מה קופץ לבד ---- */
  const F=R.flow;F.tapsToVillage=taps;
  await run(300);await shot('village-arrive','כניסה ראשונה לכפר');
  // מחכים כמו שחקן שמסתכל: מה נפתח לבד בעשר השניות הראשונות
  const seen=[];for(let i=0;i<20;i++){await run(500);for(const id of ['ovDaily','npcDlg','qLog'])if(await vis(id)&&!seen.includes(id)){seen.push(id);await shot('auto-'+id,'נפתח לבד בכפר')}
    if(await vis('ovDaily')){await tap('#dailyWin [data-act="take"]','לקחת מתנה');await run(300);if(await vis('ovDaily'))await tap('#dailyWin [data-act="close"]','סגירת מתנה')}
    else if(await vis('npcDlg')&&i>6)await tap('#npcDlg [data-act="close"]','סגירת שיחה')}
  F.autoInVillage=seen;
  /* ---- 4. מהכפר לקרב ראשון ולזירה ---- */
  const t0=taps;F.vt0=await page.evaluate(()=>Date.now());
  const g=await page.evaluate(()=>VILLAGE.gate);
  F.walkToGate=await walk(g.x,g.y-10,20);
  await run(300);await shot('gate','השער: כפתור "לעולם" בסרגל');
  await tap('#vEnter','יציאה בשער');
  await run(600);F.inWorld=await page.evaluate(()=>!!S.wd);
  await shot('world-arrive','כניסה לעולם');
  // אל האויב הקרוב, עד שהוא נפגע
  const tw0=await page.evaluate(()=>Date.now());let hit=false;
  for(let i=0;i<600&&!hit;i++){hit=await page.evaluate(()=>{P.hp=P.maxHp;const e=enemies.filter(e=>!e.dead&&!e.node).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
      if(!e)return false;if(e.hp<(e.max||e.hp)||S.kills>0)return true;const d=Math.hypot(e.x-P.x,e.y-P.y)||1;joy=d>40?{id:-1,ox:-999,oy:-999,dx:(e.x-P.x)/d,dy:(e.y-P.y)/d}:null;return false});
    if(await page.evaluate(()=>S.mode!=='play'))break;await run(100)}
  await page.evaluate(()=>{joy=null});
  F.firstFight={taps:taps-t0,sec:Math.round(await page.evaluate(t=>(Date.now()-t)/100,tw0))/10,hit};
  await shot('world-fight','קרב ראשון בעולם');
  // אל שער הזירה הקרוב
  const ga=await page.evaluate(()=>{const G=WR().gates;let b=null;for(const k in G){const d=Math.hypot(G[k].x-P.x,G[k].y-P.y);if(!b||d<b.d)b={k,d,x:G[k].x,y:G[k].y}}return b});
  if(ga){F.walkToArena=await walk(ga.x,ga.y-10,20,120);await run(300);await shot('arena-gate','שער לזירה');
    await tap('#wPanel [data-act="arena"]','כניסה לזירה');await run(800);
    F.arena={taps:taps-t0,sec:Math.round(await page.evaluate(t=>(Date.now()-t)/100,F.vt0))/10,ok:await page.evaluate(()=>!S.wd&&!S.vil&&S.mode==='play')};
    await shot('arena','הזירה (רק המעבר, הזירה של אוראל)');}
  /* ---- 5. עד חמש דקות משחק: מה עוד קופץ לבד. בזירה בוחרים את הכרטיס הראשון בכל רמה ---- */
  if(key==='land'){
    for(let i=0;i<1400;i++){const st=await page.evaluate(()=>({t:Date.now(),lv:!document.getElementById('ovLevel').hidden,boss:!document.getElementById('ovBoss').hidden,over:S.mode==='over'}));
      if(st.t-R.t0>300000)break;
      if(st.lv){await tap('#cards .card','כרטיס שדרוג');continue}
      if(st.boss){await tap('#fightBtn','קרב בבוס');continue}
      if(st.over)break;
      await page.evaluate(()=>{P.hp=P.maxHp;const a=S.t*0.5;joy={id:-1,ox:-999,oy:-999,dx:Math.cos(a),dy:Math.sin(a)}});await run(200)}}
  R.pops=await page.evaluate(()=>window.__pops);
  F.taps=taps;F.missed=missed;
  await browser.close();

  /* ---- 6. סיור בכל החלונות, עם שמירה של שחקן באמצע הדרך (מבנים בנויים, ציוד, קווסטים) ---- */
  const b2=await chromium.launch();
  const p2=await b2.newPage({viewport:view,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  p2.on('pageerror',e=>errors.push(e.message));
  await p2.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await p2.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
  await p2.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await p2.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await p2.clock.runFor(400);
  const page2=p2;const r2=ms=>p2.clock.runFor(ms);
  const shot2=async(name,note)=>{await r2(150);const m=await p2.evaluate(measure);R.screens[name]={...m,note:note||''};
    await p2.screenshot({path:path.join(OUT,key+'-'+String(++n).padStart(2,'0')+'-'+name+'.png')});return m};
  const tap2=async sel=>{try{await p2.tap(sel,{timeout:800})}catch(e){missed.push('סיור: '+sel);await p2.evaluate(s=>{const el=document.querySelector(s);if(el)el.click()},sel)}await r2(200)};
  const safe2=async(name,fn)=>{try{await fn()}catch(e){(R.fail||(R.fail=[])).push(name+': '+e.message.split('\n')[0])}};
  const tp2=(x,y)=>p2.evaluate(([x,y])=>{P.x=x;P.y=y;S.cam.x=x;S.cam.y=y;joy=null},[x,y]);
  await p2.evaluate(()=>{SAVE.hero.start='warrior';SAVE.gift=true;Object.assign(SAVE.village,{center:2,forge:2,mill:2,mine:2,market:2,stash:1});
    for(const [r,k] of [['coins',800],['wood',300],['stone',200],['copper',40],['iron',20],['cloth',10],['bone',12],['hide',8],['gem',2],['minnow',3],['perch',2]])bagAdd(r,k);
    for(const it of ['oakBow','boneCharm','oakSword'])if(GEAR.items[it])bagAdd(it);
    SAVE.story=SAVE.story||{};SAVE.story.intro=true;SAVE.met={fisher:1,cutter:1,herbal:1};
    const D=SAVE.daily||(SAVE.daily={});saveNow()});
  await tap2('#startBtn');await r2(1200);
  if(await p2.evaluate(()=>!document.getElementById('ovDaily').hidden)){await shot2('daily','מתנה יומית');await tap2('#dailyWin [data-act="close"]')}
  const near=async(k,name,note)=>{await p2.evaluate(k=>{const B=VILLAGE.b[k];P.x=B.x;P.y=B.y+B.r+20;S.cam.x=P.x;S.cam.y=P.y;joy=null},k);await r2(400);await tap2('#vEnter');await r2(200);return shot2(name,note)};
  await safe2('village',async()=>{await tp2(0,50);await r2(300);await shot2('village','הכפר באמצע המשחק')});
  await safe2('mill',()=>near('mill','panel-mill','פאנל מנסרה'));
  await safe2('forge',async()=>{await near('forge','panel-forge','פאנל נפחייה (חלון גדול)');await tap2('#vPanel [data-act="forge"]');await shot2('forge','הנפחייה: Aging');
    await p2.evaluate(()=>{const e=document.querySelector('#fItems [data-slot="weapon"],#fItems button');if(e)e.click()});await shot2('forge-item','הנפחייה: פריט נבחר');
    await tap2('#forgeClose')});
  await safe2('market',async()=>{await near('market','panel-market','פאנל שוק');await tap2('#vPanel [data-act="trade"]');await shot2('market','חלון המסחר');await tap2('#vPanel [data-act="close"]')});
  await safe2('stash',()=>near('stash','panel-stash','מחסן'));
  await safe2('gear',async()=>{await tp2(0,50);await r2(300);await tap2('#gearBtn');await shot2('gear','ציוד ותרמיל');
    await p2.evaluate(()=>{const e=document.querySelector('#gItems [data-id]');if(e)e.click()});await shot2('gear-item','ציוד: פריט נבחר');await tap2('#gearClose')});
  await safe2('quests',async()=>{await tap2('#qBtn');await shot2('quests','יומן קווסטים');await tap2('#qLog [data-act="close"]')});
  await safe2('book',async()=>{await tap2('#bookBtn');await shot2('book','ספר ההרפתקאות');await tap2('#bookWin [data-act="close"]')});
  await safe2('npc',async()=>{const a=await p2.evaluate(()=>{const n=(S.vil.npcs||[]).find?.(n=>n.id==='smith');return n?{x:n.x,y:n.y}:NPC.list.smith.at});await tp2(a.x+30,a.y);await r2(400);
    await shot2('npc-near','ליד תושב: כפתור לדבר');await tap2('#talkBtn');await shot2('npc-talk','שיחה עם הנפח');await tap2('#npcDlg [data-act="close"]')});
  await safe2('visit',async()=>{await tp2(0,50);await p2.evaluate(async()=>{const F=CLOUD.fake=cloudFakeServer();await cloudSync();F.google.u1='Nir';CLOUD.session.name='Nir';await visitPublish();
      F.google.u2='Orel';F.profiles.u2={user_id:'u2',name:'Orel',level:7,data:{village:{center:3,forge:2,mill:1},start:'warrior',pet:'piocho'}};visitBtn()});
    await r2(200);await tap2('#visBtn');for(let i=0;i<20;i++){await r2(100)}await shot2('visit','ביקור אצל חבר');await p2.evaluate(()=>visitClose())});
  // העולם
  await safe2('world',async()=>{await p2.evaluate(()=>{villageUi(false);enterWorld('home')});await r2(600);await shot2('world','העולם הפתוח');
    await tap2('#wMapBtn');await shot2('worldmap','מפת העולם');await tap2('#wMap [data-act="close"]');
    const f=await p2.evaluate(()=>WNPC.list.fisher.at);await tp2(f.x+40,f.y);await r2(500);await shot2('wnpc-near','ליד הדייג');
    if(await p2.evaluate(()=>!document.getElementById('talkBtn').hidden)){await tap2('#talkBtn');await shot2('wnpc-talk','שיחה עם הדייג');await tap2('#npcDlg [data-act="close"]')}
    // הדיג: ליד הבריכה
    await p2.evaluate(()=>{const F=WNPC.list.fisher;P.x=F.at.x+F.pond.dx-F.pond.rx-30;P.y=F.at.y+F.pond.dy;S.cam.x=P.x;S.cam.y=P.y});await r2(500);
    if(await p2.evaluate(()=>!document.getElementById('fishBtn').hidden)){await tap2('#fishBtn');await r2(4500);await shot2('fishing','דיג: מחכים או נשיכה');
      for(let i=0;i<10;i++){await r2(300);if(await p2.evaluate(()=>S.wd.fish&&S.wd.fish.st==='reel'))break}await shot2('fishing-reel','דיג: המחוג')}
    else(R.fail||(R.fail=[])).push('דיג: כפתור לא הופיע ליד הבריכה');
    const gt=await p2.evaluate(()=>WR().gates.grove);await tp2(gt.x,gt.y-10);await r2(500);await shot2('world-gate','שער זירה בעולם');
  });
  await b2.close();
}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});for(const f of fs.readdirSync(OUT))if(f.endsWith('.png'))fs.unlinkSync(path.join(OUT,f));
  const report={};
  for(const k of Object.keys(VIEWS)){if(opt('only')&&opt('only')!==k)continue;await session(VIEWS[k],k,report)}
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,1));
  // סיכום קצר למסוף
  for(const k of Object.keys(VIEWS)){const R=report[k];if(!R||!R.screens)continue;console.log('\n=== '+k+' ===');
    for(const s in R.screens){const m=R.screens[s];console.log(s.padEnd(16),'כפתורים',String(m.buttons).padStart(2),'| קטנים',m.small.length,'| מכוסים',m.covered.length,'| חופפים',m.overlap.length,
      '| יוצא',m.winOut.length,'| נחתך',m.clipped.length,'| זעיר',m.tiny.length)}
    console.log('זרימה:',JSON.stringify(R.flow));if(R.fail)console.log('נכשל:',R.fail);if(R.errors.length)console.log('שגיאות:',R.errors.slice(0,5))}
  const P=(report.land||{}).pops||[];console.log('\nקפיצות (לרוחב):',P.filter(p=>!p.user).length,'בלי לחיצה מתוך',P.length);
})();
