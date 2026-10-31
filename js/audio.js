/* צלילים: sfx('מזהה') משמיע צליל, מכל מקום בקוד. צליל חדש = קובץ ב-sounds/ ושורה ב-SOUNDS.
   הקבצים ב-sounds/, ומשם tools/build-sounds.js בונה את js/sounds-data.js (מריצים אחרי כל שינוי בצלילים). מתנגנים דרך Web Audio, ראו למטה.
   vol: עוצמה 0 עד 1. pitch: כמה הגובה משתנה באקראי בכל פעם (0.1 = עד 10%), כדי שמאה פגיעות לא יישמעו אותו דבר.
   max: כמה עותקים יכולים להתנגן יחד. gap: כמה שניות לפחות בין שתי השמעות, כדי שמאות פגיעות לא יצטברו לרעש (1/gap = הכי הרבה בשנייה).
   grp: לאיזה ערוץ הצליל שייך, ולכל ערוץ מחוון עוצמה משלו (SOUND_MIX). fight: הצלילים שחוזרים כל הזמן בקרב. fx: השאר, רגעים נדירים וכפתורים.
   ניר (31.10.2026): "הצלילים ממש מעצבנים". הבוט ספר כ-2300 פגיעות ו-1700 יריות בריצה, אז צלילי הקרב שקטים ונדירים יותר, והרגעים הגדולים נשארים ברורים */
const SOUNDS={
  hit:      {file:'hit.mp3',      vol:0.16, pitch:0.18, max:2, gap:0.14, grp:'fight'},  // פגיעה באויב
  shoot:    {file:'shoot.mp3',    vol:0.12, pitch:0.15, max:2, gap:0.18, grp:'fight'},  // יריית חץ
  death:    {file:'death.mp3',    vol:0.22, pitch:0.18, max:2, gap:0.14, grp:'fight'},  // אויב נופל
  xp:       {file:'xp.mp3',       vol:0.12, pitch:0.25, max:1, gap:0.15, grp:'fight'},  // איסוף XP
  coin:     {file:'coin.mp3',     vol:0.22, pitch:0.15, max:1, gap:0.18, grp:'fight'},  // מטבע
  hurt:     {file:'hurt.mp3',     vol:0.3,  pitch:0.12, max:1, gap:0.4,  grp:'fight'},  // השחקן נפגע
  levelup:  {file:'levelup.mp3',  vol:0.55, pitch:0,    max:1, gap:0.3,  grp:'fx'},     // עלייה ברמה
  bossIn:   {file:'bossIn.mp3',   vol:0.7,  pitch:0,    max:1, gap:1,    grp:'fx'},     // הבוס מגיע
  bossDown: {file:'bossDown.mp3', vol:0.7,  pitch:0,    max:1, gap:1,    grp:'fx'},     // הבוס הובס
  tap:      {file:'tap.mp3',      vol:0.35, pitch:0,    max:1, gap:0.08, grp:'fx'},     // לחיצה על כפתור
  celebrate:{file:'celebrate.mp3',vol:0.6,  pitch:0,    max:2, gap:0.3,  grp:'fx'}      // שדרוג, שלל נדיר, כל רגע של "יש!"
};
/* הערוצים והמחוונים בחלון הצלילים (נפתח מכפתור הרמקול). def: העוצמה ההתחלתית. gap: לכל הערוץ יחד, כדי שפגיעה, ירייה ומטבע באותו רגע לא יישמעו כרעש אחד.
   duck: כשצליל fx מתנגן, צלילי הקרב יורדים לחלק הזה לכמה שניות (duckT), כדי שרגע גדול יישמע. העוצמות נשמרות בטלפון (key) */
const SOUND_MIX={
  key:'zm-vol',
  ch:{master:{def:1},fight:{def:0.7,gap:0.06},fx:{def:1}},
  duck:0.4, duckT:0.8
};
/* איך מנגנים: Web Audio. כל קובץ מפוענח פעם אחת בטעינה (buf), וכל השמעה היא מקור קטן וזול שנזרק בסוף.
   קודם כל צליל ניגן דרך <audio>, ובאייפון כל השמעה כזו עצרה את המשחק לרגע: בקרב העולם ירד ל-17 פריימים בשנייה (אוראל, 30.10.2026).
   הקבצים מגיעים מ-js/sounds-data.js (נבנה ע"י tools/build-sounds.js), כי fetch לא עובד מ-file:// */
