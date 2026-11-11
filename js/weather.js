/* מזג אוויר לכל המשחק (WEATHER, אוראל 7.11.2026): הליבה. שכבת אווירה אחת מגיליונות weather-fx-pack-vol1 (fx/wx_<variant>_<theme>.webp).
   "Weather is not a one-screen gimmick, it's an atmosphere layer for the whole game".
   ה-API (קבוע: סשנים אחרים מחברים דרכו את העולם, הכפר, משחקי השאול, הזירה והבוס, תמיד דרך typeof):
     setWeather(variant,theme,intensity,opt)  שכבה על כל המסך. variant בלי הנושא ('rain_light'). theme: temperate/tropical/arctic/dusk/night/'auto'.
                                              intensity 0..1. opt: {fade:שניות, slot:שם (כמה שכבות), kind:full/sky/low/top/one}. setWeather(null) מוריד
     weatherScene(name,cfg)                   מכונת מצבים לסצנה. cfg={calm:[[variant,intensity],...],building:[...],storm:[...],clearing:[...],theme,auto}
                                              auto:true = מחזור לבד (calm → building → storm → clearing → calm). name: המקום שבו היא פעילה:
                                              village, world, moba, arena, boss, menu (wxPlace). פריט ברשימה יכול לקבל גם [variant,intensity,{kind,when,theme}]
     weatherState(state,name)                 מעביר מצב (calm/building/storm/clearing). בלי name: הסצנה הפעילה
     weatherBolt(x,y,opt)  ברק בנקודה בעולם (+ הבזק חלש).  weatherFlash(a)  הבזק על כל המסך.  weatherClear(fade)  הכל דועך ונעלם
     wxPoint(variant,x,y,opt)                 אפקט בנקודה בעולם: שלולית, פתית, טיפה
   גיליון: wx_<variant>_<theme> ב-FXDATA. חסר? אותו variant ב-temperate, בנושא אחר, variant דומה (WEATHER.near), ובסוף גיליון ישן (WEATHER.alias).
   תמיד מתחת לקרב: בתלת-ממד נצבע מיד אחרי שכבת התלת-ממד ולפני כל מה שבקנבס (render.js). בדו-ממד מיד אחרי הרצפה: בזירה אחרי הקרקע,
   ובכפר ובעולם אחרי drawWorld (שם הקרקע והמבנים), לפני מוקשים, דמויות, סקילים, אזהרות, אפקטים (fxDraw), מספרים וממשק. במשחקי השאול בדו-ממד: אחרי הרצפה (עוטף את mbDecor2d). אפקט בנקודה מצויר באותה שכבה.
   טלפון קודם (לפי MDN, Optimizing canvas): רק גיליונות. עד WEATHER.max שכבות, כולן לקנבס קטן מחוץ למסך (K) שמצויר מחדש רק כשפריים
   או שקיפות משתנים, ומשם drawImage אחד למסך. מיקומים שלמים, בלי shadowBlur ובלי getImageData. במסך קטן שקוף יותר ופחות פריימים.
   כשהלשונית מוסתרת (document.hidden) השעון עוצר. בלי הקבצים: לא מצויר כלום, והמשחק רץ כרגיל. */
