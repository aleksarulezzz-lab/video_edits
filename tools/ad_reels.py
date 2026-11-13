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

def cut(r, *holes):
    """a range with pieces taken out (mouth noises at a join)"""
    out, cur = [], r[0]
    for h0, h1 in holes:
        out.append([cur, h0]); cur = h1
    out.append([cur, r[1]])
    return out
r1 = rng("Вот этот ролик", "посреди океана", 9); r1[0] = 10.78  # no breath before «Вот этот ролик»
REELS = [
    # the ad itself first, so «этот ролик» is on screen when she says it
    ("reel_1_bez_dizainera", ["Этот рекламный ролик", "сделала нейросеть"], [["rv", 16.85, 23.5], r1, rng("того теперь у меня", "для вашего видео", 335)]),
    ("reel_2_oshibki", ["Нейросеть поселила меня", "посреди океана"], cut(rng("честно о том", "передать заказчику", 240), (283.1, 283.72))),
    ("reel_3_snachala_tekst", ["Не просите у нейросети", "сразу видео"], [rng("Дальше начиналась", "отсуточного лимита", 95)]),
    # ends with her own conclusion from the summary: the free ElevenLabs plan was enough
    ("reel_4_klod", ["Почему я написала", "Claude как «Клод»"], [rng("Теперь текст у меня", "открываете почту", 160), rng("бесплатный тариф", "полутораминутного ролика", 355)]),
    ("reel_5_vakansiya", ["Вакансия: человек", "на анимации в Claude"], [rng("А теперь про деньги", "показала в видео", 420)]),
    ("reel_6_reklama_dorozhaet", ["Реклама дорожает.", "А клиенты нужны каждый месяц"], [["rv", 0.0, 16.9]]),
    ("reel_7_drugoe_utro", ["Представьте", "другое утро…"], [["rv", 16.85, 37.75], ["rv", 45.9, 56.85]]),
    ("reel_8_ne_tolko_golova", ["Рилсы не обязаны быть", "говорящей головой"], [rng("именно такой технологией", "делает за вас нейросеть", 375)]),
]
# reel 5: the very order she reads, on screen while she reads it (stills of the freelance site, client column cropped off)
OVER = {"reel_5_vakansiya": [("reelimg/fl_8.5.png", "пошла на биржу", 420), ("reelimg/fl_16.5.png", "Создание анимационного", 420),
                             ("reelimg/fl_22.png", "Моушн-дизайнер для", 420), ("reelimg/fl_26.5.png", "Заказчик прямо просит", 420),
                             ("reelimg/fl_33.png", "постоянный человек", 420), (None, "Понимаешь, что происходит", 420),
                             ("reelimg/flax.png", "такой ролик стоит", 420), (None, "И это ровно то", 420)]}
# reel 8: more motion design from the ready vertical ad (pieces not used in the other reels), muted, full screen
RVINS = {"reel_8_ne_tolko_golova": [("можно разбавить видео", 56.9), ("несколько однообразный", 61.0), ("разнообразит как раз", 68.3),
                                    ("вставлять его точечно", 74.5), ("есть замысел", 79.3)]}
INTRO = {"reel_6_reklama_dorozhaet": ["Как делать такие ролики", "и $арабатывать на этом"]}

# ready vertical ad: subtitles from its own transcript (same text as the horizontal one)
RV = [{"a": s["start"], "b": s["end"], "text": s["text"]} for s in json.load(open(f"{root}/transcript/ready_horizontal.json"))]
for s in RV:
    s["text"] = s["text"].replace("Клод", "Claude")

WINDOW = {"screen", "clip", "endcard", "insert", "tier", "listen", "broll", "guide", "stinger", "step", "board", "stack", "vis"}
# pauses inside a reel are cut (the long video keeps a few natural ones)
import subprocess
import numpy as np
_x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f"{root}/out/final.mp4", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                                  capture_output=True).stdout, np.int16).astype(np.float32) / 32768
ENV = 20 * np.log10(np.sqrt(np.convolve(_x ** 2, np.ones(160) / 160, "same")[::160]) + 1e-6)
def split_pauses(a, b, thr=-38, min_len=0.45, keep=0.14):
    i, j = int(a * 100), int(b * 100)
    q = ENV[i:j] < thr
    out, cur, k = [], a, 0
    while k < len(q):
        if q[k]:
            m = k
            while m < len(q) and q[m]: m += 1
            p0, p1 = a + k / 100, a + m / 100
            if p1 - p0 >= min_len and p0 - cur > 0.3 and b - p1 > 0.3:
                out.append([round(cur, 3), round(p0 + keep, 3)]); cur = p1 - keep
            k = m
        else: k += 1
    out.append([round(cur, 3), round(b, 3)])
    return out
