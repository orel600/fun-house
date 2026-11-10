/* כלי איסוף ביד, שלב 2 (GTOOL, ניר 8.11.2026, docs/concept-gathering.md פרק "שלב 2").
   שני כלים: גרזן לעצים ולשיחים, מכוש לסלעים ולמתכות (ניר, 10.11: במקום פטיש. בקוד המפתח נשאר hammer). 5 דרגות מהחומרים שכבר יש (עץ, נחושת, ברזל, כסף, זהב).
   הדרגה נותנת קצת יותר כוח מכה במקורות (pow), ובעיקר יותר מהחומר הראשי מכל מקור (yld). ניר, 9.11.2026 (docs/concept-village-loop.md פרק 1):
   זה מבטל במכוון את הכלל "כמות השלל לא משתנה" של שלבים 1-2, רק לכלי. האבנים היקרות והנדירים לא מוכפלים.
   משאב חדש בכל דרגה (hard): מקור שצריך כלי טוב יותר נשבר לאט (slow) ונותן חצי שלל (half, לפחות 1). רך: אף פעם לא חסום.
   משדרגים בנפחייה, בלשונית "כלים", עם שעון שרץ גם כשהמשחק סגור (כמו המנסרה). בינתיים אוספים עם הכלי הישן.
   דרגה N צריכה נפחייה ברמה N. מדרגה gm.from צריך גם מומחיות gm.rank במשפחה של הכלי (gmastery.js).
   ביד: כשמקור הוא המטרה (gtAim: אין אויב בטווח), הכלי ביד במקום הנשק, עם תנועה משלו (anim: חטיבה או כרייה), ועוד רגע אחרי המכה (hold).
   בתלת-ממד הוא חלק בדמות (gtProps ב-heroLook). קשת ומטה: מכה בכלי מקרוב ולא חץ (gtStrike מ-attack ב-combat.js).
   רק בעולם הפתוח (gOn): הזירה של אוראל לא משתנה. נשמר ב-SAVE.gt.
   חיבורים: gtDrop מ-nodeDown (nodes.js), gtHit מ-gHit (gather.js), gtProps וגtShow3d מ-render3d.js, gtDraw/gtClick מ-forgeDraw (aging.js), gtSign מ-drawVillageScreen (village.js) */
