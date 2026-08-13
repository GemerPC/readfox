import assert from "node:assert/strict";
import worker from "./src/index.mjs";

const modelReplies = [
  {
    model:"test/translator",
    choices:[{finish_reason:"stop", message:{content:"ENGLISH_TOPIC: quiet weekends at home"}}]
  },
  {
    model:"test/context-translator",
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: берег\nMATCHED_FRAGMENT: берегу\nSENTENCE_TRANSLATION: Мы сидели на берегу реки."}}]
  },
  {
    model:"test/free",
    choices:[{finish_reason:"stop", message:{content:"TITLE: A Quiet Sunday\nTEXT:\nMia stayed home on Sunday.\n\nShe made tea and read a book."}}]
  },
  {
    model:"test/free",
    choices:[{finish_reason:"stop", message:{content:'{"title":"A Train Ride","body":"Tom found a seat.\\n\\nThe train left on time."}'}}]
  },
  {
    model:"test/free",
    choices:[{finish_reason:"length", message:{content:"TITLE: The Busy Market\nTEXT:\nAnna visited the market early. She bought fruit and spoke with a friendly seller."}}]
  },
  {
    model:"test/free",
    choices:[{finish_reason:"stop", message:{content:"TITLE: The Missing Background\nTEXT:\nMia tried to recognize a familiar voice while she waited near the narrow entrance."}}]
  },
  {
    model:"test/context-translator",
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: банк\nMATCHED_FRAGMENT: банк\nSENTENCE_TRANSLATION: Мы сидели на берегу реки."}}]
  },
  {
    model:"test/context-translator",
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: берег\nSENTENCE_TRANSLATION: Мы сидели на берегу реки."}}]
  },
  {
    model:"test/context-translator",
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: по-настоящему\nMATCHED_FRAGMENT: по-настоящему\nSENTENCE_TRANSLATION: Он хотел по-настоящему жить."}}]
  }
];

const openRouterRequests = [];
globalThis.fetch = async (url, init) => {
  assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
  const request = JSON.parse(init.body);
  openRouterRequests.push(request);
  assert.equal(request.max_tokens === 160 || request.max_tokens === 500 || request.max_tokens === 1200, true);
  assert.equal("reasoning" in request, false);
  assert.equal("response_format" in request, false);
  return new Response(JSON.stringify(modelReplies.shift()), {
    status:200,
    headers:{"Content-Type":"application/json"}
  });
};

async function generate(payload = {topic:"a weekend at home", level:"B1", mode:"topic", words:[]}){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/generate", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify(payload)
  }), {OPENROUTER_API_KEY:"test-key"});
}

async function translate(topic){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/translate", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify({topic})
  }), {OPENROUTER_API_KEY:"test-key"});
}

async function translateWord(word, sentence){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/translate-word", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify({word, sentence})
  }), {OPENROUTER_API_KEY:"test-key"});
}

const translationResponse = await translate("тихие выходные дома");
assert.equal(translationResponse.status, 200);
const translation = await translationResponse.json();
assert.equal(translation.translatedTopic, "quiet weekends at home");
assert.equal(openRouterRequests[0].max_tokens, 160);
assert.match(openRouterRequests[0].messages[0].content, /\/no_think/);
assert.match(openRouterRequests[0].messages[1].content, /тихие выходные дома/);

const contextualResponse = await translateWord("bank", "We sat on the bank of the river.");
assert.equal(contextualResponse.status, 200);
const contextual = await contextualResponse.json();
assert.equal(contextual.translation, "берег");
assert.equal(contextual.matchedFragment, "берегу");
assert.equal(contextual.sentenceTranslation, "Мы сидели на берегу реки.");
assert.match(openRouterRequests[1].messages[1].content, /bank/);
assert.match(openRouterRequests[1].messages[1].content, /river/);
assert.match(openRouterRequests[1].messages[0].content, /\/no_think/);

const plainResponse = await generate({topic:translation.translatedTopic, originalTopic:"тихие выходные дома", level:"B1", mode:"topic", words:["quiet", "background"]});
assert.equal(plainResponse.status, 200);
assert.equal((await plainResponse.json()).title, "A Quiet Sunday");
assert.match(openRouterRequests[2].messages[1].content, /quiet weekends at home/);
assert.doesNotMatch(openRouterRequests[2].messages[1].content, /тихие выходные дома/);

const jsonResponse = await generate();
assert.equal(jsonResponse.status, 200);
assert.match((await jsonResponse.json()).body, /train left/);

const truncatedResponse = await generate();
assert.equal(truncatedResponse.status, 200);
const truncated = await truncatedResponse.json();
assert.equal(truncated.finishReason, "length");
assert.match(truncated.body, /friendly seller/);

const wordsResponse = await generate({topic:"", level:"B1", mode:"words", words:["background", "recognize", "narrow"]});
assert.equal(wordsResponse.status, 200);
const wordsResult = await wordsResponse.json();
assert.equal(wordsResult.mode, "words");
assert.deepEqual(wordsResult.requestedWords, ["background", "recognize", "narrow"]);
assert.match(openRouterRequests[5].messages[1].content, /Use every target item naturally/);

const inconsistentContextResponse = await translateWord("bank", "We sat on the bank of the river.");
assert.equal(inconsistentContextResponse.status, 200);
const retriedContext = await inconsistentContextResponse.json();
assert.equal(retriedContext.translation, "берег");
assert.equal(retriedContext.matchedFragment, "берег");
assert.match(openRouterRequests[7].messages[1].content, /This is a retry/);

const trulyResponse = await translateWord("truly", "He wanted to truly live.");
assert.equal(trulyResponse.status, 200);
const truly = await trulyResponse.json();
assert.equal(truly.translation, "по-настоящему");
assert.equal(truly.sentenceTranslation, "Он хотел по-настоящему жить.");
assert.match(openRouterRequests[8].messages[0].content, /\/no_think/);

const assetResponse = await worker.fetch(
  new Request("https://readfox.gemerpc.workers.dev/"),
  {ASSETS:{fetch:()=>new Response("site", {status:200})}}
);
assert.equal(assetResponse.status, 200);
assert.equal(await assetResponse.text(), "site");

console.log("Worker tests passed");
