/* מזג אוויר לכל המשחק (WEATHER, אוראל 7.11.2026): שכבת אווירה אחת, מגיליונות weather-fx-pack-vol1 (fxlib.js).
   "Weather is not a one-screen gimmick, it's an atmosphere layer for the whole game": עולם, משחקי השאול, זירה, בוס, כפר ותפריט.
   שימוש:
     setWeather('rain_light','auto',0.6)          שכבה על כל המסך (שקופה, מעל הסצנה). theme: temperate/tropical/arctic/dusk/night או 'auto' לפי שעת המשחק
     setWeather('fog_drift','night',1,{slot:'b',kind:'low'})   כמה שכבות: slot לכל אחת. setWeather(null) מוריד (בדעיכה)
     wxPoint('rain_puddle',x,y,{size:90})          אפקט בנקודה בעולם: שלולית, פתית, ברק
     wxFlash(0.3)  הבזק ברק על כל המסך.  wxBolt(x,y)  ברק בנקודה + הבזק קטן
   השם המלא של גיליון: wx_<variant>_<theme> (למשל wx_rain_light_night) ב-FXDATA. אם הוא עוד לא הומר, wxRes בוחר את הקרוב:
   אותו variant בנושא אחר, variant דומה (WEATHER.near), ובסוף גיליון ישן (WEATHER.alias). כך גיליון חדש נכנס בלי לשנות קוד.
   תמיד מתחת לקרב: בתלת-ממד נצבע מיד אחרי שכבת התלת-ממד ולפני כל מה שבקנבס (render.js), בדו-ממד אחרי הדמויות ולפני הסקילים,
   האפקטים (fxDraw), המספרים והממשק. במשחקי השאול בדו-ממד: אחרי הרצפה (עוטף את mbDecor2d).
   מכונת מצבים לכל סצנה: calm → build → storm → clear → calm (WEATHER.scenes). בעולם FXW (fxworld.js) מוסר לכאן את מזג האוויר שלו (wxWorld, wxFlash).
   טלפון קודם: רק גיליונות, עד WEATHER.max שכבות, כולן מצוירות לקנבס קטן (K) שמתעדכן רק כשפריים מתחלף, ומשם מתיחה אחת למסך.
   במסך קטן שקוף יותר ופחות פריימים. כשהלשונית מוסתרת (document.hidden) הכל עוצר. בלי הקבצים: לא מצויר כלום, והמשחק רץ כרגיל. */
