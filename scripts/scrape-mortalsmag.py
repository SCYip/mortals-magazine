#!/usr/bin/env python3
"""Scrape full article content + categories from mortalsmag.com post pages.
Reads slugs.txt, writes articles.json. Run from /tmp/mortals-scrape."""
import re, html, json, urllib.request, time, sys

GENRE_LABELS = {
    'Nonfiction': 'nonfiction',
    'Fiction-Prose': 'fiction-prose',
    'Fiction - Prose': 'fiction-prose',
    'Fiction-Poetry': 'fiction-poetry',
    'Fiction - Poetry': 'fiction-poetry',
    'Book/Movie/Game Review': 'review',
    'Review': 'review',
    'Other': 'other',
}
# Wix category label -> our column slug
COLUMN_LABELS = {
    'Astronomical Astonishment': 'astronomical',
    'Astronomy Club': 'astronomical',
    'Inkmagination': 'inkmagination',
    'Fourteenlines': 'fourteenlines',
    "Fourteenlines: Poets' Society": 'fourteenlines',
    'Whale Done': 'whale-done',
    'Whale Done: UN SDGs': 'whale-done',
    'Conscious Closet': 'whale-done',
}
ALL_LABELS = set(GENRE_LABELS) | set(COLUMN_LABELS)

def fetch(slug):
    from urllib.parse import quote
    url = 'https://www.mortalsmag.com/post/' + quote(slug, safe='')
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')

def og(raw, prop):
    m = re.search(r'<meta property=["\']og:'+prop+r'["\'] content=["\'](.*?)["\']\s*/?>', raw, re.DOTALL)
    return html.unescape(m.group(1)) if m else None

def extract_categories(raw):
    # The post's own categories live in <ul aria-label="Post categories">.
    # Each <a data-hook="link">LABEL</a> is a category. Map by label text.
    m = re.search(r'aria-label="Post categories">(.*?)</ul>', raw, re.DOTALL)
    if not m:
        return []
    labels = re.findall(r'data-hook="link"[^>]*>([^<]{2,60})<', m.group(1))
    return [html.unescape(c).strip() for c in labels]

def extract_body(raw):
    i = raw.find('data-hook="post-description"')
    if i < 0:
        return None
    seg = raw[i:i+30000]
    # Drop SVG blocks (share icons) entirely
    seg = re.sub(r'<svg.*?</svg>', ' ', seg, flags=re.DOTALL|re.IGNORECASE)
    seg = re.sub(r'<path[^>]*>', ' ', seg, flags=re.IGNORECASE)
    txt = re.sub(r'<[^>]+>', '\n', seg)
    txt = html.unescape(txt)
    txt = re.sub(r'[ \t]+', ' ', txt)
    txt = re.sub(r'\n\s*\n+', '\n\n', txt).strip()
    # Cut trailing chrome
    for marker in ['Recent Posts', 'Comments (', 'Share this post', 'bottom of page',
                   'Submission', '© ', 'Sign up to', 'Write a comment']:
        p = txt.find(marker)
        if p > 0:
            txt = txt[:p].strip()
    # Cut category labels that appear right after the body
    lines = txt.split('\n')
    out = []
    for ln in lines:
        if ln.strip() in ALL_LABELS:
            break
        out.append(ln)
    return '\n'.join(out).strip()

def main():
    slugs = [s.strip() for s in open('slugs.txt') if s.strip()]
    results = []
    for n, slug in enumerate(slugs, 1):
        try:
            raw = fetch(slug)
        except Exception as e:
            print(f'  [{n}/{len(slugs)}] {slug}: FETCH ERR {e}', file=sys.stderr)
            continue
        title = og(raw, 'title') or slug
        title = re.sub(r'\s*\|\s*The Mortals.*$', '', title).strip()
        cats = extract_categories(raw)
        genres = [GENRE_LABELS[c] for c in cats if c in GENRE_LABELS]
        columns = [COLUMN_LABELS[c] for c in cats if c in COLUMN_LABELS]
        body = extract_body(raw) or ''
        results.append({
            'wixSlug': slug,
            'title': title,
            'genre': genres[0] if genres else 'other',
            'columns': sorted(set(columns)),
            'rawCats': cats,
            'bodyLen': len(body),
            'body': body,
        })
        print(f'  [{n}/{len(slugs)}] {slug}: genre={genres} cols={columns} bodyLen={len(body)}')
        time.sleep(0.3)
    json.dump(results, open('articles.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\nWrote {len(results)} articles to articles.json')

if __name__ == '__main__':
    main()
