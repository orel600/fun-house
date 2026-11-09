/* Combat feel (8.11.2026, Nir: "world combat should feel like XP Hero", docs/research-xphero.md). MEASUREMENT ONLY, changes nothing in the game.
   Measures three gaps:
   1. Time-to-kill (TTK) of ordinary world enemies, per region and per zone (start / near / far), for two heroes per class:
      "fresh"  = just arrived in the region: entry level (CURIO.paths), points spent, gear one tier below what that level may wear.
      "mid"    = ready to leave: the next region's level, gear of the best tier that level may wear.
      Plus elites (a forced affix on a far-zone foe) and the region's rare monster (RARES), for the mid hero.
   2. Does one upgrade show in the next fight: fresh hero, near zone, baseline vs +1 weapon aging, +1 stat point, +1 weapon tier. % change.
   3. Danger readability: landscape phone screenshots (844x390, deviceScaleFactor 1, 2D) in a busy fight with a wtg_* floor warning on.
   Method: a duel. The target is the only enemy in `enemies` (everything else is set aside each frame), the hero starts 220px away and walks
   to weapon range, auto-attack only (no skill buttons). TTK is counted from the first hit to death. The hero cannot die: damage taken is
   recorded (in hero health bars) and then refilled. Frames are stepped by hand like tools/balance-world.js (0.05s each).
   Run: node tools/combat-feel.js [--cls warrior,hunter,mage] [--seed 7] [--n 6] [--out docs/combat-feel-2026-11-08.md] [--shots docs/combat-feel]
   Not run on GitHub. 2D only. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const CF={
  cls:(opt('cls')||'warrior,hunter,mage').split(','),
  seed:+(opt('seed')||7),
  n:+(opt('n')||6),                 // duels per cell (region x zone x hero)
  regs:(opt('regs')||'meadow,lake,ridge,desert,storm,shadow').split(','),
  zones:['start','near','far'],
  cap:60,                           // game seconds per duel before it counts as "did not die"
  gap:220,                          // start distance from the target
  pts:{warrior:['str','vit','str','def'],hunter:['agi','str','agi','vit'],mage:['haste','str','haste','vit']},   // same plan as balance-world.js
  phone:{width:844,height:390},
  shotRegs:['meadow','ridge','storm','shadow']
};

/* ---- in the page ---- */
function install(B){
  const m=window.__cf={B,t:null,hits:0,first:null,hin:0};
  frame=function(){};   // we step frames ourselves
  const d0=damage;damage=function(e,base,w,ang,t){const h=e.hp;const r=d0.apply(this,arguments);if(m.t&&e===m.t&&e.hp<h){m.hits++;if(e.hp>0)m.dl.push(h-e.hp);if(m.first===null)m.first=m.gt}return r};
  const hu=hurt;hurt=function(d){const h0=P.hp;const r=hu.apply(this,arguments);if(m.t)m.hin+=Math.max(0,h0-P.hp)/P.maxHp;P.hp=P.maxHp;if(S.mode==='over')S.mode='play';return r};
  const cls=()=>heroId();
  const lvOf=reg=>reg==='meadow'?1:CURIO.paths[reg].lv;
  const ALL=['meadow','lake','ridge','desert','storm','shadow'];
  const nextLv=reg=>{const i=ALL.indexOf(reg);return i<ALL.length-1?lvOf(ALL[i+1]):lvOf(reg)+6};
  // same enemies, same rolls: every measured cell starts from the same random state, so an upgrade is compared against the same fights
  window.__cfSeed=seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
  const maxTier=L=>{let t=0;ITEMROLL.req.lv.forEach((lv,i)=>{if(lv<=L)t=i});return t};
  const xpTo=L=>{let x=0;for(let l=1;l<L;l++)x+=rankNeed(l);return x};
  // the best item of a slot for this class, tier <= T (weapons: the class arms; armor: the class)
  function best(slot,T,skip){const h=HEROES.list[cls()];let b=null,bs=-1;
    for(const id in GEAR.items){const it=GEAR.items[id];if(it.slot!==slot||it.tier>T||(skip&&skip.includes(id)))continue;
      if(slot==='weapon'&&!h.arms.includes(it.w))continue;if(it.cls&&it.cls!==cls())continue;if(slot==='shield'&&cls()!=='warrior')continue;
      const s=gScore(id,true);if(s>bs){bs=s;b=id}}return b}
  // builds the hero: level, points (all but `hold`), gear of tier T, and weapon aging +plus. Then re-enters the region so P is rebuilt
  function hero(L,T,o={}){
    SAVE.hero.level=L;SAVE.hero.xp=xpTo(L);SAVE.hero.pts={};SAVE.hero.tree={};
    const plan=B.pts[cls()];let n=Math.max(0,(L-1)*STATS.perLevel-(o.hold||0));for(let i=0;i<n;i++){const k=plan[i%plan.length];stPts()[k]=(stPts()[k]||0)+1}
    const br={warrior:'war',hunter:'hunt',mage:'mage'}[cls()];for(let g=0;g<9&&trFree()>0;g++)if(!treeLearn(br))break;
    const w=best('weapon',o.wT!=null?o.wT:T);SAVE.gear.weapon=w+(o.plus?'+'+o.plus:'');
    const a1=best('acc',T),a2=best('acc',T,[a1]);SAVE.gear.acc=[a1,a2].filter(Boolean);
    SAVE.gear.boots=[best('boots',T)].filter(Boolean);
    for(const s of ['head','body','shield']){const id=best(s,T);SAVE.gear[s]=id?[id]:[]}
    return{L,T,w:SAVE.gear.weapon,pts:Object.entries(stPts()).map(([k,v])=>k+v).join(' ')}}
  window.__cfHero=(reg,kind,o)=>{const L=kind==='mid'?nextLv(reg):lvOf(reg),mt=maxTier(L),T=kind==='mid'?mt:Math.max(0,mt-1);
    const h=hero(L,T,o||{});worldUi(false);enterWorld('home',reg);h.maxHp=Math.round(P.maxHp);return h};
  const step=()=>{last=performance.now()-50;frameStep(performance.now());m.gt+=0.05};
  // groups of ordinary foes per zone
  window.__cfGroups=()=>{const out={};WR().foes.forEach((G,i)=>{if(G.creature||G.tough||!ETYPES[G.type])return;const z=wZone(G).id;(out[z]||(out[z]=[])).push(i)});return out};
  function spawnFrom(i){const before=enemies.length;wSpawn(WR().foes[i],i);return enemies.slice(before)}
  // one duel against e. Returns {ttk, total, hits, hin, type, hp}
  function duel(e){
    const keep=enemies.filter(x=>x!==e);enemies.length=0;enemies.push(e);
    const melee=P.weapon==='sword',stop=(melee?28:150)+(e.r||0);
    // place the hero B.gap away on a free spot
    for(const a of [Math.PI/2,0,Math.PI,-Math.PI/2,0.8,2.4,-0.8,-2.4]){const x=e.x+Math.cos(a)*B.gap,y=e.y+Math.sin(a)*B.gap;if(typeof tBlocked!=='function'||!tBlocked(x,y)){P.x=x;P.y=y;break}}
    P.hp=P.maxHp;S.cam.x=P.x;S.cam.y=P.y;m.t=e;m.hits=0;m.dl=[];m.first=null;m.hin=0;m.gt=0;const hp=Math.round(e.max);
    while(m.gt<B.cap&&!e.dead){
      enemies=enemies.filter(x=>x===e);   // pacing packs, events, rares: set aside
      const d=Math.hypot(e.x-P.x,e.y-P.y)||1;joy=d>stop?{id:-1,ox:-999,oy:-999,dx:(e.x-P.x)/d,dy:(e.y-P.y)/d}:null;
      for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook','ovWDeath'])if($(id)&&!$(id).hidden)$(id).hidden=true;
      S.mode='play';step()}
    const r={ttk:e.dead&&m.first!=null?m.gt-m.first:null,total:e.dead?m.gt:null,hits:m.hits,dl:m.dl,hin:m.hin,type:e.type,hp,affix:e.affix||null};
    m.t=null;joy=null;enemies=keep.filter(x=>!x.dead);return r}
  // n duels in a zone (ordinary foes: affix removed so that elites stay a separate number)
  window.__cfZone=(z,n,seed)=>{if(seed!=null)__cfSeed(seed);const G=__cfGroups()[z]||[];if(!G.length)return[];const out=[];
    for(let k=0;k<n;k++){if(seed!=null)__cfSeed(seed+k*101);const i=G[k%G.length],sp=spawnFrom(i);const e=sp.find(x=>!x.affix)||sp[0];if(!e)continue;
      if(e.affix){e.affix=null}   // rare case: every spawned one rolled an affix (speed/hp already applied; noted by type)
      for(const x of sp)if(x!==e)x.dead=true;out.push(duel(e))}return out};
  // elites: a far-zone foe with a forced affix (each affix in turn)
  window.__cfElite=(n,seed)=>{if(seed!=null)__cfSeed(seed);const G=__cfGroups().far||__cfGroups().near||[];if(!G.length)return[];const ids=Object.keys(AFFIX.list),out=[];
    for(let k=0;k<n;k++){const sp=spawnFrom(G[k%G.length]);const e=sp.find(x=>!x.affix)||sp[0];if(!e)continue;for(const x of sp)if(x!==e)x.dead=true;
      if(e.affix)e.affix=null;affixSet(e,ids[k%ids.length]);out.push(duel(e))}return out};
  window.__cfRare=(n,seed)=>{if(seed!=null)__cfSeed(seed);const ids=Object.keys(RARES.list).filter(id=>RARES.list[id].reg===S.wd.reg&&ETYPES[id]),out=[];if(!ids.length)return out;
    for(let k=0;k<n;k++){const e=rareSpawn(ids[k%ids.length]);if(!e)continue;S.wd.rare=null;out.push(duel(e))}return out};
  // screenshots: a busy fight in the far zone with all groups awake, until a floor warning is on
  window.__cfBusy=(maxT)=>{const G=__cfGroups(),list=(G.far||[]).concat(G.near||[]);if(!list.length)return null;
    // the group with the most attackers that telegraph (foeai.js); otherwise the first far group
    const i=list[0],H=WR().foes[i];P.x=H.x;P.y=H.y+150;if(typeof tFree==='function')tFree(P);S.cam.x=P.x;S.cam.y=P.y;
    for(let k=0;k<3;k++)wSpawn(H,i);   // more bodies: a busy fight
    for(const e of enemies)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<700)e.alert=6;
    m.gt=0;let best=null;
    while(m.gt<maxT){const F=enemies.filter(e=>!e.dead&&!e.node);
      const n=F.reduce((b,e)=>{const d=Math.hypot(e.x-P.x,e.y-P.y);return d<b.d?{e,d}:b},{e:null,d:1e9});
      if(n.e){const d=n.d||1,stop=P.weapon==='sword'?28:150;joy=d>stop?{id:-1,ox:-999,oy:-999,dx:(n.e.x-P.x)/d,dy:(n.e.y-P.y)/d}:null}else joy=null;
      for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook','ovWDeath'])if($(id)&&!$(id).hidden)$(id).hidden=true;
      P.hp=Math.max(P.hp,P.maxHp*0.6);S.mode='play';step();
      const tg=enemies.filter(e=>!e.dead&&e.fxTg&&fxcTgOn(e)),near=F.filter(e=>Math.hypot(e.x-P.x,e.y-P.y)<330).length;
      if(tg.length&&near>=3){best={t:Math.round(m.gt*10)/10,warn:tg.map(e=>e.fxTg.h.id+':'+e.type),near};break}}
    joy=null;return best};
  /* ---- group fights (9.11, docs/concept-combat-drama.md): a whole real group, skills on ----
     policy: 'auto' = auto-attack only. 'skills' = every skill fired as soon as it is ready (at the nearest foe). 'one' = one skill, the strongest
     area skill, aimed at the group centre on first contact, then auto only: how much of the group one skill kills.
     Damage and kills are split by source: auto (sword/gun) vs everything else (skills, combos, orbit, pet). */
  const AUTO={sword:1,gun:1};
  const d1=damage;damage=function(e,base,w){const h=e.hp,dead=e.dead;const r=d1.apply(this,arguments);
    if(m.g&&m.g.set.has(e)){const lost=Math.max(0,h-Math.max(0,e.hp));const k=AUTO[w]?'auto':'skill';m.g.dmg[k]+=lost;if(m.g.t0==null&&lost>0)m.g.t0=m.gt;
      if(!dead&&e.dead){m.g.kill[k]++;if(m.g.one&&m.g.one.live&&k==='skill')m.g.one.kills++}}return r};
  // the class's skills that are open at this level: own book skills (highest first), then the arena ones
  function loadSk(){const me=cls(),own=Object.keys(WSKBOOK.list).filter(id=>WSKBOOK.list[id].cls===me&&wsbOpen(id)).sort((a,b)=>WSKBOOK.list[b].lv-WSKBOOK.list[a].lv);
    const old=Object.keys(WSKBOOK.old).filter(id=>wsbOpen(id)&&id!==wsbWeapon());SAVE.hero.skLoad=own.concat(old).slice(0,WSKBOOK.slots);SAVE.hero.skSeen=wsbIds().slice();wsbSync()}
  // the strongest area skill on the buttons (dmg x radius), for policy 'one'
  function bigSk(){let b=null,bs=-1;for(const id of S.sk.ids){const D=skDef(id);if(D.self&&!D.r)continue;const s=(D.dmg||0)*(D.r||60)*(D.n||1);if(s>bs){bs=s;b=id}}return b}
  window.__cfGroup=(z,n,seed,policy)=>{const G=__cfGroups()[z]||[];if(!G.length)return[];loadSk();const out=[];
    for(let k=0;k<n;k++){if(seed!=null)__cfSeed(seed+k*101);
      for(const x of enemies)x.dead=true;enemies.length=0;
      const i=G[k%G.length],sp=spawnFrom(i).filter(e=>!e.dead);if(!sp.length)continue;for(const e of sp)if(e.affix)e.affix=null;
      const cx=sp.reduce((a,e)=>a+e.x,0)/sp.length,cy=sp.reduce((a,e)=>a+e.y,0)/sp.length;
      for(const a of [Math.PI/2,0,Math.PI,-Math.PI/2,0.8,2.4,-0.8,-2.4]){const x=cx+Math.cos(a)*B.gap*1.4,y=cy+Math.sin(a)*B.gap*1.4;if(typeof tBlocked!=='function'||!tBlocked(x,y)){P.x=x;P.y=y;break}}
      P.hp=P.maxHp;S.cam.x=P.x;S.cam.y=P.y;S.sk.cd=S.sk.cd.map(()=>0);if(S.wsk)S.wsk.shots=[];
      const g=m.g={set:new Set(sp),dmg:{auto:0,skill:0},kill:{auto:0,skill:0},t0:null,casts:0,one:policy==='one'?{live:false,done:false,kills:0}:null};
      m.hin=0;m.gt=0;m.t=sp[0];m.dl=[];m.hits=0;m.first=null;const big=bigSk();
      while(m.gt<B.cap&&sp.some(e=>!e.dead)){
        enemies=enemies.filter(x=>g.set.has(x));
        const live=sp.filter(e=>!e.dead),nn=live.reduce((b,e)=>{const d=Math.hypot(e.x-P.x,e.y-P.y);return d<b.d?{e,d}:b},{e:null,d:1e9});
        const melee=P.weapon==='sword',stop=(melee?28:150)+(nn.e.r||0);
        joy=nn.d>stop?{id:-1,ox:-999,oy:-999,dx:(nn.e.x-P.x)/nn.d,dy:(nn.e.y-P.y)/nn.d}:null;
        const inR=nn.d-nn.e.r<=WORLD.attackRange;
        if(inR&&policy==='skills'){for(const id of S.sk.ids.slice())if(wskUse(id))g.casts++}
        if(inR&&g.one&&!g.one.done&&big){const lx=live.reduce((a,e)=>a+e.x,0)/live.length,ly=live.reduce((a,e)=>a+e.y,0)/live.length;
          const D=Math.hypot(lx-P.x,ly-P.y);if(wskUse(big,{a:Math.atan2(ly-P.y,lx-P.x),len:WSKILL.pull*Math.min(1,D/WORLD.attackRange)})){g.casts++;g.one.done=true;g.one.live=true;g.one.t=m.gt}}
        if(g.one&&g.one.live&&m.gt-g.one.t>4)g.one.live=false;   // what one skill (with its ticks, combos and rings) killed in 4 s
        for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook','ovWDeath'])if($(id)&&!$(id).hidden)$(id).hidden=true;
        S.mode='play';step()}
      const all=g.dmg.auto+g.dmg.skill;
      out.push({n:sp.length,dead:sp.filter(e=>e.dead).length,clear:sp.every(e=>e.dead)&&g.t0!=null?m.gt-g.t0:null,auto:all?g.dmg.auto/all:null,
        kAuto:g.kill.auto,kSkill:g.kill.skill,casts:g.casts,hin:m.hin,oneKill:g.one?g.one.kills/sp.length:null,types:[...new Set(sp.map(e=>e.type))].join('+'),sk:S.sk.ids.join(',')});
      m.g=null;m.t=null;joy=null;for(const e of sp)e.dead=true;enemies=[]}
    return out};
}

