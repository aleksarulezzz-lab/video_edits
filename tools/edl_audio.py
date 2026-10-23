"""Assemble the speech track straight from edl.json + inserts.json (fast check without rendering)."""
import json, subprocess, sys
import numpy as np
root, src, out = sys.argv[1:4]
SR = 16000
edl = json.load(open(f"{root}/src/data/edl.json")); ins = json.load(open(f"{root}/src/data/inserts.json"))
total = max([c["out"] + c["dur"] for c in edl] + [i["out"] + i["dur"] for i in ins])
y = np.zeros(int(total * SR) + SR, np.float32)
full = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
for c in edl:
    a = int(round(c["in"] * SR)); n = int(round(c["dur"] * SR)); o = int(round(c["out"] * SR))
    y[o:o + n] = full[a:a + n]
import wave
with wave.open(out, "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
print("ok", round(total, 2))
