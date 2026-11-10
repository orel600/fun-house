/* NOVA hooks, part 2: RIG ADAPTER + ATTACK CLIP BINDING + contact data + event wiring (MBNOVA, overhaul/nova-hooks). Injected by js/mb-nova.js ONLY with ?nova=1.
   Presentation only. Never delays or moves gameplay: mbAttack applies melee damage / spawns the projectile synchronously with atkT and the cooldown, exactly as today;
   this file only chooses WHICH clip segment mb-atk3d.js plays at that atk event (data) and reports contact data after the mixer.
   The old KayKit 23-bone rig path is untouched: the tank slot switches to the NOVA actor only when hero.tank and every clip/weapon it names are decoded; otherwise the stock look stays.
   RIG CONTRACT: Mixamo-named skeleton (mixamorig:Hips ... GLTFLoader sanitises ':' away, so the bone is 'mixamorigHips' and clip tracks are 'mixamorigHips.quaternion'). Clips bind BY BONE NAME to the hero's
   skeleton (the clip GLBs carry skeleton nodes + tracks only). Report per clip: resolved/total tracks. skin.skeleton may be unset; the mesh GLB's skeleton is used.
   Per hero.<kit> meta (see mb-nova.js): clips.<role> = {role|clip, fade, timeScale, root:'raw'|'lockXZ'|'drop', seamBlend, segment:[t0,t1]}, attack:{from,to,dur,settle,recover}, weapon, slots.weapon.bone, upper:[...].
     root 'lockXZ': Hips X/Z fixed to the bind pose, Y = bind Y + (y - first-frame y). 'drop': the Hips position track is removed (locomotion is driven by game state). 'raw': untouched.
     seamBlend: the last N seconds of every rotation track blend (slerp, smoothstep) to the first key, so the loop has no pop.
     fade: crossFade seconds when this clip starts (data; the stock loop/once use fixed numbers, NOVA actors use these).
   ATTACK BINDING: attack clip registered whole; meta.attack {from,to} (clip seconds) become MBATK3D fractions: mb-atk3d plays from..to over dur at the atk event, hard-stops (settle), then fades (recover).
   MBNOVA.contact(unit) (post-mixer, world + projected px): {base:{w,s},tip:{w,s},tip2:{w,s} (mirrored face),target:{center,top,bottom as {w,s}}}; computed lazily and cached per frame.
   Weapon anchors come from weapon.<id> meta.anchors (node names or local coords), never inferred from the hand bone.
   Slots: tank only for now (NR.slots). Delete: this file. */
const MBNR={slots:['tank'],kits:{},stat:{built:0,evicted:0,loops:0,onces:0,launch:0,impact:0},cache:new Map(),
  upperDefault:['^mixamorig(Spine|Spine1|Spine2|Neck|Head|LeftShoulder|LeftArm|LeftForeArm|LeftHand|RightShoulder|RightArm|RightForeArm|RightHand)','Hand(Thumb|Index|Middle|Ring|Pinky)'],
  fadeDefault:0.15,hips:'mixamorigHips'};
