/**
 * Edit plan: every graphic, camera move and side-panel split, in output seconds.
 * Output time equals the author's own cut (1022.mp4), so cue times come straight
 * from its transcript (transcript/transcript_fixed.json).
 */

export type Overlay = {
  a: number;
  b: number;
  kind: string;
  props?: Record<string, unknown>;
  /** covers the footage completely (subtitles move to the graphic layout) */
  full?: boolean;
  sfx?: "whoosh" | "pop" | "click" | "swell" | "none";
};

export type CamMove = { a: number; b: number; zoom: number; ox?: number; oy?: number; ramp?: number };
export type ScreenKey = {
  a: number;
  b: number;
  rect?: [number, number, number, number]; // raw-pixel area to fill the window
  hl?: [number, number, number, number]; // raw-pixel area to highlight (rest dimmed)
  ramp?: number;
};

// ---------------- talking-head camera ----------------
export const camMoves: CamMove[] = [
  { a: 23.8, b: 26.2, zoom: 1.2 }, // «Как тебе такой план?»
  { a: 41.0, b: 44.0, zoom: 1.18 }, // «самым утомительным…»
  { a: 94.0, b: 105.0, zoom: 1.15, ramp: 1.2 },
  { a: 138.2, b: 143.6, zoom: 1.22 }, // «Но есть важный нюанс»
  { a: 244.0, b: 247.6, zoom: 1.2 }, // «финальный результат проверяю сама»
  { a: 538.7, b: 543.0, zoom: 1.2 }, // «Но здесь есть момент»
  { a: 574.8, b: 577.6, zoom: 1.16 },
  { a: 868.0, b: 872.2, zoom: 1.18 }, // «финальное решение… принимайте вы»
  { a: 886.3, b: 889.6, zoom: 1.2 }, // «Ещё один важный момент»
  { a: 941.0, b: 948.0, zoom: 1.14, ramp: 1.0 },
  { a: 964.4, b: 968.2, zoom: 1.18 },
  { a: 990.0, b: 996.0, zoom: 1.14, ramp: 1.0 },
  { a: 1102.4, b: 1107.1, zoom: 1.15 },
];

// ---------------- screen recordings ----------------
const CHAT_INPUT: [number, number, number, number] = [280, 560, 1120, 340];
const CHAT_TEXT: [number, number, number, number] = [330, 30, 1000, 625];
export const screenKeys: ScreenKey[] = [
  { a: 257.9, b: 266.2, rect: [180, 90, 1080, 675] }, // YouTube search
  { a: 268.2, b: 311.6, rect: [150, 130, 1150, 719] }, // results list while reading numbers
  { a: 341.0, b: 345.8, rect: [400, 200, 640, 520] }, // share → copy link
  { a: 364.8, b: 376.4, rect: [700, 140, 740, 760], hl: [905, 225, 530, 640] }, // YouTube Summary panel
  { a: 379.5, b: 419.8, rect: CHAT_INPUT }, // dictating the analysis prompt
  { a: 479.0, b: 508.0, rect: CHAT_TEXT }, // AI analysis
  { a: 645.0, b: 672.8, rect: CHAT_INPUT }, // dictating the 5-Reels prompt
  { a: 674.0, b: 688.6, rect: CHAT_TEXT }, // 5 Reels scripts
  { a: 708.6, b: 721.6, rect: CHAT_INPUT }, // dictating the edit prompt
  { a: 723.6, b: 746.0, rect: CHAT_TEXT }, // ready prompt for Claude
  { a: 1031.0, b: 1033.6, rect: [240, 170, 960, 600], hl: [262, 412, 896, 124] }, // Studio: «Похожие видео»
  { a: 1033.6, b: 1037.0, rect: [240, 170, 960, 600], ramp: 0.3 }, // picking the long video
  { a: 1037.0, b: 1038.3, rect: [240, 170, 960, 600], hl: [262, 412, 896, 124], ramp: 0.3 }, // row now filled
];

// ---------------- head framed left + side panel ----------------
// The author stays full-frame; graphics sit on the wall to her left (see components/wall.tsx).
export const splits: { a: number; b: number }[] = [];

