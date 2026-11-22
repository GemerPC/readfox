import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
storage.set('readfox.dialogue.audio.v1', JSON.stringify({ engine: 'audio', boost: 'max' }));
const gains = [];
const limiters = [];
class Gain {
  constructor() {
    this.gain = { value: 1, setValueAtTime(v) { this.value = v; this.samples = (this.samples || []).concat(v); }, cancelScheduledValues() {} };
    gains.push(this);
  }
  connect() {}
}
class Ctx {
  constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0; this.compressors = 0; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { return new Gain(); }
  createDynamicsCompressor() { this.compressors += 1; throw new Error('compressor ducks later words'); }
  createBuffer() { return { duration: 0.01, length: 1, numberOfChannels: 1 }; }
  createBufferSource() { return { connect() {}, start() {} }; }
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

test('playback stays at full volume and ignores the old volume steps', () => {
  const saved = JSON.parse(storage.get('readfox.dialogue.audio.v1'));
  assert.equal(saved.boost, undefined);
  assert.equal(audio.gain(), 1);
  assert.equal(audio.configure({ boost: 'off' }).gain, 1);
  assert.equal(audio.configure({ boost: 'max' }).gain, 1);
  const synth = audio.createSynthesizer();
  synth.prepare();
  const playing = gains[gains.length - 1];
  assert.equal(playing.gain.value, 1);
  assert.equal(playing.gain.samples.every(value => value === 1), true);
  audio.configure({ engine: 'system' });
  synth.speak({ text: 'Hello there' });
  synth.speak({ text: 'Hello again' });
  assert.equal(spoken[0].volume, 1);
  assert.equal(spoken[1].volume, 1);
});
