"""Convert the crawled wiki.gg dump (raw/wiki.json + raw/images) into site/data/wiki-data.js
and optimized images in site/assets/img. Run: python -I tools/build.py"""
import json, os, re, sys, shutil, html, urllib.parse
from bs4 import BeautifulSoup, Comment, NavigableString
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw")
SITE = os.path.join(ROOT, "site")
IMG_OUT = os.path.join(SITE, "assets", "img")
os.makedirs(IMG_OUT, exist_ok=True)
os.makedirs(os.path.join(SITE, "data"), exist_ok=True)
sys.stdout.reconfigure(encoding="utf-8")

data = json.load(open(os.path.join(RAW, "wiki.json"), encoding="utf-8"))
pages = data["pages"]

# ---------- slugs ----------
def norm_title(t):
    return urllib.parse.unquote(t).replace("_", " ").strip()

def slugify(t):
    t = norm_title(t)
    t = t.replace("’", "'")
    s = re.sub(r"[^A-Za-z0-9]+", "-", t).strip("-").lower()
    return s

SKIP = {"Main Page", "Treasure Bags"}  # redirects (Main Page -> Linggango Wiki, Treasure Bags -> How to update Treasure Bags)
title_to_slug = {}
for t in pages:
    if t in SKIP: continue
    title_to_slug[t] = "home" if t == "Linggango Wiki" else slugify(t)
title_to_slug["Main Page"] = "home"
title_to_slug["Treasure Bags"] = slugify("How to update Treasure Bags")
lower_map = {k.lower(): v for k, v in title_to_slug.items()}

# ---------- images ----------
img_map = {}
for im in data["images"]:
    name = im["name"]
    src = os.path.join(RAW, "images", name)
    if not os.path.exists(src): continue
    base, ext = os.path.splitext(name)
    safe = re.sub(r"[^A-Za-z0-9._-]+", "_", base)
    entry = {"w": im.get("width"), "h": im.get("height")}
    if ext.lower() in (".png", ".jpg", ".jpeg") and os.path.getsize(src) > 40_000:
        out = safe + ".webp"
        with Image.open(src) as I:
            I = I.convert("RGBA") if I.mode in ("P", "LA") else I
            if I.width > 1800:
                I = I.resize((1800, round(I.height * 1800 / I.width)), Image.LANCZOS)
            entry["w"], entry["h"] = I.size
            I.save(os.path.join(IMG_OUT, out), "WEBP", quality=84, method=6)
    else:
        out = safe + ext.lower()
        shutil.copyfile(src, os.path.join(IMG_OUT, out))
    entry["src"] = "assets/img/" + out
    img_map[name] = entry
    img_map[name.replace("_", " ")] = entry

def img_for(src):
    """Map /images/thumb/X/300px-X?abc or /images/X?abc to local entry."""
    p = urllib.parse.urlparse(src).path
    p = urllib.parse.unquote(p)
    m = re.match(r"/images/thumb/([^/]+)/", p)
    name = m.group(1) if m else p.rsplit("/", 1)[-1]
    return img_map.get(name)

# ---------- helpers ----------
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿️]+")

def text_of(el):
    return re.sub(r"\s+", " ", el.get_text(" ")).strip()

def heading_text(el):
    return EMOJI.sub("", text_of(el)).strip()

def clean_style(tag):
    st = tag.get("style")
    if not st: return
    s = st.lower().replace(" ", "")
    classes = tag.get("class", [])
    if "display:none" in s:
        tag.decompose(); return True
    if "color:#8b5cf6" in s: classes.append("hl")
    if "border-left:4px" in s: classes.append("callout")
    if "color:red" in s: classes.append("warn")
    if "font-size:2.5em" in s and tag.name == "span": classes.append("bignum")
    if classes: tag["class"] = classes
    del tag["style"]

def convert_infobox(box):
    info = {"title": None, "image": None, "kind": None, "sections": []}
    for c in box.get("class", []):
        if c.startswith("druid-container-") and c != "druid-container": info["kind"] = c.replace("druid-container-", "")
    t = box.select_one(".druid-title")
    if t: info["title"] = text_of(t)
    im = box.select_one(".druid-main-image img")
    if im:
        e = img_for(im.get("src", ""))
        if e: info["image"] = e["src"]
    current = None
    for el in box.select(".druid-section, .druid-row"):
        if "druid-section" in el.get("class", []) and "druid-section-container" not in el.get("class", []):
            current = {"name": text_of(el), "rows": []}
            info["sections"].append(current)
        elif "druid-row" in el.get("class", []):
            if current is None:
                current = {"name": "", "rows": []}; info["sections"].append(current)
            lab = el.select_one(".druid-label"); val = el.select_one(".druid-data")
            current["rows"].append({"label": text_of(lab) if lab else "", "value": text_of(val) if val else ""})
    box.decompose()
    return info

