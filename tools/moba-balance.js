/* משחקי השאול: בדיקת איזון (docs/moba.md, שלב 5). לא חלק מהמשחק ולא מהבדיקה ב-GitHub.
   משחק הרבה משחקים מואצים שבהם כל ששת הגיבורים בוטים, וסופר לכל ערכה כמה פעמים הקבוצה שלה ניצחה.
   ערכה מאוזנת מנצחת בערך 50% מהמשחקים שהיא בהם. גם: כמה זמן משחק, וכמה נגמרו בזמן ולא בבסיס.
   הרצה: node tools/moba-balance.js [משחקים, ברירת מחדל 40] [קושי: easy/normal/hard, ברירת מחדל normal]. צריך Playwright (npm run setup) */
const {chromium}=require('playwright');const path=require('path');
const N=+process.argv[2]||40,DIFF=process.argv[3]||'normal';
(async()=>{
  const b=await chromium.launch(process.env.PW_CHANNEL?{channel:process.env.PW_CHANNEL}:{});const p=await b.newPage({viewport:{width:844,height:390}});   // PW_CHANNEL=chrome: ה-Chrome של המחשב, בלי להוריד דפדפן
  await p.addInitScript(d=>{try{localStorage.setItem('zm-gfx','2d');localStorage.setItem('fh-mb-diff',d)}catch(e){}},DIFF);
  await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(800);
  const res=[];
  for(let g=0;g<N;g++){
    res.push(await p.evaluate(g=>{
      const kits=Object.keys(MBKIT);if(MB){mbUi(false);S.mb=MB=null}
      mobaStart(kits[g%kits.length]);MB.me.bot={t:0,mode:'push'};
      const gb={w:0,l:0};if(typeof mbGbDone==='function'&&!mbGbDone.wrap){const f=mbGbDone;mbGbDone=function(u,w){(window.mbGbLog||[]).push(w);return f(u,w)};mbGbDone.wrap=1}window.mbGbLog=[];   // חדר ההימור
      const ult={},hp40={};let n=0;   // מתי כל גיבור הגיע לסקיל-על, וכמה חיים נשארו לכל אחד אחרי 40 שניות (אוראל, 7.11: "הטנק איבד 60% עד 0:40")
      while(!MB.over&&n<MOBA.maxT*30+60){mobaUpdate(1/30);n++;
        for(const h of MB.u)if(h.k==='hero'){if(h.lvl>=MOBA.ultAt&&ult[h.id]===undefined)ult[h.id]=MB.t;if(n===40*30)hp40[h.id]=h.dead?0:h.hp/h.max}}
      for(const w of window.mbGbLog)w?gb.w++:gb.l++;
      const team=t=>mbHeroes(t).map(h=>({kit:h.kit,k:h.kills,d:h.deaths,ult:ult[h.id],hp40:hp40[h.id]}));
      return{gb,t:MB.t,won:MB.draw?-1:S.won?0:1,base:MB.u.some(u=>u.k==='base'&&u.dead),teams:[team(0),team(1)]}},g));
    process.stdout.write('.');
  }
  await b.close();console.log();
  const st={};for(const r of res)r.teams.forEach((tm,i)=>tm.forEach(h=>{const s=st[h.kit]||(st[h.kit]={n:0,w:0,k:0,d:0});s.n++;s.k+=h.k;s.d+=h.d;if(r.won===i)s.w++}));
  const avg=res.reduce((a,r)=>a+r.t,0)/res.length,base=res.filter(r=>r.base).length;
  console.log(N+' משחקים · ממוצע '+Math.floor(avg/60)+':'+String(Math.round(avg%60)).padStart(2,'0')+' · נגמרו בבסיס: '+base+' ('+Math.round(100*base/N)+'%) · כחולים ניצחו '+res.filter(r=>r.won===0).length+' · תיקו '+res.filter(r=>r.won===-1).length);
  {const us=res.flatMap(r=>r.teams.flat().map(h=>h.ult)),got=us.filter(x=>x!==undefined),f=res.map(r=>Math.min(...r.teams.flat().map(h=>h.ult??1e9))).filter(x=>x<1e9);
   const mm=x=>Math.floor(x/60)+':'+String(Math.round(x%60)).padStart(2,'0'),av=a=>a.reduce((s,x)=>s+x,0)/(a.length||1);
   const h40=res.flatMap(r=>r.teams.flat().map(h=>h.hp40)).filter(x=>x!==undefined);
   console.log('סקיל-על: '+Math.round(100*got.length/us.length)+'% מהגיבורים הגיעו · ממוצע '+mm(av(got))+' · הראשון במשחק בממוצע '+mm(av(f))+' · חיים אחרי 0:40 בממוצע '+Math.round(100*av(h40))+'%')}
  const cm={};for(const r of res)r.teams.forEach((tm,i)=>{const k=tm.map(h=>h.kit).sort().join('+'),c=cm[k]||(cm[k]={n:0,w:0});c.n++;if(r.won===i)c.w++});
  {const w=res.reduce((a,r)=>a+(r.gb?r.gb.w:0),0),l=res.reduce((a,r)=>a+(r.gb?r.gb.l:0),0),g=res.filter(r=>r.gb&&r.gb.w+r.gb.l).length;
   console.log('חדר ההימור: '+(w+l)+' כניסות ב-'+g+' משחקים · ניצחונות '+w+' · הפסדים '+l)}
  console.log('לפי הרכב קבוצה:');for(const k in cm)console.log('  '+k.padEnd(22)+' '+String(Math.round(100*cm[k].w/cm[k].n)).padStart(3)+'%  ('+cm[k].w+'/'+cm[k].n+')');
  for(const k in st){const s=st[k];console.log(k.padEnd(8)+' ניצחונות '+String(Math.round(100*s.w/s.n)).padStart(3)+'%  ('+s.w+'/'+s.n+')  הריגות למשחק '+(s.k/s.n).toFixed(1)+'  נפילות '+(s.d/s.n).toFixed(1))}
})();
