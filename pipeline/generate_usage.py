"""Generate a small, realistic usage_logs.csv from users + tools.

Run: python pipeline/generate_usage.py
"""

from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"

random.seed(42)


def main() -> None:
    users = list(csv.DictReader((RAW / "users.csv").open()))
    tools = list(csv.DictReader((RAW / "tools.csv").open()))

    start = date(2024, 10, 1)
    end = date(2025, 3, 31)
    span = (end - start).days

    # Industry affinity: some tools are more common in certain industries
    affinity = {
        "Technology": ["T02", "T10", "T01", "T03", "T04"],
        "Healthcare": ["T01", "T09", "T07", "T04", "T06"],
        "Finance": ["T03", "T01", "T06", "T07", "T04"],
        "Education": ["T01", "T04", "T05", "T09", "T07"],
        "Retail": ["T08", "T05", "T01", "T07", "T06"],
    }

    statuses = ["completed", "completed", "completed", "completed", "failed", "cancelled"]
    rows: list[dict] = []
    log_id = 1

    # ~150 usage events across 25 users
    for _ in range(150):
        user = random.choice(users)
        preferred = affinity.get(user["industry"], [t["tool_id"] for t in tools])
        tool_id = random.choice(preferred if random.random() < 0.75 else [t["tool_id"] for t in tools])
        tool = next(t for t in tools if t["tool_id"] == tool_id)

        event_date = start + timedelta(days=random.randint(0, span))
        sessions = random.randint(1, 8)
        # hours_saved can be null for incomplete/cancelled
        status = random.choice(statuses)
        if status == "completed":
            hours = round(float(tool["avg_hours_saved_per_use"]) * sessions * random.uniform(0.7, 1.3), 2)
            cost = round(float(tool["monthly_cost_usd"]) * sessions / 20, 2)  # prorated session cost
        else:
            hours = "" if random.random() < 0.6 else round(random.uniform(0.1, 0.5), 2)
            cost = round(float(tool["monthly_cost_usd"]) * 0.05, 2) if status == "failed" else ""

        satisfaction = random.randint(3, 5) if status == "completed" else ("" if random.random() < 0.5 else random.randint(1, 3))

        rows.append(
            {
                "log_id": f"L{log_id:04d}",
                "user_id": user["user_id"],
                "tool_id": tool_id,
                "event_date": event_date.isoformat(),
                "sessions": sessions if status != "cancelled" else 0,
                "hours_saved": hours,
                "session_cost_usd": cost,
                "status": status,
                "satisfaction": satisfaction,
            }
        )
        log_id += 1

    rows.sort(key=lambda r: (r["event_date"], r["log_id"]))

    out = RAW / "usage_logs.csv"
    with out.open("w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "log_id",
                "user_id",
                "tool_id",
                "event_date",
                "sessions",
                "hours_saved",
                "session_cost_usd",
                "status",
                "satisfaction",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} usage rows → {out}")


if __name__ == "__main__":
    main()
