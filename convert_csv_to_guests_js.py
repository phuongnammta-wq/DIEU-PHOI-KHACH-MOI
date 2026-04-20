#!/usr/bin/env python3
import csv
import json
from pathlib import Path

CSV_FILE = Path("DANH_SACH_KHACH_MOI_TRA_CUU_GHE_ANH_HUNG.csv")
OUTPUT_FILE = Path("guests.js")

def main():
    guests = []
    with CSV_FILE.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rank_name = (row.get("rank_name") or "").strip()
            position = (row.get("position") or "").strip()
            seat = (row.get("seat") or "").strip()
            if rank_name and seat:
                guests.append({
                    "rank_name": rank_name,
                    "position": position,
                    "seat": seat,
                })

    js = "window.GUESTS = " + json.dumps(guests, ensure_ascii=False, indent=2) + ";\n"
    js += "window.EVENT_TITLE = 'Tra cứu ghế khách mời';\n"
    OUTPUT_FILE.write_text(js, encoding="utf-8")
    print(f"Đã tạo {OUTPUT_FILE} với {len(guests)} khách mời.")

if __name__ == "__main__":
    main()
