/* מזג אוויר בעולם ובכפר (WXW, אוראל 7.11.2026, חבילה 44 weather-fx). רק שכבת אפקטים: לא נוגע במפה, בלוגיקה, בקווסטים או באיזון.
   העולם והכפר של ניר: FXW (fxworld.js) נשאר כמו שהוא, וכאן רק מבקשים ממנו מזג אוויר:
   - יש ליבה (weather.js): weatherScene('world'/'village', cfg של האזור) ו-weatherState(מצב, שם). הליבה מציירת מתחת לקרב (render.js),
     והאריחים של FXW.weather, משב סופת השלג והבזק הברק של FXW.scene לא נוצרים (fxwWant, fxwMore, fxwScene). ברקים ושלוליות: cfg.ev
   - אין ליבה: אותם מצבים, ומה שחסר ב-FXW.weather נוסף כאריחים מהגיליונות הקיימים (wxwTiles)
   סערה אקראית: calm → building → storm → clearing. האזור storm תמיד בסערה, עם ברקים. בכפר: אותה מכונה, עם מזג אוויר נעים (שמש בבוקר, גשם קל, קשת אחריו).
   ערכה לפי השעה (VFX.hour): temperate ביום, dusk בשקיעה, night בלילה. אזור עם ערכה משלו (רכס arctic, מדבר dusk) שומר עליה תמיד.
   חיבור: wxwUpdate ב-fxwUpdate, wxwTiles ב-fxwWant, wxwLeave כשיוצאים מהעולם והכפר, wxwCore ב-fxwMore/fxwScene (fxworld.js). אם מוחקים את הקובץ, FXW עובד כמו קודם */
