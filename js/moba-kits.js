/* מוד מובה: ארבע הערכות (אוראל, 1.11.2026). התוכנית: docs/moba.md
   כוח שוויוני: לכל ערכה אותו "תקציב" של חיים, נזק לשנייה ומהירות, רק מחולק אחרת. הסקין של השחקן הוא רק מראה.
   לכל ערכה: תקיפה אוטומטית (atk), שני סקילים (s1, s2) וסקיל-על (ult) שנפתח ברמה 6 (MOBA.ultAt ב-moba.js).
   kind של סקיל אומר איך הוא מכוון: unit (אל גיבור), point (נקודה על הרצפה), line (קו קדימה), self (סביב עצמו), away (בורח).
   הנזק עולה עם הרמה (mbK ב-moba.js). השליטה בקהל (הלם, הכרחה) עוברת דרך mbCC, עם חסינות קצרה אחריה */
const MBKIT={
  // הנפח: הטנק. כל סקיל שולט בקהל: הלם, הכרחה לתקוף אותו, וחסימה (אוראל: "טנק צריך crowd control")
  tank:{icon:'🔨',dt:'earth',hp:1050,speed:148,front:true,def:0.15,   // def: פחות נזק אליו תמיד, כי הוא נלחם מקרוב
   
    atk:{dmg:30,range:46,cd:1.0,dt:'earth',slow:{k:0.2,t:1}},           // כל מכה בפטיש מאטה 20% לשנייה
    s1:{id:'anvil',kind:'point',cd:10,range:300,r:85,delay:0.7,dmg:80,stun:1.5,dt:'earth'},   // סדן נופל: מסומן על הרצפה, מהמם
    s2:{id:'taunt',kind:'self',cd:13,r:170,t:2,armor:0.5,armorT:2.6,burn:16,dt:'fire'},       // קריאת קרב: כולם תוקפים רק אותו, הוא סופג, ומי שמכה בו נשרף
    ult:{id:'wall',kind:'point',cd:55,range:170,t:4,stun:1,push:110,dt:'earth'}},             // חומת ברזל: הדף והלם, ואז חוסמת את הנתיב
  warrior:{icon:'⚔️',dt:'physical',hp:820,speed:165,front:true,def:0.1,
    atk:{dmg:50,range:50,cd:0.85,dt:'physical',leech:0.2},   // leech: 20% מהנזק חוזר אליו כחיים
    s1:{id:'charge',kind:'unit',cd:7,range:320,dmg:75,push:120,dt:'physical'},    // הסתערות: דוהר אל האויב והודף
    s2:{id:'spin',kind:'self',cd:8,r:120,dmg:105,dt:'physical'},                   // סיבוב חרב: כל מי שסביבו
    ult:{id:'rage',kind:'self',cd:55,t:5,speed:1.35,dmg:1.6,atkCd:0.7,def:0.25}},  // זעם: מהירות ונזק, ו-25% פחות נזק אליו
  hunter:{icon:'🏹',dt:'lightning',hp:540,speed:160,
    atk:{dmg:36,range:300,cd:0.9,dt:'physical',shot:true},
    s1:{id:'pierce',kind:'line',cd:8,range:640,w:26,dmg:90,speed:950,dt:'lightning'},   // חץ ברק שעובר דרך כולם. על רטוב: חשמול
    s2:{id:'leap',kind:'away',cd:9,dist:230},                                           // קפיצה אחורה
    ult:{id:'rain',kind:'point',cd:55,range:440,r:150,delay:0.5,t:3,dps:65,slow:0.3,dt:'physical'}},   // גשם חצים
  mage:{icon:'🔮',dt:'water',hp:560,speed:155,
    atk:{dmg:34,range:270,cd:1.0,dt:'water',shot:true},
    s1:{id:'wave',kind:'line',cd:8,range:440,w:70,dmg:70,speed:620,wet:3,slow:0.3,slowT:2,dt:'water'},   // גל מים: מרטיב ומאט
    s2:{id:'heal',kind:'self',cd:14,r:260,amt:110},                                                      // ריפוי לחברים קרובים
    ult:{id:'blizzard',kind:'point',cd:55,range:420,r:170,delay:0.6,dmg:80,freeze:1.5,dt:'ice'}},       // סופת קרח: מקפיאה. על רטוב: יותר זמן
};
const MB_SLOTS=['s1','s2','ult'];