const WEATHER={
  on:true,
  max:3,maxSmall:2,maxPts:6,   // כמה שכבות על כל המסך בבת אחת, וכמה אפקטים בנקודה
  small:1000,                  // רוחב חלון (פיקסלי CSS) שמתחתיו המסך "קטן"
  fps:18,fpsSmall:12,          // מזג אוויר לא צריך 30 פריימים, והקנבס הקטן מתעדכן רק כשהפריים מתחלף
  alphaSmall:0.82,             // במסך קטן: שקוף יותר, כדי שהקרב נקרא
  alpha:0.55,                  // intensity 1 = השקיפות הזו
  K:0.5,Ksmall:0.4,            // רזולוציית הקנבס הקטן מתוך המסך
  fade:1.6,                    // שניות לדעיכה, כשלא ביקשו אחרת
  ease:0.8,                    // שניות (בערך) למעבר עוצמה של אותה שכבה, למשל חצי עוצמה בקרב
  sync:0.3,                    // כל כמה שניות מחשבים מחדש מה צריך להיות
  states:['calm','building','storm','clearing'],
  cycle:{calm:[70,150],building:[8,12],storm:[25,45],clearing:[8,11],chance:0.5},   // auto: כמה זמן בכל מצב, והסיכוי לסערה אחרי רגוע
  themes:['temperate','tropical','arctic','dusk','night'],
  tod:{dusk:[17.5,20.5],night:[20.5,5.5],morning:[5.5,10]},   // שעות המשחק (VFX.hour)
  winter:[11,0,1],             // חודשים (getMonth) של 'winter' ב-when
  near:{rain_torrent:'rain_heavy',rain_heavy:'rain_light',rain_drip:'rain_light',snow_heavy:'snow_light',snow_blizzard:'snow_heavy',snow_settle:'snow_light',
    wind_gust:'wind_breeze',cloud_dark:'storm_cloud',storm_cloud:'cloud_dark',mist_rise:'fog_drift',fog_burst:'fog_drift',cloud_pass:'cloud_dark'},
  alias:{rain_light:'rain',rain_heavy:'wx_rainheavy',snow_light:'snow',snow_blizzard:'wx_blizzard',wind_dust:'wx_dust',wind_tornado:'wx_devil',
    wind_petals:'wx_petals',fog_drift:'wx_fog',sun_rays:'wx_sunrays',lightning_bolt:'wx_bolt',lightning_flash:'wx_flash'},
  // איפה כל variant על המסך: full אריחים על הכל, sky פס עליון, low חלק תחתון, top אחד גדול למעלה, one אחד על כל המסך
  kind:{rain:'full',snow:'full',snow_settle:'low',wind:'full',wind_dust:'low',fog:'low',mist_rise:'low',cloud:'sky',storm_cloud:'sky',sun_rays:'top',rainbow:'top',lightning_flash:'one'},
  add:/lightning|sun_rays|blizzard|wx_bolt|wx_flash|wx_sunrays/,   // רקע אפור או אור: מצוירים כתוספת אור
  soft:/lightning_bolt|sun_rays|wx_bolt|wx_sunrays|wx_fog/,        // שוליים מרוככים (מסכה עגולה), כדי שלא ייראה מלבן
  flash:{a:0.32,fps:40,gap:1.2},bolt:{size:220,a:0.9,gap:1.5},
  // הסצנות שהליבה מגדירה בעצמה. השאר (village, world, moba, arena, boss) נרשמות מבחוץ ב-weatherScene
  scenes:{
    menu:{theme:'night',calm:[['mist_rise',1,{kind:'low'}],['fog_drift',0.6,{kind:'low'}]]},   // תפריטים: ערפל עולה עדין מתחת לחלון
  },
  menus:['ovStart','ovHero','ovMoba'],   // חלונות "תפריט": מסך הפתיחה, בחירת דמות, ובחירת גיבור למשחקי השאול (כשאין משחק)
};
const WX={layers:new Map(),dying:[],pts:[],user:new Map(),run:{},clk:0,last:0,syncT:0,scene:'',img:{},cv:null,menuCv:null,menuG:null,menuOff:null,
  drawn:-1,fxAfter:null,paused:false,boltT:-9,flashT:-9,stat:{sets:0,states:[],drawn:0,flash:0,bolt:0,pts:0,capped:0}};

