/* תלת-ממד: שכבה מתחת לקנבס הרגיל. היא מציירת את הקרקע ואת הדמויות כמודלים מונפשים,
   והקנבס הרגיל מעליה ממשיך לצייר כל השאר: חצים, יריות, ניצוצות, מספרים, אזורים וחיצים בקצה המסך.
   הלוגיקה לא יודעת על השכבה הזו: היא רק קוראת את P, S ו-enemies, בדיוק כמו render.js.
   המודלים והאנימציות ב-js/models3d.js (KayKit, CC0), ונבנים מחדש עם tools/build3d.js.
   כל דמות משתמשת באותו שלד, אז כל אנימציה עובדת על כל דמות.

   התאמה לקנבס: מצלמה אורתוגרפית ביחידות של פיקסלים, בזווית VIEW.tilt מעל הקרקע.
   נקודה (x,y) במשחק יושבת ב-(x, 0, y/sin(tilt)) בעולם התלת-ממדי, וכך היא מופיעה על המסך בדיוק איפה שהקנבס מצייר אותה.
   אם WebGL לא זמין, או שהשחקן בחר 2D, הכל נשאר כמו קודם (R3D.on=false). */

const VIEW={tilt:42*Math.PI/180, light:1.15, ground:'#263049', groundLine:'#3a4562', room:'#3a3018'};

/* מי לובש איזה מודל. h: גובה הדמות על המסך בפיקסלים. foot: כמה פיקסלים מתחת למרכז הלוגי הרגליים נוגעות בקרקע.
   props: חפצים ביד (bone: היד, ומיקום וסיבוב מקומיים כמו בחבילה המקורית). ring: טבעת בצבע הנשק שפוגע בו, מתחת לרגליים.
   anim: שמות האנימציות מהחבילה. דמות חדשה = שורה כאן (ומודל ב-build3d.js) */
