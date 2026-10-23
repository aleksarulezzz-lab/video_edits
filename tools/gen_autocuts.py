"""Alternate wide / tight framing on sentence pauses in talking-head stretches (two-camera feel).

Writes src/data/autocuts.json: tight-framing ranges in the author's-cut timeline.
"""
import json, sys
root = sys.argv[1]
D = f"{root}/src/data"
words = [w for s in json.load(open(f"{root}/transcript/transcript_fixed.json")) for w in s["words"]]
base = json.load(open(f"{D}/edl_base.json"))
scenes = json.load(open(f"{D}/scenes.json"))
ops = json.load(open(f"{D}/ops.json"))

def kind_at(te):
    c = next((c for c in base if c["out"] <= te < c["out"] + c["dur"]), None)
    if not c: return "screen"
    r = c["in"] + te - c["out"]
    s = next((s for s in scenes if s["start"] <= r < s["end"]), None)
    return s["kind"] if s else "head"

# candidate cut points: pauses after sentence ends (or long comma pauses)
cands = []
for p, n in zip(words, words[1:]):
    gap = n["start"] - p["end"]
    if (p["word"][-1] in ".?!" and gap >= 0.08) or (p["word"][-1] == "," and gap >= 0.35):
        cands.append(round((p["end"] + n["start"]) / 2, 2))
resets = [i["at"] for i in ops.get("inserts", [])]

tight, state, last, start = [], False, None, None
t_end = words[-1]["end"]
for c in cands:
    if kind_at(c) != "head" or kind_at(c - 0.5) != "head":
        if state: tight.append([start, c]); state = False
        last = None
        continue
    if last is None or any(last < r <= c for r in resets):
        if state: tight.append([start, c]); state = False
        last = c
        continue
    if c - last >= 6.5:
        if state: tight.append([start, c])
        else: start = c
        state = not state
        last = c
if state: tight.append([start, t_end])
json.dump(tight, open(f"{D}/autocuts.json", "w"))
print(len(tight), "tight shots, total", round(sum(b - a for a, b in tight)), "s")
