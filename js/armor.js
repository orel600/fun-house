/* שריון לפי מחלקה (ניר, 2.11.2026: "צריך להוסיף שריון לשים על הדמות, מותאם נושא לפי הקלאס"). 1ג בתוכנית ההתקדמות.
   שתי משבצות חדשות בבובה: ראש וגוף. לכל דמות התחלה (HEROES) סט משלה בכל שכבה: לוחם קסדה ושריון, צייד ברדס ואפודה, קוסם כובע וגלימה.
   כל חלק נותן הגנה (def, נקודות הגנה, defense.js) ועוד סטט לפי המחלקה: לוחם חיים, צייד מהירות, קוסם התחדשות.
   לא נועל כלום: כל דמות יכולה ללבוש כל שריון, והשלל בעולם רק מוטה לשריון של המחלקה שלך (armorPick, נקרא מ-lootRoll ב-loot.js).
   הפריטים נבנים כאן לתוך GEAR.items (armorItems), עם id כמו 'warriorHead2'. השם והמשפט ב-lang.js ('it.warriorHead2', 'itf.warriorHead2'), ובלי שם מורכב מחלקים ('arm.*').
   המראה בתלת-ממד (armor3d, נקרא מ-render3d.js ומ-doll3d.js): הכובע הוא כובע אמיתי של KayKit (ARMOR.hat, hat_* ב-models3d.js) על עצם הראש,
   הגלימה (Cape) שבמודל נדלקת ונצבעת, ומה שאין במודל (כתפיות, אבן חן) נבנה בקוד ומחובר לעצם. רק בכפר ובעולם: הזירה של אוראל לא מפילה שריון */