for r in range(len(REELS)):
    n_, t_, segs_ = REELS[r]
    new_segs = []
    for sg in segs_:
        new_segs += [sg] if sg[0] == "rv" else split_pauses(*sg)
    REELS[r] = (n_, t_, new_segs)

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
    # pages for a narrow frame: up to ~46 characters (two lines); longer ones split at punctuation, then words
    def pieces(text):
        if len(text) <= 46:
            return [text]
        parts = re.split(r"(?<=[.,!?:;…])\s+", text)
        out, cur = [], ""
        for prt in parts:
            if cur and len(cur) + 1 + len(prt) > 46:
                out.append(cur); cur = prt
            else:
                cur = (cur + " " + prt).strip()
        if cur:
            out.append(cur)
        res = []
        for o in out:  # still too long: split by words into halves
            while len(o) > 46:
                ws = o.split(); k = len(ws) // 2
                res.append(" ".join(ws[:k])); o = " ".join(ws[k:])
            res.append(o)
        return res
    short = []
    for sb in subs:
        chunks = pieces(sb["text"])
        total = sum(len(c) for c in chunks) or 1
        t0 = sb["a"]
        for c in chunks:
            d = (sb["b"] - sb["a"]) * len(c) / total
            short.append({"a": round(t0, 3), "b": round(t0 + d, 3), "text": c})
            t0 += d
    subs = short
    if subs and subs[0]["text"][:1].islower():
        subs[0]["text"] = subs[0]["text"][0].upper() + subs[0]["text"][1:]
    def R(t):  # long-video time -> reel time
        for p in parts:
            if p["src"] == "long" and p["a"] - 0.05 <= t <= p["b"] + 0.05:
                return round(p["out"] + t - p["a"], 3)
        nxt = [p for p in parts if p["src"] == "long" and p["a"] > t]  # inside a cut pause: the next piece
        if nxt:
            return nxt[0]["out"]
        raise SystemExit(f"{name}: {t} is not in the reel")
    over = []
    ov = OVER.get(name, [])
    for k, (img, ph, af) in enumerate(ov):
        if img:
            a_ = R(at(ph, af) - 0.1)
            b_ = R(at(ov[k + 1][1], af) - 0.1) if k + 1 < len(ov) else round(off, 3)
            over.append({"a": a_, "b": b_, "img": img})
    rvins = [{"a": R(at(ph, 375)), "b": round(R(at(ph, 375)) + 2.8, 3), "at": rt} for ph, rt in RVINS.get(name, [])]
    item = {"name": name, "title": title, "duration": round(off, 3), "parts": parts, "subs": subs, "windows": looks, "over": over, "rvins": rvins}
    if name in INTRO:  # a chapter-like card before the reel: everything moves by its length
        D = 2.0
        for p in parts: p["out"] = round(p["out"] + D, 3)
        for lst in (subs, looks, over, rvins):
            for x in lst: x["a"] = round(x["a"] + D, 3); x["b"] = round(x["b"] + D, 3)
        item["duration"] = round(off + D, 3); item["intro"] = {"lines": INTRO[name], "d": D}
    out.append(item)
    if name == "reel_6_reklama_dorozhaet":  # Instagram / Dzen: comment call instead of the link to the full video
        out.append({**item, "name": name + "_insta", "cta": "comment"})
    print(f"{name:28s} {off:5.1f}s parts={len(parts)} subs={len(subs)} windows={len(looks)}")
import os
os.makedirs(f"{root}/src/reels/data", exist_ok=True)
json.dump(out, open(f"{root}/src/reels/data/reels.json", "w"), ensure_ascii=False)
