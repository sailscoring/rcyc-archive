# Clarifications

Every judgement call made about Royal Cork Yacht Club's published results,
what it rests on, and what is still a question for the club.

## 1. How the pages are grouped into series

The club publishes some hundred results pages a season, listed by hand on a
keelboat and a dinghy results page. They are grouped here into **one series
per event**, with a page per class.

- **An event is what the club's index heads as one.** The index names an
  event in a bold line or heading — often with its sponsor's name linked —
  and lists its classes' results below it, one link each. Up to 2017 each
  class is a Sail100 page of its own: the 2014 May League is ten pages, IRC 1
  to ECHO White Sail. Those pages become one series.
- **From 2018 an event is one Sailwave page** carrying every class, and it
  is a series of its own, whatever heading it sits under: "Fitzgerald
  Menswear August/September leagues" heads three files — the Thursday
  league, the combined league and the Friday IHS league — and they are three
  series. Where the index heads its events by month ("July") and names each
  in its link ("Thursday League 2026"), the month is put back into the name:
  "July Thursday League 2026".
- **A class's IRC and ECHO standings share a page** where one Sailwave file
  carries both: "IRC SPIN Division" and "CLUB ECHO SPIN Division" are one
  page, Spinnaker; "Class 1 - IRC Fleet", "Class 1 - Echo Fleet" and "Class
  1 - IRC ICRA Fleet" are one page, Class 1. Where the club published IRC
  and ECHO as separate Sail100 files (2012–2018), they stay separate pages,
  as the club listed them. "SPIN", "NS" and "WS" are written out as
  Spinnaker, Non-Spinnaker and White Sail.
- **Dinghy leagues are a series per league, a page per fleet.** The dinghy
  indexes head their links by class ("Optimist Leagues 2022") and list one
  link per league per fleet; the fleets of one league — Main and Copper,
  Topper 4.2 and 5.3, Laser 4.7, Radial and Standard, the National 18
  Ultimates, Ultras and Handicap — are pages of one series, "Optimist June
  Saturdays 2022". Where a fleet's link is worded differently from its
  sibling's ("May Leaague Copper Fleet", "May Leage Main Fleet"), the two
  were joined by hand. Where a regatta's index lists its dinghy classes
  under one heading ("At Home Regatta 2022"), they are one series.
- **The At Home and the Tricentenary Regatta are two series each**: the
  keelboats' (`/at-home`) and the dinghies' (`/at-home-dinghies`), as the
  club lists them on two pages.
- **The Optimist season rankings** (2011, 2013–2017) are a series each,
  `/optimist-overall-results`: one standings over every Optimist race of the
  year, 68–95 races, the leagues' scores ranked together with about a
  quarter of each sailor's races discarded. The races are the leagues'
  own, archived beside them; the ranking is only here. Each is filed under
  the season its heading names and its index lists it — each was generated
  that October or November, though the upload folders read earlier
  (`2013/02`, `2014/04`). The club heads them variously ("Optimist Overall
  League 2011", "Overall 2014", and in 2017 Sail100's placeholder "Series
  200"); they are all named "Optimist Overall Results {year}". 2011's marks
  a race not sailed with the score alone (69), no code.
- **Files with an empty standings section** — a class set up and never
  sailed — are published without it.

## 2. Names and URLs

- **A series is named as the club names the event**, without its sponsor
  and with its year: "UK HALSEY SAILMAKERS MAY LEAGUE" on the 2012 page is
  "May League 2012", sponsored by UK Halsey Sailmakers. Capitals are
  lowered; the club's typos are corrected in the display name ("Costal",
  "Regetta", "Frostbities", "Champiionships", "Leaague", "Spinaker") and kept in the
  page headings `series.json` records.
- **A recurring event keeps one slug across years**, however the year's
  heading words it: the May League is `may-league` whether headed "May
  League", "May Leagues" or "UK Sailmakers May Leagues"; the Thursday night
  leagues are `{month}-league-thursday` whether headed "May League Thursdays",
  "May Thursday League" or "Thursday night Results"; "Aug/Sept" and "August /
  September" are `august-september`; the Naval Race is `naval-race` in the
  years it was the "Annual Naval Service Race". The National 18 leagues the
  2017 and 2018 indexes list as "Wednesday/Saturday Leagues" are
  `national-18-{month}-league`, as in other years.
