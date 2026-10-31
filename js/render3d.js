/* תלת-ממד: שכבה מתחת לקנבס הרגיל. היא מציירת את הקרקע ואת הדמויות כמודלים מונפשים,
   והקנבס הרגיל מעליה ממשיך לצייר כל השאר: חצים, יריות, ניצוצות, מספרים, אזורים וחיצים בקצה המסך.
   הלוגיקה לא יודעת על השכבה הזו: היא רק קוראת את P, S ו-enemies, בדיוק כמו render.js.
   המודלים והאנימציות ב-js/models3d.js (KayKit, CC0), ונבנים מחדש עם tools/build3d.js.
   כל דמות משתמשת באותו שלד, אז כל אנימציה עובדת על כל דמות.

   התאמה לקנבס: מצלמה אורתוגרפית ביחידות של פיקסלים, בזווית VIEW.tilt מעל הקרקע.
   נקודה (x,y) במשחק יושבת ב-(x, 0, y/sin(tilt)) בעולם התלת-ממדי, וכך היא מופיעה על המסך בדיוק איפה שהקנבס מצייר אותה.
   אם WebGL לא זמין, או שהשחקן בחר 2D, הכל נשאר כמו קודם (R3D.on=false). */

/* zoom: כמה רחוק המצלמה בכל מקום. 1 = כמו קודם, 0.75 = רואים בערך פי 1.8 שטח (ניר, 31.10.2026: "נקודת המבט צריכה להיות מגבוה יותר").
   הזירה נשארת 1 (התחום של אוראל). יותר שטח = יותר דברים לצייר, אז בטלפון חלש כדאי למדוד עם ?fps */
const VIEW={zoom:{village:0.8,world:0.72},tilt:42*Math.PI/180, light:1.15, ground:'#263049', groundLine:'#3a4562', room:'#3a3018', village:'#2a3a2c', villageLine:'#5f7d52', world:'#2c4229', worldLine:'#6f8f55'};

/* מי לובש איזה מודל. h: גובה הדמות על המסך בפיקסלים. foot: כמה פיקסלים מתחת למרכז הלוגי הרגליים נוגעות בקרקע.
   props: חפצים ביד (bone: היד, ומיקום וסיבוב מקומיים כמו בחבילה המקורית). הטבעת מתחת לרגליים היא בצבע החולשה של האויב (e.weak, מ-data.js), ולא כתובה כאן. tint: צבע מ-TINT.
   anim: שמות האנימציות מהחבילה. דמות חדשה = שורה כאן (ומודל ב-build3d.js).
   לשחקן אין props כאן: הוא מחזיק את הנשק שלבוש בציוד (heroLook, לפי GRIP3D) */
