/* מתכון ההסתערות (💨 charge) בתלת-ממד. ניר, 3.11.2026: "נעשה את כל הסקילים יפים ומגניבים".
   הגיבור מזנק קדימה, ומשאיר אחריו "רוחות" שלו (afterimage): העתקים שקופים שקפואים בתנוחה שהיתה באותו רגע, ודועכים.
   לאורך המסלול שובל רוח בגובה החזה ואבק בגובה הרגליים, אור לבן-כחול נע איתו, ובסוף פיצוץ אבק עם גל הדף קטן.
   אויב שנפגע בדרך מקבל ניצוצות. רק ציור: הנזק, הטווח והזמן ב-wskbook.js. כל המספרים ב-CHG3D */
const CHG3D={
  ghosts:3,gLife:0.34,gA:0.45,       // כמה רוחות, כמה זמן כל אחת נראית (שניות) וכמה היא שקופה
  wind:{every:9,max:2,h:30,hdr:1.15},        // שובל הרוח: חלקיק כל כמה פיקסלים, לכל היותר בפריים, ובאיזה גובה
  dust:{every:11,max:3},            // אבק מהרגליים
  back:18,                          // כמה מאחורי הגיבור יוצא השובל, כדי שהוא עצמו יישאר נראה
  light:0.8,
  end:{puff:16,smoke:6,spark:24,ring:0.45,r:1.3,hdr:2,flash:0.22},   // בסוף: אבק, עשן, ניצוצות וגל הדף (חלק מהרדיוס)
  hit:{spark:14,puff:3,hdr:2},
  // צבעים: פיזי = רוח ואבק. סוג נזק אחר (רונה) מקבל את הצבע שלו
  pal:{physical:{core:'#ffffff',glow:'#cfe4ff',ghost:'#9ec9ff',dust:'#a89177',dust2:'#5f5141'}}
};
(()=>{
  /* ---- הרוחות: העתק של מודל הגיבור, קפוא בתנוחה של רגע ההעתקה ---- */
  const GH={pool:[],key:null};
  function ghostNew(){
    const a=R3D.player;if(!a||!a.root||!window.THREE||!THREE.SkeletonUtils)return null;
    if(GH.key!==a.key){for(const g of GH.pool)if(g.root.parent)g.root.parent.remove(g.root);GH.pool.length=0;GH.key=a.key}
    for(const g of GH.pool)if(!g.on){g.on=true;g.root.visible=true;return g}
    if(GH.pool.length>=CHG3D.ghosts)return null;
    let root;try{root=THREE.SkeletonUtils.clone(a.root)}catch(e){return null}
    const mat=new THREE.MeshBasicMaterial({color:CHG3D.pal.physical.ghost,transparent:true,opacity:0,depthWrite:false,fog:false});
    const by={};
    root.traverse(o=>{o.frustumCulled=false;if(o.isMesh)o.material=mat;if(o.name)by[o.name]=o});
    const g={root,mat,by,on:true,t:0};root.renderOrder=4;R3D.scene.add(root);GH.pool.push(g);return g;
  }
  // מעתיקים את התנוחה: מקום וסיבוב של הדמות, וכל עצם ועצם. כך הרוח נשארת בתנוחה שהיתה, גם כשהגיבור ממשיך
  function ghostPose(g,col){
    const a=R3D.player;if(!a)return;
    g.root.position.copy(a.root.position);g.root.rotation.copy(a.root.rotation);g.root.scale.copy(a.root.scale);
    a.root.traverse(o=>{const m=o.name&&g.by[o.name];if(!m)return;
      m.visible=o.visible;m.position.copy(o.position);m.quaternion.copy(o.quaternion);m.scale.copy(o.scale)});
    g.t=0;g.mat.color.set(col);g.mat.opacity=CHG3D.gA;
  }
  function ghostFree(g){g.on=false;g.root.visible=false;g.mat.opacity=0}

  SKFX3D.register('charge',{
    start(o,st){
      const c=CHG3D.pal[o.dt]||{core:'#ffffff',glow:o.col,dust:'#8c7a66',dust2:'#4a4038'};st.c=c;
      st.tr={};st.du={};st.seen=new Set();st.gs=[];st.next=0;
      st.light=VFX3D.light(o.fx,o.fy,26,c.glow,CHG3D.light,Infinity);
    },
    frame(o,st,dt){
      const c=st.c,x=P.x,y=P.y;
      // השובל יוצא מאחורי הגיבור, לא עליו
      const ax=Math.atan2(o.ty-o.fy,o.tx-o.fx),bx=x-Math.cos(ax)*CHG3D.back,by=y-Math.sin(ax)*CHG3D.back;
      // רוח חדשה בכל שליש מהדרך
      if(o.t>=st.next&&st.gs.length<CHG3D.ghosts){st.next+=o.dur/CHG3D.ghosts;const g=ghostNew();if(g){ghostPose(g,c.ghost||c.glow);st.gs.push(g)}}
      for(const g of st.gs){if(!g.on)continue;g.t+=dt;g.mat.opacity=Math.max(0,CHG3D.gA*(1-g.t/CHG3D.gLife));if(g.mat.opacity<=0)ghostFree(g)}
      // שובל: רוח בגובה החזה, אבק מהרגליים
      VFX3D.trail(st.tr,bx,by,CHG3D.wind.h,'fire',{every:CHG3D.wind.every,max:CHG3D.wind.max,col:c.core,col2:c.glow,size:10,size2:2,spd:26,up:14,life:[0.12,0.24],a:0.7,hdr:CHG3D.wind.hdr});
      VFX3D.trail(st.du,bx,by,4,'puff',{every:CHG3D.dust.every,max:CHG3D.dust.max,col:c.dust,col2:c.dust2,size:13,size2:38,spd:24,up:26,life:[0.45,0.9],a:0.42});
      if(st.light)st.light.set(x,y,26,CHG3D.light);
      // אויב שנפגע בדרך: ניצוצות ואבק
      if(o.hit)for(const e of o.hit)if(!st.seen.has(e)){st.seen.add(e);
        VFX3D.emit('spark',e.x,e.y,18,{n:CHG3D.hit.spark,col:c.core,col2:c.glow,spd:300,up:150,grav:-900,hdr:CHG3D.hit.hdr});
        VFX3D.emit('puff',e.x,e.y,8,{n:CHG3D.hit.puff,col:c.dust,col2:c.dust2,spread:12,size:12,size2:34})}
    },
    end(o,st){
      const c=st.c,E=CHG3D.end,x=o.tx!=null?o.tx:P.x,y=o.ty!=null?o.ty:P.y,r=o.r;
      // פיצוץ אבק וגל הדף קטן במקום העצירה
      VFX3D.decal('glow',x,y,r*1.1,{life:E.flash,col:c.core,fade:0.9,a:0.35});
      VFX3D.decal('ring',x,y,r*E.r,{life:E.ring,grow:[r*0.3,r*E.r],col:c.glow,w:0.3,fade:0.7,a:0.8});
      VFX3D.emit('puff',x,y,8,{n:E.puff,col:c.dust,col2:c.dust2,spread:r*0.5,spd:r*2.1,up:60,size:24,size2:76,life:[0.55,1.1],a:0.6});
      VFX3D.emit('smoke',x,y,10,{n:E.smoke,col:c.dust,col2:c.dust2,spread:r*0.4,spd:r*0.9,up:46,size:30,size2:96,a:0.4});
      VFX3D.emit('spark',x,y,12,{n:E.spark,col:c.core,col2:c.glow,spd:r*5,spread:r*0.2,hdr:E.hdr});
      for(const g of st.gs)if(g.on)ghostFree(g);
      if(st.light){VFX3D.free(st.light);st.light=null}
    }
  });
})();
