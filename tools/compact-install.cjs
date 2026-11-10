const fs=require('fs');
for(const name of ['Tank','Warrior','Hunter','Mage','Assassin']){
 const key='compact'+name,bin=fs.readFileSync('art/compact/'+name+'Hero.glb');
 fs.writeFileSync('js/m3d/'+key+'.js','m3dPut('+JSON.stringify(key)+','+JSON.stringify(bin.toString('base64'))+');\n');
}
