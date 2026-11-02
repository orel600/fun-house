/* משחקי השאול: בדיקת איזון (docs/moba.md, שלב 5). לא חלק מהמשחק ולא מהבדיקה ב-GitHub.
   משחק הרבה משחקים מואצים שבהם כל ששת הגיבורים בוטים, וסופר לכל ערכה כמה פעמים הקבוצה שלה ניצחה.
   ערכה מאוזנת מנצחת בערך 50% מהמשחקים שהיא בהם. גם: כמה זמן משחק, וכמה נגמרו בזמן ולא בבסיס.
   הרצה: node tools/moba-balance.js [משחקים, ברירת מחדל 40]. צריך Playwright (npm run setup) */
const {chromium}=require('playwright');const path=require('path');
const N=+process.argv[2]||40;
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:844,height:390}});
  await p.addInitScript(()=>{try{localStorage.setItem('zm-gfx','2d')}catch(e){}});
  await p.goto('file://'+path.resolve(__dirname,'..','index.html'));await p.waitForTimeout(800);
  const res=[];
  for(let g=0;g<N;g++){
    res.push(await p.evaluate(g=>{
      const kits=Object.keys(MBKIT);if(MB){mbUi(false);S.mb=MB=null}
      mobaStart(kits[g%kits.length]);MB.me.bot={t:0,mode:'push'};
      let n=0;while(!MB.over&&n<MOBA.maxT*30+60){mobaUpdate(1/30);n++}
      const team=t=>mbHeroes(t).map(h=>({kit:h.kit,k:h.kills,d:h.deaths}));
      return{t:MB.t,won:S.won?0:1,base:MB.u.some(u=>u.k==='base'&&u.dead),teams:[team(0),team(1)]}},g));
    process.stdout.write('.');
  }
  await b.close();console.log();
  const st={};for(const r of res)r.teams.forEach((tm,i)=>tm.forEach(h=>{const s=st[h.kit]||(st[h.kit]={n:0,w:0,k:0,d:0});s.n++;s.k+=h.k;s.d+=h.d;if(r.won===i)s.w++}));
  const avg=res.reduce((a,r)=>a+r.t,0)/res.length,base=res.filter(r=>r.base).length;
  console.log(N+' משחקים · ממוצע '+Math.floor(avg/60)+':'+String(Math.round(avg%60)).padStart(2,'0')+' · נגמרו בבסיס: '+base+' ('+Math.round(100*base/N)+'%) · כחולים ניצחו '+res.filter(r=>r.won===0).length);
  const cm={};for(const r of res)r.teams.forEach((tm,i)=>{const k=tm.map(h=>h.kit).sort().join('+'),c=cm[k]||(cm[k]={n:0,w:0});c.n++;if(r.won===i)c.w++});
  console.log('לפי הרכב קבוצה:');for(const k in cm)console.log('  '+k.padEnd(22)+' '+String(Math.round(100*cm[k].w/cm[k].n)).padStart(3)+'%  ('+cm[k].w+'/'+cm[k].n+')');
  for(const k in st){const s=st[k];console.log(k.padEnd(8)+' ניצחונות '+String(Math.round(100*s.w/s.n)).padStart(3)+'%  ('+s.w+'/'+s.n+')  הריגות למשחק '+(s.k/s.n).toFixed(1)+'  נפילות '+(s.d/s.n).toFixed(1))}
})();
