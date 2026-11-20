/**
 * `pnpm capture` — fetch the club's results index pages and every results
 * page listed in `sources/series.json`.
 *
 *   pnpm capture              # skip files already on disk
 *   pnpm capture --refresh    # re-fetch everything
 *   pnpm capture --linked     # also every results page the indexes link
 *
 * The index pages are fetched first: they are what `pnpm catalog` reads to
 * find results the series list does not carry yet, so a refresh of a season
 * still being sailed starts with them. The pages a skip is recorded against
 * are fetched too, as the evidence for the skip. A Sail100 page marked
 * `races` also has each race's own page fetched, from the link in that
 * race's column heading, and saved beside it. `--linked` fetches every
 * HTML results page an index links, archived or not — what curating a new
 * season starts from.
 *
 * Single-threaded with a delay between requests, never parallelised.
 * Existing files are reused rather than re-fetched: a finished series'
 * results are frozen, so `--refresh` matters only while one is still being
 * sailed. Files are written as received — bytes, not re-encoded.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { decodeCapture } from '../../sailscoring/lib/archive-kit/capture-encoding';
import { parseSail100Html } from '../../sailscoring/lib/archive-kit/sail100-html';

import { INDEX_URLS, allLinks } from './club-index';
import { captureFile, readSeriesFile, type ArchivePage } from './series';

const DELAY_MS = 750;
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (sailscoring rcyc-archive capture)',
  Accept: 'text/html,*/*',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchTo(url: string, path: string): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(url, { headers: HEADERS, redirect: 'follow' });
  } catch (err) {
    console.warn(`  ! ${(err as Error).message} ${url}`);
    return false;
  }
  if (!res.ok) {
    console.warn(`  ! ${res.status} ${url}`);
    return false;
  }
  const body = Buffer.from(await res.arrayBuffer());
  // An error or placeholder page is short; never write one over good data.
  if (body.length < 1024) {
    console.warn(`  ! suspiciously short (${body.length} bytes) ${url}`);
    return false;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return true;
}

/** Fetch `url` unless it is already on disk; true when fetched. */
async function capture(url: string, refresh: boolean): Promise<boolean> {
  const path = captureFile(url);
  if (!refresh && existsSync(path)) return false;
  const ok = await fetchTo(url, path);
  if (ok) console.log(`  + ${path}`);
  await sleep(DELAY_MS);
  return ok;
}

/** The race pages a captured Sail100 standings page links, as URLs. */
function raceUrls(page: ArchivePage): string[] {
  const { text } = decodeCapture(readFileSync(captureFile(page.url)), { encoding: page.encoding });
  const { raceLinks } = parseSail100Html(text);
  if (raceLinks.length === 0) throw new Error(`${page.url}: no Sail100 standings to follow`);
  return raceLinks[0].flatMap((link) => (link ? [new URL(link, page.url).href] : []));
}

/** A results link worth fetching: a web page, not a PDF or an image. */
const isPage = (url: string) => /\.html?$/i.test(new URL(url).pathname) || /halsail/i.test(url);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh');
  const { series, skipped } = readSeriesFile();

  let fetched = 0;
  for (const url of INDEX_URLS) if (await capture(url, refresh)) fetched++;

  const pages = new Set([...series.flatMap((s) => s.pages.map((p) => p.url)), ...skipped.map((s) => s.url)]);
  if (args.includes('--linked')) {
    for (const { url } of allLinks()) if (isPage(url) && !/app\.sailscoring\.ie/.test(url)) pages.add(url);
  }
  console.log(`${INDEX_URLS.length} index pages, ${pages.size} results pages`);
  for (const url of pages) {
    if (!isPage(url)) continue;
    if (await capture(url, refresh)) fetched++;
  }
  const withRaces = series.flatMap((s) => s.pages).filter((p) => p.races && existsSync(captureFile(p.url)));
  const raceList = [...new Set(withRaces.flatMap(raceUrls))];
  console.log(`${withRaces.length} pages marked races, ${raceList.length} race pages`);
  for (const url of raceList) if (await capture(url, refresh)) fetched++;
  console.log(`${fetched} fetched\n\nNext: pnpm catalog, then pnpm emit-as-published`);
}

void main();
