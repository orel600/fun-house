/* חפצים מסתובבים (הרעיון של ניר, ואוראל לקח אותו, 30.10.2026): החפצים שלבושים במשבצות orbit (gear.js) מסתובבים סביב הדמות בזירה.
   חמישה סוגים, ולכל אחד צורה וצבע משלו, כדי לזהות build במבט אחד. מה כל סוג עושה: ORBIT.types.
   חפץ התקפה ושליטה פוגעים עם סוג נזק, ולכן הקומבו (skills.js) עובד לבד: כפור מאט, וכדור אש שעובר דרך אויב מואט ממיס אותו.
   מה שלבוש נקרא בכל פריים, אז החלפה במסך הציוד באמצע ריצה עובדת מיד. בזירה ובעולם הפתוח (skHere ב-skills.js).
   השמות ב-lang.js: 'orb.<סוג>' לסוג, 'orb.do.<סוג>' למה שהוא עושה (מסך הציוד), 'orb.blocked' כשהמגן בולע מכה */
const ORBIT={
  r:64,spin:2.4,size:11,   // רדיוס המעגל סביב הדמות, מהירות הסיבוב (רדיאנים לשנייה) וגודל החפץ
  look:{k:1.25,k3d:1.4,lift:10,lift3d:22,bob:3,arena:0.66},   // רק ציור: כמה גדול החפץ נראה (בתלת-ממד יותר, ליד הדמות הגבוהה), כמה הוא מרחף מעל הצל שלו, וכמה הוא עולה ויורד. arena: הקטנה בזירה, שהמצלמה בה קרובה, כדי שייראה כמו בעולם (אוראל, 2.11)
  /* dt: סוג הנזק. dmg: כמה נזק, כפול הנזק של הנשק שביד. every: שניות עד שאותו חפץ פוגע שוב באותו אויב.
     block: עוצר יריות של אויבים שפוגעות בו. shield: בולע מכה אחת, ונטען מחדש אחרי every שניות.
     heal: כל every שניות מרפא k מהחיים המלאים. crit: תוספת לסיכוי למכה קריטית. loot: תוספת לסיכוי של כל שלל (0.15 = פי 1.15) */
  types:{
    attack: {dt:'fire',dmg:0.6,every:0.5,col:C.ember},
    control:{dt:'ice',dmg:0.25,every:0.5,col:C.tide},
    defense:{block:true,shield:{every:8},col:'#B9B2A6'},
    support:{heal:{every:4,k:0.04},col:'#5BD46B'},
    luck:   {crit:0.08,loot:0.15,col:C.gold}
  },
  /* חפצים משולבים (הרעיון של אוראל, ניר אישר): חפץ ב-GEAR.items עם types במקום type. כל חלק עובד בחלק מהכוח (share, לפי כמה חלקים יש),
     והחלקים מסתובבים צמודים זה לזה כמו זוג. gap: המרחק ביניהם ברדיאנים. bossDrop: סיכוי לחפץ משולב על כל בוס. w: משקל ההגרלה */
  combo:{share:{2:0.6,3:0.45},gap:0.6,bossDrop:0.2,w:{2:3,3:1}}
};

// החלקים של מה שלבוש במשבצות הפתוחות, לפי הסדר. t: הסוג, k: כמה מהכוח (חפץ משולב נותן לכל חלק פחות), g: איזה חפץ
function orbitParts(){if(divineOn())return Object.keys(ORBIT.types).map((t,g)=>({t,k:1,g}));   // ברק אלוהי: כל החמישה בכוח מלא (divine.js)
  const out=[];for(let i=0;i<gOpen('orbit');i++){const it=gItem(gGet('orbit',i));if(!it)continue;
    const ts=it.types||[it.type],k=ts.length>1?ORBIT.combo.share[ts.length]:1;ts.forEach(t=>out.push({t,k,g:i}))}return out}
