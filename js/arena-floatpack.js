/* Arena-only number packing. Each living float owns its display offset until expiry.
   No gameplay x/y, damage, velocity or lifetime is changed. ?floatpack=0 opts out. */
const ARFLOAT={on:!/[?&]floatpack=0(?:&|$)/.test(location.search),rects:[],overlaps:0,slots:new WeakMap()};
function arenaFloatLayout(list,ox,oy){
  const out=new Map();ARFLOAT.rects=[];ARFLOAT.overlaps=0;
  if(!ARFLOAT.on||!S||S.mb||S.wd||S.vil||S.mode!=='play')return out;
  const active=list.filter(f=>f!==S.gain&&/^[-+]?\d/.test(String(f.txt))),occupied=[];
  const minY=floatTop()/ZOOM-oy+22,maxY=H-oy-24,heroH=typeof abodyHere==='function'&&abodyHere()?heroLook().h:70,hero={x:P.x-26,y:P.y-heroH,w:52,h:heroH+10};
  const overlap=(a,b)=>a.x<b.x+b.w+4&&a.x+a.w+4>b.x&&a.y<b.y+b.h+14&&a.y+a.h+14>b.y;
  const placed=(f,s)=>{const x=f.x+s.dx,y=f.y+s.dy;return{x,y,r:{x:x-s.w/2,y:y-s.h,w:s.w,h:s.h}}};
  // Reserve existing floats first, in their original lane. Never reassign on a font-size,
  // camera, hero-movement or neighbour-expiry change. WeakMap releases with the float.
  for(const f of active){const s=ARFLOAT.slots.get(f);if(s){const p=placed(f,s);out.set(f,p);occupied.push(p.r)}}
  ctx.save();
  for(const f of active){
    if(out.has(f))continue;
    const sz=f.crit?f.size*(1+Math.max(0,f.life-.8)*4):f.size;
    ctx.font='800 '+sz+'px Heebo, system-ui, sans-serif';
    const w=ctx.measureText(String(f.txt)).width+8,h=sz*1.3+6;
    let best=null,cost=Infinity;
    for(const dy of [0,-36,-72,-108,36,72,108,-144])for(const dx of [0,-48,48,-96,96,-144,144,-192,192]){
      const x=Math.max(-ox+w/2+8,Math.min(W-ox-w/2-8,f.x+dx)),y=Math.max(minY+h,Math.min(maxY,f.y+dy));
      const r={x:x-w/2,y:y-h,w,h};
      if(occupied.some(b=>overlap(r,b))||overlap(r,hero))continue;
      const c=Math.abs(x-f.x)+Math.abs(y-f.y)*1.15;
      if(c<cost){best={x,y,r};cost=c}
    }
    if(!best){best={x:f.x,y:f.y,r:{x:f.x-w/2,y:f.y-h,w,h}};ARFLOAT.overlaps++}
    ARFLOAT.slots.set(f,{dx:best.x-f.x,dy:best.y-f.y,w,h});
    out.set(f,best);occupied.push(best.r);
  }
  for(const f of active)ARFLOAT.rects.push(out.get(f).r);
  ctx.restore();return out;
}
