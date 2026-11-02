/* חנות קישוטים (המבקר, 2.11.2026: "ברמה 20 המטבעות נערמים ואין על מה להוציא אותם").
   לשונית "קישוטים" בחלון השוק (bwin.js). קונים במטבעות, והקישוט עומד מיד במקום פנוי בכפר. במפה הקטנה בלשונית:
   נוגעים בקישוט ואז במקום ריק כדי להזיז אותו, או "למחסן" כדי להוריד אותו. מי שמבקר (visit.js) רואה את הקישוטים בכפר שלך.
   כל עותק נוסף מאותו סוג יקר יותר (grow), כך שהמטבעות נמשכים לאורך זמן. המקומות הפנויים מחושבים לבד: לא על מבנה, שביל, תושב או קישוט קבוע.
   שמירה: SAVE.deco = {own:{flag:1} מה שבמחסן, put:[{k,x,y}] מה שעומד בכפר}. ציור: decoDraw2d (בקנבס), deco3d (render3d.js). טקסטים: 'deco.*' ב-lang.js */
const DECO={
  // price: העותק הראשון. max: כמה לכל היותר מכל סוג. parts: מודלים מ-KayKit (MODELS3D) זה ליד זה, w רוחב. build: נבנה בקוד (deco3dBuild)
  items:{
    bush:   {icon:'🌿',price:300, max:8,parts:[{m:'n_bush',w:44}]},
    crates: {icon:'📦',price:400, max:8,parts:[{m:'v_crate',w:30,dx:-12},{m:'v_barrel',w:26,dx:14},{m:'v_crate',w:22,dx:0,dy:-16}]},
    flag:   {icon:'🚩',price:600, max:8,parts:[{m:'v_flag',w:52}]},
    tree:   {icon:'🌳',price:900, max:6,parts:[{m:'v_treeA',w:72}]},
    pine:   {icon:'🌲',price:900, max:6,parts:[{m:'n_pine',w:52}]},
    lamp:   {icon:'🏮',price:1500,max:6,build:'lamp'},
    statue: {icon:'🗿',price:3000,max:4,build:'statue',col:'#a8a8b4'},
    fountain:{icon:'⛲',price:5000,max:2,build:'fountain'},
    golden: {icon:'🏆',price:12000,max:2,build:'statue',col:'#F4C74F',glow:0.35}
  },
  grow:0.5,          // כל עותק שכבר יש מעלה את המחיר של הבא ב-50% מהמחיר הראשון
  // המקומות: רשת כל step פיקסלים בתוך הכפר. gap: מרחק ממבנים, path: משבילים, near: מתושבים, פנסים וקישוטים קבועים. max: כמה מקומות לכל היותר
  slot:{step:85,edge:70,gap:50,path:44,near:52,plaza:110,max:36},
  mapIcon:{center:'🏰',forge:'⚒️',mill:'🪵',mine:'⛏️',market:'⚖️',stash:'📦'},
  visitShow:12,      // כמה סוגים לכל היותר בשורה בחלון הביקור
  sel:null           // מה נבחר במפה: {put:i} קישוט שעומד, או {own:k} קישוט מהמחסן
};

function decoSave(){const d=SAVE.deco||(SAVE.deco={own:{},put:[]});if(!isObj(d.own))d.own={};if(!Array.isArray(d.put))d.put=[];return d}
const decoCount=k=>{const d=decoSave();return(d.own[k]||0)+d.put.filter(p=>p.k===k).length};
const decoPrice=k=>Math.round(DECO.items[k].price*(1+DECO.grow*decoCount(k))/10)*10;

