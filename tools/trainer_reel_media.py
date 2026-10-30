"""Cut only the source pieces a reel uses into small files, so rendering it does not copy the full media.

usage: trainer_reel_media.py <trainer dir> <reel n> ...
writes public_reels/media/r<n>_<k>.mp4 and points the reel's clips / b-roll at them (in = 0)
"""
import json, subprocess, sys

root = sys.argv[1]
FPS = 25
for n in sys.argv[2:]:
    p = f"{root}/src/reels/data/reel_{n}.json"
    d = json.load(open(p))
    def extract(src, t0, dur, name):
        out = f"{root}/public_reels/media/{name}"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{root}/public/media/{src}.mp4", "-ss", f"{t0:.3f}", "-t", f"{dur + 0.2:.3f}",
                        "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-r", str(FPS), "-c:a", "aac", "-b:a", "256k", "-ar", "48000", out], check=True)
        return name
    for k, c in enumerate(d["clips"]):
        c["file"] = extract(c["src"], c["in"], c["dur"], f"r{n}_{k}.mp4")
        c["in_src"], c["in"] = c["in"], 0
    for k, e in enumerate(d["events"]):
        if e["kind"] == "broll":
            e["file"] = extract(e["src"], e["at"], e["b"] - e["a"], f"r{n}_b{k}.mp4")
            e["at_src"], e["at"] = e["at"], 0
    json.dump(d, open(p, "w"), ensure_ascii=False)
    print("reel", n, "media ready")
