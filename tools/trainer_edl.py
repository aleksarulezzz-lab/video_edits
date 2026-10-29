"""Build the trainer video timeline from plan/edl_spec.json.

Each spec item is a range of one source (main recording or a kid answer clip). Edges are snapped
to the quietest 10 ms near the requested time (never into the neighbouring word), long pauses inside
an item are shortened to ~0.3 s, and everything is laid out on a 25 fps timeline.

usage: trainer_edl.py <trainer dir>
writes src/data/edl.json (clips), src/data/captions.json (subtitle pages), src/data/items.json
"""
import json, re, subprocess, sys
import numpy as np

root = sys.argv[1]
FPS = 25
spec = json.load(open(f"{root}/plan/edl_spec.json"))
fixes = json.load(open(f"{root}/plan/caption_fixes.json")) if __import__("os").path.exists(f"{root}/plan/caption_fixes.json") else []

SRC = {
    "main": (f"{root}/transcript/audio16k.wav", f"{root}/transcript/raw.json"),
    "kid3": (f"{root}/kid_dl/kid_3.wav", f"{root}/transcript/kid_3.json"),
    "kid4": (f"{root}/kid_dl/kid_4.wav", f"{root}/transcript/kid_4.json"),
}
ENV, WORDS = {}, {}
for k, (wav, js) in SRC.items():
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                     capture_output=True).stdout, np.int16).astype(np.float32) / 32768
    ENV[k] = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(160) / 160, "same")[::160]) + 1e-6)
    WORDS[k] = [{"w": w["word"].strip(), "s": w["start"], "e": w["end"]} for s in json.load(open(js)) for w in s["words"]]

def quietest(src, a, b):
    env = ENV[src]
    i, j = max(0, int(a * 100)), min(len(env), int(b * 100) + 1)
    return (i + int(np.argmin(env[i:j]))) / 100

def pauses(src, a, b, min_len=0.7):
    env = ENV[src]
    quiet = np.percentile(env, 30) + 8
    i, j = int(a * 100), int(b * 100)
    q = env[i:j] < quiet
    out, k = [], 0
    while k < len(q):
        if q[k]:
            m = k
            while m < len(q) and q[m]: m += 1
            if (m - k) / 100 >= min_len: out.append((a + k / 100, a + m / 100))
            k = m
        else: k += 1
    return out

clips, items, t = [], [], 0  # t in frames
for n, it in enumerate(spec):
    src, a, b = it["src"], it["a"], it["b"]
    ws = WORDS[src]
    prev_e = max([w["e"] for w in ws if w["e"] <= a + 0.05] or [0])
    next_s = min([w["s"] for w in ws if w["s"] >= b - 0.05] or [b + 1])
    start = it.get("start_at", quietest(src, max(prev_e + 0.03, a - 0.25), a + 0.03))
    end = it.get("end_at", quietest(src, b - 0.03, min(next_s - 0.03, b + 0.3)))
    pieces, cur = [], start
    for p0, p1 in pauses(src, start, end):
        if p0 - cur > 0.2 and end - p1 > 0.3:
            pieces.append((cur, p0 + 0.15))
            cur = p1 - 0.15
    pieces.append((cur, end))
    out0 = t
    for k, (pa, pb) in enumerate(pieces):
        m = int(round((pb - pa) * FPS))
        if m <= 0: continue
        clips.append({"src": src, "in": round(pa, 3), "dur": m / FPS, "out": t / FPS, "item": n, "piece": k,
                      "block": it["block"], "kid": bool(it.get("kid")), "screen": bool(it.get("screen"))})
        t += m
    items.append({"item": n, "block": it["block"], "src": src, "a": start, "b": end, "out": out0 / FPS, "end": t / FPS,
                  "chapter": it.get("chapter"), "kid": bool(it.get("kid")), "screen": bool(it.get("screen"))})
total = t / FPS

