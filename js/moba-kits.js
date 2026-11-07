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
    s1:{id:'anvil',kind:'point',cd:10,range:300,r:95,dmg:80,stun:1.1,dt:'earth'},   // סדן נופל: קופץ אל הנקודה ונוחת כמו סדן, מהמם מסביב
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
    s2:{id:'net',kind:'line',cd:9,range:460,w:26,dmg:50,root:1.2,speed:820,dt:'physical'},   // רשת ציד: נעצרת בגיבור הראשון ולוכדת אותו (לא זז, אבל תוקף). עוברת מעל חיילים
    ult:{id:'rain',kind:'point',cd:50,range:440,r:150,delay:0.5,t:3,dps:65,slow:0.3,end:90,dt:'physical'}},   // גשם חצים, ובסוף מטח אחרון
  mage:{icon:'🔮',dt:'water',hp:560,speed:155,
    atk:{dmg:34,range:270,cd:1.0,dt:'water',shot:true},
    s1:{id:'wave',kind:'line',cd:8,range:440,w:70,dmg:70,speed:620,wet:3,slow:0.3,slowT:2,dt:'water'},   // גל מים: מרטיב ומאט
    s2:{id:'bubble',kind:'point',cd:11,range:380,r:100,delay:0.4,lift:1.1,dmg:80,wet:3,dt:'water'},           // כלא מים: בועה שמרימה את האויבים (כמו הלם) ומרטיבה. אחריה ברק או קרח: קומבו
    ult:{id:'blizzard',kind:'point',cd:50,range:420,r:170,delay:0.6,dmg:80,freeze:1.5,dt:'ice'}},       // סופת קרח: מקפיאה. על רטוב: יותר זמן
};
const MB_SLOTS=['s1','s2','ult'];
const MB_MOVES={anvil:1};   // סקילים שמזיזים את מי שמטיל אותם: אי אפשר כשהוא לכוד (st.root)