const HAND_R={bone:'handslotr',pos:[0,0.033,0],rot:[0,-1,0,0]};
const LOOK3D={
  player:{model:'knight',h:66,foot:14,
    props:{gun:{prop:'crossbow',bone:'handslotr',pos:[-0.105,-0.01,0],rot:[0,0.7071,0,0.7071]}},
    anim:{idle:'Idle',run:'Running_A',sword:'1H_Melee_Attack_Slice_Horizontal',gun:'1H_Ranged_Shoot',die:'Death_A',win:'Cheer'}},
  grunt:{model:'minion',h:54,foot:12,props:{blade:{prop:'blade',...HAND_R}},anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  shield:{model:'warrior',h:60,foot:14,ring:'ember',props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'ember'}},
    anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  wisp:{model:'mage',h:56,foot:12,ring:'tide',float:6,props:{staff:{prop:'staff',...HAND_R,tint:'tide'}},
    anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons',cast:'Spellcasting'}},
  wanted:{model:'rogue',h:62,foot:13,tint:'gold',anim:{run:'Running_B',die:'Death_A'}},
  boss:{model:'barbarian',h:140,foot:28,anim:{run:'Running_B',idle:'Idle',charge:'2H_Melee_Attack_Spin',cast:'2H_Melee_Attack_Chop',taunt:'Taunt',die:'Death_A'}}
};
/* קהל: כשיש הרבה אויבים על המסך, רק הקרובים לשחקן מקבלים דמות מונפשת. כל השאר מצוירים יחד בתנוחת ריצה קפואה
   שמתחלפת בין שני צעדים: כמה ציורים בפריים במקום מאות. בטלפון זה ההבדל בין משחק שזורם למשחק שנתקע.
   full: כמה דמויות מונפשות לכל היותר. poses: באיזה רגע של אנימציית הריצה מצלמים כל צעד. dying: כמה אנימציות מוות יחד. max: כמה בקהל */
const CROWD={full:30,poses:[0.25,0.75],dying:16,max:320,types:['grunt','shield','wisp']};
// עצמות פלג הגוף העליון: תקיפה תוך כדי ריצה מזיזה רק אותן, והרגליים ממשיכות לרוץ
const UPPER=/^(spine|chest|head|upperarm|lowerarm|wrist|hand)/;

const R3D={shown:new WeakSet(),nid:0,on:false,ready:false,failed:false,want:true,actors:new Map(),dying:[],tmpl:{},clips:{},props:{},stats:{}};
try{R3D.want=localStorage.getItem('zm-gfx')!=='2d'}catch(e){}

function setGfx(g){R3D.want=g==='3d';try{localStorage.setItem('zm-gfx',g)}catch(e){}
  if(R3D.want&&!R3D.ready&&!R3D.failed)init3d();R3D.on=R3D.want&&R3D.ready;if(R3D.cvs)R3D.cvs.hidden=!R3D.on;showGfx()}
function showGfx(){for(const b of document.querySelectorAll('[data-gfx]'))b.setAttribute('aria-pressed',String((b.dataset.gfx==='3d')===R3D.want));
  const g=document.querySelector('.gfx');if(g)g.hidden=R3D.failed}

/* ---- טעינה ---- */
function b64buf(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer}
function parseGLB(k){return new Promise((ok,bad)=>new THREE.GLTFLoader().parse(b64buf(MODELS3D[k]),'',ok,bad))}
// הדמויות מגיעות מחולקות לחלקים (ראש, גוף, ידיים...). מאחדים אותם לחלק אחד, כדי שהטלפון יצייר כל דמות במכה אחת
function mergeSkinned(root){
  // רק חלקים עם אותה טקסטורה מתאחדים. העיניים הזוהרות של השלדים נשארות חלק נפרד
  const all=[];root.traverse(o=>{if(o.isSkinnedMesh)all.push(o)});
  const first=all.find(p=>p.material.map);if(!first)return;
  const parts=all.filter(p=>p.material.map===first.material.map&&p.skeleton.bones.length===first.skeleton.bones.length&&p.bindMatrix.equals(first.bindMatrix));
  if(parts.length<2)return;
  const sk=first.skeleton,mat=first.material;
  const geo=THREE.mergeGeometries(parts.map(p=>{const g=p.geometry.clone();for(const k in g.attributes)if(!['position','normal','uv','skinIndex','skinWeight'].includes(k))g.deleteAttribute(k);return g}));
  if(!geo)return;
  const m=new THREE.SkinnedMesh(geo,mat);m.name='body';
  first.parent.add(m);m.bind(sk,first.bindMatrix);
  for(const p of parts)p.parent.remove(p);
}
// חומר פשוט יותר מהמקורי: נראה אותו דבר בסגנון הזה, ומהיר יותר בטלפון
function lambert(root){root.traverse(o=>{if(o.isMesh){const m=o.material;o.material=new THREE.MeshLambertMaterial({map:m.map,color:m.color,emissive:m.emissive,emissiveMap:m.emissiveMap});o.frustumCulled=false}})}
function bone(root,name){let b=null;root.traverse(o=>{if(!b&&o.isBone&&o.name===name)b=o});return b}

async function init3d(){
  if(R3D.loading||R3D.failed)return;R3D.loading=true;
  try{
    if(!window.THREE||typeof MODELS3D==='undefined')throw new Error('three.js או המודלים לא נטענו');
    const c=document.createElement('canvas');c.id='c3';c.setAttribute('aria-hidden','true');cvs.before(c);R3D.cvs=c;
    const r=new THREE.WebGLRenderer({canvas:c,antialias:DPR<2,powerPreference:'high-performance'});
    if(!r.getContext())throw new Error('אין WebGL');
    R3D.r=r;r.outputColorSpace=THREE.SRGBColorSpace;
    const sc=R3D.scene=new THREE.Scene();sc.background=new THREE.Color(VIEW.ground);
    sc.add(new THREE.HemisphereLight(0xdfe6ff,0x2a2236,1.6*VIEW.light));
    const sun=new THREE.DirectionalLight(0xfff1dc,1.9*VIEW.light);sun.position.set(-0.5,1,0.6);sc.add(sun);
    R3D.cam=new THREE.OrthographicCamera(-1,1,1,-1,1,4000);
    makeGround();makeMarks();
    const [anims]=await Promise.all([Promise.all(['anim_hero','anim_skel'].map(parseGLB)),
      ...Object.values(LOOK3D).map(async L=>{if(R3D.tmpl[L.model])return;const g=await parseGLB(L.model);R3D.tmpl[L.model]=g.scene})]);
    for(const g of anims)for(const a0 of g.animations){
      // משאירים רק מה שמזיז את הגוף בפועל: סיבוב של עצמות הגוף והידיים, ותזוזה של האגן והרגליים.
      // עצמות העזר (IK, control) וקנה המידה לא משנים כלום במשחק, ומכפילים פי ארבעה את העבודה בכל פריים
      const a=new THREE.AnimationClip(a0.name,a0.duration,a0.tracks.filter(t=>{const [n,pr]=t.name.split('.');
        return !/IK|control/.test(n)&&(pr==='quaternion'||pr==='position'&&/^(root|hips|upperleg)/.test(n))}));
      R3D.clips[a.name]=a;
      R3D.clips[a.name+'@up']=new THREE.AnimationClip(a.name+'@up',a.duration,a.tracks.filter(t=>UPPER.test(t.name)));
      R3D.clips[a.name+'@low']=new THREE.AnimationClip(a.name+'@low',a.duration,a.tracks.filter(t=>!UPPER.test(t.name)))}
    for(const k of ['crossbow','blade','shield','staff']){const g=await parseGLB(k);lambert(g.scene);R3D.props[k]=g.scene}
    for(const k in R3D.tmpl){const t=R3D.tmpl[k];mergeSkinned(t);lambert(t);t.updateMatrixWorld(true);
      // גובה הדמות בתנוחת הבסיס, כדי לקבוע את קנה המידה
      const bb=new THREE.Box3();t.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();bb.union(o.geometry.boundingBox)}});t.userData.h=bb.max.y-bb.min.y||2}
    bakeCrowd();
    R3D.ready=true;R3D.on=R3D.want;c.hidden=!R3D.on;
  }catch(e){
    R3D.failed=true;R3D.on=false;if(R3D.cvs)R3D.cvs.hidden=true;
    console.warn('תלת-ממד לא זמין, ממשיכים בדו-ממד:',e&&e.message);
  }
  R3D.loading=false;showGfx();
}