const WEATHER={
  on:true,
  max:3,maxSmall:2,maxPts:6,   // כמה שכבות על כל המסך בבת אחת, וכמה אפקטים בנקודה
  small:1000,                  // רוחב חלון (פיקסלי CSS) שמתחתיו המסך "קטן"
  fps:18,fpsSmall:12,          // מזג אוויר לא צריך 30 פריימים, והקנבס הקטן מתעדכן רק כשהפריים מתחלף
  alphaSmall:0.82,             // במסך קטן: שקוף יותר, כדי שהקרב נקרא
  K:0.5,Ksmall:0.4,            // רזולוציית הקנבס הקטן מתוך המסך
  fade:1.6,                    // שניות לדעיכה בין מצבים
  sync:0.3,                    // כל כמה שניות מחשבים מחדש מה צריך להיות
  themes:['temperate','tropical','arctic','dusk','night'],
  tod:{dusk:[17.5,20.5],night:[20.5,5.5],morning:[5.5,10]},   // שעות המשחק (VFX.hour)
  winter:[11,0,1],             // חודשים (getMonth) של "עונת השלג" בכפר
  // variant חסר: variant דומה. ואחרי זה גיליון ישן שכבר בריפו
  near:{rain_torrent:'rain_heavy',rain_heavy:'rain_light',rain_drip:'rain_light',snow_heavy:'snow_light',snow_blizzard:'snow_heavy',snow_settle:'snow_light',
    wind_gust:'wind_breeze',cloud_dark:'storm_cloud',storm_cloud:'cloud_dark',mist_rise:'fog_drift',fog_burst:'fog_drift',cloud_pass:'fog_drift'},
  alias:{rain_light:'rain',rain_heavy:'wx_rainheavy',snow_light:'snow',snow_blizzard:'wx_blizzard',wind_dust:'wx_dust',wind_tornado:'wx_devil',
    wind_petals:'wx_petals',fog_drift:'wx_fog',sun_rays:'wx_sunrays',lightning_bolt:'wx_bolt',lightning_flash:'wx_flash'},
  // איפה כל variant מצויר על המסך: full אריחים על הכל, sky פס עליון, low חלק תחתון, top אחד גדול למעלה, one אחד על כל המסך
  kind:{rain:'full',snow:'full',snow_settle:'low',wind:'full',wind_dust:'low',fog:'low',mist_rise:'low',cloud:'sky',storm_cloud:'sky',sun_rays:'top',rainbow:'top',lightning_flash:'one'},
  add:{wx_bolt:1,wx_blizzard:1,wx_sunrays:1,wx_flash:1,lightning_flash:1,lightning_bolt:1,sun_rays:1},   // רקע אפור או אור: מצוירים כתוספת אור
  soft:['wx_sunrays','wx_bolt','wx_fog'],   // שוליים מרוככים (מסכה עגולה), כדי שלא ייראה מלבן
  flash:{a:0.32,fps:40,gap:1.2},bolt:{size:220,a:0.9,gap:4},
  // הסצנות. שכבה: [variant, kind או '', שקיפות, מתי]. מתי: day / night / morning / winter / exact (רק אם הגיליון המדויק קיים)
  // k: מכפיל שקיפות לכל הסצנה. theme: נושא קבוע (אחרת לפי השעה). cycle: זמנים לכל מצב [מינ', מקס'] ו-chance לסערה אחרי רגוע
  scenes:{
    menu:{k:1,theme:'night',calm:[['mist_rise','low',0.6],['fog_drift','low',0.4]]},
    village:{k:0.8,cycle:{calm:[70,150],build:[8,12],storm:[25,45],clear:[9,12],chance:0.55},
      calm:[['sun_rays','',0.45,'morning'],['wind_petals','',0.35,'day'],['snow_settle','',0.45,'winter exact']],
      build:[['cloud_dark','',0.3],['fog_drift','',0.25]],
      storm:[['rain_light','',0.42],['cloud_dark','',0.22]],ev:{storm:{puddle:[0.8,1.8]}},
      clear:[['rainbow','',0.6,'day exact'],['sun_rays','',0.4,'day']]},
    // עולם: מה ש-FXW מוסר לכל אזור (wxWorld), ועוד המספרים כאן לכל אזור. meadow גם סערה אקראית
    world:{k:1,
      meadow:{cycle:{calm:[90,200],build:[10,14],storm:[25,40],clear:[8,10],chance:0.35},
        build:[['cloud_dark','',0.28]],storm:[['rain_heavy','',0.4],['storm_cloud','',0.28]],ev:{storm:{flash:[8,16],bolt:[10,20]}},
        clear:[['rainbow','',0.55,'day exact']]},
      forest:{calm:[['rain_light','',0.28]]},   // ליד יער: טפטוף (FXW.forest)
      ridge:{theme:'arctic'},desert:{theme:'dusk',calm:[['wind_dust','',0.3,'exact']]},storm:{theme:'night',calm:[['storm_cloud','',0.28]]},
      shadow:{theme:'night',calm:[['mist_rise','',0.3,'exact']]}},
    // משחקי השאול: גשם קל בהתחלה שמתחזק לקראת הסוף. שקוף (k), הקריאות קודם. השלב לפי זמן המשחק ומגדלים שנפלו (wxMobaP)
    moba:{k:0.6,theme:'night',
      calm:[['rain_light','',0.35]],build:[['rain_light','',0.45],['cloud_dark','',0.3]],storm:[['rain_heavy','',0.45],['storm_cloud','',0.3]],
      ev:{storm:{flash:[14,26]}},at:{build:0.3,storm:0.65},tower:0.12},
    arena:{k:0.9,calm:[]},
    // בוס: ערפל ועננים בקרב, סערה כשהוא כועס (rage) או בשלב 2, ברק עם המתקפות הגדולות (doPattern), ובסוף קשת
    boss:{k:0.85,theme:'night',build:[['fog_drift','',0.3],['cloud_dark','',0.3]],storm:[['rain_heavy','',0.42],['storm_cloud','',0.3]],
      ev:{storm:{flash:[9,16]}},clear:[['rainbow','',0.6,'exact'],['sun_rays','',0.4]],rage:0.6,clearT:8},
  },
  // FXW (fxworld.js) שולח שמות ישנים: לאיזה variant הם שייכים, כדי שגיליון חדש יחליף אותם לבד
  fromFxw:{snow:'snow_heavy',wx_rainheavy:'rain_heavy',wx_blizzard:'snow_blizzard',rain:'rain_light'},
};
const WX={layers:new Map(),dying:[],pts:[],clk:0,last:0,syncT:0,scene:'',state:'calm',stT:30,ev:{},fxw:null,user:new Map(),img:{},softDone:{},
  cv:null,key:'',drawn:-1,fxAfter:null,menuCv:null,stat:{sets:0,states:[],drawn:0,flash:0,bolt:0,pts:0,capped:0},paused:false,bossT:0,boltT:-9,flashT:-9};

