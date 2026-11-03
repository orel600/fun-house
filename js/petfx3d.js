/* האש של פיוחו בתלת-ממד (ניר, 3.11.2026: "האפקט של האש שלה צריך שיפור").
   בשלב 3 (אגדית), בעולם הפתוח ובתלת-ממד: להבה אמיתית בקצה הזנב (מהעצם של המודל), גחלים שעולות, להבונים ליד הכפות כשהיא רצה,
   והילה חמה על הקרקע מתחתיה. בנשיכה: שלהבת קצרה מהפה לכיוון האויב, ניצוצות, גחלים ואור חם.
   משתמש בערכה המשותפת (VFX3D ב-js/vfx3d.js), באותה שפה של המטאור והסקילים. בדו-ממד, בכפר ובזירה נשאר הציור בקנבס (petFlames ב-pet.js).
   חיבור: שתי שורות ב-pet.js (drawPet קוראת ל-petFx3d, petBite קוראת ל-petFx3dBite). כל המספרים כאן */
const PETFX3D={
  tail:{every:0.04,size:14,size2:3,spd:16,up:34,life:[0.2,0.36],glow:0.1,halo:22},   // הלהבה בקצה הזנב: כל כמה שניות חלקיק, וזוהר רך סביבו
  ember:{every:0.45},
  paw:{every:0.08,size:9,up:26},                      // להבונים ליד הכפות, רק כשהיא רצה
  mark:{r:32,a:0.22,every:0.22,life:0.34},            // ההילה החמה על הקרקע מתחתיה: סימן קצר שמתחדש, כך שהיא לא מחזיקה מדבקה לנצח
  bite:{fire:13,spark:12,ember:5,flash:20,light:6,lightT:0.24,spd:300,up:120,mouth:0.42,high:0.6},
  pal:{core:'#FFE8A8',glow:'#FF8A3D',deep:'#C92A06'},
  stat:{flame:0,bite:0}   // לבדיקה (check.js): כמה פעמים יצאה להבה מהזנב ומהפה
};
const PETFX={t:0,halo:0,tail:0,emb:0,paw:0};   // המצב הרגעי של האפקט (לא נשמר)
// מתי האש בתלת-ממד: שלב 3, תלת-ממד דלוק, ובמקום שהערכה פעילה בו (העולם הפתוח)
const petFx3dOn=()=>!!(typeof VFX3D!=='undefined'&&VFX3D.on()&&petStage().fx);
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
  const q=VFX3D.quality()==='hi'?1:2.2;
  const t=petFx3dTail(p,h);
  // הלהבה בקצה הזנב: חלקיקי אש שעולים, וזוהר רך שמחזיק אותם יחד
  if((X.tail-=dt)<=0){X.tail=F.tail.every*q;PETFX3D.stat.flame++;
    VFX3D.emit('fire',t.x,t.y,t.h,{n:1,col:Pl.core,col2:Pl.deep,size:F.tail.size,size2:F.tail.size2,spd:F.tail.spd,up:F.tail.up,life:F.tail.life,spread:3});
    VFX3D.emit('glow',t.x,t.y,t.h,{n:1,col:Pl.core,col2:Pl.glow,size:F.tail.halo,size2:F.tail.halo*1.4,life:[F.tail.glow,F.tail.glow*1.6],a:0.5,hdr:3})}
  if((X.emb-=dt)<=0){X.emb=F.ember.every*q;VFX3D.emit('ember',t.x,t.y,t.h,{n:1,col:Pl.glow,col2:Pl.deep,spd:40,up:120,spread:4})}
  // כפות: להבונים קטנים כשהיא רצה
  if(p.run&&(X.paw-=dt)<=0){X.paw=F.paw.every*q;const c=Math.cos(p.face),s=Math.sin(p.face),f=Math.random()<0.5?0.22:-0.22,g=Math.random()<0.5?0.1:-0.1;
    VFX3D.emit('fire',p.x+c*h*f-s*h*g,p.y+s*h*f+c*h*g,h*0.12,{n:1,col:Pl.core,col2:Pl.glow,size:F.paw.size,size2:2,spd:10,up:F.paw.up,life:[0.14,0.26]})}
  // הילה חמה על הקרקע מתחתיה: מדבקה קצרה שמתחדשת, כך שנשאר גם שובל אור רך אחריה, ושום ידית לא נתקעת כשהיא עוזבת את העולם
  if((X.halo-=dt)<=0){X.halo=F.mark.every*q;VFX3D.decal('glow',p.x,p.y,F.mark.r,{life:F.mark.life,col:Pl.glow,a:F.mark.a,hdr:1.3,fade:0.7})}
  return true;
}
/* נשיכה (petBite ב-pet.js): שלהבת מהפה לכיוון האויב */
function petFx3dBite(p,e){
  if(!petFx3dOn())return false;
  PETFX3D.stat.bite++;
  const F=PETFX3D.bite,Pl=PETFX3D.pal,h=petStage().h,S_=Math.sin(camTilt());
  const c=Math.cos(p.face),s=Math.sin(p.face),x=p.x+c*h*F.mouth,y=p.y+s*h*F.mouth,mh=h*F.high;
  const vx=c*F.spd,vz=s*F.spd/S_;
  VFX3D.emit('fire',x,y,mh,{n:F.fire,col:Pl.core,col2:Pl.deep,size:15,size2:4,spd:60,up:40,vx,vz,life:[0.18,0.34],spread:5});
  VFX3D.emit('spark',x,y,mh,{n:F.spark,col:Pl.core,col2:Pl.glow,spd:160,up:F.up,vx:vx*0.6,vz:vz*0.6,spread:4,life:[0.2,0.4]});
  VFX3D.emit('ember',x,y,mh,{n:F.ember,col:Pl.glow,col2:Pl.deep,spd:60,up:140,spread:6});
  VFX3D.burst('flash',e?e.x:x+c*20,e?e.y:y+s*20,{r:F.flash,core:Pl.core,life:0.12});
  VFX3D.light(x,y,mh+10,Pl.glow,F.light,F.lightT);
  return true;
}
