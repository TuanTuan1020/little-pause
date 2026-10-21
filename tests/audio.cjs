const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.slice(html.indexOf('// One shared output'),html.indexOf('function burst'));
function fixture(state='running',behavior='resolve'){
 let starts=0,resumes=0,stops=0,releases=[],instance;
 class Audio {constructor(){instance=this;this.state=state;this.sampleRate=1000;this.currentTime=1;this.destination={}}createGain(){return{gain:{value:0,setValueAtTime(v){this.value=v}},connect(){}}}createBuffer(n,len){return{getChannelData:()=>new Float32Array(len)}}createBufferSource(){return{playbackRate:{},connect(){},disconnect(){},start(){assert.equal(instance.state,'running');starts++},stop(){stops++}}}resume(){resumes++;if(behavior==='reject')return Promise.reject(new Error('denied'));if(behavior==='defer')return new Promise(resolve=>releases.push(()=>{this.state='running';resolve()}));this.state='running';return Promise.resolve()}}
 const sandbox={window:{AudioContext:Audio,addEventListener(){}},document:{hidden:false,addEventListener(){}},performance:{now:()=>0},setTimeout,clearTimeout,console:{warn(){}}};vm.createContext(sandbox);vm.runInContext('let sound=true,ctx,held=false;'+code,sandbox);
 return{run:s=>vm.runInContext(s,sandbox),get starts(){return starts},get resumes(){return resumes},get stops(){return stops},release:()=>releases.splice(0).forEach(f=>f()),tick:()=>instance.currentTime+=.03};
}
(async()=>{
 let f=fixture();await f.run('audio()');assert.equal(f.starts,1);assert.equal(f.resumes,0);
 f=fixture('suspended','defer');let pending=f.run('audio()');assert.equal(f.starts,0);f.release();await pending;assert.equal(f.starts,1);
 f=fixture('interrupted');await f.run('audio()');assert.equal(f.resumes,1);assert.equal(f.starts,1);
 f=fixture('suspended','defer');pending=f.run('audio()');f.run('sound=false;stopAudio()');f.release();await pending;assert.equal(f.starts,0);
 f=fixture('suspended','reject');await f.run('audio()');assert.equal(f.starts,0);
 f=fixture();for(let i=0;i<30;i++){await f.run('audio()');f.tick()}assert.equal(f.run('voices.size'),5);assert.equal(f.stops,25);f.run('sound=false;stopAudio()');assert.equal(f.run('voices.size'),0);assert.equal(f.run('master.gain.value'),0);
 f=fixture();await f.run('audio()');await f.run('audio()');assert.equal(f.starts,1);
 f=fixture();f.run('document.hidden=true');await f.run('audio()');assert.equal(f.starts,0);
 console.log('PASS: 8 audio scenarios (running, async resume, interrupted, mute race, rejected resume, voice cap, rapid input, hidden page)');
})().catch(e=>{console.error(e);process.exitCode=1});
