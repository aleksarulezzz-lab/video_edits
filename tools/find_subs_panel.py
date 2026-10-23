"""Find raw-time ranges where the YouTube left nav with the subscriptions list is on screen."""
import subprocess, sys, json
import numpy as np
src = sys.argv[1]
ranges = json.loads(sys.argv[2])
X, Y, W, H = 0, 296, 228, 372
def frames(s, e, fps):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s), "-to", str(e), "-i", src, "-vf",
                          f"fps={fps},crop={W}:{H}:{X}:{Y},scale=57:93,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 93, 57).astype(float)
ref = frames(393.2, 393.3, 25)[0]
for s, e in ranges:
    fs = frames(s, e, 25)
    on = [np.abs(f - ref).mean() < 25 for f in fs]
    # contiguous runs
    i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            print(f"{s + i / 25:.2f}-{s + j / 25:.2f}")
            i = j
        else: i += 1
