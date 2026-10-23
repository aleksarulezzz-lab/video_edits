"""Slide along every EDL clip and check the audio offset stays constant (catches missed inner cuts)."""
import json, subprocess, sys
import numpy as np
edit_mp4, raw_mp4, edl_path = sys.argv[1:4]
SR, HOP = 16000, 160
def feats(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    n = len(x) // HOP - 4
    idx = np.arange(n)[:, None] * HOP + np.arange(640)[None, :]
    spec = np.abs(np.fft.rfft(x[idx] * np.hanning(640), axis=1))
    edges = np.geomspace(4, 320, 25).astype(int)
    f = np.log(np.stack([spec[:, a:b].sum(1) for a, b in zip(edges[:-1], edges[1:])], 1) + 1e-4)
    return f - f.mean(0), np.log(spec.sum(1) + 1e-4)
FE, EE = feats(edit_mp4); FR, _ = feats(raw_mp4)
def best(e0, off0, span=400, W=120):
    a = int(e0 * 100); x = FE[a:a + W]
    if len(x) < W or EE[a:a + W].mean() < np.percentile(EE, 40): return None
    x = (x - x.mean()) / (x.std() + 1e-6)
    res = []
    for d in range(-span, span + 1, 3):
        o = a + int(round(off0 * 100)) + d
        if o < 0 or o + W > len(FR): continue
        y = FR[o:o + W]; y = (y - y.mean()) / (y.std() + 1e-6)
        res.append(((x * y).mean(), d / 100))
    c, d = max(res)
    return d, c
edl = json.load(open(edl_path))
for i, c in enumerate(edl):
    off = c["in"] - c["out"]
    t = c["out"] + 0.2
    while t + 1.2 < c["out"] + c["dur"]:
        r = best(t, off)
        if r and abs(r[0]) > 0.06 and r[1] > 0.6:
            print(f"clip {i} out {c['out']:.2f}: at {t:.1f} offset drift {r[0]:+.2f}s (corr {r[1]:.2f})")
        t += 0.6
