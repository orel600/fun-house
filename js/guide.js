/* תמיד מטרה ברורה (roadmap.md, "שיפור החוויה", 1.11.2026). ניר: הדבר הכי מגושם הוא ש"לא ברור לאן ללכת".
   כמו במשחקי עולם פתוח בטלפון (Genshin, Pokémon Go, Diablo Immortal): שורה אחת קבועה למעלה עם המטרה הבאה בשפה פשוטה ומרחק,
   חץ בקצה המסך כשהמטרה מחוץ למסך, ושובל נקודות על הרצפה מהגיבור לכיוון שלה.
   מה המטרה, לפי הסדר (guideGoal):
     1. קווסט עלילה ⭐ פעיל (quests.js, story.js)
     2. קווסט שהושלם ומחכה לפרס, ואחריו הפרק הבא בעלילה שמחכה אצל ראש הכפר
     3. קווסט פעיל אחר: זה שבחרת לעקוב אחריו, אחר כך כל השאר, ובסוף היומיים
     4. אם אין כלום, הצעה: פרס האתגר היומי, קווסט חדש אצל תושב, האתגר עצמו, או אזור שעוד לא ביקרת בו
   מטרה באזור אחר: החץ מצביע על השער הנכון (WORLD.paths, home), ובכפר על השער לעולם. מחשבים את הדרך בכל פעם (guideStep).
   נגיעה בשורה פותחת את היומן, ✨ קופץ לפנס דולק באזור של המטרה (travel.js), ו-▴ מכווץ אותה לאייקון ומרחק (נשמר בטלפון). רק בכפר ובעולם: בזירה נשאר קו המעקב של הקווסט (qTrack).
   ההיגיון לא יודע איך החץ נראה: guideGoal ו-guideTarget מחזירים נתונים, והציור ב-guideDraw */

const GUIDE={
  every:0.25,          // כל כמה שניות מחשבים מחדש את המטרה ומעדכנים את השורה
  m:20,                // כמה פיקסלים במשחק הם "מטר" במרחק שבשורה
  near:70,             // קרוב מזה למטרה: בלי שובל וחץ, רק "כאן"
  col:'#FFD36B',       // הצבע של החץ והשובל. זהב, כמו כל מה שמוביל להתקדמות
  arrow:1.6,           // גודל החץ בקצה המסך (edgeArrow ב-render.js)
  dots:6,gap:34,       // השובל על הרצפה: כמה נקודות, ובאיזה מרווח
  icon:{story:'⭐',claim:'✅',quest:'📜',daily:'📅',talk:'💬',challenge:'🌀',explore:'🧭'},
  key:'fh-guide-min'   // בטלפון: האם השורה מכווצת
};
let guideT=0,guideG=null,guideKey='';

