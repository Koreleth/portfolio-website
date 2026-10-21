let store = require('../models/store');

const getPortfolioData = () => {
    return { status: 200, data: store.read('portfoliowork') };
}

const getPortfolioByCategorie = (slug) => {
    const categorieEntry = store.read('categorie').find(element => element.slug === slug);
    if (!categorieEntry) {
        return { status: 404, data: "Categorie not found" };
    }

    // Eine Kategorie ohne Projekte ist kein Fehler, sondern liefert eine leere Liste
    const filteredPortfolios = store.read('portfoliowork').filter(element => {
        return element.categoryID === parseInt(categorieEntry.id);
    });

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

    return { status: 200, data: { ...portfolio, categorie: categorieEntry } };
};

module.exports = {
    getPortfolioData,
    getPortfolioByCategorie,
    getSinglePortfolio
}