const wxOn=()=>WEATHER.on&&typeof FXDATA!=='undefined';
const wxSmall=()=>typeof innerWidth!=='undefined'&&innerWidth<WEATHER.small;
const wxMax=()=>typeof fxLess==='function'&&fxLess()?1:wxSmall()?WEATHER.maxSmall:WEATHER.max;
const wxHr=()=>typeof VFX!=='undefined'&&VFX.hour?VFX.hour():new Date().getHours();
const wxIn=(h,r)=>r[0]<r[1]?h>=r[0]&&h<r[1]:h>=r[0]||h<r[1];
// הנושא לפי שעת המשחק: יום temperate, שקיעה dusk, לילה night
function wxTheme(){const h=wxHr(),T=WEATHER.tod;return wxIn(h,T.night)?'night':wxIn(h,T.dusk)?'dusk':'temperate'}
const wxV=v=>String(v||'').replace(/^weather_/,'').replace(/^wx_(?=\w+_\w+)/,'');
// variant + theme → id של גיליון שקיים ב-FXDATA, או null. exact: רק אותו variant (בלי variant דומה או גיליון ישן)
function wxRes(v,theme,exact){
  if(!wxOn()||!v)return null;if(FXDATA[v])return v;v=wxV(v);if(FXDATA[v])return v;   // שם של גיליון קיים (snow, wx_fog, wx_rain_light_night): כמו שהוא
  const th=WEATHER.themes.includes(theme)?theme:wxTheme(),order=[th,'temperate',...WEATHER.themes.filter(t=>t!==th&&t!=='temperate')];
  for(let d=0,x=v,seen={};x&&!seen[x]&&d<4;d++){seen[x]=1;for(const t of order)if(FXDATA['wx_'+x+'_'+t])return 'wx_'+x+'_'+t;if(exact)return null;x=WEATHER.near[x]}
  for(let d=0,x=v;x&&d<4;d++){const a=WEATHER.alias[x];if(a&&FXDATA[a])return a;x=WEATHER.near[x]}
  return null;
}
const wxKind=v=>{v=wxV(v);const K=WEATHER.kind;return K[v]||K[v.split('_')[0]]||'full'};
// התמונה, ולגיליונות עם רקע: עותק עם שוליים רכים (drawImage + destination-in, בלי getImageData, אז עובד גם מ-file://)
function wxIm(id){
  const im=typeof fxImg==='function'?fxImg(id):null;if(!im||!WEATHER.soft.test(id))return im;
  if(WX.img[id])return WX.img[id];const D=FXDATA[id],c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
  const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='destination-in';const h=D.s/2;
  for(let k=0;k<D.c*D.r;k++){const x=(k%D.c)*D.s+h,y=Math.floor(k/D.c)*D.s+h,gr=g.createRadialGradient(x,y,h*0.4,x,y,h);gr.addColorStop(0,'#000');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-h,y-h,D.s,D.s)}
  return WX.img[id]=c;
}