def rewrite_link(a, page_title):
    href = a.get("href", "")
    if a.get("class") and "new" in a.get("class"):
        # red link: page does not exist on the wiki
        span = BeautifulSoup("", "html.parser").new_tag("span")
        span["class"] = ["redlink"]
        span["title"] = "This page has not been written yet"
        span.string = a.get_text()
        a.replace_with(span); return
    if href.startswith("/wiki/"):
        target = href[6:]
        frag = ""
        if "#" in target: target, frag = target.split("#", 1)
        tt = norm_title(target)
        if tt.startswith("File:"):
            return
        slug = title_to_slug.get(tt) or lower_map.get(tt.lower())
        if slug:
            a["href"] = "#/" + slug + (("/" + frag) if frag else "")
            a["class"] = a.get("class", []) + ["internal"]
        else:
            a["href"] = "https://linggango.wiki.gg" + href
            a["target"] = "_blank"; a["rel"] = "noopener"
        for k in ("title",): a.attrs.pop(k, None)
    elif href.startswith("http"):
        a["target"] = "_blank"; a["rel"] = "noopener"
        a["class"] = [c for c in a.get("class", []) if c not in ("text",)] + ["ext"]
    elif href.startswith("#"):
        a["href"] = "#/" + title_to_slug[page_title] + "/" + href[1:]
        a["class"] = a.get("class", []) + ["anchor"]

def make_img(soup, img, caption=None):
    e = img_for(img.get("src", ""))
    if not e:
        return None
    new = soup.new_tag("img")
    new["src"] = e["src"]; new["alt"] = img.get("alt", "").rsplit(".", 1)[0].replace("_", " ")
    new["loading"] = "lazy"; new["decoding"] = "async"
    if e.get("w") and e.get("h"):
        new["width"] = str(e["w"]); new["height"] = str(e["h"])
    w = int(img.get("width") or 0)
    if w and e.get("w") and w < 120: new["class"] = ["icon"]
    if w: new["style"] = f"--w:{w}px"
    new["data-zoom"] = ""
    return new