/* ---- מה המטרה ---- */
const gReg=r=>r==='meadow'?WORLD:WORLD.regions[r];
const gBack=r=>r==='meadow'?'village':gReg(r).back;
const gHere=()=>S.vil?'village':S.wd?S.wd.reg:null;
// הפרק של קווסט עלילה: s1 = הפנס הראשון ב-STORY.lanterns, s2 = השני וכו'
function gLantern(q){const n=+(q.id.match(/^s(\d)/)||[])[1],k=Object.keys(STORY.lanterns)[n-1];return k?{k,L:STORY.lanterns[k]}:null}
// המקום הקרוב ביותר מתוך רשימה, כשנמצאים באותו אזור. אחרת הראשון
function gNear(list){if(!list.length)return null;if(!P||!S.wd)return list[0];return list.reduce((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)<=Math.hypot(b.x-P.x,b.y-P.y)?a:b)}
// איפה עושים מטרה של קווסט: {place, x, y}. בלי x,y: כל מקום באזור טוב
function gWhere(q,o){
  const st=q.kind==='story'?gLantern(q):null,here=gHere(),inW=here&&here!=='village';
  if(o.type==='story'){
    if(WORLD.regions[o.what])return{place:o.what};                   // להגיע לאזור
    if(st&&st.L.ev===o.what)return{place:st.L.reg,x:st.L.x,y:st.L.y}; // להפיל את השומר ליד הפנס
    return{place:st?st.L.reg:'meadow'};                               // הרסיס: פיוחו חופרת באחו
  }
  if(o.type==='kill'&&o.what==='warden'&&st)return{place:st.L.reg,x:st.L.x,y:st.L.y};
  if(o.type==='upgrade'){const B=VILLAGE.b[o.what];return B?{place:'village',x:B.x,y:B.y}:{place:'village'}}
  if(o.type==='reach')return o.what==='world'?{place:inW?here:'meadow'}:{place:'meadow',...gNear(Object.values(WORLD.gates))};
  if(o.type==='win')return{place:'meadow',...gNear(Object.values(WORLD.gates))};
  if(o.type==='fish'){const F=WNPC.list.fisher.at;return{place:'meadow',x:F.x,y:F.y}}
  // להפיל או לאסוף: האזור של הפרק, או האזור שבו כבר נמצאים, או האחו. בתוך האזור: הקבוצה או השדה הקרובים
  const reg=st?st.L.reg:inW?here:'meadow',R=gReg(reg);
  if(o.type==='kill'&&o.what!=='any'){const g=gNear(R.foes.filter(f=>f.type===o.what));if(g)return{place:reg,x:g.x,y:g.y}}
  if(o.type==='gather'||o.type==='collect'){const g=gNear(R.fields.filter(f=>{const N=NODES.kinds[f.kind];return N&&(N.drop&&N.drop[o.what]||N.wdrop&&N.wdrop[o.what])}));if(g)return{place:reg,x:g.x,y:g.y}}
  return{place:reg};
}
// המטרה של קווסט: המטרה הראשונה שעוד לא הושלמה
function gQuest(q,icon){
  const i=q.obj.findIndex((o,j)=>qProg(q,j)<o.n),o=q.obj[i];
  return{icon,q:q.id,text:qObjTxt(q,i)+' '+qProg(q,i)+'/'+o.n,...gWhere(q,o)};
}
// ללכת לתושב: בכפר, או בעולם (דמויות של worldnpc.js)
function gNpc(id){
  if(NPC.list[id]){const N=npcAt(id)||{x:NPC.list[id].at.x,y:NPC.list[id].at.y};return{place:'village',x:N.x,y:N.y}}
  const W=WNPC.list[id];return W?{place:'meadow',x:W.at.x,y:W.at.y}:{place:'village'};
}
const gNpcName=id=>T('npc.'+id)[0];
function guideGoal(){
  const Q=QS(),I=GUIDE.icon,act=Object.keys(Q.active).map(id=>QBY[id]).filter(Boolean),open=q=>!qReady(q);
  let q=act.find(q=>q.kind==='story'&&open(q));if(q)return gQuest(q,I.story);
  const ready=act.filter(qReady).sort((a,b)=>(b.kind==='story')-(a.kind==='story'));
  if(q=ready[0]){
    if(q.kind==='story'||qKind(q).talk)return{icon:I.claim,q:q.id,text:T('g.claim',gNpcName(q.giver)),...gNpc(q.giver)};
    return{icon:I.claim,q:q.id,text:T('g.reward',T('q.'+q.id)[0]),place:null};   // את הפרס לוקחים ביומן, מכל מקום
  }
  q=QUESTS.list.find(q=>q.kind==='story'&&qOpen(q));   // הפרק הבא מחכה אצל ראש הכפר
  if(q)return{icon:I.story,q:q.id,text:T('g.talk',gNpcName(q.giver)),...gNpc(q.giver)};
  q=Q.track&&QBY[Q.track];if(!(q&&Q.active[q.id]&&open(q)))q=act.find(q=>open(q)&&!qKind(q).auto);
  if(q)return gQuest(q,I.quest);
  if(chCan())return{icon:I.challenge,text:T('g.chClaim'),place:'village'};
  q=QUESTS.list.find(q=>qOpen(q)&&q.giver&&NPC.list[q.giver]);
  if(q)return{icon:I.talk,q:q.id,text:T('g.talk',gNpcName(q.giver)),...gNpc(q.giver)};
  q=act.find(q=>open(q)&&qKind(q).daily);if(q)return gQuest(q,I.daily);
  if(!chDone())return{icon:I.challenge,text:T('g.challenge'),place:gHere()&&gHere()!=='village'?gHere():'meadow'};
  // אזור פתוח שעוד לא ביקרת בו (wmSeen ב-worldmap.js), ואם ביקרת בכולם: האחרון שנפתח
  const regs=['meadow'];for(let i=0;i<regs.length;i++){const R=gReg(regs[i]);for(const k in R.paths||{})if(WORLD.regions[k]&&wPathOpen(R.paths[k])&&!regs.includes(k))regs.push(k)}
  const r=regs.find(r=>!wmSeen(r))||regs[regs.length-1];
  return{icon:I.explore,text:T('g.explore',T('w.region.'+r)),place:r};
}