- **Season**: the index page a result is listed on, except where the result
  names another year. The 2013 keelboat page lists the 2014 March and April
  leagues, which are filed under 2014; the 2016 page lists the 2016 J24
  Southern Championships under a "2015" heading, filed under 2016.
- **Cork Week** is `/p/rcyc/{year}/cork-week`. 2018 published five files —
  the overall results and the Wrecks Series, Inshore Series, Harbour Race and
  Club Regatta of the week — and they are five series:
  `cork-week`, `cork-week-wrecks-series` and so on.

## 3. Sponsors

Sponsors are taken from the event's heading on the club's index — the name
the club links to a sponsor's website, or puts before the event's own —
and normalised to one spelling each: "Fitzgerald Menswear", "Fitzgeralds
Menwear" and "Firzgerald's Mensware" are all Fitzgerald's Menswear;
"O'Leary Insurance" and "O'Leary Insurances" are O'Leary Insurance Group.
"UK Halsey Sailmakers" (2012–14) and "UK Sailmakers" (2015 on) stay
distinct, as the index names them. Volvo is named for Cork Week 2014,
2016, 2022 and 2024, which the results pages themselves head "Volvo Cork
Week". Nothing else of a Sailwave page's own title is read as a sponsor:
the club's index names few sponsors after 2020, and the pages' titles
("Autumn League 2026 (Supported by McWilliam Sailbags)") are not the index.

## 4. Dates

The club's indexes list no dates. A series is dated, in order of trust:

1. by races whose labels give a day, a month and a year ("23/04/2018"), or
   whose Sail100 race pages give their start ("Start: Fri 2 May 14
   19:05:00", §8), when all of them fall in the season;
2. by races whose labels give a day and a month by name ("30th Sep R1",
   "Sun 3rd Nov", "Aug 13th"), in the season's year — *inferred*, from the
   season page the result is listed on. Not used where the labels run from
   one winter into the next;
3. by the season alone.

280 series are dated by their races, one is pinned, and the other 259 are
dated by the season. A Sail100 standings page carries no race dates; the
race pages its columns link do, and those of the 777 pages that publish them
(§8) date their series. Of the rest, 168 are Sailwave files whose race
labels state no date, 87 Sail100 pages that link no race pages, and 4
Sail100 series whose race pages are not published (§8); most of them, 212,
are dinghy events. The 2018 April League's race labels say
2014 — *inferred*, the file was built from an earlier year's — so it is
dated by the season. The 2017 Super League is pinned to 4 May – 7 September
2017: 125 of its 126 race pages fall between them, and IRC 2's race 1 page
says 29 July 2016 — *inferred*, a start carried over from the year before,
as its results are this season's.

## 5. What the club's pages link to but this archive does not carry

Every link is in `series.json`, published or skipped with its reason:

| Pages | Why |
|------:|-----|
| 63 | Cork Week 2004–2010's per-boat pages ("Boats A–B") and press summaries — other views of the class results. |
| 45 | Broken links: the page is no longer on the server (among them ICRA's 2017 Nationals, hosted on `cruiserracing.ie`, and the 2012 Optimist leagues). |
| 36 | Entry lists published before a race was sailed and never updated. |
| 17 | The 2020 Virtual Regatta leagues — online racing during the lockdown. |
| 13 | PDFs and images. |
| 11 | Ranking lists, fleet allocations, coaching schedules and a pursuit race's start times. |
| 9 | Pages written over with another year's result (§6). |
| 2 | Cove Sailing Club's 2025 Blackrock Race and Triple Crown, on HalSail. |
| 2 | Results published in Sail Scoring itself, linked by their Sail Scoring address: the 2026 Winter League and Dinghy Frostbites. |
| 1 | The 2026 Autumn League, scored in Sail Scoring as well (`/p/rcyc/2026/rcyc-autumn-league`). |
| 1 | The 2013 RS Southerns, in an older Sailwave layout the app's reader does not read. |
| 1 | A page on IODAI's site about the 2020 Optimist Nationals. |
| 1 | An empty page: Cork Week 2004's Boat of the Week. |

## 6. Pages written over with another year's result

Up to 2016 the club often published a new season's league into the
previous season's folder, over the old files. A page's Sail100 or Sailwave
generation stamp, and its heading, say what it now holds:

- The 2015 March League's two pages hold the **2016** March League (headed
  2016, generated March 2016). They are archived as March League 2016, with
  a note; the 2015 league's own results are lost.
- The 2013 May League's 1720 page is headed "Crosshaven Boat Yard – March
  League 1720" and was generated on 9 March 2014, but its results are the
  **2013 May League's**: its six race pages, generated at the same moment,
  start between 3 and 30 May 2013, and every boat's points in them match the
  standings. The club re-headed the file for the next season and published
  it again. It is archived as the May League 2013's 1720 class, with a note;
  the March League 2014's own 1720 link is an entry list.
- The 2013 April White Sail League's two pages hold the 2014 league's, which
  the 2014 pages also publish. Not carried.
- The 2013 At Home's IRC 3, the 2013 Super League's ECHO 2, the 2014 March
  League's IRC All In, two 2014 Sunday League pages and the 2015 Sunday
  League's two All In pages each hold the next year's. Not carried.

Every other page here holds the following year's racing by its race
pages' own start dates, not only by its heading and stamp.

Pages regenerated later with their own year's heading (the 2012 July–
September League's IRC 2 and 3, the 2015 Autumn Series, the SCORA leagues
finalised in the January after) are the year's own and are kept.

