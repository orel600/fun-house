/* הכפר מתמלא (המבקר, 1.11.2026, idea-living-village): דמות מהעולם הפתוח (worldnpc.js) שסיימת את הקווסט האחרון שלה עוברת לגור בכפר.
   בעולם: אחרי שלוקחים את הפרס האחרון היא נפרדת ("נתראה בכפר"), ובכניסה הבאה לעולם היא כבר לא שם (הבריכה של הדייג נשארת).
   בכפר: בית קטן משלה (אוהל בתלת-ממד, VIL3D.models.tent), שלט עם מה שהיא עושה, ושירות אחד בשיחה:
   הדייג קונה דגים ביותר מהשוק, החוצבת מחליפה אבנים בברזל, והלקטת מחליפה עשבים בתמצית.
   בכניסה הראשונה לכפר אחרי המעבר: חגיגה ובאנר "עברה לגור בכפר". נשמר ב-SAVE.resid ({fisher:1} נפרדה, 2 כבר הגיעה).
   בכפר היא תושבת רגילה ב-NPC.list (npc.js) בשם 'v'+id, כדי לא להתבלבל עם הדמות שבעולם. המראה: LOOK3D.npc_v<id> (render3d.js).
   הטקסטים ב-lang.js תחת 'npc.v<id>' ו-'rsd.'. דמות חדשה שעוברת לכפר = שורה ב-list, שורה ב-LOOK3D ומשפטים ב-lang.js */

const RESID={
  /* last: הקווסט האחרון שלה בעולם (QUESTS.list). house: איפה הבית בכפר, במקום פנוי (לא מבנה, לא דרך, לא תושב אחר).
     sign: האייקון בשלט. serve: 'fish' קונה דגים במחיר השוק כפול mult, 'trade' מחליפה give ב-get */
  list:{
    fisher:{last:'wCatch',  house:{x:-150,y:300},col:'#3F7BF5',sign:'🐟',serve:'fish',mult:2},
    cutter:{last:'wGolems', house:{x:-330,y:-200},col:'#A8784A',sign:'🪨',serve:'trade',give:{stone:10},get:{iron:2},work:true},
    herbal:{last:'wSprites',house:{x:360,y:40},col:'#5FA35A',sign:'🌿',serve:'trade',give:{herb:4},get:{essence:1}}
  },
  front:52,         // כמה לפני הבית היא עומדת
  area:30,          // כמה רחוק היא מסתובבת
  house3d:95,       // רוחב האוהל בתלת-ממד
  arrive:1.2        // שניות אחרי הכניסה לכפר עד החגיגה, אחרי זו של הפנסים
};
// בכפר: תושבת רגילה, שמופיעה רק אחרי הקווסט האחרון שלה (here ב-npcHere)
for(const id in RESID.list){const R=RESID.list[id];
  NPC.list['v'+id]={home:null,here:()=>resMoved(id),at:{x:R.house.x,y:R.house.y+RESID.front},area:RESID.area,col:R.col,work:R.work,pic:id,serve:id}}

const RSS=()=>SAVE.resid||(SAVE.resid={});   // נוצר בפעם הראשונה, כדי ששמירה ישנה תעבוד
const resMoved=id=>!!RESID.list[id]&&!!QS().done[RESID.list[id].last];
const resGone=id=>resMoved(id);   // בעולם: כבר לא באחו (wnpcState ב-worldnpc.js)

/* ---- בעולם: לקחת את הפרס האחרון שלה. היא נפרדת (נקרא מהשיחה ב-worldnpc.js) ---- */
function resLeave(id){
  if(!resMoved(id)||RSS()[id])return;
  RSS()[id]=1;saveNow();
  S.wd.dlgLine=T('rsd.'+id+'.bye');
  banner(T('rsd.leave',T('npc.'+id)[0]),C.gold);
}

/* ---- בכניסה לכפר (enterVillage): מי שעברה ועוד לא הגיעה, מגיעה עכשיו בחגיגה ---- */
function resVillage(){
  const ids=Object.keys(RESID.list).filter(id=>resMoved(id)&&RSS()[id]!==2);if(!ids.length)return;
  ids.forEach(id=>RSS()[id]=2);saveNow();
  ids.forEach((id,i)=>setTimeout(()=>{if(!S.vil)return;const n=npcAt('v'+id),R=RESID.list[id];
    if(n){n.st='cheer';n.t=NPC.cheerT;n.emote='🏠'}
    celebrate(R.house.x,R.house.y-30,'rank',T('rsd.arrive',T('npc.'+id)[0]));
    banner(T('rsd.arrive',T('npc.'+id)[0]),R.col);sfx('celebrate')},(RESID.arrive+i*1.8)*1000));
}

