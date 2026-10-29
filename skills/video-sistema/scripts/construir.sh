#!/bin/bash
# Arma el proyecto de EffectCraft de un formato de sistema. Uso:
#   bash construir.sh <carpeta-del-video> objeto [H|V]   → comp OBJETO_H / OBJETO_V  (necesita objeto.jsx = tu O.ORDEN)
#   bash construir.sh <carpeta-del-video> reel            → comp REEL_V               (necesita reel.jsx y cam/)
# Después: render_tramos.sh (skill video-render). Revisa cuadros clave con render-frame ANTES de renderizar todo.
set -e
V=$(cd "$1" && pwd)/; F=$2; ASP=${3:-H}; AQUI=$(cd "$(dirname "$0")" && pwd); KIT=$(cd "$AQUI/../../.." && pwd)
mkdir -p "$V/escenas"; cd "$V/escenas"
cp "$KIT/comun/lib.jsx" "$KIT/comun/obj.jsx" "$KIT/comun/vlib.jsx" ../marca.jsx .
cp ../capas/piezas.jsx . 2>/dev/null || echo 'var PIEZAS = {};' > piezas.jsx
if [ "$F" = objeto ]; then cp ../objeto.jsx guion.jsx; LIBS='"obj.jsx", "guion.jsx"'; FIN="O.master();"; COMP=OBJETO_$ASP
else cp ../reel.jsx guion.jsx; cp ../cam/*.jsx .;   # $.evalFile solo lee la carpeta del proyecto
 LIBS='"vlib.jsx", "guion.jsx"'; FIN="reel();"; COMP=REEL_V; ASP=V; fi
cat > construir.jsx <<J
var VIDEO_ROOT = "$V"; var R = VIDEO_ROOT + "escenas/"; var O_ASPECTO = "$ASP";
var p = app.project; for (var i = p.numItems; i >= 1; i--) p.item(i).remove();
var libs = ["marca.jsx", "lib.jsx", "piezas.jsx", $LIBS];
for (var j = 0; j < libs.length; j++) \$.evalFile(new File(R + libs[j]));
$FIN "listo " + p.numItems;
J
[ -f video.ecproj ] || effectcraft-cli script --eval 1 --empty --save-as "$PWD/video.ecproj" >/dev/null
effectcraft-cli script construir.jsx video.ecproj --save | tail -1
echo "comp: $COMP  ·  proyecto: $V""escenas/video.ecproj"
