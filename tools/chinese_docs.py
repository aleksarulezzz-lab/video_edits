"""Deliverable docs for «Тренажёр по китайскому»: SRT, YouTube chapters, Reels timecodes, montage map, cut list.

usage: chinese_docs.py <dir> <out dir>
"""
import json, re, sys

root, out = sys.argv[1], sys.argv[2]
P = json.load(open(f"{root}/src/data/captions.json"))
clips = json.load(open(f"{root}/src/data/edl.json"))
items = json.load(open(f"{root}/src/data/items.json"))
gfx = json.load(open(f"{root}/src/data/gfx.json"))
W = [w for s in json.load(open(f"{root}/transcript/raw.json")) for w in s["words"]]
CW = [w for p in P for w in p["words"]]
total = gfx["total"]

def srt(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
def mmss(t):
    m, s = divmod(int(t + 0.5), 60)
    return f"{m:02d}:{s:02d}"
def mmss1(t):
    m, s = divmod(t, 60)
    return f"{int(m):02d}:{s:04.1f}"
norm = lambda x: re.sub(r"[^\w]", "", x.lower().replace("ё", "е"))

def at(phrase, after=0.0, end=False):
    """timeline time of a phrase in the captions: start of its first word, or end of its last"""
    ps = [norm(p) for p in phrase.split()]
    for i in range(len(CW) - len(ps) + 1):
        if CW[i]["s"] >= after and all(norm(CW[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return CW[i + len(ps) - 1]["e"] if end else CW[i]["s"]
    raise SystemExit(f"not found: {phrase}")

with open(f"{out}/subtitles.srt", "w") as f:
    for i, p in enumerate(P, 1):
        f.write(f"{i}\n{srt(p['start'])} --> {srt(p['end'])}\n{' '.join(w['w'] for w in p['words'])}\n\n")

BLOCKS = {1: "Сама не знаю китайский", 2: "Почему китайский", 3: "Иероглифы", 4: "Произношение", 5: "План дня", 6: "Герой и магазин",
          7: "Сколько заниматься", 8: "Итоги месяца", 9: "Что дальше", 10: "Где взять тренажёр и промпт"}
starts = {}
for it in items:
    starts.setdefault(it["block"], it["out"])
chap = [(0.0, "Я не знаю китайский, но сделала сыну тренажёр")] + [(starts[b], BLOCKS[b]) for b in range(2, 11)]
with open(f"{out}/youtube_chapters.txt", "w") as f:
    f.write("\n".join(f"{mmss(t)} {name}" for t, name in chap) + "\n")

REELS = [
    ("Я не знаю китайский, но сделала сыну тренажёр", 1, 0.0, at("что я сама не умею", 30, True)),
    ("Как ребёнок учится писать иероглифы на экране", 3, at("И первая задача", 80), at("делает сам тренажер", 110, True)),
    ("Как проверить произношение, если сама не знаешь языка", 4, at("С письмом разобрались", 125), at("правильности интонации", 170, True)),
    ("Почему младшему я сделала тренажёр в разы проще", 5, at("При этом младшему", 180), at("которые делал муж", 200, True)),
    ("У старшего магазин отвлекал, а младшего мотивирует", 6, at("А теперь самое интересное", 215), at("и его интересы", 240, True)),
    ("Час математики — много, а 4 часа игры — нормально?", 7, at("Кстати, про тренажер старшего", 285), at("план на день выполнен", 330, True)),
    ("Как дать ребёнку цель учить язык", 8, at("Но с другой стороны", 365), at("из следующих видео", 415, True)),
]
def text_between(a, b):
    return " ".join(w["w"] for w in CW if a - 0.01 <= w["s"] < b)
with open(f"{out}/reels_timecodes.md", "w") as f:
    f.write("# Фрагменты для Reels (таймкоды готового ролика)\n\nКаждый фрагмент начинается с первой фразы мысли и заканчивается её последним словом. "
            "Во фрагменте 3 есть вставка с сыном (152,1–159,3 с): он повторяет 眼睛 за тренажёром.\n\n"
            "| # | Тема | Блок | Начало | Конец | Длит. | Первые слова | Последние слова |\n|---|---|---|---|---|---|---|---|\n")
    for k, (nm, blk, a, b) in enumerate(REELS, 1):
        a, b = max(0.0, a - 0.15), min(total, b + 0.25)
        txt = text_between(a + 0.15, b - 0.25).split()
        f.write(f"| {k} | {nm} | {blk} | {mmss1(a)} | {mmss1(b)} | {b - a:.0f} с | {' '.join(txt[:7])}… | …{' '.join(txt[-5:])} |\n")

def src_text(a, b):
    return " ".join(w["word"].strip() for w in W if a - 0.05 <= w["start"] < b)

BROLL_SRC = {
    "broll/qianmen.mp4": ("Mixkit", "https://mixkit.co/free-stock-video/people-walking-in-the-qianmen-street-in-china-28611/", "Улица Цяньмэнь в Пекине"),
    "broll/calligraphy.mp4": ("Pexels", "https://www.pexels.com/video/9478319/", "Китайская каллиграфия кистью"),
    "broll/gamepad.mp4": ("Pexels", "https://www.pexels.com/video/8128031/", "Геймпад в руках"),
    "broll/dumplings.mp4": ("Pexels", "https://www.pexels.com/video/7299351/", "Дамплинги"),
    "media/son_IMG_6021.mp4": ("Своя съёмка", "папка «Сын», IMG_6021.MOV", "Сын за ноутбуком (карточка на стене)"),
    "media/son_IMG_6024.mp4": ("Своя съёмка", "папка «Сын», IMG_6024.MOV", "Сын за ноутбуком (карточка на стене)"),
}
FOCUS = {"write": "Цифровая пропись", "cards": "Карточки со словами", "listen": "Проверка произношения", "plan": "План дня", "shop": "Магазин", "hero": "Герой"}
kinds = {"chapter": "Отбивка главы (Liquid Glass) + музыкальная отбивка", "thesis": "Тезис на стене", "depth": "Надпись за спиной во всю ширину",
         "about": "Плашка «Александра Рулёва · сайты, боты и тренажёры с нейросетями»", "list": "Список", "tier": "Тир-лист «Что дальше»",
         "screen": "Скринкаст тренажёра", "broll": "B-roll", "pron": "Вставка: сын повторяет за тренажёром (IMG_6025, со звуком)"}

with open(f"{out}/montage_map.md", "w") as f:
    f.write("# «Тренажёр по китайскому» — монтажная карта (финал)\n\n")
    f.write(f"Длительность: {total / 60:.2f} мин ({mmss(total)}). Исходник OBS 1920×1080, 30 fps, 17:14 → вывод 1920×1080, 30 fps, H.264 CRF 18, AAC стерео, −14 LUFS.\n\n")
    f.write("## Склейки\n\n| Ролик | Источник | Блок | Содержание |\n|---|---|---|---|\n")
    for it in items:
        if it["src"] == "main":
            words = src_text(it["a"], it["b"]).split()
            short = " ".join(words[:10]) + (" … " + " ".join(words[-5:]) if len(words) > 15 else " " + " ".join(words[10:]))
            srcname = f"запись {mmss1(it['a'])}–{mmss1(it['b'])}"
        else:
            short, srcname = "сын повторяет 眼睛 (yǎn jing) за тренажёром, на экране перевод «глаза»", "IMG_6025.MOV 00:06.2–00:13.4"
        f.write(f"| {mmss1(it['out'])}–{mmss1(it['end'])} | {srcname} | {it['block']}. {BLOCKS[it['block']]} | {short.strip()} |\n")
    f.write("\n## Графика, скринкасты, B-roll\n\n| Время | Элемент | Текст / источник |\n|---|---|---|\n")
    for e in sorted(gfx["events"], key=lambda e: e["a"]):
        k = e["kind"]
        txt = e.get("text") or e.get("title") or e.get("word") or ""
        if k == "list":
            txt = f"{e['title']}: " + "; ".join(i["text"] for i in e["items"])
        if k == "chapter":
            txt = f"Глава {e['n'] + 3}: {e['title']} (музыка: Mixkit «A Decade in Beijing»)"
        if k == "screen":
            txt = f"{FOCUS[e['focus']]} — {'окно на стене' if e['mode'] == 'window' else 'на весь экран'}, неоновая рамка; скринкаст {mmss1(e['at'])}"
        if k == "broll":
            site, link, what = BROLL_SRC[e["file"]]
            txt = f"{what} — {site}: {link}"
        if k == "tier":
            txt = "ОСТАВЛЯЕМ / ДОБАВЛЯЕМ / НАД ЧЕМ РАБОТАЕМ"
        if k == "pron":
            txt = "眼睛 · yǎn jing — «глаза» (перевод с экрана тренажёра)"
        f.write(f"| {mmss1(e['a'])}–{mmss1(e['b'])} | {kinds[k]} | {txt} |\n")
    f.write("\n## Источники B-roll и музыки\n\n| Файл | Сайт | Ссылка | Лицензия |\n|---|---|---|---|\n")
    for fl, (site, link, what) in BROLL_SRC.items():
        lic = {"Mixkit": "Mixkit Free License", "Pexels": "Pexels License (бесплатно, без указания автора)"}.get(site, "собственная съёмка")
        f.write(f"| {what} | {site} | {link} | {lic} |\n")
    f.write("| Вставка с произношением | Своя съёмка | папка «Сын», IMG_6025.MOV | собственная съёмка |\n")
    f.write("| Фон: «Serene View» | Mixkit | https://mixkit.co/free-stock-music/chillout/ | Mixkit Free License |\n")
    f.write("| Отбивки: «A Decade in Beijing» | Mixkit | https://mixkit.co/free-stock-music/world/ | Mixkit Free License |\n")
    f.write("\nМузыка: фон ~21 дБ тише голоса, под отбивками глав и вставкой с сыном приглушается ещё сильнее. "
            "Имя ребёнка из приветствия героя в кадр не попадает: использованы только участки скринкаста без него.\n")

# cut list: everything of the main recording that is not in the edit
REASONS = [((0, 15.2), "до начала (настройка записи)"), ((29.2, 34.8), "обрывок фразы, переговорено"), ((48.5, 69.6), "сокращение: та же мысль сказана короче дальше"),
           ((108.4, 119.7), "связка убрана, сразу идёт ответ"), ((189, 204), "дубль («Давай переговорим»)"), ((210.9, 226.3), "дубль про карточки, служебная реплика"),
           ((233.2, 234.8), "служебная реплика"), ((278.7, 282), "обрывок фразы"), ((326, 333.8), "сокращение: пример про план дня"),
           ((343.9, 385.4), "первый дубль про магазин; взят переговорённый вариант с конца записи"), ((397, 406.1), "отступление «это я не зашивала»"),
           ((422.9, 439.3), "служебная реплика «Вот это не бери» и повтор"), ((446.8, 592.9), "первый дубль блока 7; из него взята только удачная фраза про 4 часа"),
           ((548.8, 592.9), "первый дубль блока 7"), ((617.1, 647.2), "сокращение: рассуждение про математику"), ((742.3, 747.8), "оговорка («на тяг Москва»), переговорено"),
           ((764.2, 776.4), "пауза"), ((786.7, 789.7), "сокращение"), ((833.7, 836.5), "пауза"), ((846.8, 857.4), "повтор про промпт"),
           ((869, 924.5), "тишина (распознавание ошибочно «услышало» «Продолжение следует»)"), ((940.4, 973.4), "служебная реплика к монтажу (про Reels)"),
           ((1020.2, 1035), "служебная реплика к монтажу")]
kept = sorted((c["in"], c["in"] + c["dur"]) for c in clips if c["src"] == "main")
cuts, cur = [], 0.0
for a, b in kept:
    if a - cur > 0.25:
        cuts.append((cur, a))
    cur = max(cur, b)
cuts.append((cur, W[-1]["end"] + 0.5))
with open(f"{out}/cut_list.md", "w") as f:
    f.write("# Вырезанные фрагменты исходника\n\nПаузы внутри фраз длиннее 0,7 с сокращены до ~0,3 с; ниже всё, что вырезано длиннее 0,25 с. "
            "Блок 6 стоит в монтаже раньше, чем записан: взят переговорённый дубль из конца записи (16:13–17:00).\n\n"
            "| Исходник | Длит. | Что звучало | Почему |\n|---|---|---|---|\n")
    for a, b in sorted(cuts):
        txt = src_text(a, b)
        if len(txt.split()) <= 1:
            txt = ""
        why = "пауза / тишина" if not txt else next((r for (x0, x1), r in REASONS if a < x1 - 0.2 and b > x0 + 0.2), "оговорка / сокращение")
        f.write(f"| {mmss1(a)}–{mmss1(b)} | {b - a:.1f} с | {txt[:160] + ('…' if len(txt) > 160 else '')} | {why} |\n")
print("docs ok", len(cuts), "cuts")