const GTOOL={
  // anim: התנועה כשמכים במקור. גרזן: מכה מלמעלה ביד אחת. מכוש: מכה כבדה בשתי ידיים (ניר, 10.11: "צריך מכוש לסלעים וגרזן לעצים")
  // המפתח hammer נשאר בקוד ובשמירה (SAVE.gt.hammer), כמו gun=קשת. השחקן רואה מכוש: השם ב-lang.js, האייקון והמודל (gtPickaxe)
  tools:{axe:{fams:['wood','plant'],gm:'wood',model:'w_axe_A',pic:'icons/ui/gear/axe.png',anim:'Melee_1H_Attack_Chop'},
         hammer:{fams:['stone'],gm:'stone',model:'w_pickaxe',pic:'icons/ui/gear/pickaxe.png',anim:'Melee_2H_Attack_Chop'}},
  // הדרגות. tex: הטקסטורה של החומר (wtex ב-build3d.js). glow: זוהר עדין לנחושת ולזהב. pow: פי כמה המכה במקור. yld: פי כמה החומר הראשי מכל מקור
  tiers:[null,{id:'wood',tex:'wood',col:'#B07A45',pow:1,yld:1},{id:'copper',tex:'iron',col:'#C87533',glow:'#C87533',gk:0.35,pow:1.1,yld:1.25},{id:'iron',tex:'iron',col:'#9AA3AD',pow:1.2,yld:1.5},{id:'silver',tex:'silver',col:'#DCE3EA',pow:1.3,yld:1.75},{id:'gold',tex:'gold',col:'#FFD45A',glow:'#FFD45A',gk:0.25,pow:1.4,yld:2}],
  // cost[t]: מה עולה להגיע לדרגה t. time[t]: כמה שניות השעון
  cost:[null,null,{coins:30,wood:20,stone:15,copper:6},{coins:80,wood:40,stone:35,iron:10},{coins:180,wood:80,stone:70,silver:8},{coins:350,wood:150,stone:120,gold:5}],
  time:[0,0,120,300,600,1200],
  // מאיזו דרגת כלי המקור נשבר בקצב רגיל ובשלל מלא (המפתח: kind ב-NODES.kinds). לפי סדר האזורים, כך שהכלי הוא עוד דרך קדימה.
  // פטיש: ברזל, כסף, זהב, מיתריל והגבישים של כל אזור. גרזן: קני סוף, אורן וקקטוס, עץ שרוף, עץ צל
  hard:{iron:2,tideRock:2,silver:3,iceRock:3,emberRock:3,gold:4,stormRock:4,mythril:5,voidRock:5,
        reeds:2,pine:3,cactus:3,deadTree:4,shadeTree:5},
  slow:0.5,                           // כלי חלש מדי: פי כמה המכה
  half:0.5,                           // כלי חלש מדי: פי כמה החומר הראשי (לפחות 1)
  gm:{from:3,rank:2},                 // מדרגה 3 בכלי: צריך מומחיות 2 במשפחה שלו
  scale:1.45,                         // הכלי ביד גדול מהמציאות, כדי שרואים אותו בטלפון (ניר, 10.11: "הכלי ביד")
  hold:0.7,                           // כמה שניות הכלי נשאר ביד אחרי מכה במקור
  stat:{hit:0,slow:0,start:0,done:0,more:0,less:0,aim:0,strike:0,anim:{}}
};
const gtSave=()=>SAVE.gt||(SAVE.gt={axe:1,hammer:1,job:{}});
const gtTier=k=>gtSave()[k]||1;
// איזה כלי למקור: לפי המשפחה במומחיות (gmFam). null לתיבה
function gtOf(n){const f=n&&gmFam(n);if(!f)return null;for(const k in GTOOL.tools)if(GTOOL.tools[k].fams.includes(f))return k;return null}
// פי כמה המכה במקור n עם הכלי שיש עכשיו
function gtPow(n){
  const k=gtOf(n);if(!k)return 1;
  return GTOOL.tiers[gtTier(k)].pow*(gtWeak(n)?GTOOL.slow:1);
}
// הכלי חלש מדי למקור n (hard)
const gtWeak=n=>{const k=gtOf(n),need=k&&GTOOL.hard[n.kind];return !!need&&gtTier(k)<need};
// החומר הראשי של מקור: המשאב הראשון שנופל תמיד (עץ, אבן, נחושת, עשב...). רק הוא מוכפל
function gtMain(kind){const D=NODES.kinds[kind]&&NODES.kinds[kind].drop;if(D)for(const r in D)if(D[r][0]>=1)return r;return null}
// פי כמה החומר הראשי מהמקור n עם הכלי שיש עכשיו. 1 בזירה ובתיבות
function gtYield(n){const k=gtOf(n);if(!gOn()||!k)return 1;return gtWeak(n)?GTOOL.half:GTOOL.tiers[gtTier(k)].yld}
// השלל של מקור שנשבר (nodeDown): עותק עם החומר הראשי מוכפל. שבר = סיכוי ליחידה נוספת, ולפחות 1
function gtDrop(n,D){
  const m=gtYield(n),r=gtMain(n.kind);if(m===1||!r||!D[r])return D;
  const a=D[r][1]*m,c=Math.max(1,Math.floor(a)+(Math.random()<a%1?1:0)),o=Object.assign({},D);
  o[r]=[D[r][0],c].concat(D[r].slice(2));if(c>D[r][1])GTOOL.stat.more++;else if(c<D[r][1])GTOOL.stat.less++;
  return o;
}
// מכה במקור (gHit). d: הנזק שכבר ירד. הכלי מוסיף או מוריד את ההפרש, והכלי מופיע ביד
function gtHit(n,d){
  if(!gOn()||!d||!n||n.gmSide)return;const k=gtOf(n);if(!k)return;
  const m=gtPow(n);if(m!==1)n.hp-=d*(m-1);
  if(m<1)GTOOL.stat.slow++;GTOOL.stat.hit++;
  P.gtHold={k,t:gNow()};
}
/* הכלי שהגיבור עומד להשתמש בו: אין אויב בטווח (אויבים קודמים, aimTarget ב-combat.js) ויש מקור קרוב. כך הכלי יוצא ליד לפני המכה,
   והנשק חוזר כשאויב מתקרב. פעם אחת לכל פריים */
