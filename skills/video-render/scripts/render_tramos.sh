#!/bin/bash
# Render por tramos (un proceso largo crece en memoria y lo matan). Tramos hechos se saltan (.ok), así se puede reanudar.
# Uso: bash render_tramos.sh <proyecto.ecproj> <comp> <carpeta-salida> <duración-s> [seg-por-tramo=12]
# Deja <salida>/t_NNN.mp4 + lista.txt para `ffmpeg -f concat`. Para que sobreviva a la sesión: nohup bash ... &
set -e
P=$(cd "$(dirname "$1")" && pwd)/$(basename "$1"); C=$2; OUT=$3; TOT=$4; S=${5:-12}
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd); : > "$OUT/lista.txt"
n=$(python3 -c "import math;print(math.ceil($TOT/$S))")
for ((i=0; i<n; i++)); do
  a=$(python3 -c "print(round($i*$S,3))"); b=$(python3 -c "print(round(min($TOT,($i+1)*$S),3))")
  f=$(printf "t_%03d.mp4" $i); echo "file '$f'" >> "$OUT/lista.txt"
  [ -s "$OUT/$f.ok" ] && continue
  echo "$(date +%T) $C tramo $i $a-$b" >> "$OUT/log.txt"
  # --end es exclusivo: los tramos no repiten cuadros en la unión
  effectcraft-cli render --project "$P" --comp "$C" --out "$OUT/$f" --format h264 --bitrate 40000 --audio off \
    --quality best --start $a --end $b --progress >> "$OUT/log.txt" 2>&1 && echo ok > "$OUT/$f.ok"
done
echo "$(date +%T) FIN" >> "$OUT/log.txt"
