import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, EASE, FPS, GLOW, SERIF, UI } from "./theme";
import { Mark, ease, fade, glass } from "./glass";
import { Grain, PaperBg, Sheet, Strip, jitter, rnd, step, torn } from "./paper";
import type { Ev } from "./Main";

/**
 * Motion inserts in the paper-collage style of the ad itself: each one is an HTML page animated on the
 * timeline and captured frame by frame. Motion is stepped (12-15 fps feel), paper has torn edges and grain.
 */
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const pop = (s: number, a: number, d = 0.35) => interpolate(s, [a, a + d], [0, 1], { ...clamp, easing: EASE.spring });
const lin = (s: number, a: number, d: number) => interpolate(s, [a, a + d], [0, 1], { ...clamp, easing: EASE.inOut });

const Frame: React.FC<{ e: Ev; children: (s: number, f: number) => React.ReactNode; bg?: string }> = ({ e, children, bg }) => {
  const f = useCurrentFrame();
  const sf = step(f) * 2.5; // stepped frame
  const s = sf / FPS;
  const d = e.b - e.a;
  const o = interpolate(f / FPS, [0, 0.18, d - 0.22, d], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <PaperBg color={bg ?? C.cream} seed={Math.round(e.a)} />
      {children(s, f)}
    </AbsoluteFill>
  );
};

/* 1. three questions of the group members fly in as paper notes */
const Questions: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e} bg={C.blue}>
    {(s, f) => {
      const notes = [
        { t: "Сколько времени?", x: 170, y: 330, r: -5, at: 0.35, c: C.cream },
        { t: "В моём городе?", x: 720, y: 470, r: 3, at: 2.0, c: C.yellow },
        { t: "Сколько стоит?", x: 1250, y: 300, r: -2, at: 3.7, c: C.white },
      ];
      return (
        <>
          <div style={{ position: "absolute", left: 120, top: 110, transform: jitter(f, 1) }}><Strip text="Вопросы участниц" bg={C.navy} fg={C.cream} size={64} seed={51} /></div>
          {notes.map((n, i) => {
            const p = pop(s, n.at, 0.4);
            return (
              <div key={i} style={{ position: "absolute", left: n.x, top: n.y + (1 - p) * 500, opacity: Math.min(1, p * 2), transform: `rotate(${n.r + (1 - p) * 20}deg) ${jitter(f, i + 3)}` }}>
                <div style={{ position: "relative", width: 520, height: 300 }}>
                  <Sheet w={520} h={300} color={n.c} seed={60 + i}>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 56, color: C.navy, textAlign: "center", padding: 30 }}>{n.t}</div>
                  </Sheet>
                  <div style={{ position: "absolute", left: 220, top: -26, width: 80, height: 40, background: "rgba(243,195,53,0.85)", transform: "rotate(-8deg)" }} />
                </div>
              </div>
            );
          })}
        </>
      );
    }}
  </Frame>
);

