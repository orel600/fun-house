/* מתכון מטר החצים (volley) בתלת-ממד (ניר, 3.11.2026: "נעשה את כל הסקילים יפים ומגניבים").
   גלים של חצים זוהרים יורדים מהשמיים באלכסון עם שובל, ננעצים באדמה ונשארים לרגע, ואז שוקעים ונעלמים.
   בכל נעיצה אבק וניצוצות, ועל הקרקע עיגול מטרה שפועם כל עוד המטר נמשך, עם טבעת שנפתחת בהתחלה ואור רך באמצע.
   רק ציור: הנזק, הטווח והזמן ב-wskbook.js (kind 'zone'). כל המספרים ב-VOL3D.
   כל החצים הם ציור אחד (InstancedMesh), ולכן אפשר עשרות בלי לעמוס. באיכות נמוכה: פחות חצים, בלי שובל ובלי אור */
const VOL3D={
  h:430,dx:-250,dy:-140,     // מאיפה החצים באים: גובה, והיסט לצד (פיקסלים של המשחק)
  fly:0.34,                  // כמה זמן חץ בדרך
  wave:0.13,per:{hi:2,lo:1}, // כל כמה זמן גל, וכמה חצים בגל
  max:52,                    // כמה חצים לכל היותר (באוויר ובקרקע יחד)
  len:54,w:2.9,              // אורך החץ ועובי הגוף
  stick:0.85,sink:0.5,       // כמה זמן נשאר נעוץ, וכמה זמן שוקע לאדמה
  trail:{every:16,max:3},
  dust:5,spark:4,            // חלקיקים בכל נעיצה
  mark:0.5,light:{i:7,y:50,fall:2.5},
  // צבעים לפי סוג הנזק: פיזי הוא ברירת המחדל, וסוג אחר צבוע בצבע שלו
  pal:{physical:{body:'#6b5637',glow:'#ffeaa6',dust:'#6d5d48'}}
};
(()=>{
  const V=VOL3D;let B=null;
  const SIN=()=>Math.sin(camTilt());
  const hiQ=()=>VFX3D.quality()==='hi';
  // חצים שממשיכים לחיות גם אחרי שהסקיל נגמר (הנעוצים): רשימה משלנו שנרשמת כמקור ב-SKFX3D
  const ARR=[],LIVE=[],AFTER={id:'volley$after'};
  SKFX3D.sources.push(()=>LIVE);

  // גיאומטריה של חץ: גוף מחודד (החוד בראשית הצירים) ונוצה בקצה האחורי, הכל לאורך +Y. חיבור ידני, בלי תוספות
  function arrowGeo(){
    const flat=g=>g.index?g.toNonIndexed():g;
    const a=flat(new THREE.ConeGeometry(V.w,V.len,5).rotateX(Math.PI).translate(0,V.len/2,0));
    const b=flat(new THREE.ConeGeometry(V.w*2.4,V.len*0.3,4).translate(0,V.len*0.82,0));
    const pa=a.attributes.position.array,pb=b.attributes.position.array;
    const pos=new Float32Array(pa.length+pb.length);pos.set(pa);pos.set(pb,pa.length);
    // צבע לכל קודקוד: הגוף רגיל, הנוצה בהירה (זוהרת ב-bloom)
    const cl=new Float32Array(pos.length);
    for(let i=0;i<pos.length/3;i++){const k=i*3<pa.length?1:2.6;cl[i*3]=cl[i*3+1]=cl[i*3+2]=k}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(cl,3));return g;
  }
  function build(){
    if(B||!R3D.ready||!window.THREE)return B;
    const m=new THREE.InstancedMesh(arrowGeo(),new THREE.MeshBasicMaterial({vertexColors:true,fog:false}),V.max);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=4;R3D.scene.add(m);
    B={m,dum:new THREE.Object3D(),up:new THREE.Vector3(0,1,0),dir:new THREE.Vector3()};
    return B;
  }
  const pal=o=>{const p=V.pal[o.dt];return p||{body:o.col,glow:'#ffffff',dust:'#6d5d48'}};

  // כל החצים זזים פעם אחת בפריים, גם אם יש שתי הטלות במקביל (SKFX3D.f הוא מספר הפריים)
  let lastF=0;
  function stepArrows(dt){
    if(lastF===SKFX3D.f)return;lastF=SKFX3D.f;
    for(let i=ARR.length-1;i>=0;i--){
      const a=ARR[i];a.t+=dt;
      if(!a.land){
        const f=Math.min(1,a.t/V.fly);a.x=a.x0+(a.tx-a.x0)*f;a.y=a.y0+(a.ty-a.y0)*f;a.h=a.h0*(1-f);
        if(hiQ())VFX3D.trail(a.tr,a.x,a.y,a.h,'fire',{every:V.trail.every,max:V.trail.max,col:a.c.glow,col2:a.c.body,size:11,size2:2,spd:6,up:0,grav:0,life:[0.12,0.26]});
        if(f>=1){a.land=1;a.t=0;a.x=a.tx;a.y=a.ty;a.h=0;
          VFX3D.emit('puff',a.x,a.y,3,{n:V.dust,col:a.c.dust,col2:a.c.dust,size:10,size2:26,spd:60,up:40,life:[0.3,0.6]});
          VFX3D.emit('spark',a.x,a.y,4,{n:V.spark,col:a.c.glow,col2:a.c.body,spd:170,up:150,life:[0.2,0.4]});
          if(a.lt)a.lt.hit=1}
      }else if(a.t>V.stick){const f=Math.min(1,(a.t-V.stick)/V.sink);a.h=-V.len*f*0.9;if(f>=1){ARR.splice(i,1);continue}}
    }
    draw();
  }
  function draw(){
    const b=B;if(!b)return;const S_=SIN(),d=b.dum;
    for(let i=0;i<ARR.length;i++){const a=ARR[i];
      b.dir.set(a.x0-a.tx,a.h0,(a.y0-a.ty)/S_).normalize();   // הגוף פונה אחורה, לכיוון שממנו בא
      d.position.set(a.x,a.h,a.y/S_);d.quaternion.setFromUnitVectors(b.up,b.dir);d.scale.setScalar(1);d.updateMatrix();b.m.setMatrixAt(i,d.matrix);
    }
    b.m.count=ARR.length;b.m.instanceMatrix.needsUpdate=true;b.m.visible=ARR.length>0;
  }
  function shoot(o,st){
    if(ARR.length>=V.max)return;
    const an=Math.random()*6.283,rr=Math.sqrt(Math.random())*o.r*0.95;
    const tx=o.x+Math.cos(an)*rr,ty=o.y+Math.sin(an)*rr;
    ARR.push({tx,ty,x0:tx+V.dx,y0:ty+V.dy,h0:V.h,x:tx+V.dx,y:ty+V.dy,h:V.h,t:0,land:0,tr:{},c:st.c,lt:st});
    if(!LIVE.length)LIVE.push(AFTER);
  }

  const R={
    start(o,st){
      build();st.c=pal(o);st.next=0;
      if(B)B.m.material.color.set(st.c.body);   // הגוף בצבע הזה, והנוצה בגרסה בהירה שלו (צבע הקודקודים)
      st.mark=VFX3D.decal('mark',o.x,o.y,o.r,{life:Infinity,col:st.c.glow,a:V.mark,p:0.35,hdr:1.2});
      VFX3D.decal('ring',o.x,o.y,o.r,{life:0.5,grow:[o.r*0.2,o.r],col:st.c.glow,w:0.2,fade:0.7,hdr:1.5});
      st.light=VFX3D.light(o.x,o.y,V.light.y,st.c.glow,0,Infinity);
    },
    frame(o,st,dt){
      const n=hiQ()?V.per.hi:V.per.lo;
      if(o.t<o.dur-V.fly*0.5){st.next-=dt;if(st.next<=0){st.next=V.wave;for(let i=0;i<n;i++)shoot(o,st)}}
      if(st.mark){st.mark.p=0.25+0.2*Math.sin(o.t*9);st.mark.a=V.mark*Math.min(1,(o.dur-o.t)*2.5)}
      if(st.light){st.i=Math.max(0,(st.i||0)-dt*V.light.fall)+(st.hit?V.light.i:0);st.hit=0;st.light.set(o.x,o.y,V.light.y,Math.min(V.light.i,st.i))}
      stepArrows(dt);
    },
    end(o,st){for(const k of ['mark','light'])if(st[k]){VFX3D.free(st[k]);st[k]=null}}
  };
  SKFX3D.register('volley',R);
  // אחרי שהסקיל נגמר: החצים הנעוצים ממשיכים לשקוע לבד
  SKFX3D.register('volley$after',{
    frame(o,st,dt){stepArrows(dt);if(!ARR.length)LIVE.length=0},
    end(){ARR.length=0;LIVE.length=0;if(B){B.m.count=0;B.m.visible=false}}
  });
})();
