/* המודלים בתלת-ממד בכמה קבצים (perf/lazy-models, 7.11.2026): js/models3d.js מחזיק רק את מה שצריך בפתיחה (הליבה),
   וכל מודל שנטען לפי צורך (M3D ב-js/m3d.js) יושב בקובץ משלו: js/m3d/<מפתח>.js, שקורא ל-m3dPut('<מפתח>','<base64>').
   ב-models3d.js גם M3D_LAZY: איזה מודלים יש בחוץ ובאיזה גודל, כדי שהמשחק והבדיקה יידעו שהם קיימים.
   build3d.js לא יודע על הפיצול: src() מחזיר את כל המודלים כקובץ אחד כמו פעם, ו-write() מפצל שוב.
   מי בחוץ: LAZY למטה. אויב חדש מ-Quaternius (mon_) או חפץ עם מודל משלו (w_item_) נכנסים לבד */
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),CORE=path.join(ROOT,'js/models3d.js'),DIR=path.join(ROOT,'js/m3d');
// בחוץ: מפלצות הזירה והענקים (mon_ ואנימציות שלהן), חפצים עם מודל משלהם, הדמויות האישיות, וחיות המחמד
const LAZY=k=>/^(mon_|anim_mon_|w_item_)/.test(k)||['pilotHero','nirHero','orelHero','piocho1','piocho2','piocho3','parosh1'].includes(k);
const KEY='const MODELS3D=';
// כל המודלים, כאילו הם עדיין קובץ אחד: <ראש>const MODELS3D={...};
function src(){
  const s=fs.readFileSync(CORE,'utf8'),i=s.indexOf(KEY),j=s.indexOf('\nconst M3D_LAZY=');
  const out=JSON.parse(s.slice(i+KEY.length,j<0?undefined:j).replace(/;\s*$/,''));
  if(fs.existsSync(DIR))for(const f of fs.readdirSync(DIR).sort()){if(!f.endsWith('.js'))continue;
    const m=/^m3dPut\("([^"]+)","([^"]*)"\);\s*$/.exec(fs.readFileSync(path.join(DIR,f),'utf8'));if(m)out[m[1]]=m[2]}
  return s.slice(0,i)+KEY+JSON.stringify(out)+';\n';
}
// מקבל את הטקסט של הקובץ האחד (כמו שכתבו אותו פעם) ומפצל
function write(_f,text){
  const i=text.indexOf(KEY),head=text.slice(0,i),all=JSON.parse(text.slice(i+KEY.length).replace(/;\s*$/,''));
  const core={},lazy={};for(const k in all)(LAZY(k)?lazy:core)[k]=all[k];
  fs.mkdirSync(DIR,{recursive:true});
  for(const f of fs.readdirSync(DIR))if(f.endsWith('.js')&&!(f.slice(0,-3) in lazy))fs.unlinkSync(path.join(DIR,f));   // מודל שנמחק או חזר לליבה
  for(const k in lazy){const p=path.join(DIR,k+'.js'),t='m3dPut('+JSON.stringify(k)+','+JSON.stringify(lazy[k])+');\n';if(!fs.existsSync(p)||fs.readFileSync(p,'utf8')!==t)fs.writeFileSync(p,t)}
  const sizes=Object.fromEntries(Object.keys(lazy).map(k=>[k,lazy[k].length]));
  fs.writeFileSync(CORE,head+KEY+JSON.stringify(core,null,0).replace(/","/g,'",\n"')+';\nconst M3D_LAZY='+JSON.stringify(sizes)+';\n');
}
module.exports={src,write,LAZY};
// node tools/models3d-io.js: מפצל מחדש את מה שיש (למשל אחרי ששינו את LAZY)
if(require.main===module){write(CORE,src());const n=fs.readdirSync(DIR).length;console.log('js/models3d.js',Math.round(fs.statSync(CORE).size/1024)+'KB, js/m3d/:',n,'files')}
