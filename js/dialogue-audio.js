/* Cloud TTS player shared by "Диалог" and "Говорение".
 *
 * Why it exists: on iOS (and especially iOS 15, where navigator.audioSession is missing) the
 * microphone/SpeechRecognition switches the audio session to "play and record" with voice
 * processing. Everything played afterwards — native speechSynthesis, <audio>, Web Audio — comes
 * out ducked or through the earpiece. A web page cannot change that route, so the player:
 *   1. plays cloud TTS through Web Audio with a make-up gain and a limiter ("Усиленная"/"Максимум");
 *   2. keeps a silent <audio> element running so iOS treats the page as media playback and the
 *      ringer switch does not mute Web Audio;
 *   3. starts playback slightly late after the microphone so the first syllable is not clipped;
 *   4. falls back to a plain <audio> element when the Web Audio graph is not available;
 *   5. caches decoded audio (memory + Cache Storage), so repeated words need no network.
 */
(function () {
'use strict';
const STORAGE = 'readfox.dialogue.audio.v1';
const CACHE_PREFIX = 'readfox-tts-';
const BOOST = Object.freeze({ off: 1, loud: 2.4, max: 4 });
const life = window.ReadFoxAudioLifecycle;
const IOS = !!life?.isIOS;
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const supported = Boolean(AudioContextClass) || typeof window.Audio === 'function';
const has = key => Object.prototype.hasOwnProperty.call(BOOST, key);
const settings = { engine: supported ? 'audio' : 'system', boost: IOS ? 'loud' : 'off' };
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
  if (saved) {
    if (['audio', 'system'].includes(saved.engine)) settings.engine = supported ? saved.engine : 'system';
    if (has(saved.boost)) settings.boost = saved.boost;
  }
  localStorage.setItem(STORAGE, JSON.stringify(settings));
} catch (_) { /* Storage may be unavailable in private mode. */ }
const log = (event, detail) => life?.log(event, detail);
function configure(patch = {}) {
  if (['audio', 'system'].includes(patch.engine)) settings.engine = supported ? patch.engine : 'system';
  if (has(patch.boost)) settings.boost = patch.boost;
  try { localStorage.setItem(STORAGE, JSON.stringify(settings)); } catch (_) { /* Optional. */ }
  return { ...settings };
}

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_CACHED = 24;
const MAX_CACHED_BYTES = 12 * 1024 * 1024;
const entries = new Map(); // text -> { bytes, type, buffer? } shared by all synthesizers
const loading = new Set();

function cacheKey(text) { return location.origin + '/__readfox-tts/' + encodeURIComponent(text.toLowerCase()); }
function speechEndpoint() { return window.READFOX_CONFIG?.speechEndpoint || 'https://readfox.gemerpc.workers.dev/speech'; }
// Saved phrases belong to one Fish voice: the server names it, and caches of other voices are removed.
let voiceKeyRequest = null;
function currentVoiceKey() {
  if (!voiceKeyRequest) {
    voiceKeyRequest = fetch(speechEndpoint()).then(response => response.ok ? response.json() : null)
      .then(info => typeof info?.voiceKey === 'string' && /^[0-9a-f]{12}$/.test(info.voiceKey) ? info.voiceKey : '')
      .catch(() => '');
    voiceKeyRequest.then(key => {
      if (!key || !('caches' in window)) return;
      caches.keys().then(names => names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_PREFIX + key).forEach(name => caches.delete(name))).catch(() => {});
    });
  }
  return voiceKeyRequest;
}
async function phraseCache() {
  const key = await currentVoiceKey();
  return key && 'caches' in window ? { key, cache: await caches.open(CACHE_PREFIX + key) } : null;
}
async function readStored(text) {
  try {
    if (!('caches' in window) || text.length > 120) return null;
    const store = await phraseCache();
    if (!store) return null;
    const cache = store.cache;
    const hit = await cache.match(cacheKey(text));
    if (!hit) return null;
    return { bytes: await hit.arrayBuffer(), type: hit.headers.get('Content-Type') || 'audio/wav' };
  } catch (_) { return null; }
}
async function writeStored(text, entry) {
  try {
    if (!('caches' in window) || text.length > 120) return;
    const store = await phraseCache();
    if (!store || entry.voiceKey !== store.key) return;
    const cache = store.cache;
    await cache.put(cacheKey(text), new Response(entry.bytes.slice(0), { headers: { 'Content-Type': entry.type } }));
    const keys = await cache.keys();
    for (const request of keys.slice(0, Math.max(0, keys.length - 300))) await cache.delete(request);
  } catch (_) { /* Cache Storage is a bonus only. */ }
}
function remember(text, entry) {
  entries.delete(text); entries.set(text, entry);
  let total = 0;
  for (const value of entries.values()) total += value.bytes.byteLength;
  while (entries.size > MAX_CACHED || total > MAX_CACHED_BYTES) {
    const key = entries.keys().next().value;
    total -= entries.get(key).bytes.byteLength;
    entries.delete(key);
  }
}

