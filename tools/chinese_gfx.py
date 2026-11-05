"""Place graphics events on the Chinese-trainer timeline.

Events are anchored to phrases of the main recording (source seconds found by word search) and
mapped to the edit through src/data/edl.json.

usage: chinese_gfx.py <dir>    writes src/data/gfx.json
"""
import json, re, sys

root = sys.argv[1]
W = [{"w": w["word"].strip(), "s": w["start"], "e": w["end"]} for s in json.load(open(f"{root}/transcript/raw.json")) for w in s["words"]]
clips = json.load(open(f"{root}/src/data/edl.json"))
items = json.load(open(f"{root}/src/data/items.json"))
norm = lambda x: re.sub(r"[^\wё]", "", x.lower().replace("ё", "е"))

def find(phrase, after=0.0):
    ps = [norm(p) for p in phrase.split()]
    for i in range(len(W) - len(ps) + 1):
        if W[i]["s"] >= after and all(norm(W[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return W[i]["s"]
    raise SystemExit(f"phrase not found: {phrase!r} after {after}")

def T(src_t):
    for c in clips:
        if c["in"] - 0.05 <= src_t < c["in"] + c["dur"]:
            return round(c["out"] + max(0, src_t - c["in"]), 3)
    # inside a shortened pause: the next kept moment, if it is close
    nxt = [c for c in clips if 0 <= c["in"] - src_t < 1.5]
    if nxt:
        return round(min(nxt, key=lambda c: c["in"])["out"], 3)
    raise SystemExit(f"source time {src_t} is not in the edit")

ev = []
def add(kind, src_a, dur, **kw):
    a = T(src_a)
    ev.append({"kind": kind, "a": a, "b": round(a + dur, 3), **kw})
def thesis(text, phrase, after=0.0, dur=3.2, hl=None):
    add("thesis", find(phrase, after), dur, text=text, hl=hl or [])

for k, it in enumerate([i for i in items if i["chapter"]]):
    ev.append({"kind": "chapter", "a": it["out"], "b": round(it["out"] + 2.0, 3), "title": it["chapter"], "n": k})

# words behind the author, full width (mattes from tools/chinese_matte.py: name -> source range)
DEPTH = [("kitayskiy", "КИТАЙСКИЙ", 15.9, 18.6), ("ieroglify", "ИЕРОГЛИФЫ", 150.1, 152.8), ("intonaciya", "ИНТОНАЦИЯ", 251.3, 253.9),
         ("magazin", "МАГАЗИН", 975.3, 977.6), ("chasy", "4 ЧАСА ИГРЫ", 545.9, 548.8), ("chestno", "ЧЕСТНО", 682.9, 685.6),
         ("kafe", "КИТАЙСКОЕ КАФЕ", 729.3, 731.8)]
for name, word, a, b in DEPTH:
    ev.append({"kind": "depth", "a": T(a + 0.1), "b": round(T(a + 0.1) + (b - a) - 0.25, 3), "name": name, "word": word, "src_a": a})

# screencast pieces: (phrase, after, duration, screen start s, mode, focus)
SCREEN = [
    ("помешало мне сделать", 0, 3.4, 13.5, "window", "write"),        # hook: a character being drawn, in the first 15 s
    ("Сначала иероглиф появляется", 160, 15.0, 8.0, "full", "write"),
    ("А ещё есть карточки", 226, 6.6, 72.0, "full", "cards"),
    ("Поэтому тренажер сначала сам", 255, 5.0, 60.0, "window", "listen"),
    ("у него есть план дня", 318, 4.6, 52.6, "window", "plan"),
    ("Ему наоборот очень нравится", 995, 4.4, 105.6, "window", "shophero"),
    ("магазин, когда он может", 390, 5.0, 100.4, "full", "shop"),
    ("нравится увидеть план", 406, 4.6, 110.4, "window", "plan"),
    ("скромный на вид", 776, 3.0, 49.6, "window", "hero"),
]
for ph, after, dur, s0, mode, focus in SCREEN:
    add("screen", find(ph, after), dur, at=s0, mode=mode, focus=focus)

# b-roll, used sparingly: stock (full frame) and the son at the laptop (vertical card on the wall)
BROLL = [
    ("в тренде все китайское", 130, 3.0, "broll/qianmen.mp4", 1.0, "full"),
    ("и получается, как в прописи", 182, 3.0, "broll/calligraphy.mp4", 6.0, "full"),
    ("доходит до компьютерных игр", 612, 3.0, "broll/gamepad.mp4", 2.0, "full"),
    ("именно лексику, связанную с едой", 730, 3.0, "broll/dumplings.mp4", 0.5, "full"),
    ("что хочу учить", 69, 2.6, "media/son_IMG_6021.mp4", 3.0, "card"),
    ("Вспомнит, садится", 687, 3.4, "media/son_IMG_6024.mp4", 1.0, "card"),
]
for ph, after, dur, f, at, mode in BROLL:
    add("broll", find(ph, after), dur, file=f, at=at, mode=mode)

# block 1: the three things this video answers
LIST1 = [("Писать и произносить то, чего не знаю сама", find("как научить ребенка писать", 93)),
         ("Магазин: отвлекал одного — мотивирует другого", find("почему магазин который", 93)),
         ("Нравится, но не каждый день", find("и что делать если", 93))]
ev.append({"kind": "list", "a": T(LIST1[0][1]) - 0.4, "b": T(find("не каждый день", 100)) + 1.4, "title": "За месяц я поняла",
           "items": [{"text": t, "at": T(s)} for t, s in LIST1]})

thesis("Сама не знаю китайский", "а еще я не умею", 15, dur=3.0, hl=["китайский"])
thesis("«Мам, сделай мне тоже»", "мам, я только хочу", 40, dur=3.2, hl=["тоже»"])
thesis("9 лет · 3 класс · с нуля", "ему 9 лет", 74, dur=4.6, hl=["с", "нуля"])
add("about", find("Я, Александра Рулева", 110), 4.4)
thesis("Мечта мужа: учёба в Китае", "и в перспективе мой муж", 130, dur=3.6, hl=["Китае"])
thesis("Цифровая пропись", "сделала в тренажере цифровую", 157, dur=2.6, hl=["пропись"])
thesis("Смотрит → повторяет рукой", "Сначала он смотрит", 182, dur=2.8, hl=["рукой"])
thesis("Тренажёр проверяет произношение", "И тренажер проверяет", 262, dur=3.4, hl=["произношение"])
thesis("Идея мужа", "потом муж посмотрел", 270, dur=2.8, hl=["мужа"])
thesis("Проще, чем у старшего", "который намного проще", 299, dur=3.0, hl=["Проще,"])
thesis("Собрала за несколько запросов", "И сам тренажер я собрала", 333, dur=3.4, hl=["несколько"])
thesis("Старшего магазин отвлекал", "Через месяц сын попросил", 989, dur=3.0, hl=["отвлекал"])
thesis("Младшего — мотивирует", "С младшим же ситуация", 993, dur=2.2, hl=["мотивирует"])
thesis("Под конкретного ребёнка", "нужно под конкретного", 1012, dur=3.4, hl=["конкретного"])
thesis("Час математики — много?", "что час математики", 602, dur=3.4, hl=["много?"])
thesis("Полчаса → пауза → ещё полчаса", "он занимается полчаса", 647, dur=4.0, hl=["пауза"])
thesis("Занимается не каждый день", "заниматься он не каждый", 683, dur=1.5, hl=["не", "каждый"])
thesis("Цель: заказать в кафе по-китайски", "чтобы ты мог узнать", 730, dur=4.2, hl=["по-китайски"])
thesis("Ссылка в описании", "Ссылка на тренажер будет", 802, dur=3.0, hl=["описании"])
thesis("Тренажёр под ваших учеников", "А если вы репетитор", 810, dur=3.6, hl=["учеников"])
thesis("Промпт в Telegram", "там же я размещу", 836, dur=3.4, hl=["Telegram"])
thesis("Какой язык учит ваш ребёнок?", "Напишите мне в комментариях", 920, dur=4.0, hl=["язык"])

# tier list on "А пока расскажу, что буду дорабатывать"
add("tier", find("а пока расскажу", 755), 4.1)

ev.sort(key=lambda e: e["a"])
total = clips[-1]["out"] + clips[-1]["dur"]
json.dump({"total": total, "events": ev}, open(f"{root}/src/data/gfx.json", "w"), ensure_ascii=False, indent=0)
for e in ev:
    print(f"{e['a']:7.2f}-{e['b']:7.2f} {e['kind']:8s} {e.get('text') or e.get('title') or e.get('word') or e.get('file') or e.get('focus') or ''}")