const HAND_R={bone:'handslotr',pos:[0,0.033,0],rot:[0,-1,0,0]};
const NPC_ANIM={idle:'Idle_A',walk:'Walking_A',work:'Idle_A',wave:'Waving',cheer:'Cheering'};   // תושבי הכפר: מה מנגנים בכל מצב (npc.js). KayKit 2.0
const DOG_ANIM={idle:'dog_Idle',walk:'dog_Walk',run:'dog_Gallop',sit:'dog_Sit',dig:'dog_Dig',bark:'dog_Attack',jump:'dog_Gallop_Jump'};   // השלד של ההאסקי (build3d.js)
const LOOK3D={
  player:{model:'knight',h:66,foot:14,
    anim:{idle:'Idle_A',run:'Running_A',hit:'Hit_A',die:'Death_A',win:'Cheering'}},
  grunt:{model:'minion',h:54,foot:12,props:{blade:{prop:'blade',...HAND_R}},anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  shield:{model:'warrior',h:60,foot:14,props:{shield:{prop:'shield',bone:'handslotl',pos:[0,0.017,0.156],rot:[0,0,0,1],tint:'fire'}},
    anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  wisp:{model:'skelMage',h:56,foot:12,float:6,props:{staff:{prop:'staff',...HAND_R,tint:'ice'}},
    anim:{run:'Running_C',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons',cast:'Spellcasting'}},
  // דמויות ההתחלה (HEROES ב-heroes.js): כמו player, עם מודל משלהן (KayKit Adventurers 2.0).
  // h לפי הגובה של כל מודל (בלי קסדה הצייד נמוך, והכובע מגביה את הקוסם), כדי שהגוף יהיה בגודל של האביר
  hero_warrior:{model:'knight'},
  hero_hunter:{model:'ranger',h:59},
  hero_mage:{model:'mage',h:69},
  wanted:{model:'rogue',h:62,foot:13,tint:'gold',anim:{run:'Running_B',die:'Death_A'}},
  // יצורי משאבים: בינתיים מודל קיים, צבוע בצבע החומר (tint) ובגודל אחר. כשיהיו מודלים משלהם מחליפים רק כאן
  golem:{model:'barbarian',h:84,foot:18,tint:'#8A8F9C',anim:{run:'Running_B',die:'Death_A'}},
  treant:{model:'warrior',h:74,foot:16,tint:'#4F8A3E',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  crawler:{model:'minion',h:40,foot:10,tint:'#C87533',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  sprite:{model:'mage',h:40,foot:10,float:8,tint:'#7BD88F',anim:{run:'Running_C',die:'Death_C_Skeletons'}},
  mummy:{model:'minion',h:56,foot:12,tint:'#D9C9A3',anim:{run:'Walking_D_Skeletons',spawn:'Spawn_Ground_Skeletons',die:'Death_C_Skeletons'}},
  boss:{model:'barbarian',h:140,foot:28,anim:{run:'Running_B',idle:'Idle_A',charge:'Melee_2H_Attack_Spin',cast:'Melee_2H_Attack_Chop',taunt:'Taunt',die:'Death_A'}},
  // פיילוט ג'מיני: הגיבור מהדף של ניר, על השלד של האביר. בלי קסדה הוא נמוך יותר, אז h קטן כדי שהגוף יהיה בגודל של האביר.
  // לבדיקה בלבד: עם ?hero=pilot בכתובת הוא נכנס במקום האביר של הלוחם (דמות ההתחלה הראשונה)
  pilotHero:{model:'pilotHero',h:56,foot:14},
  // הדמות האישית של ניר (HEROES.skins ב-heroes.js): מראה בלבד, מעל המחלקה שנבחרה. אותו גובה כמו הפיילוט
  nirHero:{model:'nirHero',h:56,foot:14},
  orelHero:{model:'orelHero',h:58,foot:14},   // הדמות האישית של אוראל. הברדס מגביה אותו קצת
  /* תושבי הכפר (NPC ב-npc.js): דמויות KayKit בצבע משלהן, עם אנימציות העבודה של 2.0 (NPC_ANIM), עד שיגיעו הדמויות של ג'מיני.
     own:false מסתיר את הנשק שהדמות מחזיקה בקובץ המקורי. anim: מה מנגנים בכל מצב של התושב (idle, walk, work, wave, cheer) */
  npc_head:{model:'knight',h:64,foot:14,tint:'gold',anim:{...NPC_ANIM,idle:'Idle_B'}},
  npc_smith:{model:'barbarian',h:66,foot:14,tint:'fire',own:false,props:{hammer:{prop:'w_hammer_A',...HAND_R}},anim:{...NPC_ANIM,work:'Hammering'}},
  npc_merchant:{model:'rogue',h:60,foot:13,tint:'gold',own:false,anim:NPC_ANIM},
  npc_inn:{model:'barbarian',h:58,foot:13,own:false,anim:NPC_ANIM},
  npc_priest:{model:'mage',h:66,foot:13,tint:'lilac',props:{staff:{prop:'w_staff_A',...HAND_R}},anim:{...NPC_ANIM,work:'Ranged_Magic_Spellcasting'}},
  // דמויות בעולם הפתוח (WNPC ב-worldnpc.js)
  npc_fisher:{model:'ranger',h:58,foot:13,tint:'#3F7BF5',own:false,anim:{...NPC_ANIM,idle:'Idle_B'}},
  npc_cutter:{model:'barbarian',h:62,foot:14,tint:'#A8784A',own:false,props:{hammer:{prop:'w_hammer_A',...HAND_R}},anim:NPC_ANIM},
  npc_herbal:{model:'mage',h:60,foot:13,tint:'#5FA35A',anim:NPC_ANIM},
  /* חיית המחמד (pet.js): pet_<חיה><שלב>. הגובה על המסך מ-PET (stages[].h), כי גם הדו-ממד משתמש בו. anim: מה מנגנים בכל מצב של החיה */
  pet_piocho1:{model:'piocho1',foot:2,anim:DOG_ANIM},
  pet_piocho2:{model:'piocho2',foot:2,anim:DOG_ANIM},
  pet_piocho3:{model:'piocho3',foot:2,anim:DOG_ANIM,glow:'#FF8A3D'}   // glow: הסימנים על הגוף זוהרים ופועמים (PET.fx)
};
/* הנשק ביד השחקן: המודל מ-look.model של הפריט בציוד (GEAR.items ב-gear.js), והחומר לפי ה-tier שלו (טקסטורה wtex_<חומר>, build3d.js).
   כל משפחת נשקים יושבת ביד אחרת ותוקפת באנימציה אחרת. of: לאיזו משפחה שייך מודל, לפי השם.
   spare: מה ביד כשלפריט אין מודל. עץ, הכי פשוט. איזה צד (sword או gun) מחליט סוג הנשק (WEAPONS ב-weapons.js) */
const GRIP3D={
  blade:{...HAND_R,attack:'Melee_1H_Attack_Slice_Horizontal'},
  chop: {...HAND_R,attack:'Melee_1H_Attack_Chop'},    // גרזן ופטיש: מכה מלמעלה
  bow:  {bone:'handslotl',pos:[0,0,0],rot:[0,-0.7071,0,0.7071],attack:'Ranged_Bow_Release',draw:'Ranged_Bow_Draw',idle:'Ranged_Bow_Idle'},   // מותחים לפני כל חץ, ומשחררים ביריה
  magic:{...HAND_R,attack:'Ranged_Magic_Shoot'},
  of:m=>/^w_bow/.test(m)?'bow':/^w_(staff|wand)/.test(m)?'magic':/^w_(axe|hammer)/.test(m)?'chop':'blade',
  spare:{sword:'w_sword_A',gun:'w_bow_A_withString'}   // רק כשלפריט אין מודל
};
/* קהל: כשיש הרבה אויבים על המסך, רק הקרובים לשחקן מקבלים דמות מונפשת. כל השאר מצוירים יחד בתנוחת ריצה קפואה
   שמתחלפת בין שני צעדים: כמה ציורים בפריים במקום מאות. בטלפון זה ההבדל בין משחק שזורם למשחק שנתקע.
   full: כמה דמויות מונפשות לכל היותר. poses: באיזה רגע של אנימציית הריצה מצלמים כל צעד. dying: כמה אנימציות מוות יחד. max: כמה בקהל */
const CROWD={full:30,poses:[0.25,0.75],dying:16,max:320,types:['grunt','shield','wisp']};
const PILOT3D=/[?&]hero=pilot/.test(location.search);
/* הכפר: המיקומים והמראה לפי רמה ב-VILLAGE (js/village.js). כאן רק איזה קובץ מודל לכל שם, ובאיזה רוחב על המסך בפיקסלים.
   models: המבנים (השמות ב-look). site: פיגום, למבנה שעוד לא נבנה או שבונים אותו עכשיו. deco: קישוטים סביב מבנה.
   decor: העצים והגבעות מסביב (villageDecor). stock: ערימה ליד מבנה שיש בו תוצרת שמחכה */
const VIL3D={
  models:{castle:{model:'v_castle',w:190},forge:{model:'v_forge',w:140},mill:{model:'v_mill',w:140},mine:{model:'v_mine',w:140},market:{model:'v_market',w:150},tent:{model:'v_tent',w:105}},
  site:{model:'v_site',w:135},gate:{model:'v_gate',w:150},
  deco:{flag:{model:'v_flag',w:46},crate:{model:'v_crate',w:30},barrel:{model:'v_barrel',w:28}},
  decor:{tree:{model:['v_treeA','v_treeB'],w:55},rock:{model:'v_rock',w:55},hills:{model:'v_hills',w:260}},
  stock:{mill:{model:'v_lumber',w:60},mine:{model:'v_stone',w:60}}
};
/* העולם הפתוח: המיקומים ב-WORLD (js/world.js). מקורות המשאבים לפי הצורה שלהם (shape), מתוך מודלי הכפר, כדי לא להכביד על הטלפון.
   glow: צבע לעורק מתכת. הקישוטים והשערים כמו בכפר (VIL3D.decor, VIL3D.gate) */
const W3D={nodes:{tree:{model:['v_treeA','v_treeB'],w:88},bush:{model:'v_treeB',w:42,glow:'#5FA35A'},chest:{model:'v_crate',w:48,glow:'#F4C74F'},rock:{model:'v_rock',w:62},vein:{model:'v_rock',w:62,glow:'#C87533'}}};   // w: רוחב המודל
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
// keep: חלקים שנשארים נפרדים כדי להדליק ולכבות אותם (שריון לפי דרגה, rankArmor3d)
function mergeSkinned(root,keep){
  // רק חלקים עם אותה טקסטורה מתאחדים. העיניים הזוהרות של השלדים נשארות חלק נפרד
  const all=[];root.traverse(o=>{if(o.isSkinnedMesh&&!(keep&&armorPart(o,keep)))all.push(o)});
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
    const [anims]=await Promise.all([Promise.all(Object.keys(MODELS3D).filter(k=>k.startsWith('anim_')).map(parseGLB)),
      ...Object.values(LOOK3D).map(async L=>{if(R3D.tmpl[L.model])return;const g=await parseGLB(L.model);R3D.tmpl[L.model]=g.scene})]);
    for(const g of anims)for(const a0 of g.animations){
      // משאירים רק מה שמזיז את הגוף בפועל: סיבוב של עצמות הגוף והידיים, ותזוזה של האגן והרגליים.
      // עצמות העזר (IK, control) וקנה המידה לא משנים כלום במשחק, ומכפילים פי ארבעה את העבודה בכל פריים
      // חיות (dog_): כל הסיבובים חוץ מעצמות העזר של הכפות, ו-Body זז (קפיצה, ישיבה)
      const dog=a0.name.startsWith('dog_');
      const a=new THREE.AnimationClip(a0.name,a0.duration,a0.tracks.filter(t=>{const [n,pr]=t.name.split('.');
        return dog?(pr==='quaternion'&&!/^(IK|FF|Pole)/.test(n)||n==='Body'&&pr==='position'):!/IK|control/.test(n)&&(pr==='quaternion'||pr==='position'&&/^(root|hips|upperleg)/.test(n))}));
      R3D.clips[a.name]=a;
      R3D.clips[a.name+'@up']=new THREE.AnimationClip(a.name+'@up',a.duration,a.tracks.filter(t=>UPPER.test(t.name)));
      R3D.clips[a.name+'@low']=new THREE.AnimationClip(a.name+'@low',a.duration,a.tracks.filter(t=>!UPPER.test(t.name)))}
    for(const k in MODELS3D)if(['blade','shield','staff'].includes(k)||k.startsWith('w_')){const g=await parseGLB(k);lambert(g.scene);R3D.props[k]=g.scene}   // נשקים
    // חומרי הנשקים: אותה פלטה בצבעים אחרים, שמחליפה את הטקסטורה של הנשק (makeActor)
    R3D.wtex={};for(const k in MODELS3D)if(k.startsWith('wtex_')){
      const img=new Image();img.src='data:image/png;base64,'+MODELS3D[k];await img.decode();
      const t=new THREE.Texture(img);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;R3D.wtex[k.slice(5)]=t}
    for(const k in MODELS3D)if(k.startsWith('v_')){const g=await parseGLB(k);lambert(g.scene);g.scene.traverse(o=>{o.frustumCulled=true});R3D.props[k]=g.scene}   // מבני הכפר
    const heroModels=new Set(Object.keys(LOOK3D).filter(k=>k==='player'||k.startsWith('hero_')).map(k=>LOOK3D[k].model));
    for(const k in R3D.tmpl){const t=R3D.tmpl[k];mergeSkinned(t,heroModels.has(k)&&ARMOR3D);lambert(t);t.updateMatrixWorld(true);
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
  R3D.marks={shadow:mk(disc,0x05070d,0.45)};for(const k in DMG.types)R3D.marks[k]=mk(ring,DMG.types[k].col,0.85);   // טבעת לכל סוג נזק
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
  const rr=e.r*1.15;mark('shadow',R3D._p.x,R3D._p.z,rr);if(e.weak)mark(e.weak,R3D._p.x,R3D._p.z,rr*1.15);
}

/* ---- דמויות ---- */
const SIN=()=>Math.sin(VIEW.tilt),COS=()=>Math.cos(VIEW.tilt);
// השחקן: הדמות שנבחרה, ובידיים הנשק שלבוש (GRIP3D). נבנה מחדש רק כשהדמות או הנשק מתחלפים
function heroLook(){
  const wid=SAVE.gear.weapon,sk=heroSkin(),ck=heroId()+'|'+wid+'|'+PILOT3D+'|'+sk;if(R3D._hl&&R3D._hl.ck===ck)return R3D._hl;
  const L=Object.assign({},LOOK3D.player,sk?LOOK3D[HEROES.skins[sk].look]:PILOT3D&&heroId()==='warrior'?LOOK3D.pilotHero:LOOK3D['hero_'+heroId()]),it=gItem(wid);
  L.props={};L.anim=Object.assign({},L.anim);L.ck=ck;
  for(const w of ['sword','gun']){
    const mine=it&&wUse(wid)===w&&it.look&&R3D.props[it.look.model],model=mine?it.look.model:GRIP3D.spare[w],g=GRIP3D[GRIP3D.of(model)];
    L.props[w]=Object.assign({prop:model,tier:mine?GEAR.tiers[it.tier].id:'wood'},g);
    L.anim[w]=g.attack;if(g.idle)L.anim[w+'Idle']=g.idle;if(g.draw)L.anim[w+'Draw']=g.draw;
  }
  if(fluteOn())fluteGrip(L);   // הנודד עם החליל: חליל ביד במקום הנשק (flute.js)
  return R3D._hl=L;
}
function lookOf(e){return e===P?heroLook():e.isBoss?LOOK3D.boss:e.wanted?LOOK3D.wanted:LOOK3D[e.type]}
// מפתח למאגר: רק דמות זהה (מודל, חפצים, צבע, גודל, נשק מוסתר) חוזרת לשימוש. יצורי משאבים הם מודל קיים בצבע ובגודל אחר
const lookKey=L=>L.model+'|'+Object.values(L.props||{}).map(p=>p.prop+(p.tier||'')).join()+(L.tint?'|'+L.tint:'')+'|'+L.h+(L.own===false?'|x':'');
const TINT={ember:C.ember,tide:C.tide,gold:C.gold,...Object.fromEntries(Object.keys(DMG.types).map(k=>[k,DMG.types[k].col])),lilac:C.lilac};   // צבע לכל סוג נזק, ושמות הצבעים של המשחק
const tintOf=t=>TINT[t]||t;   // שם מ-TINT, או צבע ישיר ('#8A8F9C')
function makeActor(L){
  const pool=R3D.pool||(R3D.pool={});const free=pool[lookKey(L)];
  if(free&&free.length){const a=free.pop();a.root.visible=true;a.dieT=0;a.base=null;a.one=null;a.mixer.stopAllAction();return a}
  const t=R3D.tmpl[L.model],root=THREE.SkeletonUtils.clone(t),s=L.h/COS()/t.userData.h;
  root.scale.setScalar(s);
  const mats=[];
  root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(L.tint)o.material.emissive.set(tintOf(L.tint)).multiplyScalar(L.tint[0]==='#'?0.45:0.18);o.material.userData.em=o.material.emissive.clone();mats.push(o.material)}});
  const props={};
  for(const [k,p] of Object.entries(L.props||{})){
    const b=bone(root,p.bone);if(!b)continue;
    const m=R3D.props[p.prop].clone(true);m.position.fromArray(p.pos);m.quaternion.fromArray(p.rot);
    m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(p.tier&&R3D.wtex[p.tier])o.material.map=R3D.wtex[p.tier];if(p.tint)o.material.emissive.set(TINT[p.tint]).multiplyScalar(0.55);o.material.userData.em=o.material.emissive.clone();mats.push(o.material)}});
    b.add(m);props[k]=m;
  }
  // נשקים שהדמות מחזיקה בקובץ המקורי: גרזן לבוס, סכין למבוקש
  let own=null;root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&/^(1H|2H)_|Knife/.test(o.name))own=own||o});
  const a={root,mats,props,own,mixer:new THREE.AnimationMixer(root),L,key:lookKey(L),base:null,one:null,flash:0,dieT:0};
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

