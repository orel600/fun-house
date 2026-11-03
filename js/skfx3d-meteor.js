/* מתכון המטאור בתלת-ממד (ניר, 3.11.2026: "שהמטאור באמת ייראה כאילו נופל מטאור מהשמיים ומפוצץ על האויבים").
   כדור אש נופל באלכסון מהשמיים לאורך delay, עם שובל אש ועשן ואור שמאיר את הקרקע. על הקרקע סימון וצל שגדל.
   בפגיעה: הבזק, גל הדף, פיצוץ ניצוצות, גחלים ועשן, ומכתש חרוך עם סדקים זוהרים שדועך. שביט קרח (רונה) באותה צורה, בצבעי קרח.
   רק ציור: הנזק, הטווח והזמן ב-wskbook.js. כל המספרים ב-MTR3D */
const MTR3D={
  h:1000,dx:320,dy:-40,      // מאיפה נופל: גובה, והיסט לצד (פיקסלים של המשחק)
  ease:1.7,                  // תאוצה בנפילה (1 = מהירות קבועה)
  size:18,halo:110,           // רדיוס הכדור והזוהר סביבו (למטאור ברדיוס 125, וגדל איתו)
  trail:{every:6,max:16},smoke:{every:14,max:6},
  light:{fall:6,y:40},       // אור כתום בנפילה (עוצמה), ובפגיעה ב-VFX3D_CFG.explode
  mark:0.9,shadow:0.5,       // כמה חזק הסימון והצל על הקרקע
  scorch:{life:3.8,r:0.85,a:0.8,fade:0.35},cracks:{life:2.4,r:0.7},coal:14,
  // צבעים לפי סוג הנזק: אש, וקרח לשביט. סוג אחר: הצבע של סוג הנזק
  pal:{fire:{core:'#fff1c4',glow:'#ff8a2a',deep:'#e8360a',smoke:'#3d332e',smoke2:'#1f1a18',scorch:'#120804'},
       ice: {core:'#f2ffff',glow:'#7fdcff',deep:'#2a7dff',smoke:'#b9d2e2',smoke2:'#7d9bb0',scorch:'#1b2a36'}}
};
SKFX3D.register('meteor',{
  start(o,st){
    const c=MTR3D.pal[o.dt]||{core:'#ffffff',glow:o.col,deep:o.col,smoke:'#4a4a52',smoke2:'#26262c',scorch:'#101014'};st.c=c;
    st.k=o.r/125;st.orb=VFX3D.orb(c.core,MTR3D.size*st.k);st.tr={};st.sm={};
    st.light=VFX3D.light(o.x,o.y,MTR3D.h,c.glow,0,Infinity);
    st.mark=VFX3D.decal('mark',o.x,o.y,o.r,{life:Infinity,col:c.glow,a:MTR3D.mark,p:0,hdr:1.6});
    st.shadow=VFX3D.decal('scorch',o.x,o.y,o.r*0.25,{life:Infinity,col:'#000000',a:0});
  },
  frame(o,st,dt){
    const D=o.D||WSKBOOK.list.meteor,c=st.c,M=MTR3D;
    if(!o.boom){
      const f=Math.min(1,o.t/D.delay),e=Math.pow(f,M.ease),g=1-e;
      const x=o.x+M.dx*st.k*g,y=o.y+M.dy*g,h=8+M.h*g;
      if(st.orb)st.orb.set(x,y,h);
      VFX3D.emit('glow',x,y,h,{n:1,raw:1,col:c.core,col2:c.glow,size:M.halo*st.k,size2:M.halo*st.k*1.1,life:[0.05,0.06]});
      VFX3D.trail(st.tr,x,y,h,'fire',{every:M.trail.every,max:M.trail.max,col:c.core,col2:c.deep,size:34*st.k,size2:6,spd:30,up:20,life:[0.25,0.5]});
      VFX3D.trail(st.sm,x,y,h,'smoke',{every:M.smoke.every,max:M.smoke.max,col:c.smoke,col2:c.smoke2,size:22*st.k,size2:70*st.k,spd:15,up:25,life:[0.8,1.4],a:0.5});
      if(st.light)st.light.set(x,y,h+M.light.y,M.light.fall*(0.3+0.7*f));
      if(st.mark){st.mark.p=f;st.mark.a=M.mark*(0.6+0.4*Math.sin(o.t*18)*Math.sin(o.t*18))}
      if(st.shadow){st.shadow.r=o.r*(0.2+0.6*f);st.shadow.a=M.shadow*f}
    }else if(!st.boom){st.boom=1;
      this.end(o,st);
      VFX3D.burst('explode',o.x,o.y,{r:o.r,col:c.glow,col2:c.deep,core:c.core,smoke:c.smoke,smoke2:c.smoke2,smokeSize:120*st.k});
      VFX3D.decal('scorch',o.x,o.y,o.r*M.scorch.r,{life:M.scorch.life,col:c.scorch,a:M.scorch.a,fade:M.scorch.fade});
      VFX3D.decal('cracks',o.x,o.y,o.r*M.cracks.r,{life:M.cracks.life,col:c.glow,fade:0.7,a:0.9});
      VFX3D.emit('coal',o.x,o.y,3,{n:M.coal,col:c.glow,col2:c.deep,spread:o.r*0.6,spd:40});
    }
  },
  end(o,st){for(const k of ['orb','light','mark','shadow'])if(st[k]){VFX3D.free(st[k]);st[k]=null}}
});
