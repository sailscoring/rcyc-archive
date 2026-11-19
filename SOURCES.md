# Sources

Everything under `sources/` except `series.json` is captured by
`pnpm capture` and written as received — verbatim, third-party, never edited
by hand.

## Where Royal Cork Yacht Club publishes

The club's website lists its results on two pages per season, one for
keelboats and one for dinghies:

| URL | Seasons |
|-----|---------|
| `https://www.royalcork.com/keelboat-results-{year}/` | 2012–2026 |
| `https://www.royalcork.com/dinghy-results-{year}/` | 2011–2026 (2016 is at `/dinghy-results-2017/dinghy-results-2016/`, 2020 at `/dinghy-results-2020-2/`) |

Each is a WordPress page written by hand, newest event first in most years:
an event's name as a heading — a bold paragraph, an `<h2>` or `<h3>`, often
with the sponsor's name linked to its website — then its results links, one
per line or list item. From 2021 some keelboat pages head their events by
month instead ("July", "August / September") and name each event in its link.
Some list items name a class with no link to its results; those results were
never published. The pages carry no dates. `scripts/club-index.ts` reads
them line by line and attaches each results link to the heading above it.

Cork Week, the club's biennial regatta, has a site of its own:

| URL | What it is |
|-----|------------|
| `https://www.corkweek.ie/results-previous-cork-week-editions/` | Links each edition's results: 2004–2018 by a page per edition, 2022 and 2024 straight to their results. |
| `https://www.corkweek.ie/results-{year}/` | 2004, 2006, 2008, 2010, 2012, 2014, 2016 — a page per edition, laid out like the club's. 2012's is no longer linked from the editions page. |
| `https://www.corkweek.ie/2018-results/` | 2018. |
| `https://www.royalcork.com/Results/CorkWeek2026.htm` | 2026, linked from the home page of `corkweek.ie`. |

There was no Cork Week in 2020. Every page above is captured to
`sources/<host>/<path>/index.html`.

## The results pages

| URL | Captured as |
|-----|-------------|
| `https://www.royalcork.com/Results/…`, `https://www.royalcork.com/wp-content/uploads/…` | `sources/www.royalcork.com/…` |
| `https://www.corkweek.ie/results/…` | `sources/www.corkweek.ie/…` |
| `https://www.sailwave.com/results/…` | `sources/www.sailwave.com/…` |
| `https://halsail-1e484.kxcdn.com/Result/Public/…` | `sources/halsail-1e484.kxcdn.com/…` — Cove Sailing Club's, kept as the evidence for skipping them |
| `https://iodai.com/…` | `sources/iodai.com/…` — likewise |

The indexes link the club's site with and without `www.`, and by `http` in
some years and `https` in others; the capture path drops the scheme, and
`series.json` holds the `https://www.` form. File names follow no scheme
from year to year, so nothing is inferred from them.

Two programs made the pages:

- **Sail100**, for the keelboats to the September 2018 leagues, for most
  dinghy classes to 2018 (the National 18s to 2021), and for Cork Week to
  2016: one page per class, a
  standings table under two `<h1>`s — the sponsor or club, then the event and
  class ("UK Halsey Sailmakers" / "May League IRC 1") — with a column per
  race linking that race's own page. The race pages are not captured. A
  one-off race is sometimes published as a race page alone, and a class set
  up but never sailed as an entry list ("Entries: 6", no places). Cork Week
  2004 and 2006 are an older Sail100: no `<h1>` — the class is a bold line
  above the table ("Cork Week IRC1") — and a discarded race shaded grey
  rather than given a class. 2004's pages never name the program.
- **Sailwave**, for the keelboats from 2018, for some dinghy events from
  2012 and most from 2019, and for Cork Week from 2018: usually one page
  per event, carrying every class's standings (`summarytitle`), often a
  class's IRC and ECHO standings side by side, and the race tables
  (`racetitle`).

Each Sail100 page ends with the time it was generated ("Thu 31 May 12
21:29"), and each Sailwave page says "Results are provisional as of 20:33 on
August 19, 2022" — when it was last generated, which is how the pages
written over with a later season's results were found (CLARIFICATIONS §6).

98 pages are windows-1252 and the rest UTF-8, each read by what it declares.
