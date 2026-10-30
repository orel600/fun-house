/* שמירה בענן (Supabase), שלב 1: כניסה זמנית בלי שם, וגיבוי של SAVE בענן.
   השמירה בטלפון נשארת המקור בזמן משחק: מיידית, ועובדת גם בלי אינטרנט. הענן רק מקבל עותק ברקע.
   בהפעלה: מושכים מהענן, ואם השמירה שם חדשה יותר (SAVE.ts) לוקחים אותה, רק כל עוד מסך הפתיחה פתוח.
   בלי אינטרנט או בשגיאה: שקט, והמשחק ממשיך כרגיל. בלי ES modules ובלי supabase-js, כדי שירוץ גם מ-file://.
   הטבלה: public.saves (user_id, data, updated_at), וכל משתמש רואה וכותב רק את השורה שלו (RLS).
   הבדיקה: CLOUD.fake מחליף את השרת בזיכרון (cloudFakeServer), כדי שהבוט לא יהיה תלוי ברשת. */
const CLOUD={
  url:'https://yucbzntldpwvjqnyfdcf.supabase.co',
  key:'sb_publishable_1DRHbwtyGm6Ke0GVvtWiNQ_gwSkAomG',   // מפתח ציבורי, מיועד להיות בקוד
  lsKey:'fh-cloud',     // איפה נשמרת הכניסה (טוקנים) בטלפון
  pushEvery:20,         // לכל היותר דחיפה אחת לענן בכל כמה שניות
  pushDelay:3,          // כמה שניות מחכים אחרי שמירה, כדי לאסוף כמה שמירות לדחיפה אחת
  timeout:8000,         // אחרי כמה מילישניות בקשה נחשבת כושלת
  fake:null,            // בבדיקה: שרת מדומה בזיכרון במקום הרשת
  // מה קורה עכשיו, בשביל הסמל במסך הפתיחה: off (לא מחובר, שמור בטלפון), sync (מסנכרן), ok (שמור בענן)
  status:'off',session:null,dirty:false,lastPush:0,timer:null,busy:null,pushes:0,pulls:0
};

function cloudShow(st){CLOUD.status=st;const e=document.getElementById('cloudLine');if(e){e.dataset.t='cloud.'+st;e.textContent=T('cloud.'+st)}}

// בקשה אחת לשרת. מחזירה {status,json}, ובכל תקלה זורקת שגיאה
async function cloudReq(method,path,body,token,extra){
  if(CLOUD.fake)return CLOUD.fake.req(method,path,body,token);
  const ctl=typeof AbortController!=='undefined'?new AbortController():null,t=ctl&&setTimeout(()=>ctl.abort(),CLOUD.timeout);
  try{
    const r=await fetch(CLOUD.url+path,{method,signal:ctl&&ctl.signal,keepalive:!!(extra&&extra.keepalive),
      headers:Object.assign({apikey:CLOUD.key,'Content-Type':'application/json',Authorization:'Bearer '+(token||CLOUD.key)},extra&&extra.headers),
      body:body?JSON.stringify(body):undefined});
    const txt=await r.text();const json=txt?JSON.parse(txt):null;
    if(!r.ok)throw new Error('cloud '+r.status);
    return{status:r.status,json}
  }finally{if(t)clearTimeout(t)}
}

function cloudKeep(s){CLOUD.session=s;try{s?localStorage.setItem(CLOUD.lsKey,JSON.stringify(s)):localStorage.removeItem(CLOUD.lsKey)}catch(e){}}
function cloudSess(j){if(!j||!j.access_token||!j.refresh_token||!j.user)throw new Error('cloud auth');
  return{access:j.access_token,refresh:j.refresh_token,exp:j.expires_at||Math.floor(Date.now()/1000)+(j.expires_in||3600),uid:j.user.id}}

// טוקן בתוקף: כניסה זמנית בפעם הראשונה, ורענון כשהטוקן עומד לפוג
async function cloudAuth(){
  let s=CLOUD.session;
  if(!s){try{s=JSON.parse(localStorage.getItem(CLOUD.lsKey))}catch(e){s=null}}
  if(s&&s.exp-60>Date.now()/1000){CLOUD.session=s;return s}
  if(s&&s.refresh){
    try{s=cloudSess((await cloudReq('POST','/auth/v1/token?grant_type=refresh_token',{refresh_token:s.refresh})).json);cloudKeep(s);return s}
    catch(e){if(!/cloud 4/.test(e.message))throw e}   // רק טוקן שנדחה (4xx) מוביל לכניסה חדשה. בלי רשת שומרים את הכניסה הישנה
  }
  s=cloudSess((await cloudReq('POST','/auth/v1/signup',{})).json);cloudKeep(s);return s;
}

