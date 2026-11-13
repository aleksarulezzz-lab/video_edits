"""Lighten the author's shadow on the wall behind her (main recording), keeping her untouched.

Robust Video Matting gives her matte; on the wall (low-saturation background) the local brightness
is pulled up towards the clean wall level, so the shadow beside her fades. Colourful things
(poster, sofa) are left alone.

usage: ad_lift.py <dir> <src file in src/> <start> <end> <out.mp4> [preview.jpg]
"""
import subprocess, sys
import numpy as np, onnxruntime as ort
import cv2

root, srcf, a, b, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
preview = sys.argv[6] if len(sys.argv) > 6 else None
W, H = 1920, 1080
rd = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-i", f"{root}/src/{srcf}", "-t", f"{b - a:.3f}",
                       "-vf", "fps=30", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
wr = None if preview else subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "30",
                       "-i", "-", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
sess = ort.InferenceSession(f"{root}/../trainer/models/rvm.onnx", providers=["CPUExecutionProvider"])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ratio = np.array([0.3], np.float32)
target = None
n = 0
while True:
    buf = rd.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    f = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    x = (f.astype(np.float32) / 255).transpose(2, 0, 1)[None]
    reps = 6 if n == 0 else 1  # settle the recurrent state on the first frame
    for _ in range(reps):
        fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
    al = pha[0, 0]
    al = cv2.dilate((al > 0.05).astype(np.float32), np.ones((15, 15), np.uint8))  # keep a margin around hair
    al = cv2.GaussianBlur(al, (0, 0), 12)
    fl = f.astype(np.float32)
    hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
    wall = np.clip(1 - (hsv[..., 1].astype(np.float32) - 25) / 30, 0, 1)  # grey wall = low saturation
    L = fl.mean(axis=2)
    bg = (1 - al) * wall
    s = 8
    Ls = cv2.resize(L * bg, (W // s, H // s), interpolation=cv2.INTER_AREA)
    Bs = cv2.resize(bg, (W // s, H // s), interpolation=cv2.INTER_AREA)
    Lb = cv2.GaussianBlur(Ls, (0, 0), 10) / (cv2.GaussianBlur(Bs, (0, 0), 10) + 1e-3)
    Lb = cv2.resize(Lb, (W, H), interpolation=cv2.INTER_LINEAR)
    if target is None:
        target = float(np.percentile(L[bg > 0.8], 85))
    gain = np.clip(target / np.maximum(Lb, 1), 1.0, 1.55)
    k = 1 + (gain - 1) * (1 - al) * wall
    o = np.clip(fl * k[..., None], 0, 255).astype(np.uint8)
    if preview:
        cv2.imwrite(preview, cv2.cvtColor(np.concatenate([f, o], 1)[::2, ::2], cv2.COLOR_RGB2BGR))
        break
    wr.stdin.write(o.tobytes())
    n += 1
if wr:
    wr.stdin.close(); wr.wait()
print("frames", n, "target", target)
