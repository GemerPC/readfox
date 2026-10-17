const MODEL='@cf/myshell-ai/melotts';
const MAX_AUDIO=6*1024*1024;
function headers(origin){return {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin',...(origin?{'Access-Control-Allow-Origin':origin}:{})};}
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
export async function handleSpeech(request,env,origin){
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
 if(!env.AI||typeof env.AI.run!=='function')return json('Сервис озвучки пока недоступен.',503,origin);
 try{const result=await env.AI.run(MODEL,{prompt:text,lang:'en'});const bytes=await audioBytes(result);return new Response(bytes,{headers:{...headers(origin),'Content-Type':contentType(bytes),'Content-Length':String(bytes.length)}});}
 catch(error){const limited=/429|quota|daily limit|rate limit/i.test(String(error?.message||error));return json(limited?'Лимит озвучки временно исчерпан. Попробуй позже или выбери системный голос.':'Не удалось подготовить голос. Повтори воспроизведение или выбери системный голос.',limited?429:502,origin);}
}