def process(title, p):
    soup = BeautifulSoup(p["html"], "html.parser")
    root = soup.select_one(".mw-parser-output") or soup
    for c in root.find_all(string=lambda s: isinstance(s, Comment)): c.extract()
    for sel in ["#toc", ".toc", ".mw-editsection", ".mp-box.missing", ".mw-empty-elt"]:
        for el in root.select(sel): el.decompose()

    infobox = None
    ib = root.select_one(".druid-infobox")
    if ib: infobox = convert_infobox(ib)
    for extra in root.select(".druid-infobox"): extra.decompose()

    # video embeds -> privacy-friendly click-to-load
    for fig in root.select("figure.embedvideo"):
        cfg = html.unescape(fig.get("data-mw-iframeconfig", "{}"))
        m = re.search(r"embed/([A-Za-z0-9_-]{6,})", cfg)
        div = soup.new_tag("div"); div["class"] = ["video"]
        if m: div["data-yt"] = m.group(1)
        fig.replace_with(div)

    # tabbers -> our tabs component
    for tb in root.select(".tabber"):
        names = [text_of(a) for a in tb.select(".tabber__tabs .tabber__tab")]
        panels = tb.select(".tabber__panel")
        wrap = soup.new_tag("div"); wrap["class"] = ["tabs"]
        bar = soup.new_tag("div"); bar["class"] = ["tabs-bar"]; bar["role"] = "tablist"
        wrap.append(bar)
        for i, pn in enumerate(panels):
            nm = names[i] if i < len(names) else pn.get("data-mw-tabber-title", f"Tab {i+1}")
            b = soup.new_tag("button"); b["type"] = "button"; b["role"] = "tab"; b.string = nm
            if i == 0: b["aria-selected"] = "true"
            bar.append(b)
            sec = soup.new_tag("div"); sec["class"] = ["tab-panel"]; sec["role"] = "tabpanel"
            if i: sec["hidden"] = ""
            for ch in list(pn.contents): sec.append(ch.extract())
            wrap.append(sec)
        tb.replace_with(wrap)

    # quotes -> lore blockquote
    for q in root.select("div.quote"):
        t = q.select_one(".text") or q
        bq = soup.new_tag("blockquote"); bq["class"] = ["lore"]
        for ch in list(t.contents): bq.append(ch.extract())
        q.replace_with(bq)

    # galleries
    for g in root.select("ul.gallery"):
        div = soup.new_tag("div"); div["class"] = ["gallery"]
        for li in g.select("li.gallerybox"):
            img = li.find("img")
            if not img: continue
            fig = soup.new_tag("figure")
            ni = make_img(soup, img)
            if ni: fig.append(ni)
            cap = li.select_one(".gallerytext")
            if cap and text_of(cap):
                fc = soup.new_tag("figcaption"); fc.string = text_of(cap); fig.append(fc)
            div.append(fig)
        g.replace_with(div)

    # thumbs with captions
    for th in root.select("div.thumb"):
        img = th.find("img")
        fig = soup.new_tag("figure"); fig["class"] = ["thumb"]
        if img:
            ni = make_img(soup, img)
            if ni: fig.append(ni)
        cap = th.select_one(".thumbcaption")
        if cap:
            for m in cap.select(".magnify"): m.decompose()
            if text_of(cap):
                fc = soup.new_tag("figcaption")
                for ch in list(cap.contents): fc.append(ch.extract())
                fig.append(fc)
        th.replace_with(fig)

    # remaining images
    for a in root.select("a.image"):
        img = a.find("img")
        ni = make_img(soup, img) if img else None
        if ni: a.replace_with(ni)
        else: a.decompose()
    for img in root.find_all("img"):
        if img.get("data-zoom") is not None: continue
        src = img.get("src", "")
        if "commons.wiki.gg" in src:
            par = img.parent
            if par.name == "a": par.decompose()
            else: img.decompose()
            continue
        ni = make_img(soup, img)
        if ni: img.replace_with(ni)

    # main-page style boxes (Boss List, Main Page)
    for c in root.select("#mp-container"):
        c.name = "div"; c.attrs = {"class": ["boxes"]}
    for b in root.select(".mp-box"):
        b.attrs = {"class": ["box"], "data-box": b.get("data-box-id", "")} if True else {}
    for b in root.select(".mp-body"):
        b.unwrap()

    # links
    for a in root.find_all("a"):
        rewrite_link(a, title)

    # tables
    for t in root.select("table"):
        cls = t.get("class", [])
        new = ["table"]
        if "sortable" in cls: new.append("sortable")
        if "mw-collapsed" in cls: new.append("collapsed")
        elif "mw-collapsible" in cls: new.append("collapsible")
        t.attrs = {"class": new}
        wrap = soup.new_tag("div"); wrap["class"] = ["table-wrap"]
        t.wrap(wrap)

    # styles, ids of headings
    for tag in list(root.find_all(True)):
        if tag.decomposed if hasattr(tag, "decomposed") else False: continue
        if tag.attrs is None: continue
        clean_style(tag)
        for k in ("decoding",) if tag.name != "img" else ():
            tag.attrs.pop(k, None)
        if tag.name in ("div", "span", "p") and tag.get("class") in (["center"], ["floatnone"]):
            tag.unwrap()

    # headings: flatten mw-headline spans, give stable ids, collect toc
    toc = []
    used = set()
    for h in root.find_all(["h2", "h3", "h4", "h5"]):
        hl = h.select_one(".mw-headline")
        txt = heading_text(h)
        if not txt:
            h.decompose(); continue
        hid = re.sub(r"[^A-Za-z0-9]+", "-", txt).strip("-").lower() or "section"
        base = hid; n = 2
        while hid in used: hid = f"{base}-{n}"; n += 1
        used.add(hid)
        h.clear(); h.string = txt.rstrip(":") if txt.endswith(":") else txt
        h["id"] = hid
        if not h.find_parent(class_="box"):
            toc.append({"id": hid, "text": h.string, "level": int(h.name[1])})
    # anchors that pointed to old MediaWiki ids
    for a in root.select("a.anchor"):
        frag = a["href"].split("/", 2)[-1]
        a["href"] = "#/" + title_to_slug[title] + "/" + re.sub(r"[^A-Za-z0-9]+", "-", urllib.parse.unquote(frag).replace("_", " ")).strip("-").lower()

    # trim empty <p><br></p>
    for pp in root.find_all("p"):
        if not text_of(pp) and not pp.find(["img", "a"]):
            pp.decompose()

    body = "".join(str(c) for c in root.contents).strip()
    body = re.sub(r"\n{2,}", "\n", body)
    plain = re.sub(r"\s+", " ", BeautifulSoup(body, "html.parser").get_text(" ")).strip()
    return body, toc, infobox, plain

