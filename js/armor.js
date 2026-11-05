/* שריון לפי מחלקה (ניר, 2.11.2026: "צריך להוסיף שריון לשים על הדמות, מותאם נושא לפי הקלאס"). 1ג בתוכנית ההתקדמות.
   שתי משבצות חדשות בבובה: ראש וגוף. לכל דמות התחלה (HEROES) סט משלה בכל שכבה: לוחם קסדה ושריון, צייד ברדס ואפודה, קוסם כובע וגלימה.
   כל חלק נותן הגנה (def, אחוז פחות נזק, combat.js) ועוד סטט לפי המחלקה: לוחם חיים, צייד מהירות, קוסם התחדשות.
   לא נועל כלום: כל דמות יכולה ללבוש כל שריון, והשלל בעולם רק מוטה לשריון של המחלקה שלך (armorPick, נקרא מ-lootRoll ב-loot.js).
   הפריטים נבנים כאן לתוך GEAR.items (armorItems), עם id כמו 'warriorHead2'. השם והמשפט ב-lang.js ('it.warriorHead2', 'itf.warriorHead2'), ובלי שם מורכב מחלקים ('arm.*').
   המראה בתלת-ממד (armor3d, נקרא מ-render3d.js ומ-doll3d.js): חלקים שכבר יש במודלים של KayKit (Knight_Helmet, Mage_Hat, Cape) נדלקים
   ונצבעים בצבע השכבה, ומה שאין במודל (ברדס, כתפיות, אבן חן) נבנה בקוד ומחובר לעצם. רק בכפר ובעולם: הזירה של אוראל לא מפילה שריון */

