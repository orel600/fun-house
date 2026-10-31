/* ביקור אצל השני (roadmap, 31.10.2026): ניר ואוראל רואים את הכפר והדמות של השני, ומשאירים הפתעה.
   כל מי שנכנס עם Google מפרסם פרופיל ציבורי קטן (שם, רמה, רמות מבנים, דמות, חיה) בטבלה public.profiles.
   בכפר, כפתור 🏡 פותח את רשימת החברים, ולוחצים על חבר כדי לראות את הכפר שלו (קריאה בלבד).
   אפשר להשאיר לו מתנה: משאב מהתרמיל ופתק מרשימה קבועה. היא נכנסת ל-public.gifts, והוא מקבל אותה בכניסה הבאה לכפר, עם חגיגה.
   בלי חיבור לענן, בלי Google, או כשהטבלאות עוד לא קיימות: הכפתור דהוי, לחיצה מסבירה למה, והמשחק עובד כרגיל.
   הטבלאות וה-RLS: supabase/migrations/20261031_visit.sql. הבקשות עוברות דרך cloudReq (cloud.js), ובבדיקה דרך השרת המדומה */
const VISIT={
  listMax:20,          // כמה חברים לכל היותר ברשימה
  giftMax:10,          // כמה יחידות לכל היותר במתנה אחת
  giftSteps:[1,5,10],  // הכמויות שאפשר לבחור
  perDay:1,            // כמה מתנות ביום לכל חבר
  bagShow:8,           // כמה משאבים מהתרמיל מוצגים לבחירה (הכי הרבה קודם)
  notes:6,             // כמה פתקים ברשימה הקבועה (visit.note.0 עד 5 ב-lang.js)
  inboxDelay:0.9,      // שניות אחרי הכניסה לכפר עד שהמתנות נפתחות, כדי שהכפר יופיע קודם
  icon:{center:'🏰',forge:'⚒️',mill:'🪵',mine:'⛏️',market:'⚖️',stash:'📦'},   // אייקון לכל מבנה בתצוגה
  // מצב
  ready:null,          // הטבלאות קיימות? null: עוד לא ידוע, false: חסרות (404), true: עובד
  friends:null,sel:null,res:null,amt:1,note:0,last:'',got:0,sent:0
};

const visitDay=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function visitSave(){const v=SAVE.visit||(SAVE.visit={sent:{}});if(!isObj(v.sent))v.sent={};return v}
// כמה מתנות כבר נשלחו היום לחבר הזה
function visitSentToday(uid){const s=visitSave().sent[uid];return s&&s.day===visitDay()?s.n:0}

// למה אי אפשר לבקר עכשיו. '' = אפשר
function visitWhy(){
  const s=CLOUD.session;
  if(VISIT.ready===false)return'noTable';
  if(!s||!s.name)return'noName';
  if(CLOUD.status==='off')return'offline';
  return'';
}

// מה החברים רואים: רק מה שצריך לתצוגה, לא כל השמירה
function visitProfile(){
  const H=SAVE.hero||{},V={};for(const k in VILLAGE.b)V[k]=SAVE.village[k]||0;
  return{name:String(CLOUD.session.name).slice(0,40),level:Math.max(1,H.level||1),
    data:{village:V,start:H.start||null,skin:H.skin||null,pet:(SAVE.pet&&SAVE.pet.kind)||PET.default,petStage:(SAVE.pet&&SAVE.pet.stage)||0}};
}
// 404 = הטבלה עוד לא קיימת ב-Supabase: מסמנים, ולא מנסים שוב עד הפעלה הבאה
function visitErr(e){if(/cloud 404/.test(e&&e.message))VISIT.ready=false;visitBtn();return null}
const visitReq=(m,p,b,extra)=>cloudOnce(async()=>{const s=await cloudAuth();return cloudReq(m,p,b,s.access,extra)});

