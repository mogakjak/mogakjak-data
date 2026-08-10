import csv, io, pathlib

raw = pathlib.Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\_gid0_export_raw.csv").read_bytes()
text = raw.replace(b"\r\r\n", b"\n").replace(b"\r\n", b"\n").replace(b"\r", b"\n").decode("utf-8")
rows = list(csv.reader(io.StringIO(text)))
out = [f"rows={len(rows)}"]
for i, r in enumerate(rows, 1):
    cells = [c.strip() for c in r]
    while len(cells) < 10:
        cells.append("")
    if any(cells):
        out.append(f"{i:03d}\t" + "\t".join(cells[:10]))
pathlib.Path(r"c:\00_mogakjak\mogakjak_data_pipeline\docs\sheets\_gid0_parsed.txt").write_text(
    "\n".join(out), encoding="utf-8"
)
print("ok", len(out))
