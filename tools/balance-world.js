/* איזון בעולם (משימה ז ב"התוכנית הבאה", 4.11.2026): שחקן מדומה לכל אחת משלוש המחלקות עובר את ששת הפרקים בעולם.
   בכל פרק: מטפס לרמה המומלצת של הדרך הבאה (CURIO.paths), ואז הולך לפנס ומפיל את השומר. בדרך לובש את מה שנופל (אם עומד בדרישות),
   שם נקודות, מחליף סקילים בספר כדי למדוד את כולם, ובכל חזרה לכפר משדרג סקילים אצל הכוהנת כשיש לו במה.
   בלי חסינות: הוא יכול למות, וקם בכפר כמו שחקן. מודד: זמן לכל פרק, מוות, נזק לכל סקיל (ולהטלה), ומה תקע אותו.
   הרצה: node tools/balance-world.js [--cls warrior,hunter,mage] [--seed 7] [--cap 900] [--json out.json] [--set "<js>"]
   --cap: כמה שניות משחק לכל היותר לפרק (טיפוס + שומר). פרק שלא נגמר בזמן נרשם "תקוע", והבוט ממשיך לפרק הבא כדי למדוד אותו.
   לא רץ ב-GitHub. דו-ממד בלבד. הזמן מואץ בשעון מזויף, ושלוש המחלקות רצות במקביל
   tools/playtime.js משתמש בבוט הזה (install), עם שלוש תוספות שכבויות כברירת מחדל: פרק עם tier (דרגת עולם) ו-kills
   (כמה הריגות באזור לפני השומר, במקום הרמה המומלצת), ו-B.trip (חזרה לכפר כל כך שניות, כמו שחקן אמיתי) */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const BAL={
  cls:(opt('cls')||'warrior,hunter,mage').split(','),
  seed:+(opt('seed')||7),
  cap:+(opt('cap')||900),          // שניות משחק לפרק
  wardenCap:300,                   // מתוכן, לכל היותר לקרב בשומר
  step:250,                        // כל כמה מילישניות משחק הבוט מחליט
  swapEvery:75,                    // כל כמה שניות מחליפים סקיל אחד בספר, כדי שכל הסקילים הפתוחים יימדדו
  flee:0.3,                        // מתחת לחלק הזה מהחיים בורחים עד שמתרפאים
  // התוכנית לנקודות: לפי הסדר, שוב ושוב. התכונה הראשונה היא זו שהנשק של המחלקה דורש (ITEMROLL.stat)
  pts:{warrior:['str','vit','str','def'],hunter:['agi','str','agi','vit'],mage:['haste','str','haste','vit']},
  chapters:[{reg:'meadow',k:'earth',to:'lake'},{reg:'lake',k:'water',to:'ridge'},{reg:'ridge',k:'ice',to:'desert'},
            {reg:'desert',k:'fire',to:'storm'},{reg:'storm',k:'bolt',to:'shadow'},{reg:'shadow',k:'light',to:null}],
  phone:{width:844,height:390}
};

