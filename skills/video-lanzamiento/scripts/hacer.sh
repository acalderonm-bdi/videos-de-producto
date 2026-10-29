#!/bin/bash
# Video de lanzamiento de punta a punta. Uso: bash hacer.sh <carpeta-del-video> [H|V]
# La carpeta tiene: specs.json, guion.txt, voz/ (python voz.py guion.txt), marca.jsx, capas/ (piezas.py), tomas/ (opcional).
set -e
V=$(cd "$1" && pwd)/; ASP=${2:-H}; AQUI=$(cd "$(dirname "$0")" && pwd); KIT=$(cd "$AQUI/../../.." && pwd)
PY=${PYTHON:-python3}; FF=$(command -v ffmpeg || echo ~/.local/bin/ffmpeg)
cd "$V"
$PY "$AQUI/linea.py" specs.json
$PY "$KIT/skills/video-audio/scripts/componer.py" musica.json
soundcraft-cli script musica.sc --save "$V/musica.scraft" --bounce "$V/mezcla.wav" >/dev/null
mkdir -p escenas render
cp "$KIT/comun/lib.jsx" "$KIT/comun/obj.jsx" "$AQUI/escenas.jsx" linea.jsx marca.jsx escenas/
cp capas/piezas.jsx escenas/ 2>/dev/null || echo 'var PIEZAS = {};' > escenas/piezas.jsx
cat > escenas/construir.jsx <<J
var VIDEO_ROOT = "$V"; var R = VIDEO_ROOT + "escenas/"; var O_ASPECTO = "$ASP";
var p = app.project; for (var i = p.numItems; i >= 1; i--) p.item(i).remove();
\$.evalFile(new File(R + "marca.jsx")); \$.evalFile(new File(R + "lib.jsx")); \$.evalFile(new File(R + "piezas.jsx"));
\$.evalFile(new File(R + "obj.jsx")); \$.evalFile(new File(R + "linea.jsx")); \$.evalFile(new File(R + "escenas.jsx"));
L.master("LANZAMIENTO"); "listo " + p.numItems;
J
cd escenas
[ -f video.ecproj ] || effectcraft-cli script --eval 1 --empty --save-as "$PWD/video.ecproj" >/dev/null
effectcraft-cli script construir.jsx video.ecproj --save | tail -1
cd ..
TOTAL=$($PY -c "import json;print(json.load(open('musica.json'))['total'])")
bash "$KIT/skills/video-render/scripts/render_tramos.sh" escenas/video.ecproj LANZAMIENTO_$ASP render "$TOTAL" 12
$FF -v error -y -f concat -safe 0 -i render/lista.txt -i narracion.wav -i mezcla.wav -filter_complex \
 "[2:a]atrim=0:$TOTAL,volume=-2dB[m];[m][1:a]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=400[md];[1:a]volume=2dB[v];[v][md]amix=inputs=2:normalize=0,afade=t=out:st=$($PY -c "print($TOTAL-1.4)"):d=1.4,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart "lanzamiento-$ASP.mp4"
echo "listo: $V""lanzamiento-$ASP.mp4"
