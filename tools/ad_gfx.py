"""Graphics events of «Рекламный ролик без дизайнера», anchored to words of the recordings.

Every event is placed by a phrase of one source (main / dg / dp) and mapped to the edit through
src/data/edl.json. Times printed at the end are the edit timeline.

usage: ad_gfx.py <dir>    writes src/data/gfx.json
"""
import json, re, sys

root = sys.argv[1]
clips = json.load(open(f"{root}/src/data/edl.json"))
J = {"main": "raw", "dg": "dosyem_glaza", "dp": "dosyem_podpiska", "rh": "ready_horizontal"}
W = {k: [{"w": w["word"].strip(), "s": w["start"], "e": w["end"]} for s in json.load(open(f"{root}/transcript/{j}.json")) for w in s["words"]] for k, j in J.items()}
norm = lambda x: re.sub(r"[^\w]", "", x.lower().replace("ё", "е"))
LEAD = 0.25  # whisper places word starts a little early; graphics land on the sound

def find(src, phrase, after=0.0):
    ps = [norm(p) for p in phrase.split()]
    ws = W[src]
    for i in range(len(ws) - len(ps) + 1):
        if ws[i]["s"] >= after and all(norm(ws[i + k]["w"]).startswith(ps[k]) for k in range(len(ps))):
            return ws[i]["s"] + LEAD
    raise SystemExit(f"phrase not found in {src}: {phrase!r} after {after}")

def T(src, t):
    for c in clips:
        if c["src"] == src and c["in"] - 0.05 <= t < c["in"] + c["dur"]:
            return round(c["out"] + max(0, t - c["in"]), 3)
    nxt = [c for c in clips if c["src"] == src and 0 <= c["in"] - t < 2.0]
    if nxt:
        return round(min(nxt, key=lambda c: c["in"])["out"], 3)
    raise SystemExit(f"{src} {t} is not in the edit")

def at(src, phrase, after=0.0, d=0.0):
    return round(T(src, find(src, phrase, after)) + d, 3)

ev = []
def add(kind, a, b, **kw):
    ev.append({"kind": kind, "a": round(a, 3), "b": round(b, 3), **kw})
def rd(n_words):  # reading time rule from the brief
    return max(2.5, 1.5 + 0.4 * n_words)
def side(text, src, phrase, after=0.0, side="L", d=None, icon=None, big=False):
    a = at(src, phrase, after)
    add("side", a, a + (d or rd(len(text.split()))), text=text, side=side, icon=icon, big=big)
def stack(side_, items, end, **kw):
    """big plates piling up one by one: items = [(text, src, phrase, after)], end = edit time"""
    its = [{"text": tx, "at": at(sr, ph, af)} for tx, sr, ph, af in items]
    add("stack", its[0]["at"], end, side=side_, items=its, **kw)
def vis(side_, a, b, type_, **kw):
    add("vis", a, b, side=side_, type=type_, **kw)
def logo(name, src, phrase, after=0.0, side="R", d=2.6, label=None):
    a = at(src, phrase, after)
    add("logo", a, a + d, logo=name, side=side, label=label)

# chapter cards: full kraft sheet, step number + title (agreed with her); «Лайфхак» in the same style
for num, title, sub, src, ph, after, d in [("1", "Ищем референс", None, "main", "Пошла в Pinterest", 330, -0.6),
                                           ("2", "Пишем сценарий", None, "main", "После созвона", 399, -0.6),
                                           ("3", "Озвучка", None, "main", "Теперь текст у меня", 540, -0.6),
                                           (None, "Лайфхак", "текст для озвучки", "main", "Лайфхак", 560, -0.35),
                                           ("4", "Анимация в Claude", None, "main", "И вот теперь самое интересное", 582, -0.6),
                                           (None, "Что пошло не так", None, "main", "Теперь честно", 660, -0.6),
                                           ("5", "Вертикальная версия для рилс", None, "main", "А потом мне еще понадобилась", 740, -0.6),
                                           (None, "Где ещё пригодятся такие ролики", None, "dp", "Но реклама", 66, -0.6),
                                           (None, "Сколько на этом зарабатывают", None, "main", "А теперь про деньги", 985, -0.6)]:
    a = at(src, ph, after, d)
    add("step", a, a + 1.7, num=num, title=title, sub=sub, icon=None if num else ("!" if title == "Лайфхак" else "₽" if "зараб" in title else "✕" if "не так" in title else "★"))

