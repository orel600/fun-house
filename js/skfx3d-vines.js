/* מתכון הגפנים (vines) בתלת-ממד (ניר, 3.11.2026: "נעשה את כל הסקילים יפים ומגניבים").
   גפנים ירוקות קופצות מהקרקע סביב הגיבור, מתפתלות אל האויבים, נכרכות עליהם ומושכות אותם פנימה.
   עלים ועפר עפים, האדמה נסדקת, ואחרי המשיכה נשארים שורשים שעומדים סביב האויב המושרש עד שהוא משתחרר, ואז נשאבים לאדמה.
   רק ציור: הנזק, המשיכה והשרשה ב-wskbook.js (kind 'pull'). כל המספרים ב-VIN3D.
   כל חוליות הגפנים הן ציור אחד (InstancedMesh). הסקיל עצמו חי 0.35 שניות, ולכן הגפנים ממשיכות ברשימה משלנו (SKFX3D.sources) */
const VIN3D={
  seg:14,max:260,            // כמה חוליות בגפן אחת, וכמה חוליות לכל היותר על המסך
  w:6.4,                     // עובי הגפן
  grow:0.15,                 // כמה זמן לוקח לגפן לפרוץ מהקרקע
  arc:52,wrap:0.55,          // גובה הקשת של הגפן, וכמה היא נכרכת סביב האויב
  wig:{amp:34,f:2.3,spd:3.4},// התפתלות: כמה, כל כמה, ובאיזו מהירות
  base:70,                   // מאיפה הגפן יוצאת מהקרקע סביב הגיבור
  roots:{n:3,h:[34,62],w:4.2,r:0.7},   // שורשים שנשארים סביב האויב
  deco:4,decoLife:0.9,       // גפנים נוספות שמתפתלות באוויר גם בלי אויב
  sink:0.4,                  // כמה זמן הגפן נשאבת לאדמה בסוף
  leaf:{n:10,spd:260},dirt:{n:8,spd:150},
  pal:{earth:{vine:'#2f6b24',tip:'#6fc23a',leaf:'#a8f06a',dirt:'#6b543a',glow:'#c8ff8a'}}
};
(()=>{
  const V=VIN3D;let B=null;
  const SIN=()=>Math.sin(camTilt());
  const hiQ=()=>VFX3D.quality()==='hi';
  // הגפנים חיות גם אחרי שהסקיל נגמר: רשימה משלנו שנרשמת כמקור ב-SKFX3D
  const VIN=[],LIVE=[],AFTER={id:'vines$after'};
  SKFX3D.sources.push(()=>LIVE);
  const flat=g=>g.index?g.toNonIndexed():g;
  function build(){
    if(B||!R3D.ready||!window.THREE)return B;
    const g=flat(new THREE.CylinderGeometry(0.8,1,1,5).translate(0,0.5,0));
    const a=g.attributes.position.array,cl=new Float32Array(a.length);
    for(let i=0;i<a.length/3;i++){const k=1+0.5*a[i*3+1];cl[i*3]=cl[i*3+1]=cl[i*3+2]=k}
    g.setAttribute('color',new THREE.BufferAttribute(cl,3));
    const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({vertexColors:true,fog:false}),V.max);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=4;R3D.scene.add(m);
    B={m,dum:new THREE.Object3D(),up:new THREE.Vector3(0,1,0),a:new THREE.Vector3(),b:new THREE.Vector3(),d:new THREE.Vector3()};return B;
  }
  const pal=o=>V.pal[o.dt]||Object.assign({},V.pal.earth,{vine:o.col,tip:o.col,glow:o.col});

  // גפן אחת: מהקרקע ליד הגיבור אל האויב (או אל נקודה על הקרקע, לגפן קישוט)
  function vine(x0,y0,e,tx,ty,life,c,root){
    VIN.push({x0,y0,e,tx,ty,t:0,life,c,root,sd:Math.random()*6.283,n:V.seg});
    if(!LIVE.length)LIVE.push(AFTER);
  }
  // נקודה על הגפן: f=0 בקרקע, f=1 על האויב. מתפתלת לצדדים, עולה בקשת, ובקצה נכרכת סביב האויב
  function point(v,f,tm,out){
    const tx=v.e&&!v.e.dead?v.e.x:v.tx,ty=v.e&&!v.e.dead?v.e.y:v.ty,top=v.e?Math.max(20,v.e.r*1.1):8;
    const dx=tx-v.x0,dy=ty-v.y0,d=Math.hypot(dx,dy)||1,px=-dy/d,py=dx/d;
    const w=Math.sin(f*Math.PI*V.wig.f+v.sd+tm*V.wig.spd)*V.wig.amp*Math.sin(f*Math.PI);
    let x=v.x0+dx*f+px*w,y=v.y0+dy*f+py*w;
    if(v.e&&f>0.72){const a=(f-0.72)/0.28,an=v.sd+a*Math.PI*1.6,r=v.e.r*V.wrap*a;x=x*(1-a)+(tx+Math.cos(an)*r)*a;y=y*(1-a)+(ty+Math.sin(an)*r)*a}
    out.x=x;out.y=y;out.h=Math.sin(f*Math.PI*0.9)*V.arc+f*f*top;
  }
  let lastF=0;
  const PA={x:0,y:0,h:0},PB={x:0,y:0,h:0};
  function stepVines(dt){
    if(lastF===SKFX3D.f)return;lastF=SKFX3D.f;
    for(let i=VIN.length-1;i>=0;i--){const v=VIN[i];v.t+=dt;
      if(v.e&&v.e.dead&&!v.gone)v.gone=v.t;
      const end=v.gone?Math.min(v.life,v.gone+V.sink):v.life;
      if(v.t>=end){VIN.splice(i,1);continue}
      v.g=Math.min(1,v.t/V.grow);                                  // כמה צמחה
      v.s=Math.min(1,Math.max(0,(v.t-(end-V.sink))/V.sink));       // כמה נשאבת לאדמה
    }
    draw();
  }
  function draw(){
    if(!B)return;const S_=SIN(),d=B.dum,tm=S?S.t:0;let k=0;
    for(const v of VIN){
      const to=Math.ceil(v.n*(1-Math.pow(1-v.g,2.2))),from=Math.floor(v.n*v.s*0.95);
      for(let i=from;i<to&&k<V.max;i++){
        point(v,i/v.n,tm,PA);point(v,(i+1)/v.n,tm,PB);
        B.a.set(PA.x,PA.h,PA.y/S_);B.b.set(PB.x,PB.h,PB.y/S_);B.d.copy(B.b).sub(B.a);
        const len=B.d.length();if(len<0.01)continue;
        d.position.copy(B.a);d.quaternion.setFromUnitVectors(B.up,B.d.divideScalar(len));
        const w=V.w*(1-0.5*i/v.n)*(v.e?1:0.8);d.scale.set(w,len*1.05,w);d.updateMatrix();B.m.setMatrixAt(k++,d.matrix);
      }
      // שורשים שעומדים סביב האויב, אחרי המשיכה
      if(v.root&&v.e&&!v.e.dead&&v.t>V.grow)for(let i=0;i<V.roots.n&&k<V.max;i++){
        const a=v.sd+i*2.1,rr=v.e.r*V.roots.r,h=(V.roots.h[0]+(V.roots.h[1]-V.roots.h[0])*((i*7%10)/10))*(1-v.s)*Math.min(1,(v.t-V.grow)*6);
        if(h<1)continue;
        const x=v.e.x+Math.cos(a)*rr,y=v.e.y+Math.sin(a)*rr;
        d.position.set(x,0,y/S_);d.quaternion.setFromUnitVectors(B.up,B.d.set(Math.cos(a)*0.35,1,Math.sin(a)*0.35/S_).normalize());
        d.scale.set(V.roots.w,h,V.roots.w);d.updateMatrix();B.m.setMatrixAt(k++,d.matrix);
      }
    }
    B.m.count=k;B.m.instanceMatrix.needsUpdate=true;B.m.visible=k>0;
    if(!VIN.length)LIVE.length=0;
  }

  SKFX3D.register('vines',{
    start(o,st){
      build();const c=st.c=pal(o),D=o.D||WSKBOOK.list.vines,life=o.dur+(D.root||2)+0.25;
      if(B)B.m.material.color.set(c.vine);
      const ties=(o.ties||[]).filter(e=>e&&!e.dead);
      for(const e of ties){
        const a=Math.atan2(e.y-P.y,e.x-P.x)+rand(-0.5,0.5);
        vine(P.x+Math.cos(a)*V.base,P.y+Math.sin(a)*V.base*0.7,e,e.x,e.y,life,c,true);
        VFX3D.emit('spark',e.x,e.y,8,{n:V.leaf.n,col:c.leaf,col2:c.vine,spd:V.leaf.spd,up:220,size:10,size2:4,life:[0.4,0.9]});
        VFX3D.emit('puff',e.x,e.y,3,{n:V.dirt.n,col:c.dirt,col2:c.dirt,spd:V.dirt.spd,up:50,size:14,size2:40,life:[0.4,0.8]});
        VFX3D.decal('cracks',e.x,e.y,Math.max(34,e.r*1.8),{life:(D.root||2)*0.9,col:c.glow,a:0.8,fade:0.6});
      }
      // גם בלי אויב רואים גפנים פורצות מהקרקע סביב הגיבור
      for(let i=0;i<VFX3D.many(V.deco);i++){const a=Math.random()*6.283,rr=o.r*rand(0.3,0.8);
        vine(P.x+Math.cos(a)*V.base*0.5,P.y+Math.sin(a)*V.base*0.4,null,P.x+Math.cos(a)*rr,P.y+Math.sin(a)*rr*0.7,V.decoLife,c,false)}
      VFX3D.decal('ring',P.x,P.y,o.r*0.5,{life:0.5,grow:[V.base*0.5,o.r*0.5],col:c.glow,w:0.22,fade:0.7,hdr:1.8});
      VFX3D.emit('puff',P.x,P.y,4,{n:V.dirt.n*2,col:c.dirt,col2:c.dirt,spread:V.base,spd:120,up:40,size:16,size2:46,life:[0.5,1]});
      if(hiQ())VFX3D.light(P.x,P.y,50,c.glow,4,0.8);   // אור ירוק קצר, מתכבה לבד
    },
    frame(o,st,dt){stepVines(dt)}
  });
  // אחרי שהסקיל נגמר: הגפנים ממשיכות לאחוז, ובסוף נשאבות לאדמה
  SKFX3D.register('vines$after',{
    frame(o,st,dt){stepVines(dt)},
    end(){VIN.length=0;LIVE.length=0;if(B){B.m.count=0;B.m.visible=false}}
  });
})();
