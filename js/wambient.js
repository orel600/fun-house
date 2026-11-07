/* אווירה בעולם ובכפר מספריית האפקטים (fxlib.js, Mochi Lab של אוראל): כל אזור מקבל כמה אפקטים קטנים שמופיעים ונעלמים ליד המצלמה.
   אחו וכפר: עלים וגחליליות. אגם: אדוות ובועות על קו החוף. רכס: שלג וזוהר צפוני נדיר בשמיים. מדבר: אדי חום ורוח אבק.
   סערה: גשם. לב הצל: נצנוצי כוכבים עדינים. ובכל מקום: אבק מתחת לרגליים כשהולכים (שלג ברכס, חול במדבר), ופופ קטן כשאוספים שלל.
   משלים את מזג האוויר בקנבס (world.js) ואת החלקיקים בתלת-ממד (ambient3d.js), לא מחליף אותם.
   ביצועים (טלפון ב-120FPS): מאגר קבוע של עצמים, עד cap אפקטים בבת אחת ורק בתוך המסך. בלי מערכים חדשים בכל פריים.
   רשימה נפרדת מ-FXLIB.list, כדי שהאווירה לא תדחוף החוצה אפקטים של קרב. התמונות נטענות רק כשנכנסים לאזור.
   חיבור: wambUpdate ב-worldUpdate וב-villageUpdate, wambDraw ב-render.js, wambPop ב-dropTake (drops.js). רק בעולם ובכפר, לא בזירה.
   ?wamb=0 מכבה. אזור חדש: שורה ב-WAMB.reg (בלי שורה: רק צעדים ואיסוף).
   לכל אפקט באזור: id (מ-FXDATA), every כל כמה שניות, size גודל (פיקסלים של המשחק), a שקיפות, add אור, fps, life כמה שניות (חוזר עד אז),
   vx,vy תזוזה, at איפה: view (במסך, ברירת מחדל), shore (על קו המים ליד המסך), sky (צמוד למצלמה, בראש המסך) */