// מטיל סקיל. aim: גיבור/יחידה, או נקודה {x,y}. מחזיר אם הוטל
function mbCast(u,slot,aim){
  const K=MBKIT[u.kit],s=K[slot];
  if(!s||u.dead||u.cd[slot]>0||u.st.stun>0||u.st.dash)return false;
  if(slot==='ult'&&u.lvl<MOBA.ultAt)return false;
  const k=mbK(u),ax=aim?aim.x:u.x+Math.cos(u.face)*100,ay=aim?aim.y:u.y+Math.sin(u.face)*100;
  const ang=Math.atan2(ay-u.y,ax-u.x),dist=Math.hypot(ax-u.x,ay-u.y);
  // נקודה בטווח: אם הכוונה רחוקה מדי, הסקיל נוחת בקצה הטווח
  const pt=()=>{const d=Math.min(dist,s.range||0);return{x:u.x+Math.cos(ang)*d,y:u.y+Math.sin(ang)*d}};
  const foesIn=(x,y,r)=>MB.u.filter(o=>o.team!==u.team&&!o.dead&&(o.k==='hero'||o.k==='minion')&&Math.hypot(o.x-x,o.y-y)<r+o.r);
  switch(s.id){
    case 'anvil':{const p=pt();mbZone(u,p.x,p.y,s.r,s.delay,z=>{for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.dmg*k,s.dt);mbCC(o,'stun',s.stun,u)}mbBoom(z.x,z.y,s.r,s.dt)},'anvil');break}
    case 'taunt':{for(const o of foesIn(u.x,u.y,s.r))mbCC(o,'taunt',s.t,u);u.st.armor=s.armorT;u.st.armorK=s.armor;u.st.burnBack=s.burn;mbBoom(u.x,u.y,s.r,'fire');mbWord(u,'taunt');break}
    case 'wall':{const p=pt();mbWall(u,p.x,s);break}
    case 'charge':{const t=aim&&aim.k?aim:null,d=Math.max(40,Math.min(s.range,dist-(t?t.r+u.r:0)));
      u.st.dash={vx:Math.cos(ang),vy:Math.sin(ang),sp:900,left:d,end:()=>{for(const o of foesIn(u.x,u.y,70)){mbDmg(u,o,s.dmg*k,s.dt);mbPush(o,ang,s.push)}mbBoom(u.x,u.y,70,s.dt)}};break}
    case 'spin':{for(const o of foesIn(u.x,u.y,s.r)){const d=mbDmg(u,o,s.dmg*k,s.dt);u.hp=Math.min(u.max,u.hp+d*(K.atk.leech||0))}mbBoom(u.x,u.y,s.r,s.dt);break}
    case 'rage':{u.st.rage=s.t;u.st.rageK=s.dmg;u.st.rageSp=s.speed;u.st.rageCd=s.atkCd;u.st.rageDef=s.def;mbWord(u,'rage');break}
    case 'pierce':case 'wave':{
      MB.shots.push({kind:'line',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{mbDmg(u,o,s.dmg*k,s.dt);if(s.wet){o.st.wet=Math.max(o.st.wet,s.wet);mbSlow(o,s.slow,s.slowT)}}});break}
    case 'leap':{const f=mbNearest(u,MB.u.filter(o=>o.team!==u.team&&!o.dead&&o.k==='hero'),400);
      const a=f?Math.atan2(u.y-f.y,u.x-f.x):Math.atan2(u.home.y-u.y,u.home.x-u.x);
      u.st.dash={vx:Math.cos(a),vy:Math.sin(a),sp:1100,left:s.dist,end:()=>{}};break}
    case 'rain':{const p=pt();mbZone(u,p.x,p.y,s.r,s.delay,null,'rain',{t:s.t,tick:(z,dt)=>{for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.dps*k*dt,s.dt,{quiet:true});mbSlow(o,s.slow,0.3)}}});break}
    case 'heal':{for(const o of MB.u)if(o.team===u.team&&o.k==='hero'&&!o.dead&&Math.hypot(o.x-u.x,o.y-u.y)<s.r){const v=Math.min(o.max-o.hp,s.amt*k);o.hp+=v;if(v>1)mbFloat(o.x,o.y-o.r-16,'+'+Math.round(v),'#7BD88F')}mbBoom(u.x,u.y,s.r,'heal');break}
    case 'blizzard':{const p=pt();mbZone(u,p.x,p.y,s.r,s.delay,z=>{for(const o of foesIn(z.x,z.y,z.r)){const wet=o.st.wet>0;mbDmg(u,o,s.dmg*k,s.dt);if(mbCC(o,'stun',s.freeze*(wet?MOBA.combo.freeze:1),u)&&wet){o.st.wet=0;mbWord(o,'freeze')}if(o.st.stun>0)o.st.ice=1}mbBoom(z.x,z.y,s.r,s.dt)},'blizzard');break}
  }
  u.cd[slot]=s.cd;u.face=ang;u.aim=ang;
  if(u.me){sfx(slot==='ult'?'levelup':'tap');if(slot==='ult')S.shake=Math.max(S.shake,4)}
  return true;
}
