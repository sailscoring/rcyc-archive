/**
 * `pnpm catalog` — every results link on the club's captured index pages,
 * marked archived (a page of a series in `sources/series.json`), skipped
 * (with its reason), or new.
 *
 *   pnpm catalog            # list every link
 *   pnpm catalog --new      # only the links the series list doesn't carry
 *
 * Run it after `pnpm capture --refresh` of a season still being sailed: a
 * new link is a result the club has published since the last capture, and
 * goes into `series.json` (or its `skipped` list) before the next emit.
 */

import { allLinks } from './club-index';
import { readSeriesFile } from './series';

function main(): void {
  const onlyNew = process.argv.slice(2).includes('--new');
  const { series, skipped } = readSeriesFile();
  const archived = new Map<string, string>();
  for (const s of series) for (const p of s.pages) archived.set(p.url, `${s.key}${p.slug ? ` / ${p.slug}` : ''}`);
  const skips = new Map(skipped.map((s) => [s.url, s.reason]));

  const seen = new Set<string>();
  let fresh = 0;
  let index = '';
  for (const { url, index: page, heading, label } of allLinks()) {
    if (seen.has(url)) continue;
    seen.add(url);
    const status = archived.has(url) ? `✓ ${archived.get(url)}` : skips.has(url) ? '– skipped' : '+ NEW';
    if (!archived.has(url) && !skips.has(url)) fresh++;
    if (onlyNew && status !== '+ NEW') continue;
    const where = `${page.season} ${page.kind}`;
    if (where !== index) {
      index = where;
      console.log(`\n${where}`);
    }
    console.log(`  ${status.padEnd(58)} ${[heading, label].filter(Boolean).join(' — ')}  ${url}`);
  }
  const done = [...seen].filter((u) => archived.has(u)).length;
  console.log(`\n${seen.size} links: ${done} archived, ${seen.size - done - fresh} skipped, ${fresh} new`);
}

main();
