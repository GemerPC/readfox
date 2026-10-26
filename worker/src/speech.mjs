const MODEL='@cf/myshell-ai/melotts';
// Fox's voice: Fish Audio S2.1 Pro on OpenRouter (paid per character); MeloTTS on Workers AI answers when it is unavailable.
const VOICE_MODEL='fish-audio/s2.1-pro';
const SPEECH_ENDPOINT='https://openrouter.ai/api/v1/audio/speech';
const MAX_AUDIO=6*1024*1024;
function headers(origin){return {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin','Access-Control-Expose-Headers':'X-ReadFox-Voice, X-ReadFox-Voice-Key, X-ReadFox-Voice-Fallback',...(origin?{'Access-Control-Allow-Origin':origin}:{})};}
function json(error,status,origin){return new Response(JSON.stringify({error}),{status,headers:{...headers(origin),'Content-Type':'application/json; charset=utf-8'}});}
async function bounded(stream,limit){
 const reader=stream.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('too-large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
async function audioBytes(result){
 let bytes;
 if(result instanceof Response){if(!result.ok||!result.body)throw Error('invalid-response');return audioBytes(result.body);}
 if(result&&typeof result.getReader==='function')bytes=await bounded(result,MAX_AUDIO);
 else if(result instanceof ArrayBuffer)bytes=new Uint8Array(result);
 else if(ArrayBuffer.isView(result))bytes=new Uint8Array(result.buffer,result.byteOffset,result.byteLength);
 else{const encoded=typeof result==='string'?result:result?.audio;if(typeof encoded!=='string'||encoded.length>MAX_AUDIO*1.4||!/^[A-Za-z0-9+/=\s]+$/.test(encoded))throw Error('invalid-audio');const raw=atob(encoded);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));}
 if(bytes.length<16||bytes.length>MAX_AUDIO)throw Error('invalid-size');return bytes;
}
function contentType(b){
 const text=(start,n)=>String.fromCharCode(...b.slice(start,start+n));
 if(text(0,4)==='RIFF'&&text(8,4)==='WAVE')return 'audio/wav';
 if(text(0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224))return 'audio/mpeg';
 throw Error('invalid-audio');
}
// FISH_VOICE_ID (optional Cloudflare variable) pins a Fish Audio voice; without it Fish uses its default voice.
async function fishRequest(env,text,timeoutMs){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const fetcher=typeof env.OPENROUTER_FETCH==='function'?env.OPENROUTER_FETCH:fetch;
  const response=await fetcher(SPEECH_ENDPOINT,{method:'POST',headers:{Authorization:`Bearer ${env.OPENROUTER_API_KEY}`,'Content-Type':'application/json','HTTP-Referer':'https://gemerpc.github.io/readfox/','X-Title':'ReadFox'},body:JSON.stringify({model:VOICE_MODEL,input:text,response_format:'mp3',...(env.FISH_VOICE_ID?{voice:env.FISH_VOICE_ID}:{})}),signal:controller.signal});
  if(!response.ok){const error=Error('Fish Audio speech failed'),body=await response.text().catch(()=>'');error.status=response.status;try{error.detail=String(JSON.parse(body)?.error?.message||'');}catch(_){error.detail=body;}error.detail=error.detail.slice(0,300);throw error;}
  return await audioBytes(response);
 }catch(error){if(error?.name==='AbortError'){const timeout=Error('Fish Audio speech timed out');timeout.status='timeout';throw timeout;}throw error;}
 finally{clearTimeout(timer);}
}
// A brief failure (rate limit, busy provider, timeout) gets one quick retry, so Fox stays in the same voice.
async function fishSpeech(env,text){
 try{return await fishRequest(env,text,20000);}
 catch(error){
  if(!(error.status===429||error.status==='timeout'||error.status>=500))throw error;
  await new Promise(resolve=>setTimeout(resolve,800));
  return fishRequest(env,text,15000);
 }
}
// Short fingerprint of the Fish voice in use; the site keys its phrase cache by it, so a new voice is never mixed with old audio.
async function voiceKey(env){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(VOICE_MODEL+'|'+(env.FISH_VOICE_ID||'')));return [...new Uint8Array(hash).slice(0,6)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function audioResponse(bytes,voice,origin,key='',fallback=''){return new Response(bytes,{headers:{...headers(origin),'Content-Type':contentType(bytes),'Content-Length':String(bytes.length),'X-ReadFox-Voice':voice,...(key?{'X-ReadFox-Voice-Key':key}:{}),...(fallback?{'X-ReadFox-Voice-Fallback':fallback}:{})}});}
export async function handleSpeech(request,env,origin){
 if(request.method==='GET')return new Response(JSON.stringify({ok:true,service:'ReadFox speech',model:VOICE_MODEL,openRouterConfigured:Boolean(env.OPENROUTER_API_KEY),voicePinned:Boolean(env.FISH_VOICE_ID),voiceKey:await voiceKey(env),fallbackModel:MODEL}),{headers:{...headers(origin),'Content-Type':'application/json; charset=utf-8'}});
 if(!origin)return json('Источник запроса не разрешён.',403,'');
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers(origin),'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}});
 if(request.method!=='POST')return json('Нужен POST-запрос.',405,origin);
 if(!/^application\/json\b/i.test(request.headers.get('Content-Type')||''))return json('Нужен JSON с текстом.',415,origin);
 if(Number(request.headers.get('Content-Length')||0)>12000)return json('Слишком длинный запрос.',413,origin);
 let payload;
 try{const bytes=request.body?await bounded(request.body,12000):new Uint8Array();payload=JSON.parse(new TextDecoder().decode(bytes));}
 catch(error){return json(error.message==='too-large'?'Слишком длинный запрос.':'Некорректный JSON.',error.message==='too-large'?413:400,origin);}
 const text=typeof payload?.text==='string'?payload.text.trim():'';
 if(!text||text.length>1600||!/[a-z]/i.test(text))return json('Нужен английский текст от 1 до 1600 символов.',400,origin);
 // Why Fish Audio was skipped is reported in X-ReadFox-Voice-Fallback: an HTTP status with OpenRouter's message, "timeout", "error" or "no-key".
 let fallback='no-key';
 if(env.OPENROUTER_API_KEY){
  try{const bytes=await fishSpeech(env,text);return audioResponse(bytes,VOICE_MODEL,origin,await voiceKey(env));}
  catch(error){fallback=(String(error.status||'error')+' '+String(error.detail||'').replace(/[^\x20-\x7e]+/g,' ')).trim().slice(0,120);console.warn('ReadFox Fish Audio speech failed, using MeloTTS',{status:error.status||null,detail:error.detail||String(error?.message||error)});}
 }
 if(!env.AI||typeof env.AI.run!=='function')return json('Сервис озвучки пока недоступен.',503,origin);
 try{const result=await env.AI.run(MODEL,{prompt:text,lang:'en'});const bytes=await audioBytes(result);return audioResponse(bytes,MODEL,origin,'',fallback);}
 catch(error){const limited=/429|quota|daily limit|rate limit/i.test(String(error?.message||error));return json(limited?'Лимит озвучки временно исчерпан. Попробуй позже или выбери системный голос.':'Не удалось подготовить голос. Повтори воспроизведение или выбери системный голос.',limited?429:502,origin);}
}

