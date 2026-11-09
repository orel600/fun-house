/* בדיקת המראה של הנשקים (ניר, 9.11.2026, אחרי משוב מבודק: "הקשת ורודה ביד אבל כחולה-לבנה בתמונה", "בחלון הציוד הנשק נחתך").
   לא חלק מהמשחק ולא מהבדיקה הרגילה. לא משנה שום דבר במשחק: רק מודד.
   לכל נשק ב-GEAR.items (slot 'weapon'), בתלת-ממד, בטלפון שוכב (1280×590, deviceScaleFactor 1):
   (א) צבע: הגוון השולט בתמונה (icons/ui/gear/<id>.png, GEAR_PIC) מול הגוון של הנשק ביד, בבובה של חלון הציוד (doll3d.js) ובעולם.
       איך מוצאים את הנשק בציור: מציירים את הסצנה פעם עם הנשק ופעם בלעדיו, וההפרש הוא הנשק. כך רק הפיקסלים של הנשק נמדדים.
       בפריט עם מודל משלו (w_item_<id>, נטען בעצלתיים ב-m3d.js) נמדד גם הרגע שלפני שהמודל נטען: אז מוצג look.model עם זוהר הדרגה.
   (ב) מסגור: בחלון הציוד, בכמה זוויות של הנדנוד, האם הנשק נחתך בקצה הקנבס של הבובה, או מוסתר מתחת לחלק אחר של החלון.
   הרצה:  node tools/weapon-audit.js            (כ-15 דקות, התלת-ממד רץ על המעבד)
   פלט:   docs/weapon-audit/audit.json, docs/weapon-audit/sheet.png (תמונה מול הנשק ביד), ושורות במסוף.
   הדוח הכתוב (docs/weapon-audit-2026-11-09.md) נכתב ביד מתוך audit.json. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const OUT=path.resolve(__dirname,'..','docs','weapon-audit');
const VIEW={width:1280,height:590};
const HUE_TOL=45;   // מעלות: מעבר לזה הגוונים שונים
const DARK=0.55;     // הנשק ביד כהה מפי זה מהתמונה: לא תואם (הבובה מוארת כהה יותר מהתמונה, בממוצע פי 0.75)
const WORLD_MIN=40;  // פחות פיקסלים של הנשק בעולם: לא שופטים

/* ---- רץ בדף: ניתוח צבע של רשימת פיקסלים [r,g,b,...]. מתעלמים מקווי מתאר כהים (v<0.15) ---- */
function colorStats(px){
  const H=new Float64Array(24);let n=0,ch=0,sr=0,sg=0,sb=0,sv=0;
  for(let i=0;i<px.length;i+=3){const r=px[i]/255,g=px[i+1]/255,b=px[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),v=mx,s=mx?(mx-mn)/mx:0;
    if(v<0.15)continue;n++;sr+=px[i];sg+=px[i+1];sb+=px[i+2];sv+=v;
    if(s<0.25||v<0.2)continue;ch++;
    let h=mx===mn?0:mx===r?((g-b)/(mx-mn))%6:mx===g?(b-r)/(mx-mn)+2:(r-g)/(mx-mn)+4;h=(h*60+360)%360;H[Math.floor(h/15)%24]+=s*v}
  if(!n)return null;
  const mean=[sr/n,sg/n,sb/n].map(Math.round),hex='#'+mean.map(x=>x.toString(16).padStart(2,'0')).join(''),v=sv/n,chroma=ch/n;
  let pk=0;for(let i=1;i<24;i++)if(H[i]>H[pk])pk=i;
  let x=0,y=0;for(let d=-2;d<=2;d++){const j=(pk+d+24)%24,a=(j*15+7.5)*Math.PI/180;x+=Math.cos(a)*H[j];y+=Math.sin(a)*H[j]}
  const hue=Math.round((Math.atan2(y,x)*180/Math.PI+360)%360);
  // הצבע הממוצע (אחרי הסרת קווי מתאר): גוון ורוויה. כך ברק לבן קטן לא קובע, וכסף עם נגיעה כחלחלה נשאר כסף
  const [R,G,B]=mean.map(x=>x/255),MX=Math.max(R,G,B),MN=Math.min(R,G,B),ms=MX?(MX-MN)/MX:0;
  let mh=MX===MN?0:MX===R?((G-B)/(MX-MN))%6:MX===G?(B-R)/(MX-MN)+2:(R-G)/(MX-MN)+4;mh=Math.round((mh*60+360)%360);
  const neutral=ms<0.18,tinted=ms<0.3;
  const name=neutral?(v>0.75?'white':v>0.45?'silver':'dark grey')
    :(tinted?'greyish ':'')+(mh<15||mh>=335?'red':mh<40?(MX<0.55?'brown':'orange'):mh<65?(MX<0.5?'brown':'gold'):mh<165?'green':mh<200?'teal':mh<250?'blue':mh<290?'purple':'pink');
  return {n,hex,hue:mh,peak:hue,sat:+ms.toFixed(2),v:+v.toFixed(2),chroma:+chroma.toFixed(2),neutral,tinted,name};
}
// שני צבעים אותו דבר? שניהם בגוון: הפרש גוון עד HUE_TOL. אחד אפור והשני צבעוני: לא. שניהם אפורים: לבן מול כהה לא
function sameColor(a,b,tol){
  if(!a||!b)return null;
  if(a.neutral&&b.neutral)return Math.abs(a.v-b.v)<0.4;
  if(a.neutral!==b.neutral)return (a.neutral?b:a).tinted;   // אפור מול אפרפר-צבעוני: עדיין אותו דבר
  const d=Math.abs(a.hue-b.hue)%360;return Math.min(d,360-d)<=tol;
}

