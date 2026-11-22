import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const pending = [];
let clock = 0;
let seq = 1;
function setTimeout(fn, ms) {
  const item = { fn, due: clock + Number(ms || 0), id: seq++ };
  pending.push(item);
  return item.id;
}
function clearTimeout(id) {
  const item = pending.find(entry => entry.id === id);
  if (item) item.fn = null;
}
function flush(ms) {
  const target = clock + ms;
  for (let guard = 0; guard < 40; guard++) {
    const due = pending.filter(entry => entry.fn && entry.due <= target).sort((a, b) => a.due - b.due);
    if (!due.length) break;
    clock = due[0].due;
    const fn = due[0].fn;
    due[0].fn = null;
    fn();
  }
  clock = target;
}

const plays = [];
const fetches = [];
const spoken = [];
let duringClick = false;
let rejectAfter = 99;
let failSpeech = false;
let blobId = 1;
class FakeAudio {
  constructor() { this.src = ''; this.paused = true; this.playsinline = ''; }
  setAttribute() {}
  pause() { this.paused = true; }
  play() {
    const node = audioContexts[0] && audioContexts[0].gains && audioContexts[0].gains[0];
    const call = { src: this.src, sync: duringClick, el: this, gain: node ? node.gain.value : null };
    plays.push(call);
    this.paused = false;
    if (plays.length > rejectAfter) return Promise.reject(Object.assign(new Error('not allowed'), { name: 'NotAllowedError' }));
    return Promise.resolve();
  }
}
const speechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  cancels: 0,
  getVoices: () => [{ name: 'Daniel', lang: 'en-GB' }, { name: 'Samantha', lang: 'en-US' }],
  cancel() { this.cancels += 1; this.speaking = false; },
  resume() {},
  speak(utterance) { spoken.push({ text: utterance.text, voice: utterance.voice && utterance.voice.name, volume: utterance.volume, sync: duringClick, utterance }); }
};
class SpeechSynthesisUtterance {
  constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; this.lang = ''; this.voice = null; }
}
class Rec {
  start() { this.started = true; recs.push(this); if (this.onstart) this.onstart(); }
  abort() {}
}
const recs = [];
const cloud = { cancels: [], suspends: 0, prepare() {}, resume() { this.resumes = (this.resumes || 0) + 1; }, cancel(keep) { this.cancels.push(keep !== false); if (keep === false) this.suspends += 1; }, speak() { this.spoken = (this.spoken || 0) + 1; } };
const volumeHooks = [];
const volumeSteps = { off: 0.35, loud: 0.7, max: 1.5 };
let volumeBoost = 'loud';
class GainParam {
  constructor() { this.value = 1; this.samples = []; }
  setValueAtTime(value) { this.value = value; this.samples.push(value); }
  cancelScheduledValues() {}
}
class GainNode { constructor() { this.gain = new GainParam(); } connect() {} }
const audioContexts = [];
class AudioCtx {
  constructor() { this.state = 'running'; this.destination = {}; audioContexts.push(this); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { const node = new GainNode(); this.gains = this.gains || []; this.gains.push(node); return node; }
  createMediaElementSource(el) { this.sourceEl = el; return { connect() {} }; }
  createOscillator() { return { type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
}
const clicks = [];
const content = { innerHTML: '', dataset: {}, querySelectorAll: () => [], addEventListener(type, fn) { if (type === 'click') clicks.push(fn); } };
const storage = new Map();
const document = {
  readyState: 'interactive',
  hidden: false,
  getElementById: id => id === 'dialogueContent' ? content : null,
  querySelector: () => null,
  addEventListener() {},
  documentElement: { style: { setProperty() {}, removeProperty() {} } },
  body: { classList: { toggle() {}, contains: () => false } }
};
let micGate = null;
const window = {
  document,
  Audio: FakeAudio,
  speechSynthesis,
  SpeechSynthesisUtterance,
  SpeechRecognition: Rec,
  isSecureContext: true,
  scrollBy() {},
  setTimeout,
  clearTimeout,
  addEventListener() {},
  AudioContext: AudioCtx,
  ReadFoxDialogueAudio: {
    createSynthesizer: () => cloud,
    supported: true,
    settings: () => ({ engine: 'audio', boost: volumeBoost }),
    gain: () => volumeSteps[volumeBoost],
    configure(patch) { if (patch && patch.boost) volumeBoost = patch.boost; volumeHooks.forEach(fn => fn()); },
    onChange(fn) { volumeHooks.push(fn); }
  },
  ReadFoxAudioLifecycle: { waitForMicrophones: () => micGate, beginMic: () => 'mic-1', micEvent() {}, endMic() {}, snapshot: () => ({ activeRecognizers: 0 }) },
  localStorage: { getItem: key => storage.get(key) || null, setItem(key, value) { storage.set(key, value); } }
};
window.window = window;
function fetch(_url, init) {
  const body = JSON.parse(init.body);
  fetches.push({ body, sync: duringClick });
  if (failSpeech) return Promise.resolve({ ok: false, headers: { get: () => 'application/json' } });
  return Promise.resolve({ ok: true, headers: { get: () => 'audio/mpeg' }, arrayBuffer: async () => new ArrayBuffer(8) });
}
const sandbox = {
  window, document, localStorage: window.localStorage, SpeechSynthesisUtterance, Blob, URL: { createObjectURL: () => 'blob:' + (blobId++) , revokeObjectURL() {} },
  fetch, setTimeout, clearTimeout, console, globalThis: null
};
sandbox.globalThis = sandbox;
const context = createContext(sandbox);
runInContext(readFileSync(new URL('../js/dialogue-scripts.js', import.meta.url), 'utf8'), context);
runInContext(readFileSync(new URL('../js/dialogue.js', import.meta.url), 'utf8'), context);
const scripts = sandbox.window.ReadFoxDialogueScripts;
const dialogue = sandbox.window.ReadFoxDialogue;

function press(dataset) {
  const button = { disabled: false, dataset, closest: () => null };
  const event = { target: { closest: selector => selector === 'button' ? button : null }, stopPropagation() {} };
  duringClick = true;
  clicks[0](event);
  duringClick = false;
}
async function drain() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
function reset() {
  plays.length = 0; fetches.length = 0; spoken.length = 0; recs.length = 0;
  rejectAfter = 99; failSpeech = false; micGate = null; speechSynthesis.cancels = 0;
}

test('preview unlocks audio in the click and plays each cloud voice in order', async () => {
  assert.equal(clicks.length, 1);
  const scene = scripts.script('meet');
  reset();
  dialogue.importState({ version: 2, selectedTopic: 'meet', dual: { phase: 'picker', topic: 'meet', role: '', index: 0, slow: false, memory: false, reveal: 0, notes: [] } });
  plays.length = 0; fetches.length = 0;
  press({ dualAction: 'preview' });
  assert.ok(plays.length >= 1);
  assert.equal(plays[0].sync, true);
  assert.equal(fetches.length, 2);
  assert.equal(fetches[0].sync, true);
  assert.equal(fetches[0].body.voice, 'tommy');
  assert.equal(fetches[0].body.text, scene.lines[0].en);
  assert.equal(fetches[1].body.voice, 'hailey');
  assert.equal(fetches[1].body.text, scene.lines[1].en);
  await drain();
  assert.ok(plays.length >= 2);
  assert.equal(plays[1].el, plays[0].el);
  assert.equal(plays[1].el.playbackRate, 1);
  assert.equal(audioContexts.length, 1);
  assert.equal(audioContexts[0].sourceEl, plays[0].el);
  const firstGain = plays[1].gain;
  assert.equal(firstGain, 1);
  assert.equal(plays[1].el.volume, 1);
  plays[1].el.onended();
  await drain();
  const second = plays[plays.length - 1];
  assert.equal(second.gain, 1);
  assert.equal(second.el.volume, 1);
  window.ReadFoxDialogueAudio.configure({ boost: 'off' });
  assert.equal(audioContexts[0].gains[0].gain.value, 1);
  assert.match(content.innerHTML, /is-speaking/);
  const hailey = plays.filter(call => call !== plays[0] && call !== plays[1]);
  assert.ok(hailey.length >= 1);
  assert.equal(hailey[0].el, plays[0].el);
  assert.equal(spoken.length, 0);
});

test('a failed cloud voice falls back to two different English voices', async () => {
  reset();
  failSpeech = true;
  dialogue.importState({ version: 2, selectedTopic: 'cafe', dual: { phase: 'picker', topic: 'cafe', role: '', index: 0, slow: false, memory: false, reveal: 0, notes: [] } });
  spoken.length = 0; plays.length = 0;
  press({ dualAction: 'preview' });
  await drain();
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, scripts.script('cafe').lines[0].en);
  assert.equal(spoken[0].voice, 'Samantha');
  assert.equal(spoken[0].volume, 1);
  spoken[0].utterance.onend();
  await drain();
  assert.equal(spoken[1].text, scripts.script('cafe').lines[1].en);
  assert.equal(spoken[1].voice, 'Daniel');
});

test('partner lines play after the user line, and a rejected play shows Послушать', async () => {
  reset();
  dialogue.importState({ version: 2, selectedTopic: 'daily', dual: { phase: 'picker', topic: 'daily', role: 'tommy', index: 0, slow: false, memory: false, reveal: 0, notes: [] } });
  cloud.cancels.length = 0; cloud.suspends = 0; cloud.spoken = 0;
  press({ dualAction: 'begin' });
  press({ dualAction: 'speak' });
  assert.ok(cloud.cancels.includes(true));
  assert.equal(cloud.suspends, 0);
  const heard = scripts.script('daily').lines[2].en;
  dialogue.importState({ version: 2, selectedTopic: 'daily', dual: { phase: 'play', topic: 'daily', role: 'tommy', index: 2, slow: false, memory: false, reveal: 0, notes: [] } });
  plays.length = 0; fetches.length = 0; cloud.spoken = 0; recs.length = 0;
  let release;
  micGate = new Promise(resolve => { release = resolve; });
  press({ dualAction: 'speak' });
  assert.equal(plays[0].sync, true);
  recs[recs.length - 1].onresult({ results: [{ 0: { transcript: heard }, isFinal: true, length: 1 }] });
  assert.equal(fetches.length, 0);
  flush(300);
  release();
  await drain();
  const partner = fetches.find(call => call.body.voice === 'hailey' && call.body.text.includes('bed'));
  assert.ok(partner);
  assert.equal(cloud.spoken, 0);
  assert.ok(plays.length >= 2);

  plays.length = 0; fetches.length = 0; spoken.length = 0; rejectAfter = 1;
  dialogue.importState({ version: 2, selectedTopic: 'daily', dual: { phase: 'play', topic: 'daily', role: 'tommy', index: 3, slow: false, memory: false, reveal: 0, notes: [] } });
  plays.length = 0; fetches.length = 0;
  press({ dualAction: 'partner' });
  await drain();
  assert.match(content.innerHTML, /▶ Послушать/);
  assert.equal(spoken.length, 0);
  const beforeIcon = plays.length;
  press({ dualSay: '3' });
  await drain();
  assert.ok(plays.length > beforeIcon);
});

test('a dialogue line does not start while recognition is still active', async () => {
  const life = window.ReadFoxAudioLifecycle;
  const previousWait = life.waitForMicrophones;
  const previousSnapshot = life.snapshot;
  let active = 1;
  const sessions = [];
  life.snapshot = () => ({ activeRecognizers: active });
  life.waitForMicrophones = () => active ? new Promise(resolve => { window.__releaseMic = () => { active = 0; resolve(true); }; }) : null;
  life.setAudioSession = type => { sessions.push(type); return true; };
  plays.length = 0; fetches.length = 0;
  dialogue.importState({ version: 2, selectedTopic: 'meet', dual: { phase: 'picker', topic: 'meet', role: '', index: 0, slow: false, memory: false, reveal: 0, notes: [] } });
  plays.length = 0;
  press({ dualAction: 'preview' });
  await drain();
  assert.equal(plays.filter(call => call !== plays[0]).length, 0);
  assert.equal(sessions.includes('play-and-record'), false);
  window.__releaseMic();
  await drain();
  assert.ok(sessions.includes('playback'));
  assert.ok(plays.some(call => call !== plays[0] && call.gain === 1));
  life.waitForMicrophones = previousWait;
  life.snapshot = previousSnapshot;
  active = 0;
});
