/* Hit-flash colour audit (Nir, 10.11.2026: "do this for all monsters and bosses"). Not part of the game or of the regular check.
   For every enemy look in the world (LOOK3D: regular, elites, wanted, rares, wardens, world giants), at the game camera in daylight:
   - no hit: the real pixels of the model (a mask from rendering with and without it), mean saturation S0
   - mid-fight: 2 s at 120 fps (Nir's phone) with a hit every 0.1 s (auto attack + orbit wisps), the emissive of every frame
     from the game's own code (syncEnemy), and the saturation of the pixels at that emissive. avg = the time average
   - drop = 1 - avg/S0. Also flags looks that are pale with no hit at all (low S0 and no texture or paint).
   Run:      node tools/flash-audit.js [--out dir] [--only type,type]   (3D in swiftshader, a few minutes)
   Output:   <out>/flash-audit.json, a contact sheet <out>/flash-sheet.png (no hit | strongest blink, per type), and a table */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const args=process.argv.slice(2),opt=k=>{const i=args.indexOf('--'+k);return i<0?null:args[i+1]};
const OUT=path.resolve(opt('out')||path.join(__dirname,'flash-shots'));fs.mkdirSync(OUT,{recursive:true});
const ROOT=path.resolve(opt('root')||path.join(__dirname,'..'));
const ONLY=opt('only')?opt('only').split(','):null;

// runs in the page: the looks to test
function looksToTest(only){
  const ks=new Set();
  for(const t in ETYPES)if(LOOK3D[t]&&LOOK3D[t].model)ks.add('t:'+t);
  for(const k in STORY.lanterns)ks.add('g:'+k);
  if(LOOK3D.wanted)ks.add('w:wanted');
  return [...ks].filter(k=>!only||only.includes(k.slice(2)));
}
// runs in the page: spawn one look in front of the hero, in the meadow, and measure it. Returns null until its model is loaded
function measureLook(key){
  const [kind,id]=[key[0],key.slice(2)];
  const reg=kind==='g'?STORY.lanterns[id].reg:'meadow';if(!S.wd||S.wd.reg!==reg){enterWorld('home',reg);window.__fa=null}
  P.maxHp=P.hp=1e9;P.inv=1e9;
  let e=window.__fa&&window.__fa.key===key?window.__fa.e:null;
  if(!e){for(const o of enemies)o.dead=true;enemies=enemies.filter(o=>!o.dead);if(S.wd.warden){S.wd.warden.dead=true;S.wd.warden=null}
    if(kind==='g'){const L=STORY.lanterns[id];P.x=L.x;P.y=L.y-160;e=storyWarden(id,L.y+70);e.rise=0}
    else{const t=kind==='w'?Object.keys(ETYPES)[0]:id;e=addEnemy(t,P.x,P.y-110,1e6);if(kind==='w')e.wanted=true}
    e.peace=1;e.speed=0;window.__fa={key,e}}
  e.x=P.x;e.y=e.wboss?P.y+e.r+60:P.y-110;e.flash=0;e.act=null;e.tel=null;e.dash=null;
  const L=lookOf(e);if(!L)return {key,err:'no 3D look'};if(!m3dReady(L.model)){render();return null}
  render();const a=R3D.actors.get(e);if(!a)return null;
  const r=R3D.r,gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;
  const shot=()=>{r.render(R3D.scene,R3D.cam);const px=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);return px};
  const sat=(px,mask)=>{let s=0,v=0,n=0;for(const i of mask){const R=px[i],G=px[i+1],B=px[i+2],mx=Math.max(R,G,B),mn=Math.min(R,G,B);s+=mx?(mx-mn)/mx:0;v+=mx/255;n++}return n?{s:s/n,v:v/n,n}:{s:0,v:0,n:0}};
  setFlash(a,0);a.root.visible=false;const bg=shot();a.root.visible=true;const p0=shot();
  const mask=[];for(let i=0;i<p0.length;i+=4)if(Math.abs(p0[i]-bg[i])+Math.abs(p0[i+1]-bg[i+1])+Math.abs(p0[i+2]-bg[i+2])>30)mask.push(i);
  const base=sat(p0,mask);
  // the fight: the game's own flash code, frame by frame at 120 fps, a hit every 0.1 s
  const dt=1/120,ks=[];a.flC=undefined;
  const sf=setFlash;let last=0;setFlash=function(x,k,c){if(x===a)last=(k>0&&(c===undefined||c===0xffffff))?k:0;return sf.apply(this,arguments)};
  try{for(let f=0;f<240;f++){if(f%12===0)e.flash=Math.max(e.flash||0,0.09);e.flash-=dt;last=0;syncEnemy(e,dt);ks.push(a.hb?'b'+Math.round(a.hb*100)/100:'w'+Math.round(last*100)/100)}}finally{setFlash=sf}
  // the model moved during the fight (bob, animation): a fresh mask and no-hit colour at the same pose
  setFlash(a,0);a.root.visible=false;const bg2=shot();a.root.visible=true;const p1=shot();mask.length=0;
  for(let i=0;i<p1.length;i+=4)if(Math.abs(p1[i]-bg2[i])+Math.abs(p1[i+1]-bg2[i+1])+Math.abs(p1[i+2]-bg2[i+2])>30)mask.push(i);
  const b2=sat(p1,mask);base.s=b2.s;base.v=b2.v;base.n=b2.n;
  const lv=s=>+s.slice(1),apply=s=>{if(typeof hitBright==='function')hitBright(a,s[0]==='b'?lv(s):0);setFlash(a,s[0]==='w'?lv(s):0,0xffffff)};
  const levels=[...new Set(ks)],satAt={w0:b2.s};
  for(const k of levels){if(k==='w0')continue;apply(k);satAt[k]=sat(shot(),mask).s}apply('w0');
  // contact sheet crops: the model's box from the mask, no hit and at the strongest blink (readPixels is bottom-up)
  let x0=w,y0=h,x1=0,y1=0;for(const i of mask){const p=i/4,x=p%w,y=(p/w)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  const crop=px=>{if(x1<x0)return '';const cw=x1-x0+9,ch=y1-y0+9,cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const c2=cv.getContext('2d'),im=c2.createImageData(cw,ch);
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const sx=x0-4+x,sy=y1+4-y;if(sx<0||sy<0||sx>=w||sy>=h)continue;const si=(sy*w+sx)*4,di=(y*cw+x)*4;im.data[di]=px[si];im.data[di+1]=px[si+1];im.data[di+2]=px[si+2];im.data[di+3]=255}
    c2.putImageData(im,0,0);return cv.toDataURL('image/png')};
  apply('w0');const img0=crop(shot());apply(levels.reduce((m,k)=>lv(k)>lv(m)?k:m,'w0'));const img1=crop(shot());apply('w0');
  setFlash(a,0);e.flash=0;
  const avg=ks.reduce((t,k)=>t+satAt[k],0)/ks.length,peakS=levels.reduce((m,k)=>lv(k)>lv(m)?k:m,'w0'),peak=peakS,on=ks.filter(k=>lv(k)>0.01).length/ks.length;
  const mats=a.mats.map(m=>({map:!!m.map,col:m.color.getHexString()}));
  return {key,model:L.model,h:L.h,paint:L.paint||'',tint:L.tint||'',px:base.n,s0:+base.s.toFixed(3),v0:+base.v.toFixed(3),avg:+avg.toFixed(3),
    drop:base.s?+(1-avg/base.s).toFixed(3):0,peak,on:+on.toFixed(2),sPeak:+satAt[peakS].toFixed(3),
    img0,img1,noTex:mats.every(m=>!m.map)&&!L.paint,pale:base.s<0.18&&base.v>0.6};
}

