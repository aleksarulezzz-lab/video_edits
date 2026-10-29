"""Deliverable docs for the trainer video: SRT, YouTube chapters, Reels timecodes, montage map, cut list.

usage: trainer_docs.py <trainer dir> <out dir>
"""
import json, sys

root, out = sys.argv[1], sys.argv[2]
P = json.load(open(f"{root}/src/data/captions.json"))
clips = json.load(open(f"{root}/src/data/edl.json"))
items = json.load(open(f"{root}/src/data/items.json"))
gfx = json.load(open(f"{root}/src/data/gfx.json"))
reels = json.load(open(f"{root}/out/reels_times.json"))
W = [w for s in json.load(open(f"{root}/transcript/raw.json")) for w in s["words"]]

def srt(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
def mmss(t):
    m, s = divmod(int(t + 0.5), 60)
    return f"{m:02d}:{s:02d}"
def mmss1(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:04.1f}"

with open(f"{out}/subtitles.srt", "w") as f:
    for i, p in enumerate(P, 1):
        f.write(f"{i}\n{srt(p['start'])} --> {srt(p['end'])}\n{' '.join(w['w'] for w in p['words'])}\n\n")

BLOCKS = {1: "Магазин и герой", 2: "Кто я", 3: "Мнение главного пользователя", 4: "Олимпиада", 5: "Сколько заниматься", 6: "Как досидеть час",
          7: "Уверенность", 7.5: "Что сработало за месяц", 8: "Что дальше и где взять тренажёр", 9: "Репетиторам", 10: "Финал"}
starts = {}
for it in items:
    starts.setdefault(it["block"], it["out"])
chap = [(0.0, "Магазин и герой: одна вещь, которую сын попросил убрать")] + [(starts[b], BLOCKS[b]) for b in [2, 3, 4, 5, 6, 7, 8, 9, 10]]
with open(f"{out}/youtube_chapters.txt", "w") as f:
    f.write("\n".join(f"{mmss(t)} {name}" for t, name in chap) + "\n")

names = ["Магазин и герой", "Мнение сына", "Олимпиада", "Сколько заниматься", "Как досидеть час", "Уверенность", "Бесплатный тренажёр", "Репетиторам"]
def text_between(a, b):
    return " ".join(w["w"] for p in P for w in p["words"] if a - 0.01 <= w["s"] < b)
with open(f"{out}/reels_timecodes.md", "w") as f:
    f.write("# Фрагменты для Reels (таймкоды готового ролика)\n\nКаждый фрагмент начинается с первой фразы мысли и заканчивается её последним словом, без голосовых переходов к следующему блоку.\n\n| # | Тема | Начало | Конец | Длит. | Первая фраза | Последние слова |\n|---|---|---|---|---|---|---|\n")
    for k, ((a, b), nm) in enumerate(zip(reels, names), 1):
        txt = text_between(a, b).split()
        f.write(f"| {k} | {nm} | {mmss1(a)} | {mmss1(b)} | {b - a:.0f} с | {' '.join(txt[:8])}… | …{' '.join(txt[-6:])} |\n")

def src_text(a, b):
    return " ".join(w["word"].strip() for w in W if a - 0.05 <= w["start"] < b)
with open(f"{out}/montage_map.md", "w") as f:
    f.write("# «Месяц занятий на тренажёре» — монтажная карта (финал)\n\n")
    f.write(f"Длительность ролика: {gfx['total'] / 60:.1f} мин ({mmss(gfx['total'])}). Исходник 1440×800, 25 fps, 16:20.7 → вывод 1920×1080, 25 fps (обрезаны рамки созвона и плашка с именем).\n\n")
    f.write("| Ролик | Исходник | Блок | Содержание |\n|---|---|---|---|\n")
    for it in items:
        srcname = "запись" if it["src"] == "main" else ("сын: «что нравится»" if it["src"] == "kid4" else "сын: «что не нравится»")
        txt = src_text(it["a"], it["b"]) if it["src"] == "main" else "(ответ сына)"
        words = txt.split()
        short = " ".join(words[:10]) + (" … " + " ".join(words[-5:]) if len(words) > 15 else " " + " ".join(words[10:]))
        f.write(f"| {mmss1(it['out'])}–{mmss1(it['end'])} | {srcname} {mmss1(it['a'])}–{mmss1(it['b'])} | {BLOCKS[it['block']]} | {short.strip()} |\n")
    f.write("\n## Графика\n\n| Время | Элемент | Текст |\n|---|---|---|\n")
    kinds = {"chapter": "Отбивка главы + стеклянный переход", "thesis": "Тезис на стене", "depth": "Надпись за головой", "shop": "Скриншот магазина в окне со свечением",
             "broll": "Перебивка: сын за ноутбуком", "about": "Плашка «Кто я»", "list": "Список «Что важно сыну»", "summary": "Главный вывод", "sheet": "Иллюстрация «за что баллы»",
             "alarm": "Иллюстрация «будильник на час (в планах)»", "screen": "Скринкаст тренажёра в окне со свечением", "screen_note": "Подпись к скринкасту",
             "branch": "Схема «школьная ветка → олимпиада»", "tier": "Тир-лист «Что сработало за месяц»"}
    for e in gfx["events"]:
        txt = e.get("text") or e.get("title") or e.get("word") or ""
        if e["kind"] == "list":
            txt = "; ".join(i["text"] for i in e["items"])
        f.write(f"| {mmss1(e['a'])}–{mmss1(e['b'])} | {kinds[e['kind']]} | {txt} |\n")

# why each spoken stretch was cut (source seconds)
REASONS = [((0, 9.5), "неудачный первый дубль начала"), ((131, 134), "оговорка, сразу переговорено"), ((138, 151), "сокращение (вариант Б): подробный пример режима тренера"),
           ((160, 167), "сокращение (вариант Б): подсказки"), ((193, 200), "сокращение (вариант Б): подробности прогресса"), ((203, 220), "сокращение (вариант Б): подробности прогресса"),
           ((229, 249), "повтор: та же мысль сказана полнее сразу после"), ((320, 335), "дубль: переговорено правильно"), ((373, 381), "дубль: переговорено («второй недочёт»)"),
           ((389, 399), "дубль вопроса с оговоркой"), ((405, 420), "сокращение (вариант Б): «мне казалось… вопросов нет»"), ((449, 458.3), "сокращение (вариант Б): подробности эффективности"),
           ((535.7, 539.3), "оборванное «поэтому…»"), ((552, 577), "первый дубль фразы про «Мой прогресс»"), ((599.6, 617.5), "сокращение (вариант Б): точность, журнал ошибок, карта навыков"),
           ((625, 650.2), "первый дубль фразы «не в пустоту»"), ((709.7, 713.6), "оговорка «растяжку ему такую делать»"), ((806, 819.3), "сокращение (вариант Б): откуда новые типы задач"),
           ((847.4, 868), "сокращение (вариант Б): «возможно, ещё что-нибудь придумаю»"), ((887.9, 907.4), "повтор: «вы будете видеть прогресс»"),
           ((918.6, 935), "повтор приглашения написать"), ((968.9, 990), "тишина в конце (распознавание ошибочно «услышало» «Продолжение следует»)")]

# cut list: everything of the main recording that is not in the edit
kept = sorted((c["in"], c["in"] + c["dur"]) for c in clips if c["src"] == "main")
cuts, cur = [], 0.0
for a, b in kept:
    if a - cur > 0.25:
        cuts.append((cur, a))
    cur = max(cur, b)
cuts.append((cur, 980.72))
with open(f"{out}/cut_list.md", "w") as f:
    f.write("# Вырезанные фрагменты исходника\n\nПаузы внутри фраз длиннее 0,7 с сокращены до ~0,3 с; ниже — всё, что вырезано длиннее 0,25 с.\n\n| Исходник | Длит. | Что звучало | Почему |\n|---|---|---|---|\n")
    for a, b in cuts:
        txt = src_text(a, b)
        if len(txt.split()) <= 1:  # a single word at the edge comes from loose word timings: it is a pause
            txt = ""
        why = "пауза / тишина" if not txt else next((r for (x0, x1), r in REASONS if a < x1 and b > x0), "оговорка / обрывок слова")
        f.write(f"| {mmss1(a)}–{mmss1(b)} | {b - a:.1f} с | {txt[:160] + ('…' if len(txt) > 160 else '')} | {why} |\n")
print("docs ok", len(cuts), "cuts")