/* ---- הבוט, בתוך הדף ---- */
function install(B){
  const m=window.__bal={B,ch:0,ph:'grind',gt:0,chT:0,wT:0,rep:{ch:[],dmg:{},casts:{},block:{},noPay:{},deaths:0,errors:[]},lastMg:0,lastSw:0,swI:0,dead:0};
  const R=m.rep;
  // נזק: כל מכה נמדדת לפי מקור. סקיל מהספר דרך wsbHit, סקיל של הזירה לפי סוג הנזק, והשאר לפי הנשק
  const OLD={earth:'quake',lightning:'zap',water:'splash',ice:'frost',fire:'flame'};
  const d0=damage;damage=function(e,base,w,ang,t){const h=e.hp;const r=d0.apply(this,arguments);
    if(S.wd&&!e.node){const got=Math.max(0,h-Math.max(0,e.hp)),src=window.__src||(w==='skill'?OLD[t]||'skill':w);
      const c=R.dmg[m.ch]||(R.dmg[m.ch]={});c[src]=(c[src]||0)+got}return r};
  const h0=wsbHit;wsbHit=function(e,id){window.__src=id;try{return h0.apply(this,arguments)}finally{window.__src=null}};
  const u0=wskUse;wskUse=function(id){const ok=u0.apply(this,arguments);if(ok){const c=R.casts[m.ch]||(R.casts[m.ch]={});c[id]=(c[id]||0)+1}return ok};
  // הזמן: הבוט מריץ את הפריימים בעצמו (frameStep ב-main.js), 0.05 שניות כל אחד, בלי השעון המזויף שמאט פי מאה.
  // זמן המשחק נספר רק בעולם, כדי שההמתנה אחרי מוות (setTimeout אמיתי) לא תיספר
  frame=function(){};
  window.__balRun=n=>{let r={};for(let i=0;i<n&&!r.done;i++){last=performance.now()-50;frameStep(performance.now());if(S.wd)m.gt+=0.05;if(i%5===0)r=step()}return r};
  function chap(){return B.chapters[m.ch]}
  // הריגות בפרק (ל-kills של playtime.js)
  const k0=kill;kill=function(e){const r=k0.apply(this,arguments);if(S.wd&&!e.node)m.kc=(m.kc||0)+1;return r};
  function need(){const c=chap();return c.to?CURIO.paths[c.to].lv:0}
  function cRep(){return R.ch[m.ch]||(R.ch[m.ch]={reg:chap().reg,deaths:0,lv0:heroLv()})}
  const foes=()=>enemies.filter(e=>!e.dead&&!e.node);
  function better(slot,id){let wi=-1,ws=1e9;for(let i=0;i<gOpen(slot);i++){const s=gScore(gGet(slot,i));if(s<ws){ws=s;wi=i}}return gScore(id)>ws+1e-9?wi:-1}
  // הציוד: כל מה שבתרמיל ועדיף על הגרוע שלבוש באותה משבצת. נשק רק של המחלקה. לא עומד בדרישות: נרשם
  function equip(){const arms=HEROES.list[heroId()].arms;
    for(const id of Object.keys(SAVE.bag)){const it=gItem(id);if(!it||!SAVE.bag[id])continue;if(it.slot==='weapon'&&!arms.includes(it.w))continue;
      const i=better(it.slot,id);if(i<0)continue;
      if(!irMeets(id)){const r=irReq(id),k=it.slot+':t'+it.tier;const b=R.block[k]||(R.block[k]={n:0,lv:r.lv,st:r.st,pt:r.n,at:[]});b.n++;if(b.at.length<4)b.at.push(heroLv()+'/'+(stPts()[r.st]||0));
        // נרשם פעם אחת לחפץ: מוציאים אותו לצד, כמו שחקן ששם במחסן עד שיגיע לרמה
        SAVE.stash[id]=(SAVE.stash[id]||0)+SAVE.bag[id];delete SAVE.bag[id];continue}
      gearEquip(id,it.slot,i)}
    // מה שבצד ועכשיו כבר עובר את הדרישות
    for(const id of Object.keys(SAVE.stash)){const it=gItem(id);if(!it||!SAVE.stash[id]||!irMeets(id))continue;if(better(it.slot,id)<0)continue;
      SAVE.stash[id]--;if(!SAVE.stash[id])delete SAVE.stash[id];bagAdd(id);gearEquip(id,it.slot,better(it.slot,id))}}
  function points(){const plan=B.pts[heroId()];let n=0;while(stFree()>0&&n++<99){const k=plan[stSpent()%plan.length];if(!statAdd(k))break}
    // עץ הסקילים: הצומת הראשון שאפשר בענף של המחלקה
    const br={warrior:'war',hunter:'hunt',mage:'mage'}[heroId()];for(let g=0;g<9&&trFree()>0;g++)if(!treeLearn(br))break}
  // בכפר: שדרוג סקילים אצל הכוהנת. קודם מה שעל הכפתורים
  function upgrade(){const ids=wslIds(),load=wsbLoad();ids.sort((a,b)=>(load.includes(b)?1:0)-(load.includes(a)?1:0));
    for(const id of ids){let n=0;while(wslCan(id)&&n++<5)wslUp(id);
      if(wslLv(id)<WSKLVL.max&&!wslCan(id)&&load.includes(id)){const c=wslCost(id),miss=Object.keys(c).filter(r=>(SAVE.bag[r]||0)<c[r]);
        const k=id+'+'+(wslLv(id)+1);R.noPay[k]=R.noPay[k]||{ch:m.ch,miss:miss.map(r=>r+' '+(SAVE.bag[r]||0)+'/'+c[r]).join(', ')}}}}
  // הספר: הסקילים הפתוחים מסתובבים על שתי המשבצות, כדי שכל אחד יימדד
  function swap(){const open=wsbIds().filter(id=>id!==wsbWeapon()&&wsbOpen(id)&&WSKBOOK.list[id]);if(!open.length)return;
    const L=wsbLoad(),mine=open.filter(id=>WSKBOOK.list[id].cls===heroId());const pool=mine.length>=2?mine:open;
    m.swI=(m.swI+1)%pool.length;const nx=pool[m.swI];if(L.includes(nx))return;L[m.swI%2]=nx;}
  function steer(tx,ty,flee,stop){let dx=0,dy=0;const d=Math.hypot(tx-P.x,ty-P.y)||1;if(flee||d>stop){dx=(tx-P.x)/d;dy=(ty-P.y)/d;if(flee){dx=-dx;dy=-dy}}joy={id:-1,ox:-999,oy:-999,dx,dy}}
  function finish(ok,why){const c=cRep();c.t=Math.round(m.gt-m.chT);c.lv1=heroLv();c.ok=ok;if(why)c.why=why;c.coins=SAVE.bag.coins||0;
    c.gear=[SAVE.gear.weapon].concat(SAVE.gear.acc||[],SAVE.gear.boots||[],SAVE.gear.body||[]).filter(Boolean).join(' ');
    c.sk=Object.entries(SAVE.sklv||{}).map(([k,v])=>k+'+'+v).join(' ');
    if(ok)STO()[chap().k]=true;saveNow();m.ch++;m.ph='grind';m.chT=m.gt;m.wT=0;m.kc=0;joy=null;
    if(S.wd){worldUi(false);enterVillage()}}
  function step(){
    if(m.ch>=B.chapters.length)return{done:true,R};
    const now=m.gt,c=cRep(),vis=id=>!$(id).hidden;
    if(vis('ovWDeath')){$('wRespawn').click();return{}}
    if(S.wd&&S.mode==='over'){if(!m.dead){m.dead=1;R.deaths++;c.deaths++}return{}}
    m.dead=0;
    if(now-m.chT>B.cap){finish(false,m.ph==='warden'?'שומר':'רמה '+heroLv()+'/'+need());return{}}
    for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook'])if($(id)&&!$(id).hidden)$(id).hidden=true;
    if(S.vil||!S.wd||S.wd.reg!==chap().reg){if(S.vil){equip();points();upgrade()}
      worldUi(false);enterWorld('home',chap().reg);return{}}
    if(S.mode!=='play')return{};
    // דרגת עולם (playtime.js): עוברים לדרגה של הפרק כשהיא פתוחה. סגורה (דרגה 3 מחכה להריגות בדרגה 2): ממשיכים בדרגה הקודמת
    if(chap().tier&&typeof tierSet==='function'){if(!STO().end)STO().end=true;if(tierNow()!==chap().tier&&tierOpen(chap().tier))tierSet(chap().tier);c.gate=tierNow()!==chap().tier}
    // חזרה לכפר כל B.trip שניות (playtime.js), כמו שחקן שחוזר למכור, לשדרג ולנוח. רק בזמן טיפוס
    if(B.trip&&m.ph==='grind'&&now-(m.lastTrip||0)>B.trip){m.lastTrip=now;R.trips=(R.trips||0)+1;worldUi(false);enterVillage();return{}}
    if(now-m.lastMg>5){m.lastMg=now;equip();points();if(!foes().some(e=>Math.hypot(e.x-P.x,e.y-P.y)<260))dropsCollectAll()}
    if(now-m.lastSw>B.swapEvery){m.lastSw=now;swap()}
    // שלב: אחרי הרמה המומלצת, לפנס
    const ready=chap().kills?(m.kc||0)>=chap().kills&&!c.gate:heroLv()>=need();
    if(m.ph==='grind'&&ready&&now-m.chT<B.cap-30)m.ph='warden';
    if(m.ph==='grind'&&now-m.chT>=B.cap-B.wardenCap)m.ph='warden';   // לא הגיע לרמה בזמן: מנסה את השומר בכל זאת
    const L=STORY.lanterns[chap().k],w=S.wd;
    if(m.ph==='warden'){if(!m.wT)m.wT=now;
      if(m.wE&&m.wE.dead&&m.wE.hp<=0){c.wardenT=Math.round(now-m.wT);c.fightT=Math.round((now-m.wS)*10)/10;c.wLv=heroLv();m.wE=null;finish(true);return{}}
      // הענק קם לבד כשמתקרבים (giant.js). הטיימר מניצחון מקרי בזמן הטיפוס לא נספר: מאפסים אותו
      if(m.wE&&m.wE.gone)m.wE=null;if(STO().bt)delete STO().bt[chap().k];
      if(!w.warden&&typeof giantReady!=='function'&&Math.hypot(P.x-L.x,P.y-L.y)<L.warden.wake)storyWarden(chap().k,L.y+70);   // גרסה ישנה (לפני הטיימר): קם רק עם קווסט, אז מקימים ביד
      if(w.warden&&!w.warden.dead&&m.wE!==w.warden){m.wE=w.warden;m.wS=now;c.tries=(c.tries||0)+1}}
    // קרב: לחיים נמוכים בורחים. אחרת אל האויב הקרוב (או השומר), עד הטווח של הנשק
    const F=foes(),near=F.reduce((b,e)=>{const d=Math.hypot(e.x-P.x,e.y-P.y);return d<b.d?{e,d}:b},{e:null,d:1e9});
    const melee=P.weapon==='sword',stop=melee?28:150;
    if(P.hp<P.maxHp*B.flee&&near.e&&near.d<320){steer(near.e.x,near.e.y,true,0);m.hurt=1}
    else if(m.hurt&&P.hp<P.maxHp*0.85&&near.d<320){steer(near.e.x,near.e.y,true,0)}
    else{m.hurt=0;const tg=m.ph==='warden'?(w.warden&&!w.warden.dead?w.warden:null):near.e;
      if(m.ph==='warden'&&!tg)steer(L.x,L.y,false,20);else if(tg)steer(tg.x,tg.y,false,stop+(tg.r||0));else joy=null}
    if(near.e&&near.d<230&&S.sk)for(const id of S.sk.ids.slice())if(wskReady(id)>=0)wskUse(id);
    return{}
  }
}

