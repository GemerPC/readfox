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
function recoverVoiceSound(){
 const s=state.session;if(!s||s.completed||busy||s.pending)return;
 pauseForTyping();const control=getVoice();if(control)control.recover(lastReply());
}
function pauseForTyping(){
 if(!voiceState.active)return;
 const s=state.session,input=document.getElementById('dialogueInput'),heard=voiceState.interim;
 if(s&&heard){s.draft=[s.draft.trim(),heard.trim()].filter(Boolean).join(' ').slice(0,800);if(input)input.value=s.draft;save();}
 voice?.pause('Микрофон на паузе. Можно исправить фразу или написать ответ.');
 const sendButton=document.getElementById('dialogueSend');if(sendButton)sendButton.disabled=busy||s?.pending||!s?.draft.trim();
}
function audioSettingsMarkup(){
 const a=window.ReadFoxDialogueAudio?.settings()||{engine:'system'};
 return '<div class="dialogue-audio-settings"><label for="dialogueAudioEngine">Голос Фокса<select id="dialogueAudioEngine"><option value="audio" '+(a.engine==='audio'?'selected':'')+(!window.ReadFoxDialogueAudio?.supported?' disabled':'')+'>Улучшенный</option><option value="system" '+(a.engine==='system'?'selected':'')+'>Системный</option></select></label><label for="dialogueAudioBoost">Громкость<select id="dialogueAudioBoost"'+(a.engine==='system'?' disabled':'')+'><option value="off" '+(a.boost==='off'?'selected':'')+'>Обычная</option><option value="loud" '+(a.boost==='loud'?'selected':'')+'>Громче</option><option value="max" '+(a.boost==='max'?'selected':'')+'>Максимум</option></select></label></div>';
}

