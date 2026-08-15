import assert from "node:assert/strict";
import worker from "./src/index.mjs";

const preparationCache = new Map();
globalThis.caches = {
  default:{
    async match(request){
      const response = preparationCache.get(request.url);
      return response ? response.clone() : undefined;
    },
    async put(request, response){
      preparationCache.set(request.url, response.clone());
    }
  }
};

const modelReplies = [
  {
    response:"<think>Translate the short topic.</think>\n**ENGLISH_TOPIC:** quiet weekends at home"
  },
  {
    model:"test/context-translator",
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: берегу\nMATCHED_FRAGMENT: берегу\nSENTENCE_TRANSLATION: Мы сидели на берегу реки."}}]
  },
  {
    model:"test/free",
    choices:[{finish_reason:"stop", message:{content:"TITLE: A Quiet Sunday\n\nMia stayed home on Sunday.\n\nShe made tea and read a book."}}]
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
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: берегу\nMATCHED_FRAGMENT: берегу\nSENTENCE_TRANSLATION: Мы сидели на берегу реки."}}]
  },
  {
    model:"test/context-translator",
    choices:[{finish_reason:"stop", message:{content:"WORD_TRANSLATION: по-настоящему\nMATCHED_FRAGMENT: по-настоящему\nSENTENCE_TRANSLATION: Он хотел по-настоящему жить."}}]
  },
  {
    response:'{"sentences":[{"id":"s0","sentenceTranslation":"Берег.","words":[{"id":"w1","translation":"Берег","matchedFragment":"","ipa":"/bæŋk/"}]}]}'
  },
  {
    response:{
      sentences:[{
        id:"s0",
        sentenceTranslation:"Берег.",
        words:[{id:"w0", translation:"определённый артикль", matchedFragment:"", ipa:"/ðə/"}]
      }]
    }
  },
  {
    response:'{"sentences":[]}'
  },
  {
    response:{sentences:[]}
  },
  {
    response:"WORD_TRANSLATION: Берег\nMATCHED_FRAGMENT: Берег\nSENTENCE_TRANSLATION: Берег.\nIPA: /bæŋk/"
  },
  {
    response:'{"sentences":[]}'
  }
];

const aiRequests = [];
const aiModels = [];
const AI = {
  async run(model, request){
    assert.equal([
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      "@cf/zai-org/glm-4.7-flash"
    ].includes(model), true);
    aiRequests.push(request);
    aiModels.push(model);
    assert.equal(Number.isInteger(request.max_tokens) && request.max_tokens >= 160 && request.max_tokens <= 5200, true);
    assert.equal(request.stream, false);
    assert.equal("reasoning_effort" in request, false);
    return modelReplies.shift();
  }
};

function testEnv(extra = {}){
  return {
    AI,
    GOOGLE_TRANSLATE_FETCH:async()=>new Response(JSON.stringify({error:"disabled in unit tests"}), {status:503}),
    MYMEMORY_FETCH:async()=>new Response(JSON.stringify({error:"disabled in unit tests"}), {status:503}),
    ...extra
  };
}

async function generate(payload = {topic:"a weekend at home", level:"B1", mode:"topic", words:[]}){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/generate", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify(payload)
  }), testEnv());
}

async function translate(topic){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/translate", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify({topic})
  }), testEnv());
}

async function translateWord(word, sentence, env = {}){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/translate-word", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify({word, sentence})
  }), testEnv(env));
}

async function prepareText(sentences, env = {}, strategy){
  return worker.fetch(new Request("https://readfox.gemerpc.workers.dev/prepare-text", {
    method:"POST",
    headers:{"Content-Type":"application/json", "Origin":"https://gemerpc.github.io"},
    body:JSON.stringify({sentences, ...(strategy ? {strategy} : {})})
  }), testEnv(env));
}

const translationResponse = await translate("тихие выходные дома");
assert.equal(translationResponse.status, 200);
const translation = await translationResponse.json();
assert.equal(translation.translatedTopic, "quiet weekends at home");
assert.equal(aiRequests[0].max_tokens, 160);
assert.match(aiRequests[0].messages[0].content, /Russian-to-English translator/);
assert.match(aiRequests[0].messages[1].content, /тихие выходные дома/);

const contextualResponse = await translateWord("bank", "We sat on the bank of the river.");
assert.equal(contextualResponse.status, 200);
const contextual = await contextualResponse.json();
assert.equal(contextual.translation, "берегу");
assert.equal(contextual.matchedFragment, "берегу");
assert.equal(contextual.sentenceTranslation, "Мы сидели на берегу реки.");
assert.match(aiRequests[1].messages[1].content, /bank/);
assert.match(aiRequests[1].messages[1].content, /river/);
assert.match(aiRequests[1].messages[0].content, /English-to-Russian dictionary editor/);

