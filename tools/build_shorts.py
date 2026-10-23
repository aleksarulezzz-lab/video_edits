"""Turn shorts spec (segments in the published v3 timeline) into render data per short.

For each short: snap segment edges into pauses, drop leading words where asked, shorten long
pauses inside segments (jump cuts), map every piece onto the raw recording through the long
video's EDL, and lay out subtitle pages for a vertical frame.

usage: build_shorts.py <content-week dir> <v3 speech wav>
writes src/shorts/data/short_<id>.json
"""
import json, re, subprocess, sys
import numpy as np

root, speech = sys.argv[1], sys.argv[2]
FPS = 25
spec = json.load(open(f"{root}/src/shorts/data/spec.json"))
edl = json.load(open(f"{root}/src/data/edl.json"))
pages = json.load(open(f"{root}/src/data/captions.json"))
words = [w for p in pages for ln in p["lines"] for w in ln]

SR = 16000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", speech, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
env = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, "same")[::160]) + 1e-6)  # 10 ms
QUIET = np.percentile(env, 35)

def quietest(a, b):
    i, j = max(0, int(a * 100)), min(len(env), int(b * 100) + 1)
    return (i + int(np.argmin(env[i:j]))) / 100

def pauses(a, b, min_len=0.5):
    """Silent stretches longer than min_len inside [a, b]."""
    i, j = int(a * 100), int(b * 100)
    q = env[i:j] < QUIET + 6
    out, k = [], 0
    while k < len(q):
        if q[k]:
            m = k
            while m < len(q) and q[m]: m += 1
            if (m - k) / 100 >= min_len: out.append((a + k / 100, a + m / 100))
            k = m
        else: k += 1
    return out

def to_raw(a, b):
    """Split a v3 range into raw pieces along the long video's EDL."""
    res = []
    for c in edl:
        lo, hi = max(a, c["out"]), min(b, c["out"] + c["dur"])
        if hi - lo > 0.01:
            res.append((c["in"] + lo - c["out"], hi - lo, lo))
    return res

HL = re.compile(r"^(YouTube|Instagram\*|Telegram|ВКонтакте|Дзен|Дзена|VC\.ru|Reels|рилс|нейросет\w*|систем\w*|\d[\d\s]*|пять|5|сценари\w*|контекст\w*|творчеств\w*)[,.!?:;—]*$", re.I)

