/* Dev tool: replay from scratch without losing progress (Nir, 9.11.2026). Next to ?level=30 (ranks.js, rankDevLevel).
   ?fresh=1   : once on load: backs up the current full save, then starts a brand-new save (saveBlank) and reloads.
   ?restore=1 : brings the backup back (the newest of phone and cloud) and reloads. The backup is kept, never auto-deleted.
   Settings: "Restore my old save" button (#devRestoreBtn), shown only while a backup exists.
   Where the backup lives (3 copies, normal sync can't lose it):
   - DEVSAVE.key in localStorage: its own key, SAVE_STORE never writes it.
   - SAVE.devBak inside the save itself, so every cloud push carries it in the same row (public.saves, no schema change),
     and every device that pulls the fresh save gets the backup with it.
   - The fresh save is marked SAVE.devFresh. ?fresh=1 again on a fresh save keeps the old backup (never backs up a fresh run over the real one).
   Safety: the backup is written and read back (deep compare) before anything else is touched. Any failure = abort, nothing changes.
   The fresh save gets a new ts, so cloudPull never brings the old save back over it (it only takes a newer ts). */
const DEVSAVE={
  key:'fh-save-fresh',   // localStorage key of the backup
  waitSync:10000,        // how long (ms) to wait for the startup cloud sync before acting
  reloadAfter:1600,      // ms to show the toast before reloading
  msgKey:'fh-devsave-msg'// sessionStorage: toast to show after the reload
};
const devClone=o=>JSON.parse(JSON.stringify(o));
const devSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// a save without the backup fields: what gets backed up and what the test compares
function devStrip(d){const c=devClone(d);delete c.devBak;delete c.devFresh;return c}
function devLocalBak(){try{const d=JSON.parse(localStorage.getItem(DEVSAVE.key));return isObj(d)?d:null}catch(e){return null}}
function devHasBak(){return isObj(SAVE.devBak)||!!devLocalBak()}

// the cloud row, only if signed in. null on any problem (offline is fine: the phone copy is enough)
async function devCloudRow(){if(typeof CLOUD==='undefined'||!CLOUD.session)return null;
  try{const d=await cloudOnce(()=>cloudRow(CLOUD.session));return isObj(d)?d:null}catch(e){return null}}
// write SAVE (new ts), check it really landed on the phone, push to the cloud and check the row. Returns {ok,cloud}
async function devCommit(check){
  saveNow();let ok=false;try{const r=JSON.parse(localStorage.getItem(SAVE_STORE.key));ok=devSame(r,SAVE)&&check(r)}catch(e){}
  if(!ok)return{ok:false};
  let cloud='off';
  if(typeof CLOUD!=='undefined'&&CLOUD.session){cloudHeld(false);   // we chose this save on purpose: don't wait for an older one
    try{clearTimeout(CLOUD.timer);CLOUD.timer=null;await cloudPush();const row=await devCloudRow();cloud=row&&row.ts===SAVE.ts&&check(row)?'ok':'fail'}catch(e){cloud='fail'}}
  return{ok:true,cloud}}

// ?fresh=1. Returns 'ok' | 'fail' (nothing changed)
async function devFresh(){
  const old=devClone(SAVE);
  let bak=null;
  if(SAVE.devFresh&&devHasBak()){   // already a fresh run: keep the real backup, just start over again
    const l=devLocalBak();bak=isObj(SAVE.devBak)&&(!l||(SAVE.devBak.ts||0)>=(l.ts||0))?SAVE.devBak:l}
  else{let src=SAVE;const row=await devCloudRow();   // the cloud is newer (played on another device): that is the real progress
    if(row&&!row.devFresh&&(row.ts||0)>(SAVE.ts||0))src=saveMerge(saveBlank(),row);
    bak=devStrip(src)}
  bak=devClone(bak);
  // 1. the backup on its own key, read back and compared. Fails: stop here
  try{localStorage.setItem(DEVSAVE.key,JSON.stringify(bak))}catch(e){}
  if(!devSame(devLocalBak(),bak))return'fail';
  // 2. the new save, carrying the backup
  const nw=saveBlank();nw.icons=devClone(SAVE.icons||nw.icons);nw.showHat=SAVE.showHat!==false;   // settings stay
  nw.devBak=bak;nw.devFresh=true;SAVE=nw;
  const r=await devCommit(d=>devSame(d.devBak,bak)&&d.devFresh===true);
  if(!r.ok){SAVE=old;SAVE_STORE.write(SAVE,true);return'fail'}
  return'ok'}

