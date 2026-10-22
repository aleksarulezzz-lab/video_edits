"""Find frame-exact start/end of ChatGPT screens near rough edges (sidebar colour test)."""
import subprocess, sys, json
import numpy as np
src = sys.argv[1]
rough = json.loads(sys.argv[2])  # [[start,end],...]
W, H = 360, 225
def frames(s, e):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s), "-to", str(e), "-i", src, "-vf", f"scale={W}:{H}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(int)
def is_gpt(f):
    side = f[20:200, 2:60].mean((0, 1)); top = f[1:9, 50:300].mean()
    return top > 200 and all(abs(a - b) < 12 for a, b in zip(side, [205, 205, 201]))
out = []
for s, e in rough:
    fs = frames(s - 2, s + 2); first = next(i for i, f in enumerate(fs) if is_gpt(f))
    fe = frames(e - 2, e + 2); last = max(i for i, f in enumerate(fe) if is_gpt(f))
    out.append([round(s - 2 + first / 25, 3), round(e - 2 + (last + 1) / 25, 3)])
print(json.dumps(out))