const ARMOR={
  slots:['head','body'],
  /* המספרים לכל שכבה (עץ, ברזל, כסף, זהב, אגדי). def: נקודות הגנה (defense.js): האחוז הישן [3,4,5,7,9] כפול DEFENSE.tierMul. extra: כמה שווה הסטט של המחלקה, ביחידות של gScore,
     והוא מתחלק במשקל של הסטט (GEAR.stats) כדי שכל מחלקה תקבל אותו שווי. כל שכבה ~פי 1.3 מהקודמת, בגלל חוק הנדירות (GEAR.ladder) */
  def:  {head:[9,16,25,49,90],  body:[15,28,45,84,160]},
  extra:{head:[3,4,6.2,7.6,10], body:[4,5.5,7,9.5,13]},
  /* stat: הסטט של המחלקה. icon: בממשק. cape: צבע הגלימה כשלובשים שריון גוף. head: איזה כובע (ARMOR.hat למטה). body: איזה חלק בגוף (look למטה) */
  cls:{
    warrior:{stat:'hp',   icon:{head:'🪖',body:'🦺'},cape:'#9C3A34',head:'helm',body:'plate'},
    hunter: {stat:'speed',icon:{head:'🧢',body:'🧥'},cape:'#4D6B34',head:'hood',body:'leather'},
    mage:   {stat:'regen',icon:{head:'🎩',body:'👘'},cape:'#5B3F98',head:'mage',body:'robe'}
  },
  /* הכובעים (ניר, 6.11.2026: "הגרפיקה של הכובע חייבת שיפור... חשוב לי מאוד הנושא הוויזואלי"). במקום כובעים מצורות (קערה, קונוס, כדור),
     הכובעים האמיתיים של KayKit: hat_helm (האביר), hat_mage (הקוסם), hat_hood (הראש עם הברדס של הנוכל) ו-hat_fur (הברברי).
     נבנים ב-tools/build3d.js (HATS) כחלק בלי שלד במרחב של עצם הראש, מחולקים לחלקים לפי הצבע. הקונספט שניר אישר: docs/refs/hats-concept-2026-11-06.
     paint: כמה צבע הדרגה (tint) נכנס לכל חלק. קסדה כולה, בברדס רק הבד, ובקוסם רק הרצועה (הכובע נשאר סגול).
     tint: הצבע לכל דרגה, מוכפל בטקסטורה. בהיר מ-GEAR.tiers, כדי שזהב לא ייצא זית ואפור לא ייצא חום. glowFrom: מאיזו דרגה הכובע זוהר (ARMOR.look.glow).
     rim: מאיזו דרגה השוליים של הברדס בצבע הדרגה, כי צבעי הבד כמעט לא נבדלים על ירוק. glowPart: אילו חלקים זוהרים (בלי: החלקים שנצבעים). בברדס רק השוליים, אחרת כל הברדס נצבע בזוהר.
     head: הברדס מחליף את הראש, אז הראש של הדמות (Knight_Head...) נשאר חלק נפרד ומוסתר. noHead: מודל בלי ראש נפרד (ניר ואוראל) מקבל את הפרווה במקום.
     ref: הראש שכל כובע נבנה בשבילו (KayKit 1.0: אביר, קוסם, ברברי, נוכל), [מינימום, מקסימום] ביחידות של עצם הראש. הכובע עובר מהראש הזה לראש של הדמות.
     glowK: כמה חזק הזוהר בכובע הזה (הפרווה נצבעת כולה בזוהר מלא).
     none: מודלים בלי כובע בכלל: לאוראל יש ברדס מובנה, וכל כובע עליו יצא כובע על ברדס (המתאם, 6.11.2026). ההגנה נשארת.
     fit: התאמה לכל מודל מעבר למדידת הראש (armorHeadFit): s גודל, y הרמה ביחידות של עצם הראש. הקוסם: השיער נמוך, והכובע ישב על העיניים */
  hat:{paint:{helm:{metal:1},hood:{cloth:0.3},mage:{band:1},fur:{fur:0.45}},
    tint:['#C8925A','#B4BCC6','#FFFFFF','#FFE27A','#FF8FC8'],glowFrom:{helm:0,hood:3,mage:0,fur:3},glowPart:{hood:['rim']},glowK:{fur:0.35},rim:3,
    ref:{helm:[[-0.543,-0.026,-0.485],[0.543,1.073,0.532]],mage:[[-0.543,-0.174,-0.748],[0.543,0.961,0.519]],fur:[[-0.543,-0.107,-0.46],[0.543,0.945,0.526]],hood:[[-0.543,-0.026,-0.482],[0.543,1.043,0.532]]},
    head:'Head',noHead:{hood:'fur'},none:['orelHero'],fit:{nirHero:{s:1.12},orelHero:{s:1.1},mage:{y:0.1}}},
  icon:{head:'🪖',body:'🧥',shield:'🛡️'},   // לשונית בתרמיל וצללית במשבצת ריקה
  /* מגן (המתאם, 2.11.2026: משבצת אמיתית במקום המגן שנגזר מהתכשיט). לא לפי מחלקה: מגן אחד לכל שכבה, 'shield0' עד 'shield4'.
     נראה ביד השנייה רק עם נשק של יד אחת (חרב, גרזן), כמו קודם (gear3dLook ב-render3d.js). gift: מגן עץ לכל אחד, פעם אחת */
  shield:{def:[12,24,40,77,150],   // נקודות הגנה. היה באחוזים [4,6,8,11,15], כפול DEFENSE.tierMul
    hp:[10,14,20,26,35],gift:'shield0',
    /* המודל לכל שכבה, הכי קרוב לתמונה (icons/ui/gear/shield<t>.png): עגול מעץ, ומברזל ומעלה מגן משולש. החומר (wtex) לפי השכבה, ב-GEAR3D.shield.metal */
    model:['w_shield_A','w_shield_B','w_shield_B','w_shield_B','w_shield_B']},
  // שלל בעולם (lootRoll): slot נוסף ל-LOOT.gear.slot. mine: איזה חלק מהשריון שנופל הוא של המחלקה שלך
  loot:{slot:{head:0.12,body:0.12,shield:0.08},mine:0.7},
  /* המראה. tint: כמה הצבע של השכבה נכנס לחלקים של המודל. glow: זוהר לפי שכבה (כמו GEAR3D.glow).
     החלקים שנבנים בקוד: מיקום (pos) ביחידות של המודל, יחסית לעצם (bone). col 'tier' = הצבע של השכבה, 'cape' = הצבע של המחלקה */
  /* הכובעים כבר לא נבנים כאן מצורות (ניר, 6.11.2026): ARMOR.hat למעלה */
  look:{tint:0.55,cape:0.35,glow:[0.05,0.1,0.22,0.38,0.55],
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
      GEAR.items[id]={slot:s,tier:t,cls:c,icon:C_.icon[s],stats:{def:d,[C_.stat]:v},defMul:DEFENSE.tierMul[t],look:t>=3?{glow:GEAR.tiers[t].col}:undefined};
      const N=TEXT['arm.name'];if(!TEXT['it.'+id])TEXT['it.'+id]={he:N.he(c,s,t),en:N.en(c,s,t)};   // שם עם אופי ב-lang.js ('it.warriorHead2'). בלי: מורכב מהחלקים
    })}
  const SH=ARMOR.shield;SH.def.forEach((d,t)=>{GEAR.items['shield'+t]={slot:'shield',tier:t,icon:'🛡️',stats:{def:d,hp:SH.hp[t]},defMul:DEFENSE.tierMul[t],look:Object.assign({model:SH.model[t]},t>=3?{glow:GEAR.tiers[t].col}:{})};
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
/* חלקים של המודל שהשריון שולט בהם. Helmet, HelmetVisor ו-Hat (הכובעים שבמודלים של Adventurers 2.0) תמיד מוסתרים: הכובע בא מ-ARMOR.hat */
const ARMOR_NATIVE=['Helmet','HelmetVisor','Hat','Cape'];
function armorMesh(p,col){
  const mat=new THREE.MeshLambertMaterial({color:col});let g;
  if(p.shape==='dome')g=new THREE.SphereGeometry(p.r,14,8,0,Math.PI*2,0,Math.PI/2);
  else if(p.shape==='gem')g=new THREE.OctahedronGeometry(p.r);
  else g=new THREE.BoxGeometry(...p.size);
  const m=new THREE.Mesh(g,mat);m.position.fromArray(p.pos);if(p.rot)m.rotation.fromArray(p.rot);if(p.sc)m.scale.fromArray(p.sc);
  return m;
}
/* הראש של המודל ביחידות של עצם הראש: מרכז (c), גודל (z) וחצי רוחב (u), מהקודקודים שזזים עם הראש (בלי הכובעים והגלימה שבמודל).
   נמדד פעם אחת לכל מודל. בלי מדידה: הראש של KayKit.
   נמדד על התבנית של המודל (R3D.tmpl), שעומדת תמיד בתנוחת הבסיס, ולפי מה שמצויר (הקודקוד במיקום שלו בעולם, יחסית לעצם).
   קודם המדידה עברה דרך חישוב השלד (applyBoneTransform), שיצא פי 3 רחוק מהעצם ופי 1.5 גדול ממה שמצויר, והכובע והברדס
   ישבו ככדור ענק מעל הדמות (ניר, 6.11.2026: "הכובע על הדמות עדיין לא מופיע טוב") */
const ARMOR_HEAD={kk:{c:[0,0.51,0.02],z:[1.09,1.07,1.01],u:0.55},cache:new Map()};
function armorHeadFit(a,model){
  const key=model||a.L&&a.L.model,T=key&&R3D.tmpl[key]||a.root;if(key&&ARMOR_HEAD.cache.has(key))return ARMOR_HEAD.cache.get(key);
  const hb=bone(T,'head'),ms=[];T.traverse(o=>{if(o.isSkinnedMesh&&!armorPart(o,ARMOR_NATIVE)&&o.skeleton.bones.includes(hb))ms.push(o)});
  let f=ARMOR_HEAD.kk;
  if(hb&&ms.length)try{T.updateMatrixWorld(true);const box=new THREE.Box3(),v=new THREE.Vector3(),inv=hb.matrixWorld.clone().invert();
    for(const o of ms){const hi=o.skeleton.bones.indexOf(hb),si=o.geometry.attributes.skinIndex,sw=o.geometry.attributes.skinWeight;if(!si||!sw)continue;
      for(let i=0;i<si.count;i++){let b=-1,bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;b=si.getComponent(i,k)}}
        if(b!==hi)continue;o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld).applyMatrix4(inv);box.expandByPoint(v)}}
    if(!box.isEmpty()){const c=box.getCenter(new THREE.Vector3()),z=box.getSize(new THREE.Vector3());f={c:c.toArray(),z:z.toArray(),u:Math.max(z.x,z.z)/2}}}catch(e){}
  if(key)ARMOR_HEAD.cache.set(key,f);return f;
}
/* הכובע על עצם הראש של הדמות. כל כובע עובר מהראש שהוא נבנה בשבילו (ARMOR.hat.ref) לראש של הדמות:
   גודל לפי הרוחב והעומק, באמצע הראש, והקודקוד על הקודקוד. נבנה מחדש עם השריון (armor3d) */
