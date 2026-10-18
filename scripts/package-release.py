"""Create the browser-game release archive; this is not a Windows installer."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parents[1]
release = json.loads((root / 'release.json').read_text())
out = root / 'release-build' / f"The-Spare-Room-v{release['version']}-web.zip"
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
    for source in sorted((root / 'dist').rglob('*')):
        if source.is_file():
            archive.write(source, source.relative_to(root))
    for name in ['README.md', 'LICENSE', 'RELEASE_NOTES.md', 'release.json']:
        archive.write(root / name, name)
print(out)
