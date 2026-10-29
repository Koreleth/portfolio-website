let store = require('../models/store');
let { slugify, uniqueSlug } = require('../utils/slugify');
let { isImagePath, collectImages, removeUnusedUploads } = require('../utils/uploads');

/*
 * Aufbau eines Projekts in models/portfoliowork.json:
 *   images:    [Titelbild, zweites Bild (optional)]
 *   coverFit:  'cover' = das Titelbild füllt oben die ganze Breite, 'contain' = es steht ganz da (z. B. Logos)
 *   textTitle: Überschrift über dem Projekttext neben dem zweiten Bild (leer = Titel des Projekts)
 *   sections: beliebig viele Abschnitte untereinander. Jeder Abschnitt hat ein Spalten-Layout
 *             und pro Spalte beliebig viele Bausteine untereinander; divider = Trennstrich darüber
 *             (vor dem ersten Abschnitt steht immer einer):
 *     { layout: '2-1', valign: 'center', divider: false, columns: [[baustein, …], [baustein, …]] }
 *   Bausteine:
 *     { type: 'title', text }                  – Zwischenüberschrift
 *     { type: 'text', text }                   – Fließtext (Leerzeile = neuer Absatz, „- “ = Aufzählung)
 *     { type: 'image', images: [bild], fit, focus, caption }
 *                                              – focus [x, y] in Prozent: der gezeigte Ausschnitt bei „Füllen“
 *     { type: 'carousel', images: [...], fit, caption }
 *                                              – fit 'contain' = Bild ganz zeigen statt aufs Format zuschneiden
 *     { type: 'code', text, file, caption }    – Codesample, nur angezeigt; die Endung von file bestimmt die Farben
 *     { type: 'compare', images: [vorher, nachher], labels: [links, rechts], caption }
 *                                              – Vorher/Nachher mit Regler; ein noch fehlendes Bild ist null
 *     { type: 'demo', url, format, caption }  – Live-Demo: Website oder Spiel zum Ausprobieren (format '16-9', '4-3', '1-1')
 *     { type: 'youtube', video, start, format, caption }
 *                                              – YouTube-Video: video = ID, start = Sekunden, format '9-16' bei Shorts
 *   Abspann nach den Abschnitten (alles leer = der Bereich wird nicht angezeigt):
 *   thanks:      freier Text oben ohne Überschrift, z. B. eine Danksagung
 *   credits:     Mitwirkende wie im Filmabspann, [{ role, name }] – die Rolle darf fehlen; mehrere Zeilen
 *                mit derselben Rolle hintereinander stehen auf der Seite unter einer Rolle
 *   (ältere Projekte haben stattdessen contributors als Text und contributorsText, siehe normalizeCredits)
 */
const BLOCK_TYPES = ['title', 'text', 'image', 'carousel', 'code', 'compare', 'demo', 'youtube'];
const DEMO_FORMATS = ['16-9', '4-3', '1-1'];

// Adresse einer Live-Demo: nur http(s); ohne Angabe wird https:// ergänzt (z. B. „koreleth.github.io/spiel“)
const toDemoUrl = (value) => {
    const text = String(value || '').trim();
    if (!text) return null;
    try {
        const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : 'https://' + text);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch (err) {
        return null;
    }
};

// Startzeit aus einer YouTube-Adresse (t=90, t=90s oder t=1m30s) in Sekunden
const toSeconds = (value) => {
    const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(String(value || '').trim());
    return match ? (parseInt(match[1] || 0) * 3600) + (parseInt(match[2] || 0) * 60) + parseInt(match[3] || 0) : 0;
};

