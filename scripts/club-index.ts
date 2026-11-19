/**
 * The club's results index pages — the source of the event names, the
 * sponsors, and every results link.
 *
 * `royalcork.com` has a keelboat and a dinghy results page per season. Each
 * is a WordPress post written by hand: an event's name as a heading (a bold
 * paragraph, an `<h2>`, or a link to its sponsor's website), then its
 * results links, one per line. Cork Week's results are listed by edition on
 * `corkweek.ie`, in the same way. The reader walks a page's content line by
 * line and attaches each results link to the heading above it; nothing else
 * about the sites is read.
 */

import { readFileSync } from 'node:fs';

import { JSDOM } from 'jsdom';

import { captureFile } from './series';

export type IndexKind = 'keelboat' | 'dinghy' | 'cork-week';

export interface IndexPage {
  kind: IndexKind;
  season: string;
  url: string;
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

/** The dinghy pages whose address breaks the pattern. */
const DINGHY_URLS: Record<string, string> = {
  '2016': 'https://www.royalcork.com/dinghy-results-2017/dinghy-results-2016/',
  '2020': 'https://www.royalcork.com/dinghy-results-2020-2/',
};

/** Cork Week's edition pages on corkweek.ie. 2012's is linked from nowhere
 *  on the site any more; the others are linked from the previous-editions
 *  page. 2022 and 2024 are linked straight to their results, and 2026 from
 *  the site's home page. */
const CORK_WEEK_PAGES: Record<string, string> = {
  '2004': 'https://www.corkweek.ie/results-2004/',
  '2006': 'https://www.corkweek.ie/results-2006/',
  '2008': 'https://www.corkweek.ie/results-2008/',
  '2010': 'https://www.corkweek.ie/results-2010/',
  '2012': 'https://www.corkweek.ie/results-2012/',
  '2014': 'https://www.corkweek.ie/results-2014/',
  '2016': 'https://www.corkweek.ie/results-2016/',
  '2018': 'https://www.corkweek.ie/2018-results/',
};
export const CORK_WEEK_EDITIONS_PAGE = 'https://www.corkweek.ie/results-previous-cork-week-editions/';

/** Results Cork Week links directly, with no page of its own between. */
export const CORK_WEEK_DIRECT: Record<string, string> = {
  '2022': 'https://www.royalcork.com/Results/VolvoCorkWeek2022.htm',
  '2024': 'https://www.royalcork.com/Results/VolvoCorkWeek2024.htm',
  '2026': 'https://www.royalcork.com/Results/CorkWeek2026.htm',
};

export const INDEX_PAGES: IndexPage[] = [
  ...range(2012, 2026).map((season) => ({
    kind: 'keelboat' as const,
    season,
    url: `https://www.royalcork.com/keelboat-results-${season}/`,
  })),
  ...range(2011, 2026).map((season) => ({
    kind: 'dinghy' as const,
    season,
    url: DINGHY_URLS[season] ?? `https://www.royalcork.com/dinghy-results-${season}/`,
  })),
  ...Object.entries(CORK_WEEK_PAGES).map(([season, url]) => ({ kind: 'cork-week' as const, season, url })),
];

/** Every index page `pnpm capture` fetches, the editions list included. */
export const INDEX_URLS = [...INDEX_PAGES.map((p) => p.url), CORK_WEEK_EDITIONS_PAGE];

export interface IndexLink {
  index: IndexPage;
  /** The heading the link sits under, as published. */
  heading: string;
  /** The link's own text. */
  label: string;
  /** The rest of the link's line, where it says more than the link. */
  line: string;
  url: string;
}

/** Hosts whose links on an index page are results; any other link is a
 *  sponsor's or the club's own navigation. */
const RESULTS = [
  /^https:\/\/www\.royalcork\.com\/(Results|wp-content\/uploads)\//i,
  /^https:\/\/www\.corkweek\.ie\/(results|wp-content\/uploads)\//i,
  /^https:\/\/www\.sailwave\.com\/results\//i,
  /^https:\/\/(www\.)?cruiserracing\.ie\//i,
  /^https:\/\/(www\.)?iodai\.com\//i,
  /halsail/i,
  /^https:\/\/app\.sailscoring\.ie\//i,
];

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

/** One results URL as captured: https, `www.` on the club's hosts, and no
 *  fragment. The indexes link the same host with and without either. */
export function normaliseUrl(href: string, base: string): string | null {
  let url: URL;
  try {
    url = new URL(href.trim(), base);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  url.protocol = 'https:';
  if (url.host === 'royalcork.com' || url.host === 'corkweek.ie' || url.host === 'sailwave.com') {
    url.host = `www.${url.host}`;
  }
  url.hash = '';
  return url.href;
}

export const isResultsUrl = (url: string) => RESULTS.some((re) => re.test(url));

const BLOCK = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'UL', 'OL', 'TR', 'TD', 'TABLE', 'BR']);