/* ---- איך מגיעים: הצעד הבא בדרך ---- */
// השער שיוצאים בו מהמקום הנוכחי בדרך אל place: {x,y,gate}. כבר שם: null
function guideStep(place){
  const here=gHere();if(!here||!place||place===here)return null;
  if(here==='village'){const g=VILLAGE.gate;return{x:g.x,y:g.y,gate:T('vil.gate')}}
  // חיפוש לרוחב בין האזורים: הבית מוביל אחורה, ודרך פתוחה מובילה לאזור שלה
  const from={[here]:null},queue=[here];
  while(queue.length){const r=queue.shift();if(r===place)break;if(r==='village')continue;const R=gReg(r);
    const nb=[[gBack(r),'home']];for(const k in R.paths||{})if(wPathOpen(R.paths[k]))nb.push([k,k]);
    for(const [n,g] of nb)if(n&&!(n in from)&&(n==='village'||gReg(n))){from[n]=[r,g];queue.push(n)}}
  if(!(place in from))return null;
  let p=place;while(from[p]&&from[p][0]!==here)p=from[p][0];
  const g=from[p]&&from[p][1];if(!g)return null;const G=g==='home'?WR().home:WR().paths[g];
  return{x:G.x,y:G.y,gate:wGateName(g)};
}
// לאן החץ מצביע עכשיו: {x,y,gate?}, או null כשאין נקודה (כל מקום באזור טוב, או שהפרס ביומן)
function guideTarget(G){
  if(!G||!G.place)return null;
  const s=guideStep(G.place);if(s)return s;
  return G.x!=null&&G.place===gHere()?{x:G.x,y:G.y}:null;
}