// YouTube-Video aus einer Adresse: youtube.com/watch?v=…, youtu.be/…, /shorts/…, /embed/…, /live/… oder nur die ID.
// Shorts sind hochkant (format '9-16'); keine YouTube-Adresse = null
const toYouTube = (value) => {
    const text = String(value || '').trim();
    const isId = (id) => /^[\w-]{11}$/.test(id || '');
    if (isId(text)) return { video: text, start: 0, format: '16-9' };
    let url;
    try {
        url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : 'https://' + text);
    } catch (err) {
        return null;
    }
    const host = url.hostname.replace(/^(www|m|music)\./, '');
    const [kind, id] = url.pathname.split('/').filter(Boolean);
    let video = null;
    if (host === 'youtu.be') {
        video = kind;
    } else if (['youtube.com', 'youtube-nocookie.com'].includes(host)) {
        video = kind === 'watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live', 'v'].includes(kind) ? id : null;
    }
    if (!isId(video)) return null;
    return {
        video,
        start: toSeconds(url.searchParams.get('t') || url.searchParams.get('start')),
        format: kind === 'shorts' ? '9-16' : '16-9'
    };
};

// Spalten-Layouts im Drittel-Raster und ihre Spaltenanzahl, z. B. '2-1' = ⅔ + ⅓
const LAYOUTS = { '1': 1, '2-1': 2, '1-2': 2, '1-1-1': 3 };

// Gültiges Layout; das frühere halb/halb ('1-1') passt nicht ins Raster und wird zu ⅔ + ⅓ (beide Spalten bleiben)
const toLayout = (layout) => layout === '1-1' ? '2-1' : (LAYOUTS[layout] ? layout : '1');

/**
 * Bringt Abschnitte aus älteren Formaten in das Spalten-Format:
 * - einzelne Bausteine hintereinander -> ein einspaltiger Abschnitt
 * - { title, text, images } -> Text links (⅔), Bild/Karussell rechts (⅓) – oder einspaltig, wenn eins fehlt
 */
const normalizeSections = (sections) => {
    const result = [];
    let loose = null;
    (sections || []).forEach(section => {
        if (Array.isArray(section.columns)) {
            loose = null;
            result.push({ ...section, layout: toLayout(section.layout) });
            return;
        }
        if (BLOCK_TYPES.includes(section.type)) {
            if (!loose) {
                loose = { layout: '1', valign: 'top', columns: [[]] };
                result.push(loose);
            }
            loose.columns[0].push(section);
            return;
        }
        loose = null;
        const textBlocks = [];
        if (section.title) textBlocks.push({ type: 'title', text: section.title });
        if (section.text) textBlocks.push({ type: 'text', text: section.text });
        const images = section.images || [];
        const media = images.length === 0 ? [] : [{ type: images.length > 1 ? 'carousel' : 'image', images, caption: '' }];
        if (textBlocks.length > 0 && media.length > 0) {
            result.push({ layout: '2-1', valign: 'center', columns: [textBlocks, media] });
        } else if (textBlocks.length + media.length > 0) {
            result.push({ layout: '1', valign: 'top', columns: [[...textBlocks, ...media]] });
        }
    });
    return result;
};

// Ausschnitt eines zugeschnittenen Bildes aus „x,y“ (Prozent); die Mitte (Standard) wird nicht gespeichert
const toFocus = (value) => {
    const [x, y] = String(value || '').split(/[ ,]+/).map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
    const focus = [x, y].map(n => Math.round(Math.min(100, Math.max(0, n))));
    return focus[0] === 50 && focus[1] === 50 ? undefined : focus;
};

