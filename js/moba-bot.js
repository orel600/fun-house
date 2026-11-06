/* משחקי השאול: הבוטים (moba.js). אותו מוח לשני החברים של השחקן ולשלושת האויבים.
   כל בוט מחליט פעם ב-think שניות מה עושים, לפי הסדר: נסוג להתרפא, יוצא מאזור מסומן, מתרחק ממגדל שמכה בו,
   נלחם בגיבור (רק כשיש יתרון או שהאויב חלש), מגן על מגדל, ואחרת דוחף מאחורי החיילים ולוקח XP.
   הסקילים רק כשהם יפגעו. הצייד מחכה רגע לגל המים של הקוסמת, בשביל חשמול. הנפח מהמם רק מי שלא חסין,
   קופץ להציל חבר חלש, ומטיל את חומת הברזל איפה שיש הכי הרבה אויבים. הלוחם משתמש בזעם גם כדי לצאת מצרה */
const MBBOT={
  retreat:0.35,   // פחות מזה מהחיים: חוזר לבסיס
  back:0.9,       // ומתרפא עד שיש לו את זה
  engage:520,     // מאיזה מרחק מסתכלים על גיבורי האויב
  defend:900,     // מאיזה מרחק באים להגן על מגדל
  wait:1.2,       // כמה שניות הצייד מחכה לגל המים של הקוסמת
  brave:{hp:0.5,odds:0},   // החברים: נלחמים כשהם לפחות כמו האויבים ועם יותר מחצי חיים
  // רמת קושי (אוראל, 6.11: "השחקן הפסיד 4/4"): משנה רק את המוח של בוטי האויב, לא חיים ונזק (כוח שוויוני).
  // think: שניות בין החלטות. skill: כמה מהר מגיבים בסקיל. dodge: הסיכוי לצאת מאזור מסומן. hp ו-odds: נלחמים רק מעל hp מהחיים,
  // ורק כשיש להם odds גיבורים יותר מאשר לנו (אגרסיביות). buy: פי כמה לאט הם קונים חפצים. קשה = כמו החברים שלך
  diff:{
    easy:  {think:0.9, skill:1.4, dodge:0.15,hp:0.65,odds:1,buy:1.5},   // שחקן ממוצע מנצח בערך 60% (השחקן ה"טיפש" של הבדיקה: כ-55%)
    normal:{think:0.6, skill:0.75,dodge:0.3, hp:0.5, odds:0,buy:1},     // בערך 50%
    hard:  {think:0.25,skill:0.15,dodge:0.55,hp:0.5, odds:0,buy:1},
  },
  def:'easy',key:'fh-mb-diff',
};
// המוח של בוט: האויבים לפי רמת הקושי של המשחק (MB.diff), החברים תמיד כמו "קשה"
const mbFoe=()=>MBBOT.diff[MB&&MB.diff]||MBBOT.diff[MBBOT.def];
const mbMind=u=>u.team?mbFoe():MBBOT.diff.hard;
function mbDiffGet(){let d=null;try{d=localStorage.getItem(MBBOT.key)}catch(e){}return MBBOT.diff[d]?d:MBBOT.def}
function mbDiffSet(d){if(!MBBOT.diff[d])return;try{localStorage.setItem(MBBOT.key,d)}catch(e){}}

function mbBot(u,dt){
  const B=u.bot,A=MBKIT[u.kit].atk;B.t-=dt;
  if(u.st.taunt>0&&u.st.tBy){mbMove(u,u.st.tBy.x,u.st.tBy.y,dt,u.r+u.st.tBy.r);mbAttack(u,dt,u.st.tBy,A);return}   // הוכרח: רק אל הנפח
  if(B.t<=0){B.t=mbMind(u).think*rand(0.8,1.2);mbThink(u)}
  if(B.goal)mbMove(u,B.goal.x,B.goal.y,dt,B.stop||6);
  const f=B.focus,t=f&&!f.dead&&mbHittable(f)&&mbDist(u,f)-f.r-u.r<=A.range?f:mbAutoTarget(u,A.range);
  mbAttack(u,dt,t,A);
  B.skT=(B.skT||0)-dt;if(B.skT<=0){B.skT=mbMind(u).skill*(u.team?rand(0.7,1.3):1);mbBotSkills(u)}
}

