/* מסחר עם חבר (roadmap, גל 4: "מסחר עם אוראל"). בנוי על ביקור אצל השני (visit.js).
   בביקור אצל חבר, כפתור ⚖️ פותח הצעה: משאב אחד שנותנים ומשאב אחד שרוצים, עד TRADE.maxN מכל אחד.
   מה שנותנים יוצא מהתרמיל מיד ("נעול בהצעה"), כך שאי אפשר להוציא אותו פעמיים.
   החבר רואה את ההצעה כשהוא נכנס לכפר, ומקבל או דוחה. כשהוא מקבל: נותן את מה שביקשו ממנו ומקבל את מה שהוצע.
   השולח אוסף את מה שביקש (או מקבל בחזרה את מה שנעל, אם נדחה) בכניסה הבאה שלו לכפר. אפשר גם לבטל הצעה שעוד מחכה.
   הטבלה וה-RLS: supabase/migrations/20261102_trade.sql. בלי הטבלה (404) הכפתור פשוט לא מופיע.
   הבקשות עוברות דרך visitReq (visit.js), ובבדיקה דרך השרת המדומה, עם אותם כללים כמו ה-RLS (tradeFake) */
const TRADE={
  maxN:20,             // כמה יחידות לכל היותר מכל צד (כמו ב-SQL)
  steps:[1,5,10,20],   // הכמויות שאפשר לבחור
  maxOpen:3,           // כמה הצעות פתוחות לכל היותר בבת אחת (כמו ב-SQL)
  show:12,             // כמה משאבים מוצגים לבחירה בכל צד
  pub:12,              // כמה משאבים מהתרמיל החבר רואה בפרופיל שלי, כדי לדעת מה לבקש
  delay:2.4,           // שניות אחרי הכניסה לכפר עד שבודקים הצעות (אחרי המתנות של visit.js)
  retry:1.5,tries:40,  // חלון ההצעות מחכה שחלונות אחרים ייסגרו: כל כמה שניות בודקים, וכמה פעמים לכל היותר
  // מצב
  ready:null,          // הטבלה קיימת? null: עוד לא ידוע, false: חסרה (404), true: עובד
  f:null,give:null,gn:1,want:null,wn:1,out:[],inc:[],mode:'',fromVisit:false,prev:'play',busy:false
};
const TRD_PATH='/rest/v1/trades';
const trdOk=r=>r!=='coins'&&!!resOf(r);   // מטבעות לא נסחרים כאן: יש להם שוק
const trdN=n=>Math.max(1,Math.min(TRADE.maxN,Math.floor(n)||1));
const trdRep={headers:{Prefer:'return=representation'}};
function tradeErr(e){if(/cloud 404/.test(e&&e.message))TRADE.ready=false;return null}

// מה החבר רואה מהתרמיל שלי (visitProfile ב-visit.js): המשאבים שיש לי הכי הרבה מהם
function tradeBagPub(){const o={};
  Object.keys(SAVE.bag).filter(r=>trdOk(r)&&SAVE.bag[r]>0).sort((a,b)=>SAVE.bag[b]-SAVE.bag[a]).slice(0,TRADE.pub).forEach(r=>o[r]=Math.min(9999,SAVE.bag[r]|0));
  return o}
const tradeGiveList=()=>Object.keys(SAVE.bag).filter(r=>trdOk(r)&&SAVE.bag[r]>0).sort((a,b)=>SAVE.bag[b]-SAVE.bag[a]).slice(0,TRADE.show);
// מה אפשר לבקש: מה שיש לחבר (מהפרופיל שלו). חבר בגרסה ישנה בלי תרמיל בפרופיל: כל המשאבים, מהנפוץ לנדיר
function tradeWantList(f){
  const b=f&&isObj(f.data)&&isObj(f.data.bag)?f.data.bag:null;
  const L=b?Object.keys(b).filter(r=>trdOk(r)&&b[r]>0):[];
  return L.length?L:Object.keys(RES.list).filter(trdOk).sort((a,c)=>RES.list[a].rar-RES.list[c].rar);
}