/* שריון לפי דרגה (RANKS ב-ranks.js): מדליקים ומכבים חלקים שכבר יש במודל, וזוהר בצבע הדרגה על מה שנדלק.
   חלק נמצא לפי הסוף של השם שלו (Knight_Cape ← 'Cape'). חלק שאין במודל, למשל בדמות של ניר, לא קיים כאן ולא קורה כלום */
const ARMOR3D=[...new Set([...RANKS.bare,...Object.values(RANKS.list).flatMap(R=>R.look?R.look.show:[])])];
function armorPart(o,parts){const n=o.name||(o.parent&&o.parent.name)||'';return parts.find(p=>n.endsWith('_'+p))||null}
function rankArmor3d(a){
  const id=rankId(),R=RANKS.list[id],look=R&&R.look;if(a.rk===id)return;a.rk=id;
  a.root.traverse(o=>{if(!o.isMesh)return;const p=armorPart(o,ARMOR3D);if(!p)return;
    const on=look&&look.show.includes(p);o.visible=on||!RANKS.bare.includes(p);
    const em=on&&look.glow?new THREE.Color(R.col).multiplyScalar(look.glow):new THREE.Color(0);
    o.material.emissive.copy(em);o.material.userData.em=em});
}
function syncPlayer(dt){
  r3dScratch();
  const L=heroLook();
  let a=R3D.player;if(!a||a.key!==lookKey(L)){if(a)freeActor(a);a=R3D.player=makeActor(L)}   // דמות או נשק חדשים: מודל חדש
  rankArmor3d(a);   // אחרי עלייה בדרגה: החלקים מופיעים מיד
  const sword=P.weapon==='sword';
  for(const k in a.props)a.props[k].visible=(k==='sword')===sword;
  const st=a.st||(a.st={anim:0,gt:0,inv:0,mode:''});
  if(S.mode==='over'){if(st.mode!=='over'){st.mode='over';a.base=null;a.mixer.stopAllAction();once(a,S.won?L.anim.win:L.anim.die,1.2,true)}}
  else{
    if(st.mode==='over'){st.mode='';a.one=null;a.mixer.stopAllAction()}
    // תקיפה: רק פלג הגוף העליון, כך שאפשר לתקוף תוך כדי ריצה
    const swing=sword&&P.sw.anim>st.anim,shot=!sword&&P.gn.t>st.gt+0.01;
    st.anim=P.sw.anim;st.gt=P.gn.t;
    if(swing)once(a,L.anim.sword+'@up',Math.max(0.28,Math.min(0.5,P.sw.cd*wK('cd')*0.8)));
    const gcd=P.gn.cd*wK('cd');
    if(shot){st.shots=(st.shots||0)+1;once(a,L.anim.gun+'@up',Math.max(0.2,Math.min(0.45,gcd*0.9)))}
    // קשת: מותחים את המיתר ממש לפני החץ הבא, כשיש במי לירות
    const drawT=Math.min(0.4,gcd*0.5);
    if(!sword&&L.anim.gunDraw&&P.gn.t>0&&P.gn.t<=drawT&&st.drawn!==st.shots&&nearest(440)&&!(a.one&&a.one.isRunning())){st.drawn=st.shots;once(a,L.anim.gunDraw+'@up',P.gn.t)}
    // פגיעה (combat.js מדליק P.inv=0.6): הגוף נרתע, אם הוא לא באמצע תקיפה
    const hurt=P.inv>st.inv+0.3&&P.inv<=0.7;st.inv=P.inv;
    if(hurt&&!swing&&!shot&&!(a.one&&a.one.isRunning()))once(a,L.anim.hit+'@up',0.3);
    const busy=a.one&&a.one.isRunning(),idle=!sword&&L.anim.gunIdle||L.anim.idle;   // עם קשת ביד: עמידה עם קשת
    loop(a,(P.moving?L.anim.run:idle)+(busy?'@low':''),P.moving?Math.min(1.6,P.speed/165):1);
  }
  // הגוף לפי P.face: לאן שהולכים (update.js). הסיבוב הרך כבר שם, אז כאן בלי עיכוב נוסף
  place(a,P.x,P.y,L.foot,null);a.root.rotation.y=yawOf(Math.cos(P.face),Math.sin(P.face));
  a.root.visible=!(P.inv>0&&Math.floor(P.inv*20)%2===0)||RM;
  setFlash(a,P.inv>0.45?0.5:P.swapBuff>0?0.25:0,P.inv>0.45?C.blood:C.gold);
  a.mixer.update(dt);
  // איפה הנשק על המסך, בשביל הזוהר של Aging שמצויר בקנבס (aging.js). מהעולם חזרה לקואורדינטות המשחק
  const w=a.props[sword?'sword':'gun'];if(w){const v=w.getWorldPosition(R3D._v||(R3D._v=new THREE.Vector3()));AGE_FX.hand={x:v.x,y:v.z*SIN()-v.y*COS()}}
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
    // לאן שהוא הולך. כשהוא נהדף אחורה (kx,ky) הוא ממשיך להסתכל עליך, ולא מסתובב עם המכה
    yaw=sp>5&&Math.hypot(e.kx||0,e.ky||0)<sp?yawOf(dx,dy):yawOf(P.x-e.x,P.y-e.y);
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
  mark('shadow',x,z,rr);if(e.weak)mark(e.weak,x,z,rr*1.15);
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

/* ---- הכפר ---- */
// מודל במקום (x,y) במשחק, בגודל w פיקסלים לרוחב, יושב על הקרקע
function vPut(model,x,y,w,rot=0,group=R3D.vil.g){
  const t=R3D.props[model],m=t.clone(true),bb=t.userData.bb||(t.userData.bb=new THREE.Box3().setFromObject(t));
  const s=w/Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z,1e-3);
  m.scale.setScalar(s);m.rotation.y=rot;m.position.set(x,-bb.min.y*s,y/SIN());group.add(m);return m;
}
function syncVillage(){
  let V=R3D.vil;
  if(!V){V=R3D.vil={g:new THREE.Group(),b:{},stock:{}};R3D.scene.add(V.g);
    for(const d of villageDecor()){const D=VIL3D.decor[d.kind],md=Array.isArray(D.model)?D.model[d.v<0.5?0:1]:D.model;vPut(md,d.x,d.y,D.w*(0.8+d.v*0.4),d.v*6.28)}
    const g=VILLAGE.gate;vPut(VIL3D.gate.model,g.x,g.y,VIL3D.gate.w);
    for(const k in VIL3D.stock){const B=VILLAGE.b[k];V.stock[k]=vPut(VIL3D.stock[k].model,B.x+B.r*1.05,B.y-B.r*0.25,VIL3D.stock[k].w)}}
  V.g.visible=true;
  // מבנה שעלה רמה מתחלף לפי vLook: פיגום עד שנבנה, ואחר כך המודל, הגודל, הקישוטים והזוהר של הרצועה שלו
  for(const k in VILLAGE.b){
    const B=VILLAGE.b[k],lk=vLook(k),key=lk?lk.model+lk.L:'site',cur=V.b[k];
    if(cur&&cur.key===key)continue;if(cur)for(const m of cur.all)V.g.remove(m);
    const D=lk?VIL3D.models[lk.model]:VIL3D.site,m=vPut(D.model,B.x,B.y,D.w*(lk?lk.size:1)),all=[m];
    if(lk){if(lk.glow)m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive.set(lk.glow).multiplyScalar(0.22)}});
      lk.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length];all.push(vPut(VIL3D.deco[d].model,B.x+dx*B.r,B.y+dy*B.r,VIL3D.deco[d].w))})}
    V.b[k]={key,all};
  }
  for(const k in V.stock)V.stock[k].visible=vStock(k)>0;
}
// העולם הפתוח: קישוטים, שערים ומקורות משאבים נבנים פעם אחת (המקומות קבועים). מקור שנשבר נעלם עד שהוא צומח
function syncWorld(){
  let G=R3D.wld;
  if(!G){G=R3D.wld={g:new THREE.Group(),nodes:{}};R3D.scene.add(G.g);
    for(const d of worldDecor()){const D=VIL3D.decor[d.kind],md=Array.isArray(D.model)?D.model[d.v<0.5?0:1]:D.model;vPut(md,d.x,d.y,D.w*(0.8+d.v*0.4),d.v*6.28,G.g)}
    for(const g of Object.values(wGates()))vPut(VIL3D.gate.model,g.x,g.y,VIL3D.gate.w,0,G.g)}
  G.g.visible=true;
  for(const n of S.nd.list){
    let m=G.nodes[n.id];
    if(!m){const D=W3D.nodes[wKind(n.kind).shape],v=hash(n.x,n.y),md=Array.isArray(D.model)?D.model[v<0.5?0:1]:D.model;
      m=G.nodes[n.id]=vPut(md,n.x,n.y,D.w*(0.85+v*0.3),v*6.28,G.g);
      if(D.glow)m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive.set(D.glow).multiplyScalar(0.5)}})}
    m.visible=!n.dead;
  }
}
// תושבי הכפר: דמות לכל תושב שנמצא בכפר, והקישוטים בפינה של מי שאין לו מבנה. המצב (הולך, עובד, מנופף) מגיע מ-npc.js
function syncNpcs(dt){
  const all=npcState(),A=R3D.npcs||(R3D.npcs={}),V=R3D.vil;
  if(!V.npcDeco){V.npcDeco=1;for(const id in NPC.list){const sp=NPC.list[id].spot;if(sp)sp.deco.forEach((d,i)=>{const [dx,dy]=VDECO[i%VDECO.length];vPut(VIL3D.deco[d].model,sp.x+dx*40,sp.y+dy*40,VIL3D.deco[d].w)})}}
  for(const id in NPC.list){
    const L=LOOK3D['npc_'+id],n=all[id];let a=A[id];
    if(!npcHere(id)||!L){if(a){freeActor(a);delete A[id]}continue}
    if(!a){a=A[id]=makeActor(L);a.npcSt=null}
    if(a.own)a.own.visible=L.own!==false;
    if(a.npcSt!==n.st){a.npcSt=n.st;if(n.st==='wave'||n.st==='cheer')once(a,L.anim[n.st],n.st==='wave'?NPC.waveT:NPC.cheerT);else a.one=null}
    const busy=a.one&&a.one.isRunning();
    loop(a,(n.st==='walk'?L.anim.walk:n.st==='work'?L.anim.work:L.anim.idle)+(busy?'@low':''),n.st==='walk'?0.8:1);
    place(a,n.x,n.y,L.foot,yawOf(Math.cos(n.face),Math.sin(n.face)));
    a.mixer.update(dt);mark('shadow',a.root.position.x,a.root.position.z,15);
  }
}
// חיית המחמד: המצב (הולכת, רצה, יושבת, חופרת) מ-pet.js. בשלב 3 הסימנים פועמים, ומיקום קצה הזנב נשלח ללהבה בקנבס
function syncPet(dt){
  const p=S.pet;let a=R3D.pet;
  if(!p||!petHere()){if(a)a.root.visible=false;return}
  const L0=LOOK3D['pet_'+(SAVE.pet.kind||PET.default)+(SAVE.pet.stage+1)];if(!L0)return;
  const L=Object.assign({h:petStage().h},L0);
  if(!a||a.key!==lookKey(L)){if(a)freeActor(a);a=R3D.pet=makeActor(L);a.st=null;a.bark=0}
  a.root.visible=true;
  if(a.st!==p.st&&p.st==='jump')once(a,L.anim.jump,0.9);
  if(p.barkAt!=null&&p.barkAt!==a.bark){a.bark=p.barkAt;once(a,L.anim.bark,0.6)}
  a.st=p.st;
  const moving=p.st==='follow'||p.st==='go'||p.st==='back'||(p.st==='hunt'&&p.run),busy=a.one&&a.one.isRunning();
  if(!busy||moving)loop(a,moving?(p.run?L.anim.run:L.anim.walk):p.st==='dig'?L.anim.dig:p.st==='sit'?L.anim.sit:L.anim.idle,moving&&!p.run?1.4:1);
  place(a,p.x,p.y,L.foot,null);a.root.rotation.y=yawOf(Math.cos(p.face),Math.sin(p.face));
  if(L.glow)for(const m of a.mats)if(m.emissiveMap){m.emissive.set(L.glow);m.emissiveIntensity=0.4+0.35*Math.sin(p.fxT*PET.fx.pulse*6.28)}
  a.mixer.update(dt);
  const t=petStage().fx&&(a.tail||(a.tail=bone(a.root,'Tail6')));
  if(t){const v=t.getWorldPosition(R3D._v||(R3D._v=new THREE.Vector3()));PET_FX.tail={x:v.x,y:v.z*SIN()-v.y*COS()}}else PET_FX.tail=null;
  mark('shadow',a.root.position.x,a.root.position.z,10);
}
function npcs3dOff(){if(!R3D.npcs)return;for(const id in R3D.npcs)freeActor(R3D.npcs[id]);R3D.npcs=null}

