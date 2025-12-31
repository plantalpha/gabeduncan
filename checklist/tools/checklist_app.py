#!/usr/bin/env python3
import json
import subprocess
import sys
import webbrowser
from pathlib import Path
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKLIST_DIR = REPO_ROOT / "checklist"
MANIFEST_PATH = CHECKLIST_DIR / "manifest.json"
GENERATOR = CHECKLIST_DIR / "tools" / "checklist_gen.py"

def run(cmd, cwd=None):
  p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=False)
  return p.returncode, p.stdout.strip(), p.stderr.strip()

def iso_to_year_mmdd(iso):
  dt = datetime.strptime(iso, "%Y-%m-%d")
  return f"{dt.year:04d}", f"{dt.month:02d}{dt.day:02d}"

def day_paths(year, mmdd):
  day_dir = CHECKLIST_DIR / year / mmdd
  return day_dir, day_dir / "content.json"

def read_manifest():
  if not MANIFEST_PATH.exists():
    return {"years": {}}
  return json.loads(MANIFEST_PATH.read_text("utf-8"))

def write_content_json(year, mmdd, title, tasks, notes_html, photos):
  day_dir, content_path = day_paths(year, mmdd)
  day_dir.mkdir(parents=True, exist_ok=True)
  payload = {
    "title": title.strip() or f"{year}-{mmdd[:2]}-{mmdd[2:]}",
    "tasks": [t for t in tasks if t.strip()],
    "notesHtml": notes_html.strip(),
    "photos": [p for p in photos if p.strip()],
  }
  content_path.write_text(json.dumps(payload, indent=2), "utf-8")

def read_content_json(year, mmdd):
  _, content_path = day_paths(year, mmdd)
  if not content_path.exists():
    return {"title": "", "tasks": [], "notesHtml": "", "photos": []}
  return json.loads(content_path.read_text("utf-8"))

def git_publish(commit_msg):
  code, out, err = run(["git", "add", "."], cwd=REPO_ROOT)
  if code != 0:
    raise RuntimeError(err or out or "git add failed")

  code, out, err = run(["git", "commit", "-m", commit_msg], cwd=REPO_ROOT)
  if code != 0 and "nothing to commit" not in (out + err).lower():
    raise RuntimeError(err or out or "git commit failed")

  code, out, err = run(["git", "push"], cwd=REPO_ROOT)
  if code != 0:
    raise RuntimeError(err or out or "git push failed")

def ensure_day_generated(iso):
  code, out, err = run([sys.executable, str(GENERATOR), "new", "--date", iso], cwd=REPO_ROOT)
  if code != 0:
    raise RuntimeError(err or out or "Generator failed")
  return out, err