# ---------- categories ----------
CATS = [
    ("start", "Start here", ["Getting Started", "Beginners Guide", "Beginner’s Guide", "Issues booting up the game?", "Tips", "Discord"]),
    ("progression", "Progression", ["Quest Chapters", "Weapon Progression", "Magic Progression", "Tech Progression", "Combat Guide", "Misc"]),
    ("bosses", "Bosses", ["Boss List", "Boss List/pre-hardmode", "Boss List/hardmode", "Iron Colossus", "Goblin Lord", "Arion, Tyrant of the Emerald Wrath", "Eldorath, The ancient builder", "Zoranth, The Forgotten One", "Ender Dragon", "Warden", "Sandworm", "Yeti", "Infernal Dragon"]),
    ("loot", "Loot & relics", ["Relics/Artifacts", "How to update Treasure Bags", "Iron Colossus Treasure Bag", "Goblin Lord Treasure Bag", "Arion Treasure Bag", "Eldorath Treasure Bag", "Zoranth Treasure Bag", "Ender Dragon Treasure Bag", "Elder Guardian Treasure Bag", "Elvenite Paladin Treasure Bag", "Vaedric Treasure Bag", "The Bringer of Doom Treasure Bag", "The Calamities Treasure Bag", "Zoranth Newbord of the Zenith Treasure Bag", "Nyxaris The Veil of Oblivion Treasure Bag", "Sanghor Lord of Blood Treasure Bag"]),
    ("mods", "Mods", ["Mod List", "Create Mod", "Ars Nouveau", "Iron’s Spells and Spellbooks"]),
    ("wiki", "About the wiki", ["Linggango Wiki/welcome", "Linggango Wiki/about", "Linggango Wiki/pages", "Linggango Wiki/contribute", "Linggango Wiki/external", "Example character"]),
]
placed = {t for _, _, ts in CATS for t in ts}
missing = [t for t in pages if t not in placed and t not in SKIP and t != "Linggango Wiki"]
if missing:
    print("UNCATEGORISED:", missing)
    CATS[-1][2].extend(missing)

PRE = ["Iron Colossus", "Goblin Lord", "Arion, Tyrant of the Emerald Wrath", "Eldorath, The ancient builder", "Zoranth, The Forgotten One", "Ender Dragon"]
HARD = ["Warden", "Sandworm", "Yeti", "Infernal Dragon"]
BAG_OF = {
    "Iron Colossus": "Iron Colossus Treasure Bag", "Goblin Lord": "Goblin Lord Treasure Bag",
    "Arion, Tyrant of the Emerald Wrath": "Arion Treasure Bag", "Eldorath, The ancient builder": "Eldorath Treasure Bag",
    "Zoranth, The Forgotten One": "Zoranth Treasure Bag", "Ender Dragon": "Ender Dragon Treasure Bag",
}

out_pages = {}
for cat, label, titles in CATS:
    for t in titles:
        if t not in pages: print("MISSING PAGE", t); continue
        body, toc, info, plain = process(t, pages[t])
        slug = title_to_slug[t]
        out_pages[slug] = {
            "slug": slug, "title": norm_title(pages[t]["title"]), "cat": cat,
            "html": body, "toc": toc, "infobox": info, "text": plain,
            "words": len(plain.split()),
        }
        if t in BAG_OF: out_pages[slug]["bag"] = title_to_slug[BAG_OF[t]]
        if t in PRE: out_pages[slug]["tier"] = "pre"; out_pages[slug]["order"] = PRE.index(t)
        if t in HARD: out_pages[slug]["tier"] = "hard"; out_pages[slug]["order"] = HARD.index(t)

# home (Linggango Wiki) kept as raw processed html too, for completeness
body, toc, info, plain = process("Linggango Wiki", pages["Linggango Wiki"])
out_pages["home"] = {"slug": "home", "title": "Linggango Wiki", "cat": "home", "html": body, "toc": toc, "infobox": info, "text": plain, "words": len(plain.split())}


# ---------- derived assets: app icons, small logo, mobile banner ----------
with Image.open(os.path.join(RAW, "images", "Site-logo.png")) as L:
    L = L.convert("RGBA")
    for size, name in ((96, "logo-96.webp"), (192, "icon-192.png"), (512, "icon-512.png")):
        im = L.resize((size, size), Image.LANCZOS)
        if name.endswith(".webp"): im.save(os.path.join(IMG_OUT, name), "WEBP", quality=88)
        else: im.save(os.path.join(IMG_OUT, name), "PNG", optimize=True)
with Image.open(os.path.join(RAW, "images", "Linggango_logo2.jpg")) as B:
    B = B.convert("RGB")
    for w in (900, 1600):
        B.resize((w, round(B.height * w / B.width)), Image.LANCZOS).save(os.path.join(IMG_OUT, f"banner-{w}.webp"), "WEBP", quality=82)

nav = [{"id": c, "label": l, "pages": [title_to_slug[t] for t in ts if t in pages]} for c, l, ts in CATS]
payload = {"pages": out_pages, "nav": nav, "source": "https://linggango.wiki.gg/wiki/", "crawled": "2026-11-17",
           "images": {k: v["src"] for k, v in img_map.items()}}
js = "window.WIKI = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(os.path.join(SITE, "data", "wiki-data.js"), "w", encoding="utf-8").write(js)
print("pages", len(out_pages), "bytes", len(js))