/* ---- קרקע וסימונים ---- */
function makeGround(){
  // אריח רצפה מצויר, שחוזר על עצמו. המשטח זז עם המצלמה בקפיצות של אריח, כך שהרצפה נראית קבועה במקום
  const T=256,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,T,T);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=225+Math.floor(hash(i,j)*30);g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(i*64+2,j*64+2,60,60)}
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const size=6000,tile=180;tex.repeat.set(size/tile,size/tile);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshLambertMaterial({map:tex,color:VIEW.groundLine}));
  m.rotation.x=-Math.PI/2;m.userData.tile=tile;R3D.ground=m;R3D.scene.add(m);
}
// צל עגול מתחת לכל דמות, וטבעת בצבע הנשק מתחת לאויבים מיוחדים. כולם באותה שכבה, כדי לחסוך ציורים
function makeMarks(){
  const N=320,mk=(geo,col,op)=>{const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}),N);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=1;R3D.scene.add(m);return m};
  const disc=new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2),ring=new THREE.RingGeometry(0.78,1,28).rotateX(-Math.PI/2);
  R3D.marks={shadow:mk(disc,0x05070d,0.45),ember:mk(ring,C.ember,0.85),tide:mk(ring,C.tide,0.85)};
}
function mark(kind,x,z,r){const M=R3D.marks[kind];if(M.count>=M.instanceMatrix.count)return;
  R3D._mx.makeScale(r,1,r*0.92).setPosition(x,0.5,z);M.setMatrixAt(M.count++,R3D._mx)}