# the price stands on the free wall in front of the author (a number behind her is not readable)


# ---- block 1: the finished ad, then the hook (plates left, pictures right) ----
oc = at("main", "посреди океана", 150, -0.6)
stack("L", [("Этот ролик сделала нейросеть", "main", "Вот этот ролик", 140), ("Ни одной программы для анимации", "main", "ни разу не эмоушн", 140),
            ("Ошибки нейросети — покажу", "main", "со всеми ошибками", 150)], oc)
a = at("main", "Вот этот ролик", 140)
vis("R", a, at("main", "со всеми ошибками", 150, -0.1), "video", file="media/rh.mp4", at=30.0, w=470, label="Сделано в Claude")
vis("R", at("main", "со всеми ошибками", 150), oc, "video", file="media/rh.mp4", at=60.0, w=470, label="Первая версия")
add("clip", oc, oc + 2.2, file="media/rh.mp4", at=64.4, mode="full", label="Первая версия: «ваш город» в океане")
a = at("main", "сколько можно зарабатывать", 155)
stack("L", [("Сколько платят на фрилансе", "main", "сколько можно зарабатывать", 155)], at("main", "Но сначала", 170, -0.1))
vis("R", a + 0.4, at("main", "Но сначала", 170, -0.1), "price", text="за ролик|3 000 – 5 000 ₽")

# ---- block 2: why the video (tight; the stitched speech is covered by pictures) ----
a = at("main", "Но сначала", 170)
stack("L", [("Зачем мне этот ролик?", "main", "Но сначала", 170)], at("main", "У меня есть нейроагент", 199, -0.1))
a = at("main", "У меня есть нейроагент", 199)
b = at("main", "Когда я рассказала", 228, -0.1)
stack("L", [("Мой нейроагент ищет клиентов", "main", "У меня есть нейроагент", 199)], b)
vis("R", a + 0.3, b, "inbox", title="Нейроагент", rows=["Ищет компании", "Готовит письма", "Каждое утро"])
c = at("main", "сколько времени у меня", 235)
stack("L", [("Рассказала в трекинг-группе", "main", "Когда я рассказала", 228)], c - 0.1)
vis("R", b + 0.3, c - 0.1, "video", file="broll/female-talking-on-a-video-call.mp4", at=2.0, w=470, label="Трекинг-группа")
d = at("main", "Я поняла", 255, -0.1)
stack("L", [("Вопросы участниц", "main", "сколько времени у меня", 235)], d)
add("vis", c, d, side="R", type="bubbles", items=[{"text": "Сколько времени уходит на одно письмо?", "at": c + 0.2},
                                                  {"text": "Можно искать в одном городе или стране?", "at": at("main", "можно ли как", 244)}])
e_ = at("main", "Поскольку я ни разу", 275, -0.1)
stack("L", [("Вопросы будут всегда", "main", "Я поняла", 255), ("Один ролик — ответы на все вопросы", "main", "зашиты все ответы", 265)], e_)
vis("R", at("main", "зашиты все ответы", 265), e_, "video", file="media/rh.mp4", at=40.0, w=470, label="Ответы — в ролике")
stack("L", [("Иду с идеей к нейросети", "main", "пошла с этой идеей", 276)], at("main", "Пошла в Pinterest", 330, -0.7))
vis("R", e_ + 0.3, at("main", "Пошла в Pinterest", 330, -0.7), "logo", logo="claude", label="Claude")

# ---- block 3: Pinterest, Save As Bot ----
a = at("main", "Пошла в Pinterest", 330, 0.8)
add("screen", a, at("main", "Мне понравился бумажный", 340, -0.2), file="sc/sc_pinterest.mp4", at=4.0, speed=1.6,
    crop=[0, 140, 1920, 840], label="Pinterest: поиск референса", logo="pinterest")
b = at("main", "Я скачала это видео", 355, -0.1)
stack("L", [("Бумажный коллаж", "main", "бумажный коллаж", 340), ("Рваные края", "main", "рваные края", 340), ("Вырезанные фото", "main", "вырезанные фото", 340),
            ("Надписи на полосках бумаги", "main", "надписи на полосках", 340)], at("main", "И важный момент", 349, -0.1), fs=46)