/* ---- השירות, בשיחה איתה בכפר (npcDialog ב-npc.js) ---- */
const resPrice=(id,f)=>RES.list[f].sell*RESID.list[id].mult;
const resCan=id=>{const R=RESID.list[id];return Object.keys(R.give).every(r=>bagHas(r,R.give[r]))};
const resChips=(o,have)=>Object.keys(o).map(r=>'<span class="res'+(have&&!bagHas(r,o[r])?' short':'')+'">'+resIcon(r)+' '+(have?(SAVE.bag[r]||0)+'/':'')+o[r]+'</span>').join('');
function resHtml(vid){
  const id=NPC.list[vid].serve,R=RESID.list[id];
  let h='<div class="fcook"><b>'+R.sign+' '+T('rsd.'+id+'.t')+'</b>';
  if(R.serve==='fish'){
    const fish=fishList().filter(f=>SAVE.bag[f]>0);   // fishing.js
    if(!fish.length)h+='<p class="next">'+T('rsd.noFish')+'</p>';
    for(const f of fish)h+='<div class="fmeal"><span class="fmi">'+resIcon(f)+'</span><span class="fmt"><b>'+resName(f)+' ×'+SAVE.bag[f]+'</b><small>'+T('rsd.each',resPrice(id,f),RES.list[f].sell)+'</small></span>'+
      '<button class="vbtn" data-act="res" data-k="'+f+'">'+T('rsd.sell',resPrice(id,f))+'</button></div>';
  }else h+='<div class="fmeal"><span class="fmi">'+R.sign+'</span><span class="fmt"><small>'+T('rsd.'+id+'.d')+'</small><span>'+resChips(R.give,true)+' → '+resChips(R.get)+'</span></span>'+
    '<button class="vbtn" data-act="res"'+(resCan(id)?'':' disabled')+'>'+T('rsd.swap')+'</button></div>';
  return h+'</div>';
}
function resDo(vid,k){
  const id=NPC.list[vid]&&NPC.list[vid].serve,R=RESID.list[id];if(!R)return false;
  let got;
  if(R.serve==='fish'){if(!RES.list[k]||RES.list[k].fam!=='fish'||!bagTake(k,1))return false;got={coins:resPrice(id,k)}}
  else{if(!resCan(id))return false;for(const r in R.give)bagTake(r,R.give[r]);got=R.get}
  for(const r in got)bagAdd(r,got[r]);
  saveNow();sfx('coin');
  floatText(P.x,P.y-46,Object.keys(got).map(r=>'+'+got[r]+' '+resIcon(r)).join(' '),C.gold,16);
  return true;
}

/* ---- ציור: בית קטן ושלט ---- */
// דו-ממד: קירות בצבע שלה, גג ודלת. בתלת-ממד: אוהל (resSync3d)
function resDraw(){
  if(!S.vil||R3D.on)return;
  for(const id in RESID.list){if(!resMoved(id))continue;const {x,y}=RESID.list[id].house;
    ctx.fillStyle='rgba(5,7,13,0.4)';ctx.beginPath();ctx.ellipse(x,y+6,40,12,0,0,7);ctx.fill();
    ctx.fillStyle=RESID.list[id].col;ctx.fillRect(x-30,y-34,60,40);
    ctx.fillStyle='#6B3F22';ctx.beginPath();ctx.moveTo(x-38,y-32);ctx.lineTo(x,y-62);ctx.lineTo(x+38,y-32);ctx.fill();
    ctx.fillStyle='#3A2414';ctx.fillRect(x-8,y-16,16,22)}
}
// מעל הכל: שלט מתחת לבית, עם מה שהיא עושה
function resScreen(ox,oy){
  if(!S.vil)return;
  ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 13px Heebo, system-ui, sans-serif';
  for(const id in RESID.list){if(!resMoved(id))continue;const R=RESID.list[id],txt=R.sign+' '+T('rsd.'+id+'.t'),w=ctx.measureText(txt).width+16,x=R.house.x+ox,y=R.house.y+oy+22;
    ctx.fillStyle='rgba(18,22,36,0.78)';ctx.beginPath();ctx.roundRect(x-w/2,y-11,w,22,11);ctx.fill();ctx.fillStyle=C.chalk;ctx.fillText(txt,x,y+5)}
}
// תלת-ממד: אוהל וחבית לכל מי שעברה. נקרא מ-syncNpcs ב-render3d.js
function resSync3d(){
  const V=R3D.vil;if(!V)return;const H=V.resH||(V.resH={});
  for(const id in RESID.list){if(H[id]||!resMoved(id))continue;const {x,y}=RESID.list[id].house;
    H[id]=vPut(VIL3D.models.tent.model,x,y,RESID.house3d);vPut(VIL3D.deco.barrel.model,x+52,y+14,VIL3D.deco.barrel.w)}
}
