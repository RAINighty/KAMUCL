// Raster asset preparation only: split the generated sheet, resize, and separate animation layers.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
async function prepare(manifest){
 const output='src/renderer/src/assets/mascots';fs.mkdirSync(output,{recursive:true});
 for(const entry of manifest){
  const meta=await sharp(entry.file).metadata(),half=Math.floor(meta.width/2);
  for(const [view,left,width] of [['front',0,half],['back',half,meta.width-half]]){
   const halfImage=await sharp(entry.file).extract({left,top:0,width,height:meta.height}).png().toBuffer();
   const image=await sharp(halfImage).trim({threshold:20}).resize(240,400,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
   await sharp(image).toFile(path.join(output,entry.id+'-'+view+'.png'));
   if(view==='back')for(const [layer,top,height] of [['head',0,174],['body',174,112],['legs',286,114]]){
    await sharp(image).extract({left:0,top,width:240,height}).extend({top,bottom:400-top-height,left:0,right:0,background:{r:0,g:0,b:0,alpha:0}}).png().toFile(path.join(output,entry.id+'-'+layer+'.png'));
   }
  }
 }
}
prepare(JSON.parse(fs.readFileSync(process.argv[2]||'out/mascot-manifest.json','utf8'))).catch(e=>{console.error(e);process.exitCode=1});
