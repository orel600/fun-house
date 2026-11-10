/* NOVA hooks fixture run (local, real GPU). node tools/nova-test.js [--out <dir>] [--gpu 0|1]
   1. writes the procedural fixture into the (untracked) private-assets/ folder, 2. runs the game with ?nova=1 and drives every hook, 3. runs ?nova=0 for the flag-off identity and a frame-time note.
   Prints a plain report (JSON). Nothing here is shipped; the fixture is not art. */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),A=process.argv,arg=(k,d)=>{const i=A.indexOf('--'+k);return i>=0?A[i+1]:d};
const OUT=arg('out',path.join(root,'nova-test-out')),GPU=arg('gpu','1')==='1';fs.mkdirSync(OUT,{recursive:true});
cp.execFileSync(process.execPath,[path.join(__dirname,'nova-fixture.js'),path.join(root,'private-assets')],{stdio:'inherit'});
(async()=>{const b=await chromium.launch({args:GPU?['--use-angle=d3d11','--ignore-gpu-blocklist','--force_high_performance_gpu']:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
async function open(q){const p=await b.newPage({viewport:{width:844,height:390},deviceScaleFactor:1});const errs=[],reqs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('requestfailed',r=>reqs.push(r.url()));
  await p.addInitScript(()=>{localStorage.setItem('zm-gfx','3d');localStorage.setItem('fh-lang','en');localStorage.setItem('fh-mb-tips','99');let a=7;window.__rs=v=>{a=v};Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
  await p.clock.install({time:0});await p.clock.pauseAt(1000);await p.goto('file:///'+root.split(path.sep).join('/').replace(/ /g,'%20')+'/index.html'+(q?'?'+q:''));
  for(let i=0;i<400;i++){await p.clock.runFor(50);if(await p.evaluate(()=>typeof R3D!=='undefined'&&R3D.ready))break;await p.waitForTimeout(40)}
  p.errs=errs;p.reqs=reqs;return p}
const result={};
// ---------- flag off ----------
{const p=await open('');const o=await p.evaluate(()=>({enabled:MBNOVA.enabled,report:MBNOVA.report(),regSize:MBNOVA.reg.size,rigLoaded:typeof MBNR!=='undefined',scripts:[...document.scripts].map(s=>s.src.split('/').pop()).filter(s=>/nova|private/.test(s))}));
  result.flagOff={...o,errors:p.errs};await p.evaluate(()=>{__rs(7);mobaStart('tank');MB.me.bot={t:0,mode:'push'}});
  for(let i=0;i<300;i++)await p.clock.runFor(1000/60);const t0=Date.now();for(let i=0;i<900;i++)await p.clock.runFor(1000/60);result.flagOff.wallMs900=Date.now()-t0;
  result.flagOff.sig=await p.evaluate(()=>({t:+MB.t.toFixed(3),me:[+MB.me.x.toFixed(2),+MB.me.y.toFixed(2),+MB.me.hp.toFixed(1)],units:MB.u.length,score:MB.score.join('-')}));await p.close()}
// ---------- flag on ----------
const p=await open('nova=1');
await p.evaluate(()=>{window.__ev=[];MBNOVA.on('launch',e=>__ev.push(['launch',e.kind,e.src.id,e.tgt&&e.tgt.id,+e.t.toFixed(3),!!e.anchors&&!!e.anchors.tip,!!e.shot]));MBNOVA.on('impact',e=>__ev.push(['impact',e.kind,e.src&&e.src.id,e.tgt&&e.tgt.id,+e.t.toFixed(3),!!e.anchors&&!!e.anchors.tip]))});
for(let i=0;i<300;i++){await p.clock.runFor(50);const st=await p.evaluate(()=>{const r=MBNOVA.report();return {put:r.stat.put,decoded:r.stat.decoded,failed:r.stat.failed,rig:r.rig&&r.rig.kits&&r.rig.kits.tank&&r.rig.kits.tank.state}});if(st.rig==='ready'||st.failed)break;await p.waitForTimeout(20)}
result.load=await p.evaluate(()=>{const r=MBNOVA.report();return {stat:r.stat,missing:r.missingScripts,assets:r.assets.map(a=>({role:a.role,state:a.state,ms:a.decodeMs,tris:a.info&&a.info.triangles,bones:a.info&&a.info.bones,inf:a.info&&a.info.maxInfluences,compat:a.compat&&a.compat.targeted,compatReasons:a.compat&&a.compat.reasons,warn:a.warnings,size:a.size,err:a.err})),rig:r.rig,warnings:r.warnings}});
// the game: the player is a tank (the slot), bots play, then check the actor
await p.evaluate(()=>{__rs(7);mobaStart('tank');MB.me.bot={t:0,mode:'push'}});
for(let i=0;i<300;i++)await p.clock.runFor(1000/60);const t0=Date.now();
for(let i=0;i<900;i++){await p.clock.runFor(1000/60)}
result.wallMs900=Date.now()-t0;
// force a melee attack: an enemy hero placed next to the player (the bot AI attacks, damage stays synchronous with atkT)
await p.evaluate(()=>{const t=MB.u.find(x=>x.team!==MB.me.team&&!x.dead&&x.k==='hero');t.x=MB.me.x+50;t.y=MB.me.y;t.hp=t.max=1e6;window.__tgt=t});
for(let i=0;i<240;i++)await p.clock.runFor(1000/60);
await p.screenshot({path:path.join(OUT,'nova-fixture-attack.png')});
result.game=await p.evaluate(()=>{const pl=R3D.player,L=pl&&pl.L;const ev=window.__ev;const kinds={};for(const e of ev)kinds[e[0]+':'+e[1]]=(kinds[e[0]+':'+e[1]]||0)+1;
  const tankBots=[...R3D.actors].filter(([e,a])=>e.kit==='tank'&&e!==MB.me).map(([e,a])=>!!(a.L&&a.L.nova));
  return {playerNova:!!(L&&L.nova),playerModel:L&&L.model,props:pl?Object.keys(pl.props):null,anim:L&&L.anim,botTanksOnNova:tankBots,tmplH:R3D.tmpl.nova_tank&&R3D.tmpl.nova_tank.userData.h,
    clips:Object.keys(R3D.clips).filter(k=>k.startsWith('nova_')),eventCounts:kinds,eventSample:ev.slice(0,6),projectileLaunchToImpactSec:(()=>{const l=ev.filter(e=>e[0]==='launch'&&e[1]==='projectile'),im=ev.filter(e=>e[0]==='impact'&&e[1]==='projectile'),d=[];for(const x of l){const y=im.find(z=>z[2]===x[2]&&z[3]===x[3]&&z[4]>=x[4]);if(y)d.push(+(y[4]-x[4]).toFixed(3))}return d})(),meleeUnmatched:ev.filter(e=>e[0]==='launch'&&e[1]==='melee'&&!ev.some(z=>z[0]==='impact'&&z[1]==='melee'&&z[2]===e[2]&&z[4]===e[4])).slice(0,4).map(e=>({launch:e,nextImpact:ev.find(z=>z[0]==='impact'&&z[2]===e[2]&&z[4]>e[4]),kit:MB.u.find(u=>u.id===e[2]).kit})),meleeSameTick:(()=>{const l=ev.filter(e=>e[0]==='launch'&&e[1]==='melee');return l.every(x=>ev.some(z=>z[0]==='impact'&&z[1]==='melee'&&z[2]===x[2]&&z[4]===x[4]))})(),atkCfg:MBATK3D.kit.tank,loopsOnces:{loops:MBNR.stat.loops,onces:MBNR.stat.onces},
    sig:{t:+MB.t.toFixed(3),me:[+MB.me.x.toFixed(2),+MB.me.y.toFixed(2),+MB.me.hp.toFixed(1)],units:MB.u.length,score:MB.score.join('-')}}});
// contact data during an attack of the player (force an attack on the nearest enemy and read the post-mixer contact)
result.contact=await p.evaluate(async()=>{const u=MB.me;const out=[];const tgt=MB.u.find(x=>x.team!==u.team&&!x.dead&&x.k==='hero');if(!tgt)return {err:'no target'};u.bot=null;u.tgt=tgt;
  const c=MBNOVA.contact(u);return {haveActor:!!(R3D.player),unitHasContact:!!c,base:c&&c.base&&c.base.s.map(x=>+x.toFixed(1)),tip:c&&c.tip&&c.tip.s.map(x=>+x.toFixed(1)),tip2:c&&c.tip2&&c.tip2.s.map(x=>+x.toFixed(1)),target:c&&c.target&&{center:c.target.center.s.map(x=>+x.toFixed(1)),top:c.target.top.s.map(x=>+x.toFixed(1))},world:c&&c.tip&&c.tip.w.map(x=>+x.toFixed(2)),bones:MBNOVA.bones(u,['mixamorig:RightHand','mixamorig:Hips'])}});
// scene slot (instanced tile), glyph, floor/light data hooks
result.slots=await p.evaluate(()=>{const ok=MBNOVA.scene.add('tiles',{role:'terrace.tile',instances:[{pos:[0,0.01,0]},{pos:[120,0.01,0],scale:[40,1,40]},{pos:[-120,0.01,0],rot:[0,0.5,0],scale:[40,1,40]}],layer:'floor'});MBNOVA.scene.flush();
  const gl=MBNOVA.glyph.get('test');MBNOVA.glyph.css();const fl=MBNOVA.floor({stone:'#556677'}),li=MBNOVA.light({hemi:1.2});
  return {sceneAdd:ok,list:MBNOVA.scene.list(),inScene:R3D.scene.children.length,glyph:gl&&{w:gl.w,h:gl.h,url:gl.url.slice(0,22)},cssRule:!!document.getElementById('novaGlyphCss')&&document.getElementById('novaGlyphCss').textContent.includes('.nova-glyph-test'),floor:fl,floorOn:MBFLOOR.on,light:li,hemi:MBSCENE.light.hemi,removed:MBNOVA.scene.remove('tiles')}});
// binding report (clips resolved/total) and a screenshot
result.rig=await p.evaluate(()=>MBNOVA.report().rig);
await p.screenshot({path:path.join(OUT,'nova-fixture-game.png')});
await p.evaluate(()=>{MBNOVA.scene.remove('tiles')});
result.errorsOn=p.errs;result.failedRequests=p.reqs.slice(0,5);
fs.writeFileSync(path.join(OUT,'nova-test-report.json'),JSON.stringify(result,null,1));console.log(JSON.stringify(result,null,1));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
