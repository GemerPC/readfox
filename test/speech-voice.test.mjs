import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSpeech } from '../worker/src/speech.mjs';

const MALE = '536d3a5e000945adb7038665781a4aca';
const FEMALE = '933563129e564b19a115bedd57b7406a';

function mp3() {
  const bytes = new Uint8Array(16);
  bytes[0] = 0x49; bytes[1] = 0x44; bytes[2] = 0x33;
  return new Response(bytes, { status: 200 });
}

async function ask(voice, envExtra) {
  const bodies = [];
  const env = { OPENROUTER_API_KEY: 'test', OPENROUTER_FETCH: async (_url, init) => { bodies.push(JSON.parse(init.body)); return mp3(); }, ...envExtra };
  const request = new Request('https://readfox.example/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello there', ...(voice ? { voice } : {}) })
  });
  const response = await handleSpeech(request, env, 'https://readfox.example');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /^audio\//);
  return bodies[0];
}

test('dialogue roles ask Fish Audio for a male and a female voice', async () => {
  const tommy = await ask('tommy');
  const hailey = await ask('hailey');
  const fox = await ask('', { FISH_VOICE_ID: 'fox-voice' });
  const custom = await ask('hailey', { FISH_VOICE_FEMALE: 'custom-hailey' });
  assert.equal(tommy.voice, MALE);
  assert.equal(hailey.voice, FEMALE);
  assert.notEqual(tommy.voice, hailey.voice);
  assert.equal(fox.voice, 'fox-voice');
  assert.equal(custom.voice, 'custom-hailey');
});
