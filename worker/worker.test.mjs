import assert from "node:assert/strict";
import worker from "./src/index.mjs";

const modelReplies = [
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
  }
];

const openRouterRequests = [];
globalThis.fetch = async (url, init) => {
  assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
  const request = JSON.parse(init.body);
  openRouterRequests.push(request);
  assert.equal(request.max_tokens, 1200);
  assert.deepEqual(request.reasoning, {effort:"none", exclude:true});
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

const plainResponse = await generate({topic:"тихие выходные дома", level:"B1", mode:"topic", words:["quiet", "background"]});
assert.equal(plainResponse.status, 200);
assert.equal((await plainResponse.json()).title, "A Quiet Sunday");
assert.match(openRouterRequests[0].messages[1].content, /тихие выходные дома/);
assert.match(openRouterRequests[0].messages[1].content, /may be written in Russian or English/);

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
assert.match(openRouterRequests[3].messages[1].content, /Use every target item naturally/);

const assetResponse = await worker.fetch(
  new Request("https://readfox.gemerpc.workers.dev/"),
  {ASSETS:{fetch:()=>new Response("site", {status:200})}}
);
assert.equal(assetResponse.status, 200);
assert.equal(await assetResponse.text(), "site");

console.log("Worker tests passed");
