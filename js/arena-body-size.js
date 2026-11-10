/* Arena screen readability only. Does not change unit radii, ranges, camera,
   damage, velocity, timing or world/village/MOBA visuals. ?abodysize=old opts out. */
const ABODYSIZE={on:!/[?&]abodysize=old(?:&|$)/.test(location.search),hero:1.65,enemy:1.25,boss:1.12};
const abodyHere=()=>ABODYSIZE.on&&S&&!S.mb&&!S.wd&&!S.vil&&!S.room;
(function(){
 const cache=new WeakMap();
 function larger(L,k){if(!L||!L.h)return L;let c=cache.get(L);if(c&&c.k===k)return c.L;
  const out=Object.assign({},L,{h:L.h*k,bodySize:k});cache.set(L,{k,L:out});return out}
 const hero=heroLook;heroLook=function(){const L=hero.apply(this,arguments);return abodyHere()?larger(L,ABODYSIZE.hero):L};
 const look=lookOf;lookOf=function(e){const L=look.apply(this,arguments);return abodyHere()&&e&&e!==P?larger(L,e.isBoss?ABODYSIZE.boss:ABODYSIZE.enemy):L};
})();
