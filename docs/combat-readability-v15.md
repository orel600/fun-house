# v15 - compact arena crit labels

PREVIEW after v14. Two files only: js/arena-floatpack.js and the floating-number block in js/render.js.

Arena numeric crits use a maximum display font size of 21 world units, a small initial emphasis, filled gold and a dark edge. The former early-life 1.6x display multiplier and hollow gold outline no longer obscure the contact/body at phone landscape size. Other modes and opt-out floatpack=0 retain their prior renderer.

Damage amount, exclamation mark, crit flag, float coordinates, rise, lifetime and underlying damage are unchanged. Layout measures the same display font used by the renderer. Living floats keep their original reserved lane.

Source check: actual splash cast, 36 frames, zero errors; inspected early contact. Synthetic churn: 24 frames with moving hero/camera, new crits, new neighbours and expiry; zero layout offset jumps, zero rectangle overlap pairs, and source float coordinates/lifetimes unchanged.

This is a targeted readability fix, not all40 or whole-scene visual acceptance.
