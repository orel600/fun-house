/* Underworld banner carry-over fix (MBBANNERFIX, fix/moba-banner-carryover, BOB for MAX, 11.11.2026; bug L9 reproduced by QUINN on the base game and on main).
   OPT-IN ONLY: ?mbbannerfix=1. Without the flag nothing is wrapped and behaviour is exactly as today. Making it the default is Orel's call.
   The bug: mbBanner (moba.js) queues up to 2 messages behind a setTimeout (MOBA.msgMin), and mbBannerNext only checks that S.mb exists, not that it is the same match.
   mobaExit/mobaStart never clear mbBanner.q/tm/t/at, and #banner keeps its 1.6s 'on' timer (banT, progression.js). So a queued or showing banner ("You fell!")
   from the old match shows up in the next one after a quick restart.
   The fix (presentation only, no gameplay change):
     - each queued message is tagged with the match (MB) it was queued in; mbBannerNext drops messages from another match before showing anything;
     - mobaStart/mobaExit first clear the queue, its timer and the de-dup memory (t/at), and hide #banner (clearTimeout(banT)). This runs BEFORE the original,
       so the new match's own start banner still shows.
     - they also clear welcome.js's banner queue (BANNER: one banner per 2s, up to 2 waiting). Every Underworld banner passes through it too, and that was
       the path of the remaining repro case (restart right after death: "You fell!" replayed at +350ms, and the new "Match on!" held 2s).
     - and they call the message lane's own msgClear() (msglane.js), so a village message ("Your village") isn't on screen in the first frames of a match (L10).
     These reset Nir-owned RUNTIME queue state (welcome.js BANNER, the msglane rows, #banner) at match start/exit, opt-in only. None of Nir's files are edited.
   Delete: this file and its script line. */
const MBBANNERFIX={on:/[?&]mbbannerfix=1(&|$)/.test(location.search),stat:{dropped:0,resets:0,hidden:0}};
(function(){
  const F=MBBANNERFIX;if(!F.on||typeof mbBanner!=='function'||typeof mbBannerNext!=='function')return;
  const tag=()=>{for(const m of mbBanner.q||[])if(!('mb' in m))m.mb=typeof MB!=='undefined'?MB:null};
  const ob=mbBanner,props=['q','tm','t','at'];
  mbBanner=function(){const r=ob.apply(this,arguments);tag();return r};
  // mbBanner keeps its state as properties on the function itself: share them with the wrapper so other code (and the original) see one state
  for(const k of props)Object.defineProperty(mbBanner,k,{get:()=>ob[k],set:v=>{ob[k]=v},configurable:true});
  const on=mbBannerNext;
  mbBannerNext=function(){const Q=ob.q||[],cur=typeof MB!=='undefined'?MB:null;while(Q.length&&('mb' in Q[0])&&Q[0].mb!==cur){Q.shift();F.stat.dropped++}return on.apply(this,arguments)};
  F.reset=function(){clearTimeout(ob.tm);ob.tm=null;ob.q=[];ob.t=null;ob.at=0;F.stat.resets++;
    const b=document.getElementById('banner');if(b&&b.classList.contains('on')){b.classList.remove('on');F.stat.hidden++}
    try{clearTimeout(banT)}catch(e){}
    // the second queue: welcome.js wraps banner() everywhere (one banner per BANNER.gap s, up to BANNER.max waiting, released by a setTimeout).
    // A "You fell!" waiting there from the old match was replayed into the new one, with the new "Match on!" held 2s behind it (QUINN's quick case).
    try{if(typeof BANNER!=='undefined'&&BANNER){if(BANNER.q.length)F.stat.dropped+=BANNER.q.length;clearTimeout(BANNER.t);BANNER.t=0;BANNER.q.length=0;BANNER.last=-1e9}}catch(e){}
    // the village/world message lane (msglane.js): its own msgClear(), which its tick also calls once the lane is off, just one tick later.
    // On a fast village->match start, "Your village" was still in the lane for the first frames of the match (QUINN L10)
    try{if(typeof msgClear==='function')msgClear()}catch(e){}};
  for(const n of ['mobaStart','mobaExit']){if(typeof window[n]!=='function')continue;const o=window[n];window[n]=function(){F.reset();return o.apply(this,arguments)}}
})();