// ?restore=1 and the Settings button. Returns 'ok' | 'none' | 'fail'
async function devRestore(){
  const c=[SAVE.devBak,devLocalBak(),(await devCloudRow()||{}).devBak].filter(isObj);
  if(!c.length)return'none';
  const bak=devClone(c.reduce((a,b)=>(b.ts||0)>(a.ts||0)?b:a));
  const old=devClone(SAVE);
  try{localStorage.setItem(DEVSAVE.key,JSON.stringify(bak))}catch(e){}   // keep the backup (also refreshes the phone copy if the cloud one was newer)
  SAVE=saveMerge(saveBlank(),devClone(bak));resMigrate(SAVE);SAVE.v=SAVE_VER;SAVE.devBak=bak;delete SAVE.devFresh;
  const r=await devCommit(d=>devSame(d.devBak,bak)&&!d.devFresh);
  if(!r.ok){SAVE=old;SAVE_STORE.write(SAVE,true);return'fail'}
  return'ok'}

// a small toast that works everywhere (start screen too). Text in lang.js (dev.*)
function devToast(k){const e=document.createElement('div');e.className='devtoast';e.textContent=T(k);
  e.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:9999;background:#2a1d10;color:#ffd77a;border:2px solid #c9962e;border-radius:10px;padding:8px 16px;font:600 15px system-ui,sans-serif;pointer-events:none;max-width:90vw;text-align:center';
  document.body.appendChild(e);setTimeout(()=>e.remove(),4000)}
function devShow(){const b=document.getElementById('devRestoreBtn');if(b)b.hidden=!devHasBak()}
async function devRun(fn,okMsg){const r=await fn();
  if(r!=='ok'){devToast(r==='none'?'dev.none':'dev.fail');return r}
  try{sessionStorage.setItem(DEVSAVE.msgKey,okMsg)}catch(e){}
  devToast(okMsg);setTimeout(()=>location.reload(),DEVSAVE.reloadAfter);return r}

(()=>{
  try{const m=sessionStorage.getItem(DEVSAVE.msgKey);if(m){sessionStorage.removeItem(DEVSAVE.msgKey);setTimeout(()=>devToast(m),300)}}catch(e){}
  const b=document.getElementById('devRestoreBtn');
  if(b)b.onclick=()=>{if(confirm(T('dev.ask')))devRun(devRestore,'dev.restored')};
  devShow();
  const q=location.search,f=/[?&]fresh=1/.test(q),r=/[?&]restore=1/.test(q);if(!f&&!r)return;
  // the URL loses the parameter right away, so a reload never runs it twice
  try{const u=new URLSearchParams(q);u.delete('fresh');u.delete('restore');const s=u.toString();history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash)}catch(e){}
  // wait for the startup cloud sync (it may take a newer save from the cloud), then act
  const t0=Date.now();(function wait(){
    if(typeof CLOUD!=='undefined'&&(CLOUD.status==='sync'||!CLOUD.pulls&&CLOUD.status!=='off')&&Date.now()-t0<DEVSAVE.waitSync)return setTimeout(wait,200);
    if(typeof CLOUD!=='undefined'&&CLOUD.status==='off'&&!CLOUD.pulls&&Date.now()-t0<1500)return setTimeout(wait,200);   // sync not started yet
    r?devRun(devRestore,'dev.restored'):devRun(devFresh,'dev.fresh')})();
})();
