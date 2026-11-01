import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const sandbox = { globalThis: {}, console };
sandbox.globalThis = sandbox;
runInContext(readFileSync(new URL('../js/shadow-words.js', import.meta.url), 'utf8'), createContext(sandbox));
const shadow = sandbox.ReadFoxShadow;

test('splits a sentence into spoken words and keeps punctuation out of the tokens', () => {
  assert.deepEqual([...shadow.words("Let's open the well-known book.")], ["Let's", 'open', 'the', 'well-known', 'book']);
  assert.deepEqual([...shadow.words('I wake up at seven o’clock!')].map(shadow.normalize), ['i', 'wake', 'up', 'at', 'seven', 'oclock']);
  assert.deepEqual([...shadow.words('')], []);
  assert.equal(shadow.tokens('Hello, world!')[1].index, 7);
});

test('accepts the same word and rejects a different or longer phrase', () => {
  assert.equal(shadow.matches('Hello!', ' hello '), true);
  assert.equal(shadow.matches('o’clock', "o'clock"), true);
  assert.equal(shadow.matches("don't", 'dont'), true);
  assert.equal(shadow.matches("o'clock", 'oclock'), true);
  assert.equal(shadow.matches('book', 'books'), false);
  assert.equal(shadow.matches('open', 'open the'), false);
  assert.equal(shadow.matches('the', ''), false);
});

test('moves to the next word after a match and finishes on the last one', () => {
  const first = shadow.afterAttempt({ index: 0, total: 3, misses: 2, expected: 'open', alternatives: ['OPEN.'] });
  assert.deepEqual({ ok: first.ok, index: first.index, misses: first.misses, done: first.done, replay: first.replay }, { ok: true, index: 1, misses: 0, done: false, replay: false });
  const last = shadow.afterAttempt({ index: 2, total: 3, misses: 0, expected: 'book', alternatives: ['look', 'book'] });
  assert.equal(last.done, true);
  assert.equal(last.index, 3);
  assert.equal(last.matched, 'book');
});

test('replays the same word on a miss and stops after three failures', () => {
  const first = shadow.afterAttempt({ index: 1, total: 4, misses: 0, expected: 'window', alternatives: ['winter'] });
  assert.equal(first.replay, true);
  assert.equal(first.stop, false);
  assert.equal(first.index, 1);
  assert.equal(first.misses, 1);
  assert.equal(first.heard, 'winter');
  const third = shadow.afterAttempt({ index: 1, total: 4, misses: 2, expected: 'window', alternatives: [] });
  assert.equal(third.stop, true);
  assert.equal(third.replay, false);
  assert.equal(third.misses, 3);
  assert.equal(third.heard, '');
});
