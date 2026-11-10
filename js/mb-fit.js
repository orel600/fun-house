/* Layout fit for the Underworld select window and shop (MBFIT, overhaul/layout-fit, BOB for MAX, 11.11.2026, from ARI's stock audit L1-L4).
   OPT-IN ONLY: ?mbfit=1 adds body.mbfit. Without the flag, nothing is injected or wrapped. Layout only: no font, colour or art change
   (the existing tokens are reused), no skill/joystick/minimap size or position change, no gameplay change.
   Measured cause (BOB, 11.11): nothing is cut off. #mbWin and #mbShop already scroll (overflow:auto), but at 740x360 the select content is 497px in a 291px window
   and the shop 402px in 291px, with no sign that there is more below. The card row's right/bottom edge sits exactly on the scroll box edge,
   so the cards' 4px outer frame ring (box-shadow) is clipped at every width.
     L1/L4: a scroll cue (soft fade plus a small chevron, pinned to the bottom of the scroll box) while more content is below. It hides at the end. Tap-through.
     L2:    the role pill wraps balanced, with a little less side padding. When it wraps, its corners use 9px instead of a full stadium, so text isn't cut by the round ends.
     L3:    the card row gets 5px of inner room, so the frame ring of the first/last card fits inside the scroll box.
   Delete: this file and its script line. */
const MBFIT={
  on:/[?&]mbfit=1(&|$)/.test(location.search),
  boxes:['mbWin','mbShop'],
  cue:{h:34,min:6},   // cue height (px), and how many px of hidden content count as "more below"
  stat:{cueShown:0,refresh:0}
};
(function(){
  const F=MBFIT;if(!F.on)return;
  document.body.classList.add('mbfit');
  const st=document.createElement('style');st.id='mbfitCss';
  st.textContent=
    'body.mbfit .mbkits{padding:5px 5px 7px}'+
    'body.mbfit .mbkit small{padding:1px 6px;text-wrap:balance}'+
    'body.mbfit .mbkit small.mbfit-wrap{border-radius:9px}'+
    'body.mbfit .mbfit-cue{position:sticky;bottom:0;flex:none;display:block;height:0;pointer-events:none}'+'body.mbfit .mbfit-cue>b{position:absolute;left:0;right:0;bottom:0;height:'+F.cue.h+'px;opacity:0;transition:opacity .15s;'+
      'background:linear-gradient(to bottom,transparent,color-mix(in srgb,var(--slate) 96%,transparent) 70%);text-align:center;color:var(--brass-hi);font:900 20px/'+F.cue.h+'px var(--body);text-shadow:0 1px 0 var(--wood);overflow:hidden}'+
    'body.mbfit .mbfit-cue.on>b{opacity:1}'+
    'body.mbfit #mbWin,body.mbfit #mbShop{scrollbar-width:thin}';
  document.head.appendChild(st);
  // the cue element lives at the end of each scroll box. The builders rewrite innerHTML, so it is re-added after each draw
  const cueOf=b=>{let c=b.querySelector(':scope>.mbfit-cue');if(!c){c=document.createElement('i');c.className='mbfit-cue';c.setAttribute('aria-hidden','true');c.innerHTML='<b>▾</b>';b.appendChild(c)}c.style.marginTop=-(parseFloat(getComputedStyle(b).rowGap)||0)+'px';return c};   // zero height; the negative margin cancels the box's own flex gap, so the cue never adds scroll height
  const update=b=>{if(!b||b.offsetParent===null)return;const c=cueOf(b),more=b.scrollHeight-b.clientHeight-b.scrollTop>F.cue.min;if(more&&!c.classList.contains('on'))F.stat.cueShown++;c.classList.toggle('on',more)};
  const pills=b=>{for(const s of b.querySelectorAll('.mbkit small')){const lh=parseFloat(getComputedStyle(s).lineHeight)||14;s.classList.toggle('mbfit-wrap',s.getBoundingClientRect().height>lh*1.5)}};
  F.refresh=function(){F.stat.refresh++;for(const id of F.boxes){const b=document.getElementById(id);if(!b)continue;if(id==='mbWin')pills(b);update(b)}};
  for(const id of F.boxes){const b=document.getElementById(id);if(b)b.addEventListener('scroll',()=>update(b),{passive:true})}
  addEventListener('resize',()=>requestAnimationFrame(F.refresh));
  const after=name=>{if(typeof window[name]!=='function')return;const o=window[name];window[name]=function(){const r=o.apply(this,arguments);requestAnimationFrame(F.refresh);return r}};
  for(const n of ['mobaOpen','mbEndShow','mbShopOpen','mbShopDraw','mbBuildOpen'])after(n);
})();
