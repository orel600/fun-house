// emissive map from a base-colour image: keeps only the glowing orange/yellow texels (lava cracks, lantern, sun core). node API: makeEmissive(srcPath,size,{thr,gain})
const sharp=require('sharp');
async function makeEmissive(src,size,o={}){const thr=o.thr??(+process.env.ETHR||0.3),gain=o.gain??1.0,{data,info}=await sharp(src).resize(size,size).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const out=Buffer.alloc(data.length);let n=0;
 for(let i=0;i<data.length;i+=3){const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,lum=0.3*r+0.59*g+0.11*b;
  const warm=r>g*1.12&&g>b*1.15&&r>0.38;const m=warm?Math.min(1,Math.max(0,(lum-thr)/0.15)):0;if(m>0)n++;
  out[i]=Math.min(255,data[i]*m*gain);out[i+1]=Math.min(255,data[i+1]*m*gain);out[i+2]=Math.min(255,data[i+2]*m*gain)}
 console.log('emissive texels',(100*n/(data.length/3)).toFixed(2)+'%');
 return sharp(out,{raw:{width:info.width,height:info.height,channels:3}}).jpeg({quality:90}).toBuffer()}
module.exports={makeEmissive};
if(require.main===module){makeEmissive(process.argv[2],1024,{thr:+process.argv[4]||undefined}).then(b=>require('fs').writeFileSync(process.argv[3],b))}
// albedo lift: v' = 255*(v/255)^(1/gamma)*bright (real LUT; sharp.gamma barely changes dark textures)
async function liftTexture(src,size,{gamma=1,bright=1}={}){const lut=Buffer.alloc(256);for(let i=0;i<256;i++)lut[i]=Math.min(255,Math.round(255*Math.pow(i/255,1/gamma)*bright));
 const {data,info}=await sharp(src).resize(size,size).removeAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i++)data[i]=lut[data[i]];
 return sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).jpeg({quality:88}).toBuffer()}
module.exports.liftTexture=liftTexture;