/* ---- שכבות ---- */
const wxDie=(f,fade)=>{if(!f)return;if(fade!=null)f.fadeOut=Math.max(0.01,fade);WX.dying.push(f)};
// spec: {v,theme,a,kind,add,once,fps,exact,fade}. מחליף שכבה באותו slot בדעיכה
function wxSet(slot,sp){
  const L=WX.layers,old=L.get(slot);
  const id=sp&&wxRes(sp.v,sp.theme,sp.exact);
  if(!id){if(old){L.delete(slot);wxDie(old,sp&&sp.fade)}return null}
  const v=wxV(sp.v),kind=sp.kind||wxKind(v);
  if(old&&old.id===id&&old.kind===kind){old.to=sp.a;return old}   // אותה שכבה בעוצמה אחרת (למשל קרב, wxworld.js): דועכת לשם, בלי קפיצה
  if(old)wxDie(old,sp.fade);
  const f={slot,id,v,D:FXDATA[id],kind,a:sp.a,add:sp.add!=null?!!sp.add:WEATHER.add.test(id),once:!!sp.once,fps:sp.fps||0,t0:WX.clk,cur:sp.once?1:0,
    fadeIn:sp.fade||WEATHER.fade,fadeOut:sp.fade||WEATHER.fade};
  L.set(slot,f);return f;
}
// שכבה קבועה (עד שמורידים), מעל מה שהסצנה בוחרת
function setWeather(variant,theme,intensity,opt){
  opt=opt||{};const slot=opt.slot||'main';WX.stat.sets++;
  if(!variant){WX.user.delete(slot);wxSet('u:'+slot,{fade:opt.fade});return null}
  const sp={v:variant,theme:theme&&theme!=='auto'?theme:wxTheme(),a:Math.max(0,Math.min(1,intensity==null?1:+intensity))*WEATHER.alpha,kind:opt.kind,add:opt.add,exact:opt.exact,fade:opt.fade};
  WX.user.set(slot,sp);return wxSet('u:'+slot,sp);
}
// אפקט בנקודה בעולם (שלולית, פתית, ברק). מצויר בשכבת מזג האוויר, כלומר מתחת לסקילים
function wxPoint(variant,x,y,o){
  o=o||{};if(!wxOn()||WX.paused)return null;const id=wxRes(variant,o.theme||wxTheme(),o.exact);if(!id)return null;
  if(WX.pts.length>=WEATHER.maxPts)WX.pts.shift();
  const p={id,D:FXDATA[id],x,y,size:o.size||FXDATA[id].s,a:o.alpha==null?0.85:o.alpha,add:o.add!=null?!!o.add:WEATHER.add.test(id),t0:WX.clk,fps:o.fps||24,dur:o.dur||0};
  WX.pts.push(p);WX.stat.pts++;return p;
}
// הבזק ברק על כל המסך: קצר, פעם ב-gap לכל היותר. לא כשביקשו פחות תנועה או 'פחות אפקטים'
function weatherFlash(a,theme){
  if(!wxOn()||WX.paused||typeof RM!=='undefined'&&RM||typeof fxLess==='function'&&fxLess())return null;
  if(WX.clk-WX.flashT<WEATHER.flash.gap)return null;WX.flashT=WX.clk;WX.stat.flash++;
  return wxSet('flash',{v:'lightning_flash',theme:theme||'night',a:a==null?WEATHER.flash.a:a,kind:'one',add:true,once:true,fps:WEATHER.flash.fps});
}
// ברק בנקודה בעולם (בוס, סערה) + הבזק חלש. opt: {size, alpha, flash:false, theme}
function weatherBolt(x,y,opt){
  opt=opt||{};if(!wxOn()||WX.clk-WX.boltT<WEATHER.bolt.gap)return null;WX.boltT=WX.clk;WX.stat.bolt++;
  const B=WEATHER.bolt,s=opt.size||B.size,p=wxPoint('lightning_bolt',x,y-s*0.35,{size:s,alpha:opt.alpha==null?B.a:opt.alpha,add:true,fps:30,theme:opt.theme||wxTheme()});
  if(opt.flash!==false)weatherFlash(WEATHER.flash.a*0.6);return p;
}
// הכל דועך: השכבות של setWeather יורדות, והסצנה הפעילה חוזרת ל-calm
function weatherClear(fade){
  const f=fade==null?WEATHER.fade:fade;WX.user.clear();for(const [k,l] of [...WX.layers]){WX.layers.delete(k);wxDie(l,f)}
  if(WX.scene&&WX.run[WX.scene])wxGo(WX.scene,'calm');WX.syncT=0.05;
}