/* ---- השרת ---- */
// כל ההצעות שלי (ה-RLS מחזיר רק מה ששלחתי או שנשלח אליי). מחזיר את ההצעות ששלחתי ושכבר נענו
async function tradeLoad(){
  const me=CLOUD.session.uid;
  const rows=((await visitReq('GET',TRD_PATH+'?select=*&order=id.asc&limit=50')).json||[]).filter(t=>t&&t.id);
  TRADE.ready=true;
  TRADE.inc=rows.filter(t=>t.to_id===me&&t.status==='open'&&trdOk(t.give_res)&&trdOk(t.want_res));
  TRADE.out=rows.filter(t=>t.from_id===me&&t.status==='open');
  return rows.filter(t=>t.from_id===me&&t.status!=='open');
}
// הצעות ששלחתי ונענו: מוחקים מהשרת, ורק אם המחיקה הצליחה מוסיפים לתרמיל (כדי שלא יתקבל פעמיים)
async function tradeCollect(done){
  let n=0;
  for(const t of done){
    let row;try{row=((await visitReq('DELETE',TRD_PATH+'?id=eq.'+t.id+'&from_id=eq.'+CLOUD.session.uid,null,trdRep)).json||[])[0]}catch(e){continue}
    if(!row)continue;
    const yes=row.status==='accepted',r=yes?row.want_res:row.give_res,k=trdN(yes?row.want_n:row.give_n);
    if(!trdOk(r))continue;
    bagAdd(r,k);n++;
    const g='+'+k+' '+T('res.'+r);
    if(yes&&P&&S)celebrate(P.x,P.y-20,'quest','⚖️');
    banner(T(yes?'trade.done':'trade.declined',vEsc(String(row.to_name||'')),g),yes?C.gold:C.chalk);
  }
  if(n)saveNow();
  return n;
}

// שולחים את ההצעה. מה שנותנים יוצא מהתרמיל לפני הבקשה, וחוזר אם היא נכשלה
async function tradeSend(){
  const f=TRADE.f,g=TRADE.give,w=TRADE.want,gn=trdN(TRADE.gn),wn=trdN(TRADE.wn);
  if(!f||!trdOk(g)||!trdOk(w)||g===w||TRADE.out.length>=TRADE.maxOpen||visitWhy()||!bagTake(g,gn))return false;
  const me=CLOUD.session;
  try{const r=await visitReq('POST',TRD_PATH,{from_id:me.uid,to_id:f.user_id,from_name:String(me.name).slice(0,40),to_name:String(f.name).slice(0,40),
      give_res:g,give_n:gn,want_res:w,want_n:wn},trdRep);
    const row=(r.json||[])[0];if(row)TRADE.out.push(row)}
  catch(e){bagAdd(g,gn);tradeErr(e);return false}
  saveNow();return true;
}
// ביטול של הצעה שעוד מחכה: רק אם היא עדיין פתוחה (אם החבר כבר ענה, היא תיאסף בכניסה הבאה)
async function tradeCancel(id){
  let row;try{row=((await visitReq('DELETE',TRD_PATH+'?id=eq.'+id+'&status=eq.open',null,trdRep)).json||[])[0]}catch(e){tradeErr(e);return false}
  TRADE.out=TRADE.out.filter(t=>t.id!==id);
  if(!row)return false;
  bagAdd(row.give_res,trdN(row.give_n));saveNow();return row;
}
// תשובה להצעה שקיבלתי. בקבלה, מה שמבקשים ממני יוצא קודם, וחוזר אם התשובה לא הגיעה לשרת
async function tradeAnswer(id,yes){
  const t=TRADE.inc.find(x=>x.id===id);if(!t)return false;
  const wn=trdN(t.want_n);if(yes&&!bagTake(t.want_res,wn))return false;
  let ok=false,gone=false;
  try{const r=await visitReq('PATCH',TRD_PATH+'?id=eq.'+id+'&status=eq.open',{status:yes?'accepted':'declined',updated_at:new Date().toISOString()},trdRep);
    ok=!!(r.json||[]).length;gone=!ok}
  catch(e){tradeErr(e)}
  if(ok||gone)TRADE.inc=TRADE.inc.filter(x=>x.id!==id);   // gone: השולח ביטל בינתיים
  if(!ok){if(yes)bagAdd(t.want_res,wn);return false}
  if(yes){bagAdd(t.give_res,trdN(t.give_n));if(P&&S)celebrate(P.x,P.y-20,'quest','⚖️')}
  saveNow();return true;
}

