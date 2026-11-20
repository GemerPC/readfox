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
  for (let guard = 0; guard < 30; guard++) {
    const due = pending.filter(entry => entry.fn && entry.due <= target).sort((a, b) => a.due - b.due);
    if (!due.length) break;
    clock = due[0].due;
    const fn = due[0].fn;
    due[0].fn = null;
    fn();
  }
  clock = target;
}

const spoken = [];
let duringClick = false;
const speechSynthesis = {
  speaking: false,
  pending: false,
  paused: false,
  cancels: 0,
  getVoices: () => [],
  cancel() { this.cancels += 1; this.speaking = false; },
  resume() {},
  speak(utterance) {
    spoken.push({
      text: utterance.text,
      pitch: utterance.pitch,
      rate: utterance.rate,
      sync: duringClick,
      utterance
    });
    this.speaking = true;
    this.last = utterance;
  }
};
class SpeechSynthesisUtterance {
  constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; this.lang = ''; }
}
const clicks = [];
const content = {
  innerHTML: '',
  dataset: {},
  querySelectorAll: () => [],
  addEventListener(type, fn) { if (type === 'click') clicks.push(fn); }
};
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
const window = {
  document,
  speechSynthesis,
  SpeechSynthesisUtterance,
  scrollBy() {},
  setTimeout,
  clearTimeout,
  addEventListener() {},
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem(key, value) { storage.set(key, value); }
  }
};
window.window = window;
const sandbox = {
  window,
  document,
  localStorage: window.localStorage,
  SpeechSynthesisUtterance,
  setTimeout,
  clearTimeout,
  console,
  globalThis: null
};
sandbox.globalThis = sandbox;
const context = createContext(sandbox);
runInContext(readFileSync(new URL('../js/dialogue-scripts.js', import.meta.url), 'utf8'), context);
runInContext(readFileSync(new URL('../js/dialogue.js', import.meta.url), 'utf8'), context);
const scripts = sandbox.window.ReadFoxDialogueScripts;
const dialogue = sandbox.window.ReadFoxDialogue;

function press(action) {
  const button = { disabled: false, dataset: { dualAction: action }, closest: () => null };
  const event = {
    target: { closest: selector => selector === 'button' ? button : null },
    stopPropagation() {}
  };
  duringClick = true;
  clicks[0](event);
  duringClick = false;
}
function openPicker() {
  spoken.length = 0;
  speechSynthesis.cancels = 0;
  speechSynthesis.speaking = false;
  dialogue.importState({
    version: 2,
    selectedTopic: 'meet',
    dual: { phase: 'picker', topic: 'meet', role: '', index: 0, slow: false, memory: false, reveal: 0, notes: [] }
  });
}

test('preview speaks each line from the click, in order, and still advances if onend never fires', () => {
  assert.equal(clicks.length, 1);
  const scene = scripts.script('meet');
  openPicker();
  const cancelsBeforeSpeak = speechSynthesis.cancels;
  press('preview');
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].sync, true);
  assert.equal(spoken[0].text, scene.lines[0].en);
  assert.ok(Math.abs(spoken[0].pitch - 1.08) < 0.001);
  assert.equal(speechSynthesis.cancels, cancelsBeforeSpeak);
  assert.match(content.innerHTML, /is-speaking[\s\S]{0,240}Hi, I am Tommy/);
  assert.match(content.innerHTML, /Пауза/);
  assert.match(content.innerHTML, /Стоп/);

  spoken[0].utterance.onend();
  assert.equal(spoken.length, 2);
  assert.equal(spoken[1].sync, false);
  assert.equal(spoken[1].text, scene.lines[1].en);
  assert.ok(Math.abs(spoken[1].pitch - 0.84) < 0.001);
  assert.match(content.innerHTML, /is-speaking[\s\S]{0,240}I am Hailey/);

  openPicker();
  press('preview');
  assert.equal(spoken.length, 1);
  flush(8000);
  assert.equal(spoken.length, 2);
  assert.equal(spoken[1].text, scene.lines[1].en);

  openPicker();
  press('preview');
  press('preview-toggle');
  assert.ok(speechSynthesis.cancels > 0);
  assert.match(content.innerHTML, /Продолжить/);
  assert.doesNotMatch(content.innerHTML, /is-speaking/);
  const before = spoken.length;
  press('preview-toggle');
  assert.equal(spoken.length, before + 1);
  assert.equal(spoken[spoken.length - 1].sync, true);
  assert.equal(spoken[spoken.length - 1].text, scene.lines[0].en);

  press('preview-stop');
  assert.doesNotMatch(content.innerHTML, /data-dual-action="preview-stop"/);
  assert.match(content.innerHTML, /Прослушать весь диалог/);
});
