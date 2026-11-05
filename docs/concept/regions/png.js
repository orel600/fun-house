// PNG מכל SVG בתיקייה, בדפדפן (כדי שהעברית תצא נכון). מריצים: node docs/concept/regions/png.js
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch(),p=await b.newPage();
  for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.svg'))){
    const s=fs.readFileSync(path.join(__dirname,f),'utf8'),h=+s.match(/height="(\d+)"/)[1];
    await p.setViewportSize({width:1000,height:h});
    await p.setContent('<html><body style="margin:0">'+s+'</body></html>');
    await p.screenshot({path:path.join(__dirname,f.replace('.svg','.png'))});
  }
  await b.close();})();
