"""Replay the author's own cut on the full-resolution raw recording.

The edited cut (low-res) and the raw recording are transcribed separately; word
sequences are matched to find, for every stretch of the cut, the constant offset
into the raw file. Offsets are refined with audio correlation and the cut points
between stretches are checked against video frames.

usage: align_text.py edit.json raw.json edit.mp4 raw.mp4 out_edl.json
"""
import difflib, json, re, subprocess, sys
import numpy as np

edit_json, raw_json, edit_mp4, raw_mp4, out_path = sys.argv[1:6]

def words(path):
    out = []
    for s in json.load(open(path)):
        for w in s["words"]:
            n = re.sub(r"[^\w]", "", w["word"].lower().replace("ё", "е"))
            if n:
                out.append((n, w["start"], w["end"]))
    return out

E, R = words(edit_json), words(raw_json)
sm = difflib.SequenceMatcher(None, [w[0] for w in E], [w[0] for w in R], autojunk=False)
pairs = []
for blk in sm.get_matching_blocks():
    if blk.size >= 3:
        for k in range(blk.size):
            e, r = E[blk.a + k], R[blk.b + k]
            pairs.append((e[1], e[2], r[1] - e[1]))

# Group consecutive matched words with a stable offset into runs.
runs = []
for es, ee, off in pairs:
    if runs and abs(off - runs[-1]["offs"][-1]) < 0.35 and es - runs[-1]["end"] < 25:
        r = runs[-1]
        r["end"] = ee
        r["offs"].append(off)
    else:
        runs.append({"start": es, "end": ee, "offs": [off]})
runs = [r for r in runs if len(r["offs"]) >= 3]
for r in runs:
    r["off"] = float(np.median(r["offs"]))

# ---------- audio refinement ----------
SR, HOP = 16000, 160
def feats(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    n = len(x) // HOP - 4
    idx = np.arange(n)[:, None] * HOP + np.arange(640)[None, :]
    spec = np.abs(np.fft.rfft(x[idx] * np.hanning(640), axis=1))
    edges = np.geomspace(4, 320, 25).astype(int)
    f = np.log(np.stack([spec[:, a:b].sum(1) for a, b in zip(edges[:-1], edges[1:])], 1) + 1e-4)
    return f - f.mean(0)

FE, FR = feats(edit_mp4), feats(raw_mp4)

def corr(e0, e1, off):
    a, b = int(e0 * 100), int(e1 * 100)
    o = int(round(off * 100))
    if a + o < 0 or b + o > len(FR) or b > len(FE) or b - a < 20:
        return -1
    x, y = FE[a:b], FR[a + o:b + o]
    x = (x - x.mean()) / (x.std() + 1e-6); y = (y - y.mean()) / (y.std() + 1e-6)
    return float((x * y).mean())

for r in runs:
    mid = (r["start"] + r["end"]) / 2
    e0, e1 = max(r["start"], mid - 4), min(r["end"], mid + 4)
    best = max(((corr(e0, e1, r["off"] + d / 100), r["off"] + d / 100) for d in range(-60, 61)), key=lambda z: z[0])
    r["off"], r["corr"] = best[1], best[0]

# merge neighbours that ended up with the same offset
merged = []
for r in runs:
    if merged and abs(r["off"] - merged[-1]["off"]) < 0.03:
        merged[-1]["end"] = r["end"]
    else:
        merged.append(dict(r))
runs = merged

# ---------- frame check for cut points ----------
def thumb(path, t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(t, 0):.3f}", "-i", path, "-frames:v", "1",
                          "-vf", "scale=96:60,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).astype(float) if len(raw) == 96 * 60 else None

def frame_diff(te, off):
    a, b = thumb(edit_mp4, te), thumb(raw_mp4, te + off)
    if a is None or b is None:
        return 255
    return float(np.abs(a - b).mean())

edit_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", edit_mp4],
                                capture_output=True, text=True).stdout)
clips = []
for i, r in enumerate(runs):
    start = 0.0 if i == 0 else clips[-1]["edit_end"]
    if i + 1 < len(runs):
        nxt = runs[i + 1]
        lo, hi = r["end"], nxt["start"]
        # find the cut between lo and hi: last time frames still match this run's offset
        cut = (lo + hi) / 2
        if hi - lo > 0.3:
            ts = np.linspace(lo, hi, max(3, int((hi - lo) / 0.2)))
            scores = [(frame_diff(t, r["off"]) - frame_diff(t, nxt["off"])) for t in ts]
            # first point where the next run's offset matches better
            for t, s in zip(ts, scores):
                if s > 3:
                    cut = t
                    break
            else:
                cut = hi
        end = cut
    else:
        end = edit_dur
    clips.append({"edit_start": start, "edit_end": end, "raw_start": start + r["off"], "off": r["off"], "corr": round(r.get("corr", 0), 3)})

json.dump(clips, open(out_path, "w"), indent=1)
for c in clips:
    print(f"edit {c['edit_start']:8.2f}-{c['edit_end']:8.2f}  raw {c['raw_start']:8.2f}  off {c['off']:+8.2f}  corr {c['corr']}")
print(f"{len(clips)} clips, {len(pairs)} matched words of {len(E)}", file=sys.stderr)
