# videos-de-producto

Skills para que un agente (Claude Code u otro con MCP) haga **videos de venta de un software** a partir de la app corriendo en local:
grabación con cursor, interfaz en capas 3D, música original, narración y render. Sin plantillas de video ni stock: todo sale de la app real
y de código.

Probado con las apps de la familia **Craft** (EffectCraft, FilmCraft, SoundCraft, PhotoCraft, DesignCraft), que traen CLI y servidor MCP.

| Skill | Para qué |
|---|---|
| [`video-captura`](skills/video-captura/SKILL.md) | Grabar flujos de la app a 2× con cursor, clics y teclas registrados; capturar piezas sueltas a 3× para 3D |
| [`video-sistema`](skills/video-sistema/SKILL.md) | Cinco formatos para vender un sistema: promo, reel con cámara que sigue al cursor, reel de marca, «un día en…», producto como objeto |
| [`video-lanzamiento`](skills/video-lanzamiento/SKILL.md) | Video de evento o lanzamiento guiado por la voz: problema con datos → revelación → cómo funciona → cierre. Variantes cortas desde un `specs.json` |
| [`video-audio`](skills/video-audio/SKILL.md) | Música compuesta por código y mezclada en SoundCraft, narración por TTS, mezcla a −14 LUFS |
| [`video-render`](skills/video-render/SKILL.md) | Instalación, render por tramos en una máquina remota y QA con hoja de cuadros |

Antes de cualquier video: **[LECCIONES.md](LECCIONES.md)**.

## Estructura
```
comun/        librerías de escenas (EffectCraft, JS estilo After Effects)
  marca.jsx   ← lo único que cambia de un producto a otro: nombre, colores, fuentes, logo, CTA
  lib.jsx     texto, formas, revelados, ventanas, chips (namespace K)
  vlib.jsx    escenas verticales con cámara que sigue al cursor (VS)
  obj.jsx     producto como objeto: cámara 3D con DOF, piezas, palabra gigante (O)
skills/<skill>/SKILL.md + scripts/
instalar/     instalación en macOS y Linux
```

## Carpeta de un video
```
mi-video/
  marca.jsx          copia de comun/marca.jsx, editada
  flujos.py          qué grabar (ver video-captura)
  tomas/             <toma>.mp4 + <toma>.idx.json
  capas/             piezas PNG a 3× + piezas.jsx + logo.png
  cam/               cámaras por escena (camara.py)
  escenas/           proyecto de EffectCraft generado
  render/            tramos
```

## Instalación rápida
```bash
bash instalar/instalar-linux.sh    # o instalar/instalar-mac.sh
```
Luego copia `skills/*` a `~/.claude/skills/` (o enlázalas) para que el agente las encuentre.

Licencia MIT.
