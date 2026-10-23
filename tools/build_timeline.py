"""Apply ops.json (cuts, raw extensions, inserted cards) to the base EDL.

Writes, all in the final output timeline:
  edl.json      footage clips {out, in, dur}
  inserts.json  inserted full-screen cards {out, dur, kind, props}
  timemap.json  piecewise map between the author's-cut timeline ("edit") and output
  captions.json subtitle pages with per-word timings
and transcript_final.srt/.txt next to the transcript.

usage: build_timeline.py <content-week dir> <edit audio for snapping cuts>
"""
import json, re, subprocess, sys
import numpy as np

root, edit_audio = sys.argv[1], sys.argv[2]
D = f"{root}/src/data"
FPS = 25
base = json.load(open(f"{D}/edl_base.json"))
ops = json.load(open(f"{D}/ops.json"))

# ---- snap cut edges to the quietest 10 ms within ±80 ms of the requested time ----
SR = 16000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", edit_audio, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
env = np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, "same")[::160])
def snap(t, before, after):
    i = int(round(t * 100))
    lo, hi = max(0, i - before), min(len(env), i + after + 1)
    return (lo + int(np.argmin(env[lo:hi]))) / 100

# a cut may start a little early and end a little late, never inside the neighbouring words
for ins in ops.get("inserts", []):
    if not ins.get("nosnap"):
        ins["at"] = snap(ins["at"], 30, 5)
cuts = sorted(((c["a"], c["b"]) if c.get("nosnap") else (snap(c["a"], 12, 3), snap(c["b"], 3, 12)) for c in ops["cuts"]))

# ---- pieces in edit time: footage ranges minus cuts, plus zero-length extras ----
pieces = []  # {e0, e1, raw, dur, kind}
for c in base:
    segs = [(c["out"], c["out"] + c["dur"])]
    for a, b in cuts:
        nxt = []
        for s, e in segs:
            if b <= s or a >= e:
                nxt.append((s, e))
            else:
                if a > s: nxt.append((s, a))
                if b < e: nxt.append((b, e))
        segs = nxt
    off = c["in"] - c["out"]
    for s, e in segs:
        if e - s > 0.02:
            pieces.append({"e0": s, "e1": e, "raw": s + off, "dur": e - s, "kind": "footage"})
# split footage at every point where something gets inserted
points = [x_["at"] for x_ in ops.get("raw_extends", [])] + [i_["at"] for i_ in ops.get("inserts", [])]
for at in points:
    nxt = []
    for p in pieces:
        if p["e0"] < at < p["e1"]:
            k = at - p["e0"]
            nxt.append({**p, "e1": at, "dur": k})
            nxt.append({**p, "e0": at, "raw": p["raw"] + k, "dur": p["dur"] - k})
        else:
            nxt.append(p)
    pieces = nxt
for x_ in ops.get("raw_extends", []):
    pieces.append({"e0": x_["at"], "e1": x_["at"], "raw": x_["raw_from"], "dur": x_["raw_to"] - x_["raw_from"], "kind": "footage", "order": 0})
for ins in ops.get("inserts", []):
    pieces.append({"e0": ins["at"], "e1": ins["at"], "raw": None, "dur": ins["dur"], "kind": "card",
                   "card": {k: v for k, v in ins.items() if k not in ("at", "dur")}, "order": 1})
# at one edit time: inserted pieces (zero edit length) go before the footage that starts there
pieces.sort(key=lambda p: (p["e0"], 0 if p["e1"] == p["e0"] else 1, p.get("order", 0)))

# ---- lay pieces on the output timeline (frame-quantised) ----
cursor = 0  # frames
clips, inserts, tmap = [], [], []
for p in pieces:
    n = int(round(p["dur"] * FPS))
    if n <= 0:
        continue
    out = cursor / FPS
    if p["kind"] == "footage":
        clips.append({"out": out, "in": round(p["raw"] * FPS) / FPS, "dur": n / FPS})
    else:
        inserts.append({"out": out, "dur": n / FPS, **p["card"]})
    tmap.append([round(p["e0"], 3), round(out, 3), round(p["e1"], 3), round((cursor + n) / FPS, 3)])
    cursor += n
