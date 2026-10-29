#!/bin/bash
# Hoja de cuadros para revisar un video de un vistazo (10 cuadros repartidos). Uso: bash hoja.sh video.mp4 [hoja.jpg]
# Mírala SIEMPRE antes de entregar: textos cortados, cosas en espejo, pantallas vacías, palabras perdidas en fondo claro.
V=$1; OUT=${2:-${V%.*}-hoja.jpg}
N=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$V")
SEL=$(python3 -c "n=$N;print('+'.join(f'eq(n\\\\,{int(n*(i+0.5)/10)})' for i in range(10)))")
ffmpeg -v error -y -i "$V" -vf "select='$SEL',scale=384:-1,tile=5x2" -frames:v 1 "$OUT"
echo "$OUT ($N cuadros)"
