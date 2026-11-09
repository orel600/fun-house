/* מוד מובה: ארבע הערכות (אוראל, 1.11.2026). התוכנית: docs/moba.md
   כוח שוויוני: לכל ערכה אותו "תקציב" של חיים, נזק לשנייה ומהירות, רק מחולק אחרת. הסקין של השחקן הוא רק מראה.
   לכל ערכה: תקיפה אוטומטית (atk), שני סקילים (s1, s2) וסקיל-על (ult) שנפתח ברמה 6 (MOBA.ultAt ב-moba.js).
   kind של סקיל אומר איך הוא מכוון: unit (אל גיבור), point (נקודה על הרצפה), line (קו קדימה), self (סביב עצמו), away (בורח).
   זינוק וריפוי עברו לכפתורים של כל הגיבורים (לחשים), ולכן הסקילים שהיו בעיקר זינוק או ריפוי הוחלפו (docs/moba-plan.md פרק 2, 6.11.2026):
   גל חרב (cleave) במקום הסתערות, רשת ציד (net, לוכדת: root) במקום קפיצה אחורה, כלא מים (bubble) במקום ריפוי.
   הנזק עולה עם הרמה (mbK ב-moba.js). השליטה בקהל (הלם, הכרחה) עוברת דרך mbCC, עם חסינות קצרה אחריה */