// count: כמה פעמים כל צליל התבקש (גם כשהשתקה), בשביל הבדיקה. errors: קבצים שלא נטענו או לא התנגנו
// playing: כמה עותקים של כל צליל מתנגנים עכשיו (עד max), ו-src המקורות עצמם, כדי שהשתקה תעצור אותם
// played: כמה פעמים כל צליל באמת התנגן. vol: העוצמות מהחלון, gain: צמתי העוצמה של כל ערוץ
const AUDIO={muted:false,unlocked:false,ctx:null,buf:{},playing:{},src:new Set(),last:{},grpLast:{},count:{},played:{},errors:[],vol:{},gain:{}};
try{AUDIO.muted=localStorage.getItem('zm-mute')==='1'}catch(e){}
function audioPrefsLoad(){
  let v={};try{v=JSON.parse(localStorage.getItem(SOUND_MIX.key))||{}}catch(e){}
  for(const k in SOUND_MIX.ch)AUDIO.vol[k]=typeof v[k]==='number'?Math.max(0,Math.min(1,v[k])):SOUND_MIX.ch[k].def;
  return AUDIO.vol;
}
audioPrefsLoad();
try{AUDIO.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AUDIO.errors.push('AudioContext: '+e.name)}
// master ← fight, fx: כל צליל עובר דרך הערוץ שלו ואז דרך העוצמה הכללית
if(AUDIO.ctx){const c=AUDIO.ctx;
  for(const k in SOUND_MIX.ch){AUDIO.gain[k]=c.createGain();AUDIO.gain[k].gain.value=AUDIO.vol[k]}
  AUDIO.gain.master.connect(c.destination);for(const k in SOUND_MIX.ch)if(k!=='master')AUDIO.gain[k].connect(AUDIO.gain.master)}
if(AUDIO.ctx)for(const id in SOUNDS){
  const b64=SOUND_DATA[SOUNDS[id].file];if(!b64){AUDIO.errors.push(id+': missing');continue}
  const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  AUDIO.ctx.decodeAudioData(u8.buffer,b=>{AUDIO.buf[id]=b},e=>AUDIO.errors.push(id+': decode '+(e&&e.name||'?')));
}
/* האם צליל מותר עכשיו (now בשניות): gap של הצליל ושל הערוץ שלו, וכמה עותקים כבר מתנגנים. בלי צד אחר, אז הבדיקה קוראת לה ישירות */
function sfxGate(id,now){
  const s=SOUNDS[id],g=SOUND_MIX.ch[s.grp]||{};
  if(now-(AUDIO.last[id]??-9)<s.gap||(AUDIO.playing[id]||0)>=s.max)return false;
  if(g.gap&&now-(AUDIO.grpLast[s.grp]??-9)<g.gap)return false;
  AUDIO.last[id]=now;AUDIO.grpLast[s.grp]=now;return true;
}
function sfx(id){
  const s=SOUNDS[id];if(!s)return;
  AUDIO.count[id]=(AUDIO.count[id]||0)+1;
  const c=AUDIO.ctx,b=AUDIO.buf[id];
  if(AUDIO.muted||!AUDIO.unlocked||!c||!b||c.state!=='running'||!AUDIO.vol[s.grp])return;
  if(!sfxGate(id,performance.now()/1000))return;
  AUDIO.played[id]=(AUDIO.played[id]||0)+1;
  const src=c.createBufferSource(),g=c.createGain();
  src.buffer=b;src.playbackRate.value=1+(Math.random()*2-1)*s.pitch;g.gain.value=s.vol*(0.85+Math.random()*0.15);
  src.connect(g).connect(AUDIO.gain[s.grp]||AUDIO.gain.master);
  AUDIO.playing[id]=(AUDIO.playing[id]||0)+1;AUDIO.src.add(src);
  src.onended=()=>{AUDIO.playing[id]--;AUDIO.src.delete(src);g.disconnect()};
  src.start();
  // רגע גדול: צלילי הקרב יורדים לרגע, ועולים חזרה לאט
  if(s.grp==='fx'&&id!=='tap'&&AUDIO.gain.fight){const f=AUDIO.gain.fight.gain,t=c.currentTime,v=AUDIO.vol.fight;
    f.cancelScheduledValues(t);f.setValueAtTime(v*SOUND_MIX.duck,t);f.linearRampToValueAtTime(v,t+SOUND_MIX.duckT)}
}
// עוצמה של ערוץ (0 עד 1), מהחלון. נשמרת בטלפון מיד
function setVol(k,v){
  if(!(k in SOUND_MIX.ch))return;AUDIO.vol[k]=Math.max(0,Math.min(1,+v||0));
  const g=AUDIO.gain[k];if(g){g.gain.cancelScheduledValues(0);g.gain.value=AUDIO.vol[k]}
  try{localStorage.setItem(SOUND_MIX.key,JSON.stringify(AUDIO.vol))}catch(e){}
}
// בטלפון אין צליל לפני הנגיעה הראשונה. בנגיעה הזו מעירים את Web Audio, ומעכשיו הוא מותר
function unlockAudio(){
  if(AUDIO.unlocked||!AUDIO.ctx)return;AUDIO.unlocked=true;
  const p=AUDIO.ctx.resume();if(p)p.catch(e=>AUDIO.errors.push('resume: '+e.name));
}
addEventListener('pointerdown',unlockAudio,{capture:true});addEventListener('keydown',unlockAudio,{capture:true});
// אחרי שחוזרים לאפליקציה (מסך נעול, לשונית אחרת) הדפדפן לפעמים משאיר את הצליל מושהה
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AUDIO.unlocked&&AUDIO.ctx&&AUDIO.ctx.state!=='running')AUDIO.ctx.resume().catch(()=>{})});
function setMute(m){
  AUDIO.muted=m;try{localStorage.setItem('zm-mute',m?'1':'0')}catch(e){}
  if(m)for(const s of AUDIO.src)try{s.stop()}catch(e){}
  showMute();
}
const MUTE_ICON='<path d="M4 9h4l5-4v14l-5-4H4z"/>';
function showMute(){const b=$('muteBtn');b.classList.toggle('off',AUDIO.muted);b.setAttribute('aria-pressed',String(AUDIO.muted));
  b.firstElementChild.innerHTML=MUTE_ICON+(AUDIO.muted?'<path d="m16 9 5 6m0-6-5 6"/>':'<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>')}
