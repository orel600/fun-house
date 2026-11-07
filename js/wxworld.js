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
    ridge:{theme:'arctic',calm:[['snow_heavy',0.45]],building:[['snow_heavy',0.65],['wind_gust',0.35]],storm:[['snow_blizzard',0.75]],clearing:[['snow_light',0.4]],events:1},
    desert:{theme:'dusk',calm:[['wind_dust',0.35]],building:[['wind_dust',0.55]],storm:[['wind_tornado',0.55],['wind_dust',0.65]],clearing:[['wind_dust',0.25]],events:1},   // סופת חול עם עמודי אבק
    storm:{calm:[['rain_heavy',0.6],['storm_cloud',0.6]],building:[['rain_heavy',0.6],['storm_cloud',0.6]],storm:[['rain_torrent',0.65],['storm_cloud',0.65]],clearing:[['rain_heavy',0.5],['storm_cloud',0.5]],always:'storm',bolts:1,ev:{storm:{bolt:[5,11],flash:[7,14]}}},
    lake:{calm:[['fog_drift',0.35]],building:[['fog_drift',0.45],['cloud_pass',0.35]],storm:[['rain_heavy',0.5],['fog_drift',0.4]],clearing:[['mist_rise',0.35]],events:1},
    shadow:{calm:[['mist_rise',0.3]],building:[['mist_rise',0.3]],storm:[['mist_rise',0.3]],clearing:[['mist_rise',0.3]]},
    // הכפר: נעים. calm מתחלף בכל סבב (sun בבוקר, breeze, ולפעמים snow), storm הוא גשם קל עם שלוליות, ו-clearing קשת
    village:{calm:[['wind_petals',0.3]],building:[['cloud_pass',0.35]],storm:[['rain_light',0.4],['rain_puddle',0.4]],clearing:[['rain_drip',0.3],['rainbow',0.55,{when:'day'}],['sun_rays',0.3,{when:'day'}]],events:1,
      calmPick:{breeze:[['sun_rays',0.35,{when:'morning'}],['wind_petals',0.35,{when:'day'}],['wind_breeze',0.25]],snow:[['snow_settle',0.35],['snow_light',0.25]]},snowOdds:0.15,
      ev:{storm:{puddle:[2.5,5]}}}
  },
  cycle:{calm:[70,140],building:[12,18],storm:[25,45],clearing:[14,20]},   // שניות בכל מצב (זמן משחק)
  next:{calm:'building',building:'storm',storm:'clearing',clearing:'calm'},
  bolt:[6,13],   // ברק בסערה (cfg.ev של הליבה), באזורים עם bolts
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
  st:'calm',t:40,key:'',reg:'',mood:'breeze',sent:'',live:false
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
  for(const s of ['calm','building','storm','clearing'])c[s]=R[s];if(R.calmPick)c.calm=R.calmPick[WXW.mood]||R.calm;
  c.ev=R.ev||(R.bolts?{storm:{bolt:WXW.bolt}}:undefined);return c}
function wxwUpdate(dt){
  if(!WXW.on)return;
  const reg=wxwReg(),R=WXW.scene[reg]||WXW.scene.meadow;
  if(reg!==WXW.reg){const was=WXW.reg;WXW.reg=reg;   // אזור חדש: מתחילים רגוע (יער ↔ אחו ממשיכים באותו מצב)
    if(!(was==='forest'&&reg==='meadow'||was==='meadow'&&reg==='forest'))wxwSet(R.always||'calm')}
  if(R.always)WXW.st=R.always;
  else if(R.events&&(WXW.t-=dt)<=0)wxwSet(WXW.next[WXW.st]);
  WXW.live=true;
  // לליבה: הסצנה של המקום ('world' או 'village'). רישום מחדש כשהאזור, הערכה או מצב הרוח מתחלפים (הליבה שומרת את המצב), ומצב כשהוא משתנה
  if(wxwCore()){const name=S.wd?'world':'village',c=wxwCfg(reg),key=name+'|'+reg+'|'+c.theme+'|'+WXW.mood;
    try{if(key!==WXW.key){WXW.key=key;weatherScene(name,c);WXW.sent=''}
      if(WXW.sent!==WXW.st&&typeof weatherState==='function'){WXW.sent=WXW.st;weatherState(WXW.st,name)}}catch(e){}}
}
// יציאה מהעולם ומהכפר (זירה, משחקי השאול, תפריט)
// הליבה מחליפה סצנה לבד לפי המקום (wxPlace), אז כאן רק מאפסים, כדי שבחזרה הסצנה תירשם מחדש
function wxwLeave(){if(!WXW.live)return;WXW.live=false;WXW.key='';WXW.reg=''}
// בלי ליבה: אריחים נוספים למצב הנוכחי (fxWant ב-fxworld.js). עם ליבה: כלום, היא מציירת
function wxwTiles(){if(!WXW.on||wxwCore())return[];const T=WXW.tiles[wxwReg()];if(!T)return[];
  return(WXW.st==='calm'&&WXW.reg==='village'&&T['calm_'+WXW.mood])||T[WXW.st]||[]}