stack("L", [("Из референса — только стиль", "main", "брать только стиль", 350), ("Смыслы и тексты — мои", "main", "смыслы и тексты", 350)], b)
vis("R", at("main", "Мне понравился бумажный", 340), b, "phone", file="media/reference.mp4", at=0.0, w=300, label="Референс")
a = at("main", "я скачала это видео", 355)
nx = at("main", "После созвона", 399, -0.6)  # the chapter card comes right after
add("screen", a, a + 3.0, file="sc/sc_pinterest.mp4", at=42.0, speed=1.0, crop=[525, 0, 1395, 1080],
    label="Save As Bot: вставляю ссылку", logo="telegram")
add("screen", a + 3.0, nx, file="sc/sc_pinterest.mp4", at=69.3, speed=1.0, crop=[525, 0, 1395, 1080],
    label="Save As Bot: сохраняю видео", logo="telegram")

# ---- block 4: script ----
a = at("main", "просто надиктовала", 399, -0.2)
add("insert", a, a + 4.2, name="voice")
q1, q2, q3 = at("main", "Вопросы участниц", 419), at("main", "мысль о том", 419), at("main", "картинку идеального", 419)
a = at("main", "отдала в Клод", 420)
stack("L", [("Вопросы участниц", "main", "Вопросы участниц", 419), ("Реклама дорожает", "main", "мысль о том", 419), ("Идеальное утро", "main", "картинку идеального", 419)], a - 0.1)
add("vis", q1, q2 - 0.1, side="R", type="bubbles", items=[{"text": "Сколько времени на письмо?", "at": q1 + 0.1}, {"text": "А в моём городе?", "at": q1 + 0.8}])
vis("R", q2, q3 - 0.1, "tags", label="×2,5 за 3 года")
vis("R", q3, a - 0.1, "video", file="broll/a-productive-morning.mp4", at=1.0, w=470, label="Идеальное утро")
add("screen", a, at("main", "И сразу написала", 432, 1.8), file="sc/sc_claude_first.mp4", at=6.0, speed=1.0, crop=[440, 175, 1000, 815],
    label="Claude: сначала текст", logo="claude")
a = at("main", "потому что если она сразу", 449)
add("insert", a, a + 4.6, name="textvideo")
a = at("main", "нейросеть меня поправила", 466)
add("screen", a, at("main", "Поэтому мы сохранили", 489, 2.8), file="sc/sc_claude_first.mp4", at=21.0, speed=0.8,
    crop=[440, 395, 1000, 595], label="Claude: правка про «2–3% лимита»", logo="claude", zoom=[0.25, [460, 400, 700, 416]])
a = at("main", "цифра рекламы", 495)
add("clip", a, a + 4.2, file="media/rh.mp4", at=5.0, mode="window", label="×2,4 за 3 года (из ролика)")
stack("L", [("Цифра — из исследования", "main", "нашла исследование", 500)], at("main", "нашла исследование", 500, 3.0))

# ---- block 5: voice ----
a = at("main", "в сервисе Eleven", 549)
vis("R", a, a + 2.6, "logo", logo="elevenlabs", label="ElevenLabs")
a = at("main", "Нейросеть сразу подготовила", 562)
add("screen", a, at("main", "Числа были прописаны", 565, -0.15), file="sc/sc_elevenlabs.mp4", at=60.0, speed=1.0,
    crop=[300, 120, 1320, 820], label="ElevenLabs: текст для озвучки", logo="elevenlabs")
stack("L", [("Числа — словами", "main", "Числа были прописаны", 565), ("Claude → «Клод»", "main", "а название нейросети", 565),
            ("Лишний текст — сократила", "main", "Перед генерацией", 575)], at("main", "Перед генерацией", 575, 2.6))
lis = [c for c in clips if c["src"] == "el"][0]
add("broll", at("main", "Перед генерацией", 575, 2.6), lis["out"], file="broll/woman-putting-on-headphones.mp4", at=3.0)
# per-frame spectrum of the voice for the equaliser (28 log-spaced bands, 0..1)
import subprocess, numpy as np
sr = 22050
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", f"{root}/src/elevenlabs_voice.mp3", "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
edges = np.geomspace(90, 7000, 29)
fr = np.fft.rfftfreq(2048, 1 / sr)
bands = []
for k in range(int(round(lis["dur"] * 30)) + 1):
    c = int((lis["in"] + k / 30) * sr)
    seg = x[max(0, c - 1024): c + 1024]
    seg = np.pad(seg, (0, 2048 - len(seg))) * np.hanning(2048)
    mag = np.abs(np.fft.rfft(seg))
    bands.append([float(mag[(fr >= lo) & (fr < hi)].mean()) for lo, hi in zip(edges[:-1], edges[1:])])
