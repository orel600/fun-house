/* Underworld crowd readability (MBCROWD, overhaul/crowd, ARENA-B for MAX, 10.11.2026), from DANA's crowd addendum (visual-direction-2-addendum-crowd.md).
   PRESENTATION ONLY: no damage, targeting, hitbox, position or timing changes. ?mbcrowd=0 turns all of it off. Delete: this file and its script line.
   A crowd = at least `crowd.heroes` living visible heroes (the 3v3 game has 6 at most) within `crowd.r` units of your own hero.
   1. Number aggregation: hits on the SAME hero within `agg.win` s of that hero's last number add up into ONE running number (heals and crits stay separate).
      The merged number restarts its own life (pop, hold, rise, fade) from mb-hud.js, so it reads as one growing total. The hit events themselves are untouched.
   2. Label priority: only YOUR hero and its focus (the locked target, a hero you hit in the last `focus.t` s, or one that hit you) keep the full label
      (bar, level, class badge). Every other hero in a crowd gets a team-colour dot and a thin health sliver.
   3. Ring dimming: in a crowd the team rings of non-focus units are drawn at `ring.k` (30%) of their alpha. Team colours are unchanged.
   4. Team rim: every hero body gets a thin rim light in its TEAM colour (the mb-rim.js shader, per-actor materials), so silhouettes stay parseable. 3D only.
   5. Secondary text: "Over here!", "Caught!" and the other status words (mbWord) are shown only for focus units when it is a crowd.
   Numbers are placed by mb-hud.js (mbHudPlace); this file only merges before it runs. It wraps mbHudPlace, mbNumAt, mbfxNum, mbCompactDrawLabels, mbRing, mbWord, mb3dUnit, syncPlayer. */