/* 2. voice note → paper strips → lines of text */
const Voice: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e}>
    {(s, f) => {
      const bars = 18;
      const fly = lin(s, 1.5, 1.4);
      return (
        <>
          <div style={{ position: "absolute", left: 240, top: 170, width: 470, height: 760, transform: `rotate(-4deg) ${jitter(f, 2)}` }}>
            <Sheet w={470} h={760} color={C.navy} seed={71} amp={0.8}>
              <div style={{ position: "absolute", left: 40, right: 40, top: 300, height: 150, borderRadius: 40, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {Array.from({ length: bars }).map((_, i) => (
                  <div key={i} style={{ width: 10, borderRadius: 5, background: C.cream, height: 20 + 80 * Math.abs(Math.sin(step(f) * 0.9 + i * 1.7)) * (1 - fly) }} />
                ))}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: UI, fontWeight: 700, fontSize: 36, color: C.cream }}>0:47 · голосовое</div>
            </Sheet>
          </div>
          {Array.from({ length: 6 }).map((_, i) => {
            const p = lin(s, 1.5 + i * 0.12, 1.2);
            const x0 = 330 + i * 40, y0 = 470, x1 = 1060, y1 = 330 + i * 80;
            return (
              <div key={i} style={{ position: "absolute", left: x0 + (x1 - x0) * p, top: y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * 120, width: 120 + p * (380 + rnd(i) * 160), height: 34,
                background: i % 2 ? C.yellow : C.white, clipPath: torn(80 + i, 6, 10, "lr"), opacity: p > 0 ? 1 : 0, transform: `rotate(${(1 - p) * (rnd(i + 9) - 0.5) * 40}deg)` }}>
                <div style={{ margin: "8px 18px", height: 6, borderRadius: 3, background: "rgba(29,42,85,0.55)", width: `${60 + rnd(i + 2) * 30}%`, opacity: p }} />
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 1000, top: 140, opacity: pop(s, 2.6), transform: jitter(f, 4) }}><Strip text="Мысли → текст" bg={C.navy} fg={C.cream} size={60} seed={84} /></div>
        </>
      );
    }}
  </Frame>
);

/* 3. «1. Текст» → «2. Видео»: the video card tries to go first and gets crossed out */
const TextVideo: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e}>
    {(s, f) => {
      const vTry = lin(s, 0.3, 0.6), cross = lin(s, 1.0, 0.5), back = lin(s, 1.9, 0.6), txt = pop(s, 2.4, 0.45);
      const card = (label: string, sub: string, color: string, seed: number) => (
        <div style={{ position: "relative", width: 560, height: 380 }}>
          <Sheet w={560} h={380} color={color} seed={seed}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: SERIF, color: C.navy }}>
              <div style={{ fontWeight: 700, fontSize: 96 }}>{label}</div>
              <div style={{ fontWeight: 700, fontSize: 38, opacity: 0.7, marginTop: 8 }}>{sub}</div>
            </div>
          </Sheet>
        </div>
      );
      const vx = 1180 - 860 * vTry * (1 - back), tx = 300 + 0 * back;
      return (
        <>
          <div style={{ position: "absolute", left: tx, top: 330, opacity: txt > 0 || back > 0.5 ? 1 : 0.35, transform: `rotate(-3deg) scale(${0.9 + 0.1 * Math.max(txt, 0)}) ${jitter(f, 1)}` }}>{card("1. Текст", "согласовать", C.white, 91)}</div>
          <div style={{ position: "absolute", left: vx, top: 300 + 60 * back, transform: `rotate(${3 - vTry * 4}deg) ${jitter(f, 2)}` }}>
            {card("2. Видео", "потом", C.kraft, 92)}
            <svg style={{ position: "absolute", left: -30, top: -30, width: 620, height: 440 }} viewBox="0 0 620 440">
              <path d="M40 60 L 580 380" stroke={C.red} strokeWidth={22} strokeLinecap="round" strokeDasharray={640} strokeDashoffset={640 * (1 - cross)} opacity={1 - back} />
              <path d="M580 60 L 40 380" stroke={C.red} strokeWidth={22} strokeLinecap="round" strokeDasharray={640} strokeDashoffset={640 * (1 - lin(s, 1.3, 0.4))} opacity={1 - back} />
            </svg>
          </div>
          <div style={{ position: "absolute", left: 300, top: 140, opacity: txt, transform: jitter(f, 3) }}><Strip text="Сначала текст, потом видео" bg={C.navy} fg={C.cream} size={62} seed={95} /></div>
        </>
      );
    }}
  </Frame>
);

/* 4. code → paper frames → film strip */
const CodeFilm: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e} bg={C.kraft}>
    {(s, f) => {
      const lines = ['<div class="paper">', '  <h1>Реклама дорожает</h1>', '  tl.to(".strip", {x: 0}, 1.2)', '  tl.from(".photo", {y: 80}, 2.4)', "</div>", "page.screenshot({frame: n})"];
      const typed = Math.floor(lin(s, 0.1, 1.6) * lines.join("").length);
      let left = typed;
      const film = lin(s, 2.6, 1.6);
      return (
        <>
          <div style={{ position: "absolute", left: 90, top: 200, width: 700, height: 560, transform: `rotate(-2deg) ${jitter(f, 1)}` }}>
            <Sheet w={700} h={560} color={C.navy} seed={101} amp={0.8}>
              <div style={{ position: "absolute", left: 40, top: 40, fontFamily: "monospace", fontSize: 30, lineHeight: 1.6, color: C.cream }}>
                {lines.map((l, i) => {
                  const shown = l.slice(0, Math.max(0, left)); left -= l.length;
                  return <div key={i} style={{ color: i === 5 ? C.yellow : C.cream, whiteSpace: "pre" }}>{shown}</div>;
                })}
              </div>
            </Sheet>
          </div>
          {Array.from({ length: 4 }).map((_, i) => {
            const p = pop(s, 1.6 + i * 0.25, 0.4);
            const x = 850 + i * 230 * (1 - film) + film * (i * 250 + 330), y = 260 + (i % 2) * 140 * (1 - film) + film * 290;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: y, opacity: p, transform: `rotate(${(1 - film) * (i % 2 ? 6 : -5)}deg) scale(${0.6 + 0.4 * p})` }}>
                <Sheet w={220} h={150} color={C.cream} seed={110 + i}>
                  <div style={{ position: "absolute", left: 18, top: 18, width: 120, height: 22, background: C.yellow }} />
                  <div style={{ position: "absolute", left: 18, top: 56, width: 90, height: 74, background: C.blue }} />
                  <div style={{ position: "absolute", left: 120, top: 70, width: 80, height: 16, background: C.red }} />
                </Sheet>
              </div>
            );
          })}
          <div style={{ position: "absolute", left: 1150, top: 230, width: 1080, height: 230, background: C.ink, opacity: film, transform: `translateX(${-film * 0}px)`,
            backgroundImage: `repeating-linear-gradient(90deg, transparent 0 24px, ${C.cream} 24px 44px)`, backgroundSize: "68px 26px", backgroundRepeat: "repeat-x", backgroundPosition: `${-step(f) * 6}px 12px` }} />
          <div style={{ position: "absolute", left: 150, top: 90, transform: jitter(f, 3) }}><Strip text="Код → кадры → плёнка" bg={C.yellow} size={60} seed={121} /></div>
        </>
      );
    }}
  </Frame>
);