const wxOn=()=>WEATHER.on&&typeof FXDATA!=='undefined';
const wxSmall=()=>typeof innerWidth!=='undefined'&&innerWidth<WEATHER.small;
const wxMax=()=>typeof fxLess==='function'&&fxLess()?1:wxSmall()?WEATHER.maxSmall:WEATHER.max;
const wxHr=()=>typeof VFX!=='undefined'&&VFX.hour?VFX.hour():new Date().getHours();
const wxIn=(h,r)=>r[0]<r[1]?h>=r[0]&&h<r[1]:h>=r[0]||h<r[1];
// הנושא לפי שעת המשחק: יום temperate, שקיעה dusk, לילה night
function wxTheme(){const h=wxHr(),T=WEATHER.tod;return wxIn(h,T.night)?'night':wxIn(h,T.dusk)?'dusk':'temperate'}
const wxNight=()=>wxTheme()==='night';
const wxV=v=>String(v||'').replace(/^weather_/,'');
// variant + theme → id של גיליון שקיים ב-FXDATA, או null. exact: רק הגיליון של ה-variant עצמו (בלי חלופה ישנה)
function wxRes(v,theme,exact){
  if(!wxOn()||!v)return null;v=wxV(v);if(FXDATA[v])return v;   // שם של גיליון קיים (snow, wx_fog): כמו שהוא
  const th=WEATHER.themes.includes(theme)?theme:wxTheme(),order=[th,...['night','dusk','temperate','arctic','tropical'].filter(t=>t!==th)];
  for(let d=0,x=v,seen={};x&&!seen[x]&&d<4;d++){seen[x]=1;for(const t of order)if(FXDATA['wx_'+x+'_'+t])return 'wx_'+x+'_'+t;if(exact)return null;x=WEATHER.near[x]}
  for(let d=0,x=v;x&&d<4;d++){const a=WEATHER.alias[x];if(a&&FXDATA[a])return a;x=WEATHER.near[x]}
  return FXDATA[v]?v:null;
}
const wxKind=v=>{v=wxV(v);const K=WEATHER.kind;return K[v]||K[v.split('_')[0]]||'full'};
// התמונה, ולגיליונות עם רקע: עותק עם שוליים רכים (כמו fxwSoft, בלי getImageData, אז עובד גם מ-file://)
function wxIm(id){
  const im=typeof fxImg==='function'?fxImg(id):null;if(!im||!WEATHER.soft.includes(id))return im;
  if(WX.img[id])return WX.img[id];const D=FXDATA[id],c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
  const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='destination-in';const h=D.s/2;
  for(let k=0;k<D.c*D.r;k++){const x=(k%D.c)*D.s+h,y=Math.floor(k/D.c)*D.s+h,gr=g.createRadialGradient(x,y,h*0.4,x,y,h);gr.addColorStop(0,'#000');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-h,y-h,D.s,D.s)}
  return WX.img[id]=c;
}

