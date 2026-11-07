/* קריאות בקרב, בכפר ובעולם (ניר, 7.11.2026, מהסרטון: "העצים מסתירים את הגיבור", "הגיבור קטן ומוקף אורות, והאויבים נבלעים בדשא").
   1. רואים דרך עצים: עץ, סלע גדול או מבנה שעומד בין המצלמה לגיבור (ולאויבים שלידו) נעשה שקוף בחלקו (~30%) בעיגול רך סביב הגיבור.
      זה נעשה בכרטיס הגרפי (dither: מדלגים על חלק מהפיקסלים בדוגמה קבועה), עם uniform אחד משותף לכל החומרים. בלי עותקים של חומרים ובלי עבודה לכל עץ בכל פריים.
      רק מה שקרוב יותר למצלמה מהגיבור ומעל גובה minY (הקרקע, המים ובסיס הגזע לא נוגעים).
   2. טבעת לבנה עדינה מתחת לגיבור: תמיד יודעים איפה הוא. לבן, כי צבע = סוג נזק וזהב = שלל (CLAUDE.md).
   3. אויבים: צל מגע כהה יותר וקו כהה דק סביב, כדי שיבלטו מהדשא. לאויב עם חולשה, הקו מסביב לטבעת הצבעונית שלו ומבליט אותה.
   האורות המסתובבים (wisps.js) מתעמעמים ומתכווצים כשאויב קרוב: WISPS.calm.
   רק בכפר ובעולם. הזירה (של אוראל) לא משתנה: occK=0 שם, והסימנים החדשים לא מצוירים. עוטף את render3d מבחוץ (syncPlayer, syncEnemy, crowdAdd). ?read=0 מכבה */
const READ3D={
  on:!/[?&]read=0/.test(location.search),
  see:{r:120,edge:0.3,keep:0.3,minY:24,lift:32,near:18,fade:5},   // r: רדיוס העיגול (יחידות משחק) סביב אמצע הגוף. keep: כמה נשאר מהעץ. near: כמה לפני הגיבור מתחיל החיתוך. fade: כמה מהר נדלק בכניסה
  hero:{col:0xF4F7FF,op:0.8,r:22,in:0.72},          // הטבעת מתחת לגיבור: צבע, שקיפות, רדיוס, ועובי (in: הרדיוס הפנימי ביחס)
  foe:{shadow:0.38,sk:1.05,rim:0.6,rk:1.1,rkWeak:1.32,in:0.86}   // אויבים: צל נוסף, קו כהה (rk: רדיוס ביחס ל-e.r*1.15; עם חולשה מחוץ לטבעת שלה)
};
const RD={U:null,seen:new WeakSet(),k:0,stamp:'',n:0,v:null,v2:null};
const rdHere=()=>READ3D.on&&typeof S!=='undefined'&&S&&!S.room&&!S.mb&&!!(S.vil||S.wd);

