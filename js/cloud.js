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
  askXp:300,            // כניסה עם Google ממכשיר אחר: אם ההפרש ב-XP בין השמירה בטלפון לזו בחשבון גדול מזה, שואלים את השחקן איזו לשמור
  fake:null,            // בבדיקה: שרת מדומה בזיכרון במקום הרשת
  nav:u=>location.assign(u),   // מעבר לדף הכניסה של Google. בבדיקה מוחלף, כדי לא לעזוב את הדף
  // מה קורה עכשיו, בשביל הסמל במסך הפתיחה: off (לא מחובר, שמור בטלפון), sync (מסנכרן), ok (שמור בענן)
  status:'off',session:null,dirty:false,lastPush:0,timer:null,busy:null,pushes:0,pulls:0
};

// הסמל במסך הפתיחה, וכפתורי הכניסה: "כניסה עם Google" רק מכתובת אמיתית (לא מ-file://), ו"התנתקות" רק כשמחוברים
function cloudShow(st){CLOUD.status=st;const s=CLOUD.session,g=s&&s.name,e=document.getElementById('cloudLine');
  if(e){if(st==='ok'&&g){delete e.dataset.t;e.textContent=T('cloud.as',g)}else{e.dataset.t='cloud.'+st;e.textContent=T('cloud.'+st)}}
  const i=document.getElementById('cloudIn'),o=document.getElementById('cloudOut');
  if(i)i.hidden=!!g||!cloudHere();if(o)o.hidden=!g}

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
// name: השם או המייל בחשבון Google. משתמש זמני (בלי שם) הוא null
function cloudSess(j){if(!j||!j.access_token||!j.refresh_token||!j.user)throw new Error('cloud auth');
  const u=j.user,m=u.user_metadata||{};
  return{access:j.access_token,refresh:j.refresh_token,exp:Number(j.expires_at)||Math.floor(Date.now()/1000)+(Number(j.expires_in)||3600),uid:u.id,
    name:u.is_anonymous?null:(m.full_name||m.name||u.email||null)}}

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
  const d=await cloudRow(s);
  CLOUD.pulls++;
  const ov=document.getElementById('ovStart'),onStart=!ov||!ov.hidden;
  // לוקחים מהענן רק שמירה חדשה יותר, ורק לפני שהמשחק התחיל. אחרת השמירה בטלפון מנצחת ונדחפת מעליה
  if(isObj(d)&&(d.ts||0)>(SAVE.ts||0)&&onStart){cloudTake(d);return'took'}
  return d?'kept':'none';
})}
function cloudRow(s){return cloudReq('GET','/rest/v1/saves?select=data,updated_at&user_id=eq.'+s.uid,null,s.access).then(r=>r.json&&r.json[0]&&r.json[0].data)}
// לוקחים שמירה מהענן במקום זו שבטלפון. העותק הישן נשאר בצד (fh-save-bak), ליתר ביטחון
function cloudTake(d){try{localStorage.setItem(SAVE_STORE.key+'-bak',JSON.stringify(SAVE))}catch(e){}
  SAVE=saveMerge(saveBlank(),d);resMigrate(SAVE);SAVE.v=SAVE_VER;SAVE_STORE.write(SAVE,true)}

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
  try{let r='pushed';if(!pushOnly)r=await cloudPull();if(r!=='took'||CLOUD.dirty)await cloudPush();cloudShow('ok');if(typeof visitCloud==='function')visitCloud();return r}
  catch(e){cloudShow('off');return'offline'}
}

