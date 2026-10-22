"""Check each EDL clip by comparing edit vs raw thumbnails at start/middle/end."""
import json, subprocess, sys
import numpy as np
edl, edit_mp4, raw_mp4 = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]
def thumb(path, t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(t, 0):.3f}", "-i", path, "-frames:v", "1",
                          "-vf", "scale=96:60,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).astype(float)
bad = 0
for i, c in enumerate(edl):
    d = c["edit_end"] - c["edit_start"]
    pts = [c["edit_start"] + min(0.15, d / 4), c["edit_start"] + d / 2, c["edit_end"] - min(0.15, d / 4)]
    diffs = [round(float(np.abs(thumb(edit_mp4, t) - thumb(raw_mp4, t + c["off"])).mean()), 1) for t in pts]
    flag = "  <-- CHECK" if max(diffs) > 12 else ""
    bad += bool(flag)
    print(i, f"{c['edit_start']:.2f}-{c['edit_end']:.2f}", diffs, flag)
print("flagged", bad)