// מטריצה ווקטורים לשימוש חוזר, בלי זבל בכל פריים. נוצרים בפעם הראשונה שמישהו צריך אותם, גם לפני הציור הראשון (syncPlayer מהבדיקה)
function r3dScratch(){if(!R3D._mx){R3D._mx=new THREE.Matrix4();R3D._p=new THREE.Vector3();R3D._q=new THREE.Quaternion();R3D._s=new THREE.Vector3();R3D._up=new THREE.Vector3(0,1,0)}}

/* נקרא מ-render() אחרי שהקנבס חישב את ההזזה (כולל רעידת מסך), כדי ששתי השכבות יזוזו יחד */
function render3d(ox,oy){
  if(!R3D.on||!P)return;
  r3dScratch();
  // drawEvery: הבדיקה האוטומטית מציירת רק חלק מהפריימים, כי שם התלת-ממד רץ על המעבד בלי כרטיס גרפי. בשאר הפריימים לא עושים כלום
  R3D.frame=(R3D.frame||0)+1;const skip=R3D.drawEvery&&R3D.frame%R3D.drawEvery!==0;if(skip&&!S.vil)return;   // בכפר ממשיכים לעדכן, כי שם נבנים המבנים
  const r=R3D.r,c=R3D.cam,now=performance.now(),dt=Math.min(0.05*(R3D.drawEvery||1),R3D.last?(now-R3D.last)/1000:0)*(S.mode==='play'&&!(S.hitstop>0)?(S.slow>0?0.35:1):S.mode==='over'?1:0);R3D.last=now;
  const pr=Math.min(DPR,1.5);if(r.getPixelRatio()!==pr)r.setPixelRatio(pr);
  if(R3D.w!==W||R3D.h!==H){R3D.w=W;R3D.h=H;r.setSize(innerWidth,innerHeight,false);c.left=-W/2;c.right=W/2;c.top=H/2;c.bottom=-H/2;c.updateProjectionMatrix()}
  // המצלמה מסתכלת על אותה נקודה שבמרכז הקנבס
  const S_=SIN(),cx=W/2-ox,cz=(H/2-oy)/S_;
  c.position.set(cx,2000*S_,cz+2000*COS());c.lookAt(cx,0,cz);
  const gt=R3D.ground.userData.tile;R3D.ground.position.set(Math.round(cx/gt)*gt,0,Math.round(cz/gt)*gt);
  R3D.scene.background.set(S.room?VIEW.room:S.vil?VIEW.village:S.wd?VIEW.world:VIEW.ground);R3D.ground.material.color.set(S.room?'#5b4a24':S.vil?VIEW.villageLine:S.wd?VIEW.worldLine:VIEW.groundLine);
  for(const k in R3D.marks)R3D.marks[k].count=0;
  for(const k in R3D.crowd)for(const p of R3D.crowd[k])for(const m of p)m.count=0;
  R3D.nCrowd=0;
  if(R3D.vil)R3D.vil.g.visible=false;
  if(R3D.wld)R3D.wld.g.visible=false;
  if(!S.room)syncPet(dt);else if(R3D.pet)R3D.pet.root.visible=false;   // חיית המחמד (pet.js), בכל מקום חוץ מחדר הבונוס
  if(S.vil){syncPlayer(dt);syncVillage();syncNpcs(dt)}   // בכפר: השחקן, המבנים והתושבים
  else if(!S.room){
    syncPlayer(dt);
    if(S.wd){syncWorld();syncWnpcs(dt)}   // העולם הפתוח: עצים, סלעים ושערים (world.js), והדמויות שמגלים בו (worldnpc.js)
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
  if(!skip)r.render(R3D.scene,c);
  const i=r.info.render;R3D.stats={calls:i.calls,tris:i.triangles,actors:R3D.actors.size+1,crowd:R3D.nCrowd};
}
// התחלה מחדש: מנקים דמויות מהריצה הקודמת
function reset3d(){if(!R3D.ready)return;npcs3dOff();for(const [e,a] of R3D.actors)freeActor(a);R3D.actors.clear();if(R3D.player){R3D.player.st=null;R3D.player.one=null;R3D.player.base=null;R3D.player.mixer.stopAllAction()}}

if(R3D.want)init3d();else showGfx();