/* ---- שכבות ---- */
// spec: {v,theme,a,kind,add,once,fps}. מחליף שכבה באותו slot בדעיכה
function wxSet(slot,sp,store){
  const L=store||WX.layers,old=L.get(slot);
  if(!sp){if(old){L.delete(slot);old.out=1;WX.dying.push(old)}return null}
  const id=wxRes(sp.v,sp.theme,sp.exact);if(!id){if(old){L.delete(slot);old.out=1;WX.dying.push(old)}return null}
  const v=wxV(sp.v),kind=sp.kind||wxKind(v);
  if(old&&old.id===id&&old.kind===kind){old.a=sp.a;return old}
  if(old){old.out=1;WX.dying.push(old)}
  const f={slot,id,v,D:FXDATA[id],kind,a:sp.a,add:sp.add!=null?!!sp.add:!!(WEATHER.add[id]||WEATHER.add[v]),
    once:!!sp.once,fps:sp.fps||0,t0:WX.clk,cur:sp.once?1:0,out:0};
  L.set(slot,f);return f;
}
// ציבורי: שכבה קבועה (עד שמורידים), מעל מה שהסצנה בוחרת
function setWeather(variant,theme,intensity,o){
  o=o||{};const slot=o.slot||'main';WX.stat.sets++;
  if(!variant){WX.user.delete(slot);wxSet('u:'+slot,null);return null}
  const sp={v:variant,theme:theme&&theme!=='auto'?theme:wxTheme(),a:Math.max(0,Math.min(1,intensity==null?1:intensity))*(o.alpha||0.5),kind:o.kind,add:o.add,exact:o.exact};
  WX.user.set(slot,sp);return wxSet('u:'+slot,sp);
}
// אפקט בנקודה בעולם (שלולית, פתית, ברק). מצויר בשכבת מזג האוויר, כלומר מתחת לסקילים
function wxPoint(variant,x,y,o){
  o=o||{};if(!wxOn()||WX.paused)return null;const id=wxRes(variant,o.theme||wxTheme(),o.exact);if(!id)return null;
  if(WX.pts.length>=WEATHER.maxPts)WX.pts.shift();
  const v=wxV(variant),p={id,D:FXDATA[id],x,y,size:o.size||FXDATA[id].s,a:o.alpha==null?0.85:o.alpha,add:o.add!=null?!!o.add:!!(WEATHER.add[id]||WEATHER.add[v]),t0:WX.clk,fps:o.fps||24,loop:!!o.dur,dur:o.dur||0};
  WX.pts.push(p);WX.stat.pts++;return p;
}
// הבזק ברק על כל המסך: קצר, פעם ב-gap לכל היותר. לא כשביקשו פחות תנועה או 'פחות אפקטים'
function wxFlash(a,id){
  if(!wxOn()||WX.paused||typeof RM!=='undefined'&&RM||typeof fxLess==='function'&&fxLess())return null;
  if(WX.clk-WX.flashT<WEATHER.flash.gap)return null;WX.flashT=WX.clk;WX.stat.flash++;
  return wxSet('flash',{v:id||'lightning_flash',theme:'night',a:(a||WEATHER.flash.a)*wxSceneK(),kind:'one',add:true,once:true,fps:WEATHER.flash.fps});
}
// ברק בנקודה (בוס, סערה בעולם) + הבזק חלש
function wxBolt(x,y,o){
  o=o||{};if(WX.clk-WX.boltT<WEATHER.bolt.gap)return null;WX.boltT=WX.clk;WX.stat.bolt++;
  const B=WEATHER.bolt,p=wxPoint('lightning_bolt',x,y-(o.size||B.size)*0.35,{size:o.size||B.size,alpha:B.a*wxSceneK(),add:true,fps:30,theme:'dusk'});
  wxFlash(WEATHER.flash.a*0.6);return p;
}
// FXW (fxworld.js) מוסר את מזג האוויר של האזור: [[id,שקיפות,kind,when],...] ומשב (gust) אם יש
function wxWorld(reg,list,gust,night){WX.fxw={reg,list:list||[],gust:gust||null,night:!!night,t:WX.clk}}
// הגיליונות שמזג האוויר של FXW יציג עכשיו (לבדיקה): אחרי ההחלפה לשמות החדשים ולפי הנושא
function wxWorldIds(){const F=WX.fxw;if(!F)return [];const Gu=F.gust;return F.list.filter(l=>l[3]!=='night'||F.night).map(([id0])=>{const id=Gu&&id0===Gu.from?Gu.to:id0;return wxRes(WEATHER.fromFxw[id]||id,F.reg==='ridge'?'arctic':wxTheme())}).filter(Boolean)}

