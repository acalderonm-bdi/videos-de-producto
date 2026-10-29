---
name: video-sistema
description: Hace videos de venta de un sistema (SaaS, ERP, app de gestión) a partir de su interfaz real, en cinco formatos probados — promo horizontal con módulos, reel vertical con cámara que sigue al cursor, reel de marca, «un día en…» (historia por horas con b-roll y voz) y «producto como objeto» (la interfaz en capas 3D estilo keynote, horizontal y vertical) — con EffectCraft, SoundCraft y FilmCraft. Úsala cuando pidan "hazme un video del sistema", "un promo / reel / comercial de la app", "estilo Apple", "en vertical y horizontal", "con la cámara siguiendo el mouse", o mejorar uno de estos videos.
---

# Video de venta de un sistema

Antes de empezar: lee `../../LECCIONES.md` completo, elige el formato con quien lo encarga (un paso a la vez, muestra cuadros antes
de renderizar todo) y edita `marca.jsx` (copia de `comun/marca.jsx`).

## Los cinco formatos
| # | Formato | Aspecto | Dura | Cuándo |
|---|---|---|---|---|
| 1 | Promo de venta | 16:9 | ~60 s | Presentar el sistema a un comprador: gancho → dolor → marca → un módulo por escena → mercado → CTA |
| 2 | Reel con cursor | 9:16 | ~50 s | Redes: la interfaz a sangre y la cámara entra a donde se da clic |
| 3 | Reel de marca | 9:16 | ~55 s | Igual que 2, con identidad fuerte: fondo, letras grandes y música propia |
| 4 | Un día en… | 9:16 | ~60 s | Historia por horas: b-roll real + el flujo completo en la app + voz. ★ el que más vende |
| 5 | Producto como objeto | 16:9 y 9:16 | ~37 s | Premium, sin personas ni créditos: capas 3D, macro, desenfoque, una palabra gigante a la vez. ★ |

Recetas, estructura de escenas y trampas de cada uno: `references/formatos.md`.

## Tubería
1. **Captura** → skill `video-captura` (tomas con cursor para 2–4; piezas a 3× para 5).
2. **Cámara** (2–4) → `scripts/camara.py camara.json` → `cam/<escena>.jsx`. Modo `auto` (zoom en cada clic) o `tramos`
   (mapa de tiempo + zoom por tramos: acercar al buscar/seleccionar, **pantalla completa en el resultado**).
3. **Escenas** → `scripts/construir.sh <video> objeto H|V` o `... reel`. El guion de escenas es tuyo:
   `objeto.jsx` (copia de `objeto.ejemplo.jsx`: `O.ORDEN`) o `reel.jsx` (`REEL`). Para el 1, `K.feature({...})` de `comun/lib.jsx`.
4. **Revisa cuadros clave** antes de renderizar: `effectcraft-cli render-frame --comp OBJETO_H --time 5 --max-side 960 --out f.png escenas/video.ecproj`.
5. **Música** → skill `video-audio` (`componer.py` con los cortes en beats). **Voz** (formato 4) → `voz.py`.
6. **Render** → skill `video-render` (por tramos) y unión con la mezcla. **QA** con la hoja de cuadros.
7. **Mejora**: cada comentario va a `LECCIONES.md` antes del siguiente render.

## Trucos del motor (EffectCraft)
- `$.evalFile` solo lee la carpeta del proyecto: `construir.sh` copia librerías, guion y cámaras a `escenas/`.
- Los globals no persisten entre llamadas del MCP `run_script`: se cargan las librerías cada vez.
- `layer.parent = x` compensa (el hijo queda con orientación inversa); para heredar el plano: `setParentWithJump(x)`.
- Plano «en el piso» visto desde arriba: rotación X **negativa** (positiva = reverso, texto en espejo).
- Las capas 3D se pintan sobre el 2D: grano y viñeta en una capa de ajuste del maestro.
- Selector de texto: el grupo se llama `advanced`. Glow sobre tarjetas claras las quema.
- Cámara de dos nodos: el punto de interés es `ADBE Anchor Point`; la distancia de foco la calcula `O.cam`.