// Einen Baustein prüfen; leere Bausteine (ohne Text bzw. ohne Bilder) fallen weg
const cleanBlock = (block) => {
    const text = String(block.text || '').replace(/\r\n/g, '\n').trim();
    const caption = String(block.caption || '').trim();
    const images = [].concat(block.images || []).filter(isImagePath);
    const fit = block.fit === 'contain' ? 'contain' : 'cover';
    switch (block.type) {
        case 'title':
        case 'text':
            return text ? { type: block.type, text } : null;
        case 'image':
            return images.length > 0 ? { type: 'image', images: images.slice(0, 1), fit, focus: fit === 'cover' ? toFocus(block.focus) : undefined, caption } : null;
        case 'carousel':
            return images.length > 0 ? { type: 'carousel', images, fit, caption } : null;
        case 'code': {
            // Code behält seine Einrückung: nur leere Zeilen am Anfang und Leerraum am Ende fallen weg
            const code = String(block.text || '').replace(/\r\n/g, '\n').replace(/^(?:[ \t]*\n)+/, '').trimEnd();
            const file = String(block.file || '').trim().slice(0, 60);
            return code ? { type: 'code', text: code, file, caption } : null;
        }
        case 'compare': {
            // Die Position zählt (links vorher, rechts nachher); bleibt so lange erhalten, wie eins der Bilder da ist
            const pair = [0, 1].map(index => isImagePath((block.images || [])[index]) ? block.images[index] : null);
            const labels = [0, 1].map(index => String((block.labels || [])[index] || '').trim().slice(0, 40));
            return pair.some(Boolean) ? { type: 'compare', images: pair, labels, caption } : null;
        }
        case 'demo': {
            const url = toDemoUrl(block.url);
            const format = DEMO_FORMATS.includes(block.format) ? block.format : '16-9';
            return url ? { type: 'demo', url, format, caption } : null;
        }
        case 'youtube': {
            const video = toYouTube(block.url);
            return video ? { type: 'youtube', ...video, caption } : null;
        }
        default:
            return null;
    }
};

// Abschnitte prüfen: gültiges Layout, passende Spaltenanzahl; Abschnitte ganz ohne Inhalt fallen weg
const cleanSections = (sections) => (sections || [])
    .map(section => {
        const layout = toLayout(section.layout);
        const columns = Array.from({ length: LAYOUTS[layout] }, (_, index) =>
            ((section.columns || [])[index] || []).map(cleanBlock).filter(Boolean));
        return { layout, valign: section.valign === 'center' ? 'center' : 'top', divider: Boolean(section.divider), columns };
    })
    .filter(section => section.columns.some(column => column.length > 0));

// Tool-IDs eines Projekts (z. B. "photoshop") in Name + Icon auflösen
const withTools = (portfolio, tools) => ({
    ...portfolio,
    tools: (portfolio.tools || []).map(id => tools.find(tool => tool.id === id)).filter(Boolean)
});

// Alle Bilder eines Projekts (für das Aufräumen alter Uploads)
const allImages = (portfolio) => [
    ...(portfolio.images || []),
    ...collectImages(portfolio.sections || [])
];

const getPortfolioByCategorie = (slug) => {
    const categorieEntry = store.read('categorie').find(element => element.slug === slug);
    if (!categorieEntry) {
        return { status: 404, data: "Categorie not found" };
    }

    // Eine Kategorie ohne Projekte ist kein Fehler, sondern liefert eine leere Liste
    const tools = store.read('tools');
    const filteredPortfolios = store.read('portfoliowork')
        .filter(element => element.categoryID === parseInt(categorieEntry.id))
        .map(element => withTools(element, tools));

    return { status: 200, data: { categorie: categorieEntry, portfolios: filteredPortfolios } };
};

/**
 * Abspann eines Projekts im aktuellen Aufbau. Ältere Projekte haben contributors als Text: eine Zeile pro
 * Person als „Rolle: Name“ oder „Name – Rolle“; Zeilen ohne Rolle gehören zur Rolle davor. contributorsText
 * war die Danksagung. Gespeichert wird beim nächsten Speichern im neuen Aufbau.
 */
