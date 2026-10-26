(function () {
  'use strict';

  // Half-duplex conversation: the microphone is fully stopped before Fox speaks.
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const life=window.ReadFoxAudioLifecycle;
  const log=(event,detail)=>life?.log(event,detail);
  const synthesis = window.ReadFoxDialogueAudio?.createSynthesizer() || window.speechSynthesis;
  const supported = Boolean(Recognition && synthesis && window.SpeechSynthesisUtterance && window.isSecureContext !== false);
  const SILENCE_MS = 1400;
  const MAX_EMPTY_RESTARTS = 2;

  function create(options) {
    const callbacks = options || {};
    const state = { supported: supported, active: false, phase: 'idle', interim: '', message: '' };
    let generation = 0, capture = null, utterance = null, emptyRestarts = 0;
    let micReady = true, micBarrier = Promise.resolve(true);
    let audioReady = true, audioBarrier = Promise.resolve(true);
    let restartTimer = null, speechTimer = null;
    let autoListen = true, resetOutput = false, quietEnd = false;
    let routeSettled = true, routeBarrier = Promise.resolve(true), routeTimer = null;
    let routeOwned = false, priorRoute = 'auto', lastRoute = '';
    let audioSession = null;
    try { audioSession = window.navigator && window.navigator.audioSession; } catch (_) {}
    const nav = window.navigator || {};
    const needsRouteSettle = Boolean(audioSession || /iPad|iPhone|iPod/.test(nav.userAgent || '') || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1));
    const captureTimers = new Set();
    function emit() { window.ReadFoxSound?.setVoiceActive?.(state.active,'dialogue'); if (typeof callbacks.onState === 'function') callbacks.onState(Object.assign({}, state)); }
    function set(phase, message, interim) {
      state.phase = phase; state.message = message || '';
      if (interim !== undefined) state.interim = interim;
      emit();
    }
    function permitted() {
      return state.active && !document.hidden && (typeof callbacks.canListen !== 'function' || callbacks.canListen());
    }
    function current(epoch) { return epoch === generation && state.active && !document.hidden; }
    function later(fn, ms) {
      const timer = setTimeout(function () { captureTimers.delete(timer); fn(); }, ms);
      captureTimers.add(timer); return timer;
    }
    function clearCaptureTimers() {
      captureTimers.forEach(clearTimeout); captureTimers.clear();
    }
    function clearFlowTimers() {
      clearTimeout(restartTimer); restartTimer = null;
      clearTimeout(speechTimer); speechTimer = null;
      clearCaptureTimers();
    }
    function detach(rec) {
      rec.onstart = rec.onresult = rec.onerror = rec.onend = rec.onspeechend = rec.onspeechstart = rec.onnomatch = rec.onaudiostart = rec.onaudioend = null;
    }

    function route(type) {
      if (!audioSession) return;
      try {
        const previous = audioSession.type;
        audioSession.type = type;
        if (!routeOwned) { priorRoute = previous || 'auto'; routeOwned = true; }
        lastRoute = type;
      } catch (_) { /* Older Safari has no writable AudioSession API. */ }
    }
    function releaseRouteIfIdle() {
      if (state.active || capture || utterance || !micReady || !audioReady || !routeSettled || !routeOwned) return;
      try { if (audioSession.type === lastRoute) audioSession.type = priorRoute; } catch (_) {}
      routeOwned = false;
    }
    function microphoneEnded(c) {
      life?.endMic(c?.micId,{audioEndObserved:!!c?.audioEnded,reason:c?.audioEnded?'audioend-and-end':'end-without-exposed-audio-events'});
      // audioend is capture stop; end is service disconnection. Both are awaited when exposed.
      route('playback');
      if (!needsRouteSettle) { releaseRouteIfIdle(); return; }
      routeSettled = false;
      let finish;
      const barrier = new Promise(function (resolve) { finish = resolve; });
      routeBarrier = barrier;
      clearTimeout(routeTimer);
      routeTimer = setTimeout(function () {
        if (routeBarrier === barrier) {
          routeSettled = true; routeBarrier = Promise.resolve(true); routeTimer = null;
          releaseRouteIfIdle();
        }
        finish(true);
      }, life?.isIOS?life.settleMs():350);
    }


    function retireMicrophone() {
      clearCaptureTimers();
      const old=capture;capture=null;if(!old)return micBarrier;
      const rec=old.rec;old.valid=false;detach(rec);micReady=false;
      life?.micEvent(old.micId,'stopping');
      let finish,timeout;const barrier=new Promise(resolve=>{finish=resolve;});micBarrier=barrier;
      function release(){
        if(!old.serviceEnded||(old.audioStarted&&!old.audioEnded))return;
        clearTimeout(timeout);detach(rec);old.rec=null;
        if(micBarrier===barrier){micReady=true;micBarrier=Promise.resolve(true);microphoneEnded(old);}
        finish(true);
      }
      rec.onstart=function(){life?.micEvent(old.micId,'started');life?.micEvent(old.micId,'stopping');try{rec.abort();}catch(_){}};
      rec.onaudiostart=function(){old.audioStarted=true;old.audioEnded=false;life?.micEvent(old.micId,'audio-started');try{rec.abort();}catch(_){}};
      rec.onaudioend=function(){old.audioEnded=true;life?.micEvent(old.micId,'audio-ended');release();};
      rec.onend=function(){old.serviceEnded=true;release();};
      timeout=setTimeout(function(){finish(false);},3000);
      if(old.serviceEnded)release();else try{rec.abort();}catch(_){/* End events, not abort() returning, establish release. */}
      return barrier;
    }
    function retireSpeech() {
      clearTimeout(speechTimer); speechTimer = null;
      const old = utterance;
      utterance = null;
      if(old)log('[AI_PLAYBACK_END]',{cancelled:true});
      if (!old) return audioBarrier;
      old.onstart = old.onend = old.onerror = null;
      audioReady = false;
      let finish, timeout, probe;
      const barrier = new Promise(function (resolve) { finish = resolve; });
      audioBarrier = barrier;
      function done(ok) {
        clearTimeout(timeout); clearTimeout(probe);
        if (ok) old.onend = old.onerror = null;
        if (ok && audioBarrier === barrier) { audioReady = true; audioBarrier = Promise.resolve(true); releaseRouteIfIdle(); }
        finish(ok);
      }
      old.onend = old.onerror = function () { done(true); };
      try { synthesis.cancel(); } catch (_) { /* A paused UI is safer than another microphone. */ }
      // Some browsers do not fire an end event for cancelled speech. The engine's
      // own speaking/pending flags can also confirm that its audio has stopped.
      probe = setTimeout(function () {
        if (!synthesis.speaking && !synthesis.pending) done(true);
      }, 200);
      timeout = setTimeout(function () { done(!synthesis.speaking && !synthesis.pending); }, 3000);
      return barrier;
    }
    function halt(phase, message) {
      generation += 1; state.active = false;
      clearFlowTimers(); retireMicrophone(); retireSpeech();
      set(phase, message, '');
      releaseRouteIfIdle();
    }
    function error(message) { halt('error', message); }
    function pause(message) { halt('paused', message || 'Разговор на паузе. Нажми микрофон, чтобы продолжить.'); }
    function stop() { halt('idle', ''); }
    function quietThen(epoch, fn) {
      if (micReady && audioReady && routeSettled) {
        const shared=life?.waitForMicrophones();
        if(shared){shared.then(ok=>{if(!current(epoch))return;if(ok)quietThen(epoch,fn);else pause('Микрофон другой вкладки ещё выключается. Подожди и продолжи голосом.');});return;}
        if(current(epoch))fn();return;
      }
      Promise.all([micBarrier, audioBarrier, routeBarrier]).then(function (ended) {
        if (!current(epoch)) return;
        if (!ended.every(Boolean)) {
          pause('Браузер ещё завершает звук или запись. Подожди немного и нажми микрофон снова.');
          return;
        }
        // A microphone release can install a new route barrier while we wait.
        quietThen(epoch, fn);
      });
    }
    function emptyCapture(epoch, message) {
      if (!current(epoch)) return;
      if (emptyRestarts >= MAX_EMPTY_RESTARTS) {
        pause(message || 'Не удалось услышать речь. Нажми микрофон, когда будешь готов.');
        return;
      }
      emptyRestarts += 1;
      set('starting', 'Не расслышал. Попробуй сказать ещё раз.', '');
      restartTimer = setTimeout(function () {
        restartTimer = null;
        if (current(epoch) && permitted()) launch(epoch);
      }, 650);
    }
    function transcript(c, includeInterim) {
      return c.segments.map(function (part) {
        return part && (part.final || includeInterim) ? part.text : '';
      }).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
    function deliver(c, epoch) {
      if (!current(epoch) || c.delivered) return;
      c.delivered = true;
      const text = transcript(c, c.explicitFinish);
      if (!text) {
        emptyCapture(epoch, 'Не удалось разобрать фразу. Нажми микрофон и попробуй ещё раз.');
        return;
      }
      emptyRestarts = 0;
      set('thinking', 'Фокс обдумывает ответ…', '');
      if (typeof callbacks.onTranscript === 'function') {
        try { callbacks.onTranscript(text); }
        catch (_) { error('Не удалось отправить фразу. Продолжи разговор с помощью клавиатуры.'); }
      }
    }
    function finishCapture(explicit) {
      const c = capture;
      if (!c || !c.valid || !state.active || c.stopping) return;
      c.explicitFinish = Boolean(explicit);
      c.stopping = true;
      life?.micEvent(c.micId,'stopping');
      clearCaptureTimers();
      set('starting', 'Завершаю фразу…');
      const epoch = generation;
      // stop(), unlike abort(), gives the recognizer a chance to finalize speech.
      later(function () {
        if (capture === c && current(epoch)) pause('Распознавание не завершилось. Нажми микрофон и повтори фразу.');
      }, 4500);
      try { c.rec.stop(); }
      catch (_) { pause('Браузер не завершил запись. Нажми микрофон и попробуй ещё раз.'); }
    }
    function launch(epoch) {
      if (!current(epoch) || !permitted() || capture || utterance) return;
      quietThen(epoch, function () {
        if (!permitted() || capture || utterance) return;
        function acquire(){
        if(!current(epoch)||!permitted()||capture||utterance)return;
        if (synthesis.speaking || synthesis.pending) {
          pause('Дождись окончания озвучки и нажми микрофон снова.');
          return;
        }
        let rec;
        try { rec = new Recognition(); }
        catch (_) { error('Распознавание недоступно в этом браузере. Можно продолжить с клавиатуры.'); return; }
        const c = { rec:rec,micId:life?.beginMic('dialogue'),audioStarted:false,audioEnded:false,serviceEnded:false,valid:true,delivered:false,stopping:false,explicitFinish:false,segments:[],silenceTimer:null };
        capture = c; micReady = false;
        // The live capture has no barrier until it is retired. quietThen is only
        // reached when no capture exists, so no new recording can overlap it.
        rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
        function valid() { return capture === c && c.valid && current(epoch); }
        function armSilence() {
          clearTimeout(c.silenceTimer); captureTimers.delete(c.silenceTimer);
          c.silenceTimer = later(function () { if (valid()) finishCapture(false); }, SILENCE_MS);
        }
        rec.onstart = function () {
          if (!valid()) {try{rec.abort();}catch(_){}return;}
          life?.micEvent(c.micId,'started');
          clearCaptureTimers();
          set('listening', 'Говори по-английски. После паузы фраза отправится сама.', '');
          later(function () {
            if (!valid()) return;
            if (transcript(c, true)) finishCapture(false);
            else pause('Пока ничего не слышно. Нажми микрофон, когда будешь готов.');
          }, 45000);
        };
        rec.onspeechstart = function () {
          if (!valid() || c.stopping) return;
          clearTimeout(c.silenceTimer); captureTimers.delete(c.silenceTimer);
        };
        rec.onspeechend = function () {
          if (valid() && !c.stopping && transcript(c, true)) armSilence();
        };
        rec.onresult = function (event) {
          if (!valid()) return;
          // Result indices replace prior interim hypotheses; they are not appended.
          for (let i = Number(event.resultIndex) || 0; i < event.results.length; i += 1) {
            const result = event.results[i];
            c.segments[i] = { text: String(result[0] && result[0].transcript || '').trim(), final: Boolean(result.isFinal) };
          }
          c.segments.length = event.results.length;
          state.interim = transcript(c, true);
          emit();
          if (!c.stopping && state.interim) armSilence();
        };
        rec.onerror = function (event) {
          if (!valid()) return;
          const code = event.error;
          if (code === 'no-speech') {
            c.valid = false;
            retireMicrophone();
            quietThen(epoch, function () { emptyCapture(epoch); });
            return;
          }
          const messages = {
            'not-allowed': 'Разреши микрофон для этого сайта в настройках браузера, затем нажми «Продолжить голосом».',
            'service-not-allowed': 'Браузер запретил распознавание. Проверь разрешения или продолжи с клавиатуры.',
            'audio-capture': 'Микрофон не найден или занят. Проверь его и нажми «Продолжить голосом».',
            network: 'Не удалось связаться со службой распознавания. Проверь интернет и продолжи голосом.',
            'language-not-supported': 'Английское распознавание недоступно. Проверь языки системы или используй клавиатуру.',
            aborted: 'Браузер остановил запись. Нажми микрофон, чтобы продолжить.'
          };
          error(messages[code] || 'Не удалось распознать фразу. Нажми микрофон снова или используй клавиатуру.');
        };
        rec.onnomatch = function () {
          if (valid()) pause('Не удалось разобрать фразу. Нажми микрофон и попробуй ещё раз.');
        };
        function releaseCapture(){
          if(!valid()||!c.serviceEnded||(c.audioStarted&&!c.audioEnded))return;
          capture=null;c.valid=false;clearCaptureTimers();detach(rec);c.rec=null;
          micReady=true;micBarrier=Promise.resolve(true);microphoneEnded(c);deliver(c,epoch);
        }
        rec.onaudiostart=function(){if(!valid()){try{rec.abort();}catch(_){}return;}c.audioStarted=true;c.audioEnded=false;life?.micEvent(c.micId,'audio-started');};
        rec.onaudioend=function(){c.audioEnded=true;life?.micEvent(c.micId,'audio-ended');releaseCapture();};
        rec.onend=function(){
          if(!valid())return;c.serviceEnded=true;releaseCapture();
          if(valid()&&c.audioStarted&&!c.audioEnded){set('starting','Safari завершает запись…');later(()=>{if(valid())pause('Safari ещё не подтвердил выключение микрофона. Подожди и продолжи голосом.');},3000);}
        };
        later(function () {
          if (valid()) error('Микрофон не включился. Проверь разрешение для сайта и попробуй снова.');
        }, 15000);
        set('starting', 'Включаю микрофон…', '');
        try { route('play-and-record'); rec.start(); }
        catch (_) {
          capture = null; c.valid = false; detach(rec); clearCaptureTimers();
          life?.endMic(c.micId,{audioEndObserved:false,reason:'start-failed-before-capture'});
          micReady = true; micBarrier = Promise.resolve(true);
          error('Браузер не смог включить микрофон. Проверь разрешение и нажми микрофон снова.');
        }
        }
        const release=synthesis.beforeCapture?.();
        if(release?.then)release.then(acquire).catch(()=>{if(current(epoch))pause('Браузер ещё завершает звук. Подожди и продолжи голосом.');});else acquire();
      });
    }
    function listen() {
      if (!state.active) return;
      if (!permitted()) { set('thinking', 'Фокс обдумывает ответ…', ''); return; }
      if (capture || utterance) return;
      launch(generation);
    }
    function waiting() {
      if (!state.active) return;
      generation += 1;
      clearFlowTimers(); retireMicrophone(); retireSpeech();
      set('thinking', 'Фокс обдумывает ответ…', '');
    }
    function speak(text) {
      if (!state.active || document.hidden) return;
      const value = String(text || '').trim().slice(0, 4000);
      if (!value) { listen(); return; }
      generation += 1;
      const epoch = generation;
      clearFlowTimers(); retireMicrophone(); retireSpeech();
      set(synthesis.engine==='audio'?'loading-audio':'speaking', synthesis.engine==='audio'?'Готовлю голос Фокса…':'Фокс говорит. Микрофон выключен.', '');
      quietThen(epoch, function () {
        route('playback');
        if (resetOutput) {
          resetOutput = false;
          if(synthesis.engine!=='audio')try { synthesis.cancel(); synthesis.resume(); } catch (_) {}
        }
        let spoken;
        try { spoken = new window.SpeechSynthesisUtterance(value); }
        catch (_) { pause('Озвучка недоступна. Можно прочитать ответ и продолжить с клавиатуры.'); return; }
        spoken.lang = 'en-US'; spoken.rate = 0.9; spoken.pitch = 1; spoken.volume = 1;
        try {
          const voices = synthesis.getVoices();
          const voice = voices.find(function (v) { return /^en-US$/i.test(v.lang); }) || voices.find(function (v) { return /^en\b/i.test(v.lang); });
          if (voice) spoken.voice = voice;
        } catch (_) { /* The browser's default English voice remains available. */ }
        utterance = spoken; audioReady = false;
        function valid() { return utterance === spoken && current(epoch); }
        spoken.onstart = function () { if(valid()){log('[AI_PLAYBACK_START]',{engine:synthesis.engine||'system'});if(synthesis.engine!=='audio')log('[TTS_PLAYBACK_START]',{transport:'speech-synthesis'});set('speaking','Фокс говорит. Микрофон выключен.','');} };
        spoken.onend = function () {
          if (!valid()) return;
          log('[AI_PLAYBACK_END]',{cancelled:false});if(synthesis.engine!=='audio')log('[TTS_PLAYBACK_END]',{transport:'speech-synthesis'});
          clearTimeout(speechTimer); speechTimer = null;
          spoken.onstart = spoken.onend = spoken.onerror = null;
          utterance = null; audioReady = true; audioBarrier = Promise.resolve(true);
          if (!autoListen) { if (quietEnd) stop(); else pause('Проверка звука завершена. Нажми «Продолжить голосом», когда будешь готов.'); return; }
          set('starting', 'Твоя очередь…', '');
          restartTimer = setTimeout(function () { restartTimer = null; if (current(epoch)) listen(); }, 300);
        };
        spoken.onerror = function (event) {
          if (valid()) pause(event?.message || 'Браузер не смог озвучить ответ. Проверь звук и английский голос, затем нажми микрофон.');
        };
        // Cloud playback owns separate preparation and duration-based playback deadlines.
        if (synthesis.engine !== 'audio') speechTimer = setTimeout(function () {
          if (valid()) pause('Озвучка не завершилась. Ответ сохранён в чате. Нажми микрофон, чтобы продолжить.');
        }, Math.min(90000, Math.max(18000, value.length * 150)));
        if(synthesis.engine!=='audio'){log('[TTS_REQUEST]',{transport:'speech-synthesis',characters:value.length});log('[TTS_AUDIO_CREATED]',{transport:'speech-synthesis'});}
        try { synthesis.speak(spoken); }
        catch (_) { spoken.onerror(); }
      });
    }
    function start(text, resumeListening = true, recoverOutput = false, endQuietly = false) {
      if (!supported) {
        error(window.isSecureContext === false
          ? 'Голосовой чат работает по HTTPS или на localhost. Здесь можно использовать клавиатуру.'
          : 'Этот браузер не поддерживает голосовой чат. Попробуй Safari на iPhone или Chrome, либо используй клавиатуру.');
        return;
      }
      if (document.hidden) { pause('Открой вкладку и нажми микрофон, чтобы начать разговор.'); return; }
      generation += 1; clearFlowTimers(); retireMicrophone(); retireSpeech();
      autoListen = resumeListening; resetOutput = recoverOutput; quietEnd = endQuietly;
      window.ReadFoxPlayback?.stop?.();window.ReadFoxSound?.setVoiceActive?.(true,'dialogue');
      if(typeof text==='string'&&text.trim()||recoverOutput)synthesis.prepare?.(recoverOutput);
      state.active = true; state.interim = ''; emptyRestarts = 0;
      set('starting', 'Начинаем голосовой разговор…', '');
      if (typeof text === 'string' && text.trim()) speak(text);
      else listen();
    }
    function recover(text) { start(text || 'Hello! Can you hear me clearly?', false, true); }
    // Reads one phrase aloud; a running voice conversation resumes listening afterwards, otherwise the mic stays off.
    function say(text) { start(text, state.active, true, !state.active); }
    function finish() { finishCapture(true); }
    function getState() { return Object.assign({}, state); }
    return Object.freeze({ start: start, pause: pause, stop: stop, waiting: waiting, speak: speak, listen: listen, finish: finish, getState: getState, recover: recover, say: say });
  }
  window.ReadFoxDialogueVoice = Object.freeze({ create: create });
}());

