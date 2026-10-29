"""Captura piezas sueltas de la interfaz a 3× (tarjetas, botones, pantallas) como PNG con esquinas transparentes,
para usarlas como capas 3D (formato «producto como objeto» y tarjetas del video de lanzamiento).

Uso: python piezas.py mis_piezas.py
`mis_piezas.py` define BASE, login(page, base) opcional, RENOMBRAR opcional y PIEZAS = [ {...}, ... ] con:
    nombre   archivo de salida (capas/<nombre>.png)
    ruta     ruta de la app
    tipo     'pantalla' (la vista entera) | 'tarjeta' (sube desde el texto hasta el contenedor redondeado) | 'selector'
    texto    para 'tarjeta' (exacto: True si el rótulo también aparece en el menú);  selector  para 'selector';  antes(page) opcional (clics previos, scroll, abrir un modal)
    radio    radio de las esquinas en px lógicos (12 por defecto; 0 para no redondear)
Salida: capas/*.png + capas/piezas.jsx (var PIEZAS = {nombre: {w, h, cx, cy}}): tamaño en px y centro dentro de la
pantalla completa de esa ruta, que obj.jsx usa para despegar tarjetas del plano en su lugar exacto.
"""
import base64, io, json, os, runpy, sys
from PIL import Image, ImageDraw

DPR = 3
OUT = os.path.abspath(os.environ.get('CAPAS_DIR', 'capas'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from toma import script_renombrar


def esquinas(png, r):
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    if r > 0:
        m = Image.new('L', im.size, 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=r * DPR, fill=255)
        im.putalpha(m)
    return im


def contenedor(loc, subir=8):
    h = loc.element_handle()
    for _ in range(subir):
        padre = h.evaluate_handle('e => e.parentElement').as_element()
        if padre is None: break
        h = padre
        if h.evaluate("e => { const s = getComputedStyle(e); return parseFloat(s.borderRadius) >= 6 && "
                      "(s.boxShadow !== 'none' || s.borderStyle !== 'none' || s.backgroundColor !== 'rgba(0, 0, 0, 0)') }"):
            return h
    return h


if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    F = runpy.run_path(sys.argv[1]); BASE = F['BASE']
    os.makedirs(OUT, exist_ok=True); meta = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=DPR, locale=F.get('LOCALE', 'es-MX'))
        for s in F.get('INIT_SCRIPTS', []): ctx.add_init_script(s)
        if F.get('RENOMBRAR'): ctx.add_init_script(script_renombrar(F['RENOMBRAR']))
        p = ctx.new_page()
        if F.get('login'): F['login'](p, BASE)
        cdp = ctx.new_cdp_session(p); ruta = None
        # sin esto la captura sale a 1× aunque el contexto diga device_scale_factor=3
        cdp.send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': DPR, 'mobile': False})
        for pz in F['PIEZAS']:
            try:
                if pz['ruta'] != ruta or pz.get('antes'):
                    p.goto(BASE + pz['ruta'], wait_until='networkidle'); p.wait_for_timeout(1500); ruta = pz['ruta']
                    if pz.get('antes'): pz['antes'](p); p.wait_for_timeout(900)
                    p.mouse.move(5, 895)   # el cursor fuera de la pieza (sin hovers)
                if pz['tipo'] == 'pantalla': box = {'x': 0, 'y': 0, 'width': 1440, 'height': 900}
                elif pz['tipo'] == 'tarjeta': box = contenedor(p.get_by_text(pz['texto'], exact=pz.get('exacto', False)).first).bounding_box()
                else: box = p.locator(pz['selector']).first.bounding_box()
                pad = pz.get('pad', 0)
                clip = {'x': box['x'] - pad, 'y': box['y'] - pad, 'width': box['width'] + 2 * pad, 'height': box['height'] + 2 * pad, 'scale': 1}
                r = cdp.send('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True, 'clip': clip})
                im = esquinas(base64.b64decode(r['data']), pz.get('radio', 0 if pz['tipo'] == 'pantalla' else 12))
                im.save(f"{OUT}/{pz['nombre']}.png")
                meta[pz['nombre']] = {'w': im.size[0], 'h': im.size[1], 'cx': round((clip['x'] + clip['width'] / 2) * DPR),
                                      'cy': round((clip['y'] + clip['height'] / 2) * DPR)}
                print(pz['nombre'], im.size)
            except Exception as e:
                print('FALLÓ', pz['nombre'], type(e).__name__, str(e)[:200])
        b.close()
    previo = {}
    if os.path.exists(f'{OUT}/piezas.json'): previo = json.load(open(f'{OUT}/piezas.json'))
    previo.update(meta)
    json.dump(previo, open(f'{OUT}/piezas.json', 'w'), indent=1)
    open(f'{OUT}/piezas.jsx', 'w').write('var PIEZAS = ' + json.dumps(previo) + ';\n')