const ARMOR={
  slots:['head','body'],
  /* המספרים לכל שכבה (עץ, ברזל, כסף, זהב, אגדי). def: ההגנה באחוזים. extra: כמה שווה הסטט של המחלקה, ביחידות של gScore,
     והוא מתחלק במשקל של הסטט (GEAR.stats) כדי שכל מחלקה תקבל אותו שווי. כל שכבה ~פי 1.3 מהקודמת, בגלל חוק הנדירות (GEAR.ladder) */
  def:  {head:[3,4,5,7,9],      body:[5,7,9,12,16]},
  extra:{head:[3,4,6.2,7.6,10], body:[4,5.5,7,9.5,13]},
  /* stat: הסטט של המחלקה. icon: בממשק. cape: צבע הגלימה כשלובשים שריון גוף. head/body: איזה חלק בתלת-ממד (look למטה).
     native: חלקים של המודל שהם כבר הכובע של המחלקה (Helmet ו-HelmetVisor של האביר, Hat של הקוסם). מודל בלי החלק: נבנה בקוד */
  cls:{
    warrior:{stat:'hp',   icon:{head:'🪖',body:'🦺'},cape:'#9C3A34',head:'helm',body:'plate',native:['Helmet','HelmetVisor']},
    hunter: {stat:'speed',icon:{head:'🧢',body:'🧥'},cape:'#4D6B34',head:'hood',body:'leather',native:[]},
    mage:   {stat:'regen',icon:{head:'🎩',body:'👘'},cape:'#5B3F98',head:'hat', body:'robe',native:['Hat'],paint:'cape'}   // paint: הכובע סגול בכל שכבה (כמו בתמונה), והשכבה רק באבן
  },
  icon:{head:'🪖',body:'🧥',shield:'🛡️'},   // לשונית בתרמיל וצללית במשבצת ריקה
  /* מגן (המתאם, 2.11.2026: משבצת אמיתית במקום המגן שנגזר מהתכשיט). לא לפי מחלקה: מגן אחד לכל שכבה, 'shield0' עד 'shield4'.
     נראה ביד השנייה רק עם נשק של יד אחת (חרב, גרזן), כמו קודם (gear3dLook ב-render3d.js). gift: מגן עץ לכל אחד, פעם אחת */
  shield:{def:[4,6,8,11,15],hp:[10,14,20,26,35],gift:'shield0',
    /* המודל לכל שכבה, הכי קרוב לתמונה (icons/ui/gear/shield<t>.png): עגול מעץ, ומברזל ומעלה מגן משולש. החומר (wtex) לפי השכבה, ב-GEAR3D.shield.metal */
    model:['w_shield_A','w_shield_B','w_shield_B','w_shield_B','w_shield_B']},
  // שלל בעולם (lootRoll): slot נוסף ל-LOOT.gear.slot. mine: איזה חלק מהשריון שנופל הוא של המחלקה שלך
  loot:{slot:{head:0.12,body:0.12,shield:0.08},mine:0.7},
  /* המראה. tint: כמה הצבע של השכבה נכנס לחלקים של המודל. glow: זוהר לפי שכבה (כמו GEAR3D.glow).
     החלקים שנבנים בקוד: מיקום (pos) ביחידות של המודל, יחסית לעצם (bone). col 'tier' = הצבע של השכבה, 'cape' = הצבע של המחלקה */
  /* cloth: כמה צבע השכבה נכנס לבד של ברדס וכובע (שאר הזמן בצבע המחלקה). plume: הנוצה על הקסדה של הלוחם, כמו בתמונות: אין בעץ ובברזל, כחולה בכסף, אדומה בזהב, ורודה באגדי */
  look:{tint:0.55,cape:0.35,glow:[0.05,0.1,0.22,0.38,0.55],plume:[null,null,'#3F6FD8','#D8402F','#FF6FB5'],cloth:[0,0,0.06,0.1,0.5],
    /* fit: החלק מותאם לראש של המודל (armorHeadFit): pos ממרכז הראש, וגדלים, ביחידות של חצי רוחב הראש. כך ברדס וקסדה יושבים גם על
       הראש הקטן של הדמויות האישיות (ניר ואוראל), ולא מרחפים מעליו ככדור (ניר, 5.11.2026: "המודל של הכובע נראה מזעזע על הדמות") */
    helm:   [{bone:'head',fit:1,shape:'dome',r:1.18,pos:[0,-0.1,0],col:'tier'},{bone:'head',fit:1,shape:'box',size:[0.16,0.38,1.25],pos:[0,1.06,-0.02],col:'cape'}],
    crest:  [{bone:'head',shape:'box',size:[0.1,0.24,0.8],pos:[0,1.2,-0.02],col:'cape'}],          // על הקסדה של האביר (במודל, לא מותאם)
    hood:   [{bone:'head',fit:1,shape:'hood',r:1.2,pos:[0,0.02,0.12],col:'cape'},{bone:'head',fit:1,shape:'cone',r:0.3,h:0.75,pos:[0,0.5,-1.05],rot:[-2.2,0,0],col:'cape'}],
    hat:    [{bone:'head',fit:1,shape:'cone',r:0.8,h:1.6,pos:[0,1.55,0],col:'cape'},{bone:'head',fit:1,shape:'disc',r:1.45,h:0.1,pos:[0,0.8,0],col:'cape'},{bone:'head',fit:1,shape:'gem',r:0.2,pos:[0,1.0,0.72],col:'tier'}],
    hatGem: [{bone:'head',shape:'gem',r:0.13,pos:[0,0.95,0.5],col:'tier'}],                       // על הכובע של הקוסם (במודל)
    // כתפיות: על הכתפיים (עצם הזרוע ב-±0.21 מהחזה). קודם ב-±0.5, ונראו כמו כנפיים ורודות באגדי (ניר, 5.11.2026)
    plate:  [{bone:'chest',shape:'dome',r:0.17,pos:[0.27,0.16,0],sc:[1,0.75,1.15],col:'tier'},{bone:'chest',shape:'dome',r:0.17,pos:[-0.27,0.16,0],sc:[1,0.75,1.15],col:'tier'}],
    leather:[{bone:'chest',shape:'dome',r:0.15,pos:[0.27,0.15,0],sc:[1,0.75,1.15],col:'cape'},{bone:'chest',shape:'box',size:[0.1,0.06,0.82],pos:[0.1,0.12,0],rot:[0,0,0.85],col:'tier'}],
    robe:   [{bone:'chest',shape:'gem',r:0.12,pos:[0,0.08,0.42],col:'tier',glow:0.6}]
  }
};

