"""Cut the author out of the source with Robust Video Matting, for words placed behind her.

usage: ad_matte.py <dir> <name> <source file in src/> <src_start> <src_end>
writes public/fg/<name>/NNNN.webp (RGBA, source crop 1376x774 at 25 fps) and a preview jpg.
"""
import os, subprocess, sys
import numpy as np
import onnxruntime as ort

def blur(a, r=2):
    """feather the matte edge by ~2-3 px (two box blurs) so hair does not flicker"""
    for _ in range(2):
        for ax in (0, 1):
            c = np.cumsum(np.pad(a, [(r + 1, r)] * 2 if False else ([(r + 1, r), (0, 0)] if ax == 0 else [(0, 0), (r + 1, r)]), mode="edge"), axis=ax)
            a = ((c[2 * r + 1:] - c[:-2 * r - 1]) if ax == 0 else (c[:, 2 * r + 1:] - c[:, :-2 * r - 1])) / (2 * r + 1)
    return a

root, name, srcf, a, b = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
X, Y, W, H = 0, 0, 1920, 1080  # full frame
src = f"{root}/src/{srcf}"
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-i", src, "-t", f"{b - a:.3f}",
                      "-vf", f"crop={W}:{H}:{X}:{Y},fps=30", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
sess = ort.InferenceSession(f"{root}/../trainer/models/rvm.onnx", providers=["CPUExecutionProvider"])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ratio = np.array([0.3], np.float32)
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
    al = blur(al)
    rgba = np.dstack([f, (al * 255).astype(np.uint8)])
    p = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-i", "-",
                        "-c:v", "libwebp", "-quality", "90", "-lossless", "0", f"{out_dir}/{i:04d}.webp"], input=rgba.tobytes())
mid = len(frames) // 2
al = alphas[mid][..., None]
prev = (frames[mid] * al + np.array([200, 255, 0]) * (1 - al)).astype(np.uint8)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-i", "-", f"{root}/out/matte_{name}.jpg"], input=prev.tobytes())
print(name, len(frames), "frames")
