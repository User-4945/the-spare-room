// Private configuration is injected through runtime secrets, never source or static assets.
export function createAdminService(options={}){
 const now=options.now||Date.now,webcrypto=options.crypto||globalThis.crypto,attempts=new Map(),sessionsTTL=600000;
 const actions=new Set(['start','sanity','sanityDelta','revive','teleport','toggle','spawn','clear','sandwich','stamina','sweets','day','time','midnight']);
 const bytes=s=>new TextEncoder().encode(s),fromHex=s=>Uint8Array.from(s.match(/../g)||[],v=>parseInt(v,16));
 const encode=data=>btoa(String.fromCharCode(...new Uint8Array(data))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 const decode=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
 async function key(secret){return webcrypto.subtle.importKey('raw',bytes(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
 async function mint(secret){const expiresAt=now()+sessionsTTL,body=encode(bytes(JSON.stringify({admin:true,expiresAt,nonce:webcrypto.randomUUID()}))),signature=encode(await webcrypto.subtle.sign('HMAC',await key(secret),bytes(body)));return {ok:true,token:body+'.'+signature,expiresAt};}
 async function verify(token,secret){try{if(!token||token.length>2048)return false;const [body,signature,...rest]=token.split('.');if(rest.length||!signature||!await webcrypto.subtle.verify('HMAC',await key(secret),decode(signature),bytes(body)))return false;const value=JSON.parse(new TextDecoder().decode(decode(body)));return value.admin===true&&Number.isFinite(value.expiresAt)&&value.expiresAt>now()&&value.expiresAt<=now()+sessionsTTL;}catch{return false;}}
 function allowed(origin,url){if(!origin)return true;if(origin==='null')return true;try{const u=new URL(origin);return origin===url.origin||u.protocol==='https:'&&(u.hostname.endsWith('.itch.zone')||u.hostname.endsWith('.itch.io'));}catch{return false;}}
 return {async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin')||'',headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  if(allowed(origin,url)&&origin)headers['Access-Control-Allow-Origin']=origin;
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(!allowed(origin,url))return reply(403,{ok:false,message:'This origin cannot use the admin service.'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'600'}});
  if(request.method!=='POST')return reply(405,{ok:false,message:'Use POST.'});
  let config;try{config=JSON.parse(env.TSR_ADMIN_AUTH);if(!config.username||!config.verifier||!config.salt||config.iterations!==100000||!env.TSR_ADMIN_SESSION_KEY||env.TSR_ADMIN_SESSION_KEY.length<32)throw Error();}catch{return reply(503,{ok:false,message:'The admin service is not configured.'});}
  if(Number(request.headers.get('Content-Length'))>2048)return reply(413,{ok:false,message:'Request too large.'});
  let data;try{const text=await request.text();if(text.length>2048)return reply(413,{ok:false,message:'Request too large.'});data=JSON.parse(text);}catch{return reply(400,{ok:false,message:'Invalid request.'});}
  if(url.pathname==='/api/admin/login'){
   const ip=request.headers.get('CF-Connecting-IP')||'unknown',bucket=attempts.get(ip)||{failures:0,blockedUntil:0,at:now()};if(now()-bucket.at>900000){bucket.failures=0;bucket.blockedUntil=0;bucket.at=now();}if(bucket.blockedUntil>now())return reply(429,{ok:false,message:'Too many attempts. Wait '+Math.ceil((bucket.blockedUntil-now())/1000)+' seconds.'});
   if(typeof data.username!=='string'||typeof data.password!=='string'||data.username.length>128||data.password.length>256)return reply(400,{ok:false,message:'Invalid credentials.'});
   const imported=await webcrypto.subtle.importKey('raw',bytes(data.password),'PBKDF2',false,['deriveBits']),actual=new Uint8Array(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:fromHex(config.salt),iterations:100000,hash:'SHA-256'},imported,256)),expected=fromHex(config.verifier);let diff=actual.length^expected.length;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];actual.fill(0);
   if(data.username!==config.username||diff){bucket.failures++;if(bucket.failures>=5){bucket.blockedUntil=now()+30000;bucket.failures=0;}attempts.set(ip,bucket);if(attempts.size>5000)for(const [id,b]of attempts)if(now()-b.at>900000)attempts.delete(id);return reply(401,{ok:false,message:'Username or password is incorrect.'});}
   attempts.delete(ip);return reply(200,await mint(env.TSR_ADMIN_SESSION_KEY));
  }
  if(url.pathname==='/api/admin/authorize'){
   if(!await verify((request.headers.get('Authorization')||'').replace(/^Bearer /,''),env.TSR_ADMIN_SESSION_KEY))return reply(401,{ok:false,message:'Admin session expired. Sign in again.'});
   if(typeof data.action!=='string'||!actions.has(data.action))return reply(400,{ok:false,message:'Unknown admin action.'});return reply(200,await mint(env.TSR_ADMIN_SESSION_KEY));
  }
  return reply(404,{ok:false,message:'Not found.'});
 }};
}
