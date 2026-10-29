---
name: video-captura
description: Graba una app web corriendo en local para hacer videos de producto — tomas a 2× (2880×1800) con el cursor, los clics, lo tecleado y marcas de momentos registrados, pausas que se cortan solas, renombrado del producto solo en la grabación, y piezas sueltas de la interfaz (tarjetas, botones, pantallas) a 3× con esquinas transparentes para animarlas en 3D. Úsala cuando pidan "graba la app para el video", "saca tomas del sistema", "captura las tarjetas para el 3D", o como primer paso de video-sistema o video-lanzamiento.
---

# Captura de la app

Todo se graba **de la app en local** con datos de demo. Lee `../../LECCIONES.md` (reglas 2–7) antes.

## 0 · Preparar los datos (lo que más se nota)
- Que se vea **como producción**: llena los módulos que salen en el video (ventas, clientes, agenda, finanzas), KPIs en positivo,
  fechas de esta semana. Archiva los registros «prueba»/«test». Refresca caches o analíticas.
- **Nunca** siembres contra producción. Guarda cómo revertir lo que sembraste (ids, respaldo de la base).
- Usuario de demo en variables de entorno (`DEMO_USER`, `DEMO_PASS`), nunca escrito en archivos.

## 1 · Tomas con cursor — `scripts/toma.py`
```bash
pip install playwright pillow && python -m playwright install chromium
cp scripts/flujos.ejemplo.py mi-video/flujos.py     # adapta rutas y selectores
cd mi-video && python <kit>/skills/video-captura/scripts/toma.py flujos.py buscar tablero
python <kit>/skills/video-captura/scripts/codificar.py buscar tablero
```
- Cada flujo recibe una `Toma`: `t.ir(ruta)`, `t.start()`, `t.move(x,y)`, `t.click_el(locator)`, `t.type(texto)`, `t.hold(s)`,
  `t.mark('resultado')`, `t.pause()`/`t.resume()` (esperas largas, se cortan a 0.1 s), `t.stop()`.
- Salida: `tomas/<toma>.mp4` (30 fps, tiempo real) + `tomas/<toma>.idx.json` (cursor, clics, teclas y marcas en tiempo de video y px de la toma).
- El cursor **no** se graba en el video: lo dibuja la escena (flecha + onda en cada clic), así puede crecer con el zoom.
- `RENOMBRAR = [[regex, nuevo]]` cambia textos solo en la grabación (MutationObserver), p. ej. el nombre interno → el comercial.
- `INIT_SCRIPTS` para tema oscuro, ocultar banners, etc.

**Trampas**
- `--force-device-scale-factor=2` en el lanzamiento + `device_scale_factor=2` en el contexto, o el screencast sale a 1×.
- El screencast solo manda cuadros cuando algo cambia; `codificar.py` los estira a su duración real (está bien).
- Un `<select>` nativo se come el siguiente clic: usa `select_option` sin hacer clic en él.
- En paneles con scroll, `click_el` ya hace `scroll_into_view_if_needed` antes de mover el cursor.
- Diálogos nativos (`window.prompt`/`confirm`) se descartan solos en Playwright: el flujo «no hace nada».

## 2 · Piezas para 3D — `scripts/piezas.py`
```bash
cp scripts/piezas.ejemplo.py mi-video/mis_piezas.py
python <kit>/skills/video-captura/scripts/piezas.py mis_piezas.py
```
- Tipos: `pantalla` (vista completa), `tarjeta` (sube del rótulo al contenedor redondeado), `selector`.
- `exacto: True` si el rótulo también aparece en el menú lateral; `antes(page)` para abrir un modal o hacer scroll.
- Salida: `capas/<nombre>.png` a 3× con esquinas transparentes + `capas/piezas.jsx` (`w, h` y centro `cx, cy` dentro de la
  pantalla completa, para que las tarjetas despeguen de su lugar exacto en el formato «objeto»).
- Agrega `capas/logo.png` (PNG con transparencia) para las escenas de marca.

## 3 · Revisar
Abre 2–3 PNG y un par de cuadros de cada toma: datos llenos, nada en «cargando…», cursor fuera de la pieza, nombre correcto.