// כניסה עם Google (שלב 2). מחברים את המשתמש הזמני לחשבון Google (Manual linking ב-Supabase), וכך השמירה שלו נשארת בדיוק כמו שהיא.
// אם החיבור לא אפשרי (Google כבר שייך למשתמש אחר, למשל ממכשיר שני, או שהחיבור כבוי ב-Supabase): כניסה רגילה עם Google, ואז ממזגים.
// הדפדפן עובר לדף של Google וחוזר עם הטוקנים בכתובת (#access_token=...). לפני היציאה רושמים מי היינו (fh-cloud-go), כדי לדעת בחזרה אם זה אותו משתמש
function cloudHere(){return /^https?:$/.test(location.protocol)?location.origin+location.pathname:null}
async function cloudGoogle(plain){
  const back=cloudHere();if(!back&&!CLOUD.fake)return false;
  const to='redirect_to='+encodeURIComponent(back||'http://localhost/');
  cloudShow('sync');let s=null;
  try{s=await cloudAuth()}catch(e){}
  if(s&&!s.name&&!plain){
    try{const r=await cloudReq('GET','/auth/v1/user/identities/authorize?provider=google&skip_http_redirect=true&'+to,null,s.access);
      if(r.json&&r.json.url){cloudGo({mode:'link',uid:s.uid});CLOUD.nav(r.json.url);return'link'}}catch(e){}
  }
  cloudGo({mode:'plain',uid:s&&s.uid});CLOUD.nav(CLOUD.url+'/auth/v1/authorize?provider=google&'+to);return'plain';
}
function cloudGo(v){try{v?localStorage.setItem(CLOUD.lsKey+'-go',JSON.stringify(v)):localStorage.removeItem(CLOUD.lsKey+'-go')}catch(e){}}

// הכתובת שחוזרים אליה מ-Google: #access_token=...&refresh_token=...&expires_at=... או #error=...&error_code=...
function cloudHash(h){h=String(h||'').replace(/^#/,'');if(!/(^|&)(access_token|error)=/.test(h))return null;
  const o={};for(const kv of h.split('&')){const i=kv.indexOf('=');if(i>0)o[decodeURIComponent(kv.slice(0,i))]=decodeURIComponent(kv.slice(i+1).replace(/\+/g,' '))}return o}

// חזרה מ-Google. מחזיר null כשלא חזרנו משם (הפעלה רגילה)
async function cloudBack(h){
  const p=cloudHash(h!=null?h:location.hash);if(!p)return null;
  try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}   // מנקים את הטוקנים מהכתובת
  let prev=null;try{prev=JSON.parse(localStorage.getItem(CLOUD.lsKey+'-go'))}catch(e){}cloudGo(null);
  if(p.error){
    if(prev&&prev.mode==='link'){cloudGoogle(true);return'relink'}   // החיבור נכשל: מנסים כניסה רגילה
    cloudShow('off');return'error';
  }
  cloudShow('sync');
  try{
    const u=(await cloudReq('GET','/auth/v1/user',null,p.access_token)).json;
    cloudKeep(cloudSess(Object.assign({},p,{user:u})));
    if(prev&&prev.uid===CLOUD.session.uid){await cloudSync();return'linked'}   // אותו משתמש: אותה שמירה, ממשיכים רגיל
    const r=await cloudMergeIn();cloudShow('ok');return r;
  }catch(e){cloudShow('off');return'offline'}
}

// נכנסנו לחשבון Google שיש לו כבר שמירה משלו. טלפון חדש (בלי התקדמות) לוקח את השמירה מהחשבון.
// אחרת החדשה מנצחת, ואם הן שונות מאוד שואלים את השחקן. אף פעם לא מוחקים התקדמות בלי לשאול
async function cloudMergeIn(){
  const d=await cloudOnce(()=>cloudRow(CLOUD.session));
  let pick='phone';
  if(isObj(d)){
    const xp=o=>(o&&o.hero&&o.hero.xp)||0,blank=!xp(SAVE)&&!Object.keys(SAVE.bag||{}).length;
    if(blank)pick='cloud';
    else if(Math.abs(xp(SAVE)-xp(d))>CLOUD.askXp)pick=await cloudAsk(SAVE,d);
    else pick=(d.ts||0)>(SAVE.ts||0)?'cloud':'phone';
  }
  if(pick==='cloud')cloudTake(d);else await cloudPush();
  return pick;
}
// חלון שאלה: איזו שמירה לשמור. מחזיר 'phone' או 'cloud'
function cloudAsk(a,b){return new Promise(done=>{
  const ov=document.getElementById('ovCloud'),lv=o=>(o.hero&&o.hero.level)||1;
  if(!ov)return done((b.ts||0)>(a.ts||0)?'cloud':'phone');
  document.getElementById('cloudPhone').textContent=T('cloud.keepPhone',lv(a));
  document.getElementById('cloudAcct').textContent=T('cloud.keepCloud',lv(b));
  const end=v=>{ov.hidden=true;done(v)};
  document.getElementById('cloudPhone').onclick=()=>end('phone');document.getElementById('cloudAcct').onclick=()=>end('cloud');
  ov.hidden=false;
})}

