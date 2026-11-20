# rcyc-archive

Royal Cork Yacht Club's published results, 2011–2026, and Cork Week's,
2004–2026, ingested **as published** into the `rcyc` workspace of
[Sail Scoring](https://app.sailscoring.ie) (app ADR-010): shown exactly as
the club published them and never re-scored.

The club scored in Sail100 until 2018 and in Sailwave since, and lists every
result by hand on a keelboat and a dinghy results page per season, often
naming the event's sponsor. Cork Week, its biennial regatta, lists its
results by edition on `corkweek.ie`. Those pages are captured verbatim here,
grouped into one series per event, and emitted as the ingest config.

## What's here

| Path | What it is |
|------|------------|
| `sources/series.json` | The curated series list, and the pages the archive skips — the only hand-written input. |
| `sources/www.royalcork.com/` | The club's results index for each season, and every results page they link, verbatim. |
| `sources/www.corkweek.ie/` | Cork Week's edition pages and their results pages, verbatim. |
| `sources/www.sailwave.com/` | Results the club published on Sailwave's site, verbatim. |
| `as-published.config.json` | Emitted from the above; the input to the app's `archive-generate`. Committed, and CI checks it is current. |
| `scripts/` | Capture, catalog and config emission. |
| `CLARIFICATIONS.md` | Every judgement call made about the published data, and the questions for the club. |
| `SOURCES.md` | Where the club publishes, and how the pages are laid out. |

## Commands

```
pnpm install
pnpm capture              # fetch the index pages and every page in sources/series.json
pnpm capture --refresh    # re-fetch everything
pnpm capture --linked     # also every results page the indexes link, archived or not
pnpm catalog              # every results link the club publishes, archived ones marked
pnpm catalog --new        # only the links the series list doesn't carry yet
pnpm emit-as-published    # series list + captures → as-published.config.json
pnpm typecheck
```

## The pipeline

1. `sources/series.json` lists each as-published series and the pages it is
   made of, by the URL the club's index links, with the event's sponsors as
   the index names them.
2. `pnpm capture` fetches the index pages, then each results page, then
   the race pages each Sail100 page marked `races` links.
3. `pnpm emit-as-published` reads every capture through the app's decoder and
   its Sailwave and Sail100 parsers. It checks each page still carries the
   heading recorded for it, that every standings section and race table of
   every file lands on some page, and dates each series (CLARIFICATIONS §4).
   It reports every problem it finds, then writes
   `as-published.config.json` only if there were none.
4. In the app checkout, `pnpm archive-generate ../rcyc-archive/as-published.config.json`
   builds one ingest document per series into `as-published/` (not
   committed).
5. CI pushes those documents to the `rcyc` workspace with
   `pnpm cli as-published push` on every push to `main` — see
   `.github/workflows/as-published.yml`.

The published pages land at `/p/rcyc/<season>/<event>[/<page>]`, e.g.
`/p/rcyc/2014/may-league/irc-1`, `/p/rcyc/2024/cork-week/class-1` or
`/p/rcyc/2022/optimist-june-saturday/main-fleet`.

## Adding a result

1. `pnpm capture --refresh` re-fetches the index pages; `pnpm catalog --new`
   lists any link the series list doesn't carry.
2. Add the page to its series in `sources/series.json` — or a new series: a
   permanent `key`, the `season` and `slug` its URL is built from (a
   recurring event keeps the slug it has in other years, CLARIFICATIONS §2),
   a display `name`, the `sponsors` from the index heading, and its pages. A
   page's `title` is its heading (Sailwave's `<h1>`, or Sail100's first);
   run `pnpm emit-as-published` with a guess and it will tell you the real
   one. A page drawn from a file with several standings sections lists them
   as `sections`; a race-only file with several race tables lists them as
   `raceSections`.
3. `pnpm capture`, then `pnpm emit-as-published`, and commit the series list,
   the captures and the config together.

A series still being sailed changes under its capture: re-run
`pnpm capture --refresh` and review the diff before committing it. Results
the club now publishes in Sail Scoring itself — the 2026 Winter League, the
Dinghy Frostbites, the Autumn League — are not archived here.

## Status

Every result the club's index pages link, 2011–2026, and Cork Week 2004–2026:
**540 series, 1,677 pages**, about 25,000 competitor rows. 202 linked pages
are not carried, each for a stated reason (CLARIFICATIONS §5). 777 Sail100
class pages publish their races below the standings, 5,589 race tables, from
the race pages the club linked (§8); 280 series are dated by their races.

| Season | Series | Pages |
|--------|-------:|------:|
| 2004 | 1 | 26 |
| 2006 | 1 | 21 |
| 2008 | 1 | 26 |
| 2010 | 1 | 13 |
| 2011 | 26 | 33 |
| 2012 | 22 | 124 |
| 2013 | 29 | 105 |
| 2014 | 31 | 163 |
| 2015 | 39 | 152 |
| 2016 | 44 | 182 |
| 2017 | 38 | 142 |
| 2018 | 46 | 130 |
| 2019 | 35 | 76 |
| 2020 | 35 | 59 |
| 2021 | 30 | 61 |
| 2022 | 34 | 81 |
| 2023 | 38 | 83 |
| 2024 | 33 | 63 |
| 2025 | 31 | 75 |
| 2026 | 25 | 62 |

The 2004–2010 seasons are Cork Week alone; the club's own pages start in
2011 (dinghies) and 2012 (keelboats).

- ⬜ **Set the repo's CI secrets** (`APP_REPO_TOKEN`,
  `SAILSCORING_ARCHIVIST_TOKEN` for the `rcyc` workspace). Until then the
  workflow succeeds having done nothing.
- ⬜ **The competitor-identity manifest** — not started.
- ⬜ **The questions for the club** in CLARIFICATIONS §12.

## Relationship to the app repo

This repo assumes the sibling app checkout exists at `../sailscoring`. It
reuses the app's Sailwave and Sail100 parsers, capture decoder and id
derivation by relative import (`../sailscoring/lib/archive-kit/…`) rather
than forking them. The as-published toolkit (parsers, generator, ingest
client) stays in the app; this repo contributes config and captures, not
code, to the ingest.

## Licensing

- **Code** — `scripts/`: [MIT](LICENSE).
- **Normalised data & docs** — `sources/series.json`,
  `as-published.config.json`, `README.md`, `SOURCES.md`,
  `CLARIFICATIONS.md`: [CC0 1.0](LICENSE-DATA). These are extractions of
  published facts (series names, dates, sponsors, structure), and facts are
  not copyrightable.
- **Source pages** — the verbatim captures under `sources/` other than
  `series.json`: **not covered by either license.** These are results and
  pages published by Royal Cork Yacht Club, Cork Week and others, included
  only for reproducibility. All rights remain with their owners.
