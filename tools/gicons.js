#!/usr/bin/env node
/* בונה את js/gicons-data.js ואת docs/credits.md מהאייקונים שנבחרו ב-js/gicons.js (GICO.sk, GICO.tree וכל רשימה אחרת שם).
   שימוש: git clone --depth 1 https://github.com/game-icons/icons.git <תיקייה מחוץ לריפו>
          node tools/gicons.js <התיקייה>
   הריפו של game-icons לא נכנס לריפו שלנו: רק הצורות שבשימוש, כטקסט (המשחק רץ מ-file://, בלי טעינת קבצים) */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),SRC=process.argv[2];
if(!SRC||!fs.existsSync(path.join(SRC,'license.txt'))){console.error('צריך את התיקייה של הריפו game-icons/icons');process.exit(1)}

// הבחירות מתוך js/gicons.js (רק הנתונים, בלי הדפדפן)
const ctx={document:{querySelectorAll:()=>[]}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/gicons.js'),'utf8')+';this.GICO=GICO',ctx);
const names=new Set();
for(const k in ctx.GICO){const v=ctx.GICO[k];if(v&&typeof v==='object')for(const x of Object.values(v))if(typeof x==='string'&&x.includes('/'))names.add(x)}

// היוצרים: מ-license.txt ("- Lorc, http://..." / "- Zeromancer - CC0")
const authors={};
for(const l of fs.readFileSync(path.join(SRC,'license.txt'),'utf8').split('\n')){const m=l.match(/^- ([^,]+?)(?:, (\S+))?(?: - (CC0))?\s*$/);
  if(m)authors[m[1].toLowerCase().replace(/[^a-z0-9]/g,'')]={name:m[1],url:m[2]||'',cc0:!!m[3]}}
const who=dir=>authors[dir.replace(/[^a-z0-9]/g,'')]||{name:dir,url:'',cc0:false};

const data={},used={};
for(const n of [...names].sort()){const [dir,file]=n.split('/'),f=path.join(SRC,dir,file+'.svg');
  if(!fs.existsSync(f)){console.error('חסר: '+n);process.exit(1)}
  const svg=fs.readFileSync(f,'utf8').replace(/<path d="M0 0h512v512H0z"\/>/,'');
  const d=[...svg.matchAll(/<path[^>]* d="([^"]+)"/g)].map(m=>m[1]).join('');
  if(data[file]&&data[file]!==d){console.error('שני אייקונים באותו שם: '+file);process.exit(1)}
  data[file]=d;(used[dir]=used[dir]||[]).push(file)}

fs.writeFileSync(path.join(ROOT,'js/gicons-data.js'),
  '/* נוצר אוטומטית ב-tools/gicons.js, לא עורכים ביד. הצורות מ-game-icons.net (CC BY 3.0), היוצרים ב-docs/credits.md */\n'+
  'const GICON='+JSON.stringify(data)+';\n');

let md='# קרדיטים\n\nנוצר אוטומטית ב-`tools/gicons.js`, לא עורכים ביד.\n\n## אייקונים: game-icons.net\n\n'+
  'Icons by '+Object.keys(used).map(d=>who(d).name).join(', ')+' from [game-icons.net](https://game-icons.net), licensed under '+
  '[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Colors and frames were changed.\n\n'+
  'אייקונים מ-game-icons.net, ברישיון CC BY 3.0. הצבעים והמסגרות שונו.\n\n';
for(const d of Object.keys(used).sort()){const a=who(d);
  md+='### '+a.name+(a.url?' ('+a.url+')':'')+(a.cc0?' - CC0':' - CC BY 3.0')+'\n\n'+used[d].sort().map(x=>'- '+x).join('\n')+'\n\n'}
fs.writeFileSync(path.join(ROOT,'docs/credits.md'),md);
console.log(names.size+' אייקונים, '+Math.round(fs.statSync(path.join(ROOT,'js/gicons-data.js')).size/1024)+'KB');