const armorSlot=s=>s[0].toUpperCase()+s.slice(1);
// בונה את הפריטים לתוך GEAR.items ואת השמות לתוך TEXT, פעם אחת בטעינה
(function armorItems(){
  for(const s of [...ARMOR.slots,'shield']){GEAR.slots[s]=1;GEAR.filter[s]=ARMOR.icon[s]}
  // הבובה: ראש למעלה, הנשק והמגן, וגוף למטה. הלשוניות בתרמיל אחרי הנשק
  GEAR.doll.start=['head','weapon','shield','body'];
  const f=GEAR.filter,order=['weapon','shield','head','body','boots','acc','orbit'];GEAR.filter={};for(const k of order)if(f[k])GEAR.filter[k]=f[k];
  for(const c in ARMOR.cls){const C_=ARMOR.cls[c],w=GEAR.stats[C_.stat].w;
    for(const s of ARMOR.slots)ARMOR.def[s].forEach((d,t)=>{
      let v=ARMOR.extra[s][t]/w;v=C_.stat==='regen'?Math.round(v*10)/10:Math.round(v);
      const id=c+armorSlot(s)+t;
      GEAR.items[id]={slot:s,tier:t,cls:c,icon:C_.icon[s],stats:{def:d,[C_.stat]:v},look:t>=3?{glow:GEAR.tiers[t].col}:undefined};
      const N=TEXT['arm.name'];if(!TEXT['it.'+id])TEXT['it.'+id]={he:N.he(c,s,t),en:N.en(c,s,t)};   // שם עם אופי ב-lang.js ('it.warriorHead2'). בלי: מורכב מהחלקים
    })}
  const SH=ARMOR.shield;SH.def.forEach((d,t)=>{GEAR.items['shield'+t]={slot:'shield',tier:t,icon:'🛡️',stats:{def:d,hp:SH.hp[t]},look:Object.assign({model:SH.model[t]},t>=3?{glow:GEAR.tiers[t].col}:{})};
    const N=TEXT['arm.shield'];if(!TEXT['it.shield'+t])TEXT['it.shield'+t]={he:N.he(t),en:N.en(t)}});
})();
// מגן עץ לכל אחד, פעם אחת (נקרא מ-gearReset), כדי שמי שהיה לו מגן מהתכשיט לא יישאר בלי
function armorGift(){if(!SAVE.shieldGift){SAVE.shieldGift=true;bagAdd(ARMOR.shield.gift)}}

/* ---- שלל: נקרא מ-lootRoll (loot.js) כשהמשבצת שהוגרלה היא שריון. מחזיר פילטר: שריון של המחלקה שלך, או לפעמים של אחרת ---- */
function armorPick(slot){
  const h=heroId();if(!ARMOR.slots.includes(slot)||!ARMOR.cls[h])return()=>true;
  const mine=Math.random()<ARMOR.loot.mine;return it=>(it.cls===h)===mine;
}