for sh in spec["shorts"]:
    pieces = []  # (v3_a, v3_b)
    for seg in sh["segments"]:
        ws = [w for w in words if seg["a"] - 0.05 <= w["s"] < seg["b"]]
        drop = seg.get("drop_words", 0)
        if "start_at" in seg:  # checked by ear (transcribing the cut)
            start = seg["start_at"]
        elif drop:
            start = quietest(ws[drop - 1]["e"] - 0.04, ws[drop]["s"] + 0.03)
        else:
            start = quietest(ws[0]["s"] - 0.25, ws[0]["s"] + 0.02)
        end = quietest(ws[-1]["e"] - 0.02, ws[-1]["e"] + 0.25)
        # jump cuts: shorten long pauses to ~0.36 s
        cur = start
        for p0, p1 in pauses(start, end):
            if p0 - cur > 0.2:
                pieces.append((cur, p0 + 0.18))
                cur = p1 - 0.18
        pieces.append((cur, end))
    # lay out on the short's own timeline
    clips, pmap, t = [], [], 0
    for a, b in pieces:
        n = int(round((b - a) * FPS))
        out0 = t / FPS
        parts = to_raw(a, a + n / FPS)
        # a piece that touches a cut of the long video by a frame or two would flash the next shot
        parts = [x_ for k_, x_ in enumerate(parts) if not (len(parts) > 1 and x_[1] < 0.2 and k_ in (0, len(parts) - 1))]
        for raw_in, d, _ in parts:
            m = int(round(d * FPS))
            clips.append({"out": t / FPS, "in": round(raw_in * FPS) / FPS, "dur": m / FPS})
            t += m
        a = parts[0][2]
        pmap.append([round(a, 3), round(out0, 3), round(a + (t / FPS - out0), 3), round(t / FPS, 3)])
    total = t / FPS

    def M(v):
        for a, o, b, ob in pmap:
            if a - 0.01 <= v <= b + 0.01: return o + (min(max(v, a), b) - a)
        return None

    # subtitle pages: up to 2 lines of ~19 chars, keep phrases together
    kept = []
    for v0, o, v1, _ in pmap:  # piece order = playback order (pieces may be reordered)
        for w in words:
            ov = min(w["e"], v1) - max(w["s"], v0)
            # keep a word if most of it plays in this piece (whisper word edges are loose)
            if ov >= max(0.01, (w["e"] - w["s"]) * 0.5) and w["s"] < v1 - 0.12:
                kept.append({"w": w["w"], "s": round(o + max(w["s"], v0) - v0, 3), "e": round(o + min(w["e"], v1) - v0, 3)})
    # manual caption fixes checked against the audio (spec: caption_replace / caption_drop_tail)
    for src_txt, dst_txt in sh.get("caption_replace", []):
        src_t, dst_t = src_txt.split(), dst_txt.split()
        for k in range(len(kept) - len(src_t) + 1):
            if [w["w"].lower() for w in kept[k:k + len(src_t)]] == [x.lower() for x in src_t]:
                s0, e0 = kept[k]["s"], kept[k + len(src_t) - 1]["e"]
                step = (e0 - s0) / len(dst_t)
                kept[k:k + len(src_t)] = [{"w": d, "s": round(s0 + j * step, 3), "e": round(s0 + (j + 1) * step, 3)} for j, d in enumerate(dst_t)]
                break
    if sh.get("caption_drop_tail"):
        kept = kept[: -sh["caption_drop_tail"]]
    if kept and kept[0]["w"][0].islower():
        kept[0]["w"] = kept[0]["w"][0].upper() + kept[0]["w"][1:]
    MAXL = 16
    width = lambda ws: sum(len(w["w"]) + 1 for w in ws)
    pg, cur = [], []
    def flush():
        if not cur: return
        best, lines = None, [cur[:]]
        if width(cur) > MAXL:
            for k in range(1, len(cur)):
                a_, b_ = width(cur[:k]), width(cur[k:])
                sc = abs(a_ - b_) + 100 * max(0, max(a_, b_) - MAXL - 2) - (5 if cur[k - 1]["w"][-1] in ",.:;?!" else 0)
                if best is None or sc < best: best, lines = sc, [cur[:k], cur[k:]]
        pg.append({"start": cur[0]["s"], "end": cur[-1]["e"],
                   "lines": [[{**w, "hl": bool(HL.match(w["w"]))} for w in ln] for ln in lines]})
        cur.clear()
    for w in kept:
        if cur and (w["s"] - cur[-1]["e"] > 0.7 or width(cur + [w]) > 2 * MAXL or (cur[-1]["w"][-1] in ".?!,;" and width(cur) > 14)):
            flush()
        cur.append(w)
    flush()
    for i_, p in enumerate(pg):
        nxt = pg[i_ + 1]["start"] if i_ + 1 < len(pg) else total
        p["end"] = round(min(nxt - 0.02, p["end"] + 0.5), 3)
    json.dump({"id": sh["id"], "file": sh["file"], "title": sh["title"], "clips": clips, "pmap": pmap,
               "duration": total, "captions": pg}, open(f"{root}/src/shorts/data/short_{sh['id']}.json", "w"), ensure_ascii=False)
    print(sh["id"], f"{total:.1f}s", len(clips), "clips", len(pg), "pages", "| pieces:", " ".join(f"{a:.2f}-{b:.2f}" for a, b in pieces))