/* ---- הסצנה ומכונת המצבים ---- */
function wxSceneName(){
  if(typeof S==='undefined'||!S)return '';
  if(S.mode==='title'){const o=typeof $==='function'&&$('ovStart');return o&&!o.hidden?'menu':''}
  if(S.mb)return 'moba';if(S.vil)return 'village';if(S.wd)return 'world';
  if(S.boss||WX.bossT>0)return 'boss';return 'arena';
}
function wxSceneK(){const c=WEATHER.scenes[WX.scene];return c&&c.k||1}
function wxGo(st){if(st===WX.state)return;WX.state=st;WX.ev={};const St=WX.stat.states;if(St[St.length-1]!==st){St.push(st);if(St.length>12)St.shift()}
  const c=wxCfg(),cy=c&&c.cycle;WX.stT=cy&&cy[st]?rand(...cy[st]):30;WX.syncT=0}
// הגדרות הסצנה, ובעולם: של האזור (מכסה מעל ההגדרות הכלליות של העולם)
function wxCfg(){const c=WEATHER.scenes[WX.scene];if(!c)return null;if(WX.scene!=='world')return c;const r=WX.fxw&&WX.fxw.reg||'meadow';return c[r]||{}}   // אזור בלי הגדרות: רק מה ש-FXW מוסר
function wxWhen(w){if(!w)return true;const th=wxTheme();
  for(const k of w.split(' ')){if(k==='day'&&th==='night')return false;if(k==='night'&&th!=='night')return false;if(k==='morning'&&!wxIn(wxHr(),WEATHER.tod.morning))return false;
    if(k==='winter'&&!WEATHER.winter.includes(new Date().getMonth()))return false}return true}
// השלב במשחקי השאול: 0 בהתחלה, 1 בסוף, ועוד קצת לכל מגדל שנפל
function wxMobaP(){const M=typeof MB!=='undefined'&&MB;if(!M)return 0;const T=typeof MOBA!=='undefined'&&MOBA.maxT||720;
  const down=(M.u||[]).filter(u=>(u.k==='tower'||u.k==='base')&&u.dead).length;return Math.min(1,(M.t||0)/T+down*WEATHER.scenes.moba.tower)}
