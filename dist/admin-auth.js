/* Server-checked, memory-only sessions. No password verifier is shipped with the game. */
(function(root){
 'use strict';
 function createAdminAuth(config,options={}){
  const send=options.fetch||root.fetch?.bind(root),now=options.now||Date.now;
  let token='',until=0,busy=false,generation=0;
  function lock(){token='';until=0;generation++;}
  function valid(){if(until&&now()>=until)lock();return !!token&&until>now();}
  function status(){return {authenticated:valid(),expiresIn:valid()?Math.max(0,until-now()):0,retryIn:0,busy};}
  function touch(){return valid();}
  async function request(path,body,sessionToken){
   if(!send)return {ok:false,message:'Admin tools require an internet connection.'};
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{const response=await send(config.endpoint+path,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json',...(sessionToken?{Authorization:'Bearer '+sessionToken}:{})},body:JSON.stringify(body),signal:controller.signal});const result=await response.json();return response.ok&&result.ok?result:{ok:false,message:result.message||'Admin authorization was rejected.',unauthorized:response.status===401};}
   catch{return {ok:false,message:'Could not reach the admin service. Check your internet connection.'};}
   finally{clearTimeout(timer);}
  }
  function accept(result,ticket){if(ticket!==generation)return {ok:false,message:'Sign-in was cancelled.'};if(result.ok&&typeof result.token==='string'&&Number.isFinite(result.expiresAt)&&result.expiresAt>now()){token=result.token;until=result.expiresAt;return {ok:true,message:'Admin session unlocked.'};}return {ok:false,message:result.message||'Admin authorization failed.'};}
  async function authenticate(username,password){if(busy)return {ok:false,message:'A sign-in check is already running.'};busy=true;const ticket=generation;try{return accept(await request('/login',{username:String(username).trim(),password:String(password)}),ticket);}finally{busy=false;}}
  async function authorize(action){if(!valid())return {ok:false,message:'Sign in to use admin tools.'};const ticket=generation,result=await request('/authorize',{action},token);if(!result.ok){if(result.unauthorized)lock();return {ok:false,message:result.message};}return accept(result,ticket);}
  return Object.freeze({authenticate,authorize,isAuthenticated:valid,touch,lock,status});
 }
 if(typeof module==='object'&&module.exports)module.exports={createAdminAuth};else root.createAdminAuth=createAdminAuth;
})(typeof globalThis!=='undefined'?globalThis:this);
