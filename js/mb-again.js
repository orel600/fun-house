/* Underworld "Play again" then Close fix (MBAGAINFIX, fix/moba-again-close, BOB for MAX, 11.11.2026; bug L11 reproduced by QUINN on the base game and on main).
   OPT-IN ONLY: ?mbagainfix=1. Without the flag nothing is wrapped and behaviour is exactly as today.
   The bug: "Play again" on the end screen sets S.mb=MB=null and opens the hero picker (mobaOpen) while the start screen is hidden, so the picker gets data-from=''.
   Closing it (✕) runs mobaPickClose, which takes the "no match" branch: it only hides the window. S.mode stays 'play' with S.mb null, so the arena loop starts
   a bare arena run behind the title overlay, with a leftover Underworld hero in `enemies`. The arena auto-attack then throws at combat.js:23
   (Underworld units have no `mult`).
   The fix: a picker opened from the end screen first gets the same clean state as one opened from the title (reset(), which mobaStart runs anyway, and mode title),
   so no arena run spawns behind it and no Underworld units stay in `enemies`. It is also marked. Closing a marked picker with no match running runs mobaExit(), the same exit "Home" uses
   (village or start screen, a clean reset). Starting a match from it clears the mark. Picking and starting a match, "Home" and "Play again" are unchanged.
   L12 (same flag): "Other hero" in Battle Prep reopens the picker while the window is open; mobaOpen recomputed data-from from the (hidden) start screen,
   so ✕ left a bare title backdrop. A reopen from Battle Prep or the picker keeps the original origin and the "Play again" mark.
   Safety net: a close that leaves no match, village, world or start screen (mode title) shows the start screen.
   Delete: this file and its script line. */
const MBAGAINFIX={on:/[?&]mbagainfix=1(&|$)/.test(location.search),stat:{marked:0,exits:0}};
(function(){
  const F=MBAGAINFIX;if(!F.on||typeof mobaOpen!=='function'||typeof mobaPickClose!=='function'||typeof mobaExit!=='function')return;
  const win=()=>document.getElementById('mbWin');
  // A picker opened from the end screen starts from the same clean state as one opened from the title: reset() (which mobaStart runs anyway) and mode 'title'.
  // Otherwise, while the picker is open, S.mode stays 'play' with no match, and the arena loop spawns enemies behind it (seen within 12s), with Underworld units left in `enemies`.
  // L12: "Other hero" in Battle Prep (data-bact back, moba-spells.js) reopens the picker with mobaOpen() while the window is still open. mobaOpen sets data-from
  // from whether the start screen is visible, and it is hidden by then, so the origin 'start' was lost: ✕ only hid the window and left a bare title backdrop.
  // A reopen from Battle Prep or the picker itself (window still open) keeps the original origin, and the "Play again" mark.
  const ov=()=>document.getElementById('ovMoba');
  const oo=mobaOpen;mobaOpen=function(){const w=win(),pm=w&&w.dataset.mode,fromEnd=pm==='end',reopen=!!(w&&ov()&&!ov().hidden&&(pm==='build'||pm==='pick')),pf=w&&w.dataset.from,pa=w&&w.dataset.again;
    if(fromEnd&&!(typeof S!=='undefined'&&S&&S.mb)&&typeof reset==='function'){try{reset();S.mode='title';F.stat.cleaned=(F.stat.cleaned||0)+1}catch(e){F.err=String(e)}}
    const r=oo.apply(this,arguments);
    if(w){if(fromEnd){w.dataset.again='1';F.stat.marked++}
      else if(reopen){if(pf!==undefined)w.dataset.from=pf;else delete w.dataset.from;if(pa)w.dataset.again=pa;else delete w.dataset.again;F.stat.kept=(F.stat.kept||0)+1}
      else delete w.dataset.again}return r};
  // Safety net: a close that leaves no match, no village, no world and no start screen (a bare title backdrop) shows the start screen.
  const oc=mobaPickClose;mobaPickClose=function(){const w=win();
    if(w&&w.dataset.again==='1'&&!(typeof S!=='undefined'&&S&&S.mb)){delete w.dataset.again;F.stat.exits++;return mobaExit()}
    const r=oc.apply(this,arguments);
    try{const st=document.getElementById('ovStart');if(st&&st.hidden&&ov().hidden&&S&&!S.mb&&!S.vil&&!S.wd&&S.mode==='title'){st.hidden=false;F.stat.startShown=(F.stat.startShown||0)+1}}catch(e){F.err=String(e)}
    return r};
  if(typeof mobaStart==='function'){const os=mobaStart;mobaStart=function(){const w=win();if(w)delete w.dataset.again;return os.apply(this,arguments)}}
})();