/* ---- חיבור לכפר (visitVillage ב-visit.js) ---- */
// אוספים הצעות שנענו, ואם מחכות לי הצעות, פותחים את החלון כשאין חלון אחר. now: בלי המתנה (לבדיקה)
async function tradeVillage(now){
  if(visitWhy()||TRADE.ready===false)return;
  const go=async()=>{
    if(!now&&(!S||!S.vil))return;
    let done;try{done=await tradeLoad()}catch(e){tradeErr(e);return}
    await tradeCollect(done);
    if(TRADE.inc.length&&!now)tradeWait(TRADE.tries);
  };
  if(now)return go();
  setTimeout(go,TRADE.delay*1000);
}
function tradeWait(n){
  if(!S||!S.vil||!TRADE.inc.length||n<=0)return;
  if(S.mode!=='play'||WINS.some(uiOpen)||document.body.classList.contains('menu')){setTimeout(()=>tradeWait(n-1),TRADE.retry*1000);return}
  tradeInbox();
}

/* ---- החלון ---- */
// הכפתור בחלון הביקור, רק כשהטבלה קיימת
function tradeBtnHtml(f){return TRADE.ready===true&&f?'<button class="vbtn trdgo" data-act="trade">'+T('trade.btn')+'</button>':''}

// הצעה לחבר, מתוך חלון הביקור
function tradeOpen(f){
  if(TRADE.ready!==true||!f||visitWhy())return false;
  TRADE.f=f;TRADE.mode='make';TRADE.fromVisit=!$('ovVisit').hidden;$('ovVisit').hidden=true;
  if(S&&S.mode!=='visit'&&S.mode!=='trade'){TRADE.prev=S.mode;S.mode='trade'}joy=null;
  tradeDraw();$('ovTrade').hidden=false;return true;
}
// הצעות שמחכות לי
function tradeInbox(){
  TRADE.mode='inbox';TRADE.fromVisit=false;
  if(S&&S.mode!=='trade'){TRADE.prev=S.mode;S.mode='trade'}joy=null;
  tradeDraw();$('ovTrade').hidden=false;return true;
}
function tradeClose(){
  $('ovTrade').hidden=true;
  if(TRADE.fromVisit){TRADE.fromVisit=false;$('ovVisit').hidden=false;visitDraw();return}
  if(S&&S.mode==='trade')S.mode=TRADE.prev==='trade'||TRADE.prev==='visit'?'play':TRADE.prev;
}

