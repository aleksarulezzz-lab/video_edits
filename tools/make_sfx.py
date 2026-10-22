"""Synthesize original, license-free UI sound effects (whoosh, click, pop, swell)."""
import sys, wave
import numpy as np
SR = 48000
out = sys.argv[1]
rng = np.random.default_rng(7)

def save(name, x, gain_db=-6):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (gain_db / 20)
    st = np.stack([x, x], 1)
    with wave.open(f"{out}/{name}.wav", "w") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def lowpass_sweep(noise, f0, f1):
    # one-pole low-pass with a moving cutoff
    n = len(noise); y = np.zeros(n); s = 0.0
    fc = np.geomspace(f0, f1, n)
    a = np.exp(-2 * np.pi * fc / SR)
    for i in range(n):
        s = a[i] * s + (1 - a[i]) * noise[i]; y[i] = s
    return y

# whoosh: band-limited noise, cutoff sweeps up then down, bell envelope
n = int(0.45 * SR); t = np.linspace(0, 1, n)
wh = lowpass_sweep(rng.standard_normal(n), 300, 5000) - lowpass_sweep(rng.standard_normal(n), 80, 300) * 0.3
save("whoosh", wh * np.sin(np.pi * t) ** 2.2, -9)
# soft click: short decaying sine at 2.2 kHz + transient
n = int(0.06 * SR); t = np.arange(n) / SR
save("click", np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 90) + 0.3 * rng.standard_normal(n) * np.exp(-t * 600), -12)
# pop: pitch-dropping sine blip for cards appearing
n = int(0.12 * SR); t = np.arange(n) / SR
f = 900 * np.exp(-t * 18) + 380
save("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32), -11)
# swell: soft rising tone for section titles
n = int(0.8 * SR); t = np.arange(n) / SR
f = 220 * (1 + t)
sw = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
save("swell", sw * (t / t[-1]) ** 2 * np.exp(-((t - 0.7) / 0.12) ** 2 * (t > 0.7)), -14)
