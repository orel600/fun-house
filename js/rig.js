/* בובת חלקים: השלד מחשב איפה כל חלק של הדמות נמצא, והסקין מצייר עליו.
   הלוגיקה לא יודעת איך דמות נראית. סגנון גרפי חדש = סקין חדש ב-SKINS, בלי לגעת בשאר הקוד */

// מידות השלד, ביחס לנקודת המרכז של הדמות
const BONES={headY:-20,headR:6.5,neckY:-13,hipY:2,shoulderY:-9,leg:13,legSpread:9,armDrop:8,armSpread:7,bob:1.5,swing:0.75};

/* סקין שאין לו תמונה לחלק מסוים מצייר אותו כקו, אז איש-המקל הוא סקין ריק.
   סקין מתמונות: PNG שקוף לכל חלק, והמידות בפיקסלים של המשחק.
   ראש: מצויר במרכז הראש. גפיים וגוף: מצוירים לאורך העצם, כשהקצה העליון של התמונה במפרק.
   נשק: מצויר ביד ומסתובב לכיוון הכוונה, כשהקת בצד שמאל של התמונה.
   התמונות מצוירות כשהדמות פונה ימינה, ומתהפכות כשהיא פונה שמאלה.
   דוגמה: nomad:{head:{src:'skins/nomad/head.png',w:20,h:20}, body:{src:'skins/nomad/body.png',w:12,h:17}, ...}
   שמות החלקים: head, body, armF, armB, legF, legB, sword, gun (הקשת) */
const SKINS={stick:{}};
const LOOK={player:'stick',grunt:'stick',shield:'stick',wanted:'stick'};   // איזה סקין לבוש כל סוג דמות

// סדר הציור: מה שמאחור קודם
const ORDER=['legB','armB','body','legF','head','armF'];

/* x,y מרכז הדמות. ph שלב ההליכה. aim כיוון היד הקדמית (null לדמות בלי יד קדמית). reach אורך היד הקדמית.
   face: לאן הגוף פונה (זווית). בלי face הגוף פונה לכיוון היד.
   k: גודל הדמות (ברירת מחדל 1). משחקי השאול: גיבור גדול וחייל קטן (MBLOOK.rig). כל המידות של השלד והיד כפול k */
function pose(x,y,ph,moving,aim,reach,face=aim,k=1){
  const B=BONES,sw=moving?Math.sin(ph)*B.swing:0,bob=moving?Math.abs(Math.sin(ph))*B.bob*k:0,yy=y-bob;
  const hip={x,y:yy+B.hipY*k},sh={x,y:yy+B.shoulderY*k};reach*=k;
  return{bob,k,face:face!=null&&Math.cos(face)<0?-1:1,aim,
    head:{x,y:yy+B.headY*k,r:B.headR*k},
    body:[{x,y:yy+B.neckY*k},hip],
    legF:[hip,{x:x+Math.sin(sw)*B.legSpread*k,y:hip.y+Math.cos(sw)*B.leg*k}],
    legB:[hip,{x:x-Math.sin(sw)*B.legSpread*k,y:hip.y+Math.cos(sw)*B.leg*k}],
    armB:[sh,{x:x-Math.sin(sw)*B.armSpread*k,y:sh.y+B.armDrop*k}],
    armF:aim==null?null:[sh,{x:sh.x+Math.cos(aim)*reach,y:sh.y+Math.sin(aim)*reach}]};
}

const skinImgs={};
function skinImg(part){
  if(!part||!part.src)return null;
  let im=skinImgs[part.src];
  if(!im){im=skinImgs[part.src]=new Image();im.src=part.src}
  return im.complete&&im.naturalWidth?im:null;
}

/* o: {skin, col, lw} — צבע ועובי הקו לחלקים שמצוירים כקו */
function drawRig(p,o){
  const sk=SKINS[o.skin]||SKINS.stick,k=p.k||1;   // k: גודל הדמות (pose)
  ctx.strokeStyle=o.col;ctx.lineWidth=o.lw;ctx.lineCap='round';ctx.lineJoin='round';
  for(const k of ORDER){
    const seg=p[k];if(!seg)continue;
    const part=sk[k],im=skinImg(part);
    if(k==='head'){
      if(im){ctx.save();ctx.translate(seg.x,seg.y);ctx.scale(p.face,1);ctx.drawImage(im,-part.w*k/2,-part.h*k/2,part.w*k,part.h*k);ctx.restore()}
      else{ctx.beginPath();ctx.arc(seg.x,seg.y,seg.r,0,Math.PI*2);ctx.stroke()}
      continue;
    }
    const [a,b]=seg;
    if(im){ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);ctx.scale(p.face,1);ctx.drawImage(im,-part.w*k/2,0,part.w*k,part.h*k);ctx.restore()}
    else{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  }
}

/* נשק ביד הקדמית. מחזיר false כשאין לסקין תמונה לנשק, ואז מי שקרא מצייר אותו בעצמו */
function drawRigWeapon(p,o,w,ang){
  const part=(SKINS[o.skin]||SKINS.stick)[w],im=skinImg(part);
  if(!im||!p.armF)return false;
  const h=p.armF[1];
  ctx.save();ctx.translate(h.x,h.y);ctx.rotate(ang);if(p.face<0)ctx.scale(1,-1);
  const k=p.k||1;ctx.drawImage(im,0,-part.h*k/2,part.w*k,part.h*k);ctx.restore();
  return true;
}