/* ---- רץ בדף: מציירים פעמיים (עם הנשק ובלעדיו) ומחזירים את הפיקסלים של הנשק ---- */
function pageHelpers(){
  window.__wa={
    grab(cvs){const c=document.createElement('canvas');c.width=cvs.width;c.height=cvs.height;const x=c.getContext('2d');x.drawImage(cvs,0,0);return {c,d:x.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height}},
    // render(on): מצייר עם הנשק (on=true) או בלעדיו. מחזיר מסכה, bbox, פיקסלים ותמונה חתוכה
    diff(cvs,render,props){
      for(const p of props)p.visible=true;render();const A=this.grab(cvs);
      for(const p of props)p.visible=false;render();const B=this.grab(cvs);
      for(const p of props)p.visible=true;render();
      const px=[],pts=[];let x0=1e9,y0=1e9,x1=-1,y1=-1,edge=0;
      for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){const i=(y*A.w+x)*4,d=Math.abs(A.d[i]-B.d[i])+Math.abs(A.d[i+1]-B.d[i+1])+Math.abs(A.d[i+2]-B.d[i+2])+Math.abs(A.d[i+3]-B.d[i+3]);
        if(d<40||A.d[i+3]<200)continue;px.push(A.d[i],A.d[i+1],A.d[i+2]);pts.push(x,y);
        if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;if(x<=1||y<=1||x>=A.w-2||y>=A.h-2)edge++}
      if(x1<0)return {px:[],pts:[],bb:null,edge:0,w:A.w,h:A.h,img:null};
      const pad=Math.round(Math.max(x1-x0,y1-y0)*0.15)+4,cx0=Math.max(0,x0-pad),cy0=Math.max(0,y0-pad),cw=Math.min(A.w,x1+pad)-cx0,chh=Math.min(A.h,y1+pad)-cy0;
      const o=document.createElement('canvas');o.width=cw;o.height=chh;o.getContext('2d').drawImage(A.c,cx0,cy0,cw,chh,0,0,cw,chh);
      return {px,pts,bb:[x0,y0,x1,y1],edge,w:A.w,h:A.h,img:o.toDataURL('image/png')};
    },
    pic(src){return new Promise(res=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
      const d=x.getImageData(0,0,c.width,c.height).data,px=[];for(let i=0;i<d.length;i+=4)if(d[i+3]>160)px.push(d[i],d[i+1],d[i+2]);res({px,img:c.toDataURL('image/png')})};
      im.onerror=()=>res(null);im.src=src})}   // data URL מ-Node: תמונה מ-file:// נועלת את הקנבס (getImageData נכשל)
  };
}

