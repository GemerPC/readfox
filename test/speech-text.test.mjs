import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
const window = {
  localStorage: { getItem: key => storage.get(key) || null, setItem(key, value) { storage.set(key, value); } },
  AudioContext: class { },
  Audio: class { }
};
window.window = window;
const sandbox = { window, localStorage: window.localStorage, document: { hidden: false }, console, globalThis: null };
sandbox.globalThis = sandbox;
runInContext(readFileSync(new URL('../js/dialogue-audio.js', import.meta.url), 'utf8'), createContext(sandbox));
const audio = window.ReadFoxDialogueAudio;

test('dialogue speech is one clean clip per line, and a long line splits only on sentences', () => {
  assert.equal(String(audio.speechClips('Tommy:  Hi, I am Tommy. What is your name?')), 'Hi, I am Tommy. What is your name?');
  assert.equal(String(audio.speechClips('I would like a coffee, please')), 'I would like a coffee, please.');
  assert.equal(audio.speechText('“Hello,” she said 🙂'), '"Hello," she said.');
  const long = 'This is a fairly long first sentence about the day, the weather outside, and the quiet street below the window. This is another fairly long sentence that should be its own clip because the whole reply is too long to stay as one single breath.';
  const clips = Array.from(audio.speechClips(long), String);
  assert.equal(clips.length, 2);
  assert.match(clips[0], /below the window\.$/);
  assert.match(clips[1], /single breath\.$/);
  assert.equal(clips[0].includes(','), true);
});
