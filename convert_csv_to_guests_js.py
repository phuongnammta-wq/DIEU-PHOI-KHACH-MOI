import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV_NAME = "DANH_SACH_KHACH_MOI_TRA_CUU_GHE_22_4.csv"
OUT_NAME = "guests.js"

def clean(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())

rows = []
with open(ROOT / CSV_NAME, encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rank_name = clean(row.get("rank_name", ""))
        position = clean(row.get("position", ""))
        seat = clean(row.get("seat", "")).upper()
        if not rank_name or not seat:
            continue
        rows.append({
            "rank_name": rank_name,
            "position": position,
            "seat": seat
        })

with open(ROOT / OUT_NAME, "w", encoding="utf-8") as f:
    f.write("window.GUESTS = ")
    json.dump(rows, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print(f"Đã tạo {OUT_NAME} với {len(rows)} bản ghi.")
