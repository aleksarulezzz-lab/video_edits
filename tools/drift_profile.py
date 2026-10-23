"""Print best audio offset every 0.1 s inside an edit-time range (wide search)."""
import subprocess, sys
import numpy as np
edit_mp4, raw_mp4 = sys.argv[1:3]
a, b, off0 = map(float, sys.argv[3:6])
SR, HOP = 16000, 160
def feats(path, s, d):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s), "-t", str(d), "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    n = len(x) // HOP - 4
    idx = np.arange(n)[:, None] * HOP + np.arange(640)[None, :]
    spec = np.abs(np.fft.rfft(x[idx] * np.hanning(640), axis=1))
    edges = np.geomspace(4, 320, 25).astype(int)
    f = np.log(np.stack([spec[:, p:q].sum(1) for p, q in zip(edges[:-1], edges[1:])], 1) + 1e-4)
    return f, np.log(spec.sum(1) + 1e-4)
FE, EE = feats(edit_mp4, a, b - a)
FR, _ = feats(raw_mp4, a + off0 - 5, b - a + 10)
W = 50
for i in range(0, len(FE) - W, 10):
    x = FE[i:i + W]; x = (x - x.mean()) / (x.std() + 1e-6)
    best = (-9, 0)
    for o in range(0, len(FR) - W):
        y = FR[o:o + W]; y = (y - y.mean()) / (y.std() + 1e-6)
        c = (x * y).mean()
        if c > best[0]: best = (c, o)
    off = off0 - 5 + best[1] / 100 - i / 100
    print(f"edit {a + i / 100:8.2f}  off {off:8.2f}  corr {best[0]:.2f}  energy {EE[i:i + W].mean():.1f}")
