"""Assemble the edit's speech from the EDL and transcribe it around every splice.

usage: trainer_audio_check.py <trainer dir> [out.wav]
"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

root = sys.argv[1]
SR = 16000
wav = {"main": f"{root}/transcript/audio16k.wav", "kid3": f"{root}/kid_dl/kid_3.wav", "kid4": f"{root}/kid_dl/kid_4.wav"}
data = {}
for k, p in wav.items():
    data[k] = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                           capture_output=True).stdout, np.int16).astype(np.float32) / 32768
clips = json.load(open(f"{root}/src/data/edl.json"))
total = clips[-1]["out"] + clips[-1]["dur"]
out = np.zeros(int(total * SR) + SR, np.float32)
fade = int(0.008 * SR)
for c in clips:
    a = int(c["in"] * SR); n = int(round(c["dur"] * SR))
    seg = data[c["src"]][a:a + n].copy()
    if len(seg) > 2 * fade:
        seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    o = int(round(c["out"] * SR)); out[o:o + len(seg)] += seg
if len(sys.argv) > 2:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", sys.argv[2]], input=out.tobytes())
m = WhisperModel("turbo", device="cpu", compute_type="int8")
cuts = sorted({round(c["out"], 2) for c in clips if c["out"] > 0})
for t in cuts:
    a, b = max(0, t - 2.2), min(total, t + 2.2)
    segs, _ = m.transcribe(out[int(a * SR):int(b * SR)], language="ru", condition_on_previous_text=False)
    print(f"{t:7.2f} | " + " ".join(s.text.strip() for s in segs), flush=True)
