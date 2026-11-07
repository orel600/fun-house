/* הקרקע בעולם ובכפר: מפה מצוירת לכל אזור (ניר, 1.11.2026, בחר "רך ומצויר" ושבילים בין השערים). התוכנית: docs/plan-ground.md (ענף research/ground-plan).
   מה יש בה: כתמים גדולים של עשב עשיר ויבש, שבילים שמחברים את השערים (מחושבים לבד מהשערים של האזור), חוף סביב המים,
   קצה כהה מחוץ לגבול, וצל מגע מתחת לעצים, סלעים ומקורות, כדי שלא ירחפו.
   איך: כשנכנסים לאזור, הכרטיס הגרפי מצייר את המפה פעם אחת לתמונה (bake, כמה אלפיות שנייה). בכל פריים הקרקע רק קוראת ממנה,
   אז המהירות כמו קודם. בעולם ובכפר (GROUND.village), רק בתלת-ממד. לא בזירה. ?look=classic מכבה (כמו כל look-hd.js).
   אזור חדש: שורה ב-GROUND.pal. בלי שורה הוא מקבל את האחו. המים עצמם (צבע, זוהר לבה): W3D.regions ב-render3d.js */
const GROUND={
  // פלטה לכל אזור: base בסיס, lush כתמים עשירים, dry כתמים יבשים, path שביל, shore חוף סביב המים, out מחוץ לגבול.
  // rim: טבעת דקה ממש על שפת המים (קרח בהיר ברכס, זוהר לבה במדבר). shoreA: כמה חזק החוף
  pal:{
    meadow:{base:'#5f8f3e',lush:'#3f6e2e',dry:'#9aa64f',path:'#a88a5a',shore:'#6d6a3a',out:'#2d4a26'},
    lake:  {base:'#4c6f5a',lush:'#35564a',dry:'#7c8f6a',path:'#8a7f62',shore:'#8a8064',out:'#22362f'},
    ridge: {base:'#c9d6e2',lush:'#9fb2c6',dry:'#eef4fa',path:'#8c96a3',shore:'#7fb2d4',out:'#6f8197',rim:'#e6f8ff'},
    desert:{base:'#d2a463',lush:'#b98447',dry:'#e8c88c',path:'#9c6a3a',shore:'#4a2416',out:'#8a5a32',rim:'#ff8a2a'},
    storm: {base:'#5d5a6e',lush:'#454256',dry:'#7a7790',path:'#3a3846',shore:'#6e5fa6',out:'#2a2836'},
    shadow:{base:'#2a2140',lush:'#1b1430',dry:'#3c2f5a',path:'#4b3a70',shore:'#5b3f8c',out:'#0f0a18'}
  },
  res:2.5,                      // כמה פיקסלים של המשחק לכל נקודה בתמונה האפויה. פחות = חד יותר וכבד יותר
  resMap:3,maxTex:4096,         // אזור עם מפה (האחו הגדול): קצת פחות חד, כדי שהתמונה תהיה כ-2700×1900 ולא תעבור את maxTex
  margin:{w:1800,h:1600},      // כמה מעבר לגבול האזור אופים (שם הקצה הכהה). מעבר לזה: הצבע של out
  big:720,small:170,           // גודל הכתמים: הגדולים (עשיר מול בסיס) והקטנים (יבש)
  pathW:34,                    // רוחב השביל
  hub:{x:0,y:-120},            // הצומת שאליו מגיעים כל השבילים. אם הוא במים, הוא זז לשפה
  shoreW:46,shoreA:0.85,rimW:16,rimA:0.9,
  edge:{from:-40,to:90},       // הקצה הכהה: מתחיל 40 לפני הגבול ונגמר 90 אחריו
  shadow:{dark:0.28,size:1.05,dx:0.18,dy:-0.1,decor:{tree:30,rock:24},tower:1.1,gate:34},   // צל מגע: כמה כהה, פי כמה מהרדיוס, וקצת לכיוון שהשמש מטילה
  grain:{tile:240,lo:0.72,hi:0.42},   // גרגר עדין מעל המפה (קווי עשב ונקודות), כדי שמקרוב היא לא תיראה חלקה
  /* דוגמה לכל אזור מעל הגרגר (ניר, 2.11: "טקסטורה... בכללי", באותו סגנון כמו המבנים ב-tex3d.js): grass עשב, sand אדוות חול,
     snow קרום שלג, stone סלע סדוק. אזור שלא כתוב כאן: grass. ובשבילי העפר: חלוקי אבן (pebble: גודל התא, כמה מהתאים, כמה חזק) */
  motif:{meadow:'grass',lake:'grass',village:'grass',ridge:'snow',desert:'sand',storm:'stone',shadow:'stone'},
  pebble:{cell:16,n:0.35,k:0.38},
  maxSeg:64,maxPond:10,         // maxSeg: עד 64 קטעי שביל (המפה של האחו הגדול, terrain.js)
  /* הכפר (ניר, 1.11.2026, משימה 5 ב-plan-ground.md): שבילים מהשער לכיכר ומהכיכר לכל מבנה שנבנה, כיכר עפר מול הטירה, צל מגע מתחת למבנים,
     ועשב ופרחים רק בשוליים. הכפר גדל לפי הרמה של מרכז הכפר (vLv('center')): השבילים והכיכר מתרחבים, ומרמה paveAt הם מרוצפים באבן.
     pathW: [רוחב, כמה מוסיפים בכל רמה]. plaza: מרכז הכיכר, [רדיוס, תוספת לרמה]. door: איפה הדלת של מבנה, ביחס לרדיוס שלו. grass: מאיזה מרחק מהמרכז יש עשב */
  village:{pal:{base:'#5f8a42',lush:'#4a7536',dry:'#8fa055',path:'#b09468',pave:'#9c978a',shore:'#6d6a3a',out:'#33502c'},
    pathW:[22,2],plaza:{x:0,y:-80,r:[62,6]},paveAt:4,door:0.6,grass:420,shadow:1.05},   // הכפר הגדול (2.11): הכיכר מתחת לטירה, והעשב מתחיל רחוק יותר
  /* פיזור (שלב 3, ניר: "בינוני"): גושי עשב ופרחים שזזים ברוח, ואבנים קטנות. רק בחלון סביב השחקן, על הכתמים העשירים ולא על השבילים, במים או על מקורות.
     שלושה ציורים בסך הכל. נכבה לבד בטלפון חלש (minFps, לפי המדידה של GFX_AUTO ב-render3d.js), ועם ?scatter=0.
     cell: כל כמה פיקסלים בודקים אם לשים משהו. win: גודל החלון סביב השחקן. step: כמה לזוז עד שבונים את החלון מחדש.
     לכל אזור: n כמה מכל סוג לכל היותר בחלון, col צבעים. tuft עשב, flower פרחים (בגושים), pebble אבנים */
  scatter:{cell:30,win:{w:1700,h:1500},step:320,minFps:40,wind:1,budget:2,   // budget: כמה ms בכל פריים לבנייה ברקע של החלון הבא (scRun)
    size:{tuft:[18,30],flower:[3.5,5],pebble:[3.5,7]},
    meadow:{tuft:{n:600,col:['#6fae44','#7fba4a','#8cc456','#5f9a3a']},flower:{n:220,col:['#ffffff','#ffd94a','#ff8fb0','#b58cff','#ffb347']},pebble:{n:90,col:['#9a9a92','#7d7f78','#b0aa9a']}},
    lake:  {tuft:{n:520,col:['#5a8f6a','#6a9f72','#7aa878']},flower:{n:90,col:['#e8f4ff','#b8d8ff','#c8b8ff']},pebble:{n:110,col:['#7f8f88','#6a7a74']}},
    ridge: {tuft:{n:120,col:['#b8c4b0','#a8b6a6']},flower:{n:120,col:['#bfe8ff','#9fd8f0','#e6f7ff']},pebble:{n:220,col:['#ffffff','#eef4fa','#dbe6f0']}},
    desert:{tuft:{n:110,col:['#d8c27a','#c9b06a','#e2cc8a']},pebble:{n:220,col:['#c08d55','#b07a48','#d6a46c']}},
    storm: {tuft:{n:120,col:['#7f8a7a','#6f7a72']},pebble:{n:300,col:['#6e6a86','#57546e','#8a86a2']}},
    shadow:{pebble:{n:160,col:['#3c2f5a','#2a2140','#5b3f8c']}},
    village:{tuft:{n:260,col:['#6fae44','#7fba4a','#8cc456','#5f9a3a']},flower:{n:110,col:['#ffffff','#ffd94a','#ff8fb0','#b58cff','#ffb347']},pebble:{n:40,col:['#9a9a92','#b0aa9a']}}
  }
};

