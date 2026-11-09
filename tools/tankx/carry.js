// node carry.js cfg.json out.json : solve per-clip-family hammer offsets (rot on handslotr) so the prop's +y (head) points to a chosen direction in the character frame
const fs=require('fs'),cp=require('child_process');
const [cfgF,outF]=process.argv.slice(2);
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qinv=q=>[-q[0],-q[1],-q[2],q[3]];
const nrm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l)};
function fromTo(a,b){a=nrm(a);b=nrm(b);const c=a[0]*b[0]+a[1]*b[1]+a[2]*b[2];if(c<-0.9999)return [1,0,0,0];const x=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];const q=[x[0],x[1],x[2],1+c];const l=Math.hypot(...q);return q.map(v=>v/l)}
const FAM=JSON.parse(process.env.FAM||'{"Idle_A":[0.4,[-0.2,0.8,-0.55]],"Running_B":[0.3,[-0.2,0.7,-0.65]]}');
const cfg=JSON.parse(fs.readFileSync(cfgF));const row=cfg.rows[0];row.wantHand=true;row.clips=Object.entries(FAM).map(([k,v])=>[k,v[0]]);row.prop.byClip=null;
fs.writeFileSync('cfg_carry_tmp.json',JSON.stringify(cfg));
const out=cp.execFileSync('node',['film.js','cfg_carry_tmp.json','../evidence/_tmp.png','--gpu'],{encoding:'utf8',maxBuffer:1<<26});
const info=JSON.parse(out.trim().split('\n').filter(l=>l.startsWith('[{')).pop())[0];
const table={};
for(const [k,[t,dir]] of Object.entries(FAM)){const h=info.hand[k+'@'+t];if(!h){console.log('no hand for',k);continue}
  const want=fromTo([0,1,0],dir);const rot=qmul(qinv(h.q),want);table[k]={rot:rot.map(v=>+v.toFixed(4)),pos:[0,0,0],handPos:h.p.map(v=>+v.toFixed(3)),dirWorld:dir}}
fs.writeFileSync(outF,JSON.stringify(table,null,1));console.log(JSON.stringify(table))
