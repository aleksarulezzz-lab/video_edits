"""Classify each second of the source: talking head (letterboxed) vs screencast."""
import subprocess, sys, json
import numpy as np
src = sys.argv[1]
W, H = 768, 480
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
res = []
i = 0
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(int)
    top = f[2:18, 100:600].mean()
    side = f[60:440, 5:125].mean(axis=(0, 1))
    red_logo = ((f[5:40, 0:200, 0] > 200) & (f[5:40, 0:200, 1] < 60)).sum()
    res.append({"t": i / 2, "top": round(top, 1), "side": [round(x) for x in side], "red": int(red_logo)})
    i += 1
json.dump(res, open(sys.argv[2], "w"))
