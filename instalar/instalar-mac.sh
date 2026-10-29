#!/bin/bash
# Instala en macOS los CLI de las apps Craft (traen el servidor MCP), ffmpeg y el venv de Python, y registra los MCP.
# Las apps con ventana se instalan aparte desde su launcher o los .dmg de cada release; el CLI debe ser de la MISMA versión.
# Uso: bash instalar-mac.sh [carpeta-de-trabajo=$HOME/Desktop]
set -e
B=$HOME/.local/bin; RAIZ=${1:-$HOME/Desktop}; mkdir -p $B ~/video-kit /tmp/craft-cli
cd /tmp/craft-cli
for n in effectcraft filmcraft soundcraft designcraft photocraft; do
  t=$(curl -fsSL https://api.github.com/repos/storytold/$n/releases/latest | python3 -c "import json,sys;print(json.load(sys.stdin)['tag_name'])")
  v=${t#v}; f=$n-cli-$v-macos-universal.zip
  [ -f $f ] || curl -fsSLO https://github.com/storytold/$n/releases/download/$t/$f
  curl -fsSL https://github.com/storytold/$n/releases/download/$t/SHA256SUMS.txt | grep " $f$" | shasum -a 256 -c -
  unzip -oq $f -d $n && find $n -type f -name "$n-cli" -exec cp {} $B/ \; ; chmod +x $B/$n-cli; echo "$n-cli $v"
done
command -v ffmpeg >/dev/null || { command -v brew >/dev/null && brew install ffmpeg; } || echo "⚠ instala ffmpeg (brew install ffmpeg)"
cd ~/video-kit; [ -d .venv ] || python3 -m venv .venv
.venv/bin/pip -q install numpy scipy pillow playwright && .venv/bin/python -m playwright install chromium
if command -v claude >/dev/null; then
  for c in effectcraft filmcraft; do claude mcp add -s user $c -- $B/$c-cli mcp 2>/dev/null || true; done
  for c in designcraft photocraft soundcraft; do claude mcp add -s user $c -- $B/$c-cli mcp --automation-read-root $RAIZ --automation-write-root $RAIZ 2>/dev/null || true; done
fi
echo "listo · agrega ~/.local/bin a tu PATH · Python del kit: ~/video-kit/.venv/bin/python"
echo "⚠ el render 3D con profundidad de campo pide mucha memoria: para videos largos usa una máquina Linux grande (skill video-render)"