interface Line {
  text: string;
  links: Array<{ url: string; label: string }>;
  /** The line is a list item: an entry, never a heading. */
  item: boolean;
  /** Marks where a list item heading a nested list opens and closes: the
   *  heading it sets lasts only as long as its list. */
  scope?: 'open' | 'close';
}

/** The page's content as lines: text and links, broken at every block
 *  element and `<br>`. */
function lines(root: Element, base: string): Line[] {
  const out: Line[] = [];
  let line: Line = { text: '', links: [], item: false };
  const flush = () => {
    line.text = clean(line.text);
    if (line.text || line.links.length) out.push(line);
    line = { text: '', links: [], item: false };
  };
  const walk = (node: Node, item: boolean) => {
    if (node.nodeType === 3) {
      line.text += node.textContent ?? '';
      if (item && clean(node.textContent ?? '')) line.item = true;
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    const block = BLOCK.has(el.tagName);
    if (block) flush();
    if (el.tagName === 'A' && el.getAttribute('href')) {
      const url = normaliseUrl(el.getAttribute('href')!, base);
      const label = clean(el.textContent ?? '');
      line.text += el.textContent ?? '';
      if (url) line.links.push({ url, label });
      return;
    }
    // A list item heading a nested list ("Union Chandlery July League",
    // then its Thursday and Friday results) names an event, like a heading.
    const entry = el.tagName === 'LI' && !el.querySelector('ul, ol');
    const scoped = el.tagName === 'LI' && !entry;
    if (scoped) out.push({ text: '', links: [], item: false, scope: 'open' });
    for (const child of el.childNodes) walk(child, item || entry);
    if (block) flush();
    if (scoped) out.push({ text: '', links: [], item: false, scope: 'close' });
  };
  walk(root, false);
  flush();
  return out;
}

export function readIndex(index: IndexPage): IndexLink[] {
  const html = readFileSync(captureFile(index.url), 'utf8');
  const doc = new JSDOM(html).window.document;
  const content = doc.querySelector('.post-content');
  if (!content) throw new Error(`${index.url}: no post content`);
  const out: IndexLink[] = [];
  let heading = '';
  const outer: string[] = [];
  for (const { text, links, item, scope } of lines(content, index.url)) {
    if (scope === 'open') outer.push(heading);
    if (scope === 'close') heading = outer.pop() ?? '';
    if (scope) continue;
    // A results link with no text of its own is a stray beside a heading —
    // the same page is linked again, by name, in the list below it.
    const results = links.filter((l) => isResultsUrl(l.url) && l.label);
    if (results.length === 0) {
      // A bold line, a heading, or a sponsor's link: the event's name. A
      // list item with no link is a result the club named but never linked,
      // not a heading — unless it heads a list of its own. The "Older Results" list of season pages ends the
      // content that matters.
      if (text && !item && !/^older results$/i.test(text)) heading = text;
      continue;
    }
    for (const link of results) {
      const rest = clean(results.reduce((t, l) => t.replace(l.label, ''), text));
      out.push({ index, heading, label: link.label, line: rest, url: link.url });
    }
  }
  return out;
}

/** Every results link the club publishes, with the index line that lists
 *  it, Cork Week's direct links included. */
export function allLinks(): IndexLink[] {
  const out = INDEX_PAGES.flatMap(readIndex);
  for (const [season, url] of Object.entries(CORK_WEEK_DIRECT)) {
    out.push({ index: { kind: 'cork-week', season, url: CORK_WEEK_EDITIONS_PAGE }, heading: 'Cork Week', label: season, line: '', url });
  }
  return out;
}
