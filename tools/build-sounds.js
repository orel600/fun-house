/* בונה את js/sounds-data.js: כל קבצי ה-mp3 שב-sounds/ כטקסט (base64) בתוך קובץ JS.
   למה: הצלילים מתנגנים דרך Web Audio (audio.js), שצריך את הקובץ עצמו בזיכרון. fetch לא עובד מ-file://, וקובץ JS כן.
   מריצים אחרי שמוסיפים או מחליפים צליל: node tools/build-sounds.js */
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','sounds'),out=path.join(__dirname,'..','js','sounds-data.js');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.mp3')).sort();
const body=files.map(f=>"  '"+f+"':'"+fs.readFileSync(path.join(dir,f)).toString('base64')+"'").join(',\n');
fs.writeFileSync(out,'/* נוצר על ידי tools/build-sounds.js מהקבצים ב-sounds/. לא עורכים ביד */\nconst SOUND_DATA={\n'+body+'\n};\n');
console.log(files.length+' צלילים, '+Math.round(fs.statSync(out).size/1024)+'KB → '+path.relative(process.cwd(),out));
