/* Hit flash in 3D, world and village (HITFX3D, Nir 10.11.2026: "do this for all monsters and bosses").
   Before: every hit painted the whole model white at 0.9 (emissive) for as long as e.flash>0. Under auto attack + orbit wisps a hit lands
   every ~0.1 s, so the flash never went off: regular enemies were white 83-100% of the fight and lost 30-80% of their colour,
   and the giants became white silhouettes (tools/flash-audit.js measures this from real pixels).
   Now: no white at all. A hit makes the model brighter in its own colours (the material colour scaled up, so the texture keeps its hue),
   in a short blink (dur) at most once every gap seconds, and less for bigger models (k from small to big by the look's height h).
   A hit is still readable, and every enemy keeps its own colour. The arena and the underworld games keep the old white flash (Orel's).
   Hook: syncEnemy in render3d.js calls hitFlash3d (how strong now) and hitBright (applies it) for every enemy. */
const HITFX3D={
  k:[1.2,0.6],     // how much brighter at the blink (colour ×(1+k)): small enemies (h<=h[0]) to the biggest (h>=h[1])
  h:[40,280],      // LOOK3D h (px) where k starts going down and where it reaches the low end
  dur:0.06,        // seconds the blink stays on
  gap:0.3          // at most one blink in this many seconds, however fast the hits come
};
const hitFlashHere=()=>typeof S!=='undefined'&&S&&!S.mb&&(!!S.wd||!!S.vil);
// a: the actor, L: its look, hit: the game says it was hit now (e.flash>0), dt: frame seconds. Returns how much brighter (0 = normal)
function hitFlash3d(a,L,hit,dt){
  const F=HITFX3D,h=(L&&L.h)||F.h[0],t=Math.max(0,Math.min(1,(h-F.h[0])/(F.h[1]-F.h[0])));
  a.flC=(a.flC??9)+dt;if(hit&&a.flC>=F.gap)a.flC=0;
  return a.flC<F.dur?F.k[0]+(F.k[1]-F.k[0])*t:0;
}
// colour ×(1+k) on every material of the actor, from the colour it had before (kept in userData.c0). k=0 puts it back
function hitBright(a,k){
  if((a.hb||0)===k)return;a.hb=k;
  for(const m of a.mats){if(!m.color)continue;const u=m.userData;if(!u.c0)u.c0=m.color.clone();m.color.copy(u.c0).multiplyScalar(1+k)}
}
