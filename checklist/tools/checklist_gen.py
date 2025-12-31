#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
from datetime import date, datetime

# file lives at checklist/tools/checklist_gen.py
REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKLIST_DIR = REPO_ROOT / "checklist"
MANIFEST_PATH = CHECKLIST_DIR / "manifest.json"

HOME_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Checklist</title>
  <link rel="stylesheet" href="/checklist/view.css"/>
</head>
<body>
  <header class="top">
    <div class="titleWrap">
      <div class="kicker">Checklist Archive</div>
      <h1>Years</h1>
    </div>
  </header>

  <main class="wrap">
    <section class="card">
      <div class="meta">Pick a year</div>
      <div id="years" class="yearsGrid"></div>
    </section>
  </main>

  <script>
    window.CHECKLIST_VIEW = {{ type: "home" }};
  </script>
  <script src="/checklist/view_index.js"></script>
</body>
</html>
"""

YEAR_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Checklist — {year}</title>
  <link rel="stylesheet" href="/checklist/view.css"/>
</head>
<body>
  <header class="top">
    <a class="back" href="/checklist/">All years</a>
    <div class="titleWrap">
      <div class="kicker">Checklist Archive</div>
      <h1>{year}</h1>
    </div>
  </header>

  <main class="wrap">
    <section class="card">
      <div class="meta">Pick a day</div>
      <div id="days" class="daysGrid"></div>
    </section>
  </main>

  <script>
    window.CHECKLIST_VIEW = {{ type: "year", year: "{year}" }};
  </script>
  <script src="/checklist/view_index.js"></script>
</body>
</html>
"""

DAY_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Checklist — {year}-{mm}-{dd}</title>
  <link rel="stylesheet" href="/checklist/view.css"/>
</head>
<body>
  <header class="top">
    <a class="back" href="/checklist/{year}/">{year}</a>
    <div class="titleWrap">
      <div class="kicker">Daily Checklist</div>
      <h1 id="title">{year}-{mm}-{dd}</h1>
    </div>
    <div class="nav">
      <a id="prevLink" class="navBtn" href="#" aria-label="Previous day">◀</a>
      <a id="nextLink" class="navBtn" href="#" aria-label="Next day">▶</a>
    </div>
  </header>

  <main class="wrap">
    <section class="card">
      <div class="meta" id="metaLine"></div>
      <ul id="list" class="list"></ul>
    </section>

    <section class="card" id="notesCard">
      <h2>Notes</h2>
      <div id="notes" class="notes"></div>
    </section>

    <section class="card" id="photosCard">
      <h2>Photos</h2>
      <div class="carousel">
        <button id="pPrev" class="navBtn" aria-label="Previous photo">◀</button>
        <div class="viewport"><img id="pImg" alt=""/></div>
        <button id="pNext" class="navBtn" aria-label="Next photo">▶</button>
      </div>
      <div id="pCount" class="count"></div>
    </section>
  </main>

  <script>
    window.CHECKLIST_DAY = {{ year: "{year}", day: "{mm}{dd}" }};
  </script>
  <script src="/checklist/view.js"></script>
</body>
</html>
"""

def read_manifest():
  if MANIFEST_PATH.exists():
    return json.loads(MANIFEST_PATH.read_text("utf-8"))
  return {"years": {}}

def write_manifest(m):
  CHECKLIST_DIR.mkdir(parents=True, exist_ok=True)
  MANIFEST_PATH.write_text(json.dumps(m, indent=2), "utf-8")

def ensure_site_files():
  CHECKLIST_DIR.mkdir(parents=True, exist_ok=True)
  home = CHECKLIST_DIR / "index.html"
  if not home.exists():
    home.write_text(HOME_TEMPLATE, "utf-8")

def build_year_page(year: str):
  year_dir = CHECKLIST_DIR / year
  year_dir.mkdir(parents=True, exist_ok=True)
  (year_dir / "index.html").write_text(YEAR_TEMPLATE.format(year=year), "utf-8")

def build_day_page(year: str, mmdd: str):
  mm = mmdd[:2]
  dd = mmdd[2:]
  day_dir = CHECKLIST_DIR / year / mmdd
  day_dir.mkdir(parents=True, exist_ok=True)
  (day_dir / "index.html").write_text(
    DAY_TEMPLATE.format(year=year, mm=mm, dd=dd),
    "utf-8"
  )

def add_day(iso: str):
  dt = datetime.strptime(iso, "%Y-%m-%d").date()
  year = f"{dt.year:04d}"
  mmdd = f"{dt.month:02d}{dt.day:02d}"

  m = read_manifest()
  years = m.setdefault("years", {})
  days = years.setdefault(year, [])
  if mmdd not in days:
    days.append(mmdd)
    days.sort()

  write_manifest(m)
  ensure_site_files()
  build_year_page(year)
  build_day_page(year, mmdd)

  # rebuild year index pages for all years
  for y in sorted(m.get("years", {}).keys()):
    build_year_page(y)

  return year, mmdd

def rebuild_all():
  m = read_manifest()
  ensure_site_files()
  for y in sorted(m.get("years", {}).keys()):
    build_year_page(y)
    for mmdd in sorted(m["years"][y]):
      build_day_page(y, mmdd)

def main():
  p = argparse.ArgumentParser()
  sub = p.add_subparsers(dest="cmd", required=True)

  n = sub.add_parser("new")
  n.add_argument("--date", default=None, help="YYYY-MM-DD (default: today)")

  sub.add_parser("rebuild")

  a = p.parse_args()
  if a.cmd == "new":
    iso = a.date or date.today().isoformat()
    y, mmdd = add_day(iso)
    print(f"Generated /checklist/{y}/{mmdd}/ and updated manifest/indexes.")
  else:
    rebuild_all()
    print("Rebuilt all pages from manifest.json")

if __name__ == "__main__":
  main()