// התנתקות: השמירה נשארת בטלפון, ובפעם הבאה הענן ממשיך עם משתמש זמני חדש
async function cloudSignOut(){
  const s=CLOUD.session;
  if(s)try{await cloudReq('POST','/auth/v1/logout?scope=local',null,s.access)}catch(e){}
  cloudKeep(null);cloudShow('off');
}

// שרת מדומה לבדיקה: כניסה, קריאה ודחיפה, בזיכרון
// google: משתמשים שכבר מחוברים ל-Google ({u1:'Nir'}). noLink: החיבור כבוי. back(uid): הכתובת שחוזרים איתה מ-Google
function cloudFakeServer(){const F={users:0,rows:{},down:false,google:{},noLink:false,calls:[],
  user(id){const g=F.google[id];return{id,is_anonymous:!g,email:g?id+'@test':'',user_metadata:g?{full_name:g}:{}}},
  back(id){return'#access_token=a'+id+'&refresh_token=r'+id+'&expires_in=3600&token_type=bearer'},
  req(method,path,body,token){return new Promise((ok,no)=>{
    if(F.down)return no(new Error('offline'));
    if(path.startsWith('/auth/v1/signup')||path.startsWith('/auth/v1/token')){const id='u'+(++F.users);return ok({status:200,json:{access_token:'a'+id,refresh_token:'r'+id,expires_in:3600,user:F.user(id)}})}
    const uid=String(token||'').slice(1);if(!uid.startsWith('u'))return no(new Error('cloud 401'));
    F.calls.push(method+' '+path.split('?')[0]);
    if(path.startsWith('/auth/v1/user/identities/authorize'))return F.noLink?no(new Error('cloud 404')):ok({status:200,json:{url:'https://accounts.google.test/?link='+uid}});
    if(path.startsWith('/auth/v1/user'))return ok({status:200,json:F.user(uid)});
    if(path.startsWith('/auth/v1/logout'))return ok({status:204,json:null});
    if(method==='GET'){const r=F.rows[uid];return ok({status:200,json:r?[JSON.parse(JSON.stringify(r))]:[]})}
    if(body.user_id!==uid)return no(new Error('cloud 403'));   // כמו RLS: רק השורה שלך
    F.rows[uid]={data:JSON.parse(JSON.stringify(body.data)),updated_at:body.updated_at};ok({status:201,json:null});
  })}};return F}

SAVE_STORE.onWrite=cloudMark;
// הטלפון עובר לרקע (סגרו את האפליקציה): דוחפים מיד מה שעוד לא נשלח
document.addEventListener('visibilitychange',()=>{if(document.hidden&&CLOUD.dirty){clearTimeout(CLOUD.timer);CLOUD.timer=null;cloudPush({keepalive:true}).catch(()=>{})}});
(()=>{const i=document.getElementById('cloudIn'),o=document.getElementById('cloudOut');if(i)i.onclick=()=>cloudGoogle();if(o)o.onclick=()=>cloudSignOut()})();
setTimeout(()=>{cloudShow('off');cloudBack().then(r=>r||cloudSync())},0);
