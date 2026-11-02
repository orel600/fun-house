/* בדיקת ציוד לפי נדירות (ניר, 1.11.2026: "נעליים נדירות גרועות מרגילות").
   מדפיס כל פריט: משבצת, נדירות, סטטים וציון (gScore ב-gear.js), ואת כל המקרים שבהם פריט נדיר יותר חלש מדי מול השכבה שמתחתיו (GEAR.ladder).
   מריצים: node tools/gear-audit.js. בלי דפדפן: טוען רק את gear.js עם כמה תחליפים. יוצא עם קוד 1 כשיש הפרה */
const fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={$:()=>({addEventListener(){}}),addEventListener(){},C:{gold:'#F4C74F'},ageMult:()=>1,powGive:()=>({}),console};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/gear.js'),'utf8'),ctx);
const out=vm.runInContext(`(()=>{
  const rar=['רגיל','לא שכיח','נדיר','אפי','אגדי'],rows=[];
  for(const id in GEAR.items){const it=GEAR.items[id];
    rows.push({id,slot:it.slot,tier:it.tier,rar:rar[it.tier],stats:it.slot==='orbit'?it.type:Object.entries(it.stats||{}).map(([k,v])=>k+' '+v).join(', '),score:Math.round((gScore(id)-it.tier*0.01)*10)/10})}
  rows.sort((a,b)=>a.slot.localeCompare(b.slot)||a.tier-b.tier||a.score-b.score);
  return {rows,bad:gLadder(),k:GEAR.ladder}})()`,ctx);
const pad=(s,n)=>String(s).padEnd(n);
console.log(pad('פריט',14)+pad('משבצת',8)+pad('נדירות',10)+pad('ציון',7)+'סטטים');
for(const r of out.rows)console.log(pad(r.id,14)+pad(r.slot,8)+pad(r.rar,10)+pad(r.score,7)+r.stats);
console.log('\nחוק: כל שכבה לפחות פי '+out.k+' מהפריט הכי חזק בשכבה שמתחת, באותה משבצת (בלי חפצים מסתובבים)');
if(!out.bad.length)console.log('✓ אין הפרות');
for(const b of out.bad)console.log('✗ '+b.slot+': '+b.weak+' חלש מדי מול '+b.top+' (פי '+b.k+')');
process.exitCode=out.bad.length?1:0;
