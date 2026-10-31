/* כל פנס שנדלק משנה את הכפר (docs/story.md: "הכפר גדל, נפתח סוג נזק חזק יותר בציוד, וקטע קצר של סיפור מראש הכפר").
   לכל פנס ב-STORY.lanterns (story.js) שורה ב-HOME.list:
   1. תושב שחוזר הביתה: שורה ב-NPC.list (npc.js) עם lantern, כך שהוא מופיע רק אחרי שחזר. המראה: LOOK3D.npc_<id> ב-render3d.js.
   2. עמוד פנס ליד מרכז הכפר: שישה עמודים, וכל פנס שנדלק דולק גם כאן בצבע שלו. רואים כמה נשארו.
   3. קטע סיפור מראש הכפר: בכניסה הראשונה לכפר אחרי ההדלקה התושב "חוזר" (חגיגה), וראש הכפר מספר. פנס אחד בכל כניסה.
   4. פרס קבוע: אויבים בעולם הפתוח מפילים לפעמים חפץ מסתובב ביסוד של הפנס (lootKill ב-loot.js).
   פנס עתידי (fire, bolt...) כבר כתוב כאן, ומתעורר לבד כשהפנס שלו יופיע ב-STORY.lanterns וידלק.
   נשמר: SAVE.home.back ({earth:1}): מי כבר חזר. הטקסטים ב-lang.js תחת 'home.' ו-'npc.<id>' */

const HOME={
  /* res: התושב שחוזר. at ו-area כמו ב-NPC.list. item: החפץ שנופל אחרי שהפנס דולק. chance: סיכוי לכל אויב שנופל בעולם */
  list:{
    earth:{res:'gardener',at:{x:-110,y:120},area:35,col:'#8BC34A',item:'stoneOrb',chance:0.012},
    water:{res:'washer',  at:{x:110,y:30},  area:35,col:'#3F7BF5',item:'leafOrb', chance:0.012},
    ice:  {res:'singer',  at:{x:200,y:-140},area:30,col:'#7FD4FF',item:'frostOrb',chance:0.012},
    fire: {res:'baker',   at:{x:-200,y:-130},area:30,col:C.ember, item:'emberOrb',chance:0.012},
    bolt: {res:'bellringer',at:{x:140,y:270},area:30,col:'#C7A6FF',item:'cloverOrb',chance:0.012},   // פרק 5: הפעמונאי. תלתן: מזל, כמו ברק שפוגע פעמיים
    light:{res:'lamplighter',at:{x:-320,y:60},area:30,col:'#FFFFFF'}   // פרק 6, האחרונה: מדליקת הפנסים. בלי חפץ: המתנה של הפנס הלבן היא הסוף עצמו
  },
  // שישה עמודים בקשת מול מרכז הכפר, לפי סדר הפרקים. לכל אחד זווית סביב מרכז הכפר (לא על הדרך לשער). col: לפנס שעוד אין ב-STORY.lanterns
  posts:[{k:'earth',a:59},{k:'water',a:121},{k:'ice',a:42},{k:'fire',a:138,col:'#FF8A3D'},{k:'bolt',a:25,col:'#C7A6FF'},{k:'light',a:155,col:'#FFFFFF'}],
  postR:125,          // כמה רחוק מאמצע מרכז הכפר
  taleDelay:1.6       // שניות אחרי הכניסה לכפר עד שראש הכפר מספר
};
// התושבים נכנסים לרשימת התושבים, ומופיעים רק כשחזרו (npcHere ב-npc.js)
for(const k in HOME.list){const H=HOME.list[k];NPC.list[H.res]={home:null,lantern:k,at:H.at,area:H.area,col:H.col}}

const HMS=()=>SAVE.home||(SAVE.home={back:{}});
const homeBack=k=>!!HMS().back[k];
const homePost=p=>{const B=VILLAGE.b.center,a=p.a*Math.PI/180;return{x:B.x+Math.cos(a)*HOME.postR,y:B.y+Math.sin(a)*HOME.postR}};

/* ---- בכניסה לכפר (enterVillage): הפנס הראשון שדלק ועוד לא חזר ממנו אף אחד ---- */
function homeVillage(){
  const k=Object.keys(HOME.list).find(k=>STO()[k]&&!homeBack(k));if(!k)return null;
  const H=HOME.list[k];HMS().back[k]=1;saveNow();
  setTimeout(()=>{if(!S.vil)return;const n=npcAt(H.res),p=HOME.posts.find(p=>p.k===k);
    if(n)celebrate(n.x,n.y-20,'rank',T('home.back',T('npc.'+H.res)[0]));
    if(p){const q=homePost(p);sparks(q.x,q.y-80,homeCol(k),24,200)}
    banner(T('home.back',T('npc.'+H.res)[0]),homeCol(k));sfx('celebrate')},600);
  storySay('home.'+k+'.tale',HOME.taleDelay);   // ראש הכפר מספר (story.js)
  return k;
}
const homeCol=k=>(STORY.lanterns[k]||{}).glow||(HOME.posts.find(p=>p.k===k)||{}).col||C.gold;

/* ---- הפרס: חפץ ביסוד של הפנס, מאויבים בעולם (lootKill ב-loot.js) ---- */
function homeKill(e){
  if(!S.wd||S.room||e.node||e.warden)return null;
  for(const k in HOME.list){const H=HOME.list[k];if(!STO()[k]||!gItem(H.item)||Math.random()>=H.chance*orbitLuck()*statLoot())continue;
    dropSpawn(H.item,1,e.x,e.y);banner(T('home.'+k+'.gift')+' '+gIcon(H.item),homeCol(k));celebrate(e.x,e.y,'loot2',gIcon(H.item));return H.item}
  return null;
}

/* ---- ציור: העמודים, בשני המצבים (גם בתלת-ממד, כמו הפנס בעולם ב-story.js) ---- */
function homeDraw(){
  if(!S.vil)return;const t=fxNow();
  for(const p of HOME.posts){const {x,y}=homePost(p),lit=!!STO()[p.k]&&homeBack(p.k),gl=homeCol(p.k);
    ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+4,14,5,0,0,7);ctx.fill();
    ctx.fillStyle='#4A3A2A';ctx.fillRect(x-3,y-46,6,50);
    if(lit){const g=ctx.createRadialGradient(x,y-54,3,x,y-54,52+Math.sin(t*2+p.a)*5);g.addColorStop(0,gl+'99');g.addColorStop(1,gl+'00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y-54,58,0,7);ctx.fill()}
    ctx.fillStyle=lit?gl:'#3A3F52';ctx.strokeStyle='#2A2018';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-9,y-66,18,22,4);ctx.fill();ctx.stroke()}
}
