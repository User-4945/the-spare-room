const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let permitted=false;const context={window:{spareAdmin:{isAuthenticated:()=>permitted}},updateMovement(){},renderAdvanced(){},advancedEngine:null,console};vm.createContext(context);
vm.runInContext(fs.readFileSync('developer-game/environment.js','utf8'),context);
const env=context.window.SpareRoomEnvironment;
assert.equal(env.setWeather('Storm'),false);assert.equal(env.setFog(.4),false);
permitted=true;for(const name of ['Auto','Clear','Rain','Storm','Mist','Wind','Snow','Snowstorm'])assert.equal(env.setWeather(name),true);
assert.equal(env.setWeather('invalid'),false);for(const v of [NaN,Infinity,-1,1])assert.equal(env.setFog(v),false);
assert.equal(env.setFog(.65),true);assert.equal(env.status().fog,.65);assert.equal(env.reset(),true);assert.equal(env.status().weather,'Auto');
env.setWeather('Rain');permitted=false;context.updateMovement(.02);assert.equal(env.status().weather,'Auto');
for(const dir of ['dist','developer-game']){const html=fs.readFileSync(dir+'/index.html','utf8');assert(html.includes('src="environment.js"'));assert(html.includes('src="christmas-scenery.js"'));}
console.log('PASS: admin session gates, weather/fog validation, reset, expiry and packaged script references');
