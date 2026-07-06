# Sales-GPT-General-

D2L Sales Command Center — a daily, import-first sales operating system for Pat.
See `AGENTS.md` for build rules.

## Import samples & the cleanest manual-upload format

Real data used to test the Import Processor lives in [`samples/`](samples/):

| File | Rows | Use in app |
| --- | --- | --- |
| `pa-associations-prospects.csv` | 1,388 | Prospect / account research (full scored PA association list) |
| `open-opportunities-pipeline.csv` | 14 | Pipeline / forecast review (open Salesforce opportunities) |
| `manual-upload-template-prospects.csv` | 1 | Blank prospect-research template |
| `manual-upload-template-pipeline.csv` | 1 | Blank pipeline-review template |

In the **Imports** view, the two data files can be loaded with one click via
**Load a real sample**, and the **Cleanest Upload Format** panel shows the
recommended columns for the selected purpose. The Pipeline view is seeded from
the 14 opportunities above (`src/data/mockData.ts`).

### Cleanest format for manual uploads (v1)

Automated connectors (Salesforce, LinkedIn, Outlook, …) are a v2 concern. For
now, a manual upload is a plain CSV whose header row matches these canonical
columns. Extra columns are ignored; missing optional columns just lower the
confidence score. Put the trigger/evidence in `notes` — it drives scoring.

**Prospect / account research** (`*` = required)

```
organization*, contact, title, email, vertical, notes*
```

**Pipeline / forecast review**

```
organization*, stage*, amount*, close_date*, probability, next_step, notes
```

- `amount` is a plain number (e.g. `35000`, not `USD 35,000.00`).
- `close_date` is any readable date (e.g. `Dec 31, 2026`).
- `stage` can be free text (e.g. `2 - Intention to Move`).

Tab-, semicolon-, pipe-delimited, and JSON inputs are also parsed
automatically; the column profiler reports the detected delimiter and mapped
fields live before you analyze.
