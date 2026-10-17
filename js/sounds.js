(function(){
'use strict';
let enabled=true,context=null,releasing=Promise.resolve();const sources=new Set(),voiceOwners=new Set();
try{enabled=localStorage.getItem('readfox-sounds')!=='off';}catch(_){}
const patterns={correct:[[659,.08],[880,.14]],wrong:[[277,.10],[247,.12]],complete:[[523,.10],[659,.10],[784,.10],[1047,.2]],message:[[587,.09]],start:[[440,.055],[660,.055]]};
const log=(event,detail)=>window.ReadFoxAudioLifecycle?.log(event,detail);
window.ReadFoxAudioLifecycle?.registerOutput('effects',()=>({audioContextState:context?.state||'none',sources:sources.size,voiceOwners:[...voiceOwners]}));
function paint(){const button=document.getElementById('soundToggle');if(button){button.textContent=enabled?'♫':'♩';button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Выключить звуковые эффекты':'Включить звуковые эффекты');button.title=enabled?'Звуки включены':'Звуки выключены';}}
function disconnect(item){item.oscillator.onended=null;try{item.oscillator.stop();}catch(_){}try{item.oscillator.disconnect();item.gain.disconnect();}catch(_){}sources.delete(item);}
function release(){
 for(const item of [...sources])disconnect(item);
 const old=context;context=null;
 if(old&&old.state!=='closed'){try{const previous=releasing;releasing=Promise.all([previous,Promise.resolve(old.close())]).then(()=>{log('[AUDIO_CONTEXT_RELEASED]',{owner:'effects',state:old.state});}).catch(()=>{});}catch(_){}}
 return releasing;
}
function setVoiceActive(active,owner='dialogue'){if(active){voiceOwners.add(owner);return release();}voiceOwners.delete(owner);return releasing;}
function play(name){
 if(!enabled||document.hidden||voiceOwners.size||(window.ReadFoxAudioLifecycle?.snapshot().activeRecognizers||0)>0)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  context=context||new Audio();const ctx=context;if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
  let start=ctx.currentTime+.015;
  for(const [frequency,duration] of patterns[name]||patterns.message){
   const oscillator=ctx.createOscillator(),gain=ctx.createGain(),item={oscillator,gain};sources.add(item);
   oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.045,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
   oscillator.connect(gain);gain.connect(ctx.destination);
   oscillator.onended=()=>{disconnect(item);if(!sources.size&&context===ctx)void release();};
   oscillator.start(start);oscillator.stop(start+duration+.02);start+=duration+.025;
  }
 }catch(_){void release();}
}
window.ReadFoxSound=Object.freeze({play,release,setVoiceActive,isEnabled:()=>enabled});
window.addEventListener('pagehide',release);
document.addEventListener('visibilitychange',()=>{if(document.hidden)void release();});
window.addEventListener('readfox:ready',()=>{paint();document.getElementById('soundToggle')?.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('readfox-sounds',enabled?'on':'off');}catch(_){}paint();if(enabled)play('message');else void release();});});
})();