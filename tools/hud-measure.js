/* מדידת פרופורציות של הממשק (משימת תכנון "סידור המסך", docs/plan-hud.md, 1.11.2026). לא חלק מהמשחק ולא מהבדיקה הרגילה.
   מריץ את המשחק בטלפון שוכב, מעמיד אותו במצבים קבועים (כפר, עולם רגוע, קרב, שיחה, תפריט, זירה), ומודד כל אלמנט על המסך:
   - אלמנטים של HTML (כפתורים, פסים, חלונות): כמה אחוז מגובה המסך, מהרוחב ומהשטח
   - טקסט שמצויר על הקנבס (מספרי נזק, "ציוד!", שמות אויבים, שלל על הרצפה): גודל אמיתי בפיקסלים על המסך, וכמה אחוז מהגובה
   הרצה:      node tools/hud-measure.js                (כדקה, בדו-ממד)
   אפשרויות:  --gfx 3d       בתלת-ממד (איטי יותר, לצילומים יפים)
              --out <תיקייה> ברירת מחדל tools/hud-shots (לא נכנס לריפו)
              --lang en|he   ברירת מחדל en, כי ניר משחק באנגלית
   הפלט: <out>/hud.json, צילום לכל מצב, וטבלה במסוף. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1]};
const OUT=path.resolve(opt('out')||path.join(__dirname,'hud-shots'));
const GFX=opt('gfx')||'2d',LNG=opt('lang')||'en';
// 844×390: אייפון שוכב. 1280×590: היחס של הטלפון של ניר (כ-2000×918)
const VIEWS={s:{width:844,height:390},n:{width:1280,height:590}};
// מה גדול מדי: הכלל המוצע ב-docs/plan-hud.md (באחוזים מגובה המסך)
const LIMIT={button:16,pill:9,text:5.5,bar:3.5,window:85};

/* ---- רץ בתוך הדף: כל אלמנט HTML שנראה ---- */
function measureDom(){
  const vw=innerWidth,vh=innerHeight,out=[];
  const vis=el=>{const r=el.getBoundingClientRect();if(r.width<2||r.height<2||r.right<0||r.bottom<0||r.left>vw||r.top>vh)return false;
    for(let e=el;e&&e!==document.documentElement;e=e.parentElement){const s=getComputedStyle(e);if(e.hidden||s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false}return true};
  const lbl=e=>(e.id?'#'+e.id:'.'+(e.className&&e.className.baseVal===undefined?String(e.className).split(' ')[0]:e.tagName.toLowerCase()))+' '+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,34);
  const kind=e=>{const c=String(e.className||'');
    if(/\b(win|panel)\b/.test(c)||/^(npcDlg|qLog|bookWin|wPanel|vPanel|dailyWin|wMap)$/.test(e.id))return'window';
    if(/\bres\b/.test(c))return'pill';
    if(/^(hp|xp|runbar|bossbar)$/.test(e.id)||/bar/.test(c)&&e.getBoundingClientRect().height<30)return'bar';
    if(e.matches('button,[role=button]'))return'button';
    return'block'};
  // רק "קופסאות" של ממשק: אלמנט fixed/absolute, או כפתור, או גלולת משאב. בלי קנבס ובלי שכבות שקופות במסך מלא
  for(const e of document.querySelectorAll('body *')){
    if(/^(CANVAS|SCRIPT|STYLE|svg|path|IMG|B|I|SPAN|SMALL)$/.test(e.tagName)&&!/\bres\b/.test(e.className))continue;
    if(!vis(e))continue;const s=getComputedStyle(e),k=kind(e);
    const box=s.position==='fixed'||s.position==='absolute';
    if(!(box||k==='button'||k==='pill'||k==='window'))continue;
    const r=e.getBoundingClientRect();
    if(r.width>=vw*0.98&&r.height>=vh*0.98&&k!=='window')continue;   // שכבת רקע
    const fs=parseFloat(s.fontSize);
    out.push({el:lbl(e),kind:k,x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height),
      hPct:+(r.height/vh*100).toFixed(1),wPct:+(r.width/vw*100).toFixed(1),aPct:+(r.width*r.height/(vw*vh)*100).toFixed(1),font:fs,
      scroll:/(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+4?Math.round(e.scrollHeight/e.clientHeight*10)/10:0});
  }
  // כפתור בתוך כפתור, או קופסה בתוך קופסה בדיוק באותו גודל: פעם אחת
  return out.filter((a,i)=>!out.some((b,j)=>j<i&&b.x===a.x&&b.y===a.y&&b.w===a.w&&b.h===a.h));
}
/* ---- רץ בתוך הדף לפני הטעינה: רושם כל טקסט שמצויר על הקנבס, בגודל האמיתי שלו על המסך ---- */
function hookCanvas(){
  window.__ctext=[];window.__ctOn=false;
  const P=CanvasRenderingContext2D.prototype,f=P.fillText,st=P.strokeText;
  const rec=function(t,x,y){if(!window.__ctOn||!this.canvas||this.canvas.id!=='c')return;
    const m=this.getTransform(),sc=Math.hypot(m.a,m.b)/(window.devicePixelRatio||1),px=parseFloat((this.font.match(/([\d.]+)px/)||[])[1])||0;
    const sx=(m.a*x+m.c*y+m.e)/(window.devicePixelRatio||1),sy=(m.b*x+m.d*y+m.f)/(window.devicePixelRatio||1);
    window.__ctext.push({t:String(t).slice(0,30),px:Math.round(px*sc*10)/10,x:Math.round(sx),y:Math.round(sy),a:+this.globalAlpha.toFixed(2)})};
  P.fillText=function(t,x,y,...r){rec.call(this,t,x,y);return f.call(this,t,x,y,...r)};
  P.strokeText=function(t,x,y,...r){return st.call(this,t,x,y,...r)};
}

