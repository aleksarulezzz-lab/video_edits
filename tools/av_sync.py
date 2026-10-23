"""Measure audio offset between the final render and the author's cut at several points."""
import subprocess, sys
import numpy as np
def pcm(path, s, d):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s), "-t", str(d), "-i", path, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32)
final, ref = sys.argv[1], sys.argv[2]
for t in [5, 60, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1090]:
    a = pcm(final, t, 4); b = pcm(ref, t - 0.5, 5)
    a = (a - a.mean()) / (a.std() + 1e-6); b = (b - b.mean()) / (b.std() + 1e-6)
    c = np.correlate(b, a, "valid")
    lag = (int(c.argmax()) / 8000) - 0.5
    print(f"t={t:5d}s offset {lag * 1000:+6.0f} ms  peak {c.max() / len(a):.2f}")
