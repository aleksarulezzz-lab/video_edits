"""Write per-short subtitles (SRT + TXT) and the report with real source timecodes.

usage: shorts_docs.py <content-week dir> <out dir>
"""
import json, sys

root, out = sys.argv[1], sys.argv[2]
spec = json.load(open(f"{root}/src/shorts/data/spec.json"))
END_CARD = 3.8

def ts(t, ms=True):
    m, s = divmod(t, 60)
    h, m = divmod(m, 60)
    if ms:
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
    return f"{int(m):02d}:{s:05.2f}"

rep = ["# Shorts — отчёт по фрагментам\n",
       "Исходник: финальная версия длинного видео (v3, 18:30) и сырая запись, из которой она собрана.",
       "Таймкоды «v3» — время в опубликованном длинном видео; «raw» — время в сырой записи.",
       f"Каждый ролик заканчивается анимированной заставкой {END_CARD} с (подробное видео на YouTube, @aleksarulezzz).\n"]
for sh in spec["shorts"]:
    d = json.load(open(f"{root}/src/shorts/data/short_{sh['id']}.json"))
    name = d["file"].rsplit(".", 1)[0]
    with open(f"{out}/{name}.srt", "w") as f:
        for i, p in enumerate(d["captions"], 1):
            f.write(f"{i}\n{ts(p['start'])} --> {ts(p['end'])}\n" + "\n".join(" ".join(w["w"] for w in ln) for ln in p["lines"]) + "\n\n")
    text = " ".join(w["w"] for p in d["captions"] for ln in p["lines"] for w in ln)
    with open(f"{out}/{name}.txt", "w") as f:
        f.write(" / ".join(d["title"]) + "\n\n" + text + "\n")
    rep.append(f"## {d['file']} — «{' '.join(d['title'])}»\n")
    rep.append(f"Длительность: {d['duration'] + END_CARD:.1f} с (речь {d['duration']:.1f} с + заставка {END_CARD} с).\n")
    rep.append("| # | в шорте | v3 (длинное видео) | raw (сырая запись) |\n|---|---|---|---|")
    for k, (a, o, b, ob) in enumerate(d["pmap"], 1):
        raws = [c for c in d["clips"] if c["out"] >= o - 0.001 and c["out"] < ob - 0.001]
        raw_txt = ", ".join(f"{ts(c['in'], False)}–{ts(c['in'] + c['dur'], False)}" for c in raws)
        rep.append(f"| {k} | {ts(o, False)}–{ts(ob, False)} | {ts(a, False)}–{ts(b, False)} | {raw_txt} |")
    rep.append(f"\nТекст: {text}\n")
open(f"{out}/shorts_report.md", "w").write("\n".join(rep) + "\n")
print("ok")
