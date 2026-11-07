/* שמות ואופי לאויבים בעולם (ניר, 2.11.2026: "צריך שמות מיוחדים לאויבים, והמשחק צריך יותר אופי ופחות גנרי").
   1. לכל סוג אויב בעולם שם ומשפט אופי (lang.js: 'fl.<סוג>' = [שם, משפט, מה הוא אומר כשהוא מזהה אותך...]).
      לאויב הקרוב שנלחם בך: השם מעל הראש. לעלית, למבוקש ולמבוקש היום: שם אישי מחולל (שם + כינוי, flPersonal).
   2. פגישה ראשונה: פס דק למעלה במרכז, מתחת ל-HUD (אייקון, שם, משפט בשורה אחת), שנסגר לבד, לא חוסם מגע ולא עוצר. החולשה והפרטים בספר. נשמר ב-SAVE.lore.met, והמשפט מופיע גם בספר (book.js).
   3. בועה מעל הראש, נדירה: כשאויב מזהה אותך, כשהוא כמעט נופל, ועלית או שומר כשהם מופיעים. אחת בכל פעם.
   רק בעולם. בזירה (של אוראל) לא משתנה כלום. החיבור: foeLoreUpdate ו-foeLoreScreen ב-world.js, flPersonal ב-hunt.js וב-wanted.js, flLine ב-book.js */
const FOELORE={
  // הסוגים שיש להם שם ואופי (כל מי שמסתובב בעולם), ואייקון לכרטיס
  list:{grunt:'💀',shield:'🛡️',wisp:'👻',treant:'🌳',golem:'🗿',crawler:'🦂',sprite:'🧚',
    drowned:'⚓',mistling:'🌫️',rimeknight:'❄️',frostwraith:'🧣',cinderscorp:'🦂',flamewisp:'🔥',
    stormknight:'⚡',sparkwisp:'✨',shadeknight:'🌑',shadewisp:'🕯️'},
  card:{dur:3.5},                        // שניות שהפס של פגישה ראשונה נשאר (ניר, 3.11: הכרטיס הגדול הסתיר את המסך). כמה חדשים יחד: אחד אחרי השני
  say:{chance:0.3, cd:9, dur:2.6},       // בועה: הסיכוי כשאויב מזהה אותך, כמה שניות לפחות בין בועות, וכמה זמן היא נשארת
  lowAt:0.25,                            // מתחת לכמה חיים אויב אומר משהו של בורח
  near:220,                              // השם מעל הראש: רק לאויב הקרוב ביותר עד המרחק הזה
  label:{size:11, col:'#E8E4D8', elite:'#F4C74F'}, // גודל במסך (לא מתכווץ עם המצלמה), וצבעים: רגיל ושם אישי
  bubble:{size:12, w:200}                // גודל הטקסט בבועה ורוחב מרבי
};

const flHas=k=>!!FOELORE.list[k]&&!!TEXT['fl.'+k];
const flName=k=>flHas(k)?T('fl.'+k)[0]:null;
const flLine=k=>flHas(k)?T('fl.'+k)[1]:null;
// שם אישי: n מספר כלשהו (גם hash), ותמיד יוצא אותו שם לאותו n. kind: 'thief' לגנבי הרסיסים (המבוקש)
function flPersonal(n,kind){
  const a=T('fl.first'),b=T(kind==='thief'?'fl.thiefEp':'fl.ep');n=Math.abs(Math.floor(n))||0;
  return a[n%a.length]+' '+b[Math.floor(n/a.length)%b.length];
}
const flRnd=()=>Math.floor(Math.random()*1e6);
const flElite=e=>e.leader||e.affix||e.champ;
const flLore=()=>SAVE.lore||(SAVE.lore={met:{}});

