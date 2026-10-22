"""Transcribe a video with faster-whisper, writing word-level JSON and SRT."""
import json, sys, time
from faster_whisper import WhisperModel

src, out_prefix = sys.argv[1], sys.argv[2]
if not src.endswith(".wav"):
    raise SystemExit("pass a 16 kHz mono wav (ffmpeg -ac 1 -ar 16000)")
import wave, numpy as np
with wave.open(src) as w:
    audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
model_name = sys.argv[3] if len(sys.argv) > 3 else "turbo"
t0 = time.time()
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
segments, info = model.transcribe(audio, language="ru", word_timestamps=True, vad_filter=False, beam_size=5,
                                  condition_on_previous_text=False)
out = []
for s in segments:
    out.append({"start": s.start, "end": s.end, "text": s.text.strip(),
                "words": [{"start": w.start, "end": w.end, "word": w.word} for w in s.words]})
    print(f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}", flush=True)
json.dump(out, open(out_prefix + ".json", "w"), ensure_ascii=False, indent=1)
def ts(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
with open(out_prefix + ".srt", "w") as f:
    for i, s in enumerate(out, 1):
        f.write(f"{i}\n{ts(s['start'])} --> {ts(s['end'])}\n{s['text']}\n\n")
print("done in", round(time.time() - t0), "s", file=sys.stderr)
