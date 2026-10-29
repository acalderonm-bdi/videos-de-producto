"""Narración: una pista por línea del guion (archivo `clave|texto`), en voz/<clave>.mp3. Salta las que ya existen.

Uso:  python voz.py guion.txt                 (ElevenLabs: la llave entra por stdin y NUNCA se guarda en disco)
      python voz.py guion.txt --say           (borrador gratis con la voz del sistema de macOS, para medir tiempos)
      python voz.py guion.txt --borrador      (silencio con la duración estimada, ~14 caracteres/s; en cualquier máquina)
Variables: VOZ_ID (id de la voz de ElevenLabs que eligió el cliente), VOZ_DIR (por defecto ./voz).
Regla: la voz la elige quien encarga el video. Si suena mal, no probar otra al azar: preguntar.
"""
import json, os, shutil, subprocess, sys, urllib.request

guion = sys.argv[1]; say = '--say' in sys.argv; borrador = '--borrador' in sys.argv
OUT = os.path.abspath(os.environ.get('VOZ_DIR', 'voz')); os.makedirs(OUT, exist_ok=True)
FF = shutil.which('ffmpeg') or os.path.expanduser('~/.local/bin/ffmpeg')
if not (say or borrador):
    key = sys.stdin.readline().strip(); VOZ = os.environ['VOZ_ID']
for linea in open(guion, encoding='utf-8'):
    if '|' not in linea or linea.startswith('#'): continue
    k, txt = linea.strip().split('|', 1)
    dst = f'{OUT}/{k}.mp3'
    if os.path.exists(dst): continue
    if borrador:
        subprocess.run([FF, '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', f'{max(1.2, len(txt) / 14):.2f}', '-b:a', '192k', dst], check=True)
    elif say:
        subprocess.run(['say', '-v', os.environ.get('SAY_VOZ', 'Paulina'), '-o', f'{OUT}/{k}.aiff', txt], check=True)
        subprocess.run([FF, '-v', 'error', '-y', '-i', f'{OUT}/{k}.aiff', '-b:a', '192k', dst], check=True); os.remove(f'{OUT}/{k}.aiff')
    else:
        body = json.dumps({'text': txt, 'model_id': 'eleven_multilingual_v2', 'language_code': os.environ.get('VOZ_IDIOMA', 'es'),
                           'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.25, 'use_speaker_boost': True}}).encode()
        req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOZ}?output_format=mp3_44100_192', data=body,
                                     headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
        open(dst, 'wb').write(urllib.request.urlopen(req, timeout=120).read())
    print(k, 'ok', flush=True)