const trdDeal=(r,n)=>'<span class="trdd">'+resPic(r)+'<b>×'+n+'</b></span>';
// עמודה אחת בהצעה: המשאבים, ומתחתם הכמות
function tradeCol(kind,title,list,sel,n,cnt,can){
  let s='<div class="trdcol"><h3>'+title+'</h3><div class="visres trdres">';
  for(const r of list)s+='<button class="visr'+(r===sel?' on':'')+'" data-act="'+kind+'" data-r="'+r+'" aria-label="'+T('res.'+r)+'">'+resPic(r)+(cnt(r)!=null?'<small>'+shortN(cnt(r))+'</small>':'')+'</button>';
  s+='</div><div class="visamt">';
  for(const k of TRADE.steps)s+='<button class="visn'+(k===n?' on':'')+'" data-act="'+kind+'N" data-n="'+k+'"'+(can(k)?'':' disabled')+'>×'+k+'</button>';
  return s+'</div></div>';
}
function tradeDraw(){
  let s;
  if(TRADE.mode==='make'){
    const f=TRADE.f,G=tradeGiveList(),W=tradeWantList(f),fb=isObj(f.data)&&isObj(f.data.bag)?f.data.bag:{};
    if(!G.includes(TRADE.give))TRADE.give=G[0]||null;
    if(TRADE.give&&!bagHas(TRADE.give,TRADE.gn))TRADE.gn=1;
    if(!W.includes(TRADE.want)||TRADE.want===TRADE.give)TRADE.want=W.find(r=>r!==TRADE.give)||null;
    s=winHead(T('trade.title'),vEsc(f.name),'h2');
    if(!G.length)s+='<p class="dim">'+T('trade.bagEmpty')+'</p>';
    else{
      s+='<div class="trdbody">'+tradeCol('give',T('trade.give'),G,TRADE.give,TRADE.gn,r=>SAVE.bag[r]||0,k=>bagHas(TRADE.give,k))+
        '<div class="trdarrow" aria-hidden="true">⇄</div>'+
        tradeCol('want',T('trade.want',vEsc(f.name)),W,TRADE.want,TRADE.wn,r=>fb[r]!=null?fb[r]:null,()=>true)+'</div>';
      const mine=TRADE.out.filter(t=>t.to_id===f.user_id),full=TRADE.out.length>=TRADE.maxOpen;
      const ok=!full&&!TRADE.busy&&TRADE.give&&TRADE.want&&TRADE.give!==TRADE.want&&bagHas(TRADE.give,TRADE.gn);
      s+='<div class="trdfoot">';
      for(const t of mine)s+='<div class="trdrow mine">'+trdDeal(t.give_res,t.give_n)+'⇄'+trdDeal(t.want_res,t.want_n)+'<small>'+T('trade.waiting')+'</small><button class="visn" data-act="cancel" data-id="'+(t.id|0)+'">'+T('trade.cancel')+'</button></div>';
      s+=full?'<p class="dim">'+T('trade.full',TRADE.maxOpen)+'</p>':
        '<button class="vbtn trdsend" data-act="send"'+(ok?'':' disabled')+'>⚖️ '+T('trade.send')+' '+trdDeal(TRADE.give,TRADE.gn)+'⇄'+trdDeal(TRADE.want,TRADE.wn)+'</button>';
      s+='<p class="dim trdhint">'+T('trade.lock')+'</p></div>';
    }
  }else{
    s=winHead(T('trade.inbox'),'','h2')+'<div class="trdfoot trdinc">';
    if(!TRADE.inc.length)s+='<p class="dim">'+T('trade.empty')+'</p>';
    for(const t of TRADE.inc){const can=bagHas(t.want_res,trdN(t.want_n));
      s+='<div class="trdrow"><div class="trdwho"><b>'+vEsc(t.from_name)+'</b><small>'+T('trade.gives')+' '+trdDeal(t.give_res,trdN(t.give_n))+' · '+T('trade.asks')+' '+trdDeal(t.want_res,trdN(t.want_n))+'</small>'+
        (can?'':'<small class="trdlack">'+T('trade.lack',shortN(SAVE.bag[t.want_res]||0))+'</small>')+'</div>'+
        '<button class="vbtn" data-act="yes" data-id="'+(t.id|0)+'"'+(can&&!TRADE.busy?'':' disabled')+'>✓ '+T('trade.yes')+'</button>'+
        '<button class="visn" data-act="no" data-id="'+(t.id|0)+'"'+(TRADE.busy?' disabled':'')+'>'+T('trade.no')+'</button></div>'}
    s+='</div>';
  }
  $('tradeWin').innerHTML=s;
}