total = cursor / FPS
json.dump(clips, open(f"{D}/edl.json", "w"), indent=1)
json.dump(inserts, open(f"{D}/inserts.json", "w"), indent=1, ensure_ascii=False)
json.dump(tmap, open(f"{D}/timemap.json", "w"))

def T(t):
    for e0, o0, e1, o1 in tmap:
        if e1 > e0 and e0 <= t < e1:
            return o0 + (t - e0)
    # inside a cut: map to where the next kept piece starts
    later = [o0 for e0, o0, e1, o1 in tmap if e0 >= t]
    return min(later) if later else total

# ---- captions: drop words that fall in cuts, fix capitalisation after cuts ----
words = [w for s in json.load(open(f"{root}/transcript/transcript_fixed.json")) for w in s["words"]]
kept = []
for w in words:
    mid = (w["start"] + w["end"]) / 2
    if any(a <= mid < b for a, b in cuts):
        continue
    kept.append(dict(w))
CAP_AFTER_CUT = {"нейросеть": "Нейросеть", "я": "Я", "вы": "Вы", "есть": "Есть"}
for a, b in cuts:
    nxt = next((w for w in kept if w["start"] >= b - 0.12), None)
    prev = max((w for w in kept if w["end"] <= a + 0.12), key=lambda w: w["end"], default=None)
    if nxt and nxt["word"].lower().strip(",.") in CAP_AFTER_CUT and prev and prev["word"][-1] in ".,?!":
        nxt["word"] = CAP_AFTER_CUT[nxt["word"].lower().strip(",.")] + nxt["word"][len(nxt["word"].rstrip(",.")):]
        if prev["word"][-1] == ",":
            prev["word"] = prev["word"][:-1] + "."
for w in kept:
    w["start"], w["end"] = round(T(w["start"]), 3), round(T(w["end"]), 3)

HL = re.compile(r"^(YouTube|Instagram\*|Telegram|ВКонтакте|Дзен|Дзена|VC\.ru|Reels|Claude|ChatGPT|нейросет\w*|систем\w*|\d[\d\s]*|пять|5|сценари\w*)[,.!?:;]*$", re.I)
MAX_LINE, MAX_GAP = 32, 1.2
pages, cur = [], []
width = lambda ws: sum(len(w["word"]) + 1 for w in ws)
def flush():
    if not cur: return
    best, lines = None, [cur[:]]
    if width(cur) > MAX_LINE:
        for k in range(1, len(cur)):
            a, b = width(cur[:k]), width(cur[k:])
            score = abs(a - b) - (6 if cur[k - 1]["word"][-1] in ",.:;?!" else 0) + 100 * max(0, max(a, b) - MAX_LINE - 2)
            if best is None or score < best:
                best, lines = score, [cur[:k], cur[k:]]
    pages.append({"start": cur[0]["start"], "end": cur[-1]["end"],
                  "lines": [[{"w": w["word"], "hl": bool(HL.match(w["word"])), "s": w["start"], "e": w["end"]} for w in ln] for ln in lines]})
    cur.clear()
for w in kept:
    if cur and (w["start"] - cur[-1]["end"] > MAX_GAP or width(cur + [w]) > 2 * MAX_LINE
                or (cur[-1]["word"][-1] in ".?!" and width(cur) > 18)):
        flush()
    cur.append(w)
flush()
for i, p in enumerate(pages):
    nxt = pages[i + 1]["start"] if i + 1 < len(pages) else p["end"] + 0.6
    p["end"] = round(min(nxt - 0.04, p["end"] + 0.6), 3)
json.dump(pages, open(f"{D}/captions.json", "w"), ensure_ascii=False)

def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
with open(f"{root}/transcript/subtitles_on_screen.srt", "w") as f:
    for i, p in enumerate(pages, 1):
        f.write(f"{i}\n{ts(p['start'])} --> {ts(p['end'])}\n" + "\n".join(" ".join(w["w"] for w in ln) for ln in p["lines"]) + "\n\n")
with open(f"{root}/transcript/transcript_final.txt", "w") as f:
    for p in pages:
        m, s = divmod(p["start"], 60)
        f.write(f"[{int(m):02d}:{s:04.1f}] " + " ".join(w["w"] for ln in p["lines"] for w in ln) + "\n")
print(f"{len(clips)} clips, {len(inserts)} cards, total {total:.2f}s; cuts {cuts}")
