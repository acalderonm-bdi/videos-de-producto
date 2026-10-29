"""Cámara que sigue al cursor (estilo grabador de pantalla con zoom) para las escenas con tomas de la app.

Lee tomas/<toma>.idx.json (de codificar.py) y escribe cam/<escena>.jsx con `var CAM = {...}` que vlib.jsx usa:
  cam    keyframes cada 2 cuadros de [t, anchorX, anchorY, escala%] en px de la toma
  cur    posición del cursor por cuadro (px de la toma) · clicks [t, x, y] · keys [t, texto acumulado]
  map    [t_salida, t_toma] para el time remap

Uso: python camara.py camara.json
camara.json:
{
  "panel": [1080, 1920],          // tamaño visible de la pantalla en la escena (1000×1240 si va en panel con márgenes)
  "escenas": {
    "V1": {"toma": "tablero", "modo": "auto", "a": 0.4, "k": 1.6, "dur": 5.2, "z0": 0.74, "z1": 1.0},
    "V2": {"toma": "buscar", "modo": "tramos", "dur": 6.8,
           "mapa": [[0, 4.4], [0.6, 5.3], [2.1, 10.7], [3.8, 18.6], [6.8, 22.5]],
           "zoom": [[0, "FULL"], [0.45, 1.05], [2.3, 1.05], [2.9, "FULL"], [6.8, 0.40]]}
  }
}
 auto:   la toma corre desde `a` a velocidad `k`; acerca a z1 en cada clic/tecleo y vuelve a z0.
 tramos: `mapa` = tiempo de salida → tiempo de la toma (lineal por tramos, sirve para acelerar lo aburrido);
         `zoom` = escala por tiempo (suavizada). "FULL" = toda la pantalla a lo ancho. Regla: acercar al buscar
         y seleccionar, abrir a FULL en el resultado.
"""
import json, os, sys

HANDLE = 0.5   # cola de cada escena (transiciones)


def smoothstep(x):
    x = max(0.0, min(1.0, x)); return x * x * (3 - 2 * x)


def interp(pairs, t, suave=False):
    if t <= pairs[0][0]: return pairs[0][1]
    for (a, va), (b, vb) in zip(pairs, pairs[1:]):
        if t <= b:
            x = (t - a) / (b - a)
            return va + (vb - va) * (smoothstep(x) if suave else x)
    return pairs[-1][1]


def gen(nombre, e, PW, PH, root):
    j = json.load(open(os.path.join(root, 'tomas', e['toma'] + '.idx.json')))
    SW, SH, cur = j['w'], j['h'], j['cursor']
    FULL = PW / SW
    dur = e['dur']; total = dur + HANDLE; nf = int(round(total * 30))
    if e.get('modo', 'auto') == 'tramos':
        mapa = [tuple(m) for m in e['mapa']]
        zoom = [(t, FULL if z == 'FULL' else z) for t, z in e['zoom']]
        src_of = lambda t: interp(mapa, min(t, mapa[-1][0])) + max(0, t - mapa[-1][0])
        z_of = lambda t: interp(zoom, t, True)
        zmin, zmax = min(z for _, z in zoom), max(z for _, z in zoom)
    else:
        a, k, z0, z1 = e['a'], e['k'], e['z0'], e['z1']
        mapa = [(0, a), (total, a + total * k)]
        src_of = lambda t: a + t * k
        focos = [(c[0] - a) / k for c in j['clicks']]
        if j['keys']: focos += [(j['keys'][0][0] - a) / k, (j['keys'][-1][0] - a) / k]

        def z_of(t):
            z = z0
            for f in focos:   # entra 0.45 s antes del clic, se queda 1.1 s, sale en 0.6 s
                z = max(z, z0 + (z1 - z0) * min(smoothstep((t - (f - 0.45)) / 0.4), 1 - smoothstep((t - (f + 1.1)) / 0.6)))
            return z
        zmin, zmax = z0, z1

    def cur_at(src):
        lo, hi = 0, len(cur) - 1
        while lo < hi:
            m = (lo + hi) // 2
            if cur[m][0] < src: lo = m + 1
            else: hi = m
        return cur[lo][1], cur[lo][2]

    cam, curs, sx, sy = [], [], None, None
    for f in range(nf + 1):
        t = f / 30; x, y = cur_at(src_of(t)); curs.append([round(x, 1), round(y, 1)])
        z = z_of(t)
        w = 0 if zmax - zmin < 1e-6 else max(0.0, min(1.0, (z - zmin) / (zmax - zmin)))   # 0 = sin zoom: centrado
        if sx is None: sx, sy = x, y
        al = 0.07 + 0.08 * w                     # suavizado exponencial, más pegado al cursor con zoom alto
        sx += (x - sx) * al; sy += (y - sy) * al
        fx, fy = SW / 2 + (sx - SW / 2) * w, SH / 2 + (sy - SH / 2) * w
        hw, hh = PW / 2 / z, PH / 2 / z
        ax = min(max(fx, hw), SW - hw) if hw * 2 < SW else SW / 2
        ay = min(max(fy, hh), SH - hh) if hh * 2 < SH else SH / 2
        if f % 2 == 0 or f == nf: cam.append([round(t, 4), round(ax, 1), round(ay, 1), round(z * 100, 2)])

    def salida(src):   # inversa del mapa
        for (a, sa), (b, sb) in zip(mapa, mapa[1:]):
            if sa <= src <= sb: return a + (b - a) * (src - sa) / (sb - sa)
        return None

    clicks = [[round(t, 3), x, y] for t, x, y in ((salida(c[0]), c[1], c[2]) for c in j['clicks']) if t is not None and 0 <= t <= total]
    keys, txt = [], ''
    for kt, ch in j['keys']:
        txt += ch; t = salida(kt)
        if t is not None and t <= total: keys.append([round(max(0, t), 3), txt])
    out = {'name': nombre, 'take': e['toma'] + '.mp4', 'total': round(total, 4), 'L': dur, 'src': [SW, SH],
           'map': [[round(a, 4), round(s, 4)] for a, s in mapa], 'cam': cam, 'cur': curs, 'clicks': clicks, 'keys': keys}
    os.makedirs(os.path.join(root, 'cam'), exist_ok=True)
    open(os.path.join(root, 'cam', nombre + '.jsx'), 'w').write('var CAM = ' + json.dumps(out) + ';\n')
    return out


if __name__ == '__main__':
    cfg_path = os.path.abspath(sys.argv[1]); root = os.path.dirname(cfg_path); cfg = json.load(open(cfg_path))
    PW, PH = cfg.get('panel', [1080, 1920])
    for n, e in cfg['escenas'].items():
        o = gen(n, e, PW, PH, root)
        print(n, 'dur', o['L'], 'clics', [c[0] for c in o['clicks']], 'texto', o['keys'][-1][1] if o['keys'] else '')