db = 20 * np.log10(np.array(bands) + 1e-7)
top = np.percentile(db, 97, axis=0)  # per band: loudest moments reach the top
bands = np.clip((db - (top - 38)) / 38, 0, 1) ** 1.3
add("listen", lis["out"], lis["out"] + lis["dur"], lead="Вот что получилось:", voice="Nataly Vershinina · Calm & Friendly", bands=[[round(v, 2) for v in r] for r in bands.tolist()])

# ---- block 6: animation ----
a = at("main", "Дальше я отдала нейросети", 600)
add("screen", a, a + 4.0, file="sc/sc_claude_upload.mp4", at=2.0, speed=1.0, crop=[440, 175, 1000, 815],
    label="Claude: озвучка, фото, скрин", logo="claude")
a = at("main", "пишет код страницы", 607, -0.4)
add("broll", a, a + 2.2, file="broll/coding-on-a-laptop.mp4", at=2.0)
a = at("main", "двигаются по таймингу", 612)
add("insert", a, a + 5.4, name="codefilm")
stack("L", [("Русский текст — без ошибок", "main", "русский текст таким", 622)], at("main", "русский текст таким", 622, 3.0))
a = at("main", "Фото в костюме", 628)
add("clip", a, a + 3.6, file="media/rh.mp4", at=54.2, mode="window", label="Вырезанное фото с обводкой")
stack("L", [("Название компании замазано", "main", "в скрине письма замазала", 636)], at("main", "в скрине письма замазала", 636, 3.0))

# ---- block 7: mistakes ----
a = at("main", "Точка ваш город", 669)
add("clip", a, a + 2.4, file="media/rh.mp4", at=64.6, mode="window", label="Ошибка 1: город в океане", mark="circle")
add("insert", a + 2.4, a + 6.4, name="pin")
a = at("main", "А нейросеть составила надписи", 677)
add("clip", a, a + 4.4, file="media/rh.mp4", at=79.6, mode="window", label="Ошибка 2: надписи по старому тексту", mark="strike")
a = at("main", "хотела вести на переписку", 695, -0.5)
add("endcard", a, at("dg", "Теперь этот ролик", 42, 0.0))
a = at("dg", "Теперь этот ролик", 42)
add("clip", a, a + 3.6, file="media/rv.mp4", at=91.0, mode="phone", label="Исправлено: ссылка на канал")
stack("L", [("Контроль", "dg", "Но контроль", 73), ("Ваш вкус и визуал", "dg", "вкус остаются", 76), ("Проверка каждого кадра", "dg", "Смотрите и проверяйте", 78)],
      at("dg", "передать заказчику", 84, 0.9), fs=54, top=600)

# ---- block 8: vertical ----
a = at("main", "Поскольку ролик получился", 746)
add("broll", a, a + 2.8, file="broll/a-finger-scrolling-through-a-smartphone.mp4", at=2.0)
logo("claudecode", "main", "в режиме Клод Код", 770, label="Claude Code")
a = at("main", "в режиме Клод Код", 770, 1.4)
add("screen", a, a + 4.0, file="sc/sc_claudecode_vertical.mp4", at=8.5, speed=1.5, crop=[440, 180, 1380, 800],
    label="Claude Code: наработки", logo="claudecode")
stack("L", [("«Тот же ролик, только вертикальный»", "main", "напишите, что сделает", 787)], at("main", "напишите, что сделает", 787, 3.4))
a = at("main", "И открыла в Клод код", 803)
add("screen", a, a + 3.6, file="sc/sc_claudecode_vertical.mp4", at=18.0, speed=1.0, crop=[440, 180, 1380, 800],
    label="Claude Code: одна фраза", logo="claudecode")