# ---- captions: words of each clip mapped to the timeline ----
kept = []
for c in clips:
    for w in WORDS[c["src"]]:
        lo, hi = max(w["s"], c["in"]), min(w["e"], c["in"] + c["dur"])
        if hi - lo >= max(0.01, (w["e"] - w["s"]) * 0.5) and w["s"] < c["in"] + c["dur"] - 0.08:
            kept.append({"w": w["w"], "s": round(c["out"] + lo - c["in"], 3), "e": round(c["out"] + hi - c["in"], 3), "kid": c["kid"]})
# join whisper's split hyphenated words ("какие -то") and normalise spelling
merged = []
for w in kept:
    if merged and w["w"].startswith("-"):
        merged[-1] = {**merged[-1], "w": merged[-1]["w"] + w["w"], "e": w["e"]}
    else:
        merged.append(dict(w))
kept = merged
YO = [(r"тренажер", "тренажёр"), (r"ребен", "ребён"), (r"^еще", "ещё"), (r"четност", "чётност"), (r"пятерк", "пятёрк")]
for k, w in enumerate(kept):
    t = w["w"]
    for a_, b_ in YO:
        t = re.sub(a_, b_, t) if not a_.startswith("^") else re.sub(a_, b_, t)
        t = re.sub(a_.capitalize(), b_.capitalize(), t) if not a_.startswith("^") else t
    t = t.replace("10-15", "10–15").replace("6-8", "6–8")
    if re.match(r"^Олимпиад", t) and k and kept[k - 1]["w"][-1] not in ".?!":
        t = "о" + t[1:]
    w["w"] = t
for src_txt, dst_txt in fixes:  # manual corrections checked by ear
    st, dt = src_txt.split(), dst_txt.split()
    for k in range(len(kept) - len(st) + 1):
        if [x["w"].lower() for x in kept[k:k + len(st)]] == [x.lower() for x in st]:
            s0, e0 = kept[k]["s"], kept[k + len(st) - 1]["e"]
            step = (e0 - s0) / max(1, len(dt))
            kept[k:k + len(st)] = [{"w": d, "s": round(s0 + j * step, 3), "e": round(s0 + (j + 1) * step, 3), "kid": kept[k]["kid"]}
                                   for j, d in enumerate(dt) if d != "∅"]
            break

HL = re.compile(r"^(магазин\w*|геро\w*|олимпиад\w*|час\w?|бесплатно|тренаж[её]р\w*|прогресс\w*|уверенност\w*|решени\w*|баллы?|балл\w*|нейросет\w*)[,.!?:;—]*$", re.I)
MAXC = 44
pages, cur = [], []
def flush():
    if cur:
        pages.append({"start": cur[0]["s"], "end": cur[-1]["e"], "kid": cur[0]["kid"],
                      "words": [{**w, "hl": bool(HL.match(w["w"]))} for w in cur]})
        cur.clear()
for w in kept:
    width = sum(len(x["w"]) + 1 for x in cur)
    if cur and (w["s"] - cur[-1]["e"] > 0.6 or w["kid"] != cur[-1]["kid"] or width + len(w["w"]) > MAXC
                or len(cur) >= 7 or (cur[-1]["w"][-1] in ".?!" and len(cur) >= 3) or (cur[-1]["w"][-1] in ",;:" and len(cur) >= 5)):
        flush()
    cur.append(w)
flush()
for i, p in enumerate(pages):
    nxt = pages[i + 1]["start"] if i + 1 < len(pages) else total
    p["end"] = round(min(nxt - 0.02, p["end"] + 0.4), 3)

D = f"{root}/src/data"
__import__("os").makedirs(D, exist_ok=True)
json.dump(clips, open(f"{D}/edl.json", "w"), indent=0)
json.dump(items, open(f"{D}/items.json", "w"), indent=0, ensure_ascii=False)
json.dump(pages, open(f"{D}/captions.json", "w"), ensure_ascii=False)
print(f"{len(clips)} clips, {len(pages)} pages, total {total:.1f}s ({total/60:.2f} min)")
