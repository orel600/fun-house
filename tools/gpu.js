/* כרטיס מסך אמיתי בבדיקות המקומיות (QUINN, 9.11.2026, אחרי ש-MAX גילה שהכלים רצו בתוכנה גם במחשב עם RTX 2070).
   ברירת המחדל של Chromium ב-Playwright היא SwiftShader (ציור במעבד), ולכן תלת-ממד כאן לא אמר כלום על הטלפון.
   הפעלה: הדגל --gpu בכלי (check.js, perf-arena.js, skill-shots.js, moba-skill-shots.js), או FH_GPU=1 בסביבה.
   בלי הדגל שום דבר לא משתנה, וגם ב-GitHub (שם אין כרטיס מסך) ההתנהגות זהה לקודם.
   הדגלים: --use-angle=d3d11 (ציור דרך DirectX), --ignore-gpu-blocklist, ו---force_high_performance_gpu שבוחר את הכרטיס החזק
   (NVIDIA) ולא את ה-Intel המשולב, בלי לדעת את ה-LUID שלו (הוא משתנה אחרי אתחול). נבדק במחשב של אוראל: ANGLE (NVIDIA, GeForce RTX 2070, D3D11) */
const GPU_ARGS=['--use-angle=d3d11','--ignore-gpu-blocklist','--force_high_performance_gpu'];
const gpuOn=()=>process.argv.includes('--gpu')||process.env.FH_GPU==='1';
// extra: דגלים נוספים של הכלי. gpu: כמו gpuOn(), אפשר לכפות. משאיר את שאר האפשרויות (channel וכו') כמו שהן
function launchOpts(extra=[],base={}){return {...base,args:[...(gpuOn()?GPU_ARGS:[]),...extra]}}
// שם הכרטיס שהדף באמת מקבל. אם ביקשו --gpu והתקבל SwiftShader או llvmpipe: מזהירים, כדי שלא יקראו מספרים של תוכנה כמספרים של כרטיס
async function renderer(page){
  return page.evaluate(()=>{try{const c=document.createElement('canvas'),g=c.getContext('webgl2')||c.getContext('webgl');if(!g)return'אין WebGL';
    const e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)}catch(e){return'שגיאה: '+e}});
}
const isSoft=r=>/swiftshader|llvmpipe|software|basic render/i.test(r||'');
async function report(page,tag){
  const r=await renderer(page);
  if(gpuOn()&&isSoft(r))console.error('⚠ '+(tag||'')+' ביקשו --gpu אבל Chromium מצייר בתוכנה: '+r);
  return r;
}
module.exports={GPU_ARGS,gpuOn,launchOpts,renderer,isSoft,report};
