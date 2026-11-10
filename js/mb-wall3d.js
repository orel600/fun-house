/* משחקי השאול: חומת הברזל של הטנק כחומה אמיתית בתלת-ממד (MBWALL3D, השיפוץ, BOB, 10.11.2026). רק מראה.
   אוראל דחה את הפס הדק: בקנבס (moba.js) החומה הייתה מלבן שטוח ברוחב 20 לכל גובה הנתיב, מעל התלת-ממד, וממצלמת המשחק היא נראתה קו שחוצה את כל המסך.
   כאן: שורה של גושי אבן בחישוקי ברזל לאורך הנתיב, מקצה לקצה, באותו x. פס צבע הקבוצה לאורך הראש, פס צבע הקבוצה על הרצפה, ולוח כהה מתחת.
   הבעלות לפי חומה (NOVA, 10.11): MBWALL3D.owns(w) אמת רק אחרי שהגוף של החומה הזאת נבנה ונמצא בסצנה. רק אז הפס בקנבס (moba.js) והסמל sk_wall (moba-kits.js) של החומה הזאת לא מצוירים.
   בכל מקרה אחר (דו-ממד, ?mbwall=old, התלת-ממד כבוי, עוד לא נבנה) הפס והסמל נשארים כמו שהיו.
   נראית בגובה מלא מהרגע שנוצרה עד הצעד האחרון שבו היא חוסמת (כל עוד היא ב-MB.walls), ואז נמחקת. בלי עלייה מאפס ובלי שקיעה מוקדמת.
   ניקוי מפורש: כשהיא יוצאת מ-MB.walls, במשחק חדש (mobaStart), ביציאה (mobaExit), וכשהתלת-ממד כבה. MBWALL3D.clear() מנקה הכל.
   החומרים: MBWALL3D.material(part,team) יכול להחזיר חומר משלו לכל חלק ('stone','strap','cap','plate','band'), או null לברירת המחדל. חומר שהגיע משם לא נמחק כאן.
   הכללים לא משתנים: איפה החומה (MB.walls: x, קבוצה, זמן), מי עובר ומי לא (moba.js mbStep ויריות), והזמן שלה. מחיקה: הקובץ, השורה ב-index.html והבדיקה ב-moba.js */
