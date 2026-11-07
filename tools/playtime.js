/* כמה שעות לוקח המשחק (משימה ת12, 5.11.2026. התוכנית: docs/plan-longevity.md). היעד שניר אישר: 5 שעות לסיפור,
   10 נוספות לדרגה 2 ו-20 נוספות לדרגה 3 (30-40 בסך הכל). הכלי מודד, ולא משנה מספרים במשחק.
   הבוט הוא של tools/balance-world.js (install): שחקן מדומה מרמה 1, שלובש שלל, שם נקודות ומשדרג סקילים. כאן הוא עובר:
     1. הסיפור: ששת הפרקים. בכל אחד מטפס לרמה המומלצת (CURIO.paths) ומפיל את השומר.
     2. דרגה 2: כל ששת האזורים שוב בדרגה 2, בכל אזור PT.kills הריגות ("עובר את האזור") ואז השומר.
     3. דרגה 3: אותו דבר בדרגה 3. היא נפתחת רק אחרי TIERS.open3 הריגות בדרגה 2, ואם עוד לא, ממשיכים בדרגה 2 (נספר כ"שער").
   בדרך רושם "דברים מעניינים": שלל משכבה חדשה, משאב אפי או אגדי, מפלצת נדירה, שומר, רמה שפותחת דרגת דמות (כל RANKS.every), ודרגת עולם.

   ההנחות (מזמן משחק לשעות של שחקן). כל מספר כאן הוא הערכה, והוא מודפס בדוח:
   - זמן משחק = שניות בעולם הפתוח, בשעון המשחק (הבוט מריץ את הפריימים בעצמו, פי ~20 מהזמן האמיתי).
   - walk ×1.5: הבוט הולך ישר לאויב הקרוב ולא עוצר. שחקן מסתובב, מסתכל במפה, קורא, מתחמק ומפספס.
   - village 90 שניות לכל חזרה לכפר (מכירה, כוהנת, ציוד, דיבור עם דמויות). הבוט חוזר כל PT.trip שניות משחק, ובסוף כל פרק.
   - death 45 שניות לכל מוות (מסך המוות, ההליכה חזרה מהכפר).
   - מה לא נספר: קווסטים, הזירה, דיג, סודות, פונדק. הם לוקחים זמן, אבל גם נותנים XP ושלל שמקצרים את הטיפוס. מניחים שהם בערך מתקזזים.
   צפיפות בהליכה (עולם עם חיים): node tools/playtime.js --density [--walks 40] [--out <קובץ>]
   הרצה: node tools/playtime.js [--cls warrior,hunter,mage] [--seed 7] [--kills 60] [--cap 2400] [--trip 600] [--out docs/playtime-<תאריך>.md] [--set "<js>"]
   לא רץ ב-GitHub. דו-ממד בלבד. ריצה מלאה: כ-20-40 דקות אמיתיות, שלוש המחלקות במקביל */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const {BAL,install}=require('./balance-world.js');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const PT={
  cls:(opt('cls')||'warrior,hunter,mage').split(','),
  seed:+(opt('seed')||7),
  kills:+(opt('kills')||60),        // הריגות בכל אזור בדרגה 2 ו-3 לפני השומר (לכל הפחות)
  // רמת היעד בסוף כל שלב (המתאם, 5.11: סיפור כ-30, דרגה 2 כ-50, דרגה 3 כ-70). בדרגות 2-3 הבוט מטפס באזור עד החלק שלו (6 אזורים, עולה בשווה)
  // לפני השומר, כמו שחקן שמשחק עד שהוא מרגיש חזק מספיק. בסיפור הרמה באה מהשלטים (CURIO.paths). --lv 0 מבטל
  lv:(opt('lv')||'30,50,70').split(',').map(Number),
  cap:+(opt('cap')||2400),          // שניות משחק לכל היותר לפרק. לא נגמר: "תקוע" (קיר)
  trip:+(opt('trip')||600),         // כל כמה שניות משחק חוזרים לכפר
  walk:1.5, village:90, death:45,   // ההנחות למעלה
  // היעד בשעות לכל שלב (docs/plan-longevity.md)
  goal:{story:5,t2:10,t3:20},
  // רגע טוב (המתאם, 5.11: לפחות כ-6 בשעה בכל שלב): שדרוג ציוד, נדירה, שומר, דרגת עולם, שכבת שלל חדשה, דרגת דמות
  good:['equip','rare','warden','tier','layer','rank'],
  wall:2                            // פרק שלוקח פי כך מהחלק שלו ביעד = קיר. פחות מ-1/wall = קצר מדי
};
const STAGES=[['story','הסיפור (דרגה 1)'],['t2','דרגה 2'],['t3','דרגה 3']];