// המרחק של נקודה מקטע
function decoSegD(x,y,a,b,c,d){const dx=c-a,dy=d-b,L=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-a)*dx+(y-b)*dy)/L));return Math.hypot(x-a-dx*t,y-b-dy*t)}
// כל המקומות שאפשר להציב בהם, הקרובים לכיכר קודם. מחושב פעם אחת: לכל המבנים, גם אלה שעוד לא נבנו, כדי שהמקומות לא יזוזו
function decoSlots(){
  if(DECO._slots)return DECO._slots;
  const Z=DECO.slot,R=VILLAGE.radius-Z.edge,G=typeof GROUND!=='undefined'?GROUND.village:{plaza:{x:0,y:-80},door:0.6},pz=G.plaza,
    dots=[],segs=[],g=VILLAGE.gate;
  for(const k in VILLAGE.b){const B=VILLAGE.b[k];dots.push([B.x,B.y,B.r+Z.gap]);segs.push([pz.x,pz.y,B.x,B.y+B.r*(G.door||0.6)])}
  dots.push([g.x,g.y,g.r+Z.gap],[pz.x,pz.y,Z.plaza]);segs.push([g.x,g.y,pz.x,pz.y]);
  for(const p of VILLAGE.props)if(p.k==='fence')segs.push([p.x,p.y,p.x2,p.y2]);else dots.push([p.x,p.y,Z.near]);
  if(typeof NPC!=='undefined')for(const id in NPC.list){const n=NPC.list[id];if(n.at)dots.push([n.at.x,n.at.y,Z.near]);if(n.spot){dots.push([n.spot.x,n.spot.y,Z.near+30]);segs.push([pz.x,pz.y,n.spot.x,n.spot.y])}}
  if(typeof RESID!=='undefined')for(const id in RESID.list){const h=RESID.list[id].house;dots.push([h.x,h.y,Z.near+40]);segs.push([pz.x,pz.y,h.x,h.y+30])}
  if(typeof HOME!=='undefined'&&typeof homePost==='function')for(const p of HOME.posts){const q=homePost(p);dots.push([q.x,q.y,Z.near])}
  const out=[];
  for(let y=-R;y<=R;y+=Z.step)for(let x=-R;x<=R;x+=Z.step){
    if(Math.hypot(x,y)>R)continue;
    if(dots.some(d=>Math.hypot(x-d[0],y-d[1])<d[2]))continue;
    if(segs.some(s=>decoSegD(x,y,s[0],s[1],s[2],s[3])<Z.path))continue;
    out.push({x,y})}
  out.sort((a,b)=>Math.hypot(a.x-pz.x,a.y-pz.y)-Math.hypot(b.x-pz.x,b.y-pz.y));
  return DECO._slots=out.slice(0,Z.max);
}
// איזה קישוט עומד במקום i (אינדקס ב-put), או -1
const decoAt=i=>{const s=decoSlots()[i];return s?decoSave().put.findIndex(p=>Math.abs(p.x-s.x)<6&&Math.abs(p.y-s.y)<6):-1};
const decoFreeSlot=()=>decoSlots().findIndex((s,i)=>decoAt(i)<0);

// קונים: המטבעות יוצאים, והקישוט עומד מיד במקום הפנוי הראשון (אין מקום: נשאר במחסן). מחזיר '' כשהצליח, או למה לא
function decoBuy(k){
  const I=DECO.items[k];if(!I)return'bad';
  if(decoCount(k)>=I.max)return'max';
  const p=decoPrice(k);if(!bagTake('coins',p))return'coins';
  const d=decoSave(),i=decoFreeSlot();
  if(i<0)d.own[k]=(d.own[k]||0)+1;else{const s=decoSlots()[i];d.put.push({k,x:s.x,y:s.y})}
  saveNow();
  const at=i<0?P:decoSlots()[i];if(typeof celebrate==='function')celebrate(at.x,at.y-20,'upgrade',I.icon);
  return'';
}
// מציבים במקום ריק i: קישוט שעומד (sel.put) עובר לשם, או קישוט מהמחסן (sel.own) יוצא אליו
function decoPlace(sel,i){
  const d=decoSave(),s=decoSlots()[i];if(!s||!sel||decoAt(i)>=0)return false;
  if(sel.put!=null){const p=d.put[sel.put];if(!p)return false;p.x=s.x;p.y=s.y}
  else if(d.own[sel.own]>0){d.own[sel.own]--;if(!d.own[sel.own])delete d.own[sel.own];d.put.push({k:sel.own,x:s.x,y:s.y})}
  else return false;
  saveNow();return true;
}
// מורידים קישוט שעומד למחסן
function decoStore(j){const d=decoSave(),p=d.put[j];if(!p)return false;d.put.splice(j,1);d.own[p.k]=(d.own[p.k]||0)+1;saveNow();return true}

