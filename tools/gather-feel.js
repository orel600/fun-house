/* Gathering feel (11.11.2026, Nir: "resources vanish in one hit, you don't get your money's worth"). MEASUREMENT ONLY, changes nothing in the game.
   A hero walks to the nearest live resource node in one zone (start / near / far) of a region, auto-attacks it until it breaks, and goes to the next.
   Enemies are set aside every frame. Measures per zone: hits per node, seconds per node (first hit to break), and resources per minute
   (everything the nodes dropped, counted at dropSpawn, so the economy number does not depend on walking over the loot).
   Heroes: level 1 (fresh) and level 37 (Nir's video), gathering tools tier 1 and tier 5 (gtool.js).
   Run: node tools/gather-feel.js [--cls warrior,hunter] [--regs meadow] [--secs 120] [--seed 7] [--json out.json] [--shots dir]
   --shots dir: 3D frame strip (915x412) of a level-37 hero hitting a rock. Not run on GitHub. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);if(i<0)return null;const v=args[i+1];return v&&!v.startsWith('--')?v:true};
const GF={
  cls:(opt('cls')||'warrior,hunter').split(','),
  regs:(opt('regs')||'meadow').split(','),
  secs:+(opt('secs')||120),
  seed:+(opt('seed')||7),
  heroes:[{lv:1,tool:1},{lv:37,tool:1},{lv:37,tool:5}],
  pts:{warrior:['str','vit','str','def'],hunter:['agi','str','agi','vit'],mage:['haste','str','haste','vit']},
  phone:{width:915,height:412}
};

function install(B){
  const m=window.__gf={hits:0,got:{},cur:null};
  frame=function(){};
  const d0=damage;damage=function(e){const h=e.hp,dead=e.dead;const r=d0.apply(this,arguments);
    if(e.node&&!dead&&e.hp<h){const q=e.__gf&&e.__gf.g===m.gen?e.__gf:(e.__gf={g:m.gen,hits:0,t0:m.gt});q.hits++;if(e===m.cur)m.hits++;if(e.dead||e.hp<=0){(m.per||[]).push({hits:q.hits,t:m.gt-q.t0,kind:e.kind});e.__gf=null}}return r};
  const ds=dropSpawn;dropSpawn=function(r,n){m.got[r]=(m.got[r]||0)+n;return ds.apply(this,arguments)};
  hurt=function(){};
  const cls=()=>heroId();
  const xpTo=L=>{let x=0;for(let l=1;l<L;l++)x+=rankNeed(l);return x};
  window.__gfSeed=seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
  window.__gfHero=(reg,L,tool)=>{
    SAVE.hero.level=L;SAVE.hero.xp=xpTo(L);SAVE.hero.pts={};SAVE.hero.tree={};
    const plan=B.pts[cls()];const n=Math.max(0,(L-1)*STATS.perLevel);for(let i=0;i<n;i++){const k=plan[i%plan.length];stPts()[k]=(stPts()[k]||0)+1}
    const br={warrior:'war',hunter:'hunt',mage:'mage'}[cls()];for(let g=0;g<9&&trFree()>0;g++)if(!treeLearn(br))break;
    SAVE.gt={axe:tool,hammer:tool,job:{}};SAVE.gm={wood:0,stone:0,plant:0};
    worldUi(false);enterWorld('home',reg);return{L,maxHp:Math.round(P.maxHp)}};
  const step=()=>{last=performance.now()-50;frameStep(performance.now());m.gt+=0.05};
  window.__gfStep=step;
  // secs of gathering in zone z: nearest live node in the zone, hit until broken, next
  window.__gfZone=(z,secs)=>{
    const R=WR(),inZ=n=>{const Z=wZone(n);return Z&&Z.id===z};
    if(!S.nd.list.some(n=>!n.dead&&inZ(n)))return null;
    m.got={};m.gt=0;m.gen=(m.gen||0)+1;const per=m.per=[];let cur=null;
    const start=S.nd.list.filter(n=>!n.dead&&inZ(n)).sort((a,b)=>Math.hypot(a.x-R.home.x,a.y-R.home.y)-Math.hypot(b.x-R.home.x,b.y-R.home.y))[0];
    P.x=start.x-start.r-P.r-40;P.y=start.y;S.cam.x=P.x;S.cam.y=P.y;
    while(m.gt<secs){
      enemies.length=0;
      if(!cur||cur.dead||cur.hp<=0){
        cur=S.nd.list.filter(n=>!n.dead&&n.hp>0&&inZ(n)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0]||null;
        m.cur=cur;m.hits=0}
      if(cur){const d=Math.hypot(cur.x-P.x,cur.y-P.y)||1,stop=cur.r+P.r+18;joy=d>stop?{id:-1,ox:-999,oy:-999,dx:(cur.x-P.x)/d,dy:(cur.y-P.y)/d}:null}
      else joy=null;
      for(const id of ['npcDlg','qLog','ovGear','ovDaily','ovWelcome','ovBook','ovWDeath','ovTips'])if($(id)&&!$(id).hidden)$(id).hidden=true;
      S.mode='play';step()}
    joy=null;
    return{per,got:m.got,secs}};
}

const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
async function page0(browser,gfx){
  const page=await browser.newPage({viewport:GF.phone,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(seed=>{let a=seed>>>0;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},GF.seed);
  await page.addInitScript(g=>{try{localStorage.setItem('zm-gfx',g)}catch(e){}},gfx);
  await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.waitForTimeout(500);
  return{page,errors};
}

async function runCls(browser,cls){
  const {page,errors}=await page0(browser,'2d');
  await page.evaluate(c=>{$('ovStart').hidden=true;heroPick(c)},cls);
  await page.waitForTimeout(300);
  await page.evaluate(install,GF);
  if(opt('off'))await page.evaluate(()=>{GHITS.off=true});   // the "before" numbers, on the same code
  const out={};
  for(const reg of GF.regs)for(const h of GF.heroes)for(const z of ['start','near','far']){
    await page.evaluate(s=>__gfSeed(s),GF.seed);
    await page.evaluate(([r,L,t])=>__gfHero(r,L,t),[reg,h.lv,h.tool]);
    const r=await page.evaluate(([z,s])=>__gfZone(z,s),[z,GF.secs]);
    out[reg+':L'+h.lv+':T'+h.tool+':'+z]=r}
  out.errors=[...new Set(errors)].slice(0,8);await page.close();return out;
}

// 3D frame strip: a level-37 hero hits a rock, a shot after every hit
async function shots(browser,dir){
  fs.mkdirSync(dir,{recursive:true});
  const {page}=await page0(browser,'3d');
  await page.evaluate(()=>{$('ovStart').hidden=true;heroPick('warrior')});
  await page.waitForTimeout(300);
  await page.evaluate(install,GF);
  await page.evaluate(()=>__gfHero('meadow',37,1));
  await page.waitForFunction(()=>R3D.on&&R3D.ready,null,{timeout:60000}).catch(()=>console.log('3D not ready'));
  const info=await page.evaluate(()=>{const R=WR(),rk=S.nd.list.filter(n=>!n.dead&&wKind(n.kind).shape==='rock').sort((a,b)=>Math.hypot(a.x-R.home.x,a.y-R.home.y)-Math.hypot(b.x-R.home.x,b.y-R.home.y))[0];
    window.__gfRock=rk;P.x=rk.x-rk.r-P.r-6;P.y=rk.y+4;S.cam.x=P.x;S.cam.y=P.y;enemies.length=0;__gf.cur=rk;__gf.hits=0;return{kind:rk.kind,hp:rk.max}});
  const files=[];let k=0;
  for(let i=0;i<60&&k<8;i++){
    const r=await page.evaluate(()=>{const h0=__gf.hits;let n=0;while(__gf.hits===h0&&!__gfRock.dead&&n<40){enemies.length=0;joy=null;S.mode='play';__gfStep();n++}
      for(let j=0;j<3;j++){enemies.length=0;S.mode='play';__gfStep()}R3D.drawEvery=1;render();return{hits:__gf.hits,hp:Math.max(0,Math.round(__gfRock.hp)),dead:!!__gfRock.dead}});
    await page.waitForTimeout(120);
    const f=path.join(dir,'hit'+(k+1)+'.png');await page.screenshot({path:f});files.push({f,...r});k++;
    if(r.dead)break}
  await page.close();return{info,files};
}

(async()=>{
  const browser=await chromium.launch();
  if(opt('shots')){const r=await shots(browser,path.resolve(opt('shots')));console.log(JSON.stringify(r,null,1));await browser.close();return}
  const all={};
  await Promise.all(GF.cls.map(async c=>{all[c]=await runCls(browser,c)}));
  await browser.close();
  if(opt('json'))fs.writeFileSync(opt('json'),JSON.stringify(all,null,1));
  for(const c of GF.cls){console.log('##',c);
    for(const k in all[c]){if(k==='errors')continue;const r=all[c][k];if(!r){console.log(k,'no nodes');continue}
      const tot=Object.values(r.got).reduce((s,x)=>s+x,0),pm=x=>Math.round(x*60/r.secs);
      const main=['wood','stone','herb','copper','iron'].map(x=>x+' '+pm(r.got[x]||0)).join(' ');
      console.log(k.padEnd(24),'nodes',r.per.length,'hits',(avg(r.per.map(p=>p.hits))||0).toFixed(1),'min',Math.min(...r.per.map(p=>p.hits)),'s/node',(avg(r.per.map(p=>p.t))||0).toFixed(2),'| /min all',pm(tot),'|',main)}
    if(all[c].errors.length)console.log('errors:',all[c].errors.join(' | '))}
})();
