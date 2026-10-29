"""Graba tomas de una app web corriendo en local: video a 2× (2880×1800) + cursor, clics, teclas y marcas registrados.

Uso:
    python toma.py flujos.py <toma> [<toma> ...]

`flujos.py` es TU archivo: define BASE (URL de la app), login(page) opcional, RENOMBRAR (opcional) y un dict
TOMAS = {'nombre': funcion(t)}. Cada función recibe una Toma `t` ya en marcha. Ver flujos.ejemplo.py.

Salida en ./tomas/: <toma>/00000.jpg… (cuadros) + <toma>.json (tiempos). Luego `python codificar.py <toma>`
arma <toma>.mp4 a 30 fps y <toma>.idx.json (cursor/clics/teclas/marcas en tiempo de video).
"""
import base64, json, math, os, runpy, shutil, sys, time

T = os.path.abspath(os.environ.get('TOMAS_DIR', 'tomas'))
VIEW_W, VIEW_H, DPR = 1440, 900, 2


class Toma:
    def __init__(self, ctx, nombre):
        self.nombre, self.p = nombre, ctx.new_page()
        self.cdp = ctx.new_cdp_session(self.p)
        self.dir = f'{T}/{nombre}'; os.makedirs(self.dir, exist_ok=True)
        for f in os.listdir(self.dir): os.remove(f'{self.dir}/{f}')
        self.frames, self.cursor, self.clicks, self.keys, self.marks = [], [], [], [], []
        self.x, self.y, self.on, self.t0 = VIEW_W / 2, VIEW_H / 2, False, None
        self.cdp.on('Page.screencastFrame', self._frame)

    # Screencast de CDP. Con --force-device-scale-factor=2 llega a 2880×1800 (~15 fps; codificar.py lo lleva a 30).
    def _frame(self, e):
        try: self.cdp.send('Page.screencastFrameAck', {'sessionId': e['sessionId']})
        except Exception: pass
        if not self.on: return
        t = time.time(); n = len(self.frames)
        open(f'{self.dir}/{n:05d}.jpg', 'wb').write(base64.b64decode(e['data']))
        self.frames.append(t); self.cursor.append([t, self.x, self.y])

    def _cast(self, on):
        if on: self.cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 92, 'maxWidth': VIEW_W * DPR, 'maxHeight': VIEW_H * DPR})
        else: self.cdp.send('Page.stopScreencast')

    def ir(self, ruta, espera=1.8):
        self.p.goto(BASE + ruta, wait_until='networkidle'); self.hold(espera)

    def start(self): self.t0 = time.time(); self.on = True; self._cast(True); self.p.wait_for_timeout(16)
    # pause/resume: para esperas largas (un proceso que tarda); codificar.py corta ese hueco a 0.1 s
    def pause(self): self.marks.append(['pausa', time.time()]); self.on = False; self._cast(False)
    def resume(self): self.on = True; self._cast(True); self.marks.append(['sigue', time.time()]); self.p.wait_for_timeout(16)
    # mark: momento con nombre (p. ej. 'resultado') para alinear la cámara y la voz después
    def mark(self, nombre): self.marks.append([nombre, time.time()])

    def move(self, x, y, dur=0.7):
        """Movimiento humano: smoothstep con un arco leve."""
        x0, y0, t0 = self.x, self.y, time.time()
        while True:
            k = min(1.0, (time.time() - t0) / dur); e = k * k * (3 - 2 * k)
            self.x, self.y = x0 + (x - x0) * e, y0 + (y - y0) * e - math.sin(e * math.pi) * 18
            self.p.mouse.move(self.x, self.y); self.cursor.append([time.time(), self.x, self.y]); self.p.wait_for_timeout(12)
            if k >= 1: break
        self.x, self.y = x, y

    def click(self, x, y, dur=0.7):
        self.move(x, y, dur); self.hold(0.12)
        self.clicks.append([time.time(), x, y]); self.p.mouse.click(x, y); self.hold(0.25)

    def click_el(self, loc, dur=0.7, dx=0, dy=0):
        # en paneles con scroll el elemento puede quedar fuera de vista: el clic caería en otra cosa
        loc.scroll_into_view_if_needed(); self.hold(0.25)
        self.click(*centro(loc, dx, dy), dur)

    def to(self, loc, dur=0.7, dx=0, dy=0):
        self.move(*centro(loc, dx, dy), dur)

    def type(self, txt, delay=0.07):
        for ch in txt:
            self.p.keyboard.type(ch); self.keys.append([time.time(), ch]); self.hold(delay)

    def hold(self, s):
        end = time.time() + s
        while time.time() < end:
            self.cursor.append([time.time(), self.x, self.y]); self.p.wait_for_timeout(30)

    def stop(self):
        self.hold(0.1); self.on = False; self._cast(False)
        # el screencast solo manda cuadros cuando algo cambia: el último cuadro dura hasta el final de la toma
        if self.frames:
            n = len(self.frames); shutil.copy(f'{self.dir}/{n - 1:05d}.jpg', f'{self.dir}/{n:05d}.jpg'); self.frames.append(time.time())
        meta = {'t0': self.t0, 'dpr': DPR, 'frames': self.frames, 'cursor': self.cursor, 'clicks': self.clicks, 'keys': self.keys, 'marks': self.marks}
        json.dump(meta, open(f'{T}/{self.nombre}.json', 'w'))
        dur = self.frames[-1] - self.frames[0] if self.frames else 0
        print(self.nombre, len(self.frames), 'cuadros', round(len(self.frames) / max(dur, 1e-6), 1), 'fps', round(dur, 1), 's', flush=True)
        self.p.close()


def centro(loc, dx=0, dy=0):
    b = loc.bounding_box(); return b['x'] + b['width'] / 2 + dx, b['y'] + b['height'] / 2 + dy


def script_renombrar(pares):
    """Renombra textos SOLO en la grabación (nunca en la app): [[regex, reemplazo], ...]. Sigue el DOM con MutationObserver."""
    return '''(() => {
  const R = %s.map(([a, b]) => [new RegExp(a, 'g'), b]);
  const fix = (n) => { if (n.nodeType === 3) { let t = n.nodeValue, o = t; for (const [a, b] of R) t = t.replace(a, b); if (t !== o) n.nodeValue = t; }
                       else if (n.childNodes) n.childNodes.forEach(fix); };
  const go = () => { fix(document.body); for (const [a, b] of R) document.title = document.title.replace(a, b);
    new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(fix); if (m.type === 'characterData') fix(m.target); }))
      .observe(document.body, {childList: true, subtree: true, characterData: true}); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();''' % json.dumps(pares)


if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    F = runpy.run_path(sys.argv[1])
    BASE = F['BASE']; TOMAS = F['TOMAS']
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=[f'--force-device-scale-factor={DPR}'])
        ctx = b.new_context(viewport={'width': VIEW_W, 'height': VIEW_H}, device_scale_factor=DPR, locale=F.get('LOCALE', 'es-MX'))
        for s in F.get('INIT_SCRIPTS', []): ctx.add_init_script(s)
        if F.get('RENOMBRAR'): ctx.add_init_script(script_renombrar(F['RENOMBRAR']))
        if F.get('login'):
            pg = ctx.new_page(); F['login'](pg, BASE); pg.close()
        for n in sys.argv[2:]:
            t = Toma(ctx, n)
            try: TOMAS[n](t)
            except Exception as e: print('FALLÓ', n, type(e).__name__, str(e)[:300], flush=True)
            if t.on: t.stop()
        b.close()