function mbThink(u){
  const B=u.bot,K=MBKIT[u.kit],A=K.atk,dir=u.team?-1:1;   // dir: לכיוון הבסיס של האויב
  const foeH=MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead);
  const allyH=MB.u.filter(o=>o.k==='hero'&&o.team===u.team&&!o.dead&&o!==u);
  const near=(list,r)=>list.filter(o=>mbDist(o,u)<r);
  B.stop=6;B.focus=null;
  // 1. נסוג: חיים נמוכים, עד שהתרפא ליד הבסיס
  if(u.hp<u.max*MBBOT.retreat||B.mode==='retreat'&&u.hp<u.max*MBBOT.back){B.mode='retreat';B.goal=u.home;return}
  // פקודה מהשחקן (mbOrder ב-moba.js): נסיגה אל המגדל הקדמי שלנו, או התקפה יחד איתו
  const O=u.team===0&&MB.order;
  if(O&&O.kind==='back'){const t=MB.u.filter(b=>b.k==='tower'&&b.team===u.team&&!b.dead).sort((a,b)=>Math.abs(a.x)-Math.abs(b.x))[0]||MB.u.find(b=>b.k==='base'&&b.team===u.team);
    B.mode='order';B.goal={x:t.x-dir*90,y:u.home.y*0.6};return}
  if(O&&O.kind==='attack'){const me=MB.me,near=MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead&&mbDist(o,me.dead?u:me)<MBBOT.engage);
    const tgt=near.length?near.reduce((a,b)=>a.hp/a.max<=b.hp/b.max?a:b):MB.u.filter(b=>(b.k==='tower'||b.k==='base')&&b.team!==u.team&&mbHittable(b)).sort((a,b)=>mbDist(a,u)-mbDist(b,u))[0];
    if(tgt){B.mode='order';B.focus=tgt;const a=Math.atan2(u.y-tgt.y,u.x-tgt.x),r=A.range*0.85+tgt.r+u.r;B.goal={x:tgt.x+Math.cos(a)*r,y:tgt.y+Math.sin(a)*r};return}}
  // 2. אזור מסומן של האויב: יוצאים ממנו (לא תמיד שמים לב)
  const z=MB.zones.find(z=>{if(z.team===u.team||z.delay<0.1&&!z.tick||Math.hypot(z.x-u.x,z.y-u.y)>z.r+u.r)return false;
    const s=z.seen||(z.seen={});if(s[u.id]===undefined)s[u.id]=Math.random()<mbMind(u).dodge;return s[u.id]});
  if(z){const a=Math.atan2(u.y-z.y,u.x-z.x),d=z.r+u.r+24;B.mode='dodge';B.goal={x:z.x+Math.cos(a)*d,y:z.y+Math.sin(a)*d};return}
  // 3. מגדל של האויב מכה בי: מתרחקים מהטווח שלו
  const tw=MB.u.find(b=>(b.k==='tower'||b.k==='base')&&b.team!==u.team&&!b.dead&&b.tgt===u);
  if(tw){B.mode='back';B.goal={x:tw.x-dir*((tw.k==='base'?MOBA.base:MOBA.tower).range+90),y:u.y};return}
  // 4. גיבורי אויב קרובים: נלחמים רק עם יתרון, או כשהאויב כמעט מת
  const fh=near(foeH,MBBOT.engage);
  if(fh.length){
    const mine=near(allyH,MBBOT.engage).length+1,weak=fh.reduce((a,b)=>a.hp/a.max<=b.hp/b.max?a:b);
    const under=MB.u.some(b=>(b.k==='tower'||b.k==='base')&&b.team!==u.team&&!b.dead&&mbDist(b,weak)<MOBA.tower.range+20);
    const D=u.team?mbFoe():MBBOT.brave,brave=mine>=fh.length+D.odds&&u.hp>u.max*D.hp||weak.hp<weak.max*0.3&&u.hp>u.max*0.4;
    if(brave&&(!under||weak.hp<weak.max*0.2)){
      B.mode='fight';B.focus=weak;const a=Math.atan2(u.y-weak.y,u.x-weak.x),r=A.range*0.85+weak.r+u.r;
      B.goal={x:weak.x+Math.cos(a)*r,y:weak.y+Math.sin(a)*r};return}
    if(!brave&&fh.some(o=>mbDist(o,u)<MBKIT[o.kit].atk.range+90)){B.mode='kite';B.goal={x:u.x-dir*160,y:u.y*0.7};return}
  }
  // 5. גיבור אויב ליד מגדל שלנו: באים להגן
  const mine=MB.u.filter(b=>(b.k==='tower'||b.k==='base')&&b.team===u.team&&!b.dead);
  const threat=foeH.find(o=>mine.some(b=>mbDist(o,b)<MOBA.tower.range+60));
  if(threat&&mbDist(threat,u)<MBBOT.defend){B.mode='defend';B.focus=threat;B.goal={x:threat.x,y:threat.y};B.stop=A.range*0.8;return}
  // 6. מצור: מגדל של האויב מכה בחייל שלנו, ואין גיבורי אויב קרובים: תוקפים את המגדל
  const eT=MB.u.filter(b=>(b.k==='tower'||b.k==='base')&&b.team!==u.team&&mbHittable(b)).sort((a,b)=>mbDist(a,u)-mbDist(b,u))[0];
  if(eT&&!fh.length&&mbDist(eT,u)<900&&eT.tgt&&eT.tgt.k==='minion'&&eT.tgt.team===u.team){
    B.mode='siege';B.focus=eT;const a=Math.atan2(u.y-eT.y,u.x-eT.x),r=A.range*0.8+eT.r+u.r;B.goal={x:eT.x+Math.cos(a)*r,y:eT.y+Math.sin(a)*r};return}
  // 7. דוחפים: מאחורי החייל הכי קדמי שלנו. בלי חיילים מחכים ליד המגדל הקדמי
  B.mode='push';
  const mins=MB.u.filter(o=>o.k==='minion'&&o.team===u.team&&!o.dead);
  if(mins.length){const front=mins.reduce((a,b)=>(b.x-a.x)*dir>0?b:a),gap=K.front?20:A.shot?150:60;
    B.goal={x:front.x-dir*gap,y:front.y*0.4+u.home.y*0.6}}
  else{const t=mine.filter(b=>b.k==='tower').sort((a,b)=>Math.abs(a.x)-Math.abs(b.x))[0]||mine[0];B.goal={x:t.x+dir*70,y:u.home.y}}
  // מכה אחרונה בחייל חלש בטווח: ה-XP הולך לכולם בסביבה, אבל ככה הגל זז מהר יותר
  const low=MB.u.find(o=>o.k==='minion'&&o.team!==u.team&&!o.dead&&mbDist(o,u)<A.range+40&&o.hp<A.dmg*mbK(u)*1.2);
  if(low)B.focus=low;
}