/* חלון הצלילים: נפתח מכפתור הרמקול. שלושה מחוונים (כללי, קרב, אפקטים) וכפתור השתקה. בזירה המשחק עוצר כשהוא פתוח */
let sndPrev=null;
function soundOpen(){
  if(S&&S.mode==='play'){sndPrev='play';S.mode='sound';joy=null}else sndPrev=null;
  for(const el of document.querySelectorAll('#ovSound input[data-ch]'))el.value=Math.round(AUDIO.vol[el.dataset.ch]*100);
  $('sndMute').textContent=T(AUDIO.muted?'snd.on':'snd.off');$('ovSound').hidden=false;
}
function soundClose(){$('ovSound').hidden=true;if(sndPrev&&S.mode==='sound')S.mode=sndPrev;sndPrev=null}
$('muteBtn').addEventListener('click',e=>{e.stopPropagation();soundOpen()});
$('sndClose').addEventListener('click',e=>{e.stopPropagation();soundClose()});
$('ovSound').addEventListener('click',e=>{if(e.target.id==='ovSound')soundClose()});   // נגיעה בחוץ סוגרת
$('sndMute').addEventListener('click',e=>{e.stopPropagation();setMute(!AUDIO.muted);$('sndMute').textContent=T(AUDIO.muted?'snd.on':'snd.off')});
for(const el of document.querySelectorAll('#ovSound input[data-ch]')){
  el.addEventListener('input',()=>setVol(el.dataset.ch,el.value/100));
  el.addEventListener('change',()=>{sfx(el.dataset.ch==='fx'?'levelup':'hit')})}   // שומעים מיד איך זה נשמע
addEventListener('keydown',e=>{if(e.code==='Escape'&&!$('ovSound').hidden)soundClose()});
showMute();
// כל כפתור בממשק משמיע "טאפ", גם כפתורים שיתווספו בעתיד (כפר, ציוד, קווסטים)
document.addEventListener('click',e=>{if(e.target.closest('button'))sfx('tap')});
