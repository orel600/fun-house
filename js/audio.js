/* צלילים: sfx('מזהה') משמיע צליל, מכל מקום בקוד. צליל חדש = קובץ ב-sounds/ ושורה ב-SOUNDS.
   הקבצים נטענים דרך <audio>, לא דרך fetch, כדי שיעבדו גם מ-file://.
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
// count: כמה פעמים כל צליל התבקש (גם כשהשתקה), בשביל הבדיקה. errors: קבצים שלא נטענו או לא התנגנו
const AUDIO={muted:false,unlocked:false,pool:{},last:{},count:{},errors:[]};
try{AUDIO.muted=localStorage.getItem('zm-mute')==='1'}catch(e){}

for(const id in SOUNDS){
  AUDIO.pool[id]=[];
  for(let i=0;i<SOUNDS[id].max;i++){
    const a=new Audio('sounds/'+SOUNDS[id].file);a.preload='auto';a.preservesPitch=false;
    a.addEventListener('error',()=>AUDIO.errors.push(id+': '+(a.error?a.error.code:'?')));
    AUDIO.pool[id].push(a);
  }
}
function sfx(id){
  const s=SOUNDS[id];if(!s)return;
  AUDIO.count[id]=(AUDIO.count[id]||0)+1;
  if(AUDIO.muted||!AUDIO.unlocked)return;
  const now=performance.now()/1000;if(now-(AUDIO.last[id]||-9)<s.gap)return;
  const a=AUDIO.pool[id].find(a=>a.paused||a.ended);if(!a)return;
  AUDIO.last[id]=now;
  a.volume=s.vol;a.playbackRate=1+(Math.random()*2-1)*s.pitch;a.currentTime=0;
  const p=a.play();if(p)p.catch(sfxFail(id));
}
// "לא הורשה" ו"נקטע" הם לא תקלה: הדפדפן עוד לא קיבל נגיעה, או שהצליל הבא החליף אותו
const sfxFail=id=>e=>{if(e&&e.name!=='NotAllowedError'&&e.name!=='AbortError')AUDIO.errors.push(id+': '+e.name)};
// בטלפון אין צליל לפני הנגיעה הראשונה. בנגיעה הזו מנגנים כל קובץ פעם אחת בשקט, וכך הוא מותר מעכשיו
function unlockAudio(){
  if(AUDIO.unlocked)return;AUDIO.unlocked=true;
  for(const id in AUDIO.pool)for(const a of AUDIO.pool[id]){
    a.muted=true;const p=a.play();
    if(p)p.then(()=>{a.pause();a.currentTime=0;a.muted=false},e=>{a.muted=false;sfxFail(id)(e)});else{a.pause();a.muted=false}
  }
}
addEventListener('pointerdown',unlockAudio,{capture:true});addEventListener('keydown',unlockAudio,{capture:true});
function setMute(m){
  AUDIO.muted=m;try{localStorage.setItem('zm-mute',m?'1':'0')}catch(e){}
  if(m)for(const id in AUDIO.pool)for(const a of AUDIO.pool[id])a.pause();
  showMute();
}
const MUTE_ICON='<path d="M4 9h4l5-4v14l-5-4H4z"/>';
function showMute(){const b=$('muteBtn');b.classList.toggle('off',AUDIO.muted);b.setAttribute('aria-pressed',String(AUDIO.muted));
  b.firstElementChild.innerHTML=MUTE_ICON+(AUDIO.muted?'<path d="m16 9 5 6m0-6-5 6"/>':'<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>')}
$('muteBtn').addEventListener('click',e=>{e.stopPropagation();setMute(!AUDIO.muted)});
showMute();
// כל כפתור בממשק משמיע "טאפ", גם כפתורים שיתווספו בעתיד (כפר, ציוד, קווסטים)
document.addEventListener('click',e=>{if(e.target.closest('button'))sfx('tap')});