function armorHat(a,hd,head){
  const H=ARMOR.hat,C_=ARMOR.cls[hd.cls],hb=bone(a.root,'head');let k=C_.head;
  if(!hb||!R3D.hats||H.none.includes(a.L&&a.L.model))return;
  if(k==='hood'&&!head.length)k=H.noHead.hood;   // בלי ראש נפרד אי אפשר להחליף ראש
  const src=R3D.hats[k];if(!src)return;
  const g=src.clone(),t=hd.tier,col=new THREE.Color(H.tint[t]),tier=new THREE.Color(GEAR.tiers[t].col),P=H.paint[k]||{},
    glow=t>=(H.glowFrom[k]||0)?ARMOR.look.glow[t]*(H.glowK[k]||1):0,acc=a.L&&a.L.g3&&a.L.g3.head;
  g.traverse(o=>{if(!o.isMesh)return;const m=o.material=o.material.clone(),p=o.name.replace(/_\d+$/,'');   // three מוסיף _1 לשם כפול
    let em=new THREE.Color(0);
    if(P[p]!=null)m.color.set(0xffffff).lerp(col,P[p]);
    if(p==='rim'){if(t>=H.rim){m.map=null;m.color.copy(tier)}else m.color.set(0xffffff).lerp(col,P.cloth||0)}   // מדרגה 3: צבע נקי, בלי הירוק של הטקסטורה מתחתיו
    if(H.glowPart[k]?H.glowPart[k].includes(p):P[p]!=null)em=tier.clone().multiplyScalar(glow);
    if(acc&&p!=='face')em.add(new THREE.Color(acc).multiplyScalar(a.L.g3.hk));   // תכשיט נדיר זוהר על הכובע (GEAR3D.head)
    m.emissive.copy(em);m.userData.em=em;a.mats.push(m)});
  const [lo,hi]=H.ref[k],rc=lo.map((x,i)=>(x+hi[i])/2),rz=lo.map((x,i)=>hi[i]-x),me=armorHeadFit(a),adj=H.fit[a.L&&a.L.model]||{};
  const s=(me.z[0]/rz[0]+me.z[2]/rz[2])/2*(adj.s||1),top=me.c[1]+me.z[1]/2;
  g.scale.setScalar(s);g.position.set(me.c[0]-rc[0]*s,top-hi[1]*s+(adj.y||0),me.c[2]-rc[2]*s);
  hb.add(g);a.arG.push(g);
  if(k==='hood')for(const o of head)o.visible=false;   // הברדס הוא ראש שלם: הראש של הדמות מוסתר
}
function armor3d(a){
  if(!a||!window.THREE)return;
  const ids=ARMOR.slots.map(s=>gGet(s,0)),key=ids.join()+'|'+rankId()+'|'+(a.L&&a.L.ck)+'|'+(SAVE.showHat!==false);if(a.ar===key)return;
  // מתחילים נקי: מורידים את מה שנבנה, מחזירים את החלקים של המודל, ונותנים לדרגה ולציוד לצבוע מחדש
  for(const m of a.arG||[])if(m.parent)m.parent.remove(m);a.arG=[];
  a.root.traverse(o=>{if(o.isMesh&&armorPart(o,ARMOR_NATIVE))o.material.color.set(0xffffff)});
  a.rk=0;if(GEAR3D.on&&a.L&&a.L.g3){a.g3=null;gear3dParts(a,a.L)}else rankArmor3d(a);   // 0 ולא null: בלי דרגה rankId() הוא null, ו-rankArmor3d היה מדלג
  a.ar=key;
  const LK=ARMOR.look,parts={},head=[];a.root.traverse(o=>{if(o.isMesh){const p=armorPart(o,ARMOR_NATIVE);if(p)(parts[p]||(parts[p]=[])).push(o);if(armorPart(o,[ARMOR.hat.head])){o.visible=true;head.push(o)}}});
  // הדרגה (RANKS.look) כבר לא מדליקה חלקים לבד: היא זוהרת בצבע שלה על החלקים שלה, כשהם לבושים
  const R=RANKS.list[rankId()],rl=R&&R.look,rk=rl&&rl.glow?new THREE.Color(R.col).multiplyScalar(rl.glow):null;
  const paint=(o,col,k,t)=>{o.visible=true;o.material.color.set(0xffffff).lerp(new THREE.Color(col),k);const em=new THREE.Color(col).multiplyScalar(LK.glow[t]);
    if(rk&&rl.show.includes(armorPart(o,ARMOR_NATIVE)))em.add(rk);o.material.emissive.copy(em);o.material.userData.em=em};
  const build=(list,tcol,ccol,t)=>{for(const p of list){const b=bone(a.root,p.bone);if(!b)continue;
    const col=p.col==='tier'?tcol:ccol,m=armorMesh(p,col),em=new THREE.Color(col).multiplyScalar(p.glow||LK.glow[t]);
    m.material.emissive.copy(em);m.material.userData.em=em;b.add(m);a.arG.push(m);a.mats.push(m.material)}};
  /* משבצת ריקה = בלי החלק (ניר, 4.11.2026: "לדמות שלי יש כובע, למרות שבציוד אין לה קסדה"). הגלימה שבנויה במודל נדלקת רק כשלובשים גוף,
     וגם הדרגה (rankArmor3d) לא מדליקה אותה. הכובעים שבמודלים תמיד מוסתרים. מה שאפוי לתוך הגוף (הברדס של אוראל, השיער של ניר) נשאר */
  for(const k in parts)for(const o of parts[k])o.visible=false;
  // ראש: הכובע האמיתי (armorHat). "הצג כובע" כבוי בהגדרות (SAVE.showHat): ההגנה נשארת, רק לא רואים
  const hd=gItem(ids[0]);
  if(hd&&hd.cls&&SAVE.showHat!==false)armorHat(a,hd,head);
  // גוף: הגלימה בצבע המחלקה, ועוד חלק לפי המחלקה
  const bd=gItem(ids[1]);
  if(bd){const C_=ARMOR.cls[bd.cls],tcol=GEAR.tiers[bd.tier].col,cape=new THREE.Color(C_.cape).lerp(new THREE.Color(tcol),LK.cape);
    for(const o of parts.Cape||[])paint(o,'#'+cape.getHexString(),0.85,bd.tier);
    build(LK[C_.body],tcol,C_.cape,bd.tier)}
  // החומרים שנוספו מקבלים הבהוב פגיעה כמו כל הדמות (setFlash עובר על a.mats). מוציאים את הישנים
  a.mats=a.mats.filter(m=>!m.userData.arOld);for(const m of a.arG)m.traverse(o=>{if(o.material)o.material.userData.arOld=1});
}

/* "הצג כובע" בהגדרות (ניר, 6.11.2026). נשמר בשמירה (SAVE.showHat), אז עובר גם לטלפון אחר דרך הענן. armor3d ו-dollKey שמים לב לשינוי לבד */
function hatShowBtns(){for(const b of document.querySelectorAll('[data-hat]'))b.setAttribute('aria-pressed',String((b.dataset.hat==='1')===(SAVE.showHat!==false)))}
for(const b of document.querySelectorAll('[data-hat]'))b.onclick=()=>{SAVE.showHat=b.dataset.hat==='1';saveNow();hatShowBtns();if(typeof sfx==='function')sfx('ui')};
