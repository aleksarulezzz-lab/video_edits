"""List silent stretches (≥ min ms) in an audio range — for placing cuts and inserted cards."""
import subprocess, sys
import numpy as np
path, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
min_ms = int(sys.argv[4]) if len(sys.argv) > 4 else 80
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-to", str(b), "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
e = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, "same")[::160]) + 1e-6)  # 10 ms frames
full = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-6)
thr = full - 22
quiet = e < thr
i, out = 0, []
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if (j - i) * 10 >= min_ms: out.append((a + i / 100, a + j / 100))
        i = j
    else: i += 1
print(" ".join(f"[{s:.2f}-{t:.2f}]" for s, t in out))
