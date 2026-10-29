---
name: video-render
description: Instala el kit de video (apps Craft con sus CLI y servidores MCP, ffmpeg, Python con numpy/scipy/pillow/playwright) en macOS o Linux, renderiza proyectos de EffectCraft por tramos en una máquina con memoria (reanudable, sin cuadros repetidos en las uniones) y hace el QA final con una hoja de cuadros y una lista de revisión. Úsala cuando pidan "instala lo de video", "renderiza el video", "el render se murió / se quedó sin memoria", "revisa el video antes de entregarlo".
---

# Instalar, renderizar y revisar

## Instalar
- `bash instalar/instalar-linux.sh` (aarch64 o x86_64, sin sudo) o `bash instalar/instalar-mac.sh`.
- Registra los MCP en Claude Code: `effectcraft`, `filmcraft` (sin raíces) y `soundcraft`, `photocraft`, `designcraft` con
  `--automation-read-root/--automation-write-root` (sin eso no ven archivos).
- Al actualizar una app, baja el CLI de la **misma versión**.

## Render por tramos — `scripts/render_tramos.sh`
```bash
nohup bash render_tramos.sh escenas/video.ecproj OBJETO_H render 37 8 &
tail -n1 render/log.txt          # progress <hechos> <total> <seg> <restantes>
ffmpeg -f concat -safe 0 -i render/lista.txt -c copy video.mp4
```
- Un proceso largo crece en memoria (decenas de GB en cientos de cuadros 3D con DOF) y lo matan → tramos de 8–12 s.
- `--end` es exclusivo: los tramos no repiten cuadros. Los `.ok` permiten reanudar.
- 3D con DOF: una laptop se queda sin memoria; usa una máquina con 64 GB+. En Linux, `--gpu` fue más lento que CPU.
- H.264 a 40 Mbps; con alfa, WebM VP9 (ProRes 4444 llena el disco).
- Si el proyecto se arma en otra máquina, define `VIDEO_ROOT` con la ruta de allá (los scripts no llevan rutas fijas).

## QA antes de entregar — `scripts/hoja.sh video.mp4` y MIRARLA
- [ ] Marca y nombre del producto correctos en todo (también en la barra del navegador).
- [ ] Cada toma cuenta el flujo completo y el resultado se ve a pantalla completa.
- [ ] Datos llenos y creíbles; nada de «prueba», tablas vacías ni «cargando…».
- [ ] Lo que dice la voz/el texto coincide con lo que se ve.
- [ ] Ningún texto cortado, tapado, en espejo, de canto o perdido sobre fondo claro; las tarjetas con datos se leen.
- [ ] Aspecto pedido (1920×1080 / 1080×1920; si pidieron ambos, los dos).
- [ ] Cuadros exactos: `ffprobe -count_frames`; sin saltos en las uniones.
- [ ] Audio −14 LUFS, picos ≤ −1.5 dBTP, fundido final, efectos solo en 3–5 momentos.
- [ ] Ningún crédito gastado sin OK; ninguna llave en archivos.