function silentWav(ms = 100) {
  const samples = Math.round(8000 * ms / 1000), bytes = new ArrayBuffer(44 + samples * 2), view = new DataView(bytes);
  const write = (at, text) => { for (let i = 0; i < text.length; i++) view.setUint8(at + i, text.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data');
  view.setUint32(40, samples * 2, true);
  return new Blob([bytes], { type: 'audio/wav' });
}

function createSynthesizer() {
  const native = window.speechSynthesis;
  let context = null, limiter = null, gain = null, media = null, mediaUrl = '', keepUrl = '';
  let job = null, serial = 0, preparing = Promise.resolve(), graphFailure = null, elementFailure = null, prepareVersion = 0;
  let priming = false, elementUnlocked = false, micGeneration = -1;
  const outputName = 'tts-' + Math.random().toString(36).slice(2, 8);
  life?.registerOutput(outputName, () => ({
    engine: settings.engine, boost: settings.boost, transport: job?.transport || 'idle',
    audioContextState: context?.state || 'none', elementPaused: media?.paused ?? true, volume: 1
  }));

  const abortError = () => Object.assign(new Error('Озвучка отменена.'), { name: 'AbortError' });
  function bounded(promise, ms, message) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })]).finally(() => clearTimeout(timer));
  }
  const current = j => job === j && !j.cancelled && j.id === serial && !document.hidden;
  const wantsGraph = () => Boolean(AudioContextClass) && (!IOS || settings.boost !== 'off');

  /* ── Web Audio graph: source → gain → limiter → speakers ── */
  function graph(fresh = false) {
    if (fresh && context) { const old = context; context = limiter = gain = null; void old.close().catch(() => {}); }
    if (!context || context.state === 'closed') {
      context = new AudioContextClass();
      gain = context.createGain();
      limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -9; limiter.knee.value = 6; limiter.ratio.value = 14;
      limiter.attack.value = 0.003; limiter.release.value = 0.12;
      gain.connect(limiter); limiter.connect(context.destination);
      micGeneration = life?.micGeneration?.() ?? 0;
    }
    gain.gain.value = BOOST[settings.boost] ?? 1;
    return context;
  }

  /* ── <audio> element: plain playback, silent keep-alive, and unlock ── */
  function element() {
    if (media) return media;
    media = new window.Audio();
    media.preload = 'auto'; media.volume = 1; media.setAttribute('playsinline', ''); media.setAttribute('webkit-playsinline', '');
    for (const event of ['play', 'pause', 'ended']) {
      media.addEventListener(event, () => log('[TTS_AUDIO_EVENT]', { event, priming, readyState: media.readyState, paused: media.paused }));
    }
    return media;
  }
  function clearElement() {
    if (!media) return;
    media.onplaying = media.onended = media.onerror = media.onloadedmetadata = null;
    media.pause(); media.loop = false; media.srcObject = null; media.removeAttribute('src'); media.load();
    if (mediaUrl) { URL.revokeObjectURL(mediaUrl); mediaUrl = ''; }
    if (keepUrl) { URL.revokeObjectURL(keepUrl); keepUrl = ''; }
  }
  // iOS: a playing <audio> keeps the page in the media ("playback") category, so Web Audio ignores the ringer switch.
  function keepAlive() {
    if (!IOS || !media) return;
    try {
      if (keepUrl) URL.revokeObjectURL(keepUrl);
      keepUrl = URL.createObjectURL(silentWav(400));
      media.loop = true; media.src = keepUrl; media.volume = 0.01;
      Promise.resolve(media.play()).catch(() => {});
    } catch (_) { /* Playback still works without it. */ }
  }

  function prepare(reset = false) {
    if (settings.engine !== 'audio') return;
    const version = ++prepareVersion; graphFailure = elementFailure = null;
    try {
      const tasks = [];
      if (wantsGraph()) {
        // A context created before the microphone was used stays ducked on iOS; a gesture may replace it.
        const stale = IOS && context && (life?.micGeneration?.() ?? 0) !== micGeneration;
        const ctx = graph(reset || stale);
        tasks.push(bounded(Promise.resolve(ctx.resume()), 6000, 'Нажми «Повторить звук», чтобы разрешить воспроизведение.').then(() => {
          // A one-sample buffer completes the iOS unlock.
          const source = ctx.createBufferSource(); source.buffer = ctx.createBuffer(1, 1, 22050); source.connect(ctx.destination);
          try { source.start(0); } catch (_) {}
          if (ctx.state !== 'running') throw Error('Браузер приостановил звук. Нажми «Повторить звук».');
        }).catch(error => { if (version === prepareVersion) graphFailure = error; }));
      }
      if (IOS || !AudioContextClass) {
        const audio = element();
        if (!elementUnlocked && !(life?.snapshot().activeRecognizers > 0)) {
          clearElement(); priming = true;
          mediaUrl = URL.createObjectURL(silentWav(100)); audio.src = mediaUrl;
          tasks.push(bounded(Promise.resolve(audio.play()), 6000, 'Нажми «Повторить звук», чтобы разрешить воспроизведение.').then(() => {
            if (version === prepareVersion) { elementUnlocked = true; priming = false; clearElement(); }
          }).catch(error => { if (version === prepareVersion) { priming = false; clearElement(); elementFailure = error; } }));
        }
      }
      preparing = Promise.all(tasks).then(() => {});
    } catch (error) { if (version === prepareVersion) graphFailure = error; preparing = Promise.resolve(); }
  }

  async function suspendOutput() {
    const ctx = context;
    if (!ctx || ctx.state !== 'running') return;
    await bounded(Promise.resolve(ctx.suspend()), 3000, 'Браузер ещё завершает звук.');
    log('[AUDIO_CONTEXT_RELEASED]', { state: ctx.state });
  }
  function detachSource(j) {
    if (j.source) { j.source.onended = null; try { j.source.stop(); } catch (_) {} try { j.source.disconnect(); } catch (_) {} j.source = null; }
  }
  function cancel(keepPreparation = false) {
    const old = job; job = null; serial++;
    if (!keepPreparation) { prepareVersion++; preparing = Promise.resolve(); graphFailure = elementFailure = null; priming = false; }
    if (old) { old.cancelled = true; old.abort.abort(); clearTimeout(old.timer); detachSource(old); log('[TTS_PLAYBACK_END]', { cancelled: true }); }
    if (!priming) clearElement();
    if (!keepPreparation) void suspendOutput().catch(() => {});
    try { native?.cancel(); } catch (_) {}
    if (old) setTimeout(() => old.utterance.onend?.({ type: 'end', cancelled: true }), 60);
  }

  async function readAudio(response, j) {
    if (Number(response.headers.get('Content-Length') || 0) > MAX_BYTES) throw Error('Аудио слишком большое.');
    const type = response.headers.get('Content-Type') || '';
    if (!/^audio\/(?:mpeg|mp3|wav|x-wav)(?:;|$)/i.test(type) || !response.body) throw Error('Сервис вернул неполное аудио. Повтори звук.');
    const reader = response.body.getReader(), chunks = [];
    let size = 0;
    try {
      while (true) {
        if (j && !current(j)) throw abortError();
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > MAX_BYTES) throw Error('Аудио слишком большое.');
        chunks.push(part.value);
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error; } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const part of chunks) { bytes.set(part, offset); offset += part.length; }
    return { bytes: bytes.buffer, type };
  }
  async function download(text, j, signal) {
    const endpoint = speechEndpoint();
    for (let attempt = 0; attempt < 2; attempt++) {
      log('[TTS_REQUEST]', { attempt: attempt + 1, characters: text.length });
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal });
      if (j && !current(j)) throw abortError();
      if (attempt === 0 && [502, 503, 504].includes(response.status)) {
        await response.body?.cancel().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 400));
        if (j && !current(j)) throw abortError();
        continue;
      }
      if (!response.ok) {
        let detail; try { detail = await response.json(); } catch (_) {}
        throw Error(detail?.error || 'Озвучка недоступна. Повтори звук или выбери системный голос.');
      }
      const audio = await readAudio(response, j);
      return { ...audio, voiceKey: response.headers.get('X-ReadFox-Voice-Key') || '' };
    }
  }
  async function fetchEntry(text, j, signal) {
    let entry = entries.get(text);
    if (entry) { entries.delete(text); entries.set(text, entry); return entry; }
    entry = await readStored(text);
    // Only phrases in the current Fish voice are kept between visits; fallback audio has no voice key.
    if (!entry) { entry = await download(text, j, signal); void writeStored(text, entry); }
    remember(text, entry);
    return entry;
  }

  function begin(j, duration, transport) {
    if (!current(j) || j.playing) return;
    j.playing = true; j.transport = transport; clearTimeout(j.timer);
    j.timer = setTimeout(() => fail(j, Error('Воспроизведение остановилось. Нажми «Повторить звук».')), (Math.min(120, Number.isFinite(duration) && duration > 0 ? duration : 120) + 8) * 1000);
    log('[TTS_PLAYBACK_START]', { transport, boost: settings.boost });
    j.utterance.onstart?.({ type: 'start' });
  }
  async function finish(j) {
    if (!current(j)) return;
    clearTimeout(j.timer); detachSource(j); clearElement();
    try { await suspendOutput(); } catch (error) { if (current(j)) fail(j, error); return; }
    if (!current(j)) return;
    job = null;
    log('[TTS_PLAYBACK_END]', { cancelled: false });
    j.utterance.onend?.({ type: 'end' });
  }
  function fail(j, error) {
    if (!current(j)) return;
    job = null; j.cancelled = true; j.abort.abort(); clearTimeout(j.timer); detachSource(j); clearElement(); void suspendOutput().catch(() => {});
    log('[TTS_PLAYBACK_END]', { failed: true, errorName: error?.name || 'Error' });
    j.utterance.onerror?.({ error: 'audio-playback', message: error?.message || 'Не удалось озвучить ответ.' });
  }

  function playElement(j, entry) {
    const audio = element(); clearElement();
    mediaUrl = URL.createObjectURL(new Blob([entry.bytes], { type: entry.type }));
    const url = mediaUrl, rate = j.rate;
    audio.volume = 1; audio.muted = false; audio.loop = false; audio.srcObject = null; audio.src = url;
    audio.defaultPlaybackRate = audio.playbackRate = rate;
    const valid = () => current(j) && mediaUrl === url;
    audio.onloadedmetadata = () => { if (valid() && (!Number.isFinite(audio.duration) || audio.duration <= 0 || audio.duration > 120)) fail(j, Error('Сервис вернул неподходящее аудио.')); };
    audio.onplaying = () => { if (valid() && !audio.paused) begin(j, audio.duration / rate, 'html-audio'); };
    audio.onended = () => { if (valid() && audio.ended) void finish(j); };
    audio.onerror = () => { if (valid()) fail(j, Error('Не удалось воспроизвести аудио. Нажми «Повторить звук».')); };
    log('[TTS_AUDIO_CREATED]', { transport: 'html-audio', bytes: entry.bytes.byteLength });
    Promise.resolve(audio.play()).catch(error => {
      if (error?.name === 'NotAllowedError') elementUnlocked = false;
      if (valid()) fail(j, Error(error?.name === 'NotAllowedError' ? 'Safari требует нажатия. Нажми «Повторить звук».' : 'Не удалось включить звук. Нажми «Повторить звук».'));
    });
  }

  async function playGraph(j, entry) {
    const ctx = graph();
    if (!entry.buffer) {
      entry.buffer = await bounded(new Promise((resolve, reject) => {
        const copy = entry.bytes.slice(0), result = ctx.decodeAudioData(copy, resolve, reject);
        if (result && typeof result.then === 'function') result.then(resolve, reject);
      }), 10000, 'Не удалось прочитать аудио.');
    }
    if (!current(j)) return false;
    const buffer = entry.buffer;
    if (!Number.isFinite(buffer.duration) || buffer.duration <= 0 || buffer.duration > 120 || buffer.length * buffer.numberOfChannels > 6000000) throw Error('Сервис вернул слишком длинное аудио.');
    await bounded(Promise.resolve(ctx.resume()), 6000, 'Нажми «Повторить звук», чтобы включить динамик.');
    if (!current(j)) return false;
    if (ctx.state !== 'running') return false;
    const source = ctx.createBufferSource();
    j.source = source; source.buffer = buffer; source.playbackRate.value = j.rate;
    source.connect(gain);
    source.onended = () => { if (current(j)) void finish(j); };
    // After a microphone session iOS needs a moment on the new route; a late start keeps the first syllable intact.
    const afterMic = IOS && (life?.micGeneration?.() ?? 0) > 0;
    keepAlive();
    log('[TTS_AUDIO_CREATED]', { transport: 'web-audio', duration: buffer.duration, gain: gain.gain.value });
    source.start(ctx.currentTime + (afterMic ? 0.18 : 0.04));
    begin(j, buffer.duration / j.rate + 0.3, 'web-audio');
    return true;
  }

  async function run(j) {
    try {
      await preparing;
      if (!current(j)) return;
      const entry = await fetchEntry(j.text, j, j.abort.signal);
      if (!current(j)) return;
      if (wantsGraph()) {
        let graphError = graphFailure;
        try { if (await playGraph(j, entry)) return; graphError = graphError || Error('Браузер приостановил звук. Нажми «Повторить звук».'); }
        catch (error) { if (!current(j)) return; graphError = error; log('[TTS_GRAPH_FALLBACK]', { message: String(error?.message || error) }); }
        if (!current(j)) return;
        // Outside iOS there is no second route; on iOS the unlocked <audio> element is the fallback.
        if (!IOS || (elementFailure && !elementUnlocked)) throw graphError;
      } else if (elementFailure && !elementUnlocked) throw elementFailure;
      playElement(j, entry);
    } catch (error) { if (current(j)) fail(j, error); }
  }

  function speak(utterance) {
    if (settings.engine === 'system') { native.speak(utterance); return; }
    cancel(true);
    const rate = Math.min(1.25, Math.max(0.75, Number(utterance.rate) || 0.95));
    const j = { id: ++serial, utterance, text: String(utterance.text || '').trim(), rate, abort: new AbortController(), playing: false, cancelled: false, source: null, timer: null, transport: '' };
    job = j;
    if (!j.text || j.text.length > 1600) { fail(j, Error('Ответ слишком длинный для озвучки.')); return; }
    j.timer = setTimeout(() => fail(j, Error('Голос готовится слишком долго. Повтори звук или выбери системный голос.')), 50000);
    void run(j);
  }
  // Warm the cache for words that are likely to be played soon.
  function preload(text) {
    const value = String(text || '').trim();
    if (settings.engine !== 'audio' || !value || value.length > 120 || entries.has(value) || loading.has(value)) return;
    loading.add(value);
    void fetchEntry(value, null, undefined).catch(() => {}).finally(() => loading.delete(value));
  }

  return {
    get speaking() { return !!job?.playing || !!native?.speaking; },
    get pending() { return !!(job && !job.playing) || priming || !!native?.pending; },
    get engine() { return settings.engine; },
    speak, cancel, prepare, preload,
    beforeCapture: async () => { await suspendOutput(); clearElement(); await window.ReadFoxSound?.release?.(); },
    resume() { if (settings.engine === 'system') native?.resume(); },
    getVoices() { return settings.engine === 'system' ? (native?.getVoices() || []) : []; }
  };
}
window.ReadFoxDialogueAudio = Object.freeze({ supported, settings: () => ({ ...settings }), configure, createSynthesizer, boostLevels: Object.freeze(Object.keys(BOOST)) });
})();