function wxDrive(dt){
  const sc=WX.scene,c=wxCfg();
  if(sc==='moba'){const p=wxMobaP(),A=c.at;wxGo(p>=A.storm?'storm':p>=A.build?'build':'calm');return}
  if(sc==='boss'){const b=S.boss;if(b){wxGo(b.rage>=c.rage||b.phase>1?'storm':'build')}else{if(WX.state!=='clear')wxGo('clear');WX.bossT-=dt}return}
  if(sc==='world'&&WX.fxw&&WX.fxw.reg==='storm'){wxGo('storm');return}
  const cy=c&&c.cycle;if(!cy){if(WX.state!=='calm')wxGo('calm');return}
  if((WX.stT-=dt)>0)return;
  const nx={calm:Math.random()<cy.chance?'build':'calm',build:'storm',storm:'clear',clear:'calm'}[WX.state]||'calm';
  if(nx===WX.state)WX.stT=rand(...cy.calm);else wxGo(nx);
}
// מה צריך להיות עכשיו: רשימה לפי חשיבות (הראשון הכי חשוב)
function wxWant(){
  const c=wxCfg(),out=[];if(!c&&WX.scene!=='world')return out;
  const sc=WEATHER.scenes[WX.scene],k=sc.k||1,theme=(c&&c.theme)||sc.theme||wxTheme(),st=WX.state;
  const add=(L,pre)=>{for(const [v,kind,a,w] of L||[]){if(!wxWhen(w))continue;out.push({slot:pre+v,v,theme,a:a*k,kind:kind||undefined,exact:/exact/.test(w||'')})}};
  if(WX.scene==='world'){
    const F=WX.fxw;if(F&&WX.clk-F.t<2){const Gu=F.gust;
      for(const [id0,a,kind,when] of F.list){if(when==='night'&&!F.night)continue;const g=Gu&&id0===Gu.from,id=g?Gu.to:id0;
        out.push({slot:'f:'+id0,v:WEATHER.fromFxw[id]||id,theme,a:(g?Gu.a:a)*k,kind,add:g&&Gu.add?true:undefined})}}
    if(typeof FXW!=='undefined'&&FXW.forest&&st==='calm')add(sc.forest.calm,'s:');
  }
  add(c&&c[st],'s:');
  if(st!=='calm'&&WX.scene!=='moba'&&WX.scene!=='boss')add((c&&c.calm||[]).filter(l=>/exact/.test(l[3]||'')),'s:');   // נשאר גם בסערה: שכבות קבועות של המקום
  return out;
}
function wxSync(){
  const want=wxWant(),max=wxMax(),seen=new Set();let n=0;
  // שכבות של setWeather קודם, אחר כך הסצנה. מעל max: הפחות חשובים לא נכנסים
  for(const [slot,sp] of WX.user){if(n>=max)break;if(WX.layers.has('u:'+slot)){seen.add('u:'+slot);n++}}
  for(const w of want){if(seen.has(w.slot))continue;if(n>=max-(WX.layers.has('flash')?1:0)){WX.stat.capped++;continue}if(wxSet(w.slot,w)){seen.add(w.slot);n++}}
  for(const [k] of WX.layers)if(!seen.has(k)&&k!=='flash')wxSet(k,null);
  while(WX.dying.length&&WX.layers.size+WX.dying.length>max+1)WX.dying.shift();   // תקרה: מה שדועך נזרק קודם
}
// אירועים בתוך מצב: הבזקים, ברקים, שלוליות
function wxEvents(dt){
  const c=wxCfg(),E=c&&c.ev&&c.ev[WX.state];if(!E||typeof P==='undefined'||!P)return;
  for(const k in E){if(WX.ev[k]==null)WX.ev[k]=rand(...E[k])*0.5;if((WX.ev[k]-=dt)>0)continue;WX.ev[k]=rand(...E[k]);
    const cw=typeof W!=='undefined'?W:900,ch=typeof H!=='undefined'?H:420,x=S.cam.x+rand(-cw*0.4,cw*0.4),y=S.cam.y+rand(-ch*0.3,ch*0.35);
    if(k==='flash')wxFlash();
    else if(k==='bolt'&&Math.hypot(x-P.x,y-P.y)>160)wxBolt(x,y);
    else if(k==='puddle')wxPoint('rain_puddle',x,y,{size:rand(70,110),alpha:0.7,exact:true,fps:18})}
}
// כל פריים (מתוך wxDraw): שעון משלו שעוצר כשהלשונית מוסתרת
function wxTick(){
  const now=typeof FRAME_T!=='undefined'?FRAME_T:performance.now(),rd=Math.min(0.25,Math.max(0,(now-(WX.last||now))/1000)),dt=Math.min(0.05,rd);WX.last=now;   // rd: זמן אמיתי לדעיכה, גם כשהפריימים איטיים
  WX.paused=typeof document!=='undefined'&&!!document.hidden;if(WX.paused||!wxOn())return false;
  WX.clk+=dt;
  const sc=wxSceneName();if(sc!==WX.scene){WX.scene=sc;WX.pts.length=0;WX.state='';wxGo(sc==='boss'?'build':'calm');for(const k of [...WX.layers.keys()])if(!k.startsWith('u:'))wxSet(k,null)}
  if(S&&S.boss&&!S.wd&&!S.mb)WX.bossT=WEATHER.scenes.boss.clearT;
  if(sc){wxDrive(dt);wxEvents(dt)}
  if((WX.syncT-=dt)<=0){WX.syncT=WEATHER.sync;wxSync()}
  // דעיכה
  const fd=rd/WEATHER.fade;for(const f of WX.layers.values())if(!f.once)f.cur=Math.min(1,f.cur+fd);
  WX.dying=WX.dying.filter(f=>(f.cur-=fd*1.5)>0);
  return true;
}
const wxFrameI=(f,fps)=>{const i=Math.floor((WX.clk-f.t0)*(f.fps||fps));if(f.once)return i<f.D.n?i:-1;return i%f.D.n};