// מה נרשם כ"דבר מעניין". רץ בדף, אחרי install
function track(){
  const m=window.__bal,ev=m.rep.ev=[],add=(k,d)=>ev.push({t:Math.round(m.gt),ch:m.ch,k,d});
  let top=0;const seen={},won={};for(const s in SAVE.gear){const g=[].concat(SAVE.gear[s]||[]);for(const id of g){const it=id&&gItem(id);if(it&&it.tier>top)top=it.tier}}
  const b0=bagAdd;bagAdd=function(k,n){const r=b0.apply(this,arguments);if(!S.wd)return r;
    const it=dropGear(k)&&gItem(k);
    if(it){if(it.tier>top){top=it.tier;add('layer','שכבה '+top)}}
    // משאב: אגדי תמיד, אפי רק בפעם הראשונה מכל סוג (אחרי זה הוא שגרה ולא אירוע)
    else if(resOf(k)&&(dropRar(k)>=4||dropRar(k)===3&&!seen[k])){seen[k]=1;add(dropRar(k)>=4?'legend':'epic',k)}
    return r};
  let lv=heroLv();
  const k0=kill;kill=function(e){const r=k0.apply(this,arguments);if(!S.wd)return r;
    if(typeof RARES!=='undefined'&&RARES.list[e.type])add('rare',e.type);
    if(e.warden&&!won[m.ch+e.warden]){won[m.ch+e.warden]=1;add('warden',e.warden)}   // פעם אחת לשומר בכל פרק
    const L=heroLv();if(Math.floor(L/RANKS.every)>Math.floor(lv/RANKS.every))add('rank','רמה '+L);lv=L;
    return r};
  // שדרוג ציוד: הבוט לבש משהו טוב יותר (לא "מעניין", אבל מראה אם יש התקדמות בזמן הטיפוס)
  const g0=gearEquip;gearEquip=function(){const r=g0.apply(this,arguments);if(S.wd)add('equip','');return r};
  const t0=tierSet;tierSet=function(n){const r=t0.apply(this,arguments);if(r)add('tier','דרגה '+n);return r};
}

async function runCls(browser,cls,B){
  const page=await browser.newPage({viewport:BAL.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},PT.seed);
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.waitForTimeout(500);
  if(opt('set'))await page.evaluate(js=>{(0,eval)(js)},opt('set'));
  await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);
  await page.waitForTimeout(300);
  await page.evaluate(install,B);
  await page.evaluate(track);
  const t0=Date.now();let r={},n=0;
  while(!r.done){r=await page.evaluate(()=>__balRun(40));
    if(++n%300===0){const s=await page.evaluate(()=>({ch:__bal.ch,lv:heroLv(),ph:__bal.ph,gt:Math.round(__bal.gt)}));
      console.log(cls,'פרק',s.ch+1+'/'+B.chapters.length,'רמה',s.lv,s.ph,Math.round(s.gt/60)+' דק משחק',Math.round((Date.now()-t0)/1000)+'s')}}
  r.R.end=await page.evaluate(()=>({lv:heroLv(),sets:Object.keys(SETS).map(s=>{const all=setItems(s);return s+' '+all.filter(id=>Object.keys(SAVE.bag).concat(Object.keys(SAVE.stash||{}),[].concat(...Object.values(SAVE.gear).map(g=>[].concat(g||[])))).some(x=>x&&gBase(x)===id)).length+'/'+all.length})}));
  r.R.errors=[...new Set(errors)].slice(0,8);r.R.real=Math.round((Date.now()-t0)/1000);
  await page.close();return r.R;
}

