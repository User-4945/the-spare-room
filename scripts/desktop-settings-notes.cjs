function originalNotes(body){
 return String(body||'').replace(/<!-- desktop-updater-start -->[\s\S]*?<!-- desktop-updater-end -->/g,'')
  .replace(/## Desktop updates\r?\n[\s\S]*?(?=## Bug fixes)/,'')
  .replace('v2.0.0 remains the latest stable release.','Stable releases remain available separately from this prerelease.')
  .replace('Updates require downloading a newer installer.','Updates are available through the refreshed Windows Settings page or by downloading an installer.')
  .replace('daily and manual checks offer stable releases','daily and manual checks offer stable releases by default').trim();
}
module.exports={originalNotes};
