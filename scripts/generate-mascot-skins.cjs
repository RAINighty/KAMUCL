// Hand-authored Minecraft UV pixel textures reconstructed from the user's
// fourteen front/back references. Cape-obscured clothing is completed in style.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp')
const target=path.resolve(__dirname,'../src/renderer/src/assets/mascot-skins')
const palette={white:'#e6e9e7',gray:'#bdc5c7',black:'#24272a',dark:'#141a1e',skin:'#f5d9cb',red:'#b92632',blue:'#8ecbdf',teal:'#17606b'}
const characters=[
 {id:'q3',hair:['#91c9de','#a6dfe9','#758fb7','#b9e1e8'],shirt:['#27282b','#2c2c2f','#202124'],pants:['#202124','#292a2e','#1b1d20'],hand:'#f7dcd0'},
 {id:'qiqi',hair:['#a8071c','#c40d28','#d51230','#8d0518'],shirt:['#929091','#a6a0a0','#77797a'],pants:['#141516','#202123','#0d1011'],hand:'#f4d4c8'},
 {id:'biyuehu',hair:['#d3d9d8','#e9eeeb','#b6bfc0','#cad3d3'],shirt:['#192628','#253538','#121a1e'],pants:['#152326','#1c2e30','#10191d'],hand:'#ece4d1'},
 {id:'hongshu',hair:['#c79a63','#dcb481','#e7c290','#b28b57'],shirt:['#d7b17c','#e9c599','#c89c68'],pants:['#afb8bb','#c4cdd0','#9eabad'],hand:'#e8d9c6'},
 {id:'kamu',hair:['#e5e6e3','#f2f2ee','#d6d8d5','#ecedeb'],shirt:['#009a9d','#06b1b0','#087d83'],pants:['#392785','#47349e','#2a206d'],hand:'#ae775e'},
 {id:'milo',hair:['#e3e5e2','#f0f1ed','#cdd2d0','#e7ebe8'],shirt:['#292b2b','#353837','#202324'],pants:['#222626','#2d3030','#191d1d'],hand:'#f0d7c3'},
 {id:'muchuanbei',hair:['#d51d28','#e92c32','#b81523','#e5232c'],shirt:['#262b2a','#333736','#1e2323'],pants:['#242928','#313433','#1b2020'],hand:'#292d2c'}
]
function rgb(hex){return hex.replace('#','').match(/../g).map(v=>parseInt(v,16))}
async function generate(c,index){
 const pixels=Buffer.alloc(64*64*4)
 const dot=(x,y,color)=>{const p=(y*64+x)*4,[r,g,b]=rgb(color);pixels[p]=r;pixels[p+1]=g;pixels[p+2]=b;pixels[p+3]=255}
 const fill=(x,y,w,h,color)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)dot(x+dx,y+dy,color)}
 function part(u,v,w,h,d,colors){const faces={top:[u+d,v,w,d],bottom:[u+d+w,v,w,d],left:[u,v+d,d,h],front:[u+d,v+d,w,h],right:[u+d+w,v+d,d,h],back:[u+d+w+d,v+d,w,h]};for(const [name,[x,y,fw,fh]] of Object.entries(faces)){for(let dy=0;dy<fh;dy++)for(let dx=0;dx<fw;dx++){const shade=(Math.floor(dx/2)+Math.floor(dy/3)+index+(name==='back'?1:0))%colors.length;dot(x+dx,y+dy,colors[shade])}}return faces}
 const head=part(0,0,8,8,8,c.hair),body=part(16,16,8,12,4,c.shirt)
 const arms=[part(40,16,4,12,4,c.shirt),part(32,48,4,12,4,c.shirt)]
 const legs=[part(0,16,4,12,4,c.pants),part(16,48,4,12,4,c.pants)]
 const face=(f,side,x,y,w,h,color)=>{const [ox,oy]=f[side];fill(ox+x,oy+y,w,h,color)}
 for(const a of arms)for(const side of ['front','back','left','right'])face(a,side,0,9,4,3,c.hand)
 for(const l of legs)for(const side of ['front','back','left','right'])face(l,side,0,10,4,2,'#171a1c')
 if(c.id==='q3'){
  face(head,'front',0,5,8,3,c.hand);face(head,'front',1,4,1,2,'#872226');face(head,'front',6,4,1,2,'#872226');face(head,'front',3,0,2,6,'#b4e0e6');face(head,'front',0,1,1,5,'#7798b9')
  for(const side of ['front','back','left','right'])face(body,side,0,0,side==='front'||side==='back'?8:4,1,'#9b3934')
  face(body,'front',2,1,1,4,'#a43d35');face(body,'front',5,1,1,4,'#a43d35');face(body,'front',3,1,2,1,c.hand);face(body,'front',3,2,2,3,'#313134')
  for(const a of arms)for(const side of ['front','back','left','right'])face(a,side,0,4,4,1,'#e1e0dd')
  face(legs[0],'front',0,2,1,1,'#e5e4de');face(legs[1],'front',0,1,4,1,'#d0d0cf')
 }else if(c.id==='qiqi'){
  face(head,'front',0,5,8,3,c.hand);face(head,'front',1,5,1,1,'#b00b20');face(head,'front',6,5,1,1,'#b00b20');face(head,'front',3,2,2,4,'#af0922');face(head,'front',0,0,8,1,'#d51230')
  face(body,'front',0,0,2,12,'#7b7d7e');face(body,'front',6,0,2,12,'#7b7d7e');face(body,'front',3,0,2,11,'#b2b1ae');face(body,'front',0,11,8,1,'#171a1b')
  for(const a of arms)for(const side of ['front','back','left','right'])face(a,side,0,0,4,9,'#b9aeaa')
  face(body,'back',0,0,8,8,'#da1030');face(body,'back',0,5,8,4,'#ecd172');face(body,'back',1,4,2,1,'#171d1f');face(body,'back',6,4,2,1,'#171d1f');face(body,'back',3,6,1,1,'#23221b');face(body,'back',5,7,3,1,'#b79548')
  for(const l of legs)for(const side of ['front','back','left','right']){face(l,side,0,9,4,2,'#b50927');face(l,side,0,11,4,1,'#eae5df')}
  for(const side of ['front','back','left','right']){face(legs[0],side,0,1,4,1,'#c5c6c2');face(legs[0],side,0,3,4,1,'#c5c6c2')}
 }else if(c.id==='biyuehu'){
  face(head,'front',0,5,8,3,'#eee6d4');face(head,'front',1,4,2,1,'#45636a');face(head,'front',5,4,2,1,'#45636a');face(head,'front',1,5,2,1,'#74c6d3');face(head,'front',5,5,2,1,'#74c6d3');face(head,'front',3,0,2,5,'#dde4e1')
  face(body,'front',3,0,2,8,'#161e22');face(body,'front',3,5,2,3,'#bccbc8');face(body,'front',1,4,1,3,'#39838b');face(body,'front',6,3,1,4,'#2a6a73');face(body,'front',3,10,2,2,'#d7e2dc')
  face(body,'back',1,2,1,6,'#294d55');face(body,'back',6,2,1,6,'#294d55');face(body,'back',2,9,4,1,'#416768')
  for(const a of arms)for(const side of ['front','back','left','right']){face(a,side,0,6,4,1,'#55939b');face(a,side,0,10,4,2,'#152123')}
  for(const l of legs){face(l,'left',1,2,1,6,'#15396a');face(l,'right',1,2,1,6,'#15396a');face(l,'back',0,10,4,1,'#6c7470')}
 }else if(c.id==='hongshu'){
  face(head,'front',1,2,6,6,'#f1d1a4');face(head,'front',1,2,6,1,'#503323');face(head,'front',3,3,2,2,'#e8bb38');face(head,'front',1,4,2,2,'#b9553c');face(head,'front',5,4,2,2,'#b9553c');face(head,'front',2,6,4,2,'#fff1d6')
  face(body,'front',2,0,4,11,'#eee9df');face(body,'front',1,0,1,11,'#a7402d');face(body,'front',6,0,1,11,'#a7402d');face(body,'back',1,0,1,10,'#b19b79');face(body,'back',6,0,1,10,'#b19b79');face(body,'back',2,8,4,1,'#b65332')
  for(const a of arms)for(const side of ['front','back','left','right']){face(a,side,0,4,4,7,'#e4d8c2');face(a,side,0,9,4,1,'#aa462d')}
  for(const l of legs)for(const side of ['front','back','left','right']){face(l,side,0,2,4,1,'#ebdccb');face(l,side,0,3,4,1,'#a5492c');face(l,side,0,4,4,4,'#e9d8c5');face(l,side,0,8,4,4,'#aaa08f');face(l,side,0,11,4,1,'#6b5847')}
 }else if(c.id==='kamu'){
  face(head,'front',0,4,8,4,'#744336');face(head,'front',1,3,1,1,'#735954');face(head,'front',6,3,1,1,'#735954');face(head,'front',3,2,2,1,'#e9bdc0');face(head,'front',2,6,4,1,'#59302b');face(head,'front',0,7,2,1,'#ece8e2')
  face(body,'front',1,0,2,4,'#f2eeeb');face(body,'front',5,0,2,4,'#f2eeeb');face(body,'back',1,2,2,6,'#078f91');face(body,'back',5,2,2,6,'#078f91');face(body,'back',2,7,4,2,'#078f91')
  for(const a of arms)for(const side of ['front','back','left','right'])face(a,side,0,4,4,8,c.hand)
  for(const l of legs)for(const side of ['front','back','left','right'])face(l,side,0,10,4,2,'#545754')
 }else if(c.id==='milo'){
  face(head,'front',1,3,6,5,c.hand);face(head,'front',2,3,2,2,'#6b4837');face(head,'front',5,3,1,1,'#6b4837');face(head,'front',1,5,1,2,'#287d60');face(head,'front',6,5,1,2,'#287d60');face(head,'front',0,0,2,2,'#252829');face(head,'top',0,0,2,3,'#252829');face(head,'top',6,0,2,3,'#252829');face(head,'back',0,0,2,1,'#202526');face(head,'back',6,0,2,1,'#202526')
  face(body,'front',1,0,6,10,'#e2e6e2');face(body,'front',2,1,1,2,'#d8869e');face(body,'front',5,1,1,2,'#d8869e');face(body,'back',2,2,4,6,'#343a38');face(body,'back',1,10,6,1,'#151a1c')
  for(const a of arms)for(const side of ['front','back','left','right'])face(a,side,0,10,4,2,c.hand)
 }else{
  face(head,'front',0,0,8,3,'#3b3d43');face(head,'front',0,3,8,1,'#6a6f79');face(head,'front',1,4,6,4,'#d4e0e3');face(head,'front',2,5,1,2,'#233439');face(head,'front',5,5,1,2,'#233439');face(head,'front',3,7,2,1,'#c7953f');face(head,'left',0,2,3,3,'#d5dee0');face(head,'right',5,2,3,3,'#d5dee0');face(head,'back',0,7,8,1,'#e0dfd7')
  face(body,'front',2,2,4,10,'#cbdde3');for(const side of ['front','back']){face(body,side,0,0,8,1,'#305729');face(body,side,0,1,8,1,'#811f24');face(body,side,0,2,8,1,'#305729')};for(let y=2;y<9;y++)face(body,'front',5,y,2,1,y%2?'#841e23':'#305729')
  for(const l of legs)for(const side of ['front','back','left','right'])face(l,side,0,11,4,1,'#af7e32')
 }
 await sharp(pixels,{raw:{width:64,height:64,channels:4}}).png().toFile(path.join(target,c.id+'.png'))
}
fs.mkdirSync(target,{recursive:true})
Promise.all(characters.map(generate)).then(()=>process.stdout.write('Seven hand-authored 64×64 Minecraft skin textures generated.\n')).catch(error=>{process.stderr.write(error.stack);process.exitCode=1})
