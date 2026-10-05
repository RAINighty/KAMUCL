// Pure observer qualification; actual native gallery playback is separate CI evidence.
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm')
const{installMacParityObserver}=require('./verify-mac-parity-ui.cjs')
const{readMountedEnabledPlaylist,readMountedCarousel,verifyRetainedCarousel}=require('./verify-gallery-favorites-ui.cjs')
function fixture(){
 const playlist=Array.from({length:8},(_,i)=>({path:'builtin:actual-'+i,src:'https://fixture.invalid/image-'+i+'.png'})),rows=[],nodes=[],images=[],hero={querySelectorAll:()=>images}
 for(const item of playlist){const image={src:item.src},checkbox={checked:true},row={querySelector:s=>s==='img'?image:s==='.carousel-enabled input'?checkbox:null},imageVNode={el:image,props:{src:item.src}};rows.push(row);nodes.push({el:row,key:item.path,children:[imageVNode]})}
 const disabled={querySelector:s=>s==='.carousel-enabled input'?{checked:false}:null};rows.push(disabled)
 const home={uid:12,type:{__name:'HomeView'},setupState:{},subTree:{children:[]}},editor={uid:13,type:{__name:'HomeLayoutEditor'},setupState:{},subTree:{children:nodes}},root={children:[{component:home},{component:editor}]}
 const document={baseURI:'https://fixture.invalid/',hidden:false,querySelector:s=>s==='#app'?{__vue_app__:{_container:{_vnode:root}}}:s==='.hero-card'?hero:null,querySelectorAll:s=>s==='.launch-carousel-list>li'?rows:[]},window={__galleryTimers:new Set([1])},context=vm.createContext({window,document,URL})
 vm.runInContext('('+installMacParityObserver.toString()+')()',context)
 const readPlaylist=()=>JSON.parse(JSON.stringify(vm.runInContext('('+readMountedEnabledPlaylist.toString()+')()',context)))
 const read=()=>JSON.parse(JSON.stringify(vm.runInContext('('+readMountedCarousel.toString()+')('+JSON.stringify(readPlaylist())+')',context)))
 const show=current=>{images.length=0;home.subTree.children=[];for(const index of[(current+7)%8,current,(current+1)%8]){const active=index===current,image={src:playlist[index].src,complete:true,naturalWidth:16,classList:{contains:name=>name==='active'&&active}};images.push(image);home.subTree.children.push({el:image,key:playlist[index].path,props:{src:image.src,class:'hero-image'+(active?' active':'')}})}}
 return{playlist,rows,nodes,images,home,editor,window,readPlaylist,read,show}
}
test('Mounted production VNodes with empty setupState and no DOM component expandos expose all eight actual cyclic images read-only',()=>{
 const f=fixture(),before=JSON.stringify(f.nodes);assert.deepEqual(f.readPlaylist(),f.playlist)
 const rotation=[];for(let i=0;i<=8;i++){f.show(i%8);const s=f.read();rotation.push(verifyRetainedCarousel(s,f.playlist.map(p=>p.path)));assert.equal(s.current,i%8);assert.equal(s.upcoming,(i+1)%8);assert.equal(s.outgoing,(i+7)%8);assert.equal(s.images.length,3);assert.equal(s.observer.indexSource,'Original mounted image VNode path key mapped to exact saved playlist');assert.deepEqual(f.home.setupState,{})}
 assert.equal(new Set(rotation.slice(0,8).map(r=>r.current)).size,8);assert.equal(rotation[8].current,rotation[0].current);assert.equal(JSON.stringify(f.nodes),before);assert(!Object.hasOwn(f.images[0],'__vueParentComponent'))
})
test('A wrong mounted key, saved playlist source, active class, missing next or fourth retained layer cannot become carousel proof',()=>{
 for(const change of[f=>{f.home.subTree.children[1].key=7},f=>{f.home.subTree.children[1].key=f.playlist[7].path},f=>{f.home.subTree.children[1].props.src='https://fixture.invalid/wrong.png'},f=>{f.home.subTree.children[1].props.class='hero-image'},f=>{f.images.pop();f.home.subTree.children.pop()},f=>{const image={src:f.playlist[4].src,classList:{contains:()=>false},complete:true,naturalWidth:16};f.images.push(image);f.home.subTree.children.push({el:image,key:f.playlist[4].path,props:{src:image.src,class:'hero-image'}})},f=>{f.nodes[0].children[0].props.src='https://fixture.invalid/wrong.png'}]){const f=fixture();f.show(1);change(f);assert.throws(()=>f.read())}
})
test('Original decoding and complete ordered playlist assertions remain mandatory',()=>{
 const f=fixture();f.show(2);let s=f.read();s.images[0].complete=false;assert.throws(()=>verifyRetainedCarousel(s,f.playlist.map(p=>p.path)),/decode/)
 s=f.read();s.images[0].naturalWidth=0;assert.throws(()=>verifyRetainedCarousel(s,f.playlist.map(p=>p.path)),/decode/)
 assert.throws(()=>verifyRetainedCarousel(f.read(),[...f.playlist.map(p=>p.path)].reverse()),/exact saved order/)
 const source=require('node:fs').readFileSync(require.resolve('./verify-gallery-favorites-ui.cjs'),'utf8');assert(source.includes('rotationStarted<15000'));assert(source.includes('rotationStarted<4000'));assert(source.includes('all eight logical images must rotate'));assert(!source.includes('hero.__vueParentComponent'))
})