(function(){
  const N=MBNOVA,R=MBNR;if(!N||!N.enabled)return;
  const warn=m=>{N.warnings.push(m);console.warn('[nova-rig]',m)};
  const rn=n=>n.replace(/:/g,'');   // GLTFLoader's node-name sanitising
  // ---- clip processing ----
  function trackBone(t){return t.name.split('.')[0]}
  function processClip(src,spec,hero,tmpl,name){
    let c=src.clone();c.name=name;
    if(spec.segment){const fps=60;c=THREE.AnimationUtils.subclip(c,name,Math.round(spec.segment[0]*fps),Math.round(spec.segment[1]*fps),fps)}
    const hip=rn(hero.meta.hips||R.hips),pol=spec.root||'lockXZ';
    const ht=c.tracks.find(t=>t.name===hip+'.position');
    if(ht){if(pol==='drop')c.tracks=c.tracks.filter(t=>t!==ht);
      else if(pol==='lockXZ'){const b=tmpl.getObjectByName(hip),v=ht.values,y0=v[1];if(b)for(let i=0;i<v.length;i+=3){v[i]=b.position.x;v[i+2]=b.position.z;v[i+1]=b.position.y+(v[i+1]-y0)}}}
    if(spec.seamBlend>0){const D=c.duration,win=spec.seamBlend;for(const t of c.tracks){if(!/\.quaternion$/.test(t.name))continue;const ts=t.times,v=t.values,q0=new THREE.Quaternion(v[0],v[1],v[2],v[3]);
      for(let i=0;i<ts.length;i++){if(ts[i]<D-win)continue;let s=Math.min(1,(ts[i]-(D-win))/win);s=s*s*(3-2*s);const q=new THREE.Quaternion(v[i*4],v[i*4+1],v[i*4+2],v[i*4+3]),t0=q0.clone();if(q.dot(t0)<0){t0.x*=-1;t0.y*=-1;t0.z*=-1;t0.w*=-1}q.slerp(t0,s);v[i*4]=q.x;v[i*4+1]=q.y;v[i*4+2]=q.z;v[i*4+3]=q.w}}}
    return c}
  function bindReport(clip,tmpl){let ok=0;const miss=[];for(const t of clip.tracks){const p=THREE.PropertyBinding.parseTrackName(t.name),n=THREE.PropertyBinding.findNode(tmpl,p.nodeName);if(n)ok++;else miss.push(t.name)}return {tracks:clip.tracks.length,resolved:ok,missing:miss.slice(0,4)}}
  function splitUp(clip,hero){const rx=(hero.meta.upper||R.upperDefault).map(s=>new RegExp(s,'i'));const up=clip.tracks.filter(t=>rx.some(r=>r.test(trackBone(t)))),lo=clip.tracks.filter(t=>!up.includes(t));
    R3D.clips[clip.name+'@up']=new THREE.AnimationClip(clip.name+'@up',clip.duration,up);R3D.clips[clip.name+'@low']=new THREE.AnimationClip(clip.name+'@low',clip.duration,lo)}
  // ---- build the tank slot (or any kit in R.slots) when everything it names is decoded ----
  function needs(kit){const h=N.get('hero.'+kit);if(!h)return null;const roles=['hero.'+kit];const m=h.meta,cl=m.clips||{};for(const k in cl)if(cl[k].role)roles.push(cl[k].role);if(m.weapon)roles.push(m.weapon);return roles}
  function tryBuild(kit){
    if(R.kits[kit]&&R.kits[kit].state==='ready')return;const roles=needs(kit);if(!roles)return;
    if(!roles.every(r=>N.isReady(r))){const bad=roles.filter(r=>{const e=N.get(r);return e&&e.state==='fail'});if(bad.length)R.kits[kit]={state:'fail',why:'asset failed: '+bad.join()};return}
    const hero=N.get('hero.'+kit),m=hero.meta,B=LOOK3D['mb_'+kit];if(!B){warn('no stock look for '+kit);return}
    const K=R.kits[kit]={state:'building',kit,clips:{},names:{},bind:{},fades:{}};
    try{
      // template: group (forward correction) around the decoded scene, userData.h = model height (the actor path scales L.h / userData.h)
      const G=new THREE.Group();G.name='nova_'+kit;const sc=hero.obj;G.add(sc);const yaw={'+Z':0,'+X':-Math.PI/2,'-X':Math.PI/2,'-Z':Math.PI}[m.forward||'+Z'];G.rotation.y=yaw||0;
      let mesh=null;sc.traverse(o=>{if(o.isSkinnedMesh&&!mesh)mesh=o;if(o.isMesh)o.frustumCulled=false});
      if(mesh){mesh.skeleton.update();mesh.computeBoundingBox();G.userData.h=(mesh.boundingBox.max.y-mesh.boundingBox.min.y)||1}else G.userData.h=1;
      G.updateMatrixWorld(true);R3D.tmpl['nova_'+kit]=G;
      // clips
      const cl=m.clips||{};
      for(const role in cl){const spec=cl[role],srcE=spec.role?N.get(spec.role):hero,list=srcE.clips||[];let src=null;
        if(typeof spec.clip==='string')src=list.find(a=>a.name===spec.clip);else src=list[spec.clip||0];
        if(!src){warn(kit+' clip '+role+' not found in '+(spec.role||'hero'));continue}
        const name='nova_'+kit+'_'+role,c=processClip(src,spec,hero,G,name);R3D.clips[name]=c;splitUp(c,hero);K.clips[role]=c;K.names[role]=name;K.bind[role]=bindReport(c,G);K.fades[name]=spec.fade!=null?spec.fade:R.fadeDefault;K.fades[name+'@up']=K.fades[name];K.fades[name+'@low']=K.fades[name];
        if(spec.timeScale)(K.ts||(K.ts={}))[name]=spec.timeScale}
      // weapon prop: R3D.props[...] is cloned per actor; anchors are looked up on the clone
      const props={};
      if(m.weapon){const w=N.get(m.weapon),wm=w.meta,id=m.weapon.slice(7),key='nova_w_'+id;R3D.props[key]=w.obj;const ga=(wm.anchors&&wm.anchors.grip)||{},bone=((m.slots||{}).weapon||{}).bone||'mixamorigRightHand';
        props.weapon={prop:key,bone:rn(bone),pos:ga.pos||[0,0,0],rot:ga.quat||[0,0,0,1],s:wm.scale||1};K.weapon={key,anchors:wm.anchors||{}}}
      // look + foot/height (data, defaults from the stock look)
      K.look={model:'nova_'+kit,h:m.heightGame||B.h,foot:m.foot!=null?m.foot:B.foot,props,anim:{idle:K.names.idle||B.anim.idle,run:K.names.run||B.anim.run,die:K.names.die||B.anim.die,hit:K.names.hit||B.anim.hit},nova:kit,sig:'nova|'+kit+'|'+hero.at};
      // attack binding (data -> MBATK3D fractions). The atk event itself is untouched.
      if(m.attack&&K.clips.attack&&typeof MBATK3D!=='undefined'){const a=m.attack,D=K.clips.attack.duration,orig=MBATK3D.kit[kit];K.origAtk=orig;
        MBATK3D.kit[kit]={ready:K.names.ready||null,hit:K.names.attack,from:a.from/D,to:a.to/D,dur:a.dur,settle:a.settle!=null?a.settle:0.06,recover:a.recover||{min:0.22,max:1},keep:a.keep!=null?a.keep:1,puff:orig&&orig.puff||null};K.attack=MBATK3D.kit[kit];
        if(typeof MBMOVE!=='undefined'&&MBMOVE.atk)MBMOVE.atk[kit]=null}
      K.state='ready';R.stat.built++;
      // existing tank actors/the player rebuild with the new look on their next frame
      for(const [e,a] of [...R3D.actors])if(e.kit===kit&&!(a.L&&a.L.nova)){freeActor(a);R3D.actors.delete(e);R.stat.evicted++}
      R3D._hlk=null;
    }catch(er){K.state='fail';K.why=String(er&&er.message||er);warn('build '+kit+': '+K.why)}}
  N.onReady=function(){for(const kit of R.slots)tryBuild(kit)};
  // ---- look mapping into the existing actor/LOOK3D path (tank slot) ----
  if(typeof mbPartsLook==='function'){const prior=mbPartsLook;mbPartsLook=function(B,kit){const K=R.kits[kit];
    if(!K||K.state!=='ready'||!B)return prior.apply(this,arguments);
    const c=R.cache.get(kit);if(c&&c.B===B&&c.sig===K.look.sig)return c.L;
    const L=Object.assign({},B,K.look,{props:K.look.props,anim:Object.assign({},B.anim,K.look.anim),base:B});R.cache.set(kit,{B,sig:K.look.sig,L});return L}}
  // ---- crossFade times and per-clip timeScale as data: NOVA actors only (stock loop/once stay as they are) ----
  const fadeOf=(a,name)=>{const K=R.kits[a.L.nova];return K&&K.fades[name]!=null?K.fades[name]:R.fadeDefault};
  if(typeof loop==='function'){const ol=loop;loop=function(a,name,speed=1){
    if(!(a&&a.L&&a.L.nova))return ol.apply(this,arguments);R.stat.loops++;const K=R.kits[a.L.nova],ts=K&&K.ts&&K.ts[name.split('@')[0]]||1,fade=fadeOf(a,name);
    if(a.base===name){const x=act(a,name);if(x)x.timeScale=speed*ts;return}
    const prev=a.base?act(a,a.base):null,next=act(a,name);if(!next)return;
    next.reset().setLoop(THREE.LoopRepeat).setEffectiveWeight(1).fadeIn(fade).play();next.timeScale=speed*ts;
    if(prev){if(prev.getClip().name.split('@')[0]===name.split('@')[0])next.time=prev.time;prev.fadeOut(fade)}
    a.base=name}}
  if(typeof once==='function'){const oo=once;once=function(a,name,dur,hold=false,skip=0){
    if(!(a&&a.L&&a.L.nova))return oo.apply(this,arguments);R.stat.onces++;const x=act(a,name);if(!x)return;const fade=fadeOf(a,name);
    if(a.one&&a.one!==x)a.one.fadeOut(Math.min(0.08,fade));
    const d=x.getClip().duration;x.reset().setLoop(THREE.LoopOnce,1);x.clampWhenFinished=hold;x.timeScale=dur?d*(1-skip)/dur:1;x.time=d*skip;x.fadeIn(skip?Math.min(0.03,fade):fade).play();a.one=x}}
  // ---- contact data (post-mixer): world + projected ----
  const V3=()=>new THREE.Vector3(),frameNo=()=>R3D.frame||0;
  const actorOf=u=>u===MB.me&&R3D.player?R3D.player:R3D.actors.get(u);
  const proj=w=>{const v=w.clone().project(R3D.cam),cv=R3D.r&&R3D.r.domElement,W=cv?cv.clientWidth:innerWidth,H=cv?cv.clientHeight:innerHeight;return {w:w.toArray(),s:[(v.x+1)/2*W,(1-v.y)/2*H]}};
  N.contact=function(u){
    if(!u||typeof R3D==='undefined'||!R3D.cam)return null;const ck=frameNo();const hit=R.cache.get('c'+u.id);if(hit&&hit.f===ck)return hit.v;
    const a=actorOf(u);if(!a||!a.L||!a.L.nova){return null}
    a.root.updateMatrixWorld(true);const K=R.kits[a.L.nova],pr=a.props&&(a.props.weapon||a.props.sword),an=K&&K.weapon&&K.weapon.anchors||{},out={frame:ck,unit:u.id};
    if(pr){const pt=x=>{if(!x)return null;const o=typeof x==='string'?pr.getObjectByName(x):null,w=o?o.getWorldPosition(V3()):Array.isArray(x)?pr.localToWorld(new THREE.Vector3(...x)):null;return w};
      const b=pt(an.contactBase),t=pt(an.contactTip);if(b)out.base=proj(b);if(t)out.tip=proj(t);if(b&&t)out.tip2=proj(b.clone().multiplyScalar(2).sub(t))}   // the mirrored face of a double-faced head
    const tg=u.tgt||(MB.lock&&u===MB.me?MB.lock:null);const ta=tg&&actorOf(tg);
    if(ta){ta.root.updateMatrixWorld(true);const bx=new THREE.Box3().setFromObject(ta.root),c=bx.getCenter(V3());out.target={unit:tg.id,center:proj(c),top:proj(new THREE.Vector3(c.x,bx.max.y,c.z)),bottom:proj(new THREE.Vector3(c.x,bx.min.y,c.z))}}
    R.cache.set('c'+u.id,{f:ck,v:out});return out};
  N.bones=function(u,names){const a=actorOf(u);if(!a)return null;a.root.updateMatrixWorld(true);const o={};for(const n of names){const b=bone(a.root,rn(n));if(b){const p=V3(),q=new THREE.Quaternion();b.getWorldPosition(p);b.getWorldQuaternion(q);o[n]={pos:p.toArray(),quat:q.toArray()}}}return o};
  // ---- event seam: 'launch' at the atk event, 'impact' at the real impact (melee: same tick, projectile: later) ----
  const anchorsFor=u=>{try{return N.contact(u)}catch(e){return null}};
  if(typeof mbAttack==='function'){const ba=mbAttack;mbAttack=function(u,dt,t,A){const t0=u&&u.atkT,n0=MB.shots.length,r=ba.apply(this,arguments);
    if(N.hasSubs('launch')&&u&&(u.atkT||0)>(t0||0)+0.05){R.stat.launch++;const proj=!!(A&&A.shot);N.emit('launch',{kind:proj?'projectile':'melee',src:u,tgt:t,t:MB.t,frame:frameNo(),shot:proj&&MB.shots.length>n0?MB.shots[MB.shots.length-1]:null,anchors:anchorsFor(u)})}
    return r}}
  if(typeof mbfxImpact==='function'){const bi=mbfxImpact;mbfxImpact=function(src,t,dt,crit,melee){
    if(N.hasSubs('impact')){R.stat.impact++;N.emit('impact',{kind:melee?'melee':'projectile',src,tgt:t,crit:!!crit,dt,t:MB.t,frame:frameNo(),anchors:src?anchorsFor(src):null})}
    return bi.apply(this,arguments)}}
  N.rigReport=()=>({slots:R.slots,stat:Object.assign({},R.stat),kits:Object.fromEntries(Object.entries(R.kits).map(([k,v])=>[k,{state:v.state,why:v.why||null,names:v.names,bind:v.bind,fades:v.fades,attack:v.attack?{hit:v.attack.hit,from:+v.attack.from.toFixed(4),to:+v.attack.to.toFixed(4),dur:v.attack.dur,settle:v.attack.settle}:null,look:v.look?{h:v.look.h,foot:v.look.foot,anim:v.look.anim,weapon:v.look.props.weapon&&v.look.props.weapon.prop}:null}]))});
  N.restore=function(kit){const K=R.kits[kit];if(K&&K.origAtk)MBATK3D.kit[kit]=K.origAtk;delete R.kits[kit];R3D._hlk=null};
  setTimeout(()=>N.onReady&&N.onReady(),0);
})();