/* 5. the pin drops into the sea, a red arrow moves it onto land */
const Pin: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e} bg="#8fb7d9">
    {(s, f) => {
      const drop = lin(s, 0.1, 0.5), ring = lin(s, 0.6, 0.9), arrow = lin(s, 1.4, 0.7), move = lin(s, 2.2, 0.8);
      const px = 760 + move * 640, py = -200 + drop * 680 - move * 120;
      return (
        <>
          <OffthreadVideo src={staticFile("broll/clear-ocean-water.mp4")} muted style={{ position: "absolute", inset: 0, width: 1920, height: 1080, opacity: 0.85 }} />
          <div style={{ position: "absolute", left: 1150, top: 160, width: 720, height: 760, background: C.kraft, clipPath: torn(131, 7, 16) }}><Grain seed={131} opacity={0.5} /></div>
          <div style={{ position: "absolute", left: 1290, top: 360, transform: jitter(f, 2) }}><Strip text="ваш город" bg={C.white} size={40} seed={132} rot={4} /></div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 800 - 60 - i * 50 * ring, top: 520 - 20 - i * 16 * ring, width: 120 + i * 100 * ring, height: 40 + i * 32 * ring, borderRadius: "50%",
              border: `5px solid rgba(255,255,255,${0.8 * (1 - ring)})`, opacity: ring > 0 ? 1 : 0 }} />
          ))}
          <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 1920 1080">
            <path d="M840 470 C 1000 300, 1200 280, 1370 340" stroke={C.red} strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray={700} strokeDashoffset={700 * (1 - arrow)} />
            <path d="M1335 300 L 1380 342 L 1325 365" stroke={C.red} strokeWidth={14} fill="none" strokeLinecap="round" opacity={arrow > 0.95 ? 1 : 0} />
          </svg>
          <div style={{ position: "absolute", left: px, top: py, width: 80, height: 110, transform: `${jitter(f, 4)}` }}>
            <svg viewBox="0 0 80 110" width={80} height={110}><path d="M40 106 C 20 70, 4 54, 4 38 A 36 36 0 0 1 76 38 C 76 54, 60 70, 40 106 Z" fill={C.red} stroke={C.cream} strokeWidth={5} /><circle cx={40} cy={38} r={13} fill={C.cream} /></svg>
          </div>
          <div style={{ position: "absolute", left: 110, top: 110, opacity: pop(s, 0.7), transform: jitter(f, 5) }}><Strip text="Буль-к!" bg={C.white} size={58} seed={133} italic /></div>
          <div style={{ position: "absolute", left: 1220, top: 860, opacity: pop(s, 2.9), transform: jitter(f, 6) }}><Strip text="Город — на суше" bg={C.yellow} size={54} seed={134} /></div>
        </>
      );
    }}
  </Frame>
);

