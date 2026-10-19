"""Build small web derivatives from the approved local source bundle; no image synthesis/editing."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
args = parser.parse_args()
target = Path(__file__).resolve().parents[1] / 'frontend/public/demo-leaderboard'
(target / 'avatars').mkdir(parents=True, exist_ok=True)
(target / 'flags').mkdir(parents=True, exist_ok=True)
manifest = json.loads((args.source / 'manifest.json').read_text(encoding='utf-8'))
for asset in manifest['assets']:
    path = args.source / asset['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == asset['sha256'], 'Source changed'
    with Image.open(path) as image:
        for size in (128, 256):
            scaled = image.convert('RGB').resize((size, size), Image.Resampling.LANCZOS)
            out = target / 'avatars' / f"{asset['id']}-{size}.webp"
            scaled.save(out, 'WEBP', quality=82, method=6)
            print(out.name, out.stat().st_size)
# Official MIT-licensed flag-icons files, pinned to an exact upstream commit, never handmade approximations.
revision = 'ac7e0eb3259eb62aa6100c435607e2fe03896a97'
for remote, local in [('flags/4x3/br.svg','flags/br.svg'),('flags/4x3/id.svg','flags/id.svg'),('LICENSE','FLAG-ICONS-LICENSE.txt')]:
    data = urlopen(f'https://raw.githubusercontent.com/lipis/flag-icons/{revision}/{remote}', timeout=30).read()
    (target / local).write_bytes(data)
    print(local, len(data))
