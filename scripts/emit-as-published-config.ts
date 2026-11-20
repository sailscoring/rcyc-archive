/**
 * `pnpm emit-as-published` — emit `as-published.config.json` from the curated
 * series list and the captures (app ADR-010). It is the input to the app
 * repo's `pnpm archive-generate`.
 *
 * One as-published series per entry in `sources/series.json`, one fleet per
 * page — or, for a page published as several `sections` or `raceSections`,
 * one combined page with a member fleet per section. The captures are read
 * through the app's own decoder and its Sailwave and Sail100 parsers — the
 * same ones `archive-generate` uses — to check that each page still carries
 * the title
 * recorded for it, that every standings section and race table a file
 * publishes lands on some page, and to date each series.
 *
 * URLs: the season is the published slug and the event sits under it —
 * `/p/rcyc/2019/july-league-thursday/class-1`, `/p/rcyc/2024/cork-week/class-0`.
 * Slugs are data, minted once in `series.json` and never derived at ingest;
 * series ids are UUIDv5 over `rcyc-archive/series/<key>`, so regeneration
 * updates rows in place and can never mint duplicates. **Never change an
 * emitted key or slug** — one re-mints the series id, the other orphans a
 * public URL.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { decodeCapture } from '../../sailscoring/lib/archive-kit/capture-encoding';
import { seriesIdForKey } from '../../sailscoring/lib/archive-kit/ids';
import { parseSail100Html, parseSail100RaceHtml } from '../../sailscoring/lib/archive-kit/sail100-html';
import { parseSailwaveHtml, type SailwavePage } from '../../sailscoring/lib/archive-kit/sailwave-html';

import { CATEGORIES, captureFile, readSeriesFile, type ArchivePage, type ArchiveSeries } from './series';

const OUT = 'as-published.config.json';
const REPO_KEY = 'rcyc-archive';

const VENUE = {
  venue: 'Crosshaven',
  venueUrl: 'https://www.royalcork.com',
  venueLogoUrl: 'https://logos.sailscoring.ie/royal-cork-yc.svg',
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** The app's derived folder label (humanizeSlug): title-cased words. */
function humanizeSegment(segment: string): string {
  return segment
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isoDate(year: number, month: number, day: number): string | null {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * A race's date, read from the label the club typed for it — only where the
 * label states a day, a month and a year: "07/04/2019", "2/5/2024",
 * "25th May 2019", "26th Aug 2026" — or a Sail100 race page's start line,
 * "Start: Fri 2 May 14 19:05:00", whose year is two digits. A label with no
 * year ("R1") dates nothing, and neither does a mistyped one ("06/0625").
 */
function dateIn(label: string): string | null {
  let m = /^Start:\s+[a-z]{3}\s+(\d{1,2})\s+([a-z]{3})\s+(\d{2})\s+\d{2}:\d{2}/i.exec(label);
  if (m && MONTHS.includes(m[2].toLowerCase())) {
    return isoDate(Number(m[3]), MONTHS.indexOf(m[2].toLowerCase()) + 1, Number(m[1]));
  }
  m = /\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*\.?\s+(\d{4})\b/i.exec(label);
  if (m && MONTHS.includes(m[2].toLowerCase())) {
    return isoDate(Number(m[3]), MONTHS.indexOf(m[2].toLowerCase()) + 1, Number(m[1]));
  }
  m = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(label);
  if (m) return isoDate(Number(m[3]), Number(m[2]), Number(m[1]));
  return null;
}

const MONTH_WORD = new RegExp(
  '^(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sept?(ember)?|oct(ober)?|nov(ember)?|dec(ember)?)\\.?$',
  'i',
);

/**
 * A race's day and month, where its label states them by name but gives no
 * year: "30th Sep R1", "Sun 3rd Nov", "13th June", "Aug 13th", "10th Of
 * November". The year is the season's — see `datesFor`. Numeric forms
 * ("R1 04/08") are not read: "1/2" is as often a class as a date.
 */
function dayMonthIn(label: string, year: string): string | null {
  const words = label.replace(/[,@-]/g, ' ').split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const day = /^(\d{1,2})(st|nd|rd|th)?$/i.exec(words[i]);
    if (day) {
      const next = words[i + 1]?.toLowerCase() === 'of' ? words[i + 2] : words[i + 1];
      if (next && MONTH_WORD.test(next)) return isoDate(Number(year), MONTHS.indexOf(next.slice(0, 3).toLowerCase()) + 1, Number(day[1]));
    }
    if (MONTH_WORD.test(words[i])) {
      const after = /^(\d{1,2})(st|nd|rd|th)?$/i.exec(words[i + 1] ?? '');
      if (after && !/^\d{2}:/.test(words[i + 2] ?? '')) {
        return isoDate(Number(year), MONTHS.indexOf(words[i].slice(0, 3).toLowerCase()) + 1, Number(after[1]));
      }
    }
  }
  return null;
}

function checkTitle(file: string, captured: string | null, page: ArchivePage): void {
  // The curated name is a display decision; the title is the evidence it was
  // made from. A re-capture that moves it means the club re-published
  // something different, and that is a review, not a silent re-emit.
  if ((captured ?? '') !== page.title) {
    throw new Error(
      `${file}: the page's title is now "${captured ?? ''}", but series.json ` +
        `records "${page.title}". Check what changed, then update series.json.`,
    );
  }
}

const parsed = new Map<string, SailwavePage>();
const texts = new Map<string, string>();
function parse(page: ArchivePage): { file: string; page: SailwavePage; text: string } {
  const file = captureFile(page.url);
  if (!parsed.has(file)) {
    const { text } = decodeCapture(readFileSync(file), { encoding: page.encoding });
    texts.set(file, text);
    parsed.set(file, parseSailwaveHtml(text));
  }
  return { file, page: parsed.get(file)!, text: texts.get(file)! };
}

/** The race pages a Sail100 standings page links, read as the app's
 *  generator reads them — by the link, beside the standings' capture — and
 *  checked to be the captures `pnpm capture` wrote. Returns their start
 *  lines, which date the series. */
function linkedRaceCaptions(page: ArchivePage, file: string, links: Array<string | null>): string[] {
  return links.map((link, i) => {
    if (!link) throw new Error(`${file}: race column ${i + 1} links no page — it cannot be marked "races"`);
    const raceFile = captureFile(new URL(link, page.url).href);
    if (raceFile !== join(dirname(file), link)) {
      throw new Error(`${file}: the generator would read race link "${link}" from ${join(dirname(file), link)}, not ${raceFile}`);
    }
    if (!existsSync(raceFile)) throw new Error(`${raceFile}: not captured — run pnpm capture`);
    const race = parseSail100RaceHtml(decodeCapture(readFileSync(raceFile), { encoding: page.encoding }).text);
    if (!race) throw new Error(`${raceFile}: no race table`);
    return race.caption ?? '';
  });
}

/** A Sail100 page — up to 2018, the club's format: one standings table, or
 *  one race published on its own. A standings page carries no race dates;
 *  the race pages its columns link do, and a page marked `races` publishes
 *  them below its standings. */
function sail100Fleet(page: ArchivePage, subPath: string, file: string, text: string) {
  if (page.sections || page.raceSections) throw new Error(`${file}: sections are for Sailwave pages`);
  const encoding = page.encoding ? { encoding: page.encoding } : {};
  const displayOnly = page.displayOnly ? { displayOnly: true as const } : {};
  claim(file, ['(the Sail100 page)']);
  const standings = parseSail100Html(text);
  if (standings.summaries.length > 1) throw new Error(`${file}: ${standings.summaries.length} Sail100 standings tables`);
  if (standings.summaries.length === 1) {
    checkTitle(file, standings.title, page);
    const links = standings.raceLinks[0];
    if (page.races && page.noRaces) throw new Error(`${file}: marked both "races" and "noRaces"`);
    if (page.races) {
      return {
        fleet: { name: page.name, subPath, file, ...encoding, linkedRaces: true as const, ...displayOnly },
        labels: linkedRaceCaptions(page, file, links).filter(Boolean),
      };
    }
    if (links.some(Boolean) && !page.noRaces) {
      throw new Error(`${file}: links its races' pages — mark the page "races", or say in "noRaces" why not`);
    }
    return { fleet: { name: page.name, subPath, file, ...encoding, ...displayOnly }, labels: [] };
  }
  if (page.races || page.noRaces) throw new Error(`${file}: "races" and "noRaces" are for standings pages`);
  const race = parseSail100RaceHtml(text);
  if (!race || race.rows.length === 0) throw new Error(`${file}: neither Sail100 standings nor a race`);
  checkTitle(file, race.title, page);
  return {
    fleet: { name: page.name, subPath, file, ...encoding, ...displayOnly },
    labels: race.caption ? [race.caption] : [],
  };
}

/** What each file's pages publish, so a section or race table no page
 *  claims is caught rather than dropped. */
const claimed = new Map<string, Set<string>>();
function claim(file: string, titles: string[]): void {
  const set = claimed.get(file) ?? new Set<string>();
  for (const title of titles) {
    if (set.has(title)) throw new Error(`${file}: "${title}" is published by two pages`);
    set.add(title);
  }
  claimed.set(file, set);
}

/** A page: its fleet, and the labels that may date it. */
function buildFleet(page: ArchivePage, subPath: string) {
  const { file, page: sw, text } = parse(page);
  // As the app's generator does: a page Sailwave's reader finds nothing in is
  // read as Sail100 — Cork Week 2004's pages never name the program.
  if (sw.summaries.length === 0 && sw.races.length === 0) {
    return sail100Fleet(page, subPath, file, text);
  }
  checkTitle(file, sw.title, page);
  const encoding = page.encoding ? { encoding: page.encoding } : {};
  const displayOnly = page.displayOnly ? { displayOnly: true as const } : {};
  const labels = [...sw.races.map((r) => r.title), ...sw.summaries.flatMap((s) => s.raceHeaders)];

  if (sw.summaries.length > 0) {
    if (page.raceSections) throw new Error(`${file}: raceSections are for pages with no standings`);
    const empty = sw.summaries.filter((s) => s.rows.length === 0);
    if (empty.length === sw.summaries.length) throw new Error(`${file}: every standings section is empty — skip it`);
    for (const title of page.sections ?? []) {
      if (empty.some((s) => s.title === title)) throw new Error(`${file}: "${title}" has no rows — a placeholder`);
    }
    const includeRaces = sw.races.length > 0 ? { includeRaces: true } : {};
    if (!page.sections) {
      if (sw.summaries.length - empty.length > 1) {
        throw new Error(`${file}: ${sw.summaries.length} standings sections — list the page's sections`);
      }
      const only = sw.summaries.find((s) => s.rows.length > 0)!;
      claim(file, [only.title ?? '']);
      if (sw.summaries.length > 1) {
        // Name the one section with rows, so the empty one is not picked up.
        return {
          fleet: { name: page.name, subPath, file, ...encoding, sections: [{ sectionTitle: only.title ?? '', ...includeRaces }], ...displayOnly },
          labels,
        };
      }
      return { fleet: { name: page.name, subPath, file, ...encoding, ...includeRaces, ...displayOnly }, labels };
    }
    for (const title of page.sections) {
      if (!sw.summaries.some((s) => s.title === title)) {
        throw new Error(`${file}: no standings section headed "${title}"`);
      }
    }
    claim(file, page.sections);
    // Always the sections form, even for one: a fleet given a sectionTitle
    // alone carries every race table in the file, where sections divides
    // them by the section each race names.
    return {
      fleet: {
        name: page.name,
        subPath,
        file,
        ...encoding,
        sections: page.sections.map((sectionTitle) => ({ sectionTitle, ...includeRaces })),
        ...displayOnly,
      },
      labels,
    };
  }

  if (page.sections) throw new Error(`${file}: publishes no standings — use raceSections, not sections`);
  if (sw.races.length === 0) throw new Error(`${file}: neither standings nor a race table`);
  if (!page.raceSections) {
    if (sw.races.length > 1) throw new Error(`${file}: ${sw.races.length} race tables — list the page's raceSections`);
    claim(file, [sw.races[0].title]);
    return { fleet: { name: page.name, subPath, file, ...encoding, ...displayOnly }, labels };
  }
  for (const { raceTitle } of page.raceSections) {
    if (!sw.races.some((r) => r.title === raceTitle)) throw new Error(`${file}: no race table titled "${raceTitle}"`);
  }
  claim(file, page.raceSections.map((r) => r.raceTitle));
  return {
    fleet: { name: page.name, subPath, file, ...encoding, raceSections: page.raceSections, ...displayOnly },
    labels,
  };
}

/**
 * A series' dates. In order of trust: dates pinned in `series.json` (each
 * with the evidence it was read from); the first and last race the pages'
 * labels date, when every dated label falls in the season; the first and
 * last race whose label names a day and a month, in the season's year; the
 * season alone. The club's indexes list no dates.
 *
 * The third is inferred (CLARIFICATIONS §4): the club's labels rarely carry
 * a year, but each season's results are listed on that season's page. It is
 * not used for a series whose races run from one winter into the next —
 * labels in both January–March and October–December.
 *
 * A label outside the season discredits the rest — a page re-used from the
 * previous year keeps that year's dates, and its in-season labels, if any,
 * are the ones that were retyped, so they are not the whole series.
 */
function datesFor(series: ArchiveSeries, labels: string[]): { startDate: string; endDate?: string } {
  if (series.startDate) {
    if (!series.datesFrom) throw new Error(`${series.key}: pinned dates need a datesFrom`);
    return { startDate: series.startDate, ...(series.endDate ? { endDate: series.endDate } : {}) };
  }
  const dated = labels.flatMap((label) => {
    const date = dateIn(label);
    return date ? [{ label, date }] : [];
  });
  const stray = dated.filter(({ date }) => !date.startsWith(series.season));
  if (dated.length > 0 && stray.length === 0) {
    const dates = dated.map((d) => d.date).sort();
    return { startDate: dates[0], ...(dates.at(-1) !== dates[0] ? { endDate: dates.at(-1) } : {}) };
  }
  if (stray.length > 0) {
    console.warn(`  ~ ${series.key}: race label "${stray[0].label}" is outside the season; dated by the season alone`);
    return { startDate: series.season };
  }
  const days = labels.flatMap((label) => {
    const date = dayMonthIn(label, series.season);
    return date ? [date] : [];
  });
  const months = new Set(days.map((d) => Number(d.slice(5, 7))));
  const winter = [1, 2, 3].some((m) => months.has(m)) && [10, 11, 12].some((m) => months.has(m));
  if (days.length > 0 && !winter) {
    days.sort();
    return { startDate: days[0], ...(days.at(-1) !== days[0] ? { endDate: days.at(-1) } : {}) };
  }
  return { startDate: series.season };
}

function buildSeries(series: ArchiveSeries) {
  const multi = series.pages.length > 1;
  const labels: string[] = [];
  const slugs = new Set<string>();
  const pageNotes: Array<{ page: string; text: string }> = [];
  const fleets = series.pages.map((page) => {
    if (multi && !page.slug) throw new Error(`${series.key}: page ${page.url} needs a slug`);
    if (page.slug && slugs.has(page.slug)) throw new Error(`${series.key}: two pages slugged ${page.slug}`);
    if (page.slug) slugs.add(page.slug);
    const subPath = multi ? `${series.slug}/${page.slug}` : series.slug;
    if (page.note) pageNotes.push({ page: subPath, text: page.note });
    const built = buildFleet(page, subPath);
    labels.push(...built.labels);
    return built.fleet;
  });

  return {
    key: series.key,
    id: seriesIdForKey(REPO_KEY, series.key),
    publishedSlug: series.season,
    name: series.name,
    ...VENUE,
    ...(series.eventUrl ? { eventUrl: series.eventUrl } : {}),
    ...(series.eventLogoUrl ? { eventLogoUrl: series.eventLogoUrl } : {}),
    ...datesFor(series, labels),
    ...(series.sponsors?.length ? { sponsors: series.sponsors } : {}),
    ...(series.seriesNote ? { seriesNote: series.seriesNote } : {}),
    ...(pageNotes.length ? { pageNotes } : {}),
    source: 'sailwave' as const,
    // KYC's cruiser standings list boats and owners, never a helm; a row
    // that names a helm keeps it.
    ownerNames: true as const,
    ...(series.detail ? { detail: series.detail } : {}),
    // Filed beside the club's own Sail Scoring series, so a season that holds
    // both lists them under the same headings rather than an Uncategorized
    // bucket.
    category: series.category,
    fleets,
    // A multi-page event's pages sit in an interior folder; pin its display
    // label where title-casing the segment would mangle it.
    ...(multi && humanizeSegment(series.slug) !== series.name
      ? { folders: [{ path: series.slug, label: series.name }] }
      : {}),
  };
}

function main(): void {
  const { series: all, skipped } = readSeriesFile();

  const keys = new Set<string>();
  const paths = new Set<string>();
  const skippedUrls = new Set(skipped.map((s) => s.url));
  for (const series of all) {
    if (keys.has(series.key)) throw new Error(`duplicate series key: ${series.key}`);
    keys.add(series.key);
    if (series.key !== `rcyc-${series.season}-${series.slug}`) {
      // Not a rule the ids need, only a convention that keeps the two from
      // drifting apart unnoticed; a key minted otherwise must stay as it is.
      console.warn(`  ~ ${series.key}: key does not match its season and slug`);
    }
    const path = `${series.season}/${series.slug}`;
    if (paths.has(path)) throw new Error(`duplicate published path: ${path}`);
    if (!CATEGORIES.includes(series.category)) {
      throw new Error(`${series.key}: category must be one of ${CATEGORIES.join(', ')}`);
    }
    paths.add(path);
    // A file split into several class pages is listed once per page, so a
    // URL may repeat; it may not be both published and skipped.
    for (const page of series.pages) {
      if (skippedUrls.has(page.url)) throw new Error(`${page.url} is both listed and skipped`);
    }
  }

  // Every problem is reported, not just the first: a re-capture of a season
  // can move several pages at once, and they are reviewed together.
  const errors: string[] = [];
  const series = all
    .slice()
    .sort((a, b) => a.season.localeCompare(b.season) || a.slug.localeCompare(b.slug))
    .flatMap((s) => {
      try {
        return [buildSeries(s)];
      } catch (err) {
        errors.push(`${s.key}: ${(err as Error).message}`);
        return [];
      }
    });

  // Every section and race table of every file reaches some page.
  for (const [file, titles] of claimed) {
    const sw = parsed.get(file)!;
    // A standings section with no rows is a placeholder the club never
    // filled in (a class that never raced); there is nothing to publish.
    const published =
      sw.summaries.length > 0
        ? sw.summaries.filter((s) => s.rows.length > 0).map((s) => s.title ?? '')
        : sw.races.map((r) => r.title);
    const missing = published.filter((t) => !titles.has(t));
    if (missing.length > 0) errors.push(`${file}: no page publishes ${missing.map((t) => `"${t}"`).join(', ')}`);
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(`  ! ${e}`);
    console.error(`\n${errors.length} problems; nothing written.`);
    process.exit(1);
  }

  writeFileSync(OUT, `${JSON.stringify({ version: 1, out: 'as-published', series }, null, 2)}\n`);
  const pages = series.reduce((n, s) => n + s.fleets.length, 0);
  console.log(`${series.length} series, ${pages} pages → ${OUT}`);
  console.log('\nNext: pnpm --dir ../sailscoring archive-generate ../rcyc-archive/as-published.config.json');
}

main();