/* ---- קהל ---- */
// מצלמים כל סוג אויב בכמה תנוחות ריצה, והופכים כל תנוחה לצורה קבועה שאפשר לצייר מאות פעמים בציור אחד
function bakeCrowd(){
  R3D.crowd={};const v=new THREE.Vector3();
  for(const k of CROWD.types){
    const L=LOOK3D[k],a=makeActor(L),clip=R3D.clips[L.anim.run];a.mixer.clipAction(clip).play();
    R3D.crowd[k]=CROWD.poses.map(f=>{
      a.mixer.setTime(f*clip.duration);a.root.position.set(0,0,0);a.root.rotation.set(0,0,0);a.root.updateMatrixWorld(true);
      const parts=[];
      a.root.traverseVisible(o=>{if(!o.isMesh)return;
        const src=o.geometry,n=src.attributes.position.count,pos=new Float32Array(n*3);
        for(let i=0;i<n;i++){if(o.isSkinnedMesh)o.getVertexPosition(i,v);else v.fromBufferAttribute(src.attributes.position,i);v.applyMatrix4(o.matrixWorld).toArray(pos,i*3)}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
        if(src.attributes.uv)g.setAttribute('uv',src.attributes.uv);if(src.index)g.setIndex(src.index);g.computeVertexNormals();
        const m=new THREE.InstancedMesh(g,o.material.clone(),CROWD.max);m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;R3D.scene.add(m);parts.push(m)});
      return parts});
    freeActor(a);
  }
}
function crowdAdd(e){
  const L=lookOf(e),k=e.big||1,lift=L.float?L.float+Math.sin(e.ph*0.6)*3:0,M=R3D._mx;
  const parts=R3D.crowd[e.type][Math.floor(e.ph/1.6)%CROWD.poses.length];
  R3D._p.set(e.x,lift/COS(),(e.y+L.foot*k)/SIN());R3D._q.setFromAxisAngle(R3D._up,yawOf(P.x-e.x,P.y-e.y));R3D._s.setScalar(k);
  M.compose(R3D._p,R3D._q,R3D._s);
  for(const m of parts)if(m.count<CROWD.max)m.setMatrixAt(m.count++,M);
  R3D.nCrowd++;
  const rr=e.r*1.15;mark('shadow',R3D._p.x,R3D._p.z,rr);if(L.ring)mark(L.ring,R3D._p.x,R3D._p.z,rr*1.15);
}

/* ---- דמויות ---- */
const SIN=()=>Math.sin(VIEW.tilt),COS=()=>Math.cos(VIEW.tilt);
function lookOf(e){return e===P?LOOK3D.player:e.isBoss?LOOK3D.boss:e.wanted?LOOK3D.wanted:LOOK3D[e.type]}
const TINT={ember:C.ember,tide:C.tide,gold:C.gold};
function makeActor(L){
  const pool=R3D.pool||(R3D.pool={});const free=pool[L.model+'|'+Object.keys(L.props||{}).join()];
  if(free&&free.length){const a=free.pop();a.root.visible=true;a.dieT=0;a.base=null;a.one=null;a.mixer.stopAllAction();return a}
  const t=R3D.tmpl[L.model],root=THREE.SkeletonUtils.clone(t),s=L.h/COS()/t.userData.h;
  root.scale.setScalar(s);
  const mats=[];
  root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(L.tint)o.material.emissive.set(TINT[L.tint]).multiplyScalar(0.18);o.material.userData.em=o.material.emissive.clone();mats.push(o.material)}});
  const props={};
  for(const [k,p] of Object.entries(L.props||{})){
    const b=bone(root,p.bone);if(!b)continue;
    const m=R3D.props[p.prop].clone(true);m.position.fromArray(p.pos);m.quaternion.fromArray(p.rot);
    m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(p.tint)o.material.emissive.set(TINT[p.tint]).multiplyScalar(0.55);o.material.userData.em=o.material.emissive.clone();mats.push(o.material)}});
    b.add(m);props[k]=m;
  }
  // נשקים שהדמות מחזיקה בקובץ המקורי: חרב לשחקן, גרזן לבוס, סכין למבוקש
  let own=null;root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&/^(1H|2H)_|Knife/.test(o.name))own=own||o});
  const a={root,mats,props,own,mixer:new THREE.AnimationMixer(root),L,key:L.model+'|'+Object.keys(L.props||{}).join(),base:null,one:null,flash:0,dieT:0};
  R3D.scene.add(root);return a;
}
function freeActor(a){a.root.visible=false;a.mixer.stopAllAction();const p=R3D.pool;(p[a.key]||(p[a.key]=[])).push(a)}
function act(a,name){const c=R3D.clips[name];return c?a.mixer.clipAction(c):null}
// אנימציית בסיס בלולאה (ריצה, עמידה). מעבר רך בין אנימציות
function loop(a,name,speed=1){
  if(a.base===name){const x=act(a,name);if(x)x.timeScale=speed;return}
  const prev=a.base?act(a,a.base):null,next=act(a,name);if(!next)return;
  next.reset().setLoop(THREE.LoopRepeat).setEffectiveWeight(1).fadeIn(0.15).play();next.timeScale=speed;
  if(prev){if(prev.getClip().name.split('@')[0]===name.split('@')[0])next.time=prev.time;prev.fadeOut(0.15)}
  a.base=name;
}
// אנימציה חד-פעמית (תקיפה, מוות). dur: כמה שניות היא צריכה להימשך
function once(a,name,dur,hold=false){
  const x=act(a,name);if(!x)return;
  if(a.one&&a.one!==x)a.one.fadeOut(0.08);
  x.reset().setLoop(THREE.LoopOnce,1);x.clampWhenFinished=hold;x.timeScale=dur?x.getClip().duration/dur:1;x.fadeIn(0.06).play();a.one=x;
}
function place(a,x,y,foot,yaw,lift=0){
  const S_=SIN();a.root.position.set(x,lift/COS(),(y+foot)/S_);
  if(yaw!=null){let d=yaw-a.root.rotation.y;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;a.root.rotation.y+=d*0.35}
}
// כיוון במשחק (זווית על המסך) לסיבוב סביב ציר y בעולם
const yawOf=(dx,dy)=>Math.atan2(dx,dy/SIN());
function setFlash(a,k,col){for(const m of a.mats){if(k>0)m.emissive.set(col||0xffffff).multiplyScalar(k);else if(m.userData.em)m.emissive.copy(m.userData.em);else m.emissive.set(0)}}

