/* משחקי השאול: הגוף של הטנק בקריאת הקרב (s2) ובחומת הברזל (סקיל-על). חבילת הבוקר של אוראל, 9.11.2026, משימות 3 ו-4. רק מראה.
   שני הסקילים פוגעים ברגע ההטלה (moba-kits.js), ולכן הגוף מתחיל באותו פריים ולא מעכב כלום:
   - קריאת קרב: שאגה בפלג הגוף העליון (Taunt, הרגליים ממשיכות), צליל cry_war, וזוהר חום כתום על הגוף כל עוד המגן שלו פעיל (st.armor).
   - חומת ברזל: מכת פטיש מהירה מהשיא אל המגע (Melee_2H_Attack_Chop), החזקה יציבה במגע (hold), ואז חזרה. צליל imp_wall.
   אף פעם לא נעול: זה רק מה שמנגן, ואפשר לזוז ולתקוף באמצע. הצלילים: בגיבור שלך תמיד, בבוט רק כשהוא על המסך ובראייה.
   "פחות אפקטים" והפחתת תנועה: בלי זוהר החום. כיבוי: MBTANK3D.on=false */
const MBTANK3D={
  on:true,kit:'tank',
  taunt:{clip:'Taunt',dur:0.75,sound:'cry_war',heat:{col:'#FF6A2A',k:0.22,amp:0.1,rate:3}},
  wall:{clip:'Melee_2H_Attack_Chop',from:0.42,to:0.66,dur:0.1,hold:0.5,recover:0.35,sound:'imp_wall'},
  stat:{taunts:0,walls:0,sounds:0,heat:0}
};
const MBTK3D_SLOT={s2:'taunt',ult:'wall'};
(function(){
  if(typeof mbCast!=='function')return;
  // ההטלה: הצליל באותו פריים, והגוף מסומן לציור הבא
  const bc=mbCast;mbCast=function(u,slot){const r=bc.apply(this,arguments);
    const id=r&&MBTANK3D.on&&u&&u.k==='hero'&&u.kit===MBTANK3D.kit&&MBTK3D_SLOT[slot];
    if(id){u.tk3d={id,n:((u.tk3d&&u.tk3d.n)||0)+1};MBTANK3D.stat[id+'s']++;
      const C=MBTANK3D[id];if(C.sound&&(u.me||typeof mbfxOn!=='function'||mbfxOn(u.x,u.y))){sfx(C.sound);MBTANK3D.stat.sounds++}}
    return r};
})();
function mbTank3dTick(u,a,dt){
  const T=u.tk3d,st=a.tk3=a.tk3||{n:0,ph:'',x:null,t:0};
  if(T&&T.n!==st.n){st.n=T.n;
    if(T.id==='taunt'){const n=MBTANK3D.taunt.clip+'@up';if(R3D.clips[n])once(a,n,MBTANK3D.taunt.dur)}
    else{const C=MBTANK3D.wall,n=C.clip+'@up';if(R3D.clips[n]){once(a,n,C.dur,true,C.from);const x=act(a,n),D=x.getClip().duration;x.timeScale=D*(C.to-C.from)/C.dur;st.x=x;st.stop=D*C.to;st.ph='hit';st.t=0}}}
  if(st.ph==='hit'&&st.x&&st.x.time>=st.stop){st.x.time=st.stop;st.x.timeScale=0;st.ph='hold';st.t=0}   // מגע: עוצרים ומחזיקים יציב
  else if(st.ph==='hold'){st.t+=dt;if(st.t>=MBTANK3D.wall.hold){st.x.fadeOut(MBTANK3D.wall.recover);st.ph=''}}
}
// זוהר החום על הגוף, אחרי setFlash של אותו פריים (שמחזיר את הזוהר הרגיל)
function mbTank3dHeat(u,a){
  const H=MBTANK3D.taunt.heat;if(!(u.st&&u.st.armor>0)||u.dead)return;
  if((typeof fxLess==='function'&&fxLess())||(typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM))return;
  if(u.flash>0)return;   // הבהוב פגיעה גובר
  const c=a.tkC||(a.tkC=new THREE.Color()),k=H.k+H.amp*Math.sin(MB.t*H.rate*Math.PI*2);c.set(H.col).multiplyScalar(Math.max(0,k));
  for(const m of a.mats)m.emissive.copy(c);MBTANK3D.stat.heat++;
}
(function(){
  const on=u=>MBTANK3D.on&&u&&u.k==='hero'&&u.kit===MBTANK3D.kit;
  if(typeof mb3dUnit==='function'){const bu=mb3dUnit;mb3dUnit=function(e,dt){
    if(!on(e))return bu.apply(this,arguments);let a=R3D.actors.get(e);if(a)mbTank3dTick(e,a,dt);
    const r=bu.apply(this,arguments);a=R3D.actors.get(e);if(a)mbTank3dHeat(e,a);return r}}
  if(typeof syncPlayer==='function'){const bp=syncPlayer;window.syncPlayer=function(dt){
    const u=S.mb&&MB&&MB.me;if(!on(u)||!R3D.player)return bp.apply(this,arguments);mbTank3dTick(u,R3D.player,dt);
    const r=bp.apply(this,arguments);if(R3D.player)mbTank3dHeat(u,R3D.player);return r}}
})();