const GTAIM={t:-1,w:null,k:null};
function gtAim(){
  if(!gOn()||S.mode!=='play')return null;if(GTAIM.t===S.wd.t&&GTAIM.w===S.wd)return GTAIM.k;GTAIM.t=S.wd.t;GTAIM.w=S.wd;
  const m=Math.min(P.weapon==='sword'?P.sw.range:440,WORLD.attackRange),n=!enemies.some(e=>!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)-e.r<=m)&&nodeNear();
  return GTAIM.k=n?gtOf(n):null;
}
// הכלי שביד עכשיו, או null: מקור שעומדים לפניו, או מכה במקור שקרתה עכשיו
const gtHeld=()=>S&&S.wd&&(gtAim()||(P.gtHold&&gNow()-P.gtHold.t<GTOOL.hold?P.gtHold.k:null));
// התנועה של הכלי ביד (syncPlayer ב-render3d.js). אנימציה שאין לדמות: המכה של הגרזן
const gtAnim=k=>{const a=GTOOL.tools[k].anim;return R3D.clips[a+'@up']?a:GTOOL.tools.axe.anim};
/* קשת או מטה מול מקור: לא יורים חץ בעץ. מכה בכלי מקרוב, באותו קצב ובאותו נזק כמו החצים (attack ב-combat.js). מחזיר true כשטיפל */
function gtStrike(n){
  if(!gOn()||!n||!n.node||!gtOf(n))return false;const g=P.gn;if(g.t>0)return true;
  g.t=g.cd*wK('cd');GTOOL.stat.strike++;
  damage(n,wRoll(P.gn.dmg*wK('dmg')*dmgK())*(g.multi||1),'gun',Math.atan2(n.y-P.y,n.x-P.x));S.shake=Math.max(S.shake,2);
  return true;
}

/* ---- שדרוג עם שעון ---- */
const gtJob=k=>gtSave().job&&gtSave().job[k];
const gtLeft=k=>{const j=gtJob(k);return j?Math.max(0,Math.ceil((j.end-Date.now())/1000)):0};
const gtClock=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
// למה אי אפשר לשדרג: 'max', 'job' (כבר בעבודה), 'forge', 'gm', 'cost', או null
function gtBlock(k){
  const t=gtTier(k)+1;if(t>=GTOOL.tiers.length)return 'max';
  if(gtJob(k))return 'job';
  if(vLv('forge')<t)return 'forge';
  if(t>=GTOOL.gm.from&&gmTier(GTOOL.tools[k].gm)<GTOOL.gm.rank)return 'gm';
  const c=GTOOL.cost[t];for(const r in c)if(!bagHas(r,c[r]))return 'cost';
  return null;
}
function gtStart(k){
  if(gtBlock(k))return false;const t=gtTier(k)+1,c=GTOOL.cost[t],s=gtSave();
  for(const r in c)bagTake(r,c[r]);
  (s.job||(s.job={}))[k]={to:t,end:Date.now()+GTOOL.time[t]*1000};GTOOL.stat.start++;saveNow();
  const B=VILLAGE.b.forge;celebrate(B.x,B.y,'gear','⏳');sfx('coin');
  return true;
}
// שעון שנגמר: הדרגה עולה, חגיגה ושורה. רץ כל שנייה, וגם מיד כשנכנסים (השעון רץ גם כשהמשחק סגור)
function gtTick(){
  if(typeof SAVE==='undefined'||!SAVE||!SAVE.gt||!SAVE.gt.job||typeof S==='undefined'||!S)return;
  const s=SAVE.gt;let any=false;
  for(const k in s.job){const j=s.job[k];if(Date.now()<j.end)continue;
    s[k]=Math.max(s[k]||1,j.to);delete s.job[k];GTOOL.stat.done++;any=true;
    if(S.mode==='play'||S.mode==='forge'){celebrate(P.x,P.y-20,'gear','+1');banner(T('gt.done',T('gt.'+k),T('gt.t.'+GTOOL.tiers[j.to].id)),C.gold)}}
  if(any){saveNow();R3D&&(R3D._hl=null)}
  if(S.mode==='forge'&&typeof AUI!=='undefined'&&AUI.tab==='tool'&&(any||Object.keys(s.job).length))gtDraw();
}
setInterval(gtTick,1000);

