#!/usr/bin/env python3
"""
Patch the 73 compound/grouped verses that returned 404 individually on vedabase.io.
Fetches the correct grouped URL (e.g. bg/1/16-18) and applies the shared
translation+purport to each verse in the group.
"""
import json, re, urllib.request, time, sys
from html import unescape
from concurrent.futures import ThreadPoolExecutor, as_completed

TAG_RE = re.compile(r'<[^>]+>')

def strip_html(text: str) -> str:
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = TAG_RE.sub('', text)
    text = unescape(text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_section(html: str, section_name: str) -> str:
    pattern = re.compile(
        rf'<h2[^>]*>\s*{section_name}\s*</h2>(.*?)(?=<h2|<div class="av-|$)',
        re.DOTALL | re.IGNORECASE
    )
    m = pattern.search(html)
    if not m:
        return ''
    return strip_html(m.group(1))

def fetch_url(url: str) -> str:
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception as e:
            if attempt == 2:
                print(f"  FAIL {url}: {e}", file=sys.stderr)
                return ''
            time.sleep(2 ** attempt)
    return ''

# Map: (chapter, [verse_list]) -> URL path to try
# Each entry is the list of verse numbers that share one page on vedabase
COMPOUND_GROUPS = [
    (1, [16, 17, 18],   "1/16-18"),
    (1, [21, 22],       "1/21-22"),
    (1, [32, 33, 34, 35], "1/32-35"),
    (1, [37, 38],       "1/37-38"),
    (2, [42, 43],       "2/42-43"),
    (5, [8, 9],         "5/8-9"),
    (5, [27, 28],       "5/27-28"),
    (6, [11, 12],       "6/11-12"),
    (6, [13, 14],       "6/13-14"),
    (6, [20, 21],       "6/20-21"),
    (6, [22, 23],       "6/22-23"),
    (10, [4, 5],        "10/4-5"),
    (10, [12, 13],      "10/12-13"),
    (11, [10, 11],      "11/10-11"),
    (11, [26, 27],      "11/26-27"),
    (11, [41, 42],      "11/41-42"),
    (12, [3, 4],        "12/3-4"),
    (12, [6, 7],        "12/6-7"),
    (12, [13, 14],      "12/13-14"),
    (12, [18, 19],      "12/18-19"),
    (13, [1, 2],        "13/1-2"),
    (13, [6, 7],        "13/6-7"),
    (13, [8, 9, 10, 11, 12], "13/8-12"),
    (14, [22, 23, 24, 25], "14/22-25"),
    (15, [3, 4],        "15/3-4"),
    (16, [1, 2, 3],     "16/1-3"),
    (16, [11, 12],      "16/11-12"),
    (16, [13, 14, 15],  "16/13-15"),
    (17, [5, 6],        "17/5-6"),
    (17, [26, 27],      "17/26-27"),
    (18, [51, 52, 53],  "18/51-53"),
]

def fetch_group(ch, verses, path):
    url = f'https://vedabase.io/en/library/bg/{path}/'
    html = fetch_url(url)
    if not html:
        # Try alternative groupings if main one fails
        return ch, verses, '', ''
    translation = extract_section(html, 'Translation')
    purport = extract_section(html, 'Purport')
    return ch, verses, translation, purport

def ts_str(s):
    return json.dumps(s, ensure_ascii=False)

def main():
    print("Fetching compound verse translations...", file=sys.stderr)

    results = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_group, ch, verses, path): (ch, verses, path)
                   for ch, verses, path in COMPOUND_GROUPS}
        for future in as_completed(futures):
            ch, verses, translation, purport = future.result()
            for v in verses:
                results[(ch, v)] = (translation, purport)
            status = "OK" if translation else "EMPTY"
            print(f"  {status} bg/{COMPOUND_GROUPS[[g[2] for g in COMPOUND_GROUPS].index(next(g[2] for g in COMPOUND_GROUPS if g[0]==ch and set(g[1])==set(verses)))]}",
                  file=sys.stderr)

    # Now patch slokas.ts
    with open('artifacts/sloka-hub/data/slokas.ts', encoding='utf-8') as f:
        content = f.read()

    patched = 0
    for (ch, v), (translation, purport) in results.items():
        if not translation:
            continue
        sloka_id = f'bg_{ch}_{v}'
        # Find the fallback translation pattern and replace it
        fallback_pattern = rf'(id: "{sloka_id}".*?translation: )"Bhagavad Gita {ch}\.{v}"'
        replacement = rf'\1{ts_str(translation)}'
        new_content, n = re.subn(fallback_pattern, replacement, content, flags=re.DOTALL)
        if n > 0:
            content = new_content
            # Also try to add purport if not present
            if purport:
                # Find the verse block and add purport after translation
                purport_check = re.search(rf'id: "{sloka_id}".*?purport:', content, re.DOTALL)
                if not purport_check:
                    # Add purport after translation line
                    trans_pattern = rf'(id: "{sloka_id}".*?translation: {re.escape(ts_str(translation))},)\n'
                    purport_line = rf'\1\n    purport: {ts_str(purport)},\n'
                    content, n2 = re.subn(trans_pattern, purport_line, content, flags=re.DOTALL)
            patched += 1

    with open('artifacts/sloka-hub/data/slokas.ts', 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Patched {patched} compound verse entries.", file=sys.stderr)

    # Report still-missing
    still_missing = re.findall(r'translation: "Bhagavad Gita (\d+\.\d+)"', content)
    if still_missing:
        print(f"Still missing translations for: {still_missing}", file=sys.stderr)
    else:
        print("All translations filled in!", file=sys.stderr)

if __name__ == '__main__':
    main()
