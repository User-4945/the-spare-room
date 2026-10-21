from pathlib import Path
import json,subprocess,zipfile
meta=json.loads(Path('installer-build.json').read_text())
paths=set(subprocess.check_output(['git','ls-files','-z']).decode().split('\0'))
paths.update(subprocess.check_output(['git','ls-tree','-r','--name-only','-z',meta['game_commit'],'--','dist']).decode().split('\0'))
paths.add('installer-build.json')
output=Path('installer-output')/('The-Spare-Room-v'+meta['game_version']+'-desktop-source.zip')
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
 for name in sorted(paths):
  p=Path(name)
  if name and p.is_file() and not name.startswith(('desktop/game/','desktop-build/','node_modules/')):
   archive.write(p,'the-spare-room/'+name)
print('Packaged matching desktop source: '+str(output))
