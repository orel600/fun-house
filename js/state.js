/* מצב המשחק והתחלה מחדש */
let P,S,enemies,pb,eb,orbs,parts,floats,mines,waves,joy=null;
const keys={};

function reset(){
  P={x:0,y:0,r:14,hp:100,maxHp:100,speed:165,weapon:'sword',aim:0,walk:0,inv:0,moving:false,
    sw:{dmg:20,range:80,arc:2.3,cd:0.55,t:0,anim:0,ang:0},
    gn:{dmg:9,cd:0.3,t:0,speed:580,multi:1,pierce:0,recoil:0},
    magnet:90,level:1,xp:0,next:6,swapLvl:0,swapBuff:0,regen:0,
    track:{sword:0,gun:0,move:0,still:0,dist:0,distN:0}};
  S={mode:'title',t:0,spawnT:1,nextBoss:75,boss:null,bossCount:0,kills:0,shake:0,hitstop:0,slow:0,picks:{},cam:{x:0,y:0},hurt:0,pendingLv:0};
  enemies=[];pb=[];eb=[];orbs=[];parts=[];floats=[];mines=[];waves=[];joy=null;
  bonusReset();
  updateSwapBtn();
}