const WXW={
  on:true,
  // [variant, intensity] לכל מצב. theme: ערכה קבועה לאזור. events: סערות אקראיות. always: מצב קבוע. bolts: ברקים בזמן סערה
  scene:{
    meadow:{calm:[['wind_petals',0.35]],building:[['cloud_pass',0.4],['wind_breeze',0.4]],storm:[['rain_heavy',0.55],['storm_cloud',0.45]],clearing:[['rain_light',0.3],['rainbow',0.5,{when:'day'}]],events:1,bolts:1},   // ליד הכפר: עלי כותרת
    forest:{calm:[['rain_light',0.35],['rain_drip',0.3]],building:[['rain_light',0.5],['cloud_dark',0.35]],storm:[['rain_heavy',0.6],['storm_cloud',0.45]],clearing:[['rain_drip',0.3],['mist_rise',0.3]],events:1,bolts:1},   // יער (FXW.forest): גשם
    // 11.11 (docs/concept-living-world.md): שלג שעף הצידה. wind_gust (קווי רוח לרוחב) עם השלג, ו-snow_blizzard (רקע אפור) רק בסערה
    ridge:{theme:'arctic',calm:[['snow_heavy',0.4],['wind_gust',0.35]],building:[['snow_heavy',0.55],['wind_gust',0.45]],storm:[['snow_blizzard',0.7],['wind_gust',0.5]],clearing:[['snow_light',0.4]],events:1},
    // 11.11: סופת חול. אבק נמוך וקווי רוח, ובלי טורנדו על כל המסך (כיסה את הגיבור). את התחושה נותן האובך (WXW.sand): חזק בשוליים, שקוף סביב הגיבור
    desert:{theme:'dusk',calm:[['wind_dust',0.35]],building:[['wind_dust',0.5],['wind_gust',0.3]],storm:[['wind_dust',0.65],['wind_gust',0.45]],clearing:[['wind_dust',0.25]],events:1},
    storm:{calm:[['rain_heavy',0.6],['storm_cloud',0.6]],building:[['rain_heavy',0.6],['storm_cloud',0.6]],storm:[['rain_torrent',0.65],['storm_cloud',0.65]],clearing:[['rain_heavy',0.5],['storm_cloud',0.5]],always:'storm',bolts:1,far:{bolt:[5,11],flash:[7,14]}},   // ברקים והבזקים: רק רחוק (WXW.far)
    lake:{calm:[['fog_drift',0.35]],building:[['fog_drift',0.45],['cloud_pass',0.35]],storm:[['rain_heavy',0.5],['fog_drift',0.4]],clearing:[['mist_rise',0.35]],events:1},
    shadow:{calm:[['mist_rise',0.3]],building:[['mist_rise',0.3]],storm:[['mist_rise',0.3]],clearing:[['mist_rise',0.3]]},
    // הכפר: נעים. calm מתחלף בכל סבב (sun בבוקר, breeze, ולפעמים snow), storm הוא גשם קל עם שלוליות, ו-clearing קשת
    village:{calm:[['wind_petals',0.3]],building:[['cloud_pass',0.35]],storm:[['rain_light',0.4],['rain_puddle',0.4]],clearing:[['rain_drip',0.3],['rainbow',0.55,{when:'day'}],['sun_rays',0.3,{when:'day'}]],events:1,
      calmPick:{breeze:[['sun_rays',0.35,{when:'morning'}],['wind_petals',0.35,{when:'day'}],['wind_breeze',0.25]],snow:[['snow_settle',0.35],['snow_light',0.25]]},snowOdds:0.15,
      ev:{storm:{puddle:[2.5,5]}}}
  },
  cycle:{calm:[70,140],building:[12,18],storm:[25,45],clearing:[14,20]},   // שניות בכל מצב (זמן משחק)
  next:{calm:'building',building:'storm',storm:'clearing',clearing:'calm'},
  bolt:[6,13],   // ברק בסערה באזורים עם bolts (WXW.far). אזור עם far משלו: הזמנים שלו
  /* ---- 11.11, עולם חי שלב 1 (docs/concept-living-world.md) ---- */
  // ברק של אווירה רק רחוק: בחלק העליון של המסך ובצדדים, לפחות minD מרוחב המסך מהגיבור. ככה הוא לא מתבלבל עם ברק שפוגע (storm-river.js)
  // flash: עוצמת ההבזק (במקום 0.32). בקרב: פי slow בין ברקים. פחות תנועה ו'Fewer': בלי הבזקים (הליבה), ובלי ברקים בכלל
  far:{minD:0.33,flash:0.25,slow:2},
  fight:0.5,       // בקרב (lblFight, labels.js): כל מזג האוויר בעולם בחצי. hold: שניות שהקרב "נשאר" אחרי שנגמר, כדי שלא יהבהב
  fightHold:2.5,
  motion:/^wind_(gust|tornado)/,   // קווי רוח ועמודים: לא כשביקשו פחות תנועה או 'Fewer'
  // אובך החול במדבר: צבע אחד על כל המסך, שקוף בעיגול hole סביב הגיבור, ועד a[מצב] בשוליים. fade: שניות להגיע לעוצמה. less: פי כמה כשביקשו פחות
  sand:{reg:'desert',col:'205,160,102',hole:160,a:{building:0.22,storm:0.45,clearing:0.12},fade:3,less:0.5},
  fade:3,                          // שניות מעבר בין מצבים
  night:[20,6],dusk:[17,20],
  // בלי ליבה: אריחים מהגיליונות הקיימים, נוסף על FXW.weather. [אפקט, שקיפות, 'full'] לפי אזור ומצב
  tiles:{
    forest:{calm:[['rain',0.25,'full']],building:[['rain',0.32,'full']],storm:[['wx_rainheavy',0.42,'full']],clearing:[['rain',0.2,'full']]},
    meadow:{storm:[['wx_rainheavy',0.4,'full']],clearing:[['rain',0.2,'full']]},
    lake:{storm:[['rain',0.32,'full']]},
    desert:{storm:[['wx_dust',0.45,'low']]},
    village:{storm:[['rain',0.25,'full']],calm_snow:[['snow',0.3,'full']]}
  },
  // ---- מצב חי ----
  st:'calm',t:40,key:'',reg:'',mood:'breeze',sent:'',live:false,fightT:0,farT:{},sandA:0,sandLast:0,wrapped:false,
  stat:{far:0,near:0,sand:0,fight:0}   // לבדיקה (tools/check.js): ברקים רחוקים, ברקים שנפלו קרוב (צריך 0), פריימים עם אובך, רישומים בקרב
};
const wxwCore=()=>WXW.on&&typeof setWeather==='function'&&typeof weatherScene==='function';
const wxwHr=()=>typeof VFX!=='undefined'&&VFX.hour?VFX.hour():new Date().getHours();
function wxwTheme(R){const t=typeof wxTheme==='function'?wxTheme():(()=>{const h=wxwHr(),N=WXW.night,D=WXW.dusk;return h>=N[0]||h<N[1]?'night':h>=D[0]&&h<D[1]?'dusk':'temperate'})();
  return R.theme||t}   // שעות כמו בליבה (WEATHER.tod). ערכה של אזור (רכס arctic, מדבר dusk) גם בלילה: לשלג ולאבק אין גיליון night
