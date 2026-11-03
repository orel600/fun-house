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
    mage:   {stat:'regen',icon:{head:'🎩',body:'👘'},cape:'#5B3F98',head:'hat', body:'robe',native:['Hat']}
  },
  icon:{head:'🪖',body:'🧥',shield:'🛡️'},   // לשונית בתרמיל וצללית במשבצת ריקה
  /* מגן (המתאם, 2.11.2026: משבצת אמיתית במקום המגן שנגזר מהתכשיט). לא לפי מחלקה: מגן אחד לכל שכבה, 'shield0' עד 'shield4'.
     נראה ביד השנייה רק עם נשק של יד אחת (חרב, גרזן), כמו קודם (gear3dLook ב-render3d.js). gift: מגן עץ לכל אחד, פעם אחת */
  shield:{def:[4,6,8,11,15],hp:[10,14,20,26,35],gift:'shield0'},
  // שלל בעולם (lootRoll): slot נוסף ל-LOOT.gear.slot. mine: איזה חלק מהשריון שנופל הוא של המחלקה שלך
  loot:{slot:{head:0.12,body:0.12,shield:0.08},mine:0.7},
  /* המראה. tint: כמה הצבע של השכבה נכנס לחלקים של המודל. glow: זוהר לפי שכבה (כמו GEAR3D.glow).
     החלקים שנבנים בקוד: מיקום (pos) ביחידות של המודל, יחסית לעצם (bone). col 'tier' = הצבע של השכבה, 'cape' = הצבע של המחלקה */
  look:{tint:0.55,cape:0.35,glow:[0.05,0.1,0.22,0.38,0.55],
    helm:   [{bone:'head',shape:'dome',r:0.64,pos:[0,0.5,0],col:'tier'},{bone:'head',shape:'box',size:[0.1,0.24,0.8],pos:[0,1.18,-0.02],col:'cape'}],
    crest:  [{bone:'head',shape:'box',size:[0.1,0.24,0.8],pos:[0,1.2,-0.02],col:'cape'}],          // על הקסדה של האביר
    hood:   [{bone:'head',shape:'hood',r:0.76,pos:[0,0.56,-0.02],col:'cape'},{bone:'head',shape:'cone',r:0.2,h:0.5,pos:[0,0.8,-0.72],rot:[-2.2,0,0],col:'cape'}],
    hat:    [{bone:'head',shape:'cone',r:0.46,h:0.95,pos:[0,1.4,0],col:'cape'},{bone:'head',shape:'disc',r:0.82,h:0.06,pos:[0,0.98,0],col:'cape'},{bone:'head',shape:'gem',r:0.11,pos:[0,1.1,0.42],col:'tier'}],
    hatGem: [{bone:'head',shape:'gem',r:0.13,pos:[0,0.95,0.5],col:'tier'}],                       // על הכובע של הקוסם
    plate:  [{bone:'chest',shape:'dome',r:0.27,pos:[0.5,0.1,0.02],sc:[1,0.8,1.1],col:'tier'},{bone:'chest',shape:'dome',r:0.27,pos:[-0.5,0.1,0.02],sc:[1,0.8,1.1],col:'tier'}],
    leather:[{bone:'chest',shape:'dome',r:0.24,pos:[0.52,0.1,0.02],sc:[1,0.8,1.1],col:'cape'},{bone:'chest',shape:'box',size:[0.1,0.06,0.82],pos:[0.1,0.12,0],rot:[0,0,0.85],col:'tier'}],
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
  const SH=ARMOR.shield;SH.def.forEach((d,t)=>{GEAR.items['shield'+t]={slot:'shield',tier:t,icon:'🛡️',stats:{def:d,hp:SH.hp[t]},look:t>=3?{glow:GEAR.tiers[t].col}:undefined};
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
  else if(p.shape==='hood')g=new THREE.SphereGeometry(p.r,16,10,Math.PI/2+0.75,Math.PI*2-1.5,0,Math.PI*0.62);   // פתוח מקדימה, לפנים
  else if(p.shape==='cone')g=new THREE.ConeGeometry(p.r,p.h,12);
  else if(p.shape==='disc')g=new THREE.CylinderGeometry(p.r,p.r,p.h,18);
  else if(p.shape==='gem')g=new THREE.OctahedronGeometry(p.r);
  else g=new THREE.BoxGeometry(...p.size);
  const m=new THREE.Mesh(g,mat);m.position.fromArray(p.pos);if(p.rot)m.rotation.fromArray(p.rot);if(p.sc)m.scale.fromArray(p.sc);
  return m;
}
function armor3d(a){
  if(!a||!window.THREE)return;
  const ids=ARMOR.slots.map(s=>gGet(s,0)),key=ids.join()+'|'+rankId()+'|'+(a.L&&a.L.ck);if(a.ar===key)return;
  // מתחילים נקי: מורידים את מה שנבנה, מחזירים את החלקים של המודל, ונותנים לדרגה ולציוד לצבוע מחדש
  for(const m of a.arG||[])if(m.parent)m.parent.remove(m);a.arG=[];
  a.root.traverse(o=>{if(o.isMesh&&armorPart(o,ARMOR_NATIVE)){o.visible=true;o.material.color.set(0xffffff)}});
  a.rk=0;if(GEAR3D.on&&a.L&&a.L.g3){a.g3=null;gear3dParts(a,a.L)}else rankArmor3d(a);   // 0 ולא null: בלי דרגה rankId() הוא null, ו-rankArmor3d היה מדלג
  a.ar=key;
  const LK=ARMOR.look,parts={};a.root.traverse(o=>{if(o.isMesh){const p=armorPart(o,ARMOR_NATIVE);if(p)(parts[p]||(parts[p]=[])).push(o)}});
  const paint=(o,col,k,t)=>{o.visible=true;o.material.color.set(0xffffff).lerp(new THREE.Color(col),k);const em=new THREE.Color(col).multiplyScalar(LK.glow[t]);o.material.emissive.copy(em);o.material.userData.em=em};
  const build=(list,tcol,ccol,t)=>{for(const p of list){const b=bone(a.root,p.bone);if(!b)continue;
    const col=p.col==='tier'?tcol:ccol,m=armorMesh(p,col),em=new THREE.Color(col).multiplyScalar(p.glow||LK.glow[t]);
    m.material.emissive.copy(em);m.material.userData.em=em;b.add(m);a.arG.push(m);a.mats.push(m.material)}};
  // ראש
  const hd=gItem(ids[0]);
  if(hd){const C_=ARMOR.cls[hd.cls],tcol=GEAR.tiers[hd.tier].col,nat=C_.native.filter(p=>parts[p]);
    for(const p of ['Helmet','HelmetVisor','Hat'])for(const o of parts[p]||[])o.visible=nat.includes(p);   // הכובע של מחלקה אחרת יורד
    if(nat.length){for(const p of nat)for(const o of parts[p])paint(o,tcol,LK.tint,hd.tier);build(LK[C_.head==='helm'?'crest':'hatGem'],tcol,C_.cape,hd.tier)}
    else build(LK[C_.head],tcol,C_.cape,hd.tier)}
  // גוף: הגלימה בצבע המחלקה, ועוד חלק לפי המחלקה
  const bd=gItem(ids[1]);
  if(bd){const C_=ARMOR.cls[bd.cls],tcol=GEAR.tiers[bd.tier].col,cape=new THREE.Color(C_.cape).lerp(new THREE.Color(tcol),LK.cape);
    for(const o of parts.Cape||[])paint(o,'#'+cape.getHexString(),0.85,bd.tier);
    build(LK[C_.body],tcol,C_.cape,bd.tier)}
  // החומרים שנוספו מקבלים הבהוב פגיעה כמו כל הדמות (setFlash עובר על a.mats). מוציאים את הישנים
  a.mats=a.mats.filter(m=>!m.userData.arOld);for(const m of a.arG)m.material.userData.arOld=1;
}
