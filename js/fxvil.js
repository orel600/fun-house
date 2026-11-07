/* סימנים מעל דמויות ועליית דרגה, מספריית האפקטים (FXV, סבב 2 של 7.11.2026, docs/fx.md).
   סימן אחד לכל דמות, לפי סדר: מוכן למסירה (wnpc_turnin) > יש קווסט (wnpc_quest) > חנות (wnpc_shop) > אפשר לדבר עכשיו (wnpc_talk).
   הסימן מחליף את העיגול הכהה עם ! או ✓ שצויר בקנבס (drawQuestMarks ב-quests.js, drawWnpcScreen ב-worldnpc.js). כשהתמונה עוד לא נטענה, העיגול הישן נשאר.
   השם של הדמות מצויר מתחתיה (y+32), והסימן מעל הראש, אז הם לא עולים זה על זה.
   עליית דרגה (rankUp ב-ranks.js, celebrate 'rankup'): עמוד אור זהב על הגיבור ומדליה מעל הראש. שונה מעלייה ברמה רגילה ('rank': סגול ובלונים).
   רק בכפר ובעולם. הזירה והמובה לא משתנים. ציור: תמונה קטנה אחת לכל דמות על המסך (בערך 0.02ms), בלי הקצאות בכל פריים */
const FXV={
  npc:{
    ids:{turnin:'wnpc_turnin',quest:'wnpc_quest',shop:'wnpc_shop',talk:'wnpc_talk'},
    size:72,          // גודל הפריים בפיקסלים של המשחק (הסימן עצמו בערך חצי מזה, כמו העיגול הישן)
    rank:1.35,        // סימן של קווסט דרגה (!!): גדול יותר, עם ההילה הסגולה מאחוריו
    fps:20,a:1,
    small:0.9,        // חנות ושיחה: קטנים יותר מסימני קווסט, כי הם מידע ולא קריאה
    shop:['merchant'],shopNear:700,   // מי מוכר (ומי שעבר לגור בכפר, v<id> ב-residents.js), ועד איזה מרחק מהגיבור רואים את הבית
  },
  rankup:{burst:{id:'wrank_burst',size:330,base:0.13,fps:26,add:true},   // base: איפה בסיס העמוד בתוך הפריים (חלק מהגודל מתחת למרכז), כדי שיעמוד על הרגליים
          badge:{id:'wrank_badge',size:170,up:125,fps:16,dur:2.4}},
  seen:{v:{},w:{}},stat:{rankup:0},pre:false
};
const fxvOn=()=>typeof fxImg==='function'&&typeof S!=='undefined'&&!!S&&!S.mb&&!!(S.vil||S.wd);
// פריים אחד של גיליון, במקום על המסך. מחזיר false כשהתמונה עוד לא מוכנה (ואז מי שקרא מצייר את הישן)
function fxvIcon(id,x,y,size,a){
  const im=fxImg(id),D=im&&FXDATA[id];if(!D)return false;
  const i=Math.floor(fxNowT()*FXV.npc.fps)%D.n;
  if(a!==1){ctx.save();ctx.globalAlpha=a}
  ctx.drawImage(im,(i%D.c)*D.s,Math.floor(i/D.c)*D.s,D.s,D.s,x-size/2,y-size/2,size,size);
  if(a!==1)ctx.restore();
  return true;
}
function fxvPre(){if(FXV.pre||typeof fxPreload!=='function')return;FXV.pre=true;const N=FXV.npc.ids;fxPreload([N.turnin,N.quest,N.shop,N.talk,FXV.rankup.burst.id,FXV.rankup.badge.id])}
// סימן קווסט (! !! ✓) במקום העיגול. x,y: מרכז העיגול הישן. true = צויר
function fxvMark(m,x,y,where){
  if(!fxvOn())return false;fxvPre();const N=FXV.npc,k=m==='✓'?'turnin':'quest';
  if(!fxvIcon(N.ids[k],x,y,N.size*(m==='!!'?N.rank:1),N.a))return false;
  return true;
}
/* חנות ושיחה: לדמויות בלי סימן קווסט. mark: הסימנים שהציור כבר חישב. where: v כפר, w עולם.
   pos(id): מרכז הסימן על המסך. נקרא לפני הלולאה של הסימנים, כך שכל דמות מקבלת סימן אחד בלבד */
function fxvNpcIcons(mark,where,pos){
  const seen=FXV.seen[where];for(const k in seen)delete seen[k];
  for(const id in mark)seen[id]=mark[id]==='✓'?'turnin':'quest';
  if(!fxvOn())return;fxvPre();
  const N=FXV.npc,vil=where==='v',all=vil?(typeof npcState==='function'?npcState():null):S.wd&&S.wd.npc;if(!all)return;
  const dlg=vil?S.vil.dlg:S.wd.dlg,near=vil?S.vil.npcNear:S.wd.npcNear;
  for(const id in all){
    if(mark[id]||dlg===id||vil&&typeof npcHere==='function'&&!npcHere(id))continue;
    const n=all[id];if(n.emote)continue;let k=null;   // בזמן נפנוף (👋) לא מכסים אותו
    if(vil&&(N.shop.includes(id)||/^v/.test(id))&&Math.hypot(P.x-n.x,P.y-n.y)<N.shopNear)k='shop';
    else if(near===id)k='talk';
    if(!k)continue;const p=pos(id,n);
    if(fxvIcon(N.ids[k],p.x,p.y,N.size*N.small,N.a))seen[id]=k;
  }
}
// עליית דרגה: נקרא מ-celebrate (fx.js)
function fxvCelebrate(x,y,kind){
  if(kind!=='rankup'||!fxvOn()||typeof fxPlay!=='function'||!P)return;
  const B=FXV.rankup.burst,G=FXV.rankup.badge;FXV.stat.rankup++;
  fxPlay(B.id,P.x,P.y,{follow:P,size:B.size,dy:-B.size*B.base,fps:B.fps,add:B.add});
  fxPlay(G.id,P.x,P.y,{follow:P,size:G.size,dy:-G.up,fps:G.fps,dur:G.dur});
}
