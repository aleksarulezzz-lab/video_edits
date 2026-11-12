"""Vertical Reels of «Рекламный ролик без дизайнера», cut from the finished long video.

Each reel is a list of ranges of the long edit (start phrase → end phrase, found in the long video's
subtitles) or of the ready vertical ad. Subtitles come from the corrected SRT; graphics state comes
from src/data/gfx.json (which moments show a window/insert and which show the author).

usage: ad_reels.py <dir>    writes src/reels/data/reels.json
"""
import json, re, sys

root = sys.argv[1]
FPS = 30
caps = json.load(open(f"{root}/src/data/captions.json"))
gfx = json.load(open(f"{root}/src/data/gfx.json"))["events"]
words = [w for p in caps for w in p["words"]]
norm = lambda x: re.sub(r"[^\w]", "", x.lower().replace("ё", "е"))

def srt(path):
    out = []
    for blk in open(path).read().strip().split("\n\n"):
        ln = blk.split("\n")
        a, b = [sum(float(x) * m for x, m in zip(t.replace(",", ".").split(":"), (3600, 60, 1))) for t in ln[1].split(" --> ")]
        out.append({"a": a, "b": b, "text": " ".join(ln[2:])})
    return out
SUBS = srt(f"{root}/out/subtitles.srt")

def at(ph, after=0.0, end=False):
    ps = [norm(x) for x in ph.split()]
    for i in range(len(words) - len(ps) + 1):
        if words[i]["s"] >= after and all(norm(words[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return words[i + len(ps) - 1]["e"] if end else words[i]["s"]
    raise SystemExit(f"phrase not found: {ph!r} after {after}")

def rng(a_ph, b_ph, after=0.0):
    a = at(a_ph, after)
    b = at(b_ph, a, end=True)
    prev = [w["e"] for w in words if w["e"] <= a + 0.01]
    nxt = [w["s"] for w in words if w["s"] >= b - 0.01]
    a0 = max(0.0, a - 0.15, (prev[-1] + 0.05) if prev else 0.0)
    b0 = min(b + 0.35, (nxt[0] - 0.05) if nxt else b + 0.35)
    return [round(a0 * FPS) / FPS, round(b0 * FPS) / FPS]

REELS = [
    ("reel_1_bez_dizainera", ["Этот рекламный ролик", "сделала нейросеть"], [rng("Вот этот ролик", "посреди океана", 9), rng("того теперь у меня", "для вашего видео", 340)]),
    ("reel_2_oshibki", ["Нейросеть поселила меня", "посреди океана"], [rng("честно о том", "передать заказчику", 245)]),
    ("reel_3_snachala_tekst", ["Не просите у нейросети", "сразу видео"], [rng("созвона в трекинг", "отсуточного лимита", 105)]),
    ("reel_4_klod", ["Почему я написала", "Claude как «Клод»"], [rng("Теперь текст у меня", "открываете почту", 168)]),
    ("reel_5_vakansiya", ["Вакансия: человек", "на анимации в Claude"], [rng("теперь деньги", "показала в видео", 425)]),
    ("reel_6_reklama_dorozhaet", ["Реклама дорожает.", "А клиенты нужны каждый месяц"], [["rv", 0.0, 16.9]]),
    ("reel_7_drugoe_utro", ["Представьте", "другое утро…"], [["rv", 16.85, 37.75], ["rv", 45.9, 56.85]]),
    ("reel_8_ne_tolko_golova", ["Рилсы не обязаны быть", "говорящей головой"], [rng("Но реклама", "делает за вас нейросеть", 380)]),
]

# ready vertical ad: subtitles from its own transcript (same text as the horizontal one)
RV = [{"a": s["start"], "b": s["end"], "text": s["text"]} for s in json.load(open(f"{root}/transcript/ready_horizontal.json"))]
for s in RV:
    s["text"] = s["text"].replace("Клод", "Claude")

WINDOW = {"screen", "clip", "endcard", "insert", "tier", "listen", "broll", "guide", "stinger"}
out = []
for name, title, segs in REELS:
    off, parts, subs, looks = 0.0, [], [], []
    for sg in segs:
        if sg[0] == "rv":
            _, a, b = sg
            src, pages = "rv", RV
        else:
            a, b = sg
            src, pages = "long", SUBS
        parts.append({"src": src, "a": a, "b": b, "out": round(off, 3)})
        for p in pages:
            if p["b"] > a + 0.05 and p["a"] < b - 0.05:
                t = p["text"]
                if p["a"] < a - 0.2:  # the page started before the cut: keep only the sentence that begins inside
                    m = re.search(r"[.?!…»]\s+(?=[А-ЯЁA-Z«])", t)
                    if not m:
                        continue
                    t = t[m.end():]
                if p["b"] > b + 0.2:  # it runs past the end: keep up to the last finished sentence
                    m = list(re.finditer(r"[.?!…»](?=\s|$)", t))
                    if not m:
                        continue
                    t = t[:m[-1].end()]
                subs.append({"a": round(max(a, p["a"]) - a + off, 3), "b": round(min(b, p["b"]) - a + off, 3), "text": t.strip()})
        if src == "long":  # where the long video shows a window / insert instead of the author
            for e in gfx:
                if e["kind"] in WINDOW and e["a"] < b and e["b"] > a and not (e["kind"] == "clip" and e.get("mode") == "full" and False):
                    looks.append({"a": round(max(a, e["a"]) - a + off, 3), "b": round(min(b, e["b"]) - a + off, 3), "kind": e["kind"]})
        off += b - a
    # short pages for a narrow frame: long pages are split by words, time shared by length
    short = []
    for sb in subs:
        ws = sb["text"].split()
        chunks, cur = [], []
        for w in ws:
            if cur and len(" ".join(cur + [w])) > 34:
                chunks.append(cur); cur = []
            cur.append(w)
        if cur:
            chunks.append(cur)
        total = sum(len(" ".join(c)) for c in chunks) or 1
        t0 = sb["a"]
        for c in chunks:
            d = (sb["b"] - sb["a"]) * len(" ".join(c)) / total
            short.append({"a": round(t0, 3), "b": round(t0 + d, 3), "text": " ".join(c)})
            t0 += d
    subs = short
    if subs and subs[0]["text"][:1].islower():
        subs[0]["text"] = subs[0]["text"][0].upper() + subs[0]["text"][1:]
    out.append({"name": name, "title": title, "duration": round(off, 3), "parts": parts, "subs": subs, "windows": looks})
    print(f"{name:28s} {off:5.1f}s parts={len(parts)} subs={len(subs)} windows={len(looks)}")
import os
os.makedirs(f"{root}/src/reels/data", exist_ok=True)
json.dump(out, open(f"{root}/src/reels/data/reels.json", "w"), ensure_ascii=False)