const MBKIT={
  // הנפח: הטנק. כל סקיל שולט בקהל (אוראל: "טנק צריך crowd control"), ויש לו דרך להגיע (קפיצה) ולספוג (מגן)
  // lunge: כשהמטרה קצת מחוץ לטווח, התקיפה הרגילה מזנקת אליה (פעם ב-lungeCd שניות). כך טנק ולוחם לא רודפים לנצח (אוראל, 3.11)
  tank:{icon:'🔨',dt:'earth',hp:1050,speed:150,front:true,def:0.15,   // def: פחות נזק אליו תמיד, כי הוא נלחם מקרוב
    atk:{dmg:30,range:46,cd:1.0,dt:'earth',slow:{k:0.25,t:1.2},lunge:95,lungeCd:2.5},   // כל מכה בפטיש מאטה 25%: מי שנפגע לא בורח
    s1:{id:'anvil',kind:'point',cd:10,range:300,r:95,dmg:80,stun:1.1,dt:'earth',
      field:{k:0.30,t:2}},   // סדן נופל: קופץ אל הנקודה ונוחת כמו סדן, מהמם מסביב. field (חבילת הבוקר, השינוי היחיד שאושר): אחרי הנחיתה שדה ברדיוס של המכה, מאט אויבים 30% כל עוד הם בו, 2 שניות. ערכים התחלתיים שלא נבדקו: מכוונים רק דרך tools/moba-balance.js ואוראל   // סדן נופל: קופץ אל הנקודה ונוחת כמו סדן, מהמם מסביב
    s2:{id:'taunt',kind:'self',cd:13,r:170,t:1.8,pull:55,shield:170,shieldT:3,burn:16,dt:'fire'},   // קריאת קרב: מושך קצת, כולם תוקפים רק אותו, מגן שסופג, ומי שמכה בו נשרף
    ult:{id:'wall',kind:'point',cd:50,range:220,r:180,dmg:110,stun:1.3,t:4,dt:'earth'}},   // חומת ברזל: מושכת את כולם לנקודה, מהממת, וחומה עולה מאחוריהם וחוסמת את הבריחה
  // הלוחם: נלחם מקרוב, נכנס ולא יוצא. גל חרב שמגיע רחוק ומהמם, סיבוב שמחזיר חיים, וזעם שאי אפשר לעצור
  warrior:{icon:'⚔️',dt:'physical',hp:820,speed:165,front:true,def:0.1,
    atk:{dmg:48,range:50,cd:0.85,dt:'physical',leech:0.2,lunge:85,lungeCd:2},   // leech: 20% מהנזק חוזר אליו כחיים
    s1:{id:'cleave',kind:'line',cd:7,range:280,w:70,dmg:85,stun:0.6,slow:0.3,slowT:1.5,speed:900,dt:'physical'},   // גל חרב: גל הדף לאורך קו, עובר דרך כולם, הלם קצר והאטה
    s2:{id:'spin',kind:'self',cd:8,r:125,dmg:95,heal:0.5,dt:'physical'},             // סיבוב חרב: כל מי שסביבו, וחצי מהנזק חוזר כחיים
    ult:{id:'rage',kind:'self',cd:50,t:5,r:150,dmg0:90,speed:1.3,dmg:1.5,atkCd:0.7,def:0.25,imm:2.5}},   // זעם: גל הדף, מהירות ונזק, פחות נזק אליו ושום הלם לא תופס בו
  hunter:{icon:'🏹',dt:'lightning',hp:540,speed:160,
    atk:{dmg:34,range:300,cd:0.9,dt:'physical',shot:true,crit:{p:0.2,k:1.8}},   // crit: מכה קריטית, מספר גדול
    s1:{id:'pierce',kind:'line',cd:8,range:640,w:28,dmg:90,speed:1000,dt:'lightning'},   // חץ ברק שעובר דרך כולם. על רטוב: חשמול
    s2:{id:'net',kind:'line',cd:9,range:460,w:26,dmg:50,root:1.2,speed:820,dt:'physical',flee:{t:1.2,k:1.45}},   // flee: אחרי שהרשת תופסת, הצייד מהיר ×1.45 לשנייה ורבע (אוראל, 7.11: "אין לו בריחה")   // רשת ציד: נעצרת בגיבור הראשון ולוכדת אותו (לא זז, אבל תוקף). עוברת מעל חיילים
    ult:{id:'rain',kind:'point',cd:50,range:440,r:150,delay:0.5,t:3,dps:65,slow:0.3,end:90,dt:'physical'}},   // גשם חצים, ובסוף מטח אחרון
  mage:{icon:'🔮',dt:'water',hp:560,speed:155,
    atk:{dmg:34,range:270,cd:1.0,dt:'water',shot:true},
    s1:{id:'wave',kind:'line',cd:8,range:440,w:70,dmg:70,speed:620,wet:3,slow:0.3,slowT:2,dt:'water'},   // גל מים: מרטיב ומאט
    s2:{id:'bubble',kind:'point',cd:11,range:380,r:100,delay:0.4,lift:1.1,dmg:80,wet:3,dt:'water'},           // כלא מים: בועה שמרימה את האויבים (כמו הלם) ומרטיבה. אחריה ברק או קרח: קומבו
    ult:{id:'blizzard',kind:'point',cd:50,range:420,r:170,delay:0.6,dmg:80,freeze:1.5,dt:'ice'}},       // סופת קרח: מקפיאה. על רטוב: יותר זמן
  // המתנקש: מחסל. נכנס מהגב, מוציא מטרה חלשה ויוצא. בלי שליטה קשיחה ובלי ריפוי: טעות עולה בחיים (8.11.2026)
  assassin:{icon:'🗡️',dt:'physical',hp:520,speed:170,
    atk:{dmg:42,range:48,cd:0.7,dt:'physical',lunge:100,lungeCd:1.8,backstab:1.75},   // backstab: מכה מאחורי הכיוון שהמטרה פונה אליו ×1.75, נחשבת קריטי
    s1:{id:'shadowstep',kind:'unit',cd:9,range:360,dmg:85,bonus:95,bonusT:2.5,slow:0.35,slowT:1,dt:'physical'},   // צעד צל: מופיע מאחורי המטרה. התקיפה הבאה מחוזקת ומאטה
    s2:{id:'vanish',kind:'self',cd:11,flip:130,t:2,speed:1.4,crit:1.8,dt:'physical'},   // היעלמות: עשן וקפיצה הרחק מהאויב. מכוסה: מגדלים, חיילים ובוטים לא מכוונים אליו. תקיפה שוברת, והיא קריטית ×crit
    ult:{id:'deathmark',kind:'unit',cd:50,range:300,t:2,share:0.5,end:120,dt:'physical'}},   // סימן מוות: גולגולת מעל המטרה, ואז פיצוץ עם חלק מהנזק שנצבר בחלון. הריגה: צעד צל נטען
};
const MB_VEIL_A=0.45;   // מתנקש מכוסה (היעלמות): כמה הוא שקוף, בדו-ממד ובתלת-ממד (mbVisFade ב-moba-vision.js)
const MB_SLOTS=['s1','s2','ult'];
const MB_MOVES={anvil:1,shadowstep:1,vanish:1};   // סקילים שמזיזים את מי שמטיל אותם: אי אפשר כשהוא לכוד (st.root)

