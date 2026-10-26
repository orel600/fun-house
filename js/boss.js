/* בוס שלומד את השחקן */
function makeBoss(){
  const t=P.track;const fav=t.sword>=t.gun?'sword':'gun',other=fav==='sword'?'gun':'sword';
  const mobile=t.move/(t.move+t.still+0.001)>0.65;
  const w={ring:1,spiral:1,aimed:1,charge:1,shields:1,wisps:1,shock:1,mines:1};const learned=[];
  if(fav==='sword'){w.shock+=3;w.wisps+=3;learned.push('נלחמת בעיקר עם החרב, אז השריון שלו מקהה להבים.')}
  else{w.charge+=3;w.shields+=3;learned.push('ירית בעיקר חצים מרחוק, אז השריון שלו בולע חצים.')}
  if(mobile){w.spiral+=3;w.ring+=1;learned.push('אתה כל הזמן בתנועה, אז הוא ממלא את האוויר בספירלות.')}
  else{w.mines+=3;w.aimed+=2;learned.push('אתה נוטה לעמוד במקום, אז הוא שותל מוקשים מתחתיך.')}
  const ks=Object.keys(w),pats=[];
  while(pats.length<3){
    const c=ks.filter(k=>!pats.includes(k));let tot=c.reduce((s,k)=>s+w[k],0),r=Math.random()*tot,ch=c[c.length-1];
    for(const k of c){r-=w[k];if(r<=0){ch=k;break}}pats.push(ch);
  }
  const p2=pick(ks.filter(k=>!pats.includes(k)));
  const hp=650*(1+S.bossCount*0.7),p=spawnPos();
  return{isBoss:true,type:'boss',name:pick(SYL1)+pick(SYL2),title:fav==='sword'?'שובר הלהבים':'בולע החצים',
    x:p.x,y:p.y,r:34,hp,max:hp,speed:62,mult:{[fav]:0.5,[other]:1.7},weak:other,pats,p2,phase:1,patT:2.4,
    flash:0,kx:0,ky:0,ph:0,dmg:20,learned,spin:0,charge:null,spiral:0,spA:0,spT:0,rage:0,flee:0,rageMsg:0,rageShot:0};
}
function shootE(x,y,a,sp,r,dmg){eb.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r,dmg,life:5})}
function doPattern(b,k){
  const aP=Math.atan2(P.y-b.y,P.x-b.x);
  switch(k){
    case 'ring':{const n=14+(b.phase>1?8:0),o=rand(0,1);for(let i=0;i<n;i++)shootE(b.x,b.y,o+i/n*Math.PI*2,145,7,12);break}
    case 'spiral':b.spiral=2.2;b.spA=aP;break;
    case 'aimed':{const n=b.phase>1?7:5;for(let i=0;i<n;i++)shootE(b.x,b.y,aP+(i-(n-1)/2)*0.16,240,6,12);break}
    case 'charge':b.charge={stage:0,t:0.75,a:aP};break;
    case 'shields':case 'wisps':{const n=2+b.phase;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;addEnemy(k==='shields'?'shield':'wisp',b.x+Math.cos(a)*60,b.y+Math.sin(a)*60)}break}
    case 'shock':waves.push({x:b.x,y:b.y,r:b.r,from:b.r,max:270,t:-0.6,hit:false});break;
    case 'mines':{const n=4+b.phase*2;for(let i=0;i<n;i++){const a=rand(0,6.28),rr=i===0?0:rand(35,150);mines.push({x:P.x+Math.cos(a)*rr,y:P.y+Math.sin(a)*rr,t:1.3})}break}
  }
}
function bossUpdate(b,dt){
  b.spin+=dt*(b.phase>1?2.4:1.4);b.flash-=dt;
  const dx=P.x-b.x,dy=P.y-b.y,d=Math.hypot(dx,dy)||1;
  // הרעיון של אוראל: בורחים ממנו? הוא מתעצבן. התחמקות קצרה לא נספרת, רק בריחה של יותר משנייה וחצי
  const away=(P.vx*dx+P.vy*dy)/d;
  if(d>200&&away>P.speed*0.5)b.flee+=dt;else b.flee=Math.max(0,b.flee-dt*1.5);
  if(b.flee>1.5)b.rage=Math.min(1,b.rage+dt*0.35);else if(d<220)b.rage=Math.max(0,b.rage-dt*0.12);
  if(b.rage>0.35&&b.rageMsg<1){b.rageMsg=1;banner(b.name+' מתעצבן: אל תברח',C.blood)}
  if(b.rage>=1&&b.rageMsg<2){b.rageMsg=2;banner(b.name+' זועם',C.blood);S.shake=Math.max(S.shake,8)}
  if(b.rage<0.1)b.rageMsg=0;
  b.rageShot-=dt;
  if(b.rage>0.6&&b.flee>1.5&&b.rageShot<=0){b.rageShot=0.9;const a=Math.atan2(dy,dx);for(let i=-1;i<=1;i++)shootE(b.x,b.y,a+i*0.12,270,6,12)}
  if(b.charge){
    const c=b.charge;c.t-=dt;
    if(c.stage===0){if(c.t<=0){c.stage=1;c.t=0.45}}
    else{b.x+=Math.cos(c.a)*680*dt;b.y+=Math.sin(c.a)*680*dt;
      if(Math.random()<.6)parts.push({x:b.x+rand(-20,20),y:b.y+rand(-20,20),vx:0,vy:0,life:.3,max:.3,col:C.lilac,size:4});
      if(c.t<=0){b.charge=null;S.shake=Math.max(S.shake,6)}}
  }else{
    const want=d>190?1:d<130?-0.6:0,fury=1+b.rage*1.2;b.x+=dx/d*b.speed*fury*want*dt;b.y+=dy/d*b.speed*fury*want*dt;
  }
  if(b.spiral>0){
    b.spiral-=dt;b.spT-=dt;
    if(b.spT<=0){b.spT=0.075;const arms=b.phase>1?3:2;for(let k=0;k<arms;k++)shootE(b.x,b.y,b.spA+k*Math.PI*2/arms,150,7,10);b.spA+=0.33}
  }
  b.patT-=dt*(1+b.rage*1.5);
  if(b.patT<=0&&!b.charge){b.patT=b.phase>1?1.7:2.4;doPattern(b,pick(b.pats))}
  if(b.phase===1&&b.hp<b.max*0.5){b.phase=2;b.pats.push(b.p2);b.speed*=1.3;banner('שלב 2 · '+PNAME[b.p2],C.lilac);S.shake=10}
  if(d<b.r+P.r-4)hurt(b.dmg);
}
function bossDown(b){
  S.boss=null;S.bossCount++;S.nextBoss=S.t+110;
  for(let i=0;i<22;i++)orbs.push({x:b.x+rand(-40,40),y:b.y+rand(-40,40),v:1});
  sparks(b.x,b.y,C.lilac,40,320);sparks(b.x,b.y,C.gold,20,260);
  eb=[];waves=[];mines=[];S.hitstop=0.25;S.slow=0.8;S.shake=14;
  banner(b.name+' הובס',C.gold);
  P.track={sword:0,gun:0,move:0,still:0,dist:0,distN:0};
}
