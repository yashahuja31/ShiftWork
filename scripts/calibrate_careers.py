#!/usr/bin/env python3
"""
Calibrates each career's compatibility-score percentiles by Monte Carlo
simulation: play the career thousands of times picking uniformly at random
at every choice, record where a "performance index" lands, and store
percentile checkpoints in the career's JSON under "calibration".

This is what makes the compatibility score meaningful: the runtime score is
computed as this player's percentile rank against how *everyone else who
just picked randomly* would have done in this exact career, rather than
against an arbitrary fixed formula. A career where the random baseline
skews high (most random choices are reasonable ones) and a career where it
skews low both end up with a genuinely spread 1-99 score distribution,
because the calibration is per-career and derived from that career's own
actual reachable outcomes.

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


def clamp(n, lo, hi):
    return min(hi, max(lo, n))


def apply_effects(stats, effects):
    s = dict(stats)
    s["stress"] = clamp(s["stress"] + effects.get("stress", 0), 0, 100)
    s["energy"] = clamp(s["energy"] + effects.get("energy", 0), 0, 100)
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


def calibrate(graph, rng):
    scenes = graph["scenes"]
    start = graph["startScene"]
    scores = []
    for _ in range(SAMPLES):
        stats = dict(INITIAL)
        cur = start
        while cur:
            scene = scenes[cur]
            choice = rng.choice(scene["choices"])
            stats = apply_effects(stats, choice["effects"])
            cur = choice["next"]
        scores.append(performance_index(stats))
    scores.sort()
    points = [1, 5, 10, 25, 35, 50, 65, 75, 90, 95, 99]
    return {f"p{p}": round(percentile(scores, p), 2) for p in points}, scores


def main():
    rng = random.Random(SEED)
    summary = []
    for path in sorted(glob.glob(f"{CAREERS_DIR}/*.json")):
        graph = json.load(open(path, encoding="utf-8"))
        calibration, scores = calibrate(graph, rng)
        graph["calibration"] = calibration
        with open(path, "w", encoding="utf-8") as f:
            json.dump(graph, f, indent=2, ensure_ascii=False)
            f.write("\n")
        below_50 = sum(1 for s in scores if s < calibration["p50"]) / len(scores)
        summary.append((path.split("/")[-1], calibration, statistics.mean(scores)))
        print(f"{path.split('/')[-1]:32s} p10={calibration['p10']:6.1f} p50={calibration['p50']:6.1f} "
              f"p90={calibration['p90']:6.1f} mean={statistics.mean(scores):6.1f}")

    print(f"\nCalibrated {len(summary)} careers, {SAMPLES} random samples each.")


if __name__ == "__main__":
    main()
