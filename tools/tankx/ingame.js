// ARI 9.11: צילום במשחק (מצלמה, תאורה וזום של משחקי השאול) של הטנק הישן מול tankX, ברזולוציה מקורית של הטלפון.
// node ingame.js <repo> <outdir> [--gpu]   variants: old, x (as in game), noemis (emK 0), neutral (grey lambert), plus look overrides in VARS
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),GPU=require('../gpu.js');
const repo=process.argv[2],out=process.argv[3];
const VARS=JSON.parse(process.env.VARS||'null')||[
 {n:'old',on:false},
 {n:'x',on:true},
 {n:'x_noemis',on:true,look:{emK:0,emMax:0}},
 {n:'x_neutral',on:true,neutral:true}];
const POSES=(process.env.POSES||'idle,attack').split(',');
(async()=>{fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(GPU.launchOpts(GPU.gpuOn()?['--allow-file-access-from-files']:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']));
 const W=+process.env.VW||844,H=+process.env.VH||390,DS=+process.env.DS||3;
 const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:DS,isMobile:true,hasTouch:true});
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
 await p.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
 await p.addInitScript(()=>{try{localStorage.setItem('zm-gfx','3d')}catch(e){}});
 await p.clock.install({time:0});await p.clock.pauseAt(1000);
 await p.goto('file:///'+path.resolve(repo,'index.html').split(path.sep).join('/')+'?tankx=1');
 await p.clock.runFor(300);
 console.log('gl',await p.evaluate(()=>{try{const g=document.createElement('canvas').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL)}catch(e){return String(e)}}));
 await p.evaluate(()=>{mobaStart('tank');MB.waveT=1e9});
 await p.evaluate(()=>{m3dGo(MBTANKX.model);m3dGo(MBTANKX.hammer.prop)});
 for(let i=0;i<300;i++){if(await p.evaluate(()=>m3dReady(MBTANKX.model)&&m3dReady(MBTANKX.hammer.prop)))break;await p.clock.runFor(100)}
 const base=await p.evaluate(()=>{const s0=JSON.stringify(MBTANKX.look);window.__look0=s0;return s0});
 for(const v of VARS)for(const pose of POSES){
  await p.evaluate(([v,base])=>{
   mbBot=function(){};banner=function(){};document.getElementById('banner').hidden=true;MB.over=false;MB.zones.length=0;MB.shots.length=0;MB.walls.length=0;MB.fx.length=0;MB.floats.length=0;fxClear();S.shake=0;
   MB.u=MB.u.filter(u=>u.k==='tower'||u.k==='base');
   const h=mbHero('tank',0,true,0);h.x=0;h.y=0;h.face=h.aim=0;MB.u.unshift(h);MB.me=h;
   const e=mbHero('tank',1,false,0);e.x=130;e.y=0;e.hp=e.max=1e6;MB.u.push(e);window.__e=e;window.__h=h;
   const e2=mbHero('warrior',1,false,1);e2.x=130;e2.y=-90;e2.hp=e2.max=1e6;MB.u.push(e2);
   P.x=h.x;P.y=h.y;S.cam.x=h.x+60;S.cam.y=h.y;
   MBTANKX.on=v.on;if(v.size)MBTANKX.size=v.size;else MBTANKX.size=1.15;Object.assign(MBTANKX.look,JSON.parse(base),v.look||{});
   for(const a of R3D.actors.values()){R3D.actors.delete(a.e)} },[v,base]);
  await p.clock.runFor(34);
  // רגע: מחכים שהדמות תיבנה מחדש
  await p.clock.runFor(400);
  if(pose==='attack'){await p.evaluate(()=>{const h=window.__h,e=window.__e;h.atkT=0;mbAttack(h,0,e,MBKIT[h.kit].atk)});await p.clock.runFor(220)}
  if(pose==='run'){await p.evaluate(()=>{const h=window.__h;h.vx=300;});await p.clock.runFor(300)}
  if(v.neutral)await p.evaluate(()=>{for(const a of R3D.actors.values())for(const m of a.mats){m.map=null;m.emissiveMap=null;m.color.set('#808080');m.emissive.set('#000000');m.needsUpdate=true}if(R3D.player)for(const m of R3D.player.mats){m.map=null;m.emissiveMap=null;m.color.set('#808080');m.emissive.set('#000000');m.needsUpdate=true}});
  await p.evaluate(()=>{MB.floats.length=0});await p.clock.runFor(34);
  if(process.env.PROBE)console.log(v.n,pose,JSON.stringify(await p.evaluate(()=>{const o={};const bx=(r)=>{const b=new THREE.Box3().setFromObject(r);return[b.min,b.max].map(v=>[v.x,v.y,v.z].map(x=>+x.toFixed(2)))};
   for(const [nm,a] of [['me',R3D.player],['en',R3D.actors.get(window.__e)]]){if(!a)continue;const r={props:Object.keys(a.props||{}),L:a.L&&a.L.model,scale:+a.root.scale.x.toFixed(3)};
    r.body=bx(a.root);for(const k in a.props||{}){const m=a.props[k];r[k]={vis:m.visible,box:bx(m),par:m.parent&&m.parent.name}}o[nm]=r}return o})));
  const f=path.join(out,v.n+'_'+pose+'.png');await p.screenshot({path:f});console.log(f);
  }
 console.log(JSON.stringify({errs:errs.slice(0,5),stat:await p.evaluate(()=>MBTANKX.stat)}));
 await b.close()})();
