#!/usr/bin/env python3

"""Regenerate src/data/papers.json from src/data/Papers.csv.

Papers.csv is the source of record and keeps every column exported from the
Google Sheet. papers.json is a generated subset: it is imported directly by
src/pages/publications.js, so every field in it is bundled into the JavaScript
that each visitor to /publications/ downloads. Only the fields that
src/components/publication_table.js actually renders are emitted, which keeps
that payload roughly 40% smaller than the full export.

Add a field here (and to the component) if the publications page starts using
it; do not hand-edit papers.json.
"""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'src' / 'data' / 'Papers.csv'
JSON_PATH = ROOT / 'src' / 'data' / 'papers.json'

# Fields read by src/components/publication_table.js.
RENDERED_FIELDS = (
    'Title',
    'Authors',
    'Location',
    'PublicationType',
    'PublishedDateYear',
    'PDFLink',
    'ProjectLink',
)


def main():
    with CSV_PATH.open(newline='', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        missing = [field for field in RENDERED_FIELDS if field not in reader.fieldnames]
        if missing:
            raise SystemExit(f'Papers.csv is missing expected column(s): {", ".join(missing)}')
        rows = [{field: row[field] for field in RENDERED_FIELDS} for row in reader]

    JSON_PATH.write_text(
        json.dumps(rows, ensure_ascii=True, separators=(',', ':')),
        encoding='utf-8',
    )

    print(f'Synced {len(rows)} publications to {JSON_PATH}')


if __name__ == '__main__':
    main()
