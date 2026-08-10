import csv
import io
from pathlib import Path

raw = Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\_gid0_latest.csv").read_bytes()
text = raw.replace(b"\r\r\n", b"\n").replace(b"\r\n", b"\n").replace(b"\r", b"\n").decode("utf-8")
rows = list(csv.reader(io.StringIO(text)))

out = []
for i, r in enumerate(rows, 1):
    cells = [c.strip() for c in r]
    while len(cells) < 12:
        cells.append("")
    if any(cells):
        out.append(f"{i:03d}\t" + "\t".join(cells[:12]))

Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\_gid0_latest_parsed.txt").write_text("\n".join(out), encoding="utf-8")
print("rows", len(rows), "nonempty", len(out))
