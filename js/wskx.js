/* סבב שני של סקילים בספר (roadmap, "התוכנית הבאה" 4.11, משימה ג): סקיל רביעי לכל דמות, בעולם בלבד.
   כל אחד יוצר מצב או מנצל מצב (docs/plan-skills.md):
     קללת הגרניט (לוחם, אדמה): הופכת את מי שקרוב לאבן לכמה שניות (e.stone, לא זזים). הבוס רק מואט.
       מכה פיזית באויב מאובן מנפצת אותו לנזק כפול: השילוב "ניפוץ אבן" ב-wcombo.js.
     שרשרת ברק (ציידת, ברק): חץ ברק שקופץ בין 3 אויבים קרובים. פוגע ברטוב: קופץ רחוק יותר, חזק יותר, ועוד קפיצה (ועל הדרך חשמול, skills.js).
     מערבולת (קוסם, מים): שואבת את כל מי שבאזור לנקודה אחת לכמה שניות ומרטיבה אותם. מכינה לברק ולקרח.
   השורות (cd, נזק, רמה) ב-WSKBOOK.list (wskbook.js). כאן רק מה שכל סוג (kind) עושה: cast בהטלה, tick כל פריים, draw בדו-ממד.
   wsbCast, wsbUpdate ו-wsbDraw שולחים לכאן כל kind שאין להם. האפקט בתלת-ממד: skfx3d-petrify/chain/vortex.js */
const WSKX={
  chain:{first:150,gap:0.09,fade:0.35},   // הקפיצה הראשונה: עד first מהנקודה שכוונה. gap: שניות בין קפיצה לקפיצה. fade: כמה זמן הקו נשאר
  vortex:{wet:2.5,boss:0.2,core:18}        // מרטיבה ל-wet שניות. הבוס נמשך ב-20%. core: לא מושכים קרוב מזה למרכז
};
const wskxStat={stone:0,bossSlow:0,hops:0,wetHops:0,pulled:0};   // בשביל הבוט

const WSBX={
  petrify:{
    cast(o,D){o.dur=D.stone;o.x=P.x;o.y=P.y;o.foes=[];
      for(const e of wsbIn(P.x,P.y,o.r)){wsbHit(e,o.id,o.base,P,o.dt);if(e.dead)continue;
        if(e.isBoss){e.slow=Math.max(e.slow||0,D.stone);wskxStat.bossSlow++}else{wcStone(e,D.stone);o.foes.push(e);wskxStat.stone++}}
      S.sk.fx.push({ring:1,x:P.x,y:P.y,r:o.r,t:0,max:0.45*themeK(),col:o.col});S.shake=Math.max(S.shake,wsbLess()?2:5);sfx('hit')},
    tick(){},
    draw(o,k){ctx.globalAlpha=0.35*(1-Math.min(1,o.t*3));ctx.beginPath();ctx.arc(o.x,o.y,o.r*Math.min(1,o.t*6),0,7);ctx.fill()}   // גל אבק קצר. האבן על האויבים: wcDraw
  },
  chain:{
    cast(o,D,tg){Object.assign(o,{dur:D.jumps*WSKX.chain.gap+0.6,tg:{x:tg.x,y:tg.y},cur:null,n:D.jumps,hops:[],seen:new Set(),next:0,wet:false})},
    tick(o,D){const C=WSKX.chain;
      while(o.next<=o.t&&o.hops.length<o.n){
        const from=o.cur||o.tg,range=!o.cur?C.first:o.wet?D.wetJump:D.jump;let best=null,bd=1e9;
        for(const e of enemies){if(e.dead||o.seen.has(e)||!wskIn(e,P))continue;const d=Math.hypot(e.x-from.x,e.y-from.y)-e.r;if(d<range&&d<bd){bd=d;best=e}}
        if(!best){o.next=Infinity;o.dur=Math.min(o.dur,o.t+C.fade);break}
        const wet=best.wet>0,a=o.cur||{x:P.x,y:P.y-18};   // רטוב: בודקים לפני המכה (החשמול מייבש)
        o.hops.push({ax:a.x,ay:a.y,bx:best.x,by:best.y,t:o.t,wet,seed:Math.random()*99});o.seen.add(best);o.cur={x:best.x,y:best.y};o.wet=wet;
        if(wet&&o.n===D.jumps){o.n++;wskxStat.wetHops++}
        wsbHit(best,o.id,o.base*(wet?D.wetK:1),a,o.dt);wskxStat.hops++;o.next+=C.gap;
        if(!wsbLess())sparks(best.x,best.y-8,o.col,6,180);
      }},
    draw(o,k,less){const C=WSKX.chain;ctx.lineCap='round';
      for(const h of o.hops){const f=1-(o.t-h.t)/C.fade;if(f<=0)continue;
        for(const [w,a,c] of less?[[3,1,o.col]]:[[9,0.25,o.col],[3,1,'#F4E8FF']]){ctx.globalAlpha=a*f;ctx.lineWidth=w*o.vis;ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(h.ax,h.ay);
          const dx=h.bx-h.ax,dy=h.by-h.ay,L=Math.hypot(dx,dy)||1;
          for(let i=1;i<6;i++){const s=i/6,j=Math.sin(h.seed+i*2.7+o.t*40)*12;ctx.lineTo(h.ax+dx*s-dy/L*j,h.ay+dy*s+dx/L*j)}
          ctx.lineTo(h.bx,h.by-6);ctx.stroke()}}}
  },
  vortex:{
    cast(o,D,tg){Object.assign(o,{x:tg.x,y:tg.y,dur:D.t,tick:0})},
    tick(o,D,dt){const V=WSKX.vortex;
      for(const e of enemies){if(e.dead)continue;const dx=o.x-e.x,dy=o.y-e.y,d=Math.hypot(dx,dy);if(d>o.r+e.r||d<V.core)continue;
        const sp=D.pull*(e.isBoss?V.boss:1);e.x+=dx/d*Math.min(sp*dt,d-V.core);e.y+=dy/d*Math.min(sp*dt,d-V.core);if(!o.pul){o.pul=1;wskxStat.pulled++}}
      if((o.tick-=dt)<=0){o.tick=D.tick;for(const e of wsbIn(o.x,o.y,o.r)){wsbHit(e,o.id,o.base,o,o.dt);if(!e.dead)e.wet=Math.max(e.wet||0,V.wet)}}},
    draw(o,k,less){const n=less?3:6,a0=-o.t*5,fade=Math.min(1,(o.dur-o.t)*3);ctx.lineWidth=3*o.vis;
      ctx.globalAlpha=0.12*fade;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,7);ctx.fill();
      for(let i=0;i<n;i++){ctx.globalAlpha=0.75*fade;ctx.beginPath();
        for(let s=0;s<=12;s++){const f=s/12,a=a0+i*Math.PI*2/n+f*3.2,r=o.r*(1-f*0.85);ctx.lineTo(o.x+Math.cos(a)*r,o.y+Math.sin(a)*r*0.6)}ctx.stroke()}}
  }
};