/* ---- המראה בתלת-ממד: אחרי rankArmor3d ו-gear3dParts. נבנה מחדש רק כשהשריון, הדרגה או הציוד השתנו ---- */
const ARMOR_NATIVE=['Helmet','HelmetVisor','Hat','Cape'];
function armorMesh(p,col){
  const L=ARMOR.look,mat=new THREE.MeshLambertMaterial({color:col,side:p.shape==='hood'?THREE.DoubleSide:THREE.FrontSide});let g;
  if(p.shape==='dome')g=new THREE.SphereGeometry(p.r,14,8,0,Math.PI*2,0,Math.PI/2);
  else if(p.shape==='hood')g=new THREE.SphereGeometry(p.r,18,10,Math.PI/2+1.0,Math.PI*2-2.0,0,Math.PI*0.66);   // פתוח מקדימה, לפנים
  else if(p.shape==='cone')g=new THREE.ConeGeometry(p.r,p.h,12);
  else if(p.shape==='disc')g=new THREE.CylinderGeometry(p.r,p.r,p.h,18);
  else if(p.shape==='gem')g=new THREE.OctahedronGeometry(p.r);
  else g=new THREE.BoxGeometry(...p.size);
  const m=new THREE.Mesh(g,mat);m.position.fromArray(p.pos);if(p.rot)m.rotation.fromArray(p.rot);if(p.sc)m.scale.fromArray(p.sc);
  return m;
}
/* הראש של המודל ביחידות של עצם הראש: מרכז (c) וחצי רוחב (u), מהקודקודים שזזים עם הראש (בלי הקסדה והכובע שבמודל).
   נמדד פעם אחת לכל מודל. בלי מדידה: הראש של KayKit */
const ARMOR_HEAD={kk:{c:[-0.02,0.45,-0.02],u:0.55},cache:new Map()};
function armorHeadFit(a){
  const hb=bone(a.root,'head'),ms=[];a.root.traverse(o=>{if(o.isSkinnedMesh&&!armorPart(o,ARMOR_NATIVE)&&o.skeleton.bones.includes(hb))ms.push(o)});
  const key=ms.map(o=>o.geometry.uuid).join();if(!hb||!ms.length)return ARMOR_HEAD.kk;
  if(ARMOR_HEAD.cache.has(key))return ARMOR_HEAD.cache.get(key);
  let f=ARMOR_HEAD.kk;
  try{a.root.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3();
    for(const o of ms){const hi=o.skeleton.bones.indexOf(hb),si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight;if(!si||!sw)continue;
      for(let i=0;i<si.count;i++){let b=-1,bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;b=si.getComponent(i,k)}}
        if(b!==hi)continue;o.getVertexPosition(i,v);o.applyBoneTransform(i,v);o.localToWorld(v);hb.worldToLocal(v);box.expandByPoint(v)}}
    if(!box.isEmpty()){const c=box.getCenter(new THREE.Vector3()),z=box.getSize(new THREE.Vector3());f={c:c.toArray(),u:Math.max(z.x,z.z)/2}}}catch(e){}
  ARMOR_HEAD.cache.set(key,f);return f;
}
// חלק עם fit: ממירים את המיקום והגדלים מיחידות של הראש ליחידות של העצם
function armorFit(p,f){if(!p.fit)return p;const u=f.u,q=Object.assign({},p,{pos:p.pos.map((x,i)=>f.c[i]+x*u)});
  for(const k of ['r','h'])if(p[k]!=null)q[k]=p[k]*u;if(p.size)q.size=p.size.map(x=>x*u);return q}
