#!/bin/bash
# Instala el kit de video en Linux (aarch64 o x86_64) sin sudo: apps Craft (última versión), ffmpeg estático, venv de Python
# y los servidores MCP en Claude Code si está instalado. Uso: bash instalar-linux.sh [carpeta-de-trabajo=$HOME]
set -e
ARCH=$(uname -m); [ "$ARCH" = arm64 ] && ARCH=aarch64
B=$HOME/.local/bin; RAIZ=${1:-$HOME}; mkdir -p $B ~/craft/dl ~/video-kit
cd ~/craft/dl
for n in effectcraft filmcraft soundcraft designcraft photocraft; do
  t=$(curl -fsSL https://api.github.com/repos/storytold/$n/releases/latest | python3 -c "import json,sys;print(json.load(sys.stdin)['tag_name'])")
  v=${t#v}; f=$n-$v-linux-$ARCH.tar.gz
  [ -f $f ] || curl -fsSLO https://github.com/storytold/$n/releases/download/$t/$f
  curl -fsSL https://github.com/storytold/$n/releases/download/$t/SHA256SUMS.txt | grep " $f$" | sha256sum -c -
  tar xzf $f -C ~/craft; echo "$n $v"
done
cd ~/craft; for d in *-linux-$ARCH; do for b in $d/bin/*; do ln -sf $PWD/$b $B/$(basename $b); done; done
if ! [ -x $B/ffmpeg ]; then
  a=$([ $ARCH = aarch64 ] && echo arm64 || echo amd64); cd /tmp
  curl -fsSLO https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-$a-static.tar.xz
  curl -fsSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-$a-static.tar.xz.md5 | md5sum -c -
  tar xJf ffmpeg-release-$a-static.tar.xz && cp ffmpeg-*-$a-static/ff{mpeg,probe} $B/
fi
cd ~/video-kit; [ -d .venv ] || python3 -m venv .venv
.venv/bin/pip -q install numpy scipy pillow playwright && .venv/bin/python -m playwright install chromium
if command -v claude >/dev/null; then
  for c in effectcraft filmcraft; do claude mcp add -s user $c -- $B/$c-cli mcp 2>/dev/null || true; done
  for c in designcraft photocraft soundcraft; do claude mcp add -s user $c -- $B/$c-cli mcp --automation-read-root $RAIZ --automation-write-root $RAIZ 2>/dev/null || true; done
fi
grep -q 'local/bin' ~/.bashrc || echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
echo "listo · Python del kit: ~/video-kit/.venv/bin/python · $($B/effectcraft-cli info --empty | head -1)"
