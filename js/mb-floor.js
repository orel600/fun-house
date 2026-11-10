/* משחקי השאול: בדיקת הפרדת ערכים בין הדמויות לרצפה (MBFLOOR, השיפוץ, MAX ל-BOB, 10.11.2026). רק בענף overhaul/preview.
   ?mbfloor=current|quiet|quiet2 מחליף את הפלטה של רצפת האבן (MBLOOK.floor3d, moba3d.js בונה ממנה את הרצפה). בלי הדגל: pick.
   quiet ו-quiet2: "אובסידיאן שקט, בהיר וניטרלי יותר" (הכיוון של השיפוץ): פחות סגול ורוויה, בהיר יותר, רונות וגחלים עמומים, כדי שהגיבורים יבלטו.
   הבחירה לפי מספר (tools של BOB: ΔL* בין כל פיקסל של דמות לרצפה שמאחוריו, מהמצלמה של המשחק). רק צבע: שום דבר במשחק לא משתנה.
   מחיקה: הקובץ והשורה ב-index.html */
const MBFLOOR={
  // נמדד (BOB, 10.11, מצלמת המשחק, 3D, שני משחקים): כל הגיבורים בהירים מהרצפה (L* 39-95 מול כ-24 מאחוריהם), אז רצפה בהירה מקטינה את ההפרדה.
  // ΔL* גיבורים: deep 27.5/44.3, current 26.5/43.5, quiet 26.7/43.0, quiet2 25.3/41.2. ההבדל קטן: הצללים והסימנים מאחורי הדמויות קובעים יותר מהפלטה
  pick:'plates',   // הכיוון האמנותי של ARI (art-direction-1, ov1.json): המועמד לברירת מחדל, יחד עם mb-scene.js. deep נשאר לבחירה (?mbfloor=deep) ומחזיר גם את האור הישן
  pals:{
    current:null,   // כמו שהיה (MBLOOK.floor3d)
    quiet:{stone:'#6e6a74',stone2:'#615d68',dark:'#4a4651',mortar:'#2e2b33',crack:'#211f26',rune:'#9C8A5A',ember:'#b0603a',out:'#141218'},
    deep:{stone:'#4c4851',stone2:'#433f48',dark:'#322e37',mortar:'#1e1b22',crack:'#141217',rune:'#8A7A50',ember:'#9a5232',out:'#0c0b0e'},   // השוואה: אותו ניטרלי, כהה יותר
    plates:{stone:'#6b6470',stone2:'#5a5460',dark:'#3a3542',mortar:'#17141b',crack:'#0f0d12',rune:'#C9A23E',ember:'#ff7a30',out:'#08070a'},   // ARI ov1.json: לוחות עם תפרים כהים ועומק
    obsidian:{stone:'#5b5d6e',stone2:'#4d4f5e',dark:'#33343f',mortar:'#0d0d14',crack:'#09090d',rune:'#C9A23E',ember:'#ff7a30',out:'#07070a'},   // ARI map v2 (map-art-1.md): מתחת ללוחות, עם MBFLOOR.ob
    quiet2:{stone:'#85818b',stone2:'#78747e',dark:'#5d5964',mortar:'#3a3740',crack:'#2a2830',rune:'#A89466',ember:'#a86a48',out:'#1a181e'}
  },
  // ?mbfloor=obsidian (ARI map v2, 10.11): לוחות אובסידיאן בשורות מוזזות עם שיפוע ותפרים, שפת בזלת עם זוהר גחלים מלמטה, ותהום בהירה יותר. רק בתלת-ממד (שכבת הסימנים).
  // נמדד (ARI): ΔL* גיבורים טנק/צייד/מתנקש 31.0/34.4/19.4 -> 30.9/32.7/20.5. לוחות בהירים יותר הורידו את ההפרדה, לכן k נשאר כהה (L* כ-24)
  ob:{slabs:{cw:112,ch:78,k:14,bevel:0.16,joint:0.5,ember:0.38,emberP:0.2,sheen:0.07,gap:'#0b0b11'},   // cw,ch: גודל לוח. k: בהירות הלוח (0-255). bevel/joint: אור למעלה-שמאל וצל למטה-ימין. emberP: כמה לוחות עם סדק גחלים
    rim:{block:'#1b1a22',top:0.2,underglow:{h:26,a:0.75}},abyss:['#9a3a14','#45140c'],crackBranches:9,rimGlow:{a:0.42,depth:130}},
  on:''
};
(function(){
  if(typeof MBLOOK==='undefined')return;
  const q=(location.search.match(/[?&]mbfloor=([a-z0-9]+)/)||[])[1],k=q&&q in MBFLOOR.pals?q:MBFLOOR.pick;
  MBFLOOR.base=MBLOOK.floor3d;MBFLOOR.on=k;
  if(MBFLOOR.pals[k])MBLOOK.floor3d=Object.assign({},MBLOOK.floor3d,MBFLOOR.pals[k]);
  if(k==='obsidian'&&MBLOOK.floor)MBLOOK.floor.ob=MBFLOOR.ob;   // moba-look.js mbFloorCanvas קורא את F.ob
})();
// ---- ?mbfloor=obsidian: הציור (נקרא מ-mbFloorCanvas ב-moba-look.js, רק כש-MBLOOK.floor.ob קיים) ----
// הלוחות: אטומים, רק בתוך שטח ההליכה, בשכבת הסימנים (לפני צבע הקבוצה)
function mbObSlabs(g,R,x0,x1){
  const O=MBFLOOR.ob.slabs,Hh=MOBA.lane.half,W=x1-x0,cw=O.cw,ch=O.ch;g.save();g.fillStyle=O.gap;g.fillRect(x0,-Hh,W,Hh*2);
  for(let r=0;r*ch-Hh<Hh+ch;r++){const y0=-Hh+r*ch,off=(r%2)*cw*0.5;
    for(let c=-1;c*cw<W+cw;c++){const i=r*977+c*131,x=x0+c*cw+off+(R(i,3)-0.5)*14,y=y0+(R(i,5)-0.5)*10,w=cw-6-R(i,7)*16,h=ch-6-R(i,9)*12;if(y+h<-Hh||y>Hh)continue;
      const v=0.9+R(i,11)*0.2,k=Math.round(O.k*v);g.fillStyle='rgb('+k+','+Math.round(k*1.03)+','+Math.round(k*1.22)+')';g.fillRect(x,Math.max(y,-Hh),w,Math.min(y+h,Hh)-Math.max(y,-Hh));
      const sh=g.createLinearGradient(x,y,x+w,y+h);sh.addColorStop(0,'rgba(190,200,240,'+O.sheen+')');sh.addColorStop(0.45,'rgba(190,200,240,'+O.sheen*0.43+')');sh.addColorStop(0.55,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,'+O.sheen*4+')');g.fillStyle=sh;g.fillRect(x,y,w,h);
      g.fillStyle='rgba(205,215,255,'+O.bevel+')';g.fillRect(x,y,w,3);g.fillRect(x,y,3,h);g.fillStyle='rgba(0,0,0,'+O.joint+')';g.fillRect(x,y+h-3,w,3);g.fillRect(x+w-3,y,3,h);
      if(R(i,13)>1-O.emberP){g.strokeStyle='rgba(255,110,40,'+O.ember+')';g.lineWidth=1.6;g.beginPath();g.moveTo(x+w*(0.2+R(i,15)*0.2),y+h);g.lineTo(x+w*(0.4+R(i,17)*0.3),y+h*0.55);g.lineTo(x+w*(0.5+R(i,19)*0.3),y+h*0.62);g.stroke()}}}
  g.restore();
}
// אבן אחת בשפה: בזלת, קו אור קר למעלה, וזוהר גחלים מלמטה (בצד התהום), גם בשכבת הזוהר
function mbObRim(g,q,x,y,w,sg){
  const O=MBFLOOR.ob.rim,F=MBLOOK.floor,U=O.underglow;g.fillStyle=O.block;g.fillRect(x+2,y+3,w-4,F.rim-6);g.fillStyle='rgba(150,160,210,'+O.top+')';g.fillRect(x+2,sg>0?y+3:y+F.rim-6,w-4,3);
  const e0=sg>0?y+F.rim-3:y+3,e1=sg>0?y+F.rim+U.h:y-U.h,eg=g.createLinearGradient(0,e0,0,e1);eg.addColorStop(0,'rgba(255,100,30,'+U.a+')');eg.addColorStop(1,'rgba(255,100,30,0)');
  g.fillStyle=eg;g.fillRect(x+2,Math.min(e0,e1),w-4,U.h);q.fillStyle=eg;q.fillRect(x+2,Math.min(e0,e1),w-4,U.h);
}
// זוהר הגחלים מהתהום שנכנס לשטח ההליכה, משני הצדדים (שכבת הזוהר)
function mbObBounce(q,x0,x1,A){
  const O=MBFLOOR.ob.rimGlow;for(const sg of [-1,1]){const gr=q.createLinearGradient(0,sg*A,0,sg*(A-O.depth));gr.addColorStop(0,'rgba(255,110,40,'+O.a+')');gr.addColorStop(0.5,'rgba(255,90,30,'+O.a/3+')');gr.addColorStop(1,'rgba(255,90,30,0)');
    q.globalAlpha=1;q.fillStyle=gr;q.fillRect(x0,Math.min(sg*A,sg*(A-O.depth)),x1-x0,O.depth)}
}