const it = (t: number, text: string, extra: Record<string, unknown> = {}) => ({ t, text, ...extra });

// ---------------- graphics ----------------
export const overlays: Overlay[] = [
  // HOOK
  {
    a: 1.3, b: 8.2, kind: "PlatformsRow", sfx: "pop",
    props: { items: [{ t: 1.55, id: "youtube" }, { t: 2.5, id: "instagram" }, { t: 3.1, id: "telegram" }, { t: 3.6, id: "vk" }, { t: 4.3, id: "dzen" }], dailyAt: 6.0 },
  },
  { a: 2.4, b: 8.6, kind: "Disclaimer", sfx: "none" },
  { a: 10.2, b: 19.3, kind: "OneToMany", full: true, sfx: "whoosh", props: { longAt: 10.25, splitAt: 13.7, postsAt: 15.1, articlesAt: 17.0 } },
  { a: 31.4, b: 36.4, kind: "Roadmap", sfx: "click", props: { items: [{ t: 31.68, label: "Идея" }, { t: 32.16, label: "Сценарий" }, { t: 33.16, label: "Готовые публикации" }] } },
  {
    a: 37.0, b: 41.0, kind: "WallCompare", sfx: "none",
    props: { left: { t: 37.3, title: "Что делегировать нейросети", color: "#8EA6FF" }, right: { t: 39.6, title: "Что оставить за собой", color: "#FF5A36" } },
  },
  // PROBLEM → APPROACH
  { a: 48.3, b: 52.9, kind: "Kinetic", sfx: "none", props: { items: [it(48.5, "Регулярно"), it(49.5, "Постоянно"), it(51.4, "Продолжительное время", { accent: true })] } },
  {
    a: 55.6, b: 70.0, kind: "Compare", full: true, sfx: "whoosh",
    props: {
      heading: { t: 55.7, text: "другой подход" },
      left: { t: 56.2, title: "Каждая единица контента — отдельно", color: "#9AA0AA" },
      right: { t: 59.0, title: "Одна система и одна исходная единица", color: "#FF5A36", items: [it(65.7, "размножается в разных форматах"), it(67.3, "под площадки, которые ведёшь")] },
    },
  },
  { a: 71.8, b: 84.0, kind: "CopyVsAdapt", full: true, sfx: "whoosh", props: { copyAt: 72.3, crossAt: 74.6, adaptAt: 76.8 } },
  { a: 85.0, b: 92.5, kind: "LowerThird", sfx: "whoosh", props: { name: "Александра Рулёва", role: "маркетолог, продюсер · 5+ лет в онлайн-проектах" } },

  // STEP 1 — what to get out of one topic
  { a: 112.7, b: 116.0, kind: "SectionTitle", sfx: "swell", props: { step: "Шаг 1", title: "Определяю, что хочу получить на выходе" } },
  {
    a: 116.5, b: 138.0, kind: "SideList", sfx: "none",
    props: {
      title: "тема: контент на неделю из одного видео",
      items: [it(125.8, "Длинное видео на YouTube", { badge: "youtube" }), it(127.8, "5 вертикальных роликов"), it(132.9, "Посты в Telegram и ВКонтакте", { badge: "telegram" }), it(135.3, "Статья для Дзена", { badge: "dzen" }), it(136.2, "Статья на VC.ru", { badge: "vc" })],
      check: true,
    },
  },
  {
    a: 144.0, b: 186.2, kind: "SideList", sfx: "none",
    props: {
      title: "задача каждого формата",
      check: true,
      items: [
        it(144.1, "YouTube", { badge: "youtube", sub: "полностью раскрывает тему" }),
        it(147.6, "Короткие ролики", { sub: "цепляют одной мыслью, ошибкой или приёмом" }),
        it(156.8, "Telegram", { badge: "telegram", sub: "продолжает разговор, даёт полезные материалы" }),
        it(167.7, "Текстовые посты", { sub: "раскрывают отдельные мысли" }),
        it(172.6, "Статьи", { badge: "dzen", sub: "можно найти через поиск и перечитать" }),
      ],
      footer: { t: 181.8, text: "статьи индексируются и приводят клиентов" },
    },
  },
  {
    a: 189.3, b: 194.9, kind: "SystemFlow", full: true, sfx: "whoosh",
    props: { tiers: [{ t: 189.6, title: "Одно длинное видео", kind: "long" }, { t: 190.5, title: "Смысловые фрагменты", kind: "frag" }, { t: 191.4, title: "Короткие видео и тексты", kind: "formats" }, { t: 192.3, title: "Несколько площадок", kind: "platforms" }] },
  },

  // STEP 2 — topic and structure
  { a: 194.7, b: 197.9, kind: "SectionTitle", sfx: "swell", props: { step: "Шаг 2", title: "Выбираю тему и собираю структуру" } },
  { a: 198.0, b: 212.6, kind: "SideList", props: { title: "сначала определяю", numbered: true, items: [it(198.04, "Для кого ролик"), it(199.28, "Какую проблему решаю"), it(201.34, "Что зритель получит в конце")] } },
  {
    a: 213.6, b: 232.9, kind: "SideList",
    props: { title: "структура видео", numbered: true, items: [it(215.44, "Проблема", { sub: "в которой зритель узнаёт себя" }), it(218.6, "Обещание результата"), it(220.68, "Пошаговая демонстрация"), it(224.0, "Примеры и нюансы"), it(229.7, "Инструмент", { sub: "который зритель заберёт себе" })] },
  },
  {
    a: 233.4, b: 247.8, kind: "SideList",
    props: {
      title: "с чем помогает нейросеть", titleColor: "#8EA6FF", check: true,
      items: [it(236.98, "Проверить структуру", { color: "#8EA6FF" }), it(238.28, "Найти пропущенные шаги", { color: "#8EA6FF" }), it(240.32, "Найти слабые места", { color: "#8EA6FF" }), it(241.5, "Сделать объяснение понятнее", { color: "#8EA6FF" })],
      footer: { t: 244.2, text: "финальный результат проверяю сама" },
    },
  },
  { a: 254.4, b: 257.4, kind: "SectionTitle", sfx: "swell", props: { step: "Лайфхак", title: "Где искать тему для видео" } },
  // YouTube search screencast
  { a: 271.0, b: 279.4, kind: "NoteChip", sfx: "click", props: { text: "22 тыс. просмотров" } },
  { a: 280.6, b: 286.6, kind: "NoteChip", sfx: "click", props: { text: "41 тыс. подписчиков на канале" } },
  { a: 303.0, b: 308.3, kind: "NoteChip", sfx: "click", props: { text: "86 тыс. просмотров" } },
  { a: 308.5, b: 312.4, kind: "NoteChip", sfx: "click", props: { text: "20 тыс. подписчиков" } },
  {
    a: 312.6, b: 338.6, kind: "ViewsVsSubs", full: true, sfx: "whoosh",
    props: { full: true, views: "86 тыс.", subs: "20 тыс.", viewsN: 86, subsN: 20, at: 313.2, verdictAt: 319.9, verdict: "Просмотров больше, чем подписчиков — видео зацепило аудиторию" },
  },
  { a: 367.6, b: 375.8, kind: "NoteChip", sfx: "click", props: { text: "Плагин YouTube Summary → транскрипция" } },
  {
    a: 384.0, b: 419.6, kind: "PromptCard", sfx: "pop",
    props: { place: "screen", title: "промпт голосом", items: [it(387.96, "Проанализируй транскрибацию видео"), it(394.5, "Почему оно набрало 86 тыс. просмотров при 20 тыс. подписчиков?"), it(403.66, "Выдели структуру и сильные моменты"), it(413.22, "Дай рекомендации для моего видео")] },
  },
  { a: 432.8, b: 438.6, kind: "Kinetic", props: { items: [it(433.0, "Не копировать"), it(433.88, "дословно", { accent: true })] } },
  {
    a: 450.8, b: 466.0, kind: "SideList",
    props: { title: "чужое видео — это", check: true, items: [it(451.6, "Пример подачи темы"), it(454.26, "С автором можно не согласиться"), it(457.2, "Ваш взгляд на проблему")], footer: { t: 463.7, text: "об этом и говорите в своём видео" } },
  },
  { a: 485.3, b: 488.6, kind: "NoteChip", sfx: "click", props: { text: "Понятная практическая выгода", color: "#8EA6FF" } },
  { a: 488.8, b: 497.9, kind: "NoteChip", sfx: "click", props: { text: "Повод остаться в первые 30 секунд", color: "#8EA6FF" } },
  { a: 498.2, b: 503.4, kind: "NoteChip", sfx: "click", props: { text: "Автор постоянно доказывает", color: "#8EA6FF" } },
  { a: 503.7, b: 507.8, kind: "NoteChip", sfx: "click", props: { text: "Сравнение", color: "#8EA6FF" } },

  // STEP 3 — script
  { a: 514.6, b: 517.9, kind: "SectionTitle", sfx: "swell", props: { step: "Шаг 3", title: "Сценарий с нейросетью" } },
  {
    a: 518.2, b: 534.6, kind: "WallPrompt",
    props: { title: "промпт для сценария", items: [it(520.22, "Помоги разработать сценарий моего видео"), it(526.8, "Моё видео будет отличаться тем, что…"), it(531.0, "…и дальше — о чём хотите рассказать")] },
  },
  { a: 549.5, b: 562.9, kind: "FiveLines", full: true, sfx: "whoosh", props: { barAt: 549.5, splitAt: 557.74, outAt: 560.2, label: "5 смысловых линий → 5 роликов" } },
  // STEP 4 — recording
  { a: 563.3, b: 566.6, kind: "SectionTitle", sfx: "swell", props: { step: "Шаг 4", title: "Записываю длинное видео целиком" } },
  // STEP 5 — five shorts
  { a: 577.8, b: 581.2, kind: "SectionTitle", sfx: "swell", props: { step: "Шаг 5", title: "Пять коротких роликов" } },
  {
    a: 586.8, b: 599.2, kind: "SideList",
    props: { title: "зритель Reels не видел длинное видео", check: true, items: [it(594.58, "Собственная логика"), it(595.72, "Зацепка"), it(596.32, "Одна конкретная мысль"), it(598.36, "Понятное завершение")] },
  },
  {
    a: 609.0, b: 619.0, kind: "SideList",
    props: { title: "критерии для нейросети", titleColor: "#8EA6FF", check: true, items: [it(614.28, "Решает отдельную проблему", { color: "#8EA6FF" }), it(616.18, "Понятен без контекста", { color: "#8EA6FF" }), it(617.84, "Даёт причину посмотреть", { color: "#8EA6FF" })] },
  },
  {
    a: 619.4, b: 629.2, kind: "SideList",
    props: { title: "дальше — моя работа", numbered: true, items: [it(620.02, "Проверяю фрагменты"), it(621.52, "Вырезаю лишнее"), it(624.45, "Дописываю начало и конец"), it(627.14, "Адаптирую под вертикаль")] },
  },
  {
    a: 629.6, b: 641.2, kind: "WallCompare", sfx: "none",
    props: {
      left: { t: 629.8, title: "Нейросеть", color: "#8EA6FF", items: [it(630.06, "находит фрагменты"), it(631.46, "готовит субтитры"), it(632.78, "ускоряет рутину")] },
      right: { t: 634.7, title: "Вы", color: "#FF5A36", items: [it(636.28, "интересен ли фрагмент"), it(638.66, "понятна ли мысль")] },
    },
  },
  {
    a: 648.0, b: 672.8, kind: "PromptCard", sfx: "pop",
    props: { place: "screen", title: "промпт голосом", items: [it(648.7, "На основе сценария длинного видео"), it(655.4, "подготовь 5 сценариев Reels"), it(661.5, "каждый понятен без длинного видео"), it(665.3, "с зацепкой и завершённой мыслью")] },
  },
  { a: 674.6, b: 680.6, kind: "NoteChip", sfx: "click", props: { text: "5 сценариев Reels" } },
  { a: 704.0, b: 708.2, kind: "NoteChip", sfx: "click", props: { text: "Монтирую с Claude · подписка $20" } },
  {
    a: 709.0, b: 721.6, kind: "PromptCard", sfx: "pop",
    props: { place: "screen", title: "промпт голосом", items: [it(709.4, "Подготовь промпт для монтажа коротких видео"), it(717.7, "Исходник лежит в «Загрузках», в папке «Монтаж»")] },
  },
  { a: 728.4, b: 733.0, kind: "NoteChip", sfx: "click", props: { text: "Готовый промпт → Claude Code" } },

  // STEP 6 — text formats
  { a: 757.9, b: 762.4, kind: "Kinetic", props: { size: 80, items: [it(758.4, "1 длинное видео"), it(760.3, "5 коротких роликов", { accent: true })] } },
  { a: 762.6, b: 765.9, kind: "SectionTitle", sfx: "swell", props: { step: "Шаг 6", title: "Текстовые форматы" } },
  {
    a: 772.2, b: 820.6, kind: "SideList",
    props: {
      title: "тексты из того же сценария", check: true,
      items: [it(774.8, "Посты — сколько нужно", { badge: "telegram" }), it(785.36, "5 постов из 5 сценариев"), it(788.04, "Карусели в Instagram*", { badge: "instagram" }), it(794.98, "Статья для Дзена", { badge: "dzen", sub: "с запросами вашей аудитории" })],
      footer: { t: 812.58, text: "статью — с картинками и скриншотами" },
    },
  },
  { a: 787.6, b: 794.2, kind: "Disclaimer", sfx: "none" },
  { a: 824.5, b: 833.8, kind: "Quote", full: true, sfx: "whoosh", props: { full: true, lines: [it(824.88, "Нейросеть освобождает от рутины,"), it(827.6, "но не от необходимости думать.", { accent: true })] } },
  { a: 836.2, b: 849.4, kind: "Roadmap", sfx: "click", props: { items: [{ t: 836.41, label: "Видео без структуры" }, { t: 844.56, label: "5 посредственных роликов" }] } },
  {
    a: 851.0, b: 862.2, kind: "SideList",
    props: { title: "хорошее исходное видео", check: true, items: [it(851.06, "Понятная тема"), it(857.1, "Польза для зрителя"), it(859.96, "Результат, который можно повторить")] },
  },
  { a: 929.7, b: 941.0, kind: "BlankPage", props: { label: "чистый лист" } },
  {
    a: 958.0, b: 965.0, kind: "Compare", full: true, sfx: "whoosh",
    props: { heading: { t: 958.1, text: "я миксую два подхода" }, left: { t: 958.44, title: "Ролики из длинного видео", color: "#8EA6FF" }, right: { t: 961.14, title: "Отдельные сценарии", color: "#FF5A36" } },
  },
  { a: 1041.9, b: 1049.4, kind: "NoteChip", sfx: "click", props: { text: "Под коротким роликом — ссылка на длинное видео" } },
  { a: 1055.0, b: 1068.0, kind: "GrowPlatforms", props: { items: [{ t: 1057.4, id: "youtube" }, { t: 1059.6, id: "telegram" }, { t: 1061.6, id: "vk" }, { t: 1063.4, id: "dzen" }] } },
  {
    a: 1068.6, b: 1091.6, kind: "TelegramCTA", sfx: "whoosh",
    props: { title: "Полная пошаговая структура — в гайде", sub: "Скачайте и возвращайтесь к системе, когда будете повторять её для своей ниши", noteAt: 1084.24, note: "ссылка — в описании к видео" },
  },
  { a: 1092.0, b: 1101.8, kind: "CommentPrompt", sfx: "pop", props: { text: "Какой процесс создания контента отнимает у вас больше всего времени?" } },
];

/** Moments where the picture switches between camera and screen recording get a soft whoosh. */
export const extraSfx: { t: number; kind: "whoosh" | "click" | "pop" | "swell" }[] = [
  { t: 257.4, kind: "whoosh" },
  { t: 424.3, kind: "whoosh" },
  { t: 477.6, kind: "whoosh" },
  { t: 514.2, kind: "whoosh" },
  { t: 641.3, kind: "whoosh" },
  { t: 748.6, kind: "whoosh" },
  { t: 1022.6, kind: "whoosh" },
  { t: 1050.0, kind: "whoosh" },
];