(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:VIEW,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  await page.addInitScript(()=>{let a=7;Math.random=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
    try{localStorage.setItem('zm-gfx','3d');localStorage.setItem('zm-lang','en')}catch(e){}});
  await page.addInitScript(pageHelpers);
  await page.addInitScript(`window.__colorStats=${colorStats.toString()}`);
  console.log('goto');await page.goto('file://'+path.resolve(__dirname,'..','index.html'));
  await page.waitForFunction(()=>typeof SAVE!=='undefined'&&document.getElementById('startBtn'),null,{timeout:60000});
  await page.evaluate(()=>{SAVE.hero.start='warrior';SAVE.gift=true;SAVE.story=SAVE.story||{};SAVE.story.intro=true;SAVE.met={fisher:1,cutter:1,herbal:1};saveNow()});
  await page.evaluate(()=>document.getElementById('startBtn').click());
  console.log('start');await page.waitForFunction(()=>R3D.ready&&S.mode==='play',null,{timeout:90000});
  await page.waitForTimeout(1500);
  await page.evaluate(()=>{R3D.drawEvery=60});   // כמו בבדיקה האוטומטית: העולם מצויר מעט, כדי שהבובה תימדד מהר (ובלי מעבר אוטומטי לדו-ממד)
  const closeAll=()=>page.evaluate(()=>{if(typeof welcomeClose==='function'&&!document.getElementById('ovWelcome').hidden)welcomeClose();
    for(const s of ['#dailyWin [data-act="close"]','#npcDlg [data-act="close"]','#qLog [data-act="close"]']){const b=document.querySelector(s);if(b&&b.offsetParent)b.click()}});
  await closeAll();await page.waitForTimeout(300);await closeAll();

  const ids=await page.evaluate(()=>Object.keys(GEAR.items).filter(k=>GEAR.items[k].slot==='weapon'));
  console.log('נשקים:',ids.length);
  // מלביש רק את הנשק (בלי סט, בלי מגן, בלי זוהר של פריט אחר), עם המחלקה שהנשק שלה
  const wear=id=>page.evaluate(id=>{const t=wTypeOf(id),cls=Object.keys(HEROES.list).find(k=>HEROES.list[k].arms.includes(t))||'warrior';
    SAVE.hero.start=cls;for(const s in SAVE.gear){const v=SAVE.gear[s];SAVE.gear[s]=Array.isArray(v)?v.map(()=>null):null}
    SAVE.gear.weapon=id;wEquip(id);return cls},id);
  const own=id=>page.evaluate(id=>({lazy:m3dLazy('w_item_'+id),ready:!!R3D.props['w_item_'+id]}),id);
  const loadOwn=async id=>{const t0=Date.now();await page.evaluate(id=>m3dNeed('w_item_'+id),id);   // מחזיר כמה זמן לקח (מקומי, מקובץ: בטלפון מהרשת זה אחר)
    await page.waitForFunction(id=>!m3dLazy('w_item_'+id)||['ready','fail'].includes(M3D.st['w_item_'+id]),id,{timeout:30000,polling:20}).catch(()=>{});return Date.now()-t0};

  // ---- בובה: חלון הציוד פתוח ----
  const doll=id=>page.evaluate(id=>{
    gearDraw();const D=R3D.doll;if(!D||!D.a)return {err:'no doll'};
    if(D.raf){cancelAnimationFrame(D.raf);D.raf=0}
    const a=D.a,use=wUse(id),prop=a.props[use];if(!prop)return {err:'no prop '+use};
    a.mixer.update(0.6);
    const cvs=D.cvs,rect=cvs.getBoundingClientRect();
    // גודל הקנבס כמו ב-dollFrame
    const w=cvs.clientWidth,h=cvs.clientHeight;D.r.setPixelRatio(1);D.r.setSize(w,h,false);D.cam.aspect=w/h;D.cam.updateProjectionMatrix();D.w=w;D.hh=h;
    const render=()=>{a.root.updateMatrixWorld(true);D.r.render(D.scene,D.cam)};
    const out={model:prop.children[0]&&prop.children[0].name||'',prop:a.L?Object.values(a.L.props||{}).find(p=>p).prop:'',rect:[rect.left,rect.top,rect.width,rect.height].map(Math.round),samples:[]};
    out.propName=(heroLook().props[use]||{}).prop;out.glow=(heroLook().props[use]||{}).glow||null;out.gk=(heroLook().props[use]||{}).gk||0;
    // מה חותך את הקנבס: אבות עם overflow שאינו visible, והמסך
    let clip=[0,0,innerWidth,innerHeight];for(let e=cvs.parentElement;e;e=e.parentElement){const s=getComputedStyle(e);if(s.overflow!=='visible'||s.overflowX!=='visible'||s.overflowY!=='visible'){const r=e.getBoundingClientRect();clip=[Math.max(clip[0],r.left),Math.max(clip[1],r.top),Math.min(clip[2],r.right),Math.min(clip[3],r.bottom)]}}
    const ph=[0,Math.PI/2,Math.PI,Math.PI*1.5];   // הקצוות של הנדנוד: sin=±1
    let first=null,clipped=0,hidden=0,offView=0,cover={},tot=0,edge=0,ndc=0;
    const ndcMax=obj=>{obj.updateMatrixWorld(true);let mx=0;const v=new THREE.Vector3();
      obj.traverse(o=>{if(!o.isMesh)return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i+=1){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld).project(D.cam);mx=Math.max(mx,Math.abs(v.x),Math.abs(v.y))}});return mx};
    for(const p of ph){a.root.rotation.y=(D.yaw||0)+Math.sin(p)*D.sway;
      const r=__wa.diff(cvs,render,[prop]);if(!first)first=r;
      edge=Math.max(edge,r.edge);
      // ההיטל המדויק של הנשק (כל הקודקודים): כמה רחוק הוא יוצא מ-[-1,1]. מזה מחשבים כמה הדמות תקטן אם המצלמה תתאים את עצמה לגוף+נשק
      const m=ndcMax(prop);if(m>1.0)clipped++;ndc=Math.max(ndc,m);
      // נקודות של הנשק: מה מעליהן על המסך
      for(let i=0;i<r.pts.length;i+=2*Math.max(1,Math.floor(r.pts.length/2/150))){tot++;
        const sx=rect.left+r.pts[i]/r.w*rect.width,sy=rect.top+r.pts[i+1]/r.h*rect.height;
        if(sx<clip[0]||sy<clip[1]||sx>clip[2]||sy>clip[3]){offView++;continue}
        const el=document.elementFromPoint(sx,sy);if(!el||el===cvs||el.contains(cvs))continue;
        hidden++;const k=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className?'.'+String(el.className).split(' ')[0]:'');cover[k]=(cover[k]||0)+1}}
    // תנוחת הריעה (doll3d מריע כשלובשים): גם היא נכנסת להתאמה
    let ndcCheer=0;try{const c=R3D.clips[DOLL3D.cheer];if(c){const act=a.mixer.clipAction(c);a.mixer.stopAllAction();act.reset().play();
      for(const t of [0.3,0.6,0.9,1.2]){a.mixer.setTime(t);a.root.rotation.y=D.yaw||0;a.root.updateMatrixWorld(true);ndcCheer=Math.max(ndcCheer,ndcMax(prop))}
      act.stop();loop(a,D.idle);a.mixer.update(0.6)}}catch(e){ndcCheer=-1}
    // תקריב של הנשק לבד, מלפנים ומהצד, כדי לשפוט צורה ופרטים (לא רק צבע)
    const shots={};{const hid=[],under=new Set();prop.traverse(o=>under.add(o));
      D.scene.traverse(o=>{if((o.isMesh||o.isSprite||o.isPoints)&&!under.has(o)&&o.visible){o.visible=false;hid.push(o)}});
      const cam=D.cam.clone(),S2=260;D.r.setSize(S2,S2,false);
      for(const [k,ry] of [['front',0],['side',Math.PI/2]]){a.root.rotation.y=ry;a.root.updateMatrixWorld(true);
        const bb=new THREE.Box3().setFromObject(prop),c=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3()).length();
        cam.aspect=1;cam.position.set(c.x,c.y,c.z+sz/2/Math.tan(cam.fov*Math.PI/360)*1.1);cam.lookAt(c);cam.updateProjectionMatrix();
        D.r.render(D.scene,cam);const g=__wa.grab(cvs);const o=document.createElement('canvas');o.width=S2;o.height=S2;o.getContext('2d').drawImage(g.c,0,0);shots[k]=o.toDataURL('image/png')}
      for(const o of hid)o.visible=true;D.r.setSize(w,h,false)}
    a.root.rotation.y=D.yaw||0;
    return {...out,ndc:+ndc.toFixed(2),ndcCheer:+ndcCheer.toFixed(2),fitScale:+(1/Math.max(1,ndc,ndcCheer)).toFixed(2),front:shots.front,side:shots.side,col:__colorStats(first.px),img:first.img,bb:first.bb,cw:first.w,ch:first.h,edgePx:edge,projOut:clipped,ofSamples:ph.length,
      hidPct:tot?Math.round(hidden/tot*100):0,offPct:tot?Math.round(offView/tot*100):0,cover,clipRect:clip.map(Math.round)};
  },id);

  // ---- עולם (כפר): הגיבור על המסך כמו במשחק ----
  const world=id=>page.evaluate(id=>{
    const a=R3D.player;if(!a)return {err:'no hero'};const use=wUse(id),prop=a.props[use];if(!prop)return {err:'no prop'};
    const r=R3D.r,cvs=r.domElement;
    const render=()=>{if(!(typeof VFX3D!=='undefined'&&VFX3D.render(r,R3D.scene,R3D.cam)))r.render(R3D.scene,R3D.cam)};
    // הצל של הנשק על הדשא משנה פיקסלים גם מחוץ לנשק. לכן המסכה מציור שבו רק הנשק גלוי (בלי דשא, דמות וצל), והצבע מהציור הרגיל
    const vis=__wa.diff(cvs,render,[prop]),seen=new Set();for(let i=0;i<vis.pts.length;i+=2)seen.add(vis.pts[i+1]*vis.w+vis.pts[i]);   // מה שהנשק משנה בציור הרגיל (כולל צל), ורק מה שלא מוסתר בגוף
    const A=(render(),__wa.grab(cvs)),hid=[];
    const under=new Set();prop.traverse(o=>under.add(o));
    R3D.scene.traverse(o=>{if((o.isMesh||o.isSprite||o.isPoints||o.isLine||o.isInstancedMesh)&&!under.has(o)&&o.visible){o.visible=false;hid.push(o)}});
    const sh=r.shadowMap.enabled;r.shadowMap.enabled=false;
    const plain=()=>r.render(R3D.scene,R3D.cam);
    const m=__wa.diff(cvs,plain,[prop]);
    for(const o of hid)o.visible=true;r.shadowMap.enabled=sh;render();
    const px=[];for(let i=0;i<m.pts.length;i+=2){const q=m.pts[i+1]*A.w+m.pts[i];if(!seen.has(q))continue;const j=q*4;px.push(A.d[j],A.d[j+1],A.d[j+2])}   // בצללית של הנשק וגם גלוי
    let img=null;if(m.bb){const [x0,y0,x1,y1]=m.bb,pad=Math.round(Math.max(x1-x0,y1-y0)*0.6)+6,cx=Math.max(0,x0-pad),cy=Math.max(0,y0-pad),cw=Math.min(A.w,x1+pad)-cx,chh=Math.min(A.h,y1+pad)-cy;
      const o=document.createElement('canvas');o.width=cw;o.height=chh;o.getContext('2d').drawImage(A.c,cx,cy,cw,chh,0,0,cw,chh);img=o.toDataURL('image/png')}
    const d={px,img};
    return {col:__colorStats(d.px),img:d.img,n:d.px.length/3,prop:(heroLook().props[use]||{}).prop,glow:(heroLook().props[use]||{}).glow||null,gk:(heroLook().props[use]||{}).gk||0};
  },id);

  const res={};
  // התמונות קודם (מהיר): נקראות ב-Node ונשלחות כ-data URL
  for(const id of ids){const f=path.resolve(__dirname,'..','icons','ui','gear',id+'.png'),src=fs.existsSync(f)?'data:image/png;base64,'+fs.readFileSync(f).toString('base64'):null;
    const info=await page.evaluate(id=>({hasPic:!!GEAR_PIC[id],tier:GEAR.items[id].tier,look:GEAR.items[id].look||null,tierCol:GEAR.tiers[GEAR.items[id].tier].col,emoji:GEAR.items[id].icon}),id);
    const p=src?await page.evaluate(src=>__wa.pic(src).then(r=>r&&{col:__colorStats(r.px),img:r.img}),src):null;
    res[id]={id,...info,pic:p}}
  // מעבר 1: הבובה. לפריט עם מודל משלו שעוד לא נטען: קודם המראה שלפני הטעינה, ואז אחרי
  await page.evaluate(()=>gearOpen());await page.waitForTimeout(800);
  for(const id of ids){
    const cls=await wear(id);const o=await own(id);const R=res[id];R.cls=cls;R.own=o;
    if(o.lazy&&!o.ready){R.dollPre=await doll(id);await page.evaluate(()=>{const D=R3D.doll;D.last=performance.now();D.raf=requestAnimationFrame(dollFrame)})}   // הבובה ממשיכה לזוז כמו במשחק
    R.loadMs=await loadOwn(id);R.loadSt=await page.evaluate(id=>M3D.st['w_item_'+id]||(m3dLazy('w_item_'+id)?'?':'not lazy'),id);await page.waitForTimeout(400);
    if(R.dollPre)R.stale=await page.evaluate(()=>R3D.doll.key!==dollKey());   // המודל נטען, אבל הבובה עדיין עם המראה הישן (dollBuild רק מ-gearDraw)
    if(id==='skyBow'&&R.stale)await page.screenshot({path:path.join(OUT,'gear-window-skyBow-stale.png')});
    R.own2=await own(id);
    R.doll=await doll(id);
    process.stdout.write(id+' ');
  }
  // צילום של חלון הציוד עם כל נשק (לבדיקה בעין של המסגור): רק לנשקים שנחתכו, בהמשך
  await page.evaluate(()=>gearClose());await page.waitForTimeout(400);
  // מעבר 2: העולם (הכפר). הגיבור נבנה מחדש בלולאת המשחק, אז מחכים כמה פריימים
  await page.evaluate(()=>{R3D.drawEvery=6});
  for(const id of ids){await wear(id);await page.waitForTimeout(1200);res[id].world=await world(id);process.stdout.write(',')}
  console.log('');
  // צילומי חלון לנשקים שנחתכו או הוסתרו
  const bad=ids.filter(id=>{const d=res[id].doll||{};return d.edgePx>3||d.hidPct>=5||d.offPct>=5}).sort((a,b)=>(res[b].doll.edgePx||0)-(res[a].doll.edgePx||0));
  await page.evaluate(()=>gearOpen());await page.waitForTimeout(500);
  for(const id of bad.slice(0,4)){await wear(id);await page.evaluate(()=>gearDraw());await page.waitForTimeout(700);await page.screenshot({path:path.join(OUT,'gear-window-'+id+'.png')})}
  await page.evaluate(()=>gearClose());

  // שיפוט
  const sc=page.evaluate.bind(page);
  for(const id of ids){const R=res[id],pc=R.pic&&R.pic.col;
    // גם בהירות: נשק כהה בהרבה מהתמונה (פחות מ-DARK מהבהירות שלה) נראה כמו פריט אחר, גם כשהגוון קרוב
    const ok=c=>{const m=sameColor(pc,c,HUE_TOL);return m===null?null:m&&c.v/pc.v>=DARK};
    R.matchDoll=ok(R.doll&&R.doll.col);R.matchPre=R.dollPre?ok(R.dollPre.col):null;
    R.matchWorld=R.world&&R.world.n>=WORLD_MIN?ok(R.world.col):null;   // בעולם הגיבור קטן, ולפעמים הנשק מאחוריו: מתחת ל-WORLD_MIN פיקסלים לא שופטים
    const d=R.doll||{};R.frameOk=!(d.edgePx>3||d.hidPct>=5||d.offPct>=5)}
  // תמונת השוואה: תמונה | בבובה (לפני טעינה) | בבובה | בעולם
  const sheet=await browser.newPage({viewport:{width:1220,height:400},deviceScaleFactor:1});
  const cell=(img,c,ok)=>'<td>'+(img?'<img src="'+img+'">':'<i>—</i>')+(c?'<div><span class="sw" style="background:'+c.hex+'"></span>'+c.name+' '+(c.neutral?'':c.hue+'°')+'</div>':'')+(ok===false?'<div class="x">✗</div>':ok===true?'<div class="ok">✓</div>':'')+'</td>';
  const html='<style>body{background:#1d1a26;color:#eee;font:13px sans-serif;margin:8px}td{border:1px solid #444;padding:4px;text-align:center;vertical-align:top;width:150px}img{max-width:140px;max-height:110px;background:#2c2838}th{padding:4px}.sw{display:inline-block;width:12px;height:12px;border:1px solid #fff;margin-inline-end:4px;vertical-align:middle}.x{color:#ff6b6b;font-weight:bold}.ok{color:#7ed97e}</style><table><tr><th>weapon</th><th>picture</th><th>doll before own model loads</th><th>doll (gear window)</th><th>world (village)</th><th>weapon alone: front</th><th>side</th></tr>'+
    ids.map(id=>{const R=res[id];return '<tr><td><b>'+id+'</b><br>tier '+R.tier+' · '+R.cls+'<br>'+(R.doll&&R.doll.propName||'')+(R.frameOk?'':'<div class="x">framing ✗ ('+R.doll.edgePx+'px at edge'+(R.doll.hidPct?', '+R.doll.hidPct+'% under badge':'')+')</div>')+(R.stale?'<div class="x">doll stale after load</div>':'')+'</td>'+cell(R.pic&&R.pic.img,R.pic&&R.pic.col)+cell(R.dollPre&&R.dollPre.img,R.dollPre&&R.dollPre.col,R.matchPre)+cell(R.doll&&R.doll.img,R.doll&&R.doll.col,R.matchDoll)+cell(R.world&&R.world.img,R.world&&R.world.n>=WORLD_MIN&&R.world.col,R.matchWorld)+cell(R.doll&&R.doll.front)+cell(R.doll&&R.doll.side)+'</tr>'}).join('')+'</table>';
  await sheet.setContent(html);await sheet.screenshot({path:path.join(OUT,'sheet.png'),fullPage:true});
  // JSON בלי התמונות
  const slim=JSON.parse(JSON.stringify(res,(k,v)=>k==='img'||k==='front'||k==='side'?undefined:v));
  fs.writeFileSync(path.join(OUT,'audit.json'),JSON.stringify({view:VIEW,hueTol:HUE_TOL,errors:errors.slice(0,10),weapons:slim},null,1));
  for(const id of ids){const R=res[id],c=x=>x?x.name+(x.neutral?'':'/'+x.hue):'-';
    console.log(id.padEnd(13)+' pic '+c(R.pic&&R.pic.col).padEnd(12)+' pre '+c(R.dollPre&&R.dollPre.col).padEnd(12)+' doll '+c(R.doll&&R.doll.col).padEnd(12)+' world '+c(R.world&&R.world.col).padEnd(12)+
      ' '+(R.matchDoll===false?'✗doll':'✓doll')+(R.matchPre===false?' ✗pre':'')+(R.matchWorld===false?' ✗world':'')+(R.stale?' stale':'')+' model '+((R.doll||{}).propName)+(R.loadMs!=null&&R.own&&R.own.lazy?' load '+R.loadMs+'ms':'')+' fit×'+((R.doll||{}).fitScale)+' ndc '+((R.doll||{}).ndc)+'/'+((R.doll||{}).ndcCheer)+' '+(R.frameOk?'✓frame':'✗frame edge'+(R.doll||{}).edgePx+' proj'+(R.doll||{}).projOut+' hid'+(R.doll||{}).hidPct+'% off'+(R.doll||{}).offPct+'% '+JSON.stringify((R.doll||{}).cover||{})))}
  if(errors.length)console.log('שגיאות בדף:',errors.slice(0,5));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
