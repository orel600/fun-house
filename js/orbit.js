/* חפצים מסתובבים (הרעיון של ניר, ואוראל לקח אותו, 30.10.2026): החפצים שלבושים במשבצות orbit (gear.js) מסתובבים סביב הדמות בזירה.
   חמישה סוגים, ולכל אחד צורה וצבע משלו, כדי לזהות build במבט אחד. מה כל סוג עושה: ORBIT.types.
   חפץ התקפה ושליטה פוגעים עם סוג נזק, ולכן הקומבו (skills.js) עובד לבד: כפור מאט, וכדור אש שעובר דרך אויב מואט ממיס אותו.
   מה שלבוש נקרא בכל פריים, אז החלפה במסך הציוד באמצע ריצה עובדת מיד. רק בזירה.
   השמות ב-lang.js: 'orb.<סוג>' לסוג, 'orb.do.<סוג>' למה שהוא עושה (מסך הציוד), 'orb.blocked' כשהמגן בולע מכה */
const ORBIT={
  r:64,spin:2.4,size:11,   // רדיוס המעגל סביב הדמות, מהירות הסיבוב (רדיאנים לשנייה) וגודל החפץ
  /* dt: סוג הנזק. dmg: כמה נזק, כפול הנזק של הנשק שביד. every: שניות עד שאותו חפץ פוגע שוב באותו אויב.
     block: עוצר יריות של אויבים שפוגעות בו. shield: בולע מכה אחת, ונטען מחדש אחרי every שניות.
     heal: כל every שניות מרפא k מהחיים המלאים. crit: תוספת לסיכוי למכה קריטית. loot: תוספת לסיכוי של כל שלל (0.15 = פי 1.15) */
  types:{
    attack: {dt:'fire',dmg:0.6,every:0.5,col:C.ember},
    control:{dt:'ice',dmg:0.25,every:0.5,col:C.tide},
    defense:{block:true,shield:{every:8},col:'#B9B2A6'},
    support:{heal:{every:4,k:0.04},col:'#5BD46B'},
    luck:   {crit:0.08,loot:0.15,col:C.gold}
  }
};

// הסוגים של מה שלבוש במשבצות הפתוחות, לפי הסדר
function orbitTypes(){const out=[];for(let i=0;i<gOpen('orbit');i++){const it=gItem(gGet('orbit',i));if(it)out.push(it.type)}return out}
// בתחילת כל ריצה. sh/hl: מתי המגן והריפוי של כל חפץ מוכנים. השאר ספירה, בשביל הבוט
function orbitReset(){S.orb={a:0,types:[],pos:[],sh:[],hl:[],crit:0,loot:0,hits:0,blocked:0,shields:0,healed:0}}
// נקראים מ-runGive (loot.js) ומ-damage (combat.js). רק בזירה
const orbitLuck=()=>1+(S.orb&&skArena()?S.orb.loot:0);
const orbitCrit=()=>S.orb&&skArena()?S.orb.crit:0;

function orbitUpdate(dt){
  const o=S.orb;if(!o)return;
  o.crit=o.loot=0;if(!skArena()){o.types=[];return}
  o.types=orbitTypes();const n=o.types.length;if(!n)return;
  o.a+=ORBIT.spin*dt;
  o.types.forEach((t,i)=>{
    const D=ORBIT.types[t],a=o.a+i*6.283/n,x=P.x+Math.cos(a)*ORBIT.r,y=P.y+Math.sin(a)*ORBIT.r;o.pos[i]={x,y};
    if(D.dmg)for(const e of enemies){
      if(e.dead||Math.abs(e.x-x)>e.r+ORBIT.size||Math.abs(e.y-y)>e.r+ORBIT.size||Math.hypot(e.x-x,e.y-y)>e.r+ORBIT.size)continue;
      const oh=e.oh||(e.oh=[]);if((oh[i]||0)>S.t)continue;oh[i]=S.t+D.every;
      damage(e,skBase()*D.dmg,'orbit',Math.atan2(e.y-P.y,e.x-P.x),D.dt);o.hits++;
    }
    if(D.block)for(const b of eb)if(b.life>0&&Math.hypot(b.x-x,b.y-y)<b.r+ORBIT.size){b.life=0;o.blocked++;sparks(x,y,D.col,5,120)}
    if(D.heal){if(o.hl[i]==null)o.hl[i]=S.t+D.heal.every;
      if(S.t>=o.hl[i]){o.hl[i]=S.t+D.heal.every;
        if(P.hp<P.maxHp){const h=Math.min(P.maxHp-P.hp,P.maxHp*D.heal.k);P.hp+=h;o.healed+=h;floatText(P.x,P.y-40,'+'+Math.round(h),D.col,14,true)}}}
    if(D.crit)o.crit+=D.crit;
    if(D.loot)o.loot+=D.loot;
  });
}
// נקרא מ-hurt (combat.js): חפץ הגנה שהמגן שלו מוכן בולע את המכה
function orbitShield(){
  const o=S.orb;if(!o||!skArena())return false;
  const i=o.types.findIndex((t,j)=>ORBIT.types[t].shield&&(o.sh[j]||0)<=S.t);if(i<0)return false;
  o.sh[i]=S.t+ORBIT.types.defense.shield.every;o.shields++;P.inv=0.4;
  floatText(P.x,P.y-40,T('orb.blocked'),ORBIT.types.defense.col,15);sparks(P.x,P.y,ORBIT.types.defense.col,10,200);sfx('tap');
  return true;
}

/* ---- ציור: כל חפץ בצורה של הסוג שלו. כדור אש וכפור בצורת סוג הנזק, אבן משושה (בהירה כשהמגן מוכן), עלה עם פלוס, ותלתן ---- */
function drawOrbits(){
  const o=S.orb;if(!o||!o.types.length||!skArena())return;
  const s=ORBIT.size;
  o.types.forEach((t,i)=>{
    const D=ORBIT.types[t],p=o.pos[i];if(!p)return;
    ctx.globalAlpha=0.25;ctx.fillStyle=D.col;ctx.beginPath();ctx.arc(p.x,p.y,s*1.5,0,7);ctx.fill();ctx.globalAlpha=1;
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