const med=a=>{if(!a.length)return null;const b=a.slice().sort((x,y)=>x-y);return b[b.length>>1]};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const sum=r=>{const ok=r.filter(x=>x.ttk!=null);return{n:r.length,dead:ok.length,ttk:avg(ok.map(x=>x.ttk)),hits:avg(ok.map(x=>x.hits)),hin:avg(r.map(x=>x.hin)),dph:med(r.flatMap(x=>x.dl||[])),hp:avg(r.map(x=>x.hp)),types:[...new Set(r.map(x=>x.type))]}};

async function page0(browser){
  const page=await browser.newPage({viewport:CF.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},CF.seed);
  await page.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.waitForTimeout(500);
  return{page,errors};
}

async function runCls(browser,cls){
  const {page,errors}=await page0(browser);
  await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);
  await page.waitForTimeout(300);
  await page.evaluate(install,CF);
  const out={ttk:{},up:{},elite:{},rare:{},heroes:{}};const t0=Date.now();
  for(const reg of CF.regs){
    for(const kind of ['fresh','mid']){
      out.heroes[reg+':'+kind]=await page.evaluate(([r,k])=>__cfHero(r,k),[reg,kind]);
      for(const z of CF.zones)out.ttk[reg+':'+kind+':'+z]=sum(await page.evaluate(([z,n,s])=>__cfZone(z,n,s),[z,CF.n,CF.seed]));
      if(kind==='mid'){out.elite[reg]=sum(await page.evaluate(n=>__cfElite(n,7),CF.n));out.rare[reg]=sum(await page.evaluate(n=>__cfRare(n,7),Math.max(2,CF.n/2|0)))}}
    // one upgrade: fresh hero holding one stat point back is the baseline
    const v={base:{hold:1},aging:{hold:1,plus:1},stat:{},tier:{hold:1,wT:'+1'}};
    for(const k in v){const o=Object.assign({},v[k]);
      if(o.wT==='+1'){const h=await page.evaluate(r=>__cfHero(r,'fresh'),reg);o.wT=h.T+1}
      const h=await page.evaluate(([r,o])=>__cfHero(r,'fresh',o),[reg,o]);
      out.up[reg+':'+k]=Object.assign(sum(await page.evaluate(([z,n,s])=>__cfZone(z,n,s),['near',CF.n*5,CF.seed])),{w:h.w,pts:h.pts})}
    console.log(cls,reg,'done',Math.round((Date.now()-t0)/1000)+'s')}
  out.errors=[...new Set(errors)].slice(0,8);
  await page.close();return out;
}

