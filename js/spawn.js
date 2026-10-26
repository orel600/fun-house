/* הופעת אויבים */
function spawnPos(){const a=rand(0,Math.PI*2),d=Math.max(W,H)*0.62+40;return{x:P.x+Math.cos(a)*d,y:P.y+Math.sin(a)*d}}
function addEnemy(type,x,y){
  const d=ETYPES[type],k=1+S.t/80+S.bossCount*0.5;
  enemies.push({type,x,y,hp:d.hp*k,max:d.hp*k,r:d.r,speed:d.speed*(1+Math.min(0.4,S.t/400)),mult:d.mult,xp:d.xp,dmg:d.dmg,
    flash:0,kx:0,ky:0,shoot:rand(1.2,2.6),ph:rand(0,6),told:false});
}
function spawner(dt){
  S.spawnT-=dt;if(S.spawnT>0||enemies.length>80)return;
  let iv=Math.max(0.32,1.25-S.t*0.006);if(S.boss)iv*=2.2;S.spawnT=iv;
  const n=1+Math.floor(S.t/50);
  for(let i=0;i<n;i++){
    const p=spawnPos();let type='grunt';const r=Math.random();
    if(S.t>15&&r<0.28)type='shield';else if(S.t>28&&r<0.56)type='wisp';
    addEnemy(type,p.x+rand(-30,30),p.y+rand(-30,30));
  }
}
