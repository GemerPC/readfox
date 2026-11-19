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

test('word comparison ignores case, contractions and near spellings', () => {
  const same = scripts.compareWords('I would like a coffee, please.', 'i would like a coffee please');
  assert.equal(same.mismatches.length, 0);
  assert.equal(same.close, true);
  const contraction = scripts.compareWords("I'd like a coffee.", 'I would like a coffee.');
  assert.equal(contraction.mismatches.length, 0);
  const fuzzy = scripts.compareWords('I would like a coffee, please.', 'I would like a coffe, please.');
  assert.equal(fuzzy.mismatches.length, 0);
  const one = scripts.compareWords('I would like a coffee, please.', 'I would like a tea, please.');
  assert.equal(one.mismatches.length, 1);
  assert.equal(String(one.mismatches[0].expected), 'coffee');
  assert.ok(one.ratio >= 0.5 && one.ratio < 1);
  const poor = scripts.compareWords('I would like a coffee with milk, please.', 'hello there friend');
  assert.ok(poor.ratio < 0.5);
  assert.equal(scripts.similarWord('coffee', 'coffe'), true);
  assert.equal(scripts.similarWord('coffee', 'tea'), false);
  const marks = scripts.wordMarks('I would like a coffee, please.', 'I would like a tea, please.');
  const byToken = {};
  for (const mark of marks) byToken[String(mark.token)] = !!mark.ok;
  assert.equal(byToken.coffee, false);
  assert.equal(byToken.like, true);
  assert.equal(scripts.wordMarks("I'd like coffee.", 'I would like coffee.').every(mark => mark.ok), true);
  assert.equal(scripts.lineKind('I would like a coffee, please.', 'I would like a coffee, please.'), 'ok');
  assert.equal(scripts.lineKind('I would like a coffee, please.', 'I would like a tea, please.'), 'almost');
  assert.equal(scripts.lineKind('I would like a coffee with milk, please.', 'hello there'), 'miss');
  assert.equal(scripts.nextStreak(2, 'ok'), 3);
  assert.equal(scripts.nextStreak(2, 'almost'), 0);
  assert.equal(scripts.nextStreak(2, 'miss'), 0);
  assert.equal(scripts.nextStreak(2, 'skip'), 2);
});

test('both characters stay in the transcript and auto mode has a listen limit', () => {
  const source = readFileSync(new URL('../js/dialogue.js', import.meta.url), 'utf8');
  assert.match(source, /for\(let i=0;i<scene\.lines\.length;i\+\+\)/);
  assert.match(source, /hide=!reading&&current&&learner&&!!d\.memory&&!coaching/);
  assert.match(source, /data-dual-action="auto"/);
  assert.match(source, /dualAuto\?'Стоп':'Авто'/);
  assert.match(source, /setTimeout\(\(\)=>\{if\(dualListening\)finish\(said,false\);\},9000\)/);
  assert.match(source, /if\(dualCanListen\(\)\)\{dualListen\(true\);return;\}/);
  assert.match(source, /Почти! Вот это слово немного не похоже/);
  assert.match(source, /Отлично, теперь похоже!/);
  assert.doesNotMatch(source, /неправильно/);
  assert.match(source, /data-dual-action="coach-repeat"/);
  assert.match(source, /0\.7/);
  assert.match(source, /Повторить только это слово/);
  assert.match(source, /Прослушать весь диалог/);
  assert.match(source, /id="dualScript"/);
  assert.match(source, /function dualPreviewSay/);
  assert.match(source, /class="dialogue-primary dual-listen" data-dual-action="preview"/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /function dualDing/);
});

test('the role screen shows the whole script before a role is chosen', () => {
  const content = { innerHTML: '', querySelectorAll: () => [] };
  document.getElementById = id => id === 'dialogueContent' ? content : null;
  dialogue.importState({
    version: 2,
    selectedTopic: 'meet',
    dual: { phase: 'picker', topic: 'meet', role: '', index: 0, slow: false, memory: false, reveal: 0, notes: [] }
  });
  const html = content.innerHTML;
  const scene = scripts.script('meet');
  assert.match(html, /Знакомство/);
  assert.match(html, /data-dual-action="preview">Прослушать весь диалог/);
  assert.doesNotMatch(html, /data-dual-action="preview"[^>]*disabled/);
  assert.match(html, /data-dual-action="begin"[^>]*disabled/);
  assert.match(html, /К темам/);
  assert.equal(html.split('dual-line-hit').length - 1, scene.lines.length);
  scene.lines.forEach(line => {
    assert.ok(html.includes(line.en.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))), line.en);
    assert.ok(html.includes(line.ru), line.ru);
  });
  assert.equal(html.includes('· ты'), false);
  dialogue.importState({
    version: 2,
    selectedTopic: 'meet',
    dual: { phase: 'picker', topic: 'meet', role: 'hailey', index: 0, slow: false, memory: false, reveal: 0, notes: [] }
  });
  assert.match(content.innerHTML, /Hailey · ты/);
  assert.match(content.innerHTML, /is-mine/);
  assert.doesNotMatch(content.innerHTML, /Tommy · ты/);
  document.getElementById = () => null;
});
