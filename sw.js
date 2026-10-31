/* Service worker: המשחק עובד גם בלי רשת כשהוא מותקן כאפליקציה (js/pwa.js רושם אותו, רק מ-http/https).
   תמיד קודם מהרשת, ורק כשאין רשת (או שהיא איטית מדי) מהעותק השמור. ככה כל עדכון שמתפרסם מגיע מיד.
   הגרסה מגיעה בכתובת (sw.js?v=<VERSION>): גרסה חדשה = service worker חדש, ששומר עותק חדש ומוחק את הישן. */
const VER=new URL(self.location).searchParams.get('v')||'dev';
const CACHE='fh-'+VER, WAIT=4000;   // כמה מילישניות מחכים לרשת לפני שעוברים לעותק השמור (אם יש)
const EXTRA=['./','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];

// התקנה: שומרים את כל מה ש-index.html טוען (סקריפטים, עיצוב), כדי שגם הפעם הראשונה בלי רשת תעבוד
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  const html=await (await fetch('./',{cache:'no-cache'})).text();
  const files=[...html.matchAll(/(?:src|href)="([^"#?:]+)"/g)].map(m=>m[1]).filter(f=>!f.startsWith('//'));
  await Promise.all([...new Set(EXTRA.concat(files))].map(f=>fetch(f,{cache:'no-cache'}).then(r=>r.ok&&c.put(f,r)).catch(()=>{})));
  await self.skipWaiting();
})()));

// גרסה חדשה נכנסה: מוחקים עותקים ישנים
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k.startsWith('fh-')&&k!==CACHE)await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==self.location.origin)return;   // פונטים, Supabase וכל השאר: כרגיל
  e.respondWith((async()=>{
    const c=await caches.open(CACHE),key=r.mode==='navigate'?'./':r;
    const old=await c.match(key,{ignoreSearch:r.mode==='navigate'});
    const net=fetch(r).then(res=>{if(res.ok&&res.type==='basic')c.put(key,res.clone());return res});
    if(!old)return net;
    const slow=new Promise(ok=>setTimeout(()=>ok(old),WAIT));
    return Promise.race([net.catch(()=>old),slow]);
  })());
});
