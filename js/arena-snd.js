/* צלילי הזירה (ARENA_SND), מחבילת האפקטים v10 של העוזר של אוראל, בגרסה מצומצמת (BOB, 10.11.2026). רק צליל: שום מכניקה, תזמון או נזק לא משתנים.
   מחוברים רק צלילים שהמקור והרישיון שלהם נבדקו (CC0, הקובץ זהה בבייטים למקור, sounds/README.md):
   - הכישופים (spell.js): ריפוי ← heal_chime, מכה ← smite_chime. אחרי הטלה מוצלחת בלבד. dash נשאר עם הצליל הקיים.
   - בלום (skillUse): blessing_chime ביצירת הבריכה.
   - מיטת קהל (crowd_amb): לופ שקט בזירה בזמן משחק, על ערוץ fx. נכבה ב"פחות אפקטים" (arshLess, אם קיים), ב-mute או בעוצמה 0.
   לא מחוברים (אין מקור ורישיון בתיק): שריקת נפילה לשביט, סדק רעם לזאפ, לופ אש, ולופים של הסקילים החדשים. שכבת הסקילים החדשים (ARN) תתווסף בענף שלהם.
   שביט: arena-sharp.js (ARSH) כבר מנגן tower_fall בנחיתה, וכאן אין לו צליל, כך שאין כפילות.
   מתג: ARENA_SND.on, או ?asnd=0. מחיקה: הקובץ, השורה ב-index.html והשורות ב-audio.js */
const ARENA_SND={on:!/[?&]asnd=0(&|$)/.test(location.search),
  skill:{bloom:'blessing_chime'},spell:{heal:'heal_chime',smite:'smite_chime'},
  crowd:{id:'crowd_amb',edge:0.06,every:0.7},   // edge: שוליים שמדלגים עליהם בלופ (השקט של מקודד ה-mp3 בהתחלה ובסוף), כדי שלא יהיה חור בכל סיבוב
  stat:{played:0}};
(function(){
  if(!ARENA_SND.on)return;
  const inArena=()=>typeof skArena==='function'&&skArena()&&typeof S!=='undefined'&&S&&!S.mb;
  if(typeof skillUse==='function'){const b=skillUse;skillUse=function(id){const r=b.apply(this,arguments);
    if(r&&inArena()&&ARENA_SND.skill[id]){sfx(ARENA_SND.skill[id]);ARENA_SND.stat.played++}return r}}
  if(typeof spellUse==='function'&&typeof spellState==='function'){const b=spellUse;spellUse=function(){const s=spellState(),id=s&&s.id,r=b.apply(this,arguments);
    if(r&&inArena()&&ARENA_SND.spell[id]){sfx(ARENA_SND.spell[id]);ARENA_SND.stat.played++}return r}}
  // מיטת הקהל: לופ ידני על הבאפר שכבר פוענח, דרך אותו צינור של sfx (mute, עוצמת ערוץ fx)
  ARENA_SND.crowdTick=function(){
    const A=typeof AUDIO!=='undefined'&&AUDIO,c=A&&A.ctx,C=ARENA_SND.crowd,buf=A&&A.buf&&A.buf[C.id];
    const want=inArena()&&S.mode==='play'&&!(typeof arshLess==='function'&&arshLess())&&!!buf&&!A.muted&&A.unlocked&&c&&c.state==='running'&&!!A.vol.fx;
    if(want&&!ARENA_SND._crowd){
      const src=c.createBufferSource(),g=c.createGain();
      src.buffer=buf;src.loop=true;src.loopStart=C.edge;src.loopEnd=Math.max(C.edge+1,buf.duration-C.edge);
      g.gain.value=SOUNDS[C.id].vol;src.connect(g).connect(A.gain.fx||A.gain.master);src.start(0,C.edge);ARENA_SND._crowd={src,g};
    }else if(!want&&ARENA_SND._crowd){try{ARENA_SND._crowd.src.stop()}catch(e){}ARENA_SND._crowd.g.disconnect();ARENA_SND._crowd=null}
  };
  setInterval(()=>{try{ARENA_SND.crowdTick()}catch(e){}},ARENA_SND.crowd.every*1000);
})();