const plainResponse = await generate({topic:translation.translatedTopic, originalTopic:"тихие выходные дома", level:"B1", mode:"topic", words:["quiet", "background"]});
assert.equal(plainResponse.status, 200);
assert.equal((await plainResponse.json()).title, "A Quiet Sunday");
assert.match(aiRequests[2].messages[1].content, /quiet weekends at home/);
assert.doesNotMatch(aiRequests[2].messages[1].content, /тихие выходные дома/);

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
assert.match(aiRequests[5].messages[1].content, /Use every target item naturally/);

const inconsistentContextResponse = await translateWord("bank", "We sat on the bank of the river.");
assert.equal(inconsistentContextResponse.status, 200);
const retriedContext = await inconsistentContextResponse.json();
assert.equal(retriedContext.translation, "берегу");
assert.equal(retriedContext.matchedFragment, "берегу");
assert.match(aiRequests[7].messages[1].content, /This is a retry/);
assert.equal(aiModels[7], "@cf/zai-org/glm-4.7-flash");

const trulyResponse = await translateWord("truly", "He wanted to truly live.");
assert.equal(trulyResponse.status, 200);
const truly = await trulyResponse.json();
assert.equal(truly.translation, "по-настоящему");
assert.equal(truly.sentenceTranslation, "Он хотел по-настоящему жить.");
assert.match(aiRequests[8].messages[0].content, /English-to-Russian dictionary editor/);

let phraseFallbackQuery = "";
const phraseFallbackResponse = await translateWord(
  "My little sister",
  "My little sister loves to feed the ducks.",
  {
    AI:{async run(){ throw Object.assign(new Error("AI unavailable"), {status:503}); }},
    GOOGLE_TRANSLATE_FETCH:async url=>{
      phraseFallbackQuery = new URL(url).searchParams.get("q");
      return new Response(JSON.stringify([[['«Моя младшая сестра» любит кормить уток.']]]), {status:200});
    }
  }
);
assert.equal(phraseFallbackResponse.status, 200);
const phraseFallback = await phraseFallbackResponse.json();
assert.equal(phraseFallbackQuery, "「My little sister」 loves to feed the ducks.");
assert.equal(phraseFallback.translation, "Моя младшая сестра");
assert.equal(phraseFallback.matchedFragment, "Моя младшая сестра");
assert.equal(phraseFallback.sentenceTranslation, "Моя младшая сестра любит кормить уток.");
assert.equal(phraseFallback.source, "google-contextual-mt");

const anotherPhraseFallbackResponse = await translateWord(
  "feed the ducks",
  "My little sister loves to feed the ducks.",
  {
    AI:{async run(){ throw Object.assign(new Error("AI unavailable"), {status:503}); }},
    GOOGLE_TRANSLATE_FETCH:async url=>{
      const query = new URL(url).searchParams.get("q");
      assert.equal(query, "My little sister loves to 「feed the ducks」.");
      return new Response(JSON.stringify([[['Моя младшая сестра любит «кормить уток».']]]), {status:200});
    }
  }
);
assert.equal(anotherPhraseFallbackResponse.status, 200);
const anotherPhraseFallback = await anotherPhraseFallbackResponse.json();
assert.equal(anotherPhraseFallback.translation, "кормить уток");
assert.equal(anotherPhraseFallback.matchedFragment, "кормить уток");

const tokenizationMismatch = await prepareText([{
  id:"s0",
  text:"We didn't re-open it.",
  tokens:["We", "didn", "t", "re", "open", "it"],
  words:[{id:"w0", token:"We"}]
}]);
assert.equal(tokenizationMismatch.status, 400);
assert.equal((await tokenizationMismatch.json()).code, "tokenization-mismatch");

const preparedSentences = [{
  id:"s0",
  text:"The bank.",
  tokens:["The", "bank"],
  words:[{id:"w0", token:"The"}, {id:"w1", token:"bank"}]
}];
const preparedResponse = await prepareText(preparedSentences);
assert.equal(preparedResponse.status, 200);
const prepared = await preparedResponse.json();
assert.equal(prepared.complete, true);
assert.equal(prepared.fallbackUsed, true);
assert.equal(prepared.entries.length, 2);
assert.equal(prepared.entries.find(entry=>entry.id === "w1").translation, "Берег");
assert.equal(prepared.entries.find(entry=>entry.id === "w1").matchedFragment, "");
assert.equal(prepared.entries.find(entry=>entry.id === "w0").translation, "определённый артикль");
assert.equal(prepared.entries.find(entry=>entry.id === "w0").matchedFragment, "");
assert.equal(aiModels[9], "@cf/meta/llama-4-scout-17b-16e-instruct");
assert.equal(aiModels[10], "@cf/zai-org/glm-4.7-flash");
assert.equal("response_format" in aiRequests[10], false);

