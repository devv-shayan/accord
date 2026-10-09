from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
source = root / "extension" / "accord-meet"
output = root / "public" / "downloads" / "accord-meet.zip"
output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for file in sorted(source.rglob("*")):
        if file.is_file() and file.name != ".DS_Store":
            archive.write(file, file.relative_to(source))
print(f"Packed Accord Meet: {output}")
