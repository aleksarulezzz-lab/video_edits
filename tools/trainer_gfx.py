"""Place graphics events on the trainer timeline.

Events are anchored to phrases of the main recording (source seconds found by word search) and
mapped to the edit through src/data/edl.json, so re-cutting never desyncs the graphics.

usage: trainer_gfx.py <trainer dir>    writes src/data/gfx.json
"""
import json, re, sys

root = sys.argv[1]
W = [{"w": w["word"].strip(), "s": w["start"], "e": w["end"]} for s in json.load(open(f"{root}/transcript/raw.json")) for w in s["words"]]
clips = json.load(open(f"{root}/src/data/edl.json"))
items = json.load(open(f"{root}/src/data/items.json"))
norm = lambda x: re.sub(r"[^\wё]", "", x.lower().replace("ё", "е"))

def find(phrase, after=0.0):
    """Source start time of the first occurrence of phrase after the given source time."""
    ps = [norm(p) for p in phrase.split()]
    for i in range(len(W) - len(ps) + 1):
        if W[i]["s"] >= after and all(norm(W[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return W[i]["s"]
    raise SystemExit(f"phrase not found: {phrase!r} after {after}")

def T(src_t, src="main"):
    for c in clips:
        if c["src"] == src and c["in"] - 0.05 <= src_t < c["in"] + c["dur"]:
            return round(c["out"] + max(0, src_t - c["in"]), 3)
    # inside a cut: next kept moment
    nxt = [c["out"] for c in clips if c["src"] == src and c["in"] >= src_t]
    return round(min(nxt), 3) if nxt else None

ev = []
def add(kind, a, b=None, dur=None, **kw):
    ta = T(a)
    tb = T(b) if b is not None else ta + (dur or 3.0)
    ev.append({"kind": kind, "a": ta, "b": round(tb, 3), **kw})

# chapters: at the start of spec items that carry a chapter title
for k, it in enumerate([i for i in items if i["chapter"]]):
    ev.append({"kind": "chapter", "a": it["out"], "b": round(it["out"] + 2.2, 3), "title": it["chapter"], "n": k})

def thesis(text, phrase, after=0.0, dur=3.2, slot=0, hl=None):
    s = find(phrase, after)
    add("thesis", s, dur=dur, text=text, slot=slot, hl=hl or [])

# depth words behind the author (mattes rendered by trainer_matte.py for these source ranges)
for name, word, a, b in [("trenazher", "ТРЕНАЖЁР", 10.6, 13.6), ("magazin", "МАГАЗИН", 50.3, 53.3), ("olimp", "ОЛИМПИАДА", 278.5, 281.2),
                         ("chas", "ЧАС", 437.2, 440.0), ("besplatno", "БЕСПЛАТНО", 786.3, 789.0)]:
    ev.append({"kind": "depth", "a": T(a), "b": round(T(a) + (b - a) - 0.04, 3), "name": name, "word": word})

# block 1
thesis("Герой растёт вместе с ребёнком", "этот герой развивается", dur=3.6, hl=["растёт"])
add("broll", find("И плюс я добавила такую"), dur=2.6, src="kid1", at=1.0)
add("shop", find("и за эти копеечки"), find("И вот именно эту"))
thesis("Магазин отвлекает", "просто отвлекался на этот", dur=2.0, hl=["отвлекает"])
add("shop", find("сидел и выбирал"), find("Поэтому магазин я буду"), focus="buy")
thesis("Магазин — убираю", "Поэтому магазин я буду", dur=3.4, hl=["убираю"])
# block 2
add("about", find("Меня зовут Александра"), dur=5.0)
add("broll", find("для старшего я собрала"), dur=2.8, src="kid2", at=10.5)
# block 3: what matters to the son, items stack into a list
LIST3 = [("Магазин отвлекал", find("первых, как мы")), ("Режим тренера: сразу видно, верно ли", find("И плюс в этом режиме")),
         ("Отклик сразу — интереснее", find("И вот ребенку было интереснее")), ("Прогресс за день, а не за всё время", find("И третий момент"))]
ev.append({"kind": "list", "a": T(LIST3[0][1]), "b": T(find("Поэтому вот эти все")) + 3.0, "title": "Что важно сыну",
           "items": [{"text": t, "at": T(s)} for t, s in LIST3]})
add("summary", find("что ребёнку не нужно, чтобы было"), dur=5.5, text="Не красиво, а чтобы ничего не отвлекало")
# block 4
add("broll", find("Сын занимался по тренажеру"), dur=3.0, src="kid1", at=6.0)
thesis("Тренажёр проверял только ответ", "Мой тренажер проверял", dur=3.4, hl=["только", "ответ"])
thesis("На олимпиаде — баллы за решение", "Там баллы ставятся именно", dur=3.2, hl=["за", "решение"])
add("sheet", find("то есть за голый ответ"), find("И вот этому тренажер"))
thesis("Беру в доработку", "поэтому это я тоже возьму", dur=3.0, hl=["доработку"])
# block 5
thesis("10–15 минут в день — мало", "Мой ребёнок занимался буквально", dur=3.6, hl=["мало"])
add("broll", find("Но практика показала"), dur=3.0, src="kid2", at=12.5)
thesis("Только успевал разогнаться", "ребенок успевал только", dur=3.0)
thesis("Смотрим на эффективность", "А за ту эффективность", dur=3.4, hl=["эффективность"])
thesis("Час в день → постепенно больше", "И начинаем мы с часа", dur=3.8, hl=["постепенно"])
# block 6
add("alarm", find("Я решила сделать на тренажере"), find("Это ребенок, кстати"))
thesis("Будет: похвала и выбор — продолжить или закончить", "Это ребенок, кстати", dur=5.0, hl=["Будет:"])
thesis("Будет: итоги занятия", "А также еще, чтобы", dur=4.0, hl=["Будет:"])
add("screen", 576.0, 625.4)
ev.append({"kind": "screen_note", "a": T(find("Уже сейчас у меня")), "b": T(find("Уже сейчас у меня")) + 3.4, "text": "Уже есть: «Мой прогресс»"})
ev.append({"kind": "screen_note", "a": T(find("Именно это я и буду")), "b": T(find("Именно это я и буду")) + 3.6, "text": "Буду дорабатывать: итоги за день"})
add("broll", find("Таким образом, ребенок не занимается"), dur=3.0, src="kid1", at=10.0)
# block 7
thesis("Олимпиадные задачи сложнее школьных", "Олимпиадные задачи гораздо", dur=3.6, hl=["сложнее"])
thesis("Школьная ветка с опережением", "Но если добавить в тренажер", dur=4.0, hl=["опережением"])
add("branch", find("И уже с ней он"), dur=7.0)
# tier list
add("tier", find("Это те выводы"), dur=8.6)
# block 8
thesis("Добавлю проверку хода решения", "добавлю туда проверку", dur=3.6, hl=["Добавлю"])
thesis("Новые типы задач", "А также добавлю новые", dur=3.0)
thesis("Школьная ветка", "Также я добавлю школьную", dur=3.0)
thesis("Ссылка в описании", "Ссылка на тренажер будет", dur=3.0, hl=["описании"])
thesis("Бесплатно, без регистрации", "Регистрация для работы", dur=3.4, hl=["Бесплатно,"])
thesis("Данные только на вашем устройстве", "Тренажёр не собирает", dur=4.6, hl=["только"])
thesis("Обновления — по той же ссылке", "Все обновления будут", dur=3.6)
# block 9
thesis("Тренажёр под ваших учеников", "Если вы репетитор", dur=4.0, hl=["ваших"])
thesis("Вы видите прогресс ученика", "Ученик будет заниматься сам", dur=3.4, hl=["прогресс"])
thesis("Тренажёр · сайт · автоматизация", "И не только тренажер", dur=4.0)
thesis("Контакты — в описании", "Пишите мне", dur=3.4, hl=["описании"])
# block 10
thesis("Промпт — в Telegram, ссылка в описании", "положу промт", dur=4.4, hl=["Telegram,"])
thesis("В каком классе ваш ребёнок?", "А в комментариях напишите", dur=5.0, hl=["классе"])
thesis("Подписывайтесь на канал", "подписывайтесь на мой", dur=3.0)

ev.sort(key=lambda e: e["a"])
total = clips[-1]["out"] + clips[-1]["dur"]
json.dump({"total": total, "events": ev}, open(f"{root}/src/data/gfx.json", "w"), ensure_ascii=False, indent=0)
for e in ev:
    print(f"{e['a']:7.2f}-{e['b']:7.2f} {e['kind']:12s} {e.get('text') or e.get('title') or e.get('word') or e.get('src') or ''}")
