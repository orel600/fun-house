#!/usr/bin/env node
/* בדיקת שלמות של ספריית האפקטים (W7, אוראל 8.11.2026). שימוש: node tools/fx-audit.js  (או npm run fx:audit)
   מה נבדק:
   (א) הפניות שבורות: מזהה אפקט שכתוב בקוד (js/*.js) ולא קיים ב-FXDATA (js/fx-data.js) או כקובץ fx/<id>.webp.
       מזהה בקוד = מחרוזת קבועה בצורת prefix_word (למשל 'hit_fire'), כשה-prefix הוא קידומת שקיימת בספרייה (hit_, sk_, st_...),
       או מחרוזת קבועה שזהה למזהה בספרייה. ככה נתפסות גם הטבלאות (ARFX.hitFx, FXC.tg) ולא רק הקריאות הישירות ל-fxPlay.
   (ב) סנכרון: FXDATA, הקבצים ב-fx/ ו-tools/fx-list.json חייבים להכיל בדיוק את אותם מזהים.
   (ג) גיליונות שאף אחד לא משתמש בהם: לדיווח בלבד, לא מוחקים. מזהה שנבנה בקוד מקידומת ('sk_'+id, `wx_${v}_${t}`) נספר כ"אולי דינמי".
   יציאה עם קוד 1 כשיש הפניה שבורה או חוסר סנכרון, אחרת 0. גיליונות לא בשימוש לא מכשילים. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');

// הספרייה: FXDATA, הקבצים, והרשימה
const ctx={};vm.createContext(ctx);vm.runInContext(read('js/fx-data.js')+';this.FXDATA=FXDATA',ctx);
const data=Object.keys(ctx.FXDATA).sort();
const files=fs.readdirSync(path.join(ROOT,'fx')).filter(f=>f.endsWith('.webp')).map(f=>f.slice(0,-5)).sort();
const list=Object.keys(JSON.parse(read('tools/fx-list.json'))).filter(k=>!k.startsWith('_')).sort();
const has=new Set(data);
// קידומות בספרייה: החלק שלפני ה-_ הראשון (hit, sk, st, wcirc...). מזהה בלי _ (ko, haze) הוא קידומת של עצמו
const prefixes=new Set(data.map(k=>k.split('_')[0]));

// הקוד: כל קבצי המשחק, בלי הספרייה עצמה ובלי ספריות צד שלישי
const jsFiles=fs.readdirSync(path.join(ROOT,'js')).filter(f=>f.endsWith('.js')&&!['fx-data.js','gicons-data.js','sounds-data.js','models3d.js'].includes(f)).sort();
const used={},suspects=[],dynamic={};
const idRe=/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
for(const f of jsFiles){
  const src=read('js/'+f),lines=src.split('\n');
  lines.forEach((line,i)=>{
    const where=f+':'+(i+1);
    // מחרוזות קבועות: 'x', "x", `x` בלי ${}
    for(const m of line.matchAll(/(['"`])([a-z][a-z0-9_]*)\1/g)){const id=m[2];
      if(has.has(id)){(used[id]=used[id]||[]).push(where);continue}
      if(idRe.test(id)&&prefixes.has(id.split('_')[0]))suspects.push({id,where,line:line.trim().slice(0,120)})}
    // מזהה שנבנה בקוד: 'sk_'+x, "hit_"+t, `wx_${v}`, 'tr_spin_'+c. הקידומת נרשמת, ומה שמתחיל בה "אולי בשימוש"
    for(const m of line.matchAll(/(['"])([a-z][a-z0-9]*(?:_[a-z0-9]+)*_)\1\s*\+|`([a-z][a-z0-9]*(?:_[a-z0-9]+)*_)\$\{/g)){const p=m[2]||m[3];
      if(prefixes.has(p.split('_')[0]))(dynamic[p]=dynamic[p]||[]).push(where)}
  });
}

// חשוד הוא שבור רק אם הוא לא חלק של מזהה שנבנה בקוד: 'rain_light' הוא variant של wx_<variant>_<theme> (weather.js), ולכן wx_rain_light_* קיים.
// וגם לא מחרוזת מתחום אחר: 'dmg_sword' הוא סטטיסטיקה של גיבור (heroes.js), בקובץ שלא נוגע בספרייה בכלל
const fxFile=f=>/fxPlay|fxUi|fxDom|fxPreload|FXLIB|FXDATA/.test(read('js/'+f));
const partOf=id=>Object.keys(dynamic).some(p=>data.some(k=>k===p+id||k.startsWith(p+id+'_')));
const broken=suspects.filter(b=>!partOf(b.id)&&fxFile(b.where.split(':')[0]));
const skipped=suspects.length-broken.length;

// דוח
const out=[];const say=s=>out.push(s);
say('בדיקת ספריית האפקטים: '+data.length+' גיליונות ב-FXDATA, '+files.length+' קבצים ב-fx/, '+list.length+' ברשימה, '+jsFiles.length+' קבצי קוד נסרקו');
let bad=0;
const diff=(a,b,what)=>{const d=a.filter(x=>!b.includes(x));if(d.length){bad++;say('✗ '+what+': '+d.join(', '))}};
diff(data,files,'ב-FXDATA ואין קובץ ב-fx/');diff(files,data,'קובץ ב-fx/ שאין לו שורה ב-FXDATA');
diff(data,list,'ב-FXDATA ולא ב-tools/fx-list.json');diff(list,data,'ב-tools/fx-list.json ולא ב-FXDATA (לא הומר)');
if(!bad)say('✓ FXDATA, fx/ ו-fx-list.json מסונכרנים');

if(broken.length){bad++;say('✗ הפניות שבורות בקוד ('+broken.length+'): מזהה שלא קיים בספרייה');
  for(const b of broken)say('   '+b.id+'  @ '+b.where+'    '+b.line)}
else say('✓ אין הפניות שבורות: כל מזהה אפקט שכתוב בקוד קיים בספרייה'+(skipped?' ('+skipped+' מחרוזות דומות הן חלק ממזהה שנבנה בקוד, או בקובץ שלא נוגע בספרייה)':''));

const unused=data.filter(k=>!used[k]);
const maybe=unused.filter(k=>Object.keys(dynamic).some(p=>k.startsWith(p)));
const never=unused.filter(k=>!maybe.includes(k));
say('');
say('גיליונות בשימוש ישיר: '+(data.length-unused.length)+' מתוך '+data.length);
say('קידומות שנבנות בקוד ('+Object.keys(dynamic).length+'): '+Object.keys(dynamic).sort().map(p=>p+'* ('+dynamic[p][0]+(dynamic[p].length>1?' +'+(dynamic[p].length-1):'')+')').join(', '));
say('אולי בשימוש דרך קידומת ('+maybe.length+'): '+(maybe.join(', ')||'-'));
say('בלי שום הפניה בקוד ('+never.length+', לדיווח בלבד, לא מוחקים): '+(never.join(', ')||'-'));
console.log(out.join('\n'));
process.exit(bad?1:0);
