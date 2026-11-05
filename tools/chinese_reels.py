"""Cut vertical Reels out of the Chinese-trainer timeline.

Each reel is one range of the long edit (the same phrases as reels_timecodes.md). Its footage clips,
subtitle words and graphics events are taken from the long video's data and shifted to start at 0.

usage: chinese_reels.py <dir>    writes src/reels/data/reel_<n>.json
"""
import json, os, re, sys

root = sys.argv[1]
FPS = 30
clips = json.load(open(f"{root}/src/data/edl.json"))
pages = json.load(open(f"{root}/src/data/captions.json"))
gfx = json.load(open(f"{root}/src/data/gfx.json"))["events"]
words = [w for p in pages for w in p["words"]]
norm = lambda x: re.sub(r"[^\w]", "", x.lower().replace("ё", "е"))

def phrase(ph, after=0.0, end=False):
    ps = [norm(x) for x in ph.split()]
    for i in range(len(words) - len(ps) + 1):
        if words[i]["s"] >= after and all(norm(words[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return words[i + len(ps) - 1]["e"] if end else words[i]["s"]
    raise SystemExit(f"phrase not found: {ph!r}")

REELS = [
    ("reel_ne_znayu_kitayskiy", ["Я НЕ ЗНАЮ КИТАЙСКИЙ,", "НО СДЕЛАЛА СЫНУ ТРЕНАЖЁР"], None, "что я сама не умею"),
    ("reel_ieroglify", ["КАК РЕБЁНОК УЧИТСЯ", "ПИСАТЬ ИЕРОГЛИФЫ"], "И первая задача", "делает сам тренажер"),
    ("reel_proiznoshenie", ["КАК ПРОВЕРИТЬ ПРОИЗНОШЕНИЕ,", "ЕСЛИ САМА НЕ ЗНАЕШЬ ЯЗЫК"], "С письмом разобрались", "правильности интонации"),
    ("reel_proshche", ["МЛАДШЕМУ Я СДЕЛАЛА", "ТРЕНАЖЁР В РАЗЫ ПРОЩЕ"], "При этом младшему", "которые делал муж"),
    ("reel_magazin", ["СТАРШЕГО МАГАЗИН ОТВЛЕКАЛ,", "А МЛАДШЕГО МОТИВИРУЕТ"], "А теперь самое интересное", "и его интересы"),
    ("reel_chas_matematiki", ["ЧАС МАТЕМАТИКИ — МНОГО,", "А 4 ЧАСА ИГРЫ — НОРМАЛЬНО?"], "Кстати, про тренажер старшего", "план на день выполнен"),
    ("reel_cel", ["КАК ДАТЬ РЕБЁНКУ", "ЦЕЛЬ УЧИТЬ ЯЗЫК"], "Но с другой стороны", "из следующих видео"),
]
HL = re.compile(r"^(китайск\w*|иероглиф\w*|интонаци\w*|магазин\w*|геро\w*|час\w?|план\w?|тренаж[её]р\w*|произношени\w*|пропись|прописи|кафе\w*|цел\w?|прощ\w*)[,.!?:;—]*$", re.I)
os.makedirs(f"{root}/src/reels/data", exist_ok=True)

def cut(a0, b0):
    rc = []
    for c in clips:
        lo, hi = max(a0, c["out"]), min(b0, c["out"] + c["dur"])
        if hi - lo >= 1 / FPS - 1e-6:
            rc.append({"src": c["src"], "in": round(c["in"] + lo - c["out"], 3), "dur": round(hi - lo, 3), "out": round(lo - a0, 3)})
    return rc

prev_end = 0.0
for n, (name, title, ph_a, ph_b) in enumerate(REELS, 1):
    a = phrase(ph_a, prev_end - 20) if ph_a else 0.0
    b = phrase(ph_b, a, end=True)
    prev = [w["e"] for w in words if w["e"] <= a + 0.01]
    a0 = max(0.0, a - 0.12, (prev[-1] + 0.04) if prev else 0.0)
    nxt = [w["s"] for w in words if w["s"] >= b - 0.01]
    b0 = min(b + 0.35, nxt[0] - 0.04) if nxt else b + 0.35
    a0, b0 = round(a0 * FPS) / FPS, round(b0 * FPS) / FPS
    rc = cut(a0, b0)
    if len(rc) > 1 and rc[0]["dur"] < 0.3:  # no sliver of the previous shot
        a0 = round((a0 + rc[0]["dur"]) * FPS) / FPS; rc = cut(a0, b0)
    prev_end = b
    dur = round(b0 - a0, 3)
    ev = []
    for e in gfx:
        if e["kind"] in ("chapter", "about", "depth", "tier") or not (e["a"] < b0 - 0.5 and e["b"] > a0 + 0.3):
            continue
        x = {**e, "a": round(max(a0, e["a"]) - a0, 3), "b": round(min(b0, e["b"]) - a0, 3)}
        if "items" in x:
            x["items"] = [{**it, "at": round(it["at"] - a0, 3)} for it in x["items"] if a0 - 0.5 <= it["at"] < b0]
            if not x["items"]:
                continue
        ev.append(x)
    kept = [{**w, "s": round(w["s"] - a0, 3), "e": round(w["e"] - a0, 3)} for w in words if w["e"] > a0 + 0.05 and w["s"] < b0 - 0.05]
    if kept and kept[0]["w"][0].islower():
        kept[0] = {**kept[0], "w": kept[0]["w"][0].upper() + kept[0]["w"][1:]}
    # subtitle pages for a narrow frame: up to 2 short lines
    MAXL = 20
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
        pg.append({"start": cur[0]["s"], "end": cur[-1]["e"], "lines": [[{"w": x["w"], "s": x["s"], "e": x["e"], "hl": bool(HL.match(x["w"]))} for x in ln] for ln in lines]})
        cur.clear()
    for w in kept:
        if cur and (w["s"] - cur[-1]["e"] > 0.6 or width(cur + [w]) > 2 * MAXL or (cur[-1]["w"][-1] in ".?!" and width(cur) > 12)):
            flush()
        cur.append(w)
    flush()
    for i, p in enumerate(pg):
        nx = pg[i + 1]["start"] if i + 1 < len(pg) else dur
        p["end"] = round(min(nx - 0.02, p["end"] + 0.4), 3)
    data = {"n": n, "name": name, "title": title, "range": [a0, b0], "duration": dur, "clips": rc, "captions": pg, "events": ev}
    json.dump(data, open(f"{root}/src/reels/data/reel_{n}.json", "w"), ensure_ascii=False)
    print(n, name, f"{a0:.1f}-{b0:.1f}", f"{dur:.1f}s", len(rc), "clips", len(pg), "pages |", " ".join(f"{e['kind']}@{e['a']:.0f}" for e in ev))
