#!/usr/bin/env python3
"""
Fetch all 700 Bhagavad Gita As It Is verses:
  - gita/gita GitHub repo: Sanskrit text, transliteration, word meanings
  - vedabase.io: Prabhupada's translation + purport
Handles compound/grouped verses. Outputs: artifacts/sloka-hub/data/slokas.ts
"""

import json, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape

TAG_RE = re.compile(r'<[^>]+>')
JUNK_RE = re.compile(
    r'TEXT\s+\d+\s*TEXT\s+\d+.*$|Donate\s*Thanks\s*to.*$|DonateThanks.*$',
    re.DOTALL | re.IGNORECASE
)

CHAPTER_NAMES = {
    1:  "Observing the Armies on the Battlefield of Kurukṣetra",
    2:  "Contents of the Gītā Summarized",
    3:  "Karma-yoga",
    4:  "Transcendental Knowledge",
    5:  "Karma-yoga—Action in Kṛṣṇa Consciousness",
    6:  "Dhyāna-yoga",
    7:  "Knowledge of the Absolute",
    8:  "Attaining the Supreme",
    9:  "The Most Confidential Knowledge",
    10: "The Opulence of the Absolute",
    11: "The Universal Form",
    12: "Devotional Service",
    13: "Nature, the Enjoyer, and Consciousness",
    14: "The Three Modes of Material Nature",
    15: "The Yoga of the Supreme Person",
    16: "The Divine and Demoniac Natures",
    17: "The Divisions of Faith",
    18: "Conclusion—The Perfection of Renunciation",
}

CHAPTER_VERSES = {1:46,2:72,3:43,4:42,5:29,6:47,7:30,8:28,
                  9:34,10:42,11:55,12:20,13:35,14:27,15:20,
                  16:24,17:28,18:78}

# Compound verse groups: (ch, [verses], path_suffix)
# Each entry means these verse numbers share one URL on vedabase
COMPOUND_GROUPS = [
    (1,  [16,17,18],         "1/16-18"),
    (1,  [21,22],            "1/21-22"),
    (1,  [32,33,34,35],      "1/32-35"),
    (1,  [37,38],            "1/37-38"),
    (2,  [42,43],            "2/42-43"),
    (5,  [8,9],              "5/8-9"),
    (5,  [27,28],            "5/27-28"),
    (6,  [11,12],            "6/11-12"),
    (6,  [13,14],            "6/13-14"),
    (6,  [20,21,22,23],      "6/20-23"),
    (10, [4,5],              "10/4-5"),
    (10, [12,13],            "10/12-13"),
    (11, [10,11],            "11/10-11"),
    (11, [26,27],            "11/26-27"),
    (11, [41,42],            "11/41-42"),
    (12, [3,4],              "12/3-4"),
    (12, [6,7],              "12/6-7"),
    (12, [13,14],            "12/13-14"),
    (12, [18,19],            "12/18-19"),
    (13, [1,2],              "13/1-2"),
    (13, [6,7],              "13/6-7"),
    (13, [8,9,10,11,12],     "13/8-12"),
    (14, [22,23,24,25],      "14/22-25"),
    (15, [3,4],              "15/3-4"),
    (16, [1,2,3],            "16/1-3"),
    (16, [11,12],            "16/11-12"),
    (16, [13,14,15],         "16/13-15"),
    (17, [5,6],              "17/5-6"),
    (17, [26,27],            "17/26-27"),
    (18, [51,52,53],         "18/51-53"),
]

# Build lookup: (ch, v) -> url_path
COMPOUND_URL: dict = {}
for ch, verses, path in COMPOUND_GROUPS:
    for v in verses:
        COMPOUND_URL[(ch, v)] = path


def strip_html(text: str) -> str:
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = TAG_RE.sub('', text)
    text = unescape(text)
    # Remove vedabase navigation / donor junk
    text = JUNK_RE.sub('', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_section(html: str, section_name: str) -> str:
    """Extract text of a named section from a vedabase verse page HTML."""
    pattern = re.compile(
        rf'<h2[^>]*>\s*{section_name}\s*</h2>(.*?)(?=<(?:h2|div\s[^>]*\bav-[a-z])[^>]*>|$)',
        re.DOTALL | re.IGNORECASE
    )
    m = pattern.search(html)
    if not m:
        return ''
    return strip_html(m.group(1))


def fetch_url(url: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (compatible; BG-fetcher/1.0)',
            })
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception as e:
            if attempt == retries - 1:
                print(f"  FAIL {url}: {e}", file=sys.stderr)
                return ''
            time.sleep(2 ** attempt)
    return ''


def fetch_vedabase(ch: int, v: int) -> tuple[int, int, str, str]:
    """Return (ch, v, translation, purport). Falls back to compound URL."""
    path = COMPOUND_URL.get((ch, v)) or f"{ch}/{v}"
    url = f'https://vedabase.io/en/library/bg/{path}/'
    html = fetch_url(url)
    translation = extract_section(html, 'Translation') if html else ''
    purport      = extract_section(html, 'Purport')     if html else ''
    return ch, v, translation, purport


def parse_word_meanings(raw: str) -> list:
    results = []
    parts = raw.replace('\n', ' ').split(';')
    for part in parts:
        part = part.strip().rstrip('.')
        if not part:
            continue
        for sep in ['—', '–', '-']:
            if sep in part:
                word, _, meaning = part.partition(sep)
                word    = re.sub(r'\s+', ' ', word).strip()
                meaning = re.sub(r'\s+', ' ', meaning).strip()
                if word and meaning:
                    results.append({'word': word, 'meaning': meaning})
                break
    return results