/* ---- כל פריים בעולם (worldUpdate) ---- */
function foeLoreUpdate(dt){
  const w=S.wd;if(!w)return;const F=FOELORE;
  w.flCd=(w.flCd||0)-dt;
  if(w.flSay&&((w.flSay.t-=dt)<=0||w.flSay.e.dead))w.flSay=null;
  flCardTick(dt);
  for(const e of enemies){
    if(e.dead)continue;
    const d=Math.hypot(P.x-e.x,P.y-e.y);
    if(!e.flSeen&&d<WORLD.aggro){
      e.flSeen=1;
      if(flElite(e)&&!e.pname)e.pname=flPersonal(flRnd());
      if(flHas(e.type)&&!e.wanted&&!e.warden)flMeet(e.type);
      if(e.warden)flSay(e,pick(T('fl.say.warden')),true);
      else if(e.wanted)flSay(e,pick(T('fl.say.thief')),true);
      else if(e.pname)flSay(e,T('fl.say.elite',e.pname),true);
      else if(flHas(e.type))flSay(e,pick(T('fl.'+e.type).slice(2)));
    }
    if(!e.flLow&&e.max&&e.hp<e.max*F.lowAt&&d<WORLD.aggro*1.5&&!e.warden){e.flLow=1;flSay(e,pick(T('fl.say.flee')))}
  }
}
// force: עלית, שומר ומבוקש מדברים תמיד, ומחליפים בועה קיימת
function flSay(e,txt,force){
  const w=S.wd,F=FOELORE.say;if(!w||!txt)return;
  if(!force&&(w.flSay||w.flCd>0||Math.random()>F.chance))return;
  w.flSay={e,txt,t:F.dur};w.flCd=F.cd;
}

/* ---- פגישה ראשונה: פס דק למעלה במרכז, מידע להצצה (docs/ui-guide.md). לא נלחץ ולא חוסם ---- */
const FLC={q:[],t:0,on:null};
function flMeet(k){
  const L=flLore();if(L.met[k])return;L.met[k]=1;
  if(typeof saveNow==='function')saveNow();
  FLC.q.push(k);if(!FLC.on)flCardNext();
}
function flCardEl(){
  let el=document.getElementById('flCard');if(el)return el;
  el=document.createElement('div');el.id='flCard';el.className='flcard';el.setAttribute('role','status');el.hidden=true;
  document.body.appendChild(el);return el;
}
function flCardNext(){
  const el=flCardEl(),k=FLC.q.shift();
  if(!k){FLC.on=null;el.hidden=true;el.classList.remove('on');return}
  FLC.on=k;FLC.t=FOELORE.card.dur;
  el.innerHTML='<span class="flpic">'+FOELORE.list[k]+'</span><div><b><small>'+T('fl.new')+'</small> '+flName(k)+'</b><p>'+flLine(k)+'</p></div>';
  el.classList.remove('on');el.hidden=true;FLC.shown=0;flCardVis();
}
// חלון פתוח (.ov, כמו ספר הסקילים): הפס לא מופיע מעליו, והזמן שלו לא רץ. כשהחלון נסגר הוא ממשיך מאיפה שעצר (ניר, 4.11)
// גם חלון .win שאינו בתוך .ov (מפה, קפיצה, יומן, שיחה, שער): הכרטיס כיסה את הכותרת שלהם (ביקורת 6.11, פריט 9)
const flOvOpen=()=>[...document.querySelectorAll('.ov,.win')].some(o=>!o.hidden&&!o.closest('[hidden]'));
function flCardVis(){
  const el=flCardEl(),show=!!FLC.on&&!flOvOpen();
  if(show===!el.hidden)return show;
  if(show){el.hidden=false;void el.offsetWidth;el.classList.add('on');if(!FLC.shown&&typeof sfx==='function')sfx('ui');FLC.shown=1}
  else{el.classList.remove('on');el.hidden=true}
  return show;
}
function flCardTick(dt){if(FLC.on&&flCardVis()&&(FLC.t-=dt)<=0)flCardNext()}
const flCardOn=()=>!!FLC.on;
// יציאה מהעולם (foeLoreScreen לא נקרא): לא משאירים כרטיס תקוע
setInterval(()=>{if(!FLC.on)return;if(!S||!S.wd){FLC.q=[];flCardNext()}else flCardVis()},300);   // גם כשהעולם עוצר מתחת לחלון