async function shots(browser,dir){
  const res=[];
  for(const reg of CF.shotRegs){
    const {page}=await page0(browser);
    await page.evaluate(()=>{$('ovStart').hidden=true;heroPick('warrior')});
    await page.waitForTimeout(300);
    await page.evaluate(install,CF);
    await page.evaluate(r=>__cfHero(r,'fresh'),reg);
    // the fx sheets (wtg_*) load from files: wait until they are ready, or the warning is drawn the old way and does not count
    await page.waitForFunction(()=>typeof fxImg==='function'&&['wtg_cone','wtg_line','wtg_circle'].every(id=>fxImg(id)),null,{timeout:20000}).catch(()=>console.log('wtg sheets not loaded'));
    const b=await page.evaluate(()=>__cfBusy(90));
    const f=path.join(dir,'busy-'+reg+'.png');
    await page.screenshot({path:f});
    res.push({reg,file:path.relative(path.resolve(__dirname,'..'),f),info:b});
    await page.close()}
  return res;
}

/* group mode: node tools/combat-feel.js --group [--n 3] [--regs meadow,lake] [--out file.md] [--json file.json] */
async function runGroupCls(browser,cls,n){
  const {page,errors}=await page0(browser);
  await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);
  await page.waitForTimeout(300);
  await page.evaluate(install,CF);
  const out={};const t0=Date.now();
  for(const reg of CF.regs)for(const kind of ['fresh','mid']){
    const h=await page.evaluate(([r,k])=>__cfHero(r,k),[reg,kind]);
    for(const z of CF.zones)for(const pol of ['auto','skills','one'])
      out[reg+':'+kind+':'+z+':'+pol]=Object.assign({L:h.L},{r:await page.evaluate(([z,n,s,p])=>__cfGroup(z,n,s,p),[z,n,CF.seed,pol])});
    console.log(cls,reg,kind,'done',Math.round((Date.now()-t0)/1000)+'s')}
  out.errors=[...new Set(errors)].slice(0,8);await page.close();return out}
