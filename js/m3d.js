/* מודלים לפי צורך (perf/lazy-models, 7.11.2026, הביקורות של 6.11: "11MB של מודלים נטענים ומפוענחים כולם בפתיחה").
   js/models3d.js מחזיק רק את הליבה: הגיבורים, האויבים הרגילים, הכפר, הטבע, הנשקים והאנימציות. init3d מפענח אותה בפתיחה כמו קודם.
   מה שלא צריך בפתיחה יושב בקובץ משלו, js/m3d/<מפתח>.js (הרשימה ב-M3D_LAZY, ומי בחוץ ב-tools/models3d-io.js):
   מפלצות הזירה והענקים (mon_), חפצים עם מודל משלהם (w_item_), הדמויות האישיות וחיות המחמד.
   קובץ נטען בתגית <script> שמוסיפים לדף, ולא ב-fetch, כי המשחק נפתח גם מ-file://.
   מתי נטען:
   - כשצריך אותו עכשיו (m3dNeed): הגיבור, חיית המחמד, הנשק ביד, אויב על המסך. עד שהוא מוכן מציירים משהו אחר לרגע:
     הגיבור של המחלקה במקום הדמות האישית, הנשק הרגיל במקום החפץ, ואויב או חיה בלי גוף בתלת-ממד (הטבעת והצל בקנבס נשארים).
   - ברקע, אחד אחד (m3dHint): בכניסה לאזור, הענק של האזור ואז מפלצות הזירה (שהשער אליה בעולם). כך אין קפיצה בשער.
   - הורדה בלבד, ברקע (idle): אחרי כמה שניות, כל שאר הקבצים אחד אחרי השני, בלי לפענח. כך גם בלי רשת הכל כבר בטלפון.
   ?m3dIdle=0 מכבה את ההורדה ברקע (למדידה ולבדיקה). מחובר ב-render3d.js: init3d, heroLook, itemModel, syncEnemy, crowdOf, syncPet, wldWarm ו-render3d */