/* 6. split: plain talking head vs the same reel with a motion insert */
const Split: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e} bg={C.navy}>
    {(s, f) => {
      const p = pop(s, 0.1, 0.45), q = pop(s, 0.6, 0.45);
      const phone = (child: React.ReactNode, x: number, rot: number, o: number) => (
        <div style={{ position: "absolute", left: x, top: 150, width: 420, height: 746, borderRadius: 44, background: "#0d0f14", padding: 14, boxSizing: "border-box", opacity: o,
          transform: `rotate(${rot}deg) translateY(${(1 - o) * 60}px)`, boxShadow: `0 0 0 2px rgba(150,180,255,0.9), 0 0 30px rgba(47,95,208,0.7), 0 30px 60px rgba(0,0,0,0.5)` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 32, overflow: "hidden", position: "relative" }}>{child}</div>
        </div>
      );
      return (
        <>
          {phone(<OffthreadVideo src={staticFile("media/main.mp4")} trimBefore={Math.round(933 * FPS)} muted style={{ position: "absolute", left: -540, top: 0, width: 1280, height: 720 * 1.0, transform: "scale(1.0)" }} />, 330, -3, p)}
          {phone(<OffthreadVideo src={staticFile("media/rv.mp4")} trimBefore={Math.round(30 * FPS)} muted style={{ width: "100%", height: "100%" }} />, 1170, 3, q)}
          <div style={{ position: "absolute", left: 260, top: 930, opacity: p }}><Strip text="Говорящая голова" bg={C.cream} size={46} seed={141} /></div>
          <div style={{ position: "absolute", left: 1080, top: 930, opacity: q }}><Strip text="+ моушен-вставка" bg={C.yellow} size={46} seed={142} /></div>
          <div style={{ position: "absolute", left: 880, top: 460, fontFamily: SERIF, fontWeight: 700, fontSize: 120, color: C.yellow, opacity: q, transform: jitter(f, 3) }}>→</div>
        </>
      );
    }}
  </Frame>
);

