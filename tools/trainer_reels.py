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

norm = lambda x: re.sub(r"[^\wё]", "", x.lower().replace("ё", "е"))
def phrase(ph, after=0.0, end=False):
    """Long-timeline start (or end) of a phrase in the long video's subtitles."""
    ps = [norm(x) for x in ph.split()]
    for i in range(len(words) - len(ps) + 1):
        if words[i]["s"] >= after and all(norm(words[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return words[i + len(ps) - 1]["e"] if end else words[i]["s"]
    raise SystemExit(f"phrase not found: {ph!r}")

# 60-second versions: several fragments of the long edit, in this order (start phrase, end phrase)
SEGMENTS = {
    2: [("И начну с самого", "это с моего сына,"), ("Я спросила его", "вот что он мне ответил."), ("Удобно то, что", "какая-то детская игрушка."),
        ("А второй режим", "было решено неправильно."), ("Ну, нормальный режим", "а когда нет."), ("И это основной вывод", "что у него получается.")],
    5: [("Как приучить ребёнка", "минут в день?"), ("Я решила сделать", "какую-то мотивирующую фразу."), ("Это ребёнок, кстати", "давай на сегодня закончим."),
        ("Уже сейчас у меня", "задач на тренажёре."), ("Именно это я и", "за сегодняшний день."), ("Таким образом, ребёнок не", "какие темы подтянуть.")],
}

RETEXT = {(5, "Будет: похвала и выбор — продолжить или закончить"): ("Будет: похвала в конце занятия", ["Будет:"])}
# theses added for the short versions (text from the author's words)
EXTRA = {2: [(2, "Олимпиадный режим: проверка только в конце", "И только в конце", 4.0, ["в", "конце"])]}

def cut(a0, b0):
    rc = []
    for c in clips:
        lo, hi = max(a0, c["out"]), min(b0, c["out"] + c["dur"])
        if hi - lo >= 1 / FPS - 1e-6:
            rc.append({"src": c["src"], "in": round(c["in"] + lo - c["out"], 3), "dur": round(hi - lo, 3), "out": round(lo - a0, 3),
                       "kid": c["kid"], "screen": c["screen"]})
    return rc

def segment(a, b):
    """One fragment of the long edit: snapped edges, no slivers of neighbouring shots."""
    prev = [w["e"] for w in words if w["e"] <= a + 0.01]
    a0 = max(0.0, a - 0.12, (prev[-1] + 0.04) if prev else 0.0)
    b0 = b + 0.35
    nxt = [w["s"] for w in words if w["s"] >= b - 0.01]
    if nxt:
        b0 = min(b0, nxt[0] - 0.04)
    a0, b0 = round(a0 * FPS) / FPS, round(b0 * FPS) / FPS
    rc = cut(a0, b0)
    if len(rc) > 1 and rc[0]["dur"] < 0.3:
        a0 = round((a0 + rc[0]["dur"]) * FPS) / FPS
    if len(rc) > 1 and rc[-1]["dur"] < 0.3:
        b0 = round((b0 - rc[-1]["dur"]) * FPS) / FPS
    return a0, b0, cut(a0, b0)

for n, ((ra, rb), (name, title)) in enumerate(zip(ranges, TITLES), 1):
    segs = [(phrase(x), phrase(y, phrase(x), end=True)) for x, y in SEGMENTS[n]] if n in SEGMENTS else [(ra, rb)]
    rc, kept, ev, off, src_ranges = [], [], [], 0.0, []
    for a, b in segs:
        a0, b0, sc = segment(a, b)
        for c in sc:
            rc.append({**c, "out": round(c["out"] + off, 3), "piece": len(rc)})
        part = [{**w, "s": round(w["s"] - a0 + off, 3), "e": round(w["e"] - a0 + off, 3)} for w in words if w["e"] > a0 + 0.05 and w["s"] >= a0 - 0.3 and w["s"] < b0 - 0.05]
        if kept and part:  # a new fragment starts a new sentence
            if kept[-1]["w"][-1] in ",;:":
                kept[-1] = {**kept[-1], "w": kept[-1]["w"][:-1] + "."}
            part[0] = {**part[0], "w": part[0]["w"][0].upper() + part[0]["w"][1:]}
        kept += part
        for e in gfx:
            if e["kind"] in ("chapter", "about", "depth") or not (e["a"] < b0 - 0.5 and e["b"] > a0 + 0.3):
                continue
            x = {**e, "a": round(max(a0, e["a"]) - a0 + off, 3), "b": round(min(b0, e["b"]) - a0 + off, 3)}
            if "items" in x:
                x["items"] = [{**it, "at": round(it["at"] - a0 + off, 3)} for it in x["items"] if a0 - 0.5 <= it["at"] < b0]
                if not x["items"]:
                    continue
            ev.append(x)
        src_ranges.append([a0, b0])
        off = round(off + b0 - a0, 3)
    dur = off
    a0 = 0.0
    def to_reel(t):
        o = 0.0
        for x0, x1 in src_ranges:
            if x0 <= t < x1:
                return round(o + t - x0, 3)
            o += x1 - x0
        return None
    for tn, text, ph, d_, hl in EXTRA.get(n, []):
        t0 = to_reel(phrase(ph))
        ev.append({"kind": "thesis", "a": t0, "b": round(t0 + d_, 3), "text": text, "hl": hl})
    for e in ev:  # theses whose wording relied on lines cut from the short version
        if (n, e.get("text")) in RETEXT:
            e["text"], e["hl"] = RETEXT[(n, e["text"])]
    ev.sort(key=lambda e: e["a"])
    kept = [{**w, "s": w["s"], "e": w["e"]} for w in kept]
    # subtitles: phrase pages for a narrow frame, up to 2 lines
    for k in range(len(kept) - 1):
        if kept[k]["w"] == "занимается," and kept[k + 1]["w"] == "просто":
            kept[k] = {**kept[k], "w": "занимается"}
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
    data = {"n": n, "name": name, "title": title, "src_ranges": src_ranges, "duration": dur, "clips": rc, "captions": pg, "events": ev}
    json.dump(data, open(f"{root}/src/reels/data/reel_{n}.json", "w"), ensure_ascii=False)
    print(n, name, f"{dur:.1f}s", len(rc), "clips", len(pg), "pages", len(ev), "events", "|", " ".join(e["kind"] for e in ev))
