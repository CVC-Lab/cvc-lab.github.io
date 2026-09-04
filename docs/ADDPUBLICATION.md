# Add Publication

1. Go to CVC Publications Google Sheet
2. Add new row, and input a unique PaperID. Authors, Title, Location, PublicationType, PublishedDateMonth, and PublishedDateYear are required while PDFLink and ProjectLink are optional.
3. Export the updated sheet to `src/data/Papers.csv`.
4. Run `npm run sync:publications` to regenerate `src/data/papers.json`.
5. Restart Gatsby if it is already running.

## Which file is the source of record

`src/data/Papers.csv` is the source of record and holds every column exported
from the Sheet. `src/data/papers.json` is **generated** from it and only carries
the fields the publications page renders, because that file is bundled into the
JavaScript every visitor to `/publications/` downloads.

Never hand-edit `papers.json` — step 4 overwrites it. Edit `Papers.csv` (and the
Sheet, so a later full export does not undo the change), then re-run the sync.
If the publications page needs a new field, add it to `RENDERED_FIELDS` in
`scripts/sync-publications-json.py` as well as to the component.
