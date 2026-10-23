// Generates the edit sheet / graphics list from the same data the render uses.
import fs from "node:fs";
import { overlays, screenKeys, camMoves } from "./src/plan";
import edl from "./src/data/edl.json";
import { T, INSERTS } from "./src/timeline";
import scenes from "./src/data/scenes.json";

const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const NAMES: Record<string, string> = {
  PlatformsRow: "Карточки площадок на стене", Disclaimer: "Сноска про Instagram*", OneToMany: "Схема «1 длинное видео → 5 роликов + посты + статьи»",
  Roadmap: "Цепочка шагов на стене", WallCompare: "Сравнение двух сторон на стене", Kinetic: "Кинетическая типографика на стене",
  Compare: "Полноэкранное сравнение", CopyVsAdapt: "Анимация «копия 1:1 vs адаптация»", LowerThird: "Титр с именем",
  SectionTitle: "Заголовок раздела", SideList: "Список на стене", SystemFlow: "Схема системы (видео → фрагменты → форматы → площадки)",
  NoteChip: "Подпись к скринкасту", ViewsVsSubs: "Инфографика «просмотры vs подписчики»", PromptCard: "Карточка голосового промпта (на скринкасте)",
  WallPrompt: "Карточка промпта на стене", FiveLines: "Схема «5 смысловых линий → 5 роликов»", Quote: "Цитата на весь экран",
  BlankPage: "Визуал «чистый лист»", GrowPlatforms: "Площадки добавляются постепенно", TelegramCTA: "Карточка Telegram-канала", CommentPrompt: "Карточка вопроса в комментарии",
};
const text = (o: any) => {
  const p = o.props ?? {};
  if (p.title && p.step) return `${p.step}: ${p.title}`;
  if (p.text) return p.text;
  if (p.title) return p.title;
  if (p.items) return p.items.map((i: any) => i.text ?? i.label ?? i.id).join(" · ");
  if (p.lines) return p.lines.map((l: any) => l.text).join(" ");
  if (p.left) return `${p.left.title} / ${p.right.title}`;
  return "";
};

// scenes in output time
const sc: { a: number; b: number; kind: string }[] = [];
for (const c of edl as any[]) {
  for (const s of scenes as any[]) {
    const lo = Math.max(c.in, s.start), hi = Math.min(c.in + c.dur, s.end);
    if (hi > lo) {
      const a = c.out + lo - c.in, b = c.out + hi - c.in;
      const last = sc[sc.length - 1];
      if (last && last.kind === s.kind && Math.abs(last.b - a) < 0.05) last.b = b; else sc.push({ a, b, kind: s.kind });
    }
  }
}

let md = `# Список визуальных вставок\n\nВсе вставки — собственная графика (Remotion, код в \`src/\`). Таймкоды — в готовом ролике.\n\n| Таймкод | Длит. | Тип | Содержание | Звук |\n|---|---|---|---|---|\n`;
for (const c of INSERTS) md += `| ${tc(c.out)}–${tc(c.out + c.dur)} | ${c.dur.toFixed(1)} с | Перебивка-заставка шага (вставлена, речь на паузе) | ${(c.props as any).step ? "Шаг " + (c.props as any).step : "Лайфхак"}: ${(c.props as any).title} | whoosh + swell |\n`;
for (const o of overlays) md += `| ${tc(T(o.a))}–${tc(T(o.b))} | ${(o.b - o.a).toFixed(1)} с | ${NAMES[o.kind] ?? o.kind}${o.full ? " (на весь экран)" : ""} | ${text(o).replace(/\|/g, "/")} | ${o.sfx && o.sfx !== "none" ? o.sfx : "—"} |\n`;
md += `\n## Движения камеры (цифровое приближение говорящей головы)\n\n| Таймкод | Масштаб |\n|---|---|\n`;
for (const m of camMoves) md += `| ${tc(T(m.a))}–${tc(T(m.b))} | ×${m.zoom} (база ×1.08 + медленное «дыхание» до ×1.105) |\n`;
fs.writeFileSync("docs/broll_and_graphics.md", md);

let s2 = `# Скринкасты\n\n| Таймкод в ролике | Что на экране |\n|---|---|\n`;
for (const x of sc.filter((x) => x.kind === "screen")) s2 += `| ${tc(x.a)}–${tc(x.b)} | |\n`;
s2 += `\n## Приближения и подсветки внутри скринкастов\n\n| Таймкод | Область исходника (x, y, w, h) | Подсветка |\n|---|---|---|\n`;
for (const k of screenKeys) s2 += `| ${tc(T(k.a))}–${tc(T(k.b))} | ${k.rect?.join(", ") ?? "весь экран"} | ${k.hl ? k.hl.join(", ") : "—"} |\n`;
fs.writeFileSync("docs/screencasts_auto.md", s2);

let s3 = `# Монтажный лист: фрагменты исходника\n\nКаждая строка — кусок полной записи \`video1377780685.mp4\`, поставленный в ролик. Порядок и границы повторяют авторский черновой монтаж \`1022.mp4\` с правками второго раунда (см. \`src/data/ops.json\`).\n\n| # | В ролике | Из исходника | Длит. |\n|---|---|---|---|\n`;
(edl as any[]).forEach((c, i) => (s3 += `| ${i + 1} | ${tc(c.out)}–${tc(c.out + c.dur)} | ${tc(c.in)}–${tc(c.in + c.dur)} | ${c.dur.toFixed(2)} с |\n`));
fs.writeFileSync("docs/edl.md", s3);
console.log("docs written");