/* ---- הלשונית בנפחייה (forgeDraw ב-aging.js) ---- */
let GT_SEL='axe';   // הכלי שנבחר בלשונית
function gtDraw(){
  // שמאל: שורה לכל כלי (תמונה, שם, דרגה, ושעון אם הוא בעבודה). ימין: הכלי שנבחר, מה הבא, המחיר והכפתור
  $('fItems').innerHTML=Object.keys(GTOOL.tools).map(k=>{const t=gtTier(k),j=gtJob(k);
    return '<button class="gtcard" data-gt="'+k+'"'+(GT_SEL===k?' aria-pressed="true"':'')+'><img src="'+GTOOL.tools[k].pic+'" alt=""><span><b>'+T('gt.'+k)+'</b><small class="dim">'+T('gt.t.'+GTOOL.tiers[t].id)+' · '+T('gt.lv',t)+'</small>'+
      (j?'<small class="gtwait">⏳ '+gtClock(gtLeft(k))+'</small>':gtOpens(k,t+1))+'</span></button>'}).join('');
  const k=GT_SEL,T_=GTOOL.tools[k],t=gtTier(k),nx=GTOOL.tiers[t+1],why=gtBlock(k);
  let d='<h3>'+T('gt.'+k)+' <span class="dim">'+T('gt.t.'+GTOOL.tiers[t].id)+'</span>'+(why==='max'||why==='job'?'':goalPinBtn({t:k},'pinT'))+'</h3>';   // 📌 יעד בעולם (goal.js)
  if(why==='max')d+='<p class="dim">'+T('gt.max')+'</p>';
  else if(why==='job'){const j=gtJob(k);d+='<p class="gtwait">⏳ '+T('gt.wait',T('gt.t.'+GTOOL.tiers[j.to].id),gtClock(gtLeft(k)))+'</p>'}
  else d+='<p class="dim">'+T('gt.next',T('gt.t.'+nx.id),Math.round((nx.yld/GTOOL.tiers[t].yld-1)*100),Math.round(GTOOL.time[t+1]/60))+'</p><div class="cost">'+costLine(GTOOL.cost[t+1])+'</div>'+
    '<div class="gbtns"><button class="vbtn" data-act="gtUp" data-k="'+k+'"'+(why?' disabled':'')+'>'+(why==='forge'?T('gt.needForge',t+1):why==='gm'?T('gt.needGm',T('gm.'+T_.gm),GTOOL.gm.rank):why==='cost'?T('age.needCost'):T('gt.go'))+'</button></div>';
  $('fDetail').innerHTML=d+'<p class="dim gthint">'+T('gt.hint')+'</p>';
}
// אילו מקורות הדרגה t פותחת לכלי k (hard): שורה אחת עם השמות, או כלום
function gtOpens(k,t){const fs=GTOOL.tools[k].fams,ks=Object.keys(GTOOL.hard).filter(n=>GTOOL.hard[n]===t&&NODES.kinds[n]&&fs.includes(gmFam({kind:n})));
  return ks.length?'<small class="gtopen">'+T('gt.opens',ks.map(n=>T('node.'+n)).join(', '))+'</small>':''}
function gtClick(b){
  if(b.dataset.gt){GT_SEL=b.dataset.gt;return true}
  if(goalAct(b))return true;   // 📌 יעד בעולם (goal.js)
  if(b.dataset.act!=='gtUp')return false;gtStart(b.dataset.k);return true}
// השלט מעל הנפחייה בכפר בזמן שדרוג: השעון הקצר מבין השניים
function gtSign(){const ks=Object.keys(GTOOL.tools).filter(gtJob);if(!ks.length)return null;
  const l=Math.min(...ks.map(gtLeft));return l>0?'⏳ '+gtClock(l):'✓ '+T('gt.ready')}

