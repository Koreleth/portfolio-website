let store = require('../models/store');
let { slugify, uniqueSlug } = require('../utils/slugify');
let { removeUnusedUploads } = require('../utils/uploads');

const getCategorieData = () => {
    return { status: 200, data: store.read('categorie') };
}

// Die Startseite zeigt drei Kategorien: zuerst die mit „Auf der Startseite zeigen“ (featured), dann die übrigen in ihrer Reihenfolge
const HOME_COUNT = 3;
const pickHomeCategories = (categories) =>
    [...categories.filter(categorie => categorie.featured), ...categories.filter(categorie => !categorie.featured)].slice(0, HOME_COUNT);

const countProjects = (portfolios, categorie) =>
    portfolios.filter(portfolio => portfolio.categoryID === parseInt(categorie.id)).length;

// Kategorien der Startseite mit der Anzahl ihrer Projekte
const getHomeCategories = () => {
    const portfolios = store.read('portfoliowork');
    const categories = pickHomeCategories(store.read('categorie')).map(categorie => ({
        ...categorie,
        projectCount: countProjects(portfolios, categorie)
    }));
    return { status: 200, data: categories };
}

/* ---------- Admin: Kategorien verwalten ---------- */

// Alle Kategorien mit der Anzahl ihrer Projekte und ob sie auf der Startseite stehen (für die Admin-Übersicht)
const getCategoriesForAdmin = () => {
    const portfolios = store.read('portfoliowork');
    const all = store.read('categorie');
    const onHome = pickHomeCategories(all);
    const categories = all.map(categorie => ({
        ...categorie,
        projectCount: countProjects(portfolios, categorie),
        onHome: onHome.includes(categorie)
    }));
    return { status: 200, data: categories };
}

const getCategorieById = (id) => {
    const categorie = store.read('categorie').find(element => parseInt(element.id) === parseInt(id));
    if (!categorie) {
        return { status: 404, data: "Categorie not found" };
    }
    return { status: 200, data: categorie };
}

/**
 * Prüft die Formulardaten einer Kategorie.
 * @param {Object} input - name, slug, description, image (neu hochgeladenes Bild), featured ('1' = auf der Startseite zeigen)
 * @param {Array} categories - alle vorhandenen Kategorien
 * @param {Object|null} current - die bearbeitete Kategorie (null beim Anlegen)
 * @returns {Object} - { values } oder { error }
 */
const validateCategorie = (input, categories, current) => {
    const name = String(input.name || '').trim();
    const description = String(input.description || '').trim();
    const image = input.image || ((current && current.images) || [])[0];

    if (!name) return { error: 'Bitte gib einen Namen ein.' };
    if (!description) return { error: 'Bitte gib eine Kurzbeschreibung ein (sie steht auf der Kachel).' };
    if (!image) return { error: 'Bitte wähle ein Bild für die Kachel aus.' };

    const baseSlug = slugify(input.slug || name);
    if (!baseSlug) return { error: 'Der URL-Name braucht mindestens einen Buchstaben oder eine Zahl.' };

    const slug = uniqueSlug(baseSlug, candidate => categories.some(element =>
        element !== current && element.slug === candidate));

    return { values: { type: 'categorie', name, description, images: [image], slug, featured: input.featured === '1' } };
}

const createCategorie = (input) => {
    const categories = store.read('categorie');
    const result = validateCategorie(input, categories, null);
    if (result.error) {
        return { status: 400, data: result.error };
    }

    const id = categories.reduce((max, element) => Math.max(max, parseInt(element.id)), 0) + 1;
    const categorie = { id, ...result.values };
    categories.push(categorie);
    store.write('categorie', categories);
    return { status: 201, data: categorie };
}

const updateCategorie = (id, input) => {
    const categories = store.read('categorie');
    const index = categories.findIndex(element => parseInt(element.id) === parseInt(id));
    if (index === -1) {
        return { status: 404, data: "Categorie not found" };
    }

    const result = validateCategorie(input, categories, categories[index]);
    if (result.error) {
        return { status: 400, data: result.error };
    }

    const previous = categories[index];
    categories[index] = { ...previous, ...result.values };
    store.write('categorie', categories);
    removeUnusedUploads(previous.images || []);
    return { status: 200, data: categories[index] };
}

// Löschen nur, wenn keine Projekte mehr in der Kategorie stecken
const deleteCategorie = (id) => {
    const categories = store.read('categorie');
    const categorie = categories.find(element => parseInt(element.id) === parseInt(id));
    if (!categorie) {
        return { status: 404, data: "Categorie not found" };
    }

    const projectCount = store.read('portfoliowork').filter(portfolio => portfolio.categoryID === parseInt(categorie.id)).length;
    if (projectCount > 0) {
        return { status: 409, data: 'Die Kategorie enthält noch ' + projectCount + ' Projekt(e). Verschiebe oder lösche sie zuerst.' };
    }

    store.write('categorie', categories.filter(element => element !== categorie));
    removeUnusedUploads(categorie.images || []);
    return { status: 200, data: categorie };
}

module.exports = {
    getCategorieData,
    getHomeCategories,
    getCategoriesForAdmin,
    getCategorieById,
    createCategorie,
    updateCategorie,
    deleteCategorie
}