let settingsOpen=false,vocabOpen=false;
function settingsMarkup(){return '<div class="dialogue-settings" id="dialogueSettings" '+(settingsOpen?'':'hidden')+'>'+audioSettingsMarkup()+'<details class="dialogue-voice-info"><summary>Как говорить</summary><p>Разреши микрофон и говори по-английски. После паузы фраза отправится сама. Фокс ответит вслух, затем снова включится микрофон. «Я закончил» отправляет текущую фразу сразу. Чтобы исправить её, нажми на текстовое поле до отправки.</p><p>Нужен интернет. Браузер может передавать речь своему сервису распознавания; ReadFox сохраняет только текст. Улучшенный голос создаётся в Cloudflare AI из ответа Фокса; запись твоего голоса в этот сервис озвучки не передаётся. На iPhone открывай сайт в Safari. Разрешение на микрофон управляется браузером.</p><p>Ответ и микрофон работают по очереди. Если Safari прервал воспроизведение, нажми «Повторить звук»: ответ прозвучит снова, а микрофон останется на паузе.</p></details></div>';}
function voiceMarkup(){return '<section class="dialogue-voice-dock" aria-label="Голосовой разговор"><div class="dialogue-voice-state"><span class="dialogue-voice-orb" aria-hidden="true">'+micIcon+'</span><div><strong id="dialogueVoiceTitle">Говори с Фоксом</strong><span id="dialogueVoiceStatus" role="status" aria-live="polite"></span></div></div><div class="dialogue-voice-actions"><button type="button" class="dialogue-voice-main" data-dialogue-action="voice-toggle">'+micIcon+'<span>Начать голосом</span></button><button type="button" class="dialogue-voice-finish" data-dialogue-action="voice-finish" hidden>Я закончил ↑</button><button type="button" class="dialogue-link" data-dialogue-action="voice-replay">↻ Слушать Фокса</button><button type="button" class="dialogue-link dialogue-recover-sound" data-dialogue-action="voice-recover" title="Остановить микрофон и заново воспроизвести ответ">↻ Повторить звук</button></div></section>';}
function paintVoice(){
 const dock=document.querySelector('.dialogue-voice-dock');if(!dock)return;
 const s=state.session,active=voiceState.active,phase=voiceState.phase,supported=voiceState.supported;
 dock.dataset.phase=phase;dock.classList.toggle('is-active',active);document.getElementById('dialogueStage')?.classList.toggle('is-speaking',phase==='speaking');
 const title=document.getElementById('dialogueVoiceTitle'),status=document.getElementById('dialogueVoiceStatus'),interim=document.getElementById('dialogueVoiceInterim');
 const names={idle:'Говори с Фоксом',starting:'Подключаю микрофон…',listening:'Я слушаю тебя',thinking:'Фокс обдумывает ответ',speaking:'Фокс говорит','loading-audio':'Готовлю голос Фокса',paused:'Разговор на паузе',error:'Нужна твоя помощь'};
 title.textContent=names[phase]||names.idle;
 status.textContent=voiceState.message||(!supported?'Распознавание недоступно. Используй Safari на iPhone или Chrome на компьютере. Можно общаться текстом.':active?(phase==='listening'?'Говори по-английски. Пауза — и ответ отправится.':phase==='speaking'?'Микрофон выключен, пока говорит Фокс.':'Можно поставить разговор на паузу.'):'Включи микрофон один раз, дальше общайся голосом.');
 interim.hidden=!voiceState.interim;interim.textContent=voiceState.interim||'';
 const toggle=dock.querySelector('[data-dialogue-action="voice-toggle"]');toggle.disabled=!supported||(!active&&(busy||s?.pending));toggle.setAttribute('aria-pressed',String(active));toggle.querySelector('span').textContent=active?'Пауза':phase==='idle'?'Начать голосом':'Продолжить голосом';
 const finish=dock.querySelector('[data-dialogue-action="voice-finish"]');finish.hidden=!active||phase!=='listening';finish.disabled=!voiceState.interim;
 const replay=dock.querySelector('[data-dialogue-action="voice-replay"]');replay.hidden=active;replay.disabled=!supported||busy||s?.pending||!lastReply();
 const recover=dock.querySelector('[data-dialogue-action="voice-recover"]');recover.disabled=!supported||busy||s?.pending||!lastReply();recover.hidden=phase==='idle';
 const input=document.getElementById('dialogueInput');if(input)input.placeholder=active?'Нажми, чтобы исправить или написать…':busy?'Фокс пишет…':'Или напиши ответ…';
}


