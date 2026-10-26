// Build the event in its own directory. Never rewrite a released game's files.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, 'halloween-build'));
const source = path.join(root, 'dist');
if (out === root || out === source || source.startsWith(out + path.sep) || out.startsWith(source + path.sep)) {
  throw new Error('Choose a separate Halloween output directory');
}
fs.rmSync(out, {recursive: true, force: true});
fs.cpSync(source, out, {recursive: true});
for (const name of ['halloween.js', 'halloween.css', 'more-halloween.js']) {
  fs.copyFileSync(path.join(root, 'events/halloween', name), path.join(out, name));
}
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replace(/<script src="(?:halloween|more-halloween|action-prompts|release-event|week2|admin-auth-config|admin-auth|admin-panel)\.js"><\/script>/g, '').replace(/<link rel="stylesheet" href="halloween\.css">/g, '');
html = html.replaceAll("'spare-room-v1'", "'spare-room-halloween-v1'")
  .replace(/<title>.*?<\/title>/, '<title>The Spare Room · All Hallows’ Eve</title>')
  .replace(/href="\/(favicon[^" ]*|apple-touch-icon\.png)"/g, 'href="$1"')
  .replace('</head>', '<link rel="stylesheet" href="halloween.css"></head>')
  .replace('</body>', '<script src="halloween.js"></script><script src="more-halloween.js"></script><script src="action-prompts.js"></script><script src="release-event.js"></script><script src="week2.js"></script><script src="admin-auth-config.js"></script><script src="admin-auth.js"></script><script src="admin-panel.js"></script></body>');
fs.writeFileSync(path.join(out, 'index.html'), html);
// The seasonal journal is independent too. Original save files are never migrated.
const cityPath = path.join(out, 'city.js');
fs.writeFileSync(cityPath, fs.readFileSync(cityPath, 'utf8').replaceAll("'spare-room-endings'", "'spare-room-halloween-endings'"));
console.log('Prepared All Hallows’ Eve with its own save and ending journal.');