function mbBotSkills(u){
  if(u.st.stun>0||u.st.dash)return;
  const B=u.bot,K=MBKIT[u.kit],ready=s=>u.cd[s]<=0&&(s!=='ult'||u.lvl>=MOBA.ultAt);
  const foeH=MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead);
  const foes=MB.u.filter(o=>o.team!==u.team&&!o.dead&&(o.k==='hero'||o.k==='minion'));
  const near=(list,r,c=u)=>list.filter(o=>mbDist(o,c)<r+o.r);
  const tgt=B.focus&&B.focus.k==='hero'&&!B.focus.dead?B.focus:mbNearest(u,foeH,650);
  const inR=s=>tgt&&mbDist(u,tgt)<=K[s].range;
  const allies=MB.u.filter(o=>o.k==='hero'&&o.team===u.team&&!o.dead);
  const allyLow=allies.some(o=>o.hp<o.max*0.4&&mbDist(o,u)<350);
  const held=t=>t.st.stun>0||t.st.slow>0;
  const fight=B.mode==='fight'||B.mode==='defend'||B.mode==='order'&&MB.order&&MB.order.kind==='attack';
  switch(u.kit){
    case 'tank':{
      // סדן: קופץ פנימה כשנלחמים, או כדי להציל חבר חלש מגיבור שרודף אחריו
      const peel=foeH.find(o=>!(o.st.imm>0)&&mbDist(o,u)<=K.s1.range&&allies.some(a=>a!==u&&a.hp<a.max*0.4&&mbDist(a,o)<180));
      const jump=peel||(fight&&inR('s1')&&!(tgt.st.imm>0)&&u.hp>u.max*0.35?tgt:null);
      if(ready('s1')&&jump&&B.mode!=='retreat'){mbCast(u,'s1',jump);return}
      if(ready('s2')&&near(foeH,K.s2.r).length&&(fight||allyLow)){mbCast(u,'s2');return}
      // חומת ברזל: הנקודה עם הכי הרבה גיבורי אויב בתוך הרדיוס. שניים ומעלה, או אחד כשחבר בצרה
      if(ready('ult')){let best=null,bn=0;for(const o of foeH){if(mbDist(u,o)>K.ult.range+K.ult.r*0.5)continue;const n=near(foeH,K.ult.r,o).length;if(n>bn){bn=n;best=o}}
        if(best&&(bn>=2||allyLow||fight&&held(best))){mbCast(u,'ult',best);return}}
      break}
    case 'warrior':
      if(ready('s1')&&inR('s1')&&fight&&u.hp>u.max*0.4){mbCast(u,'s1',tgt);return}
      if(ready('s2')&&(near(foeH,K.s2.r).length||near(foes,K.s2.r).length>=3)){mbCast(u,'s2');return}
      // זעם: כשנלחמים קרוב, או כדי לצאת מצרה (אי אפשר להמם אותו בזמן הזעם)
      if(ready('ult')&&(fight&&tgt&&mbDist(u,tgt)<220||u.hp<u.max*0.45&&near(foeH,K.ult.r).length)){mbCast(u,'ult');return}
      break;
    case 'hunter':
      if(ready('s2')&&(near(foeH,130).length&&u.hp<u.max*0.7||B.mode==='retreat'&&near(foeH,220).length)){mbCast(u,'s2');return}
      if(ready('s1')&&inR('s1')){
        // קומבו: אם הקוסמת שלנו קרובה ועומדת להרטיב, מחכים לה רגע
        const mage=allies.find(o=>o.kit==='mage'&&o!==u&&mbDist(o,tgt)<500&&o.cd.s1<1);
        if(tgt.st.wet>0||!mage||(B.wait=(B.wait||0)+0.15)>MBBOT.wait){B.wait=0;mbCast(u,'s1',tgt);return}}
      if(ready('ult')&&inR('ult')&&(held(tgt)||near(foeH,K.ult.r,tgt).length>=2)){mbCast(u,'ult',tgt);return}
      break;
    case 'mage':
      // ריפוי ומגן: חבר חלש קרוב, או חבר קרוב שגיבור אויב צמוד אליו
      if(ready('s2')&&allies.some(o=>mbDist(o,u)<K.s2.r&&(o.hp<o.max*0.55||o.hp<o.max*0.85&&foeH.some(f=>mbDist(f,o)<120)))){mbCast(u,'s2');return}
      if(ready('s1')&&(inR('s1')||!tgt&&near(foes,K.s1.range*0.8).length>=3)){mbCast(u,'s1',tgt||mbNearest(u,foes,K.s1.range));return}
      if(ready('ult')&&inR('ult')&&(held(tgt)||tgt.st.wet>0||near(foeH,K.ult.r,tgt).length>=2)&&!(tgt.st.imm>0)){mbCast(u,'ult',tgt);return}
      break;
  }
}
