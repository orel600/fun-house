/* צלילים: sfx('מזהה') משמיע צליל, מכל מקום בקוד. צליל חדש = קובץ ב-sounds/ ושורה ב-SOUNDS.
   הקבצים ב-sounds/, ומשם tools/build-sounds.js בונה את js/sounds-data.js (מריצים אחרי כל שינוי בצלילים). מתנגנים דרך Web Audio, ראו למטה.
   vol: עוצמה 0 עד 1. pitch: כמה הגובה משתנה באקראי בכל פעם (0.1 = עד 10%), כדי שמאה פגיעות לא יישמעו אותו דבר.
   max: כמה עותקים יכולים להתנגן יחד. gap: כמה שניות לפחות בין שתי השמעות, כדי שמאות פגיעות לא יצטברו לרעש */
const SOUNDS={
  hit:      {file:'hit.mp3',      vol:0.35, pitch:0.15, max:3, gap:0.06},  // פגיעה באויב
  shoot:    {file:'shoot.mp3',    vol:0.3,  pitch:0.1,  max:3, gap:0.08},  // יריית חץ
  death:    {file:'death.mp3',    vol:0.4,  pitch:0.15, max:3, gap:0.08},  // אויב נופל
  xp:       {file:'xp.mp3',       vol:0.25, pitch:0.2,  max:2, gap:0.07},  // איסוף XP
  coin:     {file:'coin.mp3',     vol:0.4,  pitch:0.1,  max:2, gap:0.12},  // מטבע
  levelup:  {file:'levelup.mp3',  vol:0.55, pitch:0,    max:1, gap:0.3},   // עלייה ברמה
  bossIn:   {file:'bossIn.mp3',   vol:0.7,  pitch:0,    max:1, gap:1},     // הבוס מגיע
  bossDown: {file:'bossDown.mp3', vol:0.7,  pitch:0,    max:1, gap:1},     // הבוס הובס
  hurt:     {file:'hurt.mp3',     vol:0.5,  pitch:0.1,  max:2, gap:0.2},   // השחקן נפגע
  tap:      {file:'tap.mp3',      vol:0.5,  pitch:0,    max:2, gap:0.05},  // לחיצה על כפתור
  celebrate:{file:'celebrate.mp3',vol:0.6,  pitch:0,    max:2, gap:0.3}    // שדרוג, שלל נדיר, כל רגע של "יש!"
};
/* איך מנגנים: Web Audio. כל קובץ מפוענח פעם אחת בטעינה (buf), וכל השמעה היא מקור קטן וזול שנזרק בסוף.
   קודם כל צליל ניגן דרך <audio>, ובאייפון כל השמעה כזו עצרה את המשחק לרגע: בקרב העולם ירד ל-17 פריימים בשנייה (אוראל, 30.10.2026).
   הקבצים מגיעים מ-js/sounds-data.js (נבנה ע"י tools/build-sounds.js), כי fetch לא עובד מ-file:// */
// count: כמה פעמים כל צליל התבקש (גם כשהשתקה), בשביל הבדיקה. errors: קבצים שלא נטענו או לא התנגנו
// playing: כמה עותקים של כל צליל מתנגנים עכשיו (עד max), ו-src המקורות עצמם, כדי שהשתקה תעצור אותם
const AUDIO={muted:false,unlocked:false,ctx:null,buf:{},playing:{},src:new Set(),last:{},count:{},errors:[]};
try{AUDIO.muted=localStorage.getItem('zm-mute')==='1'}catch(e){}
try{AUDIO.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){AUDIO.errors.push('AudioContext: '+e.name)}
if(AUDIO.ctx)for(const id in SOUNDS){
  const b64=SOUND_DATA[SOUNDS[id].file];if(!b64){AUDIO.errors.push(id+': missing');continue}
  const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  AUDIO.ctx.decodeAudioData(u8.buffer,b=>{AUDIO.buf[id]=b},e=>AUDIO.errors.push(id+': decode '+(e&&e.name||'?')));
}
function sfx(id){
  const s=SOUNDS[id];if(!s)return;
  AUDIO.count[id]=(AUDIO.count[id]||0)+1;
  const c=AUDIO.ctx,b=AUDIO.buf[id];
  if(AUDIO.muted||!AUDIO.unlocked||!c||!b||c.state!=='running')return;
  const now=performance.now()/1000;if(now-(AUDIO.last[id]||-9)<s.gap||(AUDIO.playing[id]||0)>=s.max)return;
  AUDIO.last[id]=now;
  const src=c.createBufferSource(),g=c.createGain();
  src.buffer=b;src.playbackRate.value=1+(Math.random()*2-1)*s.pitch;g.gain.value=s.vol;
  src.connect(g).connect(c.destination);
  AUDIO.playing[id]=(AUDIO.playing[id]||0)+1;AUDIO.src.add(src);
  src.onended=()=>{AUDIO.playing[id]--;AUDIO.src.delete(src);g.disconnect()};
  src.start();
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
$('muteBtn').addEventListener('click',e=>{e.stopPropagation();setMute(!AUDIO.muted)});
showMute();
// כל כפתור בממשק משמיע "טאפ", גם כפתורים שיתווספו בעתיד (כפר, ציוד, קווסטים)
document.addEventListener('click',e=>{if(e.target.closest('button'))sfx('tap')});
