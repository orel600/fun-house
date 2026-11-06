// אייקון לחלון הציוד מהמודל עצמו, כדי שהאייקון תמיד יתאים למודל: node tools/blender/icon.js <id> [מאיפה מצלמים] [איזה כיוון למעלה]
// לדוגמה: node tools/blender/icon.js skyBow 0,1,0.25 1,0,-1 . הכיוונים בצירי המשחק (glTF: y למעלה). יוצא: icons/ui/gear/<id>.png
// [זווית]: מצלמה עם פרספקטיבה (מעלות), כדי שהקצה הקרוב ייראה גדול. לפריט ארוך ודק כמו מטה: node tools/blender/icon.js starStaff 0.35,0.75,0.55 1,1,0 40
// כמו האייקונים המצוירים: רקע שקוף, באלכסון, קו מתאר כהה, ולכל היותר 128 פיקסלים בצד הארוך. משתמש ב-sharp (החבילות של tools/build3d.js, עם NODE_PATH)
const fs=require('fs'),path=require('path'),{chromium}=require('playwright'),sharp=require('sharp');
const [id,from='0,0,1',up='1,1,0',fov='0']=process.argv.slice(2),ROOT=path.resolve(__dirname,'../..'),BIG=512,OUT=128,LINE=9;
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:BIG,height:BIG}});
  await p.addInitScript(J=>{window.ICON=J},{glb:fs.readFileSync(path.join(ROOT,'art/weapons/raw',id+'.glb')).toString('base64'),size:BIG,from:from.split(',').map(Number),up:up.split(',').map(Number),fov:Number(fov)});
  await p.goto('file://'+path.join(__dirname,'icon.html'));await p.waitForFunction(()=>document.title!=='icon',null,{timeout:60000});
  if((await p.title())!=='ready')throw new Error(await p.title());
  const png=await p.locator('canvas').screenshot({omitBackground:true});await b.close();
  // קו מתאר: האלפא מורחב (טשטוש וסף), בצבע כהה, מתחת לרנדר
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const a=Buffer.alloc(info.width*info.height);for(let i=0;i<a.length;i++)a[i]=data[i*4+3];
  const blur=await sharp(a,{raw:{width:info.width,height:info.height,channels:1}}).blur(LINE/2).extractChannel(0).raw().toBuffer();
  const line=Buffer.alloc(a.length*4);for(let i=0;i<a.length;i++){line[i*4]=26;line[i*4+1]=22;line[i*4+2]=48;line[i*4+3]=blur[i]>8?255:Math.min(255,blur[i]*30)}
  const out=await sharp(line,{raw:{width:info.width,height:info.height,channels:4}}).composite([{input:png}]).png().toBuffer();
  const f=path.join(ROOT,'icons/ui/gear',id+'.png');
  await sharp(out).trim({threshold:1}).resize(OUT,OUT,{fit:'inside'}).png({compressionLevel:9}).toFile(f);
  const m=await sharp(f).metadata();console.log(f,m.width+'x'+m.height)})();
