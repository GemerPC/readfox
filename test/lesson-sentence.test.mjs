import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const listeners = {};
const document = {
  readyState: 'loading',
  getElementById: () => null,
  addEventListener(type, fn) { listeners[type] = fn; }
};
const window = {
  document,
  localStorage: { getItem: () => null, setItem() {} },
  addEventListener(type, fn) { listeners[type] = fn; },
  speechSynthesis: { cancel() {}, getVoices: () => [], speak() {} },
  SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }
};
window.window = window;
const sandbox = { window, document, localStorage: window.localStorage, console, globalThis: null };
sandbox.globalThis = sandbox;
runInContext(readFileSync(new URL('../js/academy.js', import.meta.url), 'utf8'), createContext(sandbox));
const { englishSentence } = sandbox.window.ReadFoxAcademy;

test('speaks a chosen English sentence and ignores Russian or single-word options', () => {
  assert.equal(englishSentence('It might have involved more milk than we expected.'), 'It might have involved more milk than we expected.');
  assert.equal(englishSentence("  I'm fine, thanks.  "), "I'm fine, thanks.");
  assert.equal(englishSentence('Hello!'), '');
  assert.equal(englishSentence('открывать'), '');
  assert.equal(englishSentence('Это верный перевод'), '');
  assert.equal(englishSentence(''), '');
});

test('authored questions cover placement and a lesson when generation fails', () => {
  const placement = sandbox.window.ReadFoxAcademy.authoredQuestions('placement');
  assert.equal(placement.length, 12);
  const bands = {};
  for (const question of placement) bands[question.level] = (bands[question.level] || 0) + 1;
  assert.deepEqual(bands, {A1: 3, A2: 3, B1: 3, B2: 3});
  const lesson = sandbox.window.ReadFoxAcademy.authoredQuestions('lesson', {level: 'B1', questions: [{type: 'choice', prompt: 'Выбери перевод'}]});
  assert.equal(lesson[0].level, 'B1');
  assert.equal(sandbox.window.ReadFoxAcademy.authoredQuestions('lesson', {questions: []}), null);
});

test('the correct-answer path speaks the sentence and still keeps the word chip', () => {
  const source = readFileSync(new URL('../js/academy.js', import.meta.url), 'utf8');
  assert.match(source, /spokenSentence=!placement&&correct&&q\.type==='choice'\?englishSentence\(q\.answer\):''/);
  assert.match(source, /if\(spokenSentence\)speakSentence\(spokenSentence,/);
  assert.match(source, /else if\(!placement&&q\.reviewKey\)speak\(q\.reviewKey,/);
  assert.match(source, /data-action="say-sentence"/);
  assert.match(source, /data-action="say-word"/);
  assert.match(source, /if\(openAuthoredSet\(kind,lesson\)\)return;/);
});
