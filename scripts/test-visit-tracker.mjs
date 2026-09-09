import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/lib/visit-tracker.js',import.meta.url),'utf8').replaceAll('export function','function');
function harness(path='/',dnt='0') {
  const packets=[],listeners={},elements=[{id:'work',tagName:'SECTION'},{id:'services',tagName:'SECTION'}];
  let clock=0,interval,observer,disconnected=false;
  const ctx={location:{pathname:path,hash:''},navigator:{doNotTrack:dnt,maxTouchPoints:0,sendBeacon:(_,blob)=>{packets.push(blob);return true;}},document:{referrer:'https://example.org/private?email=secret@example.org',visibilityState:'visible',documentElement:{scrollHeight:2000},querySelectorAll:()=>elements,addEventListener:(k,v)=>listeners[k]=v,removeEventListener:k=>delete listeners[k]},window:{addEventListener:(k,v)=>listeners[k]=v,removeEventListener:k=>delete listeners[k]},crypto:{randomUUID:()=> 'a2345678-1234-4123-8123-123456789abc'},performance:{now:()=>clock},URL,Blob,innerHeight:1000,scrollY:0,setInterval:fn=>{interval=fn;return 1;},clearInterval:()=>{interval=null;},requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame:()=>{},IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){disconnected=true;}}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  return {ctx,packets,listeners,start:()=>vm.runInContext('startVisitTracking()',ctx),action:name=>ctx.recordVisitAction(name),observe:()=>observer([{target:elements[1],isIntersecting:true}]),advance:ms=>{clock+=ms;interval?.();},isStopped:()=>disconnected&&interval===null};
}
for(const [path,dnt] of [['/studio','0'],['/work-preview','0'],['/','1']]) {const h=harness(path,dnt);h.start()();assert.equal(h.packets.length,0);}
const h=harness();h.action('contact_open');assert.equal(h.packets.length,0,'No tracking before consent starts tracker');
const stop=h.start();assert.equal(h.packets.length,1);
h.ctx.scrollY=800;h.listeners.scroll();h.observe();h.advance(15000);h.action('contact_sent');
let p=JSON.parse(await h.packets.at(-1).text());
assert.equal(p.referrer,'https://example.org');assert.equal(p.depth,80);assert.equal(p.seconds,15);assert.equal(p.last_section,'services');assert.equal(p.contact_sent,true);
h.ctx.document.visibilityState='hidden';h.listeners.visibilitychange();h.advance(120000);
h.ctx.document.visibilityState='visible';h.listeners.visibilitychange();h.advance(15000);
p=JSON.parse(await h.packets.at(-1).text());assert.equal(p.seconds,30,'Hidden tab time excluded');
stop();const count=h.packets.length;h.action('contact_open');h.advance(15000);assert.equal(h.packets.length,count);assert.ok(h.isStopped());assert.equal(Object.keys(h.listeners).length,0);
console.log('Browser tracker: private routes, DNT, consent lifecycle, URL stripping, scroll, section, events, visible time and cleanup passed. No network requests.');
