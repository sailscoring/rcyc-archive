# CLAUDE.md

Guidance for Claude Code working in this repo. **Read `README.md` first** —
it has the mission, the sources, the pipeline, and the status. This file
covers the working conventions.

## What this repo is

A data pipeline, not an application. It captures Royal Cork Yacht Club's
published results verbatim — Sail100 pages to 2017, Sailwave pages since —
from 2011 onwards, and Cork Week's from 2004, and emits the
**as-published** ingest config (app ADR-010) that feeds them into Sail
Scoring's `rcyc` workspace — ingested faithfully, never re-scored.

It is a sibling of `kyc-archive`, `bray-archive`, `irish-sailing-archive`,
`ksc-archive`, `hyc-archive`, `dbsc-archive` and `iodai-archive`, and
closest in shape to `kyc-archive`: a hand-curated series list,
as-published from the start, over a club's season-by-season results pages.
Like `bray-archive` it reads Sail100 as well as Sailwave.
Domain background lives in the app repo under `../sailscoring/docs/`.

## Commands

```
pnpm install
pnpm capture              # fetch the index pages and every page in sources/series.json
pnpm capture --refresh    # re-fetch everything
pnpm capture --linked     # also every results page the indexes link
pnpm catalog [--new]      # every results link the club publishes, archived ones marked
pnpm emit-as-published    # series list + captures → as-published.config.json
pnpm typecheck
```

Then, from the app checkout:
`pnpm archive-generate ../rcyc-archive/as-published.config.json`.

## Rules that are easy to get wrong

1. **Be a good citizen to the servers.** Keep the single-threaded 0.75 s
   delay in `scripts/capture.ts`; never parallelise. Files on disk are
   reused, so re-runs are cheap — `--refresh` should be rare.

2. **Source pages are verbatim and third-party.** Everything under
   `sources/` except `series.json` is unmodified published output, kept for
   reproducibility. Do not edit it, do not transcode it, and do not
   relicense it — see README "Licensing". A page whose declared encoding is
   wrong gets an `encoding` override in `series.json`, never a re-encoded
   file.

3. **Never decode a capture by hand.** Use the app's `decodeCapture` and
   its Sailwave and Sail100 parsers — the same readers `archive-generate` uses, so the config
   can never disagree with what gets ingested. A local re-implementation is
   how the two drift apart.

4. **Never change an emitted `key` or `slug`, or a page's `name` or `slug`.**
   Series ids are deterministic UUIDv5 over `rcyc-archive/series/<key>` and
   fleet ids are derived from the page name, so renaming either orphans the
   ingested rows; the slugs are public URLs. Any of these is a migration — a
   managed 301 (app `pnpm redirects`) plus a delete of the orphaned row — not
   a rename. A recurring event keeps the slug it has in other years
   (CLARIFICATIONS §2), whatever the year's name.

5. **The checks in `pnpm emit-as-published` are not noise.** It fails when a
   capture's heading no longer matches the `title` recorded for it, when a
   file's standings section or race table reaches no page, and when a page
   is empty. A club re-publishing a page is a change to review, not one to
   absorb on the way past; an empty or unclaimed section is a decision to
   make in `series.json` (publish it, or skip the page with a reason).

6. **Only real published data.** If something is missing, leave it missing
   — do not fabricate, interpolate, or guess. Dates come from the races a
   page published, else the season (CLARIFICATIONS §4); a date pinned in
   `series.json` carries a `datesFrom` saying what it was read from.
   Sponsors come from the club's index.

7. **Check the generation stamp before trusting a page's year.** Up to
   2016 the club often published a new season's league over the previous
   season's files, and it sometimes builds a page from an earlier year's
   file, so a page's address, heading and race labels can name the wrong
   year (CLARIFICATIONS §6). Sail100's closing timestamp and Sailwave's
   "Results are provisional as of …" say when the page was last generated.

8. **The index pages are hand-written; read them, don't trust a pattern.**
   Headings come as bold lines, `<h2>`s, sponsor links and list items that
   head nested lists; months head events in some years and events head
   classes in others (CLARIFICATIONS §1). `scripts/club-index.ts` attaches
   each link to the heading above it — check what it attached before
   grouping a new season's links into series.

9. **Record every judgement call in [`CLARIFICATIONS.md`](CLARIFICATIONS.md).**
   State what is verified, mark what is inferred, and put the rest to the
   club as a question.

## Relationship to the app repo

This repo assumes the sibling app checkout exists at `../sailscoring`. It
**reuses** the app's Sailwave and Sail100 parsers, capture decoder and id derivation by
relative import (`../sailscoring/lib/archive-kit/…`) rather than forking
them. `jsdom` is a direct dependency here because the parser and the index
reader need it.

The as-published toolkit (parsers, generator, ingest client) stays in the
app; this repo contributes config, not code, to the ingest. Pushing to the
production workspace is CI's job — this repo's job ends at a validated
config.

## Git conventions

- Commit logically (one coherent change per commit). Keep the tree
  consistent.
- Commit as `markbmc@gmail.com`, unsigned (`commit.gpgsign=false`).
- **End every commit message with:**
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- **Do not push unless asked.** Commit locally; let the human review and
  push.