$('tradeWin').addEventListener('click',async e=>{
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;sfx('ui');
  if(a==='close')return tradeClose();
  if(a==='give'){TRADE.give=b.dataset.r;if(!bagHas(TRADE.give,TRADE.gn))TRADE.gn=1}
  if(a==='want')TRADE.want=b.dataset.r;
  if(a==='giveN')TRADE.gn=+b.dataset.n;
  if(a==='wantN')TRADE.wn=+b.dataset.n;
  const net=a==='send'||a==='cancel'||a==='yes'||a==='no';
  if(net){if(TRADE.busy)return;TRADE.busy=true;tradeDraw()}
  try{
    if(a==='send'){const ok=await tradeSend();
      if(ok){if(P&&S)celebrate(P.x,P.y-20,'quest','⚖️');banner(T('trade.sent',vEsc(String(TRADE.f.name))),C.gold)}else banner(T('trade.fail'),C.blood)}
    if(a==='cancel'){const row=await tradeCancel(+b.dataset.id);banner(row?T('trade.back','+'+trdN(row.give_n)+' '+T('res.'+row.give_res)):T('trade.late'),C.chalk)}
    if(a==='yes'||a==='no'){const ok=await tradeAnswer(+b.dataset.id,a==='yes');banner(ok?T(a==='yes'?'trade.did':'trade.said'):T('trade.fail'),ok&&a==='yes'?C.gold:C.chalk)}
  }finally{if(net)TRADE.busy=false}
  if($('ovTrade').hidden)return;
  if(TRADE.mode==='inbox'&&!TRADE.inc.length)return tradeClose();
  tradeDraw();
});

// לבדיקה: מוסיף לשרת המדומה (cloud.js + visit.js) את טבלת ההצעות, עם אותם כללים כמו ה-RLS
function tradeFake(F){
  F.trades=[];F.tid=0;const base=F.req;
  F.req=(method,path,body,token)=>{
    if(!path.startsWith(TRD_PATH))return base(method,path,body,token);
    return new Promise((ok,no)=>{
      if(F.down)return no(new Error('offline'));if(F.noTrade)return no(new Error('cloud 404'));
      const me=String(token||'').slice(1);if(!me.startsWith('u'))return no(new Error('cloud 401'));
      F.calls.push(method+' '+TRD_PATH);
      const q=new URLSearchParams(path.split('?')[1]||''),cp=o=>JSON.parse(JSON.stringify(o));
      const id=+(q.get('id')||'').replace('eq.',''),st=(q.get('status')||'').replace('eq.',''),fr=(q.get('from_id')||'').replace('eq.','');
      const hit=t=>t.id===id&&(!st||t.status===st)&&(!fr||t.from_id===fr);
      if(method==='GET')return ok({status:200,json:F.trades.filter(t=>t.from_id===me||t.to_id===me).map(cp)});
      if(method==='POST'){const B=body||{},n=x=>Number.isInteger(x)&&x>=1&&x<=TRADE.maxN;
        if(!F.google[me]||B.from_id!==me||B.to_id===me||B.give_res===B.want_res||!n(B.give_n)||!n(B.want_n)||(B.status&&B.status!=='open')||
          F.trades.filter(t=>t.from_id===me&&t.status==='open').length>=TRADE.maxOpen)return no(new Error('cloud 403'));
        const t=Object.assign(cp(B),{id:++F.tid,status:'open'});F.trades.push(t);return ok({status:201,json:[cp(t)]})}
      if(method==='PATCH'){const B=body||{};if(Object.keys(B).some(k=>k!=='status'&&k!=='updated_at')||!['accepted','declined'].includes(B.status))return no(new Error('cloud 403'));
        const L=F.trades.filter(t=>hit(t)&&t.to_id===me&&t.status==='open');L.forEach(t=>Object.assign(t,B));return ok({status:200,json:L.map(cp)})}
      if(method==='DELETE'){const L=F.trades.filter(t=>hit(t)&&t.from_id===me);F.trades=F.trades.filter(t=>!L.includes(t));return ok({status:200,json:L.map(cp)})}
      no(new Error('cloud 405'));
    })};
  return F;
}
{const base=cloudFakeServer;cloudFakeServer=()=>tradeFake(base())}
