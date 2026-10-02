# AdoptLens — AI Tool Adoption Analytics

Portfolio project: a **multi-tool data pipeline** story (Excel → MySQL → Apache Spark → AWS Redshift → Tableau) with a polished local dashboard.

**Stack:** Vite · React · TypeScript · Recharts · Python (CSV/SQLite) · SQL

## Quick start (dashboard)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Pipeline overview

| Stage (resume story) | Local stand-in in this repo |
| --- | --- |
| **Excel** — raw extracts, nulls, pivots | `data/raw/*.csv` (Excel-friendly) |
| **MySQL** — users, tools, usage logs | `sql/schema.sql` + `sql/seed_sqlite.sql` → SQLite OLTP demo |
| **Apache Spark** — large-scale `groupBy` aggregations | `pipeline/spark_style_aggregate.py` (same aggregation pattern, small data) |
| **AWS Redshift** — star schema (facts + dims) | `data/processed/dim_*.csv`, `fact_*.csv` + `data/adoption.db` |
| **Tableau** — adoption / ROI / segments | React + Recharts dashboard (`src/`) |

### Regenerate data

```bash
npm run pipeline
```

1. `pipeline/generate_usage.py` — builds ~150 usage log rows from users + tools  
2. `pipeline/spark_style_aggregate.py` — cleans nulls, aggregates, writes star schema CSVs, SQLite warehouse, and `src/data/dashboard.json`

Optional MySQL-style load into SQLite:

```bash
sqlite3 data/adoption_oltp.db < sql/seed_sqlite.sql
```

## Project layout

```
data/raw/           # users, tools, usage_logs (CSV)
data/processed/     # star-schema dims + facts
data/adoption.db    # analytics warehouse (SQLite)
sql/                # MySQL-style schema + SQLite seed
pipeline/           # generate + Spark-style aggregate
src/                # AdoptLens dashboard UI
```

## Dashboard views

1. **AI tool adoption by industry** — users, tools adopted, top tools (filterable)  
2. **Time saved vs cost** — industry scatter (ROI) + monthly hours/cost trend  
3. **User segmentation** — Power / Regular / Explorer / Light + detail table  

## Visual direction

**Coastal analytics:** misted seafoam paper background, deep teal brand signal, amber accents, Fraunces + Karla typography. Light-first, intentional motion (KPI count-up, staggered section rise, segment bar grow).

## License

MIT — synthetic demo data only; not affiliated with the named AI vendors.
