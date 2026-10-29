"""Música original para el video, compuesta por código y mezclada en SoundCraft (sin licencias).

Uso: python componer.py musica.json  →  musica.sc + fx/*.wav junto al json
     soundcraft-cli script musica.sc --save musica.scraft --bounce mezcla.wav   (reporta LUFS y true peak)

musica.json (lo escribe linea.py, o a mano): {"total": s, "bpm": 120, "logo": s, "cierre": s, "golpes": [s, ...]}
Estructura: intro aireada (pad + notas sueltas) hasta el logo → cuerpo a medio tiempo (bombo, clap, bajo, arpegio)
→ se vacía y sube antes del cierre → impacto en el cierre. Efectos SOLO en logo, golpes y cierre (3–5 momentos):
un whoosh en cada corte cansa.
Progresión por defecto Re mayor aireado (Dmaj7 Bm7 Gmaj7 A); cámbiala en PROG/ROOT.
"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

CFG = os.path.abspath(sys.argv[1]); HERE = os.path.dirname(CFG); M = json.load(open(CFG))
BPM, SR, TPQ = M.get('bpm', 120), 48000, 960          # SoundCraft: 960 ticks por negra (con 480 sale al doble)
BEAT = 60 / BPM
b_of = lambda s: s / BEAT
END = int(np.ceil(b_of(M['total']))); LOGO = b_of(M.get('logo', 0)); CIERRE = b_of(M.get('cierre', M['total'] - 7))
GOLPES = [b_of(g) for g in M.get('golpes', [])]
SAMPLES = int((END + 6) * BEAT * SR)
PROG = [[62, 66, 69, 73], [59, 62, 66, 69], [55, 59, 62, 66], [57, 61, 64, 69]]
ROOT = [38, 35, 31, 33]
lines = []
def cmd(id_, **p): lines.append(id_ + " " + json.dumps(p))

cmd("event.tempo", bpm=BPM)
cmd("track.new", kind="instrument", name="Bateria", instrument="drum_synth")
cmd("track.new", kind="instrument", name="Bajo", instrument="subtractive_synth")
cmd("track.new", kind="instrument", name="Pluck", instrument="subtractive_synth")
cmd("track.new", kind="instrument", name="Pad", instrument="subtractive_synth")
cmd("track.new", kind="audio", name="FX", format="stereo")
DR, BA, AR, PA, FX = 1, 2, 3, 4, 5
for t in (DR, BA, AR, PA): cmd("midi.new_clip", track=t, start=0, length=SAMPLES)
CL = {DR: 6, BA: 7, AR: 8, PA: 9}     # los ids son un contador global: 5 pistas → los clips son 6–9

cmd("mix.instrument", track=DR, plugin="drum_synth", params={"level": -5, "kick_decay": 520, "kick_tune": -4, "snare_snappy": 40, "snare_decay": 140, "hat_decay": 35, "open_hat_decay": 260})
cmd("mix.instrument", track=BA, plugin="subtractive_synth", params={"osc1_wave": 0, "osc2_wave": 0, "osc2_semitones": -12, "osc_mix": 50, "cutoff": 380, "resonance": 10, "filter_env_amount": 30, "amp_attack": 4, "amp_decay": 220, "amp_sustain": 50, "amp_release": 120, "filter_decay": 200, "level": -6})
cmd("mix.instrument", track=AR, plugin="subtractive_synth", params={"osc1_wave": 2, "osc2_wave": 0, "osc2_semitones": 12, "osc_mix": 30, "cutoff": 3200, "resonance": 18, "filter_env_amount": 60, "amp_attack": 1, "amp_decay": 260, "amp_sustain": 0, "amp_release": 300, "filter_decay": 160, "level": -13})
cmd("mix.instrument", track=PA, plugin="subtractive_synth", params={"osc1_wave": 0, "osc2_wave": 2, "osc2_detune": 10, "osc_mix": 45, "cutoff": 1100, "resonance": 8, "filter_env_amount": 8, "amp_attack": 900, "amp_decay": 900, "amp_sustain": 85, "amp_release": 1600, "level": -14})

def note(track, pitch, beat, length_beats=0.25, vel=100):
    cmd("midi.note_add", clip=CL[track], pitch=int(pitch), start_ticks=int(round(beat * TPQ)), length_ticks=max(1, int(round(length_beats * TPQ))), velocity=int(max(1, min(127, vel))))
KICK, SNARE, CLAP, CH, CRASH = 36, 38, 39, 42, 49
chord_at = lambda b: int(b // 4) % 4
SUBIDA = max(LOGO, CIERRE - 8)          # los 8 beats antes del cierre se vacían y suben

for b in range(END):
    bb = b % 4
    if b < LOGO:
        if b >= LOGO - 8: note(DR, CH, b + 0.5, 0.05, 40 + (b - LOGO + 8) * 4)
    elif b < SUBIDA:
        if bb in (0, 2) or (bb == 3 and b % 8 == 7): note(DR, KICK, b + (0.5 if bb == 3 else 0), 0.4, 112 if bb == 0 else 96)
        if bb == 2: note(DR, CLAP, b, 0.2, 78)
        for s_ in range(4): note(DR, CH, b + s_ / 4, 0.05, 70 if s_ == 2 else 38)
    elif b < CIERRE:
        if b >= CIERRE - 4:
            for s_ in range(4): note(DR, SNARE, b + s_ / 4, 0.08, 40 + (b - CIERRE + 4) * 18 + s_ * 4)
    elif b < CIERRE + 8 and bb == 0: note(DR, KICK, b, 0.4, 80)
for g in GOLPES + [LOGO]: note(DR, CRASH, g, 2, 80)
note(DR, KICK, CIERRE, 0.6, 127); note(DR, CRASH, CIERRE, 4, 112)

for b in range(int(LOGO), int(SUBIDA)):
    r = ROOT[chord_at(b)]
    note(BA, r, b, 0.45, 104); note(BA, r, b + 0.5, 0.3, 70)
    if b % 4 == 3: note(BA, r + 12, b + 0.75, 0.2, 76)
note(BA, 38, CIERRE, 6, 110)

for b in range(END):
    ch = PROG[chord_at(b)]; up = [ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[3] + 12]
    if b < LOGO:
        if b % 2 == 0 and b >= 2: note(AR, up[(b // 2) % 4], b, 1.5, 70)
    elif b < SUBIDA:
        for s_ in range(2): note(AR, up[(b * 2 + s_) % 4], b + s_ / 2, 0.4, 82 if s_ == 0 else 64)
    elif b < CIERRE:
        note(AR, up[b % 4] + (12 if b >= CIERRE - 4 else 0), b, 0.9, 60 + (b - SUBIDA) * 3)
for i, p in enumerate([74, 78, 81, 85, 86, 85, 81, 78]): note(AR, p, CIERRE + 0.5 + i / 2, 0.45, 96 - i * 8)

for bar in range(0, END // 4 + 1):
    b = bar * 4
    if b >= CIERRE: break
    for p in PROG[chord_at(b)]: note(PA, p - 12, b, 3.95, 80)
for p in (50, 57, 62, 66, 69, 73): note(PA, p, CIERRE, 10, 100)

cmd("mix.insert", track=PA, slot=0, plugin="plate_reverb", params={"mix": 40, "decay": 4.0})
cmd("mix.insert", track=AR, slot=0, plugin="plate_reverb", params={"mix": 30, "decay": 2.4})
cmd("mix.insert", track=DR, slot=0, plugin="compressor", params={"threshold": -18, "ratio": 3, "attack": 10, "release": 140, "makeup": 3})
for t, db in ((DR, -6), (BA, -6), (PA, -6), (AR, -7), (FX, -5)): cmd("mix.volume", tracks=[t], db=db)

# FX sintetizados con numpy (riser antes del logo y del cierre, impacto en logo/cierre, sub suave en los golpes)
rng = np.random.default_rng(7)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, min(hi, 23000)], 'band', fs=SR, output='sos'), x)
def riser(d):
    n = int(SR * d); t = np.arange(n) / SR; noise = rng.standard_normal(n); out = np.zeros(n); seg = 2400
    for i in range(0, n, seg):
        f = 300 + 7000 * (i / n) ** 2; out[i:i + seg] = bp(noise[i:i + seg], f * 0.7, f * 1.4)
    sw = np.sin(2 * np.pi * np.cumsum(180 + 1200 * (t / d) ** 2) / SR) * 0.15
    return (out * 0.6 + sw) * (t / d) ** 2
def impact(d=4.0, f0=34):
    n = int(SR * d); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(f0 + 70 * np.exp(-t * 7)) / SR) * np.exp(-t * 1.1)
    hit = sosfilt(butter(2, 260, 'low', fs=SR, output='sos'), rng.standard_normal(n)) * np.exp(-t * 20)
    ir = rng.standard_normal(SR * 3) * np.exp(-np.linspace(0, 7, SR * 3))
    x = np.tanh((sub + hit) * 1.3); w = fftconvolve(x, ir)[:n]; w /= np.max(np.abs(w)) + 1e-9
    return x * 0.7 + w * 0.3
os.makedirs(os.path.join(HERE, 'fx'), exist_ok=True)
def save(name, sig, gain=0.8):
    s = sig / (np.max(np.abs(sig)) + 1e-9) * gain
    path = os.path.join(HERE, 'fx', name); wavfile.write(path, SR, (np.stack([s, s], 1) * 32767).astype(np.int16)); return path
sub = save("sub.wav", impact(2.2, 42), 0.45)
ri = save("riser.wav", riser(4 * BEAT), 0.7)
imp = save("impacto.wav", impact(), 0.9)
at = lambda b: int(max(0, b) * BEAT * SR)
for g in GOLPES: cmd("file.import_audio", path=sub, track=FX, at=at(g), new_tracks=False)
for momento in (LOGO, CIERRE):
    if momento >= 4: cmd("file.import_audio", path=ri, track=FX, at=at(momento - 4), new_tracks=False)
    cmd("file.import_audio", path=imp, track=FX, at=at(momento), new_tracks=False)
open(os.path.join(HERE, "musica.sc"), "w").write("\n".join(lines) + "\n")
print(len(lines), "comandos ·", round(SAMPLES / SR, 2), "s ·", BPM, "BPM")
