const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const engine=html.slice(html.indexOf('// One shared output'),html.indexOf('function burst'));
const pop=html.slice(html.indexOf('function pop(b)'),html.indexOf('function reset()'));
const listeners={},bubble={popped:false,classList:{contains(name){return name==='bubble'||name==='popped'&&bubble.popped},add(name){if(name==='popped')bubble.popped=true}},setAttribute(){},closest(){return bubble}};
let activated=false,sticky=false,starts=0,contexts=0,blockedResumes=0,releases=[];
class Audio {
 constructor(){contexts++;this.state=sticky?'running':'suspended';this.currentTime=1;this.sampleRate=1000;this.destination={}}
 createGain(){return {gain:{value:0,setValueAtTime(){}},connect(){}}}
 createBuffer(n,len){return {getChannelData:()=>new Float32Array(len)}}
 createBufferSource(){return{playbackRate:{},connect(){},disconnect(){},start:()=>{assert.equal(this.state,'running');starts++},stop(){}}}
 resume(){if(activated){sticky=true;this.state='running';releases.splice(0).forEach(f=>f());return Promise.resolve()}blockedResumes++;return new Promise(resolve=>releases.push(resolve))}
}
const desk={},sandbox={window:{AudioContext:Audio,addEventListener(name,fn){(listeners[name]||=[]).push(fn)}},document:{hidden:false,addEventListener(){},elementFromPoint:()=>bubble},desk,performance:{now:()=>0},setTimeout,clearTimeout,console};
vm.createContext(sandbox);vm.runInContext('let sound=true,ctx,held=false,busy=false,popped=0,total=0;const status={};function update(){}function burst(){}'+engine+pop+'bindBubbleInput();',sandbox);
const event={pointerType:'touch',button:0,isPrimary:true,pointerId:1,clientX:10,clientY:10,target:bubble,detail:1};
async function tap(){desk.onpointerdown(event);activated=true;for(const f of listeners.touchend||[])f(event);for(const f of listeners.pointerup||[])f(event);for(const f of listeners.click||[])f(event);desk.onclick(event);activated=false;await new Promise(resolve=>setImmediate(resolve))}
(async()=>{
 assert.equal(contexts,0,'default enabled must not create audio outside a gesture');
 desk.onpointerdown(event);assert.equal(bubble.popped,false,'touch down must preserve the first native click');assert.equal(contexts,0);
 await tap();assert.equal(starts,1,'first tap must be audible without toggling');assert.equal(blockedResumes,0,'first resume must happen during activation');assert.equal(vm.runInContext('popped',sandbox),1);
 for(const f of listeners.click||[])f(event);desk.onclick(event);await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,1,'compatibility click must not replay the same pop');
 bubble.popped=false;vm.runInContext('ctx.currentTime+=.1;sound=false;stopAudio()',sandbox);await tap();assert.equal(starts,1,'muted tap must stay silent');
 bubble.popped=false;vm.runInContext('sound=true;ctx.state="interrupted";ctx.currentTime+=.1',sandbox);await tap();assert.equal(starts,2,'tap after interruption must recover without toggle');
 bubble.popped=false;vm.runInContext('ctx.currentTime+=.1',sandbox);activated=true;desk.onpointerdown(event);desk.onpointermove({...event,clientX:30});activated=false;await new Promise(resolve=>setImmediate(resolve));const before=starts;for(const f of listeners.pointerup||[])f(event);desk.onclick(event);await new Promise(resolve=>setImmediate(resolve));assert.equal(starts,before,'drag release click must not pop twice');
 console.log('PASS: default first native touch, no premature context, no duplicate click, muted touch, interrupted recovery, drag release');
})().catch(e=>{console.error(e);process.exitCode=1});
