#!/usr/bin/env python3
"""
Calibrates each career's compatibility-score percentiles by Monte Carlo
simulation: play the career thousands of times picking uniformly at random
at every choice, record where a "performance index" lands, and store
percentile checkpoints in the career's JSON under "calibration".

This is what makes the compatibility score meaningful: the runtime score is
computed as this player's percentile rank against how *everyone else who
just picked randomly* would have done in this exact career and difficulty,
rather than against an arbitrary fixed formula.

Calibrated PER DIFFICULTY, not once per career. An earlier version shared
one baseline across normal/realistic/chaos, which was a real fairness bug:
chaos mode amplifies negative stress/energy effects at runtime
(DIFFICULTY_MULTIPLIER in simulationEngine.ts) but the calibration baseline
didn't account for that, so a chaos player's score was graded against a
baseline that was actually easier than what they were facing — normal-mode
players had a systematically easier path to a high score for equally good
decisions. Simulating each difficulty separately with the same multiplier
applyEffects() uses at runtime fixes that: a 90% in chaos and a 90% in
normal both now mean the same thing ("better than 90% of random attempts at
THIS difficulty"), and difficulty-segmented leaderboards become meaningful.

Run after adding or editing any career JSON:
    python3 scripts/calibrate_careers.py
"""
import json
import glob
import random
import statistics

CAREERS_DIR = "src/data/careers"
SAMPLES = 20000
SEED = 20260709  # deterministic so re-running without content changes is a no-op

INITIAL = {"stress": 20, "energy": 80, "rep": 60, "money": 420, "highlights": 0}

# Must match DIFFICULTY_MULTIPLIER in src/lib/simulationEngine.ts exactly --
# this script's whole point is grading against the same math the runtime
# actually applies.
DIFFICULTIES = {"normal": 1.0, "realistic": 1.15, "chaos": 1.35}


def clamp(n, lo, hi):
    return min(hi, max(lo, n))


def apply_effects(stats, effects, mult):
    s = dict(stats)
    s["stress"] = clamp(s["stress"] + round(effects.get("stress", 0) * mult), 0, 100)
    e_delta = effects.get("energy", 0)
    e_mult = mult if e_delta < 0 else 1  # matches applyEffects: mult only applies to negative energy
    s["energy"] = clamp(s["energy"] + round(e_delta * e_mult), 0, 100)
    s["rep"] = clamp(s["rep"] + effects.get("rep", 0), 0, 100)
    s["money"] = max(0, s["money"] + effects.get("money", 0))
    s["highlights"] = s["highlights"] + effects.get("highlights", 0)
    return s


def performance_index(stats):
    composure = 100 - stats["stress"]
    return stats["rep"] * 0.5 + composure * 0.3 + stats["energy"] * 0.2


def percentile(sorted_values, pct):
    if not sorted_values:
        return 0.0
    k = (len(sorted_values) - 1) * (pct / 100)
    f, c = int(k), min(int(k) + 1, len(sorted_values) - 1)
    if f == c:
        return sorted_values[f]
    return sorted_values[f] + (sorted_values[c] - sorted_values[f]) * (k - f)


def calibrate_one(graph, rng, mult):
    scenes = graph["scenes"]
    start = graph["startScene"]
    scores = []
    for _ in range(SAMPLES):
        stats = dict(INITIAL)
        cur = start
        while cur:
            scene = scenes[cur]
            choice = rng.choice(scene["choices"])
            stats = apply_effects(stats, choice["effects"], mult)
            cur = choice["next"]
        scores.append(performance_index(stats))
    scores.sort()
    points = [1, 5, 10, 25, 35, 50, 65, 75, 90, 95, 99]
    return {f"p{p}": round(percentile(scores, p), 2) for p in points}, scores


def main():
    rng = random.Random(SEED)
    careers_done = 0
    for path in sorted(glob.glob(f"{CAREERS_DIR}/*.json")):
        graph = json.load(open(path, encoding="utf-8"))
        calibration = {}
        line = f"{path.split('/')[-1]:32s}"
        for difficulty, mult in DIFFICULTIES.items():
            points, scores = calibrate_one(graph, rng, mult)
            calibration[difficulty] = points
            line += f" {difficulty}[p50={points['p50']:5.1f} mean={statistics.mean(scores):5.1f}]"
        graph["calibration"] = calibration
        with open(path, "w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(line)
        careers_done += 1

    print(f"\nCalibrated {careers_done} careers x {len(DIFFICULTIES)} difficulties, {SAMPLES} samples each.")


if __name__ == "__main__":
    main()