/* 7. money: paper notes fall, a price tag swings in */
const Price: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e} bg={C.kraft}>
    {(s, f) => (
      <>
        {Array.from({ length: 9 }).map((_, i) => {
          const p = lin(s, 0.05 + i * 0.14, 1.2);
          return (
            <div key={i} style={{ position: "absolute", left: 120 + rnd(i) * 1600, top: -300 + p * (620 + rnd(i + 4) * 300), transform: `rotate(${(rnd(i + 8) - 0.5) * 60 + p * 30}deg)` }}>
              <Sheet w={300} h={150} color={i % 3 ? "#d8e6c8" : C.cream} seed={150 + i}>
                <div style={{ position: "absolute", inset: 10, border: `3px solid rgba(29,42,85,0.35)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: "rgba(29,42,85,0.6)" }}>₽</div>
              </Sheet>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 620, top: 360, transform: `rotate(${Math.sin(step(f) * 0.6) * 4 * (1 - lin(s, 1.4, 1.6))}deg) scale(${pop(s, 0.9, 0.5)})`, transformOrigin: "50% -100px" }}>
          <Strip text="3 000 ₽ и выше" bg={C.yellow} size={120} seed={161} rot={-3} />
        </div>
        <div style={{ position: "absolute", left: 700, top: 640, opacity: pop(s, 2.0) }}><Strip text="за один ролик" bg={C.navy} fg={C.cream} size={54} seed={162} rot={2} /></div>
      </>
    )}
  </Frame>
);

export const Insert: React.FC<{ e: Ev }> = ({ e }) => {
  const m: Record<string, React.FC<{ e: Ev }>> = { questions: Questions, voice: Voice, textvideo: TextVideo, codefilm: CodeFilm, pin: Pin, split: Split, price: Price };
  const Comp = m[e.name as string];
  return Comp ? <Comp e={e} /> : null;
};

/* ---------- listening to the generated voice: nothing but the voice, bars react to it ---------- */
export const Listen: React.FC<{ e: Ev }> = ({ e }) => {
  const f = useCurrentFrame();
  const d = e.b - e.a;
  const o = interpolate(f / FPS, [0, 0.3, d - 0.35, d], [0, 1, 1, 0], clamp);
  const B = e.bands as number[][];
  const vals = B[Math.min(B.length - 1, f)] ?? [];
  return (
    <AbsoluteFill style={{ opacity: o, background: `radial-gradient(80% 70% at 50% 45%, #253a78, ${C.navy})` }}>
      <Grain seed={7} opacity={0.22} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, height: 420, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        {vals.map((v: number, i: number) => {
          const h = 24 + v * 380;
          return <div key={i} style={{ width: 34, height: h, borderRadius: 14, background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(111,155,255,0.55))",
            border: "1px solid rgba(255,255,255,0.8)", boxShadow: `0 0 18px rgba(111,155,255,${0.25 + v * 0.6})`, backdropFilter: "blur(10px)" }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ ...glass(true), padding: "16px 34px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Mark name="elevenlabs" size={34} /></div>
          <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 48, color: "#fff" }}>Голос: ElevenLabs</div>
        </div>
        <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 28, color: "rgba(255,255,255,0.75)" }}>{e.voice as string}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- mock-up of the guide in the Telegram channel ---------- */
export const Guide: React.FC<{ e: Ev }> = ({ e }) => (
  <Frame e={e} bg={C.blue}>
    {(s, f) => {
      const ph = pop(s, 0.1, 0.5);
      const tags = [["Промпты", C.yellow, 1.0], ["Пошагово", C.cream, 1.6], ["Ошибки учтены", C.white, 2.2]] as const;
      return (
        <>
          <div style={{ position: "absolute", left: 250, top: 70 + (1 - ph) * 200, width: 520, height: 940, borderRadius: 56, background: "#0d0f14", padding: 16, boxSizing: "border-box",
            transform: `rotate(-3deg)`, boxShadow: "0 40px 80px rgba(0,0,0,0.5)", opacity: ph }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 42, overflow: "hidden", background: "#e7ebf0", position: "relative", fontFamily: UI }}>
              <div style={{ height: 110, background: "#fff", display: "flex", alignItems: "center", gap: 16, padding: "30px 24px 0" }}>
                <div style={{ width: 58, height: 58, borderRadius: 29, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px #e1e6ec" }}><Mark name="telegram" size={40} /></div>
                <div><div style={{ fontWeight: 700, fontSize: 26, color: "#111" }}>Александра Рулёва</div><div style={{ fontWeight: 600, fontSize: 20, color: "#7a8796" }}>t.me/zapuskator_A</div></div>
              </div>
              <div style={{ margin: "24px 18px", background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                <div style={{ height: 300, background: C.cream, position: "relative", overflow: "hidden" }}>
                  <Grain seed={171} opacity={0.4} />
                  <div style={{ position: "absolute", left: 20, top: 30 }}><Strip text="ГАЙД" bg={C.navy} fg={C.cream} size={44} seed={172} /></div>
                  <div style={{ position: "absolute", left: 30, top: 120, width: 400, fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.navy, lineHeight: 1.15 }}>Рекламный ролик с моушен-анимацией в Claude</div>
                  <div style={{ position: "absolute", right: 24, bottom: 24 }}><Strip text="без дизайнера" bg={C.yellow} size={26} seed={173} rot={3} /></div>
                </div>
                <div style={{ padding: "18px 22px", fontSize: 22, lineHeight: 1.4, color: "#222", fontWeight: 600 }}>
                  Пошаговый процесс, все мои промпты и наработки. Ошибки первой версии уже учтены 👇
                  <div style={{ marginTop: 14, display: "inline-block", padding: "10px 18px", borderRadius: 14, background: "#e8f2fc", color: "#2a8bd6", fontWeight: 700 }}>📎 Гайд: ролик с моушен-анимацией</div>
                </div>
              </div>
            </div>
          </div>
          {tags.map(([t, c, at], i) => {
            const p = pop(s, at as number, 0.4);
            return (
              <div key={i} style={{ position: "absolute", left: 900 + i * 40, top: 230 + i * 210, opacity: p, transform: `scale(${0.7 + 0.3 * p}) ${jitter(f, i + 2)}` }}>
                <Strip text={t as string} bg={c as string} size={70} seed={180 + i} rot={i % 2 ? 2 : -2} />
              </div>
            );
          })}
        </>
      );
    }}
  </Frame>
);

/* ---------- channel plate at the end ---------- */
export const Plate: React.FC<{ t: number; e: Ev }> = ({ t, e }) => {
  const p = ease(t, e.a, 0.4, EASE.spring) * fade(t, e.b, 0.4);
  return (
    <div style={{ position: "absolute", left: 64, bottom: 80, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ ...glass(), padding: "20px 30px 20px 20px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 82, height: 82, borderRadius: 22, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Mark name="telegram" size={56} /></div>
        <div>
          <div style={{ fontFamily: UI, fontWeight: 700, fontSize: 44, color: C.navy }}>{e.text as string}</div>
          <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 28, color: C.blue }}>Гайд и промпты · ссылка в описании</div>
        </div>
      </div>
    </div>
  );
};
