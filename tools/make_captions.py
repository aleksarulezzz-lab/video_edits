"""Group transcript words into subtitle pages: max 2 lines, ~32 chars per line."""
import json, re, sys

MAX_LINE, MAX_GAP = 32, 0.9
HL = re.compile(r"^(YouTube|Instagram\*|Telegram|ВКонтакте|Дзен|Дзена|VC\.ru|Reels|Claude|ChatGPT|нейросет\w*|систем\w*|\d[\d\s]*|пять|5|сценари\w*)[,.!?:;]*$", re.I)

words = [w for s in json.load(open(sys.argv[1])) for w in s["words"]]
pages, cur = [], []

def width(ws):
    return sum(len(w["word"]) + 1 for w in ws)

def flush():
    if not cur:
        return
    # split into two balanced lines
    best, lines = None, [cur[:]]
    if width(cur) > MAX_LINE:
        for k in range(1, len(cur)):
            a, b = width(cur[:k]), width(cur[k:])
            score = abs(a - b) - (6 if cur[k - 1]["word"][-1] in ",.:;?!" else 0)
            score += 100 * max(0, max(a, b) - MAX_LINE - 2)
            if best is None or score < best:
                best, lines = score, [cur[:k], cur[k:]]
    pages.append({"start": round(cur[0]["start"], 2), "end": round(cur[-1]["end"], 2),
                  "lines": [[{"w": w["word"], "hl": bool(HL.match(w["word"]))} for w in ln] for ln in lines]})
    cur.clear()

for w in words:
    if cur and (w["start"] - cur[-1]["end"] > MAX_GAP or width(cur + [w]) > 2 * MAX_LINE
                or (cur[-1]["word"][-1] in ".?!" and width(cur) > 18)):
        flush()
    cur.append(w)
flush()
# hold each page until the next one (max +0.6 s), never overlapping
for i, p in enumerate(pages):
    nxt = pages[i + 1]["start"] if i + 1 < len(pages) else p["end"] + 0.6
    p["end"] = round(min(nxt - 0.04, p["end"] + 0.6), 2)
json.dump(pages, open(sys.argv[2], "w"), ensure_ascii=False)
print(len(pages), "pages; longest line", max(sum(len(x["w"]) + 1 for x in ln) for p in pages for ln in p["lines"]))
