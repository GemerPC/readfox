import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
const gains = [];
const limiters = [];
class Gain {
  constructor() { this.gain = { value: 0 }; gains.push(this); }
  connect() {}
}
class Limiter {
  constructor() {
    this.threshold = { value: 0 }; this.knee = { value: 0 }; this.ratio = { value: 0 };
    this.attack = { value: 0 }; this.release = { value: 0 };
    limiters.push(this);
  }
  connect() {}
}
class Ctx {
  constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { return new Gain(); }
  createDynamicsCompressor() { return new Limiter(); }
  createBuffer() { return { duration: 0.01, length: 1, numberOfChannels: 1 }; }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
const spoken = [];
const window = {
  AudioContext: Ctx,
  Audio: class { constructor() { this.volume = 1; } setAttribute() {} addEventListener() {} },
  speechSynthesis: { speak(utterance) { spoken.push(utterance); }, cancel() {}, resume() {}, getVoices: () => [] },
  localStorage: { getItem: key => storage.get(key) || null, setItem(key, value) { storage.set(key, value); } },
  ReadFoxAudioLifecycle: { isIOS: false, log() {}, registerOutput() {}, micGeneration: () => 0 }
};
window.window = window;
const sandbox = { window, localStorage: window.localStorage, document: { hidden: false }, console, globalThis: null };
sandbox.globalThis = sandbox;
runInContext(readFileSync(new URL('../js/dialogue-audio.js', import.meta.url), 'utf8'), createContext(sandbox));
const audio = window.ReadFoxDialogueAudio;

test('the three volume steps are different, saved, and applied to playing audio', () => {
  assert.ok(Math.abs(audio.gain() - 0.35) < 0.001);
  assert.ok(Math.abs(audio.configure({ boost: 'loud' }).gain - 0.7) < 0.001);
  assert.ok(Math.abs(audio.configure({ boost: 'max' }).gain - 1.5) < 0.001);
  assert.ok(audio.gain() > 1);
  assert.ok(audio.gain() / audio.configure({ boost: 'loud' }).gain > 1.8);
  assert.ok(audio.configure({ boost: 'loud' }).gain / audio.configure({ boost: 'off' }).gain > 1.8);
  assert.equal(JSON.parse(storage.get('readfox.dialogue.audio.v1')).boost, 'off');

  const synth = audio.createSynthesizer();
  synth.prepare();
  const playing = gains[gains.length - 1];
  assert.ok(Math.abs(playing.gain.value - 0.35) < 0.001);
  assert.equal(limiters[0].threshold.value, -1);
  audio.configure({ boost: 'max' });
  assert.ok(Math.abs(playing.gain.value - 1.5) < 0.001);
  audio.configure({ boost: 'loud' });
  assert.ok(Math.abs(playing.gain.value - 0.7) < 0.001);

  audio.configure({ engine: 'system', boost: 'off' });
  synth.speak({ text: 'Hello there' });
  assert.ok(Math.abs(spoken[0].volume - 0.35) < 0.001);
  audio.configure({ boost: 'max' });
  synth.speak({ text: 'Hello again' });
  assert.ok(Math.abs(spoken[1].volume - 1) < 0.001);
});
