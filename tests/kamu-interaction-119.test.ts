import test from 'node:test'
import assert from 'node:assert/strict'
import {KamuInteraction} from '../src/shared/kamuInteraction'

test('Kamu accepted clicks contact once at 75ms after the 180ms turn, then return front',()=>{
 const animation=new KamuInteraction()
 assert.equal(animation.accept(0),true)
 assert.equal(animation.advance(179).contacts.length,0)
 assert.equal(animation.advance(180).yaw,Math.PI)
 assert.equal(animation.advance(254).contacts.length,0)
 assert.deepEqual(animation.advance(255).contacts,[255])
 assert.equal(animation.advance(255).contacts.length,0)
 assert.equal(animation.queued,0)
 assert.equal(animation.advance(710).yaw,0)
 assert.equal(animation.busy,false)
})
test('Kamu queue limit is exact and dropped render frames preserve every accepted contact',()=>{
 const animation=new KamuInteraction()
 for(let i=0;i<32;i++)assert(animation.accept(0))
 assert.equal(animation.accept(0),false)
 const frame=animation.advance(10000)
 assert.equal(frame.contacts.length,32)
 assert.deepEqual(frame.contacts,Array.from({length:32},(_,i)=>255+i*150))
 assert.equal(animation.busy,false)
 assert.equal(animation.advance(10001).contacts.length,0)
})
test('Kamu pause keeps the timeline frozen; resume shifts contact and queue without loss',()=>{
 const animation=new KamuInteraction();animation.accept(0);animation.pause(150)
 assert.equal(animation.advance(5000).contacts.length,0)
 animation.resume(5150)
 assert.equal(animation.advance(5254).contacts.length,0)
 assert.deepEqual(animation.advance(5255).contacts,[5255])
})
test('Kamu click during return reverses smoothly and reduced motion preserves exact contacts',()=>{
 const animation=new KamuInteraction();animation.accept(0);animation.advance(620)
 const before=animation.advance(620).yaw;animation.accept(620)
 assert(Math.abs(before-animation.advance(620).yaw)<1e-8)
 assert.equal(animation.advance(1500).contacts.length,1)
 const reduced=new KamuInteraction();reduced.accept(0);reduced.accept(0)
 assert.deepEqual(reduced.advance(1000,true).contacts,[76,226])
 assert.equal(reduced.busy,false)
})
