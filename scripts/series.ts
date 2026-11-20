/**
 * `sources/series.json` — the curated series list, and the only hand-written
 * input this repo has.
 *
 * Royal Cork Yacht Club publishes its results as Sailwave pages, linked from
 * a keelboat and a dinghy results page per season on `royalcork.com`; Cork
 * Week's are linked from `corkweek.ie`. Up to 2017 an event's classes are
 * usually separate pages, one standings section each; from 2018 an event is
 * usually one page carrying every class, often each class's IRC and ECHO
 * standings side by side. This file groups those pages into as-published
 * series — one series per event, a page per class — and pins what the pages
 * cannot state for themselves: the season, the slug, the display names, the
 * sponsors. Everything else (the standings, the races, the dates) is read off
 * the captures.
 */

import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export const SERIES_FILE = 'sources/series.json';

/** One race table of a race-only page, published as a member of that page. */
export interface RaceSection {
  /** The race table's heading, exactly as captured. */
  raceTitle: string;
  /** The member fleet's name; the heading carries the race's date and time,
   *  so it is always given. Never changed once ingested. */
  name: string;
}

export interface ArchivePage {
  /** The page's display name — the fleet's name in Sail Scoring, or, for a
   *  page published as several `sections`, the page's. Never changed once
   *  ingested: fleet ids are derived from it. */
  name: string;
  /** The page's sub-path segment within its event. Public URL; never
   *  changed. Omitted when the event has a single page. */
  slug?: string;
  /** The page's URL, as the club's index links it (normalised to https). */
  url: string;
  /** The page's Sailwave heading as captured, checked on every emit so a
   *  re-capture that moves under us is noticed rather than absorbed. */
  title: string;
  /** Which of the file's standings sections this page publishes, by
   *  heading. Required when the file has more than one — usually a class's
   *  IRC and ECHO standings, published together as one page. */
  sections?: string[];
  /** A race-only file whose race tables are several fleets (IRC and ECHO)
   *  of one race: each becomes a member of one page. */
  raceSections?: RaceSection[];
  /** A second presentation of racing another page of the series already
   *  accounts for: shown, but its rows earn no place of their own. */
  displayOnly?: true;
  /** Read the capture as windows-1252, overriding what the page declares —
   *  only where that declaration is known to be wrong. */
  encoding?: 'windows-1252';
  /** A note rendered on this page alone: what its figures cannot say for
   *  themselves. */
  note?: string;
  /** A Sail100 standings page whose race columns link each race's own page:
   *  those pages are captured beside it, and their results published below
   *  the standings, one table per race. */
  races?: true;
  /** Why a Sail100 standings page that links its races' pages does not
   *  publish them — say, a race page no longer on the server. */
  noRaces?: string;
}

export interface Sponsor {
  name: string;
  /** `donor` for a trophy's donor, shown as "Trophy presented by". */
  kind?: 'sponsor' | 'donor';
}

/** An event open to visiting boats, or the club's own racing. */
export const CATEGORIES = ['Open Events', 'Club Racing'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ArchiveSeries {
  /** Stable per-series key. The series id is UUIDv5 over it, so it is
   *  permanent: renaming one re-mints the id and orphans the ingested
   *  series. */
  key: string;
  /** The published slug's season folder (app ADR-011): "2026". */
  season: string;
  /** The event's slug within its season. Public URL; never changed. */
  slug: string;
  /** Display name for the series. */
  name: string;
  /** The workspace category the series is filed under — the same two the
   *  club's own Sail Scoring series use (CLARIFICATIONS §13). Re-filed on
   *  every ingest. */
  category: Category;
  /** The event's own website and logo, where it has one apart from the
   *  club's — Cork Week. */
  eventUrl?: string;
  eventLogoUrl?: string;
  /** A one-off race rather than a series: publish the race results alone. */
  detail?: 'races';
  /** The sponsors the club's index names for the event, in the order it
   *  names them. */
  sponsors?: Sponsor[];
  /** Pinned dates, where neither the races nor the club's index state them
   *  correctly; `datesFrom` says what they were read from. */
  startDate?: string;
  endDate?: string;
  datesFrom?: string;
  /** A note rendered on every page of the publication: what the figures
   *  cannot say for themselves. Only a series that needs one has one. */
  seriesNote?: string;
  pages: ArchivePage[];
}

/** A page the club links that this archive deliberately does not carry. */
export interface SkippedPage {
  url: string;
  reason: string;
}

interface SeriesFile {
  series: ArchiveSeries[];
  skipped: SkippedPage[];
}

export function readSeriesFile(): SeriesFile {
  return JSON.parse(readFileSync(SERIES_FILE, 'utf8')) as SeriesFile;
}

export function readSeries(): ArchiveSeries[] {
  return readSeriesFile().series;
}

/** Where a URL is captured: `sources/<host>/<path>`, mirroring the URL, with
 *  `index.html` added to a path that ends in a slash. The scheme is dropped:
 *  the club's links mix http and https for the same host. */
export function captureFile(url: string): string {
  const { host, pathname } = new URL(url);
  const path = decodeURIComponent(pathname);
  return join('sources', host, path.endsWith('/') || !extname(path) ? join(path, 'index.html') : path);
}