function groupReport(out,n){
  const f1=x=>x==null?'-':x.toFixed(1),pct=x=>x==null?'-':Math.round(x*100)+'%';
  const cell=(c,k)=>{const r=out[c][k].r,ok=r.filter(x=>x.clear!=null);return{n:r.length,ok:ok.length,clear:avg(ok.map(x=>x.clear)),auto:avg(r.map(x=>x.auto).filter(x=>x!=null)),
    size:avg(r.map(x=>x.n)),hin:avg(r.map(x=>x.hin)),kpc:(()=>{const c2=r.reduce((a,x)=>a+x.casts,0);return c2?r.reduce((a,x)=>a+x.kSkill,0)/c2:null})(),one:avg(r.map(x=>x.oneKill).filter(x=>x!=null)),sk:r[0]&&r[0].sk}};
  const L=['# Group fights, measured','','Tool: `node tools/combat-feel.js --group` (seed '+CF.seed+', '+n+' groups per cell, 2D). Concept: [concept-combat-drama.md](concept-combat-drama.md).',
    'A whole real group (affixes removed), hero starts ~300px away, cannot die. **clear** = seconds from first hit to the last death. **auto%** = share of the damage done by auto-attack. **k/cast** = kills by skills per skill cast. **one** = share of the group killed by ONE area skill (policy one). **taken** = health bars lost.',
    'Policies: auto = no skills · skills = every skill as soon as it is ready · one = one area skill at the group centre, then auto.',''];
  for(const c of CF.cls){L.push('## '+c,'','| region | hero | zone | size | auto: clear s | skills: clear s · auto% · k/cast · taken | one: clear s · one-kill | skills |','|---|---|---|---|---|---|---|---|');
    for(const reg of CF.regs)for(const kind of ['fresh','mid'])for(const z of CF.zones){const k=reg+':'+kind+':'+z,a=cell(c,k+':auto'),s=cell(c,k+':skills'),o=cell(c,k+':one');
      const w=x=>x.ok<x.n?' ⚠'+(x.n-x.ok):'';
      L.push(`| ${reg} | ${kind} ${out[c][k+':auto'].L} | ${z} | ${f1(a.size)} | ${f1(a.clear)}${w(a)} | ${f1(s.clear)}${w(s)} · ${pct(s.auto)} · ${f1(s.kpc)} · ${f1(s.hin)} | ${f1(o.clear)}${w(o)} · ${pct(o.one)} | ${s.sk||'-'} |`)}
    L.push('')}
  // summary per class: averages over all cells
  L.push('## Summary (average over regions)','','| class | hero | auto clear s | skills clear s | skills auto% | one-kill | taken (skills) |','|---|---|---|---|---|---|---|');
  for(const c of CF.cls)for(const kind of ['fresh','mid']){const ks=CF.regs.flatMap(r=>CF.zones.map(z=>r+':'+kind+':'+z));const A=p=>ks.map(k=>cell(c,k+':'+p));
    const av=(p,f)=>avg(A(p).map(f).filter(x=>x!=null));
    L.push(`| ${c} | ${kind} | ${f1(av('auto',x=>x.clear))} | ${f1(av('skills',x=>x.clear))} | ${pct(av('skills',x=>x.auto))} | ${pct(av('one',x=>x.one))} | ${f1(av('skills',x=>x.hin))} |`)}
  const errs=CF.cls.flatMap(c=>out[c].errors);if(errs.length)L.push('','Console errors: '+[...new Set(errs)].join(' | '));
  return L.join('\n')+'\n'}
