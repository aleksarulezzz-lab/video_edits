"""Cut vertical Reels out of the trainer video timeline.

Each reel is a range of the long edit (out/reels_times.json). Its footage clips, subtitle words and
graphics events are taken from the long video's data and shifted to start at 0.

usage: trainer_reels.py <trainer dir>    writes src/reels/data/reel_<n>.json
"""
import json, os, re, sys

root = sys.argv[1]
clips = json.load(open(f"{root}/src/data/edl.json"))
pages = json.load(open(f"{root}/src/data/captions.json"))
gfx = json.load(open(f"{root}/src/data/gfx.json"))["events"]
ranges = json.load(open(f"{root}/out/reels_times.json"))
FPS = 25
TITLES = [
    ("reel_magazin", ["СЫН ПОПРОСИЛ", "УБРАТЬ МАГАЗИН"]),
    ("reel_mnenie_syna", ["ЧТО ВАЖНО РЕБЁНКУ", "В ТРЕНАЖЁРЕ"]),
    ("reel_olimpiada", ["ВЕРНЫЙ ОТВЕТ", "≠ МАКСИМУМ БАЛЛОВ"]),
    ("reel_skolko_zanimatsya", ["СКОЛЬКО ЗАНИМАТЬСЯ", "МАТЕМАТИКОЙ?"]),
    ("reel_kak_dosidet_chas", ["КАК ДОСИДЕТЬ", "ЦЕЛЫЙ ЧАС"]),
    ("reel_uverennost", ["УВЕРЕННОСТЬ", "ПЕРЕД ОЛИМПИАДОЙ"]),
    ("reel_besplatnyy_trenazher", ["ТРЕНАЖЁР ПО МАТЕМАТИКЕ", "БЕСПЛАТНО"]),
    ("reel_repetitoram", ["РЕПЕТИТОРАМ:", "ТРЕНАЖЁР ПОД ВАС"]),
]
HL = re.compile(r"^(магазин\w*|геро\w*|олимпиад\w*|час\w?|бесплатно|тренаж[её]р\w*|прогресс\w*|уверенност\w*|решени\w*|балл\w*|нейросет\w*|10–15)[,.!?:;—]*$", re.I)
words = [w for p in pages for w in p["words"]]
os.makedirs(f"{root}/src/reels/data", exist_ok=True)

for n, ((a, b), (name, title)) in enumerate(zip(ranges, TITLES), 1):
    a0 = max(0.0, a - 0.12)
    b0 = b + 0.35
    # never run into the next spoken word
    nxt = [w["s"] for w in words if w["s"] >= b - 0.01]
    if nxt:
        b0 = min(b0, nxt[0] - 0.04)
    a0, b0 = round(a0 * FPS) / FPS, round(b0 * FPS) / FPS
    rc = []
    for c in clips:
        lo, hi = max(a0, c["out"]), min(b0, c["out"] + c["dur"])
        if hi - lo >= 1 / FPS - 1e-6:
            rc.append({"src": c["src"], "in": round(c["in"] + lo - c["out"], 3), "dur": round(hi - lo, 3), "out": round(lo - a0, 3),
                       "kid": c["kid"], "screen": c["screen"], "piece": len(rc)})
    dur = round(b0 - a0, 3)
    # subtitles: phrase pages for a narrow frame, up to 2 lines
    kept = [{**w, "s": round(w["s"] - a0, 3), "e": round(w["e"] - a0, 3)} for w in words if a0 - 0.01 <= w["s"] < b0 - 0.05]
    if kept and kept[0]["w"][0].islower():
        kept[0]["w"] = kept[0]["w"][0].upper() + kept[0]["w"][1:]
    MAXL = 18
    width = lambda ws: sum(len(x["w"]) + 1 for x in ws)
    pg, cur = [], []
    def flush():
        if not cur: return
        lines, best = [cur[:]], None
        if width(cur) > MAXL:
            for k in range(1, len(cur)):
                l1, l2 = width(cur[:k]), width(cur[k:])
                sc = abs(l1 - l2) + 100 * max(0, max(l1, l2) - MAXL - 2) - (5 if cur[k - 1]["w"][-1] in ",.:;?!" else 0)
                if best is None or sc < best: best, lines = sc, [cur[:k], cur[k:]]
        pg.append({"start": cur[0]["s"], "end": cur[-1]["e"], "kid": cur[0]["kid"],
                   "lines": [[{"w": x["w"], "s": x["s"], "e": x["e"], "hl": bool(HL.match(x["w"]))} for x in ln] for ln in lines]})
        cur.clear()
    for w in kept:
        if cur and (w["s"] - cur[-1]["e"] > 0.6 or w["kid"] != cur[-1]["kid"] or width(cur + [w]) > 2 * MAXL
                    or (cur[-1]["w"][-1] in ".?!" and width(cur) > 12)):
            flush()
        cur.append(w)
    flush()
    for i, p in enumerate(pg):
        nx = pg[i + 1]["start"] if i + 1 < len(pg) else dur
        p["end"] = round(min(nx - 0.02, p["end"] + 0.4), 3)
    ev = []
    for e in gfx:
        if e["kind"] in ("chapter", "about", "depth"):
            continue
        if e["a"] < b0 - 0.5 and e["b"] > a0 + 0.3:
            x = {**e, "a": round(max(0, e["a"] - a0), 3), "b": round(min(dur, e["b"] - a0), 3)}
            if "items" in x:
                x["items"] = [{**it, "at": round(it["at"] - a0, 3)} for it in x["items"]]
            ev.append(x)
    data = {"n": n, "name": name, "title": title, "src_range": [a0, b0], "duration": dur, "clips": rc, "captions": pg, "events": ev}
    json.dump(data, open(f"{root}/src/reels/data/reel_{n}.json", "w"), ensure_ascii=False)
    print(n, name, f"{dur:.1f}s", len(rc), "clips", len(pg), "pages", len(ev), "events", "|", " ".join(e["kind"] for e in ev))
