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
  kills:+(opt('kills')||60),        // הריגות בכל אזור בדרגה 2 ו-3 לפני השומר
  cap:+(opt('cap')||2400),          // שניות משחק לכל היותר לפרק. לא נגמר: "תקוע" (קיר)
  trip:+(opt('trip')||600),         // כל כמה שניות משחק חוזרים לכפר
  walk:1.5, village:90, death:45,   // ההנחות למעלה
  // היעד בשעות לכל שלב (docs/plan-longevity.md)
  goal:{story:5,t2:10,t3:20},
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

// שניות משחק → שעות של שחקן
const hrs=(t,trips,deaths)=>(t*PT.walk+trips*PT.village+deaths*PT.death)/3600;
const f1=x=>x==null?'-':(Math.round(x*10)/10).toString();

(async()=>{
  const story=BAL.chapters.map(c=>Object.assign({},c,{st:'story'}));
  const tier=n=>BAL.chapters.map(c=>Object.assign({},c,{st:'t'+n,tier:n,kills:PT.kills}));
  const B=Object.assign({},BAL,{cap:PT.cap,wardenCap:Math.min(600,PT.cap/2),trip:PT.trip,chapters:story.concat(tier(2),tier(3))});
  const browser=await chromium.launch();
  const out={};await Promise.all(PT.cls.map(async c=>{out[c]=await runCls(browser,c,B)}));
  await browser.close();

  // לכל מחלקה ולכל פרק: שעות. חזרות לכפר: כל trip שניות בטיפוס, ועוד אחת בסוף כל פרק
  const A={};
  for(const c of PT.cls){const R=out[c];A[c]=R.ch.map((h,i)=>{const trips=Math.floor((h.t||0)/PT.trip)+1;
    return{st:B.chapters[i].st,reg:h.reg,h:hrs(h.t||0,trips,h.deaths||0),lv:h.lv1,ok:h.ok,why:h.why,deaths:h.deaths,fight:h.fightT,gate:h.gate}})}
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
  p('| שלב | כמה | ממוצע (דק) | הכי ארוך (דק) | מה היה |');p('| --- | --- | --- | --- | --- |');
  for(const [st,name] of STAGES){let n=0,gaps=[],kinds={};
    for(const c of PT.cls){const R=out[c],idx=B.chapters.map((x,i)=>x.st===st?i:-1).filter(i=>i>=0);if(!idx.length||!R.ch[idx[0]])continue;
      // תחילת השלב וסופו בזמן משחק: סכום הפרקים שלפניו
      const start=R.ch.slice(0,idx[0]).reduce((a,h)=>a+(h.t||0),0),end=start+idx.reduce((a,i)=>a+((R.ch[i]||{}).t||0),0);
      // זמן המשחק של הבוט רץ ברצף (m.gt), אז האירועים כבר על אותו ציר
      const e=(R.ev||[]).filter(x=>idx.includes(x.ch));n+=e.length;for(const x of e)kinds[x.k]=(kinds[x.k]||0)+1;
      let prev=start;for(const x of e){gaps.push(x.t-prev);prev=x.t}gaps.push(end-prev)}
    const g=gaps.map(x=>x*PT.walk/60),avg=g.length?g.reduce((a,b)=>a+b,0)/g.length:null;
    p(`| ${name} | ${f1(n/PT.cls.length)} למחלקה | ${f1(avg)} | ${f1(g.length?Math.max(...g):null)} | ${Object.entries(kinds).map(([k,v])=>k+' '+v).join(', ')} |`)}
  p('');
  p('## קירות וקצר מדי');p('');
  p('- **קיר** (פרק שלוקח יותר מפי '+PT.wall+' מהחלק שלו ביעד, או שהבוט נתקע): '+(walls.length?walls.join(', '):'אין'));
  p('- **קצר מדי** (פחות מחצי מהחלק שלו ביעד): '+(short.length?short.join(', '):'אין'));p('');
  p('## בסוף');p('');
  for(const c of PT.cls){const R=out[c];p(`- ${c}: רמה ${R.end.lv}, סטים: ${R.end.sets.join(', ')}, ${R.deaths} מוות, ${R.unstick||0} פעמים נתקע בשטח וזז לכיוון אקראי, ${R.real} שניות אמיתיות${R.errors.length?', שגיאות: '+R.errors.join(' | '):''}`)}
  const txt=L.join('\n');console.log('\n'+txt);
  const o=opt('out');if(o)fs.writeFileSync(o,txt+'\n');
  const j=opt('json');if(j)fs.writeFileSync(j,JSON.stringify(out,null,1));
})();