async function runCls(browser,cls){
  const page=await browser.newPage({viewport:BAL.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},BAL.seed);
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.waitForTimeout(500);
  if(opt('set'))await page.evaluate(js=>{(0,eval)(js)},opt('set'));   // לנסות מספרים בלי לשנות קבצים: --set "HEROES.list.mage.passive.hp=30"
  await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);
  await page.waitForTimeout(300);
  await page.evaluate(install,BAL);
  const t0=Date.now();let r={},n=0;
  while(!r.done){r=await page.evaluate(()=>__balRun(40));
    if(++n%150===0){const s=await page.evaluate(()=>({ch:__bal.ch,lv:heroLv(),ph:__bal.ph,gt:Math.round(__bal.gt)}));console.log(cls,'פרק',s.ch+1,'רמה',s.lv,s.ph,s.gt+'s משחק',Math.round((Date.now()-t0)/1000)+'s')}}
  r.R.errors=[...new Set(errors)].slice(0,8);r.R.real=Math.round((Date.now()-t0)/1000);
  await page.close();return r.R;
}

module.exports={BAL,install};
if(require.main===module)(async()=>{
  const browser=await chromium.launch();
  const out={};await Promise.all(BAL.cls.map(async c=>{out[c]=await runCls(browser,c)}));
  await browser.close();
  // הדוח
  const row=(c,R)=>R.ch.map((h,i)=>{const d=R.dmg[i]||{},cs=R.casts[i]||{},tot=Object.values(d).reduce((a,b)=>a+b,0)||1;
    const sk=Object.keys(d).sort((a,b)=>d[b]-d[a]).map(k=>k+' '+Math.round(d[k]/tot*100)+'%'+(cs[k]?' ('+Math.round(d[k]/cs[k])+'/הטלה)':'')).join(', ');
    return `  ${i+1}. ${h.reg}: ${h.ok?'✓':'✗ תקוע ('+h.why+')'} ${h.t}s, רמה ${h.lv0}→${h.lv1}, מוות ${h.deaths}${h.wardenT!=null?', שומר '+h.wardenT+'s (קרב '+h.fightT+'s) ברמה '+h.wLv+' ('+h.tries+' ניסיונות)':''}, מטבעות ${h.coins}\n     נזק: ${sk}\n     ציוד: ${h.gear} · סקילים: ${h.sk||'-'}`}).join('\n');
  for(const c of BAL.cls){const R=out[c];console.log(`\n${c} (${R.real}s אמיתיות, ${R.deaths} מוות)\n`+row(c,R));
    if(Object.keys(R.block).length)console.log('  נחסם בדרישות: '+Object.entries(R.block).map(([k,b])=>`${k} ×${b.n} (צריך רמה ${b.lv}, ${b.st} ${b.pt}; היה ${b.at.join(' ')})`).join('; '));
    if(Object.keys(R.noPay).length)console.log('  אין במה לשדרג: '+Object.entries(R.noPay).map(([k,v])=>`${k} בפרק ${v.ch+1}: ${v.miss}`).join('; '));
    if(R.errors.length)console.log('  שגיאות: '+R.errors.join(' | '))}
  // סולם הבוסים (GIANT.ladder.ratio, ניר 5.11): כמה זמן לוקח להפיל כל שומר, בממוצע על המחלקות, ופי כמה מהקודם
  const ft=BAL.chapters.map((_,i)=>{const v=BAL.cls.map(c=>(out[c].ch[i]||{}).fightT).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null});
  console.log('\nזמן להפיל כל שומר (ממוצע, שניות): '+ft.map((t,i)=>BAL.chapters[i].k+' '+(t==null?'-':t.toFixed(1))+(i&&t&&ft[i-1]?' (×'+(t/ft[i-1]).toFixed(2)+')':'')).join(', '));
  const j=opt('json');if(j)fs.writeFileSync(j,JSON.stringify(out,null,1));
})();