function armor3d(a){
  if(!a||!window.THREE)return;
  const ids=ARMOR.slots.map(s=>gGet(s,0)),key=ids.join()+'|'+rankId()+'|'+(a.L&&a.L.ck);if(a.ar===key)return;
  // מתחילים נקי: מורידים את מה שנבנה, מחזירים את החלקים של המודל, ונותנים לדרגה ולציוד לצבוע מחדש
  for(const m of a.arG||[])if(m.parent)m.parent.remove(m);a.arG=[];
  a.root.traverse(o=>{if(o.isMesh&&armorPart(o,ARMOR_NATIVE))o.material.color.set(0xffffff)});
  a.rk=0;if(GEAR3D.on&&a.L&&a.L.g3){a.g3=null;gear3dParts(a,a.L)}else rankArmor3d(a);   // 0 ולא null: בלי דרגה rankId() הוא null, ו-rankArmor3d היה מדלג
  a.ar=key;
  const LK=ARMOR.look,parts={};a.root.traverse(o=>{if(o.isMesh){const p=armorPart(o,ARMOR_NATIVE);if(p)(parts[p]||(parts[p]=[])).push(o)}});
  // הדרגה (RANKS.look) כבר לא מדליקה חלקים לבד: היא זוהרת בצבע שלה על החלקים שלה, כשהם לבושים
  const R=RANKS.list[rankId()],rl=R&&R.look,rk=rl&&rl.glow?new THREE.Color(R.col).multiplyScalar(rl.glow):null;
  const paint=(o,col,k,t)=>{o.visible=true;o.material.color.set(0xffffff).lerp(new THREE.Color(col),k);const em=new THREE.Color(col).multiplyScalar(LK.glow[t]);
    if(rk&&rl.show.includes(armorPart(o,ARMOR_NATIVE)))em.add(rk);o.material.emissive.copy(em);o.material.userData.em=em};
  let hf=null;const build=(list,tcol,ccol,t)=>{for(const p0 of list){const b=bone(a.root,p0.bone);if(!b)continue;const p=p0.fit?armorFit(p0,hf||(hf=armorHeadFit(a))):p0;
    const col=p.col==='tier'?tcol:ccol,m=armorMesh(p,col),em=new THREE.Color(col).multiplyScalar(p.glow||LK.glow[t]);
    m.material.emissive.copy(em);m.material.userData.em=em;b.add(m);a.arG.push(m);a.mats.push(m.material)}};
  /* משבצת ריקה = בלי החלק (ניר, 4.11.2026: "לדמות שלי יש כובע, למרות שבציוד אין לה קסדה"). הקסדה, הכובע והגלימה שבנויים במודל
     נדלקים רק כשלובשים ראש או גוף, וגם הדרגה (rankArmor3d) לא מדליקה אותם. מה שאפוי לתוך הגוף (הברדס של הצייד, הדמויות האישיות) נשאר */
  for(const k in parts)for(const o of parts[k])o.visible=false;
  // ראש
  const hd=gItem(ids[0]);
  if(hd){const C_=ARMOR.cls[hd.cls],tcol=GEAR.tiers[hd.tier].col,nat=C_.native.filter(p=>parts[p]),
      soft='#'+new THREE.Color(C_.cape).lerp(new THREE.Color(tcol),LK.cloth[hd.tier]).getHexString(),plume=LK.plume[hd.tier];   // בד בצבע המחלקה. רק האגדי נצבע ורוד, כמו בתמונה
    if(nat.length){for(const p of nat)for(const o of parts[p])paint(o,C_.paint==='cape'?soft:tcol,C_.paint==='cape'?0.85:LK.tint,hd.tier);
      if(C_.head==='helm'){if(plume)build(LK.crest,tcol,plume,hd.tier)}else build(LK.hatGem,tcol,soft,hd.tier)}
    else build(C_.head==='helm'&&!plume?LK.helm.slice(0,1):LK[C_.head],tcol,C_.head==='helm'?plume:soft,hd.tier)}
  // גוף: הגלימה בצבע המחלקה, ועוד חלק לפי המחלקה
  const bd=gItem(ids[1]);
  if(bd){const C_=ARMOR.cls[bd.cls],tcol=GEAR.tiers[bd.tier].col,cape=new THREE.Color(C_.cape).lerp(new THREE.Color(tcol),LK.cape);
    for(const o of parts.Cape||[])paint(o,'#'+cape.getHexString(),0.85,bd.tier);
    build(LK[C_.body],tcol,C_.cape,bd.tier)}
  // החומרים שנוספו מקבלים הבהוב פגיעה כמו כל הדמות (setFlash עובר על a.mats). מוציאים את הישנים
  a.mats=a.mats.filter(m=>!m.userData.arOld);for(const m of a.arG)m.material.userData.arOld=1;
}
