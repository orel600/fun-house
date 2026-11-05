/* בוסים ענקיים בעולם (ניר, 4.11.2026: "אני רוצה שבוסים יהיו מודלים גדולים מאוד, משהו משמעותי").
   השומרים של ששת הפנסים (STORY.lanterns ב-story.js) הם ענקים: מודל משלהם לכל פרק (LOOK3D.wb_<פנס> ב-render3d.js), פי 5 מהגיבור בערך.
   e.wboss = הפנס של הענק. הזירה ומשחקי השאול (אוראל) לא נוגעים כאן: שם הבוס נשאר LOOK3D.boss, כי הבחירה היא לפי wboss ולא isBoss.
   כדי שבוס אחר בעולם ייראה כמו ענק של פרק: giantRise(e,'<פנס>').
   כאן: הגודל הלוגי (גרפיקה ולוגיקה גדלות יחד), כניסה (קם מהאדמה או נוחת מהשמיים, עם השם בפס הבוס), רעידה בכל צעד ובכל מכה,
   מצלמה שמתרחקת בזמן הקרב, וקריסה איטית במוות. הצל הגדול והקריסה בתלת-ממד: syncEnemy ו-retire ב-render3d.js */
const GIANT={
  r:2,                                   // פי כמה הרדיוס הלוגי (פגיעה, מגע) מהשומר של story.js. הגוף בתלת-ממד (h ב-LOOK3D) גדל באותו יחס
  rise:{t:1.6,shake:3,land:12},          // כניסה: t שניות של קימה מהאדמה (או נחיתה), רעד קטן כל הזמן, ורעד גדול בסוף. בזמן הזה הוא לא תוקף
  step:{len:70,shake:3},                 // רעידה בכל צעד: כל len פיקסלים שהוא הולך
  hit:{shake:8},                         // רעידה כשמכה יוצאת (רקיעה, הסתערות, יריות, טבעת, ברקים)
  zoom:{k:0.66,near:900,inT:1.2,outT:2.4,step:0.01},   // המצלמה מתרחקת (פי k) כשענק חי עד near מהגיבור, כדי לראות את כולו ואת הגיבור
  cam:{k:0.5,tall:4.4,max:0.3},           // והמרכז זז לכיוון האמצע של הגוף שלו (k מהדרך, גובה הגוף tall×r), עד max מהמסך, כדי שהגיבור נשאר בפנים
  die:{t:3.2,anim:2.2,sink:1.2,shake:14},// מוות: t שניות עד שנעלם, anim שניות של קריסה, ושוקע באדמה ב-sink האחרונות. רעד גדול כשנופל
  shadow:1.35,                           // הצל על הקרקע: פי כמה מהצל של אויב רגיל באותו רדיוס
  /* בוסים תמיד שם, וחוזרים אחרי טיימר (ניר, 5.11.2026: "בוסים צריכים להיות כל הזמן... בוס ראשון הכי קל, אחרון הכי קשה... משהו שמבוסס יחס").
     docs/plan-world-terrain.md, שלב 1. כל ענק ישן במאורה שלו ליד הפנס (y+lair), וקם כשמתקרבים, גם לפני הקווסט.
     אחרי כל ניצחון: אבן עם שעון במקומו. הטיימר בשעה אמיתית (SAVE.story.bt: {פנס: מתי חוזר, Date.now}), אז רץ גם כשהמשחק סגור.
     ladder: הסולם של כל הבוסים. הבוס ה-i (לפי הסדר ב-STORY.lanterns, מ-0): טיימר base×ratio^i דקות (10, 15, 23, 34, 51, 76),
     ושלל של ניצחון חוזר פי ratio^i. החוזק (חיים ונזק ב-STORY.lanterns[*].warden) מיושר לאותו יחס בעזרת tools/balance-world.js.
     loot: ניצחון חוזר (לא הראשון, שנותן את הפנס דרך הקווסט): coins מטבעות, חפץ אחד מהטבלה של השומר (STORY.rematch.loot) ומשאבים ממנה, הכל ×ratio^i.
     הרמה המומלצת על השלט: הרמה של הדרך לאזור הבא (CURIO.paths), ולאחרון עוד step */
  ladder:{base:10,ratio:1.5},
  lair:70,
  loot:{coins:40},
  lv:{step:5},
  clock:{r:34,font:13}                   // האבן עם השעון: רדיוס האבן, וגודל הטקסט של הזמן שנשאר
};
// נקרא מ-storyWarden: השומר נהיה ענק. k: הפנס (earth, water, ice, fire, bolt, light)
function giantRise(e,k){
  e.wboss=k;e.r*=GIANT.r;e.rise=GIANT.rise.t;e.stepAcc=0;e.gx=e.x;e.gy=e.y;
  S.shake=Math.max(S.shake,GIANT.rise.shake);
}
// כל פריים בעולם (storyUpdate): כניסה, צעדים ומכות שמרעידים את האדמה, ונפילה
function giantUpdate(dt){
  const w=S.wd,e=w&&w.warden;if(!e||!e.wboss)return;
  if(e.dead){if(!e.fell){e.fell=true;S.shake=Math.max(S.shake,GIANT.die.shake);sparks(e.x,e.y,'#C9A26B',26,320);sfx('death')}return}
  if(e.rise>0){e.rise-=dt;S.shake=Math.max(S.shake,GIANT.rise.shake);
    if(e.rise<=0){S.shake=Math.max(S.shake,GIANT.rise.land);sparks(e.x,e.y,'#C9A26B',22,300);sfx('shoot')}}
  e.stepAcc+=Math.hypot(e.x-e.gx,e.y-e.gy);e.gx=e.x;e.gy=e.y;
  if(e.stepAcc>GIANT.step.len){e.stepAcc=0;S.shake=Math.max(S.shake,GIANT.step.shake)}
  const busy=!!(e.tel||e.dash);if(e.gBusy&&!e.tel&&!e.dash||e.dash&&!e.gDash)S.shake=Math.max(S.shake,GIANT.hit.shake);   // מכה יצאה
  e.gBusy=busy;e.gDash=!!e.dash;
}
// בכניסה הוא לא זז ולא תוקף (storyWardenMove)
const giantWaking=e=>e.wboss&&e.rise>0;
// כמה הוא מתחת לאדמה (קם) או מעליה (נוחת, למרחפים), בפיקסלים, לציור בתלת-ממד
function giantLift(e,L){if(!(e.rise>0))return 0;const k=e.rise/GIANT.rise.t,ease=k*k;return (L.float?L.h*2:-L.h*1.1)*ease}
// המצלמה (camZoom ב-camera.js): מתרחקת לאט כשענק קרוב, וחוזרת לאט אחרי
function giantZoom(){
  const Z=GIANT.zoom,st=giantZoom,now=performance.now()/1000,dt=Math.min(0.1,st.last?now-st.last:0);st.last=now;
  const e=S&&S.wd&&S.wd.warden,want=e&&e.wboss&&!e.dead&&P&&Math.hypot(e.x-P.x,e.y-P.y)<Z.near?Z.k:1;
  st.z=st.z||1;st.z+=(want-st.z)*Math.min(1,dt/(want<st.z?Z.inT:Z.outT)*3);
  return Math.round(st.z/Z.step)*Z.step;
}
// כמה להזיז את מרכז המצלמה מהגיבור לכיוון הענק (main.js). גדל יחד עם ההתרחקות, אז נכנס ויוצא לאט
function giantCam(){
  const Z=GIANT.zoom,C=GIANT.cam,e=S&&S.wd&&S.wd.warden,f=Math.max(0,Math.min(1,(1-(giantZoom.z||1))/(1-Z.k)));
  if(!e||!e.wboss||e.dead||!f||!P)return{x:0,y:0};
  const cl=(v,m)=>Math.max(-m,Math.min(m,v));
  return{x:cl((e.x-P.x)*C.k,W*C.max)*f,y:cl((e.y-e.r*C.tall*0.5-P.y)*C.k,H*C.max)*f};
}
// פס הבוס בראש המסך (hud ב-render.js), עם השם והתואר של הענק. null כשאין ענק חי
function giantBar(){
  const e=S&&S.wd&&S.wd.warden;if(!e||!e.wboss||e.dead)return null;
  return{name:T('story.'+e.wboss+'.name'),title:T('giant.t.'+e.wboss),weak:e.weak,hp:e.hp,max:e.max,rage:0};
}

