"""For edit range [a,b], find the best-matching raw time for each edit frame (5 fps) in raw window [r0,r1]."""
import subprocess, sys
import numpy as np
edit_mp4, raw_mp4 = sys.argv[1], sys.argv[2]
a, b, r0, r1 = map(float, sys.argv[3:7])
def grab(path, s, e, fps):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s), "-to", str(e), "-i", path, "-vf",
                          f"fps={fps},scale=96:60,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, 60 * 96).astype(np.float32)
E = grab(edit_mp4, a, b, 5)
R = grab(raw_mp4, r0, r1, 25)
for i, f in enumerate(E):
    d = np.abs(R - f).mean(1)
    j = int(d.argmin())
    print(f"edit {a + i / 5:8.2f} -> raw {r0 + j / 25:8.2f} (off {r0 + j / 25 - a - i / 5:+7.2f}) diff {d[j]:.1f}")