const M3D={
  arena:['slime','mushnub','goleling','ghost','yeti','demon'],   // אויבי הזירה (spawn.js, arenas.js, run.js): מפתחות ב-LOOK3D
  idle:{on:!/[?&]m3dIdle=0/.test(location.search),after:8,gap:250},   // after: שניות אחרי שהתלת-ממד עלה. gap: מילישניות בין קובץ לקובץ (ובין פענוח לפענוח ברקע)
  st:{},p:{},files:{},hint:[],busy:0,next:0,v:0,hv:0,log:[]   // st: 'ready' או 'fail'. v: עולה כשנוסף מודל, כדי שמי ששומר מראה (heroLook) יבנה מחדש. log: מה נטען ומתי (לבדיקה)
};
M3D.boot=new Promise(r=>{M3D.booted=r});   // הליבה מפוענחת (סוף init3d). מודל מבחוץ מפוענח רק אחריה
const m3dLazy=k=>typeof M3D_LAZY!=='undefined'&&!!k&&k in M3D_LAZY;
const m3dDeps=k=>/^mon_/.test(k)&&m3dLazy('anim_'+k)?['anim_'+k,k]:[k];   // מפלצת צריכה גם את האנימציות שלה, לפניה
// הקובץ קורא לזה כשהוא נטען
function m3dPut(k,b64){MODELS3D[k]=b64}
function m3dFile(k){
  if(MODELS3D[k])return Promise.resolve();
  return M3D.files[k]||(M3D.files[k]=new Promise((ok,bad)=>{const s=document.createElement('script');
    s.src='js/m3d/'+k+'.js'+(/^http/.test(location.protocol)?'?v='+VERSION:'');   // כמו שאר הסקריפטים בפרסום (deploy.yml): גרסה חדשה = כתובת חדשה
    s.onload=()=>MODELS3D[k]?ok():bad(new Error('ריק'));s.onerror=()=>{delete M3D.files[k];bad(new Error('לא נטען'))};document.head.appendChild(s)}));
}
// מוכן לציור? מה שלא בחוץ (ליבה, או מפתח שלא קיים) תמיד מוכן
const m3dReady=k=>!m3dLazy(k)||M3D.st[k]==='ready';
// צריך אותו עכשיו: אם לא מוכן, מתחיל להוריד ולפענח, ומחזיר false. מי שקרא מצייר בינתיים משהו אחר
function m3dNeed(k){if(m3dReady(k))return true;if(R3D.ready||R3D.loading)m3dGo(k);return false}   // בדו-ממד לא מורידים כלום
function m3dGo(k){
  if(!m3dLazy(k))return Promise.resolve();
  return M3D.p[k]||(M3D.p[k]=(async()=>{
    const t0=performance.now(),ks=m3dDeps(k);
    await Promise.all(ks.map(m3dFile));await M3D.boot;
    if(!R3D.ready)throw new Error('אין תלת-ממד');
    for(const q of ks)if(M3D.st[q]!=='ready'){m3dDecode(q,await parseGLB(q));M3D.st[q]='ready'}
    M3D.v++;M3D.log.push({k,at:Math.round(t0),ms:Math.round(performance.now()-t0),where:S.vil?'vil':S.wd?S.wd.reg:'arena'});
  })().catch(e=>{M3D.st[k]='fail';if(R3D.ready)console.warn('מודל חסר (missing model):',k,e&&e.message)}));
}
// אותו עיבוד כמו בפתיחה (init3d): אנימציות, חפץ, או דמות
function m3dDecode(k,g){
  if(k.startsWith('anim_'))addClips(g);
  else if(k.startsWith('w_item_')){lambert(g.scene);R3D.props[k]=g.scene;M3D.hv++}   // hv: חפץ (גם מגן) מוכן, הגיבור נבנה מחדש (heroLook). רק כאן: בנייה מחדש בלי צורך מבלבלת את השריון (armor3d)
  else{R3D.tmpl[k]=g.scene;prepTmpl(k)}   // דמות אישית: heroLook רואה לבד שהמודל המוצג התחלף. חיה ומפלצת לא נוגעות בגיבור
}
// ברקע, אחד אחד, בסדר שביקשו
function m3dHint(ks){for(const k of ks)if(m3dLazy(k)&&!m3dReady(k)&&!M3D.hint.includes(k))M3D.hint.push(k)}
// בכניסה לאזור (wldWarm): הענק של האזור, ואז מפלצות הזירה
function m3dWorld(reg){
  const ks=[];if(typeof STORY!=='undefined')for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===reg&&LOOK3D['wb_'+k])ks.push(LOOK3D['wb_'+k].model);
  for(const t of M3D.arena)if(LOOK3D[t])ks.push(LOOK3D[t].model);
  m3dHint(ks);
}
// מה שכבר ידוע בפתיחה: הדמות האישית, חיית המחמד והחפצים שלבושים. רק מורידים, והפענוח אחרי הליבה
function m3dBoot(){
  const ks=[];if(PILOT3D)ks.push('pilotHero');
  if(typeof SAVE!=='undefined'&&SAVE){
    const sk=typeof heroSkin==='function'&&heroSkin(),L=sk&&typeof HEROES!=='undefined'&&HEROES.skins[sk]&&LOOK3D[HEROES.skins[sk].look];if(L)ks.push(L.model);
    const pk='pet_'+(SAVE.pet&&SAVE.pet.kind||(typeof PET!=='undefined'?PET.default:'piocho')),st=SAVE.pet&&SAVE.pet.stage||0,pt=LOOK3D[pk+(st+1)],nx=LOOK3D[pk+(st+2)];if(pt)ks.push(pt.model);
    if(nx)M3D.boot.then(()=>m3dHint([nx.model]));   // השלב הבא של החיה: ברקע, כדי שבעלייה בשלב היא לא תיעלם לרגע
    for(const s in SAVE.gear||{}){const id=SAVE.gear[s];if(typeof id==='string')ks.push('w_item_'+(typeof gBase==='function'?gBase(id):id))}
  }
  M3D.bootKs=ks.filter(m3dLazy);for(const k of M3D.bootKs)m3dGo(k);   // bootKs: לבדיקה (tools/check.js)
}
// כל פריים (render3d): הזירה מבקשת את המפלצות שלה, רמז אחד ברקע, והורדה ברקע
function m3dTick(){
  if(!R3D.ready)return;
  if(S.mode==='play'&&!S.vil&&!S.wd&&!S.room&&!S.mb)for(const t of M3D.arena){const L=LOOK3D[t];if(L)m3dNeed(L.model)}   // בזירה: עכשיו
  const now=performance.now();if(M3D.busy||now<M3D.next)return;
  const done=()=>{M3D.busy=0;M3D.next=performance.now()+M3D.idle.gap};
  while(M3D.hint.length&&m3dReady(M3D.hint[0]))M3D.hint.shift();
  if(M3D.hint.length){M3D.busy=1;m3dGo(M3D.hint.shift()).finally(done);return}
  if(!M3D.idle.on)return;
  M3D.t0=M3D.t0||now;if(now-M3D.t0<M3D.idle.after*1000)return;
  const k=Object.keys(M3D_LAZY).find(k=>!MODELS3D[k]&&!M3D.files[k]);if(!k)return;
  M3D.busy=1;m3dFile(k).catch(()=>{}).finally(done);
}
// כמה בקשות עוד בדרך (לבדיקה)
M3D.pending=()=>Object.keys(M3D.p).filter(k=>!M3D.st[k]).length;
