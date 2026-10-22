"""Per-0.5s scene features for the 1440x900 raw recording (sampled at 360x225)."""
import subprocess, sys, json
import numpy as np
W, H = 360, 225
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"fps=2,scale={W}:{H}", "-f", "rawvideo",
                      "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
res, i = [], 0
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(int)
    res.append({"t": i / 2,
                "top": round(float(f[1:9, 50:300].mean()), 1),           # black letterbox bar?
                "wall": [round(float(v)) for v in f[30:200, 3:55].mean((0, 1))],
                "side": [round(float(v)) for v in f[20:200, 2:60].mean((0, 1))],  # chatgpt sidebar x<62
                "sidestd": round(float(f[20:200, 2:60].std()), 1),
                "main": round(float(f[20:200, 70:290].mean()), 1)})
    i += 1
json.dump(res, open(sys.argv[2], "w"))