// האזור של מזג האוויר: יער בתוך אזור הפתיחה, אחרת האזור עצמו
function wxwReg(){const r=typeof fxwReg==='function'?fxwReg():'village';return r==='meadow'&&FXW.forest?'forest':r}
function wxwSet(st){WXW.st=st;WXW.t=rand(...WXW.cycle[st]);
  if(st==='calm'&&WXW.reg==='village')WXW.mood=Math.random()<WXW.scene.village.snowOdds?'snow':'breeze'}
// הסצנה לליבה: ערכה לפי השעה, ובכפר calm לפי מצב הרוח של הסבב
function wxwCfg(reg){const R=WXW.scene[reg]||WXW.scene.meadow,c={theme:wxwTheme(R),auto:false};   // auto:false: המחזור כאן (wxwUpdate), כי אזור הסערה תמיד בסערה
  const calm=wxwCalm();
  for(const s of ['calm','building','storm','clearing'])c[s]=calm?(R[s]||[]).filter(e=>!WXW.motion.test(e[0])):R[s];if(R.calmPick)c.calm=R.calmPick[WXW.mood]||R.calm;
  c.ev=R.ev;   // ברקים והבזקים לא דרך הליבה: היא בוחרת נקודה אקראית במסך, גם ליד הגיבור. כאן רק רחוק (wxwFar)
  if(wxwFight())c.k=WXW.fight;return c}
const wxwCalm=()=>typeof RM!=='undefined'&&RM||typeof fxLess==='function'&&fxLess();
// בקרב: לפי השמות (labels.js), עם השהיה קצרה אחרי שנגמר
function wxwFight(){return WXW.fightT>0}
function wxwFightTick(dt){const f=typeof lblFight==='function'&&lblFight();WXW.fightT=f?WXW.fightHold:Math.max(0,WXW.fightT-dt)}
// ברקים והבזקים רחוקים בסערה: באזורים עם bolts, בזמנים של far (או WXW.bolt)
function wxwFar(dt,R){
  if(!R.bolts||WXW.st!=='storm'||typeof weatherBolt!=='function'||!S.cam||!P)return;
  const F=WXW.far,E=R.far||{bolt:WXW.bolt},T=WXW.farT,sl=wxwFight()?F.slow:1;
  for(const k in E){if(T[k]==null)T[k]=rand(...E[k])*0.5;if((T[k]-=dt)>0)continue;T[k]=rand(...E[k])*sl;
    if(k==='flash'){if(typeof weatherFlash==='function')weatherFlash(F.flash);continue}
    if(wxwCalm())continue;
    const p=wxwFarPt();if(!p)continue;
    if(weatherBolt(p.x,p.y,{flash:false}))WXW.stat.far++,Math.hypot(p.x-P.x,p.y-P.y)<F.minD*W_()&&WXW.stat.near++}
}
// נקודה רחוקה: למעלה (שמיים) ובצד, הרחק מהגיבור
function wxwFarPt(){const cw=W_(),ch=H_(),c=S.cam,F=WXW.far;
  for(let i=0;i<6;i++){const sd=Math.random()<0.5?-1:1,x=c.x+sd*rand(0.22,0.46)*cw,y=c.y-rand(0.2,0.42)*ch;
    if(Math.hypot(x-P.x,y-P.y)>=F.minD*cw)return{x,y}}return null}
