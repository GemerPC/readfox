import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const listeners = {};
const document = {
  readyState: 'loading',
  getElementById: () => null,
  querySelector: () => null,
  addEventListener(type, fn) { listeners[type] = fn; },
  documentElement: { style: { setProperty() {}, removeProperty() {} } },
  body: { classList: { toggle() {}, contains: () => false } }
};
const storage = new Map();
const window = {
  document,
  localStorage: { getItem: key => storage.get(key) || null, setItem(key, value) { storage.set(key, value); } },
  addEventListener(type, fn) { listeners[type] = fn; },
  speechSynthesis: { cancel() {}, getVoices: () => [], speak() {} },
  SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }
};
window.window = window;
const sandbox = { window, document, localStorage: window.localStorage, console, globalThis: null };
sandbox.globalThis = sandbox;
const context = createContext(sandbox);
runInContext(readFileSync(new URL('../js/dialogue-scripts.js', import.meta.url), 'utf8'), context);
runInContext(readFileSync(new URL('../js/dialogue.js', import.meta.url), 'utf8'), context);
const scripts = sandbox.window.ReadFoxDialogueScripts;
const dialogue = sandbox.window.ReadFoxDialogue;

test('every topic has an alternating A2 scene with both characters', () => {
  assert.deepEqual(Array.from(scripts.topics, String), ['cafe', 'meet', 'travel', 'daily', 'personal']);
  for (const topic of scripts.topics) {
    const scene = scripts.script(topic);
    assert.equal(scene.characters.length, 2);
    assert.deepEqual(Array.from(scene.characters, person => String(person.id)), ['tommy', 'hailey']);
    assert.ok(scene.lines.length >= 8 && scene.lines.length <= 12, topic);
    scene.lines.forEach((line, index) => {
      assert.equal(line.speaker, index % 2 === 0 ? scene.lines[0].speaker : scene.lines[0].speaker === 'tommy' ? 'hailey' : 'tommy');
      assert.match(line.en, /[A-Za-z]/);
      assert.match(line.ru, /[а-яё]/i);
      assert.equal(line.en.trim(), line.en);
      assert.equal(line.ru.trim(), line.ru);
    });
  }
});

test('the line check is soft and ignores punctuation', () => {
  const said = scripts.matchLine('I would like a coffee, please.', 'I would like a coffee please');
  assert.equal(said.ratio, 1);
  assert.equal(said.close, true);
  const partial = scripts.matchLine('I would like a coffee, please.', 'coffee please');
  assert.ok(partial.ratio < 0.6);
  assert.equal(partial.close, false);
  assert.equal(scripts.matchLine('Thank you.', '').close, false);
  assert.equal(scripts.matchLine('Thank you.', 'thanks you').close, false);
});

test('a memory hint reveals one more word and keeps its punctuation', () => {
  const text = 'I would like a coffee, please.';
  const shown = value => ({text: String(value.text), count: value.count, total: value.total, done: !!value.done});
  assert.deepEqual(shown(scripts.reveal(text, 0)), { text: '', count: 0, total: 6, done: false });
  assert.equal(scripts.reveal(text, 1).text, 'I');
  assert.equal(scripts.reveal(text, 5).text, 'I would like a coffee,');
  const full = scripts.reveal(text, 6);
  assert.equal(full.text, text);
  assert.equal(full.done, true);
  assert.equal(scripts.reveal(text, 9).text, text);
});

test('an old Fox session still loads, and a broken dual scene is ignored', () => {
  dialogue.importState({
    version: 2,
    selectedTopic: 'meet',
    session: {
      id: 'dialogue-fox1',
      topic: 'cafe',
      deck: [{ key: 'coffee', translation: 'кофе' }],
      messages: [{ role: 'user', text: 'Hello' }],
      turns: 1
    }
  });
  const fox = dialogue.exportState();
  assert.equal(fox.session.topic, 'cafe');
  assert.equal(fox.session.messages[0].text, 'Hello');
  assert.equal(fox.dual, null);

  dialogue.importState({
    version: 2,
    selectedTopic: 'cafe',
    dual: { phase: 'play', topic: 'missing', role: 'tommy', index: 3, memory: true }
  });
  assert.equal(dialogue.exportState().dual, null);
  assert.equal(dialogue.exportState().session, null);

  dialogue.importState({
    version: 2,
    selectedTopic: 'travel',
    session: {
      id: 'dialogue-fox2',
      topic: 'travel',
      deck: [{ key: 'ticket', translation: 'билет' }],
      messages: [{ role: 'bot', text: 'Hello', ru: 'Привет' }]
    },
    dual: { phase: 'play', topic: 'cafe', role: 'hailey', index: 2, slow: true, memory: true, reveal: 1, notes: [null, { heard: 'coffee please', close: false }] }
  });
  const both = dialogue.exportState();
  assert.equal(both.session.topic, 'travel');
  assert.equal(both.dual.role, 'hailey');
  assert.equal(both.dual.index, 2);
  assert.equal(both.dual.slow, true);
  assert.equal(both.dual.memory, true);
  assert.equal(both.dual.notes[1].heard, 'coffee please');
});