## 7. Cork Week

Cork Week's results are on `corkweek.ie` to 2018 and on the club's site from
2022; there was none in 2020. 2004–2016 are a page per class, 2018 five Sailwave
files (§2), 2022–2026 one Sailwave file each. 2016's pages include the IRC
European Championship, sailed within the week. 2012's edition page is no
longer linked from the editions page but is still on the site.

2004 and 2006 were published by an older Sail100, which shades a discarded
race grey rather than marking it with a class; the app's Sail100 reader takes
the shading as the discard (570 in 2004, 387 in 2006, and in every row the
races left unshaded sum to the published series points). Their pages carry
no `<h1>`, so the heading `series.json` records for each is its bold first
line, "Cork Week IRC1". A score after a code is published as it stands
("APS5.6").

## 8. The Sail100 race pages

Each column of a Sail100 standings page links that race's own page: its
start, and each boat's finish time, elapsed time, handicap, corrected time,
place and points. Those pages are captured beside their standings, and a
class's races are published as tables below its standings, on the same page
— one table per race, headed as the race page heads it ("Race 3", "Navy
Race") with its start line.

858 standings pages link their races' pages, 6,101 in all. The 777 whose
every race page was captured, and agrees with the standings — every boat's
points in the race page are those in its column — publish them: 5,589 race
tables. The other 81 publish their standings alone, each with the reason in
`series.json` (`noRaces`):

| Pages | Why |
|------:|-----|
| 55 | A race page disagrees with the standings. Almost always it is an earlier version: the club regenerated the standings after a correction, a protest or a late entry, and did not publish the race's page again — the race page's Sail100 stamp is the older. |
| 24 | A race page is no longer on the server (134 race pages: 131 answer 404, 3 are empty) — among them every race of the 2013 Optimist June leagues and of 2017's Friday Night IHS, and 70 of the 2016 Optimist ranking's 72, whose other two links reach another event's races. |
| 2 | A race's link reaches another event's race, or another year's. |

A race page that agrees with its standings is published as it stands, with
the boats and columns it lists; one that lists a boat the standings do not,
or misses one, counts as disagreeing.

## 9. Names in the standings

Keelboat standings list boat and owner, never a helm; a row is named by its
owner, as in the other cruiser archives (`ownerNames`). A row that names a
helm — every dinghy page — keeps it.

## 10. Encoding

98 pages are windows-1252 and the rest UTF-8; each is read by what it
declares.

## 11. Not done yet

- **The competitor-identity manifest.**

## 12. Questions for the club

1. Do the 2013 May League 1720, the 2015 March League, and the other
   overwritten pages (§6) survive anywhere — in a `.blw` file, or a backup
   of the results folders?
2. Should the 2020 Virtual Regatta leagues be archived as club results?
3. Is the 2025 Autumn League's "Official Partners – AIB / John Paul
   Construction / Johnson & Perrot – supported by CH Marine and McWilliam
   Sailbags" a sponsorship of that league, or of the club's racing?
4. Which of the 2026 Autumn League's publications is the club's of record —
   the Sailwave page or Sail Scoring's?