def ts_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def main():
    # 1. Fetch verse.json ─────────────────────────────────────────────────────
    print("Fetching verse.json from gita/gita repo...", file=sys.stderr)
    req = urllib.request.Request(
        'https://raw.githubusercontent.com/gita/gita/master/data/verse.json',
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        verse_data = json.loads(r.read())
    verse_index = {(v['chapter_number'], v['verse_number']): v for v in verse_data}
    print(f"  {len(verse_data)} verse records loaded", file=sys.stderr)

    # 2. Build list of (ch, v) pairs ─────────────────────────────────────────
    all_pairs = [(ch, v)
                 for ch in range(1, 19)
                 for v in range(1, CHAPTER_VERSES[ch] + 1)]

    # Deduplicate fetches: only one URL per unique path
    seen_paths: set = set()
    fetch_jobs = []
    for ch, v in all_pairs:
        path = COMPOUND_URL.get((ch, v)) or f"{ch}/{v}"
        if path not in seen_paths:
            seen_paths.add(path)
            fetch_jobs.append((ch, v))  # representative verse for this URL

    print(f"Fetching {len(fetch_jobs)} unique URLs from vedabase.io...", file=sys.stderr)

    # 3. Fetch translations concurrently ──────────────────────────────────────
    path_cache: dict = {}   # path -> (translation, purport)
    done = 0
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(fetch_vedabase, ch, v): (ch, v)
                   for ch, v in fetch_jobs}
        for future in as_completed(futures):
            ch, v = futures[future]
            _, _, translation, purport = future.result()
            path = COMPOUND_URL.get((ch, v)) or f"{ch}/{v}"
            path_cache[path] = (translation, purport)
            done += 1
            if done % 50 == 0 or done == len(fetch_jobs):
                print(f"  {done}/{len(fetch_jobs)} fetched", file=sys.stderr)

    # 4. Build slokas array ───────────────────────────────────────────────────
    print("Building slokas array...", file=sys.stderr)
    slokas = []
    missing = []
    for ch, v in all_pairs:
        path = COMPOUND_URL.get((ch, v)) or f"{ch}/{v}"
        translation, purport = path_cache.get(path, ('', ''))

        gv = verse_index.get((ch, v), {})

        raw_text = re.sub(r'।।\d+\.\d+।।', '', gv.get('text', ''))
        devanagari = [l.strip() for l in raw_text.split('\n') if l.strip()]

        raw_trans = gv.get('transliteration', '')
        transliteration = [l.strip() for l in raw_trans.split('\n') if l.strip()]

        word_by_word = parse_word_meanings(gv.get('word_meanings', ''))

        if not translation:
            translation = f'Bhagavad Gita {ch}.{v}'
            missing.append(f'{ch}.{v}')

        sloka: dict = {
            'id':              f'bg_{ch}_{v}',
            'title':           f'Bhagavad Gita {ch}.{v}',
            'source':          'Bhagavad Gita As It Is',
            'category':        f'Chapter {ch}: {CHAPTER_NAMES[ch]}',
            'devanagari':      devanagari,
            'transliteration': transliteration,
            'translation':     translation,
            'word_by_word':    word_by_word,
        }
        if purport:
            sloka['purport'] = purport

        slokas.append(sloka)

    if missing:
        print(f"WARNING – still missing translations for: {missing}", file=sys.stderr)
    else:
        print("All 700 translations filled in!", file=sys.stderr)

    # 5. Write TypeScript ─────────────────────────────────────────────────────
    print(f"Writing {len(slokas)} slokas to TypeScript...", file=sys.stderr)
    lines = [
        "export interface WordMeaning {",
        "  word: string;",
        "  meaning: string;",
        "}",
        "",
        "export interface Sloka {",
        "  id: string;",
        "  title: string;",
        "  source: string;",
        "  devanagari: string[];",
        "  transliteration: string[];",
        "  translation: string;",
        "  purport?: string;",
        "  word_by_word: WordMeaning[];",
        "  audio_url?: string;",
        "  category: string;",
        "}",
        "",
        "export const slokas: Sloka[] = [",
    ]

    for s in slokas:
        lines.append("  {")
        lines.append(f'    id: {ts_str(s["id"])},')
        lines.append(f'    title: {ts_str(s["title"])},')
        lines.append(f'    source: {ts_str(s["source"])},')
        lines.append(f'    category: {ts_str(s["category"])},')

        dev_items  = ",\n      ".join(ts_str(d) for d in s["devanagari"])
        trans_items = ",\n      ".join(ts_str(t) for t in s["transliteration"])
        lines.append(f'    devanagari: [\n      {dev_items},\n    ],')
        lines.append(f'    transliteration: [\n      {trans_items},\n    ],')
        lines.append(f'    translation: {ts_str(s["translation"])},')

        if s.get('purport'):
            lines.append(f'    purport: {ts_str(s["purport"])},')

        if s['word_by_word']:
            lines.append("    word_by_word: [")
            for wm in s['word_by_word']:
                lines.append(f'      {{ word: {ts_str(wm["word"])}, meaning: {ts_str(wm["meaning"])} }},')
            lines.append("    ],")
        else:
            lines.append("    word_by_word: [],")

        lines.append("  },")

    lines.append("];")
    lines.append("")
    lines.append("export const categories = [...new Set(slokas.map((s) => s.category))];")

    out_path = 'artifacts/sloka-hub/data/slokas.ts'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    print(f"Done! {out_path}  ({len(slokas)} slokas)", file=sys.stderr)


if __name__ == '__main__':
    main()