const normalizeCredits = (portfolio) => {
    if (Array.isArray(portfolio.credits)) {
        return { credits: portfolio.credits, thanks: portfolio.thanks || '' };
    }
    let role = '';
    const credits = String(portfolio.contributors || '').split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const colon = line.indexOf(':');
            if (colon > 0) {
                role = line.slice(0, colon).trim();
                return { role, name: line.slice(colon + 1).trim() };
            }
            const dash = /^(.+?)\s+[-–—]\s+(.+)$/.exec(line);
            if (dash) {
                role = dash[2].trim();
                return { role, name: dash[1].trim() };
            }
            return { role, name: line };
        })
        .filter(credit => credit.name);
    return { credits, thanks: portfolio.thanks || portfolio.contributorsText || '' };
};

// Abspann prüfen: Zeilen ohne Namen fallen weg
const cleanCredits = (credits) => (credits || [])
    .map(credit => ({
        role: String(credit.role || '').trim().slice(0, 80),
        name: String(credit.name || '').trim().slice(0, 120)
    }))
    .filter(credit => credit.name);

const getSinglePortfolio = (catSlug, slug) => {
    // Das Projekt muss zur angefragten Kategorie gehören
    const categorieEntry = store.read('categorie').find(element => element.slug === catSlug);
    const portfolio = categorieEntry && store.read('portfoliowork').find(element => {
        return element.slug === slug && element.categoryID === parseInt(categorieEntry.id);
    });
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }

    return { status: 200, data: { ...withTools(portfolio, store.read('tools')), sections: normalizeSections(portfolio.sections), ...normalizeCredits(portfolio), categorie: categorieEntry } };
};

/**
 * Weitere Projekte für das Seitenende: die nächsten (höchstens count) in der Reihenfolge der Portfolio-Übersicht
 * (Kategorie für Kategorie), am Ende geht es vorne weiter; das Projekt selbst ist nie dabei.
 * @returns {Array} - je { title, image, coverFit, categorie, url }
 */
const getMoreProjects = (id, count = 3) => {
    const portfolios = store.read('portfoliowork');
    const ordered = store.read('categorie').flatMap(categorie => portfolios
        .filter(portfolio => portfolio.categoryID === parseInt(categorie.id))
        .map(portfolio => ({ portfolio, categorie })));
    const index = ordered.findIndex(entry => entry.portfolio.id === id);
    if (index === -1) {
        return [];
    }
    return Array.from({ length: Math.min(count, ordered.length - 1) }, (_, offset) => {
        const { portfolio, categorie } = ordered[(index + offset + 1) % ordered.length];
        return {
            title: portfolio.title,
            image: portfolio.images[0],
            coverFit: portfolio.coverFit === 'contain' ? 'contain' : 'cover',
            categorie: categorie.name,
            url: '/portfolio/' + categorie.slug + '/' + portfolio.slug
        };
    });
};

/* ---------- Admin: Projekte verwalten ---------- */

// Alle Projekte mit ihrer Kategorie (für die Admin-Übersicht)
const getPortfoliosForAdmin = () => {
    const categories = store.read('categorie');
    const portfolios = store.read('portfoliowork').map(element => ({
        ...element,
        categorie: categories.find(categorie => parseInt(categorie.id) === element.categoryID)
    }));
    return { status: 200, data: portfolios };
};

const getPortfolioById = (id) => {
    const portfolio = store.read('portfoliowork').find(element => element.id === parseInt(id));
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }
    return { status: 200, data: { ...portfolio, sections: normalizeSections(portfolio.sections), ...normalizeCredits(portfolio) } };
};

/**
 * Prüft die Formulardaten und baut daraus die Felder eines Projekts.
 * @param {Object} input - title, slug, categoryID, description, text, tools,
 *                         cover / second (neu hochgeladene Bilder), removeSecond, sections,
 *                         thanks (Danksagung), credits ([{ role, name }])
 * @param {Array} portfolios - alle vorhandenen Projekte
 * @param {Object|null} current - das bearbeitete Projekt (null beim Anlegen)
 * @returns {Object} - { values } oder { error }
 */
