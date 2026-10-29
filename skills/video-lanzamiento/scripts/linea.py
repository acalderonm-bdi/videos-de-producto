"""Línea de tiempo del video de lanzamiento desde specs.json + las voces ya generadas.

Uso: python linea.py specs.json
Escribe junto a specs.json: linea.jsx (var LINEA, la lee escenas.jsx), narracion.wav (todas las frases en su lugar)
y musica.json (total, logo, cierre, golpes) para componer.py.

Cada escena dura lo que su voz: off (entrada de la voz) + voz + 0.7 s, con un mínimo opcional `min`.
Así, si cambias de voz (más pausada o más rápida) el video se re-acomoda solo.
Las tarjetas de una escena entran repartidas a lo largo de su frase: cards = [[pieza, fracción 0–1], ...].
`hit: 1` marca los pocos momentos que llevan golpe en la música (3–5 por video, no en cada corte).
"""
import json, os, shutil, subprocess, sys

SPEC = os.path.abspath(sys.argv[1]); H = os.path.dirname(SPEC)
VOZ = os.path.abspath(os.environ.get('VOZ_DIR', os.path.join(H, 'voz')))
FF = shutil.which('ffmpeg') or os.path.expanduser('~/.local/bin/ffmpeg'); FP = FF[:-6] + 'ffprobe'
dur = lambda f: float(subprocess.check_output([FP, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
SP = json.load(open(SPEC))
t, escenas, voz = 0.0, [], []
for s in SP['escenas']:
    dv = dur(f'{VOZ}/{s["v"]}.mp3'); off = s.get('off', 0.4)
    d = max(s.get('min', 0), round(off + dv + 0.7, 1), 2.4 if s['k'] == 'numero' else 0, 7.0 if s['k'] == 'cierre' else 0)
    e = dict(s, name=s['n'], off=off, t0=round(t, 3), dur=d, dv=round(dv, 3))
    if s['k'] in ('tarjetas', 'fila'): e['cards'] = [[f, round(off + fr * dv, 2)] for f, fr in s['cards']]
    escenas.append(e); voz.append([s['v'], round(t + off, 3)]); t += d
TOTAL = round(t, 3); inp, flt = [], []
for i, (k, ts) in enumerate(voz):
    inp += ['-i', f'{VOZ}/{k}.mp3']; flt.append(f'[{i}:a]adelay={int(ts * 1000)}|{int(ts * 1000)}[a{i}]')
flt.append(''.join(f'[a{i}]' for i in range(len(voz))) + f'amix=inputs={len(voz)}:normalize=0,apad=whole_dur={TOTAL}[v]')
subprocess.run([FF, '-v', 'error', '-y'] + inp + ['-filter_complex', ';'.join(flt), '-map', '[v]', '-ar', '48000', '-ac', '2', f'{H}/narracion.wav'], check=True)
open(f'{H}/linea.jsx', 'w').write('var LINEA = ' + json.dumps({'total': TOTAL, 'escenas': escenas}) + ';\n')
lg = next((e for e in escenas if e['k'] == 'logo'), escenas[min(1, len(escenas) - 1)])
logo = round(lg['t0'] + (0.3 if lg['k'] == 'logo' else 0), 2)
ci = next((e['t0'] for e in escenas if e['k'] == 'cierre'), TOTAL - 7)
hits = sorted({round(e['t0'] + 0.3, 2) for e in escenas if e.get('hit') and e['k'] not in ('logo', 'cierre')} - {logo})[:3]
json.dump({'total': TOTAL, 'bpm': SP.get('bpm', 120), 'logo': logo, 'cierre': round(ci, 2), 'golpes': hits,
           'cortes': [e['t0'] for e in escenas[1:]]}, open(f'{H}/musica.json', 'w'))
print('total', TOTAL, 's · escenas', len(escenas), '· logo', logo, '· cierre', ci, '· golpes', hits)
