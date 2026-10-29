// usage: node view.js model.glb out.png [anim]
const {chromium}=require('/home/claude/fun-house/node_modules/playwright');const fs=require('fs');
(async()=>{const [glb,out,anim]=process.argv.slice(2);
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:900,height:420}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.setContent('<body style="margin:0;background:#2a3049"><canvas id=c width=900 height=420></canvas></body>');
await p.addScriptTag({path:'/home/claude/pilot/three-tools.js'});
const data=fs.readFileSync(glb).toString('base64');
const r=await p.evaluate(async({data,anim})=>{
  const buf=Uint8Array.from(atob(data),c=>c.charCodeAt(0)).buffer;
  const g=await new Promise((ok,bad)=>new THREE.GLTFLoader().parse(buf,'',ok,bad));
  const R=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});R.outputColorSpace=THREE.SRGBColorSpace;
  const sc=new THREE.Scene();sc.background=new THREE.Color('#2a3049');sc.add(new THREE.HemisphereLight(0xffffff,0x444466,2.2));const d=new THREE.DirectionalLight(0xffffff,1.6);d.position.set(1,2,3);sc.add(d);
  const bb=new THREE.Box3().setFromObject(g.scene),h=bb.max.y-bb.min.y,c=bb.getCenter(new THREE.Vector3());
  const cam=new THREE.OrthographicCamera(-h*1.07,h*1.07,h*0.5,-h*0.5,0.01,100);cam.position.set(c.x,c.y,c.z+10);cam.lookAt(c);
  const names=(g.animations||[]).map(a=>a.name);
  for(const [i,ang] of [[0,0],[1,-Math.PI/2],[2,Math.PI]]){const o=i?THREE.SkeletonUtils.clone(g.scene):g.scene;o.rotation.y=ang;o.position.x=(i-1)*h*0.7;sc.add(o);
    if(anim&&g.animations.length){const mx=new THREE.AnimationMixer(o);const cl=g.animations.find(a=>a.name===anim)||g.animations[0];mx.clipAction(cl).play();mx.update(cl.duration*0.3)}}
  R.render(sc,cam);return {names:names.slice(0,30),h};
},{data,anim:anim||null});
await p.screenshot({path:out});console.log(JSON.stringify(r),errs.join('\n'));await b.close()})();
