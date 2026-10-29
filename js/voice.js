(function () {
  'use strict';

  const CONSENT_KEY = 'readfox.voice.consent.v1';
  const MODE_KEY = 'readfox.voice.continuous.v1';
  const MAX_RESTARTS = 3;
  const RESTART_DELAY = 650;
  const CURATED = [
    { key: 'hello', translation: 'привет', ipa: '/həˈloʊ/', example: 'Hello! How are you?', tip: 'Сделай ударение на втором слоге: he-LLO.' },
    { key: 'morning', translation: 'утро', ipa: '/ˈmɔːrnɪŋ/', example: 'Good morning, sunshine!', tip: 'В конце слова — носовой звук /ŋ/, без отдельного «г».' },
    { key: 'coffee', translation: 'кофе', ipa: '/ˈkɔːfi/', example: 'A cup of coffee, please.', tip: 'Первый слог ударный, второй — короткий и лёгкий.' },
    { key: 'family', translation: 'семья', ipa: '/ˈfæməli/', example: 'I love my family.', tip: 'Раскрой рот чуть шире на первом звуке /æ/.' },
    { key: 'book', translation: 'книга', ipa: '/bʊk/', example: 'This is my favourite book.', tip: 'Гласный /ʊ/ короткий. Не растягивай его.' },
    { key: 'window', translation: 'окно', ipa: '/ˈwɪndoʊ/', example: 'Please open the window.', tip: 'Округли губы для /w/. Ударение — на первом слоге.' },
    { key: 'beautiful', translation: 'красивый', ipa: '/ˈbjuːtɪfəl/', example: 'What a beautiful day!', tip: 'Первый слог звучит как /bjuː/ и несёт ударение.' },
    { key: 'together', translation: 'вместе', ipa: '/təˈɡeðər/', example: 'Let’s learn together.', tip: 'Для /ð/ слегка помести язык между зубами и добавь голос.' }
  ];
  // Common everyday vocabulary; all personal entries remain eligible in the pool.
  const FREQUENT = {
    A1: 'hello|привет;morning|утро;coffee|кофе;family|семья;book|книга;window|окно;beautiful|красивый;together|вместе;water|вода;friend|друг;home|дом;school|школа;work|работа;people|люди;today|сегодня;food|еда;help|помогать;time|время;want|хотеть;need|нуждаться;good|хороший;happy|счастливый;small|маленький;place|место;learn|учиться;think|думать;thank you|спасибо;please|пожалуйста;really|действительно;always|всегда;money|деньги;question|вопрос;answer|ответ;listen|слушать;breakfast|завтрак;weather|погода;because|потому что;something|что-то;every day|каждый день;understand|понимать',
    A2: 'believe|верить;change|менять;travel|путешествовать;choose|выбирать;remember|помнить;improve|улучшать;enough|достаточно;probably|вероятно;usually|обычно;different|другой;important|важный;experience|опыт;explain|объяснять;decide|решать;possible|возможный;prepare|готовить;describe|описывать;invite|приглашать;comfortable|удобный;another|другой;problem|проблема;interesting|интересный;happen|случаться;arrive|прибывать;borrow|брать взаймы;return|возвращаться;although|хотя;perhaps|возможно;instead|вместо;appointment|встреча по договорённости;look after|заботиться;find out|выяснять;look for|искать;get ready|готовиться;on time|вовремя;at least|по крайней мере',
    B1: 'achieve|достигать;consider|обдумывать;develop|развивать;increase|увеличивать;reduce|сокращать;support|поддерживать;provide|предоставлять;require|требовать;purpose|цель;opportunity|возможность;environment|окружающая среда;responsible|ответственный;available|доступный;challenge|сложная задача;confident|уверенный;suggest|предлагать;avoid|избегать;afford|позволять себе;imagine|представлять;immediately|немедленно;relationship|отношения;particular|определённый;recognize|узнавать;encourage|поощрять;unless|если не;despite|несмотря на;influence|влияние;discover|обнаруживать;compare|сравнивать;recently|недавно;deal with|справляться с;take part|участвовать;look forward to|ждать с нетерпением;in common|общий',
    B2: 'approach|подход;assume|предполагать;benefit|польза;consequence|последствие;contribute|вносить вклад;establish|устанавливать;evaluate|оценивать;evidence|доказательства;maintain|поддерживать;perspective|точка зрения;significant|значительный;efficient|эффективный;reliable|надёжный;circumstance|обстоятельство;considerable|существенный;demonstrate|демонстрировать;nevertheless|тем не менее;otherwise|иначе;essential|необходимый;awareness|осведомлённость;involve|вовлекать;identify|определять;potential|потенциальный;relevant|относящийся к делу;therefore|поэтому;whereas|тогда как;eventually|в конечном счёте;sustainable|устойчивый;reasonable|разумный;accomplish|выполнять;carry out|осуществлять;come up with|придумывать;take into account|учитывать;in terms of|с точки зрения'
  };
  const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
  const SOUND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9a5 5 0 0 1 0 6M19 6a9 9 0 0 1 0 12"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const life = window.ReadFoxAudioLifecycle;
  // Shared cloud player (boosted, with iOS route handling); falls back to the system voice.
  const synth = window.ReadFoxDialogueAudio && window.ReadFoxDialogueAudio.createSynthesizer ? window.ReadFoxDialogueAudio.createSynthesizer() : null;
  const canSpeak = Boolean(window.SpeechSynthesisUtterance && (synth || window.speechSynthesis));
  function readSetting(key) { try { return window.localStorage.getItem(key); } catch (_) { return null; } }
  function saveSetting(key, value) { try { window.localStorage.setItem(key, value); } catch (_) { /* Private mode may disable storage. */ } }
  const state = { deck: [], level: 'A1', index: 0, consent: readSetting(CONSENT_KEY) === 'true', continuous: readSetting(MODE_KEY) !== 'false', sessionWanted: false, phase: 'idle', result: null, partial: '', partialMessage: '', completed: new Set(), awarded: new Set(), playing: false, advancing: false };
  let recognition = null, recognitionEpoch = 0, sessionEpoch = 0, speechToken = 0, mounted = false, viewActive = true, restartCount = 0;
  let restartTimer = null, advanceTimer = null, requestTimer = null, idleTimer = null, speechTimer = null, feedbackTimer = null, finalizeTimer = null;
  // A new microphone or TTS waits for the previous microphone's actual end event.
  let microphoneBarrier = Promise.resolve(true);

  function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  function normalize(value) { return String(value || '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function sound(name) { try { if (window.ReadFoxSound && window.ReadFoxSound.play) window.ReadFoxSound.play(name); } catch (_) { /* Sound feedback is optional. */ } }
  function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  function getLevel() {
    try {
      const value = window.ReadFoxAcademy && window.ReadFoxAcademy.getLevel ? window.ReadFoxAcademy.getLevel() : 'A1';
      const level = String(value && typeof value === 'object' ? value.cefr || value.level : value).toUpperCase();
      return FREQUENT[level] ? level : 'A1';
    } catch (_) { return 'A1'; }
  }
  function buildDeck() {
    state.level = getLevel();
    let saved = [];
    try { saved = window.ReadFoxBridge && window.ReadFoxBridge.getWords ? window.ReadFoxBridge.getWords() : []; } catch (_) { /* Starter words remain available. */ }
    const personal = (Array.isArray(saved) ? saved : []).filter(word => word && /^[a-z][a-z'’ -]{0,79}$/i.test(String(word.key || '').trim())).map(word => {
      const key = String(word.key).trim().toLowerCase();
      const known = CURATED.find(item => normalize(item.key) === normalize(key));
      const example = String(word.example || (known && known.example) || '');
      const sentenceTranslation = word.example && word.contextSentenceTranslations && typeof word.contextSentenceTranslations[word.example] === 'string' ? word.contextSentenceTranslations[word.example] : '';
      return { ...(known || {}), key, translation: String(word.translation || (known && known.translation) || ''), example, sentenceTranslation, personal: true };
    });
    const frequent = FREQUENT[state.level].split(';').map(pair => {
      const [key, translation] = pair.split('|');
      return { ...(CURATED.find(item => item.key === key) || {}), key, translation };
    });
    const chosenPersonal = shuffle(personal).slice(0, personal.length > 4 ? 5 : 4);
    const candidates = [...chosenPersonal, ...shuffle(frequent), ...shuffle(personal)];
    const seen = new Set();
    return shuffle(candidates.filter(word => {
      const key = normalize(word.key);
      if (!key || seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 8));
  }
  function current() { return state.deck[state.index]; }
  // After a word is recognised, a sentence with exactly that word is shown: the word's own example when it has one,
  // otherwise one written by the AI for the learner's level (kept in localStorage so a word is asked for only once).
  const EXAMPLE_KEY = 'readfox.voice.examples.v1';
  const examples = new Map();
  try { for (const [key, value] of Object.entries(JSON.parse(readSetting(EXAMPLE_KEY) || '{}'))) if (value && typeof value.sentence === 'string') examples.set(key, value); } catch (_) { /* Starts empty. */ }
  function wordPattern(word) { return new RegExp('(^|[^A-Za-z])(' + String(word).trim().replace(/[^A-Za-z'’ -]/g, '').replace(/['’]/g, "['’]").replace(/[ -]/g, '[ -]') + ')(?![A-Za-z])', 'i'); }
  function exampleKey(word) { return normalize(word.key) + '|' + state.level; }
  function exampleFor(word) {
    if (word.example && wordPattern(word.key).test(word.example)) return { sentence: word.example, translation: word.sentenceTranslation || '' };
    const saved = examples.get(exampleKey(word));
    return saved && saved.sentence ? saved : null;
  }
  function exampleEndpoint() {
    const endpoint = window.READFOX_CONFIG && window.READFOX_CONFIG.aiGeneratorEndpoint || '';
    return /\/generate\/?$/i.test(endpoint) ? endpoint.replace(/\/generate\/?$/i, '/example') : '';
  }
  function loadExample(word) {
    const key = exampleKey(word), endpoint = exampleEndpoint();
    if (!word || exampleFor(word) || examples.has(key) || !endpoint) return;
    examples.set(key, { loading: true });
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word: word.key, level: state.level }) })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!data || typeof data.sentence !== 'string' || !wordPattern(word.key).test(data.sentence)) { examples.set(key, { failed: true }); return; }
        examples.set(key, { sentence: data.sentence, translation: typeof data.translation === 'string' ? data.translation : '' });
        const stored = {};
        for (const [k, v] of [...examples.entries()].filter(([, v]) => v.sentence).slice(-200)) stored[k] = v;
        saveSetting(EXAMPLE_KEY, JSON.stringify(stored));
      })
      .catch(() => examples.set(key, { failed: true }))
      .finally(() => { if (current() === word && viewActive) render(); });
  }
  function exampleHtml(word) {
    if (!state.result || state.result.kind !== 'success') return '';
    const example = exampleFor(word), pending = examples.get(exampleKey(word));
    if (!example) return pending && pending.loading ? '<section class="voice-sentence voice-sentence--loading" aria-live="polite"><span class="voice-eyebrow">Пример с этим словом</span><p>Подбираем предложение…</p></section>' : '';
    const match = example.sentence.match(wordPattern(word.key));
    const sentence = match ? escape(example.sentence.slice(0, match.index + match[1].length)) + '<mark>' + escape(match[2]) + '</mark>' + escape(example.sentence.slice(match.index + match[0].length)) : escape(example.sentence);
    return '<section class="voice-sentence" aria-live="polite"><span class="voice-eyebrow">Пример с этим словом</span><p class="voice-sentence-text" lang="en">' + sentence + '</p>' + (example.translation ? '<p class="voice-sentence-translation">' + escape(example.translation) + '</p>' : '') + '<button type="button" class="voice-btn voice-btn--listen voice-sentence-listen" data-voice="sentence"' + (!canSpeak ? ' disabled' : '') + '>' + SOUND + 'Послушать предложение</button></section>';
  }
  function root() { return document.getElementById('speakingContent'); }
  function activeSession(epoch) { return epoch === sessionEpoch && state.sessionWanted && state.consent && viewActive && !document.hidden; }
  function clearRecognitionTimers() { clearTimeout(requestTimer); clearTimeout(idleTimer); clearTimeout(feedbackTimer); clearTimeout(finalizeTimer); requestTimer = idleTimer = feedbackTimer = finalizeTimer = null; }
  function clearFlowTimers() { clearTimeout(restartTimer); clearTimeout(advanceTimer); restartTimer = advanceTimer = null; state.advancing = false; }
  function retireRecognition() {
    recognitionEpoch += 1;
    clearRecognitionTimers();
    const old = recognition;
    recognition = null;
    if (!old) return microphoneBarrier;
    old.onstart = old.onresult = old.onerror = old.onspeechend = old.onnomatch = old.onaudiostart = null;
    const micId = old.micId;
    old.onaudioend = () => { if (micId) life?.micEvent(micId, 'audio-ended'); };
    let settled = false;
    let timer;
    microphoneBarrier = new Promise(resolve => {
      old.onend = () => {
        clearTimeout(timer);
        old.onend = null;
        microphoneBarrier = Promise.resolve(true);
        if (micId) life?.endMic(micId);
        if (!settled) { settled = true; resolve(true); }
      };
      timer = setTimeout(() => {
        if (!settled) { settled = true; if (micId) life?.endMic(micId, { timedOut: true }); resolve(false); }
      }, 2500);
    });
    try { old.abort(); } catch (_) { /* Await end: never assume capture has stopped. */ }
    return microphoneBarrier;
  }
  function stopSpeech() {
    speechToken += 1;
    clearTimeout(speechTimer); speechTimer = null;
    state.playing = false;
    if (synth) synth.cancel();
    else if (canSpeak) window.speechSynthesis.cancel();
  }
  function stop(renderNow) {
    sessionEpoch += 1;
    state.sessionWanted = false;
    clearFlowTimers();
    retireRecognition();
    stopSpeech();
    state.phase = 'idle';
    state.partial = '';
    state.partialMessage = '';
    if (renderNow !== false) render();
  }
  function reportError(message) {
    stop(false);
    state.result = { kind: 'error', title: 'Микрофон остановлен', text: message };
    render();
  }
  function comparisonMarkup(expected, heard) {
    const target = String(expected || '');
    const observed = String(heard || '').trim();
    let start = 0, end = 0;
    while (start < target.length && start < observed.length && target[start].toLowerCase() === observed[start].toLowerCase()) start++;
    while (end < target.length - start && end < observed.length - start && target[target.length - 1 - end].toLowerCase() === observed[observed.length - 1 - end].toLowerCase()) end++;
    const changed = target.slice(start, target.length - end);
    return escape(target.slice(0, start)) + '<span class="voice-word-mismatch">' + escape(changed || target) + '</span>' + escape(target.slice(target.length - end));
  }
  function paintWordFeedback() {
    const heading = root()?.querySelector('.voice-target');
    const note = root()?.querySelector('.voice-inline-feedback');
    if (!heading || !note) return;
    const result = state.result;
    const partial = !result && state.partial;
    const kind = result && (result.kind === 'success' || result.kind === 'retry' || result.kind === 'error') ? result.kind : partial ? 'preview' : '';
    const heard = kind === 'preview' ? partial : result?.heard || '';
    heading.className = 'voice-target' + (kind ? ' voice-target--' + kind : state.sessionWanted ? ' voice-target--listening' : '');
    heading.innerHTML = kind === 'retry' || kind === 'preview' && normalize(heard) !== normalize(current().key)
      ? comparisonMarkup(current().key, normalize(heard)) : escape(current().key);
    note.className = 'voice-inline-feedback' + (kind ? ' voice-inline-feedback--' + kind : '');
    note.textContent = kind === 'success' ? '✓ Браузер распознал слово.'
      : kind === 'retry' ? 'Браузер услышал: ' + heard + '. Выделены буквы, не совпавшие с образцом.'
      : kind === 'preview' ? 'Сейчас слышу: ' + heard + '…'
      : kind === 'error' ? result.text || result.title
      : state.partialMessage || '';
    note.hidden = !note.textContent;
    const card = heading.closest('.voice-word-card');
    card?.classList.toggle('is-correct', kind === 'success');
    card?.classList.toggle('is-mismatch', kind === 'retry');
    card?.classList.toggle('is-error', kind === 'error');
  }
  function recordRecognition(alternatives, epoch) {
    if (!alternatives.length || state.advancing) return;
    const expected = current().key;
    const matched = alternatives.find(text => normalize(text) === normalize(expected));
    const correct = matched !== undefined;
    state.partial = '';
    state.partialMessage = '';
    restartCount = 0;
    state.result = { kind: correct ? 'success' : 'retry', title: correct ? 'Слово распознано!' : 'Попробуй ещё раз', heard: matched || alternatives[0], text: '' };
    if (correct) {
      state.completed.add(expected);
      if (!state.awarded.has(expected)) {
        state.awarded.add(expected);
        if (window.ReadFoxAcademy && typeof window.ReadFoxAcademy.awardVoice === 'function') window.ReadFoxAcademy.awardVoice(true);
      }
      sound('correct');
    } else sound('wrong');
    if (!state.continuous || correct && state.completed.size === state.deck.length) stop(false);
    else if (correct) autoAdvance(epoch);
    render();
  }
  function armIdleTimeout(epoch) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (activeSession(epoch)) reportError('Не удалось услышать речь. Когда будешь готов, нажми на микрофон и продолжи.');
    }, 30000);
  }
  function scheduleResume(epoch) {
    clearTimeout(restartTimer);
    if (!activeSession(epoch) || state.playing) return;
    state.phase = 'waiting';
    restartTimer = setTimeout(() => { restartTimer = null; launchRecognition(epoch); }, RESTART_DELAY);
    render();
  }
  function autoAdvance(epoch) {
    clearTimeout(advanceTimer);
    state.advancing = true;
    advanceTimer = setTimeout(() => {
      advanceTimer = null;
      state.advancing = false;
      if (!activeSession(epoch) || !state.continuous) return;
      if (state.completed.size === state.deck.length) { stop(false); render(); return; }
      for (let n = 1; n <= state.deck.length; n++) {
        const index = (state.index + n) % state.deck.length;
        if (!state.completed.has(state.deck[index].key)) { state.index = index; break; }
      }
      state.result = null;
      state.partial = '';
      render();
      if (!recognition) scheduleResume(epoch);
    }, exampleFor(current()) ? 4500 : 1250);
  }
  async function launchRecognition(epoch) {
    if (!activeSession(epoch) || state.playing || recognition) return;
    const ended = await microphoneBarrier;
    if (!activeSession(epoch) || state.playing || recognition) return;
    if (!ended) { reportError('Браузер ещё не подтвердил выключение микрофона. Подожди немного и начни снова.'); return; }
    const id = ++recognitionEpoch;
    let recognizer;
    try { recognizer = new Recognition(); } catch (_) { reportError('Служба распознавания сейчас недоступна в этом браузере.'); return; }
    recognition = recognizer;
    const micId = life ? life.beginMic('speaking') : '';
    recognizer.micId = micId;
    recognizer.lang = 'en-US';
    recognizer.continuous = state.continuous;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 5;
    let latestFinal = -1, interimText = '';
    state.phase = 'requesting';
    render();
    recognizer.onaudiostart = () => { if (micId) life.micEvent(micId, 'audio-started'); };
    recognizer.onaudioend = () => { if (micId) life.micEvent(micId, 'audio-ended'); };
    recognizer.onstart = () => {
      if (id !== recognitionEpoch || !activeSession(epoch)) return;
      clearTimeout(requestTimer); requestTimer = null;
      state.phase = 'listening';
      armIdleTimeout(epoch);
      feedbackTimer = setTimeout(() => {
        if (id === recognitionEpoch && activeSession(epoch) && !interimText && latestFinal < 0) {
          state.partialMessage = 'Микрофон включён, но браузер пока не передал речь. Попробуй ещё раз или проверь доступ к микрофону.';
          paintWordFeedback();
        }
      }, 6500);
      render();
    };
    recognizer.onresult = event => {
      if (id !== recognitionEpoch || !activeSession(epoch) || state.playing) return;
      clearTimeout(finalizeTimer); finalizeTimer = null;
      let alternatives = [], interim = [];
      for (let i = Math.max(event.resultIndex || 0, latestFinal + 1); i < event.results.length; i++) {
        const result = event.results[i];
        const hypotheses = [];
        for (let j = 0; j < result.length; j++) hypotheses.push(String(result[j].transcript || '').trim());
        if (result.isFinal) { latestFinal = i; alternatives = hypotheses.filter(Boolean); interim = []; }
        else if (hypotheses.length) interim = hypotheses.filter(Boolean);
      }
      if (alternatives.length) {
        clearTimeout(feedbackTimer); feedbackTimer = null;
        interimText = '';
        armIdleTimeout(epoch);
        recordRecognition(alternatives, epoch);
      } else if (interim.length && !state.advancing) {
        clearTimeout(feedbackTimer); feedbackTimer = null;
        interimText = interim[0];
        state.result = null;
        state.partial = interimText;
        state.partialMessage = '';
        armIdleTimeout(epoch);
        paintWordFeedback();
      }
    };
    recognizer.onspeechend = () => {
      if (id !== recognitionEpoch || !interimText || state.advancing) return;
      clearTimeout(finalizeTimer);
      finalizeTimer = setTimeout(() => {
        if (recognition === recognizer && interimText) try { recognizer.stop(); } catch (_) {}
      }, 700);
    };
    recognizer.onerror = event => {
      if (id !== recognitionEpoch) return;
      const messages = {
        'not-allowed': 'Доступ к микрофону закрыт. Разреши его для этого сайта в настройках браузера. Автоматических повторных запросов не будет.',
        'service-not-allowed': 'Браузер запретил распознавание. Прослушивание слов и обычные упражнения доступны.',
        'audio-capture': 'Микрофон не найден или занят. Проверь подключение и другие программы.',
        'network': 'Служба распознавания недоступна. Проверь интернет и начни снова, когда будешь готов.',
        'no-speech': 'Не удалось услышать речь. Нажми на микрофон, когда будешь готов продолжить.',
        'language-not-supported': 'Английское распознавание недоступно в этом браузере.',
        'aborted': 'Браузер остановил распознавание. Можно начать снова.'
      };
      reportError(messages[event.error] || 'Браузер остановил распознавание. Можно попробовать снова или перейти к упражнениям.');
    };
    recognizer.onnomatch = () => { if (id === recognitionEpoch) reportError('Не удалось разобрать слово. Прослушай образец и попробуй ещё раз.'); };
    recognizer.onend = () => {
      if (id !== recognitionEpoch) return;
      clearTimeout(finalizeTimer); clearTimeout(feedbackTimer);
      recognition = null;
      recognizer.onstart = recognizer.onresult = recognizer.onerror = recognizer.onend = recognizer.onnomatch = recognizer.onspeechend = recognizer.onaudiostart = recognizer.onaudioend = null;
      if (micId) life.endMic(micId);
      clearRecognitionTimers();
      microphoneBarrier = Promise.resolve(true);
      if (interimText && !state.advancing && activeSession(epoch)) recordRecognition([interimText], epoch);
      if (!activeSession(epoch) || state.playing || state.advancing) return;
      if (state.completed.size === state.deck.length) { stop(false); render(); return; }
      if (state.continuous && restartCount < MAX_RESTARTS) { restartCount += 1; scheduleResume(epoch); }
      else reportError(state.continuous ? 'Этот браузер завершает распознавание автоматически. Нажми микрофон, чтобы продолжить круг.' : 'Слово не распознано. Нажми на микрофон и попробуй ещё раз.');
    };
    requestTimer = setTimeout(() => {
      if (id === recognitionEpoch) reportError('Микрофон не включился. Проверь разрешение браузера и начни снова.');
    }, 14000);
    try { recognizer.start(); } catch (_) {
      recognition = null;
      recognizer.onstart = recognizer.onresult = recognizer.onerror = recognizer.onend = recognizer.onnomatch = null;
      if (micId) life.endMic(micId);
      microphoneBarrier = Promise.resolve(true);
      reportError('Браузер не смог включить микрофон. Проверь разрешение для этого сайта.');
    }
  }
  function startSession() {
    if (!Recognition || !state.consent) return;
    stop(false);
    state.sessionWanted = true;
    viewActive = true;
    restartCount = 0;
    state.result = null;
    state.partial = '';
    state.partialMessage = '';
    state.phase = 'requesting';
    sound('start');
    if (synth) synth.prepare();
    render();
    launchRecognition(sessionEpoch);
  }
  async function speak(slow, phrase) {
    if (!canSpeak) return;
    clearFlowTimers();
    stopSpeech();
    // Inside the tap: unlock/refresh the player. After a microphone session iOS needs a fresh audio route.
    if (synth) synth.prepare();
    const id = speechToken;
    const epoch = sessionEpoch;
    const text = phrase || current().key;
    state.playing = true;
    state.phase = 'speaking';
    const barrier = retireRecognition();
    render();
    const ended = await barrier;
    if (id !== speechToken || !state.playing || !viewActive || document.hidden) return;
    if (!ended) { reportError('Микрофон ещё выключается. Прослушивание начнётся только после его остановки — попробуй ещё раз.'); return; }
    // On iOS the audio route settles shortly after the microphone is released.
    if (life) { await life.waitForMicrophones(); if (id !== speechToken || !state.playing || !viewActive || document.hidden) return; }
    const cloud = Boolean(synth && synth.engine === 'audio');
    const done = () => {
      if (id !== speechToken) return;
      clearTimeout(speechTimer); speechTimer = null;
      state.playing = false;
      state.phase = 'idle';
      if (activeSession(epoch)) scheduleResume(epoch);
      else render();
    };
    const failed = () => {
      stop(false);
      state.result = { kind: 'error', title: 'Звук недоступен', text: 'Не удалось озвучить слово. Проверь звук и интернет или выбери системный голос в «Диалоге».' };
      render();
    };
    const system = () => {
      const native = window.speechSynthesis;
      if (!native) { failed(); return; }
      const fallback = new window.SpeechSynthesisUtterance(text);
      fallback.lang = 'en-US';
      fallback.rate = slow ? 0.65 : 0.9;
      const voices = native.getVoices();
      const voice = voices.find(item => /^en-US$/i.test(item.lang)) || voices.find(item => /^en\b/i.test(item.lang));
      if (voice) fallback.voice = voice;
      fallback.onend = done;
      fallback.onerror = () => { if (id === speechToken) failed(); };
      try { native.speak(fallback); } catch (_) { failed(); }
    };
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = cloud ? (slow ? 0.8 : 0.95) : (slow ? 0.65 : 0.9);
    if (!cloud && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(item => /^en-US$/i.test(item.lang)) || voices.find(item => /^en\b/i.test(item.lang));
      if (voice) utterance.voice = voice;
    }
    utterance.onend = done;
    utterance.onerror = () => {
      if (id !== speechToken) return;
      if (cloud && window.speechSynthesis) system(); else failed();
    };
    speechTimer = setTimeout(() => {
      if (id === speechToken) { stop(false); state.result = { kind: 'error', title: 'Озвучивание остановлено', text: 'Озвучивание не завершилось. Попробуй ещё раз.' }; render(); }
    }, 25000);
    try { (synth || window.speechSynthesis).speak(utterance); } catch (_) { utterance.onerror(); }
  }
  function navigate(delta) {
    const resume = state.sessionWanted && state.continuous;
    clearFlowTimers();
    retireRecognition();
    stopSpeech();
    state.index = (state.index + delta + state.deck.length) % state.deck.length;
    state.result = null;
    state.partial = '';
    state.partialMessage = '';
    state.phase = 'idle';
    if (resume) scheduleResume(sessionEpoch);
    else { state.sessionWanted = false; render(); }
  }
  function restart() {
    stop(false);
    state.deck = buildDeck();
    state.index = 0;
    state.completed.clear();
    state.result = null;
    state.partial = '';
    state.partialMessage = '';
    render();
  }
  function privacyHtml() {
    return '<section class="voice-privacy' + (!state.consent ? ' voice-privacy--pending' : '') + '"><div class="voice-privacy-heading">' + MIC + '<h3>Микрофон под твоим контролем</h3></div><p>Браузер может обрабатывать речь онлайн. ReadFox не сохраняет аудио. Микрофон включается только после нажатия.</p>' +
      (Recognition ? '<label class="voice-consent"><input type="checkbox" id="voiceConsent"' + (state.consent ? ' checked' : '') + '><span>Разрешаю распознавание речи. Запомнить мой выбор.</span></label><p class="voice-browser-note">Системное разрешение на микрофон контролирует браузер.</p>' : '<p class="voice-unsupported">В этом браузере распознавание недоступно. Можно слушать слова и проходить обычные упражнения.</p><button type="button" class="voice-btn voice-btn--next" data-voice="exercises">К упражнениям →</button>') +
      (!canSpeak ? '<p class="voice-unsupported">Озвучивание также не поддерживается этим браузером.</p>' : '') + '</section>';
  }
  function resultHtml() {
    const result = state.result;
    if (result && (result.kind === 'success' || result.kind === 'retry' || result.kind === 'error')) return '';
    if (!result) return '<div class="voice-result voice-result--idle" role="status"><span>' + (state.sessionWanted ? 'Микрофон включён для этого круга.' : 'Маленький шаг к свободной речи.') + '</span><p>' + (state.sessionWanted ? 'Говори слово на карточке. Остановить микрофон можно в любой момент.' : 'Послушай, повтори, попробуй ещё раз — здесь можно ошибаться.') + '</p></div>';
    return '<div class="voice-result voice-result--' + escape(result.kind) + '" role="status"><strong>' + (result.kind === 'success' ? CHECK : '') + escape(result.title) + '</strong>' + (result.heard ? '<p class="voice-heard">Услышали: <b lang="en">' + escape(result.heard) + '</b></p>' : '') + '<p>' + escape(result.text) + '</p></div>';
  }
  function render() {
    const container = root();
    if (!container) return;
    if (!state.deck.length) state.deck = buildDeck();
    const word = current();
    const count = state.completed.size;
    const complete = count === state.deck.length;
    const phase = state.phase;
    const micLabel = state.playing ? 'Слушаем образец' : phase === 'requesting' ? 'Включаем микрофон…' : phase === 'listening' ? (state.advancing ? 'Отлично! Следующее слово…' : 'Слушаю тебя…') : phase === 'waiting' ? 'Продолжаем разговор…' : state.continuous ? 'Начать разговорный круг' : 'Нажми и произнеси';
    container.innerHTML = '<div class="voice-page">' +
      '<header class="voice-heading"><h1>Говорение</h1><p>Послушай слово, произнеси его вслух — браузер проверит, распознал ли он его.</p></header>' +
      '<div class="voice-layout"><div class="voice-main"><div class="voice-session"><div><span>Твой разговорный круг · ' + escape(state.level) + '</span><strong>' + count + ' <span>/ ' + state.deck.length + ' слов</span></strong></div><div class="voice-progress" role="progressbar" aria-label="Распознано слов" aria-valuemin="0" aria-valuemax="' + state.deck.length + '" aria-valuenow="' + count + '"><span style="width:' + count / state.deck.length * 100 + '%"></span></div></div>' +
      (complete ? '<div class="voice-complete">' + CHECK + '<div><strong>Ты произнёс все ' + count + ' слов!</strong><p>Хорошая работа. Микрофон выключен. Начни новый круг, когда захочешь.</p></div></div>' : '') +
      (!state.consent ? privacyHtml() : '') +
      '<article class="voice-word-card' + (state.sessionWanted ? ' is-listening' : '') + '"><div class="voice-card-top"><span class="voice-source">' + (word.personal ? 'Из твоего словаря' : 'Частотные слова · ' + escape(state.level)) + '</span><span>' + (state.index + 1) + ' / ' + state.deck.length + (state.completed.has(word.key) ? ' · ✓' : '') + '</span></div>' +
      '<div class="voice-word"><h2 class="voice-target" lang="en">' + escape(word.key) + '</h2>' + (word.ipa ? '<p class="voice-ipa" lang="en">' + escape(word.ipa) + '</p>' : '') + '<p class="voice-translation">' + escape(word.translation) + '</p><p class="voice-inline-feedback" role="status" aria-live="polite" hidden></p></div>' +
      '<div class="voice-listen-actions"><button type="button" class="voice-btn voice-btn--listen" data-voice="listen"' + (!canSpeak ? ' disabled' : '') + '>' + SOUND + (state.playing ? 'Слушаем…' : 'Послушать') + '</button><button type="button" class="voice-btn voice-btn--slow" data-voice="slow"' + (!canSpeak ? ' disabled' : '') + '><span aria-hidden="true">0.8×</span> Медленно</button></div>' +
      exampleHtml(word) +
      '<div class="voice-recording"><div class="voice-wave' + (phase === 'listening' ? ' is-active' : '') + '" aria-hidden="true">' + '<i></i>'.repeat(13) + '</div><button type="button" class="voice-mic' + (state.sessionWanted || state.playing ? ' is-active' : '') + '" data-voice="mic" aria-label="' + escape(state.sessionWanted || state.playing ? 'Остановить микрофон и озвучивание' : micLabel) + '"' + (!Recognition || !state.consent ? ' disabled' : '') + '>' + (state.sessionWanted || state.playing ? '<span class="voice-stop-square" aria-hidden="true"></span>' : MIC) + '</button><p class="voice-mic-label">' + micLabel + '</p>' +
      (state.sessionWanted || state.playing ? '<button type="button" class="voice-cancel" data-voice="cancel">Остановить</button>' : '<span class="voice-mic-help">' + (!Recognition ? 'Распознавание недоступно в этом браузере' : !state.consent ? 'Разреши распознавание один раз ниже' : state.continuous ? 'Один старт — весь круг вслух' : 'Произнеси слово или фразу на карточке') + '</span>') + '</div>' +
      (Recognition ? '<label class="voice-continuous"><input type="checkbox" id="voiceContinuous"' + (state.continuous ? ' checked' : '') + '><span><strong>Говорить без пауз</strong><small>Следующее слово появится автоматически</small></span><span class="voice-switch" aria-hidden="true"></span></label>' : '') + '</article>' +
      resultHtml() + '<div class="voice-pagination"><button type="button" class="voice-btn voice-btn--previous" data-voice="previous" aria-label="Предыдущее слово">←<span> Назад</span></button><button type="button" class="voice-shuffle" data-voice="shuffle" title="Новый круг с другими словами">↻ <span>Новый круг</span></button><button type="button" class="voice-btn voice-btn--next" data-voice="next">' + (state.index === state.deck.length - 1 ? 'К началу' : 'Следующее') + ' <span aria-hidden="true">→</span></button></div></div>' +
      '<aside class="voice-sidebar"><section class="voice-tip-card"><span class="voice-eyebrow">Подсказка</span><h3>Не спеши</h3><p>' + escape(word.tip || 'Послушай образец и повтори слово в комфортном темпе. Слова для каждого круга подбираются из твоего словаря и частотного набора твоего уровня.') + '</p><p class="voice-tip-footnote">Проверяем, распознал ли браузер слово. Это не точная оценка отдельных звуков или акцента.</p></section>' +
      (state.consent ? privacyHtml() : '') + '</aside></div></div>';
    paintWordFeedback();
    if (synth && word && viewActive && !document.hidden) synth.preload(word.key);
    if (word && viewActive && !document.hidden) loadExample(word);
    if (!mounted) {
      container.addEventListener('click', event => {
        const button = event.target.closest('[data-voice]');
        if (!button || button.disabled) return;
        const action = button.dataset.voice;
        if (action === 'listen') speak(false);
        if (action === 'slow') speak(true);
        if (action === 'sentence') { const example = exampleFor(current()); if (example) speak(false, example.sentence); }
        if (action === 'mic') { if (state.sessionWanted || state.playing) stop(); else startSession(); }
        if (action === 'cancel') { stop(false); state.result = { kind: 'idle', title: 'Микрофон выключен', text: 'Твой прогресс сохранён. Продолжи, когда захочешь.' }; render(); }
        if (action === 'next') navigate(1);
        if (action === 'previous') navigate(-1);
        if (action === 'shuffle') restart();
        if (action === 'exercises' && window.ReadFoxBridge && window.ReadFoxBridge.openView) window.ReadFoxBridge.openView('practice');
      });
      container.addEventListener('change', event => {
        if (event.target.id === 'voiceConsent') {
          state.consent = event.target.checked;
          saveSetting(CONSENT_KEY, String(state.consent));
          if (!state.consent) stop(false);
        } else if (event.target.id === 'voiceContinuous') {
          state.continuous = event.target.checked;
          saveSetting(MODE_KEY, String(state.continuous));
          stop(false);
        } else return;
        render();
        const checkbox = document.getElementById(event.target.id);
        if (checkbox) checkbox.focus();
      });
      mounted = true;
    }
  }
  window.ReadFoxVoice = { render, stop };
  window.addEventListener('readfox:ready', render);
  window.addEventListener('readfox:change', () => { if (!state.deck.length) render(); });
  window.addEventListener('readfox:view', event => {
    viewActive = Boolean(event.detail && event.detail.view === 'speaking');
    if (viewActive) { if (!state.sessionWanted && getLevel() !== state.level) restart(); else render(); }
    else stop();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', () => stop(false));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();