const WAMB={
  on:!/[?&]wamb=0\b/.test(location.search),
  cap:7,        // אפקטי אווירה בבת אחת (בלי צעדים ואיסוף)
  lo:0.5,       // איכות אפקטים נמוכה (vfx3d.js): פי כמה מהקצב
  edge:50,      // לא צמוד לקצה המסך
  fade:[0.35,0.5],   // כניסה ויציאה הדרגתיות (שניות)
  step:{every:0.3,size:40,a:0.7,cap:4,min:40,by:{ridge:'step_snow',desert:'step_sand'},def:'step_dust'},   // צעדים: min פיקסלים בשנייה לפחות
  pop:{cap:3,size:80,gear:'pickup_chest',def:'pickup_coin'},
  reg:{
    village:[{id:'leaves',every:6,size:170,a:0.5,fps:12,life:2},{id:'fireflies',every:7,size:120,a:0.7,add:1,fps:12,life:2.6}],
    meadow: [{id:'leaves',every:3.2,size:180,a:0.55,fps:12,life:2},{id:'fireflies',every:4.5,size:130,a:0.75,add:1,fps:12,life:2.6}],
    lake:   [{id:'water_ripple',at:'shore',every:1.2,size:84,a:0.7,fps:20},{id:'bubbles_bg',at:'shore',every:6,size:130,a:0.45,fps:14}],
    ridge:  [{id:'snow',every:2.6,size:260,a:0.5,fps:14,life:2.4},{id:'aurora',at:'sky',every:18,size:520,a:0.32,add:1,fps:9,life:6}],
    desert: [{id:'haze',every:3.4,size:240,a:0.35,fps:12,life:3},{id:'step_dust',every:2.2,size:110,a:0.45,fps:16,life:1.4,vx:80}],
    storm:  [{id:'rain',every:1.5,size:300,a:0.4,fps:26,life:1.8}],
    shadow: [{id:'stars',every:3.6,size:130,a:0.38,add:1,fps:10,life:3}]
  },
  list:[],pool:[],key:null,t:0,cd:{},stepT:0,side:1,lx:0,ly:0,
  st:{spawn:{},max:0,steps:0,pops:0,draws:0,ms:0,frames:0}   // לבוט ולמדידה: כמה נוצרו, הכי הרבה בבת אחת, וזמן העבודה
};
const wambHere=()=>WAMB.on&&S&&!S.mb&&(S.wd||S.vil);
const wambReg=()=>S.wd?(WR().region||'meadow'):'village';
function wambNew(id,x,y,o,kind){
  const D=typeof FXDATA!=='undefined'&&FXDATA[id];if(!D)return null;
  const f=WAMB.pool.pop()||{};
  f.id=id;f.D=D;f.x=x;f.y=y;f.t0=WAMB.t;f.kind=kind;f.size=o.size||D.s;f.a=o.a??1;f.add=!!o.add;f.fps=o.fps||FXLIB.fps;
  f.life=o.life||D.n/f.fps;f.vx=o.vx||0;f.vy=o.vy||0;f.cam=o.at==='sky';
  WAMB.list.push(f);return f;
}
const wambCount=kind=>{let n=0;for(const f of WAMB.list)if(f.kind===kind)n++;return n};
// נקודה במסך סביב הגיבור, לא צמודה לקצה (המצלמה עוקבת אחריו, והיא מתעדכנת רק בציור)
function wambView(){const m=WAMB.edge;return{x:P.x+rand(-W/2+m,W/2-m),y:P.y+rand(-H/2+m,H/2-m)}}
const wambIn=(x,y)=>Math.abs(x-P.x)<W/2&&Math.abs(y-P.y)<H/2;
// קו המים הקרוב לנקודה אקראית במסך (terrain.js). אין מים במסך: null
function wambShore(){
  if(typeof tWaterNear!=='function')return null;
  for(let i=0;i<3;i++){const p=wambView(),b=tWaterNear(p.x,p.y);if(b&&wambIn(b.x,b.y))return b}
  return null;
}
function wambUpdate(dt){
  if(!wambHere())return;
  const t0=performance.now(),A=WAMB,key=S.wd?'w:'+S.wd.reg:'vil';A.t+=dt;
  if(key!==A.key){   // מקום חדש: מנקים וטוענים מראש את התמונות של האזור
    wambClear();A.key=key;A.cd={};A.lx=P.x;A.ly=P.y;
    const R=A.reg[wambReg()]||[];fxPreload(R.map(e=>e.id).concat([A.step.by[wambReg()]||A.step.def,A.pop.def,A.pop.gear]));
  }
  // מי שנגמר חוזר למאגר
  let j=0;for(const f of A.list){if(A.t-f.t0<f.life)A.list[j++]=f;else A.pool.push(f)}A.list.length=j;
  const lo=typeof VFX3D!=='undefined'&&VFX3D.quality&&VFX3D.quality()==='lo'?A.lo:1;
  const R=A.reg[wambReg()]||[];
  for(let i=0;i<R.length;i++){const e=R[i],k=key+i;
    A.cd[k]=(A.cd[k]??rand(0,e.every))-dt*lo;if(A.cd[k]>0)continue;A.cd[k]=e.every*rand(0.7,1.3);
    if(wambCount('amb')>=A.cap)continue;
    let p;if(e.at==='shore'){p=wambShore();if(!p)continue}else if(e.at==='sky')p={x:rand(-W*0.3,W*0.3),y:-H*0.3};else p=wambView();
    if(wambNew(e.id,p.x,p.y,e,'amb'))A.st.spawn[e.id]=(A.st.spawn[e.id]||0)+1;
  }
  // צעדים: כשהגיבור באמת זז (לפי המרחק, לא לפי הקלט), אבק קטן לסירוגין משני הצדדים
  const v=Math.hypot(P.x-A.lx,P.y-A.ly)/Math.max(dt,1e-3);A.lx=P.x;A.ly=P.y;A.stepT-=dt;
  if(v>A.step.min&&A.stepT<=0&&wambCount('step')<A.step.cap){A.stepT=A.step.every;A.side=-A.side;
    if(wambNew(A.step.by[wambReg()]||A.step.def,P.x+A.side*6,P.y+6,A.step,'step'))A.st.steps++}
  A.st.max=Math.max(A.st.max,wambCount('amb'));
  A.st.ms+=performance.now()-t0;
}
// שלל שנאסף (drops.js): פופ קטן במקום. ציוד: תיבה, שאר השלל: מטבע
function wambPop(x,y,gear){
  if(!wambHere()||wambCount('pop')>=WAMB.pop.cap)return;
  if(wambNew(gear?WAMB.pop.gear:WAMB.pop.def,x,y-14,WAMB.pop,'pop'))WAMB.st.pops++;
}
// נקרא מ-render() בקואורדינטות העולם, אחרי drawWorld: לפני הדמויות בדו-ממד, מעל התלת-ממד
const wambClear=()=>{for(const f of WAMB.list)WAMB.pool.push(f);WAMB.list.length=0;WAMB.key=null};
function wambDraw(){
  if(!wambHere()){if(WAMB.list.length)wambClear();return}   // בזירה ובמשחקי השאול: כלום
  if(!WAMB.list.length)return;
  const t0=performance.now(),A=WAMB,[fi,fo]=A.fade;ctx.save();
  for(const f of A.list){
    const im=fxImg(f.id);if(!im)continue;
    const age=A.t-f.t0,D=f.D,i=Math.floor(age*f.fps)%D.n,s=f.size;
    const x=(f.cam?S.cam.x:0)+f.x+f.vx*age,y=(f.cam?S.cam.y:0)+f.y+f.vy*age;
    if(!f.cam&&(Math.abs(x-S.cam.x)>W/2+s/2||Math.abs(y-S.cam.y)>H/2+s/2))continue;   // מחוץ למסך: לא מציירים
    ctx.globalAlpha=f.a*Math.max(0,Math.min(1,age/fi,(f.life-age)/fo));ctx.globalCompositeOperation=f.add?'lighter':'source-over';
    const sx=(i%D.c)*D.s,sy=Math.floor(i/D.c)*D.s;
    ctx.drawImage(im,sx,sy,D.s,D.s,x-s/2,y-s/2,s,s);A.st.draws++;
  }
  ctx.restore();A.st.ms+=performance.now()-t0;A.st.frames++;
}
