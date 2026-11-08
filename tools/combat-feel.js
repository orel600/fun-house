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

if(require.main===module)(async()=>{
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