// הלחיצות בלשונית (החיבור ב-village.js, בפאנל של המבנה)
function decoAct(a,ds){
  sfx('ui');
  if(a==='decoBuy'){const why=decoBuy(ds.k);if(why)banner(T('deco.why.'+why),C.blood);else{sfx('coin');banner(T('deco.bought',T('deco.'+ds.k)),C.gold)}DECO.sel=null;return}
  if(a==='decoOwn'){DECO.sel=DECO.sel&&DECO.sel.own===ds.k?null:{own:ds.k};return}
  if(a==='decoStore'){if(DECO.sel&&DECO.sel.put!=null)decoStore(DECO.sel.put);DECO.sel=null;return}
  if(a==='decoSlot'){const i=+ds.i,j=decoAt(i);
    if(j>=0){DECO.sel=DECO.sel&&DECO.sel.put===j?null:{put:j};return}
    if(DECO.sel&&decoPlace(DECO.sel,i)){DECO.sel=null;sfx('coin')}
    else banner(T('deco.pickFirst'),C.chalk)}
}

/* ---- הלשונית בחלון השוק: קונים בטור אחד, והמפה עם המחסן בטור השני ---- */
function decoTab(){return{id:'deco',label:'🎏 '+T('deco.tab'),html:decoHtml}}
function decoHtml(){
  const coins=SAVE.bag.coins||0,cards=Object.keys(DECO.items).map(k=>{const I=DECO.items[k],n=decoCount(k),p=decoPrice(k),full=n>=I.max,poor=!full&&coins<p;
    return '<button class="tcard dcard" data-act="decoBuy" data-k="'+k+'"'+(full||poor?' disabled':'')+' aria-label="'+T('deco.buy')+' '+T('deco.'+k)+'">'+
      '<span class="ic">'+I.icon+'</span><span class="nm">'+T('deco.'+k)+'</span><span class="pr">'+(full?'✓':'<bdi>'+shortN(p)+'</bdi>'+resPic('coins'))+'</span>'+
      '<small class="hv'+(poor?' tw':'')+'">'+(full?T('deco.full'):poor?T('vil.noCoins'):T('deco.have',n,I.max))+'</small></button>'}).join('');
  return '<div class="bwcols dcols"><section><div class="bwch"><b>'+T('deco.shop')+'</b></div><div class="bwgrid trade">'+cards+'</div></section>'+
    '<section><div class="bwch"><b>'+T('deco.map')+'</b></div>'+decoMapHtml()+decoOwnHtml()+'</section></div>';
}
// המפה: המבנים, וכל מקום (ריק או עם קישוט). x,y באחוזים מהכפר
function decoMapHtml(){
  const R=VILLAGE.radius+20,pc=v=>((v+R)/(2*R)*100).toFixed(1)+'%',sel=DECO.sel,d=decoSave();
  let s='<div class="dmap" role="group" aria-label="'+T('deco.map')+'">';
  for(const k in VILLAGE.b){const B=VILLAGE.b[k];s+='<span class="dbld'+(vLv(k)?'':' none')+'" style="left:'+pc(B.x)+';top:'+pc(B.y)+'" aria-hidden="true">'+(DECO.mapIcon[k]||'🏠')+'</span>'}
  s+='<span class="dbld" style="left:'+pc(VILLAGE.gate.x)+';top:'+pc(VILLAGE.gate.y-30)+'" aria-hidden="true">🚪</span>';
  decoSlots().forEach((p,i)=>{const j=decoAt(i),it=j>=0&&DECO.items[d.put[j].k];
    s+='<button class="dslot'+(it?' has':'')+(sel&&sel.put===j&&j>=0?' on':'')+(!it&&sel?' go':'')+'" data-act="decoSlot" data-i="'+i+'" style="left:'+pc(p.x)+';top:'+pc(p.y)+'" aria-label="'+(it?T('deco.'+d.put[j].k):T('deco.empty'))+'">'+(it?it.icon:'')+'</button>'});
  return s+'</div>';
}
// מה שבמחסן, וכפתור "למחסן" כשנבחר קישוט שעומד
function decoOwnHtml(){
  const d=decoSave(),ks=Object.keys(d.own).filter(k=>d.own[k]>0&&DECO.items[k]),sel=DECO.sel;
  let s='<div class="downs">';
  if(sel&&sel.put!=null)s+='<button class="vbtn dstore" data-act="decoStore">📦 '+T('deco.store')+'</button>';
  else if(ks.length)for(const k of ks)s+='<button class="down'+(sel&&sel.own===k?' on':'')+'" data-act="decoOwn" data-k="'+k+'">'+DECO.items[k].icon+'<small>×'+d.own[k]+'</small></button>';
  s+='<small class="dhint">'+T(sel?'deco.hint.place':d.put.length?'deco.hint.move':'deco.hint.buy')+'</small>';
  return s+'</div>';
}