# ---- block 9: summary, tier list over the frozen take ----
a = at("main", "И вот что получилось", 812, -0.2)
add("clip", a, at("dp", "на все это у меня", 9), file="media/rh.mp4", at=20.0, mode="pair", file2="media/rv.mp4", at2=20.0, label="YouTube + Reels")
a = at("dp", "на все это у меня", 9)
items = [("Pinterest: стиль", "pinterest"), ("Claude: сценарий и анимация", "claude"), ("ElevenLabs: голос", "elevenlabs"),
         ("Claude Code: вертикальная версия", "claudecode"), ("Время: ~1 час, из них 20 мин моих", "clock")]
t, its = a + 0.5, []
for text, ic in items:
    its.append({"text": text, "at": round(t, 3), "icon": ic})
    t += rd(len(text.split()))
add("tier", a, max(t + 3.5, at("dp", "полутораминутного", 25, 1.0)), title="Что понадобилось", items=its)
stack("L", [("Вопросы клиентов = сценарий", "dp", "Вопросы клиентов", 55)], at("dp", "Но реклама", 66, -0.7), fs=56, top=560)

# ---- block 10: reels ----
a = at("main", "можно разбавить видео", 925, -0.3)
add("broll", a, a + 2.6, file="broll/a-girl-presses-record-on-a-camera-and-begins-a-vlog.mp4", at=1.0)
a = at("main", "Например, если вы", 931)
add("insert", a, a + 6.5, name="split")
stack("L", [("Есть замысел", "main", "есть замысел", 970), ("Есть закадровый голос", "main", "есть однокадровый", 970), ("Остальное делает нейросеть", "main", "все остальное делает", 970)],
      at("main", "делает за вас нейросеть", 975, 1.3), fs=54)

# ---- block 11: money ----
a = at("main", "Я пошла на биржу", 1033)
add("screen", a, at("main", "Вот что я нашла", 1038, -0.1), file="sc/sc_freelance.mp4", at=7.0, speed=1.0, crop=[200, 170, 960, 540],
    label="Биржа фриланса: заказы", logo="fl", face_off=True)
a = at("main", "Вот что я нашла", 1038)
FL = "sc/sc_freelance.mp4"
its = [{"text": "Анимационный ролик 20–25 сек для сайта", "at": at("main", "Создание анимационного", 1040), "icon": "fl", "file": FL, "src": 16.5, "crop": [200, 150, 1000, 380]},
       {"text": "Моушн-дизайнер для рекламы и ИИ-креативов", "at": at("main", "Моушн -дизайнер для", 1046), "icon": "fl", "file": FL, "src": 20.5, "crop": [200, 150, 1100, 640]},
       {"text": "«Постоянный человек на анимации в Claude»", "at": at("main", "постоянный человек", 1053), "icon": "fl", "file": FL, "src": 31.0, "crop": [200, 150, 1000, 640]},
       {"text": "Медиана — 5 000 ₽ за ролик", "at": at("main", "такой ролик стоит", 1070), "icon": "flaks", "file": "sc/sc_flax_stats.mp4", "src": 30.0, "crop": [330, 210, 880, 700], "rate": 0.25}]
add("board", a, at("main", "И это ровно то", 1075, -0.1), title="Заказы на бирже", items=its)
a = at("main", "И это ровно то", 1075)
add("insert", a, a + 4.4, name="price")

# ---- block 12: guide and channel ----
a = at("main", "уже выложила гайд", 1120, -0.6)
add("guide", a, a + 7.0)
a = at("main", "ссылка будет в описании", 1230, -1.5)
add("plate", a, a + 5.0, text="t.me/zapuskator_A")

# her face stays in a circle next to a window only while her speech runs without a single cut;
# where the take is stitched together the window goes full size and the face goes away
joins = [c["out"] for c in clips[1:]]
for e in ev:
    if e["kind"] in ("screen", "clip", "endcard") and e.get("mode") != "full":
        e["face"] = not e.pop("face_off", False) and not any(e["a"] - 0.2 < j < e["b"] + 0.2 for j in joins)
ev.sort(key=lambda e: e["a"])
total = clips[-1]["out"] + clips[-1]["dur"]
json.dump({"total": total, "events": ev}, open(f"{root}/src/data/gfx.json", "w"), ensure_ascii=False, indent=0)
for e in ev:
    m, s = divmod(e["a"], 60)
    print(f"{int(m)}:{s:05.2f} {e['b'] - e['a']:4.1f}s {e['kind']:8s} {e.get('text') or e.get('title') or e.get('word') or e.get('name') or e.get('label') or e.get('logo') or e.get('file') or ''}")