const orbitTypes=()=>orbitParts().map(p=>p.t);
// חפץ משולב שנופל מבוס בזירה (או null). נקרא מ-gear.js. בעולם של ניר לא נופל (אוראל, 2.11: רק בזירה)
function orbitComboRoll(){
  if(Math.random()>=ORBIT.combo.bossDrop)return null;
  const ids=Object.keys(GEAR.items).filter(id=>GEAR.items[id].types&&!GEAR.items[id].fuse),W=ORBIT.combo.w;   // fuse: רק מהתכה בנפחייה (fuse.js)
  let r=Math.random()*ids.reduce((n,id)=>n+W[GEAR.items[id].types.length],0);
  for(const id of ids){r-=W[GEAR.items[id].types.length];if(r<0)return id}return ids[0];
}
// מה חפץ נותן, לתצוגה במסך הציוד: השורות של כל חלק, מוכפלות בחלק שלו, ומאוחדות לפי סוג
function orbitFacts(id){
  const it=gItem(id),ts=it.types||[it.type],k=ts.length>1?ORBIT.combo.share[ts.length]:1,out=[];
  for(const t of ts)for(const f of gOrbFacts(t,k)){const o=out.find(x=>x.k===f.k);if(o){o.v+=f.v;if(f.n)o.n=f.n}else out.push(f)}
  return out;
}
// בתחילת כל ריצה. sh/hl: מתי המגן והריפוי של כל חפץ מוכנים. השאר ספירה, בשביל הבוט
function orbitReset(){S.orb={a:0,types:[],ks:[],pos:[],sh:[],hl:[],crit:0,loot:0,hits:0,blocked:0,shields:0,healed:0}}
// נקראים מ-runGive (loot.js) ומ-damage (combat.js). רק בזירה
const orbitLuck=()=>1+(S.orb&&skHere()?S.orb.loot:0);
const orbitCrit=()=>S.orb&&skHere()?S.orb.crit:0;

function orbitUpdate(dt){
  const o=S.orb;if(!o)return;
  o.crit=o.loot=0;if(!skHere()){o.types=[];return}
  const parts=orbitParts();o.types=parts.map(p=>p.t);o.ks=parts.map(p=>p.k);const n=o.types.length;if(!n)return;
  const gs=[...new Set(parts.map(p=>p.g))],cn=ORBIT.combo.gap;
  o.a+=ORBIT.spin*dt;
  o.types.forEach((t,i)=>{
    const k=o.ks[i],mates=parts.filter(q=>q.g===parts[i].g),j=mates.indexOf(parts[i]);
    const D=ORBIT.types[t],a=o.a+gs.indexOf(parts[i].g)*6.283/gs.length+(j-(mates.length-1)/2)*cn,x=P.x+Math.cos(a)*ORBIT.r,y=P.y+Math.sin(a)*ORBIT.r;o.pos[i]={x,y};
    if(D.dmg)for(const e of enemies){
      if(e.dead||Math.abs(e.x-x)>e.r+ORBIT.size||Math.abs(e.y-y)>e.r+ORBIT.size||Math.hypot(e.x-x,e.y-y)>e.r+ORBIT.size)continue;
      const oh=e.oh||(e.oh=[]);if((oh[i]||0)>S.t)continue;oh[i]=S.t+D.every;
      damage(e,skBase()*D.dmg*k,'orbit',Math.atan2(e.y-P.y,e.x-P.x),D.dt);o.hits++;
    }
    if(D.block)for(const b of eb)if(b.life>0&&Math.hypot(b.x-x,b.y-y)<b.r+ORBIT.size){b.life=0;o.blocked++;sparks(x,y,D.col,5,120)}
    if(D.heal){if(o.hl[i]==null)o.hl[i]=S.t+D.heal.every;
      if(S.t>=o.hl[i]){o.hl[i]=S.t+D.heal.every;
        if(P.hp<P.maxHp){const h=Math.min(P.maxHp-P.hp,P.maxHp*D.heal.k*k);P.hp+=h;o.healed+=h;floatText(P.x,P.y-40,'+'+Math.round(h),D.col,14,true)}}}
    if(D.crit)o.crit+=D.crit*k;
    if(D.loot)o.loot+=D.loot*k;
  });
}
// נקרא מ-hurt (combat.js): חפץ הגנה שהמגן שלו מוכן בולע את המכה
function orbitShield(){
  const o=S.orb;if(!o||!skHere())return false;
  const i=o.types.findIndex((t,j)=>ORBIT.types[t].shield&&(o.sh[j]||0)<=S.t);if(i<0)return false;
  o.sh[i]=S.t+ORBIT.types.defense.shield.every/(o.ks[i]||1);o.shields++;P.inv=0.4;
  floatText(P.x,P.y-40,T('orb.blocked'),ORBIT.types.defense.col,15);sparks(P.x,P.y,ORBIT.types.defense.col,10,200);sfx('tap');
  return true;
}

