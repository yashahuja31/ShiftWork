#!/usr/bin/env python3
"""
Structural validation for every career JSON in src/data/careers/.

Checks, per file:
  - every choice's `next` points at a real scene id (or null)
  - no duplicate choice ids within a scene
  - every scene is reachable from startScene
  - all 5 ending keys are present
  - all required top-level fields are present
  - `calibration` exists (run scripts/calibrate_careers.py if missing/stale)

Run before shipping any new or edited career:
    python3 scripts/validate_careers.py
Exits non-zero if any file fails.
"""
import json
import glob
import sys

CAREERS_DIR = "src/data/careers"
REQUIRED_ENDINGS = {"triumphant", "steady_hand", "ordinary_day", "burned_out", "written_up"}
REQUIRED_TOP_FIELDS = {"id", "title", "emoji", "tagline", "highlightLabel", "startScene", "scenes", "endings"}


def validate(path):
    errors = []
    graph = json.load(open(path, encoding="utf-8"))

    missing_top = REQUIRED_TOP_FIELDS - set(graph.keys())
    if missing_top:
        errors.append(f"missing top-level fields: {missing_top}")

    if "calibration" not in graph:
        errors.append("missing calibration -- run scripts/calibrate_careers.py")

    scenes = graph.get("scenes", {})
    ids = set(scenes.keys())

    for sid, scene in scenes.items():
        if not scene.get("choices"):
            errors.append(f"scene '{sid}' has no choices")
            continue
        seen_ids = set()
        for choice in scene["choices"]:
            cid = choice.get("id")
            if cid in seen_ids:
                errors.append(f"duplicate choice id '{cid}' in scene '{sid}'")
            seen_ids.add(cid)
            nxt = choice.get("next")
            if nxt is not None and nxt not in ids:
                errors.append(f"scene '{sid}' choice '{cid}' points at unknown scene '{nxt}'")

    start = graph.get("startScene")
    if start not in ids:
        errors.append(f"startScene '{start}' is not a real scene")
    else:
        visited, stack = set(), [start]
        while stack:
            cur = stack.pop()
            if cur in visited:
                continue
            visited.add(cur)
            for choice in scenes.get(cur, {}).get("choices", []):
                if choice.get("next"):
                    stack.append(choice["next"])
        unreachable = ids - visited
        if unreachable:
            errors.append(f"unreachable scenes: {sorted(unreachable)}")

    ending_keys = set(graph.get("endings", {}).keys())
    if ending_keys != REQUIRED_ENDINGS:
        errors.append(f"endings mismatch -- expected {REQUIRED_ENDINGS}, got {ending_keys}")

    return errors


def main():
    any_failed = False
    for path in sorted(glob.glob(f"{CAREERS_DIR}/*.json")):
        errors = validate(path)
        name = path.split("/")[-1]
        if errors:
            any_failed = True
            print(f"FAIL  {name}")
            for e in errors:
                print(f"      - {e}")
        else:
            print(f"OK    {name}")

    if any_failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
