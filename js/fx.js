/* חגיגה: רגע קצר שמראה שמשהו השתפר. החלטה של ניר: כל התקדמות נראית על המסך.
   כל מערכת קוראת celebrate(x,y,kind,label): מבנה שעלה רמה היום, ובהמשך דרגה ושדרוג נשק.
   שלבים: אבק (dust שניות), ואז פרץ ניצוצות, עמוד אור, תווית שעולה למעלה וצליל קצר.
   מצויר על הקנבס מעל הכל, גם מעל התלת-ממד. קל לטלפון: עיגולים פשוטים בחיבור אור ('lighter'), בלי bloom.
   הזמן כאן הוא זמן אמיתי (performance.now), כי האפקט לא תלוי במצב המשחק */

const CELEBRATE={
  upgrade:{dust:0.7,col:'#F4C74F',burst:34,speed:260,pillar:1.1,pillarW:50,pillarH:240,label:'+1'},
  rank:   {dust:0,  col:'#C7A6FF',burst:50,speed:320,pillar:1.4,pillarW:64,pillarH:320,label:''},
  quest:  {dust:0,  col:'#F4C74F',burst:30,speed:240,pillar:0.9,pillarW:40,pillarH:200,label:'✓'},
  weapon: {dust:0,  col:'#FF8A3D',burst:26,speed:220,pillar:0.8,pillarW:36,pillarH:180,label:'+1'},
  gear:   {dust:0,  col:'#F4C74F',burst:30,speed:240,pillar:0.9,pillarW:44,pillarH:200,label:'+1'},   // פריט טוב יותר במסך הציוד
  // שלל נדיר, אפי ואגדי (loot.js). הצבעים כמו ב-RES.rarity
  loot2:  {dust:0,  col:'#5AA8FF',burst:18,speed:200,pillar:0.6,pillarW:26,pillarH:150,label:''},
  loot3:  {dust:0,  col:'#B48CFF',burst:28,speed:240,pillar:0.8,pillarW:34,pillarH:200,label:''},
  loot4:  {dust:0,  col:'#FFB347',burst:44,speed:300,pillar:1.1,pillarW:46,pillarH:280,label:''}
,
  // Aging בנפחייה (aging.js): ניצוצות בסדן כשמצליחים. כשנכשלים: אפר אפור שנופל, בלי עמוד אור, וצליל עצוב (sound: מזהה ב-SOUNDS)
  aging:  {dust:0.35,col:'#FFB347',burst:56,speed:340,pillar:1.3,pillarW:60,pillarH:300,label:'+1'},
  agingFail:{dust:0.35,col:'#7E8698',burst:22,speed:110,pillar:0,pillarW:0,pillarH:0,label:'-1',sound:'hurt'},
  // בעולם ובכפר אין טקסט גדול על הדמות (docs/plan-hud.md פרק 6): הניצוצות והעמוד נשארים, והכיתוב רק ברגעים הגדולים.
  // bigLabel: הסוגים שהכיתוב שלהם נשאר (רמה חדשה ודרגה, שלל אגדי, מבנה שעלה רמה, אזור חדש). near: עד איזה מרחק מהדמות זה נחשב "על הדמות"
  bigLabel:['rank','loot4','upgrade','travel'], near:110
};
let FX=[];
const fxNow=()=>performance.now()/1000;

// מחזיר כמה שניות עד הפרץ, כדי שמי שקרא יחליף את המראה בדיוק אז (למשל פיגום ← המבנה החדש)
function celebrate(x,y,kind='upgrade',label){
  const K=CELEBRATE[kind]||CELEBRATE.upgrade,f={x,y,K,t0:fxNow(),label:label??K.label,dust:[],burst:[]};
  if(typeof feedOn==='function'&&feedOn()&&!CELEBRATE.bigLabel.some(k=>String(kind).startsWith(k))&&typeof P!=='undefined'&&P&&Math.hypot(x-P.x,y-P.y)<CELEBRATE.near)f.label='';   // בלי טקסט גדול על הדמות
  for(let i=0;i<14;i++)f.dust.push({a:rand(0,6.28),r:rand(20,60),s:rand(8,16),d:rand(0,K.dust*0.6)});
  for(let i=0;i<K.burst;i++){const a=rand(0,6.28),s=rand(K.speed*0.35,K.speed);f.burst.push({vx:Math.cos(a)*s,vy:Math.sin(a)*s-K.speed*0.4,z:rand(2,4.5),life:rand(0.6,1.1)})}
  FX.push(f);
  setTimeout(()=>sfx(K.sound||'celebrate'),K.dust*1000);   // הצליל מ-audio.js, כדי שההשתקה תחול גם עליו
  return K.dust;
}
// נקרא מ-render() בקואורדינטות העולם, אחרי הדמויות
function drawFx(){
  if(!FX.length)return;
  const now=fxNow();
  ctx.save();
  for(const f of FX){
    const K=f.K,age=now-f.t0,b=age-K.dust;
    // אבק: ענני אבק אפורים סביב, בזמן הבנייה
    if(b<0.3)for(const d of f.dust){const a=age-d.d;if(a<0)continue;const k=Math.min(1,a/(K.dust||1));
      ctx.globalAlpha=0.45*(1-k)*Math.min(1,a*6);ctx.fillStyle='#B8B2A6';ctx.beginPath();ctx.arc(f.x+Math.cos(d.a)*d.r*(1+k),f.y+Math.sin(d.a)*d.r*0.5-k*30,d.s*(1+k),0,7);ctx.fill()}
    if(b<0)continue;
    ctx.globalCompositeOperation='lighter';
    // עמוד אור: נפתח מהר ונמוג
    if(b<K.pillar){const k=b/K.pillar,w=K.pillarW*(1-k*0.6),gr=ctx.createLinearGradient(0,f.y-K.pillarH,0,f.y);
      gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,K.col);ctx.globalAlpha=0.55*(1-k);ctx.fillStyle=gr;ctx.fillRect(f.x-w/2,f.y-K.pillarH,w,K.pillarH)}
    // ניצוצות: עפים החוצה ונופלים
    ctx.fillStyle=K.col;
    for(const p of f.burst){if(b>p.life)continue;const k=b/p.life;ctx.globalAlpha=1-k;
      ctx.beginPath();ctx.arc(f.x+p.vx*b*(1-k*0.4),f.y+p.vy*b*(1-k*0.4)+220*b*b,p.z*(1-k*0.5),0,7);ctx.fill()}
    ctx.globalCompositeOperation='source-over';
    // תווית: "+1" שעולה למעלה
    if(f.label&&b<1.4){ctx.globalAlpha=Math.min(1,(1.4-b)*2);ctx.direction='ltr';ctx.textAlign='center';ctx.font='800 '+(26+Math.min(1,b*5)*8)+'px Heebo, system-ui, sans-serif';
      ctx.fillStyle='#0009';ctx.fillText(f.label,f.x+2,f.y-70-b*40+2);ctx.fillStyle=K.col;ctx.fillText(f.label,f.x,f.y-70-b*40)}
  }
  ctx.restore();
  FX=FX.filter(f=>now-f.t0<f.K.dust+1.6);
}