/* --density (עולם עם חיים, docs/concept-world-life.md, 7.11.2026): כמה מלא העולם בזמן הליכה. בלי הבוט ובלי קרב, דקה-שתיים אמיתיות.
   בכל אזור: walks הליכות אקראיות מנקודה פתוחה לנקודה פתוחה בדרך האמיתית (tPath), במהירות של הגיבור. כל רבע שנייה בודקים:
   - "ריק": אין על המסך שום דבר שהוא לא אויב (שער, ציון דרך, אבן מסע, פנס, דמות, מחנה ועשן שלו, שריד, חיות).
   - "לגעת": כמה שניות עוברות בין דבר שאפשר לגעת בו (מחנה, שריד שלא נלקח, אבן מסע, דמות) לבא. היעד: כ-10.
   לפי איזור (start/near/far: שליש המרחק מהכניסה). פעמיים: בלי wlife.js ואיתו, באותן הליכות */
function densityRun(walks){
  const out={},regs=['meadow','lake','ridge','desert','storm','shadow'],on0=Object.assign({},WLIFE.on);
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(const reg of regs){
    out[reg]={};
    for(const mode of ['off','on']){
      WLIFE.on=mode==='on'?Object.fromEntries(regs.map(r=>[r,1])):{};seed=7+reg.length;
      enterWorld('home',reg);enemies=[];const R=WR(),{w,h}=R.size,home={x:P.x,y:P.y},sp=P.speed||200,hw=W/2,hh=H/2;
      const st=WLIFE.on[reg]?wlState():null,smokeH=WLIFE.camp.smoke.h;
      const fixed=[];const add=o=>{if(o&&o.x!=null)fixed.push(o)};const gs=wGates(true);for(const k in gs)add(gs[k]);
      ((R.map&&R.map.marks)||[]).forEach(add);(R.waystones||[]).forEach(add);
      for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===reg)add(STORY.lanterns[k]);
      const npcs=[];for(const id in WNPC.list)if((WNPC.list[id].reg||'meadow')===reg)npcs.push(WNPC.list[id].at);
      const touch=[...(R.waystones||[]),...npcs,...(st?st.camps:[]),...(st?st.rems:[])];
      const maxD=Math.hypot(w,h)/2,zone=(x,y)=>{const d=Math.hypot(x-home.x,y-home.y)/maxD;return d<0.33?'start':d<0.66?'near':'far'};
      const Z={};for(const z of ['start','near','far'])Z[z]={t:0,empty:0,gaps:[],run:0,maxRun:0};
      const used=new Set();
      for(let k=0;k<walks;k++){
        let a=null,b=null;for(let i=0;i<60&&!b;i++){const x=(rnd()-0.5)*(w-500),y=(rnd()-0.5)*(h-500);if(tBlocked(x,y))continue;if(!a){a={x,y};continue}if(Math.hypot(x-a.x,y-a.y)>1500)b={x,y}}
        if(!a||!b)continue;const path=tPath(a.x,a.y,b.x,b.y);if(!path||path.length<2)continue;
        let lastT=0,t=0,px=a.x,py=a.y,seen=null;
        const pts=[[a.x,a.y],...path.map(q=>Array.isArray(q)?q:[q.x,q.y])];
        for(let i=1;i<pts.length;i++){const [x1,y1]=pts[i],[x0,y0]=pts[i-1],L=Math.hypot(x1-x0,y1-y0),n=Math.max(1,Math.ceil(L/(sp*0.25)));
          for(let j=1;j<=n;j++){px=x0+(x1-x0)*j/n;py=y0+(y1-y0)*j/n;t+=0.25;const zn=Z[zone(px,py)];zn.t+=0.25;
            const on=o=>Math.abs(o.x-px)<hw+40&&Math.abs(o.y-py)<hh+40;
            let any=fixed.some(on)||npcs.some(on);
            if(!any&&st)any=st.rems.some(on)||st.camps.some(c=>Math.abs(c.x-px)<hw&&c.y-smokeH*0.8<py+hh&&c.y>py-hh)||st.herds.some(H=>!H.gone&&H.a.some(on));
            if(!any){zn.empty+=0.25;zn.run+=0.25;zn.maxRun=Math.max(zn.maxRun,zn.run)}else zn.run=0;
            const near=touch.find(o=>Math.hypot(o.x-px,o.y-py)<160&&!(st&&st.rems.includes(o)&&used.has(o.id)));
            if(near&&near!==seen){zn.gaps.push(t-lastT);lastT=t;seen=near;if(near.id&&st&&st.rems.includes(near))used.add(near.id)}}}
        for(const z in Z)Z[z].run=0}
      out[reg][mode]=Object.fromEntries(Object.entries(Z).map(([z,v])=>[z,{t:Math.round(v.t),empty:v.t?Math.round(v.empty/v.t*100):0,maxRun:Math.round(v.maxRun),
        gap:v.gaps.length?Math.round(v.gaps.reduce((a,b)=>a+b,0)/v.gaps.length):null,n:v.gaps.length}]))}
  }
  WLIFE.on=on0;return out;
}
async function density(){
  const browser=await chromium.launch(),page=await browser.newPage({viewport:BAL.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));await page.waitForTimeout(800);
  if(opt('set'))await page.evaluate(js=>{(0,eval)(js)},opt('set'));
  const walks=+(opt('walks')||40),R=await page.evaluate(`(${densityRun})(${walks})`);await browser.close();
  const L=['# צפיפות העולם בהליכה (playtime.js --density)','','לכל אזור ולכל איזור: % מזמן ההליכה בלי שום דבר שהוא לא אויב על המסך, הרצף הריק הכי ארוך (שניות), וממוצע השניות בין דבר שאפשר לגעת בו לבא. "לפני" בלי wlife.js, "אחרי" איתו.','',
    '| אזור | איזור | ריק לפני | ריק אחרי | רצף ריק אחרי | בין נגיעות לפני | בין נגיעות אחרי |','| --- | --- | --- | --- | --- | --- | --- |'];
  for(const reg in R)for(const z of ['start','near','far']){const a=R[reg].off[z],b=R[reg].on[z];L.push(`| ${reg} | ${z} | ${a.empty}% | ${b.empty}% | ${b.maxRun} | ${a.gap??'-'} | ${b.gap??'-'} |`)}
  const txt=L.join('\n');console.log(txt);if(opt('out'))fs.writeFileSync(opt('out'),txt+'\n');
}