/* ---- סצנות ומכונת המצבים (State, Game Programming Patterns): לכל מקום מצב נוכחי וזמן שנשאר בו ---- */
// המקום עכשיו, לפי מצב המשחק. השם הזה הוא הסצנה הפעילה
function wxPlace(){
  if(typeof S==='undefined'||!S)return '';
  if(wxMenuOv())return 'menu';
  if(S.mb)return 'moba';if(S.vil)return 'village';if(S.wd)return 'world';
  return S.boss?'boss':'arena';
}
function wxMenuOv(){if(typeof $!=='function')return null;for(const id of WEATHER.menus){const o=$(id);if(o&&!o.hidden&&!(id==='ovMoba'&&typeof S!=='undefined'&&S&&S.mb))return o}return null}
// רישום סצנה. cfg כמו בראש הקובץ. נרשמת שוב = מחליפה את הקודמת (ושומרת את המצב הנוכחי)
function weatherScene(name,cfg){
  if(!name)return null;if(!cfg){delete WEATHER.scenes[name];delete WX.run[name];return null}
  WEATHER.scenes[name]=cfg;if(!WX.run[name])WX.run[name]={state:'calm',t:wxDur(cfg,'calm')};WX.syncT=0;return WX.run[name];
}
const wxDur=(cfg,st)=>{const c=Object.assign({},WEATHER.cycle,cfg&&cfg.times);return c[st]?rand(...c[st]):30};
function wxGo(name,st){
  if(!WEATHER.states.includes(st))return false;const cfg=WEATHER.scenes[name];if(!cfg)return false;
  const R=WX.run[name]||(WX.run[name]={state:'',t:0});if(R.state===st)return true;
  R.state=st;R.t=wxDur(cfg,st);R.ev={};if(name===WX.scene){const H=WX.stat.states;H.push(st);if(H.length>12)H.shift();WX.syncT=0}return true;
}
// מעבר מצב מבחוץ (למשל בוס כועס → storm). בלי name: הסצנה הפעילה
function weatherState(st,name){return wxGo(name||WX.scene,st)}
// auto: המחזור לבד
function wxDrive(name,dt){
  const cfg=WEATHER.scenes[name],R=WX.run[name];if(!cfg||!R||!cfg.auto)return;
  if((R.t-=dt)>0)return;const ch=cfg.chance!=null?cfg.chance:WEATHER.cycle.chance;
  const nx={calm:Math.random()<ch?'building':'calm',building:'storm',storm:'clearing',clearing:'calm'}[R.state]||'calm';
  if(nx===R.state)R.t=wxDur(cfg,'calm');else wxGo(name,nx);
}
function wxWhen(w){if(!w)return true;const th=wxTheme();
  for(const k of String(w).split(' ')){if(k==='day'&&th==='night')return false;if(k==='night'&&th!=='night')return false;if(k==='morning'&&!wxIn(wxHr(),WEATHER.tod.morning))return false;
    if(k==='winter'&&!WEATHER.winter.includes(new Date().getMonth()))return false}return true}