function wxwUpdate(dt){
  if(!WXW.on)return;
  const reg=wxwReg(),R=WXW.scene[reg]||WXW.scene.meadow;
  if(reg!==WXW.reg){const was=WXW.reg;WXW.reg=reg;   // אזור חדש: מתחילים רגוע (יער ↔ אחו ממשיכים באותו מצב)
    if(!(was==='forest'&&reg==='meadow'||was==='meadow'&&reg==='forest'))wxwSet(R.always||'calm')}
  if(R.always)WXW.st=R.always;
  else if(R.events&&(WXW.t-=dt)<=0)wxwSet(WXW.next[WXW.st]);
  WXW.live=true;wxwFightTick(dt);wxwFar(dt,R);wxwWrap();
  // לליבה: הסצנה של המקום ('world' או 'village'). רישום מחדש כשהאזור, הערכה או מצב הרוח מתחלפים (הליבה שומרת את המצב), ומצב כשהוא משתנה
  if(wxwCore()){const name=S.wd?'world':'village',c=wxwCfg(reg),key=name+'|'+reg+'|'+c.theme+'|'+WXW.mood+'|'+(c.k||1)+'|'+wxwCalm();
    try{if(key!==WXW.key){WXW.key=key;weatherScene(name,c);WXW.sent='';if(c.k)WXW.stat.fight++}
      if(WXW.sent!==WXW.st&&typeof weatherState==='function'){WXW.sent=WXW.st;weatherState(WXW.st,name)}}catch(e){}}
}
// יציאה מהעולם ומהכפר (זירה, משחקי השאול, תפריט)
// הליבה מחליפה סצנה לבד לפי המקום (wxPlace), אז כאן רק מאפסים, כדי שבחזרה הסצנה תירשם מחדש
function wxwLeave(){if(!WXW.live)return;WXW.live=false;WXW.key='';WXW.reg=''}
// בלי ליבה: אריחים נוספים למצב הנוכחי (fxWant ב-fxworld.js). עם ליבה: כלום, היא מציירת
function wxwTiles(){if(!WXW.on||wxwCore())return[];const T=WXW.tiles[wxwReg()];if(!T)return[];
  return(WXW.st==='calm'&&WXW.reg==='village'&&T['calm_'+WXW.mood])||T[WXW.st]||[]}

/* אובך החול (WXW.sand): נצבע מיד אחרי שכבת מזג האוויר של הליבה, באותו מקום (מתחת לדמויות בדו-ממד, ומעל התלת-ממד).
   מילוי אחד של המסך עם שיפוע עגול: שקוף סביב הגיבור, צבע חול בשוליים. רק במדבר, ורק כשיש סערה */
function wxwWrap(){
  if(WXW.wrapped||typeof wxDraw!=='function')return;WXW.wrapped=true;   // weather.js נטען אחרי הקובץ הזה, אז עוטפים בפעם הראשונה שמגיעים לעולם
  const old=window.wxDraw;window.wxDraw=function(){const was=typeof WX!=='undefined'?WX.drawn:0,r=old.apply(this,arguments);
    try{if(typeof WX!=='undefined'&&WX.drawn!==was&&WX.scene==='world')wxwSand()}catch(e){}return r};
}
function wxwSand(){
  const Sd=WXW.sand,now=performance.now(),dt=Math.min(0.25,(now-(WXW.sandLast||now))/1000);WXW.sandLast=now;
  const want=WXW.on&&S&&S.wd&&WXW.reg===Sd.reg?(Sd.a[WXW.st]||0)*(wxwFight()?WXW.fight:1)*(wxwCalm()?Sd.less:1):0;
  WXW.sandA+=(want-WXW.sandA)*Math.min(1,dt/Sd.fade);if(WXW.sandA<0.01||!P)return;
  const m=ctx.getTransform(),cv=ctx.canvas,hx=m.a*P.x+m.c*P.y+m.e,hy=m.b*P.x+m.d*P.y+m.f,sc=Math.hypot(m.a,m.b)||1,r0=Sd.hole*sc,r1=Math.max(cv.width,cv.height)*0.7,a=WXW.sandA;
  const g=ctx.createRadialGradient(hx,hy,r0,hx,hy,Math.max(r0+1,r1));
  g.addColorStop(0,'rgba('+Sd.col+',0)');g.addColorStop(0.35,'rgba('+Sd.col+','+(a*0.55).toFixed(3)+')');g.addColorStop(1,'rgba('+Sd.col+','+a.toFixed(3)+')');
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle=g;ctx.fillRect(0,0,cv.width,cv.height);ctx.restore();
  WXW.stat.sand++;
}