function containsWord(value,key){const normalize=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' -]+/g,' ').replace(/\s+/g,' ').trim();return (' '+normalize(value)+' ').includes(' '+normalize(key)+' ');}
function sessionId(){return 'dialogue-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));}
function legacySessionId(s){let hash=2166136261;const source=JSON.stringify([s.topic,(s.deck||[]).map(w=>w.key),(s.messages||[]).slice(0,10).map(m=>[m.role,m.text])]);for(const c of source){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}return 'dialogue-legacy-'+(hash>>>0).toString(16);}
function updateUsed(s){const text=[...(s.memory||[]).filter(m=>m.role==='user').map(m=>m.content),...s.messages.filter(m=>m.role==='user').map(m=>m.text)];for(const w of s.deck)if(!s.used.includes(w.key)&&text.some(t=>containsWord(t,w.key)))s.used.push(w.key);}
function isComplete(s){return s.deck.length>0&&s.deck.every(w=>s.used.includes(w.key));}
function complete(s,play=false){
 if(!isComplete(s))return;if(voiceState.active)voice?.stop();const wasComplete=s.completed;s.id=s.id||sessionId();s.completed=true;s.pending=false;s.hint='';error='';
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
function placeVocabulary(){
 const vocab=document.querySelector('#dialogueContent .dialogue-vocabulary'),form=document.getElementById('dialogueForm'),layout=document.querySelector('#dialogueContent .dialogue-layout');
 if(!vocab||!form||!layout)return;
 if(window.matchMedia('(max-width: 720px)').matches)form.before(vocab);else layout.append(vocab);
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
function stop(){voice?.stop();requestNumber++;controller?.abort();controller=null;busy=false;save();}
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
  if(typeof data.reply!=='string'||typeof data.translation!=='string'||data.source!=='cloudflare-workers-ai')throw new Error('ИИ вернул неполный ответ. Попробуй снова.');
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
function send(spoken=false){if(!spoken&&voiceState.active)pauseForTyping();const s=state.session;if(!s||busy||s.pending||s.completed||!s.draft.trim())return;add('user',s.draft.trim(),{spoken:!!spoken});s.draft='';updateUsed(s);if(isComplete(s)){s.turns++;complete(s,true);render(true);return;}s.pending=true;save();requestReply();}
function chip(w,used=false){return `<button type="button" class="dialogue-word ${used?'is-used':''}" data-dialogue-insert="${esc(w.key)}"><strong>${esc(w.key)}</strong><span>${esc(w.translation)}</span>${w.personal?'<small title="Из твоего словаря">●</small>':''}</button>`;}
function setup(){const t=topics[state.selectedTopic],deck=deckFor(state.selectedTopic);return `<div class="dialogue-intro"><div class="dialogue-kicker">ГОЛОСОВОЙ РАЗГОВОР С ИИ</div><h1>Диалог с Фоксом</h1><p>Говори по-английски и слушай ответы Фокса. Живой разговор, знакомые слова и помощь с грамматикой.</p></div><div class="dialogue-setup"><div class="dialogue-topic-grid" role="group" aria-label="Тема разговора">${Object.entries(topics).map(([id,t])=>`<button class="dialogue-topic ${id===state.selectedTopic?'is-selected':''}" data-dialogue-topic="${id}" aria-pressed="${id===state.selectedTopic}"><span class="dialogue-topic-icon">${t.icon}</span><strong>${t.title}</strong><small>${t.description}</small></button>`).join('')}</div><div class="dialogue-preview"><div class="dialogue-preview-top"><span class="dialogue-avatar">🦊</span><div><span class="dialogue-kicker">ТВОЙ ИИ-СОБЕСЕДНИК</span><h2>Фокс готов к разговору</h2></div><span class="dialogue-level">${esc(level())}</span></div><p>«${t.title}»: скажи свою реплику — Фокс ответит голосом. Используй все шесть слов и получи награду. Переписываться тоже можно.</p><div class="dialogue-words">${deck.map(w=>chip(w)).join('')}</div><button class="dialogue-primary dialogue-start" data-dialogue-action="start">К разговору →</button><p class="dialogue-local-note">В следующем окне включи микрофон. Нужен интернет; ИИ получает текст беседы и выбранные слова.</p></div></div>`;}
function chat(){const s=state.session,disabled=busy||s.pending,latest=[...s.messages].reverse().find(m=>m.role==='bot')?.id;return `<div class="dialogue-chat-top"><div><span class="dialogue-kicker">ГОЛОСОВОЙ ДИАЛОГ</span><h1>${topics[s.topic].title}</h1></div><button class="dialogue-link" data-dialogue-action="topics">Сменить тему</button></div><div class="dialogue-layout"><div class="dialogue-chat"><div class="dialogue-chat-header"><span class="dialogue-avatar">🦊</span><div><strong>Фокс · ИИ</strong><span>Английский ${esc(level())} · ответы своими словами</span></div><span class="dialogue-session-progress">${s.turns} реплик</span><button type="button" class="dialogue-gear" data-dialogue-action="settings" aria-label="Настройки диалога" aria-expanded="${settingsOpen}" aria-controls="dialogueSettings"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div>${settingsMarkup()}<div class="dialogue-stage" id="dialogueStage"><div class="dialogue-messages" id="dialogueMessages" role="log" aria-live="polite" aria-label="Разговор с Фоксом">${s.messages.map(m=>`<div class="dialogue-message is-${m.role}${m.id===latest?' is-latest':''}">${m.role==='bot'?'<span class="dialogue-message-avatar">🦊</span>':''}<div class="dialogue-bubble"><span class="dialogue-sender">${m.role==='bot'?(m.check?'Фокс · проверка знаний':'Фокс · ИИ'):m.role==='user'?'Ты':'Подсказка'}</span><p ${m.role==='note'?'':'lang="en"'}>${esc(m.text)}</p>${m.ru?`<button class="dialogue-translate" data-dialogue-translate="${m.id}" aria-expanded="${shown.has(m.id)}">${shown.has(m.id)?'Скрыть перевод':'Показать перевод'}</button>${shown.has(m.id)?`<p class="dialogue-translation">${esc(m.ru)}</p>`:''}`:''}</div></div>`).join('')}${busy?'<div class="dialogue-busy" role="status">Фокс обдумывает ответ<span>…</span></div>':''}${!busy&&(s.pending||error)?`<div class="dialogue-ai-error" role="status"><p>${esc(error||'Реплика сохранена. Продолжим разговор?')}</p>${s.pending?'<button class="dialogue-primary" data-dialogue-action="retry">Повторить запрос</button>':''}</div>`:''}</div><p id="dialogueVoiceInterim" class="dialogue-voice-interim" lang="en" hidden></p></div><div class="dialogue-composer-wrap">${voiceMarkup()}${hintShown&&s.hint?`<div class="dialogue-ai-hint" lang="en">Например: ${esc(s.hint)}</div>`:''}<div class="dialogue-help"><button class="dialogue-link" data-dialogue-action="hint" ${!s.hint||disabled?'disabled':''}>${hintShown?'Скрыть пример':'Нужна подсказка'}</button><span>Проверки: ${s.correct} / ${s.checked}</span></div><form id="dialogueForm" class="dialogue-composer"><label class="sr-only" for="dialogueInput">Твой ответ</label><input id="dialogueInput" value="${esc(s.draft)}" placeholder="${busy?'Фокс пишет…':'Твой ответ или вопрос…'}" maxlength="800" autocomplete="off" ${disabled?'disabled':''}><button id="dialogueSend" type="submit" aria-label="Отправить ответ" ${disabled||!s.draft.trim()?'disabled':''}>↑</button></form><span class="dialogue-composer-note">Голосом или текстом — каждая отправленная реплика засчитывается.</span></div></div><aside class="dialogue-vocabulary${vocabOpen?' is-open':''}"><button type="button" class="dialogue-card-title" data-dialogue-action="vocab" aria-expanded="${vocabOpen}"><span>СЛОВА ДЛЯ РАЗГОВОРА</span><strong>${s.used.length} / ${s.deck.length}</strong></button><p>Нажми на слово, чтобы вставить его в ответ.</p><div class="dialogue-words">${s.deck.map(w=>chip(w,s.used.includes(w.key))).join('')}</div><div class="dialogue-session-guide"><h3>Разговор в твоём темпе</h3><p>Разговор учитывает историю беседы. Слова выше — подсказки для практики. Уже использованные слова засчитываются сразу. Собери весь набор и получи награду.</p></div></aside></div>`;}
function render(scroll=false){const el=document.getElementById('dialogueContent');if(!el)return;const oldScroll=document.getElementById('dialogueMessages')?.scrollTop||0;if(state.session){updateUsed(state.session);if(isComplete(state.session))complete(state.session);else state.session.completed=false;}el.innerHTML=state.session?(state.session.completed?completedMarkup(state.session):chat()):setup();placeVocabulary();paintVoice();el.querySelectorAll('[data-dialogue-insert]').forEach(b=>{b.disabled=!!state.session&&(busy||state.session.pending);b.title=state.session?'Вставить в ответ':'Произнести слово';});const log=document.getElementById('dialogueMessages');if(log){log.style.scrollBehavior='auto';log.scrollTop=scroll?log.scrollHeight:oldScroll;if(scroll)requestAnimationFrame(()=>{if(log.isConnected)log.scrollTop=log.scrollHeight;});}}
function bind(){const el=document.getElementById('dialogueContent');if(!el||el.dataset.aiBound)return;el.dataset.aiBound='1';el.addEventListener('pointerdown',e=>{if(e.target.closest('[data-dialogue-insert]')&&document.activeElement?.id==='dialogueInput')e.preventDefault();});el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.dialogueTopic){state.selectedTopic=b.dataset.dialogueTopic;save();render();}else if(b.dataset.dialogueInsert)insertWord(b.dataset.dialogueInsert);else if(b.dataset.dialogueTranslate){const id=Number(b.dataset.dialogueTranslate);shown.has(id)?shown.delete(id):shown.add(id);render();}else{switch(b.dataset.dialogueAction){case 'voice-toggle':if(voiceState.active)pauseForTyping();else enableVoice();break;case 'voice-replay':enableVoice(true);break;case 'voice-recover':recoverVoiceSound();break;case 'voice-finish':voice?.finish();break;case 'start':start();break;case 'learn':bridge().openView?.('home');break;case 'retry':requestReply();break;case 'topics':stop();state.session=null;error='';save();render();break;case 'hint':hintShown=!hintShown;render();break;case 'settings':{settingsOpen=!settingsOpen;const panel=document.getElementById('dialogueSettings');if(panel)panel.hidden=!settingsOpen;b.setAttribute('aria-expanded',String(settingsOpen));break;}case 'vocab':{vocabOpen=!vocabOpen;b.setAttribute('aria-expanded',String(vocabOpen));b.closest('.dialogue-vocabulary')?.classList.toggle('is-open',vocabOpen);break;}}}});el.addEventListener('focusin',e=>{if(e.target.id==='dialogueInput')pauseForTyping();});el.addEventListener('change',e=>{if(e.target.id==='dialogueAudioEngine'||e.target.id==='dialogueAudioBoost'){pauseForTyping();window.ReadFoxDialogueAudio?.configure(e.target.id==='dialogueAudioEngine'?{engine:e.target.value}:{boost:e.target.value});if(e.target.id==='dialogueAudioEngine'){const b=document.getElementById('dialogueAudioBoost');if(b)b.disabled=e.target.value==='system';}paintVoice();}});el.addEventListener('input',e=>{if(e.target.id==='dialogueInput'&&state.session){state.session.draft=e.target.value;document.getElementById('dialogueSend').disabled=busy||state.session.pending||!e.target.value.trim();save();}});el.addEventListener('submit',e=>{if(e.target.id==='dialogueForm'){e.preventDefault();send();}});render();}
window.ReadFoxDialogue=Object.freeze({render,stop,exportState:()=>JSON.parse(JSON.stringify(state)),importState:value=>{stop();state=clean(value);error='';shown.clear();save();render();}});
const mobileLayout=window.matchMedia('(max-width: 720px)');const onMobileLayout=()=>{placeVocabulary();requestAnimationFrame(()=>{const log=document.getElementById('dialogueMessages');if(log)log.scrollTop=log.scrollHeight;});};if(mobileLayout.addEventListener)mobileLayout.addEventListener('change',onMobileLayout);else mobileLayout.addListener(onMobileLayout);
document.addEventListener('DOMContentLoaded',bind);window.addEventListener('readfox:ready',bind);window.addEventListener('readfox:view',e=>{if(e.detail?.view==='dialogue'){bind();render(true);}else stop();});window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden&&voiceState.active)voice?.pause('Разговор на паузе. Нажми «Продолжить голосом», когда вернёшься.');});if(document.readyState!=='loading')bind();
})();