/* ---- דו-ממד: ידית עץ וראש בצבע הדרגה (col). גרזן: להב בצד. פטיש: גוש ברוחב. מ-drawPlayer (render.js) ---- */
function gtDraw2d(hx,hy,a){
  const k=gtHeld();if(!k)return false;const col=GTOOL.tiers[gtTier(k)].col,cx=Math.cos(a),cy=Math.sin(a),ex=hx+cx*28,ey=hy+cy*28,nx=-cy,ny=cx;
  ctx.strokeStyle='#8A5A30';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx-cx*4,hy-cy*4);ctx.lineTo(ex,ey);ctx.stroke();
  ctx.fillStyle=col;ctx.strokeStyle='#2A2230';ctx.lineWidth=1.2;ctx.beginPath();
  if(k==='axe'){ctx.moveTo(ex-cx*2,ey-cy*2);ctx.lineTo(ex-cx*7+nx*9,ey-cy*7+ny*9);ctx.quadraticCurveTo(ex+nx*13,ey+ny*13,ex+cx*5+nx*9,ey+cy*5+ny*9);ctx.lineTo(ex+cx*2,ey+cy*2)}
  else{const l=15;ctx.moveTo(ex+nx*l-cx*5,ey+ny*l-cy*5);ctx.quadraticCurveTo(ex+cx*5,ey+cy*5,ex-nx*l-cx*5,ey-ny*l-cy*5);ctx.quadraticCurveTo(ex+cx*1,ey+cy*1,ex+nx*l-cx*5,ey+ny*l-cy*5)}   // מכוש: קשת עם שני חודים
  ctx.closePath();ctx.fill();ctx.stroke();return true;
}

/* ---- תלת-ממד: שני הכלים כחלקים בדמות, מוסתרים עד שמכים במקור ---- */
const gtKey=()=>S&&S.wd?'|gt'+gtTier('axe')+gtTier('hammer'):'';
function gtProps(L){
  if(!S||!S.wd)return;gtPickaxe();
  for(const k in GTOOL.tools){const tr=GTOOL.tiers[gtTier(k)];if(!R3D.props[GTOOL.tools[k].model])continue;
    L.props['tool_'+k]=Object.assign({prop:GTOOL.tools[k].model,tier:tr.tex,s:GTOOL.scale},GRIP3D.chop,tr.glow?{glow:tr.glow,gk:tr.gk}:{})}
}
// אחרי שהנשקים קיבלו את הנראות שלהם: כלי ביד מסתיר את הנשק ואת המגן
function gtShow3d(a){
  const k=gtHeld();let any=false;
  for(const t in GTOOL.tools){const p=a.props['tool_'+t];if(p){p.visible=t===k;any=true}}
  if(k&&any)for(const n of ['sword','gun','shield'])if(a.props[n])a.props[n].visible=false;
}
/* המכוש בתלת-ממד: אין מכוש ב-KayKit, אז הוא נבנה כאן מצורות פשוטות, באותם ממדים כמו הפטיש (w_hammer_A): ידית לאורך y, הראש למעלה.
   הדרגה מלבישה עליו את הטקסטורה של החומר (wtex), כמו על כל נשק */
function gtPickaxe(){
  if(R3D.props.w_pickaxe||typeof THREE==='undefined'||!THREE.mergeGeometries)return;
  const parts=[],add=g=>parts.push(g.toNonIndexed());
  {const g=new THREE.CylinderGeometry(0.045,0.05,1.04,8);g.translate(0,0.1,0);add(g)}           // ידית
  {const g=new THREE.BoxGeometry(0.15,0.17,0.15);g.translate(0,0.6,0);add(g)}                   // צווארון
  for(const sd of [1,-1]){const g=new THREE.ConeGeometry(0.075,0.46,6);g.rotateZ(-sd*Math.PI/2);g.translate(sd*0.23,0,0);g.rotateZ(-sd*0.32);g.translate(0,0.62,0);add(g)}   // שני חודים שמתעקלים למטה
  const geo=THREE.mergeGeometries(parts);geo.computeVertexNormals();
  const root=new THREE.Group();root.add(new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:'#ffffff',flatShading:true})));
  R3D.props.w_pickaxe=root;
}
