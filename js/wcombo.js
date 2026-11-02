/* שילובים בעולם הפתוח (docs/plan-skills.md, שלב 1): כל סקיל יוצר מצב על אויב או מנצל מצב שכבר יש עליו.
   ארבעת השילובים של אוראל (חשמול, קפוא, נמס, הלם, ב-skills.js) פועלים בכל מקום. כאן עוד שלושה, רק בעולם:
     קפוא + פיזי = ניפוץ: נזק גדול, הקיפאון נגמר, ורסיסי קרח למי שקרוב.
     שורשים + פיזי = ננעץ: כל מכה באויב שתקוע בשורשים חזקה יותר.
     רטוב + אש = אדים: פוגע ומאט את כל מי שמסביב.
   ומצב חדש, שורשים (e.root): השורשים (wskbook.js) תוקעים את מי שמשכו. הבוס לא נתקע. slowK ב-dmg.js עוצר אותו.
   נקודות החיבור: onHit ב-dmg.js (wcHit), wskUpdate (wcUpdate) ו-drawWSkill (wcDraw) ב-wskill.js.
   המילים ב-lang.js: 'combo.shatter', 'combo.pinned', 'combo.steam' */
const WCOMBO={
  shatter:{k:1.5,r:90,shard:0.4,col:'#BFF4FF'},   // עוד פי 1.5 מהמכה, ורסיסים ב-40% מהנזק עד r
  pinned:{k:0.5,col:'#9BD15A'},                    // עוד 50% מכל מכה פיזית באויב תקוע
  steam:{k:0.5,r:110,slow:1.5,col:'#E8E8F0'},      // 50% מהנזק לכל מי שעד r, ומאט אותם
  gap:0.35                                         // אותה מילה לא קופצת פעמיים בפחות מזה
};
const wcStat={};   // כמה פעמים כל שילוב קרה (בשביל הבוט)
let wcLast={};

// נקרא מ-onHit (dmg.js) אחרי השילובים של אוראל, ורק בעולם. chained: מכה שנוצרה משילוב, לא מתחילה עוד אחד
function wcHit(e,d,base,w,t,ang,chained){
  if(chained||e.dead)return;
  const K=WCOMBO;
  if(t==='physical'&&e.frozen>0){
    e.frozen=0;const extra=d*K.shatter.k;e.hp-=extra;floatText(e.x+rand(-8,8),e.y-e.r-8,big(extra),K.shatter.col,18,true);
    for(const o of enemies)if(o!==e&&!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<K.shatter.r)damage(o,base*K.shatter.shard,w,Math.atan2(o.y-e.y,o.x-e.x),'ice',true);
    wcShow(e,'shatter',K.shatter.r);
  }else if(t==='physical'&&e.root>0){
    const extra=d*K.pinned.k;e.hp-=extra;
    if(!e.pinShown){e.pinShown=1;wcShow(e,'pinned',0)}else wcStat.pinned=(wcStat.pinned||0)+1;
  }
  if(t==='fire'&&e.wet>0){
    e.wet=0;
    for(const o of enemies)if(!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<K.steam.r){if(o!==e)damage(o,base*K.steam.k,w,Math.atan2(o.y-e.y,o.x-e.x),'fire',true);if(!o.isBoss)o.slow=Math.max(o.slow||0,K.steam.slow)}
    wcShow(e,'steam',K.steam.r);
  }
}
// המילה מעל האויב וטבעת קטנה בצבע השילוב. נספר גם ב-S.sk.combos, כמו השילובים של אוראל
function wcShow(e,kind,r){
  wcStat[kind]=(wcStat[kind]||0)+1;if(S.sk)S.sk.combos[kind]=(S.sk.combos[kind]||0)+1;
  if(S.t-(wcLast[kind]??-9)<WCOMBO.gap)return;wcLast[kind]=S.t;
  const col=WCOMBO[kind].col;
  floatText(e.x,e.y-e.r-30,T('combo.'+kind),col,20,false,true);
  if(r&&S.sk)S.sk.fx.push({ring:1,x:e.x,y:e.y,r,t:0,max:0.3*themeK(),col});
  if(!(typeof fxLess==='function'&&fxLess()))sparks(e.x,e.y,col,10,200);
  S.shake=Math.max(S.shake,3);
}
// תקוע בשורשים. נקרא מהשורשים (wskbook.js)
function wcRoot(e,t){if(e.isBoss||e.dead)return;e.root=Math.max(e.root||0,t);e.pinShown=0}
// כל פריים בעולם: השורשים נגמרים
function wcUpdate(dt){for(const e of enemies)if(e.root>0)e.root-=dt}
// שורשים ירוקים לרגליים של מי שתקוע (המצבים האחרים מצוירים ב-drawSkills)
function wcDraw(){
  ctx.save();ctx.strokeStyle=WCOMBO.pinned.col;ctx.lineWidth=3;ctx.lineCap='round';
  for(const e of enemies){if(e.dead||!(e.root>0))continue;ctx.globalAlpha=Math.min(1,e.root*2);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+0.4,x=e.x+Math.cos(a)*e.r*0.9,y=e.y+e.r*0.6+Math.sin(a)*4;
      ctx.beginPath();ctx.moveTo(x,y+4);ctx.quadraticCurveTo(x+Math.cos(a)*8,y-10,e.x+Math.cos(a)*e.r*0.4,y-e.r*0.5);ctx.stroke()}}
  ctx.restore();
}