class ChecklistApp(tk.Tk):
  def __init__(self):
    super().__init__()
    self._apply_forest_theme()
    self.title("Checklist Publisher")
    self.geometry("980x720")

    self.m = read_manifest()

    # top bar
    top = ttk.Frame(self)
    top.pack(fill="x", padx=10, pady=8)

    ttk.Label(top, text="Checklist Publisher", style="Title.TLabel").pack(side="left")
    ttk.Label(top, text=f"   {REPO_ROOT}", style="Muted.TLabel").pack(side="left")


    self.push_var = tk.BooleanVar(value=True)
    ttk.Checkbutton(top, text="Publish (git push)", variable=self.push_var).pack(side="right")

    # tabs
    nb = ttk.Notebook(self)
    nb.pack(fill="both", expand=True, padx=10, pady=10)

    self.create_tab = ttk.Frame(nb)
    self.edit_tab = ttk.Frame(nb)

    nb.add(self.create_tab, text="Create New")
    nb.add(self.edit_tab, text="Edit Existing")

    self._build_create_tab()
    self._build_edit_tab()
    self._refresh_edit_day_list()

  def _apply_forest_theme(self):
    # Forest palette
    self.COL_BG      = "#0f241a"  # dark forest
    self.COL_PANEL   = "#173425"  # slightly lighter
    self.COL_CARD    = "#1f4631"  # mid forest
    self.COL_ACCENT  = "#2f7a4c"  # bright green accent
    self.COL_TEXT    = "#e8fff1"  # near-white mint
    self.COL_MUTED   = "#bfe8cd"  # soft mint
    self.COL_INPUTBG = "#102a1d"  # input background
    self.COL_BORDER  = "#295d3e"  # border

    style = ttk.Style(self)

    # Use a modern ttk theme if available
    try:
      style.theme_use("clam")
    except tk.TclError:
      pass

    # Base window background
    self.configure(bg=self.COL_BG)

    # Notebook (tabs)
    style.configure("TNotebook", background=self.COL_BG, borderwidth=0)
    style.configure("TNotebook.Tab",
                    padding=(14, 8),
                    background=self.COL_PANEL,
                    foreground=self.COL_MUTED)
    style.map("TNotebook.Tab",
              background=[("selected", self.COL_CARD), ("active", self.COL_CARD)],
              foreground=[("selected", self.COL_TEXT), ("active", self.COL_TEXT)])

    # Frames
    style.configure("TFrame", background=self.COL_BG)
    style.configure("Card.TFrame", background=self.COL_PANEL)

    # Labels
    style.configure("TLabel", background=self.COL_BG, foreground=self.COL_TEXT)
    style.configure("Muted.TLabel", background=self.COL_BG, foreground=self.COL_MUTED)
    style.configure("Title.TLabel", background=self.COL_BG, foreground=self.COL_TEXT, font=("Segoe UI", 12, "bold"))

    # Buttons
    style.configure("TButton",
                    background=self.COL_ACCENT,
                    foreground="#08140d",
                    padding=(12, 8),
                    borderwidth=0)
    style.map("TButton",
              background=[("active", "#3b915e"), ("pressed", "#276a43")],
              foreground=[("active", "#06110b")])

    style.configure("Ghost.TButton",
                    background=self.COL_PANEL,
                    foreground=self.COL_TEXT,
                    padding=(12, 8))
    style.map("Ghost.TButton",
              background=[("active", self.COL_CARD), ("pressed", self.COL_PANEL)])

    # Checkbutton
    style.configure("TCheckbutton", background=self.COL_BG, foreground=self.COL_TEXT)

    # Combobox
    style.configure("TCombobox",
                    fieldbackground=self.COL_INPUTBG,
                    background=self.COL_INPUTBG,
                    foreground=self.COL_TEXT,
                    arrowcolor=self.COL_TEXT)
    self.option_add("*TCombobox*Listbox.background", self.COL_INPUTBG)
    self.option_add("*TCombobox*Listbox.foreground", self.COL_TEXT)

  def _style_text_widget(self, tw: tk.Text):
    tw.configure(
      bg=self.COL_INPUTBG,
      fg=self.COL_TEXT,
      insertbackground=self.COL_TEXT,
      selectbackground="#2f7a4c",
      selectforeground="#06110b",
      relief="flat",
      highlightthickness=1,
      highlightbackground=self.COL_BORDER,
      highlightcolor=self.COL_ACCENT,
      padx=10, pady=10,
      font=("Consolas", 11)  # feels like a tool/editor
    )

  # ---------- UI helpers ----------
  def _html_toolbar(self, parent, text_widget):
    bar = ttk.Frame(parent)
    bar.pack(fill="x", pady=(0,6))

    def wrap(tag_open, tag_close):
      try:
        start = text_widget.index("sel.first")
        end = text_widget.index("sel.last")
        selected = text_widget.get(start, end)
        text_widget.delete(start, end)
        text_widget.insert(start, f"{tag_open}{selected}{tag_close}")
      except tk.TclError:
        # no selection -> insert tags
        text_widget.insert("insert", f"{tag_open}{tag_close}")

    def insert(s):
      text_widget.insert("insert", s)

    ttk.Button(bar, text="B", width=3, command=lambda: wrap("<b>", "</b>")).pack(side="left")
    ttk.Button(bar, text="I", width=3, command=lambda: wrap("<i>", "</i>")).pack(side="left", padx=(4,0))
    ttk.Button(bar, text="Link", command=lambda: insert('<a href="https://">link text</a>')).pack(side="left", padx=(8,0))
    ttk.Button(bar, text="UL", command=lambda: insert("<ul>\n  <li></li>\n</ul>\n")).pack(side="left", padx=(8,0))
    ttk.Button(bar, text="HR", command=lambda: insert("<hr/>\n")).pack(side="left", padx=(8,0))
    ttk.Button(bar, text="BR", command=lambda: insert("<br/>\n")).pack(side="left", padx=(8,0))

    ttk.Button(bar, text="Preview Notes", style="Ghost.TButton", command=lambda: self._preview_html(text_widget.get("1.0","end"))).pack(side="right")

  def _preview_html(self, notes_html):
    tmp = CHECKLIST_DIR / "_notes_preview.html"
    body = f"""<!doctype html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Notes Preview</title>
  <link rel="stylesheet" href="./view.css">
  </head>
  <body>
    <header class="top">
      <div class="titleWrap">
        <div class="kicker">Notes Preview</div>
        <h1>How it will render</h1>
      </div>
    </header>
    <main class="wrap">
      <section class="card">
        <div class="notes">{notes_html}</div>
      </section>
    </main>
  </body></html>"""
    tmp.write_text(body, "utf-8")
    webbrowser.open(tmp.as_uri())


  def _get_lines(self, text_widget):
    return [ln.strip() for ln in text_widget.get("1.0","end").splitlines() if ln.strip()]

  def _log(self, widget, msg):
    widget.configure(state="normal")
    widget.insert("end", msg + "\n")
    widget.see("end")
    widget.configure(state="disabled")

  # ---------- Create tab ----------
  def _build_create_tab(self):
    frm = ttk.Frame(self.create_tab)
    frm.pack(fill="both", expand=True)

    row = ttk.Frame(frm)
    row.pack(fill="x", padx=8, pady=8)

    ttk.Label(row, text="Date (YYYY-MM-DD):").pack(side="left")
    self.create_date = tk.StringVar(value=datetime.now().strftime("%Y-%m-%d"))
    ttk.Entry(row, textvariable=self.create_date, width=16).pack(side="left", padx=8)

    ttk.Label(row, text="Title (optional):").pack(side="left", padx=(16,0))
    self.create_title = tk.StringVar(value="")
    ttk.Entry(row, textvariable=self.create_title).pack(side="left", fill="x", expand=True, padx=8)

    body = ttk.Frame(frm)
    body.pack(fill="both", expand=True, padx=8, pady=8)

    # left: tasks + photos
    left = ttk.Frame(body)
    left.pack(side="left", fill="both", expand=True, padx=(0,8))

    ttk.Label(left, text="Checklist items (one per line):").pack(anchor="w")
    self.create_tasks = tk.Text(left, height=14)
    self.create_tasks.pack(fill="both", expand=True, pady=(4,10))
    self.create_tasks.insert("1.0", "Drink water\nMove body (10–30 min)\nMake something (music/video/code)\n")

    ttk.Label(left, text="Photo URLs (one per line) — optional:").pack(anchor="w")
    self.create_photos = tk.Text(left, height=6)
    self.create_photos.pack(fill="both", expand=False, pady=(4,0))

    # right: notes HTML
    right = ttk.Frame(body)
    right.pack(side="left", fill="both", expand=True)

    ttk.Label(right, text="Notes (rich-ish HTML):").pack(anchor="w")
    self.create_notes = tk.Text(right, height=20)
    self.create_notes.pack(fill="both", expand=True, pady=(4,0))
    self._bind_enter_to_br(self.create_notes)
    self._html_toolbar(right, self.create_notes)

    # bottom actions + log
    actions = ttk.Frame(frm)
    actions.pack(fill="x", padx=8, pady=(0,8))

    ttk.Button(actions, text="POST (Generate + Write + Publish)", command=self._create_post).pack(side="left")

    self.create_log = tk.Text(frm, height=8)
    self.create_log.pack(fill="both", expand=False, padx=8, pady=(0,8))
    self.create_log.configure(state="disabled")

  def _create_post(self):
    try:
      iso = self.create_date.get().strip()
      datetime.strptime(iso, "%Y-%m-%d")

      title = self.create_title.get().strip()
      tasks = self._get_lines(self.create_tasks)
      photos = self._get_lines(self.create_photos)
      notes_html = self.create_notes.get("1.0","end").rstrip("\n")

      if not tasks:
        raise ValueError("Add at least 1 checklist item.")

      out, err = ensure_day_generated(iso)
      if out: self._log(self.create_log, out)
      if err: self._log(self.create_log, err)

      year, mmdd = iso_to_year_mmdd(iso)
      write_content_json(year, mmdd, title or f"{year}-{mmdd[:2]}-{mmdd[2:]}", tasks, notes_html, photos)
      self._log(self.create_log, f"✅ Wrote content.json: /checklist/{year}/{mmdd}/content.json")

      if self.push_var.get():
        git_publish(f"Checklist {iso}")
        self._log(self.create_log, "✅ Published (git push).")
      else:
        self._log(self.create_log, "ℹ️ Publish disabled (no git push).")

      self.m = read_manifest()
      self._refresh_edit_day_list()

      messagebox.showinfo("Done", f"Posted!\n/checklist/{year}/{mmdd}/")
    except Exception as e:
      messagebox.showerror("Error", str(e))
      self._log(self.create_log, f"ERROR: {e}")

  def _bind_enter_to_br(self, text_widget):
    def on_enter(event):
      text_widget.insert("insert", "<br/>\n")
      return "break"  # prevents actual newline char
    text_widget.bind("<Return>", on_enter)


  # ---------- Edit tab ----------
  def _build_edit_tab(self):
    frm = ttk.Frame(self.edit_tab)
    frm.pack(fill="both", expand=True)

    top = ttk.Frame(frm)
    top.pack(fill="x", padx=8, pady=8)

    ttk.Label(top, text="Select day:").pack(side="left")
    self.edit_choice = tk.StringVar(value="")
    self.edit_combo = ttk.Combobox(top, textvariable=self.edit_choice, state="readonly", width=20)
    self.edit_combo.pack(side="left", padx=8)
    self.edit_combo.bind("<<ComboboxSelected>>", lambda e: self._load_selected_day())

    ttk.Button(top, text="Reload manifest", style="Ghost.TButton", command=self._reload_manifest).pack(side="left", padx=(8,0))

    ttk.Label(top, text="Title:").pack(side="left", padx=(16,0))
    self.edit_title = tk.StringVar(value="")
    ttk.Entry(top, textvariable=self.edit_title).pack(side="left", fill="x", expand=True, padx=8)

    body = ttk.Frame(frm)
    body.pack(fill="both", expand=True, padx=8, pady=8)

    left = ttk.Frame(body)
    left.pack(side="left", fill="both", expand=True, padx=(0,8))

    ttk.Label(left, text="Checklist items (one per line):").pack(anchor="w")
    self.edit_tasks = tk.Text(left, height=14)
    self.edit_tasks.pack(fill="both", expand=True, pady=(4,10))

    ttk.Label(left, text="Photo URLs (one per line):").pack(anchor="w")
    self.edit_photos = tk.Text(left, height=6)
    self.edit_photos.pack(fill="both", expand=False, pady=(4,0))

    right = ttk.Frame(body)
    right.pack(side="left", fill="both", expand=True)

    ttk.Label(right, text="Notes (rich-ish HTML):").pack(anchor="w")
    self.edit_notes = tk.Text(right, height=20)
    self.edit_notes.pack(fill="both", expand=True, pady=(4,0))
    self._bind_enter_to_br(self.edit_notes)
    self._html_toolbar(right, self.edit_notes)

    actions = ttk.Frame(frm)
    actions.pack(fill="x", padx=8, pady=(0,8))

    ttk.Button(actions, text="UPDATE + PUBLISH", command=self._edit_update).pack(side="left")

    self.edit_log = tk.Text(frm, height=8)
    self.edit_log.pack(fill="both", expand=False, padx=8, pady=(0,8))
    self.edit_log.configure(state="disabled")

  def _reload_manifest(self):
    self.m = read_manifest()
    self._refresh_edit_day_list()
    self._log(self.edit_log, "✅ Reloaded manifest.")

  def _refresh_edit_day_list(self):
    # list entries like "2026-0101"
    m = self.m
    items = []
    for y in sorted((m.get("years") or {}).keys()):
      for mmdd in sorted(m["years"][y]):
        items.append(f"{y}-{mmdd}")
    self.edit_combo["values"] = items
    if items and not self.edit_choice.get():
      self.edit_choice.set(items[0])
      self._load_selected_day()

  def _load_selected_day(self):
    choice = self.edit_choice.get().strip()
    if not choice or "-" not in choice:
      return
    year, mmdd = choice.split("-", 1)
    data = read_content_json(year, mmdd)

    self.edit_title.set(data.get("title",""))

    self.edit_tasks.delete("1.0","end")
    self.edit_tasks.insert("1.0", "\n".join(data.get("tasks", []) or []) + "\n")

    self.edit_photos.delete("1.0","end")
    self.edit_photos.insert("1.0", "\n".join(data.get("photos", []) or []) + "\n")

    self.edit_notes.delete("1.0","end")
    self.edit_notes.insert("1.0", data.get("notesHtml","") or "")

  def _edit_update(self):
    try:
      choice = self.edit_choice.get().strip()
      if not choice or "-" not in choice:
        raise ValueError("Pick a day to edit.")
      year, mmdd = choice.split("-", 1)

      title = self.edit_title.get().strip() or f"{year}-{mmdd[:2]}-{mmdd[2:]}"
      tasks = self._get_lines(self.edit_tasks)
      photos = self._get_lines(self.edit_photos)
      notes_html = self.edit_notes.get("1.0","end").rstrip("\n")

      if not tasks:
        raise ValueError("Add at least 1 checklist item.")

      # ensure day page exists
      iso = f"{year}-{mmdd[:2]}-{mmdd[2:]}"
      out, err = ensure_day_generated(iso)
      if out: self._log(self.edit_log, out)
      if err: self._log(self.edit_log, err)

      write_content_json(year, mmdd, title, tasks, notes_html, photos)
      self._log(self.edit_log, f"✅ Updated content.json: /checklist/{year}/{mmdd}/content.json")

      if self.push_var.get():
        git_publish(f"Update checklist {iso}")
        self._log(self.edit_log, "✅ Published (git push).")
      else:
        self._log(self.edit_log, "ℹ️ Publish disabled (no git push).")

      messagebox.showinfo("Done", f"Updated!\n/checklist/{year}/{mmdd}/")
    except Exception as e:
      messagebox.showerror("Error", str(e))
      self._log(self.edit_log, f"ERROR: {e}")

if __name__ == "__main__":
  ChecklistApp().mainloop()
