/* סקרנות וחקירה (docs/plan-progression.md, עמוד 4. ניר, 1.11.2026: "לגלות אזורים חדשים ולחקור אותם... תחושה שאתה מתקדם").
   4א, רואים ועוד לא מגיעים: הדרך לאזור הבא (WORLD.paths) נראית מההתחלה, עם שלט "רמה מומלצת N", מכשול (בול עץ, סלע, גשר שבור)
       ושומרים חזקים יותר בכניסה. המכשול נעלם כשמגיעים לרמה, עם חגיגה (celebrate ב-fx.js), או כשהעלילה פותחת את הדרך.
       הסדר של הפנסים לא משתנה: הדרך עצמה עדיין נפתחת רק כשהפנס דולק (wPathOpen ב-world.js). זו טעימה ומטרה, לא קיצור דרך.
   4ב, סודות לפי רמה: מקומות ב-SECRETS.regions עם lv נפתחים רק ברמה הזו (scOpen ב-secrets.js). בעליית רמה, הכרטיס של levelpath.js
       אומר "משהו חדש באחו" (cuAt), ובמפת העולם (worldmap.js) יש ? זהוב על האי עד שמוצאים אותו (cuNew).
   מספרים כאן. טקסט ב-lang.js תחת 'cu.'. נשמר ב-SAVE.curio ({clear:{lake:1}}).
   החיבורים: curioUpdate ב-worldUpdate, curioDraw ב-drawWorld, curioScreen ב-drawWorldScreen (world.js), ו-G.tough ב-wSpawn */

const CURIO={
  // לכל דרך: רמה מומלצת, ומה חוסם אותה עד הרמה. המפתח הוא האזור שאליו הדרך מובילה (כמו ב-WORLD.paths)
  paths:{
    lake:  {lv:5, ob:'log'},
    // איזון 4.11 (docs/balance-2026-11-04.md): היו 12/20/28/36, ושחקן הגיע לרמה 17 בסוף העלילה. עכשיו בערך מה ששחקן מגיע אליו בכ-10 דקות לפרק
    ridge: {lv:10,ob:'rock'},
    desert:{lv:15,ob:'bridge'},
    storm: {lv:20,ob:'rock'},
    shadow:{lv:25,ob:'bridge'}
  },
  icon:{log:'🪵',rock:'🪨',bridge:'🌉'},
  ob:{r:46},                      // גודל המכשול
  sign:{dy:-74,font:12,ok:'#F4C74F',low:'#FF8A7A'},   // השלט מעל הדרך. ok: כשהרמה מספיקה, low: כשעוד לא
  // שומרים בכניסה: קבוצה נוספת מהסוג הכי חזק באזור (הקבוצה הכי רחוקה מהבית), dy פיקסלים לפני הדרך. tough: פי כמה חיים ונזק
  guard:{n:2,dy:170,r:70,tough:1.6},
  mark:'?'                        // הסימן במפת העולם על אזור שיש בו סוד חדש
};

const CU=()=>SAVE.curio||(SAVE.curio={clear:{}});

// שומרים בכניסה לכל דרך: נכנסים כקבוצה רגילה ב-foes של האזור, ולכן חוזרים כמו כל קבוצה
(function(){
  for(const R of [WORLD,...Object.values(WORLD.regions)])for(const k in R.paths||{}){
    const c=CURIO.paths[k];if(!c||!R.foes)continue;const p=R.paths[k],G=CURIO.guard;
    const pool=R.foes.filter(f=>!f.creature&&!f.guard&&ETYPES[f.type]);if(!pool.length)continue;
    const d=f=>Math.hypot(f.x-R.home.x,f.y-R.home.y),top=pool.reduce((a,b)=>d(b)>d(a)?b:a);
    R.foes.push({type:top.type,n:G.n,x:p.x,y:p.y+G.dy,r:G.r,tough:G.tough,guard:k});
  }
})();

// הדרכים באזור הנוכחי שיש להן שלט: עוד סגורות, או שהרמה עוד לא מספיקה
function cuSigns(){
  if(!S.wd)return[];const R=WR(),lv=heroLv(),out=[];
  for(const k in R.paths){const c=CURIO.paths[k];if(!c)continue;const p=R.paths[k],open=wPathOpen(p);
    if(!open||lv<c.lv)out.push({k,x:p.x,y:p.y,lv:c.lv,open,ob:CU().clear[k]?null:c.ob})}
  return out;
}

/* ---- כל פריים בעולם: מכשול שהגיע זמנו נעלם ---- */
function curioUpdate(){
  if(!S.wd)return;const R=WR(),lv=heroLv();
  for(const k in R.paths){const c=CURIO.paths[k];if(!c||CU().clear[k])continue;
    const p=R.paths[k],open=wPathOpen(p);if(!open&&lv<c.lv)continue;
    CU().clear[k]=1;saveNow();
    if(lv>=c.lv){celebrate(p.x,p.y,'quest',CURIO.icon[c.ob]);sparks(p.x,p.y,C.gold,24,220);banner(T('cu.clear',T('w.region.'+k)),C.gold)}}   // בפתיחה של העלילה: בשקט, הפנס כבר חוגג
}

