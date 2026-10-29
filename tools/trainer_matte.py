"""Cut the author out of the source with Robust Video Matting, for words placed behind her.

usage: trainer_matte.py <trainer dir> <name> <src_start> <src_end>
writes public/fg/<name>/NNNN.webp (RGBA, source crop 1376x774 at 25 fps) and a preview jpg.
"""
import os, subprocess, sys
import numpy as np
import onnxruntime as ort

root, name, a, b = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
X, Y, W, H = 16, 4, 1376, 774  # same crop as the footage layer
src = f"{root}/src_dl/screencasts.mp4"
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-i", src, "-t", f"{b - a:.3f}",
                      "-vf", f"crop={W}:{H}:{X}:{Y},fps=25", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
sess = ort.InferenceSession(f"{root}/models/rvm.onnx", providers=["CPUExecutionProvider"])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ratio = np.array([0.375], np.float32)
out_dir = f"{root}/public/fg/{name}"
os.makedirs(out_dir, exist_ok=True)
# warm the recurrent state on the first frames so the matte is stable from frame 0
for f in list(frames[:10]) + list(frames):
    pass
alphas = []
for k, f in enumerate(list(frames[:12][::-1]) + list(frames)):
    x = (f.astype(np.float32) / 255).transpose(2, 0, 1)[None]
    fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
    if k >= 12:
        alphas.append(pha[0, 0])
for i, (f, al) in enumerate(zip(frames, alphas)):
    al = np.clip((al - 0.05) / 0.9, 0, 1)
    rgba = np.dstack([f, (al * 255).astype(np.uint8)])
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-i", "-",
                        "-c:v", "libwebp", "-quality", "90", "-lossless", "0", f"{out_dir}/{i:04d}.webp"], input=rgba.tobytes())
mid = len(frames) // 2
al = alphas[mid][..., None]
prev = (frames[mid] * al + np.array([200, 255, 0]) * (1 - al)).astype(np.uint8)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-i", "-", f"{root}/out/matte_{name}.jpg"], input=prev.tobytes())
print(name, len(frames), "frames")