/* ---- ביקור (visit.js): מה החבר רואה ---- */
// מה נכנס לפרופיל הציבורי: רק מה שעומד בכפר, קצר
function decoPub(){return decoSave().put.filter(p=>DECO.items[p.k]).slice(0,DECO.slot.max).map(p=>[p.k,Math.round(p.x),Math.round(p.y)])}
// שורה בחלון הביקור: כל סוג עם כמה יש. בלי קישוטים: כלום
function decoVisitHtml(list){
  if(!Array.isArray(list)||!list.length)return'';
  const n={};for(const p of list)if(Array.isArray(p)&&DECO.items[p[0]])n[p[0]]=(n[p[0]]||0)+1;
  const ks=Object.keys(n).slice(0,DECO.visitShow);if(!ks.length)return'';
  return '<div class="visdeco"><b>'+T('deco.visit')+'</b>'+ks.map(k=>'<span title="'+T('deco.'+k)+'">'+DECO.items[k].icon+(n[k]>1?'<small>×'+n[k]+'</small>':'')+'</span>').join('')+'</div>';
}

/* ---- ציור ---- */
// דו-ממד: אייקון הקישוט על צל קטן. נקרא מ-drawVillage
function decoDraw2d(){
  const d=SAVE.deco;if(!d||!Array.isArray(d.put)||!d.put.length)return;
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='30px serif';
  for(const p of d.put){const I=DECO.items[p.k];if(!I)continue;
    ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(p.x,p.y+4,18,6,0,0,7);ctx.fill();
    ctx.fillText(I.icon,p.x,p.y-14)}
}
// תלת-ממד: בונים מחדש רק כשמשהו השתנה. V: R3D.vil
function deco3d(V){
  const d=SAVE.deco,list=d&&Array.isArray(d.put)?d.put:[],key=JSON.stringify(list);
  if(V.decoKey===key)return;V.decoKey=key;
  if(V.deco)V.g.remove(V.deco);V.deco=new THREE.Group();V.g.add(V.deco);
  for(const p of list){const I=DECO.items[p.k];if(!I)continue;
    try{if(I.build)deco3dBuild(I,p.x,p.y,V.deco);
      else for(const q of I.parts)if(R3D.props[q.m])vPut(q.m,p.x+(q.dx||0),p.y+(q.dy||0),q.w,hash(p.x,p.y)*6.28,V.deco)}
    catch(e){}}
}
// קישוטים שנבנים מצורות: פנס (כמו הפנסים בכפר), פסל (כן, גוף, ראש וחרב מורמת), מזרקה
function deco3dBuild(I,x,y,g){
  if(I.build==='lamp'){if(typeof p3StreetLamp==='function')p3StreetLamp(x,y,g);return}
  const grp=new THREE.Group(),mat=c=>new THREE.MeshLambertMaterial({color:c,flatShading:true,emissive:new THREE.Color(c).multiplyScalar(I.glow||0)}),
    add=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);grp.add(o);return o};
  if(I.build==='statue'){const st=mat('#6c6a78'),body=mat(I.col);
    add(new THREE.BoxGeometry(30,14,30),st,0,7,0);
    add(new THREE.CylinderGeometry(6,9,26,8),body,0,27,0);
    add(new THREE.SphereGeometry(7,10,8),body,0,46,0);
    add(new THREE.BoxGeometry(3,30,3),body,9,52,0).rotation.z=-0.25}
  else{const st=mat('#8d8a96'),wt=new THREE.MeshLambertMaterial({color:'#4FB4FF',emissive:new THREE.Color('#1d5f8f')});
    add(new THREE.CylinderGeometry(34,36,10,16),st,0,5,0);
    add(new THREE.CylinderGeometry(30,30,2,16),wt,0,10,0);
    add(new THREE.CylinderGeometry(4,6,26,8),st,0,20,0);
    add(new THREE.CylinderGeometry(13,8,6,12),st,0,34,0);
    add(new THREE.CylinderGeometry(10,10,2,12),wt,0,37,0)}
  grp.position.set(x,0,y/SIN());g.add(grp);
}