/* ---- ציור: כל חפץ בצורה של הסוג שלו. כדור אש וכפור בצורת סוג הנזק, אבן משושה (בהירה כשהמגן מוכן), עלה עם פלוס, ותלתן ---- */
function drawOrbits(){
  const o=S.orb;if(!o||!o.types.length||!skHere())return;
  const L=ORBIT.look,ar=!S.wd&&!S.vil,z=ar?L.arena:1,s=ORBIT.size*(R3D.on?L.k3d:L.k)*z;
  o.types.forEach((t,i)=>{
    const D=ORBIT.types[t],g=o.pos[i];if(!g)return;
    // צל על הרצפה, והחפץ מרחף מעליו בגובה הגוף, עם זוהר בצבע הסוג (ניר, 1.11: "לא מופיעים ויזואלית על הדמות")
    const p={x:g.x,y:g.y-((R3D.on?L.lift3d:L.lift)+Math.sin(S.t*4+i*1.3)*L.bob)*z};
    ctx.globalAlpha=0.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(g.x,g.y,s*0.9,s*0.4,0,0,7);ctx.fill();
    if(ar){const gr=ctx.createRadialGradient(p.x,p.y,s*0.3,p.x,p.y,s*1.6);gr.addColorStop(0,D.col+'88');gr.addColorStop(1,D.col+'00');ctx.globalAlpha=1;ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,s*1.6,0,7);ctx.fill()}   // בזירה: זוהר רך במקום עיגול שטוח
    else{ctx.globalAlpha=0.35;ctx.fillStyle=D.col;ctx.beginPath();ctx.arc(p.x,p.y,s*1.7,0,7);ctx.fill();ctx.globalAlpha=1}
    if(D.dt){dtIcon(p.x,p.y,D.dt,s*2);return}
    ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.fillStyle=D.col;
    if(t==='defense'){
      if((o.sh[i]||0)>S.t)ctx.globalAlpha=0.5;
      ctx.beginPath();for(let k=0;k<6;k++){const a=k*1.047+0.52;ctx.lineTo(p.x+Math.cos(a)*s,p.y+Math.sin(a)*s)}ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=1;
    }else if(t==='support'){
      ctx.beginPath();ctx.arc(p.x,p.y,s*0.9,0,7);ctx.fill();ctx.stroke();
      ctx.fillStyle=C.chalk;ctx.fillRect(p.x-s*0.5,p.y-s*0.15,s,s*0.3);ctx.fillRect(p.x-s*0.15,p.y-s*0.5,s*0.3,s);
    }else{   // מזל: תלתן בארבעה עלים
      for(let k=0;k<4;k++){const a=k*1.571+o.a;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*s*0.45,p.y+Math.sin(a)*s*0.45,s*0.5,0,7);ctx.fill();ctx.stroke()}
    }
  });
}
