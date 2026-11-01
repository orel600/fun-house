/* הפינות העליונות בכפר ובעולם (docs/plan-hud.md, פרקים 4 ו-8, משימות 4, 5 ו-8, ניר 1.11.2026: כיוון B, ומפה קטנה עכשיו):
   - בתחילת השורה (שמאל באנגלית): "מי אני". עיגול עם הרמה, פס חיים דק ופס XP דק מתחתיו (#who). מתחת לזה שורת המטרה (guide.js) בשתי שורות.
   - בסוף השורה (ימין באנגלית): ☰, לידו עד 2 משאבים ו-"+N" לשאר התרמיל (cornerRes), ובעולם מתחתיו מפה קטנה עגולה (#miniMap).
     נגיעה במפה פותחת את מפת העולם הגדולה (worldmap.js). בכפר אין מפה קטנה: הכפר כולו נכנס במסך.
   הזירה של אוראל לא משתנה: #who ו-#miniMap מוצגים רק ב-body.vil ו-body.world, ו-#hp של הזירה נשאר כמו שהוא.
   החיבורים: cornerHud() מ-worldHud ו-villageHud כל פריים, ו-cornerRes() במקום topLine בפס העליון */

const MINIMAP={
  every:0.1,          // כל כמה שניות המפה הקטנה מצוירת מחדש
  range:620,          // כמה יחידות משחק מהמרכז עד הקצה של העיגול
  dot:{me:6,gate:5,lantern:5,goal:5},   // גדלים בפיקסלים על המפה
  road:'#E8D3A099',   // הדרכים: מהבית לכל שער
  out:'#0B0E18',      // מחוץ לגבולות האזור
  res:2               // כמה משאבים בפס העליון. השאר ב-"+N"
};
const MM={t:0,last:null,recent:null,key:''};

/* ---- "מי אני": רמה, חיים ו-XP ---- */
function cornerHud(){
  const on=!!(S&&(S.vil||S.wd)),who=$('who'),mm=$('miniMap');
  if(who.hidden===on)who.hidden=!on;
  const mOn=on&&!!S.wd;if(mm.hidden===mOn)mm.hidden=!mOn;
  if(!on||!P)return;
  const lv=rankLevelOf(SAVE.hero.xp||0),x=heroXpNow(),hp=Math.max(0,Math.min(1,P.hp/P.maxHp)),xp=Math.min(1,x.have/x.need);
  const key=lv+'|'+Math.round(hp*100)+'|'+Math.round(xp*100)+'|'+LANG;
  if(key!==MM.key){MM.key=key;$('whoLv').textContent=lv;$('whoHp').style.width=(hp*100)+'%';$('whoXp').style.width=(xp*100)+'%';
    who.setAttribute('aria-label',T('rank.level',lv)+' · '+Math.ceil(Math.max(0,P.hp))+'/'+P.maxHp)}
  if(mOn&&S.mode==='play'&&(MM.t-=1/60)<=0){MM.t=MINIMAP.every;mmDraw()}
}

/* ---- עד 2 משאבים: מטבעות, ועוד אחד: מה שהשתנה עכשיו, מה שהקווסט צריך, או הראשון שרלוונטי למקום. השאר ב-"+N" ---- */
function cornerRes(list){
  const bag=SAVE.bag,all=Object.keys(RES.list).filter(r=>bag[r]>0);
  if(MM.last)for(const r of all)if(r!=='coins'&&bag[r]>(MM.last[r]||0))MM.recent=r;   // משאב שנוסף לתרמיל
  MM.last=Object.assign({},bag);
  const q=typeof qTracked==='function'&&qTracked(),need=q&&q.obj.map(o=>o.what).find(r=>RES.list[r]&&bag[r]>0);
  const other=[MM.recent,need,...(list||all)].find(r=>r&&r!=='coins'&&bag[r]>0);
  const pick=['coins',other].filter(r=>r&&(bag[r]>0||RES.always.includes(r))).slice(0,MINIMAP.res);
  const more=all.filter(r=>!pick.includes(r)).length;
  return pick.map(r=>resChip(r,shortN(bag[r]||0))).join('')+(more?'<button class="resmore" aria-label="'+T('ui.more')+'">+'+more+'</button>':'');
}

