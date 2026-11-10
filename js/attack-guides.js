/* Shared visual vocabulary for attack previews. No targeting or combat mutations.
   Unbroken outer extent plus moving ember ticks. World/village stay untouched. */
function kineticRing(x,y,r,col,progress=0,alpha=1,flat=1){
 ctx.save();ctx.translate(x,y);ctx.scale(1,flat);
 ctx.strokeStyle='#17121d';ctx.lineWidth=4;ctx.globalAlpha=alpha*.7;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.globalAlpha=alpha*.65;ctx.stroke();
 const t=S.mb?MB.t:S.t;
 for(let j=0;j<12;j++){const a=j*Math.PI/6,rr=r-3,dx=Math.cos(a),dy=Math.sin(a);
  ctx.beginPath();ctx.moveTo(dx*(rr-3),dy*(rr-3));ctx.lineTo(dx*(rr+3),dy*(rr+3));ctx.strokeStyle='#ffe9ca';ctx.globalAlpha=alpha*.8;ctx.lineWidth=1.4;ctx.stroke()}
 const p=Math.max(0,Math.min(1,progress));if(p>0){ctx.strokeStyle=col;ctx.lineWidth=3;ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(0,0,r,-Math.PI/2,-Math.PI/2+Math.PI*2*p);ctx.stroke()}
 if(!fxLess())for(let j=0;j<4;j++){const a=t*1.6+j*Math.PI/2;
   kineticSprite('sf_embers',Math.cos(a)*r,Math.sin(a)*r,44,(t+j*.13)%.7,.7,0,alpha*.8)}
 ctx.restore();
}
function kineticMine(m){
 if(!kineticHere())return false;
 const p=1-Math.max(0,m.t)/(m.ardgT0||1.3);
 ctx.save();ctx.strokeStyle='#efaa89';ctx.globalAlpha=.5;ctx.lineWidth=1.3;
 // Four short edge brackets preserve exact58radius without a stack of full circles.
 for(let j=0;j<4;j++){const a=j*Math.PI/2;ctx.beginPath();ctx.arc(m.x,m.y,58,a-.08,a+.08);ctx.stroke()}
 ctx.globalAlpha=.85;ctx.strokeStyle='#ffd8af';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.x,m.y-4);ctx.lineTo(m.x,m.y-4-13*(1-Math.max(0,p)));ctx.stroke();
 // One compact fuse, no second150px target atlas or orbiting sparkle ring.
 ctx.fillStyle='#291520';ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(m.x,m.y,7,0,7);ctx.fill();
 ctx.fillStyle='#ff845e';ctx.globalAlpha=.7+.3*Math.sin(S.t*15);ctx.beginPath();ctx.arc(m.x,m.y,3+2*p,0,7);ctx.fill();ctx.restore();return true;
}
function kineticWave(w){
 if(!kineticHere())return false;
 if(w.t<0)kineticRing(w.x,w.y,w.max,'#d0a0ef',1+w.t/.6,.8);
 else{const a=Math.max(0,1-w.t/.9);kineticRing(w.x,w.y,w.r,'#dac9ff',0,a);
  ctx.save();ctx.strokeStyle='#fff2df';ctx.globalAlpha=a*.7;ctx.lineWidth=3;ctx.beginPath();ctx.arc(w.x,w.y,Math.max(0,w.r-6),0,Math.PI*2);ctx.stroke();ctx.restore()}
 return true;
}
function kineticGuide(x,y,a,len,w,col,k=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalAlpha=k*.65;ctx.lineWidth=1.4;ctx.strokeStyle=col;
 for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,side*w/2);ctx.lineTo(len,side*w/2);ctx.stroke()}
 // Slim endpoint and moving streak, no filled arrowhead or solid rectangle.
 ctx.beginPath();ctx.moveTo(len,-w/2);ctx.lineTo(len,w/2);ctx.strokeStyle='#fff3da';ctx.globalAlpha=k*.9;ctx.stroke();
 if(!fxLess()){const t=S.mb?MB.t:S.t;for(let j=0;j<3;j++){const p=(t*1.7+j/3)%1;ctx.beginPath();ctx.moveTo(Math.max(0,len*p-18),0);ctx.lineTo(len*p,0);ctx.strokeStyle=col;ctx.lineWidth=2.2;ctx.globalAlpha=k*(1-p)*.8;ctx.stroke()}}
 ctx.restore();
}
function kineticMbZone(z,col){
 if(!KINETIC.on||!S.mb)return false;
 const p=z.delay>0?1-z.delay/z.t0:0,a=z.delay>0?.9:Math.min(.7,z.left/.3);
 kineticRing(z.x,z.y,z.r,col,p,a);return true;
}
if(KINETIC.on){
 const aim=mbAimPaint;mbAimPaint=function(u,s,R,p,a,col,k,ring){
  if(!S.mb)return aim.apply(this,arguments);
  const r=p.kind==='self'?(s.r||R):R;
  if(ring)kineticRing(u.x,u.y,r,col,0,k*.35);
  if(p.kind==='self')kineticRing(u.x,u.y,s.r||R,col,0,k);
  else if(p.kind==='point'){kineticRing(p.x,p.y,s.r||MBAIM.dotR,col,0,k);const dx=p.x-u.x,dy=p.y-u.y;kineticGuide(u.x,u.y,Math.atan2(dy,dx),Math.hypot(dx,dy),2,col,k*.5)}
  else if(p.kind==='unit'&&p.t){const t=p.t;kineticRing(t.x,t.y+2,t.r+10,col,0,k,.5);kineticGuide(u.x,u.y,Math.atan2(t.y-u.y,t.x-u.x),Math.hypot(t.x-u.x,t.y-u.y),2,col,k*.5)}
  else kineticGuide(u.x,u.y,a,p.kind==='line'?R:Math.min(R,s.dist||R),p.kind==='line'?(s.w||MBAIM.lineW):MBAIM.lineW,col,k);
 };
 const lock=mbAtkDraw;mbAtkDraw=function(){if(!S.mb)return lock.apply(this,arguments);const L=MB.lock,A=mbAtkP;
  if(L&&!L.dead&&mbShow(L))kineticRing(L.x,L.y+2,L.r+MBATK.ring.pad,'#ff7f83',0,.95,.45);
  if(A&&A.on&&A.t&&A.t!==L&&!A.cancel)kineticRing(A.t.x,A.t.y+2,A.t.r+MBATK.ring.pad,'#ffb8ab',0,.55,.45);
 };
}

// Ordinary ranged enemies had a separate old filled rectangle, not the boss layer.
// Observe its existing locked direction and clock without changing the aim or release.
if(KINETIC.on){
 ATG.line.a=0;
 const oldAtg=atgDraw;atgDraw=function(){
   if(!kineticHere())return oldAtg.apply(this,arguments);
   if(!atgOn())return;
   for(const e of enemies){const g=e.atg;if(!g||e.dead)continue;
     kineticGuide(e.x,e.y,g.a,ATG.line.len,5,'#ee6c82',.65);
   }
 };
}