function syncPlayer(dt){
  let a=R3D.player;if(!a)a=R3D.player=makeActor(LOOK3D.player);
  const L=LOOK3D.player,sword=P.weapon==='sword';
  if(a.own)a.own.visible=sword;if(a.props.gun)a.props.gun.visible=!sword;
  const st=a.st||(a.st={anim:0,gt:0,mode:''});
  if(S.mode==='over'){if(st.mode!=='over'){st.mode='over';a.base=null;a.mixer.stopAllAction();once(a,L.anim.die,1.2,true)}}
  else{
    if(st.mode==='over'){st.mode='';a.one=null;a.mixer.stopAllAction()}
    // תקיפה: רק פלג הגוף העליון, כך שאפשר לתקוף תוך כדי ריצה
    const swing=sword&&P.sw.anim>st.anim,shot=!sword&&P.gn.t>st.gt+0.01;
    st.anim=P.sw.anim;st.gt=P.gn.t;
    if(swing)once(a,L.anim.sword+'@up',Math.max(0.28,Math.min(0.5,P.sw.cd*0.8)));
    if(shot)once(a,L.anim.gun+'@up',Math.max(0.2,Math.min(0.45,P.gn.cd*0.9)));
    const busy=a.one&&a.one.isRunning();
    loop(a,(P.moving?L.anim.run:L.anim.idle)+(busy?'@low':''),P.moving?Math.min(1.6,P.speed/165):1);
  }
  place(a,P.x,P.y,L.foot,yawOf(Math.cos(P.aim),Math.sin(P.aim)));
  a.root.visible=!(P.inv>0&&Math.floor(P.inv*20)%2===0)||RM;
  setFlash(a,P.inv>0.45?0.5:P.swapBuff>0?0.25:0,P.inv>0.45?C.blood:C.gold);
  a.mixer.update(dt);
  mark('shadow',a.root.position.x,a.root.position.z,16);
}
function syncEnemy(e,dt){
  let a=R3D.actors.get(e);const L=lookOf(e);if(!L)return;
  if(!a){a=makeActor(L);R3D.actors.set(e,a);
    if(!e.isBoss)a.root.scale.setScalar(L.h/COS()/R3D.tmpl[L.model].userData.h*(e.big||1));
    // קמים מהאדמה רק בפעם הראשונה, ולא בכל פעם שאויב חוזר למסך
    if(L.anim.spawn&&!e.isBoss&&!R3D.shown.has(e)){once(a,L.anim.spawn,0.45)}
    R3D.shown.add(e);
    a.prev={x:e.x,y:e.y,patT:e.patT||0,charge:null}}
  a.seen=R3D.frame;
  const dx=e.x-a.prev.x,dy=e.y-a.prev.y,sp=Math.hypot(dx,dy)/Math.max(dt,1e-3);
  let yaw=null;
  if(e.isBoss){
    const b=e,st=a.prev;
    if(b.charge&&b.charge.stage===1&&st.charge!==1)once(a,L.anim.charge,0.45);
    else if(b.charge&&b.charge.stage===0&&st.charge!==0)once(a,L.anim.taunt,0.75);
    else if(!b.charge&&b.patT>st.patT+0.5)once(a,L.anim.cast,0.5);
    st.charge=b.charge?b.charge.stage:null;st.patT=b.patT;
    yaw=b.charge?yawOf(Math.cos(b.charge.a),Math.sin(b.charge.a)):yawOf(P.x-b.x,P.y-b.y);
    a.root.scale.setScalar(L.h/COS()/R3D.tmpl[L.model].userData.h*(b.phase>1?1.12:1)*(b.r/34));
    loop(a,sp>15?L.anim.run:L.anim.idle,Math.max(0.7,Math.min(1.8,sp/90)));
  }else{
    yaw=sp>5?yawOf(dx,dy):yawOf(P.x-e.x,P.y-e.y);
    if(e.type==='wisp'&&e.shoot<0.35&&L.anim.cast&&!(a.one&&a.one.isRunning()))once(a,L.anim.cast,0.5);
    if(!(a.one&&a.one.isRunning()&&a.one.getClip().name===L.anim.spawn))loop(a,L.anim.run,Math.max(0.6,Math.min(1.8,sp/(e.speed||80))));
  }
  const lift=L.float?L.float+Math.sin(e.ph*0.6)*3:0;
  place(a,e.x,e.y,L.foot*(e.big||1),yaw,lift);
  const rage=e.isBoss&&e.rage>0.05?e.rage:0;
  setFlash(a,e.flash>0?0.9:rage?0.15+0.35*rage*(0.6+0.4*Math.sin(S.t*14)):0,e.flash>0?0xffffff:C.blood);
  // כשיש הרבה אויבים, כל אחד מונפש רק בכל פריים שני (חצי מהם בכל פריים). בעין זה לא נראה, ובטלפון זה חוסך הרבה
  a.acc=(a.acc||0)+dt;
  if(e.isBoss||R3D.actors.size<25||((a.id||(a.id=++R3D.nid))+R3D.frame)%2===0){a.mixer.update(a.acc);a.acc=0}
  a.prev.x=e.x;a.prev.y=e.y;
  const z=a.root.position.z,x=a.root.position.x,rr=e.r*1.15;
  mark('shadow',x,z,rr);if(L.ring)mark(L.ring,x,z,rr*1.15);
}
// אויב שנעלם מהרשימה: אם הוא מת, מנגנים מוות ושוקע לאדמה. אם ברח (המבוקש), יצא מהמסך, עבר לקהל,
// או שכבר יש יותר מדי מתים על המסך, הדמות חוזרת מיד למאגר
function retire(e,a,dt){
  if(!a.dieT){const L=a.L;setFlash(a,0);
    if(!(e.dead&&e.hp<=0&&L.anim.die&&R3D.nDying++<CROWD.dying)){R3D.actors.delete(e);freeActor(a);return}
    a.dieT=1.1;a.base=null;once(a,L.anim.die,0.7,true)}
  a.dieT-=dt;a.mixer.update(dt);
  if(a.dieT<0.35)a.root.position.y-=dt*60;
  if(a.dieT<=0){R3D.actors.delete(e);freeActor(a)}
}

