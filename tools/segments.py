"""Extract translatable segments from site/data/wiki-data.js into i18n/src/<slug>.json
A segment = innerHTML of a 'leaf block' (p, li, th, td, h*, caption, figcaption, blockquote, dt, dd, summary)
that has no nested block. Short table cells (< 4 words, likely item/mod names) are skipped."""
import json, os, re, sys
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKS = ["p", "li", "th", "td", "h2", "h3", "h4", "h5", "caption", "figcaption", "blockquote", "dt", "dd", "button"]
BLOCKSET = set(BLOCKS) | {"ul", "ol", "table", "div", "figure", "section", "tr", "tbody"}

def load():
    js = open(os.path.join(ROOT, "site", "data", "wiki-data.js"), encoding="utf-8").read()
    return json.loads(js[js.index("{"): js.rstrip().rstrip(";").rindex("}") + 1])

def leaf_blocks(soup):
    for el in soup.find_all(BLOCKS):
        if el.find(lambda t: t.name in BLOCKSET):
            # has nested blocks: take only its direct text if meaningful (rare) -> skip
            continue
        yield el

def wanted(el):
    txt = re.sub(r"\s+", " ", el.get_text(" ")).strip()
    if not re.search(r"[A-Za-z]", txt): return False
    if el.name == "td" and len(txt.split()) < 4: return False
    if el.name == "li" and len(txt.split()) < 3 and not el.find("a"):
        return False  # bare item / mod names
    return True

def norm(h):
    return re.sub(r"\s+", " ", h).strip()

if __name__ == "__main__":
    W = load()
    out = os.path.join(ROOT, "i18n", "src"); os.makedirs(out, exist_ok=True)
    total = 0; words = 0
    for slug, p in W["pages"].items():
        soup = BeautifulSoup(p["html"], "html.parser")
        segs = []
        for el in leaf_blocks(soup):
            if not wanted(el): continue
            h = norm(el.decode_contents())
            if h and h not in segs: segs.append(h)
        ib = p.get("infobox")
        if ib:
            for sec in ib["sections"]:
                for s in [sec["name"]] + [r["label"] for r in sec["rows"]] + [r["value"] for r in sec["rows"] if len(r["value"].split()) >= 3]:
                    if s and re.search(r"[A-Za-z]", s) and s not in segs: segs.append(s)
        segs.insert(0, p["title"]) if p["title"] not in segs else None
        json.dump(segs, open(os.path.join(out, slug + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
        w = sum(len(BeautifulSoup(s, "html.parser").get_text(" ").split()) for s in segs)
        total += len(segs); words += w
        print(f"{slug:45} {len(segs):4} segs {w:5} words")
    print("TOTAL", total, words)
