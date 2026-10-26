/* ReadFox: live AI conversations with bounded history and local progress. */
(() => {
'use strict';
const STORAGE='readfox.dialogue.v1';
const topics={
 cafe:{title:'В кафе',icon:'☕',description:'Напитки, вкусы и разговор за столиком.',words:[['coffee','кофе'],['water','вода'],['please','пожалуйста'],['bill','счёт'],['menu','меню'],['table','стол']]},
 meet:{title:'Знакомство',icon:'👋',description:'Расскажи о себе и узнай собеседника.',words:[['name','имя'],['friend','друг'],['read','читать'],['work','работать'],['music','музыка'],['country','страна']]},
 travel:{title:'Путешествие',icon:'🚆',description:'Обсуди поездку, билеты и новые места.',words:[['ticket','билет'],['station','станция'],['train','поезд'],['hotel','отель'],['bag','сумка'],['tomorrow','завтра']]},
 daily:{title:'Каждый день',icon:'🌤️',description:'Привычки, интересы и планы на завтра.',words:[['morning','утро'],['breakfast','завтрак'],['home','дом'],['evening','вечер'],['read','читать'],['walk','гулять']]},
 personal:{title:'Мои слова',icon:'📒',description:'Живой разговор со словами из твоих текстов.',words:[['learn','учить'],['friend','друг'],['home','дом'],['read','читать'],['travel','путешествовать'],['morning','утро']]}
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cut=(v,n)=>typeof v==='string'?v.slice(0,n):'';
const bridge=()=>window.ReadFoxBridge||{};
const level=()=>window.ReadFoxAcademy?.getLevel?.()||'A1';
const sound=()=>window.ReadFoxSound?.play('message');
let voice=null,voiceState={supported:!!(window.SpeechRecognition||window.webkitSpeechRecognition)&&!!window.speechSynthesis&&!!window.SpeechSynthesisUtterance&&window.isSecureContext!==false,active:false,phase:'idle',interim:'',message:''};
let state={version:2,selectedTopic:'cafe',session:null},controller=null,requestNumber=0,busy=false,error='',shown=new Set(),hintShown=false;
const micIcon='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
function getVoice(){
 if(!voice&&window.ReadFoxDialogueVoice)voice=window.ReadFoxDialogueVoice.create({
  canListen:()=>!!state.session&&!state.session.completed&&!state.session.pending&&!busy&&!document.hidden&&!!document.querySelector('.view[data-view="dialogue"]:not(.hidden)'),
  onState:snapshot=>{voiceState=snapshot;paintVoice();},
  onTranscript:text=>{
   const s=state.session;if(!s||s.completed||s.pending||busy||!voiceState.active)return;
   text=[s.draft.trim(),text.trim()].filter(Boolean).join(' ');
   if(text.length>800){s.draft=text.slice(0,800);voice.pause('Фраза слишком длинная. Проверь первые 800 символов и отправь их.');save();render(true);return;}
   s.draft=text;send(true);
  }
 });return voice;
}
function lastReply(){return [...(state.session?.messages||[])].reverse().find(m=>m.role==='bot')?.text||'';}
function enableVoice(replay=false){
 const s=state.session;if(!s||s.pending||s.completed||busy)return;
 window.ReadFoxVoice?.stop?.();window.ReadFoxPlayback?.stop?.();
 const control=getVoice();if(!control){bridge().toast?.('Голосовой режим недоступен в этом браузере. Можно написать ответ.');return;}
 control.start(replay||voiceState.phase==='idle'?lastReply():undefined);
}
let phraseSynth=null,sayingId=0;
function sayPhrase(id){
 const m=state.session?.messages.find(x=>x.id===id),value=m?.text?.trim();if(!value)return;
 window.ReadFoxVoice?.stop?.();window.ReadFoxPlayback?.stop?.();
 sayingId=id;document.querySelectorAll('.dlg-say').forEach(b=>b.classList.toggle('is-saying',Number(b.dataset.dialogueSay)===id));
 const control=voiceState.supported?getVoice():null;
 if(control?.say){control.say(value);return;}
 // Without speech recognition there is no voice controller, so the phrase goes straight to the dialogue voice.
 try{phraseSynth=phraseSynth||window.ReadFoxDialogueAudio?.createSynthesizer()||window.speechSynthesis;phraseSynth.cancel?.();const u=new SpeechSynthesisUtterance(value);u.lang='en-US';u.rate=.9;u.onend=u.onerror=()=>{sayingId=0;document.querySelectorAll('.dlg-say.is-saying').forEach(b=>b.classList.remove('is-saying'));};phraseSynth.speak(u);}
 catch{sayingId=0;bridge().toast?.('Озвучка недоступна в этом браузере.');}
}
function recoverVoiceSound(){
 const s=state.session;if(!s||s.completed||busy||s.pending)return;
 pauseForTyping();const control=getVoice();if(control)control.recover(lastReply());
}
function pauseForTyping(){
 if(!voiceState.active)return;
 const s=state.session,input=document.getElementById('dialogueInput'),heard=voiceState.interim;
 if(s&&heard){s.draft=[s.draft.trim(),heard.trim()].filter(Boolean).join(' ').slice(0,800);if(input)input.value=s.draft;save();}
 voice?.pause('Микрофон на паузе. Можно исправить фразу или написать ответ.');
 syncSend();
}

let settingsOpen=false,logShown=false,followLog=true,autoScrollUntil=0,logObserver=null,seenSession='',busyShown=false;
const seen=new Set();
const fit=t=>{const n=String(t||'').length;return n<=60?'is-xl':n<=120?'is-l':n<=220?'is-m':'is-s';};
const reduceMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const slidersIcon='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>';
const bulbIcon='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2v.2h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>';
// The live screen follows the visual viewport, so the composer stays above the on-screen keyboard.
function fitViewport(){
 const vv=window.visualViewport,root=document.documentElement;
 if(!vv||!document.body.classList.contains('dialogue-live')){root.style.removeProperty('--dlg-vh');root.style.removeProperty('--dlg-top');return;}
 root.style.setProperty('--dlg-vh',vv.height+'px');root.style.setProperty('--dlg-top',vv.offsetTop+'px');
}
function applyLive(){const on=!!state.session&&!state.session.completed&&!!document.querySelector('.view[data-view="dialogue"]:not(.hidden)');document.body.classList.toggle('dialogue-live',on);fitViewport();}
function nearEnd(log){return log.scrollHeight-log.scrollTop-log.clientHeight<64;}
function jumpButton(show){const b=document.getElementById('dialogueJump');if(b)b.hidden=!show;}
function scrollToEnd(smooth=true){
 const log=document.getElementById('dialogueMessages');if(!log)return;
 followLog=true;jumpButton(false);const animate=smooth&&!reduceMotion();autoScrollUntil=animate?Date.now()+700:0;
 log.scrollTo({top:log.scrollHeight,behavior:animate?'smooth':'auto'});
}
function sizeSlides(log){log.style.setProperty('--dlg-slide',log.clientHeight+'px');}
// Follow new content only while the reader is on the last slide; scrolling back pauses auto-scroll.
function watchLog(log){
 logObserver?.disconnect();logObserver=null;if(!log)return;
 const stopAuto=()=>{autoScrollUntil=0;};log.addEventListener('wheel',stopAuto,{passive:true});log.addEventListener('touchstart',stopAuto,{passive:true});
 log.addEventListener('scroll',()=>{if(Date.now()<autoScrollUntil)return;followLog=nearEnd(log);jumpButton(!followLog);},{passive:true});
 if(!window.ResizeObserver)return;let first=true;
 logObserver=new ResizeObserver(()=>{sizeSlides(log);if(first){first=false;return;}if(followLog&&Date.now()>=autoScrollUntil)scrollToEnd(true);});
 logObserver.observe(log);if(log.firstElementChild)logObserver.observe(log.firstElementChild);
}
function settingsMarkup(s){
 const audio=window.ReadFoxDialogueAudio,a=audio?.settings()||{engine:'system',boost:'off'},system=a.engine==='system';
 const seg=(name,value,label,current,off)=>`<button type="button" class="dlg-seg" data-dialogue-${name}="${value}" aria-pressed="${current===value}" ${off?'disabled':''}>${label}</button>`;
 return `<div class="dlg-sheet${settingsOpen?' is-open':''}" id="dialogueSettings" role="region" aria-label="Настройки диалога" ${settingsOpen?'':'inert'}><div class="dlg-sheet-body"><section><div class="dlg-sheet-head"><span>Слова для разговора</span><strong>${s.used.length} / ${s.deck.length}</strong></div><div class="dialogue-words">${s.deck.map(w=>chip(w,s.used.includes(w.key))).join('')}</div></section><section class="dlg-sheet-row"><div class="dlg-setting"><span>Голос Фокса</span><div class="dlg-segmented">${seg('engine','audio','Улучшенный',a.engine,!audio?.supported)}${seg('engine','system','Системный',a.engine,false)}</div></div><div class="dlg-setting"><span>Громкость</span><div class="dlg-segmented">${seg('boost','off','Обычная',a.boost,system)}${seg('boost','loud','Громче',a.boost,system)}${seg('boost','max','Максимум',a.boost,system)}</div></div></section><section class="dlg-sheet-actions"><button type="button" class="dlg-action" data-dialogue-action="voice-again">↻ Прослушать ответ</button><button type="button" class="dlg-action" data-dialogue-action="theme">☾ Оформление</button><button type="button" class="dlg-action" data-dialogue-action="exit">Другая тема</button></section><p class="dlg-sheet-meta">${esc(topics[s.topic].title)} · ${esc(level())} · проверки ${s.correct} / ${s.checked}</p></div></div>`;
}
function syncSettings(){
 const a=window.ReadFoxDialogueAudio?.settings();if(!a)return;
 document.querySelectorAll('#dialogueSettings [data-dialogue-engine]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.dialogueEngine===a.engine)));
 document.querySelectorAll('#dialogueSettings [data-dialogue-boost]').forEach(x=>{x.setAttribute('aria-pressed',String(x.dataset.dialogueBoost===a.boost));x.disabled=a.engine==='system';});
}
function toggleSettings(open=!settingsOpen){
 settingsOpen=open;const sheet=document.getElementById('dialogueSettings');if(sheet){sheet.classList.toggle('is-open',open);sheet.inert=!open;}
 document.querySelector('[data-dialogue-action="settings"]')?.setAttribute('aria-expanded',String(open));
}
function headerMarkup(s){
 const pct=Math.round(s.used.length/Math.max(1,s.deck.length)*100);
 return `<header class="dlg-header"><button type="button" class="dlg-brand" data-dialogue-action="learn" aria-label="ReadFox — на главную"><svg class="brand-mark" aria-hidden="true"><use href="#i-logo"/></svg><span class="brand-name">read<b>fox</b></span></button><span class="dlg-topic-title">${esc(topics[s.topic].title)}</span><div class="dlg-mic-wrap"><button type="button" class="dlg-mic" data-dialogue-action="voice-toggle" aria-pressed="false">${micIcon}<span class="sr-only">Начать голосом</span></button><span class="dlg-mic-caption" id="dialogueVoiceTitle" aria-hidden="true"></span></div><button type="button" class="dlg-settings-btn" data-dialogue-action="settings" aria-expanded="${settingsOpen}" aria-controls="dialogueSettings" aria-label="Настройки диалога" title="Настройки диалога">${slidersIcon}</button><div class="dlg-progress" role="progressbar" aria-label="Использовано слов" aria-valuemin="0" aria-valuemax="${s.deck.length}" aria-valuenow="${s.used.length}"><span style="width:${pct}%"></span></div><span id="dialogueVoiceStatus" class="sr-only" role="status" aria-live="polite"></span>${settingsMarkup(s)}</header>`;
}
function syncSend(){
 const s=state.session,b=document.getElementById('dialogueSend');if(!b||!s)return;
 const finishing=voiceState.active&&voiceState.phase==='listening'&&!!voiceState.interim&&!s.draft.trim();
 b.disabled=busy||s.pending||!(s.draft.trim()||finishing);b.setAttribute('aria-label',finishing?'Отправить сказанную фразу':'Отправить ответ');
}
function paintVoice(){
 const chatEl=document.querySelector('#dialogueContent .dialogue-chat');if(!chatEl)return;
 const s=state.session,active=voiceState.active,phase=voiceState.phase,supported=voiceState.supported;
 chatEl.dataset.phase=phase;chatEl.classList.toggle('is-voice-active',active);
 if(sayingId&&!['starting','loading-audio','speaking'].includes(phase))sayingId=0;
 chatEl.querySelectorAll('.dlg-say').forEach(b=>b.classList.toggle('is-saying',!!sayingId&&Number(b.dataset.dialogueSay)===sayingId));
 const names={idle:'',starting:'Подключаю…',listening:'Слушаю…',thinking:'Фокс думает…',speaking:'Фокс говорит','loading-audio':'Готовлю голос',paused:'Пауза',error:'Нужна помощь'};
 const caption=document.getElementById('dialogueVoiceTitle');if(caption)caption.textContent=names[phase]||'';
 const unsupported='Распознавание недоступно. Используй Safari на iPhone или Chrome на компьютере. Можно общаться текстом.';
 const status=document.getElementById('dialogueVoiceStatus');if(status)status.textContent=voiceState.message||(!supported?unsupported:active?(phase==='listening'?'Говори по-английски. Пауза — и ответ отправится.':phase==='speaking'?'Микрофон выключен, пока говорит Фокс.':'Можно поставить разговор на паузу.'):'');
 // Routine status already shows next to the mic; the line above the composer is for pauses and problems.
 const notice=document.getElementById('dialogueVoiceNotice'),showNotice=!!voiceState.message&&['paused','error'].includes(phase);if(notice){notice.hidden=!showNotice;notice.textContent=showNotice?voiceState.message:'';}
 const interim=document.getElementById('dialogueVoiceInterim');if(interim){interim.hidden=!voiceState.interim;const said=interim.querySelector('.dlg-slide-text');said.textContent=voiceState.interim||'';said.className='dlg-slide-text '+fit(voiceState.interim);}
 const toggle=chatEl.querySelector('[data-dialogue-action="voice-toggle"]');
 if(toggle){const label=!supported?unsupported:active?'Выключить микрофон':phase==='idle'?'Начать голосом':'Продолжить голосом';toggle.disabled=!supported||(!active&&(busy||s?.pending));toggle.setAttribute('aria-pressed',String(active));toggle.querySelector('span').textContent=label;toggle.title=label;}
 const again=chatEl.querySelector('[data-dialogue-action="voice-again"]');if(again)again.disabled=!supported||busy||s?.pending||!lastReply();
 const input=document.getElementById('dialogueInput');if(input)input.placeholder=busy?'Фокс пишет…':active?(phase==='listening'?'Говори по-английски…':'Нажми, чтобы написать…'):supported?'Напиши или скажи…':'Напиши ответ…';
 syncSend();
}


function containsWord(value,key){const normalize=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' -]+/g,' ').replace(/\s+/g,' ').trim();return (' '+normalize(value)+' ').includes(' '+normalize(key)+' ');}
function sessionId(){return 'dialogue-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
function legacySessionId(s){let hash=2166136261;const source=JSON.stringify([s.topic,(s.deck||[]).map(w=>w.key),(s.messages||[]).slice(0,10).map(m=>[m.role,m.text])]);for(const c of source){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return 'dialogue-legacy-'+(hash>>>0).toString(16);}
function updateUsed(s){const text=[...(s.memory||[]).filter(m=>m.role==='user').map(m=>m.content),...s.messages.filter(m=>m.role==='user').map(m=>m.text)];for(const w of s.deck)if(!s.used.includes(w.key)&&text.some(t=>containsWord(t,w.key)))s.used.push(w.key);}
function isComplete(s){return s.deck.length>0&&s.deck.every(w=>s.used.includes(w.key));}
function complete(s,play=false){
 if(!isComplete(s))return;if(voiceState.active)voice?.stop();const wasComplete=s.completed;s.id=s.id||sessionId();s.completed=true;s.pending=false;s.hint='';error='';applyLive();
 if(controller){requestNumber++;controller.abort();controller=null;busy=false;}
 save();const xp=window.ReadFoxAcademy?.awardDialogue?.(s.id,s.deck.length);if(Number.isFinite(xp)){s.rewardXp=xp;save();}
 if(play&&!wasComplete)window.ReadFoxSound?.play('complete');
}
function completedMarkup(s){return '<section class="dialogue-completion"><div class="dialogue-completion-trophy" aria-hidden="true">🏆</div><span class="dialogue-kicker">ДИАЛОГ ЗАВЕРШЁН</span><h1>Все слова — в разговоре!</h1><p>Ты использовал весь набор в своих репликах. Слова уже засчитаны — повторять их не нужно.</p><div class="dialogue-completion-stats"><div><strong>+'+(s.rewardXp||0)+' XP</strong><span>Награда за беседу</span></div><div><strong>'+s.used.length+' / '+s.deck.length+'</strong><span>Слов использовано</span></div><div><strong>'+s.turns+'</strong><span>Твоих реплик</span></div></div><div class="dialogue-words">'+s.deck.map(w=>'<div class="dialogue-word is-used"><strong>'+esc(w.key)+'</strong><span>'+esc(w.translation)+'</span></div>').join('')+'</div><div class="dialogue-completion-actions"><button class="dialogue-primary" data-dialogue-action="topics">Новый диалог →</button><button class="dialogue-link" data-dialogue-action="learn">К обучению</button></div><details class="dialogue-completed-history"><summary>Посмотреть переписку</summary>'+s.messages.map(m=>'<div class="dialogue-message is-'+m.role+'"><div class="dialogue-bubble"><span class="dialogue-sender">'+(m.role==='bot'?'Фокс · ИИ':m.role==='user'?'Ты':'Подсказка')+'</span><p>'+esc(m.text)+'</p>'+(m.ru?'<p class="dialogue-translation">'+esc(m.ru)+'</p>':'')+'</div></div>').join('')+'</details></section>';}
function compactMemory(entries){
 const unique=new Map();for(const m of Array.isArray(entries)?entries:[]){if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string')continue;const content=m.content.slice(0,350);unique.set(m.role+'\n'+content,{role:m.role,content});}
 const all=[...unique.values()];return all.length>32?[...all.slice(0,8),...all.slice(-24)]:all;
}
function requestContext(s){
 const turns=s.messages.filter(m=>m.role==='bot'||m.role==='user');let begin=turns.length,chars=0;
 while(begin>0&&turns.length-begin<39&&chars+turns[begin-1].text.length<=18000){begin--;chars+=turns[begin].text.length;}
 const asMessage=m=>({role:m.role==='bot'?'assistant':'user',content:m.text,check:!!m.check,targetWord:m.targetWord||''});
 return {memory:compactMemory([...(s.memory||[]),...turns.slice(0,begin).map(asMessage)]),messages:turns.slice(begin).map(asMessage)};
}
function insertWord(word){
 pauseForTyping();const input=document.getElementById('dialogueInput'),s=state.session;if(!s){bridge().speak?.(word);return;}if(!input||input.disabled)return;
 const start=input.selectionStart??input.value.length,end=input.selectionEnd??start,before=input.value.slice(0,start),after=input.value.slice(end);
 const left=before&&!/[\s(\[]$/.test(before)?' ':'',right=!after||/^[\w]/.test(after)?' ':'';
 const inserted=left+word+right;if(before.length+inserted.length+after.length>800){bridge().toast?.('В сообщении можно использовать до 800 символов.');return;}
 input.setRangeText(inserted,start,end,'end');input.focus({preventScroll:true});input.dispatchEvent(new Event('input',{bubbles:true}));
}
function clean(input){
 const result={version:2,selectedTopic:Object.hasOwn(topics,input?.selectedTopic)?input.selectedTopic:'cafe',session:null};
 if(input?.version!==2||!input.session||!Object.hasOwn(topics,input.session.topic))return result;
 const s=input.session;
 const deck=(Array.isArray(s.deck)?s.deck:[]).slice(0,8).filter(w=>w&&/^[a-z][a-z' -]{0,45}$/i.test(w.key)&&typeof w.translation==='string').map(w=>({key:w.key,translation:cut(w.translation,160),personal:!!w.personal}));
 if(!deck.length)return result;
 const messages=(Array.isArray(s.messages)?s.messages:[]).slice(-80).filter(m=>m&&['bot','user','note'].includes(m.role)).map((m,i)=>({id:i+1,role:m.role,text:cut(m.text,1600),ru:cut(m.ru,1600),check:!!m.check,targetWord:cut(m.targetWord,46),spoken:!!m.spoken}));
 result.session={id:/^dialogue-[a-z0-9-]{1,90}$/i.test(s.id||'')?s.id:legacySessionId(s),completed:!!s.completed,rewardXp:0,topic:s.topic,deck,messages,memory:compactMemory(s.memory),nextId:messages.length+1,draft:cut(s.draft,800),hint:cut(s.hint,500),pending:!!s.pending,turns:Math.min(10000,Math.max(0,Number(s.turns)||0)),checked:Math.max(0,Number(s.checked)||0),correct:Math.max(0,Number(s.correct)||0),used:Array.isArray(s.used)?s.used.filter(k=>deck.some(w=>w.key===k)):[]};
 return result;
}
try{state=clean(JSON.parse(localStorage.getItem(STORAGE)||'null'));}catch{}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{error='Не удалось сохранить разговор в браузере. Экспортируй прогресс в профиле.';}}
function deckFor(id){
 const saved=(bridge().getWords?.()||[]).filter(w=>w.status!=='known').concat((bridge().getWords?.()||[]).filter(w=>w.status==='known')).filter(w=>/^[a-z][a-z' -]{0,45}$/i.test(w.key)&&w.translation);
 const common=topics[id].words.map(([key,translation])=>({key,translation}));
 const source=id==='personal'?[...saved.map(w=>({...w,personal:true})),...common]:[...common.slice(0,4),...saved.slice(0,2).map(w=>({...w,personal:true})),...common.slice(4)];
 return [...new Map(source.map(w=>[w.key,{key:w.key,translation:cut(w.translation,160),personal:!!w.personal}])).values()].slice(0,6);
}
function add(role,text,extra={}){const s=state.session;s.messages.push({id:s.nextId++,role,text,...extra});if(s.messages.length>80){const removed=s.messages.slice(0,-80).filter(m=>m.role==='user'||m.role==='bot').map(m=>({role:m.role==='bot'?'assistant':'user',content:m.text}));s.memory=compactMemory([...(s.memory||[]),...removed]);s.messages=s.messages.slice(-80);}}
function start(){stop();state.session={id:sessionId(),completed:false,rewardXp:0,topic:state.selectedTopic,deck:deckFor(state.selectedTopic),messages:[],memory:[],nextId:1,draft:'',hint:'',pending:true,turns:0,checked:0,correct:0,used:[]};shown.clear();hintShown=false;error='';save();requestReply();}
function stop(){voice?.stop();settingsOpen=false;logShown=false;applyLive();requestNumber++;controller?.abort();controller=null;busy=false;save();}
async function requestReply(){
 const s=state.session;if(!s||busy||!s.pending||s.completed)return;
 if(voiceState.active)voice?.waiting();let spokenReply='';
 const id=++requestNumber;controller=new AbortController();const activeController=controller;
 const timer=setTimeout(()=>activeController.abort(),60000);busy=true;error='';hintShown=false;render(true);
 try{
  const response=await fetch(window.READFOX_CONFIG?.dialogueEndpoint||'https://readfox.gemerpc.workers.dev/dialogue',{method:'POST',headers:{'Content-Type':'application/json'},signal:activeController.signal,body:JSON.stringify({topic:s.topic,mode:[...s.messages].reverse().find(m=>m.role==='user')?.spoken?'voice':'text',level:level(),words:s.deck,usedWords:s.used,turnCount:s.turns+(s.messages.some(m=>m.role==='user')?1:0),...requestContext(s)})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'ИИ сейчас недоступен. Попробуй снова.');
  if(data.completed){if(id!==requestNumber||state.session!==s)return;updateUsed(s);if(isComplete(s)){s.turns++;complete(s,true);render(true);return;}throw new Error('Не удалось сверить прогресс слов. Попробуй снова.');}
  if(typeof data.reply!=='string'||typeof data.translation!=='string'||!['openrouter-ai','cloudflare-workers-ai'].includes(data.source))throw new Error('ИИ вернул неполный ответ. Попробуй снова.');
  if(id!==requestNumber||state.session!==s)return;
  const lastUser=[...s.messages].reverse().find(m=>m.role==='user');
  if(lastUser){s.turns++;updateUsed(s);}
  if(data.correction)add('note',cut(data.correction,1000));
  if(data.evaluatedWord&&['correct','retry'].includes(data.assessment)){s.checked++;if(data.assessment==='correct')s.correct++;add('note',data.assessment==='correct'?'✓ Проверка пройдена — смысл понятен.':'Повторим это слово ещё раз в разговоре.');}
  add('bot',cut(data.reply,1600),{ru:cut(data.translation,1600),check:!!data.check,targetWord:cut(data.targetWord,46)});s.hint=cut(data.hint,500);s.pending=false;spokenReply=cut(data.reply,1600);save();if(!voiceState.active)sound();
  if(data.evaluatedWord&&data.assessment==='correct'&&s.deck.some(w=>w.key===data.evaluatedWord)&&bridge().getWords?.().some(w=>w.key===data.evaluatedWord))bridge().reviewWord?.(data.evaluatedWord,true);
 }catch(e){if(id===requestNumber&&state.session===s){error=e.name==='AbortError'?'ИИ отвечает слишком долго. Нажми «Повторить» — твоя реплика сохранена.':e.message;if(voiceState.active)voice?.pause('Ответ ИИ задержался. Нажми «Повторить запрос», затем продолжи голосом.');save();}}
 finally{clearTimeout(timer);if(id===requestNumber){busy=false;controller=null;render(true);if(spokenReply&&voiceState.active&&!s.completed&&state.session===s)void voice?.speak(spokenReply);}}
}
function send(spoken=false){if(!spoken&&voiceState.active)pauseForTyping();followLog=true;const s=state.session;if(!s||busy||s.pending||s.completed||!s.draft.trim())return;add('user',s.draft.trim(),{spoken:!!spoken});s.draft='';updateUsed(s);if(isComplete(s)){s.turns++;complete(s,true);render(true);return;}s.pending=true;save();requestReply();}
function chip(w,used=false){return `<button type="button" class="dialogue-word ${used?'is-used':''}" data-dialogue-insert="${esc(w.key)}"><strong>${esc(w.key)}</strong><span>${esc(w.translation)}</span>${w.personal?'<small title="Из твоего словаря">●</small>':''}</button>`;}
function setup(){const t=topics[state.selectedTopic],deck=deckFor(state.selectedTopic);return `<div class="dialogue-intro"><div class="dialogue-kicker">ГОЛОСОВОЙ РАЗГОВОР С ИИ</div><h1>Диалог с Фоксом</h1><p>Говори по-английски и слушай ответы Фокса. Живой разговор, знакомые слова и помощь с грамматикой.</p></div><div class="dialogue-setup"><div class="dialogue-topic-grid" role="group" aria-label="Тема разговора">${Object.entries(topics).map(([id,t])=>`<button class="dialogue-topic ${id===state.selectedTopic?'is-selected':''}" data-dialogue-topic="${id}" aria-pressed="${id===state.selectedTopic}"><span class="dialogue-topic-icon">${t.icon}</span><strong>${t.title}</strong><small>${t.description}</small></button>`).join('')}</div><div class="dialogue-preview"><div class="dialogue-preview-top"><span class="dialogue-avatar">🦊</span><div><span class="dialogue-kicker">ТВОЙ ИИ-СОБЕСЕДНИК</span><h2>Фокс готов к разговору</h2></div><span class="dialogue-level">${esc(level())}</span></div><p>«${t.title}»: скажи свою реплику — Фокс ответит голосом. Используй все шесть слов и получи награду. Переписываться тоже можно.</p><div class="dialogue-words">${deck.map(w=>chip(w)).join('')}</div><button class="dialogue-primary dialogue-start" data-dialogue-action="start">К разговору →</button><p class="dialogue-local-note">В следующем окне включи микрофон. Нужен интернет; ИИ получает текст беседы и выбранные слова.</p></div></div>`;}
function chat(){
 const s=state.session,disabled=busy||s.pending,latest=[...s.messages].reverse().find(m=>m.role==='bot')?.id;
 // Notes (corrections, checks) arrive with the next reply and are shown on its screen.
 const groups=[];let notes=[];
 for(const m of s.messages){if(m.role==='note'){notes.push(m);continue;}groups.push({m,notes});notes=[];}
 const noteHtml=list=>list.map(n=>`<p class="dlg-slide-note">${esc(n.text)}</p>`).join('');
 const tail=noteHtml(notes)+(busy?`<div class="dlg-slide-tail${busyShown?'':' is-new'}" role="status"><span class="dlg-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Фокс думает…</span></div>`:'')+(!busy&&(s.pending||error)?`<div class="dlg-slide-tail dialogue-ai-error" role="status"><p>${esc(error||'Реплика сохранена. Продолжим разговор?')}</p>${s.pending?'<button type="button" class="dlg-retry" data-dialogue-action="retry">Повторить</button>':''}</div>`:'');
 const slide=({m,notes},last)=>`<section class="dlg-slide is-${m.role}${m.id===latest?' is-latest':''}${seen.has(m.id)?'':' is-new'}">${last&&groups.length>1?'<span class="dlg-history-hint" aria-hidden="true" title="Листай вверх, чтобы перечитать разговор"></span>':''}${noteHtml(notes)}<span class="dlg-slide-who">${m.role==='bot'?(m.check?'Фокс · проверка':'Фокс'):'Ты'}${m.role==='bot'?'<i class="dlg-speaking" aria-hidden="true"><b></b><b></b><b></b></i>':''}</span><p class="dlg-slide-text ${fit(m.text)}" lang="en"><button type="button" class="dlg-say" data-dialogue-say="${m.id}" title="Нажми, чтобы послушать">${esc(m.text)}</button></p>${m.ru?`<button type="button" class="dialogue-translate" data-dialogue-translate="${m.id}" aria-expanded="${shown.has(m.id)}">${shown.has(m.id)?'Скрыть перевод':'Перевод'}</button>${shown.has(m.id)?`<p class="dialogue-translation">${esc(m.ru)}</p>`:''}`:''}${last?tail:''}</section>`;
 const slides=groups.length?groups.map((g,i)=>slide(g,i===groups.length-1)).join(''):tail?`<section class="dlg-slide">${tail}</section>`:'';
 return `<div class="dialogue-chat is-live">${headerMarkup(s)}<div class="dialogue-messages" id="dialogueMessages" role="log" aria-live="polite" aria-label="Разговор с Фоксом"><div class="dlg-thread">${slides}<section id="dialogueVoiceInterim" class="dlg-slide is-user dlg-interim" hidden><span class="dlg-slide-who">Ты</span><p class="dlg-slide-text" lang="en"></p></section></div></div><div class="dialogue-composer-wrap"><button type="button" class="dlg-jump" id="dialogueJump" data-dialogue-action="jump" aria-label="К последней реплике" hidden>↓</button><p id="dialogueVoiceNotice" class="dlg-notice" role="status" hidden></p>${hintShown&&s.hint?`<div class="dialogue-ai-hint" lang="en">Например: ${esc(s.hint)}</div>`:''}<form id="dialogueForm" class="dialogue-composer"><button type="button" class="dlg-hint-btn" data-dialogue-action="hint" aria-pressed="${hintShown}" aria-label="${hintShown?'Скрыть пример':'Подсказка'}" title="${hintShown?'Скрыть пример':'Подсказка'}" ${!s.hint||disabled?'disabled':''}>${bulbIcon}</button><label class="sr-only" for="dialogueInput">Твой ответ</label><input id="dialogueInput" value="${esc(s.draft)}" placeholder="${busy?'Фокс пишет…':'Напиши ответ…'}" maxlength="800" autocomplete="off" enterkeyhint="send" ${disabled?'disabled':''}><button id="dialogueSend" type="submit" aria-label="Отправить ответ" ${disabled||!s.draft.trim()?'disabled':''}>↑</button></form></div></div>`;
}

function render(scroll=false){
 const el=document.getElementById('dialogueContent');if(!el)return;
 // A thread that was hidden (first load, another tab) opens on the last reply instead of scrolling through history.
 const prev=document.getElementById('dialogueMessages'),visible=logShown&&!!prev&&prev.clientHeight>0,oldScroll=visible?prev.scrollTop:0;
 if(state.session){updateUsed(state.session);if(isComplete(state.session))complete(state.session);else state.session.completed=false;}
 const s=state.session,live=!!s&&!s.completed;
 // History restored from storage appears at once; only messages that arrive while the chat is open animate in.
 if(live&&seenSession!==s.id){seen.clear();s.messages.forEach(m=>seen.add(m.id));seenSession=s.id;busyShown=busy;followLog=true;}
 el.innerHTML=s?(s.completed?completedMarkup(s):chat()):setup();
 if(live){s.messages.forEach(m=>seen.add(m.id));busyShown=busy;}
 paintVoice();applyLive();
 el.querySelectorAll('[data-dialogue-insert]').forEach(b=>{b.disabled=!!s&&(busy||s.pending);b.title=s?'Вставить в ответ':'Произнести слово';});
 const log=document.getElementById('dialogueMessages');
 if(log){
  sizeSlides(log);
  if(!visible){log.scrollTop=log.scrollHeight;followLog=true;}
  else{log.scrollTop=oldScroll;if(scroll){if(followLog)requestAnimationFrame(()=>{if(log.isConnected)scrollToEnd(true);});else jumpButton(true);}}
 }
 logShown=!!log&&log.clientHeight>0;
 watchLog(log);
}
function bind(){const el=document.getElementById('dialogueContent');if(!el||el.dataset.aiBound)return;el.dataset.aiBound='1';el.addEventListener('pointerdown',e=>{if(e.target.closest('[data-dialogue-insert]')&&document.activeElement?.id==='dialogueInput')e.preventDefault();});el.addEventListener('click',e=>{if(settingsOpen&&!e.target.closest('#dialogueSettings,[data-dialogue-action="settings"]'))toggleSettings(false);const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.dialogueEngine||b.dataset.dialogueBoost){pauseForTyping();window.ReadFoxDialogueAudio?.configure(b.dataset.dialogueEngine?{engine:b.dataset.dialogueEngine}:{boost:b.dataset.dialogueBoost});syncSettings();paintVoice();}else if(b.dataset.dialogueTopic){state.selectedTopic=b.dataset.dialogueTopic;save();render();}else if(b.dataset.dialogueInsert){insertWord(b.dataset.dialogueInsert);if(b.closest('#dialogueSettings'))toggleSettings(false);}else if(b.dataset.dialogueSay){sayPhrase(Number(b.dataset.dialogueSay));}else if(b.dataset.dialogueTranslate){const id=Number(b.dataset.dialogueTranslate);shown.has(id)?shown.delete(id):shown.add(id);render();}else{switch(b.dataset.dialogueAction){case 'voice-toggle':if(voiceState.active)pauseForTyping();else enableVoice();break;case 'voice-again':toggleSettings(false);if(voiceState.active||voiceState.phase!=='idle')recoverVoiceSound();else enableVoice(true);break;case 'theme':document.getElementById('themeToggleBtn')?.click();break;case 'jump':scrollToEnd(true);break;case 'start':start();break;case 'learn':bridge().openView?.('home');break;case 'retry':requestReply();break;case 'topics':stop();state.session=null;error='';save();render();break;case 'hint':hintShown=!hintShown;render();break;case 'exit':if(state.session?.messages.some(m=>m.role==='user')&&!confirm('Выйти из разговора? Текущая беседа будет закрыта.'))break;stop();state.session=null;error='';save();render();break;case 'settings':toggleSettings();break;}}});el.addEventListener('focusin',e=>{if(e.target.id==='dialogueInput')pauseForTyping();});el.addEventListener('input',e=>{if(e.target.id==='dialogueInput'&&state.session){state.session.draft=e.target.value;syncSend();save();}});el.addEventListener('submit',e=>{if(e.target.id==='dialogueForm'){e.preventDefault();const s=state.session;if(s&&!s.draft.trim()&&voiceState.active&&voiceState.phase==='listening'&&voiceState.interim){voice?.finish();return;}send();}});render();}
window.ReadFoxDialogue=Object.freeze({render,stop,exportState:()=>JSON.parse(JSON.stringify(state)),importState:value=>{stop();state=clean(value);error='';shown.clear();save();render();}});
window.visualViewport?.addEventListener('resize',fitViewport);window.visualViewport?.addEventListener('scroll',fitViewport);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&settingsOpen)toggleSettings(false);});
document.addEventListener('DOMContentLoaded',bind);window.addEventListener('readfox:ready',bind);window.addEventListener('readfox:view',e=>{if(e.detail?.view==='dialogue'){bind();render(true);}else stop();});window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden&&voiceState.active)voice?.pause('Разговор на паузе. Нажми «Продолжить голосом», когда вернёшься.');});if(document.readyState!=='loading')bind();
})();
