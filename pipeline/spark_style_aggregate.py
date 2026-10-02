"""Spark-style groupBy aggregations → star-schema dims + facts.

Mimics: df.groupBy(...).agg(sum, avg, count) then write fact/dim tables
as CSVs (and optional SQLite) for a Redshift-like analytics layer.

Run: python pipeline/spark_style_aggregate.py
"""

from __future__ import annotations

import csv
import sqlite3
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
DB_PATH = ROOT / "data" / "adoption.db"


def read_csv(path: Path) -> list[dict]:
    with path.open(newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def to_float(v: str | None, default: float = 0.0) -> float:
    if v is None or v == "":
        return default
    return float(v)


def clean_usage(rows: list[dict]) -> list[dict]:
    """Null handling + pivot-ready cleaning (Excel/MySQL stage)."""
    cleaned = []
    for r in rows:
        status = r.get("status") or "unknown"
        hours = to_float(r.get("hours_saved"), 0.0)
        cost = to_float(r.get("session_cost_usd"), 0.0)
        sessions = int(to_float(r.get("sessions"), 0))
        sat = r.get("satisfaction")
        cleaned.append(
            {
                **r,
                "status": status,
                "hours_saved": hours,
                "session_cost_usd": cost,
                "sessions": sessions,
                "satisfaction": int(sat) if sat not in (None, "") else None,
                "is_completed": 1 if status == "completed" else 0,
            }
        )
    return cleaned


def build_dims(users: list[dict], tools: list[dict]) -> tuple[list[dict], list[dict], list[dict]]:
    dim_user = [
        {
            "user_key": u["user_id"],
            "user_name": u["name"],
            "industry": u["industry"],
            "role": u["role"],
            "company_size": u["company_size"],
            "region": u["region"],
        }
        for u in users
    ]
    dim_tool = [
        {
            "tool_key": t["tool_id"],
            "tool_name": t["tool_name"],
            "category": t["category"],
            "vendor": t["vendor"],
            "monthly_cost_usd": float(t["monthly_cost_usd"]),
            "license_type": t["license_type"],
        }
        for t in tools
    ]
    # Date dimension from usage will be filled later; stub months here
    return dim_user, dim_tool, []


def aggregate(usage: list[dict], users: list[dict], tools: list[dict]):
    user_by_id = {u["user_id"]: u for u in users}
    tool_by_id = {t["tool_id"]: t for t in tools}

    # --- Spark-style: groupBy industry, tool → agg ---
    by_industry_tool: dict[tuple, dict] = defaultdict(
        lambda: {"sessions": 0, "hours_saved": 0.0, "cost": 0.0, "users": set(), "completed": 0, "n": 0}
    )
    by_user: dict[str, dict] = defaultdict(
        lambda: {"sessions": 0, "hours_saved": 0.0, "cost": 0.0, "tools": set(), "completed": 0, "sat_sum": 0, "sat_n": 0}
    )
    by_month_industry: dict[tuple, dict] = defaultdict(
        lambda: {"sessions": 0, "hours_saved": 0.0, "cost": 0.0, "active_users": set()}
    )
    date_keys: set[str] = set()

    for row in usage:
        u = user_by_id[row["user_id"]]
        t = tool_by_id[row["tool_id"]]
        industry = u["industry"]
        month = row["event_date"][:7]  # YYYY-MM
        date_keys.add(month)

        key = (industry, row["tool_id"])
        agg = by_industry_tool[key]
        agg["sessions"] += row["sessions"]
        agg["hours_saved"] += row["hours_saved"]
        agg["cost"] += row["session_cost_usd"]
        agg["users"].add(row["user_id"])
        agg["completed"] += row["is_completed"]
        agg["n"] += 1

        bu = by_user[row["user_id"]]
        bu["sessions"] += row["sessions"]
        bu["hours_saved"] += row["hours_saved"]
        bu["cost"] += row["session_cost_usd"]
        bu["tools"].add(row["tool_id"])
        bu["completed"] += row["is_completed"]
        if row["satisfaction"] is not None:
            bu["sat_sum"] += row["satisfaction"]
            bu["sat_n"] += 1

        mi = by_month_industry[(month, industry)]
        mi["sessions"] += row["sessions"]
        mi["hours_saved"] += row["hours_saved"]
        mi["cost"] += row["session_cost_usd"]
        mi["active_users"].add(row["user_id"])

    # Fact: adoption by industry × tool
    fact_adoption = []
    for (industry, tool_id), a in sorted(by_industry_tool.items()):
        t = tool_by_id[tool_id]
        hours = round(a["hours_saved"], 2)
        cost = round(a["cost"], 2)
        fact_adoption.append(
            {
                "industry": industry,
                "tool_key": tool_id,
                "tool_name": t["tool_name"],
                "category": t["category"],
                "active_users": len(a["users"]),
                "total_sessions": a["sessions"],
                "total_hours_saved": hours,
                "total_cost_usd": cost,
                "hours_per_dollar": round(hours / cost, 3) if cost else 0,
                "completion_rate": round(a["completed"] / a["n"], 3) if a["n"] else 0,
            }
        )

    # Fact: user segmentation metrics
    def segment(hours: float, sessions: int, tool_count: int) -> str:
        if hours >= 40 or sessions >= 40:
            return "Power User"
        if hours >= 15 or sessions >= 15:
            return "Regular"
        if tool_count >= 3:
            return "Explorer"
        return "Light"

    fact_user_metrics = []
    for user_id, a in sorted(by_user.items()):
        u = user_by_id[user_id]
        hours = round(a["hours_saved"], 2)
        cost = round(a["cost"], 2)
        tool_count = len(a["tools"])
        fact_user_metrics.append(
            {
                "user_key": user_id,
                "user_name": u["name"],
                "industry": u["industry"],
                "role": u["role"],
                "region": u["region"],
                "company_size": u["company_size"],
                "tools_used": tool_count,
                "total_sessions": a["sessions"],
                "total_hours_saved": hours,
                "total_cost_usd": cost,
                "roi_hours_per_dollar": round(hours / cost, 3) if cost else 0,
                "avg_satisfaction": round(a["sat_sum"] / a["sat_n"], 2) if a["sat_n"] else None,
                "segment": segment(hours, a["sessions"], tool_count),
            }
        )

    # Fact: monthly industry trend
    fact_monthly = []
    for (month, industry), a in sorted(by_month_industry.items()):
        fact_monthly.append(
            {
                "month_key": month,
                "industry": industry,
                "active_users": len(a["active_users"]),
                "total_sessions": a["sessions"],
                "total_hours_saved": round(a["hours_saved"], 2),
                "total_cost_usd": round(a["cost"], 2),
            }
        )

    dim_date = [
        {
            "month_key": m,
            "year": int(m[:4]),
            "month": int(m[5:7]),
            "quarter": f"Q{(int(m[5:7]) - 1) // 3 + 1}",
        }
        for m in sorted(date_keys)
    ]

    # Industry rollup for dashboard
    industry_summary: dict[str, dict] = defaultdict(
        lambda: {"active_users": set(), "sessions": 0, "hours": 0.0, "cost": 0.0, "tools": set()}
    )
    for row in fact_adoption:
        s = industry_summary[row["industry"]]
        # active_users already counted per tool; recompute from usage below
        s["sessions"] += row["total_sessions"]
        s["hours"] += row["total_hours_saved"]
        s["cost"] += row["total_cost_usd"]
        s["tools"].add(row["tool_key"])

    for row in usage:
        industry_summary[user_by_id[row["user_id"]]["industry"]]["active_users"].add(row["user_id"])

    fact_industry = [
        {
            "industry": ind,
            "active_users": len(s["active_users"]),
            "tools_adopted": len(s["tools"]),
            "total_sessions": s["sessions"],
            "total_hours_saved": round(s["hours"], 2),
            "total_cost_usd": round(s["cost"], 2),
            "hours_per_dollar": round(s["hours"] / s["cost"], 3) if s["cost"] else 0,
        }
        for ind, s in sorted(industry_summary.items())
    ]

    return dim_date, fact_adoption, fact_user_metrics, fact_monthly, fact_industry


def write_sqlite(dim_user, dim_tool, dim_date, facts) -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE dim_user (
          user_key TEXT PRIMARY KEY,
          user_name TEXT,
          industry TEXT,
          role TEXT,
          company_size TEXT,
          region TEXT
        );
        CREATE TABLE dim_tool (
          tool_key TEXT PRIMARY KEY,
          tool_name TEXT,
          category TEXT,
          vendor TEXT,
          monthly_cost_usd REAL,
          license_type TEXT
        );
        CREATE TABLE dim_date (
          month_key TEXT PRIMARY KEY,
          year INTEGER,
          month INTEGER,
          quarter TEXT
        );
        CREATE TABLE fact_adoption_by_industry_tool (
          industry TEXT,
          tool_key TEXT,
          tool_name TEXT,
          category TEXT,
          active_users INTEGER,
          total_sessions INTEGER,
          total_hours_saved REAL,
          total_cost_usd REAL,
          hours_per_dollar REAL,
          completion_rate REAL
        );
        CREATE TABLE fact_user_metrics (
          user_key TEXT PRIMARY KEY,
          user_name TEXT,
          industry TEXT,
          role TEXT,
          region TEXT,
          company_size TEXT,
          tools_used INTEGER,
          total_sessions INTEGER,
          total_hours_saved REAL,
          total_cost_usd REAL,
          roi_hours_per_dollar REAL,
          avg_satisfaction REAL,
          segment TEXT
        );
        CREATE TABLE fact_monthly_industry (
          month_key TEXT,
          industry TEXT,
          active_users INTEGER,
          total_sessions INTEGER,
          total_hours_saved REAL,
          total_cost_usd REAL
        );
        CREATE TABLE fact_industry_summary (
          industry TEXT PRIMARY KEY,
          active_users INTEGER,
          tools_adopted INTEGER,
          total_sessions INTEGER,
          total_hours_saved REAL,
          total_cost_usd REAL,
          hours_per_dollar REAL
        );
        """
    )

    cur.executemany(
        "INSERT INTO dim_user VALUES (?,?,?,?,?,?)",
        [tuple(r.values()) for r in dim_user],
    )
    cur.executemany(
        "INSERT INTO dim_tool VALUES (?,?,?,?,?,?)",
        [tuple(r.values()) for r in dim_tool],
    )
    cur.executemany(
        "INSERT INTO dim_date VALUES (?,?,?,?)",
        [tuple(r.values()) for r in dim_date],
    )

    fact_adoption, fact_user, fact_monthly, fact_industry = facts
    cur.executemany(
        "INSERT INTO fact_adoption_by_industry_tool VALUES (?,?,?,?,?,?,?,?,?,?)",
        [tuple(r.values()) for r in fact_adoption],
    )
    cur.executemany(
        "INSERT INTO fact_user_metrics VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [tuple(r.values()) for r in fact_user],
    )
    cur.executemany(
        "INSERT INTO fact_monthly_industry VALUES (?,?,?,?,?,?)",
        [tuple(r.values()) for r in fact_monthly],
    )
    cur.executemany(
        "INSERT INTO fact_industry_summary VALUES (?,?,?,?,?,?,?)",
        [tuple(r.values()) for r in fact_industry],
    )
    conn.commit()
    conn.close()


def main() -> None:
    users = read_csv(RAW / "users.csv")
    tools = read_csv(RAW / "tools.csv")
    usage_raw = read_csv(RAW / "usage_logs.csv")
    usage = clean_usage(usage_raw)

    # Write cleaned staging table (MySQL-style)
    write_csv(
        PROCESSED / "stg_usage_clean.csv",
        [
            {
                "log_id": r["log_id"],
                "user_id": r["user_id"],
                "tool_id": r["tool_id"],
                "event_date": r["event_date"],
                "sessions": r["sessions"],
                "hours_saved": r["hours_saved"],
                "session_cost_usd": r["session_cost_usd"],
                "status": r["status"],
                "satisfaction": r["satisfaction"] if r["satisfaction"] is not None else "",
                "is_completed": r["is_completed"],
            }
            for r in usage
        ],
        [
            "log_id",
            "user_id",
            "tool_id",
            "event_date",
            "sessions",
            "hours_saved",
            "session_cost_usd",
            "status",
            "satisfaction",
            "is_completed",
        ],
    )

    dim_user, dim_tool, _ = build_dims(users, tools)
    dim_date, fact_adoption, fact_user, fact_monthly, fact_industry = aggregate(usage, users, tools)

    write_csv(PROCESSED / "dim_user.csv", dim_user, list(dim_user[0].keys()))
    write_csv(PROCESSED / "dim_tool.csv", dim_tool, list(dim_tool[0].keys()))
    write_csv(PROCESSED / "dim_date.csv", dim_date, list(dim_date[0].keys()))
    write_csv(PROCESSED / "fact_adoption_by_industry_tool.csv", fact_adoption, list(fact_adoption[0].keys()))
    write_csv(PROCESSED / "fact_user_metrics.csv", fact_user, list(fact_user[0].keys()))
    write_csv(PROCESSED / "fact_monthly_industry.csv", fact_monthly, list(fact_monthly[0].keys()))
    write_csv(PROCESSED / "fact_industry_summary.csv", fact_industry, list(fact_industry[0].keys()))

    write_sqlite(dim_user, dim_tool, dim_date, (fact_adoption, fact_user, fact_monthly, fact_industry))

    # Dashboard-ready JSON bundle
    import json

    dashboard = {
        "industrySummary": fact_industry,
        "adoptionByIndustryTool": fact_adoption,
        "userMetrics": fact_user,
        "monthlyIndustry": fact_monthly,
        "tools": dim_tool,
        "meta": {
            "users": len(users),
            "tools": len(tools),
            "usageEvents": len(usage),
            "completedEvents": sum(r["is_completed"] for r in usage),
        },
    }
    dash_path = ROOT / "src" / "data" / "dashboard.json"
    dash_path.parent.mkdir(parents=True, exist_ok=True)
    dash_path.write_text(json.dumps(dashboard, indent=2))
    print(f"Star schema written to {PROCESSED}")
    print(f"SQLite warehouse → {DB_PATH}")
    print(f"Dashboard JSON → {dash_path}")


if __name__ == "__main__":
    main()