if(require.main===module&&opt('group'))(async()=>{
  const n=+(opt('n')||3);const browser=await chromium.launch();
  const res=await Promise.all(CF.cls.map(c=>runGroupCls(browser,c,n)));await browser.close();
  const out={};CF.cls.forEach((c,i)=>out[c]=res[i]);const md=groupReport(out,n);
  const o=opt('out');if(o)fs.writeFileSync(o,md);console.log(md);const j=opt('json');if(j)fs.writeFileSync(j,JSON.stringify(out,null,1));
})();
else if(require.main===module)(async()=>{
  const browser=await chromium.launch();
  const shotDir=path.resolve(opt('shots')||path.join(__dirname,'..','docs','combat-feel'));fs.mkdirSync(shotDir,{recursive:true});
  const [res,sh]=await Promise.all([opt('onlyshots')?[]:Promise.all(CF.cls.map(c=>runCls(browser,c))),opt('noshots')?[]:shots(browser,shotDir)]);
  if(opt('onlyshots')){await browser.close();for(const s of sh)console.log(s.reg,s.file,JSON.stringify(s.info));return}
  await browser.close();
  const out={};CF.cls.forEach((c,i)=>out[c]=res[i]);
  const f1=x=>x==null?'-':x.toFixed(1),f0=x=>x==null?'-':Math.round(x)+'',pc=(a,b)=>a&&b?((b-a)/a*100>=0?'+':'')+Math.round((b-a)/a*100)+'%':'-';
  const L=[];
  L.push('# Combat feel, measured (8.11.2026)','',
    'Tool: `node tools/combat-feel.js` (seed '+CF.seed+', '+CF.n+' duels per cell, 2D). Background: [research-xphero.md](research-xphero.md).',
    'Duel = one enemy alone, hero walks in from 220px, **auto-attack only** (no skill buttons), hero cannot die. TTK = seconds from first hit to death. "Hits" = hits that took HP. "Taken" = damage the hero took during the fight, in full health bars.',
    'Heroes: **fresh** = region entry level, gear one tier below what that level may wear. **mid** = next region\'s level, best tier it may wear. Points spent like tools/balance-world.js.','');
  L.push('## 1. Time-to-kill, ordinary enemies','');
  for(const c of CF.cls){L.push('### '+c,'','| region | hero | lv / tier | start TTK s (hits) | near | far | taken (start/near/far) |','|---|---|---|---|---|---|---|');
    for(const reg of CF.regs)for(const kind of ['fresh','mid']){const h=out[c].heroes[reg+':'+kind],z=CF.zones.map(z=>out[c].ttk[reg+':'+kind+':'+z]);
      L.push(`| ${reg} | ${kind} | ${h.L} / ${h.T} | `+z.map(s=>`${f1(s.ttk)} (${f0(s.hits)})${s.dead<s.n?' ⚠'+(s.n-s.dead)+' alive':''}`).join(' | ')+' | '+z.map(s=>f1(s.hin)).join(' / ')+' |')}
    L.push('')}
  // average over classes
  L.push('### All classes, average TTK (s)','','| region | fresh start | fresh near | fresh far | mid start | mid near | mid far |','|---|---|---|---|---|---|---|');
  for(const reg of CF.regs){const cell=(k,z)=>f1(avg(CF.cls.map(c=>out[c].ttk[reg+':'+k+':'+z].ttk).filter(x=>x!=null)));
    L.push(`| ${reg} | ${cell('fresh','start')} | ${cell('fresh','near')} | ${cell('fresh','far')} | ${cell('mid','start')} | ${cell('mid','near')} | ${cell('mid','far')} |`)}
  L.push('','### Elites and rares (mid hero)','','Elite = a far-zone foe with a forced affix (each affix in turn). Rare = the region\'s rare monster (RARES).','','| region | '+CF.cls.map(c=>c+' elite TTK (hits)').join(' | ')+' | '+CF.cls.map(c=>c+' rare TTK (hits)').join(' | ')+' |','|---|'+CF.cls.map(()=>'---|').join('')+CF.cls.map(()=>'---|').join(''));
  for(const reg of CF.regs)L.push(`| ${reg} | `+CF.cls.map(c=>{const s=out[c].elite[reg];return `${f1(s.ttk)} (${f0(s.hits)})`}).join(' | ')+' | '+CF.cls.map(c=>{const s=out[c].rare[reg];return s.n?`${f1(s.ttk)} (${f0(s.hits)})${s.dead<s.n?' ⚠':''}`:'-'}).join(' | ')+' |');
  L.push('','## 2. Does one upgrade show in the next fight?','','Fresh hero, near zone. Baseline holds one stat point back. Each cell: change in median damage per non-final hit / in hits to kill / in TTK (same enemies, same seed). Negative hits and TTK = faster.','',
    '| region | class | base TTK s (hits, dmg/hit) | +1 aging | +1 stat point | +1 weapon tier |','|---|---|---|---|---|---|');
  for(const reg of CF.regs)for(const c of CF.cls){const u=k=>out[c].up[reg+':'+k],b=u('base');
    L.push(`| ${reg} | ${c} | ${f1(b.ttk)} (${f1(b.hits)}, ${f0(b.dph)}) | `+['aging','stat','tier'].map(k=>`${pc(b.dph,u(k).dph)} dmg · ${pc(b.hits,u(k).hits)} hits · ${pc(b.ttk,u(k).ttk)} TTK`).join(' | ')+' |')}
  L.push('','## 3. Danger readability (phone, landscape 844x390, 2D)','');
  for(const s of sh)L.push(`- **${s.reg}**: \`${s.file}\` · `+(s.info?`warning on at ${s.info.t}s: ${s.info.warn.join(', ')}, ${s.info.near} enemies within 330px`:'no floor warning appeared in 90s (picture taken anyway)'));
  const errs=CF.cls.flatMap(c=>out[c].errors);if(errs.length)L.push('','Console errors: '+[...new Set(errs)].join(' | '));
  const md=L.join('\n')+'\n';
  const o=opt('out');if(o)fs.writeFileSync(o,md);console.log(md);
  const j=opt('json');if(j)fs.writeFileSync(j,JSON.stringify({out,sh},null,1));
})();