(()=>{
  const on=()=>typeof HD!=='undefined'&&HD.on&&R3D.on&&R3D.ready;
  let mat=null,bk=null,key=null,box=null;
  const rgb=h=>{const n=parseInt(h.slice(1),16);return new THREE.Vector3((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)};   // צבע כמו שהוא (sRGB), בלי המרה
  const NOISE=`
    float gH(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
    float gN(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float a=gH(i),b=gH(i+vec2(1,0)),c=gH(i+vec2(0,1)),d=gH(i+vec2(1,1));return a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;}
    float gF(vec2 p){return 0.5*gN(p)+0.3*gN(p*2.03+vec2(1.7,9.2))+0.2*gN(p*4.01+vec2(5.1,3.3));}`;

  GROUND.noise=NOISE;   // גם רצפת הזירה (arena-look.js) משתמשת באותו רעש
  // השבילים: מכל שער אל הצומת, בעיקול קל. מהשערים של האזור, אז אזור חדש מקבל שבילים לבד
  function segs(R){
    const gs=wGates(),out=[],hub={x:GROUND.hub.x,y:GROUND.hub.y};
    for(const p of R.ponds||[]){const dx=hub.x-p.x,dy=hub.y-p.y,d=Math.hypot(dx,dy)||1,m=p.r+GROUND.pathW*1.6;if(d<m){hub.x=p.x+dx/d*m;hub.y=p.y+dy/d*m}}
    let k=1;
    for(const id in gs){const a=gs[id],mx=(a.x+hub.x)/2,my=(a.y+hub.y)/2,dx=hub.x-a.x,dy=hub.y-a.y,L=Math.hypot(dx,dy)||1,o=(hash(k++,3)-0.5)*0.35*L,m={x:mx-dy/L*o,y:my+dx/L*o};
      out.push([a.x,a.y,m.x,m.y],[m.x,m.y,hub.x,hub.y])}
    return out.slice(0,GROUND.maxSeg);
  }
  // הכפר: שבילים מהשער לכיכר, ומהכיכר לדלת של כל מבנה שנבנה ולפינות של התושבים
  function vSegs(L){
    const V=GROUND.village,pz={x:V.plaza.x,y:V.plaza.y},out=[],g=VILLAGE.gate,curve=(a,b,k)=>{const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,Ln=Math.hypot(dx,dy)||1,o=(hash(k,7)-0.5)*0.22*Ln,m={x:mx-dy/Ln*o,y:my+dx/Ln*o};out.push([a.x,a.y,m.x,m.y],[m.x,m.y,b.x,b.y])};
    curve(g,pz,1);let k=2;
    for(const id in VILLAGE.b){if(id==='center'||!vLv(id))continue;const B=VILLAGE.b[id];curve(pz,{x:B.x,y:B.y+B.r*V.door},k++)}
    for(const id in NPC.list){const sp=NPC.list[id].spot;if(sp&&npcHere(id))curve(pz,sp,k++)}
    if(typeof RESID!=='undefined')for(const id in RESID.list)if(resMoved(id)){const h=RESID.list[id].house;curve(pz,{x:h.x,y:h.y+30},k++)}   // רובע המגורים: שביל לכל בית (residents.js)
    return out.slice(0,GROUND.maxSeg);
  }
  function vShadows(){
    const D=GROUND.shadow,V=GROUND.village,o=[];
    for(const id in VILLAGE.b){if(!vLv(id))continue;const B=VILLAGE.b[id],lk=vLook(id);o.push([B.x,B.y,B.r*V.shadow*(lk?lk.size:0.9)])}
    for(const d of villageDecor())if(D.decor[d.kind])o.push([d.x,d.y,D.decor[d.kind]*(0.8+d.v*0.4)*D.size]);
    const g=VILLAGE.gate;o.push([g.x,g.y,D.gate*D.size]);
    return o;
  }
  // המקום הנוכחי, בשביל האפייה והפיזור: עולם (אזור) או כפר. null בכל מקום אחר (זירה, חדר בונוס)
  function place(){
    if(!S||S.room)return null;
    if(S.vil){const V=GROUND.village,L=vLv('center'),r=VILLAGE.radius,lv=Object.keys(VILLAGE.b).map(vLv).join('');
      const blocks=Object.keys(VILLAGE.b).filter(vLv).map(id=>{const B=VILLAGE.b[id];return{x:B.x,y:B.y,r:B.r+18}});
      const vk='vil:'+lv+':'+Object.keys(NPC.list).filter(npcHere).length+':'+CAM.ang;   // CAM.ang: הפיזור תלוי בזווית (camera.js)
      return{reg:'village',key:vk,sk:vk,pal:V.pal,size:{w:r*2,h:r*2},round:1,ponds:[],
        pathW:V.pathW[0]+V.pathW[1]*L,paved:L>=V.paveAt?1:0,plaza:{x:V.plaza.x,y:V.plaza.y,r:V.plaza.r[0]+V.plaza.r[1]*L},inner:V.grass,
        segs:()=>vSegs(L),shadows:vShadows,blocks}}
    if(!S.wd)return null;
    const reg=S.wd.reg||'meadow',R=WR(),alive=S.nd.list.filter(n=>!n.dead);
    return{reg,key:reg+':'+alive.length+':'+Object.keys(wGates()).length,map:R.map&&R,sk:reg+':'+S.nd.list.length+':'+CAM.ang,   // sk: הפיזור נבנה מחדש רק כשהמקורות עצמם מתחלפים, לא כשאחד נשבר
      pal:GROUND.pal[reg]||GROUND.pal.meadow,size:R.size,round:0,ponds:R.ponds||[],
      pathW:GROUND.pathW,paved:0,plaza:null,inner:0,segs:()=>R.map?terrainSegs(R):segs(R),shadows:()=>shadows(R),
      blocks:(R.ponds||[]).concat(R.towers||[]).map(p=>({x:p.x,y:p.y,r:p.r+16})).concat(S.nd.list.map(n=>({x:n.x,y:n.y,r:n.r+12,sq:1})))};
  }
  // צל מגע: מקורות, קישוטים מסביב, מגדלים ושערים
  function shadows(R){
    const D=GROUND.shadow,o=[];
    for(const n of S.nd.list)if(!n.dead)o.push([n.x,n.y,n.r*D.size]);   // רק מה שעומד עכשיו
    for(const d of worldDecor())if(D.decor[d.kind])o.push([d.x,d.y,D.decor[d.kind]*(0.8+d.v*0.4)*D.size]);
    for(const t of R.towers||[])o.push([t.x,t.y,t.r*D.tower*D.size]);
    const gs=wGates();for(const k in gs)o.push([gs[k].x,gs[k].y,D.gate*D.size]);   // רק שערים פתוחים (דרך סגורה לא מצוירת)
    return o;
  }

  // האפייה: ריבוע אחד על כל התמונה, ואחריו כתמי הצל. הצבעים נשמרים כ-sRGB, והקרקע ממירה בקריאה
  let bakeScene,bakeCam,baseMat,shMesh;
  function bakeSetup(){
    bakeScene=new THREE.Scene();bakeCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const v3=()=>new THREE.Vector3(),U={box:{value:new THREE.Vector4()},size:{value:new THREE.Vector2()},
      cBase:{value:v3()},cLush:{value:v3()},cDry:{value:v3()},cPath:{value:v3()},cShore:{value:v3()},cOut:{value:v3()},cRim:{value:v3()},
      seg:{value:Array.from({length:GROUND.maxSeg},()=>new THREE.Vector4())},pond:{value:Array.from({length:GROUND.maxPond},()=>new THREE.Vector3())},
      big:{value:0},small:{value:0},pathW:{value:0},shoreW:{value:0},shoreA:{value:0},rimW:{value:0},rimA:{value:0},eFrom:{value:0},eTo:{value:0},
      round:{value:0},paved:{value:0},pebC:{value:13},pebN:{value:0.3},pebK:{value:0.2},cPave:{value:v3()},plaza:{value:v3()},
      tMask:{value:null},tOn:{value:0},cForest:{value:v3()},cRock:{value:v3()},cBank:{value:v3()}};   // tMask: המסכה של המפה (terrainMask ב-terrain.js)
    baseMat=new THREE.ShaderMaterial({uniforms:U,depthTest:false,depthWrite:false,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:`precision highp float;varying vec2 vUv;uniform vec4 box;uniform vec2 size;uniform vec3 cBase,cLush,cDry,cPath,cShore,cOut,cRim;
        uniform vec4 seg[${GROUND.maxSeg}];uniform vec3 pond[${GROUND.maxPond}];uniform float pebC,pebN,pebK,big,small,pathW,shoreW,shoreA,rimW,rimA,eFrom,eTo,round,paved;uniform vec3 cPave,plaza;uniform sampler2D tMask;uniform float tOn;uniform vec3 cForest,cRock,cBank;${NOISE}
        void main(){
          vec2 p=box.xy+vUv*box.zw;float nb=gF(p/big),ns=gF(p/small+vec2(3.1,7.7));
          vec3 c=mix(cLush,cBase,smoothstep(0.32,0.58,nb));
          c=mix(c,cDry,smoothstep(0.6,0.82,ns)*0.5);
          vec4 tm=tOn>0.5?texture2D(tMask,vUv):vec4(0.0);float tw=(gN(p/46.0)-0.5)*0.3;   // המפה: סלע, קרקעית יער, וגדה כהה סביב המים
          c=mix(c,cRock*(0.85+0.3*gN(p/22.0)),smoothstep(0.3,0.6,tm.a+tw)*0.85);
          c=mix(c,cForest*(0.8+0.4*gN(p/30.0)),smoothstep(0.3,0.6,tm.g+tw));
          c=mix(c,cBank,smoothstep(0.08,0.45,tm.r+tw*0.6)*0.9);
          float dp=1e5;for(int i=0;i<${GROUND.maxSeg};i++){vec2 a=seg[i].xy,b=seg[i].zw-a;float t=clamp(dot(p-a,b)/max(dot(b,b),1.0),0.0,1.0);dp=min(dp,length(p-a-b*t));}
          dp=min(dp,max(length(p-plaza.xy)-plaza.z,0.0));   // הכיכר בכפר: עיגול של שביל
          dp+=(gN(p/38.0)-0.5)*26.0*(1.0-paved*0.6);
          float pm=1.0-smoothstep(pathW*0.55,pathW,dp);
          c=mix(c,c*0.82,(1.0-smoothstep(pathW,pathW*1.5,dp))*(1.0-pm));
          vec3 pc=cPath*(0.9+0.2*gN(p/12.0));
          // ריצוף: אבנים בשורות מוזזות, עם תפר כהה ביניהן
          vec2 bq=vec2(p.x/18.0+0.5*floor(p.y/12.0),p.y/12.0),bf=fract(bq);float mort=min(min(bf.x,1.0-bf.x)*18.0,min(bf.y,1.0-bf.y)*12.0);
          vec3 pv=cPave*(0.88+0.2*gH(floor(bq)))*mix(0.75,1.0,smoothstep(0.6,1.8,mort));
          // חלוקים בשביל העפר: עיגול קטן בהיר עם צל כהה מתחתיו, בחלק מהתאים
          vec2 pq=p/pebC;vec2 pf=fract(pq)-0.5+(vec2(gH(floor(pq)+3.7),gH(floor(pq)+8.1))-0.5)*0.35;float ph=gH(floor(pq));
          float peb=step(1.0-pebN,ph)*(1.0-smoothstep(0.22,0.3,length(pf)));float pebS=step(1.0-pebN,ph)*(1.0-smoothstep(0.22,0.32,length(pf+vec2(0.0,0.12))));
          pc=pc*(1.0-pebS*pebK)*(1.0+peb*pebK*1.3);
          c=mix(c,mix(pc,pv,paved),pm);
          float ds=1e5;for(int i=0;i<${GROUND.maxPond};i++)ds=min(ds,length(p-pond[i].xy)-pond[i].z);
          float dn=ds+(gN(p/30.0)-0.5)*20.0;
          c=mix(c,cShore,(1.0-smoothstep(0.0,shoreW,dn))*shoreA);
          c=mix(c,cRim,(1.0-smoothstep(0.0,rimW,ds+(gN(p/14.0)-0.5)*6.0))*rimA);
          vec2 q=abs(p)-size*0.5;float de=mix(max(q.x,q.y),length(p)-size.x*0.5,round)+(gN(p/60.0)-0.5)*60.0;   // round: גבול עגול (הכפר)
          c=mix(c,cOut,tOn>0.5?smoothstep(0.35,0.75,tm.b+tw):smoothstep(eFrom,eTo,de));   // עם מפה: הקצה הוא קו הגבול, לא מלבן
          gl_FragColor=vec4(c,1.0);}`});
    const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),baseMat);q.frustumCulled=false;bakeScene.add(q);
  }
  function shadowMesh(list){
    if(shMesh){bakeScene.remove(shMesh);shMesh.geometry.dispose()}
    const g=new THREE.InstancedBufferGeometry(),pl=new THREE.PlaneGeometry(2,2);g.index=pl.index;g.setAttribute('position',pl.getAttribute('position'));
    g.setAttribute('sh',new THREE.InstancedBufferAttribute(new Float32Array(list.flat()),3));g.instanceCount=list.length;
    if(!shMesh||!shMesh.material.isShaderMaterial)shMesh={material:new THREE.ShaderMaterial({uniforms:{box:baseMat.uniforms.box,dark:{value:GROUND.shadow.dark},off:{value:new THREE.Vector2(GROUND.shadow.dx,GROUND.shadow.dy)}},
      transparent:true,depthTest:false,depthWrite:false,
      vertexShader:'attribute vec3 sh;uniform vec4 box;uniform vec2 off;varying vec2 vQ;void main(){vQ=position.xy;vec2 c=sh.xy+(position.xy+off)*sh.z;gl_Position=vec4((c-box.xy)/box.zw*2.0-1.0,0.0,1.0);}',
      fragmentShader:'precision highp float;uniform float dark;varying vec2 vQ;void main(){float d=length(vQ);gl_FragColor=vec4(0.0,0.0,0.0,(1.0-smoothstep(0.2,1.0,d))*dark);}'})};
    const m=new THREE.Mesh(g,shMesh.material);m.frustumCulled=false;m.renderOrder=1;bakeScene.add(m);shMesh=m;
  }
  function bake(pl){
    const t0=performance.now(),P_=pl.pal;
    if(!bakeScene)bakeSetup();
    const u=baseMat.uniforms,bw=pl.size.w+GROUND.margin.w,bh=pl.size.h+GROUND.margin.h,res=Math.max(pl.map?GROUND.resMap:GROUND.res,bw/GROUND.maxTex,bh/GROUND.maxTex),cw=Math.ceil(bw/res),ch=Math.ceil(bh/res);   // maxTex: תמונה אחת לא גדולה מזה
    // המסכה של המפה (נהר, יער, גבול, סלעים) קבועה לכל אזור, ובטלפון היא רוב הזמן של האפייה (קריאות קנבס עם טשטוש).
    // לכן נשמרת, ונבנית מחדש רק באזור אחר. בלי זה, כל עץ שנכרת או צמח מחדש ביער עצר את המשחק ל-150ms (ניר, 7.11)
    const mkK=pl.map?pl.reg+':'+bw+'x'+bh:null;
    if(u.tMask.value&&u.tMask.value.userData.k!==mkK){u.tMask.value.dispose();u.tMask.value=null}u.tOn.value=0;
    if(pl.map){if(!u.tMask.value){const mk=terrainMask(pl.map,bw,bh),tx=new THREE.DataTexture(mk.data,mk.w,mk.h,THREE.RGBAFormat);tx.magFilter=tx.minFilter=THREE.LinearFilter;tx.needsUpdate=true;tx.userData.k=mkK;u.tMask.value=tx}
      u.tOn.value=1;const Q=TERRAIN.pal[pl.reg]||TERRAIN.pal.meadow;u.cForest.value.copy(rgb(Q.forest));u.cRock.value.copy(rgb(Q.rock));u.cBank.value.copy(rgb(Q.bank))}
    box=new THREE.Vector4(-bw/2,-bh/2,bw,bh);u.box.value.copy(box);u.size.value.set(pl.size.w,pl.size.h);
    for(const k of ['base','lush','dry','path','shore','out'])u['c'+k[0].toUpperCase()+k.slice(1)].value.copy(rgb(P_[k]));
    u.cRim.value.copy(rgb(P_.rim||P_.shore));u.rimA.value=P_.rim?GROUND.rimA:0;
    for(const k of ['big','small','shoreW','shoreA','rimW'])u[k].value=GROUND[k];u.eFrom.value=GROUND.edge.from;u.eTo.value=GROUND.edge.to;
    u.pebC.value=GROUND.pebble.cell;u.pebN.value=GROUND.pebble.n;u.pebK.value=GROUND.pebble.k;
    u.pathW.value=pl.pathW;u.round.value=pl.round;u.paved.value=pl.paved;u.cPave.value.copy(rgb(P_.pave||P_.path));
    if(pl.plaza)u.plaza.value.set(pl.plaza.x,pl.plaza.y,pl.plaza.r);else u.plaza.value.set(9e4,9e4,1);
    const sg=pl.segs();u.seg.value.forEach((v,i)=>sg[i]?v.set(...sg[i]):v.set(9e4,9e4,9e4,9e4));
    const ps=pl.ponds;u.pond.value.forEach((v,i)=>ps[i]?v.set(ps[i].x,ps[i].y,ps[i].r):v.set(9e4,9e4,1));
    shadowMesh(pl.shadows());
    if(bk&&(bk.width!==cw||bk.height!==ch)){bk.dispose();bk=null}   // רק האזור הנוכחי שמור בזיכרון. באותו גודל: אותה תמונה, בלי להקצות מחדש
    if(!bk)bk=new THREE.WebGLRenderTarget(cw,ch,{depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false});
    const r=R3D.r,prev=r.getRenderTarget(),ac=r.autoClear;r.autoClear=true;
    r.setRenderTarget(bk);r.render(bakeScene,bakeCam);r.setRenderTarget(prev);r.autoClear=ac;
    GROUND.bakeMs=Math.round(performance.now()-t0);
  }
  // הקרקע עצמה: קוראת את התמונה האפויה לפי המקום בעולם (לא לפי המשטח שזז עם המצלמה), ומוסיפה גרגר עדין
  const grains={};
  function grainTex(kind){
    if(grains[kind])return grains[kind];
    const T=256,c=document.createElement('canvas');c.width=c.height=T;const g=c.getContext('2d');let s=5;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    const wrap=f=>{for(const dx of [-T,0,T])for(const dy of [-T,0,T]){g.save();g.translate(dx,dy);f();g.restore()}};
    g.fillStyle='rgb(220,220,220)';g.fillRect(0,0,T,T);
    if(kind==='sand'){   // אדוות: גלים רכים, קו בהיר ומתחתיו קו כהה
      for(let i=0;i<14;i++){const y0=i*T/14+rnd()*6,ph=rnd()*6.28;wrap(()=>{for(const [o,v,w] of [[0,250,3],[4,170,3]]){g.strokeStyle='rgba('+v+','+v+','+v+',0.5)';g.lineWidth=w;g.beginPath();
        for(let x=-4;x<=T+4;x+=8)g.lineTo(x,y0+o+Math.sin(x/T*6.28*2+ph)*6);g.stroke()}})}
      for(let i=0;i<400;i++){const v=rnd()<0.5?250:170;g.fillStyle='rgba('+v+','+v+','+v+',0.6)';g.fillRect(rnd()*T,rnd()*T,1.5,1.5)}}
    else if(kind==='snow'){   // שלג: גבעות רכות של צל ונקודות נוצצות
      for(let i=0;i<30;i++){const x=rnd()*T,y=rnd()*T,r=20+rnd()*30;wrap(()=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,0.7)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);
        g.strokeStyle='rgba(170,170,170,0.5)';g.lineWidth=2;g.beginPath();g.arc(x,y+r*0.2,r*0.7,0.3,2.8);g.stroke()})}
      for(let i=0;i<160;i++){g.fillStyle='rgba(255,255,255,0.95)';g.fillRect(rnd()*T,rnd()*T,2,2)}}
    else if(kind==='stone'){   // סלע סדוק: לוחות לא סדירים עם סדקים כהים
      for(let i=0;i<40;i++){const x=rnd()*T,y=rnd()*T,r=14+rnd()*24,v=Math.round(190+rnd()*60);wrap(()=>{g.fillStyle='rgba('+v+','+v+','+v+',0.6)';g.beginPath();for(let j=0;j<6;j++){const a=j/6*6.28+rnd()*0.4,d=r*(0.7+rnd()*0.4);g.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}g.closePath();g.fill()})}
      for(let i=0;i<12;i++){let x=rnd()*T,y=rnd()*T,a=rnd()*6.28;const pts=[[x,y]];for(let j=0;j<7;j++){a+=rnd()-0.5;x+=Math.cos(a)*16;y+=Math.sin(a)*16;pts.push([x,y])}
        wrap(()=>{g.strokeStyle='rgba(90,90,90,0.8)';g.lineWidth=2.5;g.beginPath();pts.forEach(p=>g.lineTo(p[0],p[1]));g.stroke()})}}
    else{   // עשב: קווים קצרים בהירים וכהים, ועוד גושים קטנים
      for(let i=0;i<1300;i++){const x=rnd()*T,y=rnd()*T,l=2+rnd()*5,a=-1.2+rnd()*0.5,v=rnd()<0.55?245:175+rnd()*25;
        wrap(()=>{g.strokeStyle='rgba('+v+','+v+','+v+',0.6)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()})}
      for(let i=0;i<40;i++){const x=rnd()*T,y=rnd()*T;wrap(()=>{for(let k=0;k<6;k++){const a=-1.9+k*0.25;g.strokeStyle='rgba(150,150,150,0.55)';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9);g.stroke()}})}}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return grains[kind]=t;
  }
  function makeMat(){
    const m=new THREE.MeshLambertMaterial({map:grainTex('grass'),color:0xffffff}),G=GROUND.grain;
    const U=m.userData.u={gSin:{value:1},gBake:{value:null},gBox:{value:new THREE.Vector4(0,0,1,1)},gTile:{value:G.tile},gLo:{value:G.lo},gHi:{value:G.hi}};
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
      sh.vertexShader='varying vec2 vGp;uniform float gSin;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 gW=modelMatrix*vec4(transformed,1.0);vGp=vec2(gW.x,gW.z*gSin);');
      sh.fragmentShader='varying vec2 vGp;uniform sampler2D gBake;uniform vec4 gBox;uniform float gTile,gLo,gHi;\n'+sh.fragmentShader.replace('#include <map_fragment>',
        'vec3 gC=pow(texture2D(gBake,clamp((vGp-gBox.xy)/gBox.zw,0.0,1.0)).rgb,vec3(2.2));vec4 gT=texture2D(map,vGp/gTile);diffuseColor.rgb=gC*(gLo+gHi*gT.r);')};
    return m;
  }
  // look-hd.js שואל בכל פריים: בעולם ובכפר מקבל את החומר הזה, ובכל מקום אחר null (נשארת הקרקע של שלב 1)
  GROUND.mat=()=>{
    if(GROUND.failed||!on())return null;
    const pl=place();if(!pl)return null;
    // מקור שנשבר או צמח, דרך שנפתחה, או מבנה שעלה רמה בכפר: אופים שוב (כמה ms. המסכה של המפה נשמרת, ראו bake)
    try{if(pl.key!==key){key=pl.key;bake(pl)}}catch(e){GROUND.failed=e.message;console.warn('ground',e);return null}   // תקלה: נשארת הקרקע של שלב 1
    if(!mat)mat=makeMat();
    mat.map=grainTex(GROUND.motif[pl.reg]||'grass');   // הדוגמה של האזור (אותו שיידר, רק תמונה אחרת)
    const u=mat.userData.u;u.gBake.value=bk.texture;u.gBox.value.copy(box);u.gSin.value=SIN();
    return mat;
  };

  // ---- פיזור: עשב, פרחים ואבנים ----
  // אותו רעש כמו בשיידר, ב-JS, כדי שהעשב ישב על הכתמים העשירים של המפה
  const fr=v=>v-Math.floor(v),hh=(x,y)=>{let a=fr(x*0.1031),b=fr(y*0.1031),c=a;const d=a*(b+33.33)+b*(c+33.33)+c*(a+33.33);a+=d;b+=d;c+=d;return fr((a+b)*c)};   // אותו hash כמו בשיידר
  const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),a=hh(ix,iy),b=hh(ix+1,iy),c=hh(ix,iy+1),d=hh(ix+1,iy+1);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy};
  const fbm=(x,y)=>0.5*vn(x,y)+0.3*vn(x*2.03+1.7,y*2.03+9.2)+0.2*vn(x*4.01+5.1,y*4.01+3.3);
  const dSeg=(x,y,q)=>{const bx=q[2]-q[0],by=q[3]-q[1],t=Math.max(0,Math.min(1,((x-q[0])*bx+(y-q[1])*by)/(bx*bx+by*by||1)));return Math.hypot(x-q[0]-bx*t,y-q[1]-by*t)};
  let sc=null,scKey=null,scAt=null,t0=performance.now();
  const scOn=()=>{const F=GROUND.scatter;if(/[?&]scatter=0\b/.test(location.search))return false;
    try{if((+localStorage.getItem(GFX_AUTO.key)||0)>0)return false}catch(e){}
    return !(R3D.fps&&R3D.fps<F.minFps)};
  function tuftGeo(){const pos=[];for(let k=0;k<3;k++){const a=k*2.1,c=Math.cos(a),s_=Math.sin(a),w=0.35;pos.push(-c*w,0,-s_*w, c*w,0,s_*w, c*0.15,1,s_*0.15, c*w,0,s_*w, -c*w,0,-s_*w, c*0.15,1,s_*0.15)}   // כל להב פעמיים (שני הצדדים), כדי שהאור יהיה זהה מכל כיוון
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));return up(g)}
  // הנורמל כלפי מעלה: העשב מואר כמו הקרקע שמתחתיו, ולא כהה מהצד
  const up=g=>{const n=g.getAttribute('position').count,a=new Float32Array(n*3);for(let i=0;i<n;i++)a[i*3+1]=1;g.setAttribute('normal',new THREE.BufferAttribute(a,3));return g};
  // רוח: הקודקודים העליונים זזים לפי המקום והזמן. הבסיס נשאר במקום
  function windMat(){const m=new THREE.MeshLambertMaterial(),U={gT:{value:0},gW:{value:GROUND.scatter.wind}};m.userData.u=U;
    m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader='uniform float gT,gW;\n'+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvec4 gI=instanceMatrix*vec4(0,0,0,1);float gS=(sin(gT*1.7+gI.x*0.013+gI.z*0.009)*0.5+sin(gT*3.1+gI.x*0.03)*0.18)*gW;transformed.x+=gS*0.35*position.y;transformed.z+=gS*0.12*position.y;')};
    return m}
  function scBuild(reg){
    const K=GROUND.scatter[reg]||{},grp=new THREE.Group(),geos={tuft:tuftGeo(),flower:up(new THREE.OctahedronGeometry(1,0).translate(0,1.2,0)),pebble:new THREE.IcosahedronGeometry(1,0).scale(1,0.45,1)};
    for(const k of ['tuft','flower','pebble']){if(!K[k]||!K[k].n)continue;
      const m=new THREE.InstancedMesh(geos[k],k==='pebble'?new THREE.MeshLambertMaterial({flatShading:true}):windMat(),K[k].n);
      m.count=0;m.frustumCulled=false;m.userData.k=k;grp.add(m)}
    R3D.scene.add(grp);return grp}
  // שתי שכבות של אותו פיזור: sc על המסך, ו-scB נבנית מאחור, כמה שורות בכל פריים (budget), ואז מתחלפות.
  // בנייה של כל החלון בפריים אחד לקחה 15-25ms כל 320 פיקסלים של הליכה, עצירה קטנה ותדירה ב-120fps (ניר, 7.11)
  function scTwin(g){const b=new THREE.Group();for(const m of g.children){const n=new THREE.InstancedMesh(m.geometry,m.material,m.instanceMatrix.count);n.count=0;n.frustumCulled=false;n.userData.k=m.userData.k;b.add(n)}
    b.visible=false;R3D.scene.add(b);return b}
  const scT={mx:null,q:null,e:null,v:null,s3:null,col:null};
  // מתחילים למלא את החלון סביב (cx,cy) לתוך grp: משבצת לכל cell, ובכל אחת אולי משהו, לפי רעש קבוע. אותו מקום תמיד מקבל אותו דבר
  function scStart(pl,cx,cy,grp){
    if(!scT.mx)Object.assign(scT,{mx:new THREE.Matrix4(),q:new THREE.Quaternion(),e:new THREE.Euler(),v:new THREE.Vector3(),s3:new THREE.Vector3(),col:new THREE.Color()});
    const F=GROUND.scatter,c=F.cell,mesh={};for(const m of grp.children){mesh[m.userData.k]=m;m.count=0}
    const y0=Math.floor((cy-F.win.h/2)/c);
    return{pl,grp,mesh,F,K:F[pl.reg]||{},sg:pl.segs(),pw:pl.pathW*1.1,sin:SIN(),c,blocks:pl.blocks,hw:pl.size.w/2+60,hh_:pl.size.h/2+60,pz:pl.plaza,
      x0:Math.floor((cx-F.win.w/2)/c),x1:Math.ceil((cx+F.win.w/2)/c),j:y0,y1:Math.ceil((cy+F.win.h/2)/c)}
  }
  // ממשיך למלא עד שנגמר החלון או הזמן (ms). מחזיר true כשהחלון מלא
  function scRun(J,ms){
    const {pl,mesh,F,K,sg,pw,sin,c,blocks,hw,hh_,pz,x0,x1}=J,{mx,q,e,v,s3,col}=scT,end=performance.now()+ms;
    for(;J.j<=J.y1;J.j++,J.i=x0){const j=J.j;
     for(let i=J.i??x0;i<=x1;i++){
      if((i&15)===0&&performance.now()>end){J.i=i;return false}   // בודקים את השעון כל 16 משבצות, וממשיכים מאותה משבצת בפריים הבא
      const r=hh(i*1.13,j*0.71),x=(i+hh(i,j+5))*c,y=(j+hh(i+9,j))*c;
      if(pl.round?Math.hypot(x,y)>hw||Math.hypot(x,y)<pl.inner:Math.abs(x)>hw||Math.abs(y)>hh_)continue;   // בכפר: רק בשוליים
      const nb=fbm(x/GROUND.big,y/GROUND.big),cl=fbm(x/90+4,y/90+2);
      // עשב בכתמים העשירים, פרחים בגושים, אבנים בכתמים היבשים
      const k=r<0.6?'tuft':r<0.8?'flower':'pebble',m=mesh[k];if(!m||m.count>=K[k].n)continue;
      const want=k==='pebble'?0.15+0.4*nb:k==='flower'?(cl>0.6?0.9:0.01):0.15+1.1*(1-nb)*(cl>0.42?1:0.45);
      if(hh(i+3,j+7)>want)continue;
      let ok=!pz||Math.hypot(x-pz.x,y-pz.y)>pz.r+pw;for(const s_ of sg)if(ok&&dSeg(x,y,s_)<pw){ok=false;break}
      if(ok&&TR&&tBlocked(x,y))ok=false;   // לא בנהר, ביער או מחוץ לגבול (terrain.js)
      if(ok&&TR)for(const b of TR.map.bridges||[]){const dx=x-b.x,dy=y-b.y,ca=Math.cos(b.a),sa=Math.sin(b.a);if(Math.abs(dx*ca+dy*sa)<b.len/2+20&&Math.abs(-dx*sa+dy*ca)<b.w/2+20){ok=false;break}}   // ולא על הקרשים של גשר
      if(ok)for(const b of blocks)if(b.sq?Math.abs(x-b.x)<b.r&&Math.abs(y-b.y)<b.r:Math.hypot(x-b.x,y-b.y)<b.r){ok=false;break}
      if(!ok)continue;
      const sz=F.size[k],z=sz[0]+(sz[1]-sz[0])*hh(i+1,j+2),wd=k==='tuft'?1.2:1;
      e.set(0,hh(i+4,j+1)*6.28,0);q.setFromEuler(e);s3.set(z*wd,z,z*wd);v.set(x,0,y/sin);mx.compose(v,q,s3);
      m.setMatrixAt(m.count,mx);m.setColorAt(m.count,col.set(K[k].col[Math.floor(hh(i+6,j+3)*K[k].col.length)]).multiplyScalar(0.9+hh(i+2,j+8)*0.2));m.count++;
     }}
    for(const m of J.grp.children){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
    return true;
  }
  let scB=null,scJob=null,scReg=null;
  function scTick(){
    const pl=on()&&P&&place();
    if(!pl||!scOn()){if(sc){sc.visible=false;scB.visible=false}return}
    const reg=pl.reg,k=pl.sk,F=GROUND.scatter,st=F.step;
    // אזור אחר: שכבות חדשות. אותו אזור (מקור נוסף או ירד, זווית מצלמה): אותן שכבות ואותם חומרים, רק ממלאים מחדש.
    // אחרת ה-shader של העשב נזרק ונבנה מחדש באמצע המשחק
    if(reg!==scReg){if(sc){for(const g of [sc,scB])R3D.scene.remove(g);sc.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}})}
      sc=scBuild(reg);scB=scTwin(sc);scReg=reg;scKey=null}
    if(k!==scKey){scKey=k;scJob=null;scAt=sc.children.some(m=>m.count)?{x:1e9,y:1e9}:null}   // כבר יש עשב: בונים מחדש ברקע
    sc.visible=true;scB.visible=false;
    GROUND.fillMs=0;
    // בכניסה (או כשהמקורות השתנו): הכל בבת אחת, כדי שלא יהיה רגע בלי עשב. בהליכה: ברקע, ומתחלפים כשמוכן
    if(!scAt){const t=performance.now();scAt={x:Math.round(P.x/st)*st,y:Math.round(P.y/st)*st};scRun(scStart(pl,scAt.x,scAt.y,sc),1e9);GROUND.fillMs=performance.now()-t}
    else if(!scJob&&(Math.abs(P.x-scAt.x)>st||Math.abs(P.y-scAt.y)>st)){scAt={x:Math.round(P.x/st)*st,y:Math.round(P.y/st)*st};scJob=scStart(pl,scAt.x,scAt.y,scB)}
    if(scJob){const t=performance.now();if(scRun(scJob,F.budget)){const g=sc;sc=scB;scB=g;sc.visible=true;scB.visible=false;scJob=null}GROUND.fillMs=performance.now()-t}
    const tt=(performance.now()-t0)/1000;for(const m of sc.children)if(m.material.userData.u)m.material.userData.u.gT.value=tt;
  }
  // מתחברים לציור: לפני כל ציור מעדכנים את הפיזור (ומסתירים אותו בזירה)
  const base=window.render3d;
  window.render3d=function(...a){try{scTick()}catch(e){GROUND.scFailed=e.message;if(sc){sc.visible=false;scB.visible=false}}return base.apply(this,a)};
})();