// שניות משחק → שעות של שחקן
const hrs=(t,trips,deaths)=>(t*PT.walk+trips*PT.village+deaths*PT.death)/3600;
const f1=x=>x==null?'-':(Math.round(x*10)/10).toString();

(async()=>{
  if(opt('density'))return density();
  const story=BAL.chapters.map(c=>Object.assign({},c,{st:'story'}));
  const tier=n=>BAL.chapters.map((c,i)=>{const a=PT.lv[n-2],b=PT.lv[n-1];return Object.assign({},c,{st:'t'+n,tier:n,kills:PT.kills},b?{lv:Math.round(a+(b-a)*(i+1)/6)}:{})});
  const B=Object.assign({},BAL,{rares:true,cap:PT.cap,wardenCap:Math.min(600,PT.cap/2),trip:PT.trip,chapters:story.concat(tier(2),tier(3))});
  const browser=await chromium.launch();
  const out={};await Promise.all(PT.cls.map(async c=>{out[c]=await runCls(browser,c,B)}));
  await browser.close();

  // לכל מחלקה ולכל פרק: שעות. חזרות לכפר: כל trip שניות בטיפוס, ועוד אחת בסוף כל פרק
  const A={};
  for(const c of PT.cls){const R=out[c];A[c]=R.ch.map((h,i)=>{const trips=Math.floor((h.t||0)/PT.trip)+1;
    return{st:B.chapters[i].st,reg:h.reg,h:hrs(h.t||0,trips,h.deaths||0),qn:h.qn||0,qxp:h.qxp||0,kxp:h.kxp||0,xp:h.xp||0,lv:h.lv1,ok:h.ok,why:h.why,deaths:h.deaths,fight:h.fightT,gate:h.gate}})}
  const L=[];const p=s=>L.push(s);
  const date=new Date().toISOString().slice(0,10);
  p(`# כמה שעות לוקח המשחק: ${date}`);p('');
  p(`הכלי: \`node tools/playtime.js\` (משימה ת12). seed ${PT.seed}, מחלקות: ${PT.cls.join(', ')}. ${PT.kills} הריגות בכל אזור בדרגות 2-3, עד ${Math.round(PT.cap/60)} דקות משחק לפרק, חזרה לכפר כל ${Math.round(PT.trip/60)} דקות.`);
  p(`ההמרה לשעות של שחקן: זמן משחק ×${PT.walk}, ועוד ${PT.village} שניות לכל חזרה לכפר ו-${PT.death} לכל מוות. ההסבר בראש tools/playtime.js.`);p('');
  // טבלה לכל שלב: שעות (ממוצע מחלקות), רמה בסוף, מול היעד
  p('## לפי שלב');p('');p('| שלב | שעות (ממוצע) | יעד | רמה בסוף | מוות |');p('| --- | --- | --- | --- | --- |');
  let tot=0;
  for(const [st,name] of STAGES){const per=PT.cls.map(c=>A[c].filter(x=>x.st===st));
    const h=per.map(l=>l.reduce((a,x)=>a+x.h,0)),avg=h.reduce((a,b)=>a+b,0)/h.length;tot+=avg;
    const lv=per.map(l=>l.length?l[l.length-1].lv:'-').join('/'),d=per.map(l=>l.reduce((a,x)=>a+(x.deaths||0),0)).join('/');
    p(`| ${name} | ${f1(avg)} (${h.map(f1).join('/')}) | ${PT.goal[st]} | ${lv} | ${d} |`)}
  const goal=PT.goal.story+PT.goal.t2+PT.goal.t3;
  p(`| **סה"כ** | **${f1(tot)}** | **${goal}** | | |`);p('');
  p('הסוגריים: לכל מחלקה לפי הסדר '+PT.cls.join(', ')+'.');p('');
  // קווסטים מול הריגה (ניר, 5.11): כמה XP לשעה מכל מקור. --quests: הבוט עושה קווסטים, ובלעדיו רק מטפס בהריגה
  p('## קווסטים מול הריגה'+(B.quests?' (מצב "בעיקר קווסטים")':' (מצב "בעיקר הריגה")'));p('');
  p('| שלב | קווסטים שנמסרו (למחלקה) | XP לשעה מקווסטים | XP לשעה מהריגה | XP לשעה משאר (עלילה, פנסים) | חלק הקווסטים |');p('| --- | --- | --- | --- | --- | --- |');
  for(const [st,name] of STAGES){let h=0,qn=0,qxp=0,kxp=0,xp=0;for(const c of PT.cls)for(const x of A[c].filter(x=>x.st===st)){h+=x.h;qn+=x.qn;qxp+=x.qxp;kxp+=x.kxp;xp+=x.xp}
    p(`| ${name} | ${f1(qn/PT.cls.length)} | ${h?Math.round(qxp/h):'-'} | ${h?Math.round(kxp/h):'-'} | ${h?Math.round((xp-qxp-kxp)/h):'-'} | ${xp?Math.round(qxp/xp*100)+'%':'-'} |`)}
  p('');
  // לכל פרק
  p('## לפי פרק (שעות, ממוצע מחלקות)');p('');p('| שלב | אזור | שעות | יעד לפרק | רמה בסוף | השומר (שניות קרב) | הערה |');p('| --- | --- | --- | --- | --- | --- | --- |');
  const walls=[],short=[];
  B.chapters.forEach((ch,i)=>{const xs=PT.cls.map(c=>A[c][i]).filter(Boolean);if(!xs.length)return;
    const h=xs.reduce((a,x)=>a+x.h,0)/xs.length,g=PT.goal[ch.st]/6,fs=xs.map(x=>x.fight).filter(x=>x!=null);
    const notes=[];if(xs.some(x=>!x.ok))notes.push('תקוע: '+xs.filter(x=>!x.ok).map(x=>x.why).join(', '));if(xs.some(x=>x.gate))notes.push('חיכה לפתיחת הדרגה');
    if(h>g*PT.wall||xs.some(x=>!x.ok)){walls.push(ch.st+' '+ch.reg);if(h>g*PT.wall)notes.push('קיר')}else if(h<g/PT.wall)short.push(ch.st+' '+ch.reg);
    p(`| ${STAGES.find(s=>s[0]===ch.st)[1]} | ${ch.reg} | ${f1(h)} | ${f1(g)} | ${xs.map(x=>x.lv).join('/')} | ${fs.length?f1(fs.reduce((a,b)=>a+b,0)/fs.length):'-'} | ${notes.join('; ')} |`)});
  p('');
  // דברים מעניינים: כמה דקות (של שחקן) בין אחד לבא, לכל שלב
  p('## כמה זמן בין "דבר מעניין" לבא');p('');
  p('דבר מעניין: שלל משכבה חדשה, משאב אגדי או אפי מסוג חדש, מפלצת נדירה, שומר, רמה שפותחת דרגת דמות (כל '+20+' רמות), ודרגת עולם. דקות של שחקן (זמן משחק ×'+PT.walk+').');p('');
  p('| שלב | כמה | ממוצע (דק) | הכי ארוך (דק) | שדרוגי ציוד לשעה | רגעים טובים לשעה | מה היה |');p('| --- | --- | --- | --- | --- | --- | --- |');
  for(const [st,name] of STAGES){let n=0,gaps=[],kinds={},eq=0,hsum=0,good=0;
    for(const c of PT.cls){const R=out[c],idx=B.chapters.map((x,i)=>x.st===st?i:-1).filter(i=>i>=0);if(!idx.length||!R.ch[idx[0]])continue;
      // תחילת השלב וסופו בזמן משחק: סכום הפרקים שלפניו
      const start=R.ch.slice(0,idx[0]).reduce((a,h)=>a+(h.t||0),0),end=start+idx.reduce((a,i)=>a+((R.ch[i]||{}).t||0),0);
      // זמן המשחק של הבוט רץ ברצף (m.gt), אז האירועים כבר על אותו ציר
      eq+=(R.ev||[]).filter(x=>idx.includes(x.ch)&&x.k==='equip').length;good+=(R.ev||[]).filter(x=>idx.includes(x.ch)&&PT.good.includes(x.k)).length;hsum+=(end-start)*PT.walk/3600;
      const e=(R.ev||[]).filter(x=>idx.includes(x.ch)&&x.k!=='equip');n+=e.length;for(const x of e)kinds[x.k]=(kinds[x.k]||0)+1;
      let prev=start;for(const x of e){gaps.push(x.t-prev);prev=x.t}gaps.push(end-prev)}
    const g=gaps.map(x=>x*PT.walk/60),avg=g.length?g.reduce((a,b)=>a+b,0)/g.length:null;
    p(`| ${name} | ${f1(n/PT.cls.length)} למחלקה | ${f1(avg)} | ${f1(g.length?Math.max(...g):null)} | ${hsum?f1(eq/hsum):'-'} | ${hsum?f1(good/hsum):'-'} | ${Object.entries(kinds).map(([k,v])=>k+' '+v).join(', ')} |`)}
  p('');
  p('## קירות וקצר מדי');p('');
  p('- **קיר** (פרק שלוקח יותר מפי '+PT.wall+' מהחלק שלו ביעד, או שהבוט נתקע): '+(walls.length?walls.join(', '):'אין'));
  p('- **קצר מדי** (פחות מחצי מהחלק שלו ביעד): '+(short.length?short.join(', '):'אין'));p('');
  p('## בסוף');p('');
  for(const c of PT.cls){const R=out[c];p(`- ${c}: רמה ${R.end.lv}, סטים: ${R.end.sets.join(', ')}, ${R.deaths} מוות, ${R.unstick||0} פעמים נתקע בשטח וזז לכיוון אקראי${R.qGiveUp?', '+R.qGiveUp+' קווסטים נזנחו (לא נגמרו בזמן)':''}${R.stuckAt?' ('+R.stuckAt.slice(0,6).map(a=>a.join(' ')).join('; ')+')':''}, ${R.real} שניות אמיתיות${R.errors.length?', שגיאות: '+R.errors.join(' | '):''}`)}
  const txt=L.join('\n');console.log('\n'+txt);
  const o=opt('out');if(o)fs.writeFileSync(o,txt+'\n');
  const j=opt('json');if(j)fs.writeFileSync(j,JSON.stringify(out,null,1));
})();