// בקשה אחת בכל פעם, כדי ששני רענונים של טוקן לא יתנגשו
function cloudOnce(fn){const p=(CLOUD.busy||Promise.resolve()).then(fn,fn);CLOUD.busy=p.catch(()=>{});return p}

function cloudPull(){return cloudOnce(async()=>{
  const s=await cloudAuth();
  const r=await cloudReq('GET','/rest/v1/saves?select=data,updated_at&user_id=eq.'+s.uid,null,s.access);
  CLOUD.pulls++;
  const d=r.json&&r.json[0]&&r.json[0].data;
  const ov=document.getElementById('ovStart'),onStart=!ov||!ov.hidden;
  // לוקחים מהענן רק שמירה חדשה יותר, ורק לפני שהמשחק התחיל. אחרת השמירה בטלפון מנצחת ונדחפת מעליה
  if(isObj(d)&&(d.ts||0)>(SAVE.ts||0)&&onStart){SAVE=saveMerge(saveBlank(),d);resMigrate(SAVE);SAVE.v=SAVE_VER;SAVE_STORE.write(SAVE,true);return'took'}
  return d?'kept':'none';
})}

function cloudPush(opt){return cloudOnce(async()=>{
  const s=await cloudAuth();CLOUD.dirty=false;CLOUD.lastPush=Date.now();
  await cloudReq('POST','/rest/v1/saves?on_conflict=user_id',{user_id:s.uid,data:SAVE,updated_at:new Date(SAVE.ts||Date.now()).toISOString()},s.access,
    {keepalive:opt&&opt.keepalive,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
  CLOUD.pushes++;
})}

// משהו נשמר בטלפון: דוחפים לענן בעוד כמה שניות, ולא יותר מפעם ב-pushEvery
function cloudMark(){
  CLOUD.dirty=true;if(CLOUD.timer)return;
  const wait=Math.max(CLOUD.pushDelay*1000,CLOUD.lastPush+CLOUD.pushEvery*1000-Date.now());
  CLOUD.timer=setTimeout(()=>{CLOUD.timer=null;if(CLOUD.dirty)cloudSync(true)},wait);
}

// סנכרון: בהפעלה מושכים ואז דוחפים, ובזמן משחק רק דוחפים. כל תקלה = "לא מחובר", בשקט
async function cloudSync(pushOnly){
  cloudShow('sync');
  try{let r='pushed';if(!pushOnly)r=await cloudPull();if(r!=='took'||CLOUD.dirty)await cloudPush();cloudShow('ok');return r}
  catch(e){cloudShow('off');return'offline'}
}

// כניסה עם Google (שלב 2, עוד לא בנוי). כשאוראל מפעיל את Google ב-Supabase
// (Authentication ← Providers ← Google, וגם Manual linking), מחברים את המשתמש הזמני לחשבון Google, וכל המכשירים רואים את אותה שמירה:
// GET /auth/v1/user/identities/authorize?provider=google&redirect_to=<כתובת המשחק> עם הטוקן, ושולחים את הדפדפן ל-url שחוזר.
// בחזרה, הטוקנים מגיעים בכתובת (#access_token=...), ושומרים אותם עם cloudKeep. כניסה ממכשיר שני: /auth/v1/authorize?provider=google
function cloudLinkGoogle(){return false}

// שרת מדומה לבדיקה: כניסה, קריאה ודחיפה, בזיכרון
function cloudFakeServer(){const F={users:0,rows:{},down:false,
  req(method,path,body,token){return new Promise((ok,no)=>{
    if(F.down)return no(new Error('offline'));
    if(path.startsWith('/auth/v1/signup')||path.startsWith('/auth/v1/token')){const id='u'+(++F.users);return ok({status:200,json:{access_token:'a'+id,refresh_token:'r'+id,expires_in:3600,user:{id}}})}
    const uid=String(token||'').slice(1);if(!uid.startsWith('u'))return no(new Error('cloud 401'));
    if(method==='GET'){const r=F.rows[uid];return ok({status:200,json:r?[JSON.parse(JSON.stringify(r))]:[]})}
    if(body.user_id!==uid)return no(new Error('cloud 403'));   // כמו RLS: רק השורה שלך
    F.rows[uid]={data:JSON.parse(JSON.stringify(body.data)),updated_at:body.updated_at};ok({status:201,json:null});
  })}};return F}

SAVE_STORE.onWrite=cloudMark;
// הטלפון עובר לרקע (סגרו את האפליקציה): דוחפים מיד מה שעוד לא נשלח
document.addEventListener('visibilitychange',()=>{if(document.hidden&&CLOUD.dirty){clearTimeout(CLOUD.timer);CLOUD.timer=null;cloudPush({keepalive:true}).catch(()=>{})}});
setTimeout(()=>{cloudShow('off');cloudSync()},0);