/* ---- ציור בעולם: המכשול, בשני המצבים (בתלת-ממד הוא מעל השכבה, כמו כל מה שאינו דמות) ---- */
function curioDraw(){
  for(const s of cuSigns())if(s.ob)cuObstacle(s.ob,s.x,s.y);
}
function cuObstacle(kind,x,y){
  const r=CURIO.ob.r;ctx.save();ctx.strokeStyle=C.ink;ctx.lineWidth=2;
  ctx.fillStyle='rgba(5,7,13,0.35)';ctx.beginPath();ctx.ellipse(x,y+r*0.45,r*1.25,r*0.4,0,0,7);ctx.fill();
  if(kind==='log'){   // עץ שנפל לרוחב הדרך, עם טבעות בקצה וענף
    ctx.fillStyle='#6B4A2B';ctx.beginPath();ctx.roundRect(x-r*1.2,y-r*0.3,r*2.4,r*0.6,r*0.3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#C9A26B';ctx.beginPath();ctx.ellipse(x+r*1.15,y,r*0.2,r*0.3,0,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#8A6A44';ctx.beginPath();ctx.ellipse(x+r*1.15,y,r*0.09,r*0.15,0,0,7);ctx.stroke();
    ctx.strokeStyle='#4A3220';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-r*0.3,y-r*0.25);ctx.lineTo(x-r*0.6,y-r*0.75);ctx.stroke();
    ctx.fillStyle='#2F5E3A';ctx.beginPath();ctx.arc(x-r*0.65,y-r*0.85,r*0.22,0,7);ctx.fill()}
  else if(kind==='rock'){   // סלע גדול עם סדק
    ctx.fillStyle='#5A6075';ctx.beginPath();ctx.moveTo(x-r,y+r*0.4);ctx.lineTo(x-r*0.85,y-r*0.4);ctx.lineTo(x-r*0.2,y-r*0.9);ctx.lineTo(x+r*0.6,y-r*0.7);ctx.lineTo(x+r,y-r*0.1);ctx.lineTo(x+r*0.9,y+r*0.4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#727A90';ctx.beginPath();ctx.moveTo(x-r*0.6,y-r*0.35);ctx.lineTo(x-r*0.2,y-r*0.75);ctx.lineTo(x+r*0.3,y-r*0.6);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#2A2E3A';ctx.beginPath();ctx.moveTo(x+r*0.1,y-r*0.6);ctx.lineTo(x,y-r*0.1);ctx.lineTo(x+r*0.25,y+r*0.3);ctx.stroke()}
  else{   // גשר שבור מעל בור: שני קצוות של קרשים, ובאמצע חושך
    ctx.fillStyle='#0B0D14';ctx.beginPath();ctx.ellipse(x,y,r*1.3,r*0.55,0,0,7);ctx.fill();
    ctx.fillStyle='#7A5230';
    for(const sd of [-1,1])for(let i=0;i<3;i++){const px=x+sd*(r*1.25-i*r*0.28);ctx.save();ctx.translate(px,y);ctx.rotate(sd*(i===2?0.25:0.05));ctx.fillRect(-r*0.11,-r*0.42,r*0.22,r*0.84);ctx.strokeRect(-r*0.11,-r*0.42,r*0.22,r*0.84);ctx.restore()}
    ctx.strokeStyle='#C9A26B';ctx.lineWidth=2;for(const yy of [-r*0.45,r*0.45]){ctx.beginPath();ctx.moveTo(x-r*1.4,y+yy);ctx.lineTo(x-r*0.6,y+yy+4);ctx.moveTo(x+r*1.4,y+yy);ctx.lineTo(x+r*0.6,y+yy+4);ctx.stroke()}}
  ctx.restore();
}

/* ---- מעל הכל: השלט "רמה מומלצת N", עם 🔒 כשהדרך עוד סגורה בעלילה ---- */
function curioScreen(ox,oy){
  const Z=CURIO.sign,lv=heroLv();
  ctx.save();ctx.textAlign='center';ctx.direction=DIR;ctx.font='800 '+Z.font+'px Heebo, system-ui, sans-serif';
  for(const s of cuSigns()){const txt=(s.open?'':'🔒 ')+T('cu.rec',s.lv),x=s.x+ox,y=s.y+oy+Z.dy,tw=ctx.measureText(txt).width+16;
    ctx.fillStyle='#4A3A2A';ctx.fillRect(x-2,y+10,4,22);   // עמוד השלט
    ctx.fillStyle='rgba(30,22,14,0.9)';ctx.strokeStyle=lv>=s.lv?Z.ok:Z.low;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-tw/2,y-11,tw,22,5);ctx.fill();ctx.stroke();
    ctx.fillStyle=lv>=s.lv?Z.ok:Z.low;ctx.fillText(txt,x,y+5)}
  ctx.restore();
}

/* ---- סודות לפי רמה ---- */
// מה נפתח ברמה lv, בשביל מסלול הרמות (lpAt ב-levelpath.js): "משהו חדש באחו", פעם אחת לכל אזור
function cuAt(lv){
  const out=[];
  for(const r in SECRETS.regions)if(SECRETS.regions[r].some(s=>s.lv===lv))out.push({k:'secret',icon:'❓',txt:T('cu.new',T('cu.in.'+r))});
  return out;
}
// יש באזור סוד שכבר נפתח ועוד לא נמצא (הסימן במפת העולם)
const cuNew=r=>(SECRETS.regions[r]||[]).some(s=>s.lv&&scOpen(s)&&!scFound(s.id));
