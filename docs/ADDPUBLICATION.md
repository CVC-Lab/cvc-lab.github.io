# Add Publication

The list on `/publications/` comes from one file, `src/data/publications.yaml`. It is the only
source: the Google Sheet and its CSV export are no longer used.

## Steps

1. **Open `src/data/publications.yaml`.** On GitHub, open the file and use the pencil
   ("Edit this file"); locally, any text editor will do. The comment block at the top of the
   file lists every field.
2. **Find the year.** Entries are grouped by year, newest year first; a line such as `# 2026`
   starts each group. For a new year, add a `# 2027` line and the entry above the current
   newest year.
3. **Copy an entry and change it.** An entry starts with `- title:` and ends at the blank
   line. Paste the copy inside its year group, where it should appear: within one year and
   type, the page lists entries in the order of the file. For example:

   ```yaml
   - title: 'Example Title: With a Colon, So in Quotes'
     authors: A. Author, B. Author, C. Bajaj
     venue: Proceedings of an Example Conference, 2026
     type: Conference Presentations & Publications
     year: 2026
     month: 6
     pdf: https://arxiv.org/pdf/2602.00000.pdf
     project: /projects/example-project/
     arxiv: '2602.00000'
   ```

   Leave out the keys you do not need (only `title`, `authors`, `type` and `year` are
   required). Do not add `id`: it only records the PaperID of the retired Sheet.

4. **Commit the change** (on GitHub: "Commit changes"). The site shows it after the next
   deployment (see "Build and Deployment" in README.md).

## Fields

| Key             | Required         | What to write                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title`         | yes              | The paper title.                                                                                                                                                                                                                                                                                                                                                                                       |
| `authors`       | yes              | The author list as it should appear.                                                                                                                                                                                                                                                                                                                                                                   |
| `venue`         | no               | Journal, conference, publisher or other venue. Simple HTML is allowed: links (`<a href="https://...">...</a>`), `<br>`, `<i>`/`<em>`, `<b>`/`<strong>`. Scripts, event handlers and embedded content are removed. A link whose `href` is not a full `https://` or `http://` URL is shown as plain text, `http://dx.doi.org/` links are shown as `https://doi.org/`, and venue links open in a new tab. |
| `type`          | yes              | One of `Journal Publications`, `arXiv`, `Conference Presentations & Publications`, `Technical Reports`, `Book`, `Edited Books`, `Book Chapters`, `Multimedia`. These are the headings on the page, in this order within each year. Any other value still shows, as an extra heading at the end of its year (the build warns).                                                                          |
| `year`          | yes              | Four digits, without quotes: `year: 2026`.                                                                                                                                                                                                                                                                                                                                                             |
| `month`         | no               | A number from 1 to 12. Not shown on the page.                                                                                                                                                                                                                                                                                                                                                          |
| `pdf`           | no               | A full URL, or a site path starting with `/` for a file under `static/` (`/papers/name.pdf` is the file `static/papers/name.pdf`). The button reads "PDF" when the URL contains `pdf` and "Paper" otherwise, and always "Paper" for preprints.                                                                                                                                                         |
| `project`       | no               | The project page: a page of this site (`/projects/phast/`) or a full URL.                                                                                                                                                                                                                                                                                                                              |
| `doi`           | no               | The DOI alone, such as `10.1145/3337680` (no `https://doi.org/` in front). Not shown on the page.                                                                                                                                                                                                                                                                                                      |
| `arxiv`         | no               | The arXiv identifier, in quotes: `arxiv: '2402.14081'`. Not shown on the page.                                                                                                                                                                                                                                                                                                                         |
| `thumbnail`     | no               | An image next to the entry; see below.                                                                                                                                                                                                                                                                                                                                                                 |
| `thumbnail_alt` | with `thumbnail` | A short description of the image, for screen readers.                                                                                                                                                                                                                                                                                                                                                  |
| `id`            | no               | Kept from the retired Sheet; leave it out for new entries.                                                                                                                                                                                                                                                                                                                                             |

An empty value, or the text `NULL`, counts as no value.

### Thumbnails

Put a PNG or JPG in `src/images/publications/` and write its path without the extension, with
the same capital letters as the file name:

```yaml
thumbnail: publications/PUB_Example
thumbnail_alt: Diagram of the example method
```

Clicking the thumbnail on the page opens a larger preview.

### Quotes

Most values need no quotes. Put a value in single quotes when it

- contains `: ` (a colon followed by a space) or ` #`,
- starts with `'`, `"`, `[`, `{`, `#`, `&`, `*`, `!`, `|`, `>`, `%`, `@` or a backtick,
- is a number that must stay text, such as an arXiv identifier.

Inside single quotes, write an apostrophe twice: `'A Reader''s Guide'`. When in doubt, copy
the quoting of a similar entry in the file.

## Checks

The build reads the file and checks every entry. A problem names the entry number, its line
in the file and the start of its title, for example:

```
src/data/publications.yaml has 1 problem(s) to fix:
entry 3, line 61 "Example Title: With a Colon, So in Quotes": pdf "paper.pdf" is neither a full http(s) URL nor a site path starting with /; the page would drop it
```

- **Errors stop the build** (and so the deployment): a missing or empty `title`, `authors`,
  `type` or `year`; a year that is not four digits; a `pdf` or `project` link the page would
  drop; the same title, year and type twice; a repeated `id`; a `thumbnail` with no image file
  (or in a folder the site does not process) or without `thumbnail_alt`; a `month`, `doi` or
  `arxiv` in the wrong form; a misspelt key; a value that is not text where text is expected;
  and anything that is not valid YAML (the message then gives the line and column).
- **Warnings** are printed and the build continues: an unknown `type`, a venue link that is
  shown as plain text, a site-path `pdf` with no file in `static/`, characters that were
  decoded wrongly (`â€™` instead of `’`), a key with an empty value, years out of order, and
  values that start or end with spaces.

To run the same checks without a full build:

```sh
npx jest tests/publications.test.js
```

To see the page, run `npm run develop` and open http://localhost:8000/publications/. While it
runs, saving `publications.yaml` updates the page data; reload the page to see the change.
