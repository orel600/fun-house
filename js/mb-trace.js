/* משחקי השאול: הקלטת תקיפות במשחק אמיתי (MBTRACE, השיפוץ, BOB, 10.11.2026, הבקשה של NOVA). נתונים בלבד: לא מצייר ולא משנה שום דבר במשחק.
   כבוי כברירת מחדל. ?mbtrace=1 מדליק. בונה על MBBLADE (mb-blade.js): בכל פריים מצויר, לכל גיבור עם נשק מקרוב (הטנק, הלוחם, המתנקש),
   בסיס הנשק וקצהו בעולם ובמסך (פיקסלים), הקליפ והזמן שלו, השלב (hit, settle, recover), והעוגן של המטרה (רגליים וראש, בעולם ובמסך).
   ובכל צעד של המשחק: תקיפה (atkT), סקיל (mbCast), טעינה (cd) שמתחילה ונגמרת, ונזק אמיתי (חיים לפני ואחרי, mbDmg).
   שני שעונים: sim (MB.t, צעדי המשחק) ו-now (performance.now, הציור). 60 בשנייה הוא בקשה: הקצב שנמדד באמת נכתב ב-MBTRACE.rate().
   שימוש: MBTRACE.dump() מחזיר {meta, ticks, frames, events}. מחיקה: הקובץ והשורה ב-index.html */
