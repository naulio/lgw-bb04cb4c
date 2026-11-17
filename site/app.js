/* Linggango Wiki — app (hash router, FR/EN, views, search, settings, exploration progress) */
(function () {
  "use strict";
  const W = window.WIKI;
  const FX = window.FX || new Proxy({}, { get: () => () => 0 });
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $("#app");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = W.pages;
  const HOVER = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mobile = () => innerWidth <= 860;

  /* ---------- storage & settings ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const defLang = /^fr/i.test(navigator.language || "") ? "fr" : "en";
  const settings = Object.assign({ theme: "dark", fx: 2, motion: "auto", size: "m", lang: defLang, font: "titles" }, store.get("lgw.settings", {}));
  const read = new Set(store.get("lgw.read", []));
  const earned = new Set(store.get("lgw.badges", []));

  /* ---------- i18n ---------- */
  const STR = {
    en: {
      search: "Search the wiki", searchPh: n => `Search ${n} pages: bosses, mods, items…`, popular: "Popular", noRes: q => `No page mentions “${q}”.`,
      hintMove: "↑↓ to move", hintOpen: "Enter to open", hintClose: "Esc to close", minRead: "min read", words: "words", original: "Original page",
      prev: "Previous", next: "Next", onPage: "On this page", wrongT: "Found something wrong?", wrongP: "This wiki is collaborative. Improve the page on wiki.gg.",
      edit: "Edit on wiki.gg", read: "Read", explored: "explored", pages: "pages", home: "Home", sections: "sections", drops: "drops", dropsLong: "Drops",
      from: "from", bag: "Treasure bag", droppedBy: "Dropped by", health: "Health", damage: "Damage", attacks: "Types of Attack",
      source: (t) => `Source: ${t} on linggango.wiki.gg. Text and images belong to the wiki's contributors.`,
      foot: d => `Content from the <a href="https://linggango.wiki.gg/" target="_blank" rel="noopener">Linggango wiki on wiki.gg</a>, captured ${d}. Redesigned interface.`,
      allFiles: "All files", aboutWiki: "About the wiki", show: "Show", hide: "Hide", filter: "Filter rows", rows: "rows", table: "Table",
      video: 'YouTube might collect personal data. <a href="https://www.youtube.com/howyoutubeworks/user-settings/privacy/" target="_blank" rel="noopener">Privacy Policy</a>. Tap to load the video.',
      copied: "Link copied", nf: "This page doesn't exist", nfP: a => `“${a}” isn't part of the wiki. Try searching for it.`,
      settings: "Settings", theme: "Theme", themeS: "Night matches the Linggango art. Auto follows your device.", night: "Night", day: "Day", auto: "Auto",
      lang: "Language", langS: "Wiki content and interface.", size: "Text size", sizeS: "Applies to the whole wiki.", font: "Minecraft font", fontS: "Titles only keeps long texts easy to read.",
      fTitles: "Titles", fAll: "Everywhere", effects: "Effects", effectsS: "Soft keeps motion subtle. Full adds confetti for badges.", none: "None", soft: "Soft", full: "Full",
      anim: "Animations", animS: "Auto follows your device's reduced-motion setting.", reduced: "Reduced", tryFx: "Try the effects", reset: "Reset exploration progress",
      resetQ: "Reset your exploration progress and badges?", resetDone: "Progress reset", journey: "Your exploration",
      journeyP: "A page counts as explored once you've read to its end. Stored only in this browser.", ofPages: n => `of ${n} pages`,
      unread: "Explore an unread page", backHome: "Back home", plusOne: "+1 page explored", badge: "Badge earned", preview: "This is how a badge looks.",
      menu: "Menu", bosses: "Bosses", loot: "Loot", toc: "Contents", files: "files", filesP: "Every image and video uploaded to the wiki, stored with this site.",
      video2: "Video file (.mkv) — download", image: "Image", siteIcon: "Site icon", vid: "Video", pre: "Pre-hardmode", hard: "Hardmode",
      roadPre: "The road to diamond", roadHard: "After the curse ring", lists: "Lists", wip: "WIP",
      unwritten: "This page has not been written yet on the wiki. Its treasure bag drops are documented.", seeBag: "See the treasure bag",
      guides: "Guides", bags: "Treasure bags", nBags: n => `${n} bags`, nBosses: n => `${n} bosses`, explore: "Explore by category", exploreP: "Every corner of the wiki, at a glance.",
      continueAt: t => "Continue: " + t, start: "Start with Getting Started", browseBosses: "Browse the bosses", whereTo: "Where do you want to go?",
      exploredN: (n, t) => `You've explored <b>${n}</b> of ${t} pages`, toExplore: t => `${t} pages to explore`, knowEnemies: "Know your enemies",
      knowP: "Each pre-hardmode boss unlocks the next tier of gear. Defeat them in order.", allBosses: "All bosses", inside: "What's inside",
      collab: "Linggango Wiki is a collaborative resource", collabP: "Anyone can edit most pages! All contributions are reviewed to maintain quality and accuracy.",
      dropsFrom: (n, b) => `${n} drops${b ? " · from " + b : ""}`
    },
    fr: {
      search: "Rechercher", searchPh: n => `Chercher dans ${n} pages : boss, mods, objets…`, popular: "Populaires", noRes: q => `Aucune page ne mentionne « ${q} ».`,
      hintMove: "↑↓ pour naviguer", hintOpen: "Entrée pour ouvrir", hintClose: "Échap pour fermer", minRead: "min de lecture", words: "mots", original: "Page d'origine",
      prev: "Précédent", next: "Suivant", onPage: "Sur cette page", wrongT: "Une erreur ?", wrongP: "Ce wiki est collaboratif. Améliorez la page sur wiki.gg (en anglais).",
      edit: "Modifier sur wiki.gg", read: "Lu", explored: "explorées", pages: "pages", home: "Accueil", sections: "sections", drops: "butins", dropsLong: "Butin",
      from: "de", bag: "Sac au trésor", droppedBy: "Lâché par", health: "Points de vie", damage: "Dégâts", attacks: "Types d'attaque",
      source: (t) => `Source : ${t} sur linggango.wiki.gg (traduit de l'anglais). Textes et images appartiennent aux contributeurs du wiki.`,
      foot: d => `Contenu du <a href="https://linggango.wiki.gg/" target="_blank" rel="noopener">wiki Linggango sur wiki.gg</a>, capturé le ${d}, traduit en français. Interface repensée.`,
      allFiles: "Tous les fichiers", aboutWiki: "À propos du wiki", show: "Afficher", hide: "Masquer", filter: "Filtrer", rows: "lignes", table: "Tableau",
      video: 'YouTube peut collecter des données personnelles. <a href="https://www.youtube.com/howyoutubeworks/user-settings/privacy/" target="_blank" rel="noopener">Politique de confidentialité</a>. Touchez pour charger la vidéo.',
      copied: "Lien copié", nf: "Cette page n'existe pas", nfP: a => `« ${a} » ne fait pas partie du wiki. Essayez la recherche.`,
      settings: "Réglages", theme: "Thème", themeS: "Nuit s'accorde avec l'art de Linggango. Auto suit votre appareil.", night: "Nuit", day: "Jour", auto: "Auto",
      lang: "Langue", langS: "Contenu du wiki et interface.", size: "Taille du texte", sizeS: "S'applique à tout le wiki.", font: "Police Minecraft", fontS: "« Titres » garde les longs textes faciles à lire.",
      fTitles: "Titres", fAll: "Partout", effects: "Effets", effectsS: "Doux reste discret. Complet ajoute des confettis pour les badges.", none: "Aucun", soft: "Doux", full: "Complet",
      anim: "Animations", animS: "Auto suit le réglage « réduire les animations » de votre appareil.", reduced: "Réduites", tryFx: "Essayer les effets", reset: "Réinitialiser la progression",
      resetQ: "Réinitialiser votre progression et vos badges ?", resetDone: "Progression réinitialisée", journey: "Votre exploration",
      journeyP: "Une page compte comme explorée une fois lue jusqu'au bout. Enregistré uniquement dans ce navigateur.", ofPages: n => `sur ${n} pages`,
      unread: "Explorer une page non lue", backHome: "Retour à l'accueil", plusOne: "+1 page explorée", badge: "Badge obtenu", preview: "Voici à quoi ressemble un badge.",
      menu: "Menu", bosses: "Boss", loot: "Butin", toc: "Sommaire", files: "fichiers", filesP: "Toutes les images et vidéos du wiki, hébergées avec ce site.",
      video2: "Fichier vidéo (.mkv) — télécharger", image: "Image", siteIcon: "Icône du site", vid: "Vidéo", pre: "Pré-hardmode", hard: "Hardmode",
      roadPre: "La route du diamant", roadHard: "Après l'anneau maudit", lists: "Listes", wip: "En cours",
      unwritten: "Cette page n'a pas encore été écrite sur le wiki. Le butin de son sac au trésor est documenté.", seeBag: "Voir le sac au trésor",
      guides: "Guides", bags: "Sacs au trésor", nBags: n => `${n} sacs`, nBosses: n => `${n} boss`, explore: "Explorer par catégorie", exploreP: "Tout le wiki, en un coup d'œil.",
      continueAt: t => "Continuer : " + t, start: "Commencer par « Bien démarrer »", browseBosses: "Voir les boss", whereTo: "Où voulez-vous aller ?",
      exploredN: (n, t) => `Vous avez exploré <b>${n}</b> pages sur ${t}`, toExplore: t => `${t} pages à explorer`, knowEnemies: "Connaissez vos ennemis",
      knowP: "Chaque boss pré-hardmode débloque le niveau d'équipement suivant. Battez-les dans l'ordre.", allBosses: "Tous les boss", inside: "Au programme",
      collab: "Le wiki Linggango est une ressource collaborative", collabP: "Tout le monde peut modifier la plupart des pages ! Chaque contribution est relue pour garantir qualité et exactitude.",
      dropsFrom: (n, b) => `${n} butins${b ? " · lâché par " + b : ""}`
    }
  };
  let L = STR[settings.lang] || STR.en;
  const CAT_META = {
    en: {
      start: { label: "Start here", nav: "Start", blurb: "Install the pack, survive your first hours and find help when the game won't boot." },
      progression: { label: "Progression", nav: "Progression", blurb: "Quest chapters, progression locks, weapons by tier and how to fight well." },
      bosses: { label: "Bosses", nav: "Bosses", blurb: "Every documented boss in order: stats, attacks, lore, summoning recipe and drops." },
      loot: { label: "Loot & relics", nav: "Loot", blurb: "What each treasure bag drops, and the 80+ charms you can equip." },
      mods: { label: "Mods", nav: "Mods", blurb: "The 450+ mods in the pack, and guides for Create, Ars Nouveau and Iron's Spells." },
      wiki: { label: "About the wiki", nav: "Wiki", blurb: "The pieces of the main page, and how to contribute to the wiki." }
    },
    fr: {
      start: { label: "Bien commencer", nav: "Débuter", blurb: "Installer le pack, survivre aux premières heures et trouver de l'aide quand le jeu ne démarre pas." },
      progression: { label: "Progression", nav: "Progression", blurb: "Chapitres de quêtes, verrous de progression, armes par niveau et conseils de combat." },
      bosses: { label: "Boss", nav: "Boss", blurb: "Tous les boss documentés, dans l'ordre : stats, attaques, lore, invocation et butin." },
      loot: { label: "Butin et reliques", nav: "Butin", blurb: "Le contenu de chaque sac au trésor, et les 80+ charmes à équiper." },
      mods: { label: "Mods", nav: "Mods", blurb: "Les 450+ mods du pack, et des guides pour Create, Ars Nouveau et Iron's Spells." },
      wiki: { label: "À propos du wiki", nav: "Wiki", blurb: "Les morceaux de la page d'accueil, et comment contribuer au wiki." }
    }
  };
  const CM = id => (CAT_META[settings.lang] || CAT_META.en)[id] || { label: id, nav: id, blurb: "" };

  /* page in the current language */
  const pg = s => (settings.lang === "fr" && window.WIKI_FR && window.WIKI_FR[s]) ? Object.assign({}, P[s], window.WIKI_FR[s]) : P[s];

  function applySettings() {
    let t = settings.theme;
    if (t === "auto") t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const R = document.documentElement;
    R.dataset.theme = t; R.dataset.size = settings.size; R.dataset.font = settings.font; R.lang = settings.lang;
    $('meta[name="theme-color"]').content = t === "light" ? "#f5f4f9" : "#0c0a13";
    FX.setLevel(settings.fx); FX.setMotion(settings.motion);
    R.classList.toggle("motion-off", settings.fx === 0 || FX.reduced());
    R.classList.toggle("motion-full", settings.motion === "full");
    L = STR[settings.lang] || STR.en;
    store.set("lgw.settings", settings);
  }
  applySettings();
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => settings.theme === "auto" && applySettings());
  function ensureLang() {
    if (settings.lang !== "fr" || window.WIKI_FR) return Promise.resolve();
    return new Promise(res => { const s = document.createElement("script"); s.src = "data/wiki-fr.js?v=12"; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  }

  /* ---------- icons ---------- */
  const I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    ext: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 5.6A16 16 0 0 0 15.6 4.4l-.5 1a14.8 14.8 0 0 0-6.2 0l-.5-1a16 16 0 0 0-4 1.2C1.9 9.4 1.2 13.1 1.5 16.8a16 16 0 0 0 4.9 2.5l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11.4 11.4 0 0 0 9.6 0l.4.3c-.5.3-1 .6-1.6.8l1 1.6a16 16 0 0 0 4.9-2.5c.4-4.3-.7-8-2.9-11.2zM8.7 14.6c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2zm6.6 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.7 2-1.7 2z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/></svg>'
  };
  const sz = (svg, n) => svg.replace("<svg", `<svg width="${n}" height="${n}"`);

  /* ---------- pixel emblems (12×12, crisp) ---------- */
  const PIX = {
    start: ["............", ".##########.", ".#++++++++#.", ".#+######+#.", ".#++++++++#.", ".#+#####++#.", ".#++++++++#.", ".#+######+#.", ".#++++++++#.", ".##########.", "..--------..", "............"],
    progression: [".........###", "........#++#", ".......#++#.", "......#++#..", ".....#++#...", ".-..#++#....", "..-#++#.....", "...-+#......", "..-.-.......", ".--..-......", "--..........", "-..........."],
    bosses: ["...######...", "..########..", ".##########.", ".##########.", ".#--####--#.", ".#--####--#.", ".##########.", "..####-###..", "...######...", "...#.##.#...", "...######...", "............"],
    loot: ["....####....", ".....##.....", "....#++#....", "...#++++#...", "..#++++++#..", ".#++++++++#.", ".#+++##+++#.", ".#++####++#.", ".#+++##+++#.", ".#++++++++#.", "..########..", "............"],
    mods: [".....##.....", "..#.####.#..", "..########..", ".###----###.", "..##-..-##..", "####-..-####", "####-..-####", "..##-..-##..", ".###----###.", "..########..", "..#.####.#..", ".....##....."],
    wiki: ["..#########.", ".#+++++++++#", ".#+-----+#..", "..#+++++#...", "..#+----#...", "..#+++++#...", "..#+----#...", "..#++++++#..", ".#########+#", "#+++++++++#.", ".#########..", "............"],
    creeper: ["............", "############", "#++++++++++#", "#+--++++--+#", "#+--++++--+#", "#++++--++++#", "#+++----+++#", "#+++----+++#", "#+++-++-+++#", "#++++++++++#", "############", "............"],
    torch: ["............", ".....##.....", "....#++#....", "....#++#....", ".....##.....", ".....--.....", ".....##.....", ".....##.....", ".....##.....", ".....##.....", ".....--.....", "............"],
    potion: ["....####....", ".....##.....", ".....##.....", "....#++#....", "...#++++#...", "..#++++++#..", "..#+####+#..", "..########..", "..########..", "...######...", "....----....", "............"],
    shield: [".##########.", ".#++++++++#.", ".#+######+#.", ".#+######+#.", ".#+######+#.", ".#+######+#.", "..#+####+#..", "..#+####+#..", "...#+##+#...", "....#++#....", ".....##.....", "............"],
    gem: ["............", "...######...", "..#++++++#..", ".#++####++#.", "############", ".##########.", "..########..", "...######...", "....####....", ".....##.....", "............", "............"],
    compass: ["....####....", "..##++++##..", ".#++++#+++#.", ".#+++##+++#.", "#++++##++++#", "#+++####+++#", "#+++-##-+++#", "#++++--++++#", ".#+++--+++#.", ".#++++++++#.", "..##++++##..", "....####...."],
    chat: ["............", ".##########.", "#++++++++++#", "#+########+#", "#++++++++++#", "#+######+++#", "#++++++++++#", ".#########..", ".##.........", ".#..........", "............", "............"],
    chest: ["............", ".##########.", "#++++++++++#", "#++++++++++#", "############", "#+++#--#+++#", "#+++#--#+++#", "#++++++++++#", "#++++++++++#", "############", "............", "............"],
    star: [".....##.....", ".....##.....", "....#++#....", "############", ".#++++++++#.", "..#++++++#..", "...#++++#...", "..#++##++#..", ".#++#..#++#.", ".##......##.", "............", "............"],
    media: ["............", "############", "#++++++++++#", "#+--+++++++#", "#+--++++#++#", "#+++++###++#", "#++#+#####+#", "#+#########+", "#+#########+", "#++++++++++#", "############", "............"]
  };
  function pix(name) {
    const g = PIX[name] || PIX.wiki; let r = "";
    g.forEach((row, y) => [...row].forEach((c, x) => {
      if (c === "#") r += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
      else if (c === "+") r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" opacity=".5"/>`;
      else if (c === "-") r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="#000" opacity=".45"/>`;
    }));
    return `<svg class="pix" viewBox="0 0 12 12" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${r}</svg>`;
  }
  const CAT_TONE = { start: "#5ad1a8", progression: "#7fb4ff", bosses: "#9479ff", loot: "#f5b83d", mods: "#ff9a6b", wiki: "#ff7ab6", media: "#c9b8ff", home: "#9479ff" };
  const toneBg = c => `color-mix(in srgb, ${c} 42%, transparent)`;
  const EMB = { "beginners-guide": "compass", "beginner-s-guide": "start", "issues-booting-up-the-game": "creeper", "tips": "torch", "discord": "chat", "quest-chapters": "start",
    "weapon-progression": "progression", "magic-progression": "potion", "tech-progression": "mods", "combat-guide": "shield", "misc": "chest", "relics-artifacts": "gem",
    "how-to-update-treasure-bags": "mods", "ars-nouveau": "star", "iron-s-spells-and-spellbooks": "potion", "example-character": "bosses", "create-mod": "mods" };
  const emb = s => EMB[s] || (P[s] ? P[s].cat : "wiki");

  /* ---------- data helpers ---------- */
  const ORDER = W.nav.flatMap(c => c.pages);
  const ALL = ORDER.filter(s => P[s]);
  const TOTAL = ALL.length;
  const TONES = {
    "iron-colossus": "rgba(140,170,210,.45)", "goblin-lord": "rgba(245,184,61,.45)", "arion-tyrant-of-the-emerald-wrath": "rgba(70,210,130,.42)",
    "eldorath-the-ancient-builder": "rgba(220,160,90,.42)", "zoranth-the-forgotten-one": "rgba(160,110,255,.48)", "ender-dragon": "rgba(190,90,255,.45)",
    "warden": "rgba(40,190,200,.42)", "sandworm": "rgba(230,190,110,.42)", "yeti": "rgba(150,210,255,.45)", "infernal-dragon": "rgba(255,90,60,.45)"
  };
  const UNWRITTEN = [
    { name: "Vaedric, the Fallen Wanderer", bag: "vaedric-treasure-bag" },
    { name: "The Bringer of Doom", bag: "the-bringer-of-doom-treasure-bag" },
    { name: "The Calamities", bag: "the-calamities-treasure-bag" },
    { name: "Zoranth, Newborn of the Zenith", bag: "zoranth-newbord-of-the-zenith-treasure-bag" },
    { name: "Nyxaris, the Veil of Oblivion", bag: "nyxaris-the-veil-of-oblivion-treasure-bag" }
  ];
  const BOSSES = ALL.filter(s => P[s].tier).sort((a, b) => (P[a].tier === P[b].tier ? P[a].order - P[b].order : P[a].tier === "pre" ? -1 : 1));
  const BAGS = ALL.filter(s => /treasure-bag$/.test(s));
  const bossOfBag = {}; BOSSES.forEach(b => { if (P[b].bag) bossOfBag[P[b].bag] = b; });
  const bossName = b => (P[b].infobox && P[b].infobox.title) || P[b].title;
  const parser = new DOMParser();
  const docCache = {};
  const docOf = s => { const k = settings.lang + s; return docCache[k] || (docCache[k] = parser.parseFromString(`<div>${pg(s).html}</div>`, "text/html").body.firstChild); };
  function excerpt(s, n) {
    const d = docOf(s);
    const el = $$("p, li", d).find(e => e.textContent.trim().length > 40 && !e.closest("table"));
    let t = (el ? el.textContent : pg(s).text).replace(/\s+/g, " ").trim();
    n = n || 150;
    return t.length > n ? t.slice(0, n).replace(/\s\S*$/, "") + "…" : t;
  }
  function firstImage(s) {
    if (P[s].infobox && P[s].infobox.image) return P[s].infobox.image;
    const im = $("img", docOf(s));
    return im ? im.getAttribute("src") : null;
  }
  function stat(s, label) {
    const ib = P[s].infobox; if (!ib) return null;
    for (const sec of ib.sections) for (const r of sec.rows) if (r.label === label) return r.value;
    return null;
  }
  function attacks(s) {
    const ib = pg(s).infobox; if (!ib) return [];
    const sec = ib.sections.find((x, i) => /attack|attaque/i.test(x.name)); if (!sec) return [];
    const out = [];
    sec.rows.forEach((r, i) => { const en = P[s].infobox.sections.find(x => /attack/i.test(x.name)).rows[i].label; if (/^attack/i.test(en)) out.push({ name: r.value, desc: "" }); else if (out.length) out[out.length - 1].desc = r.value; });
    return out;
  }
  const bagItems = s => $$("tr", docOf(s)).slice(1).map(tr => (tr.cells[0] ? tr.cells[0].textContent.trim() : "")).filter(Boolean);
  const minutes = s => Math.max(1, Math.round(pg(s).words / 220));
  const original = s => W.source + encodeURIComponent((s === "home" ? "Linggango Wiki" : P[s].title).replace(/ /g, "_")).replace(/%2F/g, "/").replace(/%2C/g, ",");
  const T = s => pg(s).title;

  /* ---------- chrome: nav, tab bar ---------- */
  function drawChrome() {
    $("#topnav").innerHTML = W.nav.filter(c => c.id !== "wiki").map(c => `<a href="#/c/${c.id}" data-cat="${c.id}">${esc(CM(c.id).nav)}</a>`).join("");
    $("#searchBtn span").textContent = L.search;
    $("#langBtn").textContent = settings.lang === "fr" ? "FR" : "EN";
    $("#langBtn").setAttribute("aria-label", settings.lang === "fr" ? "Switch to English" : "Passer en français");
    $("#tabbar").innerHTML = `
      <a href="#/" data-tab="home">${I.home}<span>${L.home}</span></a>
      <a href="#/c/bosses" data-tab="bosses">${pix("bosses")}<span>${L.bosses}</span></a>
      <button type="button" data-tab="search" id="tabSearch">${I.search}<span>${L.search.split(" ")[0]}</span></button>
      <a href="#/c/loot" data-tab="loot">${pix("loot")}<span>${L.loot}</span></a>
      <button type="button" data-tab="menu" id="tabMenu">${I.menu}<span>${L.menu}</span></button>`;
    $("#tabSearch").onclick = openSearch;
    $("#tabMenu").onclick = openDrawer;
    markTabs();
  }
  function markTabs() {
    const { a, b } = parseHash();
    const cat = P[a] ? P[a].cat : a === "c" ? b : "";
    $$("#topnav a").forEach(n => n.setAttribute("aria-current", String(n.dataset.cat === cat)));
    $$("#tabbar [data-tab]").forEach(n => n.setAttribute("aria-current", String((n.dataset.tab === "home" && !a) || n.dataset.tab === cat)));
  }

  /* ---------- journey ---------- */
  const BADGES = [
    { id: "first", name: { en: "First steps", fr: "Premiers pas" }, test: () => read.has("getting-started"), sub: { en: "You read Getting Started.", fr: "Vous avez lu « Bien démarrer »." } },
    { id: "ten", name: { en: "Wanderer", fr: "Vagabond" }, test: () => read.size >= 10, sub: { en: "10 pages explored.", fr: "10 pages explorées." } },
    { id: "bestiary", name: { en: "Bestiary", fr: "Bestiaire" }, test: () => BOSSES.every(b => read.has(b)), sub: { en: "Every boss page studied.", fr: "Toutes les pages de boss étudiées." }, big: true },
    { id: "loot", name: { en: "Treasure hunter", fr: "Chasseur de trésors" }, test: () => BAGS.every(b => read.has(b)), sub: { en: "Every treasure bag opened.", fr: "Tous les sacs au trésor ouverts." }, big: true },
    { id: "mods", name: { en: "Tinkerer", fr: "Bricoleur" }, test: () => W.nav.find(c => c.id === "mods").pages.every(b => read.has(b)), sub: { en: "All mod guides read.", fr: "Tous les guides de mods lus." } },
    { id: "half", name: { en: "Cartographer", fr: "Cartographe" }, test: () => read.size >= Math.ceil(TOTAL / 2), sub: { en: "Half of the wiki explored.", fr: "La moitié du wiki explorée." } },
    { id: "all", name: { en: "Completionist", fr: "Complétionniste" }, test: () => ALL.every(b => read.has(b)), sub: { en: "You explored the whole wiki.", fr: "Vous avez exploré tout le wiki." }, big: true }
  ];
  const lg = o => o[settings.lang] || o.en;
  function updateJourney(animate) {
    const ring = $("#journeyRing"), c = 2 * Math.PI * 14, n = ALL.filter(s => read.has(s)).length;
    ring.style.strokeDasharray = c; ring.style.strokeDashoffset = c * (1 - n / TOTAL);
    $("#journeyTxt").textContent = `${n}/${TOTAL}`;
    if (animate) FX.pop($("#journeyBtn"), 1.12);
  }
  function markRead(s) {
    if (!P[s] || s === "home" || read.has(s)) return;
    read.add(s); store.set("lgw.read", [...read]);
    updateJourney(true);
    FX.nudge($("#journeyBtn"), L.plusOne, { color: "var(--gold)" });
    $$(`a[href="#/${s}"]`).forEach(a => a.classList.add("is-read"));
    let delay = 900;
    BADGES.forEach(b => {
      if (!earned.has(b.id) && b.test()) {
        earned.add(b.id); store.set("lgw.badges", [...earned]);
        setTimeout(() => {
          FX.achievement(L.badge + " · " + lg(b.name), lg(b.sub), { color: "#f5b83d" });
          if (b.big) FX.confetti({ count: mobile() ? 90 : 140 });
          if (navigator.vibrate && FX.can("soft")) try { navigator.vibrate(12); } catch (e) {}
        }, delay);
        delay += 4800;
      }
    });
  }

  /* ---------- router ---------- */
  let current = { key: null };
  function parseHash() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [a, b] = h.split("/");
    return { a: a || "", b: b || "" };
  }
  function route(force) {
    const { a, b } = parseHash();
    closeOverlays();
    let key;
    if (!a || a === "home") key = "home";
    else if (a === "c") key = "c/" + b;
    else if (a === "media") key = "media";
    else key = a;
    if (!force && key === current.key && P[a]) { if (b) scrollToId(b); else window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    current = { key };
    stopScrollWatch();
    if (key === "home") renderHome();
    else if (key.startsWith("c/")) renderHub(b);
    else if (key === "media") renderMedia();
    else if (P[a]) renderArticle(a, b);
    else renderNotFound(a);
    markTabs();
    if (!b || !P[a]) window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", () => route());
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const tabPanel = el.closest(".tab-panel[hidden]");
    if (tabPanel) { const tabs = tabPanel.parentElement; const i = $$(".tab-panel", tabs).indexOf(tabPanel); $$(".tabs-bar button", tabs)[i].click(); }
    const wrap = el.closest(".table-wrap.closed"); if (wrap) $(".toggle-rows", wrap).click();
    el.scrollIntoView({ behavior: FX.reduced() ? "auto" : "smooth", block: "start" });
  }
  const setTitle = t => { document.title = t ? `${t} · Linggango Wiki` : "Linggango Wiki"; };

  /* ---------- tile (boss-card style, used everywhere) ---------- */
  function tile(o) {
    const visual = o.img
      ? `<img src="${o.img}" alt="" loading="lazy" decoding="async">`
      : `<span class="emblem" style="color:${o.color}">${pix(o.glyph)}</span>`;
    return `<a class="card tile ${o.cls || ""} ${o.img ? "" : "no-img"}" href="${o.href}" style="--tone:${o.tone}">
      <div class="portrait">${o.num != null ? `<span class="n">${esc(o.num)}</span>` : ""}${o.badge || ""}${visual}</div>
      <div class="body"><h3>${esc(o.title)}</h3>
        ${o.stats && o.stats.length ? `<div class="nums">${o.stats.map(x => `<div class="${x.cls || ""}"><b>${esc(x.v)}</b><small>${esc(x.l)}</small></div>`).join("")}</div>` : ""}
        ${o.text ? `<div class="unlock">${esc(o.text)}</div>` : ""}
        ${o.items ? `<div class="items">${o.items}</div>` : ""}
        <div class="bag">${o.foot || ""}${o.read ? ` <span class="chip read">${L.read}</span>` : ""}</div>
      </div></a>`;
  }
  function pageTile(s, i) {
    const p = pg(s), img = (P[s].infobox && P[s].infobox.image) || null, c = CAT_TONE[P[s].cat];
    return tile({ href: "#/" + s, tone: toneBg(c), color: c, img, glyph: emb(s), num: String(i).padStart(2, "0"), title: p.title, cls: img ? "wide" : "",
      stats: [{ v: minutes(s), l: L.minRead.split(" ")[0] }, { v: p.toc.length || "—", l: L.sections, cls: "dmg" }],
      text: excerpt(s, 110), read: read.has(s) });
  }
  function bossTile(s, i) {
    const hp = stat(s, "Health"), dmg = stat(s, "Damage"), wip = P[s].toc.some(t => t.text === "WIP");
    return tile({ href: "#/" + s, tone: TONES[s], img: P[s].infobox.image, num: String(i).padStart(2, "0"), title: bossName(s), cls: "boss",
      badge: wip ? `<span class="chip gold wip">${L.wip}</span>` : "",
      stats: [hp && { v: hp, l: L.health, cls: "hp" }, dmg && { v: dmg, l: L.damage, cls: "dmg" }].filter(Boolean),
      text: excerpt(s, 95), foot: P[s].bag ? L.bag : "", read: read.has(s) });
  }
  function bagTile(s, i) {
    const items = bagItems(s), boss = bossOfBag[s], c = CAT_TONE.loot;
    return tile({ href: "#/" + s, tone: boss ? TONES[boss] : toneBg(c), color: c, img: boss ? P[boss].infobox.image : null, glyph: "loot", cls: "bagt", num: String(i).padStart(2, "0"),
      badge: boss ? `<span class="bag-badge" style="color:${c}">${pix("loot")}</span>` : "",
      title: T(s), stats: [{ v: items.length, l: L.drops, cls: "dmg" }],
      items: items.slice(0, 4).map(x => `<span>${esc(x)}</span>`).join("") + (items.length > 4 ? `<span>+${items.length - 4}</span>` : ""),
      foot: boss ? `${L.droppedBy} ${esc(bossName(boss))}` : "", read: read.has(s) });
  }
  function catTile(c, i) {
    const n = c.pages.length, d = c.pages.filter(s => read.has(s)).length, col = CAT_TONE[c.id];
    return tile({ href: "#/c/" + c.id, tone: toneBg(col), color: col, glyph: c.id, num: String(i).padStart(2, "0"), title: CM(c.id).label, cls: "cat",
      stats: [{ v: n, l: L.pages }, { v: d, l: L.explored, cls: "dmg" }], text: CM(c.id).blurb });
  }

  /* ---------- HOME ---------- */
  const HOME = {
    en: {
      title: 'Transform Minecraft into an <span class="accent-word" id="accentWord">Epic Adventure</span>',
      lead: "Experience Minecraft 1.20.1 like never before in this Terraria-inspired modpack! <b>Linggango</b> combines magic, technology, and exploration into an epic adventure. Whether you're a newcomer or veteran player, our comprehensive wiki guides you through every aspect of this incredible journey.",
      version: "Latest Version", stats: ["Mods", "Quests", "Bosses"], useful: "Useful wiki pages",
      groups: [["New Players", "Start here for setup and basics", [["getting-started", "Installation and first steps", "I"], ["beginners-guide", "Your first few hours", "II"]]],
        ["Core Content", "Key resources and references", [["quest-chapters", "All 2300+ quests organized", "Q"], ["mod-list", "Complete list of 450+ mods", "M"], ["boss-list", "Information on all the bosses", "B"]]],
        ["Progression Paths", "Long-term advancement", [["magic-progression", "Ars Nouveau and magical mods", "✦"], ["tech-progression", "Create, Industrial Foregoing, automation", "⚙"], ["combat-guide", "Weapons, armor, and tactics", "⚔"]]]],
      aboutE: "About Linggango", aboutH: "An all-in-one Terraria-inspired modpack", aboutP: "Designed for every type of player. Perfect for those who enjoy structured progression, challenging combat, and endless creativity!",
      pillars: [["About1.webp", "85+ Unique Bosses", "Challenging encounters with epic rewards"], ["About2.webp", "Multiple Progression Paths", "Magic (Ars Nouveau), Tech (Create), Adventure"], ["About3.webp", "450+ Carefully Selected Mods", "Magic, tech, exploration, and quality of life"]],
      ticks: ["<b>450+ Carefully Selected Mods</b> – Magic, tech, exploration, and quality of life", "<b>2300+ Integrated Quests</b> – Structured progression through FTB Quests", "<b>85+ Unique Bosses</b> – Challenging encounters with epic rewards", "<b>Deep Integration</b> – Mods work together, not separately", "<b>Multiple Progression Paths</b> – Magic (Ars Nouveau), Tech (Create), Adventure"],
      connectE: "Connect With Us", connectH: "Join the Linggango Community!", connectP: "Connect, share, and explore together!", cf: "Download modpack &amp; view updates", dc: "Chat &amp; support, live community",
      contribE: "Contribute to the wiki", easy: "Easy Ways to Contribute", bigger: "Bigger Contributions",
      easyL: ["Fix typos and errors – Every correction helps!", "Add screenshots – Visual guides are incredibly helpful", "Share strategies – Your unique approaches help others", "Report missing info – Let us know what's incomplete"],
      bigL: ["Write mod guides – Detailed tutorials for specific mods", "Document quest lines – Step-by-step quest walkthroughs", "Create build showcases – Show off amazing creations", "Boss strategy guides – Share your winning tactics"],
      thanks: "Your contributions, big or small, help the wiki grow and support the community!"
    },
    fr: {
      title: 'Transformez Minecraft en <span class="accent-word" id="accentWord">aventure épique</span>',
      lead: "Découvrez Minecraft 1.20.1 comme jamais avec ce modpack inspiré de Terraria ! <b>Linggango</b> réunit magie, technologie et exploration dans une aventure épique. Que vous débutiez ou soyez un vétéran, notre wiki complet vous guide à chaque étape de cet incroyable voyage.",
      version: "Dernière version", stats: ["Mods", "Quêtes", "Boss"], useful: "Pages utiles du wiki",
      groups: [["Nouveaux joueurs", "Commencez ici pour l'installation et les bases", [["getting-started", "Installation et premiers pas", "I"], ["beginners-guide", "Vos premières heures", "II"]]],
        ["Contenu essentiel", "Ressources et références clés", [["quest-chapters", "Les 2300+ quêtes organisées", "Q"], ["mod-list", "La liste complète des 450+ mods", "M"], ["boss-list", "Informations sur tous les boss", "B"]]],
        ["Voies de progression", "Avancement à long terme", [["magic-progression", "Ars Nouveau et mods de magie", "✦"], ["tech-progression", "Create, Industrial Foregoing, automatisation", "⚙"], ["combat-guide", "Armes, armures et tactiques", "⚔"]]]],
      aboutE: "À propos de Linggango", aboutH: "Un modpack tout-en-un inspiré de Terraria", aboutP: "Pensé pour tous les types de joueurs. Parfait pour ceux qui aiment une progression structurée, des combats exigeants et une créativité sans limites !",
      pillars: [["About1.webp", "85+ boss uniques", "Des affrontements exigeants aux récompenses épiques"], ["About2.webp", "Plusieurs voies de progression", "Magie (Ars Nouveau), Tech (Create), Aventure"], ["About3.webp", "450+ mods soigneusement choisis", "Magie, technologie, exploration et confort de jeu"]],
      ticks: ["<b>450+ mods soigneusement choisis</b> – Magie, technologie, exploration et confort de jeu", "<b>2300+ quêtes intégrées</b> – Une progression structurée avec FTB Quests", "<b>85+ boss uniques</b> – Des affrontements exigeants aux récompenses épiques", "<b>Intégration poussée</b> – Les mods fonctionnent ensemble, pas chacun de leur côté", "<b>Plusieurs voies de progression</b> – Magie (Ars Nouveau), Tech (Create), Aventure"],
      connectE: "Nous rejoindre", connectH: "Rejoignez la communauté Linggango !", connectP: "Échangez, partagez et explorez ensemble !", cf: "Télécharger le modpack et voir les mises à jour", dc: "Discussion et entraide, communauté en direct",
      contribE: "Contribuer au wiki", easy: "Contributions faciles", bigger: "Contributions plus importantes",
      easyL: ["Corriger les fautes et erreurs – Chaque correction compte !", "Ajouter des captures d'écran – Les guides visuels sont extrêmement utiles", "Partager des stratégies – Vos approches aident les autres", "Signaler des infos manquantes – Dites-nous ce qui est incomplet"],
      bigL: ["Écrire des guides de mods – Tutoriels détaillés pour des mods précis", "Documenter des lignes de quêtes – Solutions pas à pas", "Présenter des constructions – Montrez vos créations incroyables", "Guides de stratégie contre les boss – Partagez vos tactiques gagnantes"],
      thanks: "Vos contributions, petites ou grandes, font grandir le wiki et soutiennent la communauté !"
    }
  };
  function pathLink(slug, desc, i) {
    return `<a class="path-link ${read.has(slug) ? "is-read" : ""}" href="#/${slug}"><span class="num">${i}</span><span><b>${esc(T(slug))}</b><small>${esc(desc)}</small></span><span class="arrow">${sz(I.arrow, 18)}</span></a>`;
  }
  function renderHome() {
    setTitle("");
    const H = HOME[settings.lang] || HOME.en;
    const n = ALL.filter(s => read.has(s)).length;
    const next = ["getting-started", "beginners-guide", "quest-chapters", "boss-list", "weapon-progression"].find(s => !read.has(s));
    app.innerHTML = `<div class="view home">
      <section class="home-hero">
        <article class="card hero" id="hero">
          <div class="hero-banner"><img src="assets/img/banner-1600.webp" srcset="assets/img/banner-900.webp 900w, assets/img/banner-1600.webp 1600w" sizes="(max-width: 1080px) 100vw, 55vw" alt="Linggango — All-in-one" width="1600" height="347" fetchpriority="high"></div>
          <div class="hero-body">
            <div class="version-line"><span class="dot"></span><span>${H.version} : <b>4.3.0</b></span><span class="sep">·</span><span>Minecraft 1.20.1 | Forge 47.2.0+</span></div>
            <h1 id="heroTitle">${H.title}</h1>
            <p class="lead">${H.lead}</p>
            <div class="hero-ctas">
              <a class="btn primary" id="heroCta" href="#/${next || "getting-started"}">${next && next !== "getting-started" ? esc(L.continueAt(T(next))) : esc(L.start)} ${I.arrow}</a>
              <a class="btn" href="#/c/bosses">${L.browseBosses}</a>
            </div>
            <div class="stats">${[450, 2300, 85].map((v, i) => `<div class="stat"><b data-count="${v}">${v}+</b><span>${H.stats[i]}</span></div>`).join("")}</div>
          </div>
        </article>
        <aside class="card paths">
          <div><span class="eyebrow accent">${H.useful}</span><h2>${L.whereTo}</h2></div>
          ${H.groups.map(([g, gd, links]) => `<div class="path-group"><span class="eyebrow">${g} <i>${gd}</i></span>${links.map(l => pathLink(...l)).join("")}</div>`).join("")}
          <div class="paths-foot"><span>${n ? L.exploredN(n, TOTAL) : L.toExplore(TOTAL)}</span><button class="btn sm" id="openSearch2">${sz(I.search, 15)} ${L.search}</button></div>
        </aside>
      </section>

      <section class="band reveal">
        <div class="band-head"><div><span class="eyebrow accent">${L.explore}</span><h2>${L.exploreP}</h2></div></div>
        <div class="tile-grid cats">${W.nav.map((c, i) => catTile(c, i + 1)).join("")}</div>
      </section>

      <section class="band reveal">
        <div class="band-head"><div><span class="eyebrow accent">${L.bosses}</span><h2>${L.knowEnemies}</h2><p>${L.knowP}</p></div><a class="btn sm" href="#/c/bosses">${L.allBosses} ${I.arrow}</a></div>
        <div class="boss-strip">${BOSSES.map((b, i) => `<a class="boss-mini" href="#/${b}" style="--tone:${TONES[b] || ""}"><span class="step">${String(i + 1).padStart(2, "0")}</span><div class="portrait"><img src="${P[b].infobox.image}" alt="" loading="lazy" decoding="async"></div><div class="meta"><b>${esc(bossName(b))}</b><small>${P[b].tier === "pre" ? L.pre : L.hard}${stat(b, "Health") ? " · " + esc(stat(b, "Health")) + " PV".replace("PV", settings.lang === "fr" ? "PV" : "HP") : ""}</small></div></a>`).join("")}</div>
      </section>

      <section class="band reveal">
        <div class="band-head"><div><span class="eyebrow accent">${H.aboutE}</span><h2>${H.aboutH}</h2><p>${H.aboutP}</p></div></div>
        <div class="pillars">${H.pillars.map(([f, t, d]) => `<div class="card pillar"><button class="zoom" data-src="assets/img/${f}" aria-label="${esc(t)}"><img src="assets/img/${f}" alt="${esc(t)}" loading="lazy" decoding="async"></button><div class="txt"><b>${t}</b><p>${d}</p></div></div>`).join("")}</div>
      </section>

      <section class="band split reveal">
        <div class="card prose-card"><span class="eyebrow accent">Linggango</span><h3>${L.inside}</h3><ul class="ticks">${H.ticks.map(x => `<li>${x}</li>`).join("")}</ul></div>
        <div class="card prose-card"><span class="eyebrow accent">${H.connectE}</span><h3>${H.connectH}</h3><p>${H.connectP}</p>
          <div class="connect">
            <a href="https://www.curseforge.com/minecraft/modpacks/lingango" target="_blank" rel="noopener"><span class="logo" style="background:#f16436">${I.flame}</span><span><b>CurseForge</b><small>${H.cf}</small></span>${I.ext}</a>
            <a href="https://discord.gg/linggango" target="_blank" rel="noopener"><span class="logo" style="background:#5865f2">${I.discord}</span><span><b>Discord</b><small>${H.dc}</small></span>${I.ext}</a>
          </div></div>
      </section>

      <section class="band reveal">
        <div class="card prose-card"><span class="eyebrow accent">${H.contribE}</span><h3>${L.collab}</h3><p>${L.collabP}</p>
          <div class="cols"><div><b>${H.easy}</b><ul class="ticks">${H.easyL.map(x => `<li>${x}</li>`).join("")}</ul></div><div><b>${H.bigger}</b><ul class="ticks">${H.bigL.map(x => `<li>${x}</li>`).join("")}</ul></div></div>
          <p style="margin-top:1rem">${H.thanks}</p>
          <div style="margin-top:1rem;display:flex;gap:.6rem;flex-wrap:wrap"><a class="btn sm" href="https://linggango.wiki.gg/wiki/Linggango_Wiki" target="_blank" rel="noopener">${L.edit} ${I.ext}</a><a class="btn sm ghost" href="#/c/wiki">${L.aboutWiki}</a></div>
        </div>
      </section>
      ${footer()}
    </div>`;
    const acc = $("#accentWord");
    FX.wordsIn($("#heroTitle"));
    acc.textContent = acc.textContent; /* gradient stays on one element */
    acc.style.display = "inline-block";
    if (FX.can("soft") && !FX.reduced()) acc.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 560, delay: 400, easing: "cubic-bezier(.2,.7,.2,1)", fill: "backwards" });
    setTimeout(() => FX.shimmer(acc), 1100);
    $$(".stat b").forEach((b, i) => setTimeout(() => FX.countUp(b, +b.dataset.count, { suffix: "+", duration: 1200 }), 250 + i * 120));
    if (HOVER) FX.spotlight($("#hero"));
    FX.stagger($$(".path-link"), { y: 8, step: 45 });
    setTimeout(() => { const c = $("#heroCta"); if (c) FX.breathe(c); }, 2600);
    if (HOVER) $$(".boss-mini, .pillar, .tile").forEach(el => FX.tilt(el, { max: 3 }));
    $("#openSearch2").onclick = openSearch;
    bindZoom(app);
    watchReveal(app, el => FX.stagger($$(".tile", el), { y: 12, step: 50 }));
  }
  const footer = () => `<footer class="foot"><span>${L.foot(esc(W.crawled))}</span><span><a href="#/media">${L.allFiles}</a> · <a href="#/c/wiki">${L.aboutWiki}</a> · <button class="linkish" data-lang-toggle>${settings.lang === "fr" ? "English version" : "Version française"}</button></span></footer>`;

  /* ---------- HUBS ---------- */
  function renderHub(cat) {
    const c = W.nav.find(x => x.id === cat);
    if (!c) return renderNotFound("c/" + cat);
    const m = CM(cat); setTitle(m.label);
    let body;
    if (cat === "bosses") body = bossesHub();
    else if (cat === "loot") body = lootHub(c);
    else body = `<div class="tile-grid">${c.pages.map((s, i) => pageTile(s, i + 1)).join("")}</div>`;
    const done = c.pages.filter(s => read.has(s)).length, col = CAT_TONE[cat];
    app.innerHTML = `<div class="view hub">
      <header class="hub-head card" style="--tone:${toneBg(col)}"><span class="hub-emblem" style="color:${col}">${pix(cat)}</span><div><span class="eyebrow accent">${c.pages.length} ${L.pages}</span><h1>${esc(m.label)}</h1><p>${esc(m.blurb)}</p></div>
      <div class="hub-count"><b>${done}</b><small>/ ${c.pages.length} ${L.explored}</small></div></header>
      ${body}${footer()}</div>`;
    FX.stagger($$(".tile"), { y: 12, step: 35 });
    if (HOVER) $$(".tile").forEach(el => FX.tilt(el, { max: 3 }));
  }
  function bossesHub() {
    const pre = BOSSES.filter(b => P[b].tier === "pre"), hard = BOSSES.filter(b => P[b].tier === "hard");
    return `<div class="lists-line">${L.lists} : <a class="chip" href="#/boss-list">${esc(T("boss-list"))}</a><a class="chip" href="#/boss-list-pre-hardmode">${L.pre}</a><a class="chip" href="#/boss-list-hardmode">${L.hard}</a></div>
      <section class="tier"><div class="tier-head"><span class="chip pre">${L.pre}</span><h2>${L.roadPre}</h2><span>${L.nBosses(pre.length)}</span></div>
        <div class="tile-grid">${pre.map((b, i) => bossTile(b, i + 1)).join("")}</div></section>
      <section class="tier"><div class="tier-head"><span class="chip hard">${L.hard}</span><h2>${L.roadHard}</h2><span>${L.nBosses(hard.length + UNWRITTEN.length)}</span></div>
        <div class="tile-grid">${hard.map((b, i) => bossTile(b, pre.length + i + 1)).join("")}
        ${UNWRITTEN.map((u, i) => `<a class="card tile unwritten" href="#/${u.bag}"><div class="portrait"><span class="n">${String(pre.length + hard.length + i + 1).padStart(2, "0")}</span></div><div class="body"><h3>${esc(u.name)}</h3><div class="unlock">${L.unwritten}</div><div class="bag">${L.seeBag} →</div></div></a>`).join("")}
        </div></section>`;
  }
  function lootHub(c) {
    const guides = c.pages.filter(s => !/treasure-bag$/.test(s));
    return `<div class="tile-grid" style="margin-bottom:2.4rem">${guides.map((s, i) => pageTile(s, i + 1)).join("")}</div>
      <div class="tier-head"><span class="chip gold">${L.loot}</span><h2>${L.bags}</h2><span>${L.nBags(BAGS.length)}</span></div>
      <div class="tile-grid">${BAGS.map((s, i) => bagTile(s, i + 1)).join("")}</div>`;
  }

  /* ---------- MEDIA ---------- */
  function renderMedia() {
    setTitle(L.allFiles);
    const seen = new Set();
    const files = Object.entries(W.images).filter(([k, v]) => { if (seen.has(v) || k.includes(" ")) return false; seen.add(v); return true; });
    app.innerHTML = `<div class="view">
      <header class="hub-head card" style="--tone:${toneBg(CAT_TONE.media)}"><span class="hub-emblem" style="color:${CAT_TONE.media}">${pix("media")}</span><div><span class="eyebrow accent">${files.length} ${L.files}</span><h1>${L.allFiles}</h1><p>${L.filesP}</p></div></header>
      <div class="media-grid">${files.map(([name, src]) => {
        const video = /\.(mkv|mp4|webm)$/i.test(src), ico = /\.ico$/i.test(src);
        return `<div class="card media-item">${video ? `<a class="frame" href="${src}" download style="color:var(--text-2);font-size:.85rem;text-align:center">${sz(I.play, 36)}<br>${L.video2}</a>` : `<button class="frame ${/\.(png|ico)$/i.test(src) ? "pixel" : ""}" data-src="${src}" aria-label="${esc(name)}"><img src="${src}" alt="${esc(name)}" loading="lazy" decoding="async"></button>`}<b>${esc(name.replace(/_/g, " "))}</b><small>${ico ? L.siteIcon : video ? L.vid : L.image}</small></div>`;
      }).join("")}</div>${footer()}</div>`;
    bindZoom(app);
    FX.stagger($$(".media-item"), { y: 10, step: 25 });
  }
  function renderNotFound(a) {
    setTitle(L.nf);
    app.innerHTML = `<div class="view"><header class="hub-head card"><span class="hub-emblem" style="color:var(--text-3)">${pix("bosses")}</span><div><span class="eyebrow accent">404</span><h1>${L.nf}</h1><p>${esc(L.nfP(a))}</p></div></header><button class="btn primary" id="nfSearch">${sz(I.search, 16)} ${L.search}</button></div>`;
    $("#nfSearch").onclick = openSearch;
  }

  /* ---------- ARTICLE ---------- */
  function sideNav(slug) {
    const cat = P[slug] ? P[slug].cat : "";
    return `<nav class="sidenav" aria-label="Pages">${W.nav.map(c => `<details ${c.id === cat ? "open" : ""}><summary><span class="sn-emb" style="color:${CAT_TONE[c.id]}">${pix(c.id)}</span><span>${esc(CM(c.id).label)}</span><span class="cnt">${I.chev}</span></summary><ul>${c.pages.map(s => `<li><a href="#/${s}" class="${read.has(s) ? "is-read" : ""}" ${s === slug ? 'aria-current="page"' : ""}>${esc(T(s))}</a></li>`).join("")}</ul></details>`).join("")}<a class="media-link" href="#/media">${L.allFiles}</a></nav>`;
  }
  function infoboxHtml(s) {
    const ib = pg(s).infobox; if (!ib) return "";
    if (ib.kind === "boss" || ib.kind === "modpack") return "";
    return `<div class="card infobox">${ib.title ? `<div class="eyebrow" style="margin-bottom:.5rem">${esc(ib.title)}</div>` : ""}${ib.image ? `<button class="ib-img" data-src="${ib.image}" aria-label="${esc(ib.title || "")}"><img src="${ib.image}" alt=""></button>` : ""}
      <dl>${ib.sections.map(sec => `${sec.name ? `<div class="sec">${esc(sec.name)}</div>` : ""}${sec.rows.map(r => `<div class="r"><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join("")}`).join("")}</dl></div>`;
  }
  function heroShell(s, portrait, stats, extra, actions, tone) {
    return `<section class="card boss-hero" style="--tone:${tone}">
      ${portrait}
      <div class="info">
        <div class="big-stats">${stats.map(x => `<div class="big-stat ${x.cls || ""}"><b ${x.count ? `data-count="${x.count}"` : ""}>${esc(x.v)}</b><span>${esc(x.l)}</span></div>`).join("")}</div>
        ${extra || ""}
        ${actions ? `<div class="boss-nav">${actions}</div>` : ""}
      </div></section>`;
  }
  function pageHero(s) {
    const p = pg(s), ib = p.infobox, cat = P[s].cat, col = CAT_TONE[cat];
    const catPages = W.nav.find(c => c.id === cat).pages, idx = catPages.indexOf(s), prev = catPages[idx - 1], next = catPages[idx + 1];
    const navBtns = (prev ? `<a class="btn sm" href="#/${prev}">← ${esc(T(prev))}</a>` : "") + (next ? `<a class="btn sm" href="#/${next}">${esc(T(next))} →</a>` : "");
    if (ib && ib.kind === "boss" && cat === "bosses") {
      const hp = stat(s, "Health"), dmg = stat(s, "Damage"), atk = attacks(s);
      const i = BOSSES.indexOf(s), bp = BOSSES[i - 1], bn = BOSSES[i + 1];
      return heroShell(s, `<button class="portrait" data-src="${ib.image}" aria-label="${esc(p.title)}"><img src="${ib.image}" alt="${esc(p.title)}"></button>`,
        [hp && { v: hp, l: L.health, cls: "hp", count: parseInt(hp) }, dmg && { v: dmg, l: L.damage, cls: "dmg", count: parseInt(dmg) }].filter(Boolean),
        atk.length ? `<div><div class="eyebrow" style="margin-bottom:.5rem">${L.attacks}</div><div class="attacks">${atk.map(a => `<div class="attack"><b>${esc(a.name)}</b>${a.desc ? `<p>${esc(a.desc)}</p>` : ""}</div>`).join("")}</div></div>` : "",
        (P[s].bag ? `<a class="btn sm gold" href="#/${P[s].bag}">${sz(pix("loot"), 16)} ${L.bag}</a>` : "") + (bp ? `<a class="btn sm" href="#/${bp}">← ${esc(bossName(bp))}</a>` : "") + (bn ? `<a class="btn sm" href="#/${bn}">${esc(bossName(bn))} →</a>` : ""),
        TONES[s]);
    }
    if (/treasure-bag$/.test(s)) {
      const items = bagItems(s), boss = bossOfBag[s];
      const portrait = boss ? `<a class="portrait" href="#/${boss}" aria-label="${esc(bossName(boss))}"><img src="${P[boss].infobox.image}" alt=""><span class="bag-badge" style="color:${CAT_TONE.loot}">${pix("loot")}</span></a>`
        : `<div class="portrait emblem-portrait" style="color:${CAT_TONE.loot}">${pix("loot")}</div>`;
      return heroShell(s, portrait, [{ v: items.length, l: L.dropsLong, cls: "dmg", count: items.length }],
        `<div class="items hero-items">${items.map(x => `<span>${esc(x)}</span>`).join("")}</div>`,
        (boss ? `<a class="btn sm gold" href="#/${boss}">${L.droppedBy} ${esc(bossName(boss))}</a>` : "") + navBtns, boss ? TONES[boss] : toneBg(CAT_TONE.loot));
    }
    const stats = [{ v: minutes(s), l: L.minRead, count: minutes(s) }, { v: p.toc.length || "—", l: L.sections, cls: "dmg", count: p.toc.length }, { v: p.words.toLocaleString(settings.lang), l: L.words, cls: "hp" }];
    let extra = "", portrait;
    if (ib && ib.kind === "modpack") {
      const rows = ib.sections.flatMap(x => x.rows);
      extra = `<div class="facts">${rows.map(r => `<div><small>${esc(r.label)}</small><b>${esc(r.value)}</b></div>`).join("")}</div>`;
      portrait = ib.image ? `<button class="portrait wide" data-src="${ib.image}" aria-label="${esc(p.title)}"><img src="${ib.image}" alt=""></button>` : "";
    }
    if (!portrait) portrait = `<div class="portrait emblem-portrait" style="color:${col}">${pix(emb(s))}</div>`;
    return heroShell(s, portrait, stats, extra, navBtns, toneBg(col));
  }
  function renderArticle(slug, anchor) {
    const p = pg(slug), cat = P[slug].cat, catPages = (W.nav.find(c => c.id === cat) || { pages: [] }).pages;
    const idx = catPages.indexOf(slug), prev = catPages[idx - 1], next = catPages[idx + 1];
    const fromBoss = bossOfBag[slug];
    setTitle(p.title);
    const toc = p.toc.filter(t => t.level <= 4);
    app.innerHTML = `<div class="view article-layout">
      ${sideNav(slug)}
      <article class="article">
        <div class="crumbs"><a href="#/">${L.home}</a>${I.chev}<a href="#/c/${cat}">${esc(CM(cat).label)}</a></div>
        <h1 class="title">${esc(p.title)}</h1>
        <div class="article-meta">
          ${P[slug].tier ? `<span class="chip ${P[slug].tier}">${P[slug].tier === "pre" ? L.pre : L.hard}</span>` : `<span class="chip" style="color:${CAT_TONE[cat]}">${esc(CM(cat).label)}</span>`}
          ${read.has(slug) ? `<span class="chip read">${L.read}</span>` : ""}
          <a href="${original(slug)}" target="_blank" rel="noopener">${L.original} ${I.ext}</a>
        </div>
        ${pageHero(slug)}
        ${fromBoss ? "" : ""}
        <div class="prose" id="prose">${p.html}</div>
        <div class="pager">${prev ? `<a href="#/${prev}"><small>${L.prev}</small><b>${esc(T(prev))}</b></a>` : ""}${next ? `<a class="next" href="#/${next}"><small>${L.next}</small><b>${esc(T(next))}</b></a>` : ""}</div>
        <p class="source-note">${esc(L.source(P[slug].title)).replace(esc(P[slug].title), `<a href="${original(slug)}" target="_blank" rel="noopener">${esc(P[slug].title)}</a>`)}</p>
      </article>
      <aside class="rail">
        ${infoboxHtml(slug)}
        ${toc.length > 1 ? `<nav class="toc" aria-label="${L.onPage}"><span class="eyebrow">${L.onPage}</span><ol>${toc.map(t => `<li class="l${t.level}"><a href="#/${slug}/${t.id}" data-id="${t.id}">${esc(t.text)}</a></li>`).join("")}<span class="marker"></span></ol></nav>` : ""}
        <div class="card rail-card"><b>${L.wrongT}</b><p>${L.wrongP}</p><a class="btn sm" href="${original(slug)}" target="_blank" rel="noopener">${L.edit} ${I.ext}</a></div>
      </aside>
    </div>
    ${toc.length > 1 ? `<button class="toc-fab" id="tocFab" aria-label="${L.toc}">${I.list}<span>${L.toc}</span></button>` : ""}`;
    enhanceProse($("#prose"), slug);
    bindZoom(app);
    $$(".big-stat b[data-count]").forEach(b => b.dataset.count && !isNaN(+b.dataset.count) && +b.dataset.count > 0 && /^\d+$/.test(b.textContent) && FX.countUp(b, +b.dataset.count, { duration: 900 }));
    FX.stagger($$(".attack, .hero-items span"), { y: 8, step: 40 });
    if ($("#tocFab")) $("#tocFab").onclick = () => openTocSheet(slug, toc);
    startScrollWatch(slug, toc);
    if (anchor) requestAnimationFrame(() => scrollToId(anchor));
  }

  function enhanceProse(root, slug) {
    $$("h2[id], h3[id], h4[id]", root).forEach(h => {
      const b = document.createElement("button");
      b.className = "h-anchor"; b.setAttribute("aria-label", L.copied); b.innerHTML = I.link;
      b.onclick = () => {
        const url = location.href.split("#")[0] + "#/" + slug + "/" + h.id;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast(L.copied), () => toast(url));
        history.replaceState(null, "", "#/" + slug + "/" + h.id);
      };
      h.appendChild(b);
    });
    $$(".tabs", root).forEach(tabs => {
      const bar = $(".tabs-bar", tabs), btns = $$("button", bar), panels = $$(".tab-panel", tabs);
      const pill = document.createElement("span"); pill.className = "pill"; bar.prepend(pill);
      const place = b => { pill.style.left = b.offsetLeft + "px"; pill.style.width = b.offsetWidth + "px"; };
      btns.forEach((b, i) => b.addEventListener("click", () => {
        btns.forEach(x => x.setAttribute("aria-selected", String(x === b)));
        panels.forEach((p, j) => { p.hidden = j !== i; });
        place(b); b.scrollIntoView({ block: "nearest", inline: "nearest" });
        FX.stagger([panels[i]], { y: 6, duration: 300 });
      }));
      requestAnimationFrame(() => place(btns[0]));
    });
    $$(".table-wrap", root).forEach(wrap => {
      const t = $("table", wrap), all = $$("tr", t), rows = all.filter(r => r.querySelector("td"));
      const head = all.find(r => r.querySelector("th") && !r.querySelector("td"));
      const labels = head ? $$("th", head).map(th => th.textContent.trim()) : [];
      rows.forEach(r => $$("td", r).forEach((td, i) => { if (labels[i]) td.dataset.label = labels[i]; if (!td.textContent.trim() && !td.querySelector("img")) td.classList.add("empty"); }));
      if (head) head.classList.add("head-row");
      const cap = t.querySelector("caption"), title = cap ? cap.textContent.trim() : "";
      const collapsible = t.classList.contains("collapsed") || t.classList.contains("collapsible");
      const inner = document.createElement("div"); inner.className = "table-scroll"; t.replaceWith(inner); inner.appendChild(t);
      if (title || collapsible || rows.length > 8) {
        const bar = document.createElement("div"); bar.className = "table-bar";
        bar.innerHTML = `<span class="t">${esc(title || L.table)}<small>${rows.length} ${L.rows}</small></span>${rows.length > 8 ? `<input type="search" placeholder="${L.filter}" aria-label="${L.filter}">` : ""}${collapsible ? `<button class="toggle-rows" type="button"><span>${L.show}</span>${I.down}</button>` : ""}`;
        wrap.prepend(bar);
        const inp = $("input", bar);
        if (inp) inp.addEventListener("input", () => { const q = inp.value.toLowerCase().trim(); rows.forEach(r => { r.hidden = q && !r.textContent.toLowerCase().includes(q); }); });
        if (collapsible) {
          const tog = $(".toggle-rows", bar);
          if (t.classList.contains("collapsed")) wrap.classList.add("closed");
          const label = () => { $("span", tog).textContent = wrap.classList.contains("closed") ? L.show : L.hide; };
          tog.onclick = () => { const closed = wrap.classList.toggle("closed"); label(); if (!closed) FX.stagger(rows.slice(0, 20), { y: 6, step: 22, duration: 300 }); };
          label();
        }
      }
      if (t.classList.contains("sortable") && head) $$("th", head).forEach((th, ci) => {
        th.insertAdjacentHTML("beforeend", '<span class="sort">↕</span>');
        th.addEventListener("click", () => {
          const dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
          $$("th", head).forEach(x => { x.removeAttribute("aria-sort"); $(".sort", x).textContent = "↕"; });
          th.setAttribute("aria-sort", dir > 0 ? "ascending" : "descending"); $(".sort", th).textContent = dir > 0 ? "↑" : "↓";
          const val = r => (r.cells[ci] ? r.cells[ci].textContent.trim() : "");
          const sorted = rows.slice().sort((a, b) => { const x = val(a), y = val(b), nx = parseFloat(x), ny = parseFloat(y); return (!isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y)) * dir; });
          const body = rows[0].parentNode; sorted.forEach(r => body.appendChild(r));
        });
      });
    });
    $$(".video[data-yt]", root).forEach(v => {
      v.innerHTML = `<div class="play"><button aria-label="Play">${I.play}</button><small>${L.video}</small></div>`;
      $("button", v).onclick = () => { v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe>`; };
    });
    $$(":scope > h2, :scope > .table-wrap, :scope > blockquote.lore, :scope > .gallery, :scope > .tabs, :scope > figure, :scope > .boxes", root).forEach(el => el.classList.add("reveal"));
    watchReveal(root, el => { if (el.matches("blockquote.lore")) setTimeout(() => FX.sweep(el, { color: "rgba(245,184,61,.14)", duration: 1300 }), 200); });
  }

  /* ---------- scroll ---------- */
  let scrollHandler = null, readTimer = 0;
  function startScrollWatch(slug, toc) {
    const bar = $("#readProgress"), links = $$(".toc a[data-id]"), marker = $(".toc .marker"), fab = $("#tocFab");
    const heads = toc.map(t => document.getElementById(t.id)).filter(Boolean);
    let ticking = false, lastY = scrollY;
    const update = () => {
      ticking = false;
      const h = document.documentElement, max = h.scrollHeight - innerHeight;
      const k = max > 0 ? Math.min(1, scrollY / max) : 1;
      bar.style.transform = `scaleX(${k})`;
      if (k > .85 || max < 120) markRead(slug);
      if (fab) fab.classList.toggle("show", scrollY > 400);
      document.body.classList.toggle("scrolling-down", scrollY > lastY + 4 && scrollY > 200);
      if (scrollY < lastY - 4) document.body.classList.remove("scrolling-down");
      lastY = scrollY;
      if (links.length) {
        let active = heads[0];
        for (const el of heads) { if (el.getBoundingClientRect().top < innerHeight * .3) active = el; }
        links.forEach(a => a.classList.toggle("active", active && a.dataset.id === active.id));
        const a = links.find(x => x.classList.contains("active"));
        if (a && marker && a.offsetHeight) { marker.style.top = a.parentElement.offsetTop + "px"; marker.style.height = a.offsetHeight + "px"; marker.style.opacity = 1; }
      }
    };
    scrollHandler = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", scrollHandler, { passive: true });
    addEventListener("resize", scrollHandler);
    update();
    clearTimeout(readTimer);
    readTimer = setTimeout(() => { const max = document.documentElement.scrollHeight - innerHeight; if (max < innerHeight * .6) markRead(slug); }, 5000);
  }
  function stopScrollWatch() {
    if (scrollHandler) { removeEventListener("scroll", scrollHandler); removeEventListener("resize", scrollHandler); scrollHandler = null; }
    clearTimeout(readTimer);
    document.body.classList.remove("scrolling-down");
    $("#readProgress").style.transform = "scaleX(0)";
  }
  function watchReveal(root, onIn) {
    const els = $$(".reveal", root);
    if (!("IntersectionObserver" in window) || settings.fx === 0 || FX.reduced()) { els.forEach(e => e.classList.add("in")); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); onIn && onIn(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    els.forEach(e => io.observe(e));
  }

  /* ---------- lightbox ---------- */
  function bindZoom(root) {
    $$("img[data-zoom], button[data-src]", root).forEach(el => {
      if (el.dataset.bound) return; el.dataset.bound = 1;
      el.addEventListener("click", e => { e.preventDefault(); const src = el.dataset.src || el.getAttribute("src"); openLightbox(src, el.getAttribute("alt") || el.getAttribute("aria-label") || "", el.tagName === "IMG" ? el : $("img", el)); });
    });
  }
  function openLightbox(src, cap, from) {
    const lb = document.createElement("div"); lb.className = "lightbox overlay"; lb.setAttribute("role", "dialog");
    const pixel = from && from.naturalWidth && from.naturalWidth < 500;
    lb.innerHTML = `<img src="${src}" alt="${esc(cap)}" class="${pixel ? "pixel" : ""}">${cap ? `<div class="cap">${esc(cap)}</div>` : ""}<button class="icon-btn" aria-label="Close">${I.close}</button>`;
    document.body.appendChild(lb);
    const img = $("img", lb);
    if (from && FX.can("soft") && !FX.reduced()) requestAnimationFrame(() => {
      const a = from.getBoundingClientRect(), b = img.getBoundingClientRect(); if (!b.width) return;
      img.animate([{ transform: `translate(${a.left + a.width / 2 - (b.left + b.width / 2)}px,${a.top + a.height / 2 - (b.top + b.height / 2)}px) scale(${a.width / b.width})`, opacity: .6 }, { transform: "none", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
    lb.addEventListener("click", () => lb.remove());
  }

  /* ---------- search ---------- */
  const fold = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let INDEX = null, INDEX_LANG = null;
  function buildIndex() {
    INDEX_LANG = settings.lang;
    INDEX = ALL.concat(["home"]).map(s => { const p = pg(s); return { s, t: fold(p.title + " " + P[s].title), h: p.toc.map(x => fold(x.text)), x: fold(p.text + (settings.lang === "fr" ? " " + P[s].text : "")) }; });
  }
  function search(q) {
    if (INDEX_LANG !== settings.lang) buildIndex();
    q = fold(q).trim(); if (!q) return [];
    const words = q.split(/\s+/);
    return INDEX.map(e => {
      let sc = 0;
      for (const w of words) {
        let ok = false;
        if (e.t.includes(w)) { sc += e.t.startsWith(w) ? 30 : 18; ok = true; }
        if (e.h.some(h => h.includes(w))) { sc += 8; ok = true; }
        const c = e.x.split(w).length - 1; if (c) { sc += Math.min(10, c); ok = true; }
        if (!ok) return null;
      }
      return { s: e.s, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 14);
  }
  function snippet(s, q) {
    const txt = pg(s).text, w = fold(q).trim().split(/\s+/)[0], i = fold(txt).indexOf(w);
    if (i < 0) return esc(excerpt(s, 120));
    const a = Math.max(0, i - 50), part = txt.slice(a, a + 150);
    const fpart = fold(part), j = fpart.indexOf(w);
    const hl = j < 0 ? esc(part) : esc(part.slice(0, j)) + "<mark>" + esc(part.slice(j, j + w.length)) + "</mark>" + esc(part.slice(j + w.length));
    return (a ? "…" : "") + hl + "…";
  }
  function openSearch() {
    closeOverlays();
    const sc = document.createElement("div"); sc.className = "scrim overlay search-scrim";
    sc.innerHTML = `<div class="palette" role="dialog" aria-label="${L.search}"><div class="field">${I.search}<input type="search" enterkeyhint="go" placeholder="${esc(L.searchPh(TOTAL))}" aria-label="${L.search}" autocomplete="off"><button class="kbd-close" data-close aria-label="Close">${HOVER ? "<kbd>Esc</kbd>" : sz(I.close, 20)}</button></div><div class="results" role="listbox"></div>${HOVER ? `<div class="hint"><span>${L.hintMove}</span><span>${L.hintOpen}</span><span>${L.hintClose}</span></div>` : ""}</div>`;
    document.body.appendChild(sc);
    const inp = $("input", sc), res = $(".results", sc);
    let sel = 0;
    const catLabel = s => P[s].cat === "home" ? L.home : CM(P[s].cat).label;
    const draw = () => {
      const q = inp.value, r = search(q);
      if (!q.trim()) {
        const sug = ["getting-started", "boss-list", "weapon-progression", "mod-list", "iron-s-spells-and-spellbooks", "how-to-update-treasure-bags"];
        res.innerHTML = `<div class="grp">${L.popular}</div>` + sug.map(s => `<a class="res" href="#/${s}"><b>${esc(T(s))}</b><span class="c">${esc(catLabel(s))}</span></a>`).join("");
      } else if (!r.length) res.innerHTML = `<div class="empty">${esc(L.noRes(q))}</div>`;
      else res.innerHTML = r.map(x => `<a class="res" href="#/${x.s === "home" ? "" : x.s}"><b>${esc(T(x.s))}</b><span class="c">${esc(catLabel(x.s))}</span><small>${snippet(x.s, q)}</small></a>`).join("");
      sel = 0; mark();
    };
    const mark = () => { $$(".res", res).forEach((a, i) => a.classList.toggle("sel", i === sel)); const a = $$(".res", res)[sel]; a && HOVER && a.scrollIntoView({ block: "nearest" }); };
    inp.addEventListener("input", draw);
    inp.addEventListener("keydown", e => {
      const items = $$(".res", res);
      if (e.key === "ArrowDown") { sel = Math.min(items.length - 1, sel + 1); mark(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
      else if (e.key === "Enter" && items[sel]) { location.hash = items[sel].getAttribute("href"); closeOverlays(); }
    });
    sc.addEventListener("click", e => { if (e.target === sc || e.target.closest("[data-close]")) closeOverlays(); if (e.target.closest("a.res")) setTimeout(closeOverlays, 0); });
    draw(); inp.focus();
  }

  /* ---------- sheets ---------- */
  function seg(name, opts, val) {
    return `<div class="seg" data-name="${name}"><span class="pill"></span>${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(val)}">${l}</button>`).join("")}</div>`;
  }
  function placePills(root) { $$(".seg", root).forEach(s => { const b = $('button[aria-pressed="true"]', s), p = $(".pill", s); if (b) { p.style.left = b.offsetLeft + "px"; p.style.width = b.offsetWidth + "px"; } }); }
  function sheet(cls, label, inner) {
    closeOverlays();
    const sc = document.createElement("div"); sc.className = "scrim overlay sheet-scrim";
    sc.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-label="${esc(label)}"><div class="grab"></div><div class="sheet-head"><h2>${esc(label)}</h2><button class="icon-btn" data-close aria-label="Close">${I.close}</button></div>${inner}</div>`;
    document.body.appendChild(sc);
    sc.addEventListener("click", e => { if (e.target === sc || e.target.closest("[data-close]")) closeOverlays(); if (e.target.closest("a[href^='#']")) setTimeout(closeOverlays, 0); });
    // swipe down to close on touch
    const sh = $(".sheet", sc); let y0 = null;
    sh.addEventListener("touchstart", e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener("touchmove", e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sh.addEventListener("touchend", e => { if (y0 == null) return; const dy = (e.changedTouches[0].clientY - y0); y0 = null; if (dy > 90) closeOverlays(); else sh.style.transform = ""; });
    return sc;
  }
  function openSettings() {
    const sc = sheet("", L.settings, `
      <div class="set-row"><div><b>${L.lang}</b><small>${L.langS}</small></div>${seg("lang", [["fr", "Français"], ["en", "English"]], settings.lang)}</div>
      <div class="set-row"><div><b>${L.theme}</b><small>${L.themeS}</small></div>${seg("theme", [["dark", L.night], ["light", L.day], ["auto", L.auto]], settings.theme)}</div>
      <div class="set-row"><div><b>${L.font}</b><small>${L.fontS}</small></div>${seg("font", [["titles", L.fTitles], ["all", L.fAll]], settings.font)}</div>
      <div class="set-row"><div><b>${L.size}</b><small>${L.sizeS}</small></div>${seg("size", [["s", "S"], ["m", "M"], ["l", "L"]], settings.size)}</div>
      <div class="set-row"><div><b>${L.effects}</b><small>${L.effectsS}</small></div>${seg("fx", [[0, L.none], [1, L.soft], [2, L.full]], settings.fx)}</div>
      <div class="set-row"><div><b>${L.anim}</b><small>${L.animS}</small></div>${seg("motion", [["auto", L.auto], ["reduce", L.reduced], ["full", L.full]], settings.motion)}</div>
      <div class="actions"><button class="btn sm primary" id="tryFx">${L.tryFx}</button><button class="btn sm" id="resetRead">${L.reset}</button></div>`);
    requestAnimationFrame(() => placePills(sc));
    $$(".seg", sc).forEach(s => s.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const name = s.dataset.name; let v = b.dataset.v; if (name === "fx") v = +v;
      if (name === "lang") { setLang(v); return; }
      settings[name] = v; applySettings();
      $$("button", s).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      placePills(sc);
    }));
    $("#tryFx").onclick = e => { FX.ripple(e.currentTarget, e.clientX, e.clientY, "rgba(255,255,255,.35)"); FX.burst(e.currentTarget, { colors: ["#9479ff", "#f5b83d", "#5ad1a8"] }); FX.achievement(L.badge + " · Preview", L.preview, { color: "#f5b83d" }); FX.confetti({ count: 90 }); };
    $("#resetRead").onclick = () => { if (!confirm(L.resetQ)) return; read.clear(); earned.clear(); store.set("lgw.read", []); store.set("lgw.badges", []); updateJourney(true); toast(L.resetDone); };
  }
  function openJourney() {
    const n = ALL.filter(s => read.has(s)).length, r = 60;
    const sc = sheet("journey-sheet", L.journey, `
      <p style="color:var(--text-2);margin:.2rem 0 0;font-size:.9rem">${L.journeyP}</p>
      <div class="ring-big"><svg viewBox="0 0 140 140"><defs><linearGradient id="jg" x1="0" x2="1"><stop offset="0" stop-color="#9479ff"/><stop offset="1" stop-color="#f5b83d"/></linearGradient></defs><circle class="track" cx="70" cy="70" r="${r}" fill="none" stroke-width="10"/><circle class="fill" id="bigRing" cx="70" cy="70" r="${r}" fill="none" stroke-width="10"/></svg><div><b id="bigN">${n}</b><small>${L.ofPages(TOTAL)}</small></div></div>
      <div class="cat-progress">${W.nav.map(cc => { const d = cc.pages.filter(s => read.has(s)).length; return `<div><span style="color:var(--text);text-align:left">${esc(CM(cc.id).label)}</span><span class="bar"><i style="width:${(d / cc.pages.length) * 100}%"></i></span><span>${d}/${cc.pages.length}</span></div>`; }).join("")}</div>
      <div class="badges">${BADGES.map(b => `<span class="chip ${earned.has(b.id) ? "gold" : "off"}" title="${esc(lg(b.sub))}">${earned.has(b.id) ? "★" : "☆"} ${esc(lg(b.name))}</span>`).join("")}</div>
      <div class="actions"><a class="btn sm primary" href="#/${ALL.find(s => !read.has(s)) || ""}">${n < TOTAL ? L.unread : L.backHome}</a></div>`);
    FX.ringTo($("#bigRing", sc), (n / TOTAL) * 100);
    FX.countUp($("#bigN", sc), n, { duration: 900 });
    FX.fillBars($$(".cat-progress .bar i", sc));
    FX.stagger($$(".badges .chip", sc), { y: 6, step: 50 });
  }
  function openTocSheet(slug, toc) {
    const active = $(".toc a.active");
    sheet("toc-sheet", L.onPage, `<ol class="toc-list">${toc.map(t => `<li class="l${t.level}"><a href="#/${slug}/${t.id}" class="${active && active.dataset.id === t.id ? "active" : ""}">${esc(t.text)}</a></li>`).join("")}</ol>`);
  }
  function openDrawer() {
    const { a } = parseHash();
    const sc = sheet("drawer-sheet", L.menu, `<div class="quick">${W.nav.map(c => `<a href="#/c/${c.id}"><span class="sn-emb" style="color:${CAT_TONE[c.id]}">${pix(c.id)}</span>${esc(CM(c.id).label)}<small>${c.pages.length}</small></a>`).join("")}<a href="#/media"><span class="sn-emb" style="color:${CAT_TONE.media}">${pix("media")}</span>${L.allFiles}</a></div>${sideNav(P[a] ? a : "")}`);
  }
  function closeOverlays() { $$(".overlay").forEach(o => o.remove()); }
  function toast(t) { $$(".toast").forEach(x => x.remove()); const el = document.createElement("div"); el.className = "toast"; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2200); }

  function setLang(v) {
    settings.lang = v; applySettings();
    ensureLang().then(() => { drawChrome(); route(true); });
  }

  /* ---------- global events ---------- */
  $("#searchBtn").onclick = openSearch;
  $("#settingsBtn").onclick = openSettings;
  $("#journeyBtn").onclick = openJourney;
  $("#langBtn").onclick = () => setLang(settings.lang === "fr" ? "en" : "fr");
  document.addEventListener("click", e => { if (e.target.closest("[data-lang-toggle]")) setLang(settings.lang === "fr" ? "en" : "fr"); });
  document.addEventListener("keydown", e => {
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName))) { e.preventDefault(); openSearch(); }
    else if (e.key === "Escape") closeOverlays();
  });
  document.addEventListener("pointerdown", e => {
    const t = e.target.closest(".btn, .path-link, .tile, .connect a, .pager a, .tabbar [data-tab]");
    if (t) FX.ripple(t, e.clientX, e.clientY, "rgba(148,121,255,.22)");
  });

  ensureLang().then(() => { drawChrome(); updateJourney(); route(); });
  if ("serviceWorker" in navigator && location.protocol === "https:") addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
})();
