---
name: video-audio
description: Pone el sonido a un video de producto — música original compuesta por código (batería, bajo, arpegio y pad en SoundCraft, al BPM del montaje, con golpes solo en los momentos clave), efectos sintetizados (riser, impacto, sub), narración por TTS con una pista por frase (o borrador gratis para medir tiempos) y la mezcla final con la música bajo la voz a −14 LUFS. Sin licencias de música. Úsala cuando pidan "ponle música", "música original para el video", "narración / voz en off", "mezcla el audio", "está muy fuerte / no se oye la voz".
---

# Audio del video

## Música — `scripts/componer.py`
```bash
python componer.py musica.json      # → musica.sc + fx/*.wav
soundcraft-cli script musica.sc --save musica.scraft --bounce mezcla.wav   # reporta LUFS y true peak
```
`musica.json`: `{"total": 37, "bpm": 120, "logo": 0, "cierre": 31.5, "golpes": [7, 12]}` (segundos). En el video de lanzamiento lo
escribe `linea.py`. Para el formato «objeto», a mano con los cortes de `O.ORDEN`.
- Intro aireada hasta el logo → cuerpo a medio tiempo → se vacía y sube 8 beats antes del cierre → impacto.
- Golpes solo en logo, cierre y hasta 3 `golpes`. **Nada de whoosh en cada corte.**
- Cambia la armonía en `PROG`/`ROOT` (por defecto Re mayor aireado). Para algo más tenso: menor, más grave, menos pad.

**Trampas de SoundCraft:** 960 ticks por negra (con 480 sale al doble de rápido) · los ids son un contador global (pistas primero,
luego clips) · master con `track.new {kind:master}` + inserts (compressor, maximizer) · los efectos se importan con `file.import_audio`.

## Voz — `scripts/voz.py`
- `--borrador`: silencio con la duración estimada (para armar tiempos sin gastar). `--say`: voz del sistema en macOS.
- ElevenLabs (`eleven_multilingual_v2`, `language_code` = idioma): `VOZ_ID=<id> python voz.py guion.txt <<< "$LLAVE"`.
  La llave entra por stdin; nunca en archivos ni en la memoria del agente. Una llave solo con permiso de TTS no puede listar
  voces, pero sí usar una por id.
- La voz la elige quien encarga el video. Una voz más pausada alarga las escenas: `linea.py` lo absorbe solo.

## Mezcla
```bash
ffmpeg -i video.mp4 -i narracion.wav -i mezcla.wav -filter_complex \
 "[2:a]volume=-2dB[m];[m][1:a]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=400[md];[1:a]volume=2dB[v];\
  [v][md]amix=inputs=2:normalize=0,afade=t=out:st=DUR-1.4:d=1.4,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -movflags +faststart final.mp4
```
Sin voz: `[2:a]atrim=0:DUR,afade=t=out:st=DUR-1.2:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11`.