const MBTRACE={
  on:/[?&]mbtrace=1(&|$)/.test(location.search),
  kits:{tank:1,warrior:1,assassin:1},
  max:{frames:20000,events:20000,ticks:40000},
  match:null,seq:0,ticks:[],frames:[],events:[],
  stat:{frames:0,ticks:0,events:0,dropped:0}
};
(function(){
  const X=MBTRACE;if(!X.on)return;
  const id=u=>u?(u.trId||(u.trId=u.id!=null?u.id:'x'+(++X.seq))):0,now=()=>+performance.now().toFixed(2),simT=()=>typeof MB!=='undefined'&&MB?+MB.t.toFixed(4):null;
  const push=(L,v,m)=>{if(L.length>=m){X.stat.dropped++;return}L.push(v)};
  const ev=(k,o)=>{X.stat.events++;push(X.events,Object.assign({k,sim:simT(),now:now()},o),X.max.events)};
  const traced=u=>u&&u.k==='hero'&&X.kits[u.kit];
  const unitInfo=u=>({id:id(u),k:u.k,kit:u.kit||u.type||null,team:u.team,me:!!u.me,r:u.r});
  // מסך: נקודה בעולם -> פיקסלים (CSS) של הקנבס התלת-ממדי
  const proj=(x,y,z)=>{const v=new THREE.Vector3(x,y,z).project(R3D.cam),w=innerWidth,h=innerHeight;return [+((v.x+1)/2*w).toFixed(1),+((1-v.y)/2*h).toFixed(1)]};
  const anchor=t=>{if(!t)return null;const s=SIN(),c=COS(),L=typeof lookOf==='function'?(t.me&&R3D.player?R3D.player.L:lookOf(t)):null,hh=L&&L.h?L.h:t.r*2,z=t.y/s;
    return {id:id(t),game:[+t.x.toFixed(1),+t.y.toFixed(1)],r:t.r,h:hh,foot:proj(t.x,0,z),head:proj(t.x,hh/c,z)}};
  // התחלת משחק: מזהה חדש, ומאפסים
  if(typeof mobaStart==='function'){const b=mobaStart;mobaStart=function(kit){const r=b.apply(this,arguments);
    X.match=Date.now().toString(36)+'-'+Math.floor(Math.random()*1e6).toString(36);X.seq=0;X.ticks=[];X.frames=[];X.events=[];
    for(const u of MB.u)id(u);ev('start',{match:X.match,kit,units:MB.u.filter(u=>u.k==='hero').map(unitInfo)});return r}}
  // צעד משחק: מה השתנה (תקיפה, טעינות)
  if(typeof mobaUpdate==='function'){const b=mobaUpdate;mobaUpdate=function(dt){
    const M=typeof MB!=='undefined'&&MB;if(!M||!S.mb)return b.apply(this,arguments);
    const pre=new Map();for(const u of M.u)if(traced(u))pre.set(u,{atk:u.atkT||0,cd:Object.assign({},u.cd),dead:u.dead});
    const r=b.apply(this,arguments);X.stat.ticks++;push(X.ticks,[simT(),now(),+(+dt).toFixed(4)],X.max.ticks);
    for(const [u,p] of pre){
      if((u.atkT||0)>p.atk+0.05)ev('atk',{u:id(u),kit:u.kit,cd:+u.atkT.toFixed(3),tgt:id(u.trTgt),aim:u.aim!=null?+u.aim.toFixed(3):null});
      for(const k in u.cd){const a=p.cd[k]||0,c=u.cd[k]||0;if(c>a+0.05)ev('cd+',{u:id(u),slot:k,cd:+c.toFixed(3)});else if(a>0&&c<=0)ev('cd0',{u:id(u),slot:k})}
      if(u.dead!==p.dead)ev(u.dead?'die':'back',{u:id(u)})}
    return r}}
  // המטרה של התקיפה הרגילה (בשביל העוגן), בלי לשנות כלום
  if(typeof mbAttack==='function'){const b=mbAttack;mbAttack=function(u,dt,t){if(traced(u)&&t)u.trTgt=t;return b.apply(this,arguments)}}
  if(typeof mbCast==='function'){const b=mbCast;mbCast=function(u,slot,aim){const r=b.apply(this,arguments);
    if(traced(u)){const s=MBKIT[u.kit]&&MBKIT[u.kit][slot];ev('cast',{u:id(u),kit:u.kit,slot,skill:s&&s.id||null,ok:!!r,aim:aim?[+(+aim.x).toFixed(1),+(+aim.y).toFixed(1)]:null})}return r}}
  // נזק אמיתי: החיים לפני ואחרי (כולל שריון, מגן וכל מה ש-mbDmg עושה)
  if(typeof mbDmg==='function'){const b=mbDmg;mbDmg=function(src,t,d,dt){
    if(!(traced(src)||traced(t)))return b.apply(this,arguments);const h0=t?t.hp:null,r=b.apply(this,arguments);
    ev('dmg',{src:id(src),srcKit:src&&src.kit||null,tgt:id(t),tgtK:t&&t.k,tgtKit:t&&(t.kit||t.type)||null,want:+(+d).toFixed(2),type:dt||null,hp0:h0!=null?+h0.toFixed(2):null,hp1:t?+t.hp.toFixed(2):null,
      tgtGame:t?[+t.x.toFixed(1),+t.y.toFixed(1)]:null});return r}}
  // פריים מצויר: אחרי ש-render3d סיים (כל הגופים, ה-mixer והציור), דגימה לכל גיבור מקרוב שעל המסך
  if(typeof render3d==='function'){const b=render3d;render3d=function(){const r=b.apply(this,arguments);
    try{if(!S.mb||typeof MB==='undefined'||!MB||!R3D.on||!R3D.cam)return r;const t=now(),rows=[];
      for(const u of MB.u){if(!traced(u)||u.dead)continue;const a=u.me?R3D.player:R3D.actors.get(u);if(!a||a.seen!==R3D.frame&&!u.me)continue;
        const s=typeof mbBladeSample==='function'?mbBladeSample(u,a):null;if(!s)continue;const st=a.mbA||{},x=st.x,C=typeof MBATK3D!=='undefined'&&MBATK3D.kit[u.kit]||{};
        rows.push({u:id(u),kit:u.kit,game:[+u.x.toFixed(1),+u.y.toFixed(1)],base:s.base,tip:s.tip,baseScr:proj(...s.base),tipScr:proj(...s.tip),
          clip:s.clip,ct:s.ct,ph:st.ph||'',w:x?+x.getEffectiveWeight().toFixed(3):null,ts:x?+x.timeScale.toFixed(3):null,
          cfg:{from:C.from,to:C.to,dur:C.dur,settle:C.settle,skip:typeof MBATK3D!=='undefined'&&MBATK3D.slash[u.kit]?MBATK3D.slash[u.kit].skip:null},
          atkT:+(u.atkT||0).toFixed(3),tgt:anchor(u.trTgt&&!u.trTgt.dead?u.trTgt:null)})}
      if(rows.length){X.stat.frames++;push(X.frames,{f:R3D.frame,sim:simT(),now:t,rows},X.max.frames)}}catch(e){}
    return r}}
  // הקצב שנמדד באמת: צעדי משחק וציורים בשנייה, לפי now
  X.rate=()=>{const T=X.ticks,F=X.frames,sp=(L,g)=>L.length>1?+((L.length-1)/((g(L[L.length-1])-g(L[0]))/1000)).toFixed(1):null;return {ticksPerSec:sp(T,q=>q[1]),tracedFramesPerSec:sp(F,q=>q.now)}};
  X.dump=()=>({meta:{match:X.match,url:location.href,ua:navigator.userAgent,dpr:devicePixelRatio,w:innerWidth,h:innerHeight,camTilt:typeof camTilt==="function"?camTilt():null,sin:SIN(),cos:COS(),
    compact:typeof MBCOMPACT!=="undefined"?{raw:MBCOMPACT.raw,on:typeof mbCompactOn==="function"?!!mbCompactOn():null,visualScale:MBCOMPACT.visualScale}:null,rate:X.rate(),stat:X.stat,units:typeof MB!=='undefined'&&MB?MB.u.filter(u=>u.trId).map(unitInfo):[]},
    ticks:X.ticks,frames:X.frames,events:X.events});
})();