// מטיל סקיל. aim: גיבור/יחידה, או נקודה {x,y}. מחזיר אם הוטל
function mbCast(u,slot,aim){
  const K=MBKIT[u.kit],s=K[slot];
  if(!s||u.dead||u.cd[slot]>0||u.st.stun>0||u.st.dash)return false;
  if(u.st.root>0&&MB_MOVES[s.id])return false;
  if(MB_MOVES[s.id]&&typeof mbGbBusy==='function'&&mbGbBusy(u))return false;   // בהטלה בחדר ההימור לא זזים: בלי טעינה (הבודק, 7.11)   // לכוד ברשת: רק סקילים שלא מזיזים אותו
  if(slot==='ult'&&u.lvl<MOBA.ultAt)return false;
  if(s.kind==='unit'&&!mbUnitOk(u,s,aim))return false;   // סקיל על יחידה בלי מטרה חוקית: לא מוטל ולא נכנס לטעינה
  if(u.st.veil>0){u.st.veil=0;u.st.veilSp=1;u.st.veilCrit=0}   // כל סקיל מסיר את הכיסוי של ההיעלמות
  const k=mbK(u)*(1+mbIb(u).sk),ax=aim?aim.x:u.x+Math.cos(u.face)*100,ay=aim?aim.y:u.y+Math.sin(u.face)*100;
  const ang=Math.atan2(ay-u.y,ax-u.x),dist=Math.hypot(ax-u.x,ay-u.y);
  // נקודה בטווח: אם הכוונה רחוקה מדי, הסקיל נוחת בקצה הטווח
  const pt=()=>{const d=Math.min(dist,s.range||0);return{x:u.x+Math.cos(ang)*d,y:u.y+Math.sin(ang)*d}};
  const foesIn=(x,y,r)=>MB.u.filter(o=>o.team!==u.team&&!o.dead&&(o.k==='hero'||o.k==='minion')&&Math.hypot(o.x-x,o.y-y)<r+o.r);
  mbAnimCast(u,s,slot,ang);   // הבזק ההטלה ומצב על המטיל (moba-skill-anim.js). רק מראה
  switch(s.id){
    case 'anvil':{const p=pt(),d=Math.hypot(p.x-u.x,p.y-u.y);   // קופץ ונוחת: הלם ונזק מסביב לנקודת הנחיתה
      u.st.dash={vx:Math.cos(ang),vy:Math.sin(ang),sp:800,left:Math.max(1,d),jump:true,end:()=>{for(const o of foesIn(u.x,u.y,s.r)){mbDmg(u,o,s.dmg*k,s.dt,{big:true});mbCC(o,'stun',s.stun,u);mbAnimHit(o,s.dt)}(typeof mbSharpBoom==='function'?mbSharpBoom('anvil',u.x,u.y,s.r,s.dt):mbBoom(u.x,u.y,s.r,s.dt));(typeof mbSharpSlam==='function'?mbSharpSlam('anvil',u,s.r,s.dt):mbfxSlam(u,s.r,s.dt));mbfxSk('sk_anvil',u.x,u.y,{r:s.r,hold:s.field?s.field.t:0});mbfxSk('sk_anvil_wave',u.x,u.y,{r:s.r});mbAnimLand('anvil',u.x,u.y,s);
        if(s.field)mbZone(u,u.x,u.y,s.r,0,null,'anvil',{t:s.field.t,tick:z=>{for(const o of foesIn(z.x,z.y,z.r))mbSlow(o,s.field.k,0.2)}})}};break}   // רק האטה: בלי נזק ובלי הלם נוסף. מגדלים ובסיסים לא (foesIn, mbSlow). יוצאים מהשדה: נגמר תוך 0.2 שנייה
    case 'taunt':{for(const o of foesIn(u.x,u.y,s.r)){mbPull(o,u.x,u.y,s.pull,u.r+o.r+6);if(mbCC(o,'taunt',s.t,u))mbAnimTaunt(o,s.t)}
      mbShield(u,s.shield*k,s.shieldT);u.st.armor=s.shieldT;u.st.armorK=0;u.st.burnBack=s.burn;(typeof mbSharpBoom==='function'?mbSharpBoom('taunt',u.x,u.y,s.r,'fire'):mbBoom(u.x,u.y,s.r,'fire'));mbWord(u,'taunt');mbfxSk('sk_taunt',u.x,u.y,{r:s.r,follow:u,loop:true,dur:s.t});break}
    case 'wall':{const p=pt(),dir=u.team?-1:1;   // מושך את כולם אל הנקודה, הלם, וחומה בצד שלהם (אל הבסיס שלהם) שחוסמת את הבריחה
      for(const o of foesIn(p.x,p.y,s.r)){mbPull(o,p.x,p.y,s.r,o.r+8);mbDmg(u,o,s.dmg*k,s.dt,{big:true});mbCC(o,'stun',s.stun,u);mbAnimHit(o,s.dt)}
      MB.walls.push({x:p.x+dir*(s.r*0.55),team:u.team,t:s.t});mbfxSk('sk_wall',p.x+dir*(s.r*0.55),p.y,{loop:true,dur:s.t});(typeof mbSharpBoom==='function'?mbSharpBoom('wall',p.x,p.y,s.r,s.dt):mbBoom(p.x,p.y,s.r,s.dt));(typeof mbSharpSlam==='function'?mbSharpSlam('wall',Object.assign({},u,{x:p.x,y:p.y}),s.r,s.dt):mbfxSlam(Object.assign({},u,{x:p.x,y:p.y}),s.r,s.dt));mbAnimLand('wall',p.x,p.y,s);break}
    case 'cleave':{   // גל חרב: קשת של הדף שטסה לאורך הקו (moba-fx.js מצייר אותה)
      const sh={kind:'line',fx:'cleave',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{mbDmg(u,o,s.dmg*k,s.dt,{big:o.k==='hero'});mbCC(o,'stun',s.stun,u);mbSlow(o,s.slow,s.slowT);mbfxHit(o,'cleave');mbAnimHit(o,s.dt)}};
      MB.shots.push(sh);mbAnimShot(sh,s,ang);mbfxCleave(u,ang,s);mbfxSk('sk_cleave',u.x+Math.cos(ang)*30,u.y+Math.sin(ang)*30-10,{rot:ang+Math.PI});break}
    case 'spin':{let got=0;for(const o of foesIn(u.x,u.y,s.r)){got+=mbDmg(u,o,s.dmg*k,s.dt);mbAnimHit(o,s.dt)}u.hp=Math.min(u.max,u.hp+got*s.heal);
      if(got*s.heal>5){mbFloat(u.x,u.y-u.r-16,'+'+Math.round(got*s.heal),'#7BD88F');mbAnimHeal(u)}mbBoom(u.x,u.y,s.r,s.dt);mbfxSpin(u,s.r);mbfxSk('sk_spin',u.x,u.y,{r:s.r,follow:u});break}
    case 'rage':{Object.assign(u.st,{rage:s.t,rageK:s.dmg,rageSp:s.speed,rageCd:s.atkCd,rageDef:s.def,stun:0,taunt:0,root:0,bub:0,imm:s.imm,ice:0});
      for(const o of foesIn(u.x,u.y,s.r)){mbDmg(u,o,s.dmg0*k,'physical',{big:true});mbPush(o,Math.atan2(o.y-u.y,o.x-u.x),40);mbAnimHit(o,'physical')}
      mbBoom(u.x,u.y,s.r,'physical');mbWord(u,'rage');mbfxSk('sk_rage',u.x,u.y,{follow:u,loop:true,dur:s.t});mbfxSk('sk_rage_glow',u.x,u.y,{follow:u,loop:true,dur:s.t});break}
    case 'pierce':case 'wave':{
      const L=s.id==='pierce',sh={kind:'line',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{mbDmg(u,o,s.dmg*k,s.dt,{big:o.k==='hero'});if(s.wet){o.st.wet=Math.max(o.st.wet,s.wet);mbSlow(o,s.slow,s.slowT)}
          mbAnimHit(o,s.dt,L?MBANIM.pierce.hit:null)}};   // פגיעה לפי סוג הנזק, גדולה על גיבור (moba-skill-anim.js). חץ הברק: קצר יותר (fps 60), רק בפגיעה מאושרת
      if(L){sh.trail=1;sh.x0=u.x;sh.y0=u.y;sh.end=mbPierceEnd}   // חץ הברק (#513): פס מאחורי החץ, ונקודה עמומה כשהוא נעצר
      MB.shots.push(sh);
      // האפקט שעף עם הסקיל (אוראל, 7.11: "חץ הברק וגל המים עפים בלי שום אפקט"), והבזק ביד של המטיל
      if(typeof fxPlay==='function'){const c=fxPlay(L?'sk_pierce':'sk_wave',u.x,u.y,{follow:sh,rot:ang,loop:true,size:L?MBANIM.pierce.core:s.w*2.2,add:L});if(L&&c)sh.lib=1;   // lib: הליבה מהספרייה, בלי החץ המצויר (בלי גיליון: החץ המצויר נשאר)
        if(!L)fxPlay('sk_wave_crest',u.x+Math.cos(ang)*40,u.y+Math.sin(ang)*40,{rot:ang,size:140})}   // חץ הברק: פס השחרור ב-MBANIM.flash.pierce, ביד
      break}
    case 'net':{   // רשת ציד: עפה פתוחה, ונסגרת על הגיבור הראשון שהיא פוגעת בו. חיילים לא עוצרים אותה
      const n={kind:'line',fx:'net',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{if(o.k!=='hero'||n.gone)return;n.gone=true;mbDmg(u,o,s.dmg*k,s.dt,{big:true});if(mbCC(o,'root',s.root,u)){mbWord(o,'root');MBFX_N(o).rootFx=mbfxSk('sk_net_root',o.x,o.y,{follow:o,loop:true,dur:o.st.root})}mbfxHit(o,'net');mbAnimHit(o,s.dt)}};
      MB.shots.push(n);mbfxSk('sk_net',u.x,u.y,{follow:n,loop:true,rot:ang+MBFXSK.netRot,dur:s.range/s.speed});break}
    case 'rain':{const p=pt();mbfxSk('sk_rain',p.x,p.y,{r:s.r,loop:true,dur:s.delay+s.t});mbZone(u,p.x,p.y,s.r,s.delay,null,'rain',{t:s.t,tick:(z,dt)=>{mbAnimRain(z);for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.dps*k*dt,s.dt,{quiet:true});mbSlow(o,s.slow,0.3);mbAnimTick(o)}
      if(z.left-dt<=0){for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.end*k,s.dt,{big:true});mbAnimHit(o,s.dt)}mbBoom(z.x,z.y,z.r,s.dt);mbfxBlast(z.x,z.y,z.r,dtCol(s.dt));mbAnimLand('rain',z.x,z.y,s)}}});break}   // מטח אחרון
    case 'bubble':{const p=pt();mbfxSk('sk_bubble_aura',p.x,p.y,{r:s.r,loop:true,dur:s.delay+0.3});mbZone(u,p.x,p.y,s.r,s.delay,z=>{   // כלא מים: אחרי רגע הבועה עולה, מרימה (הלם) ומרטיבה. רטוב + ברק או קרח = קומבו (moba.js)
      for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.dmg*k,s.dt,{big:o.k==='hero'});o.st.wet=Math.max(o.st.wet,s.wet);if(mbCC(o,'stun',s.lift,u)){o.st.bub=s.lift;MBFX_N(o).bubFx=mbfxSk('sk_bubble',o.x,o.y,{follow:o,loop:true,dur:s.lift})}mbAnimHit(o,s.dt)}
      mbBoom(z.x,z.y,s.r,s.dt);mbfxBubble(z.x,z.y,z.r);mbfxSk('sk_bubble_halo',z.x,z.y,{r:z.r});mbAnimLand('bubble',z.x,z.y,s)},'bubble');break}
    case 'shadowstep':{const t=aim,g=t.r+u.r+6;   // מופיע מאחורי המטרה, פוגע, ומחזיק חיזוק לתקיפה הבאה
      mbfxSk('sk_shadowstep',u.x,u.y);   // עשן סגול בנקודת ההיעלמות (#485)
      u.x=t.x;u.y=t.y;mbStep(u,-Math.cos(t.face)*g,-Math.sin(t.face)*g);   // דרך mbStep: לא בתוך מגדל, חומה או מחוץ למפה
      u.face=u.aim=Math.atan2(t.y-u.y,t.x-u.x);
      mbDmg(u,t,s.dmg*k,s.dt,{big:t.k==='hero'});mbAnimHit(t,s.dt);mbfxLib('tr_slash_amethyst',t.x,t.y-t.r-6,{rot:u.face,size:MBFXSK.tr_slash_amethyst.size,add:true});
      u.st.step={t:s.bonusT,dmg:s.bonus*k,slow:s.slow,slowT:s.slowT};
      mbfxSk('sk_shadowstep',u.x,u.y);mbFeelReset(u);
      u.cd[slot]=s.cd*(1-mbIb(u).cdr);if(u.me)sfxCast(s.dt||MBKIT[u.kit].dt);return true}   // הפנים כבר אל המטרה (לא אל הנקודה שממנה יצא)
    case 'vanish':{   // קפיצה הרחק מהאויב הקרוב (בלי אויב: אחורה) + כיסוי. תקיפה או סקיל מסיימים את הכיסוי
      const f=mbNearest(u,MB.u.filter(o=>o.k==='hero'&&o.team!==u.team&&!o.dead&&mbSeen(o,u.team)),400),a=f?Math.atan2(u.y-f.y,u.x-f.x):u.face+Math.PI;
      mbfxSk('sk_vanish',u.x,u.y);   // טבעת עשן סגולה במקום ההיעלמות (#485)
      u.st.dash={vx:Math.cos(a),vy:Math.sin(a),sp:700,left:s.flip,end:()=>mbfxSk('sk_shadowstep',u.x,u.y,{size:90})};   // נחיתה: נשיפת עשן קטנה
      u.st.veil=s.t;u.st.veilSp=s.speed;u.st.veilCrit=s.crit;mbWord(u,'vanish');
      if(MB.me&&u.team===MB.me.team){if(u.st.veilFx)fxStop(u.st.veilFx);u.st.veilFx=mbfxSk('st_veil',u.x,u.y,{follow:u,loop:true,dur:s.t})}   // מוטות לילך: רק הקבוצה שלו רואה (האויב לא, אושר ב-#485). נעצר ב-mbTick ו-mbStReset
      break}
    case 'deathmark':{const t=aim;   // סימן על גיבור: נצבר ב-mbDmg, מתפוצץ ב-mbTick (moba.js)
      if(t.mark)fxStop(t.mark.fx);
      t.mark={by:u,end:MB.t+s.t,share:s.share,endDmg:s.end*k,dmg:0,fx:mbfxSk('sk_deathmark',t.x,t.y,{follow:t,dy:-70,loop:true,dur:s.t})};   // יהלום סגול מסתובב (#485)
      mbWord(t,'marked');break}
    case 'blizzard':{const p=pt();mbfxSk('sk_blizzard',p.x,p.y,{r:s.r,loop:true,dur:s.delay+0.4});mbZone(u,p.x,p.y,s.r,s.delay,z=>{for(const o of foesIn(z.x,z.y,z.r)){const wet=o.st.wet>0;mbDmg(u,o,s.dmg*k,s.dt,{big:true});if(mbCC(o,'stun',s.freeze*(wet?MOBA.combo.freeze:1),u)&&wet){o.st.wet=0;mbWord(o,'freeze');if(u.me)sfxCombo('freeze')}if(o.st.stun>0)o.st.ice=1;mbAnimHit(o,s.dt)}mbBoom(z.x,z.y,s.r,s.dt);mbfxBlast(z.x,z.y,z.r,dtCol(s.dt));mbfxSk('sk_blizzard_ice',z.x,z.y,{r:z.r});mbAnimLand('blizzard',z.x,z.y,s)},'blizzard');break}
  }
  u.cd[slot]=s.cd*(1-mbIb(u).cdr);u.face=ang;u.aim=ang;
  if(u.me)sfxCast(s.dt||MBKIT[u.kit].dt,slot==='ult'?1.3:1);   // רק השחקן: הצליל של סוג הנזק, ובסקיל-על נמוך וחזק (audio.js)
  if(slot==='ult'){mbfxUlt(u,s);mbfxUltLib(u)}   // רגע דרמטי, ועיגול קסם ועמוד אור מהספרייה (moba-fx.js)
  return true;
}
// מטרה חוקית לסקיל על יחידה (צעד צל, סימן מוות): אויב חי, נראה, לא מכוסה ובטווח. סימן מוות רק על גיבור
function mbUnitOk(u,s,t){
  if(!t||t.dead||t.team===u.team||!mbTgt(t)||!mbSeen(t,u.team))return false;
  if(t.k!=='hero'&&(t.k!=='minion'||s.id==='deathmark'))return false;
  return mbDist(u,t)-t.r-u.r<=(s.range||200)*1.15;
}
// מגן שסופג נזק עד שנגמר או שהזמן עובר (mbDmg ב-moba.js מוריד ממנו קודם)
function mbShield(o,amt,t){o.st.shield=Math.max(o.st.shield&&o.st.shieldEnd>MB.t?o.st.shield:0,amt);o.st.shieldEnd=MB.t+t;o.st.shieldMax=o.st.shield}
// משיכה אל נקודה, עד מרחק stop ממנה ולכל היותר d (מבנים לא זזים)
function mbPull(o,x,y,d,stop){const dd=Math.hypot(x-o.x,y-o.y);if(dd<=stop)return;mbPush(o,Math.atan2(y-o.y,x-o.x),Math.min(d,dd-stop))}
// זינוק של התקיפה הרגילה (atk.lunge): טנק ולוחם קופצים אל מטרה שקצת מחוץ לטווח, והמכה יוצאת כשנוחתים
function mbLunge(u,t,A){
  if(!A.lunge||u.k!=='hero'||u.st.dash||u.st.stun>0||u.st.root>0||(u.lungeT||0)>MB.t)return false;
  const gap=mbDist(u,t)-t.r-u.r;if(gap<=A.range||gap>A.range+A.lunge)return false;
  const a=Math.atan2(t.y-u.y,t.x-u.x);u.lungeT=MB.t+A.lungeCd;u.atkT=0;u.face=u.aim=a;
  u.st.dash={vx:Math.cos(a),vy:Math.sin(a),sp:760,left:gap-A.range*0.5,end:()=>{if(!t.dead)mbAttack(u,0,t,A)}};mbfxDust(u);return true;
}
