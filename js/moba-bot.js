/* משחקי השאול: הבוטים (moba.js). אותו מוח לשני החברים של השחקן ולשלושת האויבים.
   כל בוט מחליט פעם ב-think שניות מה עושים, לפי הסדר: נסוג להתרפא, יוצא מאזור מסומן, מתרחק ממגדל שמכה בו,
   נלחם בגיבור (רק כשיש יתרון או שהאויב חלש), מגן על מגדל, ואחרת דוחף מאחורי החיילים ולוקח XP.
   הסקילים רק כשהם יפגעו. הצייד מחכה רגע לגל המים של הקוסמת, בשביל חשמול. הנפח מהמם רק מי שלא חסין */
const MBBOT={
  think:0.25,     // שניות בין החלטות
  retreat:0.35,   // פחות מזה מהחיים: חוזר לבסיס
  back:0.9,       // ומתרפא עד שיש לו את זה
  engage:520,     // מאיזה מרחק מסתכלים על גיבורי האויב
  defend:900,     // מאיזה מרחק באים להגן על מגדל
  dodge:0.55,     // הסיכוי שבוט שם לב לאזור מסומן ויוצא ממנו
  wait:1.2,       // כמה שניות הצייד מחכה לגל המים של הקוסמת
};

function mbBot(u,dt){
  const B=u.bot,A=MBKIT[u.kit].atk;B.t-=dt;
  if(u.st.taunt>0&&u.st.tBy){mbMove(u,u.st.tBy.x,u.st.tBy.y,dt,u.r+u.st.tBy.r);mbAttack(u,dt,u.st.tBy,A);return}   // הוכרח: רק אל הנפח
  if(B.t<=0){B.t=MBBOT.think*rand(0.8,1.2);mbThink(u)}
  if(B.goal)mbMove(u,B.goal.x,B.goal.y,dt,B.stop||6);
  const f=B.focus,t=f&&!f.dead&&mbHittable(f)&&mbDist(u,f)-f.r-u.r<=A.range?f:mbAutoTarget(u,A.range);
  mbAttack(u,dt,t,A);
  B.skT=(B.skT||0)-dt;if(B.skT<=0){B.skT=0.15;mbBotSkills(u)}
}

function mbThink(u){
  const B=u.bot,K=MBKIT[u.kit],A=K.atk,dir=u.team?-1:1;   // dir: לכיוון הבסיס של האויב
  const foeH=MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead);
  const allyH=MB.u.filter(o=>o.k==='hero'&&o.team===u.team&&!o.dead&&o!==u);
  const near=(list,r)=>list.filter(o=>mbDist(o,u)<r);
  B.stop=6;B.focus=null;
  // 1. נסוג: חיים נמוכים, עד שהתרפא ליד הבסיס
  if(u.hp<u.max*MBBOT.retreat||B.mode==='retreat'&&u.hp<u.max*MBBOT.back){B.mode='retreat';B.goal=u.home;return}
  // 2. אזור מסומן של האויב: יוצאים ממנו (לא תמיד שמים לב)
  const z=MB.zones.find(z=>{if(z.team===u.team||z.delay<0.1&&!z.tick||Math.hypot(z.x-u.x,z.y-u.y)>z.r+u.r)return false;
    const s=z.seen||(z.seen={});if(s[u.id]===undefined)s[u.id]=Math.random()<MBBOT.dodge;return s[u.id]});
  if(z){const a=Math.atan2(u.y-z.y,u.x-z.x),d=z.r+u.r+24;B.mode='dodge';B.goal={x:z.x+Math.cos(a)*d,y:z.y+Math.sin(a)*d};return}
  // 3. מגדל של האויב מכה בי: מתרחקים מהטווח שלו
  const tw=MB.u.find(b=>(b.k==='tower'||b.k==='base')&&b.team!==u.team&&!b.dead&&b.tgt===u);
  if(tw){B.mode='back';B.goal={x:tw.x-dir*((tw.k==='base'?MOBA.base:MOBA.tower).range+90),y:u.y};return}
  // 4. גיבורי אויב קרובים: נלחמים רק עם יתרון, או כשהאויב כמעט מת
  const fh=near(foeH,MBBOT.engage);
  if(fh.length){
    const mine=near(allyH,MBBOT.engage).length+1,weak=fh.reduce((a,b)=>a.hp/a.max<=b.hp/b.max?a:b);
    const under=MB.u.some(b=>(b.k==='tower'||b.k==='base')&&b.team!==u.team&&!b.dead&&mbDist(b,weak)<MOBA.tower.range+20);
    const brave=mine>=fh.length&&u.hp>u.max*0.5||weak.hp<weak.max*0.3&&u.hp>u.max*0.4;
    if(brave&&(!under||weak.hp<weak.max*0.2)){
      B.mode='fight';B.focus=weak;const a=Math.atan2(u.y-weak.y,u.x-weak.x),r=A.range*0.85+weak.r+u.r;
      B.goal={x:weak.x+Math.cos(a)*r,y:weak.y+Math.sin(a)*r};return}
    if(!brave&&fh.some(o=>mbDist(o,u)<MBKIT[o.kit].atk.range+90)){B.mode='kite';B.goal={x:u.x-dir*160,y:u.y*0.7};return}
  }
  // 5. גיבור אויב ליד מגדל שלנו: באים להגן
  const mine=MB.u.filter(b=>(b.k==='tower'||b.k==='base')&&b.team===u.team&&!b.dead);
  const threat=foeH.find(o=>mine.some(b=>mbDist(o,b)<MOBA.tower.range+60));
  if(threat&&mbDist(threat,u)<MBBOT.defend){B.mode='defend';B.focus=threat;B.goal={x:threat.x,y:threat.y};B.stop=A.range*0.8;return}
  // 6. דוחפים: מאחורי החייל הכי קדמי שלנו. בלי חיילים מחכים ליד המגדל הקדמי
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
  const fight=B.mode==='fight'||B.mode==='defend';
  switch(u.kit){
    case 'tank':
      if(ready('s1')&&inR('s1')&&!(tgt.st.imm>0)&&B.mode!=='retreat'){mbCast(u,'s1',tgt);return}
      if(ready('s2')&&near(foeH,K.s2.r).length&&(fight||allyLow)){mbCast(u,'s2');return}
      if(ready('ult')&&tgt&&mbDist(u,tgt)<K.ult.range+60&&(allyLow||near(foeH,260).length>=2||B.mode==='retreat')){mbCast(u,'ult',{x:(u.x+tgt.x)/2,y:(u.y+tgt.y)/2});return}
      break;
    case 'warrior':
      if(ready('s1')&&inR('s1')&&fight&&u.hp>u.max*0.45){mbCast(u,'s1',tgt);return}
      if(ready('s2')&&(near(foeH,K.s2.r).length||near(foes,K.s2.r).length>=3)){mbCast(u,'s2');return}
      if(ready('ult')&&fight&&tgt&&mbDist(u,tgt)<220){mbCast(u,'ult');return}
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
      if(ready('s2')&&allies.some(o=>o.hp<o.max*0.55&&mbDist(o,u)<K.s2.r)){mbCast(u,'s2');return}
      if(ready('s1')&&(inR('s1')||!tgt&&near(foes,K.s1.range*0.8).length>=3)){mbCast(u,'s1',tgt||mbNearest(u,foes,K.s1.range));return}
      if(ready('ult')&&inR('ult')&&(held(tgt)||tgt.st.wet>0||near(foeH,K.ult.r,tgt).length>=2)&&!(tgt.st.imm>0)){mbCast(u,'ult',tgt);return}
      break;
  }
}
