"""Build small web derivatives from the approved local source bundle; no image synthesis/editing."""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.request import urlopen
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--ids', nargs='+', help='Convert only the selected stable IDs from the source manifest')
parser.add_argument('--avatars-only', action='store_true', help='Keep existing pinned flag assets; do not access the network')
args = parser.parse_args()
target = Path(__file__).resolve().parents[1] / 'frontend/public/demo-leaderboard'
(target / 'avatars').mkdir(parents=True, exist_ok=True)
(target / 'flags').mkdir(parents=True, exist_ok=True)
manifest = json.loads((args.source / 'manifest.json').read_text(encoding='utf-8'))
assets = manifest['assets']
assert len({asset['id'] for asset in assets}) == len(assets), 'Duplicate source IDs'
if args.ids:
    assert len(set(args.ids)) == len(args.ids), 'Duplicate selected IDs'
    assert set(args.ids).issubset({asset['id'] for asset in assets}), 'Unknown selected ID'
    assets = [asset for asset in assets if asset['id'] in args.ids]
for asset in assets:
    assert re.fullmatch(r'[a-z][a-z0-9-]{0,63}', asset['id']), 'Unsafe asset ID'
    path = (args.source / asset['file']).resolve()
    assert path.is_relative_to(args.source.resolve()), 'Source path escapes bundle'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == asset['sha256'], 'Source changed'
    with Image.open(path) as image:
        for size in (128, 256):
            scaled = image.convert('RGB').resize((size, size), Image.Resampling.LANCZOS)
            out = target / 'avatars' / f"{asset['id']}-{size}.webp"
            scaled.save(out, 'WEBP', quality=82, method=6)
            print(out.name, out.stat().st_size)
# Official MIT-licensed flag-icons files, pinned to an exact upstream commit, never handmade approximations.
revision = 'ac7e0eb3259eb62aa6100c435607e2fe03896a97'
for remote, local in ([] if args.avatars_only else [('flags/4x3/br.svg','flags/br.svg'),('flags/4x3/id.svg','flags/id.svg'),('LICENSE','FLAG-ICONS-LICENSE.txt')]):
    data = urlopen(f'https://raw.githubusercontent.com/lipis/flag-icons/{revision}/{remote}', timeout=30).read()
    (target / local).write_bytes(data)
    print(local, len(data))
