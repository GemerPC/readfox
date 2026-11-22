import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const session = { type: 'auto' };
const window = { navigator: { audioSession: session } };
window.window = window;
const sandbox = { window, console, globalThis: null };
sandbox.globalThis = sandbox;
runInContext(readFileSync(new URL('../js/audio-lifecycle.js', import.meta.url), 'utf8'), createContext(sandbox));
const life = window.ReadFoxAudioLifecycle;

test('the audio session is playback except while a microphone is open', () => {
  assert.equal(life.canPlay(), true);
  assert.equal(life.setAudioSession('playback'), true);
  assert.equal(session.type, 'playback');
  const id = life.beginMic('practice');
  assert.equal(life.canPlay(), false);
  assert.equal(life.setAudioSession('play-and-record'), true);
  assert.equal(session.type, 'play-and-record');
  life.endMic(id, { reason: 'done' });
  assert.equal(life.canPlay(), true);
  life.setAudioSession('playback');
  assert.equal(session.type, 'playback');
  const blocked = { type: 'auto' };
  Object.defineProperty(blocked, 'type', { set() { throw new Error('unavailable'); }, get() { return 'auto'; } });
  window.navigator.audioSession = blocked;
  assert.equal(life.setAudioSession('playback'), false);
});
