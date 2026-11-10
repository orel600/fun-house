/* Boss bar and rumor line placement in the world (BOSSHUD, Nir's phone screenshot 10.11.2026: the desert boss name ran over the buff row,
   "Weak to Water" hid behind the challenge chip and the coins, and the rumor line sat on the skill buttons).
   The world boss bar (#bossbar, giant.js giantBar) is no longer centered blindly: it is placed in the widest free gap at the top,
   between what is already on screen (msgBlocks in msglane.js measures every button, bar and chip), plus the wisp icon row that is
   drawn on the canvas next to "who" (drawWispRow in wisps.js). The name is one line: the subtitle is cut with "…" first.
   No room in the top row: the next free row down (under the goal chip / next to the minimap).
   The rumor line (#rareLine, rares.js) never goes down onto the skill buttons: one line, and if it would still touch them it moves up.
   The arena is untouched (only body.world). Hooks: bossHudPlace from hud() in render.js, rareLineFit from rareLineSync in rares.js.
   bossHudClash() lists overlaps, for the bot (tools/check.js). */
const BOSSHUD={
  gap:10,        // px between the boss bar and anything next to it
  minW:250,      // narrower than this: try the next row down
  maxW:440,      // never wider than this, even with a free screen
  every:200,     // ms between measurements (getBoundingClientRect forces a layout)
  maxTop:0.42,   // never lower than this part of the screen height
  wisp:{size:22,gap:6}   // as WACT.row in wisps.js (the canvas icon row next to #who)
};
// the wisp row drawn on the canvas next to #who (wisps.js drawWispRow), as a screen box
function bossWispBox(){
  const who=$('who'),o=typeof S!=='undefined'&&S&&S.orb;if(!who||who.hidden||!o||!o.types||!o.types.length)return null;
  const q=who.getBoundingClientRect();if(!q.width)return null;
  const R=(typeof WACT!=='undefined'&&WACT.row)||BOSSHUD.wisp,w=o.types.length*(R.size+R.gap),y=q.top+q.height/2;
  return DIR==='rtl'?{left:q.left-R.gap-w,right:q.left,top:y-R.size/2,bottom:y+R.size/2}:{left:q.right,right:q.right+R.gap+w,top:y-R.size/2,bottom:y+R.size/2};
}
// everything on screen except the boss bar itself
function bossHudBlocks(bb){
  const out=(typeof msgBlocks==='function'?msgBlocks():[]).filter(r=>!bb.contains(r.el)&&!r.el.contains(bb));
  const w=bossWispBox();if(w)out.push(w);return out;
}
function bossHudReset(bb){if(!bb.dataset.bh)return;delete bb.dataset.bh;bb.style.position=bb.style.top=bb.style.left=bb.style.width=bb.style.margin=bb.style.maxWidth=''}
function bossHudPlace(force){
  const bb=$('bossbar');if(!bb)return;
  if(!document.body.classList.contains('world')||bb.hidden){bossHudReset(bb);return}
  const now=performance.now();if(!force&&bb.dataset.bh&&now-(bossHudPlace.t||0)<BOSSHUD.every)return;bossHudPlace.t=now;
  const B=BOSSHUD,vw=innerWidth,vh=innerHeight,bl=bossHudBlocks(bb),cx=vw/2,h=Math.max(30,bb.offsetHeight),who=$('who');
  const y0=who&&!who.hidden?who.getBoundingClientRect().top:8;
  const tops=[y0,...bl.map(r=>r.bottom+6)].filter(y=>y>=y0&&y<=vh*B.maxTop).sort((a,b)=>a-b);let best=null;
  for(const y of tops){let L=B.gap,R=vw-B.gap;
    for(const r of bl){if(r.bottom<=y||r.top>=y+h)continue;
      if(r.right<=cx)L=Math.max(L,r.right+B.gap);else if(r.left>=cx)R=Math.min(R,r.left-B.gap);else{L=R;break}}
    const w=R-L;if(!best||w>best.w)best={y,L,R,w};if(w>=B.minW){best={y,L,R,w};break}}
  if(!best)return;
  const w=Math.max(120,Math.min(B.maxW,best.w)),x=Math.max(best.L,Math.min(best.R-w,cx-w/2));
  bb.dataset.bh=1;bb.style.position='fixed';bb.style.margin='0';bb.style.maxWidth='none';
  bb.style.top=Math.round(best.y)+'px';bb.style.left=Math.round(x)+'px';bb.style.width=Math.round(w)+'px';
}
// the rumor line: one line (CSS), and never down on the skill buttons
function rareLineFit(){
  const el=$('rareLine');if(!el)return;el.style.top='';if(el.hidden)return;
  const sk=[...document.querySelectorAll('#skills .skb,#swap')].filter(b=>b.offsetParent!==null).map(b=>b.getBoundingClientRect()).filter(r=>r.width>1);
  if(!sk.length)return;const q=el.getBoundingClientRect(),top=Math.min(...sk.filter(r=>r.right>q.left&&r.left<q.right).map(r=>r.top));
  if(isFinite(top)&&q.bottom>top-6)el.style.top=Math.max(4,Math.round(q.top-(q.bottom-(top-6))))+'px';
}
// for the bot: [what, what] pairs that overlap. Boss bar parts against the rest of the HUD, banners against skills and the boss bar
function bossHudClash(){
  const hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1,nm=r=>r.el?(r.el.id||String(r.el.className).split(' ')[0]):'wisps';
  const vis=e=>e&&!e.hidden&&e.offsetParent!==null&&e.getBoundingClientRect().width>1,out=[],bb=$('bossbar');
  const parts=vis(bb)?['bossnm','bossweak','bossfill'].map(id=>$(id)).filter(vis).map(e=>Object.assign(e.getBoundingClientRect().toJSON(),{el:e})):[];
  // clipped text (ellipsis) counts by its box, not by its full text: scrollWidth beyond the box is cut, not drawn
  if(parts.length){const others=bossHudBlocks(bb);for(const p of parts)for(const o of others)if(hit(p,o))out.push(nm(p)+'×'+nm(o))
    const n=$('bossnm'),k=$('bossnm').parentElement;if(n&&k&&k.getBoundingClientRect().height>n.getBoundingClientRect().height*1.6)out.push('bossnm×two lines')}
  const sk=[...document.querySelectorAll('#skills .skb')].filter(vis).map(e=>Object.assign(e.getBoundingClientRect().toJSON(),{el:e}));
  const ban=['rareLine','msgLane','banner'].map(id=>$(id)).filter(e=>vis(e)&&e.textContent.trim()).map(e=>Object.assign(e.getBoundingClientRect().toJSON(),{el:e}));
  for(const b of ban){for(const s of sk)if(hit(b,s))out.push(nm(b)+'×skill');for(const p of parts)if(hit(b,p))out.push(nm(b)+'×'+nm(p))}
  return out;
}
addEventListener('resize',()=>{bossHudPlace(true);rareLineFit()});