async function session(view,key,report){
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:view,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await page.clock.install({time:new Date('2026-11-01T10:00:00').getTime()});
  await page.addInitScript(([g,l])=>{try{localStorage.setItem('zm-gfx',g);localStorage.setItem('zm-lang',l)}catch(e){}},[GFX,LNG]);
  await page.addInitScript(hookCanvas);
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.clock.runFor(400);
  const run=ms=>page.clock.runFor(ms);
  const R=report[key]={view,scenes:{},errors};
  // שמירה של שחקן באמצע הדרך: מבנים, ציוד, גזר לפיוחו, ההקדמה כבר נעשתה
  await page.evaluate(lng=>{if(typeof setLang==='function'&&LANG!==lng)setLang(lng);
    SAVE.hero.start='warrior';SAVE.gift=true;Object.assign(SAVE.village,{center:2,forge:2,mill:2,mine:2,market:2,stash:1});
    for(const [r,k] of [['coins',1840],['wood',320],['stone',210],['copper',40],['iron',20],['carrot',3],['gem',2]])bagAdd(r,k);
    for(const it of ['oakBow','oakSword'])if(GEAR.items[it])bagAdd(it);
    SAVE.story=SAVE.story||{};SAVE.story.intro=true;SAVE.met={fisher:1,cutter:1,herbal:1};saveNow()},LNG);
  await page.tap('#startBtn').catch(()=>page.evaluate(()=>document.getElementById('startBtn').click()));await run(1500);
  // חלונות שקופצים לבד בכניסה: סוגרים
  const closeAll=()=>page.evaluate(()=>{if(typeof welcomeClose==='function'&&!document.getElementById('ovWelcome').hidden)welcomeClose();for(const s of ['#dailyWin [data-act="close"]','#npcDlg [data-act="close"]','#qLog [data-act="close"]'])
    {const b=document.querySelector(s);if(b&&b.offsetParent)b.click()}});
  await closeAll();await run(300);await closeAll();
  let n=0;
  const scene=async(name,note)=>{
    await run(80);await page.evaluate(()=>{window.__ctext=[];window.__ctOn=true});await run(40);
    const dom=await page.evaluate(measureDom);const ct=await page.evaluate(()=>{window.__ctOn=false;return window.__ctext});
    // טקסט קנבס: אותו טקסט באותו מקום נספר פעם אחת, רק מה שנראה
    const seen=new Set(),canvas=[];for(const c of ct){if(c.a<0.15||c.x<0||c.y<0||c.x>view.width||c.y>view.height)continue;const k=c.t+'|'+Math.round(c.x/8)+'|'+Math.round(c.y/8);if(seen.has(k))continue;seen.add(k);
      canvas.push({...c,hPct:+(c.px/view.height*100).toFixed(1)})}
    const big=dom.filter(d=>LIMIT[d.kind]&&d.hPct>LIMIT[d.kind]).map(d=>d.el+' '+d.hPct+'%'),bigTxt=canvas.filter(c=>c.hPct>LIMIT.text).map(c=>'"'+c.t+'" '+c.px+'px');
    R.scenes[name]={note,dom,canvas,big,bigTxt,hudArea:+dom.filter(d=>d.kind!=='window').reduce((s,d)=>s+d.aPct,0).toFixed(1)};
    await page.screenshot({path:path.join(OUT,key+'-'+String(++n).padStart(2,'0')+'-'+name+'.png')});
  };
  const tp=(x,y)=>page.evaluate(([x,y])=>{P.x=x;P.y=y;S.cam.x=x;S.cam.y=y;joy=null},[x,y]);
  const safe=async(name,fn)=>{try{await fn()}catch(e){(R.fail||(R.fail=[])).push(name+': '+e.message.split('\n')[0])}};
  const petNear=()=>page.evaluate(()=>{if(S.pet){S.pet.x=P.x+30;S.pet.y=P.y+10;S.pet.st='idle';S.pet.feedCd=0}});

  await safe('village',async()=>{await tp(0,60);await petNear();await run(500);await scene('village','הכפר, פיוחו ליד: כפתור גזר')});
  await safe('npc',async()=>{const a=await page.evaluate(()=>NPC.list.smith.at);await tp(a.x+30,a.y);await run(500);
    await scene('village-npc','ליד הנפח: כפתור לדבר');await page.evaluate(()=>document.getElementById('talkBtn').click());await run(300);
    await scene('dialog','שיחה עם הנפח');await closeAll();await run(200)});
  await safe('menu',async()=>{await page.evaluate(()=>document.getElementById('menuBtn').click());await run(300);await scene('menu','התפריט ☰');
    await page.evaluate(()=>menuClose());await run(200)});
  await safe('world',async()=>{await page.evaluate(()=>{villageUi(false);enterWorld('home')});await run(900);
    await page.evaluate(()=>{const g=WR().home;P.x=g.x;P.y=g.y+g.r+8;S.cam.x=P.x;S.cam.y=P.y;joy=null});await petNear();await run(400);
    await scene('world-home','העולם ליד הבית: בועה וכפתור עגול, בלי חלון');
    await page.evaluate(()=>{const g=document.getElementById('wGo');if(g&&!g.hidden)g.click()});await run(200);await scene('world-gate-card','הכרטיס של השער אחרי לחיצה')});
  await safe('fight',async()=>{
    await page.evaluate(()=>{const g=WR().gates.grove||Object.values(WR().gates)[0];P.x=g.x+160;P.y=g.y+120;S.cam.x=P.x;S.cam.y=P.y;joy=null});await run(400);
    await page.evaluate(()=>{P.hp=P.maxHp*0.62;
      const es=enemies.filter(e=>!e.dead&&!e.node&&!e.creature).slice(0,5);es.forEach((e,i)=>{const a=i*1.25;e.x=P.x+Math.cos(a)*(80+i*12);e.y=P.y+Math.sin(a)*(60+i*10)});
      if(es[0])affixSet(es[0],'fast');if(es[1])affixSet(es[1],'armored');
      if(typeof dropSpawn==='function'){dropSpawn('coins',12,P.x-50,P.y+30);dropSpawn('wood',3,P.x-30,P.y+50);dropSpawn('stone',2,P.x+40,P.y+40)}
      celebrate(P.x,P.y-30,'gear',T('loot.gear')+' '+gName('oakSword'));
      if(typeof floatText==='function'){floatText(P.x+60,P.y-40,'27','#fff',16);floatText(P.x+70,P.y-60,'54','#FFD34E',20,false,true)}});
    await run(200);await scene('world-fight','קרב בעולם: אויבים מיוחדים, שלל, "ציוד!" ומספרי נזק')});
  await safe('arena',async()=>{await page.evaluate(()=>{worldUi(false);startRun()});await run(4000);await scene('arena','הזירה (של אוראל, רק מדידה)')});
  await browser.close();
}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});for(const f of fs.readdirSync(OUT))if(f.endsWith('.png'))fs.unlinkSync(path.join(OUT,f));
  const report={};for(const k in VIEWS)await session(VIEWS[k],k,report);
  fs.writeFileSync(path.join(OUT,'hud.json'),JSON.stringify(report,null,1));
  for(const k in report){const R=report[k];console.log('\n=== '+R.view.width+'×'+R.view.height+' ===');
    for(const s in R.scenes){const m=R.scenes[s];console.log('\n['+s+'] '+m.note+' | ממשק תופס '+m.hudArea+'% מהמסך');
      for(const d of m.dom.filter(d=>d.hPct>=4||d.kind==='window').sort((a,b)=>b.aPct-a.aPct).slice(0,14))
        console.log('  '+d.kind.padEnd(7)+String(d.hPct).padStart(5)+'%H '+String(d.wPct).padStart(5)+'%W '+String(d.aPct).padStart(5)+'%A  '+d.font+'px'+(d.scroll?' גולל×'+d.scroll:'')+'  '+d.el);
      const ct=m.canvas.slice().sort((a,b)=>b.px-a.px).slice(0,8);if(ct.length)console.log('  קנבס: '+ct.map(c=>'"'+c.t+'" '+c.px+'px').join(' · '))}
    if(R.fail)console.log('נכשל:',R.fail);if(R.errors.length)console.log('שגיאות:',R.errors.slice(0,4))}
})();