const MBCROWD={
  on:!/[?&]mbcrowd=0(&|$)/.test(location.search),
  crowd:{r:420,heroes:4,every:0.2},       // when it is a crowd: heroes alive, visible, within r of your hero
  agg:{win:0.3},                          // seconds: a hit joins the running total of that hero if the previous number for it is younger than this
  focus:{t:1.5},                          // seconds a hero you hit, or that hit you, stays in focus
  ring:{k:0.3},                           // alpha factor for non-focus team rings in a crowd
  dot:{r:4,bar:{w:24,h:2.5}},             // minimal label: team dot radius and sliver bar size (px, before the UI scale)
  rim:{k:0.55},                           // team rim strength (mb-rim.js shader: a thin edge only)
  stat:{agg:0,mini:0,dimmed:0,rim:0,words:0,crowdFrames:0,frames:0}
};
(function(){
  if(!MBCROWD.on)return;
  const Q=MBCROWD,mbOn=()=>typeof S!=='undefined'&&S&&S.mb&&typeof MB!=='undefined'&&MB&&MB.me;
  // ---- crowd and focus ----
  let cAt=-9,cV=false;
  const isCrowd=()=>{if(!mbOn())return false;if(MB.t-cAt<Q.crowd.every&&MB.t>=cAt)return cV;cAt=MB.t;const me=MB.me,C=Q.crowd;let n=0;
    for(const u of MB.u)if(u.k==='hero'&&!u.dead&&(u===me||(Math.hypot(u.x-me.x,u.y-me.y)<C.r&&(typeof mbShow!=='function'||mbShow(u)))))n++;
    cV=n>=C.heroes;if(cV)Q.stat.crowdFrames++;return cV};
  const focus=u=>{const me=MB.me;if(!u||u===me||u.me||u===MB.lock)return true;const t=Q.focus.t;
    const a=u.hitBy&&u.hitBy.get(me),b=me.hitBy&&me.hitBy.get(u);return a!=null&&MB.t-a<t||b!=null&&MB.t-b<t};
  const dimmed=u=>(u.k==='hero'||u.k==='minion')&&isCrowd()&&!focus(u);
  // ---- 1. number aggregation ----
  const ent=new Map(),seen=[];   // ent: hero unit -> {n:the live number object, sum, last}
  const absorb=(t,n,val)=>{   // n: the new number object (already pushed) or null. Returns true when it was merged into the running total
    const e=ent.get(t);
    if(e&&e.n.life>0.05&&MB.t-e.last<=Q.agg.win){e.sum+=val;e.last=MB.t;e.n.txt=String(Math.round(e.sum));e.n.hudT0=MB.t;e.n.hudP=e.n.hudP||1;e.n.life=Math.max(e.n.life,e.n.crit?1:0.9);Q.stat.agg++;return true}
    if(n)ent.set(t,{n,sum:val,last:MB.t});return false};
  if(typeof mbNumAt==='function'){const o=mbNumAt;mbNumAt=function(t,kind){const r=o.apply(this,arguments);if(t&&t.k==='hero'&&kind!=='heal')seen.push({x:r[0],y:r[1],t});return r}}
  if(typeof mbfxNum==='function'){const o=mbfxNum;mbfxNum=function(x,y,txt,col,opt,src,t){
    if(!MBCROWD.on||!mbOn()||!t||t.k!=='hero'||(opt&&opt.crit)||!(+txt>0))return o.apply(this,arguments);
    if(absorb(t,null,+txt))return;                       // merged: no new number
    const F=mbfxS(),n0=F.n.length,r=o.apply(this,arguments);if(F.n.length>n0)ent.set(t,{n:F.n[F.n.length-1],sum:+txt,last:MB.t});return r}}
  if(typeof mbHudPlace==='function'){const o=mbHudPlace;mbHudPlace=function(){
    if(mbOn()){Q.stat.frames++;
      // small floats are created by moba.js (mbFloat is a const, not wrappable): merge the new ones here, before mb-hud.js places them
      for(const n of MB.floats){if(n.hudP||n.crowdSeen||n.life<=0.05)continue;n.crowdSeen=1;
        const i=seen.findIndex(s=>s.x===n.x&&s.y===n.y);if(i<0||!/^\d+$/.test(n.txt))continue;const s=seen.splice(i,1)[0];
        if(absorb(s.t,n,+n.txt)){n.life=0;n.hudP=1}}
      seen.length=0;if(ent.size>24){for(const [k,e] of ent)if(e.n.life<=0.05||MB.t-e.last>3)ent.delete(k)}}
    return o.apply(this,arguments)}}
  // ---- 2. label priority ----
  if(typeof mbCompactDrawLabels==='function'){const o=mbCompactDrawLabels;mbCompactDrawLabels=function(u,col){
    if(!mbOn()||u.k!=='hero'||focus(u)||!isCrowd()||(typeof MBCOMPACTLABEL!=='undefined'&&MBCOMPACTLABEL.map.has(u)))return o.apply(this,arguments);
    const uk=typeof mbUiK==='function'?mbUiK():1,top=u.y-78,D=Q.dot,bw=D.bar.w;Q.stat.mini++;
    ctx.save();ctx.translate(u.x,top+6);ctx.scale(uk,uk);ctx.translate(-u.x,-top-6);
    ctx.globalAlpha=0.9;ctx.fillStyle='#000a';ctx.fillRect(u.x-bw/2-1,top+7,bw+2,D.bar.h+2);ctx.fillStyle=col;ctx.fillRect(u.x-bw/2,top+8,bw*Math.max(0,u.hp)/u.max,D.bar.h);
    ctx.beginPath();ctx.arc(u.x,top+1,D.r,0,7);ctx.fillStyle=col;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#0B0A12';ctx.stroke();
    ctx.restore();ctx.globalAlpha=1;return true}}
  // ---- 3. ring dimming (same drawing as mbRing in moba-look.js, with the alpha scaled) ----
  if(typeof mbRing==='function'){const o=mbRing;mbRing=function(u,col){
    if(!mbOn()||!dimmed(u)||typeof MBLOOK==='undefined')return o.apply(this,arguments);
    const R=MBLOOK.ring,g=u.k==='hero'?R.hero:R.minion,r=u.r+g.pad,k=Q.ring.k;Q.stat.dimmed++;
    ctx.globalAlpha=g.fill*k;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(u.x,u.y+2,r,r*0.45,0,0,7);ctx.fill();
    ctx.globalAlpha=0.95*k;ctx.strokeStyle=col;ctx.lineWidth=g.w;ctx.stroke();ctx.globalAlpha=1}}
  // ---- 5. status words ("Over here!", "Caught!", ...): only for focus units in a crowd ----
  if(typeof mbWord==='function'){const o=mbWord;mbWord=function(u,w){
    if(mbOn()&&u&&u.k==='hero'&&isCrowd()&&!focus(u)){Q.stat.words++;return}return o.apply(this,arguments)}}
  // ---- 4. team rim (3D): a thin team-colour edge light per hero, on top of the kit rim from mb-rim.js ----
  const rimActor=(a,u)=>{if(!a||a.crowdRim===u.team||typeof mbRimMat!=='function'||!MOBA.team)return;a.crowdRim=u.team;const col=MOBA.team[u.team];Q.stat.rim++;
    a.root.traverse(o=>{if(o.isSkinnedMesh)for(const m of [].concat(o.material)){const x=m.userData.rimU;
      mbRimMat(m,x?{c:col,k:Math.max(x.k.value,Q.rim.k),lo:x.lo.value,hi:x.hi.value,fill:x.f.value}:{c:col,k:Q.rim.k})}})};
  if(typeof mb3dUnit==='function'){const o=mb3dUnit;mb3dUnit=function(e){const r=o.apply(this,arguments);if(e&&e.k==='hero'&&typeof R3D!=='undefined'&&R3D.actors)rimActor(R3D.actors.get(e),e);return r}}
  if(typeof syncPlayer==='function'){const o=syncPlayer;syncPlayer=function(){const r=o.apply(this,arguments);if(mbOn()&&R3D.player)rimActor(R3D.player,MB.me);return r}}
})();
