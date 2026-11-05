/* האש של פיוחו בתלת-ממד (ניר, 3.11.2026: "האפקט של האש שלה צריך שיפור"; 5.11: "לא מרגיש שונה ממה שהיה לפני").
   בשלב 3 (אגדית), בתלת-ממד, בעולם הפתוח וגם בכפר (VFX3D.pet פותח את הערכה רק לה): להבה אמיתית בקצה הזנב (מהעצם של המודל), גחלים שעולות, להבונים ליד הכפות כשהיא רצה,
   והילה חמה על הקרקע מתחתיה. בנשיכה: שלהבת קצרה מהפה לכיוון האויב, ניצוצות, גחלים ואור חם.
   משתמש בערכה המשותפת (VFX3D ב-js/vfx3d.js), באותה שפה של המטאור והסקילים. בדו-ממד ובזירה נשאר הציור בקנבס (petFlames ב-pet.js).
   חיבור: שתי שורות ב-pet.js (drawPet קוראת ל-petFx3d, petBite קוראת ל-petFx3dBite). כל המספרים כאן */
const PETFX3D={
  tail:{every:0.025,size:14,size2:2,spd:14,up:120,life:[0.3,0.5],glow:0.12,halo:12,ga:[0.15,0.3]},   // הלהבה בקצה הזנב: כל כמה שניות חלקיק, וזוהר רך סביבו (halo גודל, ga השקיפות באיכות גבוהה ונמוכה)
  core:{every:0.07,size:22,size2:6,up:80,life:[0.3,0.42]},   // לשון אש גדולה ואיטית בקצה הזנב: מה שבולט במבט ראשון
  ember:{every:0.12,spd:50,up:150},                   // גחלים שעולות מהזנב ונופלות
  paw:{every:0.08,size:11,up:28},                     // להבונים ליד הכפות, רק כשהיא רצה
  mark:{r:45,a:0.4,hdr:1.8,every:0.2,life:0.4},             // ההילה החמה על הקרקע מתחתיה: סימן קצר שמתחדש, כך שהיא לא מחזיקה מדבקה לנצח
  light:{i:2.5,every:0.2,life:0.32},                    // אור חם מהזנב על הגוף ועל הקרקע: רק בכפר (בעולם האורות שמורים לסקילים) ורק באיכות גבוהה
  lo:{every:2,size:1.6},                              // באיכות נמוכה: חצי מהחלקיקים, אבל גדולים יותר, כדי שההבדל יישאר ברור
  bite:{fire:13,spark:12,ember:5,flash:16,light:3.5,lightT:0.24,spd:300,up:120,mouth:0.42,high:0.6},
  pal:{core:'#FFE8A8',mid:'#FFA040',glow:'#FF8A3D',deep:'#C92A06',halo:'#FF5A14'},   // halo: ההילה על הקרקע, אדומה יותר כי על דשא ירוק כתום נראה צהוב
  hdr:1.5,                                            // כמה בהירה האש בזנב (מעל 1 זוהר). גבוה מדי = כתם לבן במקום אש
  /* 5.11.2026, ניר מהטלפון: "האפקטים של פיוחו בוהקים מדי". בכפר האש סנוורה את מרכז המסך, אז הזוהר, האור החם וההילה ירדו בערך בחצי */
  stat:{flame:0,bite:0}   // לבדיקה (check.js): כמה פעמים יצאה להבה מהזנב ומהפה
};
const PETFX={t:0,halo:0,tail:0,core:0,emb:0,paw:0,lt:0};   // המצב הרגעי של האפקט (לא נשמר)
// מתי האש בתלת-ממד: שלב 3, תלת-ממד דלוק, בעולם או בכפר
const petFx3dOn=()=>!!(typeof VFX3D!=='undefined'&&VFX3D.petOn&&VFX3D.petOn()&&petStage().fx);
// איפה קצה הזנב בעולם התלת-ממדי (העצם של המודל). בלי מודל: הערכה מאחורי הגוף
function petFx3dTail(p,h){
  const a=typeof R3D!=='undefined'&&R3D.pet;
  if(a&&a.tail){const v=a.tail.getWorldPosition(PETFX.v||(PETFX.v=new THREE.Vector3()));return {x:v.x,y:v.z*Math.sin(camTilt()),h:v.y}}
  return {x:p.x-Math.cos(p.face)*h*0.45,y:p.y-Math.sin(p.face)*h*0.45,h:h*0.75};
}
/* נקרא מ-drawPet בכל פריים. מחזיר true כשהאש מצוירת בתלת-ממד, ואז הציור בקנבס מדולג */
function petFx3d(p,h){
  const F=PETFX3D,X=PETFX,Pl=F.pal;
  if(!petFx3dOn())return false;
  const dt=Math.max(0,Math.min(0.1,p.fxT-(X.t||p.fxT)));X.t=p.fxT;
  const hi=VFX3D.quality()==='hi',q=hi?1:F.lo.every,z=hi?1:F.lo.size;
  const t=petFx3dTail(p,h);
  VFX3D.pet=true;
  // הלהבה בקצה הזנב: חלקיקי אש שעולים, לשון אש גדולה, וזוהר רך שמחזיק אותם יחד
  // כמה חלקיקים יוצאים לפי הזמן שעבר (עד 4 בפריים), כך שהאש נראית אותו דבר גם כשהמסך איטי
  const due=(k,ev)=>{X[k]-=dt;let n=0;while(X[k]<=0&&n<4){X[k]+=ev;n++}if(X[k]<=0)X[k]=ev;return n};
  let n=due('tail',F.tail.every*q);
  if(n){PETFX3D.stat.flame++;
    VFX3D.emit('fire',t.x,t.y,t.h,{n,raw:1,col:Pl.core,col2:Pl.deep,size:F.tail.size*z,size2:F.tail.size2*z,spd:F.tail.spd,up:F.tail.up,life:F.tail.life,spread:3,hdr:F.hdr});
    VFX3D.emit('glow',t.x,t.y,t.h,{n:1,raw:1,col:Pl.glow,col2:Pl.deep,size:F.tail.halo*z,size2:F.tail.halo*1.4*z,life:[F.tail.glow,F.tail.glow*1.6],a:F.tail.ga[hi?0:1],hdr:1.3})}
  if((n=due('core',F.core.every*q)))
    VFX3D.emit('fire',t.x,t.y,t.h+2,{n,raw:1,col:Pl.mid,col2:Pl.deep,hdr:F.hdr,size:F.core.size*z,size2:F.core.size2*z,spd:6,up:F.core.up,life:F.core.life,spread:2});
  if((n=due('emb',F.ember.every*q)))VFX3D.emit('ember',t.x,t.y,t.h,{n,raw:1,col:Pl.glow,col2:Pl.deep,spd:F.ember.spd,up:F.ember.up,spread:5,size:9*z,size2:5*z});
  // כפות: להבונים קטנים כשהיא רצה
  if(p.run&&(X.paw-=dt)<=0){X.paw=F.paw.every*q;const c=Math.cos(p.face),s=Math.sin(p.face),f=Math.random()<0.5?0.22:-0.22,g=Math.random()<0.5?0.1:-0.1;
    VFX3D.emit('fire',p.x+c*h*f-s*h*g,p.y+s*h*f+c*h*g,h*0.12,{n:1,col:Pl.core,col2:Pl.glow,size:F.paw.size*z,size2:2*z,spd:10,up:F.paw.up,life:[0.14,0.26]})}
  // הילה חמה על הקרקע מתחתיה: מדבקה קצרה שמתחדשת, כך שנשאר גם שובל אור רך אחריה, ושום ידית לא נתקעת כשהיא עוזבת את העולם
  if((X.halo-=dt)<=0){X.halo=F.mark.every*q;VFX3D.decal('glow',p.x,p.y,F.mark.r,{life:F.mark.life,col:Pl.halo,a:F.mark.a*(hi?1:1.3),hdr:F.mark.hdr,fade:0.5})}
  // אור חם שמהבהב מהזנב (בכפר בלבד, איכות גבוהה)
  if(S.vil&&hi&&(X.lt-=dt)<=0){X.lt=F.light.every;VFX3D.light(t.x,t.y,t.h+12,Pl.glow,F.light.i*(0.8+0.4*Math.random()),F.light.life)}
  VFX3D.pet=false;
  return true;
}
/* נשיכה (petBite ב-pet.js): שלהבת מהפה לכיוון האויב */
function petFx3dBite(p,e){
  if(!petFx3dOn())return false;
  PETFX3D.stat.bite++;VFX3D.pet=true;
  const F=PETFX3D.bite,Pl=PETFX3D.pal,h=petStage().h,S_=Math.sin(camTilt());
  const c=Math.cos(p.face),s=Math.sin(p.face),x=p.x+c*h*F.mouth,y=p.y+s*h*F.mouth,mh=h*F.high;
  const vx=c*F.spd,vz=s*F.spd/S_;
  VFX3D.emit('fire',x,y,mh,{n:F.fire,col:Pl.core,col2:Pl.deep,size:15,size2:4,spd:60,up:40,vx,vz,life:[0.18,0.34],spread:5});
  VFX3D.emit('spark',x,y,mh,{n:F.spark,col:Pl.core,col2:Pl.glow,spd:160,up:F.up,vx:vx*0.6,vz:vz*0.6,spread:4,life:[0.2,0.4]});
  VFX3D.emit('ember',x,y,mh,{n:F.ember,col:Pl.glow,col2:Pl.deep,spd:60,up:140,spread:6});
  VFX3D.burst('flash',e?e.x:x+c*20,e?e.y:y+s*20,{r:F.flash,core:Pl.core,life:0.12});
  VFX3D.light(x,y,mh+10,Pl.glow,F.light,F.lightT);
  VFX3D.pet=false;
  return true;
}
