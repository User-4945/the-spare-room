"""Render the vector Halloween favicon into browser, PWA and installer formats."""
from pathlib import Path
from io import BytesIO
import cairosvg
from PIL import Image
root=Path(__file__).resolve().parents[1]
svg=root/'dist/favicon.svg'
def render(size):
 return Image.open(BytesIO(cairosvg.svg2png(url=str(svg),output_width=size,output_height=size))).convert('RGBA')
render(32).save(root/'dist/favicon-32.png')
render(180).save(root/'dist/apple-touch-icon.png')
icon=render(256)
for dest in ['dist/favicon.ico','desktop/icon.ico']:
 icon.save(root/dest,format='ICO',sizes=[(n,n) for n in [16,24,32,48,64,128,256]])
for size in [192,512,1024]:render(size).save(root/f'platforms/icons/icon-{size}.png')
print('Rendered Halloween pumpkin badge in SVG, PNG, ICO, Apple touch and installed-app icons.')