/* ---- בוסים תמיד, בטיימר (GIANT.ladder) ---- */
const giantBt=()=>STO().bt||(STO().bt={});
const giantIdx=k=>Math.max(0,Object.keys(STORY.lanterns).indexOf(k));
const giantK=k=>Math.pow(GIANT.ladder.ratio,giantIdx(k));   // פי כמה מהבוס הראשון: טיימר ושלל
const giantWait=k=>Math.round(GIANT.ladder.base*giantK(k))*60000;   // כמה מילישניות עד שחוזר
// כמה מילישניות נשארו עד שהבוס של הפנס חוזר. 0: הוא במאורה
function giantLeft(k){const t=giantBt()[k];return t?Math.max(0,t-Date.now()):0}
// הבוס יכול לקום עכשיו: אין טיימר, או שהקווסט שלו פעיל (העלילה לא מחכה לשעון)
const giantReady=k=>giantLeft(k)<=0||qOn(STORY.lanterns[k].quest);
// הרמה המומלצת: הדרך לאזור של הפנס הבא (CURIO.paths), ולאחרון עוד lv.step
function giantLv(k){
  const ks=Object.keys(STORY.lanterns),i=ks.indexOf(k),nx=ks[i+1],c=nx&&CURIO.paths[STORY.lanterns[nx].reg];if(c)return c.lv;
  const pv=CURIO.paths[STORY.lanterns[k].reg];return (pv?pv.lv:0)+GIANT.lv.step;
}
// ניצחון: הטיימר מתחיל. בניצחון חוזר גם שלל, פי ratio^i
function giantWin(e){
  const k=e.warden;giantBt()[k]=Date.now()+giantWait(k);saveNow();
  if(!e.first)giantLoot(e);
}
function giantLoot(e){
  const k=e.warden,L=STORY.lanterns[k],lt=STORY.rematch.loot[k]||STORY.rematch.loot.earth,m=giantK(k),got=[];
  const g=lt.gear[Math.floor(Math.random()*lt.gear.length)];dropSpawn(g,1,e.x,e.y);got.push(g);
  for(const r in lt.res)dropSpawn(r,Math.max(1,Math.round(lt.res[r]*m)),e.x+(Math.random()-0.5)*60,e.y+20);
  dropSpawn('coins',Math.round(GIANT.loot.coins*m),e.x-30,e.y+10);
  celebrate(e.x,e.y-30,'loot2','🏆');sfx('celebrate');
  const txt=T('story.re.win',T('story.'+k+'.name'));if(feedOn())feedAdd('🏆',txt,L.glow,'rew:'+k);else banner(txt,L.glow);
  S.wd.reGot=got;   // לבדיקה (check.js)
}
// השחקן ברח: הענק הגיע למאורה, מתרפא וחוזר לישון. קם שוב כשמתקרבים
function giantSleep(e){
  e.hp=e.max;e.gone=true;const w=S.wd;if(w&&w.warden===e)w.warden=null;
  const i=enemies.indexOf(e);if(i>=0)enemies.splice(i,1);
}
// המאורה: גבעת אדמה כהה, ומעליה 💤 כשהבוס ישן, או אבן עם שעון כשהוא בטיימר (storyDraw)
function giantLairDraw(k,L){
  const x=L.x,y=L.y+GIANT.lair,e=S.wd.warden,t=fxNow();
  ctx.save();ctx.globalAlpha=0.55;ctx.fillStyle='#2A2018';ctx.beginPath();ctx.ellipse(x,y+10,110,40,0,0,7);ctx.fill();
  if(!e&&giantLeft(k)>0&&!giantReady(k)){const r=GIANT.clock.r;ctx.globalAlpha=1;   // האבן
    ctx.fillStyle='#6B6F7A';ctx.strokeStyle='#3A3D45';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-r*0.6,r,r*1.15,0,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=L.glow;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-r*0.7,r*0.55,0,7);ctx.stroke();   // השעון על האבן
    const a=-Math.PI/2+(1-giantLeft(k)/giantWait(k))*Math.PI*2;ctx.beginPath();ctx.moveTo(x,y-r*0.7);ctx.lineTo(x+Math.cos(a)*r*0.45,y-r*0.7+Math.sin(a)*r*0.45);ctx.stroke()}
  else if(!e){ctx.globalAlpha=0.6+Math.sin(t*2)*0.25;ctx.font='800 26px Heebo, system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('💤',x+Math.sin(t)*8,y-30-((t*12)%20))}
  ctx.restore();
}
// מעל המאורה, בגודל קבוע על המסך: הזמן שנשאר על האבן, או שלט "רמה מומלצת" כשהבוס ישן (storyScreen)
function giantLairScreen(k,L,ox,oy){
  if(S.wd.warden)return;const left=giantReady(k)?0:giantLeft(k),x=L.x+ox,y=L.y+GIANT.lair+oy,Z=CURIO.sign,lv=giantLv(k);
  ctx.save();ctx.translate(x,y-GIANT.clock.r*2.4);ctx.scale(1/ZOOM,1/ZOOM);ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 '+GIANT.clock.font+'px Heebo, system-ui, sans-serif';
  const txt=left?'⏳ '+giantTime(left):T('cu.rec',lv),col=left?L.glow:heroLv()>=lv?Z.ok:Z.low,tw=ctx.measureText(txt).width+16;
  ctx.fillStyle='rgba(30,22,14,0.9)';ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-tw/2,-12,tw,24,5);ctx.fill();ctx.stroke();
  ctx.fillStyle=col;ctx.fillText(txt,0,5);ctx.restore();
}
// מילישניות לטקסט: 9:05, או 1:16:00 מעל שעה
function giantTime(ms){const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60,ss=String(s%60).padStart(2,'0');return h?h+':'+String(m).padStart(2,'0')+':'+ss:m+':'+ss}
