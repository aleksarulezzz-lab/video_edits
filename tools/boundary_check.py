"""Transcribe short windows around each cut with a verbatim prompt to expose clipped words."""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
audio, edl_path = sys.argv[1], sys.argv[2]
times = [float(t) for t in sys.argv[3:]] or [c["out"] for c in json.load(open(edl_path))][1:]
SR = 16000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
                                 capture_output=True).stdout, np.int16).astype(np.float32) / 32768
m = WhisperModel("turbo", device="cpu", compute_type="int8")
prompt = "Э-э, ну, да-, дальше, ка-, кации, пу-, публикации. Вот, значит, так."
for t in times:
    seg = x[int((t - 1.6) * SR):int((t + 1.6) * SR)]
    segs, _ = m.transcribe(seg, language="ru", initial_prompt=prompt, word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    ws = [f"{w.word.strip()}@{t - 1.6 + w.start:.2f}" for s in segs for w in s.words]
    print(f"cut {t:8.2f}: {' '.join(ws)}", flush=True)
