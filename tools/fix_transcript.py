"""Apply manual spelling/recognition fixes to the Whisper transcript of the cut.

Fixes were checked against a second, independent transcription of the raw take.
Output keeps word timings: when a fix changes the token count, timings are spread
proportionally over the segment's original word span.
"""
import json, re, sys

FIXES = [
    (r"\bввести YouTube", "вести YouTube"),
    (r"ВКонтакте, Dzen", "ВКонтакте, Дзен"),
    (r"\bDzen\b", "Дзен"),
    (r"статью на Весеру", "статью на VC.ru"),
    (r"который видит блог", "который ведёт блог"),
    (r"транскрибировать", "транскрибировать"),
    (r"Сейчас я в джекте-чате работаю", "Сейчас я в ChatGPT работаю"),
    (r"Мне пишет подробный промт", "Мне пишет подробный промпт"),
    (r"Клод-код", "Claude Code"),
    (r"в Клод\b", "в Claude"),
    (r"Я монтируюсь с Клодом", "Я монтирую с Claude"),
    (r"Отдаете его Клоду", "Отдаёте его Claude"),
    (r"промт", "промпт"),
    (r"На блоке у вас словы уже видео и сценарии разрезаны", "На блоки у вас уже видео и сценарии разрезаны"),
    (r"если мы в Инстаграм, запрещенный в России", "либо, если мы в Instagram*, запрещённом в России"),
    (r"Когда вы работаете над форматов статьи", "Когда вы работаете над форматом статьи"),
    (r"просто говорите, не расти", "просто говорите нейросети"),
    (r"выложена на дзем", "выложена на Дзен"),
    (r"примежать", "перемежать"),
    (r"простая текста", "простыня текста"),
    (r"сходя из того", "исходя из того"),
    (r"полную структуру шагвы", "полную структуру шагов"),
    (r"ввести там сразу", "вести там сразу"),
    (r"во Вконтакте", "во ВКонтакте"),
    (r"Телеграм-канал", "Telegram-канал"),
    (r"телеграм-канале", "Telegram-канале"),
    (r"Телеграм\b", "Telegram"),
    (r"ваша целевую аудиторию", "вашей целевой аудитории"),
    (r"ваш целевую аудиторию", "вашей целевой аудитории"),
    (r"Instagram,", "Instagram*,"),
    (r"5 посредственных каких-то сценарий", "5 посредственных каких-то сценариев"),
    (r"каждую из тех площадок", "каждой из тех площадок"),
    (r"органический клиент", "органических клиентов"),
    (r"\bеще\b", "ещё"),
    (r"\bЕще\b", "Ещё"),
]

segs = json.load(open(sys.argv[1]))
out = []
for s in segs:
    text = s["text"]
    for pat, rep in FIXES:
        text = re.sub(pat, rep, text)
    toks = text.split()
    ws = s["words"]
    if len(toks) == len(ws):
        words = [{"start": w["start"], "end": w["end"], "word": t} for w, t in zip(ws, toks)]
    else:
        a, b = ws[0]["start"], ws[-1]["end"]
        L = sum(len(t) + 1 for t in toks)
        acc, words = 0, []
        for t in toks:
            st = a + (b - a) * acc / L
            acc += len(t) + 1
            words.append({"start": st, "end": a + (b - a) * acc / L, "word": t})
    out.append({"start": s["start"], "end": s["end"], "text": " ".join(toks), "words": words})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
