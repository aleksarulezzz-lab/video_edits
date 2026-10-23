"""Find voiced stretches in the cut that no transcribed word covers (truncated words, stray syllables)."""
import json, subprocess, sys
import numpy as np
audio, words_json = sys.argv[1], sys.argv[2]
SR = 16000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
hop = 160
e = np.sqrt(np.convolve(x ** 2, np.ones(400) / 400, "same")[::hop])
db = 20 * np.log10(e + 1e-6)
floor = np.percentile(db, 20)
voiced = db > floor + 18
W = [w for s in json.load(open(words_json)) for w in s["words"]]
covered = np.zeros_like(voiced)
for w in W:
    covered[int(w["start"] * 100):int(w["end"] * 100) + 1] = True
out = voiced & ~covered
# group runs ≥ 120 ms
runs, i = [], 0
while i < len(out):
    if out[i]:
        j = i
        while j < len(out) and out[j]: j += 1
        if j - i >= 12: runs.append((i / 100, j / 100))
        i = j
    else: i += 1
for a, b in runs:
    prev = max((w for w in W if w["end"] <= a + 0.05), key=lambda w: w["end"], default=None)
    nxt = min((w for w in W if w["start"] >= b - 0.05), key=lambda w: w["start"], default=None)
    print(f"{a:8.2f}-{b:8.2f} ({b - a:.2f}s)  after «{prev['word'] if prev else ''}» before «{nxt['word'] if nxt else ''}»")