const aiRequestCountBeforeCacheHit = aiRequests.length;
const cachedPreparedResponse = await prepareText(preparedSentences);
assert.equal(cachedPreparedResponse.status, 200);
const cachedPrepared = await cachedPreparedResponse.json();
assert.equal(cachedPrepared.cached, true);
assert.equal(cachedPrepared.complete, true);
assert.equal(aiRequests.length, aiRequestCountBeforeCacheHit);

const repairedResponse = await prepareText([{
  id:"s1",
  text:"The bank.",
  tokens:["The", "bank"],
  words:[{id:"w2", token:"bank"}]
}]);
assert.equal(repairedResponse.status, 200);
const repaired = await repairedResponse.json();
assert.equal(repaired.complete, true);
assert.equal(repaired.entries.length, 1);
assert.equal(repaired.entries[0].translation, "Берег");
assert.equal(repaired.entries[0].ipa, "/bæŋk/");
assert.equal(aiModels[13], "@cf/zai-org/glm-4.7-flash");

const myMemoryResponse = await prepareText([{
  id:"s2",
  text:"We sat on the bank.",
  tokens:["We", "sat", "on", "the", "bank"],
  words:[{id:"w3", token:"bank"}]
}], {
  MYMEMORY_FETCH:async url=>{
    assert.match(url, /%5B%5Bbank%5D%5D/);
    return new Response(JSON.stringify({responseData:{translatedText:"Мы сидели на [[берегу]]."}}), {
      status:200,
      headers:{"Content-Type":"application/json"}
    });
  }
});
assert.equal(myMemoryResponse.status, 200);
const myMemory = await myMemoryResponse.json();
assert.equal(myMemory.complete, true);
assert.equal(myMemory.entries[0].translation, "берегу");
assert.equal(myMemory.entries[0].matchedFragment, "берегу");
assert.equal(myMemory.entries[0].sentenceTranslation, "Мы сидели на берегу.");
assert.equal(myMemory.entries[0].source, "mymemory-contextual-mt");

const googleResponse = await prepareText([{
  id:"s-google",
  text:"We sat on the bank of the river.",
  tokens:["We", "sat", "on", "the", "bank", "of", "river"],
  words:[{id:"w-google", token:"bank"}]
}], {
  GOOGLE_TRANSLATE_FETCH:async url=>{
    assert.match(url, /%E3%80%8Cbank%E3%80%8D/);
    return new Response(JSON.stringify([[["Мы сидели на «берегу» реки."]], null, "en"]), {
      status:200,
      headers:{"Content-Type":"application/json"}
    });
  }
}, "fallback");
assert.equal(googleResponse.status, 200);
const google = await googleResponse.json();
assert.equal(google.complete, true);
assert.equal(google.entries[0].translation, "берегу");
assert.equal(google.entries[0].matchedFragment, "берегу");
assert.equal(google.entries[0].sentenceTranslation, "Мы сидели на берегу реки.");
assert.equal(google.entries[0].source, "google-contextual-mt");

const googleGrammarResponse = await prepareText([{
  id:"s-google-grammar",
  text:"We sat on the bank of the river.",
  tokens:["We", "sat", "on", "the", "bank", "of", "river"],
  words:[{id:"w-google-the", token:"the"}, {id:"w-google-of", token:"of"}]
}], {
  GOOGLE_TRANSLATE_FETCH:async url=>{
    if(url.includes(encodeURIComponent("「the」"))){
      return new Response(JSON.stringify([[["Мы сидели на «берегу» реки."]]]), {status:200});
    }
    return new Response(JSON.stringify([[["Мы сидели на берегу реки."]]]), {status:200});
  }
}, "fallback");
assert.equal(googleGrammarResponse.status, 200);
const googleGrammar = await googleGrammarResponse.json();
assert.equal(googleGrammar.complete, true);
assert.equal(googleGrammar.entries.find(entry=>entry.token === "the").translation, "определённый артикль");
assert.equal(googleGrammar.entries.find(entry=>entry.token === "the").matchedFragment, "");
assert.equal(googleGrammar.entries.find(entry=>entry.token === "of").translation, "предлог связи или принадлежности");

