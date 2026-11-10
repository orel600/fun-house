/* Hit flash in 3D, world and village (HITFX3D, Nir 10.11.2026: "do this for all monsters and bosses").
   Before: every hit painted the whole model white at 0.9 (emissive) for as long as e.flash>0. Under auto attack + orbit wisps a hit lands
   every ~0.1 s, so the flash never went off: regular enemies were white 83-100% of the fight and lost 30-80% of their colour,
   and the giants became white silhouettes (tools/flash-audit.js measures this from real pixels).
   Now: a short blink (dur) at most once every gap seconds, and weaker for bigger models (k from small to big by the look's height h),
   so a hit is still readable but every enemy keeps its own colour. The arena and the underworld games are untouched (Orel's).
   Hook: syncEnemy in render3d.js calls hitFlash3d for the plain hit flash. */
const HITFX3D={
  k:[0.25,0.1],    // emissive strength of the blink: small enemies (h<=h[0]) to the biggest (h>=h[1])
  h:[40,280],      // LOOK3D h (px) where k starts going down and where it reaches the low end
  dur:0.05,        // seconds the blink stays on
  gap:0.3          // at most one blink in this many seconds, however fast the hits come
};
const hitFlashHere=()=>typeof S!=='undefined'&&S&&!S.mb&&(!!S.wd||!!S.vil);
// a: the actor, L: its look, hit: the game says it was hit now (e.flash>0), dt: frame seconds. Returns the emissive strength (0 = none)
function hitFlash3d(a,L,hit,dt){
  const F=HITFX3D,h=(L&&L.h)||F.h[0],t=Math.max(0,Math.min(1,(h-F.h[0])/(F.h[1]-F.h[0])));
  a.flC=(a.flC??9)+dt;if(hit&&a.flC>=F.gap)a.flC=0;
  return a.flC<F.dur?F.k[0]+(F.k[1]-F.k[0])*t:0;
}
