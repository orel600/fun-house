import json,struct,numpy as np
DT={5126:'<f4',5123:'<u2',5125:'<u4',5121:'u1',5122:'<i2'};NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
class GLB:
 def __init__(self,p):
  b=open(p,'rb').read();l=struct.unpack_from('<I',b,12)[0];self.j=json.loads(b[20:20+l]); self.bin=bytearray(b[28+l:])
 def acc(self,n):
  a=self.j['accessors'][n];v=self.j['bufferViews'][a['bufferView']];return np.ndarray((a['count'],NC[a['type']]),DT[a['componentType']],self.bin,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',NC[a['type']]*np.dtype(DT[a['componentType']]).itemsize),np.dtype(DT[a['componentType']]).itemsize))
 def save(self,p):
  j=json.dumps(self.j,separators=(',',':')).encode();j+=b' '*((-len(j))%4);b=bytes(self.bin);b+=b'\0'*((-len(b))%4);open(p,'wb').write(struct.pack('<III',0x46546c67,2,28+len(j)+len(b))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(b),0x004e4942)+b)