/* ---- ציור ---- */
// שכבה אחת על המסך (ביחידות של המשחק, w×h)
function wxLayer(g,f,i,w,h,k){
  const im=wxIm(f.id);if(!im)return;const D=f.D,sx=(i%D.c)*D.s,sy=Math.floor(i/D.c)*D.s,a=f.a*f.cur*k;if(a<=0.01)return;
  g.globalAlpha=Math.min(1,a);g.globalCompositeOperation=f.add?'lighter':'source-over';
  const tile=(x,y,s,fl)=>{if(fl){g.save();g.translate(x,y);g.scale(-1,1);g.drawImage(im,sx,sy,D.s,D.s,-s/2,-s/2,s,s);g.restore()}else g.drawImage(im,sx,sy,D.s,D.s,x-s/2,y-s/2,s,s)};
  switch(f.kind){
    case 'sky':{const s=w/2;tile(w/2-s/2,s*0.32,s);tile(w/2+s/2,s*0.32,s,1);break}
    case 'low':{const s=w/2.2;tile(w/2-s*0.55,h-s*0.32,s);tile(w/2+s*0.55,h-s*0.32,s,1);break}
    case 'top':{const s=Math.min(w*0.62,h*1.3);tile(w/2,s*0.36,s);break}
    case 'one':{const s=Math.max(w,h)*1.15;tile(w/2,h/2,s);break}
    default:{const s=Math.max(w/2,h),c=Math.ceil(w/s),r=Math.ceil(h/s);for(let x=0;x<c;x++)for(let y=0;y<r;y++)tile(w/2+(x-(c-1)/2)*s,h/2+(y-(r-1)/2)*s,s,(x+y)%2===1)}
  }
}
// כל השכבות לקנבס קטן (רק כשפריים או שקיפות השתנו), ומשם מתיחה אחת ל-ctx
function wxOverlays(dst,cw,ch,scale){
  const fps=wxSmall()?WEATHER.fpsSmall:WEATHER.fps,k=wxSmall()?WEATHER.alphaSmall:1,L=[...WX.dying,...WX.layers.values()],fr=[];let key='';
  for(const f of L){const i=wxFrameI(f,fps);if(i<0){if(WX.layers.get(f.slot)===f)WX.layers.delete(f.slot);continue}fr.push([f,i]);key+=f.id+i+'|'+Math.round(f.cur*f.a*40)+f.kind+';'}
  if(!fr.length)return 0;
  const K=wxSmall()?WEATHER.Ksmall:WEATHER.K,pw=Math.max(1,Math.round(dst.canvas.width*K)),ph=Math.max(1,Math.round(dst.canvas.height*K));
  let c=dst===WX.menuG?WX.menuOff:WX.cv;if(!c){c=document.createElement('canvas');if(dst===WX.menuG)WX.menuOff=c;else WX.cv=c}
  key+=pw+'x'+ph;
  if(c.width!==pw||c.height!==ph){c.width=pw;c.height=ph;c.key=''}
  if(c.key!==key){c.key=key;const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,pw,ph);g.setTransform(scale*K,0,0,scale*K,0,0);for(const [f,i] of fr)wxLayer(g,f,i,cw,ch,k)}
  dst.save();dst.setTransform(1,0,0,1,0,0);dst.globalAlpha=1;dst.globalCompositeOperation='source-over';dst.drawImage(c,0,0,dst.canvas.width,dst.canvas.height);dst.restore();
  return fr.length;
}
// אפקטים בנקודה (בקואורדינטות העולם, ctx כבר מוזז)
function wxPts(){
  let j=0;for(const p of WX.pts){const age=WX.clk-p.t0,i=Math.floor(age*p.fps);if(p.dur?age>p.dur:i>=p.D.n)continue;WX.pts[j++]=p;
    if(typeof fxSeen==='function'&&!fxSeen(p.x,p.y))continue;const im=wxIm(p.id);if(!im)continue;const D=p.D,n=i%D.n,s=p.size;
    ctx.globalAlpha=p.a;ctx.globalCompositeOperation=p.add?'lighter':'source-over';ctx.drawImage(im,(n%D.c)*D.s,Math.floor(n/D.c)*D.s,D.s,D.s,p.x-s/2,p.y-s/2,s,s)}
  WX.pts.length=j;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
// תפריט: קנבס משלו בתוך מסך הפתיחה, מתחת לחלון (z-index:-1 בתוך השכבה של ה-overlay)
function wxMenu(on){
  const o=typeof $==='function'&&$('ovStart');if(!o)return;
  let c=WX.menuCv;if(!on){if(c&&!c.hidden){c.hidden=true}return}
  if(!c){c=WX.menuCv=document.createElement('canvas');c.id='wxMenu';c.setAttribute('aria-hidden','true');c.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1';o.insertBefore(c,o.firstChild);WX.menuG=c.getContext('2d')}
  c.hidden=false;const w=Math.round(innerWidth*0.5),h=Math.round(innerHeight*0.5);if(c.width!==w||c.height!==h){c.width=w;c.height=h;if(WX.menuOff)WX.menuOff.key=''}
  WX.menuG.clearRect(0,0,w,h);WX.stat.drawn=wxOverlays(WX.menuG,innerWidth,innerHeight,0.5);
}
/* נקרא מ-render.js. where: 'base' בתלת-ממד מיד אחרי שכבת התלת-ממד (לפני כל מה שבקנבס),
   'mid' בדו-ממד אחרי הדמויות ולפני הסקילים, 'mb2d' במשחקי השאול בדו-ממד אחרי הרצפה. רק אחד מהם מצייר בכל פריים */
function wxDraw(where){
  if(typeof S==='undefined'||!S||typeof ctx==='undefined')return;
  const mb3=!S.mb||typeof mb3dHere!=='function'||mb3dHere(),R=typeof R3D!=='undefined'&&R3D.on;
  if(where==='base'?!(R&&mb3):where==='mid'?(S.mb||R):!(S.mb&&!mb3))return;
  const ft=typeof FRAME_T!=='undefined'?FRAME_T:0;if(WX.drawn===ft)return;
  if(!wxTick())return;WX.drawn=ft;
  if(WX.scene==='menu'){wxMenu(true);return}wxMenu(false);
  const sx=typeof DPR!=='undefined'?DPR*(typeof ZOOM!=='undefined'?ZOOM:1):1;
  WX.stat.drawn=wxOverlays(ctx,W,H,sx);
  ctx.save();wxPts();ctx.restore();
}
// כשהמסך הראשי לא מצויר בכלל (מסך הפתיחה בלי שחקן): עדיין מתקתק
function wxIdle(){if(WX.drawn!==(typeof FRAME_T!=='undefined'?FRAME_T:0)&&wxSceneName()==='menu'&&wxTick()){WX.drawn=FRAME_T;wxMenu(true)}}

/* ---- חיבורים מבחוץ: הפונקציה המקורית רצה כמו שהיא ---- */
(()=>{
  const wrap=(name,after)=>{const old=window[name];if(typeof old!=='function')return;window[name]=function(){const r=old.apply(this,arguments);try{after(r,...arguments)}catch(e){}return r}};
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{WX.paused=document.hidden});
  // בדיקת סדר: האם מזג האוויר כבר צויר בפריים הזה כשהאפקטים (fxDraw) מצוירים
  {const old=window.fxDraw;if(typeof old==='function')window.fxDraw=function(){WX.fxAfter=WX.drawn===(typeof FRAME_T!=='undefined'?FRAME_T:0);return old.apply(this,arguments)}}
  // משחקי השאול בדו-ממד: אחרי הרצפה והקישוטים, לפני היחידות והסקילים
  wrap('mbDecor2d',()=>wxDraw('mb2d'));
  // מגדל או בסיס נפלו: הבזק ברק
  wrap('mbDie',(r,t)=>{if(t&&t.dead&&(t.k==='tower'||t.k==='base'))wxFlash(0.42)});
  // בוס: ברק עם המתקפה הגדולה, על הבוס
  wrap('doPattern',(r,b)=>{if(b&&S&&b===S.boss&&!S.wd&&!S.mb)wxBolt(b.x,b.y)});
  // מסך הפתיחה: render() יוצא מוקדם כשאין שחקן
  wrap('hud',()=>wxIdle());
})();