// מטיל סקיל. aim: גיבור/יחידה, או נקודה {x,y}. מחזיר אם הוטל
function mbCast(u,slot,aim){
  const K=MBKIT[u.kit],s=K[slot];
  if(!s||u.dead||u.cd[slot]>0||u.st.stun>0||u.st.dash)return false;
  if(u.st.root>0&&MB_MOVES[s.id])return false;
  if(MB_MOVES[s.id]&&typeof mbGbBusy==='function'&&mbGbBusy(u))return false;   // בהטלה בחדר ההימור לא זזים: בלי טעינה (הבודק, 7.11)   // לכוד ברשת: רק סקילים שלא מזיזים אותו
  if(slot==='ult'&&u.lvl<MOBA.ultAt)return false;
  const k=mbK(u)*(1+mbIb(u).sk),ax=aim?aim.x:u.x+Math.cos(u.face)*100,ay=aim?aim.y:u.y+Math.sin(u.face)*100;
  const ang=Math.atan2(ay-u.y,ax-u.x),dist=Math.hypot(ax-u.x,ay-u.y);
  // נקודה בטווח: אם הכוונה רחוקה מדי, הסקיל נוחת בקצה הטווח
  const pt=()=>{const d=Math.min(dist,s.range||0);return{x:u.x+Math.cos(ang)*d,y:u.y+Math.sin(ang)*d}};
  const foesIn=(x,y,r)=>MB.u.filter(o=>o.team!==u.team&&!o.dead&&(o.k==='hero'||o.k==='minion')&&Math.hypot(o.x-x,o.y-y)<r+o.r);
  switch(s.id){
    case 'anvil':{const p=pt(),d=Math.hypot(p.x-u.x,p.y-u.y);   // קופץ ונוחת: הלם ונזק מסביב לנקודת הנחיתה
      u.st.dash={vx:Math.cos(ang),vy:Math.sin(ang),sp:800,left:Math.max(1,d),jump:true,end:()=>{for(const o of foesIn(u.x,u.y,s.r)){mbDmg(u,o,s.dmg*k,s.dt,{big:true});mbCC(o,'stun',s.stun,u)}mbBoom(u.x,u.y,s.r,s.dt);mbfxSlam(u,s.r,s.dt);mbfxSk('sk_anvil',u.x,u.y,{r:s.r});mbfxSk('sk_anvil_wave',u.x,u.y,{r:s.r})}};break}
    case 'taunt':{for(const o of foesIn(u.x,u.y,s.r)){mbPull(o,u.x,u.y,s.pull,u.r+o.r+6);mbCC(o,'taunt',s.t,u)}
      mbShield(u,s.shield*k,s.shieldT);u.st.armor=s.shieldT;u.st.armorK=0;u.st.burnBack=s.burn;mbBoom(u.x,u.y,s.r,'fire');mbWord(u,'taunt');mbfxSk('sk_taunt',u.x,u.y,{r:s.r,follow:u,loop:true,dur:s.t});break}
    case 'wall':{const p=pt(),dir=u.team?-1:1;   // מושך את כולם אל הנקודה, הלם, וחומה בצד שלהם (אל הבסיס שלהם) שחוסמת את הבריחה
      for(const o of foesIn(p.x,p.y,s.r)){mbPull(o,p.x,p.y,s.r,o.r+8);mbDmg(u,o,s.dmg*k,s.dt,{big:true});mbCC(o,'stun',s.stun,u)}
      MB.walls.push({x:p.x+dir*(s.r*0.55),team:u.team,t:s.t});mbfxSk('sk_wall',p.x+dir*(s.r*0.55),p.y,{loop:true,dur:s.t});mbBoom(p.x,p.y,s.r,s.dt);mbfxSlam(Object.assign({},u,{x:p.x,y:p.y}),s.r,s.dt);break}
    case 'cleave':{   // גל חרב: קשת של הדף שטסה לאורך הקו (moba-fx.js מצייר אותה)
      MB.shots.push({kind:'line',fx:'cleave',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{mbDmg(u,o,s.dmg*k,s.dt,{big:o.k==='hero'});mbCC(o,'stun',s.stun,u);mbSlow(o,s.slow,s.slowT);mbfxHit(o,'cleave')}});mbfxCleave(u,ang,s);mbfxSk('sk_cleave',u.x+Math.cos(ang)*30,u.y+Math.sin(ang)*30-10,{rot:ang+Math.PI});break}
    case 'spin':{let got=0;for(const o of foesIn(u.x,u.y,s.r))got+=mbDmg(u,o,s.dmg*k,s.dt);u.hp=Math.min(u.max,u.hp+got*s.heal);
      if(got*s.heal>5)mbFloat(u.x,u.y-u.r-16,'+'+Math.round(got*s.heal),'#7BD88F');mbBoom(u.x,u.y,s.r,s.dt);mbfxSpin(u,s.r);mbfxSk('sk_spin',u.x,u.y,{r:s.r,follow:u});break}
    case 'rage':{Object.assign(u.st,{rage:s.t,rageK:s.dmg,rageSp:s.speed,rageCd:s.atkCd,rageDef:s.def,stun:0,taunt:0,root:0,bub:0,imm:s.imm,ice:0});
      for(const o of foesIn(u.x,u.y,s.r)){mbDmg(u,o,s.dmg0*k,'physical',{big:true});mbPush(o,Math.atan2(o.y-u.y,o.x-u.x),40)}
      mbBoom(u.x,u.y,s.r,'physical');mbWord(u,'rage');mbfxSk('sk_rage',u.x,u.y,{follow:u,loop:true,dur:s.t});mbfxSk('sk_rage_glow',u.x,u.y,{follow:u,loop:true,dur:s.t});break}
    case 'pierce':case 'wave':{
      const L=s.id==='pierce',sh={kind:'line',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{mbDmg(u,o,s.dmg*k,s.dt,{big:o.k==='hero'});if(s.wet){o.st.wet=Math.max(o.st.wet,s.wet);mbSlow(o,s.slow,s.slowT)}
          if(typeof fxPlay==='function')fxPlay(L?'hit_light':'hit_water',o.x,o.y-o.r,{size:L?90:100,add:L})}};
      MB.shots.push(sh);
      // האפקט שעף עם הסקיל (אוראל, 7.11: "חץ הברק וגל המים עפים בלי שום אפקט"), והבזק ביד של המטיל
      if(typeof fxPlay==='function'){fxPlay(L?'sk_pierce':'sk_wave',u.x,u.y,{follow:sh,rot:ang,loop:true,size:L?MBFXSK.sk_pierce.size:s.w*2.2,add:L});
        fxPlay(L?'sk_pierce_ray':'sk_wave_crest',u.x+Math.cos(ang)*40,u.y+Math.sin(ang)*40,{rot:ang,size:L?150:140,add:L})}
      break}
    case 'net':{   // רשת ציד: עפה פתוחה, ונסגרת על הגיבור הראשון שהיא פוגעת בו. חיילים לא עוצרים אותה
      const n={kind:'line',fx:'net',x:u.x,y:u.y,vx:Math.cos(ang)*s.speed,vy:Math.sin(ang)*s.speed,left:s.range,w:s.w,team:u.team,src:u,hit:new Set(),dt:s.dt,
        on:o=>{if(o.k!=='hero'||n.gone)return;n.gone=true;mbDmg(u,o,s.dmg*k,s.dt,{big:true});if(mbCC(o,'root',s.root,u)){mbWord(o,'root');MBFX_N(o).rootFx=mbfxSk('sk_net_root',o.x,o.y,{follow:o,loop:true,dur:o.st.root})}mbfxHit(o,'net')}};
      MB.shots.push(n);mbfxSk('sk_net',u.x,u.y,{follow:n,loop:true,rot:ang+MBFXSK.netRot,dur:s.range/s.speed});break}
    case 'rain':{const p=pt();mbfxSk('sk_rain',p.x,p.y,{r:s.r,loop:true,dur:s.delay+s.t});mbZone(u,p.x,p.y,s.r,s.delay,null,'rain',{t:s.t,tick:(z,dt)=>{for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.dps*k*dt,s.dt,{quiet:true});mbSlow(o,s.slow,0.3)}
      if(z.left-dt<=0){for(const o of foesIn(z.x,z.y,z.r))mbDmg(u,o,s.end*k,s.dt,{big:true});mbBoom(z.x,z.y,z.r,s.dt);mbfxBlast(z.x,z.y,z.r,dtCol(s.dt))}}});break}   // מטח אחרון
    case 'bubble':{const p=pt();mbfxSk('sk_bubble_aura',p.x,p.y,{r:s.r,loop:true,dur:s.delay+0.3});mbZone(u,p.x,p.y,s.r,s.delay,z=>{   // כלא מים: אחרי רגע הבועה עולה, מרימה (הלם) ומרטיבה. רטוב + ברק או קרח = קומבו (moba.js)
      for(const o of foesIn(z.x,z.y,z.r)){mbDmg(u,o,s.dmg*k,s.dt,{big:o.k==='hero'});o.st.wet=Math.max(o.st.wet,s.wet);if(mbCC(o,'stun',s.lift,u)){o.st.bub=s.lift;MBFX_N(o).bubFx=mbfxSk('sk_bubble',o.x,o.y,{follow:o,loop:true,dur:s.lift})}}
      mbBoom(z.x,z.y,s.r,s.dt);mbfxBubble(z.x,z.y,z.r);mbfxSk('sk_bubble_halo',z.x,z.y,{r:z.r})},'bubble');break}
    case 'blizzard':{const p=pt();mbfxSk('sk_blizzard',p.x,p.y,{r:s.r,loop:true,dur:s.delay+0.4});mbZone(u,p.x,p.y,s.r,s.delay,z=>{for(const o of foesIn(z.x,z.y,z.r)){const wet=o.st.wet>0;mbDmg(u,o,s.dmg*k,s.dt,{big:true});if(mbCC(o,'stun',s.freeze*(wet?MOBA.combo.freeze:1),u)&&wet){o.st.wet=0;mbWord(o,'freeze')}if(o.st.stun>0)o.st.ice=1}mbBoom(z.x,z.y,s.r,s.dt);mbfxBlast(z.x,z.y,z.r,dtCol(s.dt));mbfxSk('sk_blizzard_ice',z.x,z.y,{r:z.r})},'blizzard');break}
  }
  u.cd[slot]=s.cd*(1-mbIb(u).cdr);u.face=ang;u.aim=ang;
  if(u.me)sfx(slot==='ult'?'levelup':'tap');
  if(slot==='ult'){mbfxUlt(u,s);mbfxUltLib(u)}   // רגע דרמטי, ועיגול קסם ועמוד אור מהספרייה (moba-fx.js)
  return true;
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
