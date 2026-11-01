import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const sandbox = { globalThis: {}, console };
sandbox.globalThis = sandbox;
runInContext(readFileSync(new URL('../js/shadow-words.js', import.meta.url), 'utf8'), createContext(sandbox));
const shadow = sandbox.ReadFoxShadow;
const texts = sentence => Array.from(shadow.phrases(sentence), phrase => String(phrase.text));

test('splits on sentence punctuation and keeps short groups together', () => {
  assert.deepEqual(texts('Hello! How are you?'), ['Hello!', 'How are you?']);
  assert.deepEqual(texts('Good morning, sunshine!'), ['Good morning, sunshine!']);
  assert.deepEqual(texts('Hello, how are you?'), ['Hello, how are you?']);
  assert.deepEqual(texts(''), []);
});

test('breaks long stretches into chunks of about two to four words', () => {
  assert.deepEqual(texts("Let's open the well-known book."), ["Let's open", 'the well-known book.']);
  assert.deepEqual(texts('I would like a cup of coffee, please.'), ['I would like', 'a cup of', 'coffee, please.']);
  assert.deepEqual(texts('I wake up at seven o’clock!'), ['I wake up', 'at seven o’clock!']);
  texts('Please open the window and look at the sky today.').forEach(phrase => {
    const count = phrase.split(/\s+/).length;
    assert.ok(count >= 2 && count <= 4, phrase);
  });
});

test('pause grows with the phrase and stays long enough to repeat', () => {
  const short = shadow.pauseMs('Hello!');
  const medium = shadow.pauseMs('How are you?');
  const longer = shadow.pauseMs('I would like coffee');
  assert.equal(short, 1400);
  assert.ok(medium > short);
  assert.ok(longer > medium);
  assert.ok(longer <= 3400);
});