/* ---- ציור מעל הכל (world.js): שם מעל הראש, ובועה ---- */
function foeLoreScreen(ox,oy){
  const w=S.wd;if(!w)return;const F=FOELORE,L=F.label,fs=L.size/ZOOM;
  ctx.save();ctx.textAlign='center';ctx.direction=DIR;ctx.font='700 '+fs+'px Heebo, system-ui, sans-serif';
  let near=null,nd=F.near;
  for(const e of enemies){
    if(e.dead||e.hunt||e.warden)continue;
    if(e.pname&&(e.flSeen||e.rare)){flTag(e.pname,e.x+ox,e.y+oy-e.r-(e.affix?46:30),e.rare?RARES.col:L.elite,fs);continue}   // נדירה (rares.js): תמיד, בזוהר שלה   // עלית ומבוקש: תמיד
    if(!flHas(e.type)||e.wanted)continue;
    const d=Math.hypot(P.x-e.x,P.y-e.y);if(d<nd&&(e.flSeen||e.hitT!=null)){nd=d;near=e}
  }
  if(near&&!near.affix)flTag(flName(near.type),near.x+ox,near.y+oy-near.r-30,L.col,fs);
  const s=w.flSay;
  if(s&&!s.e.dead){
    const B=F.bubble,bf=B.size/ZOOM,x=s.e.x+ox,y=s.e.y+oy-s.e.r-(s.e.pname||s.e.affix||s.e.hunt?66:50);
    if(onScreen(x,y)){
      ctx.font='700 '+bf+'px Heebo, system-ui, sans-serif';
      const tw=Math.min(ctx.measureText(s.txt).width,B.w/ZOOM)+14/ZOOM,h=bf*1.6,a=Math.min(1,s.t*3);
      ctx.globalAlpha=a;ctx.fillStyle='rgba(250,246,232,0.95)';ctx.strokeStyle='rgba(20,22,34,0.8)';ctx.lineWidth=1.5/ZOOM;
      ctx.beginPath();ctx.roundRect(x-tw/2,y-h*0.75,tw,h,h/2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-5/ZOOM,y+h*0.25-1);ctx.lineTo(x,y+h*0.25+7/ZOOM);ctx.lineTo(x+5/ZOOM,y+h*0.25-1);ctx.closePath();ctx.fill();
      ctx.fillStyle='#1A1C28';ctx.fillText(s.txt,x,y+bf*0.3,B.w/ZOOM);ctx.globalAlpha=1}
  }
  ctx.restore();
}
function flTag(t,x,y,col,fs){
  if(!t||!onScreen(x,y))return;
  const tw=ctx.measureText(t).width+10/ZOOM;
  ctx.fillStyle='rgba(10,12,20,0.6)';ctx.fillRect(x-tw/2,y-fs*0.92,tw,fs*1.25);
  ctx.fillStyle=col;ctx.fillText(t,x,y);
}

// העיצוב של הכרטיס, כאן ולא ב-CSS, כדי שהמכניקה תהיה בקובץ אחד
(function(){const st=document.createElement('style');st.textContent=
  // פס דק בעץ וזהב: ברוחב שליש מסך במרכז, כדי לא לגעת בשורת הקווסט ובמפה שבצדדים, ובגובה שתי שורות קטנות
  '.flcard{position:fixed;top:calc(env(safe-area-inset-top,0px) + 54px);left:50%;transform:translate(-50%,-10px);opacity:0;transition:opacity .25s,transform .25s;z-index:40;pointer-events:none;'+
  'display:flex;gap:8px;align-items:center;width:max-content;max-width:min(300px,30vw);padding:3px 12px 3px 10px;border-radius:10px;'+
  'background:linear-gradient(#4A3322e6,#2C1E14e6);border:1.5px solid #C9A24A;box-shadow:inset 0 1px 0 #ffffff1a,0 3px 8px #0008;color:#EDE8DA;font:400 11px Heebo,system-ui,sans-serif;text-align:start}'+
  '.flcard.on{opacity:1;transform:translate(-50%,0)}.flcard .flpic{font-size:20px;line-height:1;flex:none}.flcard div{min-width:0}'+
  '.flcard b{display:block;font-size:13px;color:#F4C74F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.flcard small{color:#C9A24A;font-weight:700;font-size:10px}'+
  '.flcard p{margin:0;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}';
  document.head.appendChild(st)})();
