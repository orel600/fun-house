/* מתכון רוח המים בתלת-ממד (ניר, 3.11.2026: "נעשה את כל הסקילים יפים ומגניבים").
   ישות מים זוהרת ושקופה מרחפת סביב הגיבור: גוף שקוף, לב בוהק שפועם, שלוש טיפות שמקיפות אותה, ואד וטיפות שנושרות ממנה.
   כשהיא יורה (הלוגיקה ב-wskbook.js, kind 'summon'): קליע מים עם שובל טס לאויב, ובפגיעה התזה, טבעת וכתם רטוב על הקרקע.
   רק ציור: הנזק, הטווח והקצב ב-wskbook.js. את קו הירי הדו-ממדי שהלוגיקה מוסיפה (skLine) אנחנו "מכבים" (t=max), כי הקליע התלת-ממדי מחליף אותו.
   כל המספרים ב-SPR3D */
const SPR3D={
  orbit:{r:54,h:74,spin:1.15,bob:7,bobSpd:2.3,ease:8},   // סביב הגיבור: רדיוס, גובה, מהירות סיבוב, נדנוד, וכמה רך היא עוקבת אחריו
  body:{r:16,core:5.5,pulse:5.2,drops:3,dropR:21,dropSize:3.2,dropSpd:2.4},
  grow:0.35,                                             // שניות של הופעה (וגם של היעלמות בסוף)
  mist:{every:0.065,bub:0.14,drip:0.17},                 // כל כמה שניות אד, בועה וטיפה שנושרת
  light:2.6,
  shot:{spd:760,size:15,hit:14,h:14,trail:{every:7,max:4}},   // הקליע: מהירות, גודל הלב, מרחק שנחשב פגיעה, הגובה שאליו הוא יורד, והשובל
  splash:{r:36,drops:16,ring:0.45,wet:1.6},
  pal:{core:'#dffbff',glow:'#3fb0ff',deep:'#1246c8',mist:'#9fd8ff',wet:'#15385e'},
  stat:{shots:0,splash:0}   // לבדיקה (check.js): כמה קליעים יצאו וכמה התיזו
};
(()=>{
  let B=null;   // הגוף, הלב והטיפות: נבנים פעם אחת ומשמשים שוב
  const sin=()=>Math.sin(camTilt());
  function build(){
    if(B)return B;
    const g=new THREE.IcosahedronGeometry(1,2),mk=(c,a,blend)=>{
      const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(c),transparent:true,opacity:a,blending:blend?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:false,fog:false}));
      m.frustumCulled=false;m.renderOrder=4;m.visible=false;R3D.scene.add(m);return m};
    B={shell:mk(SPR3D.pal.glow,0.45,true),core:mk(SPR3D.pal.core,0.85,true),drops:[]};
    for(let i=0;i<SPR3D.body.drops;i++)B.drops.push(mk(SPR3D.pal.mist,0.7,true));
    return B;
  }
  const show=v=>{if(!B)return;B.shell.visible=B.core.visible=v;for(const d of B.drops)d.visible=v};
  const put=(m,x,y,h,s)=>{m.position.set(x,h,y/sin());m.scale.setScalar(s)};

  SKFX3D.register('spirit',{
    start(o,st){
      build();st.x=P.x;st.y=P.y;st.h=SPR3D.orbit.h;st.tr={};st.shots=[];st.mist=0;st.bub=0;st.drip=0;
      st.light=VFX3D.light(st.x,st.y,st.h,SPR3D.pal.glow,0,Infinity);
    },
    frame(o,st,dt){
      const S0=SPR3D,P0=S0.pal,b=build(),a=o.t*S0.orbit.spin+(o.ph||0),k=o.vis||1;
      // איפה היא: מקיפה את הגיבור על הקרקע (ולא "מעליו" במסך), ומרחפת בגובה. העקיבה רכה, כדי שלא תקפוץ כשהוא נעלם למקום אחר
      const tx=P.x+Math.cos(a)*S0.orbit.r*k,ty=P.y+Math.sin(a)*S0.orbit.r*0.6*k,th=S0.orbit.h+Math.sin(o.t*S0.orbit.bobSpd)*S0.orbit.bob;
      const e=Math.min(1,dt*S0.orbit.ease);
      if(Math.hypot(tx-st.x,ty-st.y)>300){st.x=tx;st.y=ty;st.h=th}   // הגיבור עבר מקום (שער): קופצת איתו ולא גולשת על פני העולם
      else{st.x+=(tx-st.x)*e;st.y+=(ty-st.y)*e;st.h+=(th-st.h)*e}
      // הופעה והיעלמות: גדלה ונעלמת, כדי שלא תצוץ ותיעלם בבת אחת
      const fin=Math.min(1,o.t/S0.grow),fout=Math.min(1,Math.max(0,(o.dur-o.t))/S0.grow),g=fin*fout;
      show(g>0.02);
      const pul=1+0.12*Math.sin(o.t*S0.body.pulse);
      put(b.shell,st.x,st.y,st.h,S0.body.r*k*g*pul);
      put(b.core,st.x,st.y,st.h,S0.body.core*k*g*(2-pul));
      b.shell.rotation.y+=dt*0.9;b.shell.rotation.x+=dt*0.5;
      for(let i=0;i<b.drops.length;i++){const da=a*S0.body.dropSpd+i*6.283/b.drops.length;
        put(b.drops[i],st.x+Math.cos(da)*S0.body.dropR*k,st.y+Math.sin(da)*S0.body.dropR*0.6*k,st.h+Math.sin(da*1.7)*6,S0.body.dropSize*g)}
      if(st.light)st.light.set(st.x,st.y,st.h,S0.light*g);
      // אד, בועות וטיפות שנושרות ממנה. באיכות נמוכה בקצב איטי יותר (פחות חלקיקים)
      const q=VFX3D.quality()==='hi'?1:2.4;
      if((st.mist-=dt)<=0){st.mist=S0.mist.every*q;VFX3D.emit('glow',st.x,st.y,st.h,{n:1,col:P0.core,col2:P0.glow,size:S0.body.r*0.8*k,size2:S0.body.r*1.5*k,life:[0.18,0.3],a:0.22,spd:6,up:4,spread:10,hdr:2})}
      if((st.bub-=dt)<=0){st.bub=S0.mist.bub*q;VFX3D.emit('spark',st.x,st.y,st.h,{n:1,col:P0.mist,col2:P0.glow,size:4,size2:2,spd:26,up:40,grav:-60,drag:1.4,life:[0.5,0.9],spread:14,hdr:2.4})}
      if((st.drip-=dt)<=0){st.drip=S0.mist.drip*q;VFX3D.emit('spark',st.x,st.y,st.h-6,{n:1,col:P0.glow,col2:P0.deep,size:5,size2:2,spd:8,up:-30,grav:-420,drag:0.2,life:[0.35,0.5],hdr:2.4})}
      // ירייה: הלוגיקה מוסיפה קו (skLine) מהמיקום של הסקיל לאויב. לוקחים ממנו את המטרה, מכבים אותו, ושולחים קליע תלת-ממדי
      const fx=S.sk&&S.sk.fx;
      if(fx)for(const f of fx){if(!f.line||f._s3||Math.abs(f.ax-o.x)>3||Math.abs(f.ay-o.y)>3)continue;f._s3=1;f.t=f.max;SPR3D.stat.shots++;
        st.shots.push({x:st.x,y:st.y,h:st.h,bx:f.bx,by:f.by,tr:{}});
        VFX3D.emit('spark',st.x,st.y,st.h,{n:5,col:P0.core,col2:P0.glow,spd:120,up:60,spread:10,life:[0.2,0.35],hdr:2.6})}
      // הקליעים בדרך: שובל מים, ובסוף התזה
      for(let i=st.shots.length-1;i>=0;i--){const s=st.shots[i],dx=s.bx-s.x,dy=s.by-s.y,dh=S0.shot.h-s.h,d=Math.hypot(dx,dy,dh)||1;
        const step=S0.shot.spd*dt;
        if(d<=Math.max(step,S0.shot.hit)){this.splash(s.bx,s.by);st.shots.splice(i,1);continue}
        s.x+=dx/d*step;s.y+=dy/d*step;s.h+=dh/d*step;
        VFX3D.emit('glow',s.x,s.y,s.h,{n:1,raw:1,col:P0.core,col2:P0.glow,size:S0.shot.size,size2:S0.shot.size*0.6,life:[0.06,0.08],hdr:3});
        VFX3D.trail(s.tr,s.x,s.y,s.h,'fire',{every:S0.shot.trail.every,max:S0.shot.trail.max,col:P0.mist,col2:P0.deep,size:13,size2:3,spd:18,up:10,life:[0.2,0.35],a:0.8,hdr:2.2})}
    },
    // התזה: טבעת, הבזק, טיפות לכל הכיוונים וכתם רטוב שמתאדה
    splash(x,y){const P0=SPR3D.pal,S0=SPR3D.splash;SPR3D.stat.splash++;
      VFX3D.burst('ring',x,y,{r:S0.r,col:P0.glow,life:S0.ring,w:0.3});
      VFX3D.burst('flash',x,y,{r:S0.r*0.8,core:P0.core,life:0.16});
      VFX3D.emit('spark',x,y,8,{n:S0.drops,col:P0.core,col2:P0.deep,spd:260,up:230,spread:12,life:[0.25,0.5],hdr:2.6});
      VFX3D.emit('glow',x,y,10,{n:2,col:P0.core,col2:P0.glow,size:S0.r*0.7,size2:S0.r,life:[0.12,0.2],a:0.7,hdr:2.6});
      VFX3D.decal('scorch',x,y,S0.r*0.7,{life:S0.wet,col:P0.wet,a:0.5,fade:0.6});
    },
    end(o,st){show(false);if(st.light){VFX3D.free(st.light);st.light=null}st.shots.length=0}
  });
})();