// החיתוך בכרטיס הגרפי: מוסיף לחומר קיים (Lambert/Standard/Phong) בדיקה בתחילת ה-fragment. uniforms משותפים לכולם
function rdUniforms(){return RD.U||(RD.U={occP:{value:new THREE.Vector2()},occR:{value:1},occZ:{value:0},occK:{value:0},occKeep:{value:READ3D.see.keep},occMinY:{value:READ3D.see.minY},occEdge:{value:READ3D.see.edge}})}
function rdPatch(m){
  if(!m||RD.seen.has(m))return;RD.seen.add(m);
  if(m.transparent||!(m.isMeshLambertMaterial||m.isMeshStandardMaterial||m.isMeshPhongMaterial||m.isMeshToonMaterial))return;
  const prev=m.onBeforeCompile,U=rdUniforms(),pk=m.customProgramCacheKey;
  m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vOccY;').replace('#include <project_vertex>',
      '#include <project_vertex>\n{vec4 ow=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\now=instanceMatrix*ow;\n#endif\nvOccY=(modelMatrix*ow).y;}');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vOccY;uniform vec2 occP;uniform float occR,occZ,occK,occKeep,occMinY,occEdge;\n'+
      'float occB2(vec2 a){a=floor(a);return fract(dot(a,vec2(0.5,a.y*0.75)));}float occB4(vec2 a){return occB2(0.5*a)*0.25+occB2(a);}')
      .replace('void main() {','void main() {\nif(occK>0.001&&vOccY>occMinY&&gl_FragCoord.z<occZ){float d=length(gl_FragCoord.xy-occP);'+
        'float keep=mix(1.0,mix(occKeep,1.0,smoothstep(occR*(1.0-occEdge),occR,d)),occK);if(occB4(gl_FragCoord.xy)>=keep)discard;}')};
  m.customProgramCacheKey=function(){return (pk?pk.call(this):'')+'|occ'};
  m.needsUpdate=true;RD.n++;
}
// מחפשים חומרים חדשים בעולם ובכפר רק כשמשהו השתנה (אזור חדש, מודל שנטען), ולא בכל פריים. אחרי syncWorld/syncVillage ולפני החימום (wldWarm), כדי שהגרסה החדשה תיבנה בחימום
function rdScan(){
  const roots=[];if(S.vil&&R3D.vil)roots.push(R3D.vil.g);if(S.wd&&R3D.wld)roots.push(R3D.wld.g);if(!roots.length)return;
  let st='';for(const g of roots)st+=g.id+':'+g.children.length+':'+(R3D.wld&&R3D.wld.terr?R3D.wld.terr.chunks.length:0)+';';st+=typeof M3D!=='undefined'?M3D.hv:'';
  if(st===RD.stamp)return;RD.stamp=st;
  const ridge=R3D.wld&&R3D.wld.terr&&R3D.wld.terr.ridge;
  for(const g of roots)g.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o===ridge)return;if(Array.isArray(o.material))o.material.forEach(rdPatch);else rdPatch(o.material)});
}
// איפה הגיבור על המסך (בפיקסלים של הציור) ובאיזה עומק: נקרא אחרי שהמצלמה זזה ולפני הציור
function rdFrame(dt){
  const U=rdUniforms(),on=rdHere()&&R3D.player;
  RD.k=Math.max(0,Math.min(1,RD.k+(on?1:-1)*Math.min(dt||0.016,0.05)*READ3D.see.fade));U.occK.value=on?RD.k:0;   // בזירה כבוי מיד
  if(!on)return;
  const c=R3D.cam,r=R3D.r,v=RD.v||(RD.v=new THREE.Vector3()),b=RD.v2||(RD.v2=new THREE.Vector2()),p=R3D.player.root.position,Q=READ3D.see;
  c.updateMatrixWorld();r.getDrawingBufferSize(b);
  // העומק: נקודה קצת לפני הגיבור (לכיוון המצלמה), כדי שעץ שעומד ממש לידו מהצד לא ייחתך
  const dir=c.getWorldDirection(RD.v3||(RD.v3=new THREE.Vector3()));
  v.set(p.x,p.y+Q.lift,p.z).addScaledVector(dir,-Q.near).project(c);U.occZ.value=v.z*0.5+0.5;
  v.set(p.x,p.y+Q.lift,p.z).project(c);const sx=(v.x*0.5+0.5)*b.x,sy=(v.y*0.5+0.5)*b.y;U.occP.value.set(sx,sy);
  v.set(p.x+Q.r,p.y+Q.lift,p.z).project(c);U.occR.value=Math.abs((v.x*0.5+0.5)*b.x-sx);
}

// הסימנים החדשים על הקרקע: באותה שכבה כמו הצל של render3d (R3D.marks), אז הם מתאפסים ונשלחים לכרטיס איתם
function rdMarks(){
  if(!R3D.marks||R3D.marks.hero)return;const N=320,H=READ3D.hero,F=READ3D.foe;
  const mk=(geo,col,op)=>{const m=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false}),N);
    m.count=0;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.renderOrder=1;R3D.scene.add(m);return m};
  R3D.marks.foeShadow=mk(new THREE.CircleGeometry(1,20).rotateX(-Math.PI/2),0x05070d,F.shadow);
  R3D.marks.foeRim=mk(new THREE.RingGeometry(F.in,1,32).rotateX(-Math.PI/2),0x05070d,F.rim);
  R3D.marks.hero=mk(new THREE.RingGeometry(H.in,1,36).rotateX(-Math.PI/2),H.col,H.op);
}
function rdFoe(e,x,z){if(!rdHere())return;const F=READ3D.foe,rr=e.r*1.15*(e.wboss&&typeof GIANT!=='undefined'?GIANT.shadow:1);
  mark('foeShadow',x,z,rr*F.sk);mark('foeRim',x,z,rr*(e.weak?F.rkWeak:F.rk))}

(()=>{if(typeof render3d!=='function')return;
  const sp=syncPlayer;syncPlayer=function(dt){sp.apply(this,arguments);rdMarks();if(!R3D.marks||!R3D.marks.hero)return;
    if(rdHere()&&R3D.player){const p=R3D.player.root.position;mark('hero',p.x,p.z,READ3D.hero.r)}rdFrame(dt)};
  const se=syncEnemy;syncEnemy=function(e){se.apply(this,arguments);const a=R3D.actors.get(e);if(a&&R3D.marks.foeRim&&a.seen===R3D.frame)rdFoe(e,a.root.position.x,a.root.position.z)};
  const sw=syncWorld;syncWorld=function(){sw.apply(this,arguments);if(rdHere())rdScan()};
  const sv=syncVillage;syncVillage=function(){sv.apply(this,arguments);if(rdHere())rdScan()};
  const ca=crowdAdd;crowdAdd=function(e){ca.apply(this,arguments);if(R3D.marks.foeRim)rdFoe(e,R3D._p.x,R3D._p.z)};
})();
