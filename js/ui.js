(function(){
'use strict';
const titles={home:'Обучение',library:'Библиотека',dictionary:'Мой словарь',speaking:'Говорение',practice:'Повторение',profile:'Мой прогресс',reader:'Чтение',dialogue:'Диалог'};
const words=[{key:'discover',ipa:'/dɪˈskʌvər/',translation:'открывать, узнавать',example:'Discover something new every day.'},{key:'together',ipa:'/təˈɡeðər/',translation:'вместе',example:'We learn something new together.'},{key:'curious',ipa:'/ˈkjʊəriəs/',translation:'любознательный',example:'Stay curious about the world.'},{key:'journey',ipa:'/ˈdʒɜːrni/',translation:'путешествие',example:'Every journey begins with a small step.'},{key:'wonderful',ipa:'/ˈwʌndərfəl/',translation:'замечательный',example:'It is a wonderful day to learn.'},{key:'grow',ipa:'/ɡrəʊ/',translation:'расти, развиваться',example:'Little by little, we grow.'},{key:'remember',ipa:'/rɪˈmembər/',translation:'помнить',example:'I remember my first English lesson.'}];
const start=new Date(2026,8,5), now=new Date();const word=words[((Math.floor((new Date(now.getFullYear(),now.getMonth(),now.getDate())-start)/86400000)%words.length)+words.length)%words.length];
function updateWordButton(){const saved=window.ReadFoxBridge?.getWords().some(w=>w.key===word.key);const b=document.getElementById('wordDayAdd');if(b){b.textContent=saved?'Уже в твоём словаре ✓':'Добавить в словарь ＋';b.disabled=!!saved;}}
window.addEventListener('readfox:ready',()=>{
 const title=document.querySelector('.word-day-word');if(title)title.firstChild.textContent=word.key+' ';
 const ipa=document.querySelector('.word-day-ipa');if(ipa)ipa.textContent=word.ipa;
 const translation=document.querySelector('.word-day-translation');if(translation)translation.textContent=word.translation;
 const example=document.querySelector('.word-day-card p');if(example)example.textContent=word.example;
 document.getElementById('wordDaySpeak')?.setAttribute('aria-label','Произнести '+word.key);
 updateWordButton();
 document.getElementById('quickReview')?.addEventListener('click',()=>window.ReadFoxAcademy?.startReview());
 document.getElementById('wordDaySpeak')?.addEventListener('click',()=>window.ReadFoxBridge.speak(word.key));
 document.getElementById('wordDayAdd')?.addEventListener('click',()=>{window.ReadFoxBridge.addWords([word]);updateWordButton();window.ReadFoxBridge.toast('Новое слово в твоём словаре!');});
 const profile=document.querySelector('.view[data-view="profile"]');
 const tools=document.createElement('div');tools.className='profile-tools';tools.innerHTML='<h2>Всё под рукой</h2><p>Сохрани копию прогресса, чтобы перенести её на другое устройство.</p><div class="profile-tool-buttons"><button class="btn secondary" id="profileExport">Скачать прогресс</button><button class="btn secondary" id="profileImport">Восстановить из файла</button><button class="btn secondary" id="profileSettings">Настройки озвучивания</button><button class="btn secondary" data-open-view="practice">Карточки и квиз</button></div>';profile?.appendChild(tools);
 document.getElementById('profileExport')?.addEventListener('click',()=>document.getElementById('exportBtn').click());
 document.getElementById('profileImport')?.addEventListener('click',()=>document.getElementById('importBtn').click());
 document.getElementById('profileSettings')?.addEventListener('click',event=>{event.stopPropagation();document.getElementById('voiceSettingsBtn').click();});
});
document.addEventListener('click',event=>{const control=event.target.closest('[data-open-view]');if(!control)return;event.preventDefault();window.ReadFoxBridge?.openView(control.dataset.openView);});
window.addEventListener('readfox:view',event=>{const view=event.detail.view;const title=document.getElementById('pageTitle');if(title)title.textContent=titles[view]||'ReadFox';document.title=(titles[view]||'ReadFox')+' · ReadFox';});
window.addEventListener('readfox:change',updateWordButton);
})();

(function(){
'use strict';
function filterLibrary(){const query=(document.getElementById('librarySearch')?.value||'').trim().toLowerCase(),level=document.getElementById('libraryLevel')?.value||'all';let shown=0;document.querySelectorAll('#libraryGrid .text-card[data-id]').forEach(card=>{const visible=(!query||card.textContent.toLowerCase().includes(query))&&(level==='all'||!card.dataset.cefr||card.dataset.cefr===level);card.classList.toggle('hidden',!visible);if(visible)shown++;});const empty=document.getElementById('libraryNoResults');if(empty)empty.classList.toggle('hidden',shown>0||(!query&&level==='all'));}
window.addEventListener('readfox:ready',()=>{document.getElementById('librarySearch')?.addEventListener('input',filterLibrary);document.getElementById('libraryLevel')?.addEventListener('change',filterLibrary);filterLibrary();});
window.addEventListener('readfox:library-render',filterLibrary);
})();