/* ---- המפה הקטנה: האזור סביבך, הדרכים, השערים, הפנס, המטרה ואתה במרכז ---- */
function mmDraw(){
  const c=$('mmC'),dpr=Math.min(2,devicePixelRatio||1),s=c.clientWidth||64;
  if(c.width!==Math.round(s*dpr)){c.width=c.height=Math.round(s*dpr)}
  const x=c.getContext('2d'),R=WR(),r=s/2,k=r/MINIMAP.range,at=(px,py)=>({x:r+(px-P.x)*k,y:r+(py-P.y)*k}),D=MINIMAP.dot;
  x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,s,s);
  x.save();x.beginPath();x.arc(r,r,r,0,Math.PI*2);x.clip();
  x.fillStyle=MINIMAP.out;x.fillRect(0,0,s,s);
  const sz=R.size,tl=at(-sz.w/2,-sz.h/2);x.fillStyle=R.ground;x.fillRect(tl.x,tl.y,sz.w*k,sz.h*k);
  const pc=R.pondCol||['#1F4A66','#46D3E6'];
  for(const p of R.ponds||[]){const o=at(p.x,p.y);x.beginPath();x.arc(o.x,o.y,p.r*k,0,Math.PI*2);x.fillStyle=pc[0];x.fill()}
  // הדרכים: מהבית לכל שער ולכל דרך לאזור אחר
  const gs=wGates(),h=at(R.home.x,R.home.y);x.strokeStyle=MINIMAP.road;x.lineWidth=2.5;x.lineCap='round';
  for(const id in gs)if(id!=='home'){const g=at(gs[id].x,gs[id].y);x.beginPath();x.moveTo(h.x,h.y);x.lineTo(g.x,g.y);x.stroke()}
  // נקודה בתוך העיגול, או על הקצה כשהיא רחוקה
  const pin=(o,rad,col,ring)=>{const dx=o.x-r,dy=o.y-r,d=Math.hypot(dx,dy),m=r-rad-2;if(d>m){o={x:r+dx/d*m,y:r+dy/d*m}}
    x.beginPath();x.arc(o.x,o.y,rad,0,Math.PI*2);x.fillStyle=col;x.fill();x.lineWidth=1.5;x.strokeStyle=ring||'#000a';x.stroke()};
  for(const id in gs)pin(at(gs[id].x,gs[id].y),D.gate,wGateCol(id));
  const ln=typeof wmLantern==='function'&&wmLantern(S.wd.reg);if(ln)pin(at(ln.L.x,ln.L.y),D.lantern,ln.lit?ln.L.glow:'#2A2F3E',ln.lit?'#fff':ln.L.glow);
  const t=typeof guideTarget==='function'&&guideG&&guideTarget(guideG);if(t)pin(at(t.x,t.y),D.goal,GUIDE.col,'#fff');
  // אתה: חץ זהוב במרכז, לכיוון ההליכה
  const a=P.face||0,m=D.me;x.beginPath();x.moveTo(r+Math.cos(a)*m*1.7,r+Math.sin(a)*m*1.7);x.lineTo(r+Math.cos(a+2.4)*m,r+Math.sin(a+2.4)*m);
  x.lineTo(r+Math.cos(a-2.4)*m,r+Math.sin(a-2.4)*m);x.closePath();x.fillStyle=C.gold;x.fill();x.lineWidth=1.5;x.strokeStyle='#000';x.stroke();
  x.restore();
}
$('miniMap').addEventListener('click',()=>{if(S&&S.wd&&S.mode==='play'){wmapOpen(true);sfx('ui')}});