/* ---- השורה למעלה ---- */
const guideMin=()=>{try{return localStorage.getItem(GUIDE.key)==='1'}catch(e){return false}};
function guideUi(){
  const el=$('guide'),on=!!(S&&(S.vil||S.wd)&&S.mode==='play'&&guideG&&$('vPanel').hidden&&$('wPanel').hidden);   // ליד מבנה או שער הפאנל שלו במקום השורה
  document.body.classList.toggle('guided',on);
  if(el.hidden===on)el.hidden=!on;if(!on)return;
  const G=guideG,t=guideTarget(G),d=t&&P?Math.hypot(t.x-P.x,t.y-P.y):0;
  const dist=t?(d<GUIDE.near?T('g.here'):T('g.m',Math.max(5,Math.round(d/GUIDE.m/5)*5))):'';
  const via=t&&t.gate?T('g.via',t.gate):'',min=guideMin();
  const jump=guideJump(G),jb=$('guideJump');
  const key=[LANG,min,G.icon,G.text,via,dist,jump].join('|');if(key===guideKey)return;guideKey=key;
  jb.hidden=!jump;jb.dataset.to=jump||'';jb.textContent='✨ '+T('g.jump');
  el.classList.toggle('min',min);
  const w=G.text.split(' ');$('guideTxt').textContent=min?w.slice(0,3).join(' ')+(w.length>3?'…':''):G.text+(via?' · '+via:'');   // מכווצת: אייקון, 2-3 מילים של המטרה והמרחק
  $('guideIco').textContent=G.icon;$('guideDist').textContent=dist;
  $('guideMin').textContent=min?'▾':'▴';$('guideMin').setAttribute('aria-label',T(min?'g.open':'g.min'));
}
// קפיצה (travel.js): המטרה באזור עם פנס דולק, או בכפר כשנמצאים רחוק ממנו. מחזיר למה לקפוץ ('home' או מזהה פנס), או null
function guideJump(G){
  const here=gHere();if(!G||!G.place||G.place===here||typeof travelGo!=='function')return null;
  if(G.place==='village')return here&&here!=='village'&&here!=='meadow'?'home':null;
  const o=travelOf(G.place);return o?o.k:null;
}
function guideUpdate(){
  const now=fxNow();if(now<guideT)return;guideT=now+GUIDE.every;
  guideG=S&&(S.vil||S.wd)&&SAVE&&SAVE.quests?guideGoal():null;
  guideUi();
}
$('guideMain').addEventListener('click',()=>{if(!S.vil&&!S.wd)return;if(typeof wmapOpen==='function'&&S.wd&&!$('wMap').hidden)wmapOpen(false);if($('qLog').hidden)menuShow('qBtn');sfx('ui')});   // היומן נפתח בתפריט הראשי (menu.js)
$('guideJump').addEventListener('click',()=>{const to=$('guideJump').dataset.to;if(!to)return;
  const why=travelBlock();if(why){banner(T('g.noJump'),C.blood);return}travelGo(to)});
$('guideMin').addEventListener('click',()=>{try{localStorage.setItem(GUIDE.key,guideMin()?'0':'1')}catch(e){}guideKey='';guideUi();sfx('ui')});

/* ---- ביומן: "עכשיו" בגדול בראש (questLog ב-quests.js) ---- */
function guideCard(){
  const G=S&&(S.vil||S.wd)&&SAVE.quests?guideGoal():null;if(!G)return '';
  const t=guideTarget(G),via=t&&t.gate?T('g.via',t.gate):'';
  return '<div class="qc gnow"><small>'+T('g.now')+'</small><b>'+G.icon+' '+G.text+'</b>'+(via?'<p class="next">'+via+'</p>':'')+'</div>';
}
/* ---- מונים בפס העליון של העולם: נגיעה מסבירה מה הם (docs/ux-audit.md) ---- */
for(const [id,k] of [['wSec','g.why.sec'],['chTag','g.why.ch']])$(id).addEventListener('click',()=>{banner(T(k),C.chalk);sfx('ui')});

/* ---- ציור: שובל נקודות על הרצפה, וחץ בקצה המסך. נקרא מ-render.js בכל פריים, ומעדכן גם את השורה, במסך (ox,oy: איפה (0,0) של העולם) ---- */
function guideDraw(ox,oy){
  guideUpdate();
  if(!P||!(S.vil||S.wd)||S.mode!=='play'||!guideG)return;
  const t=guideTarget(guideG);if(!t)return;
  const dx=t.x-P.x,dy=t.y-P.y,d=Math.hypot(dx,dy);if(d<GUIDE.near)return;
  const ux=dx/d,uy=dy/d,ph=(fxNow()*1.5)%1;
  ctx.save();ctx.fillStyle=GUIDE.col;
  for(let i=0;i<GUIDE.dots;i++){const k=(i+ph+1)*GUIDE.gap;if(k>d-20)break;   // השובל זורם לכיוון המטרה, ודוהה ככל שמתרחק מהגיבור
    ctx.globalAlpha=0.75*(1-i/GUIDE.dots);ctx.beginPath();ctx.arc(P.x+ux*k+ox,P.y+uy*k+oy+6,3.5,0,7);ctx.fill()}
  ctx.restore();
  edgeArrow(t.x+ox,t.y+oy,GUIDE.col,GUIDE.arrow*(1+Math.sin(fxNow()*5)*0.08),true);
}
