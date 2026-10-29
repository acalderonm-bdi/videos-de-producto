"""Convierte los cuadros de toma.py en <toma>.mp4 a 30 fps con su tiempo real, y escribe <toma>.idx.json
con cursor, clics, teclas y marcas en TIEMPO DE VIDEO y en píxeles de la toma (lógicos × DPR).
Las pausas marcadas (pausa → sigue) se cortan a 0.1 s.
Uso: python codificar.py <toma> [<toma> ...]   (busca en ./tomas o en $TOMAS_DIR)
"""
import json, os, shutil, subprocess, sys

T = os.path.abspath(os.environ.get('TOMAS_DIR', 'tomas'))
FF = shutil.which('ffmpeg') or os.path.expanduser('~/.local/bin/ffmpeg')

for n in sys.argv[1:]:
    m = json.load(open(f'{T}/{n}.json')); F = m['frames']; k = m.get('dpr', 2)
    pausas = [(a[1], b[1]) for a, b in zip(m['marks'], m['marks'][1:]) if a[0] == 'pausa' and b[0] == 'sigue']

    def vt(t):  # tiempo real → tiempo de video
        x = t - F[0]
        for a, b in pausas:
            if t >= b: x -= (b - a) - 0.1
            elif t > a: x -= (t - a)
        return round(x, 4)

    with open(f'{T}/{n}/lista.txt', 'w') as fh:
        for i, t in enumerate(F):
            d = vt(F[i + 1]) - vt(t) if i + 1 < len(F) else 0.1
            fh.write(f"file '{i:05d}.jpg'\nduration {max(d, 0.001):.4f}\n")
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{T}/{n}/lista.txt',
                    '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', f'{T}/{n}.mp4'], check=True)
    idx = {'dur': vt(F[-1]) + 0.1, 'w': 1440 * k, 'h': 900 * k,
           'cursor': [[vt(t), x * k, y * k] for t, x, y in m['cursor'] if t >= F[0]],
           'clicks': [[vt(t), x * k, y * k] for t, x, y in m['clicks']],
           'marks': [[name, vt(t)] for name, t in m['marks']], 'keys': [[vt(t), c] for t, c in m['keys']]}
    json.dump(idx, open(f'{T}/{n}.idx.json', 'w'))
    print(n, 'dur', round(idx['dur'], 1), 's', 'marcas', [(name, round(t, 1)) for name, t in idx['marks']])