// מה הסצנה רוצה עכשיו: רשימה לפי חשיבות (הראשון הכי חשוב)
function wxWant(){
  const name=WX.scene,cfg=WEATHER.scenes[name],R=WX.run[name],out=[];if(!cfg||!R)return out;
  const theme=cfg.theme&&cfg.theme!=='auto'?cfg.theme:wxTheme();
  for(const e of cfg[R.state]||[]){const [v,I,o={}]=e;if(!v||!wxWhen(o.when))continue;
    out.push({slot:'s:'+v+(o.kind||''),v,theme:o.theme||theme,a:Math.max(0,Math.min(1,I==null?1:+I))*WEATHER.alpha*(cfg.k||1),kind:o.kind,exact:!!o.exact,add:o.add,fade:cfg.fade})}
  return out;
}
function wxSync(){
  const want=wxWant(),max=wxMax(),keep=new Set();let n=0;
  // שכבות של setWeather קודם, אחר כך הסצנה. מעל max: הפחות חשובים לא נכנסים
  for(const [slot] of WX.user){if(n>=max)break;if(WX.layers.has('u:'+slot)){keep.add('u:'+slot);n++}}
  const room=max-(WX.layers.has('flash')?1:0);
  for(const w of want){if(keep.has(w.slot))continue;if(n>=room){WX.stat.capped++;continue}if(wxSet(w.slot,w)){keep.add(w.slot);n++}}
  for(const [k,l] of [...WX.layers])if(!keep.has(k)&&k!=='flash'){WX.layers.delete(k);wxDie(l)}
  while(WX.dying.length&&WX.layers.size+WX.dying.length>max+1)WX.dying.shift();   // תקרה: מה שדועך נזרק קודם
}
// אירועים בתוך מצב (cfg.ev={storm:{flash:[min,max],bolt:[..],puddle:[..]}}): הבזקים, ברקים ושלוליות בזמנים אקראיים
function wxEvents(dt){
  const cfg=WEATHER.scenes[WX.scene],R=WX.run[WX.scene],E=cfg&&cfg.ev&&R&&cfg.ev[R.state];if(!E||typeof P==='undefined'||!P)return;
  const T=R.ev||(R.ev={});
  for(const k in E){if(T[k]==null)T[k]=rand(...E[k])*0.5;if((T[k]-=dt)>0)continue;T[k]=rand(...E[k]);
    const cw=typeof W!=='undefined'?W:900,ch=typeof H!=='undefined'?H:420,x=S.cam.x+rand(-cw*0.4,cw*0.4),y=S.cam.y+rand(-ch*0.3,ch*0.35);
    if(k==='flash')weatherFlash();
    else if(k==='bolt'&&Math.hypot(x-P.x,y-P.y)>160)weatherBolt(x,y);
    else if(k==='puddle')wxPoint('rain_puddle',x,y,{size:rand(70,110),alpha:0.7,fps:18})}
}
// כל פריים (מתוך wxDraw): שעון משלו שעוצר כשהלשונית מוסתרת. rd: זמן אמיתי לדעיכה, גם כשהפריימים איטיים
function wxTick(){
  const now=typeof FRAME_T!=='undefined'?FRAME_T:performance.now(),rd=Math.min(0.25,Math.max(0,(now-(WX.last||now))/1000)),dt=Math.min(0.05,rd);WX.last=now;
  WX.paused=typeof document!=='undefined'&&!!document.hidden;if(WX.paused||!wxOn())return false;
  WX.clk+=dt;
  const sc=wxPlace();if(sc!==WX.scene){WX.scene=sc;WX.pts.length=0;WX.syncT=0;const R=WX.run[sc];if(R){WX.stat.states.push(R.state)}}
  if(WEATHER.scenes[sc]&&!WX.run[sc])weatherScene(sc,WEATHER.scenes[sc]);
  if(sc){wxDrive(sc,dt);wxEvents(dt)}
  if((WX.syncT-=dt)<=0){WX.syncT=WEATHER.sync;wxSync()}
  for(const f of WX.layers.values())if(!f.once){f.cur=Math.min(1,f.cur+rd/f.fadeIn);if(f.to!=null){f.a+=(f.to-f.a)*Math.min(1,rd/WEATHER.ease);if(Math.abs(f.to-f.a)<0.005){f.a=f.to;f.to=null}}}
  WX.dying=WX.dying.filter(f=>(f.cur-=rd/f.fadeOut)>0);
  return true;
}
const wxFrameI=(f,fps)=>{const i=Math.floor((WX.clk-f.t0)*(f.fps||fps));if(f.once)return i<f.D.n?i:-1;return i%f.D.n};

