/* מצב המשחק והתחלה מחדש */
// תנועה: מהירות הליכה בסיסית, וכמה מהר הגוף מסתובב (רדיאנים בשנייה). ניר: "אתה הולך הרבה (ולאט)", "הדמות צריכה להסתכל לכיוון שאליו אתה הולך"
const MOVE={speed:185,turn:16};
let P,S,enemies,pb,eb,orbs,parts,floats,mines,waves,joy=null;
const keys={};
// מה הבוס לומד: זמן עם כל נשק, תנועה, ונזק מכל סוג
const newTrack=()=>({sword:0,gun:0,move:0,still:0,dist:0,distN:0,types:Object.fromEntries(Object.keys(DMG.types).map(k=>[k,0]))});

function reset(){
  P={x:0,y:0,r:14,hp:100,maxHp:100,speed:MOVE.speed,weapon:'sword',wt:'sword',wid:null,aim:0,face:0,walk:0,inv:0,moving:false,
    sw:{dmg:20,range:80,arc:2.3,cd:0.55,t:0,anim:0,ang:0},
    gn:{dmg:9,cd:0.3,t:0,speed:580,multi:1,pierce:0,recoil:0},
    magnet:90,def:0,crit:0,loot:0,level:1,xp:0,next:6,swapLvl:0,swapBuff:0,regen:0,
    dt:{...DMG.weapons},track:newTrack()};
  S={mode:'title',t:0,spawnT:1,hordeT:4,nextBoss:RUN.bossAt,boss:null,bossCount:0,kills:0,shake:0,hitstop:0,slow:0,picks:{},cam:{x:0,y:0},hurt:0,pendingLv:0,hits:{}};
  enemies=[];pb=[];eb=[];orbs=[];parts=[];floats=[];mines=[];waves=[];joy=null;
  runReset();
  bonusReset();
  wantedReset();
  nodesReset();   // מקורות משאבים בזירה (nodes.js)
  gearReset();   // הציוד מהכפר: מתנה ראשונה, והסטטים שלו על השחקן (gear.js)
  heroReset();   // הפסיבית של דמות ההתחלה (heroes.js)
  skillsReset();   // הסקיל של הנשק (skills.js)
  orbitReset();   // החפצים המסתובבים (orbit.js)
  divineReset();   // ברק אלוהי (divine.js)
  reset3d();
  updateSwapBtn();
}