module.exports={measureLook,looksToTest};
if(require.main===module)(async()=>{
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await pg.addInitScript(()=>{try{localStorage.setItem('zm-gfx','3d')}catch(e){}});
  await pg.goto('file://'+ROOT+'/index.html');await pg.waitForTimeout(1500);
  for(let i=0;i<300;i++){if(await pg.evaluate(()=>R3D.ready||R3D.failed))break;await pg.waitForTimeout(100)}
  await pg.evaluate(()=>{startRun();R3D.drawEvery=0});
  await pg.evaluate(src=>{window.measureLook=eval('('+src+')')},measureLook.toString());
  const keys=await pg.evaluate(looksToTest,ONLY);
  const rows=[];
  for(const key of keys){let r=null;
    for(let i=0;i<120&&!r;i++){r=await pg.evaluate(k=>{try{return measureLook(k)}catch(err){return {key:k,err:String(err)}}},key);if(!r)await pg.waitForTimeout(250)}
    if(!r)r={key,err:'model not loaded'};rows.push(r);
    console.log((r.px!=null?'px'+r.px+' ':'')+(r.err?key+' ✗ '+r.err:[key.padEnd(22),('S0 '+r.s0).padEnd(9),('avg '+r.avg).padEnd(10),('drop '+Math.round(r.drop*100)+'%').padEnd(10),'peak '+r.peak,'on '+Math.round(r.on*100)+'%',r.pale?'PALE':'',r.noTex?'NO-TEX':''].join(' ')))}
  fs.writeFileSync(path.join(OUT,'flash-audit.json'),JSON.stringify(rows.map(r=>({...r,img0:undefined,img1:undefined})),null,1));
  // contact sheet: each look, no hit | strongest blink, with the numbers
  const cell=r=>r.err?'<div class="c"><b>'+r.key+'</b><i>'+r.err+'</i></div>':'<div class="c"><b>'+r.key.slice(2)+'</b><div class="p"><img src="'+r.img0+'"><img src="'+r.img1+'"></div><i>no hit · blink '+r.peak+'</i><i>colour lost mid-fight: <u'+(r.drop>0.25?' class="bad"':'')+'>'+Math.round(r.drop*100)+'%</u></i></div>';
  const sh=await b.newPage({viewport:{width:1400,height:800}});
  await sh.setContent('<style>body{margin:0;background:#1b1d24;color:#ddd;font:12px system-ui}h1{font-size:16px;margin:8px}.g{display:flex;flex-wrap:wrap;gap:6px;padding:6px}.c{width:220px;background:#262934;border-radius:6px;padding:4px;display:flex;flex-direction:column;gap:2px}.p{display:flex;gap:2px;height:110px;align-items:flex-end}.p img{height:110px;max-width:107px;object-fit:contain;image-rendering:pixelated}u{text-decoration:none;color:#9f9}u.bad{color:#f88}</style><h1>'+(opt('title')||'Hit flash audit')+'</h1><div class="g">'+rows.map(cell).join('')+'</div>');
  await sh.screenshot({path:path.join(OUT,'flash-sheet.png'),fullPage:true});
  await b.close();
})();
