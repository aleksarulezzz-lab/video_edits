# video_edits

Монтажные проекты для YouTube-канала.

## content-week — «Как из одного длинного видео сделать контент на всю неделю»

Монтаж собран в [Remotion](https://www.remotion.dev/) (React): графика, субтитры, движения камеры и звуковые акценты описаны кодом.

* `content-week/src/plan.ts` — монтажный план: все вставки, приближения и скринкаст-зумы с таймкодами.
* `content-week/src/components/` — графика (`wall.tsx` — элементы на стене слева от автора, `graphics.tsx` — полноэкранные схемы и подписи на скринкастах).
* `content-week/src/data/` — фрагменты исходника (`edl.json`), сцены (`scenes.json`), субтитры (`captions.json`).
* `content-week/transcript/` — итоговая расшифровка (`transcript_final.srt/.txt`) и субтитры как на экране.
* `content-week/docs/` — монтажный отчёт, монтажный лист, список вставок, скринкасты и проверка конфиденциальности, источники.
* `tools/` — вспомогательные скрипты: расшифровка (faster-whisper), перенос авторского чернового монтажа на полную запись, синтез звуковых эффектов, субтитры.

### Как пересобрать

1. Положить рабочую копию исходника с размытой панелью ChatGPT в `content-week/public/media/raw_sanitized.mp4` (не хранится в git, команда ffmpeg — в `docs/montage_report.md`).
2. `cd content-week && npm install`
3. Предпросмотр: `npx remotion studio`. Рендер: `npx remotion render Main out/final.mp4 --crf=17`.
