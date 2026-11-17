# Linggango Wiki — refonte

Copie complète de https://linggango.wiki.gg (52 pages + 32 fichiers), avec une nouvelle interface.

- `site/` — le site, statique. Ouvrir via un serveur local :
  `python -m http.server 5317 --directory site` puis http://localhost:5317
- `raw/` — la capture brute du wiki (`wiki.json` = HTML de chaque page via l'API MediaWiki, `images/` = fichiers originaux).
- `tools/build.py` — convertit `raw/` en `site/data/wiki-data.js` et optimise les images (`python -I tools/build.py`).

Pour mettre à jour le contenu : relancer la capture (script `crawl.py`, voir historique) puis `tools/build.py`.