/* ---- ציור ---- */
// שכבה אחת על המסך (w×h ביחידות של המשחק). מיקומים שלמים (MDN: בלי תת-פיקסלים)
function wxLayer(g,f,i,w,h,k){
  const im=wxIm(f.id);if(!im)return;const D=f.D,sx=(i%D.c)*D.s,sy=Math.floor(i/D.c)*D.s,a=f.a*f.cur*k;if(a<=0.01)return;
  g.globalAlpha=Math.min(1,a);g.globalCompositeOperation=f.add?'lighter':'source-over';
  const tile=(x,y,s,fl)=>{s=Math.ceil(s);x=Math.round(x-s/2);y=Math.round(y-s/2);if(fl){g.save();g.translate(x+s,y);g.scale(-1,1);g.drawImage(im,sx,sy,D.s,D.s,0,0,s,s);g.restore()}else g.drawImage(im,sx,sy,D.s,D.s,x,y,s,s)};
  switch(f.kind){
    case 'sky':{const s=w/2;tile(w/2-s/2,s*0.3,s);tile(w/2+s/2,s*0.3,s,1);break}
    case 'low':{const s=w/2.2;tile(w/2-s*0.55,h-s*0.32,s);tile(w/2+s*0.55,h-s*0.32,s,1);break}
    case 'top':{const s=Math.min(w*0.62,h*1.3);tile(w/2,s*0.36,s);break}
    case 'one':{const s=Math.max(w,h)*1.15;tile(w/2,h/2,s);break}
    default:{const s=Math.max(w/2,h),c=Math.ceil(w/s),r=Math.ceil(h/s);for(let x=0;x<c;x++)for(let y=0;y<r;y++)tile(w/2+(x-(c-1)/2)*s,h/2+(y-(r-1)/2)*s,s,(x+y)%2===1)}
  }
}
// כל השכבות לקנבס קטן מחוץ למסך (רק כשפריים או שקיפות השתנו), ומשם drawImage אחד ל-dst
function wxOverlays(dst,cw,ch,scale,menu){
  const fps=wxSmall()?WEATHER.fpsSmall:WEATHER.fps,k=wxSmall()?WEATHER.alphaSmall:1,fr=[];let key='';
  for(const f of [...WX.dying,...WX.layers.values()]){const i=wxFrameI(f,fps);if(i<0){if(WX.layers.get(f.slot)===f)WX.layers.delete(f.slot);continue}fr.push([f,i]);key+=f.id+i+'|'+Math.round(f.cur*f.a*40)+f.kind+';'}
  if(!fr.length)return 0;
  const K=menu?1:wxSmall()?WEATHER.Ksmall:WEATHER.K,pw=Math.max(1,Math.round(dst.canvas.width*K)),ph=Math.max(1,Math.round(dst.canvas.height*K));
  let c=menu?WX.menuOff:WX.cv;if(!c){c=document.createElement('canvas');if(menu)WX.menuOff=c;else WX.cv=c}
  key+=pw+'x'+ph;if(c.width!==pw||c.height!==ph){c.width=pw;c.height=ph;c.key=''}
  if(c.key!==key){c.key=key;const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,pw,ph);g.setTransform(scale*K,0,0,scale*K,0,0);for(const [f,i] of fr)wxLayer(g,f,i,cw,ch,k)}
  dst.save();dst.setTransform(1,0,0,1,0,0);dst.globalAlpha=1;dst.globalCompositeOperation='source-over';dst.drawImage(c,0,0,dst.canvas.width,dst.canvas.height);dst.restore();
  return fr.length;
}
// אפקטים בנקודה (בקואורדינטות העולם, ctx כבר מוזז). בערפל של משחקי השאול: לא מסגירים (fxSeen)
function wxPts(){
  let j=0;for(const p of WX.pts){const age=WX.clk-p.t0,i=Math.floor(age*p.fps);if(p.dur?age>p.dur:i>=p.D.n)continue;WX.pts[j++]=p;
    if(typeof fxSeen==='function'&&!fxSeen(p.x,p.y))continue;const im=wxIm(p.id);if(!im)continue;const D=p.D,n=i%D.n,s=Math.ceil(p.size);
    ctx.globalAlpha=p.a;ctx.globalCompositeOperation=p.add?'lighter':'source-over';ctx.drawImage(im,(n%D.c)*D.s,Math.floor(n/D.c)*D.s,D.s,D.s,Math.round(p.x-s/2),Math.round(p.y-s/2),s,s)}
  WX.pts.length=j;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
// תפריטים: קנבס משלו בתוך החלון שפתוח, מתחת לתוכן (z-index:-1 בתוך השכבה של ה-overlay), בחצי רזולוציה
function wxMenu(o){
  let c=WX.menuCv;if(!o){if(c&&!c.hidden)c.hidden=true;return}
  if(!c){c=WX.menuCv=document.createElement('canvas');c.id='wxMenu';c.setAttribute('aria-hidden','true');c.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1';WX.menuG=c.getContext('2d')}
  if(c.parentNode!==o)o.insertBefore(c,o.firstChild);
  c.hidden=false;const w=Math.round(innerWidth*0.5),h=Math.round(innerHeight*0.5);if(c.width!==w||c.height!==h){c.width=w;c.height=h;if(WX.menuOff)WX.menuOff.key=''}
  WX.menuG.clearRect(0,0,w,h);WX.stat.drawn=wxOverlays(WX.menuG,innerWidth,innerHeight,0.5,true);
}
/* נקרא מ-render.js. where: 'base' בתלת-ממד מיד אחרי שכבת התלת-ממד (לפני כל מה שבקנבס),
   'mid' בדו-ממד מיד אחרי הרצפה (בזירה) או אחרי drawWorld (כפר ועולם), לפני הדמויות. קריאה נוספת באותו פריים מדלגת על עצמה (FRAME_T), 'mb2d' במשחקי השאול בדו-ממד אחרי הרצפה. רק אחד מהם מצייר בכל פריים */
function wxDraw(where){
  if(typeof S==='undefined'||!S||typeof ctx==='undefined')return;
  const mb3=!S.mb||typeof mb3dHere!=='function'||mb3dHere(),R=typeof R3D!=='undefined'&&R3D.on;
  if(where==='base'?!(R&&mb3):where==='mid'?(S.mb||R):!(S.mb&&!mb3))return;
  const ft=typeof FRAME_T!=='undefined'?FRAME_T:0;if(WX.drawn===ft)return;
  if(!wxTick())return;WX.drawn=ft;
  if(WX.scene==='menu'){wxMenu(wxMenuOv());return}wxMenu(null);
  const sx=typeof DPR!=='undefined'?DPR*(typeof ZOOM!=='undefined'?ZOOM:1):1;
  WX.stat.drawn=wxOverlays(ctx,W,H,sx);
  ctx.save();wxPts();ctx.restore();
}
// כשהמסך הראשי לא מצויר (render יוצא מוקדם): התפריט עדיין חי
function wxIdle(){const ft=typeof FRAME_T!=='undefined'?FRAME_T:0;if(WX.drawn!==ft&&wxPlace()==='menu'&&wxTick()){WX.drawn=ft;wxMenu(wxMenuOv())}}

/* ---- חיבורים מבחוץ (רק הציור; את המקומות מחברים דרך ה-API): הפונקציה המקורית רצה כמו שהיא ---- */
(()=>{
  const wrap=(name,after)=>{const old=window[name];if(typeof old!=='function')return;window[name]=function(){const r=old.apply(this,arguments);try{after(r,...arguments)}catch(e){}return r}};
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{WX.paused=document.hidden});
  // בדיקת סדר: האם מזג האוויר כבר צויר בפריים הזה כשהאפקטים (fxDraw) מצוירים
  {const old=window.fxDraw;if(typeof old==='function')window.fxDraw=function(){WX.fxAfter=WX.drawn===(typeof FRAME_T!=='undefined'?FRAME_T:0);return old.apply(this,arguments)}}
  wrap('mbDecor2d',()=>wxDraw('mb2d'));   // משחקי השאול בדו-ממד: אחרי הרצפה והקישוטים, לפני היחידות והסקילים
  wrap('hud',()=>wxIdle());               // תפריט כשאין שחקן
})();