const MBWALL3D={
  on:!/[?&]mbwall=old(&|$)/.test(location.search),
  // the style descriptor: everything that decides the look, nothing that decides the rules
  style:{
    seg:{w:40,d:34,h:60,jit:0.18,gap:4,ridge:14},   // גוש: רוחב (ציר x), עומק (לאורך הנתיב), גובה ביחידות משחק. jit: גבהים שונים קצת. gap: רווח בין גושים. ridge: רוחב פס הקבוצה לאורך הראש
    stone:'#6a6470',strap:'#2a2730',cap:0.85,       // צבע האבן, צבע החישוק, ועוצמת פס הקבוצה בראש
    plate:{a:0.35,pad:10},                          // הלוח הכהה על הרצפה: שקיפות, וכמה רחב מהגושים (מעבר לפס הקבוצה)
    band:{a:0.5,pad:12,glow:0.6}                    // פס בצבע הקבוצה על הרצפה לרגלי החומה: שקיפות, כמה בולט מכל צד, ועוצמת הזוהר של פס הראש
  },
  material:null,   // hook: fn(part,team) -> THREE.Material | null
  stat:{built:0,removed:0,cleared:0,fxSuppressed:0,buildFailed:0}
};
// the 3D renderer can show walls right now
const mbWall3dOn=()=>MBWALL3D.on&&typeof R3D!=='undefined'&&R3D.on&&!!R3D.ready&&!!R3D.scene&&typeof S!=='undefined'&&!!S&&!!S.mb;
// does the 3D volume own this wall (built and in the scene)? only then the canvas strip and sk_wall of this wall are skipped
const mbWall3dOwns=w=>typeof MBWALL3D.owns==='function'&&MBWALL3D.owns(w);
(function(){
  const X=MBWALL3D;if(!X.on){X.owns=()=>false;X.clear=()=>{};X.count=()=>0;return}
  const live=new Map(),failed=new WeakSet();let geo=null,base=null;   // failed: a wall whose build threw once: not retried, it keeps the strip and sk_wall
  const ensureBase=()=>{if(geo)return;const St=X.style;geo=new THREE.BoxGeometry(1,1,1);
    base={stone:new THREE.MeshLambertMaterial({color:St.stone}),strap:new THREE.MeshLambertMaterial({color:St.strap}),
      plate:new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:St.plate.a,depthWrite:false})}};
  const custom=(part,team)=>{if(typeof X.material!=='function')return null;try{return X.material(part,team)||null}catch(e){return null}};
  const hash=(i,k)=>{const v=Math.sin(i*12.9898+k*78.233)*43758.5453;return v-Math.floor(v)};
  // build the volume of one wall: segments, iron straps, team ridge, floor plate and team band, in one group at the wall's x
  const build=w=>{
    const made={inst:[],geos:[],own:[],g:null};
    try{return buildIn(w,made)}catch(e){try{if(made.g)made.g.removeFromParent();for(const o of made.inst)o.dispose();for(const q of made.geos)q.dispose();for(const m of made.own)m.dispose()}catch(_){}throw e}
  };
  const buildIn=(w,made)=>{
    ensureBase();const St=X.style,L=MOBA.lane,s=SIN(),c=COS(),G=St.seg,n=Math.ceil(L.half*2/(G.d+G.gap)),g=new THREE.Group(),step=L.half*2/n,col=MOBA.team[w.team];
    const own=made.own;made.g=g;   // materials made here for this wall (disposed with it)
    const mk=(part,fn)=>{const m=custom(part,w.team);if(m)return m;const d=fn();if(d!==base[part])own.push(d);return d};
    const stoneM=mk('stone',()=>base.stone),strapM=mk('strap',()=>base.strap),plateM=mk('plate',()=>base.plate);
    const capM=mk('cap',()=>new THREE.MeshLambertMaterial({color:col,emissive:col,emissiveIntensity:St.band.glow*St.cap}));
    const bandM=mk('band',()=>new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:St.band.a,depthWrite:false,toneMapped:false}));
    const st=new THREE.InstancedMesh(geo,stoneM,n),sp=new THREE.InstancedMesh(geo,strapM,n),cp=new THREE.InstancedMesh(geo,capM,n);made.inst.push(st,sp,cp);const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),P=new THREE.Vector3(),Sc=new THREE.Vector3();
    for(let i=0;i<n;i++){const y=-L.half+step*(i+0.5),h=G.h*(1+(hash(i,w.x)-0.5)*2*G.jit),z=y/s;e.set(0,(hash(i,7)-0.5)*0.12,0);q.setFromEuler(e);
      P.set(w.x,h/c/2,z);Sc.set(G.w,h/c,(step-G.gap)/s);st.setMatrixAt(i,m.compose(P,q,Sc));
      P.set(w.x,h/c*0.55,z);Sc.set(G.w+1.5,4/c,(step-G.gap)/s+1.5);sp.setMatrixAt(i,m.compose(P,q,Sc));
      P.set(w.x,h/c+1.5/c,z);Sc.set(G.ridge,3/c,(step-G.gap)/s);cp.setMatrixAt(i,m.compose(P,q,Sc))}
    const geos=made.geos;geos.push(new THREE.PlaneGeometry(G.w+St.plate.pad*2+St.band.pad*2,L.half*2/s).rotateX(-Math.PI/2),new THREE.PlaneGeometry(G.w+St.band.pad*2,L.half*2/s).rotateX(-Math.PI/2));
    const pl=new THREE.Mesh(geos[0],plateM);pl.position.set(w.x,0.6,0);pl.renderOrder=1;
    const bd=new THREE.Mesh(geos[1],bandM);bd.position.set(w.x,0.9,0);bd.renderOrder=2;
    g.add(pl,bd,st,sp,cp);g.name='mbwall3d';R3D.scene.add(g);X.stat.built++;
    return {g,inst:[st,sp,cp],geos,own};
  };
  const drop=(w,r)=>{r.g.removeFromParent();for(const o of r.inst)o.dispose();for(const q of r.geos)q.dispose();for(const m of r.own)m.dispose();live.delete(w);X.stat.removed++};
  X.clear=()=>{if(!live.size)return;for(const [w,r] of live)drop(w,r);X.stat.cleared++};
  X.count=()=>live.size;
  // build now if the renderer can show it (also called at cast time, before sk_wall, so the same frame already belongs to the volume)
  const ensure=w=>{if(!mbWall3dOn()||failed.has(w))return null;let r=live.get(w);if(!r){try{r=build(w)}catch(e){failed.add(w);X.stat.buildFailed++;return null}live.set(w,r)}return r};
  X.owns=w=>{
    if(!mbWall3dOn()){if(live.size)X.clear();return false}   // renderer off or out of the match: cleanup, and the strip is back
    const r=live.get(w);return !!(r&&r.g.parent===R3D.scene&&typeof MB!=='undefined'&&MB&&MB.walls.includes(w));
  };
  // every frame: drop walls that left MB.walls (their last blocking tick is over), build new ones, keep full height and visible
  const sync=()=>{
    if(!mbWall3dOn()){X.clear();return}
    const W=MB.walls||[];for(const [w,r] of live)if(!W.includes(w))drop(w,r);
    for(const w of W){const r=ensure(w);if(r){r.g.visible=true;r.g.scale.y=1}}
  };
  if(typeof syncPlayer==='function'){const b=syncPlayer;syncPlayer=function(){const r=b.apply(this,arguments);try{sync()}catch(e){}return r}}
  // after each update: a wall that just expired is dropped at once, even before the next draw
  if(typeof mobaUpdate==='function'){const b=mobaUpdate;mobaUpdate=function(){const r=b.apply(this,arguments);try{if(live.size&&!mbWall3dOn())X.clear();if(live.size){const W=(typeof MB!=='undefined'&&MB&&MB.walls)||[];for(const [w,q] of live)if(!W.includes(w))drop(w,q)}}catch(e){}return r}}
  if(typeof mobaStart==='function'){const b=mobaStart;mobaStart=function(){X.clear();return b.apply(this,arguments)}}
  if(typeof mobaExit==='function'){const b=mobaExit;mobaExit=function(){X.clear();return b.apply(this,arguments)}}
  // sk_wall (moba-kits.js, right after MB.walls.push): skipped only for the wall the volume owns. Otherwise (2D, old, not built) it plays as before
  if(typeof mbfxSk==='function'){const b=mbfxSk;mbfxSk=function(id,x){
    if(id==='sk_wall'&&typeof MB!=='undefined'&&MB&&MB.walls.length){const w=MB.walls[MB.walls.length-1];if(Math.abs(w.x-x)<0.5){let own=false;try{ensure(w);own=X.owns(w)}catch(e){own=false}if(own){X.stat.fxSuppressed++;return null}}}
    return b.apply(this,arguments)}}
})();