/* נקרא מ-render() אחרי שהקנבס חישב את ההזזה (כולל רעידת מסך), כדי ששתי השכבות יזוזו יחד */
function render3d(ox,oy){
  if(!R3D.on||!P)return;
  if(!R3D._mx){R3D._mx=new THREE.Matrix4();R3D._p=new THREE.Vector3();R3D._q=new THREE.Quaternion();R3D._s=new THREE.Vector3();R3D._up=new THREE.Vector3(0,1,0)}
  // drawEvery: הבדיקה האוטומטית מציירת רק חלק מהפריימים, כי שם התלת-ממד רץ על המעבד בלי כרטיס גרפי. בשאר הפריימים לא עושים כלום
  R3D.frame=(R3D.frame||0)+1;if(R3D.drawEvery&&R3D.frame%R3D.drawEvery!==0)return;
  const r=R3D.r,c=R3D.cam,now=performance.now(),dt=Math.min(0.05*(R3D.drawEvery||1),R3D.last?(now-R3D.last)/1000:0)*(S.mode==='play'&&!(S.hitstop>0)?(S.slow>0?0.35:1):S.mode==='over'?1:0);R3D.last=now;
  const pr=Math.min(DPR,1.5);if(r.getPixelRatio()!==pr)r.setPixelRatio(pr);
  if(R3D.w!==W||R3D.h!==H){R3D.w=W;R3D.h=H;r.setSize(W,H,false);c.left=-W/2;c.right=W/2;c.top=H/2;c.bottom=-H/2;c.updateProjectionMatrix()}
  // המצלמה מסתכלת על אותה נקודה שבמרכז הקנבס
  const S_=SIN(),cx=W/2-ox,cz=(H/2-oy)/S_;
  c.position.set(cx,2000*S_,cz+2000*COS());c.lookAt(cx,0,cz);
  const gt=R3D.ground.userData.tile;R3D.ground.position.set(Math.round(cx/gt)*gt,0,Math.round(cz/gt)*gt);
  R3D.scene.background.set(S.room?VIEW.room:VIEW.ground);R3D.ground.material.color.set(S.room?'#5b4a24':VIEW.groundLine);
  for(const k in R3D.marks)R3D.marks[k].count=0;
  for(const k in R3D.crowd)for(const p of R3D.crowd[k])for(const m of p)m.count=0;
  R3D.nCrowd=0;
  if(!S.room){
    syncPlayer(dt);
    // רק מי שעל המסך. הבוס, המבוקש ואויבי-העל תמיד מונפשים, ואחריהם הקרובים לשחקן. השאר בקהל
    const vis=enemies.filter(e=>!e.dead&&(e.isBoss||onScreen(e.x+ox,e.y+oy)));
    if(vis.length>CROWD.full){const pr=e=>e.isBoss||e.wanted||e.elite?-1:Math.hypot(e.x-P.x,e.y-P.y);vis.sort((a,b)=>pr(a)-pr(b))}
    vis.forEach((e,i)=>i<CROWD.full||!R3D.crowd[e.type]?syncEnemy(e,dt):crowdAdd(e));
    R3D.nDying=0;for(const a of R3D.actors.values())if(a.dieT>0.05)R3D.nDying++;
    for(const [e,a] of R3D.actors)if(a.seen!==R3D.frame||e.dead)retire(e,a,dt);
  }else{ // בחדר הבונוס אין אויבים, רק השחקן
    syncPlayer(dt);for(const [e,a] of R3D.actors){R3D.actors.delete(e);freeActor(a)}
  }
  // שולחים לכרטיס הגרפי רק את החלק שבשימוש: שליחה של הכל בכל פריים תוקעת את הציור
  const up=m=>{if(!m.count)return;const b=m.instanceMatrix;b.clearUpdateRanges();b.addUpdateRange(0,m.count*16);b.needsUpdate=true};
  for(const k in R3D.marks)up(R3D.marks[k]);
  for(const k in R3D.crowd)for(const p of R3D.crowd[k])for(const m of p)up(m);
  r.render(R3D.scene,c);
  const i=r.info.render;R3D.stats={calls:i.calls,tris:i.triangles,actors:R3D.actors.size+1,crowd:R3D.nCrowd};
}
// התחלה מחדש: מנקים דמויות מהריצה הקודמת
function reset3d(){if(!R3D.ready)return;for(const [e,a] of R3D.actors)freeActor(a);R3D.actors.clear();if(R3D.player){R3D.player.st=null;R3D.player.one=null;R3D.player.base=null;R3D.player.mixer.stopAllAction()}}

if(R3D.want)init3d();else showGfx();
