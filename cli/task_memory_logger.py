#!/usr/bin/env python3
"""
Antigravity Task Memory Logger & Spreadsheet Tracker v1.0.0
Automatically logs all conversation turns, user goals, browser actions,
and task statuses into a persistent CSV and Markdown spreadsheet for long-term memory.
"""

import os
import csv
import json
import time
from datetime import datetime

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(WORKSPACE_DIR, "historico_tarefas_antigravity.csv")
MD_PATH = os.path.join(WORKSPACE_DIR, "task_history_tracker.md")

CSV_HEADERS = [
    "ID",
    "Timestamp",
    "Categoria",
    "Instrução / Prompt",
    "Ações Executadas",
    "Status",
    "Resumo do Resultado",
    "URL / Contexto",
    "Notas"
]

def init_spreadsheets():
    """Ensures CSV and Markdown spreadsheet files exist with headers."""
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADERS)

    if not os.path.exists(MD_PATH):
        with open(MD_PATH, "w", encoding="utf-8") as f:
            f.write("# 📑 Planilha de Memória e Acompanhamento de Tarefas (Antigravity AI)\n\n")
            f.write("Esta planilha contém o histórico persistente de todas as tarefas, conversas e automações no navegador.\n\n")
            f.write("| ID | Timestamp | Categoria | Instrução / Prompt | Ações Executadas | Status | Resumo do Resultado | URL / Contexto |\n")
            f.write("|---|---|---|---|---|---|---|---|\n")

_last_logged_entry = {"hash": "", "time": 0, "task_id": ""}

def log_task_entry(category, prompt, actions="", status="Concluído", result_summary="", url="", notes=""):
    """Appends a new task entry to both CSV and Markdown spreadsheets (with 3s deduplication)."""
    global _last_logged_entry
    init_spreadsheets()
    
    clean_prompt = prompt.replace("\n", " ").replace("|", "-")
    clean_actions = actions.replace("\n", " ").replace("|", "-")
    clean_result = result_summary.replace("\n", " ").replace("|", "-")
    clean_url = url.replace("\n", "").replace("|", "-")
    clean_notes = notes.replace("\n", " ").replace("|", "-")

    entry_hash = f"{category}:{clean_prompt[:50]}:{clean_actions[:50]}:{clean_url}"
    now = time.time()

    # Skip duplicate logging within 3 seconds
    if _last_logged_entry["hash"] == entry_hash and (now - _last_logged_entry["time"]) < 3.0:
        return _last_logged_entry["task_id"]

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    task_id = f"task_{int(now)}"
    _last_logged_entry = {"hash": entry_hash, "time": now, "task_id": task_id}

    # Append to CSV
    row = [task_id, timestamp, category, clean_prompt, clean_actions, status, clean_result, clean_url, clean_notes]
    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(row)

    # Append to Markdown Table
    md_row = f"| `{task_id}` | `{timestamp}` | **{category}** | {clean_prompt[:60]} | {clean_actions[:40]} | `{status}` | {clean_result[:80]} | [{clean_url[:30]}]({clean_url}) |\n"
    with open(MD_PATH, "a", encoding="utf-8") as f:
        f.write(md_row)

    return task_id

def get_recent_history(limit=10):
    """Reads recent task history for agent memory retrieval."""
    init_spreadsheets()
    history = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            history.append(row)
    return history[-limit:]

if __name__ == "__main__":
    init_spreadsheets()
    print(f"✅ Planilhas de memória inicializadas em:\n - {CSV_PATH}\n - {MD_PATH}")