// מפרסמים את הפרופיל, רק כשמשהו השתנה
async function visitPublish(){
  if(visitWhy()==='noName'||VISIT.ready===false)return null;
  const p=visitProfile(),key=JSON.stringify(p);if(key===VISIT.last)return'same';
  try{await visitReq('POST','/rest/v1/profiles?on_conflict=user_id',Object.assign({user_id:CLOUD.session.uid,updated_at:new Date().toISOString()},p),
      {headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
    VISIT.last=key;VISIT.ready=true;visitBtn();return'pushed'}
  catch(e){return visitErr(e)}
}

// מתנות שמחכות לי: לוקחים כל אחת, מוחקים מהשרת ורק אז מוסיפים לתרמיל (כדי שלא תתקבל פעמיים)
async function visitInbox(){
  if(visitWhy())return 0;
  let rows;
  try{rows=(await visitReq('GET','/rest/v1/gifts?select=id,from_name,res,n,note&to_id=eq.'+CLOUD.session.uid+'&order=id.asc')).json||[]}
  catch(e){visitErr(e);return 0}
  let n=0;
  for(const g of rows){
    try{await visitReq('DELETE','/rest/v1/gifts?id=eq.'+g.id)}catch(e){continue}
    if(!resOf(g.res))continue;   // משאב שלא קיים אצלי (גרסה אחרת): מדלגים
    const k=Math.max(1,Math.min(VISIT.giftMax,Math.floor(g.n)||1));bagAdd(g.res,k);n++;
    visitShowGift(g,k,n);
  }
  if(n){saveNow();VISIT.got+=n}
  return n;
}
function visitShowGift(g,k,i){
  setTimeout(()=>{
    if(P&&S)celebrate(P.x,P.y-20,'quest','🎁');sfx('ui');
    banner(T('visit.got',String(g.from_name||'').slice(0,40),'+'+k+' '+T('res.'+g.res),T('visit.note.'+(Math.abs(g.note|0)%VISIT.notes))),C.gold);
  },(i-1)*1800);
}

async function visitFriends(){
  try{const r=await visitReq('GET','/rest/v1/profiles?select=user_id,name,level,data,updated_at&user_id=neq.'+CLOUD.session.uid+'&order=updated_at.desc&limit='+VISIT.listMax);
    VISIT.ready=true;return(r.json||[]).filter(f=>f&&f.user_id&&f.name)}
  catch(e){visitErr(e);return null}
}

// שולחים מתנה לחבר שנבחר. מחזיר true כשהגיעה לשרת
async function visitSend(){
  const f=VISIT.sel,r=VISIT.res,n=Math.min(VISIT.amt,VISIT.giftMax);
  if(!f||!r||!bagHas(r,n)||visitSentToday(f.user_id)>=VISIT.perDay||visitWhy())return false;
  try{await visitReq('POST','/rest/v1/gifts',{from_id:CLOUD.session.uid,to_id:f.user_id,from_name:String(CLOUD.session.name).slice(0,40),res:r,n,note:VISIT.note},
      {headers:{Prefer:'return=minimal'}})}
  catch(e){visitErr(e);return false}
  bagTake(r,n);const S0=visitSave().sent,d=visitDay(),o=S0[f.user_id];S0[f.user_id]={day:d,n:(o&&o.day===d?o.n:0)+1};
  for(const k in S0)if(S0[k].day!==d)delete S0[k];   // ימים קודמים לא צריך לזכור
  saveNow();VISIT.sent++;return true;
}

/* ---- הכפתור והחלון ---- */
// הכפתור בכפר: תמיד מופיע, ודהוי כשאי אפשר לבקר
function visitBtn(){const b=$('visBtn');if(!b)return;b.hidden=!(S&&S.vil);b.classList.toggle('off',!!visitWhy())}

let visitPrev='play';
async function visitOpen(){
  const why=visitWhy();
  if(why){banner(T('visit.why.'+why),C.chalk);sfx('ui');return false}
  if(S&&S.mode!=='visit'){visitPrev=S.mode;S.mode='visit'}joy=null;
  VISIT.sel=null;VISIT.res=null;VISIT.friends=null;visitDraw();$('ovVisit').hidden=false;
  VISIT.friends=await visitFriends();
  if(VISIT.friends&&VISIT.friends.length===1)VISIT.sel=VISIT.friends[0];   // חבר אחד (ניר ואוראל): ישר אליו
  if(!$('ovVisit').hidden)visitDraw();
  return true;
}
function visitClose(){$('ovVisit').hidden=true;if(S&&S.mode==='visit')S.mode=visitPrev==='visit'?'play':visitPrev;visitBtn()}

const vEsc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function visitDraw(){
  const F=VISIT.friends,f=VISIT.sel;
  let s=winHead(T('visit.title'),f?visitWho(f):'','h2')+'<div class="visbody"><div class="vislist">';
  if(F==null)s+='<p class="dim">'+T('visit.loading')+'</p>';
  else if(!F.length)s+='<p class="dim">'+T('visit.none')+'</p>';
  else for(const x of F)s+='<button class="visf'+(f&&f.user_id===x.user_id?' on':'')+'" data-act="pick" data-id="'+vEsc(x.user_id)+'"><b>'+vEsc(x.name)+'</b><small>'+T('visit.lv',x.level|0)+'</small></button>';
  s+='</div><div class="visside">'+(f?visitVillageHtml(f)+visitGiftHtml(f):'<p class="dim">'+T(F&&F.length?'visit.pick':'visit.how')+'</p>')+'</div></div>';
  $('visitWin').innerHTML=s;
}
// מי החבר, בכותרת: שם, דמות, רמה וחיה
function visitWho(f){const d=isObj(f.data)?f.data:{},H=d.start&&HEROES.list[d.start];
  return vEsc(f.name)+' · '+(H?H.icon+' '+T('hero.'+d.start)+' · ':'')+T('visit.lv',f.level|0)+(d.pet&&PET.kinds[d.pet]?' · 🐾 '+T('pet.name.'+d.pet):'')}
// הכפר של החבר, קריאה בלבד: כל מבנה עם הרמה שלו בכוכבים
function visitVillageHtml(f){
  const d=isObj(f.data)?f.data:{},V=isObj(d.village)?d.village:{};
  let s='<div class="visgrid">';
  for(const k in VILLAGE.b){const L=Math.max(0,Math.min(VILLAGE.max,V[k]|0));
    s+='<div class="visb'+(L?'':' none')+'"><span>'+(VISIT.icon[k]||'🏠')+'</span><b>'+T('vil.'+k)+'</b><small>'+(L?'★'.repeat(L)+'☆'.repeat(VILLAGE.max-L):T('vil.notBuilt'))+'</small></div>'}
  return s+'</div>';
}
function visitGiftHtml(f){
  if(visitSentToday(f.user_id)>=VISIT.perDay)return'<p class="visdone">'+T('visit.sentToday')+'</p>';
  const have=Object.keys(SAVE.bag).filter(r=>resOf(r)&&SAVE.bag[r]>0).sort((a,b)=>SAVE.bag[b]-SAVE.bag[a]).slice(0,VISIT.bagShow);
  if(!have.length)return'<p class="dim">'+T('visit.empty')+'</p>';
  if(!VISIT.res||!have.includes(VISIT.res))VISIT.res=have[0];
  let s='<h3>'+T('visit.leave')+'</h3><div class="vispick"><div class="visres">';
  for(const r of have)s+='<button class="visr'+(r===VISIT.res?' on':'')+'" data-act="res" data-r="'+r+'" aria-label="'+T('res.'+r)+'">'+resPic(r)+'<small>'+shortN(SAVE.bag[r])+'</small></button>';
  s+='</div><div class="visamt">';
  for(const n of VISIT.giftSteps)s+='<button class="visn'+(n===VISIT.amt?' on':'')+'" data-act="amt" data-n="'+n+'"'+(bagHas(VISIT.res,n)?'':' disabled')+'>×'+n+'</button>';
  // הפתק: כפתור אחד שמחליף לפתק הבא בכל נגיעה, ולידו "להשאיר"
  const ok=bagHas(VISIT.res,VISIT.amt);
  return s+'</div></div><div class="visnotes"><button class="visnote on" data-act="note">✉ '+T('visit.note.'+VISIT.note)+' <i>›</i></button>'+
    '<button class="vbtn" data-act="send"'+(ok?'':' disabled')+'>'+T('visit.send',VISIT.amt,T('res.'+VISIT.res))+'</button></div>';
}

$('visitWin').addEventListener('click',async e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;sfx('ui');
  if(a==='close')return visitClose();
  if(a==='pick')VISIT.sel=(VISIT.friends||[]).find(x=>x.user_id===b.dataset.id)||null;
  if(a==='res'){VISIT.res=b.dataset.r;if(!bagHas(VISIT.res,VISIT.amt))VISIT.amt=1}
  if(a==='amt')VISIT.amt=+b.dataset.n;
  if(a==='note')VISIT.note=(VISIT.note+1)%VISIT.notes;
  if(a==='send'){b.disabled=true;const ok=await visitSend();
    if(ok){if(P&&S)celebrate(P.x,P.y-20,'quest','🎁');banner(T('visit.sent',String(VISIT.sel.name)),C.gold)}else banner(T('visit.fail'),C.blood)}
  if(!$('ovVisit').hidden)visitDraw();
});
$('visBtn').addEventListener('click',()=>visitOpen());

// חיבורים: בכניסה לכפר (village.js) ואחרי סנכרון מוצלח (cloud.js)
function visitVillage(){
  visitBtn();
  if(visitWhy())return;
  visitPublish();
  setTimeout(()=>{if(S&&S.vil)visitInbox()},VISIT.inboxDelay*1000);
}
function visitCloud(){visitBtn();if(!visitWhy())visitPublish()}

// לבדיקה: מוסיף לשרת המדומה של cloud.js את שתי הטבלאות, עם אותם כללים כמו ה-RLS
function visitFake(F){
  F.profiles={};F.gifts=[];F.gid=0;const base=F.req;
  F.req=(method,path,body,token)=>{
    if(!/^\/rest\/v1\/(profiles|gifts)/.test(path))return base(method,path,body,token);
    return new Promise((ok,no)=>{
      if(F.down)return no(new Error('offline'));if(F.noVisit)return no(new Error('cloud 404'));
      const me=String(token||'').slice(1);if(!me.startsWith('u'))return no(new Error('cloud 401'));
      const named=!!F.google[me],q=new URLSearchParams(path.split('?')[1]||'');F.calls.push(method+' '+path.split('?')[0]);
      const cp=o=>JSON.parse(JSON.stringify(o));
      if(path.startsWith('/rest/v1/profiles')){
        if(method==='GET'){if(!named)return ok({status:200,json:[]});const not=(q.get('user_id')||'').replace('neq.','');
          return ok({status:200,json:Object.values(F.profiles).filter(p=>p.user_id!==not).map(cp)})}
        if(body.user_id!==me)return no(new Error('cloud 403'));F.profiles[me]=cp(body);return ok({status:201,json:null});
      }
      if(method==='GET')return ok({status:200,json:F.gifts.filter(g=>g.to_id===me).map(cp)});
      if(method==='DELETE'){const id=+(q.get('id')||'').replace('eq.','');const i=F.gifts.findIndex(g=>g.id===id&&g.to_id===me);
        if(i>=0)F.gifts.splice(i,1);return ok({status:204,json:null})}
      if(!named||body.from_id!==me||body.to_id===me||!(body.n>=1&&body.n<=50))return no(new Error('cloud 403'));
      F.gifts.push(Object.assign(cp(body),{id:++F.gid}));ok({status:201,json:null});
    })};
  return F;
}
// כל שרת מדומה (גם בבדיקות הענן האחרות) מקבל את הטבלאות, כדי שפרסום הפרופיל לא ייפול על טבלת השמירות
{const base=cloudFakeServer;cloudFakeServer=()=>visitFake(base())}
