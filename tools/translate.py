"""Apply i18n/fr/*.json to site/data/wiki-data.js -> site/data/wiki-fr.js (window.WIKI_FR = {slug: {...}})."""
import json, os, re, glob, sys
from bs4 import BeautifulSoup
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from segments import load, leaf_blocks, norm

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
allsegs = json.load(open(os.path.join(ROOT, "i18n", "all.json"), encoding="utf-8"))
fr = {}
for f in sorted(glob.glob(os.path.join(ROOT, "i18n", "fr", "*.json"))):
    fr.update(json.load(open(f, encoding="utf-8")))
D = {allsegs[int(k)]: v for k, v in fr.items()}
T = lambda s: D.get(s, s)
REDLINK_EN = 'title="This page has not been written yet"'
REDLINK_FR = 'title="Cette page n\'a pas encore été écrite"'

W = load()
out = {}
hits = 0
for slug, p in W["pages"].items():
    soup = BeautifulSoup(p["html"], "html.parser")
    for el in list(leaf_blocks(soup)):
        h = norm(el.decode_contents())
        if h in D:
            el.clear()
            el.append(BeautifulSoup(D[h], "html.parser"))
            hits += 1
    html = str(soup).replace(REDLINK_EN, REDLINK_FR)
    toc = [dict(t, text=T(t["text"])) for t in p["toc"]]
    ib = p.get("infobox")
    if ib:
        ib = json.loads(json.dumps(ib))
        for sec in ib["sections"]:
            sec["name"] = T(sec["name"])
            for r in sec["rows"]:
                r["label"] = T(r["label"]); r["value"] = T(r["value"])
    text = re.sub(r"\s+", " ", BeautifulSoup(html, "html.parser").get_text(" ")).strip()
    out[slug] = {"title": T(p["title"]), "html": html, "toc": toc, "infobox": ib, "text": text, "words": len(text.split())}

js = "window.WIKI_FR = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(os.path.join(ROOT, "site", "data", "wiki-fr.js"), "w", encoding="utf-8").write(js)
print("replaced blocks", hits, "bytes", len(js))
missing_titles = [p["title"] for s, p in W["pages"].items() if T(p["title"]) == p["title"]]
print("titles kept in English:", missing_titles)