const validatePortfolio = (input, portfolios, current) => {
    const title = String(input.title || '').trim();
    const description = String(input.description || '').trim();
    const text = String(input.text || '').trim();
    const textTitle = String(input.textTitle || '').trim();
    const coverFit = input.coverFit === 'contain' ? 'contain' : 'cover';
    const thanks = String(input.thanks || '').replace(/\r\n/g, '\n').trim();
    const credits = cleanCredits(input.credits);
    const categoryID = parseInt(input.categoryID);
    const categorie = store.read('categorie').find(element => parseInt(element.id) === categoryID);
    const knownTools = store.read('tools').map(tool => tool.id);
    const tools = [].concat(input.tools || []).filter(id => knownTools.includes(id));

    // Titelbild und zweites Bild: neu hochgeladen oder vom bisherigen Stand übernommen
    const currentImages = (current && current.images) || [];
    const cover = input.cover || currentImages[0];
    const second = input.second || (input.removeSecond ? null : currentImages[1]);

    const sections = cleanSections(input.sections);

    if (!title) return { error: 'Bitte gib einen Titel ein.' };
    if (!categorie) return { error: 'Bitte wähle eine Kategorie.' };
    if (!description) return { error: 'Bitte gib eine Kurzbeschreibung ein (sie steht auf der Projektkarte).' };
    if (!cover) return { error: 'Bitte wähle ein Titelbild aus.' };

    const baseSlug = slugify(input.slug || title);
    if (!baseSlug) return { error: 'Der URL-Name braucht mindestens einen Buchstaben oder eine Zahl.' };

    // Der URL-Name muss innerhalb der Kategorie eindeutig sein
    const slug = uniqueSlug(baseSlug, candidate => portfolios.some(element =>
        element.id !== (current && current.id) && element.categoryID === categoryID && element.slug === candidate));

    return { values: { title, description, textTitle, text, images: [cover, second].filter(Boolean), coverFit, categoryID, slug, tools, sections, thanks, credits } };
};

const createPortfolio = (input) => {
    const portfolios = store.read('portfoliowork');
    const result = validatePortfolio(input, portfolios, null);
    if (result.error) {
        return { status: 400, data: result.error };
    }

    const id = portfolios.reduce((max, element) => Math.max(max, element.id), 0) + 1;
    const portfolio = { id, ...result.values };
    portfolios.push(portfolio);
    store.write('portfoliowork', portfolios);
    return { status: 201, data: portfolio };
};

const updatePortfolio = (id, input) => {
    const portfolios = store.read('portfoliowork');
    const index = portfolios.findIndex(element => element.id === parseInt(id));
    if (index === -1) {
        return { status: 404, data: "Portfolio not found" };
    }

    const result = validatePortfolio(input, portfolios, portfolios[index]);
    if (result.error) {
        return { status: 400, data: result.error };
    }

    const previous = portfolios[index];
    portfolios[index] = { ...previous, ...result.values };
    // Der Abspann steht jetzt in thanks und credits (früher contributors und contributorsText)
    delete portfolios[index].contributors;
    delete portfolios[index].contributorsText;
    // Die Danksagung hat keine eigene Überschrift mehr
    delete portfolios[index].thanksTitle;
    store.write('portfoliowork', portfolios);
    // Ersetzte oder entfernte Bilder löschen, sofern sie nirgends mehr verwendet werden
    removeUnusedUploads(allImages(previous));
    return { status: 200, data: portfolios[index] };
};

const deletePortfolio = (id) => {
    const portfolios = store.read('portfoliowork');
    const portfolio = portfolios.find(element => element.id === parseInt(id));
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }

    store.write('portfoliowork', portfolios.filter(element => element !== portfolio));
    removeUnusedUploads(allImages(portfolio));
    return { status: 200, data: portfolio };
};

module.exports = {
    LAYOUTS,
    toLayout,
    getPortfolioByCategorie,
    getSinglePortfolio,
    getMoreProjects,
    getPortfoliosForAdmin,
    getPortfolioById,
    createPortfolio,
    updatePortfolio,
    deletePortfolio
}
