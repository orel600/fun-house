// tiny column-major 4x4 / quaternion helpers (no three dependency)
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}}
class Quaternion{constructor(x=0,y=0,z=0,w=1){this.x=x;this.y=y;this.z=z;this.w=w}}
const Matrix4={
 compose(p,q,s){const {x,y,z,w}=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
  return [(1-(yy+zz))*s.x,(xy+wz)*s.x,(xz-wy)*s.x,0,(xy-wz)*s.y,(1-(xx+zz))*s.y,(yz+wx)*s.y,0,(xz+wy)*s.z,(yz-wx)*s.z,(1-(xx+yy))*s.z,0,p.x,p.y,p.z,1]},
 mul(a,b){const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o},
 invert(m){const n=m.slice(),inv=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];const a=[];for(let r=0;r<4;r++){a.push([m[r],m[4+r],m[8+r],m[12+r],inv[r],inv[4+r],inv[8+r],inv[12+r]])}
  for(let i=0;i<4;i++){let p=i;for(let r=i+1;r<4;r++)if(Math.abs(a[r][i])>Math.abs(a[p][i]))p=r;[a[i],a[p]]=[a[p],a[i]];const d=a[i][i];for(let c=0;c<8;c++)a[i][c]/=d;for(let r=0;r<4;r++)if(r!==i){const f=a[r][i];for(let c=0;c<8;c++)a[r][c]-=f*a[i][c]}}
  const o=new Array(16);for(let r=0;r<4;r++)for(let c=0;c<4;c++)o[c*4+r]=a[r][4+c];return o},
 decompose(m){const sx=Math.hypot(m[0],m[1],m[2]),sy=Math.hypot(m[4],m[5],m[6]),sz=Math.hypot(m[8],m[9],m[10]);
  const r=[m[0]/sx,m[1]/sx,m[2]/sx,m[4]/sy,m[5]/sy,m[6]/sy,m[8]/sz,m[9]/sz,m[10]/sz];
  const tr=r[0]+r[4]+r[8];let q;if(tr>0){const S=Math.sqrt(tr+1)*2;q=[(r[5]-r[7])/S,(r[6]-r[2])/S,(r[1]-r[3])/S,0.25*S]}
  else if(r[0]>r[4]&&r[0]>r[8]){const S=Math.sqrt(1+r[0]-r[4]-r[8])*2;q=[0.25*S,(r[3]+r[1])/S,(r[6]+r[2])/S,(r[5]-r[7])/S]}
  else if(r[4]>r[8]){const S=Math.sqrt(1+r[4]-r[0]-r[8])*2;q=[(r[3]+r[1])/S,0.25*S,(r[7]+r[5])/S,(r[6]-r[2])/S]}
  else{const S=Math.sqrt(1+r[8]-r[0]-r[4])*2;q=[(r[6]+r[2])/S,(r[7]+r[5])/S,0.25*S,(r[1]-r[3])/S]}
  return {p:[m[12],m[13],m[14]],q,s:[sx,sy,sz]}}};
module.exports={Vector3,Quaternion,Matrix4};
