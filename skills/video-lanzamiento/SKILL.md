---
name: video-lanzamiento
description: Hace el video de presentación de un producto para un evento, lanzamiento o redes, guiado por la voz — problema con datos reales y verificados → revelación de la marca → cómo funciona (tarjetas reales de la interfaz y tomas de la app) → cierre con llamada a la acción — y genera variantes cortas (costo, un día, 4 pasos, teaser, confianza) desde un solo specs.json, de punta a punta con un comando. Úsala cuando pidan "el video para el evento", "video de lanzamiento", "presentación en video del producto", "un teaser de 20 segundos", "cinco versiones del video", "con narración".
---

# Video de lanzamiento (guiado por la voz)

Lee `../../LECCIONES.md` (sobre todo 5, 9–14). La diferencia con `video-sistema`: aquí **la voz manda el ritmo**. Cada escena dura
lo que su frase (+0.7 s); si cambia la voz o el texto, todo se re-acomoda solo.

## Estructura que funciona (≈2 min para evento, ≈1 min para redes)
1. **Problema con datos reales** (cifras con fuente, noticias recientes del sector). Un número gigante que cuenta, tarjetas de noticias de frente.
2. **Por qué ahora** (lo que cambió: los atacantes / competidores / clientes ya usan X).
3. **Revelación**: el logo.
4. **Cómo funciona**: 3–4 pasos, cada uno con una pieza real de la interfaz o una toma de la app.
5. **Prueba / confianza**: control humano, bitácora, certificaciones de la empresa (la norma certifica a la empresa, no al producto: dilo así).
6. **Cierre**: frase + lema + CTA, fundido a negro.

Variantes cortas que salieron bien: **Costo** (cuánto cuesta hacerlo a mano vs. con el producto) · **Un día** (por horas) ·
**4 pasos** · **Teaser** de 20 s (nombres de problemas → «¿cuáles te afectan?» → «ya lo sabe») · **Confianza** (qué puede y qué no puede hacer).

## Archivos del video
- `guion.txt` — `clave|texto` por frase (ver `scripts/guion.ejemplo.txt`).
- `specs.json` — una entrada por escena: `n` (nombre), `k` (tipo), `v` (clave de la voz), `off` (cuándo entra la voz), `min`, `hit`
  y los campos del tipo. Ver `scripts/specs.ejemplo.json`.
- `marca.jsx`, `capas/` (piezas a 3× + `logo.png`, skill `video-captura`), `tomas/` si usas escenas `toma`.

| k | Qué muestra | Campos |
|---|---|---|
| `palabra` | palabra o cifra gigante + subtítulo | `txt`, `c` (color), `sub`, `subc` |
| `numero` | cifra que cuenta de 0 al valor | `n`, `pre`, `suf`, `sub`, `c` |
| `logo` | la revelación de la marca | — |
| `tarjetas` | piezas en secuencia, de frente | `cards: [[pieza, fracción 0–1 de la frase]]`, `fondo`, `s` |
| `fila` | tres piezas lado a lado | `cards` (3) |
| `toma` | la grabación de la app como plano frontal | `toma`, `desde`, `vel`, `txt` |
| `cierre` | logo + frase + lema + CTA + negro | `txt` |

## De punta a punta
```bash
cd mi-video
python <kit>/skills/video-audio/scripts/voz.py guion.txt --borrador     # tiempos con silencio, gratis
bash <kit>/skills/video-lanzamiento/scripts/hacer.sh . H                  # → lanzamiento-H.mp4
bash <kit>/skills/video-render/scripts/hoja.sh lanzamiento-H.mp4          # y MÍRALA
# con la voz buena (la llave entra por stdin, nunca en archivos):
rm -r voz; VOZ_ID=<id> python <kit>/skills/video-audio/scripts/voz.py guion.txt  <<< "$LLAVE"
bash <kit>/skills/video-lanzamiento/scripts/hacer.sh . H
```
`hacer.sh` = `linea.py` (línea de tiempo + narración + momentos de la música) → `componer.py` + SoundCraft → proyecto de EffectCraft
(`escenas.jsx`) → render por tramos → mezcla con sidechain (la música baja bajo la voz) a −14 LUFS.
Para 9:16 usa `V`; las escenas se adaptan con `O.L(h, v)`.

## Al recibir comentarios
- «No se lee la noticia / se ve borroso»: más de frente, más grande, apertura ≤ 16 (regla 9–10).
- «Bajó la calidad»: casi nunca es compresión, es dirección de arte plana (regla 12).
- «Cansa el sonido»: quita `hit` de specs, deja 3–5 (regla 14).
