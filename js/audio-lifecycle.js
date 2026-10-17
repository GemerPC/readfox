/* Shared microphone ownership for Speaking and Dialogue, plus optional text-free diagnostics
   (off by default; enable with ReadFoxAudioLifecycle.diagnostics(true)). */
(function(){
'use strict';
const nav=window.navigator||{};
const isIOS=/iPad|iPhone|iPod/.test(nav.userAgent||'')||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
const captures=new Map(),providers=new Map(),history=[];let sequence=0,enabled=false,settle=500,settleUntil=0,micCount=0;
function snapshot(){
 const outputs={};for(const [name,fn] of providers){try{outputs[name]=fn();}catch(_){outputs[name]={unavailable:true};}}
 return {appOwnedActiveTracks:0,browserOwnedActiveTracks:null,trackStates:[],tracksExposed:false,activeRecognizers:captures.size,recognizers:[...captures].map(([id,c])=>({id,owner:c.owner,state:c.state})),outputs};
}
function log(event,detail){
 const entry={event,time:Date.now(),...snapshot(),...(detail||{})};history.push(entry);if(history.length>400)history.shift();
 if(enabled)console.log(event,entry);
}
function beginMic(owner){const id=owner+'-'+(++sequence);micCount++;let resolve;const done=new Promise(r=>resolve=r);captures.set(id,{owner,state:'requesting',resolve,done});log('[MIC_REQUEST]',{captureId:id});return id;}
function micEvent(id,event){const c=captures.get(id);if(!c)return;c.state=event;
 const tag={started:'[MIC_STARTED]','audio-started':'[MIC_STARTED]',stopping:'[MIC_STOPPING]','audio-ended':'[MIC_AUDIO_END]'}[event]||'[MIC_EVENT]';log(tag,{captureId:id,captureEvent:event});}
function endMic(id,detail){const c=captures.get(id);if(!c)return;captures.delete(id);if(isIOS)settleUntil=Date.now()+settle;
 log('[MIC_TRACK_STOPPED]',{captureId:id,action:'not-applicable',reason:'SpeechRecognition owns opaque capture; no MediaStream tracks are exposed to this app.'});
 log('[MIC_STREAM_RELEASED]',{captureId:id,...detail,physicalAudioRoute:'not-observable'});c.resolve(true);}
function waitForMicrophones(){
 const afterRelease=()=>{const delay=Math.max(0,settleUntil-Date.now());return delay?new Promise(resolve=>setTimeout(()=>resolve(true),delay)):true;};
 if(!captures.size)return settleUntil>Date.now()?afterRelease():null;
 let timer;return Promise.race([Promise.all([...captures.values()].map(c=>c.done)).then(afterRelease),new Promise(resolve=>{timer=setTimeout(()=>{log('[MIC_RELEASE_TIMEOUT]');resolve(false);},3500);})]).finally(()=>clearTimeout(timer));
}
window.ReadFoxAudioLifecycle=Object.freeze({isIOS,log,beginMic,micEvent,endMic,waitForMicrophones,snapshot,history:()=>history.slice(),micGeneration:()=>micCount,registerOutput:(name,fn)=>providers.set(name,fn),
 diagnostics:value=>{enabled=Boolean(value);},
 settleMs:()=>isIOS?settle:0,
 setSafariDelay:ms=>{if(![100,300,500,1000].includes(ms))throw new Error('Use 100, 300, 500 or 1000 ms');settle=ms;log('[SAFARI_DELAY]',{milliseconds:ms});return ms;}
});
})();