let googleWindowCalls = 0;
const googleWindowResponse = await prepareText([{
  id:"s-google-window",
  text:"I wash my face and brush my teeth.",
  tokens:["I", "wash", "my", "face", "and", "brush", "teeth"],
  words:[{id:"w-google-face", token:"face"}]
}], {
  GOOGLE_TRANSLATE_FETCH:async url=>{
    googleWindowCalls++;
    const query = new URL(url).searchParams.get("q");
    const translated = query === "I wash my 「face」 and brush my teeth."
      ? "Я умываюсь и чищу зубы."
      : query.includes("「face」")
        ? "умой мое «лицо» и почисти"
        : "Я умываюсь и чищу зубы.";
    return new Response(JSON.stringify([[[translated]]]), {status:200});
  }
}, "fallback");
assert.equal(googleWindowResponse.status, 200);
const googleWindow = await googleWindowResponse.json();
assert.equal(googleWindow.complete, true);
assert.equal(googleWindow.entries[0].translation, "лицо");
assert.equal(googleWindow.entries[0].matchedFragment, "");
assert.equal(googleWindow.entries[0].sentenceTranslation, "Я умываюсь и чищу зубы.");
assert.equal(googleWindowCalls, 3);

const googleChangedFragmentResponse = await prepareText([{
  id:"s-google-changed",
  text:"After breakfast, I get dressed and pack my bag.",
  tokens:["After", "breakfast", "I", "get", "dressed", "and", "pack", "my", "bag"],
  words:[{id:"w-google-pack", token:"pack"}]
}], {
  GOOGLE_TRANSLATE_FETCH:async url=>{
    const query = new URL(url).searchParams.get("q");
    const translated = query === "After breakfast, I get dressed and 「pack」 my bag."
      ? "После завтрака я одеваюсь и собираю сумку."
      : query.includes("「pack」")
        ? "оделся и [собрал] мою сумку"
        : "После завтрака я одеваюсь и забираю сумку.";
    return new Response(JSON.stringify([[[translated]]]), {status:200});
  }
}, "fallback");
assert.equal(googleChangedFragmentResponse.status, 200);
const googleChangedFragment = await googleChangedFragmentResponse.json();
assert.equal(googleChangedFragment.complete, true);
assert.equal(googleChangedFragment.entries[0].translation, "собираю");
assert.equal(googleChangedFragment.entries[0].matchedFragment, "собираю");
assert.equal(googleChangedFragment.entries[0].sentenceTranslation, "После завтрака я одеваюсь и собираю сумку.");

let myMemoryCalledAfterOpenRouter = false;
const openRouterResponse = await prepareText([{
  id:"s3",
  text:"A warm light filled the room.",
  tokens:["A", "warm", "light", "filled", "the", "room"],
  words:[{id:"w4", token:"light"}]
}], {
  OPENROUTER_API_KEY:"test-key",
  OPENROUTER_FETCH:async (url, options)=>{
    assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    const request = JSON.parse(options.body);
    assert.equal(request.model, "nvidia/nemotron-nano-9b-v2:free");
    assert.equal(request.response_format.type, "json_object");
    return new Response(JSON.stringify({
      model:"test/openrouter-free",
      choices:[{message:{content:JSON.stringify({
        sentences:[{
          id:"s3",
          sentenceTranslation:"Тёплый свет наполнил комнату.",
          words:[{id:"w4", translation:"свет", matchedFragment:"свет", ipa:"/laɪt/"}]
        }]
      })}}]
    }), {status:200, headers:{"Content-Type":"application/json"}});
  },
  MYMEMORY_FETCH:async()=>{
    myMemoryCalledAfterOpenRouter = true;
    return new Response("", {status:503});
  }
}, "fallback");
assert.equal(openRouterResponse.status, 200);
const openRouter = await openRouterResponse.json();
assert.equal(openRouter.complete, true);
assert.equal(openRouter.entries[0].translation, "свет");
assert.equal(openRouter.entries[0].source, "openrouter-ai");
assert.equal(openRouter.entries[0].model, "test/openrouter-free");
assert.equal(myMemoryCalledAfterOpenRouter, false);

const assetResponse = await worker.fetch(
  new Request("https://readfox.gemerpc.workers.dev/"),
  testEnv({ASSETS:{fetch:()=>new Response("site", {status:200})}})
);
assert.equal(assetResponse.status, 200);
assert.equal(await assetResponse.text(), "site");

console.log("Worker tests passed");
