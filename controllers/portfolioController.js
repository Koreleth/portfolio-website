let store = require('../models/store');

/**
 * Macht aus einem Titel einen URL-Namen, z. B. "Café Eisberg" -> "cafe-eisberg".
 * @param {string} text
 * @returns {string}
 */
const slugify = (text) => String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Tool-IDs eines Projekts (z. B. "photoshop") in Name + Icon auflösen
const withTools = (portfolio, tools) => ({
    ...portfolio,
    tools: (portfolio.tools || []).map(id => tools.find(tool => tool.id === id)).filter(Boolean)
});

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

const getSinglePortfolio = (catSlug, slug) => {
    // Das Projekt muss zur angefragten Kategorie gehören
    const categorieEntry = store.read('categorie').find(element => element.slug === catSlug);
    const portfolio = categorieEntry && store.read('portfoliowork').find(element => {
        return element.slug === slug && element.categoryID === parseInt(categorieEntry.id);
    });
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }

    return { status: 200, data: { ...withTools(portfolio, store.read('tools')), categorie: categorieEntry } };
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
    return { status: 200, data: portfolio };
};

/**
 * Prüft die Formulardaten und baut daraus die Felder eines Projekts.
 * @param {Object} input - title, slug, categoryID, description, text, tools, image
 * @param {Array} portfolios - alle vorhandenen Projekte
 * @param {Object|null} current - das bearbeitete Projekt (null beim Anlegen)
 * @returns {Object} - { values } oder { error }
 */
const validatePortfolio = (input, portfolios, current) => {
    const title = String(input.title || '').trim();
    const description = String(input.description || '').trim();
    const text = String(input.text || '').trim();
    const categoryID = parseInt(input.categoryID);
    const categorie = store.read('categorie').find(element => parseInt(element.id) === categoryID);
    const knownTools = store.read('tools').map(tool => tool.id);
    const tools = [].concat(input.tools || []).filter(id => knownTools.includes(id));
    const images = input.image ? [input.image] : (current ? current.images : []);

    if (!title) return { error: 'Bitte gib einen Titel ein.' };
    if (!categorie) return { error: 'Bitte wähle eine Kategorie.' };
    if (!description) return { error: 'Bitte gib eine Kurzbeschreibung ein (sie steht auf der Projektkarte).' };
    if (images.length === 0) return { error: 'Bitte lade ein Bild für das Projekt hoch.' };

    const baseSlug = slugify(input.slug || title);
    if (!baseSlug) return { error: 'Der URL-Name braucht mindestens einen Buchstaben oder eine Zahl.' };

    // Der URL-Name muss innerhalb der Kategorie eindeutig sein
    const taken = (candidate) => portfolios.some(element =>
        element.id !== (current && current.id) && element.categoryID === categoryID && element.slug === candidate);
    let slug = baseSlug;
    for (let n = 2; taken(slug); n++) {
        slug = baseSlug + '-' + n;
    }

    return { values: { title, description, text, images, categoryID, slug, tools } };
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

    portfolios[index] = { ...portfolios[index], ...result.values };
    store.write('portfoliowork', portfolios);
    return { status: 200, data: portfolios[index] };
};

const deletePortfolio = (id) => {
    const portfolios = store.read('portfoliowork');
    const portfolio = portfolios.find(element => element.id === parseInt(id));
    if (!portfolio) {
        return { status: 404, data: "Portfolio not found" };
    }

    store.write('portfoliowork', portfolios.filter(element => element !== portfolio));
    return { status: 200, data: portfolio };
};

module.exports = {
    slugify,
    getPortfolioByCategorie,
    getSinglePortfolio,
    getPortfoliosForAdmin,
    getPortfolioById,
    createPortfolio,
    updatePortfolio,
    deletePortfolio
}
